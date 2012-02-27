

/**
 * Creates a typed array from a HEAP8 pointer. 
 */
function toU8Array(ptr, length) {
  return HEAP8.subarray(ptr, ptr + length);
}

// const MAX_STREAM_BUFFER_LENGTH = 64 * 1024;
const MAX_STREAM_BUFFER_LENGTH = 1024 * 1024;

/**
 * JS wrapper around the C H.264 Decoder, this is meant to execute in a web worker. At the moment only one instance of
 * the decoder can exist.
 */
var Decoder = (function decoder() {
  function constructor() {
    Module._broadwayInit();
    this.streamBuffer = toU8Array(Module._broadwayCreateStream(MAX_STREAM_BUFFER_LENGTH), MAX_STREAM_BUFFER_LENGTH);
    
    this.pictureBuffers = {};
    
    _broadwayOnPictureDecoded = function ($buffer, width, height) {
      var buffer = this.pictureBuffers[$buffer];
      if (!buffer) {
        buffer = this.pictureBuffers[$buffer] = toU8Array($buffer, (width * height * 3) / 2);
      }
      console.info(buffer.length);
    }.bind(this);
  }

  constructor.prototype = {
    initialize: function () {
      console.info("Stream Buffer Length: " + this.streamBuffer.length);
    },
    /**
     * Decodes a stream buffer. This may be one single (unframed) NAL unit without the
     * start code, or a sequence of NAL units with framing start code prefixes. This
     * function overwrites stream buffer allocated by the codec with the supplied buffer.
     */
    decode: function (buffer) {
      console.info("Decoding: " + buffer.length);
      this.streamBuffer.set(buffer);
      Module._broadwaySetStreamLength(buffer.length);
      Module._broadwayPlayStream();
    }
  };
  return constructor;
})();

var decoder = new Decoder();
decoder.initialize();

var stream = new Stream("mozilla_story.mp4");
// var stream = new Stream("gizmo.mp4");

print = function (a) {
  console.log(a);
}

stream.readAll(null, function (stream) {
  stream.readAll(null, function (buffer) {
    
  });
  
  var reader = new MP4Reader(new Bytestream(buffer))
  reader.read();
  var file = reader.file;
  
  var video = reader.tracks[1];
  var audio = reader.tracks[2];
  
  var avc = reader.tracks[1].trak.mdia.minf.stbl.stsd.avc1.avcC;
  var sps = avc.sps[0];
  var pps = avc.pps[0];
  
  // reader.traceSamples();
  
  decoder.decode(sps);
  decoder.decode(pps);
  
  for (var i = 0; i < 30 * 10; i++) {
    decoder.decode(video.getSampleBytes(i, true));
  }
});

