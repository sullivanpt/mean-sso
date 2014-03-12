'use strict';

/**
 * Properties and settings of the OAuth2 authorization server
 */
exports.properties = {
  username: 'test',
  email: 'test@test.com',
  password: 'test',
  login: '/api/session',
  redirect: 'http://localhost:9000/callback/', // this represents an endpoint on the client
  clientId: 'trustedClient',
  clientSecret: 'ssh-otherpassword',
  casClientId: 'cas456',
  casClientSecret: 'ssh-othersecret',
  token: '/oauth2/token',
  authorization: '/oauth2/authorize',
  userinfo: '/api2/me',
  clientinfo: '/api2/clientinfo',
  logout: '/logout'
};
