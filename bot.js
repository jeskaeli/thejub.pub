require('./util').monkey_patch();

function Bot(config, youtube) {
  this.name = "jubbot";
  console.log('bot initialized with name', this.name);
  var bot = this;

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
      } else if ((msg == 'brice sux') || (msg == 'brice sucks'))
	  {
		response = "BRICE SUUUUUX";
	  } else {
        response = "I dunno.";
      }
      callback({
        text: response,
        user: this.name
      });
    }
  }

  this.video_started = function(video_obj, callback) {
    youtube.video_specs(video_obj, function(obj) {
      if (obj.title) {
        callback({
          text: obj.user + ' started "' + obj.title + '"',
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
