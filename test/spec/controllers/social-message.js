'use strict';

describe('Controller: SocialMessageCtrl', function () {

  // load the controller's module
  beforeEach(module('meanSsoApp'));

  var SocialMessageCtrl,
    scope,
    $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api2/personae')
      .respond({ id: '456', alias: 'jane doe'});
    $httpBackend.expectGET('/api2/me/personae')
      .respond({ id: '123', alias: 'john doe'});
    scope = $rootScope.$new();
    SocialMessageCtrl = $controller('SocialMessageCtrl', {
      $scope: scope
    });
  }));

  it('should attach two personae to the scope', function () {
    expect(scope.persona).toBeUndefined();
    expect(scope.other).toBeUndefined();
    $httpBackend.flush();
    expect(scope.persona.id).toBe('123');
    expect(scope.other.id).toBe('456');
  });
});
