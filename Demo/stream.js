'use strict';

var Stream = (function stream() {
  function constructor(url) {
    this.url = url;
  }
  
  constructor.prototype = {
    readAll: function(progress, complete) {
      var xhr = new XMLHttpRequest();
      var async = true;
      xhr.open("GET", this.url, async);
      xhr.responseType = "arraybuffer";
      if (progress) {
        xhr.onprogress = function (event) {
          progress(xhr.response, event.loaded, event.total);
        };
      }
      xhr.onreadystatechange = function (event) {
        if (xhr.readyState === 4) {
          complete(xhr.response);
          // var byteArray = new Uint8Array(xhr.response);
          // var array = Array.prototype.slice.apply(byteArray);
          // complete(array);
        }
      }
      xhr.send(null);
    }
  };
  return constructor;
})();


var Bytestream = (function BytestreamClosure() {
  function constructor(arrayBuffer, start, length) {
    this.bytes = new Uint8Array(arrayBuffer);
    this.start = start || 0; 
    this.pos = this.start;
    this.end = (start + length) || this.bytes.length;
  }
  constructor.prototype = {
    get length() {
      return this.end - this.start;
    },
    get position() {
      return this.pos;
    },
    get remaining() {
      return this.end - this.pos;
    },
    read8: function () {
      return this.readU8() << 24 >> 24;
    },
    readU8: function () {
      if (this.pos >= this.end)
        return null;
      return this.bytes[this.pos++];
    },
    read16: function () {
      return this.readU16() << 16 >> 16;
    },
    readU16: function () {
      if (this.pos >= this.end - 1)
        return null;
      var res = this.bytes[this.pos + 0] << 8 | this.bytes[this.pos + 1];
      this.pos += 2;
      return res;
    },
    read24: function () {
      return this.readU24() << 8 >> 8;
    },
    readU24: function () {
      var pos = this.pos;
      var bytes = this.bytes;
      if (pos > this.end - 3)
        return null;
      var res = bytes[pos + 0] << 16 | bytes[pos + 1] << 8 | bytes[pos + 2];
      this.pos += 3;
      return res;
    },
    peek32: function (advance) {
      var pos = this.pos;
      var bytes = this.bytes;
      if (pos > this.end - 4)
        return null;
      var res = bytes[pos + 0] << 24 | bytes[pos + 1] << 16 | bytes[pos + 2] << 8 | bytes[pos + 3];
      if (advance) {
        this.pos += 4;
      }
      return res;
    },
    read32: function () {
      return this.peek32(true);
    },
    readU32: function () {
      return this.peek32(true) >>> 0;
    },
    read4CC: function () {
      var pos = this.pos;
      if (pos > this.end - 4)
        return null;
      var res = ""; 
      for (var i = 0; i < 4; i++) {
        res += String.fromCharCode(this.bytes[pos + i]);
      }
      this.pos += 4;
      return res;
    },
    readFF16: function () {
      return this.read32() / 65536;
    },
    readFF8: function () {
      return this.read16() / 256;
    },
    readISO639: function () {
      var bits = this.readU16();
      var res = "";
      for (var i = 0; i < 3; i++) {
        var c = (bits >>> (2 - i) * 5) & 0x1f;
        res += String.fromCharCode(c + 0x60);
      }
      return res;
    },
    readUTF8: function (length) {
      var res = "";
      for (var i = 0; i < length; i++) {
        res += String.fromCharCode(this.readU8());
      }
      return res;
    },
    skip: function (length) {
      this.seek(this.pos + length);
    },
    seek: function (index) {
      if (index < 0 || index > this.end) {
        error("Index out of bounds (bounds: [0, " + this.end + "], index: " + index + ").");
      }
      this.pos = index;
    },
    subStream: function (start, length) {
      return new Bytestream(this.bytes.buffer, start, length);
    }
  };
  return constructor;
})();

