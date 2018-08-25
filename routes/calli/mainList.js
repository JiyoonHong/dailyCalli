const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const crypto = require('crypto');
const verify = require('../jwt_verify');


//메인리스트----------localhost:3000/calli/mainList-------------
router.get('/', (req, res) => {
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
          callback("connection err : " + err);
        } else callback(null, verify_data, connection);
      });

    },

    //2. 랭킹
    (verify_data, connection, callback) => {
      let selectAtdQuery = "select li.calli_id, cal.calli_img from calli.calliLike as li " +
        "left outer join calli.calli as cal on li.calli_id = cal.calli_id " +
        "where DATE_FORMAT(`like_date`, '%Y%U') =  DATE_FORMAT(now(), '%Y%U') -1  and calli_trace = 0 " +
        "group by calli_id order by count(*) desc limit 4";
      connection.query(selectAtdQuery, (err, data) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          callback(null, verify_data, connection, data);
        }
      });
    },

    //3.인기배우기
    (verify_data, connection, data, callback) => {
      let selectAtdQuery = "select li.calli_id, cal.calli_img from calli.calliLike as li " +
        "left outer join calli.calli as cal on li.calli_id = cal.calli_id " +
        "where DATE_FORMAT(`like_date`, '%Y%U') =  DATE_FORMAT(now(), '%Y%U') -1 and calli_trace = 1 " +
        "group by calli_id order by count(*) desc limit 4";

      connection.query(selectAtdQuery, (err, data2) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          callback(null, verify_data, connection, data, data2);
        }
      });
    },

    //4.최신
    (verify_data, connection, data, data2, callback) => {
      let selectAtdQuery = "SELECT calli_id, calli_img FROM calli.calli order by calli_date desc limit 4";

      connection.query(selectAtdQuery, (err, data3) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          callback(null, verify_data, connection, data, data2, data3);
        }
      });
    },

    //5.추천
    (verify_data, connection, data, data2, data3, callback) => {
      let selectAtdQuery = "select recal.recom_id, rec.recom_title, cal.calli_id, cal.calli_img from calli.recommend as rec " +
        "left outer join calli.recomCalli AS recal on recal.recom_id = rec.recom_id " +
        "left outer join calli.calli AS cal on recal.calli_id = cal.calli_id where recal.recom_id = 1 limit 4";

      connection.query(selectAtdQuery, (err, data4) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          var pack = [];
          for (var i = 0; i < data4.length; i++) {
            pack[i] = {
              calli_id: data4[i].calli_id,
              calli_img: data4[i].calli_img
            };
          }
          res.status(200).send({
            msg: "success",
            drawTopList: data,
            learnTopList: data2,
            newList: data3,
            recomTitle: data4[0].recom_title,
            recom_id: data4[0].recom_id,
            recomList: pack
          });
          connection.release();
          callback(null, "mainList success");
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
