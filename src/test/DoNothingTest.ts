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

import { CollisionAdvance } from '../lab/model/CollisionAdvance.js';
import { CollisionHandling } from '../lab/engine2D/CollisionHandling.js';
import { ConstantForceLaw } from '../lab/model/ConstantForceLaw.js';
import { ContactSim } from '../lab/engine2D/ContactSim.js';
import { CoordType } from '../lab/model/CoordType.js';
import { DampingLaw } from '../lab/model/DampingLaw.js';
import { DoNothingApp } from '../sims/engine2D/DoNothingApp.js';
import { DoubleRect } from '../lab/util/DoubleRect.js';
import { ExtraAccel } from '../lab/engine2D/ExtraAccel.js';
import { Force } from '../lab/model/Force.js';
import { RigidBodyCollision } from '../lab/engine2D/RigidBody.js';
import { RotatingTestForce } from '../sims/engine2D/RotatingTestForce.js';
import { RungeKutta } from '../lab/model/RungeKutta.js';
import { Util } from '../lab/util/Util.js';
import { Vector } from '../lab/util/Vector.js';

import { schedule, setTestName, assertTrue, assertLessThan } from './TestRig.js';
import { makeVars, setBodyVars, runTest, runExceptionTest, checkTightJoints }
    from './Engine2DTestRig.js';

const groupName = 'DoNothingTest.';

/** Defines tests involving {@link DoNothingApp}.
*/
export class DoNothingTest {

constructor() { throw ''; };

static test() {
  schedule(DoNothingTest.do_nothing_grinder_test1);
  schedule(DoNothingTest.do_nothing_grinder_test1b);
  schedule(DoNothingTest.do_nothing_grinder_test2);
  schedule(DoNothingTest.do_nothing_variable_test);
  schedule(DoNothingTest.do_nothing_error);
};

/** DoNothingApp with variable rotating force on handle.
@param sim
@param advance
*/
static do_nothing_variable_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
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
  const handle = sim.getBody('handle');
  sim.addForceLaw(new RotatingTestForce(sim, handle, new Vector(0, -3),
    /*magnitude=*/2, /*rotation_rate=*/0.3));
};

