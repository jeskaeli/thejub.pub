require('../lib/logging')(null, null, '-', '-');
var path = require('path');
var config = require('../test/config');
var record = require('../test/record');
var gapi = require('../lib/gapi')(config);
var recorder = record(path.basename(__filename, '.js'));

recorder.test(function(done) {
  gapi.one_image_link('dry meal', function(link) {
    console.log('One link result:', link);
    done();
  });
});
