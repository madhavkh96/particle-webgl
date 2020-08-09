function makeGroundGrid() {
  var g_floatsPerVertex = 7;
  var xcount = 1000;      // # of lines to draw in x,y to make the grid.
  var ycount = 1000;    
  var xymax = 500.0;      // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([0.0, 0.3, 1.0]);  // bright yellow
  var yColr = new Float32Array([1.0, 0.5, 0.0]);  // bright green.
  
  // Create an (global) array to hold this ground-plane's vertices:
  gndVerts = new Float32Array(g_floatsPerVertex*2*(xcount+ycount));
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= g_floatsPerVertex) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    gndVerts[j+4] = 0.0;     // red
    gndVerts[j+5] = 0.5;     // grn
    gndVerts[j+6] = 1.0;     // blu
  }
  
  for(v=0; v<2*ycount; v++, j+= g_floatsPerVertex) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w.
    }
    gndVerts[j+4] = 0.0;     // red
    gndVerts[j+5] = 0.0;    // grn
    gndVerts[j+6] = 1.0;     // blu
  }
}

function makeCube() {
    cubeVerts = new Float32Array(
        [   
            //    X     Y     Z    W
            V1.elements[0], V1.elements[1], V1.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V2.elements[0], V2.elements[1], V2.elements[2], 1.0, 1.0, 1.0, 1.0,         

            V2.elements[0], V2.elements[1], V2.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V3.elements[0], V3.elements[1], V3.elements[2], 1.0, 1.0, 1.0, 1.0,         

            V3.elements[0], V3.elements[1], V3.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V4.elements[0], V4.elements[1], V4.elements[2], 1.0, 1.0, 1.0, 1.0,         

            V4.elements[0], V4.elements[1], V4.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V1.elements[0], V1.elements[1], V1.elements[2], 1.0, 1.0, 1.0, 1.0,


            V4.elements[0], V4.elements[1], V4.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V5.elements[0], V5.elements[1], V5.elements[2], 1.0, 1.0, 1.0, 1.0,         

            V5.elements[0], V5.elements[1], V5.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V6.elements[0], V6.elements[1], V6.elements[2], 1.0, 1.0, 1.0, 1.0,         

            V6.elements[0], V6.elements[1], V6.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V7.elements[0], V7.elements[1], V7.elements[2], 1.0, 1.0, 1.0, 1.0,         

            V7.elements[0], V7.elements[1], V7.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V8.elements[0], V8.elements[1], V8.elements[2], 1.0, 1.0, 1.0, 1.0,         

            V8.elements[0], V8.elements[1], V8.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V5.elements[0], V5.elements[1], V5.elements[2], 1.0, 1.0, 1.0, 1.0,         

            V8.elements[0], V8.elements[1], V8.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V3.elements[0], V3.elements[1], V3.elements[2], 1.0, 1.0, 1.0, 1.0,         

            V7.elements[0], V7.elements[1], V7.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V2.elements[0], V2.elements[1], V2.elements[2], 1.0, 1.0, 1.0, 1.0,         

            V6.elements[0], V6.elements[1], V6.elements[2], 1.0, 1.0, 1.0, 1.0,         
            V1.elements[0], V1.elements[1], V1.elements[2], 1.0, 1.0, 1.0, 1.0
        ]);
}

//=============================================================================
//=============================================================================
function groundVBO() {
//=============================================================================
//=============================================================================
  
  this.VERT_SRC = //--------------------- VERTEX SHADER source code 
  'precision highp float;                 \n' +        // req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMat0;              \n' +
  'attribute vec4 a_Pos0;                 \n' +
  'attribute vec3 a_Colr0;                \n' +
  'varying vec3 v_Colr0;                  \n' +
  //
  'void main() {                          \n' +
  '  gl_Position = u_ModelMat0 * a_Pos0;  \n' +
  '  v_Colr0 = a_Colr0;                   \n' +
  ' }                                     \n';

  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;               \n' +
  'varying vec3 v_Colr0;                  \n' +
  'void main() {                          \n' +
  '  gl_FragColor = vec4(v_Colr0, 1.0);   \n' + 
  '}                                      \n';

  makeGroundGrid();

  this.vboContents = gndVerts; //---------------------------------------------------------

  this.vboVerts = gndVerts.length / 7;

  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
  console.log("F_Size :: ", this.FSIZE);
                                // bytes req'd by 1 vboContents array element;
                                // (why? used to compute stride and offset 
                                // in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // total number of bytes stored in vboContents
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
  this.vboStride = this.vboBytes / this.vboVerts; 
                                // (== # of bytes to store one complete vertex).
                                // From any attrib in a given vertex in the VBO, 
                                // move forward by 'vboStride' bytes to arrive 
                                // at the same attrib for the next vertex. 

              //----------------------Attribute sizes
  this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                // attribute named a_Pos0. (4: x,y,z,w values)
  this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values)
  console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                  this.vboFcount_a_Colr0) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride, // for agreeement with'stride'
                  "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

              //----------------------Attribute offsets  
  this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                // of 1st a_Pos0 attrib value in vboContents[]
  this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                // (4 floats * bytes/float) 
                                // # of bytes from START of vbo to the START
                                // of 1st a_Colr0 attrib value in vboContents[]
              //-----------------------GPU memory locations:
  this.vboLoc;                  // GPU Location for Vertex Buffer Object, 
                                // returned by gl.createBuffer() function call
  this.shaderLoc;               // GPU Location for compiled Shader-program  
                                // set by compile/link of VERT_SRC and FRAG_SRC.
                          //------Attribute locations in our shaders:
  this.a_PosLoc;                // GPU location for 'a_Pos0' attribute
  this.a_ColrLoc;               // GPU location for 'a_Colr0' attribute

              //---------------------- Uniform locations &values in our shaders
  this.ModelMat = new Matrix4();  // Transforms CVV axes to model axes.
  this.u_ModelMatLoc;             // GPU location for u_ModelMat uniform
}

