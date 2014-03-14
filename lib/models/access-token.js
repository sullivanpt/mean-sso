/**
 * The access tokens.
 * You will use these to access your end point data through the means outlined
 * in the RFC The OAuth 2.0 Authorization Framework: Bearer Token Usage
 * (http://tools.ietf.org/html/rfc6750)
 *
 * token The access token (required)
 * expirationDate The expiration of the access token that is a javascript Date() object (required)
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
var AccessTokenSchema = new Schema({
  token: {
    type: String,
    unique: true,
    required: true
  },
  userID: String, // Schema.Types.ObjectId,
  expirationDate: Date, // TODO: consider mongoDB TTL index here
  clientID: String, // Schema.Types.ObjectId,
  scope: [String]
});

/**
 * Statics
 */
AccessTokenSchema.statics = {
  /**
   * Syntactic sugar for new AccessToken({ params }).save(done).
   * Primarily useful for keeping parity with OAuth2orizeRecipes.
   */
  saveToken: function (token, expirationDate, userID, clientID, scope, done) {
    new this({
      token: token,
      expirationDate: expirationDate,
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
  },
  /**
   * Removes expired access tokens.  It does this by looping through them all
   * and then removing the expired ones it finds.
   * @param done returns this when done.
   * @returns done
   */
  removeExpired: function (done) {
    this.find({ expirationDate: { $lt: new Date() }}, function (err, items) {
      items.forEach(function (item) {
        console.log('Deleting access token=' + item.token.slice(0, 7) + ' clientID=' + item.clientID + ' userID=' + item.userID);
        item.remove();
      });
      done(null);
    });
  }
};

var AccessToken = mongoose.model('AccessToken', AccessTokenSchema);
require('../config/models').model('AccessToken', AccessToken);
