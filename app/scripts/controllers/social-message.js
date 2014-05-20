'use strict';

angular.module('meanSsoApp')
  .controller('SocialMessageCtrl', function ($scope, MeanSsoApi, $routeParams, $q) {
    // in this demo the two conversation participants are passed in via query params
    $q.all([
        MeanSsoApi.personae.get({ personaID: $routeParams.o }).$promise,
        MeanSsoApi.mePersonae.get({ personaID: $routeParams.p }).$promise
      ]).then(function (values) {
        $scope.other = values[0];
        $scope.persona = values[1];

        // install web-socket message handler
        $scope.$on('primus', function (evt, data) {
          if (data.to === $scope.persona.id && data.actor === $scope.other.id && data.actor !== $scope.persona.id) {
            $scope.messages.unshift(data);
          }
        });
      }).catch(function (err) {
        console.log('error', err);
      });

    $scope.messages = [];
    $scope.sendMessage = function () {
      var msg = { text: $scope.message.text, actor: $scope.persona.id, to: $scope.other.id };
      $scope.message.text = null;
      $scope.messages.unshift(msg); // display message locally
      MeanSsoApi.messages.save(msg, function (value) {
        msg.id = value.id; // marks the message as successfully saved
      }, function (err) {
        console.log('error', err);
      });
    };
  });
