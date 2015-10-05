var util = require('./util')
util.monkey_patch();

function Chat(config, bot) {
  this.bot = bot

  // Take in a chat obj sent from the client and turn into something we can
  // emit to display in the chat history
  function transform_chat(msg_obj) {
    var formatted = msg_obj['text'];
    var emph = false;
    if (msg_obj['user']) {
      if (formatted.starts_with('/me ')) {
        formatted = msg_obj['user'] + ' ' +
          formatted.substring(3, formatted.length);
          emph = true;
      } else {
        formatted = msg_obj['user'] + ": " + formatted;
      }
    }
    return {
      text: formatted,
      emph: emph
    };
  }

  // Usually we are given a callback that has access to the sockets;
  // this is a way for us to initiate a message without such a callback.
  this.set_broadcast_callback = function(callback) {

    this.broadcast_msg_obj = function(msg_obj) {
      callback('chat message', transform_chat(msg_obj));
    }
  }

  // Provide a callback that accepts a string response
  this.new_chat_message = function(msg_obj, callback) {
    // Short circuit bot impersonators TODO remove later
    if (msg_obj['user'] == bot.name) {
      msg_obj = {
        user: bot.name,
        text: 'Someone just tried to impersonate me!'
      };
    }

    // Echo message back to clients
    if (msg_obj['text']) {
      callback(transform_chat(msg_obj));
    }

    // Pass message to bot. He will return a response obj and we
    // will transform it into a string.
    bot.new_chat_message(msg_obj, function(resp_obj) {
      callback(transform_chat(resp_obj));
    });
  }

  // When there's a new video state, tell the bot and broadcast what he says
  this.new_video_start = function(new_state) {
    bot.new_video_start(new_state, this.broadcast_msg_obj);
  }
}

module.exports = function(config, bot) {
  return new Chat(config, bot);
}
