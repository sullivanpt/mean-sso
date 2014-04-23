/**
 * Custom middleware used by the application
 */
'use strict';

var _ = require('lodash'),
  ms = require('ms'),
  express = require('express'),
  passport = require('passport'),
  cors = require('cors'),
  config = require('./config'),
  limiter = require('./limiter'),
  models = require('./models'),
  Client = models.model('Client');

/**
 * Utility to normalize route security policies.
 * Provides a short-hand mark-up to apply the 'correct' policy to each route by route use case.
 * Any override options take precedence over the defaults in the named policy.
 *
 * Options may include any explicit options supported by enforce's constituent strategies plus:
 *   policy: <policy> -- if supplied selects a prepackaged bundle of options
 * Options may also be a simple policy name as a 'string'
 */
function parsePolicy(options) {
  // Helper to make policy definition a little less prone to obscure vulnerabilities
  function createPolicy(base, options) {
    var basePolicies = {
      webPage: {
        csrf: true,
        session: true,
        setReturnTo: true,
        xframe: 'DENY'
      },
      webPageApi: {
        csrf: true,
        session: true,
        noRedirect: true
      },
      corsApi: {
        cors: true,
        csrf: 'notCors',
        noRedirect: true
      }
    };
    return _.defaults(options, basePolicies[base]);
  }

  //
  // These are the defined policies
  //
  var policies = {

    // Use this policy to protect page routes that may ask the user to enter credentials
    anonUserPage: createPolicy('webPage', {
      anonymous: true
    }),

    // Use this policy to protect page routes that require a known user
    knownUserPage: createPolicy('webPage', {}),

    // Use this policy to protect 'page' API routes that are open to anonymous users but not CORS enabled
    anonUserPageApi: createPolicy('webPageApi', {
      anonymous: true
    }),

    // Use this policy to protect 'page' API routes that create a new interactive session in the web application
    loginUserPageApi: createPolicy('webPageApi', {
      anonymous: true,
      authLimit: 'byLogin'
    }),

    // Use this policy to protect 'page' API routes that require an interactive session
    knownUserPageApi: createPolicy('webPageApi', {}),

    // Use this policy to protect API routes open to anonymous users
    anonUserApi: createPolicy('corsApi', {
      anonymous: true,
      authLimit: 'byAnyone'
    }),

    // Use this policy to protect API routes open to anonymous users that authenticate the request
    loginUserApi: createPolicy('corsApi', {
      csrf: false,
      anonymous: true,
      authLimit: 'byAnyone'
    }),

    // Use this policy to protect API routes that do not inherently create a session, but will use one if
    // it exists; or alternatively allow access if a token is provided.
    knownUserApi:  createPolicy('corsApi', {})
  };

  if (typeof options === 'string' || options instanceof String) {
    options = { policy: options };
  }
  return _.defaults({}, options, policies[options.policy]);
}

/**
 * Request handler to open the route for CORS only if options.cors is truthy.
 * Returns 204 for CORS pre-flight OPTIONS requests.
 *
 * Important: you must explicitly enable OPTIONS pre-flight for each route with:
 *   app.options(route, <openCors()>)
 *
 * See https://github.com/TroyGoode/node-cors
 * See http://www.w3.org/TR/cors/#resource-preflight-requests
 */
function openCors(options) {
  return function(req, res, next) {
    if (!options.cors) { return next(); }
    cors(config.corsOptions)(req, res, next);
  };
}

/**
 * Request handler to disallow iframe embedding of content (clickjacking mitigation) if options.xframe is truthy.
 * The options.xframe string value should be 'DENY', 'SAMEORIGIN', etc.
 */
function setXframe(options) {
  return function(req, res, next) {
    if (options.xframe) {
      res.header('X-FRAME-OPTIONS', options.xframe);
    }
    next();
  };
}

/**
 * Request handler to apply a named rate limiter strategy to the route.
 * Can be used on page and API routes.
 * Returns 429 response if rate limit strategy is triggered.
 *
 * See https://github.com/visionmedia/node-ratelimiter
 * difference here is our middleware returns a rate limiter by strategy name or no-op if name is undefined
 */
