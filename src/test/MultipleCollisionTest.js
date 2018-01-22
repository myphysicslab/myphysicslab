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

goog.provide('myphysicslab.test.MultipleCollisionTest');

goog.require('myphysicslab.lab.engine2D.CollisionHandling');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.ExtraAccel');
goog.require('myphysicslab.lab.engine2D.ImpulseSim');
goog.require('myphysicslab.lab.engine2D.JointUtil');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.model.RungeKutta');
goog.require('myphysicslab.lab.util.RandomLCG');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.test.Engine2DTestRig');
goog.require('myphysicslab.test.TestShapes');

goog.scope(function() {

const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
var CollisionHandling = myphysicslab.lab.engine2D.CollisionHandling;
var ContactSim = myphysicslab.lab.engine2D.ContactSim;
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.module.get('myphysicslab.lab.model.DampingLaw');
var DisplayShape = myphysicslab.lab.view.DisplayShape;
var Engine2DTestRig = myphysicslab.test.Engine2DTestRig;
var ExtraAccel = myphysicslab.lab.engine2D.ExtraAccel;
var GravityLaw = myphysicslab.lab.model.GravityLaw;
var ImpulseSim = myphysicslab.lab.engine2D.ImpulseSim;
var JointUtil = myphysicslab.lab.engine2D.JointUtil;
const RandomLCG = goog.module.get('myphysicslab.lab.util.RandomLCG');
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
const RungeKutta = goog.module.get('myphysicslab.lab.model.RungeKutta');
var Shapes = myphysicslab.lab.engine2D.Shapes;
var TestShapes = myphysicslab.test.TestShapes;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var Walls = myphysicslab.lab.engine2D.Walls;

/**  Unit tests of {@link ImpulseSim}, for cases involving multiple simultaneous
collisions.

Note that these tests are sensitive to the settings for
`VELOCITY_TOL` and `DISTANCE_TOL` in ImpulseSim.

@constructor
@final
@struct
@private
*/
myphysicslab.test.MultipleCollisionTest = function() {};

var MultipleCollisionTest = myphysicslab.test.MultipleCollisionTest;

/**
* @type {string}
* @const
*/
MultipleCollisionTest.groupName = 'MultipleCollisionTest.';

/**
@type {boolean}
@private
@const
*/
MultipleCollisionTest.BALL = true;

/**
@type {boolean}
@private
@const
*/
MultipleCollisionTest.BLOCK = false;


MultipleCollisionTest.test = function() {
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test1_0, CollisionHandling.SIMULTANEOUS));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test1_0, CollisionHandling.HYBRID));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test1_1, CollisionHandling.SERIAL_GROUPED_LASTPASS));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test2_0, CollisionHandling.SIMULTANEOUS, MultipleCollisionTest.BALL));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test2_0, CollisionHandling.SIMULTANEOUS, MultipleCollisionTest.BLOCK));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test2_1, CollisionHandling.SERIAL_GROUPED_LASTPASS, MultipleCollisionTest.BALL));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test2_1, CollisionHandling.HYBRID,  MultipleCollisionTest.BALL));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test2_1, CollisionHandling.HYBRID,  MultipleCollisionTest.BLOCK));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test3_0, CollisionHandling.SIMULTANEOUS));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test3_0, CollisionHandling.HYBRID));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test3_1, CollisionHandling.SERIAL_GROUPED_LASTPASS));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test4_0, CollisionHandling.SIMULTANEOUS));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test4_0, CollisionHandling.HYBRID));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test4_1, CollisionHandling.SERIAL_GROUPED_LASTPASS));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test5_0, CollisionHandling.SIMULTANEOUS,  MultipleCollisionTest.BALL));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test5_0, CollisionHandling.HYBRID,  MultipleCollisionTest.BALL));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test5_0, CollisionHandling.SERIAL_GROUPED_LASTPASS,  MultipleCollisionTest.BALL));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test5_0, CollisionHandling.SIMULTANEOUS,  MultipleCollisionTest.BLOCK));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test5_0, CollisionHandling.HYBRID,  MultipleCollisionTest.BLOCK));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test6_0, CollisionHandling.SERIAL_GROUPED_LASTPASS));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test6_1, CollisionHandling.SIMULTANEOUS));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test6_1, CollisionHandling.HYBRID));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test7_0, CollisionHandling.SIMULTANEOUS));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test7_1, CollisionHandling.HYBRID));
  Engine2DTestRig.schedule(goog.partial(MultipleCollisionTest.test7_2, CollisionHandling.SERIAL_GROUPED_LASTPASS));
  Engine2DTestRig.schedule(MultipleCollisionTest.test8_0);
  Engine2DTestRig.schedule(MultipleCollisionTest.test8_1);
  Engine2DTestRig.schedule(MultipleCollisionTest.test8_2);
  Engine2DTestRig.schedule(MultipleCollisionTest.test8_3);
  Engine2DTestRig.schedule(MultipleCollisionTest.test8_5);
  Engine2DTestRig.schedule(MultipleCollisionTest.two_in_box);
  Engine2DTestRig.schedule(MultipleCollisionTest.one_hits_two_in_box);
};

