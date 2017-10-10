var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var path = require('path');

var names = [0]

var bodyParser = require('body-parser');
app.use(express.static(__dirname));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));


app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

app.post('/register',function(req, res){
	var name = req.body.uName
	names.push(name)
	
	res.send(('SUCCESS!'));

})

//app.post('/', function (req, res) {
//	  res.sendFile(path.join__dirname + '/public/chat.html');
//	});