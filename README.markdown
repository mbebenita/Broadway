Broadway.js
===========
A JavaScript H.264 decoder.


View a Live Demo:  
http://mbebenita.github.io/Broadway/foxDemo.html  
http://mbebenita.github.io/Broadway/storyDemo.html  
http://mbebenita.github.io/Broadway/treeDemo.html  

The video player first needs to download the entire video before it can start playing, thus appearing to be a bit slow at first, so have patience. You can start the video by clicking on each player. The top left player runs on the main thread, the remaining players run in background worker threads.

Use a example node app as template:  
https://github.com/soliton4/BroadwayStream  

Technical info
==============

The demo is Android's H.264 decoder compiled with Emscripten to JavaScript, then further optimized with
Google's JavaScript closure compiler and further optimized by hand to use WebGL.

Building the demo:

Install and configure Emscripten (https://github.com/kripken/emscripten)  
The current version of Broadway was built with emscripten 1.29.0  

The code for the demo is in the Decoder folder, to build it run the make.py python script. (Requires at least python 2.7)

Encoding Video
==============

The decoder expects an .mp4 file and does not support weighted prediction for P-frames and CABAC entropy encoding. To create such bitstreams use ffmpeg and x264 with the following command line options:

```ffmpeg -y -i sourceFile -r 30000/1001 -b:a 2M -bt 4M -vcodec libx264 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an targetFile.mp4```

API
===

Player.js, Decoder.js and YUVWebGLCanvas.js all have a unified module definition.  
You can use them as plain js files or with common.js / AMD  

##Player.js:  

```javascript
var p = new Player({
  // Decode in a worker thread, or the main thread?
  useWorker: <boolean>,
  
  // Path to Decoder.js. Only necessary when useWorker is true. This defaults to "Decoder.js".
  workerFile: <string>,
  
  // Use WebGL? This defaults to "auto".
  webgl: <true/"auto"/false>,
  
  // Initial size of the canvas. It will resize after the video starts streaming.
  size: {
    width: <number>,
    height: <number>
  }
});

/* A canvas DOM element will have been created by the Player constructor, to be used as the rendering
 * surface for the video; put it where you want it. It goes by both "canvas" and "domNode". */
document.getElementById('canvas-wrapper').appendChild(p.canvas);

p.decode(<binary h264 data>); // Feed the decoder with H.264 stream data.
```

##Decoder.js:  

```javascript
var p = new Decoder({
  // If true, the decoder will convert the image to RGB. This is slightly slower.
  rgb: <boolean>
});

// override with a callback function
p.onPictureDecoded = function(bin, width, height) {
  // This will be called for each frame
};

p.decode(<binary h264 data>); // Feed the decoder with H.264 stream data.
```

#[Real World Uses of Broadway.js](https://github.com/mbebenita/Broadway/wiki/Real-World-Uses)
