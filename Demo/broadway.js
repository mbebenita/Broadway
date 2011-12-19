var arguments_ = [], ENVIRONMENT_IS_NODE = typeof process === "object", ENVIRONMENT_IS_WEB = typeof window === "object", ENVIRONMENT_IS_WORKER = typeof importScripts === "function", ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if(ENVIRONMENT_IS_NODE) {
  print = function(a) {
    process.stdout.write(a + "\n")
  };
  printErr = function(a) {
    process.stderr.write(a + "\n")
  };
  var nodeFS = require("fs");
  read = function(a) {
    var b = nodeFS.readFileSync(a).toString();
    !b && a[0] != "/" && (a = __dirname.split("/").slice(0, -1).join("/") + "/src/" + a, b = nodeFS.readFileSync(a).toString());
    return b
  };
  arguments_ = process.argv.slice(2)
}else {
  if(ENVIRONMENT_IS_SHELL) {
    this.read || (read = function(a) {
      snarf(a)
    }), arguments_ = this.arguments ? arguments : scriptArgs
  }else {
    if(ENVIRONMENT_IS_WEB) {
      printErr = function(a) {
        console.log(a)
      }, read = function(a) {
        var b = new XMLHttpRequest;
        b.open("GET", a, false);
        b.send(null);
        return b.responseText
      }, this.arguments && (arguments_ = arguments)
    }else {
      if(ENVIRONMENT_IS_WORKER) {
        load = importScripts
      }else {
        throw"Unknown runtime environment. Where are we?";
      }
    }
  }
}
function globalEval(a) {
  eval.call(null, a)
}
typeof load == "undefined" && typeof read != "undefined" && (load = function(a) {
  globalEval(read(a))
});
typeof printErr === "undefined" && (printErr = function() {
});
typeof print === "undefined" && (print = printErr);
try {
  this.Module = Module
}catch(e$$5) {
  this.Module = Module = {}
}
if(!Module.arguments) {
  Module.arguments = arguments_
}
var Runtime = {stackSave:function() {
  return STACKTOP
}, stackRestore:function(a) {
  STACKTOP = a
}, forceAlign:function(a, b) {
  b = b || 4;
  return isNumber(a) && isNumber(b) ? Math.ceil(a / b) * b : "Math.ceil((" + a + ")/" + b + ")*" + b
}, isNumberType:function(a) {
  return a in Runtime.INT_TYPES || a in Runtime.FLOAT_TYPES
}, isPointerType:function(a) {
  return a[a.length - 1] == "*"
}, isStructType:function(a) {
  return isPointerType(a) ? false : /^\[\d+\ x\ (.*)\]/.test(a) ? true : /<?{ [^}]* }>?/.test(a) ? true : a[0] == "%"
}, INT_TYPES:{i1:0, i8:0, i16:0, i32:0, i64:0}, FLOAT_TYPES:{"float":0, "double":0}, or64:function(a, b) {
  var d = a | 0 | b | 0, c = (Math.round(a / 4294967296) | Math.round(b / 4294967296)) * 4294967296;
  return d + c
}, and64:function(a, b) {
  var d = (a | 0) & (b | 0), c = (Math.round(a / 4294967296) & Math.round(b / 4294967296)) * 4294967296;
  return d + c
}, xor64:function(a, b) {
  var d = (a | 0) ^ (b | 0), c = (Math.round(a / 4294967296) ^ Math.round(b / 4294967296)) * 4294967296;
  return d + c
}, getNativeTypeSize:function(a) {
  if(Runtime.QUANTUM_SIZE == 1) {
    return 1
  }
  var b = {"%i1":1, "%i8":1, "%i16":2, "%i32":4, "%i64":8, "%float":4, "%double":8}["%" + a];
  if(!b && a[a.length - 1] == "*") {
    b = Runtime.QUANTUM_SIZE
  }
  return b
}, getNativeFieldSize:function(a) {
  return Math.max(Runtime.getNativeTypeSize(a), Runtime.QUANTUM_SIZE)
}, dedup:function(a, b) {
  var d = {};
  return b ? a.filter(function(a) {
    return d[a[b]] ? false : d[a[b]] = true
  }) : a.filter(function(a) {
    return d[a] ? false : d[a] = true
  })
}, set:function() {
  for(var a = typeof arguments[0] === "object" ? arguments[0] : arguments, b = {}, d = 0;d < a.length;d++) {
    b[a[d]] = 0
  }
  return b
}, calculateStructAlignment:function(a) {
  a.flatSize = 0;
  a.alignSize = 0;
  var b = [], d = -1;
  a.flatIndexes = a.fields.map(function(c) {
    var e;
    if(Runtime.isNumberType(c) || Runtime.isPointerType(c)) {
      c = e = Runtime.getNativeTypeSize(c)
    }else {
      if(Runtime.isStructType(c)) {
        e = Types.types[c].flatSize, c = Types.types[c].alignSize
      }else {
        throw"Unclear type in struct: " + c + ", in " + a.name_ + " :: " + dump(Types.types[a.name_]);
      }
    }
    c = a.packed ? 1 : Math.min(c, Runtime.QUANTUM_SIZE);
    a.alignSize = Math.max(a.alignSize, c);
    c = Runtime.alignMemory(a.flatSize, c);
    a.flatSize = c + e;
    d >= 0 && b.push(c - d);
    return d = c
  });
  a.flatSize = Runtime.alignMemory(a.flatSize, a.alignSize);
  if(b.length == 0) {
    a.flatFactor = a.flatSize
  }else {
    if(Runtime.dedup(b).length == 1) {
      a.flatFactor = b[0]
    }
  }
  a.needsFlattening = a.flatFactor != 1;
  return a.flatIndexes
}, generateStructInfo:function(a, b, d) {
  var c, e;
  if(b) {
    d = d || 0;
    c = (typeof Types === "undefined" ? Runtime.typeInfo : Types.types)[b];
    if(!c) {
      return null
    }
    a || (a = (typeof Types === "undefined" ? Runtime : Types).structMetadata[b.replace(/.*\./, "")]);
    if(!a) {
      return null
    }
    assert(c.fields.length === a.length, "Number of named fields must match the type for " + b + ". Perhaps due to inheritance, which is not supported yet?");
    e = c.flatIndexes
  }else {
    c = {fields:a.map(function(a) {
      return a[0]
    })}, e = Runtime.calculateStructAlignment(c)
  }
  var f = {__size__:c.flatSize};
  b ? a.forEach(function(a, b) {
    if(typeof a === "string") {
      f[a] = e[b] + d
    }else {
      var j, l;
      for(l in a) {
        j = l
      }
      f[j] = Runtime.generateStructInfo(a[j], c.fields[b], e[b])
    }
  }) : a.forEach(function(a, b) {
    f[a[1]] = e[b]
  });
  return f
}, stackAlloc:function(a) {
  var b = STACKTOP;
  STACKTOP += a;
  STACKTOP = Math.ceil(STACKTOP / 4) * 4;
  return b
}, staticAlloc:function(a) {
  var b = LAST_STATICTOP = STATICTOP;
  STATICTOP += a;
  STATICTOP = Math.ceil(STATICTOP / 4) * 4;
  STATICTOP >= TOTAL_MEMORY && enlargeMemory();
  return b
}, alignMemory:function(a, b) {
  return Math.ceil(a / (b ? b : 4)) * (b ? b : 4)
}, QUANTUM_SIZE:4, __dummy__:0}, CorrectionsMonitor = {MAX_ALLOWED:0, corrections:0, sigs:{}, note:function(a, b) {
  b || (this.corrections++, this.corrections >= this.MAX_ALLOWED && abort("\n\nToo many corrections!"))
}, print:function() {
  var a = [], b;
  for(b in this.sigs) {
    a.push({sig:b, fails:this.sigs[b][0], succeeds:this.sigs[b][1], total:this.sigs[b][0] + this.sigs[b][1]})
  }
  a.sort(function(a, b) {
    return b.total - a.total
  });
  for(b = 0;b < a.length;b++) {
    var d = a[b];
    print(d.sig + " : " + d.total + " hits, %" + Math.ceil(100 * d.fails / d.total) + " failures")
  }
}}, __globalConstructor__ = function() {
}, __THREW__ = false, __ATEXIT__ = [], ABORT = false, undef = 0, tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempI64, tempI64b, tempDoubleBuffer = new ArrayBuffer(8), tempDoubleI32 = new Int32Array(tempDoubleBuffer), tempDoubleF64 = new Float64Array(tempDoubleBuffer);
function abort(a) {
  print(a + ":\n" + Error().stack);
  ABORT = true;
  throw"Assertion: " + a;
}
function assert(a, b) {
  a || abort("Assertion failed: " + b)
}
function setValue(a, b, d) {
  d = d || "i8";
  d[d.length - 1] === "*" && (d = "i32");
  switch(d) {
    case "i1":
      HEAP8[a] = b;
      break;
    case "i8":
      HEAP8[a] = b;
      break;
    case "i16":
      HEAP16[a >> 1] = b;
      break;
    case "i32":
      HEAP32[a >> 2] = b;
      break;
    case "i64":
      HEAP32[a >> 2] = b[0];
      HEAP32[a + 4 >> 2] = b[1];
      break;
    case "float":
      HEAPF32[a >> 2] = b;
      break;
    case "double":
      tempDoubleF64[0] = b;
      HEAP32[a >> 2] = tempDoubleI32[0];
      HEAP32[a + 4 >> 2] = tempDoubleI32[1];
      break;
    default:
      abort("invalid type for setValue: " + d)
  }
}
Module.setValue = setValue;
function getValue(a, b) {
  b = b || "i8";
  b[b.length - 1] === "*" && (b = "i32");
  switch(b) {
    case "i1":
      return HEAP8[a];
    case "i8":
      return HEAP8[a];
    case "i16":
      return HEAP16[a >> 1];
    case "i32":
      return HEAP32[a >> 2];
    case "i64":
      return[HEAPU32[a >> 2], HEAPU32[a + 4 >> 2]];
    case "float":
      return HEAPF32[a >> 2];
    case "double":
      return tempDoubleI32[0] = HEAP32[a >> 2], tempDoubleI32[1] = HEAP32[a + 4 >> 2], tempDoubleF64[0];
    default:
      abort("invalid type for setValue: " + b)
  }
  return null
}
Module.getValue = getValue;
var ALLOC_NORMAL = 0, ALLOC_STACK = 1, ALLOC_STATIC = 2;
Module.ALLOC_NORMAL = ALLOC_NORMAL;
Module.ALLOC_STACK = ALLOC_STACK;
Module.ALLOC_STATIC = ALLOC_STATIC;
function allocate(a, b, d) {
  var c, e;
  typeof a === "number" ? (c = true, e = a) : (c = false, e = a.length);
  for(var d = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][d === void 0 ? ALLOC_STATIC : d](Math.max(e, 1)), f = typeof b === "string" ? b : null, g = 0, h;g < e;) {
    var j = c ? 0 : a[g];
    typeof j === "function" && (j = Runtime.getFunctionIndex(j));
    h = f || b[g];
    h === 0 ? g++ : (h == "i64" && (h = "i32"), setValue(d + g, j, h), g += Runtime.getNativeTypeSize(h))
  }
  return d
}
Module.allocate = allocate;
function Pointer_stringify(a) {
  for(var b = "", d = 0, c, e = String.fromCharCode(0);;) {
    c = String.fromCharCode(HEAPU8[a + d]);
    if(c == e) {
      break
    }
    b += c;
    d += 1
  }
  return b
}
Module.Pointer_stringify = Pointer_stringify;
function Array_stringify(a) {
  for(var b = "", d = 0;d < a.length;d++) {
    b += String.fromCharCode(a[d])
  }
  return b
}
Module.Array_stringify = Array_stringify;
var FUNCTION_TABLE, PAGE_SIZE = 4096;
function alignMemoryPage(a) {
  return Math.ceil(a / PAGE_SIZE) * PAGE_SIZE
}
var HEAP, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, STACK_ROOT, STACKTOP, STACK_MAX, STATICTOP, LAST_STATICTOP;
function enlargeMemory() {
  for(;TOTAL_MEMORY <= STATICTOP;) {
    TOTAL_MEMORY = alignMemoryPage(TOTAL_MEMORY * 1.25)
  }
  var a = HEAP8, b = new ArrayBuffer(TOTAL_MEMORY);
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAP8.set(a)
}
var TOTAL_MEMORY = Module.TOTAL_MEMORY || 52428800, FAST_MEMORY = Module.FAST_MEMORY || 12582912;
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)).subarray && !!(new Int32Array(1)).set, "Cannot fallback to non-typed array case: Code is too specialized");
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, "Typed arrays 2 must be run on a little-endian system");
for(var base = intArrayFromString("(null)"), i = 0;i < base.length;i++) {
  HEAP8[i] = base[i]
}
Module.HEAP = HEAP;
Module.HEAP8 = HEAP8;
Module.HEAP16 = HEAP16;
Module.HEAP32 = HEAP32;
Module.HEAPU8 = HEAPU8;
Module.HEAPU16 = HEAPU16;
Module.HEAPU32 = HEAPU32;
Module.HEAPF32 = HEAPF32;
STACK_ROOT = STACKTOP = alignMemoryPage(10);
var TOTAL_STACK = 1048576;
STACK_MAX = STACK_ROOT + TOTAL_STACK;
STATICTOP = alignMemoryPage(STACK_MAX);
function __shutdownRuntime__() {
  for(;__ATEXIT__.length > 0;) {
    var a = __ATEXIT__.pop(), b = a.func;
    typeof b === "number" && (b = FUNCTION_TABLE[b]);
    b(a.arg === void 0 ? null : a.arg)
  }
  CorrectionsMonitor.print()
}
function Array_copy(a, b) {
  return Array.prototype.slice.call(HEAP8.subarray(a, a + b))
}
Module.Array_copy = Array_copy;
function String_len(a) {
  for(var b = 0;HEAP8[a + b];) {
    b++
  }
  return b
}
Module.String_len = String_len;
function String_copy(a, b) {
  var d = String_len(a);
  b && d++;
  var c = Array_copy(a, d);
  b && (c[d - 1] = 0);
  return c
}
Module.String_copy = String_copy;
function intArrayFromString(a, b) {
  for(var d = [], c = 0;c < a.length;) {
    var e = a.charCodeAt(c);
    e > 255 && (e &= 255);
    d.push(e);
    c += 1
  }
  b || d.push(0);
  return d
}
Module.intArrayFromString = intArrayFromString;
function intArrayToString(a) {
  for(var b = [], d = 0;d < a.length;d++) {
    var c = a[d];
    c > 255 && (c &= 255);
    b.push(String.fromCharCode(c))
  }
  return b.join("")
}
Module.intArrayToString = intArrayToString;
function unSign(a, b) {
  return a >= 0 ? a : b <= 32 ? 2 * Math.abs(1 << b - 1) + a : Math.pow(2, b) + a
}
function reSign(a, b) {
  if(a <= 0) {
    return a
  }
  var d = b <= 32 ? Math.abs(1 << b - 1) : Math.pow(2, b - 1);
  if(a >= d && (b <= 32 || a > d)) {
    a = -2 * d + a
  }
  return a
}
function _h264bsdProcessBlock(a, b, d, c) {
  var e, f, g, h, j;
  e = HEAPU8[_qpDiv6 + b];
  g = HEAP32[_levelScale + HEAPU8[_qpMod6 + b] * 12 >> 2] << e;
  h = HEAP32[_levelScale + HEAPU8[_qpMod6 + b] * 12 + 4 >> 2] << e;
  b = HEAP32[_levelScale + HEAPU8[_qpMod6 + b] * 12 + 8 >> 2] << e;
  (d != 0 ? 2 : 1) == 1 && (HEAP32[a >> 2] *= g);
  e = (c & 65436) != 0 ? 3 : 13;
  a:do {
    if(e == 3) {
      c = HEAP32[a + 4 >> 2];
      e = HEAP32[a + 56 >> 2];
      j = HEAP32[a + 60 >> 2];
      HEAP32[a + 4 >> 2] = h * c;
      HEAP32[a + 56 >> 2] = h * e;
      HEAP32[a + 60 >> 2] = b * j;
      c = HEAP32[a + 8 >> 2];
      e = HEAP32[a + 20 >> 2];
      j = HEAP32[a + 16 >> 2];
      HEAP32[a + 16 >> 2] = h * c;
      HEAP32[a + 8 >> 2] = g * e;
      HEAP32[a + 20 >> 2] = b * j;
      c = HEAP32[a + 32 >> 2];
      e = HEAP32[a + 12 >> 2];
      j = HEAP32[a + 24 >> 2];
      d = h * c;
      HEAP32[a + 32 >> 2] = g * e;
      HEAP32[a + 12 >> 2] = h * j;
      c = HEAP32[a + 28 >> 2];
      e = HEAP32[a + 48 >> 2];
      j = HEAP32[a + 36 >> 2];
      HEAP32[a + 24 >> 2] = h * c;
      HEAP32[a + 28 >> 2] = b * e;
      HEAP32[a + 48 >> 2] = h * j;
      HEAP32[a + 36 >> 2] = d;
      c = HEAP32[a + 40 >> 2];
      e = HEAP32[a + 44 >> 2];
      j = HEAP32[a + 52 >> 2];
      HEAP32[a + 52 >> 2] = b * c;
      HEAP32[a + 40 >> 2] = g * e;
      HEAP32[a + 44 >> 2] = h * j;
      e = a;
      c = 3;
      b:for(;;) {
        if(d = HEAP32[e + 8 >> 2] + HEAP32[e >> 2], g = HEAP32[e >> 2] - HEAP32[e + 8 >> 2], h = (HEAP32[e + 4 >> 2] >> 1) - HEAP32[e + 12 >> 2], b = (HEAP32[e + 12 >> 2] >> 1) + HEAP32[e + 4 >> 2], HEAP32[e >> 2] = b + d, HEAP32[e + 4 >> 2] = h + g, HEAP32[e + 8 >> 2] = g - h, HEAP32[e + 12 >> 2] = d - b, e += 16, g = c, c = g - 1, g == 0) {
          break b
        }
      }
      g = 4;
      b:for(;;) {
        c = g - 1;
        if(g == 0) {
          e = 22;
          break a
        }
        d = HEAP32[a + 32 >> 2] + HEAP32[a >> 2];
        g = HEAP32[a >> 2] - HEAP32[a + 32 >> 2];
        h = (HEAP32[a + 16 >> 2] >> 1) - HEAP32[a + 48 >> 2];
        b = (HEAP32[a + 48 >> 2] >> 1) + HEAP32[a + 16 >> 2];
        HEAP32[a >> 2] = b + (d + 32) >> 6;
        HEAP32[a + 16 >> 2] = h + (g + 32) >> 6;
        HEAP32[a + 32 >> 2] = g + 32 + -h >> 6;
        HEAP32[a + 48 >> 2] = d + 32 + -b >> 6;
        if(HEAP32[a >> 2] + 512 > 1023) {
          break b
        }
        if(HEAP32[a + 16 >> 2] + 512 > 1023) {
          break b
        }
        if(HEAP32[a + 32 >> 2] + 512 > 1023) {
          break b
        }
        if(HEAP32[a + 48 >> 2] + 512 > 1023) {
          break b
        }
        a += 4;
        g = c
      }
      f = 1;
      e = 23;
      break a
    }else {
      if(e == 13) {
        j = a;
        e = (c & 98) == 0 ? 14 : 17;
        do {
          if(e == 14) {
            d = HEAP32[j >> 2] + 32 >> 6;
            e = d + 512 > 1023 ? 15 : 16;
            do {
              if(e == 15) {
                f = 1;
                e = 23;
                break a
              }else {
                if(e == 16) {
                  g = d;
                  HEAP32[a + 60 >> 2] = g;
                  HEAP32[a + 56 >> 2] = g;
                  HEAP32[a + 52 >> 2] = g;
                  HEAP32[a + 48 >> 2] = g;
                  HEAP32[a + 44 >> 2] = g;
                  HEAP32[a + 40 >> 2] = g;
                  HEAP32[a + 36 >> 2] = g;
                  HEAP32[a + 32 >> 2] = g;
                  HEAP32[a + 28 >> 2] = g;
                  HEAP32[a + 24 >> 2] = g;
                  HEAP32[a + 20 >> 2] = g;
                  HEAP32[a + 16 >> 2] = g;
                  HEAP32[a + 12 >> 2] = g;
                  HEAP32[a + 8 >> 2] = g;
                  HEAP32[a + 4 >> 2] = g;
                  HEAP32[a >> 2] = g;
                  e = 22;
                  break a
                }
              }
            }while(0)
          }else {
            if(e == 17) {
              HEAP32[a + 4 >> 2] = h * HEAP32[j + 4 >> 2];
              HEAP32[a + 8 >> 2] = g * HEAP32[a + 20 >> 2];
              HEAP32[a + 12 >> 2] = h * HEAP32[a + 24 >> 2];
              d = HEAP32[a + 8 >> 2] + HEAP32[a >> 2];
              g = HEAP32[a >> 2] - HEAP32[a + 8 >> 2];
              h = (HEAP32[a + 4 >> 2] >> 1) - HEAP32[a + 12 >> 2];
              b = (HEAP32[a + 12 >> 2] >> 1) + HEAP32[a + 4 >> 2];
              HEAP32[a >> 2] = b + (d + 32) >> 6;
              HEAP32[a + 4 >> 2] = h + (g + 32) >> 6;
              HEAP32[a + 8 >> 2] = g + 32 + -h >> 6;
              HEAP32[a + 12 >> 2] = d + 32 + -b >> 6;
              g = HEAP32[a >> 2];
              HEAP32[a + 48 >> 2] = g;
              HEAP32[a + 32 >> 2] = g;
              HEAP32[a + 16 >> 2] = g;
              g = HEAP32[a + 4 >> 2];
              HEAP32[a + 52 >> 2] = g;
              HEAP32[a + 36 >> 2] = g;
              HEAP32[a + 20 >> 2] = g;
              g = HEAP32[a + 8 >> 2];
              HEAP32[a + 56 >> 2] = g;
              HEAP32[a + 40 >> 2] = g;
              HEAP32[a + 24 >> 2] = g;
              g = HEAP32[a + 12 >> 2];
              HEAP32[a + 60 >> 2] = g;
              HEAP32[a + 44 >> 2] = g;
              HEAP32[a + 28 >> 2] = g;
              e = HEAP32[a >> 2] + 512 > 1023 ? 21 : 18;
              c:do {
                if(e == 18) {
                  if(HEAP32[a + 4 >> 2] + 512 > 1023) {
                    break c
                  }
                  if(HEAP32[a + 8 >> 2] + 512 > 1023) {
                    break c
                  }
                  if(!(HEAP32[a + 12 >> 2] + 512 > 1023)) {
                    e = 22;
                    break a
                  }
                }
              }while(0);
              f = 1;
              e = 23;
              break a
            }
          }
        }while(0)
      }
    }
  }while(0);
  e == 22 && (f = 0);
  return f
}
_h264bsdProcessBlock.X = 1;
function _h264bsdCountLeadingZeros(a, b) {
  var d, c, e;
  c = 0;
  e = 1 << b - 1;
  var f = 1 << b - 1;
  a:for(;;) {
    if(f == 0) {
      d = 2;
      break a
    }
    f = c;
    if(!((e & a) != 0 ^ 1)) {
      var g = f;
      d = 5;
      break a
    }
    c = f + 1;
    e = f = e >>> 1
  }
  d == 2 && (g = c);
  return g
}
function _abs(a) {
  return a < 0 ? -a : a
}
function _clip(a, b, d) {
  var c;
  c = d < a ? 1 : 2;
  if(c == 1) {
    var e = a
  }else {
    c == 2 && (e = d > b ? b : d)
  }
  return e
}
function _h264bsdProcessLumaDc(a, b) {
  var d, c, e, f, g, h, j, l, k, m;
  c = a;
  j = HEAPU8[_qpMod6 + b];
  l = HEAPU8[_qpDiv6 + b];
  e = HEAP32[c + 8 >> 2];
  HEAP32[c + 8 >> 2] = HEAP32[c + 20 >> 2];
  HEAP32[c + 20 >> 2] = HEAP32[c + 16 >> 2];
  HEAP32[c + 16 >> 2] = e;
  e = HEAP32[c + 32 >> 2];
  HEAP32[c + 32 >> 2] = HEAP32[c + 12 >> 2];
  HEAP32[c + 12 >> 2] = HEAP32[c + 24 >> 2];
  HEAP32[c + 24 >> 2] = HEAP32[c + 28 >> 2];
  HEAP32[c + 28 >> 2] = HEAP32[c + 48 >> 2];
  HEAP32[c + 48 >> 2] = HEAP32[c + 36 >> 2];
  HEAP32[c + 36 >> 2] = e;
  e = HEAP32[c + 40 >> 2];
  HEAP32[c + 40 >> 2] = HEAP32[c + 44 >> 2];
  HEAP32[c + 44 >> 2] = HEAP32[c + 52 >> 2];
  HEAP32[c + 52 >> 2] = e;
  k = c;
  d = 3;
  a:for(;;) {
    if(e = HEAP32[k + 8 >> 2] + HEAP32[k >> 2], f = HEAP32[k >> 2] - HEAP32[k + 8 >> 2], g = HEAP32[k + 4 >> 2] - HEAP32[k + 12 >> 2], h = HEAP32[k + 12 >> 2] + HEAP32[k + 4 >> 2], HEAP32[k >> 2] = h + e, HEAP32[k + 4 >> 2] = g + f, HEAP32[k + 8 >> 2] = f - g, HEAP32[k + 12 >> 2] = e - h, k += 16, e = d, d = e - 1, e == 0) {
      break a
    }
  }
  k = HEAP32[_levelScale + j * 12 >> 2];
  d = b >= 12 ? 3 : 5;
  a:do {
    if(d == 3) {
      k <<= l - 2;
      j = 3;
      for(;;) {
        if(e = HEAP32[c + 32 >> 2] + HEAP32[c >> 2], f = HEAP32[c >> 2] - HEAP32[c + 32 >> 2], g = HEAP32[c + 16 >> 2] - HEAP32[c + 48 >> 2], h = HEAP32[c + 48 >> 2] + HEAP32[c + 16 >> 2], HEAP32[c >> 2] = (h + e) * k, HEAP32[c + 16 >> 2] = (g + f) * k, HEAP32[c + 32 >> 2] = (f - g) * k, HEAP32[c + 48 >> 2] = (e - h) * k, c += 4, e = j, j = e - 1, e == 0) {
          break a
        }
      }
    }else {
      if(d == 5) {
        m = 1 - l == 0 ? 1 : 2;
        j = 3;
        for(;;) {
          if(e = HEAP32[c + 32 >> 2] + HEAP32[c >> 2], f = HEAP32[c >> 2] - HEAP32[c + 32 >> 2], g = HEAP32[c + 16 >> 2] - HEAP32[c + 48 >> 2], h = HEAP32[c + 48 >> 2] + HEAP32[c + 16 >> 2], HEAP32[c >> 2] = (h + e) * k + m >> 2 - l, HEAP32[c + 16 >> 2] = (g + f) * k + m >> 2 - l, HEAP32[c + 32 >> 2] = (f - g) * k + m >> 2 - l, HEAP32[c + 48 >> 2] = (e - h) * k + m >> 2 - l, c += 4, e = j, j = e - 1, e == 0) {
            break a
          }
        }
      }
    }
  }while(0)
}
_h264bsdProcessLumaDc.X = 1;
function _h264bsdProcessChromaDc(a, b) {
  var d, c, e, f, g, h;
  c = HEAPU8[_qpDiv6 + b];
  g = HEAP32[_levelScale + HEAPU8[_qpMod6 + b] * 12 >> 2];
  d = b >= 6 ? 1 : 2;
  d == 1 ? (g <<= c - 1, h = 0) : d == 2 && (h = 1);
  d = HEAP32[a + 8 >> 2] + HEAP32[a >> 2];
  c = HEAP32[a >> 2] - HEAP32[a + 8 >> 2];
  e = HEAP32[a + 4 >> 2] - HEAP32[a + 12 >> 2];
  f = HEAP32[a + 12 >> 2] + HEAP32[a + 4 >> 2];
  HEAP32[a >> 2] = (f + d) * g >> h;
  HEAP32[a + 4 >> 2] = (d - f) * g >> h;
  HEAP32[a + 8 >> 2] = (e + c) * g >> h;
  HEAP32[a + 12 >> 2] = (c - e) * g >> h;
  d = HEAP32[a + 24 >> 2] + HEAP32[a + 16 >> 2];
  c = HEAP32[a + 16 >> 2] - HEAP32[a + 24 >> 2];
  e = HEAP32[a + 20 >> 2] - HEAP32[a + 28 >> 2];
  f = HEAP32[a + 28 >> 2] + HEAP32[a + 20 >> 2];
  HEAP32[a + 16 >> 2] = (f + d) * g >> h;
  HEAP32[a + 20 >> 2] = (d - f) * g >> h;
  HEAP32[a + 24 >> 2] = (e + c) * g >> h;
  HEAP32[a + 28 >> 2] = (c - e) * g >> h
}
_h264bsdProcessChromaDc.X = 1;
function _h264bsdNextMbAddress(a, b, d) {
  var c, e, f;
  e = HEAP32[a + (d << 2) >> 2];
  d += 1;
  f = HEAP32[a + (d << 2) >> 2];
  a:for(;;) {
    if(!(d < b)) {
      c = 2;
      break a
    }
    var g = d;
    if(f == e) {
      var h = g;
      c = 5;
      break a
    }
    d = g + 1;
    f = HEAP32[a + (d << 2) >> 2]
  }
  c == 2 && (h = d);
  (h == b ? 6 : 7) == 6 && (d = 0);
  return d
}
_h264bsdNextMbAddress.X = 1;
function _h264bsdSetCurrImageMbPointers(a, b) {
  var d, c, e, f;
  d = HEAP32[a + 4 >> 2];
  c = HEAP32[a + 8 >> 2];
  e = Math.floor(b / d);
  f = b % d;
  e *= d;
  d *= c;
  HEAP32[a + 12 >> 2] = HEAP32[a >> 2] + (f << 4) + (e << 8);
  HEAP32[a + 16 >> 2] = HEAP32[a >> 2] + (d << 8) + (e << 6) + (f << 3);
  HEAP32[a + 20 >> 2] = HEAP32[a + 16 >> 2] + (d << 6)
}
_h264bsdSetCurrImageMbPointers.X = 1;
function _h264bsdRbspTrailingBits(a) {
  var b, d, c;
  c = 8 - HEAP32[a + 8 >> 2];
  d = _h264bsdGetBits(a, c);
  a = d == -1 ? 1 : 2;
  a == 1 ? b = 1 : a == 2 && (a = d != HEAP32[_stuffingTable + (c - 1 << 2) >> 2] ? 3 : 4, a == 3 ? b = 1 : a == 4 && (b = 0));
  return b
}
function _h264bsdMoreRbspData(a) {
  var b, d, c;
  c = (HEAP32[a + 12 >> 2] << 3) - HEAP32[a + 16 >> 2];
  b = c == 0 ? 1 : 2;
  a:do {
    if(b == 1) {
      d = 0
    }else {
      if(b == 2) {
        b = c > 8 ? 4 : 3;
        b:do {
          if(b == 3) {
            if(_h264bsdShowBits32(a) >>> 32 - c != 1 << c - 1) {
              b = 4;
              break b
            }
            d = 0;
            break a
          }
        }while(0);
        d = 1
      }
    }
  }while(0);
  return d
}
function _h264bsdExtractNalUnit(a, b, d, c) {
  var e, f, g, h, j, l, k, m, o;
  m = k = 0;
  e = b > 3 ? 1 : 28;
  a:do {
    if(e == 1) {
      if(HEAPU8[a] != 0) {
        e = 28;
        break a
      }
      if(HEAPU8[a + 1] != 0) {
        e = 28;
        break a
      }
      if((HEAPU8[a + 2] & 254) != 0) {
        e = 28;
        break a
      }
      j = g = 2;
      o = a + 2;
      b:for(;;) {
        e = o;
        o = e + 1;
        l = HEAP8[e];
        g += 1;
        if(g == b) {
          e = 6;
          break b
        }
        e = l != 0 ? 9 : 8;
        do {
          if(e == 9) {
            e = l == 1 ? 10 : 11;
            do {
              if(e == 10 && j >= 2) {
                e = 12;
                break b
              }
            }while(0);
            j = 0
          }else {
            e == 8 && (j += 1)
          }
        }while(0)
      }
      do {
        if(e == 6) {
          HEAP32[c >> 2] = b;
          f = 1;
          e = 50;
          break a
        }else {
          if(e == 12) {
            h = g;
            j = 0;
            c:for(;;) {
              e = o;
              o = e + 1;
              l = e = HEAP8[e];
              g += 1;
              e = e != 0 ? 15 : 14;
              e == 14 && (j += 1);
              e = (l & 255 | 0) == 3 ? 16 : 18;
              d:do {
                if(e == 16) {
                  if((j | 0) != 2) {
                    break d
                  }
                  k = 1
                }
              }while(0);
              if((l & 255 | 0) == 1) {
                e = 19
              }else {
                var p = l;
                e = 22
              }
              do {
                if(e == 19) {
                  if(j >>> 0 >= 2) {
                    e = 20;
                    break c
                  }
                  p = l
                }
              }while(0);
              e = p != 0 ? 23 : 26;
              e == 23 && (e = j >= 3 ? 24 : 25, e == 24 && (m = 1), j = 0);
              if(g == b) {
                e = 27;
                break c
              }
            }
            do {
              if(e == 20) {
                HEAP32[d + 12 >> 2] = g - 1 + -h + -j;
                j -= j < 3 ? j : 3;
                e = 29;
                break a
              }else {
                if(e == 27) {
                  HEAP32[d + 12 >> 2] = -h + g + -j;
                  e = 29;
                  break a
                }
              }
            }while(0)
          }
        }
      }while(0)
    }
  }while(0);
  a:do {
    if(e == 28) {
      j = h = 0;
      HEAP32[d + 12 >> 2] = b;
      k = 1;
      e = 29;
      break a
    }
  }while(0);
  a:do {
    if(e == 29) {
      HEAP32[d >> 2] = a + h;
      HEAP32[d + 4 >> 2] = HEAP32[d >> 2];
      HEAP32[d + 8 >> 2] = 0;
      HEAP32[d + 16 >> 2] = 0;
      HEAP32[c >> 2] = h + HEAP32[d + 12 >> 2] + j;
      e = m != 0 ? 30 : 31;
      do {
        if(e == 30) {
          f = 1
        }else {
          if(e == 31) {
            e = k != 0 ? 32 : 49;
            do {
              if(e == 32) {
                f = HEAP32[d + 12 >> 2];
                b = HEAP32[d >> 2];
                o = HEAP32[d >> 2];
                j = 0;
                g = f;
                d:for(;;) {
                  f = g - 1;
                  if(g == 0) {
                    e = 48;
                    break d
                  }
                  e = j == 2 ? 36 : 44;
                  e:do {
                    if(e == 36) {
                      e = HEAPU8[o] == 3 ? 37 : 41;
                      do {
                        if(e == 37) {
                          if(f == 0) {
                            e = 39;
                            break d
                          }
                          if(HEAPU8[o + 1] > 3) {
                            e = 39;
                            break d
                          }
                          o += 1;
                          j = 0;
                          e = 33;
                          break e
                        }else {
                          if(e == 41) {
                            if(j != 2) {
                              e = 44;
                              break e
                            }
                            if(HEAPU8[o] <= 2) {
                              e = 43;
                              break d
                            }else {
                              e = 44;
                              break e
                            }
                          }
                        }
                      }while(0)
                    }
                  }while(0);
                  e == 44 && (e = HEAPU8[o] == 0 ? 45 : 46, e == 45 ? j += 1 : e == 46 && (j = 0), g = o, o = g + 1, g = HEAP8[g], p = b, b = p + 1, HEAP8[p] = g);
                  g = f
                }
                do {
                  if(e == 48) {
                    HEAP32[d + 12 >> 2] = - -b + -o + HEAP32[d + 12 >> 2]
                  }else {
                    if(e == 39) {
                      f = 1;
                      break a
                    }else {
                      if(e == 43) {
                        f = 1;
                        break a
                      }
                    }
                  }
                }while(0)
              }
            }while(0);
            f = 0
          }
        }
      }while(0)
    }
  }while(0);
  return f
}
_h264bsdExtractNalUnit.X = 1;
function _GetDpbSize(a, b) {
  var d, c, e, f;
  d = b == 10 ? 1 : b == 11 ? 2 : b == 12 ? 3 : b == 13 ? 4 : b == 20 ? 5 : b == 21 ? 6 : b == 22 ? 7 : b == 30 ? 8 : b == 31 ? 9 : b == 32 ? 10 : b == 40 ? 11 : b == 41 ? 12 : b == 42 ? 13 : b == 50 ? 14 : b == 51 ? 15 : 16;
  a:do {
    if(d == 16) {
      c = 2147483647;
      d = 20;
      break a
    }else {
      if(d == 1) {
        e = 152064;
        f = 99;
        d = 17;
        break a
      }else {
        if(d == 2) {
          e = 345600;
          f = 396;
          d = 17;
          break a
        }else {
          if(d == 3) {
            e = 912384;
            f = 396;
            d = 17;
            break a
          }else {
            if(d == 4) {
              e = 912384;
              f = 396;
              d = 17;
              break a
            }else {
              if(d == 5) {
                e = 912384;
                f = 396;
                d = 17;
                break a
              }else {
                if(d == 6) {
                  e = 1824768;
                  f = 792;
                  d = 17;
                  break a
                }else {
                  if(d == 7) {
                    e = 3110400;
                    f = 1620;
                    d = 17;
                    break a
                  }else {
                    if(d == 8) {
                      e = 3110400;
                      f = 1620;
                      d = 17;
                      break a
                    }else {
                      if(d == 9) {
                        e = 6912E3;
                        f = 3600;
                        d = 17;
                        break a
                      }else {
                        if(d == 10) {
                          e = 7864320;
                          f = 5120;
                          d = 17;
                          break a
                        }else {
                          if(d == 11) {
                            e = 12582912;
                            f = 8192;
                            d = 17;
                            break a
                          }else {
                            if(d == 12) {
                              e = 12582912;
                              f = 8192;
                              d = 17;
                              break a
                            }else {
                              if(d == 13) {
                                e = 13369344;
                                f = 8704;
                                d = 17;
                                break a
                              }else {
                                if(d == 14) {
                                  e = 42393600;
                                  f = 22080;
                                  d = 17;
                                  break a
                                }else {
                                  if(d == 15) {
                                    e = 70778880;
                                    f = 36864;
                                    d = 17;
                                    break a
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }while(0);
  d == 17 && (d = a > f ? 18 : 19, d == 18 ? c = 2147483647 : d == 19 && (e = Math.floor(e / (a * 384)), c = e < 16 ? e : 16));
  return c
}
_GetDpbSize.X = 1;
function _h264bsdDecodeSeqParamSet(a, b) {
  var d = STACKTOP;
  STACKTOP += 4;
  var c, e, f, g;
  _H264SwDecMemset(b, 0, 92);
  f = _h264bsdGetBits(a, 8);
  c = f == -1 ? 1 : 2;
  a:do {
    if(c == 1) {
      e = 1
    }else {
      if(c == 2) {
        HEAP32[b >> 2] = f;
        _h264bsdGetBits(a, 1);
        _h264bsdGetBits(a, 1);
        f = _h264bsdGetBits(a, 1);
        c = f == -1 ? 3 : 4;
        do {
          if(c == 3) {
            e = 1
          }else {
            if(c == 4) {
              f = _h264bsdGetBits(a, 5);
              c = f == -1 ? 5 : 6;
              do {
                if(c == 5) {
                  e = 1
                }else {
                  if(c == 6) {
                    f = _h264bsdGetBits(a, 8);
                    c = f == -1 ? 7 : 8;
                    do {
                      if(c == 7) {
                        e = 1
                      }else {
                        if(c == 8) {
                          HEAP32[b + 4 >> 2] = f;
                          f = _h264bsdDecodeExpGolombUnsigned(a, b + 8);
                          c = f != 0 ? 9 : 10;
                          do {
                            if(c == 9) {
                              e = f
                            }else {
                              if(c == 10) {
                                c = HEAPU32[b + 8 >> 2] >= 32 ? 11 : 12;
                                do {
                                  if(c == 11) {
                                    e = 1
                                  }else {
                                    if(c == 12) {
                                      f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                      c = f != 0 ? 13 : 14;
                                      do {
                                        if(c == 13) {
                                          e = f
                                        }else {
                                          if(c == 14) {
                                            c = HEAPU32[d >> 2] > 12 ? 15 : 16;
                                            do {
                                              if(c == 15) {
                                                e = 1
                                              }else {
                                                if(c == 16) {
                                                  HEAP32[b + 12 >> 2] = 1 << HEAP32[d >> 2] + 4;
                                                  f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                                  c = f != 0 ? 17 : 18;
                                                  do {
                                                    if(c == 17) {
                                                      e = f
                                                    }else {
                                                      if(c == 18) {
                                                        c = HEAPU32[d >> 2] > 2 ? 19 : 20;
                                                        do {
                                                          if(c == 19) {
                                                            e = 1
                                                          }else {
                                                            if(c == 20) {
                                                              HEAP32[b + 16 >> 2] = HEAP32[d >> 2];
                                                              c = HEAP32[b + 16 >> 2] == 0 ? 21 : 26;
                                                              k:do {
                                                                if(c == 21) {
                                                                  f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                                                  c = f != 0 ? 22 : 23;
                                                                  do {
                                                                    if(c == 22) {
                                                                      e = f;
                                                                      break a
                                                                    }else {
                                                                      if(c == 23) {
                                                                        c = HEAPU32[d >> 2] > 12 ? 24 : 25;
                                                                        do {
                                                                          if(c == 24) {
                                                                            e = 1;
                                                                            break a
                                                                          }else {
                                                                            c == 25 && (HEAP32[b + 20 >> 2] = 1 << HEAP32[d >> 2] + 4)
                                                                          }
                                                                        }while(0)
                                                                      }
                                                                    }
                                                                  }while(0)
                                                                }else {
                                                                  if(c == 26) {
                                                                    if(HEAP32[b + 16 >> 2] != 1) {
                                                                      break k
                                                                    }
                                                                    f = _h264bsdGetBits(a, 1);
                                                                    c = f == -1 ? 28 : 29;
                                                                    do {
                                                                      if(c == 28) {
                                                                        e = 1;
                                                                        break a
                                                                      }else {
                                                                        if(c == 29) {
                                                                          HEAP32[b + 24 >> 2] = f == 1 ? 1 : 0;
                                                                          f = _h264bsdDecodeExpGolombSigned(a, b + 28);
                                                                          c = f != 0 ? 30 : 31;
                                                                          do {
                                                                            if(c == 30) {
                                                                              e = f;
                                                                              break a
                                                                            }else {
                                                                              if(c == 31) {
                                                                                f = _h264bsdDecodeExpGolombSigned(a, b + 32);
                                                                                c = f != 0 ? 32 : 33;
                                                                                do {
                                                                                  if(c == 32) {
                                                                                    e = f;
                                                                                    break a
                                                                                  }else {
                                                                                    if(c == 33) {
                                                                                      f = _h264bsdDecodeExpGolombUnsigned(a, b + 36);
                                                                                      c = f != 0 ? 34 : 35;
                                                                                      do {
                                                                                        if(c == 34) {
                                                                                          e = f;
                                                                                          break a
                                                                                        }else {
                                                                                          if(c == 35) {
                                                                                            c = HEAPU32[b + 36 >> 2] > 255 ? 36 : 37;
                                                                                            do {
                                                                                              if(c == 36) {
                                                                                                e = 1;
                                                                                                break a
                                                                                              }else {
                                                                                                if(c == 37) {
                                                                                                  g = b;
                                                                                                  c = HEAP32[b + 36 >> 2] != 0 ? 38 : 45;
                                                                                                  do {
                                                                                                    if(c == 38) {
                                                                                                      c = _H264SwDecMalloc(HEAP32[g + 36 >> 2] << 2);
                                                                                                      HEAP32[b + 40 >> 2] = c;
                                                                                                      c = HEAP32[b + 40 >> 2] == 0 ? 39 : 40;
                                                                                                      do {
                                                                                                        if(c == 39) {
                                                                                                          e = 65535;
                                                                                                          break a
                                                                                                        }else {
                                                                                                          if(c == 40) {
                                                                                                            g = 0;
                                                                                                            s:for(;;) {
                                                                                                              if(!(g < HEAPU32[b + 36 >> 2])) {
                                                                                                                break k
                                                                                                              }
                                                                                                              f = _h264bsdDecodeExpGolombSigned(a, HEAP32[b + 40 >> 2] + (g << 2));
                                                                                                              if(f != 0) {
                                                                                                                break s
                                                                                                              }
                                                                                                              g += 1
                                                                                                            }
                                                                                                            e = f;
                                                                                                            break a
                                                                                                          }
                                                                                                        }
                                                                                                      }while(0)
                                                                                                    }else {
                                                                                                      c == 45 && (HEAP32[g + 40 >> 2] = 0)
                                                                                                    }
                                                                                                  }while(0)
                                                                                                }
                                                                                              }
                                                                                            }while(0)
                                                                                          }
                                                                                        }
                                                                                      }while(0)
                                                                                    }
                                                                                  }
                                                                                }while(0)
                                                                              }
                                                                            }
                                                                          }while(0)
                                                                        }
                                                                      }
                                                                    }while(0)
                                                                  }
                                                                }
                                                              }while(0);
                                                              f = g = _h264bsdDecodeExpGolombUnsigned(a, b + 44);
                                                              c = g != 0 ? 47 : 48;
                                                              do {
                                                                if(c == 47) {
                                                                  e = f
                                                                }else {
                                                                  if(c == 48) {
                                                                    c = HEAPU32[b + 44 >> 2] > 16 ? 49 : 50;
                                                                    do {
                                                                      if(c == 49) {
                                                                        e = 1
                                                                      }else {
                                                                        if(c == 50) {
                                                                          f = _h264bsdGetBits(a, 1);
                                                                          c = f == -1 ? 51 : 52;
                                                                          do {
                                                                            if(c == 51) {
                                                                              e = 1
                                                                            }else {
                                                                              if(c == 52) {
                                                                                HEAP32[b + 48 >> 2] = f == 1 ? 1 : 0;
                                                                                f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                                                                c = f != 0 ? 53 : 54;
                                                                                do {
                                                                                  if(c == 53) {
                                                                                    e = f
                                                                                  }else {
                                                                                    if(c == 54) {
                                                                                      HEAP32[b + 52 >> 2] = HEAP32[d >> 2] + 1;
                                                                                      f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                                                                      c = f != 0 ? 55 : 56;
                                                                                      do {
                                                                                        if(c == 55) {
                                                                                          e = f
                                                                                        }else {
                                                                                          if(c == 56) {
                                                                                            HEAP32[b + 56 >> 2] = HEAP32[d >> 2] + 1;
                                                                                            f = _h264bsdGetBits(a, 1);
                                                                                            c = f == -1 ? 57 : 58;
                                                                                            do {
                                                                                              if(c == 57) {
                                                                                                e = 1
                                                                                              }else {
                                                                                                if(c == 58) {
                                                                                                  c = f != 0 ? 60 : 59;
                                                                                                  do {
                                                                                                    if(c == 60) {
                                                                                                      f = _h264bsdGetBits(a, 1);
                                                                                                      c = f == -1 ? 61 : 62;
                                                                                                      do {
                                                                                                        if(c == 61) {
                                                                                                          e = 1
                                                                                                        }else {
                                                                                                          if(c == 62) {
                                                                                                            f = _h264bsdGetBits(a, 1);
                                                                                                            c = f == -1 ? 63 : 64;
                                                                                                            do {
                                                                                                              if(c == 63) {
                                                                                                                e = 1
                                                                                                              }else {
                                                                                                                if(c == 64) {
                                                                                                                  HEAP32[b + 60 >> 2] = f == 1 ? 1 : 0;
                                                                                                                  c = HEAP32[b + 60 >> 2] != 0 ? 65 : 76;
                                                                                                                  t:do {
                                                                                                                    if(c == 65) {
                                                                                                                      f = _h264bsdDecodeExpGolombUnsigned(a, b + 64);
                                                                                                                      c = f != 0 ? 66 : 67;
                                                                                                                      do {
                                                                                                                        if(c == 66) {
                                                                                                                          e = f;
                                                                                                                          break a
                                                                                                                        }else {
                                                                                                                          if(c == 67) {
                                                                                                                            f = _h264bsdDecodeExpGolombUnsigned(a, b + 68);
                                                                                                                            c = f != 0 ? 68 : 69;
                                                                                                                            do {
                                                                                                                              if(c == 68) {
                                                                                                                                e = f;
                                                                                                                                break a
                                                                                                                              }else {
                                                                                                                                if(c == 69) {
                                                                                                                                  f = _h264bsdDecodeExpGolombUnsigned(a, b + 72);
                                                                                                                                  c = f != 0 ? 70 : 71;
                                                                                                                                  do {
                                                                                                                                    if(c == 70) {
                                                                                                                                      e = f;
                                                                                                                                      break a
                                                                                                                                    }else {
                                                                                                                                      if(c == 71) {
                                                                                                                                        f = _h264bsdDecodeExpGolombUnsigned(a, b + 76);
                                                                                                                                        c = f != 0 ? 72 : 73;
                                                                                                                                        do {
                                                                                                                                          if(c == 72) {
                                                                                                                                            e = f;
                                                                                                                                            break a
                                                                                                                                          }else {
                                                                                                                                            if(c == 73) {
                                                                                                                                              c = HEAP32[b + 64 >> 2] > (HEAP32[b + 52 >> 2] << 3) - 1 + -HEAP32[b + 68 >> 2] ? 75 : 74;
                                                                                                                                              do {
                                                                                                                                                if(c == 74 && !(HEAP32[b + 72 >> 2] > (HEAP32[b + 56 >> 2] << 3) - 1 + -HEAP32[b + 76 >> 2])) {
                                                                                                                                                  break t
                                                                                                                                                }
                                                                                                                                              }while(0);
                                                                                                                                              e = 1;
                                                                                                                                              break a
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }while(0)
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }while(0)
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }while(0)
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }while(0)
                                                                                                                    }
                                                                                                                  }while(0);
                                                                                                                  f = HEAP32[b + 56 >> 2] * HEAP32[b + 52 >> 2];
                                                                                                                  f = _GetDpbSize(f, HEAP32[b + 4 >> 2]);
                                                                                                                  HEAP32[d >> 2] = f;
                                                                                                                  c = f == 2147483647 ? 78 : 77;
                                                                                                                  t:do {
                                                                                                                    if(c == 77) {
                                                                                                                      c = HEAPU32[b + 44 >> 2] > HEAPU32[d >> 2] ? 78 : 79;
                                                                                                                      break t
                                                                                                                    }
                                                                                                                  }while(0);
                                                                                                                  c == 78 && (HEAP32[d >> 2] = HEAP32[b + 44 >> 2]);
                                                                                                                  HEAP32[b + 88 >> 2] = HEAP32[d >> 2];
                                                                                                                  f = g = _h264bsdGetBits(a, 1);
                                                                                                                  c = g == -1 ? 80 : 81;
                                                                                                                  do {
                                                                                                                    if(c == 80) {
                                                                                                                      e = 1
                                                                                                                    }else {
                                                                                                                      if(c == 81) {
                                                                                                                        HEAP32[b + 80 >> 2] = f == 1 ? 1 : 0;
                                                                                                                        c = HEAP32[b + 80 >> 2] != 0 ? 82 : 94;
                                                                                                                        u:do {
                                                                                                                          if(c == 82) {
                                                                                                                            e = _H264SwDecMalloc(952);
                                                                                                                            HEAP32[b + 84 >> 2] = e;
                                                                                                                            c = HEAP32[b + 84 >> 2] == 0 ? 83 : 84;
                                                                                                                            do {
                                                                                                                              if(c == 83) {
                                                                                                                                e = 65535;
                                                                                                                                break a
                                                                                                                              }else {
                                                                                                                                if(c == 84) {
                                                                                                                                  f = _h264bsdDecodeVuiParameters(a, HEAP32[b + 84 >> 2]);
                                                                                                                                  c = f != 0 ? 85 : 86;
                                                                                                                                  do {
                                                                                                                                    if(c == 85) {
                                                                                                                                      e = f;
                                                                                                                                      break a
                                                                                                                                    }else {
                                                                                                                                      if(c == 86) {
                                                                                                                                        if(HEAP32[HEAP32[b + 84 >> 2] + 920 >> 2] == 0) {
                                                                                                                                          c = 94;
                                                                                                                                          break u
                                                                                                                                        }
                                                                                                                                        c = HEAPU32[HEAP32[b + 84 >> 2] + 944 >> 2] > HEAPU32[HEAP32[b + 84 >> 2] + 948 >> 2] ? 90 : 88;
                                                                                                                                        x:do {
                                                                                                                                          if(c == 88) {
                                                                                                                                            if(HEAPU32[HEAP32[b + 84 >> 2] + 948 >> 2] < HEAPU32[b + 44 >> 2]) {
                                                                                                                                              break x
                                                                                                                                            }
                                                                                                                                            if(HEAPU32[HEAP32[b + 84 >> 2] + 948 >> 2] > HEAPU32[b + 88 >> 2]) {
                                                                                                                                              break x
                                                                                                                                            }
                                                                                                                                            if(1 > HEAPU32[HEAP32[b + 84 >> 2] + 948 >> 2]) {
                                                                                                                                              var h = 1;
                                                                                                                                              c = 93
                                                                                                                                            }else {
                                                                                                                                              c = 92
                                                                                                                                            }
                                                                                                                                            c == 92 && (h = HEAP32[HEAP32[b + 84 >> 2] + 948 >> 2]);
                                                                                                                                            HEAP32[b + 88 >> 2] = h;
                                                                                                                                            c = 94;
                                                                                                                                            break u
                                                                                                                                          }
                                                                                                                                        }while(0);
                                                                                                                                        e = 1;
                                                                                                                                        break a
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }while(0)
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }while(0)
                                                                                                                          }
                                                                                                                        }while(0);
                                                                                                                        f = _h264bsdRbspTrailingBits(a);
                                                                                                                        e = 0
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }while(0)
                                                                                                                }
                                                                                                              }
                                                                                                            }while(0)
                                                                                                          }
                                                                                                        }
                                                                                                      }while(0)
                                                                                                    }else {
                                                                                                      c == 59 && (e = 1)
                                                                                                    }
                                                                                                  }while(0)
                                                                                                }
                                                                                              }
                                                                                            }while(0)
                                                                                          }
                                                                                        }
                                                                                      }while(0)
                                                                                    }
                                                                                  }
                                                                                }while(0)
                                                                              }
                                                                            }
                                                                          }while(0)
                                                                        }
                                                                      }
                                                                    }while(0)
                                                                  }
                                                                }
                                                              }while(0)
                                                            }
                                                          }
                                                        }while(0)
                                                      }
                                                    }
                                                  }while(0)
                                                }
                                              }
                                            }while(0)
                                          }
                                        }
                                      }while(0)
                                    }
                                  }
                                }while(0)
                              }
                            }
                          }while(0)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = d;
  return e
}
_h264bsdDecodeSeqParamSet.X = 1;
function _h264bsdCompareSeqParamSets(a, b) {
  var d, c;
  d = HEAP32[a >> 2] == HEAP32[b >> 2] ? 1 : 31;
  a:do {
    if(d == 1) {
      if(HEAP32[a + 4 >> 2] != HEAP32[b + 4 >> 2]) {
        d = 31;
        break a
      }
      if(HEAP32[a + 12 >> 2] != HEAP32[b + 12 >> 2]) {
        d = 31;
        break a
      }
      if(HEAP32[a + 16 >> 2] != HEAP32[b + 16 >> 2]) {
        d = 31;
        break a
      }
      if(HEAP32[a + 44 >> 2] != HEAP32[b + 44 >> 2]) {
        d = 31;
        break a
      }
      if(HEAP32[a + 48 >> 2] != HEAP32[b + 48 >> 2]) {
        d = 31;
        break a
      }
      if(HEAP32[a + 52 >> 2] != HEAP32[b + 52 >> 2]) {
        d = 31;
        break a
      }
      if(HEAP32[a + 56 >> 2] != HEAP32[b + 56 >> 2]) {
        d = 31;
        break a
      }
      if(HEAP32[a + 60 >> 2] != HEAP32[b + 60 >> 2]) {
        d = 31;
        break a
      }
      if(HEAP32[a + 80 >> 2] != HEAP32[b + 80 >> 2]) {
        d = 31;
        break a
      }
      c = a;
      d = HEAP32[a + 16 >> 2] == 0 ? 11 : 13;
      b:do {
        if(d == 11) {
          if(HEAP32[c + 20 >> 2] == HEAP32[b + 20 >> 2]) {
            break b
          }
          c = 1;
          d = 32;
          break a
        }else {
          if(d == 13) {
            if(HEAP32[c + 16 >> 2] != 1) {
              break b
            }
            d = HEAP32[a + 24 >> 2] != HEAP32[b + 24 >> 2] ? 18 : 15;
            c:do {
              if(d == 15) {
                if(HEAP32[a + 28 >> 2] != HEAP32[b + 28 >> 2]) {
                  break c
                }
                if(HEAP32[a + 32 >> 2] != HEAP32[b + 32 >> 2]) {
                  break c
                }
                if(HEAP32[a + 36 >> 2] != HEAP32[b + 36 >> 2]) {
                  break c
                }
                d = 0;
                d:for(;;) {
                  if(!(d < HEAPU32[a + 36 >> 2])) {
                    break b
                  }
                  if(HEAP32[HEAP32[a + 40 >> 2] + (d << 2) >> 2] != HEAP32[HEAP32[b + 40 >> 2] + (d << 2) >> 2]) {
                    break d
                  }
                  d += 1
                }
                c = 1;
                d = 32;
                break a
              }
            }while(0);
            c = 1;
            d = 32;
            break a
          }
        }
      }while(0);
      d = HEAP32[a + 60 >> 2] != 0 ? 25 : 30;
      b:do {
        if(d == 25) {
          d = HEAP32[a + 64 >> 2] != HEAP32[b + 64 >> 2] ? 29 : 26;
          c:do {
            if(d == 26) {
              if(HEAP32[a + 68 >> 2] != HEAP32[b + 68 >> 2]) {
                break c
              }
              if(HEAP32[a + 72 >> 2] != HEAP32[b + 72 >> 2]) {
                break c
              }
              if(HEAP32[a + 76 >> 2] == HEAP32[b + 76 >> 2]) {
                break b
              }
            }
          }while(0);
          c = 1;
          d = 32;
          break a
        }
      }while(0);
      c = 0;
      d = 32;
      break a
    }
  }while(0);
  d == 31 && (c = 1);
  return c
}
_h264bsdCompareSeqParamSets.X = 1;
function _h264bsdDecodePicParamSet(a, b) {
  var d = STACKTOP;
  STACKTOP += 8;
  var c, e, f, g, h = d + 4;
  _H264SwDecMemset(b, 0, 72);
  f = _h264bsdDecodeExpGolombUnsigned(a, b);
  c = f != 0 ? 1 : 2;
  a:do {
    if(c == 1) {
      e = f
    }else {
      if(c == 2) {
        c = HEAPU32[b >> 2] >= 256 ? 3 : 4;
        do {
          if(c == 3) {
            e = 1
          }else {
            if(c == 4) {
              f = _h264bsdDecodeExpGolombUnsigned(a, b + 4);
              c = f != 0 ? 5 : 6;
              do {
                if(c == 5) {
                  e = f
                }else {
                  if(c == 6) {
                    c = HEAPU32[b + 4 >> 2] >= 32 ? 7 : 8;
                    do {
                      if(c == 7) {
                        e = 1
                      }else {
                        if(c == 8) {
                          f = _h264bsdGetBits(a, 1);
                          c = f != 0 ? 9 : 10;
                          do {
                            if(c == 9) {
                              e = 1
                            }else {
                              if(c == 10) {
                                f = _h264bsdGetBits(a, 1);
                                c = f == -1 ? 11 : 12;
                                do {
                                  if(c == 11) {
                                    e = 1
                                  }else {
                                    if(c == 12) {
                                      HEAP32[b + 8 >> 2] = f == 1 ? 1 : 0;
                                      f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                      c = f != 0 ? 13 : 14;
                                      do {
                                        if(c == 13) {
                                          e = f
                                        }else {
                                          if(c == 14) {
                                            HEAP32[b + 12 >> 2] = HEAP32[d >> 2] + 1;
                                            c = HEAPU32[b + 12 >> 2] > 8 ? 15 : 16;
                                            do {
                                              if(c == 15) {
                                                e = 1
                                              }else {
                                                if(c == 16) {
                                                  c = HEAPU32[b + 12 >> 2] > 1 ? 17 : 58;
                                                  i:do {
                                                    if(c == 17) {
                                                      f = _h264bsdDecodeExpGolombUnsigned(a, b + 16);
                                                      c = f != 0 ? 18 : 19;
                                                      do {
                                                        if(c == 18) {
                                                          e = f;
                                                          break a
                                                        }else {
                                                          if(c == 19) {
                                                            c = HEAPU32[b + 16 >> 2] > 6 ? 20 : 21;
                                                            do {
                                                              if(c == 20) {
                                                                e = 1;
                                                                break a
                                                              }else {
                                                                if(c == 21) {
                                                                  g = b;
                                                                  c = HEAP32[b + 16 >> 2] == 0 ? 22 : 29;
                                                                  do {
                                                                    if(c == 22) {
                                                                      var j = _H264SwDecMalloc(HEAP32[g + 12 >> 2] << 2);
                                                                      HEAP32[b + 20 >> 2] = j;
                                                                      c = HEAP32[b + 20 >> 2] == 0 ? 23 : 24;
                                                                      do {
                                                                        if(c == 23) {
                                                                          e = 65535;
                                                                          break a
                                                                        }else {
                                                                          if(c == 24) {
                                                                            g = 0;
                                                                            n:for(;;) {
                                                                              if(!(g < HEAPU32[b + 12 >> 2])) {
                                                                                break i
                                                                              }
                                                                              f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                                                              if(f != 0) {
                                                                                break n
                                                                              }
                                                                              HEAP32[HEAP32[b + 20 >> 2] + (g << 2) >> 2] = HEAP32[d >> 2] + 1;
                                                                              g += 1
                                                                            }
                                                                            e = f;
                                                                            break a
                                                                          }
                                                                        }
                                                                      }while(0)
                                                                    }else {
                                                                      if(c == 29) {
                                                                        j = b;
                                                                        c = HEAP32[g + 16 >> 2] == 2 ? 30 : 40;
                                                                        do {
                                                                          if(c == 30) {
                                                                            g = _H264SwDecMalloc(HEAP32[j + 12 >> 2] - 1 << 2);
                                                                            HEAP32[b + 24 >> 2] = g;
                                                                            g = _H264SwDecMalloc(HEAP32[b + 12 >> 2] - 1 << 2);
                                                                            HEAP32[b + 28 >> 2] = g;
                                                                            c = HEAP32[b + 24 >> 2] == 0 ? 32 : 31;
                                                                            n:do {
                                                                              if(c == 31) {
                                                                                if(HEAP32[b + 28 >> 2] == 0) {
                                                                                  break n
                                                                                }
                                                                                g = 0;
                                                                                o:for(;;) {
                                                                                  if(!(g < HEAP32[b + 12 >> 2] - 1)) {
                                                                                    break i
                                                                                  }
                                                                                  f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                                                                  if(f != 0) {
                                                                                    c = 36;
                                                                                    break o
                                                                                  }
                                                                                  HEAP32[HEAP32[b + 24 >> 2] + (g << 2) >> 2] = HEAP32[d >> 2];
                                                                                  f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                                                                  if(f != 0) {
                                                                                    c = 38;
                                                                                    break o
                                                                                  }
                                                                                  HEAP32[HEAP32[b + 28 >> 2] + (g << 2) >> 2] = HEAP32[d >> 2];
                                                                                  g += 1
                                                                                }
                                                                                do {
                                                                                  if(c == 36) {
                                                                                    e = f;
                                                                                    break a
                                                                                  }else {
                                                                                    if(c == 38) {
                                                                                      e = f;
                                                                                      break a
                                                                                    }
                                                                                  }
                                                                                }while(0)
                                                                              }
                                                                            }while(0);
                                                                            e = 65535;
                                                                            break a
                                                                          }else {
                                                                            if(c == 40) {
                                                                              c = HEAP32[j + 16 >> 2] == 3 ? 43 : 41;
                                                                              n:do {
                                                                                if(c == 41) {
                                                                                  if(HEAP32[b + 16 >> 2] == 4) {
                                                                                    break n
                                                                                  }
                                                                                  if(HEAP32[b + 16 >> 2] == 5) {
                                                                                    break n
                                                                                  }
                                                                                  if(HEAP32[b + 16 >> 2] != 6) {
                                                                                    break i
                                                                                  }
                                                                                  f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                                                                  c = f != 0 ? 50 : 51;
                                                                                  do {
                                                                                    if(c == 50) {
                                                                                      e = f;
                                                                                      break a
                                                                                    }else {
                                                                                      if(c == 51) {
                                                                                        HEAP32[b + 40 >> 2] = HEAP32[d >> 2] + 1;
                                                                                        c = _H264SwDecMalloc(HEAP32[b + 40 >> 2] << 2);
                                                                                        HEAP32[b + 44 >> 2] = c;
                                                                                        c = HEAP32[b + 44 >> 2] == 0 ? 52 : 53;
                                                                                        do {
                                                                                          if(c == 52) {
                                                                                            e = 65535;
                                                                                            break a
                                                                                          }else {
                                                                                            if(c == 53) {
                                                                                              f = HEAP32[_CeilLog2NumSliceGroups + (HEAP32[b + 12 >> 2] - 1 << 2) >> 2];
                                                                                              g = 0;
                                                                                              q:for(;;) {
                                                                                                if(!(g < HEAPU32[b + 40 >> 2])) {
                                                                                                  break i
                                                                                                }
                                                                                                j = _h264bsdGetBits(a, f);
                                                                                                HEAP32[HEAP32[b + 44 >> 2] + (g << 2) >> 2] = j;
                                                                                                if(HEAPU32[HEAP32[b + 44 >> 2] + (g << 2) >> 2] >= HEAPU32[b + 12 >> 2]) {
                                                                                                  break q
                                                                                                }
                                                                                                g += 1
                                                                                              }
                                                                                              e = 1;
                                                                                              break a
                                                                                            }
                                                                                          }
                                                                                        }while(0)
                                                                                      }
                                                                                    }
                                                                                  }while(0)
                                                                                }
                                                                              }while(0);
                                                                              f = c = _h264bsdGetBits(a, 1);
                                                                              c = c == -1 ? 44 : 45;
                                                                              do {
                                                                                if(c == 44) {
                                                                                  e = 1;
                                                                                  break a
                                                                                }else {
                                                                                  if(c == 45) {
                                                                                    HEAP32[b + 32 >> 2] = f == 1 ? 1 : 0;
                                                                                    f = _h264bsdDecodeExpGolombUnsigned(a, d);
                                                                                    c = f != 0 ? 46 : 47;
                                                                                    do {
                                                                                      if(c == 46) {
                                                                                        e = f;
                                                                                        break a
                                                                                      }else {
                                                                                        c == 47 && (HEAP32[b + 36 >> 2] = HEAP32[d >> 2] + 1)
                                                                                      }
                                                                                    }while(0)
                                                                                  }
                                                                                }
                                                                              }while(0)
                                                                            }
                                                                          }
                                                                        }while(0)
                                                                      }
                                                                    }
                                                                  }while(0)
                                                                }
                                                              }
                                                            }while(0)
                                                          }
                                                        }
                                                      }while(0)
                                                    }
                                                  }while(0);
                                                  f = g = _h264bsdDecodeExpGolombUnsigned(a, d);
                                                  c = g != 0 ? 59 : 60;
                                                  c == 59 ? e = f : c == 60 && (c = HEAPU32[d >> 2] > 31 ? 61 : 62, c == 61 ? e = 1 : c == 62 && (HEAP32[b + 48 >> 2] = HEAP32[d >> 2] + 1, f = _h264bsdDecodeExpGolombUnsigned(a, d), c = f != 0 ? 63 : 64, c == 63 ? e = f : c == 64 && (c = HEAPU32[d >> 2] > 31 ? 65 : 66, c == 65 ? e = 1 : c == 66 && (f = _h264bsdGetBits(a, 1), c = f != 0 ? 67 : 68, c == 67 ? e = 1 : c == 68 && (f = _h264bsdGetBits(a, 2), c = f > 2 ? 69 : 70, c == 69 ? e = 1 : c == 70 && 
                                                  (f = _h264bsdDecodeExpGolombSigned(a, h), c = f != 0 ? 71 : 72, c == 71 ? e = f : c == 72 && (c = HEAP32[h >> 2] < -26 | HEAP32[h >> 2] > 25 ? 73 : 74, c == 73 ? e = 1 : c == 74 && (HEAP32[b + 52 >> 2] = HEAP32[h >> 2] + 26, f = _h264bsdDecodeExpGolombSigned(a, h), c = f != 0 ? 75 : 76, c == 75 ? e = f : c == 76 && (c = HEAP32[h >> 2] < -26 | HEAP32[h >> 2] > 25 ? 77 : 78, c == 77 ? e = 1 : c == 78 && (f = _h264bsdDecodeExpGolombSigned(a, h), c = 
                                                  f != 0 ? 79 : 80, c == 79 ? e = f : c == 80 && (c = HEAP32[h >> 2] < -12 | HEAP32[h >> 2] > 12 ? 81 : 82, c == 81 ? e = 1 : c == 82 && (HEAP32[b + 56 >> 2] = HEAP32[h >> 2], f = _h264bsdGetBits(a, 1), c = f == -1 ? 83 : 84, c == 83 ? e = 1 : c == 84 && (HEAP32[b + 60 >> 2] = f == 1 ? 1 : 0, f = _h264bsdGetBits(a, 1), c = f == -1 ? 85 : 86, c == 85 ? e = 1 : c == 86 && (HEAP32[b + 64 >> 2] = f == 1 ? 1 : 0, f = _h264bsdGetBits(a, 1), c = f == -1 ? 
                                                  87 : 88, c == 87 ? e = 1 : c == 88 && (HEAP32[b + 68 >> 2] = f == 1 ? 1 : 0, f = _h264bsdRbspTrailingBits(a), e = 0)))))))))))))))
                                                }
                                              }
                                            }while(0)
                                          }
                                        }
                                      }while(0)
                                    }
                                  }
                                }while(0)
                              }
                            }
                          }while(0)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = d;
  return e
}
_h264bsdDecodePicParamSet.X = 1;
function _h264bsdDecodeSliceHeader(a, b, d, c, e) {
  var f = STACKTOP;
  STACKTOP += 8;
  var g, h, j, l = f + 4, k;
  _H264SwDecMemset(b, 0, 988);
  k = HEAP32[d + 56 >> 2] * HEAP32[d + 52 >> 2];
  j = _h264bsdDecodeExpGolombUnsigned(a, f);
  g = j != 0 ? 1 : 2;
  a:do {
    if(g == 1) {
      h = j
    }else {
      if(g == 2) {
        HEAP32[b >> 2] = HEAP32[f >> 2];
        g = HEAPU32[f >> 2] >= k ? 3 : 4;
        do {
          if(g == 3) {
            h = 1
          }else {
            if(g == 4) {
              j = _h264bsdDecodeExpGolombUnsigned(a, f);
              g = j != 0 ? 5 : 6;
              do {
                if(g == 5) {
                  h = j
                }else {
                  if(g == 6) {
                    HEAP32[b + 4 >> 2] = HEAP32[f >> 2];
                    g = HEAP32[b + 4 >> 2] == 2 ? 13 : 7;
                    d:do {
                      if(g == 7) {
                        if(HEAP32[b + 4 >> 2] == 7) {
                          break d
                        }
                        g = HEAP32[b + 4 >> 2] == 0 ? 10 : 9;
                        e:do {
                          if(g == 9) {
                            g = HEAP32[b + 4 >> 2] == 5 ? 10 : 12;
                            break e
                          }
                        }while(0);
                        e:do {
                          if(g == 10) {
                            if(HEAP32[e >> 2] == 5) {
                              break e
                            }
                            if(HEAP32[d + 44 >> 2] != 0) {
                              break d
                            }
                          }
                        }while(0);
                        h = 1;
                        break a
                      }
                    }while(0);
                    j = g = _h264bsdDecodeExpGolombUnsigned(a, f);
                    g = g != 0 ? 14 : 15;
                    do {
                      if(g == 14) {
                        h = j
                      }else {
                        if(g == 15) {
                          HEAP32[b + 8 >> 2] = HEAP32[f >> 2];
                          g = HEAP32[b + 8 >> 2] != HEAP32[c >> 2] ? 16 : 17;
                          do {
                            if(g == 16) {
                              h = 1
                            }else {
                              if(g == 17) {
                                j = 0;
                                if(HEAPU32[d + 12 >> 2] >>> j != 0) {
                                  var m = j;
                                  g = 18
                                }else {
                                  var o = j;
                                  g = 19
                                }
                                f:do {
                                  if(g == 18) {
                                    for(;;) {
                                      if(j = m + 1, HEAPU32[d + 12 >> 2] >>> j != 0) {
                                        m = j
                                      }else {
                                        o = j;
                                        break f
                                      }
                                    }
                                  }
                                }while(0);
                                j = o - 1;
                                j = g = _h264bsdGetBits(a, j);
                                g = g == -1 ? 20 : 21;
                                do {
                                  if(g == 20) {
                                    h = 1
                                  }else {
                                    if(g == 21) {
                                      g = HEAP32[e >> 2] == 5 ? 22 : 24;
                                      g:do {
                                        if(g == 22) {
                                          if(j == 0) {
                                            break g
                                          }
                                          h = 1;
                                          break a
                                        }
                                      }while(0);
                                      HEAP32[b + 12 >> 2] = j;
                                      g = HEAP32[e >> 2] == 5 ? 25 : 29;
                                      g:do {
                                        if(g == 25) {
                                          j = _h264bsdDecodeExpGolombUnsigned(a, f);
                                          g = j != 0 ? 26 : 27;
                                          do {
                                            if(g == 26) {
                                              h = j;
                                              break a
                                            }else {
                                              if(g == 27) {
                                                HEAP32[b + 16 >> 2] = HEAP32[f >> 2];
                                                if(!(HEAPU32[f >> 2] > 65535)) {
                                                  break g
                                                }
                                                h = 1;
                                                break a
                                              }
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      g = HEAP32[d + 16 >> 2] == 0 ? 30 : 44;
                                      g:do {
                                        if(g == 30) {
                                          j = 0;
                                          if(HEAPU32[d + 20 >> 2] >>> j != 0) {
                                            var p = j;
                                            g = 31
                                          }else {
                                            var r = j;
                                            g = 32
                                          }
                                          h:do {
                                            if(g == 31) {
                                              for(;;) {
                                                if(j = p + 1, HEAPU32[d + 20 >> 2] >>> j != 0) {
                                                  p = j
                                                }else {
                                                  r = j;
                                                  break h
                                                }
                                              }
                                            }
                                          }while(0);
                                          j = r - 1;
                                          j = g = _h264bsdGetBits(a, j);
                                          g = g == -1 ? 33 : 34;
                                          do {
                                            if(g == 33) {
                                              h = 1;
                                              break a
                                            }else {
                                              if(g == 34) {
                                                HEAP32[b + 20 >> 2] = j;
                                                g = HEAP32[c + 8 >> 2] != 0 ? 35 : 38;
                                                do {
                                                  if(g == 35) {
                                                    j = _h264bsdDecodeExpGolombSigned(a, l);
                                                    g = j != 0 ? 36 : 37;
                                                    do {
                                                      if(g == 36) {
                                                        h = j;
                                                        break a
                                                      }else {
                                                        g == 37 && (HEAP32[b + 24 >> 2] = HEAP32[l >> 2])
                                                      }
                                                    }while(0)
                                                  }
                                                }while(0);
                                                if(HEAP32[e >> 2] != 5) {
                                                  break g
                                                }
                                                g = HEAPU32[b + 20 >> 2] > Math.floor(HEAPU32[d + 20 >> 2] / 2) ? 43 : 40;
                                                do {
                                                  if(g == 40) {
                                                    j = HEAP32[b + 20 >> 2];
                                                    if(HEAP32[b + 20 >> 2] < HEAP32[b + 24 >> 2] + HEAP32[b + 20 >> 2]) {
                                                      var q = j;
                                                      g = 42
                                                    }else {
                                                      g = 41
                                                    }
                                                    g == 41 && (q = HEAP32[b + 24 >> 2] + j);
                                                    if(q == 0) {
                                                      break g
                                                    }
                                                  }
                                                }while(0);
                                                h = 1;
                                                break a
                                              }
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      g = HEAP32[d + 16 >> 2] == 1 ? 45 : 57;
                                      g:do {
                                        if(g == 45) {
                                          if(HEAP32[d + 24 >> 2] != 0) {
                                            break g
                                          }
                                          j = _h264bsdDecodeExpGolombSigned(a, l);
                                          g = j != 0 ? 47 : 48;
                                          do {
                                            if(g == 47) {
                                              h = j;
                                              break a
                                            }else {
                                              if(g == 48) {
                                                HEAP32[b + 28 >> 2] = HEAP32[l >> 2];
                                                g = HEAP32[c + 8 >> 2] != 0 ? 49 : 52;
                                                do {
                                                  if(g == 49) {
                                                    j = _h264bsdDecodeExpGolombSigned(a, l);
                                                    g = j != 0 ? 50 : 51;
                                                    do {
                                                      if(g == 50) {
                                                        h = j;
                                                        break a
                                                      }else {
                                                        g == 51 && (HEAP32[b + 32 >> 2] = HEAP32[l >> 2])
                                                      }
                                                    }while(0)
                                                  }
                                                }while(0);
                                                if(HEAP32[e >> 2] != 5) {
                                                  break g
                                                }
                                                j = HEAP32[b + 28 >> 2];
                                                if(HEAP32[b + 28 >> 2] < HEAP32[d + 32 >> 2] + HEAP32[b + 28 >> 2] + HEAP32[b + 32 >> 2]) {
                                                  var n = j;
                                                  g = 55
                                                }else {
                                                  g = 54
                                                }
                                                g == 54 && (n = HEAP32[d + 32 >> 2] + j + HEAP32[b + 32 >> 2]);
                                                if(n == 0) {
                                                  break g
                                                }
                                                h = 1;
                                                break a
                                              }
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      g = HEAP32[c + 68 >> 2] != 0 ? 58 : 62;
                                      g:do {
                                        if(g == 58) {
                                          j = _h264bsdDecodeExpGolombUnsigned(a, f);
                                          g = j != 0 ? 59 : 60;
                                          do {
                                            if(g == 59) {
                                              h = j;
                                              break a
                                            }else {
                                              if(g == 60) {
                                                HEAP32[b + 36 >> 2] = HEAP32[f >> 2];
                                                if(!(HEAPU32[f >> 2] > 127)) {
                                                  break g
                                                }
                                                h = 1;
                                                break a
                                              }
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      g = HEAP32[b + 4 >> 2] == 0 ? 64 : 63;
                                      g:do {
                                        if(g == 63) {
                                          g = HEAP32[b + 4 >> 2] == 5 ? 64 : 75;
                                          break g
                                        }
                                      }while(0);
                                      do {
                                        if(g == 64) {
                                          j = g = _h264bsdGetBits(a, 1);
                                          g = g == -1 ? 65 : 66;
                                          do {
                                            if(g == 65) {
                                              h = 1;
                                              break a
                                            }else {
                                              if(g == 66) {
                                                HEAP32[b + 40 >> 2] = j;
                                                g = HEAP32[b + 40 >> 2] != 0 ? 67 : 72;
                                                do {
                                                  if(g == 67) {
                                                    j = _h264bsdDecodeExpGolombUnsigned(a, f);
                                                    g = j != 0 ? 68 : 69;
                                                    do {
                                                      if(g == 68) {
                                                        h = j;
                                                        break a
                                                      }else {
                                                        if(g == 69) {
                                                          g = HEAPU32[f >> 2] > 15 ? 70 : 71;
                                                          do {
                                                            if(g == 70) {
                                                              h = 1;
                                                              break a
                                                            }else {
                                                              g == 71 && (HEAP32[b + 44 >> 2] = HEAP32[f >> 2] + 1)
                                                            }
                                                          }while(0)
                                                        }
                                                      }
                                                    }while(0)
                                                  }else {
                                                    if(g == 72) {
                                                      g = HEAPU32[c + 48 >> 2] > 16 ? 73 : 74;
                                                      do {
                                                        if(g == 73) {
                                                          h = 1;
                                                          break a
                                                        }else {
                                                          g == 74 && (HEAP32[b + 44 >> 2] = HEAP32[c + 48 >> 2])
                                                        }
                                                      }while(0)
                                                    }
                                                  }
                                                }while(0)
                                              }
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      g = HEAP32[b + 4 >> 2] == 0 ? 77 : 76;
                                      g:do {
                                        if(g == 76) {
                                          g = HEAP32[b + 4 >> 2] == 5 ? 77 : 79;
                                          break g
                                        }
                                      }while(0);
                                      g:do {
                                        if(g == 77) {
                                          j = g = _RefPicListReordering(a, b + 68, HEAP32[b + 44 >> 2], HEAP32[d + 12 >> 2]);
                                          if(g == 0) {
                                            break g
                                          }
                                          h = j;
                                          break a
                                        }
                                      }while(0);
                                      g = HEAP32[e + 4 >> 2] != 0 ? 80 : 82;
                                      g:do {
                                        if(g == 80) {
                                          j = _DecRefPicMarking(a, b + 276, HEAP32[e >> 2], HEAP32[d + 44 >> 2]);
                                          if(j == 0) {
                                            break g
                                          }
                                          h = j;
                                          break a
                                        }
                                      }while(0);
                                      j = g = _h264bsdDecodeExpGolombSigned(a, l);
                                      g = g != 0 ? 83 : 84;
                                      do {
                                        if(g == 83) {
                                          h = j
                                        }else {
                                          if(g == 84) {
                                            HEAP32[b + 48 >> 2] = HEAP32[l >> 2];
                                            HEAP32[l >> 2] += HEAP32[c + 52 >> 2];
                                            g = HEAP32[l >> 2] < 0 | HEAP32[l >> 2] > 51 ? 85 : 86;
                                            do {
                                              if(g == 85) {
                                                h = 1
                                              }else {
                                                if(g == 86) {
                                                  g = HEAP32[c + 60 >> 2] != 0 ? 87 : 101;
                                                  i:do {
                                                    if(g == 87) {
                                                      j = _h264bsdDecodeExpGolombUnsigned(a, f);
                                                      g = j != 0 ? 88 : 89;
                                                      do {
                                                        if(g == 88) {
                                                          h = j;
                                                          break a
                                                        }else {
                                                          if(g == 89) {
                                                            HEAP32[b + 52 >> 2] = HEAP32[f >> 2];
                                                            g = HEAPU32[b + 52 >> 2] > 2 ? 90 : 91;
                                                            do {
                                                              if(g == 90) {
                                                                h = 1;
                                                                break a
                                                              }else {
                                                                if(g == 91) {
                                                                  if(HEAP32[b + 52 >> 2] == 1) {
                                                                    break i
                                                                  }
                                                                  j = _h264bsdDecodeExpGolombSigned(a, l);
                                                                  g = j != 0 ? 93 : 94;
                                                                  do {
                                                                    if(g == 93) {
                                                                      h = j;
                                                                      break a
                                                                    }else {
                                                                      if(g == 94) {
                                                                        g = HEAP32[l >> 2] < -6 | HEAP32[l >> 2] > 6 ? 95 : 96;
                                                                        do {
                                                                          if(g == 95) {
                                                                            h = 1;
                                                                            break a
                                                                          }else {
                                                                            if(g == 96) {
                                                                              HEAP32[b + 56 >> 2] = HEAP32[l >> 2] << 1;
                                                                              j = _h264bsdDecodeExpGolombSigned(a, l);
                                                                              g = j != 0 ? 97 : 98;
                                                                              do {
                                                                                if(g == 97) {
                                                                                  h = j;
                                                                                  break a
                                                                                }else {
                                                                                  if(g == 98) {
                                                                                    g = HEAP32[l >> 2] < -6 | HEAP32[l >> 2] > 6 ? 99 : 100;
                                                                                    do {
                                                                                      if(g == 99) {
                                                                                        h = 1;
                                                                                        break a
                                                                                      }else {
                                                                                        g == 100 && (HEAP32[b + 60 >> 2] = HEAP32[l >> 2] << 1)
                                                                                      }
                                                                                    }while(0)
                                                                                  }
                                                                                }
                                                                              }while(0)
                                                                            }
                                                                          }
                                                                        }while(0)
                                                                      }
                                                                    }
                                                                  }while(0)
                                                                }
                                                              }
                                                            }while(0)
                                                          }
                                                        }
                                                      }while(0)
                                                    }
                                                  }while(0);
                                                  g = HEAPU32[c + 12 >> 2] > 1 ? 102 : 108;
                                                  i:do {
                                                    if(g == 102) {
                                                      if(!(HEAPU32[c + 16 >> 2] >= 3)) {
                                                        g = 108;
                                                        break i
                                                      }
                                                      if(!(HEAPU32[c + 16 >> 2] <= 5)) {
                                                        g = 108;
                                                        break i
                                                      }
                                                      j = _NumSliceGroupChangeCycleBits(k, HEAP32[c + 36 >> 2]);
                                                      h = _h264bsdGetBits(a, j);
                                                      HEAP32[f >> 2] = h;
                                                      g = HEAP32[f >> 2] == -1 ? 105 : 106;
                                                      do {
                                                        if(g == 105) {
                                                          h = 1;
                                                          break a
                                                        }else {
                                                          if(g == 106) {
                                                            HEAP32[b + 64 >> 2] = HEAP32[f >> 2];
                                                            j = Math.floor((k - 1 + HEAP32[c + 36 >> 2]) / HEAPU32[c + 36 >> 2]);
                                                            if(!(HEAPU32[b + 64 >> 2] > j)) {
                                                              g = 108;
                                                              break i
                                                            }
                                                            h = 1;
                                                            break a
                                                          }
                                                        }
                                                      }while(0)
                                                    }
                                                  }while(0);
                                                  h = 0
                                                }
                                              }
                                            }while(0)
                                          }
                                        }
                                      }while(0)
                                    }
                                  }
                                }while(0)
                              }
                            }
                          }while(0)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = f;
  return h
}
_h264bsdDecodeSliceHeader.X = 1;
function _NumSliceGroupChangeCycleBits(a, b) {
  var d, c, e = Math.floor(a / b);
  d = a % b != 0 ? 1 : 2;
  d == 1 ? c = e + 2 : d == 2 && (c = e + 1);
  d = 0;
  a:for(;;) {
    if(d = e = d + 1, (-1 << e & c) == 0) {
      break a
    }
  }
  d -= 1;
  (((1 << d) - 1 & c) != 0 ? 6 : 7) == 6 && (d += 1);
  return d
}
function _RefPicListReordering(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 8;
  var f, g, h, j = e + 4;
  h = _h264bsdGetBits(a, 1);
  f = h == -1 ? 1 : 2;
  a:do {
    if(f == 1) {
      g = 1
    }else {
      if(f == 2) {
        HEAP32[b >> 2] = h;
        f = HEAP32[b >> 2] != 0 ? 3 : 24;
        b:do {
          if(f == 3) {
            g = 0;
            c:for(;;) {
              if(g > d) {
                f = 5;
                break c
              }
              h = _h264bsdDecodeExpGolombUnsigned(a, j);
              if(h != 0) {
                f = 7;
                break c
              }
              if(HEAPU32[j >> 2] > 3) {
                f = 9;
                break c
              }
              HEAP32[b + 4 + g * 12 >> 2] = HEAP32[j >> 2];
              f = HEAP32[j >> 2] == 0 | HEAP32[j >> 2] == 1 ? 11 : 16;
              d:do {
                if(f == 11) {
                  h = _h264bsdDecodeExpGolombUnsigned(a, e);
                  if(h != 0) {
                    f = 12;
                    break c
                  }
                  if(HEAPU32[e >> 2] >= c) {
                    f = 14;
                    break c
                  }
                  HEAP32[b + 4 + g * 12 + 4 >> 2] = HEAP32[e >> 2] + 1;
                  f = 20;
                  break d
                }else {
                  if(f == 16) {
                    if(HEAPU32[j >> 2] != 2) {
                      var l = HEAPU32[j >> 2];
                      f = 21;
                      break d
                    }
                    h = _h264bsdDecodeExpGolombUnsigned(a, e);
                    if(h != 0) {
                      f = 18;
                      break c
                    }
                    HEAP32[b + 4 + g * 12 + 8 >> 2] = HEAP32[e >> 2];
                    f = 20;
                    break d
                  }
                }
              }while(0);
              f == 20 && (l = HEAP32[j >> 2]);
              g += 1;
              if(l == 3) {
                f = 22;
                break c
              }
            }
            do {
              if(f == 5) {
                g = 1;
                break a
              }else {
                if(f == 7) {
                  g = h;
                  break a
                }else {
                  if(f == 9) {
                    g = 1;
                    break a
                  }else {
                    if(f == 12) {
                      g = h;
                      break a
                    }else {
                      if(f == 14) {
                        g = 1;
                        break a
                      }else {
                        if(f == 22) {
                          if(g != 1) {
                            f = 24;
                            break b
                          }
                          g = 1;
                          break a
                        }else {
                          if(f == 18) {
                            g = h;
                            break a
                          }
                        }
                      }
                    }
                  }
                }
              }
            }while(0)
          }
        }while(0);
        g = 0
      }
    }
  }while(0);
  STACKTOP = e;
  return g
}
_RefPicListReordering.X = 1;
function _DecRefPicMarking(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 8;
  var f, g, h, j = e + 4, l, k, m, o;
  o = m = k = l = 0;
  h = d == 5;
  var d = _h264bsdGetBits(a, 1), p = d == -1;
  f = h ? 1 : 8;
  a:do {
    if(f == 1) {
      f = p ? 2 : 3;
      do {
        if(f == 2) {
          g = 1;
          f = 53;
          break a
        }else {
          if(f == 3) {
            HEAP32[b >> 2] = d;
            d = _h264bsdGetBits(a, 1);
            f = d == -1 ? 4 : 5;
            do {
              if(f == 4) {
                g = 1;
                f = 53;
                break a
              }else {
                if(f == 5) {
                  HEAP32[b + 4 >> 2] = d;
                  if(c != 0) {
                    f = 52;
                    break a
                  }
                  if(HEAP32[b + 4 >> 2] == 0) {
                    f = 52;
                    break a
                  }
                  g = 1;
                  f = 53;
                  break a
                }
              }
            }while(0)
          }
        }
      }while(0)
    }else {
      if(f == 8) {
        f = p ? 9 : 10;
        do {
          if(f == 9) {
            g = 1;
            f = 53;
            break a
          }else {
            if(f == 10) {
              HEAP32[b + 8 >> 2] = d;
              if(HEAP32[b + 8 >> 2] == 0) {
                f = 52;
                break a
              }
              h = 0;
              c:for(;;) {
                if(h > (c << 1) + 2) {
                  f = 13;
                  break c
                }
                d = _h264bsdDecodeExpGolombUnsigned(a, j);
                if(d != 0) {
                  f = 15;
                  break c
                }
                if(HEAPU32[j >> 2] > 6) {
                  f = 17;
                  break c
                }
                HEAP32[b + 12 + h * 20 >> 2] = HEAP32[j >> 2];
                f = HEAPU32[j >> 2];
                if(HEAP32[j >> 2] == 1 | f == 3) {
                  f = 19
                }else {
                  var r = f;
                  f = 22
                }
                do {
                  if(f == 19) {
                    d = _h264bsdDecodeExpGolombUnsigned(a, e);
                    if(d != 0) {
                      f = 20;
                      break c
                    }
                    HEAP32[b + 12 + h * 20 + 4 >> 2] = HEAP32[e >> 2] + 1;
                    r = HEAP32[j >> 2]
                  }
                }while(0);
                f = r == 2 ? 23 : 26;
                do {
                  if(f == 23) {
                    d = _h264bsdDecodeExpGolombUnsigned(a, e);
                    if(d != 0) {
                      f = 24;
                      break c
                    }
                    HEAP32[b + 12 + h * 20 + 8 >> 2] = HEAP32[e >> 2]
                  }
                }while(0);
                f = HEAP32[j >> 2];
                if(HEAP32[j >> 2] == 3 | f == 6) {
                  f = 27
                }else {
                  var q = f;
                  f = 30
                }
                do {
                  if(f == 27) {
                    d = _h264bsdDecodeExpGolombUnsigned(a, e);
                    if(d != 0) {
                      f = 28;
                      break c
                    }
                    HEAP32[b + 12 + h * 20 + 12 >> 2] = HEAP32[e >> 2];
                    q = HEAP32[j >> 2]
                  }
                }while(0);
                f = q == 4 ? 31 : 39;
                do {
                  if(f == 31) {
                    d = _h264bsdDecodeExpGolombUnsigned(a, e);
                    if(d != 0) {
                      f = 32;
                      break c
                    }
                    if(HEAPU32[e >> 2] > c) {
                      f = 34;
                      break c
                    }
                    f = HEAP32[e >> 2] == 0 ? 36 : 37;
                    f == 36 ? HEAP32[b + 12 + h * 20 + 16 >> 2] = 65535 : f == 37 && (HEAP32[b + 12 + h * 20 + 16 >> 2] = HEAP32[e >> 2] - 1);
                    l += 1
                  }
                }while(0);
                f = HEAP32[j >> 2] == 5 ? 40 : 41;
                f == 40 && (k += 1);
                f = HEAPU32[j >> 2];
                if(HEAP32[j >> 2] != 0 & f <= 3) {
                  f = 42
                }else {
                  var n = f;
                  f = 43
                }
                f == 42 && (o += 1, n = HEAP32[j >> 2]);
                f = n == 6 ? 44 : 45;
                f == 44 && (m += 1);
                h += 1;
                if(HEAP32[j >> 2] == 0) {
                  f = 46;
                  break c
                }
              }
              do {
                if(f == 13) {
                  g = 1;
                  f = 53;
                  break a
                }else {
                  if(f == 15) {
                    g = d;
                    f = 53;
                    break a
                  }else {
                    if(f == 17) {
                      g = 1;
                      f = 53;
                      break a
                    }else {
                      if(f == 20) {
                        g = d;
                        f = 53;
                        break a
                      }else {
                        if(f == 24) {
                          g = d;
                          f = 53;
                          break a
                        }else {
                          if(f == 28) {
                            g = d;
                            f = 53;
                            break a
                          }else {
                            if(f == 32) {
                              g = d;
                              f = 53;
                              break a
                            }else {
                              if(f == 34) {
                                g = 1;
                                f = 53;
                                break a
                              }else {
                                if(f == 46) {
                                  f = l > 1 ? 51 : 47;
                                  d:do {
                                    if(f == 47) {
                                      if(k > 1) {
                                        break d
                                      }
                                      if(m > 1) {
                                        break d
                                      }
                                      if(o == 0) {
                                        f = 52;
                                        break a
                                      }
                                      if(k == 0) {
                                        f = 52;
                                        break a
                                      }
                                    }
                                  }while(0);
                                  g = 1;
                                  f = 53;
                                  break a
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  f == 52 && (g = 0);
  STACKTOP = e;
  return g
}
_DecRefPicMarking.X = 1;
function _h264bsdCheckPpsId(a, b) {
  var d = STACKTOP;
  STACKTOP += 24;
  var c, e, f, g = d + 4, h, j;
  c = a;
  f = g;
  h = c + 20;
  if(f % 4 == c % 4) {
    for(;c % 4 !== 0 && c < h;) {
      HEAP8[f++] = HEAP8[c++]
    }
    c >>= 2;
    f >>= 2;
    for(j = h >> 2;c < j;) {
      HEAP32[f++] = HEAP32[c++]
    }
    c <<= 2;
    f <<= 2
  }
  for(;c < h;) {
    HEAP8[f++] = HEAP8[c++]
  }
  f = _h264bsdDecodeExpGolombUnsigned(g, d);
  c = f != 0 ? 1 : 2;
  c == 1 ? e = f : c == 2 && (f = _h264bsdDecodeExpGolombUnsigned(g, d), c = f != 0 ? 3 : 4, c == 3 ? e = f : c == 4 && (f = _h264bsdDecodeExpGolombUnsigned(g, d), c = f != 0 ? 5 : 6, c == 5 ? e = f : c == 6 && (c = HEAPU32[d >> 2] >= 256 ? 7 : 8, c == 7 ? e = 1 : c == 8 && (HEAP32[b >> 2] = HEAP32[d >> 2], e = 0))));
  STACKTOP = d;
  return e
}
_h264bsdCheckPpsId.X = 1;
function _h264bsdCheckFrameNum(a, b, d) {
  var c = STACKTOP;
  STACKTOP += 24;
  var e, f, g = c + 4, h, j;
  f = g;
  h = a + 20;
  if(f % 4 == a % 4) {
    for(;a % 4 !== 0 && a < h;) {
      HEAP8[f++] = HEAP8[a++]
    }
    a >>= 2;
    f >>= 2;
    for(j = h >> 2;a < j;) {
      HEAP32[f++] = HEAP32[a++]
    }
    a <<= 2;
    f <<= 2
  }
  for(;a < h;) {
    HEAP8[f++] = HEAP8[a++]
  }
  f = _h264bsdDecodeExpGolombUnsigned(g, c);
  a = f != 0 ? 1 : 2;
  do {
    if(a == 1) {
      e = f
    }else {
      if(a == 2) {
        f = _h264bsdDecodeExpGolombUnsigned(g, c);
        a = f != 0 ? 3 : 4;
        do {
          if(a == 3) {
            e = f
          }else {
            if(a == 4) {
              f = _h264bsdDecodeExpGolombUnsigned(g, c);
              a = f != 0 ? 5 : 6;
              do {
                if(a == 5) {
                  e = f
                }else {
                  if(a == 6) {
                    f = 0;
                    if(b >>> f != 0) {
                      var l = f, a = 7
                    }else {
                      var k = f, a = 8
                    }
                    d:do {
                      if(a == 7) {
                        for(;;) {
                          if(f = l + 1, b >>> f != 0) {
                            l = f
                          }else {
                            k = f;
                            break d
                          }
                        }
                      }
                    }while(0);
                    f = k - 1;
                    f = a = _h264bsdGetBits(g, f);
                    a = a == -1 ? 9 : 10;
                    a == 9 ? e = 1 : a == 10 && (HEAP32[d >> 2] = f, e = 0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = c;
  return e
}
_h264bsdCheckFrameNum.X = 1;
function _h264bsdCheckIdrPicId(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 24;
  var f, g, h = e + 4, d = d != 5 ? 1 : 2;
  do {
    if(d == 1) {
      f = 1
    }else {
      if(d == 2) {
        g = h;
        var j, l, d = a;
        j = d + 20;
        if(g % 4 == d % 4) {
          for(;d % 4 !== 0 && d < j;) {
            HEAP8[g++] = HEAP8[d++]
          }
          d >>= 2;
          g >>= 2;
          for(l = j >> 2;d < l;) {
            HEAP32[g++] = HEAP32[d++]
          }
          d <<= 2;
          g <<= 2
        }
        for(;d < j;) {
          HEAP8[g++] = HEAP8[d++]
        }
        g = _h264bsdDecodeExpGolombUnsigned(h, e);
        d = g != 0 ? 3 : 4;
        do {
          if(d == 3) {
            f = g
          }else {
            if(d == 4) {
              g = _h264bsdDecodeExpGolombUnsigned(h, e);
              d = g != 0 ? 5 : 6;
              do {
                if(d == 5) {
                  f = g
                }else {
                  if(d == 6) {
                    g = _h264bsdDecodeExpGolombUnsigned(h, e);
                    d = g != 0 ? 7 : 8;
                    do {
                      if(d == 7) {
                        f = g
                      }else {
                        if(d == 8) {
                          g = 0;
                          if(b >>> g != 0) {
                            var k = g, d = 9
                          }else {
                            var m = g, d = 10
                          }
                          e:do {
                            if(d == 9) {
                              for(;;) {
                                if(g = k + 1, b >>> g != 0) {
                                  k = g
                                }else {
                                  m = g;
                                  break e
                                }
                              }
                            }
                          }while(0);
                          g = m - 1;
                          g = d = _h264bsdGetBits(h, g);
                          d = d == -1 ? 11 : 12;
                          d == 11 ? f = 1 : d == 12 && (g = _h264bsdDecodeExpGolombUnsigned(h, c), d = g != 0 ? 13 : 14, d == 13 ? f = g : d == 14 && (f = 0))
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = e;
  return f
}
_h264bsdCheckIdrPicId.X = 1;
function _h264bsdCheckPicOrderCntLsb(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 24;
  var f, g, h = e + 4, j, l;
  f = h;
  j = a + 20;
  if(f % 4 == a % 4) {
    for(;a % 4 !== 0 && a < j;) {
      HEAP8[f++] = HEAP8[a++]
    }
    a >>= 2;
    f >>= 2;
    for(l = j >> 2;a < l;) {
      HEAP32[f++] = HEAP32[a++]
    }
    a <<= 2;
    f <<= 2
  }
  for(;a < j;) {
    HEAP8[f++] = HEAP8[a++]
  }
  a = _h264bsdDecodeExpGolombUnsigned(h, e);
  f = a != 0 ? 1 : 2;
  a:do {
    if(f == 1) {
      g = a
    }else {
      if(f == 2) {
        a = _h264bsdDecodeExpGolombUnsigned(h, e);
        f = a != 0 ? 3 : 4;
        do {
          if(f == 3) {
            g = a
          }else {
            if(f == 4) {
              a = _h264bsdDecodeExpGolombUnsigned(h, e);
              f = a != 0 ? 5 : 6;
              do {
                if(f == 5) {
                  g = a
                }else {
                  if(f == 6) {
                    a = 0;
                    if(HEAPU32[b + 12 >> 2] >>> a != 0) {
                      var k = a;
                      f = 7
                    }else {
                      var m = a;
                      f = 8
                    }
                    d:do {
                      if(f == 7) {
                        for(;;) {
                          if(a = k + 1, HEAPU32[b + 12 >> 2] >>> a != 0) {
                            k = a
                          }else {
                            m = a;
                            break d
                          }
                        }
                      }
                    }while(0);
                    a = m - 1;
                    a = f = _h264bsdGetBits(h, a);
                    f = f == -1 ? 9 : 10;
                    do {
                      if(f == 9) {
                        g = 1
                      }else {
                        if(f == 10) {
                          f = d == 5 ? 11 : 13;
                          e:do {
                            if(f == 11) {
                              a = _h264bsdDecodeExpGolombUnsigned(h, e);
                              if(a == 0) {
                                break e
                              }
                              g = a;
                              break a
                            }
                          }while(0);
                          a = 0;
                          if(HEAPU32[b + 20 >> 2] >>> a != 0) {
                            var o = a;
                            f = 14
                          }else {
                            var p = a;
                            f = 15
                          }
                          e:do {
                            if(f == 14) {
                              for(;;) {
                                if(a = o + 1, HEAPU32[b + 20 >> 2] >>> a != 0) {
                                  o = a
                                }else {
                                  p = a;
                                  break e
                                }
                              }
                            }
                          }while(0);
                          a = p - 1;
                          a = f = _h264bsdGetBits(h, a);
                          f = f == -1 ? 16 : 17;
                          f == 16 ? g = 1 : f == 17 && (HEAP32[c >> 2] = a, g = 0)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = e;
  return g
}
_h264bsdCheckPicOrderCntLsb.X = 1;
function _h264bsdCheckDeltaPicOrderCntBottom(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 24;
  var f, g, h = e + 4, j, l;
  f = h;
  j = a + 20;
  if(f % 4 == a % 4) {
    for(;a % 4 !== 0 && a < j;) {
      HEAP8[f++] = HEAP8[a++]
    }
    a >>= 2;
    f >>= 2;
    for(l = j >> 2;a < l;) {
      HEAP32[f++] = HEAP32[a++]
    }
    a <<= 2;
    f <<= 2
  }
  for(;a < j;) {
    HEAP8[f++] = HEAP8[a++]
  }
  a = _h264bsdDecodeExpGolombUnsigned(h, e);
  f = a != 0 ? 1 : 2;
  a:do {
    if(f == 1) {
      g = a
    }else {
      if(f == 2) {
        a = _h264bsdDecodeExpGolombUnsigned(h, e);
        f = a != 0 ? 3 : 4;
        do {
          if(f == 3) {
            g = a
          }else {
            if(f == 4) {
              a = _h264bsdDecodeExpGolombUnsigned(h, e);
              f = a != 0 ? 5 : 6;
              do {
                if(f == 5) {
                  g = a
                }else {
                  if(f == 6) {
                    a = 0;
                    if(HEAPU32[b + 12 >> 2] >>> a != 0) {
                      var k = a;
                      f = 7
                    }else {
                      var m = a;
                      f = 8
                    }
                    d:do {
                      if(f == 7) {
                        for(;;) {
                          if(a = k + 1, HEAPU32[b + 12 >> 2] >>> a != 0) {
                            k = a
                          }else {
                            m = a;
                            break d
                          }
                        }
                      }
                    }while(0);
                    a = m - 1;
                    a = f = _h264bsdGetBits(h, a);
                    f = f == -1 ? 9 : 10;
                    do {
                      if(f == 9) {
                        g = 1
                      }else {
                        if(f == 10) {
                          f = d == 5 ? 11 : 13;
                          e:do {
                            if(f == 11) {
                              a = _h264bsdDecodeExpGolombUnsigned(h, e);
                              if(a == 0) {
                                break e
                              }
                              g = a;
                              break a
                            }
                          }while(0);
                          a = 0;
                          if(HEAPU32[b + 20 >> 2] >>> a != 0) {
                            var o = a;
                            f = 14
                          }else {
                            var p = a;
                            f = 15
                          }
                          e:do {
                            if(f == 14) {
                              for(;;) {
                                if(a = o + 1, HEAPU32[b + 20 >> 2] >>> a != 0) {
                                  o = a
                                }else {
                                  p = a;
                                  break e
                                }
                              }
                            }
                          }while(0);
                          a = p - 1;
                          a = f = _h264bsdGetBits(h, a);
                          f = f == -1 ? 16 : 17;
                          f == 16 ? g = 1 : f == 17 && (a = _h264bsdDecodeExpGolombSigned(h, c), f = a != 0 ? 18 : 19, f == 18 ? g = a : f == 19 && (g = 0))
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = e;
  return g
}
_h264bsdCheckDeltaPicOrderCntBottom.X = 1;
function _h264bsdCheckDeltaPicOrderCnt(a, b, d, c, e) {
  var f = STACKTOP;
  STACKTOP += 24;
  var g, h, j = f + 4, l, k;
  g = j;
  l = a + 20;
  if(g % 4 == a % 4) {
    for(;a % 4 !== 0 && a < l;) {
      HEAP8[g++] = HEAP8[a++]
    }
    a >>= 2;
    g >>= 2;
    for(k = l >> 2;a < k;) {
      HEAP32[g++] = HEAP32[a++]
    }
    a <<= 2;
    g <<= 2
  }
  for(;a < l;) {
    HEAP8[g++] = HEAP8[a++]
  }
  a = _h264bsdDecodeExpGolombUnsigned(j, f);
  g = a != 0 ? 1 : 2;
  a:do {
    if(g == 1) {
      h = a
    }else {
      if(g == 2) {
        a = _h264bsdDecodeExpGolombUnsigned(j, f);
        g = a != 0 ? 3 : 4;
        do {
          if(g == 3) {
            h = a
          }else {
            if(g == 4) {
              a = _h264bsdDecodeExpGolombUnsigned(j, f);
              g = a != 0 ? 5 : 6;
              do {
                if(g == 5) {
                  h = a
                }else {
                  if(g == 6) {
                    a = 0;
                    if(HEAPU32[b + 12 >> 2] >>> a != 0) {
                      var m = a;
                      g = 7
                    }else {
                      var o = a;
                      g = 8
                    }
                    d:do {
                      if(g == 7) {
                        for(;;) {
                          if(a = m + 1, HEAPU32[b + 12 >> 2] >>> a != 0) {
                            m = a
                          }else {
                            o = a;
                            break d
                          }
                        }
                      }
                    }while(0);
                    a = o - 1;
                    a = g = _h264bsdGetBits(j, a);
                    g = g == -1 ? 9 : 10;
                    do {
                      if(g == 9) {
                        h = 1
                      }else {
                        if(g == 10) {
                          g = d == 5 ? 11 : 13;
                          e:do {
                            if(g == 11) {
                              a = _h264bsdDecodeExpGolombUnsigned(j, f);
                              if(a == 0) {
                                break e
                              }
                              h = a;
                              break a
                            }
                          }while(0);
                          a = g = _h264bsdDecodeExpGolombSigned(j, e);
                          g = g != 0 ? 14 : 15;
                          do {
                            if(g == 14) {
                              h = a
                            }else {
                              if(g == 15) {
                                g = c != 0 ? 16 : 18;
                                f:do {
                                  if(g == 16) {
                                    a = _h264bsdDecodeExpGolombSigned(j, e + 4);
                                    if(a == 0) {
                                      g = 18;
                                      break f
                                    }
                                    h = a;
                                    break a
                                  }
                                }while(0);
                                h = 0
                              }
                            }
                          }while(0)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = f;
  return h
}
_h264bsdCheckDeltaPicOrderCnt.X = 1;
function _h264bsdCheckRedundantPicCnt(a, b, d, c, e) {
  var f = STACKTOP;
  STACKTOP += 28;
  var g, h, j = f + 4, l = f + 8, k, m;
  g = l;
  k = a + 20;
  if(g % 4 == a % 4) {
    for(;a % 4 !== 0 && a < k;) {
      HEAP8[g++] = HEAP8[a++]
    }
    a >>= 2;
    g >>= 2;
    for(m = k >> 2;a < m;) {
      HEAP32[g++] = HEAP32[a++]
    }
    a <<= 2;
    g <<= 2
  }
  for(;a < k;) {
    HEAP8[g++] = HEAP8[a++]
  }
  a = _h264bsdDecodeExpGolombUnsigned(l, f);
  g = a != 0 ? 1 : 2;
  a:do {
    if(g == 1) {
      h = a
    }else {
      if(g == 2) {
        a = _h264bsdDecodeExpGolombUnsigned(l, f);
        g = a != 0 ? 3 : 4;
        do {
          if(g == 3) {
            h = a
          }else {
            if(g == 4) {
              a = _h264bsdDecodeExpGolombUnsigned(l, f);
              g = a != 0 ? 5 : 6;
              do {
                if(g == 5) {
                  h = a
                }else {
                  if(g == 6) {
                    a = 0;
                    if(HEAPU32[b + 12 >> 2] >>> a != 0) {
                      var o = a;
                      g = 7
                    }else {
                      var p = a;
                      g = 8
                    }
                    d:do {
                      if(g == 7) {
                        for(;;) {
                          if(a = o + 1, HEAPU32[b + 12 >> 2] >>> a != 0) {
                            o = a
                          }else {
                            p = a;
                            break d
                          }
                        }
                      }
                    }while(0);
                    a = p - 1;
                    a = g = _h264bsdGetBits(l, a);
                    g = g == -1 ? 9 : 10;
                    do {
                      if(g == 9) {
                        h = 1
                      }else {
                        if(g == 10) {
                          g = c == 5 ? 11 : 13;
                          e:do {
                            if(g == 11) {
                              a = _h264bsdDecodeExpGolombUnsigned(l, f);
                              if(a == 0) {
                                break e
                              }
                              h = a;
                              break a
                            }
                          }while(0);
                          g = HEAP32[b + 16 >> 2] == 0 ? 14 : 21;
                          e:do {
                            if(g == 14) {
                              a = 0;
                              if(HEAPU32[b + 20 >> 2] >>> a != 0) {
                                var r = a;
                                g = 15
                              }else {
                                var q = a;
                                g = 16
                              }
                              f:do {
                                if(g == 15) {
                                  for(;;) {
                                    if(a = r + 1, HEAPU32[b + 20 >> 2] >>> a != 0) {
                                      r = a
                                    }else {
                                      q = a;
                                      break f
                                    }
                                  }
                                }
                              }while(0);
                              a = q - 1;
                              g = _h264bsdGetBits(l, a) == -1 ? 17 : 18;
                              do {
                                if(g == 17) {
                                  h = 1;
                                  break a
                                }else {
                                  if(g == 18) {
                                    if(HEAP32[d + 8 >> 2] == 0) {
                                      break e
                                    }
                                    a = _h264bsdDecodeExpGolombSigned(l, j);
                                    if(a == 0) {
                                      break e
                                    }
                                    h = a;
                                    break a
                                  }
                                }
                              }while(0)
                            }
                          }while(0);
                          g = HEAP32[b + 16 >> 2] == 1 ? 22 : 28;
                          e:do {
                            if(g == 22) {
                              if(HEAP32[b + 24 >> 2] != 0) {
                                break e
                              }
                              a = _h264bsdDecodeExpGolombSigned(l, j);
                              g = a != 0 ? 24 : 25;
                              do {
                                if(g == 24) {
                                  h = a;
                                  break a
                                }else {
                                  if(g == 25) {
                                    if(HEAP32[d + 8 >> 2] == 0) {
                                      break e
                                    }
                                    a = _h264bsdDecodeExpGolombSigned(l, j);
                                    if(a == 0) {
                                      break e
                                    }
                                    h = a;
                                    break a
                                  }
                                }
                              }while(0)
                            }
                          }while(0);
                          a = g = _h264bsdDecodeExpGolombUnsigned(l, e);
                          g = g != 0 ? 29 : 30;
                          g == 29 ? h = a : g == 30 && (h = 0)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = f;
  return h
}
_h264bsdCheckRedundantPicCnt.X = 1;
function _SetMbParams(a, b, d, c) {
  var e, f;
  e = HEAP32[b + 52 >> 2];
  f = HEAP32[b + 56 >> 2];
  b = HEAP32[b + 60 >> 2];
  HEAP32[a + 4 >> 2] = d;
  HEAP32[a + 8 >> 2] = e;
  HEAP32[a + 12 >> 2] = f;
  HEAP32[a + 16 >> 2] = b;
  HEAP32[a + 24 >> 2] = c
}
function _h264bsdCheckPriorPicsFlag(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 28;
  var f, g, h = e + 4, j = e + 8, l, k;
  f = j;
  l = b + 20;
  if(f % 4 == b % 4) {
    for(;b % 4 !== 0 && b < l;) {
      HEAP8[f++] = HEAP8[b++]
    }
    b >>= 2;
    f >>= 2;
    for(k = l >> 2;b < k;) {
      HEAP32[f++] = HEAP32[b++]
    }
    b <<= 2;
    f <<= 2
  }
  for(;b < l;) {
    HEAP8[f++] = HEAP8[b++]
  }
  b = _h264bsdDecodeExpGolombUnsigned(j, e);
  f = b != 0 ? 1 : 2;
  a:do {
    if(f == 1) {
      g = b
    }else {
      if(f == 2) {
        b = _h264bsdDecodeExpGolombUnsigned(j, e);
        f = b != 0 ? 3 : 4;
        do {
          if(f == 3) {
            g = b
          }else {
            if(f == 4) {
              b = _h264bsdDecodeExpGolombUnsigned(j, e);
              f = b != 0 ? 5 : 6;
              do {
                if(f == 5) {
                  g = b
                }else {
                  if(f == 6) {
                    b = 0;
                    if(HEAPU32[d + 12 >> 2] >>> b != 0) {
                      var m = b;
                      f = 7
                    }else {
                      var o = b;
                      f = 8
                    }
                    d:do {
                      if(f == 7) {
                        for(;;) {
                          if(b = m + 1, HEAPU32[d + 12 >> 2] >>> b != 0) {
                            m = b
                          }else {
                            o = b;
                            break d
                          }
                        }
                      }
                    }while(0);
                    b = o - 1;
                    b = f = _h264bsdGetBits(j, b);
                    f = f == -1 ? 9 : 10;
                    do {
                      if(f == 9) {
                        g = 1
                      }else {
                        if(f == 10) {
                          b = _h264bsdDecodeExpGolombUnsigned(j, e);
                          f = b != 0 ? 11 : 12;
                          do {
                            if(f == 11) {
                              g = b
                            }else {
                              if(f == 12) {
                                f = HEAP32[d + 16 >> 2] == 0 ? 13 : 20;
                                f:do {
                                  if(f == 13) {
                                    b = 0;
                                    if(HEAPU32[d + 20 >> 2] >>> b != 0) {
                                      var p = b;
                                      f = 14
                                    }else {
                                      var r = b;
                                      f = 15
                                    }
                                    g:do {
                                      if(f == 14) {
                                        for(;;) {
                                          if(b = p + 1, HEAPU32[d + 20 >> 2] >>> b != 0) {
                                            p = b
                                          }else {
                                            r = b;
                                            break g
                                          }
                                        }
                                      }
                                    }while(0);
                                    b = r - 1;
                                    b = f = _h264bsdGetBits(j, b);
                                    f = f == -1 ? 16 : 17;
                                    do {
                                      if(f == 16) {
                                        g = 1;
                                        break a
                                      }else {
                                        if(f == 17) {
                                          if(HEAP32[c + 8 >> 2] == 0) {
                                            break f
                                          }
                                          b = _h264bsdDecodeExpGolombSigned(j, h);
                                          if(b == 0) {
                                            break f
                                          }
                                          g = b;
                                          break a
                                        }
                                      }
                                    }while(0)
                                  }
                                }while(0);
                                f = HEAP32[d + 16 >> 2] == 1 ? 21 : 27;
                                f:do {
                                  if(f == 21) {
                                    if(HEAP32[d + 24 >> 2] != 0) {
                                      break f
                                    }
                                    b = _h264bsdDecodeExpGolombSigned(j, h);
                                    f = b != 0 ? 23 : 24;
                                    do {
                                      if(f == 23) {
                                        g = b;
                                        break a
                                      }else {
                                        if(f == 24) {
                                          if(HEAP32[c + 8 >> 2] == 0) {
                                            break f
                                          }
                                          b = _h264bsdDecodeExpGolombSigned(j, h);
                                          if(b == 0) {
                                            break f
                                          }
                                          g = b;
                                          break a
                                        }
                                      }
                                    }while(0)
                                  }
                                }while(0);
                                f = HEAP32[c + 68 >> 2] != 0 ? 28 : 30;
                                f:do {
                                  if(f == 28) {
                                    b = _h264bsdDecodeExpGolombUnsigned(j, e);
                                    if(b == 0) {
                                      break f
                                    }
                                    g = b;
                                    break a
                                  }
                                }while(0);
                                f = _h264bsdGetBits(j, 1);
                                HEAP32[a >> 2] = f;
                                f = HEAP32[a >> 2] == -1 ? 31 : 32;
                                f == 31 ? g = 1 : f == 32 && (g = 0)
                              }
                            }
                          }while(0)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = e;
  return g
}
_h264bsdCheckPriorPicsFlag.X = 1;
function _h264bsdDecodeSliceData(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 440;
  var f, g, h, j, l = e + 432, k, m, o, p, r = e + 436, q;
  h = e + Math.floor(16 - e & 15);
  q = HEAP32[b + 3376 >> 2];
  m = HEAP32[c >> 2];
  k = HEAP32[l >> 2] = 0;
  HEAP32[b + 1192 >> 2] += 1;
  p = HEAP32[b + 1200 >> 2] = 0;
  HEAP32[r >> 2] = HEAP32[c + 48 >> 2] + HEAP32[HEAP32[b + 12 >> 2] + 52 >> 2];
  a:for(;;) {
    f = HEAP32[c + 36 >> 2] != 0 ? 4 : 2;
    do {
      if(f == 2 && HEAP32[HEAP32[b + 1212 >> 2] + m * 216 + 196 >> 2] != 0) {
        f = 3;
        break a
      }
    }while(0);
    _SetMbParams(HEAP32[b + 1212 >> 2] + m * 216, c, HEAP32[b + 1192 >> 2], HEAP32[HEAP32[b + 12 >> 2] + 56 >> 2]);
    f = HEAP32[c + 4 >> 2] == 2 ? 13 : 5;
    b:do {
      if(f == 5) {
        if(HEAP32[c + 4 >> 2] == 7) {
          f = 13;
          break b
        }
        if(k != 0) {
          f = 13;
          break b
        }
        j = _h264bsdDecodeExpGolombUnsigned(a, l);
        if(j != 0) {
          f = 8;
          break a
        }
        if(HEAPU32[l >> 2] > HEAP32[b + 1176 >> 2] - m) {
          f = 10;
          break a
        }
        if(HEAP32[l >> 2] == 0) {
          f = 15;
          break b
        }
        k = 1;
        _H264SwDecMemset(q + 12, 0, 164);
        HEAP32[q >> 2] = 0;
        f = 13;
        break b
      }
    }while(0);
    b:do {
      if(f == 13) {
        if(HEAP32[l >> 2] == 0) {
          f = 15;
          break b
        }
        HEAP32[l >> 2] -= 1;
        f = 17;
        break b
      }
    }while(0);
    do {
      if(f == 15 && (k = 0, j = o = _h264bsdDecodeMacroblockLayer(a, q, HEAP32[b + 1212 >> 2] + m * 216, HEAP32[c + 4 >> 2], HEAP32[c + 44 >> 2]), o != 0)) {
        f = 16;
        break a
      }
    }while(0);
    j = f = _h264bsdDecodeMacroblock(HEAP32[b + 1212 >> 2] + m * 216, q, d, b + 1220, r, m, HEAP32[HEAP32[b + 12 >> 2] + 64 >> 2], h);
    if(f != 0) {
      f = 18;
      break a
    }
    f = HEAP32[HEAP32[b + 1212 >> 2] + m * 216 + 196 >> 2] == 1 ? 20 : 21;
    f == 20 && (p += 1);
    if(_h264bsdMoreRbspData(a) != 0) {
      var n = 1;
      f = 23
    }else {
      f = 22
    }
    f == 22 && (n = HEAP32[l >> 2] != 0);
    o = n ? 1 : 0;
    f = HEAP32[c + 4 >> 2] == 2 ? 25 : 24;
    b:do {
      if(f == 24) {
        f = HEAP32[c + 4 >> 2] == 7 ? 25 : 26;
        break b
      }
    }while(0);
    f == 25 && (HEAP32[b + 1200 >> 2] = m);
    m = _h264bsdNextMbAddress(HEAP32[b + 1172 >> 2], HEAP32[b + 1176 >> 2], m);
    if(o == 0) {
      f = 30;
      break a
    }
    if(m == 0) {
      f = 28;
      break a
    }
    if(o == 0) {
      f = 30;
      break a
    }
  }
  f == 3 ? g = 1 : f == 8 ? g = j : f == 10 ? g = 1 : f == 16 ? g = j : f == 18 ? g = j : f == 30 ? (f = p + HEAP32[b + 1196 >> 2] > HEAPU32[b + 1176 >> 2] ? 31 : 32, f == 31 ? g = 1 : f == 32 && (HEAP32[b + 1196 >> 2] += p, g = 0)) : f == 28 && (g = 1);
  STACKTOP = e;
  return g
}
_h264bsdDecodeSliceData.X = 1;
function _h264bsdMarkSliceCorrupted(a, b) {
  var d, c, e, f, g;
  g = b;
  f = HEAP32[a + 1192 >> 2];
  d = HEAP32[a + 1200 >> 2] != 0 ? 1 : 9;
  do {
    if(d == 1) {
      e = HEAP32[a + 1200 >> 2] - 1;
      c = 0;
      b:for(;;) {
        if(!(e > g)) {
          d = 8;
          break b
        }
        d = HEAP32[HEAP32[a + 1212 >> 2] + e * 216 + 4 >> 2] == f ? 4 : 7;
        do {
          if(d == 4) {
            c += 1;
            var h = c;
            if(HEAPU32[HEAP32[a + 16 >> 2] + 52 >> 2] > 10) {
              d = 5
            }else {
              var j = 10;
              d = 6
            }
            d == 5 && (j = HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2]);
            if(h >= j) {
              d = 8;
              break b
            }
          }
        }while(0);
        e -= 1
      }
      g = e
    }
  }while(0);
  a:for(;;) {
    if(HEAP32[HEAP32[a + 1212 >> 2] + g * 216 + 4 >> 2] != f) {
      break a
    }
    if(HEAP32[HEAP32[a + 1212 >> 2] + g * 216 + 196 >> 2] == 0) {
      break a
    }
    HEAP32[HEAP32[a + 1212 >> 2] + g * 216 + 196 >> 2] -= 1;
    g = _h264bsdNextMbAddress(HEAP32[a + 1172 >> 2], HEAP32[a + 1176 >> 2], g);
    if(g == 0) {
      break a
    }
  }
}
_h264bsdMarkSliceCorrupted.X = 1;
function _h264bsdNumMbPart(a) {
  var b, a = a == 1 ? 1 : a == 0 ? 1 : a == 2 ? 2 : a == 3 ? 2 : 3;
  a == 3 ? b = 4 : a == 1 ? b = 1 : a == 2 && (b = 2);
  return b
}
function _h264bsdMbPartPredMode(a) {
  var b, d;
  b = a <= 5 ? 1 : 2;
  b == 1 ? d = 2 : b == 2 && (b = a == 6 ? 3 : 4, b == 3 ? d = 0 : b == 4 && (d = 1));
  return d
}
function _CbpIntra16x16(a) {
  var b, d;
  b = a >= 19 ? 1 : 2;
  b == 1 ? d = 15 : b == 2 && (d = 0);
  b = a - 7 >>> 2;
  (a - 7 >>> 2 > 2 ? 4 : 5) == 4 && (b -= 3);
  d += b << 4;
  return d
}
function _h264bsdDecodeMacroblockLayer(a, b, d, c, e) {
  var f = STACKTOP;
  STACKTOP += 8;
  var g, h, j = f + 4;
  _H264SwDecMemset(b, 0, 2088);
  h = _h264bsdDecodeExpGolombUnsigned(a, f);
  var l = HEAPU32[f >> 2], c = c == 2 | c == 7 ? 1 : 5;
  a:do {
    if(c == 1) {
      c = l + 6 > 31 ? 3 : 2;
      b:do {
        if(c == 2) {
          if(h != 0) {
            break b
          }
          HEAP32[b >> 2] = HEAP32[f >> 2] + 6;
          c = 9;
          break a
        }
      }while(0);
      g = 1;
      c = 37;
      break a
    }else {
      if(c == 5) {
        c = l + 1 > 31 ? 7 : 6;
        b:do {
          if(c == 6) {
            if(h != 0) {
              break b
            }
            HEAP32[b >> 2] = HEAP32[f >> 2] + 1;
            c = 9;
            break a
          }
        }while(0);
        g = 1;
        c = 37;
        break a
      }
    }
  }while(0);
  a:do {
    if(c == 9) {
      c = HEAP32[b >> 2] == 31 ? 10 : 18;
      b:do {
        if(c == 10) {
          c:for(;;) {
            if(!(_h264bsdIsByteAligned(a) != 0 ^ 1)) {
              c = 13;
              break c
            }
            h = _h264bsdGetBits(a, 1);
            if(h != 0) {
              c = 12;
              break c
            }
          }
          do {
            if(c == 13) {
              g = b + 328;
              l = c = 0;
              d:for(;;) {
                if(!(l < 384)) {
                  c = 36;
                  break b
                }
                l = _h264bsdGetBits(a, 8);
                HEAP32[f >> 2] = l;
                if(HEAP32[f >> 2] == -1) {
                  break d
                }
                var l = HEAP32[f >> 2], k = g;
                g = k + 4;
                HEAP32[k >> 2] = l;
                c = l = c + 1
              }
              g = 1;
              break a
            }else {
              if(c == 12) {
                g = 1;
                break a
              }
            }
          }while(0)
        }else {
          if(c == 18) {
            g = _h264bsdMbPartPredMode(HEAP32[b >> 2]);
            c = g == 2 ? 19 : 21;
            c:do {
              if(c == 19) {
                if(_h264bsdNumMbPart(HEAP32[b >> 2]) != 4) {
                  c = 21;
                  break c
                }
                var m = _DecodeSubMbPred(a, b + 176, HEAP32[b >> 2], e);
                h = m;
                c = 22;
                break c
              }
            }while(0);
            c == 21 && (h = m = _DecodeMbPred(a, b + 12, HEAP32[b >> 2], e));
            c = m != 0 ? 23 : 24;
            do {
              if(c == 23) {
                g = h;
                break a
              }else {
                if(c == 24) {
                  c = g != 1 ? 25 : 28;
                  do {
                    if(c == 25) {
                      h = _h264bsdDecodeExpGolombMapped(a, f, g == 0);
                      c = h != 0 ? 26 : 27;
                      do {
                        if(c == 26) {
                          g = h;
                          break a
                        }else {
                          c == 27 && (HEAP32[b + 4 >> 2] = HEAP32[f >> 2])
                        }
                      }while(0)
                    }else {
                      c == 28 && (l = _CbpIntra16x16(HEAP32[b >> 2]), HEAP32[b + 4 >> 2] = l)
                    }
                  }while(0);
                  c = HEAP32[b + 4 >> 2] != 0 ? 31 : 30;
                  do {
                    if(c == 30 && g != 1) {
                      c = 36;
                      break b
                    }
                  }while(0);
                  c = _h264bsdDecodeExpGolombSigned(a, j) != 0 ? 33 : 32;
                  d:do {
                    if(c == 32) {
                      if(HEAP32[j >> 2] < -26 | HEAP32[j >> 2] > 25) {
                        break d
                      }
                      HEAP32[b + 8 >> 2] = HEAP32[j >> 2];
                      h = _DecodeResidual(a, b + 272, d, HEAP32[b >> 2], HEAP32[b + 4 >> 2]);
                      HEAP32[a + 16 >> 2] = (HEAP32[a + 4 >> 2] - HEAP32[a >> 2] << 3) + HEAP32[a + 8 >> 2];
                      if(h == 0) {
                        c = 36;
                        break b
                      }
                      g = h;
                      break a
                    }
                  }while(0);
                  g = 1;
                  break a
                }
              }
            }while(0)
          }
        }
      }while(0);
      g = 0
    }
  }while(0);
  STACKTOP = f;
  return g
}
_h264bsdDecodeMacroblockLayer.X = 1;
function _DecodeSubMbPred(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 8;
  var f, g, h, j, l, k = e + 4;
  l = j = 0;
  a:for(;;) {
    if(!(l < 4)) {
      f = 6;
      break a
    }
    h = _h264bsdDecodeExpGolombUnsigned(a, e);
    if(h != 0) {
      f = 4;
      break a
    }
    if(HEAPU32[e >> 2] > 3) {
      f = 4;
      break a
    }
    HEAP32[b + (j << 2) >> 2] = HEAP32[e >> 2];
    j = l = j + 1
  }
  a:do {
    if(f == 6) {
      f = c > 1 ? 7 : 14;
      b:do {
        if(f == 7) {
          if(d == 5) {
            f = 14;
            break b
          }
          f = j = 0;
          c:for(;;) {
            if(!(f < 4)) {
              f = 14;
              break b
            }
            h = _h264bsdDecodeExpGolombTruncated(a, e, c > 2);
            if(h != 0) {
              break c
            }
            if(HEAPU32[e >> 2] >= c) {
              break c
            }
            HEAP32[b + 16 + (j << 2) >> 2] = HEAP32[e >> 2];
            j = f = j + 1
          }
          g = 1;
          break a
        }
      }while(0);
      l = j = 0;
      b:for(;;) {
        if(!(l < 4)) {
          f = 24;
          break b
        }
        l = 0;
        var m = _h264bsdNumSubMbPart(HEAP32[b + (j << 2) >> 2]);
        HEAP32[e >> 2] = m;
        c:for(;;) {
          HEAP32[e >> 2] = m - 1;
          if(m == 0) {
            f = 23;
            break c
          }
          h = _h264bsdDecodeExpGolombSigned(a, k);
          if(h != 0) {
            f = 19;
            break b
          }
          HEAP16[b + 32 + (j << 4) + (l << 2) >> 1] = HEAP32[k >> 2] & 65535;
          h = _h264bsdDecodeExpGolombSigned(a, k);
          if(h != 0) {
            f = 21;
            break b
          }
          HEAP16[b + 32 + (j << 4) + (l << 2) + 2 >> 1] = HEAP32[k >> 2] & 65535;
          l += 1;
          m = HEAP32[e >> 2]
        }
        j = l = j + 1
      }
      f == 24 ? g = 0 : f == 19 ? g = h : f == 21 && (g = h)
    }else {
      f == 4 && (g = 1)
    }
  }while(0);
  STACKTOP = e;
  return g
}
_DecodeSubMbPred.X = 1;
function _DecodeMbPred(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 8;
  var f, g, h, j, l, k = e + 4;
  j = _h264bsdMbPartPredMode(d);
  f = j == 2 ? 1 : j == 0 ? 15 : j == 1 ? 24 : 27;
  a:do {
    if(f == 1) {
      f = c > 1 ? 2 : 8;
      b:do {
        if(f == 2) {
          j = _h264bsdNumMbPart(d);
          l = 0;
          f = j;
          c:for(;;) {
            j = f - 1;
            if(f == 0) {
              f = 8;
              break b
            }
            h = _h264bsdDecodeExpGolombTruncated(a, e, c > 2);
            if(h != 0) {
              break c
            }
            if(HEAPU32[e >> 2] >= c) {
              break c
            }
            HEAP32[b + 132 + (l << 2) >> 2] = HEAP32[e >> 2];
            l += 1;
            f = j
          }
          g = 1;
          f = 28;
          break a
        }
      }while(0);
      j = _h264bsdNumMbPart(d);
      l = 0;
      var m = j;
      b:for(;;) {
        j = m - 1;
        if(m == 0) {
          f = 27;
          break a
        }
        h = _h264bsdDecodeExpGolombSigned(a, k);
        if(h != 0) {
          f = 11;
          break b
        }
        HEAP16[b + 148 + (l << 2) >> 1] = HEAP32[k >> 2] & 65535;
        h = _h264bsdDecodeExpGolombSigned(a, k);
        if(h != 0) {
          f = 13;
          break b
        }
        HEAP16[b + 148 + (l << 2) + 2 >> 1] = HEAP32[k >> 2] & 65535;
        l += 1;
        m = j
      }
      do {
        if(f == 11) {
          g = h;
          f = 28;
          break a
        }else {
          if(f == 13) {
            g = h;
            f = 28;
            break a
          }
        }
      }while(0)
    }else {
      if(f == 15) {
        h = j = HEAP32[k >> 2] = 0;
        b:for(;;) {
          if(!(h < 2)) {
            f = 24;
            break a
          }
          h = _h264bsdShowBits32(a);
          HEAP32[e >> 2] = h;
          h = 0;
          l = 7;
          c:for(;;) {
            if(HEAP32[b + (j << 2) >> 2] = (HEAP32[e >> 2] & -2147483648) != 0 ? 1 : 0, HEAP32[e >> 2] <<= 1, f = HEAP32[b + (j << 2) >> 2] != 0 ? 20 : 19, f == 19 && (HEAP32[b + 64 + (j << 2) >> 2] = HEAPU32[e >> 2] >>> 29, HEAP32[e >> 2] <<= 3, h += 1), j += 1, d = l, l = d - 1, d == 0) {
              break c
            }
          }
          if(_h264bsdFlushBits(a, h * 3 + 8) == -1) {
            break b
          }
          h = HEAP32[k >> 2] + 1;
          HEAP32[k >> 2] = h
        }
        g = 1;
        f = 28;
        break a
      }
    }
  }while(0);
  a:do {
    if(f == 24) {
      f = _h264bsdDecodeExpGolombUnsigned(a, e) != 0 | HEAPU32[e >> 2] > 3 ? 25 : 26;
      do {
        if(f == 25) {
          g = 1;
          f = 28;
          break a
        }else {
          if(f == 26) {
            HEAP32[b + 128 >> 2] = HEAP32[e >> 2];
            f = 27;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  f == 27 && (g = 0);
  STACKTOP = e;
  return g
}
_DecodeMbPred.X = 1;
function _h264bsdNumSubMbPart(a) {
  var b, a = a == 0 ? 1 : a == 1 ? 2 : a == 2 ? 2 : 3;
  a == 3 ? b = 4 : a == 1 ? b = 1 : a == 2 && (b = 2);
  return b
}
function _h264bsdSubMbPartMode(a) {
  return a
}
function _h264bsdPredModeIntra16x16(a) {
  return a - 7 & 3
}
function _DecodeResidual(a, b, d, c, e) {
  var f, g, h, j, l, k, m, o;
  o = b + 56;
  f = _h264bsdMbPartPredMode(c) == 1 ? 1 : 4;
  a:do {
    if(f == 1) {
      k = _DetermineNc(d, 0, b);
      c = l = _h264bsdDecodeResidualBlockCavlc(a, o + 1536, k, 16);
      f = (l & 15) != 0 ? 2 : 3;
      do {
        if(f == 2) {
          g = c;
          f = 31;
          break a
        }else {
          if(f == 3) {
            HEAP16[b + 48 >> 1] = c >>> 4 & 255;
            m = 1;
            f = 5;
            break a
          }
        }
      }while(0)
    }else {
      if(f == 4) {
        m = 0;
        f = 5;
        break a
      }
    }
  }while(0);
  a:do {
    if(f == 5) {
      c = 0;
      j = 4;
      b:for(;;) {
        h = j - 1;
        var p = e;
        if(j == 0) {
          f = 18;
          break b
        }
        f = p & 1;
        e >>>= 1;
        f = f != 0 ? 9 : 17;
        c:do {
          if(f == 9) {
            k = 4;
            for(;;) {
              j = k - 1;
              if(k == 0) {
                f = 6;
                break c
              }
              k = _DetermineNc(d, c, b);
              var r = a, q = o + (c << 6);
              f = m != 0 ? 12 : 13;
              f == 12 ? (l = _h264bsdDecodeResidualBlockCavlc(r, q + 4, k, 15), HEAP32[b + 1720 + (c << 2) >> 2] = l >>> 15) : f == 13 && (l = _h264bsdDecodeResidualBlockCavlc(r, q, k, 16), HEAP32[b + 1720 + (c << 2) >> 2] = l >>> 16);
              r = l;
              if((l & 15) != 0) {
                f = 15;
                break b
              }
              HEAP16[b + (c << 1) >> 1] = r >>> 4 & 255;
              c += 1;
              k = j
            }
          }else {
            f == 17 && (c += 4)
          }
        }while(0);
        j = h
      }
      do {
        if(f == 18) {
          f = p & 3;
          f = f != 0 ? 19 : 24;
          do {
            if(f == 19) {
              g = l = _h264bsdDecodeResidualBlockCavlc(a, o + 1600, -1, 4);
              f = (l & 15) != 0 ? 20 : 21;
              do {
                if(f == 20) {
                  break a
                }else {
                  if(f == 21) {
                    HEAP16[b + 50 >> 1] = g >>> 4 & 255;
                    h = l = _h264bsdDecodeResidualBlockCavlc(a, o + 1616, -1, 4);
                    f = (l & 15) != 0 ? 22 : 23;
                    do {
                      if(f == 22) {
                        g = h;
                        break a
                      }else {
                        f == 23 && (HEAP16[b + 52 >> 1] = h >>> 4 & 255)
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }while(0);
          f = (e & 2) != 0 ? 25 : 30;
          c:do {
            if(f == 25) {
              g = 8;
              d:for(;;) {
                h = g - 1;
                if(g == 0) {
                  f = 30;
                  break c
                }
                k = _DetermineNc(d, c, b);
                var n = l = _h264bsdDecodeResidualBlockCavlc(a, o + (c << 6) + 4, k, 15);
                if((l & 15) != 0) {
                  break d
                }
                HEAP16[b + (c << 1) >> 1] = n >>> 4 & 255;
                HEAP32[b + 1720 + (c << 2) >> 2] = l >>> 15;
                c += 1;
                g = h
              }
              g = n;
              break a
            }
          }while(0);
          g = 0
        }else {
          f == 15 && (g = r)
        }
      }while(0)
    }
  }while(0);
  return g
}
_DecodeResidual.X = 1;
function _h264bsdDecodeMacroblock(a, b, d, c, e, f, g, h) {
  var j, l, k, m, o, p, r;
  m = HEAP32[b >> 2];
  HEAP32[a >> 2] = m;
  HEAP32[a + 196 >> 2] += 1;
  _h264bsdSetCurrImageMbPointers(d, f);
  j = m == 31 ? 1 : 8;
  a:do {
    if(j == 1) {
      o = h;
      p = a + 28;
      r = b + 328;
      HEAP32[a + 20 >> 2] = 0;
      j = HEAPU32[a + 196 >> 2] > 1;
      k = 23;
      j = j ? 2 : 5;
      do {
        if(j == 2) {
          c:for(;;) {
            if(l = p, p = l + 2, HEAP16[l >> 1] = 16, l = k, k = l - 1, l == 0) {
              j = 3;
              break c
            }
          }
          l = 0
        }else {
          if(j == 5) {
            c:for(;;) {
              l = p;
              p = l + 2;
              HEAP16[l >> 1] = 16;
              l = 15;
              d:for(;;) {
                var q = r;
                r = q + 4;
                var q = HEAP32[q >> 2] & 255, n = o;
                o = n + 1;
                HEAP8[n] = q;
                q = l;
                l = q - 1;
                if(q == 0) {
                  j = 4;
                  break d
                }
              }
              l = k;
              k = l - 1;
              if(l == 0) {
                j = 7;
                break c
              }
            }
            _h264bsdWriteMacroblock(d, h);
            l = 0
          }
        }
      }while(0)
    }else {
      if(j == 8) {
        k = a + 28;
        j = m != 0 ? 9 : 16;
        b:do {
          if(j == 9) {
            _H264SwDecMemcpy(k, b + 272, 54);
            j = HEAP32[b + 8 >> 2] != 0 ? 10 : 14;
            c:do {
              if(j == 10) {
                HEAP32[e >> 2] = HEAP32[b + 8 >> 2] + HEAP32[e >> 2];
                k = e;
                o = HEAP32[k >> 2];
                j = HEAP32[e >> 2] < 0 ? 11 : 12;
                do {
                  if(j == 11) {
                    HEAP32[k >> 2] = o + 52
                  }else {
                    if(j == 12) {
                      if(!(o >= 52)) {
                        break c
                      }
                      HEAP32[e >> 2] -= 52
                    }
                  }
                }while(0)
              }
            }while(0);
            HEAP32[a + 20 >> 2] = HEAP32[e >> 2];
            l = j = _ProcessResidual(a, b + 328, b + 1992);
            if(j == 0) {
              break b
            }
            break a
          }else {
            j == 16 && (_H264SwDecMemset(k, 0, 54), HEAP32[a + 20 >> 2] = HEAP32[e >> 2])
          }
        }while(0);
        j = _h264bsdMbPartPredMode(m);
        k = a;
        o = b;
        j = j != 2 ? 18 : 20;
        b:do {
          if(j == 18) {
            l = _h264bsdIntraPrediction(k, o, d, f, g, h);
            if(l == 0) {
              j = 22;
              break b
            }
            break a
          }else {
            if(j == 20) {
              l = _h264bsdInterPrediction(k, o, c, f, d, h);
              if(l == 0) {
                j = 22;
                break b
              }
              break a
            }
          }
        }while(0);
        l = 0
      }
    }
  }while(0);
  return l
}
_h264bsdDecodeMacroblock.X = 1;
function _ProcessResidual(a, b, d) {
  var c, e, f, g, h, j, l;
  g = b + 1536;
  h = b;
  j = a + 28;
  c = _h264bsdMbPartPredMode(HEAP32[a >> 2]) == 1 ? 1 : 11;
  a:do {
    if(c == 1) {
      c = HEAP16[j + 48 >> 1] != 0 ? 2 : 3;
      c == 2 && _h264bsdProcessLumaDc(g, HEAP32[a + 20 >> 2]);
      l = _dcCoeffIndex;
      c = 16;
      b:for(;;) {
        f = c - 1;
        if(c == 0) {
          c = 18;
          break a
        }
        c = l;
        l = c + 4;
        HEAP32[h >> 2] = HEAP32[g + (HEAP32[c >> 2] << 2) >> 2];
        c = HEAP32[h >> 2] != 0 ? 7 : 6;
        c:do {
          if(c == 6) {
            if(HEAP16[j >> 1] != 0) {
              c = 7;
              break c
            }
            HEAP32[h >> 2] = 16777215;
            c = 10;
            break c
          }
        }while(0);
        do {
          if(c == 7 && _h264bsdProcessBlock(h, HEAP32[a + 20 >> 2], 1, HEAP32[d >> 2]) != 0) {
            break b
          }
        }while(0);
        h += 64;
        j += 2;
        d += 4;
        c = f
      }
      e = 1;
      c = 30;
      break a
    }else {
      if(c == 11) {
        c = 16;
        b:for(;;) {
          f = c - 1;
          if(c == 0) {
            c = 18;
            break a
          }
          g = h;
          c = HEAP16[j >> 1] != 0 ? 14 : 16;
          do {
            if(c == 14) {
              if(_h264bsdProcessBlock(g, HEAP32[a + 20 >> 2], 0, HEAP32[d >> 2]) != 0) {
                break b
              }
            }else {
              c == 16 && (HEAP32[g >> 2] = 16777215)
            }
          }while(0);
          h += 64;
          j += 2;
          d += 4;
          c = f
        }
        e = 1;
        c = 30;
        break a
      }
    }
  }while(0);
  do {
    if(c == 18) {
      f = _clip(0, 51, HEAP32[a + 24 >> 2] + HEAP32[a + 20 >> 2]);
      g = HEAP32[_h264bsdQpC + (f << 2) >> 2];
      c = HEAP16[a + 78 >> 1] != 0 ? 20 : 19;
      b:do {
        if(c == 19) {
          c = HEAP16[a + 80 >> 1] != 0 ? 20 : 21;
          break b
        }
      }while(0);
      c == 20 && _h264bsdProcessChromaDc(b + 1600, g);
      l = b + 1600;
      var k = 8;
      b:for(;;) {
        f = k - 1;
        if(k == 0) {
          c = 29;
          break b
        }
        c = l;
        l = c + 4;
        HEAP32[h >> 2] = HEAP32[c >> 2];
        c = HEAP32[h >> 2] != 0 ? 25 : 24;
        c:do {
          if(c == 24) {
            if(HEAP16[j >> 1] != 0) {
              c = 25;
              break c
            }
            HEAP32[h >> 2] = 16777215;
            c = 28;
            break c
          }
        }while(0);
        do {
          if(c == 25 && _h264bsdProcessBlock(h, g, 1, HEAP32[d >> 2]) != 0) {
            c = 26;
            break b
          }
        }while(0);
        h += 64;
        j += 2;
        d += 4;
        k = f
      }
      c == 29 ? e = 0 : c == 26 && (e = 1)
    }
  }while(0);
  return e
}
_ProcessResidual.X = 1;
function _h264bsdShowBits32(a) {
  var b, d, c, e, f, g, h;
  f = HEAP32[a + 4 >> 2];
  c = (HEAP32[a + 12 >> 2] << 3) - HEAP32[a + 16 >> 2];
  b = c >= 32 ? 1 : 4;
  do {
    if(b == 1) {
      e = HEAP32[a + 8 >> 2], d = HEAPU8[f + 1] << 16 | HEAPU8[f] << 24 | HEAPU8[f + 2] << 8 | HEAPU8[f + 3], b = e != 0 ? 2 : 3, b == 2 && (g = HEAPU8[f + 4], h = 8 - e, d <<= e, d |= g >>> h)
    }else {
      if(b == 4) {
        b = c > 0 ? 5 : 8;
        do {
          if(b == 5) {
            e = HEAP32[a + 8 >> 2] + 24;
            b = f;
            f = b + 1;
            d = HEAPU8[b] << e;
            c = b = c + -(8 - HEAP32[a + 8 >> 2]);
            b = b > 0 ? 6 : 7;
            c:do {
              if(b == 6) {
                for(;;) {
                  if(e -= 8, g = f, f = g + 1, d |= HEAPU8[g] << e, c = g = c - 8, !(g > 0)) {
                    b = 7;
                    break c
                  }
                }
              }
            }while(0)
          }else {
            b == 8 && (d = 0)
          }
        }while(0)
      }
    }
  }while(0);
  return d
}
_h264bsdShowBits32.X = 1;
function _h264bsdFlushBits(a, b) {
  var d, c;
  HEAP32[a + 16 >> 2] += b;
  HEAP32[a + 8 >> 2] = HEAP32[a + 16 >> 2] & 7;
  d = HEAPU32[a + 16 >> 2] <= HEAP32[a + 12 >> 2] << 3 ? 1 : 2;
  d == 1 ? (HEAP32[a + 4 >> 2] = HEAP32[a >> 2] + (HEAPU32[a + 16 >> 2] >>> 3), c = 0) : d == 2 && (c = -1);
  return c
}
function _h264bsdIsByteAligned(a) {
  var b, a = HEAP32[a + 8 >> 2] != 0 ? 2 : 1;
  a == 2 ? b = 0 : a == 1 && (b = 1);
  return b
}
function _DetermineNc(a, b, d) {
  var c, e, f, g, h, j;
  f = _h264bsdNeighbour4x4BlockA(b);
  g = _h264bsdNeighbour4x4BlockB(b);
  h = HEAP8[f + 4];
  j = HEAP8[g + 4];
  b = HEAP32[f >> 2] == 4 ? 1 : 3;
  a:do {
    if(b == 1) {
      if(HEAP32[g >> 2] != 4) {
        b = 3;
        break a
      }
      e = HEAP16[d + (h << 1) >> 1] + 1 + HEAP16[d + (j << 1) >> 1] >> 1;
      b = 15;
      break a
    }
  }while(0);
  a:do {
    if(b == 3) {
      b = HEAP32[f >> 2] == 4 ? 4 : 6;
      do {
        if(b == 4) {
          e = HEAP16[d + (h << 1) >> 1];
          if(_h264bsdIsNeighbourAvailable(a, HEAP32[a + 204 >> 2]) == 0) {
            break a
          }
          e = e + 1 + HEAP16[HEAP32[a + 204 >> 2] + 28 + (j << 1) >> 1] >> 1
        }else {
          if(b == 6) {
            b = HEAP32[g >> 2] == 4 ? 7 : 9;
            do {
              if(b == 7) {
                e = HEAP16[d + (j << 1) >> 1];
                if(_h264bsdIsNeighbourAvailable(a, HEAP32[a + 200 >> 2]) == 0) {
                  break a
                }
                e = e + 1 + HEAP16[HEAP32[a + 200 >> 2] + 28 + (h << 1) >> 1] >> 1
              }else {
                if(b == 9) {
                  e = c = 0;
                  b = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 200 >> 2]) != 0 ? 10 : 11;
                  b == 10 && (e = HEAP16[HEAP32[a + 200 >> 2] + 28 + (h << 1) >> 1], c = 1);
                  if(_h264bsdIsNeighbourAvailable(a, HEAP32[a + 204 >> 2]) == 0) {
                    break a
                  }
                  b = c != 0 ? 13 : 14;
                  b == 13 ? e = e + 1 + HEAP16[HEAP32[a + 204 >> 2] + 28 + (j << 1) >> 1] >> 1 : b == 14 && (e = HEAP16[HEAP32[a + 204 >> 2] + 28 + (j << 1) >> 1])
                }
              }
            }while(0)
          }
        }
      }while(0)
    }
  }while(0);
  return e
}
_DetermineNc.X = 1;
function _h264bsdGetBits(a, b) {
  var d, c, e;
  e = _h264bsdShowBits32(a) >>> 32 - b;
  d = _h264bsdFlushBits(a, b) == 0 ? 1 : 2;
  d == 1 ? c = e : d == 2 && (c = -1);
  return c
}
function _h264bsdDecodeExpGolombUnsigned(a, b) {
  var d, c, e, f;
  e = _h264bsdShowBits32(a);
  d = e >>> 0 >= 2147483648 ? 1 : 2;
  a:do {
    if(d == 1) {
      _h264bsdFlushBits(a, 1), c = HEAP32[b >> 2] = 0
    }else {
      if(d == 2) {
        d = e >= 1073741824 ? 3 : 6;
        do {
          if(d == 3) {
            d = _h264bsdFlushBits(a, 3) == -1 ? 4 : 5, d == 4 ? c = 1 : d == 5 && (HEAP32[b >> 2] = (e >>> 29 & 1) + 1, c = 0)
          }else {
            if(d == 6) {
              d = e >= 536870912 ? 7 : 10;
              do {
                if(d == 7) {
                  d = _h264bsdFlushBits(a, 5) == -1 ? 8 : 9, d == 8 ? c = 1 : d == 9 && (HEAP32[b >> 2] = (e >>> 27 & 3) + 3, c = 0)
                }else {
                  if(d == 10) {
                    d = e >= 268435456 ? 11 : 14;
                    do {
                      if(d == 11) {
                        d = _h264bsdFlushBits(a, 7) == -1 ? 12 : 13, d == 12 ? c = 1 : d == 13 && (HEAP32[b >> 2] = (e >>> 25 & 7) + 7, c = 0)
                      }else {
                        if(d == 14) {
                          f = _h264bsdCountLeadingZeros(e, 28) + 4;
                          d = f == 32 ? 15 : 23;
                          do {
                            if(d == 15) {
                              HEAP32[b >> 2] = 0;
                              _h264bsdFlushBits(a, 32);
                              e = _h264bsdGetBits(a, 1);
                              d = e == 1 ? 16 : 22;
                              f:do {
                                if(d == 16) {
                                  e = _h264bsdShowBits32(a);
                                  d = _h264bsdFlushBits(a, 32) == -1 ? 17 : 18;
                                  do {
                                    if(d == 17) {
                                      c = 1;
                                      break a
                                    }else {
                                      if(d == 18) {
                                        d = e == 0 ? 19 : 20;
                                        do {
                                          if(d == 19) {
                                            HEAP32[b >> 2] = -1;
                                            c = 0;
                                            break a
                                          }else {
                                            if(d == 20) {
                                              if(e != 1) {
                                                d = 22;
                                                break f
                                              }
                                              HEAP32[b >> 2] = -1;
                                              c = 1;
                                              break a
                                            }
                                          }
                                        }while(0)
                                      }
                                    }
                                  }while(0)
                                }
                              }while(0);
                              c = 1
                            }else {
                              d == 23 && (_h264bsdFlushBits(a, f + 1), e = _h264bsdGetBits(a, f), d = e == -1 ? 24 : 25, d == 24 ? c = 1 : d == 25 && (HEAP32[b >> 2] = e - 1 + (1 << f), c = 0))
                            }
                          }while(0)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  return c
}
_h264bsdDecodeExpGolombUnsigned.X = 1;
function _h264bsdDecodeExpGolombSigned(a, b) {
  var d = STACKTOP;
  STACKTOP += 4;
  var c, e;
  HEAP32[d >> 2] = 0;
  var f = _h264bsdDecodeExpGolombUnsigned(a, d) == 0;
  c = HEAP32[d >> 2] == -1 ? 1 : 4;
  c == 1 ? (c = f ? 2 : 3, c == 2 ? e = 1 : c == 3 && (HEAP32[b >> 2] = -2147483648, e = 0)) : c == 4 && (c = f ? 5 : 6, c == 5 ? (HEAP32[b >> 2] = (HEAP32[d >> 2] & 1) != 0 ? HEAP32[d >> 2] + 1 >>> 1 : -(HEAP32[d >> 2] + 1 >>> 1), e = 0) : c == 6 && (e = 1));
  STACKTOP = d;
  return e
}
function _h264bsdDecodeExpGolombMapped(a, b, d) {
  var c = STACKTOP;
  STACKTOP += 4;
  var e, a = _h264bsdDecodeExpGolombUnsigned(a, c) != 0 ? 1 : 2;
  a == 1 ? e = 1 : a == 2 && (a = HEAPU32[c >> 2] > 47 ? 3 : 4, a == 3 ? e = 1 : a == 4 && (e = HEAPU32[c >> 2], a = d != 0 ? 5 : 6, a == 5 ? HEAP32[b >> 2] = HEAPU8[_codedBlockPatternIntra4x4 + e] : a == 6 && (HEAP32[b >> 2] = HEAPU8[_codedBlockPatternInter + e]), e = 0));
  STACKTOP = c;
  return e
}
function _h264bsdDecodeExpGolombTruncated(a, b, d) {
  var c, d = d != 0 ? 1 : 2;
  d == 1 ? c = _h264bsdDecodeExpGolombUnsigned(a, b) : d == 2 && (a = _h264bsdGetBits(a, 1), HEAP32[b >> 2] = a, d = HEAP32[b >> 2] == -1 ? 3 : 4, d == 3 ? c = 1 : d == 4 && (HEAP32[b >> 2] ^= 1, c = 0));
  return c
}
function _DecodeCoeffToken(a, b) {
  var d, c;
  d = b >>> 0 < 2 ? 1 : 10;
  a:do {
    if(d == 1) {
      if(d = a >= 32768 ? 2 : 3, d == 2) {
        c = 1
      }else {
        if(d == 3) {
          var e = a;
          d = a >= 3072 ? 4 : 5;
          if(d == 4) {
            c = HEAPU16[_coeffToken0_0 + (e >>> 10 << 1) >> 1]
          }else {
            if(d == 5) {
              var f = a;
              d = e >= 256 ? 6 : 7;
              d == 6 ? c = HEAPU16[_coeffToken0_1 + (f >>> 6 << 1) >> 1] : d == 7 && (e = a, d = f >= 32 ? 8 : 9, d == 8 ? c = HEAPU16[_coeffToken0_2 + ((e >>> 2) - 8 << 1) >> 1] : d == 9 && (c = HEAPU16[_coeffToken0_3 + (e << 1) >> 1]))
            }
          }
        }
      }
    }else {
      if(d == 10) {
        d = b >>> 0 < 4 ? 11 : 18;
        do {
          if(d == 11) {
            e = a, d = a >= 32768 ? 12 : 13, d == 12 ? c = (e & 16384) != 0 ? 2 : 2082 : d == 13 && (f = a, d = e >= 4096 ? 14 : 15, d == 14 ? c = HEAPU16[_coeffToken2_0 + (f >>> 10 << 1) >> 1] : d == 15 && (e = a, d = f >= 512 ? 16 : 17, d == 16 ? c = HEAPU16[_coeffToken2_1 + (e >>> 7 << 1) >> 1] : d == 17 && (c = HEAPU16[_coeffToken2_2 + (e >>> 2 << 1) >> 1])))
          }else {
            if(d == 18) {
              d = b >>> 0 < 8 ? 19 : 21;
              do {
                if(d == 19) {
                  c = HEAPU16[_coeffToken4_0 + (a >>> 10 << 1) >> 1];
                  if(c != 0) {
                    break a
                  }
                  c = HEAPU16[_coeffToken4_1 + (a >>> 6 << 1) >> 1]
                }else {
                  if(d == 21) {
                    f = a;
                    d = b >>> 0 <= 16 ? 22 : 23;
                    do {
                      if(d == 22) {
                        c = HEAPU16[_coeffToken8 + (f >>> 10 << 1) >> 1]
                      }else {
                        if(d == 23) {
                          c = HEAPU16[_coeffTokenMinus1_0 + (f >>> 13 << 1) >> 1];
                          if(c != 0) {
                            break a
                          }
                          c = HEAPU16[_coeffTokenMinus1_1 + (a >>> 8 << 1) >> 1]
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  return c
}
_DecodeCoeffToken.X = 1;
function _h264bsdDecodeResidualBlockCavlc(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 128;
  var f, g, h, j, l, k, m, o, p, r, q = e + 64, n, s;
  s = 32;
  n = _h264bsdShowBits32(a);
  f = s < 16 ? 1 : 4;
  a:do {
    if(f == 1) {
      f = _h264bsdFlushBits(a, 32 - s) == -1 ? 2 : 3;
      do {
        if(f == 2) {
          g = 1;
          f = 79;
          break a
        }else {
          if(f == 3) {
            n = _h264bsdShowBits32(a);
            s = 32;
            f = 4;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  a:do {
    if(f == 4) {
      o = n >>> 16;
      j = l = _DecodeCoeffToken(o, d);
      f = l != 0 ? 6 : 5;
      do {
        if(f == 6) {
          n <<= j & 31;
          s -= j & 31;
          l = j >>> 11 & 31;
          f = l > c ? 7 : 8;
          do {
            if(f == 7) {
              g = 1
            }else {
              if(f == 8) {
                k = j >>> 5 & 63;
                f = l != 0 ? 9 : 75;
                d:do {
                  if(f == 9) {
                    h = 0;
                    f = k != 0 ? 10 : 16;
                    e:do {
                      if(f == 10) {
                        f = s < k ? 11 : 14;
                        do {
                          if(f == 11) {
                            f = _h264bsdFlushBits(a, 32 - s) == -1 ? 12 : 13;
                            do {
                              if(f == 12) {
                                g = 1;
                                break a
                              }else {
                                f == 13 && (n = _h264bsdShowBits32(a), s = 32)
                              }
                            }while(0)
                          }
                        }while(0);
                        o = n >>> 32 - k;
                        n <<= k;
                        s -= k;
                        j = 1 << k - 1;
                        for(;;) {
                          HEAP32[e + (h << 2) >> 2] = (j & o) != 0 ? -1 : 1;
                          var t = j >>> 1;
                          j = t;
                          h += 1;
                          if(t == 0) {
                            break e
                          }
                        }
                      }
                    }while(0);
                    f = l > 10 ? 17 : 19;
                    e:do {
                      if(f == 17) {
                        if(!(k < 3)) {
                          f = 19;
                          break e
                        }
                        m = 1;
                        f = 20;
                        break e
                      }
                    }while(0);
                    f == 19 && (m = 0);
                    e:for(;;) {
                      if(!(h < l)) {
                        f = 52;
                        break e
                      }
                      f = s < 16 ? 22 : 25;
                      do {
                        if(f == 22) {
                          if(_h264bsdFlushBits(a, 32 - s) == -1) {
                            f = 23;
                            break e
                          }
                          n = _h264bsdShowBits32(a);
                          s = 32
                        }
                      }while(0);
                      o = n >>> 16;
                      o = f = _DecodeLevelPrefix(o);
                      if(f == -2) {
                        f = 26;
                        break e
                      }
                      n <<= o + 1;
                      s = -o - 1 + s;
                      f = o < 14 ? 28 : 29;
                      if(f == 28) {
                        var v = j = m
                      }else {
                        f == 29 && (t = m != 0, f = o == 14 ? 30 : 31, f == 30 ? (j = t ? m : 4, v = m) : f == 31 && (f = t ? 33 : 32, f == 32 && (m = 1), j = 12, v = m))
                      }
                      f = v != 0 ? 35 : 36;
                      f == 35 && (o <<= m);
                      f = j != 0 ? 37 : 42;
                      do {
                        if(f == 37) {
                          f = s < j ? 38 : 41;
                          do {
                            if(f == 38) {
                              if(_h264bsdFlushBits(a, 32 - s) == -1) {
                                f = 39;
                                break e
                              }
                              n = _h264bsdShowBits32(a);
                              s = 32
                            }
                          }while(0);
                          p = n >>> 32 - j;
                          n <<= j;
                          s -= j;
                          o += p
                        }
                      }while(0);
                      j = o;
                      f = h == k & k < 3 ? 43 : 44;
                      f == 43 && (j += 2);
                      HEAP32[e + (h << 2) >> 2] = j + 2 >>> 1;
                      f = m == 0 ? 45 : 46;
                      f == 45 && (m = 1);
                      f = HEAP32[e + (h << 2) >> 2] > 3 << m - 1 ? 47 : 49;
                      f:do {
                        if(f == 47) {
                          if(!(m < 6)) {
                            break f
                          }
                          m += 1
                        }
                      }while(0);
                      f = (j & 1) != 0 ? 50 : 51;
                      f == 50 && (HEAP32[e + (h << 2) >> 2] = -HEAP32[e + (h << 2) >> 2]);
                      h += 1
                    }
                    do {
                      if(f == 52) {
                        f = l < c ? 53 : 60;
                        do {
                          if(f == 53) {
                            f = s < 9 ? 54 : 57;
                            do {
                              if(f == 54) {
                                f = _h264bsdFlushBits(a, 32 - s) == -1 ? 55 : 56;
                                do {
                                  if(f == 55) {
                                    g = 1;
                                    break a
                                  }else {
                                    f == 56 && (n = _h264bsdShowBits32(a), s = 32)
                                  }
                                }while(0)
                              }
                            }while(0);
                            o = n >>> 23;
                            r = h = _DecodeTotalZeros(o, l, c == 4);
                            f = h != 0 ? 59 : 58;
                            do {
                              if(f == 59) {
                                n <<= r & 15, s -= r & 15, r = r >>> 4 & 15
                              }else {
                                if(f == 58) {
                                  g = 1;
                                  break a
                                }
                              }
                            }while(0)
                          }else {
                            f == 60 && (r = 0)
                          }
                        }while(0);
                        h = 0;
                        f:for(;;) {
                          var u = r;
                          if(!(h < l - 1)) {
                            f = 73;
                            break f
                          }
                          f = u > 0 ? 64 : 71;
                          do {
                            if(f == 64) {
                              f = s < 11 ? 65 : 68;
                              do {
                                if(f == 65) {
                                  if(_h264bsdFlushBits(a, 32 - s) == -1) {
                                    f = 66;
                                    break f
                                  }
                                  n = _h264bsdShowBits32(a);
                                  s = 32
                                }
                              }while(0);
                              o = n >>> 21;
                              j = o = _DecodeRunBefore(o, r);
                              if(o == 0) {
                                f = 69;
                                break f
                              }
                              n <<= j & 15;
                              s -= j & 15;
                              HEAP32[q + (h << 2) >> 2] = j >>> 4 & 15;
                              o = HEAP32[q + (h << 2) >> 2];
                              HEAP32[q + (h << 2) >> 2] = o + 1;
                              r -= o
                            }else {
                              f == 71 && (HEAP32[q + (h << 2) >> 2] = 1)
                            }
                          }while(0);
                          h += 1
                        }
                        do {
                          if(f == 73) {
                            j = u;
                            HEAP32[b + (j << 2) >> 2] = HEAP32[e + (l - 1 << 2) >> 2];
                            p = 1 << j;
                            h = l - 1 - 1;
                            if(l - 1 == 0) {
                              break d
                            }
                            for(;;) {
                              if(j += HEAP32[q + (h << 2) >> 2], p |= 1 << j, HEAP32[b + (j << 2) >> 2] = HEAP32[e + (h << 2) >> 2], o = h, h = o - 1, o == 0) {
                                break d
                              }
                            }
                          }else {
                            if(f == 66) {
                              g = 1;
                              break a
                            }else {
                              if(f == 69) {
                                g = 1;
                                break a
                              }
                            }
                          }
                        }while(0)
                      }else {
                        if(f == 23) {
                          g = 1;
                          break a
                        }else {
                          if(f == 26) {
                            g = 1;
                            break a
                          }else {
                            if(f == 39) {
                              g = 1;
                              break a
                            }
                          }
                        }
                      }
                    }while(0)
                  }else {
                    f == 75 && (p = 0)
                  }
                }while(0);
                f = _h264bsdFlushBits(a, 32 - s) != 0 ? 77 : 78;
                f == 77 ? g = 1 : f == 78 && (g = p << 16 | l << 4)
              }
            }
          }while(0)
        }else {
          f == 5 && (g = 1)
        }
      }while(0)
    }
  }while(0);
  STACKTOP = e;
  return g
}
_h264bsdDecodeResidualBlockCavlc.X = 1;
function _DecodeLevelPrefix(a) {
  var b, d, c;
  b = a >= 32768 ? 1 : 2;
  a:do {
    if(b == 1) {
      c = 0;
      b = 33;
      break a
    }else {
      if(b == 2) {
        b = a >= 16384 ? 3 : 4;
        do {
          if(b == 3) {
            c = 1;
            b = 33;
            break a
          }else {
            if(b == 4) {
              b = a >= 8192 ? 5 : 6;
              do {
                if(b == 5) {
                  c = 2;
                  b = 33;
                  break a
                }else {
                  if(b == 6) {
                    b = a >= 4096 ? 7 : 8;
                    do {
                      if(b == 7) {
                        c = 3;
                        b = 33;
                        break a
                      }else {
                        if(b == 8) {
                          b = a >= 2048 ? 9 : 10;
                          do {
                            if(b == 9) {
                              c = 4;
                              b = 33;
                              break a
                            }else {
                              if(b == 10) {
                                b = a >= 1024 ? 11 : 12;
                                do {
                                  if(b == 11) {
                                    c = 5;
                                    b = 33;
                                    break a
                                  }else {
                                    if(b == 12) {
                                      b = a >= 512 ? 13 : 14;
                                      do {
                                        if(b == 13) {
                                          c = 6;
                                          b = 33;
                                          break a
                                        }else {
                                          if(b == 14) {
                                            b = a >= 256 ? 15 : 16;
                                            do {
                                              if(b == 15) {
                                                c = 7;
                                                b = 33;
                                                break a
                                              }else {
                                                if(b == 16) {
                                                  b = a >= 128 ? 17 : 18;
                                                  do {
                                                    if(b == 17) {
                                                      c = 8;
                                                      b = 33;
                                                      break a
                                                    }else {
                                                      if(b == 18) {
                                                        b = a >= 64 ? 19 : 20;
                                                        do {
                                                          if(b == 19) {
                                                            c = 9;
                                                            b = 33;
                                                            break a
                                                          }else {
                                                            if(b == 20) {
                                                              b = a >= 32 ? 21 : 22;
                                                              do {
                                                                if(b == 21) {
                                                                  c = 10;
                                                                  b = 33;
                                                                  break a
                                                                }else {
                                                                  if(b == 22) {
                                                                    b = a >= 16 ? 23 : 24;
                                                                    do {
                                                                      if(b == 23) {
                                                                        c = 11;
                                                                        b = 33;
                                                                        break a
                                                                      }else {
                                                                        if(b == 24) {
                                                                          b = a >= 8 ? 25 : 26;
                                                                          do {
                                                                            if(b == 25) {
                                                                              c = 12;
                                                                              b = 33;
                                                                              break a
                                                                            }else {
                                                                              if(b == 26) {
                                                                                b = a >= 4 ? 27 : 28;
                                                                                do {
                                                                                  if(b == 27) {
                                                                                    c = 13;
                                                                                    b = 33;
                                                                                    break a
                                                                                  }else {
                                                                                    if(b == 28) {
                                                                                      b = a >= 2 ? 29 : 30;
                                                                                      do {
                                                                                        if(b == 29) {
                                                                                          c = 14;
                                                                                          b = 33;
                                                                                          break a
                                                                                        }else {
                                                                                          if(b == 30) {
                                                                                            b = a >= 1 ? 31 : 32;
                                                                                            do {
                                                                                              if(b == 31) {
                                                                                                c = 15;
                                                                                                b = 33;
                                                                                                break a
                                                                                              }else {
                                                                                                if(b == 32) {
                                                                                                  d = -2;
                                                                                                  b = 34;
                                                                                                  break a
                                                                                                }
                                                                                              }
                                                                                            }while(0)
                                                                                          }
                                                                                        }
                                                                                      }while(0)
                                                                                    }
                                                                                  }
                                                                                }while(0)
                                                                              }
                                                                            }
                                                                          }while(0)
                                                                        }
                                                                      }
                                                                    }while(0)
                                                                  }
                                                                }
                                                              }while(0)
                                                            }
                                                          }
                                                        }while(0)
                                                      }
                                                    }
                                                  }while(0)
                                                }
                                              }
                                            }while(0)
                                          }
                                        }
                                      }while(0)
                                    }
                                  }
                                }while(0)
                              }
                            }
                          }while(0)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  b == 33 && (d = c);
  return d
}
_DecodeLevelPrefix.X = 1;
function _DecodeTotalZeros(a, b, d) {
  var c;
  c = 0;
  d = d != 0 ? 18 : 1;
  a:do {
    if(d == 18) {
      a >>>= 6, d = a > 3 ? 19 : 20, d == 19 ? c = 1 : d == 20 && (d = b == 3 ? 21 : 22, d == 21 ? c = 17 : d == 22 && (d = a > 1 ? 23 : 24, d == 23 ? c = 18 : d == 24 && (d = b == 2 ? 25 : 26, d == 25 ? c = 34 : d == 26 && (d = a != 0 ? 27 : 28, d == 27 ? c = 35 : d == 28 && (c = 51)))))
    }else {
      if(d == 1) {
        d = b;
        d = d == 1 ? 2 : d == 2 ? 4 : d == 3 ? 5 : d == 4 ? 6 : d == 5 ? 7 : d == 6 ? 8 : d == 7 ? 9 : d == 8 ? 10 : d == 9 ? 11 : d == 10 ? 12 : d == 11 ? 13 : d == 12 ? 14 : d == 13 ? 15 : d == 14 ? 16 : 17;
        do {
          if(d == 17) {
            c = a >>> 8 != 0 ? 17 : 1
          }else {
            if(d == 2) {
              c = HEAPU8[_totalZeros_1_0 + (a >>> 4)];
              if(c != 0) {
                break a
              }
              c = HEAPU8[_totalZeros_1_1 + a]
            }else {
              d == 4 ? c = HEAPU8[_totalZeros_2 + (a >>> 3)] : d == 5 ? c = HEAPU8[_totalZeros_3 + (a >>> 3)] : d == 6 ? c = HEAPU8[_totalZeros_4 + (a >>> 4)] : d == 7 ? c = HEAPU8[_totalZeros_5 + (a >>> 4)] : d == 8 ? c = HEAPU8[_totalZeros_6 + (a >>> 3)] : d == 9 ? c = HEAPU8[_totalZeros_7 + (a >>> 3)] : d == 10 ? c = HEAPU8[_totalZeros_8 + (a >>> 3)] : d == 11 ? c = HEAPU8[_totalZeros_9 + (a >>> 3)] : d == 12 ? c = HEAPU8[_totalZeros_10 + (a >>> 4)] : d == 13 ? c = HEAPU8[_totalZeros_11 + (a >>> 
              5)] : d == 14 ? c = HEAPU8[_totalZeros_12 + (a >>> 5)] : d == 15 ? c = HEAPU8[_totalZeros_13 + (a >>> 6)] : d == 16 && (c = HEAPU8[_totalZeros_14 + (a >>> 7)])
            }
          }
        }while(0)
      }
    }
  }while(0);
  return c
}
_DecodeTotalZeros.X = 1;
function _DecodeRunBefore(a, b) {
  var d, c;
  c = 0;
  d = b == 1 ? 1 : b == 2 ? 2 : b == 3 ? 3 : b == 4 ? 4 : b == 5 ? 5 : b == 6 ? 6 : 7;
  a:do {
    if(d == 7) {
      var e = a;
      d = a >= 256 ? 8 : 9;
      b:do {
        if(d == 8) {
          c = (7 - (e >>> 8) << 4) + 3
        }else {
          if(d == 9) {
            d = e >= 128 ? 10 : 11;
            do {
              if(d == 10) {
                c = 116
              }else {
                if(d == 11) {
                  d = a >= 64 ? 12 : 13;
                  do {
                    if(d == 12) {
                      c = 133
                    }else {
                      if(d == 13) {
                        d = a >= 32 ? 14 : 15;
                        do {
                          if(d == 14) {
                            c = 150
                          }else {
                            if(d == 15) {
                              d = a >= 16 ? 16 : 17;
                              do {
                                if(d == 16) {
                                  c = 167
                                }else {
                                  if(d == 17) {
                                    d = a >= 8 ? 18 : 19;
                                    do {
                                      if(d == 18) {
                                        c = 184
                                      }else {
                                        if(d == 19) {
                                          d = a >= 4 ? 20 : 21;
                                          do {
                                            if(d == 20) {
                                              c = 201
                                            }else {
                                              if(d == 21) {
                                                d = a >= 2 ? 22 : 23;
                                                do {
                                                  if(d == 22) {
                                                    c = 218
                                                  }else {
                                                    if(d == 23) {
                                                      if(a == 0) {
                                                        d = 25;
                                                        break b
                                                      }
                                                      c = 235
                                                    }
                                                  }
                                                }while(0)
                                              }
                                            }
                                          }while(0)
                                        }
                                      }
                                    }while(0)
                                  }
                                }
                              }while(0)
                            }
                          }
                        }while(0)
                      }
                    }
                  }while(0)
                }
              }
            }while(0)
          }
        }
      }while(0);
      if(!((c >>> 4 & 15) > b)) {
        break a
      }
      c = 0
    }else {
      d == 1 ? c = HEAPU8[_runBefore_1 + (a >>> 10)] : d == 2 ? c = HEAPU8[_runBefore_2 + (a >>> 9)] : d == 3 ? c = HEAPU8[_runBefore_3 + (a >>> 9)] : d == 4 ? c = HEAPU8[_runBefore_4 + (a >>> 8)] : d == 5 ? c = HEAPU8[_runBefore_5 + (a >>> 8)] : d == 6 && (c = HEAPU8[_runBefore_6 + (a >>> 8)])
    }
  }while(0);
  return c
}
_DecodeRunBefore.X = 1;
function _h264bsdInitMbNeighbours(a, b, d) {
  var c, e, f, g;
  e = f = g = 0;
  c = e < d ? 1 : 18;
  a:do {
    if(c == 1) {
      for(;;) {
        c = g != 0 ? 2 : 3;
        c == 2 ? HEAP32[a + e * 216 + 200 >> 2] = a + e * 216 - 216 : c == 3 && (HEAP32[a + e * 216 + 200 >> 2] = 0);
        c = f != 0 ? 5 : 6;
        c == 5 ? HEAP32[a + e * 216 + 204 >> 2] = a + e * 216 + -b * 216 : c == 6 && (HEAP32[a + e * 216 + 204 >> 2] = 0);
        c = f != 0 ? 8 : 10;
        c:do {
          if(c == 8) {
            if(!(g < b - 1)) {
              c = 10;
              break c
            }
            HEAP32[a + e * 216 + 208 >> 2] = a + e * 216 + -(b - 1) * 216;
            c = 11;
            break c
          }
        }while(0);
        c == 10 && (HEAP32[a + e * 216 + 208 >> 2] = 0);
        c = f != 0 ? 12 : 14;
        c:do {
          if(c == 12) {
            if(g == 0) {
              c = 14;
              break c
            }
            HEAP32[a + e * 216 + 212 >> 2] = a + e * 216 + -(b + 1) * 216;
            c = 15;
            break c
          }
        }while(0);
        c == 14 && (HEAP32[a + e * 216 + 212 >> 2] = 0);
        g += 1;
        c = g == b ? 16 : 17;
        c == 16 && (g = 0, f += 1);
        e += 1;
        if(!(e < d)) {
          break a
        }
      }
    }
  }while(0)
}
_h264bsdInitMbNeighbours.X = 1;
function _h264bsdGetNeighbourMb(a, b) {
  var d, c;
  d = b == 0 ? 1 : 2;
  d == 1 ? c = HEAP32[a + 200 >> 2] : d == 2 && (d = b == 1 ? 3 : 4, d == 3 ? c = HEAP32[a + 204 >> 2] : d == 4 && (d = b == 2 ? 5 : 6, d == 5 ? c = HEAP32[a + 208 >> 2] : d == 6 && (d = b == 3 ? 7 : 8, d == 7 ? c = HEAP32[a + 212 >> 2] : d == 8 && (d = b == 4 ? 9 : 10, d == 9 ? c = a : d == 10 && (c = 0)))));
  return c
}
function _h264bsdNeighbour4x4BlockA(a) {
  return _N_A_4x4B + (a << 3)
}
function _h264bsdNeighbour4x4BlockB(a) {
  return _N_B_4x4B + (a << 3)
}
function _h264bsdNeighbour4x4BlockC(a) {
  return _N_C_4x4B + (a << 3)
}
function _h264bsdNeighbour4x4BlockD(a) {
  return _N_D_4x4B + (a << 3)
}
function _h264bsdIsNeighbourAvailable(a, b) {
  var d, c;
  d = b == 0 ? 2 : 1;
  a:do {
    if(d == 1) {
      if(HEAP32[a + 4 >> 2] != HEAP32[b + 4 >> 2]) {
        d = 2;
        break a
      }
      c = 1;
      d = 4;
      break a
    }
  }while(0);
  d == 2 && (c = 0);
  return c
}
function _h264bsdDecodeNalUnit(a, b) {
  var d, c, e;
  e = _h264bsdGetBits(a, 1);
  d = e == -1 ? 1 : 2;
  a:do {
    if(d == 1) {
      c = 1
    }else {
      if(d == 2) {
        e = _h264bsdGetBits(a, 2);
        HEAP32[b + 4 >> 2] = e;
        e = _h264bsdGetBits(a, 5);
        HEAP32[b >> 2] = e;
        d = e == 2 | e == 3 | e == 4 ? 3 : 4;
        do {
          if(d == 3) {
            c = 1
          }else {
            if(d == 4) {
              d = e == 7 | e == 8 | e == 5 ? 5 : 7;
              c:do {
                if(d == 5) {
                  if(HEAP32[b + 4 >> 2] != 0) {
                    break c
                  }
                  c = 1;
                  break a
                }
              }while(0);
              d = e == 6 | e == 9 | e == 10 | e == 11 | e == 12 ? 8 : 10;
              c:do {
                if(d == 8) {
                  if(HEAP32[b + 4 >> 2] == 0) {
                    d = 10;
                    break c
                  }
                  c = 1;
                  break a
                }
              }while(0);
              c = 0
            }
          }
        }while(0)
      }
    }
  }while(0);
  return c
}
_h264bsdDecodeNalUnit.X = 1;
function _h264bsdInitStorage(a) {
  _H264SwDecMemset(a, 0, 3388);
  HEAP32[a + 8 >> 2] = 32;
  HEAP32[a + 4 >> 2] = 256;
  HEAP32[a + 1332 >> 2] = 1
}
function _h264bsdStoreSeqParamSet(a, b) {
  var d, c, e;
  e = HEAP32[b + 8 >> 2];
  d = HEAP32[a + 20 + (e << 2) >> 2] == 0 ? 1 : 3;
  a:do {
    if(d == 1) {
      d = _H264SwDecMalloc(92);
      HEAP32[a + 20 + (e << 2) >> 2] = d;
      if(HEAP32[a + 20 + (e << 2) >> 2] != 0) {
        d = 8;
        break a
      }
      c = 65535;
      d = 9;
      break a
    }else {
      if(d == 3) {
        d = e == HEAP32[a + 8 >> 2] ? 4 : 7;
        do {
          if(d == 4) {
            d = _h264bsdCompareSeqParamSets(b, HEAP32[a + 16 >> 2]) != 0 ? 5 : 6;
            do {
              if(d == 5) {
                _H264SwDecFree(HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 40 >> 2]);
                HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 40 >> 2] = 0;
                _H264SwDecFree(HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 84 >> 2]);
                HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 84 >> 2] = 0;
                HEAP32[a + 8 >> 2] = 33;
                HEAP32[a + 4 >> 2] = 257;
                HEAP32[a + 16 >> 2] = 0;
                HEAP32[a + 12 >> 2] = 0;
                d = 8;
                break a
              }else {
                if(d == 6) {
                  _H264SwDecFree(HEAP32[b + 40 >> 2]);
                  HEAP32[b + 40 >> 2] = 0;
                  _H264SwDecFree(HEAP32[b + 84 >> 2]);
                  c = HEAP32[b + 84 >> 2] = 0;
                  d = 9;
                  break a
                }
              }
            }while(0)
          }else {
            if(d == 7) {
              _H264SwDecFree(HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 40 >> 2]);
              HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 40 >> 2] = 0;
              _H264SwDecFree(HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 84 >> 2]);
              HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 84 >> 2] = 0;
              d = 8;
              break a
            }
          }
        }while(0)
      }
    }
  }while(0);
  if(d == 8) {
    e = HEAP32[a + 20 + (e << 2) >> 2];
    var f;
    c = b;
    d = c + 92;
    if(e % 4 == c % 4) {
      for(;c % 4 !== 0 && c < d;) {
        HEAP8[e++] = HEAP8[c++]
      }
      c >>= 2;
      e >>= 2;
      for(f = d >> 2;c < f;) {
        HEAP32[e++] = HEAP32[c++]
      }
      c <<= 2;
      e <<= 2
    }
    for(;c < d;) {
      HEAP8[e++] = HEAP8[c++]
    }
    c = 0
  }
  return c
}
_h264bsdStoreSeqParamSet.X = 1;
function _h264bsdStorePicParamSet(a, b) {
  var d, c, e;
  e = HEAP32[b >> 2];
  d = HEAP32[a + 148 + (e << 2) >> 2] == 0 ? 1 : 3;
  a:do {
    if(d == 1) {
      d = _H264SwDecMalloc(72);
      HEAP32[a + 148 + (e << 2) >> 2] = d;
      if(HEAP32[a + 148 + (e << 2) >> 2] != 0) {
        d = 8;
        break a
      }
      c = 65535;
      d = 9;
      break a
    }else {
      if(d == 3) {
        d = e == HEAP32[a + 4 >> 2] ? 4 : 7;
        do {
          if(d == 4) {
            d = HEAP32[b + 4 >> 2] != HEAP32[a + 8 >> 2] ? 5 : 6;
            d == 5 && (HEAP32[a + 4 >> 2] = 257);
            _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 20 >> 2]);
            HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 20 >> 2] = 0;
            _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 24 >> 2]);
            HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 24 >> 2] = 0;
            _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 28 >> 2]);
            HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 28 >> 2] = 0;
            _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 44 >> 2]);
            HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 44 >> 2] = 0;
            d = 8;
            break a
          }else {
            if(d == 7) {
              _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 20 >> 2]);
              HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 20 >> 2] = 0;
              _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 24 >> 2]);
              HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 24 >> 2] = 0;
              _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 28 >> 2]);
              HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 28 >> 2] = 0;
              _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 44 >> 2]);
              HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 44 >> 2] = 0;
              d = 8;
              break a
            }
          }
        }while(0)
      }
    }
  }while(0);
  if(d == 8) {
    e = HEAP32[a + 148 + (e << 2) >> 2];
    var f;
    c = b;
    d = c + 72;
    if(e % 4 == c % 4) {
      for(;c % 4 !== 0 && c < d;) {
        HEAP8[e++] = HEAP8[c++]
      }
      c >>= 2;
      e >>= 2;
      for(f = d >> 2;c < f;) {
        HEAP32[e++] = HEAP32[c++]
      }
      c <<= 2;
      e <<= 2
    }
    for(;c < d;) {
      HEAP8[e++] = HEAP8[c++]
    }
    c = 0
  }
  return c
}
_h264bsdStorePicParamSet.X = 1;
function _h264bsdActivateParamSets(a, b, d) {
  var c, e, f, g;
  c = HEAP32[a + 148 + (b << 2) >> 2] == 0 ? 2 : 1;
  a:do {
    if(c == 1) {
      if(HEAP32[a + 20 + (HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 4 >> 2] << 2) >> 2] == 0) {
        c = 2;
        break a
      }
      f = _CheckPps(HEAP32[a + 148 + (b << 2) >> 2], HEAP32[a + 20 + (HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 4 >> 2] << 2) >> 2]);
      c = f != 0 ? 4 : 5;
      do {
        if(c == 4) {
          e = f;
          c = 27;
          break a
        }else {
          if(c == 5) {
            c = HEAP32[a + 4 >> 2] == 256 ? 6 : 7;
            c:do {
              if(c == 6) {
                HEAP32[a + 4 >> 2] = b, HEAP32[a + 12 >> 2] = HEAP32[a + 148 + (b << 2) >> 2], HEAP32[a + 8 >> 2] = HEAP32[HEAP32[a + 12 >> 2] + 4 >> 2], HEAP32[a + 16 >> 2] = HEAP32[a + 20 + (HEAP32[a + 8 >> 2] << 2) >> 2], HEAP32[a + 1176 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2] * HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[a + 1340 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[a + 1344 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2], HEAP32[a + 3380 >> 2] = 1
              }else {
                if(c == 7) {
                  c = HEAP32[a + 3380 >> 2] != 0 ? 8 : 20;
                  do {
                    if(c == 8) {
                      HEAP32[a + 3380 >> 2] = 0;
                      _H264SwDecFree(HEAP32[a + 1212 >> 2]);
                      HEAP32[a + 1212 >> 2] = 0;
                      _H264SwDecFree(HEAP32[a + 1172 >> 2]);
                      HEAP32[a + 1172 >> 2] = 0;
                      f = _H264SwDecMalloc(HEAP32[a + 1176 >> 2] * 216);
                      HEAP32[a + 1212 >> 2] = f;
                      f = _H264SwDecMalloc(HEAP32[a + 1176 >> 2] << 2);
                      HEAP32[a + 1172 >> 2] = f;
                      c = HEAP32[a + 1212 >> 2] == 0 ? 10 : 9;
                      e:do {
                        if(c == 9) {
                          if(HEAP32[a + 1172 >> 2] == 0) {
                            break e
                          }
                          _H264SwDecMemset(HEAP32[a + 1212 >> 2], 0, HEAP32[a + 1176 >> 2] * 216);
                          _h264bsdInitMbNeighbours(HEAP32[a + 1212 >> 2], HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[a + 1176 >> 2]);
                          c = HEAP32[a + 1216 >> 2] != 0 ? 16 : 12;
                          f:do {
                            if(c == 12) {
                              if(HEAP32[HEAP32[a + 16 >> 2] + 16 >> 2] == 2) {
                                c = 16;
                                break f
                              }
                              c = HEAP32[HEAP32[a + 16 >> 2] + 80 >> 2] != 0 ? 14 : 17;
                              g:do {
                                if(c == 14) {
                                  if(HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 920 >> 2] == 0) {
                                    break g
                                  }
                                  if(HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 944 >> 2] == 0) {
                                    c = 16;
                                    break f
                                  }
                                }
                              }while(0);
                              g = 0;
                              c = 18;
                              break f
                            }
                          }while(0);
                          c == 16 && (g = 1);
                          f = a = _h264bsdResetDpb(a + 1220, HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2] * HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[HEAP32[a + 16 >> 2] + 88 >> 2], HEAP32[HEAP32[a + 16 >> 2] + 44 >> 2], HEAP32[HEAP32[a + 16 >> 2] + 12 >> 2], g);
                          if(a == 0) {
                            break c
                          }
                          e = f;
                          c = 27;
                          break a
                        }
                      }while(0);
                      e = 65535;
                      c = 27;
                      break a
                    }else {
                      if(c == 20) {
                        if(b == HEAP32[a + 4 >> 2]) {
                          break c
                        }
                        c = HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 4 >> 2] != HEAP32[a + 8 >> 2] ? 22 : 25;
                        do {
                          if(c == 22) {
                            c = d != 0 ? 23 : 24;
                            do {
                              if(c == 23) {
                                HEAP32[a + 4 >> 2] = b, HEAP32[a + 12 >> 2] = HEAP32[a + 148 + (b << 2) >> 2], HEAP32[a + 8 >> 2] = HEAP32[HEAP32[a + 12 >> 2] + 4 >> 2], HEAP32[a + 16 >> 2] = HEAP32[a + 20 + (HEAP32[a + 8 >> 2] << 2) >> 2], HEAP32[a + 1176 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2] * HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[a + 1340 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[a + 1344 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2], HEAP32[a + 3380 >> 2] = 1
                              }else {
                                if(c == 24) {
                                  e = 1;
                                  c = 27;
                                  break a
                                }
                              }
                            }while(0)
                          }else {
                            c == 25 && (HEAP32[a + 4 >> 2] = b, HEAP32[a + 12 >> 2] = HEAP32[a + 148 + (b << 2) >> 2])
                          }
                        }while(0)
                      }
                    }
                  }while(0)
                }
              }
            }while(0);
            e = 0;
            c = 27;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  c == 2 && (e = 1);
  return e
}
_h264bsdActivateParamSets.X = 1;
function _CheckPps(a, b) {
  var d, c, e, f;
  f = HEAP32[b + 56 >> 2] * HEAP32[b + 52 >> 2];
  d = HEAPU32[a + 12 >> 2] > 1 ? 1 : 23;
  a:do {
    if(d == 1) {
      d = HEAP32[a + 16 >> 2] == 0 ? 2 : 7;
      do {
        if(d == 2) {
          e = 0;
          c:for(;;) {
            if(!(e < HEAPU32[a + 12 >> 2])) {
              d = 23;
              break a
            }
            if(HEAPU32[HEAP32[a + 20 >> 2] + (e << 2) >> 2] > f) {
              break c
            }
            e += 1
          }
          c = 1;
          d = 24;
          break a
        }else {
          if(d == 7) {
            d = HEAP32[a + 16 >> 2] == 2 ? 8 : 16;
            do {
              if(d == 8) {
                e = 0;
                d:for(;;) {
                  if(!(e < HEAP32[a + 12 >> 2] - 1)) {
                    d = 23;
                    break a
                  }
                  if(HEAPU32[HEAP32[a + 24 >> 2] + (e << 2) >> 2] > HEAPU32[HEAP32[a + 28 >> 2] + (e << 2) >> 2]) {
                    d = 12;
                    break d
                  }
                  if(HEAPU32[HEAP32[a + 28 >> 2] + (e << 2) >> 2] >= f) {
                    d = 12;
                    break d
                  }
                  if(HEAPU32[HEAP32[a + 24 >> 2] + (e << 2) >> 2] % HEAPU32[b + 52 >> 2] > HEAPU32[HEAP32[a + 28 >> 2] + (e << 2) >> 2] % HEAPU32[b + 52 >> 2]) {
                    d = 14;
                    break d
                  }
                  e += 1
                }
                do {
                  if(d == 12) {
                    c = 1;
                    d = 24;
                    break a
                  }else {
                    if(d == 14) {
                      c = 1;
                      d = 24;
                      break a
                    }
                  }
                }while(0)
              }else {
                if(d == 16) {
                  d = HEAPU32[a + 16 >> 2] > 2 ? 17 : 20;
                  d:do {
                    if(d == 17) {
                      if(!(HEAPU32[a + 16 >> 2] < 6)) {
                        break d
                      }
                      if(!(HEAPU32[a + 36 >> 2] > f)) {
                        d = 23;
                        break a
                      }
                      c = 1;
                      d = 24;
                      break a
                    }
                  }while(0);
                  if(HEAP32[a + 16 >> 2] != 6) {
                    d = 23;
                    break a
                  }
                  if(!(HEAPU32[a + 40 >> 2] < f)) {
                    d = 23;
                    break a
                  }
                  c = 1;
                  d = 24;
                  break a
                }
              }
            }while(0)
          }
        }
      }while(0)
    }
  }while(0);
  d == 23 && (c = 0);
  return c
}
_CheckPps.X = 1;
function _h264bsdResetStorage(a) {
  var b, d;
  HEAP32[a + 1196 >> 2] = 0;
  d = HEAP32[a + 1192 >> 2] = 0;
  b = d < HEAPU32[a + 1176 >> 2] ? 1 : 2;
  a:do {
    if(b == 1) {
      for(;;) {
        if(HEAP32[HEAP32[a + 1212 >> 2] + d * 216 + 4 >> 2] = 0, HEAP32[HEAP32[a + 1212 >> 2] + d * 216 + 196 >> 2] = 0, d += 1, !(d < HEAPU32[a + 1176 >> 2])) {
          break a
        }
      }
    }
  }while(0)
}
function _h264bsdIsStartOfPicture(a) {
  var b, a = HEAP32[a + 1188 >> 2] == 0 ? 1 : 2;
  a == 1 ? b = 1 : a == 2 && (b = 0);
  return b
}
function _h264bsdIsEndOfPicture(a) {
  var b, d, c, e;
  b = HEAP32[a + 1404 >> 2] != 0 ? 3 : 1;
  a:do {
    if(b == 3) {
      e = c = 0;
      b = c < HEAPU32[a + 1176 >> 2] ? 4 : 5;
      b:do {
        if(b == 4) {
          for(;;) {
            if(e = (HEAP32[HEAP32[a + 1212 >> 2] + c * 216 + 196 >> 2] != 0 ? 1 : 0) + e, c += 1, !(c < HEAPU32[a + 1176 >> 2])) {
              break b
            }
          }
        }
      }while(0);
      if(e != HEAP32[a + 1176 >> 2]) {
        b = 7;
        break a
      }
      d = 1;
      b = 8;
      break a
    }else {
      if(b == 1) {
        if(HEAP32[a + 1196 >> 2] != HEAP32[a + 1176 >> 2]) {
          b = 7;
          break a
        }
        d = 1;
        b = 8;
        break a
      }
    }
  }while(0);
  b == 7 && (d = 0);
  return d
}
_h264bsdIsEndOfPicture.X = 1;
function _h264bsdComputeSliceGroupMap(a, b) {
  _h264bsdDecodeSliceGroupMap(HEAP32[a + 1172 >> 2], HEAP32[a + 12 >> 2], b, HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2])
}
function _h264bsdCheckAccessUnitBoundary(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 28;
  var f, g, h, j = e + 4, l = e + 8, k = e + 12, m = e + 16, o = e + 20, p;
  HEAP32[c >> 2] = 0;
  f = HEAPU32[b >> 2] > 5 ? 1 : 2;
  a:do {
    if(f == 1) {
      f = HEAPU32[b >> 2] < 12 ? 4 : 2;
      break a
    }
  }while(0);
  a:do {
    if(f == 2) {
      f = HEAPU32[b >> 2] > 12 ? 3 : 5;
      do {
        if(f == 3 && HEAPU32[b >> 2] <= 18) {
          f = 4;
          break a
        }
      }while(0);
      f = HEAP32[b >> 2] != 1 ? 6 : 8;
      b:do {
        if(f == 6) {
          if(HEAP32[b >> 2] == 5) {
            break b
          }
          g = 0;
          f = 58;
          break a
        }
      }while(0);
      f = HEAP32[d + 1332 >> 2] != 0 ? 9 : 10;
      f == 9 && (HEAP32[c >> 2] = 1, HEAP32[d + 1332 >> 2] = 0);
      h = f = _h264bsdCheckPpsId(a, e);
      f = f != 0 ? 11 : 12;
      do {
        if(f == 11) {
          g = h;
          f = 58;
          break a
        }else {
          if(f == 12) {
            p = HEAP32[d + 148 + (HEAP32[e >> 2] << 2) >> 2];
            f = p == 0 ? 17 : 13;
            c:do {
              if(f == 13) {
                if(HEAP32[d + 20 + (HEAP32[p + 4 >> 2] << 2) >> 2] == 0) {
                  break c
                }
                f = HEAP32[d + 8 >> 2] != 32 ? 15 : 18;
                d:do {
                  if(f == 15) {
                    if(HEAP32[p + 4 >> 2] == HEAP32[d + 8 >> 2]) {
                      break d
                    }
                    if(HEAP32[b >> 2] != 5) {
                      break c
                    }
                  }
                }while(0);
                g = HEAP32[d + 20 + (HEAP32[p + 4 >> 2] << 2) >> 2];
                f = HEAP32[d + 1304 >> 2] != HEAP32[b + 4 >> 2] ? 19 : 22;
                d:do {
                  if(f == 19) {
                    f = HEAP32[d + 1304 >> 2] == 0 ? 21 : 20;
                    do {
                      if(f == 20 && HEAP32[b + 4 >> 2] != 0) {
                        break d
                      }
                    }while(0);
                    HEAP32[c >> 2] = 1
                  }
                }while(0);
                f = HEAP32[d + 1300 >> 2] == 5 ? 23 : 24;
                d:do {
                  if(f == 23) {
                    f = HEAP32[b >> 2] != 5 ? 26 : 24;
                    break d
                  }
                }while(0);
                d:do {
                  if(f == 24) {
                    if(HEAP32[d + 1300 >> 2] == 5) {
                      f = 27;
                      break d
                    }
                    f = HEAP32[b >> 2] == 5 ? 26 : 27;
                    break d
                  }
                }while(0);
                f == 26 && (HEAP32[c >> 2] = 1);
                f = _h264bsdCheckFrameNum(a, HEAP32[g + 12 >> 2], j) != 0 ? 28 : 29;
                do {
                  if(f == 28) {
                    g = 1;
                    f = 58;
                    break a
                  }else {
                    if(f == 29) {
                      f = HEAP32[d + 1308 >> 2] != HEAP32[j >> 2] ? 30 : 31;
                      f == 30 && (HEAP32[d + 1308 >> 2] = HEAP32[j >> 2], HEAP32[c >> 2] = 1);
                      f = HEAP32[b >> 2] == 5 ? 32 : 38;
                      do {
                        if(f == 32) {
                          h = _h264bsdCheckIdrPicId(a, HEAP32[g + 12 >> 2], HEAP32[b >> 2], l);
                          f = h != 0 ? 33 : 34;
                          do {
                            if(f == 33) {
                              g = 1;
                              f = 58;
                              break a
                            }else {
                              if(f == 34) {
                                f = HEAP32[d + 1300 >> 2] == 5 ? 35 : 37;
                                g:do {
                                  if(f == 35) {
                                    if(HEAP32[d + 1312 >> 2] == HEAP32[l >> 2]) {
                                      f = 37;
                                      break g
                                    }
                                    HEAP32[c >> 2] = 1
                                  }
                                }while(0);
                                HEAP32[d + 1312 >> 2] = HEAP32[l >> 2]
                              }
                            }
                          }while(0)
                        }
                      }while(0);
                      f = HEAP32[g + 16 >> 2] == 0 ? 39 : 48;
                      e:do {
                        if(f == 39) {
                          h = _h264bsdCheckPicOrderCntLsb(a, g, HEAP32[b >> 2], k);
                          f = h != 0 ? 40 : 41;
                          do {
                            if(f == 40) {
                              g = 1;
                              f = 58;
                              break a
                            }else {
                              if(f == 41) {
                                f = HEAP32[d + 1316 >> 2] != HEAP32[k >> 2] ? 42 : 43;
                                f == 42 && (HEAP32[d + 1316 >> 2] = HEAP32[k >> 2], HEAP32[c >> 2] = 1);
                                if(HEAP32[p + 8 >> 2] == 0) {
                                  break e
                                }
                                h = _h264bsdCheckDeltaPicOrderCntBottom(a, g, HEAP32[b >> 2], m);
                                f = h != 0 ? 45 : 46;
                                do {
                                  if(f == 45) {
                                    g = h;
                                    f = 58;
                                    break a
                                  }else {
                                    if(f == 46) {
                                      if(HEAP32[d + 1320 >> 2] == HEAP32[m >> 2]) {
                                        break e
                                      }
                                      HEAP32[d + 1320 >> 2] = HEAP32[m >> 2];
                                      HEAP32[c >> 2] = 1
                                    }
                                  }
                                }while(0)
                              }
                            }
                          }while(0)
                        }else {
                          if(f == 48) {
                            if(HEAP32[g + 16 >> 2] != 1) {
                              break e
                            }
                            if(HEAP32[g + 24 >> 2] != 0) {
                              break e
                            }
                            h = _h264bsdCheckDeltaPicOrderCnt(a, g, HEAP32[b >> 2], HEAP32[p + 8 >> 2], o);
                            f = h != 0 ? 51 : 52;
                            do {
                              if(f == 51) {
                                g = h;
                                f = 58;
                                break a
                              }else {
                                if(f == 52) {
                                  f = HEAP32[d + 1324 >> 2] != HEAP32[o >> 2] ? 53 : 54;
                                  f == 53 && (HEAP32[d + 1324 >> 2] = HEAP32[o >> 2], HEAP32[c >> 2] = 1);
                                  if(HEAP32[p + 8 >> 2] == 0) {
                                    break e
                                  }
                                  if(HEAP32[d + 1328 >> 2] == HEAP32[o + 4 >> 2]) {
                                    break e
                                  }
                                  HEAP32[d + 1328 >> 2] = HEAP32[o + 4 >> 2];
                                  HEAP32[c >> 2] = 1
                                }
                              }
                            }while(0)
                          }
                        }
                      }while(0);
                      a = b;
                      d += 1300;
                      for(b = a + 8;a < b;) {
                        HEAP8[d++] = HEAP8[a++]
                      }
                      g = 0;
                      f = 58;
                      break a
                    }
                  }
                }while(0)
              }
            }while(0);
            g = 65520;
            f = 58;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  f == 4 && (HEAP32[c >> 2] = 1, g = 0);
  STACKTOP = e;
  return g
}
_h264bsdCheckAccessUnitBoundary.X = 1;
function _h264bsdDecodeSliceGroupMap(a, b, d, c, e) {
  var f, g, h, j, l;
  l = j = 0;
  h = e * c;
  f = HEAP32[b + 12 >> 2] == 1 ? 1 : 2;
  a:do {
    if(f == 1) {
      _H264SwDecMemset(a, 0, h << 2)
    }else {
      if(f == 2) {
        f = HEAPU32[b + 16 >> 2] > 2 ? 3 : 13;
        b:do {
          if(f == 3) {
            if(!(HEAPU32[b + 16 >> 2] < 6)) {
              break b
            }
            f = HEAP32[b + 36 >> 2] * d < h ? 5 : 6;
            if(f == 5) {
              var k = HEAP32[b + 36 >> 2] * d
            }else {
              f == 6 && (k = h)
            }
            j = k;
            f = HEAP32[b + 16 >> 2] == 4 ? 9 : 8;
            do {
              if(f == 8 && HEAP32[b + 16 >> 2] != 5) {
                break b
              }
            }while(0);
            f = HEAP32[b + 32 >> 2] != 0 ? 10 : 11;
            if(f == 10) {
              var m = h - j
            }else {
              f == 11 && (m = j)
            }
            l = m
          }
        }while(0);
        f = HEAP32[b + 16 >> 2];
        f = f == 0 ? 14 : f == 1 ? 15 : f == 2 ? 16 : f == 3 ? 17 : f == 4 ? 18 : f == 5 ? 19 : 20;
        do {
          if(f == 20) {
            g = 0;
            if(!(g < h)) {
              break a
            }
            for(;;) {
              if(HEAP32[a + (g << 2) >> 2] = HEAP32[HEAP32[b + 44 >> 2] + (g << 2) >> 2], g += 1, !(g < h)) {
                break a
              }
            }
          }else {
            f == 14 ? _DecodeInterleavedMap(a, HEAP32[b + 12 >> 2], HEAP32[b + 20 >> 2], h) : f == 15 ? _DecodeDispersedMap(a, HEAP32[b + 12 >> 2], c, e) : f == 16 ? _DecodeForegroundLeftOverMap(a, HEAP32[b + 12 >> 2], HEAP32[b + 24 >> 2], HEAP32[b + 28 >> 2], c, e) : f == 17 ? _DecodeBoxOutMap(a, HEAP32[b + 32 >> 2], j, c, e) : f == 18 ? _DecodeRasterScanMap(a, HEAP32[b + 32 >> 2], l, h) : f == 19 && _DecodeWipeMap(a, HEAP32[b + 32 >> 2], l, c, e)
          }
        }while(0)
      }
    }
  }while(0)
}
_h264bsdDecodeSliceGroupMap.X = 1;
function _DecodeInterleavedMap(a, b, d, c) {
  var e, f, g;
  e = 0;
  a:for(;;) {
    g = 0;
    b:for(;;) {
      if(!(g < b)) {
        break b
      }
      if(!(e < c)) {
        break b
      }
      f = 0;
      c:for(;;) {
        if(!(f < HEAPU32[d + (g << 2) >> 2])) {
          break c
        }
        if(!(f + e < c)) {
          break c
        }
        HEAP32[a + (f + e << 2) >> 2] = g;
        f += 1
      }
      f = g;
      g = f + 1;
      e += HEAP32[d + (f << 2) >> 2]
    }
    if(!(e < c)) {
      break a
    }
  }
}
_DecodeInterleavedMap.X = 1;
function _DecodeDispersedMap(a, b, d, c) {
  var e, f;
  f = c * d;
  e = 0;
  c = e < f ? 1 : 2;
  a:do {
    if(c == 1) {
      for(;;) {
        if(HEAP32[a + (e << 2) >> 2] = ((b * Math.floor(e / d) >>> 1) + e % d) % b, e += 1, !(e < f)) {
          break a
        }
      }
    }
  }while(0)
}
function _DecodeForegroundLeftOverMap(a, b, d, c, e, f) {
  var g, h, j, l, k;
  h = f * e;
  g = 0;
  g < h ? (k = b - 1, f = 1) : (l = b - 1, f = 2);
  a:do {
    if(f == 1) {
      for(;;) {
        if(HEAP32[a + (g << 2) >> 2] = k, g += 1, g < h) {
          k = b - 1
        }else {
          l = b - 1;
          break a
        }
      }
    }
  }while(0);
  b = l - 1;
  f = l != 0 ? 4 : 8;
  a:do {
    if(f == 4) {
      for(;;) {
        f = Math.floor(HEAPU32[d + (b << 2) >> 2] / e);
        k = HEAPU32[d + (b << 2) >> 2] % e;
        l = Math.floor(HEAPU32[c + (b << 2) >> 2] / e);
        g = HEAPU32[c + (b << 2) >> 2] % e;
        h = f;
        f = h <= l ? 5 : 3;
        c:do {
          if(f == 5) {
            for(;;) {
              j = k;
              f = j <= g ? 6 : 7;
              e:do {
                if(f == 6) {
                  for(;;) {
                    if(HEAP32[a + (e * h + j << 2) >> 2] = b, j += 1, !(j <= g)) {
                      f = 7;
                      break e
                    }
                  }
                }
              }while(0);
              h += 1;
              if(!(h <= l)) {
                f = 3;
                break c
              }
            }
          }
        }while(0);
        l = b;
        b = l - 1;
        if(l == 0) {
          break a
        }
      }
    }
  }while(0)
}
_DecodeForegroundLeftOverMap.X = 1;
function _DecodeBoxOutMap(a, b, d, c, e) {
  var f, g, h, j, l, k, m, o, p, r, q;
  h = e * c;
  g = 0;
  f = g < h ? 1 : 2;
  a:do {
    if(f == 1) {
      for(;;) {
        if(HEAP32[a + (g << 2) >> 2] = 1, g += 1, !(g < h)) {
          break a
        }
      }
    }
  }while(0);
  h = c - b >>> 1;
  j = e - b >>> 1;
  m = h;
  o = j;
  p = h;
  r = j;
  l = b - 1;
  k = b;
  g = 0;
  f = g < d ? 3 : 31;
  a:do {
    if(f == 3) {
      for(;;) {
        q = f = HEAP32[a + (c * j + h << 2) >> 2] == 1 ? 1 : 0;
        f = f != 0 ? 4 : 5;
        f == 4 && (HEAP32[a + (c * j + h << 2) >> 2] = 0);
        if(l == -1) {
          f = 6
        }else {
          var n = l;
          f = 11
        }
        c:do {
          if(f == 6) {
            f = h == m ? 7 : 10;
            do {
              if(f == 7) {
                if(m - 1 > 0) {
                  f = 8
                }else {
                  var s = 0;
                  f = 9
                }
                f == 8 && (s = m - 1);
                h = m = s;
                l = 0;
                k = (b << 1) - 1;
                f = 30;
                break c
              }else {
                if(f == 10) {
                  n = l;
                  f = 11;
                  break c
                }
              }
            }while(0)
          }
        }while(0);
        c:do {
          if(f == 11) {
            f = n == 1 ? 12 : 17;
            d:do {
              if(f == 12) {
                if(h != p) {
                  break d
                }
                f = p + 1 < c - 1 ? 14 : 15;
                if(f == 14) {
                  var t = p + 1
                }else {
                  f == 15 && (t = c - 1)
                }
                h = p = t;
                l = 0;
                k = 1 - (b << 1);
                f = 30;
                break c
              }
            }while(0);
            if(k == -1) {
              f = 18
            }else {
              var v = k;
              f = 23
            }
            do {
              if(f == 18) {
                f = j == o ? 19 : 22;
                do {
                  if(f == 19) {
                    if(o - 1 > 0) {
                      f = 20
                    }else {
                      var u = 0;
                      f = 21
                    }
                    f == 20 && (u = o - 1);
                    j = o = u;
                    l = 1 - (b << 1);
                    k = 0;
                    f = 30;
                    break c
                  }else {
                    f == 22 && (v = k)
                  }
                }while(0)
              }
            }while(0);
            f = v == 1 ? 24 : 29;
            d:do {
              if(f == 24) {
                if(j != r) {
                  f = 29;
                  break d
                }
                f = r + 1 < e - 1 ? 26 : 27;
                if(f == 26) {
                  var x = r + 1
                }else {
                  f == 27 && (x = e - 1)
                }
                j = r = x;
                l = (b << 1) - 1;
                k = 0;
                f = 30;
                break c
              }
            }while(0);
            h += l;
            j += k
          }
        }while(0);
        g = (q != 0 ? 1 : 0) + g;
        if(!(g < d)) {
          break a
        }
      }
    }
  }while(0)
}
_DecodeBoxOutMap.X = 1;
function _DecodeRasterScanMap(a, b, d, c) {
  var e, f;
  f = 0;
  e = f < c ? 1 : 5;
  a:do {
    if(e == 1) {
      for(;;) {
        var g = b;
        e = f < d ? 2 : 3;
        e == 2 ? HEAP32[a + (f << 2) >> 2] = g : e == 3 && (HEAP32[a + (f << 2) >> 2] = 1 - g);
        f += 1;
        if(!(f < c)) {
          break a
        }
      }
    }
  }while(0)
}
function _h264bsdValidParamSets(a) {
  var b, d, c, e = c = 0;
  a:for(;;) {
    if(!(e < 256)) {
      b = 7;
      break a
    }
    b = HEAP32[a + 148 + (c << 2) >> 2] != 0 ? 3 : 6;
    b:do {
      if(b == 3) {
        if(HEAP32[a + 20 + (HEAP32[HEAP32[a + 148 + (c << 2) >> 2] + 4 >> 2] << 2) >> 2] == 0) {
          b = 6;
          break b
        }
        if(_CheckPps(HEAP32[a + 148 + (c << 2) >> 2], HEAP32[a + 20 + (HEAP32[HEAP32[a + 148 + (c << 2) >> 2] + 4 >> 2] << 2) >> 2]) == 0) {
          b = 5;
          break a
        }
      }
    }while(0);
    c = e = c + 1
  }
  b == 7 ? d = 1 : b == 5 && (d = 0);
  return d
}
_h264bsdValidParamSets.X = 1;
function _DecodeWipeMap(a, b, d, c, e) {
  var f, g, h, j;
  h = j = 0;
  f = h < c ? 1 : 7;
  a:do {
    if(f == 1) {
      for(;;) {
        g = 0;
        f = g < e ? 2 : 6;
        c:do {
          if(f == 2) {
            for(;;) {
              f = j;
              j = f + 1;
              var l = b;
              f = f < d ? 3 : 4;
              f == 3 ? HEAP32[a + (c * g + h << 2) >> 2] = l : f == 4 && (HEAP32[a + (c * g + h << 2) >> 2] = 1 - l);
              g += 1;
              if(!(g < e)) {
                f = 6;
                break c
              }
            }
          }
        }while(0);
        h += 1;
        if(!(h < c)) {
          break a
        }
      }
    }
  }while(0)
}
_DecodeWipeMap.X = 1;
function _h264bsdGetNeighbourPels(a, b, d, c) {
  var e, f, g, h, j, l, k, m;
  e = d;
  d = c != 0 ? 1 : 17;
  a:do {
    if(d == 1) {
      g = HEAP32[a + 4 >> 2];
      h = HEAP32[a + 8 >> 2] * g;
      k = Math.floor(c / g);
      m = c - g * k;
      g <<= 4;
      j = HEAP32[a >> 2] + (k << 4) * g + (m << 4);
      d = k != 0 ? 2 : 4;
      b:do {
        if(d == 2) {
          l = j + -(g + 1);
          f = 20;
          for(;;) {
            var o = l;
            l = o + 1;
            var o = HEAP8[o], p = b, b = p + 1;
            HEAP8[p] = o;
            o = f;
            f = o - 1;
            if(o == 0) {
              break b
            }
          }
        }
      }while(0);
      d = m != 0 ? 5 : 7;
      b:do {
        if(d == 5) {
          j -= 1;
          f = 15;
          for(;;) {
            if(l = HEAP8[j], o = e, e = o + 1, HEAP8[o] = l, j += g, l = f, f = l - 1, l == 0) {
              break b
            }
          }
        }
      }while(0);
      g >>>= 1;
      j = HEAP32[a >> 2] + (h << 8) + (k << 3) * g + (m << 3);
      d = k != 0 ? 8 : 12;
      b:do {
        if(d == 8) {
          l = j + -(g + 1);
          f = 8;
          c:for(;;) {
            if(k = l, l = k + 1, k = HEAP8[k], o = b, b = o + 1, HEAP8[o] = k, k = f, f = k - 1, k == 0) {
              d = 10;
              break c
            }
          }
          l += (h << 6) - 9;
          f = 8;
          for(;;) {
            if(k = l, l = k + 1, k = HEAP8[k], o = b, b = o + 1, HEAP8[o] = k, k = f, f = k - 1, k == 0) {
              d = 12;
              break b
            }
          }
        }
      }while(0);
      if(m == 0) {
        break a
      }
      j -= 1;
      f = 7;
      b:for(;;) {
        if(m = HEAP8[j], l = e, e = l + 1, HEAP8[l] = m, j += g, m = f, f = m - 1, m == 0) {
          d = 15;
          break b
        }
      }
      j += (h << 6) - (g << 3);
      f = 7;
      for(;;) {
        if(h = HEAP8[j], m = e, e = m + 1, HEAP8[m] = h, j += g, h = f, f = h - 1, h == 0) {
          break a
        }
      }
    }
  }while(0)
}
_h264bsdGetNeighbourPels.X = 1;
function _h264bsdIntraPrediction(a, b, d, c, e, f) {
  var g = STACKTOP;
  STACKTOP += 72;
  var h, j, l = g + 40;
  _h264bsdGetNeighbourPels(d, g, l, c);
  h = _h264bsdMbPartPredMode(HEAP32[a >> 2]) == 1 ? 1 : 3;
  a:do {
    if(h == 1) {
      c = _h264bsdIntra16x16Prediction(a, f, b + 328, g, l, e);
      if(c == 0) {
        h = 5;
        break a
      }
      j = c;
      h = 10;
      break a
    }else {
      if(h == 3) {
        c = _h264bsdIntra4x4Prediction(a, f, b, g, l, e);
        if(c == 0) {
          h = 5;
          break a
        }
        j = c;
        h = 10;
        break a
      }
    }
  }while(0);
  h == 5 && (c = b = _h264bsdIntraChromaPrediction(a, f + 256, b + 1352, g + 21, l + 16, HEAP32[b + 140 >> 2], e), h = b != 0 ? 6 : 7, h == 6 ? j = c : h == 7 && (h = HEAPU32[a + 196 >> 2] > 1 ? 8 : 9, h == 8 ? j = 0 : h == 9 && (_h264bsdWriteMacroblock(d, f), j = 0)));
  STACKTOP = g;
  return j
}
_h264bsdIntraPrediction.X = 1;
function _h264bsdIntra16x16Prediction(a, b, d, c, e, f) {
  var g, h, j, l, k;
  j = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 200 >> 2]);
  g = j != 0 ? 1 : 4;
  a:do {
    if(g == 1) {
      if(f == 0) {
        break a
      }
      if(_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 200 >> 2] >> 2]) != 2) {
        break a
      }
      j = 0
    }
  }while(0);
  l = g = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 204 >> 2]);
  g = g != 0 ? 5 : 8;
  a:do {
    if(g == 5) {
      if(f == 0) {
        break a
      }
      if(_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 204 >> 2] >> 2]) != 2) {
        break a
      }
      l = 0
    }
  }while(0);
  k = g = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 212 >> 2]);
  g = g != 0 ? 9 : 12;
  a:do {
    if(g == 9) {
      if(f == 0) {
        break a
      }
      if(_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 212 >> 2] >> 2]) != 2) {
        break a
      }
      k = 0
    }
  }while(0);
  a = _h264bsdPredModeIntra16x16(HEAP32[a >> 2]);
  g = a == 0 ? 13 : a == 1 ? 16 : a == 2 ? 19 : 20;
  a:do {
    if(g == 20) {
      g = j != 0 ? 21 : 23;
      b:do {
        if(g == 21) {
          if(l == 0) {
            break b
          }
          if(k == 0) {
            break b
          }
          _Intra16x16PlanePrediction(b, c + 1, e);
          g = 25;
          break a
        }
      }while(0);
      h = 1;
      g = 28;
      break a
    }else {
      if(g == 13) {
        g = l != 0 ? 15 : 14;
        do {
          if(g == 15) {
            _Intra16x16VerticalPrediction(b, c + 1);
            g = 25;
            break a
          }else {
            if(g == 14) {
              h = 1;
              g = 28;
              break a
            }
          }
        }while(0)
      }else {
        if(g == 16) {
          g = j != 0 ? 18 : 17;
          do {
            if(g == 18) {
              _Intra16x16HorizontalPrediction(b, e);
              g = 25;
              break a
            }else {
              if(g == 17) {
                h = 1;
                g = 28;
                break a
              }
            }
          }while(0)
        }else {
          if(g == 19) {
            _Intra16x16DcPrediction(b, c + 1, e, j, l);
            g = 25;
            break a
          }
        }
      }
    }
  }while(0);
  do {
    if(g == 25) {
      c = 0;
      b:for(;;) {
        if(_h264bsdAddResidual(b, d + (c << 6), c), c = e = c + 1, !(e < 16)) {
          g = 27;
          break b
        }
      }
      h = 0
    }
  }while(0);
  return h
}
_h264bsdIntra16x16Prediction.X = 1;
function _Intra16x16VerticalPrediction(a, b) {
  var d, c, e;
  d = a;
  c = 0;
  a:for(;;) {
    e = 0;
    b:for(;;) {
      var f = HEAP8[b + e], g = d;
      d = g + 1;
      HEAP8[g] = f;
      e = f = e + 1;
      if(!(f < 16)) {
        break b
      }
    }
    c = e = c + 1;
    if(!(e < 16)) {
      break a
    }
  }
}
function _Intra16x16HorizontalPrediction(a, b) {
  var d, c, e;
  d = a;
  c = 0;
  a:for(;;) {
    e = 0;
    var f = c;
    b:for(;;) {
      var g = HEAP8[b + f], f = d;
      d = f + 1;
      HEAP8[f] = g;
      e = f = e + 1;
      g = c;
      if(f < 16) {
        f = g
      }else {
        break b
      }
    }
    c = e = g + 1;
    if(!(e < 16)) {
      break a
    }
  }
}
function _Intra16x16DcPrediction(a, b, d, c, e) {
  var f, g;
  if(c != 0) {
    f = 1
  }else {
    var h = e;
    f = 10
  }
  a:do {
    if(f == 1) {
      f = e != 0 ? 2 : 5;
      do {
        if(f == 2) {
          g = c = 0;
          c:for(;;) {
            if(g = g + HEAPU8[b + c] + HEAPU8[d + c], c = f = c + 1, !(f < 16)) {
              break c
            }
          }
          g = g + 16 >>> 5;
          f = 15;
          break a
        }else {
          if(f == 5) {
            f = c != 0 ? 6 : 9;
            do {
              if(f == 6) {
                g = c = 0;
                d:for(;;) {
                  if(g += HEAPU8[d + c], c = f = c + 1, !(f < 16)) {
                    break d
                  }
                }
                g = g + 8 >>> 4;
                f = 15;
                break a
              }else {
                if(f == 9) {
                  h = e;
                  f = 10;
                  break a
                }
              }
            }while(0)
          }
        }
      }while(0)
    }
  }while(0);
  do {
    if(f == 10) {
      f = h != 0 ? 11 : 14;
      do {
        if(f == 11) {
          g = c = 0;
          c:for(;;) {
            if(g += HEAPU8[b + c], c = d = c + 1, !(d < 16)) {
              f = 13;
              break c
            }
          }
          g = g + 8 >>> 4
        }else {
          f == 14 && (g = 128)
        }
      }while(0)
    }
  }while(0);
  c = 0;
  a:for(;;) {
    if(HEAP8[a + c] = g & 255, c = b = c + 1, !(b < 256)) {
      break a
    }
  }
}
_Intra16x16DcPrediction.X = 1;
function _h264bsdIntra4x4Prediction(a, b, d, c, e, f) {
  var g = STACKTOP;
  STACKTOP += 52;
  var h, j, l, k, m = g + 8, o, p, r = g + 16, q = g + 28, n = g + 36, s, t, v;
  l = 0;
  var u = q + 1, x = r + 1, w = q + 1, y = r + 1, D = q + 1, E = r + 1, F = r + 4, H = r + 5, L = r + 1, I = q + 1, B = r + 1, J = q + 1, M = r + 1, C = q + 1, N = r + 1, O = r + 4, P = r + 5;
  s = 0;
  a:for(;;) {
    if(!(s < 16)) {
      h = 57;
      break a
    }
    var z, A;
    h = _h264bsdNeighbour4x4BlockA(l);
    z = g;
    for(A = h + 8;h < A;) {
      HEAP8[z++] = HEAP8[h++]
    }
    o = _h264bsdGetNeighbourMb(a, HEAP32[g >> 2]);
    s = _h264bsdIsNeighbourAvailable(a, o);
    h = s != 0 ? 3 : 6;
    b:do {
      if(h == 3) {
        if(f == 0) {
          break b
        }
        if(_h264bsdMbPartPredMode(HEAP32[o >> 2]) != 2) {
          break b
        }
        s = 0
      }
    }while(0);
    h = _h264bsdNeighbour4x4BlockB(l);
    z = m;
    for(A = h + 8;h < A;) {
      HEAP8[z++] = HEAP8[h++]
    }
    p = _h264bsdGetNeighbourMb(a, HEAP32[m >> 2]);
    t = h = _h264bsdIsNeighbourAvailable(a, p);
    h = h != 0 ? 7 : 10;
    b:do {
      if(h == 7) {
        if(f == 0) {
          break b
        }
        if(_h264bsdMbPartPredMode(HEAP32[p >> 2]) != 2) {
          break b
        }
        t = 0
      }
    }while(0);
    v = d;
    if(s != 0) {
      h = 11
    }else {
      var K = 0;
      h = 12
    }
    h == 11 && (K = t != 0);
    k = _DetermineIntra4x4PredMode(v, K, g, m, l, o, p);
    HEAP8[l + (a + 82)] = k & 255;
    h = _h264bsdNeighbour4x4BlockC(l);
    z = g;
    for(A = h + 8;h < A;) {
      HEAP8[z++] = HEAP8[h++]
    }
    o = _h264bsdGetNeighbourMb(a, HEAP32[g >> 2]);
    p = h = _h264bsdIsNeighbourAvailable(a, o);
    h = h != 0 ? 13 : 16;
    b:do {
      if(h == 13) {
        if(f == 0) {
          break b
        }
        if(_h264bsdMbPartPredMode(HEAP32[o >> 2]) != 2) {
          break b
        }
        p = 0
      }
    }while(0);
    h = _h264bsdNeighbour4x4BlockD(l);
    z = g;
    for(A = h + 8;h < A;) {
      HEAP8[z++] = HEAP8[h++]
    }
    o = _h264bsdGetNeighbourMb(a, HEAP32[g >> 2]);
    v = h = _h264bsdIsNeighbourAvailable(a, o);
    h = h != 0 ? 17 : 20;
    b:do {
      if(h == 17) {
        if(f == 0) {
          break b
        }
        if(_h264bsdMbPartPredMode(HEAP32[o >> 2]) != 2) {
          break b
        }
        v = 0
      }
    }while(0);
    _Get4x4NeighbourPels(r, q, b, c, e, l);
    h = k;
    h = h == 0 ? 21 : h == 1 ? 24 : h == 2 ? 27 : h == 3 ? 28 : h == 4 ? 33 : h == 5 ? 38 : h == 6 ? 43 : h == 7 ? 48 : 53;
    do {
      if(h == 53) {
        if(s == 0) {
          h = 54;
          break a
        }
        _Intra4x4HorizontalUpPrediction(n, u)
      }else {
        if(h == 21) {
          if(t == 0) {
            h = 22;
            break a
          }
          _Intra4x4VerticalPrediction(n, x)
        }else {
          if(h == 24) {
            if(s == 0) {
              h = 25;
              break a
            }
            _Intra4x4HorizontalPrediction(n, w)
          }else {
            if(h == 27) {
              _Intra4x4DcPrediction(n, y, D, s, t)
            }else {
              if(h == 28) {
                if(t == 0) {
                  h = 29;
                  break a
                }
                h = p != 0 ? 32 : 31;
                if(h == 31) {
                  var G = HEAP8[F];
                  z = H;
                  A = z + 4;
                  k = G;
                  k < 0 && (k += 256);
                  for(k = k + (k << 8) + (k << 16) + k * 16777216;z % 4 !== 0 && z < A;) {
                    HEAP8[z++] = G
                  }
                  z >>= 2;
                  for(o = A >> 2;z < o;) {
                    HEAP32[z++] = k
                  }
                  for(z <<= 2;z < A;) {
                    HEAP8[z++] = G
                  }
                }
                _Intra4x4DiagonalDownLeftPrediction(n, E)
              }else {
                if(h == 33) {
                  if(s == 0) {
                    h = 36;
                    break a
                  }
                  if(t == 0) {
                    h = 36;
                    break a
                  }
                  if(v == 0) {
                    h = 36;
                    break a
                  }
                  _Intra4x4DiagonalDownRightPrediction(n, L, I)
                }else {
                  if(h == 38) {
                    if(s == 0) {
                      h = 41;
                      break a
                    }
                    if(t == 0) {
                      h = 41;
                      break a
                    }
                    if(v == 0) {
                      h = 41;
                      break a
                    }
                    _Intra4x4VerticalRightPrediction(n, B, J)
                  }else {
                    if(h == 43) {
                      if(s == 0) {
                        h = 46;
                        break a
                      }
                      if(t == 0) {
                        h = 46;
                        break a
                      }
                      if(v == 0) {
                        h = 46;
                        break a
                      }
                      _Intra4x4HorizontalDownPrediction(n, M, C)
                    }else {
                      if(h == 48) {
                        if(t == 0) {
                          h = 49;
                          break a
                        }
                        h = p != 0 ? 52 : 51;
                        if(h == 51) {
                          G = HEAP8[O];
                          z = P;
                          A = z + 4;
                          k = G;
                          k < 0 && (k += 256);
                          for(k = k + (k << 8) + (k << 16) + k * 16777216;z % 4 !== 0 && z < A;) {
                            HEAP8[z++] = G
                          }
                          z >>= 2;
                          for(o = A >> 2;z < o;) {
                            HEAP32[z++] = k
                          }
                          for(z <<= 2;z < A;) {
                            HEAP8[z++] = G
                          }
                        }
                        _Intra4x4VerticalLeftPrediction(n, N)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }while(0);
    _Write4x4To16x16(b, n, l);
    _h264bsdAddResidual(b, d + 328 + (l << 6), l);
    l = s = l + 1
  }
  h == 57 ? j = 0 : h == 22 ? j = 1 : h == 25 ? j = 1 : h == 29 ? j = 1 : h == 36 ? j = 1 : h == 41 ? j = 1 : h == 46 ? j = 1 : h == 49 ? j = 1 : h == 54 && (j = 1);
  STACKTOP = g;
  return j
}
_h264bsdIntra4x4Prediction.X = 1;
function _h264bsdIntraChromaPrediction(a, b, d, c, e, f, g) {
  var h, j, l, k, m, o;
  k = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 200 >> 2]);
  h = k != 0 ? 1 : 4;
  a:do {
    if(h == 1) {
      if(g == 0) {
        break a
      }
      if(_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 200 >> 2] >> 2]) != 2) {
        break a
      }
      k = 0
    }
  }while(0);
  m = o = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 204 >> 2]);
  h = o != 0 ? 5 : 8;
  a:do {
    if(h == 5) {
      if(g == 0) {
        break a
      }
      if(_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 204 >> 2] >> 2]) != 2) {
        break a
      }
      m = 0
    }
  }while(0);
  o = h = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 212 >> 2]);
  h = h != 0 ? 9 : 12;
  a:do {
    if(h == 9) {
      if(g == 0) {
        h = 12;
        break a
      }
      if(_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 212 >> 2] >> 2]) != 2) {
        h = 12;
        break a
      }
      o = 0
    }
  }while(0);
  a = 0;
  g = 16;
  l = 0;
  a:for(;;) {
    if(!(l < 2)) {
      h = 30;
      break a
    }
    h = f == 0 ? 15 : f == 1 ? 16 : f == 2 ? 19 : 22;
    do {
      if(h == 22) {
        if(k == 0) {
          h = 25;
          break a
        }
        if(m == 0) {
          h = 25;
          break a
        }
        if(o == 0) {
          h = 25;
          break a
        }
        _IntraChromaPlanePrediction(b, c + 1, e)
      }else {
        if(h == 15) {
          _IntraChromaDcPrediction(b, c + 1, e, k, m)
        }else {
          if(h == 16) {
            if(k == 0) {
              h = 17;
              break a
            }
            _IntraChromaHorizontalPrediction(b, e)
          }else {
            if(h == 19) {
              if(m == 0) {
                h = 20;
                break a
              }
              _IntraChromaVerticalPrediction(b, c + 1)
            }
          }
        }
      }
    }while(0);
    l = 0;
    var p = b;
    b:for(;;) {
      _h264bsdAddResidual(p, d + (l << 6), g);
      l = p = l + 1;
      g += 1;
      var r = b;
      if(p < 4) {
        p = r
      }else {
        h = 29;
        break b
      }
    }
    b = r + 64;
    c += 9;
    e += 8;
    d += 256;
    a = l = a + 1
  }
  h == 30 ? j = 0 : h == 17 ? j = 1 : h == 20 ? j = 1 : h == 25 && (j = 1);
  return j
}
_h264bsdIntraChromaPrediction.X = 1;
function _Intra16x16PlanePrediction(a, b, d) {
  var c, e, f, g, h;
  e = HEAPU8[d + 15] + HEAPU8[b + 15] << 4;
  f = c = 0;
  a:for(;;) {
    if(f = (HEAPU8[c + (b + 8)] - HEAPU8[b + (6 - c)]) * (c + 1) + f, c = g = c + 1, !(g < 8)) {
      break a
    }
  }
  f = f * 5 + 32 >> 6;
  g = c = 0;
  var j = c + 1, l = HEAPU8[c + (d + 8)];
  a:for(;;) {
    g = (l - HEAPU8[d + (6 - c)]) * j + g;
    c = j = c + 1;
    h = c + 1;
    var k = HEAPU8[c + (d + 8)];
    if(j < 7) {
      j = h, l = k
    }else {
      break a
    }
  }
  g = (k - HEAPU8[b - 1]) * h + g;
  g = g * 5 + 32 >> 6;
  c = 0;
  a:for(;;) {
    b = 0;
    b:for(;;) {
      h = e + 16 + (b - 7) * f + (c - 7) * g >> 5;
      if(e + 16 + (b - 7) * f + (c - 7) * g >> 5 < 0) {
        var m = 0, d = 8
      }else {
        d = 7
      }
      d == 7 && (m = h > 255 ? 255 : h);
      HEAP8[a + ((c << 4) + b)] = m & 255;
      b = d = b + 1;
      if(!(d < 16)) {
        break b
      }
    }
    c = b = c + 1;
    if(!(b < 16)) {
      break a
    }
  }
}
_Intra16x16PlanePrediction.X = 1;
function _h264bsdAddResidual(a, b, d) {
  var c, e, f, g, h, j, l, k, m, o, p;
  c = b;
  p = _h264bsdClip + 512;
  b = HEAP32[c >> 2] == 16777215 ? 6 : 1;
  a:do {
    if(b == 1) {
      b = d < 16 ? 2 : 3;
      b == 2 ? (h = 16, f = HEAP32[_h264bsdBlockX + (d << 2) >> 2], g = HEAP32[_h264bsdBlockY + (d << 2) >> 2]) : b == 3 && (h = 8, f = HEAP32[_h264bsdBlockX + ((d & 3) << 2) >> 2], g = HEAP32[_h264bsdBlockY + ((d & 3) << 2) >> 2]);
      o = a + h * g + f;
      e = 4;
      for(;;) {
        if(j = c, c = j + 4, j = HEAP32[j >> 2], l = HEAPU8[o], k = c, c = k + 4, k = HEAP32[k >> 2], m = HEAPU8[o + 1], HEAP8[o] = HEAP8[p + (l + j)], j = c, c = j + 4, j = HEAP32[j >> 2], l = HEAPU8[o + 2], HEAP8[o + 1] = HEAP8[p + (m + k)], k = c, c = k + 4, k = HEAP32[k >> 2], m = HEAPU8[o + 3], j = HEAPU8[p + (l + j)], k = HEAPU8[p + (m + k)], HEAP8[o + 2] = j & 255, HEAP8[o + 3] = k & 255, o += h, e = j = e - 1, j == 0) {
          break a
        }
      }
    }
  }while(0)
}
_h264bsdAddResidual.X = 1;
function _Get4x4NeighbourPels(a, b, d, c, e, f) {
  var g, h, j;
  h = HEAP32[_h264bsdBlockX + (f << 2) >> 2];
  f = HEAP32[_h264bsdBlockY + (f << 2) >> 2];
  g = h == 0 ? 1 : 2;
  g == 1 ? (g = HEAP8[e + f], j = HEAP8[f + (e + 1)], HEAP8[b + 1] = g, HEAP8[b + 2] = j, g = HEAP8[f + (e + 2)], j = HEAP8[f + (e + 3)], HEAP8[b + 3] = g, HEAP8[b + 4] = j) : g == 2 && (g = HEAP8[d + ((f << 4) - 1 + h)], j = HEAP8[d + (h + 15 + (f << 4))], HEAP8[b + 1] = g, HEAP8[b + 2] = j, g = HEAP8[d + (h + 31 + (f << 4))], j = HEAP8[d + (h + 47 + (f << 4))], HEAP8[b + 3] = g, HEAP8[b + 4] = j);
  g = f == 0 ? 4 : 5;
  g == 4 ? (g = HEAP8[c + h], j = HEAP8[c + h], HEAP8[b] = g, HEAP8[a] = j, g = HEAP8[h + (c + 1)], j = HEAP8[h + (c + 2)], HEAP8[a + 1] = g, HEAP8[a + 2] = j, g = HEAP8[h + (c + 3)], j = HEAP8[h + (c + 4)], HEAP8[a + 3] = g, HEAP8[a + 4] = j, g = HEAP8[h + (c + 5)], j = HEAP8[h + (c + 6)], HEAP8[a + 5] = g, HEAP8[a + 6] = j, g = HEAP8[h + (c + 7)], j = HEAP8[h + (c + 8)], HEAP8[a + 7] = g, HEAP8[a + 8] = j) : g == 5 && (g = HEAP8[d + ((f - 1 << 4) + h)], j = HEAP8[d + (h + 1 + (f - 1 << 4))], HEAP8[a + 
  1] = g, HEAP8[a + 2] = j, g = HEAP8[d + (h + 2 + (f - 1 << 4))], j = HEAP8[d + (h + 3 + (f - 1 << 4))], HEAP8[a + 3] = g, HEAP8[a + 4] = j, g = HEAP8[d + (h + 4 + (f - 1 << 4))], j = HEAP8[d + (h + 5 + (f - 1 << 4))], HEAP8[a + 5] = g, HEAP8[a + 6] = j, g = HEAP8[d + (h + 6 + (f - 1 << 4))], j = HEAP8[d + (h + 7 + (f - 1 << 4))], HEAP8[a + 7] = g, HEAP8[a + 8] = j, c = f - 1, g = h == 0 ? 6 : 7, g == 6 ? (d = HEAP8[e + c], HEAP8[a] = d, HEAP8[b] = d) : g == 7 && (d = HEAP8[d + ((c << 4) - 1 + h)], 
  HEAP8[a] = d, HEAP8[b] = d))
}
_Get4x4NeighbourPels.X = 1;
function _Intra4x4VerticalPrediction(a, b) {
  var d, c;
  d = HEAP8[b];
  c = HEAP8[b + 1];
  HEAP8[a + 12] = d;
  HEAP8[a + 8] = d;
  HEAP8[a + 4] = d;
  HEAP8[a] = d;
  HEAP8[a + 13] = c;
  HEAP8[a + 9] = c;
  HEAP8[a + 5] = c;
  HEAP8[a + 1] = c;
  d = HEAP8[b + 2];
  c = HEAP8[b + 3];
  HEAP8[a + 14] = d;
  HEAP8[a + 10] = d;
  HEAP8[a + 6] = d;
  HEAP8[a + 2] = d;
  HEAP8[a + 15] = c;
  HEAP8[a + 11] = c;
  HEAP8[a + 7] = c;
  HEAP8[a + 3] = c
}
_Intra4x4VerticalPrediction.X = 1;
function _DetermineIntra4x4PredMode(a, b, d, c, e, f, g) {
  var h, j, b = b != 0 ? 2 : 1;
  b == 2 ? (b = _h264bsdMbPartPredMode(HEAP32[f >> 2]) == 0 ? 3 : 4, b == 3 ? h = HEAPU8[f + 82 + HEAPU8[d + 4]] : b == 4 && (h = 2), f = g, b = _h264bsdMbPartPredMode(HEAP32[f >> 2]) == 0 ? 6 : 7, b == 6 ? j = HEAPU8[f + 82 + HEAPU8[c + 4]] : b == 7 && (j = 2), h = h < j ? h : j) : b == 1 && (h = 2);
  b = HEAP32[a + 12 + (e << 2) >> 2] != 0 ? 13 : 10;
  b == 10 && (d = HEAP32[a + 76 + (e << 2) >> 2], b = HEAPU32[a + 76 + (e << 2) >> 2] < h ? 11 : 12, b == 11 ? h = d : b == 12 && (h = d + 1));
  return h
}
_DetermineIntra4x4PredMode.X = 1;
function _Intra4x4HorizontalPrediction(a, b) {
  var d, c;
  d = HEAP8[b];
  c = HEAP8[b + 1];
  HEAP8[a + 3] = d;
  HEAP8[a + 2] = d;
  HEAP8[a + 1] = d;
  HEAP8[a] = d;
  HEAP8[a + 7] = c;
  HEAP8[a + 6] = c;
  HEAP8[a + 5] = c;
  HEAP8[a + 4] = c;
  d = HEAP8[b + 2];
  c = HEAP8[b + 3];
  HEAP8[a + 11] = d;
  HEAP8[a + 10] = d;
  HEAP8[a + 9] = d;
  HEAP8[a + 8] = d;
  HEAP8[a + 15] = c;
  HEAP8[a + 14] = c;
  HEAP8[a + 13] = c;
  HEAP8[a + 12] = c
}
_Intra4x4HorizontalPrediction.X = 1;
function _Intra4x4DcPrediction(a, b, d, c, e) {
  var f, g, h;
  if(c != 0) {
    f = 1
  }else {
    var j = e;
    f = 6
  }
  a:do {
    if(f == 1) {
      f = e != 0 ? 2 : 3;
      do {
        if(f == 2) {
          c = HEAP8[b];
          e = HEAP8[b + 1];
          f = HEAP8[b + 2];
          h = HEAP8[b + 3];
          g = (e & 255) + (c & 255) + (f & 255) + (h & 255);
          c = HEAP8[d];
          e = HEAP8[d + 1];
          f = HEAP8[d + 2];
          h = HEAP8[d + 3];
          g = (e & 255) + (c & 255) + (f & 255) + g + (h & 255);
          g = g + 4 >>> 3;
          f = 9;
          break a
        }else {
          if(f == 3) {
            f = c != 0 ? 4 : 5;
            do {
              if(f == 4) {
                c = HEAP8[d];
                e = HEAP8[d + 1];
                f = HEAP8[d + 2];
                h = HEAP8[d + 3];
                g = (c & 255) + 2 + (e & 255) + (f & 255) + (h & 255) >> 2;
                f = 9;
                break a
              }else {
                if(f == 5) {
                  j = e;
                  f = 6;
                  break a
                }
              }
            }while(0)
          }
        }
      }while(0)
    }
  }while(0);
  f == 6 && (f = j != 0 ? 7 : 8, f == 7 ? (c = HEAP8[b], e = HEAP8[b + 1], f = HEAP8[b + 2], h = HEAP8[b + 3], g = (c & 255) + 2 + (e & 255) + (f & 255) + (h & 255) >> 2) : f == 8 && (g = 128));
  b = g & 255;
  HEAP8[a + 15] = b;
  HEAP8[a + 14] = b;
  HEAP8[a + 13] = b;
  HEAP8[a + 12] = b;
  HEAP8[a + 11] = b;
  HEAP8[a + 10] = b;
  HEAP8[a + 9] = b;
  HEAP8[a + 8] = b;
  HEAP8[a + 7] = b;
  HEAP8[a + 6] = b;
  HEAP8[a + 5] = b;
  HEAP8[a + 4] = b;
  HEAP8[a + 3] = b;
  HEAP8[a + 2] = b;
  HEAP8[a + 1] = b;
  HEAP8[a] = b
}
_Intra4x4DcPrediction.X = 1;
function _Intra4x4DiagonalDownLeftPrediction(a, b) {
  HEAP8[a] = HEAPU8[b] + 2 + (HEAPU8[b + 1] << 1) + HEAPU8[b + 2] >> 2 & 255;
  HEAP8[a + 1] = HEAPU8[b + 1] + 2 + (HEAPU8[b + 2] << 1) + HEAPU8[b + 3] >> 2 & 255;
  HEAP8[a + 4] = HEAPU8[b + 1] + 2 + (HEAPU8[b + 2] << 1) + HEAPU8[b + 3] >> 2 & 255;
  HEAP8[a + 2] = HEAPU8[b + 2] + 2 + (HEAPU8[b + 3] << 1) + HEAPU8[b + 4] >> 2 & 255;
  HEAP8[a + 5] = HEAPU8[b + 2] + 2 + (HEAPU8[b + 3] << 1) + HEAPU8[b + 4] >> 2 & 255;
  HEAP8[a + 8] = HEAPU8[b + 2] + 2 + (HEAPU8[b + 3] << 1) + HEAPU8[b + 4] >> 2 & 255;
  HEAP8[a + 3] = HEAPU8[b + 3] + 2 + (HEAPU8[b + 4] << 1) + HEAPU8[b + 5] >> 2 & 255;
  HEAP8[a + 6] = HEAPU8[b + 3] + 2 + (HEAPU8[b + 4] << 1) + HEAPU8[b + 5] >> 2 & 255;
  HEAP8[a + 9] = HEAPU8[b + 3] + 2 + (HEAPU8[b + 4] << 1) + HEAPU8[b + 5] >> 2 & 255;
  HEAP8[a + 12] = HEAPU8[b + 3] + 2 + (HEAPU8[b + 4] << 1) + HEAPU8[b + 5] >> 2 & 255;
  HEAP8[a + 7] = HEAPU8[b + 4] + 2 + (HEAPU8[b + 5] << 1) + HEAPU8[b + 6] >> 2 & 255;
  HEAP8[a + 10] = HEAPU8[b + 4] + 2 + (HEAPU8[b + 5] << 1) + HEAPU8[b + 6] >> 2 & 255;
  HEAP8[a + 13] = HEAPU8[b + 4] + 2 + (HEAPU8[b + 5] << 1) + HEAPU8[b + 6] >> 2 & 255;
  HEAP8[a + 11] = HEAPU8[b + 5] + 2 + (HEAPU8[b + 6] << 1) + HEAPU8[b + 7] >> 2 & 255;
  HEAP8[a + 14] = HEAPU8[b + 5] + 2 + (HEAPU8[b + 6] << 1) + HEAPU8[b + 7] >> 2 & 255;
  HEAP8[a + 15] = HEAPU8[b + 6] + 2 + HEAPU8[b + 7] * 3 >> 2 & 255
}
_Intra4x4DiagonalDownLeftPrediction.X = 1;
function _Intra4x4DiagonalDownRightPrediction(a, b, d) {
  HEAP8[a] = HEAPU8[b] + 2 + (HEAPU8[b - 1] << 1) + HEAPU8[d] >> 2 & 255;
  HEAP8[a + 5] = HEAPU8[b] + 2 + (HEAPU8[b - 1] << 1) + HEAPU8[d] >> 2 & 255;
  HEAP8[a + 10] = HEAPU8[b] + 2 + (HEAPU8[b - 1] << 1) + HEAPU8[d] >> 2 & 255;
  HEAP8[a + 15] = HEAPU8[b] + 2 + (HEAPU8[b - 1] << 1) + HEAPU8[d] >> 2 & 255;
  HEAP8[a + 1] = HEAPU8[b - 1] + 2 + (HEAPU8[b] << 1) + HEAPU8[b + 1] >> 2 & 255;
  HEAP8[a + 6] = HEAPU8[b - 1] + 2 + (HEAPU8[b] << 1) + HEAPU8[b + 1] >> 2 & 255;
  HEAP8[a + 11] = HEAPU8[b - 1] + 2 + (HEAPU8[b] << 1) + HEAPU8[b + 1] >> 2 & 255;
  HEAP8[a + 2] = HEAPU8[b] + 2 + (HEAPU8[b + 1] << 1) + HEAPU8[b + 2] >> 2 & 255;
  HEAP8[a + 7] = HEAPU8[b] + 2 + (HEAPU8[b + 1] << 1) + HEAPU8[b + 2] >> 2 & 255;
  HEAP8[a + 3] = HEAPU8[b + 1] + 2 + (HEAPU8[b + 2] << 1) + HEAPU8[b + 3] >> 2 & 255;
  HEAP8[a + 4] = HEAPU8[d - 1] + 2 + (HEAPU8[d] << 1) + HEAPU8[d + 1] >> 2 & 255;
  HEAP8[a + 9] = HEAPU8[d - 1] + 2 + (HEAPU8[d] << 1) + HEAPU8[d + 1] >> 2 & 255;
  HEAP8[a + 14] = HEAPU8[d - 1] + 2 + (HEAPU8[d] << 1) + HEAPU8[d + 1] >> 2 & 255;
  HEAP8[a + 8] = HEAPU8[d] + 2 + (HEAPU8[d + 1] << 1) + HEAPU8[d + 2] >> 2 & 255;
  HEAP8[a + 13] = HEAPU8[d] + 2 + (HEAPU8[d + 1] << 1) + HEAPU8[d + 2] >> 2 & 255;
  HEAP8[a + 12] = HEAPU8[d + 1] + 2 + (HEAPU8[d + 2] << 1) + HEAPU8[d + 3] >> 2 & 255
}
_Intra4x4DiagonalDownRightPrediction.X = 1;
function _Intra4x4VerticalRightPrediction(a, b, d) {
  HEAP8[a] = HEAPU8[b - 1] + 1 + HEAPU8[b] >> 1 & 255;
  HEAP8[a + 9] = HEAPU8[b - 1] + 1 + HEAPU8[b] >> 1 & 255;
  HEAP8[a + 5] = HEAPU8[b - 1] + 2 + (HEAPU8[b] << 1) + HEAPU8[b + 1] >> 2 & 255;
  HEAP8[a + 14] = HEAPU8[b - 1] + 2 + (HEAPU8[b] << 1) + HEAPU8[b + 1] >> 2 & 255;
  HEAP8[a + 4] = HEAPU8[b] + 2 + (HEAPU8[b - 1] << 1) + HEAPU8[d] >> 2 & 255;
  HEAP8[a + 13] = HEAPU8[b] + 2 + (HEAPU8[b - 1] << 1) + HEAPU8[d] >> 2 & 255;
  HEAP8[a + 1] = HEAPU8[b] + 1 + HEAPU8[b + 1] >> 1 & 255;
  HEAP8[a + 10] = HEAPU8[b] + 1 + HEAPU8[b + 1] >> 1 & 255;
  HEAP8[a + 6] = HEAPU8[b] + 2 + (HEAPU8[b + 1] << 1) + HEAPU8[b + 2] >> 2 & 255;
  HEAP8[a + 15] = HEAPU8[b] + 2 + (HEAPU8[b + 1] << 1) + HEAPU8[b + 2] >> 2 & 255;
  HEAP8[a + 2] = HEAPU8[b + 1] + 1 + HEAPU8[b + 2] >> 1 & 255;
  HEAP8[a + 11] = HEAPU8[b + 1] + 1 + HEAPU8[b + 2] >> 1 & 255;
  HEAP8[a + 7] = HEAPU8[b + 1] + 2 + (HEAPU8[b + 2] << 1) + HEAPU8[b + 3] >> 2 & 255;
  HEAP8[a + 3] = HEAPU8[b + 2] + 1 + HEAPU8[b + 3] >> 1 & 255;
  HEAP8[a + 8] = HEAPU8[d + 1] + 2 + (HEAPU8[d] << 1) + HEAPU8[d - 1] >> 2 & 255;
  HEAP8[a + 12] = HEAPU8[d + 2] + 2 + (HEAPU8[d + 1] << 1) + HEAPU8[d] >> 2 & 255
}
_Intra4x4VerticalRightPrediction.X = 1;
function _Intra4x4HorizontalDownPrediction(a, b, d) {
  HEAP8[a] = HEAPU8[d - 1] + 1 + HEAPU8[d] >> 1 & 255;
  HEAP8[a + 6] = HEAPU8[d - 1] + 1 + HEAPU8[d] >> 1 & 255;
  HEAP8[a + 5] = HEAPU8[d - 1] + 2 + (HEAPU8[d] << 1) + HEAPU8[d + 1] >> 2 & 255;
  HEAP8[a + 11] = HEAPU8[d - 1] + 2 + (HEAPU8[d] << 1) + HEAPU8[d + 1] >> 2 & 255;
  HEAP8[a + 4] = HEAPU8[d] + 1 + HEAPU8[d + 1] >> 1 & 255;
  HEAP8[a + 10] = HEAPU8[d] + 1 + HEAPU8[d + 1] >> 1 & 255;
  HEAP8[a + 9] = HEAPU8[d] + 2 + (HEAPU8[d + 1] << 1) + HEAPU8[d + 2] >> 2 & 255;
  HEAP8[a + 15] = HEAPU8[d] + 2 + (HEAPU8[d + 1] << 1) + HEAPU8[d + 2] >> 2 & 255;
  HEAP8[a + 8] = HEAPU8[d + 1] + 1 + HEAPU8[d + 2] >> 1 & 255;
  HEAP8[a + 14] = HEAPU8[d + 1] + 1 + HEAPU8[d + 2] >> 1 & 255;
  HEAP8[a + 13] = HEAPU8[d + 1] + 2 + (HEAPU8[d + 2] << 1) + HEAPU8[d + 3] >> 2 & 255;
  HEAP8[a + 12] = HEAPU8[d + 2] + 1 + HEAPU8[d + 3] >> 1 & 255;
  HEAP8[a + 1] = HEAPU8[b] + 2 + (HEAPU8[b - 1] << 1) + HEAPU8[d] >> 2 & 255;
  HEAP8[a + 7] = HEAPU8[b] + 2 + (HEAPU8[b - 1] << 1) + HEAPU8[d] >> 2 & 255;
  HEAP8[a + 2] = HEAPU8[b + 1] + 2 + (HEAPU8[b] << 1) + HEAPU8[b - 1] >> 2 & 255;
  HEAP8[a + 3] = HEAPU8[b + 2] + 2 + (HEAPU8[b + 1] << 1) + HEAPU8[b] >> 2 & 255
}
_Intra4x4HorizontalDownPrediction.X = 1;
function _Intra4x4VerticalLeftPrediction(a, b) {
  HEAP8[a] = HEAPU8[b] + 1 + HEAPU8[b + 1] >> 1 & 255;
  HEAP8[a + 1] = HEAPU8[b + 1] + 1 + HEAPU8[b + 2] >> 1 & 255;
  HEAP8[a + 2] = HEAPU8[b + 2] + 1 + HEAPU8[b + 3] >> 1 & 255;
  HEAP8[a + 3] = HEAPU8[b + 3] + 1 + HEAPU8[b + 4] >> 1 & 255;
  HEAP8[a + 4] = HEAPU8[b] + 2 + (HEAPU8[b + 1] << 1) + HEAPU8[b + 2] >> 2 & 255;
  HEAP8[a + 5] = HEAPU8[b + 1] + 2 + (HEAPU8[b + 2] << 1) + HEAPU8[b + 3] >> 2 & 255;
  HEAP8[a + 6] = HEAPU8[b + 2] + 2 + (HEAPU8[b + 3] << 1) + HEAPU8[b + 4] >> 2 & 255;
  HEAP8[a + 7] = HEAPU8[b + 3] + 2 + (HEAPU8[b + 4] << 1) + HEAPU8[b + 5] >> 2 & 255;
  HEAP8[a + 8] = HEAPU8[b + 1] + 1 + HEAPU8[b + 2] >> 1 & 255;
  HEAP8[a + 9] = HEAPU8[b + 2] + 1 + HEAPU8[b + 3] >> 1 & 255;
  HEAP8[a + 10] = HEAPU8[b + 3] + 1 + HEAPU8[b + 4] >> 1 & 255;
  HEAP8[a + 11] = HEAPU8[b + 4] + 1 + HEAPU8[b + 5] >> 1 & 255;
  HEAP8[a + 12] = HEAPU8[b + 1] + 2 + (HEAPU8[b + 2] << 1) + HEAPU8[b + 3] >> 2 & 255;
  HEAP8[a + 13] = HEAPU8[b + 2] + 2 + (HEAPU8[b + 3] << 1) + HEAPU8[b + 4] >> 2 & 255;
  HEAP8[a + 14] = HEAPU8[b + 3] + 2 + (HEAPU8[b + 4] << 1) + HEAPU8[b + 5] >> 2 & 255;
  HEAP8[a + 15] = HEAPU8[b + 4] + 2 + (HEAPU8[b + 5] << 1) + HEAPU8[b + 6] >> 2 & 255
}
_Intra4x4VerticalLeftPrediction.X = 1;
function _Intra4x4HorizontalUpPrediction(a, b) {
  HEAP8[a] = HEAPU8[b] + 1 + HEAPU8[b + 1] >> 1 & 255;
  HEAP8[a + 1] = HEAPU8[b] + 2 + (HEAPU8[b + 1] << 1) + HEAPU8[b + 2] >> 2 & 255;
  HEAP8[a + 2] = HEAPU8[b + 1] + 1 + HEAPU8[b + 2] >> 1 & 255;
  HEAP8[a + 3] = HEAPU8[b + 1] + 2 + (HEAPU8[b + 2] << 1) + HEAPU8[b + 3] >> 2 & 255;
  HEAP8[a + 4] = HEAPU8[b + 1] + 1 + HEAPU8[b + 2] >> 1 & 255;
  HEAP8[a + 5] = HEAPU8[b + 1] + 2 + (HEAPU8[b + 2] << 1) + HEAPU8[b + 3] >> 2 & 255;
  HEAP8[a + 6] = HEAPU8[b + 2] + 1 + HEAPU8[b + 3] >> 1 & 255;
  HEAP8[a + 7] = HEAPU8[b + 2] + 2 + HEAPU8[b + 3] * 3 >> 2 & 255;
  HEAP8[a + 8] = HEAPU8[b + 2] + 1 + HEAPU8[b + 3] >> 1 & 255;
  HEAP8[a + 9] = HEAPU8[b + 2] + 2 + HEAPU8[b + 3] * 3 >> 2 & 255;
  HEAP8[a + 10] = HEAP8[b + 3];
  HEAP8[a + 11] = HEAP8[b + 3];
  HEAP8[a + 12] = HEAP8[b + 3];
  HEAP8[a + 13] = HEAP8[b + 3];
  HEAP8[a + 14] = HEAP8[b + 3];
  HEAP8[a + 15] = HEAP8[b + 3]
}
_Intra4x4HorizontalUpPrediction.X = 1;
function _Write4x4To16x16(a, b, d) {
  a += (HEAP32[_h264bsdBlockY + (d << 2) >> 2] << 4) + HEAP32[_h264bsdBlockX + (d << 2) >> 2];
  d = a;
  HEAP32[d >> 2] = HEAP32[b >> 2];
  b += 4;
  HEAP32[d + 16 >> 2] = HEAP32[b >> 2];
  b += 4;
  HEAP32[d + 32 >> 2] = HEAP32[b >> 2];
  HEAP32[d + 48 >> 2] = HEAP32[b + 4 >> 2]
}
_Write4x4To16x16.X = 1;
function _IntraChromaDcPrediction(a, b, d, c, e) {
  var f, g, h;
  f = c != 0 ? 1 : 3;
  a:do {
    if(f == 1) {
      if(e == 0) {
        f = 5;
        break a
      }
      g = HEAPU8[b + 1] + HEAPU8[b] + HEAPU8[b + 2] + HEAPU8[b + 3] + HEAPU8[d] + HEAPU8[d + 1] + HEAPU8[d + 2] + HEAPU8[d + 3];
      g = g + 4 >>> 3;
      h = HEAPU8[b + 4] + 2 + HEAPU8[b + 5] + HEAPU8[b + 6] + HEAPU8[b + 7] >> 2;
      f = 8;
      break a
    }else {
      if(f == 3) {
        if(e == 0) {
          f = 5;
          break a
        }
        g = HEAPU8[b] + 2 + HEAPU8[b + 1] + HEAPU8[b + 2] + HEAPU8[b + 3] >> 2;
        h = HEAPU8[b + 4] + 2 + HEAPU8[b + 5] + HEAPU8[b + 6] + HEAPU8[b + 7] >> 2;
        f = 8;
        break a
      }
    }
  }while(0);
  f == 5 && (f = c != 0 ? 6 : 7, f == 6 ? h = g = HEAPU8[d] + 2 + HEAPU8[d + 1] + HEAPU8[d + 2] + HEAPU8[d + 3] >> 2 : f == 7 && (g = h = 128));
  f = 3;
  a:for(;;) {
    var j = a, a = j + 1;
    HEAP8[j] = g & 255;
    j = a;
    a = j + 1;
    HEAP8[j] = g & 255;
    j = a;
    a = j + 1;
    HEAP8[j] = g & 255;
    j = a;
    a = j + 1;
    HEAP8[j] = g & 255;
    j = a;
    a = j + 1;
    HEAP8[j] = h & 255;
    j = a;
    a = j + 1;
    HEAP8[j] = h & 255;
    j = a;
    a = j + 1;
    HEAP8[j] = h & 255;
    j = a;
    a = j + 1;
    HEAP8[j] = h & 255;
    j = f;
    f = j - 1;
    if(j == 0) {
      break a
    }
  }
  f = c != 0 ? 11 : 14;
  f == 11 ? (g = HEAPU8[d + 4] + 2 + HEAPU8[d + 5] + HEAPU8[d + 6] + HEAPU8[d + 7] >> 2, f = e != 0 ? 12 : 13, f == 12 ? (h = HEAPU8[b + 5] + HEAPU8[b + 4] + HEAPU8[b + 6] + HEAPU8[b + 7] + HEAPU8[d + 4] + HEAPU8[d + 5] + HEAPU8[d + 6] + HEAPU8[d + 7], h = h + 4 >>> 3) : f == 13 && (h = g)) : f == 14 && (f = e != 0 ? 15 : 16, f == 15 ? (g = HEAPU8[b] + 2 + HEAPU8[b + 1] + HEAPU8[b + 2] + HEAPU8[b + 3] >> 2, h = HEAPU8[b + 4] + 2 + HEAPU8[b + 5] + HEAPU8[b + 6] + HEAPU8[b + 7] >> 2) : f == 16 && (g = 
  h = 128));
  f = 3;
  a:for(;;) {
    if(b = a, a = b + 1, HEAP8[b] = g & 255, b = a, a = b + 1, HEAP8[b] = g & 255, b = a, a = b + 1, HEAP8[b] = g & 255, b = a, a = b + 1, HEAP8[b] = g & 255, b = a, a = b + 1, HEAP8[b] = h & 255, b = a, a = b + 1, HEAP8[b] = h & 255, b = a, a = b + 1, HEAP8[b] = h & 255, b = a, a = b + 1, HEAP8[b] = h & 255, b = f, f = b - 1, b == 0) {
      break a
    }
  }
}
_IntraChromaDcPrediction.X = 1;
function _IntraChromaHorizontalPrediction(a, b) {
  var d, c, e;
  d = a;
  c = b;
  e = 7;
  a:for(;;) {
    var f = HEAP8[c], g = d;
    d = g + 1;
    HEAP8[g] = f;
    f = HEAP8[c];
    g = d;
    d = g + 1;
    HEAP8[g] = f;
    f = HEAP8[c];
    g = d;
    d = g + 1;
    HEAP8[g] = f;
    f = HEAP8[c];
    g = d;
    d = g + 1;
    HEAP8[g] = f;
    f = HEAP8[c];
    g = d;
    d = g + 1;
    HEAP8[g] = f;
    f = HEAP8[c];
    g = d;
    d = g + 1;
    HEAP8[g] = f;
    f = HEAP8[c];
    g = d;
    d = g + 1;
    HEAP8[g] = f;
    f = c;
    c = f + 1;
    f = HEAP8[f];
    g = d;
    d = g + 1;
    HEAP8[g] = f;
    f = e;
    e = f - 1;
    if(f == 0) {
      break a
    }
  }
}
_IntraChromaHorizontalPrediction.X = 1;
function _IntraChromaVerticalPrediction(a, b) {
  var d, c, e;
  d = a;
  c = b;
  e = 7;
  a:for(;;) {
    HEAP8[d] = HEAP8[c];
    HEAP8[d + 8] = HEAP8[c];
    HEAP8[d + 16] = HEAP8[c];
    HEAP8[d + 24] = HEAP8[c];
    HEAP8[d + 32] = HEAP8[c];
    HEAP8[d + 40] = HEAP8[c];
    HEAP8[d + 48] = HEAP8[c];
    var f = c;
    c = f + 1;
    HEAP8[d + 56] = HEAP8[f];
    d += 1;
    f = e;
    e = f - 1;
    if(f == 0) {
      break a
    }
  }
}
_IntraChromaVerticalPrediction.X = 1;
function _IntraChromaPlanePrediction(a, b, d) {
  var c, e, f, g;
  g = _h264bsdClip + 512;
  c = HEAPU8[d + 7] + HEAPU8[b + 7] << 4;
  e = -HEAPU8[b + 2] + HEAPU8[b + 4] + (HEAPU8[b + 5] - HEAPU8[b + 1] << 1) + (HEAPU8[b + 6] - HEAPU8[b]) * 3 + (HEAPU8[b + 7] - HEAPU8[b - 1] << 2);
  e = e * 17 + 16 >> 5;
  d = -HEAPU8[d + 2] + HEAPU8[d + 4] + (HEAPU8[d + 5] - HEAPU8[d + 1] << 1) + (HEAPU8[d + 6] - HEAPU8[d]) * 3 + (HEAPU8[d + 7] - HEAPU8[b - 1] << 2);
  d = d * 17 + 16 >> 5;
  c = c + 16 + -(d * 3);
  b = 7;
  a:for(;;) {
    f = c - e * 3;
    var h = HEAP8[g + (f >> 5)], j = a, a = j + 1;
    HEAP8[j] = h;
    f += e;
    h = HEAP8[g + (f >> 5)];
    j = a;
    a = j + 1;
    HEAP8[j] = h;
    f += e;
    h = HEAP8[g + (f >> 5)];
    j = a;
    a = j + 1;
    HEAP8[j] = h;
    f += e;
    h = HEAP8[g + (f >> 5)];
    j = a;
    a = j + 1;
    HEAP8[j] = h;
    f += e;
    h = HEAP8[g + (f >> 5)];
    j = a;
    a = j + 1;
    HEAP8[j] = h;
    f += e;
    h = HEAP8[g + (f >> 5)];
    j = a;
    a = j + 1;
    HEAP8[j] = h;
    f += e;
    h = HEAP8[g + (f >> 5)];
    j = a;
    a = j + 1;
    HEAP8[j] = h;
    f += e;
    f = HEAP8[g + (f >> 5)];
    h = a;
    a = h + 1;
    HEAP8[h] = f;
    c += d;
    f = b;
    b = f - 1;
    if(f == 0) {
      break a
    }
  }
}
_IntraChromaPlanePrediction.X = 1;
function _h264bsdInterPrediction(a, b, d, c, e, f) {
  var g = STACKTOP;
  STACKTOP += 24;
  var h, j, l, k, m, o, p;
  o = Math.floor(c / HEAPU32[e + 4 >> 2]);
  p = c - HEAP32[e + 4 >> 2] * o;
  o <<= 4;
  p <<= 4;
  HEAP32[g + 4 >> 2] = HEAP32[e + 4 >> 2];
  HEAP32[g + 8 >> 2] = HEAP32[e + 8 >> 2];
  l = HEAP32[a >> 2];
  h = l == 0 ? 1 : l == 1 ? 1 : l == 2 ? 4 : l == 3 ? 7 : 10;
  a:do {
    if(h == 10) {
      h = _MvPrediction8x8(a, b + 176, d) != 0 ? 11 : 12;
      do {
        if(h == 11) {
          j = 1;
          h = 25;
          break a
        }else {
          if(h == 12) {
            l = 0;
            var r = g;
            for(;;) {
              if(HEAP32[r >> 2] = HEAP32[a + 116 + (l << 2) >> 2], h = _h264bsdSubMbPartMode(HEAP32[b + 176 + (l << 2) >> 2]), k = (l & 1) != 0 ? 8 : 0, m = l < 2 ? 0 : 8, h = h == 0 ? 14 : h == 1 ? 15 : h == 2 ? 16 : 17, h == 17 ? (_h264bsdPredictSamples(f, a + 132 + (l << 2 << 2), g, p, o, k, m, 4, 4), _h264bsdPredictSamples(f, a + 132 + (l << 2 << 2) + 4, g, p, o, k + 4, m, 4, 4), _h264bsdPredictSamples(f, a + 132 + (l << 2 << 2) + 8, g, p, o, k, m + 4, 4, 4), _h264bsdPredictSamples(f, a + 132 + 
              (l << 2 << 2) + 12, g, p, o, k + 4, m + 4, 4, 4)) : h == 14 ? _h264bsdPredictSamples(f, a + 132 + (l << 2 << 2), g, p, o, k, m, 8, 8) : h == 15 ? (_h264bsdPredictSamples(f, a + 132 + (l << 2 << 2), g, p, o, k, m, 8, 4), _h264bsdPredictSamples(f, a + 132 + (l << 2 << 2) + 8, g, p, o, k, m + 4, 8, 4)) : h == 16 && (_h264bsdPredictSamples(f, a + 132 + (l << 2 << 2), g, p, o, k, m, 4, 8), _h264bsdPredictSamples(f, a + 132 + (l << 2 << 2) + 4, g, p, o, k + 4, m, 4, 8)), l = k = l + 1, !(k < 
              4)) {
                h = 19;
                break a
              }
            }
          }
        }
      }while(0)
    }else {
      if(h == 1) {
        h = _MvPrediction16x16(a, b + 12, d) != 0 ? 2 : 3;
        do {
          if(h == 2) {
            j = 1;
            h = 25;
            break a
          }else {
            if(h == 3) {
              HEAP32[g >> 2] = HEAP32[a + 116 >> 2];
              _h264bsdPredictSamples(f, a + 132, g, p, o, 0, 0, 16, 16);
              h = 19;
              break a
            }
          }
        }while(0)
      }else {
        if(h == 4) {
          h = _MvPrediction16x8(a, b + 12, d) != 0 ? 5 : 6;
          do {
            if(h == 5) {
              j = 1;
              h = 25;
              break a
            }else {
              if(h == 6) {
                HEAP32[g >> 2] = HEAP32[a + 116 >> 2];
                _h264bsdPredictSamples(f, a + 132, g, p, o, 0, 0, 16, 8);
                HEAP32[g >> 2] = HEAP32[a + 124 >> 2];
                _h264bsdPredictSamples(f, a + 164, g, p, o, 0, 8, 16, 8);
                h = 19;
                break a
              }
            }
          }while(0)
        }else {
          if(h == 7) {
            h = _MvPrediction8x16(a, b + 12, d) != 0 ? 8 : 9;
            do {
              if(h == 8) {
                j = 1;
                h = 25;
                break a
              }else {
                if(h == 9) {
                  HEAP32[g >> 2] = HEAP32[a + 116 >> 2];
                  _h264bsdPredictSamples(f, a + 132, g, p, o, 0, 0, 8, 16);
                  HEAP32[g >> 2] = HEAP32[a + 120 >> 2];
                  _h264bsdPredictSamples(f, a + 148, g, p, o, 8, 0, 8, 16);
                  h = 19;
                  break a
                }
              }
            }while(0)
          }
        }
      }
    }
  }while(0);
  h == 19 && (h = HEAPU32[a + 196 >> 2] > 1 ? 20 : 21, h == 20 ? j = 0 : h == 21 && (h = HEAP32[a >> 2] != 0 ? 22 : 23, h == 22 ? _h264bsdWriteOutputBlocks(e, c, f, b + 328) : h == 23 && _h264bsdWriteMacroblock(e, f), j = 0));
  STACKTOP = g;
  return j
}
_h264bsdInterPrediction.X = 1;
function _MvPrediction16x16(a, b, d) {
  var c = STACKTOP;
  STACKTOP += 44;
  var e, f, g = c + 4, h = c + 8, j, l, k;
  j = HEAP32[b + 132 >> 2];
  _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 200 >> 2], h, 5);
  _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 12, 10);
  l = h + 8;
  k = h + 20;
  e = HEAP32[a >> 2] == 0 ? 1 : 8;
  a:do {
    if(e == 1) {
      e = HEAP32[h >> 2] != 0 ? 2 : 7;
      b:do {
        if(e == 2) {
          if(HEAP32[h + 12 >> 2] == 0) {
            break b
          }
          e = HEAP32[h + 4 >> 2] == 0 ? 4 : 5;
          do {
            if(e == 4 && HEAP32[l >> 2] == 0) {
              break b
            }
          }while(0);
          if(HEAP32[h + 16 >> 2] != 0) {
            e = 8;
            break a
          }
          if(HEAP32[k >> 2] != 0) {
            e = 8;
            break a
          }
        }
      }while(0);
      HEAP16[c + 2 >> 1] = 0;
      HEAP16[c >> 1] = 0;
      e = 14;
      break a
    }
  }while(0);
  a:do {
    if(e == 8) {
      l = c;
      e = b + 148;
      for(k = e + 4;e < k;) {
        HEAP8[l++] = HEAP8[e++]
      }
      _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 208 >> 2], h + 24, 10);
      e = HEAP32[h + 24 >> 2] != 0 ? 10 : 9;
      e == 9 && _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 212 >> 2], h + 24, 15);
      _GetPredictionMv(g, h, j);
      HEAP16[c >> 1] = HEAP16[c >> 1] + HEAP16[g >> 1] & 65535;
      HEAP16[c + 2 >> 1] = HEAP16[c + 2 >> 1] + HEAP16[g + 2 >> 1] & 65535;
      e = HEAP16[c >> 1] + 8192 >= 16384 ? 11 : 12;
      do {
        if(e == 11) {
          f = 1;
          e = 17;
          break a
        }else {
          if(e == 12) {
            if(!(HEAP16[c + 2 >> 1] + 2048 >= 4096)) {
              e = 14;
              break a
            }
            f = 1;
            e = 17;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  if(e == 14) {
    if(b = _h264bsdGetRefPicData(d, j), e = b == 0 ? 15 : 16, e == 15) {
      f = 1
    }else {
      if(e == 16) {
        f = a + 132;
        var d = a + 136, g = a + 140, h = a + 144, m = a + 148, o = a + 152, p = a + 156, r = a + 160, q = a + 164, n = a + 168, s = a + 172, t = a + 176, v = a + 180, u = a + 184, x = a + 188;
        e = c;
        l = a + 192;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        _llvm_memmove_p0i8_p0i8_i32(x, c, 4, 2, 0);
        e = x;
        l = u;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        _llvm_memmove_p0i8_p0i8_i32(v, x, 4, 2, 0);
        e = v;
        l = t;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        _llvm_memmove_p0i8_p0i8_i32(s, v, 4, 2, 0);
        e = s;
        l = n;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        _llvm_memmove_p0i8_p0i8_i32(q, s, 4, 2, 0);
        e = q;
        l = r;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        _llvm_memmove_p0i8_p0i8_i32(p, q, 4, 2, 0);
        e = p;
        l = o;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        _llvm_memmove_p0i8_p0i8_i32(m, p, 4, 2, 0);
        e = m;
        l = h;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        _llvm_memmove_p0i8_p0i8_i32(g, m, 4, 2, 0);
        e = g;
        l = d;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        _llvm_memmove_p0i8_p0i8_i32(f, g, 4, 2, 0);
        HEAP32[a + 100 >> 2] = j;
        HEAP32[a + 104 >> 2] = j;
        HEAP32[a + 108 >> 2] = j;
        HEAP32[a + 112 >> 2] = j;
        HEAP32[a + 116 >> 2] = b;
        HEAP32[a + 120 >> 2] = b;
        HEAP32[a + 124 >> 2] = b;
        HEAP32[a + 128 >> 2] = b;
        f = 0
      }
    }
  }
  STACKTOP = c;
  return f
}
_MvPrediction16x16.X = 1;
function _MvPrediction16x8(a, b, d) {
  var c = STACKTOP;
  STACKTOP += 44;
  var e, f, g = c + 4, h = c + 8, j, l, k, m;
  e = b + 148;
  k = c;
  for(m = e + 4;e < m;) {
    HEAP8[k++] = HEAP8[e++]
  }
  j = HEAP32[b + 132 >> 2];
  _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 12, 10);
  e = HEAP32[h + 16 >> 2] == j ? 1 : 2;
  if(e == 1) {
    e = h + 20;
    k = g;
    for(m = e + 4;e < m;) {
      HEAP8[k++] = HEAP8[e++]
    }
  }else {
    e == 2 && (_GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 200 >> 2], h, 5), _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 208 >> 2], h + 24, 10), e = HEAP32[h + 24 >> 2] != 0 ? 4 : 3, e == 3 && _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 212 >> 2], h + 24, 15), _GetPredictionMv(g, h, j))
  }
  HEAP16[c >> 1] = HEAP16[c >> 1] + HEAP16[g >> 1] & 65535;
  HEAP16[c + 2 >> 1] = HEAP16[c + 2 >> 1] + HEAP16[g + 2 >> 1] & 65535;
  e = HEAP16[c >> 1] + 8192 >= 16384 ? 6 : 7;
  if(e == 6) {
    f = 1
  }else {
    if(e == 7) {
      if(e = HEAP16[c + 2 >> 1] + 2048 >= 4096 ? 8 : 9, e == 8) {
        f = 1
      }else {
        if(e == 9) {
          if(l = _h264bsdGetRefPicData(d, j), e = l == 0 ? 10 : 11, e == 10) {
            f = 1
          }else {
            if(e == 11) {
              var o = a + 132, p = a + 136, r = a + 140, q = a + 144, n = a + 148, s = a + 152, t = a + 156;
              e = c;
              k = a + 160;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              _llvm_memmove_p0i8_p0i8_i32(t, c, 4, 2, 0);
              e = t;
              k = s;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              _llvm_memmove_p0i8_p0i8_i32(n, t, 4, 2, 0);
              e = n;
              k = q;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              _llvm_memmove_p0i8_p0i8_i32(r, n, 4, 2, 0);
              e = r;
              k = p;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              _llvm_memmove_p0i8_p0i8_i32(o, r, 4, 2, 0);
              HEAP32[a + 100 >> 2] = j;
              HEAP32[a + 104 >> 2] = j;
              HEAP32[a + 116 >> 2] = l;
              HEAP32[a + 120 >> 2] = l;
              e = b + 152;
              k = c;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              j = HEAP32[b + 136 >> 2];
              _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 200 >> 2], h, 13);
              e = HEAP32[h + 4 >> 2] == j ? 12 : 13;
              if(e == 12) {
                e = h + 8;
                k = g;
                for(m = e + 4;e < m;) {
                  HEAP8[k++] = HEAP8[e++]
                }
              }else {
                if(e == 13) {
                  HEAP32[h + 12 >> 2] = 1;
                  HEAP32[h + 16 >> 2] = HEAP32[a + 100 >> 2];
                  e = a + 132;
                  k = h + 20;
                  for(m = e + 4;e < m;) {
                    HEAP8[k++] = HEAP8[e++]
                  }
                  _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 200 >> 2], h + 24, 7);
                  _GetPredictionMv(g, h, j)
                }
              }
              HEAP16[c >> 1] = HEAP16[c >> 1] + HEAP16[g >> 1] & 65535;
              HEAP16[c + 2 >> 1] = HEAP16[c + 2 >> 1] + HEAP16[g + 2 >> 1] & 65535;
              e = HEAP16[c >> 1] + 8192 >= 16384 ? 15 : 16;
              if(e == 15) {
                f = 1
              }else {
                if(e == 16) {
                  if(e = HEAP16[c + 2 >> 1] + 2048 >= 4096 ? 17 : 18, e == 17) {
                    f = 1
                  }else {
                    if(e == 18) {
                      if(l = _h264bsdGetRefPicData(d, j), e = l == 0 ? 19 : 20, e == 19) {
                        f = 1
                      }else {
                        if(e == 20) {
                          b = a + 164;
                          d = a + 168;
                          f = a + 172;
                          g = a + 176;
                          h = a + 180;
                          o = a + 184;
                          p = a + 188;
                          e = c;
                          k = a + 192;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          _llvm_memmove_p0i8_p0i8_i32(p, c, 4, 2, 0);
                          e = p;
                          k = o;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          _llvm_memmove_p0i8_p0i8_i32(h, p, 4, 2, 0);
                          e = h;
                          k = g;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          _llvm_memmove_p0i8_p0i8_i32(f, h, 4, 2, 0);
                          e = f;
                          k = d;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          _llvm_memmove_p0i8_p0i8_i32(b, f, 4, 2, 0);
                          HEAP32[a + 108 >> 2] = j;
                          HEAP32[a + 112 >> 2] = j;
                          HEAP32[a + 124 >> 2] = l;
                          HEAP32[a + 128 >> 2] = l;
                          f = 0
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  STACKTOP = c;
  return f
}
_MvPrediction16x8.X = 1;
function _MvPrediction8x16(a, b, d) {
  var c = STACKTOP;
  STACKTOP += 44;
  var e, f, g = c + 4, h = c + 8, j, l, k, m;
  e = b + 148;
  k = c;
  for(m = e + 4;e < m;) {
    HEAP8[k++] = HEAP8[e++]
  }
  j = HEAP32[b + 132 >> 2];
  _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 200 >> 2], h, 5);
  e = HEAP32[h + 4 >> 2] == j ? 1 : 2;
  if(e == 1) {
    e = h + 8;
    k = g;
    for(m = e + 4;e < m;) {
      HEAP8[k++] = HEAP8[e++]
    }
  }else {
    e == 2 && (_GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 12, 10), _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 24, 14), e = HEAP32[h + 24 >> 2] != 0 ? 4 : 3, e == 3 && _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 212 >> 2], h + 24, 15), _GetPredictionMv(g, h, j))
  }
  HEAP16[c >> 1] = HEAP16[c >> 1] + HEAP16[g >> 1] & 65535;
  HEAP16[c + 2 >> 1] = HEAP16[c + 2 >> 1] + HEAP16[g + 2 >> 1] & 65535;
  e = HEAP16[c >> 1] + 8192 >= 16384 ? 6 : 7;
  if(e == 6) {
    f = 1
  }else {
    if(e == 7) {
      if(e = HEAP16[c + 2 >> 1] + 2048 >= 4096 ? 8 : 9, e == 8) {
        f = 1
      }else {
        if(e == 9) {
          if(l = _h264bsdGetRefPicData(d, j), e = l == 0 ? 10 : 11, e == 10) {
            f = 1
          }else {
            if(e == 11) {
              var o = a + 132, p = a + 136, r = a + 140, q = a + 144, n = a + 164, s = a + 168, t = a + 172;
              e = c;
              k = a + 176;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              _llvm_memmove_p0i8_p0i8_i32(t, c, 4, 2, 0);
              e = t;
              k = s;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              _llvm_memmove_p0i8_p0i8_i32(n, t, 4, 2, 0);
              e = n;
              k = q;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              _llvm_memmove_p0i8_p0i8_i32(r, n, 4, 2, 0);
              e = r;
              k = p;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              _llvm_memmove_p0i8_p0i8_i32(o, r, 4, 2, 0);
              HEAP32[a + 100 >> 2] = j;
              HEAP32[a + 108 >> 2] = j;
              HEAP32[a + 116 >> 2] = l;
              HEAP32[a + 124 >> 2] = l;
              e = b + 152;
              k = c;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              j = HEAP32[b + 136 >> 2];
              _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 208 >> 2], h + 24, 10);
              e = HEAP32[h + 24 >> 2] != 0 ? 13 : 12;
              e == 12 && _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 24, 11);
              e = HEAP32[h + 28 >> 2] == j ? 14 : 15;
              if(e == 14) {
                e = h + 32;
                k = g;
                for(m = e + 4;e < m;) {
                  HEAP8[k++] = HEAP8[e++]
                }
              }else {
                if(e == 15) {
                  HEAP32[h >> 2] = 1;
                  HEAP32[h + 4 >> 2] = HEAP32[a + 100 >> 2];
                  e = a + 132;
                  k = h + 8;
                  for(m = e + 4;e < m;) {
                    HEAP8[k++] = HEAP8[e++]
                  }
                  _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 12, 14);
                  _GetPredictionMv(g, h, j)
                }
              }
              HEAP16[c >> 1] = HEAP16[c >> 1] + HEAP16[g >> 1] & 65535;
              HEAP16[c + 2 >> 1] = HEAP16[c + 2 >> 1] + HEAP16[g + 2 >> 1] & 65535;
              e = HEAP16[c >> 1] + 8192 >= 16384 ? 17 : 18;
              if(e == 17) {
                f = 1
              }else {
                if(e == 18) {
                  if(e = HEAP16[c + 2 >> 1] + 2048 >= 4096 ? 19 : 20, e == 19) {
                    f = 1
                  }else {
                    if(e == 20) {
                      if(l = _h264bsdGetRefPicData(d, j), e = l == 0 ? 21 : 22, e == 21) {
                        f = 1
                      }else {
                        if(e == 22) {
                          b = a + 148;
                          d = a + 152;
                          f = a + 156;
                          g = a + 160;
                          h = a + 180;
                          o = a + 184;
                          p = a + 188;
                          e = c;
                          k = a + 192;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          _llvm_memmove_p0i8_p0i8_i32(p, c, 4, 2, 0);
                          e = p;
                          k = o;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          _llvm_memmove_p0i8_p0i8_i32(h, p, 4, 2, 0);
                          e = h;
                          k = g;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          _llvm_memmove_p0i8_p0i8_i32(f, h, 4, 2, 0);
                          e = f;
                          k = d;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          _llvm_memmove_p0i8_p0i8_i32(b, f, 4, 2, 0);
                          HEAP32[a + 104 >> 2] = j;
                          HEAP32[a + 112 >> 2] = j;
                          HEAP32[a + 120 >> 2] = l;
                          HEAP32[a + 128 >> 2] = l;
                          f = 0
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  STACKTOP = c;
  return f
}
_MvPrediction8x16.X = 1;
function _MvPrediction8x8(a, b, d) {
  var c, e, f, g, h;
  h = f = 0;
  a:for(;;) {
    if(!(h < 4)) {
      c = 10;
      break a
    }
    h = _h264bsdNumSubMbPart(HEAP32[b + (f << 2) >> 2]);
    HEAP32[a + 100 + (f << 2) >> 2] = HEAP32[b + 16 + (f << 2) >> 2];
    g = _h264bsdGetRefPicData(d, HEAP32[b + 16 + (f << 2) >> 2]);
    HEAP32[a + 116 + (f << 2) >> 2] = g;
    if(HEAP32[a + 116 + (f << 2) >> 2] == 0) {
      c = 3;
      break a
    }
    g = 0;
    b:for(;;) {
      if(!(g < h)) {
        c = 9;
        break b
      }
      if(_MvPrediction(a, b, f, g) != 0) {
        c = 7;
        break a
      }
      g += 1
    }
    f = h = f + 1
  }
  c == 10 ? e = 0 : c == 3 ? e = 1 : c == 7 && (e = 1);
  return e
}
_MvPrediction8x8.X = 1;
function _MedianFilter(a, b, d) {
  var c, e, f;
  c = e = f = a;
  a = b > c ? 1 : 2;
  a:do {
    if(a == 1) {
      c = b
    }else {
      if(a == 2) {
        if(!(b < e)) {
          break a
        }
        e = b
      }
    }
  }while(0);
  a = d > c ? 5 : 6;
  a == 5 ? f = c : a == 6 && (a = d < e ? 7 : 8, a == 7 ? f = e : a == 8 && (f = d));
  return f
}
function _GetInterNeighbour(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 4;
  var f, g;
  HEAP32[d >> 2] = 0;
  HEAP32[d + 4 >> 2] = -1;
  HEAP16[d + 10 >> 1] = 0;
  HEAP16[d + 8 >> 1] = 0;
  f = b != 0 ? 1 : 4;
  a:do {
    if(f == 1) {
      if(a != HEAP32[b + 4 >> 2]) {
        break a
      }
      g = HEAP32[b >> 2];
      HEAP32[d >> 2] = 1;
      if(!(g <= 5)) {
        break a
      }
      var h = e, j;
      g = b + 132 + (c << 2);
      for(j = g + 4;g < j;) {
        HEAP8[h++] = HEAP8[g++]
      }
      g = HEAP32[b + 100 + (c >>> 2 << 2) >> 2];
      HEAP32[d + 4 >> 2] = g;
      g = e;
      h = d + 8;
      for(j = g + 4;g < j;) {
        HEAP8[h++] = HEAP8[g++]
      }
    }
  }while(0);
  STACKTOP = e
}
_GetInterNeighbour.X = 1;
function _h264bsdInterpolateChromaHor(a, b, d, c, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 144;
  var k, m, o, p, r, q, n, s, t, v, u;
  k = d < 0 ? 4 : 1;
  a:do {
    if(k == 1) {
      if(h + (d + 1) > e) {
        k = 4;
        break a
      }
      if(c < 0) {
        k = 4;
        break a
      }
      k = j + c > f ? 4 : 5;
      break a
    }
  }while(0);
  k == 4 && (_h264bsdFillBlock(a, l, d, c, e, f, h + 1, j, h + 1), a += f * e, _h264bsdFillBlock(a, l + (h + 1) * j, d, c, e, f, h + 1, j, h + 1), a = l, c = d = 0, e = h + 1, f = j);
  s = 8 - g;
  u = 0;
  a:for(;;) {
    t = a + (f * u + c) * e + d;
    v = b + (u << 6);
    o = j >>> 1;
    k = j >>> 1 != 0 ? 7 : 10;
    b:do {
      if(k == 7) {
        for(;;) {
          m = h >>> 1;
          k = h >>> 1 != 0 ? 8 : 9;
          d:do {
            if(k == 8) {
              for(;;) {
                if(p = HEAPU8[t + e], q = t, t = q + 1, r = HEAPU8[q], q = HEAPU8[t + e], n = t, t = n + 1, n = HEAPU8[n], p = (q * g + p * s << 3) + 32, p >>>= 6, HEAP8[v + 8] = p & 255, p = (n * g + r * s << 3) + 32, p >>>= 6, r = v, v = r + 1, HEAP8[r] = p & 255, p = HEAPU8[t + e], r = HEAPU8[t], p = (p * g + q * s << 3) + 32, p >>>= 6, HEAP8[v + 8] = p & 255, p = (r * g + n * s << 3) + 32, p >>>= 6, q = v, v = q + 1, HEAP8[q] = p & 255, m = q = m - 1, q == 0) {
                  k = 9;
                  break d
                }
              }
            }
          }while(0);
          v += 16 - h;
          t += (e << 1) - h;
          o = m = o - 1;
          if(m == 0) {
            break b
          }
        }
      }
    }while(0);
    u = k = u + 1;
    if(!(k <= 1)) {
      break a
    }
  }
  STACKTOP = l
}
_h264bsdInterpolateChromaHor.X = 1;
function _MvPrediction(a, b, d, c) {
  var e = STACKTOP;
  STACKTOP += 44;
  var f, g, h = e + 4, j, l, k = e + 8;
  j = b + 32 + (d << 4) + (c << 2);
  f = e;
  for(l = j + 4;j < l;) {
    HEAP8[f++] = HEAP8[j++]
  }
  j = _h264bsdSubMbPartMode(HEAP32[b + (d << 2) >> 2]);
  b = HEAP32[b + 16 + (d << 2) >> 2];
  f = _N_A_SUB_PART + (d << 7) + (j << 5) + (c << 3);
  l = _h264bsdGetNeighbourMb(a, HEAP32[f >> 2]);
  _GetInterNeighbour(HEAP32[a + 4 >> 2], l, k, HEAPU8[f + 4]);
  f = _N_B_SUB_PART + (d << 7) + (j << 5) + (c << 3);
  l = _h264bsdGetNeighbourMb(a, HEAP32[f >> 2]);
  _GetInterNeighbour(HEAP32[a + 4 >> 2], l, k + 12, HEAPU8[f + 4]);
  f = _N_C_SUB_PART + (d << 7) + (j << 5) + (c << 3);
  l = _h264bsdGetNeighbourMb(a, HEAP32[f >> 2]);
  _GetInterNeighbour(HEAP32[a + 4 >> 2], l, k + 24, HEAPU8[f + 4]);
  f = HEAP32[k + 24 >> 2] != 0 ? 2 : 1;
  f == 1 && (f = _N_D_SUB_PART + (d << 7) + (j << 5) + (c << 3), l = _h264bsdGetNeighbourMb(a, HEAP32[f >> 2]), _GetInterNeighbour(HEAP32[a + 4 >> 2], l, k + 24, HEAPU8[f + 4]));
  _GetPredictionMv(h, k, b);
  HEAP16[e >> 1] = HEAP16[e >> 1] + HEAP16[h >> 1] & 65535;
  HEAP16[e + 2 >> 1] = HEAP16[e + 2 >> 1] + HEAP16[h + 2 >> 1] & 65535;
  f = HEAP16[e >> 1] + 8192 >= 16384 ? 3 : 4;
  if(f == 3) {
    g = 1
  }else {
    if(f == 4) {
      if(f = HEAP16[e + 2 >> 1] + 2048 >= 4096 ? 5 : 6, f == 5) {
        g = 1
      }else {
        if(f == 6) {
          f = j == 0 ? 7 : j == 1 ? 8 : j == 2 ? 9 : j == 3 ? 10 : 11;
          if(f == 7) {
            j = e;
            f = a + 132 + (d << 2 << 2);
            for(l = j + 4;j < l;) {
              HEAP8[f++] = HEAP8[j++]
            }
            j = e;
            f = a + 132 + ((d << 2) + 1 << 2);
            for(l = j + 4;j < l;) {
              HEAP8[f++] = HEAP8[j++]
            }
            j = e;
            f = a + 132 + ((d << 2) + 2 << 2);
            for(l = j + 4;j < l;) {
              HEAP8[f++] = HEAP8[j++]
            }
            j = e;
            f = a + 132 + ((d << 2) + 3 << 2);
            for(l = j + 4;j < l;) {
              HEAP8[f++] = HEAP8[j++]
            }
          }else {
            if(f == 8) {
              j = e;
              f = a + 132 + ((c << 1) + (d << 2) << 2);
              for(l = j + 4;j < l;) {
                HEAP8[f++] = HEAP8[j++]
              }
              j = e;
              f = a + 132 + ((d << 2) + 1 + (c << 1) << 2);
              for(l = j + 4;j < l;) {
                HEAP8[f++] = HEAP8[j++]
              }
            }else {
              if(f == 9) {
                j = e;
                f = a + 132 + ((d << 2) + c << 2);
                for(l = j + 4;j < l;) {
                  HEAP8[f++] = HEAP8[j++]
                }
                j = e;
                f = a + 132 + (c + 2 + (d << 2) << 2);
                for(l = j + 4;j < l;) {
                  HEAP8[f++] = HEAP8[j++]
                }
              }else {
                if(f == 10) {
                  j = e;
                  f = a + 132 + ((d << 2) + c << 2);
                  for(l = j + 4;j < l;) {
                    HEAP8[f++] = HEAP8[j++]
                  }
                }
              }
            }
          }
          g = 0
        }
      }
    }
  }
  STACKTOP = e;
  return g
}
_MvPrediction.X = 1;
function _GetPredictionMv(a, b, d) {
  var c, e, f;
  c = HEAP32[b + 12 >> 2] != 0 ? 3 : 1;
  a:do {
    if(c == 1) {
      if(HEAP32[b + 24 >> 2] != 0) {
        c = 3;
        break a
      }
      if(HEAP32[b >> 2] == 0) {
        c = 3;
        break a
      }
      e = b + 8;
      f = a;
      for(c = e + 4;e < c;) {
        HEAP8[f++] = HEAP8[e++]
      }
      c = 11;
      break a
    }
  }while(0);
  if(c == 3) {
    if(e = HEAP32[b + 4 >> 2] == d ? 1 : 0, f = HEAP32[b + 16 >> 2] == d ? 1 : 0, d = HEAP32[b + 28 >> 2] == d ? 1 : 0, c = f + e + d != 1 ? 4 : 5, c == 4) {
      d = _MedianFilter(HEAP16[b + 8 >> 1], HEAP16[b + 20 >> 1], HEAP16[b + 32 >> 1]) & 65535, HEAP16[a >> 1] = d, b = _MedianFilter(HEAP16[b + 10 >> 1], HEAP16[b + 22 >> 1], HEAP16[b + 34 >> 1]) & 65535, HEAP16[a + 2 >> 1] = b
    }else {
      if(c == 5) {
        if(c = e != 0 ? 6 : 7, c == 6) {
          e = b + 8;
          f = a;
          for(c = e + 4;e < c;) {
            HEAP8[f++] = HEAP8[e++]
          }
        }else {
          if(c == 7) {
            if(c = f != 0 ? 8 : 9, c == 8) {
              e = b + 20;
              f = a;
              for(c = e + 4;e < c;) {
                HEAP8[f++] = HEAP8[e++]
              }
            }else {
              if(c == 9) {
                e = b + 32;
                f = a;
                for(c = e + 4;e < c;) {
                  HEAP8[f++] = HEAP8[e++]
                }
              }
            }
          }
        }
      }
    }
  }
}
_GetPredictionMv.X = 1;
function _h264bsdFillBlock(a, b, d, c, e, f, g, h, j) {
  var l, k, m, o, p, r, q;
  l = d;
  k = c;
  m = g + l;
  c = l >= 0 ? 1 : 3;
  a:do {
    if(c == 1) {
      if(!(m <= e)) {
        c = 3;
        break a
      }
      o = 2;
      c = 4;
      break a
    }
  }while(0);
  c == 3 && (o = 4);
  (h + k < 0 ? 5 : 6) == 5 && (k = -h);
  (m < 0 ? 7 : 8) == 7 && (l = -g);
  (k > f ? 9 : 10) == 9 && (k = f);
  (l > e ? 11 : 12) == 11 && (l = e);
  m = g + l;
  d = h + k;
  (l > 0 ? 13 : 14) == 13 && (a += l);
  (k > 0 ? 15 : 16) == 15 && (a += e * k);
  l < 0 ? c = 17 : (p = 0, c = 18);
  c == 17 && (p = -l);
  m > e ? c = 19 : (r = 0, c = 20);
  c == 19 && (r = m - e);
  g = -p + g + -r;
  k < 0 ? c = 21 : (q = 0, c = 22);
  c == 21 && (q = -k);
  k = q;
  if(d > f) {
    c = 23
  }else {
    var n = 0, s = q, c = 24
  }
  c == 23 && (n = d - f, s = k);
  f = n;
  q = -s + h + -f;
  if(s != 0) {
    c = 25
  }else {
    var t = -s + h + -f, c = 27
  }
  do {
    if(c == 25) {
      b:for(;;) {
        if(FUNCTION_TABLE[o](a, b, p, g, r), b += j, k = h = k - 1, h == 0) {
          c = 26;
          break b
        }
      }
      t = q
    }
  }while(0);
  c = t != 0 ? 28 : 29;
  a:do {
    if(c == 28) {
      for(;;) {
        if(FUNCTION_TABLE[o](a, b, p, g, r), a += e, b += j, q = h = q - 1, h == 0) {
          break a
        }
      }
    }
  }while(0);
  a += -e;
  c = f != 0 ? 30 : 31;
  a:do {
    if(c == 30) {
      for(;;) {
        if(FUNCTION_TABLE[o](a, b, p, g, r), b += j, f = e = f - 1, e == 0) {
          break a
        }
      }
    }
  }while(0)
}
_h264bsdFillBlock.X = 1;
function _h264bsdInterpolateChromaVer(a, b, d, c, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 144;
  var k, m, o, p, r, q, n, s, t, v;
  k = d < 0 ? 4 : 1;
  a:do {
    if(k == 1) {
      if(h + d > e) {
        k = 4;
        break a
      }
      if(c < 0) {
        k = 4;
        break a
      }
      k = j + (c + 1) > f ? 4 : 5;
      break a
    }
  }while(0);
  k == 4 && (_h264bsdFillBlock(a, l, d, c, e, f, h, j + 1, h), a += f * e, _h264bsdFillBlock(a, l + (j + 1) * h, d, c, e, f, h, j + 1, h), a = l, c = d = 0, e = h, f = j + 1);
  n = 8 - g;
  v = 0;
  a:for(;;) {
    s = a + (f * v + c) * e + d;
    t = b + (v << 6);
    o = j >>> 1;
    k = j >>> 1 != 0 ? 7 : 10;
    b:do {
      if(k == 7) {
        for(;;) {
          m = h >>> 1;
          k = h >>> 1 != 0 ? 8 : 9;
          d:do {
            if(k == 8) {
              for(;;) {
                if(q = HEAPU8[s + (e << 1)], r = HEAPU8[s + e], p = s, s = p + 1, p = HEAPU8[p], q = (q * g + r * n << 3) + 32, q >>>= 6, HEAP8[t + 8] = q & 255, q = (r * g + p * n << 3) + 32, q >>>= 6, r = t, t = r + 1, HEAP8[r] = q & 255, q = HEAPU8[s + (e << 1)], r = HEAPU8[s + e], p = s, s = p + 1, p = HEAPU8[p], q = (q * g + r * n << 3) + 32, q >>>= 6, HEAP8[t + 8] = q & 255, q = (r * g + p * n << 3) + 32, q >>>= 6, r = t, t = r + 1, HEAP8[r] = q & 255, m = r = m - 1, r == 0) {
                  k = 9;
                  break d
                }
              }
            }
          }while(0);
          t += 16 - h;
          s += (e << 1) - h;
          o = m = o - 1;
          if(m == 0) {
            break b
          }
        }
      }
    }while(0);
    v = k = v + 1;
    if(!(k <= 1)) {
      break a
    }
  }
  STACKTOP = l
}
_h264bsdInterpolateChromaVer.X = 1;
function _h264bsdInterpolateChromaHorVer(a, b, d, c, e, f, g, h, j, l) {
  var k = STACKTOP;
  STACKTOP += 164;
  var m, o, p, r, q, n, s, t, v, u, x, w, y;
  m = d < 0 ? 4 : 1;
  a:do {
    if(m == 1) {
      if(j + (d + 1) > e) {
        m = 4;
        break a
      }
      if(c < 0) {
        m = 4;
        break a
      }
      m = l + (c + 1) > f ? 4 : 5;
      break a
    }
  }while(0);
  m == 4 && (_h264bsdFillBlock(a, k, d, c, e, f, j + 1, l + 1, j + 1), a += f * e, _h264bsdFillBlock(a, k + (l + 1) * (j + 1), d, c, e, f, j + 1, l + 1, j + 1), a = k, c = d = 0, e = j + 1, f = l + 1);
  v = 8 - g;
  u = 8 - h;
  x = 0;
  a:for(;;) {
    w = a + (f * x + c) * e + d;
    y = b + (x << 6);
    p = l >>> 1;
    m = l >>> 1 != 0 ? 7 : 10;
    b:do {
      if(m == 7) {
        for(;;) {
          r = HEAPU8[w];
          n = HEAPU8[w + e];
          t = HEAPU8[w + (e << 1)];
          r *= u;
          r += h * n;
          n *= u;
          n += h * t;
          o = j >>> 1;
          m = j >>> 1 != 0 ? 8 : 9;
          d:do {
            if(m == 8) {
              for(;;) {
                if(w = q = w + 1, q = HEAPU8[q], s = HEAPU8[w + e], t = HEAPU8[w + (e << 1)], q *= u, q += h * s, s *= u, s += h * t, r = v * r + 32, n = v * n + 32, r += g * q, r >>>= 6, n += g * s, n >>>= 6, HEAP8[y + 8] = n & 255, n = y, y = n + 1, HEAP8[n] = r & 255, w = r = w + 1, r = HEAPU8[r], n = HEAPU8[w + e], t = HEAPU8[w + (e << 1)], r *= u, r += h * n, n *= u, n += h * t, q = v * q + 32, s = v * s + 32, q += g * r, q >>>= 6, s += g * n, s >>>= 6, HEAP8[y + 8] = s & 255, s = y, y = s + 
                1, HEAP8[s] = q & 255, o = q = o - 1, q == 0) {
                  m = 9;
                  break d
                }
              }
            }
          }while(0);
          y += 16 - j;
          w += (e << 1) - j;
          p = o = p - 1;
          if(o == 0) {
            break b
          }
        }
      }
    }while(0);
    x = m = x + 1;
    if(!(m <= 1)) {
      break a
    }
  }
  STACKTOP = k
}
_h264bsdInterpolateChromaHorVer.X = 1;
function _h264bsdInterpolateVerHalf(a, b, d, c, e, f, g, h) {
  var j = STACKTOP;
  STACKTOP += 444;
  var l, k, m, o, p, r, q, n;
  l = d;
  k = c;
  c = e;
  d = _h264bsdClip + 512;
  e = l < 0 ? 4 : 1;
  a:do {
    if(e == 1) {
      if(g + l > c) {
        e = 4;
        break a
      }
      if(k < 0) {
        e = 4;
        break a
      }
      e = h + (k + 5) > f ? 4 : 5;
      break a
    }
  }while(0);
  e == 4 && (_h264bsdFillBlock(a, j, l, k, c, f, g, h + 5, g), k = l = 0, a = j, c = g);
  a += c * k + l;
  a += c;
  l = a + c * 5;
  f = h >>> 2;
  e = h >>> 2 != 0 ? 6 : 9;
  a:do {
    if(e == 6) {
      for(;;) {
        h = g;
        if(g != 0) {
          var s = c, e = 7
        }else {
          var t = c, e = 8
        }
        c:do {
          if(e == 7) {
            for(;;) {
              if(r = HEAPU8[l + s * -2], k = HEAPU8[l + -c], m = HEAPU8[l + c], o = HEAPU8[l + (c << 1)], p = l, l = p + 1, q = HEAPU8[p], n = m + r, o -= n << 2, o -= n, o += 16, n = q + k, p = HEAPU8[a + (c << 1)], o += n << 4, o += n << 2, o += p, o = HEAPU8[d + (o >> 5)], m += 16, HEAP8[b + 48] = o & 255, n = q + p, m -= n << 2, m -= n, n = k + r, o = HEAPU8[a + c], m += n << 4, m += n << 2, m += o, m = HEAPU8[d + (m >> 5)], q += 16, HEAP8[b + 32] = m & 255, n = k + o, q -= n << 2, q -= n, n = 
              p + r, m = HEAPU8[a], q += n << 4, q += n << 2, q += m, q = HEAPU8[d + (q >> 5)], k += 16, HEAP8[b + 16] = q & 255, m += r, k -= m << 2, k -= m, p += o, q = HEAPU8[a + -c], k += p << 4, k += p << 2, k += q, k = HEAPU8[d + (k >> 5)], m = b, b = m + 1, HEAP8[m] = k & 255, a += 1, h = k = h - 1, k != 0) {
                s = c
              }else {
                t = c;
                e = 8;
                break c
              }
            }
          }
        }while(0);
        a += (t << 2) - g;
        l += (c << 2) - g;
        b += 64 - g;
        f = h = f - 1;
        if(h == 0) {
          break a
        }
      }
    }
  }while(0);
  STACKTOP = j
}
_h264bsdInterpolateVerHalf.X = 1;
function _h264bsdInterpolateVerQuarter(a, b, d, c, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 444;
  var k, m, o, p, r, q, n, s;
  k = d;
  m = c;
  c = e;
  d = _h264bsdClip + 512;
  e = k < 0 ? 4 : 1;
  a:do {
    if(e == 1) {
      if(g + k > c) {
        e = 4;
        break a
      }
      if(m < 0) {
        e = 4;
        break a
      }
      e = h + (m + 5) > f ? 4 : 5;
      break a
    }
  }while(0);
  e == 4 && (_h264bsdFillBlock(a, l, k, m, c, f, g, h + 5, g), m = k = 0, a = l, c = g);
  a += c * m + k;
  f = a + c;
  a = f + c * 5;
  k = f + (j + 2) * c;
  j = h >>> 2;
  e = h >>> 2 != 0 ? 6 : 9;
  a:do {
    if(e == 6) {
      for(;;) {
        h = g;
        if(g != 0) {
          var t = c, e = 7
        }else {
          var v = c, e = 8
        }
        c:do {
          if(e == 7) {
            for(;;) {
              if(q = HEAPU8[a + t * -2], m = HEAPU8[a + -c], o = HEAPU8[a + c], p = HEAPU8[a + (c << 1)], s = a, a = s + 1, n = HEAPU8[s], s = o + q, p -= s << 2, p -= s, p += 16, s = n + m, r = HEAPU8[f + (c << 1)], p += s << 4, p += s << 2, p += r, p = HEAPU8[d + (p >> 5)], s = HEAPU8[k + (c << 1)], o += 16, p += 1, HEAP8[b + 48] = s + p >> 1 & 255, s = n + r, o -= s << 2, o -= s, s = m + q, p = HEAPU8[f + c], o += s << 4, o += s << 2, o += p, o = HEAPU8[d + (o >> 5)], s = HEAPU8[k + c], n += 16, 
              o += 1, HEAP8[b + 32] = s + o >> 1 & 255, s = m + p, n -= s << 2, n -= s, s = r + q, o = HEAPU8[f], n += s << 4, n += s << 2, n += o, n = HEAPU8[d + (n >> 5)], s = HEAPU8[k], m += 16, n += 1, HEAP8[b + 16] = s + n >> 1 & 255, o += q, m -= o << 2, m -= o, r += p, n = HEAPU8[f + -c], m += r << 4, m += r << 2, m += n, m = HEAPU8[d + (m >> 5)], s = HEAPU8[k + -c], m += 1, o = b, b = o + 1, HEAP8[o] = s + m >> 1 & 255, f += 1, k += 1, h = m = h - 1, m != 0) {
                t = c
              }else {
                v = c;
                e = 8;
                break c
              }
            }
          }
        }while(0);
        f += (v << 2) - g;
        a += (c << 2) - g;
        k += (c << 2) - g;
        b += 64 - g;
        j = h = j - 1;
        if(h == 0) {
          break a
        }
      }
    }
  }while(0);
  STACKTOP = l
}
_h264bsdInterpolateVerQuarter.X = 1;
function _h264bsdInterpolateHorHalf(a, b, d, c, e, f, g, h) {
  var j = STACKTOP;
  STACKTOP += 444;
  var l, k, m, o, p, r, q;
  l = d;
  k = c;
  c = e;
  d = _h264bsdClip + 512;
  e = l < 0 ? 4 : 1;
  a:do {
    if(e == 1) {
      if(g + (l + 5) > c) {
        e = 4;
        break a
      }
      if(k < 0) {
        e = 4;
        break a
      }
      e = h + k > f ? 4 : 5;
      break a
    }
  }while(0);
  e == 4 && (_h264bsdFillBlock(a, j, l, k, c, f, g + 5, h, g + 5), k = l = 0, a = j, c = g + 5);
  a += c * k + l;
  f = a + 5;
  a = h;
  e = h != 0 ? 6 : 9;
  a:do {
    if(e == 6) {
      for(;;) {
        r = HEAPU8[f - 5];
        p = HEAPU8[f - 4];
        o = HEAPU8[f - 3];
        k = HEAPU8[f - 2];
        l = HEAPU8[f - 1];
        h = g >>> 2;
        e = g >>> 2 != 0 ? 7 : 8;
        c:do {
          if(e == 7) {
            for(;;) {
              r += 16;
              q = o + k;
              r += q << 4;
              r += q << 2;
              q = p + l;
              m = f;
              f = m + 1;
              m = HEAPU8[m];
              r -= q << 2;
              r -= q;
              r += m;
              r = HEAPU8[d + (r >> 5)];
              p += 16;
              q = k + l;
              var n = b, b = n + 1;
              HEAP8[n] = r & 255;
              p += q << 4;
              p += q << 2;
              q = o + m;
              r = f;
              f = r + 1;
              r = HEAPU8[r];
              p -= q << 2;
              p -= q;
              p += r;
              p = HEAPU8[d + (p >> 5)];
              o += 16;
              q = l + m;
              n = b;
              b = n + 1;
              HEAP8[n] = p & 255;
              o += q << 4;
              o += q << 2;
              q = k + r;
              p = f;
              f = p + 1;
              p = HEAPU8[p];
              o -= q << 2;
              o -= q;
              o += p;
              o = HEAPU8[d + (o >> 5)];
              k += 16;
              q = m + r;
              n = b;
              b = n + 1;
              HEAP8[n] = o & 255;
              k += q << 4;
              k += q << 2;
              q = l + p;
              o = f;
              f = o + 1;
              o = HEAPU8[o];
              k -= q << 2;
              k -= q;
              k += o;
              k = HEAPU8[d + (k >> 5)];
              q = o;
              o = r;
              r = l;
              l = q;
              q = b;
              b = q + 1;
              HEAP8[q] = k & 255;
              k = p;
              p = m;
              h = m = h - 1;
              if(m == 0) {
                e = 8;
                break c
              }
            }
          }
        }while(0);
        f += c - g;
        b += 16 - g;
        a = h = a - 1;
        if(h == 0) {
          break a
        }
      }
    }
  }while(0);
  STACKTOP = j
}
_h264bsdInterpolateHorHalf.X = 1;
function _h264bsdInterpolateHorQuarter(a, b, d, c, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 444;
  var k, m, o, p, r, q, n;
  m = c;
  c = _h264bsdClip + 512;
  k = d < 0 ? 4 : 1;
  a:do {
    if(k == 1) {
      if(g + (d + 5) > e) {
        k = 4;
        break a
      }
      if(m < 0) {
        k = 4;
        break a
      }
      k = h + m > f ? 4 : 5;
      break a
    }
  }while(0);
  k == 4 && (_h264bsdFillBlock(a, l, d, m, e, f, g + 5, h, g + 5), m = d = 0, a = l, e = g + 5);
  a += e * m + d;
  f = a + 5;
  a = h;
  k = h != 0 ? 6 : 21;
  a:do {
    if(k == 6) {
      for(;;) {
        q = HEAPU8[f - 5];
        r = HEAPU8[f - 4];
        p = HEAPU8[f - 3];
        m = HEAPU8[f - 2];
        d = HEAPU8[f - 1];
        h = g >>> 2;
        k = g >>> 2 != 0 ? 7 : 20;
        c:do {
          if(k == 7) {
            for(;;) {
              if(q += 16, n = p + m, q += n << 4, q += n << 2, n = r + d, k = f, f = k + 1, o = HEAPU8[k], q -= n << 2, q -= n, q += o, q = HEAPU8[c + (q >> 5)], r += 16, k = j != 0 ? 9 : 8, k == 9 ? q += m : k == 8 && (q += p), k = b, b = k + 1, HEAP8[k] = q + 1 >> 1 & 255, n = m + d, r += n << 4, r += n << 2, n = p + o, k = f, f = k + 1, q = HEAPU8[k], r -= n << 2, r -= n, r += q, r = HEAPU8[c + (r >> 5)], p += 16, k = j != 0 ? 12 : 11, k == 12 ? r += d : k == 11 && (r += m), k = b, b = k + 1, 
              HEAP8[k] = r + 1 >> 1 & 255, n = d + o, p += n << 4, p += n << 2, n = m + q, k = f, f = k + 1, r = HEAPU8[k], p -= n << 2, p -= n, p += r, p = HEAPU8[c + (p >> 5)], m += 16, k = j != 0 ? 15 : 14, k == 15 ? p += o : k == 14 && (p += d), k = b, b = k + 1, HEAP8[k] = p + 1 >> 1 & 255, n = o + q, m += n << 4, m += n << 2, n = d + r, k = f, f = k + 1, p = HEAPU8[k], m -= n << 2, m -= n, m += p, m = HEAPU8[c + (m >> 5)], k = j != 0 ? 18 : 17, k == 18 ? m += q : k == 17 && (m += o), n = b, 
              b = n + 1, HEAP8[n] = m + 1 >> 1 & 255, m = r, r = o, n = p, p = q, q = d, d = n, h = o = h - 1, o == 0) {
                k = 20;
                break c
              }
            }
          }
        }while(0);
        f += e - g;
        b += 16 - g;
        a = h = a - 1;
        if(h == 0) {
          break a
        }
      }
    }
  }while(0);
  STACKTOP = l
}
_h264bsdInterpolateHorQuarter.X = 1;
function _h264bsdInterpolateHorVerQuarter(a, b, d, c, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 444;
  var k, m, o, p, r, q, n, s;
  k = d;
  m = c;
  c = e;
  d = _h264bsdClip + 512;
  e = k < 0 ? 4 : 1;
  a:do {
    if(e == 1) {
      if(g + (k + 5) > c) {
        e = 4;
        break a
      }
      if(m < 0) {
        e = 4;
        break a
      }
      e = h + (m + 5) > f ? 4 : 5;
      break a
    }
  }while(0);
  e == 4 && (_h264bsdFillBlock(a, l, k, m, c, f, g + 5, h + 5, g + 5), m = k = 0, a = l, c = g + 5);
  a += c * m + k;
  k = a + (((j & 2) >>> 1) + 2) * c + 5;
  j = c + (a + 2) + (j & 1);
  f = h;
  e = h != 0 ? 6 : 9;
  a:do {
    if(e == 6) {
      for(;;) {
        n = HEAPU8[k - 5];
        q = HEAPU8[k - 4];
        r = HEAPU8[k - 3];
        p = HEAPU8[k - 2];
        m = HEAPU8[k - 1];
        a = g >>> 2;
        e = g >>> 2 != 0 ? 7 : 8;
        c:do {
          if(e == 7) {
            for(;;) {
              n += 16;
              s = r + p;
              n += s << 4;
              n += s << 2;
              s = q + m;
              o = k;
              k = o + 1;
              o = HEAPU8[o];
              n -= s << 2;
              n -= s;
              n += o;
              n = HEAPU8[d + (n >> 5)];
              q += 16;
              s = p + m;
              var t = b, b = t + 1;
              HEAP8[t] = n & 255;
              q += s << 4;
              q += s << 2;
              s = r + o;
              n = k;
              k = n + 1;
              n = HEAPU8[n];
              q -= s << 2;
              q -= s;
              q += n;
              q = HEAPU8[d + (q >> 5)];
              r += 16;
              s = m + o;
              t = b;
              b = t + 1;
              HEAP8[t] = q & 255;
              r += s << 4;
              r += s << 2;
              s = p + n;
              q = k;
              k = q + 1;
              q = HEAPU8[q];
              r -= s << 2;
              r -= s;
              r += q;
              r = HEAPU8[d + (r >> 5)];
              p += 16;
              s = o + n;
              t = b;
              b = t + 1;
              HEAP8[t] = r & 255;
              p += s << 4;
              p += s << 2;
              s = m + q;
              r = k;
              k = r + 1;
              r = HEAPU8[r];
              p -= s << 2;
              p -= s;
              p += r;
              p = HEAPU8[d + (p >> 5)];
              s = r;
              r = n;
              n = m;
              m = s;
              s = b;
              b = s + 1;
              HEAP8[s] = p & 255;
              p = q;
              q = o;
              a = o = a - 1;
              if(o == 0) {
                e = 8;
                break c
              }
            }
          }
        }while(0);
        k += c - g;
        b += 16 - g;
        f = a = f - 1;
        if(a == 0) {
          break a
        }
      }
    }
  }while(0);
  b += h * -16;
  k = j + c * 5;
  f = h >>> 2;
  e = h >>> 2 != 0 ? 10 : 13;
  a:do {
    if(e == 10) {
      for(;;) {
        a = g;
        if(g != 0) {
          var v = c, e = 11
        }else {
          var u = c, e = 12
        }
        c:do {
          if(e == 11) {
            for(;;) {
              if(r = HEAPU8[k + v * -2], q = HEAPU8[k + -c], o = HEAPU8[k + c], m = HEAPU8[k + (c << 1)], h = k, k = h + 1, n = HEAPU8[h], s = o + r, m -= s << 2, m -= s, m += 16, s = n + q, p = HEAPU8[j + (c << 1)], m += s << 4, m += s << 2, m += p, s = HEAPU8[d + (m >> 5)], m = HEAPU8[b + 48], o += 16, s += 1, HEAP8[b + 48] = s + m >> 1 & 255, s = n + p, o -= s << 2, o -= s, s = q + r, m = HEAPU8[j + c], o += s << 4, o += s << 2, o += m, s = HEAPU8[d + (o >> 5)], o = HEAPU8[b + 32], n += 16, s += 
              1, HEAP8[b + 32] = s + o >> 1 & 255, o = HEAPU8[j], s = q + m, n -= s << 2, n -= s, s = p + r, n += s << 4, n += s << 2, n += o, s = HEAPU8[d + (n >> 5)], n = HEAPU8[b + 16], q += 16, s += 1, HEAP8[b + 16] = s + n >> 1 & 255, n = HEAPU8[j + -c], o += r, q -= o << 2, q -= o, p += m, q += p << 4, q += p << 2, q += n, s = HEAPU8[d + (q >> 5)], q = HEAPU8[b], s += 1, h = b, b = h + 1, HEAP8[h] = s + q >> 1 & 255, j += 1, a = h = a - 1, h != 0) {
                v = c
              }else {
                u = c;
                e = 12;
                break c
              }
            }
          }
        }while(0);
        j += (u << 2) - g;
        k += (c << 2) - g;
        b += 64 - g;
        f = h = f - 1;
        if(h == 0) {
          break a
        }
      }
    }
  }while(0);
  STACKTOP = l
}
_h264bsdInterpolateHorVerQuarter.X = 1;
function _h264bsdInterpolateMidHalf(a, b, d, c, e, f, g, h) {
  var j = STACKTOP;
  STACKTOP += 1788;
  var l, k, m, o, p, r, q, n, s, t;
  n = j + 444;
  l = d;
  k = c;
  d = e;
  c = _h264bsdClip + 512;
  e = l < 0 ? 4 : 1;
  a:do {
    if(e == 1) {
      if(g + (l + 5) > d) {
        e = 4;
        break a
      }
      if(k < 0) {
        e = 4;
        break a
      }
      e = h + (k + 5) > f ? 4 : 5;
      break a
    }
  }while(0);
  e == 4 && (_h264bsdFillBlock(a, j, l, k, d, f, g + 5, h + 5, g + 5), k = l = 0, a = j, d = g + 5);
  a += d * k + l;
  s = n;
  t = a + 5;
  f = h + 5;
  e = h + 5 != 0 ? 6 : 9;
  a:do {
    if(e == 6) {
      for(;;) {
        r = HEAPU8[t - 5];
        p = HEAPU8[t - 4];
        o = HEAPU8[t - 3];
        k = HEAPU8[t - 2];
        l = HEAPU8[t - 1];
        a = g >>> 2;
        e = g >>> 2 != 0 ? 7 : 8;
        c:do {
          if(e == 7) {
            for(;;) {
              if(q = o + k, r += q << 4, r += q << 2, q = p + l, m = t, t = m + 1, m = HEAPU8[m], r -= q << 2, r -= q, r += m, q = s, s = q + 4, HEAP32[q >> 2] = r, q = k + l, p += q << 4, p += q << 2, q = o + m, r = t, t = r + 1, r = HEAPU8[r], p -= q << 2, p -= q, p += r, q = s, s = q + 4, HEAP32[q >> 2] = p, q = l + m, o += q << 4, o += q << 2, q = k + r, p = t, t = p + 1, p = HEAPU8[p], o -= q << 2, o -= q, o += p, q = s, s = q + 4, HEAP32[q >> 2] = o, q = m + r, k += q << 4, k += q << 2, q = 
              l + p, o = t, t = o + 1, o = HEAPU8[o], k -= q << 2, k -= q, k += o, q = s, s = q + 4, HEAP32[q >> 2] = k, q = o, o = r, r = l, l = q, k = p, p = m, a = m = a - 1, m == 0) {
                e = 8;
                break c
              }
            }
          }
        }while(0);
        t += d - g;
        f = a = f - 1;
        if(a == 0) {
          break a
        }
      }
    }
  }while(0);
  n += g << 2;
  d = n + (g * 5 << 2);
  f = h >>> 2;
  e = h >>> 2 != 0 ? 10 : 13;
  a:do {
    if(e == 10) {
      for(;;) {
        a = g;
        if(g != 0) {
          var v = g, e = 11
        }else {
          var u = g, e = 12
        }
        c:do {
          if(e == 11) {
            for(;;) {
              if(o = HEAP32[d + (v * -2 << 2) >> 2], p = HEAP32[d + (-g << 2) >> 2], m = HEAP32[d + (g << 2) >> 2], l = HEAP32[d + (g << 1 << 2) >> 2], h = d, d = h + 4, r = HEAP32[h >> 2], q = m + o, l -= q << 2, l -= q, l += 512, q = r + p, k = HEAP32[n + (g << 1 << 2) >> 2], l += q << 4, l += q << 2, l += k, q = HEAPU8[c + (l >> 10)], m += 512, HEAP8[b + 48] = q & 255, q = r + k, m -= q << 2, m -= q, q = p + o, l = HEAP32[n + (g << 2) >> 2], m += q << 4, m += q << 2, m += l, q = HEAPU8[c + (m >> 
              10)], r += 512, HEAP8[b + 32] = q & 255, m = HEAP32[n >> 2], q = p + l, r -= q << 2, r -= q, q = k + o, r += q << 4, r += q << 2, r += m, q = HEAPU8[c + (r >> 10)], p += 512, HEAP8[b + 16] = q & 255, r = HEAP32[n + (-g << 2) >> 2], m += o, p -= m << 2, p -= m, k += l, p += k << 4, p += k << 2, p += r, q = HEAPU8[c + (p >> 10)], h = b, b = h + 1, HEAP8[h] = q & 255, n += 4, a = h = a - 1, h != 0) {
                v = g
              }else {
                u = g;
                e = 12;
                break c
              }
            }
          }
        }while(0);
        b += 64 - u;
        n += g * 3 << 2;
        d += g * 3 << 2;
        f = h = f - 1;
        if(h == 0) {
          break a
        }
      }
    }
  }while(0);
  STACKTOP = j
}
_h264bsdInterpolateMidHalf.X = 1;
function _h264bsdInterpolateMidVerQuarter(a, b, d, c, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 1788;
  var k, m, o, p, r, q, n, s, t, v;
  s = l + 444;
  k = d;
  m = c;
  d = e;
  c = _h264bsdClip + 512;
  e = k < 0 ? 4 : 1;
  a:do {
    if(e == 1) {
      if(g + (k + 5) > d) {
        e = 4;
        break a
      }
      if(m < 0) {
        e = 4;
        break a
      }
      e = h + (m + 5) > f ? 4 : 5;
      break a
    }
  }while(0);
  e == 4 && (_h264bsdFillBlock(a, l, k, m, d, f, g + 5, h + 5, g + 5), m = k = 0, a = l, d = g + 5);
  a += d * m + k;
  t = s;
  v = a + 5;
  f = h + 5;
  e = h + 5 != 0 ? 6 : 9;
  a:do {
    if(e == 6) {
      for(;;) {
        q = HEAPU8[v - 5];
        m = HEAPU8[v - 4];
        r = HEAPU8[v - 3];
        p = HEAPU8[v - 2];
        k = HEAPU8[v - 1];
        a = g >>> 2;
        e = g >>> 2 != 0 ? 7 : 8;
        c:do {
          if(e == 7) {
            for(;;) {
              if(n = r + p, q += n << 4, q += n << 2, n = m + k, o = v, v = o + 1, o = HEAPU8[o], q -= n << 2, q -= n, q += o, n = t, t = n + 4, HEAP32[n >> 2] = q, n = p + k, m += n << 4, m += n << 2, n = r + o, q = v, v = q + 1, q = HEAPU8[q], m -= n << 2, m -= n, m += q, n = t, t = n + 4, HEAP32[n >> 2] = m, n = k + o, r += n << 4, r += n << 2, n = p + q, m = v, v = m + 1, m = HEAPU8[m], r -= n << 2, r -= n, r += m, n = t, t = n + 4, HEAP32[n >> 2] = r, n = o + q, p += n << 4, p += n << 2, n = 
              k + m, r = v, v = r + 1, r = HEAPU8[r], p -= n << 2, p -= n, p += r, n = t, t = n + 4, HEAP32[n >> 2] = p, n = r, r = q, q = k, k = n, p = m, m = o, a = o = a - 1, o == 0) {
                e = 8;
                break c
              }
            }
          }
        }while(0);
        v += d - g;
        f = a = f - 1;
        if(a == 0) {
          break a
        }
      }
    }
  }while(0);
  s += g << 2;
  d = s + (g * 5 << 2);
  j = s + ((j + 2) * g << 2);
  f = h >>> 2;
  e = h >>> 2 != 0 ? 10 : 13;
  a:do {
    if(e == 10) {
      for(;;) {
        a = g;
        if(g != 0) {
          var u = g, e = 11
        }else {
          var x = g, e = 12
        }
        c:do {
          if(e == 11) {
            for(;;) {
              if(r = HEAP32[d + (u * -2 << 2) >> 2], m = HEAP32[d + (-g << 2) >> 2], o = HEAP32[d + (g << 2) >> 2], k = HEAP32[d + (g << 1 << 2) >> 2], h = d, d = h + 4, q = HEAP32[h >> 2], n = o + r, k -= n << 2, k -= n, k += 512, n = q + m, p = HEAP32[s + (g << 1 << 2) >> 2], k += n << 4, k += n << 2, n = HEAP32[j + (g << 1 << 2) >> 2], k += p, k = HEAPU8[c + (k >> 10)], n += 16, n = HEAPU8[c + (n >> 5)], o += 512, k += 1, HEAP8[b + 48] = k + n >> 1 & 255, n = q + p, o -= n << 2, o -= n, n = m + 
              r, k = HEAP32[s + (g << 2) >> 2], o += n << 4, o += n << 2, n = HEAP32[j + (g << 2) >> 2], o += k, o = HEAPU8[c + (o >> 10)], n += 16, n = HEAPU8[c + (n >> 5)], q += 512, o += 1, HEAP8[b + 32] = o + n >> 1 & 255, o = HEAP32[s >> 2], n = m + k, q -= n << 2, q -= n, n = p + r, q += n << 4, q += n << 2, n = HEAP32[j >> 2], q += o, q = HEAPU8[c + (q >> 10)], n += 16, n = HEAPU8[c + (n >> 5)], m += 512, q += 1, HEAP8[b + 16] = q + n >> 1 & 255, q = HEAP32[s + (-g << 2) >> 2], o += r, m -= 
              o << 2, m -= o, p += k, m += p << 4, m += p << 2, n = HEAP32[j + (-g << 2) >> 2], m += q, m = HEAPU8[c + (m >> 10)], n += 16, n = HEAPU8[c + (n >> 5)], m += 1, h = b, b = h + 1, HEAP8[h] = m + n >> 1 & 255, s += 4, j += 4, a = h = a - 1, h != 0) {
                u = g
              }else {
                x = g;
                e = 12;
                break c
              }
            }
          }
        }while(0);
        b += 64 - x;
        s += g * 3 << 2;
        d += g * 3 << 2;
        j += g * 3 << 2;
        f = h = f - 1;
        if(h == 0) {
          break a
        }
      }
    }
  }while(0);
  STACKTOP = l
}
_h264bsdInterpolateMidVerQuarter.X = 1;
function _h264bsdInterpolateMidHorQuarter(a, b, d, c, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 1788;
  var k, m, o, p, r, q, n, s, t, v, u, x = l + 444, w;
  k = c;
  m = e;
  w = g + 5;
  c = _h264bsdClip + 512;
  e = d < 0 ? 4 : 1;
  a:do {
    if(e == 1) {
      if(g + (d + 5) > m) {
        e = 4;
        break a
      }
      if(k < 0) {
        e = 4;
        break a
      }
      e = h + (k + 5) > f ? 4 : 5;
      break a
    }
  }while(0);
  e == 4 && (_h264bsdFillBlock(a, l, d, k, m, f, g + 5, h + 5, g + 5), k = d = 0, a = l, m = g + 5);
  a += m * k + d;
  t = x + (w << 2);
  v = a + m;
  u = v + m * 5;
  f = h >>> 2;
  e = h >>> 2 != 0 ? 6 : 9;
  a:do {
    if(e == 6) {
      for(;;) {
        a = w;
        if(w != 0) {
          s = m, e = 7
        }else {
          var y = m, e = 8
        }
        c:do {
          if(e == 7) {
            for(;;) {
              if(p = HEAPU8[u + s * -2], r = HEAPU8[u + -m], o = HEAPU8[u + m], d = HEAPU8[u + (m << 1)], k = u, u = k + 1, q = HEAPU8[k], n = o + p, d -= n << 2, d -= n, n = q + r, k = HEAPU8[v + (m << 1)], d += n << 4, d += n << 2, d += k, HEAP32[t + (w << 1 << 2) >> 2] = d, n = q + k, o -= n << 2, o -= n, n = r + p, d = HEAPU8[v + m], o += n << 4, o += n << 2, o += d, HEAP32[t + (w << 2) >> 2] = o, o = HEAPU8[v], n = r + d, q -= n << 2, q -= n, n = k + p, q += n << 4, q += n << 2, q += o, HEAP32[t >> 
              2] = q, q = HEAPU8[v + -m], o += p, r -= o << 2, r -= o, k += d, r += k << 4, r += k << 2, r += q, HEAP32[t + (-w << 2) >> 2] = r, t += 4, v += 1, a = d = a - 1, d != 0) {
                s = m
              }else {
                y = m;
                e = 8;
                break c
              }
            }
          }
        }while(0);
        v += (y << 2) - 5 + -g;
        u += -g - 5 + (m << 2);
        t += w * 3 << 2;
        f = a = f - 1;
        if(a == 0) {
          break a
        }
      }
    }
  }while(0);
  s = x + 20;
  j = x + 8 + (j << 2);
  f = h;
  e = h != 0 ? 10 : 13;
  a:do {
    if(e == 10) {
      for(;;) {
        q = HEAP32[s - 20 >> 2];
        r = HEAP32[s - 16 >> 2];
        p = HEAP32[s - 12 >> 2];
        k = HEAP32[s - 8 >> 2];
        d = HEAP32[s - 4 >> 2];
        a = g >>> 2;
        e = g >>> 2 != 0 ? 11 : 12;
        c:do {
          if(e == 11) {
            for(;;) {
              if(q += 512, n = p + k, q += n << 4, q += n << 2, n = r + d, h = s, s = h + 4, o = HEAP32[h >> 2], q -= n << 2, q -= n, h = j, j = h + 4, n = HEAP32[h >> 2], q += o, q = HEAPU8[c + (q >> 10)], n += 16, n = HEAPU8[c + (n >> 5)], r += 512, q += 1, h = b, b = h + 1, HEAP8[h] = n + q >> 1 & 255, n = k + d, r += n << 4, r += n << 2, n = p + o, h = s, s = h + 4, q = HEAP32[h >> 2], r -= n << 2, r -= n, h = j, j = h + 4, n = HEAP32[h >> 2], r += q, r = HEAPU8[c + (r >> 10)], n += 16, n = HEAPU8[c + 
              (n >> 5)], p += 512, r += 1, h = b, b = h + 1, HEAP8[h] = n + r >> 1 & 255, n = d + o, p += n << 4, p += n << 2, n = k + q, r = s, s = r + 4, r = HEAP32[r >> 2], p -= n << 2, p -= n, h = j, j = h + 4, n = HEAP32[h >> 2], p += r, p = HEAPU8[c + (p >> 10)], n += 16, n = HEAPU8[c + (n >> 5)], k += 512, p += 1, h = b, b = h + 1, HEAP8[h] = n + p >> 1 & 255, n = o + q, k += n << 4, k += n << 2, n = d + r, p = s, s = p + 4, p = HEAP32[p >> 2], k -= n << 2, k -= n, h = j, j = h + 4, n = HEAP32[h >> 
              2], k += p, k = HEAPU8[c + (k >> 10)], n += 16, n = HEAPU8[c + (n >> 5)], k += 1, h = b, b = h + 1, HEAP8[h] = n + k >> 1 & 255, k = r, r = o, n = p, p = q, q = d, d = n, a = h = a - 1, h == 0) {
                e = 12;
                break c
              }
            }
          }
        }while(0);
        s += 20;
        j += 20;
        b += 16 - g;
        f = a = f - 1;
        if(a == 0) {
          break a
        }
      }
    }
  }while(0);
  STACKTOP = l
}
_h264bsdInterpolateMidHorQuarter.X = 1;
function _FillRow1(a, b, d, c) {
  _H264SwDecMemcpy(b, a, c)
}
function _h264bsdPredictSamples(a, b, d, c, e, f, g, h, j) {
  var l, k, m, o, p, r, q;
  q = a + (g << 4) + f;
  l = HEAP16[b >> 1] & 3;
  k = HEAP16[b + 2 >> 1] & 3;
  m = HEAP32[d + 4 >> 2] << 4;
  o = HEAP32[d + 8 >> 2] << 4;
  p = f + c + (HEAP16[b >> 1] >> 2);
  r = g + e + (HEAP16[b + 2 >> 1] >> 2);
  l = HEAP32[_lumaFracPos + (l << 4) + (k << 2) >> 2];
  l = l == 0 ? 1 : l == 1 ? 2 : l == 2 ? 3 : l == 3 ? 4 : l == 4 ? 5 : l == 5 ? 6 : l == 6 ? 7 : l == 7 ? 8 : l == 8 ? 9 : l == 9 ? 10 : l == 10 ? 11 : l == 11 ? 12 : l == 12 ? 13 : l == 13 ? 14 : l == 14 ? 15 : 16;
  l == 16 ? _h264bsdInterpolateHorVerQuarter(HEAP32[d >> 2], q, p - 2, r - 2, m, o, h, j, 3) : l == 1 ? _h264bsdFillBlock(HEAP32[d >> 2], q, p, r, m, o, h, j, 16) : l == 2 ? _h264bsdInterpolateVerQuarter(HEAP32[d >> 2], q, p, r - 2, m, o, h, j, 0) : l == 3 ? _h264bsdInterpolateVerHalf(HEAP32[d >> 2], q, p, r - 2, m, o, h, j) : l == 4 ? _h264bsdInterpolateVerQuarter(HEAP32[d >> 2], q, p, r - 2, m, o, h, j, 1) : l == 5 ? _h264bsdInterpolateHorQuarter(HEAP32[d >> 2], q, p - 2, r, m, o, h, j, 0) : l == 
  6 ? _h264bsdInterpolateHorVerQuarter(HEAP32[d >> 2], q, p - 2, r - 2, m, o, h, j, 0) : l == 7 ? _h264bsdInterpolateMidHorQuarter(HEAP32[d >> 2], q, p - 2, r - 2, m, o, h, j, 0) : l == 8 ? _h264bsdInterpolateHorVerQuarter(HEAP32[d >> 2], q, p - 2, r - 2, m, o, h, j, 2) : l == 9 ? _h264bsdInterpolateHorHalf(HEAP32[d >> 2], q, p - 2, r, m, o, h, j) : l == 10 ? _h264bsdInterpolateMidVerQuarter(HEAP32[d >> 2], q, p - 2, r - 2, m, o, h, j, 0) : l == 11 ? _h264bsdInterpolateMidHalf(HEAP32[d >> 2], q, 
  p - 2, r - 2, m, o, h, j) : l == 12 ? _h264bsdInterpolateMidVerQuarter(HEAP32[d >> 2], q, p - 2, r - 2, m, o, h, j, 1) : l == 13 ? _h264bsdInterpolateHorQuarter(HEAP32[d >> 2], q, p - 2, r, m, o, h, j, 1) : l == 14 ? _h264bsdInterpolateHorVerQuarter(HEAP32[d >> 2], q, p - 2, r - 2, m, o, h, j, 1) : l == 15 && _h264bsdInterpolateMidHorQuarter(HEAP32[d >> 2], q, p - 2, r - 2, m, o, h, j, 1);
  _PredictChroma(a + 256 + (g >>> 1 << 3) + (f >>> 1), f + c, g + e, h, j, b, d)
}
_h264bsdPredictSamples.X = 1;
function _PredictChroma(a, b, d, c, e, f, g) {
  var h, j, l, k;
  j = HEAP32[g + 4 >> 2] << 3;
  l = HEAP32[g + 8 >> 2] << 3;
  b = (HEAP16[f >> 1] >> 3) + (b >>> 1);
  d = (HEAP16[f + 2 >> 1] >> 3) + (d >>> 1);
  h = HEAP16[f >> 1] & 7;
  f = HEAP16[f + 2 >> 1] & 7;
  c >>>= 1;
  e >>>= 1;
  k = HEAP32[g >> 2] + (HEAP32[g + 4 >> 2] << 8) * HEAP32[g + 8 >> 2];
  g = h != 0 ? 1 : 5;
  a:do {
    if(g == 1) {
      g = f != 0 ? 2 : 3;
      do {
        if(g == 2) {
          _h264bsdInterpolateChromaHorVer(k, a, b, d, j, l, h, f, c, e);
          g = 8;
          break a
        }else {
          if(g == 3) {
            if(h == 0) {
              g = 5;
              break a
            }
            _h264bsdInterpolateChromaHor(k, a, b, d, j, l, h, c, e);
            g = 8;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  g == 5 && (h = k, g = f != 0 ? 6 : 7, g == 6 ? _h264bsdInterpolateChromaVer(h, a, b, d, j, l, f, c, e) : g == 7 && (_h264bsdFillBlock(h, a, b, d, j, l, c, e, 8), k += l * j, _h264bsdFillBlock(k, a + 64, b, d, j, l, c, e, 8)))
}
_PredictChroma.X = 1;
function _h264bsdFillRow7(a, b, d, c, e) {
  var f, g;
  f = d;
  d = c;
  f != 0 ? c = 1 : (g = c, c = 4);
  do {
    if(c == 1) {
      g = HEAP8[a];
      c = f != 0 ? 2 : 3;
      b:do {
        if(c == 2) {
          for(;;) {
            var h = b, b = h + 1;
            HEAP8[h] = g;
            f = h = f - 1;
            if(h == 0) {
              c = 3;
              break b
            }
          }
        }
      }while(0);
      g = d
    }
  }while(0);
  c = g != 0 ? 5 : 6;
  a:do {
    if(c == 5) {
      for(;;) {
        if(f = a, a = f + 1, f = HEAP8[f], g = b, b = g + 1, HEAP8[g] = f, d = f = d - 1, f == 0) {
          break a
        }
      }
    }
  }while(0);
  c = e != 0 ? 7 : 9;
  a:do {
    if(c == 7) {
      g = HEAP8[a - 1];
      if(e == 0) {
        break a
      }
      for(;;) {
        if(d = b, b = d + 1, HEAP8[d] = g, e = d = e - 1, d == 0) {
          break a
        }
      }
    }
  }while(0)
}
_h264bsdFillRow7.X = 1;
function _h264bsdReorderRefPicList(a, b, d, c) {
  var e, f, g, h, j, l, k, m, o, p, r;
  _SetPicNums(a, d);
  e = HEAP32[b >> 2] != 0 ? 2 : 1;
  do {
    if(e == 2) {
      k = 0;
      l = d;
      g = 0;
      b:for(;;) {
        if(!(HEAPU32[b + 4 + g * 12 >> 2] < 3)) {
          e = 24;
          break b
        }
        p = b + 4 + g * 12;
        e = HEAPU32[b + 4 + g * 12 >> 2] < 2 ? 5 : 13;
        do {
          if(e == 5) {
            m = HEAP32[b + 4 + g * 12 + 4 >> 2];
            e = HEAP32[p >> 2] == 0 ? 6 : 8;
            d:do {
              if(e == 6) {
                o = l - m;
                if(!(o < 0)) {
                  break d
                }
                o += HEAP32[a + 32 >> 2]
              }else {
                if(e == 8) {
                  o = m + l;
                  if(!(o >= HEAP32[a + 32 >> 2])) {
                    break d
                  }
                  o -= HEAP32[a + 32 >> 2]
                }
              }
            }while(0);
            m = l = o;
            e = o > d ? 11 : 12;
            e == 11 && (m -= HEAP32[a + 32 >> 2]);
            r = 1
          }else {
            e == 13 && (m = HEAP32[p + 8 >> 2], r = 0)
          }
        }while(0);
        p = e = _FindDpbPic(a, m, r);
        if(e < 0) {
          e = 16;
          break b
        }
        if(!(HEAPU32[HEAP32[a >> 2] + p * 40 + 20 >> 2] > 1)) {
          e = 16;
          break b
        }
        h = c;
        e = h > k ? 18 : 19;
        c:do {
          if(e == 18) {
            for(;;) {
              if(HEAP32[HEAP32[a + 4 >> 2] + (h << 2) >> 2] = HEAP32[HEAP32[a + 4 >> 2] + (h - 1 << 2) >> 2], h -= 1, !(h > k)) {
                break c
              }
            }
          }
        }while(0);
        e = HEAP32[a >> 2] + p * 40;
        h = k;
        k = h + 1;
        HEAP32[HEAP32[a + 4 >> 2] + (h << 2) >> 2] = e;
        h = j = k;
        e = h <= c ? 20 : 23;
        c:do {
          if(e == 20) {
            for(;;) {
              e = HEAP32[HEAP32[a + 4 >> 2] + (h << 2) >> 2] != HEAP32[a >> 2] + p * 40 ? 21 : 22;
              if(e == 21) {
                var q = HEAP32[HEAP32[a + 4 >> 2] + (h << 2) >> 2], n = j;
                j = n + 1;
                HEAP32[HEAP32[a + 4 >> 2] + (n << 2) >> 2] = q
              }
              h += 1;
              if(!(h <= c)) {
                e = 23;
                break c
              }
            }
          }
        }while(0);
        g += 1
      }
      e == 24 ? f = 0 : e == 16 && (f = 1)
    }else {
      e == 1 && (f = 0)
    }
  }while(0);
  return f
}
_h264bsdReorderRefPicList.X = 1;
function _SetPicNums(a, b) {
  var d, c, e;
  c = 0;
  d = c < HEAPU32[a + 40 >> 2] ? 1 : 8;
  a:do {
    if(d == 1) {
      for(;;) {
        d = HEAP32[HEAP32[a >> 2] + c * 40 + 20 >> 2] == 1 ? 3 : 2;
        c:do {
          if(d == 2) {
            d = HEAP32[HEAP32[a >> 2] + c * 40 + 20 >> 2] == 2 ? 3 : 7;
            break c
          }
        }while(0);
        if(d == 3) {
          var f = HEAPU32[HEAP32[a >> 2] + c * 40 + 12 >> 2];
          d = HEAPU32[HEAP32[a >> 2] + c * 40 + 12 >> 2] > b ? 4 : 5;
          d == 4 ? e = f - HEAP32[a + 32 >> 2] : d == 5 && (e = f);
          HEAP32[HEAP32[a >> 2] + c * 40 + 8 >> 2] = e
        }
        c += 1;
        if(!(c < HEAPU32[a + 40 >> 2])) {
          break a
        }
      }
    }
  }while(0)
}
_SetPicNums.X = 1;
function _FindDpbPic(a, b, d) {
  var c, e, f;
  f = e = 0;
  d = d != 0 ? 1 : 8;
  a:do {
    if(d == 1) {
      b:for(;;) {
        if(!(e < HEAPU32[a + 24 >> 2])) {
          d = 14;
          break a
        }
        if(!(f != 0 ^ 1)) {
          var g = f, d = 15;
          break a
        }
        d = HEAP32[HEAP32[a >> 2] + e * 40 + 20 >> 2] == 1 ? 5 : 4;
        c:do {
          if(d == 4) {
            d = HEAP32[HEAP32[a >> 2] + e * 40 + 20 >> 2] == 2 ? 5 : 7;
            break c
          }
        }while(0);
        c:do {
          if(d == 5) {
            if(HEAP32[HEAP32[a >> 2] + e * 40 + 8 >> 2] != b) {
              d = 7;
              break c
            }
            d = f = 1;
            continue b
          }
        }while(0);
        e += 1
      }
    }else {
      if(d == 8) {
        b:for(;;) {
          if(!(e < HEAPU32[a + 24 >> 2])) {
            d = 14;
            break a
          }
          if(!(f != 0 ^ 1)) {
            g = f;
            d = 15;
            break a
          }
          d = HEAP32[HEAP32[a >> 2] + e * 40 + 20 >> 2] == 3 ? 11 : 13;
          c:do {
            if(d == 11) {
              if(HEAP32[HEAP32[a >> 2] + e * 40 + 8 >> 2] != b) {
                d = 13;
                break c
              }
              f = 1;
              d = 8;
              continue b
            }
          }while(0);
          e += 1
        }
      }
    }
  }while(0);
  d == 14 && (g = f);
  d = g != 0 ? 16 : 17;
  d == 16 ? c = e : d == 17 && (c = -1);
  return c
}
_FindDpbPic.X = 1;
function _h264bsdMarkDecRefPic(a, b, d, c, e, f, g, h) {
  var j, l, k, m;
  j = HEAP32[d >> 2] != HEAP32[HEAP32[a + 8 >> 2] >> 2] ? 1 : 2;
  do {
    if(j == 1) {
      l = 1
    }else {
      if(j == 2) {
        l = HEAP32[a + 52 >> 2] = 0;
        d = HEAP32[a + 56 >> 2] != 0 ? 0 : 1;
        j = b == 0 ? 3 : 5;
        b:do {
          if(j == 3) {
            HEAP32[HEAP32[a + 8 >> 2] + 20 >> 2] = 0;
            HEAP32[HEAP32[a + 8 >> 2] + 12 >> 2] = c;
            HEAP32[HEAP32[a + 8 >> 2] + 8 >> 2] = c;
            HEAP32[HEAP32[a + 8 >> 2] + 16 >> 2] = e;
            HEAP32[HEAP32[a + 8 >> 2] + 24 >> 2] = d;
            if(HEAP32[a + 56 >> 2] != 0) {
              break b
            }
            HEAP32[a + 44 >> 2] += 1
          }else {
            if(j == 5) {
              j = f != 0 ? 6 : 13;
              do {
                if(j == 6) {
                  HEAP32[a + 20 >> 2] = 0;
                  HEAP32[a + 16 >> 2] = 0;
                  _Mmcop5(a);
                  j = HEAP32[b >> 2] != 0 ? 8 : 7;
                  d:do {
                    if(j == 7) {
                      j = HEAP32[a + 56 >> 2] != 0 ? 8 : 9;
                      break d
                    }
                  }while(0);
                  j == 8 && (HEAP32[a + 16 >> 2] = 0, HEAP32[a + 20 >> 2] = 0);
                  k = HEAP32[a + 8 >> 2] + 20;
                  j = HEAP32[b + 4 >> 2] != 0 ? 10 : 11;
                  j == 10 ? (HEAP32[k >> 2] = 3, HEAP32[a + 36 >> 2] = 0) : j == 11 && (HEAP32[k >> 2] = 2, HEAP32[a + 36 >> 2] = 65535);
                  HEAP32[HEAP32[a + 8 >> 2] + 12 >> 2] = 0;
                  HEAP32[HEAP32[a + 8 >> 2] + 8 >> 2] = 0;
                  HEAP32[HEAP32[a + 8 >> 2] + 16 >> 2] = 0;
                  HEAP32[HEAP32[a + 8 >> 2] + 24 >> 2] = d;
                  HEAP32[a + 44 >> 2] = 1;
                  HEAP32[a + 40 >> 2] = 1
                }else {
                  if(j == 13) {
                    m = 0;
                    j = HEAP32[b + 8 >> 2] != 0 ? 14 : 28;
                    d:do {
                      if(j == 14) {
                        k = 0;
                        e:for(;;) {
                          if(HEAP32[b + 12 + k * 20 >> 2] == 0) {
                            break d
                          }
                          j = HEAP32[b + 12 + k * 20 >> 2];
                          if(j == 1) {
                            j = 17
                          }else {
                            if(j == 2) {
                              j = 18
                            }else {
                              if(j == 3) {
                                j = 19
                              }else {
                                if(j == 4) {
                                  j = 20
                                }else {
                                  if(j == 5) {
                                    j = 21
                                  }else {
                                    if(j == 6) {
                                      j = 22
                                    }else {
                                      j = 24;
                                      break e
                                    }
                                  }
                                }
                              }
                            }
                          }
                          f:do {
                            if(j == 17) {
                              var o = _Mmcop1(a, c, HEAP32[b + 12 + k * 20 + 4 >> 2]);
                              l = o;
                              j = 26;
                              break f
                            }else {
                              if(j == 18) {
                                l = o = _Mmcop2(a, HEAP32[b + 12 + k * 20 + 8 >> 2]);
                                j = 26;
                                break f
                              }else {
                                if(j == 19) {
                                  l = o = _Mmcop3(a, c, HEAP32[b + 12 + k * 20 + 4 >> 2], HEAP32[b + 12 + k * 20 + 12 >> 2]);
                                  j = 26;
                                  break f
                                }else {
                                  if(j == 20) {
                                    _Mmcop4(a, HEAP32[b + 12 + k * 20 + 16 >> 2]);
                                    l = 0;
                                    j = 27;
                                    break f
                                  }else {
                                    if(j == 21) {
                                      _Mmcop5(a);
                                      l = 0;
                                      HEAP32[a + 52 >> 2] = 1;
                                      c = 0;
                                      j = 25;
                                      break f
                                    }else {
                                      if(j == 22) {
                                        l = _Mmcop6(a, c, e, HEAP32[b + 12 + k * 20 + 12 >> 2]);
                                        if(l != 0) {
                                          break d
                                        }
                                        m = 1;
                                        j = 25;
                                        break f
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }while(0);
                          f:do {
                            if(j == 25) {
                              o = l;
                              j = 26;
                              break f
                            }
                          }while(0);
                          do {
                            if(j == 26 && o != 0) {
                              break d
                            }
                          }while(0);
                          k += 1
                        }
                        l = 1
                      }else {
                        j == 28 && (l = _SlidingWindowRefPicMarking(a))
                      }
                    }while(0);
                    if(m != 0) {
                      break b
                    }
                    j = HEAPU32[a + 40 >> 2] < HEAPU32[a + 24 >> 2] ? 31 : 32;
                    j == 31 ? (HEAP32[HEAP32[a + 8 >> 2] + 12 >> 2] = c, HEAP32[HEAP32[a + 8 >> 2] + 8 >> 2] = c, HEAP32[HEAP32[a + 8 >> 2] + 16 >> 2] = e, HEAP32[HEAP32[a + 8 >> 2] + 20 >> 2] = 2, HEAP32[HEAP32[a + 8 >> 2] + 24 >> 2] = d, HEAP32[a + 44 >> 2] += 1, HEAP32[a + 40 >> 2] += 1) : j == 32 && (l = 1)
                  }
                }
              }while(0)
            }
          }
        }while(0);
        HEAP32[HEAP32[a + 8 >> 2] + 36 >> 2] = f;
        HEAP32[HEAP32[a + 8 >> 2] + 28 >> 2] = g;
        HEAP32[HEAP32[a + 8 >> 2] + 32 >> 2] = h;
        d = a;
        j = HEAP32[a + 56 >> 2] != 0 ? 35 : 34;
        b:do {
          if(j == 35) {
            HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) >> 2] = HEAP32[HEAP32[d + 8 >> 2] >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 12 >> 2] = HEAP32[HEAP32[a + 8 >> 2] + 36 >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 4 >> 2] = HEAP32[HEAP32[a + 8 >> 2] + 28 >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 8 >> 2] = HEAP32[HEAP32[a + 8 >> 2] + 32 >> 2], HEAP32[a + 16 >> 2] += 1
          }else {
            if(j == 34) {
              if(!(HEAPU32[d + 44 >> 2] > HEAPU32[a + 28 >> 2])) {
                j = 37;
                break b
              }
              for(;;) {
                if(_OutputPicture(a), !(HEAPU32[a + 44 >> 2] > HEAPU32[a + 28 >> 2])) {
                  j = 37;
                  break b
                }
              }
            }
          }
        }while(0);
        _ShellSort(HEAP32[a >> 2], HEAP32[a + 28 >> 2] + 1)
      }
    }
  }while(0);
  return l
}
_h264bsdMarkDecRefPic.X = 1;
function _Mmcop5(a) {
  var b, d;
  d = 0;
  a:for(;;) {
    b = HEAP32[HEAP32[a >> 2] + d * 40 + 20 >> 2] != 0 ? 2 : 4;
    b:do {
      if(b == 2) {
        HEAP32[HEAP32[a >> 2] + d * 40 + 20 >> 2] = 0;
        if(HEAP32[HEAP32[a >> 2] + d * 40 + 24 >> 2] != 0) {
          break b
        }
        HEAP32[a + 44 >> 2] -= 1
      }
    }while(0);
    d = b = d + 1;
    if(!(b < 16)) {
      break a
    }
  }
  a:for(;;) {
    if(_OutputPicture(a) != 0) {
      break a
    }
  }
  HEAP32[a + 40 >> 2] = 0;
  HEAP32[a + 36 >> 2] = 65535;
  HEAP32[a + 48 >> 2] = 0
}
_Mmcop5.X = 1;
function _Mmcop1(a, b, d) {
  var c, d = _FindDpbPic(a, b - d, 1), b = d < 0 ? 1 : 2;
  b == 1 ? c = 1 : b == 2 && (HEAP32[HEAP32[a >> 2] + d * 40 + 20 >> 2] = 0, HEAP32[a + 40 >> 2] -= 1, b = HEAP32[HEAP32[a >> 2] + d * 40 + 24 >> 2] != 0 ? 4 : 3, b == 3 && (HEAP32[a + 44 >> 2] -= 1), c = 0);
  return c
}
_Mmcop1.X = 1;
function _Mmcop2(a, b) {
  var d, c, e;
  e = _FindDpbPic(a, b, 0);
  d = e < 0 ? 1 : 2;
  d == 1 ? c = 1 : d == 2 && (HEAP32[HEAP32[a >> 2] + e * 40 + 20 >> 2] = 0, HEAP32[a + 40 >> 2] -= 1, d = HEAP32[HEAP32[a >> 2] + e * 40 + 24 >> 2] != 0 ? 4 : 3, d == 3 && (HEAP32[a + 44 >> 2] -= 1), c = 0);
  return c
}
function _Mmcop4(a, b) {
  var d, c;
  HEAP32[a + 36 >> 2] = b;
  c = 0;
  d = c < HEAPU32[a + 24 >> 2] ? 1 : 7;
  a:do {
    if(d == 1) {
      for(;;) {
        d = HEAP32[HEAP32[a >> 2] + c * 40 + 20 >> 2] == 3 ? 2 : 6;
        c:do {
          if(d == 2) {
            d = HEAPU32[HEAP32[a >> 2] + c * 40 + 8 >> 2] > b ? 4 : 3;
            do {
              if(d == 3 && HEAP32[a + 36 >> 2] != 65535) {
                d = 6;
                break c
              }
            }while(0);
            HEAP32[HEAP32[a >> 2] + c * 40 + 20 >> 2] = 0;
            HEAP32[a + 40 >> 2] -= 1;
            if(HEAP32[HEAP32[a >> 2] + c * 40 + 24 >> 2] != 0) {
              d = 6;
              break c
            }
            HEAP32[a + 44 >> 2] -= 1
          }
        }while(0);
        c += 1;
        if(!(c < HEAPU32[a + 24 >> 2])) {
          break a
        }
      }
    }
  }while(0)
}
_Mmcop4.X = 1;
function _Mmcop6(a, b, d, c) {
  var e, f, g;
  e = HEAP32[a + 36 >> 2] == 65535 ? 2 : 1;
  a:do {
    if(e == 1) {
      if(c > HEAPU32[a + 36 >> 2]) {
        e = 2;
        break a
      }
      g = 0;
      b:for(;;) {
        if(!(g < HEAPU32[a + 24 >> 2])) {
          e = 10;
          break b
        }
        e = HEAP32[HEAP32[a >> 2] + g * 40 + 20 >> 2] == 3 ? 6 : 9;
        do {
          if(e == 6 && HEAP32[HEAP32[a >> 2] + g * 40 + 8 >> 2] == c) {
            e = 7;
            break b
          }
        }while(0);
        g += 1
      }
      b:do {
        if(e == 7) {
          HEAP32[HEAP32[a >> 2] + g * 40 + 20 >> 2] = 0;
          HEAP32[a + 40 >> 2] -= 1;
          if(HEAP32[HEAP32[a >> 2] + g * 40 + 24 >> 2] != 0) {
            break b
          }
          HEAP32[a + 44 >> 2] -= 1
        }
      }while(0);
      e = HEAPU32[a + 40 >> 2] < HEAPU32[a + 24 >> 2] ? 11 : 15;
      do {
        if(e == 11) {
          HEAP32[HEAP32[a + 8 >> 2] + 12 >> 2] = b;
          HEAP32[HEAP32[a + 8 >> 2] + 8 >> 2] = c;
          HEAP32[HEAP32[a + 8 >> 2] + 16 >> 2] = d;
          HEAP32[HEAP32[a + 8 >> 2] + 20 >> 2] = 3;
          b = HEAP32[a + 8 >> 2] + 24;
          e = HEAP32[a + 56 >> 2] != 0 ? 12 : 13;
          e == 12 ? HEAP32[b >> 2] = 0 : e == 13 && (HEAP32[b >> 2] = 1);
          HEAP32[a + 40 >> 2] += 1;
          HEAP32[a + 44 >> 2] += 1;
          f = 0;
          e = 16;
          break a
        }else {
          if(e == 15) {
            f = 1;
            e = 16;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  e == 2 && (f = 1);
  return f
}
_Mmcop6.X = 1;
function _SlidingWindowRefPicMarking(a) {
  var b, d, c, e, f;
  b = HEAPU32[a + 40 >> 2] < HEAPU32[a + 24 >> 2] ? 1 : 2;
  do {
    if(b == 1) {
      d = 0
    }else {
      if(b == 2) {
        c = -1;
        f = e = 0;
        b = f < HEAPU32[a + 40 >> 2] ? 3 : 9;
        b:do {
          if(b == 3) {
            for(;;) {
              b = HEAP32[HEAP32[a >> 2] + f * 40 + 20 >> 2] == 1 ? 5 : 4;
              d:do {
                if(b == 4) {
                  b = HEAP32[HEAP32[a >> 2] + f * 40 + 20 >> 2] == 2 ? 5 : 8;
                  break d
                }
              }while(0);
              d:do {
                if(b == 5) {
                  b = HEAP32[HEAP32[a >> 2] + f * 40 + 8 >> 2] < e ? 7 : 6;
                  do {
                    if(b == 6 && c != -1) {
                      b = 8;
                      break d
                    }
                  }while(0);
                  c = f;
                  e = HEAP32[HEAP32[a >> 2] + f * 40 + 8 >> 2]
                }
              }while(0);
              f += 1;
              if(!(f < HEAPU32[a + 40 >> 2])) {
                break b
              }
            }
          }
        }while(0);
        b = c >= 0 ? 10 : 13;
        b == 10 ? (HEAP32[HEAP32[a >> 2] + c * 40 + 20 >> 2] = 0, HEAP32[a + 40 >> 2] -= 1, b = HEAP32[HEAP32[a >> 2] + c * 40 + 24 >> 2] != 0 ? 12 : 11, b == 11 && (HEAP32[a + 44 >> 2] -= 1), d = 0) : b == 13 && (d = 1)
      }
    }
  }while(0);
  return d
}
_SlidingWindowRefPicMarking.X = 1;
function _h264bsdGetRefPicData(a, b) {
  var d, c;
  d = b > 16 ? 2 : 1;
  a:do {
    if(d == 1) {
      if(HEAP32[HEAP32[a + 4 >> 2] + (b << 2) >> 2] == 0) {
        d = 2;
        break a
      }
      d = HEAPU32[HEAP32[HEAP32[a + 4 >> 2] + (b << 2) >> 2] + 20 >> 2] > 1 ? 5 : 4;
      do {
        if(d == 5) {
          c = HEAP32[HEAP32[HEAP32[a + 4 >> 2] + (b << 2) >> 2] >> 2];
          d = 6;
          break a
        }else {
          if(d == 4) {
            c = 0;
            d = 6;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  d == 2 && (c = 0);
  return c
}
function _h264bsdAllocateDpbImage(a) {
  HEAP32[a + 8 >> 2] = HEAP32[a >> 2] + HEAP32[a + 28 >> 2] * 40;
  return HEAP32[HEAP32[a + 8 >> 2] >> 2]
}
function _Mmcop3(a, b, d, c) {
  var e, f, g;
  e = HEAP32[a + 36 >> 2] == 65535 ? 2 : 1;
  a:do {
    if(e == 1) {
      if(c > HEAPU32[a + 36 >> 2]) {
        e = 2;
        break a
      }
      g = 0;
      b:for(;;) {
        if(!(g < HEAPU32[a + 24 >> 2])) {
          e = 10;
          break b
        }
        e = HEAP32[HEAP32[a >> 2] + g * 40 + 20 >> 2] == 3 ? 6 : 9;
        do {
          if(e == 6 && HEAP32[HEAP32[a >> 2] + g * 40 + 8 >> 2] == c) {
            e = 7;
            break b
          }
        }while(0);
        g += 1
      }
      b:do {
        if(e == 7) {
          HEAP32[HEAP32[a >> 2] + g * 40 + 20 >> 2] = 0;
          HEAP32[a + 40 >> 2] -= 1;
          if(HEAP32[HEAP32[a >> 2] + g * 40 + 24 >> 2] != 0) {
            break b
          }
          HEAP32[a + 44 >> 2] -= 1
        }
      }while(0);
      e = b - d;
      g = e = _FindDpbPic(a, e, 1);
      e = e < 0 ? 11 : 12;
      do {
        if(e == 11) {
          f = 1;
          e = 15;
          break a
        }else {
          if(e == 12) {
            e = HEAPU32[HEAP32[a >> 2] + g * 40 + 20 >> 2] > 1 ? 14 : 13;
            do {
              if(e == 14) {
                HEAP32[HEAP32[a >> 2] + g * 40 + 20 >> 2] = 3;
                HEAP32[HEAP32[a >> 2] + g * 40 + 8 >> 2] = c;
                f = 0;
                e = 15;
                break a
              }else {
                if(e == 13) {
                  f = 1;
                  e = 15;
                  break a
                }
              }
            }while(0)
          }
        }
      }while(0)
    }
  }while(0);
  e == 2 && (f = 1);
  return f
}
_Mmcop3.X = 1;
function _OutputPicture(a) {
  var b, d, c;
  b = HEAP32[a + 56 >> 2] != 0 ? 1 : 2;
  b == 1 ? d = 1 : b == 2 && (c = _FindSmallestPicOrderCnt(a), b = c == 0 ? 3 : 4, b == 3 ? d = 1 : b == 4 && (HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) >> 2] = HEAP32[c >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 12 >> 2] = HEAP32[c + 36 >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 4 >> 2] = HEAP32[c + 28 >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 8 >> 2] = HEAP32[c + 32 >> 2], HEAP32[a + 16 >> 2] += 1, HEAP32[c + 24 >> 
  2] = 0, b = HEAP32[c + 20 >> 2] != 0 ? 6 : 5, b == 5 && (HEAP32[a + 44 >> 2] -= 1), d = 0));
  return d
}
_OutputPicture.X = 1;
function _ShellSort(a, b) {
  var d = STACKTOP;
  STACKTOP += 40;
  var c, e, f, g;
  g = 7;
  a:for(;;) {
    e = g;
    c = e < b ? 2 : 8;
    b:do {
      if(c == 2) {
        for(;;) {
          var h, j, l, k;
          h = a + e * 40;
          j = d;
          l = h + 40;
          if(j % 4 == h % 4) {
            for(;h % 4 !== 0 && h < l;) {
              HEAP8[j++] = HEAP8[h++]
            }
            h >>= 2;
            j >>= 2;
            for(k = l >> 2;h < k;) {
              HEAP32[j++] = HEAP32[h++]
            }
            h <<= 2;
            j <<= 2
          }
          for(;h < l;) {
            HEAP8[j++] = HEAP8[h++]
          }
          f = e;
          d:for(;;) {
            if(!(f >= g)) {
              c = 4;
              break d
            }
            h = _ComparePictures(a + f * 40 + -g * 40, d);
            j = a + f * 40;
            if(!(h > 0)) {
              var m = j;
              c = 7;
              break d
            }
            h = a + (f - g) * 40;
            l = h + 40;
            if(j % 4 == h % 4) {
              for(;h % 4 !== 0 && h < l;) {
                HEAP8[j++] = HEAP8[h++]
              }
              h >>= 2;
              j >>= 2;
              for(k = l >> 2;h < k;) {
                HEAP32[j++] = HEAP32[h++]
              }
              h <<= 2;
              j <<= 2
            }
            for(;h < l;) {
              HEAP8[j++] = HEAP8[h++]
            }
            f -= g
          }
          c == 4 && (m = a + f * 40);
          h = d;
          j = m;
          l = h + 40;
          if(j % 4 == h % 4) {
            for(;h % 4 !== 0 && h < l;) {
              HEAP8[j++] = HEAP8[h++]
            }
            h >>= 2;
            j >>= 2;
            for(k = l >> 2;h < k;) {
              HEAP32[j++] = HEAP32[h++]
            }
            h <<= 2;
            j <<= 2
          }
          for(;h < l;) {
            HEAP8[j++] = HEAP8[h++]
          }
          e += 1;
          if(!(e < b)) {
            break b
          }
        }
      }
    }while(0);
    g = c = g >>> 1;
    if(c == 0) {
      break a
    }
  }
  STACKTOP = d
}
_ShellSort.X = 1;
function _h264bsdFreeDpb(a) {
  var b, d;
  b = HEAP32[a >> 2] != 0 ? 1 : 3;
  a:do {
    if(b == 1) {
      d = 0;
      if(!(d < HEAP32[a + 28 >> 2] + 1)) {
        break a
      }
      for(;;) {
        if(_H264SwDecFree(HEAP32[HEAP32[a >> 2] + d * 40 + 4 >> 2]), HEAP32[HEAP32[a >> 2] + d * 40 + 4 >> 2] = 0, d += 1, !(d < HEAP32[a + 28 >> 2] + 1)) {
          break a
        }
      }
    }
  }while(0);
  _H264SwDecFree(HEAP32[a >> 2]);
  HEAP32[a >> 2] = 0;
  _H264SwDecFree(HEAP32[a + 4 >> 2]);
  HEAP32[a + 4 >> 2] = 0;
  _H264SwDecFree(HEAP32[a + 12 >> 2]);
  HEAP32[a + 12 >> 2] = 0
}
_h264bsdFreeDpb.X = 1;
function _h264bsdInitRefPicList(a) {
  var b, d;
  d = 0;
  b = d < HEAPU32[a + 40 >> 2] ? 1 : 2;
  a:do {
    if(b == 1) {
      for(;;) {
        if(HEAP32[HEAP32[a + 4 >> 2] + (d << 2) >> 2] = HEAP32[a >> 2] + d * 40, d += 1, !(d < HEAPU32[a + 40 >> 2])) {
          break a
        }
      }
    }
  }while(0)
}
function _h264bsdDpbOutputPicture(a) {
  var b, d;
  b = HEAPU32[a + 20 >> 2] < HEAPU32[a + 16 >> 2] ? 1 : 2;
  b == 1 ? (b = HEAP32[a + 12 >> 2], d = HEAP32[a + 20 >> 2], HEAP32[a + 20 >> 2] = d + 1, d = b + (d << 4)) : b == 2 && (d = 0);
  return d
}
function _ComparePictures(a, b) {
  var d, c;
  d = HEAP32[a + 20 >> 2] != 0 ? 9 : 1;
  a:do {
    if(d == 1) {
      if(HEAP32[b + 20 >> 2] != 0) {
        d = 9;
        break a
      }
      d = HEAP32[a + 24 >> 2] != 0 ? 3 : 5;
      b:do {
        if(d == 3) {
          if(HEAP32[b + 24 >> 2] != 0) {
            break b
          }
          c = -1;
          d = 33;
          break a
        }
      }while(0);
      d = HEAP32[a + 24 >> 2] != 0 ? 8 : 6;
      b:do {
        if(d == 6) {
          if(HEAP32[b + 24 >> 2] == 0) {
            break b
          }
          c = 1;
          d = 33;
          break a
        }
      }while(0);
      c = 0;
      d = 33;
      break a
    }
  }while(0);
  a:do {
    if(d == 9) {
      d = HEAP32[b + 20 >> 2] != 0 ? 11 : 10;
      do {
        if(d == 11) {
          d = HEAP32[a + 20 >> 2] != 0 ? 13 : 12;
          do {
            if(d == 13) {
              d = HEAP32[a + 20 >> 2] == 1 ? 15 : 14;
              d:do {
                if(d == 14) {
                  d = HEAP32[a + 20 >> 2] == 2 ? 15 : 22;
                  break d
                }
              }while(0);
              d:do {
                if(d == 15) {
                  d = HEAP32[b + 20 >> 2] == 1 ? 17 : 16;
                  do {
                    if(d == 16 && HEAP32[b + 20 >> 2] != 2) {
                      break d
                    }
                  }while(0);
                  d = HEAP32[a + 8 >> 2] > HEAP32[b + 8 >> 2] ? 18 : 19;
                  do {
                    if(d == 18) {
                      c = -1;
                      break a
                    }else {
                      if(d == 19) {
                        d = HEAP32[a + 8 >> 2] < HEAP32[b + 8 >> 2] ? 20 : 21;
                        do {
                          if(d == 20) {
                            c = 1;
                            break a
                          }else {
                            if(d == 21) {
                              c = 0;
                              break a
                            }
                          }
                        }while(0)
                      }
                    }
                  }while(0)
                }
              }while(0);
              d = HEAP32[a + 20 >> 2] == 1 ? 24 : 23;
              d:do {
                if(d == 23) {
                  if(HEAP32[a + 20 >> 2] == 2) {
                    d = 24;
                    break d
                  }
                  d = HEAP32[b + 20 >> 2] == 1 ? 27 : 26;
                  e:do {
                    if(d == 26) {
                      if(HEAP32[b + 20 >> 2] == 2) {
                        break e
                      }
                      d = HEAP32[a + 8 >> 2] > HEAP32[b + 8 >> 2] ? 29 : 30;
                      do {
                        if(d == 29) {
                          c = 1;
                          break a
                        }else {
                          if(d == 30) {
                            d = HEAP32[a + 8 >> 2] < HEAP32[b + 8 >> 2] ? 31 : 32;
                            do {
                              if(d == 31) {
                                c = -1;
                                break a
                              }else {
                                if(d == 32) {
                                  c = 0;
                                  break a
                                }
                              }
                            }while(0)
                          }
                        }
                      }while(0)
                    }
                  }while(0);
                  c = 1;
                  break a
                }
              }while(0);
              c = -1
            }else {
              d == 12 && (c = 1)
            }
          }while(0)
        }else {
          d == 10 && (c = -1)
        }
      }while(0)
    }
  }while(0);
  return c
}
_ComparePictures.X = 1;
function _h264bsdInitDpb(a, b, d, c, e, f) {
  var g;
  HEAP32[a + 36 >> 2] = 65535;
  HEAP32[a + 24 >> 2] = c > 1 ? c : 1;
  c = f != 0 ? 1 : 2;
  c == 1 ? HEAP32[a + 28 >> 2] = HEAP32[a + 24 >> 2] : c == 2 && (HEAP32[a + 28 >> 2] = d);
  HEAP32[a + 32 >> 2] = e;
  HEAP32[a + 56 >> 2] = f;
  HEAP32[a + 44 >> 2] = 0;
  HEAP32[a + 40 >> 2] = 0;
  HEAP32[a + 48 >> 2] = 0;
  c = _H264SwDecMalloc(680);
  HEAP32[a >> 2] = c;
  c = HEAP32[a >> 2] == 0 ? 4 : 5;
  a:do {
    if(c == 4) {
      g = 65535
    }else {
      if(c == 5) {
        _H264SwDecMemset(HEAP32[a >> 2], 0, 680);
        d = 0;
        b:for(;;) {
          if(!(d < HEAP32[a + 28 >> 2] + 1)) {
            c = 10;
            break b
          }
          e = _H264SwDecMalloc(b * 384 + 47);
          HEAP32[HEAP32[a >> 2] + d * 40 + 4 >> 2] = e;
          if(HEAP32[HEAP32[a >> 2] + d * 40 + 4 >> 2] == 0) {
            c = 8;
            break b
          }
          HEAP32[HEAP32[a >> 2] + d * 40 >> 2] = HEAP32[HEAP32[a >> 2] + d * 40 + 4 >> 2] + Math.floor(16 - HEAP32[HEAP32[a >> 2] + d * 40 + 4 >> 2] & 15);
          d += 1
        }
        do {
          if(c == 10) {
            g = _H264SwDecMalloc(68);
            HEAP32[a + 4 >> 2] = g;
            g = _H264SwDecMalloc(HEAP32[a + 28 >> 2] + 1 << 4);
            HEAP32[a + 12 >> 2] = g;
            c = HEAP32[a + 4 >> 2] == 0 ? 12 : 11;
            c:do {
              if(c == 11) {
                if(HEAP32[a + 12 >> 2] == 0) {
                  c = 12;
                  break c
                }
                _H264SwDecMemset(HEAP32[a + 4 >> 2], 0, 68);
                HEAP32[a + 20 >> 2] = 0;
                g = HEAP32[a + 16 >> 2] = 0;
                break a
              }
            }while(0);
            g = 65535
          }else {
            c == 8 && (g = 65535)
          }
        }while(0)
      }
    }
  }while(0);
  return g
}
_h264bsdInitDpb.X = 1;
function _h264bsdResetDpb(a, b, d, c, e, f) {
  _h264bsdFreeDpb(a);
  return _h264bsdInitDpb(a, b, d, c, e, f)
}
function _h264bsdCheckGapsInFrameNum(a, b, d, c) {
  var e, f;
  HEAP32[a + 16 >> 2] = 0;
  HEAP32[a + 20 >> 2] = 0;
  c = c != 0 ? 2 : 1;
  a:do {
    if(c == 2) {
      c = b != HEAP32[a + 48 >> 2] ? 3 : 20;
      b:do {
        if(c == 3) {
          if(b == (HEAP32[a + 48 >> 2] + 1) % HEAPU32[a + 32 >> 2]) {
            c = 20;
            break b
          }
          f = (HEAP32[a + 48 >> 2] + 1) % HEAPU32[a + 32 >> 2];
          e = HEAP32[HEAP32[a >> 2] + HEAP32[a + 28 >> 2] * 40 >> 2];
          c:for(;;) {
            _SetPicNums(a, f);
            if(_SlidingWindowRefPicMarking(a) != 0) {
              c = 7;
              break c
            }
            if(HEAPU32[a + 44 >> 2] >= HEAPU32[a + 28 >> 2]) {
              var g = a, c = 8
            }else {
              var h = a, c = 9
            }
            d:do {
              if(c == 8) {
                for(;;) {
                  if(_OutputPicture(g), HEAPU32[a + 44 >> 2] >= HEAPU32[a + 28 >> 2]) {
                    g = a
                  }else {
                    h = a;
                    c = 9;
                    break d
                  }
                }
              }
            }while(0);
            HEAP32[HEAP32[a >> 2] + HEAP32[h + 28 >> 2] * 40 + 20 >> 2] = 1;
            HEAP32[HEAP32[a >> 2] + HEAP32[a + 28 >> 2] * 40 + 12 >> 2] = f;
            HEAP32[HEAP32[a >> 2] + HEAP32[a + 28 >> 2] * 40 + 8 >> 2] = f;
            HEAP32[HEAP32[a >> 2] + HEAP32[a + 28 >> 2] * 40 + 16 >> 2] = 0;
            HEAP32[HEAP32[a >> 2] + HEAP32[a + 28 >> 2] * 40 + 24 >> 2] = 0;
            HEAP32[a + 44 >> 2] += 1;
            HEAP32[a + 40 >> 2] += 1;
            _ShellSort(HEAP32[a >> 2], HEAP32[a + 28 >> 2] + 1);
            f = (f + 1) % HEAPU32[a + 32 >> 2];
            if(f == b) {
              c = 10;
              break c
            }
          }
          do {
            if(c == 7) {
              e = 1;
              break a
            }else {
              if(c == 10) {
                if(HEAP32[a + 16 >> 2] == 0) {
                  c = 23;
                  break b
                }
                c = 0;
                d:for(;;) {
                  if(!(c < HEAPU32[a + 16 >> 2])) {
                    c = 23;
                    break b
                  }
                  if(HEAP32[HEAP32[a + 12 >> 2] + (c << 4) >> 2] == HEAP32[HEAP32[a >> 2] + HEAP32[a + 28 >> 2] * 40 >> 2]) {
                    break d
                  }
                  c += 1
                }
                c = 0;
                d:for(;;) {
                  if(!(c < HEAPU32[a + 28 >> 2])) {
                    c = 23;
                    break b
                  }
                  if(HEAP32[HEAP32[a >> 2] + c * 40 >> 2] == e) {
                    break d
                  }
                  c += 1
                }
                HEAP32[HEAP32[a >> 2] + c * 40 >> 2] = HEAP32[HEAP32[a >> 2] + HEAP32[a + 28 >> 2] * 40 >> 2];
                HEAP32[HEAP32[a >> 2] + HEAP32[a + 28 >> 2] * 40 >> 2] = e;
                c = 23;
                break b
              }
            }
          }while(0)
        }
      }while(0);
      b:do {
        if(c == 20) {
          c = b;
          e = a + 48;
          if(d == 0) {
            var j = c, l = e, c = 25;
            break b
          }
          if(c != HEAP32[e >> 2]) {
            c = 23;
            break b
          }
          e = 1;
          break a
        }
      }while(0);
      b:do {
        if(c == 23) {
          c = b;
          e = a + 48;
          if(d == 0) {
            j = c;
            l = e;
            c = 25;
            break b
          }
          HEAP32[e >> 2] = c;
          c = 27;
          break b
        }
      }while(0);
      b:do {
        if(c == 25) {
          if(j == HEAP32[l >> 2]) {
            c = 27;
            break b
          }
          HEAP32[a + 48 >> 2] = (b - 1 + HEAP32[a + 32 >> 2]) % HEAPU32[a + 32 >> 2]
        }
      }while(0);
      e = 0
    }else {
      c == 1 && (e = 0)
    }
  }while(0);
  return e
}
_h264bsdCheckGapsInFrameNum.X = 1;
function _h264bsdFlushDpb(a) {
  var b;
  b = HEAP32[a >> 2] != 0 ? 1 : 3;
  a:do {
    if(b == 1) {
      HEAP32[a + 60 >> 2] = 1;
      for(;;) {
        if(_OutputPicture(a) != 0) {
          break a
        }
      }
    }
  }while(0)
}
function _FindSmallestPicOrderCnt(a) {
  var b, d, c, e;
  c = 2147483647;
  d = e = 0;
  b = d <= HEAPU32[a + 28 >> 2] ? 1 : 5;
  a:do {
    if(b == 1) {
      for(;;) {
        b = HEAP32[HEAP32[a >> 2] + d * 40 + 24 >> 2] != 0 ? 2 : 4;
        c:do {
          if(b == 2) {
            if(!(HEAP32[HEAP32[a >> 2] + d * 40 + 16 >> 2] < c)) {
              b = 4;
              break c
            }
            e = HEAP32[a >> 2] + d * 40;
            c = HEAP32[HEAP32[a >> 2] + d * 40 + 16 >> 2]
          }
        }while(0);
        d += 1;
        if(!(d <= HEAPU32[a + 28 >> 2])) {
          break a
        }
      }
    }
  }while(0);
  return e
}
_FindSmallestPicOrderCnt.X = 1;
function _h264bsdWriteMacroblock(a, b) {
  var d, c, e, f, g, h, j, l;
  c = HEAP32[a + 4 >> 2];
  e = HEAP32[a + 12 >> 2];
  f = HEAP32[a + 16 >> 2];
  g = HEAP32[a + 20 >> 2];
  h = b;
  c <<= 2;
  d = 16;
  a:for(;;) {
    j = h;
    h = j + 4;
    j = HEAP32[j >> 2];
    l = h;
    h = l + 4;
    l = HEAP32[l >> 2];
    var k = e;
    e = k + 4;
    HEAP32[k >> 2] = j;
    j = e;
    e = j + 4;
    HEAP32[j >> 2] = l;
    j = h;
    h = j + 4;
    j = HEAP32[j >> 2];
    l = h;
    h = l + 4;
    l = HEAP32[l >> 2];
    k = e;
    e = k + 4;
    HEAP32[k >> 2] = j;
    j = e;
    e = j + 4;
    HEAP32[j >> 2] = l;
    e += c - 4 << 2;
    d = j = d - 1;
    if(j == 0) {
      break a
    }
  }
  c >>>= 1;
  d = 8;
  a:for(;;) {
    if(e = h, h = e + 4, j = HEAP32[e >> 2], e = h, h = e + 4, l = HEAP32[e >> 2], e = f, f = e + 4, HEAP32[e >> 2] = j, e = f, f = e + 4, HEAP32[e >> 2] = l, f += c - 2 << 2, d = e = d - 1, e == 0) {
      break a
    }
  }
  d = 8;
  a:for(;;) {
    if(f = h, h = f + 4, j = HEAP32[f >> 2], f = h, h = f + 4, l = HEAP32[f >> 2], f = g, g = f + 4, HEAP32[f >> 2] = j, f = g, g = f + 4, HEAP32[f >> 2] = l, g += c - 2 << 2, d = f = d - 1, f == 0) {
      break a
    }
  }
}
_h264bsdWriteMacroblock.X = 1;
function _h264bsdWriteOutputBlocks(a, b, d, c) {
  var e, f, g, h, j, l, k, m, o, p, r, q;
  q = _h264bsdClip + 512;
  f = HEAP32[a + 4 >> 2];
  g = HEAP32[a + 8 >> 2] * f;
  k = Math.floor(b / f);
  b %= f;
  h = HEAP32[a >> 2] + (k << 8) * f + (b << 4);
  a = HEAP32[a >> 2] + (g << 8) + (k << 6) * f + (b << 3);
  g = a + (g << 6);
  f <<= 4;
  k = 0;
  a:for(;;) {
    m = HEAP32[_h264bsdBlockX + (k << 2) >> 2];
    e = HEAP32[_h264bsdBlockY + (k << 2) >> 2];
    o = c + (k << 6);
    l = d + (e << 4) + m;
    j = h + f * e + m;
    b = HEAP32[o >> 2] == 16777215 ? 2 : 3;
    b:do {
      if(b == 2) {
        e = l, r = j, m = HEAP32[e >> 2], e += 16, p = HEAP32[e >> 2], e += 16, HEAP32[r >> 2] = m, r += Math.floor(f / 4) << 2, HEAP32[r >> 2] = p, r += Math.floor(f / 4) << 2, m = HEAP32[e >> 2], e += 16, p = HEAP32[e >> 2], HEAP32[r >> 2] = m, r += Math.floor(f / 4) << 2, HEAP32[r >> 2] = p
      }else {
        if(b == 3) {
          e = 4;
          for(;;) {
            if(m = HEAPU8[l], r = o, o = r + 4, p = HEAP32[r >> 2], r = HEAPU8[l + 1], m = HEAPU8[q + (p + m)], p = o, o = p + 4, p = HEAP32[p >> 2], HEAP8[j] = m & 255, r = HEAPU8[q + (p + r)], m = HEAPU8[l + 2], p = o, o = p + 4, p = HEAP32[p >> 2], HEAP8[j + 1] = r & 255, m = HEAPU8[q + (p + m)], r = HEAPU8[l + 3], p = o, o = p + 4, p = HEAP32[p >> 2], HEAP8[j + 2] = m & 255, r = HEAPU8[q + (p + r)], l += 16, HEAP8[j + 3] = r & 255, j += f, e = m = e - 1, m == 0) {
              break b
            }
          }
        }
      }
    }while(0);
    k = b = k + 1;
    if(!(b < 16)) {
      break a
    }
  }
  f = Math.floor(f / 2);
  k = 16;
  a:for(;;) {
    m = HEAP32[_h264bsdBlockX + ((k & 3) << 2) >> 2];
    e = HEAP32[_h264bsdBlockY + ((k & 3) << 2) >> 2];
    o = c + (k << 6);
    l = d + 256;
    j = a;
    b = k >= 20 ? 8 : 9;
    b == 8 && (j = g, l += 64);
    l += (e << 3) + m;
    j += f * e + m;
    b = HEAP32[o >> 2] == 16777215 ? 10 : 11;
    b:do {
      if(b == 10) {
        h = l, e = j, m = HEAP32[h >> 2], h += 8, p = HEAP32[h >> 2], h += 8, HEAP32[e >> 2] = m, e += Math.floor(f / 4) << 2, HEAP32[e >> 2] = p, e += Math.floor(f / 4) << 2, m = HEAP32[h >> 2], h += 8, p = HEAP32[h >> 2], HEAP32[e >> 2] = m, e += Math.floor(f / 4) << 2, HEAP32[e >> 2] = p
      }else {
        if(b == 11) {
          e = 4;
          for(;;) {
            if(m = HEAPU8[l], h = o, o = h + 4, p = HEAP32[h >> 2], r = HEAPU8[l + 1], m = HEAPU8[q + (p + m)], h = o, o = h + 4, p = HEAP32[h >> 2], HEAP8[j] = m & 255, r = HEAPU8[q + (p + r)], m = HEAPU8[l + 2], h = o, o = h + 4, p = HEAP32[h >> 2], HEAP8[j + 1] = r & 255, m = HEAPU8[q + (p + m)], r = HEAPU8[l + 3], h = o, o = h + 4, p = HEAP32[h >> 2], HEAP8[j + 2] = m & 255, r = HEAPU8[q + (p + r)], l += 8, HEAP8[j + 3] = r & 255, j += f, e = h = e - 1, h == 0) {
              break b
            }
          }
        }
      }
    }while(0);
    k = b = k + 1;
    if(!(b <= 23)) {
      break a
    }
  }
}
_h264bsdWriteOutputBlocks.X = 1;
function _InnerBoundaryStrength2(a, b, d) {
  var c, e, f, g, h;
  c = HEAP16[a + 132 + (b << 2) >> 1];
  f = HEAP16[a + 132 + (d << 2) >> 1];
  g = HEAP16[a + 132 + (b << 2) + 2 >> 1];
  h = HEAP16[a + 132 + (d << 2) + 2 >> 1];
  c = _abs(c - f) >= 4 ? 3 : 1;
  a:do {
    if(c == 1) {
      if(_abs(g - h) >= 4) {
        c = 3;
        break a
      }
      if(HEAP32[a + 116 + (b >>> 2 << 2) >> 2] != HEAP32[a + 116 + (d >>> 2 << 2) >> 2]) {
        c = 3;
        break a
      }
      e = 0;
      c = 5;
      break a
    }
  }while(0);
  c == 3 && (e = 1);
  return e
}
_InnerBoundaryStrength2.X = 1;
function _h264bsdFilterPicture(a, b) {
  var d = STACKTOP;
  STACKTOP += 164;
  var c, e, f, g, h, j, l, k, m = d + 128;
  j = HEAP32[a + 4 >> 2];
  f = HEAP32[a + 8 >> 2] * j;
  k = b;
  h = g = 0;
  c = g < HEAPU32[a + 8 >> 2] ? 1 : 8;
  a:do {
    if(c == 1) {
      var o = d, p = m, r = d, q = m, n = m, s = d, t = m;
      for(;;) {
        e = c = _GetMbFilteringFlags(k);
        c = c != 0 ? 3 : 5;
        c:do {
          if(c == 3) {
            if(_GetBoundaryStrengths(k, o, e) == 0) {
              break c
            }
            _GetLumaEdgeThresholds(p, k, e);
            l = HEAP32[a >> 2] + (g << 8) * j + (h << 4);
            _FilterLuma(l, r, q, j << 4);
            _GetChromaEdgeThresholds(n, k, e, HEAP32[k + 24 >> 2]);
            l = HEAP32[a >> 2] + (f << 8) + (g << 6) * j + (h << 3);
            _FilterChroma(l, l + (f << 6), s, t, j << 3)
          }
        }while(0);
        h += 1;
        c = h == j ? 6 : 7;
        c == 6 && (h = 0, g += 1);
        k += 216;
        if(!(g < HEAPU32[a + 8 >> 2])) {
          break a
        }
      }
    }
  }while(0);
  STACKTOP = d
}
_h264bsdFilterPicture.X = 1;
function _GetMbFilteringFlags(a) {
  var b, d;
  d = 0;
  b = HEAP32[a + 8 >> 2] != 1 ? 1 : 9;
  a:do {
    if(b == 1) {
      d |= 1;
      b = HEAP32[a + 200 >> 2] != 0 ? 2 : 5;
      b:do {
        if(b == 2) {
          b = HEAP32[a + 8 >> 2] != 2 ? 4 : 3;
          do {
            if(b == 3 && _IsSliceBoundaryOnLeft(a) != 0) {
              break b
            }
          }while(0);
          d |= 4
        }
      }while(0);
      if(HEAP32[a + 204 >> 2] == 0) {
        break a
      }
      b = HEAP32[a + 8 >> 2] != 2 ? 8 : 7;
      do {
        if(b == 7 && _IsSliceBoundaryOnTop(a) != 0) {
          break a
        }
      }while(0);
      d |= 2
    }
  }while(0);
  return d
}
_GetMbFilteringFlags.X = 1;
function _GetBoundaryStrengths(a, b, d) {
  var c, e;
  e = 0;
  c = (d & 2) != 0 ? 1 : 9;
  a:do {
    if(c == 1) {
      c = HEAPU32[a >> 2] > 5 ? 3 : 2;
      b:do {
        if(c == 2) {
          if(HEAPU32[HEAP32[a + 204 >> 2] >> 2] > 5) {
            c = 3;
            break b
          }
          c = _EdgeBoundaryStrength(a, HEAP32[a + 204 >> 2], 0, 10);
          HEAP32[b >> 2] = c;
          c = _EdgeBoundaryStrength(a, HEAP32[a + 204 >> 2], 1, 11);
          HEAP32[b + 8 >> 2] = c;
          c = _EdgeBoundaryStrength(a, HEAP32[a + 204 >> 2], 4, 14);
          HEAP32[b + 16 >> 2] = c;
          c = _EdgeBoundaryStrength(a, HEAP32[a + 204 >> 2], 5, 15);
          HEAP32[b + 24 >> 2] = c;
          c = HEAP32[b >> 2] != 0 ? 8 : 5;
          c:do {
            if(c == 5) {
              if(HEAP32[b + 8 >> 2] != 0) {
                break c
              }
              if(HEAP32[b + 16 >> 2] != 0) {
                break c
              }
              if(HEAP32[b + 24 >> 2] == 0) {
                break a
              }
            }
          }while(0);
          e = 1;
          break a
        }
      }while(0);
      HEAP32[b + 24 >> 2] = 4;
      HEAP32[b + 16 >> 2] = 4;
      HEAP32[b + 8 >> 2] = 4;
      HEAP32[b >> 2] = 4;
      e = 1
    }else {
      c == 9 && (HEAP32[b + 24 >> 2] = 0, HEAP32[b + 16 >> 2] = 0, HEAP32[b + 8 >> 2] = 0, HEAP32[b >> 2] = 0)
    }
  }while(0);
  c = (d & 4) != 0 ? 11 : 20;
  a:do {
    if(c == 11) {
      c = HEAPU32[a >> 2] > 5 ? 13 : 12;
      b:do {
        if(c == 12) {
          if(HEAPU32[HEAP32[a + 200 >> 2] >> 2] > 5) {
            c = 13;
            break b
          }
          d = _EdgeBoundaryStrength(a, HEAP32[a + 200 >> 2], 0, 5);
          HEAP32[b + 4 >> 2] = d;
          d = _EdgeBoundaryStrength(a, HEAP32[a + 200 >> 2], 2, 7);
          HEAP32[b + 36 >> 2] = d;
          d = _EdgeBoundaryStrength(a, HEAP32[a + 200 >> 2], 8, 13);
          HEAP32[b + 68 >> 2] = d;
          d = _EdgeBoundaryStrength(a, HEAP32[a + 200 >> 2], 10, 15);
          HEAP32[b + 100 >> 2] = d;
          if(e != 0) {
            break a
          }
          c = HEAP32[b + 4 >> 2] != 0 ? 19 : 16;
          c:do {
            if(c == 16) {
              if(HEAP32[b + 36 >> 2] != 0) {
                break c
              }
              if(HEAP32[b + 68 >> 2] != 0) {
                break c
              }
              if(HEAP32[b + 100 >> 2] == 0) {
                break a
              }
            }
          }while(0);
          e = 1;
          break a
        }
      }while(0);
      HEAP32[b + 100 >> 2] = 4;
      HEAP32[b + 68 >> 2] = 4;
      HEAP32[b + 36 >> 2] = 4;
      HEAP32[b + 4 >> 2] = 4;
      e = 1
    }else {
      c == 20 && (HEAP32[b + 100 >> 2] = 0, HEAP32[b + 68 >> 2] = 0, HEAP32[b + 36 >> 2] = 0, HEAP32[b + 4 >> 2] = 0)
    }
  }while(0);
  c = HEAPU32[a >> 2] > 5 ? 22 : 23;
  a:do {
    if(c == 22) {
      HEAP32[b + 120 >> 2] = 3, HEAP32[b + 112 >> 2] = 3, HEAP32[b + 104 >> 2] = 3, HEAP32[b + 96 >> 2] = 3, HEAP32[b + 88 >> 2] = 3, HEAP32[b + 80 >> 2] = 3, HEAP32[b + 72 >> 2] = 3, HEAP32[b + 64 >> 2] = 3, HEAP32[b + 56 >> 2] = 3, HEAP32[b + 48 >> 2] = 3, HEAP32[b + 40 >> 2] = 3, HEAP32[b + 32 >> 2] = 3, HEAP32[b + 124 >> 2] = 3, HEAP32[b + 116 >> 2] = 3, HEAP32[b + 108 >> 2] = 3, HEAP32[b + 92 >> 2] = 3, HEAP32[b + 84 >> 2] = 3, HEAP32[b + 76 >> 2] = 3, HEAP32[b + 60 >> 2] = 3, HEAP32[b + 52 >> 
      2] = 3, HEAP32[b + 44 >> 2] = 3, HEAP32[b + 28 >> 2] = 3, HEAP32[b + 20 >> 2] = 3, HEAP32[b + 12 >> 2] = 3, e = 1
    }else {
      if(c == 23) {
        c = _h264bsdNumMbPart(HEAP32[a >> 2]);
        d = a;
        c = c == 1 ? 24 : 25;
        if(c == 24) {
          _GetBoundaryStrengthsA(d, b)
        }else {
          if(c == 25) {
            var f = a;
            c = HEAP32[d >> 2] == 2 ? 26 : 67;
            if(c == 26) {
              if(HEAP16[f + 32 >> 1] != 0) {
                var g = 1;
                c = 28
              }else {
                c = 27
              }
              c == 27 && (g = HEAP16[a + 28 >> 1] != 0);
              HEAP32[b + 32 >> 2] = g ? 2 : 0;
              if(HEAP16[a + 34 >> 1] != 0) {
                var h = 1;
                c = 30
              }else {
                c = 29
              }
              c == 29 && (h = HEAP16[a + 30 >> 1] != 0);
              HEAP32[b + 40 >> 2] = h ? 2 : 0;
              if(HEAP16[a + 40 >> 1] != 0) {
                var j = 1;
                c = 32
              }else {
                c = 31
              }
              c == 31 && (j = HEAP16[a + 36 >> 1] != 0);
              HEAP32[b + 48 >> 2] = j ? 2 : 0;
              if(HEAP16[a + 42 >> 1] != 0) {
                var l = 1;
                c = 34
              }else {
                c = 33
              }
              c == 33 && (l = HEAP16[a + 38 >> 1] != 0);
              HEAP32[b + 56 >> 2] = l ? 2 : 0;
              if(HEAP16[a + 48 >> 1] != 0) {
                var k = 1;
                c = 36
              }else {
                c = 35
              }
              c == 35 && (k = HEAP16[a + 44 >> 1] != 0);
              HEAP32[b + 96 >> 2] = k ? 2 : 0;
              if(HEAP16[a + 50 >> 1] != 0) {
                var m = 1;
                c = 38
              }else {
                c = 37
              }
              c == 37 && (m = HEAP16[a + 46 >> 1] != 0);
              HEAP32[b + 104 >> 2] = m ? 2 : 0;
              if(HEAP16[a + 56 >> 1] != 0) {
                var o = 1;
                c = 40
              }else {
                c = 39
              }
              c == 39 && (o = HEAP16[a + 52 >> 1] != 0);
              HEAP32[b + 112 >> 2] = o ? 2 : 0;
              if(HEAP16[a + 58 >> 1] != 0) {
                var p = 1;
                c = 42
              }else {
                c = 41
              }
              c == 41 && (p = HEAP16[a + 54 >> 1] != 0);
              HEAP32[b + 120 >> 2] = p ? 2 : 0;
              d = _InnerBoundaryStrength(a, 8, 2);
              HEAP32[b + 64 >> 2] = d;
              d = _InnerBoundaryStrength(a, 9, 3);
              HEAP32[b + 72 >> 2] = d;
              d = _InnerBoundaryStrength(a, 12, 6);
              HEAP32[b + 80 >> 2] = d;
              d = _InnerBoundaryStrength(a, 13, 7);
              HEAP32[b + 88 >> 2] = d;
              if(HEAP16[a + 30 >> 1] != 0) {
                var r = 1;
                c = 44
              }else {
                c = 43
              }
              c == 43 && (r = HEAP16[a + 28 >> 1] != 0);
              HEAP32[b + 12 >> 2] = r ? 2 : 0;
              if(HEAP16[a + 36 >> 1] != 0) {
                var q = 1;
                c = 46
              }else {
                c = 45
              }
              c == 45 && (q = HEAP16[a + 30 >> 1] != 0);
              HEAP32[b + 20 >> 2] = q ? 2 : 0;
              if(HEAP16[a + 38 >> 1] != 0) {
                var n = 1;
                c = 48
              }else {
                c = 47
              }
              c == 47 && (n = HEAP16[a + 36 >> 1] != 0);
              HEAP32[b + 28 >> 2] = n ? 2 : 0;
              if(HEAP16[a + 34 >> 1] != 0) {
                var s = 1;
                c = 50
              }else {
                c = 49
              }
              c == 49 && (s = HEAP16[a + 32 >> 1] != 0);
              HEAP32[b + 44 >> 2] = s ? 2 : 0;
              if(HEAP16[a + 40 >> 1] != 0) {
                var t = 1;
                c = 52
              }else {
                c = 51
              }
              c == 51 && (t = HEAP16[a + 34 >> 1] != 0);
              HEAP32[b + 52 >> 2] = t ? 2 : 0;
              if(HEAP16[a + 42 >> 1] != 0) {
                var v = 1;
                c = 54
              }else {
                c = 53
              }
              c == 53 && (v = HEAP16[a + 40 >> 1] != 0);
              HEAP32[b + 60 >> 2] = v ? 2 : 0;
              if(HEAP16[a + 46 >> 1] != 0) {
                var u = 1;
                c = 56
              }else {
                c = 55
              }
              c == 55 && (u = HEAP16[a + 44 >> 1] != 0);
              HEAP32[b + 76 >> 2] = u ? 2 : 0;
              if(HEAP16[a + 52 >> 1] != 0) {
                var x = 1;
                c = 58
              }else {
                c = 57
              }
              c == 57 && (x = HEAP16[a + 46 >> 1] != 0);
              HEAP32[b + 84 >> 2] = x ? 2 : 0;
              if(HEAP16[a + 54 >> 1] != 0) {
                var w = 1;
                c = 60
              }else {
                c = 59
              }
              c == 59 && (w = HEAP16[a + 52 >> 1] != 0);
              HEAP32[b + 92 >> 2] = w ? 2 : 0;
              if(HEAP16[a + 50 >> 1] != 0) {
                var y = 1;
                c = 62
              }else {
                c = 61
              }
              c == 61 && (y = HEAP16[a + 48 >> 1] != 0);
              HEAP32[b + 108 >> 2] = y ? 2 : 0;
              if(HEAP16[a + 56 >> 1] != 0) {
                var D = 1;
                c = 64
              }else {
                c = 63
              }
              c == 63 && (D = HEAP16[a + 50 >> 1] != 0);
              HEAP32[b + 116 >> 2] = D ? 2 : 0;
              if(HEAP16[a + 58 >> 1] != 0) {
                var E = 1;
                c = 66
              }else {
                c = 65
              }
              c == 65 && (E = HEAP16[a + 56 >> 1] != 0);
              HEAP32[b + 124 >> 2] = E ? 2 : 0
            }else {
              if(c == 67) {
                if(d = a, c = HEAP32[f >> 2] == 3 ? 68 : 109, c == 68) {
                  if(HEAP16[d + 32 >> 1] != 0) {
                    var F = 1;
                    c = 70
                  }else {
                    c = 69
                  }
                  c == 69 && (F = HEAP16[a + 28 >> 1] != 0);
                  HEAP32[b + 32 >> 2] = F ? 2 : 0;
                  if(HEAP16[a + 34 >> 1] != 0) {
                    var H = 1;
                    c = 72
                  }else {
                    c = 71
                  }
                  c == 71 && (H = HEAP16[a + 30 >> 1] != 0);
                  HEAP32[b + 40 >> 2] = H ? 2 : 0;
                  if(HEAP16[a + 40 >> 1] != 0) {
                    var L = 1;
                    c = 74
                  }else {
                    c = 73
                  }
                  c == 73 && (L = HEAP16[a + 36 >> 1] != 0);
                  HEAP32[b + 48 >> 2] = L ? 2 : 0;
                  if(HEAP16[a + 42 >> 1] != 0) {
                    var I = 1;
                    c = 76
                  }else {
                    c = 75
                  }
                  c == 75 && (I = HEAP16[a + 38 >> 1] != 0);
                  HEAP32[b + 56 >> 2] = I ? 2 : 0;
                  if(HEAP16[a + 44 >> 1] != 0) {
                    var B = 1;
                    c = 78
                  }else {
                    c = 77
                  }
                  c == 77 && (B = HEAP16[a + 32 >> 1] != 0);
                  HEAP32[b + 64 >> 2] = B ? 2 : 0;
                  if(HEAP16[a + 46 >> 1] != 0) {
                    var J = 1;
                    c = 80
                  }else {
                    c = 79
                  }
                  c == 79 && (J = HEAP16[a + 34 >> 1] != 0);
                  HEAP32[b + 72 >> 2] = J ? 2 : 0;
                  if(HEAP16[a + 52 >> 1] != 0) {
                    var M = 1;
                    c = 82
                  }else {
                    c = 81
                  }
                  c == 81 && (M = HEAP16[a + 40 >> 1] != 0);
                  HEAP32[b + 80 >> 2] = M ? 2 : 0;
                  if(HEAP16[a + 54 >> 1] != 0) {
                    var C = 1;
                    c = 84
                  }else {
                    c = 83
                  }
                  c == 83 && (C = HEAP16[a + 42 >> 1] != 0);
                  HEAP32[b + 88 >> 2] = C ? 2 : 0;
                  if(HEAP16[a + 48 >> 1] != 0) {
                    var N = 1;
                    c = 86
                  }else {
                    c = 85
                  }
                  c == 85 && (N = HEAP16[a + 44 >> 1] != 0);
                  HEAP32[b + 96 >> 2] = N ? 2 : 0;
                  if(HEAP16[a + 50 >> 1] != 0) {
                    var O = 1;
                    c = 88
                  }else {
                    c = 87
                  }
                  c == 87 && (O = HEAP16[a + 46 >> 1] != 0);
                  HEAP32[b + 104 >> 2] = O ? 2 : 0;
                  if(HEAP16[a + 56 >> 1] != 0) {
                    var P = 1;
                    c = 90
                  }else {
                    c = 89
                  }
                  c == 89 && (P = HEAP16[a + 52 >> 1] != 0);
                  HEAP32[b + 112 >> 2] = P ? 2 : 0;
                  if(HEAP16[a + 58 >> 1] != 0) {
                    var z = 1;
                    c = 92
                  }else {
                    c = 91
                  }
                  c == 91 && (z = HEAP16[a + 54 >> 1] != 0);
                  HEAP32[b + 120 >> 2] = z ? 2 : 0;
                  if(HEAP16[a + 30 >> 1] != 0) {
                    var A = 1;
                    c = 94
                  }else {
                    c = 93
                  }
                  c == 93 && (A = HEAP16[a + 28 >> 1] != 0);
                  HEAP32[b + 12 >> 2] = A ? 2 : 0;
                  if(HEAP16[a + 38 >> 1] != 0) {
                    var K = 1;
                    c = 96
                  }else {
                    c = 95
                  }
                  c == 95 && (K = HEAP16[a + 36 >> 1] != 0);
                  HEAP32[b + 28 >> 2] = K ? 2 : 0;
                  if(HEAP16[a + 34 >> 1] != 0) {
                    var G = 1;
                    c = 98
                  }else {
                    c = 97
                  }
                  c == 97 && (G = HEAP16[a + 32 >> 1] != 0);
                  HEAP32[b + 44 >> 2] = G ? 2 : 0;
                  if(HEAP16[a + 42 >> 1] != 0) {
                    var Q = 1;
                    c = 100
                  }else {
                    c = 99
                  }
                  c == 99 && (Q = HEAP16[a + 40 >> 1] != 0);
                  HEAP32[b + 60 >> 2] = Q ? 2 : 0;
                  if(HEAP16[a + 46 >> 1] != 0) {
                    var R = 1;
                    c = 102
                  }else {
                    c = 101
                  }
                  c == 101 && (R = HEAP16[a + 44 >> 1] != 0);
                  HEAP32[b + 76 >> 2] = R ? 2 : 0;
                  if(HEAP16[a + 54 >> 1] != 0) {
                    var S = 1;
                    c = 104
                  }else {
                    c = 103
                  }
                  c == 103 && (S = HEAP16[a + 52 >> 1] != 0);
                  HEAP32[b + 92 >> 2] = S ? 2 : 0;
                  if(HEAP16[a + 50 >> 1] != 0) {
                    var T = 1;
                    c = 106
                  }else {
                    c = 105
                  }
                  c == 105 && (T = HEAP16[a + 48 >> 1] != 0);
                  HEAP32[b + 108 >> 2] = T ? 2 : 0;
                  if(HEAP16[a + 58 >> 1] != 0) {
                    var U = 1;
                    c = 108
                  }else {
                    c = 107
                  }
                  c == 107 && (U = HEAP16[a + 56 >> 1] != 0);
                  HEAP32[b + 124 >> 2] = U ? 2 : 0;
                  d = _InnerBoundaryStrength(a, 4, 1);
                  HEAP32[b + 20 >> 2] = d;
                  d = _InnerBoundaryStrength(a, 6, 3);
                  HEAP32[b + 52 >> 2] = d;
                  d = _InnerBoundaryStrength(a, 12, 9);
                  HEAP32[b + 84 >> 2] = d;
                  d = _InnerBoundaryStrength(a, 14, 11);
                  HEAP32[b + 116 >> 2] = d
                }else {
                  c == 109 && (d = _InnerBoundaryStrength(d, 2, 0), HEAP32[b + 32 >> 2] = d, d = _InnerBoundaryStrength(a, 3, 1), HEAP32[b + 40 >> 2] = d, d = _InnerBoundaryStrength(a, 6, 4), HEAP32[b + 48 >> 2] = d, d = _InnerBoundaryStrength(a, 7, 5), HEAP32[b + 56 >> 2] = d, d = _InnerBoundaryStrength(a, 8, 2), HEAP32[b + 64 >> 2] = d, d = _InnerBoundaryStrength(a, 9, 3), HEAP32[b + 72 >> 2] = d, d = _InnerBoundaryStrength(a, 12, 6), HEAP32[b + 80 >> 2] = d, d = _InnerBoundaryStrength(a, 13, 7), 
                  HEAP32[b + 88 >> 2] = d, d = _InnerBoundaryStrength(a, 10, 8), HEAP32[b + 96 >> 2] = d, d = _InnerBoundaryStrength(a, 11, 9), HEAP32[b + 104 >> 2] = d, d = _InnerBoundaryStrength(a, 14, 12), HEAP32[b + 112 >> 2] = d, d = _InnerBoundaryStrength(a, 15, 13), HEAP32[b + 120 >> 2] = d, d = _InnerBoundaryStrength(a, 1, 0), HEAP32[b + 12 >> 2] = d, d = _InnerBoundaryStrength(a, 4, 1), HEAP32[b + 20 >> 2] = d, d = _InnerBoundaryStrength(a, 5, 4), HEAP32[b + 28 >> 2] = d, d = _InnerBoundaryStrength(a, 
                  3, 2), HEAP32[b + 44 >> 2] = d, d = _InnerBoundaryStrength(a, 6, 3), HEAP32[b + 52 >> 2] = d, d = _InnerBoundaryStrength(a, 7, 6), HEAP32[b + 60 >> 2] = d, d = _InnerBoundaryStrength(a, 9, 8), HEAP32[b + 76 >> 2] = d, d = _InnerBoundaryStrength(a, 12, 9), HEAP32[b + 84 >> 2] = d, d = _InnerBoundaryStrength(a, 13, 12), HEAP32[b + 92 >> 2] = d, d = _InnerBoundaryStrength(a, 11, 10), HEAP32[b + 108 >> 2] = d, d = _InnerBoundaryStrength(a, 14, 11), HEAP32[b + 116 >> 2] = d, d = _InnerBoundaryStrength(a, 
                  15, 14), HEAP32[b + 124 >> 2] = d)
                }
              }
            }
          }
        }
        if(e != 0) {
          break a
        }
        c = HEAP32[b + 32 >> 2] != 0 ? 135 : 112;
        b:do {
          if(c == 112) {
            if(HEAP32[b + 40 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 48 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 56 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 64 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 72 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 80 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 88 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 96 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 104 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 112 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 120 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 12 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 20 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 28 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 44 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 52 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 60 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 76 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 84 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 92 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 108 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 116 >> 2] != 0) {
              c = 135;
              break b
            }
            if(HEAP32[b + 124 >> 2] == 0) {
              break a
            }
          }
        }while(0);
        e = 1
      }
    }
  }while(0);
  return e
}
_GetBoundaryStrengths.X = 1;
function _FilterLuma(a, b, d, c) {
  var e, f, g;
  f = b;
  g = 0;
  b = 3;
  a:for(;;) {
    e = HEAP32[f + 4 >> 2] != 0 ? 2 : 3;
    e == 2 && _FilterVerLumaEdge(a, HEAP32[f + 4 >> 2], d + 12, c);
    e = HEAP32[f + 12 >> 2] != 0 ? 4 : 5;
    e == 4 && _FilterVerLumaEdge(a + 4, HEAP32[f + 12 >> 2], d + 24, c);
    e = HEAP32[f + 20 >> 2] != 0 ? 6 : 7;
    e == 6 && _FilterVerLumaEdge(a + 8, HEAP32[f + 20 >> 2], d + 24, c);
    e = HEAP32[f + 28 >> 2] != 0 ? 8 : 9;
    e == 8 && _FilterVerLumaEdge(a + 12, HEAP32[f + 28 >> 2], d + 24, c);
    e = HEAP32[f >> 2] == HEAP32[f + 8 >> 2] ? 10 : 14;
    b:do {
      if(e == 10) {
        if(HEAP32[f + 8 >> 2] != HEAP32[f + 16 >> 2]) {
          e = 14;
          break b
        }
        if(HEAP32[f + 16 >> 2] != HEAP32[f + 24 >> 2]) {
          e = 14;
          break b
        }
        if(HEAP32[f >> 2] == 0) {
          e = 22;
          break b
        }
        _FilterHorLuma(a, HEAP32[f >> 2], d + g * 12, c);
        e = 22;
        break b
      }
    }while(0);
    b:do {
      if(e == 14) {
        e = HEAP32[f >> 2] != 0 ? 15 : 16;
        e == 15 && _FilterHorLumaEdge(a, HEAP32[f >> 2], d + g * 12, c);
        e = HEAP32[f + 8 >> 2] != 0 ? 17 : 18;
        e == 17 && _FilterHorLumaEdge(a + 4, HEAP32[f + 8 >> 2], d + g * 12, c);
        e = HEAP32[f + 16 >> 2] != 0 ? 19 : 20;
        e == 19 && _FilterHorLumaEdge(a + 8, HEAP32[f + 16 >> 2], d + g * 12, c);
        if(HEAP32[f + 24 >> 2] == 0) {
          break b
        }
        _FilterHorLumaEdge(a + 12, HEAP32[f + 24 >> 2], d + g * 12, c)
      }
    }while(0);
    a += c << 2;
    f += 32;
    g = 2;
    e = b;
    b = e - 1;
    if(e == 0) {
      break a
    }
  }
}
_FilterLuma.X = 1;
function _GetLumaEdgeThresholds(a, b, d) {
  var c, e, f;
  f = HEAP32[b + 20 >> 2];
  c = _clip(0, 51, HEAP32[b + 12 >> 2] + f);
  e = _clip(0, 51, HEAP32[b + 16 >> 2] + f);
  HEAP32[a + 28 >> 2] = HEAPU8[_alphas + c];
  HEAP32[a + 32 >> 2] = HEAPU8[_betas + e];
  HEAP32[a + 24 >> 2] = _tc0 + c * 3;
  if(((d & 2) != 0 ? 1 : 4) == 1) {
    e = HEAP32[HEAP32[b + 204 >> 2] + 20 >> 2], c = e != f ? 2 : 3, c == 2 ? (e = e + (f + 1) >>> 1, c = _clip(0, 51, HEAP32[b + 12 >> 2] + e), e = _clip(0, 51, HEAP32[b + 16 >> 2] + e), HEAP32[a + 4 >> 2] = HEAPU8[_alphas + c], HEAP32[a + 8 >> 2] = HEAPU8[_betas + e], HEAP32[a >> 2] = _tc0 + c * 3) : c == 3 && (HEAP32[a + 4 >> 2] = HEAP32[a + 28 >> 2], HEAP32[a + 8 >> 2] = HEAP32[a + 32 >> 2], HEAP32[a >> 2] = HEAP32[a + 24 >> 2])
  }
  if(((d & 4) != 0 ? 5 : 8) == 5) {
    e = HEAP32[HEAP32[b + 200 >> 2] + 20 >> 2], c = e != f ? 6 : 7, c == 6 ? (e = e + (f + 1) >>> 1, c = _clip(0, 51, HEAP32[b + 12 >> 2] + e), e = _clip(0, 51, HEAP32[b + 16 >> 2] + e), HEAP32[a + 16 >> 2] = HEAPU8[_alphas + c], HEAP32[a + 20 >> 2] = HEAPU8[_betas + e], HEAP32[a + 12 >> 2] = _tc0 + c * 3) : c == 7 && (HEAP32[a + 16 >> 2] = HEAP32[a + 28 >> 2], HEAP32[a + 20 >> 2] = HEAP32[a + 32 >> 2], HEAP32[a + 12 >> 2] = HEAP32[a + 24 >> 2])
  }
}
_GetLumaEdgeThresholds.X = 1;
function _GetChromaEdgeThresholds(a, b, d, c) {
  var e, f, g;
  g = HEAP32[b + 20 >> 2];
  g = _clip(0, 51, c + g);
  g = HEAP32[_h264bsdQpC + (g << 2) >> 2];
  e = _clip(0, 51, HEAP32[b + 12 >> 2] + g);
  f = _clip(0, 51, HEAP32[b + 16 >> 2] + g);
  HEAP32[a + 28 >> 2] = HEAPU8[_alphas + e];
  HEAP32[a + 32 >> 2] = HEAPU8[_betas + f];
  HEAP32[a + 24 >> 2] = _tc0 + e * 3;
  if(((d & 2) != 0 ? 1 : 4) == 1) {
    f = HEAP32[HEAP32[b + 204 >> 2] + 20 >> 2], e = f != HEAP32[b + 20 >> 2] ? 2 : 3, e == 2 ? (e = _clip(0, 51, c + f), f = HEAP32[_h264bsdQpC + (e << 2) >> 2], f = f + (g + 1) >>> 1, e = _clip(0, 51, HEAP32[b + 12 >> 2] + f), f = _clip(0, 51, HEAP32[b + 16 >> 2] + f), HEAP32[a + 4 >> 2] = HEAPU8[_alphas + e], HEAP32[a + 8 >> 2] = HEAPU8[_betas + f], HEAP32[a >> 2] = _tc0 + e * 3) : e == 3 && (HEAP32[a + 4 >> 2] = HEAP32[a + 28 >> 2], HEAP32[a + 8 >> 2] = HEAP32[a + 32 >> 2], HEAP32[a >> 2] = HEAP32[a + 
    24 >> 2])
  }
  if(((d & 4) != 0 ? 5 : 8) == 5) {
    f = HEAP32[HEAP32[b + 200 >> 2] + 20 >> 2], e = f != HEAP32[b + 20 >> 2] ? 6 : 7, e == 6 ? (d = _clip(0, 51, c + f), f = HEAP32[_h264bsdQpC + (d << 2) >> 2], f = f + (g + 1) >>> 1, e = _clip(0, 51, HEAP32[b + 12 >> 2] + f), f = _clip(0, 51, HEAP32[b + 16 >> 2] + f), HEAP32[a + 16 >> 2] = HEAPU8[_alphas + e], HEAP32[a + 20 >> 2] = HEAPU8[_betas + f], HEAP32[a + 12 >> 2] = _tc0 + e * 3) : e == 7 && (HEAP32[a + 16 >> 2] = HEAP32[a + 28 >> 2], HEAP32[a + 20 >> 2] = HEAP32[a + 32 >> 2], HEAP32[a + 
    12 >> 2] = HEAP32[a + 24 >> 2])
  }
}
_GetChromaEdgeThresholds.X = 1;
function _FilterChroma(a, b, d, c, e) {
  var f, g, h;
  g = d;
  d = h = 0;
  a:for(;;) {
    f = HEAP32[g + 4 >> 2] != 0 ? 2 : 3;
    f == 2 && (_FilterVerChromaEdge(a, HEAP32[g + 4 >> 2], c + 12, e), _FilterVerChromaEdge(b, HEAP32[g + 4 >> 2], c + 12, e));
    f = HEAP32[g + 36 >> 2] != 0 ? 4 : 5;
    f == 4 && (_FilterVerChromaEdge(a + (e << 1), HEAP32[g + 36 >> 2], c + 12, e), _FilterVerChromaEdge(b + (e << 1), HEAP32[g + 36 >> 2], c + 12, e));
    f = HEAP32[g + 20 >> 2] != 0 ? 6 : 7;
    f == 6 && (_FilterVerChromaEdge(a + 4, HEAP32[g + 20 >> 2], c + 24, e), _FilterVerChromaEdge(b + 4, HEAP32[g + 20 >> 2], c + 24, e));
    f = HEAP32[g + 52 >> 2] != 0 ? 8 : 9;
    f == 8 && (_FilterVerChromaEdge(a + (e << 1) + 4, HEAP32[g + 52 >> 2], c + 24, e), _FilterVerChromaEdge(b + (e << 1) + 4, HEAP32[g + 52 >> 2], c + 24, e));
    f = HEAP32[g >> 2] == HEAP32[g + 8 >> 2] ? 10 : 14;
    b:do {
      if(f == 10) {
        if(HEAP32[g + 8 >> 2] != HEAP32[g + 16 >> 2]) {
          f = 14;
          break b
        }
        if(HEAP32[g + 16 >> 2] != HEAP32[g + 24 >> 2]) {
          f = 14;
          break b
        }
        if(HEAP32[g >> 2] == 0) {
          f = 22;
          break b
        }
        _FilterHorChroma(a, HEAP32[g >> 2], c + h * 12, e);
        _FilterHorChroma(b, HEAP32[g >> 2], c + h * 12, e);
        f = 22;
        break b
      }
    }while(0);
    b:do {
      if(f == 14) {
        f = HEAP32[g >> 2] != 0 ? 15 : 16;
        f == 15 && (_FilterHorChromaEdge(a, HEAP32[g >> 2], c + h * 12, e), _FilterHorChromaEdge(b, HEAP32[g >> 2], c + h * 12, e));
        f = HEAP32[g + 8 >> 2] != 0 ? 17 : 18;
        f == 17 && (_FilterHorChromaEdge(a + 2, HEAP32[g + 8 >> 2], c + h * 12, e), _FilterHorChromaEdge(b + 2, HEAP32[g + 8 >> 2], c + h * 12, e));
        f = HEAP32[g + 16 >> 2] != 0 ? 19 : 20;
        f == 19 && (_FilterHorChromaEdge(a + 4, HEAP32[g + 16 >> 2], c + h * 12, e), _FilterHorChromaEdge(b + 4, HEAP32[g + 16 >> 2], c + h * 12, e));
        if(HEAP32[g + 24 >> 2] == 0) {
          break b
        }
        _FilterHorChromaEdge(a + 6, HEAP32[g + 24 >> 2], c + h * 12, e);
        _FilterHorChromaEdge(b + 6, HEAP32[g + 24 >> 2], c + h * 12, e)
      }
    }while(0);
    g += 64;
    a += e << 2;
    b += e << 2;
    h = 2;
    d = f = d + 1;
    if(!(f < 2)) {
      break a
    }
  }
}
_FilterChroma.X = 1;
function _GetBoundaryStrengthsA(a, b) {
  var d;
  if(HEAP16[a + 32 >> 1] != 0) {
    var c = 1;
    d = 2
  }else {
    d = 1
  }
  d == 1 && (c = HEAP16[a + 28 >> 1] != 0);
  HEAP32[b + 32 >> 2] = c ? 2 : 0;
  if(HEAP16[a + 34 >> 1] != 0) {
    var e = 1;
    d = 4
  }else {
    d = 3
  }
  d == 3 && (e = HEAP16[a + 30 >> 1] != 0);
  HEAP32[b + 40 >> 2] = e ? 2 : 0;
  if(HEAP16[a + 40 >> 1] != 0) {
    var f = 1;
    d = 6
  }else {
    d = 5
  }
  d == 5 && (f = HEAP16[a + 36 >> 1] != 0);
  HEAP32[b + 48 >> 2] = f ? 2 : 0;
  if(HEAP16[a + 42 >> 1] != 0) {
    var g = 1;
    d = 8
  }else {
    d = 7
  }
  d == 7 && (g = HEAP16[a + 38 >> 1] != 0);
  HEAP32[b + 56 >> 2] = g ? 2 : 0;
  if(HEAP16[a + 44 >> 1] != 0) {
    var h = 1;
    d = 10
  }else {
    d = 9
  }
  d == 9 && (h = HEAP16[a + 32 >> 1] != 0);
  HEAP32[b + 64 >> 2] = h ? 2 : 0;
  if(HEAP16[a + 46 >> 1] != 0) {
    var j = 1;
    d = 12
  }else {
    d = 11
  }
  d == 11 && (j = HEAP16[a + 34 >> 1] != 0);
  HEAP32[b + 72 >> 2] = j ? 2 : 0;
  if(HEAP16[a + 52 >> 1] != 0) {
    var l = 1;
    d = 14
  }else {
    d = 13
  }
  d == 13 && (l = HEAP16[a + 40 >> 1] != 0);
  HEAP32[b + 80 >> 2] = l ? 2 : 0;
  if(HEAP16[a + 54 >> 1] != 0) {
    var k = 1;
    d = 16
  }else {
    d = 15
  }
  d == 15 && (k = HEAP16[a + 42 >> 1] != 0);
  HEAP32[b + 88 >> 2] = k ? 2 : 0;
  if(HEAP16[a + 48 >> 1] != 0) {
    var m = 1;
    d = 18
  }else {
    d = 17
  }
  d == 17 && (m = HEAP16[a + 44 >> 1] != 0);
  HEAP32[b + 96 >> 2] = m ? 2 : 0;
  if(HEAP16[a + 50 >> 1] != 0) {
    var o = 1;
    d = 20
  }else {
    d = 19
  }
  d == 19 && (o = HEAP16[a + 46 >> 1] != 0);
  HEAP32[b + 104 >> 2] = o ? 2 : 0;
  if(HEAP16[a + 56 >> 1] != 0) {
    var p = 1;
    d = 22
  }else {
    d = 21
  }
  d == 21 && (p = HEAP16[a + 52 >> 1] != 0);
  HEAP32[b + 112 >> 2] = p ? 2 : 0;
  if(HEAP16[a + 58 >> 1] != 0) {
    var r = 1;
    d = 24
  }else {
    d = 23
  }
  d == 23 && (r = HEAP16[a + 54 >> 1] != 0);
  HEAP32[b + 120 >> 2] = r ? 2 : 0;
  if(HEAP16[a + 30 >> 1] != 0) {
    var q = 1;
    d = 26
  }else {
    d = 25
  }
  d == 25 && (q = HEAP16[a + 28 >> 1] != 0);
  HEAP32[b + 12 >> 2] = q ? 2 : 0;
  if(HEAP16[a + 36 >> 1] != 0) {
    var n = 1;
    d = 28
  }else {
    d = 27
  }
  d == 27 && (n = HEAP16[a + 30 >> 1] != 0);
  HEAP32[b + 20 >> 2] = n ? 2 : 0;
  if(HEAP16[a + 38 >> 1] != 0) {
    var s = 1;
    d = 30
  }else {
    d = 29
  }
  d == 29 && (s = HEAP16[a + 36 >> 1] != 0);
  HEAP32[b + 28 >> 2] = s ? 2 : 0;
  if(HEAP16[a + 34 >> 1] != 0) {
    var t = 1;
    d = 32
  }else {
    d = 31
  }
  d == 31 && (t = HEAP16[a + 32 >> 1] != 0);
  HEAP32[b + 44 >> 2] = t ? 2 : 0;
  if(HEAP16[a + 40 >> 1] != 0) {
    var v = 1;
    d = 34
  }else {
    d = 33
  }
  d == 33 && (v = HEAP16[a + 34 >> 1] != 0);
  HEAP32[b + 52 >> 2] = v ? 2 : 0;
  if(HEAP16[a + 42 >> 1] != 0) {
    var u = 1;
    d = 36
  }else {
    d = 35
  }
  d == 35 && (u = HEAP16[a + 40 >> 1] != 0);
  HEAP32[b + 60 >> 2] = u ? 2 : 0;
  if(HEAP16[a + 46 >> 1] != 0) {
    var x = 1;
    d = 38
  }else {
    d = 37
  }
  d == 37 && (x = HEAP16[a + 44 >> 1] != 0);
  HEAP32[b + 76 >> 2] = x ? 2 : 0;
  if(HEAP16[a + 52 >> 1] != 0) {
    var w = 1;
    d = 40
  }else {
    d = 39
  }
  d == 39 && (w = HEAP16[a + 46 >> 1] != 0);
  HEAP32[b + 84 >> 2] = w ? 2 : 0;
  if(HEAP16[a + 54 >> 1] != 0) {
    var y = 1;
    d = 42
  }else {
    d = 41
  }
  d == 41 && (y = HEAP16[a + 52 >> 1] != 0);
  HEAP32[b + 92 >> 2] = y ? 2 : 0;
  if(HEAP16[a + 50 >> 1] != 0) {
    var D = 1;
    d = 44
  }else {
    d = 43
  }
  d == 43 && (D = HEAP16[a + 48 >> 1] != 0);
  HEAP32[b + 108 >> 2] = D ? 2 : 0;
  if(HEAP16[a + 56 >> 1] != 0) {
    var E = 1;
    d = 46
  }else {
    d = 45
  }
  d == 45 && (E = HEAP16[a + 50 >> 1] != 0);
  HEAP32[b + 116 >> 2] = E ? 2 : 0;
  if(HEAP16[a + 58 >> 1] != 0) {
    var F = 1;
    d = 48
  }else {
    d = 47
  }
  d == 47 && (F = HEAP16[a + 56 >> 1] != 0);
  HEAP32[b + 124 >> 2] = F ? 2 : 0
}
_GetBoundaryStrengthsA.X = 1;
function _FilterVerChromaEdge(a, b, d, c) {
  var e, f, g, h, j, l, k;
  e = a;
  k = _h264bsdClip + 512;
  j = HEAP8[e - 2];
  g = HEAP8[e - 1];
  h = HEAP8[e];
  l = HEAP8[e + 1];
  a = _abs((g & 255) - (h & 255)) >>> 0 < HEAPU32[d + 4 >> 2] >>> 0 ? 1 : 6;
  a:do {
    if(a == 1) {
      if(!(_abs((j & 255) - (g & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
        break a
      }
      if(!(_abs((l & 255) - (h & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
        break a
      }
      a = b < 4 ? 4 : 5;
      a == 4 ? (f = HEAPU8[HEAP32[d >> 2] + (b - 1)] + 1, f = _clip(-f, f, (j & 255) + 4 + ((h & 255) - (g & 255) << 2) + -(l & 255) >> 3), g = HEAP8[k + ((g & 255) + f)], h = HEAP8[k + ((h & 255) - f)], HEAP8[e - 1] = g, HEAP8[e] = h) : a == 5 && (HEAP8[e - 1] = (g & 255) + 2 + ((j & 255) << 1) + (l & 255) >> 2 & 255, HEAP8[e] = (h & 255) + 2 + ((l & 255) << 1) + (j & 255) >> 2 & 255)
    }
  }while(0);
  e += c;
  j = HEAP8[e - 2];
  g = HEAP8[e - 1];
  h = HEAP8[e];
  l = HEAP8[e + 1];
  a = _abs((g & 255) - (h & 255)) >>> 0 < HEAPU32[d + 4 >> 2] >>> 0 ? 7 : 12;
  a:do {
    if(a == 7) {
      if(!(_abs((j & 255) - (g & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
        break a
      }
      if(!(_abs((l & 255) - (h & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
        break a
      }
      a = b < 4 ? 10 : 11;
      a == 10 ? (f = HEAPU8[HEAP32[d >> 2] + (b - 1)] + 1, f = _clip(-f, f, (j & 255) + 4 + ((h & 255) - (g & 255) << 2) + -(l & 255) >> 3), g = HEAP8[k + ((g & 255) + f)], h = HEAP8[k + ((h & 255) - f)], HEAP8[e - 1] = g, HEAP8[e] = h) : a == 11 && (HEAP8[e - 1] = (g & 255) + 2 + ((j & 255) << 1) + (l & 255) >> 2 & 255, HEAP8[e] = (h & 255) + 2 + ((l & 255) << 1) + (j & 255) >> 2 & 255)
    }
  }while(0)
}
_FilterVerChromaEdge.X = 1;
function _FilterHorChroma(a, b, d, c) {
  var e, f, g, h, j, l, k, m, o;
  e = a;
  o = _h264bsdClip + 512;
  a = b < 4 ? 1 : 7;
  a:do {
    if(a == 1) {
      g = HEAPU8[HEAP32[d >> 2] + (b - 1)] + 1;
      h = 8;
      for(;;) {
        k = HEAP8[e + c * -2];
        j = HEAP8[e + -c];
        l = HEAP8[e];
        m = HEAP8[e + c];
        a = _abs((j & 255) - (l & 255)) >>> 0 < HEAPU32[d + 4 >> 2] >>> 0 ? 3 : 6;
        c:do {
          if(a == 3) {
            if(!(_abs((k & 255) - (j & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
              a = 6;
              break c
            }
            if(!(_abs((m & 255) - (l & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
              a = 6;
              break c
            }
            f = _clip(-g, g, (k & 255) + 4 + ((l & 255) - (j & 255) << 2) + -(m & 255) >> 3);
            j = HEAP8[o + ((j & 255) + f)];
            l = HEAP8[o + ((l & 255) - f)];
            HEAP8[e + -c] = j;
            HEAP8[e] = l
          }
        }while(0);
        h = f = h - 1;
        e += 1;
        if(f == 0) {
          break a
        }
      }
    }else {
      if(a == 7) {
        h = 8;
        for(;;) {
          k = HEAP8[e + c * -2];
          j = HEAP8[e + -c];
          l = HEAP8[e];
          m = HEAP8[e + c];
          a = _abs((j & 255) - (l & 255)) >>> 0 < HEAPU32[d + 4 >> 2] >>> 0 ? 9 : 12;
          c:do {
            if(a == 9) {
              if(!(_abs((k & 255) - (j & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
                a = 12;
                break c
              }
              if(!(_abs((m & 255) - (l & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
                a = 12;
                break c
              }
              HEAP8[e + -c] = (j & 255) + 2 + ((k & 255) << 1) + (m & 255) >> 2 & 255;
              HEAP8[e] = (l & 255) + 2 + ((m & 255) << 1) + (k & 255) >> 2 & 255
            }
          }while(0);
          h = g = h - 1;
          e += 1;
          if(g == 0) {
            break a
          }
        }
      }
    }
  }while(0)
}
_FilterHorChroma.X = 1;
function _FilterHorChromaEdge(a, b, d, c) {
  var e, f, g, h, j, l, k, m;
  m = _h264bsdClip + 512;
  b = HEAPU8[HEAP32[d >> 2] + (b - 1)] + 1;
  g = 2;
  a:for(;;) {
    l = HEAP8[a + c * -2];
    h = HEAP8[a + -c];
    j = HEAP8[a];
    k = HEAP8[a + c];
    e = _abs((h & 255) - (j & 255)) >>> 0 < HEAPU32[d + 4 >> 2] >>> 0 ? 2 : 5;
    b:do {
      if(e == 2) {
        if(!(_abs((l & 255) - (h & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
          break b
        }
        if(!(_abs((k & 255) - (j & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
          break b
        }
        f = _clip(-b, b, (l & 255) + 4 + ((j & 255) - (h & 255) << 2) + -(k & 255) >> 3);
        h = HEAP8[m + ((h & 255) + f)];
        j = HEAP8[m + ((j & 255) - f)];
        HEAP8[a + -c] = h;
        HEAP8[a] = j
      }
    }while(0);
    g = e = g - 1;
    a += 1;
    if(e == 0) {
      break a
    }
  }
}
_FilterHorChromaEdge.X = 1;
function _FilterVerLumaEdge(a, b, d, c) {
  var e, f, g, h, j, l, k, m, o, p, r, q, n;
  r = _h264bsdClip + 512;
  q = HEAP32[d + 4 >> 2];
  n = HEAP32[d + 8 >> 2];
  e = b < 4 ? 1 : 11;
  a:do {
    if(e == 1) {
      f = g = HEAPU8[HEAP32[d >> 2] + (b - 1)];
      h = 4;
      for(;;) {
        k = HEAPU8[a - 2];
        j = HEAPU8[a - 1];
        l = HEAPU8[a];
        m = HEAPU8[a + 1];
        e = _abs(j - l) < q ? 3 : 10;
        c:do {
          if(e == 3) {
            if(!(_abs(k - j) < n)) {
              e = 10;
              break c
            }
            if(!(_abs(m - l) < n)) {
              e = 10;
              break c
            }
            o = HEAPU8[a - 3];
            p = HEAPU8[a + 2];
            e = _abs(o - j) < n ? 6 : 7;
            e == 6 && (o = -(k << 1) + o + (l + (j + 1) >> 1) >> 1, e = k, o = _clip(-g, g, o), HEAP8[a - 2] = o + e & 255, f += 1);
            e = _abs(p - l) < n ? 8 : 9;
            e == 8 && (o = -(m << 1) + p + (l + (j + 1) >> 1) >> 1, p = m, o = _clip(-g, g, o), HEAP8[a + 1] = o + p & 255, f += 1);
            o = k + 4 + (l - j << 2) + -m >> 3;
            f = _clip(-f, f, o);
            j = HEAPU8[r + (f + j)];
            l = HEAPU8[r + (l - f)];
            f = g;
            HEAP8[a - 1] = j & 255;
            HEAP8[a] = l & 255
          }
        }while(0);
        h = j = h - 1;
        a += c;
        if(j == 0) {
          break a
        }
      }
    }else {
      if(e == 11) {
        h = 4;
        for(;;) {
          k = HEAPU8[a - 2];
          j = HEAPU8[a - 1];
          l = HEAPU8[a];
          m = HEAPU8[a + 1];
          e = _abs(j - l) < q ? 13 : 23;
          c:do {
            if(e == 13) {
              if(!(_abs(k - j) < n)) {
                e = 23;
                break c
              }
              if(!(_abs(m - l) < n)) {
                e = 23;
                break c
              }
              g = _abs(j - l) < (q >>> 2) + 2 ? 1 : 0;
              o = HEAPU8[a - 3];
              p = HEAPU8[a + 2];
              e = g != 0 ? 16 : 18;
              d:do {
                if(e == 16) {
                  if(!(_abs(o - j) < n)) {
                    e = 18;
                    break d
                  }
                  f = j + k + l;
                  HEAP8[a - 1] = m + (o + 4) + (f << 1) >> 3 & 255;
                  HEAP8[a - 2] = f + (o + 2) >> 2 & 255;
                  HEAP8[a - 3] = f + 4 + o * 3 + (HEAPU8[a - 4] << 1) >> 3 & 255;
                  e = 19;
                  break d
                }
              }while(0);
              e == 18 && (HEAP8[a - 1] = j + 2 + (k << 1) + m >> 2 & 255);
              e = g != 0 ? 20 : 22;
              d:do {
                if(e == 20) {
                  if(!(_abs(p - l) < n)) {
                    e = 22;
                    break d
                  }
                  f = l + j + m;
                  HEAP8[a] = p + (k + 4) + (f << 1) >> 3 & 255;
                  HEAP8[a + 1] = p + (f + 2) >> 2 & 255;
                  HEAP8[a + 2] = f + 4 + p * 3 + (HEAPU8[a + 3] << 1) >> 3 & 255;
                  e = 23;
                  break c
                }
              }while(0);
              HEAP8[a] = l + 2 + (m << 1) + k >> 2 & 255
            }
          }while(0);
          h = g = h - 1;
          a += c;
          if(g == 0) {
            break a
          }
        }
      }
    }
  }while(0)
}
_FilterVerLumaEdge.X = 1;
function _FilterHorLuma(a, b, d, c) {
  var e, f, g, h, j, l, k, m, o, p, r, q, n;
  r = _h264bsdClip + 512;
  q = HEAP32[d + 4 >> 2];
  n = HEAP32[d + 8 >> 2];
  e = b < 4 ? 1 : 11;
  a:do {
    if(e == 1) {
      f = g = HEAPU8[HEAP32[d >> 2] + (b - 1)];
      h = 16;
      for(;;) {
        k = HEAPU8[a + c * -2];
        j = HEAPU8[a + -c];
        l = HEAPU8[a];
        m = HEAPU8[a + c];
        e = _abs(j - l) < q ? 3 : 10;
        c:do {
          if(e == 3) {
            if(!(_abs(k - j) < n)) {
              e = 10;
              break c
            }
            if(!(_abs(m - l) < n)) {
              e = 10;
              break c
            }
            o = HEAPU8[a + c * -3];
            e = _abs(o - j) < n ? 6 : 7;
            e == 6 && (o = -(k << 1) + o + (l + (j + 1) >> 1) >> 1, e = k, o = _clip(-g, g, o), HEAP8[a + c * -2] = o + e & 255, f += 1);
            p = HEAPU8[a + (c << 1)];
            e = _abs(p - l) < n ? 8 : 9;
            e == 8 && (o = -(m << 1) + p + (l + (j + 1) >> 1) >> 1, p = m, o = _clip(-g, g, o), HEAP8[a + c] = o + p & 255, f += 1);
            o = k + 4 + (l - j << 2) + -m >> 3;
            f = _clip(-f, f, o);
            j = HEAPU8[r + (f + j)];
            l = HEAPU8[r + (l - f)];
            f = g;
            HEAP8[a + -c] = j & 255;
            HEAP8[a] = l & 255
          }
        }while(0);
        h = j = h - 1;
        a += 1;
        if(j == 0) {
          break a
        }
      }
    }else {
      if(e == 11) {
        h = 16;
        for(;;) {
          k = HEAPU8[a + c * -2];
          j = HEAPU8[a + -c];
          l = HEAPU8[a];
          m = HEAPU8[a + c];
          e = _abs(j - l) < q ? 13 : 23;
          c:do {
            if(e == 13) {
              if(!(_abs(k - j) < n)) {
                e = 23;
                break c
              }
              if(!(_abs(m - l) < n)) {
                e = 23;
                break c
              }
              g = _abs(j - l) < (q >>> 2) + 2 ? 1 : 0;
              o = HEAPU8[a + c * -3];
              p = HEAPU8[a + (c << 1)];
              e = g != 0 ? 16 : 18;
              d:do {
                if(e == 16) {
                  if(!(_abs(o - j) < n)) {
                    e = 18;
                    break d
                  }
                  f = j + k + l;
                  HEAP8[a + -c] = m + (o + 4) + (f << 1) >> 3 & 255;
                  HEAP8[a + c * -2] = f + (o + 2) >> 2 & 255;
                  HEAP8[a + c * -3] = f + 4 + o * 3 + (HEAPU8[a + c * -4] << 1) >> 3 & 255;
                  e = 19;
                  break d
                }
              }while(0);
              e == 18 && (HEAP8[a + -c] = j + 2 + (k << 1) + m >> 2 & 255);
              e = g != 0 ? 20 : 22;
              d:do {
                if(e == 20) {
                  if(!(_abs(p - l) < n)) {
                    e = 22;
                    break d
                  }
                  f = l + j + m;
                  HEAP8[a] = p + (k + 4) + (f << 1) >> 3 & 255;
                  HEAP8[a + c] = p + (f + 2) >> 2 & 255;
                  HEAP8[a + (c << 1)] = f + 4 + p * 3 + (HEAPU8[a + c * 3] << 1) >> 3 & 255;
                  e = 23;
                  break c
                }
              }while(0);
              HEAP8[a] = l + 2 + (m << 1) + k >> 2 & 255
            }
          }while(0);
          h = g = h - 1;
          a += 1;
          if(g == 0) {
            break a
          }
        }
      }
    }
  }while(0)
}
_FilterHorLuma.X = 1;
function _FilterHorLumaEdge(a, b, d, c) {
  var e, f, g, h, j, l, k, m, o;
  o = _h264bsdClip + 512;
  f = b = HEAPU8[HEAP32[d >> 2] + (b - 1)];
  g = 4;
  a:for(;;) {
    l = HEAP8[a + c * -2];
    h = HEAP8[a + -c];
    j = HEAP8[a];
    k = HEAP8[a + c];
    e = _abs((h & 255) - (j & 255)) >>> 0 < HEAPU32[d + 4 >> 2] >>> 0 ? 2 : 9;
    b:do {
      if(e == 2) {
        if(!(_abs((l & 255) - (h & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
          break b
        }
        if(!(_abs((k & 255) - (j & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0)) {
          break b
        }
        m = HEAP8[a + c * -3];
        e = _abs((m & 255) - (h & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0 ? 5 : 6;
        e == 5 && (m = -((l & 255) << 1) + (m & 255) + ((h & 255) + 1 + (j & 255) >> 1) >> 1, e = l & 255, m = _clip(-b, b, m), HEAP8[a + c * -2] = m + e & 255, f += 1);
        m = HEAP8[a + (c << 1)];
        e = _abs((m & 255) - (j & 255)) >>> 0 < HEAPU32[d + 8 >> 2] >>> 0 ? 7 : 8;
        if(e == 7) {
          m = -((k & 255) << 1) + (m & 255) + ((h & 255) + 1 + (j & 255) >> 1) >> 1;
          var p = k & 255;
          m = _clip(-b, b, m);
          HEAP8[a + c] = m + p & 255;
          f += 1
        }
        m = (l & 255) + 4 + ((j & 255) - (h & 255) << 2) + -(k & 255) >> 3;
        f = _clip(-f, f, m);
        h = HEAP8[o + ((h & 255) + f)];
        j = HEAP8[o + ((j & 255) - f)];
        f = b;
        HEAP8[a + -c] = h;
        HEAP8[a] = j
      }
    }while(0);
    g = h = g - 1;
    a += 1;
    if(h == 0) {
      break a
    }
  }
}
_FilterHorLumaEdge.X = 1;
function _EdgeBoundaryStrength(a, b, d, c) {
  var e, f;
  e = HEAP16[a + 28 + (d << 1) >> 1] != 0 ? 2 : 1;
  a:do {
    if(e == 1) {
      if(HEAP16[b + 28 + (c << 1) >> 1] != 0) {
        e = 2;
        break a
      }
      e = HEAP32[a + 116 + (d >>> 2 << 2) >> 2] != HEAP32[b + 116 + (c >>> 2 << 2) >> 2] ? 6 : 4;
      b:do {
        if(e == 4) {
          if(_abs(HEAP16[a + 132 + (d << 2) >> 1] - HEAP16[b + 132 + (c << 2) >> 1]) >= 4) {
            break b
          }
          if(_abs(HEAP16[a + 132 + (d << 2) + 2 >> 1] - HEAP16[b + 132 + (c << 2) + 2 >> 1]) >= 4) {
            break b
          }
          f = 0;
          e = 8;
          break a
        }
      }while(0);
      f = 1;
      e = 8;
      break a
    }
  }while(0);
  e == 2 && (f = 2);
  return f
}
_EdgeBoundaryStrength.X = 1;
function _IsSliceBoundaryOnLeft(a) {
  var b, a = HEAP32[a + 4 >> 2] != HEAP32[HEAP32[a + 200 >> 2] + 4 >> 2] ? 1 : 2;
  a == 1 ? b = 1 : a == 2 && (b = 0);
  return b
}
function _IsSliceBoundaryOnTop(a) {
  var b, a = HEAP32[a + 4 >> 2] != HEAP32[HEAP32[a + 204 >> 2] + 4 >> 2] ? 1 : 2;
  a == 1 ? b = 1 : a == 2 && (b = 0);
  return b
}
function _InnerBoundaryStrength(a, b, d) {
  var c, e, f, g, h, j, l;
  c = HEAP16[a + 28 + (b << 1) >> 1];
  f = HEAP16[a + 28 + (d << 1) >> 1];
  g = HEAP16[a + 132 + (b << 2) >> 1];
  h = HEAP16[a + 132 + (d << 2) >> 1];
  j = HEAP16[a + 132 + (b << 2) + 2 >> 1];
  l = HEAP16[a + 132 + (d << 2) + 2 >> 1];
  c = c != 0 ? 2 : 1;
  a:do {
    if(c == 1) {
      if(f != 0) {
        c = 2;
        break a
      }
      c = _abs(g - h) >= 4 ? 6 : 4;
      b:do {
        if(c == 4) {
          if(_abs(j - l) >= 4) {
            break b
          }
          if(HEAP32[a + 116 + (b >>> 2 << 2) >> 2] != HEAP32[a + 116 + (d >>> 2 << 2) >> 2]) {
            break b
          }
          e = 0;
          c = 8;
          break a
        }
      }while(0);
      e = 1;
      c = 8;
      break a
    }
  }while(0);
  c == 2 && (e = 2);
  return e
}
_InnerBoundaryStrength.X = 1;
function _h264bsdConceal(a, b, d) {
  var c, e, f, g, h, j, l, k, m;
  j = HEAP32[b + 4 >> 2];
  l = HEAP32[b + 8 >> 2];
  k = 0;
  c = d == 0 | d == 5 ? 2 : 1;
  a:do {
    if(c == 1) {
      c = HEAP32[a + 3384 >> 2] != 0 ? 2 : 5;
      break a
    }
  }while(0);
  a:do {
    if(c == 2) {
      f = 0;
      for(;;) {
        k = _h264bsdGetRefPicData(a + 1220, f);
        f = g = f + 1;
        if(g >= 16) {
          break a
        }
        if(k != 0) {
          break a
        }
      }
    }
  }while(0);
  f = g = h = 0;
  a:for(;;) {
    c = f;
    if(!(f < HEAPU32[a + 1176 >> 2])) {
      m = c;
      break a
    }
    if(!(HEAP32[HEAP32[a + 1212 >> 2] + c * 216 + 196 >> 2] != 0 ^ 1)) {
      m = f;
      break a
    }
    f += 1;
    h += 1;
    if(h != j) {
      continue a
    }
    g += 1;
    h = 0
  }
  c = m == HEAP32[a + 1176 >> 2] ? 11 : 19;
  do {
    if(c == 11) {
      c = d == 2 | d == 7 ? 12 : 13;
      b:do {
        if(c == 12) {
          c = HEAP32[a + 3384 >> 2] == 0 ? 14 : 13;
          break b
        }
      }while(0);
      b:do {
        if(c == 13) {
          if(k == 0) {
            c = 14;
            break b
          }
          _H264SwDecMemcpy(HEAP32[b >> 2], k, j * 384 * l);
          c = 16;
          break b
        }
      }while(0);
      c == 14 && _H264SwDecMemset(HEAP32[b >> 2], 128, j * 384 * l);
      HEAP32[a + 1204 >> 2] = HEAP32[a + 1176 >> 2];
      f = 0;
      c = f < HEAPU32[a + 1176 >> 2] ? 17 : 18;
      b:do {
        if(c == 17) {
          for(;;) {
            if(HEAP32[HEAP32[a + 1212 >> 2] + f * 216 + 8 >> 2] = 1, f += 1, !(f < HEAPU32[a + 1176 >> 2])) {
              c = 18;
              break b
            }
          }
        }
      }while(0);
      e = 0
    }else {
      if(c == 19) {
        m = HEAP32[a + 1212 >> 2] + j * g * 216;
        e = h - 1;
        c = h != 0 ? 20 : 21;
        b:do {
          if(c == 20) {
            for(;;) {
              if(_ConcealMb(m + e * 216, b, g, e, d, k), HEAP32[m + e * 216 + 196 >> 2] = 1, HEAP32[a + 1204 >> 2] += 1, f = e, e = f - 1, f == 0) {
                break b
              }
            }
          }
        }while(0);
        e = h + 1;
        c = e < j ? 22 : 25;
        b:do {
          if(c == 22) {
            for(;;) {
              if(c = HEAP32[m + e * 216 + 196 >> 2] != 0 ? 24 : 23, c == 23 && (_ConcealMb(m + e * 216, b, g, e, d, k), HEAP32[m + e * 216 + 196 >> 2] = 1, HEAP32[a + 1204 >> 2] += 1), e += 1, !(e < j)) {
                break b
              }
            }
          }
        }while(0);
        c = g != 0 ? 26 : 30;
        b:do {
          if(c == 26) {
            e = 0;
            if(!(e < j)) {
              break b
            }
            for(;;) {
              f = g - 1;
              m = HEAP32[a + 1212 >> 2] + j * f * 216 + e * 216;
              d:for(;;) {
                _ConcealMb(m, b, f, e, d, k);
                HEAP32[m + 196 >> 2] = 1;
                HEAP32[a + 1204 >> 2] += 1;
                m += -j * 216;
                var o = f;
                f = o - 1;
                if(o == 0) {
                  c = 29;
                  break d
                }
              }
              e += 1;
              if(!(e < j)) {
                break b
              }
            }
          }
        }while(0);
        f = g + 1;
        c = f < l ? 31 : 36;
        b:do {
          if(c == 31) {
            for(;;) {
              m = HEAP32[a + 1212 >> 2] + j * f * 216;
              e = 0;
              c = e < j ? 32 : 35;
              d:do {
                if(c == 32) {
                  for(;;) {
                    if(c = HEAP32[m + e * 216 + 196 >> 2] != 0 ? 34 : 33, c == 33 && (_ConcealMb(m + e * 216, b, f, e, d, k), HEAP32[m + e * 216 + 196 >> 2] = 1, HEAP32[a + 1204 >> 2] += 1), e += 1, !(e < j)) {
                      c = 35;
                      break d
                    }
                  }
                }
              }while(0);
              f += 1;
              if(!(f < l)) {
                c = 36;
                break b
              }
            }
          }
        }while(0);
        e = 0
      }
    }
  }while(0);
  return e
}
_h264bsdConceal.X = 1;
function _ConcealMb(a, b, d, c, e, f) {
  var g = STACKTOP;
  STACKTOP += 540;
  var h, j, l, k, m, o, p, r, q, n, s, t = g + 384, v, u = g + 448, x = g + 464, w = g + 480, y = g + 496, D, E, F, H, L = g + 512, I = g + 516;
  p = HEAP32[b + 4 >> 2];
  r = HEAP32[b + 8 >> 2];
  _h264bsdSetCurrImageMbPointers(b, p * d + c);
  q = HEAP32[b >> 2] + (d << 8) * p + (c << 4);
  D = E = F = H = 0;
  HEAP32[a + 20 >> 2] = 40;
  HEAP32[a + 8 >> 2] = 0;
  HEAP32[a >> 2] = 6;
  HEAP32[a + 12 >> 2] = 0;
  HEAP32[a + 16 >> 2] = 0;
  HEAP32[a + 24 >> 2] = 0;
  h = e == 2 | e == 7 ? 1 : 2;
  a:do {
    if(h == 1) {
      _H264SwDecMemset(g, 0, 384);
      h = 5;
      break a
    }else {
      if(h == 2) {
        var B, J, M, C;
        B = L;
        J = B + 4;
        C = 0;
        C < 0 && (C += 256);
        for(C = C + (C << 8) + (C << 16) + C * 16777216;B % 4 !== 0 && B < J;) {
          HEAP8[B++] = 0
        }
        B >>= 2;
        for(M = J >> 2;B < M;) {
          HEAP32[B++] = C
        }
        for(B <<= 2;B < J;) {
          HEAP8[B++] = 0
        }
        HEAP32[I + 4 >> 2] = p;
        HEAP32[I + 8 >> 2] = r;
        HEAP32[I >> 2] = f;
        var N = g;
        h = HEAP32[I >> 2] != 0 ? 3 : 4;
        do {
          if(h == 3) {
            _h264bsdPredictSamples(N, L, I, c << 4, d << 4, 0, 0, 16, 16);
            _h264bsdWriteMacroblock(b, g);
            h = 74;
            break a
          }else {
            if(h == 4) {
              _H264SwDecMemset(N, 0, 384);
              h = 5;
              break a
            }
          }
        }while(0)
      }
    }
  }while(0);
  do {
    if(h == 5) {
      _H264SwDecMemset(t, 0, 64);
      m = o = l = 0;
      h = d != 0 ? 6 : 8;
      b:do {
        if(h == 6) {
          if(HEAP32[a + -p * 216 + 196 >> 2] == 0) {
            h = 8;
            break b
          }
          D = 1;
          var O = n = q + p * -16;
          n = O + 1;
          HEAP32[u >> 2] = HEAPU8[O];
          var P = n;
          n = P + 1;
          HEAP32[u >> 2] += HEAPU8[P];
          var z = n;
          n = z + 1;
          HEAP32[u >> 2] += HEAPU8[z];
          var A = n;
          n = A + 1;
          HEAP32[u >> 2] += HEAPU8[A];
          var K = n;
          n = K + 1;
          HEAP32[u + 4 >> 2] = HEAPU8[K];
          var G = n;
          n = G + 1;
          HEAP32[u + 4 >> 2] += HEAPU8[G];
          var Q = n;
          n = Q + 1;
          HEAP32[u + 4 >> 2] += HEAPU8[Q];
          var R = n;
          n = R + 1;
          HEAP32[u + 4 >> 2] += HEAPU8[R];
          var S = n;
          n = S + 1;
          HEAP32[u + 8 >> 2] = HEAPU8[S];
          var T = n;
          n = T + 1;
          HEAP32[u + 8 >> 2] += HEAPU8[T];
          var U = n;
          n = U + 1;
          HEAP32[u + 8 >> 2] += HEAPU8[U];
          var V = n;
          n = V + 1;
          HEAP32[u + 8 >> 2] += HEAPU8[V];
          var W = n;
          n = W + 1;
          HEAP32[u + 12 >> 2] = HEAPU8[W];
          var X = n;
          n = X + 1;
          HEAP32[u + 12 >> 2] += HEAPU8[X];
          var Y = n;
          n = Y + 1;
          HEAP32[u + 12 >> 2] += HEAPU8[Y];
          var Z = n;
          n = Z + 1;
          HEAP32[u + 12 >> 2] += HEAPU8[Z];
          l += 1;
          m += 1;
          HEAP32[t >> 2] = HEAP32[u + 4 >> 2] + HEAP32[u >> 2] + HEAP32[u + 8 >> 2] + HEAP32[u + 12 >> 2] + HEAP32[t >> 2];
          HEAP32[t + 4 >> 2] = HEAP32[u + 4 >> 2] + HEAP32[u >> 2] + -HEAP32[u + 8 >> 2] + -HEAP32[u + 12 >> 2] + HEAP32[t + 4 >> 2]
        }
      }while(0);
      h = d != r - 1 ? 9 : 11;
      b:do {
        if(h == 9) {
          if(HEAP32[a + p * 216 + 196 >> 2] == 0) {
            h = 11;
            break b
          }
          E = 1;
          var aa = n = q + (p << 8);
          n = aa + 1;
          HEAP32[x >> 2] = HEAPU8[aa];
          var ba = n;
          n = ba + 1;
          HEAP32[x >> 2] += HEAPU8[ba];
          var ca = n;
          n = ca + 1;
          HEAP32[x >> 2] += HEAPU8[ca];
          var da = n;
          n = da + 1;
          HEAP32[x >> 2] += HEAPU8[da];
          var ea = n;
          n = ea + 1;
          HEAP32[x + 4 >> 2] = HEAPU8[ea];
          var fa = n;
          n = fa + 1;
          HEAP32[x + 4 >> 2] += HEAPU8[fa];
          var ga = n;
          n = ga + 1;
          HEAP32[x + 4 >> 2] += HEAPU8[ga];
          var ha = n;
          n = ha + 1;
          HEAP32[x + 4 >> 2] += HEAPU8[ha];
          var ia = n;
          n = ia + 1;
          HEAP32[x + 8 >> 2] = HEAPU8[ia];
          var ja = n;
          n = ja + 1;
          HEAP32[x + 8 >> 2] += HEAPU8[ja];
          var ka = n;
          n = ka + 1;
          HEAP32[x + 8 >> 2] += HEAPU8[ka];
          var la = n;
          n = la + 1;
          HEAP32[x + 8 >> 2] += HEAPU8[la];
          var ma = n;
          n = ma + 1;
          HEAP32[x + 12 >> 2] = HEAPU8[ma];
          var na = n;
          n = na + 1;
          HEAP32[x + 12 >> 2] += HEAPU8[na];
          var oa = n;
          n = oa + 1;
          HEAP32[x + 12 >> 2] += HEAPU8[oa];
          var pa = n;
          n = pa + 1;
          HEAP32[x + 12 >> 2] += HEAPU8[pa];
          l += 1;
          m += 1;
          HEAP32[t >> 2] = HEAP32[x + 4 >> 2] + HEAP32[x >> 2] + HEAP32[x + 8 >> 2] + HEAP32[x + 12 >> 2] + HEAP32[t >> 2];
          HEAP32[t + 4 >> 2] = HEAP32[x + 4 >> 2] + HEAP32[x >> 2] + -HEAP32[x + 8 >> 2] + -HEAP32[x + 12 >> 2] + HEAP32[t + 4 >> 2]
        }
      }while(0);
      h = c != 0 ? 12 : 14;
      b:do {
        if(h == 12) {
          if(HEAP32[a - 216 + 196 >> 2] == 0) {
            h = 14;
            break b
          }
          F = 1;
          n = q - 1;
          HEAP32[w >> 2] = HEAPU8[n];
          HEAP32[w >> 2] += HEAPU8[n + (p << 4)];
          HEAP32[w >> 2] += HEAPU8[n + (p << 5)];
          HEAP32[w >> 2] += HEAPU8[n + p * 48];
          n += p << 6;
          HEAP32[w + 4 >> 2] = HEAPU8[n];
          HEAP32[w + 4 >> 2] += HEAPU8[n + (p << 4)];
          HEAP32[w + 4 >> 2] += HEAPU8[n + (p << 5)];
          HEAP32[w + 4 >> 2] += HEAPU8[n + p * 48];
          n += p << 6;
          HEAP32[w + 8 >> 2] = HEAPU8[n];
          HEAP32[w + 8 >> 2] += HEAPU8[n + (p << 4)];
          HEAP32[w + 8 >> 2] += HEAPU8[n + (p << 5)];
          HEAP32[w + 8 >> 2] += HEAPU8[n + p * 48];
          n += p << 6;
          HEAP32[w + 12 >> 2] = HEAPU8[n];
          HEAP32[w + 12 >> 2] += HEAPU8[n + (p << 4)];
          HEAP32[w + 12 >> 2] += HEAPU8[n + (p << 5)];
          HEAP32[w + 12 >> 2] += HEAPU8[n + p * 48];
          l += 1;
          o += 1;
          HEAP32[t >> 2] = HEAP32[w + 4 >> 2] + HEAP32[w >> 2] + HEAP32[w + 8 >> 2] + HEAP32[w + 12 >> 2] + HEAP32[t >> 2];
          HEAP32[t + 16 >> 2] = HEAP32[w + 4 >> 2] + HEAP32[w >> 2] + -HEAP32[w + 8 >> 2] + -HEAP32[w + 12 >> 2] + HEAP32[t + 16 >> 2]
        }
      }while(0);
      h = c != p - 1 ? 15 : 17;
      b:do {
        if(h == 15) {
          if(HEAP32[a + 412 >> 2] == 0) {
            h = 17;
            break b
          }
          H = 1;
          n = q + 16;
          HEAP32[y >> 2] = HEAPU8[n];
          HEAP32[y >> 2] += HEAPU8[n + (p << 4)];
          HEAP32[y >> 2] += HEAPU8[n + (p << 5)];
          HEAP32[y >> 2] += HEAPU8[n + p * 48];
          n += p << 6;
          HEAP32[y + 4 >> 2] = HEAPU8[n];
          HEAP32[y + 4 >> 2] += HEAPU8[n + (p << 4)];
          HEAP32[y + 4 >> 2] += HEAPU8[n + (p << 5)];
          HEAP32[y + 4 >> 2] += HEAPU8[n + p * 48];
          n += p << 6;
          HEAP32[y + 8 >> 2] = HEAPU8[n];
          HEAP32[y + 8 >> 2] += HEAPU8[n + (p << 4)];
          HEAP32[y + 8 >> 2] += HEAPU8[n + (p << 5)];
          HEAP32[y + 8 >> 2] += HEAPU8[n + p * 48];
          n += p << 6;
          HEAP32[y + 12 >> 2] = HEAPU8[n];
          HEAP32[y + 12 >> 2] += HEAPU8[n + (p << 4)];
          HEAP32[y + 12 >> 2] += HEAPU8[n + (p << 5)];
          HEAP32[y + 12 >> 2] += HEAPU8[n + p * 48];
          l += 1;
          o += 1;
          HEAP32[t >> 2] = HEAP32[y + 4 >> 2] + HEAP32[y >> 2] + HEAP32[y + 8 >> 2] + HEAP32[y + 12 >> 2] + HEAP32[t >> 2];
          HEAP32[t + 16 >> 2] = HEAP32[y + 4 >> 2] + HEAP32[y >> 2] + -HEAP32[y + 8 >> 2] + -HEAP32[y + 12 >> 2] + HEAP32[t + 16 >> 2]
        }
      }while(0);
      h = m != 0 ? 22 : 18;
      b:do {
        if(h == 18) {
          h = F != 0 ? 19 : 21;
          c:do {
            if(h == 19) {
              if(H == 0) {
                h = 21;
                break c
              }
              HEAP32[t + 4 >> 2] = HEAP32[w + 4 >> 2] + HEAP32[w >> 2] + HEAP32[w + 8 >> 2] + HEAP32[w + 12 >> 2] + -HEAP32[y >> 2] + -HEAP32[y + 4 >> 2] + -HEAP32[y + 8 >> 2] + -HEAP32[y + 12 >> 2] >> 5;
              h = 23;
              break b
            }
          }while(0);
          h = m != 0 ? 22 : 23;
          break b
        }
      }while(0);
      h == 22 && (HEAP32[t + 4 >> 2] >>= m + 3);
      h = o != 0 ? 28 : 24;
      b:do {
        if(h == 24) {
          h = D != 0 ? 25 : 27;
          c:do {
            if(h == 25) {
              if(E == 0) {
                h = 27;
                break c
              }
              HEAP32[t + 16 >> 2] = HEAP32[u + 4 >> 2] + HEAP32[u >> 2] + HEAP32[u + 8 >> 2] + HEAP32[u + 12 >> 2] + -HEAP32[x >> 2] + -HEAP32[x + 4 >> 2] + -HEAP32[x + 8 >> 2] + -HEAP32[x + 12 >> 2] >> 5;
              h = 29;
              break b
            }
          }while(0);
          h = o != 0 ? 28 : 29;
          break b
        }
      }while(0);
      h == 28 && (HEAP32[t + 16 >> 2] >>= o + 3);
      h = l == 1 ? 30 : l == 2 ? 31 : l == 3 ? 32 : 33;
      h == 33 ? HEAP32[t >> 2] >>= 6 : h == 30 ? HEAP32[t >> 2] >>= 4 : h == 31 ? HEAP32[t >> 2] >>= 5 : h == 32 && (HEAP32[t >> 2] = HEAP32[t >> 2] * 21 >> 10);
      _Transform(t);
      j = 0;
      n = g;
      v = t;
      b:for(;;) {
        s = HEAP32[v + ((j & 15) >>> 2 << 2) >> 2];
        if(HEAP32[v + ((j & 15) >>> 2 << 2) >> 2] < 0) {
          var qa = 0;
          h = 37
        }else {
          h = 36
        }
        h == 36 && (qa = s > 255 ? 255 : s);
        var ra = n;
        n = ra + 1;
        HEAP8[ra] = qa & 255;
        j += 1;
        if((j & 63) != 0) {
          var sa = j;
          h = 39
        }else {
          h = 38
        }
        h == 38 && (v += 16, sa = j);
        if(!(sa < 256)) {
          h = 40;
          break b
        }
      }
      q = HEAP32[b >> 2] + (p << 8) * r + (d << 6) * p + (c << 3);
      k = 0;
      var Va = t, Wa = u, Xa = u, Ya = u + 4, Za = u + 4, $a = u + 8, ab = u + 8, bb = u + 12, cb = u + 12, db = u, eb = u + 4, fb = u + 8, gb = u + 12, ta = t, hb = u, ib = u + 4, jb = u + 8, kb = u + 12, ua = t + 4, lb = x, mb = x, nb = x + 4, ob = x + 4, pb = x + 8, qb = x + 8, rb = x + 12, sb = x + 12, tb = x, ub = x + 4, vb = x + 8, wb = x + 12, va = t, xb = x, yb = x + 4, zb = x + 8, Ab = x + 12, wa = t + 4, Bb = w, Cb = w, Db = w + 4, Eb = w + 4, Fb = w + 8, Gb = w + 8, Hb = w + 12, Ib = w + 
      12, Jb = w, Kb = w + 4, Lb = w + 8, Mb = w + 12, xa = t, Nb = w, Ob = w + 4, Pb = w + 8, Qb = w + 12, ya = t + 16, Rb = y, Sb = y, Tb = y + 4, Ub = y + 4, Vb = y + 8, Wb = y + 8, Xb = y + 12, Yb = y + 12, Zb = y, $b = y + 4, ac = y + 8, bc = y + 12, za = t, cc = y, dc = y + 4, ec = y + 8, fc = y + 12, Aa = t + 16, gc = t + 4, hc = t + 16, ic = t, jc = t, kc = g + 256, lc = t, mc = t, nc = t, oc = t, pc = t, qc = u, rc = u + 4, sc = u + 8, tc = u + 12, uc = x, vc = x + 4, wc = x + 8, xc = x + 
      12, yc = t + 16, zc = w, Ac = w + 4, Bc = w + 8, Cc = w + 12, Dc = y, Ec = y + 4, Fc = y + 8, Gc = y + 12, Hc = t + 4;
      b:for(;;) {
        _H264SwDecMemset(Va, 0, 64);
        m = o = l = 0;
        h = D != 0 ? 42 : 43;
        if(h == 42) {
          var Ba = n = q + p * -8;
          n = Ba + 1;
          HEAP32[Wa >> 2] = HEAPU8[Ba];
          var Ca = n;
          n = Ca + 1;
          HEAP32[Xa >> 2] += HEAPU8[Ca];
          var Da = n;
          n = Da + 1;
          HEAP32[Ya >> 2] = HEAPU8[Da];
          var Ea = n;
          n = Ea + 1;
          HEAP32[Za >> 2] += HEAPU8[Ea];
          var Fa = n;
          n = Fa + 1;
          HEAP32[$a >> 2] = HEAPU8[Fa];
          var Ga = n;
          n = Ga + 1;
          HEAP32[ab >> 2] += HEAPU8[Ga];
          var Ha = n;
          n = Ha + 1;
          HEAP32[bb >> 2] = HEAPU8[Ha];
          var Ia = n;
          n = Ia + 1;
          HEAP32[cb >> 2] += HEAPU8[Ia];
          l += 1;
          m += 1;
          HEAP32[ta >> 2] = HEAP32[eb >> 2] + HEAP32[db >> 2] + HEAP32[fb >> 2] + HEAP32[gb >> 2] + HEAP32[ta >> 2];
          HEAP32[ua >> 2] = HEAP32[ib >> 2] + HEAP32[hb >> 2] + -HEAP32[jb >> 2] + -HEAP32[kb >> 2] + HEAP32[ua >> 2]
        }
        h = E != 0 ? 44 : 45;
        if(h == 44) {
          var Ja = n = q + (p << 6);
          n = Ja + 1;
          HEAP32[lb >> 2] = HEAPU8[Ja];
          var Ka = n;
          n = Ka + 1;
          HEAP32[mb >> 2] += HEAPU8[Ka];
          var La = n;
          n = La + 1;
          HEAP32[nb >> 2] = HEAPU8[La];
          var Ma = n;
          n = Ma + 1;
          HEAP32[ob >> 2] += HEAPU8[Ma];
          var Na = n;
          n = Na + 1;
          HEAP32[pb >> 2] = HEAPU8[Na];
          var Oa = n;
          n = Oa + 1;
          HEAP32[qb >> 2] += HEAPU8[Oa];
          var Pa = n;
          n = Pa + 1;
          HEAP32[rb >> 2] = HEAPU8[Pa];
          var Qa = n;
          n = Qa + 1;
          HEAP32[sb >> 2] += HEAPU8[Qa];
          l += 1;
          m += 1;
          HEAP32[va >> 2] = HEAP32[ub >> 2] + HEAP32[tb >> 2] + HEAP32[vb >> 2] + HEAP32[wb >> 2] + HEAP32[va >> 2];
          HEAP32[wa >> 2] = HEAP32[yb >> 2] + HEAP32[xb >> 2] + -HEAP32[zb >> 2] + -HEAP32[Ab >> 2] + HEAP32[wa >> 2]
        }
        h = F != 0 ? 46 : 47;
        h == 46 && (n = q - 1, HEAP32[Bb >> 2] = HEAPU8[n], HEAP32[Cb >> 2] += HEAPU8[n + (p << 3)], n += p << 4, HEAP32[Db >> 2] = HEAPU8[n], HEAP32[Eb >> 2] += HEAPU8[n + (p << 3)], n += p << 4, HEAP32[Fb >> 2] = HEAPU8[n], HEAP32[Gb >> 2] += HEAPU8[n + (p << 3)], n += p << 4, HEAP32[Hb >> 2] = HEAPU8[n], HEAP32[Ib >> 2] += HEAPU8[n + (p << 3)], l += 1, o += 1, HEAP32[xa >> 2] = HEAP32[Kb >> 2] + HEAP32[Jb >> 2] + HEAP32[Lb >> 2] + HEAP32[Mb >> 2] + HEAP32[xa >> 2], HEAP32[ya >> 2] = HEAP32[Ob >> 
        2] + HEAP32[Nb >> 2] + -HEAP32[Pb >> 2] + -HEAP32[Qb >> 2] + HEAP32[ya >> 2]);
        h = H != 0 ? 48 : 49;
        h == 48 && (n = q + 8, HEAP32[Rb >> 2] = HEAPU8[n], HEAP32[Sb >> 2] += HEAPU8[n + (p << 3)], n += p << 4, HEAP32[Tb >> 2] = HEAPU8[n], HEAP32[Ub >> 2] += HEAPU8[n + (p << 3)], n += p << 4, HEAP32[Vb >> 2] = HEAPU8[n], HEAP32[Wb >> 2] += HEAPU8[n + (p << 3)], n += p << 4, HEAP32[Xb >> 2] = HEAPU8[n], HEAP32[Yb >> 2] += HEAPU8[n + (p << 3)], l += 1, o += 1, HEAP32[za >> 2] = HEAP32[$b >> 2] + HEAP32[Zb >> 2] + HEAP32[ac >> 2] + HEAP32[bc >> 2] + HEAP32[za >> 2], HEAP32[Aa >> 2] = HEAP32[dc >> 
        2] + HEAP32[cc >> 2] + -HEAP32[ec >> 2] + -HEAP32[fc >> 2] + HEAP32[Aa >> 2]);
        h = m != 0 ? 54 : 50;
        c:do {
          if(h == 50) {
            h = F != 0 ? 51 : 53;
            d:do {
              if(h == 51) {
                if(H == 0) {
                  h = 53;
                  break d
                }
                HEAP32[Hc >> 2] = HEAP32[Ac >> 2] + HEAP32[zc >> 2] + HEAP32[Bc >> 2] + HEAP32[Cc >> 2] + -HEAP32[Dc >> 2] + -HEAP32[Ec >> 2] + -HEAP32[Fc >> 2] + -HEAP32[Gc >> 2] >> 4;
                h = 55;
                break c
              }
            }while(0);
            h = m != 0 ? 54 : 55;
            break c
          }
        }while(0);
        h == 54 && (HEAP32[gc >> 2] >>= m + 2);
        h = o != 0 ? 60 : 56;
        c:do {
          if(h == 56) {
            h = D != 0 ? 57 : 59;
            d:do {
              if(h == 57) {
                if(E == 0) {
                  h = 59;
                  break d
                }
                HEAP32[yc >> 2] = HEAP32[rc >> 2] + HEAP32[qc >> 2] + HEAP32[sc >> 2] + HEAP32[tc >> 2] + -HEAP32[uc >> 2] + -HEAP32[vc >> 2] + -HEAP32[wc >> 2] + -HEAP32[xc >> 2] >> 4;
                h = 61;
                break c
              }
            }while(0);
            h = o != 0 ? 60 : 61;
            break c
          }
        }while(0);
        h == 60 && (HEAP32[hc >> 2] >>= o + 2);
        h = l == 1 ? 62 : l == 2 ? 63 : l == 3 ? 64 : 65;
        h == 65 ? HEAP32[ic >> 2] >>= 5 : h == 62 ? HEAP32[mc >> 2] >>= 3 : h == 63 ? HEAP32[nc >> 2] >>= 4 : h == 64 && (HEAP32[pc >> 2] = HEAP32[oc >> 2] * 21 >> 9);
        _Transform(jc);
        n = kc + (k << 6);
        j = 0;
        v = lc;
        c:for(;;) {
          s = HEAP32[v + ((j & 7) >>> 1 << 2) >> 2];
          if(HEAP32[v + ((j & 7) >>> 1 << 2) >> 2] < 0) {
            var Ra = 0;
            h = 69
          }else {
            h = 68
          }
          h == 68 && (Ra = s > 255 ? 255 : s);
          var Sa = n;
          n = Sa + 1;
          HEAP8[Sa] = Ra & 255;
          j += 1;
          if((j & 15) != 0) {
            var Ta = j;
            h = 71
          }else {
            h = 70
          }
          h == 70 && (v += 16, Ta = j);
          if(!(Ta < 64)) {
            h = 72;
            break c
          }
        }
        q += (p << 6) * r;
        var Ua = k + 1;
        k = Ua;
        if(!(Ua < 2)) {
          h = 73;
          break b
        }
      }
      _h264bsdWriteMacroblock(b, g)
    }
  }while(0);
  STACKTOP = g
}
_ConcealMb.X = 1;
function _Transform(a) {
  var b, d, c, e;
  b = HEAP32[a + 4 >> 2] != 0 ? 3 : 1;
  a:do {
    if(b == 1) {
      if(HEAP32[a + 16 >> 2] != 0) {
        b = 3;
        break a
      }
      b = HEAP32[a >> 2];
      HEAP32[a + 60 >> 2] = b;
      HEAP32[a + 56 >> 2] = b;
      HEAP32[a + 52 >> 2] = b;
      HEAP32[a + 48 >> 2] = b;
      HEAP32[a + 44 >> 2] = b;
      HEAP32[a + 40 >> 2] = b;
      HEAP32[a + 36 >> 2] = b;
      HEAP32[a + 32 >> 2] = b;
      HEAP32[a + 28 >> 2] = b;
      HEAP32[a + 24 >> 2] = b;
      HEAP32[a + 20 >> 2] = b;
      HEAP32[a + 16 >> 2] = b;
      HEAP32[a + 12 >> 2] = b;
      HEAP32[a + 8 >> 2] = b;
      HEAP32[a + 4 >> 2] = b;
      b = 5;
      break a
    }
  }while(0);
  a:do {
    if(b == 3) {
      c = HEAP32[a >> 2];
      e = HEAP32[a + 4 >> 2];
      HEAP32[a >> 2] = e + c;
      HEAP32[a + 4 >> 2] = (e >> 1) + c;
      HEAP32[a + 8 >> 2] = c - (e >> 1);
      HEAP32[a + 12 >> 2] = c - e;
      c = HEAP32[a + 16 >> 2];
      HEAP32[a + 20 >> 2] = c;
      HEAP32[a + 24 >> 2] = c;
      HEAP32[a + 28 >> 2] = c;
      d = 3;
      for(;;) {
        if(c = HEAP32[a >> 2], e = HEAP32[a + 16 >> 2], HEAP32[a >> 2] = e + c, HEAP32[a + 16 >> 2] = (e >> 1) + c, HEAP32[a + 32 >> 2] = c - (e >> 1), HEAP32[a + 48 >> 2] = c - e, a += 4, c = d, d = c - 1, c == 0) {
          break a
        }
      }
    }
  }while(0)
}
_Transform.X = 1;
function _h264bsdDecodeVuiParameters(a, b) {
  var d, c, e;
  _H264SwDecMemset(b, 0, 952);
  e = _h264bsdGetBits(a, 1);
  d = e == -1 ? 1 : 2;
  a:do {
    if(d == 1) {
      c = 1
    }else {
      if(d == 2) {
        HEAP32[b >> 2] = e == 1 ? 1 : 0;
        d = HEAP32[b >> 2] != 0 ? 3 : 11;
        b:do {
          if(d == 3) {
            e = _h264bsdGetBits(a, 8);
            d = e == -1 ? 4 : 5;
            do {
              if(d == 4) {
                c = 1;
                break a
              }else {
                if(d == 5) {
                  HEAP32[b + 4 >> 2] = e;
                  if(HEAP32[b + 4 >> 2] != 255) {
                    break b
                  }
                  e = _h264bsdGetBits(a, 16);
                  d = e == -1 ? 7 : 8;
                  do {
                    if(d == 7) {
                      c = 1;
                      break a
                    }else {
                      if(d == 8) {
                        HEAP32[b + 8 >> 2] = e;
                        e = _h264bsdGetBits(a, 16);
                        d = e == -1 ? 9 : 10;
                        do {
                          if(d == 9) {
                            c = 1;
                            break a
                          }else {
                            d == 10 && (HEAP32[b + 12 >> 2] = e)
                          }
                        }while(0)
                      }
                    }
                  }while(0)
                }
              }
            }while(0)
          }
        }while(0);
        e = d = _h264bsdGetBits(a, 1);
        d = d == -1 ? 12 : 13;
        do {
          if(d == 12) {
            c = 1
          }else {
            if(d == 13) {
              HEAP32[b + 16 >> 2] = e == 1 ? 1 : 0;
              d = HEAP32[b + 16 >> 2] != 0 ? 14 : 17;
              do {
                if(d == 14) {
                  e = _h264bsdGetBits(a, 1);
                  d = e == -1 ? 15 : 16;
                  do {
                    if(d == 15) {
                      c = 1;
                      break a
                    }else {
                      d == 16 && (HEAP32[b + 20 >> 2] = e == 1 ? 1 : 0)
                    }
                  }while(0)
                }
              }while(0);
              e = d = _h264bsdGetBits(a, 1);
              d = d == -1 ? 18 : 19;
              do {
                if(d == 18) {
                  c = 1
                }else {
                  if(d == 19) {
                    HEAP32[b + 24 >> 2] = e == 1 ? 1 : 0;
                    d = HEAP32[b + 24 >> 2] != 0 ? 20 : 35;
                    do {
                      if(d == 20) {
                        e = _h264bsdGetBits(a, 3);
                        d = e == -1 ? 21 : 22;
                        do {
                          if(d == 21) {
                            c = 1;
                            break a
                          }else {
                            if(d == 22) {
                              HEAP32[b + 28 >> 2] = e;
                              e = _h264bsdGetBits(a, 1);
                              d = e == -1 ? 23 : 24;
                              do {
                                if(d == 23) {
                                  c = 1;
                                  break a
                                }else {
                                  if(d == 24) {
                                    HEAP32[b + 32 >> 2] = e == 1 ? 1 : 0;
                                    e = _h264bsdGetBits(a, 1);
                                    d = e == -1 ? 25 : 26;
                                    do {
                                      if(d == 25) {
                                        c = 1;
                                        break a
                                      }else {
                                        if(d == 26) {
                                          HEAP32[b + 36 >> 2] = e == 1 ? 1 : 0;
                                          d = HEAP32[b + 36 >> 2] != 0 ? 27 : 34;
                                          do {
                                            if(d == 27) {
                                              e = _h264bsdGetBits(a, 8);
                                              d = e == -1 ? 28 : 29;
                                              do {
                                                if(d == 28) {
                                                  c = 1;
                                                  break a
                                                }else {
                                                  if(d == 29) {
                                                    HEAP32[b + 40 >> 2] = e;
                                                    e = _h264bsdGetBits(a, 8);
                                                    d = e == -1 ? 30 : 31;
                                                    do {
                                                      if(d == 30) {
                                                        c = 1;
                                                        break a
                                                      }else {
                                                        if(d == 31) {
                                                          HEAP32[b + 44 >> 2] = e;
                                                          e = _h264bsdGetBits(a, 8);
                                                          d = e == -1 ? 32 : 33;
                                                          do {
                                                            if(d == 32) {
                                                              c = 1;
                                                              break a
                                                            }else {
                                                              d == 33 && (HEAP32[b + 48 >> 2] = e)
                                                            }
                                                          }while(0)
                                                        }
                                                      }
                                                    }while(0)
                                                  }
                                                }
                                              }while(0)
                                            }else {
                                              d == 34 && (HEAP32[b + 40 >> 2] = 2, HEAP32[b + 44 >> 2] = 2, HEAP32[b + 48 >> 2] = 2)
                                            }
                                          }while(0)
                                        }
                                      }
                                    }while(0)
                                  }
                                }
                              }while(0)
                            }
                          }
                        }while(0)
                      }else {
                        d == 35 && (HEAP32[b + 28 >> 2] = 5, HEAP32[b + 40 >> 2] = 2, HEAP32[b + 44 >> 2] = 2, HEAP32[b + 48 >> 2] = 2)
                      }
                    }while(0);
                    e = d = _h264bsdGetBits(a, 1);
                    d = d == -1 ? 37 : 38;
                    do {
                      if(d == 37) {
                        c = 1
                      }else {
                        if(d == 38) {
                          HEAP32[b + 52 >> 2] = e == 1 ? 1 : 0;
                          d = HEAP32[b + 52 >> 2] != 0 ? 39 : 47;
                          e:do {
                            if(d == 39) {
                              e = _h264bsdDecodeExpGolombUnsigned(a, b + 56);
                              d = e != 0 ? 40 : 41;
                              do {
                                if(d == 40) {
                                  c = e;
                                  break a
                                }else {
                                  if(d == 41) {
                                    d = HEAPU32[b + 56 >> 2] > 5 ? 42 : 43;
                                    do {
                                      if(d == 42) {
                                        c = 1;
                                        break a
                                      }else {
                                        if(d == 43) {
                                          e = _h264bsdDecodeExpGolombUnsigned(a, b + 60);
                                          d = e != 0 ? 44 : 45;
                                          do {
                                            if(d == 44) {
                                              c = e;
                                              break a
                                            }else {
                                              if(d == 45) {
                                                if(!(HEAPU32[b + 60 >> 2] > 5)) {
                                                  break e
                                                }
                                                c = 1;
                                                break a
                                              }
                                            }
                                          }while(0)
                                        }
                                      }
                                    }while(0)
                                  }
                                }
                              }while(0)
                            }
                          }while(0);
                          e = d = _h264bsdGetBits(a, 1);
                          d = d == -1 ? 48 : 49;
                          do {
                            if(d == 48) {
                              c = 1
                            }else {
                              if(d == 49) {
                                HEAP32[b + 64 >> 2] = e == 1 ? 1 : 0;
                                d = HEAP32[b + 64 >> 2] != 0 ? 50 : 61;
                                do {
                                  if(d == 50) {
                                    e = _h264bsdShowBits32(a);
                                    d = _h264bsdFlushBits(a, 32) == -1 ? 51 : 52;
                                    do {
                                      if(d == 51) {
                                        c = 1;
                                        break a
                                      }else {
                                        if(d == 52) {
                                          d = e == 0 ? 53 : 54;
                                          do {
                                            if(d == 53) {
                                              c = 1;
                                              break a
                                            }else {
                                              if(d == 54) {
                                                HEAP32[b + 68 >> 2] = e;
                                                e = _h264bsdShowBits32(a);
                                                d = _h264bsdFlushBits(a, 32) == -1 ? 55 : 56;
                                                do {
                                                  if(d == 55) {
                                                    c = 1;
                                                    break a
                                                  }else {
                                                    if(d == 56) {
                                                      d = e == 0 ? 57 : 58;
                                                      do {
                                                        if(d == 57) {
                                                          c = 1;
                                                          break a
                                                        }else {
                                                          if(d == 58) {
                                                            HEAP32[b + 72 >> 2] = e;
                                                            e = _h264bsdGetBits(a, 1);
                                                            d = e == -1 ? 59 : 60;
                                                            do {
                                                              if(d == 59) {
                                                                c = 1;
                                                                break a
                                                              }else {
                                                                d == 60 && (HEAP32[b + 76 >> 2] = e == 1 ? 1 : 0)
                                                              }
                                                            }while(0)
                                                          }
                                                        }
                                                      }while(0)
                                                    }
                                                  }
                                                }while(0)
                                              }
                                            }
                                          }while(0)
                                        }
                                      }
                                    }while(0)
                                  }
                                }while(0);
                                e = d = _h264bsdGetBits(a, 1);
                                d = d == -1 ? 62 : 63;
                                do {
                                  if(d == 62) {
                                    c = 1
                                  }else {
                                    if(d == 63) {
                                      HEAP32[b + 80 >> 2] = e == 1 ? 1 : 0;
                                      d = HEAP32[b + 80 >> 2] != 0 ? 64 : 66;
                                      g:do {
                                        if(d == 64) {
                                          e = _DecodeHrdParameters(a, b + 84);
                                          if(e == 0) {
                                            break g
                                          }
                                          c = e;
                                          break a
                                        }else {
                                          d == 66 && (HEAP32[b + 84 >> 2] = 1, HEAP32[b + 96 >> 2] = 288000001, HEAP32[b + 224 >> 2] = 288000001, HEAP32[b + 480 >> 2] = 24, HEAP32[b + 484 >> 2] = 24, HEAP32[b + 488 >> 2] = 24, HEAP32[b + 492 >> 2] = 24)
                                        }
                                      }while(0);
                                      e = d = _h264bsdGetBits(a, 1);
                                      d = d == -1 ? 68 : 69;
                                      do {
                                        if(d == 68) {
                                          c = 1
                                        }else {
                                          if(d == 69) {
                                            HEAP32[b + 496 >> 2] = e == 1 ? 1 : 0;
                                            d = HEAP32[b + 496 >> 2] != 0 ? 70 : 72;
                                            h:do {
                                              if(d == 70) {
                                                e = _DecodeHrdParameters(a, b + 500);
                                                if(e == 0) {
                                                  break h
                                                }
                                                c = e;
                                                break a
                                              }else {
                                                d == 72 && (HEAP32[b + 500 >> 2] = 1, HEAP32[b + 512 >> 2] = 240000001, HEAP32[b + 640 >> 2] = 240000001, HEAP32[b + 896 >> 2] = 24, HEAP32[b + 900 >> 2] = 24, HEAP32[b + 904 >> 2] = 24, HEAP32[b + 908 >> 2] = 24)
                                              }
                                            }while(0);
                                            d = HEAP32[b + 80 >> 2] != 0 ? 75 : 74;
                                            h:do {
                                              if(d == 74) {
                                                d = HEAP32[b + 496 >> 2] != 0 ? 75 : 78;
                                                break h
                                              }
                                            }while(0);
                                            do {
                                              if(d == 75) {
                                                e = d = _h264bsdGetBits(a, 1);
                                                d = d == -1 ? 76 : 77;
                                                do {
                                                  if(d == 76) {
                                                    c = 1;
                                                    break a
                                                  }else {
                                                    d == 77 && (HEAP32[b + 912 >> 2] = e == 1 ? 1 : 0)
                                                  }
                                                }while(0)
                                              }
                                            }while(0);
                                            e = d = _h264bsdGetBits(a, 1);
                                            d = d == -1 ? 79 : 80;
                                            do {
                                              if(d == 79) {
                                                c = 1
                                              }else {
                                                if(d == 80) {
                                                  HEAP32[b + 916 >> 2] = e == 1 ? 1 : 0;
                                                  e = _h264bsdGetBits(a, 1);
                                                  d = e == -1 ? 81 : 82;
                                                  do {
                                                    if(d == 81) {
                                                      c = 1
                                                    }else {
                                                      if(d == 82) {
                                                        HEAP32[b + 920 >> 2] = e == 1 ? 1 : 0;
                                                        d = HEAP32[b + 920 >> 2] != 0 ? 83 : 105;
                                                        j:do {
                                                          if(d == 83) {
                                                            e = _h264bsdGetBits(a, 1);
                                                            d = e == -1 ? 84 : 85;
                                                            do {
                                                              if(d == 84) {
                                                                c = 1;
                                                                break a
                                                              }else {
                                                                if(d == 85) {
                                                                  HEAP32[b + 924 >> 2] = e == 1 ? 1 : 0;
                                                                  e = _h264bsdDecodeExpGolombUnsigned(a, b + 928);
                                                                  d = e != 0 ? 86 : 87;
                                                                  do {
                                                                    if(d == 86) {
                                                                      c = e;
                                                                      break a
                                                                    }else {
                                                                      if(d == 87) {
                                                                        d = HEAPU32[b + 928 >> 2] > 16 ? 88 : 89;
                                                                        do {
                                                                          if(d == 88) {
                                                                            c = 1;
                                                                            break a
                                                                          }else {
                                                                            if(d == 89) {
                                                                              e = _h264bsdDecodeExpGolombUnsigned(a, b + 932);
                                                                              d = e != 0 ? 90 : 91;
                                                                              do {
                                                                                if(d == 90) {
                                                                                  c = e;
                                                                                  break a
                                                                                }else {
                                                                                  if(d == 91) {
                                                                                    d = HEAPU32[b + 932 >> 2] > 16 ? 92 : 93;
                                                                                    do {
                                                                                      if(d == 92) {
                                                                                        c = 1;
                                                                                        break a
                                                                                      }else {
                                                                                        if(d == 93) {
                                                                                          e = _h264bsdDecodeExpGolombUnsigned(a, b + 936);
                                                                                          d = e != 0 ? 94 : 95;
                                                                                          do {
                                                                                            if(d == 94) {
                                                                                              c = e;
                                                                                              break a
                                                                                            }else {
                                                                                              if(d == 95) {
                                                                                                d = HEAPU32[b + 936 >> 2] > 16 ? 96 : 97;
                                                                                                do {
                                                                                                  if(d == 96) {
                                                                                                    c = 1;
                                                                                                    break a
                                                                                                  }else {
                                                                                                    if(d == 97) {
                                                                                                      e = _h264bsdDecodeExpGolombUnsigned(a, b + 940);
                                                                                                      d = e != 0 ? 98 : 99;
                                                                                                      do {
                                                                                                        if(d == 98) {
                                                                                                          c = e;
                                                                                                          break a
                                                                                                        }else {
                                                                                                          if(d == 99) {
                                                                                                            d = HEAPU32[b + 940 >> 2] > 16 ? 100 : 101;
                                                                                                            do {
                                                                                                              if(d == 100) {
                                                                                                                c = 1;
                                                                                                                break a
                                                                                                              }else {
                                                                                                                if(d == 101) {
                                                                                                                  e = _h264bsdDecodeExpGolombUnsigned(a, b + 944);
                                                                                                                  d = e != 0 ? 102 : 103;
                                                                                                                  do {
                                                                                                                    if(d == 102) {
                                                                                                                      c = e;
                                                                                                                      break a
                                                                                                                    }else {
                                                                                                                      if(d == 103) {
                                                                                                                        e = _h264bsdDecodeExpGolombUnsigned(a, b + 948);
                                                                                                                        if(e == 0) {
                                                                                                                          d = 106;
                                                                                                                          break j
                                                                                                                        }
                                                                                                                        c = e;
                                                                                                                        break a
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }while(0)
                                                                                                                }
                                                                                                              }
                                                                                                            }while(0)
                                                                                                          }
                                                                                                        }
                                                                                                      }while(0)
                                                                                                    }
                                                                                                  }
                                                                                                }while(0)
                                                                                              }
                                                                                            }
                                                                                          }while(0)
                                                                                        }
                                                                                      }
                                                                                    }while(0)
                                                                                  }
                                                                                }
                                                                              }while(0)
                                                                            }
                                                                          }
                                                                        }while(0)
                                                                      }
                                                                    }
                                                                  }while(0)
                                                                }
                                                              }
                                                            }while(0)
                                                          }else {
                                                            d == 105 && (HEAP32[b + 924 >> 2] = 1, HEAP32[b + 928 >> 2] = 2, HEAP32[b + 932 >> 2] = 1, HEAP32[b + 936 >> 2] = 16, HEAP32[b + 940 >> 2] = 16, HEAP32[b + 944 >> 2] = 16, HEAP32[b + 948 >> 2] = 16)
                                                          }
                                                        }while(0);
                                                        c = 0
                                                      }
                                                    }
                                                  }while(0)
                                                }
                                              }
                                            }while(0)
                                          }
                                        }
                                      }while(0)
                                    }
                                  }
                                }while(0)
                              }
                            }
                          }while(0)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  return c
}
_h264bsdDecodeVuiParameters.X = 1;
function _h264bsdDecodePicOrderCnt(a, b, d, c) {
  var e, f, g, h, j, l, k, m, o;
  o = 0;
  e = HEAP32[d + 284 >> 2] != 0 ? 1 : 6;
  a:do {
    if(e == 1) {
      f = 0;
      b:for(;;) {
        if(HEAP32[d + 288 + f * 20 >> 2] == 0) {
          break a
        }
        if(HEAP32[d + 288 + f * 20 >> 2] == 5) {
          e = 4;
          break b
        }
        f += 1
      }
      o = 1
    }
  }while(0);
  e = HEAP32[b + 16 >> 2];
  e = e == 0 ? 7 : e == 1 ? 27 : 53;
  a:do {
    if(e == 53) {
      e = HEAP32[c >> 2] == 5 ? 54 : 55, e == 54 ? h = 0 : e == 55 && (f = HEAP32[a + 12 >> 2], e = HEAPU32[a + 8 >> 2] > HEAPU32[d + 12 >> 2] ? 56 : 57, e == 56 ? h = HEAP32[b + 12 >> 2] + f : e == 57 && (h = f)), e = HEAP32[c >> 2] == 5 ? 59 : 60, e == 59 ? g = 0 : e == 60 && (f = HEAP32[d + 12 >> 2] + h << 1, e = HEAP32[c + 4 >> 2] == 0 ? 61 : 62, e == 61 ? g = f - 1 : e == 62 && (g = f)), e = o != 0 ? 65 : 64, e == 65 ? (HEAP32[a + 12 >> 2] = 0, g = HEAP32[a + 8 >> 2] = 0) : e == 64 && (HEAP32[a + 
      12 >> 2] = h, HEAP32[a + 8 >> 2] = HEAP32[d + 12 >> 2])
    }else {
      if(e == 7) {
        e = HEAP32[c >> 2] == 5 ? 8 : 9;
        e == 8 && (HEAP32[a + 4 >> 2] = 0, HEAP32[a >> 2] = 0);
        e = HEAPU32[d + 20 >> 2] < HEAPU32[a >> 2] ? 10 : 12;
        b:do {
          if(e == 10) {
            if(!(HEAP32[a >> 2] - HEAP32[d + 20 >> 2] >= Math.floor(HEAPU32[b + 20 >> 2] / 2))) {
              e = 12;
              break b
            }
            g = HEAP32[b + 20 >> 2] + HEAP32[a + 4 >> 2];
            e = 16;
            break b
          }
        }while(0);
        b:do {
          if(e == 12) {
            e = HEAPU32[d + 20 >> 2] > HEAPU32[a >> 2] ? 13 : 15;
            c:do {
              if(e == 13) {
                if(!(HEAP32[d + 20 >> 2] - HEAP32[a >> 2] > Math.floor(HEAPU32[b + 20 >> 2] / 2))) {
                  e = 15;
                  break c
                }
                g = HEAP32[a + 4 >> 2] - HEAP32[b + 20 >> 2];
                break b
              }
            }while(0);
            g = HEAP32[a + 4 >> 2]
          }
        }while(0);
        e = HEAP32[c + 4 >> 2] != 0 ? 17 : 18;
        e == 17 && (HEAP32[a + 4 >> 2] = g);
        g += HEAP32[d + 20 >> 2];
        e = HEAP32[d + 24 >> 2] < 0 ? 19 : 20;
        e == 19 && (g += HEAP32[d + 24 >> 2]);
        if(HEAP32[c + 4 >> 2] == 0) {
          break a
        }
        e = o != 0 ? 22 : 26;
        e == 22 ? (HEAP32[a + 4 >> 2] = 0, e = HEAP32[d + 24 >> 2] < 0 ? 23 : 24, e == 23 ? HEAP32[a >> 2] = -HEAP32[d + 24 >> 2] : e == 24 && (HEAP32[a >> 2] = 0), g = 0) : e == 26 && (HEAP32[a >> 2] = HEAP32[d + 20 >> 2])
      }else {
        if(e == 27) {
          e = HEAP32[c >> 2] == 5 ? 28 : 29;
          e == 28 ? h = 0 : e == 29 && (f = HEAP32[a + 12 >> 2], e = HEAPU32[a + 8 >> 2] > HEAPU32[d + 12 >> 2] ? 30 : 31, e == 30 ? h = HEAP32[b + 12 >> 2] + f : e == 31 && (h = f));
          e = HEAP32[b + 36 >> 2] != 0 ? 33 : 34;
          if(e == 33) {
            j = HEAP32[d + 12 >> 2] + h;
            var p = HEAP32[d + 12 >> 2] + h
          }else {
            e == 34 && (p = j = 0)
          }
          if(HEAP32[c + 4 >> 2] == 0) {
            e = 36
          }else {
            var r = p;
            e = 38
          }
          b:do {
            if(e == 36) {
              if(!(p > 0)) {
                e = 40;
                break b
              }
              j = r = j - 1;
              e = 38;
              break b
            }
          }while(0);
          b:do {
            if(e == 38) {
              if(!(r > 0)) {
                break b
              }
              l = Math.floor((j - 1) / HEAPU32[b + 36 >> 2]);
              k = (j - 1) % HEAPU32[b + 36 >> 2]
            }
          }while(0);
          f = m = 0;
          e = f < HEAPU32[b + 36 >> 2] ? 41 : 42;
          b:do {
            if(e == 41) {
              for(;;) {
                if(m += HEAP32[HEAP32[b + 40 >> 2] + (f << 2) >> 2], f += 1, !(f < HEAPU32[b + 36 >> 2])) {
                  break b
                }
              }
            }
          }while(0);
          e = j > 0 ? 43 : 45;
          b:do {
            if(e == 43) {
              g = m * l;
              f = 0;
              if(!(f <= k)) {
                break b
              }
              for(;;) {
                if(g += HEAP32[HEAP32[b + 40 >> 2] + (f << 2) >> 2], f += 1, !(f <= k)) {
                  break b
                }
              }
            }else {
              e == 45 && (g = 0)
            }
          }while(0);
          e = HEAP32[c + 4 >> 2] == 0 ? 47 : 48;
          e == 47 && (g += HEAP32[b + 28 >> 2]);
          g += HEAP32[d + 28 >> 2];
          e = HEAP32[d + 32 >> 2] + HEAP32[b + 32 >> 2] < 0 ? 49 : 50;
          e == 49 && (g = HEAP32[d + 32 >> 2] + HEAP32[b + 32 >> 2] + g);
          e = o != 0 ? 52 : 51;
          e == 52 ? (HEAP32[a + 12 >> 2] = 0, g = HEAP32[a + 8 >> 2] = 0) : e == 51 && (HEAP32[a + 12 >> 2] = h, HEAP32[a + 8 >> 2] = HEAP32[d + 12 >> 2])
        }
      }
    }
  }while(0);
  return g
}
_h264bsdDecodePicOrderCnt.X = 1;
function _DecodeHrdParameters(a, b) {
  var d, c, e, f;
  e = _h264bsdDecodeExpGolombUnsigned(a, b);
  d = e != 0 ? 1 : 2;
  do {
    if(d == 1) {
      c = e
    }else {
      if(d == 2) {
        HEAP32[b >> 2] += 1;
        d = HEAPU32[b >> 2] > 32 ? 3 : 4;
        do {
          if(d == 3) {
            c = 1
          }else {
            if(d == 4) {
              e = _h264bsdGetBits(a, 4);
              d = e == -1 ? 5 : 6;
              do {
                if(d == 5) {
                  c = 1
                }else {
                  if(d == 6) {
                    HEAP32[b + 4 >> 2] = e;
                    e = _h264bsdGetBits(a, 4);
                    d = e == -1 ? 7 : 8;
                    do {
                      if(d == 7) {
                        c = 1
                      }else {
                        if(d == 8) {
                          HEAP32[b + 8 >> 2] = e;
                          f = 0;
                          e:for(;;) {
                            var g = a;
                            if(!(f < HEAPU32[b >> 2])) {
                              d = 21;
                              break e
                            }
                            e = _h264bsdDecodeExpGolombUnsigned(g, b + 12 + (f << 2));
                            if(e != 0) {
                              d = 11;
                              break e
                            }
                            if(HEAPU32[b + 12 + (f << 2) >> 2] > 4294967294) {
                              d = 13;
                              break e
                            }
                            HEAP32[b + 12 + (f << 2) >> 2] += 1;
                            HEAP32[b + 12 + (f << 2) >> 2] *= 1 << HEAP32[b + 4 >> 2] + 6;
                            e = _h264bsdDecodeExpGolombUnsigned(a, b + 140 + (f << 2));
                            if(e != 0) {
                              d = 15;
                              break e
                            }
                            if(HEAPU32[b + 140 + (f << 2) >> 2] > 4294967294) {
                              d = 17;
                              break e
                            }
                            HEAP32[b + 140 + (f << 2) >> 2] += 1;
                            HEAP32[b + 140 + (f << 2) >> 2] *= 1 << HEAP32[b + 8 >> 2] + 4;
                            e = _h264bsdGetBits(a, 1);
                            if(e == -1) {
                              d = 19;
                              break e
                            }
                            HEAP32[b + 268 + (f << 2) >> 2] = e == 1 ? 1 : 0;
                            f += 1
                          }
                          d == 21 ? (e = _h264bsdGetBits(g, 5), d = e == -1 ? 22 : 23, d == 22 ? c = 1 : d == 23 && (HEAP32[b + 396 >> 2] = e + 1, e = _h264bsdGetBits(a, 5), d = e == -1 ? 24 : 25, d == 24 ? c = 1 : d == 25 && (HEAP32[b + 400 >> 2] = e + 1, e = _h264bsdGetBits(a, 5), d = e == -1 ? 26 : 27, d == 26 ? c = 1 : d == 27 && (HEAP32[b + 404 >> 2] = e + 1, e = _h264bsdGetBits(a, 5), d = e == -1 ? 28 : 29, d == 28 ? c = 1 : d == 29 && (HEAP32[b + 408 >> 2] = e, c = 0))))) : d == 11 ? c = e : 
                          d == 13 ? c = 1 : d == 15 ? c = e : d == 17 ? c = 1 : d == 19 && (c = 1)
                        }
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }
        }while(0)
      }
    }
  }while(0);
  return c
}
_DecodeHrdParameters.X = 1;
function _h264bsdInit(a, b) {
  var d, c;
  _h264bsdInitStorage(a);
  d = _H264SwDecMalloc(2112);
  HEAP32[a + 3376 >> 2] = d;
  d = HEAP32[a + 3376 >> 2] != 0 ? 2 : 1;
  d == 2 ? ((b != 0 ? 3 : 4) == 3 && (HEAP32[a + 1216 >> 2] = 1), c = 0) : d == 1 && (c = 1);
  return c
}
function _h264bsdDecode(a, b, d, c, e) {
  var f = STACKTOP;
  STACKTOP += 204;
  var g, h, j, l = f + 4, k = f + 12, m = f + 104, o = f + 176;
  j = f + 196;
  var p, r = f + 200;
  p = HEAP32[j >> 2] = 0;
  g = HEAP32[a + 3344 >> 2] != 0 ? 1 : 3;
  a:do {
    if(g == 1) {
      if(b != HEAP32[a + 3348 >> 2]) {
        g = 3;
        break a
      }
      var q = o, n, s;
      g = a + 3356;
      n = g + 20;
      if(q % 4 == g % 4) {
        for(;g % 4 !== 0 && g < n;) {
          HEAP8[q++] = HEAP8[g++]
        }
        g >>= 2;
        q >>= 2;
        for(s = n >> 2;g < s;) {
          HEAP32[q++] = HEAP32[g++]
        }
        g <<= 2;
        q <<= 2
      }
      for(;g < n;) {
        HEAP8[q++] = HEAP8[g++]
      }
      HEAP32[o + 4 >> 2] = HEAP32[o >> 2];
      HEAP32[o + 8 >> 2] = 0;
      HEAP32[o + 16 >> 2] = 0;
      HEAP32[e >> 2] = HEAP32[a + 3352 >> 2];
      g = 6;
      break a
    }
  }while(0);
  a:do {
    if(g == 3) {
      g = _h264bsdExtractNalUnit(b, d, o, e) != 0 ? 4 : 5;
      do {
        if(g == 4) {
          h = 3;
          g = 77;
          break a
        }else {
          if(g == 5) {
            g = o;
            q = a + 3356;
            n = g + 20;
            if(q % 4 == g % 4) {
              for(;g % 4 !== 0 && g < n;) {
                HEAP8[q++] = HEAP8[g++]
              }
              g >>= 2;
              q >>= 2;
              for(s = n >> 2;g < s;) {
                HEAP32[q++] = HEAP32[g++]
              }
              g <<= 2;
              q <<= 2
            }
            for(;g < n;) {
              HEAP8[q++] = HEAP8[g++]
            }
            HEAP32[a + 3352 >> 2] = HEAP32[e >> 2];
            HEAP32[a + 3348 >> 2] = b;
            g = 6;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  a:do {
    if(g == 6) {
      HEAP32[a + 3344 >> 2] = 0;
      g = _h264bsdDecodeNalUnit(o, l) != 0 ? 7 : 8;
      do {
        if(g == 7) {
          h = 3
        }else {
          if(g == 8) {
            g = HEAP32[l >> 2] == 0 ? 10 : 9;
            c:do {
              if(g == 9) {
                if(HEAPU32[l >> 2] >= 13) {
                  g = 10;
                  break c
                }
                b = _h264bsdCheckAccessUnitBoundary(o, l, a, j);
                g = b != 0 ? 12 : 15;
                do {
                  if(g == 12) {
                    g = b == 65520 ? 13 : 14;
                    do {
                      if(g == 13) {
                        h = 4;
                        break a
                      }else {
                        if(g == 14) {
                          h = 3;
                          break a
                        }
                      }
                    }while(0)
                  }else {
                    if(g == 15) {
                      g = HEAP32[j >> 2] != 0 ? 16 : 26;
                      do {
                        if(g == 16) {
                          g = HEAP32[a + 1184 >> 2] != 0 ? 17 : 24;
                          f:do {
                            if(g == 17) {
                              if(HEAP32[a + 16 >> 2] == 0) {
                                g = 24;
                                break f
                              }
                              g = HEAP32[a + 3380 >> 2] != 0 ? 19 : 20;
                              do {
                                if(g == 19) {
                                  h = 3;
                                  break a
                                }else {
                                  if(g == 20) {
                                    p = a;
                                    g = HEAP32[a + 1188 >> 2] != 0 ? 22 : 21;
                                    g == 22 ? _h264bsdConceal(p, a + 1336, HEAP32[a + 1372 >> 2]) : g == 21 && (g = _h264bsdAllocateDpbImage(p + 1220), HEAP32[a + 1336 >> 2] = g, _h264bsdInitRefPicList(a + 1220), _h264bsdConceal(a, a + 1336, 0));
                                    p = 1;
                                    HEAP32[e >> 2] = 0;
                                    HEAP32[a + 3344 >> 2] = 1;
                                    g = 25;
                                    break f
                                  }
                                }
                              }while(0)
                            }
                          }while(0);
                          g == 24 && (HEAP32[a + 1188 >> 2] = 0);
                          HEAP32[a + 1180 >> 2] = 0
                        }
                      }while(0);
                      g = p != 0 ? 71 : 27;
                      e:do {
                        if(g == 27) {
                          g = HEAP32[l >> 2];
                          g = g == 7 ? 28 : g == 8 ? 31 : g == 5 ? 34 : g == 1 ? 34 : 70;
                          f:do {
                            if(g == 28) {
                              b = _h264bsdDecodeSeqParamSet(o, k);
                              g = b != 0 ? 29 : 30;
                              do {
                                if(g == 29) {
                                  _H264SwDecFree(HEAP32[k + 40 >> 2]);
                                  HEAP32[k + 40 >> 2] = 0;
                                  _H264SwDecFree(HEAP32[k + 84 >> 2]);
                                  HEAP32[k + 84 >> 2] = 0;
                                  h = 3;
                                  break a
                                }else {
                                  g == 30 && _h264bsdStoreSeqParamSet(a, k)
                                }
                              }while(0)
                            }else {
                              if(g == 31) {
                                b = _h264bsdDecodePicParamSet(o, m);
                                g = b != 0 ? 32 : 33;
                                do {
                                  if(g == 32) {
                                    _H264SwDecFree(HEAP32[m + 20 >> 2]);
                                    HEAP32[m + 20 >> 2] = 0;
                                    _H264SwDecFree(HEAP32[m + 24 >> 2]);
                                    HEAP32[m + 24 >> 2] = 0;
                                    _H264SwDecFree(HEAP32[m + 28 >> 2]);
                                    HEAP32[m + 28 >> 2] = 0;
                                    _H264SwDecFree(HEAP32[m + 44 >> 2]);
                                    HEAP32[m + 44 >> 2] = 0;
                                    h = 3;
                                    break a
                                  }else {
                                    g == 33 && _h264bsdStorePicParamSet(a, m)
                                  }
                                }while(0)
                              }else {
                                if(g == 34) {
                                  g = HEAP32[a + 1180 >> 2] != 0 ? 35 : 36;
                                  do {
                                    if(g == 35) {
                                      h = 0;
                                      break a
                                    }else {
                                      if(g == 36) {
                                        HEAP32[a + 1184 >> 2] = 1;
                                        g = _h264bsdIsStartOfPicture(a) != 0 ? 37 : 55;
                                        h:do {
                                          if(g == 37) {
                                            HEAP32[a + 1204 >> 2] = 0;
                                            HEAP32[a + 1208 >> 2] = c;
                                            _h264bsdCheckPpsId(o, f);
                                            j = HEAP32[a + 8 >> 2];
                                            b = _h264bsdActivateParamSets(a, HEAP32[f >> 2], HEAP32[l >> 2] == 5 ? 1 : 0);
                                            g = b != 0 ? 38 : 41;
                                            do {
                                              if(g == 38) {
                                                HEAP32[a + 4 >> 2] = 256;
                                                HEAP32[a + 12 >> 2] = 0;
                                                HEAP32[a + 8 >> 2] = 32;
                                                HEAP32[a + 16 >> 2] = 0;
                                                HEAP32[a + 3380 >> 2] = 0;
                                                g = b == 65535 ? 39 : 40;
                                                do {
                                                  if(g == 39) {
                                                    h = 5;
                                                    break a
                                                  }else {
                                                    if(g == 40) {
                                                      h = 4;
                                                      break a
                                                    }
                                                  }
                                                }while(0)
                                              }else {
                                                if(g == 41) {
                                                  if(j == HEAP32[a + 8 >> 2]) {
                                                    break h
                                                  }
                                                  c = 0;
                                                  k = HEAP32[a + 16 >> 2];
                                                  HEAP32[r >> 2] = 1;
                                                  g = HEAPU32[a >> 2] < 32 ? 43 : 44;
                                                  g == 43 && (c = HEAP32[a + 20 + (HEAP32[a >> 2] << 2) >> 2]);
                                                  HEAP32[e >> 2] = 0;
                                                  HEAP32[a + 3344 >> 2] = 1;
                                                  g = HEAP32[l >> 2] == 5 ? 46 : 45;
                                                  j:do {
                                                    if(g == 46) {
                                                      if(_h264bsdCheckPriorPicsFlag(r, o, k, HEAP32[a + 12 >> 2], HEAP32[l >> 2]) != 0 | HEAP32[r >> 2] != 0) {
                                                        g = 52;
                                                        break j
                                                      }
                                                      if(HEAP32[a + 1276 >> 2] != 0) {
                                                        g = 52;
                                                        break j
                                                      }
                                                      if(c == 0) {
                                                        g = 52;
                                                        break j
                                                      }
                                                      if(HEAP32[c + 52 >> 2] != HEAP32[k + 52 >> 2]) {
                                                        g = 52;
                                                        break j
                                                      }
                                                      if(HEAP32[c + 56 >> 2] != HEAP32[k + 56 >> 2]) {
                                                        g = 52;
                                                        break j
                                                      }
                                                      if(HEAP32[c + 88 >> 2] != HEAP32[k + 88 >> 2]) {
                                                        g = 52;
                                                        break j
                                                      }
                                                      _h264bsdFlushDpb(a + 1220);
                                                      g = 54;
                                                      break j
                                                    }else {
                                                      if(g == 45) {
                                                        g = 52;
                                                        break j
                                                      }
                                                    }
                                                  }while(0);
                                                  g == 52 && (HEAP32[a + 1280 >> 2] = 0);
                                                  HEAP32[a >> 2] = HEAP32[a + 8 >> 2];
                                                  h = 2;
                                                  break a
                                                }
                                              }
                                            }while(0)
                                          }
                                        }while(0);
                                        g = HEAP32[a + 3380 >> 2] != 0 ? 56 : 57;
                                        do {
                                          if(g == 56) {
                                            h = 3;
                                            break a
                                          }else {
                                            if(g == 57) {
                                              b = _h264bsdDecodeSliceHeader(o, a + 2356, HEAP32[a + 16 >> 2], HEAP32[a + 12 >> 2], l);
                                              g = b != 0 ? 58 : 59;
                                              do {
                                                if(g == 58) {
                                                  h = 3;
                                                  break a
                                                }else {
                                                  if(g == 59) {
                                                    g = _h264bsdIsStartOfPicture(a) != 0 ? 60 : 64;
                                                    do {
                                                      if(g == 60) {
                                                        g = HEAP32[l >> 2] == 5 ? 63 : 61;
                                                        k:do {
                                                          if(g == 61) {
                                                            b = _h264bsdCheckGapsInFrameNum(a + 1220, HEAP32[a + 2368 >> 2], HEAP32[l + 4 >> 2] != 0 ? 1 : 0, HEAP32[HEAP32[a + 16 >> 2] + 48 >> 2]);
                                                            if(b == 0) {
                                                              g = 63;
                                                              break k
                                                            }
                                                            h = 3;
                                                            break a
                                                          }
                                                        }while(0);
                                                        j = _h264bsdAllocateDpbImage(a + 1220);
                                                        HEAP32[a + 1336 >> 2] = j
                                                      }
                                                    }while(0);
                                                    g = a + 2356;
                                                    q = a + 1368;
                                                    n = g + 988;
                                                    if(q % 4 == g % 4) {
                                                      for(;g % 4 !== 0 && g < n;) {
                                                        HEAP8[q++] = HEAP8[g++]
                                                      }
                                                      g >>= 2;
                                                      q >>= 2;
                                                      for(s = n >> 2;g < s;) {
                                                        HEAP32[q++] = HEAP32[g++]
                                                      }
                                                      g <<= 2;
                                                      q <<= 2
                                                    }
                                                    for(;g < n;) {
                                                      HEAP8[q++] = HEAP8[g++]
                                                    }
                                                    HEAP32[a + 1188 >> 2] = 1;
                                                    g = l;
                                                    q = a + 1360;
                                                    for(n = g + 8;g < n;) {
                                                      HEAP8[q++] = HEAP8[g++]
                                                    }
                                                    _h264bsdComputeSliceGroupMap(a, HEAP32[a + 1432 >> 2]);
                                                    _h264bsdInitRefPicList(a + 1220);
                                                    g = _h264bsdReorderRefPicList(a + 1220, a + 1436, HEAP32[a + 1380 >> 2], HEAP32[a + 1412 >> 2]) != 0 ? 65 : 66;
                                                    do {
                                                      if(g == 65) {
                                                        h = 3;
                                                        break a
                                                      }else {
                                                        if(g == 66) {
                                                          b = _h264bsdDecodeSliceData(o, a, a + 1336, a + 1368);
                                                          j = a;
                                                          g = b != 0 ? 67 : 68;
                                                          do {
                                                            if(g == 67) {
                                                              _h264bsdMarkSliceCorrupted(j, HEAP32[a + 1368 >> 2]);
                                                              h = 3;
                                                              break a
                                                            }else {
                                                              if(g == 68) {
                                                                if(_h264bsdIsEndOfPicture(j) == 0) {
                                                                  break f
                                                                }
                                                                p = 1;
                                                                HEAP32[a + 1180 >> 2] = 1
                                                              }
                                                            }
                                                          }while(0)
                                                        }
                                                      }
                                                    }while(0)
                                                  }
                                                }
                                              }while(0)
                                            }
                                          }
                                        }while(0)
                                      }
                                    }
                                  }while(0)
                                }
                              }
                            }
                          }while(0);
                          if(p != 0) {
                            break e
                          }
                          h = 0;
                          break a
                        }
                      }while(0);
                      _h264bsdFilterPicture(a + 1336, HEAP32[a + 1212 >> 2]);
                      _h264bsdResetStorage(a);
                      e = _h264bsdDecodePicOrderCnt(a + 1284, HEAP32[a + 16 >> 2], a + 1368, a + 1360);
                      g = HEAP32[a + 1188 >> 2] != 0 ? 72 : 75;
                      g == 72 && (l = a + 1220, o = a, g = HEAP32[a + 1364 >> 2] != 0 ? 73 : 74, g == 73 ? _h264bsdMarkDecRefPic(l, o + 1644, a + 1336, HEAP32[a + 1380 >> 2], e, HEAP32[a + 1360 >> 2] == 5 ? 1 : 0, HEAP32[a + 1208 >> 2], HEAP32[a + 1204 >> 2]) : g == 74 && _h264bsdMarkDecRefPic(l, 0, o + 1336, HEAP32[a + 1380 >> 2], e, HEAP32[a + 1360 >> 2] == 5 ? 1 : 0, HEAP32[a + 1208 >> 2], HEAP32[a + 1204 >> 2]));
                      HEAP32[a + 1184 >> 2] = 0;
                      HEAP32[a + 1188 >> 2] = 0;
                      h = 1;
                      break a
                    }
                  }
                }while(0)
              }
            }while(0);
            h = 0
          }
        }
      }while(0)
    }
  }while(0);
  STACKTOP = f;
  return h
}
_h264bsdDecode.X = 1;
function _h264bsdShutdown(a) {
  var b, d;
  d = 0;
  a:for(;;) {
    if(b = HEAP32[a + 20 + (d << 2) >> 2] != 0 ? 2 : 3, b == 2 && (_H264SwDecFree(HEAP32[HEAP32[a + 20 + (d << 2) >> 2] + 40 >> 2]), HEAP32[HEAP32[a + 20 + (d << 2) >> 2] + 40 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 20 + (d << 2) >> 2] + 84 >> 2]), HEAP32[HEAP32[a + 20 + (d << 2) >> 2] + 84 >> 2] = 0, _H264SwDecFree(HEAP32[a + 20 + (d << 2) >> 2]), HEAP32[a + 20 + (d << 2) >> 2] = 0), d = b = d + 1, !(b < 32)) {
      break a
    }
  }
  d = 0;
  a:for(;;) {
    if(b = HEAP32[a + 148 + (d << 2) >> 2] != 0 ? 6 : 7, b == 6 && (_H264SwDecFree(HEAP32[HEAP32[a + 148 + (d << 2) >> 2] + 20 >> 2]), HEAP32[HEAP32[a + 148 + (d << 2) >> 2] + 20 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 148 + (d << 2) >> 2] + 24 >> 2]), HEAP32[HEAP32[a + 148 + (d << 2) >> 2] + 24 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 148 + (d << 2) >> 2] + 28 >> 2]), HEAP32[HEAP32[a + 148 + (d << 2) >> 2] + 28 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 148 + (d << 2) >> 2] + 44 >> 2]), 
    HEAP32[HEAP32[a + 148 + (d << 2) >> 2] + 44 >> 2] = 0, _H264SwDecFree(HEAP32[a + 148 + (d << 2) >> 2]), HEAP32[a + 148 + (d << 2) >> 2] = 0), d = b = d + 1, !(b < 256)) {
      break a
    }
  }
  _H264SwDecFree(HEAP32[a + 3376 >> 2]);
  HEAP32[a + 3376 >> 2] = 0;
  _H264SwDecFree(HEAP32[a + 1212 >> 2]);
  HEAP32[a + 1212 >> 2] = 0;
  _H264SwDecFree(HEAP32[a + 1172 >> 2]);
  HEAP32[a + 1172 >> 2] = 0;
  _h264bsdFreeDpb(a + 1220)
}
_h264bsdShutdown.X = 1;
function _h264bsdPicWidth(a) {
  var b, d;
  b = HEAP32[a + 16 >> 2] != 0 ? 1 : 2;
  b == 1 ? d = HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2] : b == 2 && (d = 0);
  return d
}
function _h264bsdPicHeight(a) {
  var b, d;
  b = HEAP32[a + 16 >> 2] != 0 ? 1 : 2;
  b == 1 ? d = HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2] : b == 2 && (d = 0);
  return d
}
function _h264bsdFlushBuffer(a) {
  _h264bsdFlushDpb(a + 1220)
}
function _h264bsdVideoRange(a) {
  var b, d;
  b = HEAP32[a + 16 >> 2] != 0 ? 1 : 6;
  a:do {
    if(b == 1) {
      if(HEAP32[HEAP32[a + 16 >> 2] + 80 >> 2] == 0) {
        b = 6;
        break a
      }
      if(HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] == 0) {
        b = 6;
        break a
      }
      if(HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 24 >> 2] == 0) {
        b = 6;
        break a
      }
      if(HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 32 >> 2] == 0) {
        b = 6;
        break a
      }
      d = 1;
      b = 7;
      break a
    }
  }while(0);
  b == 6 && (d = 0);
  return d
}
function _h264bsdMatrixCoefficients(a) {
  var b, d;
  b = HEAP32[a + 16 >> 2] != 0 ? 1 : 6;
  a:do {
    if(b == 1) {
      if(HEAP32[HEAP32[a + 16 >> 2] + 80 >> 2] == 0) {
        b = 6;
        break a
      }
      if(HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] == 0) {
        b = 6;
        break a
      }
      if(HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 24 >> 2] == 0) {
        b = 6;
        break a
      }
      if(HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 36 >> 2] == 0) {
        b = 6;
        break a
      }
      d = HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 48 >> 2];
      b = 7;
      break a
    }
  }while(0);
  b == 6 && (d = 2);
  return d
}
_h264bsdMatrixCoefficients.X = 1;
function _h264bsdCroppingParams(a, b, d, c, e, f) {
  var g;
  g = HEAP32[a + 16 >> 2] != 0 ? 1 : 3;
  a:do {
    if(g == 1) {
      if(HEAP32[HEAP32[a + 16 >> 2] + 60 >> 2] == 0) {
        g = 3;
        break a
      }
      HEAP32[b >> 2] = 1;
      HEAP32[d >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 64 >> 2] << 1;
      HEAP32[c >> 2] = (HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2] << 4) - (HEAP32[HEAP32[a + 16 >> 2] + 68 >> 2] + HEAP32[HEAP32[a + 16 >> 2] + 64 >> 2] << 1);
      HEAP32[e >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 72 >> 2] << 1;
      HEAP32[f >> 2] = (HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2] << 4) - (HEAP32[HEAP32[a + 16 >> 2] + 76 >> 2] + HEAP32[HEAP32[a + 16 >> 2] + 72 >> 2] << 1);
      g = 4;
      break a
    }
  }while(0);
  g == 3 && (HEAP32[b >> 2] = 0, HEAP32[d >> 2] = 0, HEAP32[c >> 2] = 0, HEAP32[e >> 2] = 0, HEAP32[f >> 2] = 0)
}
_h264bsdCroppingParams.X = 1;
function _h264bsdSampleAspectRatio(a, b, d) {
  var c, e, f;
  f = e = 1;
  c = HEAP32[a + 16 >> 2] != 0 ? 1 : 23;
  a:do {
    if(c == 1) {
      if(HEAP32[HEAP32[a + 16 >> 2] + 80 >> 2] == 0) {
        break a
      }
      if(HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] == 0) {
        break a
      }
      if(HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] >> 2] == 0) {
        break a
      }
      c = HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 4 >> 2];
      c = c == 0 ? 5 : c == 1 ? 6 : c == 2 ? 7 : c == 3 ? 8 : c == 4 ? 9 : c == 5 ? 10 : c == 6 ? 11 : c == 7 ? 12 : c == 8 ? 13 : c == 9 ? 14 : c == 10 ? 15 : c == 11 ? 16 : c == 12 ? 17 : c == 13 ? 18 : c == 255 ? 19 : 22;
      do {
        if(c == 22) {
          f = e = 0
        }else {
          if(c == 5) {
            f = e = 0
          }else {
            if(c == 6) {
              f = e = 1
            }else {
              if(c == 7) {
                e = 12, f = 11
              }else {
                if(c == 8) {
                  e = 10, f = 11
                }else {
                  if(c == 9) {
                    e = 16, f = 11
                  }else {
                    if(c == 10) {
                      e = 40, f = 33
                    }else {
                      if(c == 11) {
                        e = 24, f = 11
                      }else {
                        if(c == 12) {
                          e = 20, f = 11
                        }else {
                          if(c == 13) {
                            e = 32, f = 11
                          }else {
                            if(c == 14) {
                              e = 80, f = 33
                            }else {
                              if(c == 15) {
                                e = 18, f = 11
                              }else {
                                if(c == 16) {
                                  e = 15, f = 11
                                }else {
                                  if(c == 17) {
                                    e = 64, f = 33
                                  }else {
                                    if(c == 18) {
                                      e = 160, f = 99
                                    }else {
                                      if(c == 19) {
                                        e = HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 8 >> 2];
                                        f = HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 12 >> 2];
                                        c = e == 0 ? 21 : 20;
                                        do {
                                          if(c == 20 && f != 0) {
                                            break a
                                          }
                                        }while(0);
                                        e = f = 0
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }while(0)
    }
  }while(0);
  HEAP32[b >> 2] = e;
  HEAP32[d >> 2] = f
}
_h264bsdSampleAspectRatio.X = 1;
function _h264bsdProfile(a) {
  var b, d;
  b = HEAP32[a + 16 >> 2] != 0 ? 1 : 2;
  b == 1 ? d = HEAP32[HEAP32[a + 16 >> 2] >> 2] : b == 2 && (d = 0);
  return d
}
function _H264SwDecRelease(a) {
  if((a == 0 ? 2 : 1) == 1) {
    _h264bsdShutdown(a + 8), _H264SwDecFree(a)
  }
}
function _h264bsdNextOutputPicture(a, b, d, c) {
  var e, f;
  f = _h264bsdDpbOutputPicture(a + 1220);
  a = f != 0 ? 1 : 2;
  a == 1 ? (HEAP32[b >> 2] = HEAP32[f + 4 >> 2], HEAP32[d >> 2] = HEAP32[f + 12 >> 2], HEAP32[c >> 2] = HEAP32[f + 8 >> 2], e = HEAP32[f >> 2]) : a == 2 && (e = 0);
  return e
}
function _h264bsdCheckValidParamSets(a) {
  return _h264bsdValidParamSets(a) == 0 ? 1 : 0
}
function _H264SwDecInit(a, b) {
  var d, c, e;
  d = a == 0 ? 1 : 2;
  d == 1 ? c = -1 : d == 2 && (e = _H264SwDecMalloc(3396), d = e == 0 ? 3 : 4, d == 3 ? c = -4 : d == 4 && (d = _h264bsdInit(e + 8, b), d = d != 0 ? 5 : 6, d == 5 ? (_H264SwDecRelease(e), c = -4) : d == 6 && (HEAP32[e >> 2] = 1, HEAP32[e + 4 >> 2] = 0, HEAP32[a >> 2] = e, c = 0)));
  return c
}
function _H264SwDecGetInfo(a, b) {
  var d, c;
  d = a == 0 ? 2 : 1;
  a:do {
    if(d == 1) {
      if(b == 0) {
        d = 2;
        break a
      }
      c = a + 8;
      d = HEAP32[c + 16 >> 2] == 0 ? 5 : 4;
      b:do {
        if(d == 4) {
          if(HEAP32[c + 12 >> 2] == 0) {
            break b
          }
          d = _h264bsdPicWidth(c);
          HEAP32[b + 4 >> 2] = d << 4;
          d = _h264bsdPicHeight(c);
          HEAP32[b + 8 >> 2] = d << 4;
          d = _h264bsdVideoRange(c);
          HEAP32[b + 12 >> 2] = d;
          d = _h264bsdMatrixCoefficients(c);
          HEAP32[b + 16 >> 2] = d;
          _h264bsdCroppingParams(c, b + 28, b + 32, b + 36, b + 40, b + 44);
          _h264bsdSampleAspectRatio(c, b + 20, b + 24);
          c = _h264bsdProfile(c);
          HEAP32[b >> 2] = c;
          c = 0;
          d = 7;
          break a
        }
      }while(0);
      c = -6;
      d = 7;
      break a
    }
  }while(0);
  d == 2 && (c = -1);
  return c
}
_H264SwDecGetInfo.X = 1;
function _H264SwDecGetAPIVersion() {
  var a = STACKTOP;
  STACKTOP += 16;
  var b = a + 8;
  HEAP32[b >> 2] = 2;
  HEAP32[b + 4 >> 2] = 3;
  var d, c;
  d = a;
  for(c = b + 8;b < c;) {
    HEAP8[d++] = HEAP8[b++]
  }
  b = [HEAPU32[a >> 2], HEAPU32[a + 4 >> 2]];
  STACKTOP = a;
  return b.slice(0)
}
function _NextPacket(a) {
  var b, d, c, e, f, g;
  b = HEAP32[_packetize >> 2] != 0 | HEAP32[_nalUnitStream >> 2] != 0 ? 2 : 1;
  do {
    if(b == 2) {
      c = 0;
      f = HEAP32[a >> 2] + HEAP32[_NextPacket_prevIndex >> 2];
      e = HEAP32[_streamStop >> 2] - f;
      b = e == 0 ? 3 : 4;
      do {
        if(b == 3) {
          d = 0
        }else {
          if(b == 4) {
            c:for(;;) {
              g = c;
              c = g + 1;
              g = HEAP8[f + g];
              if(g == 1) {
                break c
              }
              if(!(c < e)) {
                break c
              }
            }
            b = c == e | c < 3 ? 7 : 8;
            do {
              if(b == 7) {
                throw _exit(100), "Reached an unreachable!";
              }else {
                if(b == 8) {
                  b = HEAP32[_nalUnitStream >> 2] != 0 ? 9 : 10;
                  b == 9 && (f += c, e -= c, c = 0);
                  d = 0;
                  d:for(;;) {
                    b = c;
                    c = b + 1;
                    g = HEAP8[f + b];
                    b = HEAP8[f + b] != 0 ? 13 : 12;
                    b == 12 && (d += 1);
                    if(g == 1) {
                      b = 14
                    }else {
                      var h = g;
                      b = 19
                    }
                    do {
                      if(b == 14) {
                        if(d >= 2) {
                          b = 15;
                          break d
                        }
                        h = g
                      }
                    }while(0);
                    b = h != 0 ? 20 : 21;
                    b == 20 && (d = 0);
                    if(c == e) {
                      b = 22;
                      break d
                    }
                  }
                  b == 15 && (b = d > 3 ? 16 : 17, b == 16 ? (c -= 4, d -= 3) : b == 17 && (c = -d - 1 + c, d = 0));
                  HEAP32[a >> 2] = f;
                  HEAP32[_NextPacket_prevIndex >> 2] = c;
                  b = HEAP32[_nalUnitStream >> 2] != 0 ? 23 : 24;
                  b == 23 && (c -= d);
                  d = c
                }
              }
            }while(0)
          }
        }
      }while(0)
    }else {
      b == 1 && (d = 0)
    }
  }while(0);
  return d
}
_NextPacket.X = 1;
function _H264SwDecDecode(a, b, d) {
  var c = STACKTOP;
  STACKTOP += 4;
  var e, f, g, h, j;
  h = 0;
  j = 1;
  e = b == 0 ? 2 : 1;
  a:do {
    if(e == 1) {
      if(d == 0) {
        e = 2;
        break a
      }
      e = HEAP32[b >> 2] == 0 ? 5 : 4;
      b:do {
        if(e == 4) {
          if(HEAP32[b + 4 >> 2] == 0) {
            break b
          }
          f = a;
          e = a == 0 ? 8 : 7;
          c:do {
            if(e == 7) {
              if(HEAP32[f >> 2] == 0) {
                break c
              }
              HEAP32[d >> 2] = 0;
              HEAP32[c >> 2] = 0;
              a = HEAP32[b + 4 >> 2];
              g = HEAP32[b >> 2];
              HEAP32[f + 3392 >> 2] = HEAP32[b + 12 >> 2];
              d:for(;;) {
                e = HEAP32[f >> 2] == 2 ? 11 : 12;
                e == 11 ? (h = 2, HEAP32[f >> 2] = 1) : e == 12 && (h = _h264bsdDecode(f + 8, g, a, HEAP32[b + 8 >> 2], c));
                g += HEAP32[c >> 2];
                e = a - HEAP32[c >> 2] >= 0 ? 14 : 15;
                e == 14 ? a -= HEAP32[c >> 2] : e == 15 && (a = 0);
                HEAP32[d >> 2] = g;
                e = h;
                if(e == 2) {
                  e = 17;
                  break d
                }else {
                  if(e == 1) {
                    e = 21;
                    break d
                  }else {
                    if(e == 4) {
                      e = 25
                    }else {
                      if(e == 5) {
                        e = 28;
                        break d
                      }else {
                        e = 29
                      }
                    }
                  }
                }
                e:do {
                  if(e == 25) {
                    if(_h264bsdCheckValidParamSets(f + 8) != 0) {
                      e = 29;
                      break e
                    }
                    if(a != 0) {
                      e = 10;
                      continue d
                    }
                    j = -2
                  }
                }while(0);
                if(a == 0) {
                  e = 30;
                  break d
                }
              }
              d:do {
                if(e == 17) {
                  e = HEAP32[f + 1288 >> 2] != 0 ? 18 : 20;
                  e:do {
                    if(e == 18) {
                      if(HEAP32[f + 1244 >> 2] == HEAP32[f + 1248 >> 2]) {
                        e = 20;
                        break e
                      }
                      HEAP32[f + 1288 >> 2] = 0;
                      HEAP32[f >> 2] = 2;
                      j = 3;
                      break d
                    }
                  }while(0);
                  j = 4;
                  a = 0
                }else {
                  e == 21 ? (HEAP32[f + 4 >> 2] += 1, e = a == 0 ? 22 : 23, e == 22 ? j = 2 : e == 23 && (j = 3), a = 0) : e == 28 && (j = -4, a = 0)
                }
              }while(0);
              f = j;
              e = 31;
              break a
            }
          }while(0);
          f = -3;
          e = 31;
          break a
        }
      }while(0);
      f = -1;
      e = 31;
      break a
    }
  }while(0);
  e == 2 && (f = -1);
  STACKTOP = c;
  return f
}
_H264SwDecDecode.X = 1;
function _H264SwDecNextPicture(a, b, d) {
  var c = STACKTOP;
  STACKTOP += 12;
  var e, f, g, h = c + 4, j = c + 8;
  e = a == 0 ? 2 : 1;
  a:do {
    if(e == 1) {
      if(b == 0) {
        e = 2;
        break a
      }
      g = a;
      e = d != 0 ? 4 : 5;
      e == 4 && _h264bsdFlushBuffer(g + 8);
      g = e = _h264bsdNextOutputPicture(g + 8, j, h, c);
      e = e == 0 ? 6 : 7;
      do {
        if(e == 6) {
          f = 0;
          e = 8;
          break a
        }else {
          if(e == 7) {
            HEAP32[b >> 2] = g;
            HEAP32[b + 4 >> 2] = HEAP32[j >> 2];
            HEAP32[b + 8 >> 2] = HEAP32[h >> 2];
            HEAP32[b + 12 >> 2] = HEAP32[c >> 2];
            f = 2;
            e = 8;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  e == 2 && (f = -1);
  STACKTOP = c;
  return f
}
_H264SwDecNextPicture.X = 1;
function _runMainLoop() {
  a:for(;;) {
    if(_mainLoopIteration(), !(HEAPU32[_decInput + 4 >> 2] > 0)) {
      break a
    }
  }
}
function _main(a, b) {
  var d = STACKTOP;
  STACKTOP += 256;
  var c, e, f;
  e = 0;
  var g, h;
  f = d;
  g = f + 256;
  h = 0;
  h < 0 && (h += 256);
  for(h = h + (h << 8) + (h << 16) + h * 16777216;f % 4 !== 0 && f < g;) {
    HEAP8[f++] = 0
  }
  f >>= 2;
  for(c = g >> 2;f < c;) {
    HEAP32[f++] = h
  }
  for(f <<= 2;f < g;) {
    HEAP8[f++] = 0
  }
  f = _H264SwDecGetAPIVersion();
  HEAP32[_decVer >> 2] = f.slice(0).slice(0)[0];
  HEAP32[_decVer + 4 >> 2] = f.slice(0).slice(0)[1];
  c = a > 1 ? 1 : 4;
  a:do {
    if(c == 1) {
      c = _strcmp(HEAP32[b + 4 >> 2], __str) == 0 ? 2 : 3;
      do {
        if(c == 2) {
          e = 0;
          c = 29;
          break a
        }else {
          if(c == 3) {
            if(a < 2) {
              c = 4;
              break a
            }
            HEAP32[_i >> 2] = 1;
            c = HEAPU32[_i >> 2] < a - 1 ? 6 : 20;
            c:do {
              if(c == 6) {
                f = d;
                for(;;) {
                  c = _strncmp(HEAP32[b + (HEAP32[_i >> 2] << 2) >> 2], __str1, 2);
                  g = HEAP32[b + (HEAP32[_i >> 2] << 2) >> 2];
                  c = c == 0 ? 8 : 9;
                  e:do {
                    if(c == 8) {
                      h = _atoi(g + 2), HEAP32[_maxNumPics >> 2] = h
                    }else {
                      if(c == 9) {
                        c = _strncmp(g, __str2, 2);
                        h = HEAP32[b + (HEAP32[_i >> 2] << 2) >> 2];
                        c = c == 0 ? 10 : 11;
                        do {
                          if(c == 10) {
                            _strcpy(f, h + 2)
                          }else {
                            if(c == 11) {
                              c = _strcmp(h, __str3) == 0 ? 12 : 13;
                              do {
                                if(c == 12) {
                                  HEAP32[_packetize >> 2] = 1
                                }else {
                                  if(c == 13) {
                                    c = _strcmp(HEAP32[b + (HEAP32[_i >> 2] << 2) >> 2], __str4) == 0 ? 14 : 15;
                                    do {
                                      if(c == 14) {
                                        HEAP32[_nalUnitStream >> 2] = 1
                                      }else {
                                        if(c == 15) {
                                          c = _strcmp(HEAP32[b + (HEAP32[_i >> 2] << 2) >> 2], __str5) == 0 ? 16 : 17;
                                          do {
                                            if(c == 16) {
                                              HEAP32[_cropDisplay >> 2] = 1
                                            }else {
                                              if(c == 17) {
                                                if(_strcmp(HEAP32[b + (HEAP32[_i >> 2] << 2) >> 2], __str6) != 0) {
                                                  c = 19;
                                                  break e
                                                }
                                                HEAP32[_disableOutputReordering >> 2] = 1
                                              }
                                            }
                                          }while(0)
                                        }
                                      }
                                    }while(0)
                                  }
                                }
                              }while(0)
                            }
                          }
                        }while(0)
                      }
                    }
                  }while(0);
                  HEAP32[_i >> 2] += 1;
                  if(!(HEAPU32[_i >> 2] < a - 1)) {
                    break c
                  }
                }
              }
            }while(0);
            f = g = _fopen(HEAP32[b + (a - 1 << 2) >> 2], __str7);
            c = g == 0 ? 21 : 22;
            do {
              if(c == 21) {
                e = -1;
                c = 29;
                break a
              }else {
                if(c == 22) {
                  _fseek(f, 0, 2);
                  g = _ftell(f);
                  HEAP32[_strmLen >> 2] = g;
                  _rewind(f);
                  g = _malloc(HEAP32[_strmLen >> 2]);
                  HEAP32[_byteStrmStart >> 2] = g;
                  c = HEAP32[_byteStrmStart >> 2] == 0 ? 23 : 24;
                  do {
                    if(c == 23) {
                      e = -1;
                      c = 29;
                      break a
                    }else {
                      if(c == 24) {
                        _fread(HEAP32[_byteStrmStart >> 2], 1, HEAP32[_strmLen >> 2], f);
                        _fclose(f);
                        g = _H264SwDecInit(_decInst, HEAP32[_disableOutputReordering >> 2]);
                        HEAP32[_ret >> 2] = g;
                        c = HEAP32[_ret >> 2] != 0 ? 25 : 26;
                        do {
                          if(c == 25) {
                            e = -1;
                            c = 29;
                            break a
                          }else {
                            if(c == 26) {
                              _SDL_Init(32);
                              HEAP32[_streamStop >> 2] = HEAP32[_byteStrmStart >> 2] + HEAP32[_strmLen >> 2];
                              HEAP32[_decInput >> 2] = HEAP32[_byteStrmStart >> 2];
                              HEAP32[_decInput + 4 >> 2] = HEAP32[_strmLen >> 2];
                              HEAP32[_decInput + 12 >> 2] = 0;
                              e = _NextPacket(_decInput);
                              HEAP32[_tmp >> 2] = e;
                              c = e != 0 ? 27 : 28;
                              c == 27 && (HEAP32[_decInput + 4 >> 2] = HEAP32[_tmp >> 2]);
                              HEAP32[_picDisplayNumber >> 2] = 1;
                              HEAP32[_picDecodeNumber >> 2] = 1;
                              _runMainLoop();
                              e = 0;
                              c = 29;
                              break a
                            }
                          }
                        }while(0)
                      }
                    }
                  }while(0)
                }
              }
            }while(0)
          }
        }
      }while(0)
    }
  }while(0);
  c == 4 && (e = 0);
  STACKTOP = d;
  return e
}
Module._main = _main;
_main.X = 1;
function _terminate() {
  var a, b;
  a:for(;;) {
    if(_H264SwDecNextPicture(HEAP32[_decInst >> 2], _decPicture, 1) != 2) {
      a = 7;
      break a
    }
    HEAP32[_numErrors >> 2] += HEAP32[_decPicture + 12 >> 2];
    HEAP32[_picDisplayNumber >> 2] += 1;
    HEAP32[_imageData >> 2] = HEAP32[_decPicture >> 2];
    a = HEAP32[_cropDisplay >> 2] != 0 & HEAP32[_decInfo + 28 >> 2] != 0 ? 3 : 6;
    do {
      if(a == 3) {
        var d = _CropPicture(HEAP32[_tmpImage >> 2], HEAP32[_imageData >> 2], HEAP32[_decInfo + 4 >> 2], HEAP32[_decInfo + 8 >> 2], _decInfo + 32);
        HEAP32[_tmp >> 2] = d;
        if(HEAP32[_tmp >> 2] != 0) {
          a = 4;
          break a
        }
        _DrawOutput(HEAP32[_tmpImage >> 2], HEAP32[_decInfo + 4 >> 2], HEAP32[_decInfo + 8 >> 2])
      }else {
        a == 6 && _DrawOutput(HEAP32[_imageData >> 2], HEAP32[_decInfo + 4 >> 2], HEAP32[_decInfo + 8 >> 2])
      }
    }while(0)
  }
  a == 7 ? (_SDL_Quit(), _H264SwDecRelease(HEAP32[_decInst >> 2]), a = HEAP32[_foutput >> 2] != 0 ? 8 : 9, a == 8 && _fclose(HEAP32[_foutput >> 2]), a = HEAP32[_numErrors >> 2] != 0 | HEAP32[_picDecodeNumber >> 2] == 1 ? 10 : 11, a == 10 ? b = 1 : a == 11 && (b = 0)) : a == 4 && (b = -1);
  return b
}
_terminate.X = 1;
function _H264SwDecFree() {
}
function _H264SwDecMemcpy(a, b, d) {
  var c;
  c = b + d;
  if(a % 4 == b % 4 && d > 8) {
    for(;b % 4 !== 0 && b < c;) {
      HEAP8[a++] = HEAP8[b++]
    }
    b >>= 2;
    a >>= 2;
    for(d = c >> 2;b < d;) {
      HEAP32[a++] = HEAP32[b++]
    }
    b <<= 2;
    a <<= 2
  }
  for(;b < c;) {
    HEAP8[a++] = HEAP8[b++]
  }
}
function _H264SwDecMemset(a, b, d) {
  b &= 255;
  var c, e, d = a + d;
  e = b;
  e < 0 && (e += 256);
  for(e = e + (e << 8) + (e << 16) + e * 16777216;a % 4 !== 0 && a < d;) {
    HEAP8[a++] = b
  }
  a >>= 2;
  for(c = d >> 2;a < c;) {
    HEAP32[a++] = e
  }
  for(a <<= 2;a < d;) {
    HEAP8[a++] = b
  }
}
function _CropPicture(a, b, d, c, e) {
  var f, g, h, j, l, k;
  f = a == 0 ? 5 : 1;
  a:do {
    if(f == 1) {
      if(b == 0) {
        f = 5;
        break a
      }
      if(e == 0) {
        f = 5;
        break a
      }
      if(d == 0) {
        f = 5;
        break a
      }
      if(c == 0) {
        f = 5;
        break a
      }
      f = HEAP32[e + 4 >> 2] + HEAP32[e >> 2] > d ? 8 : 7;
      b:do {
        if(f == 7) {
          if(HEAP32[e + 12 >> 2] + HEAP32[e + 8 >> 2] > c) {
            break b
          }
          g = HEAP32[e + 4 >> 2];
          j = HEAP32[e + 12 >> 2];
          k = b + d * HEAP32[e + 8 >> 2] + HEAP32[e >> 2];
          l = a;
          a = j;
          if(j != 0) {
            var m = g;
            f = 10
          }else {
            var o = g;
            f = 13
          }
          c:do {
            if(f == 10) {
              for(;;) {
                h = m;
                f = m != 0 ? 11 : 12;
                e:do {
                  if(f == 11) {
                    for(;;) {
                      m = k;
                      k = m + 1;
                      var m = HEAP8[m], p = l;
                      l = p + 1;
                      HEAP8[p] = m;
                      h = m = h - 1;
                      if(m == 0) {
                        f = 12;
                        break e
                      }
                    }
                  }
                }while(0);
                k += d - g;
                a = h = a - 1;
                if(h != 0) {
                  m = g
                }else {
                  o = g;
                  break c
                }
              }
            }
          }while(0);
          g = o >>> 1;
          j >>>= 1;
          k = b + c * d + Math.floor(d * HEAP32[e + 8 >> 2] / 4) + Math.floor(HEAPU32[e >> 2] / 2);
          a = j;
          f = j != 0 ? 14 : 17;
          c:do {
            if(f == 14) {
              for(;;) {
                h = g;
                f = g != 0 ? 15 : 16;
                e:do {
                  if(f == 15) {
                    for(;;) {
                      if(o = k, k = o + 1, o = HEAP8[o], m = l, l = m + 1, HEAP8[m] = o, h = o = h - 1, o == 0) {
                        f = 16;
                        break e
                      }
                    }
                  }
                }while(0);
                k += Math.floor(d / 2) - g;
                a = h = a - 1;
                if(h == 0) {
                  break c
                }
              }
            }
          }while(0);
          k = b + Math.floor(d * 5 * c / 4) + Math.floor(d * HEAP32[e + 8 >> 2] / 4) + Math.floor(HEAPU32[e >> 2] / 2);
          a = j;
          f = j != 0 ? 18 : 21;
          c:do {
            if(f == 18) {
              for(;;) {
                h = g;
                f = g != 0 ? 19 : 20;
                e:do {
                  if(f == 19) {
                    for(;;) {
                      if(b = k, k = b + 1, b = HEAP8[b], c = l, l = c + 1, HEAP8[c] = b, h = b = h - 1, b == 0) {
                        f = 20;
                        break e
                      }
                    }
                  }
                }while(0);
                k += Math.floor(d / 2) - g;
                a = b = a - 1;
                if(b == 0) {
                  break c
                }
              }
            }
          }while(0);
          g = 0;
          f = 22;
          break a
        }
      }while(0);
      g = 1;
      f = 22;
      break a
    }
  }while(0);
  f == 5 && (g = 1);
  return g
}
_CropPicture.X = 1;
function _DrawOutput(a, b, d) {
  var c;
  c = d * b;
  _paint(a, a + c, a + c + (c >>> 2), b, d);
  _broadwayOnFrameDecoded()
}
function _mainLoopIteration() {
  var a, b;
  HEAP32[_decInput + 8 >> 2] = HEAP32[_picDecodeNumber >> 2];
  a = _H264SwDecDecode(HEAP32[_decInst >> 2], _decInput, _decOutput);
  HEAP32[_ret >> 2] = a;
  a = a == 4 ? 1 : a == 3 ? 10 : a == 2 ? 11 : a == 1 ? 22 : a == -2 ? 22 : 23;
  a:do {
    if(a == 23) {
      b = -1;
      a = 24;
      break a
    }else {
      if(a == 1) {
        a = _H264SwDecGetInfo(HEAP32[_decInst >> 2], _decInfo);
        HEAP32[_ret >> 2] = a;
        a = HEAP32[_ret >> 2] != 0 ? 2 : 3;
        do {
          if(a == 2) {
            b = -1;
            a = 24;
            break a
          }else {
            if(a == 3) {
              a = HEAP32[_screen >> 2] != 0 ? 5 : 4;
              a == 4 && (a = _SDL_SetVideoMode(HEAP32[_decInfo + 4 >> 2], HEAP32[_decInfo + 8 >> 2], 32, 150994945), HEAP32[_screen >> 2] = a);
              a = HEAP32[_cropDisplay >> 2] != 0 & HEAP32[_decInfo + 28 >> 2] != 0 ? 6 : 8;
              c:do {
                if(a == 6) {
                  HEAP32[_picSize >> 2] = HEAP32[_decInfo + 44 >> 2] * HEAP32[_decInfo + 36 >> 2];
                  HEAP32[_picSize >> 2] = Math.floor(HEAP32[_picSize >> 2] * 3 / 2);
                  a = _malloc(HEAP32[_picSize >> 2]);
                  HEAP32[_tmpImage >> 2] = a;
                  if(HEAP32[_tmpImage >> 2] != 0) {
                    break c
                  }
                  b = -1;
                  a = 24;
                  break a
                }else {
                  a == 8 && (HEAP32[_picSize >> 2] = HEAP32[_decInfo + 8 >> 2] * HEAP32[_decInfo + 4 >> 2], HEAP32[_picSize >> 2] = Math.floor(HEAP32[_picSize >> 2] * 3 / 2))
                }
              }while(0);
              HEAP32[_decInput + 4 >> 2] = HEAP32[_decInput + 4 >> 2] + -HEAP32[_decOutput >> 2] + - -HEAP32[_decInput >> 2];
              HEAP32[_decInput >> 2] = HEAP32[_decOutput >> 2];
              a = 24;
              break a
            }
          }
        }while(0)
      }else {
        if(a == 10) {
          HEAP32[_decInput + 4 >> 2] = HEAP32[_decInput + 4 >> 2] + -HEAP32[_decOutput >> 2] + - -HEAP32[_decInput >> 2];
          HEAP32[_decInput >> 2] = HEAP32[_decOutput >> 2];
          a = HEAP32[_ret >> 2] == 2 ? 11 : 12;
          break a
        }else {
          if(a == 22) {
            a = _NextPacket(_decInput);
            HEAP32[_decInput + 4 >> 2] = a;
            a = 24;
            break a
          }
        }
      }
    }
  }while(0);
  a:do {
    if(a == 11) {
      a = _NextPacket(_decInput);
      HEAP32[_decInput + 4 >> 2] = a;
      a = 12;
      break a
    }
  }while(0);
  a:do {
    if(a == 12) {
      a = HEAP32[_maxNumPics >> 2] != 0 ? 13 : 15;
      b:do {
        if(a == 13) {
          if(HEAP32[_picDecodeNumber >> 2] != HEAP32[_maxNumPics >> 2]) {
            a = 15;
            break b
          }
          HEAP32[_decInput + 4 >> 2] = 0
        }
      }while(0);
      HEAP32[_picDecodeNumber >> 2] += 1;
      b:for(;;) {
        if(_H264SwDecNextPicture(HEAP32[_decInst >> 2], _decPicture, 0) != 2) {
          break a
        }
        HEAP32[_numErrors >> 2] += HEAP32[_decPicture + 12 >> 2];
        HEAP32[_picDisplayNumber >> 2] += 1;
        HEAP32[_imageData >> 2] = HEAP32[_decPicture >> 2];
        a = HEAP32[_cropDisplay >> 2] != 0 & HEAP32[_decInfo + 28 >> 2] != 0 ? 18 : 21;
        do {
          if(a == 18) {
            var d = _CropPicture(HEAP32[_tmpImage >> 2], HEAP32[_imageData >> 2], HEAP32[_decInfo + 4 >> 2], HEAP32[_decInfo + 8 >> 2], _decInfo + 32);
            HEAP32[_tmp >> 2] = d;
            if(HEAP32[_tmp >> 2] != 0) {
              a = 19;
              break b
            }
            _DrawOutput(HEAP32[_tmpImage >> 2], HEAP32[_decInfo + 4 >> 2], HEAP32[_decInfo + 8 >> 2])
          }else {
            a == 21 && _DrawOutput(HEAP32[_imageData >> 2], HEAP32[_decInfo + 4 >> 2], HEAP32[_decInfo + 8 >> 2])
          }
        }while(0)
      }
      b = -1
    }
  }while(0);
  return b
}
_mainLoopIteration.X = 1;
function _broadwayOnFrameDecoded() {
  _puts(_str)
}
function _broadwaySetPosition(a) {
  _printf(__str9, allocate([a, 0, 0, 0, 0, 0, 0, 0], ["double", 0, 0, 0, 0, 0, 0, 0], ALLOC_STACK))
}
function _broadwayGetPosition() {
  _puts(_str1);
  return 0
}
function _H264SwDecTrace(a) {
  _puts(a)
}
function _H264SwDecMalloc(a) {
  return _malloc(a)
}
var _llvm_dbg_declare;
function _memcpy(a, b, d) {
  var c;
  c = b + d;
  if(a % 4 == b % 4 && d > 8) {
    for(;b % 4 !== 0 && b < c;) {
      HEAP8[a++] = HEAP8[b++]
    }
    b >>= 2;
    a >>= 2;
    for(d = c >> 2;b < d;) {
      HEAP32[a++] = HEAP32[b++]
    }
    b <<= 2;
    a <<= 2
  }
  for(;b < c;) {
    HEAP8[a++] = HEAP8[b++]
  }
}
var _llvm_memcpy_p0i8_p0i8_i32 = _memcpy;
function _memset(a, b, d) {
  var c, d = a + d;
  b < 0 && (b += 256);
  for(b = b + (b << 8) + (b << 16) + b * 16777216;a % 4 !== 0 && a < d;) {
    HEAP8[a++] = b
  }
  a >>= 2;
  for(c = d >> 2;a < c;) {
    HEAP32[a++] = b
  }
  for(a <<= 2;a < d;) {
    HEAP8[a++] = b
  }
}
var _llvm_memset_p0i8_i32 = _memset;
function _strncmp(a, b, d) {
  for(var c = 0;c < d;) {
    var e = HEAP8[a + c], f = HEAP8[b + c];
    if(e == f && e == 0) {
      break
    }
    if(e == 0) {
      return-1
    }
    if(f == 0) {
      return 1
    }
    if(e == f) {
      c++
    }else {
      return e > f ? 1 : -1
    }
  }
  return 0
}
function _strcmp(a, b) {
  return _strncmp(a, b, TOTAL_MEMORY)
}
function _isspace(a) {
  return a in {32:0, 9:0, 10:0, 11:0, 12:0, 13:0}
}
function _isdigit(a) {
  return a >= "0".charCodeAt(0) && a <= "9".charCodeAt(0)
}
function _atoi(a) {
  for(var b;(b = HEAP8[a]) && _isspace(b);) {
    a++
  }
  if(!b || !_isdigit(b)) {
    return 0
  }
  for(var d = a;(b = HEAP8[d]) && _isdigit(b);) {
    d++
  }
  return Math.floor(Number(Pointer_stringify(a).substr(0, d - a)))
}
function _strcpy(a, b) {
  var d = 0;
  do {
    var c, e, f;
    c = b + d;
    e = a + d;
    for(f = c + 1;c < f;) {
      HEAP8[e++] = HEAP8[c++]
    }
    d++
  }while(HEAP8[b + d - 1] != 0);
  return a
}
var ERRNO_CODES = {E2BIG:7, EACCES:13, EADDRINUSE:98, EADDRNOTAVAIL:99, EAFNOSUPPORT:97, EAGAIN:11, EALREADY:114, EBADF:9, EBADMSG:74, EBUSY:16, ECANCELED:125, ECHILD:10, ECONNABORTED:103, ECONNREFUSED:111, ECONNRESET:104, EDEADLK:35, EDESTADDRREQ:89, EDOM:33, EDQUOT:122, EEXIST:17, EFAULT:14, EFBIG:27, EHOSTUNREACH:113, EIDRM:43, EILSEQ:84, EINPROGRESS:115, EINTR:4, EINVAL:22, EIO:5, EISCONN:106, EISDIR:21, ELOOP:40, EMFILE:24, EMLINK:31, EMSGSIZE:90, EMULTIHOP:72, ENAMETOOLONG:36, ENETDOWN:100, 
ENETRESET:102, ENETUNREACH:101, ENFILE:23, ENOBUFS:105, ENODATA:61, ENODEV:19, ENOENT:2, ENOEXEC:8, ENOLCK:37, ENOLINK:67, ENOMEM:12, ENOMSG:42, ENOPROTOOPT:92, ENOSPC:28, ENOSR:63, ENOSTR:60, ENOSYS:38, ENOTCONN:107, ENOTDIR:20, ENOTEMPTY:39, ENOTRECOVERABLE:131, ENOTSOCK:88, ENOTSUP:95, ENOTTY:25, ENXIO:6, EOVERFLOW:75, EOWNERDEAD:130, EPERM:1, EPIPE:32, EPROTO:71, EPROTONOSUPPORT:93, EPROTOTYPE:91, ERANGE:34, EROFS:30, ESPIPE:29, ESRCH:3, ESTALE:116, ETIME:62, ETIMEDOUT:110, ETXTBSY:26, EWOULDBLOCK:11, 
EXDEV:18};
function ___setErrNo(a) {
  if(!___setErrNo.ret) {
    ___setErrNo.ret = allocate([0], "i32", ALLOC_STATIC)
  }
  return HEAP32[___setErrNo.ret >> 2] = a
}
var _stdin = 0, _stdout = 0, _stderr = 0, __impure_ptr = 0, FS = {currentPath:"/", nextInode:2, streams:[null], ignorePermissions:true, absolutePath:function(a, b) {
  if(typeof a !== "string") {
    return null
  }
  if(b === void 0) {
    b = FS.currentPath
  }
  a && a[0] == "/" && (b = "");
  for(var d = (b + "/" + a).split("/").reverse(), c = [""];d.length;) {
    var e = d.pop();
    e == "" || e == "." || (e == ".." ? c.length > 1 && c.pop() : c.push(e))
  }
  return c.length == 1 ? "/" : c.join("/")
}, analyzePath:function(a, b, d) {
  var c = {isRoot:false, exists:false, error:0, name:null, path:null, object:null, parentExists:false, parentPath:null, parentObject:null}, a = FS.absolutePath(a);
  if(a == "/") {
    c.isRoot = true, c.exists = c.parentExists = true, c.name = "/", c.path = c.parentPath = "/", c.object = c.parentObject = FS.root
  }else {
    if(a !== null) {
      for(var d = d || 0, a = a.slice(1).split("/"), e = FS.root, f = [""];a.length;) {
        if(a.length == 1 && e.isFolder) {
          c.parentExists = true, c.parentPath = f.length == 1 ? "/" : f.join("/"), c.parentObject = e, c.name = a[0]
        }
        var g = a.shift();
        if(e.isFolder) {
          if(e.read) {
            if(!e.contents.hasOwnProperty(g)) {
              c.error = ERRNO_CODES.ENOENT;
              break
            }
          }else {
            c.error = ERRNO_CODES.EACCES;
            break
          }
        }else {
          c.error = ERRNO_CODES.ENOTDIR;
          break
        }
        e = e.contents[g];
        if(e.link && !(b && a.length == 0)) {
          if(d > 40) {
            c.error = ERRNO_CODES.ELOOP;
            break
          }
          c = FS.absolutePath(e.link, f.join("/"));
          return FS.analyzePath([c].concat(a).join("/"), b, d + 1)
        }
        f.push(g);
        if(a.length == 0) {
          c.exists = true, c.path = f.join("/"), c.object = e
        }
      }
    }
  }
  return c
}, findObject:function(a, b) {
  FS.ensureRoot();
  var d = FS.analyzePath(a, b);
  return d.exists ? d.object : (___setErrNo(d.error), null)
}, createObject:function(a, b, d, c, e) {
  a || (a = "/");
  typeof a === "string" && (a = FS.findObject(a));
  if(!a) {
    throw ___setErrNo(ERRNO_CODES.EACCES), Error("Parent path must exist.");
  }
  if(!a.isFolder) {
    throw ___setErrNo(ERRNO_CODES.ENOTDIR), Error("Parent must be a folder.");
  }
  if(!a.write && !FS.ignorePermissions) {
    throw ___setErrNo(ERRNO_CODES.EACCES), Error("Parent folder must be writeable.");
  }
  if(!b || b == "." || b == "..") {
    throw ___setErrNo(ERRNO_CODES.ENOENT), Error("Name must not be empty.");
  }
  if(a.contents.hasOwnProperty(b)) {
    throw ___setErrNo(ERRNO_CODES.EEXIST), Error("Can't overwrite object.");
  }
  a.contents[b] = {read:c === void 0 ? true : c, write:e === void 0 ? false : e, timestamp:Date.now(), inodeNumber:FS.nextInode++};
  for(var f in d) {
    d.hasOwnProperty(f) && (a.contents[b][f] = d[f])
  }
  return a.contents[b]
}, createFolder:function(a, b, d, c) {
  return FS.createObject(a, b, {isFolder:true, isDevice:false, contents:{}}, d, c)
}, createPath:function(a, b, d, c) {
  a = FS.findObject(a);
  if(a === null) {
    throw Error("Invalid parent.");
  }
  for(b = b.split("/").reverse();b.length;) {
    var e = b.pop();
    e && (a.contents.hasOwnProperty(e) || FS.createFolder(a, e, d, c), a = a.contents[e])
  }
  return a
}, createFile:function(a, b, d, c, e) {
  d.isFolder = false;
  return FS.createObject(a, b, d, c, e)
}, createDataFile:function(a, b, d, c, e) {
  if(typeof d === "string") {
    for(var f = [], g = 0;g < d.length;g++) {
      f.push(d.charCodeAt(g))
    }
    d = f
  }
  return FS.createFile(a, b, {isDevice:false, contents:d}, c, e)
}, createLazyFile:function(a, b, d, c, e) {
  return FS.createFile(a, b, {isDevice:false, url:d}, c, e)
}, createLink:function(a, b, d, c, e) {
  return FS.createFile(a, b, {isDevice:false, link:d}, c, e)
}, createDevice:function(a, b, d, c) {
  if(!d && !c) {
    throw Error("A device must have at least one callback defined.");
  }
  return FS.createFile(a, b, {isDevice:true, input:d, output:c}, Boolean(d), Boolean(c))
}, forceLoadFile:function(a) {
  if(a.isDevice || a.isFolder || a.link || a.contents) {
    return true
  }
  var b = true;
  if(typeof XMLHttpRequest !== "undefined") {
    var d = new XMLHttpRequest;
    d.open("GET", a.url, false);
    if(typeof Uint8Array != "undefined") {
      d.responseType = "arraybuffer"
    }
    d.overrideMimeType && d.overrideMimeType("text/plain; charset=x-user-defined");
    d.send(null);
    d.status != 200 && d.status != 0 && (b = false);
    a.contents = d.response !== void 0 ? new Uint8Array(d.response || []) : intArrayFromString(d.responseText || "", true)
  }else {
    if(typeof read !== "undefined") {
      try {
        a.contents = intArrayFromString(read(a.url), true)
      }catch(c) {
        b = false
      }
    }else {
      throw Error("Cannot load without read() or XMLHttpRequest.");
    }
  }
  b || ___setErrNo(ERRNO_CODES.EIO);
  return b
}, ensureRoot:function() {
  if(!FS.root) {
    FS.root = {read:true, write:false, isFolder:true, isDevice:false, timestamp:Date.now(), inodeNumber:1, contents:{}}
  }
}, init:function(a, b, d) {
  if(!FS.init.initialized) {
    FS.init.initialized = true;
    FS.ensureRoot();
    a || (a = function() {
      if(!a.cache || !a.cache.length) {
        var b;
        typeof window != "undefined" && typeof window.prompt == "function" ? b = window.prompt("Input: ") : typeof readline == "function" && (b = readline());
        b || (b = "");
        a.cache = intArrayFromString(b + "\n", true)
      }
      return a.cache.shift()
    });
    b || (b = function(a) {
      a === null || a === "\n".charCodeAt(0) ? (b.printer(b.buffer.join("")), b.buffer = []) : b.buffer.push(String.fromCharCode(a))
    });
    if(!b.printer) {
      b.printer = print
    }
    if(!b.buffer) {
      b.buffer = []
    }
    d || (d = b);
    FS.createFolder("/", "tmp", true, true);
    var c = FS.createFolder("/", "dev", true, false), e = FS.createDevice(c, "stdin", a), f = FS.createDevice(c, "stdout", null, b), d = FS.createDevice(c, "stderr", null, d);
    FS.createDevice(c, "tty", a, b);
    FS.streams[1] = {path:"/dev/stdin", object:e, position:0, isRead:true, isWrite:false, isAppend:false, error:false, eof:false, ungotten:[]};
    FS.streams[2] = {path:"/dev/stdout", object:f, position:0, isRead:false, isWrite:true, isAppend:false, error:false, eof:false, ungotten:[]};
    FS.streams[3] = {path:"/dev/stderr", object:d, position:0, isRead:false, isWrite:true, isAppend:false, error:false, eof:false, ungotten:[]};
    _stdin = allocate([1], "void*", ALLOC_STATIC);
    _stdout = allocate([2], "void*", ALLOC_STATIC);
    _stderr = allocate([3], "void*", ALLOC_STATIC);
    FS.streams[_stdin] = FS.streams[1];
    FS.streams[_stdout] = FS.streams[2];
    FS.streams[_stderr] = FS.streams[3];
    __impure_ptr = allocate([allocate([0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0], "void*", ALLOC_STATIC)], "void*", ALLOC_STATIC)
  }
}, quit:function() {
  FS.init.initialized && (FS.streams[2].object.output.buffer.length > 0 && FS.streams[2].object.output("\n".charCodeAt(0)), FS.streams[3].object.output.buffer.length > 0 && FS.streams[3].object.output("\n".charCodeAt(0)))
}}, ___dirent_struct_layout = null;
function _open(a, b, d) {
  var c = HEAP32[d >> 2], e = b & 3, d = e != 0, e = e != 1, f = Boolean(b & 512), g = Boolean(b & 2048), h = Boolean(b & 1024), j = Boolean(b & 8), a = FS.analyzePath(Pointer_stringify(a));
  if(!a.parentExists) {
    return ___setErrNo(a.error), -1
  }
  if(b = a.object || null) {
    if(f && g) {
      return ___setErrNo(ERRNO_CODES.EEXIST), -1
    }
    if((d || f || h) && b.isFolder) {
      return ___setErrNo(ERRNO_CODES.EISDIR), -1
    }
    if(e && !b.read || d && !b.write) {
      return ___setErrNo(ERRNO_CODES.EACCES), -1
    }
    if(h && !b.isDevice) {
      b.contents = []
    }else {
      if(!FS.forceLoadFile(b)) {
        return ___setErrNo(ERRNO_CODES.EIO), -1
      }
    }
    a = a.path
  }else {
    if(!f) {
      return ___setErrNo(ERRNO_CODES.ENOENT), -1
    }
    if(!a.parentObject.write) {
      return ___setErrNo(ERRNO_CODES.EACCES), -1
    }
    b = FS.createDataFile(a.parentObject, a.name, [], c & 256, c & 128);
    a = a.parentPath + "/" + a.name
  }
  c = FS.streams.length;
  if(b.isFolder) {
    d = 0;
    ___dirent_struct_layout && (d = _malloc(___dirent_struct_layout.__size__));
    var e = [], l;
    for(l in b.contents) {
      e.push(l)
    }
    FS.streams[c] = {path:a, object:b, position:-2, isRead:true, isWrite:false, isAppend:false, error:false, eof:false, ungotten:[], contents:e, currentEntry:d}
  }else {
    FS.streams[c] = {path:a, object:b, position:0, isRead:e, isWrite:d, isAppend:j, error:false, eof:false, ungotten:[]}
  }
  return c
}
function _fopen(a, b) {
  var d, b = Pointer_stringify(b);
  if(b[0] == "r") {
    d = b.indexOf("+") != -1 ? 2 : 0
  }else {
    if(b[0] == "w") {
      d = b.indexOf("+") != -1 ? 2 : 1, d |= 512, d |= 1024
    }else {
      if(b[0] == "a") {
        d = b.indexOf("+") != -1 ? 2 : 1, d |= 512, d |= 8
      }else {
        return ___setErrNo(ERRNO_CODES.EINVAL), 0
      }
    }
  }
  d = _open(a, d, allocate([511, 0, 0, 0], "i32", ALLOC_STACK));
  return d == -1 ? 0 : d
}
function _lseek(a, b, d) {
  return FS.streams[a] && !FS.streams[a].isDevice ? (a = FS.streams[a], d === 1 ? b += a.position : d === 2 && (b += a.object.contents.length), b < 0 ? (___setErrNo(ERRNO_CODES.EINVAL), -1) : (a.ungotten = [], a.position = b)) : (___setErrNo(ERRNO_CODES.EBADF), -1)
}
function _fseek(a, b, d) {
  return _lseek(a, b, d) == -1 ? -1 : (FS.streams[a].eof = false, 0)
}
function _ftell(a) {
  return a in FS.streams ? (a = FS.streams[a], a.object.isDevice ? (___setErrNo(ERRNO_CODES.ESPIPE), -1) : a.position) : (___setErrNo(ERRNO_CODES.EBADF), -1)
}
function _rewind(a) {
  _fseek(a, 0, 0);
  if(a in FS.streams) {
    FS.streams[a].error = false
  }
}
function _malloc(a) {
  return Runtime.staticAlloc(a || 1)
}
function _pread(a, b, d, c) {
  var e = FS.streams[a];
  if(!e || e.object.isDevice) {
    return ___setErrNo(ERRNO_CODES.EBADF), -1
  }else {
    if(e.isRead) {
      if(e.object.isFolder) {
        return ___setErrNo(ERRNO_CODES.EISDIR), -1
      }else {
        if(d < 0 || c < 0) {
          return ___setErrNo(ERRNO_CODES.EINVAL), -1
        }else {
          for(a = 0;e.ungotten.length && d > 0;) {
            HEAP8[b++] = e.ungotten.pop(), d--, a++
          }
          for(var e = e.object.contents, d = Math.min(e.length - c, d), f = 0;f < d;f++) {
            HEAP8[b + f] = e[c + f], a++
          }
          return a
        }
      }
    }else {
      return ___setErrNo(ERRNO_CODES.EACCES), -1
    }
  }
}
function _read(a, b, d) {
  var c = FS.streams[a];
  if(c) {
    if(c.isRead) {
      if(d < 0) {
        return ___setErrNo(ERRNO_CODES.EINVAL), -1
      }else {
        if(c.object.isDevice) {
          if(c.object.input) {
            for(a = 0;c.ungotten.length && d > 0;) {
              HEAP8[b++] = c.ungotten.pop(), d--, a++
            }
            for(var e = 0;e < d;e++) {
              try {
                var f = c.object.input()
              }catch(g) {
                return ___setErrNo(ERRNO_CODES.EIO), -1
              }
              if(f === null || f === void 0) {
                break
              }
              a++;
              HEAP8[b + e] = f
            }
            return a
          }else {
            return ___setErrNo(ERRNO_CODES.ENXIO), -1
          }
        }else {
          return f = c.ungotten.length, a = _pread(a, b, d, c.position), a != -1 && (c.position += c.ungotten.length - f + a), a
        }
      }
    }else {
      return ___setErrNo(ERRNO_CODES.EACCES), -1
    }
  }else {
    return ___setErrNo(ERRNO_CODES.EBADF), -1
  }
}
function _fread(a, b, d, c) {
  d *= b;
  if(d == 0) {
    return 0
  }
  a = _read(c, a, d);
  c = FS.streams[c];
  if(a == -1) {
    if(c) {
      c.error = true
    }
    return-1
  }else {
    if(a < d) {
      c.eof = true
    }
    return Math.floor(a / b)
  }
}
function _close(a) {
  return FS.streams[a] ? (FS.streams[a].currentEntry && _free(FS.streams[a].currentEntry), delete FS.streams[a], 0) : (___setErrNo(ERRNO_CODES.EBADF), -1)
}
function _fsync(a) {
  return FS.streams[a] ? 0 : (___setErrNo(ERRNO_CODES.EBADF), -1)
}
function _fclose(a) {
  _fsync(a);
  return _close(a)
}
function _free() {
}
var Browser = {decodeImage:function(a, b) {
  for(var d = new Image, c = document.createElement("canvas"), e = "", f = 0, g = 0, h = 0;h < a.length;h++) {
    f = f << 8 | a[h];
    for(g += 8;g >= 6;) {
      var j = f >> g - 6 & 63;
      g -= 6;
      e += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[j]
    }
  }
  g == 2 ? (e += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(f & 3) << 4], e += "==") : g == 4 && (e += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(f & 15) << 2], e += "=");
  d.src = "data:image/" + b + ";base64," + e;
  e = c.getContext("2d");
  e.drawImage(d, 0, 0);
  return e.getImageData(0, 0, c.width, c.height)
}}, SDL = {defaults:{width:320, height:200, copyScreenOnLock:false}, surfaces:{}, events:[], keyCodes:{16:304, 17:305, 18:308, 37:276, 38:273, 39:275, 40:274, 109:45}, structs:{Rect:{__size__:8, x:0, y:2, w:4, h:6}, PixelFormat:{__size__:32, palette:0, BitsPerPixel:4, BytesPerPixel:5, Rloss:6, Gloss:7, Bloss:8, Aloss:9, Rshift:10, Gshift:11, Bshift:12, Ashift:13, Rmask:16, Gmask:20, Bmask:24, Amask:28}, KeyboardEvent:{__size__:8, type:0, which:1, state:2, keysym:4}, keysym:{__size__:16, scancode:0, 
sym:4, mod:8, unicode:12}, AudioSpec:{__size__:24, freq:0, format:4, channels:6, silence:7, samples:8, size:12, callback:16, userdata:20}}, makeSurface:function(a, b, d) {
  var c = _malloc(14 * Runtime.QUANTUM_SIZE), e = _malloc(a * b * 4), f = _malloc(18 * Runtime.QUANTUM_SIZE);
  d |= 1;
  HEAP32[c + Runtime.QUANTUM_SIZE * 0 >> 2] = d;
  HEAP32[c + Runtime.QUANTUM_SIZE * 1 >> 2] = f;
  HEAP32[c + Runtime.QUANTUM_SIZE * 2 >> 2] = a;
  HEAP32[c + Runtime.QUANTUM_SIZE * 3 >> 2] = b;
  HEAP16[c + Runtime.QUANTUM_SIZE * 4 >> 1] = a * 4;
  HEAP32[c + Runtime.QUANTUM_SIZE * 5 >> 2] = e;
  HEAP32[c + Runtime.QUANTUM_SIZE * 6 >> 2] = 0;
  HEAP32[f + SDL.structs.PixelFormat.palette >> 2] = 0;
  HEAP8[f + SDL.structs.PixelFormat.BitsPerPixel] = 32;
  HEAP8[f + SDL.structs.PixelFormat.BytesPerPixel] = 4;
  HEAP32[f + SDL.structs.PixelFormat.Rmask >> 2] = 255;
  HEAP32[f + SDL.structs.PixelFormat.Gmask >> 2] = 255;
  HEAP32[f + SDL.structs.PixelFormat.Bmask >> 2] = 255;
  HEAP32[f + SDL.structs.PixelFormat.Amask >> 2] = 255;
  SDL.surfaces[c] = {width:a, height:b, canvas:Module.canvas, ctx:Module.ctx2D, surf:c, buffer:e, pixelFormat:f, alpha:255};
  return c
}, freeSurface:function(a) {
  _free(SDL.surfaces[a].buffer);
  _free(SDL.surfaces[a].pixelFormat);
  _free(a);
  delete SDL.surfaces[a]
}, receiveEvent:function(a) {
  switch(a.type) {
    case "keydown":
    ;
    case "keyup":
      SDL.events.push(a)
  }
  return false
}, makeCEvent:function(a, b) {
  if(typeof a === "number") {
    _memcpy(b, a, SDL.structs.KeyboardEvent.__size__)
  }else {
    switch(a.type) {
      case "keydown":
      ;
      case "keyup":
        var d = a.type === "keydown", c = SDL.keyCodes[a.keyCode] || a.keyCode;
        c >= 65 && c <= 90 && (c = String.fromCharCode(c).toLowerCase().charCodeAt(0));
        HEAP8[b + SDL.structs.KeyboardEvent.type] = d ? 2 : 3;
        HEAP8[b + SDL.structs.KeyboardEvent.which] = 1;
        HEAP8[b + SDL.structs.KeyboardEvent.state] = d ? 1 : 0;
        HEAP8[b + SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.scancode] = c;
        HEAP32[b + SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.sym >> 2] = c;
        HEAP32[b + SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.mod >> 2] = 0;
        break;
      case "keypress":
        break;
      default:
        throw"Unhandled SDL event: " + a.type;
    }
  }
}};
function _SDL_Init() {
  SDL.startTime = Date.now();
  ["keydown", "keyup", "keypress"].forEach(function(a) {
    addEventListener(a, SDL.receiveEvent, true)
  });
  return 0
}
function _SDL_Quit() {
  print("SQL_Quit called (and ignored)")
}
function _SDL_SetVideoMode(a, b, d, c) {
  Module.canvas.width = a;
  Module.canvas.height = b;
  return SDL.screen = SDL.makeSurface(a, b, c)
}
function _SDL_LockSurface(a) {
  var b = SDL.surfaces[a];
  if(!b.image) {
    b.image = b.ctx.getImageData(0, 0, b.width, b.height);
    for(var d = b.image.data, c = d.length, e = 0;e < c / 4;e++) {
      d[e * 4 + 3] = 255
    }
  }
  if(SDL.defaults.copyScreenOnLock) {
    d = b.image.data.length;
    for(e = 0;e < d;e++) {
      HEAP8[b.buffer + e] = b.image.data[e]
    }
  }
  HEAP32[a + 5 * Runtime.QUANTUM_SIZE >> 2] = b.buffer
}
function _SDL_MapRGB(a, b, d, c) {
  return b + (d << 8) + (c << 16)
}
function _SDL_UnlockSurface(a) {
  var a = SDL.surfaces[a], b = a.image.data.length;
  if(a.colors) {
    for(var b = Module.canvas.width, d = Module.canvas.height, c = a.buffer, e = a.image.data, f = a.colors, g = 0;g < d;g++) {
      for(var h = g * b * 4, j = 0;j < b;j++) {
        var l = HEAP8[c++] & 255, l = f[l] || [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)], k = h + j * 4;
        e[k] = l[0];
        e[k + 1] = l[1];
        e[k + 2] = l[2]
      }
      c += b * 3
    }
  }else {
    var e = a.image.data, l = a.buffer;
    assert(l % 4 == 0, "Invalid buffer offset: " + l);
    d = l >> 2;
    for(c = 0;c < b;) {
      var l = HEAP32[d];
      e[c] = l & 255;
      e[c + 1] = l >> 8 & 255;
      e[c + 2] = l >> 16 & 255;
      e[c + 3] = 255;
      d++;
      c += 4
    }
  }
  a.ctx.putImageData(a.image, 0, 0)
}
function _SDL_Flip() {
}
function _pwrite(a, b, d, c) {
  a = FS.streams[a];
  if(!a || a.object.isDevice) {
    return ___setErrNo(ERRNO_CODES.EBADF), -1
  }else {
    if(a.isWrite) {
      if(a.object.isFolder) {
        return ___setErrNo(ERRNO_CODES.EISDIR), -1
      }else {
        if(d < 0 || c < 0) {
          return ___setErrNo(ERRNO_CODES.EINVAL), -1
        }else {
          for(var e = a.object.contents;e.length < c;) {
            e.push(0)
          }
          for(var f = 0;f < d;f++) {
            e[c + f] = HEAPU8[b + f]
          }
          a.object.timestamp = Date.now();
          return f
        }
      }
    }else {
      return ___setErrNo(ERRNO_CODES.EACCES), -1
    }
  }
}
function _write(a, b, d) {
  var c = FS.streams[a];
  if(c) {
    if(c.isWrite) {
      if(d < 0) {
        return ___setErrNo(ERRNO_CODES.EINVAL), -1
      }else {
        if(c.object.isDevice) {
          if(c.object.output) {
            for(a = 0;a < d;a++) {
              try {
                c.object.output(HEAP8[b + a])
              }catch(e) {
                return ___setErrNo(ERRNO_CODES.EIO), -1
              }
            }
            c.object.timestamp = Date.now();
            return a
          }else {
            return ___setErrNo(ERRNO_CODES.ENXIO), -1
          }
        }else {
          return b = _pwrite(a, b, d, c.position), b != -1 && (c.position += b), b
        }
      }
    }else {
      return ___setErrNo(ERRNO_CODES.EACCES), -1
    }
  }else {
    return ___setErrNo(ERRNO_CODES.EBADF), -1
  }
}
function _fwrite(a, b, d, c) {
  d *= b;
  if(d == 0) {
    return 0
  }
  a = _write(c, a, d);
  if(a == -1) {
    if(FS.streams[c]) {
      FS.streams[c].error = true
    }
    return-1
  }else {
    return Math.floor(a / b)
  }
}
function __formatString(a, b) {
  for(var d = a, c = 0, e = function(a) {
    var d;
    a === "float" || a === "double" ? d = (tempDoubleI32[0] = HEAP32[b + c >> 2], tempDoubleI32[1] = HEAP32[b + c + 4 >> 2], tempDoubleF64[0]) : a == "i64" ? (d = [HEAP32[b + c >> 2], HEAP32[b + c + 4 >> 2]], d = unSign(d[0], 32) + unSign(d[1], 32) * Math.pow(2, 32)) : d = HEAP32[b + c >> 2];
    c += Runtime.getNativeFieldSize(a);
    return Number(d)
  }, f = [], g, h;;) {
    var j = d;
    g = HEAP8[d];
    if(g === 0) {
      break
    }
    h = HEAP8[d + 1];
    if(g == "%".charCodeAt(0)) {
      var l = false, k = false, m = false, o = false;
      a:for(;;) {
        switch(h) {
          case "+".charCodeAt(0):
            l = true;
            break;
          case "-".charCodeAt(0):
            k = true;
            break;
          case "#".charCodeAt(0):
            m = true;
            break;
          case "0".charCodeAt(0):
            if(o) {
              break a
            }else {
              o = true;
              break
            }
          ;
          default:
            break a
        }
        d++;
        h = HEAP8[d + 1]
      }
      var p = 0;
      if(h == "*".charCodeAt(0)) {
        p = e("i32"), d++, h = HEAP8[d + 1]
      }else {
        for(;h >= "0".charCodeAt(0) && h <= "9".charCodeAt(0);) {
          p = p * 10 + (h - "0".charCodeAt(0)), d++, h = HEAP8[d + 1]
        }
      }
      var r = false;
      if(h == ".".charCodeAt(0)) {
        var q = 0, r = true;
        d++;
        h = HEAP8[d + 1];
        if(h == "*".charCodeAt(0)) {
          q = e("i32"), d++
        }else {
          for(;;) {
            h = HEAP8[d + 1];
            if(h < "0".charCodeAt(0) || h > "9".charCodeAt(0)) {
              break
            }
            q = q * 10 + (h - "0".charCodeAt(0));
            d++
          }
        }
        h = HEAP8[d + 1]
      }else {
        q = 6
      }
      var n;
      switch(String.fromCharCode(h)) {
        case "h":
          h = HEAP8[d + 2];
          h == "h".charCodeAt(0) ? (d++, n = 1) : n = 2;
          break;
        case "l":
          h = HEAP8[d + 2];
          h == "l".charCodeAt(0) ? (d++, n = 8) : n = 4;
          break;
        case "L":
        ;
        case "q":
        ;
        case "j":
          n = 8;
          break;
        case "z":
        ;
        case "t":
        ;
        case "I":
          n = 4;
          break;
        default:
          n = null
      }
      n && d++;
      h = HEAP8[d + 1];
      if("d,i,u,o,x,X,p".split(",").indexOf(String.fromCharCode(h)) != -1) {
        j = h == "d".charCodeAt(0) || h == "i".charCodeAt(0);
        n = n || 4;
        g = e("i" + n * 8);
        if(n <= 4) {
          var s = Math.pow(256, n) - 1;
          g = (j ? reSign : unSign)(g & s, n * 8)
        }
        var s = Math.abs(g), t, j = "";
        if(h == "d".charCodeAt(0) || h == "i".charCodeAt(0)) {
          t = reSign(g, 8 * n, 1).toString(10)
        }else {
          if(h == "u".charCodeAt(0)) {
            t = unSign(g, 8 * n, 1).toString(10), g = Math.abs(g)
          }else {
            if(h == "o".charCodeAt(0)) {
              t = (m ? "0" : "") + s.toString(8)
            }else {
              if(h == "x".charCodeAt(0) || h == "X".charCodeAt(0)) {
                j = m ? "0x" : "";
                if(g < 0) {
                  g = -g;
                  t = (s - 1).toString(16);
                  m = [];
                  for(s = 0;s < t.length;s++) {
                    m.push((15 - parseInt(t[s], 16)).toString(16))
                  }
                  for(t = m.join("");t.length < n * 2;) {
                    t = "f" + t
                  }
                }else {
                  t = s.toString(16)
                }
                h == "X".charCodeAt(0) && (j = j.toUpperCase(), t = t.toUpperCase())
              }else {
                h == "p".charCodeAt(0) && (s === 0 ? t = "(nil)" : (j = "0x", t = s.toString(16)))
              }
            }
          }
        }
        if(r) {
          for(;t.length < q;) {
            t = "0" + t
          }
        }
        for(l && (j = g < 0 ? "-" + j : "+" + j);j.length + t.length < p;) {
          k ? t += " " : o ? t = "0" + t : j = " " + j
        }
        t = j + t;
        t.split("").forEach(function(a) {
          f.push(a.charCodeAt(0))
        })
      }else {
        if("f,F,e,E,g,G".split(",").indexOf(String.fromCharCode(h)) != -1) {
          g = e(n === 4 ? "float" : "double");
          if(isNaN(g)) {
            t = "nan", o = false
          }else {
            if(isFinite(g)) {
              r = false;
              n = Math.min(q, 20);
              if(h == "g".charCodeAt(0) || h == "G".charCodeAt(0)) {
                r = true, q = q || 1, n = parseInt(g.toExponential(n).split("e")[1], 10), q > n && n >= -4 ? (h = (h == "g".charCodeAt(0) ? "f" : "F").charCodeAt(0), q -= n + 1) : (h = (h == "g".charCodeAt(0) ? "e" : "E").charCodeAt(0), q--), n = Math.min(q, 20)
              }
              if(h == "e".charCodeAt(0) || h == "E".charCodeAt(0)) {
                t = g.toExponential(n), /[eE][-+]\d$/.test(t) && (t = t.slice(0, -1) + "0" + t.slice(-1))
              }else {
                if(h == "f".charCodeAt(0) || h == "F".charCodeAt(0)) {
                  t = g.toFixed(n)
                }
              }
              j = t.split("e");
              if(r && !m) {
                for(;j[0].length > 1 && j[0].indexOf(".") != -1 && (j[0].slice(-1) == "0" || j[0].slice(-1) == ".");) {
                  j[0] = j[0].slice(0, -1)
                }
              }else {
                for(m && t.indexOf(".") == -1 && (j[0] += ".");q > n++;) {
                  j[0] += "0"
                }
              }
              t = j[0] + (j.length > 1 ? "e" + j[1] : "");
              h == "E".charCodeAt(0) && (t = t.toUpperCase());
              l && g >= 0 && (t = "+" + t)
            }else {
              t = (g < 0 ? "-" : "") + "inf", o = false
            }
          }
          for(;t.length < p;) {
            k ? t += " " : t = o && (t[0] == "-" || t[0] == "+") ? t[0] + "0" + t.slice(1) : (o ? "0" : " ") + t
          }
          h < "a".charCodeAt(0) && (t = t.toUpperCase());
          t.split("").forEach(function(a) {
            f.push(a.charCodeAt(0))
          })
        }else {
          if(h == "s".charCodeAt(0)) {
            (l = e("i8*")) ? (l = String_copy(l), r && l.length > q && (l = l.slice(0, q))) : l = intArrayFromString("(null)", true);
            if(!k) {
              for(;l.length < p--;) {
                f.push(" ".charCodeAt(0))
              }
            }
            f = f.concat(l);
            if(k) {
              for(;l.length < p--;) {
                f.push(" ".charCodeAt(0))
              }
            }
          }else {
            if(h == "c".charCodeAt(0)) {
              for(k && f.push(e("i8"));--p > 0;) {
                f.push(" ".charCodeAt(0))
              }
              k || f.push(e("i8"))
            }else {
              if(h == "n".charCodeAt(0)) {
                k = e("i32*"), HEAP32[k >> 2] = f.length
              }else {
                if(h == "%".charCodeAt(0)) {
                  f.push(g)
                }else {
                  for(s = j;s < d + 2;s++) {
                    f.push(HEAP8[s])
                  }
                }
              }
            }
          }
        }
      }
      d += 2
    }else {
      f.push(g), d += 1
    }
  }
  return f
}
function _fprintf(a, b, d) {
  d = __formatString(b, d);
  b = Runtime.stackSave();
  a = _fwrite(allocate(d, "i8", ALLOC_STACK), 1, d.length, a);
  Runtime.stackRestore(b);
  return a
}
function _printf(a, b) {
  return _fprintf(HEAP32[_stdout >> 2], a, b)
}
function __exit(a) {
  __shutdownRuntime__();
  ABORT = true;
  throw"exit(" + a + ") called, at " + Error().stack;
}
function _exit(a) {
  __exit(a)
}
var _llvm_memset_p0i8_i64 = _memset;
function _memmove(a, b, d) {
  if(d !== 0) {
    var c = _malloc(d);
    _memcpy(c, b, d);
    _memcpy(a, c, d);
    _free(c)
  }
}
var _llvm_memmove_p0i8_p0i8_i32 = _memmove;
function _strlen(a) {
  return String_len(a)
}
function _fputs(a, b) {
  return _write(b, a, _strlen(a))
}
function _fputc(a, b) {
  var d = unSign(a & 255);
  HEAP8[_fputc.ret] = d;
  if(_write(b, _fputc.ret, 1) == -1) {
    if(b in FS.streams) {
      FS.streams[b].error = true
    }
    return-1
  }else {
    return d
  }
}
function _puts(a) {
  var b = HEAP32[_stdout >> 2], a = _fputs(a, b);
  return a < 0 ? a : _fputc("\n".charCodeAt(0), b) < 0 ? -1 : a + 1
}
FS.init();
__ATEXIT__.push({func:function() {
  FS.quit()
}});
___setErrNo(0);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module.callMain = function(a) {
  function b() {
    for(var a = 0;a < 3;a++) {
      c.push(0)
    }
  }
  var d = a.length + 1, c = [allocate(intArrayFromString("/bin/this.program"), "i8", ALLOC_STATIC)];
  b();
  for(var e = 0;e < d - 1;e += 1) {
    c.push(allocate(intArrayFromString(a[e]), "i8", ALLOC_STATIC)), b()
  }
  c.push(0);
  c = allocate(c, "i32", ALLOC_STATIC);
  return _main(d, c, 0)
};
var _qpDiv6, _qpMod6, _levelScale, _h264bsdQpC, _stuffingTable, _CeilLog2NumSliceGroups, _dcCoeffIndex, _codedBlockPatternIntra4x4, _codedBlockPatternInter, _runBefore_1, _runBefore_2, _runBefore_3, _runBefore_4, _runBefore_5, _runBefore_6, _totalZeros_1_0, _totalZeros_1_1, _totalZeros_2, _totalZeros_3, _totalZeros_4, _totalZeros_5, _totalZeros_6, _totalZeros_7, _totalZeros_8, _totalZeros_9, _totalZeros_10, _totalZeros_11, _totalZeros_12, _totalZeros_13, _totalZeros_14, _coeffToken0_0, _coeffToken0_1, 
_coeffToken0_2, _coeffToken0_3, _coeffToken2_0, _coeffToken2_1, _coeffToken2_2, _coeffToken4_0, _coeffToken4_1, _coeffToken8, _coeffTokenMinus1_0, _coeffTokenMinus1_1, _N_D_4x4B, _N_C_4x4B, _N_B_4x4B, _N_A_4x4B, _h264bsdBlockX, _h264bsdBlockY, _h264bsdClip, _N_D_SUB_PART, _N_C_SUB_PART, _N_B_SUB_PART, _N_A_SUB_PART, _lumaFracPos, _sample, _hashA, _hashB, _hashC, _hashD, _alphas, _betas, _tc0, _tagName, _streamStop, _packetize, _nalUnitStream, _foutput, _screen, _maxNumPics, _tmpImage, _numErrors, 
_cropDisplay, _disableOutputReordering, _decInput, _decVer, __str, _i, __str1, __str2, __str3, __str4, __str5, __str6, __str7, _strmLen, _byteStrmStart, _decInst, _ret, _tmp, _picDisplayNumber, _picDecodeNumber, _decPicture, _imageData, _decInfo, _decOutput, _picSize, __str9, _NextPacket_prevIndex, _str, _str1;
_qpDiv6 = allocate([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8], "i8", ALLOC_STATIC);
_qpMod6 = allocate([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3], "i8", ALLOC_STATIC);
_levelScale = allocate([10, 0, 0, 0, 13, 0, 0, 0, 16, 0, 0, 0, 11, 0, 0, 0, 14, 0, 0, 0, 18, 0, 0, 0, 13, 0, 0, 0, 16, 0, 0, 0, 20, 0, 0, 0, 14, 0, 0, 0, 18, 0, 0, 0, 23, 0, 0, 0, 16, 0, 0, 0, 20, 0, 0, 0, 25, 0, 0, 0, 18, 0, 0, 0, 23, 0, 0, 0, 29, 0, 0, 0], ["i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 
0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_h264bsdQpC = allocate([0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0, 16, 0, 0, 0, 17, 0, 0, 0, 18, 0, 0, 0, 19, 0, 0, 0, 20, 0, 0, 0, 21, 0, 0, 0, 22, 0, 0, 0, 23, 0, 0, 0, 24, 0, 0, 0, 25, 0, 0, 0, 26, 0, 0, 0, 27, 0, 0, 0, 28, 0, 0, 0, 29, 0, 0, 0, 29, 0, 0, 0, 30, 0, 0, 0, 31, 0, 0, 0, 32, 0, 0, 0, 32, 0, 0, 0, 33, 0, 0, 0, 34, 0, 0, 0, 34, 0, 
0, 0, 35, 0, 0, 0, 35, 0, 0, 0, 36, 0, 0, 0, 36, 0, 0, 0, 37, 0, 0, 0, 37, 0, 0, 0, 37, 0, 0, 0, 38, 0, 0, 0, 38, 0, 0, 0, 38, 0, 0, 0, 39, 0, 0, 0, 39, 0, 0, 0, 39, 0, 0, 0, 39, 0, 0, 0], ["i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 
0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 
0, "i32", 0, 0, 0], ALLOC_STATIC);
_stuffingTable = allocate([1, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 16, 0, 0, 0, 32, 0, 0, 0, 64, 0, 0, 0, 128, 0, 0, 0], ["i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_CeilLog2NumSliceGroups = allocate([1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0], ["i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_dcCoeffIndex = allocate([0, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0], ["i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_codedBlockPatternIntra4x4 = allocate([47, 31, 15, 0, 23, 27, 29, 30, 7, 11, 13, 14, 39, 43, 45, 46, 16, 3, 5, 10, 12, 19, 21, 26, 28, 35, 37, 42, 44, 1, 2, 4, 8, 17, 18, 20, 24, 6, 9, 22, 25, 32, 33, 34, 36, 40, 38, 41], "i8", ALLOC_STATIC);
_codedBlockPatternInter = allocate([0, 16, 1, 2, 4, 8, 32, 3, 5, 10, 12, 15, 47, 7, 11, 13, 14, 6, 9, 31, 35, 37, 42, 44, 33, 34, 36, 40, 39, 43, 45, 46, 17, 18, 20, 24, 19, 21, 26, 28, 23, 27, 29, 30, 22, 25, 38, 41], "i8", ALLOC_STATIC);
_runBefore_1 = allocate([17, 1], "i8", ALLOC_STATIC);
_runBefore_2 = allocate([34, 18, 1, 1], "i8", ALLOC_STATIC);
_runBefore_3 = allocate([50, 34, 18, 2], "i8", ALLOC_STATIC);
_runBefore_4 = allocate([67, 51, 34, 34, 18, 18, 2, 2], "i8", ALLOC_STATIC);
_runBefore_5 = allocate([83, 67, 51, 35, 18, 18, 2, 2], "i8", ALLOC_STATIC);
_runBefore_6 = allocate([19, 35, 67, 51, 99, 83, 2, 2], "i8", ALLOC_STATIC);
_totalZeros_1_0 = allocate([0, 0, 101, 85, 68, 68, 52, 52, 35, 35, 35, 35, 19, 19, 19, 19, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], "i8", ALLOC_STATIC);
_totalZeros_1_1 = allocate([0, 249, 233, 217, 200, 200, 184, 184, 167, 167, 167, 167, 151, 151, 151, 151, 134, 134, 134, 134, 134, 134, 134, 134, 118, 118, 118, 118, 118, 118, 118, 118], "i8", ALLOC_STATIC);
_totalZeros_2 = allocate([230, 214, 198, 182, 165, 165, 149, 149, 132, 132, 132, 132, 116, 116, 116, 116, 100, 100, 100, 100, 84, 84, 84, 84, 67, 67, 67, 67, 67, 67, 67, 67, 51, 51, 51, 51, 51, 51, 51, 51, 35, 35, 35, 35, 35, 35, 35, 35, 19, 19, 19, 19, 19, 19, 19, 19, 3, 3, 3, 3, 3, 3, 3, 3], "i8", ALLOC_STATIC);
_totalZeros_3 = allocate([214, 182, 197, 197, 165, 165, 149, 149, 132, 132, 132, 132, 84, 84, 84, 84, 68, 68, 68, 68, 4, 4, 4, 4, 115, 115, 115, 115, 115, 115, 115, 115, 99, 99, 99, 99, 99, 99, 99, 99, 51, 51, 51, 51, 51, 51, 51, 51, 35, 35, 35, 35, 35, 35, 35, 35, 19, 19, 19, 19, 19, 19, 19, 19], "i8", ALLOC_STATIC);
_totalZeros_4 = allocate([197, 181, 165, 5, 148, 148, 116, 116, 52, 52, 36, 36, 131, 131, 131, 131, 99, 99, 99, 99, 83, 83, 83, 83, 67, 67, 67, 67, 19, 19, 19, 19], "i8", ALLOC_STATIC);
_totalZeros_5 = allocate([181, 149, 164, 164, 132, 132, 36, 36, 20, 20, 4, 4, 115, 115, 115, 115, 99, 99, 99, 99, 83, 83, 83, 83, 67, 67, 67, 67, 51, 51, 51, 51], "i8", ALLOC_STATIC);
_totalZeros_6 = allocate([166, 6, 21, 21, 132, 132, 132, 132, 147, 147, 147, 147, 147, 147, 147, 147, 115, 115, 115, 115, 115, 115, 115, 115, 99, 99, 99, 99, 99, 99, 99, 99, 83, 83, 83, 83, 83, 83, 83, 83, 67, 67, 67, 67, 67, 67, 67, 67, 51, 51, 51, 51, 51, 51, 51, 51, 35, 35, 35, 35, 35, 35, 35, 35], "i8", ALLOC_STATIC);
_totalZeros_7 = allocate([150, 6, 21, 21, 116, 116, 116, 116, 131, 131, 131, 131, 131, 131, 131, 131, 99, 99, 99, 99, 99, 99, 99, 99, 67, 67, 67, 67, 67, 67, 67, 67, 51, 51, 51, 51, 51, 51, 51, 51, 35, 35, 35, 35, 35, 35, 35, 35, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82], "i8", ALLOC_STATIC);
_totalZeros_8 = allocate([134, 6, 37, 37, 20, 20, 20, 20, 115, 115, 115, 115, 115, 115, 115, 115, 99, 99, 99, 99, 99, 99, 99, 99, 51, 51, 51, 51, 51, 51, 51, 51, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66], "i8", ALLOC_STATIC);
_totalZeros_9 = allocate([22, 6, 117, 117, 36, 36, 36, 36, 83, 83, 83, 83, 83, 83, 83, 83, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50], "i8", ALLOC_STATIC);
_totalZeros_10 = allocate([21, 5, 100, 100, 35, 35, 35, 35, 82, 82, 82, 82, 82, 82, 82, 82, 66, 66, 66, 66, 66, 66, 66, 66, 50, 50, 50, 50, 50, 50, 50, 50], "i8", ALLOC_STATIC);
_totalZeros_11 = allocate([4, 20, 35, 35, 51, 51, 83, 83, 65, 65, 65, 65, 65, 65, 65, 65], "i8", ALLOC_STATIC);
_totalZeros_12 = allocate([4, 20, 67, 67, 34, 34, 34, 34, 49, 49, 49, 49, 49, 49, 49, 49], "i8", ALLOC_STATIC);
_totalZeros_13 = allocate([3, 19, 50, 50, 33, 33, 33, 33], "i8", ALLOC_STATIC);
_totalZeros_14 = allocate([2, 18, 33, 33], "i8", ALLOC_STATIC);
_coeffToken0_0 = allocate([0, 0, 0, 0, 0, 0, 8294, 0, 4134, 0, 2054, 0, 6245, 0, 6245, 0, 4163, 0, 4163, 0, 4163, 0, 4163, 0, 4163, 0, 4163, 0, 4163, 0, 4163, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0, 2082, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffToken0_1 = allocate([0, 0, 0, 0, 0, 0, 0, 0, 16490, 0, 12362, 0, 10282, 0, 8202, 0, 14441, 0, 14441, 0, 10313, 0, 10313, 0, 8233, 0, 8233, 0, 6153, 0, 6153, 0, 12392, 0, 12392, 0, 12392, 0, 12392, 0, 8264, 0, 8264, 0, 8264, 0, 8264, 0, 6184, 0, 6184, 0, 6184, 0, 6184, 0, 4104, 0, 4104, 0, 4104, 0, 4104, 0, 10343, 0, 10343, 0, 10343, 0, 10343, 0, 10343, 0, 10343, 0, 10343, 0, 10343, 0, 6215, 0, 6215, 0, 6215, 0, 6215, 0, 6215, 0, 6215, 0, 6215, 0, 6215, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffToken0_2 = allocate([24686, 0, 22606, 0, 20526, 0, 20494, 0, 22638, 0, 20558, 0, 18478, 0, 18446, 0, 16397, 0, 16397, 0, 18509, 0, 18509, 0, 16429, 0, 16429, 0, 14349, 0, 14349, 0, 20589, 0, 20589, 0, 16461, 0, 16461, 0, 14381, 0, 14381, 0, 12301, 0, 12301, 0, 18539, 0, 18539, 0, 18539, 0, 18539, 0, 18539, 0, 18539, 0, 18539, 0, 18539, 0, 14411, 0, 14411, 0, 14411, 0, 14411, 0, 14411, 0, 14411, 0, 14411, 0, 14411, 0, 12331, 0, 12331, 0, 12331, 0, 12331, 0, 12331, 0, 12331, 0, 12331, 0, 12331, 
0, 10251, 0, 10251, 0, 10251, 0, 10251, 0, 10251, 0, 10251, 0, 10251, 0, 10251, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffToken0_3 = allocate([0, 0, 0, 0, 26671, 0, 26671, 0, -32752, 0, -32688, 0, -32720, 0, 30736, 0, -32656, 0, 30800, 0, 30768, 0, 28688, 0, 30832, 0, 28752, 0, 28720, 0, 26640, 0, 28783, 0, 28783, 0, 26703, 0, 26703, 0, 24623, 0, 24623, 0, 24591, 0, 24591, 0, 26735, 0, 26735, 0, 24655, 0, 24655, 0, 22575, 0, 22575, 0, 22543, 0, 22543, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffToken2_0 = allocate([0, 0, 0, 0, 0, 0, 0, 0, 14438, 0, 8262, 0, 8230, 0, 4102, 0, 12390, 0, 6214, 0, 6182, 0, 2054, 0, 10341, 0, 10341, 0, 4133, 0, 4133, 0, 8292, 0, 8292, 0, 8292, 0, 8292, 0, 6244, 0, 6244, 0, 6244, 0, 6244, 0, 4163, 0, 4163, 0, 4163, 0, 4163, 0, 4163, 0, 4163, 0, 4163, 0, 4163, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffToken2_1 = allocate([0, 0, 0, 0, 0, 0, 0, 0, 18537, 0, 14409, 0, 14377, 0, 12297, 0, 10248, 0, 10248, 0, 12360, 0, 12360, 0, 12328, 0, 12328, 0, 8200, 0, 8200, 0, 16487, 0, 16487, 0, 16487, 0, 16487, 0, 10311, 0, 10311, 0, 10311, 0, 10311, 0, 10279, 0, 10279, 0, 10279, 0, 10279, 0, 6151, 0, 6151, 0, 6151, 0, 6151, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffToken2_2 = allocate([0, 0, 0, 0, 30829, 0, 30829, 0, -32658, 0, -32690, 0, -32722, 0, -32754, 0, 30766, 0, 30734, 0, 30798, 0, 28718, 0, 28749, 0, 28749, 0, 28685, 0, 28685, 0, 28781, 0, 28781, 0, 26701, 0, 26701, 0, 26669, 0, 26669, 0, 26637, 0, 26637, 0, 26733, 0, 26733, 0, 24653, 0, 24653, 0, 24621, 0, 24621, 0, 24589, 0, 24589, 0, 22540, 0, 22540, 0, 22540, 0, 22540, 0, 22604, 0, 22604, 0, 22604, 0, 22604, 0, 22572, 0, 22572, 0, 22572, 0, 22572, 0, 20492, 0, 20492, 0, 20492, 0, 20492, 0, 
24684, 0, 24684, 0, 24684, 0, 24684, 0, 20556, 0, 20556, 0, 20556, 0, 20556, 0, 20524, 0, 20524, 0, 20524, 0, 20524, 0, 18444, 0, 18444, 0, 18444, 0, 18444, 0, 22635, 0, 22635, 0, 22635, 0, 22635, 0, 22635, 0, 22635, 0, 22635, 0, 22635, 0, 18507, 0, 18507, 0, 18507, 0, 18507, 0, 18507, 0, 18507, 0, 18507, 0, 18507, 0, 18475, 0, 18475, 0, 18475, 0, 18475, 0, 18475, 0, 18475, 0, 18475, 0, 18475, 0, 16395, 0, 16395, 0, 16395, 0, 16395, 0, 16395, 0, 16395, 0, 16395, 0, 16395, 0, 20587, 0, 20587, 0, 20587, 
0, 20587, 0, 20587, 0, 20587, 0, 20587, 0, 20587, 0, 16459, 0, 16459, 0, 16459, 0, 16459, 0, 16459, 0, 16459, 0, 16459, 0, 16459, 0, 16427, 0, 16427, 0, 16427, 0, 16427, 0, 16427, 0, 16427, 0, 16427, 0, 16427, 0, 14347, 0, 14347, 0, 14347, 0, 14347, 0, 14347, 0, 14347, 0, 14347, 0, 14347, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, 
"i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffToken4_0 = allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6150, 0, 14406, 0, 14374, 0, 4102, 0, 18534, 0, 12358, 0, 12326, 0, 2054, 0, 10277, 0, 10277, 0, 10309, 0, 10309, 0, 8229, 0, 8229, 0, 8261, 0, 8261, 0, 6181, 0, 6181, 0, 16485, 0, 16485, 0, 6213, 0, 6213, 0, 4133, 0, 4133, 0, 14436, 0, 14436, 0, 14436, 0, 14436, 0, 12388, 0, 12388, 0, 12388, 0, 12388, 0, 10340, 0, 10340, 0, 10340, 0, 10340, 0, 8292, 0, 8292, 0, 8292, 0, 8292, 0, 6244, 0, 6244, 0, 6244, 0, 6244, 0, 4164, 0, 
4164, 0, 4164, 0, 4164, 0, 2084, 0, 2084, 0, 2084, 0, 2084, 0, 4, 0, 4, 0, 4, 0, 4, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffToken4_1 = allocate([0, 0, -32758, 0, -32662, 0, -32694, 0, -32726, 0, 30730, 0, 30826, 0, 30794, 0, 30762, 0, 28682, 0, 28778, 0, 28746, 0, 28714, 0, 26634, 0, 26665, 0, 26665, 0, 24585, 0, 24585, 0, 26697, 0, 26697, 0, 24617, 0, 24617, 0, 22537, 0, 22537, 0, 26729, 0, 26729, 0, 24649, 0, 24649, 0, 22569, 0, 22569, 0, 20489, 0, 20489, 0, 24680, 0, 24680, 0, 24680, 0, 24680, 0, 22600, 0, 22600, 0, 22600, 0, 22600, 0, 20520, 0, 20520, 0, 20520, 0, 20520, 0, 18440, 0, 18440, 0, 18440, 0, 18440, 
0, 22632, 0, 22632, 0, 22632, 0, 22632, 0, 20552, 0, 20552, 0, 20552, 0, 20552, 0, 18472, 0, 18472, 0, 18472, 0, 18472, 0, 16392, 0, 16392, 0, 16392, 0, 16392, 0, 14343, 0, 14343, 0, 14343, 0, 14343, 0, 14343, 0, 14343, 0, 14343, 0, 14343, 0, 12295, 0, 12295, 0, 12295, 0, 12295, 0, 12295, 0, 12295, 0, 12295, 0, 12295, 0, 18503, 0, 18503, 0, 18503, 0, 18503, 0, 18503, 0, 18503, 0, 18503, 0, 18503, 0, 10247, 0, 10247, 0, 10247, 0, 10247, 0, 10247, 0, 10247, 0, 10247, 0, 10247, 0, 20583, 0, 20583, 0, 
20583, 0, 20583, 0, 20583, 0, 20583, 0, 20583, 0, 20583, 0, 16455, 0, 16455, 0, 16455, 0, 16455, 0, 16455, 0, 16455, 0, 16455, 0, 16455, 0, 16423, 0, 16423, 0, 16423, 0, 16423, 0, 16423, 0, 16423, 0, 16423, 0, 16423, 0, 8199, 0, 8199, 0, 8199, 0, 8199, 0, 8199, 0, 8199, 0, 8199, 0, 8199, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, 
"i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffToken8 = allocate([2054, 0, 2086, 0, 0, 0, 6, 0, 4102, 0, 4134, 0, 4166, 0, 0, 0, 6150, 0, 6182, 0, 6214, 0, 6246, 0, 8198, 0, 8230, 0, 8262, 0, 8294, 0, 10246, 0, 10278, 0, 10310, 0, 10342, 0, 12294, 0, 12326, 0, 12358, 0, 12390, 0, 14342, 0, 14374, 0, 14406, 0, 14438, 0, 16390, 0, 16422, 0, 16454, 0, 16486, 0, 18438, 0, 18470, 0, 18502, 0, 18534, 0, 20486, 0, 20518, 0, 20550, 0, 20582, 0, 22534, 0, 22566, 0, 22598, 0, 22630, 0, 24582, 0, 24614, 0, 24646, 0, 24678, 0, 26630, 0, 26662, 0, 26694, 
0, 26726, 0, 28678, 0, 28710, 0, 28742, 0, 28774, 0, 30726, 0, 30758, 0, 30790, 0, 30822, 0, -32762, 0, -32730, 0, -32698, 0, -32666, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 
0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffTokenMinus1_0 = allocate([0, 0, 4163, 0, 2, 0, 2, 0, 2081, 0, 2081, 0, 2081, 0, 2081, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_coeffTokenMinus1_1 = allocate([8295, 0, 8295, 0, 8264, 0, 8232, 0, 6215, 0, 6215, 0, 6183, 0, 6183, 0, 8198, 0, 8198, 0, 8198, 0, 8198, 0, 6150, 0, 6150, 0, 6150, 0, 6150, 0, 4102, 0, 4102, 0, 4102, 0, 4102, 0, 6246, 0, 6246, 0, 6246, 0, 6246, 0, 4134, 0, 4134, 0, 4134, 0, 4134, 0, 2054, 0, 2054, 0, 2054, 0, 2054, 0], ["i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, 
"i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0, "i16", 0], ALLOC_STATIC);
_N_D_4x4B = allocate([3, 0, 0, 0, 15, undef, 0, 0, 1, 0, 0, 0, 10, undef, 0, 0, 0, 0, 0, 0, 5, undef, 0, 0, 4, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 11, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 4, 0, 0, 0, 4, undef, 0, 0, 0, 0, 0, 0, 7, undef, 0, 0, 4, 0, 0, 0, 2, undef, 0, 0, 0, 0, 0, 0, 13, undef, 0, 0, 4, 0, 0, 0, 8, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 4, 0, 0, 0, 12, undef, 0, 0, 3, 0, 0, 0, 19, undef, 0, 
0, 1, 0, 0, 0, 18, undef, 0, 0, 0, 0, 0, 0, 17, undef, 0, 0, 4, 0, 0, 0, 16, undef, 0, 0, 3, 0, 0, 0, 23, undef, 0, 0, 1, 0, 0, 0, 22, undef, 0, 0, 0, 0, 0, 0, 21, undef, 0, 0, 4, 0, 0, 0, 20, undef, 0, 0], ["i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 
0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", 
"i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8"], ALLOC_STATIC);
_N_C_4x4B = allocate([1, 0, 0, 0, 11, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 255, 0, 0, 0, 4, undef, 0, 0, 1, 0, 0, 0, 15, undef, 0, 0, 2, 0, 0, 0, 10, undef, 0, 0, 4, 0, 0, 0, 5, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 255, 0, 0, 0, 12, undef, 0, 0, 4, 0, 0, 0, 7, undef, 0, 0, 255, 0, 0, 0, 2, undef, 0, 0, 4, 0, 0, 0, 13, undef, 0, 0, 255, 0, 0, 0, 8, undef, 0, 0, 1, 0, 0, 0, 19, 
undef, 0, 0, 2, 0, 0, 0, 18, undef, 0, 0, 4, 0, 0, 0, 17, undef, 0, 0, 255, 0, 0, 0, 16, undef, 0, 0, 1, 0, 0, 0, 23, undef, 0, 0, 2, 0, 0, 0, 22, undef, 0, 0, 4, 0, 0, 0, 21, undef, 0, 0, 255, 0, 0, 0, 20, undef, 0, 0], ["i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", 
"i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", 
"i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8"], ALLOC_STATIC);
_N_B_4x4B = allocate([1, 0, 0, 0, 10, undef, 0, 0, 1, 0, 0, 0, 11, undef, 0, 0, 4, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 1, 0, 0, 0, 15, undef, 0, 0, 4, 0, 0, 0, 4, undef, 0, 0, 4, 0, 0, 0, 5, undef, 0, 0, 4, 0, 0, 0, 2, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 8, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 4, 0, 0, 0, 7, undef, 0, 0, 4, 0, 0, 0, 12, undef, 0, 0, 4, 0, 0, 0, 13, undef, 0, 0, 1, 0, 0, 0, 18, undef, 0, 
0, 1, 0, 0, 0, 19, undef, 0, 0, 4, 0, 0, 0, 16, undef, 0, 0, 4, 0, 0, 0, 17, undef, 0, 0, 1, 0, 0, 0, 22, undef, 0, 0, 1, 0, 0, 0, 23, undef, 0, 0, 4, 0, 0, 0, 20, undef, 0, 0, 4, 0, 0, 0, 21, undef, 0, 0], ["i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 
0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", 
"i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8"], ALLOC_STATIC);
_N_A_4x4B = allocate([0, 0, 0, 0, 5, undef, 0, 0, 4, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 7, undef, 0, 0, 4, 0, 0, 0, 2, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 4, 0, 0, 0, 4, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 0, 0, 0, 0, 13, undef, 0, 0, 4, 0, 0, 0, 8, undef, 0, 0, 0, 0, 0, 0, 15, undef, 0, 0, 4, 0, 0, 0, 10, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 4, 0, 0, 0, 12, undef, 0, 0, 4, 0, 0, 0, 11, undef, 0, 0, 4, 0, 0, 0, 14, undef, 0, 0, 0, 0, 0, 0, 17, undef, 0, 
0, 4, 0, 0, 0, 16, undef, 0, 0, 0, 0, 0, 0, 19, undef, 0, 0, 4, 0, 0, 0, 18, undef, 0, 0, 0, 0, 0, 0, 21, undef, 0, 0, 4, 0, 0, 0, 20, undef, 0, 0, 0, 0, 0, 0, 23, undef, 0, 0, 4, 0, 0, 0, 22, undef, 0, 0], ["i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 
0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", 
"i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8"], ALLOC_STATIC);
_h264bsdBlockX = allocate([0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0], ["i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_h264bsdBlockY = allocate([0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 0], ["i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_h264bsdClip = allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 
111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 
212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 
255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 
255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 
255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 
255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 
255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], "i8", ALLOC_STATIC);
_N_D_SUB_PART = allocate([3, 0, 0, 0, 15, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 3, 0, 0, 0, 15, undef, 0, 0, 0, 0, 0, 0, 5, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 3, 0, 0, 0, 15, undef, 0, 0, 1, 0, 0, 0, 10, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 3, 0, 0, 0, 15, undef, 0, 0, 1, 0, 0, 0, 10, undef, 0, 0, 0, 0, 0, 0, 5, undef, 0, 0, 4, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 
0, 11, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 11, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 11, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 11, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 4, 0, 0, 0, 4, undef, 0, 0, 0, 0, 0, 0, 7, undef, 0, 0, 255, 0, 0, 0, 
0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 7, undef, 0, 0, 0, 0, 0, 0, 13, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 7, undef, 0, 0, 4, 0, 0, 0, 2, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 7, undef, 0, 0, 4, 0, 0, 0, 2, undef, 0, 0, 0, 0, 0, 0, 13, undef, 0, 0, 4, 0, 0, 0, 8, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 
0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 4, 0, 0, 0, 12, undef, 0, 0], ["i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", 
"i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", 
"i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 
0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", 
"i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 
0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8"], ALLOC_STATIC);
_N_C_SUB_PART = allocate([1, 0, 0, 0, 14, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 255, 0, 0, 0, 4, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 11, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 11, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 255, 0, 0, 0, 4, undef, 0, 0, 2, 
0, 0, 0, 10, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 2, 0, 0, 0, 10, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 15, undef, 0, 0, 2, 0, 0, 0, 10, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 15, undef, 0, 0, 2, 0, 0, 0, 10, undef, 0, 0, 4, 0, 0, 0, 5, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 255, 
0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 255, 0, 0, 0, 12, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 255, 0, 0, 0, 12, undef, 0, 0, 255, 0, 0, 0, 2, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 
0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 2, undef, 0, 0, 255, 0, 0, 0, 8, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 7, undef, 0, 0, 255, 0, 0, 0, 2, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 7, undef, 0, 0, 255, 0, 0, 0, 2, undef, 0, 0, 4, 0, 0, 0, 13, undef, 0, 0, 255, 0, 0, 0, 8, undef, 0, 0], ["i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 
0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", 
"i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, 
"i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", 
"i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", 
"i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8"], ALLOC_STATIC);
_N_B_SUB_PART = allocate([1, 0, 0, 0, 10, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 10, undef, 0, 0, 4, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 10, undef, 0, 0, 1, 0, 0, 0, 11, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 10, undef, 0, 0, 1, 0, 0, 0, 11, undef, 0, 0, 4, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 1, 0, 0, 
0, 14, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 4, 0, 0, 0, 4, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 1, 0, 0, 0, 15, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 1, 0, 0, 0, 14, undef, 0, 0, 1, 0, 0, 0, 15, undef, 0, 0, 4, 0, 0, 0, 4, undef, 0, 0, 4, 0, 0, 0, 5, undef, 0, 0, 4, 0, 0, 0, 2, undef, 0, 0, 255, 0, 0, 0, 
0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 2, undef, 0, 0, 4, 0, 0, 0, 8, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 2, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 2, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 8, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 
0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 4, 0, 0, 0, 12, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 4, 0, 0, 0, 7, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 4, 0, 0, 0, 7, undef, 0, 0, 4, 0, 0, 0, 12, undef, 0, 0, 4, 0, 0, 0, 13, undef, 0, 0], ["i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", 
"i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", 
"i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 
0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", 
"i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 
0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8"], ALLOC_STATIC);
_N_A_SUB_PART = allocate([0, 0, 0, 0, 5, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 5, undef, 0, 0, 0, 0, 0, 0, 7, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 5, undef, 0, 0, 4, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 5, undef, 0, 0, 4, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 7, undef, 0, 0, 4, 0, 0, 0, 2, undef, 0, 0, 4, 0, 0, 0, 1, 
undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 4, 0, 0, 0, 4, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 1, undef, 0, 0, 4, 0, 0, 0, 4, undef, 0, 0, 4, 0, 0, 0, 3, undef, 0, 0, 4, 0, 0, 0, 6, undef, 0, 0, 0, 0, 0, 0, 13, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 
0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 13, undef, 0, 0, 0, 0, 0, 0, 15, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 13, undef, 0, 0, 4, 0, 0, 0, 8, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 0, 0, 0, 0, 13, undef, 0, 0, 4, 0, 0, 0, 8, undef, 0, 0, 0, 0, 0, 0, 15, undef, 0, 0, 4, 0, 0, 0, 10, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 
255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 4, 0, 0, 0, 11, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 4, 0, 0, 0, 12, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 255, 0, 0, 0, 0, undef, 0, 0, 4, 0, 0, 0, 9, undef, 0, 0, 4, 0, 0, 0, 12, undef, 0, 0, 4, 0, 0, 0, 11, undef, 0, 0, 4, 0, 0, 0, 14, undef, 0, 0], ["i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", 
"i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", 
"i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 
0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", 
"i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 
0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8", "i32", 0, 0, 0, "i8", "i8", "i8", "i8"], ALLOC_STATIC);
_lumaFracPos = allocate([0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0], ["i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_sample = allocate(1, "i32", ALLOC_STATIC);
_hashA = allocate(1, "i32", ALLOC_STATIC);
_hashB = allocate(1, "i32", ALLOC_STATIC);
_hashC = allocate(1, "i32", ALLOC_STATIC);
_hashD = allocate(1, "i32", ALLOC_STATIC);
_alphas = allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15, 17, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 71, 80, 90, 101, 113, 127, 144, 162, 182, 203, 226, 255, 255], "i8", ALLOC_STATIC);
_betas = allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18], "i8", ALLOC_STATIC);
_tc0 = allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 3, 1, 2, 3, 2, 2, 3, 2, 2, 4, 2, 3, 4, 2, 3, 4, 3, 3, 5, 3, 4, 6, 3, 4, 6, 4, 5, 7, 4, 5, 8, 4, 6, 9, 5, 7, 10, 6, 8, 11, 6, 8, 13, 7, 10, 14, 8, 11, 16, 9, 12, 18, 10, 13, 20, 11, 15, 23, 13, 17, 25], 
"i8", ALLOC_STATIC);
_tagName = allocate([36, 78, 97, 109, 101, 58, 32, 70, 73, 82, 83, 84, 95, 65, 78, 68, 82, 79, 73, 68, 95, 67, 79, 80, 89, 82, 73, 71, 72, 84, 32, 36, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "i8", ALLOC_STATIC);
_streamStop = allocate(1, "i8*", ALLOC_STATIC);
_packetize = allocate(1, "i32", ALLOC_STATIC);
_nalUnitStream = allocate(1, "i32", ALLOC_STATIC);
_foutput = allocate(1, "%struct.__sFILE*", ALLOC_STATIC);
_screen = allocate(1, "%struct.SDL_Surface*", ALLOC_STATIC);
_maxNumPics = allocate(1, "i32", ALLOC_STATIC);
_tmpImage = allocate(1, "i8*", ALLOC_STATIC);
_numErrors = allocate(1, "i32", ALLOC_STATIC);
_cropDisplay = allocate(1, "i32", ALLOC_STATIC);
_disableOutputReordering = allocate(1, "i32", ALLOC_STATIC);
_decInput = allocate(16, ["i8*", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_decVer = allocate(8, "i32", ALLOC_STATIC);
__str = allocate([45, 84, 0], "i8", ALLOC_STATIC);
_i = allocate(1, "i32", ALLOC_STATIC);
__str1 = allocate([45, 78, 0], "i8", ALLOC_STATIC);
__str2 = allocate([45, 79, 0], "i8", ALLOC_STATIC);
__str3 = allocate([45, 80, 0], "i8", ALLOC_STATIC);
__str4 = allocate([45, 85, 0], "i8", ALLOC_STATIC);
__str5 = allocate([45, 67, 0], "i8", ALLOC_STATIC);
__str6 = allocate([45, 82, 0], "i8", ALLOC_STATIC);
__str7 = allocate([114, 98, 0], "i8", ALLOC_STATIC);
_strmLen = allocate(1, "i32", ALLOC_STATIC);
_byteStrmStart = allocate(1, "i8*", ALLOC_STATIC);
_decInst = allocate(1, "i8*", ALLOC_STATIC);
_ret = allocate(1, "i32", ALLOC_STATIC);
_tmp = allocate(1, "i32", ALLOC_STATIC);
_picDisplayNumber = allocate(1, "i32", ALLOC_STATIC);
_picDecodeNumber = allocate(1, "i32", ALLOC_STATIC);
_decPicture = allocate(16, ["i32*", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_imageData = allocate(1, "i8*", ALLOC_STATIC);
_decInfo = allocate(48, "i32", ALLOC_STATIC);
_decOutput = allocate(4, "i8*", ALLOC_STATIC);
_picSize = allocate(1, "i32", ALLOC_STATIC);
__str9 = allocate([83, 101, 116, 80, 111, 115, 105, 116, 105, 111, 110, 32, 37, 102, 10, 0], "i8", ALLOC_STATIC);
_NextPacket_prevIndex = allocate(1, "i32", ALLOC_STATIC);
_str = allocate([79, 110, 70, 114, 97, 109, 101, 68, 101, 99, 111, 100, 101, 100, 0], "i8", ALLOC_STATIC);
_str1 = allocate([71, 101, 116, 80, 111, 115, 105, 116, 105, 111, 110, 0], "i8", ALLOC_STATIC);
FUNCTION_TABLE = [0, 0, _FillRow1, 0, _h264bsdFillRow7, 0];
Module.FUNCTION_TABLE = FUNCTION_TABLE;
function run(a) {
  a = a || Module.arguments;
  __globalConstructor__();
  var b = null;
  Module._main && (b = Module.callMain(a), __shutdownRuntime__());
  return b
}
Module.run = run;
try {
  FS.ignorePermissions = false
}catch(e$$10) {
}
Module.noInitialRun = true;
if(!Module.noInitialRun) {
  var ret = run()
}
Module.LLVM_OPTS = "-disable-inlining,-globalopt,-ipsccp,-deadargelim,-simplifycfg,-prune-eh,-functionattrs,-argpromotion,-simplify-libcalls,-jump-threading,-simplifycfg,-tailcallelim,-simplifycfg,-reassociate,-loop-rotate,-licm,-loop-unswitch,-loop-deletion,-loop-unroll,-memcpyopt,-sccp,-jump-threading,-correlated-propagation,-dse,-adce,-simplifycfg,-strip-dead-prototypes,-globaldce,-constmerge".split(",");
Module.FS = FS;
Module.HEAPU8 = HEAPU8;
Module.CorrectionsMonitor = CorrectionsMonitor;
FS.createDataFile = FS.createDataFile;
var breakLoop = false, _runMainLoop = function() {
  window.addEventListener("message", function() {
    _mainLoopIteration();
    breakLoop || window.postMessage(0, "*")
  }, false)
};
Module.play = function() {
  breakLoop = false;
  window.postMessage(0, "*")
};
Module.stop = function() {
  breakLoop = true
};
Module.onFrameDecoded = function() {
};
_broadwayOnFrameDecoded = function() {
  Module.onFrameDecoded()
};
Module.setPosition = _broadwaySetPosition;
Module.getPosition = _broadwayGetPosition;
var patches = Module.patches = {};
function getGlobalScope() {
  return function() {
    return this
  }.call(null)
}
assert = function(a, b) {
  if(!a) {
    throw"Assertion: " + b;
  }
};
Module.patch = function(a, b, d) {
  assert(typeof d == "function");
  a || (a = getGlobalScope());
  Module.CC_VARIABLE_MAP && (b = Module.CC_VARIABLE_MAP[b]);
  assert(b in a && typeof a[b] == "function", "Can only patch functions.");
  patches[b] = a[b];
  a[b] = d;
  return patches[b]
};
Module.unpatch = function(a, b) {
  a || (a = getGlobalScope());
  Module.CC_VARIABLE_MAP && (b = Module.CC_VARIABLE_MAP[b]);
  assert(b in a && typeof a[b] == "function");
  b in patches && (a[b] = patches[b])
};
function getSurface() {
  var a = SDL.surfaces[SDL.screen];
  if(!a.image) {
    a.image = a.ctx.getImageData(0, 0, a.width, a.height);
    for(var b = a.image.data, d = b.length, c = 0;c < d / 4;c++) {
      b[c * 4 + 3] = 255
    }
  }
  return a
}
Module.paint = function(a, b, d, c, e) {
  for(var f, g, h, j, l, k, m = c >> 1, o = c * 4, p = getSurface(), r = p.image.data, q = 0;e -= 2;) {
    for(k = m;k--;) {
      h = HEAPU8[d++], f = HEAPU8[b++], j = 409 * h - 56992, h = 34784 - 208 * h - 100 * f, l = 516 * f - 70688, g = HEAPU8[a + c] * 298, f = HEAPU8[a++] * 298, r[q + o] = g + j >> 8, r[q++] = f + j >> 8, r[q + o] = g + h >> 8, r[q++] = f + h >> 8, r[q + o] = g + l >> 8, r[q++] = f + l >> 8, q++, g = HEAPU8[a + c] * 298, f = HEAPU8[a++] * 298, r[q + o] = g + j >> 8, r[q++] = f + j >> 8, r[q + o] = g + h >> 8, r[q++] = f + h >> 8, r[q + o] = g + l >> 8, r[q++] = f + l >> 8, q++
    }
    q += o;
    a += c
  }
  p.ctx.putImageData(p.image, 0, 0)
};
_paint = function(a, b, d, c, e) {
  Module.paint(a, b, d, c, e)
};

