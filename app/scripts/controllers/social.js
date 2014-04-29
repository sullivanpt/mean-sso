'use strict';

angular.module('meanSsoApp')
  .controller('SocialCtrl', function ($scope, $location, MeanSsoApi) {

    // select and display the active persona
    MeanSsoApi.mePersonae.query(function (values) {
      if(!$scope.persona && values.length) {
        $scope.persona = values[0];
      } else {
        // confusing but functional, shunt users without a persona off to the settings page
        $location.path('/settings');
      }
    });

    // implement user search by name or bio
    $scope.searchPersona = function (form) {
      $scope.search.found = null;
      if (form.$valid) {
        MeanSsoApi.personae.query({ bio: $scope.search.terms })
          .$promise.then(function (values) {
            console.log('success', values);
            $scope.search.found = values;
          }).catch(function (err) {
            console.log('error', err);
          });
      }
    };
  });
