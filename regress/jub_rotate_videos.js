require('../lib/logging')(null, null, '-', '-');
var config = require('../test/config');

// Set up dependencies, with mocks
var gapi = (function() {
  return {
    one_image_link: function(query, cb) {
      console.log('gapi image search:', query);
      cb([ { link: 'http://pretend.image' } ]);
    },
    shorten_url: function(long_url, cb) {
      console.log('shorten url:', long_url);
      cb('http://pretend.shortened');
    },
  };
})();

var bot = require('../lib/bot')(config, gapi);
var chat = require('../lib/chat')(config, bot);

var db = (function() {
  return {
    // DB Mocks go here
  };
})();

var jub = require('../lib/jub')(config, gapi, chat, db);
jub.stop();
