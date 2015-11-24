// Logging
var morgan = require('morgan');
var moment = require('moment');

module.exports = function(app, stamp_opts, moment_format, morgan_format) {
  if (typeof stamp_opts == 'undefined')
    stamp_opts = { pattern: 'yyyy-mm-dd HH:MM:ss.l' };

  if (typeof moment_format == 'undefined')
    moment_format = 'YYYY-MM-DD HH:mm:ss.SSS';

  if (typeof morgan_format == 'undefined')
    morgan_format = '[:date[iso]] [REQ]   ":method :url" :status :remote-addr';

  if (!this.set) {
    if (stamp_opts)
      require('console-stamp')(console, stamp_opts);
    if (app) {
      morgan.token('date', function(req, res) {
        return moment().format(moment_format);
      });
      app.use(morgan(morgan_format));
    }
    this.set = true;
  }
}

// Include in most server-side files like this:
//
//   require('./logging')();
