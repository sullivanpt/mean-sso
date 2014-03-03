'use strict';

/**
 * Properties and settings of the OAuth2 authorization server
 */
exports.properties = {
  username: 'test',
  email: 'test@test.com',
  password: 'test',
  hostname: 'http://localhost:9000',
  login: 'http://localhost:9000/api/session',
  redirect: 'http://localhost:9000',
  clientId: 'trustedClient',
  clientSecret: 'ssh-otherpassword',
  token: 'http://localhost:9000/oauth2/token',
  authorization: 'http://localhost:9000/oauth2/authorize',
  userinfo: 'http://localhost:9000/api2/me',
  clientinfo: 'http://localhost:9000/api2/clientinfo',
  logout: 'http://localhost:9000/logout'
};
