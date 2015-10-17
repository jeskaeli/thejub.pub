var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require('./config') || {
  private_route: '/foo',
  moved_message: 'Ask around for the new URL!'
};

var app = express();
require('./lib/logging')(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true;

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(
  path.join(__dirname, 'public'),
  {
    redirect: false
  }
));

config.url_path = config.url_path || '/foo'

/* GET home page. */
app.get(config.private_route, function(req, res, next) {
  if (req.path == config.private_route) {
    res.render('index', { title: config.title }, function(err, html) {
      if (err) {
        console.error(err.message);
        next.send(html);
      } else {
        res.send(html);
      }
    });
  }
});
app.get('/', function(req, res, next) {
  res.render('moved', { message: config.moved_message }, function(err, html) {
    if (err) {
      console.error(err.message);
      next.send(html);
    } else {
      res.send(html);
    }
  });
});


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

app.auth = require('./lib/auth')(config);
app.models = require('./lib/models')(config, app.auth);
app.db = require('./lib/db')(config, app.models);
app.gapi = require('./lib/gapi')(config); // doesn't need to be an app member
app.bot = require('./lib/bot')(config, app.gapi);
app.chat = require('./lib/chat')(config, app.bot);
app.jub = require('./lib/jub_dj')(config, app.gapi, app.chat);
app.config = config;

// Note: in ./bin/www -> socket-routing.js, the jub receives a callback
// that allows it to *initiate* messages over the sockets


/* scratch */
var token = app.auth.gen_token(function(token) {
  console.log("generated token:", token);
  console.log("encoded token:", app.auth.encode_token(token));
  app.db.store_auth('123456abcdef', token, 1);
});
/* scratch over */

module.exports = app;
