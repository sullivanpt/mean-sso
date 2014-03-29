'use strict';

describe('Service: MeanSsoConfig', function () {

  // load the service's module
  beforeEach(module('meanSsoApp', function($provide) {
    $provide.decorator('$window', function ($delegate) {
      $delegate.MEANSSO_CONFIG = '{"providers":["facebook","twitter"]}';
      return $delegate;
    });
  }));

  // instantiate service
  var $httpBackend,
    MeanSsoConfig;
  beforeEach(inject(function (_$httpBackend_, _MeanSsoConfig_) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('version.json')
      .respond({revision:'123abcd',date:'2014-02-30T12:16:45'});
    MeanSsoConfig = _MeanSsoConfig_;
  }));

  it('should initialize providers', function () {
    expect(MeanSsoConfig.providers).toEqual(['facebook','twitter']);
  });

  it('should initialize version.revision', function () {
    $httpBackend.flush();
    expect(MeanSsoConfig.version.revision).toBe('123abcd');
  });
});
