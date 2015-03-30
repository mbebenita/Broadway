/*


usage:

p = new Player({
  useWorker: <bool>,
  workerFile: <defaults to "Decoder.js"> // give path to Decoder.js
  webgl: true | false | "auto" // defaults to "auto"
});

// canvas property represents the canvas node
// put it somewhere in the dom
p.canvas;

p.webgl; // contains the used rendering mode. if you pass auto to webgl you can see what auto detection resulted in

p.decode(<binary>);


*/



// universal module definition
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["./Decoder", "./YUVWebGLCanvas"], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("./Decoder"), require("./YUVWebGLCanvas"));
    } else {
        // Browser globals (root is window)
        root.Player = factory(root.Decoder, root.YUVWebGLCanvas);
    }
}(this, function (Decoder, YUVWebGLCanvas) {
  "use strict";
  
  
  /**
 * Represents a 2-dimensional size value. 
 */
  var Size = (function size() {
    function constructor(w, h) {
      this.w = w;
      this.h = h;
    }
    constructor.prototype = {
      toString: function () {
        return "(" + this.w + ", " + this.h + ")";
      },
      getHalfSize: function() {
        return new Size(this.w >>> 1, this.h >>> 1);
      },
      length: function() {
        return this.w * this.h;
      }
    };
    return constructor;
  })();

  
  
  var Player = function(parOptions){
    var self = this;
    this._config = parOptions || {};
    
    this.render = true;
    
    this._config.workerFile = this._config.workerFile || "Decoder.js";
    
    var webgl = "auto";
    if (this._config.webgl === true){
      webgl = true;
    }else if (this._config.webgl === false){
      webgl = false;
    };
    
    if (webgl == "auto"){
      webgl = true;
      try{
        if (!window.WebGLRenderingContext) {
          // the browser doesn't even know what WebGL is
          webgl = false;
        } else {
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext("webgl");
          if (!ctx) {
            // browser supports WebGL but initialization failed.
            webgl = false;
          };
        };
      }catch(e){
        webgl = false;
      };
    };
    
    this.webgl = webgl;
    
    
    var lastWidth;
    var lastHeight;
    var onPictureDecoded = function(buffer, width, height) {
      self.onPictureDecoded(buffer, width, height);
      
      if (!buffer || !self.render) {
        return;
      };
      
      if (lastWidth !== width || lastHeight !== height || !self.webGLCanvas){
        self.canvas.width = width;
        self.canvas.height = height;
        lastWidth = width;
        lastHeight = height;
        self._size = new Size(width, height);
        self.webGLCanvas = new YUVWebGLCanvas(self.canvas, self._size);
      };
      
      var lumaSize = width * height;
      var chromaSize = lumaSize >> 2;
      
      self.webGLCanvas.YTexture.fill(buffer.subarray(0, lumaSize));
      self.webGLCanvas.UTexture.fill(buffer.subarray(lumaSize, lumaSize + chromaSize));
      self.webGLCanvas.VTexture.fill(buffer.subarray(lumaSize + chromaSize, lumaSize + 2 * chromaSize));
      self.webGLCanvas.drawScene();
    };
    
    if (!webgl){
      
      onPictureDecoded = function(buffer, width, height){
        self.onPictureDecoded(buffer, width, height);
        
        if (!buffer || !self.render) {
          return;
        };


        var createImgData = false;
        var canvas = self.canvas;
        var ctx = self.ctx;
        var imgData = self.imgData;

        if (!ctx){
          self.ctx = canvas.getContext('2d');
          ctx = self.ctx;

          self.imgData = ctx.createImageData(width, height);
          imgData = self.imgData;
        };

        imgData.data.set(buffer);
        ctx.putImageData(imgData, 0, 0);

      };
      
    };
    
    if (this._config.useWorker){
      var worker = new Worker(this._config.workerFile);
      this.worker = worker;
      worker.addEventListener('message', function(e) {
        var data = e.data;
        if (data.consoleLog){
          console.log(data.consoleLog);
          return;
        };
        if (data.width){
          worker.lastDim = data;
          return;
        };
        onPictureDecoded.call(self, new Uint8Array(data), worker.lastDim.width, worker.lastDim.height);
      }, false);
      
      worker.postMessage({type: "Broadway.js - Worker init", options: {
        rgb: !webgl
      }});
      
      
      this.decode = function(parData){
        // Copy the sample so that we only do a structured clone of the
        // region of interest
        var copyU8 = new Uint8Array(parData.length);
        copyU8.set( parData, 0, parData.length );
        worker.postMessage(copyU8.buffer, [copyU8.buffer]); // Send data to our worker.
      };
      
    }else{
      
      this.decoder = new Decoder({
        rgb: !webgl
      });
      this.decoder.onPictureDecoded = onPictureDecoded;

      this.decode = function(parData){
        self.decoder.decode(parData);
      };
      
    };
    
    
    if (!this._config.size){
      this._config.size = {};
    };
    this._config.size.width = this._config.size.width || 200;
    this._config.size.height = this._config.size.height || 200;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this._config.size.width;
    this.canvas.height = this._config.size.height;
    this.canvas.style.backgroundColor = "#333333";

    this.domNode = this.canvas;
    
    this._size = new Size(this._config.size.width, this._config.size.height);
    lastWidth = this._config.size.width;
    lastHeight = this._config.size.height;
    
  };
  
  Player.prototype = {
    
    onPictureDecoded: function(buffer, width, height){}
    
  };
  
  return Player;
  
}));

