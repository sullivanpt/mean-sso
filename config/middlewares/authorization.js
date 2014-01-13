'use strict';

var login = require('connect-ensure-login');

/*
 * See the documentation in connect-ensure-login
 */
exports.ensureLoggedIn = login.ensureLoggedIn('/signin');
exports.ensureNotLoggedIn = login.ensureNotLoggedIn();

/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.send(401, 'User is not authorized');
    }
    next();
};

/**
 * user.hasRole as node handler.
 * Example:
 *   app.post('/articles',
 *     apiAuthenticate,
 *     auth.hasRole('Admin'),
 *     articles.create);
 */
exports.hasRole = function (roles) {
    return function(req, res, next) {
        if(!req.user.hasRole(roles)) {
            return res.send(401, 'User is not authorized');
        }
        next();
    }
};

/**
 * User authorizations routing middleware
 */
exports.user = {
    hasAuthorization: function(req, res, next) {
        if (req.profile.id != req.user.id && !req.user.hasRole('Admin')) {
            return res.send(401, 'User is not authorized');
        }
        next();
    }
};

/**
 * Article authorizations routing middleware
 */
exports.article = {
    hasAuthorization: function(req, res, next) {
        if (req.article.user.id != req.user.id && !req.user.hasRole('Admin')) {
            return res.send(401, 'User is not authorized');
        }
        next();
    }
};