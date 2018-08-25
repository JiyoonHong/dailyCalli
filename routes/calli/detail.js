const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const crypto = require('crypto');
const moment = require('moment');
const verify = require('../jwt_verify');

//게시글 상세보기---------/board/list/:board_id-------------
router.get('/:calli_id', (req, res) => {
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
            stat: "fail",
            msg: "fail reason"
          });
          callback("fail reason : " + err);
        } else callback(null, verify_data, connection);
      });
    },
    //2. 게시글 상세보기
    (verify_data, connection, callback) => {
      let com_count = 0;
      let scrap_count = 0;
      let calli_id = Number(req.params.calli_id);
      let selectAtdQuery = "select cal.*, us.user_nickname, us.user_img, if(isnull(com.commentCount),0,com.commentCount) as commentCount, " +
        "if(isnull(li.likeCount),0,li.likeCount) as likeCount, if(isnull(lb.likeBool),false, true) as likeBool from calli.calli as cal " +
        "left outer join users as us on cal.user_id = us.user_id " +
        "left outer join (select count(*) as commentCount, calli_id from calli.comment group by calli_id) as com on cal.calli_id = com.calli_id " +
        "left outer join (select count(*) as likeCount, calli_id from calli.calliLike group by calli_id) as li on cal.calli_id = li.calli_id " +
        "left outer join (select user_id as likeBool, calli_id from calli.calliLike where user_id = ?) as lb on cal.calli_id = lb.calli_id " +
        "where cal.calli_id = ?";
      connection.query(selectAtdQuery, [Number(verify_data.user_id), calli_id], (err, data) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          //console.log(data);
          callback(null, verify_data, data, connection);
        }
      });

    },

    (verify_data, data, connection, callback) => {
      connection.query('select * from calli.comment where calli_id=? order by if(com_parent=0, com_id,com_parent), com_seq ', Number(req.params.calli_id), (err, comdata) => {
        if (err) {
          res.status(500).send({
            msg: "fail"
          });
          connection.release();
          callback("fail reason: " + err);
        } else {
          var calliBool;
          var likeBool;
          if (data[0].user_id === verify_data.user_id) {
            calliBool = true;
          } else {
            calliBool = false;
          }
          if (data[0].likeBool === 1) {
            likeBool = true;
          } else {
            likeBool = false;
          }
          let pack = {
            calli_id: data[0].calli_id,
            calli_img: data[0].calli_img,
            calli_txt: data[0].calli_txt,
            calli_date: moment(data[0].calli_date).format('YYYY.MM.DD'),
            calli_tag: data[0].calli_tag,
            calliBool: calliBool,
            user_nickname: data[0].user_nickname,
            user_img: data[0].user_img,
            commentCount: data[0].commentCount,
            likeCount: data[0].likeCount,
            likeBool: data[0].likeBool
          }
          let recom_check;
          for (i = 0; i < comdata.length; i++) {
            if (Number(comdata[i].com_parent) === 0) {
              recom_check = true;
            } else {
              recom_check = false;
            }
            if (Number(comdata[i].user_id) === verify_data.user_id) {
              writer_check = true;
            } else {
              writer_check = false;
            }
            com[i] = {
              com_id: comdata[i].com_id,
              com_parent: comdata[i].com_parent,
              com_seq: comdata[i].com_seq,
              com_date: moment(comdata[i].com_date).format('MM/DD HH:mm'),
              com_txt: comdata[i].com_txt,
              recom_check: recom_check,
              writer_check: writer_check
            }
          }
          res.status(200).send({
            msg: "success",
            calliResult: pack,
            comResult: com
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
