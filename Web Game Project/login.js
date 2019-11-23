var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();
var serv = require('http').Server(app);

serv.listen(2000);
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'nodelogin'
});



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
	response.sendFile(path.join(__dirname + '/client/index.html'));
});

app.get('/relogin', function(request, response) {
	response.sendFile(path.join(__dirname + '/client/loginfailed.html'));
});

app.use('/client',express.static(__dirname + '/client'));
console.log("server started");



app.post('/auth', function(request, response){
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
});

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



