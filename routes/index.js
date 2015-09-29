var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'jub.dj'
  });
});

// TODO not really using this
router.post('/username', function(req, res, next) {
  res.send('username post received');
});

module.exports = router;
