/**
 * Unit tests for personae controller.
 * Assumes basic route security is in place.
 * Includes underlying model in tests.
 */
'use strict';

/*jshint expr: true*/

var expect = require('chai').expect,
  requestCore = require('../common/request-core');

var models = require(requestCore.rootPath + '/lib/config/models'),
  User = models.model('User'),
  UserPersona = models.model('UserPersona');

describe('Personae Controller', function() {
  var userMe, userOther, personaA, personaB;

  before(function(done) {
    // Clear users and personae before testing, create two test users, and login
    requestCore.waitForServerReady(function () {
      UserPersona.remove().exec(function () {
        // TODO: User.remove().exec(function () {
        User.create({
            provider: 'local',
            name: 'Me User',
            email: 'me@local.host',
            password: 'test'
          }, {
            provider: 'local',
            name: 'Other User',
            email: 'other@local.host',
            password: 'test'
          }, function(err, me, other) {
            userMe = me;
            userOther = other;
            requestCore.login({ email: userMe.email, password: userMe.password }, function () {
              done();
            });
          }
        );
        // });
      });
    });
  });

  it('should begin with two users and no personae', function(done) {
    User.find({}, function(err, users) {
      expect(users.length).to.equal(4); // TODO: remove 2 dummydata users from this test
      UserPersona.find({}, function (err, personae) {
        expect(personae.length).to.equal(0);
        done();
      });
    });
  });

  it('should begin returning no results for user me', function(done) {
    requestCore.request.get(requestCore.serverAddress('/api2/me/personae'), {json: true}, function (err, resp, body) {
      expect(resp.statusCode).to.equal(200);
      expect(body).to.eql([]);
      done();
    });
  });

  it('should create persona for user me', function(done) {
    requestCore.request.post(requestCore.serverAddress('/api2/me/personae'), requestCore.addCsrfHeader({
      json: {
        name: 'Persona A',
        bio: 'Something about A'
      }
    }), function (err, resp, body) {
      personaA = body;
      expect(resp.statusCode).to.equal(201);
      expect(body.name).to.equal('Persona A');
      expect(body.bio).to.equal('Something about A');
      expect(body.userID).to.equal(userMe.id);
      done();
    });
  });

  it('should create alternate persona for user me', function(done) {
    requestCore.request.post(requestCore.serverAddress('/api2/me/personae'), requestCore.addCsrfHeader({
      json: {
        name: 'Persona B',
        bio: 'Something about B'
      }
    }), function (err, resp, body) {
      personaB = body;
      expect(resp.statusCode).to.equal(201);
      expect(body.name).to.equal('Persona B');
      expect(body.bio).to.equal('Something about B');
      expect(body.userID).to.equal(userMe.id);
      done();
    });
  });

  it('should return both personae for user me', function(done) {
    requestCore.request.get(requestCore.serverAddress('/api2/me/personae'), {json: true}, function (err, resp, body) {
      expect(resp.statusCode).to.equal(200);
      expect(body).to.be.an('array');
      expect(body.length).to.equal(2);
      body.sort(function (a,b) { return a.name > b.name; });
      expect(body[0].name).to.equal('Persona A');
      expect(body[0].id).to.equal(personaA.id);
      expect(body[0].userID).to.equal(userMe.id);
      expect(body[1].name).to.equal('Persona B');
      done();
    });
  });

  it('should return a specific persona for user me', function(done) {
    requestCore.request.get(requestCore.serverAddress('/api2/me/personae/' + personaA._id), {json: true}, function (err, resp, body) {
      expect(resp.statusCode).to.equal(200);
      expect(body.name).to.equal('Persona A');
      done();
    });
  });

  it('should return a specific public persona for user me', function(done) {
    requestCore.request.get(requestCore.serverAddress('/api2/personae/' + personaA._id), {json: true}, function (err, resp, body) {
      expect(resp.statusCode).to.equal(200);
      expect(body.name).to.equal('Persona A');
      expect(body.userID).to.be.undefined;
      done();
    });
  });

  it('should support searching for a public persona', function(done) {
    requestCore.request.get(requestCore.serverAddress('/api2/personae?bio=about a'), {json: true}, function (err, resp, body) {
      expect(resp.statusCode).to.equal(200);
      expect(body).to.be.an('array');
      expect(body.length).to.equal(1);
      expect(body[0].name).to.equal('Persona A');
      expect(body[0].userID).to.be.undefined;
      done();
    });
  });
});
