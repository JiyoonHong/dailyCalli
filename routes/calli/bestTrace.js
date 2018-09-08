const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const moment = require('moment');
const verify = require('../jwt_verify');

//배우기 인기
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
            stat: "fail",
            msg: "fail reason"
          });
          connection.release();
          callback("fail reason : " + err);
        } else callback(null, verify_data, connection);
      });
    },

    //2. 배우기 인기 리스트 출력
    (verify_data, connection, callback) => {
      var x = 0,
        y = 10;
      if (req.body.limit !== undefined) {
        x += parseInt(req.body.limit);
        y += parseInt(req.body.limit);
      }

      let guideQ = "select cal.guide_id, gu.guide_title, gu.guide_tag, gu.guide_img from calli.calli as cal " +
        "left outer join (select calli_id, count(*) as count from calli.calliLike " +
        "where DATE_FORMAT(`like_date`, '%Y%U') =  DATE_FORMAT(now(), '%Y%U') -1 group by calli_id) as li on cal.calli_id = li.calli_id " +
        "left outer join calli.guide as gu on cal.guide_id = gu.guide_id " +
        "where cal.calli_trace = 1 and li.count > 0 " +
        "group by cal.guide_id order by sum(li.count) desc limit ?, ?";

      connection.query(guideQ, [x, y], (err, data) => {
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

    (verify_data, connection, data, callback) => {
      var i, resultL = [];
      var listQ = "";
      for (i = 0; i < data.length; i++) {
        listQ += "select cal.calli_id, cal.calli_img from calli.calli as cal " +
          "left outer join (select calli_id, count(*) as count from calli.calliLike group by calli_id) as li on cal.calli_id = li.calli_id " +
          "where guide_id = " + data[i].guide_id + " order by li.count desc limit 6; ";
      }
      connection.query(listQ, (err, list) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          var guide_tag = [];
          for (i = 0; i < data.length; i++) {
            guide_tag = data[i].guide_tag.split(' ');
            resultL[i] = {
              guide_id: data[i].guide_id,
              guide_img: data[i].guide_img,
              guide_title: data[i].guide_title,
              guide_tag: guide_tag,
              trace: list[i]
            }
          }
          res.status(200).send({
            msg: "success",
            list: resultL
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
