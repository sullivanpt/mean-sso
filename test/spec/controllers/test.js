'use strict';

describe('Controller: TestCtrl', function () {

  // load the controller's module
  beforeEach(module('meanSsoApp'));

  var TestCtrl,
    scope,
    $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api2/images/signrequest')
      .respond({ dummy: 'data' });
    scope = $rootScope.$new();
    TestCtrl = $controller('TestCtrl', {
      $scope: scope
    });
  }));

  it('should attach cloudinaryData to the scope', function () {
    expect(scope.cloudinaryData).toBeUndefined();
    $httpBackend.flush();
    expect(scope.cloudinaryData).toBeTruthy();
  });
});
