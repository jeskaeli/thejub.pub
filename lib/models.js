var mongoose = require('mongoose');

// Note: schema <=> collection
function gen_schemas(config, auth) {
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
  schemas = gen_schemas(config, auth);
  var models = {}
  for (name in schemas) {
    models[name] = mongoose.model(name, mongoose.Schema(schemas[name]));
  }
  return models;
}
