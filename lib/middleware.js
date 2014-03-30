/**
 * Custom middleware used by the application
 */
'use strict';

var ms = require('ms'),
  passport = require('passport'),
  limiter = require('./config/limiter'),
  models = require('./config/models'),
  Client = models.model('Client');

/**
 * (Recommend that routes use pageEnsureAuthorization and apiEnsureAuthorization instead of this).
 *
 * Node request handler to apply a named rate limiter policy to the route.
 * Can be used on page and API routes.
 * Returns 429 response if rate limit policy is triggered.
 *
 * See https://github.com/visionmedia/node-ratelimiter
 * difference here is our middleware returns a rate limiter by policy name or no-op if name is undefined
 */
function rateLimit(policy) {
  return function(req, res, next) {
    limiter.get(policy, req, function (err, limit) {
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
exports.rateLimit = rateLimit;

/**
 * (Recommend that routes use pageEnsureAuthorization and apiEnsureAuthorization instead of this).
 * 
 * Node request handler to verify the user and client possess the proper authorization to use the route.
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
  options = options || {};
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
exports.hasAuthorization = hasAuthorization;

/**
 * (Recommend that routes use pageEnsureAuthorization and apiEnsureAuthorization instead of this).
 *
 * Node request handler to force the user and client to authenticate when using a page route.
 * Should only be used on page routes.
 *  When authenticating:
 *    Priority given to cookie based session authentication.
 *    If a request is received that is unauthenticated, the request will be redirected to the /login page.
 * Returns 401 response if authentication fails.
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
 * Returns 401 response if authentication fails.
 *
 * Options are defined identically as for hasAuthorization:
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
 * Combines pageAuthenticate, hasAuthorization and rateLimit
 *
 * Options for rateLimit may include any or none of the following:
 *   authLimit: <policy> -- if supplied apply rate limit policy to requests on this route before authentication checks.
 *                          typically used to mitigate brute force credential guessing.
 *   limit: <policy> -- if supplied apply rate limit policy to requests on this route after authorization checks.
 *                      typically used to meter access to valuable resources.
 *
 * Example:
 *   app.get('/oauth2/authorize',
 *     middleware.pageEnsureAuthorization({role:'user'}), 
 *     oauth2.authorization);
 */
exports.pageEnsureAuthorization = function pageEnsureAuthorization(options) {
  options = options || {};
  return  [
    rateLimit(options.authLimit),
    pageAuthenticate(options),
    hasAuthorization(options),
    rateLimit(options.limit)
  ];
};


/**
 * Combines apiAuthenticate, hasAuthorization and rateLimit
 *
 * Options for rateLimit are defined identically as for pageEnsureAuthorization.
 * 
 * Example:
 *     app.get('/api2/me',
 *       middleware.apiEnsureAuthorization({scope:'profile'}),
 *       users.me);
 */
exports.apiEnsureAuthorization = function apiEnsureAuthorization(options) {
  options = options || {};
  return  [
    rateLimit(options.authLimit),
    apiAuthenticate(options),
    hasAuthorization(options),
    rateLimit(options.limit)
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
