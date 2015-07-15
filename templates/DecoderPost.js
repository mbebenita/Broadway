    var resultModule = window.Module || global.Module || Module;
    
    return resultModule;
  };
  
  
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
  
  
  var Broadway = function(parOptions){
    this.options = parOptions || {};
    
    this.now = nowValue;
    
    var asmInstance;
    
    var fakeWindow = {
    };
    
    var Module = getModule.apply(fakeWindow, [function () {

    }, function ($buffer, width, height) {
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
    }.bind(this)]);

    var HEAP8 = Module.HEAP8;
    var HEAPU8 = Module.HEAPU8;
    var HEAP16 = Module.HEAP16;
    var HEAP32 = Module.HEAP32;
    var _h264bsdClip = Module._get_h264bsdClip();

    
    var MAX_STREAM_BUFFER_LENGTH = 1024 * 1024;
  
    // from old constructor
    Module._broadwayInit();
    
    /**
   * Creates a typed array from a HEAP8 pointer. 
   */
    function toU8Array(ptr, length) {
      return HEAPU8.subarray(ptr, ptr + length);
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
    this.decode = function decode(buffer, parInfo) {
      // console.info("Decoding: " + buffer.length);
      // collect infos
      if (parInfo){
        this.infoAr.push(parInfo);
        parInfo.startDecoding = nowValue();
      };
      
      this.streamBuffer.set(buffer);
      Module._broadwaySetStreamLength(buffer.length);
      Module._broadwayPlayStream();
    };


    
    function patchOptimizations(config, patches) { 
      var scope = getGlobalScope();
      for (var name in patches) {
        var patch = patches[name];
        if (patch) {
          var option = config[name];
          if (!option) option = "original";
          console.info(name + ": " + option);
          assert (option in patch.options);
          var fn = patch.options[option].fn;
          if (fn) {
            scope[patch.original] = Module.patch(null, patch.name, fn);
            console.info("Patching: " + patch.name + ", with: " + option);
          }
        }
      }
    };
    
    var patches = {
      "filter": {
        name: "_h264bsdFilterPicture",
        display: "Filter Picture",
        original: "Original_h264bsdFilterPicture",
        options: {
          none: {display: "None", fn: function () {}},
          original: {display: "Original", fn: null},
        }
      },
      "filterHorLuma": {
        name: "_FilterHorLuma",
        display: "Filter Hor Luma",
        original: "OriginalFilterHorLuma",
        options: {
          none: {display: "None", fn: function () {}},
          original: {display: "Original", fn: null},
          optimized: {display: "Optimized", fn: OptimizedFilterHorLuma}
        }
      },
      "filterVerLumaEdge": {
        name: "_FilterVerLumaEdge",
        display: "Filter Ver Luma Edge",
        original: "OriginalFilterVerLumaEdge",
        options: {
          none: {display: "None", fn: function () {}},
          original: {display: "Original", fn: null},
          optimized: {display: "Optimized", fn: OptimizedFilterVerLumaEdge}
        }
      },
      "getBoundaryStrengthsA": {
        name: "_GetBoundaryStrengthsA",
        display: "Get Boundary Strengths",
        original: "OriginalGetBoundaryStrengthsA",
        options: {
          none: {display: "None", fn: function () {}},
          original: {display: "Original", fn: null},
          optimized: {display: "Optimized", fn: OptimizedGetBoundaryStrengthsA}
        }
      }
    };
    function getGlobalScope() {
      return function () { return this; }.call(null);
    };
    
    /* Optimizations */

    function clip(x, y, z) {
      return z < x ? x : (z > y ? y : z);
    }

    function OptimizedGetBoundaryStrengthsA($mb, $bS) {
      var $totalCoeff = $mb + 28;

      var tc0 = HEAP16[$totalCoeff + 0 >> 1];
      var tc1 = HEAP16[$totalCoeff + 2 >> 1];
      var tc2 = HEAP16[$totalCoeff + 4 >> 1];
      var tc3 = HEAP16[$totalCoeff + 6 >> 1];
      var tc4 = HEAP16[$totalCoeff + 8 >> 1];
      var tc5 = HEAP16[$totalCoeff + 10 >> 1];
      var tc6 = HEAP16[$totalCoeff + 12 >> 1];
      var tc7 = HEAP16[$totalCoeff + 14 >> 1];
      var tc8 = HEAP16[$totalCoeff + 16 >> 1];
      var tc9 = HEAP16[$totalCoeff + 18 >> 1];
      var tc10 = HEAP16[$totalCoeff + 20 >> 1];
      var tc11 = HEAP16[$totalCoeff + 22 >> 1];
      var tc12 = HEAP16[$totalCoeff + 24 >> 1];
      var tc13 = HEAP16[$totalCoeff + 26 >> 1];
      var tc14 = HEAP16[$totalCoeff + 28 >> 1];
      var tc15 = HEAP16[$totalCoeff + 30 >> 1];

      HEAP32[$bS + 32 >> 2] = tc2 || tc0 ? 2 : 0;
      HEAP32[$bS + 40 >> 2] = tc3 || tc1 ? 2 : 0;
      HEAP32[$bS + 48 >> 2] = tc6 || tc4 ? 2 : 0;
      HEAP32[$bS + 56 >> 2] = tc7 || tc5 ? 2 : 0;
      HEAP32[$bS + 64 >> 2] = tc8 || tc2 ? 2 : 0;
      HEAP32[$bS + 72 >> 2] = tc9 || tc3 ? 2 : 0;
      HEAP32[$bS + 80 >> 2] = tc12 || tc6 ? 2 : 0;
      HEAP32[$bS + 88 >> 2] = tc13 || tc7 ? 2 : 0;
      HEAP32[$bS + 96 >> 2] = tc10 || tc8 ? 2 : 0;
      HEAP32[$bS + 104 >> 2] = tc11 || tc9 ? 2 : 0;
      HEAP32[$bS + 112 >> 2] = tc14 || tc12 ? 2 : 0;
      HEAP32[$bS + 120 >> 2] = tc15 || tc13 ? 2 : 0;

      HEAP32[$bS + 12 >> 2] = tc1 || tc0 ? 2 : 0;
      HEAP32[$bS + 20 >> 2] = tc4 || tc1 ? 2 : 0;
      HEAP32[$bS + 28 >> 2] = tc5 || tc4 ? 2 : 0;
      HEAP32[$bS + 44 >> 2] = tc3 || tc2 ? 2 : 0;
      HEAP32[$bS + 52 >> 2] = tc6 || tc3 ? 2 : 0;
      HEAP32[$bS + 60 >> 2] = tc7 || tc6 ? 2 : 0;
      HEAP32[$bS + 76 >> 2] = tc9 || tc8 ? 2 : 0;
      HEAP32[$bS + 84 >> 2] = tc12 || tc9 ? 2 : 0;
      HEAP32[$bS + 92 >> 2] = tc13 || tc12 ? 2 : 0;
      HEAP32[$bS + 108 >> 2] = tc11 || tc10 ? 2 : 0;
      HEAP32[$bS + 116 >> 2] = tc14 || tc11 ? 2 : 0;
      HEAP32[$bS + 124 >> 2] = tc15 || tc14 ? 2 : 0;
    }

    function OptimizedFilterVerLumaEdge ($data, bS, $thresholds, imageWidth) {
      var delta, tc, tmp;
      var p0, q0, p1, q1, p2, q2;
      var tmpFlag;
      var $clp = _h264bsdClip + 512;
      var alpha = HEAP32[$thresholds + 4 >> 2];
      var beta = HEAP32[$thresholds + 8 >> 2];
      var val;

      if (bS < 4) {
        tmp = tc = HEAPU8[HEAP32[$thresholds >> 2] + (bS - 1)] & 255;
        for (var i = 4; i > 0; i--) {
          p1 = HEAPU8[$data + -2] & 255;
          p0 = HEAPU8[$data + -1] & 255;
          q0 = HEAPU8[$data] & 255;
          q1 = HEAPU8[$data + 1] & 255;
          if ((Math.abs(p0 - q0) < alpha) && (Math.abs(p1 - p0) < beta) && (Math.abs(q1 - q0) < beta)) {
            p2 = HEAPU8[$data - 3] & 255;
            if (Math.abs(p2 - p0) < beta) {
              val = (p2 + ((p0 + q0 + 1) >> 1) - (p1 << 1)) >> 1;
              HEAP8[$data - 2] = p1 + clip(-tc, tc, val);
              tmp++;
            }

            q2 = HEAPU8[$data + 2] & 255;
            if (Math.abs(q2 - q0) < beta) {
              val = (q2 + ((p0 + q0 + 1) >> 1) - (q1 << 1)) >> 1;
              HEAP8[$data + 1] = (q1 + clip(-tc, tc, val));
              tmp++;
            }

            val = ((((q0 - p0) << 2) + (p1 - q1) + 4) >> 3);
            delta = clip(-tmp, tmp, val);

            p0 = HEAPU8[$clp + (p0 + delta)] & 255;
            q0 = HEAPU8[$clp + (q0 - delta)] & 255;
            tmp = tc;
            HEAP8[$data - 1] = p0;
            HEAP8[$data] = q0;

            $data += imageWidth;
          }
        }
      } else {
        OriginalFilterVerLumaEdge($data, bS, $thresholds, imageWidth);
      }
    }

    /**
 * Filter all four successive horizontal 4-pixel luma edges. This can be done when bS is equal to all four edges.
 */
    function OptimizedFilterHorLuma ($data, bS, $thresholds, imageWidth) {
      var delta, tc, tmp;
      var p0, q0, p1, q1, p2, q2;
      var tmpFlag;
      var $clp = _h264bsdClip + 512;
      var alpha = HEAP32[$thresholds + 4 >> 2];
      var beta = HEAP32[$thresholds + 8 >> 2];
      var val;

      if (bS < 4) {
        tmp = tc = HEAPU8[HEAP32[$thresholds >> 2] + (bS - 1)] & 255;
        for (var i = 16; i > 0; i--) {
          p1 = HEAPU8[$data + (-imageWidth << 1)] & 255;
          p0 = HEAPU8[$data + -imageWidth] & 255;
          q0 = HEAPU8[$data] & 255;
          q1 = HEAPU8[$data + imageWidth] & 255;

          if ((Math.abs(p0 - q0) < alpha) && (Math.abs(p1 - p0) < beta) && (Math.abs(q1 - q0) < beta)) {
            p2 = HEAPU8[$data + (-imageWidth * 3)] & 255;
            if (Math.abs(p2 - p0) < beta) {
              val = (p2 + ((p0 + q0 + 1) >> 1) - (p1 << 1)) >> 1;
              HEAP8[$data + (-imageWidth << 1)] = p1 + clip(-tc, tc, val);
              tmp++;
            }

            q2 = HEAPU8[$data + (imageWidth << 2)] & 255;
            if (Math.abs(q2 - q0) < beta) {
              val = (q2 + ((p0 + q0 + 1) >> 1) - (q1 << 1)) >> 1;
              HEAP8[$data + imageWidth] = (q1 + clip(-tc, tc, val));
              tmp++;
            }

            val = ((((q0 - p0) << 2) + (p1 - q1) + 4) >> 3);
            delta = clip(-tmp, tmp, val);

            p0 = HEAPU8[$clp + (p0 + delta)] & 255;
            q0 = HEAPU8[$clp + (q0 - delta)] & 255;
            tmp = tc;
            HEAP8[$data - imageWidth] = p0;
            HEAP8[$data] = q0;

            $data ++;
          }
        }
      } else {
        OriginalFilterHorLuma($data, bS, $thresholds, imageWidth);
      }
    }
  };

  
  Broadway.prototype = {
    configure: function (config) {
      // patchOptimizations(config, patches);
      console.info("Broadway Configured: " + JSON.stringify(config));
    }
    
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
    
    self.addEventListener('message', function(e) {
      
      if (isWorker){
        if (reuseMemory){
          if (e.data.reuse){
            memAr.push(e.data.reuse);
          };
        };
        if (e.data.buf){
          decoder.decode(new Uint8Array(e.data.buf, e.data.offset || 0, e.data.length), e.data.info);
        };
        
      }else{
        if (e.data && e.data.type === "Broadway.js - Worker init"){
          isWorker = true;
          decoder = new Broadway(e.data.options);
          
          if (e.data.options.reuseMemory){
            reuseMemory = true;
            decoder.onPictureDecoded = function (buffer, width, height, infos) {
              
              //var buf = getMem();

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
  
  Broadway.nowValue = nowValue;
  
  return Broadway;
  
  })();
  
  
}));

