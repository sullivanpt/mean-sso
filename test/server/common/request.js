'use strict';
/*jshint camelcase: false */

var properties = require('./properties').properties;
var requestLib = require('request');

//Enable cookies so that we can perform logging in correctly to the OAuth server
//and turn off the strict SSL requirement
requestLib = requestLib.defaults({jar: true, strictSSL: false});

/**
 * These are all request helpers to help with testing
 */
exports.request = {
  /**
   * Logins as the login dialog/form would
   * @param next Standard forward to the next function call
   */
  login: function (next) {
    requestLib.post(
      properties.login, {
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
    requestLib.get(properties.logout, next || function () {});
  },
  /**
   * Posts to the OAuth2 Authorization server the code to get the access token
   * @param code The Authorization code
   * @param next Standard forward to the next function call
   */
  postOAuthCode: function (options, code, next) {
    requestLib.post(
      properties.token, {
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
      properties.token, {
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
      properties.token, {
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
      properties.token, {
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
    requestLib.get(authorization + '?redirect_uri=' + redirect_uri + '&response_type=' + response_type + '&client_id=' + client_id + '&scope=' + scope + '&state=' + state, next);
  },
  /**
   * Gets the user info from the OAuth2 authorization server
   * @param accessToken The access token to get the user info from
   * @param next Standard forward to the next function call
   */
  getUserInfo: function (accessToken, next) {
    requestLib.get({
      url: properties.userinfo,
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
      url: properties.clientinfo,
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }, next);
  },
  /**
   * Wait for server to run, then call done.
   * TODO: fix me. currently this is just a delay, it needs a loop.
   */
  waitForServerReady: function (done) {
    requestLib.get({
        url: properties.hostname
      }, function (/* error, response, body */) {
        done();
      }
    );
  }
};