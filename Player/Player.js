/*


usage:

p = new Player({
  useWorker: true | false | "auto" // defaults to "auto",
  workerFile: <defaults to "Decoder.js"> // give path to Decoder.js
  webgl: true | false | "auto" // defaults to "auto"
  targetScalable:  true | false // allow target display to be scalable, defaults to false
  size: {
            width: targetWidth,
            height: targetHeight
  }

});

// canvas property represents the canvas node
// put it somewhere in the dom
p.canvas;

p.webgl; // contains the used rendering mode. if you pass auto to webgl you can see what auto detection resulted in

// We can pass a Javascript timestamp if we have one.
// The infos
var infos = {timestamp:ts};
p.decode(<binary>, infos);  // infos is optional

*/

// universal module definition
(function(root, factory){
  if (typeof define === 'function' && define.amd){
    // AMD. Register as an anonymous module.
    define(['./Decoder', './YUVCanvas'], factory);
  }else if (typeof exports === 'object'){
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('./Decoder'), require('./YUVCanvas'));
  }else{
    // Browser globals (root is window)
    root.Player = factory(root.Decoder, root.YUVCanvas);
  }
}(this, function(Decoder, WebGLCanvas){
  'use strict';

  var nowValue = Decoder.nowValue;

  var Player = function(parOptions){
    var self = this;
    this._config = parOptions || {};

    this.render = true;
    if (this._config.render === false){
      this.render = false;
    }
    ;

    this.nowValue = nowValue;

    this._config.workerFile = this._config.workerFile || 'Decoder.js';
    if (this._config.preserveDrawingBuffer){
      this._config.contextOptions = this._config.contextOptions || {};
      this._config.contextOptions.preserveDrawingBuffer = true;
    }

    var webglOpt = this._config.webgl;
    var webgl = false;
    var haveWebgl = true;
    try {
      if (!window.WebGLRenderingContext){
        /* browser lacks WebGL */
        haveWebgl = false;
      }else{
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('webgl');
        /* internet explorer 11
         * cannot handle viewport setting to fix right black bar
         * || canvas.getContext("experimental-webgl") */
        if (!ctx){
          /* browser supports WebGL but initialization failed */
          haveWebgl = false;
        }
      }
    }
    catch(e) {
      haveWebgl = false;
    }
    if (haveWebgl && (webglOpt === 'auto' || webglOpt === true)) webgl = true;
    else if (!haveWebgl && webglOpt === false) webgl = false;
    else{
      /* announce inability to honor webgl request, and fall back */
      console.log('broadway WebGL unavailable');
      webgl = false;
    }
    this.webgl = webgl;

    // choose functions
    if (this.webgl){
      this.createCanvasObj = this.createCanvasWebGL;
      this.renderFrame = this.renderFrameWebGL;
    }
    else{
      this.createCanvasObj = this.createCanvasRGB;
      this.renderFrame = this.renderFrameRGB;
    }

    var lastWidth;
    var lastHeight;
    var onPictureDecoded = function(buffer, width, height, infosArray){

      self.onPictureDecoded(buffer, width, height, infosArray);

      var startTime = nowValue();
      var infos = {};
      if (infosArray && infosArray[0]) infos = infosArray[0];
      if (!buffer || !self.render){
        return;
      }

      infos.sourceWidth = this.sourceWidth || infos.sourceWidth || width;
      infos.sourceHeight = this.sourceHeight || infos.sourceHeight || height;
      infos.targetWidth = this.targetWidth || infos.targetWidth || width;
      infos.targetHeight = this.targetHeight || infos.targetHeight || height;
      infos.decodedWidth = this.decodedWidth || width;
      infos.decodedHeight = this.decodedHeight || height;
      infos.targetScalable = this.targetScalable;


      self.renderFrame({
        canvasObj: self.canvasObj,
        data: buffer,
        width: width,
        height: height,
        infos: infos
      });

      if (self.onRenderFrameComplete && typeof self.onRenderFrameComplete === 'function'){
        self.onRenderFrameComplete({
          data: buffer,
          width: width,
          height: height,
          infos: infos,
          canvasObj: self.canvasObj
        });
      }

    };

    // provide size
    if (!this._config.size) this._config.size = {};
    this._config.size.width = Math.round(this._config.size.width) || 200;
    this._config.size.height = Math.round(this._config.size.height) || 200;

    this.targetWidth = this._config.size.width;
    this.targetHeight = this._config.size.height;
    this.targetScalable = this._config.targetScalable || false;

    if (this._config.useWorker){
      var worker = new Worker(this._config.workerFile);
      this.worker = worker;
      worker.addEventListener('message', function(e){
        var data = e.data;
        if (data.consoleLog){
          console.log(data.consoleLog);
          return;
        }
        onPictureDecoded.call(self, new Uint8Array(data.buf, 0, data.length), data.width, data.height, data.infos);
      }, false);

      worker.postMessage({
        type: 'Broadway.js - Worker init', options: {
          rgb: !webgl,
          memsize: this.memsize,
          reuseMemory: this._config.reuseMemory?true:false
        }
      });

      if (this._config.transferMemory){
        this.decode = function(parData, parInfo){
          // no copy
          // instead we are transfering the ownership of the buffer
          // dangerous!!!
          worker.postMessage({
            buf: parData.buffer,
            offset: parData.byteOffset,
            length: parData.length,
            info: parInfo
          }, [parData.buffer]); // Send data to our worker.
        };

      }
      else{
        this.decode = function(parData, parInfo){
          // Copy the sample so that we only do a structured clone of the
          // region of interest
          var copyU8 = new Uint8Array(parData.length);
          copyU8.set(parData, 0, parData.length);
          worker.postMessage({buf: copyU8.buffer, offset: 0, length: parData.length, info: parInfo}, [copyU8.buffer]); // Send data to our worker.
        };
      }

      if (this._config.reuseMemory){
        this.recycleMemory = function(parArray){
          //this.beforeRecycle();
          worker.postMessage({reuse: parArray.buffer}, [parArray.buffer]); // Send data to our worker.
          //this.afterRecycle();
        };
      }
    }
    else{
      this.decoder = new Decoder({
        rgb: !webgl
      });
      this.decoder.onPictureDecoded = onPictureDecoded;

      this.decode = function(parData, parInfo){
        self.decoder.decode(parData, parInfo);
      };
    }


    if (this.render){
      this.canvasObj = this.createCanvasObj({
        contextOptions: this._config.contextOptions
      });
      this.canvas = this.canvasObj.canvas;
    }
    ;

    this.domNode = this.canvas;

    lastWidth = this._config.size.width;
    lastHeight = this._config.size.height;

  };

  Player.prototype = {

    /***
     * The video source can have slightly smaller dimensions than the encoded video stream.
     * If the user of Player knows them by out-of-band means, give them here.
     * @param object with width and height members
     */
    setSourceDimensions: function(p){
      this.sourceWidth = Math.round(p.width);
      this.sourceHeight = Math.round(p.height);
    },

    /***
     * Retrieve the dimensions of the video source
     * (which may be slightly smaller than the decoded dimensions)
     * @returns {{width: *, height: *}}
     */
    getSourceDimensions: function(){
      return {width: this.sourceWidth, height: this.sourceHeight};
    },

    /***
     * when the output is responsive
     * (when targetScalable is true)
     * it's possible for the desired size
     * of the target canvas to change.
     * call this to change it for subsequent frames.
     * these values are ignored when targetScalable is false.
     * @param object with width and height members
     */
    setTargetDimensions: function(p){
      this.targetWidth = Math.round(p.width);
      this.targetHeight = Math.round(p.height);
    },

    /***
     * Retrieve the dimensions of the canvas being drawn.
     * @returns {{width: *, height: *}}
     */
    getTargetDimensions: function(){
      return {width: this.targetWidth, height: this.targetHeight};
    },


    onPictureDecoded: function(buffer, width, height, infos){
    },

    // call when memory of decoded frames is not used anymore
    recycleMemory: function(buf){
    },
    /*beforeRecycle: function(){},
    afterRecycle: function(){},*/

    // for both functions options is:
    //
    //  width
    //  height
    //  enableScreenshot
    //
    // returns a object that has a property canvas which is a html5 canvas
    createCanvasWebGL: function(options){
      var canvasObj = this._createBasicCanvasObj(options);
      canvasObj.contextOptions = options.contextOptions;
      return canvasObj;
    },

    createCanvasRGB: function(options){
      var canvasObj = this._createBasicCanvasObj(options);
      return canvasObj;
    },

    // part that is the same for webGL and RGB
    _createBasicCanvasObj: function(options){
      options = options || {};

      var obj = {};
      var width = options.width;
      if (!width){
        width = this._config.size.width;
      }
      ;
      var height = options.height;
      if (!height){
        height = this._config.size.height;
      }
      ;
      obj.canvas = document.createElement('canvas');
      obj.canvas.width = width;
      obj.canvas.height = height;
      obj.canvas.style.backgroundColor = this._config.backgroundColor || '#0D0E1B';


      return obj;
    },

    // options:
    //
    // canvas
    // data
    renderFrameWebGL: function(options){

      var canvasObj = options.canvasObj;

      var decodedWidth = options.width || options.infos.decodedWidth;
      var decodedHeight = options.height || options.infos.decodedHeight;
      var newWidth = decodedWidth;
      var newHeight = decodedHeight;

      if (options.infos.targetScalable){
        /* when scaling decoded image to target area, adjust dimensions
         * to preserve decoded aspect ratio
         */
        newWidth = options.infos.targetWidth;
        newHeight = options.infos.targetHeight;
        var targetAspectRatio = newWidth / newHeight;
        var decodedAspectRatio = decodedWidth / decodedHeight;
        if (targetAspectRatio > decodedAspectRatio)
          newWidth = Math.round(newHeight * decodedAspectRatio);
        else
          newHeight = Math.round(newWidth / decodedAspectRatio);
      }
      if (!canvasObj.webGLCanvas || canvasObj.canvas.width !== newWidth || canvasObj.canvas.height !== newHeight){
        /* no canvas yet, or target canvas size changeed */
        canvasObj.canvas.width = newWidth;
        canvasObj.canvas.height = newHeight;
        canvasObj.webGLCanvas = new WebGLCanvas({
          canvas: canvasObj.canvas,
          contextOptions: canvasObj.contextOptions,
          width: newWidth,
          height: newHeight,
          infos: options.infos
        });
        if (this.onFrameSizeChange && typeof this.onFrameSizeChange === 'function'){
          this.onFrameSizeChange(options.infos);
        }
      }
      var ylen = decodedWidth * decodedHeight;
      var uvlen = (decodedWidth / 2) * (decodedHeight / 2);

      canvasObj.webGLCanvas.drawNextOutputPicture({
        yData: options.data.subarray(0, ylen),
        yRowCnt: decodedHeight,
        yDataPerRow: decodedWidth,
        uData: options.data.subarray(ylen, ylen + uvlen),
        uRowCnt: decodedHeight / 2,
        uDataPerRow: decodedWidth / 2,
        vData: options.data.subarray(ylen + uvlen, ylen + uvlen + uvlen),
        vRowCnt: decodedHeight / 2,
        vDataPerRow: decodedWidth / 2,
        infos: options.infos
      });

      var self = this;
      self.recycleMemory(options.data);

    },
    renderFrameRGB: function(options){

      var canvasObj = options.canvasObj;

      var decodedWidth = options.width || options.infos.decodedWidth;
      var decodedHeight = options.height || options.infos.decodedHeight;
      var newWidth = decodedWidth;
      var newHeight = decodedHeight;
      var sourceWidth = options.infos.sourceWidth;
      var sourceHeight = options.infos.sourceHeight;
      var canvasWidth = canvasObj.canvas.width;
      var canvasHeight = canvasObj.canvas.height;
      var targetScalable = options.infos.targetScalable;
      if (targetScalable){
        /* when scaling decoded image to target area, adjust dimensions
         * to preserve decoded aspect ratio
         */
        newWidth = options.infos.targetWidth;
        newHeight = options.infos.targetHeight;
        var targetAspectRatio = newWidth / newHeight;
        var decodedAspectRatio = decodedWidth / decodedHeight;
        if (targetAspectRatio > decodedAspectRatio)
          newWidth = Math.trunc(newHeight * decodedAspectRatio);
        else
          newHeight = Math.trunc(newWidth / decodedAspectRatio);
      }
      else if (sourceWidth !== decodedWidth || sourceHeight !== decodedHeight){
        newWidth = sourceWidth;
        newHeight = decodedHeight;
      }
      if (canvasWidth !== newWidth || canvasHeight !== newHeight){
        /* target canvas size changeed */
        options.infos.targetWidth = canvasWidth = canvasObj.canvas.width = newWidth;
        options.infos.targetHeight = canvasHeight = canvasObj.canvas.height = newHeight;
        if (this.onFrameSizeChange && typeof this.onFrameSizeChange === 'function'){
          this.onFrameSizeChange(options.infos);
        }
      }
      /* three rendering cases: identity, clip only, scale and clip */
      var renderIdentity =
        decodedWidth === canvasWidth && decodedWidth === sourceWidth &&
        decodedHeight === canvasHeight && decodedHeight === sourceHeight;
      var renderClip = (!targetScalable &&
        (decodedWidth !== sourceWidth) || decodedHeight !== sourceHeight) &&
        (decodedWidth === canvasWidth) && decodedHeight === canvasHeight;
      if (renderIdentity){
        /* fastest */
        if (!canvasObj.ctx){
          canvasObj.ctx = canvasObj.canvas.getContext('2d');
          canvasObj.imgData = canvasObj.ctx.createImageData(width, height);
        }
        canvasObj.imgData.data.set(options.data);
        canvasObj.ctx.putImageData(imgData, 0, 0);
      }
      else{
        var decodedCanvasObj = this.decodedCanvasObj;
        if (!decodedCanvasObj){
          decodedCanvasObj = this.decodedCanvasObj = {};
          decodedCanvasObj.canvas = document.createElement('canvas');
        }
        if (decodedCanvasObj.canvas.width !== decodedWidth || decodedCanvasObj.canvas.height !== decodedHeight){
          decodedCanvasObj.canvas.width = decodedWidth;
          decodedCanvasObj.canvas.height = decodedHeight;
        }
        var decodedCtx = decodedCanvasObj.ctx;
        var decodedImgData = decodedCanvasObj.imgData;
        if (!decodedCtx){
          decodedCanvasObj.ctx = decodedCtx = decodedCanvasObj.canvas.getContext('2d');
          decodedCanvasObj.imgData = decodedImgData = decodedCtx.createImageData(decodedWidth, decodedHeight);
        }
        var targetCtx = canvasObj.ctx;
        if (!targetCtx){
          canvasObj.ctx = targetCtx = canvasObj.canvas.getContext('2d');
        }

        decodedImgData.data.set(options.data);
        decodedCtx.putImageData(decodedImgData, 0, 0);

        if (renderClip){
          /* just trim black bars from right and bottom */
          targetCtx.putImageData(decodedCtx.getImageData(0, 0, sourceWidth, sourceHeight), 0, 0);
        }
        else{
          /* scale */
          var sw = sourceWidth;
          if (sw !== decodedWidth) sw -= 1;
          targetCtx.drawImage(decodedCanvasObj.canvas,
            0, 0, sw, sourceHeight,
            0, 0, canvasObj.canvas.width, canvasObj.canvas.height);
        }
      }
      var self = this;
      self.recycleMemory(options.data);
    }
  };
  /* polyfill for IE 11 */
  if (!Math.trunc){
    Math.trunc = function(v){
      v = +v;
      if (!isFinite(v)) return v;
      return (v - v % 1) || (v < 0?-0:v === 0?v:0);
    };
  }

  return Player;

}));