groundVBO.prototype.init = function() {
  this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.shaderLoc) {
    console.log(this.constructor.name + 
                '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }

  gl.program = this.shaderLoc;    // (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
  this.vboLoc = gl.createBuffer();  
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
                '.init() failed to create VBO in GPU. Bye!'); 
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER,        // GLenum 'target' for this GPU buffer 
                  this.vboLoc);         // the ID# the GPU uses for this buffer.

  gl.bufferData(gl.ARRAY_BUFFER,        // GLenum target(same as 'bindBuffer()')
                  this.vboContents,     // JavaScript Float32Array
                  gl.STATIC_DRAW);      // Usage hint.

  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
                '.init() Failed to get GPU location of attribute a_Pos0');
    return -1;  // error exit.
  }

  this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
                '.init() failed to get the GPU location of attribute a_Colr0');
    return -1;  // error exit.
  }

  this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
                '.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }  
}

groundVBO.prototype.switchToMe = function() {

  gl.useProgram(this.shaderLoc);  

  gl.bindBuffer(gl.ARRAY_BUFFER,          // GLenum 'target' for this GPU buffer 
                    this.vboLoc);         // the ID# the GPU uses for our VBO.

  gl.vertexAttribPointer(
    this.a_PosLoc,
    this.vboFcount_a_Pos0,
    gl.FLOAT,     
    false,        

    this.vboStride,
 
    this.vboOffset_a_Pos0);           

  gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                        gl.FLOAT, false, 
                        this.vboStride, this.vboOffset_a_Colr0);
                
// --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PosLoc);
  gl.enableVertexAttribArray(this.a_ColrLoc);
}

groundVBO.prototype.isReady = function() {

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name + 
                '.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name + 
              '.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

groundVBO.prototype.adjust = function() {

  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
              '.adjust() call you needed to call this.switchToMe()!!');
  }  

  this.ModelMat.setPerspective( 30.0,
                  1.0,
                  .25,
                  1000.0);

  this.ModelMat.lookAt(  x_Coordinate,  y_Coordinate,  z_Coordinate,
                                x_lookAt,       y_lookAt,  z_lookAt,
                                             0,  0,      1);

  this.ModelMat.translate(0.35, 0, 0);              

  pushMatrix(this.ModelMat);

  this.ModelMat = popMatrix();

  gl.uniformMatrix4fv(this.u_ModelMatLoc, 
                      false,        
                      this.ModelMat.elements);  
}

groundVBO.prototype.render = function() {

  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
              '.draw() call you needed to call this.switchToMe()!!');
  }  

  gl.drawArrays(gl.LINES,       
                  0,                
                  this.vboVerts);   
}

groundVBO.prototype.reload = function() {
//=============================================================================

 gl.bufferSubData(gl.ARRAY_BUFFER,  // GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
                  this.vboContents);   // the JS source-data array used to fill VBO

}

//==============================================================================
//==============================================================================

function drawCube() {
    //=============================================================================
    //=============================================================================

    this.VERT_SRC = //--------------------- VERTEX SHADER source code 
        'precision highp float;                 \n' +        // req'd in OpenGL ES if we use 'float'
        //
        'uniform mat4 u_ModelMat0;              \n' +
        'attribute vec4 a_Pos0;                 \n' +
        'attribute vec3 a_Colr0;                \n' +
        'varying vec3 v_Colr0;                  \n' +
        //
        'void main() {                          \n' +
        '  gl_Position = u_ModelMat0 * a_Pos0;  \n' +
        '  v_Colr0 = a_Colr0;                   \n' +
        ' }                                     \n';

    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;               \n' +
        'varying vec3 v_Colr0;                  \n' +
        'void main() {                          \n' +
        '  gl_FragColor = vec4(v_Colr0, 1.0);   \n' +
        '}                                      \n';

    makeCube();

    this.vboContents = cubeVerts; //---------------------------------------------------------

    this.vboVerts = cubeVerts.length / 7;

    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    console.log("F_Size :: ", this.FSIZE);
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset 
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // total number of bytes stored in vboContents
    // (#  of floats in vboContents array) * 
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // (== # of bytes to store one complete vertex).
    // From any attrib in a given vertex in the VBO, 
    // move forward by 'vboStride' bytes to arrive 
    // at the same attrib for the next vertex. 

    //----------------------Attribute sizes
    this.vboFcount_a_Pos0 = 4;    // # of floats in the VBO needed to store the
    // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values)
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
        this.vboFcount_a_Colr0) *   // every attribute in our VBO
        this.FSIZE == this.vboStride, // for agreeement with'stride'
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

    //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
    // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    // (4 floats * bytes/float) 
    // # of bytes from START of vbo to the START
    // of 1st a_Colr0 attrib value in vboContents[]
    //-----------------------GPU memory locations:
    this.vboLoc;                  // GPU Location for Vertex Buffer Object, 
    // returned by gl.createBuffer() function call
    this.shaderLoc;               // GPU Location for compiled Shader-program  
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PosLoc;                // GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;               // GPU location for 'a_Colr0' attribute

    //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();  // Transforms CVV axes to model axes.
    this.u_ModelMatLoc;             // GPU location for u_ModelMat uniform
}

