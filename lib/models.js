var mongoose = require('mongoose');

// Note: schema <=> collection
function basicSchemas(config, auth) {
  return {
    AuthToken: {
      selector: { type: String, maxLength: 12, minLength: 12 },
        token: {
          type: String,
          set: auth.encode_token
        },
        userId: { type: Number, min: 0 },
        createdAt: { type: Date, expires: '5d' }
    },
    UserPreferences: {
      name: { type: String, unique: true },
      createdAt: Date,
      color: String,
      selectedPlaylist: String, // a playlist name
      // Add just-finished videos back to the user's queue
      requeueVideos: { type: Boolean, default: false },
    },
  }
}

module.exports = function(config, auth) {
  schemas = basicSchemas(config, auth);
  var models = {}
  for (name in schemas) {
    models[name] = mongoose.model(name, mongoose.Schema(schemas[name]));
  }

  // Schemas with named subschemas
  var playlistVideoSchema = mongoose.Schema({
    position: Number,
    id: String,
    title: String,
    duration: Number,
  });
  models.PlaylistVideo = mongoose.model('PlaylistVideo', playlistVideoSchema);
  models.Playlist = mongoose.model('Playlist', mongoose.Schema({
    name: { type: String, unique: true },
    user: String,
    createdAt: Date,
    lastModifiedAt: Date,
    videos: [playlistVideoSchema],
  }));

  return models;
}
