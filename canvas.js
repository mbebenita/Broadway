
/**
 * Represents a WebGL shader object and provides a mechanism to load shaders from HTML
 * script tags.
 */
var Shader = (function shader() {
  function constructor(gl, id) {
    var shaderScript = document.getElementById(id);
    
    // Didn't find an element with the specified ID; abort.
    if (!shaderScript) {
      error("Could not find shader with ID: " + id);
      return;
    }
    
    // Walk through the source element's children, building the shader source string.
    this.source = "";
    var currentChild = shaderScript.firstChild;
    while(currentChild) {
      if (currentChild.nodeType == 3) {
        this.source += currentChild.textContent;
      }
      currentChild = currentChild.nextSibling;
    }
    
    // Now figure out what type of shader script we have, based on its MIME type.
    if (shaderScript.type == "x-shader/x-fragment") {
      this.shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
      this.shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      error("Unknown shader type");
      return;  // Unknown shader type
    }
    
    // Send the source to the shader object
    gl.shaderSource(this.shader, this.source);
    
    // Compile the shader program
    gl.compileShader(this.shader);
    
    // See if it compiled successfully
    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(this.shader));
      return;
    }
  }
  return constructor;
})();

var WebGLCanvas = (function () {  
  var supportsNonPowerOfTwoTextures = true;

  function constructor(canvas, size, fragmentShaderID, vertexShaderID) {
    this.canvas = canvas;
    this.size = this.textureSize = size;
    if (!supportsNonPowerOfTwoTextures) {
      this.textureSize = size.getNextHighestPowerOfTwo();
    }
    
    this.canvas.width = size.w;
    this.canvas.height = size.h;    
    
    initWebGL.call(this);
    // initGLNames.call(this);
    initShaders.call(this, fragmentShaderID, vertexShaderID);
    initBuffers.call(this);
    this.onInitTextures();
    initScene.call(this);
  }
  
  /**
   * Initializes the WebGL context.
   */
  function initWebGL () {
    try {
      this.gl = this.canvas.getContext("experimental-webgl");
    } catch(e) {}
    
    if (!this.gl) {
      error("Unable to initialize WebGL. Your browser may not support it.");
    }
    var gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  }
  
  /**
   * Initializes the fragment and vertex shaders.
   */
  function initShaders(fragmentShaderID, vertexShaderID) {
    var gl = this.gl;
    
    // Load shaders.
    this.vertexShader = new Shader(gl, vertexShaderID);
    this.fragmentShader = new Shader(gl, fragmentShaderID);
    
    // Create the shader program.
    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, this.vertexShader.shader);
    gl.attachShader(this.shaderProgram, this.fragmentShader.shader);
    gl.linkProgram(this.shaderProgram);
    
    // If creating the shader program failed, alert.
    assert(gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS),  "Unable to initialize the shader program.");
    
    gl.useProgram(this.shaderProgram);
    
    this.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(this.vertexPositionAttribute);
    
    this.textureCoordAttribute = gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(this.textureCoordAttribute);
  }

  /**
   * Initialize vertex and texture coordinate buffers for a plane.
   */
  function initBuffers() {
    var tmp;
    var gl = this.gl;
    
    // Create vertex position buffer.
    this.quadVPBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVPBuffer);
    tmp = [
       1.0,  1.0, 0.0,
      -1.0,  1.0, 0.0, 
       1.0, -1.0, 0.0, 
      -1.0, -1.0, 0.0];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
    this.quadVPBuffer.itemSize = 3;
    this.quadVPBuffer.numItems = 4;
    
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
    
    var scaleX = this.size.w / this.textureSize.w;
    var scaleY = this.size.h / this.textureSize.h;
    
    // Create vertex texture coordinate buffer.
    this.quadVTCBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVTCBuffer);
    tmp = [
      scaleX, 0.0,
      0.0, 0.0,
      scaleX, scaleY,
      0.0, scaleY,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
  }
  
  function mvIdentity() {
    this.mvMatrix = Matrix.I(4);
  }

  function mvMultiply(m) {
    this.mvMatrix = this.mvMatrix.x(m);
  }

  function mvTranslate(m) {
    mvMultiply.call(this, Matrix.Translation($V([m[0], m[1], m[2]])).ensure4x4());
  }
  
  function setMatrixUniforms() {
    var gl = this.gl;
    var pUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(this.perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(this.mvMatrix.flatten()));
  }

  function initGLNames() {
    if (this.glNames) {
      return;
    }
    this.glNames = {};
    for (var propertyName in this.gl) {
      if (typeof this.gl[propertyName] == 'number') {
        this.glNames[this.gl[propertyName]] = propertyName;
      }
    }
  }

  function initScene() {
    var gl = this.gl;
    
    // Establish the perspective with which we want to view the
    // scene. Our field of view is 45 degrees, with a width/height
    // ratio of 640:480, and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
    
    this.perspectiveMatrix = makePerspective(45, 1, 0.1, 100.0);
    
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    mvIdentity.call(this);
    
    // Now move the drawing position a bit to where we want to start
    // drawing the square.
    mvTranslate.call(this, [0.0, 0.0, -2.4]);

    // Draw the cube by binding the array buffer to the cube's vertices
    // array, setting attributes, and pushing it to GL.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVPBuffer);
    gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    
    // Set the texture coordinates attribute for the vertices.
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVTCBuffer);
    gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);  
    
    this.onInitSceneTextures();
    
    setMatrixUniforms.call(this);
  }
  
  constructor.prototype = {
    toString: function() {
      return "WebGLCanvas Size: " + this.size;
    },
    createTexture: function(width, height) {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return texture;
    },
    checkLastError: function (operation) {
      var err = this.gl.getError();
      if (err != this.gl.NO_ERROR) {
        var name = this.glNames[err];
        name = (name !== undefined) ? name + "(" + err + ")":
            ("Unknown WebGL ENUM (0x" + value.toString(16) + ")");
        if (operation) {
          console.log("WebGL Error: %s, %s", operation, name);
        } else {
          console.log("WebGL Error: %s", name);
        }
        console.trace();
      }
    },
    onInitTextures: function () {
      var gl = this.gl;
      this.texture = this.createTexture(this.textureSize.w, this.textureSize.h);
    },
    onInitSceneTextures: function () {
      var gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "texture"), 0);
    },
    drawTexture: function(textureData) {
      var gl = this.gl;
      assert(textureData.length == this.size.w * this.size.h);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.size.w , this.size.h, gl.LUMINANCE, gl.UNSIGNED_BYTE, textureData);
    },
    drawScene: function() {
      var gl = this.gl;
      // Clear the canvas before we start drawing on it.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  };
  return constructor;
})();

