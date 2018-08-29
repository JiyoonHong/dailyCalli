var express = require('express');
var router = express.Router();
var write = require('./write');
var modify =require('./modify');
var deleted = require('./deleted', deleted);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/write', write);
router.use('/modify', modify);
router.use('/delete', deleted);
module.exports = router;
