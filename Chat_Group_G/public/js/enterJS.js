      $(function () {
    	  var socket = io();
    	  ////////////////// 
    	  //username entered; button pressed
    	  $("#enterUsername").submit(function(){
    	        var name = document.getElementById("userNameInp").value; 
    	        socket.emit("clientEnterEvent", name);
    	        return false;
    	    });
    	    
    	    
    	    //////////////////
        	//listen on server, chat message received
    	    socket.on('chat message', function(msg){
              	var currentdate = new Date(); 
              	var time = "[" + (currentdate.getHours<10?'0':'') + currentdate.getHours()+ ":"  
                  		+ (currentdate.getMinutes()<10?'0':'') + currentdate.getMinutes() + ":" +
                  		(currentdate.getSeconds()<10?'0':'') + currentdate.getSeconds()  + "] ";
                $('#messages').append($('<li>').text(time+name+": "+msg));
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
        	      	          socket.emit("chat message", $("#m").val());
        	      	          $("#m").val("");
        	      	          return false;
        	      	        });    	            
        	      	  /////////////////////////
    	    });
      });