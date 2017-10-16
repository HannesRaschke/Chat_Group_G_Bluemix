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
	
	//on chatmessage, send to all clients
	socket.on('chat message', function(msg){
		msg.timestamp = timestamp();
		io.emit('chat message', msg);
	});

	//if a command is send, check what kind of command
	socket.on('command', function(msg){
		msgElements=msg.content.split(" ");
		var flag=msgElements[0];
		if(flag==="\\pm"){
			var receiver=users[msgElements[1]];
			if(receiver===undefined){
				io.to(users[msg.id]).emit('private message',{});
			}else{
				for(var id in users){
					if(receiver===users[id]){
						//saving receivers name
						var receiverName = id;
						//getting message 
						var message = msg.content.substring(msgElements[0].length+msgElements[1].length+2);
				//sending to receiver
				io.to(users[id]).emit('private message', {from:socket.nickname  , to:receiverName, message:message, timestamp:timestamp()})
				//sending to sender
				socket.emit('private message', {from:socket.nickname  , to:receiverName, message:message, timestamp:timestamp()})
					}
				}
		}
	}
		else if(flag==="\\list"){
			var message;
			message= Object.keys(users);
		}else{
			console.log("wrong command from: "+users[msg.id]);
			message="this command does not exist. Try \\list";
		}
	});
	
	//on client enter save nickname and send join message to clients
	socket.on('clientEnterEvent', function(nick) {
		if (/^\w+$/.test(nick)) {
		//if nick does not exist yet
			if(!(nick in users)){
	    // connects the user to their socket id (acts as a cookie)
		users[nick]=socket.id;
	    socket.emit('enter', nick);
	    //Save nickname on socket
	    socket.nickname=nick;
	    io.emit('system message', {action:" joined", timestamp:timestamp(), user:socket.nickname});
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
		io.emit('system message', {action:" left", timestamp:timestamp(), user:socket.nickname});
		delete users[socket.nickname];
	});
	
});
// ////////////////////////////////////////////////////////////////////

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function timestamp(){
	var currentdate = new Date(); 
  	var time = "[" + (currentdate.getHours()<10?'0':'') + currentdate.getHours()+ ":"  
      		+ (currentdate.getMinutes()<10?'0':'') + currentdate.getMinutes() + ":" +
      		(currentdate.getSeconds()<10?'0':'') + currentdate.getSeconds()  + "] ";
  	return time;
//  	msg.timestamp = timestamp();
  	
}