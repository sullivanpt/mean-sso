/**
 * Module dependencies.
 */
var passport = require('passport'),
  oauth2orize = require('oauth2orize'),
  models = require('./models'),
  User = models.model('User'),
  clients = models.model('Client'),
  accessTokens = models.model('AccessToken'),
  refreshTokens = models.model('RefreshToken'),
  authorizationCodes = models.model('AuthorizationCode'),
  config = require('./config'),
  uid = require('../helpers/uid'),
  querystring = require('querystring');


// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

/**
 * generic authorization code grant
 */
function _issueAuthorizationCode(client, redirectURI, user, ares, done) {
  var code = uid.uid(config.token.authorizationCodeLength);
  authorizationCodes.save(code, client.id, redirectURI, user.id, ares.scope, function (err) {
    if (err) {
      return done(err);
    }
    return done(null, code);
  });
}

/**
 * Grant authorization codes
 *
 * The callback takes the `client` requesting authorization, the `redirectURI`
 * (which is used as a verifier in the subsequent exchange), the authenticated
 * `user` granting access, and their response, which contains approved scope,
 * duration, etc. as parsed by the application.  The application issues a code,
 * which is bound to these values, and will be exchanged for an access token.
 */
server.grant(oauth2orize.grant.code(_issueAuthorizationCode));

/**
 * Grant implicit authorization.
 *
 * The callback takes the `client` requesting authorization, the authenticated
 * `user` granting access, and their response, which contains approved scope,
 * duration, etc. as parsed by the application.  The application issues a token,
 * which is bound to these values.
 */
server.grant(oauth2orize.grant.token(function (client, user, ares, done) {
  var token = uid.uid(config.token.accessTokenLength);
  accessTokens.save(token, config.token.calculateExpirationDate(), user.id, client.id, ares.scope, function (err) {
    if (err) {
      return done(err);
    }
    return done(null, token, {expires_in: config.token.expiresIn});
  });
}));

/**
 * Exchange authorization codes for access tokens.
 *
 * The callback accepts the `client`, which is exchanging `code` and any
 * `redirectURI` from the authorization request for verification.  If these values
 * are validated, the application issues an access token on behalf of the user who
 * authorized the code.
 */
server.exchange(oauth2orize.exchange.code(function (client, code, redirectURI, done) {
  authorizationCodes.find(code, function (err, authCode) {
    if (err) {
      return done(err);
    }
    if (!authCode) {
      return done(null, false);
    }
    if (client.id !== authCode.clientID) {
      return done(null, false);
    }
    if (redirectURI !== authCode.redirectURI) {
      return done(null, false);
    }
    authorizationCodes.delete(code, function (err, result) {
      if (err) {
        return done(err);
      }
      if (result !== undefined && result === 0) {
        //This condition can result because of a "race condition" that can occur naturally when you're making
        //two very fast calls to the authorization server to exchange authorization codes.  So, we check for
        // the result and if it's not undefined and the result is zero, then we have already deleted the
        // authorization code
        return done(null, false);
      }
      var token = uid.uid(config.token.accessTokenLength);
      accessTokens.save(token, config.token.calculateExpirationDate(), authCode.userID, authCode.clientID, authCode.scope, function (err) {
        if (err) {
          return done(err);
        }
        var refreshToken = null;
        //I mimic openid connect's offline scope to determine if we send
        //a refresh token or not
        if (authCode.scope && authCode.scope.indexOf("offline_access") === 0) {
          refreshToken = uid.uid(config.token.refreshTokenLength);
          refreshTokens.save(refreshToken, authCode.userID, authCode.clientID, authCode.scope, function (err) {
            if (err) {
              return done(err);
            }
            return done(null, token, refreshToken, {expires_in: config.token.expiresIn});
          });
        } else {
          return done(null, token, refreshToken, {expires_in: config.token.expiresIn});
        }
      });
    });
  });
}));

/**
 * Exchange user id and password for access tokens.
 *
 * The callback accepts the `client`, which is exchanging the user's name and password
 * from the token request for verification. If these values are validated, the
 * application issues an access token on behalf of the user who authorized the code.
 */
server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {
  if (!clients.hasAllowedScopes(scope, client)) {
    return done(null, false, { message: 'Invalid scope' });
  }
  //Validate the user
  User.findOne(User.byLogin(username), function (err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false);
    }
    if (!user.authenticate(password)) {
      return done(null, false);
    }
    var token = uid.uid(config.token.accessTokenLength);
    accessTokens.save(token, config.token.calculateExpirationDate(), user.id, client.id, scope, function (err) {
      if (err) {
        return done(err);
      }
      var refreshToken = null;
      //I mimic openid connect's offline scope to determine if we send
      //a refresh token or not
      if (scope && scope.indexOf("offline_access") === 0) {
        refreshToken = uid.uid(config.token.refreshTokenLength);
        refreshTokens.save(refreshToken, user.id, client.id, scope, function (err) {
          if (err) {
            return done(err);
          }
          return done(null, token, refreshToken, {expires_in: config.token.expiresIn});
        });
      } else {
        return done(null, token, refreshToken, {expires_in: config.token.expiresIn});
      }
    });
  });
}));

