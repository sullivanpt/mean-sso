'use strict';

describe('Directive: footbar', function () {

  // load the directive's module
  beforeEach(module('meanSsoApp'));

  var $httpBackend,
    element,
    scope;

  beforeEach(inject(function ($rootScope, $injector) {
    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.expectGET('partials/footbar').
      respond('<div>mocked</div>');
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<footbar></footbar>');
    element = $compile(element)(scope);
    $httpBackend.flush();
    expect(element.text()).toBe('mocked');
  }));
});
