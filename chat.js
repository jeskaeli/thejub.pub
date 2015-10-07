var util = require('./util')
util.monkey_patch();


// TODO unify this API - functions expect different kinds of callbacks
function Chat(config, bot) {
  this.bot = bot

  // Take in a chat obj sent from the client and turn into something we can
  // emit to display in the chat history
  function transform_chat(msg_obj) {
    var formatted = msg_obj.text;
    var emph = false;
    if (msg_obj.user) {
      if (formatted.starts_with('/me ')) {
        formatted = msg_obj.user + ' ' +
          formatted.substring(3, formatted.length);
          emph = true;
      } else {
        formatted = msg_obj.user + ": " + formatted;
      }
    }
    var transformed = {
      user: msg_obj.user,
      text: formatted,
      emph: emph
    };
    if (msg_obj.user == bot.name) {
      transformed.bot = true;
    }
    return transformed;
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
      console.log('resp', resp_obj);
      callback(transform_chat(resp_obj));
    });
  }

  this.welcome = function(user, callback) {
    bot.welcome(user, callback);
  }

  // When there's a new video state, tell the bot and broadcast what he says
  // TODO to unify API, chat should not have its own copy of the broadcast fn;
  // it should be passed in from the caller like the rest of the fns
  this.video_started = function(new_state) {
    bot.video_started(new_state, this.broadcast_msg_obj);
  }

  // When there's a new video state, tell the bot and broadcast what he says
  this.video_skipped = function(user) {
    bot.video_skipped(user, this.broadcast_msg_obj);
  }

}

module.exports = function(config, bot) {
  return new Chat(config, bot);
}
