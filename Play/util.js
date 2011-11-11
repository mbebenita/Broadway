'use strict';

var ERRORS = 0, WARNINGS = 1, TODOS = 5;
var verbosity = WARNINGS;

function dump(object) {
    var output = '{ ';
    for ( var property in object) {
        output += property + ': ' + object[property] + '; ';
    }
    output += '}';
    log(output);
}

function getProperties(object, verbose) {
    if (verbose) {
        var output = '{\n';
        for ( var property in object) {
            if (typeof (object[property]) != "function") {
                if (typeof (object[property]) == "number" && (property.toString().indexOf("word") >= 0)) {
                    output += "   " + property + ': ' + getNumberInfo(object[property]) + '\n';
                } else {
                    output += "   " + property + ': ' + object[property] + '\n';
                }
            }
        }
        return output + '}';
    } else {
        var output = '{ ';
        for ( var property in object) {
            if (typeof (object[property]) != "function") {
                output += property + ': ' + object[property] + ' ';
            }
        }
        return output + '}';
    }
}

function getPrettyEnumValue(object, value) {
    return getPropertyByValue(object, value) + " (" + value + ")";
}

function getPropertyByValue(object, value) {
    for ( var property in object) {
        if (object[property] == value) {
            return property;
        }
    }
    return null;
}

function log(message) {
    console.log(message);
}

function warn(message) {
    if (verbosity >= WARNINGS) {
        log('Warning: ' + message);
    }
}

function backtrace() {
    var stackStr;
    try {
        throw new Error();
    } catch (e) {
        stackStr = e.stack;
    }
    return stackStr.split('\n').slice(1).join('\n');
}

function notImplemented() {
    error("not implemented");
}

function unexpected() {
    error("unexpected");
}

function error(message) {
  console.error(message);
  console.trace();
}

function assert(condition, message) {
  if (!condition) {
    error(message);
  }
}

function assertFalse(condition, message) {
  if (condition) {
      error(message);
  }
}

function assertRange(value, min, max) {
    if (value < min || value > max) {
        error("Value " + value + " is out of range [" + min + "," + max + "]");
    }
}

function bytesToString(bytes) {
    var str = '';
    var length = bytes.length;
    for ( var n = 0; n < length; ++n) {
        str += String.fromCharCode(bytes[n]);
    }
    return str;
}

function stringToBytes(str) {
    var length = str.length;
    var bytes = new Uint8Array(length);
    for ( var n = 0; n < length; ++n) {
        bytes[n] = str.charCodeAt(n) & 0xFF;
    }
    return bytes;
}

//
// getPdf()
// Convenience function to perform binary Ajax GET
// Usage: getPdf('http://...', callback)
// getPdf({
// url:String ,
// [,progress:Function, error:Function]
// },
// callback)
//
function getFile(arg, callback) {
    var params = arg;
    if (typeof arg === 'string')
        params = {
            url : arg
        };

    var xhr = new XMLHttpRequest();
    xhr.open('GET', params.url);
    xhr.mozResponseType = xhr.responseType = 'arraybuffer';
    xhr.expected = (document.URL.indexOf('file:') === 0) ? 0 : 200;

    if ('progress' in params) {
        xhr.onprogrss = params.progress || undefined;
    }

    if ('error' in params) {
        xhr.onerror = params.error || undefined;
    }

    xhr.onreadystatechange = function getPdfOnreadystatechange() {
        if (xhr.readyState === 4 && xhr.status === xhr.expected) {
            var data = (xhr.mozResponseArrayBuffer || xhr.mozResponse
                    || xhr.responseArrayBuffer || xhr.response);
            callback(data);
        }
    };
    xhr.send(null);
}

function getBinaryDigits(x, digits, withLeadingZeros) {
    var t = "";
    var z = withLeadingZeros ? 0 : countLeadingZeros32(x);
    for (var i = digits - z - 1; i >= 0; i--) {
        t += x & (1 << i) ? "1" : "0";
    }
    return t;
}


function padLeft(str, char, num) {
    var pad = "";
    for ( var i = 0; i < num - str.length; i++) {
        pad += char;
    }
    return pad + str;
}

function getNumberInfo(x) {
    return "0x" + getHexBytes(x, 8) + 
           ", 0b" + getBinaryDigits(x, 16, true) + " (" + countLeadingZeros16(x) + ")" +
           ", 0b" + getBinaryDigits(x, 32, true) + " (" + countLeadingZeros32(x) + ") " + 
           x.toString(); 
}

function getHexBytes(number, length) {
    if (number < 0) {
        var u = 0xFFFFFFFF + number + 1;
        var hex = u.toString(16).toUpperCase();
        return padLeft(hex, "0", length);
    }
    return padLeft(number.toString(16).toUpperCase(), "0", length);
}

function printArrayBuffer(buffer) {
    printArray(new Uint8Array(buffer));
}

function printArray(uint8View) {
    var group = 64;
    var subGroup = 4;
    print("Size: " + uint8View.length + " (" + (uint8View.length * 8) + ")" + ", Buffer: ");
    for ( var i = 0; i < uint8View.length; i++) {
        if (i % group == 0) {
            print("\n");
            print(getHexBytes(i, 4) + ": ");
        } else if (i % subGroup == 0) {
            print(" ");
        }
        print(getHexBytes(uint8View[i], 2));
    }
    print("\n");
}

function traceln(s) {
    println(s);
}

function isPowerOfTwo(x) {
  return (x & (x - 1)) == 0;
}

/**
 * Rounds up to the next highest power of two.
 */
function nextHighestPowerOfTwo(x) {
  --x;
  for (var i = 1; i < 32; i <<= 1) {
      x = x | x >> i;
  }
  return x + 1;
}

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
    getNextHighestPowerOfTwo: function() {
      return new Size(nextHighestPowerOfTwo(this.w), 
                      nextHighestPowerOfTwo(this.h));
    }
  }
  return constructor;
})();

/**
 * Creates a new prototype object derived from another objects prototype along with a list of additional properties.
 *
 * @param base object whose prototype to use as the created prototype object's prototype
 * @param properties additional properties to add to the created prototype object
 */
function inherit(base, properties) {
  var prot = Object.create(base.prototype);
  for (var p in properties) {
    prot[p] = properties[p];
  }
  return prot;
}