//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Set 'tab' to 2 spaces (for best on-screen appearance)

/*
================================================================================
================================================================================

                              PartSys Library

================================================================================
================================================================================
Prototype object that contains one complete particle system, including:
 -- state-variables s1, s2, & more that each describe a complete set of 
  particles at a fixed instant in time. Each state-var is a Float32Array that 
  hold the parameters of this.targCount particles (defined by constructor).
 -- Each particle is an identical sequence of floating-point parameters defined 
  by the extensible set of array-index names defined as constants near the top 
  of this file.  For example: PART_XPOS for x-coordinate of position, PART_YPOS 
  for particle's y-coord, and finally PART_MAXVAL defines total # of parameters.
  To access parameter PART_YVEL of the 17th particle in state var s1, use:
  this.s1[PART_YVEL + 17*PART_MAXVAL].
 -- A collection of 'force-causing' objects in forceList array
                                                  (see CForcer prototype below),
 -- A collection of 'constraint-imposing' objects in limitList array
                                                  (see CLimit prototype below),
 -- Particle-system computing functions described in class notes: 
  init(), applyForces(), dotFinder(), render(), doConstraints(), swap().
 
 HOW TO USE:
 ---------------
 a) Be sure your WebGL rendering context is available as the global var 'gl'.
 b) Create a global variable for each independent particle system:
  e.g.    g_PartA = new PartSys(500);   // 500-particle fire-like system 
          g_partB = new PartSys(32);    //  32-particle spring-mass system
          g_partC = new PartSys(1024);  // 1024-particle smoke-like system
          ...
 c) Modify each particle-system as needed to get desired results:
    g_PartA.init(3);  g_PartA.solvType = SOLV_ADAMS_BASHFORTH; etc...
 d) Be sure your program's animation method (e.g. 'drawAll') calls the functions
    necessary for the simulation process of all particle systems, e.g.
      in main(), call g_partA.init(), g_partB.init(), g_partC.init(), ... etc
      in drawAll(), call:
        g_partA.applyForces(), g_partB.applyForces(), g_partC.applyForces(), ...
        g_partA.dotFinder(),   g_partB.dotFinder(),   g_partC.dotFinder(), ...
        g_partA.render(),      g_partB.render(),      g_partC.render(), ...
        g_partA.solver(),      g_partB.solver(),      g_partC.solver(), ...
        g_partA.doConstraint(),g_partB.doConstraint(),g_partC.doConstraint(),...
        g_partA.swap(),        g_partB.swap(),        g_partC.swap().

*/

// Array-name consts for all state-variables in PartSys object:
/*------------------------------------------------------------------------------
     Each state-variable is a Float32Array object that holds 'this.partCount' 
particles. For each particle the state var holds exactly PART_MAXVAR elements 
(aka the 'parameters' of the particle) arranged in the sequence given by these 
array-name consts below.  
     For example, the state-variable object 'this.s1' is a Float32Array that 
holds this.partCount particles, and each particle is described by a sequence of
PART_MAXVAR floating-point parameters; in other words, the 'stride' that moves
use from a given parameter in one particle to the same parameter in the next
particle is PART_MAXVAR. Suppose we wish to find the Y velocity parameter of 
particle number 17 in s1 ('first' particle is number 0): we can
get that value if we write: this.s1[PART_XVEL + 17*PART_MAXVAR].
------------------------------------------------------------------------------*/
const PART_XPOS     = 0;  //  position    
const PART_YPOS     = 1;
const PART_ZPOS     = 2;
const PART_WPOS     = 3;            // (why include w? for matrix transforms; 
                                    // for vector/point distinction
const PART_XVEL     = 4;  //  velocity -- ALWAYS a vector: x,y,z; no w. (w==0)    
const PART_YVEL     = 5;
const PART_ZVEL     = 6;
const PART_X_FTOT   = 7;  // force accumulator:'ApplyForces()' fcn clears
const PART_Y_FTOT   = 8;  // to zero, then adds each force to each particle.
const PART_Z_FTOT   = 9;        
const PART_R        =10;  // color : red,green,blue, alpha (opacity); 0<=RGBA<=1.0
const PART_G        =11;  
const PART_B        =12;
const PART_MASS     =13;  	// mass, in kilograms
const PART_DIAM 	  =14;	// on-screen diameter (in pixels)
const PART_RENDMODE =15;	// on-screen appearance (square, round, or soft-round)
 // Other useful particle values, currently unused
const PART_AGE      =16;  // # of frame-times until re-initializing (Reeves Fire)
const PART_SIZE     =17
/*
const PART_CHARGE   =17;  // for electrostatic repulsion/attraction
const PART_MASS_VEL =18;  // time-rate-of-change of mass.
const PART_MASS_FTOT=19;  // force-accumulator for mass-change
const PART_R_VEL    =20;  // time-rate-of-change of color:red
const PART_G_VEL    =21;  // time-rate-of-change of color:grn
const PART_B_VEL    =22;  // time-rate-of-change of color:blu
const PART_R_FTOT   =23;  // force-accumulator for color-change: red
const PART_G_FTOT   =24;  // force-accumulator for color-change: grn
const PART_B_FTOT   =25;  // force-accumulator for color-change: blu
*/
const PART_MAXVAR   =18;  // Size of array in CPart uses to store its values.

// Array-Name consts that select PartSys objects' numerical-integration solver:
//------------------------------------------------------------------------------
// EXPLICIT methods: GOOD!
//    ++ simple, easy to understand, fast, but
//    -- Requires tiny time-steps for stable stiff systems, because
//    -- Errors tend to 'add energy' to any dynamical system, driving
//        many systems to instability even with small time-steps.
const SOLV_EULER       = 0;       // Euler integration: forward,explicit,...
const SOLV_MIDPOINT    = 1;       // Midpoint Method (see Pixar Tutorial)
const SOLV_ADAMS_BASH  = 2;       // Adams-Bashforth Explicit Integrator
const SOLV_RUNGEKUTTA  = 3;       // Arbitrary degree, set by 'solvDegree'

// IMPLICIT methods:  BETTER!
//          ++Permits larger time-steps for stiff systems, but
//          --More complicated, slower, less intuitively obvious,
//          ++Errors tend to 'remove energy' (ghost friction; 'damping') that
//              aids stability even for large time-steps.
//          --requires root-finding (iterative: often no analytical soln exists)
const SOLV_OLDGOOD     = 4;      //  early accidental 'good-but-wrong' solver
const SOLV_BACK_EULER  = 5;      // 'Backwind' or Implicit Euler
const SOLV_BACK_MIDPT  = 6;      // 'Backwind' or Implicit Midpoint
const SOLV_BACK_ADBASH = 7;      // 'Backwind' or Implicit Adams-Bashforth

// SEMI-IMPLICIT METHODS: BEST?
//          --Permits larger time-steps for stiff systems,
//          ++Simpler, easier-to-understand than Implicit methods
//          ++Errors tend to 'remove energy) (ghost friction; 'damping') that
//              aids stability even for large time-steps.
//          ++ DOES NOT require the root-finding of implicit methods,
const SOLV_VERLET      = 8;       // Verlet semi-implicit integrator;
const SOLV_VEL_VERLET  = 9;       // 'Velocity-Verlet'semi-implicit integrator
const SOLV_LEAPFROG    = 10;      // 'Leapfrog' integrator
const SOLV_MAX         = 11;      // number of solver types available.

const NU_EPSILON  = 10E-15;         // a tiny amount; a minimum vector length
                                    // to use to avoid 'divide-by-zero'

//=============================================================================
//==============================================================================
function PartSys() {
//==============================================================================
//=============================================================================
// Constructor for a new particle system.
    this.randX = 0;   // random point chosen by call to roundRand()
    this.randY = 0;
    this.randZ = 0;
    this.current_particle_System = 0;   // Press 'f' or 'F' key to cycle through different
                                        // particle systems
    this.forceList = [];                // (empty) array to hold CForcer objects
                                        // for use by ApplyAllForces().
                                        // NOTE: this.forceList.push("hello"); appends
                                        // string "Hello" as last element of forceList.
                                        // console.log(this.forceList[0]); prints hello.
    this.limitList = [];                // (empty) array to hold CLimit objects
                                        // for use by doContstraints()
    this.particleSystemType = false;          // thisParticleSystemType   

    this.total_particle_systems = 0;
}
// HELPER FUNCTIONS:
//=====================
// Misc functions that don't fit elsewhere

PartSys.prototype.roundRand = function() {
//==============================================================================
// When called, find a new 3D point (this.randX, this.randY, this.randZ) chosen 
// 'randomly' and 'uniformly' inside a sphere of radius 1.0 centered at origin.  
//		(within this sphere, all regions of equal volume are equally likely to
//		contain the the point (randX, randY, randZ, 1).

	do {			// RECALL: Math.random() gives #s with uniform PDF between 0 and 1.
		this.randX = 2.0*Math.random() -1.0; // choose an equally-likely 2D point
		this.randY = 2.0*Math.random() -1.0; // within the +/-1 cube, but
		this.randZ = 2.0*Math.random() -1.0;
		}       // is x,y,z outside sphere? try again!
	while(this.randX*this.randX + 
	      this.randY*this.randY + 
	      this.randZ*this.randZ >= 1.0); 
}


PartSys.prototype.calculateDistance_camera = function(x_coord, y_coord, z_coord){

  var distance =  Math.sqrt(Math.pow((x_Coordinate - x_coord), 2) + 
                            Math.pow((y_Coordinate - y_coord), 2) +
                            Math.pow((z_Coordinate - z_coord), 2))

  return distance; 
}

PartSys.prototype.calculateDistance_points = function (point1, point2) {

    var distance = Math.sqrt(Math.pow((point1.elements[0] - point2.elements[0]), 2) +
        Math.pow((point1.elements[1] - point2.elements[1]), 2) +
        Math.pow((point1.elements[2] - point2.elements[2]), 2))

    return distance;
}

// INIT FUNCTIONS:
//==================
// Each 'init' function initializes everything in our particle system. Each 
// creates all necessary state variables, force-applying objects, 
// constraint-applying objects, solvers and all other values needed to prepare
// the particle-system to run without any further adjustments.

PartSys.prototype.initBouncy2D = function(count, shader) {
//==============================================================================
  // Create all state-variables-------------------------------------------------
  this.partCount = count;
  this.s1 =    new Float32Array(this.partCount * PART_MAXVAR);
  this.s2 =    new Float32Array(this.partCount * PART_MAXVAR);
  this.s1dot = new Float32Array(this.partCount * PART_MAXVAR);  
        // NOTE: Float32Array objects are zero-filled by default.
    this.springdraw = false;

  // Create & init all force-causing objects------------------------------------
  var fTmp = new CForcer();       // create a force-causing object, and
  // earth gravity for all particles:
  fTmp.forceType = F_GRAV_E;      // set it to earth gravity, and
  fTmp.targFirst = 0;             // set it to affect ALL particles:
  fTmp.partCount = -1;            // (negative value means ALL particles)
                                  // (and IGNORE all other Cforcer members...)
  this.forceList.push(fTmp);      // append this 'gravity' force object to 
                                  // the forceList array of force-causing objects.
  // drag for all particles:
  fTmp = new CForcer();           // create a NEW CForcer object 
                                  // (WARNING! until we do this, fTmp refers to
                                  // the same memory locations as forceList[0]!!!) 
  fTmp.forceType = F_DRAG;        // Viscous Drag
  fTmp.Kdrag = 0.15;              // in Euler solver, scales velocity by 0.85
  fTmp.targFirst = 0;             // apply it to ALL particles:
  fTmp.partCount = -1;            // (negative value means ALL particles)
                                  // (and IGNORE all other Cforcer members...)
  this.forceList.push(fTmp);      // append this 'gravity' force object to 
                                  // the forceList array of force-causing objects.
  // Report:
  console.log("PartSys.initBouncy2D() created PartSys.forceList[] array of ");
  console.log("\t\t", this.forceList.length, "CForcer objects:");
  for(i=0; i<this.forceList.length; i++) {
    console.log("CForceList[",i,"]");
    this.forceList[i].printMe();
    }                   

  // Create & init all constraint-causing objects-------------------------------
  var cTmp = new CLimit();      // creat constraint-causing object, and
  cTmp.hitType = HIT_BOUNCE_VEL;  // set how particles 'bounce' from its surface,
  cTmp.limitType = LIM_VOL;       // confine particles inside axis-aligned 
                                  // rectangular volume that
  cTmp.targFirst = 0;             // applies to ALL particles; starting at 0 
  cTmp.partCount = -1;            // through all the rest of them.
  cTmp.xMin = -1.0; cTmp.xMax = 1.0;  // box extent:  +/- 1.0 box at origin
  cTmp.yMin = -1.0; cTmp.yMax = 1.0;
  cTmp.zMin = -1.0; cTmp.zMax = 1.0;
  cTmp.Kresti = 1.0;              // bouncyness: coeff. of restitution.
                                  // (and IGNORE all other CLimit members...)
  this.limitList.push(cTmp);      // append this 'box' constraint object to the
                                  // 'limitList' array of constraint-causing objects.                                
  // Report:
  console.log("PartSys.initBouncy2D() created PartSys.limitList[] array of ");
  console.log("\t\t", this.limitList.length, "CLimit objects.");

  this.INIT_VEL =  0.15 * 60.0;		// initial velocity in meters/sec.
	                  // adjust by ++Start, --Start buttons. Original value 
										// was 0.15 meters per timestep; multiply by 60 to get
                    // meters per second.
  this.drag = 0.985;// units-free air-drag (scales velocity); adjust by d/D keys
  this.grav = 9.832;// gravity's acceleration(meter/sec^2); adjust by g/G keys.
	                  // on Earth surface, value is 9.832 meters/sec^2.
  this.resti = 1.0; // units-free 'Coefficient of Restitution' for 
	                  // inelastic collisions.  Sets the fraction of momentum 
										// (0.0 <= resti < 1.0) that remains after a ball 
										// 'bounces' on a wall or floor, as computed using 
										// velocity perpendicular to the surface. 
										// (Recall: momentum==mass*velocity.  If ball mass does 
										// not change, and the ball bounces off the x==0 wall,
										// its x velocity xvel will change to -xvel * resti ).
										
  //--------------------------init Particle System Controls:
  this.runMode =  3;// Master Control: 0=reset; 1= pause; 2=step; 3=run
    this.solvType = SOLV_OLDGOOD;// adjust by s/S keys.

                    // SOLV_EULER (explicit, forward-time, as 
										// found in BouncyBall03.01BAD and BouncyBall04.01badMKS)
										// SOLV_OLDGOOD for special-case implicit solver, reverse-time, 
										// as found in BouncyBall03.GOOD, BouncyBall04.goodMKS)
  this.bounceType = 1;	// floor-bounce constraint type:
										// ==0 for velocity-reversal, as in all previous versions
										// ==1 for Chapter 3's collision resolution method, which
										// uses an 'impulse' to cancel any velocity boost caused
										// by falling below the floor.
  this.shader = shader;

  gl.program = this.shader;
  gl.useProgram(this.shader);
//--------------------------------Create & fill VBO with state var s1 contents:
// INITIALIZE s1, s2:
//  NOTE: s1,s2 are a Float32Array objects, zero-filled by default.
// That's OK for most particle parameters, but these need non-zero defaults:

  var j = 0;  // i==particle number; j==array index for i-th particle
  for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
    this.roundRand();       // set this.randX,randY,randZ to random location in 
                            // a 3D unit sphere centered at the origin.
    //all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
    // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
    this.s1[j + PART_XPOS] = -0.8 + 0.1*this.randX; 
    this.s1[j + PART_YPOS] = -0.8 + 0.1*this.randY;  
    this.s1[j + PART_ZPOS] = -0.8 + 0.1*this.randZ;
    this.s1[j + PART_WPOS] =  1.0;      // position 'w' coordinate;
    this.roundRand(); // Now choose random initial velocities too:
    this.s1[j + PART_XVEL] =  this.INIT_VEL*(0.4 + 0.2*this.randX);
    this.s1[j + PART_YVEL] =  this.INIT_VEL*(0.4 + 0.2*this.randY);
    this.s1[j + PART_ZVEL] =  this.INIT_VEL*(0.4 + 0.2*this.randZ);
    this.s1[j + PART_MASS] =  1.0;      // mass, in kg.
    this.s1[j + PART_DIAM] =  2.0 + 10*Math.random(); // on-screen diameter, in pixels
    this.s1[j + PART_RENDMODE] = 0.0;
    this.s1[j + PART_AGE] = 30 + 100*Math.random();
    //----------------------------
    this.s2.set(this.s1);   // COPY contents of state-vector s1 to s2.
  }

  this.FSIZE = this.s1.BYTES_PER_ELEMENT;  // 'float' size, in bytes.
