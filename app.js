const express = require('express');
const app = express();
const http = require('http').Server(app); 
const io = require('socket.io')(http);
const fs = require('fs');
const session = require('express-session');
const mysql = require('mysql');
const qs = require('querystring');
const bodyparser = require('body-parser');

app.use(express.static(__dirname + '/lib'));

app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())

const dbcon = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'chat',
  multipleStatements: true
});
dbcon.connect();

app.use(session({
  secret:'keyboard',
  resave:false,
  saveUninitialized:true
}));

var postUsername = '';

app.get('/',function(req, res){  
   fs.readFile('./lib/index.html',(err,data)=>{
          if(err){
             throw err;
          }
         res.writeHead(200);
         res.end(data);  
      });   
});

app.post('/login_process',function(req, res){
   postUsername = req.body.user.name; // post값 전역변수에 넣기 위해
   const postPwd = req.body.user.pwd; 
   const sess = req.session;
   sess.username = postUsername;
    
    dbcon.query('select name,pwd from users where name=?',[postUsername], function(err,result){
            if(err){
                throw err;
            }
            //console.log(result[0].name);
           if(result == ""){
              return res.send(`<script>alert('존재하지 않는 아이디입니다.')</script><script>
                     location.replace('/');
                    </script>`); 
           }else if(result[0].pwd !==  postPwd){
               return res.send(`<script>alert('비밀번호가 틀렸습니다')</script><script>
                     location.replace('/');
                    </script>`); 
               
           }else{
               res.writeHead(302, {Location: `/chat`});
               res.end(); 
           }

    });
       
});


app.get('/join',function(req, res){  
   fs.readFile('./lib/join.html',(err,data)=>{
          if(err){
             throw err;
          }
         res.writeHead(200);
         res.end(data);  
      });   
});

app.post('/create_process',function(req, res){  
   const postUsername = req.body.user.name;
   const postPwd = req.body.user.pwd; 
   const sess = req.session;
   sess.username = postUsername;
    dbcon.query('select name from users', function(err,result){
            if(err){
                throw err;
            }
            //console.log(result[0].name);
           for(var i = 0; i < result.length; i++){
               if(result[i].name === postUsername){
                   return res.send(`<script>alert('동일한 아이디가 이미 있습니다.')</script><script>
                     location.replace('/join');
                    </script>`);
                   
               }
           };
       
    var queryInsert = "insert into users (name, pwd) values (?,?)";
    
        dbcon.query(queryInsert,[postUsername, postPwd], function(err,result2){
            if(err){
                throw err;
            }
             return res.send(`<script>alert('정상적으로 등록을 완료했습니다')</script><script>
                     location.replace('/');
                    </script>`);
             //res.writeHead(302, {Location: `/`});
             //res.end();  
           }
        );

    });
    
});


app.get('/chat',function(req, res){
   const sess = req.session;
   
   // console.log(sess.username);
   fs.readFile('./lib/chat.html',(err,data)=>{
          if(err){
             throw err;
          }
          
         res.writeHead(200);
         res.write(`<p id="chat_username"><span id="chat_username_color">${sess.username}</span><span id="chat_main_color">님 환영합니다</span></p>`);
         res.end(data);  
      }); 

});

io.on('connection', function(socket){
    //console.log(socket);
    console.log('user connected: ', socket.id);
    var name = postUsername;                  
    io.to(socket.id).emit('change name', name);   
    
    socket.on('disconnect', function(){ 
     console.log('user disconnected: ', socket.id);
    });
    
    /*socket.on('enter the user',function(name){
       io.emit('receive message', name);
    });*/
    
    socket.on('send message', function(name,text){ 
      var msg = name + ' : ' + text;
      console.log(msg);
      io.emit('receive message', msg);
    });
}); 

//참고 사이트 https://www.a-mean-blog.com/ko/blog/%EB%8B%A8%ED%8E%B8%EA%B0%95%EC%A2%8C/_/Node-JS-Socket-io-%EC%B1%84%ED%8C%85%EC%82%AC%EC%9D%B4%ED%8A%B8-%EB%A7%8C%EB%93%A4%EA%B8%B0

http.listen(process.env.PORT, function(){
  console.log('서버실행중....');
});
