'use strict';

var passport = require('passport');

/**
 * Logout Page
 */
exports.logoutPage = function(req, res) {
  req.logout();
  res.redirect('/login');
};

/**
 * Logout API.
 * Note: using this is probably unsafe if you don't also refresh the browser
 */
exports.logout = function (req, res) {
  req.logout();
  res.send(200);
};

/**
 * Login API
 */
exports.login = function (req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    var error = err || info;
    if (error) return res.json(401, error);

    req.logIn(user, function(err) {
      
      if (err) return res.send(err);

      if (req.session && req.session.returnTo) {
        // inline signal to the client that a redirect is required
        var url = req.session.returnTo;
        delete req.session.returnTo;
        res.json({redirectTo: url});
      } else {
        // normal session return
        res.json(req.user.userInfo);
      }
    });
  })(req, res, next);
};