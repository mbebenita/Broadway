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
    readU8Array: function (length) {
      if (this.pos > this.end - length)
        return null;
      var res = this.bytes.subarray(this.pos, this.pos + length);
      this.pos += length;
      return res;
    },
    readU32Array: function (length) {
      if (this.pos > this.end - length * 4)
        return null;
      var array = new Uint32Array(length);
      for (var i = 0; i < length; i++) {
        array[i] = this.readU32();
      }
      return array;      
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
    readPString: function (max) {
      var len = this.readU8();
      assert (len <= max);
      var res = this.readUTF8(len);
      this.reserved(max - len - 1, 0);
      return res;
    },
    skip: function (length) {
      this.seek(this.pos + length);
    },
    reserved: function (length, value) {
      for (var i = 0; i < length; i++) {
        assert (this.readU8() == value);
      }
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
  
  
  function readBoxes(stream, parent) {
    while (stream.peek32()) {
      var child = readBox(stream);
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
  
  function readBox(stream) {
    var box = { offset: stream.position };
  
    function readHeader() {
      box.size = stream.readU32();
      box.type = stream.read4CC();
    }
    
    function readFullHeader() {
      box.version = stream.readU8();
      box.flags = stream.readU24();
    }
    
    function remainingBytes() {
      return box.size - (stream.position - box.offset);
    }
    
    function skipRemainingBytes () {
      stream.skip(remainingBytes());
    }
    
    function readRemainingBoxes() {
      var subStream = stream.subStream(stream.position, remainingBytes());
      readBoxes(subStream, box);
      stream.skip(subStream.length);   
    } 
    
    function readVideoSampleDescription(sd) {
      assert (stream.readU16() == 0); // Version
      assert (stream.readU16() == 0); // Revision Level
      stream.readU32(); // Vendor
      stream.readU32(); // Temporal Quality
      stream.readU32(); // Spatial Quality
      sd.width = stream.readU16();
      sd.height = stream.readU16();
      sd.horizontalResolution = stream.readFF16();
      sd.verticalResolution = stream.readFF16();
      assert (stream.readU32() == 0); // Reserved
      sd.frameCount = stream.readU16();
      sd.compressorName = stream.readPString(32);
      sd.depth = stream.readU16();
      assert (stream.readU16() == 0xFFFF); // Color Table Id
    }
    
    readHeader();
    
    switch (box.type) {
      case 'ftyp':
        box.name = "File Type Box";
        box.majorBrand = stream.read4CC();
        box.minorVersion = stream.readU32();
        box.compatibleBrands = new Array((box.size - 16) / 4);
        for (var i = 0; i < box.compatibleBrands.length; i++) {
          box.compatibleBrands[i] = stream.read4CC();
        }
        break;
      case 'moov':
        box.name = "Movie Box";
        readRemainingBoxes();
        break;
      case 'mvhd':
        box.name = "Movie Header Box";
        readFullHeader();
        assert (box.version == 0);
        box.creationTime = stream.readU32();
        box.modificationTime = stream.readU32();
        box.timescale = stream.readU32();
        box.duration = stream.readU32();
        box.rate = stream.readFF16();
        box.volume = stream.readFF8();
        stream.skip(10);
        box.matrix = stream.readU32Array(9);
        stream.skip(6 * 4);
        box.nextTrackId = stream.readU32();
        break;
      case 'trak':
        box.name = "Track Box";
        readRemainingBoxes();
        break;
      case 'tkhd':
        box.name = "Track Header Box";
        readFullHeader();
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
        box.matrix = stream.readU32Array(9);
        box.width = stream.readFF16();
        box.height = stream.readFF16();
        break;
      case 'mdia':
        box.name = "Media Box";
        readRemainingBoxes();
        break;
      case 'mdhd':
        box.name = "Media Header Box";
        readFullHeader();
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
        readFullHeader();
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
        readRemainingBoxes();
        break;
      case 'stbl':
        box.name = "Sample Table Box";
        readRemainingBoxes();
        break;
      case 'stsd':
        box.name = "Sample Description Box";
        readFullHeader();
        box.sd = [];
        var entries = stream.readU32();
        for (var i = 0; i < entries; i++) {
          var sd = {
            offset: stream.position,
            size: stream.readU32(), 
            format: stream.read4CC()
          };
          stream.reserved(6, 0);
          sd.dataReferenceIndex = stream.readU16();
  
          switch (sd.format) {
            case 'avc1':
              readVideoSampleDescription(sd);
              readRemainingBoxes();
              break;
            case 'mp4a':
              break;
            default:
              break;
          }
          
          box.sd.push(sd);
          // stream.skip(sd.size - 16);
          
        }
        // stream.skip(size - FULL_BOX_HEADER_SIZE);
        console.info(box);
        break;
      case 'avcC':
        box.name = "AVC Configuration Box";
        
        box.configurationVersion = stream.readU8();
        box.avcProfileIndicaation = stream.readU8();
        box.profileCompatibility = stream.readU8();
        box.avcLevelIndication = stream.readU8();
        box.lengthSizeMinusOne = stream.readU8() & 3;
        var count = stream.readU8() & 31;
        box.sps = [];
        for (var i = 0; i < count; i++) {
          box.sps.push(stream.readU8Array(stream.readU16()));
        }
        var count = stream.readU8() & 31;
        box.pps = [];
        for (var i = 0; i < count; i++) {
          box.pps.push(stream.readU8Array(stream.readU16()));
        }
        skipRemainingBytes();
        break;
      case 'btrt':
        box.name = "Bit Rate Box";
        skipRemainingBytes();
        break;
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
      default:
        skipRemainingBytes();
        break;
    };
    return box;
  }
  
  constructor.prototype = {
    parse: function () {
      var root = {};
      readBoxes(this.stream, root);
      return root;
    }
  };
  return constructor;
})();


