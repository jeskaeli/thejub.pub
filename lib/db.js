var mongoose = require('mongoose');
var async = require("async");
require('./logging')();

// Returns a mongoose connection
function DB(config, models) {
  mongoose.connect(config.mongodb_endpoint + '/' + config.mongodb_db);
  var conn = mongoose.connection;
  var db = this;
  this.ready = false;

  conn.on('error', console.error.bind(console, 'connection error:'));
  conn.once('open', function (callback) {
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

  this.updateUserPreferences = function(user, newPrefs) {
    models.UserPreferences.findOne({ name: user }, function(err, obj) {
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
      if (newPrefs.hasOwnProperty('requeueVideos')) {
        obj.requeueVideos = newPrefs.requeueVideos;
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
        if (err) return console.error(err);
        callback(res || {});
      }
    );
  }

  this.updateOrCreatePlaylist = function(playlist, callback) {
    if (!playlist.hasOwnProperty('name') ||
        !playlist.hasOwnProperty('user'))
      return;
    models.Playlist.findOne({ user: playlist.user, name: playlist.name }, function(err, obj) {
      console.log('updating/creating playlist', playlist.name, 'for', playlist.user);
      if (err) return console.error(err);
      if (playlist.hasOwnProperty('videos')) {
        if (!obj) {
          console.log('CREATING new playlist for', playlist.user);
          obj = models.Playlist({
            user: playlist.user,
            name: playlist.name,
            createdAt: Date.now()
          });
        }
        obj.videos = playlist.videos;
        obj.lastModifiedAt =  Date.now();
        obj.save();
        if (typeof callback == 'function') {
          callback(playlist);
        }
      }
    });
  }

  this.fetchOrInitPlaylists = function(user, callback) {
    if (!user) { return; }
    console.log('fetching/initializing playlists for', user);
    models.Playlist.find({ user: user }, function(err, obj) {
      if (err) return console.error(err);
      if (obj.length == 0) {
        console.log('No playlists for', user);
        var playlists = []
        async.series([
          function(done) {
            db.updateOrCreatePlaylist({
              name: 'sandbox',
              user: user,
              videos: []
            }, function(playlist) {
              playlists = [playlist];
              done();
            });
          },
          function(done) {
            callback(playlists);
            done();
          }
        ]);
      } else {
        console.log('found playlists', obj);
        callback(obj);
      }
    });
  }
}

// Currently returns a mongoose connection - later, abstract this
module.exports = function(config, models) {
  return new DB(config, models);
}
