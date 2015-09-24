var mongoose = require('mongoose');

function DB(config) {
  mongoose.connect(config.mongodb_endpoint + '/' + config.mongodb_db);
  var db = mongoose.connection;

  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function (callback) {

    var kittySchema = mongoose.Schema({
      name: String
    });
    var Kitten = mongoose.model('Kitten', kittySchema);
    var fluffy = new Kitten({ name: 'fluffy' });
    console.log("successful connection to db %s", config.mongodb_db);
    fluffy.save(function (err, fluffy) {
      if (err) return console.error(err);
    });
  });
}

module.exports = function(config) {
  return new DB(config);
}
