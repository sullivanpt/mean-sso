/**
 * Abstraction layer to hide persistence implementation (mongoose, mysql, ...) from the application,
 *
 * Also can act as a simple schema container for in memory models, for example:
 * var clients = []; // in memory store for instances
 * var ClientSchema = {};
 * ClientSchema.find = function (id, done) {
 *   for (var i = 0, len = clients.length; i < len; i++) {
 *     var client = clients[i];
 *     if (client.id === id) {
 *       return done(null, client);
 *     }}
 *   return done(null, null);
 * };
 * models.model('Client', ClientSchema);
 */
'use strict';

var path = require('path'),
  fs = require('fs'),
  mongoose = require('mongoose'),
  config = require('./config');

//
// Code to abstract models follows.
// Note: this has to be defined first because of our circular requires dependencies when we bootstrap
// the models below.
//

var _models = {};

exports.model = function (handle, model) {
  if (model) {
    if (_models[handle]) {
      console.error('Duplicate model ' + handle);
    }
    _models[handle] = model;
  } else {
    if (!_models[handle]) {
      console.error('Undefined model ' + handle);
    }
    return _models[handle];
  }
};

//
// Code to bootstrap models follows
//

// Connect to database
var db = mongoose.connect(config.mongo.uri, config.mongo.options);

// Bootstrap models
var modelsPath = path.join(__dirname, '../models');
fs.readdirSync(modelsPath).forEach(function (file) {
  require(modelsPath + '/' + file);
});

