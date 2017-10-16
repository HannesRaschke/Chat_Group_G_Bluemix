      $(function () {
    	  var socket = io();
    	  var nick;
    	  ////////////////// 
    	  //username entered; button pressed
    	  $("#enterUsername").submit(function(){
    	        nick = document.getElementById("userNameInp").value; 
    	        socket.emit("clientEnterEvent", nick);
    	        return false;
    	    });
    	    
    	    
    	    //////////////////
        	//listen on server, chat message received
    	    socket.on('chat message', function(msg){
    	    	console.log("message123")
    	    	console.log(msg);
                	
                	$('#messages').append($('<li>').text(msg.timestamp+msg.id+": "+msg.content));
                window.scrollTo(0, document.body.scrollHeight);
            });
    	    
    	    socket.on('private message', function(msg){
    	    	console.log("pm123")
    	    	console.log(msg);
    	    	$('#messages').append($('<li id="privateMessage">').text(msg.timestamp+msg.from+" whispers to " + msg.to+ ": " +msg.message));
    	    	window.scrollTo(0, document.body.scrollHeight);
    	    });
    	    
    	    socket.on('system message', function(msg){
    	    	console.log("sys");
               	$('#messages').append($('<li id="systemMessage">').text(msg.timestamp + "SYSTEM: " +msg.user + msg.action));
    	    	window.scrollTo(0, document.body.scrollHeight);
    	    });
    	    
    	    socket.on('command',function(msg){
    	    	$('#messages').append($('<li id="systemMessage">').text(msg.timestamp  +msg.content));
    	    	window.scrollTo(0, document.body.scrollHeight);
    	    })
    	    
    	  //////////////////
      	  //listen on server, entered chat
    	    socket.on('enter', function(nick){
    	    	console.log(nick);
//    	    		myNick=nick;
    	    		console.log("socket on enter");
        	    	console.log(nick);
        	    	
        	    	var chat = '<ul id="messages"></ul><form id="chat" action=""><input id="m" autocomplete="off" /><button id="bChat">Send</button></form>'; 
        	            $("body").empty();
        	            $("body").append(chat);
        	            
        	      	  //////////////////
        	      	  //send chat message; button pressed // eventhandler only after "chat" is created
        	      	    $("#chat").submit(function(){
        	      	    	//if the message is a command
        	     	    	if($('#m').val().charAt(0)==="\\" ){   
        	              	  socket.emit('command',{id:nick,content:$('#m').val()})
        	      	    	//normal message
        	      	    	}else{
        	      	    		console.log($('#m').val())
        	      	    		socket.emit("chat message",{ id:nick,content:$("#m").val(),timestamp: ""});
        	      	    	}
        	      	          $("#m").val("");
        	      	          return false;
        	      	        });    	            
        	      	  /////////////////////////
    	    });
    	    
    	    socket.on('nickTaken', function(data){
                alert("Username already taken!");
            })
            
             socket.on('invalidNick', function(data){
                alert("Enter a valid username\nOnly letters and numbers allowed");
            })
      });