/**
@type {number}
@private
@const
*/
MultipleCollisionTest.distanceTol_ = 0.01;

/**
@type {number}
@private
@const
*/
MultipleCollisionTest.velocityTol_ = 0.5;

/**
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@private
*/
MultipleCollisionTest.commonSetup1 = function(sim, advance) {
  sim.addForceLaw(new DampingLaw(0, 0.15, sim.getSimList()));
  sim.setCollisionAccuracy(0.6);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(99999);
  if (sim instanceof ContactSim) {
    sim.setDistanceTol(MultipleCollisionTest.distanceTol_);
    sim.setVelocityTol(MultipleCollisionTest.velocityTol_);
    sim.setExtraAccel(ExtraAccel.VELOCITY);
  }
  advance.setJointSmallImpacts(false);
  advance.setTimeStep(0.025);
  advance.setDiffEqSolver(new RungeKutta(sim));
};

/** 'one hits wall':  Square block collides into a wall, both corners simultaneously.
  The result depends on the collision handling mechanism.
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.one_hits_wall_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var b0 = Shapes.makeBlock(1, 1, 'block');
  b0.setPosition(new Vector(0,  2),  0);
  b0.setVelocity(new Vector(0,  -3),  0);
  sim.addBody(b0);
  var b1 = Shapes.makeBlock(3, 1, 'wall');
  b1.setPosition(new Vector(0,  -2),  0);
  b1.setMass(Util.POSITIVE_INFINITY);
  sim.addBody(b1);
  sim.setElasticity(1.0);
};

/** With sequential or hybrid collision handling, the block bounces straight off the wall.
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test1_0 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test1_0 '+collisionType;
  var sim = new ImpulseSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.one_hits_wall_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0, 0, 2.01, 3, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0, 0, -2, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** With serial collision handling, the block starts rotating.
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test1_1 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test1_1 '+collisionType;
  var sim = new ImpulseSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.one_hits_wall_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0, 0, 1.7696, 2.76, -2.8848, -2.88);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0, 0, -2, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** 'one hits two': A ball (or square block) on the left moves to hit two balls that are
in resting contact.
The result depends on the type of collision handling being used.
Because resting contact is involved, we need to use ContactSim instead of ImpulseSim.
@param {!ImpulseSim} sim  the ImpulseSim to add the objects to
@param {!CollisionAdvance} advance
@param {number} offset  additional distance between the stationary objects
@param {boolean} balls  true gives round balls, false gives square blocks
*/
MultipleCollisionTest.test2_prep = function(sim, advance, offset, balls) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var radius = 0.5;
  var b0 = balls ? Shapes.makeBall(radius, 'ball0')
                 : Shapes.makeBlock(2*radius, 2*radius, 'block0');
  b0.setPosition(new Vector(-3,  0),  0);
  b0.setVelocity(new Vector(3,  0),  0);
  sim.addBody(b0);
  var b1 = balls ? Shapes.makeBall(radius, 'ball1')
                 : Shapes.makeBlock(2*radius, 2*radius, 'block1');
  b1.setPosition(new Vector(0,  0),  0);
  sim.addBody(b1);
  var b2 = balls ? Shapes.makeBall(radius, 'ball2')
                 : Shapes.makeBlock(2*radius, 2*radius, 'block2');
  b2.setPosition(new Vector(2*radius + MultipleCollisionTest.distanceTol_/2 + offset,  0),  0);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/**
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.one_hits_two_ball_setup = function(sim, advance) {
  MultipleCollisionTest.test2_prep(sim, advance, 0, MultipleCollisionTest.BALL);
};

/**
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.one_hits_two_block_setup = function(sim, advance) {
  MultipleCollisionTest.test2_prep(sim, advance, 0, MultipleCollisionTest.BLOCK);
};

/** With simultaneous collision handling, all the balls are moving after the collision
(which is physically wrong, but it is how it should behave).
@param {!CollisionHandling} collisionType
@param {boolean} balls  true gives round balls, false gives square blocks
*/
MultipleCollisionTest.test2_0 = function(collisionType, balls) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test2_0 '+collisionType+' balls='+balls;
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.test2_prep(sim, advance, 0, balls);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -2.34, -1, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 2.67, 2, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 3.675, 2, 0, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** With serial or hybrid collision handling, the result is only the right-most ball is moving.
@param {!CollisionHandling} collisionType
@param {boolean} balls  true gives round balls, false gives square blocks
*/
MultipleCollisionTest.test2_1 = function(collisionType, balls) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test2_1 '+collisionType+' balls='+balls;
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.test2_prep(sim, advance, 0, balls);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -1.005, 0, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0, 0, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 5.01, 3, 0, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/**  'Two hits one asymmetric':  Two balls approach a central stationary ball so that the collisions
happen at the same moment;  the balls have different velocities.  The result should
be that the central ball should remain motionless and the moving balls bounce off but
exchange velocities.
Because there are no static contacts, but only two dynamic collisions, we can use
ImpulseSim here (don't need to use ContactSim).

* Here is why we need to add distTol/2 to starting position of body1:
* The collision happens when the blocks are distTol/2 apart, so the distance
* travelled is slightly less than you would expect.
* Suppose distTol = 0.01; and distTol/2 = 0.005.
* body2.left = 0.5;  body3.right = 2.5; body3 travels 2.5 - 0.5 - 0.005 = 1.995
* If body1 starts at -5, it travels a distance of 3.995 which is more than
* twice the distance that body3 travels, so it arrives after body3 collision.
* To have them collide at the same moment:
* Since body1 travels at twice the speed, it should travel 1.995 * 2 = 3.99
* Therefore body1.right = body2.left - 0.005 - 3.99 = -4.495
* Therefore body1.center = -4.995 = -5 + distTol/2

@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.two_hits_one_asymmetric_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var distTol = sim.getDistanceTol();
  var radius = 0.5;
  var b0 = Shapes.makeBall(radius, 'left');
  b0.setPosition(new Vector(-5 + distTol/2,  0),  0);
  b0.setVelocity(new Vector(3,  0),  0);
  sim.addBody(b0);
  var b1 = Shapes.makeBall(radius, 'center');
  b1.setPosition(new Vector(0,  0),  0);
  sim.addBody(b1);
  var b2 = Shapes.makeBall(radius, 'right');
  b2.setPosition(new Vector(3,  0),  0);
  b2.setVelocity(new Vector(-1.5,  0),  0);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/**With simultaneous collision handling, all the balls are moving after the collision
(which is physically wrong, but it is how it should behave).
OCT 2011:  for some unknown reason, the “two hits one asymmetric” multiple collision
test now works identically for all collision solvers.
MAY 2016: I've solved the above problem, see the setup function above.
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test3_0 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test3_0 '+collisionType;
  var sim = new ImpulseSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.two_hits_one_asymmetric_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -2.345, -2, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0.67, 1, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 2.68, 2.5, 0, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/**With serial collision handling, the center ball remains motionless, and
the two balls exchange velocity.
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test3_1 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test3_1 '+collisionType;
  var sim = new ImpulseSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.two_hits_one_asymmetric_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -2.01, -1.5, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0, 0, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 3.015, 3, 0, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** 'one hits two separate':  a moving block hits two separated balls simultaneously.
The result depends on the type of collision handling used.
Because there are no static contacts, but only two dynamic collisions, we can use
ImpulseSim here (don't need to use ContactSim).
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.one_hits_two_separate_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var b0 = Shapes.makeBlock(1, 3, 'block0');
  b0.setPosition(new Vector(-4,  0),  0); // could modify angle slightly here
  b0.setVelocity(new Vector(3,  0),  0);
  b0.setMass(2);
  sim.addBody(b0);
  var b1 = Shapes.makeBall(0.5, 'ball1');
  b1.setPosition(new Vector(0,  1),  0);
  sim.addBody(b1);
  var b2 = Shapes.makeBall(0.5, 'ball2');
  b2.setPosition(new Vector(0,  -1),  0);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/**
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test4_0 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test4_0 '+collisionType;
  var sim = new ImpulseSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.one_hits_two_separate_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -1.005, 0, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 3.005, 3, 1, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 3.005, 3, -1, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/**
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test4_1 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test4_1 '+collisionType;
  var sim = new ImpulseSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.one_hits_two_separate_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -0.9981859, 0.0068027, 0, 0, 0.1635374, 0.1632653);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 3.1344671, 3.1292517, 1, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 2.8619048, 2.8571429, -1, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/**  'one hits two on wall':  two balls (or blocks) are in stationary contact with
a wall (infinite mass);  a third ball collides into them from the left;  the result
is usually that the ball just bounces off and the two balls stay in stationary contact.
The exception is when using serial collision handling and square blocks instead of
round balls (because then the two corner collisions on the blocks are handled
serially instead of simultaneously).
Because this test involves resting contacts, we must use ContactSim.
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@param {boolean} balls  true gives round balls, false gives square blocks
*/
MultipleCollisionTest.test5_prep = function(sim, advance, balls) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var radius = 0.5;
  var b0 = balls ? Shapes.makeBall(radius, 'ball0')
                     : Shapes.makeBlock(2*radius, 2*radius, 'block0');
  b0.setPosition(new Vector(-3,  0),  0);
  b0.setVelocity(new Vector(3,  0),  0);
  sim.addBody(b0);
  var b1 = balls ? Shapes.makeBall(radius, 'ball1')
                     : Shapes.makeBlock(2*radius, 2*radius, 'block1');
  b1.setPosition(new Vector(0,  0),  0);
  sim.addBody(b1);
  var b2 = balls ? Shapes.makeBall(radius, 'ball2')
                     : Shapes.makeBlock(2*radius, 2*radius, 'block2');
  b2.setPosition(new Vector(2*radius + MultipleCollisionTest.distanceTol_/2,  0),  0);
  sim.addBody(b2);
  var b3 = Shapes.makeBlock(1, 3, 'wall');
  b3.setMass(Util.POSITIVE_INFINITY);
  b3.setPosition(new Vector(3*radius + 0.5 + MultipleCollisionTest.distanceTol_,  0),  0);
  sim.addBody(b3);
  sim.setElasticity(1.0);
};

