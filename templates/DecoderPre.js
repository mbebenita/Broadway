// universal module definition
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Decoder = factory();
    }
}(this, function () {
  
  var global;
  
  function initglobal(){
    global = this;
    if (!global){
      if (typeof window != "undefined"){
        global = window;
      }else if (typeof self != "undefined"){
        global = self;
      };
    };
  };
  initglobal();
  
  
  function error(message) {
    console.error(message);
    console.trace();
  };

  
  function assert(condition, message) {
    if (!condition) {
      error(message);
    };
  };
  
  
  return (function(){
    "use strict";



  
  var getModule = function(_broadwayOnHeadersDecoded, _broadwayOnPictureDecoded){
    
    var window = this;
    //console.log(typeof window);
    
    window._broadwayOnHeadersDecoded = _broadwayOnHeadersDecoded;
    window._broadwayOnPictureDecoded = _broadwayOnPictureDecoded;
    
    var Module = {
      'print': function(text) { console.log('stdout: ' + text); },
      'printErr': function(text) { console.log('stderr: ' + text); }
    };
    
    
    /*
    
      The reason why this is all packed into one file is that this file can also function as worker.
      you can integrate the file into your build system and provide the original file to be loaded into a worker.
    
    */
    
