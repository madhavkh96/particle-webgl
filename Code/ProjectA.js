var gl;   // webGL Rendering Context.  Created in main(), used everywhere.
var g_canvas; // our HTML-5 canvas object that uses 'gl' for drawing.
var g_digits = 5; // # of digits printed on-screen (e.g. x.toFixed(g_digits);

// For keyboard, mouse-click-and-drag: -----------------
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

//--Animation---------------
var g_isClear = 1;		  // 0 or 1 to enable or disable screen-clearing in the
    									// draw() function. 'C' or 'c' key toggles in myKeyPress().
var g_last = Date.now();				//  Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.
var g_stepCount = 0;						// Advances by 1 for each timestep, modulo 1000, 
																// (0,1,2,3,...997,998,999,0,1,2,..) to identify 
																// WHEN the ball bounces.  RESET by 'r' or 'R' key.

var g_timeStep = 1000.0/60.0;			// current timestep in milliseconds (init to 1/60th sec) 
var g_timeStepMin = g_timeStep;   //holds min,max timestep values since last keypress.
var g_timeStepMax = g_timeStep;

var g_rotAngle = 0.0;        
var updateRotAngle = false;
var updateRotAngleSign = 1;
var g_angleRate = 10.0;   

var g_ModelMatrix = new Matrix4();

var current_rotation = 0;
var x_Coordinate = -8;
var y_Coordinate = 0;
var z_Coordinate = 0.5;
var x_lookAt = 0;
var y_lookAt = 0;
var z_lookAt = z_Coordinate;

var lookAtVector = new Vector3([x_lookAt, y_lookAt, z_lookAt]);
var eyePosVector = new Vector3([x_Coordinate, y_Coordinate, z_Coordinate]);


var all_Particle_systems = [];
var current_part_sys = 0;

groundPlane = new groundVBO();
springs = new drawSprings();
//========================================================

//Bouncy balls
particleSys3D = new particle3D();
all_Particle_systems.push(particleSys3D);
BuildCube(0.95, 0.95, 0.95, 0, 0, 0, true);
bouncyCube = new drawCube();
//========================================================

//Fire
particleSysFire = new particleFire();
all_Particle_systems.push(particleSysFire);
BuildCube(0.95, 0.95, 0.95, 0, 0, 0, true);
fireCube = new drawCube();
//========================================================

//particleSysSpringPair = new particleSpringPair();
//all_Particle_systems.push(particleSysSpringPair);
//========================================================

//Tornado
particleSysTornado = new particleTornado();
all_Particle_systems.push(particleSysTornado);
BuildCube(20.95, 20.95, 40.95, 0, 0, 0, true);
tornadoCube = new drawCube();
//========================================================

//Springy Tetrahedron
tetrahedronSpringSys = new particleSpringSolid();
all_Particle_systems.push(tetrahedronSpringSys);
BuildCube(1, 1, 1, 0, 0, 0, true);
tet_Cube = new drawCube();
//========================================================

//Boids
boidsSystem = new particleBoids();
all_Particle_systems.push(boidsSystem);
BuildCube(5.95, 5.95, 5.95, 0, 0, 0, true);
boidsCube = new drawCube();
//--------------------------------------------------------
BuildCube(1.0, 1.0, 1.0, 0, 0, 2.5, false);
aggressorCube = new drawCube();
//========================================================

//Bouncyball variables:
bouncyBallParticlesCount = 2;
bouncySolver = SOLV_BACK_MIDPT;
//========================================================

//Fire variables:
firePariclesCount = 200;
fireSolver = SOLV_BACK_MIDPT;
//========================================================

//Tornado variables:
tornadoParticlesCount = 15000;
tornadoSolver = SOLV_BACK_MIDPT;
//========================================================

//tetrahedron variables: 
tet_restLength = 0.2;
tet_springConst = 60;
tet_dampCoeff = 3.5;
tet_solver = SOLV_BACK_MIDPT;
//========================================================


//Boids variables
boids_particles = 200;
boids_aggressorForce = -50;
boids_aggressorAffectDistance = 1.0;
boids_ControlBox = false;
boids_solver = SOLV_BACK_MIDPT;
//-------------------------------------------------------
//private vars:
boids_aggressorX = 0;
boids_aggressorY = 2.5;
boids_aggressorZ = 0;


//Vertices;
V1 = new Vector3();
V2 = new Vector3();
V3 = new Vector3();
V4 = new Vector3();
V5 = new Vector3();
V6 = new Vector3();
V7 = new Vector3();
V8 = new Vector3();

