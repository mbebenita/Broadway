Module['FS'] = FS;
FS['createDataFile'] = FS.createDataFile;

// Replace main loop handler

var breakLoop = false;
__Z11runMainLoopv = function() {
  window.addEventListener("message", function() {
    __Z17mainLoopIterationv();
    if (!breakLoop) {
      window.postMessage(0, "*")
    }
  }, false);
}

Module['play'] = function() {
  breakLoop = false;
  window.postMessage(0, "*")
};

Module['stop'] = function() {
  breakLoop = true;
};

_SDL_Flip = function(surf) {
  onFrameDecoded();  
}

_SDL_UnlockSurface = function() {}
