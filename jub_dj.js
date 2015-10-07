var util = require('util');
var Set = require("collections/set");
var Deque = require("collections/deque");
var moment = require("moment");

function JubDJ(config, youtube, chat) {
  var youtube = youtube;
  var chat = chat;
  var video_state = {
    start_time: Date.now(),
    duration: 0
  }
  var video_queue = Deque();
  var current_users = new Set();
  var broadcast = function() {}; // This will be set later by the socketeer
  var jub = this;

  var periodic_task = function() {
    if (Date.now() > video_state['start_time'] + video_state['duration']) {
      if (video_queue.length > 0) {
        var next_video = video_queue.pop();
        next_video.start_time = Date.now();
        console.log('starting next video:', next_video['id']);
        jub.update_video_state(next_video);
        broadcast('video state', jub.emittable_video_state()); //TODO weird
        broadcast('queue', jub.emittable_queue_state());
      }
    }
  }

  // periodically check the time so we can start the next video when it's time
  setInterval(periodic_task, 1000);

  // Add a video to the front of the queue. As of now, the objext doesn't have
  // a duration or a title -- we'll fetch those when we pop the video off
  this.enqueue_video = function(video_obj, callback) {
    // These should really be one call/request
    youtube.video_specs(video_obj, function(obj) {
      if (obj.title && obj.duration) {
        video_queue.unshift(video_obj);
        console.log('enqueued video:', util.inspect(video_obj));
        broadcast('queue', jub.emittable_queue_state());
      } else {
        console.log('failed to find info for video', video_obj.id);
      }
    });
  }

  // Add an entire playlist to the queue
  this.enqueue_playlist = function(playlist_obj) {
    console.log('enqueued playlist:', util.inspect(playlist_obj));
    youtube.playlist(playlist_obj.id, function(video_list) {
      for (video_obj of video_list) {
        video_obj.user = playlist_obj.user;
        jub.enqueue_video(video_obj);
      }
    });
  }

  // There can be races here - if two people dequeue at the same time, one of
  // them will 'win' the race and get back to the clients first. Then the next
  // one, which won't include the change the first one made, will finish and
  // *that* is the version that clients will end up with.
  this.dequeue_video = function(user, callback) {
    var new_queue = Deque();
    var queue_copy = video_queue.toArray();
    var found = false;
    while (queue_copy.length > 0) {
      var temp_item = queue_copy.shift();
      if (temp_item.user == user && !found) {
        console.log('dequeued:', temp_item);
        found = true;
      } else {
        // we started at the oldest so load up new queue end-to-start
        new_queue.push(temp_item);
      }
      video_queue = new_queue;
    }
    broadcast('queue', jub.emittable_queue_state());
  }

  this.video_skipped = function(user) {
    video_state.duration = 0;
    chat.video_skipped(user);
  }

  // TODO maybe this function should also broadcast
  this.update_video_state = function(new_state) {
    video_state = new_state;
    chat.video_started(new_state);
    console.log("Updated video state: %s",
                util.inspect(video_state));
  }

  this.emittable_video_state = function() {
    return {
      id: video_state.id,
      title: video_state.title,
      start_time: video_state.start_time,
      server_time: Date.now(),
    }
  }

  this.emittable_queue_state = function() {
    return video_queue.toArray();
  }

  this.clear_users = function() {
    current_users.clear();
    current_users.add(chat.bot.name);
  };

  // Kinda weird that this fn has some knowledge about what the caller is going
  // to do next, but on the other hand the caller needs to pass in a callback
  // so that it can do its next task with the up-to-date data.
  this.add_user = function(user, callback) {
    current_users.add(user);
    callback(current_users.toArray());
  }

  this.new_user_connection = function(user, callback) {
    chat.welcome(user, callback);
  }

  this.video_search = function(query, callback) {
    youtube.video_search(query, callback);
  }

  this.new_chat_message = function(query, callback) {
    chat.new_chat_message(query, callback);
  }

  this.set_broadcast_callback = function(callback) {
    broadcast = callback;
    chat.set_broadcast_callback(callback);
  }
}

module.exports = function(config, youtube, chat) {
  var jub = new JubDJ(config, youtube, chat);
  var first_video = {
    id: 'ELAs5Q8Itfs', // TODO different placeholder
    user: chat.bot.name
  };
  var second_video = {
    id: 'ELAs5Q8Itfs', // TODO different placeholder
    user: chat.bot.name
  };

  jub.enqueue_video(first_video);
  jub.enqueue_video(second_video);
  return jub
}
