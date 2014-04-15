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
      angular.extend(this, decoded);

      /**
       * Helper to test if a provider is enabled
       */
      this.hasProvider = function (provider) {
        return that.providers.indexOf(provider) !== -1;
      };

      // Initialize jquery cloudinary
      if ($window.$ && $window.$.cloudinary && decoded.cloudinary) {
        $window.$.cloudinary.config(decoded.cloudinary);
      }
    }
  });