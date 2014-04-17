'use strict';

/**
 * Properties and settings of the OAuth2 authorization server
 */
exports.properties = {
  //
  // OAuth2orize endpoints
  //
  username: 'test',
  email: 'test@test.com',
  password: 'test',
  login: '/api/session',
  clientId: 'trustedClient',
  clientSecret: 'ssh-otherpassword',
  token: '/oauth2/token',
  authorization: '/oauth2/authorize',
  userinfo: '/api2/me',
  clientinfo: '/api2/clientinfo',
  logout: '/logout',
  primus: '/primus/?EIO=2&transport=polling&b64=1',
  untrustedClientId: 'xyz123',
  //
  // CAS endpoints
  //
  redirect: 'http://localhost:9000/callback/', // this represents an endpoint on the client
  casClientId: 'cas456',
  casClientSecret: 'ssh-othersecret',
  casLogin: '/cas/login',
  casValidate: '/cas/validate',
  casServiceValidate: '/cas/serviceValidate',
  casLogout: '/cas/logout',
  casOAuthAuthorization: '/cas/oauth2.0/authorize',
  casOAuthToken: '/cas/oauth2.0/accessToken',
  casOAuthProfile: '/cas/oauth2.0/profile'
};