drawCube.prototype.init = function () {
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }

    gl.program = this.shaderLoc;    // (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,        // GLenum 'target' for this GPU buffer 
        this.vboLoc);         // the ID# the GPU uses for this buffer.

    gl.bufferData(gl.ARRAY_BUFFER,        // GLenum target(same as 'bindBuffer()')
        this.vboContents,     // JavaScript Float32Array
        gl.STATIC_DRAW);      // Usage hint.

    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if (this.a_PosLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;  // error exit.
    }

    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if (this.a_ColrLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;  // error exit.
    }

    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
    }
}

drawCube.prototype.switchToMe = function () {

    gl.useProgram(this.shaderLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER,          // GLenum 'target' for this GPU buffer 
        this.vboLoc);         // the ID# the GPU uses for our VBO.

    gl.vertexAttribPointer(
        this.a_PosLoc,
        this.vboFcount_a_Pos0,
        gl.FLOAT,
        false,

        this.vboStride,

        this.vboOffset_a_Pos0);

    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Colr0);

    // --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
}

drawCube.prototype.isReady = function () {

    var isOK = true;

    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

drawCube.prototype.adjust = function () {

    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }

    this.ModelMat.setPerspective(30.0,
        1.0,
        .25,
        1000.0);

    this.ModelMat.lookAt(x_Coordinate, y_Coordinate, z_Coordinate,
        x_lookAt, y_lookAt, z_lookAt,
        0, 0, 1);

    this.ModelMat.translate(0, 0, 1.0);

    pushMatrix(this.ModelMat);

    this.ModelMat = popMatrix();

    gl.uniformMatrix4fv(this.u_ModelMatLoc,
        false,
        this.ModelMat.elements);
}

drawCube.prototype.render = function () {

    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    gl.drawArrays(gl.LINES,
        0,
        this.vboVerts);
}

