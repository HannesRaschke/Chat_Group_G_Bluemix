      $(function () {
        var socket = io();
        $('#chat').submit(function(){
          socket.emit('chat message', $('#m').val());
          $('#m').val("");
          return false;
        });
        socket.on('chat message', function(msg){
          	var currentdate = new Date(); 
          	var time = "[" + (currentdate.getHours<10?'0':'') + currentdate.getHours()+ ":"  
              		+ (currentdate.getMinutes()<10?'0':'') + currentdate.getMinutes() + ":" +
              		(currentdate.getSeconds()<10?'0':'') + currentdate.getSeconds()  + "] ";
            $('#messages').append($('<li>').text(time+name+": "+msg));
          window.scrollTo(0, document.body.scrollHeight);
        });
      });
    