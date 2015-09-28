var mongoose = require('mongoose');

// Returns a mongoose connection
function DB(config, models) {
  mongoose.connect(config.mongodb_endpoint + '/' + config.mongodb_db);
  var db = mongoose.connection;

  this.models = models;
  this.connection = db; // You don't seem to need this, but whatevs
  this.ready = false; // Hacky and not used

  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function (callback) {
    console.log("successful connection to db %s", config.mongodb_db);
    this.ready = true;
  });
}

DB.prototype.store_auth = function(selector, token, userid) {
  var a = new this.models['auth_token']({
    selector: selector,
    token: token,
    userid: userid,
    created_at: Date.now()
  });

  /*
  a.save(function (err, a) {
    if (err) return console.error(err);
  });
  */
  console.log("auth object:", a); // TODO
}

// Currently returns a mongoose connection - later, abstract this
module.exports = function(config, models) {
  return new DB(config, models);
}