function main() {
//==============================================================================
  // Retrieve <canvas> element where we will draw using WebGL
  g_canvas = document.getElementById('webgl');
	gl = g_canvas.getContext("webgl", { preserveDrawingBuffer: true});
	// NOTE:{preserveDrawingBuffer: true} disables HTML-5default screen-clearing, 
	// so that our draw() function will over-write previous on-screen results 
	// until we call the gl.clear(COLOR_BUFFER_BIT); function. )
  if (!gl) {
    console.log('main() Failed to get the rendering context for WebGL');
    return;
  }  
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("mousedown", myMouseDown); 
    window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
    window.addEventListener("dblclick", myMouseDblClick);
    window.onload = windowLoad();
    gl.clearColor(0.25, 0.25, 0.25, 1);	// RGBA color for clearing WebGL framebuffer
    gl.clear(gl.COLOR_BUFFER_BIT);		  // clear it once to set that color as bkgnd.
    gl.enable(gl.DEPTH_TEST);


  // Initialize Particle systems:
  
    groundPlane.init();

    particleSys3D.init(2);
    bouncyCube.init();

    particleSysFire.init(200);
    fireCube.init();

    particleSysTornado.init(20000);
    tornadoCube.init();

    tetrahedronSpringSys.init();
    springs.init(tetrahedronSpringSys.g_partA);
    tet_Cube.init();


    boidsSystem.init(200);
    boidsCube.init();
    aggressorCube.init();



    console.log("X LookAt = ", x_lookAt);
    console.log("y_LookAt = ", y_lookAt);
    console.log("z_LookAt = ", z_lookAt);

   vpAspect = g_canvas.width /     // On-screen aspect ratio for
             g_canvas.height ;  // this camera: width/height.
  
  //printControls(); 	// Display (initial) particle system values as text on webpage
	
  // Quick tutorial on synchronous, real-time animation in JavaScript/HTML-5: 
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simple-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, and computing loads and respond to 
  //			on-screen window placement (skip battery-draining animation in any 
  //			window hidden behind others, or scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.
  var tick = function() {
    g_timeStep = animate(); 
                      // find how much time passed (in milliseconds) since the
                      // last call to 'animate()'.
    if(g_timeStep > 200) {   // did we wait > 0.2 seconds? 
      // YES. That's way too long for a single time-step; somehow our particle
      // system simulation got stopped -- perhaps user switched to a different
      // browser-tab or otherwise covered our browser window's HTML-5 canvas.
      // Resume simulation with a normal-sized time step:
      g_timeStep = 1000/60;
      }
    // Update min/max for timeStep:
    if     (g_timeStep < g_timeStepMin) g_timeStepMin = g_timeStep;  
    else if(g_timeStep > g_timeStepMax) g_timeStepMax = g_timeStep;
  	drawAll(particleSys3D.g_partA.partCount); // compute new particle state at current time
    requestAnimationFrame(tick, g_canvas);
                      // Call tick() again 'at the next opportunity' as seen by 
                      // the HTML-5 element 'g_canvas'.
  };
  tick();
}

function animate() {
//==============================================================================  
// Returns how much time (in milliseconds) passed since the last call to this fcn.
  var now = Date.now();	        
  var elapsed = now - g_last;	// amount of time passed, in integer milliseconds
  g_last = now;               // re-set our stopwatch/timer.

  // INSTRUMENTATION:  (delete if you don't care how much the time-steps varied)
  g_stepCount = (g_stepCount +1)%1000;		// count 0,1,2,...999,0,1,2,...
  //-----------------------end instrumentation
    if (updateRotAngle == true) {
        g_rotAngle += g_angleRate * updateRotAngleSign * g_timeStep * 0.001;
  }

  return elapsed;
}

