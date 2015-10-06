require('./util').monkey_patch();

function emit_users(io, user_list) {
  io.emit('current users', user_list);
}

function emit_chat(io, msg) {
  io.emit('chat message', msg);
}

// Pass in `io` for broadcast; `socket` for direct message
function emit_video_state(sockets, jub) {
  sockets.emit('video state', jub.emittable_video_state());
}

// Pass in `io` for broadcast; `socket` for direct message
function emit_queue_state(sockets, jub) {
  sockets.emit('video queue', jub.emittable_queue_state());
}

// Clears the server's list of current users and initiates a roll call
function refresh_users(io, jub) {
  console.log('refresh users');
  jub.clear_users();
  io.emit('ping users', 0); // Tell the users to report their presence
}

function Socketeer(jub, config, io) {

  // Give server a way to initiate a message
  jub.set_broadcast_callback(function(channel, message) {
    io.emit(channel, message);
  });

  io.on('connection', function(socket) {

    // User connected ('connection' above)
    console.log('client connected: %s', socket.conn.remoteAddress);
    refresh_users(io, jub);

    // User disconnected
    socket.on('disconnect', function() {
      console.log('user disconnected: %s', socket.client);
      refresh_users(io, jub);
    });

    // A user changed their name
    socket.on('user update', function(user) {
      refresh_users(io, jub);
    });

    // A user reported presence
    socket.on('user present', function(user) {
      console.log('user present:', user);
      jub.add_user(user, function(user_list) {
        emit_users(io, user_list);
      });
    });

    // Chat message received from a client
    socket.on('chat message', function(client_msg_obj) {
      jub.new_chat_message(client_msg_obj, function(response) {
        if (response) {
          emit_chat(io, response);
        }
      });
    });

    // Enqueue new video.
    socket.on('video submit', function(new_video) {
      console.log('video submit', new_video);
      jub.enqueue_video(new_video);
    });

    // Skip video.
    socket.on('video skip', function(user) {
      console.log('video skip', user);
      jub.skip_video(user);
    });

    // Dequeue video for user
    socket.on('video dequeue', function(user) {
      jub.dequeue_video(user);
    });

    // Enqueue new playlist. obj should include playlist_id and user
    socket.on('playlist submit', function(playlist_obj) {
      console.log('enqueuing playlist:', playlist_obj['playlist_id'], playlist_obj['user']);
      jub.enqueue_playlist(playlist_obj);
    });


    // Client requested video state
    socket.on('video state', function(video_id) {
      console.log('client requested video state', socket.conn.remoteAddress);
      // Send current state to that client
      emit_video_state(socket, jub);
    });

    // Client requested queue state
    socket.on('video state', function(video_id) {
      console.log('client requested queue state', socket.conn.remoteAddress);
      // Send current state to that client
      emit_queue_state(socket, jub);
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
