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

goog.provide('myphysicslab.test.PerformanceTests');

goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.test.CircleCircleTest');
goog.require('myphysicslab.test.CircleStraightTest');
goog.require('myphysicslab.test.DoNothingTest');
goog.require('myphysicslab.test.Engine2DTestRig');
goog.require('myphysicslab.test.JointTest');
goog.require('myphysicslab.test.MiscellanyTest');
goog.require('myphysicslab.test.MultipleCollisionTest');
goog.require('myphysicslab.test.PileTest');
goog.require('myphysicslab.test.RopeTest');
goog.require('myphysicslab.test.SpeedTest');
goog.require('myphysicslab.test.StraightStraightTest');

goog.scope(function() {

var CircleCircleTest = myphysicslab.test.CircleCircleTest;
var CircleStraightTest = myphysicslab.test.CircleStraightTest;
var DoNothingTest = myphysicslab.test.DoNothingTest;
var Engine2DTestRig = myphysicslab.test.Engine2DTestRig;
var JointTest = myphysicslab.test.JointTest;
var MiscellanyTest = myphysicslab.test.MiscellanyTest;
var MultipleCollisionTest = myphysicslab.test.MultipleCollisionTest;
var PileTest = myphysicslab.test.PileTest;
var RopeTest = myphysicslab.test.RopeTest;
var SpeedTest = myphysicslab.test.SpeedTest;
var StraightStraightTest = myphysicslab.test.StraightStraightTest;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Runs performance tests of the rigid body physics engine. See
[2D Physics Engine Overview](Engine2D.html). Each test has an expected time, if it
takes significantly longer then a failure is reported.
The function {@link myphysicslab.test.Engine2DTestRig#getPerfLimit} contains the
policy for 'how much longer than expected is a failure'.

The expected time for each test is dependent on the particular machine that the test is
being run on, as well as the browser. The expected running time for the performance
tests are specified in {@link myphysicslab.test.ExpectedPerf}. There is a separate
number there for each combination of machine, browser, and test.

+ **machine name** See {@link myphysicslab.test.Engine2DTestRig#getMachineName} to learn
how to specify the unique name of your particular machine in the file `MachineName.js`.
If `MachineName.js` doesn't exist, then the performance tests will use large default
values for the time limit so that no errors are reported.

+ **browser name** The browser name comes from
{@link myphysicslab.test.Engine2DTestRig#getBrowserName}.

+ **test name** The test name is usually the name of the test function such as
`six_blocks_perf` for {@link myphysicslab.test.StraightStraightTest.six_blocks_perf}.

### To Do: Menu of Machine Names

To run the performance test on devices like iPhone or android where we don't have
control over the file system: select machine name from a menu, and save that machine
name choice in HTML5 local storage. Steps needed to do this:

+ Retrieve the machine name from local storage (this might do away with the
MachineName.js file)

+ Provide a menu of machine name choices gathered from ExpectedPerf. Selecting from the
menu will store that name in local storage (and perhaps reload the page or re-run the
test).


* @constructor
* @final
* @struct
* @private
*/
myphysicslab.test.PerformanceTests = function() {
  throw new Error();
};
var PerformanceTests = myphysicslab.test.PerformanceTests;

/**
* @return {undefined}
* @export
*/
PerformanceTests.runTests = function() {
  Engine2DTestRig.startTests();
  // 'warm up' the test environment by running a non-performance test first.
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_settle);
  StraightStraightTest.testPerformance();
  PileTest.testPerformance();
  MiscellanyTest.testPerformance();
  Engine2DTestRig.schedule(Engine2DTestRig.finishTests);
  Engine2DTestRig.runTests();
};

}); // goog.scope
