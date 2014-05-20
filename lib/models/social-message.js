/**
 * For social websites this is a message between public facing user identities.
 */
'use strict';

var _ = require('lodash'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * SocialMessage Schema
 */
var SocialMessageSchema = new Schema({
  actor: String, // Schema.Types.ObjectId,
  to: String, // Schema.Types.ObjectId,
  text: String,
  imageID: String // cloudinary image id
});

// Public message information
SocialMessageSchema
  .virtual('exports')
  .get(function() {
    return {
      'id': this._id,
      'actor': this.actor,
      'to': this.to,
      'text': this.text,
      'imageID': this.imageID
    };
  });

/**
 * Use to prevent externally generated objects from assigning themselves privileges
 */
SocialMessageSchema.statics.sanitize = function (src) {
  return _.pick(src, ['actor', 'to', 'text', 'imageID']);
};

var SocialMessage = mongoose.model('SocialMessage', SocialMessageSchema);
require('../config/models').model('SocialMessage', SocialMessage);