//mysql
var mysql = require('mysql');
//express
var express = require('express');
//express session
var session = require('express-session');
//parser
var bodyParser = require('body-parser');
//path
var path = require('path');
//bcrypt
var bcrypt = require('bcrypt');


//start nodejs
var app = express();
var serv = require('http').Server(app);
serv.listen(2000);

//create salt for password hashing
var salt = bcrypt.genSaltSync(10);

//make connection with database
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'password',
  database : 'WebProgramming',
  insecureAuth : true

});


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));


//set up request parser 
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

//get login screen 
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/client/login.html'));
});

//get screen if user exist 
app.get('/alreadyuser', function(request, response) {
	response.sendFile(path.join(__dirname + '/client/alreadyuser.html'));
});

//load game screen
app.get('/loadgame', function(request, response) {
  response.sendFile(path.join(__dirname + '/client/index.html'));
});
//wrong details screen 
app.get('/relogin', function(request, response) {
	response.sendFile(path.join(__dirname + '/client/loginfailed.html'));
});
//use client folder 
app.use('/client',express.static(__dirname + '/client'));
console.log("server started");


//dealing with login request
app.post('/auth', function(request, response){
  //print to console used for debugging
    console.log(request.body.username);
    console.log(request.body.password);
//parse username and password from form post request
  var username = request.body.username;
  var password = request.body.password
  //hash password
  bcrypt.hash(request.body.password, salt, function(err, hash) {
    if(hash){

      //query database to see if account exists
      connection.query('SELECT password FROM Accounts WHERE username = ?', [username], function(err, results, fields) {
      //catch error
      if (err){
        console.log("Errore login: " + err);
      } 
      
      if(results.length > 0){
      //see results for debugging
      console.log(results);
      console.log(results[0].password);
      console.log(request.body.password);
      //comparing two passwords
      bcrypt.compare(password,results[0].password, function(err, res) {
        if(res){
          //if correct password launch game
          request.session.loggedin = true;
          request.session.username = username;
          response.redirect('/loadgame');
        }
        else{
          //failed login redirect to relogin screen
          response.redirect('/relogin');
        }
        response.end();
      });
    }else{
      //failed login redirect to relogin screen
      response.redirect('/relogin');
      response.end();
    }
  });
  //failed login redirect to relogin screen
    } else{
      response.redirect('/relogin');
      response.end();
    }

  });
});
      

//deals with the register post request 

app.post('/register', function(request, response) {
//used for debugging to console
  console.log(request.body.username);
  console.log(request.body.psw);
  console.log(request.body.email);
//assign the request from the form username and email to a variable
  var username = request.body.username;
  var email = request.body.email;
  //generate the hashed password from the password from the request
  bcrypt.hash(request.body.psw, salt,function(err, hash) {
    //check we have a username and email
    if (username && email) {
      //assign the hashed password to a variable 
      var password = hash;
      //create a vaules array for sql query
      var values = [username, password, email];
      //create a varaible with the sql for the  insert query for accounts table
      var sql = 'INSERT INTO Accounts (username, password, email) VALUES (?, ?, ?)';
      //sql query
      connection.query(sql, values, function(err, results, fields){
        //log to console for debugging
        console.log(results);
        //if something went wrong and query return nothing then
        if (err || results === undefined ){
          //debug to console
          console.log("Oops... Something went wrong with the query")
          //set logged in to true 
          request.session.loggedin = true;
          //redirect 
          response.redirect('/home')
          //end connection
          response.end();
        }
        else {
        //debug to console 
        console.log('the solution:', results);
        //set logged in to false 
        request.session.loggedin = false;
        //redirect 
        response.redirect('/home')
        //end connection
        response.end();
        }
      });
    
    }
  });
  
});


  
//used for the redirect for register 

app.get('/home', function(request, response) {
  //if logged in alreay then
	if (request.session.loggedin) {
    //send to already a user page 
		response.redirect('/alreadyuser');
	} else {
    //else return to login screen
		response.redirect('back');
  }
  //end connection
	response.end();
});

