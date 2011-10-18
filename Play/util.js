'use strict';

var ERRORS = 0, WARNINGS = 1, TODOS = 5;
var verbosity = WARNINGS;

function dump(object) {
	var output = '{ ';
	for (var property in object) {
		output += property + ': ' + object[property] + '; ';
	}
	output += '}';
	log(output);
}

function getProperties(object, verbose) {
    if (verbose) {
        var output = '{\n';
        for (var property in object) {
            if (typeof (object[property]) != "function") {
                output += "   " + property + ': ' + object[property] + '\n';
            }
        }
        return output + '}';
    } else {
    	var output = '{ ';
    	for (var property in object) {
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
	for (var property in object) {
		if (object[property] == value) {
			return property;
		}
	}
	return null;
	// error("Object: " + object + ", does not contain a property with value: " + value);
}


function log(msg) {
	print(msg);
}

function warn(msg) {
    if (verbosity >= WARNINGS) {
        log('Warning: ' + msg);
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

function unexpected() {
	error("unexpected");
}

function error(msg) {
    log(backtrace());
    throw new Error(msg);
}

function todo(msg) {
    if (verbosity >= TODOS) {
        log('TODO: ' + msg);
    }
}

function assert(cond, msg) {
    if (!cond) {
        error(msg);
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
            var data = (xhr.mozResponseArrayBuffer || xhr.mozResponse || xhr.responseArrayBuffer || xhr.response);
            callback(data);
        }
    };
    xhr.send(null);
}


function padLeft(str, char, num) {
	var pad = "";
	for (var i = 0; i < num - str.length; i++) {
		pad += char;
	}
	return pad + str;
}

function getHexBytes(number, length) {
	return padLeft(number.toString(16).toUpperCase(), "0", length);
}

function printArrayBuffer(buffer) {
	printArray(new Uint8Array(buffer));
}

function printArray(uint8View) {
	var group = 64;
	var subGroup = 4;
	print ("Size: " + uint8View.length + ", Buffer: ");
	for (var i = 0; i < uint8View.length; i++) {
		if (i % group == 0) {
			print ("\n");
			print (getHexBytes(i, 4) + ": ");
		} else if (i % subGroup == 0) {
			print (" ");
		}
		print (getHexBytes(uint8View[i], 2));
	}
	print ("\n");
}
