var express = require('express');
var router = express.Router();
var util = require('../util');

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.path == '/baronandthenowheremen') {
    res.render('index', { title: 'jub.dj' }, function(err, html) {
      if (err) {
        console.error(err.message);
        next.send(html);
      } else {
        res.send(html);
      }
    });
  } else {
    res.render('moved', function(err, html) {
      if (err) {
        console.error(err.message);
        next.send(html);
      } else {
        res.send(html);
      }
    });
  }

});

module.exports = router;
