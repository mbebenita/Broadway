Module['FS'] = FS;
Module['HEAPU8'] = HEAPU8;
Module['CorrectionsMonitor'] = CorrectionsMonitor; 

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

Module['onFrameDecoded'] = function () { }

_broadwayOnFrameDecoded = function() {
  Module['onFrameDecoded']();
}

Module['setPosition'] = _broadwaySetPosition; 
Module['getPosition'] = _broadwayGetPosition;

Module['filter'] = Module['defaultFilter'] = _h264bsdFilterPicture;

_h264bsdFilterPicture = function (a, b) {
  Module['filter'](a, b);
}