drawCube.prototype.reload = function () {
    //=============================================================================

    gl.bufferSubData(gl.ARRAY_BUFFER,  // GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO

}


//=============================================================================
//=============================================================================
function particle2D() {
//=============================================================================
//=============================================================================
  
this.VSHADER_SOURCE_PARTICLE =
  ' precision mediump float;                 \n' + // req'd in OpenGL ES if we use 'float'
  ' uniform   int u_runMode;                 \n' + // particle system state: 
  ' attribute vec4 a_Position;               \n' +
  ' varying   vec4 v_Color;                  \n' +
  ' void main() {                            \n' +
  '   gl_PointSize = 20.0;                   \n' +// TRY MAKING THIS LARGER...
  '   gl_Position = a_Position; \n' +  
  '   if(u_runMode == 0) {                   \n' +
  '     v_Color = vec4(1.0, 0.0, 0.0, 1.0);  \n' +   // red: 0==reset
  '     }                                    \n' +
  '   else if(u_runMode == 1) {              \n' +
  '     v_Color = vec4(1.0, 1.0, 0.0, 1.0);  \n' +  // yellow: 1==pause
  '     }                                    \n' +
  '   else if(u_runMode == 2) {              \n' +    
  '     v_Color = vec4(1.0, 1.0, 1.0, 1.0);  \n' +  // white: 2==step
  '     }                                    \n' +
  '   else {                                 \n' +
  '     v_Color = vec4(0.2, 1.0, 0.2, 1.0);  \n' +  // green: >=3 ==run
  '     }                                    \n' +
  ' }                                        \n' ;

this.FSHADER_SOURCE_PARTICLE =
  'precision mediump float;                                 \n' +
  'varying vec4 v_Color;                                    \n' +
  'void main() {                                            \n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));  \n' +
  '  if(dist < 0.5) {                                       \n' + 
  '   gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0); \n' +
  '  } else { discard; }                                    \n' +
  '}                                                        \n' ;                           

this.g_partA = new PartSys();
};

particle2D.prototype.init = function(count) { 

  this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE_PARTICLE, this.FSHADER_SOURCE_PARTICLE);
  if (!this.shaderLoc) {
    console.log(this.constructor.name + 
                '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
  this.g_partA.initBouncy2D(count, this.shaderLoc);
}

particle2D.prototype.draw = function() {
  this.g_partA.applyForces(this.g_partA.s1, this.g_partA.forceList);
  this.g_partA.dotFinder(this.g_partA.s1dot, this.g_partA.s1);
  this.g_partA.solver();
  this.g_partA.doConstraints();
  this.g_partA.render();
  this.g_partA.swap();
}

particle2D.prototype.render = function() {
  this.g_partA.render();
}

//=============================================================================
//=============================================================================
function particle3D() {
//=============================================================================
//=============================================================================
  
this.VSHADER_SOURCE_PARTICLE =
  ' precision mediump float;                 \n' + // req'd in OpenGL ES if we use 'float'
  ' uniform    int u_runMode;                \n' + // particle system state: 
  ' attribute float a_Size;                  \n' +
  ' attribute vec4 a_Position;               \n' +
  ' attribute vec3 a_Color;                  \n' +
  ' uniform   mat4 u_ModelMat;               \n' +
  ' varying   vec4 v_Color;                  \n' +
  ' void main() {                            \n' +
  '   gl_PointSize = a_Size;                 \n' +// TRY MAKING THIS LARGER...
  '   gl_Position = u_ModelMat * a_Position; \n' +  
  '   if(u_runMode == 0) {                   \n' +
  '     v_Color = vec4(1.0, 0.0, 0.0, 1.0);  \n' +   // red: 0==reset
  '     }                                    \n' +
  '   else if(u_runMode == 1) {              \n' +
  '     v_Color = vec4(1.0, 1.0, 0.0, 1.0);  \n' +  // yellow: 1==pause
  '     }                                    \n' +
  '   else if(u_runMode == 2) {              \n' +    
  '     v_Color = vec4(1.0, 1.0, 1.0, 1.0);  \n' +  // white: 2==step
  '     }                                    \n' +
  '   else {                                 \n' +
  '     v_Color = vec4(a_Color, 1.0);        \n' +  // green: >=3 ==run
  '     }                                    \n' +
  ' }                                        \n' ;

this.FSHADER_SOURCE_PARTICLE =
  'precision mediump float;                                 \n' +
  'varying vec4 v_Color;                                    \n' +
  'void main() {                                            \n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));  \n' +
  '  if(dist < 0.5) {                                       \n' + 
  '   gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0); \n' +
  '  } else { discard; }                                    \n' +
  '}                                                        \n' ;                           

this.g_partA = new PartSys();
};

particle3D.prototype.init = function(count) { 

  this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE_PARTICLE, this.FSHADER_SOURCE_PARTICLE);
  if (!this.shaderLoc) {
    console.log(this.constructor.name + 
                '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
  this.g_partA.initBouncy3D(count, this.shaderLoc);
}

particle3D.prototype.draw = function() {
  // check: was WebGL context set to use our VBO & shader program?

    this.g_partA.switchToMe()
    this.g_partA.isReady();
    this.g_partA.applyForces(this.g_partA.s1, this.g_partA.forceList);
    this.g_partA.dotFinder(this.g_partA.s1dot, this.g_partA.s1);
    this.g_partA.solver();
    this.g_partA.doConstraints(this.g_partA.s1, this.g_partA.s2, this.g_partA.limitList);
    this.g_partA.particleBehaviour();
    this.g_partA.render3D();
    this.g_partA.swap();
}

particle3D.prototype.render = function() {

  this.g_partA.switchToMe();
  this.g_partA.isReady();
  this.g_partA.render3D();
}

particle3D.prototype.debug = function () {
    this.g_partA.printPosition(this.g_partA.s1);
}

particle3D.prototype.update = function () {
    this.init(bouncyBallParticlesCount);
}

//==============================================================================
//==============================================================================

function particleFire() {
    //=============================================================================
    //=============================================================================

    this.VSHADER_SOURCE_PARTICLE =
        ' precision mediump float;                 \n' + // req'd in OpenGL ES if we use 'float'
        ' uniform    int u_runMode;                \n' + // particle system state: 
        ' attribute float a_Size;                  \n' +
        ' attribute vec4 a_Position;               \n' +
        ' attribute vec3 a_Color;                  \n' +
        ' uniform   mat4 u_ModelMat;               \n' +
        ' varying   vec4 v_Color;                  \n' +
        ' void main() {                            \n' +
        '   gl_PointSize = a_Size;                 \n' +// TRY MAKING THIS LARGER...
        '   gl_Position = u_ModelMat * a_Position; \n' +
        '   if(u_runMode == 0) {                   \n' +
        '     v_Color = vec4(1.0, 0.0, 0.0, 1.0);  \n' +   // red: 0==reset
        '     }                                    \n' +
        '   else if(u_runMode == 1) {              \n' +
        '     v_Color = vec4(1.0, 1.0, 0.0, 1.0);  \n' +  // yellow: 1==pause
        '     }                                    \n' +
        '   else if(u_runMode == 2) {              \n' +
        '     v_Color = vec4(1.0, 1.0, 1.0, 1.0);  \n' +  // white: 2==step
        '     }                                    \n' +
        '   else {                                 \n' +
        '     v_Color = vec4(a_Color, 1.0);        \n' +  // green: >=3 ==run
        '     }                                    \n' +
        ' }                                        \n';

    this.FSHADER_SOURCE_PARTICLE =
        'precision mediump float;                                 \n' +
        'varying vec4 v_Color;                                    \n' +
        'void main() {                                            \n' +
        '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));  \n' +
        '  if(dist < 0.5) {                                       \n' +
        '   gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0); \n' +
        '  } else { discard; }                                    \n' +
        '}                                                        \n';

    this.g_partA = new PartSys();
};

particleFire.prototype.init = function (count) {

    this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE_PARTICLE, this.FSHADER_SOURCE_PARTICLE);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    this.g_partA.initFireReeves(count, this.shaderLoc);
}

particleFire.prototype.draw = function () {
    // check: was WebGL context set to use our VBO & shader program?

    this.g_partA.switchToMe()
    this.g_partA.isReady();
    this.g_partA.applyForces(this.g_partA.s1, this.g_partA.forceList);
    this.g_partA.dotFinder(this.g_partA.s1dot, this.g_partA.s1);
    this.g_partA.solver();
    this.g_partA.doConstraints(this.g_partA.s1, this.g_partA.s2, this.g_partA.limitList);
    this.g_partA.particleBehaviour();
    this.g_partA.render3D();
    this.g_partA.swap();
}

particleFire.prototype.render = function () {

    this.g_partA.switchToMe();
    this.g_partA.isReady();
    this.g_partA.render3D();
}

particleFire.prototype.debug = function () {
    this.g_partA.printPosition(this.g_partA.s1);
}

particleFire.prototype.update = function () {
    this.g_partA.reload();
}

//==============================================================================
//==============================================================================

function particleSpringPair() {
    //=============================================================================
    //=============================================================================

    this.VSHADER_SOURCE_PARTICLE =
        ' precision mediump float;                 \n' + // req'd in OpenGL ES if we use 'float'
        ' uniform    int u_runMode;                \n' + // particle system state: 
        ' attribute float a_Size;                  \n' +
        ' attribute vec4 a_Position;               \n' +
        ' attribute vec3 a_Color;                  \n' +
        ' uniform   mat4 u_ModelMat;               \n' +
        ' varying   vec4 v_Color;                  \n' +
        ' void main() {                            \n' +
        '   gl_PointSize = a_Size;                 \n' +// TRY MAKING THIS LARGER...
        '   gl_Position = u_ModelMat * a_Position; \n' +
        '   if(u_runMode == 0) {                   \n' +
        '     v_Color = vec4(1.0, 0.0, 0.0, 1.0);  \n' +   // red: 0==reset
        '     }                                    \n' +
        '   else if(u_runMode == 1) {              \n' +
        '     v_Color = vec4(1.0, 1.0, 0.0, 1.0);  \n' +  // yellow: 1==pause
        '     }                                    \n' +
        '   else if(u_runMode == 2) {              \n' +
        '     v_Color = vec4(1.0, 1.0, 1.0, 1.0);  \n' +  // white: 2==step
        '     }                                    \n' +
        '   else {                                 \n' +
        '     v_Color = vec4(a_Color, 1.0);        \n' +  // green: >=3 ==run
        '     }                                    \n' +
        ' }                                        \n';

    this.FSHADER_SOURCE_PARTICLE =
        'precision mediump float;                                 \n' +
        'varying vec4 v_Color;                                    \n' +
        'void main() {                                            \n' +
        '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));  \n' +
        '  if(dist < 0.5) {                                       \n' +
        '   gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0); \n' +
        '  } else { discard; }                                    \n' +
        '}                                                        \n';

    this.g_partA = new PartSys();
};

particleSpringPair.prototype.init = function () {

    this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE_PARTICLE, this.FSHADER_SOURCE_PARTICLE);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    this.g_partA.initSpringPair(this.shaderLoc);
}

particleSpringPair.prototype.draw = function () {
    // check: was WebGL context set to use our VBO & shader program?

    this.g_partA.switchToMe()
    this.g_partA.isReady();
    this.g_partA.applyForces(this.g_partA.s1, this.g_partA.forceList);
    this.g_partA.dotFinder(this.g_partA.s1dot, this.g_partA.s1);
    this.g_partA.solver();
    this.g_partA.doConstraints(this.g_partA.s1, this.g_partA.s2, this.g_partA.limitList);
    this.g_partA.particleBehaviour();
    this.g_partA.render3D();
    this.g_partA.swap();
}

particleSpringPair.prototype.render = function () {

    this.g_partA.switchToMe();
    this.g_partA.isReady();
    this.g_partA.render3D();
}

particleSpringPair.prototype.debug = function () {
    this.g_partA.printPosition(this.g_partA.s1);
}

particleSpringPair.prototype.update = function () {
    this.g_partA.reload();
}

//==============================================================================
//==============================================================================

function drawSprings() {

    this.VSHADER_SOURCE_SPRING =
        ' precision mediump float;                 \n' + // req'd in OpenGL ES if we use 'float'
        ' attribute vec4 a_Position;               \n' +
        ' attribute vec3 a_Color;                  \n' +
        ' uniform   mat4 u_ModelMat;               \n' +
        ' varying   vec4 v_Color;                  \n' +
        ' void main() {                            \n' +
        '   gl_Position = u_ModelMat * a_Position; \n' +
        '     v_Color = vec4(a_Color, 1.0);        \n' + 
        ' }                                        \n';

    this.FSHADER_SOURCE_SPRING =
        'precision mediump float;               \n' +
        'varying vec4 v_Color;                  \n' +
        'void main() {                          \n' +
        '  gl_FragColor = v_Color;              \n' +
        '}                                      \n';

    this.shaderLoc;
    this.particleSystem;
    this.point1 = new Vector4();
    this.point2 = new Vector4();
    this.ModelMat = new Matrix4();
};

drawSprings.prototype.init = function (particleSystem) {

    this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE_SPRING, this.FSHADER_SOURCE_SPRING);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }

    this.particleSystem = particleSystem;
    var floatPerVertex = 7;
    this.points = new Float32Array(sum_factorialize(this.particleSystem.partCount) * floatPerVertex + floatPerVertex);

    this.vboContents = this.points;
    this.vboVerts = this.points.length / floatPerVertex;

    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    this.vboBytes = this.vboContents.length * this.FSIZE;
    this.vboStride = this.vboBytes / this.vboVerts;
    this.vboFcount_a_Pos0 = 4;
    this.vboFcount_a_Colr0 = 3;
    this.vboOffset_a_Pos0 = 0;
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;

    gl.program = this.shaderLoc;    // (to match cuon-utils.js -- initShaders())

    var j = 0;
    for (var z = 0; z < this.particleSystem.partCount; z++) {
        for (var i = z; i < this.particleSystem.partCount; i++ , j += 7) {
            this.points[j + 0] = this.particleSystem.s1[(i * PART_MAXVAR) + PART_XPOS];
            this.points[j + 1] = this.particleSystem.s1[(i * PART_MAXVAR) + PART_YPOS];
            this.points[j + 2] = this.particleSystem.s1[(i * PART_MAXVAR) + PART_ZPOS];
            this.points[j + 3] = 1.0;
            this.points[j + 4] = Math.random();
            this.points[j + 5] = Math.random();
            this.points[j + 6] = Math.random();
        }
    }


    this.points[7 * ((this.points.length / 7) - 2) + 0] = this.points[0 + (7 * 3)];
    this.points[7 * ((this.points.length / 7) - 2) + 1] = this.points[1 + (7 * 3)];
    this.points[7 * ((this.points.length / 7) - 2) + 2] = this.points[2 + (7 * 3)];
    this.points[7 * ((this.points.length / 7) - 2) + 3] = this.points[3 + (7 * 3)];
    this.points[7 * ((this.points.length / 7) - 2) + 4] = this.points[4 + (7 * 3)];
    this.points[7 * ((this.points.length / 7) - 2) + 5] = this.points[5 + (7 * 3)];
    this.points[7 * ((this.points.length / 7) - 2) + 6] = this.points[6 + (7 * 3)];

    this.points[7 * ((this.points.length / 7) - 2) + 7] = this.points[0+ (7 * 2)];
    this.points[7 * ((this.points.length / 7) - 2) + 8] = this.points[1+ (7 * 2)];
    this.points[7 * ((this.points.length / 7) - 2) + 9] = this.points[2 + (7 * 2)];
    this.points[7 * ((this.points.length / 7) - 2) + 10] = this.points[3+ (7 * 2)];
    this.points[7 * ((this.points.length / 7) - 2) + 11] = this.points[4+ (7 * 2)];
    this.points[7 * ((this.points.length / 7) - 2) + 12] = this.points[5+ (7 * 2)];
    this.points[7 * ((this.points.length / 7) - 2) + 13] = this.points[6 + (7 * 2)];

    // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();

    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,        // GLenum 'target' for this GPU buffer 
        this.vboLoc);         // the ID# the GPU uses for this buffer.

    gl.bufferData(gl.ARRAY_BUFFER,        // GLenum target(same as 'bindBuffer()')
        this.vboContents,     // JavaScript Float32Array
        gl.STATIC_DRAW);      // Usage hint.

    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if (this.a_PosLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;  // error exit.
    }

    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
    if (this.a_ColrLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Color');
        return -1;  // error exit.
    }

    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
    if (!this.u_ModelMatLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMat uniform');
        return;
    }
}

