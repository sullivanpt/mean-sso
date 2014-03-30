/**
 * Rate limiters for routes.
 *
 * See https://github.com/visionmedia/node-ratelimiter
 */
'use strict';

var _ = require('lodash'),
  url = require('url'),
  redis = require('redis'),
  Limiter = require('ratelimiter'),
  config = require('./config');

// connect redis client
var db = (function () {
  var parsed = url.parse(config.redis.uri);
  var client =  redis.createClient(parsed.port || 6379, parsed.hostname || 'localhost', config.redis.options);
  if (parsed.auth) {
    client.auth(parsed.auth.split(':')[1]); // extract password
  }
  client.on('connect', function () { console.log('redis connected'); });
  return client;
})();

var policies = {};

policies.byLogin = function byLogin() {
  // TODO: this policy would be less harmful and more effective if it only decremented on failed login sttempts.
  // need to enhance ratelimiter to allow retrieval without decrement,
  // then split policy into pre authentication limiting and post authentication failure decrementing
  return _.merge({ id: 'login', db: db }, config.rateLimit.byLogin);
};

policies.byAnyone = function byAnyone() {
  return _.merge({ id: 'anyone', db: db }, config.rateLimit.byAnyone);
};

policies.byUser = function byUser(req) {
  return _.merge({ id: 'user:' + req.user._id, db: db }, config.rateLimit.byUser);
};

policies.byIP = function byIP(req) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  return _.merge({ id: 'ip:' + ip, db: db }, config.rateLimit.byIP);
};

/**
 * Apply the named policy to the request
 * @param name null or the name of an existing policy
 * @param req the authenticated request object
 * @param callback has the form fn(err, limit)
 */
exports.get = function (name, req, callback) {
  if (!name) { return callback(null, false); }

  // TODO: implement whitelists and blacklists here

  var policy = policies[name];
  var limiter = new Limiter(policy(req));
  limiter.get(callback);
};
