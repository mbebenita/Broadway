#!/usr/bin/python

import os, sys, re, json, shutil
from subprocess import Popen, PIPE, STDOUT
from numpy.core.defchararray import startswith

exec(open(os.path.expanduser('~/.emscripten'), 'r').read())

sys.path.append(EMSCRIPTEN_ROOT)
import tools.shared as emscripten

EMSCRIPTEN_SETTINGS = {
  'SKIP_STACK_IN_SMALL': 1,
  'INIT_STACK': 0,
  'AUTO_OPTIMIZE': 0,
  'CHECK_OVERFLOWS': 0,
  'CHECK_SIGNED_OVERFLOWS': 0,
  'CORRECT_OVERFLOWS': 0,
  'CHECK_SIGNS': 0,
  'CORRECT_SIGNS': 1,
  'DISABLE_EXCEPTION_CATCHING': 1,
  'RUNTIME_TYPE_INFO': 0,
  'TOTAL_MEMORY': 50*1024*1024,
  'FAST_MEMORY': 12*1024*1024,
  'PROFILE': 0,
  'MICRO_OPTS': 1,
  'RELOOP': 1, # XXX 1 makes compilation slower!
  'USE_TYPED_ARRAYS': 2,
  'USE_FHEAP': 0,
  'SAFE_HEAP': 0,
  'ASSERTIONS': 0,
  'INVOKE_RUN': 0, # we do it ourselves
  'EXPORTED_FUNCTIONS': [
     '_main', 
     '_broadwayGetMajorVersion',
     '_broadwayGetMinorVersion',
     '_broadwayInit',
     '_broadwayExit',
     '_broadwayCreateStream',
     '_broadwaySetStreamLength',
     '_broadwayPlayStream',
     '_broadwayOnHeadersDecoded',
     '_broadwayOnPictureDecoded'
   ]
}

use_pgo = False
profile = False

if profile:
    EMSCRIPTEN_SETTINGS['CHECK_SIGNS'] = 1
    EMSCRIPTEN_SETTINGS['CHECK_OVERFLOWS'] = 1
    EMSCRIPTEN_SETTINGS['PGO'] = 1

use_profile = use_pgo and not profile
if use_profile:
    pgo_data = emscripten.read_pgo_data('avc.pgo')
    EMSCRIPTEN_SETTINGS['CORRECT_SIGNS'] = 2
    EMSCRIPTEN_SETTINGS['CORRECT_SIGNS_LINES'] = pgo_data['signs_lines']
    EMSCRIPTEN_SETTINGS['CORRECT_OVERFLOWS'] = 2
    EMSCRIPTEN_SETTINGS['CORRECT_OVERFLOWS_LINES'] = pgo_data['overflows_lines']

# print EMSCRIPTEN_SETTINGS 

EMSCRIPTEN_ARGS = [] # ['--optimize'] #['--dlmalloc'] # Optimize does not appear to help

JS_DIR = "js"

if not os.path.exists(JS_DIR):
  os.makedirs(JS_DIR)

build_level = 0
if len(sys.argv) == 2:
    build_level = int(sys.argv[1])

if build_level <= 0:
    print 'Build'
    env = os.environ.copy()
    env['CC'] = env['CXX'] = env['RANLIB'] = env['AR'] = emscripten.EMMAKEN
    env['LINUX'] = '1'
    env['EMMAKEN_CFLAGS'] = '-U__APPLE__ -DJS'
    Popen(['make', '-j', '4'], env=env).communicate()

if build_level <= 1:
    print 'LLVM binary => LL assembly' 
    print Popen([emscripten.LLVM_DIS] + emscripten.LLVM_DIS_OPTS + ['avc.bc', '-o=avc.ll']).communicate()

if build_level <= 2:
    print 'Emscripten: %s => %s' % ('avc.ll', JS_DIR + '/avc.js')
    settings = ['-s %s=%s' % (k, json.dumps(v)) for k, v in EMSCRIPTEN_SETTINGS.items()]
    print Popen(['python', os.path.join(EMSCRIPTEN_ROOT, 'emscripten.py')] + EMSCRIPTEN_ARGS + ['avc.ll'] + settings,
            stdout=open(JS_DIR + '/avc.js', 'w'), stderr=STDOUT).communicate()

    print 'Appending stuff'
    src = open(JS_DIR + '/avc.js', 'a')
    src.write(open('hooks.js').read())
    src.write(open('paint_%s.js' % EMSCRIPTEN_SETTINGS['USE_TYPED_ARRAYS'], 'r').read())
    src.close()

if build_level <= 3:
    print 'Eliminating unneeded variables'
    eliminated = Popen([emscripten.COFFEESCRIPT, emscripten.VARIABLE_ELIMINATOR], stdin=PIPE, stdout=PIPE).communicate(open(JS_DIR + '/avc.js', 'r').read())[0]
    f = open(JS_DIR + '/avc.elim.js', 'w')
    f.write(eliminated)
    f.close()

def readCCVariableMap(file):
    """
    Creates a JavaScript object map literal from a variable mapping file produced by the Closure compiler.
    """
    map = []
    for x in open(file).read().split("\n"):
        if not x.startswith("L ") and len(x.split(":")) == 2:
            map += ["\"%s\":\"%s\"" % (x.split(":")[0], x.split(":")[1])]
    return "{" + ",".join(map) + "};"

if build_level <= 4:
    use_advanced_optimizations = False
    
    compilation_level = 'SIMPLE_OPTIMIZATIONS'
    if use_advanced_optimizations: # XXX TODO: use advanced opts for code size (they cause slow startup though)
        compilation_level = 'ADVANCED_OPTIMIZATIONS'
    
    print 'Closure Compiler: %s %s => %s' % (compilation_level, JS_DIR + '/avc.elim.js', JS_DIR + '/avc.elim.cc.js') 
    Popen(['java', '-jar', emscripten.CLOSURE_COMPILER,
           '--compilation_level', compilation_level,
           '--externs', 'jquery.extern.js',
           '--variable_map_output_file', JS_DIR + '/cc.map.txt',
           '--formatting', 'PRETTY_PRINT',
           '--js', JS_DIR + '/avc.elim.js', '--js_output_file', JS_DIR + '/avc.elim.cc.js'], stdout=PIPE, stderr=STDOUT).communicate()
               
    # Append Closure Variable Map
    if use_advanced_optimizations:
        src = open(JS_DIR + '/avc.elim.cc.js', 'a')
        src.write("Module.CC_VARIABLE_MAP = " + readCCVariableMap(JS_DIR + '/cc.map.txt'))
        src.close()


Popen(['cp', JS_DIR + '/avc.elim.cc.js', '../Player/avc-codec.js']).communicate()

