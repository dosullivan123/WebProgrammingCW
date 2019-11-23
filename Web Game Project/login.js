var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var flash = require('connect-flash')
var app = express();
var serv = require('http').Server(app);

serv.listen(2000);
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'nodelogin'
});

var app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/client/login.html'));
});

app.get('/loadgame', function(request, response) {
	response.sendFile(path.join(__dirname + '/client/login.html'));
});

app.get('/relogin', function(request, response) {
	response.sendFile(path.join(__dirname + '/client/loginfailed.html'));
});

app.use('/client',express.static(__dirname + '/client'));
console.log("server started");
app.use(flash())


app.post('/auth', function(request, response) {
    console.log(request.body.username);
    console.log(request.body.password);

	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            console.log(results)
			if (results !== undefined && results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
                
                response.redirect('/relogin');
                
               ;
				
			}			
			response.end();
		});
	} else {
		response.send('/relogin');
		response.end();
	}

app.get('/',function(req, res) {

    res.sendFile(__dirname + '/client/main.css')
});


app.post('/register', function(request, response) {
    console.log(request.body.username);
    console.log(request.body.password);

	var username = request.body.username;
    var password = request.body.password;
    var email = reuest.body.email;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            console.log(results)
			if (results !== undefined && results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
                
                response.redirect('/relogin');
                
               ;
				
			}			
			response.end();
		});
	} else {
		response.send('/relogin');
		response.end();
	}
});

app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('/loadgame');
	} else {
		response.send('/relogin');
	}
	response.end();
});

app.listen(3000);









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
}

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

},1000/25);

    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];

},1000/25);

