require('./util').monkey_patch();

function Bot(config, youtube) {
  this.config = config;
  this.name = "jubbot";
  this.youtube = youtube;
  console.log('bot initialized with name', this.name);

  // Provide a callback that accepts a response as a message object
  this.new_chat_message = function(msg_obj, callback) {
    var msg = msg_obj['text'];
    if (msg.starts_with(this.name + ':')) {
      msg = msg.substring(0, this.name.length + 2);
      console.log('bot received new message:', msg);
      var response = '';
      if (msg == 'penis') {
        response = "Dude I don't like dick. I'm not Whit.";
      } else {
        response = "I dunno.";
      }
      callback({
        text: response,
        user: this.name
      });
    }
  }

  this.new_video_start = function(state, callback) {
    var bot = this;
    this.youtube.video_title(state['id'], function(title) {
      if (title) {
        var text = state['user'] + ' started "' + title + '"';
        callback({ text: text, user: bot.name });
      }
    });
  }
}

module.exports = function(config, youtube) {
  return new Bot(config, youtube);
}
