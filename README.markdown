Broadway.js
===========
A JavaScript H.264 decoder.


View a Live Demo at: http://bkw.github.com/Broadway/storyDemo.html or http://bkw.github.com/Broadway/treeDemo.html

Thanks https://github.com/bkw for hosting the demos.

The video player first needs to download the entire video before it can start playing, thus appearing to be a bit slow at first, so have patience. You can start the video by clicking on each player. The top left player runs on the main thread, the remaining players run in background worker threads.

The demo is Android's H.264 decoder compiled with Emscripten to JavaScript, then further optimized with
Google's JavaScript closure compiler and further optimized by hand to use WebGL.

Building the demo:

Install and configure Emscripten (https://github.com/kripken/emscripten)  
The current version of Broadway was built with emscripten 1.29.0  

The code for the demo is in the Decoder folder, to build it run the make.py python script. (Requires at least python 2.7)

Encoding Video
==============

The decoder expects an .mp4 file and does not support weighted prediction for P-frames and CABAC entropy encoding. To create such bitstreams use ffmpeg and x264 with the following command line options:

ffmpeg -y -i sourceFile -r 30000/1001 -b:a 2M -bt 4M -vcodec libx264 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an targetFile.mp4
