require('./jub_util').monkey_patch();
require('./logging')();

function Bot(config) {
  this.name = "jubbot";
  console.log('bot initialized with name', this.name);
  var bot = this;

  function bot_msg_obj(text) {
    return {
      text: text,
      user: bot.name
    }
  }

  this.say = function(text, callback) {
    callback(bot_msg_obj(text));
  }

  this.welcome = function(user, callback) {
    var msg = 'Welcome'
    if (user && user.length > 0) { msg += ', ' + user; }
    msg += '!';

    if (config.latest_updates && config.latest_updates.list.length > 0) {
      msg += '\nLatest updates';
      if (config.latest_updates.date) {
        msg += ' (' + config.latest_updates.date + ')';
      }
      msg += ':\n' +
        config.latest_updates.list
        .map(function(str) { return '* ' + str; })
        .join('\n');
    }
    callback(bot_msg_obj(msg));
  }

  // Provide a callback that accepts a response as a message object
  this.new_chat_message = function(msg_obj, callback) {
    var msg = msg_obj['text'];
    if (msg.starts_with(this.name + ':')) {
      msg = msg.substring(this.name.length + 2, msg.length);
      msg = msg.toLowerCase();
      console.log('bot received new message:', msg);
      var response = '';
      if (msg == 'penis') {
        response = "Dude I don't like dick. Not that there's anything wrong with that.";
      }
      else if ((msg == 'brice sux') || (msg == 'brice sucks')) {
        response = "BRICE SUUUUUX. But Whit kind of does too.";
      }
      else if (msg.startsWith('how neat is that')) {
        response = "spurty neat";
      }
      else {
        response = "I dunno.";
      }
      callback(bot_msg_obj(response));
    }
  }

  this.video_started = function(video_obj, callback) {
    if (video_obj.title) {
      var msg = video_obj.user + ' started "' + video_obj.title + '"'
      callback(bot_msg_obj(msg));
    }
  }

  this.video_skipped = function(user, callback) {
    var msg = (user || 'Someone') + ' decided to skip.';
    callback(bot_msg_obj(msg));
  }
}

module.exports = function(config) {
  return new Bot(config);
}
