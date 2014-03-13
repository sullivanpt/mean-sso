'use strict';
/*jshint camelcase: false */

var assert = require('assert'),
  helper = require('../common').request,
  validate = require('../common').validate;

var models = require('../../../lib/config/models'),
  accessTokens = models.model('AccessToken');

before(function (done) {
  helper.waitForServerReady(done); // ensure server is up
});

/**
 * Tests for the CAS 1.0 and 2.0 authentication flows
 * This follows the protocol description roughly from
 * http://www.jasig.org/cas/protocol
 */
describe('Grant Type CAS', function () {
  //set the time out to be 20 seconds
  this.timeout(20000);
  it('should remove all tokens', function (done) {
    accessTokens.removeAll(function () {
      done();
    });
  });
  it('should redirect when trying to get authorization without logging in', function (done) {
    helper.logout();
    helper.getCasLogin({},
      function (error, response /*, body */) {
        assert.equal(response.req.path.indexOf('/?ticket='), -1);
        done();
      }
    );
  });
  it('should work with CAS 1.0 login', function (done) {
    //Log into the OAuth2 server as bob
    helper.login(
      function (/*error, response, body*/) {
        //Get the OAuth2 authorization code
        helper.getCasLogin({},
          function (error, response /*, body */) {
            //Assert that we have the ?ticket in our URL
            assert.equal(response.req.path.indexOf('/?ticket='), 9);
            var ticket = response.req.path.slice(9+9, response.req.path.length);
            validate.validateCasTicket(ticket); // /^SP|T-/
            helper.logout(function () {
              //Validate the ticket with the server
              helper.getCasValidate({ version: '1.0' }, ticket,
                function (error, response, body) {
                  validate.validateCas1Validation({}, response, body);
                  done();
                }
              );
            });
          }
        );
      }
    );
  });
  it('should work with CAS 2.0 login', function (done) {
    //Log into the OAuth2 server as bob
    helper.login(
      function (/*error, response, body*/) {
        //Get the OAuth2 authorization code
        helper.getCasLogin({},
          function (error, response /*, body */) {
            //Assert that we have the ?ticket in our URL
            assert.equal(response.req.path.indexOf('/?ticket='), 9);
            var ticket = response.req.path.slice(9+9, response.req.path.length);
            validate.validateCasTicket(ticket); // /^SP|T-/
            helper.logout(function () {
              //Validate the ticket with the server
              helper.getCasValidate({ version: '2.0' }, ticket,
                function (error, response, body) {
                  validate.validateCas2Validation({}, response, body);
                  done();
                }
              );
            });
          }
        );
      }
    );
  });
  it('should return NO when validating a CAS 1.0 invalid ticket', function (done) {
    //Log into the OAuth2 server as bob
    helper.logout(function () {
      var ticket = 'ST-tNrXiUCHoGDAJCyY'; // invented ticket
      //Validate the ticket with the server
      helper.getCasValidate({ version: '1.0' }, ticket,
        function (error, response, body) {
          validate.validateCas1Validation({ invalid: true }, response, body);
          done();
        }
      );
    });
  });
  it('should return INVALID_TICKET when validating a CAS 2.0 invalid ticket', function (done) {
    //Log into the OAuth2 server as bob
    helper.logout(function () {
      var ticket = 'ST-tNrXiUCHoGDAJCyY'; // invented ticket
      //Validate the ticket with the server
      helper.getCasValidate({ version: '2.0' }, ticket,
        function (error, response, body) {
          validate.validateCas2Validation({ invalid: true }, response, body);
          done();
        }
      );
    });
  });
  // TODO: it should not return a ticket when login fails
  // TODO: it should recognize CAS logout endpoint the same as logout
  it('should give an error with an unregistered redirectUri', function (done) {
    //Log into the OAuth2 server as bob
    helper.login(
      function (/*error, response, body*/) {
        //Get the OAuth2 authorization code
        helper.getCasLogin({ redirect: 'http://untrusted/callback/' },
          function (error, response /*, body */) {
            //assert that we are getting an error code of 403
            assert.equal(response.statusCode, 403);
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