/**
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.one_hits_two_on_wall_ball_setup = function(sim, advance) {
  MultipleCollisionTest.test5_prep(sim, advance, MultipleCollisionTest.BALL);
};

/**
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.one_hits_two_on_wall_block_setup = function(sim, advance) {
  MultipleCollisionTest.test5_prep(sim, advance, MultipleCollisionTest.BLOCK);
};

/**
@param {!CollisionHandling} collisionType
@param {boolean} balls  true gives round balls, false gives square blocks
*/
MultipleCollisionTest.test5_0 = function(collisionType, balls) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test5_0 '+collisionType+' balls='+balls;
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.test5_prep(sim, advance, balls);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -5.01, -3, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0, 0, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 1.005, 0, 0, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** 'center spin':  There are two stationary blocks with a third block in between them;
the center block is spinning and will simultaneously hit the other two blocks.
This is similar to the 'one hits two separate' scenario, except its a spinning
block instead of a translating block that causes the collision.
There are no static contacts so either ImpulseSim or ContactSim shows the
same results.
This corresponds to the 'center spin' version of the interactive SimultaneousCollision test.
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.center_spin_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var b0 = Shapes.makeBlock(1, 3, 'block0');
  b0.setPosition(new Vector(0,  0),  0);
  b0.setVelocity(new Vector(0,  0),  2);
  sim.addBody(b0);
  var b1 = Shapes.makeBlock(1, 3, 'block1');
  b1.setPosition(new Vector(2.8,  0),  Math.PI/2);
  sim.addBody(b1);
  var b2 = Shapes.makeBlock(1, 3, 'block2');
  b2.setPosition(new Vector(-2.8,  0),  -Math.PI/2);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/** Serial collision handling case:  non-symmetric result.
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test6_0 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test6_0 '+collisionType;
  var sim = new ImpulseSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.center_spin_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0.1855924, 0.3179762, 0.2040219, 0.3495516, 0.4374322, -0.6771538);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 3.0447046, 0.4192534, 0.269004, 0.4608857, 1.2334118, -0.5780423);
  Engine2DTestRig.setBodyVars(sim, vars, 2, -3.230297, -0.7372296, -0.473026, -0.8104373, -2.1640649, -1.0164494);
  // runUntil=1.0
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** Simultaneous collision handling case:  symmetric result.
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test6_1 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test6_1 '+collisionType;
  var sim = new ImpulseSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.center_spin_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0, 0, 0, 0, 0.3612164, -0.8077347);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 3.1539628, 0.6064458, 0.3891116, 0.6666666, 1.082773, -0.8361323);
  Engine2DTestRig.setBodyVars(sim, vars, 2, -3.1539628, -0.6064458, -0.3891116, -0.6666666, -2.0588196, -0.8361323);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** 'side spin':  There are two stationary blocks in resting contact, with a third block
nearby;  the third block is spinning and will hit one of the two blocks.
This is similar to the 'one hits two' scenario, except its a spinning
block instead of a translating block that causes the collision.
Because this test involves resting contacts, we must use ContactSim.
This corresponds to the 'side spin' version of the interactive SimultaneousCollision test.
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.side_spin_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var b0 = Shapes.makeBlock(1, 3, 'block0');
  b0.setPosition(new Vector(0,  0),  Math.PI/2);
  sim.addBody(b0);
  var b1 = Shapes.makeBlock(1, 3, 'block1');
  b1.setPosition(new Vector(2.8,  1.001),  0);
  b1.setVelocity(new Vector(0,  0),  2);
  sim.addBody(b1);
  var b2 = Shapes.makeBlock(1, 3, 'block2');
  b2.setPosition(new Vector(-2.8,  1.001),  Math.PI/2);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/** Simultaneous collision handling case.
 Note (March 30 2011):  This failed with ContactSim.VELOCITY_TOL = 0.5, so I lowered
  VELOCITY_TOL to 0.05.
 The problem was that energy was increasing after the collision;  the cause was that a contact
 was being detected that had a relatively high velocity of 0.28, and a contact force
 was acting there (and because work = force * distance, there was energy being added as
 the contact was separating).
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test7_0 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test7_0 '+collisionType;
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.side_spin_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  sim.setVelocityTol(0.05);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -0, -0, -0.2407811, -1.1140238, 1.3296854, -1.1155496);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 2.8, 0, 1.2018587, 0.9293143, 1.6380862, 0.3255308);
  Engine2DTestRig.setBodyVars(sim, vars, 2, -2.8, 0, 1.0409225, 0.1847096, 1.6330754, 0.2881469);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** Hybrid collision handling case.
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test7_1 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test7_1 '+collisionType;
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.side_spin_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  sim.setRandomSeed(86161959);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -0, -0, -0.2696156, -1.2474324, 1.4082314, -0.7521404);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 2.8, 0, 1.1939246, 0.8926056, 1.6523821, 0.3916737);
  Engine2DTestRig.setBodyVars(sim, vars, 2, -2.8, 0, 1.077691, 0.3548268, 1.6904343, 0.5535298);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** Serial collision handling case.
@param {!CollisionHandling} collisionType
*/
MultipleCollisionTest.test7_2 = function(collisionType) {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test7_2 '+collisionType;
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.side_spin_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  sim.setRandomSeed(86161959);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -0.0005129, -0.002373, -0.2514185, -1.16324, 1.4220696, -0.6881151);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 2.8005129, 0.002373, 1.1681077, 0.7731586, 1.7396203, 0.7952992);
  Engine2DTestRig.setBodyVars(sim, vars, 2, -2.8, 0, 1.0853108, 0.3900814, 1.7023212, 0.608527);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** Two blocks are connected by a joint and lie on the ground;  a third block collides