/**
 * Exchange the client id and password/secret for an access token.
 *
 * The callback accepts the `client`, which is exchanging the client's id and
 * password/secret from the token request for verification. If these values are validated, the
 * application issues an access token on behalf of the client who authorized the code.
 */
server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, done) {
  if (!clients.hasAllowedScopes(scope, client)) {
    return done(null, false, { message: 'Invalid scope' });
  }
  var token = uid.uid(config.token.accessTokenLength);
  //Pass in a null for user id since there is no user when using this grant type
  accessTokens.save(token, config.token.calculateExpirationDate(), null, client.id, scope, function (err) {
    if (err) {
      return done(err);
    }
    return done(null, token, null, {expires_in: config.token.expiresIn});
  });
}));

/**
 * Exchange the refresh token for an access token.
 *
 * The callback accepts the `client`, which is exchanging the client's id from the token
 * request for verification.  If this value is validated, the application issues an access
 * token on behalf of the client who authorized the code
 */
server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
  refreshTokens.find(refreshToken, function (err, authCode) {
    if (err) {
      return done(err);
    }
    if (!authCode) {
      return done(null, false);
    }
    if (client.id !== authCode.clientID) {
      return done(null, false);
    }
    var token = uid.uid(config.token.accessTokenLength);
    accessTokens.save(token, config.token.calculateExpirationDate(), authCode.userID, authCode.clientID, authCode.scope, function (err) {
      if (err) {
        return done(err);
      }
      return done(null, token, null, {expires_in: config.token.expiresIn});
    });
  });
}));

/**
 * User authorization endpoint
 *
 * `authorization` middleware accepts a `validate` callback which is
 * responsible for validating the client making the authorization request.  In
 * doing so, is recommended that the `redirectURI` be checked against a
 * registered value, although security requirements may vary across
 * implementations.  Once validated, the `done` callback must be invoked with
 * a `client` instance, as well as the `redirectURI` to which the user will be
 * redirected after an authorization decision is obtained.
 *
 * This middleware simply initializes a new authorization transaction.  It is
 * the application's responsibility to authenticate the user and render a dialog
 * to obtain their approval (displaying details about the client requesting
 * authorization).  We accomplish that here by routing through `ensureLoggedIn()`
 * first, and rendering the `dialog` view.
 */
var _authorization = [
  function (req, res, next) {
    if (!req.query.scope) {
      req.query.scope = '*'; // default for OAuth2 clients
    }
    next();
  },
  server.authorization(function (clientID, redirectURI, scope, done) {
    if (redirectURI && !clientID) {
      clients.findByRedirectUri(redirectURI, function (err, client) {
        if (err) {
          return done(err);
        }
        if (client && !clients.hasAllowedScopes(scope, client)) {
          return done(null, false, { message: 'Invalid scope' });
        }
        return done(null, client, redirectURI);
      });
    } else {
      clients.findByClientId(clientID, function (err, client) {
        if (err) {
          return done(err);
        }
        if (client) {
          // WARNING: For security purposes, it is highly advisable to check that
          //          redirectURI provided by the client matches one registered with
          //          the server.
          if (client.redirectUri && redirectURI.lastIndexOf(client.redirectUri, 0) !== 0) {
            return done(null, false, { message: 'Invalid redirectUri' });
          }
          if (!clients.hasAllowedScopes(scope, client)) {
            return done(null, false, { message: 'Invalid scope' });
          }
        }
        return done(null, client, redirectURI);
      });
    }
  }),
  function (req, res, next) {
    //Render the decision dialog if the client isn't a trusted client
    //TODO Make a mechanism so that if this isn't a trusted client, the user can recorded that they have consented
    //but also make a mechanism so that if the user revokes access to any of the clients then they will have to
    //re-consent.
    clients.findByClientId(req.query.client_id, function (err, client) {
      if (!err && client && client.trustedClient && client.trustedClient === true) {
        //This is how we short call the decision like the dialog below does
        server.decision({loadTransaction: false}, function (req, callback) {
          callback(null, { allow: true, scope: req.oauth2.req.scope });
        })(req, res, next);
      } else {
        res.render('nojs-auth-decision.ejs', {
          transactionID: req.oauth2.transactionID,
          user: req.user,
          client: req.oauth2.client,
          scope: req.oauth2.req.scope
        });
      }
    });
  }
];
exports.authorization = _authorization;

/**
 * User decision endpoint
 *
 * `decision` middleware processes a user's decision to allow or deny access
 * requested by a client application.  Based on the grant type requested by the
 * client, the above grant middleware configured above will be invoked to send
 * a response.
 */
exports.decision = [
  server.decision(function(req, done) {
    return done(null, { scope: req.oauth2.req.scope });
  })
];

/**
 * Token endpoint
 *
 * `token` middleware handles client requests to exchange authorization grants
 * for access tokens.  Based on the grant type being exchanged, the above
 * exchange middleware will be invoked to handle the request.  Clients must
 * authenticate when making requests to this endpoint.
 */
