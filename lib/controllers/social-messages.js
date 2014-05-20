/**
 * User messages between public profiles with optional persistence
 */
'use strict';

var _ = require('lodash'),
  redisPubsubEmitter = require('../config/redis-pubsub-emitter'),
  models = require('../config/models'),
  UserPersona = models.model('UserPersona'),
  SocialMessage = models.model('SocialMessage');

/**
 * Send a message from user's selected persona to another persona
 */
exports.send = function (req, res, next) {
  var msg = new SocialMessage(SocialMessage.sanitize(req.body));
  UserPersona.findOne({ _id: msg.actor, userID: req.user._id }, function (err, persona) {
    if (err) return next(err);
    if (!persona) return res.send(403); // can only send from own profile
    UserPersona.findOne({ _id: msg.to }, function (err, toPersona) {
      if (err) return next(err);
      if (!toPersona) return res.send(404); // recipient does not exist
      // note: black-listing and what not is strictly client side
      msg.save(function (err) {
        if (err) { return next(err); }
        redisPubsubEmitter.publish('user:' + toPersona.userID, msg.exports);
        res.json(msg.exports);
      });
    });
  });
};