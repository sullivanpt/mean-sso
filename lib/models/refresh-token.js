/**
 * The refresh tokens.
 * You will use these to get access tokens to access your end point data through the means outlined
 * in the RFC The OAuth 2.0 Authorization Framework: Bearer Token Usage
 * (http://tools.ietf.org/html/rfc6750)
 *
 * token The refresh token (required)
 * userID The user ID (required)
 * clientID The client ID (required)
 * scope The scope (optional)
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Schema
 */
var RefreshTokenSchema = new Schema({
  token: {
    type: String,
    unique: true,
    required: true
  },
  userID: String, // Schema.Types.ObjectId,
  clientID: String, // Schema.Types.ObjectId,
  scope: [String]
});

/**
 * Statics
 */
RefreshTokenSchema.statics = {
  /**
   * Syntactic sugar for new RefreshToken({ params }).save(done).
   * Primarily useful for keeping parity with OAuth2orizeRecipes.
   */
  saveToken: function (token, userID, clientID, scope, done) {
    new this({
      token: token,
      userID: userID,
      clientID: clientID,
      scope: scope
    }).save(done);
  },
  /**
   * Syntactic sugar for finding a token by token value.
   * Also hides the token itself from the result.
   */
  findToken: function (key, done) {
    this.findOne({ token: key }, '-token', done);
  },
  /**
   * Syntactic sugar for deleting a token by token value.
   */
  deleteToken: function (key, done) {
    this.remove({ token: key }, done);
  }
};

var RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
require('../config/models').model('RefreshToken', RefreshToken);