// Create a vertex buffer object (VBO) in the graphics hardware: get its ID# 
  this.vboID = gl.createBuffer();
  if (!this.vboID) {
    console.log('PartSys.init() Failed to create the VBO object in the GPU');
    return -1;
  }
  // "Bind the new buffer object (memory in the graphics system) to target"
  // In other words, specify the usage of one selected buffer object.
  // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
  // intended use of this buffer's memory; so far, we have just two choices:
  //	== "gl.ARRAY_BUFFER" meaning the buffer object holds actual values we 
  //      need for rendering (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
  // 			into a list of values we need; indices such as object #s, face #s, 
  //			edge vertex #s.
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);

  // Write data from our JavaScript array to graphics systems' buffer object:
  gl.bufferData(gl.ARRAY_BUFFER, this.s1, gl.DYNAMIC_DRAW);
  // why 'DYNAMIC_DRAW'? Because we change VBO's content with bufferSubData() later

  // ---------Set up all attributes for VBO contents:
  //Get the ID# for the a_Position variable in the graphics hardware
  this.a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(this.a_PositionID < 0) {
    console.log('PartSys.init() Failed to get the storage location of a_Position');
    return -1;
  }
  // Tell GLSL to fill the 'a_Position' attribute variable for each shader with
  // values from the buffer object chosen by 'gl.bindBuffer()' command.
  // websearch yields OpenGL version: 
  //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  gl.vertexAttribPointer(this.a_PositionID, 
          4,  // # of values in this attrib (1,2,3,4) 
          gl.FLOAT, // data type (usually gl.FLOAT)
          false,    // use integer normalizing? (usually false)
          PART_MAXVAR*this.FSIZE,  // Stride: #bytes from 1st stored value to next one
          PART_XPOS * this.FSIZE); // Offset; #bytes from start of buffer to 
                    // 1st stored attrib value we will actually use.
  // Enable this assignment of the bound buffer to the a_Position variable:
  gl.enableVertexAttribArray(this.a_PositionID);
 
  // ---------Set up all uniforms we send to the GPU:
  // Get graphics system storage location of each uniform our shaders use:
  // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
  this.u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
  if(!this.u_runModeID) {
  	console.log('PartSys.init() Failed to get u_runMode variable location');
  	return;
  }
  // Set the initial values of all uniforms on GPU: (runMode set by keyboard)
	gl.uniform1i(this.u_runModeID, this.runMode);
}

PartSys.prototype.initBouncy3D = function(count, shader) { 
//==============================================================================
  // Create all state-variables-------------------------------------------------
  this.partCount = count;
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2 =    new Float32Array(this.partCount * PART_MAXVAR);
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR);

    this.showSprings = false;
        // NOTE: Float32Array objects are zero-filled by default.

  // Create & init all force-causing objects------------------------------------
  var fTmp = new CForcer();       // create a force-causing object, and
  // earth gravity for all particles:
  fTmp.forceType = F_GRAV_E;      // set it to earth gravity, and
  fTmp.targFirst = 0;             // set it to affect ALL particles:
  fTmp.partCount = -1;            // (negative value means ALL particles)
                                  // (and IGNORE all other Cforcer members...)
  this.forceList.push(fTmp);      // append this 'gravity' force object to 
                                  // the forceList array of force-causing objects.
  // drag for all particles:
  fTmp = new CForcer();           // create a NEW CForcer object 
                                  // (WARNING! until we do this, fTmp refers to
                                  // the same memory locations as forceList[0]!!!) 
  fTmp.forceType = F_DRAG;        // Viscous Drag
  fTmp.Kdrag = 0.9;               // in Euler solver, scales velocity by 0.85
  fTmp.targFirst = 0;             // apply it to ALL particles:
  fTmp.partCount = -1;            // (negative value means ALL particles)
                                  // (and IGNORE all other Cforcer members...)
  this.forceList.push(fTmp);      // append this 'gravity' force object to 
                                  // the forceList array of force-causing objects.

    //Set the current Particle System and push it

    this.particleSystemType = BOUNCY_BALL;

  // Report:
  console.log("PartSys.initBouncy3D() created PartSys.forceList[] array of ");
  console.log("\t\t", this.forceList.length, "CForcer objects:");
  for(i=0; i<this.forceList.length; i++) {
    console.log("CForceList[",i,"]");
    this.forceList[i].printMe();
    }                   

  // Create & init all constraint-causing objects-------------------------------
  var cTmp = new CLimit();      // creat constraint-causing object, and
  cTmp.hitType = HIT_BOUNCE_VEL;  // set how particles 'bounce' from its surface,
  cTmp.limitType = LIM_VOL;       // confine particles inside axis-aligned 
                                  // rectangular volume that
  cTmp.targFirst = 0;             // applies to ALL particles; starting at 0 
  cTmp.partCount = -1;            // through all the rest of them.
    cTmp.xMin = -0.95; cTmp.xMax = 0.95;  // box extent:  +/- 1.0 box at origin
    cTmp.yMin = -0.95; cTmp.yMax = 0.95;
    cTmp.zMin = -0.95; cTmp.zMax = 0.95;
  cTmp.Kresti = 1.0;              // bouncyness: coeff. of restitution.
                                  // (and IGNORE all other CLimit members...)
  this.limitList.push(cTmp);      // append this 'box' constraint object to the
                                  // 'limitList' array of constraint-causing objects.                                
  // Report:
  console.log("PartSys.initBouncy3D() created PartSys.limitList[] array of ");
  console.log("\t\t", this.limitList.length, "CLimit objects.");

  this.INIT_VEL =  0.15 * 60.0;   // initial velocity in meters/sec.
                    // adjust by ++Start, --Start buttons. Original value 
                    // was 0.15 meters per timestep; multiply by 60 to get
                    // meters per second.
    this.drag = 0.9;/*0.985;*/// units-free air-drag (scales velocity); adjust by d/D keys
  this.grav = 9.832;// gravity's acceleration(meter/sec^2); adjust by g/G keys.
                    // on Earth surface, value is 9.832 meters/sec^2.
  this.resti = 1.0; // units-free 'Coefficient of Restitution' for 
                    // inelastic collisions.  Sets the fraction of momentum 
                    // (0.0 <= resti < 1.0) that remains after a ball 
                    // 'bounces' on a wall or floor, as computed using 
                    // velocity perpendicular to the surface. 
                    // (Recall: momentum==mass*velocity.  If ball mass does 
                    // not change, and the ball bounces off the x==0 wall,
                    // its x velocity xvel will change to -xvel * resti ).
                    
  //--------------------------init Particle System Controls:
    this.runMode = 3;// Master Control: 0=reset; 1= pause; 2=step; 3=run
    this.solvType = bouncySolver;// adjust by s/S keys.
    console.log(this.solvType);
                    // SOLV_EULER (explicit, forward-time, as 
                    // found in BouncyBall03.01BAD and BouncyBall04.01badMKS)
                    // SOLV_OLDGOOD for special-case implicit solver, reverse-time, 
                    // as found in BouncyBall03.GOOD, BouncyBall04.goodMKS)
  this.bounceType = 1;  // floor-bounce constraint type:
                    // ==0 for velocity-reversal, as in all previous versions
                    // ==1 for Chapter 3's collision resolution method, which
                    // uses an 'impulse' to cancel any velocity boost caused
                    // by falling below the floor.
  this.shader = shader;
  this.ModelMatrix = new Matrix4();
  this.uLoc_ModelMatrix = false;
  this.u_runModeID = false;
  this.size = 10.0;


  gl.program = this.shader;
  gl.useProgram(this.shader);
//--------------------------------Create & fill VBO with state var s1 contents:
// INITIALIZE s1, s2:
//  NOTE: s1,s2 are a Float32Array objects, zero-filled by default.
// That's OK for most particle parameters, but these need non-zero defaults:

  var j = 0;  // i==particle number; j==array index for i-th particle
  for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
    this.roundRand();       // set this.randX,randY,randZ to random location in 
                            // a 3D unit sphere centered at the origin.
    //all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
    // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
    this.s1[j + PART_XPOS] = -0.8 + 0.1*this.randX; 
    this.s1[j + PART_YPOS] = -0.8 + 0.1*this.randY;  
    this.s1[j + PART_ZPOS] = -0.8 + 0.1*this.randZ;
    this.s1[j + PART_WPOS] =  1.0;      // position 'w' coordinate;
    this.roundRand(); // Now choose random initial velocities too:
    this.s1[j + PART_XVEL] =  this.INIT_VEL*(0.4 + 0.2*this.randX);
    this.s1[j + PART_YVEL] =  this.INIT_VEL*(0.4 + 0.2*this.randY);
    this.s1[j + PART_ZVEL] =  this.INIT_VEL*(0.4 + 0.2*this.randZ);
      this.s1[j + PART_MASS] = 1.0;      // mass, in kg.
      this.s1[j + PART_DIAM] = this.size; // on-screen diameter, in pixels
      this.s1[j + PART_RENDMODE] = 0.0;
      this.s1[j + PART_R] = 0.2;
      this.s1[j + PART_G] = 1.0;
      this.s1[j + PART_B] = 0.4;
    this.s1[j + PART_AGE] = 30 + 100*Math.random();
    var distance = this.calculateDistance_camera(this.s1[j + PART_XPOS], this.s1[j + PART_YPOS], this.s1[j + PART_ZPOS])
      var size = this.size / distance;
      this.s1[j + PART_SIZE] = this.size;
    //----------------------------
      this.s2.set(this.s1);   // COPY contents of state-vector s1 to s2.
  }

  this.FSIZE = this.s1.BYTES_PER_ELEMENT;  // 'float' size, in bytes.
// Create a vertex buffer object (VBO) in the graphics hardware: get its ID# 
  this.vboID = gl.createBuffer();
  if (!this.vboID) {
    console.log('PartSys.init() Failed to create the VBO object in the GPU');
    return -1;
  }
  // "Bind the new buffer object (memory in the graphics system) to target"
  // In other words, specify the usage of one selected buffer object.
  // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
  // intended use of this buffer's memory; so far, we have just two choices:
  //  == "gl.ARRAY_BUFFER" meaning the buffer object holds actual values we 
  //      need for rendering (positions, colors, normals, etc), or 
  //  == "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
  //      into a list of values we need; indices such as object #s, face #s, 
  //      edge vertex #s.
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);

  // Write data from our JavaScript array to graphics systems' buffer object:
  gl.bufferData(gl.ARRAY_BUFFER, this.s1, gl.DYNAMIC_DRAW);
  // why 'DYNAMIC_DRAW'? Because we change VBO's content with bufferSubData() later

  // ---------Set up all attributes for VBO contents:
  //Get the ID# for the a_Position variable in the graphics hardware
  this.a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(this.a_PositionID < 0) {
    console.log('PartSys.init() Failed to get the storage location of a_Position');
    return -1;
  }
  // Tell GLSL to fill the 'a_Position' attribute variable for each shader with
  // values from the buffer object chosen by 'gl.bindBuffer()' command.
  // websearch yields OpenGL version: 
  //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  gl.vertexAttribPointer(this.a_PositionID, 
          4,  // # of values in this attrib (1,2,3,4) 
          gl.FLOAT, // data type (usually gl.FLOAT)
          false,    // use integer normalizing? (usually false)
          PART_MAXVAR*this.FSIZE,  // Stride: #bytes from 1st stored value to next one
          PART_XPOS * this.FSIZE); // Offset; #bytes from start of buffer to 
                    // 1st stored attrib value we will actually use.
  // Enable this assignment of the bound buffer to the a_Position variable:
  gl.enableVertexAttribArray(this.a_PositionID);

  this.a_SizeID = gl.getAttribLocation(gl.program, 'a_Size');
  if(this.a_SizeID < 0) {
    console.log('PartSys.init() Failed to get the storage location of a_Size');
    return -1;
  }
    
    gl.vertexAttribPointer(this.a_SizeID, 1, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_DIAM * this.FSIZE);

    gl.enableVertexAttribArray(this.a_SizeID);

    this.a_ColorID = gl.getAttribLocation(gl.program, 'a_Color');
    if (this.a_ColorID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Color');
    }

    gl.vertexAttribPointer(this.a_ColorID, 3, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_R * this.FSIZE);

    gl.enableVertexAttribArray(this.a_ColorID);

  // ---------Set up all uniforms we send to the GPU:
  // Get graphics system storage location of each uniform our shaders use:
  // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
  this.u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
  if(!this.u_runModeID) {
    console.log('PartSys.init() Failed to get u_runMode variable location');
    return;
  }

  this.uLoc_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMat');
  if(!this.uLoc_ModelMatrix){
    console.log('PartSys.init() Failed to get u_ModelMat variable location');
  }

  // Set the initial values of all uniforms on GPU: (runMode set by keyboard)
  gl.uniform1i(this.u_runModeID, this.runMode);
  gl.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.ModelMatrix.elements);
  gl.uniform1f(this.uLoc_size, this.size);
}

