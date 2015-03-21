#!/usr/bin/python

import os, sys, re, json, shutil
from subprocess import Popen, PIPE, STDOUT

exec(open(os.path.expanduser('~/.emscripten'), 'r').read())

sys.path.append(EMSCRIPTEN_ROOT)
import tools.shared as emscripten

emcc_args = [
  '-m32',
  '-O2',
  '--memory-init-file', '0',
  '--llvm-opts', '2',
  '-s', 'CORRECT_SIGNS=1',
  '-s', 'CORRECT_OVERFLOWS=1',
  '-s', 'TOTAL_MEMORY=' + str(50*1024*1024),
  '-s', 'FAST_MEMORY=' + str(12*1024*1024),
  '-s', 'INVOKE_RUN=0',
  '-s', 'RELOOP=1',
  '-s', '''EXPORTED_FUNCTIONS=["HEAP8", "HEAP16", "HEAP32", "_get_h264bsdClip", "_main", "_broadwayGetMajorVersion", "_broadwayGetMinorVersion", "_broadwayInit", "_broadwayExit", "_broadwayCreateStream", "_broadwaySetStreamLength", "_broadwayPlayStream", "_broadwayOnHeadersDecoded", "_broadwayOnPictureDecoded"]''',
  '--closure', '1',
  '--js-library', 'library.js'
  # '--js-transform', 'python appender.py'
]
  
JS_DIR = "js"

if not os.path.exists(JS_DIR):
  os.makedirs(JS_DIR)
  
OBJ_DIR = "obj"
if not os.path.exists(OBJ_DIR):
  os.makedirs(OBJ_DIR)

print 'build'

source_files = [
  'h264bsd_transform.c',
  'h264bsd_util.c',
  'h264bsd_byte_stream.c',
  'h264bsd_seq_param_set.c',
  'h264bsd_pic_param_set.c',
  'h264bsd_slice_header.c',
  'h264bsd_slice_data.c',
  'h264bsd_macroblock_layer.c',
  'h264bsd_stream.c',
  'h264bsd_vlc.c',
  'h264bsd_cavlc.c',
  'h264bsd_nal_unit.c',
  'h264bsd_neighbour.c',
  'h264bsd_storage.c',
  'h264bsd_slice_group_map.c',
  'h264bsd_intra_prediction.c',
  'h264bsd_inter_prediction.c',
  'h264bsd_reconstruct.c',
  'h264bsd_dpb.c',
  'h264bsd_image.c',
  'h264bsd_deblocking.c',
  'h264bsd_conceal.c',
  'h264bsd_vui.c',
  'h264bsd_pic_order_cnt.c',
  'h264bsd_decoder.c',
  'H264SwDecApi.c',
  'Decoder.c']

for file in source_files:
  target = file.replace('.c', '.o')
  print 'emcc %s -> %s' % (file, target)
  emscripten.Building.emcc(os.path.join('src', file), emcc_args + ['-Isrc', '-Iinc'], os.path.join('obj', target))
  
object_files = [os.path.join('obj', x.replace('.c', '.o')) for x in source_files];

print 'link -> %s' % 'avc.bc'
emscripten.Building.link(object_files, 'avc.bc')

print 'emcc %s -> %s' % ('avc.bc', os.path.join(JS_DIR, 'avc.js'))
emscripten.Building.emcc('avc.bc', emcc_args, os.path.join(JS_DIR, 'avc.js'))

print 'copying %s -> %s' % (os.path.join(JS_DIR, 'avc.js'), os.path.join('..','Player','avc-codec.js'))
Popen(['cp', os.path.join(JS_DIR, 'avc.js'), os.path.join('..','Player','avc-codec.js')]).communicate()

# print 'copying %s -> %s' % (os.path.join(JS_DIR, 'avc.js.mem'), os.path.join('..','Player','avc.js.mem'))
# Popen(['cp', os.path.join(JS_DIR, 'avc.js.mem'), os.path.join('..','Player','avc.js.mem')]).communicate()