function drawAll() {
    //============================================================================== 
    // Clear WebGL frame-buffer? (The 'c' or 'C' key toggles g_isClear between 0 & 1).
    if (g_isClear == 1) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // *** SURPRISE! ***
    //  What happens when you forget (or comment-out) this gl.clear() call?
    // In OpenGL (but not WebGL), you'd see 'trails' of particles caused by drawing 
    // without clearing any previous drawing. But not in WebGL; by default, HTML-5 
    // clears the canvas to white (your browser's default webpage color).  To see 
    // 'trails' in WebGL you must disable the canvas' own screen clearing.  HOW?
    // -- in main() where we create our WebGL drawing context, 
    // replace this (default):  
    //          gl = g_canvas.getContext("webgl");
    // -- with this:
    //          gl = g_canvas.getContext("webgl", { preserveDrawingBuffer: true});
    // -- To learn more, see: 
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext

    // update particle system state? 
    groundPlane.switchToMe();
    groundPlane.adjust();
    groundPlane.render();

    if (all_Particle_systems[current_part_sys].g_partA.showSprings) {
        springs.switchToMe();
        springs.adjust();
        springs.render();
    }

    if (all_Particle_systems[current_part_sys].g_partA.runMode > 1) {					// 0=reset; 1= pause; 2=step; 3=run
        // YES! advance particle system(s) by 1 timestep.
        if (all_Particle_systems[current_part_sys].g_partA.runMode == 2) { // (if runMode==2, do just one step & pause)
            all_Particle_systems[current_part_sys].g_partA.runMode = 1;
        }
        //==========================================
        //===========================================
        //
        //  PARTICLE SIMULATION LOOP: (see Lecture Notes D)
        //
        //==========================================
        //==========================================    
        // Make our 'bouncy-ball' move forward by one timestep, but now the 's' key 
        // will select which kind of solver to use by changing g_partA.solvType:
        //  g_partA.applyForces(g_partA.s1, g_partA.forceList);  // find current net force on each particle
        //  g_partA.dotFinder(g_partA.s1dot, g_partA.s1); // find time-derivative s1dot from s1;
        //  g_partA.solver();         // find s2 from s1 & related states.
        //  g_partA.doConstraints();  // Apply all constraints.  s2 is ready!
        // g_partA.render();         // transfer current state to VBO, set uniforms, draw it!
        //  g_partA.swap();           // Make s2 the new current state s1.s
        switch (all_Particle_systems[current_part_sys].g_partA.particleSystemType) {
            case BOUNCY_BALL:
                particleSys3D.draw();
                bouncyCube.switchToMe();
                bouncyCube.adjust();
                bouncyCube.render();
                break;
            case FIRE:
                particleSysFire.draw();
                fireCube.switchToMe();
                fireCube.adjust();
                fireCube.render();
                break;
            case SPRING_PAIR:
                particleSysSpringPair.draw();
                break;
            case TORNADO:
                particleSysTornado.draw();
                tornadoCube.switchToMe();
                tornadoCube.adjust();
                tornadoCube.render();
                break;
            case SPRING_SOLID:
                tetrahedronSpringSys.draw();
                tet_Cube.switchToMe();
                tet_Cube.adjust();
                tet_Cube.render();
                break;
            case BOIDS:
                boidsSystem.draw();
                boidsCube.switchToMe();
                boidsCube.adjust();
                boidsCube.render();
                aggressorCube.switchToMe();
                aggressorCube.adjust();
                aggressorCube.render();
                break;
            default:
                console.log("Invalid Particle System", all_Particle_systems[current_part_sys].g_partA.particleSystemType);
        }
        //===========================================
        //===========================================
    }
    else {    // runMode==0 (reset) or ==1 (pause): re-draw existing particles.

        // Other Objects in Environment
        groundPlane.switchToMe();
        groundPlane.render();

        if (all_Particle_systems[current_part_sys].g_partA.showSprings) {
            springs.switchToMe();
            springs.render();
        }

        switch (all_Particle_systems[current_part_sys].g_partA.particleSystemType) {
            case BOUNCY_BALL:
                particleSys3D.render();
                bouncyCube.switchToMe();
                bouncyCube.render();
                break;
            case FIRE:
                particleSysFire.render();
                fireCube.switchToMe();
                fireCube.render();
                break;
            case SPRING_PAIR:
                particleSysSpringPair.render();
                break;
            case TORNADO:
                particleSysTornado.render();
                tornadoCube.switchToMe();
                tornadoCube.render();

                break;
            case SPRING_SOLID:
                tetrahedronSpringSys.render();
                springs.switchToMe();
                springs.render();
                tet_Cube.switchToMe();
                tet_Cube.adjust();
                tet_Cube.render();
                break;
            case BOIDS:
                boidsSystem.render();
                boidsCube.switchToMe();
                boidsCube.adjust();
                boidsCube.render();
                aggressorCube.switchToMe();
                aggressorCube.render();
                break;
            default:
                console.log("Invalid Particle System");
        }
    }
}

//===================Mouse and Keyboard event-handling Callbacks===============
//=============================================================================
function myMouseDown(ev) {
//=============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
	//	document.getElementById('MouseResult1').innerHTML = 
	//'myMouseDown() at CVV coords x,y = '+x.toFixed(g_digits)+
	//                                ', '+y.toFixed(g_digits)+'<br>';
};

function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp.toFixed(g_digits),',\t',yp.toFixed(g_digits));

	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'draw()' function instead)
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot.toFixed(g_digits),',\t', 
//	                                               yMdragTot.toFixed(g_digits));
	// Put it on our webpage too...
	//document.getElementById('MouseResult1').innerHTML = 
	//'myMouseUp() at CVV coords x,y = '+x+', '+y+'<br>';
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
//	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
//	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	

