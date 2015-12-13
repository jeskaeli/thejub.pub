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

  // If you want to update the playlist before it's saved:
  //   - Provide a callback that accepts the fetched playlist and a function.
  //   - Update the playlist if you wish and then call the function. When you call
  //     that function, you may pass it yet another function which will be called after
  //     the model has been successfully saved.
  // If you don't want to update the playlist, don't provide a callback.
  this.updateOrCreatePlaylist = function(user, playlist_name, callback) {
    if (!user || !playlist_name)
      return;
    models.Playlist.findOne({ user: user, name: playlist_name }, function(err, obj) {
      console.log('updating/creating playlist', playlist_name, 'for', user);
      if (err) return console.error(err);
      if (!obj) {
        console.log('CREATING new playlist for', user, playlist_name);
        obj = models.Playlist({
          user: user,
          name: playlist_name,
          createdAt: Date.now(),
          videos: []
        });
      }
      console.log('updateorcreateplaylist', typeof callback);
      if (typeof callback == 'function') {
        console.log('about to call callback');
        // User modifies the playlist before we save it
        callback(obj, function(finale) {
          obj.lastModifiedAt =  Date.now();
          obj.save(finale);
        });
      } else {
        obj.lastModifiedAt =  Date.now();
        obj.save();
      }
    });
  }

  // Fetch all playlists for user
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
            // This is the 'init' part -- if no playlists for user, create 'sandbox'
            db.updateOrCreatePlaylist(user, 'sandbox', function(playlist) {
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
