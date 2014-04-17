'use strict';

describe('Service: MeanSsoPrimus', function () {

  // load the service's module
  beforeEach(module('meanSsoApp'));

  // instantiate service
  var MeanSsoPrimus;
  beforeEach(inject(function (_MeanSsoPrimus_) {
    MeanSsoPrimus = _MeanSsoPrimus_;
  }));

  it('should do something', function () {
    expect(!!MeanSsoPrimus).toBe(true);
  });

});
