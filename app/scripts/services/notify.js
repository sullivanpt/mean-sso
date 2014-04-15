/**
 * WebSocket notification receiver.
 *
 * Currently built directly on the primus.js client library. There are few existing libraries right now
 * but I'm skipping them for now as they don't allow lazy loading the server url or client library.
 */
'use strict';

angular.module('meanSsoApp')
  .service('Notify', function Notify($rootScope, $window) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    $rootScope.Notify = this;
    var self = this;

    // wait until configuration data is available
    $rootScope.$watch('MeanSsoConfig.primus', function (value) {
      if (value) {
        // TODO: use requireJS or $scriptJS to load the client library. right now we assume pre-loaded

        self._primus = new $window.Primus(); // TODO: options and URL

        // install event handlers. TODO: finish these
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
          $rootScope.$apply();
        });

        // test send
        self._primus.write('Hello from a client');

        // self._primus.end();
      }
    });
  });
