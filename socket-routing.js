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
      io.emit('chat message', msg);
    });
  });
};

