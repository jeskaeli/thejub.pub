var util = require('./util')
var crypto = require('crypto');
require('./logging')();
util.monkey_patch();

// TODO unify this API - functions expect different kinds of callbacks
function Chat(config, bot) {
  this.bot = bot;
  var color_map = {};
  var broadcast = function() {};
  var whisper = function() {};
  var chat = this;

  // Sets or returns an initial color for the user
  this.color_for = function(user, color) {
    if (!user)
      return "#FFFFFF";
    if (color) {
      color_map[user] = color;
    } else if (user && !color_map[user]) {
      var hash = crypto.createHash('md5');
      hash.update(user);
      color_map[user] = '#' + hash.digest('hex').slice(3,9);
    }
    return color_map[user];
  }

  this.gen_username = function() {
    var hash = crypto.createHash('md5');
    hash.update(Date.now().toString());
    return 'jub-' + hash.digest('hex').slice(0, 7);
  }

  // Take in a chat obj sent from the client and turn into something we can
  // emit to display in the chat history
  function transform_chat(msg_obj) {
    msg_obj.is_bot = (msg_obj.user == bot.name);
    msg_obj.color = chat.color_for(msg_obj.user);
    return msg_obj
  }

  function process_msg(msg_obj, callback) {
    if (!msg_obj.user)
      return;

    // User is setting its color; stop after setting the color
    if (msg_obj.text.starts_with('/color ')) {
      chat.color_for(msg_obj.user, msg_obj.text.substring(7, msg_obj.text.length));
      console.log(msg_obj.user, 'set color to', chat.color_for(msg_obj.user));
      return;
    }

    // Someone is impersonating the bot; change the text
    if (msg_obj.user == bot.name) {
      msg_obj = {
        user: bot.name,
        text: 'Someone just tried to impersonate me!'
      };
    }

    // User is emoting
    if (msg_obj.text.starts_with('/me ')) {
      msg_obj.text = msg_obj.text.substring(3, msg_obj.text.length);
      msg_obj.emote = true;
    }

    // Echo message back to clients
    if (msg_obj.text) {
      callback(transform_chat(msg_obj));
    }

    // Pass message to bot. He will return a response obj and we
    // will transform it then send it out to clients
    bot.new_chat_message(msg_obj, function(resp_obj) {
      callback(transform_chat(resp_obj));
    });
  }

  // Usually we are given a callback that has access to the sockets;
  // this is a way for us to initiate a message without such a callback.
  // TODO chat should also have callbacks available for whispering
  this.set_broadcast_callback = function(callback) {
    broadcast = function(msg_obj) {
      callback('chat message', transform_chat(msg_obj));
    }
  }

  this.set_whisper_callback = function(callback) {
    whipser = function(msg_obj) {
      callback('chat message', transform_chat(msg_obj));
    }
  }

  // Provide a callback that accepts a string response
  this.new_chat_message = function(msg_obj, callback) {
    process_msg(msg_obj, callback);
  }

  this.welcome = function(user, callback) {
    bot.welcome(user, function(resp_obj) {
      callback(transform_chat(resp_obj));
    });
  }

  // When there's a new video state, tell the bot and broadcast what he says
  this.video_started = function(new_state) {
    bot.video_started(new_state, broadcast);
  }

  // When a video is skipped, tell the bot and broadcast what he says
  this.video_skipped = function(user) {
    bot.video_skipped(user, broadcast);
  }

}

module.exports = function(config, bot) {
  return new Chat(config, bot);
}