//function MoveAggressor(sign, forward) {
//    if (forward) {
//        BuildCube(1.0, 1.0, 1.0,  2 * sign, 0, 0);
//        aggressorCube.init();
//        aggressorCube.switchToMe();
//        aggressorCube.adjust();
//        aggressorCube.render();
//    }
//    else {
//        BuildCube(1.0, 1.0, 1.0, 0, 2 * sign, 0);
//        aggressorCube.init();
//        aggressorCube.switchToMe();
//        aggressorCube.adjust();
//        aggressorCube.render();
//    }
//}


function MoveCameraLocation(sign, displacement) {
    x_Coordinate = x_Coordinate + sign * displacement[0] * g_timeStep * 0.001 * 15;
    y_Coordinate = y_Coordinate + sign * displacement[1] * g_timeStep * 0.001 * 15;
    z_Coordinate = z_Coordinate + sign * displacement[2] * g_timeStep * 0.001 * 15;

    Range(x_Coordinate + sign * displacement[0] * g_timeStep * 0.001 * 10, x_Coordinate + sign * displacement[0] * g_timeStep * 0.001 * 15, x_Coordinate);
    Range(y_Coordinate + sign * displacement[1] * g_timeStep * 0.001 * 10, y_Coordinate + sign * displacement[1] * g_timeStep * 0.001 * 15, y_Coordinate);
    Range(z_Coordinate + sign * displacement[2] * g_timeStep * 0.001 * 10, z_Coordinate + sign * displacement[2] * g_timeStep * 0.001 * 15, z_Coordinate);

  eyePosVector = new Vector3([x_Coordinate, y_Coordinate, z_Coordinate]);
}

function MoveLookAtPoint(sign, displacement) {
    x_lookAt = x_lookAt + sign * displacement[0] * g_timeStep * 0.001 * 10;
    y_lookAt = y_lookAt + sign * displacement[1] * g_timeStep * 0.001 * 10;
    z_lookAt = z_lookAt + sign * displacement[2] * g_timeStep * 0.001 * 10;

    Range(x_lookAt + sign * displacement[0] * g_timeStep * 0.001 * 10, x_lookAt + sign * displacement[0] * g_timeStep * 0.001 * 10, x_lookAt);
    Range(y_lookAt + sign * displacement[1] * g_timeStep * 0.001 * 10, y_lookAt + sign * displacement[1] * g_timeStep * 0.001 * 10, y_lookAt);
    Range(z_lookAt + sign * displacement[2] * g_timeStep * 0.001 * 10, z_lookAt + sign * displacement[2] * g_timeStep * 0.001 * 10, z_lookAt);

    lookAtVector = new Vector3([x_lookAt, y_lookAt, z_lookAt]);
}

function translationOnCamera(sign) {
  var displacement = new Float32Array([(x_lookAt - x_Coordinate) * 0.1, 
                                       (y_lookAt - y_Coordinate) * 0.1, 
                                       (z_lookAt - z_Coordinate) * 0.1]); 

  MoveCameraLocation(sign, displacement); 
  MoveLookAtPoint(sign, displacement);
}

function StrafingOnCamera(sign) {
    var eyePosVectorNew = new Vector3([eyePosVector.elements[0], eyePosVector.elements[1], eyePosVector.elements[2]]);
    var perpendicular_axis = lookAtVector.cross(eyePosVectorNew).normalize();
  

    x_Coordinate += sign * perpendicular_axis.elements[0] * g_timeStep * 0.001 * 10;
    x_lookAt += sign * perpendicular_axis.elements[0] * g_timeStep * 0.001 * 10;

    y_lookAt += sign * perpendicular_axis.elements[1] * g_timeStep * 0.001 * 10;
    y_Coordinate += sign * perpendicular_axis.elements[1] * g_timeStep * 0.001 * 10;
}

function verticalMovement(sign) {
    var vertical_axis = eyePosVector.normalize();
    z_Coordinate += sign * vertical_axis.elements[2] * g_timeStep * 0.001 * 10;
    z_lookAt += sign * vertical_axis.elements[2] * g_timeStep * 0.001 * 10;
}

function rotationOnCamera(sign, isVerticalAxis) {
    if (isVerticalAxis)
        z_lookAt += sign * g_timeStep * 0.001 * 10;
  else
    {

        eyePosVector = new Vector3([x_Coordinate, y_Coordinate, z_Coordinate]);
        lookAtVector = new Vector3([x_lookAt, y_lookAt, z_lookAt]);

        lookdir = eyePosVector.subtract(lookAtVector).normalize();


        x_lookAt = Math.cos(g_rotAngle * 0.05 * sign) + x_Coordinate;
        y_lookAt = y_Coordinate + Math.sin(g_rotAngle * 0.05 * sign);

  } 

  eyePosVector = new Vector3([x_Coordinate, y_Coordinate, z_Coordinate]);
  lookAtVector = new Vector3([x_lookAt, y_lookAt, z_lookAt]);
}

