Module['FS'] = FS;
FS['createDataFile'] = FS.createDataFile;

// Replace main loop handler

var breakLoop = false;
_runMainLoop = function() {
  window.addEventListener("message", function() {
    _mainLoopIteration();
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
