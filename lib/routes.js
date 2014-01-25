'use strict';

var passport = require('passport'),
  oauth2 = require('./config/oauth2');

var api = require('./controllers/api'),
    index = require('./controllers'),
    users = require('./controllers/users'),
    session = require('./controllers/session'),
    tokens = require('./controllers/tokens');

var middleware = require('./middleware');

/**
 * Application routes
 */
module.exports = function(app) {

  //
  // Server API Routes
  //
  app.get('/api/awesomeThings', api.awesomeThings);
  
  app.post('/api/users', users.create);
  app.put('/api/users', users.changePassword);
  app.get('/api/users/me', users.me);
  app.get('/api/users/:id', users.show);

  app.post('/api/session', session.login);
  app.del('/api/session', session.logout);

  //
  // Routing for OAuth2 clients
  //

  //Setting the facebook oauth routes
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['email', 'user_about_me'],
    failureRedirect: '/signin'
  }));

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/signin'
  }));

  //Setting the github oauth routes
  app.get('/auth/github', passport.authenticate('github', {
    failureRedirect: '/signin'
  }));

  app.get('/auth/github/callback', passport.authenticate('github', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/signin'
  }));

  //Setting the twitter oauth routes
  app.get('/auth/twitter', passport.authenticate('twitter', {
    failureRedirect: '/signin'
  }));

  app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/signin'
  }));

  //Setting the google oauth routes
  app.get('/auth/google', passport.authenticate('google', {
    failureRedirect: '/signin',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }));

  app.get('/auth/google/callback', passport.authenticate('google', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/signin'
  }));

  //
  // OAuth2orize Server routes
  //

  app.get('/oauth2/authorize', middleware.ensureLoggedIn, oauth2.authorization);
  app.post('/oauth2/authorize/decision', middleware.ensureLoggedIn, oauth2.decision);
  app.post('/oauth2/token', oauth2.token);

  app.get('/oauth2/token', oauth2.token); //TODO: delete me

  // Mimicking google's token info endpoint from
  // https://developers.google.com/accounts/docs/OAuth2UserAgent#validatetoken
  app.get('/oauth2/tokeninfo', tokens.info);

  // CAS OAuth emulation points
  app.get('/cas/oauth2.0/authorize', middleware.ensureLoggedIn, oauth2.authorization);
  app.get('/cas/oauth2.0/accessToken', oauth2.formToken);
  app.get('/cas/oauth2.0/profile', middleware.apiAuthenticate, oauth2.casProfile);

  // CAS Protocol emulation points
  app.get('/cas/login', middleware.ensureLoggedIn, oauth2.casLogin);
  app.get('/cas/validate', oauth2.casValidate);
  app.get('/cas/serviceValidate', oauth2.casServiceValidate);
  app.get('/cas/logout', session.logoutPage); // no return url support

  //
  // Single pages. Note: OAuth2 Server also has some single pages
  //

  app.get('/logout', session.logoutPage); // no return url support

  //
  // All other routes to use Angular routing in app/scripts/app.js
  //
  app.get('/partials/*', index.partials);
  app.get('/*', middleware.setUserCookie, index.index);
};