var MP4Parser = (function parser() {
  var BOX_HEADER_SIZE = 8;
  var FULL_BOX_HEADER_SIZE = BOX_HEADER_SIZE + 4;
  
  function constructor(stream) {
    this.stream = stream;
  }
  constructor.prototype = {
    parseBox: function (stream) {
      function parseFullBoxHeader(box) {
        box.version = stream.readU8();
        box.flags = stream.readU24();
      }
      
      function parseMatrix(length) {
        var matrix = new Uint32Array(length);
        for (var i = 0; i < length; i++) {
          matrix[i] = stream.readU32();
        }
        return matrix;
      }
      
      var size = stream.readU32();
      var type = stream.read4CC();
      var box = {size: size, type: type, offset: stream.position - BOX_HEADER_SIZE};
      
      var parseContainer = function () {
        var subStream = stream.subStream(stream.position, size - BOX_HEADER_SIZE);
        this.parseBoxes(box, subStream);
        stream.skip(subStream.length);        
      }.bind(this);
      
      switch (type) {
        case 'ftyp':
          box.name = "File Type Box";
          box.majorBrand = stream.read4CC();
          box.minorVersion = stream.readU32();
          box.compatibleBrands = new Array((size - 16) / 4);
          for (var i = 0; i < box.compatibleBrands.length; i++) {
            box.compatibleBrands[i] = stream.read4CC();
          }
          break;
        case 'moov':
          box.name = "Movie Box";
          parseContainer();
          break;
        case 'mvhd':
          box.name = "Movie Header Box";
          parseFullBoxHeader(box);
          assert (box.version == 0);
          box.creationTime = stream.readU32();
          box.modificationTime = stream.readU32();
          box.timescale = stream.readU32();
          box.duration = stream.readU32();
          box.rate = stream.readFF16();
          box.volume = stream.readFF8();
          stream.skip(10);
          box.matrix = parseMatrix(9);
          stream.skip(6 * 4);
          box.nextTrackId = stream.readU32();
          break;
        case 'trak':
          box.name = "Track Box";
          parseContainer();
          break;
        case 'tkhd':
          box.name = "Track Header Box";
          parseFullBoxHeader(box);
          assert (box.version == 0);
          box.creationTime = stream.readU32();
          box.modificationTime = stream.readU32();
          box.trackId = stream.readU32();
          stream.skip(4);
          box.duration = stream.readU32();
          stream.skip(8);
          box.layer = stream.readU16();
          box.alternateGroup = stream.readU16();
          box.volume = stream.readFF8();
          stream.skip(2);
          box.matrix = parseMatrix(9);
          box.width = stream.readFF16();
          box.height = stream.readFF16();
          break;
        case 'mdia':
          box.name = "Media Box";
          parseContainer();
          break;
        case 'mdhd':
          box.name = "Media Header Box";
          parseFullBoxHeader(box);
          assert (box.version == 0);
          box.creationTime = stream.readU32();
          box.modificationTime = stream.readU32();
          box.timescale = stream.readU32();
          box.duration = stream.readU32();
          box.language = stream.readISO639();
          stream.skip(2);
          break;
        case 'hdlr':
          box.name = "Handler Reference Box";
          parseFullBoxHeader(box);
          stream.skip(4);
          box.handlerType = stream.read4CC();
          stream.skip(4 * 3);
          var bytesLeft = box.size - 32;
          if (bytesLeft > 0) {
            box.name = stream.readUTF8(bytesLeft);
          }
          break;
        case 'minf':
          box.name = "Media Information Box";
          parseContainer();
          console.info(box);
          break;
        case 'stbl':
          box.name = "Sample Table Box";
          parseContainer();
          break;
        case 'stsd':
          box.name = "Sample Description Box";
          parseFullBoxHeader(box);
          stream.skip(size - FULL_BOX_HEADER_SIZE);
          break;
        /*
        case 'stts':
          box.name = "Decoding Time to Sample Box";
        case 'stss':
          box.name = "Sync Sample Box";
        case 'stts':
          box.name = "Sample to Chunk Box";
        case 'stsz':
          box.name = "Sample Size Box";
        case 'stco':
          box.name = "Chunk Offset Box";
        */
        default:
          stream.skip(size - BOX_HEADER_SIZE);
          break;
      };
      return box;
    },
    parseBoxes: function (parent, stream) {
      while (stream.peek32()) {
        var child = this.parseBox(stream);
        if (child.type in parent) {
          var old = parent[child.type];
          if (!(old instanceof Array)) {
            parent[child.type] = [old];
          }
          parent[child.type].push(child);
        } else {
          parent[child.type] = child;
        }
      }
    }
  };
  return constructor;
})();

var stream = new Stream("mozilla_story.mp4");

stream.readAll(null, function (buffer) {
  var parser = new MP4Parser(new Bytestream(buffer));
  var root = {};
  parser.parseBoxes(root, parser.stream);
  console.info(root);
});
