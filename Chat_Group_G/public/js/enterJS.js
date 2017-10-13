      $(function () {
    	  var socket = io();
    	  var name;
    	  ////////////////// 
    	  //username entered; button pressed
    	  $("#enterUsername").submit(function(){
    	        name = document.getElementById("userNameInp").value; 
    	        socket.emit("clientEnterEvent", name);
    	        return false;
    	    });
    	    
    	    
    	    //////////////////
        	//listen on server, chat message received
    	    socket.on('chat message', function(msg){
    	    	console.log("message123")
              	var currentdate = new Date(); 
              	var time = "[" + (currentdate.getHours<10?'0':'') + currentdate.getHours()+ ":"  
                  		+ (currentdate.getMinutes()<10?'0':'') + currentdate.getMinutes() + ":" +
                  		(currentdate.getSeconds()<10?'0':'') + currentdate.getSeconds()  + "] ";
                if(msg.type==="private"){
                	$('#messages').append($('<li id="privateMessage">').text(time+msg.from+" whispers: "+msg.message));
                }else if(msg.type==="system"){
                	console.log(msg.content)
                	$('#messages').append($('<li id="systemMessage">').text(time+"SYSTEM: "+msg.content));
                }else{                	
                	$('#messages').append($('<li>').text(time+msg.id+": "+msg.content));
                }
                window.scrollTo(0, document.body.scrollHeight);
              
            });
    	    
    	  //////////////////
      	  //listen on server, entered chat
    	    socket.on('enter', function(data){
    	    	
    	    		console.log("socket on enter");
        	    	console.log(data);
        	    	
        	    	var chat = '<ul id="messages"></ul><form id="chat" action=""><input id="m" autocomplete="off" /><button id="bChat">Send</button></form>'; 
        	            $("body").empty();
        	            $("body").append(chat);
        	            
        	      	  //////////////////
        	      	  //send chat message; button pressed // eventhandler only after "chat" is created
        	      	    $("#chat").submit(function(){
        	      	    	//if the message is private
        	      	    	if($('#m').val().substring(0,4)==="\\msg"){
        	      	    		 socket.emit('private message',{ id:name,content:$('#m').val()});
        	      	    	//if the message is a command
        	      	    	}else if($('#m').val().charAt(0)==="\\" ){   
        	              	  socket.emit('command',{id:name,content:$('#m').val()})
        	      	    	//normal message
        	      	    	}else{
        	      	    		console.log($('#m').val())
        	      	    		socket.emit("chat message",{ id:name,content:$("#m").val()});
        	      	    	}
        	      	          $("#m").val("");
        	      	          return false;
        	      	        });    	            
        	      	  /////////////////////////
    	    });
      });