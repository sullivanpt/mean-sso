/**
 * Rate limiters for routes.
 *
 * See https://github.com/visionmedia/node-ratelimiter
 */
'use strict';

var _ = require('lodash'),
  redis = require('./redis'),
  Limiter = require('ratelimiter'),
  config = require('./config');

// connect redis client
var db = redis.createClient();
db.on('connect', function () { console.log('redis limiter connected'); });

var strategies = {};

strategies.byAnyoneTest = function byAnyoneTest() {
  return _.merge({ id: 'test', db: db }, config.rateLimit.byAnyoneTest);
};

strategies.byLogin = function byLogin() {
  // TODO: this strategy would be less harmful and more effective if it only decremented on failed login attempts.
  // need to enhance ratelimiter to allow retrieval without decrement,
  // then split strategy into pre authentication limiting and post authentication failure decrementing
  return _.merge({ id: 'login', db: db }, config.rateLimit.byLogin);
};

strategies.byAnyone = function byAnyone() {
  return _.merge({ id: 'anyone', db: db }, config.rateLimit.byAnyone);
};

strategies.byUser = function byUser(req) {
  return _.merge({ id: 'user:' + req.user._id, db: db }, config.rateLimit.byUser);
};

strategies.byIP = function byIP(req) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  return _.merge({ id: 'ip:' + ip, db: db }, config.rateLimit.byIP);
};

/**
 * Apply the named strategy to the request
 * @param name null or the name of an existing strategy
 * @param req the authenticated request object
 * @param callback has the form fn(err, limit)
 */
exports.get = function (name, req, callback) {
  if (!name) { return callback(null, false); }

  // TODO: implement whitelists and blacklists here

  var strategy = strategies[name];
  var limiter = new Limiter(strategy(req));
  limiter.get(callback);
};