function myKeyDown(kev) {
//============================================================================
  g_timeStepMin = g_timeStep;
  g_timeStepMax = g_timeStep;

  switch(kev.code) {
      case "KeyW":
          if (!boids_ControlBox)
              translationOnCamera(1, false);
          else
              MoveAggressor(1, true);
      break;
      case "KeyS":
          if (!boids_ControlBox)
              translationOnCamera(-1, false);
          else
              MoveAggressor(-1, true);
      break;
      case "KeyA":
          if (!boids_ControlBox)
              StrafingOnCamera(-1);
          else
              MoveAggressor(1, false);
      break;
      case "KeyD":
          if (!boids_ControlBox)
              StrafingOnCamera(1);
          else
              MoveAggressor(-1, false);
      break;
    case "ArrowUp":
      rotationOnCamera(1, true);
      break;
    case "ArrowDown":
      rotationOnCamera(-1, true);
      break;
    case "ArrowRight":
      updateRotAngle = true;
      updateRotAngleSign = -1;
      rotationOnCamera(1, false);
      break;
    case "ArrowLeft" :
      updateRotAngle = true;
      updateRotAngleSign = 1;
      rotationOnCamera(1, false);
      break;
    case "KeyL":
      all_Particle_systems[current_part_sys].debug();
      break;
    case "Digit0":
			all_Particle_systems[current_part_sys].g_partA.runMode = 0;			// RESET!
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 0 key. Run Mode 0: RESET!';    // print on webpage,
      break;
    case "Digit1":
			all_Particle_systems[current_part_sys].g_partA.runMode = 1;			// PAUSE!
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 1 key. Run Mode 1: PAUSE!';    // print on webpage,
      break;
    case "Digit2":
			all_Particle_systems[current_part_sys].g_partA.runMode = 2;			// STEP!
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 2 key. Run Mode 2: STEP!';     // print on webpage,
      break;
    case "Digit3":
			all_Particle_systems[current_part_sys].g_partA.runMode = 3;			// RESET!
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() digit 3 key. Run Mode 3: RUN!';      // print on webpage,
			console.log("Run Mode 3: RUN!");                  // print on console.
      break;
    case "KeyB":                // Toggle floor-bounce constraint type
			if(all_Particle_systems[current_part_sys].g_partA.bounceType==0) all_Particle_systems[current_part_sys].g_partA.bounceType = 1;   // impulsive vs simple
			else all_Particle_systems[current_part_sys].g_partA.bounceType = 0;
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() b/B key: toggle bounce mode.';	      // print on webpage,
      break;
    case "KeyC":                // Toggle screen-clearing to show 'trails'
			g_isClear += 1;
			if(g_isClear > 1) g_isClear = 0;
			document.getElementById('KeyDown').innerHTML =  
			'myKeyDown() c/C key: toggle screen clear.';	 // print on webpage,
      break;
    case "KeyF":    // 'f' or 'F' to toggle particle fountain on/off
          current_part_sys += 1;
          if (current_part_sys >= all_Particle_systems.length) current_part_sys = 0;
      break;
    case "KeyP":
	  if(all_Particle_systems[current_part_sys].g_partA.runMode == 3) all_Particle_systems[current_part_sys].g_partA.runMode = 1;		// if running, pause
						  else all_Particle_systems[current_part_sys].g_partA.runMode = 3;		          // if paused, run.
	  //document.getElementById('KeyDown').innerHTML =  
			//  'myKeyDown() p/P key: toggle Pause/unPause!';    // print on webpage
	  //console.log("p/P key: toggle Pause/unPause!");   			// print on console,
			break;
    case "KeyR":    // r/R for RESET: 
      if(kev.shiftKey==false) {   // 'r' key: SOFT reset; boost velocity only
  		  all_Particle_systems[current_part_sys].g_partA.runMode = 3;  // RUN!
        var j=0; // array index for particle i
          for (var i = 0; i < all_Particle_systems[current_part_sys].g_partA.partCount; i += 1, j += PART_MAXVAR) {
              if (all_Particle_systems[current_part_sys].g_partA.particleSystemType == SPRING_SOLID) {
                  all_Particle_systems[current_part_sys].g_partA.s1[j + PART_YPOS] += 1.0;
              }
              else {
                  all_Particle_systems[current_part_sys].g_partA.roundRand();  // make a spherical random var.
                  if (all_Particle_systems[current_part_sys].g_partA.s2[j + PART_XVEL] > 0.0) // ADD to positive velocity, and 
                      all_Particle_systems[current_part_sys].g_partA.s1[j + PART_XVEL] += 1.7 + 0.4 * all_Particle_systems[current_part_sys].g_partA.randX * all_Particle_systems[current_part_sys].g_partA.INIT_VEL;
                  // SUBTRACT from negative velocity: 
                  else all_Particle_systems[current_part_sys].g_partA.s1[j + PART_XVEL] -= 1.7 + 0.4 * all_Particle_systems[current_part_sys].g_partA.randX * all_Particle_systems[current_part_sys].g_partA.INIT_VEL;

                  if (all_Particle_systems[current_part_sys].g_partA.s2[j + PART_YVEL] > 0.0)
                      all_Particle_systems[current_part_sys].g_partA.s1[j + PART_YVEL] += 1.7 + 0.4 * all_Particle_systems[current_part_sys].g_partA.randY * all_Particle_systems[current_part_sys].g_partA.INIT_VEL;
                  else all_Particle_systems[current_part_sys].g_partA.s1[j + PART_YVEL] -= 1.7 + 0.4 * all_Particle_systems[current_part_sys].g_partA.randY * all_Particle_systems[current_part_sys].g_partA.INIT_VEL;

                  if (all_Particle_systems[current_part_sys].g_partA.s2[j + PART_ZVEL] > 0.0)
                      all_Particle_systems[current_part_sys].g_partA.s1[j + PART_ZVEL] += 1.7 + 0.4 * all_Particle_systems[current_part_sys].g_partA.randZ * all_Particle_systems[current_part_sys].g_partA.INIT_VEL;
                  else all_Particle_systems[current_part_sys].g_partA.s1[j + PART_ZVEL] -= 1.7 + 0.4 * all_Particle_systems[current_part_sys].g_partA.randZ * all_Particle_systems[current_part_sys].g_partA.INIT_VEL;
              }
          }
      }
      else {      // HARD reset: position AND velocity, BOTH state vectors:
  		  all_Particle_systems[current_part_sys].g_partA.runMode = 0;			// RESET!
        // Reset state vector s1 for ALL particles:
        var j=0; // array index for particle i
        for(var i = 0; i < all_Particle_systems[current_part_sys].g_partA.partCount; i += 1, j+= PART_MAXVAR) {
              all_Particle_systems[current_part_sys].g_partA.roundRand();
        			all_Particle_systems[current_part_sys].g_partA.s2[j + PART_XPOS] =  -0.9;      // lower-left corner of CVV
        			all_Particle_systems[current_part_sys].g_partA.s2[j + PART_YPOS] =  -0.9;      // with a 0.1 margin
        			all_Particle_systems[current_part_sys].g_partA.s2[j + PART_ZPOS] =  0.0;	
        			all_Particle_systems[current_part_sys].g_partA.s2[j + PART_XVEL] =  3.7 + 0.4*all_Particle_systems[current_part_sys].g_partA.randX*all_Particle_systems[current_part_sys].g_partA.INIT_VEL;	
        			all_Particle_systems[current_part_sys].g_partA.s2[j + PART_YVEL] =  3.7 + 0.4*all_Particle_systems[current_part_sys].g_partA.randY*all_Particle_systems[current_part_sys].g_partA.INIT_VEL; // initial velocity in meters/sec.
              all_Particle_systems[current_part_sys].g_partA.s2[j + PART_ZVEL] =  3.7 + 0.4*all_Particle_systems[current_part_sys].g_partA.randZ*all_Particle_systems[current_part_sys].g_partA.INIT_VEL;
              // do state-vector s2 as well: just copy all elements of the float32array.
            all_Particle_systems[current_part_sys].g_partA.s2.set(all_Particle_systems[current_part_sys].g_partA.s1);
        } // end for loop
      } // end HARD reset
	  //document.getElementById('KeyDown').innerHTML =  
	  //'myKeyDown() r/R key: soft/hard Reset.';	// print on webpage,
	  //console.log("r/R: soft/hard Reset");      // print on console,
      break;
		case "Space":
      all_Particle_systems[current_part_sys].g_partA.runMode = 2;
          break;
      case "ShiftLeft":
          verticalMovement(1);
          break;
      case "ControlLeft":
          verticalMovement(-1);
          break;
    default:
  		//document.getElementById('KeyDown').innerHTML =
  		//	'myKeyDown():UNUSED,keyCode='+kev.keyCode;
  		//console.log("UNUSED key:", kev.keyCode);
      break;
  }
}

