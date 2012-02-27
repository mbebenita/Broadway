if (FS) {
  Module['FS'] = FS;
}
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

// Module['setPosition'] = _broadwaySetPosition; 
// Module['getPosition'] = _broadwayGetPosition;

Module['createStreamBuffer'] = _broadwayCreateStreamBuffer;

var patches = Module['patches'] = {};

function getGlobalScope() {
  return function () { return this; }.call(null);
}

assert = function (condition, message) {
  if (!condition) {
    throw "Assertion: " + message;
  }
}

/**
 * Patches a function and remembers its old value.
 */
Module['patch'] = function (scope, name, value) {
  assert (typeof(value) == "function");
  if (!scope) {
    scope = getGlobalScope();
  }
  if (Module["CC_VARIABLE_MAP"]) {
    name = Module["CC_VARIABLE_MAP"][name]; 
  }
  assert (name in scope && (typeof(scope[name]) === "function" || typeof(scope[name]) === "undefined"), "Can only patch functions.");
  patches[name] = scope[name];
  scope[name] = value;
  return patches[name];
};

/**
 * Restore a previously patched function. 
 */
Module['unpatch'] = function (scope, name) {
  if (!scope) {
    scope = getGlobalScope();
  }
  if (Module["CC_VARIABLE_MAP"]) {
    name = Module["CC_VARIABLE_MAP"][name]; 
  }
  assert (name in scope && typeof(scope[name]) == "function");
  if (name in patches) {
    scope[name] = patches[name];
  }
};


/* Optimizations */

_abs = Math.abs;
_clip = function clip(x, y, z) {
  return z < x ? x : (z > y ? y : z);
};