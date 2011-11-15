#!/usr/bin/python

import os, sys, re, json, shutil
from subprocess import Popen, PIPE, STDOUT

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
  'CORRECT_SIGNS': 2,
#  'CORRECT_SIGNS_LINES': emscripten.read_auto_optimize_data('avc.pgo')['signs_lines'],
  'CORRECT_SIGNS_LINES': "",
  'DISABLE_EXCEPTION_CATCHING': 1,
  'RUNTIME_TYPE_INFO': 0,
  'TOTAL_MEMORY': 50*1024*1024,
  'FAST_MEMORY': 12*1024*1024,
  'PROFILE': 0,
  'OPTIMIZE': 1,
  'RELOOP': 1, # XXX 1 makes compilation slower!
  'USE_TYPED_ARRAYS': 2,
  'USE_FHEAP': 0,
  'SAFE_HEAP': 0,
  'ASSERTIONS': 0,
  'QUANTUM_SIZE': 4,
  'INVOKE_RUN': 0, # we do it ourselves
  'EXPORTED_FUNCTIONS': ['_main', '__Z11runMainLoopv'],
  'IGNORED_FUNCTIONS': ['_paint'],
}
EMSCRIPTEN_ARGS = []#['--dlmalloc'] # Optimize does not appear to help

JS_DIR = "js"

if not os.path.exists(JS_DIR):
  os.makedirs(JS_DIR)


print 'Build'

env = os.environ.copy()
env['CC'] = env['CXX'] = env['RANLIB'] = env['AR'] = emscripten.EMMAKEN
env['LINUX'] = '1'
env['EMMAKEN_CFLAGS'] = '-U__APPLE__ -DJS'

Popen(['make', '-j', '4'], env=env).communicate()

if 0:
  print 'LLVM optimizations'

  shutil.move('avc.bc', 'avc.orig.bc')
  output = Popen([emscripten.LLVM_OPT, 'avc.orig.bc'] +
                 emscripten.pick_llvm_opts(3, handpicked=False) +
                 ['-o=avc.bc'], stdout=PIPE, stderr=STDOUT).communicate()[0]
  assert os.path.exists('avc.bc'), 'Failed to run llvm optimizations: ' + output

print 'LLVM binary => LL assembly'

print Popen([emscripten.LLVM_DIS] + emscripten.LLVM_DIS_OPTS + ['avc.bc', '-o=avc.ll']).communicate()

if 0:
  print '[Autodebugger]'

  shutil.move('avc.ll', 'avc.orig.ll')
  output = Popen(['python', emscripten.AUTODEBUGGER, 'avc.orig.ll', 'avc.ll'], stdout=PIPE, stderr=STDOUT).communicate()[0]
  assert 'Success.' in output, output

  shutil.move('avc.bc', 'avc.orig.bc')
  print Popen([emscripten.LLVM_AS, 'avc.ll', '-o=avc.bc']).communicate()

print 'Emscripten: LL assembly => JavaScript'

settings = ['-s %s=%s' % (k, json.dumps(v)) for k, v in EMSCRIPTEN_SETTINGS.items()]

filename = JS_DIR + '/avc.js'

print Popen(['python', os.path.join(EMSCRIPTEN_ROOT, 'emscripten.py')] + EMSCRIPTEN_ARGS + ['avc.ll'] + settings,#  ).communicate()
            stdout=open(filename, 'w'), stderr=STDOUT).communicate()

print 'Appending stuff'

src = open(filename, 'a')

if EMSCRIPTEN_SETTINGS['QUANTUM_SIZE'] == 1:
  src.write(
    '''
      _malloc = function(size) {
        while (STATICTOP % 4 != 0) STATICTOP++;
        var ret = STATICTOP;
        STATICTOP += size;
        return ret;
      }
    '''
  )

if 0: # Console debugging
  src.write(
    '''
      _paint = _SDL_Init = _SDL_LockSurface = _SDL_UnlockSurface = function() {
      };

      _SDL_SetVideoMode = function() {
        return _malloc(1024);
      };

      FS.createDataFile('/', 'admiral.264', %s, true, false);
      FS.root.write = true;
      print('zz go!');
      run(['admiral.264']);
      print('zz gone');

    ''' % str(map(ord, open('../Media/admiral.264').read()[0:1024*100]))
  )
  # ~/Dev/mozilla-central/js/src/fast/js -m avc.js
else:
  src.write(open('hooks.js').read())
  src.write(open('paint_%s.js' % EMSCRIPTEN_SETTINGS['USE_TYPED_ARRAYS'], 'r').read())
src.close()

print 'Eliminating unneeded variables'

eliminated = Popen([emscripten.COFFEESCRIPT, emscripten.VARIABLE_ELIMINATOR], stdin=PIPE, stdout=PIPE).communicate(open(filename, 'r').read())[0]
filename = JS_DIR + '/avc.elim.js'
f = open(filename, 'w')
f.write(eliminated)
f.close()

print 'Closure compiler'

Popen(['java', '-jar', emscripten.CLOSURE_COMPILER,
               '--compilation_level', 'SIMPLE_OPTIMIZATIONS', # XXX TODO: use advanced opts for code size (they cause slow startup though)
               '--js', filename, '--js_output_file', JS_DIR + '/avc.elim.cc.js'], stdout=PIPE, stderr=STDOUT).communicate()

