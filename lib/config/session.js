/**
 * Convenience wrapper for express/connect.session
 */
'use strict';

var express = require('express'),
  config = require('./config'),
  mongoStore = require('connect-mongo')(express);

var sessionFn = express.session({
  secret: config.sessionSecret,
  store: new mongoStore({
    url: config.mongo.uri,
    collection: 'sessions'
  }, function () {
    console.log("sessions db connection open");
  })
});

/**
 * Export the typical cookie based connect.session handler
 */
exports.cookieSession = sessionFn;

/**
 * Wrapper for connect.session that expects the sessionID to be passed in as query.session_id
 */
exports.querySession = function (req, res, next) {
  req.cookies['connect.sid'] = req.query.session_id;
  sessionFn(req, res, next);
};

