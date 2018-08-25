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
      console.log(req.body.tag);
      var keyS = "";
      for (var i = 0; i < req.body.tag.length; i++) {
        keyS = keyS + "+" + req.body.tag[i] + "* ";
      }

      var queryS = 'select cal.*, us.user_nickname, us.user_img, if(isnull(com.commentCount),0,com.commentCount) as commentCount, ' +
        'if(isnull(li.likeCount),0,li.likeCount) as likeCount from calli.calli as cal ' +
        'left outer join users as us on cal.user_id = us.user_id ' +
        'left outer join (select count(*) as commentCount, calli_id from calli.comment group by calli_id) as com on cal.calli_id = com.calli_id ' +
        'left outer join (select count(*) as likeCount, calli_id from calli.calliLike group by calli_id) as li on cal.calli_id = li.calli_id ' +
        'where match(calli_tag) against(? in boolean mode) ';

      //1은 최근 순서대로 정렬, 2는 좋아요 많은 순으로 정렬, 3은 댓글 많은 순으로 정렬
      if (req.body.order === 1) {
        queryS = queryS + 'order by cal.calli_date desc';
      } else if (req.body.order === 2) {
        queryS = queryS + 'order by likeCount desc';
      } else if (req.body.order === 3) {
        queryS = queryS + 'order by commentCount desc';
      }

      connection.query(queryS, keyS, (err, data) => {
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
              calli_img: data[i].calli_img,
              calli_txt: data[i].calli_txt,
              calli_id: data[i].calli_id
            };
          }
          res.status(200).send({
            msg: "success",
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
