
		$(function () {
	    	  var socket = io();
	    	  var nick;
	    	  
	    	  var fileSelected
	    	  var fileReader
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
    	    
    	    //shows normal message and the uploaded file
    	    socket.on('file message', function(msg){ 
//                	$('#messages').append($('<li id="fileMessage">').text(msg.timestamp+msg.id+": "+msg.content));
                	$('#messages').append($('<a id="file" href = "Temp/'+msg.fileName+'" download>'+'<img id= "fileImg" src="Media/file.png" alt = "'+msg.fileName+'">'+'</a>')); //onclick="downloadFile('+"'"+msg.fileName+"'"+')"  //
                window.scrollTo(0, document.body.scrollHeight);
            });
    	    
    	  //////////////////
      	  //listen on server, entered chat
    	    socket.on('enter', function(nick){
    	    	console.log(nick);
//    	    		myNick=nick;
    	    		console.log("socket on enter");
        	    	console.log(nick);
        	    	
        	    	var smilies = "";
        	    	for(var i=128512; i <= 128591; i++){
        	    		smilies += '<span class="smilies" id="&#'+i+'">&#'+i+'</span>';
        	    	}
        	    	
        	    	var chat = '<div id="smilies">'+smilies+'</div><div id="onlineUserWidget"></div><ul id="messages"></ul><form id="chat" action=""><input type="file" id="f"><div id="d"></div><input id="m" autocomplete="off" /><button id="bChat">Send</button></form>'; 
        	            $("body").empty();
        	            $("body").append(chat);
        	            
        	            document.getElementById('f').addEventListener('change', FileChosen);
        	            
        	      	  //////////////////
        	      	  //send chat message; button pressed // eventhandler only after "chat" is created
        	      	    $("#chat").submit(function(){
        	      	    	var isPrivate;
        	      	    	//if the message is a command
        	     	    	if($('#m').val().charAt(0)==="\\" ){   
        	              	  socket.emit('command',{id:nick,content:$('#m').val()})
        	              	  isPrivate=true
        	      	    	//normal message
        	      	    	}else{
        	      	    		socket.emit("chat message",{ id:nick,content:$("#m").val(),timestamp: ""});
        	      	    		isPrivate=false
        	      	    	}
        	     	    	//if a file is send with the message
        	     	    	if(fileSelected!=undefined){
        	     	    		socket.emit('upload',{file:fileSelected,fileName:fileSelected.name,id:nick,content:$("#m").val(),isPrivate:isPrivate})//type:fileSelected.type
    	      	    			$('#d').html("");   
    	      	    			fileSelected=undefined;
        	     	    	}
        	      	          $("#m").val("");
        	      	          return false;
        	      	        });    	            
        	      	  /////////////////////////
        	      	    
        	     	    
          	      	  $(function(){
          	      		  $('.smilies').on("click",function(){
          	      			  var smilie = $(this).attr('id');
          	      			  var chatmessage = $('#m').val();
          	      		  $('#m').val(chatmessage + smilie );
          	      		  })
          	      	  })  
          	      	  
          	      	  $(function(){
          	      		  $('#onlineUserWidget').on("click",".onlineUser",function(){
        	      			  var user = $(this).attr('id');
        	      			  var chatmessage = $('#m').val();
        	      			  $('#m').val("\\pm " + user + " " +chatmessage);
        	      		  })
        	      	  })  
    	    });
    	    
    	    socket.on('nickTaken', function(data){
                alert("Username already taken!");
            });
            
             socket.on('invalidNick', function(data){
                alert("Enter a valid username\nOnly letters and numbers allowed");
            });

            //onclick function for the file upload
            function FileChosen(event){
    	    	fileSelected = event.target.files[0]
    	    		$('#d').html("File Selected: "+fileSelected.name);   	
    	    	}
            
            socket.on('OnlineUserWidget',function(msg){
    	    	var OUWUsers = "";
    	    	for(var i=0; i < msg.content.length; i++){
    	    		OUWUsers += '<span class=onlineUser id='+msg.content[i]+'>'+msg.content[i]+'</span><br>';
    	    	}
    	    	
    	    	console.log("ouw");
    	    	console.log(msg.content);
    	    	console.log(OUWUsers);
    	    	$('#onlineUserWidget').empty();
    	    	$('#onlineUserWidget').append(OUWUsers);
    	    })
            
      });
