'use strict';

describe('Directive: navbar', function () {

  // load the directive's module
  beforeEach(module('meanSsoApp'));

  var $httpBackend,
    element,
    scope;

  beforeEach(inject(function ($rootScope, $injector) {
    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.expectGET('partials/navbar').
      respond('<div>mocked</div>');
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<navbar></navbar>');
    element = $compile(element)(scope);
    $httpBackend.flush();
    expect(element.text()).toBe('mocked');
  }));
});
