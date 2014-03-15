'use strict';

var cors = require('cors'),
  passport = require('passport'),
  oauth2 = require('./config/oauth2'),
  config = require('./config/config');

var api = require('./controllers/api'),
  index = require('./controllers'),
  users = require('./controllers/users'),
  session = require('./controllers/session'),
  tokens = require('./controllers/tokens'),
  clients = require('./controllers/clients');

var middleware = require('./middleware');

/**
 * Application routes
 */
module.exports = function(app) {

  //
  // Enable CORS on all routes
  //

  app.options('*', cors(config.corsOptions));

  //
  // Server API Routes
  //

  // these bizarre APIs are part of generator-angular-fullstack
  // they probably need to be reworked

  app.get('/api/awesomeThings', api.awesomeThings);

  app.post('/api/users', users.create);
  app.put('/api/users', users.changePassword);
  app.get('/api/users/me', users.me);
  app.get('/api/users/:id', users.show);

  app.post('/api/session', session.login);
  app.del('/api/session', session.logout);

  // these APIs are added to support phonegap-angular-client

  app.get('/api2/clientinfo',  middleware.apiEnsureAuthorization(), clients.info);
  app.get('/api2/me', middleware.apiEnsureAuthorization(), users.me);

  //
  // Routing for OAuth2 clients
  //

  //Setting the facebook oauth routes
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['email', 'user_about_me'],
    failureRedirect: '/login'
  }));

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login'
  }));

  //Setting the github oauth routes
  app.get('/auth/github', passport.authenticate('github', {
    failureRedirect: '/login'
  }));

  app.get('/auth/github/callback', passport.authenticate('github', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login'
  }));

  //Setting the twitter oauth routes
  app.get('/auth/twitter', passport.authenticate('twitter', {
    failureRedirect: '/login'
  }));

  app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login'
  }));

  //Setting the google oauth routes
  app.get('/auth/google', passport.authenticate('google', {
    failureRedirect: '/login',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }));

  app.get('/auth/google/callback', passport.authenticate('google', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login'
  }));

  //
  // OAuth2orize Server routes
  //

  app.get('/oauth2/authorize', middleware.pageEnsureAuthorization(), oauth2.authorization);
  app.post('/oauth2/authorize/decision', middleware.pageEnsureAuthorization(), oauth2.decision);
  app.post('/oauth2/token', oauth2.token); // open route

  // Mimicking google's token info endpoint from
  // https://developers.google.com/accounts/docs/OAuth2UserAgent#validatetoken
  app.get('/oauth2/tokeninfo', tokens.info); // open route

  // CAS OAuth emulation points
  app.get('/cas/oauth2.0/authorize', middleware.pageEnsureAuthorization(), oauth2.casAuthorization);
  app.get('/cas/oauth2.0/accessToken', oauth2.formToken); // open route
  app.get('/cas/oauth2.0/profile', middleware.apiEnsureAuthorization(), oauth2.casProfile);

  // CAS Protocol emulation points
  app.get('/cas/login', middleware.pageEnsureAuthorization(), oauth2.casLogin);
  app.get('/cas/validate', oauth2.casValidate); // open route
  app.get('/cas/serviceValidate', oauth2.casServiceValidate); // open route
  app.get('/cas/logout', session.logoutPage); // open route. no return url support

  //
  // Single pages. Note: OAuth2 Server also has some single pages
  //

  app.get('/logout', session.logoutPage); // open route. no return url support

  //
  // All undefined api routes should return a 404
  //

  app.get('/api/*', function(req, res) {
    res.send(404);
  });
  app.get('/api2/*', function(req, res) {
    res.send(404);
  });

  //
  // All other routes to use Angular routing in app/scripts/app.js
  //
  app.get('/partials/*', index.partials); // open route
  app.get('/*', middleware.setUserCookie, index.index); // open route
};