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

// SDL hook

var frameCounter = 0, totalFrameCounter = 0;
var frameTime = 0, totalFrameTime = 0;

_SDL_Flip = function(surf) {
  frameCounter++;
  totalFrameCounter++;
  
  if (totalFrameCounter % 20 == 0) {
    updateScrubber();
  }
  
  if (frameTime == 0) {
    totalFrameTime = frameTime = Date.now();
    return;
  }
  var now = Date.now();
  var diff = now - frameTime;
  if (diff > 200) {
    var fps = frameCounter * 1000 / diff;
    var fpsSinceStart = totalFrameCounter * 1000 / (now - totalFrameTime);
    var elapsed = (now - totalFrameTime) / 1000;
    frameTime = now;
    frameCounter = 0;
    updateStats(fps, fpsSinceStart, elapsed);
  }
}

_SDL_UnlockSurface = function() {}