PartSys.prototype.initFireReeves = function(count, shader) {
    //==============================================================================
    // Create all state-variables-------------------------------------------------
    this.partCount = count;
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR);

    // NOTE: Float32Array objects are zero-filled by default.

    this.showSprings = false;

    // Create & init all force-causing objects------------------------------------
    var fTmp = new CForcer();       // create a force-causing object, and
    // earth gravity for all particles:
    fTmp.forceType = F_GRAV_E;      // set it to earth gravity, and
    fTmp.targFirst = 0;             // set it to affect ALL particles:
    fTmp.partCount = -1;            // (negative value means ALL particles)
    // (and IGNORE all other Cforcer members...)
    this.forceList.push(fTmp);      // append this 'gravity' force object to 
    // the forceList array of force-causing objects.
    // drag for all particles:
    fTmp = new CForcer();           // create a NEW CForcer object 
    // (WARNING! until we do this, fTmp refers to
    // the same memory locations as forceList[0]!!!) 
    fTmp.forceType = F_DRAG;        // Viscous Drag
    fTmp.Kdrag = 0.9;               // in Euler solver, scales velocity by 0.85
    fTmp.targFirst = 0;             // apply it to ALL particles:
    fTmp.partCount = -1;            // (negative value means ALL particles)
    // (and IGNORE all other Cforcer members...)
    this.forceList.push(fTmp);      // append this 'gravity' force object to 
    // the forceList array of force-causing objects.
    fTmp = new CForcer();

    fTmp.forceType = F_WIND;
    fTmp.windPosition = new Vector4([0, -1.0, 0, 1]);
    fTmp.windDirection = new Vector4([0, 1, 0, 1]);
    fTmp.windForce = 20;
    fTmp.windZoneRadius = 20.0;
    this.forceList.push(fTmp);

    this.particleSystemType = FIRE;

    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.forceList[] array of ");
    console.log("\t\t", this.forceList.length, "CForcer objects:");
    for (i = 0; i < this.forceList.length; i++) {
        console.log("CForceList[", i, "]");
        this.forceList[i].printMe();
    }

    // Create & init all constraint-causing objects-------------------------------
    var cTmp = new CLimit();      // creat constraint-causing object, and
    cTmp.hitType = HIT_BOUNCE_VEL;  // set how particles 'bounce' from its surface,
    cTmp.limitType = LIM_VOL;       // confine particles inside axis-aligned 
    // rectangular volume that
    cTmp.targFirst = 0;             // applies to ALL particles; starting at 0 
    cTmp.partCount = -1;            // through all the rest of them.
    cTmp.xMin = -0.95; cTmp.xMax = 0.95;  // box extent:  +/- 1.0 box at origin
    cTmp.yMin = -0.95; cTmp.yMax = 0.95;
    cTmp.zMin = -0.95; cTmp.zMax = 0.95;
    cTmp.Kresti = 1.0;              // bouncyness: coeff. of restitution.
    // (and IGNORE all other CLimit members...)
    this.limitList.push(cTmp);      // append this 'box' constraint object to the
    // 'limitList' array of constraint-causing objects.                                
    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.limitList[] array of ");
    console.log("\t\t", this.limitList.length, "CLimit objects.");

    this.INIT_VEL = 0.15 * 60.0;   // initial velocity in meters/sec.
    // adjust by ++Start, --Start buttons. Original value 
    // was 0.15 meters per timestep; multiply by 60 to get
    // meters per second.
    this.drag = 0.9;/*0.985;*/// units-free air-drag (scales velocity); adjust by d/D keys
    this.grav = 9.832;// gravity's acceleration(meter/sec^2); adjust by g/G keys.
    // on Earth surface, value is 9.832 meters/sec^2.
    this.resti = 1.0; // units-free 'Coefficient of Restitution' for 
    // inelastic collisions.  Sets the fraction of momentum 
    // (0.0 <= resti < 1.0) that remains after a ball 
    // 'bounces' on a wall or floor, as computed using 
    // velocity perpendicular to the surface. 
    // (Recall: momentum==mass*velocity.  If ball mass does 
    // not change, and the ball bounces off the x==0 wall,
    // its x velocity xvel will change to -xvel * resti ).

    //--------------------------init Particle System Controls:
    this.runMode = 3;// Master Control: 0=reset; 1= pause; 2=step; 3=run
    this.solvType = SOLV_BACK_MIDPT;// adjust by s/S keys.
    // SOLV_EULER (explicit, forward-time, as 
    // found in BouncyBall03.01BAD and BouncyBall04.01badMKS)
    // SOLV_OLDGOOD for special-case implicit solver, reverse-time, 
    // as found in BouncyBall03.GOOD, BouncyBall04.goodMKS)
    this.bounceType = 1;  // floor-bounce constraint type:
    // ==0 for velocity-reversal, as in all previous versions
    // ==1 for Chapter 3's collision resolution method, which
    // uses an 'impulse' to cancel any velocity boost caused
    // by falling below the floor.
    this.shader = shader;
    this.ModelMatrix = new Matrix4();
    this.particleColor = new Vector4();
    this.uLoc_ModelMatrix = false;
    this.uLoc_Color = false;
    this.u_runModeID = false;
    this.size = 100.0;


    gl.program = this.shader;
    gl.useProgram(this.shader);
    //--------------------------------Create & fill VBO with state var s1 contents:
    // INITIALIZE s1, s2:
    //  NOTE: s1,s2 are a Float32Array objects, zero-filled by default.
    // That's OK for most particle parameters, but these need non-zero defaults:

    var j = 0;  // i==particle number; j==array index for i-th particle
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR) {
        this.roundRand();       // set this.randX,randY,randZ to random location in 
        // a 3D unit sphere centered at the origin.
        //all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
        // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
        this.s1[j + PART_XPOS] = -0.8 + 0.1 * this.randX;
        this.s1[j + PART_YPOS] = -0.8 + 0.1 * this.randY;
        this.s1[j + PART_ZPOS] = -0.8 + 0.1 * this.randZ;
        this.s1[j + PART_WPOS] = 1.0;      // position 'w' coordinate;
        this.roundRand(); // Now choose random initial velocities too:
        this.s1[j + PART_XVEL] = this.INIT_VEL * (0.4 + 0.2 * this.randX);
        this.s1[j + PART_YVEL] = this.INIT_VEL * (0.4 + 0.2 * this.randY);
        this.s1[j + PART_ZVEL] = this.INIT_VEL * (0.4 + 0.2 * this.randZ);
        this.s1[j + PART_MASS] = 1.0;      // mass, in kg.
        this.s1[j + PART_DIAM] = this.size; // on-screen diameter, in pixels
        this.s1[j + PART_RENDMODE] = 0.0;
        this.s1[j + PART_AGE] = 30 + 100 * Math.random();
        this.s1[j + PART_R] = 1.0;
        this.s1[j + PART_G] = 0.5;
        this.s1[j + PART_B] = 0.1;
        var distance = this.calculateDistance_camera(this.s1[j + PART_XPOS], this.s1[j + PART_YPOS], this.s1[j + PART_ZPOS])
        var size = this.size / distance;
        this.s1[j + PART_SIZE] = size;
        //----------------------------
        this.s2.set(this.s1);   // COPY contents of state-vector s1 to s2.
    }

    this.FSIZE = this.s1.BYTES_PER_ELEMENT;  // 'float' size, in bytes.
    // Create a vertex buffer object (VBO) in the graphics hardware: get its ID# 
    this.vboID = gl.createBuffer();
    if (!this.vboID) {
        console.log('PartSys.init() Failed to create the VBO object in the GPU');
        return -1;
    }
    // "Bind the new buffer object (memory in the graphics system) to target"
    // In other words, specify the usage of one selected buffer object.
    // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
    // intended use of this buffer's memory; so far, we have just two choices:
    //  == "gl.ARRAY_BUFFER" meaning the buffer object holds actual values we 
    //      need for rendering (positions, colors, normals, etc), or 
    //  == "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
    //      into a list of values we need; indices such as object #s, face #s, 
    //      edge vertex #s.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);

    // Write data from our JavaScript array to graphics systems' buffer object:
    gl.bufferData(gl.ARRAY_BUFFER, this.s1, gl.DYNAMIC_DRAW);
    // why 'DYNAMIC_DRAW'? Because we change VBO's content with bufferSubData() later

    // ---------Set up all attributes for VBO contents:
    //Get the ID# for the a_Position variable in the graphics hardware
    this.a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
    if (this.a_PositionID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Position');
        return -1;
    }
    // Tell GLSL to fill the 'a_Position' attribute variable for each shader with
    // values from the buffer object chosen by 'gl.bindBuffer()' command.
    // websearch yields OpenGL version: 
    //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
    gl.vertexAttribPointer(this.a_PositionID,
        4,  // # of values in this attrib (1,2,3,4) 
        gl.FLOAT, // data type (usually gl.FLOAT)
        false,    // use integer normalizing? (usually false)
        PART_MAXVAR * this.FSIZE,  // Stride: #bytes from 1st stored value to next one
        PART_XPOS * this.FSIZE); // Offset; #bytes from start of buffer to 
    // 1st stored attrib value we will actually use.
    // Enable this assignment of the bound buffer to the a_Position variable:
    gl.enableVertexAttribArray(this.a_PositionID);

    this.a_SizeID = gl.getAttribLocation(gl.program, 'a_Size');
    if (this.a_SizeID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Size');
        return -1;
    }

    gl.vertexAttribPointer(this.a_SizeID, 1, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_DIAM * this.FSIZE);

    gl.enableVertexAttribArray(this.a_SizeID);


    this.a_ColorID = gl.getAttribLocation(gl.program, 'a_Color');
    if (this.a_ColorID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Color');
    }

    gl.vertexAttribPointer(this.a_ColorID, 3, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_R * this.FSIZE);

    gl.enableVertexAttribArray(this.a_ColorID);
    
    // ---------Set up all uniforms we send to the GPU:
    // Get graphics system storage location of each uniform our shaders use:
    // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
    this.u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
    if (!this.u_runModeID) {
        console.log('PartSys.init() Failed to get u_runMode variable location');
        return;
    }

    this.uLoc_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMat');
    if (!this.uLoc_ModelMatrix) {
        console.log('PartSys.init() Failed to get u_ModelMat variable location');
    }


    // Set the initial values of all uniforms on GPU: (runMode set by keyboard)
    gl.uniform1i(this.u_runModeID, this.runMode);
    gl.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.ModelMatrix.elements);
    gl.uniform1f(this.uLoc_size, this.size);
}

PartSys.prototype.initTornado = function(count, shader) { 
//==============================================================================
    this.partCount = count;
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR);

    // NOTE: Float32Array objects are zero-filled by default.

    this.showSprings = false;

    // Create & init all force-causing objects------------------------------------
    var fTmp = new CForcer();       // create a force-causing object, and
    // earth gravity for all particles:
    fTmp.forceType = F_GRAV_E;      // set it to earth gravity, and
    //fTmp.forceType = F_NONE;      // set it to earth gravity, and
    fTmp.targFirst = 0;             // set it to affect ALL particles:
    fTmp.targCount = -1;            // (negative value means ALL particles)
    // (and IGNORE all other Cforcer members...)
    this.forceList.push(fTmp);      // append this 'gravity' force object to 
    // the forceList array of force-causing objects.
    // drag for all particles:
    fTmp = new CForcer();           // create a NEW CForcer object 
    // (WARNING! until we do this, fTmp refers to
    // the same memory locations as forceList[0]!!!) 
    fTmp.forceType = F_DRAG;        // Viscous Drag
    fTmp.Kdrag = 0.9;               // in Euler solver, scales velocity by 0.85
    fTmp.targFirst = 0;             // apply it to ALL particles:
    fTmp.partCount = -1;            // (negative value means ALL particles)
    // (and IGNORE all other Cforcer members...)
    this.forceList.push(fTmp);      // append this 'gravity' force object to 
    // the forceList array of force-causing objects.
    fTmp = new CForcer();

    fTmp.forceType = F_BUBBLE;
    fTmp.targFirst = 0;             // apply it to ALL particles:
    fTmp.partCount = -1; 
    fTmp.bub_ctr = new Vector4([0.0, -1.0, 0.0, 1.0]);
    fTmp.bub_radius = 0.1;
    fTmp.bub_force =50;
    fTmp.bub_force_applicable_distance = 1000.0;
    this.forceList.push(fTmp);

    fTmp = new CForcer();

    fTmp.forceType = F_WIND;
    fTmp.targFirst = 0;             // apply it to ALL particles:
    fTmp.partCount = -1; 
    fTmp.windPosition = new Vector4([0, -1, 0, 1]);
    fTmp.windDirection = new Vector4([0, 1, 0, 1]);
    fTmp.windZoneRadius = 12;
    fTmp.windForce = 100;
    this.forceList.push(fTmp);

    fTmp = new CForcer();

    fTmp.forceType = F_BUBBLE;
    fTmp.targFirst = 0;
    fTmp.partCount = -1;
    fTmp.bub_ctr = new Vector4([0.0, -1.0, 0.0, 1.0]);
    fTmp.bub_radius = 0.3;
    fTmp.bub_force = -5;
    fTmp.bub_force_applicable_distance = 1.0;
    //this.forceList.push(fTmp);

    fTmp = new CForcer();

    fTmp.forceType = F_SPIRAL;
    fTmp.spiral_centre = new Vector3([1, -1.0, 1]);
    fTmp.sprialForce = 25;
    fTmp.spiral_distance_effect_zone = 40
    this.forceList.push(fTmp);

    this.particleSystemType = TORNADO;

    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.forceList[] array of ");
    console.log("\t\t", this.forceList.length, "CForcer objects:");
    for (i = 0; i < this.forceList.length; i++) {
        console.log("CForceList[", i, "]");
        this.forceList[i].printMe();
    }

    // Create & init all constraint-causing objects-------------------------------
    var cTmp = new CLimit();      // creat constraint-causing object, and
    cTmp.hitType = HIT_BOUNCE_VEL;  // set how particles 'bounce' from its surface,
    cTmp.limitType = LIM_VOL;       // confine particles inside axis-aligned 
    // rectangular volume that
    cTmp.targFirst = 0;             // applies to ALL particles; starting at 0 
    cTmp.partCount = -1;            // through all the rest of them.
    cTmp.xMin = -20.95; cTmp.xMax = 20.95;  // box extent:  +/- 1.0 box at origin
    cTmp.yMin = -0.95; cTmp.yMax = 400.95;
    cTmp.zMin = -20.95; cTmp.zMax = 20.95;
    cTmp.Kresti = 1.0;              // bouncyness: coeff. of restitution.
    // (and IGNORE all other CLimit members...)
    this.limitList.push(cTmp);      // append this 'box' constraint object to the

    //cTmp = new CLimit();
    //cTmp.hitType = HIT_BOUNCE_VEL;
    //cTmp.limitType = LIM_VOL_CONE;
    //cTmp.coneBoundary = 0;

    //cTmp.targFirst = 0;
    //cTmp.partCount = -1;
    //cTmp.radius = 0.3;
    //cTmp.height = 2;
    //cTmp.K_coneCenter = new Vector4([0.0, -0.5, 0.0, 1.0]);
    //cTmp.K_resti = 1.0;
    //this.limitList.push(cTmp);


    // 'limitList' array of constraint-causing objects.                                
    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.limitList[] array of ");
    console.log("\t\t", this.limitList.length, "CLimit objects.");

    this.INIT_VEL = 0.15 * 60.0;   // initial velocity in meters/sec.

    this.drag = 0.9;/*0.985;*/// units-free air-drag (scales velocity); adjust by d/D keys
    this.grav = 9.832;// gravity's acceleration(meter/sec^2); adjust by g/G keys.
    // on Earth surface, value is 9.832 meters/sec^2.
    this.resti = 1.0; // units-free 'Coefficient of Restitution' for 


    //--------------------------init Particle System Controls:
    this.runMode = 3;// Master Control: 0=reset; 1= pause; 2=step; 3=run
    this.solvType = SOLV_BACK_MIDPT;// adjust by s/S keys.

    this.bounceType = 1;  // floor-bounce constraint type:

    this.shader = shader;
    this.ModelMatrix = new Matrix4();
    this.particleColor = new Vector4();
    this.uLoc_ModelMatrix = false;
    this.uLoc_Color = false;
    this.u_runModeID = false;
    this.size = 100.0;


    gl.program = this.shader;
    gl.useProgram(this.shader);
    //--------------------------------Create & fill VBO with state var s1 contents:
    // INITIALIZE s1, s2:
    //  NOTE: s1,s2 are a Float32Array objects, zero-filled by default.
    // That's OK for most particle parameters, but these need non-zero defaults:

    var j = 0;  // i==particle number; j==array index for i-th particle
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR) {
        this.roundRand();       // set this.randX,randY,randZ to random location in 
        // a 3D unit sphere centered at the origin.
        //all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
        // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
        this.s1[j + PART_XPOS] = -5 + this.randX * 10;
        this.s1[j + PART_YPOS] = -0.8 + 0.1 * this.randY;
        this.s1[j + PART_ZPOS] = 5 + this.randZ * 10;
        this.s1[j + PART_WPOS] = 1.0;      // position 'w' coordinate;
        this.roundRand(); // Now choose random initial velocities too:
        this.s1[j + PART_XVEL] = this.INIT_VEL * (0.4 + 0.2 * this.randX) * 0;
        this.s1[j + PART_YVEL] = this.INIT_VEL * (0.4 + 0.2 * this.randY) * 0;
        this.s1[j + PART_ZVEL] = this.INIT_VEL * (0.4 + 0.2 * this.randZ) * 0;
        this.s1[j + PART_MASS] = 1.0;      // mass, in kg.
        this.s1[j + PART_DIAM] = this.size; // on-screen diameter, in pixels
        this.s1[j + PART_RENDMODE] = 0.0;
        this.s1[j + PART_AGE] = 30 + 100 * Math.random();
        this.s1[j + PART_R] = 1.0;
        this.s1[j + PART_G] = 0.5;
        this.s1[j + PART_B] = 1.0;
        var distance = this.calculateDistance_camera(this.s1[j + PART_XPOS], this.s1[j + PART_YPOS], this.s1[j + PART_ZPOS])
        var size = this.size / distance;
        this.s1[j + PART_SIZE] = size;
        //----------------------------
        this.s2.set(this.s1);   // COPY contents of state-vector s1 to s2.
    }

    this.FSIZE = this.s1.BYTES_PER_ELEMENT;  // 'float' size, in bytes.
    // Create a vertex buffer object (VBO) in the graphics hardware: get its ID# 
    this.vboID = gl.createBuffer();
    if (!this.vboID) {
        console.log('PartSys.init() Failed to create the VBO object in the GPU');
        return -1;
    }
    // "Bind the new buffer object (memory in the graphics system) to target"
    // In other words, specify the usage of one selected buffer object.
    // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
    // intended use of this buffer's memory; so far, we have just two choices:
    //  == "gl.ARRAY_BUFFER" meaning the buffer object holds actual values we 
    //      need for rendering (positions, colors, normals, etc), or 
    //  == "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
    //      into a list of values we need; indices such as object #s, face #s, 
    //      edge vertex #s.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);

    // Write data from our JavaScript array to graphics systems' buffer object:
    gl.bufferData(gl.ARRAY_BUFFER, this.s1, gl.DYNAMIC_DRAW);
    // why 'DYNAMIC_DRAW'? Because we change VBO's content with bufferSubData() later

    // ---------Set up all attributes for VBO contents:
    //Get the ID# for the a_Position variable in the graphics hardware
    this.a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
    if (this.a_PositionID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Position');
        return -1;
    }
    // Tell GLSL to fill the 'a_Position' attribute variable for each shader with
    // values from the buffer object chosen by 'gl.bindBuffer()' command.
    // websearch yields OpenGL version: 
    //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
    gl.vertexAttribPointer(this.a_PositionID,
        4,  // # of values in this attrib (1,2,3,4) 
        gl.FLOAT, // data type (usually gl.FLOAT)
        false,    // use integer normalizing? (usually false)
        PART_MAXVAR * this.FSIZE,  // Stride: #bytes from 1st stored value to next one
        PART_XPOS * this.FSIZE); // Offset; #bytes from start of buffer to 
    // 1st stored attrib value we will actually use.
    // Enable this assignment of the bound buffer to the a_Position variable:
    gl.enableVertexAttribArray(this.a_PositionID);

    this.a_SizeID = gl.getAttribLocation(gl.program, 'a_Size');
    if (this.a_SizeID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Size');
        return -1;
    }

    gl.vertexAttribPointer(this.a_SizeID, 1, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_DIAM * this.FSIZE);

    gl.enableVertexAttribArray(this.a_SizeID);


    this.a_ColorID = gl.getAttribLocation(gl.program, 'a_Color');
    if (this.a_ColorID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Color');
    }

    gl.vertexAttribPointer(this.a_ColorID, 3, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_R * this.FSIZE);

    gl.enableVertexAttribArray(this.a_ColorID);

    // ---------Set up all uniforms we send to the GPU:
    // Get graphics system storage location of each uniform our shaders use:
    // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
    this.u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
    if (!this.u_runModeID) {
        console.log('PartSys.init() Failed to get u_runMode variable location');
        return;
    }

    this.uLoc_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMat');
    if (!this.uLoc_ModelMatrix) {
        console.log('PartSys.init() Failed to get u_ModelMat variable location');
    }


    // Set the initial values of all uniforms on GPU: (runMode set by keyboard)
    gl.uniform1i(this.u_runModeID, this.runMode);
    gl.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.ModelMatrix.elements);
    gl.uniform1f(this.uLoc_size, this.size);
}

