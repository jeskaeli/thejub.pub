var express = require('express');
var router = express.Router();
var util = require('../util');

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.path == '/') {
    res.render('index', {
      title: 'jub.dj'
    });
  }
});

module.exports = router;