drawSprings.prototype.switchToMe = function () {

    gl.useProgram(this.shaderLoc);
    var j = 0;
    for (var z = 0; z < this.particleSystem.partCount; z++) {
        for (var i = z; i < this.particleSystem.partCount; i++ , j += 7) {
            this.points[j + 0] = this.particleSystem.s1[(i * PART_MAXVAR) + PART_XPOS];
            this.points[j + 1] = this.particleSystem.s1[(i * PART_MAXVAR) + PART_YPOS];
            this.points[j + 2] = this.particleSystem.s1[(i * PART_MAXVAR) + PART_ZPOS];
            this.points[j + 3] = 1.0;
            //this.points[j + 4] = this.red;
            //this.points[j + 5] = this.green;
            //this.points[j + 6] = this.blue;
        }
    }

    this.points[7 * ((this.points.length / 7) - 2) + 0] = this.points[0 + (7 * 3)];
    this.points[7 * ((this.points.length / 7) - 2) + 1] = this.points[1 + (7 * 3)];
    this.points[7 * ((this.points.length / 7) - 2) + 2] = this.points[2 + (7 * 3)];
    this.points[7 * ((this.points.length / 7) - 2) + 3] = this.points[3 + (7 * 3)];

    this.points[7 * ((this.points.length / 7) - 2) + 7] = this.points[0 + (7 * 2)];
    this.points[7 * ((this.points.length / 7) - 2) + 8] = this.points[1 + (7 * 2)];
    this.points[7 * ((this.points.length / 7) - 2) + 9] = this.points[2 + (7 * 2)];
    this.points[7 * ((this.points.length / 7) - 2) + 10] = this.points[3 + (7 * 2)];


    gl.bindBuffer(gl.ARRAY_BUFFER,          // GLenum 'target' for this GPU buffer 
        this.vboLoc);         // the ID# the GPU uses for our VBO.

    gl.vertexAttribPointer(
        this.a_PosLoc,
        this.vboFcount_a_Pos0,
        gl.FLOAT,
        false,

        this.vboStride,

        this.vboOffset_a_Pos0);

    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Colr0);

    // --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
}

