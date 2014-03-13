'use strict';
/*jshint camelcase: false */

var assert = require('assert'),
  properties = require('../common').properties,
  helper = require('../common').request,
  validate = require('../common').validate;

var models = require('../../../lib/config/models'),
  accessTokens = models.model('AccessToken');

before(function (done) {
  helper.waitForServerReady(done); // ensure server is up
});

/**
 * Tests for the Grant Type of Client.
 * This follows the testing guide roughly from
 * https://github.com/FrankHassanabad/Oauth2orizeRecipes/wiki/OAuth2orize-Authorization-Server-Tests
 */
describe('Grant Type Client', function () {
  //set the time out to be 20 seconds
  this.timeout(20000);
  it('should remove all tokens, logout and clear session cookies', function (done) {
    accessTokens.removeAll(function () {
      helper.logout(done);
    });
  });
  it('should work with asking for an access token', function (done) {
    helper.postOAuthClient({scope: 'profile account'},
      function (error, response, body) {
        validate.validateAccessToken(response, body);
        var tokens = JSON.parse(body);
        //Get the client info
        helper.getClientInfo(tokens.access_token,
          function (error, response, body) {
            validate.validateClientJson(response, body, {scope: ['profile','account']});
            done();
          }
        );
      }
    );
  });
  it('should work with a scope of undefined', function (done) {
    //test it with no off line access
    helper.postOAuthClient({scope: undefined},
      function (error, response, body) {
        validate.validateAccessToken(response, body);
        var tokens = JSON.parse(body);
        //Get the client info
        helper.getClientInfo(tokens.access_token,
          function (error, response, body) {
            validate.validateClientJson(response, body, {});
            done();
          }
        );
      }
    );
  });
  it('should work for a client with a restricted scope', function (done) {
    helper.postOAuthClient({
        scope: 'login',
        clientId: properties.casClientId,
        clientSecret: properties.casClientSecret
      }, function (error, response, body) {
        validate.validateAccessToken(response, body);
        var tokens = JSON.parse(body);
        //Get the client info
        helper.getClientInfo(tokens.access_token,
          function (error, response, body) {
            validate.validateClientJson(response, body, {
              name: 'Trusted CAS Client',
              scope: ['login']
            });
            done();
          }
        );
      }
    );
  });
  it('should give an error when requesting beyond a restricted scope', function (done) {
    helper.postOAuthClient({
        scope: 'login profile',
        clientId: properties.casClientId,
        clientSecret: properties.casClientSecret
      }, function (error, response) {
        //assert that we are getting an error code of 403
        assert.equal(response.statusCode, 403);
        done();
      }
    );
  });
  it('should give an error when using incorrect client credentials', function (done) {
    helper.postOAuthClient({
        clientSecret: 'bad-guess'
      }, function (error, response) {
        //assert that we are getting an error code of 401
        assert.equal(response.statusCode, 401);
        done();
      }
    );
  });
  it('should remove all tokens', function (done) {
    accessTokens.removeAll(function () {
      done();
    });
  });
});
