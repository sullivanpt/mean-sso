'use strict';

var models = require('../config/models'),
    User = models.model('User'),
    passport = require('passport');

/**
 * Create user
 */
exports.create = function (req, res, next) {
  var newUser = new User(User.sanitize(req.body));
  newUser.provider = 'local';

  newUser.save(function(err) {
    if (err) {
      // hashedPassword is provided by a virtual field. TODO: handle this in the model
      if ((err.errors || {}).hashedPassword) {
        err.errors.password = err.errors.hashedPassword;
        delete err.errors.hashedPassword;
      }

      return next(err);
    }

    req.logIn(newUser, function(err) {
      if (err) return next(err);
      
      return res.json(req.user.userInfo);
    });
  });
};

/**
 *  Get profile of specified user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(404);
  
    res.send({ profile: user.profile });
  });
};

/**
 * Change password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return res.send(400, err);

        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

/**
 * Get current user
 */
exports.me = function(req, res) {
  res.json(req.user && req.user.userInfo || null);
};