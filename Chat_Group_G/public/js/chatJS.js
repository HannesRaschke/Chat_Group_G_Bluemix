      $(function () {
        var socket = io();
        $('form').submit(function(){
          socket.emit('chat message', $('#m').val());
          $('#m').val('');
          return false;
        });
        socket.on('chat message', function(msg){
          	var currentdate = new Date(); 
          	var time = "[" + currentdate.getHours()+ ":"  
              		+ currentdate.getMinutes() + ":" 
              		+ currentdate.getSeconds() + "] ";
            $('#messages').append($('<li>').text(time+name+": "+msg));
          window.scrollTo(0, document.body.scrollHeight);
        });
      });
    