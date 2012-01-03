importScripts('worker.js');

function randomBuffer(length) {
  var buffer = new Uint8Array(length);
  for (var i = 0; i < buffer.length; i ++) {
    buffer[i] = Math.random() * 255;
  }
  return buffer;
}

var buffer = randomBuffer(1024*1024);

var socket = new WorkerSocket();
var console = {info: function (message) {
  socket.sendMessage("console.info", message);
}};

socket.onReceiveMessage("echo", function (message) {
  if (message.reply) {
    socket.sendMessage(message.reply, message.payload);
  }
});
