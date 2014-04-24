'use strict';

describe('Service: MeanSsoApi', function () {

  // load the service's module
  beforeEach(module('meanSsoApp'));

  // instantiate service
  var MeanSsoApi;
  beforeEach(inject(function (_MeanSsoApi_) {
    MeanSsoApi = _MeanSsoApi_;
  }));

  it('should do something', function () {
    expect(!!MeanSsoApi).toBe(true);
  });

});
