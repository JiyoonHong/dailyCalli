const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const crypto = require('crypto');
const verify = require('../jwt_verify');

//댓글쓰기----------localhost:3000/comment/write-------------
router.post('/', (req, res) => {
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


    (verify_data, connection, callback) => {
      var com_parent = Number(req.body.com_parent);
      var com_seq = 1;
      if (com_parent !== 0) {
        connection.query('select count(*) as count from calli.comment where com_parent = ? or com_id = ? ', [req.body.com_parent, req.body.com_parent], (err, seqdata) => {
          if (err) {
            res.status(500).send({
              msg: "fail"
            });
            connection.release();
            callback("fail reason: " + err);
          }
          com_seq = Number(seqdata[0].count) + 1;
          callback(null, verify_data, com_seq, connection);
        });
      } else {
        callback(null, verify_data, com_seq, connection);
      }

    },

    (verify_data, com_seq, connection, callback) => {
      var com_parent = req.body.com_parent;
      let selectAtdQuery = 'insert into comment(calli_id, com_parent, user_id, com_seq, com_txt) values(?, ?, ?, ?, ?)';
      connection.query(selectAtdQuery, [req.body.calli_id, com_parent, verify_data.user_id, com_seq, req.body.com_txt], (err, data) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          res.status(200).send({
            msg: "sucess"
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
