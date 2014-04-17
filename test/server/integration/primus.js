'use strict';
/*jshint expr: true, camelcase: false*/

var expect = require('chai').expect,
  helper = require('../common').request;

before(function (done) {
  helper.waitForServerReady(done); // ensure server is up
});

/**
 * Integration tests for primusJS. Primarily just ensuring route is responsive and protected.
 * Assumes configured as enabled: 'auth' mode.
 */
describe('Primus WebSockets', function () {
  //set the time out to be 20 seconds
  this.timeout(20000);
  it('should require authentication', function (done) {
    helper.logout(function () {
      helper.getPrimus({}, function (error, response) {
        expect(response.statusCode).to.equal(401);
        done();
      });
    });
  });
  // TODO: it('rate limited route should limit access per time span')
  it('login should work', function (done) {
    helper.login(function (error, response) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });
  it('should work with session cookie on same origin', function (done) {
    helper.getPrimus({}, function (error, response) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });
  it('should not work with session cookie with bad token', function (done) {
    helper.getPrimus({ accessToken: 'BADTOKEN' }, function (error, response) {
      expect(response.statusCode).to.equal(401);
      done();
    });
  });
  it('should not work with session cookie on different origin', function (done) {
    helper.getPrimus({ cors: true }, function (error, response) {
      expect(response.headers['access-control-allow-origin']).to.exist;
      expect(response.statusCode).to.equal(401);
      done();
    });
  });
  it('should work just an access token', function (done) {
    //test it with no off line access
    helper.logout(function () {
      helper.postOAuthPassword(undefined,
        function (error, response, body) {
          var tokens = JSON.parse(body);
          helper.getPrimus({ accessToken: tokens.access_token }, function (error, response) {
            expect(response.statusCode).to.equal(200);
            done();
          });
        }
      );
    });
  });
});