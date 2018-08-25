const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const crypto = require('crypto');
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
const key = require('../../config/secret');

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

    //2.입력 안 한 부분 처리
    (connection, callback) => {
      if (req.body.email === undefined) {
        res.status(500).send({
          msg: "fail"
        });
        connection.release();
        callback("No email entered.");
      } else if (req.body.pwd === undefined) {
        res.status(500).send({
          msg: "fail"
        });
        connection.release();
        callback("No pwd entered.");
      } else {
        callback(null, connection);
      }
    },

    //3. 아이디 유무확인
    (connection, callback) => {
      let checkMail = 'select * from users where user_email=?';
      connection.query(checkMail, [req.body.email], (err, result) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("DB err : " + err);
        } else {
          if (result.length === 0) {
            res.status(500).send({
              msg: "fail"
            });
            connection.release();
            callback("login failed. : " + err);
          } else {
            callback(null, connection);
          }
        }
      });
    },
    //4. 비밀번호 확인
    (connection, callback) => {
      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("login err : " + err);
        } else {
          let selectDB = 'select * from users where user_email=?'
          connection.query(selectDB, [req.body.email], (err, data) => {
            if (err) {
              res.status(500).send({
                msg: "fail"
              });
              connection.release();
              callback("login err : " + err);
            } else {
              let salt = data[0].user_salt;
              let checkPWD = data[0].user_pwd;
              let userMail = data[0].user_email;
              crypto.pbkdf2(req.body.pwd, salt, 100000, 64, 'sha512', function(err, hashed) {
                let saltPWD = hashed.toString('base64');
                if (checkPWD === saltPWD) {
                  callback(null, data, connection);
                } else {
                  res.status(500).send({
                    msg: "fail"
                  });
                  connection.release();
                  callback("login err : " + err);
                }
              });

            }
          });
        }
      });

    },

    //5. token처리
    (data, connection, callback) => {
      let option = {
        algorithm: "HS512",
        expiresIn: 3600 * 24 * 100
      };
      let payload = {
        email: req.body.email,
        user_id: data[0].user_id,
        user_nickname: data[0].user_nickname
      };

      jwt.sign(payload, req.app.get('secret'), option, (err, token) => {
        if (err) {
          res.status(500).send({
            msg: 'fail'
          });
          callback("token err : " + err);
        } else {
          let pack = {
            email: req.body.email,
            user_id: data[0].user_id,
            user_nickname: data[0].user_nickname,
            token: token
          };
          res.status(200).send({
            msg: "success",
            userInfo: pack
          });
          connection.release();
          callback(null, "login success");
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
