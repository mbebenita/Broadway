Module['FS'] = FS;
FS['createDataFile'] = FS.createDataFile;

// Replace main loop handler

__Z11runMainLoopv = function() {
  window.addEventListener("message", function() {
    window.postMessage(0, "*")
    __Z17mainLoopIterationv();
  }, false);
  window.postMessage(0, "*")
}

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
  if (diff > 500) {
    var fps = frameCounter * 1000 / diff;
    var fpsSinceStart = totalFrameCounter * 1000 / (now - totalFrameTime);
    var elapsed = (now - totalFrameTime) / 1000;
    frameTime = now;
    frameCounter = 0;
    updateStats(fps, fpsSinceStart, elapsed);
  }
}

function _paint($luma, $cb, $cr, h, w) {
  for ( var y1, y2, u, v, ruv, guv, buv, j, w_2 = w >> 1, W = w * 4, surface = SDL.surfaces[SDL.screen], d = surface.image.data, r = 0; h -= 2;) {
    for (j = w_2; j--;) {
      u = HEAPU8[$cr++];
      v = HEAPU8[$cb++];
      ruv = 409 * u - 56992;
      guv = 34784 - 208 * u - 100 * v;
      buv = 516 * v - 70688;

      y2 = HEAPU8[$luma + w] * 298;
      y1 = HEAPU8[$luma++] * 298;
      d[r + W] = y2 + ruv >> 8;
      d[r++] = y1 + ruv >> 8;
      d[r + W] = y2 + guv >> 8;
      d[r++] = y1 + guv >> 8;
      d[r + W] = y2 + buv >> 8;
      d[r++] = y1 + buv >> 8;
      r++;

      y2 = HEAPU8[$luma + w] * 298;
      y1 = HEAPU8[$luma++] * 298;
      d[r + W] = y2 + ruv >> 8;
      d[r++] = y1 + ruv >> 8;
      d[r + W] = y2 + guv >> 8;
      d[r++] = y1 + guv >> 8;
      d[r + W] = y2 + buv >> 8;
      d[r++] = y1 + buv >> 8;
      r++;
    }
    r += W;
    $luma += w;
  }
  surface.ctx.putImageData(surface.image, 0, 0);
}

_SDL_UnlockSurface = function() {

}