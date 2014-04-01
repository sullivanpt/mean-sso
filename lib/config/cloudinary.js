/**
 * Configure Cloudinary image storage service.
 * See http://cloudinary.com/documentation/node_integration
 */
'use strict';

var _ = require('lodash'),
  url = require('url'),
  cloudinary = require('cloudinary'),
  config = require('./config');

var serverConfig = (function () {
  if (!config.cloudinary.uri) {
    console.log('Cloudinary is disabled');
    return {};
  }

  var parsed = url.parse(config.cloudinary.uri);
  var auth = parsed.auth.split(':');
  return _.merge({
    cloud_name: parsed.hostname,
    api_key: auth[0],
    api_secret: auth[1]
  }, config.cloudinary.options);
})();

/**
 * Dynamically prepares params for $.cloudinary.config()
 * See https://github.com/cloudinary/cloudinary_js
 */
exports.jsConfig = _.merge({
  cloud_name: serverConfig.cloud_name,
  api_key: serverConfig.api_key
}, config.cloudinary.jsOptions);


