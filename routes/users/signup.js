const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const crypto = require('crypto');
const aws = require('aws-sdk');


//회원가입 진행
router.post('/', (req, res) => {
  let taskArray = [
    //1. connection을 pool로부터 가져옴
    (callback) => {
      pool.getConnection((err, connection) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          callback("connection err : " + err);
        } else callback(null, connection);
      });
    },

    //2.입력 안 한 부분 처리, 이메일 형식 맞는지 처리
    (connection, callback) => {
      // console.log(req.body);
      var emailEtr = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
      //var passEtr=/^[A-Za-z0-9]{6,12}$/;
      if (req.body.email === undefined) {
        res.status(500).send({
          msg: "fail"
        });
        connection.release();
        callback("No email entered.");
      } else if (!emailEtr.test(req.body.email)) {
        res.status(500).send({
          msg: "fail"
        });
        connection.release();
        callback("The email you entered does not fit the form.");
      } else if (req.body.pwd === undefined) {
        res.status(500).send({
          msg: "fail"
        });
        connection.release();
        callback("No pwd entered.");
      } else if (req.body.nickname === undefined) {
        res.status(500).send({
          msg: "fail"
        });
        connection.release();
        callback("nickname undefined.");
      } else {
        callback(null, connection);
      }
    },

    //5. 쿼리를 사용해 DB에 insert
    (connection, callback) => {
      var email = req.body.email;

      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("sign up err : " + err);
        } else {
          //console.log(req.file);
          let insertUser = 'insert into users(user_email, user_pwd, user_salt,  user_nickname) values(?, ?, ?, ?)';
          let salt = buffer.toString('base64');
          crypto.pbkdf2(req.body.pwd, salt, 100000, 64, 'sha512', function(err, hashed) {
            let saltPWD = hashed.toString('base64');

            var nickname = req.body.nickname;
            connection.query(insertUser, [email, saltPWD, salt, nickname], (err, result) => {
              if (err) {
                res.status(500).send({
                  msg: "fail"
                });
                connection.release();
                callback("hashing err : " + err);
              } else {
                res.status(200).send({
                  msg: "success"
                });
                connection.release();
                callback(null, "signup success");
              }
            });
          });
        }
      });
    }
  ];
  async.waterfall(taskArray, (err, result) => {
    if (err) console.log(err);
    else console.log(result);
  });
});



///이메일 중복 확인
router.post('/email', (req, res) => {
  let taskArray = [
    //1. connection을 pool로부터 가져옴
    (callback) => {
      pool.getConnection((err, connection) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          callback("connection err : " + err);
        } else callback(null, connection);
      });
    },

    //3. 이메일 중복확인
    (connection, callback) => {
      var emailEtr = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
      console.log("req.body.email: " + req.body.email);
      let checkQuery = 'select * from users where user_email= ?';
      if (!emailEtr.test(req.body.email)) {
        res.status(200).send({
          msg: "email format is incorrect"
        });
        connection.release();
        callback(null, "Email format is incorrect");
      } else {
        connection.query(checkQuery, [req.body.email], (err, result) => {
          if (err) {
            res.status(500).send({
              msg: "fail"
            });
            connection.release();
            callback("connection err : " + err);
          } else {
            if (result.length === 0) {
              res.status(200).send({
                msg: "email available"
              });
              connection.release();
              callback(null, "email available.");
            } else {
              res.status(200).send({
                msg: "duplicate email"
              });
              connection.release();
              callback(null, "duplicate email.");
            }
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


///이메일 중복 확인
router.post('/nickname', (req, res) => {
  let taskArray = [
    //1. connection을 pool로부터 가져옴
    (callback) => {
      pool.getConnection((err, connection) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          callback("connection err : " + err);
        } else callback(null, connection);
      });
    },

    //3. 이메일 중복확인
    (connection, callback) => {

      console.log("req.body.nickname: " + req.body.nickname);
      let checkQuery = 'select * from users where user_nickname= ?';

      connection.query(checkQuery, [req.body.nickname], (err, result) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("connection err : " + err);
        } else {
          if (result.length === 0) {
            res.status(200).send({
              msg: "nickname available"
            });
            connection.release();
            callback(null, "nickname available.");
          } else {
            res.status(200).send({
              msg: "duplicate nickname"
            });
            connection.release();
            callback(null, "duplicate nickname.");
          }
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