PartSys.prototype.initFlocking = function(count, shader) { 
//==============================================================================
  console.log('PartSys.initFlocking() stub not finished!');
}

PartSys.prototype.initSpringPair = function(shader) { 
    //==============================================================================
    // Create all state-variables-------------------------------------------------
    this.partCount = 2;
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR);

    // NOTE: Float32Array objects are zero-filled by default.
    this.showSprings = false;
    // Create & init all force-causing objects------------------------------------
    var fTmp = new CForcer();       // create a force-causing object, and
    // earth gravity for all particles:
    fTmp.forceType = F_GRAV_E;      // set it to earth gravity, and
    fTmp.targFirst = 0;             // set it to affect ALL particles:
    fTmp.targCount = -1;            // (negative value means ALL particles)
    // (and IGNORE all other Cforcer members...)
    //this.forceList.push(fTmp);      // append this 'gravity' force object to 
    // the forceList array of force-causing objects.
    // drag for all particles:
    fTmp = new CForcer();           // create a NEW CForcer object 
    // (WARNING! until we do this, fTmp refers to
    // the same memory locations as forceList[0]!!!) 
    fTmp.forceType = F_DRAG;        // Viscous Drag
    fTmp.Kdrag = 0.9;               // in Euler solver, scales velocity by 0.85
    fTmp.targFirst = 0;             // apply it to ALL particles:
    fTmp.partCount = -1;            // (negative value means ALL particles)
    // (and IGNORE all other Cforcer members...)
    this.forceList.push(fTmp);      // append this 'gravity' force object to 
    // the forceList array of force-causing objects.
    fTmp = new CForcer();

    fTmp.forceType = F_SPRING;
    fTmp.K_spring = 5;
    fTmp.K_springDamp = 0.1;
    fTmp.K_restLength = 5;

    this.forceList.push(fTmp);

    this.particleSystemType = SPRING_PAIR;

    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.forceList[] array of ");
    console.log("\t\t", this.forceList.length, "CForcer objects:");
    for (i = 0; i < this.forceList.length; i++) {
        console.log("CForceList[", i, "]");
        this.forceList[i].printMe();
    }

    // Create & init all constraint-causing objects-------------------------------
    var cTmp = new CLimit();      // creat constraint-causing object, and
    cTmp.hitType = HIT_BOUNCE_VEL;  // set how particles 'bounce' from its surface,
    cTmp.limitType = LIM_VOL;       // confine particles inside axis-aligned 
    // rectangular volume that
    cTmp.targFirst = 0;             // applies to ALL particles; starting at 0 
    cTmp.partCount = -1;            // through all the rest of them.
    cTmp.xMin = -0.95; cTmp.xMax = 0.95;  // box extent:  +/- 1.0 box at origin
    cTmp.yMin = -0.95; cTmp.yMax = 0.95;
    cTmp.zMin = -0.95; cTmp.zMax = 0.95;
    cTmp.Kresti = 1.0;              // bouncyness: coeff. of restitution.
    // (and IGNORE all other CLimit members...)
    this.limitList.push(cTmp);      // append this 'box' constraint object to the
    // 'limitList' array of constraint-causing objects.
    //cTmp = new CLimit();
    //cTmp.limitType = LIM_ANCHOR;
    //cTmp.anchorPoint = 0;
    //cTmp.anchorPosition = new Vector4([0, 0.45, 0, 1]);
    //this.limitList.push(cTmp);
    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.limitList[] array of ");
    console.log("\t\t", this.limitList.length, "CLimit objects.");

    this.INIT_VEL = 0.15 * 60.0;   // initial velocity in meters/sec.
    // adjust by ++Start, --Start buttons. Original value 
    // was 0.15 meters per timestep; multiply by 60 to get
    // meters per second.
    this.drag = 0.9;/*0.985;*/// units-free air-drag (scales velocity); adjust by d/D keys
    this.grav = 9.832;// gravity's acceleration(meter/sec^2); adjust by g/G keys.
    // on Earth surface, value is 9.832 meters/sec^2.
    this.resti = 1.0; // units-free 'Coefficient of Restitution' for 

    //--------------------------init Particle System Controls:
    this.runMode = 3;// Master Control: 0=reset; 1= pause; 2=step; 3=run
    this.solvType = SOLV_BACK_MIDPT;// adjust by s/S keys.
    // SOLV_EULER (explicit, forward-time, as 
    // found in BouncyBall03.01BAD and BouncyBall04.01badMKS)
    // SOLV_OLDGOOD for special-case implicit solver, reverse-time, 
    // as found in BouncyBall03.GOOD, BouncyBall04.goodMKS)
    this.bounceType = 1;  // floor-bounce constraint type:
    // ==0 for velocity-reversal, as in all previous versions
    // ==1 for Chapter 3's collision resolution method, which
    // uses an 'impulse' to cancel any velocity boost caused
    // by falling below the floor.
    this.shader = shader;
    this.ModelMatrix = new Matrix4();
    this.particleColor = new Vector4();
    this.uLoc_ModelMatrix = false;
    this.uLoc_Color = false;
    this.u_runModeID = false;
    this.size = 20.0;


    gl.program = this.shader;
    gl.useProgram(this.shader);
    //--------------------------------Create & fill VBO with state var s1 contents:
    // INITIALIZE s1, s2:
    //  NOTE: s1,s2 are a Float32Array objects, zero-filled by default.
    // That's OK for most particle parameters, but these need non-zero defaults:

    var j = 0;  // i==particle number; j==array index for i-th particle
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR) {
        this.roundRand();       // set this.randX,randY,randZ to random location in 
        // a 3D unit sphere centered at the origin.
        //all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
        // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
        this.s1[j + PART_XPOS] = -0.8 + 0.1 * this.randX;
        this.s1[j + PART_YPOS] = -0.8 + 0.1 * this.randY;
        this.s1[j + PART_ZPOS] = -0.8 + 0.1 * this.randZ;
        this.s1[j + PART_WPOS] = 1.0;      // position 'w' coordinate;
        this.roundRand(); // Now choose random initial velocities too:
        this.s1[j + PART_XVEL] = this.INIT_VEL * (0.4 + 0.2 * this.randX) * 0.0;
        this.s1[j + PART_YVEL] = this.INIT_VEL * (0.4 + 0.2 * this.randY) * 0.0;
        this.s1[j + PART_ZVEL] = this.INIT_VEL * (0.4 + 0.2 * this.randZ) * 0.0;
        this.s1[j + PART_MASS] = 1.0;      // mass, in kg.
        this.s1[j + PART_DIAM] = this.size; // on-screen diameter, in pixels
        this.s1[j + PART_RENDMODE] = 0.0;
        this.s1[j + PART_AGE] = 30 + 100 * Math.random();
        this.s1[j + PART_R] = 1.0;
        this.s1[j + PART_G] = 0.5;
        this.s1[j + PART_B] = 0.1;
        var distance = this.calculateDistance_camera(this.s1[j + PART_XPOS], this.s1[j + PART_YPOS], this.s1[j + PART_ZPOS])
        var size = this.size / distance;
        this.s1[j + PART_SIZE] = size;
        //----------------------------
        this.s2.set(this.s1);   // COPY contents of state-vector s1 to s2.
    }

    this.FSIZE = this.s1.BYTES_PER_ELEMENT;  // 'float' size, in bytes.
    // Create a vertex buffer object (VBO) in the graphics hardware: get its ID# 
    this.vboID = gl.createBuffer();
    if (!this.vboID) {
        console.log('PartSys.init() Failed to create the VBO object in the GPU');
        return -1;
    }
    // "Bind the new buffer object (memory in the graphics system) to target"
    // In other words, specify the usage of one selected buffer object.
    // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
    // intended use of this buffer's memory; so far, we have just two choices:
    //  == "gl.ARRAY_BUFFER" meaning the buffer object holds actual values we 
    //      need for rendering (positions, colors, normals, etc), or 
    //  == "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
    //      into a list of values we need; indices such as object #s, face #s, 
    //      edge vertex #s.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);

    // Write data from our JavaScript array to graphics systems' buffer object:
    gl.bufferData(gl.ARRAY_BUFFER, this.s1, gl.DYNAMIC_DRAW);
    // why 'DYNAMIC_DRAW'? Because we change VBO's content with bufferSubData() later

    // ---------Set up all attributes for VBO contents:
    //Get the ID# for the a_Position variable in the graphics hardware
    this.a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
    if (this.a_PositionID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Position');
        return -1;
    }
    // Tell GLSL to fill the 'a_Position' attribute variable for each shader with
    // values from the buffer object chosen by 'gl.bindBuffer()' command.
    // websearch yields OpenGL version: 
    //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
    gl.vertexAttribPointer(this.a_PositionID,
        4,  // # of values in this attrib (1,2,3,4) 
        gl.FLOAT, // data type (usually gl.FLOAT)
        false,    // use integer normalizing? (usually false)
        PART_MAXVAR * this.FSIZE,  // Stride: #bytes from 1st stored value to next one
        PART_XPOS * this.FSIZE); // Offset; #bytes from start of buffer to 
    // 1st stored attrib value we will actually use.
    // Enable this assignment of the bound buffer to the a_Position variable:
    gl.enableVertexAttribArray(this.a_PositionID);

    this.a_SizeID = gl.getAttribLocation(gl.program, 'a_Size');
    if (this.a_SizeID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Size');
        return -1;
    }

    gl.vertexAttribPointer(this.a_SizeID, 1, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_DIAM * this.FSIZE);

    gl.enableVertexAttribArray(this.a_SizeID);


    this.a_ColorID = gl.getAttribLocation(gl.program, 'a_Color');
    if (this.a_ColorID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Color');
    }

    gl.vertexAttribPointer(this.a_ColorID, 3, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_R * this.FSIZE);

    gl.enableVertexAttribArray(this.a_ColorID);

    // ---------Set up all uniforms we send to the GPU:
    // Get graphics system storage location of each uniform our shaders use:
    // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
    this.u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
    if (!this.u_runModeID) {
        console.log('PartSys.init() Failed to get u_runMode variable location');
        return;
    }

    this.uLoc_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMat');
    if (!this.uLoc_ModelMatrix) {
        console.log('PartSys.init() Failed to get u_ModelMat variable location');
    }


    // Set the initial values of all uniforms on GPU: (runMode set by keyboard)
    gl.uniform1i(this.u_runModeID, this.runMode);
    gl.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.ModelMatrix.elements);
    gl.uniform1f(this.uLoc_size, this.size);
}

