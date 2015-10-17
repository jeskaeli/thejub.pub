require('./util').monkey_patch();
require('./logging')();

function Socketeer(jub, config, io) {

  var user_to_socket = {};
  var socket_to_user = {};

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

  // Clears the server's list of current users and initiates a roll call
  function refresh_users() {
    console.log('refresh users');
    jub.clear_users();
    io.emit('ping users', 0); // Tell the users to report their presence
  }

  // Give server a way to initiate a broadcast message
  jub.set_broadcast_callback(function(channel, message) {
    io.emit(channel, message);
  });

  // Give server a way to initiate a direct message, by username
  jub.set_whisper_callback(function(user, channel, message) {
    if (user_to_socket[user]) {
      user_to_socket[user].emit(channel, message);
    }
  });

  io.on('connection', function(socket) {

    // User connected ('connection' above)
    console.log('client connected: %s', socket.conn.remoteAddress);
    refresh_users();

    // User disconnected
    socket.on('disconnect', function() {
      console.log('user disconnected: %s', socket.client);
      refresh_users();
    });

    // A user just loaded the page; send them a welcome message
    socket.on('user loaded', function(user) {
      console.log('user loaded', user);
      jub.new_user_connection(user, function(msg) {
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
      jub.new_chat_message(client_msg_obj, function(response) {
        if (response) {
          emit_chat(response);
        }
      });
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
    socket.on('playlist submit', function(playlist_obj) {
      jub.enqueue_playlist(playlist_obj);
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
    socket.on('video search', function(query, callback) {
      console.log('searching for', query);
      jub.video_search(query, function(results) {
        callback(results);
      });
    });
  });
}

module.exports = function(jub, config, io) {
  return new Socketeer(jub, config, io);
}
