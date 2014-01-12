'use strict';

module.exports = function(app, passport, auth, oauth2) {
    // Generic API authentication
    // User must authenticate.
    // Priority given to cookie based session authentication.
    // Bearer token tried (without establishing a new cookie session) if cookie session does not exist.
    // Otherwise 401 response sent.
    var apiAuthenticate = function(req, res, next) {
        if (!req.isAuthenticated()) {
            passport.authenticate('bearer', {
                session: false
            })(req, res, next);
        } else {
            next();
        }
    };

    //User Routes
    var users = require('../app/controllers/users');
    app.get('/signin', users.signin);
    app.get('/signup', users.signup);
    app.get('/signout', users.signout);
    // NOT USED: app.get('/users/me', users.me); // note returns null if user not authenticated

    //Setting up the users api
    app.post('/users', users.create); // TODO: add captcha and/or email validation here

    //Setting the local strategy route
    app.post('/users/session', passport.authenticate('local', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/signin',
        failureFlash: true
    }), users.session);

    // Finish with setting up the userId param
    // NOT USED: app.param('userId', users.user);

    //Setting the facebook oauth routes
    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: ['email', 'user_about_me'],
        failureRedirect: '/signin'
    }), users.signin);

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/signin'
    }), users.authCallback);

    //Setting the github oauth routes
    app.get('/auth/github', passport.authenticate('github', {
        failureRedirect: '/signin'
    }), users.signin);

    app.get('/auth/github/callback', passport.authenticate('github', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/signin'
    }), users.authCallback);

    //Setting the twitter oauth routes
    app.get('/auth/twitter', passport.authenticate('twitter', {
        failureRedirect: '/signin'
    }), users.signin);

    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/signin'
    }), users.authCallback);

    //Setting the google oauth routes
    app.get('/auth/google', passport.authenticate('google', {
        failureRedirect: '/signin',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    }), users.signin);

    app.get('/auth/google/callback', passport.authenticate('google', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/signin'
    }), users.authCallback);

    // setting up the OAuth2orize routes
    app.get('/oauth2/authorize', auth.ensureLoggedIn, oauth2.authorization);
    app.post('/oauth2/authorize/decision', auth.ensureLoggedIn, oauth2.decision);
    app.post('/oauth2/token', oauth2.token);

    app.get('/oauth2/token', oauth2.token); //TODO: delete me

    // Mimicking google's token info endpoint from
    // https://developers.google.com/accounts/docs/OAuth2UserAgent#validatetoken
    var tokens = require('../app/controllers/tokens');
    app.get('/oauth2/tokeninfo', tokens.info);

    // CAS OAuth emulation points
    app.get('/cas/oauth2.0/authorize', auth.ensureLoggedIn, oauth2.authorization);
    app.get('/cas/oauth2.0/accessToken', oauth2.formToken);
    app.get('/cas/oauth2.0/profile', apiAuthenticate, users.casProfile);

    //Article Routes
    var articles = require('../app/controllers/articles');
    app.get('/articles', articles.all);
    app.post('/articles', apiAuthenticate, articles.create);
    app.get('/articles/:articleId', articles.show);
    app.put('/articles/:articleId', apiAuthenticate, auth.article.hasAuthorization, articles.update);
    app.del('/articles/:articleId', apiAuthenticate, auth.article.hasAuthorization, articles.destroy);

    //Finish with setting up the articleId param
    app.param('articleId', articles.article);

    //Home route
    var index = require('../app/controllers/index');
    app.get('/', index.render);

};
