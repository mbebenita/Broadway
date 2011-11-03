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
   | -1,1 (2)           | 1,1 (1)
   |                    |
   |                    |
   |                    |
   |                    |
   |                    |
   | -1,-1 (4)          | 1,-1 (3)
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

function initTextures(width, height) {
  width = nextHighestPowerOfTwo(width);
  height = nextHighestPowerOfTwo(height);
  
  console.log("Width: " + width + ", Height:" + height);
  
  YTexture = gl.createTexture();
  CbTexture = gl.createTexture();
  CrTexture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, YTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 
                width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
  checkLastError("initTextures");
  gl.generateMipmap(gl.TEXTURE_2D);
  
}

var glEnums = null;

function ensureGLEnums() {
  if (glEnums == null) {
    glEnums = {};
    for (var propertyName in gl) {
      if (typeof gl[propertyName] == 'number') {
        glEnums[gl[propertyName]] = propertyName;
      }
    }
  }
}

function backtrace() {
  var stackStr;
  try {
      throw new Error();
  } catch (e) {
      stackStr = e.stack;
  }
  return stackStr.split('\n').slice(1).join('\n');
}

function checkLastError(op) {
  ensureGLEnums();
  var err = gl.getError();
  if (err != gl.NO_ERROR) {
    var name = glEnums[err];
    name = (name !== undefined) ? name + "(" + err + ")":
        ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
    if (op) {
      console.info(op + ", error: " + name);
    } else {
      console.info("Error: " + name);
    }
    // console.info("Error: " + name + ": " + backtrace());
  }
}

function paintLuma(width, height, buffer) {
  gl.bindTexture(gl.TEXTURE_2D, YTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.LUMINANCE, gl.UNSIGNED_BYTE, buffer);
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
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

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