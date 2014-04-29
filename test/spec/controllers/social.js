'use strict';

describe('Controller: SocialCtrl', function () {

  // load the controller's module
  beforeEach(module('meanSsoApp'));

  var SocialCtrl,
    scope,
    $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api2/me/personae')
      .respond([{ id: '123', alias: 'john doe'}]);
    scope = $rootScope.$new();
    SocialCtrl = $controller('SocialCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.persona).toBeUndefined();
    $httpBackend.flush();
    expect(scope.persona.id).toBe('123');
  });
});
