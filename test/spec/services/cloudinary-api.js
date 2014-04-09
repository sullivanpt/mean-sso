'use strict';

describe('Service: cloudinaryApi', function () {

  // load the service's module
  beforeEach(module('meanSsoApp'));

  // instantiate service
  var cloudinaryApi;
  beforeEach(inject(function (_cloudinaryApi_) {
    cloudinaryApi = _cloudinaryApi_;
  }));

  it('should do something', function () {
    expect(!!cloudinaryApi).toBe(true);
  });

});
