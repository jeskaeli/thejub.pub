require('./util').monkey_patch();

function Bot(config, youtube) {
  this.name = "jubbot";
  console.log('bot initialized with name', this.name);
  var bot = this;

  function bot_msg_obj(text) {
    return {
      text: text,
      user: bot.name
    }
  }

  this.welcome = function(user, callback) {
    var msg = 'Welcome' // TODO user is never there... not waiting long enough?
    if (user && user.length > 0) { msg += ', ' + user; }
    msg += '! Latest updates:\n' +
      config.latest_updates
        .map(function(str) { return '* ' + str; })
        .join('\n');
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
        response = "Dude I don't like dick. I'm not Whit.";
      }
      else if ((msg == 'brice sux') || (msg == 'brice sucks')) {
        response = "BRICE SUUUUUX";
      }
      else {
        response = "I dunno.";
      }
      callback(bot_msg_obj(response));
    }
  }

  this.video_started = function(video_obj, callback) {
    youtube.video_specs(video_obj, function(obj) {
      if (obj.title) {
        var msg = obj.user + ' started "' + obj.title + '"'
        callback(bot_msg_obj(msg));
      }
    });
  }

  this.video_skipped = function(user, callback) {
    var msg = (user || 'Someone') + ' decided to skip.';
    callback(bot_msg_obj(msg));
  }
}

module.exports = function(config, youtube) {
  return new Bot(config, youtube);
}
