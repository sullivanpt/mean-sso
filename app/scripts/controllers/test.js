'use strict';

angular.module('meanSsoApp')
  .controller('TestCtrl', function ($scope, cloudinaryApi) {
    cloudinaryApi.get({}, function (value) {
      // value: {timestamp: 1397009646, transformation: "c_limit,h_500,w_500", format: "jpg", signature: "885e150c7f5a7cbd0ea565442df72d91869635e5", api_key: "511551256285167"}
      console.log('SUCCESS ', value);
      $scope.cloudinaryData = {
        formData: angular.fromJson(angular.toJson(value)), // strip $get. http://stackoverflow.com/a/20713104
        start: function () { console.log('start'); },

        // data.progress(): {loaded: 98182, total: 606654, bitrate: 1182915.6626506024}
        progress: function (e,data) { console.log('progress',data.progress()); },

        // data.result: { created_at: "2014-04-09T02:14:16Z"
        // etag: "b6eaf32af5de8cd545fefffb603ae51d"
        // format: "jpg"
        // height: 281
        // path: "v1397009656/ltuybqzknf4pwlxsqs9d.jpg"
        // public_id: "ltuybqzknf4pwlxsqs9d"
        // resource_type: "image"
        // secure_url: "https://res.cloudinary.com/hiielvrur/image/upload/v1397009656/ltuybqzknf4pwlxsqs9d.jpg"
        // signature: "155e35b7da81eb299d182624633c75e35ba13d16"
        // type: "upload"
        // url: "http://res.cloudinary.com/hiielvrur/image/upload/v1397009656/ltuybqzknf4pwlxsqs9d.jpg"
        // version: 1397009656
        // width: 500 }
        done: function (e,data) { console.log('done',data.result); }
      };
    }, function (err) {
      console.log('ERROR', err);
    });
  });
