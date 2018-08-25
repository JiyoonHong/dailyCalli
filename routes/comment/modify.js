const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const crypto = require('crypto');
const verify = require('../jwt_verify');

//댓글수정----------localhost:3000/comment/modify-------------
router.post('/', (req, res) => {
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

    (verify_data, connection, callback) => {
      var com_parent = req.body.com_parent;
      var calli_id = req.body.calli_id;
      var com_seq = req.body.com_seq;
      var com_txt = req.body.com_txt;
      var user_id = verify_data.user_id;
      var com_id = req.body.com_id;
      let selectAtdQuery = 'update calli.comment set calli_id=?, com_parent=?, user_id=?, com_seq=?, com_txt=? where com_id =?';
      connection.query(selectAtdQuery, [calli_id, com_parent, user_id, com_seq, com_txt, com_id], (err, data) => {
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
