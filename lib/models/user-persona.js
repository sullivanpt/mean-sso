/**
 * For social websites this is the public facing user identity.
 * If desired the website can allow multiple personae per user.
 */
'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseApiQuery = require('mongoose-api-query');

/**
 * User Schema
 */
var UserPersonaSchema = new Schema({
  userID: String, // Schema.Types.ObjectId,
  alias: String,
  avatarID: String, // cloudinary image id
  bio: String,
  geo: { type: [Number], index: '2d' }
});

// Open up unfiltered queries to the client
UserPersonaSchema.plugin(mongooseApiQuery);

// Exported private profile information
UserPersonaSchema
  .virtual('personaInfo')
  .get(function() {
    return {
      'id': this._id,
      'userID': this.userID,
      'alias': this.alias,
      'avatarID': this.avatarID,
      'bio': this.bio,
      'geo': this.geo
    };
  });

// Public profile information
UserPersonaSchema
  .virtual('profile')
  .get(function() {
    return {
      'id': this._id,
      'alias': this.alias,
      'avatarID': this.avatarID,
      'bio': this.bio,
      'geo': this.geo
    };
  });

/**
 * Use to prevent externally generated objects from assigning themselves privileges
 */
UserPersonaSchema.statics.sanitize = function (src) {
  var safe = ['alias', 'bio', 'geo', 'avatarID'];
  var dst = {};
  safe.forEach(function (field) {
    if (src[field]) {
      dst[field] = src[field];
    }
  });
  return dst;
};

var UserPersona = mongoose.model('UserPersona', UserPersonaSchema);
require('../config/models').model('UserPersona', UserPersona);