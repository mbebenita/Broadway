Broadway.js
===========
A JavaScript H.264 decoder.


View a Live Demo:  
http://mbebenita.github.io/Broadway/foxDemo.html  
http://mbebenita.github.io/Broadway/storyDemo.html  
http://mbebenita.github.io/Broadway/treeDemo.html  

The video player first needs to download the entire video before it can start playing, thus appearing to be a bit slow at first, so have patience. You can start the video by clicking on each player. The top left player runs on the main thread, while the remaining players run in background worker threads.

Use an example node app as template:  
https://github.com/soliton4/BroadwayStream  

Technical info
==============

The demo is Android's H.264 decoder compiled with Emscripten to JavaScript, then further optimized with
Google's JavaScript closure compiler and further optimized by hand to use WebGL.

Building the demo:

Install and configure Emscripten (https://github.com/kripken/emscripten)  
The current version of Broadway was built with emscripten 1.35.12  

The code for the demo is in the Decoder folder, to build it run the make.py python script. (Requires at least python 2.7)

Encoding Video
==============

The decoder expects an .mp4 file and does not support weighted prediction for P-frames and CABAC entropy encoding. To create such bitstreams use ffmpeg and x264 with the following command line options:

```
ffmpeg -y -i sourceFile -r 30000/1001 -b:a 2M -bt 4M -vcodec libx264 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an targetFile.mp4
```

API
===

Player.js, Decoder.js and YUVWebGLCanvas.js all have a unified module definition.  
You can use them as plain js files or with common.js / AMD  

# Player.js:  

```
var p = new Player({
  <options>
});

p.canvas; // the canvas - put it where you want it

p.decode(<h264 data>);
```

## Options:  

useWorker true / false  
Decode in a worker thread  

workerFile <string>  
Path to Decoder.js. Only neccessary when using worker. Defaults to "Decoder.js"  

webgl true / "auto" / false  
Use webgl. defaults to "auto"  

size { width: <num>, height: <num> }  
Initial size of the canvas. Canvas will resize after video starts streaming.  

## Properties:  

canvas  
domNode  

refers to the canvas element.  

## methods:  

decode (<bin>)

Feed the decoder with h264 stream data.  


# Decoder.js:  

```
var p = new Decoder({
  <options>
});

p.onPictureDecoded; // override with a callback function

p.decode(<h264 data>);
```

## options:  

rgb true / false  
If true will convert the image to rgb. sligtly slower.  

## properties:  

onPictureDecoded  callback function(<bin>, width, height)

Will be called for each frame.

## methods:  

decode (<bin>)

Feed the decoder with h264 stream data.  


# [Real World Uses of Broadway.js](https://github.com/mbebenita/Broadway/wiki/Real-World-Uses)
