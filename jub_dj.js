var util = require('util');

function JubDJ(config) {
  this.state = {};

  console.log("jub.dj: %s", util.inspect(this));

  this.update_state = function(msg) {
    console.log("Update state: %s", msg);
  }
}

module.exports = function(config) {
  return new JubDJ(config); //TODO all args
}
