QUANTUM_SIZE = 4;

var advancedCCOptimizations = Module.CC_VARIABLE_MAP ? true : false;

if (advancedCCOptimizations) {
  console.info("Advanced CC Optimizations");
  HEAPU8 = Module.CC_VARIABLE_MAP["HEAP8"];
  HEAP16 = Module.CC_VARIABLE_MAP["HEAP16"];
  HEAP32 = Module.CC_VARIABLE_MAP["HEAP32"];
  _h264bsdClip = Module.CC_VARIABLE_MAP["_h264bsdClip"];
}

var options = {
  "clip": {
    display: "Clip",
    options: {
      mozilla: {value: "mozilla.264", display: "Mozilla"},
      mozilla_story: {value: "mozilla_story.264", display: "Mozilla Story"},
      admiral: {value: "admiral.264", display: "Admiral"},
      matrix: {value: "matrix.264", display: "Matrix"},
      matrix_large: {value: "matrix_large.264", display: "Matrix HD"},
    }
  },
  "mode": {
    display: "Mode",
    options: {
      none: {display: "None"},
      canvas: {display: "Canvas"},
      webgl: {display: "Canvas w/ WebGL"}
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

var Broadway = (function broadway() {
  function constructor(canvas) {
    this.stream = null;
    this.onLoad = function () {};
    this.onFrameDecoded = function () {};
    this.canvas = canvas;
    this.isConfigured = false;
    
    this.webGLCanvas;
    
    this.statistics = {
      videoStartTime: 0,
      videoFrameCounter: 0,
      windowStartTime: 0,
      windowFrameCounter: 0,
      fpsMin: 1000,
      fpsMax: -1000,
      webGLTextureUploadTime: 0
    }
  }
  
  function info(msg) {
    console.info(msg);
  }
  
  function webGLPaint($luma, $cb, $cr, width, height) {
    if (!this.webGLCanvas) {
      this.webGLCanvas = new YUVWebGLCanvas(Module.canvas, new Size(width, height));
    }
    var luma = Module.HEAPU8.subarray($luma);
    var cb = Module.HEAPU8.subarray($cb);
    var cr = Module.HEAPU8.subarray($cr);
    var start = Date.now();
    this.webGLCanvas.YTexture.fill(luma);
    this.webGLCanvas.UTexture.fill(cb);
    this.webGLCanvas.VTexture.fill(cr);
    this.webGLCanvas.drawScene();
    this.statistics.webGLTextureUploadTime += Date.now() - start;
  }
  
  function getGlobalScope() {
    return function () { return this; }.call(null);
  }
  
  function patchOptimizations(config, patches) { 
    var scope = getGlobalScope();
    for (var name in patches) {
      var patch = patches[name];
      var option = config[name];
      if (!option) option = "original";
      console.info(name + ": " + option);
      assert (option in patch.options);
      var fn = patch.options[option].fn;
      if (fn) {
        scope[patch.original] = Module.patch(null, patch.name, fn);
        console.log("Patching: " + patch.name + ", with: " + option);
      }
    }
  }
  
  function updateFrameStatistics() {
    var s = this.statistics;
    s.videoFrameCounter += 1;
    s.windowFrameCounter += 1;
    var now = Date.now();
    if (!s.videoStartTime) {
      s.videoStartTime = now;
    }
    var videoElapsedTime = now - s.videoStartTime;
    s.elapsed = videoElapsedTime / 1000;
    if (videoElapsedTime < 1000) {
      return;
    }
    
    if (!s.windowStartTime) {
      s.windowStartTime = now;
      return;
    } else if ((now - s.windowStartTime) > 1000) {
      var windowElapsedTime = now - s.windowStartTime;
      var fps = (s.windowFrameCounter / windowElapsedTime) * 1000;
      s.windowStartTime = now;
      s.windowFrameCounter = 0;
      
      if (fps < s.fpsMin) s.fpsMin = fps;
      if (fps > s.fpsMax) s.fpsMax = fps;
      s.fps = fps;
    }
    
    var fps = (s.videoFrameCounter / videoElapsedTime) * 1000;
    s.fpsSinceStart = fps;
    return ;
  }
  
  constructor.prototype = {
    configure: function(config) {
      assert(!this.isConfigured);
      Module.FS.ignorePermissions = true;
      
      /* Configure Paint Mode */
      Module.canvas = this.canvas;
      if (config.mode == "none") {
        Module.paint = function() {};
      } else if (config.mode == "webgl") {
        assert (this.canvas);
        Module.paint = function () { 
          webGLPaint.apply(this, arguments);
        }.bind(this); 
      } else if (config.mode == "canvas") {
        assert (this.canvas);
        Module.ctx2D = this.canvas.getContext('2d');
        if (!Module.ctx2D) {
          alert('Canvas not available :(');
          return;
        }
      }
      
      Module.onFrameDecoded = function () {
        updateFrameStatistics.call(this);
        this.onFrameDecoded(this.statistics);
      }.bind(this);
      
      /* Configure Optimization Patches */
      patchOptimizations(config, patches);
      
      info("Broadway Configured: " + JSON.stringify(config));
      this.isConfigured = true;
    },
    load: function(url) {
      info("Broadway Loading: " + url);
      this.stream = new Stream(url);
      this.stream.readAll(null, function (buffer) {
        if (buffer) {
          var byteArray = new Uint8Array(buffer);
          var array = Array.prototype.slice.apply(byteArray);
          Module.FS.createDataFile('/', 'video.264', array, true, false);
          info("Broadway Loaded: " + url);
          Module.run(['video.264']);
          this.onLoad();
        } else {
          alert('Cannot load file: ');  
          return;
        }
      }.bind(this));
    },
    play: function() {
      Module.play();
    },
    stop: function() {
      Module.stop();
    }
  };
  return constructor;
})();



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
