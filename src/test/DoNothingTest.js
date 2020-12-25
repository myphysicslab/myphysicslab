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

goog.module('myphysicslab.test.DoNothingTest');

const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CollisionHandling = goog.require('myphysicslab.lab.engine2D.CollisionHandling');
const ConstantForceLaw = goog.require('myphysicslab.lab.model.ConstantForceLaw');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DoNothingApp = goog.require('myphysicslab.sims.engine2D.DoNothingApp');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DTestRig = goog.require('myphysicslab.test.Engine2DTestRig');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const Force = goog.require('myphysicslab.lab.model.Force');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const RotatingTestForce = goog.require('myphysicslab.sims.engine2D.RotatingTestForce');
const RungeKutta = goog.require('myphysicslab.lab.model.RungeKutta');
const TestRig = goog.require('myphysicslab.test.TestRig');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

const makeVars = n => Engine2DTestRig.makeVars(n);
const schedule = testFunc => TestRig.schedule(testFunc);
const setBodyVars = (sim, vars, i, x, vx, y, vy, w, vw) =>
    Engine2DTestRig.setBodyVars(sim, vars, i, x, vx, y, vy, w, vw);
const setTestName = nm => Engine2DTestRig.setTestName(nm);

/** Defines tests involving {@link DoNothingApp}.
*/
class DoNothingTest {
/**
@private
*/
constructor() { throw ''; };

static test() {
  schedule(DoNothingTest.do_nothing_grinder_test1);
  schedule(DoNothingTest.do_nothing_grinder_test1b);
  schedule(DoNothingTest.do_nothing_grinder_test2);
  schedule(DoNothingTest.do_nothing_variable_test);
  schedule(DoNothingTest.do_nothing_error);
};

/** DoNothingApp with variable rotating force on handle.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static do_nothing_variable_setup(sim, advance) {
  sim.addForceLaw(new DampingLaw(0.05, 0.15, sim.getSimList()));
  sim.setDistanceTol(0.01);
  sim.setVelocityTol(0.5);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setShowForces(false);
  sim.setCollisionAccuracy(0.6);
  advance.setDiffEqSolver(new RungeKutta(sim));
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  DoNothingApp.setup(sim, /*tightFit=*/true);
  sim.setElasticity(0.8);
  sim.setSimRect(new DoubleRect(-5, -5, 5, 5));
  // add a rotating force turning the handle
  var handle = sim.getBody('handle');
  sim.addForceLaw(new RotatingTestForce(sim, handle, new Vector(0, -3),
    /*magnitude=*/2, /*rotation_rate=*/0.3));
};

/** Test of DoNothingApp with variable rotating force on handle.
This test has many redundant contacts, which activates code in ComputeForces
that looks for singular matrices.
* @return {undefined}
*/
static do_nothing_variable_test() {
  setTestName(DoNothingTest.groupName+'do_nothing_variable_test');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  DoNothingTest.do_nothing_variable_setup(sim, advance);
  var vars = makeVars((4 + 3)*6);
  setBodyVars(sim, vars, 0, -1.0069176, -1.941661, 0.3746982, -0.1073186, -6.6510389, -0.7431672);
  setBodyVars(sim, vars, 1, -0, 0, 2.9873821, -0.8556268, 3.1415927, 0);
  setBodyVars(sim, vars, 2, -1.1513247, -2.2201244, -0, -0, 1.5707963, 0);
  setBodyVars(sim, vars, 3, 2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 4, 2.507, 0, -2.507, 0, 0, 0);
  setBodyVars(sim, vars, 5, -2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 6, -2.507, 0, -2.507, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/40.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // check that joints are tight
  Engine2DTestRig.checkTightJoints(sim, 0.005);
};

/** Runs the DoNothingApp simulation with a constant force turning
the handle and no damping, so the speed increases to high velocity,
and eventually leads to the simulation failing to find accurate solution.
@todo  Can we find accurate solution here at high speed by reducing
the time step?
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static do_nothing_constant_setup(sim, advance) {
  sim.setDistanceTol(0.01);
  sim.setVelocityTol(0.5);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setShowForces(false);
  sim.setCollisionAccuracy(0.6);
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  advance.setJointSmallImpacts(true);
  advance.setDiffEqSolver(new RungeKutta(sim));
  advance.setTimeStep(0.025);
  DoNothingApp.setup(sim, /*tightFit=*/true);
  sim.setElasticity(0.8);
  sim.setSimRect(new DoubleRect(-5, -5, 5, 5));
  // add a constant force turning the handle
  var handle = sim.getBody('handle');
  var f = new Force('turning', handle,
    /*location=*/new Vector(0, -3), CoordType.BODY,
    /*direction=*/Vector.EAST, CoordType.BODY);
  sim.addForceLaw(new ConstantForceLaw(f));
};

