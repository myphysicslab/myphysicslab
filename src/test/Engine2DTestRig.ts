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

import { ExpectedPerf } from './ExpectedPerf.js';
import { CollisionAdvance } from '../lab/model/CollisionAdvance.js';
import { DebugLevel } from '../lab/model/CollisionAdvance.js';
import { ContactSim } from '../lab/engine2D/ContactSim.js';
import { RigidBodyCollision } from '../lab/engine2D/RigidBody.js';
import { RigidBodySim } from '../lab/engine2D/RigidBodySim.js';
import { RB } from '../lab/engine2D/RigidBody.js';
import { reportTestResults, myPrintln } from './TestRig.js';
//import { UtilCollision } from '../lab/engine2D/UtilCollision.js';
import { Util } from '../lab/util/Util.js';

/* Provides common test functions such as `runTest`.

When using these test functions, be sure to set the `testName` class variable.

## Why the testName class property exists

We can't get the name of the current test function from the stack in
Javascript. There are ways to do it, but the Error.stack property is
non-standard (Chrome and Firefox only); and using arguments.callee.caller is standard
but deprecated; and in either case we still have to prevent Google Closure from mangling
the name of the function when compiled.  So it seems to be safer and easier to just
stuff the name of the current test into the testName variable.  Plus, we can add other
information about the test, such as additional test parameters that vary between runs
of the test.
*/

const debug = false;

const PRINT_ALL_VARS = false;

/** Returns an array of doubles, all of which are NaN.
@param n  the length of the array
@return an array of doubles, all of which are NaN
*/
export function makeVars(n: number): number[] {
  const vars = new Array(n);
  for (let i=0; i<n; i++)
    vars[i] = NaN;
  return vars;
};

/** In an array of state variables for a set of RigidBody's, this sets the state
variables for one RigidBody. This is used to define expected results of tests. NOTE:
the simulation must already have the set of bodies added, so that this can find their
index within the VarsList.
@param sim the RigidBodySim being tested (to find index of body's vars)
@param vars the array of state variables for a set of RigidBodys
@param i  index of the body whose state variables are to be set
@param x  horiz position of the body
@param vx horiz velocity of the body
@param y  vertical position of the body
@param vy vertical velocity of the body
@param w  angle of the body
@param vw angular velocity of the body
*/
export function setBodyVars(sim: RigidBodySim, vars: number[], i: number, x: number, vx: number, y: number, vy: number, w: number, vw: number) {
  const idx = sim.getBody(i).getVarsIndex();
  vars[idx + RB.X_] = x;
  vars[idx + RB.VX_] = vx;
  vars[idx + RB.Y_] = y;
  vars[idx + RB.VY_] = vy;
  vars[idx + RB.W_] = w;
  vars[idx + RB.VW_] = vw;
};

/**  Compares expected variables array to actual variables array from the
simulation, using the given tolerance for the tests.
If any number in the expected array is `NaN` then the test
is not done for that entry.
The length of the expected array can be less than the simulation's array.
If a difference is found, test failure is reported with a message specifying
which variable was out of tolerance.
@param sim  the simulation to examine
@param expected the expected values
@param tolerance the amount of difference allowed before signalling an error
@return true if expected results are found or expected results are null
@throws if expected results are null, or tolerance is NaN
*/
export function checkResult(sim: RigidBodySim, expected: number[], tolerance: number): boolean {
  if (expected == null || isNaN(tolerance))
    throw '';
  let passed = true;
  // Find variable with biggest difference to show in error result message
  let idx = -1; // index of variable with error
  let maxDiff = 0; // difference of expected to actual
  const vars = sim.getVarsList().getValues(/*computed=*/true);
  Util.assert( vars.length >= expected.length );
  for (let i=0; i<expected.length; i++) {
    if (isNaN(expected[i]))
      continue;
    const diff = Math.abs(vars[i] - expected[i]);
    if (diff > tolerance) {
      passed = false;
      if (idx < 0 || diff > maxDiff) {
        idx = i;
        maxDiff = diff;
      }
    }
  }
  if (!passed) {
    printVars(sim);
    const s = 'vars['+idx+']='+vars[idx]+' != '+expected[idx]
        +' with tolerance='+tolerance
        +' diff='+Util.NF5E(maxDiff);
    reportTestResults(false, 'vars', s);
  }
  return passed;
};

