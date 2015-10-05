require('./util').monkey_patch();

function emit_users(io, user_list) {
  io.emit('current users', user_list);
}

function emit_chat(io, msg) {
  io.emit('chat message', msg);
}

// Pass in `io` for broadcast; `socket` for direct message
function emit_video_state(sockets, jub) {
  sockets.emit('video state', jub.emittable_state());
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
        emit_chat(io, response);
      });
    });

    // New video
    socket.on('video submit', function(new_video_state) {
      jub.update_video_state({
        user: new_video_state['user'],
        id: new_video_state['video_id'],
        start_time: Date.now()
      });
      // Send new state to all clients
      emit_video_state(io, jub);
    });

    // Client requested video state
    socket.on('video state', function(video_id) {
      console.log('client requested video state', socket.conn.remoteAddress);
      // Send new state to that client
      emit_video_state(socket, jub);
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
