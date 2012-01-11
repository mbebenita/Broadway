importScripts('util.js');
importScripts('worker.js');
importScripts('avc-codec.js');
importScripts('avc.js');

var socket = new WorkerSocket();

var console = {info: function (message) {
  socket.sendMessage("console.info", message);
}};

var avc = new Avc();

var config = null;

avc.onPictureDecoded = function (buffer, width, height) {
  if (config && config.sendBufferOnPictureDecoded !== undefined) {
    buffer = config.sendBufferOnPictureDecoded ? buffer : null;
  }
  socket.sendMessage("on-picture-decoded", {picture: buffer, width: width, height: height});
}

socket.onReceiveMessage("decode-sample", function (message) {
  avc.decode(message.payload);
});

socket.onReceiveMessage("configure", function (message) {
  config = message.payload;
  avc.configure(config);
});