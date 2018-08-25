const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const verify = require('../jwt_verify');

//계정좋아요하기
router.put('/', (req, res) => {
  var taskArray = [
    (callback) => {
      let verify_data = verify(req.headers.usertoken);
      callback(null, verify_data);
    },

    (verify_data, callback) => {
      pool.getConnection((err, connection) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          callback("DB connection err : " + err);
        } else callback(null, verify_data, connection);
      });
    },

    (verify_data, connection, callback) => {
      var likeQuery = 'select * from calli.userLike where following_id =? and user_id= ?';
      connection.query(likeQuery, [req.body.follow_id, verify_data.user_id], (err, data) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("err : " + err);
        } else {
          callback(null, data, verify_data, connection);
        }
      });
    },
    (data, verify_data, connection, callback) => {
      var insertLikeQuery = "insert into calli.userLike(following_id, user_id) values(?, ?)";
      var deleteLikeQuery = "delete from calli.userLike where user_id =? and following_id= ?";
      if (data.length == 0) {
        connection.query(insertLikeQuery, [req.body.follow_id, verify_data.user_id], (err) => {
          if (err) {
            res.status(500).send({
              msg: "fail"
            });
            connection.release();
            callback("like error : " + err);
          } else {
            res.status(200).send({
              msg: "successful like"
            });
            connection.release();
            callback(null, "successful like");
          }
        });
      } else {
        connection.query(deleteLikeQuery, [verify_data.user_id, req.body.follow_id], (err) => {
          if (err) {
            res.status(500).send({
              msg: "fail"
            });
            connection.release();
            callback("unlike err : " + err);
          } else {
            res.status(200).send({
              msg: "successful unlike"
            });
            connection.release();
            callback(null, "successful unlike");
          }
        });
      }
    }
  ];
  async.waterfall(taskArray, (err, result) => {
    if (err) console.log(err);
    else console.log(result);
  });
});


module.exports = router;
