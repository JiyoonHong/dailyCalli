const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const crypto = require('crypto');
const verify = require('../jwt_verify');

//태그검색----------/calli/tagSearch
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
          callback("fail : " + err);
        } else callback(null, verify_data, connection);
      });
    },

    //2. 테그별 게시글 검색
    (verify_data, connection, callback) => {
      var key = req.body.word;
      var tagS = 'match(calli_title) against(? in boolean mode) ';
      var x = 0,
        y = 14;

      if (req.body.limit !== undefined) {
        x += parseInt(req.body.limit);
        y += parseInt(req.body.limit);
      }

      if (key[0] === '#') {
        key = key.substring(1);
        tagS = 'match(calli_tag) against(? in boolean mode) ';
      }

      var keyS = key.split(' ');
      key = '';

      for (var i = 0; i < keyS.length; i++) {
        key = key + "+" + keyS[i] + "* ";
      }

      var queryS = 'select cal.calli_id, cal.calli_img, cal.calli_title, us.user_id, us.user_nickname, us.user_img, ' +
        'if(isnull(li.likeCount),0,li.likeCount) as likeCount, if(isnull(com.commentCount),0,com.commentCount) as commentCount from calli.calli as cal ' +
        'left outer join (select count(*) as commentCount, calli_id from calli.comment group by calli_id) as com on cal.calli_id = com.calli_id ' +
        'left outer join (select count(*) as likeCount, calli_id from calli.calliLike group by calli_id) as li on cal.calli_id = li.calli_id ' +
        'left outer join users as us on cal.user_id = us.user_id ' +
        'where cal.calli_trace = 0 and ' + tagS;

      //1은 최근 순서대로 정렬, 2는 좋아요 많은 순으로 정렬, 3은 댓글 많은 순으로 정렬
      if (req.body.order === 1) {
        queryS = queryS + 'order by cal.calli_date desc limit ?, ?';
      } else if (req.body.order === 2) {
        queryS = queryS + 'order by likeCount desc limit ?, ?';
      } else if (req.body.order === 3) {
        queryS = queryS + 'order by commentCount desc limit ?, ?';
      }

      connection.query(queryS, [key, x, y], (err, data) => {
        if (err) {
          res.status(500).send({
            "msg": "fail"
          });
          connection.release();
          callback("err " + err);
        } else {
          var i, j = 0;
          var pack = [];
          for (i = 0; i < data.length; i++, j++) {
            pack[j] = {
              user_id: data[i].user_id,
              user_nickname: data[i].user_nickname,
              user_img: data[i].user_img,
              calli_title: data[i].calli_title,
              calli_img: data[i].calli_img,
              calli_id: data[i].calli_id
            };
          }
          res.status(200).send({
            msg: "success",
            limit: y,
            calliList: pack
          });
          connection.release();
          callback(null, "search success");
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