var YUVWebGLCanvas = (function () {
  function constructor(canvas, size, fragmentShaderID, vertexShaderID) {
    WebGLCanvas.call(this, canvas, size, fragmentShaderID, vertexShaderID);
  } 
  
  constructor.prototype = inherit(WebGLCanvas, {
    onInitTextures: function () {
      var gl = this.gl;
      console.log("creatingTextures: size: " + this.size + ", textureSize: " + this.textureSize);
      this.YTexture = this.createTexture(this.textureSize.w, this.textureSize.h);
      this.CbTexture = this.createTexture(this.textureSize.w >>> 1, this.textureSize.h >>> 1);
      this.CrTexture = this.createTexture(this.textureSize.w >>> 1, this.textureSize.h >>> 1);
      
    },
    onInitSceneTextures: function () {
      var gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.YTexture);
      gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "YTexture"), 0);
      
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.CbTexture);
      gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "CbTexture"), 1);
      
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.CrTexture);
      gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "CrTexture"), 2);
    },
    drawYUVTextures: function(luma, cb, cr) {
      var gl = this.gl;
      var lW = this.size.w;
      var lH = this.size.h;
      var cW = lW >>> 1;
      var cH = lH >>> 1;
      
      gl.bindTexture(gl.TEXTURE_2D, this.YTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, lW, lH, gl.LUMINANCE, gl.UNSIGNED_BYTE, luma);
      
      gl.bindTexture(gl.TEXTURE_2D, this.CbTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cW, cH, gl.LUMINANCE, gl.UNSIGNED_BYTE, cb);
      
      gl.bindTexture(gl.TEXTURE_2D, this.CrTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cW, cH, gl.LUMINANCE, gl.UNSIGNED_BYTE, cr);
    },
    toString: function() {
      return "YUVCanvas Size: " + this.size;
    }
  });
  
  return constructor;
})(); 