/** If the value does not match the expected value, then report a test failure.
* @param message  the failure message
* @param value  the value to test
* @param expected  the expected value
* @param tolerance  how much the value can differ from expected value
*/
export function checkValue(message: string, value: number, expected: number, tolerance: number) {
  if (Math.abs(expected - value) > tolerance) {
    const s = message+' expected='+expected+' actual='+value
                + ' tolerance='+tolerance;
    reportTestResults(false, 'value', s);
  }
};

/** Runs the simulation until the given time, then compares the state variables
against the given expected state variables, using the given tolerance. Optionally
checks that energy has been constant from start to finish of the test run. See
`checkResult` for details about specifying the expected results.
If any expected results are given, or the constant energy test is done, then prints a
message saying that the current test has passed.

If expected results are not provided, the simulation is run for the specified time
with no tests being done.  Tests are only done for the expected results provided. For
example, you can give `null` for `expectedVars` but still have energy tests performed.
Or vice versa: give `expectedVars` to be checked, but no expected energy results.

The default value for number of collision searches done is zero. To ignore collision
searches, provide -1 for that argument. If that number of collision searches suddenly
increases, then something has gone wrong with collision time estimation.

Debugging: Set the `debug` variable before running
this to see some debug output: prints state of the first object at each time step, and
then the state of all objects at conclusion of the test.

@param sim the simulation being tested
@param advance  the AdvanceStrategy for
        advancing the simulation thru time
@param runUntil  run the simulation until this time is reached
@param expectedVars  the set of expected state variables, or null
@param tolerance the maximum allowed difference between expected and actual
       state variables
@param expectedEnergyDiff  the expected change in total energy, or NaN if
        energy should not be tested
@param energyTol  maximum allowed difference to expected energy change
@param expectedCollisions  expected number of collisions, or -1 to not test
        number of collisions
@param expectedSearches expected number of collision searches, or -1 to
        not test number of collision searches. Default is zero.
*/
export function runTest(sim: RigidBodySim,
    advance: CollisionAdvance<RigidBodyCollision>,
    runUntil: number,
    expectedVars?: number[]|null,
    tolerance?: number,
    expectedEnergyDiff?: number,
    energyTol?: number,
    expectedCollisions?: number,
    expectedSearches?: number) {
  if (sim instanceof ContactSim) {
    sim.setExtraAccelTimeStep(advance.getTimeStep());
  }
  //console.log('Engine2DTestRig.runTest sim='+sim);
  //console.log('Engine2DTestRig.runTest seed='+sim.getRandomSeed());
  expectedVars = expectedVars ?? null;

  energyTol = energyTol ?? 0;
  expectedCollisions = expectedCollisions ?? -1;
  expectedSearches = expectedSearches ?? 0;
  expectedEnergyDiff = expectedEnergyDiff ?? NaN;
  if (Util.DEBUG && debug) {
    console.log(
      'Engine2DTestRig.runTest expectedEnergyDiff='+Util.NFE(expectedEnergyDiff)
      +' energyTol='+Util.NFE(energyTol)
      +' expectedCollisions='+expectedCollisions);
    // show all the settings on the simulation.
    myPrintln(sim.toString());
  }
  /*
  console.log('RigidBodySim.getEstimateCollisionTime='
      +sim.getEstimateCollisionTime()
      +' '+TestRig.testName);
  */
  if (advance.getTime() < 1E-12) {
    // This is a kluge to help tests that are looking for 'constant energy'
    // but have initial conditions with small initial velocities.
    // Those tests will get an impulse to zero out normal velocity at contacts;
    // the simulation will lose energy and perhaps report a collision.
    // Therefore, do this advance(0) first, which handles the initial small
    // collisions by applying those contact impulses;
    // then we reset the collision totals, and measure the initial energy
    // after that initial impulse.
    // Note: if you want to record the starting energy outside of this
    // method, you can do runTest with runUntil=0 first, then record the
    // starting energy.
    advance.advance(0);
    advance.getCollisionTotals().reset();
  }

  const e1 = sim.getEnergyInfo().getTotalEnergy();
  const nc1 = advance.getCollisionTotals().getCollisions();
  const bs1 = advance.getCollisionTotals().getSearches();

  if (debug && !PRINT_ALL_VARS) {
    // print header that goes with printRigidBody format
    myPrintln(' time      X        VX        Y       VY       W      VW     energy');
  }
  let lastReportTime = advance.getTime();

  while (advance.getTime() < runUntil - 0.0000001) {
    /*if (0 == 1) {
      // turn on debugging at a particular time
      const destTime = advance.getTime() + advance.getTimeStep();
      advance.setDebugLevel(destTime > 2.5251 && destTime < 2.551 ?
          DebugLevel.LOW : DebugLevel.HIGH);
    }*/
    if (debug) {
      if (PRINT_ALL_VARS) {
        console.log(sim.formatVars());
      } else {
        // print variables for one particular RigidBody, plus total energy
        printRigidBody(sim, 0);
      }
    }

    advance.advance(advance.getTimeStep());
    //console.log(Util.NF7(sim.getTime())
    //    +' Engine2DTestRig.runTest seed='+sim.getRandomSeed());

    // occasionally report collision statistics
    /*if (0 == 1 && Util.DEBUG && advance.getTime() - lastReportTime >= 1.0) {
      UtilCollision.printCollisionStatistics();
      lastReportTime = advance.getTime();
    }*/
  }

  Util.assert( Math.abs(advance.getTime() - runUntil) < 0.001 );

  let didTest = false;
  let passed = true;
  let testType = '';

  // expected variables test
  if (expectedVars != null && tolerance !== undefined) {
    passed = checkResult(sim, expectedVars, tolerance);
    testType += (testType != '' ? '+' : '') + 'vars';
    didTest = true;
  }

  // expected energy test
  if (expectedEnergyDiff !== undefined && !isNaN(expectedEnergyDiff)) {
    testType += (testType != '' ? '+' : '') + 'energy';
    const e2 = sim.getEnergyInfo().getTotalEnergy();
    const energyEqual = Math.abs(e2 - e1 - expectedEnergyDiff) < energyTol;
    if (!energyEqual) {
      const s = 'energy diff='+Util.NF9(e2 - e1)
          +', expected diff='+Util.NF9(expectedEnergyDiff)
          +', energyTol='+energyTol
          +', error='+Util.NF9(e2-e1 - expectedEnergyDiff)
          +', energy='+Util.NF9(e2);
      reportTestResults(false, testType, s);
      passed = false;
    }
    didTest = true;
  }

  // expected number of collisions test
  if (expectedCollisions > -1) {
    testType += (testType != '' ? '+' : '') + 'num_collisions';
    const nc2 = advance.getCollisionTotals().getCollisions();
    if (nc2 - nc1 != expectedCollisions) {
      const s = 'should have had '+expectedCollisions+' but had '+(nc2 - nc1)
          +' collisions';
      reportTestResults(false, testType, s);
      passed = false;
    }
    didTest = true;
  }
  // number of collision searches test
  if (expectedSearches > -1) {
    testType += (testType != '' ? '+' : '') + 'collision_search';
    const bs2 = advance.getCollisionTotals().getSearches();
    if (bs2 - bs1 != expectedSearches) {
      const s = 'should have had '+expectedSearches+' but had '+(bs2 - bs1)
          +' collision searches';
      reportTestResults(false, testType, s);
      passed = false;
    }
    didTest = true;
  }
  // Report that the test passed, but only if this was an 'actual' test;
  // (otherwise we are just running the sim without doing any tests.)
  if (passed && didTest) {
    reportTestResults(true, testType);
  }
};

