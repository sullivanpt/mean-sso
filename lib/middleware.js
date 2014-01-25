'use strict';

var passport = require('passport');

/**
 * Custom middleware used by the application
 */
module.exports = {

  /**
   * user.hasRole as node handler.
   */
  hasRole: function (role) {
    return function(req, res, next) {
      if(!req.user.hasRole(role)) {
        return res.send(403, 'Forbidden');
      }
      next();
    };
  },

  /**
   * user.hasGroup as node handler.
   * Example:
   *   app.post('/articles',
   *     apiAuthenticate,
   *     auth.hasGroup('writer'),
   *     articles.create);
   */
  hasGroup: function (groups) {
    return function(req, res, next) {
      if(!req.user.hasGroup(groups)) {
        return res.send(403, 'Forbidden');
      }
      next();
    };
  },

  /**
   * Generic API authentication
   * User must authenticate.
   * Priority given to cookie based session authentication.
   * Bearer token tried (without establishing a new cookie session) if cookie session does not exist.
   * Otherwise 401 response sent.
   */
  apiAuthenticate: function(req, res, next) {
    if (!req.isAuthenticated()) {
      passport.authenticate('bearer', {
        session: false
      })(req, res, next);
    } else {
      next();
    }
  },

  /**
   *  Protect routes on your api from unauthenticated access
   */
  auth: function auth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.send(401);
  },

  /**
   * Set a cookie for angular so it knows we have an http session
   */
  setUserCookie: function(req, res, next) {
    if(req.user) {
      res.cookie('user', JSON.stringify(req.user.userInfo));
    }
    next();
  }
};