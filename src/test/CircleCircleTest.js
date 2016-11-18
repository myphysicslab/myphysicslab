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

goog.provide('myphysicslab.test.CircleCircleTest');

goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.engine2D.CollisionHandling');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.ExtraAccel');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.Gravity2Law');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.model.RungeKutta');
goog.require('myphysicslab.lab.util.RandomLCG');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.test.Engine2DTestRig');
goog.require('myphysicslab.test.TestShapes');
goog.require('myphysicslab.lab.model.DampingLaw');

goog.scope(function() {

var DampingLaw = myphysicslab.lab.model.DampingLaw;
var CollisionAdvance = myphysicslab.lab.model.CollisionAdvance;
var CollisionHandling = myphysicslab.lab.engine2D.CollisionHandling;
var ContactSim = myphysicslab.lab.engine2D.ContactSim;
var DisplayShape = myphysicslab.lab.view.DisplayShape;
var Engine2DTestRig = myphysicslab.test.Engine2DTestRig;
var ExtraAccel = myphysicslab.lab.engine2D.ExtraAccel;
var Gravity2Law = myphysicslab.lab.model.Gravity2Law;
var GravityLaw = myphysicslab.lab.model.GravityLaw;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var NFE = myphysicslab.lab.util.UtilityCore.NFE;
var RandomLCG = myphysicslab.lab.util.RandomLCG;
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var RungeKutta = myphysicslab.lab.model.RungeKutta;
var Shapes = myphysicslab.lab.engine2D.Shapes;
var TestShapes = myphysicslab.test.TestShapes;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;
var Walls = myphysicslab.lab.engine2D.Walls;

/** Tests interactions between circular edges.

@constructor
@final
@struct
@private
*/
myphysicslab.test.CircleCircleTest = function() {};

var CircleCircleTest = myphysicslab.test.CircleCircleTest;

CircleCircleTest.test = function() {
  Engine2DTestRig.schedule(CircleCircleTest.ball_ball_contact);
  Engine2DTestRig.schedule(CircleCircleTest.concave_circle_and_ball);
};

/**
* @type {string}
* @const
*/
CircleCircleTest.groupName = 'CircleCircleTest.';

/**
@param {!myphysicslab.lab.engine2D.ContactSim} sim
@param {!myphysicslab.lab.model.CollisionAdvance} advance
@private
*/
CircleCircleTest.commonSetup1 = function(sim, advance) {
  sim.addForceLaw(new DampingLaw(0, 0.15, sim.getSimList()));
  sim.setDistanceTol(0.01);
  sim.setVelocityTol(0.5);
  sim.setCollisionAccuracy(0.6);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  if (sim instanceof ContactSim) {
    sim.setExtraAccel(ExtraAccel.VELOCITY);
  }
  sim.setRandomSeed(99999);
  advance.setTimeStep(0.025);
  advance.setDiffEqSolver(new RungeKutta(sim));
};

/** Two balls start in contact and in motion, with mutual gravitation. Both balls have
offset center of mass. Energy should be constant with a small enough time step.
@param {!myphysicslab.lab.engine2D.ContactSim} sim
@param {!myphysicslab.lab.model.CollisionAdvance} advance
@export
*/
CircleCircleTest.ball_ball_contact_setup = function(sim, advance) {
  CircleCircleTest.commonSetup1(sim, advance);
  var body0 = Shapes.makeBall(0.75, 'ball1');
  body0.setCenterOfMass(0, 0.2);
  body0.setPosition(new Vector(-0.754,  -0.2),  0);
  body0.setVelocity(new Vector(0,  0),  1.0);
  sim.addBody(body0);
  var body1 = Shapes.makeBall(1, 'ball2');
  body1.setCenterOfMass(0, -0.3);
  body1.setPosition(new Vector(0.95,  0.3),  Math.PI);
  sim.addBody(body1);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
}

/** Tests the ball & ball scenario, that energy is stable and there
are no collisions (after initial collision settles down).
@return {undefined}
@private
*/
CircleCircleTest.ball_ball_contact = function() {
  Engine2DTestRig.testName = CircleCircleTest.groupName+'ball_ball_contact';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleCircleTest.ball_ball_contact_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -0.7845976, 0.0291469, -0.1822277, 0.0576237, 0.6655733, 0.4093619);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0.9805976, -0.0291469, 0.2822277, -0.0576237, 3.4239727, 0.5085931);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -0.5864811, 0.094376, -0.1374326, -0.3109941, -1.0070382, -1.6390627);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0.7824811, -0.094376, 0.2374326, 0.3109941, 6.1598454, 0.562238);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/4.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
               /*expectedCollisions=*/0);
};

/**
@param {!myphysicslab.lab.engine2D.ContactSim} sim
@param {!myphysicslab.lab.model.CollisionAdvance} advance
@export
*/
CircleCircleTest.concave_circle_and_ball_setup = function(sim, advance) {
  CircleCircleTest.commonSetup1(sim, advance);
  var p = TestShapes.makeConcaveCirclePoly();
  p.setPosition(new Vector(0,  -2),  0);
  sim.addBody(p);
  var p2 = Shapes.makeBall(0.5, 'ball');
  p2.setCenterOfMass(0.2, 0);
  p2.setPosition(new Vector(0.5,  -0.22),  0);
  sim.addBody(p2);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
};

/**
@return {undefined}
@private
*/
CircleCircleTest.concave_circle_and_ball = function() {
  Engine2DTestRig.testName = CircleCircleTest.groupName+'concave_circle_and_ball';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleCircleTest.concave_circle_and_ball_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0.1967144, -0.8904188, -1.4219796, 0.1258683, -0.10235, 0.1459626);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0.3032856, 0.8904188, -0.7980204, -0.1258683, -1.8963003, 3.4576941);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/6.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // run for a few more seconds: there should be no more collision searches,
  // and energy should be constant
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/9.0,
               /*expectedVars=*/null, /*tolerance=*/UtilityCore.NaN,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.001,
               /*expectedCollisions=*/0);
};

}); // goog.scope
