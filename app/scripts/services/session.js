'use strict';

angular.module('meanSsoApp')
  .factory('Session', function ($resource) {
    return $resource('/api/session/');
  });
