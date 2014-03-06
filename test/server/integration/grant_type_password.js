'use strict';
/*jshint camelcase: false */

var request = require('request'),
  helper = require('../common').request,
  validate = require('../common').validate;

require('../../../lib/models/access-token');
var simpleModel = require('../../../lib/helpers/simple-model'),
  accessTokens = simpleModel.model('AccessToken');

//Enable cookies so that we can perform logging in correctly to the OAuth server
//and turn off the strict SSL requirement
var request = request.defaults({jar: true, strictSSL: false});

before(function (done) {
  helper.waitForServerReady(done); // ensure server is up
});

/**
 * Tests for the Grant Type of Password.
 * This follows the testing guide roughly from
 * https://github.com/FrankHassanabad/Oauth2orizeRecipes/wiki/OAuth2orize-Authorization-Server-Tests
 */
describe('Grant Type Password', function () {
  //set the time out to be 20 seconds
  this.timeout(20000);
  it('should remove all tokens, logout and clear session cookies', function (done) {
    accessTokens.removeAll(function () {
      helper.logout(done);
    });
  });
  it('should work with asking for an access token and refresh token', function (done) {
    helper.postOAuthPassword('offline_access',
      function (error, response, body) {
        validate.validateAccessRefreshToken(response, body);
        var tokens = JSON.parse(body);
        //Get the client info
        helper.getClientInfo(tokens.access_token,
          function (error, response, body) {
            validate.validateClientJson(response, body, ['offline_access']);
            //Get the user info
            helper.getUserInfo(tokens.access_token,
              function (error, response, body) {
                validate.validateUserJson(response, body);
                //Get another valid access token from the refresh token
                helper.postRefeshToken(tokens.refresh_token, function (error, response, body) {
                  validate.validateAccessToken(response, body);
                  //Get another valid access token from the refresh token
                  helper.postRefeshToken(tokens.refresh_token, function (error, response, body) {
                    validate.validateAccessToken(response, body);
                    done();
                  });
                });
              }
            );
          }
        );
      }
    );
  });
  it('should work just an access token and a scope of undefined', function (done) {
    //test it with no off line access
    helper.postOAuthPassword(undefined,
      function (error, response, body) {
        validate.validateAccessToken(response, body);
        var tokens = JSON.parse(body);
        //Get the client info
        helper.getClientInfo(tokens.access_token,
          function (error, response, body) {
            validate.validateClientJson(response, body, ['*']);
            //Get the user info
            helper.getUserInfo(tokens.access_token,
              function (error, response, body) {
                validate.validateUserJson(response, body);
                done();
              }
            );
          }
        );
      }
    );
  });
  it('should remove all tokens', function (done) {
    accessTokens.removeAll(function () {
      done();
    });
  });
});
