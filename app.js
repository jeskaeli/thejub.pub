var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var config = require('./config');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true;

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.auth = require('./auth')(config);
app.models = require('./models')(config, app.auth);
app.db = require('./db')(config, app.models);
app.jub = require('./jub_dj')(config);

/* TODO scratch */
var token = app.auth.gen_token(function(token) {
  console.log("generated token:", token);
  console.log("encoded token:", app.auth.encode_token(token));
  app.db.store_auth('123456abcdef', token, 1);
});
/* scratch over */

app.new_msg = function(msg) {
  console.log("received chat message", msg['text']);
}

app.update_video_state = function(video_id) {
  console.log("Playing video", video_id);
  app.jub.update_video_state(video_id);
}

module.exports = app;