drawSprings.prototype.isReady = function () {

    var isOK = true;

    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

drawSprings.prototype.adjust = function () {

    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }

    this.ModelMat.setPerspective(30.0,
        vpAspect,
        .25,
        1000.0);

    this.ModelMat.lookAt(x_Coordinate, y_Coordinate, z_Coordinate,
        x_lookAt, y_lookAt, z_lookAt,
        0, 0, 1);

    this.ModelMat.translate(0, 0, 1);
    this.ModelMat.rotate(90, 1, 0, 0);

    pushMatrix(this.ModelMat);

    this.ModelMat = popMatrix();

    gl.uniformMatrix4fv(this.u_ModelMatLoc, false, this.ModelMat.elements);
}

drawSprings.prototype.render = function () {

    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    gl.drawArrays(gl.LINE_LOOP, 0, this.vboVerts);

    this.reload();
}

drawSprings.prototype.reload = function () {
    //=============================================================================

    gl.bufferSubData(gl.ARRAY_BUFFER,  // GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO

}

//==============================================================================
//==============================================================================

function particleTornado() {
this.VSHADER_SOURCE_PARTICLE =
    ' precision mediump float;                 \n' + // req'd in OpenGL ES if we use 'float'
    ' uniform    int u_runMode;                \n' + // particle system state: 
    ' attribute float a_Size;                  \n' +
    ' attribute vec4 a_Position;               \n' +
    ' attribute vec3 a_Color;                  \n' +
    ' uniform   mat4 u_ModelMat;               \n' +
    ' varying   vec4 v_Color;                  \n' +
    ' void main() {                            \n' +
    '   gl_PointSize = a_Size;                 \n' +// TRY MAKING THIS LARGER...
    '   gl_Position = u_ModelMat * a_Position; \n' +
    '   if(u_runMode == 0) {                   \n' +
    '     v_Color = vec4(1.0, 0.0, 0.0, 1.0);  \n' +   // red: 0==reset
    '     }                                    \n' +
    '   else if(u_runMode == 1) {              \n' +
    '     v_Color = vec4(1.0, 1.0, 0.0, 1.0);  \n' +  // yellow: 1==pause
    '     }                                    \n' +
    '   else if(u_runMode == 2) {              \n' +
    '     v_Color = vec4(1.0, 1.0, 1.0, 1.0);  \n' +  // white: 2==step
    '     }                                    \n' +
    '   else {                                 \n' +
    '     v_Color = vec4(a_Color, 1.0);        \n' +  // green: >=3 ==run
    '     }                                    \n' +
    ' }                                        \n';

    this.FSHADER_SOURCE_PARTICLE =
        'precision mediump float;                                 \n' +
        'varying vec4 v_Color;                                    \n' +
        'void main() {                                            \n' +
        '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));  \n' +
        '  if(dist < 0.5) {                                       \n' +
        '   gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0); \n' +
        '  } else { discard; }                                    \n' +
        '}                                                        \n';

    this.g_partA = new PartSys();
};

particleTornado.prototype.init = function (count) {

    this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE_PARTICLE, this.FSHADER_SOURCE_PARTICLE);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    this.g_partA.initTornado(count, this.shaderLoc);
}