function myKeyUp(kev) {
//=============================================================================
// Called when user releases ANY key on the keyboard.
// Rarely needed -- most code needs only myKeyDown().

  switch(kev.code) {
    case 'ArrowLeft' :
    updateRotAngle = false;
    break;

    case 'ArrowRight' :
    updateRotAngle = false;
    break;
  }

}

function ChangeSolvers(index) {
    var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
    all_Particle_systems[current_part_sys].g_partA.solvType = solvers[index];
}

//function printcontrols() {
////==============================================================================
//// print current state of the particle system on the webpage:
//	var reciptime = 1000.0 / g_timestep;			// to report fractional seconds
//	var recipmin  = 1000.0 / g_timestepmin;
//	var recipmax  = 1000.0 / g_timestepmax; 
//	var solvtypetxt;												// convert solver number to text:
//	if(all_particle_systems[current_part_sys].g_parta.solvtype==0) solvtypetxt = 'explicit--(unstable!)<br>';
//	                  else  solvtypetxt = 'implicit--(stable)<br>'; 
//	var bouncetypetxt;											// convert bounce number to text
//	if(all_particle_systems[current_part_sys].g_parta.bouncetype==0) bouncetypetxt = 'velocity reverse(no rest)<br>';
//	                     else bouncetypetxt = 'impulsive (will rest)<br>';
//	var fountaintext;
//	if(all_particle_systems[current_part_sys].g_parta.isfountain==0) fountaintext = 'off: ageless particles.<br>';
//	else                      fountaintext = 'on: re-cycle old particles.<br>';
//	var xvlimit = all_particle_systems[current_part_sys].g_parta.s2[part_xvel];	// find absolute values of s2[part_xvel]
//	if(all_particle_systems[current_part_sys].g_parta.s2[part_xvel] < 0.0) xvlimit = -all_particle_systems[current_part_sys].g_parta.s2[part_xvel];
//	var yvlimit = all_particle_systems[current_part_sys].g_parta.s2[part_yvel];	// find absolute values of s2[part_yvel]
//	if(all_particle_systems[current_part_sys].g_parta.s2[part_yvel] < 0.0) yvlimit = -all_particle_systems[current_part_sys].g_parta.s2[part_yvel];
	