/** Test of DoNothingApp with variable rotating force on handle.
This test has many redundant contacts, which activates code in ComputeForces
that looks for singular matrices.
*/
static do_nothing_variable_test(): void {
  setTestName(groupName+'do_nothing_variable_test');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  DoNothingTest.do_nothing_variable_setup(sim, advance);
  const vars = makeVars((4 + 3)*6);
  setBodyVars(sim, vars, 0, -2.350918, -1.4252083, 0.2181222, -0.3159406, -7.2797567, -0.9370725);
  setBodyVars(sim, vars, 1, 0, -0, 1.7390377, -2.5189213, 3.1415927, -0);
  setBodyVars(sim, vars, 2, -2.688075, -1.6296046, -0, 0, 1.5707963, 0);
  setBodyVars(sim, vars, 3, 2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 4, 2.507, 0, -2.507, 0, 0, 0);
  setBodyVars(sim, vars, 5, -2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 6, -2.507, 0, -2.507, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/40.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // check that joints are tight
  checkTightJoints(sim, 0.005);
};

/** Runs the DoNothingApp simulation with a constant force turning
the handle and no damping, so the speed increases to high velocity,
and eventually leads to the simulation failing to find accurate solution.
**TO DO**  Can we find accurate solution here at high speed by reducing
the time step?
@param sim
@param advance
*/
static do_nothing_constant_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
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
  const handle = sim.getBody('handle');
  const f = new Force('turning', handle,
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

Jan 2021: This test shows why DEFER_SINGULAR in ComputeForces is important.
If you modify ComputeForces to print the maximum force at it's conclusion,
then with DEFER_SINGULAR=false there are several places where a huge force is
calculated, like 6500 or 72000 instead of 25.

*/
static do_nothing_grinder_test1(): void {
  setTestName(groupName+'do_nothing_grinder_test1');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  DoNothingTest.do_nothing_constant_setup(sim, advance);
  const vars = makeVars((4 + 3)*6);
  setBodyVars(sim, vars, 0, -2.7257349, -4.1971916, -0.0918363, 2.5622131, 61.0303112, 6.5543294);
  setBodyVars(sim, vars, 1, 0, -0, -0.7321898, 20.4279338, 3.1415927, -0);
  setBodyVars(sim, vars, 2, -3.1166463, -4.7991321, 0, -0, 1.5707963, -0);
  setBodyVars(sim, vars, 3, 2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 4, 2.507, 0, -2.507, 0, 0, 0);
  setBodyVars(sim, vars, 5, -2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 6, -2.507, 0, -2.507, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/20.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  checkTightJoints(sim, 0.005);
  assertLessThan(sim.getMaxForce(), 200);
};

/** Same as do_nothing_constant_setup, but with new joint policy and
 ExtraAccel.VELOCITY_AND_DISTANCE.
@param sim
@param advance
*/
static do_nothing_constant_1b_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
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
  // const x0 = 0.1 * c.distanceToHalfGap();
  // extrab = (2*v0*h + x0)/(h*h)
*/
static do_nothing_grinder_test1b(): void {
  setTestName(groupName+'do_nothing_grinder_test1b');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  DoNothingTest.do_nothing_constant_1b_setup(sim, advance);
  const vars = makeVars((4 + 3)*6);
  setBodyVars(sim, vars, 0, -2.7245937, -4.2309373, -0.0925957, 2.560584, 61.028377, 6.5529456);
  setBodyVars(sim, vars, 1, -0, -0, -0.7382445, 20.4149451, 3.1415927, 0);
  setBodyVars(sim, vars, 2, -3.1153414, -4.8377173, -0, -0, 1.5707963, 0);
  setBodyVars(sim, vars, 3, 2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 4, 2.507, 0, -2.507, 0, 0, 0);
  setBodyVars(sim, vars, 5, -2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 6, -2.507, 0, -2.507, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/20.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // check that joints are reasonably tight
  checkTightJoints(sim, 0.01);
};

/** Confirms that DoNothingApp will coast with near-constant energy.
*/
static do_nothing_grinder_test2(): void {
  setTestName(groupName+'do_nothing_grinder_test2');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  DoNothingTest.do_nothing_constant_setup(sim, advance);
  // run for several seconds with handle force, to get it up to speed.
  runTest(sim, advance, /*runUntil=*/10);
  // turn off the constant handle turning force, and damping
  const fls = sim.getForceLaws();
  for (let i=0; i<fls.length; i++) {
    sim.removeForceLaw(fls[i]);
  }
  const vars = makeVars((4 + 3)*6);
  setBodyVars(sim, vars, 0, 1.8024594, 6.5378506, 0.307294, -0.7887431, 107.5135207, 3.0512303);
  setBodyVars(sim, vars, 1, 0, 0, 2.4499844, -6.2884668, 3.1415927, 0);
  setBodyVars(sim, vars, 2, 2.0609592, 7.4754767, 0, 0, 1.5707963, 0);
  setBodyVars(sim, vars, 3, 2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 4, 2.507, 0, -2.507, 0, 0, 0);
  setBodyVars(sim, vars, 5, -2.507, 0, 2.507, 0, 0, 0);
  setBodyVars(sim, vars, 6, -2.507, 0, -2.507, 0, 0, 0);
  // let it coast for a while, and check that energy is constant
  runTest(sim, advance, /*runUntil=*/40.0,
     /*expectedVars=*/vars, /*tolerance=*/0.00001,
     /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.001,
     /*expectedCollisions=*/-1);
  checkTightJoints(sim, 0.005);
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

Turn on the `CollisionAdvance<RigidBodyCollision>.printJointDistance()` code (change it to print non-joints)
and you can see the contact distances just before the error are unsteady:

    time 48.0250000 0.0020002, 0.0019999, 0.0019998, 0.0020001, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 49.0250000 0.0020002, 0.0019997, 0.0019998, 0.0020003, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 50.0250000 0.0019999, 0.0020004, 0.0019995, 0.0019994, 0.0020001, 0.0019996, 0.0020005, 0.0020006, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 51.0250000 0.0020009, 0.0019994, 0.0019991, 0.0020006, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 52.0250000 0.0020014, 0.0019993, 0.0019986, 0.0020007, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 53.0250000 0.0020019, 0.0019992, 0.0019981, 0.0020008, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 54.0250000 0.0019992, 0.0019936, 0.0020008, 0.0020064, 0.0020000, 0.0020000, 0.0020000, 0.0020000
    time 55.0250000 0.0019889, 0.0019733, 0.0020111, 0.0020267, 0.0020000, 0.0020000, 0.0020000, 0.0020000, 0.0020000, 0.0020000, 0.0020000, 0.0020000

*/
static do_nothing_error(): void {
  setTestName(groupName+'do_nothing_error');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  DoNothingTest.do_nothing_variable_setup(sim, advance);
  sim.setRandomSeed(9872392);
  sim.setExtraAccel(ExtraAccel.NONE);
  advance.setJointSmallImpacts(false);
  runExceptionTest(advance, 100);
};

} // end class
