var RandBytes = new require('randbytes');
var crypto = require('crypto');

function Auth(config) {
  this.token_len =  config.auth.token_len
}

// sha256, returned in base64
Auth.prototype.encode_token = function(token) {
  var shasum = crypto.createHash('sha256');
  shasum.update(token);
  return shasum.digest('base64');
}

// bytes from /dev/urandom/ --> base64 --> [0..len]
Auth.prototype.gen_token = function(callback) {
  var randomSource = RandBytes.urandom.getInstance();

  randomSource.getRandomBytes(this.token_len, function (buff) {
    var token = buff.toString('hex', 0, this.token_len);
    callback(token);
  });
}

// singleton
module.exports = function(config) {
  return new Auth(config);
}
