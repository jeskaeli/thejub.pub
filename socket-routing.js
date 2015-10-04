var util = require('util');

// patch String with #startsWith
if ( typeof String.prototype.startsWith != 'function' ) {
  String.prototype.startsWith = function( str ) {
    return this.substring( 0, str.length ) === str;
  }
};

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

// Take in a chat obj sent from the client and turn into something we can
// emit to display in the chat history
function transform_chat(msg_obj) {
  var formatted = msg_obj['text'];
  var emph = false;
  if (msg_obj['username']) {
    if (formatted.startsWith('/me ')) {
      formatted = msg_obj['username'] + ' ' +
                  formatted.substring(3, formatted.length);
      emph = true;
    } else {
      formatted = msg_obj['username'] + ": " + formatted;
    }
  }
  return {
    text: formatted,
    emph: emph
  };
}

function Socketeer(jub, config, io) {

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
        io.emit('current users', user_list);
      });
    });

    // Chat message received
    socket.on('chat message', function(client_msg_obj) {
      // Echo message back to clients
      if (client_msg_obj['text']) {
        emit_chat(io, transform_chat(client_msg_obj));
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
      // Send new state to that client
      socket.emit('video state', jub.emittable_state());
    });

    // Video search
    socket.on('video search', function(query) {
      console.log('searching for', query);
      jub.video_search(query, function(results) {
        socket.emit('video search results', results);
      });
    });
  });
}

module.exports = function(jub, config, io) {
  return new Socketeer(jub, config, io);
}