/** Run a test which expects a 'failure to advance' to occur, and fails if the
simulation is able to advance thru the entire time.
@param advance  the AdvanceStrategy for advancing the simulation
@param time  run the simulation until this time is reached, fail if no
    exception has occured by then.
*/
export function runExceptionTest(advance: CollisionAdvance<RigidBodyCollision>, time: number) {
  const testType = 'exception';
  while (advance.getTime() < (time - 0.0000001)) {
    try {
      advance.advance(advance.getTimeStep());
    } catch (e) {
      // an exception occurred as expected
      reportTestResults(true, testType);
      return;
    }
  }
  reportTestResults(false, testType,
      'expected exception did not occur');
};

/** Tests that all Joints are near zero distance within the given tolerance.
@param sim  the ContactSim to test
@param tolerance the maximum allowed Joint normal distance
*/
export function checkTightJoints(sim: ContactSim, tolerance: number) {
  const joints = sim.getConnectors();
  const len = joints.length;
  if (len > 0) {
    for (let i=0; i<len; i++) {
      const joint = joints[i];
      const dist = joint.getNormalDistance();
      if (Math.abs(dist) > tolerance) {
        reportTestResults(false, 'joints', 'joint not tight, tolerance='
            +Util.NF9(tolerance)+' dist='+Util.NF9(dist)+' joint='+joint);
        // stop at first bad joint
        return;
      }
    }
    reportTestResults(true, 'joint_tightness');
  }
};

