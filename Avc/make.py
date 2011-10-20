#!/usr/bin/python

import os, sys, re, json, shutil
from subprocess import Popen, PIPE, STDOUT

exec(open(os.path.expanduser('~/.emscripten'), 'r').read())

sys.path.append(EMSCRIPTEN_ROOT)
import tools.shared as emscripten

EMSCRIPTEN_SETTINGS = {
  'SKIP_STACK_IN_SMALL': 0,
  'INIT_STACK': 0,
  'AUTO_OPTIMIZE': 0,
  'CHECK_OVERFLOWS': 0,
  'CHECK_SIGNED_OVERFLOWS': 0,
  'CORRECT_OVERFLOWS': 0,
  'CHECK_SIGNS': 0,
  'CORRECT_SIGNS': 1, # TODO: PGO
  'DISABLE_EXCEPTION_CATCHING': 1,
  'RUNTIME_TYPE_INFO': 0,
  'TOTAL_MEMORY': 50*1024*1024,
  'FAST_MEMORY': 12*1024*1024,
  'PROFILE': 0,
  'OPTIMIZE': 1,
  'RELOOP': 0, # XXX 1 makes compilation slower!
  'USE_TYPED_ARRAYS': 2,
  'SAFE_HEAP': 0,
  'ASSERTIONS': 0,
  'QUANTUM_SIZE': 4,
  'INVOKE_RUN': 0, # we do it ourselves
  'EXPORTED_FUNCTIONS': ['_main', '__Z11runMainLoopv'],
}
EMSCRIPTEN_ARGS = []#['--dlmalloc']

print 'Build'

env = os.environ.copy()
env['CC'] = env['CXX'] = env['RANLIB'] = env['AR'] = emscripten.EMMAKEN
env['LINUX'] = '1'
Popen(['make', '-j', '4'], env=env).communicate()

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

print Popen(['python', os.path.join(EMSCRIPTEN_ROOT, 'emscripten.py')] + EMSCRIPTEN_ARGS + ['avc.ll'] + settings,#  ).communicate()
            stdout=open('avc.js', 'w'), stderr=STDOUT).communicate()

print 'Appending stuff'

src = open('avc.js', 'a')
if 0: # Console debugging
  src.write(
    '''
      FS.createDataFile('/', 'admiral.264', %s, true, false);
      FS.root.write = true;
      print('zz go!');
      run(['admiral.264']);
      print('zz gone');
    ''' % open('admiral.264.js').read().replace(' ', '')
  )
  # ~/Dev/mozilla-central/js/src/fast/js -m avc.js
else:
  src.write(
    '''
      Module['FS'] = FS;
      FS['createDataFile'] = FS.createDataFile;

      // Replace main loop handler

      __Z11runMainLoopv = function() {
          // TODO: only delay when proper to do so
          setInterval(__Z17mainLoopIterationv, 1000/50);
      }

      // SDL hook

      var frameCounter = 0, totalFrameCounter = 0;
      var frameTime = 0, totalFrameTime = 0;
      _SDL_Flip = function(surf) {
        frameCounter++;
        totalFrameCounter++;
        if (frameTime == 0) {
          totalFrameTime = frameTime = Date.now();
          return;
        }
        var now = Date.now();
        var diff = now - frameTime;
        if (diff > 500) {
          document.getElementById('fps').innerHTML = 'FPS: <b>' + (frameCounter*1000/diff).toFixed(2) +
                                                     ' (since start: ' + (totalFrameCounter*1000/(now - totalFrameTime)).toFixed(2)  + ' FPS, ' +
                                                     + ((now - totalFrameTime)/1000).toFixed(2) + ' seconds)</b>';
          frameTime = now;
          frameCounter = 0;
        }
        /*
        alert('pause'); return;
        */
      }

   '''
  )
src.close()

# Optional: closure compiler, something like
# java -Xmx1024m -jar ~/Dev/closure-compiler-read-only/build/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js avc.js --js_output_file avc.cc.js

