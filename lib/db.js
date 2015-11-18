var mongoose = require('mongoose');
require('./logging')();

// Returns a mongoose connection
function DB(config, models) {
  mongoose.connect(config.mongodb_endpoint + '/' + config.mongodb_db);
  var db = mongoose.connection;

  this.ready = false;

  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function (callback) {
    console.log("successful connection to db %s", config.mongodb_db);
    this.ready = true;
  });

  this.storeAuth = function(selector, token, userid) {
    var a = new models.AuthToken({
      selector: selector,
      token: token,
      userId: userid,
      createdAt: Date.now()
    });

    /*
    a.save(function (err, a) {
      if (err) return console.error(err);
    });
    */
    console.log("auth object:", a); // TODO
  }

  // Callback will be called with updated object
  this.updateUserPreferences = function(user, newPrefs) {
    models.UserPreferences.findOne({ name: user }, function(err, obj) {
      console.log('find done', err, obj);
      if (err) return console.error(err);
      if (!obj) {
        console.log('creating new record for', user);
        obj = models.UserPreferences({
          name: user,
          createdAt: Date.now()
        });
      }
      if (newPrefs.hasOwnProperty('color')) {
        obj.color = newPrefs.color;
      }
      obj.save();
    });
  }

  // TODO use a 'post' middleware to provide a default color?
  this.fetchUserPreferences = function(user, callback) {
    console.log('fetching user record for', user);
    var res = models.UserPreferences.findOne(
      { name: user },
      function(err, res) {
        console.log('find callback', err, res);
        if (err) return console.error(err);
        callback(res || {});
      }
    );
  }

}

// Currently returns a mongoose connection - later, abstract this
module.exports = function(config, models) {
  return new DB(config, models);
}