into the connected blocks. This is a fairly simple test of joints and contacts during
a collision.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.joint_collision_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var zel = Walls.make(sim, /*width=*/20, /*height=*/10);
  var j1 = Shapes.makeBlock(1, 3, 'joint1');
  j1.setPosition(new Vector(2,  -5 + 0.5 + 0.005),  Math.PI/2);
  var j2 = Shapes.makeBlock(1, 3, 'joint2');
  j2.setPosition(new Vector(4,  -5 + 0.5 + 0.005),  Math.PI/2);
  sim.addBody(j1);
  sim.addBody(j2);
  JointUtil.attachRigidBody(sim,
      j1, /*attach_body=*/new Vector(0, 1.0),
      j2, /*attach_body=*/new Vector(0, -1.0),
      /*normalType=*/CoordType.BODY
    );
  /* move the bodies so their joints line up over each other. */
  sim.alignConnectors();
  var f1 = Shapes.makeBlock(1, 3, 'free1');
  f1.setPosition(new Vector(-6,  -5 + 0.5 + 0.005),  Math.PI/2);
  f1.setVelocity(new Vector(3,  0),  0);
  sim.addBody(f1);
  var gravity = new GravityLaw(4.0, sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.setZeroEnergyLevel(zel + 0.5);
  sim.setElasticity(0.8);
};

