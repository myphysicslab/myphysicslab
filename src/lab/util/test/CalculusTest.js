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

goog.module('myphysicslab.lab.util.test.CalculusTest');

goog.require('goog.asserts');
const Calculus = goog.require('myphysicslab.lab.util.Calculus');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class CalculusTest {

static test() {
  schedule(CalculusTest.testCalculus);
};

/**
* @param {number} x
* @return {number}
*/
static testFn(x) {
  return Math.sin(10/x)*100/(x*x);
};
  
static testCalculus() {
  startTest(CalculusTest.groupName+'testCalculus');
  assertRoughlyEquals(-54.40211, CalculusTest.testFn(1), 0.0001);
  assertRoughlyEquals(-1.426014, Calculus.adaptQuad(CalculusTest.testFn, 1, 3, 0.0001), 0.00001);
};

} // end class

/**
* @type {string}
* @const
*/
CalculusTest.groupName = 'CalculusTest.';

exports = CalculusTest;
