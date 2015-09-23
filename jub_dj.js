var util = require('util');

function JubDJ(init_state) {
  this.state = init_state;

  console.log("jub.dj: %s", util.inspect(this));

  this.update_state = function(msg) {
    console.log("Update state: %s", msg);
  }
}

module.exports = function(state) {
  return new JubDJ(state); //TODO all args
}
