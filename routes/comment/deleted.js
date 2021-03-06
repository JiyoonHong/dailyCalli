const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const verify = require('../jwt_verify');

//댓글
router.delete('/', (req, res) => {
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
          callback("DB connection err : " + err);
        } else {
          callback(null, verify_data, connection);
        }
      });
    },
    //게시글 삭제
    (verify_data, connection, callback) => {
      let selectAtdQuery = 'delete from calli.comment where com_id = ? or com_parent = ?';
      connection.query(selectAtdQuery, [parseInt(req.body.com_id), parseInt(req.body.com_id)], (err, data) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("query error : " + err);
        } else {
          //삭제 성공.
          res.status(200).send({
            msg: "success"
          });

          connection.release();
          callback(null, "successful");
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
