'use strict';

var assert = require('assert');

require('../../../../lib/models/access-token');
var   simpleModel = require('../../../../lib/helpers/simple-model'),
  accessTokens = simpleModel.model('AccessToken');

describe('access token saving/deleting', function () {

  it('should remove all tokens', function(done) {
    accessTokens.removeAll(function() {
      done();
    });
  });

  it('should not find any empty access tokens', function (done) {
    accessTokens.find('', function(token) {
      assert.equal(token, null);
    });
    done();
  });

  it('should save an access token, then delete it correctly', function (done) {
    accessTokens.save('someMadeUpAccessTokenLookAtMe',
      new Date(),
      'madeUpUser',
      'madeUpClient',
      'madeUpScope',
      function (/* err */) {
        accessTokens.find('someMadeUpAccessTokenLookAtMe', function (err, token) {
          assert.equal(token.userID, 'madeUpUser');
          assert.equal(token.clientID, 'madeUpClient');
          assert.equal(token.scope, 'madeUpScope');
          accessTokens.delete('someMadeUpAccessTokenLookAtMe', function (/* err */) {
            accessTokens.find('someMadeUpAccessTokenLookAtMe', function (err, token) {
              assert.equal(token, null);
              done();
            });
          });
        });
      }
    );
  });

  it('should remove all tokens', function(done) {
    accessTokens.removeAll(function() {
      done();
    });
  });
});
