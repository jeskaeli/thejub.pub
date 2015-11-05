var util = require('./util')
var crypto = require('crypto');
require('./logging')();
util.monkey_patch();

/* message objects look like:
 *    {
 *      user:
 *      text:
 *      color:
 *      is_bot:
 *      ...
 *    }
 */

function Chat(config, bot) {
  this.bot = bot;
  var color_map = {};
  var chat = this;

  // These will be set by the socketeer
  this.broadcast = function() {};
  this.whisper = function() {};

  // Convenience wrappers
  this.broadcast_chat = function(msg_obj) {
    chat.broadcast('chat message', transform_chat(msg_obj));
  }
  this.whisper_chat = function(user, msg_obj) {
    chat.whisper(user, 'chat message', transform_chat(msg_obj));
  }

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

  // Callback should accept processed msg_obj
  function process_msg(msg_obj, callback) {
    if (!(msg_obj.user && msg_obj.text))
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

    callback(msg_obj);
  }

  this.new_chat_message = function(msg_obj) {
    process_msg(msg_obj, chat.broadcast_chat);
    bot.new_chat_message(msg_obj, chat.broadcast_chat);
  }

  this.welcome = function(user) {
    bot.welcome(user, function(resp_obj) {
      chat.whisper_chat(user, resp_obj);
    });
  }

  // When there's a new video state, tell the bot and broadcast what he says
  this.video_started = function(new_state) {
    bot.video_started(new_state, this.broadcast_chat);
  }

  // When a video is skipped, tell the bot and broadcast what he says
  this.video_skipped = function(user) {
    bot.video_skipped(user, this.broadcast_chat);
  }

}

module.exports = function(config, bot) {
  return new Chat(config, bot);
}
