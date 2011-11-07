var gl;

var cubeVerticesBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesIndexBuffer;
var cubeRotation = 0.0;
var lastCubeUpdateTime = 0;

var YTexture;
var CbTexture;
var CrTexture;

var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var textureCoordAttribute;
var perspectiveMatrix;

var canvasVPBuffer;
var canvasVTCBuffer;

function initWebGLCanvas(canvas, width, height) {
  initWebGL(canvas);
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    
    initShaders();
    initBuffers(width, height);
    initTextures(width, height);
    
    setInterval(drawScene, 15);
  }
}

function initWebGL(canvas) {
  gl = null;
  try {
    gl = canvas.getContext("experimental-webgl");
  } catch(e) {}
  
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

/**
 * Initialize Buffers
 */
function initBuffers(width, height) {
  var tmp;
  
  // Create Vertex Position Buffer
  canvasVPBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, canvasVPBuffer);
  tmp = [
     1.0,  1.0, 0.0,
    -1.0,  1.0, 0.0, 
     1.0, -1.0, 0.0, 
    -1.0, -1.0, 0.0];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
  canvasVPBuffer.itemSize = 3;
  canvasVPBuffer.numItems = 4;
  
  /*
    
   +--------------------+ 
   | -1,1 (1)           | 1,1 (0)
   |                    |
   |                    |
   |                    |
   |                    |
   |                    |
   | -1,-1 (3)          | 1,-1 (2)
   +--------------------+
   
   */
  
  var scaleX = width / nextHighestPowerOfTwo(width);
  var scaleY = height / nextHighestPowerOfTwo(height);
  
  // Create Vertex Texture Coordinate Buffer
  canvasVTCBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, canvasVTCBuffer);
  tmp = [
    scaleX, 0.0,
    0.0, 0.0,
    scaleX, scaleY,
    0.0, scaleY,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
}

function isPowerOfTwo(x) {
  return (x & (x - 1)) == 0;
}

function nextHighestPowerOfTwo(x) {
  --x;
  for (var i = 1; i < 32; i <<= 1) {
      x = x | x >> i;
  }
  return x + 1;
}

function isChrome() {
  return navigator.userAgent.toLowerCase().indexOf('chrome') >= 0;
}

function initTextures(videoWidth, videoHeight) {
  var lW = nextHighestPowerOfTwo(videoWidth);
  var lH = nextHighestPowerOfTwo(videoHeight);
  var cW = nextHighestPowerOfTwo(videoWidth >> 1);
  var cH = nextHighestPowerOfTwo(videoHeight >> 1);
  
  console.log("WebGL initTextures: video (%d x %d), luma (%d x %d), chroma (%d x %d)",
              videoWidth, videoHeight, lW, lH, cW, cH);
  
  YTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, YTexture);
  if (!isChrome()) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, lW, lH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
  gl.generateMipmap(gl.TEXTURE_2D);
  
  CbTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, CbTexture);
  if (!isChrome()) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE,  cW, cH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
  gl.generateMipmap(gl.TEXTURE_2D);
  
  CrTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, CrTexture);
  if (!isChrome()) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, cW, cH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
  gl.generateMipmap(gl.TEXTURE_2D);
  
  checkLastError("initTextures");
}

var glNames = null;

function initGLNames() {
  if (glNames) {
    return;
  }
  glNames = {};
  for (var propertyName in gl) {
    if (typeof gl[propertyName] == 'number') {
      glNames[gl[propertyName]] = propertyName;
    }
  }
}

function checkLastError(operation) {
  initGLNames();
  var err = gl.getError();
  if (err != gl.NO_ERROR) {
    var name = glNames[err];
    name = (name !== undefined) ? name + "(" + err + ")":
        ("UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
    if (operation) {
      console.log("WebGL Error: %s, %s", operation, name);
    } else {
      console.log("WebGL Error: %s", name);
    }
    console.trace();
  }
}

function paintLuma(width, height, buffer) {
  gl.bindTexture(gl.TEXTURE_2D, YTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.LUMINANCE, gl.UNSIGNED_BYTE, buffer);
  checkLastError();
}

function paintGL(luma, cb, cr, videoWidth, videoHeight) {
  var lW = videoWidth;
  var lH = videoHeight;
  var cW = lW >>> 1;
  var cH = lH >>> 1;
  
  gl.bindTexture(gl.TEXTURE_2D, YTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, lW, lH, gl.LUMINANCE, gl.UNSIGNED_BYTE, luma);
  
  gl.bindTexture(gl.TEXTURE_2D, CbTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cW, cH, gl.LUMINANCE, gl.UNSIGNED_BYTE, cb);
  
  gl.bindTexture(gl.TEXTURE_2D, CrTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cW, cH, gl.LUMINANCE, gl.UNSIGNED_BYTE, cr);
  
  checkLastError();
}

function drawScene() {
  
  gl.clearColor(0.0, 1.0, 0.0, 1.0);
  
  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Establish the perspective with which we want to view the
  // scene. Our field of view is 45 degrees, with a width/height
  // ratio of 640:480, and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  
  // perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
  perspectiveMatrix = makePerspective(45, 1, 0.1, 100.0);
  
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  
  loadIdentity();
  
  // Now move the drawing position a bit to where we want to start
  // drawing the square.
  
  mvTranslate([0.0, 0.0, -2]);
  
  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.
  
  gl.bindBuffer(gl.ARRAY_BUFFER, canvasVPBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  
  // Set the texture coordinates attribute for the vertices.
  
  gl.bindBuffer(gl.ARRAY_BUFFER, canvasVTCBuffer);
  gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);  
  
  // Specify the texture to map onto the faces.
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, YTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "YTexture"), 0);
  
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, CbTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "CbTexture"), 1);
  
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, CrTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "CrTexture"), 2);

  // Draw the square.
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}


//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");
  
  // Create the shader program
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  gl.useProgram(shaderProgram);
  
  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  
  textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(textureCoordAttribute);
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  
  // Didn't find an element with the specified ID; abort.
  
  if (!shaderScript) {
    return null;
  }
  
  // Walk through the source element's children, building the
  // shader source string.
  
  var theSource = "";
  var currentChild = shaderScript.firstChild;
  
  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }
    
    currentChild = currentChild.nextSibling;
  }
  
  // Now figure out what type of shader script we have,
  // based on its MIME type.
  
  var shader;
  
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }
  
  // Send the source to the shader object
  
  gl.shaderSource(shader, theSource);
  
  // Compile the shader program
  
  gl.compileShader(shader);
  
  // See if it compiled successfully
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }
  
  return shader;
}

//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

var mvMatrixStack = [];

function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }
  
  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;
  
  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}