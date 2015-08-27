var util = require('util');

function ForSale(num_players) {
  this.num_players = num_players;

  console.log("New ForSale game: %s", util.inspect(this));

  this.update_state = function(msg) {
    console.log("ForSale updating state with: %s", msg);
  }
}

module.exports = function(num_players) {
  return new ForSale(num_players); //TODO all args
}
