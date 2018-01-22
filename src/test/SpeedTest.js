// Copyright 2016 Erik Neumann.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('myphysicslab.test.SpeedTest');

goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.engine2D.CollisionHandling');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.engine2D.ExtraAccel');
goog.require('myphysicslab.lab.engine2D.ImpulseSim');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.RungeKutta');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.test.Engine2DTestRig');
goog.require('myphysicslab.lab.model.ModifiedEuler');

goog.scope(function() {

const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
var CollisionHandling = myphysicslab.lab.engine2D.CollisionHandling;
var ContactSim = myphysicslab.lab.engine2D.ContactSim;
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
var DampingLaw = myphysicslab.lab.model.DampingLaw;
var DisplayShape = myphysicslab.lab.view.DisplayShape;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DTestRig = myphysicslab.test.Engine2DTestRig;
var ExtraAccel = myphysicslab.lab.engine2D.ExtraAccel;
var ImpulseSim = myphysicslab.lab.engine2D.ImpulseSim;
const ModifiedEuler = goog.module.get('myphysicslab.lab.model.ModifiedEuler');
const RungeKutta = goog.module.get('myphysicslab.lab.model.RungeKutta');
var Shapes = myphysicslab.lab.engine2D.Shapes;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var Walls = myphysicslab.lab.engine2D.Walls;

/** Tests high speed collisions.  Some are between small object and thin walls.
Some are between two small objects.
@constructor
@final
@struct
@private
*/
myphysicslab.test.SpeedTest = function() {};

var SpeedTest = myphysicslab.test.SpeedTest;

/**
* @type {string}
* @const
*/
SpeedTest.groupName = 'SpeedTest.';

SpeedTest.test = function() {
  Engine2DTestRig.schedule(SpeedTest.ball_vs_wall_0);
  Engine2DTestRig.schedule(SpeedTest.ball_vs_wall_1);
  Engine2DTestRig.schedule(SpeedTest.ball_vs_circle_0);
  Engine2DTestRig.schedule(SpeedTest.small_small);
};

/**
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@param {number=} damping
@private
*/
SpeedTest.commonSetup1 = function(sim, advance, damping) {
  damping = damping === undefined ? 0.05 : damping;
  sim.addForceLaw(new DampingLaw(damping, 0.15, sim.getSimList()));
  if (sim instanceof ContactSim) {
    sim.setDistanceTol(0.01);
    sim.setVelocityTol(0.5);
    sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
  }
  sim.setCollisionAccuracy(0.6);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  advance.setDiffEqSolver(new RungeKutta(sim));
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
};

/**
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
SpeedTest.ball_vs_wall_setup = function(sim, advance) {
  SpeedTest.commonSetup1(sim, advance);
  var p = Shapes.makeBall(0.2, 'fast_ball');
  p.setMass(0.1);
  p.setPosition(new Vector(-5,  0),  0);
  p.setVelocity(new Vector(200,  153),  0);
  p.setElasticity(0.95);
  sim.addBody(p);
  // super-thin walls
  Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/0.01);
};

/** Small high speed ball collides into very thin walls.
@return {undefined}
@private
*/
SpeedTest.ball_vs_wall_0 = function() {
  Engine2DTestRig.testName = SpeedTest.groupName+'ball_vs_wall_0';
  var sim = new ImpulseSim();
  var advance = new CollisionAdvance(sim);
  SpeedTest.ball_vs_wall_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*1);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -4.349276, 0.4830918, 4.4247788, -0.4310427, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/10.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/Util.NaN, /*energyTol=*/Util.NaN,
      /*expectedCollisions=*/37);
};

/** Same as ball_vs_wall_0 but with ContactSim instead of ImpulseSim.
@return {undefined}
@private
*/
SpeedTest.ball_vs_wall_1 = function() {
  Engine2DTestRig.testName = SpeedTest.groupName+'ball_vs_wall_1';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  SpeedTest.ball_vs_wall_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*1);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -4.3493183, 0.4830918, 4.4248186, -0.4310427, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/10.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/Util.NaN, /*energyTol=*/Util.NaN,
      /*expectedCollisions=*/37);
};

/** Small high speed ball collides into very thin walls and fixed circle.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
SpeedTest.ball_vs_circle_setup = function(sim, advance) {
  SpeedTest.commonSetup1(sim, advance);
  var p = Shapes.makeBall(0.2, 'fast_ball');
  p.setMass(0.1);
  p.setPosition(new Vector(-5,  0),  0);
  p.setVelocity(new Vector(200,  153),  0);
  sim.addBody(p);
  // super-thin walls
  Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/0.01);
  var b = Shapes.makeBall(4, 'fixBall');
  b.setMass(Util.POSITIVE_INFINITY);
  b.setPosition(new Vector(0,  0),  0);
  sim.addBody(b);
  sim.setElasticity(0.95);
};

/**
@return {undefined}
@private
*/
SpeedTest.ball_vs_circle_0 = function() {
  Engine2DTestRig.testName = SpeedTest.groupName+'ball_vs_circle_0';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  SpeedTest.ball_vs_circle_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*1);
  var expectedCollisions;
  if (Util.isChrome()) {
    Engine2DTestRig.setBodyVars(sim, vars, 0, -5.6805659, -0.1123115, 5.6022192, 0.2347565, -0.0000012, -0);
    expectedCollisions = 55;
  } else {
    Engine2DTestRig.setBodyVars(sim, vars, 0, 4.2864427, 0.1090598, 5.7947777, -0.0042925, -0.0000012, -0);
    expectedCollisions = 52;
  }
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/10,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/NaN, /*energyTol=*/0,
      /*expectedCollisions=*/expectedCollisions, /*expectedSearches=*/6);
};

/** High speed collision of two small objects, the goal is to have the fast object
pass entirely thru the small object in a time step, so that just checking if the objects
are penetrating will not detect the collision.  Note that if using Runge-Kutta
solver that the state is evaluated at mid-time step also.  Therefore, use modified Euler
here instead.

To check that this test is working:  in `Polygon.checkVertexes` set
`travelDist = 0` (the distance travelled by the vertex), and in `ImpulseSim` set
`PROXIMITY_TEST = false`.  Note that if trying this interactively, be sure to use the
same large time step used here
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
SpeedTest.small_small_setup = function(sim, advance) {
  SpeedTest.commonSetup1(sim, advance, /*damping=*/0);
  sim.setSimRect(new DoubleRect(-32, -12, 32, 12));
  advance.setDiffEqSolver(new ModifiedEuler(sim));
  // use large time step of 0.1 to ensure that object passes thru in single step
  advance.setTimeStep(0.1);
  var b1 = Shapes.makeBlock(1, 1, 'block0');
  b1.setPosition(new Vector(-30,  0),  Math.PI/4);
  b1.setVelocity(new Vector(100,  0),  0);  // high speed moving rightwards
  var b2 = Shapes.makeBlock(1, 1.3, 'block1');
  b2.setPosition(new Vector(5,  0));  // stationary
  sim.addBody(b1);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/** High speed collision of two small objects.
@return {undefined}
@private
*/
SpeedTest.small_small = function() {
  Engine2DTestRig.testName = SpeedTest.groupName+'small_small';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  SpeedTest.small_small_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 3.7878932, 0, 0, 0, 0.7853982, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 71.2121068, 100, 0, 0, 0, 0);
  // use large time step of 0.1 to ensure that object passes thru in single step
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/1.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
      /*expectedCollisions=*/1);
};

}); // goog.scope
