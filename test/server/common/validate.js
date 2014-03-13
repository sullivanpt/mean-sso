'use strict';
/*jshint camelcase: false */

var assert = require('assert');

/**
 * Our validate module object we export at the bottom
 */
var validate = {};

/**
 * Validates an access token.  An access token should be in the form of:
 * {
 *     access_token: (some 256 characters)
 *     expires_in: 3600
 *     token_type: 'bearer'
 * }
 * @param response The http response
 * @param body The body of the message which contains the access token and refresh token
 */
validate.validateAccessToken = function (response, body) {
  assert.equal(response.statusCode, 200);
  var jsonResponse = JSON.parse(body);
  assert.equal(response.headers['content-type'], 'application/json');
  assert.equal(Object.keys(jsonResponse).length, 3);
  assert.equal(jsonResponse.access_token.length, 256);
  assert.equal(jsonResponse.expires_in, 3600);
  assert.equal(jsonResponse.token_type, 'Bearer');
};

/**
 * Validates an access token.  An access token should be in the form of:
 * {
 *     access_token: (some 256 characters)
 *     refresh_token: (some 256 characters)
 *     expires_in: 3600
 *     token_type: 'bearer'
 * }
 * @param response The http response
 * @param body The body of the message which contains the access token and refresh token
 */
validate.validateAccessRefreshToken = function (response, body) {
  assert.equal(response.statusCode, 200);
  var jsonResponse = JSON.parse(body);
  assert.equal(response.headers['content-type'], 'application/json');
  assert.equal(Object.keys(jsonResponse).length, 4);
  assert.equal(jsonResponse.access_token.length, 256);
  assert.equal(jsonResponse.refresh_token.length, 256);
  assert.equal(jsonResponse.expires_in, 3600);
  assert.equal(jsonResponse.token_type, 'Bearer');
};

/**
 * Validates a user json message. It validates against this exact
 * user json message in the form of:
 * {
 *     'user_d': '1'
 *     'name': 'Bob Smith'
 *     'token_type': 'bearer'
 * }
 * @param response The http response
 * @param body The body of the message which contains the user json message
 */
validate.validateUserJson = function (response, body) {
  assert.equal(response.statusCode, 200);
  var jsonResponse = JSON.parse(body);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.notEqual(Object.keys(jsonResponse).length, 0);
  assert.ok(jsonResponse.id);
  assert.equal(jsonResponse.username, 'test');
  assert.equal(jsonResponse.name, 'Test User');
  // assert.equal(jsonResponse.scope, '*');
};

/**
 * Validates a client json message. It validates against this exact
 * client json message in the form of:
 * {
 *     'client_id': '3'
 *     'name': 'Samplr3'
 *     'scope': '*'
 * }
 * @param response The http response
 * @param body The body of the message which contains the client json message
 */
validate.validateClientJson = function (response, body, options) {
  assert.equal(response.statusCode, 200);
  var jsonResponse = JSON.parse(body);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.equal(Object.keys(jsonResponse).length, 3);
  assert.equal(jsonResponse.client_id, options.clientId || '4');
  assert.equal(jsonResponse.name, options.name || 'Samplr3');
  assert.deepEqual(jsonResponse.scope, options.scope || ['*']);
};

/**
 * Validates an invalid code error.  The error should be in the form of:
 * {
 *     error: invalid_grant
 *     error_description: invalid_code
 * }
 * @param response The http response
 * @param body The body of the message which contains the error message
 */
validate.validateInvalidCodeError = function (response, body) {
  assert.equal(response.statusCode, 403);
  var jsonResponse = JSON.parse(body);
  assert.equal(response.headers['content-type'], 'application/json');
  assert.equal(Object.keys(jsonResponse).length, 2);
  assert.equal(jsonResponse.error, 'invalid_grant');
  assert.equal(jsonResponse.error_description, 'Invalid authorization code');
};

/**
 * Given an access code, this will validate its length
 * @param code The code to validate the access code against the
 * correct length.
 */
validate.validateAuthorizationCode = function (code) {
  assert.equal(code.length, 16);
};

/**
 * Verifies a CAS ticket is well formed.
 * Specifically: ST-0123456789abcdef
 * @param ticket
 */
validate.validateCasTicket = function (ticket) {
  assert.equal(ticket.length, 19);
  assert.equal(ticket.search(/^S(?:P|T)-/), 0);
};

/**
 * Validates a CAS 1.0 ticket validation response.
 *
 * Validated success format:
 * yes\nusername\n
 *
 * Validated failure format:
 * no\n\n
 */
validate.validateCas1Validation = function (options, response, body) {
  assert.equal(response.statusCode, options.invalid ? 403 : 200);
  var parts = body.split('\n');
  assert.equal(parts.length, 3);
  assert.equal(parts[0], options.invalid ? 'no' : 'yes');
  assert.equal(parts[1], options.invalid ? '' : 'test');
};

/**
 * Validates a CAS 2.0 ticket validation response.
 * Validated success format:
 * <cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
 *   <cas:authenticationSuccess>
 *     <cas:user>username</cas:user>
 *   </cas:authenticationSuccess>
 * </cas:serviceResponse>
 *
 * Validated failure format:
 * <cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
 *   <cas:authenticationFailure code="INVALID_TICKET">
 *     Ticket ST-1856339-aA5Yuvrxzpv8Tau1cYQ7 not recognized
 *   </cas:authenticationFailure>
 * </cas:serviceResponse>
 */
validate.validateCas2Validation = function (options, response, body) {
  var casUser;
  assert.equal(response.statusCode, options.invalid ? 403 : 200);
  // TODO: use a real SOAP parser here
  if (options.invalid) {
    assert.notEqual(/<cas:authenticationFailure code="INVALID_TICKET">/.test(body), -1);
  } else {
    assert.notEqual(/<cas:authenticationSuccess>/.test(body), -1);
    casUser = /<cas:user>(\w*)<\/cas:user>/.exec(body);
    assert.equal(casUser.length, 2);
    assert.equal(casUser[1], 'test');
  }
};

/**
 * Validates a CAS access token.  An access token should be in the form of:
 * access_token=(some 256 characters)&expires_in=3600&token_type=Bearer
 * @param response The http response
 * @param body The body of the message which contains the access token and refresh token
 */
validate.validateCasAccessToken = function (response, body) {
  assert.equal(response.statusCode, 200);
  var formTokens = body.split('&');
  assert.equal(response.headers['content-type'], 'application/x-www-form-urlencoded');
  assert.equal(formTokens.length, 3);
  var token = formTokens[0].split('=');
  assert.equal(token[0], 'access_token');
  assert.equal(token[1].length, 256);
  var expires = formTokens[1].split('=');
  assert.equal(expires[0], 'expires_in');
  assert.equal(expires[1], 3600);
  var type = formTokens[2].split('=');
  assert.equal(type[0], 'token_type');
  assert.equal(type[1], 'Bearer');
};

/**
 * Validates a CAS OAuth2 user json message. It validates against this exact
 * user json message in the form of:
 * {"id":"test","attributes":[{"code":"SUCCESS"}]}
 */
validate.validateCasUserJson = function (response, body) {
  assert.equal(response.statusCode, 200);
  var jsonResponse = JSON.parse(body);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.notEqual(Object.keys(jsonResponse).length, 0);
  assert.equal(jsonResponse.id, 'test');
  assert.deepEqual(jsonResponse.attributes, [{code:'SUCCESS'}]);
};

exports.validate = validate;
