/**
 * Provides configuration data about the parent MeanSso server to the angular app.
 * This data is passed to the app using a global JS variable on the index.html page.
 */
'use strict';

angular.module('meanSsoApp')
  .service('MeanSsoConfig',  function MeanSsoConfig($window, $http, $rootScope) {
    if ($window.MEANSSO_CONFIG) { // leave undefined if no config data present
      $rootScope.MeanSsoConfig = this; // make config globally available to views
      var that = this;

      var decoded = JSON.parse($window.MEANSSO_CONFIG);

      this.providers = decoded.providers;
      this.hasProvider = function (provider) {
        return that.providers.indexOf(provider) !== -1;
      };

      $http.get('version.json').success(function(version) {
        that.version = version;
      });
    }
  });