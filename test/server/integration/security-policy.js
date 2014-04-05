'use strict';
/*jshint expr: true*/

var expect = require('chai').expect,
  helper = require('../common').request,
  properties = require('../common').properties;

before(function (done) {
  helper.waitForServerReady(done); // ensure server is up
});

/**
 * Integration tests for the site security policy.  Assumes individual components
 * such as session management and anti-CSRF work correctly. Here we verify they've been
 * assembled in a comprehensive fashion.
 */
describe('Security Policy', function () {
  //set the time out to be 20 seconds
  this.timeout(20000);
  it('knownUserApi should require authentication', function (done) {
    helper.logout();
    helper.getUserInfo(null, function (error, response) {
      expect(response.statusCode).to.equal(401);
      done();
    });
  });
  it('rate limited route should limit access per time span', function (done) {
    helper.getRateLimited(function (error, response) {
      expect(response.statusCode).to.equal(200);
      expect(response.headers['x-ratelimit-remaining']).to.equal('2');
      expect(response.headers['retry-after']).to.not.exist;
      helper.getRateLimited(function (error, response) {
        expect(response.statusCode).to.equal(200);
        helper.getRateLimited(function (error, response) {
          expect(response.statusCode).to.equal(429);
          expect(response.headers['x-ratelimit-remaining']).to.equal('0');
          expect(response.headers['retry-after']).to.exist;
          done();
        });
      });
    });
  });
  it('loginUserPageApi should require CSRF token', function (done) {
    helper.login(function (error, response) {
      expect(response.statusCode).to.equal(403);
      done();
    }, { noXsrf: true });
  });
  it('loginUserPageApi should work', function (done) {
    helper.login(function (error, response) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });
  it('knownUserPage should DENY iframe embedding', function (done) {
    helper.getAuthorization({
      responseType: 'token',
      clientId: properties.untrustedClientId,
      scope: 'login'
    }, function (error, response, body) {
      expect(response.statusCode).to.equal(200);
      expect(body).to.contain('is requesting access to your account');
      expect(response.headers['x-frame-options']).to.equal('DENY');
      done();
    });
  });
  it('knownUserApi should work with session cookie on same origin', function (done) {
    helper.getUserInfo(null, function (error, response) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });
  it('knownUserApi should not work with session cookie with bad token', function (done) {
    helper.getUserInfo('BADTOKEN', function (error, response) {
      expect(response.statusCode).to.equal(401);
      done();
    });
  });
  it('knownUserApi should not work with session cookie on different origin', function (done) {
    helper.getUserInfo({ cors: true }, function (error, response) {
      expect(response.headers['access-control-allow-origin']).to.exist;
      expect(response.statusCode).to.equal(401);
      done();
    });
  });
});