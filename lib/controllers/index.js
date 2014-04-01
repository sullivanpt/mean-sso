'use strict';

var _ = require('lodash'),
  path = require('path'),
  cloudinary = require('../config/cloudinary'),
  config = require('../config/config');

/**
 * Send partial, or 404 if it doesn't exist
 */
exports.partials = function(req, res) {
  var stripped = req.url.split('.')[0];
  var requestedView = path.join('./', stripped);
  res.render(requestedView, function(err, html) {
    if(err) {
      console.log("Error rendering partial '" + requestedView + "'\n", err);
      res.status(404);
      res.send(404);
    } else {
      res.send(html);
    }
  });
};

/**
 * Send our single page app
 */
exports.index = function(req, res) {
  res.render('index', {
    cloudinaryConfig: JSON.stringify(cloudinary.jsConfig),
    meanSsoConfig: JSON.stringify({
      providers: _.compact([ // export list of support authentication providers to our UI
        (config.twitter && 'twitter'),
        (config.facebook && 'facebook'),
        (config.github && 'github'),
        (config.google && 'google')
      ])
    })
  });
};
