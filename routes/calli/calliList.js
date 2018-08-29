const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const verify = require('../jwt_verify');

//캘리 리스트들 -----/calli/calliList
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

    (verify_data, connection, callback) => {
      let selectQ = '';
      let x = 0, y = 14;

      //1은 주간랭킹, 2는 인기배우기, 3은 최신순
      if (parseInt(req.body.order) === 1) {
        selectQ = "select li.calli_id, cal.calli_img, cal.calli_title, users.user_id, users.user_img, users.user_nickname from calli.calliLike as li " +
          "left outer join calli.calli as cal on li.calli_id = cal.calli_id " +
          "left outer join calli.users on cal.user_id = users.user_id " +
          "where DATE_FORMAT(`like_date`, '%Y%U') =  DATE_FORMAT(now(), '%Y%U') -1  and calli_trace = 0 " +
          "group by calli_id order by count(*) desc limit ?, ?";
      } else if (parseInt(req.body.order) === 2) {
        selectQ = "select li.calli_id, cal.calli_img, cal.calli_title, users.user_id, users.user_img, users.user_nickname from calli.calliLike as li " +
          "left outer join calli.calli as cal on li.calli_id = cal.calli_id " +
          "left outer join calli.users on cal.user_id = users.user_id " +
          "where DATE_FORMAT(`like_date`, '%Y%U') =  DATE_FORMAT(now(), '%Y%U') -1  and calli_trace = 1 " +
          "group by calli_id order by count(*) desc limit ?, ?";
      } else if (parseInt(req.body.order) === 3) {
        selectQ = "SELECT calli_id, calli_img, calli_title, calli.user_id, user_img, user_nickname FROM calli.calli " +
          "left outer join calli.users on calli.user_id = users.user_id " +
          "order by calli_date desc limit ?, ?";
      }
      if (req.body.limit !== undefined) {
        x += req.body.limit;
        y += req.body.limit;
      }
      connection.query(selectQ, [x, y], (err, data) => {
        if(err){
          res.status(500).send({
            msg : 'fail'
          });
          connection.release();
          callback("fail reason: " + err);
        }else{
          res.status(200).send({
            msg: 'success',
            limit: y,
            calliList: data
          });
          connection.release();
          callback(null, "calliList success");
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
