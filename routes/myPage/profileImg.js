const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const crypto = require('crypto');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
const verify = require('../jwt_verify');

const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'jiyoon1217',
    acl: 'public-read',
    key: function(req, file, cb) {
      cb(null, Date.now() + '.' + file.originalname.split('.').pop());
    }
  })
});

//프로필이미지변경----------localhost:3000/myPage/profileImg-------------
router.post('/', upload.single('image'), (req, res) => {
  let com = [];
  let taskArray = [
    (callback) => {
      let verify_data = verify(req.headers.usertoken);
      callback(null, verify_data);
    },

    //1. connection을 pool로부터 가져옴
    (verify_data, callback) => {
      pool.getConnection((err, connection) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          callback("fail reason : " + err);
        } else callback(null, verify_data, connection);
      });
    },
    //2. 전체 리스트 출력
    (verify_data, connection, callback) => {
      let image = req.file.location;
      let selectAtdQuery = 'update calli.users set user_img=? where user_id=?';
      connection.query(selectAtdQuery, [image, verify_data.user_id], (err, data) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          res.status(200).send({
            msg: "success"
          });
          connection.release();
          callback(null, "successful imgChange");
        }
      });

    }

  ];
  async.waterfall(taskArray, (err, result) => {
    if (err) console.log(err);
    else console.log(result);
  });
});

module.exports = router;
