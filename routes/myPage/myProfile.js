const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const verify = require('../jwt_verify');

//내프로필 -----/myProfile
router.get('/', (req, res) => {
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

    //유저정보
    (verify_data, connection, callback) => {
      var x = 0,
        y = 12;
      var user_id = verify_data.user_id;
      var queryS = "select  us.user_id, us.user_email, us.user_nickname, us.user_img, us.user_intro, " +
        "count(*) as boardCount, if(isnull(following),0,1) as following, if(isnull(follower),0,1) as follower from calli.users as us " +
        "left outer join calli.calli on us.user_id = calli.user_id " +
        "left outer join (select user_id ,count(*) as following from calli.userLike where user_id = ?) as fl on fl.user_id = us.user_id " +
        "left outer join (select following_id ,count(*) as follower from calli.userLike where user_id = ?) as ff on ff.following_id = us.user_id " +
        "where us.user_id = ?";

      connection.query(queryS, [user_id, user_id, user_id], (err, data) => {
        if (err) {
          res.status(500).send({
            msg: 'fail'
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          var x = 0,
            y = 12;
          if (req.body.limit !== undefined) {
            x += parseInt(req.body.limit);
            y += parseInt(req.body.limit);
          }
          res.status(200).send({
            msg: 'success',
            user_id: data[0].user_id,
            user_img: data[0].user_img,
            user_intro: data[0].user_intro,
            user_nickname: data[0].user_nickname,
            user_email: data[0].user_email,
            postCount: data[0].boardCount,
            follower: data[0].follower,
            following: data[0].following
          });
          connection.release();
          callback(null, "myProfile success");
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
