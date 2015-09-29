var util = require('util');

module.exports = function(app, io) {

  io.on('connection', function(socket) {
    console.log('user connected: %s', socket.conn.remoteAddress);

    socket.on('disconnect', function() {
      console.log('user disconnected: %s', socket.client);
    });

    socket.on('chat message', function(msg) {
      // Send message up to the app
      app.new_msg(msg);
      // Echo message back to clients
      if (msg['text']) {
        var formatted = msg['text']
        if (msg['username']) {
          formatted = msg['username'] + ": " + formatted;
        }
        io.emit('chat message', formatted);
      }
    });

    socket.on('video submit', function(video_id) {
      app.update_video_state({
        id: video_id,
        start_time: Date.now()
      });
      // Send new state to all clients
      io.emit('video state', app.jub.emittable_state());
    });

    socket.on('request video state', function(video_id) {
      console.log('client requested video state', socket.conn.remoteAddress);
      // Send new state to all clients
      io.emit('video state', app.jub.emittable_state());
    });

  });
};

