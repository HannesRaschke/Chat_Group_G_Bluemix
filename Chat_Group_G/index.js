var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var path = require('path');

var users={};

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

// //////////////////////////////////////////////////////////////
io.on('connection', function(socket){
	
	console.log('user connected');
	console.log("id: "+socket.id)
	
	// on connect send user connected message
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	});
	
	socket.on('private message', function(msg){
		msgElements=msg.content.split(" ")
		var reciever=users[msgElements[1]]
		
		if(reciever===undefined){
			socket.to(users[msg.id]).emit('chat message',{type:"system", message:"there is currently no user called "+reciever+" in the chatroom"})
		}else{
			var message = msg.content.substring(msgElements[0].length+msgElements[1].length+2);
			socket.to(reciever).emit('chat message',{type:"private", from:msg.id,message:message});	
		}
		
	});

	
	socket.on('command', function(msg){
		var message;
		if(msg.content==="\\list"){
			message= Object.keys(users);
		}else{
			console.log("wrong command from: "+users[msg.id])
			message="this command does not exist. Try \\list"
		}
		socket.to(users[msg.id]).emit('chat message',{type:"system", message:message});	
	});

	
	socket.on('clientEnterEvent', function(nick) {
		if (/^\w+$/.test(nick)) {
		//if nick does not exist yet
			if(!(nick in users)){
	    // connects the user to their socket id (acts as a cookie)
		users[nick]=socket.id;
		console.log(nick);
		console.log(users);
	    socket.emit('enter', nick);
	    console.log('user connected to chat');
		}else{
                var taken = true;
                socket.emit('nickTaken', taken);
                }
        }else{
            var failure = true;
            socket.emit('invalidNick', failure);
        }
	});

	// on disconnect delete user data and send "user disconnected" message
	socket.on('disconnect', function(){
		delete users[socket.id]
		console.log('user disconnected');
	});
	
});
// ////////////////////////////////////////////////////////////////////

http.listen(port, function(){
  console.log('listening on *:' + port);
});
