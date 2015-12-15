var mongoose = require('mongoose');

// Note: schema <=> collection
function basic_schemas(config, auth) {
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
      // Add just-finished videos back to the user's queue
      requeueVideos: { type: Boolean, default: false },
    },
  }
}

module.exports = function(config, auth) {
  schemas = basic_schemas(config, auth);
  var models = {}
  for (name in schemas) {
    models[name] = mongoose.model(name, mongoose.Schema(schemas[name]));
  }

  // Schemas with named subschemas
  var playlist_video_schema = mongoose.Schema({
    position: Number,
    id: String,
    title: String,
    duration: Number,
  });
  models.PlaylistVideo = mongoose.model('PlaylistVideo', playlist_video_schema);
  models.Playlist = mongoose.model('Playlist', mongoose.Schema({
    name: { type: String, unique: true },
    user: String,
    createdAt: Date,
    lastModifiedAt: Date,
    videos: [playlist_video_schema],
  }));

  return models;
}
