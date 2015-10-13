// Logging
var morgan = require('morgan');
var moment = require('moment');

module.exports = function(app) {
  require('console-stamp')(console, { pattern : "yyyy-mm-dd HH:MM:ss.l" });
  if (app) {
    morgan.token('date', function(req, res) {
      return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    });
    app.use(morgan('[:date[iso]] [REQ]   ":method :url" :status :res[content-length]'));
  }
}

// Include in most server-side files like this:
//
//   require('./logging')();