//sm342 game 
var SOCKET_LIST = {};

var Entity = function(){
    var self = {
        x:250,
        y:250,
        spdX:0,
        spdY:0,
        id:"",
    };
    self.update = function(){
        self.updatePosition();
    };
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    };
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    };
    return self;
};

var Player = function(id){
    var self = Entity();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpd = 10;
    self.hp = 10;
    self.hpMax = 10;
    self.score = 0;

    var super_update = self.update;
    self.update = function(){
      self.updateSpd();
      super_update();

      if(self.pressingAttack){
          self.shootBullet(self.mouseAngle);
      }
    };
    self.shootBullet = function(angle){
      var b = Bullet(self.id,angle);
      b.x = self.x;
      b.y = self.y;
    };

    self.updateSpd = function(){
        if(self.pressingRight)
            self.spdX = self.maxSpd;
        else if(self.pressingLeft)
            self.spdX = -self.maxSpd;
        else
            self.spdX = 0;

        if(self.pressingUp)
            self.spdY = -self.maxSpd;
        else if(self.pressingDown)
            self.spdY = self.maxSpd;
        else
            self.spdY = 0;
    };

    self.getInitPack = function(){
    return {
        id:self.id,
        x:self.x,
        y:self.y,
        number:self.number,
        hp:self.hp,
        hpMax:self.hpMax,
        score:self.score,
      };
    };
    self.getUpdatePack = function(){
      return {
        id:self.id,
        x:self.x,
        y:self.y,
        hp:self.hp,
        score:self.score,
      };
    };

    Player.list[id] = self;

    initPack.player.push(self.getInitPack());
    return self;
};


Player.list = {};
Player.onConnect = function(socket){
    var player = Player(socket.id);
    socket.on('keyPress',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
        else if(data.inputId === 'attack')
            player.pressingAttack = data.state;
        else if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });

    socket.emit('init',{
      selfId:socket.id,
      player:Player.getAllInitPack(),
      bullet:Bullet.getAllInitPack(),
   });
};

Player.getAllInitPack = function(){
  var players = [];
  for(var i in Player.list){
    players.push(Player.list[i].getInitPack());
  };
  return players;
};

Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
};
Player.update = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());
    }
    return pack;
};


var Bullet = function(parent,angle){
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;
    self.parent = parent;
    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();

        for(var i in Player.list){
           var p = Player.list[i];
           if(self.getDistance(p) < 32 && self.parent !== p.id){
             p.hp -= 1;

             if(p.hp <= 0){
               var shooter = Player.list[self.parent];
               if(shooter)
                  shooter.score += 1;
                p.hp = p.hpMax;
                p.x = Math.random() * 500;
                p.y = Math.random() * 500;
              }
               self.toRemove = true;
             }
        }
      };
      self.getInitPack = function(){
        return {
          id:self.id,
          x:self.x,
          y:self.y,
        };
      };
      self.getUpdatePack = function(){
        return {
          id:self.id,
          x:self.x,
          y:self.y,
        };
      };

      Bullet.list[self.id] = self;
      initPack.bullet.push(self.getInitPack());
      return self;
};

Bullet.list = {};

Bullet.update = function(){
    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        bullet.update();
        if(bullet.toRemove){
          delete Bullet.list[i];
          removePack.bullet.push(bullet.id);
        } else
          pack.push(bullet.getUpdatePack());
    }
    return pack;
};

Bullet.getAllInitPack = function(){
  var bullets = [];
  for(var i in Bullet.list)
    bullets.push(Bullet.list[i].getInitPack());
  return bullets;
};

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    Player.onConnect(socket);

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });
});
var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};

setInterval(function(){
    var pack = {
        player:Player.update(),
        bullet:Bullet.update(),
    };

    for(var i in SOCKET_LIST)
    {
      var socket = SOCKET_LIST[i];
      socket.emit('init',initPack);
      socket.emit('update',pack);
      socket.emit('remove',removePack);
    }
    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];

},1000/25);


app.listen(3000);




