const express = require('express');
const router = express.Router();
const async = require('async');
const crypto = require('crypto');
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
const key = require('../config/secret');

//토큰체크
router.get('/', (req, res) => {
  let taskArray = [
    //1. connection을 pool로부터 가져옴
    (callback) => {
      jwt.verify(req.headers.usertoken, key.secret, (err, data) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          callback("err : " + err);
        } else {
          let option = {
            algorithm: "HS512",
            expiresIn: 3
          };
          var payload = {
            email: data.email,
            user_id: data.user_id,
            ser_nickname: data.user_nickname
          };
          jwt.sign(payload, req.app.get('secret'), option, (err, token) => {
            if (err) {
              res.status(500).send({
                msg: 'fail'
              });
              callback("token err : " + err);
            } else {
              var userInfo ={
                email: data.email,
                user_id: data.user_id,
                user_nickname: data.user_nickname,
                token: token
              }
              res.status(200).send({
                msg: "success",
                userInfo: userInfo
              });
              callback(null, "tokenCheck success");
            }
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


module.exports = router;
