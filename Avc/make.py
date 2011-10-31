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

print Popen(['python', os.path.join(EMSCRIPTEN_ROOT, 'emscripten.py')] + EMSCRIPTEN_ARGS + ['avc.ll'] + settings,#  ).communicate()
            stdout=open(JS_DIR + '/avc.js', 'w'), stderr=STDOUT).communicate()

print 'Appending stuff'

src = open(JS_DIR + '/avc.js', 'a')
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
          Module.mainLoopInterval = setInterval(__Z17mainLoopIterationv, 1000/50);
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

      _paint = function($luma, $cb, $cr, height, width) {
          var chromaWidth = width >> 1;
          var surface = SDL.surfaces[SDL.screen];
          var data = surface.image.data;
          var width_2 = width/2;

          var dst = 0;
          for (var y = 0; y < height; y++) {
              var lineOffLuma = y * width;
              var lineOffChroma = (y >> 1) * chromaWidth;
              for (var x = 0; x < width_2; x++) {
                  var c = HEAPU8[$luma + lineOffLuma] - 16;
                  var d = HEAPU8[$cb + lineOffChroma] - 128;
                  var e = HEAPU8[$cr + lineOffChroma] - 128;

                  data[dst] = (298 * c + 409 * e + 128) >> 8;
                  data[dst + 1] = (298 * c - 100 * d - 208 * e + 128) >> 8;
                  data[dst + 2] = (298 * c + 516 * d + 128) >> 8;
                  data[dst + 3] = 0xff;

                  dst += 4;
                  lineOffLuma++;

                  c = HEAPU8[$luma + lineOffLuma] - 16;

                  data[dst] = (298 * c + 409 * e + 128) >> 8;
                  data[dst + 1] = (298 * c - 100 * d - 208 * e + 128) >> 8;
                  data[dst + 2] = (298 * c + 516 * d + 128) >> 8;
                  data[dst + 3] = 0xff;

                  dst += 4;
                  lineOffLuma++;
                  lineOffChroma++;
              }
          }
          surface.ctx.putImageData(surface.image, 0, 0);
        }

        _SDL_UnlockSurface = function () {
          
        }

   '''
  )
src.close()

if 1:
  print 'Eliminating unneeded variables'

  eliminatoed = Popen([emscripten.COFFEESCRIPT, emscripten.VARIABLE_ELIMINATOR], stdin=PIPE, stdout=PIPE).communicate(open(JS_DIR + '/avc.js', 'r').read())[0]
  f = open(JS_DIR + '/avc.elim.js', 'w')
  f.write(eliminatoed)
  f.close()

  print 'Closure compiler'

  Popen(['java', '-jar', emscripten.CLOSURE_COMPILER,
                 '--compilation_level', 'SIMPLE_OPTIMIZATIONS', # XXX TODO: use advanced opts for code size (they cause slow startup though)
                 '--js', JS_DIR + '/avc.elim.js', '--js_output_file', JS_DIR + '/avc.elim.cc.js'], stdout=PIPE, stderr=STDOUT).communicate()
else:
  print 'Closure compiler'

  Popen(['java', '-jar', emscripten.CLOSURE_COMPILER,
                 '--compilation_level', 'SIMPLE_OPTIMIZATIONS',
                 '--js', JS_DIR + '/avc.js', '--js_output_file', JS_DIR + '/avc.cc.js'], stdout=PIPE, stderr=STDOUT).communicate()

