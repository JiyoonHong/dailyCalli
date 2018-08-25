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

//undefined검사 함수
function undCheck(str) {
  if (str === undefined) {
    return null;
  } else {
    return str;
  }
}

//s3에 파일 저장
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

//캘리업로드----------localhost:3000/calli/upload-------------
router.post('/', upload.fields([{
  name: 'image',
  maxCount: 1
}, {
  name: 'drawData',
  maxCount: 5
}]), (req, res) => {
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
      let guide_id, calli_txt, image;
      let calli_trace = req.body.calli_trace;
      let calli_tag = req.body.calli_tag;
      let user_id = verify_data.user_id;
      let calli_title = req.body.calli_title;
      let drawData = new Array();

      image = undCheck(req.files.image[0].location);
      calli_txt = undCheck(req.body.calli_txt);
      guide_id = undCheck(req.body.guide_id);

      //그림 획별 데이터 저장
      for (let i = 0; i < req.files.drawData.length; ++i) {
        drawData[i] = req.files.drawData[i].location;
      }

      //배열을 string으로 변환
      let drawIn = drawData.toString();

      let selectAtdQuery = 'insert into calli(user_id, calli_tag, calli_txt, calli_trace, guide_id, calli_img, calli_drawData, calli_title) values(?, ?, ?, ?, ?, ?, ?, ?)';
      connection.query(selectAtdQuery, [user_id, calli_tag, calli_txt, calli_trace, guide_id, image, drawIn, calli_title], (err, data) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          res.status(200).send({
            msg: "success",
          });
          connection.release();
          callback(null, "successful calli write");
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
