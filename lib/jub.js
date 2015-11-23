var jub_util = require('./jub_util');
var util = require('util');
var Set = require("collections/set");
var Map = require("collections/map");
var Deque = require("collections/deque");
var moment = require("moment");
require('./logging')(); // TODO accept logger as an argument
jub_util.monkey_patch();

function JubDJ(config, gapi, chat, db) {
  var gapi = gapi;
  var chat = chat;
  var video_state = {};
  var video_queues = Map();      // username --> video queue
  var dj_sched = [];             // circular buffer of users signed up to DJ
  var current_users = new Set([chat.bot.name]); // users present in room
  var users_seen = new Set();    // for forcing reloads
  var jub = this;

  // These will be set by the socketeer
  this.broadcast = function() {};
  this.whisper = function() {};

  chat.jub = jub;

  // Sum of DJs' queue sizes
  var sum_videos_queued = function() {
    return video_queues.reduce(function(a,v,k) {
      if (dj_sched.indexOf(k) > -1)
        return a + v.length;
      else
        return a;
    }, 0);
  }

  // Rotate DJs until someone who has videos to play is first.
  var skip_idle_djs = function() {
    console.log('skipping idle, dj_sched:', dj_sched,
                'current_users:', current_users.toArray());
    if (dj_sched.length > 1 && sum_videos_queued() > 0) {
      while (!video_queues.has(dj_sched[0]) ||
             video_queues.get(dj_sched[0]).length == 0) {
        console.log('skipping dj', dj_sched[0]);
        dj_sched.push(dj_sched.shift());
        // REALLY don't want to get stuck looping forever
        if (sum_videos_queued() == 0)
          break;
      }
    }
  }

  var video_done = function() {
    return Date.now() > video_state.start_time + video_state.duration;
  }

  // Periodically check the time so we can start the next video punctually.
  // When the time comes, pop the next DJ off the schedule and play his video.
  var rotate_videos = function() {
    // It's time to rotate videos or no video has ever been played
    if (video_done() || Object.keys(video_state).length == 0) {
      // Anyone have anything to play?
      if (sum_videos_queued() > 0) {
        // Push the just-finished DJ to the back, if they're still here
        if (video_state.user) { // always true except init
          var last_dj = video_state.user;

          // Put the last DJ's just-played video back into their queue
          var last_queue = video_queues.get(last_dj);
          delete video_state.start_time;
          last_queue.unshift(video_state);
          jub.whisper(last_dj, 'queue', jub.emittable_queue_for(last_dj));

          // Put the last DJ back into the rotation if they are still DJing and
          // still present
          if (dj_sched.remove(last_dj).length > 0 && current_users.has(last_dj)) {
            dj_sched.push(last_dj);
          }
        }

        skip_idle_djs();
        var new_dj = dj_sched[0];
        console.log('rotated DJs to', new_dj);
        if (video_queues.has(new_dj) && video_queues.get(new_dj).length > 0) {
          var next_video = video_queues.get(new_dj).pop();
          next_video.start_time = Date.now();
          console.log('starting next video:', next_video['id']);
          jub.update_video_state(next_video);
          // Send the new DJ his updated queue
          jub.whisper(new_dj, 'queue', jub.emittable_queue_for(new_dj));
        }
      }
      // Tell the clients about the updated state. Even if we didn't enqueue
      // a new video, we still need to send this out because someone might have
      // pressed 'skip'
      // TODO this sends every second, when no video is playing
      if (video_state)
        jub.broadcast('video state', jub.emittable_video_state());
    }
  }
  setInterval(rotate_videos, 1000);

  // Enqueue a single video for a user
  this.enqueue_video = function(video_obj, callback) {
    var user = video_obj.user;
    if (user) {
      // TODO remove this call once clients are doing it
      gapi.video_specs(video_obj, function(obj) {
        if (obj.title && obj.duration && user) {
          // Create a queue for the user if there's not one
          if (!video_queues.has(user)) {
            video_queues.set(user, Deque());
          }
          video_queues.get(user).unshift(obj);
          console.log(user, 'enqueued video:', obj.title);
          jub.whisper(user, 'queue', jub.emittable_queue_for(user));
        } else {
          console.log('failed to find info for video', video_obj.id);
        }
      });
    }
  }

  // Add an entire playlist to the queue
  this.enqueue_videos = function(videos_obj) {
    console.log('enqueue videos:', util.inspect(videos_obj));
    var user = videos_obj.user;
    var video_list = videos_obj.list;

    // Create a queue for the user if there's not one
    if (!video_queues.has(user)) {
      video_queues.set(user, Deque());
    }

    // Add each video to the queue
    for (video_obj of video_list) {
      video_queues.get(user).unshift(video_obj);
    }

    jub.whisper(user, 'queue', jub.emittable_queue_for(user));
  }

  // TODO make this simpler once we have separate queues
  this.dequeue_video = function(user, callback) {
    if (video_queues.has(user) && video_queues.get(user).length > 0) {
      var new_queue = Deque();
      var queue_copy = video_queues.get(user).toArray();
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
        video_queues.set(user, new_queue);
      }
      jub.whisper(user, 'queue', jub.emittable_queue_for(user));
    }
  }

  // Used for both like and dislike
  this.user_opinion = function(user, like) {
    console.log('user appraises', user, like);
    if (video_done()) { return; }
    if (!video_state.hasOwnProperty('opinions')) {
      video_state['opinions'] = new Map();
    }
    var appr_map = video_state['opinions'];
    if (!appr_map.has(user)) {
      appr_map.set(user, like);
      chat.bot_say(user + ' ' + (like ? 'likes' : 'dislikes') + ' this video.');
      var channel = like ? 'num likes' : 'num dislikes'
      var value = appr_map.reduce(function(a, v, k) {
        return a + (v === like ? 1 : 0);
      }, 0);
      jub.broadcast(channel, value);
    }
  }

  this.shuffle = function(user, callback) {
    console.log('shuffling for ', user);
    if (video_queues.has(user) && video_queues.get(user).length > 0) {
      var queue_copy = video_queues.get(user).toArray();
      jub_util.knuth_shuffle(queue_copy);
      video_queues.set(user, Deque(queue_copy));
      callback(jub.emittable_queue_for(user));
    }
  }

  this.delete_tracks = function(user, indices, callback) {
    console.log('deleting tracks for ', user);
    if (video_queues.has(user) && video_queues.get(user).length > 0) {
      var filtered = video_queues.get(user).toArray().filter(function(v, i) {
        return indices.indexOf(i) === -1;
      });
      video_queues.set(user, Deque(filtered));
      callback(jub.emittable_queue_for(user));
    }
  }

  this.send_to_top = function(user, indices, callback) {
    console.log('sending tracks to top for', user);
    if (video_queues.has(user) && video_queues.get(user).length > 0) {
      var ordered = video_queues.get(user).toArray()
        .partition(function(v, i) { return (indices.indexOf(i) === -1); })
        .flatten();
      video_queues.set(user, Deque(ordered));
      callback(jub.emittable_queue_for(user));
    }
  }

  // Allow users to skip their own videos; also allow anyone to skip a video
  // started by someone who has left the room.
  this.video_skipped = function(user) {
    console.log('user', user, 'tried to skip');
    if (user == video_state.user || dj_sched.indexOf(video_state.user) < 0) {
      video_state.start_time = Date.now() - video_state.duration;
      chat.video_skipped(user);
    }
  }

  // TODO maybe this function should also broadcast
  this.update_video_state = function(new_state) {
    video_state = new_state;
    chat.video_started(new_state);
    console.log("Updated video state: %s", util.inspect(video_state));
  }

  this.emittable_user_map = function() {
    return current_users.map(function(user) {
      return {
        name: user,
        color: chat.color_for(user)
      }
    });
  }

  this.emittable_video_state = function() {
    return {
      id: video_state.id,
      title: video_state.title,
      start_time: video_state.start_time,
      server_time: Date.now(),
      duration: video_state.duration,
      user: video_state.user,
      user_color: chat.color_for(video_state.user),
      opinions: video_state.opinions
    }
  }

  this.emittable_queue_for = function(user) {
    if (video_queues.has(user)) {
      return video_queues.get(user).toArray();
    }
  }

  // Add the user to the end of the rotation if it's not already in the
  // rotation.
  this.add_dj = function(user) {
    var index = dj_sched.indexOf(user);
    if (index == -1) {
      dj_sched.push(user);
    }
    console.log('added DJ', user, ', now dj_sched', dj_sched);
  }

  // Remove the user from the rotation if it's there
  this.remove_dj = function(user) {
    var index = dj_sched.indexOf(user);
    if (index > -1) {
      dj_sched.splice(index, 1);
    }
    console.log('removed DJ', user, ', now dj_sched', dj_sched);
  }

  this.add_user = function(user, socket, callback) {
    if (user) {
      current_users.add(user);
      if (!users_seen.has(user)) {
        users_seen.add(user);
        console.log('force reload', user)
        socket.emit('force reload');
      }
      // Could replace callback with broadcast
      callback(jub.emittable_user_map());
    }
  }

  this.set_current_users = function(users, callback) {
    current_users.clear();
    current_users.add(chat.bot.name);
    current_users.addEach(users);
    callback(jub.emittable_user_map());
  }

  // User loads page and requests preferences
  // TODO a little confusing that this function does *not* update current_users
  this.user_loaded = function(user, callback) {
    console.log('user loaded', user);

    // Generate a random username if none is provided
    if (!user) {
      user = chat.gen_username()
    }

    // Don't need to force reload this user
    users_seen.add(user);

    var emittable = { name: user };
    db.fetchUserPreferences(user, function(fetched) {
      // Use the fetched color (or generate a random one)
      emittable.color = chat.color_for(user, fetched.color);
      emittable.dj = (dj_sched.indexOf(user || '') > -1);

      console.log('user loaded, info:', emittable);
      callback(emittable);

      chat.load_chat_cache(config.chat_cache_limit, function(msg_objs) {
        console.log('loaded chat cache for', user, msg_objs.length);
        msg_objs.forEach(function(msg_obj) {
          chat.whisper_chat(user, msg_obj);
        });
      });
    });
  }

  this.user_update_preferences = function(user, update) {
    db.updateUserPreferences(user, update);
  }

  this.video_search = function(query, callback) {
    gapi.video_search(query, callback);
  }
}

module.exports = function(config, gapi, chat, db) {
  var jub = new JubDJ(config, gapi, chat, db);
  var first_video = {
    id: 'ELAs5Q8Itfs', // ~ 15 sec
    user: chat.bot.name
  };
  var second_video = {
    id: 'DsAn_n6O5Ns', // ~ 2 sec
    user: chat.bot.name
  };

  if (process.env.TEST) {
    jub.enqueue_video(first_video);
    jub.enqueue_video(second_video);
  }
  jub.add_dj(chat.bot.name);

  return jub
}
