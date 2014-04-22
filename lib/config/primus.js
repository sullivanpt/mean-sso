/**
 * Configure Primus WebSocket API.
 * See https://github.com/primus/primus
 *
 * Currently configured to use Engine.io.
 * See https://github.com/LearnBoost/engine.io
 *
 * Creates an event handler such that redisPubsubEmitter.publish('user:' + user._id, payload) gets published
 * to every connection by that user.  We expect payload to be an object that includes a 'uri' field defining its
 * intended destination and message structure.
 *
 * Currently ignores incoming data and anonymous connections.
 */

'use strict';

var Primus = require('primus'),
  express = require('express'),
  session = require('./session'),
  passport = require('passport'),
  securityPolicy = require('./security-policy'),
  http = require('http'),
  config = require('./config'),
  configExpose = require('./config-expose'),
  redisPubsubEmitter = require('./redis-pubsub-emitter');


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
    enable: 'auth', // can be false, true, or 'auth' to use only for authenticated users
    url: config.rootUrl, // can be used to offload WebSockets on secondary servers
    library: '/primus/primus.js'
  };

  /**
   * for authentication we support session cookies or bearer tokens.
   * If we signal an error here the 'connect' event never fires for this WS.
   *
   * If a bearer token is available on the client we expect it as query.access_token.
   * Or if a session cookie is available we use it.
   * FYI: Don't be confused, the engineio query.sid is something else altogether.
   *
   * During authentication req.prop is later available as spark.request.prop.
   * See https://github.com/primus/primus/issues/84
   *
   * The following code mimics the session middleware in express.js such that the spar.request object
   * mirrors the authentication structure for 'normal' web requests.
   *
   * For inspiration see (supports cookie sessions only):
   * https://github.com/jfromaniello/passport.socketio/blob/master/lib/index.js
   */
  primus.authorize(function (req, done) {
    var res = new http.OutgoingMessage(); // TODO: get access to our caller's res object instead of this stupid stub
    res.set = function () {}; // stub
    res.send = function () { done('not authenticated'); }; // stub
    res.end = function () { done('not authenticated'); }; // stub
    // note: as res.send is not defined we throw an exception from some auth methods
    var routes = [
      express.cookieParser(),
      session.cookieSession,
      passport.initialize()
    ].concat(
        // note: we make an assumption that the return type is an array of handlers
        securityPolicy.enforceSocket(configExpose.primus.enable === true ? 'anonUserApi' : 'knownUserApi')
    );
    var route;
    // snarfed and edited from Router.prototype._dispatch in node_modules/express/lib/router/index.js
    // assume there are no error handlers in the route stack
    try {
      (function pass(i) {
        route = routes[i];
        if (!route) { return done(); }
        route(req, res, function (err) {
          if (err) { return done('not authenticated'); }
          pass(i+1);
        });
      })(0);
    } catch (err) {
      return done(err);
    }
  });

  /**
   * Register a notification handler on WebSocket connect to forward new user messages to the client.
   *
   * More complicated than we'd like because one user may open multiple connections.
   * To work around this we keep a map of open connections by user
   */
  var userSparks = {};
  primus.on('connection', function (spark) {
    console.log('New WS connection as user', spark.request.user && spark.request.user._id);
    function userHandler(payload, topic) {
      console.log('Sending WS', topic, payload);
      // forwards event payload to every user client. We could do clever things here like filter on client scope.
      userSparks[topic].forEach(function (sparkId) {
        primus.spark(sparkId).write(payload);
      });
    }
    if (spark.request.user) {
      var userEvent = 'user:' + spark.request.user._id;
      if (!userSparks[userEvent])
      {
        // first connection to this server by this user
        userSparks[userEvent] = [spark.id];
        redisPubsubEmitter.on(userEvent, userHandler);
      } else {
        // additional connection by same user
        // TODO: consider limiting number of connections from a single user
        userSparks[userEvent].push(spark.id);
      }
      spark.on('end', function () {
        console.log('Lost WS', userEvent, userSparks[userEvent].length);
        userSparks[userEvent] = userSparks[userEvent].filter(function (sparkId) { return sparkId !== spark.id; });
        if (!userSparks[userEvent].length) {
          // removed final connection by this user
          redisPubsubEmitter.removeListener(userEvent, userHandler);
          delete userSparks[userEvent];
        }
      });
      // ignore received data for now
      // spark.on('data', function message(data) {
      //   console.log('WS received', data);
      // });
      // disconnect handler on WS disconnect
    }
  });

  return primus;
};