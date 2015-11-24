// Set env var NOCK_RECORD to rerecord fixtures.
//
// inspired by https://github.com/garbados/mocha_nock_demo

var _nock = require('nock');
var shell = require('shelljs');
var path = require('path');
var fs = require('fs');

module.exports = function (name, options) {
  // options tell us where to store our fixtures
  options = options || {};
  var fixtures_dir = options.fixtures_dir || path.join('test', 'fixtures');
  var fixture_path = path.join(fixtures_dir, name + '.js');

  // NOCK_RECORD indicates that we should rerecord the fixtures.
  var record = !!process.env.NOCK_RECORD;

  return {
    test: function (test_fn) {
      try {
        var st = fs.statSync(fixture_path);
      } catch (e) {
        if (e.code == 'ENOENT')
          record = true;
        else
          throw e;
      }
      if (record) {
        _nock.recorder.rec({
          dont_print: true,
        });
      } else {
        require('../' + fixture_path);
      }

      // Run the test
      test_fn(function() {

        // Save the recording if we're recording
        if (record) {
          var fixtures = _nock.recorder.play();
          var text = "var nock = require('nock');\n" + fixtures.join('\n');
          shell.mkdir('-p', fixtures_dir);
          fs.writeFile(fixture_path, text);
        }
      });
    }
  }
}
