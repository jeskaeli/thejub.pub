var path = require('path');
var jub = require('../lib/jub');
var config = require('../test/config');
var record = require('../test/record');
var request = require('request');

gapi = require('../lib/gapi')(config);

require('console-stamp')(console, { pattern : "-" });
var recorder = record(path.basename(__filename, '.js'));

recorder.test(function(done) {
  console.log('making request');
  gapi.video_search('epic ff8 medley', function(result) {
    console.log('Results:', result.length);
    console.log('First result:', result[0]);
    console.log('done');
    done();
  });
});
