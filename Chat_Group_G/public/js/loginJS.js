
      $(function () {
        var socket = io();
        $('form').submit(function(){
          socket.emit('register', $('#userNameInp').val());
          $('#userNameInp').val('');
          return false;
        });});

      function register() {
    		name = document.getElementById("userNameInp").value;
    		console.log("hallo")
    		console.log("name "+name)
    		if (window.XMLHttpRequest) {
    		    // code for modern browsers
    			xhttp = new XMLHttpRequest();
    		 } else {
    		    // code for old IE browsers
    			 xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    		}


    	$.ajax({
    	        url: '/register',
    	        method:'POST',
    	        contentType:'application/json',
    	        data: JSON.stringify({uName:name}),
    	        success: function (response) {
    	            console.log(response)
    	            if(response == "SUCCESS!") {
    	                //LOGIN
    	                window.location.href = "chat.html";
    	            }else {
    	                //ERROR Daten neu eingeben

    	                window.location.href = "index.html";
    	            }
    	        }
    	    })
    	}