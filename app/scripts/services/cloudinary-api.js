'use strict';

angular.module('meanSsoApp')
  .factory('cloudinaryApi', function ($resource) {
    /**
     * GET retrieve a token authorizing a single cloudinary image upload.
     * See https://github.com/jbcpollak/cloudinary_angular
     */
    return $resource('/api2/images/signrequest');
  });