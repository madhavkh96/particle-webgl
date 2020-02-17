/* 
 * This file contains the type of particle systems available which
 * will be used in the program to switch between different constraints and
 * effects on the particles
 */

const BOUNCY_BALL = 0;
const FOUNTAIN = 1;
const FIRE = 2;
const SPRING_PAIR = 3;
const CLOTH = 4;
const TORNADO = 5;
const SPRING_ROPE = 6;
const SPRING_SOLID = 7;
const BOIDS = 8;

//Constructor
function PartSysType() {
    this.PartSysType = BOUNCY_BALL;
}
