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

goog.module('myphysicslab.test.UnitTest2');

const AbstractSubjectTest = goog.require('myphysicslab.lab.util.test.AbstractSubjectTest');
const AffineTransformTest = goog.require('myphysicslab.lab.util.test.AffineTransformTest');
const CircularListTest = goog.require('myphysicslab.lab.util.test.CircularListTest');
const ClockTest = goog.require('myphysicslab.lab.util.test.ClockTest');
const ConcreteMemoListTest = goog.require('myphysicslab.lab.util.test.ConcreteMemoListTest');
const DoubleMathTest = goog.require('myphysicslab.lab.util.test.DoubleMathTest');
const DoubleRectTest = goog.require('myphysicslab.lab.util.test.DoubleRectTest');
const EasyScriptParserTest = goog.require('myphysicslab.lab.util.test.EasyScriptParserTest');
const MutableVectorTest = goog.require('myphysicslab.lab.util.test.MutableVectorTest');
const ParameterBooleanTest = goog.require('myphysicslab.lab.util.test.ParameterBooleanTest');
const ParameterNumberTest = goog.require('myphysicslab.lab.util.test.ParameterNumberTest');
const ParameterStringTest = goog.require('myphysicslab.lab.util.test.ParameterStringTest');
const RandomLCGTest = goog.require('myphysicslab.lab.util.test.RandomLCGTest');
const TerminalTest = goog.require('myphysicslab.lab.util.test.TerminalTest');
const TestRig = goog.require('myphysicslab.test.TestRig');
const TimerTest = goog.require('myphysicslab.lab.util.test.TimerTest');
const Util = goog.require('myphysicslab.lab.util.Util');
const UtilTest = goog.require('myphysicslab.lab.util.test.UtilTest');
const VectorTest = goog.require('myphysicslab.lab.util.test.VectorTest');

/** Runs tests of the [2D Physics Engine Overview](Engine2D.html) using
{@link TestRig}.

`GOOG_DEBUG` flag: Check the makefile to see if it is setting `GOOG_DEBUG` to false
for this test; usually `Util.DEBUG` should be false when this is compiled to avoid
printing lots of debug messages to console.
*/
class UnitTest2 {
  
/**
* @return {undefined}
* @export
*/
static runTests() {
  TestRig.startTests();

  AbstractSubjectTest.test();
  AffineTransformTest.test();
  CircularListTest.test();
  ClockTest.test();
  ConcreteMemoListTest.test();
  DoubleMathTest.test();
  DoubleRectTest.test();
  EasyScriptParserTest.test();
  MutableVectorTest.test();
  ParameterBooleanTest.test();
  ParameterNumberTest.test();
  ParameterStringTest.test();
  RandomLCGTest.test();
  TerminalTest.test();
  TimerTest.test();
  UtilTest.test();
  VectorTest.test();

  TestRig.schedule(TestRig.finishTests);
  TestRig.runTests();
};

} // end class

goog.exportSymbol('runTests', UnitTest2.runTests);
exports = UnitTest2;