/**
@return {undefined}
*/
MultipleCollisionTest.test8_0 = function() {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test8_0';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.joint_collision_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  var vars = Engine2DTestRig.makeVars(6*7);
  Engine2DTestRig.setBodyVars(sim, vars, 4, 5.3468095, 1.3378378, -4.4909991, -0, 1.5708394, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 5, 3.3468392, 1.3378378, -4.4943779, 0, 1.5741319, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 6, -2.1936486, 0.3243243, -4.49445, 0.0000026, 1.5687089, -0.0000012);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/3.5,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/5.5,
               /*expectedVars=*/null, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** Show that get same results with elastic or inelastic joints.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.joint_collision_2_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var j1 = Shapes.makeBlock(1, 3, 'joint1');
  j1.setPosition(new Vector(2,  0),  Math.PI/2);
  var j2 = Shapes.makeBlock(1, 3, 'joint2');
  j2.setPosition(new Vector(0,  0),  Math.PI/2);
  j2.setVelocity(new Vector(3,  0),  0);
  sim.addBody(j1);
  sim.addBody(j2);
  JointUtil.attachRigidBody(sim,
      j1, /*attach_body=*/new Vector(0, 1.0),
      j2, /*attach_body=*/new Vector(0, -1.0),
      /*normalType=*/CoordType.BODY
    );
  /* move the bodies so their joints line up over each other. */
  sim.alignConnectors();
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
  sim.setElasticity(0.8);
};