PartSys.prototype.initSpringRope = function(count) { 
//==============================================================================
  console.log('PartSys.initSpringRope() stub not finished!');
}
PartSys.prototype.initSpringCloth = function(xSiz,ySiz) {
//==============================================================================
  console.log('PartSys.initSpringCloth() stub not finished!');
}
PartSys.prototype.initSpringSolid = function(shader) {
//==============================================================================
    //==============================================================================
    // Create all state-variables-------------------------------------------------


    this.partCount = 4;
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR);

    // NOTE: Float32Array objects are zero-filled by default.
    this.showSprings = true;

    this.restL = tet_restLength;
    this.dampCoeff = tet_dampCoeff;
    this.springConst = tet_springConst;
    // Create & init all force-causing objects------------------------------------
    var fTmp = new CForcer();       // create a force-causing object, and
    // earth gravity for all particles:
    fTmp.forceType = F_GRAV_E;      // set it to earth gravity, and
    fTmp.targFirst = 0;             // set it to affect ALL particles:
    fTmp.targCount = -1;            // (negative value means ALL particles)
    // (and IGNORE all other Cforcer members...)
    this.forceList.push(fTmp);      // append this 'gravity' force object to 
    // the forceList array of force-causing objects.
    // drag for all particles:
    fTmp = new CForcer();           // create a NEW CForcer object 
    // (WARNING! until we do this, fTmp refers to
    // the same memory locations as forceList[0]!!!) 
    fTmp.forceType = F_DRAG;        // Viscous Drag
    fTmp.Kdrag = 0.9;               // in Euler solver, scales velocity by 0.85
    fTmp.targFirst = 0;             // apply it to ALL particles:
    fTmp.partCount = -1;            // (negative value means ALL particles)
    // (and IGNORE all other Cforcer members...)
    this.forceList.push(fTmp);      // append this 'gravity' force object to 
    // the forceList array of force-causing objects.
    fTmp = new CForcer();

    fTmp.forceType = F_SPRING;
    fTmp.K_spring = this.springConst;
    fTmp.K_springDamp = this.dampCoeff;
    fTmp.K_restLength = this.restL;
    fTmp.e1 = 0;
    fTmp.e2 = 1;

    this.forceList.push(fTmp);

    fTmp = new CForcer();

    fTmp.forceType = F_SPRING;
    fTmp.K_spring = this.springConst;
    fTmp.K_springDamp = this.dampCoeff;
    fTmp.K_restLength = this.restL;
    fTmp.e1 = 1;
    fTmp.e2 = 2;

    this.forceList.push(fTmp);

    fTmp = new CForcer();

    fTmp.forceType = F_SPRING;
    fTmp.K_spring = this.springConst;
    fTmp.K_springDamp = this.dampCoeff;
    fTmp.K_restLength = this.restL;
    fTmp.e1 = 2;
    fTmp.e2 = 3;

    this.forceList.push(fTmp);

    fTmp = new CForcer();

    fTmp.forceType = F_SPRING;
    fTmp.K_spring = this.springConst;
    fTmp.K_springDamp = this.dampCoeff;
    fTmp.K_restLength = this.restL;
    fTmp.e1 = 0;
    fTmp.e2 = 2;

    this.forceList.push(fTmp);

    fTmp = new CForcer();

    fTmp.forceType = F_SPRING;
    fTmp.K_spring = this.springConst;
    fTmp.K_springDamp = this.dampCoeff;
    fTmp.K_restLength = this.restL;
    fTmp.e1 = 0;
    fTmp.e2 = 3;

    this.forceList.push(fTmp);

    fTmp = new CForcer();

    fTmp.forceType = F_SPRING;
    fTmp.K_spring = this.springConst;
    fTmp.K_springDamp = this.dampCoeff;
    fTmp.K_restLength = this.restL;
    fTmp.e1 = 1;
    fTmp.e2 = 3;

    this.forceList.push(fTmp);

    this.particleSystemType = SPRING_SOLID;

    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.forceList[] array of ");
    console.log("\t\t", this.forceList.length, "CForcer objects:");
    for (i = 0; i < this.forceList.length; i++) {
        console.log("CForceList[", i, "]");
        this.forceList[i].printMe();
    }

    // Create & init all constraint-causing objects-------------------------------
    var cTmp = new CLimit();      // creat constraint-causing object, and
    cTmp.hitType = HIT_BOUNCE_VEL;  // set how particles 'bounce' from its surface,
    cTmp.limitType = LIM_VOL;       // confine particles inside axis-aligned 
    // rectangular volume that
    cTmp.targFirst = 0;             // applies to ALL particles; starting at 0 
    cTmp.partCount = -1;            // through all the rest of them.
    cTmp.xMin = -0.95; cTmp.xMax = 0.95;  // box extent:  +/- 1.0 box at origin
    cTmp.yMin = -0.95; cTmp.yMax = 0.95;
    cTmp.zMin = -0.95; cTmp.zMax = 0.95;
    cTmp.Kresti = 1.0;              // bouncyness: coeff. of restitution.
    // (and IGNORE all other CLimit members...)
    this.limitList.push(cTmp);      // append this 'box' constraint object to the
    // 'limitList' array of constraint-causing objects.

    //cTmp = new CLimit();
    //cTmp.limitType = LIM_ANCHOR;
    //cTmp.anchorPoint = 0;
    //cTmp.anchorPosition = new Vector4([0, 0.45, 0, 1]);
    //this.limitList.push(cTmp);

    //cTmp = new CLimit();
    //cTmp.limitType = LIM_ANCHOR;
    //cTmp.anchorPoint = 1;
    //cTmp.anchorPosition = new Vector4([0.2, 0.45, 0, 1]);
    //this.limitList.push(cTmp);

    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.limitList[] array of ");
    console.log("\t\t", this.limitList.length, "CLimit objects.");

    this.INIT_VEL = 0.15 * 60.0;   // initial velocity in meters/sec.
    // adjust by ++Start, --Start buttons. Original value 
    // was 0.15 meters per timestep; multiply by 60 to get
    // meters per second.
    this.drag = 0.9;/*0.985;*/// units-free air-drag (scales velocity); adjust by d/D keys
    this.grav = 9.832;// gravity's acceleration(meter/sec^2); adjust by g/G keys.
    // on Earth surface, value is 9.832 meters/sec^2.
    this.resti = 1.0; // units-free 'Coefficient of Restitution' for 

    //--------------------------init Particle System Controls:
    this.runMode = 3;// Master Control: 0=reset; 1= pause; 2=step; 3=run
    this.solvType = tet_solver;// adjust by s/S keys.
    // SOLV_EULER (explicit, forward-time, as 
    // found in BouncyBall03.01BAD and BouncyBall04.01badMKS)
    // SOLV_OLDGOOD for special-case implicit solver, reverse-time, 
    // as found in BouncyBall03.GOOD, BouncyBall04.goodMKS)
    this.bounceType = 1;  // floor-bounce constraint type:
    // ==0 for velocity-reversal, as in all previous versions
    // ==1 for Chapter 3's collision resolution method, which
    // uses an 'impulse' to cancel any velocity boost caused
    // by falling below the floor.
    this.shader = shader;
    this.ModelMatrix = new Matrix4();
    this.particleColor = new Vector4();
    this.uLoc_ModelMatrix = false;
    this.uLoc_Color = false;
    this.u_runModeID = false;
    this.size = 20.0;


    gl.program = this.shader;
    gl.useProgram(this.shader);
    //--------------------------------Create & fill VBO with state var s1 contents:
    // INITIALIZE s1, s2:
    //  NOTE: s1,s2 are a Float32Array objects, zero-filled by default.
    // That's OK for most particle parameters, but these need non-zero defaults:

    var j = 0;  // i==particle number; j==array index for i-th particle
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR) {
        this.roundRand();       // set this.randX,randY,randZ to random location in 
        // a 3D unit sphere centered at the origin.
        //all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
        // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
        this.s1[j + PART_XPOS] = -0.8 + (0.1 * i);
        this.s1[j + PART_YPOS] = -0.8 + 0.2 * this.randY;
        this.s1[j + PART_ZPOS] = -0.8 + 0.1 * this.randZ;
        this.s1[j + PART_WPOS] = 1.0;      // position 'w' coordinate;
        this.roundRand(); // Now choose random initial velocities too:
        this.s1[j + PART_XVEL] = 0.0;
        this.s1[j + PART_YVEL] = 0.0;
        this.s1[j + PART_ZVEL] = 0.0;
        this.s1[j + PART_MASS] = 1.0;      // mass, in kg.
        this.s1[j + PART_DIAM] = this.size; // on-screen diameter, in pixels
        this.s1[j + PART_RENDMODE] = 0.0;
        this.s1[j + PART_AGE] = 30 + 100 * Math.random();
        this.s1[j + PART_R] = 1.0;
        this.s1[j + PART_G] = 0.5;
        this.s1[j + PART_B] = 0.1;
        var distance = this.calculateDistance_camera(this.s1[j + PART_XPOS], this.s1[j + PART_YPOS], this.s1[j + PART_ZPOS])
        var size = this.size / distance;
        this.s1[j + PART_SIZE] = size;
        //----------------------------
        this.s2.set(this.s1);   // COPY contents of state-vector s1 to s2.
    }

    this.FSIZE = this.s1.BYTES_PER_ELEMENT;  // 'float' size, in bytes.
    // Create a vertex buffer object (VBO) in the graphics hardware: get its ID# 
    this.vboID = gl.createBuffer();
    if (!this.vboID) {
        console.log('PartSys.init() Failed to create the VBO object in the GPU');
        return -1;
    }
    // "Bind the new buffer object (memory in the graphics system) to target"
    // In other words, specify the usage of one selected buffer object.
    // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
    // intended use of this buffer's memory; so far, we have just two choices:
    //  == "gl.ARRAY_BUFFER" meaning the buffer object holds actual values we 
    //      need for rendering (positions, colors, normals, etc), or 
    //  == "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
    //      into a list of values we need; indices such as object #s, face #s, 
    //      edge vertex #s.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);

    // Write data from our JavaScript array to graphics systems' buffer object:
    gl.bufferData(gl.ARRAY_BUFFER, this.s1, gl.DYNAMIC_DRAW);
    // why 'DYNAMIC_DRAW'? Because we change VBO's content with bufferSubData() later

    // ---------Set up all attributes for VBO contents:
    //Get the ID# for the a_Position variable in the graphics hardware
    this.a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
    if (this.a_PositionID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Position');
        return -1;
    }
    // Tell GLSL to fill the 'a_Position' attribute variable for each shader with
    // values from the buffer object chosen by 'gl.bindBuffer()' command.
    // websearch yields OpenGL version: 
    //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
    gl.vertexAttribPointer(this.a_PositionID,
        4,  // # of values in this attrib (1,2,3,4) 
        gl.FLOAT, // data type (usually gl.FLOAT)
        false,    // use integer normalizing? (usually false)
        PART_MAXVAR * this.FSIZE,  // Stride: #bytes from 1st stored value to next one
        PART_XPOS * this.FSIZE); // Offset; #bytes from start of buffer to 
    // 1st stored attrib value we will actually use.
    // Enable this assignment of the bound buffer to the a_Position variable:
    gl.enableVertexAttribArray(this.a_PositionID);

    this.a_SizeID = gl.getAttribLocation(gl.program, 'a_Size');
    if (this.a_SizeID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Size');
        return -1;
    }

    gl.vertexAttribPointer(this.a_SizeID, 1, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_DIAM * this.FSIZE);

    gl.enableVertexAttribArray(this.a_SizeID);


    this.a_ColorID = gl.getAttribLocation(gl.program, 'a_Color');
    if (this.a_ColorID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Color');
    }

    gl.vertexAttribPointer(this.a_ColorID, 3, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_R * this.FSIZE);

    gl.enableVertexAttribArray(this.a_ColorID);

    // ---------Set up all uniforms we send to the GPU:
    // Get graphics system storage location of each uniform our shaders use:
    // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
    this.u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
    if (!this.u_runModeID) {
        console.log('PartSys.init() Failed to get u_runMode variable location');
        return;
    }

    this.uLoc_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMat');
    if (!this.uLoc_ModelMatrix) {
        console.log('PartSys.init() Failed to get u_ModelMat variable location');
    }


    // Set the initial values of all uniforms on GPU: (runMode set by keyboard)
    gl.uniform1i(this.u_runModeID, this.runMode);
    gl.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.ModelMatrix.elements);
    gl.uniform1f(this.uLoc_size, this.size);
}

PartSys.prototype.initOrbits = function() {
//==============================================================================
  console.log('PartSys.initOrbits() stub not finished!');
}


PartSys.prototype.reload = function () {
    switch (this.particleSystemType) {
        case BOUNCY_BALL:
            this.solvType = bouncySolver;
            break;
        case FIRE:
            this.partCount = firePariclesCount;
            this.solvType = fireSolver;
            break;
        case TORNADO:
            this.partCount = tornadoParticlesCount;
            this.solvType = tornadoSolver;
            break;
        case SPRING_SOLID:
            console.log("HERE");
            this.restL = tet_restLength;
            this.springConst = tet_springConst;
            this.dampCoeff = tet_dampCoeff;
            break;
    }
}

