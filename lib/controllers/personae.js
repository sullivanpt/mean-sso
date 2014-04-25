/**
 * User public profile creation and search
 */
'use strict';

var _ = require('lodash'),
  models = require('../config/models'),
  UserPersona = models.model('UserPersona');

/**
 *  Get all private personae records
 */
exports.list = function (req, res, next) {
  UserPersona.find({ userID: req.user._id }, function (err, personae) {
    if (err) return next(err);
    res.send(_.map(personae, function (p) { return p.personaInfo; }));
  });
};

/**
 * Create persona
 */
exports.create = function (req, res, next) {
  var newPersona = new UserPersona(UserPersona.sanitize(req.body));
  newPersona.userID = req.user._id;

  newPersona.save(function(err) {
    if (err) { return next(err); }
    return res.json(201, newPersona.personaInfo);
  });
};

/**
 *  Get private persona record
 */
exports.show = function (req, res, next) {
  UserPersona.findOne({ _id: req.params.personaID, userID: req.user._id }, function (err, persona) {
    if (err) return next(err);
    if (!persona) return res.send(404);
    res.send(persona.personaInfo);
  });
};

/**
 *  Update private persona record
 */
exports.update = function (req, res, next) {
  UserPersona.findOne({ _id: req.params.personaID, userID: req.user._id }, function (err, persona) {
    if (err) return next(err);
    if (!persona) return res.send(404);

    // TODO: sanitize these, support avatar, location
    persona.alias = req.body.alias;
    persona.bio = req.body.bio;
    persona.avatarID = req.body.avatarID;
    persona.save(function (err) {
      if (err) return next(err);
      res.send(persona.personaInfo);
    });
  });
};

/**
 *  Delete private persona record
 */
exports.delete = function (req, res, next) {
  UserPersona.findOneAndRemove({ _id: req.params.personaID, userID: req.user._id }, function (err, persona) {
    if (err) return next(err);
    if (!persona) return res.send(404); // indistinguishable from not owned by us
    res.send(200);
  });
};

/**
 * Get public persona record
 */
exports.showPublic = function (req, res, next) {
  UserPersona.findOne({ _id: req.params.personaID }, function (err, persona) {
    if (err) return next(err);
    if (!persona) return res.send(404);

    res.send(persona.profile);
  });
};

/**
 * Search public personae records
 */
exports.searchPublic = function (req, res, next) {
  // TODO: sanitize search criteria
  UserPersona.apiQuery(req.query, function (err, personae) {
    res.send(_.map(personae, function (p) { return p.profile; }));
  });
};