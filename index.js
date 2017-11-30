/////////////////////
//Dennis Funk 752728
//Hannes Raschke 751219
//Group G
//

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
var path = require('path');
var fs = require('fs');
var request = require('request');
var Cloudant = require('cloudant');
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var helmet = require('helmet');


////////////////////
//cloudant

if(fs.existsSync('./vcap-local.json')){
	var vcapLocal = require('./vcap-local.json');
	var vcapLocalJSON = JSON.stringify(vcapLocal);
	console.log(vcapLocalJSON);
}else if (process.env.VCAP_SERVICES) {
	console.warn("CUSTOM INPUT: in vcap services");
    var envVCAP= process.env.VCAP_SERVICES;
    console.warn(envVCAP);
}else{
	console.error("No database credentials found");
}

var creds = vcapLocalJSON || envVCAP;
var cloudant = Cloudant({vcapServices: JSON.parse(creds)});

var db = cloudant.db.use('users');
//////////////////////
//Visual recognition
var vcap_services = JSON.parse(process.env.VCAP_SERVICES)
var api_key = vcap_services.watson_vision_combined[0].credentials.api_key
var url = vcap_services.watson_vision_combined[0].credentials.url
console.log("VR: "+api_key+", "+url)
var visual_recognition = new VisualRecognitionV3({
    'api_key': api_key,
    'version_date': '2016-05-20',
    'url' : url,
    'use_unauthenticated': false
  });

//////////////////////


var users = {};

// app.use(express.static(__dirname+"/public/Temp/*"))
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended : true
}));
//if connection is not using https, redirect 
app.get('/', function(req, res) {
	if(req.get('x-forwarded-proto')==='https'){
		res.sendFile(__dirname + '/public/index.html');
	}else{
		res.redirect('https://' + req.headers.host + req.url);
	}
	
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'code.jquery.com'],
      styleSrc: ["'self'", 'cdn.socket.io']
    }
  }));

// //////////////////////////////////////////////////////////////
io.on('connection', function(socket) {
	
	// on register client check password and name
	socket.on('registerClient', function(nick, pw1, pw2, pic){
		
		
		if (!(/^\w+$/.test(nick))){ //if the Nickname contains invalid characters
			var errmsg = "Nick can only consist of numbers and letters";
			socket.emit('RegError', errmsg);
			return
		}
		else if(pw1!==pw2){//if the repeated password does not match the original one
			var errmsg = "Passwords do not match";
			socket.emit('RegError', errmsg);
			return
//		}else if(pic===undefined||){//does the picture not contain a face?
//			var errmsg = "Please select a picture with a face on it";
//			socket.emit('RegError', errmsg);
//			return
		}else{
			
			db.get(nick, function(err, data) {
				if(data){
					var errmsg = "Username is already taken";
					socket.emit('RegError', errmsg);	
					return
				}else{
				    visual_recognition.detectFaces({'image_file': pic}, function(err, res) {
				        if (err){
					        var errmsg = "there seems to be a problem with IBM Face Recognition, please try again later";
					        socket.emit('RegError', errmsg);
				        }else if(res.images[0].faces.length<=0){  
				        	var errmsg = "Image must contain a face";
					        socket.emit('RegError', errmsg);
				        }else{
				        	console.log("VR says: "+JSON.stringify(res))
							var pass = new Buffer(pw1).toString('base64');
							db.insert({password: pass, profilePicture: pic}, nick  , function(err,body,header){
								if(err){
									return console.log("[db.insert]",err.message);
								}else{
									enterChat(nick, socket);
								}
							});
				        }
				      });


				}
			});
		}
		
	});
	
	// on login check if password is ok
	socket.on('login', function(nick, pw){
		
		 db.get(nick, function(err, data) {
			 var pass = new Buffer(data.password,'base64').toString('ascii');
			 if(pass===pw){
				 enterChat(nick, socket);
			 }else{
				var errmsg = "Invalid Password or Username";
				socket.emit('RegError', errmsg);
			 }
		 });

		
	});
	
	
	// on chatmessage, send to all clients
	socket.on('chat message', function(msg) {
		// callback function to wait for mood response
		var moods = getMood(msg.content, function(mood){
			msg.timestamp = timestamp();
			msg.userMood = mood;
			io.emit('chat message', msg);
		});
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
	socket.on('clientEnterEvent', function(nick, pw) {
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

// /////////////////////////////////////////////////////////////////////

function enterChat(nick, socket) {
			
			// connects the user to their socket id
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
}

// /////////////////////////////////////////////////////////////////////
// let tone analyzer get the senders mood
function getMood(msg, callback){
	request.post({
	url: 'https://thirsty-volhard-specificative-undercrier.eu-de.mybluemix.net/tone',
	headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
         'mode': 'cors'
     },
	body: JSON.stringify({
		 texts: [msg],
	   })
	}, function(error,response,body){
		var mood = JSON.parse(body);
	callback(mood.mood);
	})
}

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