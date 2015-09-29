var util = require('util');

function JubDJ(config) {
  this.video_state = {
    id: 'ELAs5Q8Itfs',
    start_time: Date.now()
  };

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
}

module.exports = function(config) {
  return new JubDJ(config); //TODO all args
}
