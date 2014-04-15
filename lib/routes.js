'use strict';

var passport = require('passport'),
  oauth2 = require('./config/oauth2'),
  cloudinary = require('./config/cloudinary'),
  config = require('./config/config');

var api = require('./controllers/api'),
  index = require('./controllers'),
  users = require('./controllers/users'),
  session = require('./controllers/session'),
  tokens = require('./controllers/tokens'),
  clients = require('./controllers/clients');

var securityPolicy = require('./config/security-policy');

/**
 * Application routes
 */
module.exports = function(app) {

  //
  // Server API Routes
  //

  // these bizarre APIs are part of generator-angular-fullstack
  // they probably need to be reworked

  app.get('/api/awesomeThings', securityPolicy.enforce('anonUserPageApi'), api.awesomeThings);

  app.options('/api/users', securityPolicy.enforce('anonUserApi'));
  app.post('/api/users', securityPolicy.enforce('anonUserApi'), users.create);
  app.put('/api/users', securityPolicy.enforce('knownUserPageApi'), users.changePassword);
  app.get('/api/users/me', securityPolicy.enforce('anonUserPageApi'), users.me);
  app.get('/api/users/:id', securityPolicy.enforce('knownUserPageApi'), users.show);

  app.post('/api/session', securityPolicy.enforce('loginUserPageApi'), session.login);
  app.del('/api/session', securityPolicy.enforce('anonUserPageApi'), session.logout);

  // these APIs are added to support phonegap-angular-client

  app.options('/api2/config', securityPolicy.enforce('anonUserApi'));
  app.get('/api2/config', securityPolicy.enforce('anonUserApi'), index.meanSsoConfig);

  app.options('/api2/clientinfo', securityPolicy.enforce('knownUserApi'));
  app.get('/api2/clientinfo',  securityPolicy.enforce('knownUserApi'), clients.info);
  app.options('/api2/me', securityPolicy.enforce('knownUserApi'));
  app.get('/api2/me', securityPolicy.enforce('knownUserApi'), users.me);

  app.options('/api2/images/signrequest', securityPolicy.enforce('knownUserApi'));
  app.get('/api2/images/signrequest', securityPolicy.enforce('knownUserApi'), cloudinary.signRequest);

  //
  // Routing for OAuth2 clients
  //
  // TODO: add explicit securityPolicy to these oauth2 client routes. Also verify state used correctly to mitigate CSRF login.
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

  app.get('/oauth2/authorize', securityPolicy.enforce('knownUserPage'), oauth2.authorization);
  app.post('/oauth2/authorize/decision', securityPolicy.enforce('knownUserPage'), oauth2.decision);
  app.options('/oauth2/token', securityPolicy.enforce('loginUserApi'));
  app.post('/oauth2/token', securityPolicy.enforce('loginUserApi'), oauth2.token);

  // Mimicking google's token info endpoint from
  // https://developers.google.com/accounts/docs/OAuth2UserAgent#validatetoken
  app.options('/oauth2/tokeninfo', securityPolicy.enforce('anonUserApi'));
  app.get('/oauth2/tokeninfo', securityPolicy.enforce('anonUserApi'), tokens.info);

  // CAS OAuth emulation points
  app.get('/cas/oauth2.0/authorize', securityPolicy.enforce('knownUserPage'), oauth2.casAuthorization);
  app.options('/cas/oauth2.0/accessToken', securityPolicy.enforce('loginUserApi'));
  app.get('/cas/oauth2.0/accessToken', securityPolicy.enforce('loginUserApi'), oauth2.formToken);
  app.options('/cas/oauth2.0/profile', securityPolicy.enforce('knownUserApi'));
  app.get('/cas/oauth2.0/profile', securityPolicy.enforce('knownUserApi'), oauth2.casProfile);

  // CAS Protocol emulation points
  app.get('/cas/login', securityPolicy.enforce('knownUserPageApi'), oauth2.casLogin);
  app.get('/cas/validate', securityPolicy.enforce('loginUserApi'), oauth2.casValidate);
  app.get('/cas/serviceValidate', securityPolicy.enforce('loginUserApi'), oauth2.casServiceValidate);
  app.get('/cas/logout', securityPolicy.enforce('anonUserPage'), session.logoutPage); // no return url support

  //
  // Single pages. Note: OAuth2 Server also has some single pages
  //

  app.get('/logout', securityPolicy.enforce('anonUserPage'), session.logoutPage); // no return url support

  //
  // Some 'safe' routes for testing
  //

  function testRoute(req, res) { res.send({ok:true}); }

  app.get('/test/security-policy/limiter', securityPolicy.enforce({policy:'anonUserPage', authLimit: 'byAnyoneTest' }), testRoute);

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
  app.get('/partials/*', index.partials); // open route to essentially static resources
  app.get('/*', securityPolicy.enforce('anonUserPage'), securityPolicy.setUserCookie, index.index); // open route
};