/** Tests that all contacts are close to half-gap distance, within the given tolerance.
@param sim  the ContactSim to test
@param tolerance the maximum allowed contact normal distance
*/
export function checkContactDistances(sim: ContactSim, tolerance: number) {
  const contacts: RigidBodyCollision[] = [];
  sim.findCollisions(contacts, sim.getVarsList().getValues(), /*stepSize=*/0);
  const len = contacts.length;
  if (len > 0) {
    for (let i=0; i<len; i++) {
      const c = contacts[i];
      const d = Math.abs(c.distanceToHalfGap());
      const isClose = d < tolerance;
      if (!isClose) {
        reportTestResults(false, 'contact dist',
          'contact is not close, distanceToHalfGap='+Util.NFE(d)
          +' tolerance='+Util.NFE(tolerance)+' contact='+c);
        // stop at first bad contact
        return;
      }
    }
    reportTestResults(true, 'contact_distance');
  }
};

/** Print all variables in a format that is easy to copy/paste into test code.
@param sim
*/
function printVars(sim: RigidBodySim) {
  // **TO DO**  fix this for when time is at the front of variable list.
  const X=0, VX=1, Y=2, VY=3, W=4, VW=5;
  const vars = sim.getVarsList().getValues(/*computed=*/true);
  const numBods = sim.getBodies().length;
  for (let i=0; i<numBods; i++) {
    const idx = sim.getBody(i).getVarsIndex();
    myPrintln(
      'Engine2DTestRig.setBodyVars(sim, vars, '+i+', '
      +Util.nf7(vars[idx + X])+', '
      +Util.nf7(vars[idx + VX])+', '
      +Util.nf7(vars[idx + Y])+', '
      +Util.nf7(vars[idx + VY])+', '
      +Util.nf7(vars[idx + W])+', '
      +Util.nf7(vars[idx + VW])+');'
      );
  }
};

/** print variables for one particular RigidBody, plus total energy
@param sim
@param index which body to print
*/
function printRigidBody(sim: RigidBodySim, index: number) {
  const vars = sim.getVarsList().getValues(/*computed=*/true);
  const offset = index*6;
  // **TO DO**  fix this for when time is at the front of variable list.
  const X=0, VX=1, Y=2, VY=3, W=4, VW=5;
  myPrintln(Util.NF5(sim.getTime())+' '
        +Util.NF5(vars[offset + X])+' '
        +Util.NF5(vars[offset + VX])+' '
        +Util.NF5(vars[offset + Y])+' '
        +Util.NF5(vars[offset + VY])+' '
        +Util.NF5(vars[offset + W])+' '
        +Util.NF5(vars[offset + VW])+' '
        +Util.NF5(sim.getEnergyInfo().getTotalEnergy()));
};
