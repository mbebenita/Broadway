//Module = undefined;
window = this;

importScripts('util.js');
importScripts('avc-codec.js');
importScripts('avc.js');


postMessage({consoleLog: "here"});


var console = {info: function (message) {
  //socket.sendMessage("console.info", message);
}};

var avc = new Avc();

var config = null;

avc.onPictureDecoded = function (buffer, width, height) {
  if (config && config.sendBufferOnPictureDecoded !== undefined) {
    buffer = config.sendBufferOnPictureDecoded ? buffer : null;
  }
  // 'buffer' is a view of a large ArrayBuffer. Only clone the portion in the
  // view.
  if (buffer) {
    buffer = new Uint8Array(buffer);
  }
  // slow
  //socket.sendMessage("on-picture-decoded", {picture: buffer, width: width, height: height});
  
  // post dimensions seperately
  postMessage({width: width, height: height});
  
  // buffer needs to be copied because we give up ownership
  var copyU8 = new Uint8Array(buffer.length);
  copyU8.set( buffer, 0, buffer.length );
  // only post the buffer (slightly faster)
  // add 2nd parameter to indicate transfer of owner ship (this it was makes this worker implementation faster)
  postMessage(copyU8.buffer, [copyU8.buffer]);
  return;
  
};

/*socket.onReceiveMessage("decode-sample", function (message) {
  avc.decode(message.payload);
});

socket.onReceiveMessage("configure", function (message) {
  config = message.payload;
  avc.configure(config);
});*/


self.addEventListener('message', function(e) {
  
  var data = e.data;
  if (data.avcConfiguration){
    avc.configure(data.avcConfiguration);
    return;
  };
  
  avc.decode(new Uint8Array(data));
  
}, false);