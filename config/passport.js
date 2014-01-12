'use strict';

var mongoose = require('mongoose'),
    BasicStrategy = require('passport-http').BasicStrategy,
    ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy,
    BearerStrategy = require('passport-http-bearer').Strategy,
    LocalStrategy = require('passport-local').Strategy,
    TwitterStrategy = require('passport-twitter').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    GitHubStrategy = require('passport-github').Strategy,
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    User = mongoose.model('User'),
    simpleModel = require('../helpers/simple-model'),
    clients = simpleModel.model('Client'),
    accessTokens = simpleModel.model('AccessToken'),
    config = require('./config');


module.exports = function(passport) {
    //Serialize sessions
    //
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
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findOne({
            _id: id
        }, '-salt -hashed_password', function(err, user) {
            done(err, user);
        });
    });

    /**
     * BasicStrategy & ClientPasswordStrategy
     *
     * These strategies are used to authenticate registered OAuth clients.  They are
     * employed to protect the `token` endpoint, which consumers use to obtain
     * access tokens.  The OAuth 2.0 specification suggests that clients use the
     * HTTP Basic scheme to authenticate.  Use of the client password strategy
     * allows clients to send the same credentials in the request body (as opposed
     * to the `Authorization` header).  While this approach is not recommended by
     * the specification, in practice it is quite common.
     */
    passport.use(new BasicStrategy(
      function (username, password, done) {
        clients.findByClientId(username, function (err, client) {
          if (err) {
            return done(err);
          }
          if (!client) {
            return done(null, false);
          }
          if (client.clientSecret != password) {
            return done(null, false);
          }
          return done(null, client);
        });
      }
    ));

    /**
     * Client Password strategy
     *
     * The OAuth 2.0 client password authentication strategy authenticates clients
     * using a client ID and client secret. The strategy requires a verify callback,
     * which accepts those credentials and calls done providing a client.
     */
    passport.use(new ClientPasswordStrategy(
      function (clientId, clientSecret, done) {
        clients.findByClientId(clientId, function (err, client) {
          if (err) {
            return done(err);
          }
          if (!client) {
            return done(null, false);
          }
          if (client.clientSecret != clientSecret) {
            return done(null, false);
          }
          return done(null, client);
        });
      }
    ));

    /**
     * BearerStrategy
     *
     * This strategy is used to authenticate either users or clients based on an access token
     * (aka a bearer token).  If a user, they must have previously authorized a client
     * application, which is issued an access token to make requests on behalf of
     * the authorizing user.
     */
    passport.use(new BearerStrategy(
      function (accessToken, done) {
        accessTokens.find(accessToken, function (err, token) {
          if (err) {
            return done(err);
          }
          if (!token) {
            return done(null, false);
          }
          if(new Date() > token.expirationDate) {
            accessTokens.delete(accessToken, function(err) {
              return done(err);
            });
          } else {
            if (token.userID != null) {
              User.findOne({
                _id: token.userID
              }, function (err, user) {
                if (err) {
                  return done(err);
                }
                if (!user) {
                  return done(null, false);
                }
                // to keep this example simple, restricted scopes are not implemented,
                // and this is just for illustrative purposes
                var info = { scope: '*' };
                return done(null, user, info);
              });
            } else {
              //The request came from a client only since userID is null
              //therefore the client is passed back instead of a user
              clients.find(token.clientID, function (err, client) {
                if (err) {
                  return done(err);
                }
                if (!client) {
                  return done(null, false);
                }
                // to keep this example simple, restricted scopes are not implemented,
                // and this is just for illustrative purposes
                var info = { scope: '*' };
                return done(null, client, info);
              });
            }
          }
        });
      }
    ));

    //Use local strategy
    //
    /**
     * LocalStrategy
     *
     * This strategy is used to authenticate users based on a username and password.
     * Anytime a request is made to authorize an application, we must ensure that
     * a user is logged in before asking them to approve the request.
     */
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function(email, password, done) {
            User.findOne({
                email: email
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {
                        message: 'Unknown user'
                    });
                }
                if (!user.authenticate(password)) {
                    return done(null, false, {
                        message: 'Invalid password'
                    });
                }
                return done(null, user);
            });
        }
    ));

    //Use twitter strategy
    passport.use(new TwitterStrategy({
            consumerKey: config.twitter.clientID,
            consumerSecret: config.twitter.clientSecret,
            callbackURL: config.twitter.callbackURL
        },
        function(token, tokenSecret, profile, done) {
            User.findOne({
                'twitter.id_str': profile.id
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    user = new User({
                        name: profile.displayName,
                        username: profile.username,
                        provider: 'twitter',
                        twitter: profile._json
                    });
                    user.save(function(err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                    return done(err, user);
                }
            });
        }
    ));

    //Use facebook strategy
    passport.use(new FacebookStrategy({
            clientID: config.facebook.clientID,
            clientSecret: config.facebook.clientSecret,
            callbackURL: config.facebook.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            User.findOne({
                'facebook.id': profile.id
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    user = new User({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        username: profile.username,
                        provider: 'facebook',
                        facebook: profile._json
                    });
                    user.save(function(err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                    return done(err, user);
                }
            });
        }
    ));

    //Use github strategy
    passport.use(new GitHubStrategy({
            clientID: config.github.clientID,
            clientSecret: config.github.clientSecret,
            callbackURL: config.github.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            User.findOne({
                'github.id': profile.id
            }, function(err, user) {
                if (!user) {
                    user = new User({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        username: profile.username,
                        provider: 'github',
                        github: profile._json
                    });
                    user.save(function(err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                    return done(err, user);
                }
            });
        }
    ));

    //Use google strategy
    passport.use(new GoogleStrategy({
            clientID: config.google.clientID,
            clientSecret: config.google.clientSecret,
            callbackURL: config.google.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            User.findOne({
                'google.id': profile.id
            }, function(err, user) {
                if (!user) {
                    user = new User({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        username: profile.username,
                        provider: 'google',
                        google: profile._json
                    });
                    user.save(function(err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                    return done(err, user);
                }
            });
        }
    ));
};