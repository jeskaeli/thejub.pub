require('./util').monkey_patch();

function Bot(config, youtube) {
  this.config = config;
  this.name = "jubbot";
  this.youtube = youtube;
  console.log('bot initialized with name', this.name);

  // Provide a callback that accepts a response as a message object
  this.new_chat_message = function(msg_obj, callback) {
    msg = msg_obj['text'];
    if (msg.starts_with(this.name + ':')) {
      console.log('bot received new message:', msg_obj['text']);
      callback({
        text: "Hey! I don't do a whole lot.",
        user: this.name
      });
    }
  }

  this.new_video_state = function(state, callback) {
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