particleTornado.prototype.draw = function () {
    // check: was WebGL context set to use our VBO & shader program?

    this.g_partA.switchToMe()
    this.g_partA.isReady();
    this.g_partA.applyForces(this.g_partA.s1, this.g_partA.forceList);
    this.g_partA.dotFinder(this.g_partA.s1dot, this.g_partA.s1);
    this.g_partA.solver();
    this.g_partA.doConstraints(this.g_partA.s1, this.g_partA.s2, this.g_partA.limitList);
    this.g_partA.particleBehaviour();
    this.g_partA.render3D();
    this.g_partA.swap();
}

particleTornado.prototype.render = function () {

    this.g_partA.switchToMe();
    this.g_partA.isReady();
    this.g_partA.render3D();
}

particleTornado.prototype.debug = function () {
    this.g_partA.printPosition(this.g_partA.s1);
}

particleTornado.prototype.update = function () {
    this.g_partA.reload();
}
//==============================================================================
//==============================================================================

function particleSpringSolid() {
    //=============================================================================
    //=============================================================================

    this.VSHADER_SOURCE_PARTICLE =
        ' precision mediump float;                 \n' + // req'd in OpenGL ES if we use 'float'
        ' uniform    int u_runMode;                \n' + // particle system state: 
        ' attribute float a_Size;                  \n' +
        ' attribute vec4 a_Position;               \n' +
        ' attribute vec3 a_Color;                  \n' +
        ' uniform   mat4 u_ModelMat;               \n' +
        ' varying   vec4 v_Color;                  \n' +
        ' void main() {                            \n' +
        '   gl_PointSize = a_Size;                 \n' +// TRY MAKING THIS LARGER...
        '   gl_Position = u_ModelMat * a_Position; \n' +
        '   if(u_runMode == 0) {                   \n' +
        '     v_Color = vec4(1.0, 0.0, 0.0, 1.0);  \n' +   // red: 0==reset
        '     }                                    \n' +
        '   else if(u_runMode == 1) {              \n' +
        '     v_Color = vec4(1.0, 1.0, 0.0, 1.0);  \n' +  // yellow: 1==pause
        '     }                                    \n' +
        '   else if(u_runMode == 2) {              \n' +
        '     v_Color = vec4(1.0, 1.0, 1.0, 1.0);  \n' +  // white: 2==step
        '     }                                    \n' +
        '   else {                                 \n' +
        '     v_Color = vec4(a_Color, 1.0);        \n' +  // green: >=3 ==run
        '     }                                    \n' +
        ' }                                        \n';

    this.FSHADER_SOURCE_PARTICLE =
        'precision mediump float;                                 \n' +
        'varying vec4 v_Color;                                    \n' +
        'void main() {                                            \n' +
        '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));  \n' +
        '  if(dist < 0.5) {                                       \n' +
        '   gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0); \n' +
        '  } else { discard; }                                    \n' +
        '}                                                        \n';

    this.g_partA = new PartSys();
};

