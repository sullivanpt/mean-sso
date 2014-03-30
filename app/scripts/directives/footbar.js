'use strict';

angular.module('meanSsoApp')
  .directive('footbar', function () {
    return {
      templateUrl: 'partials/footbar',
      restrict: 'E'
    };
  });
