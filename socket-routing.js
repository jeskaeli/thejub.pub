var util = require('util');

function emit_users(io, users) {
  io.emit('current users', users.toArray());
}

function emit_chat(io, msg) {
  io.emit('chat message', msg);
}

function refresh_users(io, jub) {
  console.log('refresh users');
  jub.clear_users();
  io.emit('ping users', 0); // Tell the users to report their presence
}

function Socketeer(jub, config, io) {

  io.on('connection', function(socket) {

    // User connected ('connection' above)
    console.log('client connected: %s', socket.conn.remoteAddress);
    emit_chat(io, 'Someone connected.');
    refresh_users(io, jub);

    // User disconnected
    socket.on('disconnect', function() {
      console.log('user disconnected: %s', socket.client);
      emit_chat(io, 'Someone disconnected.');
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
        io.emit('current users', user_list);
      });
    });

    // Chat message received
    socket.on('chat message', function(msg) {
      // Echo message back to clients
      if (msg['text']) {
        var formatted = msg['text']
        if (msg['username']) {
          formatted = msg['username'] + ": " + formatted;
        }
        emit_chat(io, formatted);
      }
    });

    // New video
    socket.on('video submit', function(video_id) {
      jub.update_video_state({
        id: video_id,
        start_time: Date.now()
      });
      // Send new state to all clients
      io.emit('video state', jub.emittable_state());
    });

    // Request video state
    socket.on('request video state', function(video_id) {
      console.log('client requested video state', socket.conn.remoteAddress);
      // Send new state to all clients
      io.emit('video state', jub.emittable_state());
    });


  });
}

module.exports = function(jub, config, io) {
  return new Socketeer(jub, config, io);
}
