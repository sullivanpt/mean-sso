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
var configExpose = require('../config/config-expose');
configExpose.cloudinary = serverConfig.cloud_name && _.merge({
  cloud_name: serverConfig.cloud_name,
  api_key: serverConfig.api_key
}, config.cloudinary.jsOptions);


/**
 * API endpoint to generate a signature authorizing a remote upload request.
 * See http://cloudinary.com/blog/direct_image_uploads_from_the_browser_to_the_cloud_with_jquery#comment-1070767812
 */
exports.signRequest = function (req, res) {
  var params = cloudinary.utils.sign_request({
      timestamp: cloudinary.utils.timestamp(),
      transformation: "c_limit,h_500,w_500", //whatever options you want here per cloudinary docs (limit 500x500)
      format: "jpg"
    },
    {
      api_key: serverConfig.api_key,
      api_secret: serverConfig.api_secret
    });

  res.json(params);
};
