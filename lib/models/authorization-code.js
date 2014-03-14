/**
 * The authorization codes.
 * You will use these to get the access codes to get to the data in your endpoints as outlined
 * in the RFC The OAuth 2.0 Authorization Framework: Bearer Token Usage
 * (http://tools.ietf.org/html/rfc6750)
 *
 * code The authorization code (required)
 * clientID The client ID (required)
 * userID The user ID (required)
 * redirectURI The redirect URI of where to send access tokens once exchanged (required)
 * scope The scope (optional)
 */
'use strict';


var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Schema
 */
var AuthorizationCodeSchema = new Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  userID: String, // Schema.Types.ObjectId,
  clientID: String, // Schema.Types.ObjectId,
  scope: [String],
  redirectURI: String
});

/**
 * Statics
 */
AuthorizationCodeSchema.statics = {
  /**
   * Syntactic sugar for new AuthorizationCode({ params }).save(done).
   * Primarily useful for keeping parity with OAuth2orizeRecipes.
   */
  saveCode: function (code, clientID, redirectURI, userID, scope, done) {
    new this({
      code: code,
      userID: userID,
      clientID: clientID,
      scope: scope,
      redirectURI: redirectURI
    }).save(done);
  },
  /**
   * Syntactic sugar for finding a code by code value.
   * Also hides the code itself from the result.
   */
  findCode: function (key, done) {
    this.findOne({ code: key }, '-code', done);
  },
  /**
   * Syntactic sugar for deleting a code by code value.
   */
  deleteCode: function (key, done) {
    this.remove({ code: key }, done);
  }
};

var AuthorizationCode = mongoose.model('AuthorizationCode', AuthorizationCodeSchema);
require('../config/models').model('AuthorizationCode', AuthorizationCode);
