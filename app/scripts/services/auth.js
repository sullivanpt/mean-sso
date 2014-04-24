'use strict';

angular.module('meanSsoApp')
  .factory('Auth', function Auth($location, $rootScope, MeanSsoApi, MeanSsoPrimus, $cookieStore, $window) {
    
    // Get currentUser from cookie
    $rootScope.currentUser = $cookieStore.get('user') || null;
    $cookieStore.remove('user');
    if ($rootScope.currentUser) {
      MeanSsoPrimus.setUserAuthorizationHeader('cookie');
    } else {
      MeanSsoPrimus.setUserAuthorizationHeader();
    }

    return {

      /**
       * Authenticate user
       * 
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}            
       */
      login: function(user, callback) {
        var cb = callback || angular.noop;

        return MeanSsoApi.session.save({
          email: user.email,
          password: user.password
        }, function(user) {
          MeanSsoPrimus.setUserAuthorizationHeader('cookie');
          if (user.redirectTo) {
            // inline signal to the client that a redirect is required
            $window.location = user.redirectTo;
          } else {
            $rootScope.currentUser = user;
          }
          return cb();
        }, function(err) {
          return cb(err);
        }).$promise;
      },

      /**
       * Unauthenticate user
       * 
       * @param  {Function} callback - optional
       * @return {Promise}           
       */
      logout: function(callback) {
        var cb = callback || angular.noop;

        return MeanSsoApi.session.delete(function() {
            MeanSsoPrimus.setUserAuthorizationHeader();
            $rootScope.currentUser = null;
            return cb();
          },
          function(err) {
            return cb(err);
          }).$promise;
      },

      /**
       * Create a new user
       * 
       * @param  {Object}   user     - user info
       * @param  {Function} callback - optional
       * @return {Promise}            
       */
      createUser: function(user, callback) {
        var cb = callback || angular.noop;

        return MeanSsoApi.users.save(user,
          function(user) {
            MeanSsoPrimus.setUserAuthorizationHeader('cookie');
            $rootScope.currentUser = user;
            return cb(user);
          },
          function(err) {
            return cb(err);
          }).$promise;
      },

      /**
       * Change password
       * 
       * @param  {String}   oldPassword 
       * @param  {String}   newPassword 
       * @param  {Function} callback    - optional
       * @return {Promise}              
       */
      changePassword: function(oldPassword, newPassword, callback) {
        var cb = callback || angular.noop;

        return MeanSsoApi.users.update({
          oldPassword: oldPassword,
          newPassword: newPassword
        }, function(user) {
          return cb(user);
        }, function(err) {
          return cb(err);
        }).$promise;
      },

      /**
       * Gets all available info on authenticated user
       * 
       * @return {Object} user
       */
      currentUser: function() {
        return MeanSsoApi.users.get();
      },

      /**
       * Simple check to see if a user is logged in
       * 
       * @return {Boolean}
       */
      isLoggedIn: function() {
        var user = $rootScope.currentUser;
        return !!user;
      }
    };
  });