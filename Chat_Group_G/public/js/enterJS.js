$(function() {
	var socket = io();
	var nick; //the nickname of this user
	var fileSelected //the file that will be sent with the next message
	// ////////////////
	// username entered; button pressed
	$("#enterUsername").submit(function() {
		nick = document.getElementById("userNameInp").value;
		socket.emit("clientEnterEvent", nick);
		return false;
	});

	// ////////////////
	// listen on server, chat message received
	//adds a normal chat message to this users chat
	socket.on('chat message', function(msg) {

		$('#messages').append(
				$('<li>').text(msg.timestamp + msg.id + ": " + msg.content));
		$('#messages')[0].scrollTo(0, $('#messages')[0].scrollHeight);
	});
	//adds a message in form of a private message to this users chat
	socket.on('private message', function(msg) {
		$('#messages').append(
				$('<li id="privateMessage">').text(
						msg.timestamp + msg.from + " whispers to " + msg.to
								+ ": " + msg.message));
		$('#messages')[0].scrollTo(0, $('#messages')[0].scrollHeight);
	});
	//adds a system message to this users chat
	socket.on('system message', function(msg) {
		$('#messages').append(
				$('<li id="systemMessage">').text(
						msg.timestamp + "SYSTEM: " + msg.user + msg.action));
		$('#messages')[0].scrollTo(0, $('#messages')[0].scrollHeight);
	});
	//adds a message in form of a server response to a command to this users chat
	socket.on('command',
			function(msg) {
				$('#messages').append(
						$('<li id="systemMessage">').text(
								msg.timestamp + msg.content));
				$('#messages')[0].scrollTo(0, $('#messages')[0].scrollHeight);
			})

	// shows normal message and the uploaded file
	socket.on('file message', function(msg) {
		// $('#messages').append($('<li
		// id="fileMessage">').text(msg.timestamp+msg.id+": "+msg.content));
		$('#messages').append(
				$('<a id="file" href = "Temp/' + msg.fileName + '" download>'
						+ '<img id= "fileImg" title="'+ msg.fileName +'" src="Media/file.png" alt = "'
						+ msg.fileName + '">' + '</a>')); // onclick="downloadFile('+"'"+msg.fileName+"'"+')"
		// //
		$('#messages')[0].scrollTo(0, $('#messages')[0].scrollHeight);
	});

	// ////////////////
	// listen on server, entered chat
	socket.on('enter',function(nick) {

						var smilies = "";
						for (var i = 128512; i <= 128591; i++) {
							smilies += '<span class="smilies" id="&#' + i
									+ '">&#' + i + '</span>';
						}
						//here the log in screen gets replaced by the chat
						var chat = '<div id="chatWrapper"><div id="onlineUserWidget"></div><div id="chatMainFrame"><ul id="messages"></ul><form id="chat" action=""><input type="submit" id="inputSubmit"><div id="smilies">'
								+ smilies
								+ '</div><div id="dFileUpload"><input type="file" id="f" /><button id="bFileUpload">File attachment</button><div id="d"></div></div><input id="m" autocomplete="off" /><button id="bChat">Send</button><button id="bSmilies">&#128512</button></form></div></div>';
						$("body").empty();
						$("body").append(chat);

						document.getElementById('f').addEventListener('change',FileChosen);
						
						// ////////////////
						// send chat message; button pressed // eventhandler
						// only after "chat" is created
						$("#chat").submit(
								function() {
									//if there is nothing to be sent
									if ($('#m').val() === ""
											&& fileSelected === undefined) {
										alert("please send a message or file")
									} else { 	
										var isPrivate;
										// if the message is a command
										if ($('#m').val().charAt(0) === "\\") {
											socket.emit('command', {
												id : nick,
												content : $('#m').val()
											})
											isPrivate = true
											// normal message
										} else {
											socket.emit("chat message", {
												id : nick,
												content : $("#m").val(),
												timestamp : ""
											});
											isPrivate = false
										}
										// if a file is send with the message
										if (fileSelected != undefined) {
											socket.emit('upload', {
												file : fileSelected,
												fileName : fileSelected.name,
												id : nick,
												content : $("#m").val(),
												isPrivate : isPrivate
											})// type:fileSelected.type
											$('#d').html("");
											fileSelected = undefined;
										}
									}
									$("#m").val("");
									$('#smilies').hide();

									return false;
								});

						// ///////////////////////
						
						$('#bFileUpload').on("click", function() {
							$('#f').click();
							return false;
						});

						$('#bSmilies').on("click", function() {
							$('#smilies').toggle();
							return false;
						});

						$('.smilies').on("click", function() {
							var smilie = $(this).attr('id');
							var chatmessage = $('#m').val();
							$('#m').val(chatmessage + smilie);
						})
						//if a name on the widget is clicked, the syntax 
						//for a pm to that user will be added to this users message box.
						$('#onlineUserWidget')
								.on(
										"click",
										".onlineUser",
										function() {
											var user = $(this).attr('id');
											var chatmessage = $('#m').val();
											$('#m').val(
													"\\pm " + user + " "
															+ chatmessage);
										})
					});

	socket.on('nickTaken', function(data) {
		alert("Username already taken!");
	});

	socket.on('invalidNick', function(data) {
		alert("Enter a valid username\nOnly letters and numbers allowed");
	});

	// onclick function for the file upload
	function FileChosen(event) {
		if(event.target.files[0]===undefined || event.target.files[0].size>999999){
			alert("please choose a file smaller than 1MB")
		}else{
			fileSelected = event.target.files[0]
			$('#d').html("File Selected: " + fileSelected.name);
		}
	}

	//building the content for the online user widget
	socket.on('OnlineUserWidget', function(msg) {
		var OUWUsers = "Online Users:<br>";
		for (var i = 0; i < msg.content.length; i++) {
			OUWUsers += '<span class=onlineUser id=' + msg.content[i] + '>'
					+ msg.content[i] + '</span><br>';
		}

		$('#onlineUserWidget').empty();
		$('#onlineUserWidget').append(OUWUsers);
	})

});
