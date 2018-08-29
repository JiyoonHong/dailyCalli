const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const verify = require('../jwt_verify');
const moment = require('moment');

//내게시물 -----/myPost
router.post('/', (req, res) => {
  let taskArray = [
    (callback) => {
      let verify_data = verify(req.headers.usertoken);
      callback(null, verify_data);
    },

    (verify_data, callback) => {
      pool.getConnection((err, connection) => {
        if (err) {
          res.status(500).send({
            'msg': fail
          });
          callback('DB connection err:' + err);
        } else {
          callback(null, verify_data, connection);
        }
      });
    },

    //내 게시물정보
    (verify_data, connection, callback) => {
      let com_count = 0;
      let scrap_count = 0;
      let calli_id = parseInt(req.params.calli_id);
      let x = 0,
        y = 12;

      if (req.body.limit !== undefined) {
        x += parseInt(req.body.limit);
        y += parseInt(req.body.limit);
      }

      var user_id = verify_data.user_id;
      var queryS = " select cal.*, us.user_nickname, us.user_img, if(isnull(com.commentCount),0,com.commentCount) as commentCount, " +
        "if(isnull(li.likeCount),0,li.likeCount) as likeCount, if(isnull(lb.likeBool),false, true) as likeBool from calli.calli as cal " +
        "left outer join users as us on cal.user_id = us.user_id " +
        "left outer join (select count(*) as commentCount, calli_id from calli.comment group by calli_id) as com on cal.calli_id = com.calli_id " +
        "left outer join (select count(*) as likeCount, calli_id from calli.calliLike group by calli_id) as li on cal.calli_id = li.calli_id " +
        "left outer join (select user_id as likeBool, calli_id from calli.calliLike where user_id = 4) as lb on cal.calli_id = lb.calli_id " +
        "where us.user_id = ? order by cal.calli_date desc";

      connection.query(queryS, user_id, (err, data) => {
        if (err) {
          res.status(500).send({
            msg: 'fail'
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          var calliBool, likeBool;
          var pack = [];
          for (var i = 0; i < data.length; i++) {
            if (data[i].user_id === verify_data.user_id) {
              calliBool = true;
            } else {
              calliBool = false;
            }
            if (data[i].likeBool === 1) {
              likeBool = true;
            } else {
              likeBool = false;
            }
            pack[i] = {
              calli_id: data[i].calli_id,
              calli_img: data[i].calli_img,
              calli_title: data[i].calli_title,
              calli_txt: data[i].calli_txt,
              calli_date: moment(data[i].calli_date).format('YYYY.MM.DD'),
              calli_tag: data[i].calli_tag,
              calliBool: calliBool,
              user_nickname: data[i].user_nickname,
              user_img: data[i].user_img,
              commentCount: data[i].commentCount,
              likeCount: data[i].likeCount,
              likeBool: data[i].likeBool
            }
          }

          res.status(200).send({
            msg: "success",
            limit: y,
            myPostList: pack
          });

          connection.release();
          callback(null, "success");
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