//    document.getelementbyid('KeyControls').innerhtml =
//        '<b>x_lookAt = </b>' + x_lookAt +
//    '<b>y_lookAt = </b>' + y_lookAt +
//    '<b>z_lookAt =</b>' + z_lookAt +
//   			'<b>drag = </b>' + all_particle_systems[current_part_sys].g_parta.drag.tofixed(5) + 
//   			', <b>grav = </b>' + all_particle_systems[current_part_sys].g_parta.grav.tofixed(5) +
//   			' m/s^2; <b>yvel = +/-</b> ' + yvlimit.tofixed(5) + 
//   			' m/s; <b>xvel = +/-</b> ' + xvlimit.tofixed(5) + 
//   			' m/s;<br><b>timestep = </b> 1/' + reciptime.tofixed(3) + ' sec' +
//   			                ' <b>min:</b> 1/' + recipmin.tofixed(3)  + ' sec' + 
//   			                ' <b>max:</b> 1/' + recipmax.tofixed(3)  + ' sec<br>';
//   			' <b>stepcount: </b>' + g_stepcount.tofixed(3) ;
//}


function onPlusButton() {
//==============================================================================
	all_Particle_systems[current_part_sys].g_partA.INIT_VEL *= 1.2;		// growfPRINT
	console.log('Initial velocity: '+all_Particle_systems[current_part_sys].g_partA.INIT_VEL);
}

function onMinusButton() {
//==============================================================================
	all_Particle_systems[current_part_sys].g_partA.INIT_VEL /= 1.2;		// shrink
	console.log('Initial velocity: '+all_Particle_systems[current_part_sys].g_partA.INIT_VEL);
}


var BouncyBallsGUI = function () {
    this.particles = bouncyBallParticlesCount;
    this.solver = bouncySolver;

    this.reload = function () {
        bouncyBallParticlesCount = this.particles;
        particleSys3D.update();
        ChangeSolvers(this.solver);
    }
}


var FireGUI = function () {
    this.particles = firePariclesCount;
    this.solver = fireSolver;

    this.reload = function () {
        firePariclesCount = this.particles;
        particleSysFire.update();
        ChangeSolvers(this.solver);
    }
}

var TornadoGUI = function () {
    this.particles = tornadoParticlesCount;
    this.solver = tornadoSolver;

    this.reload = function () {
        tornadoParticlesCount = this.particles;
        particleSysTornado.update();
        ChangeSolvers(this.solver);
    }
}


var TetrahedronGUI = function () {

    this.solver = tet_solver;
    this.restLength = tet_restLength;
    this.springK = tet_springConst;
    this.dampCoeff = tet_dampCoeff;
  
    this.reload = function () {
        tet_restLength = this.restLength;
        tet_springConst = this.springK;
        tet_dampCoeff = this.dampCoeff;
        tetrahedronSpringSys.update();
        ChangeSolvers(this.solver);
    }

}

var BoidsGUI = function () {

    this.particles = boids_particles;
    this.solver = boids_solver;
    this.aggressorForce = boids_aggressorForce;
    this.aggressorAffectDist = boids_aggressorAffectDistance;

    this.reload = function () {
        boids_particles = this.particles;
        boids_solver = this.solver;
        boids_aggressorForce = this.aggressorForce;
        boids_aggressorAffectDistance = this.aggressorAffectDist;
        boidsSystem.update();
        ChangeSolvers(this.solver);
    }
}


