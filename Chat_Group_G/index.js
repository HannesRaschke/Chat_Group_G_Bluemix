/////////////////////
//Dennis Funk 752728
//Hannes Raschke 751219
//Group G
//


var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var path = require('path');
var fs = require('fs')

var users = {};

// app.use(express.static(__dirname+"/public/Temp/*"))
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended : true
}));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

// //////////////////////////////////////////////////////////////
io.on('connection', function(socket) {

	// on chatmessage, send to all clients
	socket.on('chat message', function(msg) {
		msg.timestamp = timestamp();
		io.emit('chat message', msg);
	});

	// if a command is send, check what kind of command
	socket.on('command', function(msg) {
		msgElements = msg.content.split(" ");
		var flag = msgElements[0];
		if (flag === "\\pm") {
			var receiver = users[msgElements[1]];
			if (receiver === undefined) {
				io.to(users[msg.id]).emit('command', {timestamp:timestamp(),content:"please enter a reciever"});
			} else {
				for ( var id in users) {
					if (receiver === users[id]) {
						// saving receivers name
						var receiverName = id;
						// getting message
						var message = msg.content
								.substring(msgElements[0].length
										+ msgElements[1].length + 2);
						// sending to receiver
						io.to(users[id]).emit('private message', {
							from : socket.nickname,
							to : receiverName,
							message : message,
							timestamp : timestamp()
						})
						// sending to sender
						socket.emit('private message', {
							from : socket.nickname,
							to : receiverName,
							message : message,
							timestamp : timestamp()
						})
					}
				}
			}
		} else if (flag === "\\list") {
			var userList = "Following users are online: ";
			userList += Object.keys(users);
			socket.emit('command', {
				timestamp : timestamp(),
				content : userList
			})
		} else {
			message = "This command does not exist. Try \\list , \\pm";
			socket.emit('command', {
				timestamp : timestamp(),
				content : message
			})

		}
	});

	// on client enter save nickname and send join message to clients
	socket.on('clientEnterEvent', function(nick) {
		if (/^\w+$/.test(nick)) {
			// if nick does not exist yet
			if (!(nick in users)) {
				// connects the user to their socket id (acts as a cookie)
				users[nick] = socket.id;
				socket.emit('enter', nick);
				// Save nickname on socket
				socket.nickname = nick;
				io.emit('system message', {
					action : " joined",
					timestamp : timestamp(),
					user : socket.nickname
				});
				var OnlineUser = Object.keys(users);
				io.emit('OnlineUserWidget', {
					content : OnlineUser
				});
			} else {
				var taken = true;
				socket.emit('nickTaken', taken);
			}
		} else {
			var failure = true;
			socket.emit('invalidNick', failure);
		}
	});

	// on disconnect delete user data and send "user disconnected" message
	socket.on('disconnect', function() {
		io.emit('system message', {
			action : " left",
			timestamp : timestamp(),
			user : socket.nickname
		});
		delete users[socket.nickname];
		var OnlineUser = Object.keys(users);
		io.emit('OnlineUserWidget', {
			content : OnlineUser
		});
	});

	// gets a file object and uses an fs stream to write it to a file. Then
	// sends the file as a file message to all users
	socket.on('upload', function(file) {

		var stream = fs.createWriteStream("public/Temp/" + file.fileName)
		stream.once('open', function() {
			stream.write(file.file);
			stream.end();
		})
		var time = timestamp()
		if (file.isPrivate) {

			msgElements = file.content.split(" ");
			var flag = msgElements[0];
			if (flag === "\\pm") {
				var receiver = users[msgElements[1]];
				if (receiver === undefined) {
					io.to(users[file.id]).emit('private message', {});
				} else {
					for ( var id in users) {
						if (receiver === users[id]) {
							io.to(users[id]).emit('file message', {
								timestamp : time,
								fileName : file.fileName,
								id : file.id,
								content : file.content
							});
							socket.emit('file message', {
								timestamp : time,
								fileName : file.fileName,
								id : file.id,
								content : file.content
							});
						}
					}
				}

			}
		} else {
			io.emit('file message', {
				timestamp : time,
				fileName : file.fileName,
				id : file.id,
				content : file.content
			});
		}

	});
});

// ////////////////////////////////////////////////////////////////////

http.listen(port, function() {
	console.log('listening on *:' + port);
});

function timestamp() {
	var currentdate = new Date();
	var time = "[" + (currentdate.getHours() < 10 ? '0' : '')
			+ currentdate.getHours() + ":"
			+ (currentdate.getMinutes() < 10 ? '0' : '')
			+ currentdate.getMinutes() + ":"
			+ (currentdate.getSeconds() < 10 ? '0' : '')
			+ currentdate.getSeconds() + "] ";
	return time;
	// msg.timestamp = timestamp();
}