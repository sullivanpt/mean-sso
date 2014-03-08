/**
 * Custom middleware used by the application
 */
'use strict';

var passport = require('passport'),
  simpleModel = require('./helpers/simple-model'),
  // TODO: convert the following models to Mongoose or REDIS
  Client = simpleModel.model('Client');

/**
 * (Recommend that routes use pageEnsureAuthorization and apiEnsureAuthorization instead of this).
 * 
 * Node request handler to verify the user and client possess the proper authorization to use the route.
 * Can be used on page and API routes.
 * Returns 403 response if authorization fails.
 *
 *  Options may include any or none of the following:
 *    anonymous: true -- no checks. useful to differentiate purposefully open routes from accidental oversights.
 *               false [default] -- request must be authenticated.
 *    role: <role>  -- if supplied user must have the specified role.
 *    groups: <group | [group, ...]> -- if supplied user must be a member of one of the specified groups.
 *    scope: <scope | [scope, ...]> -- if supplied token must have one of the specified scopes (cookie sessions have all).
 */
function hasAuthorization(options) {
  options = options || {};
  return function(req, res, next) {
    if (!options.anonymous) {
      if (!req.user.hasRole(options.role)) {
        return res.send(403, 'Forbidden');
      }
      if (!req.user.hasGroup(options.groups)) {
        return res.send(403, 'Forbidden');
      }
      // req.authInfo is undefined if a cookie session is in use
      if (req.authInfo && !Client.hasAtLeastOneScope(options.scope, req.authInfo.scope)) {
        return res.send(403, 'Forbidden');
      }
    }
    next();
  };
}
exports.hasAuthorization = hasAuthorization;

/**
 * (Recommend that routes use pageEnsureAuthorization and apiEnsureAuthorization instead of this).
 *
 * Node request handler to force the user and client to authenticate when using a page route.
 * Should only be used on page routes.
 *  When authenticating:
 *    Priority given to cookie based session authentication.
 *    If a request is received that is unauthenticated, the request will be redirected to the /login page.
 * Returns 401 response if authorization fails.
 *
 * Additionally, `returnTo` will be be set in the session to the URL of the
 * current request.  After authentication, this value can be used to redirect
 * the user to the page that was originally requested.
 *
 * Options are defined identically as for hasAuthorization with two additions:
 *   noRedirect: do not redirect unauthenticated requests, defaults to _false_
 *   setReturnTo: set redirectTo in session, defaults to _true_
 *
 * Based on https://github.com/jaredhanson/connect-ensure-login v0.1.1
 */
function pageAuthenticate(options) {
  options = options || {};
  return function(req, res, next) {
    if (!options.anonymous && !req.isAuthenticated()) {
      if (options.noRedirect) {
        return res.send(401, 'Unauthorized');
      }
      if (options.setReturnTo !== false && req.session) {
        req.session.returnTo = req.originalUrl || req.url;
      }
      return res.redirect('/login');
    } else {
      next();
    }
  };
}
exports.pageAuthenticate = pageAuthenticate;

/**
 * (Recommend that routes use pageEnsureAuthorization and apiEnsureAuthorization instead of this).
 *
 * Node request handler to force the user and client to authenticate when using an API route.
 * Should only be used on API routes.
 *  When authenticating:
 *    Priority given to cookie based session authentication.
 *    Bearer token tried (without establishing a new cookie session) if cookie session does not exist.
 *  Returns 401 response if authentication or authorization fails.
 *
 * Options are defined identically as for hasAuthorization.
 */
function apiAuthenticate(options) {
  options = options || {};
  return function(req, res, next) {
    if (!options.anonymous && !req.isAuthenticated()) {
      passport.authenticate('bearer', {
        session: false
      })(req, res, next);
    } else {
      next();
    }
  };
}
exports.apiAuthenticate = apiAuthenticate;

/**
 * Combines pageAuthenticate and hasAuthorization
 *
 * Example:
 *   app.get('/oauth2/authorize',
 *     middleware.pageEnsureAuthorization({role:'user'}), 
 *     oauth2.authorization);
 */
exports.pageEnsureAuthorization = function pageEnsureAuthorization(options) {
  return  [
    pageAuthenticate(options),
    hasAuthorization(options)
  ];
};


/**
 * Combines apiAuthenticate and hasAuthorization
 * 
 * Example:
 *     app.get('/api2/me',
 *       middleware.apiEnsureAuthorization({scope:'profile'}),
 *       users.me);
 */
exports.apiEnsureAuthorization = function apiEnsureAuthorization(options) {
  return  [
    apiAuthenticate(options),
    hasAuthorization(options)
  ]; 
};

/**
 * Set a cookie for angular so it knows we have an http session
 */
exports.setUserCookie = function setUserCookie(req, res, next) {
  if(req.user) {
    res.cookie('user', JSON.stringify(req.user.userInfo));
  }
  next();
};