/**
@return {undefined}
*/
MultipleCollisionTest.test8_1 = function() {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test8_1';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.joint_collision_2_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 6.5, 1.5, -0, -0, 1.5707963, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 4.5, 1.5, 0, 0, 1.5707963, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/3.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

/** Show that get same results with elastic or inelastic joints.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.joint_collision_3_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var j1 = Shapes.makeBlock(1, 3, 'joint1');
  j1.setPosition(new Vector(2,  0),  Math.PI/2);
  sim.addBody(j1);
  var j2 = Shapes.makeBlock(1, 3, 'joint2');
  j2.setPosition(new Vector(0,  0),  Math.PI/2);
  sim.addBody(j2);
  JointUtil.attachRigidBody(sim,
      j1, /*attach_body=*/new Vector(0, 1.0),
      j2, /*attach_body=*/new Vector(0, -1.0),
      /*normalType=*/CoordType.BODY
    );
  /* move the bodies so their joints line up over each other. */
  sim.alignConnectors();
  var f1 = Shapes.makeBall(/*radius=*/0.5, 'free1');
  f1.setPosition(new Vector(-6,  0),  Math.PI/2);
  f1.setVelocity(new Vector(3,  0),  0);
  sim.addBody(f1);
  sim.setElasticity(1.0);
};

