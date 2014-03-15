'use strict';
/*jshint camelcase: false */

var requestLib = require('request'),
  https = require('https');
var properties = require('./properties').properties;
var server = require('../../../server').server;

//Enable cookies so that we can perform logging in correctly to the OAuth server
//and turn off the strict SSL requirement
requestLib = requestLib.defaults({jar: true, strictSSL: false});

// Generate an app to test at a known address
// inspired by https://github.com/visionmedia/supertest
function serverAddress(path){
  if ('function' === typeof server) {
    throw new Error('Application not a server');
  }
  var addr = server.address();
  if (!addr){
    return 'http://localhost:9000' + path; // default path for debugging local server
  }
  var port = server.address().port;
  var protocol = server instanceof https.Server ? 'https' : 'http';
  return protocol + '://127.0.0.1:' + port + path;
}

/**
 * These are all request helpers to help with testing
 */
exports.request = {
  /**
   * Prepends the server under test to the url
   */
  serverAddress: serverAddress,
  /**
   * Access the underlying library
   */
  request: requestLib,
  /**
   * Logins as the login dialog/form would
   * @param next Standard forward to the next function call
   */
  login: function (next) {
    requestLib.post(
      serverAddress(properties.login), {
        json: {
          email: properties.email,
          password: properties.password
        }
      }, next);
  },
  /**
   * Logout as the user would to ensure session cookies are cleared
   * @param next Standard forward to the next function call
   * @param next
   */
  logout: function (next) {
    requestLib.get(serverAddress(properties.logout), next || function () {});
  },
  /**
   * Posts to the OAuth2 Authorization server the code to get the access token
   * @param code The Authorization code
   * @param next Standard forward to the next function call
   */
  postOAuthCode: function (options, code, next) {
    requestLib.post(
      serverAddress(properties.token), {
        form: {
          code: code,
          'redirect_uri': properties.redirect,
          'client_id': options.clientId || properties.clientId,
          'client_secret': options.clientSecret || properties.clientSecret,
          'grant_type': 'authorization_code'
        }
      }, next);
  },
  /**
   * Posts to the OAuth2 Authorization server the code to get the access token
   * @param scope The optional scope to use
   * @param next Standard forward to the next function call
   */
  postOAuthPassword: function (scope, next) {
    requestLib.post(
      serverAddress(properties.token), {
        form: {
          'grant_type': 'password',
          username: properties.username,
          password: properties.password,
          scope: scope
        },
        headers: {
          Authorization: 'Basic ' + new Buffer(properties.clientId + ':' + properties.clientSecret).toString('base64')
        }
      }, next);
  },
  /**
   * Posts to the OAuth2 Authorization server the code to get the access token
   * @param options For passing an optional scope, or client to use
   * @param next Standard forward to the next function call
   */
  postOAuthClient: function (options, next) {
    var clientId = options.clientId || properties.clientId;
    var clientSecret = options.clientSecret || properties.clientSecret;
    requestLib.post(
      serverAddress(properties.token), {
        form: {
          'grant_type': 'client_credentials',
          username: properties.username,
          password: properties.password,
          scope: options.scope
        },
        headers: {
          Authorization: 'Basic ' + new Buffer(clientId + ':' + clientSecret).toString('base64')
        }
      }, next);
  },
  /**
   * Gets a new access token from the OAuth2 authorization server
   * @param refreshToken The refresh token to get the new access token from
   * @param next Standard forward to the next function call
   */
  postRefeshToken: function (refreshToken, next) {
    requestLib.post(
      serverAddress(properties.token), {
        form: {
          'refresh_token': refreshToken,
          'grant_type': 'refresh_token'
        },
        headers: {
          Authorization: 'Basic ' + new Buffer(properties.clientId + ':' + properties.clientSecret).toString('base64')
        }
      }, next);
  },
  /**
   * Gets the authorization code from the OAuth2 authorization server
   * @param options Options which if not set will be defaults
   * like so
   * {
     *  authorization: 'https://localhost:3000/dialog/authorize'
     *  redirect: 'https://localhost:3000'
     *  responseType: 'code'
     *  scope: ''
     * }
   * @param next Standard forward to the next function call
   */
  getAuthorization: function (options, next) {
    var authorization = (options && options.authorization) || properties.authorization;
    var redirect_uri = (options && options.redirect) || properties.redirect;
    var response_type = (options && options.responseType) || 'code';
    var client_id = (options && options.clientId) || properties.clientId;
    var scope = (options && options.scope) || '';
    var state = (options && options.state) || '';
    requestLib.get(serverAddress(authorization + '?redirect_uri=' + redirect_uri + '&response_type=' + response_type + '&client_id=' + client_id + '&scope=' + scope + '&state=' + state), next);
  },
  /**
   * Gets the user info from the OAuth2 authorization server
   * @param accessToken The access token to get the user info from
   * @param next Standard forward to the next function call
   */
  getUserInfo: function (accessToken, next) {
    requestLib.get({
      url: serverAddress(properties.userinfo),
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }, next);
  },
  /**
   * Gets the client info from the OAuth2 authorization server
   * @param accessToken The access token to get the client info from
   * @param next Standard forward to the next function call
   */
  getClientInfo: function (accessToken, next) {
    requestLib.get({
      url: serverAddress(properties.clientinfo),
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }, next);
  },
  /**
   * Check login for Trust Authentication.
   * @param options
   * @param next
   */
  getCasLogin: function (options, next) {
    var redirect_uri = (options && options.redirect) || properties.redirect;
    requestLib.get({
      url: serverAddress(properties.casLogin + '?service=' + redirect_uri)
    }, next);
  },
  /**
   * Check the validity of the service ticket.
   * @param options
   * @param next
   */
  getCasValidate: function (options, ticket, next) {
    var endPoint = (options.version === '1.0') ? properties.casValidate : properties.casServiceValidate;
    var redirect_uri = (options && options.redirect) || properties.redirect;
    requestLib.get({
      url: serverAddress(endPoint + '?service=' + redirect_uri + '&ticket=' + ticket)
    }, next);
  },
  /**
   * Gets the authorization code from the CAS OAuth2 authorization server
   */
  getCasOAuthAuthorization: function (options, next) {
    var authorization = (options && options.authorization) || properties.casOAuthAuthorization;
    var redirect_uri = (options && options.redirect) || properties.redirect;
    var client_id = (options && options.clientId) || properties.casClientId;
    requestLib.get(serverAddress(authorization + '?redirect_uri=' + redirect_uri + '&client_id=' + client_id), next);
  },
  /**
   * Get the OAuth2 Authorization server access token from the code
   * @param code The Authorization code
   * @param next Standard forward to the next function call
   */
  casGetOAuthCode: function (options, code, next) {
    var redirect_uri = (options && options.redirect) || properties.redirect;
    var client_id = (options && options.clientId) || properties.casClientId;
    var client_secret = options.clientSecret || properties.casClientSecret;
    requestLib.get(
      serverAddress(properties.casOAuthToken +
        '?redirect_uri=' + redirect_uri +
        '&client_id=' + client_id +
        '&client_secret=' + client_secret +
        '&code=' + code),
      next);
  },
  /**
   * Gets the user info (username) from the CAS OAuth2 authorization server
   */
  casGetUserInfo: function (accessToken, next) {
    requestLib.get(serverAddress(properties.casOAuthProfile + '?access_token=' + accessToken), next);
  },
  /**
   * Wait for server to run, then call done.
   * TODO: fix me. currently this is just a delay, it needs a loop.
   * See https://github.com/kcbanner/connect-mongo/issues/70
   */
  waitForServerReady: function (done) {
    setTimeout(function () {
      requestLib.get({
          url: serverAddress('/')
        }, function (/* error, response, body */) {
          done();
        }
      );
    }, 200);
  }
};