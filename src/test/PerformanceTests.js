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

goog.module('myphysicslab.test.PerformanceTests');

const CircleCircleTest = goog.require('myphysicslab.test.CircleCircleTest');
const CircleStraightTest = goog.require('myphysicslab.test.CircleStraightTest');
const DoNothingTest = goog.require('myphysicslab.test.DoNothingTest');
const TestRig = goog.require('myphysicslab.test.TestRig');
const JointTest = goog.require('myphysicslab.test.JointTest');
const MiscellanyTest = goog.require('myphysicslab.test.MiscellanyTest');
const MultipleCollisionTest = goog.require('myphysicslab.test.MultipleCollisionTest');
const PileTest = goog.require('myphysicslab.test.PileTest');
const RopeTest = goog.require('myphysicslab.test.RopeTest');
const SpeedTest = goog.require('myphysicslab.test.SpeedTest');
const StraightStraightTest = goog.require('myphysicslab.test.StraightStraightTest');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Runs performance tests of the rigid body physics engine. See
[2D Physics Engine Overview](Engine2D.html). Each test has an expected time, if it
takes significantly longer then a failure is reported.
The function {@link myphysicslab.test.TestRig#getPerfLimit} contains the
policy for 'how much longer than expected is a failure'.

The expected time for each test is dependent on the particular machine that the test is
being run on, as well as the browser. The expected running time for the performance
tests are specified in {@link myphysicslab.test.ExpectedPerf}. There is a separate
number there for each combination of machine, browser, and test.

+ **machine name** See {@link myphysicslab.test.TestRig#getMachineName} to learn
how to specify the unique name of your particular machine in the file `MachineName.js`.
If `MachineName.js` doesn't exist, then the performance tests will use large default
values for the time limit so that no errors are reported.

+ **browser name** The browser name comes from
{@link myphysicslab.test.TestRig#getBrowserName}.

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

*/
class PerformanceTests {
/**
* @private
*/
constructor() {
  throw new Error();
};

/**
* @return {undefined}
* @export
*/
static runTests() {
  TestRig.startTests();
  // 'warm up' the test environment by running a non-performance test first.
  TestRig.schedule(StraightStraightTest.six_blocks_settle);
  StraightStraightTest.testPerformance();
  PileTest.testPerformance();
  MiscellanyTest.testPerformance();
  TestRig.schedule(TestRig.finishTests);
  TestRig.runTests();
};

} // end class

goog.exportSymbol('runTests', PerformanceTests.runTests);
exports = PerformanceTests;