/**
@return {undefined}
*/
MultipleCollisionTest.test8_2 = function() {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test8_2';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.joint_collision_3_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 5.3366667, 2, -0, -0, 1.5707963, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 3.3366667, 2, -0, -0, 1.5707963, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, -3.6733333, -1, 0, 0, 1.5707963, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/3.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

/** The simplest case of a 'spinning joint': two bodies connected by a joint, they are
rotating about the joint at different rates. This shows that we are unable to keep
spinning joints tight with just contact force calculations.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.joint_collision_4_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var j1 = Shapes.makeBlock(1, 3, 'joint1');
  j1.setPosition(new Vector(2,  0),  Math.PI/2);
  j1.setVelocity(new Vector(0,  0),  3);
  sim.addBody(j1);
  var j2 = Shapes.makeBlock(1, 3, 'joint2');
  j2.setPosition(new Vector(0,  0),  Math.PI/2);
  j2.setVelocity(new Vector(0,  0),  -5);
  sim.addBody(j2);
  JointUtil.attachRigidBody(sim,
      j1, /*attach_body=*/new Vector(0, 1.0),
      j2, /*attach_body=*/new Vector(0, -1.0),
      /*normalType=*/CoordType.BODY
    );
  /* move the bodies so their joints line up over each other. */
  sim.alignConnectors();
  sim.setElasticity(0.8);
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
};

/**
@return {undefined}
*/
MultipleCollisionTest.test8_3 = function() {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test8_3';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.joint_collision_4_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 1.4983143, 0.2052494, 0.8618191, -0.5534606, 8.9952832, 3.5216341);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0.5016857, -0.2052494, -0.8618191, 0.5534606, -10.0437751, -4.435186);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/3.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

/** Two rectangle blocks are connected by a joint; the blocks are at rest with
a ball object in contact with them on their right;  from left a ball object strikes
the jointed rectangle blocks.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.joint_collision_5_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var distTol = sim.getDistanceTol();
  var body = Shapes.makeBall(0.5, 'body4');
  body.setMass(2);
  body.setPosition(new Vector(1 + distTol/2,  0));
  sim.addBody(body);
  body = Shapes.makeBall(0.5, 'body1');
  body.setMass(2);
  body.setPosition(new Vector(-5,  0),  0);
  body.setVelocity(new Vector(3,  0),  0);
  sim.addBody(body);

  var body2 = Shapes.makeBlock(2, 1, 'body2');
  body2.setPosition(new Vector(-2,  0));
  sim.addBody(body2);

  var body3 = Shapes.makeBlock(2, 1, 'body3');
  body3.setPosition(new Vector(-0.5,  0));
  sim.addBody(body3);

  JointUtil.attachRigidBody(sim,
    body2, /*attach_body1=*/new Vector(0.75, 0),
    body3, /*attach_body2=*/new Vector(-0.75, 0),
    /*normalType=*/CoordType.BODY
    );
  sim.alignConnectors();
  sim.setElasticity(1.0);
};

