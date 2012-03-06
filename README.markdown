Broadway.js
===========
A JavaScript H.264 decoder.

View a Live Demo at: http://mbebenita.github.com/Broadway/storyDemo.html or http://mbebenita.github.com/Broadway/treeDemo.html

The demo is Android's H.264 decoder compiled with Emscripten to JavaScript, then further optimized with
Google's JavaScript closure compiler and further optimized by hand to use WebGL.

Building the demo:

Install and configure Emscripten (https://github.com/kripken/emscripten)

The code for the demo is in the Decoder folder, to build it run the make.py python script.

Encoding Video
==============

The decoder expects an .mp4 file and does not support weighted prediction for P-frames and CABAC entropy encoding. To create such bitstreams use ffmpeg and x264 with the following command line options:

ffmpeg -y -i sourceFile -r 30000/1001 -b:a 2M -bt 4M -vcodec libx264 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an targetFile.mp4