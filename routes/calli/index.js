var express = require('express');
var router = express.Router();
var mainList = require('./mainList');
var detail = require('./detail');
var newList= require('./newList');
var upload = require('./upload');
var userLike = require('./userLike');
var calliLike = require('./calliLike');
var modify =require('./modify');
var mainSearch = require('./mainSearch');
var deleted = require('./deleted', deleted);
var calliList = require('./calliList', calliList);
var traceSearch = require('./traceSearch', traceSearch);
var drawTopList = require('./drawTopList', drawTopList);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/mainList', mainList);
router.use('/detail', detail);
router.use('/newList', newList);
router.use('/upload', upload);
router.use('/userLike', userLike);
router.use('/calliLike', calliLike);
router.use('/modify', modify);
router.use('/delete', deleted);
router.use('/mainSearch', mainSearch);
router.use('/calliList', calliList);
router.use('/traceSearch', traceSearch);
router.use('/drawTopList', drawTopList);
module.exports = router;
