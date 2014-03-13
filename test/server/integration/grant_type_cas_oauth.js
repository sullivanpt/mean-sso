'use strict';
/*jshint camelcase: false */

var assert = require('assert'),
  helper = require('../common').request,
  validate = require('../common').validate,
  properties = require('../common').properties;

var models = require('../../../lib/config/models'),
  accessTokens = models.model('AccessToken');

before(function (done) {
  helper.waitForServerReady(done); // ensure server is up
});

/**
 * Tests for the CAS 1.0 and 2.0 authentication flows
 * This follows the protocol description roughly from
 * https://wiki.jasig.org/display/CASUM/Configuration+for+the+OAuth+server+support#ConfigurationfortheOAuthserversupport-I.HowtouseOAuthserversupportconfiguredforCASserver?
 */
describe('Grant Type CAS OAuth2', function () {
  //set the time out to be 20 seconds
  this.timeout(20000);
  it('should remove all tokens', function (done) {
    accessTokens.removeAll(function () {
      done();
    });
  });
  it('should redirect when trying to get authorization without logging in', function (done) {
    helper.logout(function () {
      helper.getCasOAuthAuthorization({},
        function (error, response /*, body */) {
          assert.equal(response.req.path.indexOf('/?code='), -1);
          done();
        }
      );
    });
  });
  it('should work a registered redirectUri, without an explicit response_type, and grant login scope', function (done) {
    //Log into the OAuth2 server as bob
    helper.login(
      function (/* error, response, body */) {
        //Get the OAuth2 authorization code
        helper.getCasOAuthAuthorization({},
          function (error, response /*, body */) {
            //Assert that we have the ?code in our URL
            assert.equal(response.req.path.indexOf('/?code='), 9);
            var code = response.req.path.slice(9+7, response.req.path.length);
            validate.validateAuthorizationCode(code);
            //Get the token
            helper.casGetOAuthCode({}, code,
              function (error, response, body) {
                validate.validateCasAccessToken(response, body);
                var formTokens = body.split('&');
                var token = formTokens[0].split('=');
                var accessToken = token[1];
                helper.logout(function () {
                  //Get the user info
                  helper.casGetUserInfo(accessToken,
                    function (error, response, body) {
                      validate.validateCasUserJson(response, body);
                      //Get the client info
                      helper.getClientInfo(accessToken,
                        function (error, response, body) {
                          validate.validateClientJson(response, body, {
                            clientId: '2',
                            name: 'Trusted CAS Client',
                            scope: ['login']
                          });
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
      }
    );
  });
  it('should give an error with an unregistered redirectUri', function (done) {
    helper.login(
      function (/* error, response, body */) {
        //Get the OAuth2 authorization code
        helper.getCasOAuthAuthorization({
            clientId: properties.casClientId,
            scope: 'login',
            redirect: 'http://untrusted/callback/'
          }, function (error, response /* , body */) {
            //assert that we are getting an error code of 501
            assert.equal(response.statusCode, 403);
            done();
          }
        );
      }
    );
  });
  it('should give an error with an invalid client id', function (done) {
    helper.login(
      function (/* error, response, body */) {
        //Get the OAuth2 authorization code
        helper.getCasOAuthAuthorization({clientId: 'someinvalidclientid'},
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
          helper.serverAddress(properties.casOAuthAuthorization + '?redirect_uri=' + properties.redirect),
          function (error, response /*, body */) {
            //assert that we are getting an error code of 400
            assert.equal(response.statusCode, 400);
            done();
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
