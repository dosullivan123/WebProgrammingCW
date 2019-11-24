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
          request.session.loggedin = true;
          request.session.username = username;
          response.redirect('/loadgame');
        }
        else{
          response.redirect('/relogin');
        }
        response.end();
      });
    }else{
      response.redirect('/relogin');
      response.end();
    }
  });
    } else{
      response.redirect('/relogin');
      response.end();
    }

  });
});
      


app.get('/',function(req, res) {

    res.sendFile(__dirname + '/client/main.css');
});


app.post('/register', function(request, response) {

  console.log(request.body.username);
  console.log(request.body.psw);
  console.log(request.body.email);

  var username = request.body.username;
  var email = request.body.email;
  bcrypt.hash(request.body.psw, salt,function(err, hash) {
    if (username && email) {
      var password = hash;
      var values = [username, password, email];
      var sql = 'INSERT INTO Accounts (username, password, email) VALUES (?, ?, ?)';
      connection.query(sql, values, function(err, results, fields){
        console.log(results);
        if (err || results === undefined ){
          console.log("Oops... Something went wrong with the query")
          request.session.loggedin = true;
          response.redirect('/home')
          response.end();
        }
        else {
        console.log('the solution:', results);
        request.session.loggedin = false;
        response.redirect('/home')
        response.end();
        }
      });
    
    }
  });
  
});


  


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.redirect('/alreadyuser');
	} else {
		response.redirect('back');
	}
	response.end();
});

app.listen(3000);




