
var express = require('express');
var app = express();
var serv = require('http').Server(app);


app.get('/',function(reg, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('client',express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server Started")

var SOCKET_LIST = {};

var Entity = function(){
  var self = {
    x:250,
    y:250,
    speedX:0,
    speedY:0,
    id:"",
  }
  self.update = function(){
    self.updatePosition();
  }
  self.updatePosition = function(){
    self.x += self.speedX;
    self.y += self.speedY;
  }
  return self;
}

var Player = function(id){
    var self = Entity();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingRight = false;
    self.pressingLeft = false;
    self.maxSpeed =10;

    var super_update = self.update;
    self.update = function(){
      self.updateSpeed();
      super_update();
    }

    self.updateSpeed = function(){
      if(self.pressingRight)
        self.speedX = self.maxSpeed;
      else if (self.pressingLeft)
        self.speedX = -self.maxSpeed;
      else
        self.speedX = 0;

      if(self.pressingUp)
        self.speedY = -self.maxSpeed;
      else if(self.pressingDown)
        self.speedY-= self.maxSpeed;
      else
        self.speedY = 0;
      }
    Player_list[socket.id] = self;
  return self;
}
Player_list = {};
Player.onConnect = function(socket){
  socket.on('keyPress',function(data){
    var player = Player(socket.id);
    if(data.inputID === 'up')
      player.pressingUp = data.state;
    else if(data.inputID === 'down')
      player.pressingDown = data.state;
    else if(data.inputID === 'right')
      player.pressingRight = data.state;
    else if(data.inputID === 'left')
      player.pressingLeft = data.state;
  });
}
Player.onDisconnect = function(socket){
  delete Player_list[socket.id];
}
Player.update = function(){
  var pack = [];
  for(var i in Player_list){
    var player = Player_list[i];
    player.update();
    pack.push({
      x:player.x,
      y:player.y,
      number:player.number
    });
  }
  return pack;
}


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

setInterval(function(){
  var pack = Player.update();
  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
      socket.emit('newPositions',pack);
  }
},1000/25);
