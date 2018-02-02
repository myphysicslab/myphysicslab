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

const Engine2DTestRig = goog.require('myphysicslab.test.Engine2DTestRig');
const VectorTest = goog.require('myphysicslab.lab.util.test.VectorTest');
const Util = goog.require('myphysicslab.lab.util.Util');
const UtilTest = goog.require('myphysicslab.lab.util.test.UtilTest');

/** Runs tests of the [2D Physics Engine Overview](Engine2D.html) using
{@link Engine2DTestRig}.

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
  Engine2DTestRig.startTests();
  VectorTest.test();
  UtilTest.test();
  Engine2DTestRig.schedule(Engine2DTestRig.finishTests);
  Engine2DTestRig.runTests();
};

} // end class

goog.exportSymbol('runTests', UnitTest2.runTests);
exports = UnitTest2;
