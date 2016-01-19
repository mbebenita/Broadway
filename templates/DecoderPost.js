       return Module;
    })();
    
    var resultModule = global.Module || Module;

    resultModule._broadwayOnHeadersDecoded = par_broadwayOnHeadersDecoded;
    resultModule._broadwayOnPictureDecoded = par_broadwayOnPictureDecoded;
    
    return resultModule;
  };

  return (function(){
    "use strict";
  
  
  var nowValue = function(){
    return (new Date()).getTime();
  };
  
  if (typeof performance != "undefined"){
    if (performance.now){
      nowValue = function(){
        return performance.now();
      };
    };
  };
  
  
  var Decoder = function(parOptions){
    this.options = parOptions || {};
    
    this.now = nowValue;
    
    var asmInstance;
    
    var fakeWindow = {
    };
    
    var onPicFun = function ($buffer, width, height) {
      var buffer = this.pictureBuffers[$buffer];
      if (!buffer) {
        buffer = this.pictureBuffers[$buffer] = toU8Array($buffer, (width * height * 3) / 2);
      };
      
      var infos;
      var doInfo = false;
      if (this.infoAr.length){
        doInfo = true;
        infos = this.infoAr;
      };
      this.infoAr = [];
      
      if (this.options.rgb){
        if (!asmInstance){
          asmInstance = getAsm(width, height);
        };
        asmInstance.inp.set(buffer);
        asmInstance.doit();

        var copyU8 = new Uint8Array(asmInstance.outSize);
        copyU8.set( asmInstance.out );
        
        if (doInfo){
          infos[0].finishDecoding = nowValue();
        };
        
        this.onPictureDecoded(copyU8, width, height, infos);
        return;
        
      };
      
      if (doInfo){
        infos[0].finishDecoding = nowValue();
      };
      this.onPictureDecoded(buffer, width, height, infos);
    }.bind(this);
    
    var ignore = false;
    
    if (this.options.sliceMode){
      onPicFun = function ($buffer, width, height, $sliceInfo) {
        if (ignore){
          return;
        };
        var buffer = this.pictureBuffers[$buffer];
        if (!buffer) {
          buffer = this.pictureBuffers[$buffer] = toU8Array($buffer, (width * height * 3) / 2);
        };
        var sliceInfo = this.pictureBuffers[$sliceInfo];
        if (!sliceInfo) {
          sliceInfo = this.pictureBuffers[$sliceInfo] = toU32Array($sliceInfo, 18);
        };

        var infos;
        var doInfo = false;
        if (this.infoAr.length){
          doInfo = true;
          infos = this.infoAr;
        };
        this.infoAr = [];

        /*if (this.options.rgb){
        
        no rgb in slice mode

        };*/

        infos[0].finishDecoding = nowValue();
        var sliceInfoAr = [];
        for (var i = 0; i < 20; ++i){
          sliceInfoAr.push(sliceInfo[i]);
        };
        infos[0].sliceInfoAr = sliceInfoAr;

        this.onPictureDecoded(buffer, width, height, infos);
      }.bind(this);
    };
    
    var Module = getModule.apply(fakeWindow, [function () {
    }, onPicFun]);
    

    var HEAP8 = Module.HEAP8;
    var HEAPU8 = Module.HEAPU8;
    var HEAP16 = Module.HEAP16;
    var HEAP32 = Module.HEAP32;

    
    var MAX_STREAM_BUFFER_LENGTH = 1024 * 1024;
  
    // from old constructor
    Module._broadwayInit();
    
    /**
   * Creates a typed array from a HEAP8 pointer. 
   */
    function toU8Array(ptr, length) {
      return HEAPU8.subarray(ptr, ptr + length);
    };
    function toU32Array(ptr, length) {
      //var tmp = HEAPU8.subarray(ptr, ptr + (length * 4));
      return new Uint32Array(HEAPU8.buffer, ptr, length);
    };
    this.streamBuffer = toU8Array(Module._broadwayCreateStream(MAX_STREAM_BUFFER_LENGTH), MAX_STREAM_BUFFER_LENGTH);
    this.pictureBuffers = {};
    // collect extra infos that are provided with the nal units
    this.infoAr = [];
    
    this.onPictureDecoded = function (buffer, width, height, infos) {
      
    };
    
    /**
     * Decodes a stream buffer. This may be one single (unframed) NAL unit without the
     * start code, or a sequence of NAL units with framing start code prefixes. This
     * function overwrites stream buffer allocated by the codec with the supplied buffer.
     */
    
    var sliceNum = 0;
    if (this.options.sliceMode){
      sliceNum = this.options.sliceNum;
      
      this.decode = function decode(typedAr, parInfo, copyDoneFun) {
        this.infoAr.push(parInfo);
        parInfo.startDecoding = nowValue();
        var nals = parInfo.nals;
        var i;
        if (!nals){
          nals = [];
          parInfo.nals = nals;
          var l = typedAr.length;
          var foundSomething = false;
          var lastFound = 0;
          var lastStart = 0;
          for (i = 0; i < l; ++i){
            if (typedAr[i] === 1){
              if (
                typedAr[i - 1] === 0 &&
                typedAr[i - 2] === 0
              ){
                var startPos = i - 2;
                if (typedAr[i - 3] === 0){
                  startPos = i - 3;
                };
                // its a nal;
                if (foundSomething){
                  nals.push({
                    offset: lastFound,
                    end: startPos,
                    type: typedAr[lastStart] & 31
                  });
                };
                lastFound = startPos;
                lastStart = startPos + 3;
                if (typedAr[i - 3] === 0){
                  lastStart = startPos + 4;
                };
                foundSomething = true;
              };
            };
          };
          if (foundSomething){
            nals.push({
              offset: lastFound,
              end: i,
              type: typedAr[lastStart] & 31
            });
          };
        };
        
        var currentSlice = 0;
        var playAr;
        var offset = 0;
        for (i = 0; i < nals.length; ++i){
          if (nals[i].type === 1 || nals[i].type === 5){
            if (currentSlice === sliceNum){
              playAr = typedAr.subarray(nals[i].offset, nals[i].end);
              this.streamBuffer[offset] = 0;
              offset += 1;
              this.streamBuffer.set(playAr, offset);
              offset += playAr.length;
            };
            currentSlice += 1;
          }else{
            playAr = typedAr.subarray(nals[i].offset, nals[i].end);
            this.streamBuffer[offset] = 0;
            offset += 1;
            this.streamBuffer.set(playAr, offset);
            offset += playAr.length;
            Module._broadwayPlayStream(offset);
            offset = 0;
          };
        };
        copyDoneFun();
        Module._broadwayPlayStream(offset);
      };
      
    }else{
      this.decode = function decode(typedAr, parInfo) {
        // console.info("Decoding: " + buffer.length);
        // collect infos
        if (parInfo){
          this.infoAr.push(parInfo);
          parInfo.startDecoding = nowValue();
        };

        this.streamBuffer.set(typedAr);
        Module._broadwayPlayStream(typedAr.length);
      };
    };

  };

  
  Decoder.prototype = {
    
  };
  
  
  
  
  /*
  
    asm.js implementation of a yuv to rgb convertor
    provided by @soliton4
    
    based on 
    http://www.wordsaretoys.com/2013/10/18/making-yuv-conversion-a-little-faster/
  
  */
  
  
  // factory to create asm.js yuv -> rgb convertor for a given resolution
  var asmInstances = {};
  var getAsm = function(parWidth, parHeight){
    var idStr = "" + parWidth + "x" + parHeight;
    if (asmInstances[idStr]){
      return asmInstances[idStr];
    };

    var lumaSize = parWidth * parHeight;
    var chromaSize = (lumaSize|0) >> 2;

    var inpSize = lumaSize + chromaSize + chromaSize;
    var outSize = parWidth * parHeight * 4;
    var cacheSize = Math.pow(2, 24) * 4;
    var size = inpSize + outSize + cacheSize;

    var chunkSize = Math.pow(2, 24);
    var heapSize = chunkSize;
    while (heapSize < size){
      heapSize += chunkSize;
    };
    var heap = new ArrayBuffer(heapSize);

    var res = asmFactory(global, {}, heap);
    res.init(parWidth, parHeight);
    asmInstances[idStr] = res;

    res.heap = heap;
    res.out = new Uint8Array(heap, 0, outSize);
    res.inp = new Uint8Array(heap, outSize, inpSize);
    res.outSize = outSize;

    return res;
  };


  function asmFactory(stdlib, foreign, heap) {
    "use asm";

    var imul = stdlib.Math.imul;
    var min = stdlib.Math.min;
    var max = stdlib.Math.max;
    var pow = stdlib.Math.pow;
    var out = new stdlib.Uint8Array(heap);
    var out32 = new stdlib.Uint32Array(heap);
    var inp = new stdlib.Uint8Array(heap);
    var mem = new stdlib.Uint8Array(heap);
    var mem32 = new stdlib.Uint32Array(heap);

    // for double algo
    /*var vt = 1.370705;
    var gt = 0.698001;
    var gt2 = 0.337633;
    var bt = 1.732446;*/

    var width = 0;
    var height = 0;
    var lumaSize = 0;
    var chromaSize = 0;
    var inpSize = 0;
    var outSize = 0;

    var inpStart = 0;
    var outStart = 0;

    var widthFour = 0;

    var cacheStart = 0;


    function init(parWidth, parHeight){
      parWidth = parWidth|0;
      parHeight = parHeight|0;

      var i = 0;
      var s = 0;

      width = parWidth;
      widthFour = imul(parWidth, 4)|0;
      height = parHeight;
      lumaSize = imul(width|0, height|0)|0;
      chromaSize = (lumaSize|0) >> 2;
      outSize = imul(imul(width, height)|0, 4)|0;
      inpSize = ((lumaSize + chromaSize)|0 + chromaSize)|0;

      outStart = 0;
      inpStart = (outStart + outSize)|0;
      cacheStart = (inpStart + inpSize)|0;

      // initializing memory (to be on the safe side)
      s = ~~(+pow(+2, +24));
      s = imul(s, 4)|0;

      for (i = 0|0; ((i|0) < (s|0))|0; i = (i + 4)|0){
        mem32[((cacheStart + i)|0) >> 2] = 0;
      };
    };

    function doit(){
      var ystart = 0;
      var ustart = 0;
      var vstart = 0;

      var y = 0;
      var yn = 0;
      var u = 0;
      var v = 0;

      var o = 0;

      var line = 0;
      var col = 0;

      var usave = 0;
      var vsave = 0;

      var ostart = 0;
      var cacheAdr = 0;

      ostart = outStart|0;

      ystart = inpStart|0;
      ustart = (ystart + lumaSize|0)|0;
      vstart = (ustart + chromaSize)|0;

      for (line = 0; (line|0) < (height|0); line = (line + 2)|0){
        usave = ustart;
        vsave = vstart;
        for (col = 0; (col|0) < (width|0); col = (col + 2)|0){
          y = inp[ystart >> 0]|0;
          yn = inp[((ystart + width)|0) >> 0]|0;

          u = inp[ustart >> 0]|0;
          v = inp[vstart >> 0]|0;

          cacheAdr = (((((y << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(y,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[ostart >> 2] = o;

          cacheAdr = (((((yn << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(yn,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[((ostart + widthFour)|0) >> 2] = o;

          //yuv2rgb5(y, u, v, ostart);
          //yuv2rgb5(yn, u, v, (ostart + widthFour)|0);
          ostart = (ostart + 4)|0;

          // next step only for y. u and v stay the same
          ystart = (ystart + 1)|0;
          y = inp[ystart >> 0]|0;
          yn = inp[((ystart + width)|0) >> 0]|0;

          //yuv2rgb5(y, u, v, ostart);
          cacheAdr = (((((y << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(y,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[ostart >> 2] = o;

          //yuv2rgb5(yn, u, v, (ostart + widthFour)|0);
          cacheAdr = (((((yn << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(yn,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[((ostart + widthFour)|0) >> 2] = o;
          ostart = (ostart + 4)|0;

          //all positions inc 1

          ystart = (ystart + 1)|0;
          ustart = (ustart + 1)|0;
          vstart = (vstart + 1)|0;
        };
        ostart = (ostart + widthFour)|0;
        ystart = (ystart + width)|0;

      };

    };

    function yuv2rgbcalc(y, u, v){
      y = y|0;
      u = u|0;
      v = v|0;

      var r = 0;
      var g = 0;
      var b = 0;

      var o = 0;

      var a0 = 0;
      var a1 = 0;
      var a2 = 0;
      var a3 = 0;
      var a4 = 0;

      a0 = imul(1192, (y - 16)|0)|0;
      a1 = imul(1634, (v - 128)|0)|0;
      a2 = imul(832, (v - 128)|0)|0;
      a3 = imul(400, (u - 128)|0)|0;
      a4 = imul(2066, (u - 128)|0)|0;

      r = (((a0 + a1)|0) >> 10)|0;
      g = (((((a0 - a2)|0) - a3)|0) >> 10)|0;
      b = (((a0 + a4)|0) >> 10)|0;

      if ((((r & 255)|0) != (r|0))|0){
        r = min(255, max(0, r|0)|0)|0;
      };
      if ((((g & 255)|0) != (g|0))|0){
        g = min(255, max(0, g|0)|0)|0;
      };
      if ((((b & 255)|0) != (b|0))|0){
        b = min(255, max(0, b|0)|0)|0;
      };

      o = 255;
      o = (o << 8)|0;
      o = (o + b)|0;
      o = (o << 8)|0;
      o = (o + g)|0;
      o = (o << 8)|0;
      o = (o + r)|0;

      return o|0;

    };



    return {
      init: init,
      doit: doit
    };
  };

  
  /*
    potential worker initialization
  
  */
  
  
  if (typeof self != "undefined"){
    var isWorker = false;
    var decoder;
    var reuseMemory = false;
    var sliceMode = false;
    var sliceNum = 0;
    var sliceCnt = 0;
    var lastSliceNum = 0;
    var sliceInfoAr;
    var lastBuf;
    var awaiting = 0;
    var pile = [];
    var startDecoding;
    var finishDecoding;
    var timeDecoding;
    
    var memAr = [];
    var getMem = function(length){
      if (memAr.length){
        var u = memAr.shift();
        while (u && u.byteLength !== length){
          u = memAr.shift();
        };
        if (u){
          return u;
        };
      };
      return new ArrayBuffer(length);
    }; 
    
    var copySlice = function(source, target, infoAr, width, height){
      
      var length = width * height;
      var length4 = length / 4
      var plane2 = length;
      var plane3 = length + length4;
      
      var copy16 = function(parBegin, parEnd){
        var i = 0;
        for (i = 0; i < 16; ++i){
          var begin = parBegin + (width * i);
          var end = parEnd + (width * i)
          target.set(source.subarray(begin, end), begin);
        };
      };
      var copy8 = function(parBegin, parEnd){
        var i = 0;
        for (i = 0; i < 8; ++i){
          var begin = parBegin + ((width / 2) * i);
          var end = parEnd + ((width / 2) * i)
          target.set(source.subarray(begin, end), begin);
        };
      };
      var copyChunk = function(begin, end){
        target.set(source.subarray(begin, end), begin);
      };
      
      var begin = infoAr[0];
      var end = infoAr[1];
      if (end > 0){
        copy16(begin, end);
        copy8(infoAr[2], infoAr[3]);
        copy8(infoAr[4], infoAr[5]);
      };
      begin = infoAr[6];
      end = infoAr[7];
      if (end > 0){
        copy16(begin, end);
        copy8(infoAr[8], infoAr[9]);
        copy8(infoAr[10], infoAr[11]);
      };
      
      begin = infoAr[12];
      end = infoAr[15];
      if (end > 0){
        copyChunk(begin, end);
        copyChunk(infoAr[13], infoAr[16]);
        copyChunk(infoAr[14], infoAr[17]);
      };
      
    };
    
    var sliceMsgFun = function(){};
    
    var setSliceCnt = function(parSliceCnt){
      sliceCnt = parSliceCnt;
      lastSliceNum = sliceCnt - 1;
    };
    
    
    self.addEventListener('message', function(e) {
      
      if (isWorker){
        if (reuseMemory){
          if (e.data.reuse){
            memAr.push(e.data.reuse);
          };
        };
        if (e.data.buf){
          if (sliceMode && awaiting !== 0){
            pile.push(e.data);
          }else{
            decoder.decode(
              new Uint8Array(e.data.buf, e.data.offset || 0, e.data.length), 
              e.data.info, 
              function(){
                if (sliceMode && sliceNum !== lastSliceNum){
                  postMessage(e.data, [e.data.buf]);
                };
              }
            );
          };
          return;
        };
        
        if (e.data.slice){
          // update ref pic
          var copyStart = nowValue();
          copySlice(new Uint8Array(e.data.slice), lastBuf, e.data.infos[0].sliceInfoAr, e.data.width, e.data.height);
          // is it the one? then we need to update it
          if (e.data.theOne){
            copySlice(lastBuf, new Uint8Array(e.data.slice), sliceInfoAr, e.data.width, e.data.height);
            if (timeDecoding > e.data.infos[0].timeDecoding){
              e.data.infos[0].timeDecoding = timeDecoding;
            };
            e.data.infos[0].timeCopy += (nowValue() - copyStart);
          };
          // move on
          postMessage(e.data, [e.data.slice]);
          
          // next frame in the pipe?
          awaiting -= 1;
          if (awaiting === 0 && pile.length){
            var data = pile.shift();
            decoder.decode(
              new Uint8Array(data.buf, data.offset || 0, data.length), 
              data.info, 
              function(){
                if (sliceMode && sliceNum !== lastSliceNum){
                  postMessage(data, [data.buf]);
                };
              }
            );
          };
          return;
        };
        
        if (e.data.setSliceCnt){
          setSliceCnt(e.data.sliceCnt);
          return;
        };
        
      }else{
        if (e.data && e.data.type === "Broadway.js - Worker init"){
          isWorker = true;
          decoder = new Decoder(e.data.options);
          
          if (e.data.options.sliceMode){
            reuseMemory = true;
            sliceMode = true;
            sliceNum = e.data.options.sliceNum;
            setSliceCnt(e.data.options.sliceCnt);

            decoder.onPictureDecoded = function (buffer, width, height, infos) {
              
              // buffer needs to be copied because we give up ownership
              var copyU8 = new Uint8Array(getMem(buffer.length));
              copySlice(buffer, copyU8, infos[0].sliceInfoAr, width, height);
              
              startDecoding = infos[0].startDecoding;
              finishDecoding = infos[0].finishDecoding;
              timeDecoding = finishDecoding - startDecoding;
              infos[0].timeDecoding = timeDecoding;
              infos[0].timeCopy = 0;
              
              postMessage({
                slice: copyU8.buffer,
                sliceNum: sliceNum,
                width: width, 
                height: height, 
                infos: infos
              }, [copyU8.buffer]); // 2nd parameter is used to indicate transfer of ownership
              
              awaiting = sliceCnt - 1;
              
              lastBuf = buffer;
              sliceInfoAr = infos[0].sliceInfoAr;

            };
            
          }else if (e.data.options.reuseMemory){
            reuseMemory = true;
            decoder.onPictureDecoded = function (buffer, width, height, infos) {
              
              // buffer needs to be copied because we give up ownership
              var copyU8 = new Uint8Array(getMem(buffer.length));
              copyU8.set( buffer, 0, buffer.length );

              postMessage({
                buf: copyU8.buffer, 
                length: buffer.length,
                width: width, 
                height: height, 
                infos: infos
              }, [copyU8.buffer]); // 2nd parameter is used to indicate transfer of ownership

            };
            
          }else{
            decoder.onPictureDecoded = function (buffer, width, height, infos) {
              if (buffer) {
                buffer = new Uint8Array(buffer);
              };

              // buffer needs to be copied because we give up ownership
              var copyU8 = new Uint8Array(buffer.length);
              copyU8.set( buffer, 0, buffer.length );

              postMessage({
                buf: copyU8.buffer, 
                length: buffer.length,
                width: width, 
                height: height, 
                infos: infos
              }, [copyU8.buffer]); // 2nd parameter is used to indicate transfer of ownership

            };
          };
          postMessage({ consoleLog: "broadway worker initialized" });
        };
      };


    }, false);
  };
  
  Decoder.nowValue = nowValue;
  
  return Decoder;
  
  })();
  
  
}));

