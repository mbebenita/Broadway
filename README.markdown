# Broadway.js

Broadway is a JavaScript H.264 decoder, built from the [Android's H.264
decoder](https://android.googlesource.com/platform/frameworks/av/+/master/media/libstagefright/codecs/on2/h264dec/)
compiled with [emscripten](https://emscripten.org) to JavaScript, then further optimized
with [Google's JavaScript closure
compiler](https://developers.google.com/closure/compiler) and further optimized by hand to
use WebGL.

## Demos

View some live demos:
* http://mbebenita.github.io/Broadway/foxDemo.html
* http://mbebenita.github.io/Broadway/storyDemo.html
* http://mbebenita.github.io/Broadway/treeDemo.html

The video player first needs to download the entire video before it can start playing,
thus appearing to be a bit slow at first, so have patience. You can start the video by
clicking on each player. The top left player runs on the main thread, while the remaining
players run in background worker threads.

You can also use the [BroadwayStream](https://github.com/soliton4/BroadwayStream)
[node](https://nodejs.org) app as a template.

## Build

Install and configure [emscripten](https://emscripten.org/).

The best way to install and use it these days is through the
[emsdk](https://emscripten.org/docs/getting_started/downloads.html).

The code for the demo is in the [Decoder](Decoder) folder, to build it run the
[make.py](Decoder/make.py) python script.

## Supported video format

The decoder expects an H.264 base profile bitstream and does not support weighted
prediction for P-frames and CABAC entropy encoding.

To create such bitstreams you can use [ffmpeg](https://ffmpeg.org) and
[x264](https://www.videolan.org/developers/x264.html) with the following command line
options:
```
ffmpeg -y -i sourceFile -r 30000/1001 -b:a 2M -bt 4M -vcodec libx264 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an targetFile.mp4
```

## API

Player.js, Decoder.js and YUVWebGLCanvas.js all have a unified module definition.
You can use them as plain js files or with common.js / AMD.

### Player.js

Example:
```
var player = new Player({
  <options>
});

player.canvas; // the canvas - put it where you want it

player.decode(<h264 data>);
```

#### Options

* `useWorker` `true` / `false`: decode in a worker thread

* `workerFile` `STRING`: path to `Decoder.js`, only neccessary when using worker, defaults
  to `Decoder.js`

* `webgl` `true` / `auto` / `false`: use webgl, defaults to `auto`

* `size`: { width: <num>, height: <num> }: initial size of the canvas, canvas will resize
  after video starts streaming

#### Properties

* `canvas`
* `domNode`: refers to the canvas element

#### Methods

* `decode` (<bin>): feed the decoder with h264 stream data


### Decoder.js

Example:
```
var decoder = new Decoder({
  <options>
});

decoder.onPictureDecoded = customOnPictureDecoder; // override with a callback function
decoder.decode(<h264 data>);
```

#### Options

* `rgb` `true` / `false`: if `true` will convert the image to rgb (sligtly slower)

#### Properties

* `onPictureDecoded`: callback in the form `function(<bin>, width, height)`, will be called
for each decoded frame

#### Methods

* `decode`(<bin>): feed the decoder with h264 stream data


## References

* [Real World Uses of
  Broadway.js](https://github.com/mbebenita/Broadway/wiki/Real-World-Uses)
