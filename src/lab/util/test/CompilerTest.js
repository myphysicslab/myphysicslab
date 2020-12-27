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

goog.module('myphysicslab.lab.util.test.CompilerTest');

const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');
const TestRig = goog.require('myphysicslab.test.TestRig');

class CompilerTest {

static test() {
  TestRig.schedule(CompilerTest.testAffineTransform);
};

/** This demonstrates a bug in Google closure compiler.
The compiler reports for the line "f1 = function() { return at.transform(1, 2) }; "
WARNING - [JSC_CONFORMANCE_VIOLATION] Violation: property reference is typed as “unknown”
The property "transform" on type "module$exports$myphysicslab$lab$util$AffineTransform"
But if you comment out the last line, then the warning disappears.
*/
static testAffineTransform() {
  TestRig.startTest(CompilerTest.groupName+'testAffineTransform');

  var at = new AffineTransform(1, 0, 0, 1, 0, 0);
  var r1 = at.transform(1, 2);
  var f1 = function() { return at.transform(1, 2) };
  // comment out the following line causes the compile warning to not occur
  at = new AffineTransform(1, 0, 0, 1, 0, 0);
};

} // end class

/**
* @type {string}
* @const
*/
CompilerTest.groupName = 'CompilerTest.';

exports = CompilerTest;
