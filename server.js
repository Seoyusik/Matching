var express = require('express');
//var morgan = require('morgan')
//rebase test
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

//app.use(morgan('dev'));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client.html');
});

var matching = []; //매칭대기중인 소캣정보 저장
var count = 0;//user count
var matchingCount=0;//matching Count

io.on('connection', function(socket) {

//  console.log('user connected: ', socket.id);
  var name = "user" + count++;
  io.to(socket.id).emit('change name', count);

  socket.on('disconnect', function() {
    console.log('user disconnected: ', socket.id);
  });

  socket.on('auth', function(email, rank) {
//    console.log('user connected: ', socket.id, 'email: ', email, 'rank: ', rank);
    //authorization part
    var msg = email + ' : ' + rank;
    socket.emit('auth result', 'login success');
  });

  socket.on('join', function(email, rank) {
    console.log('user connected: ', socket.id, 'email: ', email, 'rank: ', rank);
    var msg = email + ' : ' + rank;

    var temp = null;
    temp = {
      "_id": socket.id,
      "email": email,
      "rank": rank
    }
   matching.push(temp);//순서대로 푸쉬
    // console.log(matching);
    // console.log("rank[0] : ", matching[0]['rank']);
   console.log("length : ", matching.length);
    if(matching.length<100){ //100명의 동시접근자가 있을것이라 가정 -> 항상 100명씩처리
      io.to(socket.id).emit('join waiting', 'join waiting.......');
      return;
    }

    // matching.sort(function(a, b) { // 오름차순
    //   return a['rank'] - b['rank'];
    //
    // });
    // console.log('sort : ',matching);

    console.log(matching);
    while(matching.length!=0){//남은 소캣이 없을때까지 반복
        var baseRank=matching[0]['rank']; //맨앞에 있는것부터 순서대로 처리
        var matchingIndex; //매칭 할 소켓정보가 저장할 변수
        var min=999;
        for(var i=1;i<matching.length;i++){//항상0번이 기준이기때문에 1번부터 남은 갯수만큼 비교
          var value=Math.abs(baseRank-matching[i]['rank']);////기준 rank-비교 rank 의 절댓값으로 매칭상대를 찾음
          if(value==0){
            matchingIndex=i;
            break;//0이면 최적 매칭이기때문에 다음 검사 없이 탈출
          }//if
          else if(value<min){
            min=value;
            matchingIndex=i;
          }//else if
        }//for(var i=1;i<matching.length;i++)
        console.log("**MATCHING**",matchingCount++);
        console.log("id : ", matching[0]['_id']," + ",matching[matchingIndex]['_id'],"기준 rank : ",matching[0]['rank'], "매칭 rank : ",matching[matchingIndex]['rank']);
        var msg="id : "+matching[0]['_id']+" + "+matching[matchingIndex]['_id']+" 1p_rank : "+matching[0]['rank']+" 2p_rank : "+matching[matchingIndex]['rank'];

         io.to(matching[0]['_id']).emit('join success',msg);
         io.to(matching[matchingIndex]['_id']).emit('join success',msg);

        matching.splice(matchingIndex, 1);// 비교 소켓 먼저 자르고
        matching.splice(0, 1);//기준 소켓 자름

        // console.log(matching);
    }//while(matching.length!=0)
  });//socket.on("join")
});//io.on('connection', function(socket)
http.listen(7777, function() {
  console.log('server on!');
});
