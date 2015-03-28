/*


usage:

p = new Player({
  useWorker: <bool>,
  workerFile: <defaults to "Decoder.js"> // give path to Decoder.js
});

// canvas property represents the canvas node
// put it somewhere in the dom
p.canvas;

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
      
      worker.postMessage("Broadway.js - Worker init");
      
      
      this.decode = function(parData){
        // Copy the sample so that we only do a structured clone of the
        // region of interest
        var copyU8 = new Uint8Array(parData.length);
        copyU8.set( parData, 0, parData.length );
        worker.postMessage(copyU8.buffer, [copyU8.buffer]); // Send data to our worker.
      };
      
    }else{
      
      this.decoder = new Decoder();
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

