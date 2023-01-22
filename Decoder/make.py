#!/usr/bin/env python3

import argparse
import json
import logging
import os
import subprocess
import tempfile
import shutil
import sys

if sys.platform == 'win32':
    import mslex
    shellquote = mslex.quote
else:
    import shlex
    shellquote = shlex.quote

logging.basicConfig(format='make> %(levelname)s: %(message)s', level=logging.INFO)
log = logging.getLogger('make')


SCRIPT_DIR = os.path.dirname(__file__)
ROOT_DIR = os.path.dirname(SCRIPT_DIR)

HELP = '''
Build broadway asm and js files with emscripten.

To run this you need to enable the emscripten environment with:
emsdk activate VERSION

For example use:
emsdk activate latest

Check here for more information:
https://emscripten.org/docs/getting_started/downloads.html
'''

AVCJS_SOURCE_FILES = [
    os.path.join('src', file) for file in [
        'Decoder.c',
        'H264SwDecApi.c',
        'extraFlags.c',
        'h264bsd_byte_stream.c',
        'h264bsd_cavlc.c',
        'h264bsd_conceal.c',
        'h264bsd_deblocking.c',
        'h264bsd_decoder.c',
        'h264bsd_dpb.c',
        'h264bsd_image.c',
        'h264bsd_inter_prediction.c',
        'h264bsd_intra_prediction.c',
        'h264bsd_macroblock_layer.c',
        'h264bsd_nal_unit.c',
        'h264bsd_neighbour.c',
        'h264bsd_pic_order_cnt.c',
        'h264bsd_pic_param_set.c',
        'h264bsd_reconstruct.c',
        'h264bsd_seq_param_set.c',
        'h264bsd_slice_data.c',
        'h264bsd_slice_group_map.c',
        'h264bsd_slice_header.c',
        'h264bsd_storage.c',
        'h264bsd_stream.c',
        'h264bsd_transform.c',
        'h264bsd_util.c',
        'h264bsd_vlc.c',
        'h264bsd_vui.c'
    ]
]


def run_process(command, dry_run=False):
    if type(command) is not str:
        command = ' '.join([shellquote(arg) for arg in command])
    log.info(f"Running command:\n$ {command}")

    if dry_run:
        return "dryrun"

    process = subprocess.run(command, shell=True)
    if process.returncode != 0:
        raise Exception(f"Failed to run '{command}' with exit code {process.returncode}")
    return process


class Formatter(
    argparse.ArgumentDefaultsHelpFormatter, argparse.RawDescriptionHelpFormatter
):
    pass


def main():
    parser = argparse.ArgumentParser(description=HELP, formatter_class=Formatter)
    parser.add_argument('--dest-dir', '-d', help='specify destinaton path, use temporary directory if not specified')
    parser.add_argument('--dry-run', '-n', action='store_true', help='simulate exection without actually running it')
    parser.add_argument('--update-repository', '-u', action='store_true', help='replace repository files with the ones generated by the build')
    parser.add_argument('emcc_extra_args', nargs="*", help="specify extra options to pass to the emcc command")

    args = parser.parse_args()

    emcc_args = [
        #'-m32',
        '-O3',
        #'-Dxxx2yyy'
        '--memory-init-file', '1',
        '--llvm-opts', '3',
        '--llvm-lto', '3',
        '-s', 'NO_EXIT_RUNTIME=1',
        '-s', 'NO_FILESYSTEM=1',
        '-s', 'NO_BROWSER=1',
        #'-s', 'CORRECT_SIGNS=1',
        #'-s', 'CORRECT_OVERFLOWS=1',
        '-s', 'TOTAL_MEMORY=' + str(50*1024*1024),
        #'-s', 'FAST_MEMORY=' + str(50*1024*1024),
        #'-s', 'ALLOW_MEMORY_GROWTH=0',
        '-s', 'INVOKE_RUN=0',
        #'-s', 'RELOOP=1',
        #'-s', 'INLINING_LIMIT=50',
        #'-s', 'OUTLINING_LIMIT=100',
        '-s', 'DOUBLE_MODE=0',
        '-s', 'PRECISE_I64_MATH=0',
        #'-s', 'SIMD=1',
        '-s', 'AGGRESSIVE_VARIABLE_ELIMINATION=1',
        '-s', 'ALIASING_FUNCTION_POINTERS=1',
        '-s', 'DISABLE_EXCEPTION_CATCHING=1',
        #'-s', 'USE_CLOSURE_COMPILER=1',
        #'-s', 'FORCE_ALIGNED_MEMORY=1', #why doesnt this work?
        '-s', '''EXPORTED_FUNCTIONS=["HEAP8", "HEAP16", "HEAP32", "_broadwayGetMajorVersion", "_broadwayGetMinorVersion", "_broadwayInit", "_broadwayExit", "_broadwayCreateStream", "_broadwayPlayStream", "_broadwayOnHeadersDecoded", "_broadwayOnPictureDecoded"]''',
        #'--closure', '1',
        '--js-library', 'library.js'
    ]

    dest_dir = args.dest_dir
    if not dest_dir:
        dest_dir = tempfile.mkdtemp() if not args.dry_run else 'dryrun'

    os.makedirs(dest_dir, exist_ok=True)

    avcjs = os.path.join(dest_dir, 'avc.js')
    avcwasm = os.path.join(dest_dir, 'avc.wasm')

    log.info(f"Building '{avcjs}' and '{avcwasm}'...")
    run_process([
        'emcc',
        *AVCJS_SOURCE_FILES,
        *emcc_args, *args.emcc_extra_args, '-Isrc', '-Iinc',
        '-o', avcjs
    ], dry_run=args.dry_run)

    decoderjs = os.path.join(dest_dir, 'Decoder.js')
    log.info(f"Building '{decoderjs}'...")

    templates_dir = os.path.join(ROOT_DIR, 'templates')
    with open(decoderjs, "w") as decoderjs_file:
        with open(os.path.join(templates_dir, 'DecoderPre.js')) as pre:
            decoderjs_file.write(pre.read());

        with open(avcjs) as avcjs_file:
            replaced = avcjs_file.read()
            replaced = replaced.replace('require(', '(null)(')
            replaced = replaced.replace('typeof require', 'typeof null')
        decoderjs_file.write(replaced)

        with open(os.path.join(templates_dir, 'DecoderPost.js')) as post:
            decoderjs_file.write(post.read());

    if args.update_repository:
        log.info(f"Updating repository with the generated output...")

        player_dir = os.path.join(ROOT_DIR, 'Player')
        js_dir = os.path.join(SCRIPT_DIR, 'js')

        for src, dest in {
            avcjs: js_dir,
            avcwasm: js_dir,
            decoderjs: player_dir
        }.items():
            log.info(f"Copying '{src}' to '{dest}'...")
            if not args.dry_run:
                shutil.copy(src, dest)


if __name__ == '__main__':
    main()
