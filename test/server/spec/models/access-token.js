'use strict';

var assert = require('assert');

var   models = require('../../../../lib/config/models'),
  AccessToken = models.model('AccessToken');

describe('access token saving/deleting', function () {

  it('should remove all tokens', function(done) {
    AccessToken.remove(function() {
      done();
    });
  });

  it('should not find any empty access tokens', function (done) {
    AccessToken.findToken('', function(token) {
      assert.equal(token, null);
    });
    done();
  });

  it('should save an access token, then delete it correctly', function (done) {
    AccessToken.saveToken('someMadeUpAccessTokenLookAtMe', new Date(), 'madeUpUser', 'madeUpClient', ['madeUpScope'],
      function (/* err */) {
        AccessToken.findToken('someMadeUpAccessTokenLookAtMe', function (err, token) {
          assert.equal(token.userID, 'madeUpUser');
          assert.equal(token.clientID, 'madeUpClient');
          assert.equal(token.scope.length, ['madeUpScope'].length);
          assert.equal(token.scope[0], ['madeUpScope'][0]);
          AccessToken.deleteToken('someMadeUpAccessTokenLookAtMe', function (/* err */) {
            AccessToken.findToken('someMadeUpAccessTokenLookAtMe', function (err, token) {
              assert.equal(token, null);
              done();
            });
          });
        });
      }
    );
  });
});
