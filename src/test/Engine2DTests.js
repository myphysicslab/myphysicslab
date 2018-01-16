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

goog.provide('myphysicslab.test.Engine2DTests');

goog.require('myphysicslab.lab.util.Util');
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
var Util = goog.module.get('myphysicslab.lab.util.Util');

/** Runs tests of the [2D Physics Engine Overview](Engine2D.html) using
{@link Engine2DTestRig}.

`GOOG_DEBUG` flag: Check the makefile to see if it is setting `GOOG_DEBUG` to false
for this test; usually `Util.DEBUG` should be false when this is compiled to avoid
printing lots of debug messages to console.
* @constructor
* @final
* @struct
* @private
*/
myphysicslab.test.Engine2DTests = function() {
  throw new Error();
};
var Engine2DTests = myphysicslab.test.Engine2DTests;

/**
* @return {undefined}
* @export
*/
Engine2DTests.runTests = function() {
  Engine2DTestRig.startTests();
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
  Engine2DTestRig.schedule(Engine2DTestRig.finishTests);
  Engine2DTestRig.runTests();
};

}); // goog.scope
