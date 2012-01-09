var arguments_ = [], ENVIRONMENT_IS_NODE = "object" === typeof process, ENVIRONMENT_IS_WEB = "object" === typeof window, ENVIRONMENT_IS_WORKER = "function" === typeof importScripts, ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if(ENVIRONMENT_IS_NODE) {
  print = function(a) {
    process.stdout.write(a + "\n")
  };
  printErr = function(a) {
    process.stderr.write(a + "\n")
  };
  var nodeFS = require("fs");
  read = function(a) {
    var c = nodeFS.readFileSync(a).toString();
    !c && "/" != a[0] && (a = __dirname.split("/").slice(0, -1).join("/") + "/src/" + a, c = nodeFS.readFileSync(a).toString());
    return c
  };
  arguments_ = process.argv.slice(2)
}else {
  if(ENVIRONMENT_IS_SHELL) {
    this.read || (read = function(a) {
      snarf(a)
    }), arguments_ = this.arguments ? arguments : scriptArgs
  }else {
    if(ENVIRONMENT_IS_WEB) {
      print = printErr = function(a) {
        console.log(a)
      }, read = function(a) {
        var c = new XMLHttpRequest;
        c.open("GET", a, !1);
        c.send(null);
        return c.responseText
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
"undefined" == typeof load && "undefined" != typeof read && (load = function(a) {
  globalEval(read(a))
});
"undefined" === typeof printErr && (printErr = function() {
});
"undefined" === typeof print && (print = printErr);
try {
  this.Module = Module
}catch(e$$5) {
  this.Module = Module = {}
}
if(!Module.arguments) {
  Module.arguments = arguments_
}
if(Module.print) {
  print = Module.print
}
var Runtime = {stackSave:function() {
  return STACKTOP
}, stackRestore:function(a) {
  STACKTOP = a
}, forceAlign:function(a, c) {
  c = c || 4;
  return isNumber(a) && isNumber(c) ? Math.ceil(a / c) * c : "Math.ceil((" + a + ")/" + c + ")*" + c
}, isNumberType:function(a) {
  return a in Runtime.INT_TYPES || a in Runtime.FLOAT_TYPES
}, isPointerType:function(a) {
  return"*" == a[a.length - 1]
}, isStructType:function(a) {
  return isPointerType(a) ? !1 : /^\[\d+\ x\ (.*)\]/.test(a) || /<?{ [^}]* }>?/.test(a) ? !0 : "%" == a[0]
}, INT_TYPES:{i1:0, i8:0, i16:0, i32:0, i64:0}, FLOAT_TYPES:{"float":0, "double":0}, or64:function(a, c) {
  var b = a | 0 | c | 0, d = 4294967296 * (Math.round(a / 4294967296) | Math.round(c / 4294967296));
  return b + d
}, and64:function(a, c) {
  var b = (a | 0) & (c | 0), d = 4294967296 * (Math.round(a / 4294967296) & Math.round(c / 4294967296));
  return b + d
}, xor64:function(a, c) {
  var b = (a | 0) ^ (c | 0), d = 4294967296 * (Math.round(a / 4294967296) ^ Math.round(c / 4294967296));
  return b + d
}, getNativeTypeSize:function(a) {
  if(1 == Runtime.QUANTUM_SIZE) {
    return 1
  }
  var c = {"%i1":1, "%i8":1, "%i16":2, "%i32":4, "%i64":8, "%float":4, "%double":8}["%" + a];
  if(!c && "*" == a[a.length - 1]) {
    c = Runtime.QUANTUM_SIZE
  }
  return c
}, getNativeFieldSize:function(a) {
  return Math.max(Runtime.getNativeTypeSize(a), Runtime.QUANTUM_SIZE)
}, dedup:function(a, c) {
  var b = {};
  return c ? a.filter(function(a) {
    return b[a[c]] ? !1 : b[a[c]] = !0
  }) : a.filter(function(a) {
    return b[a] ? !1 : b[a] = !0
  })
}, set:function() {
  for(var a = "object" === typeof arguments[0] ? arguments[0] : arguments, c = {}, b = 0;b < a.length;b++) {
    c[a[b]] = 0
  }
  return c
}, calculateStructAlignment:function(a) {
  a.flatSize = 0;
  a.alignSize = 0;
  var c = [], b = -1;
  a.flatIndexes = a.fields.map(function(d) {
    var e;
    if(Runtime.isNumberType(d) || Runtime.isPointerType(d)) {
      d = e = Runtime.getNativeTypeSize(d)
    }else {
      if(Runtime.isStructType(d)) {
        e = Types.types[d].flatSize, d = Types.types[d].alignSize
      }else {
        throw"Unclear type in struct: " + d + ", in " + a.name_ + " :: " + dump(Types.types[a.name_]);
      }
    }
    d = a.packed ? 1 : Math.min(d, Runtime.QUANTUM_SIZE);
    a.alignSize = Math.max(a.alignSize, d);
    d = Runtime.alignMemory(a.flatSize, d);
    a.flatSize = d + e;
    0 <= b && c.push(d - b);
    return b = d
  });
  a.flatSize = Runtime.alignMemory(a.flatSize, a.alignSize);
  if(0 == c.length) {
    a.flatFactor = a.flatSize
  }else {
    if(1 == Runtime.dedup(c).length) {
      a.flatFactor = c[0]
    }
  }
  a.needsFlattening = 1 != a.flatFactor;
  return a.flatIndexes
}, generateStructInfo:function(a, c, b) {
  var d, e;
  if(c) {
    b = b || 0;
    d = ("undefined" === typeof Types ? Runtime.typeInfo : Types.types)[c];
    if(!d) {
      return null
    }
    a || (a = ("undefined" === typeof Types ? Runtime : Types).structMetadata[c.replace(/.*\./, "")]);
    if(!a) {
      return null
    }
    assert(d.fields.length === a.length, "Number of named fields must match the type for " + c + ". Perhaps due to inheritance, which is not supported yet?");
    e = d.flatIndexes
  }else {
    d = {fields:a.map(function(a) {
      return a[0]
    })}, e = Runtime.calculateStructAlignment(d)
  }
  var f = {__size__:d.flatSize};
  c ? a.forEach(function(a, c) {
    if("string" === typeof a) {
      f[a] = e[c] + b
    }else {
      var j, l;
      for(l in a) {
        j = l
      }
      f[j] = Runtime.generateStructInfo(a[j], d.fields[c], e[c])
    }
  }) : a.forEach(function(a, b) {
    f[a[1]] = e[b]
  });
  return f
}, stackAlloc:function(a) {
  var c = STACKTOP;
  STACKTOP += a;
  STACKTOP = 4 * Math.ceil(STACKTOP / 4);
  return c
}, staticAlloc:function(a) {
  var c = STATICTOP;
  STATICTOP += a;
  STATICTOP = 4 * Math.ceil(STATICTOP / 4);
  STATICTOP >= TOTAL_MEMORY && enlargeMemory();
  return c
}, alignMemory:function(a, c) {
  return Math.ceil(a / (c ? c : 4)) * (c ? c : 4)
}, QUANTUM_SIZE:4, __dummy__:0}, CorrectionsMonitor = {MAX_ALLOWED:0, corrections:0, sigs:{}, note:function(a, c) {
  c || (this.corrections++, this.corrections >= this.MAX_ALLOWED && abort("\n\nToo many corrections!"))
}, print:function() {
  var a = [], c;
  for(c in this.sigs) {
    a.push({sig:c, fails:this.sigs[c][0], succeeds:this.sigs[c][1], total:this.sigs[c][0] + this.sigs[c][1]})
  }
  a.sort(function(a, b) {
    return b.total - a.total
  });
  for(c = 0;c < a.length;c++) {
    var b = a[c];
    print(b.sig + " : " + b.total + " hits, %" + Math.ceil(100 * b.fails / b.total) + " failures")
  }
}}, __globalConstructor__ = function() {
}, __THREW__ = !1, __ATEXIT__ = [], ABORT = !1, undef = 0, tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempI64, tempI64b, tempDoubleBuffer = new ArrayBuffer(8), tempDoubleI32 = new Int32Array(tempDoubleBuffer), tempDoubleF64 = new Float64Array(tempDoubleBuffer);
function abort(a) {
  print(a + ":\n" + Error().stack);
  ABORT = !0;
  throw"Assertion: " + a;
}
function assert(a, c) {
  a || abort("Assertion failed: " + c)
}
function setValue(a, c, b) {
  b = b || "i8";
  "*" === b[b.length - 1] && (b = "i32");
  switch(b) {
    case "i1":
      HEAP8[a] = c;
      break;
    case "i8":
      HEAP8[a] = c;
      break;
    case "i16":
      HEAP16[a >> 1] = c;
      break;
    case "i32":
      HEAP32[a >> 2] = c;
      break;
    case "i64":
      HEAP32[a >> 2] = c[0];
      HEAP32[a + 4 >> 2] = c[1];
      break;
    case "float":
      HEAPF32[a >> 2] = c;
      break;
    case "double":
      tempDoubleF64[0] = c;
      HEAP32[a >> 2] = tempDoubleI32[0];
      HEAP32[a + 4 >> 2] = tempDoubleI32[1];
      break;
    default:
      abort("invalid type for setValue: " + b)
  }
}
Module.setValue = setValue;
function getValue(a, c) {
  c = c || "i8";
  "*" === c[c.length - 1] && (c = "i32");
  switch(c) {
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
      abort("invalid type for setValue: " + c)
  }
  return null
}
Module.getValue = getValue;
var ALLOC_NORMAL = 0, ALLOC_STACK = 1, ALLOC_STATIC = 2;
Module.ALLOC_NORMAL = ALLOC_NORMAL;
Module.ALLOC_STACK = ALLOC_STACK;
Module.ALLOC_STATIC = ALLOC_STATIC;
function allocate(a, c, b) {
  var d, e;
  "number" === typeof a ? (d = !0, e = a) : (d = !1, e = a.length);
  for(var f = "string" === typeof c ? c : null, b = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][void 0 === b ? ALLOC_STATIC : b](Math.max(e, f ? 1 : c.length)), g = 0, h;g < e;) {
    var j = d ? 0 : a[g];
    "function" === typeof j && (j = Runtime.getFunctionIndex(j));
    h = f || c[g];
    0 === h ? g++ : ("i64" == h && (h = "i32"), setValue(b + g, j, h), g += Runtime.getNativeTypeSize(h))
  }
  return b
}
Module.allocate = allocate;
function Pointer_stringify(a) {
  for(var c = "", b = 0, d, e = String.fromCharCode(0);;) {
    d = String.fromCharCode(HEAPU8[a + b]);
    if(d == e) {
      break
    }
    c += d;
    b += 1
  }
  return c
}
Module.Pointer_stringify = Pointer_stringify;
function Array_stringify(a) {
  for(var c = "", b = 0;b < a.length;b++) {
    c += String.fromCharCode(a[b])
  }
  return c
}
Module.Array_stringify = Array_stringify;
var FUNCTION_TABLE, PAGE_SIZE = 4096;
function alignMemoryPage(a) {
  return Math.ceil(a / PAGE_SIZE) * PAGE_SIZE
}
var HEAP, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, STACK_ROOT, STACKTOP, STACK_MAX, STATICTOP;
function enlargeMemory() {
  for(;TOTAL_MEMORY <= STATICTOP;) {
    TOTAL_MEMORY = alignMemoryPage(1.25 * TOTAL_MEMORY)
  }
  var a = HEAP8, c = new ArrayBuffer(TOTAL_MEMORY);
  HEAP8 = new Int8Array(c);
  HEAP16 = new Int16Array(c);
  HEAP32 = new Int32Array(c);
  HEAPU8 = new Uint8Array(c);
  HEAPU16 = new Uint16Array(c);
  HEAPU32 = new Uint32Array(c);
  HEAPF32 = new Float32Array(c);
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
assert(255 === HEAPU8[0] && 0 === HEAPU8[3], "Typed arrays 2 must be run on a little-endian system");
var base = intArrayFromString("(null)");
STATICTOP = base.length;
for(var i = 0;i < base.length;i++) {
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
  for(;0 < __ATEXIT__.length;) {
    var a = __ATEXIT__.pop(), c = a.func;
    "number" === typeof c && (c = FUNCTION_TABLE[c]);
    c(void 0 === a.arg ? null : a.arg)
  }
  CorrectionsMonitor.print()
}
function Array_copy(a, c) {
  return Array.prototype.slice.call(HEAP8.subarray(a, a + c))
}
Module.Array_copy = Array_copy;
function String_len(a) {
  for(var c = 0;HEAP8[a + c];) {
    c++
  }
  return c
}
Module.String_len = String_len;
function String_copy(a, c) {
  var b = String_len(a);
  c && b++;
  var d = Array_copy(a, b);
  c && (d[b - 1] = 0);
  return d
}
Module.String_copy = String_copy;
function intArrayFromString(a, c) {
  for(var b = [], d = 0;d < a.length;) {
    var e = a.charCodeAt(d);
    255 < e && (e &= 255);
    b.push(e);
    d += 1
  }
  c || b.push(0);
  return b
}
Module.intArrayFromString = intArrayFromString;
function intArrayToString(a) {
  for(var c = [], b = 0;b < a.length;b++) {
    var d = a[b];
    255 < d && (d &= 255);
    c.push(String.fromCharCode(d))
  }
  return c.join("")
}
Module.intArrayToString = intArrayToString;
function unSign(a, c) {
  return 0 <= a ? a : 32 >= c ? 2 * Math.abs(1 << c - 1) + a : Math.pow(2, c) + a
}
function reSign(a, c) {
  if(0 >= a) {
    return a
  }
  var b = 32 >= c ? Math.abs(1 << c - 1) : Math.pow(2, c - 1);
  if(a >= b && (32 >= c || a > b)) {
    a = -2 * b + a
  }
  return a
}
function _h264bsdProcessBlock(a, c, b, d) {
  var e, f, g, h, j, l, k;
  f = HEAPU8[_qpDiv6 + c] & 255;
  g = HEAP32[_levelScale + 12 * (HEAPU8[_qpMod6 + c] & 255) >> 2] << f;
  h = HEAP32[_levelScale + 12 * (HEAPU8[_qpMod6 + c] & 255) + 4 >> 2] << f;
  c = HEAP32[_levelScale + 12 * (HEAPU8[_qpMod6 + c] & 255) + 8 >> 2] << f;
  1 == (0 != (b | 0) ? 2 : 1) && (HEAP32[a >> 2] *= g);
  b = 0 != (d & 65436 | 0) ? 3 : 17;
  a:do {
    if(3 == b) {
      j = HEAP32[a + 4 >> 2];
      l = HEAP32[a + 56 >> 2];
      k = HEAP32[a + 60 >> 2];
      HEAP32[a + 4 >> 2] = j * h;
      HEAP32[a + 56 >> 2] = l * h;
      HEAP32[a + 60 >> 2] = k * c;
      j = HEAP32[a + 8 >> 2];
      l = HEAP32[a + 20 >> 2];
      k = HEAP32[a + 16 >> 2];
      HEAP32[a + 16 >> 2] = j * h;
      HEAP32[a + 8 >> 2] = l * g;
      HEAP32[a + 20 >> 2] = k * c;
      j = HEAP32[a + 32 >> 2];
      l = HEAP32[a + 12 >> 2];
      k = HEAP32[a + 24 >> 2];
      f = j * h;
      HEAP32[a + 32 >> 2] = l * g;
      HEAP32[a + 12 >> 2] = k * h;
      j = HEAP32[a + 28 >> 2];
      l = HEAP32[a + 48 >> 2];
      k = HEAP32[a + 36 >> 2];
      HEAP32[a + 24 >> 2] = j * h;
      HEAP32[a + 28 >> 2] = l * c;
      HEAP32[a + 48 >> 2] = k * h;
      HEAP32[a + 36 >> 2] = f;
      j = HEAP32[a + 40 >> 2];
      l = HEAP32[a + 44 >> 2];
      k = HEAP32[a + 52 >> 2];
      HEAP32[a + 52 >> 2] = j * c;
      HEAP32[a + 40 >> 2] = l * g;
      HEAP32[a + 44 >> 2] = k * h;
      j = 4;
      l = a;
      b:for(;;) {
        f = j;
        j = f - 1;
        if(0 == (f | 0)) {
          break b
        }
        f = HEAP32[l >> 2] + HEAP32[l + 8 >> 2];
        g = HEAP32[l >> 2] - HEAP32[l + 8 >> 2];
        h = (HEAP32[l + 4 >> 2] >> 1) - HEAP32[l + 12 >> 2];
        c = HEAP32[l + 4 >> 2] + (HEAP32[l + 12 >> 2] >> 1);
        HEAP32[l >> 2] = f + c;
        HEAP32[l + 4 >> 2] = g + h;
        HEAP32[l + 8 >> 2] = g - h;
        HEAP32[l + 12 >> 2] = f - c;
        l += 16
      }
      j = 4;
      b:for(;;) {
        b = j;
        j = b - 1;
        b = 0 != (b | 0) ? 9 : 16;
        do {
          if(9 == b) {
            f = HEAP32[a >> 2] + HEAP32[a + 32 >> 2];
            g = HEAP32[a >> 2] - HEAP32[a + 32 >> 2];
            h = (HEAP32[a + 16 >> 2] >> 1) - HEAP32[a + 48 >> 2];
            c = HEAP32[a + 16 >> 2] + (HEAP32[a + 48 >> 2] >> 1);
            HEAP32[a >> 2] = c + (f + 32) >> 6;
            HEAP32[a + 16 >> 2] = h + (g + 32) >> 6;
            HEAP32[a + 32 >> 2] = g - h + 32 >> 6;
            HEAP32[a + 48 >> 2] = f - c + 32 >> 6;
            b = 1023 < HEAP32[a >> 2] + 512 >>> 0 ? 13 : 10;
            d:do {
              if(10 == b) {
                if(1023 < HEAP32[a + 16 >> 2] + 512 >>> 0) {
                  break d
                }
                if(1023 < HEAP32[a + 32 >> 2] + 512 >>> 0) {
                  break d
                }
                if(1023 < HEAP32[a + 48 >> 2] + 512 >>> 0) {
                  break d
                }
                a += 4;
                continue b
              }
            }while(0);
            e = 1;
            b = 29;
            break a
          }else {
            if(16 == b) {
              b = 28;
              break a
            }
          }
        }while(0)
      }
    }else {
      if(17 == b) {
        b = 0 == (d & 98 | 0) ? 18 : 21;
        b:do {
          if(18 == b) {
            f = HEAP32[a >> 2] + 32 >> 6;
            b = 1023 < f + 512 >>> 0 ? 19 : 20;
            do {
              if(19 == b) {
                e = 1;
                b = 29;
                break a
              }else {
                20 == b && (d = f, HEAP32[a + 60 >> 2] = d, HEAP32[a + 56 >> 2] = d, HEAP32[a + 52 >> 2] = d, HEAP32[a + 48 >> 2] = d, HEAP32[a + 44 >> 2] = d, HEAP32[a + 40 >> 2] = d, HEAP32[a + 36 >> 2] = d, HEAP32[a + 32 >> 2] = d, HEAP32[a + 28 >> 2] = d, HEAP32[a + 24 >> 2] = d, HEAP32[a + 20 >> 2] = d, HEAP32[a + 16 >> 2] = d, HEAP32[a + 12 >> 2] = d, HEAP32[a + 8 >> 2] = d, HEAP32[a + 4 >> 2] = d, HEAP32[a >> 2] = d)
              }
            }while(0)
          }else {
            if(21 == b) {
              HEAP32[a + 4 >> 2] *= h;
              HEAP32[a + 8 >> 2] = HEAP32[a + 20 >> 2] * g;
              HEAP32[a + 12 >> 2] = HEAP32[a + 24 >> 2] * h;
              f = HEAP32[a >> 2] + HEAP32[a + 8 >> 2];
              g = HEAP32[a >> 2] - HEAP32[a + 8 >> 2];
              h = (HEAP32[a + 4 >> 2] >> 1) - HEAP32[a + 12 >> 2];
              c = HEAP32[a + 4 >> 2] + (HEAP32[a + 12 >> 2] >> 1);
              HEAP32[a >> 2] = c + (f + 32) >> 6;
              HEAP32[a + 4 >> 2] = h + (g + 32) >> 6;
              HEAP32[a + 8 >> 2] = g - h + 32 >> 6;
              HEAP32[a + 12 >> 2] = f - c + 32 >> 6;
              d = HEAP32[a >> 2];
              HEAP32[a + 48 >> 2] = d;
              HEAP32[a + 32 >> 2] = d;
              HEAP32[a + 16 >> 2] = d;
              d = HEAP32[a + 4 >> 2];
              HEAP32[a + 52 >> 2] = d;
              HEAP32[a + 36 >> 2] = d;
              HEAP32[a + 20 >> 2] = d;
              d = HEAP32[a + 8 >> 2];
              HEAP32[a + 56 >> 2] = d;
              HEAP32[a + 40 >> 2] = d;
              HEAP32[a + 24 >> 2] = d;
              d = HEAP32[a + 12 >> 2];
              HEAP32[a + 60 >> 2] = d;
              HEAP32[a + 44 >> 2] = d;
              HEAP32[a + 28 >> 2] = d;
              b = 1023 < HEAP32[a >> 2] + 512 >>> 0 ? 25 : 22;
              c:do {
                if(22 == b) {
                  if(1023 < HEAP32[a + 4 >> 2] + 512 >>> 0) {
                    break c
                  }
                  if(1023 < HEAP32[a + 8 >> 2] + 512 >>> 0) {
                    break c
                  }
                  if(1023 < HEAP32[a + 12 >> 2] + 512 >>> 0) {
                    break c
                  }
                  break b
                }
              }while(0);
              e = 1;
              b = 29;
              break a
            }
          }
        }while(0);
        b = 28;
        break a
      }
    }
  }while(0);
  28 == b && (e = 0);
  return e
}
_h264bsdProcessBlock.X = 1;
function _h264bsdCountLeadingZeros(a, c) {
  var b, d, e;
  d = 0;
  e = 1 << c - 1;
  a:for(;;) {
    if(0 != (e | 0)) {
      b = 2
    }else {
      var f = 0;
      b = 3
    }
    2 == b && (f = 0 != (a & e | 0) ^ 1);
    if(!f) {
      break a
    }
    d += 1;
    e >>>= 1
  }
  return d
}
function _abs(a) {
  var c;
  c = 0 > (a | 0) ? 1 : 2;
  if(1 == c) {
    var b = -a
  }else {
    2 == c && (b = a)
  }
  return b
}
function _clip(a, c, b) {
  var d;
  d = (b | 0) < (a | 0) ? 1 : 2;
  if(1 == d) {
    var e = a
  }else {
    if(2 == d) {
      d = (b | 0) > (c | 0) ? 3 : 4;
      if(3 == d) {
        var f = c
      }else {
        4 == d && (f = b)
      }
      e = f
    }
  }
  return e
}
function _h264bsdProcessLumaDc(a, c) {
  var b, d, e, f, g, h, j, l, k, m;
  d = a;
  j = HEAPU8[_qpMod6 + c] & 255;
  l = HEAPU8[_qpDiv6 + c] & 255;
  e = HEAP32[d + 8 >> 2];
  HEAP32[d + 8 >> 2] = HEAP32[d + 20 >> 2];
  HEAP32[d + 20 >> 2] = HEAP32[d + 16 >> 2];
  HEAP32[d + 16 >> 2] = e;
  e = HEAP32[d + 32 >> 2];
  HEAP32[d + 32 >> 2] = HEAP32[d + 12 >> 2];
  HEAP32[d + 12 >> 2] = HEAP32[d + 24 >> 2];
  HEAP32[d + 24 >> 2] = HEAP32[d + 28 >> 2];
  HEAP32[d + 28 >> 2] = HEAP32[d + 48 >> 2];
  HEAP32[d + 48 >> 2] = HEAP32[d + 36 >> 2];
  HEAP32[d + 36 >> 2] = e;
  e = HEAP32[d + 40 >> 2];
  HEAP32[d + 40 >> 2] = HEAP32[d + 44 >> 2];
  HEAP32[d + 44 >> 2] = HEAP32[d + 52 >> 2];
  HEAP32[d + 52 >> 2] = e;
  b = 4;
  k = d;
  a:for(;;) {
    e = b;
    b = e - 1;
    if(0 == (e | 0)) {
      break a
    }
    e = HEAP32[k >> 2] + HEAP32[k + 8 >> 2];
    f = HEAP32[k >> 2] - HEAP32[k + 8 >> 2];
    g = HEAP32[k + 4 >> 2] - HEAP32[k + 12 >> 2];
    h = HEAP32[k + 4 >> 2] + HEAP32[k + 12 >> 2];
    HEAP32[k >> 2] = e + h;
    HEAP32[k + 4 >> 2] = f + g;
    HEAP32[k + 8 >> 2] = f - g;
    HEAP32[k + 12 >> 2] = e - h;
    k += 16
  }
  k = HEAP32[_levelScale + 12 * j >> 2];
  b = 12 <= c >>> 0 ? 5 : 10;
  do {
    if(5 == b) {
      k <<= l - 2;
      j = 4;
      b:for(;;) {
        e = j;
        j = e - 1;
        if(0 == (e | 0)) {
          break b
        }
        e = HEAP32[d >> 2] + HEAP32[d + 32 >> 2];
        f = HEAP32[d >> 2] - HEAP32[d + 32 >> 2];
        g = HEAP32[d + 16 >> 2] - HEAP32[d + 48 >> 2];
        h = HEAP32[d + 16 >> 2] + HEAP32[d + 48 >> 2];
        HEAP32[d >> 2] = (e + h) * k;
        HEAP32[d + 16 >> 2] = (f + g) * k;
        HEAP32[d + 32 >> 2] = (f - g) * k;
        HEAP32[d + 48 >> 2] = (e - h) * k;
        d += 4
      }
    }else {
      if(10 == b) {
        m = 0 == (1 - l | 0) ? 1 : 2;
        j = 4;
        b:for(;;) {
          e = j;
          j = e - 1;
          if(0 == (e | 0)) {
            break b
          }
          e = HEAP32[d >> 2] + HEAP32[d + 32 >> 2];
          f = HEAP32[d >> 2] - HEAP32[d + 32 >> 2];
          g = HEAP32[d + 16 >> 2] - HEAP32[d + 48 >> 2];
          h = HEAP32[d + 16 >> 2] + HEAP32[d + 48 >> 2];
          HEAP32[d >> 2] = (e + h) * k + m >> (2 - l | 0);
          HEAP32[d + 16 >> 2] = (f + g) * k + m >> (2 - l | 0);
          HEAP32[d + 32 >> 2] = (f - g) * k + m >> (2 - l | 0);
          HEAP32[d + 48 >> 2] = (e - h) * k + m >> (2 - l | 0);
          d += 4
        }
      }
    }
  }while(0)
}
_h264bsdProcessLumaDc.X = 1;
function _h264bsdProcessChromaDc(a, c) {
  var b, d, e, f, g, h;
  d = HEAPU8[_qpDiv6 + c] & 255;
  g = HEAP32[_levelScale + 12 * (HEAPU8[_qpMod6 + c] & 255) >> 2];
  b = 6 <= c >>> 0 ? 1 : 2;
  1 == b ? (g <<= d - 1, h = 0) : 2 == b && (h = 1);
  b = HEAP32[a >> 2] + HEAP32[a + 8 >> 2];
  d = HEAP32[a >> 2] - HEAP32[a + 8 >> 2];
  e = HEAP32[a + 4 >> 2] - HEAP32[a + 12 >> 2];
  f = HEAP32[a + 4 >> 2] + HEAP32[a + 12 >> 2];
  HEAP32[a >> 2] = (b + f) * g >> (h | 0);
  HEAP32[a + 4 >> 2] = (b - f) * g >> (h | 0);
  HEAP32[a + 8 >> 2] = (d + e) * g >> (h | 0);
  HEAP32[a + 12 >> 2] = (d - e) * g >> (h | 0);
  b = HEAP32[a + 16 >> 2] + HEAP32[a + 24 >> 2];
  d = HEAP32[a + 16 >> 2] - HEAP32[a + 24 >> 2];
  e = HEAP32[a + 20 >> 2] - HEAP32[a + 28 >> 2];
  f = HEAP32[a + 20 >> 2] + HEAP32[a + 28 >> 2];
  HEAP32[a + 16 >> 2] = (b + f) * g >> (h | 0);
  HEAP32[a + 20 >> 2] = (b - f) * g >> (h | 0);
  HEAP32[a + 24 >> 2] = (d + e) * g >> (h | 0);
  HEAP32[a + 28 >> 2] = (d - e) * g >> (h | 0)
}
_h264bsdProcessChromaDc.X = 1;
function _h264bsdNextMbAddress(a, c, b) {
  var d, e, f;
  e = HEAP32[a + (b << 2) >> 2];
  d = b + 1;
  f = HEAP32[a + (d << 2) >> 2];
  a:for(;;) {
    if(d >>> 0 < c >>> 0) {
      b = 2
    }else {
      var g = 0, b = 3
    }
    2 == b && (g = (f | 0) != (e | 0));
    if(!g) {
      break a
    }
    d += 1;
    f = HEAP32[a + (d << 2) >> 2]
  }
  6 == ((d | 0) == (c | 0) ? 6 : 7) && (d = 0);
  return d
}
_h264bsdNextMbAddress.X = 1;
function _h264bsdSetCurrImageMbPointers(a, c) {
  var b, d, e, f;
  b = HEAP32[a + 4 >> 2];
  d = HEAP32[a + 8 >> 2];
  e = Math.floor((c >>> 0) / (b >>> 0));
  f = (c >>> 0) % (b >>> 0);
  e *= b;
  b *= d;
  HEAP32[a + 12 >> 2] = HEAP32[a >> 2] + (f << 4) + (e << 8);
  HEAP32[a + 16 >> 2] = HEAP32[a >> 2] + (b << 8) + (e << 6) + (f << 3);
  HEAP32[a + 20 >> 2] = HEAP32[a + 16 >> 2] + (b << 6)
}
_h264bsdSetCurrImageMbPointers.X = 1;
function _h264bsdRbspTrailingBits(a) {
  var c, b, d;
  d = 8 - HEAP32[a + 8 >> 2];
  b = _h264bsdGetBits(a, d);
  a = -1 == (b | 0) ? 1 : 2;
  1 == a ? c = 1 : 2 == a && (a = (b | 0) != (HEAP32[_stuffingTable + (d - 1 << 2) >> 2] | 0) ? 3 : 4, 3 == a ? c = 1 : 4 == a && (c = 0));
  return c
}
function _h264bsdMoreRbspData(a) {
  var c, b, d;
  d = (HEAP32[a + 12 >> 2] << 3) - HEAP32[a + 16 >> 2];
  c = 0 == (d | 0) ? 1 : 2;
  a:do {
    if(1 == c) {
      b = 0
    }else {
      if(2 == c) {
        c = 8 < d >>> 0 ? 4 : 3;
        b:do {
          if(3 == c) {
            if((_h264bsdShowBits32(a) >>> (32 - d >>> 0) | 0) != (1 << d - 1 | 0)) {
              break b
            }
            b = 0;
            break a
          }
        }while(0);
        b = 1
      }
    }
  }while(0);
  return b
}
function _h264bsdExtractNalUnit(a, c, b, d) {
  var e, f, g, h, j, l, k, m, o;
  m = k = 0;
  e = 3 < c >>> 0 ? 1 : 36;
  a:do {
    if(1 == e) {
      if(0 != (HEAPU8[a] & 255 | 0)) {
        e = 36;
        break a
      }
      if(0 != (HEAPU8[a + 1] & 255 | 0)) {
        e = 36;
        break a
      }
      if(0 != (HEAPU8[a + 2] & 254 | 0)) {
        e = 36;
        break a
      }
      j = g = 2;
      o = a + 2;
      b:for(;;) {
        e = o;
        o = e + 1;
        l = HEAP8[e];
        g += 1;
        e = (g | 0) == (c | 0) ? 6 : 7;
        do {
          if(6 == e) {
            HEAP32[d >> 2] = c;
            f = 1;
            e = 58;
            break a
          }else {
            if(7 == e) {
              e = 0 != l << 24 >> 24 ? 9 : 8;
              do {
                if(9 == e) {
                  e = 1 == (l & 255 | 0) ? 10 : 12;
                  do {
                    if(10 == e && 2 <= j >>> 0) {
                      break b
                    }
                  }while(0);
                  j = 0
                }else {
                  8 == e && (j += 1)
                }
              }while(0)
            }
          }
        }while(0)
      }
      h = g;
      j = 0;
      b:for(;;) {
        e = o;
        o = e + 1;
        l = HEAP8[e];
        g += 1;
        e = 0 != l << 24 >> 24 ? 18 : 17;
        17 == e && (j += 1);
        e = 3 == (l & 255 | 0) ? 19 : 21;
        c:do {
          if(19 == e) {
            if(2 != (j | 0)) {
              break c
            }
            k = 1
          }
        }while(0);
        e = 1 == (l & 255 | 0) ? 22 : 27;
        c:do {
          if(22 == e) {
            if(!(2 <= j >>> 0)) {
              break c
            }
            HEAP32[b + 12 >> 2] = g - h - j - 1;
            e = 3 > j >>> 0 ? 24 : 25;
            if(24 == e) {
              var q = j
            }else {
              25 == e && (q = 3)
            }
            j -= q;
            break b
          }
        }while(0);
        e = 0 != l << 24 >> 24 ? 28 : 31;
        28 == e && (e = 3 <= j >>> 0 ? 29 : 30, 29 == e && (m = 1), j = 0);
        e = (g | 0) == (c | 0) ? 33 : 34;
        do {
          if(33 == e) {
            HEAP32[b + 12 >> 2] = g - h - j;
            break b
          }
        }while(0)
      }
      e = 37;
      break a
    }
  }while(0);
  a:do {
    if(36 == e) {
      j = h = 0;
      HEAP32[b + 12 >> 2] = c;
      k = 1;
      e = 37;
      break a
    }
  }while(0);
  a:do {
    if(37 == e) {
      HEAP32[b >> 2] = a + h;
      HEAP32[b + 4 >> 2] = HEAP32[b >> 2];
      HEAP32[b + 8 >> 2] = 0;
      HEAP32[b + 16 >> 2] = 0;
      HEAP32[d >> 2] = HEAP32[b + 12 >> 2] + h + j;
      e = 0 != (m | 0) ? 38 : 39;
      do {
        if(38 == e) {
          f = 1
        }else {
          if(39 == e) {
            e = 0 != (k | 0) ? 40 : 57;
            c:do {
              if(40 == e) {
                f = HEAP32[b + 12 >> 2];
                c = HEAP32[b >> 2];
                o = HEAP32[b >> 2];
                j = 0;
                for(;;) {
                  e = f;
                  f = e - 1;
                  e = 0 != (e | 0) ? 42 : 56;
                  do {
                    if(42 == e) {
                      e = 2 == (j | 0) ? 43 : 48;
                      f:do {
                        if(43 == e) {
                          if(3 != (HEAPU8[o] & 255 | 0)) {
                            e = 48;
                            break f
                          }
                          e = 0 == (f | 0) ? 46 : 45;
                          g:do {
                            if(45 == e) {
                              if(3 < (HEAPU8[o + 1] & 255 | 0)) {
                                break g
                              }
                              o += 1;
                              j = 0;
                              e = 55;
                              break f
                            }
                          }while(0);
                          f = 1;
                          break a
                        }
                      }while(0);
                      do {
                        if(48 == e) {
                          e = 2 == (j | 0) ? 49 : 51;
                          g:do {
                            if(49 == e) {
                              if(!(2 >= (HEAPU8[o] & 255 | 0))) {
                                break g
                              }
                              f = 1;
                              break a
                            }
                          }while(0);
                          e = 0 == (HEAPU8[o] & 255 | 0) ? 52 : 53;
                          52 == e ? j += 1 : 53 == e && (j = 0);
                          g = o;
                          o = g + 1;
                          g = HEAP8[g];
                          q = c;
                          c = q + 1;
                          HEAP8[q] = g
                        }
                      }while(0)
                    }else {
                      if(56 == e) {
                        HEAP32[b + 12 >> 2] -= o - c;
                        break c
                      }
                    }
                  }while(0)
                }
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
function _GetDpbSize(a, c) {
  var b, d, e, f;
  b = 10 == c ? 1 : 11 == c ? 2 : 12 == c ? 3 : 13 == c ? 4 : 20 == c ? 5 : 21 == c ? 6 : 22 == c ? 7 : 30 == c ? 8 : 31 == c ? 9 : 32 == c ? 10 : 40 == c ? 11 : 41 == c ? 12 : 42 == c ? 13 : 50 == c ? 14 : 51 == c ? 15 : 16;
  a:do {
    if(16 == b) {
      d = 2147483647;
      b = 23;
      break a
    }else {
      if(1 == b) {
        e = 152064;
        f = 99;
        b = 17;
        break a
      }else {
        if(2 == b) {
          e = 345600;
          f = 396;
          b = 17;
          break a
        }else {
          if(3 == b) {
            e = 912384;
            f = 396;
            b = 17;
            break a
          }else {
            if(4 == b) {
              e = 912384;
              f = 396;
              b = 17;
              break a
            }else {
              if(5 == b) {
                e = 912384;
                f = 396;
                b = 17;
                break a
              }else {
                if(6 == b) {
                  e = 1824768;
                  f = 792;
                  b = 17;
                  break a
                }else {
                  if(7 == b) {
                    e = 3110400;
                    f = 1620;
                    b = 17;
                    break a
                  }else {
                    if(8 == b) {
                      e = 3110400;
                      f = 1620;
                      b = 17;
                      break a
                    }else {
                      if(9 == b) {
                        e = 6912E3;
                        f = 3600;
                        b = 17;
                        break a
                      }else {
                        if(10 == b) {
                          e = 7864320;
                          f = 5120;
                          b = 17;
                          break a
                        }else {
                          if(11 == b) {
                            e = 12582912;
                            f = 8192;
                            b = 17;
                            break a
                          }else {
                            if(12 == b) {
                              e = 12582912;
                              f = 8192;
                              b = 17;
                              break a
                            }else {
                              if(13 == b) {
                                e = 13369344;
                                f = 8704;
                                b = 17;
                                break a
                              }else {
                                if(14 == b) {
                                  e = 42393600;
                                  f = 22080;
                                  b = 17;
                                  break a
                                }else {
                                  if(15 == b) {
                                    e = 70778880;
                                    f = 36864;
                                    b = 17;
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
  if(17 == b) {
    if(b = a >>> 0 > f >>> 0 ? 18 : 19, 18 == b) {
      d = 2147483647
    }else {
      if(19 == b) {
        e = Math.floor((e >>> 0) / (384 * a >>> 0));
        b = 16 > e >>> 0 ? 20 : 21;
        if(20 == b) {
          var g = e
        }else {
          21 == b && (g = 16)
        }
        d = g
      }
    }
  }
  return d
}
_GetDpbSize.X = 1;
function _h264bsdDecodeSeqParamSet(a, c) {
  var b = STACKTOP;
  STACKTOP += 4;
  var d, e, f, g;
  _H264SwDecMemset(c, 0, 92);
  f = _h264bsdGetBits(a, 8);
  d = -1 == (f | 0) ? 1 : 2;
  a:do {
    if(1 == d) {
      e = 1
    }else {
      if(2 == d) {
        HEAP32[c >> 2] = f;
        _h264bsdGetBits(a, 1);
        _h264bsdGetBits(a, 1);
        f = _h264bsdGetBits(a, 1);
        d = -1 == (f | 0) ? 5 : 6;
        do {
          if(5 == d) {
            e = 1
          }else {
            if(6 == d) {
              f = _h264bsdGetBits(a, 5);
              d = -1 == (f | 0) ? 7 : 8;
              do {
                if(7 == d) {
                  e = 1
                }else {
                  if(8 == d) {
                    f = _h264bsdGetBits(a, 8);
                    d = -1 == (f | 0) ? 9 : 10;
                    do {
                      if(9 == d) {
                        e = 1
                      }else {
                        if(10 == d) {
                          HEAP32[c + 4 >> 2] = f;
                          f = _h264bsdDecodeExpGolombUnsigned(a, c + 8);
                          d = 0 != (f | 0) ? 11 : 12;
                          do {
                            if(11 == d) {
                              e = f
                            }else {
                              if(12 == d) {
                                d = 32 <= HEAPU32[c + 8 >> 2] >>> 0 ? 13 : 14;
                                do {
                                  if(13 == d) {
                                    e = 1
                                  }else {
                                    if(14 == d) {
                                      f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                      d = 0 != (f | 0) ? 15 : 16;
                                      do {
                                        if(15 == d) {
                                          e = f
                                        }else {
                                          if(16 == d) {
                                            d = 12 < HEAPU32[b >> 2] >>> 0 ? 17 : 18;
                                            do {
                                              if(17 == d) {
                                                e = 1
                                              }else {
                                                if(18 == d) {
                                                  HEAP32[c + 12 >> 2] = 1 << HEAP32[b >> 2] + 4;
                                                  f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                  d = 0 != (f | 0) ? 19 : 20;
                                                  do {
                                                    if(19 == d) {
                                                      e = f
                                                    }else {
                                                      if(20 == d) {
                                                        d = 2 < HEAPU32[b >> 2] >>> 0 ? 21 : 22;
                                                        do {
                                                          if(21 == d) {
                                                            e = 1
                                                          }else {
                                                            if(22 == d) {
                                                              HEAP32[c + 16 >> 2] = HEAP32[b >> 2];
                                                              d = 0 == (HEAP32[c + 16 >> 2] | 0) ? 23 : 28;
                                                              do {
                                                                if(23 == d) {
                                                                  f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                                  d = 0 != (f | 0) ? 24 : 25;
                                                                  do {
                                                                    if(24 == d) {
                                                                      e = f;
                                                                      break a
                                                                    }else {
                                                                      if(25 == d) {
                                                                        d = 12 < HEAPU32[b >> 2] >>> 0 ? 26 : 27;
                                                                        do {
                                                                          if(26 == d) {
                                                                            e = 1;
                                                                            break a
                                                                          }else {
                                                                            27 == d && (HEAP32[c + 20 >> 2] = 1 << HEAP32[b >> 2] + 4)
                                                                          }
                                                                        }while(0)
                                                                      }
                                                                    }
                                                                  }while(0)
                                                                }else {
                                                                  if(28 == d) {
                                                                    d = 1 == (HEAP32[c + 16 >> 2] | 0) ? 29 : 51;
                                                                    do {
                                                                      if(29 == d) {
                                                                        f = _h264bsdGetBits(a, 1);
                                                                        d = -1 == (f | 0) ? 30 : 31;
                                                                        do {
                                                                          if(30 == d) {
                                                                            e = 1;
                                                                            break a
                                                                          }else {
                                                                            if(31 == d) {
                                                                              HEAP32[c + 24 >> 2] = 1 == (f | 0) ? 1 : 0;
                                                                              f = _h264bsdDecodeExpGolombSigned(a, c + 28);
                                                                              d = 0 != (f | 0) ? 32 : 33;
                                                                              do {
                                                                                if(32 == d) {
                                                                                  e = f;
                                                                                  break a
                                                                                }else {
                                                                                  if(33 == d) {
                                                                                    f = _h264bsdDecodeExpGolombSigned(a, c + 32);
                                                                                    d = 0 != (f | 0) ? 34 : 35;
                                                                                    do {
                                                                                      if(34 == d) {
                                                                                        e = f;
                                                                                        break a
                                                                                      }else {
                                                                                        if(35 == d) {
                                                                                          f = _h264bsdDecodeExpGolombUnsigned(a, c + 36);
                                                                                          d = 0 != (f | 0) ? 36 : 37;
                                                                                          do {
                                                                                            if(36 == d) {
                                                                                              e = f;
                                                                                              break a
                                                                                            }else {
                                                                                              if(37 == d) {
                                                                                                d = 255 < HEAPU32[c + 36 >> 2] >>> 0 ? 38 : 39;
                                                                                                do {
                                                                                                  if(38 == d) {
                                                                                                    e = 1;
                                                                                                    break a
                                                                                                  }else {
                                                                                                    if(39 == d) {
                                                                                                      d = 0 != (HEAP32[c + 36 >> 2] | 0) ? 40 : 49;
                                                                                                      r:do {
                                                                                                        if(40 == d) {
                                                                                                          d = _H264SwDecMalloc(HEAP32[c + 36 >> 2] << 2);
                                                                                                          HEAP32[c + 40 >> 2] = d;
                                                                                                          d = 0 == (HEAP32[c + 40 >> 2] | 0) ? 41 : 42;
                                                                                                          do {
                                                                                                            if(41 == d) {
                                                                                                              e = 65535;
                                                                                                              break a
                                                                                                            }else {
                                                                                                              if(42 == d) {
                                                                                                                g = 0;
                                                                                                                for(;;) {
                                                                                                                  d = g >>> 0 < HEAPU32[c + 36 >> 2] >>> 0 ? 44 : 48;
                                                                                                                  do {
                                                                                                                    if(44 == d) {
                                                                                                                      f = _h264bsdDecodeExpGolombSigned(a, HEAP32[c + 40 >> 2] + (g << 2));
                                                                                                                      d = 0 != (f | 0) ? 45 : 46;
                                                                                                                      do {
                                                                                                                        if(45 == d) {
                                                                                                                          e = f;
                                                                                                                          break a
                                                                                                                        }else {
                                                                                                                          46 == d && (g += 1)
                                                                                                                        }
                                                                                                                      }while(0)
                                                                                                                    }else {
                                                                                                                      if(48 == d) {
                                                                                                                        break r
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }while(0)
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }while(0)
                                                                                                        }else {
                                                                                                          49 == d && (HEAP32[c + 40 >> 2] = 0)
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
                                                                    }while(0)
                                                                  }
                                                                }
                                                              }while(0);
                                                              f = _h264bsdDecodeExpGolombUnsigned(a, c + 44);
                                                              d = 0 != (f | 0) ? 53 : 54;
                                                              do {
                                                                if(53 == d) {
                                                                  e = f
                                                                }else {
                                                                  if(54 == d) {
                                                                    d = 16 < HEAPU32[c + 44 >> 2] >>> 0 ? 55 : 56;
                                                                    do {
                                                                      if(55 == d) {
                                                                        e = 1
                                                                      }else {
                                                                        if(56 == d) {
                                                                          f = _h264bsdGetBits(a, 1);
                                                                          d = -1 == (f | 0) ? 57 : 58;
                                                                          do {
                                                                            if(57 == d) {
                                                                              e = 1
                                                                            }else {
                                                                              if(58 == d) {
                                                                                HEAP32[c + 48 >> 2] = 1 == (f | 0) ? 1 : 0;
                                                                                f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                                                d = 0 != (f | 0) ? 59 : 60;
                                                                                do {
                                                                                  if(59 == d) {
                                                                                    e = f
                                                                                  }else {
                                                                                    if(60 == d) {
                                                                                      HEAP32[c + 52 >> 2] = HEAP32[b >> 2] + 1;
                                                                                      f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                                                      d = 0 != (f | 0) ? 61 : 62;
                                                                                      do {
                                                                                        if(61 == d) {
                                                                                          e = f
                                                                                        }else {
                                                                                          if(62 == d) {
                                                                                            HEAP32[c + 56 >> 2] = HEAP32[b >> 2] + 1;
                                                                                            f = _h264bsdGetBits(a, 1);
                                                                                            d = -1 == (f | 0) ? 63 : 64;
                                                                                            do {
                                                                                              if(63 == d) {
                                                                                                e = 1
                                                                                              }else {
                                                                                                if(64 == d) {
                                                                                                  d = 0 != (f | 0) ? 66 : 65;
                                                                                                  do {
                                                                                                    if(66 == d) {
                                                                                                      f = _h264bsdGetBits(a, 1);
                                                                                                      d = -1 == (f | 0) ? 67 : 68;
                                                                                                      do {
                                                                                                        if(67 == d) {
                                                                                                          e = 1
                                                                                                        }else {
                                                                                                          if(68 == d) {
                                                                                                            f = _h264bsdGetBits(a, 1);
                                                                                                            d = -1 == (f | 0) ? 69 : 70;
                                                                                                            do {
                                                                                                              if(69 == d) {
                                                                                                                e = 1
                                                                                                              }else {
                                                                                                                if(70 == d) {
                                                                                                                  HEAP32[c + 60 >> 2] = 1 == (f | 0) ? 1 : 0;
                                                                                                                  d = 0 != (HEAP32[c + 60 >> 2] | 0) ? 71 : 83;
                                                                                                                  t:do {
                                                                                                                    if(71 == d) {
                                                                                                                      f = _h264bsdDecodeExpGolombUnsigned(a, c + 64);
                                                                                                                      d = 0 != (f | 0) ? 72 : 73;
                                                                                                                      do {
                                                                                                                        if(72 == d) {
                                                                                                                          e = f;
                                                                                                                          break a
                                                                                                                        }else {
                                                                                                                          if(73 == d) {
                                                                                                                            f = _h264bsdDecodeExpGolombUnsigned(a, c + 68);
                                                                                                                            d = 0 != (f | 0) ? 74 : 75;
                                                                                                                            do {
                                                                                                                              if(74 == d) {
                                                                                                                                e = f;
                                                                                                                                break a
                                                                                                                              }else {
                                                                                                                                if(75 == d) {
                                                                                                                                  f = _h264bsdDecodeExpGolombUnsigned(a, c + 72);
                                                                                                                                  d = 0 != (f | 0) ? 76 : 77;
                                                                                                                                  do {
                                                                                                                                    if(76 == d) {
                                                                                                                                      e = f;
                                                                                                                                      break a
                                                                                                                                    }else {
                                                                                                                                      if(77 == d) {
                                                                                                                                        f = _h264bsdDecodeExpGolombUnsigned(a, c + 76);
                                                                                                                                        d = 0 != (f | 0) ? 78 : 79;
                                                                                                                                        do {
                                                                                                                                          if(78 == d) {
                                                                                                                                            e = f;
                                                                                                                                            break a
                                                                                                                                          }else {
                                                                                                                                            if(79 == d) {
                                                                                                                                              d = (HEAP32[c + 64 >> 2] | 0) > ((HEAP32[c + 52 >> 2] << 3) - (HEAP32[c + 68 >> 2] + 1) | 0) ? 81 : 80;
                                                                                                                                              y:do {
                                                                                                                                                if(80 == d) {
                                                                                                                                                  if((HEAP32[c + 72 >> 2] | 0) > ((HEAP32[c + 56 >> 2] << 3) - (HEAP32[c + 76 >> 2] + 1) | 0)) {
                                                                                                                                                    break y
                                                                                                                                                  }
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
                                                                                                                  f = HEAP32[c + 52 >> 2] * HEAP32[c + 56 >> 2];
                                                                                                                  f = _GetDpbSize(f, HEAP32[c + 4 >> 2]);
                                                                                                                  HEAP32[b >> 2] = f;
                                                                                                                  d = 2147483647 == (HEAP32[b >> 2] | 0) ? 85 : 84;
                                                                                                                  t:do {
                                                                                                                    if(84 == d) {
                                                                                                                      d = HEAPU32[c + 44 >> 2] >>> 0 > HEAPU32[b >> 2] >>> 0 ? 85 : 86;
                                                                                                                      break t
                                                                                                                    }
                                                                                                                  }while(0);
                                                                                                                  85 == d && (HEAP32[b >> 2] = HEAP32[c + 44 >> 2]);
                                                                                                                  HEAP32[c + 88 >> 2] = HEAP32[b >> 2];
                                                                                                                  f = _h264bsdGetBits(a, 1);
                                                                                                                  d = -1 == (f | 0) ? 87 : 88;
                                                                                                                  do {
                                                                                                                    if(87 == d) {
                                                                                                                      e = 1
                                                                                                                    }else {
                                                                                                                      if(88 == d) {
                                                                                                                        HEAP32[c + 80 >> 2] = 1 == (f | 0) ? 1 : 0;
                                                                                                                        d = 0 != (HEAP32[c + 80 >> 2] | 0) ? 89 : 103;
                                                                                                                        do {
                                                                                                                          if(89 == d) {
                                                                                                                            e = _H264SwDecMalloc(952);
                                                                                                                            HEAP32[c + 84 >> 2] = e;
                                                                                                                            d = 0 == (HEAP32[c + 84 >> 2] | 0) ? 90 : 91;
                                                                                                                            do {
                                                                                                                              if(90 == d) {
                                                                                                                                e = 65535;
                                                                                                                                break a
                                                                                                                              }else {
                                                                                                                                if(91 == d) {
                                                                                                                                  f = _h264bsdDecodeVuiParameters(a, HEAP32[c + 84 >> 2]);
                                                                                                                                  d = 0 != (f | 0) ? 92 : 93;
                                                                                                                                  do {
                                                                                                                                    if(92 == d) {
                                                                                                                                      e = f;
                                                                                                                                      break a
                                                                                                                                    }else {
                                                                                                                                      if(93 == d) {
                                                                                                                                        d = 0 != (HEAP32[HEAP32[c + 84 >> 2] + 920 >> 2] | 0) ? 94 : 102;
                                                                                                                                        x:do {
                                                                                                                                          if(94 == d) {
                                                                                                                                            d = HEAPU32[HEAP32[c + 84 >> 2] + 944 >> 2] >>> 0 > HEAPU32[HEAP32[c + 84 >> 2] + 948 >> 2] >>> 0 ? 97 : 95;
                                                                                                                                            y:do {
                                                                                                                                              if(95 == d) {
                                                                                                                                                if(HEAPU32[HEAP32[c + 84 >> 2] + 948 >> 2] >>> 0 < HEAPU32[c + 44 >> 2] >>> 0) {
                                                                                                                                                  break y
                                                                                                                                                }
                                                                                                                                                if(HEAPU32[HEAP32[c + 84 >> 2] + 948 >> 2] >>> 0 > HEAPU32[c + 88 >> 2] >>> 0) {
                                                                                                                                                  break y
                                                                                                                                                }
                                                                                                                                                d = 1 > HEAPU32[HEAP32[c + 84 >> 2] + 948 >> 2] >>> 0 ? 99 : 100;
                                                                                                                                                if(99 == d) {
                                                                                                                                                  var h = 1
                                                                                                                                                }else {
                                                                                                                                                  100 == d && (h = HEAP32[HEAP32[c + 84 >> 2] + 948 >> 2])
                                                                                                                                                }
                                                                                                                                                HEAP32[c + 88 >> 2] = h;
                                                                                                                                                break x
                                                                                                                                              }
                                                                                                                                            }while(0);
                                                                                                                                            e = 1;
                                                                                                                                            break a
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
                                                                                                      65 == d && (e = 1)
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
  STACKTOP = b;
  return e
}
_h264bsdDecodeSeqParamSet.X = 1;
function _h264bsdCompareSeqParamSets(a, c) {
  var b, d;
  b = (HEAP32[a >> 2] | 0) == (HEAP32[c >> 2] | 0) ? 1 : 37;
  a:do {
    if(1 == b) {
      if((HEAP32[a + 4 >> 2] | 0) != (HEAP32[c + 4 >> 2] | 0)) {
        b = 37;
        break a
      }
      if((HEAP32[a + 12 >> 2] | 0) != (HEAP32[c + 12 >> 2] | 0)) {
        b = 37;
        break a
      }
      if((HEAP32[a + 16 >> 2] | 0) != (HEAP32[c + 16 >> 2] | 0)) {
        b = 37;
        break a
      }
      if((HEAP32[a + 44 >> 2] | 0) != (HEAP32[c + 44 >> 2] | 0)) {
        b = 37;
        break a
      }
      if((HEAP32[a + 48 >> 2] | 0) != (HEAP32[c + 48 >> 2] | 0)) {
        b = 37;
        break a
      }
      if((HEAP32[a + 52 >> 2] | 0) != (HEAP32[c + 52 >> 2] | 0)) {
        b = 37;
        break a
      }
      if((HEAP32[a + 56 >> 2] | 0) != (HEAP32[c + 56 >> 2] | 0)) {
        b = 37;
        break a
      }
      if((HEAP32[a + 60 >> 2] | 0) != (HEAP32[c + 60 >> 2] | 0)) {
        b = 37;
        break a
      }
      if((HEAP32[a + 80 >> 2] | 0) != (HEAP32[c + 80 >> 2] | 0)) {
        b = 37;
        break a
      }
      b = 0 == (HEAP32[a + 16 >> 2] | 0) ? 11 : 14;
      do {
        if(11 == b) {
          b = (HEAP32[a + 20 >> 2] | 0) != (HEAP32[c + 20 >> 2] | 0) ? 12 : 13;
          do {
            if(12 == b) {
              d = 1;
              b = 38;
              break a
            }
          }while(0)
        }else {
          if(14 == b) {
            b = 1 == (HEAP32[a + 16 >> 2] | 0) ? 15 : 28;
            c:do {
              if(15 == b) {
                b = (HEAP32[a + 24 >> 2] | 0) != (HEAP32[c + 24 >> 2] | 0) ? 19 : 16;
                d:do {
                  if(16 == b) {
                    if((HEAP32[a + 28 >> 2] | 0) != (HEAP32[c + 28 >> 2] | 0)) {
                      break d
                    }
                    if((HEAP32[a + 32 >> 2] | 0) != (HEAP32[c + 32 >> 2] | 0)) {
                      break d
                    }
                    if((HEAP32[a + 36 >> 2] | 0) != (HEAP32[c + 36 >> 2] | 0)) {
                      break d
                    }
                    d = 0;
                    for(;;) {
                      b = d >>> 0 < HEAPU32[a + 36 >> 2] >>> 0 ? 22 : 26;
                      do {
                        if(22 == b) {
                          b = (HEAP32[HEAP32[a + 40 >> 2] + (d << 2) >> 2] | 0) != (HEAP32[HEAP32[c + 40 >> 2] + (d << 2) >> 2] | 0) ? 23 : 24;
                          do {
                            if(23 == b) {
                              d = 1;
                              b = 38;
                              break a
                            }else {
                              24 == b && (d += 1)
                            }
                          }while(0)
                        }else {
                          if(26 == b) {
                            break c
                          }
                        }
                      }while(0)
                    }
                  }
                }while(0);
                d = 1;
                b = 38;
                break a
              }
            }while(0)
          }
        }
      }while(0);
      b = 0 != (HEAP32[a + 60 >> 2] | 0) ? 30 : 36;
      b:do {
        if(30 == b) {
          b = (HEAP32[a + 64 >> 2] | 0) != (HEAP32[c + 64 >> 2] | 0) ? 34 : 31;
          c:do {
            if(31 == b) {
              if((HEAP32[a + 68 >> 2] | 0) != (HEAP32[c + 68 >> 2] | 0)) {
                break c
              }
              if((HEAP32[a + 72 >> 2] | 0) != (HEAP32[c + 72 >> 2] | 0)) {
                break c
              }
              if((HEAP32[a + 76 >> 2] | 0) != (HEAP32[c + 76 >> 2] | 0)) {
                break c
              }
              break b
            }
          }while(0);
          d = 1;
          b = 38;
          break a
        }
      }while(0);
      d = 0;
      b = 38;
      break a
    }
  }while(0);
  37 == b && (d = 1);
  return d
}
_h264bsdCompareSeqParamSets.X = 1;
function _h264bsdDecodePicParamSet(a, c) {
  var b = STACKTOP;
  STACKTOP += 8;
  var d, e, f, g, h = b + 4;
  _H264SwDecMemset(c, 0, 72);
  f = _h264bsdDecodeExpGolombUnsigned(a, c);
  d = 0 != (f | 0) ? 1 : 2;
  a:do {
    if(1 == d) {
      e = f
    }else {
      if(2 == d) {
        d = 256 <= HEAPU32[c >> 2] >>> 0 ? 3 : 4;
        do {
          if(3 == d) {
            e = 1
          }else {
            if(4 == d) {
              f = _h264bsdDecodeExpGolombUnsigned(a, c + 4);
              d = 0 != (f | 0) ? 5 : 6;
              do {
                if(5 == d) {
                  e = f
                }else {
                  if(6 == d) {
                    d = 32 <= HEAPU32[c + 4 >> 2] >>> 0 ? 7 : 8;
                    do {
                      if(7 == d) {
                        e = 1
                      }else {
                        if(8 == d) {
                          f = _h264bsdGetBits(a, 1);
                          d = 0 != (f | 0) ? 9 : 10;
                          do {
                            if(9 == d) {
                              e = 1
                            }else {
                              if(10 == d) {
                                f = _h264bsdGetBits(a, 1);
                                d = -1 == (f | 0) ? 11 : 12;
                                do {
                                  if(11 == d) {
                                    e = 1
                                  }else {
                                    if(12 == d) {
                                      HEAP32[c + 8 >> 2] = 1 == (f | 0) ? 1 : 0;
                                      f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                      d = 0 != (f | 0) ? 13 : 14;
                                      do {
                                        if(13 == d) {
                                          e = f
                                        }else {
                                          if(14 == d) {
                                            HEAP32[c + 12 >> 2] = HEAP32[b >> 2] + 1;
                                            d = 8 < HEAPU32[c + 12 >> 2] >>> 0 ? 15 : 16;
                                            do {
                                              if(15 == d) {
                                                e = 1
                                              }else {
                                                if(16 == d) {
                                                  d = 1 < HEAPU32[c + 12 >> 2] >>> 0 ? 17 : 68;
                                                  do {
                                                    if(17 == d) {
                                                      f = _h264bsdDecodeExpGolombUnsigned(a, c + 16);
                                                      d = 0 != (f | 0) ? 18 : 19;
                                                      do {
                                                        if(18 == d) {
                                                          e = f;
                                                          break a
                                                        }else {
                                                          if(19 == d) {
                                                            d = 6 < HEAPU32[c + 16 >> 2] >>> 0 ? 20 : 21;
                                                            do {
                                                              if(20 == d) {
                                                                e = 1;
                                                                break a
                                                              }else {
                                                                if(21 == d) {
                                                                  d = 0 == (HEAP32[c + 16 >> 2] | 0) ? 22 : 31;
                                                                  l:do {
                                                                    if(22 == d) {
                                                                      g = _H264SwDecMalloc(HEAP32[c + 12 >> 2] << 2);
                                                                      HEAP32[c + 20 >> 2] = g;
                                                                      d = 0 == (HEAP32[c + 20 >> 2] | 0) ? 23 : 24;
                                                                      do {
                                                                        if(23 == d) {
                                                                          e = 65535;
                                                                          break a
                                                                        }else {
                                                                          if(24 == d) {
                                                                            g = 0;
                                                                            for(;;) {
                                                                              d = g >>> 0 < HEAPU32[c + 12 >> 2] >>> 0 ? 26 : 30;
                                                                              do {
                                                                                if(26 == d) {
                                                                                  f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                                                  d = 0 != (f | 0) ? 27 : 28;
                                                                                  do {
                                                                                    if(27 == d) {
                                                                                      e = f;
                                                                                      break a
                                                                                    }else {
                                                                                      28 == d && (HEAP32[HEAP32[c + 20 >> 2] + (g << 2) >> 2] = HEAP32[b >> 2] + 1, g += 1)
                                                                                    }
                                                                                  }while(0)
                                                                                }else {
                                                                                  if(30 == d) {
                                                                                    break l
                                                                                  }
                                                                                }
                                                                              }while(0)
                                                                            }
                                                                          }
                                                                        }
                                                                      }while(0)
                                                                    }else {
                                                                      if(31 == d) {
                                                                        d = 2 == (HEAP32[c + 16 >> 2] | 0) ? 32 : 44;
                                                                        m:do {
                                                                          if(32 == d) {
                                                                            g = _H264SwDecMalloc(HEAP32[c + 12 >> 2] - 1 << 2);
                                                                            HEAP32[c + 24 >> 2] = g;
                                                                            g = _H264SwDecMalloc(HEAP32[c + 12 >> 2] - 1 << 2);
                                                                            HEAP32[c + 28 >> 2] = g;
                                                                            d = 0 == (HEAP32[c + 24 >> 2] | 0) ? 34 : 33;
                                                                            n:do {
                                                                              if(33 == d) {
                                                                                if(0 == (HEAP32[c + 28 >> 2] | 0)) {
                                                                                  break n
                                                                                }
                                                                                g = 0;
                                                                                for(;;) {
                                                                                  d = g >>> 0 < HEAP32[c + 12 >> 2] - 1 >>> 0 ? 37 : 43;
                                                                                  do {
                                                                                    if(37 == d) {
                                                                                      f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                                                      d = 0 != (f | 0) ? 38 : 39;
                                                                                      do {
                                                                                        if(38 == d) {
                                                                                          e = f;
                                                                                          break a
                                                                                        }else {
                                                                                          if(39 == d) {
                                                                                            HEAP32[HEAP32[c + 24 >> 2] + (g << 2) >> 2] = HEAP32[b >> 2];
                                                                                            f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                                                            d = 0 != (f | 0) ? 40 : 41;
                                                                                            do {
                                                                                              if(40 == d) {
                                                                                                e = f;
                                                                                                break a
                                                                                              }else {
                                                                                                41 == d && (HEAP32[HEAP32[c + 28 >> 2] + (g << 2) >> 2] = HEAP32[b >> 2], g += 1)
                                                                                              }
                                                                                            }while(0)
                                                                                          }
                                                                                        }
                                                                                      }while(0)
                                                                                    }else {
                                                                                      if(43 == d) {
                                                                                        break m
                                                                                      }
                                                                                    }
                                                                                  }while(0)
                                                                                }
                                                                              }
                                                                            }while(0);
                                                                            e = 65535;
                                                                            break a
                                                                          }else {
                                                                            if(44 == d) {
                                                                              d = 3 == (HEAP32[c + 16 >> 2] | 0) ? 47 : 45;
                                                                              n:do {
                                                                                if(45 == d) {
                                                                                  if(4 == (HEAP32[c + 16 >> 2] | 0)) {
                                                                                    d = 47;
                                                                                    break n
                                                                                  }
                                                                                  if(5 == (HEAP32[c + 16 >> 2] | 0)) {
                                                                                    d = 47;
                                                                                    break n
                                                                                  }
                                                                                  d = 6 == (HEAP32[c + 16 >> 2] | 0) ? 53 : 64;
                                                                                  o:do {
                                                                                    if(53 == d) {
                                                                                      f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                                                      d = 0 != (f | 0) ? 54 : 55;
                                                                                      do {
                                                                                        if(54 == d) {
                                                                                          e = f;
                                                                                          break a
                                                                                        }else {
                                                                                          if(55 == d) {
                                                                                            HEAP32[c + 40 >> 2] = HEAP32[b >> 2] + 1;
                                                                                            g = _H264SwDecMalloc(HEAP32[c + 40 >> 2] << 2);
                                                                                            HEAP32[c + 44 >> 2] = g;
                                                                                            d = 0 == (HEAP32[c + 44 >> 2] | 0) ? 56 : 57;
                                                                                            do {
                                                                                              if(56 == d) {
                                                                                                e = 65535;
                                                                                                break a
                                                                                              }else {
                                                                                                if(57 == d) {
                                                                                                  f = HEAP32[_CeilLog2NumSliceGroups + (HEAP32[c + 12 >> 2] - 1 << 2) >> 2];
                                                                                                  g = 0;
                                                                                                  for(;;) {
                                                                                                    d = g >>> 0 < HEAPU32[c + 40 >> 2] >>> 0 ? 59 : 63;
                                                                                                    do {
                                                                                                      if(59 == d) {
                                                                                                        d = _h264bsdGetBits(a, f);
                                                                                                        HEAP32[HEAP32[c + 44 >> 2] + (g << 2) >> 2] = d;
                                                                                                        d = HEAPU32[HEAP32[c + 44 >> 2] + (g << 2) >> 2] >>> 0 >= HEAPU32[c + 12 >> 2] >>> 0 ? 60 : 61;
                                                                                                        do {
                                                                                                          if(60 == d) {
                                                                                                            e = 1;
                                                                                                            break a
                                                                                                          }else {
                                                                                                            61 == d && (g += 1)
                                                                                                          }
                                                                                                        }while(0)
                                                                                                      }else {
                                                                                                        if(63 == d) {
                                                                                                          break o
                                                                                                        }
                                                                                                      }
                                                                                                    }while(0)
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }while(0)
                                                                                          }
                                                                                        }
                                                                                      }while(0)
                                                                                    }
                                                                                  }while(0);
                                                                                  d = 65;
                                                                                  break n
                                                                                }
                                                                              }while(0);
                                                                              do {
                                                                                if(47 == d) {
                                                                                  f = _h264bsdGetBits(a, 1);
                                                                                  d = -1 == (f | 0) ? 48 : 49;
                                                                                  do {
                                                                                    if(48 == d) {
                                                                                      e = 1;
                                                                                      break a
                                                                                    }else {
                                                                                      if(49 == d) {
                                                                                        HEAP32[c + 32 >> 2] = 1 == (f | 0) ? 1 : 0;
                                                                                        f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                                                        d = 0 != (f | 0) ? 50 : 51;
                                                                                        do {
                                                                                          if(50 == d) {
                                                                                            e = f;
                                                                                            break a
                                                                                          }else {
                                                                                            51 == d && (HEAP32[c + 36 >> 2] = HEAP32[b >> 2] + 1)
                                                                                          }
                                                                                        }while(0)
                                                                                      }
                                                                                    }
                                                                                  }while(0)
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
                                                  f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                  d = 0 != (f | 0) ? 69 : 70;
                                                  do {
                                                    if(69 == d) {
                                                      e = f
                                                    }else {
                                                      if(70 == d) {
                                                        d = 31 < HEAPU32[b >> 2] >>> 0 ? 71 : 72;
                                                        do {
                                                          if(71 == d) {
                                                            e = 1
                                                          }else {
                                                            if(72 == d) {
                                                              HEAP32[c + 48 >> 2] = HEAP32[b >> 2] + 1;
                                                              f = _h264bsdDecodeExpGolombUnsigned(a, b);
                                                              d = 0 != (f | 0) ? 73 : 74;
                                                              do {
                                                                if(73 == d) {
                                                                  e = f
                                                                }else {
                                                                  if(74 == d) {
                                                                    d = 31 < HEAPU32[b >> 2] >>> 0 ? 75 : 76;
                                                                    do {
                                                                      if(75 == d) {
                                                                        e = 1
                                                                      }else {
                                                                        if(76 == d) {
                                                                          f = _h264bsdGetBits(a, 1);
                                                                          d = 0 != (f | 0) ? 77 : 78;
                                                                          do {
                                                                            if(77 == d) {
                                                                              e = 1
                                                                            }else {
                                                                              if(78 == d) {
                                                                                f = _h264bsdGetBits(a, 2);
                                                                                d = 2 < f >>> 0 ? 79 : 80;
                                                                                do {
                                                                                  if(79 == d) {
                                                                                    e = 1
                                                                                  }else {
                                                                                    if(80 == d) {
                                                                                      f = _h264bsdDecodeExpGolombSigned(a, h);
                                                                                      d = 0 != (f | 0) ? 81 : 82;
                                                                                      do {
                                                                                        if(81 == d) {
                                                                                          e = f
                                                                                        }else {
                                                                                          if(82 == d) {
                                                                                            d = -26 > (HEAP32[h >> 2] | 0) ? 84 : 83;
                                                                                            p:do {
                                                                                              if(83 == d) {
                                                                                                if(25 < (HEAP32[h >> 2] | 0)) {
                                                                                                  break p
                                                                                                }
                                                                                                HEAP32[c + 52 >> 2] = HEAP32[h >> 2] + 26;
                                                                                                f = _h264bsdDecodeExpGolombSigned(a, h);
                                                                                                d = 0 != (f | 0) ? 86 : 87;
                                                                                                do {
                                                                                                  if(86 == d) {
                                                                                                    e = f;
                                                                                                    break a
                                                                                                  }else {
                                                                                                    if(87 == d) {
                                                                                                      d = -26 > (HEAP32[h >> 2] | 0) ? 89 : 88;
                                                                                                      r:do {
                                                                                                        if(88 == d) {
                                                                                                          if(25 < (HEAP32[h >> 2] | 0)) {
                                                                                                            break r
                                                                                                          }
                                                                                                          f = _h264bsdDecodeExpGolombSigned(a, h);
                                                                                                          d = 0 != (f | 0) ? 91 : 92;
                                                                                                          do {
                                                                                                            if(91 == d) {
                                                                                                              e = f;
                                                                                                              break a
                                                                                                            }else {
                                                                                                              if(92 == d) {
                                                                                                                d = -12 > (HEAP32[h >> 2] | 0) ? 94 : 93;
                                                                                                                t:do {
                                                                                                                  if(93 == d) {
                                                                                                                    if(12 < (HEAP32[h >> 2] | 0)) {
                                                                                                                      break t
                                                                                                                    }
                                                                                                                    HEAP32[c + 56 >> 2] = HEAP32[h >> 2];
                                                                                                                    f = _h264bsdGetBits(a, 1);
                                                                                                                    d = -1 == (f | 0) ? 96 : 97;
                                                                                                                    do {
                                                                                                                      if(96 == d) {
                                                                                                                        e = 1;
                                                                                                                        break a
                                                                                                                      }else {
                                                                                                                        if(97 == d) {
                                                                                                                          HEAP32[c + 60 >> 2] = 1 == (f | 0) ? 1 : 0;
                                                                                                                          f = _h264bsdGetBits(a, 1);
                                                                                                                          d = -1 == (f | 0) ? 98 : 99;
                                                                                                                          do {
                                                                                                                            if(98 == d) {
                                                                                                                              e = 1;
                                                                                                                              break a
                                                                                                                            }else {
                                                                                                                              if(99 == d) {
                                                                                                                                HEAP32[c + 64 >> 2] = 1 == (f | 0) ? 1 : 0;
                                                                                                                                f = _h264bsdGetBits(a, 1);
                                                                                                                                d = -1 == (f | 0) ? 100 : 101;
                                                                                                                                do {
                                                                                                                                  if(100 == d) {
                                                                                                                                    e = 1;
                                                                                                                                    break a
                                                                                                                                  }else {
                                                                                                                                    if(101 == d) {
                                                                                                                                      HEAP32[c + 68 >> 2] = 1 == (f | 0) ? 1 : 0;
                                                                                                                                      _h264bsdRbspTrailingBits(a);
                                                                                                                                      e = 0;
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
                                                                                                                e = 1;
                                                                                                                break a
                                                                                                              }
                                                                                                            }
                                                                                                          }while(0)
                                                                                                        }
                                                                                                      }while(0);
                                                                                                      e = 1;
                                                                                                      break a
                                                                                                    }
                                                                                                  }
                                                                                                }while(0)
                                                                                              }
                                                                                            }while(0);
                                                                                            e = 1
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
  STACKTOP = b;
  return e
}
_h264bsdDecodePicParamSet.X = 1;
function _h264bsdDecodeSliceHeader(a, c, b, d, e) {
  var f = STACKTOP;
  STACKTOP += 8;
  var g, h, j, l = f + 4, k;
  _H264SwDecMemset(c, 0, 988);
  k = HEAP32[b + 52 >> 2] * HEAP32[b + 56 >> 2];
  j = _h264bsdDecodeExpGolombUnsigned(a, f);
  g = 0 != (j | 0) ? 1 : 2;
  a:do {
    if(1 == g) {
      h = j
    }else {
      if(2 == g) {
        HEAP32[c >> 2] = HEAP32[f >> 2];
        g = HEAPU32[f >> 2] >>> 0 >= k >>> 0 ? 3 : 4;
        do {
          if(3 == g) {
            h = 1
          }else {
            if(4 == g) {
              j = _h264bsdDecodeExpGolombUnsigned(a, f);
              g = 0 != (j | 0) ? 5 : 6;
              do {
                if(5 == g) {
                  h = j
                }else {
                  if(6 == g) {
                    HEAP32[c + 4 >> 2] = HEAP32[f >> 2];
                    g = 2 == (HEAP32[c + 4 >> 2] | 0) ? 13 : 7;
                    d:do {
                      if(7 == g) {
                        if(7 == (HEAP32[c + 4 >> 2] | 0)) {
                          break d
                        }
                        g = 0 == (HEAP32[c + 4 >> 2] | 0) ? 10 : 9;
                        e:do {
                          if(9 == g) {
                            g = 5 == (HEAP32[c + 4 >> 2] | 0) ? 10 : 12;
                            break e
                          }
                        }while(0);
                        e:do {
                          if(10 == g) {
                            if(5 == (HEAP32[e >> 2] | 0)) {
                              break e
                            }
                            if(0 != (HEAP32[b + 44 >> 2] | 0)) {
                              break d
                            }
                          }
                        }while(0);
                        h = 1;
                        break a
                      }
                    }while(0);
                    j = _h264bsdDecodeExpGolombUnsigned(a, f);
                    g = 0 != (j | 0) ? 14 : 15;
                    do {
                      if(14 == g) {
                        h = j
                      }else {
                        if(15 == g) {
                          HEAP32[c + 8 >> 2] = HEAP32[f >> 2];
                          g = (HEAP32[c + 8 >> 2] | 0) != (HEAP32[d >> 2] | 0) ? 16 : 17;
                          do {
                            if(16 == g) {
                              h = 1
                            }else {
                              if(17 == g) {
                                g = 0;
                                f:for(;;) {
                                  if(0 == (HEAPU32[b + 12 >> 2] >>> (g >>> 0) | 0)) {
                                    break f
                                  }
                                  g += 1
                                }
                                g -= 1;
                                j = _h264bsdGetBits(a, g);
                                g = -1 == (j | 0) ? 21 : 22;
                                do {
                                  if(21 == g) {
                                    h = 1
                                  }else {
                                    if(22 == g) {
                                      g = 5 == (HEAP32[e >> 2] | 0) ? 23 : 25;
                                      g:do {
                                        if(23 == g) {
                                          if(0 == (j | 0)) {
                                            break g
                                          }
                                          h = 1;
                                          break a
                                        }
                                      }while(0);
                                      HEAP32[c + 12 >> 2] = j;
                                      g = 5 == (HEAP32[e >> 2] | 0) ? 26 : 31;
                                      do {
                                        if(26 == g) {
                                          j = _h264bsdDecodeExpGolombUnsigned(a, f);
                                          g = 0 != (j | 0) ? 27 : 28;
                                          do {
                                            if(27 == g) {
                                              h = j;
                                              break a
                                            }else {
                                              if(28 == g) {
                                                HEAP32[c + 16 >> 2] = HEAP32[f >> 2];
                                                g = 65535 < HEAPU32[f >> 2] >>> 0 ? 29 : 30;
                                                do {
                                                  if(29 == g) {
                                                    h = 1;
                                                    break a
                                                  }
                                                }while(0)
                                              }
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      g = 0 == (HEAP32[b + 16 >> 2] | 0) ? 32 : 49;
                                      do {
                                        if(32 == g) {
                                          g = 0;
                                          h:for(;;) {
                                            if(0 == (HEAPU32[b + 20 >> 2] >>> (g >>> 0) | 0)) {
                                              break h
                                            }
                                            g += 1
                                          }
                                          g -= 1;
                                          j = _h264bsdGetBits(a, g);
                                          g = -1 == (j | 0) ? 36 : 37;
                                          do {
                                            if(36 == g) {
                                              h = 1;
                                              break a
                                            }else {
                                              if(37 == g) {
                                                HEAP32[c + 20 >> 2] = j;
                                                g = 0 != (HEAP32[d + 8 >> 2] | 0) ? 38 : 41;
                                                do {
                                                  if(38 == g) {
                                                    j = _h264bsdDecodeExpGolombSigned(a, l);
                                                    g = 0 != (j | 0) ? 39 : 40;
                                                    do {
                                                      if(39 == g) {
                                                        h = j;
                                                        break a
                                                      }else {
                                                        40 == g && (HEAP32[c + 24 >> 2] = HEAP32[l >> 2])
                                                      }
                                                    }while(0)
                                                  }
                                                }while(0);
                                                g = 5 == (HEAP32[e >> 2] | 0) ? 42 : 48;
                                                i:do {
                                                  if(42 == g) {
                                                    g = HEAPU32[c + 20 >> 2] >>> 0 > Math.floor((HEAPU32[b + 20 >> 2] >>> 0) / 2) >>> 0 ? 47 : 43;
                                                    do {
                                                      if(43 == g) {
                                                        g = (HEAP32[c + 20 >> 2] | 0) < (HEAP32[c + 20 >> 2] + HEAP32[c + 24 >> 2] | 0) ? 44 : 45;
                                                        if(44 == g) {
                                                          var m = HEAP32[c + 20 >> 2]
                                                        }else {
                                                          45 == g && (m = HEAP32[c + 20 >> 2] + HEAP32[c + 24 >> 2])
                                                        }
                                                        if(0 == (m | 0)) {
                                                          break i
                                                        }
                                                      }
                                                    }while(0);
                                                    h = 1;
                                                    break a
                                                  }
                                                }while(0)
                                              }
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      g = 1 == (HEAP32[b + 16 >> 2] | 0) ? 50 : 64;
                                      g:do {
                                        if(50 == g) {
                                          if(0 != (HEAP32[b + 24 >> 2] | 0)) {
                                            break g
                                          }
                                          j = _h264bsdDecodeExpGolombSigned(a, l);
                                          g = 0 != (j | 0) ? 52 : 53;
                                          do {
                                            if(52 == g) {
                                              h = j;
                                              break a
                                            }else {
                                              if(53 == g) {
                                                HEAP32[c + 28 >> 2] = HEAP32[l >> 2];
                                                g = 0 != (HEAP32[d + 8 >> 2] | 0) ? 54 : 57;
                                                do {
                                                  if(54 == g) {
                                                    j = _h264bsdDecodeExpGolombSigned(a, l);
                                                    g = 0 != (j | 0) ? 55 : 56;
                                                    do {
                                                      if(55 == g) {
                                                        h = j;
                                                        break a
                                                      }else {
                                                        56 == g && (HEAP32[c + 32 >> 2] = HEAP32[l >> 2])
                                                      }
                                                    }while(0)
                                                  }
                                                }while(0);
                                                g = 5 == (HEAP32[e >> 2] | 0) ? 58 : 63;
                                                i:do {
                                                  if(58 == g) {
                                                    g = (HEAP32[c + 28 >> 2] | 0) < (HEAP32[c + 28 >> 2] + HEAP32[b + 32 >> 2] + HEAP32[c + 32 >> 2] | 0) ? 59 : 60;
                                                    if(59 == g) {
                                                      var o = HEAP32[c + 28 >> 2]
                                                    }else {
                                                      60 == g && (o = HEAP32[c + 28 >> 2] + HEAP32[b + 32 >> 2] + HEAP32[c + 32 >> 2])
                                                    }
                                                    if(0 == (o | 0)) {
                                                      break i
                                                    }
                                                    h = 1;
                                                    break a
                                                  }
                                                }while(0)
                                              }
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      g = 0 != (HEAP32[d + 68 >> 2] | 0) ? 65 : 70;
                                      do {
                                        if(65 == g) {
                                          j = _h264bsdDecodeExpGolombUnsigned(a, f);
                                          g = 0 != (j | 0) ? 66 : 67;
                                          do {
                                            if(66 == g) {
                                              h = j;
                                              break a
                                            }else {
                                              if(67 == g) {
                                                HEAP32[c + 36 >> 2] = HEAP32[f >> 2];
                                                g = 127 < HEAPU32[f >> 2] >>> 0 ? 68 : 69;
                                                do {
                                                  if(68 == g) {
                                                    h = 1;
                                                    break a
                                                  }
                                                }while(0)
                                              }
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      g = 0 == (HEAP32[c + 4 >> 2] | 0) ? 72 : 71;
                                      g:do {
                                        if(71 == g) {
                                          g = 5 == (HEAP32[c + 4 >> 2] | 0) ? 72 : 84;
                                          break g
                                        }
                                      }while(0);
                                      do {
                                        if(72 == g) {
                                          j = _h264bsdGetBits(a, 1);
                                          g = -1 == (j | 0) ? 73 : 74;
                                          do {
                                            if(73 == g) {
                                              h = 1;
                                              break a
                                            }else {
                                              if(74 == g) {
                                                HEAP32[c + 40 >> 2] = j;
                                                g = 0 != (HEAP32[c + 40 >> 2] | 0) ? 75 : 80;
                                                do {
                                                  if(75 == g) {
                                                    j = _h264bsdDecodeExpGolombUnsigned(a, f);
                                                    g = 0 != (j | 0) ? 76 : 77;
                                                    do {
                                                      if(76 == g) {
                                                        h = j;
                                                        break a
                                                      }else {
                                                        if(77 == g) {
                                                          g = 15 < HEAPU32[f >> 2] >>> 0 ? 78 : 79;
                                                          do {
                                                            if(78 == g) {
                                                              h = 1;
                                                              break a
                                                            }else {
                                                              79 == g && (HEAP32[c + 44 >> 2] = HEAP32[f >> 2] + 1)
                                                            }
                                                          }while(0)
                                                        }
                                                      }
                                                    }while(0)
                                                  }else {
                                                    if(80 == g) {
                                                      g = 16 < HEAPU32[d + 48 >> 2] >>> 0 ? 81 : 82;
                                                      do {
                                                        if(81 == g) {
                                                          h = 1;
                                                          break a
                                                        }else {
                                                          82 == g && (HEAP32[c + 44 >> 2] = HEAP32[d + 48 >> 2])
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
                                      g = 0 == (HEAP32[c + 4 >> 2] | 0) ? 86 : 85;
                                      g:do {
                                        if(85 == g) {
                                          g = 5 == (HEAP32[c + 4 >> 2] | 0) ? 86 : 89;
                                          break g
                                        }
                                      }while(0);
                                      do {
                                        if(86 == g) {
                                          j = _RefPicListReordering(a, c + 68, HEAP32[c + 44 >> 2], HEAP32[b + 12 >> 2]);
                                          g = 0 != (j | 0) ? 87 : 88;
                                          do {
                                            if(87 == g) {
                                              h = j;
                                              break a
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      g = 0 != (HEAP32[e + 4 >> 2] | 0) ? 90 : 93;
                                      do {
                                        if(90 == g) {
                                          j = _DecRefPicMarking(a, c + 276, HEAP32[e >> 2], HEAP32[b + 44 >> 2]);
                                          g = 0 != (j | 0) ? 91 : 92;
                                          do {
                                            if(91 == g) {
                                              h = j;
                                              break a
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      j = _h264bsdDecodeExpGolombSigned(a, l);
                                      g = 0 != (j | 0) ? 94 : 95;
                                      do {
                                        if(94 == g) {
                                          h = j
                                        }else {
                                          if(95 == g) {
                                            HEAP32[c + 48 >> 2] = HEAP32[l >> 2];
                                            HEAP32[l >> 2] += HEAP32[d + 52 >> 2];
                                            g = 0 > (HEAP32[l >> 2] | 0) ? 97 : 96;
                                            h:do {
                                              if(96 == g) {
                                                if(51 < (HEAP32[l >> 2] | 0)) {
                                                  break h
                                                }
                                                g = 0 != (HEAP32[d + 60 >> 2] | 0) ? 99 : 116;
                                                do {
                                                  if(99 == g) {
                                                    j = _h264bsdDecodeExpGolombUnsigned(a, f);
                                                    g = 0 != (j | 0) ? 100 : 101;
                                                    do {
                                                      if(100 == g) {
                                                        h = j;
                                                        break a
                                                      }else {
                                                        if(101 == g) {
                                                          HEAP32[c + 52 >> 2] = HEAP32[f >> 2];
                                                          g = 2 < HEAPU32[c + 52 >> 2] >>> 0 ? 102 : 103;
                                                          do {
                                                            if(102 == g) {
                                                              h = 1;
                                                              break a
                                                            }else {
                                                              if(103 == g) {
                                                                g = 1 != (HEAP32[c + 52 >> 2] | 0) ? 104 : 115;
                                                                l:do {
                                                                  if(104 == g) {
                                                                    j = _h264bsdDecodeExpGolombSigned(a, l);
                                                                    g = 0 != (j | 0) ? 105 : 106;
                                                                    do {
                                                                      if(105 == g) {
                                                                        h = j;
                                                                        break a
                                                                      }else {
                                                                        if(106 == g) {
                                                                          g = -6 > (HEAP32[l >> 2] | 0) ? 108 : 107;
                                                                          n:do {
                                                                            if(107 == g) {
                                                                              if(6 < (HEAP32[l >> 2] | 0)) {
                                                                                break n
                                                                              }
                                                                              HEAP32[c + 56 >> 2] = HEAP32[l >> 2] << 1;
                                                                              j = _h264bsdDecodeExpGolombSigned(a, l);
                                                                              g = 0 != (j | 0) ? 110 : 111;
                                                                              do {
                                                                                if(110 == g) {
                                                                                  h = j;
                                                                                  break a
                                                                                }else {
                                                                                  if(111 == g) {
                                                                                    g = -6 > (HEAP32[l >> 2] | 0) ? 113 : 112;
                                                                                    p:do {
                                                                                      if(112 == g) {
                                                                                        if(6 < (HEAP32[l >> 2] | 0)) {
                                                                                          break p
                                                                                        }
                                                                                        HEAP32[c + 60 >> 2] = HEAP32[l >> 2] << 1;
                                                                                        break l
                                                                                      }
                                                                                    }while(0);
                                                                                    h = 1;
                                                                                    break a
                                                                                  }
                                                                                }
                                                                              }while(0)
                                                                            }
                                                                          }while(0);
                                                                          h = 1;
                                                                          break a
                                                                        }
                                                                      }
                                                                    }while(0)
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
                                                g = 1 < HEAPU32[d + 12 >> 2] >>> 0 ? 117 : 124;
                                                i:do {
                                                  if(117 == g) {
                                                    if(!(3 <= HEAPU32[d + 16 >> 2] >>> 0)) {
                                                      break i
                                                    }
                                                    if(!(5 >= HEAPU32[d + 16 >> 2] >>> 0)) {
                                                      break i
                                                    }
                                                    j = _NumSliceGroupChangeCycleBits(k, HEAP32[d + 36 >> 2]);
                                                    b = _h264bsdGetBits(a, j);
                                                    HEAP32[f >> 2] = b;
                                                    g = -1 == (HEAP32[f >> 2] | 0) ? 120 : 121;
                                                    do {
                                                      if(120 == g) {
                                                        h = 1;
                                                        break a
                                                      }else {
                                                        if(121 == g) {
                                                          HEAP32[c + 64 >> 2] = HEAP32[f >> 2];
                                                          j = Math.floor((k + HEAP32[d + 36 >> 2] - 1 >>> 0) / (HEAPU32[d + 36 >> 2] >>> 0));
                                                          g = HEAPU32[c + 64 >> 2] >>> 0 > j >>> 0 ? 122 : 123;
                                                          do {
                                                            if(122 == g) {
                                                              h = 1;
                                                              break a
                                                            }
                                                          }while(0)
                                                        }
                                                      }
                                                    }while(0)
                                                  }
                                                }while(0);
                                                h = 0;
                                                break a
                                              }
                                            }while(0);
                                            h = 1
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
function _NumSliceGroupChangeCycleBits(a, c) {
  var b, d;
  b = 0 != ((a >>> 0) % (c >>> 0) | 0) ? 1 : 2;
  1 == b ? d = Math.floor((a >>> 0) / (c >>> 0)) + 2 : 2 == b && (d = Math.floor((a >>> 0) / (c >>> 0)) + 1);
  b = 0;
  a:for(;;) {
    var e = b + 1;
    b = e;
    if(0 == (d & -1 << e | 0)) {
      break a
    }
  }
  b -= 1;
  7 == (0 != (d & (1 << b) - 1 | 0) ? 7 : 8) && (b += 1);
  return b
}
_NumSliceGroupChangeCycleBits.X = 1;
function _RefPicListReordering(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 8;
  var f, g, h, j = e + 4;
  h = _h264bsdGetBits(a, 1);
  f = -1 == (h | 0) ? 1 : 2;
  a:do {
    if(1 == f) {
      g = 1
    }else {
      if(2 == f) {
        HEAP32[c >> 2] = h;
        f = 0 != (HEAP32[c >> 2] | 0) ? 3 : 27;
        b:do {
          if(3 == f) {
            g = 0;
            c:for(;;) {
              f = g >>> 0 > b >>> 0 ? 5 : 6;
              do {
                if(5 == f) {
                  g = 1;
                  break a
                }else {
                  if(6 == f) {
                    h = _h264bsdDecodeExpGolombUnsigned(a, j);
                    f = 0 != (h | 0) ? 7 : 8;
                    do {
                      if(7 == f) {
                        g = h;
                        break a
                      }else {
                        if(8 == f) {
                          f = 3 < HEAPU32[j >> 2] >>> 0 ? 9 : 10;
                          do {
                            if(9 == f) {
                              g = 1;
                              break a
                            }else {
                              if(10 == f) {
                                HEAP32[c + 4 + 12 * g >> 2] = HEAP32[j >> 2];
                                f = 0 == (HEAP32[j >> 2] | 0) ? 12 : 11;
                                g:do {
                                  if(11 == f) {
                                    if(1 == (HEAP32[j >> 2] | 0)) {
                                      f = 12;
                                      break g
                                    }
                                    f = 2 == (HEAP32[j >> 2] | 0) ? 18 : 21;
                                    do {
                                      if(18 == f) {
                                        h = _h264bsdDecodeExpGolombUnsigned(a, e);
                                        f = 0 != (h | 0) ? 19 : 20;
                                        do {
                                          if(19 == f) {
                                            g = h;
                                            break a
                                          }else {
                                            20 == f && (HEAP32[c + 4 + 12 * g + 8 >> 2] = HEAP32[e >> 2])
                                          }
                                        }while(0)
                                      }
                                    }while(0);
                                    f = 22;
                                    break g
                                  }
                                }while(0);
                                do {
                                  if(12 == f) {
                                    h = _h264bsdDecodeExpGolombUnsigned(a, e);
                                    f = 0 != (h | 0) ? 13 : 14;
                                    do {
                                      if(13 == f) {
                                        g = h;
                                        break a
                                      }else {
                                        if(14 == f) {
                                          f = HEAPU32[e >> 2] >>> 0 >= d >>> 0 ? 15 : 16;
                                          do {
                                            if(15 == f) {
                                              g = 1;
                                              break a
                                            }else {
                                              16 == f && (HEAP32[c + 4 + 12 * g + 4 >> 2] = HEAP32[e >> 2] + 1)
                                            }
                                          }while(0)
                                        }
                                      }
                                    }while(0)
                                  }
                                }while(0);
                                g += 1;
                                if(3 != (HEAP32[j >> 2] | 0)) {
                                  continue c
                                }
                                f = 1 == (g | 0) ? 25 : 26;
                                do {
                                  if(25 == f) {
                                    g = 1;
                                    break a
                                  }else {
                                    if(26 == f) {
                                      break b
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
        g = 0
      }
    }
  }while(0);
  STACKTOP = e;
  return g
}
_RefPicListReordering.X = 1;
function _DecRefPicMarking(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 8;
  var f, g, h, j = e + 4, l, k, m, o;
  o = m = k = l = 0;
  b = 5 == (b | 0) ? 1 : 9;
  a:do {
    if(1 == b) {
      g = _h264bsdGetBits(a, 1);
      b = -1 == (g | 0) ? 2 : 3;
      do {
        if(2 == b) {
          f = 1;
          b = 60;
          break a
        }else {
          if(3 == b) {
            HEAP32[c >> 2] = g;
            g = _h264bsdGetBits(a, 1);
            b = -1 == (g | 0) ? 4 : 5;
            do {
              if(4 == b) {
                f = 1;
                b = 60;
                break a
              }else {
                if(5 == b) {
                  HEAP32[c + 4 >> 2] = g;
                  b = 0 != (d | 0) ? 8 : 6;
                  d:do {
                    if(6 == b) {
                      if(0 == (HEAP32[c + 4 >> 2] | 0)) {
                        break d
                      }
                      f = 1;
                      b = 60;
                      break a
                    }
                  }while(0);
                  b = 59;
                  break a
                }
              }
            }while(0)
          }
        }
      }while(0)
    }else {
      if(9 == b) {
        g = _h264bsdGetBits(a, 1);
        b = -1 == (g | 0) ? 10 : 11;
        do {
          if(10 == b) {
            f = 1;
            b = 60;
            break a
          }else {
            if(11 == b) {
              HEAP32[c + 8 >> 2] = g;
              b = 0 != (HEAP32[c + 8 >> 2] | 0) ? 12 : 58;
              c:do {
                if(12 == b) {
                  h = 0;
                  d:for(;;) {
                    b = h >>> 0 > (d << 1) + 2 >>> 0 ? 14 : 15;
                    do {
                      if(14 == b) {
                        f = 1;
                        b = 60;
                        break a
                      }else {
                        if(15 == b) {
                          g = _h264bsdDecodeExpGolombUnsigned(a, j);
                          b = 0 != (g | 0) ? 16 : 17;
                          do {
                            if(16 == b) {
                              f = g;
                              b = 60;
                              break a
                            }else {
                              if(17 == b) {
                                b = 6 < HEAPU32[j >> 2] >>> 0 ? 18 : 19;
                                do {
                                  if(18 == b) {
                                    f = 1;
                                    b = 60;
                                    break a
                                  }else {
                                    if(19 == b) {
                                      HEAP32[c + 12 + 20 * h >> 2] = HEAP32[j >> 2];
                                      b = 1 == (HEAP32[j >> 2] | 0) ? 21 : 20;
                                      h:do {
                                        if(20 == b) {
                                          b = 3 == (HEAP32[j >> 2] | 0) ? 21 : 24;
                                          break h
                                        }
                                      }while(0);
                                      do {
                                        if(21 == b) {
                                          g = _h264bsdDecodeExpGolombUnsigned(a, e);
                                          b = 0 != (g | 0) ? 22 : 23;
                                          do {
                                            if(22 == b) {
                                              f = g;
                                              b = 60;
                                              break a
                                            }else {
                                              23 == b && (HEAP32[c + 12 + 20 * h + 4 >> 2] = HEAP32[e >> 2] + 1)
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      b = 2 == (HEAP32[j >> 2] | 0) ? 25 : 28;
                                      do {
                                        if(25 == b) {
                                          g = _h264bsdDecodeExpGolombUnsigned(a, e);
                                          b = 0 != (g | 0) ? 26 : 27;
                                          do {
                                            if(26 == b) {
                                              f = g;
                                              b = 60;
                                              break a
                                            }else {
                                              27 == b && (HEAP32[c + 12 + 20 * h + 8 >> 2] = HEAP32[e >> 2])
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      b = 3 == (HEAP32[j >> 2] | 0) ? 30 : 29;
                                      h:do {
                                        if(29 == b) {
                                          b = 6 == (HEAP32[j >> 2] | 0) ? 30 : 33;
                                          break h
                                        }
                                      }while(0);
                                      do {
                                        if(30 == b) {
                                          g = _h264bsdDecodeExpGolombUnsigned(a, e);
                                          b = 0 != (g | 0) ? 31 : 32;
                                          do {
                                            if(31 == b) {
                                              f = g;
                                              b = 60;
                                              break a
                                            }else {
                                              32 == b && (HEAP32[c + 12 + 20 * h + 12 >> 2] = HEAP32[e >> 2])
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      b = 4 == (HEAP32[j >> 2] | 0) ? 34 : 42;
                                      do {
                                        if(34 == b) {
                                          g = _h264bsdDecodeExpGolombUnsigned(a, e);
                                          b = 0 != (g | 0) ? 35 : 36;
                                          do {
                                            if(35 == b) {
                                              f = g;
                                              b = 60;
                                              break a
                                            }else {
                                              if(36 == b) {
                                                b = HEAPU32[e >> 2] >>> 0 > d >>> 0 ? 37 : 38;
                                                do {
                                                  if(37 == b) {
                                                    f = 1;
                                                    b = 60;
                                                    break a
                                                  }else {
                                                    38 == b && (b = 0 == (HEAP32[e >> 2] | 0) ? 39 : 40, 39 == b ? HEAP32[c + 12 + 20 * h + 16 >> 2] = 65535 : 40 == b && (HEAP32[c + 12 + 20 * h + 16 >> 2] = HEAP32[e >> 2] - 1), l += 1)
                                                  }
                                                }while(0)
                                              }
                                            }
                                          }while(0)
                                        }
                                      }while(0);
                                      b = 5 == (HEAP32[j >> 2] | 0) ? 43 : 44;
                                      43 == b && (k += 1);
                                      b = 0 != (HEAP32[j >> 2] | 0) ? 45 : 47;
                                      h:do {
                                        if(45 == b) {
                                          if(!(3 >= HEAPU32[j >> 2] >>> 0)) {
                                            break h
                                          }
                                          o += 1
                                        }
                                      }while(0);
                                      b = 6 == (HEAP32[j >> 2] | 0) ? 48 : 49;
                                      48 == b && (m += 1);
                                      h += 1;
                                      if(0 != (HEAP32[j >> 2] | 0)) {
                                        continue d
                                      }
                                      b = 1 < l >>> 0 ? 56 : 52;
                                      h:do {
                                        if(52 == b) {
                                          if(1 < k >>> 0) {
                                            break h
                                          }
                                          if(1 < m >>> 0) {
                                            break h
                                          }
                                          b = 0 != (o | 0) ? 55 : 57;
                                          do {
                                            if(55 == b && 0 != (k | 0)) {
                                              break h
                                            }
                                          }while(0);
                                          break c
                                        }
                                      }while(0);
                                      f = 1;
                                      b = 60;
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
              }while(0);
              b = 59;
              break a
            }
          }
        }while(0)
      }
    }
  }while(0);
  59 == b && (f = 0);
  STACKTOP = e;
  return f
}
_DecRefPicMarking.X = 1;
function _h264bsdCheckPpsId(a, c) {
  var b = STACKTOP;
  STACKTOP += 24;
  var d, e, f, g = b + 4, h, j;
  d = a;
  f = g;
  h = d + 20;
  if(f % 4 == d % 4) {
    for(;0 !== d % 4 && d < h;) {
      HEAP8[f++] = HEAP8[d++]
    }
    d >>= 2;
    f >>= 2;
    for(j = h >> 2;d < j;) {
      HEAP32[f++] = HEAP32[d++]
    }
    d <<= 2;
    f <<= 2
  }
  for(;d < h;) {
    HEAP8[f++] = HEAP8[d++]
  }
  f = _h264bsdDecodeExpGolombUnsigned(g, b);
  d = 0 != (f | 0) ? 1 : 2;
  1 == d ? e = f : 2 == d && (f = _h264bsdDecodeExpGolombUnsigned(g, b), d = 0 != (f | 0) ? 3 : 4, 3 == d ? e = f : 4 == d && (f = _h264bsdDecodeExpGolombUnsigned(g, b), d = 0 != (f | 0) ? 5 : 6, 5 == d ? e = f : 6 == d && (d = 256 <= HEAPU32[b >> 2] >>> 0 ? 7 : 8, 7 == d ? e = 1 : 8 == d && (HEAP32[c >> 2] = HEAP32[b >> 2], e = 0))));
  STACKTOP = b;
  return e
}
_h264bsdCheckPpsId.X = 1;
function _h264bsdCheckFrameNum(a, c, b) {
  var d = STACKTOP;
  STACKTOP += 24;
  var e, f, g = d + 4, h, j;
  f = g;
  h = a + 20;
  if(f % 4 == a % 4) {
    for(;0 !== a % 4 && a < h;) {
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
  f = _h264bsdDecodeExpGolombUnsigned(g, d);
  a = 0 != (f | 0) ? 1 : 2;
  do {
    if(1 == a) {
      e = f
    }else {
      if(2 == a) {
        f = _h264bsdDecodeExpGolombUnsigned(g, d);
        a = 0 != (f | 0) ? 3 : 4;
        do {
          if(3 == a) {
            e = f
          }else {
            if(4 == a) {
              f = _h264bsdDecodeExpGolombUnsigned(g, d);
              a = 0 != (f | 0) ? 5 : 6;
              do {
                if(5 == a) {
                  e = f
                }else {
                  if(6 == a) {
                    a = 0;
                    d:for(;;) {
                      if(0 == (c >>> (a >>> 0) | 0)) {
                        break d
                      }
                      a += 1
                    }
                    a -= 1;
                    f = _h264bsdGetBits(g, a);
                    a = -1 == (f | 0) ? 10 : 11;
                    10 == a ? e = 1 : 11 == a && (HEAP32[b >> 2] = f, e = 0)
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
_h264bsdCheckFrameNum.X = 1;
function _h264bsdCheckIdrPicId(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 24;
  var f, g, h = e + 4, b = 5 != (b | 0) ? 1 : 2;
  do {
    if(1 == b) {
      f = 1
    }else {
      if(2 == b) {
        g = h;
        var j, l, b = a;
        j = b + 20;
        if(g % 4 == b % 4) {
          for(;0 !== b % 4 && b < j;) {
            HEAP8[g++] = HEAP8[b++]
          }
          b >>= 2;
          g >>= 2;
          for(l = j >> 2;b < l;) {
            HEAP32[g++] = HEAP32[b++]
          }
          b <<= 2;
          g <<= 2
        }
        for(;b < j;) {
          HEAP8[g++] = HEAP8[b++]
        }
        g = _h264bsdDecodeExpGolombUnsigned(h, e);
        b = 0 != (g | 0) ? 3 : 4;
        do {
          if(3 == b) {
            f = g
          }else {
            if(4 == b) {
              g = _h264bsdDecodeExpGolombUnsigned(h, e);
              b = 0 != (g | 0) ? 5 : 6;
              do {
                if(5 == b) {
                  f = g
                }else {
                  if(6 == b) {
                    g = _h264bsdDecodeExpGolombUnsigned(h, e);
                    b = 0 != (g | 0) ? 7 : 8;
                    do {
                      if(7 == b) {
                        f = g
                      }else {
                        if(8 == b) {
                          b = 0;
                          e:for(;;) {
                            if(0 == (c >>> (b >>> 0) | 0)) {
                              break e
                            }
                            b += 1
                          }
                          b -= 1;
                          g = _h264bsdGetBits(h, b);
                          b = -1 == (g | 0) ? 12 : 13;
                          12 == b ? f = 1 : 13 == b && (g = _h264bsdDecodeExpGolombUnsigned(h, d), b = 0 != (g | 0) ? 14 : 15, 14 == b ? f = g : 15 == b && (f = 0))
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
function _h264bsdCheckPicOrderCntLsb(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 24;
  var f, g, h = e + 4, j, l;
  g = h;
  j = a + 20;
  if(g % 4 == a % 4) {
    for(;0 !== a % 4 && a < j;) {
      HEAP8[g++] = HEAP8[a++]
    }
    a >>= 2;
    g >>= 2;
    for(l = j >> 2;a < l;) {
      HEAP32[g++] = HEAP32[a++]
    }
    a <<= 2;
    g <<= 2
  }
  for(;a < j;) {
    HEAP8[g++] = HEAP8[a++]
  }
  g = _h264bsdDecodeExpGolombUnsigned(h, e);
  a = 0 != (g | 0) ? 1 : 2;
  a:do {
    if(1 == a) {
      f = g
    }else {
      if(2 == a) {
        g = _h264bsdDecodeExpGolombUnsigned(h, e);
        a = 0 != (g | 0) ? 3 : 4;
        do {
          if(3 == a) {
            f = g
          }else {
            if(4 == a) {
              g = _h264bsdDecodeExpGolombUnsigned(h, e);
              a = 0 != (g | 0) ? 5 : 6;
              do {
                if(5 == a) {
                  f = g
                }else {
                  if(6 == a) {
                    a = 0;
                    d:for(;;) {
                      if(0 == (HEAPU32[c + 12 >> 2] >>> (a >>> 0) | 0)) {
                        break d
                      }
                      a += 1
                    }
                    a -= 1;
                    g = _h264bsdGetBits(h, a);
                    a = -1 == (g | 0) ? 10 : 11;
                    do {
                      if(10 == a) {
                        f = 1
                      }else {
                        if(11 == a) {
                          a = 5 == (b | 0) ? 12 : 15;
                          do {
                            if(12 == a) {
                              g = _h264bsdDecodeExpGolombUnsigned(h, e);
                              a = 0 != (g | 0) ? 13 : 14;
                              do {
                                if(13 == a) {
                                  f = g;
                                  break a
                                }
                              }while(0)
                            }
                          }while(0);
                          a = 0;
                          e:for(;;) {
                            if(0 == (HEAPU32[c + 20 >> 2] >>> (a >>> 0) | 0)) {
                              break e
                            }
                            a += 1
                          }
                          a -= 1;
                          g = _h264bsdGetBits(h, a);
                          a = -1 == (g | 0) ? 19 : 20;
                          19 == a ? f = 1 : 20 == a && (HEAP32[d >> 2] = g, f = 0)
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
_h264bsdCheckPicOrderCntLsb.X = 1;
function _h264bsdCheckDeltaPicOrderCntBottom(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 24;
  var f, g, h = e + 4, j, l;
  g = h;
  j = a + 20;
  if(g % 4 == a % 4) {
    for(;0 !== a % 4 && a < j;) {
      HEAP8[g++] = HEAP8[a++]
    }
    a >>= 2;
    g >>= 2;
    for(l = j >> 2;a < l;) {
      HEAP32[g++] = HEAP32[a++]
    }
    a <<= 2;
    g <<= 2
  }
  for(;a < j;) {
    HEAP8[g++] = HEAP8[a++]
  }
  g = _h264bsdDecodeExpGolombUnsigned(h, e);
  a = 0 != (g | 0) ? 1 : 2;
  a:do {
    if(1 == a) {
      f = g
    }else {
      if(2 == a) {
        g = _h264bsdDecodeExpGolombUnsigned(h, e);
        a = 0 != (g | 0) ? 3 : 4;
        do {
          if(3 == a) {
            f = g
          }else {
            if(4 == a) {
              g = _h264bsdDecodeExpGolombUnsigned(h, e);
              a = 0 != (g | 0) ? 5 : 6;
              do {
                if(5 == a) {
                  f = g
                }else {
                  if(6 == a) {
                    a = 0;
                    d:for(;;) {
                      if(0 == (HEAPU32[c + 12 >> 2] >>> (a >>> 0) | 0)) {
                        break d
                      }
                      a += 1
                    }
                    a -= 1;
                    g = _h264bsdGetBits(h, a);
                    a = -1 == (g | 0) ? 10 : 11;
                    do {
                      if(10 == a) {
                        f = 1
                      }else {
                        if(11 == a) {
                          a = 5 == (b | 0) ? 12 : 15;
                          do {
                            if(12 == a) {
                              g = _h264bsdDecodeExpGolombUnsigned(h, e);
                              a = 0 != (g | 0) ? 13 : 14;
                              do {
                                if(13 == a) {
                                  f = g;
                                  break a
                                }
                              }while(0)
                            }
                          }while(0);
                          a = 0;
                          e:for(;;) {
                            if(0 == (HEAPU32[c + 20 >> 2] >>> (a >>> 0) | 0)) {
                              break e
                            }
                            a += 1
                          }
                          a -= 1;
                          g = _h264bsdGetBits(h, a);
                          a = -1 == (g | 0) ? 19 : 20;
                          19 == a ? f = 1 : 20 == a && (g = _h264bsdDecodeExpGolombSigned(h, d), a = 0 != (g | 0) ? 21 : 22, 21 == a ? f = g : 22 == a && (f = 0))
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
_h264bsdCheckDeltaPicOrderCntBottom.X = 1;
function _h264bsdCheckDeltaPicOrderCnt(a, c, b, d, e) {
  var f = STACKTOP;
  STACKTOP += 24;
  var g, h, j = f + 4, l, k;
  h = j;
  l = a + 20;
  if(h % 4 == a % 4) {
    for(;0 !== a % 4 && a < l;) {
      HEAP8[h++] = HEAP8[a++]
    }
    a >>= 2;
    h >>= 2;
    for(k = l >> 2;a < k;) {
      HEAP32[h++] = HEAP32[a++]
    }
    a <<= 2;
    h <<= 2
  }
  for(;a < l;) {
    HEAP8[h++] = HEAP8[a++]
  }
  h = _h264bsdDecodeExpGolombUnsigned(j, f);
  a = 0 != (h | 0) ? 1 : 2;
  a:do {
    if(1 == a) {
      g = h
    }else {
      if(2 == a) {
        h = _h264bsdDecodeExpGolombUnsigned(j, f);
        a = 0 != (h | 0) ? 3 : 4;
        do {
          if(3 == a) {
            g = h
          }else {
            if(4 == a) {
              h = _h264bsdDecodeExpGolombUnsigned(j, f);
              a = 0 != (h | 0) ? 5 : 6;
              do {
                if(5 == a) {
                  g = h
                }else {
                  if(6 == a) {
                    a = 0;
                    d:for(;;) {
                      if(0 == (HEAPU32[c + 12 >> 2] >>> (a >>> 0) | 0)) {
                        break d
                      }
                      a += 1
                    }
                    a -= 1;
                    h = _h264bsdGetBits(j, a);
                    a = -1 == (h | 0) ? 10 : 11;
                    do {
                      if(10 == a) {
                        g = 1
                      }else {
                        if(11 == a) {
                          a = 5 == (b | 0) ? 12 : 15;
                          do {
                            if(12 == a) {
                              h = _h264bsdDecodeExpGolombUnsigned(j, f);
                              a = 0 != (h | 0) ? 13 : 14;
                              do {
                                if(13 == a) {
                                  g = h;
                                  break a
                                }
                              }while(0)
                            }
                          }while(0);
                          h = _h264bsdDecodeExpGolombSigned(j, e);
                          a = 0 != (h | 0) ? 16 : 17;
                          do {
                            if(16 == a) {
                              g = h
                            }else {
                              if(17 == a) {
                                a = 0 != (d | 0) ? 18 : 21;
                                do {
                                  if(18 == a) {
                                    h = _h264bsdDecodeExpGolombSigned(j, e + 4);
                                    a = 0 != (h | 0) ? 19 : 20;
                                    do {
                                      if(19 == a) {
                                        g = h;
                                        break a
                                      }
                                    }while(0)
                                  }
                                }while(0);
                                g = 0
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
  return g
}
_h264bsdCheckDeltaPicOrderCnt.X = 1;
function _h264bsdCheckRedundantPicCnt(a, c, b, d, e) {
  var f = STACKTOP;
  STACKTOP += 28;
  var g, h, j = f + 4, l = f + 8, k, m;
  h = l;
  k = a + 20;
  if(h % 4 == a % 4) {
    for(;0 !== a % 4 && a < k;) {
      HEAP8[h++] = HEAP8[a++]
    }
    a >>= 2;
    h >>= 2;
    for(m = k >> 2;a < m;) {
      HEAP32[h++] = HEAP32[a++]
    }
    a <<= 2;
    h <<= 2
  }
  for(;a < k;) {
    HEAP8[h++] = HEAP8[a++]
  }
  h = _h264bsdDecodeExpGolombUnsigned(l, f);
  a = 0 != (h | 0) ? 1 : 2;
  a:do {
    if(1 == a) {
      g = h
    }else {
      if(2 == a) {
        h = _h264bsdDecodeExpGolombUnsigned(l, f);
        a = 0 != (h | 0) ? 3 : 4;
        do {
          if(3 == a) {
            g = h
          }else {
            if(4 == a) {
              h = _h264bsdDecodeExpGolombUnsigned(l, f);
              a = 0 != (h | 0) ? 5 : 6;
              do {
                if(5 == a) {
                  g = h
                }else {
                  if(6 == a) {
                    a = 0;
                    d:for(;;) {
                      if(0 == (HEAPU32[c + 12 >> 2] >>> (a >>> 0) | 0)) {
                        break d
                      }
                      a += 1
                    }
                    a -= 1;
                    h = _h264bsdGetBits(l, a);
                    a = -1 == (h | 0) ? 10 : 11;
                    do {
                      if(10 == a) {
                        g = 1
                      }else {
                        if(11 == a) {
                          a = 5 == (d | 0) ? 12 : 15;
                          do {
                            if(12 == a) {
                              h = _h264bsdDecodeExpGolombUnsigned(l, f);
                              a = 0 != (h | 0) ? 13 : 14;
                              do {
                                if(13 == a) {
                                  g = h;
                                  break a
                                }
                              }while(0)
                            }
                          }while(0);
                          a = 0 == (HEAP32[c + 16 >> 2] | 0) ? 16 : 26;
                          do {
                            if(16 == a) {
                              a = 0;
                              f:for(;;) {
                                if(0 == (HEAPU32[c + 20 >> 2] >>> (a >>> 0) | 0)) {
                                  break f
                                }
                                a += 1
                              }
                              a -= 1;
                              h = _h264bsdGetBits(l, a);
                              a = -1 == (h | 0) ? 20 : 21;
                              do {
                                if(20 == a) {
                                  g = 1;
                                  break a
                                }else {
                                  if(21 == a) {
                                    a = 0 != (HEAP32[b + 8 >> 2] | 0) ? 22 : 25;
                                    do {
                                      if(22 == a) {
                                        h = _h264bsdDecodeExpGolombSigned(l, j);
                                        a = 0 != (h | 0) ? 23 : 24;
                                        do {
                                          if(23 == a) {
                                            g = h;
                                            break a
                                          }
                                        }while(0)
                                      }
                                    }while(0)
                                  }
                                }
                              }while(0)
                            }
                          }while(0);
                          a = 1 == (HEAP32[c + 16 >> 2] | 0) ? 27 : 35;
                          e:do {
                            if(27 == a) {
                              if(0 != (HEAP32[c + 24 >> 2] | 0)) {
                                break e
                              }
                              h = _h264bsdDecodeExpGolombSigned(l, j);
                              a = 0 != (h | 0) ? 29 : 30;
                              do {
                                if(29 == a) {
                                  g = h;
                                  break a
                                }else {
                                  if(30 == a) {
                                    a = 0 != (HEAP32[b + 8 >> 2] | 0) ? 31 : 34;
                                    do {
                                      if(31 == a) {
                                        h = _h264bsdDecodeExpGolombSigned(l, j);
                                        a = 0 != (h | 0) ? 32 : 33;
                                        do {
                                          if(32 == a) {
                                            g = h;
                                            break a
                                          }
                                        }while(0)
                                      }
                                    }while(0)
                                  }
                                }
                              }while(0)
                            }
                          }while(0);
                          h = _h264bsdDecodeExpGolombUnsigned(l, e);
                          a = 0 != (h | 0) ? 36 : 37;
                          36 == a ? g = h : 37 == a && (g = 0)
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
  return g
}
_h264bsdCheckRedundantPicCnt.X = 1;
function _SetMbParams(a, c, b, d) {
  var e, f;
  e = HEAP32[c + 52 >> 2];
  f = HEAP32[c + 56 >> 2];
  c = HEAP32[c + 60 >> 2];
  HEAP32[a + 4 >> 2] = b;
  HEAP32[a + 8 >> 2] = e;
  HEAP32[a + 12 >> 2] = f;
  HEAP32[a + 16 >> 2] = c;
  HEAP32[a + 24 >> 2] = d
}
function _h264bsdCheckPriorPicsFlag(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 28;
  var f, g, h = e + 4, j = e + 8, l, k;
  f = j;
  l = c + 20;
  if(f % 4 == c % 4) {
    for(;0 !== c % 4 && c < l;) {
      HEAP8[f++] = HEAP8[c++]
    }
    c >>= 2;
    f >>= 2;
    for(k = l >> 2;c < k;) {
      HEAP32[f++] = HEAP32[c++]
    }
    c <<= 2;
    f <<= 2
  }
  for(;c < l;) {
    HEAP8[f++] = HEAP8[c++]
  }
  c = _h264bsdDecodeExpGolombUnsigned(j, e);
  f = 0 != (c | 0) ? 1 : 2;
  a:do {
    if(1 == f) {
      g = c
    }else {
      if(2 == f) {
        c = _h264bsdDecodeExpGolombUnsigned(j, e);
        f = 0 != (c | 0) ? 3 : 4;
        do {
          if(3 == f) {
            g = c
          }else {
            if(4 == f) {
              c = _h264bsdDecodeExpGolombUnsigned(j, e);
              f = 0 != (c | 0) ? 5 : 6;
              do {
                if(5 == f) {
                  g = c
                }else {
                  if(6 == f) {
                    c = 0;
                    d:for(;;) {
                      if(0 == (HEAPU32[b + 12 >> 2] >>> (c >>> 0) | 0)) {
                        break d
                      }
                      c += 1
                    }
                    c -= 1;
                    c = _h264bsdGetBits(j, c);
                    f = -1 == (c | 0) ? 10 : 11;
                    do {
                      if(10 == f) {
                        g = 1
                      }else {
                        if(11 == f) {
                          c = _h264bsdDecodeExpGolombUnsigned(j, e);
                          f = 0 != (c | 0) ? 12 : 13;
                          do {
                            if(12 == f) {
                              g = c
                            }else {
                              if(13 == f) {
                                f = 0 == (HEAP32[b + 16 >> 2] | 0) ? 14 : 24;
                                do {
                                  if(14 == f) {
                                    c = 0;
                                    g:for(;;) {
                                      if(0 == (HEAPU32[b + 20 >> 2] >>> (c >>> 0) | 0)) {
                                        break g
                                      }
                                      c += 1
                                    }
                                    c -= 1;
                                    c = _h264bsdGetBits(j, c);
                                    f = -1 == (c | 0) ? 18 : 19;
                                    do {
                                      if(18 == f) {
                                        g = 1;
                                        break a
                                      }else {
                                        if(19 == f) {
                                          f = 0 != (HEAP32[d + 8 >> 2] | 0) ? 20 : 23;
                                          do {
                                            if(20 == f) {
                                              c = _h264bsdDecodeExpGolombSigned(j, h);
                                              f = 0 != (c | 0) ? 21 : 22;
                                              do {
                                                if(21 == f) {
                                                  g = c;
                                                  break a
                                                }
                                              }while(0)
                                            }
                                          }while(0)
                                        }
                                      }
                                    }while(0)
                                  }
                                }while(0);
                                f = 1 == (HEAP32[b + 16 >> 2] | 0) ? 25 : 33;
                                f:do {
                                  if(25 == f) {
                                    if(0 != (HEAP32[b + 24 >> 2] | 0)) {
                                      break f
                                    }
                                    c = _h264bsdDecodeExpGolombSigned(j, h);
                                    f = 0 != (c | 0) ? 27 : 28;
                                    do {
                                      if(27 == f) {
                                        g = c;
                                        break a
                                      }else {
                                        if(28 == f) {
                                          f = 0 != (HEAP32[d + 8 >> 2] | 0) ? 29 : 32;
                                          do {
                                            if(29 == f) {
                                              c = _h264bsdDecodeExpGolombSigned(j, h);
                                              f = 0 != (c | 0) ? 30 : 31;
                                              do {
                                                if(30 == f) {
                                                  g = c;
                                                  break a
                                                }
                                              }while(0)
                                            }
                                          }while(0)
                                        }
                                      }
                                    }while(0)
                                  }
                                }while(0);
                                f = 0 != (HEAP32[d + 68 >> 2] | 0) ? 34 : 37;
                                do {
                                  if(34 == f) {
                                    c = _h264bsdDecodeExpGolombUnsigned(j, e);
                                    f = 0 != (c | 0) ? 35 : 36;
                                    do {
                                      if(35 == f) {
                                        g = c;
                                        break a
                                      }
                                    }while(0)
                                  }
                                }while(0);
                                f = _h264bsdGetBits(j, 1);
                                HEAP32[a >> 2] = f;
                                f = -1 == (HEAP32[a >> 2] | 0) ? 38 : 39;
                                38 == f ? g = 1 : 39 == f && (g = 0)
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
function _h264bsdDecodeSliceData(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 440;
  var f, g, h, j, l = e + 432, k, m, o, q, p = e + 436, n;
  h = e + Math.floor((16 - e & 15) >>> 0);
  n = HEAP32[c + 3376 >> 2];
  m = HEAP32[d >> 2];
  k = HEAP32[l >> 2] = 0;
  HEAP32[c + 1192 >> 2] += 1;
  q = HEAP32[c + 1200 >> 2] = 0;
  HEAP32[p >> 2] = HEAP32[HEAP32[c + 12 >> 2] + 52 >> 2] + HEAP32[d + 48 >> 2];
  a:for(;;) {
    f = 0 != (HEAP32[d + 36 >> 2] | 0) ? 4 : 2;
    b:do {
      if(2 == f) {
        if(0 == (HEAP32[HEAP32[c + 1212 >> 2] + 216 * m + 196 >> 2] | 0)) {
          break b
        }
        g = 1;
        break a
      }
    }while(0);
    _SetMbParams(HEAP32[c + 1212 >> 2] + 216 * m, d, HEAP32[c + 1192 >> 2], HEAP32[HEAP32[c + 12 >> 2] + 56 >> 2]);
    f = 2 == (HEAP32[d + 4 >> 2] | 0) ? 15 : 5;
    b:do {
      if(5 == f) {
        if(7 == (HEAP32[d + 4 >> 2] | 0)) {
          break b
        }
        f = 0 != (k | 0) ? 14 : 7;
        do {
          if(7 == f) {
            j = _h264bsdDecodeExpGolombUnsigned(a, l);
            f = 0 != (j | 0) ? 8 : 9;
            do {
              if(8 == f) {
                g = j;
                break a
              }else {
                if(9 == f) {
                  f = HEAPU32[l >> 2] >>> 0 > HEAP32[c + 1176 >> 2] - m >>> 0 ? 10 : 11;
                  do {
                    if(10 == f) {
                      g = 1;
                      break a
                    }else {
                      11 == f && (f = 0 != (HEAP32[l >> 2] | 0) ? 12 : 13, 12 == f && (k = 1, _H264SwDecMemset(n + 12, 0, 164), HEAP32[n >> 2] = 0))
                    }
                  }while(0)
                }
              }
            }while(0)
          }
        }while(0)
      }
    }while(0);
    f = 0 != (HEAP32[l >> 2] | 0) ? 16 : 17;
    do {
      if(16 == f) {
        HEAP32[l >> 2] -= 1
      }else {
        if(17 == f) {
          k = 0;
          j = _h264bsdDecodeMacroblockLayer(a, n, HEAP32[c + 1212 >> 2] + 216 * m, HEAP32[d + 4 >> 2], HEAP32[d + 44 >> 2]);
          f = 0 != (j | 0) ? 18 : 19;
          do {
            if(18 == f) {
              g = j;
              break a
            }
          }while(0)
        }
      }
    }while(0);
    j = _h264bsdDecodeMacroblock(HEAP32[c + 1212 >> 2] + 216 * m, n, b, c + 1220, p, m, HEAP32[HEAP32[c + 12 >> 2] + 64 >> 2], h);
    f = 0 != (j | 0) ? 21 : 22;
    do {
      if(21 == f) {
        g = j;
        break a
      }else {
        if(22 == f) {
          f = 1 == (HEAP32[HEAP32[c + 1212 >> 2] + 216 * m + 196 >> 2] | 0) ? 23 : 24;
          23 == f && (q += 1);
          if(0 != (_h264bsdMoreRbspData(a) | 0)) {
            var r = 1;
            f = 26
          }else {
            f = 25
          }
          25 == f && (r = 0 != (HEAP32[l >> 2] | 0));
          o = r ? 1 : 0;
          f = 2 == (HEAP32[d + 4 >> 2] | 0) ? 28 : 27;
          c:do {
            if(27 == f) {
              f = 7 == (HEAP32[d + 4 >> 2] | 0) ? 28 : 29;
              break c
            }
          }while(0);
          28 == f && (HEAP32[c + 1200 >> 2] = m);
          m = _h264bsdNextMbAddress(HEAP32[c + 1172 >> 2], HEAP32[c + 1176 >> 2], m);
          f = 0 != (o | 0) ? 30 : 32;
          c:do {
            if(30 == f) {
              if(0 != (m | 0)) {
                break c
              }
              g = 1;
              break a
            }
          }while(0);
          if(0 != (o | 0)) {
            continue a
          }
          f = HEAP32[c + 1196 >> 2] + q >>> 0 > HEAPU32[c + 1176 >> 2] >>> 0 ? 35 : 36;
          do {
            if(35 == f) {
              g = 1;
              break a
            }else {
              if(36 == f) {
                HEAP32[c + 1196 >> 2] += q;
                g = 0;
                break a
              }
            }
          }while(0)
        }
      }
    }while(0)
  }
  STACKTOP = e;
  return g
}
_h264bsdDecodeSliceData.X = 1;
function _h264bsdMarkSliceCorrupted(a, c) {
  var b, d, e, f, g;
  g = c;
  f = HEAP32[a + 1192 >> 2];
  b = 0 != (HEAP32[a + 1200 >> 2] | 0) ? 1 : 12;
  do {
    if(1 == b) {
      e = HEAP32[a + 1200 >> 2] - 1;
      d = 0;
      b:for(;;) {
        if(!(e >>> 0 > g >>> 0)) {
          break b
        }
        b = (HEAP32[HEAP32[a + 1212 >> 2] + 216 * e + 4 >> 2] | 0) == (f | 0) ? 4 : 10;
        do {
          if(4 == b) {
            var h = d += 1;
            b = 10 < HEAPU32[HEAP32[a + 16 >> 2] + 52 >> 2] >>> 0 ? 5 : 6;
            if(5 == b) {
              var j = HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2]
            }else {
              6 == b && (j = 10)
            }
            b = h >>> 0 >= j >>> 0 ? 8 : 9;
            do {
              if(8 == b) {
                break b
              }
            }while(0)
          }
        }while(0);
        e -= 1
      }
      g = e
    }
  }while(0);
  a:for(;;) {
    b = (HEAP32[HEAP32[a + 1212 >> 2] + 216 * g + 4 >> 2] | 0) == (f | 0) ? 14 : 16;
    b:do {
      if(14 == b) {
        if(0 == (HEAP32[HEAP32[a + 1212 >> 2] + 216 * g + 196 >> 2] | 0)) {
          break b
        }
        b = HEAP32[a + 1212 >> 2] + 216 * g + 196;
        HEAP32[b >> 2] -= 1;
        g = _h264bsdNextMbAddress(HEAP32[a + 1172 >> 2], HEAP32[a + 1176 >> 2], g);
        if(0 != (g | 0)) {
          continue a
        }else {
          break a
        }
      }
    }while(0);
    break a
  }
}
_h264bsdMarkSliceCorrupted.X = 1;
function _h264bsdNumMbPart(a) {
  var c, a = 1 == a || 0 == a ? 1 : 2 == a || 3 == a ? 2 : 3;
  3 == a ? c = 4 : 1 == a ? c = 1 : 2 == a && (c = 2);
  return c
}
function _h264bsdMbPartPredMode(a) {
  var c, b;
  c = 5 >= a >>> 0 ? 1 : 2;
  1 == c ? b = 2 : 2 == c && (c = 6 == (a | 0) ? 3 : 4, 3 == c ? b = 0 : 4 == c && (b = 1));
  return b
}
function _CbpIntra16x16(a) {
  var c, b;
  c = 19 <= a >>> 0 ? 1 : 2;
  1 == c ? b = 15 : 2 == c && (b = 0);
  a = a - 7 >>> 2;
  4 == (2 < a >>> 0 ? 4 : 5) && (a -= 3);
  return b + (a << 4)
}
function _h264bsdDecodeMacroblockLayer(a, c, b, d, e) {
  var f = STACKTOP;
  STACKTOP += 8;
  var g, h, j, l = f + 4;
  _H264SwDecMemset(c, 0, 2088);
  j = _h264bsdDecodeExpGolombUnsigned(a, f);
  g = 2 == (d | 0) ? 2 : 1;
  a:do {
    if(1 == g) {
      if(7 == (d | 0)) {
        g = 2;
        break a
      }
      g = 31 < HEAP32[f >> 2] + 1 >>> 0 ? 8 : 7;
      b:do {
        if(7 == g) {
          if(0 != (j | 0)) {
            break b
          }
          HEAP32[c >> 2] = HEAP32[f >> 2] + 1;
          g = 10;
          break a
        }
      }while(0);
      h = 1;
      g = 45;
      break a
    }
  }while(0);
  a:do {
    if(2 == g) {
      g = 31 < HEAP32[f >> 2] + 6 >>> 0 ? 4 : 3;
      b:do {
        if(3 == g) {
          if(0 != (j | 0)) {
            break b
          }
          HEAP32[c >> 2] = HEAP32[f >> 2] + 6;
          g = 10;
          break a
        }
      }while(0);
      h = 1;
      g = 45;
      break a
    }
  }while(0);
  a:do {
    if(10 == g) {
      g = 31 == (HEAP32[c >> 2] | 0) ? 11 : 23;
      b:do {
        if(11 == g) {
          c:for(;;) {
            if(!(0 != (_h264bsdIsByteAligned(a) | 0) ^ 1)) {
              break c
            }
            j = _h264bsdGetBits(a, 1);
            g = 0 != (j | 0) ? 14 : 15;
            do {
              if(14 == g) {
                h = 1;
                break a
              }
            }while(0)
          }
          h = c + 328;
          d = 0;
          for(;;) {
            g = 384 > d >>> 0 ? 18 : 22;
            do {
              if(18 == g) {
                g = _h264bsdGetBits(a, 8);
                HEAP32[f >> 2] = g;
                g = -1 == (HEAP32[f >> 2] | 0) ? 19 : 20;
                do {
                  if(19 == g) {
                    h = 1;
                    break a
                  }else {
                    if(20 == g) {
                      var k = HEAP32[f >> 2], m = h;
                      h = m + 4;
                      HEAP32[m >> 2] = k;
                      d += 1
                    }
                  }
                }while(0)
              }else {
                if(22 == g) {
                  break b
                }
              }
            }while(0)
          }
        }else {
          if(23 == g) {
            d = _h264bsdMbPartPredMode(HEAP32[c >> 2]);
            g = 2 == (d | 0) ? 24 : 26;
            c:do {
              if(24 == g) {
                if(4 != (_h264bsdNumMbPart(HEAP32[c >> 2]) | 0)) {
                  g = 26;
                  break c
                }
                j = _DecodeSubMbPred(a, c + 176, HEAP32[c >> 2], e);
                g = 27;
                break c
              }
            }while(0);
            26 == g && (j = _DecodeMbPred(a, c + 12, HEAP32[c >> 2], e));
            g = 0 != (j | 0) ? 28 : 29;
            do {
              if(28 == g) {
                h = j;
                break a
              }else {
                if(29 == g) {
                  g = 1 != (d | 0) ? 30 : 33;
                  do {
                    if(30 == g) {
                      j = _h264bsdDecodeExpGolombMapped(a, f, 0 == (d | 0) & 1);
                      g = 0 != (j | 0) ? 31 : 32;
                      do {
                        if(31 == g) {
                          h = j;
                          break a
                        }else {
                          32 == g && (HEAP32[c + 4 >> 2] = HEAP32[f >> 2])
                        }
                      }while(0)
                    }else {
                      33 == g && (h = _CbpIntra16x16(HEAP32[c >> 2]), HEAP32[c + 4 >> 2] = h)
                    }
                  }while(0);
                  g = 0 != (HEAP32[c + 4 >> 2] | 0) ? 36 : 35;
                  d:do {
                    if(35 == g) {
                      g = 1 == (d | 0) ? 36 : 43;
                      break d
                    }
                  }while(0);
                  d:do {
                    if(36 == g) {
                      j = _h264bsdDecodeExpGolombSigned(a, l);
                      g = 0 != (j | 0) ? 39 : 37;
                      e:do {
                        if(37 == g) {
                          if(-26 > (HEAP32[l >> 2] | 0)) {
                            break e
                          }
                          if(25 < (HEAP32[l >> 2] | 0)) {
                            break e
                          }
                          HEAP32[c + 8 >> 2] = HEAP32[l >> 2];
                          j = _DecodeResidual(a, c + 272, b, HEAP32[c >> 2], HEAP32[c + 4 >> 2]);
                          HEAP32[a + 16 >> 2] = (HEAP32[a + 4 >> 2] - HEAP32[a >> 2] << 3) + HEAP32[a + 8 >> 2];
                          g = 0 != (j | 0) ? 41 : 42;
                          do {
                            if(41 == g) {
                              h = j;
                              break a
                            }else {
                              if(42 == g) {
                                break d
                              }
                            }
                          }while(0)
                        }
                      }while(0);
                      h = 1;
                      break a
                    }
                  }while(0)
                }
              }
            }while(0)
          }
        }
      }while(0);
      h = 0
    }
  }while(0);
  STACKTOP = f;
  return h
}
_h264bsdDecodeMacroblockLayer.X = 1;
function _DecodeSubMbPred(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 8;
  var f, g, h, j, l, k = e + 4;
  j = 0;
  a:for(;;) {
    if(!(4 > j >>> 0)) {
      f = 7;
      break a
    }
    h = _h264bsdDecodeExpGolombUnsigned(a, e);
    f = 0 != (h | 0) ? 4 : 3;
    b:do {
      if(3 == f) {
        if(3 < HEAPU32[e >> 2] >>> 0) {
          break b
        }
        HEAP32[c + (j << 2) >> 2] = HEAP32[e >> 2];
        j += 1;
        continue a
      }
    }while(0);
    g = 1;
    f = 30;
    break a
  }
  a:do {
    if(7 == f) {
      f = 1 < d >>> 0 ? 8 : 17;
      b:do {
        if(8 == f) {
          if(5 == (b | 0)) {
            break b
          }
          j = 0;
          c:for(;;) {
            f = 4 > j >>> 0 ? 11 : 16;
            do {
              if(11 == f) {
                h = _h264bsdDecodeExpGolombTruncated(a, e, 2 < d >>> 0 & 1);
                f = 0 != (h | 0) ? 13 : 12;
                e:do {
                  if(12 == f) {
                    if(HEAPU32[e >> 2] >>> 0 >= d >>> 0) {
                      break e
                    }
                    HEAP32[c + 16 + (j << 2) >> 2] = HEAP32[e >> 2];
                    j += 1;
                    continue c
                  }
                }while(0);
                g = 1;
                break a
              }else {
                if(16 == f) {
                  break b
                }
              }
            }while(0)
          }
        }
      }while(0);
      j = 0;
      b:for(;;) {
        f = 4 > j >>> 0 ? 19 : 29;
        do {
          if(19 == f) {
            l = 0;
            h = _h264bsdNumSubMbPart(HEAP32[c + (j << 2) >> 2]);
            HEAP32[e >> 2] = h;
            for(;;) {
              f = HEAP32[e >> 2];
              HEAP32[e >> 2] = f - 1;
              f = 0 != (f | 0) ? 21 : 27;
              do {
                if(21 == f) {
                  h = _h264bsdDecodeExpGolombSigned(a, k);
                  f = 0 != (h | 0) ? 22 : 23;
                  do {
                    if(22 == f) {
                      g = h;
                      break a
                    }else {
                      if(23 == f) {
                        HEAP16[c + 32 + (j << 4) + (l << 2) >> 1] = HEAP32[k >> 2] & 65535;
                        h = _h264bsdDecodeExpGolombSigned(a, k);
                        f = 0 != (h | 0) ? 24 : 25;
                        do {
                          if(24 == f) {
                            g = h;
                            break a
                          }else {
                            25 == f && (HEAP16[c + 32 + (j << 4) + (l << 2) + 2 >> 1] = HEAP32[k >> 2] & 65535, l += 1)
                          }
                        }while(0)
                      }
                    }
                  }while(0)
                }else {
                  if(27 == f) {
                    j += 1;
                    continue b
                  }
                }
              }while(0)
            }
          }else {
            if(29 == f) {
              g = 0;
              break a
            }
          }
        }while(0)
      }
    }
  }while(0);
  STACKTOP = e;
  return g
}
_DecodeSubMbPred.X = 1;
function _DecodeMbPred(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 8;
  var f, g, h, j, l, k = e + 4;
  j = _h264bsdMbPartPredMode(b);
  f = 2 == j ? 1 : 0 == j ? 19 : 1 == j ? 32 : 36;
  a:do {
    if(1 == f) {
      f = 1 < d >>> 0 ? 2 : 10;
      b:do {
        if(2 == f) {
          j = _h264bsdNumMbPart(b);
          l = 0;
          c:for(;;) {
            h = j;
            j = h - 1;
            f = 0 != (h | 0) ? 4 : 9;
            do {
              if(4 == f) {
                h = _h264bsdDecodeExpGolombTruncated(a, e, 2 < d >>> 0 & 1);
                f = 0 != (h | 0) ? 6 : 5;
                e:do {
                  if(5 == f) {
                    if(HEAPU32[e >> 2] >>> 0 >= d >>> 0) {
                      break e
                    }
                    HEAP32[c + 132 + (l << 2) >> 2] = HEAP32[e >> 2];
                    l += 1;
                    continue c
                  }
                }while(0);
                g = 1;
                f = 37;
                break a
              }else {
                if(9 == f) {
                  break b
                }
              }
            }while(0)
          }
        }
      }while(0);
      j = _h264bsdNumMbPart(b);
      l = 0;
      for(;;) {
        h = j;
        j = h - 1;
        f = 0 != (h | 0) ? 12 : 18;
        do {
          if(12 == f) {
            h = _h264bsdDecodeExpGolombSigned(a, k);
            f = 0 != (h | 0) ? 13 : 14;
            do {
              if(13 == f) {
                g = h;
                f = 37;
                break a
              }else {
                if(14 == f) {
                  HEAP16[c + 148 + (l << 2) >> 1] = HEAP32[k >> 2] & 65535;
                  h = _h264bsdDecodeExpGolombSigned(a, k);
                  f = 0 != (h | 0) ? 15 : 16;
                  do {
                    if(15 == f) {
                      g = h;
                      f = 37;
                      break a
                    }else {
                      16 == f && (HEAP16[c + 148 + (l << 2) + 2 >> 1] = HEAP32[k >> 2] & 65535, l += 1)
                    }
                  }while(0)
                }
              }
            }while(0)
          }else {
            if(18 == f) {
              f = 36;
              break a
            }
          }
        }while(0)
      }
    }else {
      if(19 == f) {
        j = HEAP32[k >> 2] = 0;
        for(;;) {
          f = 2 > (HEAP32[k >> 2] | 0) ? 21 : 31;
          do {
            if(21 == f) {
              l = _h264bsdShowBits32(a);
              HEAP32[e >> 2] = l;
              h = 0;
              l = 8;
              d:for(;;) {
                f = l;
                l = f - 1;
                if(0 == (f | 0)) {
                  break d
                }
                HEAP32[c + (j << 2) >> 2] = 0 != (HEAP32[e >> 2] & -2147483648 | 0) ? 1 : 0;
                HEAP32[e >> 2] <<= 1;
                f = 0 != (HEAP32[c + (j << 2) >> 2] | 0) ? 25 : 24;
                24 == f && (HEAP32[c + 64 + (j << 2) >> 2] = HEAPU32[e >> 2] >>> 29, HEAP32[e >> 2] <<= 3, h += 1);
                j += 1
              }
              f = -1 == (_h264bsdFlushBits(a, 3 * h + 8) | 0) ? 28 : 29;
              do {
                if(28 == f) {
                  g = 1;
                  f = 37;
                  break a
                }else {
                  29 == f && (HEAP32[k >> 2] += 1)
                }
              }while(0)
            }else {
              if(31 == f) {
                f = 32;
                break a
              }
            }
          }while(0)
        }
      }
    }
  }while(0);
  a:do {
    if(32 == f) {
      h = _h264bsdDecodeExpGolombUnsigned(a, e);
      f = 0 != (h | 0) ? 34 : 33;
      b:do {
        if(33 == f) {
          if(3 < HEAPU32[e >> 2] >>> 0) {
            break b
          }
          HEAP32[c + 128 >> 2] = HEAP32[e >> 2];
          f = 36;
          break a
        }
      }while(0);
      g = 1;
      f = 37;
      break a
    }
  }while(0);
  36 == f && (g = 0);
  STACKTOP = e;
  return g
}
_DecodeMbPred.X = 1;
function _h264bsdNumSubMbPart(a) {
  var c, a = 0 == a ? 1 : 1 == a || 2 == a ? 2 : 3;
  3 == a ? c = 4 : 1 == a ? c = 1 : 2 == a && (c = 2);
  return c
}
function _h264bsdPredModeIntra16x16(a) {
  return a - 7 & 3
}
function _DecodeResidual(a, c, b, d, e) {
  var f, g, h, j, l, k, m;
  m = c + 56;
  f = 1 == (_h264bsdMbPartPredMode(d) | 0) ? 1 : 4;
  a:do {
    if(1 == f) {
      l = _DetermineNc(b, 0, c);
      j = _h264bsdDecodeResidualBlockCavlc(a, m + 1536, l, 16);
      f = 0 != (j & 15 | 0) ? 2 : 3;
      do {
        if(2 == f) {
          g = j;
          f = 35;
          break a
        }else {
          if(3 == f) {
            HEAP16[c + 48 >> 1] = j >>> 4 & 255;
            k = 1;
            f = 5;
            break a
          }
        }
      }while(0)
    }else {
      if(4 == f) {
        k = 0;
        f = 5;
        break a
      }
    }
  }while(0);
  a:do {
    if(5 == f) {
      g = 4;
      d = 0;
      b:for(;;) {
        f = g;
        g = f - 1;
        if(0 == (f | 0)) {
          break b
        }
        f = e & 1;
        e >>>= 1;
        f = 0 != (f | 0) ? 8 : 18;
        c:do {
          if(8 == f) {
            h = 4;
            for(;;) {
              f = h;
              h = f - 1;
              f = 0 != (f | 0) ? 10 : 17;
              do {
                if(10 == f) {
                  l = _DetermineNc(b, d, c);
                  f = 0 != (k | 0) ? 11 : 12;
                  11 == f ? (j = _h264bsdDecodeResidualBlockCavlc(a, m + (d << 6) + 4, l, 15), HEAP32[c + 1720 + (d << 2) >> 2] = j >>> 15) : 12 == f && (j = _h264bsdDecodeResidualBlockCavlc(a, m + (d << 6), l, 16), HEAP32[c + 1720 + (d << 2) >> 2] = j >>> 16);
                  f = 0 != (j & 15 | 0) ? 14 : 15;
                  do {
                    if(14 == f) {
                      g = j;
                      break a
                    }else {
                      15 == f && (HEAP16[c + (d << 1) >> 1] = j >>> 4 & 255, d += 1)
                    }
                  }while(0)
                }else {
                  if(17 == f) {
                    break c
                  }
                }
              }while(0)
            }
          }else {
            18 == f && (d += 4)
          }
        }while(0)
      }
      f = e & 3;
      f = 0 != (f | 0) ? 21 : 26;
      do {
        if(21 == f) {
          j = _h264bsdDecodeResidualBlockCavlc(a, m + 1600, -1, 4);
          f = 0 != (j & 15 | 0) ? 22 : 23;
          do {
            if(22 == f) {
              g = j;
              break a
            }else {
              if(23 == f) {
                HEAP16[c + 50 >> 1] = j >>> 4 & 255;
                j = _h264bsdDecodeResidualBlockCavlc(a, m + 1616, -1, 4);
                f = 0 != (j & 15 | 0) ? 24 : 25;
                do {
                  if(24 == f) {
                    g = j;
                    break a
                  }else {
                    25 == f && (HEAP16[c + 52 >> 1] = j >>> 4 & 255)
                  }
                }while(0)
              }
            }
          }while(0)
        }
      }while(0);
      f = e & 2;
      f = 0 != (f | 0) ? 27 : 34;
      b:do {
        if(27 == f) {
          g = 8;
          for(;;) {
            f = g;
            g = f - 1;
            f = 0 != (f | 0) ? 29 : 33;
            do {
              if(29 == f) {
                l = _DetermineNc(b, d, c);
                j = _h264bsdDecodeResidualBlockCavlc(a, m + (d << 6) + 4, l, 15);
                f = 0 != (j & 15 | 0) ? 30 : 31;
                do {
                  if(30 == f) {
                    g = j;
                    break a
                  }else {
                    31 == f && (HEAP16[c + (d << 1) >> 1] = j >>> 4 & 255, HEAP32[c + 1720 + (d << 2) >> 2] = j >>> 15, d += 1)
                  }
                }while(0)
              }else {
                if(33 == f) {
                  break b
                }
              }
            }while(0)
          }
        }
      }while(0);
      g = 0
    }
  }while(0);
  return g
}
_DecodeResidual.X = 1;
function _h264bsdDecodeMacroblock(a, c, b, d, e, f, g, h) {
  var j, l, k, m, o, q, p;
  m = HEAP32[c >> 2];
  HEAP32[a >> 2] = m;
  HEAP32[a + 196 >> 2] += 1;
  _h264bsdSetCurrImageMbPointers(b, f);
  j = 31 == (m | 0) ? 1 : 13;
  a:do {
    if(1 == j) {
      o = h;
      q = a + 28;
      p = c + 328;
      HEAP32[a + 20 >> 2] = 0;
      j = 1 < HEAPU32[a + 196 >> 2] >>> 0 ? 2 : 6;
      do {
        if(2 == j) {
          l = 24;
          c:for(;;) {
            k = l;
            l = k - 1;
            if(0 == (k | 0)) {
              break c
            }
            k = q;
            q = k + 2;
            HEAP16[k >> 1] = 16
          }
          l = 0
        }else {
          if(6 == j) {
            l = 24;
            c:for(;;) {
              k = l;
              l = k - 1;
              if(0 == (k | 0)) {
                break c
              }
              k = q;
              q = k + 2;
              k = HEAP16[k >> 1] = 16;
              d:for(;;) {
                var n = k;
                k = n - 1;
                if(0 == (n | 0)) {
                  break d
                }
                n = p;
                p = n + 4;
                var n = HEAP32[n >> 2] & 255, r = o;
                o = r + 1;
                HEAP8[r] = n
              }
            }
            _h264bsdWriteMacroblock(b, h);
            l = 0
          }
        }
      }while(0)
    }else {
      if(13 == j) {
        j = 0 != (m | 0) ? 14 : 24;
        do {
          if(14 == j) {
            _H264SwDecMemcpy(a + 28, c + 272, 54);
            j = 0 != (HEAP32[c + 8 >> 2] | 0) ? 15 : 21;
            15 == j && (HEAP32[e >> 2] += HEAP32[c + 8 >> 2], j = 0 > (HEAP32[e >> 2] | 0) ? 16 : 17, 16 == j ? HEAP32[e >> 2] += 52 : 17 == j && (j = 52 <= (HEAP32[e >> 2] | 0) ? 18 : 19, 18 == j && (HEAP32[e >> 2] -= 52)));
            HEAP32[a + 20 >> 2] = HEAP32[e >> 2];
            k = _ProcessResidual(a, c + 328, c + 1992);
            j = 0 != (k | 0) ? 22 : 23;
            do {
              if(22 == j) {
                l = k;
                break a
              }
            }while(0)
          }else {
            24 == j && (_H264SwDecMemset(a + 28, 0, 54), HEAP32[a + 20 >> 2] = HEAP32[e >> 2])
          }
        }while(0);
        j = 2 != (_h264bsdMbPartPredMode(m) | 0) ? 26 : 29;
        do {
          if(26 == j) {
            k = _h264bsdIntraPrediction(a, c, b, f, g, h);
            j = 0 != (k | 0) ? 27 : 28;
            do {
              if(27 == j) {
                l = k;
                break a
              }
            }while(0)
          }else {
            if(29 == j) {
              k = _h264bsdInterPrediction(a, c, d, f, b, h);
              j = 0 != (k | 0) ? 30 : 31;
              do {
                if(30 == j) {
                  l = k;
                  break a
                }
              }while(0)
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
function _h264bsdSubMbPartMode(a) {
  return a
}
function _h264bsdShowBits32(a) {
  var c, b, d, e, f, g, h;
  f = HEAP32[a + 4 >> 2];
  d = (HEAP32[a + 12 >> 2] << 3) - HEAP32[a + 16 >> 2];
  c = 32 <= (d | 0) ? 1 : 4;
  do {
    if(1 == c) {
      e = HEAP32[a + 8 >> 2], b = (HEAPU8[f] & 255) << 24 | (HEAPU8[f + 1] & 255) << 16 | (HEAPU8[f + 2] & 255) << 8 | HEAPU8[f + 3] & 255, c = 0 != (e | 0) ? 2 : 3, 2 == c && (g = HEAPU8[f + 4] & 255, h = 8 - e, b <<= e, b |= g >>> (h >>> 0))
    }else {
      if(4 == c) {
        c = 0 < (d | 0) ? 5 : 9;
        do {
          if(5 == c) {
            e = HEAP32[a + 8 >> 2] + 24;
            b = f;
            f = b + 1;
            b = (HEAPU8[b] & 255) << e;
            d -= 8 - HEAP32[a + 8 >> 2];
            c:for(;;) {
              if(!(0 < (d | 0))) {
                break c
              }
              e -= 8;
              g = f;
              f = g + 1;
              b |= (HEAPU8[g] & 255) << e;
              d -= 8
            }
          }else {
            9 == c && (b = 0)
          }
        }while(0)
      }
    }
  }while(0);
  return b
}
_h264bsdShowBits32.X = 1;
function _h264bsdFlushBits(a, c) {
  var b, d;
  HEAP32[a + 16 >> 2] += c;
  HEAP32[a + 8 >> 2] = HEAP32[a + 16 >> 2] & 7;
  b = HEAPU32[a + 16 >> 2] >>> 0 <= HEAP32[a + 12 >> 2] << 3 >>> 0 ? 1 : 2;
  1 == b ? (HEAP32[a + 4 >> 2] = HEAP32[a >> 2] + (HEAPU32[a + 16 >> 2] >>> 3), d = 0) : 2 == b && (d = -1);
  return d
}
function _h264bsdIsByteAligned(a) {
  var c, a = 0 != (HEAP32[a + 8 >> 2] | 0) ? 2 : 1;
  2 == a ? c = 0 : 1 == a && (c = 1);
  return c
}
function _ProcessResidual(a, c, b) {
  var d, e, f, g, h, j, l;
  g = c + 1536;
  h = c;
  j = a + 28;
  d = 1 == (_h264bsdMbPartPredMode(HEAP32[a >> 2]) | 0) ? 1 : 14;
  a:do {
    if(1 == d) {
      d = 0 != HEAP16[j + 48 >> 1] << 16 >> 16 ? 2 : 3;
      2 == d && _h264bsdProcessLumaDc(g, HEAP32[a + 20 >> 2]);
      l = _dcCoeffIndex;
      f = 16;
      for(;;) {
        d = f;
        f = d - 1;
        d = 0 != (d | 0) ? 5 : 13;
        do {
          if(5 == d) {
            d = l;
            l = d + 4;
            HEAP32[h >> 2] = HEAP32[g + (HEAP32[d >> 2] << 2) >> 2];
            d = 0 != (HEAP32[h >> 2] | 0) ? 7 : 6;
            d:do {
              if(6 == d) {
                if(0 != (HEAP16[j >> 1] << 16 >> 16 | 0)) {
                  d = 7;
                  break d
                }
                HEAP32[h >> 2] = 16777215;
                d = 11;
                break d
              }
            }while(0);
            do {
              if(7 == d) {
                d = 0 != (_h264bsdProcessBlock(h, HEAP32[a + 20 >> 2], 1, HEAP32[b >> 2]) | 0) ? 8 : 9;
                do {
                  if(8 == d) {
                    e = 1;
                    d = 38;
                    break a
                  }
                }while(0)
              }
            }while(0);
            h += 64;
            j += 2;
            b += 4
          }else {
            if(13 == d) {
              d = 24;
              break a
            }
          }
        }while(0)
      }
    }else {
      if(14 == d) {
        f = 16;
        for(;;) {
          d = f;
          f = d - 1;
          d = 0 != (d | 0) ? 16 : 23;
          do {
            if(16 == d) {
              d = 0 != HEAP16[j >> 1] << 16 >> 16 ? 17 : 20;
              do {
                if(17 == d) {
                  d = 0 != (_h264bsdProcessBlock(h, HEAP32[a + 20 >> 2], 0, HEAP32[b >> 2]) | 0) ? 18 : 19;
                  do {
                    if(18 == d) {
                      e = 1;
                      d = 38;
                      break a
                    }
                  }while(0)
                }else {
                  20 == d && (HEAP32[h >> 2] = 16777215)
                }
              }while(0);
              h += 64;
              j += 2;
              b += 4
            }else {
              if(23 == d) {
                d = 24;
                break a
              }
            }
          }while(0)
        }
      }
    }
  }while(0);
  a:do {
    if(24 == d) {
      f = _clip(0, 51, HEAP32[a + 20 >> 2] + HEAP32[a + 24 >> 2]);
      g = HEAP32[_h264bsdQpC + (f << 2) >> 2];
      d = 0 != (HEAP16[a + 78 >> 1] << 16 >> 16 | 0) ? 26 : 25;
      b:do {
        if(25 == d) {
          d = 0 != (HEAP16[a + 80 >> 1] << 16 >> 16 | 0) ? 26 : 27;
          break b
        }
      }while(0);
      26 == d && _h264bsdProcessChromaDc(c + 1600, g);
      l = c + 1600;
      f = 8;
      for(;;) {
        d = f;
        f = d - 1;
        d = 0 != (d | 0) ? 29 : 37;
        do {
          if(29 == d) {
            d = l;
            l = d + 4;
            HEAP32[h >> 2] = HEAP32[d >> 2];
            d = 0 != (HEAP32[h >> 2] | 0) ? 31 : 30;
            d:do {
              if(30 == d) {
                if(0 != (HEAP16[j >> 1] << 16 >> 16 | 0)) {
                  d = 31;
                  break d
                }
                HEAP32[h >> 2] = 16777215;
                d = 35;
                break d
              }
            }while(0);
            do {
              if(31 == d) {
                d = 0 != (_h264bsdProcessBlock(h, g, 1, HEAP32[b >> 2]) | 0) ? 32 : 33;
                do {
                  if(32 == d) {
                    e = 1;
                    break a
                  }
                }while(0)
              }
            }while(0);
            h += 64;
            j += 2;
            b += 4
          }else {
            if(37 == d) {
              e = 0;
              break a
            }
          }
        }while(0)
      }
    }
  }while(0);
  return e
}
_ProcessResidual.X = 1;
function _DetermineNc(a, c, b) {
  var d, e, f, g, h;
  e = _h264bsdNeighbour4x4BlockA(c);
  f = _h264bsdNeighbour4x4BlockB(c);
  g = HEAP8[e + 4];
  h = HEAP8[f + 4];
  c = 4 == (HEAP32[e >> 2] | 0) ? 1 : 3;
  a:do {
    if(1 == c) {
      if(4 != (HEAP32[f >> 2] | 0)) {
        c = 3;
        break a
      }
      d = (HEAP16[b + ((g & 255) << 1) >> 1] << 16 >> 16) + (HEAP16[b + ((h & 255) << 1) >> 1] << 16 >> 16) + 1 >> 1;
      c = 21;
      break a
    }
  }while(0);
  3 == c && (c = 4 == (HEAP32[e >> 2] | 0) ? 4 : 7, 4 == c ? (d = HEAP16[b + ((g & 255) << 1) >> 1] << 16 >> 16, c = 0 != (_h264bsdIsNeighbourAvailable(a, HEAP32[a + 204 >> 2]) | 0) ? 5 : 6, 5 == c && (d = d + (HEAP16[HEAP32[a + 204 >> 2] + 28 + ((h & 255) << 1) >> 1] << 16 >> 16) + 1 >> 1)) : 7 == c && (c = 4 == (HEAP32[f >> 2] | 0) ? 8 : 11, 8 == c ? (d = HEAP16[b + ((h & 255) << 1) >> 1] << 16 >> 16, c = 0 != (_h264bsdIsNeighbourAvailable(a, HEAP32[a + 200 >> 2]) | 0) ? 9 : 10, 9 == c && (d = 
  d + (HEAP16[HEAP32[a + 200 >> 2] + 28 + ((g & 255) << 1) >> 1] << 16 >> 16) + 1 >> 1)) : 11 == c && (d = b = 0, c = 0 != (_h264bsdIsNeighbourAvailable(a, HEAP32[a + 200 >> 2]) | 0) ? 12 : 13, 12 == c && (d = HEAP16[HEAP32[a + 200 >> 2] + 28 + ((g & 255) << 1) >> 1] << 16 >> 16, b = 1), c = 0 != (_h264bsdIsNeighbourAvailable(a, HEAP32[a + 204 >> 2]) | 0) ? 14 : 18, 14 == c && (c = 0 != (b | 0) ? 15 : 16, 15 == c ? d = d + (HEAP16[HEAP32[a + 204 >> 2] + 28 + ((h & 255) << 1) >> 1] << 16 >> 16) + 
  1 >> 1 : 16 == c && (d = HEAP16[HEAP32[a + 204 >> 2] + 28 + ((h & 255) << 1) >> 1] << 16 >> 16)))));
  return d
}
_DetermineNc.X = 1;
function _h264bsdGetBits(a, c) {
  var b, d, e;
  e = _h264bsdShowBits32(a) >>> (32 - c >>> 0);
  b = 0 == (_h264bsdFlushBits(a, c) | 0) ? 1 : 2;
  1 == b ? d = e : 2 == b && (d = -1);
  return d
}
function _h264bsdDecodeExpGolombUnsigned(a, c) {
  var b, d, e, f;
  e = _h264bsdShowBits32(a);
  b = 2147483648 <= e >>> 0 ? 1 : 2;
  a:do {
    if(1 == b) {
      _h264bsdFlushBits(a, 1), d = HEAP32[c >> 2] = 0
    }else {
      if(2 == b) {
        b = 1073741824 <= e >>> 0 ? 3 : 6;
        do {
          if(3 == b) {
            b = -1 == (_h264bsdFlushBits(a, 3) | 0) ? 4 : 5, 4 == b ? d = 1 : 5 == b && (HEAP32[c >> 2] = (e >>> 29 & 1) + 1, d = 0)
          }else {
            if(6 == b) {
              b = 536870912 <= e >>> 0 ? 7 : 10;
              do {
                if(7 == b) {
                  b = -1 == (_h264bsdFlushBits(a, 5) | 0) ? 8 : 9, 8 == b ? d = 1 : 9 == b && (HEAP32[c >> 2] = (e >>> 27 & 3) + 3, d = 0)
                }else {
                  if(10 == b) {
                    b = 268435456 <= e >>> 0 ? 11 : 14;
                    do {
                      if(11 == b) {
                        b = -1 == (_h264bsdFlushBits(a, 7) | 0) ? 12 : 13, 12 == b ? d = 1 : 13 == b && (HEAP32[c >> 2] = (e >>> 25 & 7) + 7, d = 0)
                      }else {
                        if(14 == b) {
                          f = _h264bsdCountLeadingZeros(e, 28) + 4;
                          b = 32 == (f | 0) ? 15 : 25;
                          do {
                            if(15 == b) {
                              HEAP32[c >> 2] = 0;
                              _h264bsdFlushBits(a, 32);
                              e = _h264bsdGetBits(a, 1);
                              b = 1 == (e | 0) ? 16 : 24;
                              do {
                                if(16 == b) {
                                  e = _h264bsdShowBits32(a);
                                  b = -1 == (_h264bsdFlushBits(a, 32) | 0) ? 17 : 18;
                                  do {
                                    if(17 == b) {
                                      d = 1;
                                      break a
                                    }else {
                                      if(18 == b) {
                                        b = 0 == (e | 0) ? 19 : 20;
                                        do {
                                          if(19 == b) {
                                            HEAP32[c >> 2] = -1;
                                            d = 0;
                                            break a
                                          }else {
                                            if(20 == b) {
                                              b = 1 == (e | 0) ? 21 : 22;
                                              do {
                                                if(21 == b) {
                                                  HEAP32[c >> 2] = -1;
                                                  d = 1;
                                                  break a
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
                              d = 1
                            }else {
                              25 == b && (_h264bsdFlushBits(a, f + 1), e = _h264bsdGetBits(a, f), b = -1 == (e | 0) ? 27 : 28, 27 == b ? d = 1 : 28 == b && (HEAP32[c >> 2] = (1 << f) - 1 + e, d = 0))
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
  return d
}
_h264bsdDecodeExpGolombUnsigned.X = 1;
function _h264bsdDecodeExpGolombSigned(a, c) {
  var b = STACKTOP;
  STACKTOP += 4;
  var d, e, f;
  HEAP32[b >> 2] = 0;
  f = _h264bsdDecodeExpGolombUnsigned(a, b);
  d = -1 == (HEAP32[b >> 2] | 0) ? 1 : 4;
  if(1 == d) {
    d = 0 == (f | 0) ? 2 : 3, 2 == d ? e = 1 : 3 == d && (HEAP32[c >> 2] = -2147483648, e = 0)
  }else {
    if(4 == d) {
      if(d = 0 == (f | 0) ? 5 : 9, 5 == d) {
        d = 0 != (HEAP32[b >> 2] & 1 | 0) ? 6 : 7;
        if(6 == d) {
          var g = HEAP32[b >> 2] + 1 >>> 1
        }else {
          7 == d && (g = -(HEAP32[b >> 2] + 1 >>> 1))
        }
        HEAP32[c >> 2] = g;
        e = 0
      }else {
        9 == d && (e = 1)
      }
    }
  }
  STACKTOP = b;
  return e
}
function _h264bsdDecodeExpGolombMapped(a, c, b) {
  var d = STACKTOP;
  STACKTOP += 4;
  var e, a = 0 != (_h264bsdDecodeExpGolombUnsigned(a, d) | 0) ? 1 : 2;
  1 == a ? e = 1 : 2 == a && (a = 47 < HEAPU32[d >> 2] >>> 0 ? 3 : 4, 3 == a ? e = 1 : 4 == a && (a = 0 != (b | 0) ? 5 : 6, 5 == a ? HEAP32[c >> 2] = HEAPU8[_codedBlockPatternIntra4x4 + HEAP32[d >> 2]] & 255 : 6 == a && (HEAP32[c >> 2] = HEAPU8[_codedBlockPatternInter + HEAP32[d >> 2]] & 255), e = 0));
  STACKTOP = d;
  return e
}
function _h264bsdDecodeExpGolombTruncated(a, c, b) {
  var d, b = 0 != (b | 0) ? 1 : 2;
  1 == b ? d = _h264bsdDecodeExpGolombUnsigned(a, c) : 2 == b && (a = _h264bsdGetBits(a, 1), HEAP32[c >> 2] = a, b = -1 == (HEAP32[c >> 2] | 0) ? 3 : 4, 3 == b ? d = 1 : 4 == b && (HEAP32[c >> 2] ^= 1, d = 0));
  return d
}
function _DecodeCoeffToken(a, c) {
  var b, d;
  b = 2 > c >>> 0 ? 1 : 14;
  1 == b ? (b = 32768 <= a >>> 0 ? 2 : 3, 2 == b ? d = 1 : 3 == b && (b = 3072 <= a >>> 0 ? 4 : 5, 4 == b ? d = HEAPU16[_coeffToken0_0 + (a >>> 10 << 1) >> 1] & 65535 : 5 == b && (b = 256 <= a >>> 0 ? 6 : 7, 6 == b ? d = HEAPU16[_coeffToken0_1 + (a >>> 6 << 1) >> 1] & 65535 : 7 == b && (b = 32 <= a >>> 0 ? 8 : 9, 8 == b ? d = HEAPU16[_coeffToken0_2 + ((a >>> 2) - 8 << 1) >> 1] & 65535 : 9 == b && (d = HEAPU16[_coeffToken0_3 + (a << 1) >> 1] & 65535))))) : 14 == b && (b = 4 > c >>> 0 ? 15 : 25, 15 == 
  b ? (b = 32768 <= a >>> 0 ? 16 : 17, 16 == b ? d = 0 != (a & 16384 | 0) ? 2 : 2082 : 17 == b && (b = 4096 <= a >>> 0 ? 18 : 19, 18 == b ? d = HEAPU16[_coeffToken2_0 + (a >>> 10 << 1) >> 1] & 65535 : 19 == b && (b = 512 <= a >>> 0 ? 20 : 21, 20 == b ? d = HEAPU16[_coeffToken2_1 + (a >>> 7 << 1) >> 1] & 65535 : 21 == b && (d = HEAPU16[_coeffToken2_2 + (a >>> 2 << 1) >> 1] & 65535)))) : 25 == b && (b = 8 > c >>> 0 ? 26 : 29, 26 == b ? (d = HEAPU16[_coeffToken4_0 + (a >>> 10 << 1) >> 1] & 65535, 27 == 
  (0 != (d | 0) ? 28 : 27) && (d = HEAPU16[_coeffToken4_1 + (a >>> 6 << 1) >> 1] & 65535)) : 29 == b && (b = 16 >= c >>> 0 ? 30 : 31, 30 == b ? d = HEAPU16[_coeffToken8 + (a >>> 10 << 1) >> 1] & 65535 : 31 == b && (d = HEAPU16[_coeffTokenMinus1_0 + (a >>> 13 << 1) >> 1] & 65535, 32 == (0 != (d | 0) ? 33 : 32) && (d = HEAPU16[_coeffTokenMinus1_1 + (a >>> 8 << 1) >> 1] & 65535)))));
  return d
}
_DecodeCoeffToken.X = 1;
function _h264bsdDecodeResidualBlockCavlc(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 128;
  var f, g, h, j, l, k, m, o, q, p, n = e + 64, r, s;
  s = 32;
  r = _h264bsdShowBits32(a);
  f = 16 > s >>> 0 ? 1 : 4;
  a:do {
    if(1 == f) {
      f = -1 == (_h264bsdFlushBits(a, 32 - s) | 0) ? 2 : 3;
      do {
        if(2 == f) {
          g = 1;
          f = 92;
          break a
        }else {
          if(3 == f) {
            r = _h264bsdShowBits32(a);
            s = 32;
            f = 4;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  a:do {
    if(4 == f) {
      o = r >>> 16;
      j = _DecodeCoeffToken(o, b);
      f = 0 != (j | 0) ? 6 : 5;
      do {
        if(6 == f) {
          r <<= j & 31;
          s -= j & 31;
          l = j >>> 11 & 31;
          f = l >>> 0 > d >>> 0 ? 7 : 8;
          do {
            if(7 == f) {
              g = 1
            }else {
              if(8 == f) {
                k = j >>> 5 & 63;
                f = 0 != (l | 0) ? 9 : 88;
                do {
                  if(9 == f) {
                    h = 0;
                    f = 0 != (k | 0) ? 10 : 19;
                    do {
                      if(10 == f) {
                        f = s >>> 0 < k >>> 0 ? 11 : 14;
                        do {
                          if(11 == f) {
                            f = -1 == (_h264bsdFlushBits(a, 32 - s) | 0) ? 12 : 13;
                            do {
                              if(12 == f) {
                                g = 1;
                                break a
                              }else {
                                13 == f && (r = _h264bsdShowBits32(a), s = 32)
                              }
                            }while(0)
                          }
                        }while(0);
                        o = r >>> (32 - k >>> 0);
                        r <<= k;
                        s -= k;
                        j = 1 << k - 1;
                        f:for(;;) {
                          if(0 == (j | 0)) {
                            break f
                          }
                          HEAP32[e + (h << 2) >> 2] = 0 != (o & j | 0) ? -1 : 1;
                          j >>>= 1;
                          h += 1
                        }
                      }
                    }while(0);
                    f = 10 < l >>> 0 ? 20 : 22;
                    e:do {
                      if(20 == f) {
                        if(!(3 > k >>> 0)) {
                          f = 22;
                          break e
                        }
                        m = 1;
                        f = 23;
                        break e
                      }
                    }while(0);
                    22 == f && (m = 0);
                    e:for(;;) {
                      if(!(h >>> 0 < l >>> 0)) {
                        break e
                      }
                      f = 16 > s >>> 0 ? 26 : 29;
                      do {
                        if(26 == f) {
                          f = -1 == (_h264bsdFlushBits(a, 32 - s) | 0) ? 27 : 28;
                          do {
                            if(27 == f) {
                              g = 1;
                              break a
                            }else {
                              28 == f && (r = _h264bsdShowBits32(a), s = 32)
                            }
                          }while(0)
                        }
                      }while(0);
                      o = r >>> 16;
                      o = _DecodeLevelPrefix(o);
                      f = -2 == (o | 0) ? 30 : 31;
                      do {
                        if(30 == f) {
                          g = 1;
                          break a
                        }else {
                          if(31 == f) {
                            r <<= o + 1;
                            s -= o + 1;
                            f = 14 > o >>> 0 ? 32 : 33;
                            if(32 == f) {
                              j = m
                            }else {
                              if(33 == f) {
                                if(f = 14 == (o | 0) ? 34 : 38, 34 == f) {
                                  f = 0 != (m | 0) ? 35 : 36;
                                  if(35 == f) {
                                    var t = m
                                  }else {
                                    36 == f && (t = 4)
                                  }
                                  j = t
                                }else {
                                  38 == f && (f = 0 != (m | 0) ? 40 : 39, 39 == f && (m = 1), j = 12)
                                }
                              }
                            }
                            f = 0 != (m | 0) ? 43 : 44;
                            43 == f && (o <<= m);
                            f = 0 != (j | 0) ? 45 : 50;
                            do {
                              if(45 == f) {
                                f = s >>> 0 < j >>> 0 ? 46 : 49;
                                do {
                                  if(46 == f) {
                                    f = -1 == (_h264bsdFlushBits(a, 32 - s) | 0) ? 47 : 48;
                                    do {
                                      if(47 == f) {
                                        g = 1;
                                        break a
                                      }else {
                                        48 == f && (r = _h264bsdShowBits32(a), s = 32)
                                      }
                                    }while(0)
                                  }
                                }while(0);
                                q = r >>> (32 - j >>> 0);
                                r <<= j;
                                s -= j;
                                o += q
                              }
                            }while(0);
                            j = o;
                            f = (h | 0) == (k | 0) ? 51 : 53;
                            g:do {
                              if(51 == f) {
                                if(!(3 > k >>> 0)) {
                                  break g
                                }
                                j += 2
                              }
                            }while(0);
                            HEAP32[e + (h << 2) >> 2] = j + 2 >>> 1;
                            f = 0 == (m | 0) ? 54 : 55;
                            54 == f && (m = 1);
                            f = (HEAP32[e + (h << 2) >> 2] | 0) > (3 << m - 1 | 0) ? 56 : 58;
                            g:do {
                              if(56 == f) {
                                if(!(6 > m >>> 0)) {
                                  break g
                                }
                                m += 1
                              }
                            }while(0);
                            f = 0 != (j & 1 | 0) ? 59 : 60;
                            59 == f && (HEAP32[e + (h << 2) >> 2] = -HEAP32[e + (h << 2) >> 2]);
                            h += 1
                          }
                        }
                      }while(0)
                    }
                    f = l >>> 0 < d >>> 0 ? 63 : 70;
                    do {
                      if(63 == f) {
                        f = 9 > s >>> 0 ? 64 : 67;
                        do {
                          if(64 == f) {
                            f = -1 == (_h264bsdFlushBits(a, 32 - s) | 0) ? 65 : 66;
                            do {
                              if(65 == f) {
                                g = 1;
                                break a
                              }else {
                                66 == f && (r = _h264bsdShowBits32(a), s = 32)
                              }
                            }while(0)
                          }
                        }while(0);
                        o = r >>> 23;
                        p = _DecodeTotalZeros(o, l, 4 == (d | 0) & 1);
                        f = 0 != (p | 0) ? 69 : 68;
                        do {
                          if(69 == f) {
                            r <<= p & 15, s -= p & 15, p = p >>> 4 & 15
                          }else {
                            if(68 == f) {
                              g = 1;
                              break a
                            }
                          }
                        }while(0)
                      }else {
                        70 == f && (p = 0)
                      }
                    }while(0);
                    h = 0;
                    e:for(;;) {
                      if(!(h >>> 0 < l - 1 >>> 0)) {
                        break e
                      }
                      f = 0 < p >>> 0 ? 74 : 81;
                      do {
                        if(74 == f) {
                          f = 11 > s >>> 0 ? 75 : 78;
                          do {
                            if(75 == f) {
                              f = -1 == (_h264bsdFlushBits(a, 32 - s) | 0) ? 76 : 77;
                              do {
                                if(76 == f) {
                                  g = 1;
                                  break a
                                }else {
                                  77 == f && (r = _h264bsdShowBits32(a), s = 32)
                                }
                              }while(0)
                            }
                          }while(0);
                          o = r >>> 21;
                          j = _DecodeRunBefore(o, p);
                          f = 0 != (j | 0) ? 80 : 79;
                          do {
                            if(80 == f) {
                              r <<= j & 15, s -= j & 15, HEAP32[n + (h << 2) >> 2] = j >>> 4 & 15, q = HEAP32[n + (h << 2) >> 2], HEAP32[n + (h << 2) >> 2] = q + 1, p -= q
                            }else {
                              if(79 == f) {
                                g = 1;
                                break a
                              }
                            }
                          }while(0)
                        }else {
                          81 == f && (HEAP32[n + (h << 2) >> 2] = 1)
                        }
                      }while(0);
                      h += 1
                    }
                    j = p;
                    HEAP32[c + (j << 2) >> 2] = HEAP32[e + (l - 1 << 2) >> 2];
                    q = 1 << j;
                    h = l - 1;
                    e:for(;;) {
                      o = h;
                      h = o - 1;
                      if(0 == (o | 0)) {
                        break e
                      }
                      j += HEAP32[n + (h << 2) >> 2];
                      q |= 1 << j;
                      HEAP32[c + (j << 2) >> 2] = HEAP32[e + (h << 2) >> 2]
                    }
                  }else {
                    88 == f && (q = 0)
                  }
                }while(0);
                f = 0 != (_h264bsdFlushBits(a, 32 - s) | 0) ? 90 : 91;
                90 == f ? g = 1 : 91 == f && (g = l << 4 | q << 16)
              }
            }
          }while(0)
        }else {
          5 == f && (g = 1)
        }
      }while(0)
    }
  }while(0);
  STACKTOP = e;
  return g
}
_h264bsdDecodeResidualBlockCavlc.X = 1;
function _DecodeLevelPrefix(a) {
  var c, b, d;
  c = 32768 <= a >>> 0 ? 1 : 2;
  a:do {
    if(1 == c) {
      d = 0;
      c = 48;
      break a
    }else {
      if(2 == c) {
        c = 16384 <= a >>> 0 ? 3 : 4;
        do {
          if(3 == c) {
            d = 1
          }else {
            if(4 == c) {
              c = 8192 <= a >>> 0 ? 5 : 6;
              do {
                if(5 == c) {
                  d = 2
                }else {
                  if(6 == c) {
                    c = 4096 <= a >>> 0 ? 7 : 8;
                    do {
                      if(7 == c) {
                        d = 3
                      }else {
                        if(8 == c) {
                          c = 2048 <= a >>> 0 ? 9 : 10;
                          do {
                            if(9 == c) {
                              d = 4
                            }else {
                              if(10 == c) {
                                c = 1024 <= a >>> 0 ? 11 : 12;
                                do {
                                  if(11 == c) {
                                    d = 5
                                  }else {
                                    if(12 == c) {
                                      c = 512 <= a >>> 0 ? 13 : 14;
                                      do {
                                        if(13 == c) {
                                          d = 6
                                        }else {
                                          if(14 == c) {
                                            c = 256 <= a >>> 0 ? 15 : 16;
                                            do {
                                              if(15 == c) {
                                                d = 7
                                              }else {
                                                if(16 == c) {
                                                  c = 128 <= a >>> 0 ? 17 : 18;
                                                  do {
                                                    if(17 == c) {
                                                      d = 8
                                                    }else {
                                                      if(18 == c) {
                                                        c = 64 <= a >>> 0 ? 19 : 20;
                                                        do {
                                                          if(19 == c) {
                                                            d = 9
                                                          }else {
                                                            if(20 == c) {
                                                              c = 32 <= a >>> 0 ? 21 : 22;
                                                              do {
                                                                if(21 == c) {
                                                                  d = 10
                                                                }else {
                                                                  if(22 == c) {
                                                                    c = 16 <= a >>> 0 ? 23 : 24;
                                                                    do {
                                                                      if(23 == c) {
                                                                        d = 11
                                                                      }else {
                                                                        if(24 == c) {
                                                                          c = 8 <= a >>> 0 ? 25 : 26;
                                                                          do {
                                                                            if(25 == c) {
                                                                              d = 12
                                                                            }else {
                                                                              if(26 == c) {
                                                                                c = 4 <= a >>> 0 ? 27 : 28;
                                                                                do {
                                                                                  if(27 == c) {
                                                                                    d = 13
                                                                                  }else {
                                                                                    if(28 == c) {
                                                                                      c = 2 <= a >>> 0 ? 29 : 30;
                                                                                      do {
                                                                                        if(29 == c) {
                                                                                          d = 14
                                                                                        }else {
                                                                                          if(30 == c) {
                                                                                            c = 1 <= a >>> 0 ? 31 : 32;
                                                                                            do {
                                                                                              if(31 == c) {
                                                                                                d = 15
                                                                                              }else {
                                                                                                if(32 == c) {
                                                                                                  b = -2;
                                                                                                  c = 49;
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
        }while(0);
        c = 48;
        break a
      }
    }
  }while(0);
  48 == c && (b = d);
  return b
}
_DecodeLevelPrefix.X = 1;
function _DecodeTotalZeros(a, c, b) {
  var d;
  d = 0;
  b = 0 != (b | 0) ? 20 : 1;
  20 == b ? (a >>>= 6, b = 3 < a >>> 0 ? 21 : 22, 21 == b ? d = 1 : 22 == b && (b = 3 == (c | 0) ? 23 : 24, 23 == b ? d = 17 : 24 == b && (b = 1 < a >>> 0 ? 25 : 26, 25 == b ? d = 18 : 26 == b && (b = 2 == (c | 0) ? 27 : 28, 27 == b ? d = 34 : 28 == b && (b = 0 != (a | 0) ? 29 : 30, 29 == b ? d = 35 : 30 == b && (d = 51)))))) : 1 == b && (b = 1 == c ? 2 : 2 == c ? 5 : 3 == c ? 6 : 4 == c ? 7 : 5 == c ? 8 : 6 == c ? 9 : 7 == c ? 10 : 8 == c ? 11 : 9 == c ? 12 : 10 == c ? 13 : 11 == c ? 14 : 12 == 
  c ? 15 : 13 == c ? 16 : 14 == c ? 17 : 18, 18 == b ? d = 0 != (a >>> 8 | 0) ? 17 : 1 : 2 == b ? (d = HEAPU8[_totalZeros_1_0 + (a >>> 4)] & 255, 3 == (0 != (d | 0) ? 4 : 3) && (d = HEAPU8[_totalZeros_1_1 + a] & 255)) : 5 == b ? d = HEAPU8[_totalZeros_2 + (a >>> 3)] & 255 : 6 == b ? d = HEAPU8[_totalZeros_3 + (a >>> 3)] & 255 : 7 == b ? d = HEAPU8[_totalZeros_4 + (a >>> 4)] & 255 : 8 == b ? d = HEAPU8[_totalZeros_5 + (a >>> 4)] & 255 : 9 == b ? d = HEAPU8[_totalZeros_6 + (a >>> 3)] & 255 : 10 == 
  b ? d = HEAPU8[_totalZeros_7 + (a >>> 3)] & 255 : 11 == b ? d = HEAPU8[_totalZeros_8 + (a >>> 3)] & 255 : 12 == b ? d = HEAPU8[_totalZeros_9 + (a >>> 3)] & 255 : 13 == b ? d = HEAPU8[_totalZeros_10 + (a >>> 4)] & 255 : 14 == b ? d = HEAPU8[_totalZeros_11 + (a >>> 5)] & 255 : 15 == b ? d = HEAPU8[_totalZeros_12 + (a >>> 5)] & 255 : 16 == b ? d = HEAPU8[_totalZeros_13 + (a >>> 6)] & 255 : 17 == b && (d = HEAPU8[_totalZeros_14 + (a >>> 7)] & 255));
  return d
}
_DecodeTotalZeros.X = 1;
function _DecodeRunBefore(a, c) {
  var b, d;
  d = 0;
  b = 1 == c ? 1 : 2 == c ? 2 : 3 == c ? 3 : 4 == c ? 4 : 5 == c ? 5 : 6 == c ? 6 : 7;
  7 == b ? (b = 256 <= a >>> 0 ? 8 : 9, 8 == b ? d = (7 - (a >>> 8) << 4) + 3 : 9 == b && (b = 128 <= a >>> 0 ? 10 : 11, 10 == b ? d = 116 : 11 == b && (b = 64 <= a >>> 0 ? 12 : 13, 12 == b ? d = 133 : 13 == b && (b = 32 <= a >>> 0 ? 14 : 15, 14 == b ? d = 150 : 15 == b && (b = 16 <= a >>> 0 ? 16 : 17, 16 == b ? d = 167 : 17 == b && (b = 8 <= a >>> 0 ? 18 : 19, 18 == b ? d = 184 : 19 == b && (b = 4 <= a >>> 0 ? 20 : 21, 20 == b ? d = 201 : 21 == b && (b = 2 <= a >>> 0 ? 22 : 23, 22 == b ? d = 218 : 
  23 == b && 24 == (0 != (a | 0) ? 24 : 25) && (d = 235)))))))), 34 == ((d >>> 4 & 15) >>> 0 > c >>> 0 ? 34 : 35) && (d = 0)) : 1 == b ? d = HEAPU8[_runBefore_1 + (a >>> 10)] & 255 : 2 == b ? d = HEAPU8[_runBefore_2 + (a >>> 9)] & 255 : 3 == b ? d = HEAPU8[_runBefore_3 + (a >>> 9)] & 255 : 4 == b ? d = HEAPU8[_runBefore_4 + (a >>> 8)] & 255 : 5 == b ? d = HEAPU8[_runBefore_5 + (a >>> 8)] & 255 : 6 == b && (d = HEAPU8[_runBefore_6 + (a >>> 8)] & 255);
  return d
}
_DecodeRunBefore.X = 1;
function _h264bsdInitMbNeighbours(a, c, b) {
  var d, e, f, g;
  e = f = g = 0;
  a:for(;;) {
    if(!(e >>> 0 < b >>> 0)) {
      break a
    }
    d = 0 != (g | 0) ? 3 : 4;
    3 == d ? HEAP32[a + 216 * e + 200 >> 2] = a + 216 * e - 216 : 4 == d && (HEAP32[a + 216 * e + 200 >> 2] = 0);
    d = 0 != (f | 0) ? 6 : 7;
    6 == d ? HEAP32[a + 216 * e + 204 >> 2] = a + 216 * e + 216 * -c : 7 == d && (HEAP32[a + 216 * e + 204 >> 2] = 0);
    d = 0 != (f | 0) ? 9 : 11;
    b:do {
      if(9 == d) {
        if(!(g >>> 0 < c - 1 >>> 0)) {
          d = 11;
          break b
        }
        HEAP32[a + 216 * e + 208 >> 2] = a + 216 * e + 216 * -(c - 1);
        d = 12;
        break b
      }
    }while(0);
    11 == d && (HEAP32[a + 216 * e + 208 >> 2] = 0);
    d = 0 != (f | 0) ? 13 : 15;
    b:do {
      if(13 == d) {
        if(0 == (g | 0)) {
          d = 15;
          break b
        }
        HEAP32[a + 216 * e + 212 >> 2] = a + 216 * e + 216 * -(c + 1);
        d = 16;
        break b
      }
    }while(0);
    15 == d && (HEAP32[a + 216 * e + 212 >> 2] = 0);
    g += 1;
    d = (g | 0) == (c | 0) ? 17 : 18;
    17 == d && (g = 0, f += 1);
    e += 1
  }
}
_h264bsdInitMbNeighbours.X = 1;
function _h264bsdDecodeNalUnit(a, c) {
  var b, d, e;
  e = _h264bsdGetBits(a, 1);
  b = -1 == (e | 0) ? 1 : 2;
  a:do {
    if(1 == b) {
      d = 1
    }else {
      if(2 == b) {
        e = _h264bsdGetBits(a, 2);
        HEAP32[c + 4 >> 2] = e;
        e = _h264bsdGetBits(a, 5);
        HEAP32[c >> 2] = e;
        b = 2 == (e | 0) ? 5 : 3;
        b:do {
          if(3 == b) {
            if(3 == (e | 0)) {
              break b
            }
            if(4 == (e | 0)) {
              break b
            }
            b = 7 == (e | 0) ? 9 : 7;
            c:do {
              if(7 == b) {
                if(8 == (e | 0)) {
                  b = 9;
                  break c
                }
                b = 5 == (e | 0) ? 9 : 11;
                break c
              }
            }while(0);
            c:do {
              if(9 == b) {
                if(0 != (HEAP32[c + 4 >> 2] | 0)) {
                  break c
                }
                d = 1;
                break a
              }
            }while(0);
            b = 6 == (e | 0) ? 16 : 12;
            c:do {
              if(12 == b) {
                if(9 == (e | 0)) {
                  b = 16;
                  break c
                }
                if(10 == (e | 0)) {
                  b = 16;
                  break c
                }
                if(11 == (e | 0)) {
                  b = 16;
                  break c
                }
                b = 12 == (e | 0) ? 16 : 18;
                break c
              }
            }while(0);
            c:do {
              if(16 == b) {
                if(0 == (HEAP32[c + 4 >> 2] | 0)) {
                  break c
                }
                d = 1;
                break a
              }
            }while(0);
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
_h264bsdDecodeNalUnit.X = 1;
function _h264bsdGetNeighbourMb(a, c) {
  var b, d;
  b = 0 == (c | 0) ? 1 : 2;
  1 == b ? d = HEAP32[a + 200 >> 2] : 2 == b && (b = 1 == (c | 0) ? 3 : 4, 3 == b ? d = HEAP32[a + 204 >> 2] : 4 == b && (b = 2 == (c | 0) ? 5 : 6, 5 == b ? d = HEAP32[a + 208 >> 2] : 6 == b && (b = 3 == (c | 0) ? 7 : 8, 7 == b ? d = HEAP32[a + 212 >> 2] : 8 == b && (b = 4 == (c | 0) ? 9 : 10, 9 == b ? d = a : 10 == b && (d = 0)))));
  return d
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
function _h264bsdIsNeighbourAvailable(a, c) {
  var b, d;
  b = 0 == (c | 0) ? 2 : 1;
  a:do {
    if(1 == b) {
      if((HEAP32[a + 4 >> 2] | 0) != (HEAP32[c + 4 >> 2] | 0)) {
        b = 2;
        break a
      }
      d = 1;
      b = 4;
      break a
    }
  }while(0);
  2 == b && (d = 0);
  return d
}
function _h264bsdInitStorage(a) {
  _H264SwDecMemset(a, 0, 3388);
  HEAP32[a + 8 >> 2] = 32;
  HEAP32[a + 4 >> 2] = 256;
  HEAP32[a + 1332 >> 2] = 1
}
function _h264bsdStoreSeqParamSet(a, c) {
  var b, d, e;
  e = HEAP32[c + 8 >> 2];
  b = 0 == (HEAP32[a + 20 + (e << 2) >> 2] | 0) ? 1 : 4;
  a:do {
    if(1 == b) {
      b = _H264SwDecMalloc(92);
      HEAP32[a + 20 + (e << 2) >> 2] = b;
      b = 0 == (HEAP32[a + 20 + (e << 2) >> 2] | 0) ? 2 : 3;
      do {
        if(2 == b) {
          d = 65535;
          b = 12;
          break a
        }else {
          if(3 == b) {
            b = 11;
            break a
          }
        }
      }while(0)
    }else {
      if(4 == b) {
        b = (e | 0) == (HEAP32[a + 8 >> 2] | 0) ? 5 : 9;
        do {
          if(5 == b) {
            b = 0 != (_h264bsdCompareSeqParamSets(c, HEAP32[a + 16 >> 2]) | 0) ? 6 : 7;
            do {
              if(6 == b) {
                _H264SwDecFree(HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 40 >> 2]), HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 40 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 84 >> 2]), HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 84 >> 2] = 0, HEAP32[a + 8 >> 2] = 33, HEAP32[a + 4 >> 2] = 257, HEAP32[a + 16 >> 2] = 0, HEAP32[a + 12 >> 2] = 0
              }else {
                if(7 == b) {
                  _H264SwDecFree(HEAP32[c + 40 >> 2]);
                  HEAP32[c + 40 >> 2] = 0;
                  _H264SwDecFree(HEAP32[c + 84 >> 2]);
                  d = HEAP32[c + 84 >> 2] = 0;
                  b = 12;
                  break a
                }
              }
            }while(0)
          }else {
            9 == b && (_H264SwDecFree(HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 40 >> 2]), HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 40 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 84 >> 2]), HEAP32[HEAP32[a + 20 + (e << 2) >> 2] + 84 >> 2] = 0)
          }
        }while(0);
        b = 11;
        break a
      }
    }
  }while(0);
  if(11 == b) {
    e = HEAP32[a + 20 + (e << 2) >> 2];
    var f;
    d = c;
    b = d + 92;
    if(e % 4 == d % 4) {
      for(;0 !== d % 4 && d < b;) {
        HEAP8[e++] = HEAP8[d++]
      }
      d >>= 2;
      e >>= 2;
      for(f = b >> 2;d < f;) {
        HEAP32[e++] = HEAP32[d++]
      }
      d <<= 2;
      e <<= 2
    }
    for(;d < b;) {
      HEAP8[e++] = HEAP8[d++]
    }
    d = 0
  }
  return d
}
_h264bsdStoreSeqParamSet.X = 1;
function _h264bsdStorePicParamSet(a, c) {
  var b, d, e;
  e = HEAP32[c >> 2];
  b = 0 == (HEAP32[a + 148 + (e << 2) >> 2] | 0) ? 1 : 4;
  a:do {
    if(1 == b) {
      b = _H264SwDecMalloc(72);
      HEAP32[a + 148 + (e << 2) >> 2] = b;
      b = 0 == (HEAP32[a + 148 + (e << 2) >> 2] | 0) ? 2 : 3;
      do {
        if(2 == b) {
          d = 65535;
          b = 11;
          break a
        }else {
          if(3 == b) {
            b = 10;
            break a
          }
        }
      }while(0)
    }else {
      if(4 == b) {
        b = (e | 0) == (HEAP32[a + 4 >> 2] | 0) ? 5 : 8;
        5 == b ? (b = (HEAP32[c + 4 >> 2] | 0) != (HEAP32[a + 8 >> 2] | 0) ? 6 : 7, 6 == b && (HEAP32[a + 4 >> 2] = 257), _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 20 >> 2]), HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 20 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 24 >> 2]), HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 24 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 28 >> 2]), HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 28 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 
        148 + (e << 2) >> 2] + 44 >> 2]), HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 44 >> 2] = 0) : 8 == b && (_H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 20 >> 2]), HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 20 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 24 >> 2]), HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 24 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 28 >> 2]), HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 28 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 
        148 + (e << 2) >> 2] + 44 >> 2]), HEAP32[HEAP32[a + 148 + (e << 2) >> 2] + 44 >> 2] = 0);
        b = 10;
        break a
      }
    }
  }while(0);
  if(10 == b) {
    e = HEAP32[a + 148 + (e << 2) >> 2];
    var f;
    d = c;
    b = d + 72;
    if(e % 4 == d % 4) {
      for(;0 !== d % 4 && d < b;) {
        HEAP8[e++] = HEAP8[d++]
      }
      d >>= 2;
      e >>= 2;
      for(f = b >> 2;d < f;) {
        HEAP32[e++] = HEAP32[d++]
      }
      d <<= 2;
      e <<= 2
    }
    for(;d < b;) {
      HEAP8[e++] = HEAP8[d++]
    }
    d = 0
  }
  return d
}
_h264bsdStorePicParamSet.X = 1;
function _CheckPps(a, c) {
  var b, d, e, f;
  f = HEAP32[c + 52 >> 2] * HEAP32[c + 56 >> 2];
  b = 1 < HEAPU32[a + 12 >> 2] >>> 0 ? 1 : 32;
  a:do {
    if(1 == b) {
      b = 0 == (HEAP32[a + 16 >> 2] | 0) ? 2 : 9;
      b:do {
        if(2 == b) {
          e = 0;
          for(;;) {
            b = e >>> 0 < HEAPU32[a + 12 >> 2] >>> 0 ? 4 : 8;
            do {
              if(4 == b) {
                b = HEAPU32[HEAP32[a + 20 >> 2] + (e << 2) >> 2] >>> 0 > f >>> 0 ? 5 : 6;
                do {
                  if(5 == b) {
                    d = 1;
                    b = 33;
                    break a
                  }else {
                    6 == b && (e += 1)
                  }
                }while(0)
              }else {
                if(8 == b) {
                  break b
                }
              }
            }while(0)
          }
        }else {
          if(9 == b) {
            b = 2 == (HEAP32[a + 16 >> 2] | 0) ? 10 : 20;
            c:do {
              if(10 == b) {
                e = 0;
                d:for(;;) {
                  b = e >>> 0 < HEAP32[a + 12 >> 2] - 1 >>> 0 ? 12 : 19;
                  do {
                    if(12 == b) {
                      b = HEAPU32[HEAP32[a + 24 >> 2] + (e << 2) >> 2] >>> 0 > HEAPU32[HEAP32[a + 28 >> 2] + (e << 2) >> 2] >>> 0 ? 14 : 13;
                      f:do {
                        if(13 == b) {
                          if(HEAPU32[HEAP32[a + 28 >> 2] + (e << 2) >> 2] >>> 0 >= f >>> 0) {
                            break f
                          }
                          b = (HEAPU32[HEAP32[a + 24 >> 2] + (e << 2) >> 2] >>> 0) % (HEAPU32[c + 52 >> 2] >>> 0) >>> 0 > (HEAPU32[HEAP32[a + 28 >> 2] + (e << 2) >> 2] >>> 0) % (HEAPU32[c + 52 >> 2] >>> 0) >>> 0 ? 16 : 17;
                          do {
                            if(16 == b) {
                              d = 1;
                              b = 33;
                              break a
                            }else {
                              if(17 == b) {
                                e += 1;
                                continue d
                              }
                            }
                          }while(0)
                        }
                      }while(0);
                      d = 1;
                      b = 33;
                      break a
                    }else {
                      if(19 == b) {
                        break c
                      }
                    }
                  }while(0)
                }
              }else {
                if(20 == b) {
                  b = 2 < HEAPU32[a + 16 >> 2] >>> 0 ? 21 : 25;
                  d:do {
                    if(21 == b) {
                      if(!(6 > HEAPU32[a + 16 >> 2] >>> 0)) {
                        b = 25;
                        break d
                      }
                      b = HEAPU32[a + 36 >> 2] >>> 0 > f >>> 0 ? 23 : 24;
                      do {
                        if(23 == b) {
                          d = 1;
                          b = 33;
                          break a
                        }else {
                          if(24 == b) {
                            b = 29;
                            break d
                          }
                        }
                      }while(0)
                    }
                  }while(0);
                  do {
                    if(25 == b) {
                      b = 6 == (HEAP32[a + 16 >> 2] | 0) ? 26 : 28;
                      e:do {
                        if(26 == b) {
                          if(!(HEAPU32[a + 40 >> 2] >>> 0 < f >>> 0)) {
                            break e
                          }
                          d = 1;
                          b = 33;
                          break a
                        }
                      }while(0)
                    }
                  }while(0)
                }
              }
            }while(0)
          }
        }
      }while(0);
      b = 32;
      break a
    }
  }while(0);
  32 == b && (d = 0);
  return d
}
_CheckPps.X = 1;
function _h264bsdResetStorage(a) {
  var c;
  HEAP32[a + 1196 >> 2] = 0;
  c = HEAP32[a + 1192 >> 2] = 0;
  a:for(;;) {
    if(!(c >>> 0 < HEAPU32[a + 1176 >> 2] >>> 0)) {
      break a
    }
    HEAP32[HEAP32[a + 1212 >> 2] + 216 * c + 4 >> 2] = 0;
    HEAP32[HEAP32[a + 1212 >> 2] + 216 * c + 196 >> 2] = 0;
    c += 1
  }
}
function _h264bsdIsStartOfPicture(a) {
  var c, a = 0 == (HEAP32[a + 1188 >> 2] | 0) ? 1 : 2;
  1 == a ? c = 1 : 2 == a && (c = 0);
  return c
}
function _h264bsdIsEndOfPicture(a) {
  var c, b, d;
  c = 0 != (HEAP32[a + 1404 >> 2] | 0) ? 4 : 1;
  a:do {
    if(4 == c) {
      d = c = 0;
      b:for(;;) {
        if(!(c >>> 0 < HEAPU32[a + 1176 >> 2] >>> 0)) {
          break b
        }
        d += 0 != (HEAP32[HEAP32[a + 1212 >> 2] + 216 * c + 196 >> 2] | 0) ? 1 : 0;
        c += 1
      }
      c = (d | 0) == (HEAP32[a + 1176 >> 2] | 0) ? 9 : 10;
      do {
        if(9 == c) {
          b = 1;
          c = 12;
          break a
        }else {
          if(10 == c) {
            c = 11;
            break a
          }
        }
      }while(0)
    }else {
      if(1 == c) {
        c = (HEAP32[a + 1196 >> 2] | 0) == (HEAP32[a + 1176 >> 2] | 0) ? 2 : 3;
        do {
          if(2 == c) {
            b = 1;
            c = 12;
            break a
          }else {
            if(3 == c) {
              c = 11;
              break a
            }
          }
        }while(0)
      }
    }
  }while(0);
  11 == c && (b = 0);
  return b
}
_h264bsdIsEndOfPicture.X = 1;
function _h264bsdComputeSliceGroupMap(a, c) {
  _h264bsdDecodeSliceGroupMap(HEAP32[a + 1172 >> 2], HEAP32[a + 12 >> 2], c, HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2])
}
function _h264bsdActivateParamSets(a, c, b) {
  var d, e, f, g;
  d = 0 == (HEAP32[a + 148 + (c << 2) >> 2] | 0) ? 2 : 1;
  a:do {
    if(1 == d) {
      if(0 == (HEAP32[a + 20 + (HEAP32[HEAP32[a + 148 + (c << 2) >> 2] + 4 >> 2] << 2) >> 2] | 0)) {
        d = 2;
        break a
      }
      f = _CheckPps(HEAP32[a + 148 + (c << 2) >> 2], HEAP32[a + 20 + (HEAP32[HEAP32[a + 148 + (c << 2) >> 2] + 4 >> 2] << 2) >> 2]);
      d = 0 != (f | 0) ? 4 : 5;
      do {
        if(4 == d) {
          e = f;
          d = 32;
          break a
        }else {
          if(5 == d) {
            d = 256 == (HEAP32[a + 4 >> 2] | 0) ? 6 : 7;
            do {
              if(6 == d) {
                HEAP32[a + 4 >> 2] = c, HEAP32[a + 12 >> 2] = HEAP32[a + 148 + (c << 2) >> 2], HEAP32[a + 8 >> 2] = HEAP32[HEAP32[a + 12 >> 2] + 4 >> 2], HEAP32[a + 16 >> 2] = HEAP32[a + 20 + (HEAP32[a + 8 >> 2] << 2) >> 2], HEAP32[a + 1176 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2] * HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2], HEAP32[a + 1340 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[a + 1344 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2], HEAP32[a + 3380 >> 2] = 1
              }else {
                if(7 == d) {
                  d = 0 != (HEAP32[a + 3380 >> 2] | 0) ? 8 : 21;
                  d:do {
                    if(8 == d) {
                      HEAP32[a + 3380 >> 2] = 0;
                      _H264SwDecFree(HEAP32[a + 1212 >> 2]);
                      HEAP32[a + 1212 >> 2] = 0;
                      _H264SwDecFree(HEAP32[a + 1172 >> 2]);
                      HEAP32[a + 1172 >> 2] = 0;
                      d = _H264SwDecMalloc(216 * HEAP32[a + 1176 >> 2]);
                      HEAP32[a + 1212 >> 2] = d;
                      d = _H264SwDecMalloc(HEAP32[a + 1176 >> 2] << 2);
                      HEAP32[a + 1172 >> 2] = d;
                      d = 0 == (HEAP32[a + 1212 >> 2] | 0) ? 10 : 9;
                      e:do {
                        if(9 == d) {
                          if(0 == (HEAP32[a + 1172 >> 2] | 0)) {
                            break e
                          }
                          _H264SwDecMemset(HEAP32[a + 1212 >> 2], 0, 216 * HEAP32[a + 1176 >> 2]);
                          _h264bsdInitMbNeighbours(HEAP32[a + 1212 >> 2], HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[a + 1176 >> 2]);
                          d = 0 != (HEAP32[a + 1216 >> 2] | 0) ? 16 : 12;
                          f:do {
                            if(12 == d) {
                              if(2 == (HEAP32[HEAP32[a + 16 >> 2] + 16 >> 2] | 0)) {
                                d = 16;
                                break f
                              }
                              d = 0 != (HEAP32[HEAP32[a + 16 >> 2] + 80 >> 2] | 0) ? 14 : 17;
                              g:do {
                                if(14 == d) {
                                  if(0 == (HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 920 >> 2] | 0)) {
                                    break g
                                  }
                                  if(0 == (HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 944 >> 2] | 0)) {
                                    d = 16;
                                    break f
                                  }
                                }
                              }while(0);
                              g = 0;
                              d = 18;
                              break f
                            }
                          }while(0);
                          16 == d && (g = 1);
                          f = _h264bsdResetDpb(a + 1220, HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2] * HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2], HEAP32[HEAP32[a + 16 >> 2] + 88 >> 2], HEAP32[HEAP32[a + 16 >> 2] + 44 >> 2], HEAP32[HEAP32[a + 16 >> 2] + 12 >> 2], g);
                          d = 0 != (f | 0) ? 19 : 20;
                          do {
                            if(19 == d) {
                              e = f;
                              d = 32;
                              break a
                            }else {
                              if(20 == d) {
                                break d
                              }
                            }
                          }while(0)
                        }
                      }while(0);
                      e = 65535;
                      d = 32;
                      break a
                    }else {
                      if(21 == d) {
                        d = (c | 0) != (HEAP32[a + 4 >> 2] | 0) ? 22 : 29;
                        do {
                          if(22 == d) {
                            d = (HEAP32[HEAP32[a + 148 + (c << 2) >> 2] + 4 >> 2] | 0) != (HEAP32[a + 8 >> 2] | 0) ? 23 : 27;
                            do {
                              if(23 == d) {
                                d = 0 != (b | 0) ? 24 : 25;
                                do {
                                  if(24 == d) {
                                    HEAP32[a + 4 >> 2] = c, HEAP32[a + 12 >> 2] = HEAP32[a + 148 + (c << 2) >> 2], HEAP32[a + 8 >> 2] = HEAP32[HEAP32[a + 12 >> 2] + 4 >> 2], HEAP32[a + 16 >> 2] = HEAP32[a + 20 + (HEAP32[a + 8 >> 2] << 2) >> 2], HEAP32[a + 1176 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2] * HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2], HEAP32[a + 1340 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2], HEAP32[a + 1344 >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2], HEAP32[a + 3380 >> 2] = 1
                                  }else {
                                    if(25 == d) {
                                      e = 1;
                                      d = 32;
                                      break a
                                    }
                                  }
                                }while(0)
                              }else {
                                27 == d && (HEAP32[a + 4 >> 2] = c, HEAP32[a + 12 >> 2] = HEAP32[a + 148 + (c << 2) >> 2])
                              }
                            }while(0)
                          }
                        }while(0)
                      }
                    }
                  }while(0)
                }
              }
            }while(0);
            e = 0;
            d = 32;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  2 == d && (e = 1);
  return e
}
_h264bsdActivateParamSets.X = 1;
function _h264bsdDecodeSliceGroupMap(a, c, b, d, e) {
  var f, g, h, j, l;
  l = j = 0;
  h = d * e;
  f = 1 == (HEAP32[c + 12 >> 2] | 0) ? 1 : 2;
  do {
    if(1 == f) {
      _H264SwDecMemset(a, 0, h << 2)
    }else {
      if(2 == f) {
        f = 2 < HEAPU32[c + 16 >> 2] >>> 0 ? 3 : 14;
        b:do {
          if(3 == f) {
            if(!(6 > HEAPU32[c + 16 >> 2] >>> 0)) {
              break b
            }
            f = b * HEAP32[c + 36 >> 2] >>> 0 < h >>> 0 ? 5 : 6;
            if(5 == f) {
              var k = b * HEAP32[c + 36 >> 2]
            }else {
              6 == f && (k = h)
            }
            j = k;
            f = 4 == (HEAP32[c + 16 >> 2] | 0) ? 9 : 8;
            c:do {
              if(8 == f) {
                f = 5 == (HEAP32[c + 16 >> 2] | 0) ? 9 : 13;
                break c
              }
            }while(0);
            if(9 == f) {
              f = 0 != (HEAP32[c + 32 >> 2] | 0) ? 10 : 11;
              if(10 == f) {
                var m = h - j
              }else {
                11 == f && (m = j)
              }
              l = m
            }
          }
        }while(0);
        f = HEAP32[c + 16 >> 2];
        f = 0 == f ? 15 : 1 == f ? 16 : 2 == f ? 17 : 3 == f ? 18 : 4 == f ? 19 : 5 == f ? 20 : 21;
        do {
          if(21 == f) {
            g = 0;
            c:for(;;) {
              if(!(g >>> 0 < h >>> 0)) {
                break c
              }
              HEAP32[a + (g << 2) >> 2] = HEAP32[HEAP32[c + 44 >> 2] + (g << 2) >> 2];
              g += 1
            }
          }else {
            15 == f ? _DecodeInterleavedMap(a, HEAP32[c + 12 >> 2], HEAP32[c + 20 >> 2], h) : 16 == f ? _DecodeDispersedMap(a, HEAP32[c + 12 >> 2], d, e) : 17 == f ? _DecodeForegroundLeftOverMap(a, HEAP32[c + 12 >> 2], HEAP32[c + 24 >> 2], HEAP32[c + 28 >> 2], d, e) : 18 == f ? _DecodeBoxOutMap(a, HEAP32[c + 32 >> 2], j, d, e) : 19 == f ? _DecodeRasterScanMap(a, HEAP32[c + 32 >> 2], l, h) : 20 == f && _DecodeWipeMap(a, HEAP32[c + 32 >> 2], l, d, e)
          }
        }while(0)
      }
    }
  }while(0)
}
_h264bsdDecodeSliceGroupMap.X = 1;
function _DecodeInterleavedMap(a, c, b, d) {
  var e, f, g, h;
  f = 0;
  a:for(;;) {
    h = 0;
    b:for(;;) {
      if(h >>> 0 < c >>> 0) {
        e = 3
      }else {
        var j = 0;
        e = 4
      }
      3 == e && (j = f >>> 0 < d >>> 0);
      if(!j) {
        break b
      }
      g = 0;
      c:for(;;) {
        if(g >>> 0 < HEAPU32[b + (h << 2) >> 2] >>> 0) {
          e = 7
        }else {
          var l = 0;
          e = 8
        }
        7 == e && (l = f + g >>> 0 < d >>> 0);
        if(!l) {
          break c
        }
        HEAP32[a + (f + g << 2) >> 2] = h;
        g += 1
      }
      e = h;
      h = e + 1;
      f += HEAP32[b + (e << 2) >> 2]
    }
    if(!(f >>> 0 < d >>> 0)) {
      break a
    }
  }
}
_DecodeInterleavedMap.X = 1;
function _h264bsdCheckAccessUnitBoundary(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 28;
  var f, g, h, j = e + 4, l = e + 8, k = e + 12, m = e + 16, o = e + 20, q;
  HEAP32[d >> 2] = 0;
  f = 5 < HEAPU32[c >> 2] >>> 0 ? 1 : 2;
  a:do {
    if(1 == f) {
      f = 12 > HEAPU32[c >> 2] >>> 0 ? 4 : 2;
      break a
    }
  }while(0);
  a:do {
    if(2 == f) {
      f = 12 < HEAPU32[c >> 2] >>> 0 ? 3 : 5;
      do {
        if(3 == f && 18 >= HEAPU32[c >> 2] >>> 0) {
          f = 4;
          break a
        }
      }while(0);
      f = 1 != (HEAP32[c >> 2] | 0) ? 6 : 8;
      b:do {
        if(6 == f) {
          if(5 == (HEAP32[c >> 2] | 0)) {
            break b
          }
          g = 0;
          f = 64;
          break a
        }
      }while(0);
      f = 0 != (HEAP32[b + 1332 >> 2] | 0) ? 10 : 11;
      10 == f && (HEAP32[d >> 2] = 1, HEAP32[b + 1332 >> 2] = 0);
      h = _h264bsdCheckPpsId(a, e);
      f = 0 != (h | 0) ? 12 : 13;
      do {
        if(12 == f) {
          g = h;
          f = 64;
          break a
        }else {
          if(13 == f) {
            q = HEAP32[b + 148 + (HEAP32[e >> 2] << 2) >> 2];
            f = 0 == (q | 0) ? 18 : 14;
            c:do {
              if(14 == f) {
                if(0 == (HEAP32[b + 20 + (HEAP32[q + 4 >> 2] << 2) >> 2] | 0)) {
                  break c
                }
                f = 32 != (HEAP32[b + 8 >> 2] | 0) ? 16 : 19;
                d:do {
                  if(16 == f) {
                    if((HEAP32[q + 4 >> 2] | 0) == (HEAP32[b + 8 >> 2] | 0)) {
                      break d
                    }
                    if(5 != (HEAP32[c >> 2] | 0)) {
                      break c
                    }
                  }
                }while(0);
                g = HEAP32[b + 20 + (HEAP32[q + 4 >> 2] << 2) >> 2];
                f = (HEAP32[b + 1304 >> 2] | 0) != (HEAP32[c + 4 >> 2] | 0) ? 20 : 23;
                d:do {
                  if(20 == f) {
                    f = 0 == (HEAP32[b + 1304 >> 2] | 0) ? 22 : 21;
                    do {
                      if(21 == f && 0 != (HEAP32[c + 4 >> 2] | 0)) {
                        break d
                      }
                    }while(0);
                    HEAP32[d >> 2] = 1
                  }
                }while(0);
                f = 5 == (HEAP32[b + 1300 >> 2] | 0) ? 24 : 25;
                d:do {
                  if(24 == f) {
                    f = 5 != (HEAP32[c >> 2] | 0) ? 27 : 25;
                    break d
                  }
                }while(0);
                d:do {
                  if(25 == f) {
                    if(5 == (HEAP32[b + 1300 >> 2] | 0)) {
                      f = 28;
                      break d
                    }
                    f = 5 == (HEAP32[c >> 2] | 0) ? 27 : 28;
                    break d
                  }
                }while(0);
                27 == f && (HEAP32[d >> 2] = 1);
                h = _h264bsdCheckFrameNum(a, HEAP32[g + 12 >> 2], j);
                f = 0 != (h | 0) ? 29 : 30;
                do {
                  if(29 == f) {
                    g = 1;
                    f = 64;
                    break a
                  }else {
                    if(30 == f) {
                      f = (HEAP32[b + 1308 >> 2] | 0) != (HEAP32[j >> 2] | 0) ? 31 : 32;
                      31 == f && (HEAP32[b + 1308 >> 2] = HEAP32[j >> 2], HEAP32[d >> 2] = 1);
                      f = 5 == (HEAP32[c >> 2] | 0) ? 33 : 39;
                      do {
                        if(33 == f) {
                          h = _h264bsdCheckIdrPicId(a, HEAP32[g + 12 >> 2], HEAP32[c >> 2], l);
                          f = 0 != (h | 0) ? 34 : 35;
                          do {
                            if(34 == f) {
                              g = 1;
                              f = 64;
                              break a
                            }else {
                              if(35 == f) {
                                f = 5 == (HEAP32[b + 1300 >> 2] | 0) ? 36 : 38;
                                g:do {
                                  if(36 == f) {
                                    if((HEAP32[b + 1312 >> 2] | 0) == (HEAP32[l >> 2] | 0)) {
                                      break g
                                    }
                                    HEAP32[d >> 2] = 1
                                  }
                                }while(0);
                                HEAP32[b + 1312 >> 2] = HEAP32[l >> 2]
                              }
                            }
                          }while(0)
                        }
                      }while(0);
                      f = 0 == (HEAP32[g + 16 >> 2] | 0) ? 40 : 51;
                      do {
                        if(40 == f) {
                          h = _h264bsdCheckPicOrderCntLsb(a, g, HEAP32[c >> 2], k);
                          f = 0 != (h | 0) ? 41 : 42;
                          do {
                            if(41 == f) {
                              g = 1;
                              f = 64;
                              break a
                            }else {
                              if(42 == f) {
                                f = (HEAP32[b + 1316 >> 2] | 0) != (HEAP32[k >> 2] | 0) ? 43 : 44;
                                43 == f && (HEAP32[b + 1316 >> 2] = HEAP32[k >> 2], HEAP32[d >> 2] = 1);
                                f = 0 != (HEAP32[q + 8 >> 2] | 0) ? 45 : 50;
                                do {
                                  if(45 == f) {
                                    h = _h264bsdCheckDeltaPicOrderCntBottom(a, g, HEAP32[c >> 2], m);
                                    f = 0 != (h | 0) ? 46 : 47;
                                    do {
                                      if(46 == f) {
                                        g = h;
                                        f = 64;
                                        break a
                                      }else {
                                        47 == f && (f = (HEAP32[b + 1320 >> 2] | 0) != (HEAP32[m >> 2] | 0) ? 48 : 49, 48 == f && (HEAP32[b + 1320 >> 2] = HEAP32[m >> 2], HEAP32[d >> 2] = 1))
                                      }
                                    }while(0)
                                  }
                                }while(0)
                              }
                            }
                          }while(0)
                        }else {
                          if(51 == f) {
                            f = 1 == (HEAP32[g + 16 >> 2] | 0) ? 52 : 62;
                            f:do {
                              if(52 == f) {
                                if(0 != (HEAP32[g + 24 >> 2] | 0)) {
                                  break f
                                }
                                h = _h264bsdCheckDeltaPicOrderCnt(a, g, HEAP32[c >> 2], HEAP32[q + 8 >> 2], o);
                                f = 0 != (h | 0) ? 54 : 55;
                                do {
                                  if(54 == f) {
                                    g = h;
                                    f = 64;
                                    break a
                                  }else {
                                    55 == f && (f = (HEAP32[b + 1324 >> 2] | 0) != (HEAP32[o >> 2] | 0) ? 56 : 57, 56 == f && (HEAP32[b + 1324 >> 2] = HEAP32[o >> 2], HEAP32[d >> 2] = 1), f = 0 != (HEAP32[q + 8 >> 2] | 0) ? 58 : 61, 58 == f && (f = (HEAP32[b + 1328 >> 2] | 0) != (HEAP32[o + 4 >> 2] | 0) ? 59 : 60, 59 == f && (HEAP32[b + 1328 >> 2] = HEAP32[o + 4 >> 2], HEAP32[d >> 2] = 1)))
                                  }
                                }while(0)
                              }
                            }while(0)
                          }
                        }
                      }while(0);
                      a = c;
                      b += 1300;
                      for(c = a + 8;a < c;) {
                        HEAP8[b++] = HEAP8[a++]
                      }
                      g = 0;
                      f = 64;
                      break a
                    }
                  }
                }while(0)
              }
            }while(0);
            g = 65520;
            f = 64;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  4 == f && (HEAP32[d >> 2] = 1, g = 0);
  STACKTOP = e;
  return g
}
_h264bsdCheckAccessUnitBoundary.X = 1;
function _h264bsdValidParamSets(a) {
  var c, b, d;
  d = 0;
  a:for(;;) {
    c = 256 > d >>> 0 ? 2 : 8;
    do {
      if(2 == c) {
        c = 0 != (HEAP32[a + 148 + (d << 2) >> 2] | 0) ? 3 : 6;
        c:do {
          if(3 == c) {
            if(0 == (HEAP32[a + 20 + (HEAP32[HEAP32[a + 148 + (d << 2) >> 2] + 4 >> 2] << 2) >> 2] | 0)) {
              break c
            }
            if(0 != (_CheckPps(HEAP32[a + 148 + (d << 2) >> 2], HEAP32[a + 20 + (HEAP32[HEAP32[a + 148 + (d << 2) >> 2] + 4 >> 2] << 2) >> 2]) | 0)) {
              break c
            }
            b = 0;
            break a
          }
        }while(0);
        d += 1
      }else {
        if(8 == c) {
          b = 1;
          break a
        }
      }
    }while(0)
  }
  return b
}
_h264bsdValidParamSets.X = 1;
function _DecodeDispersedMap(a, c, b, d) {
  var e;
  e = b * d;
  d = 0;
  a:for(;;) {
    if(!(d >>> 0 < e >>> 0)) {
      break a
    }
    HEAP32[a + (d << 2) >> 2] = ((d >>> 0) % (b >>> 0) + (Math.floor((d >>> 0) / (b >>> 0)) * c >>> 1) >>> 0) % (c >>> 0);
    d += 1
  }
}
function _DecodeForegroundLeftOverMap(a, c, b, d, e, f) {
  var g, h, j, l;
  j = e * f;
  f = 0;
  a:for(;;) {
    if(!(f >>> 0 < j >>> 0)) {
      break a
    }
    HEAP32[a + (f << 2) >> 2] = c - 1;
    f += 1
  }
  c -= 1;
  a:for(;;) {
    f = c;
    c = f - 1;
    if(0 == (f | 0)) {
      break a
    }
    g = Math.floor((HEAPU32[b + (c << 2) >> 2] >>> 0) / (e >>> 0));
    j = (HEAPU32[b + (c << 2) >> 2] >>> 0) % (e >>> 0);
    f = Math.floor((HEAPU32[d + (c << 2) >> 2] >>> 0) / (e >>> 0));
    l = (HEAPU32[d + (c << 2) >> 2] >>> 0) % (e >>> 0);
    b:for(;;) {
      if(!(g >>> 0 <= f >>> 0)) {
        break b
      }
      h = j;
      c:for(;;) {
        if(!(h >>> 0 <= l >>> 0)) {
          break c
        }
        HEAP32[a + (g * e + h << 2) >> 2] = c;
        h += 1
      }
      g += 1
    }
  }
}
_DecodeForegroundLeftOverMap.X = 1;
function _DecodeBoxOutMap(a, c, b, d, e) {
  var f, g, h, j, l, k, m, o, q, p, n;
  g = d * e;
  f = 0;
  a:for(;;) {
    if(!(f >>> 0 < g >>> 0)) {
      break a
    }
    HEAP32[a + (f << 2) >> 2] = 1;
    f += 1
  }
  h = d - c >>> 1;
  j = e - c >>> 1;
  m = h;
  o = j;
  q = h;
  p = j;
  l = c - 1;
  k = c;
  g = 0;
  a:for(;;) {
    if(!(g >>> 0 < b >>> 0)) {
      break a
    }
    n = 1 == (HEAP32[a + (j * d + h << 2) >> 2] | 0) ? 1 : 0;
    f = 0 != (n | 0) ? 7 : 8;
    7 == f && (HEAP32[a + (j * d + h << 2) >> 2] = 0);
    f = -1 == (l | 0) ? 9 : 14;
    b:do {
      if(9 == f) {
        if((h | 0) != (m | 0)) {
          f = 14;
          break b
        }
        f = 0 < (m - 1 | 0) ? 11 : 12;
        if(11 == f) {
          var r = m - 1
        }else {
          12 == f && (r = 0)
        }
        h = m = r;
        l = 0;
        k = (c << 1) - 1;
        f = 36;
        break b
      }
    }while(0);
    do {
      if(14 == f) {
        f = 1 == (l | 0) ? 15 : 20;
        c:do {
          if(15 == f) {
            if((h | 0) != (q | 0)) {
              f = 20;
              break c
            }
            f = (q + 1 | 0) < (d - 1 | 0) ? 17 : 18;
            if(17 == f) {
              var s = q + 1
            }else {
              18 == f && (s = d - 1)
            }
            h = q = s;
            l = 0;
            k = 1 - (c << 1);
            f = 35;
            break c
          }
        }while(0);
        do {
          if(20 == f) {
            f = -1 == (k | 0) ? 21 : 26;
            d:do {
              if(21 == f) {
                if((j | 0) != (o | 0)) {
                  f = 26;
                  break d
                }
                f = 0 < (o - 1 | 0) ? 23 : 24;
                if(23 == f) {
                  var t = o - 1
                }else {
                  24 == f && (t = 0)
                }
                j = o = t;
                l = 1 - (c << 1);
                k = 0;
                f = 34;
                break d
              }
            }while(0);
            do {
              if(26 == f) {
                f = 1 == (k | 0) ? 27 : 32;
                e:do {
                  if(27 == f) {
                    if((j | 0) != (p | 0)) {
                      f = 32;
                      break e
                    }
                    f = (p + 1 | 0) < (e - 1 | 0) ? 29 : 30;
                    if(29 == f) {
                      var u = p + 1
                    }else {
                      30 == f && (u = e - 1)
                    }
                    j = p = u;
                    l = (c << 1) - 1;
                    k = 0;
                    f = 33;
                    break e
                  }
                }while(0);
                32 == f && (h += l, j += k)
              }
            }while(0)
          }
        }while(0)
      }
    }while(0);
    g += 0 != (n | 0) ? 1 : 0
  }
}
_DecodeBoxOutMap.X = 1;
function _DecodeRasterScanMap(a, c, b, d) {
  var e, f;
  f = 0;
  a:for(;;) {
    if(!(f >>> 0 < d >>> 0)) {
      break a
    }
    e = f >>> 0 < b >>> 0 ? 3 : 4;
    3 == e ? HEAP32[a + (f << 2) >> 2] = c : 4 == e && (HEAP32[a + (f << 2) >> 2] = 1 - c);
    f += 1
  }
}
function _DecodeWipeMap(a, c, b, d, e) {
  var f, g, h, j;
  h = j = 0;
  a:for(;;) {
    if(!(h >>> 0 < d >>> 0)) {
      break a
    }
    g = 0;
    b:for(;;) {
      if(!(g >>> 0 < e >>> 0)) {
        break b
      }
      f = j;
      j = f + 1;
      f = f >>> 0 < b >>> 0 ? 5 : 6;
      5 == f ? HEAP32[a + (g * d + h << 2) >> 2] = c : 6 == f && (HEAP32[a + (g * d + h << 2) >> 2] = 1 - c);
      g += 1
    }
    h += 1
  }
}
_DecodeWipeMap.X = 1;
function _h264bsdIntraPrediction(a, c, b, d, e, f) {
  var g = STACKTOP;
  STACKTOP += 72;
  var h, j = g + 40, l;
  _h264bsdGetNeighbourPels(b, g, j, d);
  d = 1 == (_h264bsdMbPartPredMode(HEAP32[a >> 2]) | 0) ? 1 : 4;
  a:do {
    if(1 == d) {
      l = _h264bsdIntra16x16Prediction(a, f, c + 328, g, j, e);
      d = 0 != (l | 0) ? 2 : 3;
      do {
        if(2 == d) {
          h = l;
          d = 12;
          break a
        }else {
          if(3 == d) {
            d = 7;
            break a
          }
        }
      }while(0)
    }else {
      if(4 == d) {
        l = _h264bsdIntra4x4Prediction(a, f, c, g, j, e);
        d = 0 != (l | 0) ? 5 : 6;
        do {
          if(5 == d) {
            h = l;
            d = 12;
            break a
          }else {
            if(6 == d) {
              d = 7;
              break a
            }
          }
        }while(0)
      }
    }
  }while(0);
  7 == d && (l = _h264bsdIntraChromaPrediction(a, f + 256, c + 1352, g + 21, j + 16, HEAP32[c + 140 >> 2], e), d = 0 != (l | 0) ? 8 : 9, 8 == d ? h = l : 9 == d && (d = 1 < HEAPU32[a + 196 >> 2] >>> 0 ? 10 : 11, 10 == d ? h = 0 : 11 == d && (_h264bsdWriteMacroblock(b, f), h = 0)));
  STACKTOP = g;
  return h
}
_h264bsdIntraPrediction.X = 1;
function _h264bsdGetNeighbourPels(a, c, b, d) {
  var e, f, g, h, j, l, k, m;
  e = b;
  b = 0 != (d | 0) ? 2 : 1;
  a:do {
    if(2 == b) {
      g = HEAP32[a + 4 >> 2];
      h = g * HEAP32[a + 8 >> 2];
      k = Math.floor((d >>> 0) / (g >>> 0));
      m = d - k * g;
      g <<= 4;
      j = HEAP32[a >> 2] + (k << 4) * g + (m << 4);
      b = 0 != (k | 0) ? 3 : 7;
      do {
        if(3 == b) {
          l = j + -(g + 1);
          f = 21;
          c:for(;;) {
            var o = f;
            f = o - 1;
            if(0 == (o | 0)) {
              break c
            }
            o = l;
            l = o + 1;
            var o = HEAP8[o], q = c, c = q + 1;
            HEAP8[q] = o
          }
        }
      }while(0);
      b = 0 != (m | 0) ? 8 : 13;
      do {
        if(8 == b) {
          j -= 1;
          f = 16;
          c:for(;;) {
            l = f;
            f = l - 1;
            if(0 == (l | 0)) {
              break c
            }
            l = HEAP8[j];
            o = e;
            e = o + 1;
            HEAP8[o] = l;
            j += g
          }
        }
      }while(0);
      g >>>= 1;
      j = HEAP32[a >> 2] + (h << 8) + (k << 3) * g + (m << 3);
      b = 0 != (k | 0) ? 14 : 21;
      do {
        if(14 == b) {
          l = j + -(g + 1);
          f = 9;
          c:for(;;) {
            k = f;
            f = k - 1;
            if(0 == (k | 0)) {
              break c
            }
            k = l;
            l = k + 1;
            k = HEAP8[k];
            o = c;
            c = o + 1;
            HEAP8[o] = k
          }
          l += (h << 6) - 9;
          f = 9;
          c:for(;;) {
            k = f;
            f = k - 1;
            if(0 == (k | 0)) {
              break c
            }
            k = l;
            l = k + 1;
            k = HEAP8[k];
            o = c;
            c = o + 1;
            HEAP8[o] = k
          }
        }
      }while(0);
      if(0 == (m | 0)) {
        break a
      }
      j -= 1;
      f = 8;
      b:for(;;) {
        m = f;
        f = m - 1;
        if(0 == (m | 0)) {
          break b
        }
        m = HEAP8[j];
        l = e;
        e = l + 1;
        HEAP8[l] = m;
        j += g
      }
      j += (h << 6) - (g << 3);
      f = 8;
      b:for(;;) {
        h = f;
        f = h - 1;
        if(0 == (h | 0)) {
          break b
        }
        h = HEAP8[j];
        m = e;
        e = m + 1;
        HEAP8[m] = h;
        j += g
      }
    }
  }while(0)
}
_h264bsdGetNeighbourPels.X = 1;
function _h264bsdIntra16x16Prediction(a, c, b, d, e, f) {
  var g, h, j, l, k;
  j = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 200 >> 2]);
  g = 0 != (j | 0) ? 1 : 4;
  a:do {
    if(1 == g) {
      if(0 == (f | 0)) {
        break a
      }
      if(2 != (_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 200 >> 2] >> 2]) | 0)) {
        break a
      }
      j = 0
    }
  }while(0);
  l = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 204 >> 2]);
  g = 0 != (l | 0) ? 5 : 8;
  a:do {
    if(5 == g) {
      if(0 == (f | 0)) {
        break a
      }
      if(2 != (_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 204 >> 2] >> 2]) | 0)) {
        break a
      }
      l = 0
    }
  }while(0);
  k = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 212 >> 2]);
  g = 0 != (k | 0) ? 9 : 12;
  a:do {
    if(9 == g) {
      if(0 == (f | 0)) {
        break a
      }
      if(2 != (_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 212 >> 2] >> 2]) | 0)) {
        break a
      }
      k = 0
    }
  }while(0);
  g = _h264bsdPredModeIntra16x16(HEAP32[a >> 2]);
  g = 0 == g ? 13 : 1 == g ? 16 : 2 == g ? 19 : 20;
  a:do {
    if(20 == g) {
      g = 0 != (j | 0) ? 21 : 23;
      b:do {
        if(21 == g) {
          if(0 == (l | 0)) {
            break b
          }
          if(0 == (k | 0)) {
            break b
          }
          _Intra16x16PlanePrediction(c, d + 1, e);
          g = 25;
          break a
        }
      }while(0);
      h = 1;
      g = 30;
      break a
    }else {
      if(13 == g) {
        g = 0 != (l | 0) ? 15 : 14;
        do {
          if(15 == g) {
            _Intra16x16VerticalPrediction(c, d + 1);
            g = 25;
            break a
          }else {
            if(14 == g) {
              h = 1;
              g = 30;
              break a
            }
          }
        }while(0)
      }else {
        if(16 == g) {
          g = 0 != (j | 0) ? 18 : 17;
          do {
            if(18 == g) {
              _Intra16x16HorizontalPrediction(c, e);
              g = 25;
              break a
            }else {
              if(17 == g) {
                h = 1;
                g = 30;
                break a
              }
            }
          }while(0)
        }else {
          if(19 == g) {
            _Intra16x16DcPrediction(c, d + 1, e, j, l);
            g = 25;
            break a
          }
        }
      }
    }
  }while(0);
  do {
    if(25 == g) {
      d = 0;
      b:for(;;) {
        if(!(16 > d >>> 0)) {
          break b
        }
        _h264bsdAddResidual(c, b + (d << 6), d);
        d += 1
      }
      h = 0
    }
  }while(0);
  return h
}
_h264bsdIntra16x16Prediction.X = 1;
function _Intra16x16VerticalPrediction(a, c) {
  var b, d, e;
  b = a;
  d = 0;
  a:for(;;) {
    if(!(16 > d >>> 0)) {
      break a
    }
    e = 0;
    b:for(;;) {
      if(!(16 > e >>> 0)) {
        break b
      }
      var f = HEAP8[c + e], g = b;
      b = g + 1;
      HEAP8[g] = f;
      e += 1
    }
    d += 1
  }
}
function _Intra16x16HorizontalPrediction(a, c) {
  var b, d, e;
  b = a;
  d = 0;
  a:for(;;) {
    if(!(16 > d >>> 0)) {
      break a
    }
    e = 0;
    b:for(;;) {
      if(!(16 > e >>> 0)) {
        break b
      }
      var f = HEAP8[c + d], g = b;
      b = g + 1;
      HEAP8[g] = f;
      e += 1
    }
    d += 1
  }
}
function _h264bsdIntra4x4Prediction(a, c, b, d, e, f) {
  var g = STACKTOP;
  STACKTOP += 52;
  var h, j, l, k, m = g + 8, o, q, p = g + 16, n = g + 28, r = g + 36, s, t, u;
  l = 0;
  a:for(;;) {
    h = 16 > l >>> 0 ? 2 : 58;
    do {
      if(2 == h) {
        t = _h264bsdNeighbour4x4BlockA(l);
        s = g;
        var v;
        h = t;
        u = s;
        for(v = h + 8;h < v;) {
          HEAP8[u++] = HEAP8[h++]
        }
        o = _h264bsdGetNeighbourMb(a, HEAP32[g >> 2]);
        s = _h264bsdIsNeighbourAvailable(a, o);
        h = 0 != (s | 0) ? 3 : 6;
        c:do {
          if(3 == h) {
            if(0 == (f | 0)) {
              break c
            }
            if(2 != (_h264bsdMbPartPredMode(HEAP32[o >> 2]) | 0)) {
              break c
            }
            s = 0
          }
        }while(0);
        q = _h264bsdNeighbour4x4BlockB(l);
        t = m;
        h = q;
        u = t;
        for(v = h + 8;h < v;) {
          HEAP8[u++] = HEAP8[h++]
        }
        q = _h264bsdGetNeighbourMb(a, HEAP32[m >> 2]);
        t = _h264bsdIsNeighbourAvailable(a, q);
        h = 0 != (t | 0) ? 7 : 10;
        c:do {
          if(7 == h) {
            if(0 == (f | 0)) {
              break c
            }
            if(2 != (_h264bsdMbPartPredMode(HEAP32[q >> 2]) | 0)) {
              break c
            }
            t = 0
          }
        }while(0);
        k = b;
        if(0 != (s | 0)) {
          h = 11
        }else {
          var w = 0;
          h = 12
        }
        11 == h && (w = 0 != (t | 0));
        k = _DetermineIntra4x4PredMode(k, w & 1, g, m, l, o, q);
        HEAP8[l + (a + 82)] = k & 255;
        o = _h264bsdNeighbour4x4BlockC(l);
        q = g;
        h = o;
        u = q;
        for(v = h + 8;h < v;) {
          HEAP8[u++] = HEAP8[h++]
        }
        o = _h264bsdGetNeighbourMb(a, HEAP32[g >> 2]);
        q = _h264bsdIsNeighbourAvailable(a, o);
        h = 0 != (q | 0) ? 13 : 16;
        c:do {
          if(13 == h) {
            if(0 == (f | 0)) {
              break c
            }
            if(2 != (_h264bsdMbPartPredMode(HEAP32[o >> 2]) | 0)) {
              break c
            }
            q = 0
          }
        }while(0);
        h = _h264bsdNeighbour4x4BlockD(l);
        u = o = g;
        for(v = h + 8;h < v;) {
          HEAP8[u++] = HEAP8[h++]
        }
        o = _h264bsdGetNeighbourMb(a, HEAP32[g >> 2]);
        u = _h264bsdIsNeighbourAvailable(a, o);
        h = 0 != (u | 0) ? 17 : 20;
        c:do {
          if(17 == h) {
            if(0 == (f | 0)) {
              break c
            }
            if(2 != (_h264bsdMbPartPredMode(HEAP32[o >> 2]) | 0)) {
              break c
            }
            u = 0
          }
        }while(0);
        _Get4x4NeighbourPels(p, n, c, d, e, l);
        h = 0 == k ? 21 : 1 == k ? 24 : 2 == k ? 27 : 3 == k ? 28 : 4 == k ? 33 : 5 == k ? 38 : 6 == k ? 43 : 7 == k ? 48 : 53;
        c:do {
          if(53 == h) {
            h = 0 != (s | 0) ? 55 : 54;
            do {
              if(55 == h) {
                _Intra4x4HorizontalUpPrediction(r, n + 1)
              }else {
                if(54 == h) {
                  j = 1;
                  break a
                }
              }
            }while(0)
          }else {
            if(21 == h) {
              h = 0 != (t | 0) ? 23 : 22;
              do {
                if(23 == h) {
                  _Intra4x4VerticalPrediction(r, p + 1)
                }else {
                  if(22 == h) {
                    j = 1;
                    break a
                  }
                }
              }while(0)
            }else {
              if(24 == h) {
                h = 0 != (s | 0) ? 26 : 25;
                do {
                  if(26 == h) {
                    _Intra4x4HorizontalPrediction(r, n + 1)
                  }else {
                    if(25 == h) {
                      j = 1;
                      break a
                    }
                  }
                }while(0)
              }else {
                if(27 == h) {
                  _Intra4x4DcPrediction(r, p + 1, n + 1, s, t)
                }else {
                  if(28 == h) {
                    h = 0 != (t | 0) ? 30 : 29;
                    do {
                      if(30 == h) {
                        h = 0 != (q | 0) ? 32 : 31, 31 == h && (k = HEAP8[p + 4], HEAP8[p + 8] = k, HEAP8[p + 7] = k, HEAP8[p + 6] = k, HEAP8[p + 5] = k), _Intra4x4DiagonalDownLeftPrediction(r, p + 1)
                      }else {
                        if(29 == h) {
                          j = 1;
                          break a
                        }
                      }
                    }while(0)
                  }else {
                    if(33 == h) {
                      h = 0 != (s | 0) ? 34 : 36;
                      d:do {
                        if(34 == h) {
                          if(0 == (t | 0)) {
                            break d
                          }
                          if(0 == (u | 0)) {
                            break d
                          }
                          _Intra4x4DiagonalDownRightPrediction(r, p + 1, n + 1);
                          break c
                        }
                      }while(0);
                      j = 1;
                      break a
                    }else {
                      if(38 == h) {
                        h = 0 != (s | 0) ? 39 : 41;
                        d:do {
                          if(39 == h) {
                            if(0 == (t | 0)) {
                              break d
                            }
                            if(0 == (u | 0)) {
                              break d
                            }
                            _Intra4x4VerticalRightPrediction(r, p + 1, n + 1);
                            break c
                          }
                        }while(0);
                        j = 1;
                        break a
                      }else {
                        if(43 == h) {
                          h = 0 != (s | 0) ? 44 : 46;
                          d:do {
                            if(44 == h) {
                              if(0 == (t | 0)) {
                                break d
                              }
                              if(0 == (u | 0)) {
                                break d
                              }
                              _Intra4x4HorizontalDownPrediction(r, p + 1, n + 1);
                              break c
                            }
                          }while(0);
                          j = 1;
                          break a
                        }else {
                          if(48 == h) {
                            h = 0 != (t | 0) ? 50 : 49;
                            do {
                              if(50 == h) {
                                h = 0 != (q | 0) ? 52 : 51, 51 == h && (k = HEAP8[p + 4], HEAP8[p + 8] = k, HEAP8[p + 7] = k, HEAP8[p + 6] = k, HEAP8[p + 5] = k), _Intra4x4VerticalLeftPrediction(r, p + 1)
                              }else {
                                if(49 == h) {
                                  j = 1;
                                  break a
                                }
                              }
                            }while(0)
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
        _Write4x4To16x16(c, r, l);
        _h264bsdAddResidual(c, b + 328 + (l << 6), l);
        l += 1
      }else {
        if(58 == h) {
          j = 0;
          break a
        }
      }
    }while(0)
  }
  STACKTOP = g;
  return j
}
_h264bsdIntra4x4Prediction.X = 1;
function _h264bsdIntraChromaPrediction(a, c, b, d, e, f, g) {
  var h, j, l, k, m, o;
  j = e;
  k = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 200 >> 2]);
  e = 0 != (k | 0) ? 1 : 4;
  a:do {
    if(1 == e) {
      if(0 == (g | 0)) {
        break a
      }
      if(2 != (_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 200 >> 2] >> 2]) | 0)) {
        break a
      }
      k = 0
    }
  }while(0);
  m = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 204 >> 2]);
  e = 0 != (m | 0) ? 5 : 8;
  a:do {
    if(5 == e) {
      if(0 == (g | 0)) {
        break a
      }
      if(2 != (_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 204 >> 2] >> 2]) | 0)) {
        break a
      }
      m = 0
    }
  }while(0);
  o = _h264bsdIsNeighbourAvailable(a, HEAP32[a + 212 >> 2]);
  e = 0 != (o | 0) ? 9 : 12;
  a:do {
    if(9 == e) {
      if(0 == (g | 0)) {
        break a
      }
      if(2 != (_h264bsdMbPartPredMode(HEAP32[HEAP32[a + 212 >> 2] >> 2]) | 0)) {
        break a
      }
      o = 0
    }
  }while(0);
  g = 0;
  l = 16;
  a:for(;;) {
    e = 2 > g >>> 0 ? 14 : 33;
    do {
      if(14 == e) {
        e = 0 == f ? 15 : 1 == f ? 16 : 2 == f ? 19 : 22;
        c:do {
          if(22 == e) {
            e = 0 != (k | 0) ? 23 : 25;
            d:do {
              if(23 == e) {
                if(0 == (m | 0)) {
                  break d
                }
                if(0 == (o | 0)) {
                  break d
                }
                _IntraChromaPlanePrediction(c, d + 1, j);
                break c
              }
            }while(0);
            h = 1;
            break a
          }else {
            if(15 == e) {
              _IntraChromaDcPrediction(c, d + 1, j, k, m)
            }else {
              if(16 == e) {
                e = 0 != (k | 0) ? 18 : 17;
                do {
                  if(18 == e) {
                    _IntraChromaHorizontalPrediction(c, j)
                  }else {
                    if(17 == e) {
                      h = 1;
                      break a
                    }
                  }
                }while(0)
              }else {
                if(19 == e) {
                  e = 0 != (m | 0) ? 21 : 20;
                  do {
                    if(21 == e) {
                      _IntraChromaVerticalPrediction(c, d + 1)
                    }else {
                      if(20 == e) {
                        h = 1;
                        break a
                      }
                    }
                  }while(0)
                }
              }
            }
          }
        }while(0);
        a = 0;
        c:for(;;) {
          if(!(4 > a >>> 0)) {
            break c
          }
          _h264bsdAddResidual(c, b + (a << 6), l);
          a += 1;
          l += 1
        }
        c += 64;
        d += 9;
        j += 8;
        b += 256;
        g += 1
      }else {
        if(33 == e) {
          h = 0;
          break a
        }
      }
    }while(0)
  }
  return h
}
_h264bsdIntraChromaPrediction.X = 1;
function _Intra16x16DcPrediction(a, c, b, d, e) {
  var f, g, h;
  f = 0 != (d | 0) ? 1 : 7;
  a:do {
    if(1 == f) {
      if(0 == (e | 0)) {
        f = 7;
        break a
      }
      h = g = 0;
      b:for(;;) {
        if(!(16 > g >>> 0)) {
          break b
        }
        h += (HEAPU8[c + g] & 255) + (HEAPU8[b + g] & 255);
        g += 1
      }
      h = h + 16 >>> 5;
      f = 22;
      break a
    }
  }while(0);
  do {
    if(7 == f) {
      f = 0 != (d | 0) ? 8 : 13;
      do {
        if(8 == f) {
          h = g = 0;
          c:for(;;) {
            if(!(16 > g >>> 0)) {
              break c
            }
            h += HEAPU8[b + g] & 255;
            g += 1
          }
          h = h + 8 >>> 4
        }else {
          if(13 == f) {
            f = 0 != (e | 0) ? 14 : 19;
            do {
              if(14 == f) {
                h = g = 0;
                d:for(;;) {
                  if(!(16 > g >>> 0)) {
                    break d
                  }
                  h += HEAPU8[c + g] & 255;
                  g += 1
                }
                h = h + 8 >>> 4
              }else {
                19 == f && (h = 128)
              }
            }while(0)
          }
        }
      }while(0)
    }
  }while(0);
  g = 0;
  a:for(;;) {
    if(!(256 > g >>> 0)) {
      break a
    }
    HEAP8[a + g] = h & 255;
    g += 1
  }
}
_Intra16x16DcPrediction.X = 1;
function _Intra16x16PlanePrediction(a, c, b) {
  var d, e, f, g, h;
  e = (HEAPU8[c + 15] & 255) + (HEAPU8[b + 15] & 255) << 4;
  f = d = 0;
  a:for(;;) {
    if(!(8 > d >>> 0)) {
      break a
    }
    f += (d + 1) * ((HEAPU8[d + (c + 8)] & 255) - (HEAPU8[c + (6 - d)] & 255));
    d += 1
  }
  f = 5 * f + 32 >> 6;
  g = d = 0;
  a:for(;;) {
    if(!(7 > d >>> 0)) {
      break a
    }
    g += (d + 1) * ((HEAPU8[d + (b + 8)] & 255) - (HEAPU8[b + (6 - d)] & 255));
    d += 1
  }
  g += (d + 1) * ((HEAPU8[d + (b + 8)] & 255) - (HEAPU8[c - 1] & 255));
  g = 5 * g + 32 >> 6;
  d = 0;
  a:for(;;) {
    if(!(16 > d >>> 0)) {
      break a
    }
    b = 0;
    b:for(;;) {
      if(!(16 > b >>> 0)) {
        break b
      }
      h = e + f * (b - 7) + g * (d - 7) + 16 >> 5;
      c = 0 > (h | 0) ? 13 : 14;
      if(13 == c) {
        var j = 0
      }else {
        if(14 == c) {
          c = 255 < (h | 0) ? 15 : 16;
          if(15 == c) {
            var l = 255
          }else {
            16 == c && (l = h)
          }
          j = l
        }
      }
      HEAP8[a + ((d << 4) + b)] = j & 255;
      b += 1
    }
    d += 1
  }
}
_Intra16x16PlanePrediction.X = 1;
function _h264bsdAddResidual(a, c, b) {
  var d, e, f, g, h, j, l, k, m, o, q;
  d = c;
  q = _h264bsdClip + 512;
  c = 16777215 == (HEAP32[d >> 2] | 0) ? 1 : 2;
  a:do {
    if(1 != c && 2 == c) {
      c = 16 > b >>> 0 ? 3 : 4;
      3 == c ? (h = 16, f = HEAP32[_h264bsdBlockX + (b << 2) >> 2], g = HEAP32[_h264bsdBlockY + (b << 2) >> 2]) : 4 == c && (h = 8, f = HEAP32[_h264bsdBlockX + ((b & 3) << 2) >> 2], g = HEAP32[_h264bsdBlockY + ((b & 3) << 2) >> 2]);
      o = a + g * h + f;
      e = 4;
      for(;;) {
        if(0 == (e | 0)) {
          break a
        }
        j = d;
        d = j + 4;
        j = HEAP32[j >> 2];
        l = HEAPU8[o] & 255;
        k = d;
        d = k + 4;
        k = HEAP32[k >> 2];
        m = HEAPU8[o + 1] & 255;
        HEAP8[o] = HEAP8[q + (j + l)];
        j = d;
        d = j + 4;
        j = HEAP32[j >> 2];
        l = HEAPU8[o + 2] & 255;
        HEAP8[o + 1] = HEAP8[q + (k + m)];
        k = d;
        d = k + 4;
        k = HEAP32[k >> 2];
        m = HEAPU8[o + 3] & 255;
        j = HEAPU8[q + (j + l)] & 255;
        k = HEAPU8[q + (k + m)] & 255;
        HEAP8[o + 2] = j & 255;
        HEAP8[o + 3] = k & 255;
        o += h;
        e -= 1
      }
    }
  }while(0)
}
_h264bsdAddResidual.X = 1;
function _DetermineIntra4x4PredMode(a, c, b, d, e, f, g) {
  var h, j, c = 0 != (c | 0) ? 2 : 1;
  if(2 == c) {
    c = 0 == (_h264bsdMbPartPredMode(HEAP32[f >> 2]) | 0) ? 3 : 4;
    3 == c ? h = HEAPU8[f + 82 + (HEAPU8[b + 4] & 255)] & 255 : 4 == c && (h = 2);
    f = g;
    c = 0 == (_h264bsdMbPartPredMode(HEAP32[f >> 2]) | 0) ? 6 : 7;
    6 == c ? j = HEAPU8[f + 82 + (HEAPU8[d + 4] & 255)] & 255 : 7 == c && (j = 2);
    c = h >>> 0 < j >>> 0 ? 9 : 10;
    if(9 == c) {
      var l = h
    }else {
      10 == c && (l = j)
    }
    h = l
  }else {
    1 == c && (h = 2)
  }
  c = 0 != (HEAP32[a + 12 + (e << 2) >> 2] | 0) ? 17 : 13;
  13 == c && (c = HEAPU32[a + 76 + (e << 2) >> 2] >>> 0 < h >>> 0 ? 14 : 15, 14 == c ? h = HEAP32[a + 76 + (e << 2) >> 2] : 15 == c && (h = HEAP32[a + 76 + (e << 2) >> 2] + 1));
  return h
}
_DetermineIntra4x4PredMode.X = 1;
function _Get4x4NeighbourPels(a, c, b, d, e, f) {
  var g, h, j;
  h = HEAP32[_h264bsdBlockX + (f << 2) >> 2];
  f = HEAP32[_h264bsdBlockY + (f << 2) >> 2];
  g = 0 == (h | 0) ? 1 : 2;
  1 == g ? (g = HEAP8[e + f], j = HEAP8[f + (e + 1)], HEAP8[c + 1] = g, HEAP8[c + 2] = j, g = HEAP8[f + (e + 2)], j = HEAP8[f + (e + 3)], HEAP8[c + 3] = g, HEAP8[c + 4] = j) : 2 == g && (g = HEAP8[b + ((f << 4) + h - 1)], j = HEAP8[b + ((f << 4) + h - 1 + 16)], HEAP8[c + 1] = g, HEAP8[c + 2] = j, g = HEAP8[b + ((f << 4) + h - 1 + 32)], j = HEAP8[b + ((f << 4) + h - 1 + 48)], HEAP8[c + 3] = g, HEAP8[c + 4] = j);
  g = 0 == (f | 0) ? 4 : 5;
  4 == g ? (g = HEAP8[d + h], j = HEAP8[d + h], HEAP8[c] = g, HEAP8[a] = j, g = HEAP8[h + (d + 1)], j = HEAP8[h + (d + 2)], HEAP8[a + 1] = g, HEAP8[a + 2] = j, g = HEAP8[h + (d + 3)], j = HEAP8[h + (d + 4)], HEAP8[a + 3] = g, HEAP8[a + 4] = j, g = HEAP8[h + (d + 5)], j = HEAP8[h + (d + 6)], HEAP8[a + 5] = g, HEAP8[a + 6] = j, g = HEAP8[h + (d + 7)], j = HEAP8[h + (d + 8)], HEAP8[a + 7] = g, HEAP8[a + 8] = j) : 5 == g && (g = HEAP8[b + ((f - 1 << 4) + h)], j = HEAP8[b + ((f - 1 << 4) + h + 1)], HEAP8[a + 
  1] = g, HEAP8[a + 2] = j, g = HEAP8[b + ((f - 1 << 4) + h + 2)], j = HEAP8[b + ((f - 1 << 4) + h + 3)], HEAP8[a + 3] = g, HEAP8[a + 4] = j, g = HEAP8[b + ((f - 1 << 4) + h + 4)], j = HEAP8[b + ((f - 1 << 4) + h + 5)], HEAP8[a + 5] = g, HEAP8[a + 6] = j, g = HEAP8[b + ((f - 1 << 4) + h + 6)], j = HEAP8[b + ((f - 1 << 4) + h + 7)], HEAP8[a + 7] = g, HEAP8[a + 8] = j, g = 0 == (h | 0) ? 6 : 7, 6 == g ? (b = HEAP8[e + (f - 1)], HEAP8[a] = b, HEAP8[c] = b) : 7 == g && (b = HEAP8[b + ((f - 1 << 4) + 
  h - 1)], HEAP8[a] = b, HEAP8[c] = b))
}
_Get4x4NeighbourPels.X = 1;
function _Intra4x4VerticalPrediction(a, c) {
  var b, d;
  b = HEAP8[c];
  d = HEAP8[c + 1];
  HEAP8[a + 12] = b;
  HEAP8[a + 8] = b;
  HEAP8[a + 4] = b;
  HEAP8[a] = b;
  HEAP8[a + 13] = d;
  HEAP8[a + 9] = d;
  HEAP8[a + 5] = d;
  HEAP8[a + 1] = d;
  b = HEAP8[c + 2];
  d = HEAP8[c + 3];
  HEAP8[a + 14] = b;
  HEAP8[a + 10] = b;
  HEAP8[a + 6] = b;
  HEAP8[a + 2] = b;
  HEAP8[a + 15] = d;
  HEAP8[a + 11] = d;
  HEAP8[a + 7] = d;
  HEAP8[a + 3] = d
}
_Intra4x4VerticalPrediction.X = 1;
function _Intra4x4HorizontalPrediction(a, c) {
  var b, d;
  b = HEAP8[c];
  d = HEAP8[c + 1];
  HEAP8[a + 3] = b;
  HEAP8[a + 2] = b;
  HEAP8[a + 1] = b;
  HEAP8[a] = b;
  HEAP8[a + 7] = d;
  HEAP8[a + 6] = d;
  HEAP8[a + 5] = d;
  HEAP8[a + 4] = d;
  b = HEAP8[c + 2];
  d = HEAP8[c + 3];
  HEAP8[a + 11] = b;
  HEAP8[a + 10] = b;
  HEAP8[a + 9] = b;
  HEAP8[a + 8] = b;
  HEAP8[a + 15] = d;
  HEAP8[a + 14] = d;
  HEAP8[a + 13] = d;
  HEAP8[a + 12] = d
}
_Intra4x4HorizontalPrediction.X = 1;
function _Intra4x4DcPrediction(a, c, b, d, e) {
  var f, g, h, j, l;
  f = 0 != (d | 0) ? 1 : 3;
  a:do {
    if(1 == f) {
      if(0 == (e | 0)) {
        f = 3;
        break a
      }
      f = HEAP8[c];
      h = HEAP8[c + 1];
      j = HEAP8[c + 2];
      l = HEAP8[c + 3];
      g = (f & 255) + (h & 255) + (j & 255) + (l & 255);
      f = HEAP8[b];
      h = HEAP8[b + 1];
      j = HEAP8[b + 2];
      l = HEAP8[b + 3];
      g += (f & 255) + (h & 255) + (j & 255) + (l & 255);
      g = g + 4 >>> 3;
      f = 10;
      break a
    }
  }while(0);
  3 == f && (f = 0 != (d | 0) ? 4 : 5, 4 == f ? (f = HEAP8[b], h = HEAP8[b + 1], j = HEAP8[b + 2], l = HEAP8[b + 3], g = (f & 255) + (h & 255) + (j & 255) + (l & 255) + 2 >> 2) : 5 == f && (f = 0 != (e | 0) ? 6 : 7, 6 == f ? (f = HEAP8[c], h = HEAP8[c + 1], j = HEAP8[c + 2], l = HEAP8[c + 3], g = (f & 255) + (h & 255) + (j & 255) + (l & 255) + 2 >> 2) : 7 == f && (g = 128)));
  c = g & 255;
  HEAP8[a + 15] = c;
  HEAP8[a + 14] = c;
  HEAP8[a + 13] = c;
  HEAP8[a + 12] = c;
  HEAP8[a + 11] = c;
  HEAP8[a + 10] = c;
  HEAP8[a + 9] = c;
  HEAP8[a + 8] = c;
  HEAP8[a + 7] = c;
  HEAP8[a + 6] = c;
  HEAP8[a + 5] = c;
  HEAP8[a + 4] = c;
  HEAP8[a + 3] = c;
  HEAP8[a + 2] = c;
  HEAP8[a + 1] = c;
  HEAP8[a] = c
}
_Intra4x4DcPrediction.X = 1;
function _Intra4x4DiagonalDownLeftPrediction(a, c) {
  HEAP8[a] = (HEAPU8[c] & 255) + ((HEAPU8[c + 1] & 255) << 1) + (HEAPU8[c + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 1] = (HEAPU8[c + 1] & 255) + ((HEAPU8[c + 2] & 255) << 1) + (HEAPU8[c + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 4] = (HEAPU8[c + 1] & 255) + ((HEAPU8[c + 2] & 255) << 1) + (HEAPU8[c + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 2] = (HEAPU8[c + 2] & 255) + ((HEAPU8[c + 3] & 255) << 1) + (HEAPU8[c + 4] & 255) + 2 >> 2 & 255;
  HEAP8[a + 5] = (HEAPU8[c + 2] & 255) + ((HEAPU8[c + 3] & 255) << 1) + (HEAPU8[c + 4] & 255) + 2 >> 2 & 255;
  HEAP8[a + 8] = (HEAPU8[c + 2] & 255) + ((HEAPU8[c + 3] & 255) << 1) + (HEAPU8[c + 4] & 255) + 2 >> 2 & 255;
  HEAP8[a + 3] = (HEAPU8[c + 3] & 255) + ((HEAPU8[c + 4] & 255) << 1) + (HEAPU8[c + 5] & 255) + 2 >> 2 & 255;
  HEAP8[a + 6] = (HEAPU8[c + 3] & 255) + ((HEAPU8[c + 4] & 255) << 1) + (HEAPU8[c + 5] & 255) + 2 >> 2 & 255;
  HEAP8[a + 9] = (HEAPU8[c + 3] & 255) + ((HEAPU8[c + 4] & 255) << 1) + (HEAPU8[c + 5] & 255) + 2 >> 2 & 255;
  HEAP8[a + 12] = (HEAPU8[c + 3] & 255) + ((HEAPU8[c + 4] & 255) << 1) + (HEAPU8[c + 5] & 255) + 2 >> 2 & 255;
  HEAP8[a + 7] = (HEAPU8[c + 4] & 255) + ((HEAPU8[c + 5] & 255) << 1) + (HEAPU8[c + 6] & 255) + 2 >> 2 & 255;
  HEAP8[a + 10] = (HEAPU8[c + 4] & 255) + ((HEAPU8[c + 5] & 255) << 1) + (HEAPU8[c + 6] & 255) + 2 >> 2 & 255;
  HEAP8[a + 13] = (HEAPU8[c + 4] & 255) + ((HEAPU8[c + 5] & 255) << 1) + (HEAPU8[c + 6] & 255) + 2 >> 2 & 255;
  HEAP8[a + 11] = (HEAPU8[c + 5] & 255) + ((HEAPU8[c + 6] & 255) << 1) + (HEAPU8[c + 7] & 255) + 2 >> 2 & 255;
  HEAP8[a + 14] = (HEAPU8[c + 5] & 255) + ((HEAPU8[c + 6] & 255) << 1) + (HEAPU8[c + 7] & 255) + 2 >> 2 & 255;
  HEAP8[a + 15] = (HEAPU8[c + 6] & 255) + 3 * (HEAPU8[c + 7] & 255) + 2 >> 2 & 255
}
_Intra4x4DiagonalDownLeftPrediction.X = 1;
function _Intra4x4DiagonalDownRightPrediction(a, c, b) {
  HEAP8[a] = (HEAPU8[c] & 255) + ((HEAPU8[c - 1] & 255) << 1) + (HEAPU8[b] & 255) + 2 >> 2 & 255;
  HEAP8[a + 5] = (HEAPU8[c] & 255) + ((HEAPU8[c - 1] & 255) << 1) + (HEAPU8[b] & 255) + 2 >> 2 & 255;
  HEAP8[a + 10] = (HEAPU8[c] & 255) + ((HEAPU8[c - 1] & 255) << 1) + (HEAPU8[b] & 255) + 2 >> 2 & 255;
  HEAP8[a + 15] = (HEAPU8[c] & 255) + ((HEAPU8[c - 1] & 255) << 1) + (HEAPU8[b] & 255) + 2 >> 2 & 255;
  HEAP8[a + 1] = (HEAPU8[c - 1] & 255) + ((HEAPU8[c] & 255) << 1) + (HEAPU8[c + 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 6] = (HEAPU8[c - 1] & 255) + ((HEAPU8[c] & 255) << 1) + (HEAPU8[c + 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 11] = (HEAPU8[c - 1] & 255) + ((HEAPU8[c] & 255) << 1) + (HEAPU8[c + 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 2] = (HEAPU8[c] & 255) + ((HEAPU8[c + 1] & 255) << 1) + (HEAPU8[c + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 7] = (HEAPU8[c] & 255) + ((HEAPU8[c + 1] & 255) << 1) + (HEAPU8[c + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 3] = (HEAPU8[c + 1] & 255) + ((HEAPU8[c + 2] & 255) << 1) + (HEAPU8[c + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 4] = (HEAPU8[b - 1] & 255) + ((HEAPU8[b] & 255) << 1) + (HEAPU8[b + 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 9] = (HEAPU8[b - 1] & 255) + ((HEAPU8[b] & 255) << 1) + (HEAPU8[b + 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 14] = (HEAPU8[b - 1] & 255) + ((HEAPU8[b] & 255) << 1) + (HEAPU8[b + 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 8] = (HEAPU8[b] & 255) + ((HEAPU8[b + 1] & 255) << 1) + (HEAPU8[b + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 13] = (HEAPU8[b] & 255) + ((HEAPU8[b + 1] & 255) << 1) + (HEAPU8[b + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 12] = (HEAPU8[b + 1] & 255) + ((HEAPU8[b + 2] & 255) << 1) + (HEAPU8[b + 3] & 255) + 2 >> 2 & 255
}
_Intra4x4DiagonalDownRightPrediction.X = 1;
function _Intra4x4VerticalRightPrediction(a, c, b) {
  HEAP8[a] = (HEAPU8[c - 1] & 255) + (HEAPU8[c] & 255) + 1 >> 1 & 255;
  HEAP8[a + 9] = (HEAPU8[c - 1] & 255) + (HEAPU8[c] & 255) + 1 >> 1 & 255;
  HEAP8[a + 5] = (HEAPU8[c - 1] & 255) + ((HEAPU8[c] & 255) << 1) + (HEAPU8[c + 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 14] = (HEAPU8[c - 1] & 255) + ((HEAPU8[c] & 255) << 1) + (HEAPU8[c + 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 4] = (HEAPU8[c] & 255) + ((HEAPU8[c - 1] & 255) << 1) + (HEAPU8[b] & 255) + 2 >> 2 & 255;
  HEAP8[a + 13] = (HEAPU8[c] & 255) + ((HEAPU8[c - 1] & 255) << 1) + (HEAPU8[b] & 255) + 2 >> 2 & 255;
  HEAP8[a + 1] = (HEAPU8[c] & 255) + (HEAPU8[c + 1] & 255) + 1 >> 1 & 255;
  HEAP8[a + 10] = (HEAPU8[c] & 255) + (HEAPU8[c + 1] & 255) + 1 >> 1 & 255;
  HEAP8[a + 6] = (HEAPU8[c] & 255) + ((HEAPU8[c + 1] & 255) << 1) + (HEAPU8[c + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 15] = (HEAPU8[c] & 255) + ((HEAPU8[c + 1] & 255) << 1) + (HEAPU8[c + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 2] = (HEAPU8[c + 1] & 255) + (HEAPU8[c + 2] & 255) + 1 >> 1 & 255;
  HEAP8[a + 11] = (HEAPU8[c + 1] & 255) + (HEAPU8[c + 2] & 255) + 1 >> 1 & 255;
  HEAP8[a + 7] = (HEAPU8[c + 1] & 255) + ((HEAPU8[c + 2] & 255) << 1) + (HEAPU8[c + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 3] = (HEAPU8[c + 2] & 255) + (HEAPU8[c + 3] & 255) + 1 >> 1 & 255;
  HEAP8[a + 8] = (HEAPU8[b + 1] & 255) + ((HEAPU8[b] & 255) << 1) + (HEAPU8[b - 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 12] = (HEAPU8[b + 2] & 255) + ((HEAPU8[b + 1] & 255) << 1) + (HEAPU8[b] & 255) + 2 >> 2 & 255
}
_Intra4x4VerticalRightPrediction.X = 1;
function _Intra4x4HorizontalDownPrediction(a, c, b) {
  HEAP8[a] = (HEAPU8[b - 1] & 255) + (HEAPU8[b] & 255) + 1 >> 1 & 255;
  HEAP8[a + 6] = (HEAPU8[b - 1] & 255) + (HEAPU8[b] & 255) + 1 >> 1 & 255;
  HEAP8[a + 5] = (HEAPU8[b - 1] & 255) + ((HEAPU8[b] & 255) << 1) + (HEAPU8[b + 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 11] = (HEAPU8[b - 1] & 255) + ((HEAPU8[b] & 255) << 1) + (HEAPU8[b + 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 4] = (HEAPU8[b] & 255) + (HEAPU8[b + 1] & 255) + 1 >> 1 & 255;
  HEAP8[a + 10] = (HEAPU8[b] & 255) + (HEAPU8[b + 1] & 255) + 1 >> 1 & 255;
  HEAP8[a + 9] = (HEAPU8[b] & 255) + ((HEAPU8[b + 1] & 255) << 1) + (HEAPU8[b + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 15] = (HEAPU8[b] & 255) + ((HEAPU8[b + 1] & 255) << 1) + (HEAPU8[b + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 8] = (HEAPU8[b + 1] & 255) + (HEAPU8[b + 2] & 255) + 1 >> 1 & 255;
  HEAP8[a + 14] = (HEAPU8[b + 1] & 255) + (HEAPU8[b + 2] & 255) + 1 >> 1 & 255;
  HEAP8[a + 13] = (HEAPU8[b + 1] & 255) + ((HEAPU8[b + 2] & 255) << 1) + (HEAPU8[b + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 12] = (HEAPU8[b + 2] & 255) + (HEAPU8[b + 3] & 255) + 1 >> 1 & 255;
  HEAP8[a + 1] = (HEAPU8[c] & 255) + ((HEAPU8[c - 1] & 255) << 1) + (HEAPU8[b] & 255) + 2 >> 2 & 255;
  HEAP8[a + 7] = (HEAPU8[c] & 255) + ((HEAPU8[c - 1] & 255) << 1) + (HEAPU8[b] & 255) + 2 >> 2 & 255;
  HEAP8[a + 2] = (HEAPU8[c + 1] & 255) + ((HEAPU8[c] & 255) << 1) + (HEAPU8[c - 1] & 255) + 2 >> 2 & 255;
  HEAP8[a + 3] = (HEAPU8[c + 2] & 255) + ((HEAPU8[c + 1] & 255) << 1) + (HEAPU8[c] & 255) + 2 >> 2 & 255
}
_Intra4x4HorizontalDownPrediction.X = 1;
function _Intra4x4VerticalLeftPrediction(a, c) {
  HEAP8[a] = (HEAPU8[c] & 255) + (HEAPU8[c + 1] & 255) + 1 >> 1 & 255;
  HEAP8[a + 1] = (HEAPU8[c + 1] & 255) + (HEAPU8[c + 2] & 255) + 1 >> 1 & 255;
  HEAP8[a + 2] = (HEAPU8[c + 2] & 255) + (HEAPU8[c + 3] & 255) + 1 >> 1 & 255;
  HEAP8[a + 3] = (HEAPU8[c + 3] & 255) + (HEAPU8[c + 4] & 255) + 1 >> 1 & 255;
  HEAP8[a + 4] = (HEAPU8[c] & 255) + ((HEAPU8[c + 1] & 255) << 1) + (HEAPU8[c + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 5] = (HEAPU8[c + 1] & 255) + ((HEAPU8[c + 2] & 255) << 1) + (HEAPU8[c + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 6] = (HEAPU8[c + 2] & 255) + ((HEAPU8[c + 3] & 255) << 1) + (HEAPU8[c + 4] & 255) + 2 >> 2 & 255;
  HEAP8[a + 7] = (HEAPU8[c + 3] & 255) + ((HEAPU8[c + 4] & 255) << 1) + (HEAPU8[c + 5] & 255) + 2 >> 2 & 255;
  HEAP8[a + 8] = (HEAPU8[c + 1] & 255) + (HEAPU8[c + 2] & 255) + 1 >> 1 & 255;
  HEAP8[a + 9] = (HEAPU8[c + 2] & 255) + (HEAPU8[c + 3] & 255) + 1 >> 1 & 255;
  HEAP8[a + 10] = (HEAPU8[c + 3] & 255) + (HEAPU8[c + 4] & 255) + 1 >> 1 & 255;
  HEAP8[a + 11] = (HEAPU8[c + 4] & 255) + (HEAPU8[c + 5] & 255) + 1 >> 1 & 255;
  HEAP8[a + 12] = (HEAPU8[c + 1] & 255) + ((HEAPU8[c + 2] & 255) << 1) + (HEAPU8[c + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 13] = (HEAPU8[c + 2] & 255) + ((HEAPU8[c + 3] & 255) << 1) + (HEAPU8[c + 4] & 255) + 2 >> 2 & 255;
  HEAP8[a + 14] = (HEAPU8[c + 3] & 255) + ((HEAPU8[c + 4] & 255) << 1) + (HEAPU8[c + 5] & 255) + 2 >> 2 & 255;
  HEAP8[a + 15] = (HEAPU8[c + 4] & 255) + ((HEAPU8[c + 5] & 255) << 1) + (HEAPU8[c + 6] & 255) + 2 >> 2 & 255
}
_Intra4x4VerticalLeftPrediction.X = 1;
function _Intra4x4HorizontalUpPrediction(a, c) {
  HEAP8[a] = (HEAPU8[c] & 255) + (HEAPU8[c + 1] & 255) + 1 >> 1 & 255;
  HEAP8[a + 1] = (HEAPU8[c] & 255) + ((HEAPU8[c + 1] & 255) << 1) + (HEAPU8[c + 2] & 255) + 2 >> 2 & 255;
  HEAP8[a + 2] = (HEAPU8[c + 1] & 255) + (HEAPU8[c + 2] & 255) + 1 >> 1 & 255;
  HEAP8[a + 3] = (HEAPU8[c + 1] & 255) + ((HEAPU8[c + 2] & 255) << 1) + (HEAPU8[c + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 4] = (HEAPU8[c + 1] & 255) + (HEAPU8[c + 2] & 255) + 1 >> 1 & 255;
  HEAP8[a + 5] = (HEAPU8[c + 1] & 255) + ((HEAPU8[c + 2] & 255) << 1) + (HEAPU8[c + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 6] = (HEAPU8[c + 2] & 255) + (HEAPU8[c + 3] & 255) + 1 >> 1 & 255;
  HEAP8[a + 7] = (HEAPU8[c + 2] & 255) + 3 * (HEAPU8[c + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 8] = (HEAPU8[c + 2] & 255) + (HEAPU8[c + 3] & 255) + 1 >> 1 & 255;
  HEAP8[a + 9] = (HEAPU8[c + 2] & 255) + 3 * (HEAPU8[c + 3] & 255) + 2 >> 2 & 255;
  HEAP8[a + 10] = HEAP8[c + 3];
  HEAP8[a + 11] = HEAP8[c + 3];
  HEAP8[a + 12] = HEAP8[c + 3];
  HEAP8[a + 13] = HEAP8[c + 3];
  HEAP8[a + 14] = HEAP8[c + 3];
  HEAP8[a + 15] = HEAP8[c + 3]
}
_Intra4x4HorizontalUpPrediction.X = 1;
function _Write4x4To16x16(a, c, b) {
  a += (HEAP32[_h264bsdBlockY + (b << 2) >> 2] << 4) + HEAP32[_h264bsdBlockX + (b << 2) >> 2];
  HEAP32[a >> 2] = HEAP32[c >> 2];
  c += 4;
  HEAP32[a + 16 >> 2] = HEAP32[c >> 2];
  c += 4;
  HEAP32[a + 32 >> 2] = HEAP32[c >> 2];
  HEAP32[a + 48 >> 2] = HEAP32[c + 4 >> 2]
}
_Write4x4To16x16.X = 1;
function _IntraChromaDcPrediction(a, c, b, d, e) {
  var f, g, h;
  f = 0 != (d | 0) ? 1 : 3;
  a:do {
    if(1 == f) {
      if(0 == (e | 0)) {
        f = 3;
        break a
      }
      g = (HEAPU8[c] & 255) + (HEAPU8[c + 1] & 255) + (HEAPU8[c + 2] & 255) + (HEAPU8[c + 3] & 255) + (HEAPU8[b] & 255) + (HEAPU8[b + 1] & 255) + (HEAPU8[b + 2] & 255) + (HEAPU8[b + 3] & 255);
      g = g + 4 >>> 3;
      h = (HEAPU8[c + 4] & 255) + (HEAPU8[c + 5] & 255) + (HEAPU8[c + 6] & 255) + (HEAPU8[c + 7] & 255) + 2 >> 2;
      f = 10;
      break a
    }
  }while(0);
  3 == f && (f = 0 != (e | 0) ? 4 : 5, 4 == f ? (g = (HEAPU8[c] & 255) + (HEAPU8[c + 1] & 255) + (HEAPU8[c + 2] & 255) + (HEAPU8[c + 3] & 255) + 2 >> 2, h = (HEAPU8[c + 4] & 255) + (HEAPU8[c + 5] & 255) + (HEAPU8[c + 6] & 255) + (HEAPU8[c + 7] & 255) + 2 >> 2) : 5 == f && (f = 0 != (d | 0) ? 6 : 7, 6 == f ? h = g = (HEAPU8[b] & 255) + (HEAPU8[b + 1] & 255) + (HEAPU8[b + 2] & 255) + (HEAPU8[b + 3] & 255) + 2 >> 2 : 7 == f && (g = h = 128)));
  f = 4;
  a:for(;;) {
    var j = f;
    f = j - 1;
    if(0 == (j | 0)) {
      break a
    }
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
    HEAP8[j] = h & 255
  }
  f = 0 != (d | 0) ? 14 : 18;
  14 == f ? (g = (HEAPU8[b + 4] & 255) + (HEAPU8[b + 5] & 255) + (HEAPU8[b + 6] & 255) + (HEAPU8[b + 7] & 255) + 2 >> 2, f = 0 != (e | 0) ? 15 : 16, 15 == f ? (h = (HEAPU8[c + 4] & 255) + (HEAPU8[c + 5] & 255) + (HEAPU8[c + 6] & 255) + (HEAPU8[c + 7] & 255) + (HEAPU8[b + 4] & 255) + (HEAPU8[b + 5] & 255) + (HEAPU8[b + 6] & 255) + (HEAPU8[b + 7] & 255), h = h + 4 >>> 3) : 16 == f && (h = g)) : 18 == f && (f = 0 != (e | 0) ? 19 : 20, 19 == f ? (g = (HEAPU8[c] & 255) + (HEAPU8[c + 1] & 255) + (HEAPU8[c + 
  2] & 255) + (HEAPU8[c + 3] & 255) + 2 >> 2, h = (HEAPU8[c + 4] & 255) + (HEAPU8[c + 5] & 255) + (HEAPU8[c + 6] & 255) + (HEAPU8[c + 7] & 255) + 2 >> 2) : 20 == f && (g = h = 128));
  f = 4;
  a:for(;;) {
    c = f;
    f = c - 1;
    if(0 == (c | 0)) {
      break a
    }
    c = a;
    a = c + 1;
    HEAP8[c] = g & 255;
    c = a;
    a = c + 1;
    HEAP8[c] = g & 255;
    c = a;
    a = c + 1;
    HEAP8[c] = g & 255;
    c = a;
    a = c + 1;
    HEAP8[c] = g & 255;
    c = a;
    a = c + 1;
    HEAP8[c] = h & 255;
    c = a;
    a = c + 1;
    HEAP8[c] = h & 255;
    c = a;
    a = c + 1;
    HEAP8[c] = h & 255;
    c = a;
    a = c + 1;
    HEAP8[c] = h & 255
  }
}
_IntraChromaDcPrediction.X = 1;
function _IntraChromaHorizontalPrediction(a, c) {
  var b, d, e;
  b = a;
  d = c;
  e = 8;
  a:for(;;) {
    var f = e;
    e = f - 1;
    if(0 == (f | 0)) {
      break a
    }
    var f = HEAP8[d], g = b;
    b = g + 1;
    HEAP8[g] = f;
    f = HEAP8[d];
    g = b;
    b = g + 1;
    HEAP8[g] = f;
    f = HEAP8[d];
    g = b;
    b = g + 1;
    HEAP8[g] = f;
    f = HEAP8[d];
    g = b;
    b = g + 1;
    HEAP8[g] = f;
    f = HEAP8[d];
    g = b;
    b = g + 1;
    HEAP8[g] = f;
    f = HEAP8[d];
    g = b;
    b = g + 1;
    HEAP8[g] = f;
    f = HEAP8[d];
    g = b;
    b = g + 1;
    HEAP8[g] = f;
    f = d;
    d = f + 1;
    f = HEAP8[f];
    g = b;
    b = g + 1;
    HEAP8[g] = f
  }
}
_IntraChromaHorizontalPrediction.X = 1;
function _IntraChromaVerticalPrediction(a, c) {
  var b, d, e;
  b = a;
  d = c;
  e = 8;
  a:for(;;) {
    var f = e;
    e = f - 1;
    if(0 == (f | 0)) {
      break a
    }
    HEAP8[b] = HEAP8[d];
    HEAP8[b + 8] = HEAP8[d];
    HEAP8[b + 16] = HEAP8[d];
    HEAP8[b + 24] = HEAP8[d];
    HEAP8[b + 32] = HEAP8[d];
    HEAP8[b + 40] = HEAP8[d];
    HEAP8[b + 48] = HEAP8[d];
    f = d;
    d = f + 1;
    HEAP8[b + 56] = HEAP8[f];
    b += 1
  }
}
_IntraChromaVerticalPrediction.X = 1;
function _IntraChromaPlanePrediction(a, c, b) {
  var d, e, f, g;
  g = _h264bsdClip + 512;
  d = (HEAPU8[c + 7] & 255) + (HEAPU8[b + 7] & 255) << 4;
  e = (HEAPU8[c + 4] & 255) - (HEAPU8[c + 2] & 255) + ((HEAPU8[c + 5] & 255) - (HEAPU8[c + 1] & 255) << 1) + 3 * ((HEAPU8[c + 6] & 255) - (HEAPU8[c] & 255)) + ((HEAPU8[c + 7] & 255) - (HEAPU8[c - 1] & 255) << 2);
  e = 17 * e + 16 >> 5;
  b = (HEAPU8[b + 4] & 255) - (HEAPU8[b + 2] & 255) + ((HEAPU8[b + 5] & 255) - (HEAPU8[b + 1] & 255) << 1) + 3 * ((HEAPU8[b + 6] & 255) - (HEAPU8[b] & 255)) + ((HEAPU8[b + 7] & 255) - (HEAPU8[c - 1] & 255) << 2);
  b = 17 * b + 16 >> 5;
  d = d - 3 * b + 16;
  c = 8;
  a:for(;;) {
    f = c;
    c = f - 1;
    if(0 == (f | 0)) {
      break a
    }
    f = d - 3 * e;
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
    d += b
  }
}
_IntraChromaPlanePrediction.X = 1;
function _h264bsdInterPrediction(a, c, b, d, e, f) {
  var g = STACKTOP;
  STACKTOP += 24;
  var h, j, l, k, m, o;
  m = Math.floor((d >>> 0) / (HEAPU32[e + 4 >> 2] >>> 0));
  o = d - m * HEAP32[e + 4 >> 2];
  m <<= 4;
  o <<= 4;
  HEAP32[g + 4 >> 2] = HEAP32[e + 4 >> 2];
  HEAP32[g + 8 >> 2] = HEAP32[e + 8 >> 2];
  h = HEAP32[a >> 2];
  h = 0 == h || 1 == h ? 1 : 2 == h ? 4 : 3 == h ? 7 : 10;
  a:do {
    if(10 == h) {
      h = 0 != (_MvPrediction8x8(a, c + 176, b) | 0) ? 11 : 12;
      do {
        if(11 == h) {
          j = 1;
          h = 28;
          break a
        }else {
          if(12 == h) {
            b = 0;
            c:for(;;) {
              if(!(4 > b >>> 0)) {
                break c
              }
              HEAP32[g >> 2] = HEAP32[a + 116 + (b << 2) >> 2];
              h = _h264bsdSubMbPartMode(HEAP32[c + 176 + (b << 2) >> 2]);
              l = 0 != (b & 1 | 0) ? 8 : 0;
              k = 2 > b >>> 0 ? 0 : 8;
              h = 0 == h ? 15 : 1 == h ? 16 : 2 == h ? 17 : 18;
              18 == h ? (_h264bsdPredictSamples(f, a + 132 + (b << 2 << 2), g, o, m, l, k, 4, 4), _h264bsdPredictSamples(f, a + 132 + (b << 2 << 2) + 4, g, o, m, l + 4, k, 4, 4), _h264bsdPredictSamples(f, a + 132 + (b << 2 << 2) + 8, g, o, m, l, k + 4, 4, 4), _h264bsdPredictSamples(f, a + 132 + (b << 2 << 2) + 12, g, o, m, l + 4, k + 4, 4, 4)) : 15 == h ? _h264bsdPredictSamples(f, a + 132 + (b << 2 << 2), g, o, m, l, k, 8, 8) : 16 == h ? (_h264bsdPredictSamples(f, a + 132 + (b << 2 << 2), g, o, m, 
              l, k, 8, 4), _h264bsdPredictSamples(f, a + 132 + (b << 2 << 2) + 8, g, o, m, l, k + 4, 8, 4)) : 17 == h && (_h264bsdPredictSamples(f, a + 132 + (b << 2 << 2), g, o, m, l, k, 4, 8), _h264bsdPredictSamples(f, a + 132 + (b << 2 << 2) + 4, g, o, m, l + 4, k, 4, 8));
              b += 1
            }
            h = 22;
            break a
          }
        }
      }while(0)
    }else {
      if(1 == h) {
        h = 0 != (_MvPrediction16x16(a, c + 12, b) | 0) ? 2 : 3;
        do {
          if(2 == h) {
            j = 1;
            h = 28;
            break a
          }else {
            if(3 == h) {
              HEAP32[g >> 2] = HEAP32[a + 116 >> 2];
              _h264bsdPredictSamples(f, a + 132, g, o, m, 0, 0, 16, 16);
              h = 22;
              break a
            }
          }
        }while(0)
      }else {
        if(4 == h) {
          h = 0 != (_MvPrediction16x8(a, c + 12, b) | 0) ? 5 : 6;
          do {
            if(5 == h) {
              j = 1;
              h = 28;
              break a
            }else {
              if(6 == h) {
                HEAP32[g >> 2] = HEAP32[a + 116 >> 2];
                _h264bsdPredictSamples(f, a + 132, g, o, m, 0, 0, 16, 8);
                HEAP32[g >> 2] = HEAP32[a + 124 >> 2];
                _h264bsdPredictSamples(f, a + 164, g, o, m, 0, 8, 16, 8);
                h = 22;
                break a
              }
            }
          }while(0)
        }else {
          if(7 == h) {
            h = 0 != (_MvPrediction8x16(a, c + 12, b) | 0) ? 8 : 9;
            do {
              if(8 == h) {
                j = 1;
                h = 28;
                break a
              }else {
                if(9 == h) {
                  HEAP32[g >> 2] = HEAP32[a + 116 >> 2];
                  _h264bsdPredictSamples(f, a + 132, g, o, m, 0, 0, 8, 16);
                  HEAP32[g >> 2] = HEAP32[a + 120 >> 2];
                  _h264bsdPredictSamples(f, a + 148, g, o, m, 8, 0, 8, 16);
                  h = 22;
                  break a
                }
              }
            }while(0)
          }
        }
      }
    }
  }while(0);
  22 == h && (h = 1 < HEAPU32[a + 196 >> 2] >>> 0 ? 23 : 24, 23 == h ? j = 0 : 24 == h && (h = 0 != (HEAP32[a >> 2] | 0) ? 25 : 26, 25 == h ? _h264bsdWriteOutputBlocks(e, d, f, c + 328) : 26 == h && _h264bsdWriteMacroblock(e, f), j = 0));
  STACKTOP = g;
  return j
}
_h264bsdInterPrediction.X = 1;
function _MvPrediction16x16(a, c, b) {
  var d = STACKTOP;
  STACKTOP += 44;
  var e, f, g = d + 4, h = d + 8, j, l, k;
  j = HEAP32[c + 132 >> 2];
  _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 200 >> 2], h, 5);
  _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 12, 10);
  l = h + 8;
  k = h + 20;
  e = 0 == (HEAP32[a >> 2] | 0) ? 1 : 8;
  a:do {
    if(1 == e) {
      e = 0 != (HEAP32[h >> 2] | 0) ? 2 : 7;
      b:do {
        if(2 == e) {
          if(0 == (HEAP32[h + 12 >> 2] | 0)) {
            break b
          }
          e = 0 == (HEAP32[h + 4 >> 2] | 0) ? 4 : 5;
          do {
            if(4 == e && 0 == (HEAP32[l >> 2] | 0)) {
              break b
            }
          }while(0);
          if(0 != (HEAP32[h + 16 >> 2] | 0)) {
            e = 8;
            break a
          }
          if(0 != (HEAP32[k >> 2] | 0)) {
            e = 8;
            break a
          }
        }
      }while(0);
      HEAP16[d + 2 >> 1] = 0;
      HEAP16[d >> 1] = 0;
      e = 15;
      break a
    }
  }while(0);
  a:do {
    if(8 == e) {
      l = d;
      e = c + 148;
      for(k = e + 4;e < k;) {
        HEAP8[l++] = HEAP8[e++]
      }
      _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 208 >> 2], h + 24, 10);
      e = 0 != (HEAP32[h + 24 >> 2] | 0) ? 10 : 9;
      9 == e && _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 212 >> 2], h + 24, 15);
      _GetPredictionMv(g, h, j);
      HEAP16[d >> 1] = (HEAP16[d >> 1] << 16 >> 16) + (HEAP16[g >> 1] << 16 >> 16) & 65535;
      HEAP16[d + 2 >> 1] = (HEAP16[d + 2 >> 1] << 16 >> 16) + (HEAP16[g + 2 >> 1] << 16 >> 16) & 65535;
      e = 16384 <= (HEAP16[d >> 1] << 16 >> 16) + 8192 >>> 0 ? 11 : 12;
      do {
        if(11 == e) {
          f = 1;
          e = 18;
          break a
        }else {
          if(12 == e) {
            e = 4096 <= (HEAP16[d + 2 >> 1] << 16 >> 16) + 2048 >>> 0 ? 13 : 14;
            do {
              if(13 == e) {
                f = 1;
                e = 18;
                break a
              }else {
                if(14 == e) {
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
  if(15 == e) {
    if(c = _h264bsdGetRefPicData(b, j), e = 0 == (c | 0) ? 16 : 17, 16 == e) {
      f = 1
    }else {
      if(17 == e) {
        e = d;
        l = a + 192;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 192;
        l = a + 188;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 188;
        l = a + 184;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 184;
        l = a + 180;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 180;
        l = a + 176;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 176;
        l = a + 172;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 172;
        l = a + 168;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 168;
        l = a + 164;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 164;
        l = a + 160;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 160;
        l = a + 156;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 156;
        l = a + 152;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 152;
        l = a + 148;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 148;
        l = a + 144;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 144;
        l = a + 140;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 140;
        l = a + 136;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        e = a + 136;
        l = a + 132;
        for(k = e + 4;e < k;) {
          HEAP8[l++] = HEAP8[e++]
        }
        HEAP32[a + 100 >> 2] = j;
        HEAP32[a + 104 >> 2] = j;
        HEAP32[a + 108 >> 2] = j;
        HEAP32[a + 112 >> 2] = j;
        HEAP32[a + 116 >> 2] = c;
        HEAP32[a + 120 >> 2] = c;
        HEAP32[a + 124 >> 2] = c;
        HEAP32[a + 128 >> 2] = c;
        f = 0
      }
    }
  }
  STACKTOP = d;
  return f
}
_MvPrediction16x16.X = 1;
function _MvPrediction16x8(a, c, b) {
  var d = STACKTOP;
  STACKTOP += 44;
  var e, f, g = d + 4, h = d + 8, j, l, k, m;
  e = c + 148;
  k = d;
  for(m = e + 4;e < m;) {
    HEAP8[k++] = HEAP8[e++]
  }
  j = HEAP32[c + 132 >> 2];
  _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 12, 10);
  e = (HEAP32[h + 16 >> 2] | 0) == (j | 0) ? 1 : 2;
  if(1 == e) {
    e = h + 20;
    k = g;
    for(m = e + 4;e < m;) {
      HEAP8[k++] = HEAP8[e++]
    }
  }else {
    2 == e && (_GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 200 >> 2], h, 5), _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 208 >> 2], h + 24, 10), e = 0 != (HEAP32[h + 24 >> 2] | 0) ? 4 : 3, 3 == e && _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 212 >> 2], h + 24, 15), _GetPredictionMv(g, h, j))
  }
  HEAP16[d >> 1] = (HEAP16[d >> 1] << 16 >> 16) + (HEAP16[g >> 1] << 16 >> 16) & 65535;
  HEAP16[d + 2 >> 1] = (HEAP16[d + 2 >> 1] << 16 >> 16) + (HEAP16[g + 2 >> 1] << 16 >> 16) & 65535;
  e = 16384 <= (HEAP16[d >> 1] << 16 >> 16) + 8192 >>> 0 ? 6 : 7;
  if(6 == e) {
    f = 1
  }else {
    if(7 == e) {
      if(e = 4096 <= (HEAP16[d + 2 >> 1] << 16 >> 16) + 2048 >>> 0 ? 8 : 9, 8 == e) {
        f = 1
      }else {
        if(9 == e) {
          if(l = _h264bsdGetRefPicData(b, j), e = 0 == (l | 0) ? 10 : 11, 10 == e) {
            f = 1
          }else {
            if(11 == e) {
              e = d;
              k = a + 160;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 160;
              k = a + 156;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 156;
              k = a + 152;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 152;
              k = a + 148;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 148;
              k = a + 144;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 144;
              k = a + 140;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 140;
              k = a + 136;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 136;
              k = a + 132;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              HEAP32[a + 100 >> 2] = j;
              HEAP32[a + 104 >> 2] = j;
              HEAP32[a + 116 >> 2] = l;
              HEAP32[a + 120 >> 2] = l;
              e = c + 152;
              k = d;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              j = HEAP32[c + 136 >> 2];
              _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 200 >> 2], h, 13);
              e = (HEAP32[h + 4 >> 2] | 0) == (j | 0) ? 12 : 13;
              if(12 == e) {
                e = h + 8;
                k = g;
                for(m = e + 4;e < m;) {
                  HEAP8[k++] = HEAP8[e++]
                }
              }else {
                if(13 == e) {
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
              HEAP16[d >> 1] = (HEAP16[d >> 1] << 16 >> 16) + (HEAP16[g >> 1] << 16 >> 16) & 65535;
              HEAP16[d + 2 >> 1] = (HEAP16[d + 2 >> 1] << 16 >> 16) + (HEAP16[g + 2 >> 1] << 16 >> 16) & 65535;
              e = 16384 <= (HEAP16[d >> 1] << 16 >> 16) + 8192 >>> 0 ? 15 : 16;
              if(15 == e) {
                f = 1
              }else {
                if(16 == e) {
                  if(e = 4096 <= (HEAP16[d + 2 >> 1] << 16 >> 16) + 2048 >>> 0 ? 17 : 18, 17 == e) {
                    f = 1
                  }else {
                    if(18 == e) {
                      if(l = _h264bsdGetRefPicData(b, j), e = 0 == (l | 0) ? 19 : 20, 19 == e) {
                        f = 1
                      }else {
                        if(20 == e) {
                          e = d;
                          k = a + 192;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 192;
                          k = a + 188;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 188;
                          k = a + 184;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 184;
                          k = a + 180;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 180;
                          k = a + 176;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 176;
                          k = a + 172;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 172;
                          k = a + 168;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 168;
                          k = a + 164;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
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
  STACKTOP = d;
  return f
}
_MvPrediction16x8.X = 1;
function _MvPrediction8x16(a, c, b) {
  var d = STACKTOP;
  STACKTOP += 44;
  var e, f, g = d + 4, h = d + 8, j, l, k, m;
  e = c + 148;
  k = d;
  for(m = e + 4;e < m;) {
    HEAP8[k++] = HEAP8[e++]
  }
  j = HEAP32[c + 132 >> 2];
  _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 200 >> 2], h, 5);
  e = (HEAP32[h + 4 >> 2] | 0) == (j | 0) ? 1 : 2;
  if(1 == e) {
    e = h + 8;
    k = g;
    for(m = e + 4;e < m;) {
      HEAP8[k++] = HEAP8[e++]
    }
  }else {
    2 == e && (_GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 12, 10), _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 24, 14), e = 0 != (HEAP32[h + 24 >> 2] | 0) ? 4 : 3, 3 == e && _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 212 >> 2], h + 24, 15), _GetPredictionMv(g, h, j))
  }
  HEAP16[d >> 1] = (HEAP16[d >> 1] << 16 >> 16) + (HEAP16[g >> 1] << 16 >> 16) & 65535;
  HEAP16[d + 2 >> 1] = (HEAP16[d + 2 >> 1] << 16 >> 16) + (HEAP16[g + 2 >> 1] << 16 >> 16) & 65535;
  e = 16384 <= (HEAP16[d >> 1] << 16 >> 16) + 8192 >>> 0 ? 6 : 7;
  if(6 == e) {
    f = 1
  }else {
    if(7 == e) {
      if(e = 4096 <= (HEAP16[d + 2 >> 1] << 16 >> 16) + 2048 >>> 0 ? 8 : 9, 8 == e) {
        f = 1
      }else {
        if(9 == e) {
          if(l = _h264bsdGetRefPicData(b, j), e = 0 == (l | 0) ? 10 : 11, 10 == e) {
            f = 1
          }else {
            if(11 == e) {
              e = d;
              k = a + 176;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 176;
              k = a + 172;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 172;
              k = a + 168;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 168;
              k = a + 164;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 164;
              k = a + 144;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 144;
              k = a + 140;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 140;
              k = a + 136;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              e = a + 136;
              k = a + 132;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              HEAP32[a + 100 >> 2] = j;
              HEAP32[a + 108 >> 2] = j;
              HEAP32[a + 116 >> 2] = l;
              HEAP32[a + 124 >> 2] = l;
              e = c + 152;
              k = d;
              for(m = e + 4;e < m;) {
                HEAP8[k++] = HEAP8[e++]
              }
              j = HEAP32[c + 136 >> 2];
              _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 208 >> 2], h + 24, 10);
              e = 0 != (HEAP32[h + 24 >> 2] | 0) ? 13 : 12;
              12 == e && _GetInterNeighbour(HEAP32[a + 4 >> 2], HEAP32[a + 204 >> 2], h + 24, 11);
              e = (HEAP32[h + 28 >> 2] | 0) == (j | 0) ? 14 : 15;
              if(14 == e) {
                e = h + 32;
                k = g;
                for(m = e + 4;e < m;) {
                  HEAP8[k++] = HEAP8[e++]
                }
              }else {
                if(15 == e) {
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
              HEAP16[d >> 1] = (HEAP16[d >> 1] << 16 >> 16) + (HEAP16[g >> 1] << 16 >> 16) & 65535;
              HEAP16[d + 2 >> 1] = (HEAP16[d + 2 >> 1] << 16 >> 16) + (HEAP16[g + 2 >> 1] << 16 >> 16) & 65535;
              e = 16384 <= (HEAP16[d >> 1] << 16 >> 16) + 8192 >>> 0 ? 17 : 18;
              if(17 == e) {
                f = 1
              }else {
                if(18 == e) {
                  if(e = 4096 <= (HEAP16[d + 2 >> 1] << 16 >> 16) + 2048 >>> 0 ? 19 : 20, 19 == e) {
                    f = 1
                  }else {
                    if(20 == e) {
                      if(l = _h264bsdGetRefPicData(b, j), e = 0 == (l | 0) ? 21 : 22, 21 == e) {
                        f = 1
                      }else {
                        if(22 == e) {
                          e = d;
                          k = a + 192;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 192;
                          k = a + 188;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 188;
                          k = a + 184;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 184;
                          k = a + 180;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 180;
                          k = a + 160;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 160;
                          k = a + 156;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 156;
                          k = a + 152;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
                          e = a + 152;
                          k = a + 148;
                          for(m = e + 4;e < m;) {
                            HEAP8[k++] = HEAP8[e++]
                          }
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
  STACKTOP = d;
  return f
}
_MvPrediction8x16.X = 1;
function _MvPrediction8x8(a, c, b) {
  var d, e, f, g, h;
  f = 0;
  a:for(;;) {
    d = 4 > f >>> 0 ? 2 : 12;
    do {
      if(2 == d) {
        h = _h264bsdNumSubMbPart(HEAP32[c + (f << 2) >> 2]);
        HEAP32[a + 100 + (f << 2) >> 2] = HEAP32[c + 16 + (f << 2) >> 2];
        d = _h264bsdGetRefPicData(b, HEAP32[c + 16 + (f << 2) >> 2]);
        HEAP32[a + 116 + (f << 2) >> 2] = d;
        d = 0 == (HEAP32[a + 116 + (f << 2) >> 2] | 0) ? 3 : 4;
        do {
          if(3 == d) {
            e = 1;
            break a
          }else {
            if(4 == d) {
              g = 0;
              for(;;) {
                d = g >>> 0 < h >>> 0 ? 6 : 10;
                do {
                  if(6 == d) {
                    d = 0 != (_MvPrediction(a, c, f, g) | 0) ? 7 : 8;
                    do {
                      if(7 == d) {
                        e = 1;
                        break a
                      }else {
                        8 == d && (g += 1)
                      }
                    }while(0)
                  }else {
                    if(10 == d) {
                      f += 1;
                      continue a
                    }
                  }
                }while(0)
              }
            }
          }
        }while(0)
      }else {
        if(12 == d) {
          e = 0;
          break a
        }
      }
    }while(0)
  }
  return e
}
_MvPrediction8x8.X = 1;
function _MedianFilter(a, c, b) {
  var d, e, f;
  d = e = f = a;
  a = (c | 0) > (d | 0) ? 1 : 2;
  1 == a ? d = c : 2 == a && 3 == ((c | 0) < (e | 0) ? 3 : 4) && (e = c);
  a = (b | 0) > (d | 0) ? 6 : 7;
  6 == a ? f = d : 7 == a && (a = (b | 0) < (e | 0) ? 8 : 9, 8 == a ? f = e : 9 == a && (f = b));
  return f
}
function _GetInterNeighbour(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 4;
  var f, g;
  HEAP32[b >> 2] = 0;
  HEAP32[b + 4 >> 2] = -1;
  HEAP16[b + 10 >> 1] = 0;
  HEAP16[b + 8 >> 1] = 0;
  f = 0 != (c | 0) ? 1 : 5;
  a:do {
    if(1 == f) {
      if((a | 0) != (HEAP32[c + 4 >> 2] | 0)) {
        break a
      }
      g = HEAP32[c >> 2];
      HEAP32[b >> 2] = 1;
      f = 5 >= g >>> 0 ? 3 : 4;
      if(3 == f) {
        var h = e, j;
        g = c + 132 + (d << 2);
        for(j = g + 4;g < j;) {
          HEAP8[h++] = HEAP8[g++]
        }
        g = HEAP32[c + 100 + (d >>> 2 << 2) >> 2];
        HEAP32[b + 4 >> 2] = g;
        g = e;
        h = b + 8;
        for(j = g + 4;g < j;) {
          HEAP8[h++] = HEAP8[g++]
        }
      }
    }
  }while(0);
  STACKTOP = e
}
_GetInterNeighbour.X = 1;
function _MvPrediction(a, c, b, d) {
  var e = STACKTOP;
  STACKTOP += 44;
  var f, g, h = e + 4, j, l, k = e + 8;
  j = c + 32 + (b << 4) + (d << 2);
  f = e;
  for(l = j + 4;j < l;) {
    HEAP8[f++] = HEAP8[j++]
  }
  j = _h264bsdSubMbPartMode(HEAP32[c + (b << 2) >> 2]);
  c = HEAP32[c + 16 + (b << 2) >> 2];
  f = _N_A_SUB_PART + (b << 7) + (j << 5) + (d << 3);
  l = _h264bsdGetNeighbourMb(a, HEAP32[f >> 2]);
  _GetInterNeighbour(HEAP32[a + 4 >> 2], l, k, HEAPU8[f + 4] & 255);
  f = _N_B_SUB_PART + (b << 7) + (j << 5) + (d << 3);
  l = _h264bsdGetNeighbourMb(a, HEAP32[f >> 2]);
  _GetInterNeighbour(HEAP32[a + 4 >> 2], l, k + 12, HEAPU8[f + 4] & 255);
  f = _N_C_SUB_PART + (b << 7) + (j << 5) + (d << 3);
  l = _h264bsdGetNeighbourMb(a, HEAP32[f >> 2]);
  _GetInterNeighbour(HEAP32[a + 4 >> 2], l, k + 24, HEAPU8[f + 4] & 255);
  f = 0 != (HEAP32[k + 24 >> 2] | 0) ? 2 : 1;
  1 == f && (f = _N_D_SUB_PART + (b << 7) + (j << 5) + (d << 3), l = _h264bsdGetNeighbourMb(a, HEAP32[f >> 2]), _GetInterNeighbour(HEAP32[a + 4 >> 2], l, k + 24, HEAPU8[f + 4] & 255));
  _GetPredictionMv(h, k, c);
  HEAP16[e >> 1] = (HEAP16[e >> 1] << 16 >> 16) + (HEAP16[h >> 1] << 16 >> 16) & 65535;
  HEAP16[e + 2 >> 1] = (HEAP16[e + 2 >> 1] << 16 >> 16) + (HEAP16[h + 2 >> 1] << 16 >> 16) & 65535;
  f = 16384 <= (HEAP16[e >> 1] << 16 >> 16) + 8192 >>> 0 ? 3 : 4;
  if(3 == f) {
    g = 1
  }else {
    if(4 == f) {
      if(f = 4096 <= (HEAP16[e + 2 >> 1] << 16 >> 16) + 2048 >>> 0 ? 5 : 6, 5 == f) {
        g = 1
      }else {
        if(6 == f) {
          f = 0 == j ? 7 : 1 == j ? 8 : 2 == j ? 9 : 3 == j ? 10 : 11;
          if(7 == f) {
            j = e;
            f = a + 132 + (b << 2 << 2);
            for(l = j + 4;j < l;) {
              HEAP8[f++] = HEAP8[j++]
            }
            j = e;
            f = a + 132 + ((b << 2) + 1 << 2);
            for(l = j + 4;j < l;) {
              HEAP8[f++] = HEAP8[j++]
            }
            j = e;
            f = a + 132 + ((b << 2) + 2 << 2);
            for(l = j + 4;j < l;) {
              HEAP8[f++] = HEAP8[j++]
            }
            j = e;
            f = a + 132 + ((b << 2) + 3 << 2);
            for(l = j + 4;j < l;) {
              HEAP8[f++] = HEAP8[j++]
            }
          }else {
            if(8 == f) {
              j = e;
              f = a + 132 + ((b << 2) + (d << 1) << 2);
              for(l = j + 4;j < l;) {
                HEAP8[f++] = HEAP8[j++]
              }
              j = e;
              f = a + 132 + ((b << 2) + (d << 1) + 1 << 2);
              for(l = j + 4;j < l;) {
                HEAP8[f++] = HEAP8[j++]
              }
            }else {
              if(9 == f) {
                j = e;
                f = a + 132 + ((b << 2) + d << 2);
                for(l = j + 4;j < l;) {
                  HEAP8[f++] = HEAP8[j++]
                }
                j = e;
                f = a + 132 + ((b << 2) + d + 2 << 2);
                for(l = j + 4;j < l;) {
                  HEAP8[f++] = HEAP8[j++]
                }
              }else {
                if(10 == f) {
                  j = e;
                  f = a + 132 + ((b << 2) + d << 2);
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
function _GetPredictionMv(a, c, b) {
  var d, e, f;
  d = 0 != (HEAP32[c + 12 >> 2] | 0) ? 3 : 1;
  a:do {
    if(1 == d) {
      if(0 != (HEAP32[c + 24 >> 2] | 0)) {
        d = 3;
        break a
      }
      if(0 == (HEAP32[c >> 2] | 0)) {
        d = 3;
        break a
      }
      e = c + 8;
      f = a;
      for(d = e + 4;e < d;) {
        HEAP8[f++] = HEAP8[e++]
      }
      d = 14;
      break a
    }
  }while(0);
  if(3 == d) {
    if(e = (HEAP32[c + 4 >> 2] | 0) == (b | 0) ? 1 : 0, f = (HEAP32[c + 16 >> 2] | 0) == (b | 0) ? 1 : 0, b = (HEAP32[c + 28 >> 2] | 0) == (b | 0) ? 1 : 0, d = 1 != (e + f + b | 0) ? 4 : 5, 4 == d) {
      b = _MedianFilter(HEAP16[c + 8 >> 1] << 16 >> 16, HEAP16[c + 20 >> 1] << 16 >> 16, HEAP16[c + 32 >> 1] << 16 >> 16) & 65535, HEAP16[a >> 1] = b, c = _MedianFilter(HEAP16[c + 10 >> 1] << 16 >> 16, HEAP16[c + 22 >> 1] << 16 >> 16, HEAP16[c + 34 >> 1] << 16 >> 16) & 65535, HEAP16[a + 2 >> 1] = c
    }else {
      if(5 == d) {
        if(d = 0 != (e | 0) ? 6 : 7, 6 == d) {
          e = c + 8;
          f = a;
          for(d = e + 4;e < d;) {
            HEAP8[f++] = HEAP8[e++]
          }
        }else {
          if(7 == d) {
            if(d = 0 != (f | 0) ? 8 : 9, 8 == d) {
              e = c + 20;
              f = a;
              for(d = e + 4;e < d;) {
                HEAP8[f++] = HEAP8[e++]
              }
            }else {
              if(9 == d) {
                e = c + 32;
                f = a;
                for(d = e + 4;e < d;) {
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
function _h264bsdInterpolateChromaHor(a, c, b, d, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 144;
  var k, m, o, q, p, n, r, s, t, u;
  k = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == k) {
      if(h + (b + 1) >>> 0 > e >>> 0) {
        k = 4;
        break a
      }
      if(0 > (d | 0)) {
        k = 4;
        break a
      }
      k = d + j >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == k && (_h264bsdFillBlock(a, l, b, d, e, f, h + 1, j, h + 1), _h264bsdFillBlock(a + e * f, l + (h + 1) * j, b, d, e, f, h + 1, j, h + 1), a = l, d = b = 0, e = h + 1, f = j);
  r = 8 - g;
  u = 0;
  a:for(;;) {
    if(!(1 >= u >>> 0)) {
      break a
    }
    s = a + (u * f + d) * e + b;
    t = c + (u << 3 << 3);
    m = j >>> 1;
    b:for(;;) {
      if(0 == (m | 0)) {
        break b
      }
      k = h >>> 1;
      c:for(;;) {
        if(0 == (k | 0)) {
          break c
        }
        o = HEAPU8[s + e] & 255;
        p = s;
        s = p + 1;
        q = HEAPU8[p] & 255;
        p = HEAPU8[s + e] & 255;
        n = s;
        s = n + 1;
        n = HEAPU8[n] & 255;
        o = (r * o + g * p << 3) + 32;
        o >>>= 6;
        HEAP8[t + 8] = o & 255;
        o = (r * q + g * n << 3) + 32;
        o >>>= 6;
        q = t;
        t = q + 1;
        HEAP8[q] = o & 255;
        o = HEAPU8[s + e] & 255;
        q = HEAPU8[s] & 255;
        o = (r * p + g * o << 3) + 32;
        o >>>= 6;
        HEAP8[t + 8] = o & 255;
        o = (r * n + g * q << 3) + 32;
        o >>>= 6;
        p = t;
        t = p + 1;
        HEAP8[p] = o & 255;
        k -= 1
      }
      t += 16 - h;
      s += (e << 1) - h;
      m -= 1
    }
    u += 1
  }
  STACKTOP = l
}
_h264bsdInterpolateChromaHor.X = 1;
function _h264bsdFillBlock(a, c, b, d, e, f, g, h, j) {
  var l, k, m, o, q, p, n;
  l = b;
  k = d;
  m = l + g;
  d = 0 <= (l | 0) ? 1 : 3;
  a:do {
    if(1 == d) {
      if(!((m | 0) <= (e | 0))) {
        d = 3;
        break a
      }
      o = 2;
      d = 4;
      break a
    }
  }while(0);
  3 == d && (o = 4);
  5 == (0 > (k + h | 0) ? 5 : 6) && (k = -h);
  7 == (0 > (m | 0) ? 7 : 8) && (l = -g);
  9 == ((k | 0) > (f | 0) ? 9 : 10) && (k = f);
  11 == ((l | 0) > (e | 0) ? 11 : 12) && (l = e);
  m = l + g;
  b = k + h;
  13 == (0 < (l | 0) ? 13 : 14) && (a += l);
  15 == (0 < (k | 0) ? 15 : 16) && (a += k * e);
  d = 0 > (l | 0) ? 17 : 18;
  17 == d ? q = -l : 18 == d && (q = 0);
  d = (m | 0) > (e | 0) ? 20 : 21;
  20 == d ? p = m - e : 21 == d && (p = 0);
  g = g - q - p;
  d = 0 > (k | 0) ? 23 : 24;
  23 == d ? n = -k : 24 == d && (n = 0);
  d = (b | 0) > (f | 0) ? 26 : 27;
  if(26 == d) {
    var r = b - f
  }else {
    27 == d && (r = 0)
  }
  f = r;
  h = h - n - f;
  a:for(;;) {
    if(0 == (n | 0)) {
      break a
    }
    FUNCTION_TABLE[o](a, c, q, g, p);
    c += j;
    n -= 1
  }
  a:for(;;) {
    if(0 == (h | 0)) {
      break a
    }
    FUNCTION_TABLE[o](a, c, q, g, p);
    a += e;
    c += j;
    h -= 1
  }
  a += -e;
  a:for(;;) {
    if(0 == (f | 0)) {
      break a
    }
    FUNCTION_TABLE[o](a, c, q, g, p);
    c += j;
    f -= 1
  }
}
_h264bsdFillBlock.X = 1;
function _h264bsdInterpolateChromaVer(a, c, b, d, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 144;
  var k, m, o, q, p, n, r, s, t;
  k = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == k) {
      if(b + h >>> 0 > e >>> 0) {
        k = 4;
        break a
      }
      if(0 > (d | 0)) {
        k = 4;
        break a
      }
      k = j + (d + 1) >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == k && (_h264bsdFillBlock(a, l, b, d, e, f, h, j + 1, h), _h264bsdFillBlock(a + e * f, l + h * (j + 1), b, d, e, f, h, j + 1, h), a = l, d = b = 0, e = h, f = j + 1);
  n = 8 - g;
  t = 0;
  a:for(;;) {
    if(!(1 >= t >>> 0)) {
      break a
    }
    r = a + (t * f + d) * e + b;
    s = c + (t << 3 << 3);
    m = j >>> 1;
    b:for(;;) {
      if(0 == (m | 0)) {
        break b
      }
      k = h >>> 1;
      c:for(;;) {
        if(0 == (k | 0)) {
          break c
        }
        p = HEAPU8[r + (e << 1)] & 255;
        q = HEAPU8[r + e] & 255;
        o = r;
        r = o + 1;
        o = HEAPU8[o] & 255;
        p = (n * q + g * p << 3) + 32;
        p >>>= 6;
        HEAP8[s + 8] = p & 255;
        p = (n * o + g * q << 3) + 32;
        p >>>= 6;
        q = s;
        s = q + 1;
        HEAP8[q] = p & 255;
        p = HEAPU8[r + (e << 1)] & 255;
        q = HEAPU8[r + e] & 255;
        o = r;
        r = o + 1;
        o = HEAPU8[o] & 255;
        p = (n * q + g * p << 3) + 32;
        p >>>= 6;
        HEAP8[s + 8] = p & 255;
        p = (n * o + g * q << 3) + 32;
        p >>>= 6;
        q = s;
        s = q + 1;
        HEAP8[q] = p & 255;
        k -= 1
      }
      s += 16 - h;
      r += (e << 1) - h;
      m -= 1
    }
    t += 1
  }
  STACKTOP = l
}
_h264bsdInterpolateChromaVer.X = 1;
function _h264bsdInterpolateChromaHorVer(a, c, b, d, e, f, g, h, j, l) {
  var k = STACKTOP;
  STACKTOP += 164;
  var m, o, q, p, n, r, s, t, u, v, w, x;
  m = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == m) {
      if(j + (b + 1) >>> 0 > e >>> 0) {
        m = 4;
        break a
      }
      if(0 > (d | 0)) {
        m = 4;
        break a
      }
      m = l + (d + 1) >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == m && (_h264bsdFillBlock(a, k, b, d, e, f, j + 1, l + 1, j + 1), _h264bsdFillBlock(a + e * f, k + (j + 1) * (l + 1), b, d, e, f, j + 1, l + 1, j + 1), a = k, d = b = 0, e = j + 1, f = l + 1);
  t = 8 - g;
  u = 8 - h;
  v = 0;
  a:for(;;) {
    if(!(1 >= v >>> 0)) {
      break a
    }
    w = a + (v * f + d) * e + b;
    x = c + (v << 3 << 3);
    o = l >>> 1;
    b:for(;;) {
      if(0 == (o | 0)) {
        break b
      }
      q = HEAPU8[w] & 255;
      n = HEAPU8[w + e] & 255;
      s = HEAPU8[w + (e << 1)] & 255;
      q *= u;
      q += n * h;
      n *= u;
      n += s * h;
      m = j >>> 1;
      c:for(;;) {
        if(0 == (m | 0)) {
          break c
        }
        w = p = w + 1;
        p = HEAPU8[p] & 255;
        r = HEAPU8[w + e] & 255;
        s = HEAPU8[w + (e << 1)] & 255;
        p *= u;
        p += r * h;
        r *= u;
        r += s * h;
        q = q * t + 32;
        n = n * t + 32;
        q += p * g;
        q >>>= 6;
        n += r * g;
        n >>>= 6;
        HEAP8[x + 8] = n & 255;
        n = x;
        x = n + 1;
        HEAP8[n] = q & 255;
        w = q = w + 1;
        q = HEAPU8[q] & 255;
        n = HEAPU8[w + e] & 255;
        s = HEAPU8[w + (e << 1)] & 255;
        q *= u;
        q += n * h;
        n *= u;
        n += s * h;
        p = p * t + 32;
        r = r * t + 32;
        p += q * g;
        p >>>= 6;
        r += n * g;
        r >>>= 6;
        HEAP8[x + 8] = r & 255;
        r = x;
        x = r + 1;
        HEAP8[r] = p & 255;
        m -= 1
      }
      x += 16 - j;
      w += (e << 1) - j;
      o -= 1
    }
    v += 1
  }
  STACKTOP = k
}
_h264bsdInterpolateChromaHorVer.X = 1;
function _h264bsdInterpolateVerHalf(a, c, b, d, e, f, g, h) {
  var j = STACKTOP;
  STACKTOP += 444;
  var l, k, m, o, q, p, n;
  k = d;
  d = _h264bsdClip + 512;
  l = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == l) {
      if(b + g >>> 0 > e >>> 0) {
        l = 4;
        break a
      }
      if(0 > (k | 0)) {
        l = 4;
        break a
      }
      l = h + (k + 5) >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == l && (_h264bsdFillBlock(a, j, b, k, e, f, g, h + 5, g), k = b = 0, a = j, e = g);
  f = a + (k * e + b) + e;
  a = f + 5 * e;
  h >>>= 2;
  a:for(;;) {
    if(0 == (h | 0)) {
      break a
    }
    b = g;
    b:for(;;) {
      if(0 == (b | 0)) {
        break b
      }
      q = HEAPU8[a + (-e << 1)] & 255;
      k = HEAPU8[a + -e] & 255;
      l = HEAPU8[a + e] & 255;
      m = HEAPU8[a + (e << 1)] & 255;
      o = a;
      a = o + 1;
      p = HEAPU8[o] & 255;
      n = q + l;
      m -= n << 2;
      m -= n;
      m += 16;
      n = k + p;
      o = HEAPU8[f + (e << 1)] & 255;
      m += n << 4;
      m += n << 2;
      m += o;
      m = HEAPU8[d + (m >> 5)] & 255;
      l += 16;
      HEAP8[c + 48] = m & 255;
      n = o + p;
      l -= n << 2;
      l -= n;
      n = q + k;
      m = HEAPU8[f + e] & 255;
      l += n << 4;
      l += n << 2;
      l += m;
      l = HEAPU8[d + (l >> 5)] & 255;
      p += 16;
      HEAP8[c + 32] = l & 255;
      n = m + k;
      p -= n << 2;
      p -= n;
      n = q + o;
      l = HEAPU8[f] & 255;
      p += n << 4;
      p += n << 2;
      p += l;
      p = HEAPU8[d + (p >> 5)] & 255;
      k += 16;
      HEAP8[c + 16] = p & 255;
      l += q;
      k -= l << 2;
      k -= l;
      o += m;
      p = HEAPU8[f + -e] & 255;
      k += o << 4;
      k += o << 2;
      k += p;
      k = HEAPU8[d + (k >> 5)] & 255;
      l = c;
      c = l + 1;
      HEAP8[l] = k & 255;
      f += 1;
      b -= 1
    }
    f += (e << 2) - g;
    a += (e << 2) - g;
    c += 64 - g;
    h -= 1
  }
  STACKTOP = j
}
_h264bsdInterpolateVerHalf.X = 1;
function _h264bsdInterpolateVerQuarter(a, c, b, d, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 444;
  var k, m, o, q, p, n, r;
  m = d;
  d = _h264bsdClip + 512;
  k = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == k) {
      if(b + g >>> 0 > e >>> 0) {
        k = 4;
        break a
      }
      if(0 > (m | 0)) {
        k = 4;
        break a
      }
      k = h + (m + 5) >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == k && (_h264bsdFillBlock(a, l, b, m, e, f, g, h + 5, g), m = b = 0, a = l, e = g);
  f = a + (m * e + b) + e;
  a = f + 5 * e;
  j = f + (j + 2) * e;
  h >>>= 2;
  a:for(;;) {
    if(0 == (h | 0)) {
      break a
    }
    b = g;
    b:for(;;) {
      if(0 == (b | 0)) {
        break b
      }
      p = HEAPU8[a + (-e << 1)] & 255;
      m = HEAPU8[a + -e] & 255;
      k = HEAPU8[a + e] & 255;
      o = HEAPU8[a + (e << 1)] & 255;
      r = a;
      a = r + 1;
      n = HEAPU8[r] & 255;
      r = p + k;
      o -= r << 2;
      o -= r;
      o += 16;
      r = m + n;
      q = HEAPU8[f + (e << 1)] & 255;
      o += r << 4;
      o += r << 2;
      o += q;
      o = HEAPU8[d + (o >> 5)] & 255;
      r = HEAPU8[j + (e << 1)] & 255;
      k += 16;
      o += 1;
      HEAP8[c + 48] = o + r >> 1 & 255;
      r = q + n;
      k -= r << 2;
      k -= r;
      r = p + m;
      o = HEAPU8[f + e] & 255;
      k += r << 4;
      k += r << 2;
      k += o;
      k = HEAPU8[d + (k >> 5)] & 255;
      r = HEAPU8[j + e] & 255;
      n += 16;
      k += 1;
      HEAP8[c + 32] = k + r >> 1 & 255;
      r = o + m;
      n -= r << 2;
      n -= r;
      r = p + q;
      k = HEAPU8[f] & 255;
      n += r << 4;
      n += r << 2;
      n += k;
      n = HEAPU8[d + (n >> 5)] & 255;
      r = HEAPU8[j] & 255;
      m += 16;
      n += 1;
      HEAP8[c + 16] = n + r >> 1 & 255;
      k += p;
      m -= k << 2;
      m -= k;
      q += o;
      n = HEAPU8[f + -e] & 255;
      m += q << 4;
      m += q << 2;
      m += n;
      m = HEAPU8[d + (m >> 5)] & 255;
      r = HEAPU8[j + -e] & 255;
      m += 1;
      k = c;
      c = k + 1;
      HEAP8[k] = m + r >> 1 & 255;
      f += 1;
      j += 1;
      b -= 1
    }
    f += (e << 2) - g;
    a += (e << 2) - g;
    j += (e << 2) - g;
    c += 64 - g;
    h -= 1
  }
  STACKTOP = l
}
_h264bsdInterpolateVerQuarter.X = 1;
function _h264bsdInterpolateHorHalf(a, c, b, d, e, f, g, h) {
  var j = STACKTOP;
  STACKTOP += 444;
  var l, k, m, o, q, p;
  k = d;
  d = _h264bsdClip + 512;
  l = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == l) {
      if(g + (b + 5) >>> 0 > e >>> 0) {
        l = 4;
        break a
      }
      if(0 > (k | 0)) {
        l = 4;
        break a
      }
      l = k + h >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == l && (_h264bsdFillBlock(a, j, b, k, e, f, g + 5, h, g + 5), k = b = 0, a = j, e = g + 5);
  f = a + (k * e + b) + 5;
  a = h;
  a:for(;;) {
    if(0 == (a | 0)) {
      break a
    }
    q = HEAPU8[f - 5] & 255;
    o = HEAPU8[f - 4] & 255;
    m = HEAPU8[f - 3] & 255;
    k = HEAPU8[f - 2] & 255;
    b = HEAPU8[f - 1] & 255;
    h = g >>> 2;
    b:for(;;) {
      if(0 == (h | 0)) {
        break b
      }
      q += 16;
      p = k + m;
      q += p << 4;
      q += p << 2;
      p = b + o;
      l = f;
      f = l + 1;
      l = HEAPU8[l] & 255;
      q -= p << 2;
      q -= p;
      q += l;
      q = HEAPU8[d + (q >> 5)] & 255;
      o += 16;
      p = b + k;
      var n = c, c = n + 1;
      HEAP8[n] = q & 255;
      o += p << 4;
      o += p << 2;
      p = l + m;
      q = f;
      f = q + 1;
      q = HEAPU8[q] & 255;
      o -= p << 2;
      o -= p;
      o += q;
      o = HEAPU8[d + (o >> 5)] & 255;
      m += 16;
      p = l + b;
      n = c;
      c = n + 1;
      HEAP8[n] = o & 255;
      m += p << 4;
      m += p << 2;
      p = q + k;
      o = f;
      f = o + 1;
      o = HEAPU8[o] & 255;
      m -= p << 2;
      m -= p;
      m += o;
      m = HEAPU8[d + (m >> 5)] & 255;
      k += 16;
      p = q + l;
      n = c;
      c = n + 1;
      HEAP8[n] = m & 255;
      k += p << 4;
      k += p << 2;
      p = o + b;
      m = f;
      f = m + 1;
      m = HEAPU8[m] & 255;
      k -= p << 2;
      k -= p;
      k += m;
      k = HEAPU8[d + (k >> 5)] & 255;
      p = m;
      m = q;
      q = b;
      b = p;
      p = c;
      c = p + 1;
      HEAP8[p] = k & 255;
      k = o;
      o = l;
      h -= 1
    }
    f += e - g;
    c += 16 - g;
    a -= 1
  }
  STACKTOP = j
}
_h264bsdInterpolateHorHalf.X = 1;
function _h264bsdInterpolateHorQuarter(a, c, b, d, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 444;
  var k, m, o, q, p, n;
  m = d;
  d = _h264bsdClip + 512;
  k = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == k) {
      if(g + (b + 5) >>> 0 > e >>> 0) {
        k = 4;
        break a
      }
      if(0 > (m | 0)) {
        k = 4;
        break a
      }
      k = m + h >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == k && (_h264bsdFillBlock(a, l, b, m, e, f, g + 5, h, g + 5), m = b = 0, a = l, e = g + 5);
  f = a + (m * e + b) + 5;
  a = h;
  a:for(;;) {
    if(0 == (a | 0)) {
      break a
    }
    n = HEAPU8[f - 5] & 255;
    p = HEAPU8[f - 4] & 255;
    q = HEAPU8[f - 3] & 255;
    m = HEAPU8[f - 2] & 255;
    b = HEAPU8[f - 1] & 255;
    h = g >>> 2;
    b:for(;;) {
      if(0 == (h | 0)) {
        break b
      }
      n += 16;
      k = m + q;
      n += k << 4;
      n += k << 2;
      k = b + p;
      o = f;
      f = o + 1;
      o = HEAPU8[o] & 255;
      n -= k << 2;
      n -= k;
      n += o;
      n = HEAPU8[d + (n >> 5)] & 255;
      p += 16;
      k = 0 != (j | 0) ? 11 : 10;
      11 == k ? n += m : 10 == k && (n += q);
      k = c;
      c = k + 1;
      HEAP8[k] = n + 1 >> 1 & 255;
      k = b + m;
      p += k << 4;
      p += k << 2;
      k = o + q;
      n = f;
      f = n + 1;
      n = HEAPU8[n] & 255;
      p -= k << 2;
      p -= k;
      p += n;
      p = HEAPU8[d + (p >> 5)] & 255;
      q += 16;
      k = 0 != (j | 0) ? 14 : 13;
      14 == k ? p += b : 13 == k && (p += m);
      k = c;
      c = k + 1;
      HEAP8[k] = p + 1 >> 1 & 255;
      k = o + b;
      q += k << 4;
      q += k << 2;
      k = n + m;
      p = f;
      f = p + 1;
      p = HEAPU8[p] & 255;
      q -= k << 2;
      q -= k;
      q += p;
      q = HEAPU8[d + (q >> 5)] & 255;
      m += 16;
      k = 0 != (j | 0) ? 17 : 16;
      17 == k ? q += o : 16 == k && (q += b);
      k = c;
      c = k + 1;
      HEAP8[k] = q + 1 >> 1 & 255;
      k = n + o;
      m += k << 4;
      m += k << 2;
      k = p + b;
      q = f;
      f = q + 1;
      q = HEAPU8[q] & 255;
      m -= k << 2;
      m -= k;
      m += q;
      m = HEAPU8[d + (m >> 5)] & 255;
      k = 0 != (j | 0) ? 20 : 19;
      20 == k ? m += n : 19 == k && (m += o);
      k = c;
      c = k + 1;
      HEAP8[k] = m + 1 >> 1 & 255;
      m = p;
      p = o;
      k = q;
      q = n;
      n = b;
      b = k;
      h -= 1
    }
    f += e - g;
    c += 16 - g;
    a -= 1
  }
  STACKTOP = l
}
_h264bsdInterpolateHorQuarter.X = 1;
function _h264bsdInterpolateHorVerQuarter(a, c, b, d, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 444;
  var k, m, o, q, p, n, r;
  m = d;
  d = _h264bsdClip + 512;
  k = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == k) {
      if(g + (b + 5) >>> 0 > e >>> 0) {
        k = 4;
        break a
      }
      if(0 > (m | 0)) {
        k = 4;
        break a
      }
      k = h + (m + 5) >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == k && (_h264bsdFillBlock(a, l, b, m, e, f, g + 5, h + 5, g + 5), m = b = 0, a = l, e = g + 5);
  a += m * e + b;
  b = a + (((j & 2) >>> 1) + 2) * e + 5;
  j = e + (a + 2) + (j & 1);
  a = h;
  a:for(;;) {
    if(0 == (a | 0)) {
      break a
    }
    n = HEAPU8[b - 5] & 255;
    k = HEAPU8[b - 4] & 255;
    p = HEAPU8[b - 3] & 255;
    q = HEAPU8[b - 2] & 255;
    m = HEAPU8[b - 1] & 255;
    f = g >>> 2;
    b:for(;;) {
      if(0 == (f | 0)) {
        break b
      }
      n += 16;
      r = q + p;
      n += r << 4;
      n += r << 2;
      r = m + k;
      o = b;
      b = o + 1;
      o = HEAPU8[o] & 255;
      n -= r << 2;
      n -= r;
      n += o;
      n = HEAPU8[d + (n >> 5)] & 255;
      k += 16;
      r = m + q;
      var s = c, c = s + 1;
      HEAP8[s] = n & 255;
      k += r << 4;
      k += r << 2;
      r = o + p;
      n = b;
      b = n + 1;
      n = HEAPU8[n] & 255;
      k -= r << 2;
      k -= r;
      k += n;
      k = HEAPU8[d + (k >> 5)] & 255;
      p += 16;
      r = o + m;
      s = c;
      c = s + 1;
      HEAP8[s] = k & 255;
      p += r << 4;
      p += r << 2;
      r = n + q;
      k = b;
      b = k + 1;
      k = HEAPU8[k] & 255;
      p -= r << 2;
      p -= r;
      p += k;
      p = HEAPU8[d + (p >> 5)] & 255;
      q += 16;
      r = n + o;
      s = c;
      c = s + 1;
      HEAP8[s] = p & 255;
      q += r << 4;
      q += r << 2;
      r = k + m;
      p = b;
      b = p + 1;
      p = HEAPU8[p] & 255;
      q -= r << 2;
      q -= r;
      q += p;
      q = HEAPU8[d + (q >> 5)] & 255;
      r = p;
      p = n;
      n = m;
      m = r;
      r = c;
      c = r + 1;
      HEAP8[r] = q & 255;
      q = k;
      k = o;
      f -= 1
    }
    b += e - g;
    c += 16 - g;
    a -= 1
  }
  c += -(h << 4);
  b = j + 5 * e;
  a = h >>> 2;
  a:for(;;) {
    if(0 == (a | 0)) {
      break a
    }
    f = g;
    b:for(;;) {
      if(0 == (f | 0)) {
        break b
      }
      p = HEAPU8[b + (-e << 1)] & 255;
      k = HEAPU8[b + -e] & 255;
      o = HEAPU8[b + e] & 255;
      m = HEAPU8[b + (e << 1)] & 255;
      h = b;
      b = h + 1;
      n = HEAPU8[h] & 255;
      r = p + o;
      m -= r << 2;
      m -= r;
      m += 16;
      r = k + n;
      q = HEAPU8[j + (e << 1)] & 255;
      m += r << 4;
      m += r << 2;
      m += q;
      r = HEAPU8[d + (m >> 5)] & 255;
      m = HEAPU8[c + 48] & 255;
      o += 16;
      r += 1;
      HEAP8[c + 48] = m + r >> 1 & 255;
      r = q + n;
      o -= r << 2;
      o -= r;
      r = p + k;
      m = HEAPU8[j + e] & 255;
      o += r << 4;
      o += r << 2;
      o += m;
      r = HEAPU8[d + (o >> 5)] & 255;
      o = HEAPU8[c + 32] & 255;
      n += 16;
      r += 1;
      HEAP8[c + 32] = o + r >> 1 & 255;
      o = HEAPU8[j] & 255;
      r = m + k;
      n -= r << 2;
      n -= r;
      r = p + q;
      n += r << 4;
      n += r << 2;
      n += o;
      r = HEAPU8[d + (n >> 5)] & 255;
      n = HEAPU8[c + 16] & 255;
      k += 16;
      r += 1;
      HEAP8[c + 16] = n + r >> 1 & 255;
      n = HEAPU8[j + -e] & 255;
      o += p;
      k -= o << 2;
      k -= o;
      q += m;
      k += q << 4;
      k += q << 2;
      k += n;
      r = HEAPU8[d + (k >> 5)] & 255;
      k = HEAPU8[c] & 255;
      r += 1;
      h = c;
      c = h + 1;
      HEAP8[h] = k + r >> 1 & 255;
      j += 1;
      f -= 1
    }
    j += (e << 2) - g;
    b += (e << 2) - g;
    c += 64 - g;
    a -= 1
  }
  STACKTOP = l
}
_h264bsdInterpolateHorVerQuarter.X = 1;
function _h264bsdInterpolateMidHalf(a, c, b, d, e, f, g, h) {
  var j = STACKTOP;
  STACKTOP += 1788;
  var l, k, m, o, q, p, n, r, s;
  r = j + 444;
  k = d;
  d = e;
  e = _h264bsdClip + 512;
  l = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == l) {
      if(g + (b + 5) >>> 0 > d >>> 0) {
        l = 4;
        break a
      }
      if(0 > (k | 0)) {
        l = 4;
        break a
      }
      l = h + (k + 5) >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == l && (_h264bsdFillBlock(a, j, b, k, d, f, g + 5, h + 5, g + 5), k = b = 0, a = j, d = g + 5);
  l = r;
  s = a + (k * d + b) + 5;
  a = h + 5;
  a:for(;;) {
    if(0 == (a | 0)) {
      break a
    }
    p = HEAPU8[s - 5] & 255;
    q = HEAPU8[s - 4] & 255;
    o = HEAPU8[s - 3] & 255;
    m = HEAPU8[s - 2] & 255;
    b = HEAPU8[s - 1] & 255;
    f = g >>> 2;
    b:for(;;) {
      if(0 == (f | 0)) {
        break b
      }
      n = m + o;
      p += n << 4;
      p += n << 2;
      n = b + q;
      k = s;
      s = k + 1;
      k = HEAPU8[k] & 255;
      p -= n << 2;
      p -= n;
      p += k;
      n = l;
      l = n + 4;
      HEAP32[n >> 2] = p;
      n = b + m;
      q += n << 4;
      q += n << 2;
      n = k + o;
      p = s;
      s = p + 1;
      p = HEAPU8[p] & 255;
      q -= n << 2;
      q -= n;
      q += p;
      n = l;
      l = n + 4;
      HEAP32[n >> 2] = q;
      n = k + b;
      o += n << 4;
      o += n << 2;
      n = p + m;
      q = s;
      s = q + 1;
      q = HEAPU8[q] & 255;
      o -= n << 2;
      o -= n;
      o += q;
      n = l;
      l = n + 4;
      HEAP32[n >> 2] = o;
      n = p + k;
      m += n << 4;
      m += n << 2;
      n = q + b;
      o = s;
      s = o + 1;
      o = HEAPU8[o] & 255;
      m -= n << 2;
      m -= n;
      m += o;
      n = l;
      l = n + 4;
      HEAP32[n >> 2] = m;
      n = o;
      o = p;
      p = b;
      b = n;
      m = q;
      q = k;
      f -= 1
    }
    s += d - g;
    a -= 1
  }
  r += g << 2;
  d = r + (5 * g << 2);
  a = h >>> 2;
  a:for(;;) {
    if(0 == (a | 0)) {
      break a
    }
    f = g;
    b:for(;;) {
      if(0 == (f | 0)) {
        break b
      }
      o = HEAP32[d + (-g << 1 << 2) >> 2];
      q = HEAP32[d + (-g << 2) >> 2];
      k = HEAP32[d + (g << 2) >> 2];
      b = HEAP32[d + (g << 1 << 2) >> 2];
      h = d;
      d = h + 4;
      p = HEAP32[h >> 2];
      n = o + k;
      b -= n << 2;
      b -= n;
      b += 512;
      n = q + p;
      m = HEAP32[r + (g << 1 << 2) >> 2];
      b += n << 4;
      b += n << 2;
      b += m;
      n = HEAPU8[e + (b >> 10)] & 255;
      k += 512;
      HEAP8[c + 48] = n & 255;
      n = m + p;
      k -= n << 2;
      k -= n;
      n = o + q;
      b = HEAP32[r + (g << 2) >> 2];
      k += n << 4;
      k += n << 2;
      k += b;
      n = HEAPU8[e + (k >> 10)] & 255;
      p += 512;
      HEAP8[c + 32] = n & 255;
      k = HEAP32[r >> 2];
      n = b + q;
      p -= n << 2;
      p -= n;
      n = o + m;
      p += n << 4;
      p += n << 2;
      p += k;
      n = HEAPU8[e + (p >> 10)] & 255;
      q += 512;
      HEAP8[c + 16] = n & 255;
      p = HEAP32[r + (-g << 2) >> 2];
      k += o;
      q -= k << 2;
      q -= k;
      m += b;
      q += m << 4;
      q += m << 2;
      q += p;
      n = HEAPU8[e + (q >> 10)] & 255;
      h = c;
      c = h + 1;
      HEAP8[h] = n & 255;
      r += 4;
      f -= 1
    }
    c += 64 - g;
    r += 3 * g << 2;
    d += 3 * g << 2;
    a -= 1
  }
  STACKTOP = j
}
_h264bsdInterpolateMidHalf.X = 1;
function _h264bsdInterpolateMidVerQuarter(a, c, b, d, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 1788;
  var k, m, o, q, p, n, r, s, t;
  r = l + 444;
  m = d;
  d = e;
  e = _h264bsdClip + 512;
  k = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == k) {
      if(g + (b + 5) >>> 0 > d >>> 0) {
        k = 4;
        break a
      }
      if(0 > (m | 0)) {
        k = 4;
        break a
      }
      k = h + (m + 5) >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == k && (_h264bsdFillBlock(a, l, b, m, d, f, g + 5, h + 5, g + 5), m = b = 0, a = l, d = g + 5);
  s = r;
  t = a + (m * d + b) + 5;
  a = h + 5;
  a:for(;;) {
    if(0 == (a | 0)) {
      break a
    }
    p = HEAPU8[t - 5] & 255;
    m = HEAPU8[t - 4] & 255;
    q = HEAPU8[t - 3] & 255;
    o = HEAPU8[t - 2] & 255;
    b = HEAPU8[t - 1] & 255;
    f = g >>> 2;
    b:for(;;) {
      if(0 == (f | 0)) {
        break b
      }
      n = o + q;
      p += n << 4;
      p += n << 2;
      n = b + m;
      k = t;
      t = k + 1;
      k = HEAPU8[k] & 255;
      p -= n << 2;
      p -= n;
      p += k;
      n = s;
      s = n + 4;
      HEAP32[n >> 2] = p;
      n = b + o;
      m += n << 4;
      m += n << 2;
      n = k + q;
      p = t;
      t = p + 1;
      p = HEAPU8[p] & 255;
      m -= n << 2;
      m -= n;
      m += p;
      n = s;
      s = n + 4;
      HEAP32[n >> 2] = m;
      n = k + b;
      q += n << 4;
      q += n << 2;
      n = p + o;
      m = t;
      t = m + 1;
      m = HEAPU8[m] & 255;
      q -= n << 2;
      q -= n;
      q += m;
      n = s;
      s = n + 4;
      HEAP32[n >> 2] = q;
      n = p + k;
      o += n << 4;
      o += n << 2;
      n = m + b;
      q = t;
      t = q + 1;
      q = HEAPU8[q] & 255;
      o -= n << 2;
      o -= n;
      o += q;
      n = s;
      s = n + 4;
      HEAP32[n >> 2] = o;
      n = q;
      q = p;
      p = b;
      b = n;
      o = m;
      m = k;
      f -= 1
    }
    t += d - g;
    a -= 1
  }
  r += g << 2;
  d = r + (5 * g << 2);
  j = r + ((j + 2) * g << 2);
  a = h >>> 2;
  a:for(;;) {
    if(0 == (a | 0)) {
      break a
    }
    f = g;
    b:for(;;) {
      if(0 == (f | 0)) {
        break b
      }
      q = HEAP32[d + (-g << 1 << 2) >> 2];
      m = HEAP32[d + (-g << 2) >> 2];
      k = HEAP32[d + (g << 2) >> 2];
      b = HEAP32[d + (g << 1 << 2) >> 2];
      h = d;
      d = h + 4;
      p = HEAP32[h >> 2];
      n = q + k;
      b -= n << 2;
      b -= n;
      b += 512;
      n = m + p;
      o = HEAP32[r + (g << 1 << 2) >> 2];
      b += n << 4;
      b += n << 2;
      n = HEAP32[j + (g << 1 << 2) >> 2];
      b += o;
      b = HEAPU8[e + (b >> 10)] & 255;
      n += 16;
      n = HEAPU8[e + (n >> 5)] & 255;
      k += 512;
      b += 1;
      HEAP8[c + 48] = n + b >> 1 & 255;
      n = o + p;
      k -= n << 2;
      k -= n;
      n = q + m;
      b = HEAP32[r + (g << 2) >> 2];
      k += n << 4;
      k += n << 2;
      n = HEAP32[j + (g << 2) >> 2];
      k += b;
      k = HEAPU8[e + (k >> 10)] & 255;
      n += 16;
      n = HEAPU8[e + (n >> 5)] & 255;
      p += 512;
      k += 1;
      HEAP8[c + 32] = n + k >> 1 & 255;
      k = HEAP32[r >> 2];
      n = b + m;
      p -= n << 2;
      p -= n;
      n = q + o;
      p += n << 4;
      p += n << 2;
      n = HEAP32[j >> 2];
      p += k;
      p = HEAPU8[e + (p >> 10)] & 255;
      n += 16;
      n = HEAPU8[e + (n >> 5)] & 255;
      m += 512;
      p += 1;
      HEAP8[c + 16] = n + p >> 1 & 255;
      p = HEAP32[r + (-g << 2) >> 2];
      k += q;
      m -= k << 2;
      m -= k;
      o += b;
      m += o << 4;
      m += o << 2;
      n = HEAP32[j + (-g << 2) >> 2];
      m += p;
      m = HEAPU8[e + (m >> 10)] & 255;
      n += 16;
      n = HEAPU8[e + (n >> 5)] & 255;
      m += 1;
      h = c;
      c = h + 1;
      HEAP8[h] = n + m >> 1 & 255;
      r += 4;
      j += 4;
      f -= 1
    }
    c += 64 - g;
    r += 3 * g << 2;
    d += 3 * g << 2;
    j += 3 * g << 2;
    a -= 1
  }
  STACKTOP = l
}
_h264bsdInterpolateMidVerQuarter.X = 1;
function _h264bsdInterpolateMidHorQuarter(a, c, b, d, e, f, g, h, j) {
  var l = STACKTOP;
  STACKTOP += 1788;
  var k, m, o, q, p, n, r, s, t, u = l + 444, v;
  m = e;
  v = g + 5;
  e = _h264bsdClip + 512;
  k = 0 > (b | 0) ? 4 : 1;
  a:do {
    if(1 == k) {
      if(g + (b + 5) >>> 0 > m >>> 0) {
        k = 4;
        break a
      }
      if(0 > (d | 0)) {
        k = 4;
        break a
      }
      k = h + (d + 5) >>> 0 > f >>> 0 ? 4 : 5;
      break a
    }
  }while(0);
  4 == k && (_h264bsdFillBlock(a, l, b, d, m, f, g + 5, h + 5, g + 5), d = b = 0, a = l, m = g + 5);
  r = u + (v << 2);
  s = a + (d * m + b) + m;
  t = s + 5 * m;
  a = h >>> 2;
  a:for(;;) {
    if(0 == (a | 0)) {
      break a
    }
    f = v;
    b:for(;;) {
      if(0 == (f | 0)) {
        break b
      }
      o = HEAPU8[t + (-m << 1)] & 255;
      q = HEAPU8[t + -m] & 255;
      d = HEAPU8[t + m] & 255;
      b = HEAPU8[t + (m << 1)] & 255;
      k = t;
      t = k + 1;
      p = HEAPU8[k] & 255;
      n = o + d;
      b -= n << 2;
      b -= n;
      n = q + p;
      k = HEAPU8[s + (m << 1)] & 255;
      b += n << 4;
      b += n << 2;
      b += k;
      HEAP32[r + (v << 1 << 2) >> 2] = b;
      n = k + p;
      d -= n << 2;
      d -= n;
      n = o + q;
      b = HEAPU8[s + m] & 255;
      d += n << 4;
      d += n << 2;
      d += b;
      HEAP32[r + (v << 2) >> 2] = d;
      d = HEAPU8[s] & 255;
      n = b + q;
      p -= n << 2;
      p -= n;
      n = o + k;
      p += n << 4;
      p += n << 2;
      p += d;
      HEAP32[r >> 2] = p;
      p = HEAPU8[s + -m] & 255;
      d += o;
      q -= d << 2;
      q -= d;
      k += b;
      q += k << 4;
      q += k << 2;
      q += p;
      HEAP32[r + (-v << 2) >> 2] = q;
      r += 4;
      s += 1;
      f -= 1
    }
    s += (m << 2) - g - 5;
    t += (m << 2) - g - 5;
    r += 3 * v << 2;
    a -= 1
  }
  m = u + 20;
  j = u + 8 + (j << 2);
  a = h;
  a:for(;;) {
    if(0 == (a | 0)) {
      break a
    }
    p = HEAP32[m - 20 >> 2];
    q = HEAP32[m - 16 >> 2];
    o = HEAP32[m - 12 >> 2];
    k = HEAP32[m - 8 >> 2];
    b = HEAP32[m - 4 >> 2];
    f = g >>> 2;
    b:for(;;) {
      if(0 == (f | 0)) {
        break b
      }
      p += 512;
      n = k + o;
      p += n << 4;
      p += n << 2;
      n = b + q;
      d = m;
      m = d + 4;
      d = HEAP32[d >> 2];
      p -= n << 2;
      p -= n;
      h = j;
      j = h + 4;
      n = HEAP32[h >> 2];
      p += d;
      p = HEAPU8[e + (p >> 10)] & 255;
      n += 16;
      n = HEAPU8[e + (n >> 5)] & 255;
      q += 512;
      p += 1;
      h = c;
      c = h + 1;
      HEAP8[h] = p + n >> 1 & 255;
      n = b + k;
      q += n << 4;
      q += n << 2;
      n = d + o;
      h = m;
      m = h + 4;
      p = HEAP32[h >> 2];
      q -= n << 2;
      q -= n;
      h = j;
      j = h + 4;
      n = HEAP32[h >> 2];
      q += p;
      q = HEAPU8[e + (q >> 10)] & 255;
      n += 16;
      n = HEAPU8[e + (n >> 5)] & 255;
      o += 512;
      q += 1;
      h = c;
      c = h + 1;
      HEAP8[h] = q + n >> 1 & 255;
      n = d + b;
      o += n << 4;
      o += n << 2;
      n = p + k;
      q = m;
      m = q + 4;
      q = HEAP32[q >> 2];
      o -= n << 2;
      o -= n;
      h = j;
      j = h + 4;
      n = HEAP32[h >> 2];
      o += q;
      o = HEAPU8[e + (o >> 10)] & 255;
      n += 16;
      n = HEAPU8[e + (n >> 5)] & 255;
      k += 512;
      o += 1;
      h = c;
      c = h + 1;
      HEAP8[h] = o + n >> 1 & 255;
      n = p + d;
      k += n << 4;
      k += n << 2;
      n = q + b;
      o = m;
      m = o + 4;
      o = HEAP32[o >> 2];
      k -= n << 2;
      k -= n;
      h = j;
      j = h + 4;
      n = HEAP32[h >> 2];
      k += o;
      k = HEAPU8[e + (k >> 10)] & 255;
      n += 16;
      n = HEAPU8[e + (n >> 5)] & 255;
      k += 1;
      h = c;
      c = h + 1;
      HEAP8[h] = k + n >> 1 & 255;
      k = q;
      q = d;
      n = o;
      o = p;
      p = b;
      b = n;
      f -= 1
    }
    m += 20;
    j += 20;
    c += 16 - g;
    a -= 1
  }
  STACKTOP = l
}
_h264bsdInterpolateMidHorQuarter.X = 1;
function _FillRow1(a, c, b, d) {
  _H264SwDecMemcpy(c, a, d)
}
function _h264bsdPredictSamples(a, c, b, d, e, f, g, h, j) {
  var l, k, m, o, q, p, n;
  n = a + (g << 4) + f;
  l = HEAP16[c >> 1] << 16 >> 16 & 3;
  k = HEAP16[c + 2 >> 1] << 16 >> 16 & 3;
  m = HEAP32[b + 4 >> 2] << 4;
  o = HEAP32[b + 8 >> 2] << 4;
  q = d + f + (HEAP16[c >> 1] << 16 >> 16 >> 2);
  p = e + g + (HEAP16[c + 2 >> 1] << 16 >> 16 >> 2);
  l = HEAP32[_lumaFracPos + (l << 4) + (k << 2) >> 2];
  l = 0 == l ? 1 : 1 == l ? 2 : 2 == l ? 3 : 3 == l ? 4 : 4 == l ? 5 : 5 == l ? 6 : 6 == l ? 7 : 7 == l ? 8 : 8 == l ? 9 : 9 == l ? 10 : 10 == l ? 11 : 11 == l ? 12 : 12 == l ? 13 : 13 == l ? 14 : 14 == l ? 15 : 16;
  16 == l ? _h264bsdInterpolateHorVerQuarter(HEAP32[b >> 2], n, q - 2, p - 2, m, o, h, j, 3) : 1 == l ? _h264bsdFillBlock(HEAP32[b >> 2], n, q, p, m, o, h, j, 16) : 2 == l ? _h264bsdInterpolateVerQuarter(HEAP32[b >> 2], n, q, p - 2, m, o, h, j, 0) : 3 == l ? _h264bsdInterpolateVerHalf(HEAP32[b >> 2], n, q, p - 2, m, o, h, j) : 4 == l ? _h264bsdInterpolateVerQuarter(HEAP32[b >> 2], n, q, p - 2, m, o, h, j, 1) : 5 == l ? _h264bsdInterpolateHorQuarter(HEAP32[b >> 2], n, q - 2, p, m, o, h, j, 0) : 6 == 
  l ? _h264bsdInterpolateHorVerQuarter(HEAP32[b >> 2], n, q - 2, p - 2, m, o, h, j, 0) : 7 == l ? _h264bsdInterpolateMidHorQuarter(HEAP32[b >> 2], n, q - 2, p - 2, m, o, h, j, 0) : 8 == l ? _h264bsdInterpolateHorVerQuarter(HEAP32[b >> 2], n, q - 2, p - 2, m, o, h, j, 2) : 9 == l ? _h264bsdInterpolateHorHalf(HEAP32[b >> 2], n, q - 2, p, m, o, h, j) : 10 == l ? _h264bsdInterpolateMidVerQuarter(HEAP32[b >> 2], n, q - 2, p - 2, m, o, h, j, 0) : 11 == l ? _h264bsdInterpolateMidHalf(HEAP32[b >> 2], n, 
  q - 2, p - 2, m, o, h, j) : 12 == l ? _h264bsdInterpolateMidVerQuarter(HEAP32[b >> 2], n, q - 2, p - 2, m, o, h, j, 1) : 13 == l ? _h264bsdInterpolateHorQuarter(HEAP32[b >> 2], n, q - 2, p, m, o, h, j, 1) : 14 == l ? _h264bsdInterpolateHorVerQuarter(HEAP32[b >> 2], n, q - 2, p - 2, m, o, h, j, 1) : 15 == l && _h264bsdInterpolateMidHorQuarter(HEAP32[b >> 2], n, q - 2, p - 2, m, o, h, j, 1);
  _PredictChroma(a + 256 + (g >>> 1 << 3) + (f >>> 1), d + f, e + g, h, j, c, b)
}
_h264bsdPredictSamples.X = 1;
function _PredictChroma(a, c, b, d, e, f, g) {
  var h, j, l, k;
  h = HEAP32[g + 4 >> 2] << 3;
  j = HEAP32[g + 8 >> 2] << 3;
  c = (c >>> 1) + (HEAP16[f >> 1] << 16 >> 16 >> 3);
  l = (b >>> 1) + (HEAP16[f + 2 >> 1] << 16 >> 16 >> 3);
  b = HEAP16[f >> 1] << 16 >> 16 & 7;
  f = HEAP16[f + 2 >> 1] << 16 >> 16 & 7;
  d >>>= 1;
  e >>>= 1;
  k = HEAP32[g >> 2] + (HEAP32[g + 4 >> 2] << 8) * HEAP32[g + 8 >> 2];
  g = 0 != (b | 0) ? 1 : 3;
  a:do {
    if(1 == g) {
      if(0 == (f | 0)) {
        g = 3;
        break a
      }
      _h264bsdInterpolateChromaHorVer(k, a, c, l, h, j, b, f, d, e);
      g = 10;
      break a
    }
  }while(0);
  3 == g && (g = 0 != (b | 0) ? 4 : 5, 4 == g ? _h264bsdInterpolateChromaHor(k, a, c, l, h, j, b, d, e) : 5 == g && (g = 0 != (f | 0) ? 6 : 7, 6 == g ? _h264bsdInterpolateChromaVer(k, a, c, l, h, j, f, d, e) : 7 == g && (_h264bsdFillBlock(k, a, c, l, h, j, d, e, 8), _h264bsdFillBlock(k + h * j, a + 64, c, l, h, j, d, e, 8))))
}
_PredictChroma.X = 1;
function _h264bsdFillRow7(a, c, b, d, e) {
  var f;
  1 == (0 != (b | 0) ? 1 : 2) && (f = HEAP8[a]);
  a:for(;;) {
    if(0 == (b | 0)) {
      break a
    }
    var g = c, c = g + 1;
    HEAP8[g] = f;
    b -= 1
  }
  a:for(;;) {
    if(0 == (d | 0)) {
      break a
    }
    b = a;
    a = b + 1;
    b = HEAP8[b];
    g = c;
    c = g + 1;
    HEAP8[g] = b;
    d -= 1
  }
  11 == (0 != (e | 0) ? 11 : 12) && (f = HEAP8[a - 1]);
  a:for(;;) {
    if(0 == (e | 0)) {
      break a
    }
    a = c;
    c = a + 1;
    HEAP8[a] = f;
    e -= 1
  }
}
_h264bsdFillRow7.X = 1;
function _SetPicNums(a, c) {
  var b, d, e;
  d = 0;
  a:for(;;) {
    if(!(d >>> 0 < HEAPU32[a + 40 >> 2] >>> 0)) {
      break a
    }
    b = 1 == (HEAP32[HEAP32[a >> 2] + 40 * d + 20 >> 2] | 0) ? 4 : 3;
    b:do {
      if(3 == b) {
        b = 2 == (HEAP32[HEAP32[a >> 2] + 40 * d + 20 >> 2] | 0) ? 4 : 8;
        break b
      }
    }while(0);
    4 == b && (b = HEAPU32[HEAP32[a >> 2] + 40 * d + 12 >> 2] >>> 0 > c >>> 0 ? 5 : 6, 5 == b ? e = HEAP32[HEAP32[a >> 2] + 40 * d + 12 >> 2] - HEAP32[a + 32 >> 2] : 6 == b && (e = HEAP32[HEAP32[a >> 2] + 40 * d + 12 >> 2]), HEAP32[HEAP32[a >> 2] + 40 * d + 8 >> 2] = e);
    d += 1
  }
}
_SetPicNums.X = 1;
function _FindDpbPic(a, c, b) {
  var d, e, f;
  f = e = 0;
  b = 0 != (b | 0) ? 1 : 12;
  do {
    if(1 == b) {
      b:for(;;) {
        if(e >>> 0 < HEAPU32[a + 24 >> 2] >>> 0) {
          b = 3
        }else {
          var g = 0, b = 4
        }
        3 == b && (g = 0 != (f | 0) ^ 1);
        if(!g) {
          break b
        }
        b = 1 == (HEAP32[HEAP32[a >> 2] + 40 * e + 20 >> 2] | 0) ? 7 : 6;
        c:do {
          if(6 == b) {
            b = 2 == (HEAP32[HEAP32[a >> 2] + 40 * e + 20 >> 2] | 0) ? 7 : 9;
            break c
          }
        }while(0);
        c:do {
          if(7 == b) {
            if((HEAP32[HEAP32[a >> 2] + 40 * e + 8 >> 2] | 0) != (c | 0)) {
              b = 9;
              break c
            }
            f = 1;
            b = 10;
            break c
          }
        }while(0);
        9 == b && (e += 1)
      }
    }else {
      if(12 == b) {
        b:for(;;) {
          if(e >>> 0 < HEAPU32[a + 24 >> 2] >>> 0) {
            b = 14
          }else {
            var h = 0, b = 15
          }
          14 == b && (h = 0 != (f | 0) ^ 1);
          if(!h) {
            break b
          }
          b = 3 == (HEAP32[HEAP32[a >> 2] + 40 * e + 20 >> 2] | 0) ? 17 : 19;
          c:do {
            if(17 == b) {
              if((HEAP32[HEAP32[a >> 2] + 40 * e + 8 >> 2] | 0) != (c | 0)) {
                b = 19;
                break c
              }
              f = 1;
              b = 20;
              break c
            }
          }while(0);
          19 == b && (e += 1)
        }
      }
    }
  }while(0);
  b = 0 != (f | 0) ? 23 : 24;
  23 == b ? d = e : 24 == b && (d = -1);
  return d
}
_FindDpbPic.X = 1;
function _h264bsdReorderRefPicList(a, c, b, d) {
  var e, f, g, h, j, l, k, m, o, q, p;
  _SetPicNums(a, b);
  e = 0 != (HEAP32[c >> 2] | 0) ? 2 : 1;
  a:do {
    if(2 == e) {
      k = 0;
      l = b;
      g = 0;
      b:for(;;) {
        e = 3 > HEAPU32[c + 4 + 12 * g >> 2] >>> 0 ? 4 : 30;
        do {
          if(4 == e) {
            e = 2 > HEAPU32[c + 4 + 12 * g >> 2] >>> 0 ? 5 : 15;
            5 == e ? (e = 0 == (HEAP32[c + 4 + 12 * g >> 2] | 0) ? 6 : 9, 6 == e ? (o = l - HEAP32[c + 4 + 12 * g + 4 >> 2], e = 0 > (o | 0) ? 7 : 8, 7 == e && (o += HEAP32[a + 32 >> 2])) : 9 == e && (o = l + HEAP32[c + 4 + 12 * g + 4 >> 2], e = (o | 0) >= (HEAP32[a + 32 >> 2] | 0) ? 10 : 11, 10 == e && (o -= HEAP32[a + 32 >> 2])), m = l = o, e = o >>> 0 > b >>> 0 ? 13 : 14, 13 == e && (m -= HEAP32[a + 32 >> 2]), p = 1) : 15 == e && (m = HEAP32[c + 4 + 12 * g + 8 >> 2], p = 0);
            q = _FindDpbPic(a, m, p);
            e = 0 > (q | 0) ? 18 : 17;
            d:do {
              if(17 == e) {
                if(!(1 < HEAPU32[HEAP32[a >> 2] + 40 * q + 20 >> 2] >>> 0)) {
                  break d
                }
                h = d;
                e:for(;;) {
                  if(!(h >>> 0 > k >>> 0)) {
                    break e
                  }
                  HEAP32[HEAP32[a + 4 >> 2] + (h << 2) >> 2] = HEAP32[HEAP32[a + 4 >> 2] + (h - 1 << 2) >> 2];
                  h -= 1
                }
                h = HEAP32[a >> 2] + 40 * q;
                j = k;
                k = j + 1;
                HEAP32[HEAP32[a + 4 >> 2] + (j << 2) >> 2] = h;
                h = j = k;
                e:for(;;) {
                  if(!(h >>> 0 <= d >>> 0)) {
                    break e
                  }
                  e = (HEAP32[HEAP32[a + 4 >> 2] + (h << 2) >> 2] | 0) != (HEAP32[a >> 2] + 40 * q | 0) ? 26 : 27;
                  if(26 == e) {
                    var n = HEAP32[HEAP32[a + 4 >> 2] + (h << 2) >> 2], r = j;
                    j = r + 1;
                    HEAP32[HEAP32[a + 4 >> 2] + (r << 2) >> 2] = n
                  }
                  h += 1
                }
                g += 1;
                continue b
              }
            }while(0);
            f = 1;
            break a
          }else {
            if(30 == e) {
              f = 0;
              break a
            }
          }
        }while(0)
      }
    }else {
      1 == e && (f = 0)
    }
  }while(0);
  return f
}
_h264bsdReorderRefPicList.X = 1;
function _h264bsdMarkDecRefPic(a, c, b, d, e, f, g, h) {
  var j, l, k, m, b = (HEAP32[b >> 2] | 0) != (HEAP32[HEAP32[a + 8 >> 2] >> 2] | 0) ? 1 : 2;
  do {
    if(1 == b) {
      j = 1
    }else {
      if(2 == b) {
        l = HEAP32[a + 52 >> 2] = 0;
        m = 0 != (HEAP32[a + 56 >> 2] | 0) ? 0 : 1;
        b = 0 == (c | 0) ? 3 : 6;
        do {
          if(3 == b) {
            HEAP32[HEAP32[a + 8 >> 2] + 20 >> 2] = 0, HEAP32[HEAP32[a + 8 >> 2] + 12 >> 2] = d, HEAP32[HEAP32[a + 8 >> 2] + 8 >> 2] = d, HEAP32[HEAP32[a + 8 >> 2] + 16 >> 2] = e, HEAP32[HEAP32[a + 8 >> 2] + 24 >> 2] = m, b = 0 != (HEAP32[a + 56 >> 2] | 0) ? 5 : 4, 4 == b && (HEAP32[a + 44 >> 2] += 1)
          }else {
            if(6 == b) {
              b = 0 != (f | 0) ? 7 : 14;
              do {
                if(7 == b) {
                  HEAP32[a + 20 >> 2] = 0;
                  HEAP32[a + 16 >> 2] = 0;
                  _Mmcop5(a);
                  b = 0 != (HEAP32[c >> 2] | 0) ? 9 : 8;
                  d:do {
                    if(8 == b) {
                      b = 0 != (HEAP32[a + 56 >> 2] | 0) ? 9 : 10;
                      break d
                    }
                  }while(0);
                  9 == b && (HEAP32[a + 16 >> 2] = 0, HEAP32[a + 20 >> 2] = 0);
                  b = 0 != (HEAP32[c + 4 >> 2] | 0) ? 11 : 12;
                  11 == b ? (HEAP32[HEAP32[a + 8 >> 2] + 20 >> 2] = 3, HEAP32[a + 36 >> 2] = 0) : 12 == b && (HEAP32[HEAP32[a + 8 >> 2] + 20 >> 2] = 2, HEAP32[a + 36 >> 2] = 65535);
                  HEAP32[HEAP32[a + 8 >> 2] + 12 >> 2] = 0;
                  HEAP32[HEAP32[a + 8 >> 2] + 8 >> 2] = 0;
                  HEAP32[HEAP32[a + 8 >> 2] + 16 >> 2] = 0;
                  HEAP32[HEAP32[a + 8 >> 2] + 24 >> 2] = m;
                  HEAP32[a + 44 >> 2] = 1;
                  HEAP32[a + 40 >> 2] = 1
                }else {
                  if(14 == b) {
                    k = 0;
                    b = 0 != (HEAP32[c + 8 >> 2] | 0) ? 15 : 31;
                    do {
                      if(15 == b) {
                        j = 0;
                        e:for(;;) {
                          if(0 == (HEAP32[c + 12 + 20 * j >> 2] | 0)) {
                            break e
                          }
                          b = HEAP32[c + 12 + 20 * j >> 2];
                          b = 1 == b ? 18 : 2 == b ? 19 : 3 == b ? 20 : 4 == b ? 21 : 5 == b ? 22 : 6 == b ? 23 : 26;
                          26 == b ? l = 1 : 18 == b ? l = _Mmcop1(a, d, HEAP32[c + 12 + 20 * j + 4 >> 2]) : 19 == b ? l = _Mmcop2(a, HEAP32[c + 12 + 20 * j + 8 >> 2]) : 20 == b ? l = _Mmcop3(a, d, HEAP32[c + 12 + 20 * j + 4 >> 2], HEAP32[c + 12 + 20 * j + 12 >> 2]) : 21 == b ? l = _Mmcop4(a, HEAP32[c + 12 + 20 * j + 16 >> 2]) : 22 == b ? (l = _Mmcop5(a), HEAP32[a + 52 >> 2] = 1, d = 0) : 23 == b && (l = _Mmcop6(a, d, e, HEAP32[c + 12 + 20 * j + 12 >> 2]), b = 0 == (l | 0) ? 24 : 25, 24 == b && (k = 
                          1));
                          b = 0 != (l | 0) ? 28 : 29;
                          do {
                            if(28 == b) {
                              break e
                            }else {
                              29 == b && (j += 1)
                            }
                          }while(0)
                        }
                      }else {
                        31 == b && (l = _SlidingWindowRefPicMarking(a))
                      }
                    }while(0);
                    b = 0 != (k | 0) ? 37 : 33;
                    33 == b && (b = HEAPU32[a + 40 >> 2] >>> 0 < HEAPU32[a + 24 >> 2] >>> 0 ? 34 : 35, 34 == b ? (HEAP32[HEAP32[a + 8 >> 2] + 12 >> 2] = d, HEAP32[HEAP32[a + 8 >> 2] + 8 >> 2] = d, HEAP32[HEAP32[a + 8 >> 2] + 16 >> 2] = e, HEAP32[HEAP32[a + 8 >> 2] + 20 >> 2] = 2, HEAP32[HEAP32[a + 8 >> 2] + 24 >> 2] = m, HEAP32[a + 44 >> 2] += 1, HEAP32[a + 40 >> 2] += 1) : 35 == b && (l = 1))
                  }
                }
              }while(0)
            }
          }
        }while(0);
        HEAP32[HEAP32[a + 8 >> 2] + 36 >> 2] = f;
        HEAP32[HEAP32[a + 8 >> 2] + 28 >> 2] = g;
        HEAP32[HEAP32[a + 8 >> 2] + 32 >> 2] = h;
        b = 0 != (HEAP32[a + 56 >> 2] | 0) ? 40 : 41;
        do {
          if(40 == b) {
            HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) >> 2] = HEAP32[HEAP32[a + 8 >> 2] >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 12 >> 2] = HEAP32[HEAP32[a + 8 >> 2] + 36 >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 4 >> 2] = HEAP32[HEAP32[a + 8 >> 2] + 28 >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 8 >> 2] = HEAP32[HEAP32[a + 8 >> 2] + 32 >> 2], HEAP32[a + 16 >> 2] += 1
          }else {
            if(41 == b) {
              c:for(;;) {
                if(!(HEAPU32[a + 44 >> 2] >>> 0 > HEAPU32[a + 28 >> 2] >>> 0)) {
                  break c
                }
                _OutputPicture(a)
              }
            }
          }
        }while(0);
        _ShellSort(HEAP32[a >> 2], HEAP32[a + 28 >> 2] + 1);
        j = l
      }
    }
  }while(0);
  return j
}
_h264bsdMarkDecRefPic.X = 1;
function _Mmcop5(a) {
  var c, b;
  b = 0;
  a:for(;;) {
    if(!(16 > b >>> 0)) {
      break a
    }
    c = 0 != (HEAP32[HEAP32[a >> 2] + 40 * b + 20 >> 2] | 0) ? 3 : 6;
    3 == c && (HEAP32[HEAP32[a >> 2] + 40 * b + 20 >> 2] = 0, c = 0 != (HEAP32[HEAP32[a >> 2] + 40 * b + 24 >> 2] | 0) ? 5 : 4, 4 == c && (HEAP32[a + 44 >> 2] -= 1));
    b += 1
  }
  a:for(;;) {
    if(0 != (_OutputPicture(a) | 0)) {
      break a
    }
  }
  HEAP32[a + 40 >> 2] = 0;
  HEAP32[a + 36 >> 2] = 65535;
  return HEAP32[a + 48 >> 2] = 0
}
_Mmcop5.X = 1;
function _Mmcop1(a, c, b) {
  var d, b = _FindDpbPic(a, c - b, 1), c = 0 > (b | 0) ? 1 : 2;
  1 == c ? d = 1 : 2 == c && (HEAP32[HEAP32[a >> 2] + 40 * b + 20 >> 2] = 0, HEAP32[a + 40 >> 2] -= 1, c = 0 != (HEAP32[HEAP32[a >> 2] + 40 * b + 24 >> 2] | 0) ? 4 : 3, 3 == c && (HEAP32[a + 44 >> 2] -= 1), d = 0);
  return d
}
_Mmcop1.X = 1;
function _Mmcop2(a, c) {
  var b, d, e;
  e = _FindDpbPic(a, c, 0);
  b = 0 > (e | 0) ? 1 : 2;
  1 == b ? d = 1 : 2 == b && (HEAP32[HEAP32[a >> 2] + 40 * e + 20 >> 2] = 0, HEAP32[a + 40 >> 2] -= 1, b = 0 != (HEAP32[HEAP32[a >> 2] + 40 * e + 24 >> 2] | 0) ? 4 : 3, 3 == b && (HEAP32[a + 44 >> 2] -= 1), d = 0);
  return d
}
function _Mmcop3(a, c, b, d) {
  var e, f, g;
  e = 65535 == (HEAP32[a + 36 >> 2] | 0) ? 2 : 1;
  a:do {
    if(1 == e) {
      if(d >>> 0 > HEAPU32[a + 36 >> 2] >>> 0) {
        e = 2;
        break a
      }
      g = 0;
      b:for(;;) {
        if(!(g >>> 0 < HEAPU32[a + 24 >> 2] >>> 0)) {
          break b
        }
        e = 3 == (HEAP32[HEAP32[a >> 2] + 40 * g + 20 >> 2] | 0) ? 6 : 10;
        c:do {
          if(6 == e) {
            if((HEAP32[HEAP32[a >> 2] + 40 * g + 8 >> 2] | 0) != (d | 0)) {
              break c
            }
            HEAP32[HEAP32[a >> 2] + 40 * g + 20 >> 2] = 0;
            HEAP32[a + 40 >> 2] -= 1;
            e = 0 != (HEAP32[HEAP32[a >> 2] + 40 * g + 24 >> 2] | 0) ? 9 : 8;
            8 == e && (HEAP32[a + 44 >> 2] -= 1);
            break b
          }
        }while(0);
        g += 1
      }
      e = c - b;
      g = _FindDpbPic(a, e, 1);
      e = 0 > (g | 0) ? 13 : 14;
      do {
        if(13 == e) {
          f = 1;
          e = 17;
          break a
        }else {
          if(14 == e) {
            e = 1 < HEAPU32[HEAP32[a >> 2] + 40 * g + 20 >> 2] >>> 0 ? 16 : 15;
            do {
              if(16 == e) {
                HEAP32[HEAP32[a >> 2] + 40 * g + 20 >> 2] = 3;
                HEAP32[HEAP32[a >> 2] + 40 * g + 8 >> 2] = d;
                f = 0;
                e = 17;
                break a
              }else {
                if(15 == e) {
                  f = 1;
                  e = 17;
                  break a
                }
              }
            }while(0)
          }
        }
      }while(0)
    }
  }while(0);
  2 == e && (f = 1);
  return f
}
_Mmcop3.X = 1;
function _Mmcop4(a, c) {
  var b, d;
  HEAP32[a + 36 >> 2] = c;
  d = 0;
  a:for(;;) {
    if(!(d >>> 0 < HEAPU32[a + 24 >> 2] >>> 0)) {
      break a
    }
    b = 3 == (HEAP32[HEAP32[a >> 2] + 40 * d + 20 >> 2] | 0) ? 3 : 8;
    b:do {
      if(3 == b) {
        b = HEAPU32[HEAP32[a >> 2] + 40 * d + 8 >> 2] >>> 0 > c >>> 0 ? 5 : 4;
        do {
          if(4 == b && 65535 != (HEAP32[a + 36 >> 2] | 0)) {
            break b
          }
        }while(0);
        HEAP32[HEAP32[a >> 2] + 40 * d + 20 >> 2] = 0;
        HEAP32[a + 40 >> 2] -= 1;
        b = 0 != (HEAP32[HEAP32[a >> 2] + 40 * d + 24 >> 2] | 0) ? 7 : 6;
        6 == b && (HEAP32[a + 44 >> 2] -= 1)
      }
    }while(0);
    d += 1
  }
  return 0
}
_Mmcop4.X = 1;
function _Mmcop6(a, c, b, d) {
  var e, f, g;
  e = 65535 == (HEAP32[a + 36 >> 2] | 0) ? 2 : 1;
  a:do {
    if(1 == e) {
      if(d >>> 0 > HEAPU32[a + 36 >> 2] >>> 0) {
        e = 2;
        break a
      }
      g = 0;
      b:for(;;) {
        if(!(g >>> 0 < HEAPU32[a + 24 >> 2] >>> 0)) {
          break b
        }
        e = 3 == (HEAP32[HEAP32[a >> 2] + 40 * g + 20 >> 2] | 0) ? 6 : 10;
        c:do {
          if(6 == e) {
            if((HEAP32[HEAP32[a >> 2] + 40 * g + 8 >> 2] | 0) != (d | 0)) {
              break c
            }
            HEAP32[HEAP32[a >> 2] + 40 * g + 20 >> 2] = 0;
            HEAP32[a + 40 >> 2] -= 1;
            e = 0 != (HEAP32[HEAP32[a >> 2] + 40 * g + 24 >> 2] | 0) ? 9 : 8;
            8 == e && (HEAP32[a + 44 >> 2] -= 1);
            break b
          }
        }while(0);
        g += 1
      }
      e = HEAPU32[a + 40 >> 2] >>> 0 < HEAPU32[a + 24 >> 2] >>> 0 ? 13 : 17;
      do {
        if(13 == e) {
          HEAP32[HEAP32[a + 8 >> 2] + 12 >> 2] = c;
          HEAP32[HEAP32[a + 8 >> 2] + 8 >> 2] = d;
          HEAP32[HEAP32[a + 8 >> 2] + 16 >> 2] = b;
          HEAP32[HEAP32[a + 8 >> 2] + 20 >> 2] = 3;
          e = 0 != (HEAP32[a + 56 >> 2] | 0) ? 14 : 15;
          14 == e ? HEAP32[HEAP32[a + 8 >> 2] + 24 >> 2] = 0 : 15 == e && (HEAP32[HEAP32[a + 8 >> 2] + 24 >> 2] = 1);
          HEAP32[a + 40 >> 2] += 1;
          HEAP32[a + 44 >> 2] += 1;
          f = 0;
          e = 18;
          break a
        }else {
          if(17 == e) {
            f = 1;
            e = 18;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  2 == e && (f = 1);
  return f
}
_Mmcop6.X = 1;
function _SlidingWindowRefPicMarking(a) {
  var c, b, d, e, f;
  c = HEAPU32[a + 40 >> 2] >>> 0 < HEAPU32[a + 24 >> 2] >>> 0 ? 1 : 2;
  do {
    if(1 == c) {
      b = 0
    }else {
      if(2 == c) {
        d = -1;
        f = e = 0;
        b:for(;;) {
          if(!(f >>> 0 < HEAPU32[a + 40 >> 2] >>> 0)) {
            break b
          }
          c = 1 == (HEAP32[HEAP32[a >> 2] + 40 * f + 20 >> 2] | 0) ? 6 : 5;
          c:do {
            if(5 == c) {
              c = 2 == (HEAP32[HEAP32[a >> 2] + 40 * f + 20 >> 2] | 0) ? 6 : 10;
              break c
            }
          }while(0);
          do {
            if(6 == c) {
              c = (HEAP32[HEAP32[a >> 2] + 40 * f + 8 >> 2] | 0) < (e | 0) ? 8 : 7;
              d:do {
                if(7 == c) {
                  c = -1 == (d | 0) ? 8 : 9;
                  break d
                }
              }while(0);
              8 == c && (d = f, e = HEAP32[HEAP32[a >> 2] + 40 * f + 8 >> 2])
            }
          }while(0);
          f += 1
        }
        c = 0 <= (d | 0) ? 13 : 16;
        13 == c ? (HEAP32[HEAP32[a >> 2] + 40 * d + 20 >> 2] = 0, HEAP32[a + 40 >> 2] -= 1, c = 0 != (HEAP32[HEAP32[a >> 2] + 40 * d + 24 >> 2] | 0) ? 15 : 14, 14 == c && (HEAP32[a + 44 >> 2] -= 1), b = 0) : 16 == c && (b = 1)
      }
    }
  }while(0);
  return b
}
_SlidingWindowRefPicMarking.X = 1;
function _h264bsdGetRefPicData(a, c) {
  var b, d;
  b = 16 < c >>> 0 ? 2 : 1;
  a:do {
    if(1 == b) {
      if(0 == (HEAP32[HEAP32[a + 4 >> 2] + (c << 2) >> 2] | 0)) {
        b = 2;
        break a
      }
      b = 1 < HEAPU32[HEAP32[HEAP32[a + 4 >> 2] + (c << 2) >> 2] + 20 >> 2] >>> 0 ? 5 : 4;
      do {
        if(5 == b) {
          d = HEAP32[HEAP32[HEAP32[a + 4 >> 2] + (c << 2) >> 2] >> 2];
          b = 6;
          break a
        }else {
          if(4 == b) {
            d = 0;
            b = 6;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  2 == b && (d = 0);
  return d
}
function _h264bsdAllocateDpbImage(a) {
  HEAP32[a + 8 >> 2] = HEAP32[a >> 2] + 40 * HEAP32[a + 28 >> 2];
  return HEAP32[HEAP32[a + 8 >> 2] >> 2]
}
function _OutputPicture(a) {
  var c, b, d;
  c = 0 != (HEAP32[a + 56 >> 2] | 0) ? 1 : 2;
  1 == c ? b = 1 : 2 == c && (d = _FindSmallestPicOrderCnt(a), c = 0 == (d | 0) ? 3 : 4, 3 == c ? b = 1 : 4 == c && (HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) >> 2] = HEAP32[d >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 12 >> 2] = HEAP32[d + 36 >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 4 >> 2] = HEAP32[d + 28 >> 2], HEAP32[HEAP32[a + 12 >> 2] + (HEAP32[a + 16 >> 2] << 4) + 8 >> 2] = HEAP32[d + 32 >> 2], HEAP32[a + 16 >> 2] += 1, HEAP32[d + 
  24 >> 2] = 0, c = 0 != (HEAP32[d + 20 >> 2] | 0) ? 6 : 5, 5 == c && (HEAP32[a + 44 >> 2] -= 1), b = 0));
  return b
}
_OutputPicture.X = 1;
function _ShellSort(a, c) {
  var b = STACKTOP;
  STACKTOP += 40;
  var d, e, f, g;
  g = 7;
  a:for(;;) {
    if(0 == (g | 0)) {
      break a
    }
    e = g;
    b:for(;;) {
      if(!(e >>> 0 < c >>> 0)) {
        break b
      }
      f = b;
      var h, j, l;
      d = a + 40 * e;
      h = f;
      j = d + 40;
      if(h % 4 == d % 4) {
        for(;0 !== d % 4 && d < j;) {
          HEAP8[h++] = HEAP8[d++]
        }
        d >>= 2;
        h >>= 2;
        for(l = j >> 2;d < l;) {
          HEAP32[h++] = HEAP32[d++]
        }
        d <<= 2;
        h <<= 2
      }
      for(;d < j;) {
        HEAP8[h++] = HEAP8[d++]
      }
      f = e;
      c:for(;;) {
        if(f >>> 0 >= g >>> 0) {
          d = 6
        }else {
          var k = 0;
          d = 7
        }
        6 == d && (k = 0 < (_ComparePictures(a + 40 * f + 40 * -g, b) | 0));
        if(!k) {
          break c
        }
        d = a + 40 * (f - g);
        h = a + 40 * f;
        j = d + 40;
        if(h % 4 == d % 4) {
          for(;0 !== d % 4 && d < j;) {
            HEAP8[h++] = HEAP8[d++]
          }
          d >>= 2;
          h >>= 2;
          for(l = j >> 2;d < l;) {
            HEAP32[h++] = HEAP32[d++]
          }
          d <<= 2;
          h <<= 2
        }
        for(;d < j;) {
          HEAP8[h++] = HEAP8[d++]
        }
        f -= g
      }
      d = b;
      h = a + 40 * f;
      j = d + 40;
      if(h % 4 == d % 4) {
        for(;0 !== d % 4 && d < j;) {
          HEAP8[h++] = HEAP8[d++]
        }
        d >>= 2;
        h >>= 2;
        for(l = j >> 2;d < l;) {
          HEAP32[h++] = HEAP32[d++]
        }
        d <<= 2;
        h <<= 2
      }
      for(;d < j;) {
        HEAP8[h++] = HEAP8[d++]
      }
      e += 1
    }
    g >>>= 1
  }
  STACKTOP = b
}
_ShellSort.X = 1;
function _h264bsdInitDpb(a, c, b, d, e, f) {
  var g, h;
  HEAP32[a + 36 >> 2] = 65535;
  g = 1 < d >>> 0 ? 1 : 2;
  if(1 == g) {
    var j = d
  }else {
    2 == g && (j = 1)
  }
  HEAP32[a + 24 >> 2] = j;
  g = 0 != (f | 0) ? 4 : 5;
  4 == g ? HEAP32[a + 28 >> 2] = HEAP32[a + 24 >> 2] : 5 == g && (HEAP32[a + 28 >> 2] = b);
  HEAP32[a + 32 >> 2] = e;
  HEAP32[a + 56 >> 2] = f;
  HEAP32[a + 44 >> 2] = 0;
  HEAP32[a + 40 >> 2] = 0;
  HEAP32[a + 48 >> 2] = 0;
  g = _H264SwDecMalloc(680);
  HEAP32[a >> 2] = g;
  g = 0 == (HEAP32[a >> 2] | 0) ? 7 : 8;
  a:do {
    if(7 == g) {
      h = 65535
    }else {
      if(8 == g) {
        _H264SwDecMemset(HEAP32[a >> 2], 0, 680);
        b = 0;
        for(;;) {
          g = b >>> 0 < HEAP32[a + 28 >> 2] + 1 >>> 0 ? 10 : 14;
          do {
            if(10 == g) {
              g = _H264SwDecMalloc(384 * c + 47);
              HEAP32[HEAP32[a >> 2] + 40 * b + 4 >> 2] = g;
              g = 0 == (HEAP32[HEAP32[a >> 2] + 40 * b + 4 >> 2] | 0) ? 11 : 12;
              do {
                if(11 == g) {
                  h = 65535;
                  break a
                }else {
                  12 == g && (HEAP32[HEAP32[a >> 2] + 40 * b >> 2] = HEAP32[HEAP32[a >> 2] + 40 * b + 4 >> 2] + Math.floor((16 - HEAP32[HEAP32[a >> 2] + 40 * b + 4 >> 2] & 15) >>> 0), b += 1)
                }
              }while(0)
            }else {
              if(14 == g) {
                c = _H264SwDecMalloc(68);
                HEAP32[a + 4 >> 2] = c;
                c = _H264SwDecMalloc(HEAP32[a + 28 >> 2] + 1 << 4);
                HEAP32[a + 12 >> 2] = c;
                g = 0 == (HEAP32[a + 4 >> 2] | 0) ? 16 : 15;
                d:do {
                  if(15 == g) {
                    if(0 == (HEAP32[a + 12 >> 2] | 0)) {
                      break d
                    }
                    _H264SwDecMemset(HEAP32[a + 4 >> 2], 0, 68);
                    HEAP32[a + 20 >> 2] = 0;
                    h = HEAP32[a + 16 >> 2] = 0;
                    break a
                  }
                }while(0);
                h = 65535;
                break a
              }
            }
          }while(0)
        }
      }
    }
  }while(0);
  return h
}
_h264bsdInitDpb.X = 1;
function _h264bsdFreeDpb(a) {
  var c, b;
  c = 0 != (HEAP32[a >> 2] | 0) ? 1 : 6;
  do {
    if(1 == c) {
      b = 0;
      b:for(;;) {
        if(!(b >>> 0 < HEAP32[a + 28 >> 2] + 1 >>> 0)) {
          break b
        }
        _H264SwDecFree(HEAP32[HEAP32[a >> 2] + 40 * b + 4 >> 2]);
        HEAP32[HEAP32[a >> 2] + 40 * b + 4 >> 2] = 0;
        b += 1
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
  var c;
  c = 0;
  a:for(;;) {
    if(!(c >>> 0 < HEAPU32[a + 40 >> 2] >>> 0)) {
      break a
    }
    HEAP32[HEAP32[a + 4 >> 2] + (c << 2) >> 2] = HEAP32[a >> 2] + 40 * c;
    c += 1
  }
}
function _h264bsdDpbOutputPicture(a) {
  var c, b;
  c = HEAPU32[a + 20 >> 2] >>> 0 < HEAPU32[a + 16 >> 2] >>> 0 ? 1 : 2;
  1 == c ? (c = HEAP32[a + 12 >> 2], b = HEAP32[a + 20 >> 2], HEAP32[a + 20 >> 2] = b + 1, b = c + (b << 4)) : 2 == c && (b = 0);
  return b
}
function _ComparePictures(a, c) {
  var b, d;
  b = 0 != (HEAP32[a + 20 >> 2] | 0) ? 9 : 1;
  a:do {
    if(1 == b) {
      if(0 != (HEAP32[c + 20 >> 2] | 0)) {
        b = 9;
        break a
      }
      b = 0 != (HEAP32[a + 24 >> 2] | 0) ? 3 : 5;
      b:do {
        if(3 == b) {
          if(0 != (HEAP32[c + 24 >> 2] | 0)) {
            break b
          }
          d = -1;
          b = 33;
          break a
        }
      }while(0);
      b = 0 != (HEAP32[a + 24 >> 2] | 0) ? 8 : 6;
      b:do {
        if(6 == b) {
          if(0 == (HEAP32[c + 24 >> 2] | 0)) {
            break b
          }
          d = 1;
          b = 33;
          break a
        }
      }while(0);
      d = 0;
      b = 33;
      break a
    }
  }while(0);
  a:do {
    if(9 == b) {
      b = 0 != (HEAP32[c + 20 >> 2] | 0) ? 11 : 10;
      do {
        if(11 == b) {
          b = 0 != (HEAP32[a + 20 >> 2] | 0) ? 13 : 12;
          do {
            if(13 == b) {
              b = 1 == (HEAP32[a + 20 >> 2] | 0) ? 15 : 14;
              d:do {
                if(14 == b) {
                  b = 2 == (HEAP32[a + 20 >> 2] | 0) ? 15 : 22;
                  break d
                }
              }while(0);
              d:do {
                if(15 == b) {
                  b = 1 == (HEAP32[c + 20 >> 2] | 0) ? 17 : 16;
                  do {
                    if(16 == b && 2 != (HEAP32[c + 20 >> 2] | 0)) {
                      break d
                    }
                  }while(0);
                  b = (HEAP32[a + 8 >> 2] | 0) > (HEAP32[c + 8 >> 2] | 0) ? 18 : 19;
                  do {
                    if(18 == b) {
                      d = -1;
                      break a
                    }else {
                      if(19 == b) {
                        b = (HEAP32[a + 8 >> 2] | 0) < (HEAP32[c + 8 >> 2] | 0) ? 20 : 21;
                        do {
                          if(20 == b) {
                            d = 1;
                            break a
                          }else {
                            if(21 == b) {
                              d = 0;
                              break a
                            }
                          }
                        }while(0)
                      }
                    }
                  }while(0)
                }
              }while(0);
              b = 1 == (HEAP32[a + 20 >> 2] | 0) ? 24 : 23;
              d:do {
                if(23 == b) {
                  if(2 == (HEAP32[a + 20 >> 2] | 0)) {
                    break d
                  }
                  b = 1 == (HEAP32[c + 20 >> 2] | 0) ? 27 : 26;
                  e:do {
                    if(26 == b) {
                      if(2 == (HEAP32[c + 20 >> 2] | 0)) {
                        break e
                      }
                      b = (HEAP32[a + 8 >> 2] | 0) > (HEAP32[c + 8 >> 2] | 0) ? 29 : 30;
                      do {
                        if(29 == b) {
                          d = 1;
                          break a
                        }else {
                          if(30 == b) {
                            b = (HEAP32[a + 8 >> 2] | 0) < (HEAP32[c + 8 >> 2] | 0) ? 31 : 32;
                            do {
                              if(31 == b) {
                                d = -1;
                                break a
                              }else {
                                if(32 == b) {
                                  d = 0;
                                  break a
                                }
                              }
                            }while(0)
                          }
                        }
                      }while(0)
                    }
                  }while(0);
                  d = 1;
                  break a
                }
              }while(0);
              d = -1
            }else {
              12 == b && (d = 1)
            }
          }while(0)
        }else {
          10 == b && (d = -1)
        }
      }while(0)
    }
  }while(0);
  return d
}
_ComparePictures.X = 1;
function _FindSmallestPicOrderCnt(a) {
  var c, b, d, e;
  d = 2147483647;
  b = e = 0;
  a:for(;;) {
    if(!(b >>> 0 <= HEAPU32[a + 28 >> 2] >>> 0)) {
      break a
    }
    c = 0 != (HEAP32[HEAP32[a >> 2] + 40 * b + 24 >> 2] | 0) ? 3 : 5;
    b:do {
      if(3 == c) {
        if(!((HEAP32[HEAP32[a >> 2] + 40 * b + 16 >> 2] | 0) < (d | 0))) {
          break b
        }
        e = HEAP32[a >> 2] + 40 * b;
        d = HEAP32[HEAP32[a >> 2] + 40 * b + 16 >> 2]
      }
    }while(0);
    b += 1
  }
  return e
}
_FindSmallestPicOrderCnt.X = 1;
function _h264bsdResetDpb(a, c, b, d, e, f) {
  _h264bsdFreeDpb(a);
  return _h264bsdInitDpb(a, c, b, d, e, f)
}
function _h264bsdCheckGapsInFrameNum(a, c, b, d) {
  var e, f;
  HEAP32[a + 16 >> 2] = 0;
  HEAP32[a + 20 >> 2] = 0;
  d = 0 != (d | 0) ? 2 : 1;
  a:do {
    if(2 == d) {
      d = (c | 0) != (HEAP32[a + 48 >> 2] | 0) ? 3 : 27;
      b:do {
        if(3 == d) {
          if((c | 0) == ((HEAP32[a + 48 >> 2] + 1 >>> 0) % (HEAPU32[a + 32 >> 2] >>> 0) | 0)) {
            d = 27;
            break b
          }
          f = (HEAP32[a + 48 >> 2] + 1 >>> 0) % (HEAPU32[a + 32 >> 2] >>> 0);
          e = HEAP32[HEAP32[a >> 2] + 40 * HEAP32[a + 28 >> 2] >> 2];
          c:for(;;) {
            _SetPicNums(a, f);
            d = 0 != (_SlidingWindowRefPicMarking(a) | 0) ? 6 : 7;
            do {
              if(6 == d) {
                e = 1;
                break a
              }else {
                if(7 == d) {
                  e:for(;;) {
                    if(!(HEAPU32[a + 44 >> 2] >>> 0 >= HEAPU32[a + 28 >> 2] >>> 0)) {
                      break e
                    }
                    _OutputPicture(a)
                  }
                  HEAP32[HEAP32[a >> 2] + 40 * HEAP32[a + 28 >> 2] + 20 >> 2] = 1;
                  HEAP32[HEAP32[a >> 2] + 40 * HEAP32[a + 28 >> 2] + 12 >> 2] = f;
                  HEAP32[HEAP32[a >> 2] + 40 * HEAP32[a + 28 >> 2] + 8 >> 2] = f;
                  HEAP32[HEAP32[a >> 2] + 40 * HEAP32[a + 28 >> 2] + 16 >> 2] = 0;
                  HEAP32[HEAP32[a >> 2] + 40 * HEAP32[a + 28 >> 2] + 24 >> 2] = 0;
                  HEAP32[a + 44 >> 2] += 1;
                  HEAP32[a + 40 >> 2] += 1;
                  _ShellSort(HEAP32[a >> 2], HEAP32[a + 28 >> 2] + 1);
                  f = (f + 1 >>> 0) % (HEAPU32[a + 32 >> 2] >>> 0);
                  if((f | 0) == (c | 0)) {
                    break c
                  }
                }
              }
            }while(0)
          }
          d = 0 != (HEAP32[a + 16 >> 2] | 0) ? 13 : 26;
          do {
            if(13 == d) {
              f = 0;
              d:for(;;) {
                if(!(f >>> 0 < HEAPU32[a + 16 >> 2] >>> 0)) {
                  d = 25;
                  break d
                }
                if((HEAP32[HEAP32[a + 12 >> 2] + (f << 4) >> 2] | 0) == (HEAP32[HEAP32[a >> 2] + 40 * HEAP32[a + 28 >> 2] >> 2] | 0)) {
                  d = 16;
                  break d
                }
                f += 1
              }
              do {
                if(16 == d) {
                  f = 0;
                  e:for(;;) {
                    if(!(f >>> 0 < HEAPU32[a + 28 >> 2] >>> 0)) {
                      break e
                    }
                    d = (HEAP32[HEAP32[a >> 2] + 40 * f >> 2] | 0) == (e | 0) ? 19 : 20;
                    do {
                      if(19 == d) {
                        HEAP32[HEAP32[a >> 2] + 40 * f >> 2] = HEAP32[HEAP32[a >> 2] + 40 * HEAP32[a + 28 >> 2] >> 2];
                        HEAP32[HEAP32[a >> 2] + 40 * HEAP32[a + 28 >> 2] >> 2] = e;
                        break e
                      }else {
                        20 == d && (f += 1)
                      }
                    }while(0)
                  }
                }
              }while(0)
            }
          }while(0);
          d = 31;
          break b
        }
      }while(0);
      do {
        if(27 == d) {
          d = 0 != (b | 0) ? 28 : 30;
          c:do {
            if(28 == d) {
              if((c | 0) != (HEAP32[a + 48 >> 2] | 0)) {
                break c
              }
              e = 1;
              break a
            }
          }while(0)
        }
      }while(0);
      d = 0 != (b | 0) ? 32 : 33;
      32 == d ? HEAP32[a + 48 >> 2] = c : 33 == d && (d = (c | 0) != (HEAP32[a + 48 >> 2] | 0) ? 34 : 35, 34 == d && (HEAP32[a + 48 >> 2] = (c + HEAP32[a + 32 >> 2] - 1 >>> 0) % (HEAPU32[a + 32 >> 2] >>> 0)));
      e = 0
    }else {
      1 == d && (e = 0)
    }
  }while(0);
  return e
}
_h264bsdCheckGapsInFrameNum.X = 1;
function _h264bsdFlushDpb(a) {
  var c;
  c = 0 != (HEAP32[a >> 2] | 0) ? 1 : 5;
  do {
    if(1 == c) {
      HEAP32[a + 60 >> 2] = 1;
      b:for(;;) {
        if(0 != (_OutputPicture(a) | 0)) {
          break b
        }
      }
    }
  }while(0)
}
function _h264bsdWriteMacroblock(a, c) {
  var b, d, e, f, g, h, j, l;
  d = HEAP32[a + 4 >> 2];
  e = HEAP32[a + 12 >> 2];
  f = HEAP32[a + 16 >> 2];
  g = HEAP32[a + 20 >> 2];
  h = c;
  d <<= 2;
  b = 16;
  a:for(;;) {
    if(0 == (b | 0)) {
      break a
    }
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
    e += d - 4 << 2;
    b -= 1
  }
  d >>>= 1;
  b = 8;
  a:for(;;) {
    if(0 == (b | 0)) {
      break a
    }
    e = h;
    h = e + 4;
    j = HEAP32[e >> 2];
    e = h;
    h = e + 4;
    l = HEAP32[e >> 2];
    e = f;
    f = e + 4;
    HEAP32[e >> 2] = j;
    e = f;
    f = e + 4;
    HEAP32[e >> 2] = l;
    f += d - 2 << 2;
    b -= 1
  }
  b = 8;
  a:for(;;) {
    if(0 == (b | 0)) {
      break a
    }
    f = h;
    h = f + 4;
    j = HEAP32[f >> 2];
    f = h;
    h = f + 4;
    l = HEAP32[f >> 2];
    f = g;
    g = f + 4;
    HEAP32[f >> 2] = j;
    f = g;
    g = f + 4;
    HEAP32[f >> 2] = l;
    g += d - 2 << 2;
    b -= 1
  }
}
_h264bsdWriteMacroblock.X = 1;
function _h264bsdWriteOutputBlocks(a, c, b, d) {
  var e, f, g, h, j, l, k, m, o, q, p, n;
  n = _h264bsdClip + 512;
  g = HEAP32[a + 4 >> 2];
  e = g * HEAP32[a + 8 >> 2];
  j = Math.floor((c >>> 0) / (g >>> 0));
  c = (c >>> 0) % (g >>> 0);
  h = HEAP32[a >> 2] + (j * g << 8) + (c << 4);
  a = HEAP32[a >> 2] + (e << 8) + (j * g << 6) + (c << 3);
  j = a + (e << 6);
  g <<= 4;
  k = 0;
  a:for(;;) {
    if(!(16 > k >>> 0)) {
      break a
    }
    m = HEAP32[_h264bsdBlockX + (k << 2) >> 2];
    f = HEAP32[_h264bsdBlockY + (k << 2) >> 2];
    o = d + (k << 6);
    l = b + (f << 4) + m;
    c = h + f * g + m;
    e = 16777215 == (HEAP32[o >> 2] | 0) ? 3 : 4;
    do {
      if(3 == e) {
        f = l, p = c, m = HEAP32[f >> 2], f += 16, q = HEAP32[f >> 2], f += 16, HEAP32[p >> 2] = m, p += Math.floor((g >>> 0) / 4) << 2, HEAP32[p >> 2] = q, p += Math.floor((g >>> 0) / 4) << 2, m = HEAP32[f >> 2], f += 16, q = HEAP32[f >> 2], HEAP32[p >> 2] = m, p += Math.floor((g >>> 0) / 4) << 2, HEAP32[p >> 2] = q
      }else {
        if(4 == e) {
          f = 4;
          c:for(;;) {
            if(0 == (f | 0)) {
              break c
            }
            m = HEAPU8[l] & 255;
            p = o;
            o = p + 4;
            q = HEAP32[p >> 2];
            p = HEAPU8[l + 1] & 255;
            m = HEAPU8[n + (m + q)] & 255;
            q = o;
            o = q + 4;
            q = HEAP32[q >> 2];
            HEAP8[c] = m & 255;
            p = HEAPU8[n + (p + q)] & 255;
            m = HEAPU8[l + 2] & 255;
            q = o;
            o = q + 4;
            q = HEAP32[q >> 2];
            HEAP8[c + 1] = p & 255;
            m = HEAPU8[n + (m + q)] & 255;
            p = HEAPU8[l + 3] & 255;
            q = o;
            o = q + 4;
            q = HEAP32[q >> 2];
            HEAP8[c + 2] = m & 255;
            p = HEAPU8[n + (p + q)] & 255;
            l += 16;
            HEAP8[c + 3] = p & 255;
            c += g;
            f -= 1
          }
        }
      }
    }while(0);
    k += 1
  }
  g = Math.floor((g >>> 0) / 2);
  k = 16;
  a:for(;;) {
    if(!(23 >= k >>> 0)) {
      break a
    }
    m = HEAP32[_h264bsdBlockX + ((k & 3) << 2) >> 2];
    f = HEAP32[_h264bsdBlockY + ((k & 3) << 2) >> 2];
    o = d + (k << 6);
    l = b + 256;
    c = a;
    e = 20 <= k >>> 0 ? 14 : 15;
    14 == e && (c = j, l += 64);
    l += (f << 3) + m;
    c += f * g + m;
    e = 16777215 == (HEAP32[o >> 2] | 0) ? 16 : 17;
    do {
      if(16 == e) {
        h = l, f = c, m = HEAP32[h >> 2], h += 8, q = HEAP32[h >> 2], h += 8, HEAP32[f >> 2] = m, f += Math.floor((g >>> 0) / 4) << 2, HEAP32[f >> 2] = q, f += Math.floor((g >>> 0) / 4) << 2, m = HEAP32[h >> 2], h += 8, q = HEAP32[h >> 2], HEAP32[f >> 2] = m, f += Math.floor((g >>> 0) / 4) << 2, HEAP32[f >> 2] = q
      }else {
        if(17 == e) {
          f = 4;
          c:for(;;) {
            if(0 == (f | 0)) {
              break c
            }
            m = HEAPU8[l] & 255;
            h = o;
            o = h + 4;
            q = HEAP32[h >> 2];
            p = HEAPU8[l + 1] & 255;
            m = HEAPU8[n + (m + q)] & 255;
            h = o;
            o = h + 4;
            q = HEAP32[h >> 2];
            HEAP8[c] = m & 255;
            p = HEAPU8[n + (p + q)] & 255;
            m = HEAPU8[l + 2] & 255;
            h = o;
            o = h + 4;
            q = HEAP32[h >> 2];
            HEAP8[c + 1] = p & 255;
            m = HEAPU8[n + (m + q)] & 255;
            p = HEAPU8[l + 3] & 255;
            h = o;
            o = h + 4;
            q = HEAP32[h >> 2];
            HEAP8[c + 2] = m & 255;
            p = HEAPU8[n + (p + q)] & 255;
            l += 8;
            HEAP8[c + 3] = p & 255;
            c += g;
            f -= 1
          }
        }
      }
    }while(0);
    k += 1
  }
}
_h264bsdWriteOutputBlocks.X = 1;
function _InnerBoundaryStrength2(a, c, b) {
  var d, e, f, g, h;
  d = HEAP16[a + 132 + (c << 2) >> 1] << 16 >> 16;
  f = HEAP16[a + 132 + (b << 2) >> 1] << 16 >> 16;
  g = HEAP16[a + 132 + (c << 2) + 2 >> 1] << 16 >> 16;
  h = HEAP16[a + 132 + (b << 2) + 2 >> 1] << 16 >> 16;
  d = 4 <= (_abs(d - f) | 0) ? 3 : 1;
  a:do {
    if(1 == d) {
      if(4 <= (_abs(g - h) | 0)) {
        d = 3;
        break a
      }
      if((HEAP32[a + 116 + (c >>> 2 << 2) >> 2] | 0) != (HEAP32[a + 116 + (b >>> 2 << 2) >> 2] | 0)) {
        d = 3;
        break a
      }
      e = 0;
      d = 5;
      break a
    }
  }while(0);
  3 == d && (e = 1);
  return e
}
_InnerBoundaryStrength2.X = 1;
function _h264bsdFilterPicture(a, c) {
  var b = STACKTOP;
  STACKTOP += 164;
  var d, e, f, g, h, j, l, k = b + 128;
  j = HEAP32[a + 4 >> 2];
  f = j * HEAP32[a + 8 >> 2];
  l = c;
  h = g = 0;
  a:for(;;) {
    if(!(g >>> 0 < HEAPU32[a + 8 >> 2] >>> 0)) {
      break a
    }
    e = _GetMbFilteringFlags(l);
    d = 0 != (e | 0) ? 3 : 6;
    3 == d && (d = 0 != (_GetBoundaryStrengths(l, b, e) | 0) ? 4 : 5, 4 == d && (_GetLumaEdgeThresholds(k, l, e), d = HEAP32[a >> 2] + (g * j << 8) + (h << 4), _FilterLuma(d, b, k, j << 4), _GetChromaEdgeThresholds(k, l, e, HEAP32[l + 24 >> 2]), d = HEAP32[a >> 2] + (f << 8) + (g * j << 6) + (h << 3), _FilterChroma(d, d + (f << 6), b, k, j << 3)));
    h += 1;
    d = (h | 0) == (j | 0) ? 7 : 8;
    7 == d && (h = 0, g += 1);
    l += 216
  }
  STACKTOP = b
}
_h264bsdFilterPicture.X = 1;
function _GetMbFilteringFlags(a) {
  var c, b;
  b = 0;
  c = 1 != (HEAP32[a + 8 >> 2] | 0) ? 1 : 10;
  do {
    if(1 == c) {
      b |= 1;
      c = 0 != (HEAP32[a + 200 >> 2] | 0) ? 2 : 5;
      b:do {
        if(2 == c) {
          c = 2 != (HEAP32[a + 8 >> 2] | 0) ? 4 : 3;
          do {
            if(3 == c && 0 != (_IsSliceBoundaryOnLeft(a) | 0)) {
              break b
            }
          }while(0);
          b |= 4
        }
      }while(0);
      c = 0 != (HEAP32[a + 204 >> 2] | 0) ? 6 : 9;
      b:do {
        if(6 == c) {
          c = 2 != (HEAP32[a + 8 >> 2] | 0) ? 8 : 7;
          do {
            if(7 == c && 0 != (_IsSliceBoundaryOnTop(a) | 0)) {
              break b
            }
          }while(0);
          b |= 2
        }
      }while(0)
    }
  }while(0);
  return b
}
_GetMbFilteringFlags.X = 1;
function _GetBoundaryStrengths(a, c, b) {
  var d, e;
  e = 0;
  d = 0 != (b & 2 | 0) ? 1 : 11;
  do {
    if(1 == d) {
      d = 5 < HEAPU32[a >> 2] >>> 0 ? 3 : 2;
      b:do {
        if(2 == d) {
          if(5 < HEAPU32[HEAP32[a + 204 >> 2] >> 2] >>> 0) {
            d = 3;
            break b
          }
          d = _EdgeBoundaryStrength(a, HEAP32[a + 204 >> 2], 0, 10);
          HEAP32[c >> 2] = d;
          d = _EdgeBoundaryStrength(a, HEAP32[a + 204 >> 2], 1, 11);
          HEAP32[c + 8 >> 2] = d;
          d = _EdgeBoundaryStrength(a, HEAP32[a + 204 >> 2], 4, 14);
          HEAP32[c + 16 >> 2] = d;
          d = _EdgeBoundaryStrength(a, HEAP32[a + 204 >> 2], 5, 15);
          HEAP32[c + 24 >> 2] = d;
          d = 0 != (HEAP32[c >> 2] | 0) ? 8 : 5;
          c:do {
            if(5 == d) {
              if(0 != (HEAP32[c + 8 >> 2] | 0)) {
                d = 8;
                break c
              }
              if(0 != (HEAP32[c + 16 >> 2] | 0)) {
                d = 8;
                break c
              }
              d = 0 != (HEAP32[c + 24 >> 2] | 0) ? 8 : 9;
              break c
            }
          }while(0);
          8 == d && (e = 1);
          d = 10;
          break b
        }
      }while(0);
      3 == d && (HEAP32[c + 24 >> 2] = 4, HEAP32[c + 16 >> 2] = 4, HEAP32[c + 8 >> 2] = 4, HEAP32[c >> 2] = 4, e = 1)
    }else {
      11 == d && (HEAP32[c + 24 >> 2] = 0, HEAP32[c + 16 >> 2] = 0, HEAP32[c + 8 >> 2] = 0, HEAP32[c >> 2] = 0)
    }
  }while(0);
  d = 0 != (b & 4 | 0) ? 13 : 24;
  do {
    if(13 == d) {
      d = 5 < HEAPU32[a >> 2] >>> 0 ? 15 : 14;
      b:do {
        if(14 == d) {
          if(5 < HEAPU32[HEAP32[a + 200 >> 2] >> 2] >>> 0) {
            d = 15;
            break b
          }
          b = _EdgeBoundaryStrength(a, HEAP32[a + 200 >> 2], 0, 5);
          HEAP32[c + 4 >> 2] = b;
          b = _EdgeBoundaryStrength(a, HEAP32[a + 200 >> 2], 2, 7);
          HEAP32[c + 36 >> 2] = b;
          b = _EdgeBoundaryStrength(a, HEAP32[a + 200 >> 2], 8, 13);
          HEAP32[c + 68 >> 2] = b;
          b = _EdgeBoundaryStrength(a, HEAP32[a + 200 >> 2], 10, 15);
          HEAP32[c + 100 >> 2] = b;
          d = 0 != (e | 0) ? 22 : 17;
          c:do {
            if(17 == d) {
              d = 0 != (HEAP32[c + 4 >> 2] | 0) ? 21 : 18;
              d:do {
                if(18 == d) {
                  if(0 != (HEAP32[c + 36 >> 2] | 0)) {
                    break d
                  }
                  if(0 != (HEAP32[c + 68 >> 2] | 0)) {
                    break d
                  }
                  if(0 == (HEAP32[c + 100 >> 2] | 0)) {
                    break c
                  }
                }
              }while(0);
              e = 1
            }
          }while(0);
          d = 23;
          break b
        }
      }while(0);
      15 == d && (HEAP32[c + 100 >> 2] = 4, HEAP32[c + 68 >> 2] = 4, HEAP32[c + 36 >> 2] = 4, HEAP32[c + 4 >> 2] = 4, e = 1)
    }else {
      24 == d && (HEAP32[c + 100 >> 2] = 0, HEAP32[c + 68 >> 2] = 0, HEAP32[c + 36 >> 2] = 0, HEAP32[c + 4 >> 2] = 0)
    }
  }while(0);
  d = 5 < HEAPU32[a >> 2] >>> 0 ? 26 : 27;
  do {
    if(26 == d) {
      HEAP32[c + 120 >> 2] = 3, HEAP32[c + 112 >> 2] = 3, HEAP32[c + 104 >> 2] = 3, HEAP32[c + 96 >> 2] = 3, HEAP32[c + 88 >> 2] = 3, HEAP32[c + 80 >> 2] = 3, HEAP32[c + 72 >> 2] = 3, HEAP32[c + 64 >> 2] = 3, HEAP32[c + 56 >> 2] = 3, HEAP32[c + 48 >> 2] = 3, HEAP32[c + 40 >> 2] = 3, HEAP32[c + 32 >> 2] = 3, HEAP32[c + 124 >> 2] = 3, HEAP32[c + 116 >> 2] = 3, HEAP32[c + 108 >> 2] = 3, HEAP32[c + 92 >> 2] = 3, HEAP32[c + 84 >> 2] = 3, HEAP32[c + 76 >> 2] = 3, HEAP32[c + 60 >> 2] = 3, HEAP32[c + 52 >> 
      2] = 3, HEAP32[c + 44 >> 2] = 3, HEAP32[c + 28 >> 2] = 3, HEAP32[c + 20 >> 2] = 3, HEAP32[c + 12 >> 2] = 3, e = 1
    }else {
      if(27 == d) {
        d = 1 == (_h264bsdNumMbPart(HEAP32[a >> 2]) | 0) ? 28 : 29;
        if(28 == d) {
          _GetBoundaryStrengthsA(a, c)
        }else {
          if(29 == d) {
            if(d = 2 == (HEAP32[a >> 2] | 0) ? 30 : 71, 30 == d) {
              if(0 != (HEAP16[a + 32 >> 1] << 16 >> 16 | 0)) {
                var f = 1;
                d = 32
              }else {
                d = 31
              }
              31 == d && (f = 0 != (HEAP16[a + 28 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 32 >> 2] = f ? 2 : 0;
              if(0 != (HEAP16[a + 34 >> 1] << 16 >> 16 | 0)) {
                var g = 1;
                d = 34
              }else {
                d = 33
              }
              33 == d && (g = 0 != (HEAP16[a + 30 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 40 >> 2] = g ? 2 : 0;
              if(0 != (HEAP16[a + 40 >> 1] << 16 >> 16 | 0)) {
                var h = 1;
                d = 36
              }else {
                d = 35
              }
              35 == d && (h = 0 != (HEAP16[a + 36 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 48 >> 2] = h ? 2 : 0;
              if(0 != (HEAP16[a + 42 >> 1] << 16 >> 16 | 0)) {
                var j = 1;
                d = 38
              }else {
                d = 37
              }
              37 == d && (j = 0 != (HEAP16[a + 38 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 56 >> 2] = j ? 2 : 0;
              if(0 != (HEAP16[a + 48 >> 1] << 16 >> 16 | 0)) {
                var l = 1;
                d = 40
              }else {
                d = 39
              }
              39 == d && (l = 0 != (HEAP16[a + 44 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 96 >> 2] = l ? 2 : 0;
              if(0 != (HEAP16[a + 50 >> 1] << 16 >> 16 | 0)) {
                var k = 1;
                d = 42
              }else {
                d = 41
              }
              41 == d && (k = 0 != (HEAP16[a + 46 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 104 >> 2] = k ? 2 : 0;
              if(0 != (HEAP16[a + 56 >> 1] << 16 >> 16 | 0)) {
                var m = 1;
                d = 44
              }else {
                d = 43
              }
              43 == d && (m = 0 != (HEAP16[a + 52 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 112 >> 2] = m ? 2 : 0;
              if(0 != (HEAP16[a + 58 >> 1] << 16 >> 16 | 0)) {
                var o = 1;
                d = 46
              }else {
                d = 45
              }
              45 == d && (o = 0 != (HEAP16[a + 54 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 120 >> 2] = o ? 2 : 0;
              b = _InnerBoundaryStrength(a, 8, 2);
              HEAP32[c + 64 >> 2] = b;
              b = _InnerBoundaryStrength(a, 9, 3);
              HEAP32[c + 72 >> 2] = b;
              b = _InnerBoundaryStrength(a, 12, 6);
              HEAP32[c + 80 >> 2] = b;
              b = _InnerBoundaryStrength(a, 13, 7);
              HEAP32[c + 88 >> 2] = b;
              if(0 != (HEAP16[a + 30 >> 1] << 16 >> 16 | 0)) {
                var q = 1;
                d = 48
              }else {
                d = 47
              }
              47 == d && (q = 0 != (HEAP16[a + 28 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 12 >> 2] = q ? 2 : 0;
              if(0 != (HEAP16[a + 36 >> 1] << 16 >> 16 | 0)) {
                var p = 1;
                d = 50
              }else {
                d = 49
              }
              49 == d && (p = 0 != (HEAP16[a + 30 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 20 >> 2] = p ? 2 : 0;
              if(0 != (HEAP16[a + 38 >> 1] << 16 >> 16 | 0)) {
                var n = 1;
                d = 52
              }else {
                d = 51
              }
              51 == d && (n = 0 != (HEAP16[a + 36 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 28 >> 2] = n ? 2 : 0;
              if(0 != (HEAP16[a + 34 >> 1] << 16 >> 16 | 0)) {
                var r = 1;
                d = 54
              }else {
                d = 53
              }
              53 == d && (r = 0 != (HEAP16[a + 32 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 44 >> 2] = r ? 2 : 0;
              if(0 != (HEAP16[a + 40 >> 1] << 16 >> 16 | 0)) {
                var s = 1;
                d = 56
              }else {
                d = 55
              }
              55 == d && (s = 0 != (HEAP16[a + 34 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 52 >> 2] = s ? 2 : 0;
              if(0 != (HEAP16[a + 42 >> 1] << 16 >> 16 | 0)) {
                var t = 1;
                d = 58
              }else {
                d = 57
              }
              57 == d && (t = 0 != (HEAP16[a + 40 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 60 >> 2] = t ? 2 : 0;
              if(0 != (HEAP16[a + 46 >> 1] << 16 >> 16 | 0)) {
                var u = 1;
                d = 60
              }else {
                d = 59
              }
              59 == d && (u = 0 != (HEAP16[a + 44 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 76 >> 2] = u ? 2 : 0;
              if(0 != (HEAP16[a + 52 >> 1] << 16 >> 16 | 0)) {
                var v = 1;
                d = 62
              }else {
                d = 61
              }
              61 == d && (v = 0 != (HEAP16[a + 46 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 84 >> 2] = v ? 2 : 0;
              if(0 != (HEAP16[a + 54 >> 1] << 16 >> 16 | 0)) {
                var w = 1;
                d = 64
              }else {
                d = 63
              }
              63 == d && (w = 0 != (HEAP16[a + 52 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 92 >> 2] = w ? 2 : 0;
              if(0 != (HEAP16[a + 50 >> 1] << 16 >> 16 | 0)) {
                var x = 1;
                d = 66
              }else {
                d = 65
              }
              65 == d && (x = 0 != (HEAP16[a + 48 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 108 >> 2] = x ? 2 : 0;
              if(0 != (HEAP16[a + 56 >> 1] << 16 >> 16 | 0)) {
                var z = 1;
                d = 68
              }else {
                d = 67
              }
              67 == d && (z = 0 != (HEAP16[a + 50 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 116 >> 2] = z ? 2 : 0;
              if(0 != (HEAP16[a + 58 >> 1] << 16 >> 16 | 0)) {
                var A = 1;
                d = 70
              }else {
                d = 69
              }
              69 == d && (A = 0 != (HEAP16[a + 56 >> 1] << 16 >> 16 | 0));
              HEAP32[c + 124 >> 2] = A ? 2 : 0
            }else {
              if(71 == d) {
                if(d = 3 == (HEAP32[a >> 2] | 0) ? 72 : 113, 72 == d) {
                  if(0 != (HEAP16[a + 32 >> 1] << 16 >> 16 | 0)) {
                    var y = 1;
                    d = 74
                  }else {
                    d = 73
                  }
                  73 == d && (y = 0 != (HEAP16[a + 28 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 32 >> 2] = y ? 2 : 0;
                  if(0 != (HEAP16[a + 34 >> 1] << 16 >> 16 | 0)) {
                    var B = 1;
                    d = 76
                  }else {
                    d = 75
                  }
                  75 == d && (B = 0 != (HEAP16[a + 30 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 40 >> 2] = B ? 2 : 0;
                  if(0 != (HEAP16[a + 40 >> 1] << 16 >> 16 | 0)) {
                    var C = 1;
                    d = 78
                  }else {
                    d = 77
                  }
                  77 == d && (C = 0 != (HEAP16[a + 36 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 48 >> 2] = C ? 2 : 0;
                  if(0 != (HEAP16[a + 42 >> 1] << 16 >> 16 | 0)) {
                    var D = 1;
                    d = 80
                  }else {
                    d = 79
                  }
                  79 == d && (D = 0 != (HEAP16[a + 38 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 56 >> 2] = D ? 2 : 0;
                  if(0 != (HEAP16[a + 44 >> 1] << 16 >> 16 | 0)) {
                    var E = 1;
                    d = 82
                  }else {
                    d = 81
                  }
                  81 == d && (E = 0 != (HEAP16[a + 32 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 64 >> 2] = E ? 2 : 0;
                  if(0 != (HEAP16[a + 46 >> 1] << 16 >> 16 | 0)) {
                    var F = 1;
                    d = 84
                  }else {
                    d = 83
                  }
                  83 == d && (F = 0 != (HEAP16[a + 34 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 72 >> 2] = F ? 2 : 0;
                  if(0 != (HEAP16[a + 52 >> 1] << 16 >> 16 | 0)) {
                    var G = 1;
                    d = 86
                  }else {
                    d = 85
                  }
                  85 == d && (G = 0 != (HEAP16[a + 40 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 80 >> 2] = G ? 2 : 0;
                  if(0 != (HEAP16[a + 54 >> 1] << 16 >> 16 | 0)) {
                    var H = 1;
                    d = 88
                  }else {
                    d = 87
                  }
                  87 == d && (H = 0 != (HEAP16[a + 42 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 88 >> 2] = H ? 2 : 0;
                  if(0 != (HEAP16[a + 48 >> 1] << 16 >> 16 | 0)) {
                    var I = 1;
                    d = 90
                  }else {
                    d = 89
                  }
                  89 == d && (I = 0 != (HEAP16[a + 44 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 96 >> 2] = I ? 2 : 0;
                  if(0 != (HEAP16[a + 50 >> 1] << 16 >> 16 | 0)) {
                    var J = 1;
                    d = 92
                  }else {
                    d = 91
                  }
                  91 == d && (J = 0 != (HEAP16[a + 46 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 104 >> 2] = J ? 2 : 0;
                  if(0 != (HEAP16[a + 56 >> 1] << 16 >> 16 | 0)) {
                    var K = 1;
                    d = 94
                  }else {
                    d = 93
                  }
                  93 == d && (K = 0 != (HEAP16[a + 52 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 112 >> 2] = K ? 2 : 0;
                  if(0 != (HEAP16[a + 58 >> 1] << 16 >> 16 | 0)) {
                    var L = 1;
                    d = 96
                  }else {
                    d = 95
                  }
                  95 == d && (L = 0 != (HEAP16[a + 54 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 120 >> 2] = L ? 2 : 0;
                  if(0 != (HEAP16[a + 30 >> 1] << 16 >> 16 | 0)) {
                    var M = 1;
                    d = 98
                  }else {
                    d = 97
                  }
                  97 == d && (M = 0 != (HEAP16[a + 28 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 12 >> 2] = M ? 2 : 0;
                  if(0 != (HEAP16[a + 38 >> 1] << 16 >> 16 | 0)) {
                    var N = 1;
                    d = 100
                  }else {
                    d = 99
                  }
                  99 == d && (N = 0 != (HEAP16[a + 36 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 28 >> 2] = N ? 2 : 0;
                  if(0 != (HEAP16[a + 34 >> 1] << 16 >> 16 | 0)) {
                    var O = 1;
                    d = 102
                  }else {
                    d = 101
                  }
                  101 == d && (O = 0 != (HEAP16[a + 32 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 44 >> 2] = O ? 2 : 0;
                  if(0 != (HEAP16[a + 42 >> 1] << 16 >> 16 | 0)) {
                    var P = 1;
                    d = 104
                  }else {
                    d = 103
                  }
                  103 == d && (P = 0 != (HEAP16[a + 40 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 60 >> 2] = P ? 2 : 0;
                  if(0 != (HEAP16[a + 46 >> 1] << 16 >> 16 | 0)) {
                    var Q = 1;
                    d = 106
                  }else {
                    d = 105
                  }
                  105 == d && (Q = 0 != (HEAP16[a + 44 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 76 >> 2] = Q ? 2 : 0;
                  if(0 != (HEAP16[a + 54 >> 1] << 16 >> 16 | 0)) {
                    var R = 1;
                    d = 108
                  }else {
                    d = 107
                  }
                  107 == d && (R = 0 != (HEAP16[a + 52 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 92 >> 2] = R ? 2 : 0;
                  if(0 != (HEAP16[a + 50 >> 1] << 16 >> 16 | 0)) {
                    var S = 1;
                    d = 110
                  }else {
                    d = 109
                  }
                  109 == d && (S = 0 != (HEAP16[a + 48 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 108 >> 2] = S ? 2 : 0;
                  if(0 != (HEAP16[a + 58 >> 1] << 16 >> 16 | 0)) {
                    var T = 1;
                    d = 112
                  }else {
                    d = 111
                  }
                  111 == d && (T = 0 != (HEAP16[a + 56 >> 1] << 16 >> 16 | 0));
                  HEAP32[c + 124 >> 2] = T ? 2 : 0;
                  b = _InnerBoundaryStrength(a, 4, 1);
                  HEAP32[c + 20 >> 2] = b;
                  b = _InnerBoundaryStrength(a, 6, 3);
                  HEAP32[c + 52 >> 2] = b;
                  b = _InnerBoundaryStrength(a, 12, 9);
                  HEAP32[c + 84 >> 2] = b;
                  b = _InnerBoundaryStrength(a, 14, 11);
                  HEAP32[c + 116 >> 2] = b
                }else {
                  113 == d && (b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 16 >> 2], HEAP32[_mb4x4Index >> 2]), HEAP32[c + 32 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 20 >> 2], HEAP32[_mb4x4Index + 4 >> 2]), HEAP32[c + 40 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 24 >> 2], HEAP32[_mb4x4Index + 8 >> 2]), HEAP32[c + 48 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 28 >> 2], HEAP32[_mb4x4Index + 12 >> 2]), HEAP32[c + 56 >> 2] = b, b = _InnerBoundaryStrength(a, 
                  HEAP32[_mb4x4Index + 32 >> 2], HEAP32[_mb4x4Index + 16 >> 2]), HEAP32[c + 64 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 36 >> 2], HEAP32[_mb4x4Index + 20 >> 2]), HEAP32[c + 72 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 40 >> 2], HEAP32[_mb4x4Index + 24 >> 2]), HEAP32[c + 80 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 44 >> 2], HEAP32[_mb4x4Index + 28 >> 2]), HEAP32[c + 88 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 
                  48 >> 2], HEAP32[_mb4x4Index + 32 >> 2]), HEAP32[c + 96 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 52 >> 2], HEAP32[_mb4x4Index + 36 >> 2]), HEAP32[c + 104 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 56 >> 2], HEAP32[_mb4x4Index + 40 >> 2]), HEAP32[c + 112 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 60 >> 2], HEAP32[_mb4x4Index + 44 >> 2]), HEAP32[c + 120 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 4 >> 2], 
                  HEAP32[_mb4x4Index >> 2]), HEAP32[c + 12 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 8 >> 2], HEAP32[_mb4x4Index + 4 >> 2]), HEAP32[c + 20 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 12 >> 2], HEAP32[_mb4x4Index + 8 >> 2]), HEAP32[c + 28 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 20 >> 2], HEAP32[_mb4x4Index + 16 >> 2]), HEAP32[c + 44 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 24 >> 2], HEAP32[_mb4x4Index + 
                  20 >> 2]), HEAP32[c + 52 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 28 >> 2], HEAP32[_mb4x4Index + 24 >> 2]), HEAP32[c + 60 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 36 >> 2], HEAP32[_mb4x4Index + 32 >> 2]), HEAP32[c + 76 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 40 >> 2], HEAP32[_mb4x4Index + 36 >> 2]), HEAP32[c + 84 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 44 >> 2], HEAP32[_mb4x4Index + 40 >> 2]), 
                  HEAP32[c + 92 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 52 >> 2], HEAP32[_mb4x4Index + 48 >> 2]), HEAP32[c + 108 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 56 >> 2], HEAP32[_mb4x4Index + 52 >> 2]), HEAP32[c + 116 >> 2] = b, b = _InnerBoundaryStrength(a, HEAP32[_mb4x4Index + 60 >> 2], HEAP32[_mb4x4Index + 56 >> 2]), HEAP32[c + 124 >> 2] = b)
                }
              }
            }
          }
        }
        d = 0 != (e | 0) ? 142 : 117;
        b:do {
          if(117 == d) {
            d = 0 != (HEAP32[c + 32 >> 2] | 0) ? 141 : 118;
            c:do {
              if(118 == d) {
                if(0 != (HEAP32[c + 40 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 48 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 56 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 64 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 72 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 80 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 88 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 96 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 104 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 112 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 120 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 12 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 20 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 28 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 44 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 52 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 60 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 76 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 84 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 92 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 108 >> 2] | 0)) {
                  break c
                }
                if(0 != (HEAP32[c + 116 >> 2] | 0)) {
                  break c
                }
                if(0 == (HEAP32[c + 124 >> 2] | 0)) {
                  break b
                }
              }
            }while(0);
            e = 1
          }
        }while(0)
      }
    }
  }while(0);
  return e
}
_GetBoundaryStrengths.X = 1;
function _FilterLuma(a, c, b, d) {
  var e, f, g;
  f = c;
  g = 0;
  c = 4;
  a:for(;;) {
    e = c;
    c = e - 1;
    if(0 == (e | 0)) {
      break a
    }
    e = 0 != (HEAP32[f + 4 >> 2] | 0) ? 3 : 4;
    3 == e && _FilterVerLumaEdge(a, HEAP32[f + 4 >> 2], b + 12, d);
    e = 0 != (HEAP32[f + 12 >> 2] | 0) ? 5 : 6;
    5 == e && _FilterVerLumaEdge(a + 4, HEAP32[f + 12 >> 2], b + 24, d);
    e = 0 != (HEAP32[f + 20 >> 2] | 0) ? 7 : 8;
    7 == e && _FilterVerLumaEdge(a + 8, HEAP32[f + 20 >> 2], b + 24, d);
    e = 0 != (HEAP32[f + 28 >> 2] | 0) ? 9 : 10;
    9 == e && _FilterVerLumaEdge(a + 12, HEAP32[f + 28 >> 2], b + 24, d);
    e = (HEAP32[f >> 2] | 0) == (HEAP32[f + 8 >> 2] | 0) ? 11 : 16;
    b:do {
      if(11 == e) {
        if((HEAP32[f + 8 >> 2] | 0) != (HEAP32[f + 16 >> 2] | 0)) {
          e = 16;
          break b
        }
        if((HEAP32[f + 16 >> 2] | 0) != (HEAP32[f + 24 >> 2] | 0)) {
          e = 16;
          break b
        }
        e = 0 != (HEAP32[f >> 2] | 0) ? 14 : 15;
        14 == e && _FilterHorLuma(a, HEAP32[f >> 2], b + 12 * g, d);
        e = 25;
        break b
      }
    }while(0);
    16 == e && (e = 0 != (HEAP32[f >> 2] | 0) ? 17 : 18, 17 == e && _FilterHorLumaEdge(a, HEAP32[f >> 2], b + 12 * g, d), e = 0 != (HEAP32[f + 8 >> 2] | 0) ? 19 : 20, 19 == e && _FilterHorLumaEdge(a + 4, HEAP32[f + 8 >> 2], b + 12 * g, d), e = 0 != (HEAP32[f + 16 >> 2] | 0) ? 21 : 22, 21 == e && _FilterHorLumaEdge(a + 8, HEAP32[f + 16 >> 2], b + 12 * g, d), e = 0 != (HEAP32[f + 24 >> 2] | 0) ? 23 : 24, 23 == e && _FilterHorLumaEdge(a + 12, HEAP32[f + 24 >> 2], b + 12 * g, d));
    a += d << 2;
    f += 32;
    g = 2
  }
}
_FilterLuma.X = 1;
function _GetLumaEdgeThresholds(a, c, b) {
  var d, e, f;
  f = HEAP32[c + 20 >> 2];
  d = _clip(0, 51, f + HEAP32[c + 12 >> 2]);
  e = _clip(0, 51, f + HEAP32[c + 16 >> 2]);
  HEAP32[a + 28 >> 2] = HEAPU8[_alphas + d] & 255;
  HEAP32[a + 32 >> 2] = HEAPU8[_betas + e] & 255;
  HEAP32[a + 24 >> 2] = _tc0 + 3 * d;
  if(1 == (0 != (b & 2 | 0) ? 1 : 5)) {
    e = HEAP32[HEAP32[c + 204 >> 2] + 20 >> 2], d = (e | 0) != (f | 0) ? 2 : 3, 2 == d ? (e = e + (f + 1) >>> 1, d = _clip(0, 51, e + HEAP32[c + 12 >> 2]), e = _clip(0, 51, e + HEAP32[c + 16 >> 2]), HEAP32[a + 4 >> 2] = HEAPU8[_alphas + d] & 255, HEAP32[a + 8 >> 2] = HEAPU8[_betas + e] & 255, HEAP32[a >> 2] = _tc0 + 3 * d) : 3 == d && (HEAP32[a + 4 >> 2] = HEAP32[a + 28 >> 2], HEAP32[a + 8 >> 2] = HEAP32[a + 32 >> 2], HEAP32[a >> 2] = HEAP32[a + 24 >> 2])
  }
  if(6 == (0 != (b & 4 | 0) ? 6 : 10)) {
    e = HEAP32[HEAP32[c + 200 >> 2] + 20 >> 2], d = (e | 0) != (f | 0) ? 7 : 8, 7 == d ? (e = e + (f + 1) >>> 1, d = _clip(0, 51, e + HEAP32[c + 12 >> 2]), e = _clip(0, 51, e + HEAP32[c + 16 >> 2]), HEAP32[a + 16 >> 2] = HEAPU8[_alphas + d] & 255, HEAP32[a + 20 >> 2] = HEAPU8[_betas + e] & 255, HEAP32[a + 12 >> 2] = _tc0 + 3 * d) : 8 == d && (HEAP32[a + 16 >> 2] = HEAP32[a + 28 >> 2], HEAP32[a + 20 >> 2] = HEAP32[a + 32 >> 2], HEAP32[a + 12 >> 2] = HEAP32[a + 24 >> 2])
  }
}
_GetLumaEdgeThresholds.X = 1;
function _GetChromaEdgeThresholds(a, c, b, d) {
  var e, f, g;
  g = HEAP32[c + 20 >> 2];
  g = _clip(0, 51, g + d);
  g = HEAP32[_h264bsdQpC + (g << 2) >> 2];
  e = _clip(0, 51, g + HEAP32[c + 12 >> 2]);
  f = _clip(0, 51, g + HEAP32[c + 16 >> 2]);
  HEAP32[a + 28 >> 2] = HEAPU8[_alphas + e] & 255;
  HEAP32[a + 32 >> 2] = HEAPU8[_betas + f] & 255;
  HEAP32[a + 24 >> 2] = _tc0 + 3 * e;
  if(1 == (0 != (b & 2 | 0) ? 1 : 5)) {
    f = HEAP32[HEAP32[c + 204 >> 2] + 20 >> 2], e = (f | 0) != (HEAP32[c + 20 >> 2] | 0) ? 2 : 3, 2 == e ? (e = _clip(0, 51, f + d), f = HEAP32[_h264bsdQpC + (e << 2) >> 2], f = f + (g + 1) >>> 1, e = _clip(0, 51, f + HEAP32[c + 12 >> 2]), f = _clip(0, 51, f + HEAP32[c + 16 >> 2]), HEAP32[a + 4 >> 2] = HEAPU8[_alphas + e] & 255, HEAP32[a + 8 >> 2] = HEAPU8[_betas + f] & 255, HEAP32[a >> 2] = _tc0 + 3 * e) : 3 == e && (HEAP32[a + 4 >> 2] = HEAP32[a + 28 >> 2], HEAP32[a + 8 >> 2] = HEAP32[a + 32 >> 
    2], HEAP32[a >> 2] = HEAP32[a + 24 >> 2])
  }
  if(6 == (0 != (b & 4 | 0) ? 6 : 10)) {
    f = HEAP32[HEAP32[c + 200 >> 2] + 20 >> 2], e = (f | 0) != (HEAP32[c + 20 >> 2] | 0) ? 7 : 8, 7 == e ? (b = _clip(0, 51, f + d), f = HEAP32[_h264bsdQpC + (b << 2) >> 2], f = f + (g + 1) >>> 1, e = _clip(0, 51, f + HEAP32[c + 12 >> 2]), f = _clip(0, 51, f + HEAP32[c + 16 >> 2]), HEAP32[a + 16 >> 2] = HEAPU8[_alphas + e] & 255, HEAP32[a + 20 >> 2] = HEAPU8[_betas + f] & 255, HEAP32[a + 12 >> 2] = _tc0 + 3 * e) : 8 == e && (HEAP32[a + 16 >> 2] = HEAP32[a + 28 >> 2], HEAP32[a + 20 >> 2] = HEAP32[a + 
    32 >> 2], HEAP32[a + 12 >> 2] = HEAP32[a + 24 >> 2])
  }
}
_GetChromaEdgeThresholds.X = 1;
function _FilterChroma(a, c, b, d, e) {
  var f, g, h;
  g = b;
  f = h = 0;
  a:for(;;) {
    if(!(2 > f >>> 0)) {
      break a
    }
    b = 0 != (HEAP32[g + 4 >> 2] | 0) ? 3 : 4;
    3 == b && (_FilterVerChromaEdge(a, HEAP32[g + 4 >> 2], d + 12, e), _FilterVerChromaEdge(c, HEAP32[g + 4 >> 2], d + 12, e));
    b = 0 != (HEAP32[g + 36 >> 2] | 0) ? 5 : 6;
    5 == b && (_FilterVerChromaEdge(a + (e << 1), HEAP32[g + 36 >> 2], d + 12, e), _FilterVerChromaEdge(c + (e << 1), HEAP32[g + 36 >> 2], d + 12, e));
    b = 0 != (HEAP32[g + 20 >> 2] | 0) ? 7 : 8;
    7 == b && (_FilterVerChromaEdge(a + 4, HEAP32[g + 20 >> 2], d + 24, e), _FilterVerChromaEdge(c + 4, HEAP32[g + 20 >> 2], d + 24, e));
    b = 0 != (HEAP32[g + 52 >> 2] | 0) ? 9 : 10;
    9 == b && (_FilterVerChromaEdge(a + (e << 1) + 4, HEAP32[g + 52 >> 2], d + 24, e), _FilterVerChromaEdge(c + (e << 1) + 4, HEAP32[g + 52 >> 2], d + 24, e));
    b = (HEAP32[g >> 2] | 0) == (HEAP32[g + 8 >> 2] | 0) ? 11 : 16;
    b:do {
      if(11 == b) {
        if((HEAP32[g + 8 >> 2] | 0) != (HEAP32[g + 16 >> 2] | 0)) {
          b = 16;
          break b
        }
        if((HEAP32[g + 16 >> 2] | 0) != (HEAP32[g + 24 >> 2] | 0)) {
          b = 16;
          break b
        }
        b = 0 != (HEAP32[g >> 2] | 0) ? 14 : 15;
        14 == b && (_FilterHorChroma(a, HEAP32[g >> 2], d + 12 * h, e), _FilterHorChroma(c, HEAP32[g >> 2], d + 12 * h, e));
        b = 25;
        break b
      }
    }while(0);
    16 == b && (b = 0 != (HEAP32[g >> 2] | 0) ? 17 : 18, 17 == b && (_FilterHorChromaEdge(a, HEAP32[g >> 2], d + 12 * h, e), _FilterHorChromaEdge(c, HEAP32[g >> 2], d + 12 * h, e)), b = 0 != (HEAP32[g + 8 >> 2] | 0) ? 19 : 20, 19 == b && (_FilterHorChromaEdge(a + 2, HEAP32[g + 8 >> 2], d + 12 * h, e), _FilterHorChromaEdge(c + 2, HEAP32[g + 8 >> 2], d + 12 * h, e)), b = 0 != (HEAP32[g + 16 >> 2] | 0) ? 21 : 22, 21 == b && (_FilterHorChromaEdge(a + 4, HEAP32[g + 16 >> 2], d + 12 * h, e), _FilterHorChromaEdge(c + 
    4, HEAP32[g + 16 >> 2], d + 12 * h, e)), b = 0 != (HEAP32[g + 24 >> 2] | 0) ? 23 : 24, 23 == b && (_FilterHorChromaEdge(a + 6, HEAP32[g + 24 >> 2], d + 12 * h, e), _FilterHorChromaEdge(c + 6, HEAP32[g + 24 >> 2], d + 12 * h, e)));
    g += 64;
    a += e << 2;
    c += e << 2;
    h = 2;
    f += 1
  }
}
_FilterChroma.X = 1;
function _GetBoundaryStrengthsA(a, c) {
  var b;
  if(0 != (HEAP16[a + 32 >> 1] << 16 >> 16 | 0)) {
    var d = 1;
    b = 2
  }else {
    b = 1
  }
  1 == b && (d = 0 != (HEAP16[a + 28 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 32 >> 2] = d ? 2 : 0;
  if(0 != (HEAP16[a + 34 >> 1] << 16 >> 16 | 0)) {
    var e = 1;
    b = 4
  }else {
    b = 3
  }
  3 == b && (e = 0 != (HEAP16[a + 30 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 40 >> 2] = e ? 2 : 0;
  if(0 != (HEAP16[a + 40 >> 1] << 16 >> 16 | 0)) {
    var f = 1;
    b = 6
  }else {
    b = 5
  }
  5 == b && (f = 0 != (HEAP16[a + 36 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 48 >> 2] = f ? 2 : 0;
  if(0 != (HEAP16[a + 42 >> 1] << 16 >> 16 | 0)) {
    var g = 1;
    b = 8
  }else {
    b = 7
  }
  7 == b && (g = 0 != (HEAP16[a + 38 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 56 >> 2] = g ? 2 : 0;
  if(0 != (HEAP16[a + 44 >> 1] << 16 >> 16 | 0)) {
    var h = 1;
    b = 10
  }else {
    b = 9
  }
  9 == b && (h = 0 != (HEAP16[a + 32 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 64 >> 2] = h ? 2 : 0;
  if(0 != (HEAP16[a + 46 >> 1] << 16 >> 16 | 0)) {
    var j = 1;
    b = 12
  }else {
    b = 11
  }
  11 == b && (j = 0 != (HEAP16[a + 34 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 72 >> 2] = j ? 2 : 0;
  if(0 != (HEAP16[a + 52 >> 1] << 16 >> 16 | 0)) {
    var l = 1;
    b = 14
  }else {
    b = 13
  }
  13 == b && (l = 0 != (HEAP16[a + 40 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 80 >> 2] = l ? 2 : 0;
  if(0 != (HEAP16[a + 54 >> 1] << 16 >> 16 | 0)) {
    var k = 1;
    b = 16
  }else {
    b = 15
  }
  15 == b && (k = 0 != (HEAP16[a + 42 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 88 >> 2] = k ? 2 : 0;
  if(0 != (HEAP16[a + 48 >> 1] << 16 >> 16 | 0)) {
    var m = 1;
    b = 18
  }else {
    b = 17
  }
  17 == b && (m = 0 != (HEAP16[a + 44 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 96 >> 2] = m ? 2 : 0;
  if(0 != (HEAP16[a + 50 >> 1] << 16 >> 16 | 0)) {
    var o = 1;
    b = 20
  }else {
    b = 19
  }
  19 == b && (o = 0 != (HEAP16[a + 46 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 104 >> 2] = o ? 2 : 0;
  if(0 != (HEAP16[a + 56 >> 1] << 16 >> 16 | 0)) {
    var q = 1;
    b = 22
  }else {
    b = 21
  }
  21 == b && (q = 0 != (HEAP16[a + 52 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 112 >> 2] = q ? 2 : 0;
  if(0 != (HEAP16[a + 58 >> 1] << 16 >> 16 | 0)) {
    var p = 1;
    b = 24
  }else {
    b = 23
  }
  23 == b && (p = 0 != (HEAP16[a + 54 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 120 >> 2] = p ? 2 : 0;
  if(0 != (HEAP16[a + 30 >> 1] << 16 >> 16 | 0)) {
    var n = 1;
    b = 26
  }else {
    b = 25
  }
  25 == b && (n = 0 != (HEAP16[a + 28 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 12 >> 2] = n ? 2 : 0;
  if(0 != (HEAP16[a + 36 >> 1] << 16 >> 16 | 0)) {
    var r = 1;
    b = 28
  }else {
    b = 27
  }
  27 == b && (r = 0 != (HEAP16[a + 30 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 20 >> 2] = r ? 2 : 0;
  if(0 != (HEAP16[a + 38 >> 1] << 16 >> 16 | 0)) {
    var s = 1;
    b = 30
  }else {
    b = 29
  }
  29 == b && (s = 0 != (HEAP16[a + 36 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 28 >> 2] = s ? 2 : 0;
  if(0 != (HEAP16[a + 34 >> 1] << 16 >> 16 | 0)) {
    var t = 1;
    b = 32
  }else {
    b = 31
  }
  31 == b && (t = 0 != (HEAP16[a + 32 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 44 >> 2] = t ? 2 : 0;
  if(0 != (HEAP16[a + 40 >> 1] << 16 >> 16 | 0)) {
    var u = 1;
    b = 34
  }else {
    b = 33
  }
  33 == b && (u = 0 != (HEAP16[a + 34 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 52 >> 2] = u ? 2 : 0;
  if(0 != (HEAP16[a + 42 >> 1] << 16 >> 16 | 0)) {
    var v = 1;
    b = 36
  }else {
    b = 35
  }
  35 == b && (v = 0 != (HEAP16[a + 40 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 60 >> 2] = v ? 2 : 0;
  if(0 != (HEAP16[a + 46 >> 1] << 16 >> 16 | 0)) {
    var w = 1;
    b = 38
  }else {
    b = 37
  }
  37 == b && (w = 0 != (HEAP16[a + 44 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 76 >> 2] = w ? 2 : 0;
  if(0 != (HEAP16[a + 52 >> 1] << 16 >> 16 | 0)) {
    var x = 1;
    b = 40
  }else {
    b = 39
  }
  39 == b && (x = 0 != (HEAP16[a + 46 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 84 >> 2] = x ? 2 : 0;
  if(0 != (HEAP16[a + 54 >> 1] << 16 >> 16 | 0)) {
    var z = 1;
    b = 42
  }else {
    b = 41
  }
  41 == b && (z = 0 != (HEAP16[a + 52 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 92 >> 2] = z ? 2 : 0;
  if(0 != (HEAP16[a + 50 >> 1] << 16 >> 16 | 0)) {
    var A = 1;
    b = 44
  }else {
    b = 43
  }
  43 == b && (A = 0 != (HEAP16[a + 48 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 108 >> 2] = A ? 2 : 0;
  if(0 != (HEAP16[a + 56 >> 1] << 16 >> 16 | 0)) {
    var y = 1;
    b = 46
  }else {
    b = 45
  }
  45 == b && (y = 0 != (HEAP16[a + 50 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 116 >> 2] = y ? 2 : 0;
  if(0 != (HEAP16[a + 58 >> 1] << 16 >> 16 | 0)) {
    var B = 1;
    b = 48
  }else {
    b = 47
  }
  47 == b && (B = 0 != (HEAP16[a + 56 >> 1] << 16 >> 16 | 0));
  HEAP32[c + 124 >> 2] = B ? 2 : 0
}
_GetBoundaryStrengthsA.X = 1;
function _FilterVerChromaEdge(a, c, b, d) {
  var e, f, g, h, j, l, k;
  e = a;
  k = _h264bsdClip + 512;
  j = HEAP8[e - 2];
  g = HEAP8[e - 1];
  h = HEAP8[e];
  l = HEAP8[e + 1];
  a = _abs((g & 255) - (h & 255)) >>> 0 < HEAPU32[b + 4 >> 2] >>> 0 ? 1 : 7;
  a:do {
    if(1 == a) {
      if(!(_abs((j & 255) - (g & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
        break a
      }
      if(!(_abs((l & 255) - (h & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
        break a
      }
      a = 4 > c >>> 0 ? 4 : 5;
      4 == a ? (f = (HEAPU8[HEAP32[b >> 2] + (c - 1)] & 255) + 1, f = _clip(-f, f, ((h & 255) - (g & 255) << 2) + ((j & 255) - (l & 255)) + 4 >> 3), g = HEAP8[k + ((g & 255) + f)], h = HEAP8[k + ((h & 255) - f)], HEAP8[e - 1] = g, HEAP8[e] = h) : 5 == a && (HEAP8[e - 1] = ((j & 255) << 1) + (g & 255) + (l & 255) + 2 >> 2 & 255, HEAP8[e] = ((l & 255) << 1) + (h & 255) + (j & 255) + 2 >> 2 & 255)
    }
  }while(0);
  e += d;
  j = HEAP8[e - 2];
  g = HEAP8[e - 1];
  h = HEAP8[e];
  l = HEAP8[e + 1];
  a = _abs((g & 255) - (h & 255)) >>> 0 < HEAPU32[b + 4 >> 2] >>> 0 ? 8 : 14;
  a:do {
    if(8 == a) {
      if(!(_abs((j & 255) - (g & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
        break a
      }
      if(!(_abs((l & 255) - (h & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
        break a
      }
      a = 4 > c >>> 0 ? 11 : 12;
      11 == a ? (f = (HEAPU8[HEAP32[b >> 2] + (c - 1)] & 255) + 1, f = _clip(-f, f, ((h & 255) - (g & 255) << 2) + ((j & 255) - (l & 255)) + 4 >> 3), g = HEAP8[k + ((g & 255) + f)], h = HEAP8[k + ((h & 255) - f)], HEAP8[e - 1] = g, HEAP8[e] = h) : 12 == a && (HEAP8[e - 1] = ((j & 255) << 1) + (g & 255) + (l & 255) + 2 >> 2 & 255, HEAP8[e] = ((l & 255) << 1) + (h & 255) + (j & 255) + 2 >> 2 & 255)
    }
  }while(0)
}
_FilterVerChromaEdge.X = 1;
function _FilterHorChroma(a, c, b, d) {
  var e, f, g, h, j, l, k, m, o;
  e = a;
  o = _h264bsdClip + 512;
  a = 4 > c >>> 0 ? 1 : 10;
  do {
    if(1 == a) {
      g = (HEAPU8[HEAP32[b >> 2] + (c - 1)] & 255) + 1;
      h = 8;
      b:for(;;) {
        if(0 == (h | 0)) {
          break b
        }
        k = HEAP8[e + (-d << 1)];
        j = HEAP8[e + -d];
        l = HEAP8[e];
        m = HEAP8[e + d];
        a = _abs((j & 255) - (l & 255)) >>> 0 < HEAPU32[b + 4 >> 2] >>> 0 ? 4 : 7;
        c:do {
          if(4 == a) {
            if(!(_abs((k & 255) - (j & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
              break c
            }
            if(!(_abs((m & 255) - (l & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
              break c
            }
            f = _clip(-g, g, ((l & 255) - (j & 255) << 2) + ((k & 255) - (m & 255)) + 4 >> 3);
            j = HEAP8[o + ((j & 255) + f)];
            l = HEAP8[o + ((l & 255) - f)];
            HEAP8[e + -d] = j;
            HEAP8[e] = l
          }
        }while(0);
        h -= 1;
        e += 1
      }
    }else {
      if(10 == a) {
        h = 8;
        b:for(;;) {
          if(0 == (h | 0)) {
            break b
          }
          k = HEAP8[e + (-d << 1)];
          j = HEAP8[e + -d];
          l = HEAP8[e];
          m = HEAP8[e + d];
          a = _abs((j & 255) - (l & 255)) >>> 0 < HEAPU32[b + 4 >> 2] >>> 0 ? 13 : 16;
          c:do {
            if(13 == a) {
              if(!(_abs((k & 255) - (j & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
                break c
              }
              if(!(_abs((m & 255) - (l & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
                break c
              }
              HEAP8[e + -d] = ((k & 255) << 1) + (j & 255) + (m & 255) + 2 >> 2 & 255;
              HEAP8[e] = ((m & 255) << 1) + (l & 255) + (k & 255) + 2 >> 2 & 255
            }
          }while(0);
          h -= 1;
          e += 1
        }
      }
    }
  }while(0)
}
_FilterHorChroma.X = 1;
function _FilterHorChromaEdge(a, c, b, d) {
  var e, f, g, h, j, l, k, m;
  m = _h264bsdClip + 512;
  f = (HEAPU8[HEAP32[b >> 2] + (c - 1)] & 255) + 1;
  g = 2;
  a:for(;;) {
    if(0 == (g | 0)) {
      break a
    }
    l = HEAP8[a + (-d << 1)];
    h = HEAP8[a + -d];
    j = HEAP8[a];
    k = HEAP8[a + d];
    c = _abs((h & 255) - (j & 255)) >>> 0 < HEAPU32[b + 4 >> 2] >>> 0 ? 3 : 6;
    b:do {
      if(3 == c) {
        if(!(_abs((l & 255) - (h & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
          break b
        }
        if(!(_abs((k & 255) - (j & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
          break b
        }
        e = _clip(-f, f, ((j & 255) - (h & 255) << 2) + ((l & 255) - (k & 255)) + 4 >> 3);
        h = HEAP8[m + ((h & 255) + e)];
        j = HEAP8[m + ((j & 255) - e)];
        HEAP8[a + -d] = h;
        HEAP8[a] = j
      }
    }while(0);
    g -= 1;
    a += 1
  }
}
_FilterHorChromaEdge.X = 1;
function _FilterVerLumaEdge(a, c, b, d) {
  var e, f, g, h, j, l, k, m, o, q, p, n, r;
  p = _h264bsdClip + 512;
  n = HEAP32[b + 4 >> 2];
  r = HEAP32[b + 8 >> 2];
  e = 4 > c >>> 0 ? 1 : 14;
  do {
    if(1 == e) {
      f = g = HEAPU8[HEAP32[b >> 2] + (c - 1)] & 255;
      h = 4;
      b:for(;;) {
        if(0 == (h | 0)) {
          break b
        }
        k = HEAPU8[a - 2] & 255;
        j = HEAPU8[a - 1] & 255;
        l = HEAPU8[a] & 255;
        m = HEAPU8[a + 1] & 255;
        e = _abs(j - l) >>> 0 < n >>> 0 ? 4 : 11;
        c:do {
          if(4 == e) {
            if(!(_abs(k - j) >>> 0 < r >>> 0)) {
              break c
            }
            if(!(_abs(m - l) >>> 0 < r >>> 0)) {
              break c
            }
            o = HEAPU8[a - 3] & 255;
            q = HEAPU8[a + 2] & 255;
            e = _abs(o - j) >>> 0 < r >>> 0 ? 7 : 8;
            7 == e && (o = o + (l + (j + 1) >> 1) - (k << 1) >> 1, e = k, o = _clip(-g, g, o), HEAP8[a - 2] = e + o & 255, f += 1);
            e = _abs(q - l) >>> 0 < r >>> 0 ? 9 : 10;
            9 == e && (o = q + (l + (j + 1) >> 1) - (m << 1) >> 1, q = m, o = _clip(-g, g, o), HEAP8[a + 1] = q + o & 255, f += 1);
            o = (l - j << 2) + (k - m) + 4 >> 3;
            f = _clip(-f, f, o);
            j = HEAPU8[p + (j + f)] & 255;
            l = HEAPU8[p + (l - f)] & 255;
            f = g;
            HEAP8[a - 1] = j & 255;
            HEAP8[a] = l & 255
          }
        }while(0);
        h -= 1;
        a += d
      }
    }else {
      if(14 == e) {
        h = 4;
        b:for(;;) {
          if(0 == (h | 0)) {
            break b
          }
          k = HEAPU8[a - 2] & 255;
          j = HEAPU8[a - 1] & 255;
          l = HEAPU8[a] & 255;
          m = HEAPU8[a + 1] & 255;
          e = _abs(j - l) >>> 0 < n >>> 0 ? 17 : 28;
          c:do {
            if(17 == e) {
              if(!(_abs(k - j) >>> 0 < r >>> 0)) {
                break c
              }
              if(!(_abs(m - l) >>> 0 < r >>> 0)) {
                break c
              }
              g = _abs(j - l) >>> 0 < (n >>> 2) + 2 >>> 0 ? 1 : 0;
              o = HEAPU8[a - 3] & 255;
              q = HEAPU8[a + 2] & 255;
              e = 0 != (g | 0) ? 20 : 22;
              d:do {
                if(20 == e) {
                  if(!(_abs(o - j) >>> 0 < r >>> 0)) {
                    e = 22;
                    break d
                  }
                  f = k + j + l;
                  HEAP8[a - 1] = o + (f << 1) + m + 4 >> 3 & 255;
                  HEAP8[a - 2] = f + (o + 2) >> 2 & 255;
                  HEAP8[a - 3] = ((HEAPU8[a - 4] & 255) << 1) + 3 * o + f + 4 >> 3 & 255;
                  e = 23;
                  break d
                }
              }while(0);
              22 == e && (HEAP8[a - 1] = (k << 1) + j + m + 2 >> 2 & 255);
              e = 0 != (g | 0) ? 24 : 26;
              d:do {
                if(24 == e) {
                  if(!(_abs(q - l) >>> 0 < r >>> 0)) {
                    e = 26;
                    break d
                  }
                  f = j + l + m;
                  HEAP8[a] = k + (f << 1) + q + 4 >> 3 & 255;
                  HEAP8[a + 1] = q + (f + 2) >> 2 & 255;
                  HEAP8[a + 2] = ((HEAPU8[a + 3] & 255) << 1) + 3 * q + f + 4 >> 3 & 255;
                  e = 27;
                  break d
                }
              }while(0);
              26 == e && (HEAP8[a] = (m << 1) + l + k + 2 >> 2 & 255)
            }
          }while(0);
          h -= 1;
          a += d
        }
      }
    }
  }while(0)
}
_FilterVerLumaEdge.X = 1;
function _FilterHorLuma(a, c, b, d) {
  var e, f, g, h, j, l, k, m, o, q, p, n, r;
  p = _h264bsdClip + 512;
  n = HEAP32[b + 4 >> 2];
  r = HEAP32[b + 8 >> 2];
  e = 4 > c >>> 0 ? 1 : 14;
  do {
    if(1 == e) {
      f = g = HEAPU8[HEAP32[b >> 2] + (c - 1)] & 255;
      h = 16;
      b:for(;;) {
        if(0 == (h | 0)) {
          break b
        }
        k = HEAPU8[a + (-d << 1)] & 255;
        j = HEAPU8[a + -d] & 255;
        l = HEAPU8[a] & 255;
        m = HEAPU8[a + d] & 255;
        e = _abs(j - l) >>> 0 < n >>> 0 ? 4 : 11;
        c:do {
          if(4 == e) {
            if(!(_abs(k - j) >>> 0 < r >>> 0)) {
              break c
            }
            if(!(_abs(m - l) >>> 0 < r >>> 0)) {
              break c
            }
            o = HEAPU8[a + 3 * -d] & 255;
            e = _abs(o - j) >>> 0 < r >>> 0 ? 7 : 8;
            7 == e && (o = o + (l + (j + 1) >> 1) - (k << 1) >> 1, e = k, o = _clip(-g, g, o), HEAP8[a + (-d << 1)] = e + o & 255, f += 1);
            q = HEAPU8[a + (d << 1)] & 255;
            e = _abs(q - l) >>> 0 < r >>> 0 ? 9 : 10;
            9 == e && (o = q + (l + (j + 1) >> 1) - (m << 1) >> 1, q = m, o = _clip(-g, g, o), HEAP8[a + d] = q + o & 255, f += 1);
            o = (l - j << 2) + (k - m) + 4 >> 3;
            f = _clip(-f, f, o);
            j = HEAPU8[p + (j + f)] & 255;
            l = HEAPU8[p + (l - f)] & 255;
            f = g;
            HEAP8[a + -d] = j & 255;
            HEAP8[a] = l & 255
          }
        }while(0);
        h -= 1;
        a += 1
      }
    }else {
      if(14 == e) {
        h = 16;
        b:for(;;) {
          if(0 == (h | 0)) {
            break b
          }
          k = HEAPU8[a + (-d << 1)] & 255;
          j = HEAPU8[a + -d] & 255;
          l = HEAPU8[a] & 255;
          m = HEAPU8[a + d] & 255;
          e = _abs(j - l) >>> 0 < n >>> 0 ? 17 : 28;
          c:do {
            if(17 == e) {
              if(!(_abs(k - j) >>> 0 < r >>> 0)) {
                break c
              }
              if(!(_abs(m - l) >>> 0 < r >>> 0)) {
                break c
              }
              g = _abs(j - l) >>> 0 < (n >>> 2) + 2 >>> 0 ? 1 : 0;
              o = HEAPU8[a + 3 * -d] & 255;
              q = HEAPU8[a + (d << 1)] & 255;
              e = 0 != (g | 0) ? 20 : 22;
              d:do {
                if(20 == e) {
                  if(!(_abs(o - j) >>> 0 < r >>> 0)) {
                    e = 22;
                    break d
                  }
                  f = k + j + l;
                  HEAP8[a + -d] = o + (f << 1) + m + 4 >> 3 & 255;
                  HEAP8[a + (-d << 1)] = f + (o + 2) >> 2 & 255;
                  HEAP8[a + 3 * -d] = ((HEAPU8[a + (-d << 2)] & 255) << 1) + 3 * o + f + 4 >> 3 & 255;
                  e = 23;
                  break d
                }
              }while(0);
              22 == e && (HEAP8[a + -d] = (k << 1) + j + m + 2 >> 2 & 255);
              e = 0 != (g | 0) ? 24 : 26;
              d:do {
                if(24 == e) {
                  if(!(_abs(q - l) >>> 0 < r >>> 0)) {
                    e = 26;
                    break d
                  }
                  f = j + l + m;
                  HEAP8[a] = k + (f << 1) + q + 4 >> 3 & 255;
                  HEAP8[a + d] = q + (f + 2) >> 2 & 255;
                  HEAP8[a + (d << 1)] = ((HEAPU8[a + 3 * d] & 255) << 1) + 3 * q + f + 4 >> 3 & 255;
                  e = 27;
                  break d
                }
              }while(0);
              26 == e && (HEAP8[a] = (m << 1) + l + k + 2 >> 2 & 255)
            }
          }while(0);
          h -= 1;
          a += 1
        }
      }
    }
  }while(0)
}
_FilterHorLuma.X = 1;
function _FilterHorLumaEdge(a, c, b, d) {
  var e, f, g, h, j, l, k, m, o;
  o = _h264bsdClip + 512;
  f = c = HEAPU8[HEAP32[b >> 2] + (c - 1)] & 255;
  g = 4;
  a:for(;;) {
    if(0 == (g | 0)) {
      break a
    }
    l = HEAP8[a + (-d << 1)];
    h = HEAP8[a + -d];
    j = HEAP8[a];
    k = HEAP8[a + d];
    e = _abs((h & 255) - (j & 255)) >>> 0 < HEAPU32[b + 4 >> 2] >>> 0 ? 3 : 10;
    b:do {
      if(3 == e) {
        if(!(_abs((l & 255) - (h & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
          break b
        }
        if(!(_abs((k & 255) - (j & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0)) {
          break b
        }
        m = HEAP8[a + 3 * -d];
        e = _abs((m & 255) - (h & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0 ? 6 : 7;
        6 == e && (m = (m & 255) + ((h & 255) + (j & 255) + 1 >> 1) - ((l & 255) << 1) >> 1, e = l & 255, m = _clip(-c, c, m), HEAP8[a + (-d << 1)] = e + m & 255, f += 1);
        m = HEAP8[a + (d << 1)];
        e = _abs((m & 255) - (j & 255)) >>> 0 < HEAPU32[b + 8 >> 2] >>> 0 ? 8 : 9;
        if(8 == e) {
          m = (m & 255) + ((h & 255) + (j & 255) + 1 >> 1) - ((k & 255) << 1) >> 1;
          var q = k & 255;
          m = _clip(-c, c, m);
          HEAP8[a + d] = q + m & 255;
          f += 1
        }
        m = ((j & 255) - (h & 255) << 2) + ((l & 255) - (k & 255)) + 4 >> 3;
        f = _clip(-f, f, m);
        h = HEAP8[o + ((h & 255) + f)];
        j = HEAP8[o + ((j & 255) - f)];
        f = c;
        HEAP8[a + -d] = h;
        HEAP8[a] = j
      }
    }while(0);
    g -= 1;
    a += 1
  }
}
_FilterHorLumaEdge.X = 1;
function _EdgeBoundaryStrength(a, c, b, d) {
  var e, f;
  e = 0 != (HEAP16[a + 28 + (b << 1) >> 1] << 16 >> 16 | 0) ? 2 : 1;
  a:do {
    if(1 == e) {
      if(0 != (HEAP16[c + 28 + (d << 1) >> 1] << 16 >> 16 | 0)) {
        e = 2;
        break a
      }
      e = (HEAP32[a + 116 + (b >>> 2 << 2) >> 2] | 0) != (HEAP32[c + 116 + (d >>> 2 << 2) >> 2] | 0) ? 6 : 4;
      b:do {
        if(4 == e) {
          if(4 <= (_abs((HEAP16[a + 132 + (b << 2) >> 1] << 16 >> 16) - (HEAP16[c + 132 + (d << 2) >> 1] << 16 >> 16)) | 0)) {
            break b
          }
          if(4 <= (_abs((HEAP16[a + 132 + (b << 2) + 2 >> 1] << 16 >> 16) - (HEAP16[c + 132 + (d << 2) + 2 >> 1] << 16 >> 16)) | 0)) {
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
  2 == e && (f = 2);
  return f
}
_EdgeBoundaryStrength.X = 1;
function _IsSliceBoundaryOnLeft(a) {
  var c, a = (HEAP32[a + 4 >> 2] | 0) != (HEAP32[HEAP32[a + 200 >> 2] + 4 >> 2] | 0) ? 1 : 2;
  1 == a ? c = 1 : 2 == a && (c = 0);
  return c
}
function _IsSliceBoundaryOnTop(a) {
  var c, a = (HEAP32[a + 4 >> 2] | 0) != (HEAP32[HEAP32[a + 204 >> 2] + 4 >> 2] | 0) ? 1 : 2;
  1 == a ? c = 1 : 2 == a && (c = 0);
  return c
}
function _InnerBoundaryStrength(a, c, b) {
  var d, e, f, g, h, j, l;
  d = HEAP16[a + 28 + (c << 1) >> 1] << 16 >> 16;
  f = HEAP16[a + 28 + (b << 1) >> 1] << 16 >> 16;
  g = HEAP16[a + 132 + (c << 2) >> 1] << 16 >> 16;
  h = HEAP16[a + 132 + (b << 2) >> 1] << 16 >> 16;
  j = HEAP16[a + 132 + (c << 2) + 2 >> 1] << 16 >> 16;
  l = HEAP16[a + 132 + (b << 2) + 2 >> 1] << 16 >> 16;
  d = 0 != (d | 0) ? 2 : 1;
  a:do {
    if(1 == d) {
      if(0 != (f | 0)) {
        d = 2;
        break a
      }
      d = 4 <= (_abs(g - h) | 0) ? 6 : 4;
      b:do {
        if(4 == d) {
          if(4 <= (_abs(j - l) | 0)) {
            break b
          }
          if((HEAP32[a + 116 + (c >>> 2 << 2) >> 2] | 0) != (HEAP32[a + 116 + (b >>> 2 << 2) >> 2] | 0)) {
            break b
          }
          e = 0;
          d = 8;
          break a
        }
      }while(0);
      e = 1;
      d = 8;
      break a
    }
  }while(0);
  2 == d && (e = 2);
  return e
}
_InnerBoundaryStrength.X = 1;
function _h264bsdConceal(a, c, b) {
  var d, e, f, g, h, j, l, k, m;
  j = HEAP32[c + 4 >> 2];
  l = HEAP32[c + 8 >> 2];
  k = 0;
  d = 0 == (b | 0) ? 3 : 1;
  a:do {
    if(1 == d) {
      if(5 == (b | 0)) {
        d = 3;
        break a
      }
      d = 0 != (HEAP32[a + 3384 >> 2] | 0) ? 3 : 9;
      break a
    }
  }while(0);
  do {
    if(3 == d) {
      f = 0;
      b:for(;;) {
        k = _h264bsdGetRefPicData(a + 1220, f);
        f += 1;
        d = 16 <= f >>> 0 ? 5 : 6;
        do {
          if(5 == d) {
            break b
          }else {
            if(6 == d && 0 != (k | 0)) {
              break b
            }
          }
        }while(0)
      }
    }
  }while(0);
  f = g = h = 0;
  a:for(;;) {
    f >>> 0 < HEAPU32[a + 1176 >> 2] >>> 0 ? d = 11 : (m = 0, d = 12);
    11 == d && (m = 0 != (HEAP32[HEAP32[a + 1212 >> 2] + 216 * f + 196 >> 2] | 0) ^ 1);
    if(!m) {
      break a
    }
    f += 1;
    h += 1;
    d = (h | 0) == (j | 0) ? 14 : 15;
    14 == d && (g += 1, h = 0)
  }
  d = (f | 0) == (HEAP32[a + 1176 >> 2] | 0) ? 17 : 28;
  do {
    if(17 == d) {
      d = 2 == (b | 0) ? 19 : 18;
      b:do {
        if(18 == d) {
          d = 7 == (b | 0) ? 19 : 20;
          break b
        }
      }while(0);
      b:do {
        if(19 == d) {
          d = 0 == (HEAP32[a + 3384 >> 2] | 0) ? 21 : 20;
          break b
        }
      }while(0);
      b:do {
        if(20 == d) {
          if(0 == (k | 0)) {
            d = 21;
            break b
          }
          _H264SwDecMemcpy(HEAP32[c >> 2], k, 384 * j * l);
          d = 23;
          break b
        }
      }while(0);
      21 == d && _H264SwDecMemset(HEAP32[c >> 2], 128, 384 * j * l);
      HEAP32[a + 1204 >> 2] = HEAP32[a + 1176 >> 2];
      f = 0;
      b:for(;;) {
        if(!(f >>> 0 < HEAPU32[a + 1176 >> 2] >>> 0)) {
          break b
        }
        HEAP32[HEAP32[a + 1212 >> 2] + 216 * f + 8 >> 2] = 1;
        f += 1
      }
      e = 0
    }else {
      if(28 == d) {
        m = HEAP32[a + 1212 >> 2] + 216 * g * j;
        e = h;
        b:for(;;) {
          d = e;
          e = d - 1;
          if(0 == (d | 0)) {
            break b
          }
          _ConcealMb(m + 216 * e, c, g, e, b, k);
          HEAP32[m + 216 * e + 196 >> 2] = 1;
          HEAP32[a + 1204 >> 2] += 1
        }
        e = h + 1;
        b:for(;;) {
          if(!(e >>> 0 < j >>> 0)) {
            break b
          }
          d = 0 != (HEAP32[m + 216 * e + 196 >> 2] | 0) ? 35 : 34;
          34 == d && (_ConcealMb(m + 216 * e, c, g, e, b, k), HEAP32[m + 216 * e + 196 >> 2] = 1, HEAP32[a + 1204 >> 2] += 1);
          e += 1
        }
        d = 0 != (g | 0) ? 38 : 46;
        do {
          if(38 == d) {
            e = 0;
            c:for(;;) {
              if(!(e >>> 0 < j >>> 0)) {
                break c
              }
              f = g - 1;
              m = HEAP32[a + 1212 >> 2] + 216 * f * j + 216 * e;
              d:for(;;) {
                _ConcealMb(m, c, f, e, b, k);
                HEAP32[m + 196 >> 2] = 1;
                HEAP32[a + 1204 >> 2] += 1;
                m += 216 * -j;
                var o = f;
                f = o - 1;
                if(0 == (o | 0)) {
                  break d
                }
              }
              e += 1
            }
          }
        }while(0);
        f = g + 1;
        b:for(;;) {
          if(!(f >>> 0 < l >>> 0)) {
            break b
          }
          m = HEAP32[a + 1212 >> 2] + 216 * f * j;
          e = 0;
          c:for(;;) {
            if(!(e >>> 0 < j >>> 0)) {
              break c
            }
            d = 0 != (HEAP32[m + 216 * e + 196 >> 2] | 0) ? 52 : 51;
            51 == d && (_ConcealMb(m + 216 * e, c, f, e, b, k), HEAP32[m + 216 * e + 196 >> 2] = 1, HEAP32[a + 1204 >> 2] += 1);
            e += 1
          }
          f += 1
        }
        e = 0
      }
    }
  }while(0);
  return e
}
_h264bsdConceal.X = 1;
function _ConcealMb(a, c, b, d, e, f) {
  var g = STACKTOP;
  STACKTOP += 540;
  var h, j, l, k, m, o, q, p = g + 384, n = g + 448, r = g + 464, s = g + 480, t = g + 496, u, v, w, x;
  k = g + 512;
  l = g + 516;
  m = HEAP32[c + 4 >> 2];
  o = HEAP32[c + 8 >> 2];
  _h264bsdSetCurrImageMbPointers(c, b * m + d);
  q = HEAP32[c >> 2] + ((b << 4) * m << 4) + (d << 4);
  u = v = w = x = 0;
  HEAP32[a + 20 >> 2] = 40;
  HEAP32[a + 8 >> 2] = 0;
  HEAP32[a >> 2] = 6;
  HEAP32[a + 12 >> 2] = 0;
  HEAP32[a + 16 >> 2] = 0;
  HEAP32[a + 24 >> 2] = 0;
  h = 2 == (e | 0) ? 2 : 1;
  a:do {
    if(1 == h) {
      if(7 == (e | 0)) {
        h = 2;
        break a
      }
      var z, A, y;
      h = k;
      z = h + 4;
      y = 0;
      0 > y && (y += 256);
      for(y = y + (y << 8) + (y << 16) + 16777216 * y;0 !== h % 4 && h < z;) {
        HEAP8[h++] = 0
      }
      h >>= 2;
      for(A = z >> 2;h < A;) {
        HEAP32[h++] = y
      }
      for(h <<= 2;h < z;) {
        HEAP8[h++] = 0
      }
      HEAP32[l + 4 >> 2] = m;
      HEAP32[l + 8 >> 2] = o;
      HEAP32[l >> 2] = f;
      h = 0 != (HEAP32[l >> 2] | 0) ? 4 : 5;
      do {
        if(4 == h) {
          _h264bsdPredictSamples(g, k, l, d << 4, b << 4, 0, 0, 16, 16);
          _h264bsdWriteMacroblock(c, g);
          j = 0;
          h = 92;
          break a
        }else {
          if(5 == h) {
            _H264SwDecMemset(g, 0, 384);
            h = 7;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  a:do {
    if(2 == h) {
      _H264SwDecMemset(g, 0, 384);
      h = 7;
      break a
    }
  }while(0);
  do {
    if(7 == h) {
      _H264SwDecMemset(p, 0, 64);
      j = k = f = 0;
      h = 0 != (b | 0) ? 8 : 10;
      b:do {
        if(8 == h) {
          if(0 == (HEAP32[a + 216 * -m + 196 >> 2] | 0)) {
            break b
          }
          u = 1;
          l = e = q + -(m << 4);
          e = l + 1;
          HEAP32[n >> 2] = HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 4 >> 2] = HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 4 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 4 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 4 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 8 >> 2] = HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 8 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 8 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 8 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 12 >> 2] = HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 12 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[n + 12 >> 2] += HEAPU8[l] & 255;
          HEAP32[n + 12 >> 2] += HEAPU8[e] & 255;
          f += 1;
          j += 1;
          HEAP32[p >> 2] += HEAP32[n >> 2] + HEAP32[n + 4 >> 2] + HEAP32[n + 8 >> 2] + HEAP32[n + 12 >> 2];
          HEAP32[p + 4 >> 2] += HEAP32[n >> 2] + HEAP32[n + 4 >> 2] - HEAP32[n + 8 >> 2] - HEAP32[n + 12 >> 2]
        }
      }while(0);
      h = (b | 0) != (o - 1 | 0) ? 11 : 13;
      b:do {
        if(11 == h) {
          if(0 == (HEAP32[a + 216 * m + 196 >> 2] | 0)) {
            break b
          }
          v = 1;
          l = e = q + (m << 4 << 4);
          e = l + 1;
          HEAP32[r >> 2] = HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 4 >> 2] = HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 4 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 4 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 4 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 8 >> 2] = HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 8 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 8 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 8 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 12 >> 2] = HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 12 >> 2] += HEAPU8[l] & 255;
          l = e;
          e = l + 1;
          HEAP32[r + 12 >> 2] += HEAPU8[l] & 255;
          HEAP32[r + 12 >> 2] += HEAPU8[e] & 255;
          f += 1;
          j += 1;
          HEAP32[p >> 2] += HEAP32[r >> 2] + HEAP32[r + 4 >> 2] + HEAP32[r + 8 >> 2] + HEAP32[r + 12 >> 2];
          HEAP32[p + 4 >> 2] += HEAP32[r >> 2] + HEAP32[r + 4 >> 2] - HEAP32[r + 8 >> 2] - HEAP32[r + 12 >> 2]
        }
      }while(0);
      h = 0 != (d | 0) ? 14 : 16;
      b:do {
        if(14 == h) {
          if(0 == (HEAP32[a - 216 + 196 >> 2] | 0)) {
            break b
          }
          w = 1;
          e = q - 1;
          HEAP32[s >> 2] = HEAPU8[e] & 255;
          HEAP32[s >> 2] += HEAPU8[e + (m << 4)] & 255;
          HEAP32[s >> 2] += HEAPU8[e + (m << 5)] & 255;
          HEAP32[s >> 2] += HEAPU8[e + 48 * m] & 255;
          e += m << 6;
          HEAP32[s + 4 >> 2] = HEAPU8[e] & 255;
          HEAP32[s + 4 >> 2] += HEAPU8[e + (m << 4)] & 255;
          HEAP32[s + 4 >> 2] += HEAPU8[e + (m << 5)] & 255;
          HEAP32[s + 4 >> 2] += HEAPU8[e + 48 * m] & 255;
          e += m << 6;
          HEAP32[s + 8 >> 2] = HEAPU8[e] & 255;
          HEAP32[s + 8 >> 2] += HEAPU8[e + (m << 4)] & 255;
          HEAP32[s + 8 >> 2] += HEAPU8[e + (m << 5)] & 255;
          HEAP32[s + 8 >> 2] += HEAPU8[e + 48 * m] & 255;
          e += m << 6;
          HEAP32[s + 12 >> 2] = HEAPU8[e] & 255;
          HEAP32[s + 12 >> 2] += HEAPU8[e + (m << 4)] & 255;
          HEAP32[s + 12 >> 2] += HEAPU8[e + (m << 5)] & 255;
          HEAP32[s + 12 >> 2] += HEAPU8[e + 48 * m] & 255;
          f += 1;
          k += 1;
          HEAP32[p >> 2] += HEAP32[s >> 2] + HEAP32[s + 4 >> 2] + HEAP32[s + 8 >> 2] + HEAP32[s + 12 >> 2];
          HEAP32[p + 16 >> 2] += HEAP32[s >> 2] + HEAP32[s + 4 >> 2] - HEAP32[s + 8 >> 2] - HEAP32[s + 12 >> 2]
        }
      }while(0);
      h = (d | 0) != (m - 1 | 0) ? 17 : 19;
      b:do {
        if(17 == h) {
          if(0 == (HEAP32[a + 412 >> 2] | 0)) {
            break b
          }
          x = 1;
          e = q + 16;
          HEAP32[t >> 2] = HEAPU8[e] & 255;
          HEAP32[t >> 2] += HEAPU8[e + (m << 4)] & 255;
          HEAP32[t >> 2] += HEAPU8[e + (m << 5)] & 255;
          HEAP32[t >> 2] += HEAPU8[e + 48 * m] & 255;
          e += m << 6;
          HEAP32[t + 4 >> 2] = HEAPU8[e] & 255;
          HEAP32[t + 4 >> 2] += HEAPU8[e + (m << 4)] & 255;
          HEAP32[t + 4 >> 2] += HEAPU8[e + (m << 5)] & 255;
          HEAP32[t + 4 >> 2] += HEAPU8[e + 48 * m] & 255;
          e += m << 6;
          HEAP32[t + 8 >> 2] = HEAPU8[e] & 255;
          HEAP32[t + 8 >> 2] += HEAPU8[e + (m << 4)] & 255;
          HEAP32[t + 8 >> 2] += HEAPU8[e + (m << 5)] & 255;
          HEAP32[t + 8 >> 2] += HEAPU8[e + 48 * m] & 255;
          e += m << 6;
          HEAP32[t + 12 >> 2] = HEAPU8[e] & 255;
          HEAP32[t + 12 >> 2] += HEAPU8[e + (m << 4)] & 255;
          HEAP32[t + 12 >> 2] += HEAPU8[e + (m << 5)] & 255;
          HEAP32[t + 12 >> 2] += HEAPU8[e + 48 * m] & 255;
          f += 1;
          k += 1;
          HEAP32[p >> 2] += HEAP32[t >> 2] + HEAP32[t + 4 >> 2] + HEAP32[t + 8 >> 2] + HEAP32[t + 12 >> 2];
          HEAP32[p + 16 >> 2] += HEAP32[t >> 2] + HEAP32[t + 4 >> 2] - HEAP32[t + 8 >> 2] - HEAP32[t + 12 >> 2]
        }
      }while(0);
      h = 0 != (j | 0) ? 23 : 20;
      b:do {
        if(20 == h) {
          if(0 == (w | 0)) {
            h = 23;
            break b
          }
          if(0 == (x | 0)) {
            h = 23;
            break b
          }
          HEAP32[p + 4 >> 2] = HEAP32[s >> 2] + HEAP32[s + 4 >> 2] + HEAP32[s + 8 >> 2] + HEAP32[s + 12 >> 2] - HEAP32[t >> 2] - HEAP32[t + 4 >> 2] - HEAP32[t + 8 >> 2] - HEAP32[t + 12 >> 2] >> 5;
          h = 26;
          break b
        }
      }while(0);
      23 == h && (h = 0 != (j | 0) ? 24 : 25, 24 == h && (HEAP32[p + 4 >> 2] >>= j + 3 | 0));
      h = 0 != (k | 0) ? 30 : 27;
      b:do {
        if(27 == h) {
          if(0 == (u | 0)) {
            h = 30;
            break b
          }
          if(0 == (v | 0)) {
            h = 30;
            break b
          }
          HEAP32[p + 16 >> 2] = HEAP32[n >> 2] + HEAP32[n + 4 >> 2] + HEAP32[n + 8 >> 2] + HEAP32[n + 12 >> 2] - HEAP32[r >> 2] - HEAP32[r + 4 >> 2] - HEAP32[r + 8 >> 2] - HEAP32[r + 12 >> 2] >> 5;
          h = 33;
          break b
        }
      }while(0);
      30 == h && (h = 0 != (k | 0) ? 31 : 32, 31 == h && (HEAP32[p + 16 >> 2] >>= k + 3 | 0));
      h = 1 == f ? 34 : 2 == f ? 35 : 3 == f ? 36 : 37;
      37 == h ? HEAP32[p >> 2] >>= 6 : 34 == h ? HEAP32[p >> 2] >>= 4 : 35 == h ? HEAP32[p >> 2] >>= 5 : 36 == h && (HEAP32[p >> 2] = 21 * HEAP32[p >> 2] >> 10);
      _Transform(p);
      f = 0;
      e = g;
      j = p;
      b:for(;;) {
        if(!(256 > f >>> 0)) {
          break b
        }
        k = HEAP32[j + ((f & 15) >>> 2 << 2) >> 2];
        h = 0 > (k | 0) ? 41 : 42;
        if(41 == h) {
          var B = 0
        }else {
          if(42 == h) {
            h = 255 < (k | 0) ? 43 : 44;
            if(43 == h) {
              var C = 255
            }else {
              44 == h && (C = k)
            }
            B = C
          }
        }
        q = e;
        e = q + 1;
        HEAP8[q] = B & 255;
        f += 1;
        h = 0 != (f & 63 | 0) ? 48 : 47;
        47 == h && (j += 16)
      }
      q = HEAP32[c >> 2] + (m * o << 8) + ((b << 3) * m << 3) + (d << 3);
      l = 0;
      b:for(;;) {
        if(!(2 > l >>> 0)) {
          break b
        }
        _H264SwDecMemset(p, 0, 64);
        j = k = f = 0;
        h = 0 != (u | 0) ? 52 : 53;
        52 == h && (h = e = q + -(m << 3), e = h + 1, HEAP32[n >> 2] = HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[n >> 2] += HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[n + 4 >> 2] = HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[n + 4 >> 2] += HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[n + 8 >> 2] = HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[n + 8 >> 2] += HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[n + 12 >> 2] = HEAPU8[h] & 255, HEAP32[n + 12 >> 2] += HEAPU8[e] & 255, f += 1, j += 1, HEAP32[p >> 2] += HEAP32[n >> 
        2] + HEAP32[n + 4 >> 2] + HEAP32[n + 8 >> 2] + HEAP32[n + 12 >> 2], HEAP32[p + 4 >> 2] += HEAP32[n >> 2] + HEAP32[n + 4 >> 2] - HEAP32[n + 8 >> 2] - HEAP32[n + 12 >> 2]);
        h = 0 != (v | 0) ? 54 : 55;
        54 == h && (h = e = q + (m << 3 << 3), e = h + 1, HEAP32[r >> 2] = HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[r >> 2] += HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[r + 4 >> 2] = HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[r + 4 >> 2] += HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[r + 8 >> 2] = HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[r + 8 >> 2] += HEAPU8[h] & 255, h = e, e = h + 1, HEAP32[r + 12 >> 2] = HEAPU8[h] & 255, HEAP32[r + 12 >> 2] += HEAPU8[e] & 255, f += 1, j += 1, HEAP32[p >> 2] += 
        HEAP32[r >> 2] + HEAP32[r + 4 >> 2] + HEAP32[r + 8 >> 2] + HEAP32[r + 12 >> 2], HEAP32[p + 4 >> 2] += HEAP32[r >> 2] + HEAP32[r + 4 >> 2] - HEAP32[r + 8 >> 2] - HEAP32[r + 12 >> 2]);
        h = 0 != (w | 0) ? 56 : 57;
        56 == h && (e = q - 1, HEAP32[s >> 2] = HEAPU8[e] & 255, HEAP32[s >> 2] += HEAPU8[e + (m << 3)] & 255, e += m << 4, HEAP32[s + 4 >> 2] = HEAPU8[e] & 255, HEAP32[s + 4 >> 2] += HEAPU8[e + (m << 3)] & 255, e += m << 4, HEAP32[s + 8 >> 2] = HEAPU8[e] & 255, HEAP32[s + 8 >> 2] += HEAPU8[e + (m << 3)] & 255, e += m << 4, HEAP32[s + 12 >> 2] = HEAPU8[e] & 255, HEAP32[s + 12 >> 2] += HEAPU8[e + (m << 3)] & 255, f += 1, k += 1, HEAP32[p >> 2] += HEAP32[s >> 2] + HEAP32[s + 4 >> 2] + HEAP32[s + 8 >> 
        2] + HEAP32[s + 12 >> 2], HEAP32[p + 16 >> 2] += HEAP32[s >> 2] + HEAP32[s + 4 >> 2] - HEAP32[s + 8 >> 2] - HEAP32[s + 12 >> 2]);
        h = 0 != (x | 0) ? 58 : 59;
        58 == h && (e = q + 8, HEAP32[t >> 2] = HEAPU8[e] & 255, HEAP32[t >> 2] += HEAPU8[e + (m << 3)] & 255, e += m << 4, HEAP32[t + 4 >> 2] = HEAPU8[e] & 255, HEAP32[t + 4 >> 2] += HEAPU8[e + (m << 3)] & 255, e += m << 4, HEAP32[t + 8 >> 2] = HEAPU8[e] & 255, HEAP32[t + 8 >> 2] += HEAPU8[e + (m << 3)] & 255, e += m << 4, HEAP32[t + 12 >> 2] = HEAPU8[e] & 255, HEAP32[t + 12 >> 2] += HEAPU8[e + (m << 3)] & 255, f += 1, k += 1, HEAP32[p >> 2] += HEAP32[t >> 2] + HEAP32[t + 4 >> 2] + HEAP32[t + 8 >> 
        2] + HEAP32[t + 12 >> 2], HEAP32[p + 16 >> 2] += HEAP32[t >> 2] + HEAP32[t + 4 >> 2] - HEAP32[t + 8 >> 2] - HEAP32[t + 12 >> 2]);
        h = 0 != (j | 0) ? 63 : 60;
        c:do {
          if(60 == h) {
            if(0 == (w | 0)) {
              h = 63;
              break c
            }
            if(0 == (x | 0)) {
              h = 63;
              break c
            }
            HEAP32[p + 4 >> 2] = HEAP32[s >> 2] + HEAP32[s + 4 >> 2] + HEAP32[s + 8 >> 2] + HEAP32[s + 12 >> 2] - HEAP32[t >> 2] - HEAP32[t + 4 >> 2] - HEAP32[t + 8 >> 2] - HEAP32[t + 12 >> 2] >> 4;
            h = 66;
            break c
          }
        }while(0);
        63 == h && (h = 0 != (j | 0) ? 64 : 65, 64 == h && (HEAP32[p + 4 >> 2] >>= j + 2 | 0));
        h = 0 != (k | 0) ? 70 : 67;
        c:do {
          if(67 == h) {
            if(0 == (u | 0)) {
              h = 70;
              break c
            }
            if(0 == (v | 0)) {
              h = 70;
              break c
            }
            HEAP32[p + 16 >> 2] = HEAP32[n >> 2] + HEAP32[n + 4 >> 2] + HEAP32[n + 8 >> 2] + HEAP32[n + 12 >> 2] - HEAP32[r >> 2] - HEAP32[r + 4 >> 2] - HEAP32[r + 8 >> 2] - HEAP32[r + 12 >> 2] >> 4;
            h = 73;
            break c
          }
        }while(0);
        70 == h && (h = 0 != (k | 0) ? 71 : 72, 71 == h && (HEAP32[p + 16 >> 2] >>= k + 2 | 0));
        h = 1 == f ? 74 : 2 == f ? 75 : 3 == f ? 76 : 77;
        77 == h ? HEAP32[p >> 2] >>= 5 : 74 == h ? HEAP32[p >> 2] >>= 3 : 75 == h ? HEAP32[p >> 2] >>= 4 : 76 == h && (HEAP32[p >> 2] = 21 * HEAP32[p >> 2] >> 9);
        _Transform(p);
        e = g + 256 + (l << 6);
        f = 0;
        j = p;
        c:for(;;) {
          if(!(64 > f >>> 0)) {
            break c
          }
          k = HEAP32[j + ((f & 7) >>> 1 << 2) >> 2];
          h = 0 > (k | 0) ? 81 : 82;
          if(81 == h) {
            var D = 0
          }else {
            if(82 == h) {
              h = 255 < (k | 0) ? 83 : 84;
              if(83 == h) {
                var E = 255
              }else {
                84 == h && (E = k)
              }
              D = E
            }
          }
          k = e;
          e = k + 1;
          HEAP8[k] = D & 255;
          f += 1;
          h = 0 != (f & 15 | 0) ? 88 : 87;
          87 == h && (j += 16)
        }
        q += m * o << 6;
        l += 1
      }
      _h264bsdWriteMacroblock(c, g);
      j = 0
    }
  }while(0);
  STACKTOP = g;
  return j
}
_ConcealMb.X = 1;
function _Transform(a) {
  var c, b, d, e;
  c = 0 != (HEAP32[a + 4 >> 2] | 0) ? 3 : 1;
  a:do {
    if(1 == c) {
      if(0 != (HEAP32[a + 16 >> 2] | 0)) {
        c = 3;
        break a
      }
      c = HEAP32[a >> 2];
      HEAP32[a + 60 >> 2] = c;
      HEAP32[a + 56 >> 2] = c;
      HEAP32[a + 52 >> 2] = c;
      HEAP32[a + 48 >> 2] = c;
      HEAP32[a + 44 >> 2] = c;
      HEAP32[a + 40 >> 2] = c;
      HEAP32[a + 36 >> 2] = c;
      HEAP32[a + 32 >> 2] = c;
      HEAP32[a + 28 >> 2] = c;
      HEAP32[a + 24 >> 2] = c;
      HEAP32[a + 20 >> 2] = c;
      HEAP32[a + 16 >> 2] = c;
      HEAP32[a + 12 >> 2] = c;
      HEAP32[a + 8 >> 2] = c;
      HEAP32[a + 4 >> 2] = c;
      c = 7;
      break a
    }
  }while(0);
  a:do {
    if(3 == c) {
      d = HEAP32[a >> 2];
      e = HEAP32[a + 4 >> 2];
      HEAP32[a >> 2] = d + e;
      HEAP32[a + 4 >> 2] = d + (e >> 1);
      HEAP32[a + 8 >> 2] = d - (e >> 1);
      HEAP32[a + 12 >> 2] = d - e;
      d = HEAP32[a + 16 >> 2];
      HEAP32[a + 20 >> 2] = d;
      HEAP32[a + 24 >> 2] = d;
      HEAP32[a + 28 >> 2] = d;
      b = 4;
      for(;;) {
        d = b;
        b = d - 1;
        if(0 == (d | 0)) {
          break a
        }
        d = HEAP32[a >> 2];
        e = HEAP32[a + 16 >> 2];
        HEAP32[a >> 2] = d + e;
        HEAP32[a + 16 >> 2] = d + (e >> 1);
        HEAP32[a + 32 >> 2] = d - (e >> 1);
        HEAP32[a + 48 >> 2] = d - e;
        a += 4
      }
    }
  }while(0)
}
_Transform.X = 1;
function _h264bsdDecodeVuiParameters(a, c) {
  var b, d, e;
  _H264SwDecMemset(c, 0, 952);
  e = _h264bsdGetBits(a, 1);
  b = -1 == (e | 0) ? 1 : 2;
  a:do {
    if(1 == b) {
      d = 1
    }else {
      if(2 == b) {
        HEAP32[c >> 2] = 1 == (e | 0) ? 1 : 0;
        b = 0 != (HEAP32[c >> 2] | 0) ? 3 : 12;
        do {
          if(3 == b) {
            e = _h264bsdGetBits(a, 8);
            b = -1 == (e | 0) ? 4 : 5;
            do {
              if(4 == b) {
                d = 1;
                break a
              }else {
                if(5 == b) {
                  HEAP32[c + 4 >> 2] = e;
                  b = 255 == (HEAP32[c + 4 >> 2] | 0) ? 6 : 11;
                  do {
                    if(6 == b) {
                      e = _h264bsdGetBits(a, 16);
                      b = -1 == (e | 0) ? 7 : 8;
                      do {
                        if(7 == b) {
                          d = 1;
                          break a
                        }else {
                          if(8 == b) {
                            HEAP32[c + 8 >> 2] = e;
                            e = _h264bsdGetBits(a, 16);
                            b = -1 == (e | 0) ? 9 : 10;
                            do {
                              if(9 == b) {
                                d = 1;
                                break a
                              }else {
                                10 == b && (HEAP32[c + 12 >> 2] = e)
                              }
                            }while(0)
                          }
                        }
                      }while(0)
                    }
                  }while(0)
                }
              }
            }while(0)
          }
        }while(0);
        e = _h264bsdGetBits(a, 1);
        b = -1 == (e | 0) ? 13 : 14;
        do {
          if(13 == b) {
            d = 1
          }else {
            if(14 == b) {
              HEAP32[c + 16 >> 2] = 1 == (e | 0) ? 1 : 0;
              b = 0 != (HEAP32[c + 16 >> 2] | 0) ? 15 : 18;
              do {
                if(15 == b) {
                  e = _h264bsdGetBits(a, 1);
                  b = -1 == (e | 0) ? 16 : 17;
                  do {
                    if(16 == b) {
                      d = 1;
                      break a
                    }else {
                      17 == b && (HEAP32[c + 20 >> 2] = 1 == (e | 0) ? 1 : 0)
                    }
                  }while(0)
                }
              }while(0);
              e = _h264bsdGetBits(a, 1);
              b = -1 == (e | 0) ? 19 : 20;
              do {
                if(19 == b) {
                  d = 1
                }else {
                  if(20 == b) {
                    HEAP32[c + 24 >> 2] = 1 == (e | 0) ? 1 : 0;
                    b = 0 != (HEAP32[c + 24 >> 2] | 0) ? 21 : 37;
                    do {
                      if(21 == b) {
                        e = _h264bsdGetBits(a, 3);
                        b = -1 == (e | 0) ? 22 : 23;
                        do {
                          if(22 == b) {
                            d = 1;
                            break a
                          }else {
                            if(23 == b) {
                              HEAP32[c + 28 >> 2] = e;
                              e = _h264bsdGetBits(a, 1);
                              b = -1 == (e | 0) ? 24 : 25;
                              do {
                                if(24 == b) {
                                  d = 1;
                                  break a
                                }else {
                                  if(25 == b) {
                                    HEAP32[c + 32 >> 2] = 1 == (e | 0) ? 1 : 0;
                                    e = _h264bsdGetBits(a, 1);
                                    b = -1 == (e | 0) ? 26 : 27;
                                    do {
                                      if(26 == b) {
                                        d = 1;
                                        break a
                                      }else {
                                        if(27 == b) {
                                          HEAP32[c + 36 >> 2] = 1 == (e | 0) ? 1 : 0;
                                          b = 0 != (HEAP32[c + 36 >> 2] | 0) ? 28 : 35;
                                          do {
                                            if(28 == b) {
                                              e = _h264bsdGetBits(a, 8);
                                              b = -1 == (e | 0) ? 29 : 30;
                                              do {
                                                if(29 == b) {
                                                  d = 1;
                                                  break a
                                                }else {
                                                  if(30 == b) {
                                                    HEAP32[c + 40 >> 2] = e;
                                                    e = _h264bsdGetBits(a, 8);
                                                    b = -1 == (e | 0) ? 31 : 32;
                                                    do {
                                                      if(31 == b) {
                                                        d = 1;
                                                        break a
                                                      }else {
                                                        if(32 == b) {
                                                          HEAP32[c + 44 >> 2] = e;
                                                          e = _h264bsdGetBits(a, 8);
                                                          b = -1 == (e | 0) ? 33 : 34;
                                                          do {
                                                            if(33 == b) {
                                                              d = 1;
                                                              break a
                                                            }else {
                                                              34 == b && (HEAP32[c + 48 >> 2] = e)
                                                            }
                                                          }while(0)
                                                        }
                                                      }
                                                    }while(0)
                                                  }
                                                }
                                              }while(0)
                                            }else {
                                              35 == b && (HEAP32[c + 40 >> 2] = 2, HEAP32[c + 44 >> 2] = 2, HEAP32[c + 48 >> 2] = 2)
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
                        37 == b && (HEAP32[c + 28 >> 2] = 5, HEAP32[c + 40 >> 2] = 2, HEAP32[c + 44 >> 2] = 2, HEAP32[c + 48 >> 2] = 2)
                      }
                    }while(0);
                    e = _h264bsdGetBits(a, 1);
                    b = -1 == (e | 0) ? 39 : 40;
                    do {
                      if(39 == b) {
                        d = 1
                      }else {
                        if(40 == b) {
                          HEAP32[c + 52 >> 2] = 1 == (e | 0) ? 1 : 0;
                          b = 0 != (HEAP32[c + 52 >> 2] | 0) ? 41 : 50;
                          do {
                            if(41 == b) {
                              e = _h264bsdDecodeExpGolombUnsigned(a, c + 56);
                              b = 0 != (e | 0) ? 42 : 43;
                              do {
                                if(42 == b) {
                                  d = e;
                                  break a
                                }else {
                                  if(43 == b) {
                                    b = 5 < HEAPU32[c + 56 >> 2] >>> 0 ? 44 : 45;
                                    do {
                                      if(44 == b) {
                                        d = 1;
                                        break a
                                      }else {
                                        if(45 == b) {
                                          e = _h264bsdDecodeExpGolombUnsigned(a, c + 60);
                                          b = 0 != (e | 0) ? 46 : 47;
                                          do {
                                            if(46 == b) {
                                              d = e;
                                              break a
                                            }else {
                                              if(47 == b) {
                                                b = 5 < HEAPU32[c + 60 >> 2] >>> 0 ? 48 : 49;
                                                do {
                                                  if(48 == b) {
                                                    d = 1;
                                                    break a
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
                          e = _h264bsdGetBits(a, 1);
                          b = -1 == (e | 0) ? 51 : 52;
                          do {
                            if(51 == b) {
                              d = 1
                            }else {
                              if(52 == b) {
                                HEAP32[c + 64 >> 2] = 1 == (e | 0) ? 1 : 0;
                                b = 0 != (HEAP32[c + 64 >> 2] | 0) ? 53 : 64;
                                do {
                                  if(53 == b) {
                                    e = _h264bsdShowBits32(a);
                                    b = -1 == (_h264bsdFlushBits(a, 32) | 0) ? 54 : 55;
                                    do {
                                      if(54 == b) {
                                        d = 1;
                                        break a
                                      }else {
                                        if(55 == b) {
                                          b = 0 == (e | 0) ? 56 : 57;
                                          do {
                                            if(56 == b) {
                                              d = 1;
                                              break a
                                            }else {
                                              if(57 == b) {
                                                HEAP32[c + 68 >> 2] = e;
                                                e = _h264bsdShowBits32(a);
                                                b = -1 == (_h264bsdFlushBits(a, 32) | 0) ? 58 : 59;
                                                do {
                                                  if(58 == b) {
                                                    d = 1;
                                                    break a
                                                  }else {
                                                    if(59 == b) {
                                                      b = 0 == (e | 0) ? 60 : 61;
                                                      do {
                                                        if(60 == b) {
                                                          d = 1;
                                                          break a
                                                        }else {
                                                          if(61 == b) {
                                                            HEAP32[c + 72 >> 2] = e;
                                                            e = _h264bsdGetBits(a, 1);
                                                            b = -1 == (e | 0) ? 62 : 63;
                                                            do {
                                                              if(62 == b) {
                                                                d = 1;
                                                                break a
                                                              }else {
                                                                63 == b && (HEAP32[c + 76 >> 2] = 1 == (e | 0) ? 1 : 0)
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
                                e = _h264bsdGetBits(a, 1);
                                b = -1 == (e | 0) ? 65 : 66;
                                do {
                                  if(65 == b) {
                                    d = 1
                                  }else {
                                    if(66 == b) {
                                      HEAP32[c + 80 >> 2] = 1 == (e | 0) ? 1 : 0;
                                      b = 0 != (HEAP32[c + 80 >> 2] | 0) ? 67 : 70;
                                      do {
                                        if(67 == b) {
                                          e = _DecodeHrdParameters(a, c + 84);
                                          b = 0 != (e | 0) ? 68 : 69;
                                          do {
                                            if(68 == b) {
                                              d = e;
                                              break a
                                            }
                                          }while(0)
                                        }else {
                                          70 == b && (HEAP32[c + 84 >> 2] = 1, HEAP32[c + 96 >> 2] = 288000001, HEAP32[c + 224 >> 2] = 288000001, HEAP32[c + 480 >> 2] = 24, HEAP32[c + 484 >> 2] = 24, HEAP32[c + 488 >> 2] = 24, HEAP32[c + 492 >> 2] = 24)
                                        }
                                      }while(0);
                                      e = _h264bsdGetBits(a, 1);
                                      b = -1 == (e | 0) ? 72 : 73;
                                      do {
                                        if(72 == b) {
                                          d = 1
                                        }else {
                                          if(73 == b) {
                                            HEAP32[c + 496 >> 2] = 1 == (e | 0) ? 1 : 0;
                                            b = 0 != (HEAP32[c + 496 >> 2] | 0) ? 74 : 77;
                                            do {
                                              if(74 == b) {
                                                e = _DecodeHrdParameters(a, c + 500);
                                                b = 0 != (e | 0) ? 75 : 76;
                                                do {
                                                  if(75 == b) {
                                                    d = e;
                                                    break a
                                                  }
                                                }while(0)
                                              }else {
                                                77 == b && (HEAP32[c + 500 >> 2] = 1, HEAP32[c + 512 >> 2] = 240000001, HEAP32[c + 640 >> 2] = 240000001, HEAP32[c + 896 >> 2] = 24, HEAP32[c + 900 >> 2] = 24, HEAP32[c + 904 >> 2] = 24, HEAP32[c + 908 >> 2] = 24)
                                              }
                                            }while(0);
                                            b = 0 != (HEAP32[c + 80 >> 2] | 0) ? 80 : 79;
                                            h:do {
                                              if(79 == b) {
                                                b = 0 != (HEAP32[c + 496 >> 2] | 0) ? 80 : 83;
                                                break h
                                              }
                                            }while(0);
                                            do {
                                              if(80 == b) {
                                                e = _h264bsdGetBits(a, 1);
                                                b = -1 == (e | 0) ? 81 : 82;
                                                do {
                                                  if(81 == b) {
                                                    d = 1;
                                                    break a
                                                  }else {
                                                    82 == b && (HEAP32[c + 912 >> 2] = 1 == (e | 0) ? 1 : 0)
                                                  }
                                                }while(0)
                                              }
                                            }while(0);
                                            e = _h264bsdGetBits(a, 1);
                                            b = -1 == (e | 0) ? 84 : 85;
                                            do {
                                              if(84 == b) {
                                                d = 1
                                              }else {
                                                if(85 == b) {
                                                  HEAP32[c + 916 >> 2] = 1 == (e | 0) ? 1 : 0;
                                                  e = _h264bsdGetBits(a, 1);
                                                  b = -1 == (e | 0) ? 86 : 87;
                                                  do {
                                                    if(86 == b) {
                                                      d = 1
                                                    }else {
                                                      if(87 == b) {
                                                        HEAP32[c + 920 >> 2] = 1 == (e | 0) ? 1 : 0;
                                                        b = 0 != (HEAP32[c + 920 >> 2] | 0) ? 88 : 111;
                                                        do {
                                                          if(88 == b) {
                                                            e = _h264bsdGetBits(a, 1);
                                                            b = -1 == (e | 0) ? 89 : 90;
                                                            do {
                                                              if(89 == b) {
                                                                d = 1;
                                                                break a
                                                              }else {
                                                                if(90 == b) {
                                                                  HEAP32[c + 924 >> 2] = 1 == (e | 0) ? 1 : 0;
                                                                  e = _h264bsdDecodeExpGolombUnsigned(a, c + 928);
                                                                  b = 0 != (e | 0) ? 91 : 92;
                                                                  do {
                                                                    if(91 == b) {
                                                                      d = e;
                                                                      break a
                                                                    }else {
                                                                      if(92 == b) {
                                                                        b = 16 < HEAPU32[c + 928 >> 2] >>> 0 ? 93 : 94;
                                                                        do {
                                                                          if(93 == b) {
                                                                            d = 1;
                                                                            break a
                                                                          }else {
                                                                            if(94 == b) {
                                                                              e = _h264bsdDecodeExpGolombUnsigned(a, c + 932);
                                                                              b = 0 != (e | 0) ? 95 : 96;
                                                                              do {
                                                                                if(95 == b) {
                                                                                  d = e;
                                                                                  break a
                                                                                }else {
                                                                                  if(96 == b) {
                                                                                    b = 16 < HEAPU32[c + 932 >> 2] >>> 0 ? 97 : 98;
                                                                                    do {
                                                                                      if(97 == b) {
                                                                                        d = 1;
                                                                                        break a
                                                                                      }else {
                                                                                        if(98 == b) {
                                                                                          e = _h264bsdDecodeExpGolombUnsigned(a, c + 936);
                                                                                          b = 0 != (e | 0) ? 99 : 100;
                                                                                          do {
                                                                                            if(99 == b) {
                                                                                              d = e;
                                                                                              break a
                                                                                            }else {
                                                                                              if(100 == b) {
                                                                                                b = 16 < HEAPU32[c + 936 >> 2] >>> 0 ? 101 : 102;
                                                                                                do {
                                                                                                  if(101 == b) {
                                                                                                    d = 1;
                                                                                                    break a
                                                                                                  }else {
                                                                                                    if(102 == b) {
                                                                                                      e = _h264bsdDecodeExpGolombUnsigned(a, c + 940);
                                                                                                      b = 0 != (e | 0) ? 103 : 104;
                                                                                                      do {
                                                                                                        if(103 == b) {
                                                                                                          d = e;
                                                                                                          break a
                                                                                                        }else {
                                                                                                          if(104 == b) {
                                                                                                            b = 16 < HEAPU32[c + 940 >> 2] >>> 0 ? 105 : 106;
                                                                                                            do {
                                                                                                              if(105 == b) {
                                                                                                                d = 1;
                                                                                                                break a
                                                                                                              }else {
                                                                                                                if(106 == b) {
                                                                                                                  e = _h264bsdDecodeExpGolombUnsigned(a, c + 944);
                                                                                                                  b = 0 != (e | 0) ? 107 : 108;
                                                                                                                  do {
                                                                                                                    if(107 == b) {
                                                                                                                      d = e;
                                                                                                                      break a
                                                                                                                    }else {
                                                                                                                      if(108 == b) {
                                                                                                                        e = _h264bsdDecodeExpGolombUnsigned(a, c + 948);
                                                                                                                        b = 0 != (e | 0) ? 109 : 110;
                                                                                                                        do {
                                                                                                                          if(109 == b) {
                                                                                                                            d = e;
                                                                                                                            break a
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
                                                          }else {
                                                            111 == b && (HEAP32[c + 924 >> 2] = 1, HEAP32[c + 928 >> 2] = 2, HEAP32[c + 932 >> 2] = 1, HEAP32[c + 936 >> 2] = 16, HEAP32[c + 940 >> 2] = 16, HEAP32[c + 944 >> 2] = 16, HEAP32[c + 948 >> 2] = 16)
                                                          }
                                                        }while(0);
                                                        d = 0
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
  return d
}
_h264bsdDecodeVuiParameters.X = 1;
function _h264bsdDecodePicOrderCnt(a, c, b, d) {
  var e, f, g, h, j, l, k, m, o;
  o = 0;
  e = 0 != (HEAP32[b + 284 >> 2] | 0) ? 1 : 7;
  do {
    if(1 == e) {
      f = 0;
      b:for(;;) {
        if(0 == (HEAP32[b + 288 + 20 * f >> 2] | 0)) {
          break b
        }
        e = 5 == (HEAP32[b + 288 + 20 * f >> 2] | 0) ? 4 : 5;
        do {
          if(4 == e) {
            o = 1;
            break b
          }else {
            5 == e && (f += 1)
          }
        }while(0)
      }
    }
  }while(0);
  e = HEAP32[c + 16 >> 2];
  e = 0 == e ? 8 : 1 == e ? 31 : 64;
  do {
    if(64 == e) {
      e = 5 == (HEAP32[d >> 2] | 0) ? 65 : 66, 65 == e ? h = 0 : 66 == e && (e = HEAPU32[a + 8 >> 2] >>> 0 > HEAPU32[b + 12 >> 2] >>> 0 ? 67 : 68, 67 == e ? h = HEAP32[a + 12 >> 2] + HEAP32[c + 12 >> 2] : 68 == e && (h = HEAP32[a + 12 >> 2])), e = 5 == (HEAP32[d >> 2] | 0) ? 71 : 72, 71 == e ? g = 0 : 72 == e && (e = 0 == (HEAP32[d + 4 >> 2] | 0) ? 73 : 74, 73 == e ? g = (h + HEAP32[b + 12 >> 2] << 1) - 1 : 74 == e && (g = h + HEAP32[b + 12 >> 2] << 1)), e = 0 != (o | 0) ? 78 : 77, 78 == e ? (HEAP32[a + 
      12 >> 2] = 0, g = HEAP32[a + 8 >> 2] = 0) : 77 == e && (HEAP32[a + 12 >> 2] = h, HEAP32[a + 8 >> 2] = HEAP32[b + 12 >> 2])
    }else {
      if(8 == e) {
        e = 5 == (HEAP32[d >> 2] | 0) ? 9 : 10;
        9 == e && (HEAP32[a + 4 >> 2] = 0, HEAP32[a >> 2] = 0);
        e = HEAPU32[b + 20 >> 2] >>> 0 < HEAPU32[a >> 2] >>> 0 ? 11 : 13;
        b:do {
          if(11 == e) {
            if(!(HEAP32[a >> 2] - HEAP32[b + 20 >> 2] >>> 0 >= Math.floor((HEAPU32[c + 20 >> 2] >>> 0) / 2) >>> 0)) {
              e = 13;
              break b
            }
            g = HEAP32[a + 4 >> 2] + HEAP32[c + 20 >> 2];
            e = 18;
            break b
          }
        }while(0);
        do {
          if(13 == e) {
            e = HEAPU32[b + 20 >> 2] >>> 0 > HEAPU32[a >> 2] >>> 0 ? 14 : 16;
            c:do {
              if(14 == e) {
                if(!(HEAP32[b + 20 >> 2] - HEAP32[a >> 2] >>> 0 > Math.floor((HEAPU32[c + 20 >> 2] >>> 0) / 2) >>> 0)) {
                  e = 16;
                  break c
                }
                g = HEAP32[a + 4 >> 2] - HEAP32[c + 20 >> 2];
                e = 17;
                break c
              }
            }while(0);
            16 == e && (g = HEAP32[a + 4 >> 2])
          }
        }while(0);
        e = 0 != (HEAP32[d + 4 >> 2] | 0) ? 19 : 20;
        19 == e && (HEAP32[a + 4 >> 2] = g);
        g += HEAP32[b + 20 >> 2];
        e = 0 > (HEAP32[b + 24 >> 2] | 0) ? 21 : 22;
        21 == e && (g += HEAP32[b + 24 >> 2]);
        e = 0 != (HEAP32[d + 4 >> 2] | 0) ? 23 : 30;
        23 == e && (e = 0 != (o | 0) ? 24 : 28, 24 == e ? (HEAP32[a + 4 >> 2] = 0, e = 0 > (HEAP32[b + 24 >> 2] | 0) ? 25 : 26, 25 == e ? HEAP32[a >> 2] = -HEAP32[b + 24 >> 2] : 26 == e && (HEAP32[a >> 2] = 0), g = 0) : 28 == e && (HEAP32[a >> 2] = HEAP32[b + 20 >> 2]))
      }else {
        if(31 == e) {
          e = 5 == (HEAP32[d >> 2] | 0) ? 32 : 33;
          32 == e ? h = 0 : 33 == e && (e = HEAPU32[a + 8 >> 2] >>> 0 > HEAPU32[b + 12 >> 2] >>> 0 ? 34 : 35, 34 == e ? h = HEAP32[a + 12 >> 2] + HEAP32[c + 12 >> 2] : 35 == e && (h = HEAP32[a + 12 >> 2]));
          e = 0 != (HEAP32[c + 36 >> 2] | 0) ? 38 : 39;
          38 == e ? j = h + HEAP32[b + 12 >> 2] : 39 == e && (j = 0);
          e = 0 == (HEAP32[d + 4 >> 2] | 0) ? 41 : 43;
          b:do {
            if(41 == e) {
              if(!(0 < j >>> 0)) {
                break b
              }
              j -= 1
            }
          }while(0);
          e = 0 < j >>> 0 ? 44 : 45;
          44 == e && (l = Math.floor((j - 1 >>> 0) / (HEAPU32[c + 36 >> 2] >>> 0)), k = (j - 1 >>> 0) % (HEAPU32[c + 36 >> 2] >>> 0));
          f = m = 0;
          b:for(;;) {
            if(!(f >>> 0 < HEAPU32[c + 36 >> 2] >>> 0)) {
              break b
            }
            m += HEAP32[HEAP32[c + 40 >> 2] + (f << 2) >> 2];
            f += 1
          }
          e = 0 < j >>> 0 ? 50 : 55;
          do {
            if(50 == e) {
              g = l * m;
              f = 0;
              c:for(;;) {
                if(!(f >>> 0 <= k >>> 0)) {
                  break c
                }
                g += HEAP32[HEAP32[c + 40 >> 2] + (f << 2) >> 2];
                f += 1
              }
            }else {
              55 == e && (g = 0)
            }
          }while(0);
          e = 0 == (HEAP32[d + 4 >> 2] | 0) ? 57 : 58;
          57 == e && (g += HEAP32[c + 28 >> 2]);
          g += HEAP32[b + 28 >> 2];
          e = 0 > (HEAP32[c + 32 >> 2] + HEAP32[b + 32 >> 2] | 0) ? 59 : 60;
          59 == e && (g += HEAP32[c + 32 >> 2] + HEAP32[b + 32 >> 2]);
          e = 0 != (o | 0) ? 62 : 61;
          62 == e ? (HEAP32[a + 12 >> 2] = 0, g = HEAP32[a + 8 >> 2] = 0) : 61 == e && (HEAP32[a + 12 >> 2] = h, HEAP32[a + 8 >> 2] = HEAP32[b + 12 >> 2])
        }
      }
    }
  }while(0);
  return g
}
_h264bsdDecodePicOrderCnt.X = 1;
function _DecodeHrdParameters(a, c) {
  var b, d, e, f;
  e = _h264bsdDecodeExpGolombUnsigned(a, c);
  b = 0 != (e | 0) ? 1 : 2;
  a:do {
    if(1 == b) {
      d = e
    }else {
      if(2 == b) {
        HEAP32[c >> 2] += 1;
        b = 32 < HEAPU32[c >> 2] >>> 0 ? 3 : 4;
        do {
          if(3 == b) {
            d = 1
          }else {
            if(4 == b) {
              e = _h264bsdGetBits(a, 4);
              b = -1 == (e | 0) ? 5 : 6;
              do {
                if(5 == b) {
                  d = 1
                }else {
                  if(6 == b) {
                    HEAP32[c + 4 >> 2] = e;
                    e = _h264bsdGetBits(a, 4);
                    b = -1 == (e | 0) ? 7 : 8;
                    do {
                      if(7 == b) {
                        d = 1
                      }else {
                        if(8 == b) {
                          HEAP32[c + 8 >> 2] = e;
                          f = 0;
                          for(;;) {
                            b = f >>> 0 < HEAPU32[c >> 2] >>> 0 ? 10 : 22;
                            do {
                              if(10 == b) {
                                e = _h264bsdDecodeExpGolombUnsigned(a, c + 12 + (f << 2));
                                b = 0 != (e | 0) ? 11 : 12;
                                do {
                                  if(11 == b) {
                                    d = e;
                                    break a
                                  }else {
                                    if(12 == b) {
                                      b = 4294967294 < HEAPU32[c + 12 + (f << 2) >> 2] >>> 0 ? 13 : 14;
                                      do {
                                        if(13 == b) {
                                          d = 1;
                                          break a
                                        }else {
                                          if(14 == b) {
                                            HEAP32[c + 12 + (f << 2) >> 2] += 1;
                                            HEAP32[c + 12 + (f << 2) >> 2] *= 1 << HEAP32[c + 4 >> 2] + 6;
                                            e = _h264bsdDecodeExpGolombUnsigned(a, c + 140 + (f << 2));
                                            b = 0 != (e | 0) ? 15 : 16;
                                            do {
                                              if(15 == b) {
                                                d = e;
                                                break a
                                              }else {
                                                if(16 == b) {
                                                  b = 4294967294 < HEAPU32[c + 140 + (f << 2) >> 2] >>> 0 ? 17 : 18;
                                                  do {
                                                    if(17 == b) {
                                                      d = 1;
                                                      break a
                                                    }else {
                                                      if(18 == b) {
                                                        HEAP32[c + 140 + (f << 2) >> 2] += 1;
                                                        HEAP32[c + 140 + (f << 2) >> 2] *= 1 << HEAP32[c + 8 >> 2] + 4;
                                                        e = _h264bsdGetBits(a, 1);
                                                        b = -1 == (e | 0) ? 19 : 20;
                                                        do {
                                                          if(19 == b) {
                                                            d = 1;
                                                            break a
                                                          }else {
                                                            20 == b && (HEAP32[c + 268 + (f << 2) >> 2] = 1 == (e | 0) ? 1 : 0, f += 1)
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
                                if(22 == b) {
                                  e = _h264bsdGetBits(a, 5);
                                  b = -1 == (e | 0) ? 23 : 24;
                                  do {
                                    if(23 == b) {
                                      d = 1;
                                      break a
                                    }else {
                                      if(24 == b) {
                                        HEAP32[c + 396 >> 2] = e + 1;
                                        e = _h264bsdGetBits(a, 5);
                                        b = -1 == (e | 0) ? 25 : 26;
                                        do {
                                          if(25 == b) {
                                            d = 1;
                                            break a
                                          }else {
                                            if(26 == b) {
                                              HEAP32[c + 400 >> 2] = e + 1;
                                              e = _h264bsdGetBits(a, 5);
                                              b = -1 == (e | 0) ? 27 : 28;
                                              do {
                                                if(27 == b) {
                                                  d = 1;
                                                  break a
                                                }else {
                                                  if(28 == b) {
                                                    HEAP32[c + 404 >> 2] = e + 1;
                                                    e = _h264bsdGetBits(a, 5);
                                                    b = -1 == (e | 0) ? 29 : 30;
                                                    do {
                                                      if(29 == b) {
                                                        d = 1;
                                                        break a
                                                      }else {
                                                        if(30 == b) {
                                                          HEAP32[c + 408 >> 2] = e;
                                                          d = 0;
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
  return d
}
_DecodeHrdParameters.X = 1;
function _h264bsdInit(a, c) {
  var b, d;
  _h264bsdInitStorage(a);
  b = _H264SwDecMalloc(2112);
  HEAP32[a + 3376 >> 2] = b;
  b = 0 != (HEAP32[a + 3376 >> 2] | 0) ? 2 : 1;
  2 == b ? (3 == (0 != (c | 0) ? 3 : 4) && (HEAP32[a + 1216 >> 2] = 1), d = 0) : 1 == b && (d = 1);
  return d
}
function _h264bsdDecode(a, c, b, d, e) {
  var f = STACKTOP;
  STACKTOP += 204;
  var g, h, j, l = f + 4, k = f + 12, m = f + 104, o = f + 176, q = f + 196, p, n = f + 200;
  p = HEAP32[q >> 2] = 0;
  g = 0 != (HEAP32[a + 3344 >> 2] | 0) ? 1 : 3;
  a:do {
    if(1 == g) {
      if((c | 0) != (HEAP32[a + 3348 >> 2] | 0)) {
        g = 3;
        break a
      }
      j = o;
      var r, s;
      g = a + 3356;
      r = g + 20;
      if(j % 4 == g % 4) {
        for(;0 !== g % 4 && g < r;) {
          HEAP8[j++] = HEAP8[g++]
        }
        g >>= 2;
        j >>= 2;
        for(s = r >> 2;g < s;) {
          HEAP32[j++] = HEAP32[g++]
        }
        g <<= 2;
        j <<= 2
      }
      for(;g < r;) {
        HEAP8[j++] = HEAP8[g++]
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
    if(3 == g) {
      j = _h264bsdExtractNalUnit(c, b, o, e);
      g = 0 != (j | 0) ? 4 : 5;
      do {
        if(4 == g) {
          h = 3;
          g = 87;
          break a
        }else {
          if(5 == g) {
            g = o;
            j = a + 3356;
            r = g + 20;
            if(j % 4 == g % 4) {
              for(;0 !== g % 4 && g < r;) {
                HEAP8[j++] = HEAP8[g++]
              }
              g >>= 2;
              j >>= 2;
              for(s = r >> 2;g < s;) {
                HEAP32[j++] = HEAP32[g++]
              }
              g <<= 2;
              j <<= 2
            }
            for(;g < r;) {
              HEAP8[j++] = HEAP8[g++]
            }
            HEAP32[a + 3352 >> 2] = HEAP32[e >> 2];
            HEAP32[a + 3348 >> 2] = c;
            g = 6;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  a:do {
    if(6 == g) {
      HEAP32[a + 3344 >> 2] = 0;
      j = _h264bsdDecodeNalUnit(o, l);
      g = 0 != (j | 0) ? 7 : 8;
      do {
        if(7 == g) {
          h = 3
        }else {
          if(8 == g) {
            g = 0 == (HEAP32[l >> 2] | 0) ? 10 : 9;
            c:do {
              if(9 == g) {
                if(13 <= HEAPU32[l >> 2] >>> 0) {
                  break c
                }
                j = _h264bsdCheckAccessUnitBoundary(o, l, a, q);
                g = 0 != (j | 0) ? 12 : 15;
                do {
                  if(12 == g) {
                    g = 65520 == (j | 0) ? 13 : 14;
                    do {
                      if(13 == g) {
                        h = 4;
                        break a
                      }else {
                        if(14 == g) {
                          h = 3;
                          break a
                        }
                      }
                    }while(0)
                  }else {
                    if(15 == g) {
                      g = 0 != (HEAP32[q >> 2] | 0) ? 16 : 26;
                      do {
                        if(16 == g) {
                          g = 0 != (HEAP32[a + 1184 >> 2] | 0) ? 17 : 24;
                          f:do {
                            if(17 == g) {
                              if(0 == (HEAP32[a + 16 >> 2] | 0)) {
                                g = 24;
                                break f
                              }
                              g = 0 != (HEAP32[a + 3380 >> 2] | 0) ? 19 : 20;
                              do {
                                if(19 == g) {
                                  h = 3;
                                  break a
                                }else {
                                  if(20 == g) {
                                    g = 0 != (HEAP32[a + 1188 >> 2] | 0) ? 22 : 21;
                                    22 == g ? j = _h264bsdConceal(a, a + 1336, HEAP32[a + 1372 >> 2]) : 21 == g && (p = _h264bsdAllocateDpbImage(a + 1220), HEAP32[a + 1336 >> 2] = p, _h264bsdInitRefPicList(a + 1220), j = _h264bsdConceal(a, a + 1336, 0));
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
                          24 == g && (HEAP32[a + 1188 >> 2] = 0);
                          HEAP32[a + 1180 >> 2] = 0
                        }
                      }while(0);
                      g = 0 != (p | 0) ? 79 : 27;
                      do {
                        if(27 == g) {
                          c = HEAP32[l >> 2];
                          g = 7 == c ? 28 : 8 == c ? 31 : 5 == c ? 34 : 1 == c ? 35 : 6 == c ? 76 : 77;
                          f:do {
                            if(77 == g) {
                              g = 78;
                              break f
                            }else {
                              if(28 == g) {
                                j = _h264bsdDecodeSeqParamSet(o, k);
                                g = 0 != (j | 0) ? 29 : 30;
                                do {
                                  if(29 == g) {
                                    _H264SwDecFree(HEAP32[k + 40 >> 2]);
                                    HEAP32[k + 40 >> 2] = 0;
                                    _H264SwDecFree(HEAP32[k + 84 >> 2]);
                                    HEAP32[k + 84 >> 2] = 0;
                                    h = 3;
                                    break a
                                  }else {
                                    if(30 == g) {
                                      j = _h264bsdStoreSeqParamSet(a, k);
                                      g = 78;
                                      break f
                                    }
                                  }
                                }while(0)
                              }else {
                                if(31 == g) {
                                  j = _h264bsdDecodePicParamSet(o, m);
                                  g = 0 != (j | 0) ? 32 : 33;
                                  do {
                                    if(32 == g) {
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
                                      if(33 == g) {
                                        j = _h264bsdStorePicParamSet(a, m);
                                        g = 78;
                                        break f
                                      }
                                    }
                                  }while(0)
                                }else {
                                  if(34 == g) {
                                    g = 35;
                                    break f
                                  }else {
                                    if(76 == g) {
                                      g = 78;
                                      break f
                                    }
                                  }
                                }
                              }
                            }
                          }while(0);
                          do {
                            if(35 == g) {
                              g = 0 != (HEAP32[a + 1180 >> 2] | 0) ? 36 : 37;
                              do {
                                if(36 == g) {
                                  h = 0;
                                  break a
                                }else {
                                  if(37 == g) {
                                    HEAP32[a + 1184 >> 2] = 1;
                                    g = 0 != (_h264bsdIsStartOfPicture(a) | 0) ? 38 : 59;
                                    do {
                                      if(38 == g) {
                                        HEAP32[a + 1204 >> 2] = 0;
                                        HEAP32[a + 1208 >> 2] = d;
                                        _h264bsdCheckPpsId(o, f);
                                        c = HEAP32[a + 8 >> 2];
                                        j = _h264bsdActivateParamSets(a, HEAP32[f >> 2], 5 == (HEAP32[l >> 2] | 0) ? 1 : 0);
                                        g = 0 != (j | 0) ? 39 : 42;
                                        do {
                                          if(39 == g) {
                                            HEAP32[a + 4 >> 2] = 256;
                                            HEAP32[a + 12 >> 2] = 0;
                                            HEAP32[a + 8 >> 2] = 32;
                                            HEAP32[a + 16 >> 2] = 0;
                                            HEAP32[a + 3380 >> 2] = 0;
                                            g = 65535 == (j | 0) ? 40 : 41;
                                            do {
                                              if(40 == g) {
                                                h = 5;
                                                break a
                                              }else {
                                                if(41 == g) {
                                                  h = 4;
                                                  break a
                                                }
                                              }
                                            }while(0)
                                          }else {
                                            if(42 == g) {
                                              g = (c | 0) != (HEAP32[a + 8 >> 2] | 0) ? 43 : 58;
                                              do {
                                                if(43 == g) {
                                                  d = 0;
                                                  k = HEAP32[a + 16 >> 2];
                                                  HEAP32[n >> 2] = 1;
                                                  g = 32 > HEAPU32[a >> 2] >>> 0 ? 44 : 45;
                                                  44 == g && (d = HEAP32[a + 20 + (HEAP32[a >> 2] << 2) >> 2]);
                                                  HEAP32[e >> 2] = 0;
                                                  HEAP32[a + 3344 >> 2] = 1;
                                                  g = 5 == (HEAP32[l >> 2] | 0) ? 46 : 47;
                                                  46 == g ? j = _h264bsdCheckPriorPicsFlag(n, o, k, HEAP32[a + 12 >> 2], HEAP32[l >> 2]) : 47 == g && (j = 1);
                                                  g = 0 != (j | 0) ? 55 : 49;
                                                  k:do {
                                                    if(49 == g) {
                                                      if(0 != (HEAP32[n >> 2] | 0)) {
                                                        g = 55;
                                                        break k
                                                      }
                                                      if(0 != (HEAP32[a + 1276 >> 2] | 0)) {
                                                        g = 55;
                                                        break k
                                                      }
                                                      if(0 == (d | 0)) {
                                                        g = 55;
                                                        break k
                                                      }
                                                      if((HEAP32[d + 52 >> 2] | 0) != (HEAP32[k + 52 >> 2] | 0)) {
                                                        g = 55;
                                                        break k
                                                      }
                                                      if((HEAP32[d + 56 >> 2] | 0) != (HEAP32[k + 56 >> 2] | 0)) {
                                                        g = 55;
                                                        break k
                                                      }
                                                      if((HEAP32[d + 88 >> 2] | 0) != (HEAP32[k + 88 >> 2] | 0)) {
                                                        g = 55;
                                                        break k
                                                      }
                                                      _h264bsdFlushDpb(a + 1220);
                                                      g = 57;
                                                      break k
                                                    }
                                                  }while(0);
                                                  55 == g && (HEAP32[a + 1280 >> 2] = 0);
                                                  HEAP32[a >> 2] = HEAP32[a + 8 >> 2];
                                                  h = 2;
                                                  break a
                                                }
                                              }while(0)
                                            }
                                          }
                                        }while(0)
                                      }
                                    }while(0);
                                    g = 0 != (HEAP32[a + 3380 >> 2] | 0) ? 60 : 61;
                                    do {
                                      if(60 == g) {
                                        h = 3;
                                        break a
                                      }else {
                                        if(61 == g) {
                                          j = _h264bsdDecodeSliceHeader(o, a + 2356, HEAP32[a + 16 >> 2], HEAP32[a + 12 >> 2], l);
                                          g = 0 != (j | 0) ? 62 : 63;
                                          do {
                                            if(62 == g) {
                                              h = 3;
                                              break a
                                            }else {
                                              if(63 == g) {
                                                g = 0 != (_h264bsdIsStartOfPicture(a) | 0) ? 64 : 69;
                                                do {
                                                  if(64 == g) {
                                                    g = 5 == (HEAP32[l >> 2] | 0) ? 68 : 65;
                                                    do {
                                                      if(65 == g) {
                                                        j = _h264bsdCheckGapsInFrameNum(a + 1220, HEAP32[a + 2368 >> 2], 0 != (HEAP32[l + 4 >> 2] | 0) ? 1 : 0, HEAP32[HEAP32[a + 16 >> 2] + 48 >> 2]);
                                                        g = 0 != (j | 0) ? 66 : 67;
                                                        do {
                                                          if(66 == g) {
                                                            h = 3;
                                                            break a
                                                          }
                                                        }while(0)
                                                      }
                                                    }while(0);
                                                    c = _h264bsdAllocateDpbImage(a + 1220);
                                                    HEAP32[a + 1336 >> 2] = c
                                                  }
                                                }while(0);
                                                g = a + 2356;
                                                j = a + 1368;
                                                r = g + 988;
                                                if(j % 4 == g % 4) {
                                                  for(;0 !== g % 4 && g < r;) {
                                                    HEAP8[j++] = HEAP8[g++]
                                                  }
                                                  g >>= 2;
                                                  j >>= 2;
                                                  for(s = r >> 2;g < s;) {
                                                    HEAP32[j++] = HEAP32[g++]
                                                  }
                                                  g <<= 2;
                                                  j <<= 2
                                                }
                                                for(;g < r;) {
                                                  HEAP8[j++] = HEAP8[g++]
                                                }
                                                HEAP32[a + 1188 >> 2] = 1;
                                                g = l;
                                                j = a + 1360;
                                                for(r = g + 8;g < r;) {
                                                  HEAP8[j++] = HEAP8[g++]
                                                }
                                                _h264bsdComputeSliceGroupMap(a, HEAP32[a + 1432 >> 2]);
                                                _h264bsdInitRefPicList(a + 1220);
                                                j = _h264bsdReorderRefPicList(a + 1220, a + 1436, HEAP32[a + 1380 >> 2], HEAP32[a + 1412 >> 2]);
                                                g = 0 != (j | 0) ? 70 : 71;
                                                do {
                                                  if(70 == g) {
                                                    h = 3;
                                                    break a
                                                  }else {
                                                    if(71 == g) {
                                                      j = _h264bsdDecodeSliceData(o, a, a + 1336, a + 1368);
                                                      g = 0 != (j | 0) ? 72 : 73;
                                                      do {
                                                        if(72 == g) {
                                                          _h264bsdMarkSliceCorrupted(a, HEAP32[a + 1368 >> 2]);
                                                          h = 3;
                                                          break a
                                                        }else {
                                                          73 == g && (g = 0 != (_h264bsdIsEndOfPicture(a) | 0) ? 74 : 75, 74 == g && (p = 1, HEAP32[a + 1180 >> 2] = 1))
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
                          }while(0)
                        }
                      }while(0);
                      g = 0 != (p | 0) ? 80 : 86;
                      do {
                        if(80 == g) {
                          _h264bsdFilterPicture(a + 1336, HEAP32[a + 1212 >> 2]);
                          _h264bsdResetStorage(a);
                          e = _h264bsdDecodePicOrderCnt(a + 1284, HEAP32[a + 16 >> 2], a + 1368, a + 1360);
                          g = 0 != (HEAP32[a + 1188 >> 2] | 0) ? 81 : 85;
                          81 == g && (g = 0 != (HEAP32[a + 1364 >> 2] | 0) ? 82 : 83, 82 == g ? _h264bsdMarkDecRefPic(a + 1220, a + 1644, a + 1336, HEAP32[a + 1380 >> 2], e, 5 == (HEAP32[a + 1360 >> 2] | 0) ? 1 : 0, HEAP32[a + 1208 >> 2], HEAP32[a + 1204 >> 2]) : 83 == g && _h264bsdMarkDecRefPic(a + 1220, 0, a + 1336, HEAP32[a + 1380 >> 2], e, 5 == (HEAP32[a + 1360 >> 2] | 0) ? 1 : 0, HEAP32[a + 1208 >> 2], HEAP32[a + 1204 >> 2]));
                          HEAP32[a + 1184 >> 2] = 0;
                          HEAP32[a + 1188 >> 2] = 0;
                          h = 1;
                          break a
                        }else {
                          if(86 == g) {
                            h = 0;
                            break a
                          }
                        }
                      }while(0)
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
  var c, b;
  b = 0;
  a:for(;;) {
    if(!(32 > b >>> 0)) {
      break a
    }
    c = 0 != (HEAP32[a + 20 + (b << 2) >> 2] | 0) ? 3 : 4;
    3 == c && (_H264SwDecFree(HEAP32[HEAP32[a + 20 + (b << 2) >> 2] + 40 >> 2]), HEAP32[HEAP32[a + 20 + (b << 2) >> 2] + 40 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 20 + (b << 2) >> 2] + 84 >> 2]), HEAP32[HEAP32[a + 20 + (b << 2) >> 2] + 84 >> 2] = 0, _H264SwDecFree(HEAP32[a + 20 + (b << 2) >> 2]), HEAP32[a + 20 + (b << 2) >> 2] = 0);
    b += 1
  }
  b = 0;
  a:for(;;) {
    if(!(256 > b >>> 0)) {
      break a
    }
    c = 0 != (HEAP32[a + 148 + (b << 2) >> 2] | 0) ? 9 : 10;
    9 == c && (_H264SwDecFree(HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 20 >> 2]), HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 20 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 24 >> 2]), HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 24 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 28 >> 2]), HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 28 >> 2] = 0, _H264SwDecFree(HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 44 >> 2]), HEAP32[HEAP32[a + 148 + (b << 2) >> 2] + 44 >> 2] = 0, 
    _H264SwDecFree(HEAP32[a + 148 + (b << 2) >> 2]), HEAP32[a + 148 + (b << 2) >> 2] = 0);
    b += 1
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
  var c, b;
  c = 0 != (HEAP32[a + 16 >> 2] | 0) ? 1 : 2;
  1 == c ? b = HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2] : 2 == c && (b = 0);
  return b
}
function _h264bsdPicHeight(a) {
  var c, b;
  c = 0 != (HEAP32[a + 16 >> 2] | 0) ? 1 : 2;
  1 == c ? b = HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2] : 2 == c && (b = 0);
  return b
}
function _h264bsdFlushBuffer(a) {
  _h264bsdFlushDpb(a + 1220)
}
function _h264bsdVideoRange(a) {
  var c, b;
  c = 0 != (HEAP32[a + 16 >> 2] | 0) ? 1 : 6;
  a:do {
    if(1 == c) {
      if(0 == (HEAP32[HEAP32[a + 16 >> 2] + 80 >> 2] | 0)) {
        c = 6;
        break a
      }
      if(0 == (HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] | 0)) {
        c = 6;
        break a
      }
      if(0 == (HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 24 >> 2] | 0)) {
        c = 6;
        break a
      }
      if(0 == (HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 32 >> 2] | 0)) {
        c = 6;
        break a
      }
      b = 1;
      c = 7;
      break a
    }
  }while(0);
  6 == c && (b = 0);
  return b
}
function _h264bsdMatrixCoefficients(a) {
  var c, b;
  c = 0 != (HEAP32[a + 16 >> 2] | 0) ? 1 : 6;
  a:do {
    if(1 == c) {
      if(0 == (HEAP32[HEAP32[a + 16 >> 2] + 80 >> 2] | 0)) {
        c = 6;
        break a
      }
      if(0 == (HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] | 0)) {
        c = 6;
        break a
      }
      if(0 == (HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 24 >> 2] | 0)) {
        c = 6;
        break a
      }
      if(0 == (HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 36 >> 2] | 0)) {
        c = 6;
        break a
      }
      b = HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 48 >> 2];
      c = 7;
      break a
    }
  }while(0);
  6 == c && (b = 2);
  return b
}
_h264bsdMatrixCoefficients.X = 1;
function _h264bsdCroppingParams(a, c, b, d, e, f) {
  var g;
  g = 0 != (HEAP32[a + 16 >> 2] | 0) ? 1 : 3;
  a:do {
    if(1 == g) {
      if(0 == (HEAP32[HEAP32[a + 16 >> 2] + 60 >> 2] | 0)) {
        g = 3;
        break a
      }
      HEAP32[c >> 2] = 1;
      HEAP32[b >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 64 >> 2] << 1;
      HEAP32[d >> 2] = (HEAP32[HEAP32[a + 16 >> 2] + 52 >> 2] << 4) - (HEAP32[HEAP32[a + 16 >> 2] + 64 >> 2] + HEAP32[HEAP32[a + 16 >> 2] + 68 >> 2] << 1);
      HEAP32[e >> 2] = HEAP32[HEAP32[a + 16 >> 2] + 72 >> 2] << 1;
      HEAP32[f >> 2] = (HEAP32[HEAP32[a + 16 >> 2] + 56 >> 2] << 4) - (HEAP32[HEAP32[a + 16 >> 2] + 72 >> 2] + HEAP32[HEAP32[a + 16 >> 2] + 76 >> 2] << 1);
      g = 4;
      break a
    }
  }while(0);
  3 == g && (HEAP32[c >> 2] = 0, HEAP32[b >> 2] = 0, HEAP32[d >> 2] = 0, HEAP32[e >> 2] = 0, HEAP32[f >> 2] = 0)
}
_h264bsdCroppingParams.X = 1;
function _h264bsdSampleAspectRatio(a, c, b) {
  var d, e, f;
  f = e = 1;
  d = 0 != (HEAP32[a + 16 >> 2] | 0) ? 1 : 25;
  a:do {
    if(1 == d) {
      if(0 == (HEAP32[HEAP32[a + 16 >> 2] + 80 >> 2] | 0)) {
        break a
      }
      if(0 == (HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] | 0)) {
        break a
      }
      if(0 == (HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] >> 2] | 0)) {
        break a
      }
      d = HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 4 >> 2];
      d = 0 == d ? 5 : 1 == d ? 6 : 2 == d ? 7 : 3 == d ? 8 : 4 == d ? 9 : 5 == d ? 10 : 6 == d ? 11 : 7 == d ? 12 : 8 == d ? 13 : 9 == d ? 14 : 10 == d ? 15 : 11 == d ? 16 : 12 == d ? 17 : 13 == d ? 18 : 255 == d ? 19 : 23;
      do {
        if(23 == d) {
          f = e = 0
        }else {
          if(5 == d) {
            f = e = 0
          }else {
            if(6 == d) {
              f = e = 1
            }else {
              if(7 == d) {
                e = 12, f = 11
              }else {
                if(8 == d) {
                  e = 10, f = 11
                }else {
                  if(9 == d) {
                    e = 16, f = 11
                  }else {
                    if(10 == d) {
                      e = 40, f = 33
                    }else {
                      if(11 == d) {
                        e = 24, f = 11
                      }else {
                        if(12 == d) {
                          e = 20, f = 11
                        }else {
                          if(13 == d) {
                            e = 32, f = 11
                          }else {
                            if(14 == d) {
                              e = 80, f = 33
                            }else {
                              if(15 == d) {
                                e = 18, f = 11
                              }else {
                                if(16 == d) {
                                  e = 15, f = 11
                                }else {
                                  if(17 == d) {
                                    e = 64, f = 33
                                  }else {
                                    if(18 == d) {
                                      e = 160, f = 99
                                    }else {
                                      if(19 == d) {
                                        e = HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 8 >> 2];
                                        f = HEAP32[HEAP32[HEAP32[a + 16 >> 2] + 84 >> 2] + 12 >> 2];
                                        d = 0 == (e | 0) ? 21 : 20;
                                        c:do {
                                          if(20 == d) {
                                            d = 0 == (f | 0) ? 21 : 22;
                                            break c
                                          }
                                        }while(0);
                                        21 == d && (e = f = 0)
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
  HEAP32[c >> 2] = e;
  HEAP32[b >> 2] = f
}
_h264bsdSampleAspectRatio.X = 1;
function _h264bsdProfile(a) {
  var c, b;
  c = 0 != (HEAP32[a + 16 >> 2] | 0) ? 1 : 2;
  1 == c ? b = HEAP32[HEAP32[a + 16 >> 2] >> 2] : 2 == c && (b = 0);
  return b
}
function _H264SwDecRelease(a) {
  var c;
  c = 0 == (a | 0) ? 1 : 2;
  1 != c && 2 == c && (_h264bsdShutdown(a + 8), _H264SwDecFree(a))
}
function _h264bsdNextOutputPicture(a, c, b, d) {
  var e, f;
  f = _h264bsdDpbOutputPicture(a + 1220);
  a = 0 != (f | 0) ? 1 : 2;
  1 == a ? (HEAP32[c >> 2] = HEAP32[f + 4 >> 2], HEAP32[b >> 2] = HEAP32[f + 12 >> 2], HEAP32[d >> 2] = HEAP32[f + 8 >> 2], e = HEAP32[f >> 2]) : 2 == a && (e = 0);
  return e
}
function _h264bsdCheckValidParamSets(a) {
  return 0 == (_h264bsdValidParamSets(a) | 0) ? 1 : 0
}
function _H264SwDecInit(a, c) {
  var b, d, e;
  b = 0 == (a | 0) ? 1 : 2;
  1 == b ? d = -1 : 2 == b && (e = _H264SwDecMalloc(3396), b = 0 == (e | 0) ? 3 : 4, 3 == b ? d = -4 : 4 == b && (b = _h264bsdInit(e + 8, c), b = 0 != (b | 0) ? 5 : 6, 5 == b ? (_H264SwDecRelease(e), d = -4) : 6 == b && (HEAP32[e >> 2] = 1, HEAP32[e + 4 >> 2] = 0, HEAP32[a >> 2] = e, d = 0)));
  return d
}
function _broadwayOnHeadersDecoded() {
}
Module._broadwayOnHeadersDecoded = _broadwayOnHeadersDecoded;
function _broadwayPlayStream() {
  _playStream(_broadwayStream)
}
Module._broadwayPlayStream = _broadwayPlayStream;
function _broadwayCreateStream(a) {
  _streamInit(_broadwayStream, a);
  return HEAP32[_broadwayStream + 4 >> 2]
}
Module._broadwayCreateStream = _broadwayCreateStream;
function _broadwaySetStreamLength(a) {
  HEAP32[_broadwayStream >> 2] = a
}
Module._broadwaySetStreamLength = _broadwaySetStreamLength;
function _main() {
  return 0
}
Module._main = _main;
function _broadwayOnPictureDecoded() {
}
Module._broadwayOnPictureDecoded = _broadwayOnPictureDecoded;
function _H264SwDecFree() {
}
function _H264SwDecMemcpy(a, c, b) {
  var d;
  d = c + b;
  if(a % 4 == c % 4 && 8 < b) {
    for(;0 !== c % 4 && c < d;) {
      HEAP8[a++] = HEAP8[c++]
    }
    c >>= 2;
    a >>= 2;
    for(b = d >> 2;c < b;) {
      HEAP32[a++] = HEAP32[c++]
    }
    c <<= 2;
    a <<= 2
  }
  for(;c < d;) {
    HEAP8[a++] = HEAP8[c++]
  }
}
function _broadwayExit() {
}
Module._broadwayExit = _broadwayExit;
function _H264SwDecMemset(a, c, b) {
  var c = c & 255, d, e, b = a + b;
  e = c;
  0 > e && (e += 256);
  for(e = e + (e << 8) + (e << 16) + 16777216 * e;0 !== a % 4 && a < b;) {
    HEAP8[a++] = c
  }
  a >>= 2;
  for(d = b >> 2;a < d;) {
    HEAP32[a++] = e
  }
  for(a <<= 2;a < b;) {
    HEAP8[a++] = c
  }
}
function _H264SwDecGetAPIVersion(a) {
  var c = STACKTOP;
  STACKTOP += 8;
  HEAP32[c >> 2] = 2;
  HEAP32[c + 4 >> 2] = 3;
  var b, d;
  b = c;
  for(d = b + 8;b < d;) {
    HEAP8[a++] = HEAP8[b++]
  }
  STACKTOP = c
}
function _broadwayGetMajorVersion() {
  var a = STACKTOP;
  STACKTOP += 8;
  _H264SwDecGetAPIVersion(a);
  var c = HEAP32[a >> 2];
  STACKTOP = a;
  return c
}
Module._broadwayGetMajorVersion = _broadwayGetMajorVersion;
function _broadwayGetMinorVersion() {
  var a = STACKTOP;
  STACKTOP += 8;
  _H264SwDecGetAPIVersion(a);
  var c = HEAP32[a + 4 >> 2];
  STACKTOP = a;
  return c
}
Module._broadwayGetMinorVersion = _broadwayGetMinorVersion;
function _H264SwDecGetInfo(a, c) {
  var b, d;
  b = 0 == (a | 0) ? 2 : 1;
  a:do {
    if(1 == b) {
      if(0 == (c | 0)) {
        b = 2;
        break a
      }
      d = a + 8;
      b = 0 == (HEAP32[d + 16 >> 2] | 0) ? 5 : 4;
      b:do {
        if(4 == b) {
          if(0 == (HEAP32[d + 12 >> 2] | 0)) {
            break b
          }
          b = _h264bsdPicWidth(d);
          HEAP32[c + 4 >> 2] = b << 4;
          b = _h264bsdPicHeight(d);
          HEAP32[c + 8 >> 2] = b << 4;
          b = _h264bsdVideoRange(d);
          HEAP32[c + 12 >> 2] = b;
          b = _h264bsdMatrixCoefficients(d);
          HEAP32[c + 16 >> 2] = b;
          _h264bsdCroppingParams(d, c + 28, c + 32, c + 36, c + 40, c + 44);
          _h264bsdSampleAspectRatio(d, c + 20, c + 24);
          d = _h264bsdProfile(d);
          HEAP32[c >> 2] = d;
          d = 0;
          b = 7;
          break a
        }
      }while(0);
      d = -6;
      b = 7;
      break a
    }
  }while(0);
  2 == b && (d = -1);
  return d
}
_H264SwDecGetInfo.X = 1;
function _H264SwDecDecode(a, c, b) {
  var d = STACKTOP;
  STACKTOP += 4;
  var e, f, g, h, j;
  h = 0;
  j = 1;
  e = 0 == (c | 0) ? 2 : 1;
  a:do {
    if(1 == e) {
      if(0 == (b | 0)) {
        e = 2;
        break a
      }
      e = 0 == (HEAP32[c >> 2] | 0) ? 5 : 4;
      b:do {
        if(4 == e) {
          if(0 == (HEAP32[c + 4 >> 2] | 0)) {
            break b
          }
          f = a;
          e = 0 == (a | 0) ? 8 : 7;
          c:do {
            if(7 == e) {
              if(0 == (HEAP32[f >> 2] | 0)) {
                break c
              }
              HEAP32[b >> 2] = 0;
              HEAP32[d >> 2] = 0;
              a = HEAP32[c + 4 >> 2];
              g = HEAP32[c >> 2];
              HEAP32[f + 3392 >> 2] = HEAP32[c + 12 >> 2];
              d:for(;;) {
                e = 2 == (HEAP32[f >> 2] | 0) ? 11 : 12;
                11 == e ? (h = 2, HEAP32[f >> 2] = 1) : 12 == e && (h = _h264bsdDecode(f + 8, g, a, HEAP32[c + 8 >> 2], d));
                g += HEAP32[d >> 2];
                e = 0 <= (a - HEAP32[d >> 2] | 0) ? 14 : 15;
                14 == e ? a -= HEAP32[d >> 2] : 15 == e && (a = 0);
                HEAP32[b >> 2] = g;
                e = h;
                e = 2 == e ? 17 : 1 == e ? 22 : 4 == e ? 26 : 5 == e ? 30 : 31;
                do {
                  if(31 != e) {
                    if(17 == e) {
                      e = 0 != (HEAP32[f + 1288 >> 2] | 0) ? 18 : 20;
                      f:do {
                        if(18 == e) {
                          if((HEAP32[f + 1244 >> 2] | 0) == (HEAP32[f + 1248 >> 2] | 0)) {
                            e = 20;
                            break f
                          }
                          HEAP32[f + 1288 >> 2] = 0;
                          HEAP32[f >> 2] = 2;
                          j = 3;
                          a = 0;
                          e = 21;
                          break f
                        }
                      }while(0);
                      20 == e && (j = 4, a = 0)
                    }else {
                      if(22 == e) {
                        HEAP32[f + 4 >> 2] += 1, e = 0 == (a | 0) ? 23 : 24, 23 == e ? j = 2 : 24 == e && (j = 3), a = 0
                      }else {
                        if(26 == e) {
                          e = 0 != (_h264bsdCheckValidParamSets(f + 8) | 0) ? 29 : 27;
                          f:do {
                            if(27 == e) {
                              if(0 != (a | 0)) {
                                break f
                              }
                              j = -2
                            }
                          }while(0)
                        }else {
                          30 == e && (j = -4, a = 0)
                        }
                      }
                    }
                  }
                }while(0);
                if(0 == (a | 0)) {
                  break d
                }
              }
              f = j;
              e = 35;
              break a
            }
          }while(0);
          f = -3;
          e = 35;
          break a
        }
      }while(0);
      f = -1;
      e = 35;
      break a
    }
  }while(0);
  2 == e && (f = -1);
  STACKTOP = d;
  return f
}
_H264SwDecDecode.X = 1;
function _H264SwDecNextPicture(a, c, b) {
  var d = STACKTOP;
  STACKTOP += 12;
  var e, f, g, h = d + 4, j = d + 8;
  e = 0 == (a | 0) ? 2 : 1;
  a:do {
    if(1 == e) {
      if(0 == (c | 0)) {
        e = 2;
        break a
      }
      g = a;
      e = 0 != (b | 0) ? 4 : 5;
      4 == e && _h264bsdFlushBuffer(g + 8);
      g = _h264bsdNextOutputPicture(g + 8, j, h, d);
      e = 0 == (g | 0) ? 6 : 7;
      do {
        if(6 == e) {
          f = 0;
          e = 8;
          break a
        }else {
          if(7 == e) {
            HEAP32[c >> 2] = g;
            HEAP32[c + 4 >> 2] = HEAP32[j >> 2];
            HEAP32[c + 8 >> 2] = HEAP32[h >> 2];
            HEAP32[c + 12 >> 2] = HEAP32[d >> 2];
            f = 2;
            e = 8;
            break a
          }
        }
      }while(0)
    }
  }while(0);
  2 == e && (f = -1);
  STACKTOP = d;
  return f
}
_H264SwDecNextPicture.X = 1;
function _streamInit(a, c) {
  var b = _malloc(c);
  HEAP32[a + 8 >> 2] = b;
  HEAP32[a + 4 >> 2] = b;
  HEAP32[a >> 2] = c;
  HEAP32[a + 12 >> 2] = HEAP32[a + 4 >> 2] + c
}
function _fillStreamWithFile(a, c) {
  var b, d, e;
  d = _fopen(c, __str);
  b = 0 == (d | 0) ? 1 : 2;
  1 == b ? _printf(__str1, allocate(1, "i32", ALLOC_STACK)) : 2 == b && (_fseek(d, 0, 2), e = _ftell(d), _rewind(d), _streamInit(a, e), e = _fread(HEAP32[a + 4 >> 2], 1, HEAP32[a >> 2], d), _fclose(d), b = (e | 0) != (HEAP32[a >> 2] | 0) ? 3 : 4, 3 == b && _printf(__str2, allocate(1, "i32", ALLOC_STACK)), _printf(__str3, allocate([e, 0, 0, 0], ["i32", 0, 0, 0], ALLOC_STACK)))
}
function _playStream(a) {
  HEAP32[_decInput >> 2] = HEAP32[a + 4 >> 2];
  HEAP32[_decInput + 4 >> 2] = HEAP32[a >> 2];
  a:for(;;) {
    if(_broadwayDecode(), !(0 < HEAPU32[_decInput + 4 >> 2] >>> 0)) {
      break a
    }
  }
}
function _playFile(a) {
  var c = STACKTOP;
  STACKTOP += 16;
  _fillStreamWithFile(c, a);
  _broadwayInit();
  HEAP32[c >> 2] = 1E4;
  _playStream(c);
  STACKTOP = c
}
function _broadwayInit() {
  var a, c;
  a = 0 != (_H264SwDecInit(_decInst, 0) | 0) ? 1 : 2;
  1 == a ? (_printf(__str4, allocate(1, "i32", ALLOC_STACK)), _broadwayExit(), c = -1) : 2 == a && (HEAP32[_picDisplayNumber >> 2] = 1, HEAP32[_picDecodeNumber >> 2] = 1);
  return c
}
Module._broadwayInit = _broadwayInit;
function _broadwayDecode() {
  var a, c, b;
  HEAP32[_decInput + 8 >> 2] = HEAP32[_picDecodeNumber >> 2];
  a = b = _H264SwDecDecode(HEAP32[_decInst >> 2], _decInput, _decOutput);
  a = 4 == a ? 1 : 3 == a ? 4 : 2 == a ? 5 : 1 == a || -2 == a ? 11 : 12;
  a:do {
    if(1 == a) {
      b = _H264SwDecGetInfo(HEAP32[_decInst >> 2], _decInfo);
      a = 0 != (b | 0) ? 2 : 3;
      do {
        if(2 == a) {
          c = -1;
          a = 13;
          break a
        }else {
          if(3 == a) {
            HEAP32[_picSize >> 2] = HEAP32[_decInfo + 4 >> 2] * HEAP32[_decInfo + 8 >> 2];
            HEAP32[_picSize >> 2] = Math.floor((3 * HEAP32[_picSize >> 2] >>> 0) / 2);
            _broadwayOnHeadersDecoded();
            HEAP32[_decInput + 4 >> 2] -= HEAP32[_decOutput >> 2] - HEAP32[_decInput >> 2];
            HEAP32[_decInput >> 2] = HEAP32[_decOutput >> 2];
            a = 12;
            break a
          }
        }
      }while(0)
    }else {
      if(4 == a) {
        HEAP32[_decInput + 4 >> 2] -= HEAP32[_decOutput >> 2] - HEAP32[_decInput >> 2];
        HEAP32[_decInput >> 2] = HEAP32[_decOutput >> 2];
        a = 5;
        break a
      }else {
        if(11 == a) {
          HEAP32[_decInput + 4 >> 2] = 0;
          a = 12;
          break a
        }
      }
    }
  }while(0);
  a:do {
    if(5 == a) {
      a = 2 == (b | 0) ? 6 : 7;
      6 == a && (HEAP32[_decInput + 4 >> 2] = 0);
      HEAP32[_picDecodeNumber >> 2] += 1;
      b:for(;;) {
        if(2 != (_H264SwDecNextPicture(HEAP32[_decInst >> 2], _decPicture, 0) | 0)) {
          break b
        }
        HEAP32[_picDisplayNumber >> 2] += 1;
        _broadwayOnPictureDecoded(HEAP32[_decPicture >> 2], HEAP32[_decInfo + 4 >> 2], HEAP32[_decInfo + 8 >> 2])
      }
      a = 12;
      break a
    }
  }while(0);
  12 == a && (c = b);
  return c
}
_broadwayDecode.X = 1;
function _broadwayCreateStreamBuffer(a) {
  a = _malloc(a);
  1 == (0 == (a | 0) ? 1 : 2) && _printf(__str5, allocate(1, "i32", ALLOC_STACK));
  return a
}
function _H264SwDecTrace(a) {
  _printf(__str6, allocate([a, 0, 0, 0], ["i8*", 0, 0, 0], ALLOC_STACK))
}
function _H264SwDecMalloc(a) {
  return _malloc(a)
}
var _llvm_dbg_declare;
function _memcpy(a, c, b) {
  var d;
  d = c + b;
  if(a % 4 == c % 4 && 8 < b) {
    for(;0 !== c % 4 && c < d;) {
      HEAP8[a++] = HEAP8[c++]
    }
    c >>= 2;
    a >>= 2;
    for(b = d >> 2;c < b;) {
      HEAP32[a++] = HEAP32[c++]
    }
    c <<= 2;
    a <<= 2
  }
  for(;c < d;) {
    HEAP8[a++] = HEAP8[c++]
  }
}
var _llvm_memcpy_p0i8_p0i8_i32 = _memcpy;
function _memset(a, c, b) {
  var d, b = a + b;
  0 > c && (c += 256);
  for(c = c + (c << 8) + (c << 16) + 16777216 * c;0 !== a % 4 && a < b;) {
    HEAP8[a++] = c
  }
  a >>= 2;
  for(d = b >> 2;a < d;) {
    HEAP32[a++] = c
  }
  for(a <<= 2;a < b;) {
    HEAP8[a++] = c
  }
}
var _llvm_memset_p0i8_i32 = _memset;
function _malloc(a) {
  return Runtime.staticAlloc(a || 1)
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
var _stdin = 0, _stdout = 0, _stderr = 0, __impure_ptr = 0, FS = {currentPath:"/", nextInode:2, streams:[null], ignorePermissions:!0, absolutePath:function(a, c) {
  if("string" !== typeof a) {
    return null
  }
  if(void 0 === c) {
    c = FS.currentPath
  }
  a && "/" == a[0] && (c = "");
  for(var b = (c + "/" + a).split("/").reverse(), d = [""];b.length;) {
    var e = b.pop();
    "" == e || "." == e || (".." == e ? 1 < d.length && d.pop() : d.push(e))
  }
  return 1 == d.length ? "/" : d.join("/")
}, analyzePath:function(a, c, b) {
  var d = {isRoot:!1, exists:!1, error:0, name:null, path:null, object:null, parentExists:!1, parentPath:null, parentObject:null}, a = FS.absolutePath(a);
  if("/" == a) {
    d.isRoot = !0, d.exists = d.parentExists = !0, d.name = "/", d.path = d.parentPath = "/", d.object = d.parentObject = FS.root
  }else {
    if(null !== a) {
      for(var b = b || 0, a = a.slice(1).split("/"), e = FS.root, f = [""];a.length;) {
        if(1 == a.length && e.isFolder) {
          d.parentExists = !0, d.parentPath = 1 == f.length ? "/" : f.join("/"), d.parentObject = e, d.name = a[0]
        }
        var g = a.shift();
        if(e.isFolder) {
          if(e.read) {
            if(!e.contents.hasOwnProperty(g)) {
              d.error = ERRNO_CODES.ENOENT;
              break
            }
          }else {
            d.error = ERRNO_CODES.EACCES;
            break
          }
        }else {
          d.error = ERRNO_CODES.ENOTDIR;
          break
        }
        e = e.contents[g];
        if(e.link && !(c && 0 == a.length)) {
          if(40 < b) {
            d.error = ERRNO_CODES.ELOOP;
            break
          }
          d = FS.absolutePath(e.link, f.join("/"));
          return FS.analyzePath([d].concat(a).join("/"), c, b + 1)
        }
        f.push(g);
        if(0 == a.length) {
          d.exists = !0, d.path = f.join("/"), d.object = e
        }
      }
    }
  }
  return d
}, findObject:function(a, c) {
  FS.ensureRoot();
  var b = FS.analyzePath(a, c);
  if(b.exists) {
    return b.object
  }
  ___setErrNo(b.error);
  return null
}, createObject:function(a, c, b, d, e) {
  a || (a = "/");
  "string" === typeof a && (a = FS.findObject(a));
  if(!a) {
    throw ___setErrNo(ERRNO_CODES.EACCES), Error("Parent path must exist.");
  }
  if(!a.isFolder) {
    throw ___setErrNo(ERRNO_CODES.ENOTDIR), Error("Parent must be a folder.");
  }
  if(!a.write && !FS.ignorePermissions) {
    throw ___setErrNo(ERRNO_CODES.EACCES), Error("Parent folder must be writeable.");
  }
  if(!c || "." == c || ".." == c) {
    throw ___setErrNo(ERRNO_CODES.ENOENT), Error("Name must not be empty.");
  }
  if(a.contents.hasOwnProperty(c)) {
    throw ___setErrNo(ERRNO_CODES.EEXIST), Error("Can't overwrite object.");
  }
  a.contents[c] = {read:void 0 === d ? !0 : d, write:void 0 === e ? !1 : e, timestamp:Date.now(), inodeNumber:FS.nextInode++};
  for(var f in b) {
    b.hasOwnProperty(f) && (a.contents[c][f] = b[f])
  }
  return a.contents[c]
}, createFolder:function(a, c, b, d) {
  return FS.createObject(a, c, {isFolder:!0, isDevice:!1, contents:{}}, b, d)
}, createPath:function(a, c, b, d) {
  a = FS.findObject(a);
  if(null === a) {
    throw Error("Invalid parent.");
  }
  for(c = c.split("/").reverse();c.length;) {
    var e = c.pop();
    e && (a.contents.hasOwnProperty(e) || FS.createFolder(a, e, b, d), a = a.contents[e])
  }
  return a
}, createFile:function(a, c, b, d, e) {
  b.isFolder = !1;
  return FS.createObject(a, c, b, d, e)
}, createDataFile:function(a, c, b, d, e) {
  if("string" === typeof b) {
    for(var f = [], g = 0;g < b.length;g++) {
      f.push(b.charCodeAt(g))
    }
    b = f
  }
  return FS.createFile(a, c, {isDevice:!1, contents:b}, d, e)
}, createLazyFile:function(a, c, b, d, e) {
  return FS.createFile(a, c, {isDevice:!1, url:b}, d, e)
}, createLink:function(a, c, b, d, e) {
  return FS.createFile(a, c, {isDevice:!1, link:b}, d, e)
}, createDevice:function(a, c, b, d) {
  if(!b && !d) {
    throw Error("A device must have at least one callback defined.");
  }
  return FS.createFile(a, c, {isDevice:!0, input:b, output:d}, Boolean(b), Boolean(d))
}, forceLoadFile:function(a) {
  if(a.isDevice || a.isFolder || a.link || a.contents) {
    return!0
  }
  var c = !0;
  if("undefined" !== typeof XMLHttpRequest) {
    var b = new XMLHttpRequest;
    b.open("GET", a.url, !1);
    if("undefined" != typeof Uint8Array) {
      b.responseType = "arraybuffer"
    }
    b.overrideMimeType && b.overrideMimeType("text/plain; charset=x-user-defined");
    b.send(null);
    200 != b.status && 0 != b.status && (c = !1);
    a.contents = void 0 !== b.response ? new Uint8Array(b.response || []) : intArrayFromString(b.responseText || "", !0)
  }else {
    if("undefined" !== typeof read) {
      try {
        a.contents = intArrayFromString(read(a.url), !0)
      }catch(d) {
        c = !1
      }
    }else {
      throw Error("Cannot load without read() or XMLHttpRequest.");
    }
  }
  c || ___setErrNo(ERRNO_CODES.EIO);
  return c
}, ensureRoot:function() {
  if(!FS.root) {
    FS.root = {read:!0, write:!1, isFolder:!0, isDevice:!1, timestamp:Date.now(), inodeNumber:1, contents:{}}
  }
}, init:function(a, c, b) {
  if(!FS.init.initialized) {
    FS.init.initialized = !0;
    FS.ensureRoot();
    a || (a = function() {
      if(!a.cache || !a.cache.length) {
        var b;
        "undefined" != typeof window && "function" == typeof window.prompt ? b = window.prompt("Input: ") : "function" == typeof readline && (b = readline());
        b || (b = "");
        a.cache = intArrayFromString(b + "\n", !0)
      }
      return a.cache.shift()
    });
    c || (c = function(a) {
      null === a || 10 === a ? (c.printer(c.buffer.join("")), c.buffer = []) : c.buffer.push(String.fromCharCode(a))
    });
    if(!c.printer) {
      c.printer = print
    }
    if(!c.buffer) {
      c.buffer = []
    }
    b || (b = c);
    FS.createFolder("/", "tmp", !0, !0);
    var d = FS.createFolder("/", "dev", !0, !1), e = FS.createDevice(d, "stdin", a), f = FS.createDevice(d, "stdout", null, c), b = FS.createDevice(d, "stderr", null, b);
    FS.createDevice(d, "tty", a, c);
    FS.streams[1] = {path:"/dev/stdin", object:e, position:0, isRead:!0, isWrite:!1, isAppend:!1, error:!1, eof:!1, ungotten:[]};
    FS.streams[2] = {path:"/dev/stdout", object:f, position:0, isRead:!1, isWrite:!0, isAppend:!1, error:!1, eof:!1, ungotten:[]};
    FS.streams[3] = {path:"/dev/stderr", object:b, position:0, isRead:!1, isWrite:!0, isAppend:!1, error:!1, eof:!1, ungotten:[]};
    _stdin = allocate([1], "void*", ALLOC_STATIC);
    _stdout = allocate([2], "void*", ALLOC_STATIC);
    _stderr = allocate([3], "void*", ALLOC_STATIC);
    FS.streams[_stdin] = FS.streams[1];
    FS.streams[_stdout] = FS.streams[2];
    FS.streams[_stderr] = FS.streams[3];
    __impure_ptr = allocate([allocate([0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0], "void*", ALLOC_STATIC)], "void*", ALLOC_STATIC)
  }
}, quit:function() {
  FS.init.initialized && (0 < FS.streams[2].object.output.buffer.length && FS.streams[2].object.output(10), 0 < FS.streams[3].object.output.buffer.length && FS.streams[3].object.output(10))
}}, ___dirent_struct_layout = null;
function _open(a, c, b) {
  var d = HEAP32[b >> 2], e = c & 3, b = 0 != e, e = 1 != e, f = Boolean(c & 512), g = Boolean(c & 2048), h = Boolean(c & 1024), j = Boolean(c & 8), a = FS.analyzePath(Pointer_stringify(a));
  if(!a.parentExists) {
    return ___setErrNo(a.error), -1
  }
  if(c = a.object || null) {
    if(f && g) {
      return ___setErrNo(ERRNO_CODES.EEXIST), -1
    }
    if((b || f || h) && c.isFolder) {
      return ___setErrNo(ERRNO_CODES.EISDIR), -1
    }
    if(e && !c.read || b && !c.write) {
      return ___setErrNo(ERRNO_CODES.EACCES), -1
    }
    if(h && !c.isDevice) {
      c.contents = []
    }else {
      if(!FS.forceLoadFile(c)) {
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
    c = FS.createDataFile(a.parentObject, a.name, [], d & 256, d & 128);
    a = a.parentPath + "/" + a.name
  }
  d = FS.streams.length;
  if(c.isFolder) {
    b = 0;
    ___dirent_struct_layout && (b = _malloc(___dirent_struct_layout.__size__));
    var e = [], l;
    for(l in c.contents) {
      e.push(l)
    }
    FS.streams[d] = {path:a, object:c, position:-2, isRead:!0, isWrite:!1, isAppend:!1, error:!1, eof:!1, ungotten:[], contents:e, currentEntry:b}
  }else {
    FS.streams[d] = {path:a, object:c, position:0, isRead:e, isWrite:b, isAppend:j, error:!1, eof:!1, ungotten:[]}
  }
  return d
}
function _fopen(a, c) {
  var b, c = Pointer_stringify(c);
  if("r" == c[0]) {
    b = -1 != c.indexOf("+") ? 2 : 0
  }else {
    if("w" == c[0]) {
      b = -1 != c.indexOf("+") ? 2 : 1, b |= 1536
    }else {
      if("a" == c[0]) {
        b = -1 != c.indexOf("+") ? 2 : 1, b |= 520
      }else {
        return ___setErrNo(ERRNO_CODES.EINVAL), 0
      }
    }
  }
  b = _open(a, b, allocate([511, 0, 0, 0], "i32", ALLOC_STACK));
  return-1 == b ? 0 : b
}
function _pwrite(a, c, b, d) {
  a = FS.streams[a];
  if(!a || a.object.isDevice) {
    return ___setErrNo(ERRNO_CODES.EBADF), -1
  }
  if(a.isWrite) {
    if(a.object.isFolder) {
      return ___setErrNo(ERRNO_CODES.EISDIR), -1
    }
    if(0 > b || 0 > d) {
      return ___setErrNo(ERRNO_CODES.EINVAL), -1
    }
    for(var e = a.object.contents;e.length < d;) {
      e.push(0)
    }
    for(var f = 0;f < b;f++) {
      e[d + f] = HEAPU8[c + f]
    }
    a.object.timestamp = Date.now();
    return f
  }
  ___setErrNo(ERRNO_CODES.EACCES);
  return-1
}
function _write(a, c, b) {
  var d = FS.streams[a];
  if(d) {
    if(d.isWrite) {
      if(0 > b) {
        return ___setErrNo(ERRNO_CODES.EINVAL), -1
      }
      if(d.object.isDevice) {
        if(d.object.output) {
          for(a = 0;a < b;a++) {
            try {
              d.object.output(HEAP8[c + a])
            }catch(e) {
              return ___setErrNo(ERRNO_CODES.EIO), -1
            }
          }
          d.object.timestamp = Date.now();
          return a
        }
        ___setErrNo(ERRNO_CODES.ENXIO);
        return-1
      }
      c = _pwrite(a, c, b, d.position);
      -1 != c && (d.position += c);
      return c
    }
    ___setErrNo(ERRNO_CODES.EACCES);
    return-1
  }
  ___setErrNo(ERRNO_CODES.EBADF);
  return-1
}
function _fwrite(a, c, b, d) {
  b *= c;
  if(0 == b) {
    return 0
  }
  a = _write(d, a, b);
  if(-1 == a) {
    if(FS.streams[d]) {
      FS.streams[d].error = !0
    }
    return-1
  }
  return Math.floor(a / c)
}
function __formatString(a, c) {
  function b(a) {
    var b;
    "double" === a ? b = (tempDoubleI32[0] = HEAP32[c + e >> 2], tempDoubleI32[1] = HEAP32[c + e + 4 >> 2], tempDoubleF64[0]) : "i64" == a ? (b = [HEAP32[c + e >> 2], HEAP32[c + e + 4 >> 2]], b = unSign(b[0], 32) + unSign(b[1], 32) * Math.pow(2, 32)) : (a = "i32", b = HEAP32[c + e >> 2]);
    e += Runtime.getNativeFieldSize(a);
    return Number(b)
  }
  for(var d = a, e = 0, f = [], g, h;;) {
    var j = d;
    g = HEAP8[d];
    if(0 === g) {
      break
    }
    h = HEAP8[d + 1];
    if(37 == g) {
      var l = !1, k = !1, m = !1, o = !1;
      a:for(;;) {
        switch(h) {
          case 43:
            l = !0;
            break;
          case 45:
            k = !0;
            break;
          case 35:
            m = !0;
            break;
          case 48:
            if(o) {
              break a
            }else {
              o = !0;
              break
            }
          ;
          default:
            break a
        }
        d++;
        h = HEAP8[d + 1]
      }
      var q = 0;
      if(42 == h) {
        q = b("i32"), d++, h = HEAP8[d + 1]
      }else {
        for(;48 <= h && 57 >= h;) {
          q = 10 * q + (h - 48), d++, h = HEAP8[d + 1]
        }
      }
      var p = !1;
      if(46 == h) {
        var n = 0, p = !0;
        d++;
        h = HEAP8[d + 1];
        if(42 == h) {
          n = b("i32"), d++
        }else {
          for(;;) {
            h = HEAP8[d + 1];
            if(48 > h || 57 < h) {
              break
            }
            n = 10 * n + (h - 48);
            d++
          }
        }
        h = HEAP8[d + 1]
      }else {
        n = 6
      }
      var r;
      switch(String.fromCharCode(h)) {
        case "h":
          h = HEAP8[d + 2];
          104 == h ? (d++, r = 1) : r = 2;
          break;
        case "l":
          h = HEAP8[d + 2];
          108 == h ? (d++, r = 8) : r = 4;
          break;
        case "L":
        ;
        case "q":
        ;
        case "j":
          r = 8;
          break;
        case "z":
        ;
        case "t":
        ;
        case "I":
          r = 4;
          break;
        default:
          r = null
      }
      r && d++;
      h = HEAP8[d + 1];
      if(-1 != "d,i,u,o,x,X,p".split(",").indexOf(String.fromCharCode(h))) {
        j = 100 == h || 105 == h;
        r = r || 4;
        g = b("i" + 8 * r);
        if(4 >= r) {
          var s = Math.pow(256, r) - 1;
          g = (j ? reSign : unSign)(g & s, 8 * r)
        }
        var s = Math.abs(g), t, j = "";
        if(100 == h || 105 == h) {
          t = reSign(g, 8 * r, 1).toString(10)
        }else {
          if(117 == h) {
            t = unSign(g, 8 * r, 1).toString(10), g = Math.abs(g)
          }else {
            if(111 == h) {
              t = (m ? "0" : "") + s.toString(8)
            }else {
              if(120 == h || 88 == h) {
                j = m ? "0x" : "";
                if(0 > g) {
                  g = -g;
                  t = (s - 1).toString(16);
                  m = [];
                  for(s = 0;s < t.length;s++) {
                    m.push((15 - parseInt(t[s], 16)).toString(16))
                  }
                  for(t = m.join("");t.length < 2 * r;) {
                    t = "f" + t
                  }
                }else {
                  t = s.toString(16)
                }
                88 == h && (j = j.toUpperCase(), t = t.toUpperCase())
              }else {
                112 == h && (0 === s ? t = "(nil)" : (j = "0x", t = s.toString(16)))
              }
            }
          }
        }
        if(p) {
          for(;t.length < n;) {
            t = "0" + t
          }
        }
        for(l && (j = 0 > g ? "-" + j : "+" + j);j.length + t.length < q;) {
          k ? t += " " : o ? t = "0" + t : j = " " + j
        }
        t = j + t;
        t.split("").forEach(function(a) {
          f.push(a.charCodeAt(0))
        })
      }else {
        if(-1 != "f,F,e,E,g,G".split(",").indexOf(String.fromCharCode(h))) {
          g = b("double");
          if(isNaN(g)) {
            t = "nan", o = !1
          }else {
            if(isFinite(g)) {
              p = !1;
              r = Math.min(n, 20);
              if(103 == h || 71 == h) {
                p = !0, n = n || 1, r = parseInt(g.toExponential(r).split("e")[1], 10), n > r && -4 <= r ? (h = (103 == h ? "f" : "F").charCodeAt(0), n -= r + 1) : (h = (103 == h ? "e" : "E").charCodeAt(0), n--), r = Math.min(n, 20)
              }
              if(101 == h || 69 == h) {
                t = g.toExponential(r), /[eE][-+]\d$/.test(t) && (t = t.slice(0, -1) + "0" + t.slice(-1))
              }else {
                if(102 == h || 70 == h) {
                  t = g.toFixed(r)
                }
              }
              j = t.split("e");
              if(p && !m) {
                for(;1 < j[0].length && -1 != j[0].indexOf(".") && ("0" == j[0].slice(-1) || "." == j[0].slice(-1));) {
                  j[0] = j[0].slice(0, -1)
                }
              }else {
                for(m && -1 == t.indexOf(".") && (j[0] += ".");n > r++;) {
                  j[0] += "0"
                }
              }
              t = j[0] + (1 < j.length ? "e" + j[1] : "");
              69 == h && (t = t.toUpperCase());
              l && 0 <= g && (t = "+" + t)
            }else {
              t = (0 > g ? "-" : "") + "inf", o = !1
            }
          }
          for(;t.length < q;) {
            t = k ? t + " " : o && ("-" == t[0] || "+" == t[0]) ? t[0] + "0" + t.slice(1) : (o ? "0" : " ") + t
          }
          97 > h && (t = t.toUpperCase());
          t.split("").forEach(function(a) {
            f.push(a.charCodeAt(0))
          })
        }else {
          if(115 == h) {
            (l = b("i8*")) ? (l = String_copy(l), p && l.length > n && (l = l.slice(0, n))) : l = intArrayFromString("(null)", !0);
            if(!k) {
              for(;l.length < q--;) {
                f.push(32)
              }
            }
            f = f.concat(l);
            if(k) {
              for(;l.length < q--;) {
                f.push(32)
              }
            }
          }else {
            if(99 == h) {
              for(k && f.push(b("i8"));0 < --q;) {
                f.push(32)
              }
              k || f.push(b("i8"))
            }else {
              if(110 == h) {
                k = b("i32*"), HEAP32[k >> 2] = f.length
              }else {
                if(37 == h) {
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
function _fprintf(a, c, b) {
  b = __formatString(c, b);
  c = Runtime.stackSave();
  a = _fwrite(allocate(b, "i8", ALLOC_STACK), 1, b.length, a);
  Runtime.stackRestore(c);
  return a
}
function _printf(a, c) {
  return _fprintf(HEAP32[_stdout >> 2], a, c)
}
function _lseek(a, c, b) {
  if(FS.streams[a] && !FS.streams[a].isDevice) {
    a = FS.streams[a];
    1 === b ? c += a.position : 2 === b && (c += a.object.contents.length);
    if(0 > c) {
      return ___setErrNo(ERRNO_CODES.EINVAL), -1
    }
    a.ungotten = [];
    return a.position = c
  }
  ___setErrNo(ERRNO_CODES.EBADF);
  return-1
}
function _fseek(a, c, b) {
  if(-1 == _lseek(a, c, b)) {
    return-1
  }
  FS.streams[a].eof = !1;
  return 0
}
function _ftell(a) {
  if(a in FS.streams) {
    a = FS.streams[a];
    return a.object.isDevice ? (___setErrNo(ERRNO_CODES.ESPIPE), -1) : a.position
  }
  ___setErrNo(ERRNO_CODES.EBADF);
  return-1
}
function _rewind(a) {
  _fseek(a, 0, 0);
  if(a in FS.streams) {
    FS.streams[a].error = !1
  }
}
function _pread(a, c, b, d) {
  var e = FS.streams[a];
  if(!e || e.object.isDevice) {
    return ___setErrNo(ERRNO_CODES.EBADF), -1
  }
  if(e.isRead) {
    if(e.object.isFolder) {
      return ___setErrNo(ERRNO_CODES.EISDIR), -1
    }
    if(0 > b || 0 > d) {
      return ___setErrNo(ERRNO_CODES.EINVAL), -1
    }
    for(a = 0;e.ungotten.length && 0 < b;) {
      HEAP8[c++] = e.ungotten.pop(), b--, a++
    }
    for(var e = e.object.contents, b = Math.min(e.length - d, b), f = 0;f < b;f++) {
      HEAP8[c + f] = e[d + f], a++
    }
    return a
  }
  ___setErrNo(ERRNO_CODES.EACCES);
  return-1
}
function _read(a, c, b) {
  var d = FS.streams[a];
  if(d) {
    if(d.isRead) {
      if(0 > b) {
        return ___setErrNo(ERRNO_CODES.EINVAL), -1
      }
      if(d.object.isDevice) {
        if(d.object.input) {
          for(a = 0;d.ungotten.length && 0 < b;) {
            HEAP8[c++] = d.ungotten.pop(), b--, a++
          }
          for(var e = 0;e < b;e++) {
            try {
              var f = d.object.input()
            }catch(g) {
              return ___setErrNo(ERRNO_CODES.EIO), -1
            }
            if(null === f || void 0 === f) {
              break
            }
            a++;
            HEAP8[c + e] = f
          }
          return a
        }
        ___setErrNo(ERRNO_CODES.ENXIO);
        return-1
      }
      f = d.ungotten.length;
      a = _pread(a, c, b, d.position);
      -1 != a && (d.position += d.ungotten.length - f + a);
      return a
    }
    ___setErrNo(ERRNO_CODES.EACCES);
    return-1
  }
  ___setErrNo(ERRNO_CODES.EBADF);
  return-1
}
function _fread(a, c, b, d) {
  b *= c;
  if(0 == b) {
    return 0
  }
  a = _read(d, a, b);
  d = FS.streams[d];
  if(-1 == a) {
    if(d) {
      d.error = !0
    }
    return-1
  }
  if(a < b) {
    d.eof = !0
  }
  return Math.floor(a / c)
}
function _close(a) {
  if(FS.streams[a]) {
    return FS.streams[a].currentEntry && _free(FS.streams[a].currentEntry), delete FS.streams[a], 0
  }
  ___setErrNo(ERRNO_CODES.EBADF);
  return-1
}
function _fsync(a) {
  if(FS.streams[a]) {
    return 0
  }
  ___setErrNo(ERRNO_CODES.EBADF);
  return-1
}
function _fclose(a) {
  _fsync(a);
  return _close(a)
}
function _free() {
}
FS.init();
__ATEXIT__.push({func:function() {
  FS.quit()
}});
___setErrNo(0);
Module.callMain = function(a) {
  function c() {
    for(var a = 0;3 > a;a++) {
      d.push(0)
    }
  }
  var b = a.length + 1, d = [allocate(intArrayFromString("/bin/this.program"), "i8", ALLOC_STATIC)];
  c();
  for(var e = 0;e < b - 1;e += 1) {
    d.push(allocate(intArrayFromString(a[e]), "i8", ALLOC_STATIC)), c()
  }
  d.push(0);
  d = allocate(d, "i32", ALLOC_STATIC);
  return _main(b, d, 0)
};
var _qpDiv6, _qpMod6, _levelScale, _h264bsdQpC, _stuffingTable, _CeilLog2NumSliceGroups, _dcCoeffIndex, _codedBlockPatternIntra4x4, _codedBlockPatternInter, _runBefore_1, _runBefore_2, _runBefore_3, _runBefore_4, _runBefore_5, _runBefore_6, _totalZeros_1_0, _totalZeros_1_1, _totalZeros_2, _totalZeros_3, _totalZeros_4, _totalZeros_5, _totalZeros_6, _totalZeros_7, _totalZeros_8, _totalZeros_9, _totalZeros_10, _totalZeros_11, _totalZeros_12, _totalZeros_13, _totalZeros_14, _coeffToken0_0, _coeffToken0_1, 
_coeffToken0_2, _coeffToken0_3, _coeffToken2_0, _coeffToken2_1, _coeffToken2_2, _coeffToken4_0, _coeffToken4_1, _coeffToken8, _coeffTokenMinus1_0, _coeffTokenMinus1_1, _N_D_4x4B, _N_C_4x4B, _N_B_4x4B, _N_A_4x4B, _h264bsdBlockX, _h264bsdBlockY, _h264bsdClip, _N_D_SUB_PART, _N_C_SUB_PART, _N_B_SUB_PART, _N_A_SUB_PART, _lumaFracPos, _sample, _hashA, _hashB, _hashC, _hashD, _alphas, _betas, _tc0, _mb4x4Index, _STREAM_BUFFER_SIZE, _streamBuffer, __str, __str1, __str2, __str3, _decInput, _broadwayStream, 
_decInst, __str4, _picDisplayNumber, _picDecodeNumber, _decOutput, _decInfo, _picSize, _decPicture, __str5, __str6;
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
_mb4x4Index = allocate([0, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0], ["i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_STREAM_BUFFER_SIZE = allocate([1048576], ["i32", 0, 0, 0, 0], ALLOC_STATIC);
_streamBuffer = allocate(1, "i8*", ALLOC_STATIC);
__str = allocate([114, 98, 0], "i8", ALLOC_STATIC);
__str1 = allocate([85, 78, 65, 66, 76, 69, 32, 84, 79, 32, 79, 80, 69, 78, 32, 70, 73, 76, 69, 10, 0], "i8", ALLOC_STATIC);
__str2 = allocate([67, 65, 78, 78, 79, 84, 32, 82, 69, 65, 68, 32, 70, 73, 76, 69, 10, 0], "i8", ALLOC_STATIC);
__str3 = allocate([82, 69, 65, 68, 32, 70, 73, 76, 69, 32, 37, 100, 32, 66, 89, 84, 69, 83, 10, 0], "i8", ALLOC_STATIC);
_decInput = allocate(16, ["i8*", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
_broadwayStream = allocate(16, ["i32", 0, 0, 0, "i8*", 0, 0, 0, "i8*", 0, 0, 0, "i8*", 0, 0, 0], ALLOC_STATIC);
_decInst = allocate(1, "i8*", ALLOC_STATIC);
__str4 = allocate([68, 69, 67, 79, 68, 69, 82, 32, 73, 78, 73, 84, 73, 65, 76, 73, 90, 65, 84, 73, 79, 78, 32, 70, 65, 73, 76, 69, 68, 10, 0], "i8", ALLOC_STATIC);
_picDisplayNumber = allocate(1, "i32", ALLOC_STATIC);
_picDecodeNumber = allocate(1, "i32", ALLOC_STATIC);
_decOutput = allocate(4, "i8*", ALLOC_STATIC);
_decInfo = allocate(48, "i32", ALLOC_STATIC);
_picSize = allocate(1, "i32", ALLOC_STATIC);
_decPicture = allocate(16, ["i32*", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0, "i32", 0, 0, 0], ALLOC_STATIC);
__str5 = allocate([85, 78, 65, 66, 76, 69, 32, 84, 79, 32, 65, 76, 76, 79, 67, 65, 84, 69, 32, 77, 69, 77, 79, 82, 89, 10, 0], "i8", ALLOC_STATIC);
__str6 = allocate([37, 115, 10, 0], "i8", ALLOC_STATIC);
FUNCTION_TABLE = [0, 0, _FillRow1, 0, _h264bsdFillRow7, 0];
Module.FUNCTION_TABLE = FUNCTION_TABLE;
function run(a) {
  a = a || Module.arguments;
  __globalConstructor__();
  var c = null;
  Module._main && (c = Module.callMain(a), __shutdownRuntime__());
  return c
}
Module.run = run;
try {
  FS.ignorePermissions = !1
}catch(e$$9) {
}
Module.noInitialRun = !0;
if(!Module.noInitialRun) {
  var ret = run()
}
FS && (Module.FS = FS);
Module.HEAPU8 = HEAPU8;
Module.CorrectionsMonitor = CorrectionsMonitor;
FS.createDataFile = FS.createDataFile;
var breakLoop = !1;
_runMainLoop = function() {
  window.addEventListener("message", function() {
    _mainLoopIteration();
    breakLoop || window.postMessage(0, "*")
  }, !1)
};
Module.play = function() {
  breakLoop = !1;
  window.postMessage(0, "*")
};
Module.stop = function() {
  breakLoop = !0
};
Module.onFrameDecoded = function() {
};
_broadwayOnFrameDecoded = function() {
  Module.onFrameDecoded()
};
Module.createStreamBuffer = _broadwayCreateStreamBuffer;
var patches = Module.patches = {};
function getGlobalScope() {
  return function() {
    return this
  }.call(null)
}
assert = function(a, c) {
  if(!a) {
    throw"Assertion: " + c;
  }
};
Module.patch = function(a, c, b) {
  assert("function" == typeof b);
  a || (a = getGlobalScope());
  Module.CC_VARIABLE_MAP && (c = Module.CC_VARIABLE_MAP[c]);
  assert(c in a && "function" == typeof a[c], "Can only patch functions.");
  patches[c] = a[c];
  a[c] = b;
  return patches[c]
};
Module.unpatch = function(a, c) {
  a || (a = getGlobalScope());
  Module.CC_VARIABLE_MAP && (c = Module.CC_VARIABLE_MAP[c]);
  assert(c in a && "function" == typeof a[c]);
  c in patches && (a[c] = patches[c])
};
function getSurface() {
  var a = SDL.surfaces[SDL.screen];
  if(!a.image) {
    a.image = a.ctx.getImageData(0, 0, a.width, a.height);
    for(var c = a.image.data, b = c.length, d = 0;d < b / 4;d++) {
      c[4 * d + 3] = 255
    }
  }
  return a
}
Module.paint = function(a, c, b, d, e) {
  for(var f, g, h, j, l, k, m = d >> 1, o = 4 * d, q = getSurface(), p = q.image.data, n = 0;e -= 2;) {
    for(k = m;k--;) {
      h = HEAPU8[b++], f = HEAPU8[c++], j = 409 * h - 56992, h = 34784 - 208 * h - 100 * f, l = 516 * f - 70688, g = 298 * HEAPU8[a + d], f = 298 * HEAPU8[a++], p[n + o] = g + j >> 8, p[n++] = f + j >> 8, p[n + o] = g + h >> 8, p[n++] = f + h >> 8, p[n + o] = g + l >> 8, p[n++] = f + l >> 8, n++, g = 298 * HEAPU8[a + d], f = 298 * HEAPU8[a++], p[n + o] = g + j >> 8, p[n++] = f + j >> 8, p[n + o] = g + h >> 8, p[n++] = f + h >> 8, p[n + o] = g + l >> 8, p[n++] = f + l >> 8, n++
    }
    n += o;
    a += d
  }
  q.ctx.putImageData(q.image, 0, 0)
};
_paint = function(a, c, b, d, e) {
  Module.paint(a, c, b, d, e)
};

