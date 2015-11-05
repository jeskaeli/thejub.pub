require('./util').monkey_patch();
require('./logging')();

// Future of socket routing...
// Options:
//   1) big data map, here, mapping channel names to functions in different modules
//   2) everything remains in code form
//
//
// For historical reasons, the jub does not have a reference to this socketeer,
// but we will give it a couple of functions
function Socketeer(jub, chat, config, io) {

  var user_to_socket = {};
  var socket_to_user = {};

  function broadcast(channel, message) {
    io.emit(channel, message);
  }

  function whisper(user, channel, message) {
    if (user_to_socket[user]) {
      user_to_socket[user].emit(channel, message);
    }
  }

  // Give hooks to jub and chat
  for (x of [jub, chat]) {
    x.broadcast = broadcast;
    x.whisper = whisper;
  }

  // TODO what to do with these emit functions?
  function emit_users(user_list) {
    io.emit('current users', user_list);
  }

  function emit_chat(msg) {
    io.emit('chat message', msg);
  }

  // Pass in `io` for broadcast; `socket` for direct message
  function emit_video_state(sockets) {
    sockets.emit('video state', jub.emittable_video_state());
  }

  function emit_queue_for(user, socket) {
    socket.emit('queue', jub.emittable_queue_for(user));
  }

  // TODO
  // Clears the server's list of current users and initiates a roll call
  function refresh_users() {
    console.log('refresh users');
    jub.clear_users();
    io.emit('ping users', 0); // Tell the users to report their presence
  }

  io.on('connection', function(socket) {

    // User connected ('connection' above)
    console.log('client connected: %s', socket.conn.remoteAddress);
    //refresh_users();

    // User disconnected
    socket.on('disconnect', function() {
      console.log('socket disconnected: %s', socket.conn.remoteAddress);
      //refresh_users();
    });

    // A user just loaded the page; send them a welcome message. Callback is
    // for the user to set his username cookie.
    socket.on('user loaded', function(user, callback) {
      if (!user) {
        user = chat.gen_username()
      }
      callback(user);

      console.log('user loaded', user);
      jub.user_loaded(user, function(msg) {
        socket.emit('chat message', msg);
      });

      console.log('sending user data to', user, jub.user_data_for(user));
      socket.emit('user data', jub.user_data_for(user));
      refresh_users();
    });

    // A user updated its name
    socket.on('user update', function(user) {
      refresh_users();
    });

    // A user reported presence
    socket.on('user present', function(user) {
      console.log('user present:', user);
      user_to_socket[user] = socket;
      socket_to_user[socket] = user;
      jub.add_user(user, socket, function(user_list) {
        emit_users(user_list);
      });
    });

    // Chat message received from a client
    socket.on('chat message', function(client_msg_obj) {
      chat.new_chat_message(client_msg_obj);
    });

    // Enqueue new video
    socket.on('video enqueue', function(new_video) {
      console.log('video enqueue', new_video);
      jub.enqueue_video(new_video);
    });

    // Add DJ
    socket.on('add dj', function(user) {
      console.log('add dj', user);
      jub.add_dj(user);
    });

    // Remove DJ
    socket.on('remove dj', function(user) {
      console.log('remove dj', user);
      jub.remove_dj(user);
    });

    // Skip video
    socket.on('video skip', function(user) {
      console.log('video skip', user);
      jub.video_skipped(user);
    });

    // Dequeue video for user
    socket.on('video dequeue', function(user) {
      jub.dequeue_video(user);
    });

    // Enqueue new playlist. obj should include playlist_id and user
    socket.on('videos enqueue', function(videos_obj) {
      jub.enqueue_videos(videos_obj);
    });

    // Client requested video state
    socket.on('video state', function(video_id) {
      console.log('client requested video state', socket.conn.remoteAddress);
      // Send current state to that client
      emit_video_state(socket);
    });

    // Client requested queue state
    socket.on('queue', function(user) {
      console.log('client requested queue state', user);
      // Send current state to that client
      emit_queue_for(user, socket);
    });

    // Client requested youtube search results -- perform the video search
    // and call the client's provided callback
    // TODO remove once clients are doing this
    socket.on('video search', function(query, callback) {
      console.log('searching for', query);
      jub.video_search(query, function(results) {
        callback(results);
      });
    });

    socket.on('gapi key', function(callback) {
      console.log('env test', process.env.TEST);
      if(process.env.TEST) {
        callback(config.google_api_server_key);
      } else {
        callback(config.google_api_browser_key);
      }
    });
  });
}

module.exports = function(jub, chat, config, io) {
  return new Socketeer(jub, chat, config, io);
}
