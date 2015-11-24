require('../lib/logging')(null, null, '-', '-');
var config = require('../test/config');
var bot = require('../lib/bot')(config);
var chat = require('../lib/chat')(config, bot);

const TEST_USER = 'test_user';

// Mocks
chat.jub = (function() {
  return {
    user_update_preferences: function(user, update) {
      console.log('updating preference for', user, update);
    },
  };
})();
chat.broadcast = function(channel, obj) {
  console.log('broadcasting:\n', obj);
}
chat.whisper = function(user, channel, obj) {
  console.log('whispering:\n', obj);
}
chat.save_chat_msg = function(obj) {}

// Test cases
function testCase(msg) {
  console.log('\n===', msg, '===');
}

testCase('A client sends a message');
chat.new_chat_message({
  user: TEST_USER,
  text: 'hey!'
});

// A username should be assigned by the time the chat module gets the message
testCase('A no-name client sends a message');
chat.new_chat_message({
  user: undefined,
  text: 'hey!'
});

testCase('A client emotes');
chat.new_chat_message({
  user: TEST_USER,
  text: '/me sees the world spinning round'
});

testCase('A client impersonates the bot');
chat.new_chat_message({
  user: bot.name,
  text: 'hahaha! I am the bot. Bot bot bot.'
});

testCase('A client flusters the bot');
chat.new_chat_message({
  user: TEST_USER,
  text: bot.name + ': what is the meaning of the universe?'
});

testCase('A client asks the bot a valid question');
chat.new_chat_message({
  user: TEST_USER,
  text: bot.name + ': how neat is that?'
});
testCase('A client rephrases the question');
chat.new_chat_message({
  user: TEST_USER,
  text: bot.name + ': how neat is that monkey'
});

testCase('A client changes its color');
chat.new_chat_message({
  user: TEST_USER,
  text: '/color limegreen'
});

testCase('Test welcome message');
chat.welcome(TEST_USER);

testCase('Test "video started" event');
chat.video_started({
  title: 'Rocko\'s modern life S1 E1',
  user: TEST_USER
});

testCase('Test "video skipped" event');
chat.video_skipped(TEST_USER);

testCase('Verify that saved chat objects include the time');
chat.save_chat_msg = function(obj) {
  console.log('has time?', obj.hasOwnProperty('time') && typeof obj.time == 'number');
}
chat.new_chat_message({
  user: TEST_USER,
  text: 'foo'
});

