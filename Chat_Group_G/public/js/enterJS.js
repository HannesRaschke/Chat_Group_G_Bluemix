      $(function () {
    	  var socket = io();
    	    $("form").submit(function(){
    	        var name = document.getElementById("userNameInp").value;
    	        socket.emit('clientEnterEvent', name);
    	        return false;
    	    });
    	    
    	    socket.on('enter', function(data){
    	    	if(data!==""){
    	    		console.log("socket on enter");
        	    	console.log(data);
        	    	window.location.href = "chat.html";
    	    	}else{
    	    		alert("Enter a Username");
    	    	}
    	    });
      });
        
     