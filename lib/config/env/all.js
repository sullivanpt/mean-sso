'use strict';

var _ = require('lodash'),
  path = require('path');

var rootPath = path.normalize(__dirname + '/../../..');

/**
 * Helper to parse credentials or return null.
 * If credentials exist then options are merged into the result.
 * @param auth string of the form username:password
 * @param options additional parameters such as desired scope options
 */
function parseProviderAuth(auth, options) {
  if (!auth) return null;
  var parts = auth.split(':');
  return _.merge({
    clientID: parts[0],
    clientSecret: parts[1]
  }, options);
}

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
   * Configuring application public DNS URL
   * Usually this is the load balancer or reverse proxy where SSL is terminated for this app.
   * This typically has the form: "https://<host>[/<root path>]"
   *
   * TODO: when not explicitly provided determine this dynamically using reverse DNS
   */
  rootUrl: process.env.ROOT_URL || 'http://localhost:9000',

  /**
   * Configuring authentication providers
   * Each environment variable has the form "<api key>:<secret>"
   */
  facebook: parseProviderAuth(process.env.AUTH_FACEBOOK, {}),
  twitter: parseProviderAuth(process.env.AUTH_TWITTER, {}),
  github: parseProviderAuth(process.env.AUTH_GITHUB, {}),
  google: parseProviderAuth(process.env.AUTH_GOOGLE, {}),

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