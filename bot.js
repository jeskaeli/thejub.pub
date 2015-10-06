require('./util').monkey_patch();

function Bot(config, youtube) {
  this.config = config;
  this.name = "jubbot";
  this.youtube = youtube;
  console.log('bot initialized with name', this.name);
  var bot = this;

  // Provide a callback that accepts a response as a message object
  this.new_chat_message = function(msg_obj, callback) {
    var msg = msg_obj['text'];
    if (msg.starts_with(this.name + ':')) {
      msg = msg.substring(this.name.length + 2, msg.length);
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

  this.video_started = function(state, callback) {
    this.youtube.video_title(state['id'], function(title) {
      if (title) {
        callback({
          text: state['user'] + ' started "' + title + '"',
          user: bot.name
        });
      }
    });
  }

  this.video_skipped = function(user, callback) {
    if (!user) { user = 'Someone'; }
    callback({
      text: user + ' decided to skip.',
      user: bot.name
    });
  }

}

module.exports = function(config, youtube) {
  return new Bot(config, youtube);
}
