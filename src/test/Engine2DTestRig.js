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

goog.provide('myphysicslab.test.Engine2DTestRig');

goog.require('myphysicslab.lab.engine2D.Connector');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.Joint');
goog.require('myphysicslab.lab.engine2D.PathJoint');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.RigidBodySim');
goog.require('myphysicslab.lab.engine2D.UtilityCollision');
goog.require('myphysicslab.lab.model.Collision');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.test.ExpectedPerf');

goog.scope(function() {

var Collision = myphysicslab.lab.model.Collision;
var CollisionAdvance = myphysicslab.lab.model.CollisionAdvance;
var Connector = myphysicslab.lab.engine2D.Connector;
var ContactSim = myphysicslab.lab.engine2D.ContactSim;
var Joint = myphysicslab.lab.engine2D.Joint;
var PathJoint = myphysicslab.lab.engine2D.PathJoint;
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var RigidBodySim = myphysicslab.lab.engine2D.RigidBodySim;
var UtilityCollision = myphysicslab.lab.engine2D.UtilityCollision;
const Util = goog.module.get('myphysicslab.lab.util.Util');
var DebugLevel = myphysicslab.lab.model.CollisionAdvance.DebugLevel;

/** Static class that provides common test functions such as `runTest`.

When using these test functions, be sure to set the `testName` class variable.

## Why the testName class property exists

It is crazy that we can't get the name of the current test function from the stack in
Javascript (as we do in Java). There are ways to do it, but the Error.stack property is
non-standard (Chrome and Firefox only); and using arguments.callee.caller is standard
but deprecated; and in either case we still have to prevent Google Closure from mangling
the name of the function when compiled.  So it seems to be safer and easier to just
stuff the name of the current test into the testName variable.  Plus, we can add other
information about the test, such as additional test parameters that vary between runs
of the test.

* @constructor
* @final
* @struct
* @private
*/
myphysicslab.test.Engine2DTestRig = function() {
  throw new Error();
};

var Engine2DTestRig = myphysicslab.test.Engine2DTestRig;

/** ABORT_ON_FAIL = true means generate an exception to immediately stop the tests.
* @type {boolean}
* @const
* @private
*/
Engine2DTestRig.ABORT_ON_FAIL = false;

/** Identifier of Chrome browser.
* @type {string}
* @const
*/
Engine2DTestRig.BROWSER_CHROME = 'Chrome';

/** Identifier of Firefox browser.
* @type {string}
* @const
*/
Engine2DTestRig.BROWSER_FIREFOX = 'Firefox';

/** Identifier of Safari browser.
* @type {string}
* @const
*/
Engine2DTestRig.BROWSER_SAFARI = 'Safari';

/**
* @type {boolean}
* @const
* @private
*/
Engine2DTestRig.PRINT_ALL_VARS = false;

/** Array of tests that have been scheduled to run.
* @type {!Array<!Function>}
*/
Engine2DTestRig.testFns = new Array();

/**  Number of tests that failed.
* @type {number}
*/
Engine2DTestRig.testsFailed = 0;

/**  Output will be written to this Element.  If this is null then
* output goes to window.console.
* @type {?Element}
*/
Engine2DTestRig.output = null;

/** Turn on this debug flag to see more information from tests.
* @type {boolean}
*/
Engine2DTestRig.debug = false;

/** Name of currently running test, for reporting results.
* @type {string}
*/
Engine2DTestRig.testName = '';

/** Name of global variable that gives name of current machine.
* @type {string}
* @const
* @private
*/
Engine2DTestRig.machineName = 'MYPHYSICSLAB_MACHINE_NAME';

/** Returns the name of this machine, which should be stored in the global
* variable `MYPHYSICSLAB_MACHINE_NAME`.  That global is set in the file
* `MachineName.js` (which is not checked in to the source repository, see
* the file `sampleMachineName.js`).
* @return {string} the name of this machine, or `UNKNOWN_MACHINE`
*/
Engine2DTestRig.getMachineName = function() {
  if (window.hasOwnProperty(Engine2DTestRig.machineName)) {
    var s = window[Engine2DTestRig.machineName];
    if (goog.isString(s)) {
      return s;
    }
  }
  if (Util.DEBUG) {
    console.log('Engine2DTestRig.getMachineName: not defined '
        +Engine2DTestRig.machineName);
  }
  return 'UNKNOWN_MACHINE';
};

/** Returns name of the browser we are running under;  returns 'other' for
unrecognized browsers.
* @return {string}
*/
Engine2DTestRig.getBrowserName = function() {
  var nav = navigator;
  if (nav == null)
    return 'unknown';
  if (nav.userAgent.match(/.*Chrome.*/) != null)
    return Engine2DTestRig.BROWSER_CHROME;
  else if (nav.userAgent.match(/.*Firefox.*/) != null)
    return Engine2DTestRig.BROWSER_FIREFOX;
  else if (nav.userAgent.match(/.*Safari.*/) != null)
    return Engine2DTestRig.BROWSER_SAFARI;
  else
    return 'other';
};

/** Returns the length of time that a performance test should take; if the test
* takes longer than this then an error should be reported.
* @param {number} expected the expected length of time
* @return {number} the maximum length of time the test should take in seconds
*/
Engine2DTestRig.getPerfLimit = function(expected) {
  return 1.20 * expected;
};

/** Returns string showing performance test results with the percentage that the test
* was over (or under) the expected time.
* @param {number} duration the actual length of time the test ran in seconds
* @param {number} expected the expected length of time in seconds
* @return {string} string showing performance test results
*/
Engine2DTestRig.perfResult = function(duration, expected) {
  return 'time='+Util.NF2(duration)+' expected='+Util.NF2(expected)
    +'  ('+(Util.NF1S(100*duration/expected - 100))+'%)';
};

/** Returns expected running time for a test by looking up the time in
* {@link myphysicslab.test.ExpectedPerf}, using the current machine name and
* browser.  See {@link #getMachineName} and {@link #getBrowserName}.
* @param {string} testName the name of the test
* @param {number=} defaultTime the default expected running time to use when unable
*     to find expected time
* @return {number} the expected running time in seconds
*/
Engine2DTestRig.perfExpected = function(testName, defaultTime) {
  if (defaultTime === undefined) {
    defaultTime = 10000;
  }
  var machine = Engine2DTestRig.getMachineName();
  var browser = Engine2DTestRig.getBrowserName();
  var compiled = Util.ADVANCED ? 'advanced' : 'simple';
  var e0 = myphysicslab.test.ExpectedPerf;
  goog.asserts.assertObject(e0, 'not an object '+e0);
  var err = 'no expected results for machine: '+machine;
  var e1 = e0[machine];
  if (!goog.isObject(e1)) {
    Engine2DTestRig.myPrintln(err, /*error=*/true);
    return defaultTime;
  }
  err += ', browser: '+browser;
  var e2 = e1[browser];
  if (!goog.isObject(e2)) {
    Engine2DTestRig.myPrintln(err, /*error=*/true);
    return defaultTime;
  }
  err += ', compiled: '+compiled;
  var e3 = e2[compiled];
  if (!goog.isObject(e3)) {
    // 'all' property has results for either advanced or simple compile
    e3 = e2['all'];
    if (!goog.isObject(e3)) {
      Engine2DTestRig.myPrintln(err, /*error=*/true);
      return defaultTime;
    }
  }
  err += ', test: '+testName;
  var e4 = e3[testName];
  if (!goog.isNumber(e4)) {
    Engine2DTestRig.myPrintln(err, /*error=*/true);
    return defaultTime;
  } else {
    return e4;
  }
};

/** Executes the test function; catches and reports errors.
* @param {!Function} testFunc
*/
Engine2DTestRig.runFunction = function(testFunc) {
  try {
    testFunc();
  } catch (e) {
    Engine2DTestRig.testsFailed += 1;
    Engine2DTestRig.myPrintln('***FAILED*** '+Engine2DTestRig.testName
      +' '+e, /*error=*/true);
    Engine2DTestRig.myPrintln(e.stack, /*error=*/true);
  }
};

/** Schedules the test function to be run in a way that will catch and report errors.
Tests will not start until `Engine2DTestRig.runTests` is called.
* @param {!Function} testFunc
*/
Engine2DTestRig.schedule = function(testFunc) {
  Engine2DTestRig.testFns.push(goog.partial(Engine2DTestRig.runFunction, testFunc));
};

/** Run tests that have been scheduled with `Engine2DTestRig.schedule`. There is a small
gap of time between each test so that the browser will update the page to show test
results, and so that the user can interrupt the test.
* @return {undefined}
*/
Engine2DTestRig.runTests = function() {
  var testFunc = Engine2DTestRig.testFns.shift();
  if (goog.isFunction(testFunc)) {
    testFunc();
    setTimeout(Engine2DTestRig.runTests, 50);
  }
};

/** Sets up reporting for a group of tests. Finds an Element named `test_results`
for writing the results.
* @return {undefined}
*/
Engine2DTestRig.startTests = function() {
  Engine2DTestRig.testsFailed = 0;
  // Find the  element to show test results
  var test_results = document.getElementById('test_results');
  if (!goog.isObject(test_results)) {
    throw new Error('<p> element with id="test_results" not found');
  }
  Engine2DTestRig.output = test_results;
  var d = new Date();
  Engine2DTestRig.myPrintln(d.toDateString()+' '+d.toTimeString());
  Engine2DTestRig.myPrintln('compiled '+Util.COMPILE_TIME);
  Engine2DTestRig.myPrintln('machine = '+Engine2DTestRig.getMachineName());
  Engine2DTestRig.myPrintln('browser = '+Engine2DTestRig.getBrowserName());
  // global variable COMPILED is created by goog.base
  if (!COMPILED) {
    Engine2DTestRig.myPrintln('COMPILE_LEVEL = debug (uncompiled)');
  } else {
    Engine2DTestRig.myPrintln('COMPILE_LEVEL = '
      +(Util.ADVANCED ? 'advanced' : 'simple'));
  }
  Engine2DTestRig.myPrintln('goog.DEBUG = '+goog.DEBUG);
  Engine2DTestRig.myPrintln('Util.DEBUG = '+Util.DEBUG);
  Engine2DTestRig.myPrintln('myPhysicsLab version = '+Util.VERSION);
  var nav = navigator;
  if (nav != null) {
    Engine2DTestRig.myPrintln('userAgent = '+nav.userAgent);
    Engine2DTestRig.myPrintln('platform = '+nav.platform);
  }
  if (window['MSSTream']) {
    // http://stackoverflow.com/questions/9038625/detect-if-device-is-ios
    // "Microsoft injected the word iPhone in IE11's userAgent in order to try
    // and fool Gmail somehow."
    Engine2DTestRig.myPrintln('MSStream detected: probably on Internet Explorer'
        +' for Windows Phone');
  }
  if (goog.DEBUG && !Util.ADVANCED) {
    try {
      var a = 1;
      goog.asserts.assert(1 == 0);
      a = 2;
    } catch(e) {
      Engine2DTestRig.myPrintln('asserts are working');
    }
    if (a == 2) {
      throw new Error('asserts are not working');
    }
  } else {
    Engine2DTestRig.myPrintln('NOTE: asserts are NOT enabled');
  }
};

/**  Reports that a group of tests has finished.
* @return {undefined}
*/
Engine2DTestRig.finishTests = function() {
  var f = Engine2DTestRig.testsFailed;
  if (f > 0) {
    Engine2DTestRig.myPrintln('Tests finished -- '+f+' TESTS FAILED', /*error=*/true);
  } else {
    Engine2DTestRig.myPrintln('Tests finished and passed.');
  }
  var d = new Date();
  Engine2DTestRig.myPrintln(d.toDateString()+' '+d.toTimeString());
};

/**  Prints a line of test results to the HTML page.

Tests should schedule themselves to run immediately with setTimeout so that
the test results can be written to the HTML page as they occur.  Otherwise (not using
setTimeout) the page will not refresh until all the tests have finished.

The warning flag is used to make visible those tests that reproduce errors which need
to be fixed.
* @param {string} s the string to print
* @param {boolean=} opt_error if true then string is highlighted as an error
* @param {boolean=} opt_warning if true then string is highlighted as a warning
*/
Engine2DTestRig.myPrintln = function(s, opt_error, opt_warning) {
  console.log(s);
  if (Engine2DTestRig.output != null) {
    if (opt_error) {
      s = '<span class="error">'+s+'</span>';
    }
    if (opt_warning) {
      s = '<span class="warning">'+s+'</span>';
    }
    Engine2DTestRig.output.innerHTML += s + '<br>';
    var docElement = /** @type {!HTMLElement}*/(document.documentElement);
    var documentHeight = docElement.offsetHeight;
    var viewportHeight = window.innerHeight;
    window.scrollTo(0, documentHeight - viewportHeight);
  }
};

/** If the value does not match the expected value, then report a test failure.
* @param {string} message  the failure message
* @param {number} value  the value to test
* @param {number} expected  the expected value
* @param {number} tolerance  how much the value can differ from expected value
*/
Engine2DTestRig.checkValue = function(message, value, expected, tolerance) {
  if (Math.abs(expected - value) > tolerance) {
    var s = message+' expected='+expected+' actual='+value
                + ' tolerance='+tolerance;
    Engine2DTestRig.reportTestResults(false, 'value', s);
  }
};

/** Returns an array of doubles, all of which are NaN.
@param {number} n  the length of the array
@return {!Array<number>} an array of doubles, all of which are NaN
*/
Engine2DTestRig.makeVars = function(n) {
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
Engine2DTestRig.setBodyVars = function(sim, vars, i, x, vx, y, vy, w, vw) {
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
Engine2DTestRig.checkResult = function(sim, expected, tolerance) {
  if (expected == null || isNaN(tolerance))
    throw new Error();
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
    Engine2DTestRig.reportTestResults(false, 'vars', s);
  }
  return passed;
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
Engine2DTestRig.runTest = function(sim, advance, runUntil, expectedVars, tolerance,
      expectedEnergyDiff, energyTol, expectedCollisions, expectedSearches) {
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
    Engine2DTestRig.myPrintln(sim.toString());
  }
  /*
  console.log('RigidBodySim.getEstimateCollisionTime='
      +sim.getEstimateCollisionTime()
      +' '+Engine2DTestRig.testName);
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
    Engine2DTestRig.myPrintln(' time      X        VX        Y       VY       W      VW     energy');
  }
  var lastReportTime = advance.getTime();
  var advanced = true;

  while (advance.getTime() < runUntil - 0.0000001) {
    if (0 == 1) {
      // turn on debugging at a particular time
      var destTime = advance.getTime() + advance.getTimeStep();
      advance.setDebugLevel(destTime > 2.5251 && destTime < 2.551 ?
          DebugLevel.LOW : DebugLevel.HIGH);
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
      Engine2DTestRig.reportTestResults(false, testType, s);
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
      Engine2DTestRig.reportTestResults(false, testType, s);
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
      Engine2DTestRig.reportTestResults(false, testType, s);
      passed = false;
    }
    didTest = true;
  }
  // Report that the test passed, but only if this was an 'actual' test;
  // (otherwise we are just running the sim without doing any tests.)
  if (passed && didTest) {
    Engine2DTestRig.reportTestResults(true, testType);
  }
};

/** The test suite version of `assert`, this prints whether the test passed or
failed, along with the name of the test method; if the test failed, prints the reason
and if `ABORT_ON_FAIL` is true throws an Error.

Some tests reproduce errors which need to be fixed. To make these visible, any test
whose name includes the word 'error' is printed with the 'warning' highlighting.

@param {boolean} passed whether the test passed
@param {string} testType type of test (variables, energy, number of collisions, etc.)
@param {?string=} reason why the test failed: a string giving details of
    test results, or `null`
@throws {!Error} if `passed` is false and `ABORT_ON_FAIL` is true
*/
Engine2DTestRig.reportTestResults = function(passed, testType, reason) {
  var s = Engine2DTestRig.testName+' ['+testType+']';
  if (passed) {
    if (testType == 'performance') {
      s += ' '+reason;
    }
    var warning = Engine2DTestRig.testName.match(/.*error.*/) != null;
    Engine2DTestRig.myPrintln('passed: '+s, /*error=*/false, warning);
  } else {
    Engine2DTestRig.testsFailed += 1;
    Engine2DTestRig.myPrintln('FAILED '+s, /*error=*/true);
    if (goog.isString(reason) && reason.length > 0) {
      Engine2DTestRig.myPrintln(reason, /*error=*/true);
    }
    if (Engine2DTestRig.ABORT_ON_FAIL) {
      throw(new Error());
    }
  }
};

/** Run a test which expects a 'failure to advance' to occur, and fails if the
simulation is able to advance thru the entire time.
@param {!CollisionAdvance} advance  the AdvanceStrategy for
    advancing the simulation
@param {number} time  run the simulation until this time is reached, fail if no
    exception has occured by then.
*/
Engine2DTestRig.runExceptionTest = function(advance, time) {
  var testType = 'exception';
  while (advance.getTime() < (time - 0.0000001)) {
    try {
      advance.advance(advance.getTimeStep());
    } catch (e) {
      // an exception occurred as expected
      Engine2DTestRig.reportTestResults(true, testType);
      return;
    }
  }
  Engine2DTestRig.reportTestResults(false, testType,
      'expected exception did not occur');
};

/** Tests that all Joints are near zero distance within the given tolerance.
@param {!ContactSim} sim  the ContactSim to test
@param {number} tolerance the maximum allowed Joint normal distance
*/
Engine2DTestRig.checkTightJoints = function(sim, tolerance) {
  var joints = sim.getConnectors();
  var len = joints.length;
  if (len > 0) {
    for (var i=0; i<len; i++) {
      var joint = joints[i];
      var dist = joint.getNormalDistance();
      if (Math.abs(dist) > tolerance) {
        Engine2DTestRig.reportTestResults(false, 'joints', 'joint not tight, tolerance='
            +Util.NF9(tolerance)+' dist='+Util.NF9(dist)+' joint='+joint);
        // stop at first bad joint
        return;
      }
    }
    Engine2DTestRig.reportTestResults(true, 'joint_tightness');
  }
};

/** Tests that all contacts are close to half-gap distance, within the given tolerance.
@param {!ContactSim} sim  the ContactSim to test
@param {number} tolerance the maximum allowed contact normal distance
*/
Engine2DTestRig.checkContactDistances = function(sim, tolerance) {
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
        Engine2DTestRig.reportTestResults(false, 'contact dist',
          'contact is not close, distanceToHalfGap='+Util.NFE(d)
          +' tolerance='+Util.NFE(tolerance)+' contact='+c);
        // stop at first bad contact
        return;
      }
    }
    Engine2DTestRig.reportTestResults(true, 'contact_distance');
  }
};

/** Print all variables in a format that is easy to copy/paste into test
code.
@param {!RigidBodySim} sim
@private
*/
Engine2DTestRig.printVars = function(sim) {
  // @todo  fix this for when time is at the front of variable list.
  var X=0, VX=1, Y=2, VY=3, W=4, VW=5;
  var vars = sim.getVarsList().getValues(/*computed=*/true);
  var numBods = sim.getBodies().length;
  for (var i=0; i<numBods; i++) {
    var idx = sim.getBody(i).getVarsIndex();
    Engine2DTestRig.myPrintln(
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
Engine2DTestRig.printRigidBody = function(sim, index) {
  var vars = sim.getVarsList().getValues(/*computed=*/true);
  var offset = index*6;
  // @todo  fix this for when time is at the front of variable list.
  var X=0, VX=1, Y=2, VY=3, W=4, VW=5;
  Engine2DTestRig.myPrintln(Util.NF5(sim.getTime())+' '
        +Util.NF5(vars[offset + X])+' '
        +Util.NF5(vars[offset + VX])+' '
        +Util.NF5(vars[offset + Y])+' '
        +Util.NF5(vars[offset + VY])+' '
        +Util.NF5(vars[offset + W])+' '
        +Util.NF5(vars[offset + VW])+' '
        +Util.NF5(sim.getEnergyInfo().getTotalEnergy()));
};

}); // goog.scope
