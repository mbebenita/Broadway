Broadway.js
===========
A JavaScript H.264 decoder.

                THIS IS VERY EARLY PROTOTYPE WORK

Emscripten Demo
===============

The demo is Android's H.264 decoder compiled with Emscripten to JavaScript, then further optimized with
Google's JavaScript closure compiler. No hardware acceleration whatsoever!

Running the demo:

Open Demo/broadway.html in Firefox Nightly (it will run significantly slower in previous
versions, due to JavaScript engine improvements that are not yet in a stable release, namely
Type Inference. These improvements will reach the stable release soon).

Building the demo:

Install SDL
Install and configure Emscripten (https://github.com/kripken/emscripten)
The code for the demo is in the Avc folder, to build it run the make.py python script.


Non-Emscripten H.264
====================

We are also working on a JavaScript implementation of H.264 that does not use Emscripten.

Install SDL
Install SCons
Install and patch Spidermonkey with https://bugzilla.mozilla.org/show_bug.cgi?id=691446
./go.py build && ./go.py run

Directory Structure
===================

Avc   - Sources for the Avc (H.264) decoder extracted from the libstagefright Android library, along with
        some wrapper code that makes it run. Emscripten compiles these sources to JavaScript.

Demo  - Precompiled JavaScript demo, just open broadway.html in the Nightly build of Firefox. Any version
        works, but only the Nightly has type inference which really speeds it up.

Media - Various H.264 AnnexB formatted bit streams.

Play  - Begginings of a H.264 JavaScript implementation from scratch.

Show  - A host environment that embeds SpiderMonkey and executes the scripts in the Play folder to make development easiler.
        It also exposes some JavaScript bindings to the SDL graphics library.