/** Confirm that the DoNothingApp simulation with constant turning force
and high velocity eventually leads to an exception from poor accuracy.

Running past 38 seconds leads to ComputeForces failures.  Previously we had
an 'exception test' to get to this point, but the exception is not happening
reliably as of March 2014.

June 2015: this test is now less stable.  Change to run only 20 seconds.

* @return {undefined}
*/
static do_nothing_grinder_test1() {
  setTestName(DoNothingTest.groupName+'do_nothing_grinder_test1');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  DoNothingTest.do_nothing_constant_setup(sim, advance);
  var vars = makeVars((4 + 3)*6);
  setBodyVars(sim, vars, 0, -2.7257349, -4.1971916, -0.0918363, 2.5622131, 61.0303112, 6.5543294);
  setBodyVars(sim, vars, 1, 0, -0, -0.7321898, 20.4279338, 3.1415927, -0);
  setBodyVars(sim, vars, 2, -3.1166463, -4.7991321, 0, -0, 1.5707963, -0);
  setBodyVars(sim, vars, 3, 2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 4, 2.507, 0, -2.507, 0, 0, 0);
  setBodyVars(sim, vars, 5, -2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 6, -2.507, 0, -2.507, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/20.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  Engine2DTestRig.checkTightJoints(sim, 0.005);
};

/** Same as do_nothing_constant_setup, but with new joint policy and
 ExtraAccel.VELOCITY_AND_DISTANCE.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static do_nothing_constant_1b_setup(sim, advance) {
  DoNothingTest.do_nothing_constant_setup(sim, advance);
  // special joint policy
  advance.setJointSmallImpacts(false);
  sim.setExtraAccel(ExtraAccel.NONE);
};

/** Shows that the DoNothingApp simulation with constant turning force
and high velocity can survive with tight joints using new joint policy.

TO DO:  Check that this is no longer happening.  This was in ContactSim's extraAccel
code for VELOCITY_AND_DISTANCE
  // factor of 0.1 is to slow the distance adjustment, which avoids collisions.
  // See for example DoNothingTest.do_nothing_grinder_test1b which gets
  // lots of collisions without the 0.1 factor
  // var x0 = 0.1 * c.distanceToHalfGap();
  // extrab = (2*v0*h + x0)/(h*h)
* @return {undefined}
*/
static do_nothing_grinder_test1b() {
  setTestName(DoNothingTest.groupName+'do_nothing_grinder_test1b');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  DoNothingTest.do_nothing_constant_1b_setup(sim, advance);
  var vars = makeVars((4 + 3)*6);
  setBodyVars(sim, vars, 0, -2.7245937, -4.2309373, -0.0925957, 2.560584, 61.028377, 6.5529456);
  setBodyVars(sim, vars, 1, -0, -0, -0.7382445, 20.4149451, 3.1415927, 0);
  setBodyVars(sim, vars, 2, -3.1153414, -4.8377173, -0, -0, 1.5707963, 0);
  setBodyVars(sim, vars, 3, 2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 4, 2.507, 0, -2.507, 0, 0, 0);
  setBodyVars(sim, vars, 5, -2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 6, -2.507, 0, -2.507, 0, 0, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/20.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // check that joints are reasonably tight
  Engine2DTestRig.checkTightJoints(sim, 0.01);
};

/** Confirms that DoNothingApp will coast with near-constant energy.
* @return {undefined}
*/
static do_nothing_grinder_test2() {
  setTestName(DoNothingTest.groupName+'do_nothing_grinder_test2');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  DoNothingTest.do_nothing_constant_setup(sim, advance);
  // run for several seconds with handle force, to get it up to speed.
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/10);
  // turn off the constant handle turning force, and damping
  var fls = sim.getForceLaws();
  for (var i=0; i<fls.length; i++) {
    sim.removeForceLaw(fls[i]);
  }
  var vars = makeVars((4 + 3)*6);
  setBodyVars(sim, vars, 0, 1.8024594, 6.5378506, 0.307294, -0.7887431, 107.5135207, 3.0512303);
  setBodyVars(sim, vars, 1, 0, 0, 2.4499844, -6.2884668, 3.1415927, 0);
  setBodyVars(sim, vars, 2, 2.0609592, 7.4754767, 0, 0, 1.5707963, 0);
  setBodyVars(sim, vars, 3, 2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 4, 2.507, 0, -2.507, 0, 0, 0);
  setBodyVars(sim, vars, 5, -2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 6, -2.507, 0, -2.507, 0, 0, 0);
  // let it coast for a while, and check that energy is constant
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/40.0,
     /*expectedVars=*/vars, /*tolerance=*/0.00001,
     /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.001,
     /*expectedCollisions=*/-1);
  Engine2DTestRig.checkTightJoints(sim, 0.005);
};

