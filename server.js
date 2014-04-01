'use strict';

var express = require('express');

/**
 * Main application file
 */

// Default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Application Config
var config = require('./lib/config/config');

// Bootstrap models
require('./lib/config/models');

// Populate empty DB with sample data
require('./lib/config/dummydata');

// Passport Configuration
require('./lib/config/passport')();

// OAuth2 Server Configuration
require('./lib/config/oauth2');

// Cloudinary integration configuration
require('./lib/config/cloudinary');

var app = express();

// Express settings
require('./lib/config/express')(app);

// Routing
require('./lib/routes')(app);

// Start server
var server = app.listen(config.port, function () {
  console.log('Express server listening on port %d in %s mode', config.port, app.get('env'));
});

// Expose server for testing
app.server = server;

// Expose app
exports = module.exports = app;