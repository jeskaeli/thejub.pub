var mongoose = require('mongoose');

// Note: schema <=> collection
function gen_schemas(config, auth) {
  return {
    auth_token: {
      selector: { type: String, maxLength: 12, minLength: 12 },
        token: {
          type: String,
          set: auth.encode_token
        },
        userid: { type: Number, min: 0 },
        created_at: { type: Date, expires: '5d' }
    }
  }
}

module.exports = function(config, auth) {
  schemas = gen_schemas(config, auth);
  var models = {}
  for (var name in schemas) {
    models[name] = mongoose.model(name, mongoose.Schema(schemas[name]));
  }
  return models;
}
