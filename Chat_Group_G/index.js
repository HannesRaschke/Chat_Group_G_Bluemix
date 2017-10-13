var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var path = require('path');

var names = [];

var bodyParser = require('body-parser');
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

////////////////////////////////////////////////////////////////
io.on('connection', function(socket){
	
	console.log('user connected');
	
	//on connect send user connected message
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	});
	
	socket.on('clientEnterEvent', function(data) {
	    console.log(data);
	    socket.emit('enter', data);
	    console.log('user connected to chat');
	});

	//on disconnect send user disconnected message
	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
	
});
//////////////////////////////////////////////////////////////////////

http.listen(port, function(){
  console.log('listening on *:' + port);
});
