'use strict';

describe('Service: MeanSsoConfig', function () {

  // load the service's module
  beforeEach(module('meanSsoApp', function($provide) {
    $provide.decorator('$window', function ($delegate) {
      $delegate.MEANSSO_CONFIG = '{"providers":["facebook","twitter"],"version":{"revision":"123abcd","date":"2014-02-30T12:16:45"}}';
      return $delegate;
    });
  }));

  // instantiate service
  var MeanSsoConfig;
  beforeEach(inject(function (_MeanSsoConfig_) {
    MeanSsoConfig = _MeanSsoConfig_;
  }));

  it('should initialize providers', function () {
    expect(MeanSsoConfig.providers).toEqual(['facebook','twitter']);
  });

  it('should initialize version.revision', function () {
    expect(MeanSsoConfig.version.revision).toBe('123abcd');
  });
});
