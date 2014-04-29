'use strict';

angular.module('meanSsoApp')
  .directive('navbar', function () {
    return {
      templateUrl: 'partials/navbar',
      restrict: 'E',
      controller: function ($scope, $location) {
        $scope.menu = [{
          'title': 'Home',
          'link': '/'
        }, {
          'title': 'Social',
          'link': '/social'
        }, {
          'title': 'Settings',
          'link': '/settings'
        }];

        $scope.isActive = function(route) {
          return route === $location.path();
        };
      }
    };
  });
