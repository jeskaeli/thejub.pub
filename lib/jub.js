var jub_util = require('./jub_util');
var util = require('util');
var _ = require('lodash');
var Set = require("collections/set");
var Map = require("collections/map");
var Deque = require("collections/deque");
var moment = require("moment");
var async = require("async");
require('./logging')(); // TODO accept logger as an argument
jub_util.monkey_patch();

// TODO collections module has incomplete documentation -- if possible I would
// like to replace these data structures with vanilla equivalents and leverage
// lodash to get the functional goodies that collections was providing.
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
    return video_queues.reduce(function(accum,queue,user) {
      if (_.contains(dj_sched, user))
        return accum + queue.length;
      else
        return accum;
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

  var broadcast_video_state = function() {
    if (video_state) {
      jub.broadcast('video state', jub.emittable_video_state());
    }
  }

  var requeue_video = function(user, video) {
    if (video_queues.has(user)) {
      var to_queue = _.omit(video, ['start_time', 'server_time', 'opinions']);
      video_queues.get(user).unshift(to_queue);
    }
  }

  // Periodically check the time so we can start the next video punctually.
  // When the time comes, pop the next DJ off the schedule and play his video.
  var rotate_videos = function() {
    // It's time to rotate videos or no video has ever been played
    if (video_done() || Object.keys(video_state).length == 0) {
      var last_dj = video_state.user;
      var last_dj_prefs = {};
      async.series([
        // fetch the preferences of the last dj
        function(done) {
          if (last_dj && video_state.id) {
            db.fetchUserPreferences(last_dj, function(prefs) {
              last_dj_prefs = prefs;
              done();
            });
          } else {
            done();
          }
        },
        function(done) {
          // Anyone have anything to play?
          if (sum_videos_queued() > 0 ||
              (_.contains(dj_sched, last_dj) && (last_dj_prefs.requeueVideos))) {
            // Someone has a video to play. Rotate DJs, send the last DJ and
            // new DJ their updated queues, and broadcast the new video state.
            if (last_dj) {
              // Put the last DJ's just-played video back into their queue, if
              // their preferences allow it.
              var last_queue = video_queues.get(last_dj);
              if (last_dj_prefs.requeueVideos) {
                requeue_video(last_dj, video_state);
                jub.whisper(last_dj, 'queue', jub.emittable_queue_for(last_dj));
              }
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
              console.log('starting next video:', next_video['id']);
              jub.start_new_video(next_video);
              // Send the new DJ his updated queue
              jub.whisper(new_dj, 'queue', jub.emittable_queue_for(new_dj));
            }
            broadcast_video_state();
          } else {
            // No one has anything to play, but someone may have just clicked
            // 'skip', so send back the updated state anyway.
            if (video_state.id && Object.keys(video_state).length > 0) {
              jub.clear_video_state();
              broadcast_video_state();
            }
          }
          done();
        }
      ]); // async.series
    } // if time to rotate
  }
  var rotate_videos_interval = setInterval(rotate_videos, 1000);

  this.stop = function() {
    clearInterval(rotate_videos_interval);
  }

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
          console.log(user, "enqueued video:", obj.title);
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

  this.send_to_bottom = function(user, indices, callback) {
    console.log('sending tracks to bottom for', user);
    if (video_queues.has(user) && video_queues.get(user).length > 0) {
      var ordered = video_queues.get(user).toArray()
        .partition(function(v, i) { return (indices.indexOf(i) > -1); })
        .flatten();
      video_queues.set(user, Deque(ordered));
      callback(jub.emittable_queue_for(user));
    }
  }

  // Allow users to skip their own videos; also allow anyone to skip a video
  // started by someone who has left the DJ rotation.
  this.video_skipped = function(user) {
    if (!video_state.id) return;
    console.log('user', user, 'tried to skip', video_state);
    if (user == video_state.user ||
        (video_state.user && dj_sched.indexOf(video_state.user) < 0)) {
      video_state.start_time = Date.now() - video_state.duration;
      chat.video_skipped(user);
      rotate_videos();
    }
  }

  // TODO maybe this function should also broadcast
  this.start_new_video = function(new_video) {
    console.log('next video', new_video);
    video_state = _.merge({},  new_video);
    video_state.start_time = Date.now();
    chat.video_started(video_state);
    console.log("Updated video state: \"%s\"", video_state.title);
    console.log('next video is now', new_video);
  }

  this.clear_video_state = function() {
    console.log('clearing video state');
    video_state.id = null;
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
      emittable.requeueVideos = fetched.requeueVideos;

      console.log('user loaded, info:', emittable);
      callback(emittable);

      // Send the day's chat history to the user
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
  jub.add_dj(chat.bot.name);
  return jub
}
