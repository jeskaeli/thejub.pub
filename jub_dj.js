var util = require('util');
var Set = require("collections/set");

function JubDJ(config) {
  this.video_state = {
    id: 'ELAs5Q8Itfs', // TODO different placeholder
    start_time: Date.now()
  };
  this.current_users = new Set();

  console.log("jub.dj: %s", util.inspect(this));

  this.update_video_state = function(new_state) {
    this.video_state = new_state;
    console.log("Update state: %s",
        this.video_state['id'],
        this.video_state['start_time']
    );
  }

  this.emittable_state = function() {
    return {
      id: this.video_state.id,
      start_time: this.video_state.start_time,
      server_time: Date.now(),
    }
  };

  this.clear_users = function() {
    this.current_users.clear();
  };

  this.add_user = function(user, callback) {
    this.current_users.add(user);
    callback(this.current_users.toArray());
  }
}

module.exports = function(config) {
  return new JubDJ(config); //TODO all args
}