function windowLoad() {
    var bouncyFolder = new BouncyBallsGUI();
    var fireFolder = new FireGUI();
    var tornadoFolder = new TornadoGUI();
    var tetrahedronFolder = new TetrahedronGUI();
    var boidsFolder = new BoidsGUI();
    var gui = new dat.GUI();

    //Bouncy Particles Controller
    var normalParticles = gui.addFolder('Bouncy Balls');
    normalParticles.add(bouncyFolder, 'particles');
    normalParticles.add(bouncyFolder, 'solver', { EULER: SOLV_EULER, MID_POINT: SOLV_MIDPOINT, BACK_EULER: SOLV_BACK_EULER, BACK_MID_POINT: SOLV_BACK_MIDPT });
    normalParticles.add(bouncyFolder, 'reload');

    var fire = gui.addFolder('Fire Particles');
    fire.add(fireFolder, 'particles');
    fire.add(fireFolder, 'solver', { EULER: SOLV_EULER, MID_POINT: SOLV_MIDPOINT, BACK_EULER: SOLV_BACK_EULER, BACK_MID_POINT: SOLV_BACK_MIDPT });
    fire.add(fireFolder, 'reload');

    var tornado = gui.addFolder('Tornado Particles');
    tornado.add(tornadoFolder, 'particles');
    tornado.add(tornadoFolder, 'solver', { EULER: SOLV_EULER, MID_POINT: SOLV_MIDPOINT, BACK_EULER: SOLV_BACK_EULER, BACK_MID_POINT: SOLV_BACK_MIDPT });
    tornado.add(tornadoFolder, 'reload');

    var springSolid = gui.addFolder('Springy Tetrahedron');
    springSolid.add(tetrahedronFolder, 'solver', { EULER: SOLV_EULER, MID_POINT: SOLV_MIDPOINT, BACK_EULER: SOLV_BACK_EULER, BACK_MID_POINT: SOLV_BACK_MIDPT });
    springSolid.add(tetrahedronFolder, 'restLength', 0, 1);
    springSolid.add(tetrahedronFolder, 'springK');
    springSolid.add(tetrahedronFolder, 'dampCoeff');
    springSolid.add(tetrahedronFolder, 'reload');

    var boids = gui.addFolder('Boids');
    boids.add(boidsFolder, 'particles');
    boids.add(boidsFolder, 'solver', { EULER: SOLV_EULER, MID_POINT: SOLV_MIDPOINT, BACK_EULER: SOLV_BACK_EULER, BACK_MID_POINT: SOLV_BACK_MIDPT });
    boids.add(boidsFolder, 'aggressorForce', -100, -20);
    boids.add(boidsFolder, 'aggressorAffectDist', 0.2, 4);
    boids.add(boidsFolder, 'reload');
    normalParticles.open();
}

function BuildCube(length, breadth, height, offset_x, offset_y, offset_z, base) {
    if (base) {
        V1 = new Vector3([length + offset_x, breadth + offset_y, height + offset_z]);
        V2 = new Vector3([length + offset_x, -breadth + offset_y, height + offset_z]);
        V3 = new Vector3([length + offset_x, -breadth + offset_y, -0.95 + offset_z]);
        V4 = new Vector3([length + offset_x, breadth + offset_y, -0.95 + offset_z]);
        V5 = new Vector3([-length + offset_x, breadth + offset_y, -0.95 + offset_z]);
        V6 = new Vector3([-length + offset_x, breadth + offset_y, height + offset_z]);
        V7 = new Vector3([-length + offset_x, -breadth + offset_y, height + offset_z]);
        V8 = new Vector3([-length + offset_x, -breadth + offset_y, -0.95 + offset_z]);
    } else {
        V1 = new Vector3([length + offset_x, breadth + offset_y, height + offset_z]);
        V2 = new Vector3([length + offset_x, -breadth + offset_y, height + offset_z]);
        V3 = new Vector3([length + offset_x, -breadth + offset_y, -height + offset_z]);
        V4 = new Vector3([length + offset_x, breadth + offset_y, -height + offset_z]);
        V5 = new Vector3([-length + offset_x, breadth + offset_y, -height  + offset_z]);
        V6 = new Vector3([-length + offset_x, breadth + offset_y, height + offset_z]);
        V7 = new Vector3([-length + offset_x, -breadth + offset_y, height + offset_z]);
        V8 = new Vector3([-length + offset_x, -breadth + offset_y, -height  + offset_z]);

    }
}

function Range(min, max, number) {
    if (number < min) return min;
    else if (number > max) return max;
    else return number;
}
