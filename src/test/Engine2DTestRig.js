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

goog.module('myphysicslab.test.Engine2DTestRig');

const ExpectedPerf = goog.require('myphysicslab.test.ExpectedPerf');
const Collision = goog.require('myphysicslab.lab.model.Collision');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const Connector = goog.require('myphysicslab.lab.engine2D.Connector');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const Joint = goog.require('myphysicslab.lab.engine2D.Joint');
const PathJoint = goog.require('myphysicslab.lab.engine2D.PathJoint');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const TestRig = goog.require('myphysicslab.test.TestRig');
const UtilityCollision = goog.require('myphysicslab.lab.engine2D.UtilityCollision');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Static class that provides common test functions such as `runTest`.

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
class Engine2DTestRig {
/**
* @private
*/
constructor() {
  throw '';
};

/** Sets the name of current test.
* @param {string} name name of the current test
*/
static setTestName(name) {
  TestRig.testName = name;
};

/** Returns an array of doubles, all of which are NaN.
@param {number} n  the length of the array
@return {!Array<number>} an array of doubles, all of which are NaN
*/
static makeVars(n) {
  var vars = new Array(n);
  for (var i=0; i<n; i++)
    vars[i] = Util.NaN;
  return vars;
};

/** In an array of state variables for a set of RigidBody's, this sets the
state variables for one RigidBody. This is used to define expected results of
tests.  NOTE:  the simulation must already have the set of bodies added, so that this can
find their index within the VarsList.
@param {!RigidBodySim} sim the RigidBodySim being tested (to find index of body's vars)
@param {!Array<number>} vars the array of state variables for a set of RigidBodys
@param {number} i  index of the body whose state variables are to be set
@param {number} x  horiz position of the body
@param {number} vx horiz velocity of the body
@param {number} y  vertical position of the body
@param {number} vy vertical velocity of the body
@param {number} w  angle of the body
@param {number} vw angular velocity of the body
*/
static setBodyVars(sim, vars, i, x, vx, y, vy, w, vw) {
  var idx = sim.getBody(i).getVarsIndex();
  vars[idx + RigidBodySim.X_] = x;
  vars[idx + RigidBodySim.VX_] = vx;
  vars[idx + RigidBodySim.Y_] = y;
  vars[idx + RigidBodySim.VY_] = vy;
  vars[idx + RigidBodySim.W_] = w;
  vars[idx + RigidBodySim.VW_] = vw;
};

/**  Compares expected variables array to actual variables array from the
simulation, using the given tolerance for the tests.
If any number in the expected array is `NaN` then the test
is not done for that entry.
The length of the expected array can be less than the simulation's array.
If a difference is found, test failure is reported with a message specifying
which variable was out of tolerance.
@param {!RigidBodySim} sim  the simulation to examine
@param {!Array<number>} expected the expected values
@param {number} tolerance the amount of difference allowed before signalling an error
@return {boolean} true if expected results are found or expected results are null
@throws {!Error} if expected results are null, or tolerance is NaN
*/
static checkResult(sim, expected, tolerance) {
  if (expected == null || isNaN(tolerance))
    throw '';
  var passed = true;
  // Find variable with biggest difference to show in error result message
  var idx = -1; // index of variable with error
  var maxDiff = 0; // difference of expected to actual
  /** @type {!Array<number>} */
  var vars = sim.getVarsList().getValues(/*computed=*/true);
  goog.asserts.assert( vars.length >= expected.length );
  for (var i=0; i<expected.length; i++) {
    if (isNaN(expected[i]))
      continue;
    var diff = Math.abs(vars[i] - expected[i]);
    if (diff > tolerance) {
      passed = false;
      if (idx < 0 || diff > maxDiff) {
        idx = i;
        maxDiff = diff;
      }
    }
  }
  if (!passed) {
    Engine2DTestRig.printVars(sim);
    var s = 'vars['+idx+']='+vars[idx]+' != '+expected[idx]
        +' with tolerance='+tolerance
        +' diff='+Util.NF5E(maxDiff);
    TestRig.reportTestResults(false, 'vars', s);
  }
  return passed;
};

/** If the value does not match the expected value, then report a test failure.
* @param {string} message  the failure message
* @param {number} value  the value to test
* @param {number} expected  the expected value
* @param {number} tolerance  how much the value can differ from expected value
*/
static checkValue(message, value, expected, tolerance) {
  if (Math.abs(expected - value) > tolerance) {
    var s = message+' expected='+expected+' actual='+value
                + ' tolerance='+tolerance;
    TestRig.reportTestResults(false, 'value', s);
  }
};

/** Runs the simulation until the given time, then compares the state variables
against the given expected state variables, using the given tolerance. Optionally
checks that energy has been constant from start to finish of the test run. See
{@link #checkResult} for details about specifying the expected results. If any expected
results are given, or the constant energy test is done, then prints a message saying
that the current test has passed.

If expected results are not provided, the simulation is run for the specified time
with no tests being done.  Tests are only done for the expected results provided. For
example, you can give `null` for `expectedVars` but still have energy tests performed.
Or vice versa: give `expectedVars` to be checked, but no expected energy results.

The default value for number of collision searches done is zero. To ignore collision
searches, provide -1 for that argument. If that number of collision searches suddenly
increases, then something has gone wrong with collision time estimation.

Debugging: Set the static class `Engine2DTestRig.debug` variable before running
this to see some debug output: prints state of the first object at each time step, and
then the state of all objects at conclusion of the test.

@param {!RigidBodySim} sim the simulation being tested
@param {!CollisionAdvance} advance  the AdvanceStrategy for
        advancing the simulation thru time
@param {number} runUntil  run the simulation until this time is reached
@param {?Array<number>=} expectedVars  the set of expected state variables, or null
@param {number=} tolerance the maximum allowed difference between expected and actual
       state variables
@param {number=} expectedEnergyDiff  the expected change in total energy, or NaN if
        energy should not be tested
@param {number=} energyTol  maximum allowed difference to expected energy change
@param {number=} expectedCollisions  expected number of collisions, or -1 to not test
        number of collisions
@param {number=} expectedSearches expected number of collision searches, or -1 to
        not test number of collision searches. Default is zero.
*/
static runTest(sim, advance, runUntil, expectedVars, tolerance, expectedEnergyDiff, energyTol, expectedCollisions, expectedSearches) {
  if (sim instanceof ContactSim) {
    sim.setExtraAccelTimeStep(advance.getTimeStep());
  }
  //console.log('Engine2DTestRig.runTest sim='+sim);
  //console.log('Engine2DTestRig.runTest seed='+sim.getRandomSeed());
  expectedVars = goog.isDef(expectedVars) ? expectedVars : null;

  energyTol = goog.isDef(energyTol) ? energyTol : 0;
  expectedCollisions = goog.isDef(expectedCollisions) ? expectedCollisions : -1;
  expectedSearches = goog.isDef(expectedSearches) ? expectedSearches : 0;
  if (Util.DEBUG && Engine2DTestRig.debug) {
    console.log(
      'Engine2DTestRig.runTest expectedEnergyDiff='+Util.NFE(expectedEnergyDiff)
      +' energyTol='+Util.NFE(energyTol)
      +' expectedCollisions='+expectedCollisions);
    // show all the settings on the simulation.
    TestRig.myPrintln(sim.toString());
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

  var e1 = sim.getEnergyInfo().getTotalEnergy();
  var nc1 = advance.getCollisionTotals().getCollisions();
  var bs1 = advance.getCollisionTotals().getSearches();

  if (Engine2DTestRig.debug && !Engine2DTestRig.PRINT_ALL_VARS) {
    // print header that goes with printRigidBody format
    TestRig.myPrintln(' time      X        VX        Y       VY       W      VW     energy');
  }
  var lastReportTime = advance.getTime();
  var advanced = true;

  while (advance.getTime() < runUntil - 0.0000001) {
    if (0 == 1) {
      // turn on debugging at a particular time
      var destTime = advance.getTime() + advance.getTimeStep();
      advance.setDebugLevel(destTime > 2.5251 && destTime < 2.551 ?
          CollisionAdvance.DebugLevel.LOW : CollisionAdvance.DebugLevel.HIGH);
    }
    if (Engine2DTestRig.debug) {
      if (Engine2DTestRig.PRINT_ALL_VARS) {
        console.log(sim.formatVars());
      } else {
        // print variables for one particular RigidBody, plus total energy
        Engine2DTestRig.printRigidBody(sim, 0);
      }
    }

    advance.advance(advance.getTimeStep());
    //console.log(Util.NF7(sim.getTime())
    //    +' Engine2DTestRig.runTest seed='+sim.getRandomSeed());

    // occasionally report collision statistics
    if (0 == 1 && Util.DEBUG && advance.getTime() - lastReportTime >= 1.0) {
      UtilityCollision.printCollisionStatistics();
      lastReportTime = advance.getTime();
    }
  }

  goog.asserts.assert( Math.abs(advance.getTime() - runUntil) < 0.001 );

  var didTest = false;
  var passed = true;
  var s;
  var testType = '';

  // expected variables test
  if (expectedVars != null && goog.isDef(tolerance)) {
    passed = Engine2DTestRig.checkResult(sim, expectedVars, tolerance);
    testType += (testType != '' ? '+' : '') + 'vars';
    didTest = true;
  }

  // expected energy test
  if (goog.isDef(expectedEnergyDiff) && !isNaN(expectedEnergyDiff)) {
    testType += (testType != '' ? '+' : '') + 'energy';
    var e2 = sim.getEnergyInfo().getTotalEnergy();
    var energyEqual = Math.abs(e2 - e1 - expectedEnergyDiff) < energyTol;
    if (!energyEqual) {
      s = 'energy diff='+Util.NF9(e2 - e1)
          +', expected diff='+Util.NF9(expectedEnergyDiff)
          +', energyTol='+energyTol
          +', error='+Util.NF9(e2-e1 - expectedEnergyDiff)
          +', energy='+Util.NF9(e2);
      TestRig.reportTestResults(false, testType, s);
      passed = false;
    }
    didTest = true;
  }

  // expected number of collisions test
  if (expectedCollisions > -1) {
    testType += (testType != '' ? '+' : '') + 'num_collisions';
    var nc2 = advance.getCollisionTotals().getCollisions();
    if (nc2 - nc1 != expectedCollisions) {
      s = 'should have had '+expectedCollisions+' but had '+(nc2 - nc1)+' collisions';
      TestRig.reportTestResults(false, testType, s);
      passed = false;
    }
    didTest = true;
  }
  // number of collision searches test
  if (expectedSearches > -1) {
    testType += (testType != '' ? '+' : '') + 'collision_search';
    var bs2 = advance.getCollisionTotals().getSearches();
    if (bs2 - bs1 != expectedSearches) {
      s = 'should have had '+expectedSearches+' but had '+(bs2 - bs1)
          +' collision searches';
      TestRig.reportTestResults(false, testType, s);
      passed = false;
    }
    didTest = true;
  }
  // Report that the test passed, but only if this was an 'actual' test;
  // (otherwise we are just running the sim without doing any tests.)
  if (passed && didTest) {
    TestRig.reportTestResults(true, testType);
  }
};

/** Run a test which expects a 'failure to advance' to occur, and fails if the
simulation is able to advance thru the entire time.
@param {!CollisionAdvance} advance  the AdvanceStrategy for
    advancing the simulation
@param {number} time  run the simulation until this time is reached, fail if no
    exception has occured by then.
*/
static runExceptionTest(advance, time) {
  var testType = 'exception';
  while (advance.getTime() < (time - 0.0000001)) {
    try {
      advance.advance(advance.getTimeStep());
    } catch (e) {
      // an exception occurred as expected
      TestRig.reportTestResults(true, testType);
      return;
    }
  }
  TestRig.reportTestResults(false, testType,
      'expected exception did not occur');
};

/** Tests that all Joints are near zero distance within the given tolerance.
@param {!ContactSim} sim  the ContactSim to test
@param {number} tolerance the maximum allowed Joint normal distance
*/
static checkTightJoints(sim, tolerance) {
  var joints = sim.getConnectors();
  var len = joints.length;
  if (len > 0) {
    for (var i=0; i<len; i++) {
      var joint = joints[i];
      var dist = joint.getNormalDistance();
      if (Math.abs(dist) > tolerance) {
        TestRig.reportTestResults(false, 'joints', 'joint not tight, tolerance='
            +Util.NF9(tolerance)+' dist='+Util.NF9(dist)+' joint='+joint);
        // stop at first bad joint
        return;
      }
    }
    TestRig.reportTestResults(true, 'joint_tightness');
  }
};

/** Tests that all contacts are close to half-gap distance, within the given tolerance.
@param {!ContactSim} sim  the ContactSim to test
@param {number} tolerance the maximum allowed contact normal distance
*/
static checkContactDistances(sim, tolerance) {
  /** @type {!Array<!Collision>} */
  var contacts = [];
  sim.findCollisions(contacts, sim.getVarsList().getValues(), /*stepSize=*/0);
  var len = contacts.length;
  if (len > 0) {
    for (var i=0; i<len; i++) {
      var c = /** @type {!RigidBodyCollision} */(contacts[i]);
      var d = Math.abs(c.distanceToHalfGap());
      var isClose = d < tolerance;
      if (!isClose) {
        TestRig.reportTestResults(false, 'contact dist',
          'contact is not close, distanceToHalfGap='+Util.NFE(d)
          +' tolerance='+Util.NFE(tolerance)+' contact='+c);
        // stop at first bad contact
        return;
      }
    }
    TestRig.reportTestResults(true, 'contact_distance');
  }
};

/** Print all variables in a format that is easy to copy/paste into test
code.
@param {!RigidBodySim} sim
@private
*/
static printVars(sim) {
  // @todo  fix this for when time is at the front of variable list.
  var X=0, VX=1, Y=2, VY=3, W=4, VW=5;
  var vars = sim.getVarsList().getValues(/*computed=*/true);
  var numBods = sim.getBodies().length;
  for (var i=0; i<numBods; i++) {
    var idx = sim.getBody(i).getVarsIndex();
    TestRig.myPrintln(
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
@param {!RigidBodySim} sim
@param {number} index which body to print
@private
*/
static printRigidBody(sim, index) {
  var vars = sim.getVarsList().getValues(/*computed=*/true);
  var offset = index*6;
  // @todo  fix this for when time is at the front of variable list.
  var X=0, VX=1, Y=2, VY=3, W=4, VW=5;
  TestRig.myPrintln(Util.NF5(sim.getTime())+' '
        +Util.NF5(vars[offset + X])+' '
        +Util.NF5(vars[offset + VX])+' '
        +Util.NF5(vars[offset + Y])+' '
        +Util.NF5(vars[offset + VY])+' '
        +Util.NF5(vars[offset + W])+' '
        +Util.NF5(vars[offset + VW])+' '
        +Util.NF5(sim.getEnergyInfo().getTotalEnergy()));
};

} // end class

/** Turn on this debug flag to see more information from tests.
* @type {boolean}
*/
Engine2DTestRig.debug = false;

/**
* @type {boolean}
* @const
* @private
*/
Engine2DTestRig.PRINT_ALL_VARS = false;

exports = Engine2DTestRig;
