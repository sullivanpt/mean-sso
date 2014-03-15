'use strict';

var path = require('path');

var rootPath = path.normalize(__dirname + '/../../..');

module.exports = {
  root: rootPath,
  port: process.env.PORT || 9000,
  sessionSecret: process.env.SESSION_SECRET || 'angular-fullstack secret',
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  /**
   * Configuring CORS
   * See https://npmjs.org/package/cors
   *
   * TODO: Consider dynamically allowing the hosts in models/client.redirectUrl
   *
   * Note phonegap-angular-client doesn't use CORS when running in the emulator.
   */
  corsOptions: {
    origin: 'http://localhost:9000' // enable phonegap-angular-client 'grunt serve' debugging
  },

  /**
   * Configuration of access tokens.
   *
   * timeToCheckExpiredTokens - The time in seconds to check the database
   * for expired access tokens.  For example, if it's set to 3600, then that's
   * one hour to check for expired access tokens.
   * expiresIn - The time in seconds before the access token expires
   * calculateExpirationDate - A simple function to calculate the absolute
   * time that th token is going to expire in.
   * authorizationCodeLength - The length of the authorization code
   * accessTokenLength - The length of the access token
   * refreshTokenLength - The length of the refresh token
   */
  token: {
    timeToCheckExpiredTokens: 3600,
    expiresIn: 3600,
    calculateExpirationDate: function() {
      return new Date(new Date().getTime() + (this.expiresIn * 1000));
    },
    authorizationCodeLength: 16,
    accessTokenLength: 256,
    refreshTokenLength: 256
  }
};