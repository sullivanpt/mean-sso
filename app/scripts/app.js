'use strict';

angular.module('meanSsoApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'cloudinary'
])
  .config(function ($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl'
      })
      .when('/login', {
        templateUrl: 'partials/login',
        controller: 'LoginCtrl'
      })
      .when('/signup', {
        templateUrl: 'partials/signup',
        controller: 'SignupCtrl'
      })
      .when('/settings', {
        templateUrl: 'partials/settings',
        controller: 'SettingsCtrl',
        authenticate: true
      })
      .when('/social', {
        templateUrl: 'partials/social',
        controller: 'SocialCtrl',
        authenticate: true
      })
      .when('/test', {
        templateUrl: 'partials/test',
        controller: 'TestCtrl'
      })
      .when('/social-message', {
        templateUrl: 'partials/social-message',
        controller: 'SocialMessageCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
      
    $locationProvider.html5Mode(true);
      
    // Intercept 401s and redirect you to login
    $httpProvider.interceptors.push(['$q', '$location', function($q, $location) {
      return {
        'responseError': function(response) {
          if(response.status === 401) {
            $location.path('/login');
            return $q.reject(response);
          }
          else {
            return $q.reject(response);
          }
        }
      };
    }]);
  })
  .run(function (MeanSsoConfig, MeanSsoPrimus) {/*jshint unused:false*/}) // forcing config and notify services to load
  .run(function ($rootScope, $location, Auth) {

    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$routeChangeStart', function (event, next) {
      
      if (next.authenticate && !Auth.isLoggedIn()) {
        $location.path('/login');
      }
    });
  });