particleSpringSolid.prototype.init = function () {

    this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE_PARTICLE, this.FSHADER_SOURCE_PARTICLE);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    this.g_partA.initSpringSolid(this.shaderLoc);
}

particleSpringSolid.prototype.draw = function () {
    // check: was WebGL context set to use our VBO & shader program?

    this.g_partA.switchToMe()
    this.g_partA.isReady();
    this.g_partA.applyForces(this.g_partA.s1, this.g_partA.forceList);
    this.g_partA.dotFinder(this.g_partA.s1dot, this.g_partA.s1);
    this.g_partA.solver();
    this.g_partA.doConstraints(this.g_partA.s1, this.g_partA.s2, this.g_partA.limitList);
    this.g_partA.particleBehaviour();
    this.g_partA.render3D();
    this.g_partA.swap();
}

particleSpringSolid.prototype.render = function () {

    this.g_partA.switchToMe();
    this.g_partA.isReady();
    this.g_partA.render3D();
}

particleSpringSolid.prototype.debug = function () {
    this.g_partA.printPosition(this.g_partA.s1);
}

particleSpringSolid.prototype.update = function () {
    this.init();
}

//==============================================================================
//==============================================================================

function particleBoids() {
    //=============================================================================
    //=============================================================================

    this.VSHADER_SOURCE_PARTICLE =
        ' precision mediump float;                 \n' + // req'd in OpenGL ES if we use 'float'
        ' uniform    int u_runMode;                \n' + // particle system state: 
        ' attribute float a_Size;                  \n' +
        ' attribute vec4 a_Position;               \n' +
        ' attribute vec3 a_Color;                  \n' +
        ' uniform   mat4 u_ModelMat;               \n' +
        ' varying   vec4 v_Color;                  \n' +
        ' void main() {                            \n' +
        '   gl_PointSize = a_Size;                 \n' +// TRY MAKING THIS LARGER...
        '   gl_Position = u_ModelMat * a_Position; \n' +
        '   if(u_runMode == 0) {                   \n' +
        '     v_Color = vec4(1.0, 0.0, 0.0, 1.0);  \n' +   // red: 0==reset
        '     }                                    \n' +
        '   else if(u_runMode == 1) {              \n' +
        '     v_Color = vec4(1.0, 1.0, 0.0, 1.0);  \n' +  // yellow: 1==pause
        '     }                                    \n' +
        '   else if(u_runMode == 2) {              \n' +
        '     v_Color = vec4(1.0, 1.0, 1.0, 1.0);  \n' +  // white: 2==step
        '     }                                    \n' +
        '   else {                                 \n' +
        '     v_Color = vec4(a_Color, 1.0);        \n' +  // green: >=3 ==run
        '     }                                    \n' +
        ' }                                        \n';

    this.FSHADER_SOURCE_PARTICLE =
        'precision mediump float;                                 \n' +
        'varying vec4 v_Color;                                    \n' +
        'void main() {                                            \n' +
        '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));  \n' +
        '  if(dist < 0.5) {                                       \n' +
        '   gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0); \n' +
        '  } else { discard; }                                    \n' +
        '}                                                        \n';

    this.g_partA = new PartSys();
};

particleBoids.prototype.init = function (count) {

    this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE_PARTICLE, this.FSHADER_SOURCE_PARTICLE);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    this.g_partA.initFlocking(count, this.shaderLoc);
}

particleBoids.prototype.draw = function () {
    // check: was WebGL context set to use our VBO & shader program?

    this.g_partA.switchToMe()
    this.g_partA.isReady();
    this.g_partA.applyForces(this.g_partA.s1, this.g_partA.forceList);
    this.g_partA.dotFinder(this.g_partA.s1dot, this.g_partA.s1);
    this.g_partA.particleBehaviour();
    this.g_partA.solver();
    this.g_partA.doConstraints(this.g_partA.s1, this.g_partA.s2, this.g_partA.limitList);
    this.g_partA.render3D();
    this.g_partA.swap();
}

particleBoids.prototype.render = function () {

    this.g_partA.switchToMe();
    this.g_partA.isReady();
    this.g_partA.render3D();
}

particleBoids.prototype.debug = function () {
    this.g_partA.printPosition(this.g_partA.s1);
}

particleBoids.prototype.update = function () {
    this.init(boids_particles);
}

//==============================================================================
//==============================================================================

function sum_factorialize(num) {
    if (num < 0)
        return -1;
    else if (num == 0)
        return 1;
    else {
        return (num + sum_factorialize(num - 1));
    }
}