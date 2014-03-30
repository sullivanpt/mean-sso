'use strict';

var config = require('./config'),
  models = require('./models'),
  User = models.model('User'),
  Client = models.model('Client'),
  Thing = models.model('Thing'),
  AccessToken = models.model('AccessToken'),
  RefreshToken = models.model('RefreshToken'),
  AuthorizationCode = models.model('AuthorizationCode');

/**
 * Populate database with sample application data
 */

//Clear old things, then add things in
Thing.find({}).remove(function() {
  Thing.create({
    name : 'HTML5 Boilerplate',
    info : 'HTML5 Boilerplate is a professional front-end template for building fast, robust, and adaptable web apps or sites.',
    awesomeness: 10
  }, {
    name : 'AngularJS',
    info : 'AngularJS is a toolset for building the framework most suited to your application development.',
    awesomeness: 10
  }, {
    name : 'Karma',
    info : 'Spectacular Test Runner for JavaScript.',
    awesomeness: 10
  }, {
    name : 'Express',
    info : 'Flexible and minimalist web application framework for node.js.',
    awesomeness: 10
  }, {
    name : 'MongoDB + Mongoose',
    info : 'An excellent document database. Combined with Mongoose to simplify adding validation and business logic.',
    awesomeness: 10
  }, function() {
      console.log('finished populating things');
    }
  );
});

// Because we are clearing users and clients all the old tokens are invalid
AccessToken.remove(function () {
  console.log('Cleared AccessTokens');
});
RefreshToken.remove(function () {
  console.log('Cleared RefreshTokens');
});
AuthorizationCode.remove(function () {
  console.log('Cleared AuthorizationCodes');
});

// Clear old users, then add a default admin and test user
User.find({}).remove(function() {
  User.create({
    provider: 'local',
    name: 'Admin User',
    email: 'admin@local.host',
    username: 'admin',
    password: 'admin',
    role: 'admin'
  }, {
    provider: 'local',
    name: 'Test User',
    email: 'test@test.com',
    username: 'test',
    password: 'test'
  }, function() {
      console.log('finished populating users');
    }
  );
});

// Clear old clients, then add testing clients and phonegap client
Client.find({}).remove(function () {
  Client.create(  {
      name: 'CAS Client',
      clientId: 'cas123',
      clientSecret: 'ssh-secret',
      redirectUri: 'http://localhost:9000/askcallback',
      allowedScopes: ['login']
    },
    {
      name: 'Trusted CAS Client',
      clientId: 'cas456',
      clientSecret: 'ssh-othersecret',
      redirectUri: 'http://localhost:9000/callback',
      allowedScopes: ['login'],
      trustedClient: true
    },
    {
      name: 'Samplr2',
      clientId: 'xyz123',
      clientSecret: 'ssh-password'
      // Basic eHl6MTIzOnNzaC1wYXNzd29yZA==
    },
    {
      name: 'Samplr3',
      clientId: 'trustedClient',
      clientSecret: 'ssh-otherpassword',
      trustedClient: true
    },
    {
      name: 'Mobile Application',
      clientId: 'phonegap-angular-client',
      clientSecret: 'ssh-not-secret', // for an installed client this is NOT a secret
      // Basic cGhvbmVnYXAtYW5ndWxhci1jbGllbnQ6c3NoLW5vdC1zZWNyZXQ=
      redirectUri: 'http://localhost' // accepts any port (and unintentionally DNS prefixes)
    }, function() {
    console.log('finished populating clients');
  });
});
