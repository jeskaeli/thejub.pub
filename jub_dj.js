var util = require('util');
var Set = require("collections/set");

function JubDJ(config, youtube, chat) {
  this.youtube = youtube;
  this.chat = chat;
  this.video_state = {
    id: 'ELAs5Q8Itfs', // TODO different placeholder
    start_time: Date.now(),
    user: this.chat.bot.name
  };
  this.current_users = new Set();
  this.broadcast = function() {}; // This will be set later by the socketeer

  this.update_video_state = function(new_state) {
    this.video_state = new_state;

    // let chat do what it pleases with the new state
    this.chat.new_video_state(new_state);

    console.log("Updated video state: %s",
        this.video_state['user'],
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
    this.current_users.add(this.chat.bot.name);
  };

  this.add_user = function(user, callback) {
    this.current_users.add(user);
    callback(this.current_users.toArray());
  }

  this.video_search = function(query, callback) {
    this.youtube.video_search(query, callback);
  }

  this.new_chat_message = function(query, callback) {
    this.chat.new_chat_message(query, callback);
  }

  this.set_broadcast_callback = function(callback) {
    this.broadcast = callback;
    this.chat.set_broadcast_callback(callback);
  }
}

module.exports = function(config, youtube, chat) {
  return new JubDJ(config, youtube, chat);
}