PartSys.prototype.applyForces = function(s, fList) { 
//==============================================================================
// Clear the force-accumulator vector for each particle in state-vector 's', 
// then apply each force described in the collection of force-applying objects 
// found in 'fSet'.
// (this function will simplify our too-complicated 'draw()' function)

  // To begin, CLEAR force-accumulators for all particles in state variable 's'
  var j = 0;  // i==particle number; j==array index for i-th particle
  for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
    s[j + PART_X_FTOT] = 0.0;
    s[j + PART_Y_FTOT] = 0.0;
    s[j + PART_Z_FTOT] = 0.0;
  }
  // then find and accumulate all forces applied to particles in state s:
  for(var k = 0; k < fList.length; k++) {  // for every CForcer in fList array,
//    console.log("fList[k].forceType:", fList[k].forceType);
    if(fList[k].forceType <=0) {     //.................Invalid force? SKIP IT!
                        // if forceType is F_NONE, or if forceType was 
      continue;         // negated to (temporarily) disable the CForcer,
      }               
    // ..................................Set up loop for all targeted particles
    // HOW THIS WORKS:
    // Most, but not all CForcer objects apply a force to many particles, and
    // the CForcer members 'targFirst' and 'targCount' tell us which ones:
    // *IF* targCount == 0, the CForcer applies ONLY to particle numbers e1,e2
    //          (e.g. the e1 particle begins at s[fList[k].e1 * PART_MAXVAR])
    // *IF* targCount < 0, apply the CForcer to 'targFirst' and all the rest
    //      of the particles that follow it in the state variable s.
    // *IF* targCount > 0, apply the CForcer to exactly 'targCount' particles,
    //      starting with particle number 'targFirst'
    // Begin by presuming targCount < 0;
    var m = fList[k].targFirst;   // first affected particle # in our state 's'
    var mmax = this.partCount;    // Total number of particles in 's'
                                  // (last particle number we access is mmax-1)
    if(fList[k].targCount==0){    // ! Apply force to e1,e2 particles only!
      m=mmax=0;   // don't let loop run; apply force to e1,e2 particles only.
      }
    else if(fList[k].targCount > 0) {   // ?did CForcer say HOW MANY particles?
      // YES! force applies to 'targCount' particles starting with particle # m:
      var tmp = fList[k].targCount;
      if(tmp < mmax) mmax = tmp;    // (but MAKE SURE mmax doesn't get larger)
      else console.log("\n\n!!PartSys.applyForces() index error!!\n\n");
      }
      //console.log("m:",m,"mmax:",mmax);
      // m and mmax are now correctly initialized; use them!  
    //......................................Apply force specified by forceType 
    switch(fList[k].forceType) {    // what kind of force should we apply?
      case F_MOUSE:     // Spring-like connection to mouse cursor
        console.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                  fList[k].forceType, "NOT YET IMPLEMENTED!!");
        break;
      case F_GRAV_E:    // Earth-gravity pulls 'downwards' as defined by downDir
        var j = m*PART_MAXVAR;  // state var array index for particle # m
        for(; m<mmax; m++, j+=PART_MAXVAR) { // for every part# from m to mmax-1,
                      // force from gravity == mass * gravConst * downDirection
          s[j + PART_X_FTOT] += s[j + PART_MASS] * fList[k].gravConst * 
                                                   fList[k].downDir.elements[0];
          s[j + PART_Y_FTOT] += s[j + PART_MASS] * fList[k].gravConst * 
                                                   fList[k].downDir.elements[1];
          s[j + PART_Z_FTOT] += s[j + PART_MASS] * fList[k].gravConst * 
                                                   fList[k].downDir.elements[2];
          }
        break;
      case F_GRAV_P:    // planetary gravity between particle # e1 and e2.
        console.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                  fList[k].forceType, "NOT YET IMPLEMENTED!!");
       break;
        case F_WIND:      // Blowing-wind-like force-field; fcn of 3D position
            var j = m * PART_MAXVAR;
            for (; m < mmax; m++ , j += PART_MAXVAR) {
                var particle_Pos = new Vector3([s[j + PART_XPOS], s[j + PART_YPOS], s[j + PART_ZPOS]]);

                var dist = this.calculateDistance_points(particle_Pos, fList[k].windPosition);

                var falloff = 1 - (dist / fList[k].windZoneRadius);

                if (dist <= fList[k].windZoneRadius) {
                    s[j + PART_X_FTOT] += s[j + PART_MASS] * fList[k].windForce * fList[k].windDirection.elements[0] * falloff;
                    s[j + PART_Y_FTOT] += s[j + PART_MASS] * fList[k].windForce * fList[k].windDirection.elements[1] * falloff;
                    s[j + PART_Z_FTOT] += s[j + PART_MASS] * fList[k].windForce * fList[k].windDirection.elements[2] * falloff;
                }
            }
            break;
      case F_BUBBLE:    // Constant inward force (bub_force)to a 3D centerpoint 
                        // bub_ctr if particle is > bub_radius away from it.
            var j = m * PART_MAXVAR;
            for (; m < mmax; m++ , j += PART_MAXVAR) {
                var x_direction = fList[k].bub_ctr.elements[0] - s[j + PART_XPOS]
                var y_direction = fList[k].bub_ctr.elements[1] - s[j + PART_YPOS]
                var z_direction = fList[k].bub_ctr.elements[2] - s[j + PART_ZPOS]

                var force_direction = new Vector3([x_direction, y_direction, z_direction]);
                var particlePos = new Vector3([s[j + PART_XPOS], s[j + PART_YPOS], s[j + PART_ZPOS]]);
                //normalizing the direction
                force_direction.normalize();

                var distance = this.calculateDistance_points(fList[k].bub_ctr, particlePos);

                if (distance >= fList[k].bub_radius && distance <= fList[k].bub_force_applicable_distance) {
                    //inverse distance falloff
                    var inv_distance = 1 / distance;
                    var falloff = 1 - (distance / fList[k].bub_force_applicable_distance);

                    s[j + PART_X_FTOT] += force_direction.elements[0] * fList[k].bub_force * falloff;
                    s[j + PART_Y_FTOT] += force_direction.elements[1] * fList[k].bub_force * Math.pow(inv_distance, 2);
                    s[j + PART_Z_FTOT] += force_direction.elements[2] * fList[k].bub_force * falloff;
                }
            }
       break;
      case F_DRAG:      // viscous drag: force = -K_drag * velocity.
        var j = m*PART_MAXVAR;  // state var array index for particle # m
        for(; m<mmax; m++, j+=PART_MAXVAR) { // for every particle# from m to mmax-1,
                      // force from gravity == mass * gravConst * downDirection
          s[j + PART_X_FTOT] -= fList[k].K_drag * s[j + PART_XVEL]; 
          s[j + PART_Y_FTOT] -= fList[k].K_drag * s[j + PART_YVEL];
          s[j + PART_Z_FTOT] -= fList[k].K_drag * s[j + PART_ZVEL];
          }
        break;
        case F_SPRING:

            var e1Position = new Vector3([s[PART_XPOS + PART_MAXVAR * fList[k].e1], s[PART_YPOS + PART_MAXVAR * fList[k].e1], s[PART_ZPOS + PART_MAXVAR * fList[k].e1]]);
            var e2Position = new Vector3([s[PART_XPOS + PART_MAXVAR * fList[k].e2], s[PART_YPOS + PART_MAXVAR * fList[k].e2], s[PART_ZPOS + PART_MAXVAR * fList[k].e2]]);

            var springStretch = this.calculateDistance_points(e1Position, e2Position);

            var pointsVectorDist = e1Position.subtract(e2Position);


            var stretchMidPt = new Vector3([(e1Position.elements[0] + e2Position.elements[0]) * 0.5,
                (e1Position.elements[1] + e2Position.elements[1]) * 0.5,
                (e1Position.elements[2] + e2Position.elements[2]) * 0.5])


            var forceDirectione1 = new Vector3();
            var forceDirectione2 = new Vector3();

            if (springStretch > fList[k].K_restLength) {
                forceDirectione1 = stretchMidPt.subtract(e1Position).normalize();
                forceDirectione2 = stretchMidPt.subtract(e2Position).normalize();
            } else {
                forceDirectione1 = e1Position.subtract(stretchMidPt).normalize();
                forceDirectione2 = e2Position.subtract(stretchMidPt).normalize();
            }

            var inv_length = 1 / springStretch; 

            // Spring force for particle e1
            var particleSpringForceXE1 = -fList[k].K_spring * (springStretch - fList[k].K_restLength) * (e1Position.elements[0] - e2Position.elements[0] * inv_length); /*(fList[k].K_restLength - Math.abs(s[PART_XPOS + PART_MAXVAR * fList[k].e1] - s[PART_XPOS + PART_MAXVAR * fList[k].e2]));*/
            var particleSpringForceYE1 = -fList[k].K_spring * (springStretch - fList[k].K_restLength) * (e1Position.elements[1] - e2Position.elements[1] * inv_length);/*(fList[k].K_restLength - Math.abs(s[PART_YPOS + PART_MAXVAR * fList[k].e1] - s[PART_YPOS + PART_MAXVAR * fList[k].e2]));*/
            var particleSpringForceZE1 = -fList[k].K_spring * (springStretch - fList[k].K_restLength) * (e1Position.elements[2] - e2Position.elements[2] * inv_length);/*(fList[k].K_restLength - Math.abs(s[PART_ZPOS + PART_MAXVAR * fList[k].e1] - s[PART_ZPOS + PART_MAXVAR * fList[k].e2]));*/

            // Spring force for particle e2
            var particleSpringForceXE2 = -fList[k].K_spring * (springStretch - fList[k].K_restLength) * (e2Position.elements[0] - e1Position.elements[0] * inv_length); /*(fList[k].K_restLength - Math.abs(s[PART_XPOS + PART_MAXVAR * fList[k].e2] - s[PART_XPOS + PART_MAXVAR * fList[k].e1]));*/
            var particleSpringForceYE2 = -fList[k].K_spring * (springStretch - fList[k].K_restLength) * (e2Position.elements[1] - e1Position.elements[1] * inv_length); /*(fList[k].K_restLength - Math.abs(s[PART_YPOS + PART_MAXVAR * fList[k].e2] - s[PART_YPOS + PART_MAXVAR * fList[k].e1]));*/
            var particleSpringForceZE2 = -fList[k].K_spring * (springStretch - fList[k].K_restLength) * (e2Position.elements[2] - e1Position.elements[2] * inv_length); /*(fList[k].K_restLength - Math.abs(s[PART_ZPOS + PART_MAXVAR * fList[k].e2] - s[PART_ZPOS + PART_MAXVAR * fList[k].e1]));*/


            


            //// Spring Force on Particle 1
            var particle1SpringForceX = -fList[k].K_spring * (s[PART_XPOS + PART_MAXVAR * fList[k].e1] - (s[PART_XPOS + PART_MAXVAR * fList[k].e2] + fList[k].K_restLength));
            var particle1SpringForceY = -fList[k].K_spring * (s[PART_YPOS + PART_MAXVAR * fList[k].e1] - (s[PART_YPOS + PART_MAXVAR * fList[k].e2] + fList[k].K_restLength));
            var particle1SpringForceZ = -fList[k].K_spring * (s[PART_ZPOS + PART_MAXVAR * fList[k].e1] - (s[PART_ZPOS + PART_MAXVAR * fList[k].e2] + fList[k].K_restLength));

            // Spring Force on Particle 2
            var particle2SpringForceX = -fList[k].K_spring * ((s[PART_XPOS + PART_MAXVAR * fList[k].e2] + fList[k].K_restLength) - (s[PART_XPOS + PART_MAXVAR * fList[k].e1]));
            var particle2SpringForceY = -fList[k].K_spring * ((s[PART_YPOS + PART_MAXVAR * fList[k].e2] + fList[k].K_restLength) - (s[PART_YPOS + PART_MAXVAR * fList[k].e1]));
            var particle2SpringForceZ = -fList[k].K_spring * ((s[PART_ZPOS + PART_MAXVAR * fList[k].e2] + fList[k].K_restLength) - (s[PART_ZPOS + PART_MAXVAR * fList[k].e1]));

            // Particle 1 Damping force
            var DampingForceXe1 = fList[k].K_springDamp * s[PART_XVEL + PART_MAXVAR * fList[k].e1];
            var DampingForceYe1 = fList[k].K_springDamp * s[PART_YVEL + PART_MAXVAR * fList[k].e1];
            var DampingForceZe1 = fList[k].K_springDamp * s[PART_ZVEL + PART_MAXVAR * fList[k].e1];

            // Particle 2 Damping force
            var DampingForceXe2 = fList[k].K_springDamp * s[fList[k].e2 * PART_MAXVAR + PART_XVEL];
            var DampingForceYe2 = fList[k].K_springDamp * s[fList[k].e2 * PART_MAXVAR + PART_YVEL];
            var DampingForceZe2 = fList[k].K_springDamp * s[fList[k].e2 * PART_MAXVAR + PART_ZVEL];

            // Particle 1 Net force
            s[PART_X_FTOT + PART_MAXVAR * fList[k].e1] += (particleSpringForceXE1 - DampingForceXe1 /*- particleSpringForceXE2 + DampingForceXe2*/) * s[PART_MASS + PART_MAXVAR * fList[k].e1];
            s[PART_Y_FTOT + PART_MAXVAR * fList[k].e1] += (particleSpringForceYE1 - DampingForceYe1 /*- particleSpringForceYE2 + DampingForceYe2*/) * s[PART_MASS + PART_MAXVAR * fList[k].e1];
            s[PART_Z_FTOT + PART_MAXVAR * fList[k].e1] += (particleSpringForceZE1 - DampingForceZe1 /*- particleSpringForceZE2 + DampingForceZe2*/) * s[PART_MASS + PART_MAXVAR * fList[k].e1];

            // Particle 2 Net force
            s[fList[k].e2 * PART_MAXVAR + PART_X_FTOT] += (particleSpringForceXE2 - DampingForceXe2 - particleSpringForceXE1 + DampingForceXe1) * s[PART_MASS + PART_MAXVAR * fList[k].e2];
            s[fList[k].e2 * PART_MAXVAR + PART_Y_FTOT] += (particleSpringForceYE2 - DampingForceYe2 - particleSpringForceYE1 + DampingForceYe1) * s[PART_MASS + PART_MAXVAR * fList[k].e2];
            s[fList[k].e2 * PART_MAXVAR + PART_Z_FTOT] += (particleSpringForceZE2 - DampingForceZe2 - particleSpringForceZE1 + DampingForceZe1) * s[PART_MASS + PART_MAXVAR * fList[k].e2];

            //s[PART_X_FTOT + PART_MAXVAR * fList[k].e1] += (particle1SpringForceX - DampingForceXe1 - particle2SpringForceX + DampingForceXe2) * s[PART_MASS + PART_MAXVAR * fList[k].e1];
            //s[PART_Y_FTOT + PART_MAXVAR * fList[k].e1] += (particle1SpringForceY - DampingForceYe1 - particle2SpringForceY + DampingForceYe2) * s[PART_MASS + PART_MAXVAR * fList[k].e1];
            //s[PART_Z_FTOT + PART_MAXVAR * fList[k].e1] += (particle1SpringForceZ - DampingForceZe1 - particle2SpringForceZ + DampingForceZe2) * s[PART_MASS + PART_MAXVAR * fList[k].e1];

            //// Particle 2 Net force
            //s[fList[k].e2 * PART_MAXVAR + PART_X_FTOT] += (particle2SpringForceX - DampingForceXe2 - particle1SpringForceX + DampingForceXe1) * s[PART_MASS + PART_MAXVAR * fList[k].e2];
            //s[fList[k].e2 * PART_MAXVAR + PART_Y_FTOT] += (particle2SpringForceY - DampingForceYe2 - particle1SpringForceY + DampingForceYe1) * s[PART_MASS + PART_MAXVAR * fList[k].e2];
            //s[fList[k].e2 * PART_MAXVAR + PART_Z_FTOT] += (particle2SpringForceZ - DampingForceZe2 - particle1SpringForceZ + DampingForceZe1) * s[PART_MASS + PART_MAXVAR * fList[k].e2];
            break;

      case F_SPRINGSET:
        console.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                  fList[k].forceType, "NOT YET IMPLEMENTED!!");
        break;
      case F_CHARGE:
        console.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                  fList[k].forceType, "NOT YET IMPLEMENTED!!");
            break;
        case F_SPIRAL:
            var j = m * PART_MAXVAR;
            for (; m < mmax; m++ , j += PART_MAXVAR) {
                var particle_posn = new Vector3([s[j + PART_XPOS], s[j + PART_YPOS], s[j + PART_ZPOS]])
                var down_vec = new Vector3([s[j + PART_XPOS], - s[j + PART_YPOS] - 1, s[j + PART_ZPOS]]);
                var direction_vec = fList[k].spiral_centre.subtract(particle_posn);
                var forceDirection = down_vec.cross(direction_vec);
                var distance = this.calculateDistance_points(particle_posn, fList[k].spiral_centre);
                var inv_dist = Math.pow(1 / distance, 2);

                var falloff = 1 - (distance / fList[k].spiral_distance_effect_zone);

                //console.log(forceDirection);
                s[j + PART_X_FTOT] += forceDirection.elements[0] * fList[k].sprialForce * inv_dist * falloff;
                s[j + PART_Y_FTOT] += forceDirection.elements[1] * 0 * fList[k].sprialForce * falloff;
                s[j + PART_Z_FTOT] += forceDirection.elements[2] * fList[k].sprialForce * inv_dist * falloff;
            }
            break;
      default:
        console.log("!!!ApplyForces() fList[",k,"] invalid forceType:", fList[k].forceType);
        break;
    } // switch(fList[k].forceType)
  } // for(k=0...)
}

