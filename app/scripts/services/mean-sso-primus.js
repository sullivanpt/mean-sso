/**
 * WebSocket notification receiver.
 *
 * Currently built directly on the primus.js client library. There are few existing libraries right now
 * but I'm skipping them for now as they don't allow lazy loading the server url or client library.
 */
'use strict';

angular.module('meanSsoApp')
  .service('MeanSsoPrimus', function MeanSsoPrimus(MeanSsoConfig, $rootScope, $window) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    $rootScope.MeanSsoPrimus = this;
    var self = this;
    var authenticated,
      accessToken;

    /**
     * Helper to build the authorization query string
     */
    function buildAuthorizationQuery() {
      if (accessToken) {
        return '?access_token=' + accessToken;
      }
      return '';
    }

    /**
     * Build a new WebSocket connection, end the previous one if present
     */
    function newConnection() {
      if (!self.ready) { return; }

      if (self._primus) {
        self._primus.end();
        self._primus = null;
      }

      if (!MeanSsoConfig.primus.enable) { return; }
      if (MeanSsoConfig.primus.enable === 'auth' && !authenticated) { return; }

      // construct a new connection
      self._primus = new $window.Primus(MeanSsoConfig.primus.url + buildAuthorizationQuery());

      // install event handlers. TODO: finish these. See https://github.com/james-huston/angular-provider-engineio/blob/master/src/angular-provider-engineio.js
      self._primus.on('data', function message(data) {
        console.log('Received a new message from the server', data);
      });

      self._primus.on('open', function open() {
        console.log('Connection is alive and kicking');
        self.connected = true;
        $rootScope.$apply();
      });

      self._primus.on('error', function error(err) {
        console.error('Something horrible has happened', err, err.message);
      });

      // self._primus.on('reconnect', function () {
      //   console.log('Reconnect attempt started');
      // });

      self._primus.on('reconnecting', function (opts) {
        console.log('Reconnecting in %d ms', opts.timeout);
        console.log('This is attempt %d out of %d', opts.attempt, opts.retries);
        self.connected = false;
        $rootScope.$apply();
      });

      self._primus.on('end', function () {
        console.log('Connection closed');
        self.connected = false;
        // $rootScope.$apply(); -- we close this synchronously above
      });

      // test send
      self._primus.write('Hello from a client');
    }

    /**
     * Set or clear the authorization header to be sent with WebSockets.
     * Note that this call destroys any previous WebSocket connection.
     * Supported types: 'Bearer' (token), 'cookie' a session cookie of an authenticated user, null an anonymous session cookie
     */
    this.setUserAuthorizationHeader = function (type, arg1) {
      switch (type) {
      case 'bearer':
        accessToken = arg1;
        authenticated = true;
        break;
      case 'cookie':
        accessToken = null;
        authenticated = true;
        break;
      default:
        accessToken = null;
        authenticated = false;
        break;
      }
      newConnection();
    };

    // wait until configuration data is available
    $rootScope.$watch('MeanSsoConfig.primus', function (value) {
      if (value) {
        // TODO: use requireJS or $scriptJS to load the client library. right now we assume pre-loaded
        // or better yet, write the client library to a repo and pull it in with bower.
        self.ready = true;
        newConnection();
      }
    });
  });
