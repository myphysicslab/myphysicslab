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

goog.module('myphysicslab.test.CircleCircleTest');

const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CollisionHandling = goog.require('myphysicslab.lab.engine2D.CollisionHandling');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const Engine2DTestRig = goog.require('myphysicslab.test.Engine2DTestRig');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const Gravity2Law = goog.require('myphysicslab.lab.model.Gravity2Law');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const RungeKutta = goog.require('myphysicslab.lab.model.RungeKutta');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TestRig = goog.require('myphysicslab.test.TestRig');
const TestShapes = goog.require('myphysicslab.test.TestShapes');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

const makeVars = n => Engine2DTestRig.makeVars(n);
const schedule = testFunc => TestRig.schedule(testFunc);
const setBodyVars = (sim, vars, i, x, vx, y, vy, w, vw) =>
    Engine2DTestRig.setBodyVars(sim, vars, i, x, vx, y, vy, w, vw);
const setTestName = nm => Engine2DTestRig.setTestName(nm);

/** Tests interactions between circular edges.
*/
class CircleCircleTest {
/**
* @private
*/
constructor() { throw ''; };

static test() {
  schedule(CircleCircleTest.ball_ball_contact);
  schedule(CircleCircleTest.concave_circle_and_ball);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@private
*/
static commonSetup1(sim, advance) {
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
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static ball_ball_contact_setup(sim, advance) {
  CircleCircleTest.commonSetup1(sim, advance);
  const body0 = Shapes.makeBall(0.75, 'ball1');
  body0.setCenterOfMass(new Vector(0, 0.2));
  body0.setPosition(new Vector(-0.754,  -0.2),  0);
  body0.setVelocity(new Vector(0,  0),  1.0);
  sim.addBody(body0);
  const body1 = Shapes.makeBall(1, 'ball2');
  body1.setCenterOfMass(new Vector(0, -0.3));
  body1.setPosition(new Vector(0.95,  0.3),  Math.PI);
  sim.addBody(body1);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
  const collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
}

/** Tests the ball & ball scenario, that energy is stable and there
are no collisions (after initial collision settles down).
@return {undefined}
@private
*/
static ball_ball_contact() {
  setTestName(CircleCircleTest.groupName+'ball_ball_contact');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  CircleCircleTest.ball_ball_contact_setup(sim, advance);
  const vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, -0.7845976, 0.0291469, -0.1822277, 0.0576237, 0.6655733, 0.4093619);
  setBodyVars(sim, vars, 1, 0.9805976, -0.0291469, 0.2822277, -0.0576237, 3.4239727, 0.5085931);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001);
  setBodyVars(sim, vars, 0, -0.5864811, 0.094376, -0.1374326, -0.3109941, -1.0070382, -1.6390627);
  setBodyVars(sim, vars, 1, 0.7824811, -0.094376, 0.2374326, 0.3109941, 6.1598454, 0.562238);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/4.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
               /*expectedCollisions=*/0);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static concave_circle_and_ball_setup(sim, advance) {
  CircleCircleTest.commonSetup1(sim, advance);
  const p = TestShapes.makeConcaveCirclePoly();
  p.setPosition(new Vector(0,  -2),  0);
  sim.addBody(p);
  const p2 = Shapes.makeBall(0.5, 'ball');
  p2.setCenterOfMass(new Vector(0.2, 0));
  p2.setPosition(new Vector(0.5,  -0.22),  0);
  sim.addBody(p2);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
};

/**
@return {undefined}
@private
*/
static concave_circle_and_ball() {
  setTestName(CircleCircleTest.groupName+'concave_circle_and_ball');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  CircleCircleTest.concave_circle_and_ball_setup(sim, advance);
  const vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 0.1967144, -0.8904188, -1.4219796, 0.1258683, -0.10235, 0.1459626);
  setBodyVars(sim, vars, 1, 0.3032856, 0.8904188, -0.7980204, -0.1258683, -1.8963003, 3.4576941);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/6.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // run for a few more seconds: there should be no more collision searches,
  // and energy should be constant
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/9.0,
               /*expectedVars=*/null, /*tolerance=*/Util.NaN,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.001,
               /*expectedCollisions=*/0);
};

} // end class

/**
* @type {string}
* @const
*/
CircleCircleTest.groupName = 'CircleCircleTest.';

exports = CircleCircleTest;