PartSys.prototype.dotFinder = function(dest, src) {
//==============================================================================
// fill the already-existing 'dest' variable (a float32array) with the 
// time-derivative of given state 'src'.  

  var invMass;  // inverse mass
  var j = 0;  // i==particle number; j==array index for i-th particle
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR) {
        dest[j + PART_XPOS] = src[j + PART_XVEL];   // position derivative = velocity
        dest[j + PART_YPOS] = src[j + PART_YVEL];
        dest[j + PART_ZPOS] = src[j + PART_ZVEL];
        dest[j + PART_WPOS] = 0.0                  // presume 'w' fixed at 1.0
    // Use 'src' current force-accumulator's values (set by PartSys.applyForces())
    // to find acceleration.  As multiply is FAR faster than divide, do this:
    invMass = 1.0 / src[j + PART_MASS];   // F=ma, so a = F/m, or a = F(1/m);
        dest[j + PART_XVEL] = src[j + PART_X_FTOT] * invMass; 
        dest[j + PART_YVEL] = src[j + PART_Y_FTOT] * invMass;
        dest[j + PART_ZVEL] = src[j + PART_Z_FTOT] * invMass;
        dest[j + PART_X_FTOT] = 0.0;  // we don't know how force changes with time;
        dest[j + PART_Y_FTOT] = 0.0;  // presume it stays constant during timestep.
        dest[j + PART_Z_FTOT] = 0.0;
        dest[j + PART_R] = 0.0;       // presume color doesn't change with time.
        dest[j + PART_G] = 0.0;
        dest[j + PART_B] = 0.0;
        dest[j + PART_MASS] = 0.0;    // presume mass doesn't change with time.
        dest[j + PART_DIAM] = 0.0;    // presume these don't change either...   
        dest[j + PART_RENDMODE] = 0.0;
        dest[j + PART_AGE] = 0.0;
        dest[j + PART_SIZE] = 0.0;
    }
}

PartSys.prototype.render = function(s) {
//==============================================================================
// Draw the contents of state-vector 's' on-screen. To do this:
//  a) transfer its contents to the already-existing VBO in the GPU using the
//      WebGL call 'gl.bufferSubData()', then 
//  b) set all the 'uniform' values needed by our shaders,
//  c) draw VBO contents using gl.drawArray().

  // CHANGE our VBO's contents:
  gl.bufferSubData( 
          gl.ARRAY_BUFFER,  // specify the 'binding target': either
                  //    gl.ARRAY_BUFFER (VBO holding sets of vertex attribs)
                  // or gl.ELEMENT_ARRAY_BUFFER (VBO holding vertex-index values)
          0,      // offset: # of bytes to skip at the start of the VBO before 
                    // we begin data replacement.
          this.s1); // Float32Array data source.

    gl.uniform1i(this.u_runModeID, this.runMode);	// run/step/pause the particle system 
    gl.uniform4fv(this.uLoc_Color, this.particleColor.elements);
  // Draw our VBO's new contents:
  gl.drawArrays(gl.POINTS,          // mode: WebGL drawing primitive to use 
                0,                  // index: start at this vertex in the VBO;
                this.partCount);    // draw this many vertices.
}

PartSys.prototype.switchToMe = function () {
    gl.useProgram(this.shader);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);

    gl.vertexAttribPointer(this.a_PositionID, 4, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_XPOS * this.FSIZE);
    gl.enableVertexAttribArray(this.a_PositionID);

    gl.vertexAttribPointer(this.a_SizeID, 1, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_DIAM * this.FSIZE);
    gl.enableVertexAttribArray(this.a_SizeID);

    gl.vertexAttribPointer(this.a_ColorID, 3, gl.FLOAT, false, PART_MAXVAR * this.FSIZE, PART_R * this.FSIZE);
    gl.enableVertexAttribArray(this.a_ColorID);

}

PartSys.prototype.isReady = function() {
  var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shader)  {
    console.log(this.constructor.name + 
                '.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboID) {
      console.log(this.constructor.name + 
              '.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
    return isOK;
}

PartSys.prototype.render3D = function(s) {

  this.ModelMatrix.setPerspective(30.0, vpAspect, 0.25, 1000.0);

  this.ModelMatrix.lookAt(x_Coordinate, y_Coordinate, z_Coordinate,
                              x_lookAt,     y_lookAt,     z_lookAt,
                                     0,            0,            1,);
  
    for (var i = 0, j = 0; i < this.partCount; i+=1, j += PART_MAXVAR) {
      var distance = this.calculateDistance_camera(this.s2[j + PART_XPOS], this.s2[j + PART_YPOS], this.s2[j + PART_ZPOS])
      var size = this.s2[j + PART_SIZE] * 20 / distance;   
      this.s2[j + PART_DIAM] = size;
   } 


  this.ModelMatrix.translate(0, 0, 1);
  this.ModelMatrix.rotate(90, 1, 0, 0);

  pushMatrix(this.ModelMatrix);

    this.ModelMatrix = popMatrix();


    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.s1);
    gl.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.ModelMatrix.elements);
    gl.uniform1i(this.u_runModeID, this.runMode);
    gl.drawArrays(gl.POINTS, 0, this.partCount);
}

 PartSys.prototype.solver = function() {
//==============================================================================
// Find next state s2 from current state s1 (and perhaps some related states
// such as s1dot, sM, sMdot, etc.) by the numerical integration method chosen
// by PartSys.solvType.

     switch (this.solvType) {

         case SOLV_EULER://--------------------------------------------------------
             // EXPLICIT or 'forward time' solver; Euler Method: s2 = s1 + h*s1dot
             for (var n = 0; n < this.s1.length; n++) { // for all elements in s1,s2,s1dot;
                 this.s2[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001);
             }
             break;
         case SOLV_OLDGOOD://-------------------------------------------------------------------
             // IMPLICIT or 'reverse time' solver, as found in bouncyBall04.goodMKS;
             // This category of solver is often better, more stable, but lossy.
             // -- apply acceleration due to gravity to current velocity:
             //				  s2[PART_YVEL] -= (accel. due to gravity)*(g_timestep in seconds) 
             //                  -= (9.832 meters/sec^2) * (g_timeStep/1000.0);
             var j = 0;  // i==particle number; j==array index for i-th particle
             for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR) {
                 this.s2[j + PART_YVEL] -= this.grav * (g_timeStep * 0.001);
                 // -- apply drag: attenuate current velocity:
                 this.s2[j + PART_XVEL] *= this.drag;
                 this.s2[j + PART_YVEL] *= this.drag;
                 this.s2[j + PART_ZVEL] *= this.drag;
                 // -- move our particle using current velocity:
                 // CAREFUL! must convert g_timeStep from milliseconds to seconds!
                 this.s2[j + PART_XPOS] += this.s2[j + PART_XVEL] * (g_timeStep * 0.001);
                 this.s2[j + PART_YPOS] += this.s2[j + PART_YVEL] * (g_timeStep * 0.001);
                 this.s2[j + PART_ZPOS] += this.s2[j + PART_ZVEL] * (g_timeStep * 0.001);
             }
             // What's the result of this rearrangement?
             //	IT WORKS BEAUTIFULLY! much more stable much more often...
             break;
         case SOLV_MIDPOINT:         // Midpoint Method (see lecture notes)

             var sM = new Float32Array(this.partCount * PART_MAXVAR);
             var sMdot = new Float32Array(this.partCount * PART_MAXVAR);

             for (var n = 0; n < this.s1.length; n++) {
                 sM[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001 * 0.5);
             }

             this.dotFinder(sMdot, sM);

             for (var n = 0; n < this.s1.length; n++) {
                 this.s2[n] = this.s1[n] + sMdot[n] * (g_timeStep * 0.001)
             }

             break;
         case SOLV_ADAMS_BASH:       // Adams-Bashforth Explicit Integrator
             console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
             break;
         case SOLV_RUNGEKUTTA:       // Arbitrary degree, set by 'solvDegree'
             console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
             break;
         case SOLV_BACK_EULER:       // 'Backwind' or Implicit Euler
             var sErr = new Float32Array(this.partCount * PART_MAXVAR);
             var s2Intermediate = new Float32Array(this.partCount * PART_MAXVAR);
             var s2IntermediateDot = new Float32Array(this.partCount * PART_MAXVAR);

             //First Calculate s2(0)
             for (var n = 0; n < this.s1.length; n++) {
                 s2Intermediate[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001)
             }

             //Find the s2(0) dot
             this.dotFinder(s2IntermediateDot, s2Intermediate);

             //Calculate the Error
             for (var n = 0; n < this.s1.length; n++) {
                 sErr[n] = (s2IntermediateDot[n] - this.s1dot[n]) * g_timeStep * 0.001;
             }

             //Find the next timestep
             for (var n = 0; n < this.s1.length; n++) {
                 this.s2[n] = s2Intermediate[n] + sErr[n] * g_timeStep * 0.001;
             }

             break;
         case SOLV_BACK_MIDPT:      // 'Backwind' or Implicit Midpoint
             var sErr = new Float32Array(this.partCount * PART_MAXVAR);
             var s2Intermediate = new Float32Array(this.partCount * PART_MAXVAR);
             var s2IntermediateDot = new Float32Array(this.partCount * PART_MAXVAR);
             var sM = new Float32Array(this.partCount * PART_MAXVAR);
             var sMdot = new Float32Array(this.partCount * PART_MAXVAR);
             var s3 = new Float32Array(this.partCount * PART_MAXVAR);

             //First Calculate s2(0)
             for (var n = 0; n < this.s1.length; n++) {
                 s2Intermediate[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001)
             }

             //Find the s2(0) dot
             this.dotFinder(s2IntermediateDot, s2Intermediate);

             //Half-step with s2(0) derivative
             for (var n = 0; n < s2Intermediate.length; n++) {
                 sM[n] = s2Intermediate[n] - s2IntermediateDot[n] * g_timeStep * 0.001 * 0.5;
             }

             //Fint the sMdot 
             this.dotFinder(sMdot, sM);

             for (var n = 0; n < s2Intermediate.length; n++) {
                 s3[n] = s2Intermediate[n] - sMdot[n] * g_timeStep * 0.001;
             }

             //Find the error
             for (var n = 0; n < s2Intermediate.length; n++) {
                 sErr[n] = s3[n] - this.s1[n];
             }

             //Set the next TimeStep
             for (var n = 0; n < s2Intermediate.length; n++) {
                 this.s2[n] = s2Intermediate[n] - (sErr[n] * 0.5);
             }

            break;
        case SOLV_BACK_ADBASH:      // 'Backwind' or Implicit Adams-Bashforth
                console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        case SOLV_VERLET:          // Verlet semi-implicit integrator;
                console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        case SOLV_VEL_VERLET:      // 'Velocity-Verlet'semi-implicit integrator
                console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        case SOLV_LEAPFROG:        // 'Leapfrog' integrator
                console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        default:
			    console.log('?!?! unknown solver: this.solvType==' + this.solvType);
		break;
	}
	return;
}

