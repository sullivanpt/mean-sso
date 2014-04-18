/**
 * Helper to parse redis configuration and format it suitably for creating clients
 */
'use strict';

var _ = require('lodash'),
  url = require('url'),
  redis = require('redis'),
  config = require('./config');

var parsed = url.parse(config.redis.uri);
var hostname = parsed.hostname || 'localhost';
var port = parsed.port || 6379;
var options = _.clone(config.redis.options);
if (parsed.auth) {
  options.auth_pass = parsed.auth.split(':')[1]; // extract password
}

exports.hostname = hostname;
exports.port = port;
exports.options = options;
exports.createClient = function () {
  return redis.createClient(port, hostname, options);
};