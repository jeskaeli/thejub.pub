require('../lib/logging')(null, null, '-', '-');
var path = require('path');
var config = require('../test/config');
var record = require('../test/record');
var gapi = require('../lib/gapi')(config);
var recorder = record(path.basename(__filename, '.js'));

recorder.test(function(done) {
  gapi.video_search('epic ff8 medley', function(result) {
    console.log('Results:', result.length);
    console.log('First result:', result[0]);
    done();
  });
});