/**
@return {undefined}
*/
MultipleCollisionTest.test8_5 = function() {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'test8_5';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.joint_collision_5_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  var vars = Engine2DTestRig.makeVars(6*4);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 2.51, 3, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, -3.505, 0, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, -2, 0, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 3, -0.5, 0, 0, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

/** Two balls are inside a rectangular frame. One ball is given a rightward initial
velocity. This causes an infinite series of collisions, but certain settings for the
collision handling can cope with this problem. See Physics Based Animation by Erleben,
et. al. Chapter 6-2 'Multiple Points of Collision'.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.two_in_box_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var distTol = sim.getDistanceTol();
  var body = Shapes.makeFrame(/*width=*/2 + 3*distTol/2 + 0.2,
      /*height=*/1 + 2*distTol/2 + 0.2, /*thickness=*/0.2, 'body1');
  body.setPosition(new Vector(0,  0));
  sim.addBody(body);

  body = Shapes.makeBall(0.5, 'body2');
  body.setPosition(new Vector(-0.5-distTol/4,  0));
  sim.addBody(body);

  body = Shapes.makeBall(0.5, 'body3');
  body.setPosition(new Vector(0.5+distTol/4,  0));
  body.setVelocity(new Vector(3,  0),  0);
  sim.addBody(body);
  sim.setElasticity(1.0);
};

/**
@return {undefined}
*/
MultipleCollisionTest.two_in_box = function() {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'two_in_box';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.two_in_box_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  var vars = Engine2DTestRig.makeVars(6*3);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 1, 1, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0.4975, 1, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 1.5025, 1, 0, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

/** Two balls are inside a rectangular frame. A third ball strikes the frame from left.
This causes an infinite series of collisions, but certain settings for the
collision handling can cope with this problem. See Physics Based Animation by Erleben,
et. al. Chapter 6-2 'Multiple Points of Collision'.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
MultipleCollisionTest.one_hits_two_in_box_setup = function(sim, advance) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  var distTol = sim.getDistanceTol();
  var body = Shapes.makeFrame(/*width=*/2 + 3*distTol/2 + 0.2,
      /*height=*/1 + 2*distTol/2 + 0.2, /*thickness=*/0.2, 'body1');
  body.setPosition(new Vector(0,  0));
  sim.addBody(body);

  body = Shapes.makeBall(0.5, 'body2');
  body.setPosition(new Vector(-0.5-distTol/4,  0));
  sim.addBody(body);

  body = Shapes.makeBall(0.5, 'body3');
  body.setPosition(new Vector(0.5+distTol/4,  0));
  sim.addBody(body);

  body = Shapes.makeBall(0.5, 'body4');
  body.setPosition(new Vector(-5,  0));
  body.setVelocity(new Vector(3,  0),  0);
  sim.addBody(body);
  sim.setElasticity(1.0);
};

/**
@return {undefined}
*/
MultipleCollisionTest.one_hits_two_in_box = function() {
  Engine2DTestRig.testName = MultipleCollisionTest.groupName+'two_in_box';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MultipleCollisionTest.one_hits_two_in_box_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  var vars = Engine2DTestRig.makeVars(6*4);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0.9041667, 1, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0.4016667, 1, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 1.4066667, 1, 0, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 3, -1.7125, 0, 0, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

}); // goog.scope