function rateLimit(strategy) {
  return function(req, res, next) {
    limiter.get(strategy, req, function (err, limit) {
      if (err) { return next(err); }
      if (!limit) { return next(); }

      res.set('X-RateLimit-Limit', limit.total);
      res.set('X-RateLimit-Remaining', limit.remaining);
      res.set('X-RateLimit-Reset', limit.reset);

      // all good
      // debug('remaining %s/%s %s', limit.remaining, limit.total, id);
      if (limit.remaining) return next();

      /* jshint bitwise: false */

      // not good
      var delta = (limit.reset * 1000) - Date.now() | 0;
      var after = limit.reset - (Date.now() / 1000) | 0;
      res.set('Retry-After', after);
      return res.send(429, 'Too Many Requests, retry in ' + ms(delta, { long: true }));
    });
  };
}

/**
 * Optionally require CSRF token except on GET, HEAD, and OPTIONS.
 * Can be used on page and API routes.
 * Returns 403 response if CSRF token in header doesn't match value stored in session.
 *
 * Enabled unless options.csrf is falsey or options.csrf is 'notCors' and this request is not CORS. In the latter case
 * it might be that the request is cross-origin but not identified as such by our authenticate method, incorrectly
 * exposing the cookie session to CSRF vulnerability.
 *
 * Aside: uses express.csrf() to generate an AngularJS compatible strategy of setting a 'XSRF-TOKEN' cookie
 * and expecting it to be returned as an X-XSRF-TOKEN header.
 * See http://docs.angularjs.org/api/ng/service/$http
 * See http://expressjs.com/3x/api.html#csrf
 */
function hasCsrf(options) {
  return function(req, res, next) {
    /*jshint sub: true */
    if (!options.csrf) { return next(); }
    if (options.csrf === 'notCors' && !req.notCors) { return next(); }
    express.csrf()(req, res, next);
  };
}

/**
 * Include CSRF token in response that is to be supplied by the client with future requests.
 * Enabled using the same logic as hasCsrf with additional requirement that options.session must be truthy.
 *
 * Important: this token must not be leaked to scripts with untrusted origins.  In general the strategy used
 * is to only supply the CSRF token as a cookie and only when returning 'page' content.
 * See documentation for hasCsrf()
 */
function setCsrf(options) {
  return function(req, res, next) {
    if (options.session && req.csrfToken) { // note csrfToken becomes truthy when express.csrf is called
      res.cookie('XSRF-TOKEN', req.csrfToken());
    }
    next();
  };
}

/**
 * Request handler to verify the user and client possess the proper authorization to use the route.
 * Can be used on page and API routes.
 * Returns 403 response if authorization fails.
 *
 * Options may include any or none of the following:
 *   anonymous: true -- no authorization checks. useful to differentiate purposefully open routes from accidental oversights.
 *              false [default] -- request must be authenticated.
 *   scope: <scope | [scope, ...]> -- if supplied token must have one of the specified scopes
 *                                    cookie sessions have all scopes.
 *                                    override fn cannot bypass client scope check.
 *   override: <fn(req)> -- if supplied role and group checks are bypassed when result is true.
 *                          typically used to give the object owner enhanced permissions.
 *   role: <role>  -- if supplied user must have the specified role.
 *   groups: <group | [group, ...]> -- if supplied user must be a member of one of the specified groups.
 */
function hasAuthorization(options) {
  return function(req, res, next) {
    if (!options.anonymous) {
      // always enforce client scope
      // req.authInfo is undefined if a cookie session is in use
      if (req.authInfo && !Client.hasAtLeastOneScope(options.scope, req.authInfo.scope)) {
        return res.send(403, 'Forbidden');
      }
      if (!options.override || !options.override(req)) {
        // notice these can be bypassed by the custom authorization check
        if (!req.user.hasRole(options.role)) {
          return res.send(403, 'Forbidden');
        }
        if (!req.user.hasGroup(options.groups)) {
          return res.send(403, 'Forbidden');
        }
      }
    }
    next();
  };
}

/**
 * Request handler to force the user (and client if applicable) to authenticate.
 * Returns 401 response if authentication fails.
 * Returns a 301 redirect to the login page if interactive login is allowed (options.session && !options.noRedirect).
 *   Additionally, `returnTo` will be be set in the session to the URL of the current request.  After authentication,
 *   this value can be used to redirect the user to the page that was originally requested.
 *
 * Supported options are:
 *   anonymous:      -- when true do not enforce user or client authorization checks (cookie session still loaded for non CORS requests).
 *                      useful to differentiate purposefully open routes from accidental oversights.
 *                      when false [default] -- request must be authenticated.
 *   session: when true a persistent cookie based session is used or set up for the user after authentication.
 *            when false a Bearer token tried (without establishing a new cookie session).
 *            ignored for correctly identified CORS requests (some will be missed).
 *            defaults to _true_
 *   noRedirect: do not redirect unauthenticated requests, ignored when no session, defaults to _false_
 *   setReturnTo: set redirectTo in session, ignored when no session, defaults to _true_
 *
 * Based on https://github.com/jaredhanson/connect-ensure-login v0.1.1
 */
