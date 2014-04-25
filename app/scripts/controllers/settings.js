'use strict';

angular.module('meanSsoApp')
  .controller('SettingsCtrl', function ($scope, Auth, MeanSsoApi, cloudinaryApi) {
    $scope.errors = {};

    cloudinaryApi.get({}, function (value) {
      $scope.cloudinaryData = {
        formData: angular.fromJson(angular.toJson(value)), // strip $get. http://stackoverflow.com/a/20713104
        start: function () { $scope.message = 'Uploading image...'; },
        done: function (e,data) {
         /*jshint camelcase: false */
          $scope.persona.avatarID = data.result.public_id;
          $scope.message = '';
        }
      };
    }, function (err) {
      console.log('ERROR', err);
    });

    MeanSsoApi.mePersonae.query(function (values) {
      if(!$scope.persona && values.length) {
        $scope.persona = values[0];
      }
    });

    $scope.createPersona = function () {
      $scope.persona = { alias: $scope.currentUser.name };
    };

    $scope.deletePersona = function () {
      if ($scope.persona.id) {
        MeanSsoApi.mePersonae.delete({ personaID: $scope.persona.id })
          .$promise.then( function() {
            $scope.persona = null;
          })
          .catch( function() {
            $scope.errors.other = 'Unable to delete';
          });
      } else {
        $scope.persona = null;
      }
    };

    $scope.changePersona = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        MeanSsoApi.mePersonae[$scope.persona.id ? 'update' : 'save']($scope.persona)
          .$promise.then( function(value) {
            $scope.persona = value;
            $scope.message = 'Profile successfully changed.';
          })
          .catch( function() {
            $scope.errors.other = 'Unable to save';
          });
      }
    };

    $scope.changePassword = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.changePassword( $scope.user.oldPassword, $scope.user.newPassword )
        .then( function() {
          $scope.message = 'Password successfully changed.';
        })
        .catch( function() {
          form.password.$setValidity('mongoose', false);
          $scope.errors.other = 'Incorrect password';
        });
      }
		};
  });
