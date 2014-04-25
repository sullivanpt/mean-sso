'use strict';

angular.module('meanSsoApp')
  .service('MeanSsoApi', function MeanSsoApi($resource) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    this.users = $resource('/api/users/:id', {
      id: '@id'
    }, { //parameters default
      update: {
        method: 'PUT',
        params: {}
      },
      get: {
        method: 'GET',
        params: {
          id:'me'
        }
      }
    });

    this.session =  $resource('/api/session/');

    this.mePersonae = $resource('/api2/me/personae/:personaID', {
      personaID: '@id'
    }, {
      update: { method: 'PUT' }
    });
    this.personae = $resource('/api2/personae/:personaID');
  });
