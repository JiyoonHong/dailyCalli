var express = require('express');
var router = express.Router();
var profileImg = require('./profileImg');
var myProfile = require('./myProfile');
var myPost = require('./myPost');


router.use('/profileImg', profileImg);
router.use('/myProfile', myProfile);
router.use('/myPost', myPost);
module.exports = router;
