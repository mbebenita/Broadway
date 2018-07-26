Broadway.js
===========
A JavaScript H.264 decoder.


View a Live Demo:  
http://mbebenita.github.io/Broadway/foxDemo.html  
http://mbebenita.github.io/Broadway/storyDemo.html  
http://mbebenita.github.io/Broadway/treeDemo.html  

These demo video players first need to download the entire video before it can start playing, thus appearing to be a bit slow at first, so have patience. You can start the video by clicking on each player. The top left player runs on the main thread, the remaining players run in background worker threads.

Use a example node app as template:  
https://github.com/soliton4/BroadwayStream  

#Technical info

The demo is Android's H.264 decoder compiled with Emscripten to JavaScript, then further optimized with
Google's JavaScript closure compiler and further optimized by hand to use WebGL.

## Building the demo:

Install and configure Emscripten (https://github.com/kripken/emscripten)  
The current version of Broadway was built with emscripten 1.35.12  

The code for the demo is in the Decoder folder, to build it run the make.py python script. (Requires at least python 2.7)

## Encoding Video:

Decoder.js expects H.264 NALUs. It does not support weighted prediction for P-frames and CABAC (arithmetic) entropy encoding. To meet these limitations, H.264 should be encoded with the Baseline Profile and CAVLC (Huffman-style) entropy encoding. 
  
The demo expects mp4 files containing H.264. It uses ffmpeg and x264 to convert mp4 files into streams of NALUs for Decoder.js. It uses the following command line options:

```
ffmpeg -y -i sourceFile -r 30000/1001 -b:a 2M -bt 4M -vcodec libx264 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an targetFile.mp4
```

#API

Player.js, Decoder.js and YUVWebGLCanvas.js all have a unified module definition.  
You can use them as plain js files or with common.js / AMD  

# Player.js:  

You only need construct a Player object to use Broadway. It takes care of constructing the needed objects for decoding and rendering.

The Player constructor creates a new `<canvas>` to render the video. The new canvas is not visible until it is inserted into the web page using `.appendChild(player.domNode)` or an equivalent way of manipulating the pages's DOM.

Basic usage is simple: 

1. Construct a player instance
2. Insert its canvas into the DOM
3. Invoke the `decode()` method as long as you have encoded video data to display

```
var containerDiv = window.getElementById('video_container');
var player = new Player({
  <options>
});
containerDiv.appendChild(player.domNode); 
...
p.decode(<h264 data>);
```

## options:  

* `useWorker`: (true / false) decode in a worker thread. Defaults to false, but should be set to true on modern browsers.  
* `workerFile`: 
path to Decoder.js. Only neccessary when using worker. defaults to `Decoder.js`
* `webgl` (true / "auto" / false)  Use WebGL to render video. Defaults to "auto"  
* `isScalable` (true / false)  
* `size { width: w, height: h }`: an object containing the 
initial size of the canvas. The canvas resizes after video starts streaming to match the dimensions of the video.  
* `render`: (true / false) If this is false Broadway decodes but does not render the video stream. Defaults to true.
* `targetScalable`: (true / false) If true, the video is scaled (magnified or shrunk) to a target size  on screen. If false, the video is drawn pixel-for-pixel at tbe actual size of the encoded video. Drawing preserves the aspect ratio (for example 16:9) of the encoded stream. Defaults to false.
* `backgroundColor:` Color of the background color of the newly created canvas. Defaults to '#0D0E1B'.


## properties:  

* `domNode`: the canvas object.  

refers to the canvas element.  

## methods:  

### `decode(buffer [, info])`

Call this method as many times as required to pass it your video stream.

Each buffer you pass to `decode()` must contain either
* a single complete NALU encoded in the packet transport protocol, without any length information preceding the NALU, or
* a series of complete NALUs in the byte stream format, each preceded by a start code.

Notice that `decode()` cannot process partial NALUs. 

The optional `info` parameter is an object containing a `timestamp` value, a Javascript timestamp. \For example you can pass a timestamp using `Player.decode(buffer,  {timestamp:myTimestamp});
`
Broadway does not do anything with your timestamps except pass them to event handlers.

To pace your video playback, call `decode()` at the right moment for each frame.

### `setTargetDimensions (rect)`

This method has no effect unless the player instance is constructed with `targetScalable: true`.

Invoke it with the width and height you want for the canvas on your page. This is the simplest way:
 
     player.setTargetDimensions({width: newWidth, height: newHeight});
 
A good way to use it is in response to a 'resize' event for your browser window. In this example, when a user resizes a page, the event handler is called. The event handler looks at the dimensions of `containerDiv`, a part of the DOM that changes size. It  passes the (new) wwidth and height to `setTargetDimensions()`.

```js
    var containerDiv = window.getElementById('video_container');
    ...
    var player = new Player (...);
    containerDiv.appendChild(player.domNode);
    ...
    function resizeBroadway (event) {
      player.setTargetDimensions( containerDiv.getBoundingClientRect() );
    }
    window.addEventListener('resize', resizeBroadway)
```

If the new width and height do not match the aspect ratio of the decoded video stream, Broadway sets the canvas size to fill your desired width and height, but keeping the video aspect ratio.  It will place the canvas to the left, or to the top, of your containerDiv.

### `setSourceDimensions (rect)`

Use this method if the dimensions of your video source (for example a webcam) are not an even multiple of 16x16. H.264 inherently works on 16x16 *macroblocks*, and is not capable of handling partial macroblocks.

For example, a webcam may capture video at a resolution of 292x230 pixels. In order for H.264 to handle those dimensions, it must pad them to 304x240, or 19x15 whole macroblocks.  That video stream, when decoded, contains a 12 pixel wide green bar at the right, and a 10 pxiel wide bar at the bottom, showing that the encoder has padded the source video.

If you know the actual size of the bitstream without the padding, you can invoke `setSourceDimensions()`. Then Broadway will conceal the padding when it renders the video.

For this example, use

    player.setSourceDimensions({width:191, height:330);
    
These video source dimensions are not available from the H.264 stream of NALUs and must be obtained some other way  They do appear in mp4 and webm video container formats.

## events:

### `frameSizeChange (info)`

This event is fired when the video changes size. To get this event, use code like this:

    player.onFrameSizeChange ( function (rect) {
       ...
    });
    
The rect object contains several members
* `targetWidth`: the width set by setTarget dimensions after correction for aspect ratio
* `targetHeight`: the height set by setTarget dimensions after correction for aspect ratio
* `sourceWidth`: the width set by  setSourceDimensions
* `sourceHeight`: the height set by setSourceDimensions
* `decodedWidth`: the width of the decoded video stream, a multiple of 16.
* `decodedHeight`: the height of the decoded video stream, a multiple of 16.
* `targetScalable`: true if the video is scaled before rendering
* `timestamp`: the timestamp given to `decode()` if any


### `renderFrameComplete (rect)`

This event is fired after each frame is rendered. It  is used like the 'frameSizeChange' event.

# Decoder.js:  

The Decoder may be used alone. However, if you use the Player, it manages the Decoder for you.

```
var p = new Decoder({
  <options>
});

p.onPictureDecoded; // override with a callback function

p.decode(<h264 data>);
```

## options:  

rgb true / false  
if true will convert the image to rgb. sligtly slower.  

## properties:  

onPictureDecoded  callback function(<bin>, width, height)

will be called for each frame.

## methods:  

decode (<bin> [, options])

feed the decoder with h264 stream data. 

# Troubleshooting

Are you gettng a blank canvas rather than decoded video?

* Did you insert the player's canvas into your DOM? See the example code. 
* Ensure your H.264 video is coded with the Baseline Profile and CAVLC entropy coding. By default many modern video encoders use the Main Profile and CABAC entropy coding. Broadway's decoder cannot handle video coded that way.
* Pass only complete H.264 HALUs to the `decode()` method. Do not try to pass it the NALUs boxed in mp4 or webm container data streams. And, do not try to pass it partial NALUs.

Do you see green or black bars to the right or bottom of your video?

* See `setTargetDimensions()` above.

Is Broadway very slow?

* If your browser cannot handle WebGL rendering it may slow down. Broadway uses `console.log()` for a meesage when you ask for WebGL and the browser cannot deliver it.
* Is your video datastream taking a long time to arrive at your browser? This could mean network or server trouble.
* Are the dimensions of the source video very large (for example 1920x1080)? Consider downsampling your video before encoding it. Broadway is pure Javascript, and does not perform as well as hardware-assisted decoders built into many devices.

# [Real World Uses of Broadway.js](https://github.com/mbebenita/Broadway/wiki/Real-World-Uses)

