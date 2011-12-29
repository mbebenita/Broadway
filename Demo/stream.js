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
    readU32Array: function (rows, cols, names) {
      cols = cols || 1;
      if (this.pos > this.end - (rows * cols) * 4)
        return null;
      if (cols == 1) {
        var array = new Uint32Array(rows);
        for (var i = 0; i < rows; i++) {
          array[i] = this.readU32();
        }
        return array;
      } else {
        var array = new Array(rows);
        for (var i = 0; i < rows; i++) {
          var row = null;
          if (names) {
            row = {};
            for (var j = 0; j < cols; j++) {
              row[names[j]] = this.readU32(); 
            }
          } else {
            row = new Uint32Array(cols);
            for (var j = 0; j < cols; j++) {
              row[j] = this.readU32();
            }
          }
          array[i] = row;
        }
        return array;
      }
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
    readFP16: function () {
      return this.read32() / 65536;
    },
    readFP8: function () {
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

/**
 * Parses an mp4 file and constructs a object graph that corresponds to the box/atom
 * structure of the file. Mp4 files are based on the ISO Base Media format, which in 
 * turn is based on the Apple Quicktime format. The Quicktime spec is available at:
 * http://developer.apple.com/library/mac/#documentation/QuickTime/QTFF. An mp4 spec 
 * also exists, but I cannot find it freely available. 
 * 
 * Mp4 files contain a tree of boxes (or atoms in Quicktime). The general structure
 * is as follows (in a pseudo regex syntax):
 * 
 * Box / Atom Structure:
 * 
 * [size type [version flags] field* box*]
 *  <32> <4C>  <--8--> <24->  <-?->  <?>
 *  <------------- box size ------------>
 *  
 *  The box size indicates the entire size of the box and its children, we can use it
 *  to skip over boxes that are of no interest. Each box has a type indicated by a 
 *  four character code (4C), this describes how the box should be parsed and is also
 *  used as an object key name in the resulting box tree. For example, the expression:  
 *  "moov.trak[0].mdia.minf" can be used to access individual boxes in the tree based
 *  on their 4C name. If two or more boxes with the same 4C name exist in a box, then
 *  an array is built with that name.  
 * 
 */
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
        box.rate = stream.readFP16();
        box.volume = stream.readFP8();
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
        box.volume = stream.readFP8();
        stream.skip(2);
        box.matrix = stream.readU32Array(9);
        box.width = stream.readFP16();
        box.height = stream.readFP16();
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
        readRemainingBoxes();
        break;
      case 'avc1':
        stream.reserved(6, 0);
        box.dataReferenceIndex = stream.readU16();
        assert (stream.readU16() == 0); // Version
        assert (stream.readU16() == 0); // Revision Level
        stream.readU32(); // Vendor
        stream.readU32(); // Temporal Quality
        stream.readU32(); // Spatial Quality
        box.width = stream.readU16();
        box.height = stream.readU16();
        box.horizontalResolution = stream.readFP16();
        box.verticalResolution = stream.readFP16();
        assert (stream.readU32() == 0); // Reserved
        box.frameCount = stream.readU16();
        box.compressorName = stream.readPString(32);
        box.depth = stream.readU16();
        assert (stream.readU16() == 0xFFFF); // Color Table Id
        readRemainingBoxes();
        break;
      case 'mp4a':
        stream.reserved(6, 0);
        box.dataReferenceIndex = stream.readU16();
        box.version = stream.readU16();
        stream.skip(2);
        stream.skip(4);
        box.channelCount = stream.readU16();
        box.sampleSize = stream.readU16();
        box.compressionId = stream.readU16();
        box.packetSize = stream.readU16();
        box.sampleRate = stream.readU32() >>> 16;
        
        // TODO: Parse other version levels.
        assert (box.version == 0);
        readRemainingBoxes();
        break;
      case 'esds':
        box.name = "Elementary Stream Descriptor";
        readFullHeader();
        // TODO: Do we really need to parse this?
        skipRemainingBytes();
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
        box.bufferSizeDb = stream.readU32();
        box.maxBitrate = stream.readU32();
        box.avgBitrate = stream.readU32();
        break;
      case 'stts':
        box.name = "Decoding Time to Sample Box";
        readFullHeader();
        box.table = stream.readU32Array(stream.readU32(), 2, ["count", "delta"]);
        
        // Each {count, delta} entry gives the number of consecutive samples with the same
        // time delta and the delta of those samples. By adding the deltas, a time-to-sample
        // map can be built.
        
        var sampleToDelta = function (sample) {
          for (var i = 0; i < box.table.length; i++) {
            sample -= box.table[i].count;
            if (sample < 0) {
              return box.table[i].count;
            }
          }
          assert (false);
        };
        
        box.timeToSample = function (time) {
          var sample = 0;
          for (var i = 0; i < box.table.length; i++) {
            var delta = box.table[i].count * box.table[i].delta;
            if (time >= delta) {
              time -= delta;
              sample += box.table[i].count;
              continue;
            } else {
              return Math.floor(time / box.table[i].delta);
            }
          }
        };
        break;
      case 'stss':
        box.name = "Sync Sample Box";
        readFullHeader();
        box.samples = stream.readU32Array(stream.readU32());
        break;
      case 'stts':
        box.name = "Sample to Chunk Box";
        readFullHeader();
        box.table = stream.readU32Array(stream.readU32(), 3, 
          ["firstChunk", "samplesPerChunk", "sampleDescriptionId"]);
        break;
      case 'stsz':
        box.name = "Sample Size Box";
        readFullHeader();
        box.sampleSize = stream.readU32();
        var count = stream.readU32();
        if (box.sampleSize == 0) {
          box.table = stream.readU32Array(count);
        }
        break;
      case 'stco':
        box.name = "Chunk Offset Box";
        readFullHeader();
        box.table = stream.readU32Array(stream.readU32());
        break;
      case 'smhd':
        box.name = "Sound Media Header Box";
        readFullHeader();
        box.balance = stream.readFP8();
        stream.reserved(2, 0);
        break;
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


