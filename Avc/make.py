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
  'CORRECT_SIGNS': 2,
  'CORRECT_SIGNS_LINES': emscripten.read_auto_optimize_data('avc.pgo')['signs_lines'],
  'DISABLE_EXCEPTION_CATCHING': 1,
  'RUNTIME_TYPE_INFO': 0,
  'TOTAL_MEMORY': 50*1024*1024,
  'FAST_MEMORY': 12*1024*1024,
  'PROFILE': 0,
  'OPTIMIZE': 1,
  'RELOOP': 1, # XXX 1 makes compilation slower!
  'USE_TYPED_ARRAYS': 2,
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
env['EMMAKEN_CFLAGS'] = '-U__APPLE__'

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

filename = JS_DIR + '/avc.js'

print Popen(['python', os.path.join(EMSCRIPTEN_ROOT, 'emscripten.py')] + EMSCRIPTEN_ARGS + ['avc.ll'] + settings,#  ).communicate()
            stdout=open(filename, 'w'), stderr=STDOUT).communicate()

print 'Appending stuff'

src = open(filename, 'a')
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
        if (frameTime == 0) {
          totalFrameTime = frameTime = Date.now();
          return;
        }
        var now = Date.now();

        /*
        console.log('frame:' + totalFrameCounter);
        if (totalFrameCounter == 30*30) {
          print = function(x) {
            document.getElementById('fps').innerHTML += x + '<br>\n';
          }
          CorrectionsMonitor.print();
          clearInterval(Module.mainLoopInterval);
          return;
        }
        */

        var diff = now - frameTime;
        if (diff > 500) {
          var fps = frameCounter * 1000 / diff;
          var fpsSinceStart = totalFrameCounter * 1000 / (now - totalFrameTime);
          var elapsed = (now - totalFrameTime) / 1000;
        
          frameTime = now;
          frameCounter = 0;
          
          updateStats(fps, fpsSinceStart, elapsed);
        }
        
        
        /*
        alert('pause'); return;
        */
      }

        function _paint( $luma, $cb, $cr, h, w )
        {
          for( var y1,y2,u,v,ruv,guv,buv,j,w_2=w>>1,W=w*4, surface=SDL.surfaces[SDL.screen], d=surface.image.data, r=0; h-=2; )
          {
            for( j=w_2; j--; )
            {
              u = HEAPU8[$cr++];
              v = HEAPU8[$cb++];
              ruv = 409*u-56992;
              guv = 34784-208*u-100*v;
              buv = 516*v-70688;

              y2 = HEAPU8[$luma+w]*298;
              y1 = HEAPU8[$luma++]*298;
              d[r+W] = y2+ruv>>8;
              d[r++] = y1+ruv>>8;
              d[r+W] = y2+guv>>8;
              d[r++] = y1+guv>>8;
              d[r+W] = y2+buv>>8;
              d[r++] = y1+buv>>8;
              r++;

              y2 = HEAPU8[$luma+w]*298;
              y1 = HEAPU8[$luma++]*298;
              d[r+W] = y2+ruv>>8;
              d[r++] = y1+ruv>>8;
              d[r+W] = y2+guv>>8;
              d[r++] = y1+guv>>8;
              d[r+W] = y2+buv>>8;
              d[r++] = y1+buv>>8;
              r++;
            }
            r+=W;
            $luma+=w;
          }
          surface.ctx.putImageData(surface.image, 0, 0 );
        }

        _SDL_UnlockSurface = function () {
          
        }

   '''
  )
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