PartSys.prototype.doConstraints = function(sNow, sNext, cList) {
//==============================================================================
// apply all Climit constraint-causing objects in the cList array to the 
// particles/movements between current state sNow and future state sNext.

// 'bounce' our ball off floor & walls at +/- 0.9,+/-0.9, +/-0.9
// where this.bounceType selects constraint type:
// ==0 for simple velocity-reversal, as in all previous versions
// ==1 for textbook's collision resolution method, which uses an 'impulse' 
//          to cancel any velocity boost caused by falling below the floor.
//    

  for(var k = 0; k < cList.length; k++) {  // for every CLimit in cList array,
//    console.log("cList[k].limitType:", cList[k].limitType);
    if(cList[k].limitType <=0) {     //.................Invalid limit? SKIP IT!
                        // if limitType is LIM_NONE or if limitType was
      continue;         // negated to (temporarily) disable the CLimit object,
      }                 // skip this k-th object in the cList[] array.
    // ..................................Set up loop for all targeted particles
    // HOW THIS WORKS:
    // Most, but not all CLimit objects apply constraint to many particles, and
    // the CLimit members 'targFirst' and 'targCount' tell us which ones:
    // *IF* targCount == 0, the CLimit applies ONLY to particle numbers e1,e2
    //          (e.g. the e1 particle begins at sNow[fList[k].e1 * PART_MAXVAR])
    // *IF* targCount < 0, apply the CLimit to 'targFirst' and all the rest
    //      of the particles that follow it in the state variables sNow, sNext.
    // *IF* targCount > 0, apply the CForcer to exactly 'targCount' particles,
    //      starting with particle number 'targFirst'
    // Begin by presuming targCount < 0;
    var m = cList[k].targFirst;    // first targed particle # in the state vars
    var mmax = this.partCount;    // total number of particles in the state vars
                                  // (last particle number we access is mmax-1)
    if(cList[k].targCount==0){    // ! Apply CLimit to e1,e2 particles only!
      m=mmax=0;   // don't let loop run; apply CLimit to e1,e2 particles only.
      }
    else if(cList[k].targCount > 0) {   // ?did CLimit say HOW MANY particles?
      // YES! limit applies to 'targCount' particles starting with particle # m:
      var tmp = cList[k].targCount;
      if(tmp < mmax) mmax = tmp; // (but MAKE SURE mmax doesn't get larger)
      else console.log("\n\n!!PartSys.doConstraints() index error!!\n\n");
      }
      //console.log("m:",m,"mmax:",mmax);
      // m and mmax are now correctly initialized; use them!  
    //......................................Apply limit specified by limitType 
    switch(cList[k].limitType) {    // what kind of limit should we apply?
        case LIM_VOL:     // The axis-aligned rectangular volume specified by
                        // cList[k].xMin,xMax,yMin,yMax,zMin,zMax keeps
                        // particles INSIDE if xMin<xMax, yMin<yMax, zMin<zMax
                        //      and OUTSIDE if xMin>xMax, yMin>yMax, zMin>xMax.
        var j = m*PART_MAXVAR;  // state var array index for particle # m

            for (; m < mmax; m++ , j += PART_MAXVAR) { 
                if (sNext[j + PART_XPOS] < cList[k].xMin) {
                    sNext[j + PART_XPOS] = cList[k].xMin;
                    sNext[j + PART_XVEL] = sNow[j + PART_XVEL];  
                    sNext[j + PART_XVEL] *= this.drag;	            
                    if (sNext[j + PART_XVEL] < 0.0)
                        sNext[j + PART_XVEL] = -cList[k].K_resti * sNext[j + PART_XVEL]; // need sign change--bounce!
                    else
                        sNext[j + PART_XVEL] = cList[k].K_resti * sNext[j + PART_XVEL]; // sign changed-- don't need another.
                }
                else if (sNext[j + PART_XPOS] > cList[k].xMax) { // && this.s2[j + PART_XVEL] > 0.0) {	
                    // collision!
                    sNext[j + PART_XPOS] = cList[k].xMax; // 1) resolve contact: put particle at wall.
                    sNext[j + PART_XVEL] = sNow[j + PART_XVEL];	// 2a) undo velocity change:
                    sNext[j + PART_XVEL] *= this.drag;			        // 2b) apply drag:
                // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
                // ATTENTION! VERY SUBTLE PROBLEM HERE! 
                // need a velocity-sign test here that ensures the 'bounce' step will 
                    // always send the ball outwards, away from its wall or floor collision. 
                    if (sNext[j + PART_XVEL] > 0.0)
                        sNext[j + PART_XVEL] = -cList[k].K_resti * sNext[j + PART_XVEL]; // need sign change--bounce!
                    else
                        sNext[j + PART_XVEL] = cList[k].K_resti * sNext[j + PART_XVEL];	// sign changed-- don't need another.
            }
                //--------  floor (-Y) wall  --------------------------------------------  		
                if (sNext[j + PART_YPOS] < cList[k].yMin) { // && this.s2[j + PART_YVEL] < 0.0) {		
                    // collision! floor...  
                    sNext[j + PART_YPOS] = cList[k].yMin;// 1) resolve contact: put particle at wall.
                    sNext[j + PART_YVEL] = sNow[j + PART_YVEL];	// 2a) undo velocity change:
                    sNext[j + PART_YVEL] *= this.drag;		          // 2b) apply drag:	

                    if (sNext[j + PART_YVEL] < 0.0)
                        sNext[j + PART_YVEL] = -cList[k].K_resti * sNext[j + PART_YVEL]; // need sign change--bounce!
                    else
                        sNext[j + PART_YVEL] = cList[k].K_resti * sNext[j + PART_YVEL];	// sign changed-- don't need another.
            }
                //--------  ceiling (+Y) wall  ------------------------------------------
                else if (sNext[j + PART_YPOS] > cList[k].yMax) { // && sNext[j + PART_YVEL] > 0.0) {
                // collision! ceiling...
                    sNext[j + PART_YPOS] = cList[k].yMax;// 1) resolve contact: put particle at wall.
                sNext[j + PART_YVEL] = this.s1[j + PART_YVEL];	// 2a) undo velocity change:
                sNext[j + PART_YVEL] *= this.drag;			        // 2b) apply drag:
                // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
                // ATTENTION! VERY SUBTLE PROBLEM HERE!
                // need a velocity-sign test here that ensures the 'bounce' step will 
                // always send the ball outwards, away from its wall or floor collision.
                if (sNext[j + PART_YVEL] > 0.0)
                    sNext[j + PART_YVEL] = -cList[k].K_resti * sNext[j + PART_YVEL]; // need sign change--bounce!
                else
                    sNext[j + PART_YVEL] = cList[k].K_resti * sNext[j + PART_YVEL];	// sign changed-- don't need another.
            }
                //--------  near (-Z) wall  --------------------------------------------- 
                if (sNext[j + PART_ZPOS] < cList[k].zMin) { // && sNext[j + PART_ZVEL] < 0.0 ) {
                // collision! 
                    sNext[j + PART_ZPOS] = cList[k].zMin;// 1) resolve contact: put particle at wall.
                    sNext[j + PART_ZVEL] = sNow[j + PART_ZVEL];  // 2a) undo velocity change:
                    sNext[j + PART_ZVEL] *= this.drag;			        // 2b) apply drag:
                // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
                // ATTENTION! VERY SUBTLE PROBLEM HERE! ------------------------------
                // need a velocity-sign test here that ensures the 'bounce' step will 
                // always send the ball outwards, away from its wall or floor collision. 
                if (sNext[j + PART_ZVEL] < 0.0)
                    sNext[j + PART_ZVEL] = -cList[k].K_resti * sNext[j + PART_ZVEL]; // need sign change--bounce!
                else
                    sNext[j + PART_ZVEL] = cList[k].K_resti * sNext[j + PART_ZVEL];	// sign changed-- don't need another.
            }
            //--------  far (+Z) wall  ---------------------------------------------- 
                else if (sNext[j + PART_ZPOS] > cList[k].zMax) { // && sNext[j + PART_ZVEL] > 0.0) {	
                // collision! 
                    sNext[j + PART_ZPOS] = cList[k].zMax; // 1) resolve contact: put particle at wall.
                    sNext[j + PART_ZVEL] = sNow[j + PART_ZVEL];  // 2a) undo velocity change:
                    sNext[j + PART_ZVEL] *= this.drag;			        // 2b) apply drag:
		
                if (sNext[j + PART_ZVEL] > 0.0)
                    sNext[j + PART_ZVEL] = -cList[k].K_resti * sNext[j + PART_ZVEL]; // need sign change--bounce!
                else
                    sNext[j + PART_ZVEL] = cList[k].K_resti * sNext[j + PART_ZVEL];	// sign changed-- don't need another.
            } // end of (+Z) wall constraint
          }
            break;
        case LIM_WALL:    // 2-sided wall: rectangular, axis-aligned, flat/2D,
                        // zero thickness, any desired size & position

            break;
        case LIM_VOL_CONE:

            var j = m * PART_MAXVAR;
            for (; m < mmax; m++ , j += PART_MAXVAR) {
                var curr_velocityDir = new Vector3([sNow[j + PART_XVEL], sNow[j + PART_YVEL], sNow[j + PART_ZVEL]]);
                var next_particleCoords = new Vector3([sNext[j + PART_XPOS], sNext[j + PART_YPOS], sNext[j + PART_ZPOS]]);
                var dist_2D = Math.pow(Math.pow((cList[k].K_coneCenter.elements[0] - next_particleCoords.elements[0]), 2) +
                    Math.pow((cList[k].K_coneCenter.elements[2] - next_particleCoords.elements[2]), 2), 0.5);

                var downVector = new Vector3([0.0, -1.0, 0.0]);
                var curr_mag = curr_velocityDir.magnitude();
                curr_velocityDir = curr_velocityDir.normalize();
                var cross_dir = curr_velocityDir.cross(downVector);

                //if (cList[k].coneBoundary == 0) {
                //    if (dist_2D > cList[k].radius) {
                //        sNext[j + PART_XPOS] = cList[k].radius * Math.cos(sNext[j + PART_XPOS] * Math.random() * 10);
                //        sNext[j + PART_YPOS] = sNext[j + PART_YPOS];
                //        sNext[j + PART_ZPOS] = cList[k].radius * Math.sin(sNext[j + PART_XPOS] * Math.random() * 10);
                //        sNext[j + PART_XVEL] = cross_dir.elements[0] * curr_mag;
                //        sNext[j + PART_YVEL] = cross_dir.elements[1] * curr_mag;
                //        sNext[j + PART_ZVEL] = cross_dir.elements[2] * curr_mag;
                //    }
                //} else {
                    if (dist_2D < cList[k].radius) {
                        sNext[j + PART_XPOS] = sNow[j + PART_XPOS];
                        sNext[j + PART_YPOS] = sNext[j + PART_YPOS];
                        sNext[j + PART_ZPOS] = sNow[j + PART_ZPOS];
                        sNext[j + PART_XVEL] = cross_dir.elements[0] * curr_mag;
                        //sNext[j + PART_YVEL] = cross_dir.elements[1] * curr_mag;
                        sNext[j + PART_ZVEL] = cross_dir.elements[2] * curr_mag;
                    //}
                }
            }
            break;
        case LIM_DISC:    // 2-sided ellipsoidal wall, axis-aligned, flat/2D,
                        // zero thickness, any desired size & position
            break;
        case LIM_BOX:
            break;
        case LIM_MAT_WALL:

            break;
        case LIM_MAT_DISC:
            break;
        case LIM_MAT_BALL:
            break;
        case LIM_MAT_DISC:
            break;
        case LIM_ANCHOR:
            var anchorPoint = cList[k].anchorPoint * PART_MAXVAR;
            sNext[anchorPoint + PART_XPOS] = cList[k].anchorPosition.elements[0];
            sNext[anchorPoint + PART_YPOS] = cList[k].anchorPosition.elements[1];
            sNext[anchorPoint + PART_ZPOS] = cList[k].anchorPosition.elements[2];
            break;
        case LIM_SLOT:
            break;
        case LIM_ROD:
            break;
        case LIM_ROPE:
            break;
        case LIM_RADIUS:
            break;
        case LIM_PULLEY:
            break;
        default:
            console.log("!!!doConstraints() cList[", k, "] invalid limitType:", cList[k].limitType);
            break;
    } // switch(cList[k].limitType) ebd
  } // for(k=0...) end
}

PartSys.prototype.particleBehaviour = function () {

    switch (this.particleSystemType) {
        case BOUNCY_BALL:
            console.log("Currently No Special Behaviour");
            break;
        case FIRE:
              // i==particle number; j==array index for i-th particle
            for (var i = 0, j = 0; i < this.partCount; i += 1, j += PART_MAXVAR) {
                var inv_age = 1 / this.s2[j + PART_AGE];
                this.s2[j + PART_AGE] -= 1;     // decrement lifetime.
                this.s2[j + PART_SIZE] *= this.s2[j + PART_AGE] * inv_age;
                this.s2[j + PART_MASS] = this.clamp(0.01, this.s2[j + PART_MASS], this.s2[j + PART_MASS] * 0.5);  

                this.s2[j + PART_R] *= this.clamp(0, 1, this.s2[j + PART_AGE] * inv_age);
                this.s2[j + PART_G] *= this.clamp(0, 1, this.s2[j + PART_AGE] * inv_age);
                this.s2[j + PART_B] *= this.clamp(0, 1, this.s2[j + PART_AGE] * inv_age);

                if (this.s2[j + PART_AGE] <= 0) { // End of life: RESET this particle!
                    this.roundRand();       // set this.randX,randY,randZ to random location in 
                    // a 3D unit sphere centered at the origin.
                    // all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
                    // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
                    this.s2[j + PART_XPOS] = -0.0 + 0.2 * this.randX;
                    this.s2[j + PART_YPOS] = -0.6 + 0.2 * this.randY;
                    this.s2[j + PART_ZPOS] = -0.0 + 0.2 * this.randZ;
                    this.s2[j + PART_WPOS] = 1.0;      // position 'w' coordinate;
                    this.roundRand(); // Now choose random initial velocities too:
                    this.s2[j + PART_XVEL] = this.INIT_VEL * (0.0 + 0.2 * this.randX) * 0.5;
                    this.s2[j + PART_YVEL] = this.INIT_VEL * (0.5 + 0.2 * this.randY) * 0.6;
                    this.s2[j + PART_ZVEL] = this.INIT_VEL * (0.0 + 0.2 * this.randZ) * 0.5;
                    this.s2[j + PART_MASS] = 0.2;      // mass, in kg.
                    this.s2[j + PART_DIAM] = this.size; // on-screen diameter, in pixels
                    this.s2[j + PART_RENDMODE] = 0.0;
                    this.s2[j + PART_R] = 0.9 + Math.random() * 0.1;
                    this.s2[j + PART_G] = 0.2 + Math.random() * 0.3;
                    this.s2[j + PART_B] = 0.1;
                    this.s2[j + PART_AGE] = 30 + 100 * Math.random();
                    this.s2[j + PART_SIZE] = 10;
                } // if age <=0
            } // for loop thru all particles
            break;
        case SPRING_PAIR:
            console.log("No Special Behviour Programmed");
            break;
        case TORNADO:
            //for (var i = 0, j = 0; i < this.partCount; i += 1, j += PART_MAXVAR) {
            //    var inv_age = 1 / this.s2[j + PART_AGE];
            //    this.s2[j + PART_AGE] -= 1;     // decrement lifetime.
            //    this.s2[j + PART_SIZE] *= this.s2[j + PART_AGE] * inv_age;
            //    this.s2[j + PART_MASS] = this.clamp(0.01, this.s2[j + PART_MASS], this.s2[j + PART_MASS] * 0.5);

            //    this.s2[j + PART_R] *= this.clamp(0, 1, this.s2[j + PART_AGE] * inv_age);
            //    this.s2[j + PART_G] *= this.clamp(0, 1, this.s2[j + PART_AGE] * inv_age);
            //    this.s2[j + PART_B] *= this.clamp(0, 1, this.s2[j + PART_AGE] * inv_age);

            //    if (this.s2[j + PART_AGE] <= 0) { // End of life: RESET this particle!
            //        this.roundRand();       // set this.randX,randY,randZ to random location in 
            //        // a 3D unit sphere centered at the origin.
            //        // all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
            //        // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
            //        this.s2[j + PART_XPOS] = -0.8 + 0.2 * this.randX;
            //        this.s2[j + PART_YPOS] = -0.6 + 0.2 * this.randY;
            //        this.s2[j + PART_ZPOS] = -0.7 + 0.2 * this.randZ;
            //        this.s2[j + PART_WPOS] = 1.0;      // position 'w' coordinate;
            //        this.roundRand(); // Now choose random initial velocities too:
            //        this.s2[j + PART_XVEL] = this.INIT_VEL * (0.0 + 0.2 * this.randX) * 0.5;
            //        this.s2[j + PART_YVEL] = this.INIT_VEL * (0.5 + 0.2 * this.randY) * 0.6;
            //        this.s2[j + PART_ZVEL] = this.INIT_VEL * (0.0 + 0.2 * this.randZ) * 0.5;
            //        this.s2[j + PART_MASS] = 1.0;      // mass, in kg.
            //        this.s2[j + PART_DIAM] = this.size; // on-screen diameter, in pixels
            //        this.s2[j + PART_RENDMODE] = 0.0;
            //        this.s2[j + PART_R] = 0.9 + Math.random() * 0.1;
            //        this.s2[j + PART_G] = 0.2 + Math.random() * 0.3;
            //        this.s2[j + PART_B] = 0.1;
            //        this.s2[j + PART_AGE] = 30 + 100 * Math.random() * 100;
            //        this.s2[j + PART_SIZE] = 10;
            //    } // if age <=0
            //}
            break;
        case SPRING_SOLID:
            break;
        default:
            console.log("Invalid Input");

    }

}

PartSys.prototype.swap = function() {
//==============================================================================
// Choose the method you want:

// We can EXCHANGE, actually SWAP the contents of s1 and s2, like this:  
// but !! YOU PROBABLY DON'T WANT TO DO THIS !!
/*
  var tmp = this.s1;
  this.s1 = this.s2;
  this.s2 = tmp;
*/

// Or we can REPLACE s1 contents with s2 contents, like this:
// NOTE: if we try:  this.s1 = this.s2; we DISCARD s1's memory!!

  this.s1.set(this.s2);     // set values of s1 array to match s2 array.
// (WHY? so that your solver can make intermittent changes to particle
// values without any unwanted 'old' values re-appearing. For example,
// At timestep 36, particle 11 had 'red' color in s1, and your solver changes
// its color to blue in s2, but makes no further changes.  If swap() EXCHANGES 
// s1 and s2 contents, on timestep 37 the particle is blue, but on timestep 38
// the particle is red again!  If we REPLACE s1 contents with s2 contents, the
// particle is red at time step 36, but blue for 37, 38, 39 and all further
// timesteps until we change it again.
// REPLACE s1 contents with s2 contents:
}

PartSys.prototype.clamp = function (min, max, number) {
    return Math.min(Math.max(number, min), max);
};

PartSys.prototype.printPosition = function(s) {
  var j = 0;  // i==particle number; j==array index for i-th particle
  for(var i = 0; i < 2; i += 1, j+= PART_MAXVAR) {
    console.log("Point" + i);
    console.log("X Position = " + s[j + PART_XPOS]);
    console.log("Y Position = " + s[j + PART_YPOS]);
    console.log("Z Position = " + s[j + PART_ZPOS]);
    console.log("----------------------------------------");
    console.log("X Velocity = " + s[j + PART_XVEL]);
    console.log("Y Velocity = " + s[j + PART_YVEL]);
    console.log("Z Velocity = " + s[j + PART_ZVEL]);
      console.log("----------------------------------------");
      console.log("Size = " + s[j + PART_SIZE]);
      console.log("PART_R" + s[j + PART_R]);
      console.log("PART_G" + s[j + PART_G]);
      console.log("PART_B" + s[j + PART_B]);
  } 
}