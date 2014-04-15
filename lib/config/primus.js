/**
 * Configure Primus WebSocket API.
 * See https://github.com/primus/primus
 *
 * Currently configured to use Engine.io.
 * See https://github.com/LearnBoost/engine.io
 */

'use strict';

var Primus = require('primus'),
  config = require('./config'),
  configExpose = require('../config/config-expose');


// See https://github.com/primus/primus#how-do-i-use-primus-with-express-3
module.exports = function (server) {
  var primus = new Primus(server, { transformer: 'engine.io' });

  /**
   * Exporting WebSocket configuration to our clients.
   *
   * PrimusJS is built on the incorrect assumption that our client is tightly coupled to our server's build
   * process, which would make it easy to export and process the client JS include.  However, in our case we have
   * multiple loosely coupled clients so a static bower include would be preferable.  The short term solution
   * here is to leverage PrimusJS's test harness and dynamic JS loading.
   * TODO: figure out some tooling to make this less painful.
   */
  configExpose.primus = {
    library: '/primus/primus.js'
  };

  // TODO: remove this dummy handler
  primus.on('connection', function (spark) {
    console.log('New WS connection');
    spark.write('Hello WS!');
    spark.on('data', function message(data) {
      console.log('WS received ', data);
    });
  });

  return primus;
};