/**
 * Core request emulation needed for all integration tests
 */
'use strict';
/*jshint camelcase: false */



/**
 * Helper to avoid dozens of dots
 */
exports.rootPath = require('path').normalize(__dirname + '/../../..');


var _ = require('lodash'),
  requestLib = require('request'),
  toughCookie = require('tough-cookie'),
  https = require('https'),
  server = require(exports.rootPath + '/server').server;

/**
 * Export our local default cookie jar
 */
exports.jar = requestLib.jar();

/**
 * Export the underlying request library.
 * Use our local cookie jar and disable strict SSL.
 */
exports.request = requestLib.defaults({jar: exports.jar, strictSSL: false});

/**
 * Construct the root url of the server under test and append our path string
 * inspired by https://github.com/visionmedia/supertest
 */
exports.serverAddress = function serverAddress(path){
  if ('function' === typeof server) {
    throw new Error('Application not a server');
  }
  var addr = server.address();
  if (!addr){
    return 'http://localhost:9000' + path; // default path for debugging local server
  }
  var port = server.address().port;
  var protocol = server instanceof https.Server ? 'https' : 'http';
  return protocol + '://127.0.0.1:' + port + path;
};

/**
 * Mocks AngularJS XSRF support as expected by express.csrf()
 */
exports.addCsrfHeader = function addCsrfHeader(options) {
  /* global unescape: false */
  var cookies = exports.jar.getCookieString(exports.serverAddress('/')).split(';').map(function (s) {
    var c = toughCookie.Cookie.parse(s);
    if (c.key === 'XSRF-TOKEN') { return c; }
  });
  if (cookies.length) {
    options.headers = options.headers || {};
    options.headers['X-XSRF-TOKEN'] = unescape(cookies[0].value);
  }
  return options;
};

/**
 * Wait for server to run, then call done.
 * TODO: fix me. currently this is just a delay, it needs a loop.
 * See https://github.com/kcbanner/connect-mongo/issues/70
 */
exports.waitForServerReady = function waitForServerReady(done) {
  setTimeout(function () {
    exports.request.get({
        url: exports.serverAddress('/')
      }, function (/* error, response, body */) {
        done();
      }
    );
  }, 200);
};

/**
 * Login as the login dialog/form would
 * @param next Standard forward to the next function call
 * @param options if options.noCsrf don't include CSRF
 *        options.email and options.password provide non-default login credentials
 */
exports.login = function login(options, next) {
  options = _.defaults({}, options, { email: 'test@test.com', password: 'test' });
  exports.request.get(exports.serverAddress('/'), function (err) { // retrieve XSRF token
    if (err) { return next(err); }
    var addHeader = options.noCsrf ? function(x) {return x;} : exports.addCsrfHeader;
    exports.request.post(exports.serverAddress('/api/session'), addHeader({
      json: {
        email: options.email,
        password: options.password
      }
    }), next);
  });
};

/**
 * Logout as the user would to ensure session cookies are cleared
 * @param next Standard forward to the next function call
 */
exports.logout = function logout(next) {
  exports.request.get(exports.serverAddress('/logout'), next || function () {});
};