/** Shows an error discovered on Sept 23, 2015.

TO DO: fix or prevent this error.

DoNothingApp gets stuck when extra
accel is set to 'none', but it is OK when set to anything else, such as 'velocity'.
Must also have `advance.setJointSmallImpacts(false)`.

This test is sensitive to the RandomLCG seed. Sometimes it doesn't get an exception
but still gets wedged (like with seed = 0).

Research so far shows that joint distance is same in those 2 cases. But contact
distances vary between the 2 cases: in the 'velocity' case the contact distances are
steady at 0.00200, forever. In the 'none' case, the contact distances start to vary
starting 7 seconds before the error.

Turn on the `CollisionAdvance.printJointDistance()` code (change it to print non-joints)
and you can see the contact distances just before the error are unsteady:

    time 48.0250000 0.0020002, 0.0019999, 0.0019998, 0.0020001, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 49.0250000 0.0020002, 0.0019997, 0.0019998, 0.0020003, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 50.0250000 0.0019999, 0.0020004, 0.0019995, 0.0019994, 0.0020001, 0.0019996, 0.0020005, 0.0020006, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 51.0250000 0.0020009, 0.0019994, 0.0019991, 0.0020006, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 52.0250000 0.0020014, 0.0019993, 0.0019986, 0.0020007, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 53.0250000 0.0020019, 0.0019992, 0.0019981, 0.0020008, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 54.0250000 0.0019992, 0.0019936, 0.0020008, 0.0020064, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 55.0250000 0.0019889, 0.0019733, 0.0020111, 0.0020267, 0.0020000, 0.0020000, 0.0020000, 0.0020000, 0.0020000, 0.0020000, 0.0020000, 0.0020000

@return {undefined}
*/
static do_nothing_error() {
  setTestName(DoNothingTest.groupName+'do_nothing_error');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  DoNothingTest.do_nothing_variable_setup(sim, advance);
  sim.setRandomSeed(9872392);
  sim.setExtraAccel(ExtraAccel.NONE);
  advance.setJointSmallImpacts(false);
  Engine2DTestRig.runExceptionTest(advance, 100);
};

} // end class

/**
* @type {string}
* @const
*/
DoNothingTest.groupName = 'DoNothingTest.';

exports = DoNothingTest;
