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

goog.module('myphysicslab.test.Engine2DTests');

const CircleCircleTest = goog.require('myphysicslab.test.CircleCircleTest');
const CircleStraightTest = goog.require('myphysicslab.test.CircleStraightTest');
const DoNothingTest = goog.require('myphysicslab.test.DoNothingTest');
const JointTest = goog.require('myphysicslab.test.JointTest');
const MiscellanyTest = goog.require('myphysicslab.test.MiscellanyTest');
const MultipleCollisionTest = goog.require('myphysicslab.test.MultipleCollisionTest');
const PileTest = goog.require('myphysicslab.test.PileTest');
const RopeTest = goog.require('myphysicslab.test.RopeTest');
const SpeedTest = goog.require('myphysicslab.test.SpeedTest');
const StraightStraightTest = goog.require('myphysicslab.test.StraightStraightTest');
const TestRig = goog.require('myphysicslab.test.TestRig');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Runs tests of the [2D Physics Engine Overview](Engine2D.html) using
{@link TestRig}.

These tests are mainly useful as a warning that the behavior of the physics engine has
changed. This can happen when changes are made to the physics engine or when browser
behavior changes (because of an update to a browser). These tests don't specify
"correct" behavior, but rather the historical expected behavior.

See [Engine2D Tests](Building.html#engine2dtests) for more information.

`GOOG_DEBUG` flag: Check the makefile to see if it is setting `GOOG_DEBUG` to false
for this test; usually `Util.DEBUG` should be false when this is compiled to avoid
printing lots of debug messages to console.
*/
class Engine2DTests {

/**
* @return {undefined}
* @export
*/
static runTests() {
  TestRig.startTests();
  StraightStraightTest.test();
  CircleStraightTest.test();
  CircleCircleTest.test();
  JointTest.test();
  RopeTest.test();
  MultipleCollisionTest.test();
  PileTest.test();
  MiscellanyTest.test();
  DoNothingTest.test();
  SpeedTest.test();
  TestRig.schedule(TestRig.finishTests);
  TestRig.runTests();
};

} // end class

goog.exportSymbol('runTests', Engine2DTests.runTests);
exports = Engine2DTests;
