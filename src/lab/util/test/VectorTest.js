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

goog.module('myphysicslab.lab.util.test.VectorTest');

const Vector = goog.require('myphysicslab.lab.util.Vector');
const MutableVector = goog.require('myphysicslab.lab.util.MutableVector');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class VectorTest {

static test() {
  schedule(VectorTest.testVector);
  schedule(VectorTest.testVectorSimilar);
  schedule(VectorTest.testVectorMath);
};

static testVector() {
  startTest(VectorTest.groupName+'testVector');
  const v1 = new Vector(2.1, 3.2);
  assertEquals(2.1, v1.getX());
  assertEquals(3.2, v1.getY());
  const v2 = new Vector(1, 1);
  assertRoughlyEquals(Math.sqrt(2), v2.length(), 1E-15);
  assertEquals(1.0, v2.getX());
  assertEquals(1.0, v2.getY());
  assertTrue(v2.equals(new MutableVector(1, 1)));
  const v3 = v1.add(v2);
  assertEquals(3.1, v3.getX());
  assertEquals(4.2, v3.getY());
  const v4 = v2.multiply(2);
  assertEquals(2.0, v4.getX());
  assertRoughlyEquals(Math.sqrt(8), v4.length(), 1E-15);
  const v5 = v4.subtract(v4);
  assertEquals(0.0, v5.getX());
  assertEquals(0.0, v5.getY());
  assertTrue(v5.equals(Vector.ORIGIN));
  assertRoughlyEquals(v4.length(), v4.distanceTo(Vector.ORIGIN), 1E-15);
  const v6 = v4.normalize();
  assertRoughlyEquals(1.0, v6.length(), 1E-15);
  assertEquals(v6.getX(), v6.getY());
  const v7 = Vector.clone(v6);
  assertTrue(v7.equals(v6));
  assertTrue(v6.equals(v7));
  assertThrows(() => new Vector(NaN, NaN));
  assertThrows(() => new Vector(1, NaN));
  assertThrows(() => new Vector(NaN, 1));
};

static testVectorSimilar() {
  startTest(VectorTest.groupName+'testVectorSimilar');
  const v1 = new Vector(2, 3);
  const v2 = new Vector(2.01, 3.02);
  // see Util.veryDifferent: tolerance is multiplied by magnitude
  assertTrue(v1.nearEqual(v2, 0.01));
  assertFalse(v1.nearEqual(v2, 0.003));
  assertFalse(v1.nearEqual(v2));
};

static testVectorMath() {
  startTest(VectorTest.groupName+'testVectorMath');
  const v1 = new Vector(2, 3);
  const v2 = new Vector(1, 1);
  assertRoughlyEquals(5, v1.dotProduct(v2), 1E-15);
};

} // end class

/**
* @type {string}
* @const
*/
VectorTest.groupName = 'VectorTest.';

exports = VectorTest;