function authenticate(options) {
  /*jshint sub: true */

  // test if bearer strategy should work
  // see passport-http-bearer/lib/passport-http-bearer/strategy.js
  function hasAuthorization(req) {
    if (req.headers && req.headers['authorization']) { return true; }
    if (req.body && req.body['access_token']) { return true; }
    if (req.query && req.query['access_token']) { return true; }
    return false;
  }

  return function(req, res, next) {
    if (req.isAuthenticated()) { return next(); }

    if (hasAuthorization(req)) {
      //
      // If authorization provided then to avoid confusion we must use it.
      // In this mode we never update the cookie session.
      //
      if (options.anonymous) { return next(); }
      return passport.authenticate('bearer', {
        session: false
      })(req, res, next);
    }

    // Helper to keep session authentication failure DRY
    function finishAuthentication() {
      if (options.anonymous || req.isAuthenticated()) { return next(); }
      if (!options.session || options.noRedirect) {
        return res.send(401, 'Unauthorized');
      } else {
        if (options.setReturnTo !== false && req.session) {
          req.session.returnTo = req.originalUrl || req.url;
        }
        return res.redirect('/login');
      }
    }

    //
    // Don't use the cookie session for CORS requests or CSRF is disabled (persistent session only for our own app).
    //
    // Note: Relying on origin header to signal CORS isn't necessary, since we have Access-Control-Allow-Credentials
    // false which is supposed to prevent the cookie from being sent.
    //
    if (!options.csrf || (req.headers['origin'] && req.headers['origin'] !== config.rootUrl)) {
      return finishAuthentication();
    }

    //
    // Use the cookie session if it exists
    //
    // Notes: ideally at this juncture we would have ignored the cookie session when receiving a CORS request.
    // However, given the Referer is elided by privacy software and Origin isn't included in old browsers
    // and Access-Control-Allow-Credentials might be buggy there doesn't seem a reliable way to enforce this.
    // Therefore we insist on CSRF when the cookie session is used.
    //
    req.notCors = true;
    passport.authenticate('session')(req, res, function(err) {
      if (err) { return next(err); }
      return finishAuthentication();
    });
  };
}

/**
 * Request handler to protect a route with a named or custom security policy.
 *
 * Options for rateLimit may include any or none of the following:
 *   authLimit: <strategy> -- if supplied apply rate limit strategy to requests on this route before authentication checks.
 *                            typically used to mitigate brute force credential guessing.
 *   limit: <strategy>     -- if supplied apply rate limit strategy to requests on this route after authorization checks.
 *                            typically used to meter access to valuable resources.
 *
 * Example:
 *   app.options('/api2/me', middleware.corsPreflight);
 *   app.get('/api2/me', middleware.enforce({policy:'knownUserApi'}), users.me);
 */
exports.enforce = function (options) {
  options = parsePolicy(options);
  return  [
    openCors(options), // note OPTIONS requests stop here when options.cors truthy
    setXframe(options),
    rateLimit(options.authLimit),
    authenticate(options),
    hasCsrf(options), // must be after authenticate sets req.hasCors
    hasAuthorization(options),
    rateLimit(options.limit),
    setCsrf(options)
  ];
};

/**
 * Subset of enforce suitable for authenticating WebSocket requests.
 * The point of these are just to authenticate the user when credentials are present.
 */
exports.enforceSocket = function (options) {
  options = parsePolicy(options);
  return  [
    rateLimit(options.authLimit),
    authenticate(options),
    hasAuthorization(options)
  ];
};

/**
 * Subset of enforce suitable for CORS OPTIONS preflight only.
 * Equivalent to app.options(route, enforce('anonUserApi')).
 */
exports.corsPreflight = openCors({ cors: true });

/**
 * Set a cookie for angular so it knows we have an http session
 */
exports.setUserCookie = function setUserCookie(req, res, next) {
  if(req.user) {
    res.cookie('user', JSON.stringify(req.user.userInfo));
  }
  next();
};
