var path = require('path');
var jub = require('../lib/jub');
var config = require('../config');
var record = require('../test/record');
var request = require('request');

//app.models = require('./lib/models')(config, app.auth);
//app.db = require('./lib/db')(config, app.models);
//app.gapi = require('./lib/gapi')(config); // doesn't need to be an app member
//app.bot = require('./lib/bot')(config, app.gapi);
//app.chat = require('./lib/chat')(config, app.bot);
//app.jub = require('./lib/jub')(config, app.gapi, app.chat, app.db);

process.env.TEST = true;
gapi = require('../lib/gapi')(config);

require('console-stamp')(console, { pattern : "-" });
var recorder = record(path.basename(__filename, '.js'));

recorder.test(function() {
  done = false;

  console.log('making request');
  gapi.video_search('katamari', function(result) {
    console.log(result);
    console.log('done');
    done = true;
  });

  var wait = function() {
    setTimeout(function() {
      if (!done) {
        wait();
      }
    }, 300);
  }
  wait();
});