exports.token = [
  function (req, res, next) { // default used by CAS clients
    Object.keys(req.query).forEach(function (val) {
      req.body[val] = req.query[val];
    });
    if (!req.body.grant_type) {
      req.body.grant_type = 'authorization_code';
    }
    if (!req.body.scope) {
      req.body.scope = '*'; // default for OAuth2 and CAS clients
    }
    next();
  },
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
];

/**
 * CAS OAuth2.0 Server Emulation.
 * Special version of authorization enforces a response_type and a restricted scope for CAS clients
 */
exports.casAuthorization = [
  function (req, res, next) {
    req.query.response_type = 'code';
    req.query.scope = 'login';
    next();
  },
  _authorization
];

/**
 * CAS OAuth2.0 Server Emulation.
 * Special version of token formats results as form url for CAS clients
 * @type {Array}
 * @private
 */
exports.formToken = [
  function (req, res, next) { // default used by CAS clients
    Object.keys(req.query).forEach(function (val) {
      req.body[val] = req.query[val];
    });
    if (!req.bodygrant_type) {
      req.body.grant_type = 'authorization_code';
    }
    next();
  },
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  function (req, res, next) {
    var myRes = {
      setHeader: function (arg1, arg2) {
        if (arg1 === 'Content-Type') {
          arg2 = 'application/x-www-form-urlencoded';
        }
        res.setHeader(arg1, arg2);
      },
      end: function (arg1) {
        var formData = querystring.stringify(JSON.parse(arg1));
        res.end(formData);
      }
    };
    server.token()(req, myRes, next);
  },
  server.errorHandler()
];

/**
 * CAS OAuth2.0 Server Emulation.
 * Exports user profile as CAS clients expect it
 */
exports.casProfile = function (req, res) {
  res.jsonp({ id: req.user.username, attributes: [
    {code: 'SUCCESS'}
  ] });
};


//
// CAS 1.0 and 2.0 Protocol emulation.
// Emulates a subset of client authentication
// See http://www.jasig.org/cas/protocol
//

/**
 * Load the CAS service ticket parser and alias it
 */
var grantCas = require('../helpers/oauth2/grant/cas');
server.grant(grantCas(_issueAuthorizationCode));

var exchangeCasValidate = require('../helpers/oauth2/exchange/cas-validate');
server.exchange(exchangeCasValidate(function (client, code, redirectURI, done) {
  authorizationCodes.find(code, function (err, authCode) {
    if (err) {
      return done(err);
    }
    if (!authCode) {
      return done(null, false);
    }
    // implicit based on redirectURI: (client.id === authCode.clientID) {
    if (redirectURI !== authCode.redirectURI) {
      return done(null, false);
    }
    authorizationCodes.delete(code, function (err, result) {
      if (err) {
        return done(err);
      }
      if (result !== undefined && result === 0) {
        //This condition can result because of a "race condition" that can occur naturally when you're making
        //two very fast calls to the authorization server to exchange authorization codes.  So, we check for
        // the result and if it's not undefined and the result is zero, then we have already deleted the
        // authorization code
        return done(null, false);
      }
      User.findOne({
        _id: authCode.userID
      }, '-salt -hashed_password', function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        return done(null, user.username);
      });
    });
  });
}));

var errorsCasError = require('../helpers/oauth2/errors/cas-error');

/**
 * CAS 1.0 and 2.0 login ticket request
 * grant 'ticket' (authorization-code) and return to 'service' url
 * assume user already authenticated. no 'renew' or 'gateway' support.
 */
exports.casLogin = [
  function (req, res, next) {
    req.query.response_type = 'cas';
    next();
  },
  _authorization
];

/**
 * CAS 1.0 ticket validation
 *
 * verify 'ticket' (bearer token) and return status to 'service' url
 * do not support 'renew'
 */
exports.casValidate = [
  function (req, res, next) {
    // default used by CAS clients
    req.body.grant_type = 'cas_validate';
    req.body.cas_version = '1_0';
    next();
  },
  server.token(),
  errorsCasError.casValidateError
];

/**
 * CAS 2.0 ticket validation
 *
 * verify 'ticket' (bearer token) and return status to 'service' url
 * do not support 'renew' or 'pgtUrl'
 */
exports.casServiceValidate = [
  function (req, res, next) {
    // default used by CAS clients
    req.body.grant_type = 'cas_validate';
    req.body.cas_version = '2_0';
    next();
  },
  server.token(),
  errorsCasError.casValidateError
];


/**
 * From time to time we need to clean up any expired tokens in the database
 */
setInterval(function () {
  accessTokens.removeExpired(function (err) {
    if (err) {
      console.error("Error removing expired tokens");
    }
  });
}, config.token.timeToCheckExpiredTokens * 1000);


// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTPS request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function (client, done) {
  return done(null, client.id);
});

server.deserializeClient(function (id, done) {
  clients.find(id, function (err, client) {
    if (err) {
      return done(err);
    }
    return done(null, client);
  });
});
