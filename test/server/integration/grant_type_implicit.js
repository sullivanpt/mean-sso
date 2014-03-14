'use strict';

var assert = require('assert'),
  helper = require('../common').request,
  validate = require('../common').validate,
  properties = require('../common').properties;

var models = require('../../../lib/config/models'),
  AccessToken = models.model('AccessToken');

before(function (done) {
  helper.waitForServerReady(done); // ensure server is up
});

/**
 * Tests for the Grant Type of Implicit.
 * This follows the testing guide roughly from
 * https://github.com/FrankHassanabad/Oauth2orizeRecipes/wiki/OAuth2orize-Authorization-Server-Tests
 */
describe('Grant Type Implicit', function () {
  //set the time out to be 20 seconds
  this.timeout(20000);
  it('should remove all tokens', function (done) {
    AccessToken.remove(function () {
      done();
    });
  });
  it('should redirect when trying to get authorization without logging in', function (done) {
    helper.logout(function () {
      helper.getAuthorization({responseType: 'token'},
        function (error, response /*, body */) {
          assert.equal(-1, response.request.href.indexOf('/#access_token='));
          done();
        }
      );
    });
  });
  it('should work with the implicit asking for a access token', function (done) {
    //Log into the OAuth2 server as bob
    helper.login(
      function (/* error, response, body */) {
        //Get the OAuth2 authorization code
        helper.getAuthorization({responseType: 'token', scope: 'profile account', state: 'rAnDom' },
          function (error, response /*, body */) {
            //Assert that we have the ?code in our URL
            assert.equal(properties.redirect.length-1, response.request.href.indexOf('/#access_token='));
            var params = response.request.href.slice(helper.serverAddress('/#').length).split('&');
            var accessToken = params[0].split('=',2)[1];
            assert.equal(accessToken.length, 256);
            var expiresIn = params[1].split('=',2)[1];
            assert.equal(expiresIn, 3600);
            var tokenType = params[2].split('=',2)[1];
            assert.equal(tokenType, 'Bearer');
            var state = params[3].split('=',2)[1];
            assert.equal(state, 'rAnDom'); // verify state is available for CSRF mitigation
            helper.logout(function () {
              //Get the client info
              helper.getClientInfo(accessToken,
                function (error, response, body) {
                  validate.validateClientJson(response, body, {scope: ['profile', 'account']});
                  //Get the user info
                  helper.getUserInfo(accessToken,
                    function (error, response, body) {
                      validate.validateUserJson(response, body);
                      done();
                    }
                  );
                }
              );
            });
          }
        );
      }
    );
  });
  it('should give an error with an invalid client id', function (done) {
    helper.login(
      function (/* error, response, body */) {
        //Get the OAuth2 authorization code
        helper.getAuthorization({responseType: 'token', clientId: 'someinvalidclientid'},
          function (error, response /*, body */) {
            //assert that we are getting an error code of 403
            assert.equal(response.statusCode, 403);
            done();
          }
        );
      }
    );
  });
  it('should give an error with a missing client id', function (done) {
    helper.login(
      function (/* error, response, body */) {
        //Get the OAuth2 authorization code
        helper.request.get(
          helper.serverAddress(properties.authorization + '?redirect_uri=' + properties.redirect + '&response_type=token'),
          function (error, response /*, body */) {
            //assert that we are getting an error code of 400
            assert.equal(response.statusCode, 400);
            done();
          }
        );
      }
    );
  });
  it('should give an error with an invalid response type', function (done) {
    helper.login(
      function (/* error, response, body */) {
        //Get the OAuth2 authorization code
        helper.getAuthorization({responseType: 'invalid'},
          function (error, response /* , body */) {
            //assert that we are getting an error code of 501
            assert.equal(response.statusCode, 501);
            done();
          }
        );
      }
    );
  });
});
