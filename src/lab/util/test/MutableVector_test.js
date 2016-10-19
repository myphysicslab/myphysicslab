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

goog.provide('myphysicslab.lab.util.test.MutableVector_test');

goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.util.MutableVector');
goog.require('goog.testing.jsunit');

var testMutableVector = function() {
  var MutableVector = myphysicslab.lab.util.MutableVector;
  var Vector = myphysicslab.lab.util.Vector;
  var v1 = new MutableVector(20, 30);
  assertEquals(20, v1.getX());
  assertEquals(30, v1.getY());
  assertTrue(v1.equals(new Vector(20, 30)));
  var v2 = new Vector(1, 1);
  v1.add(v2);
  assertEquals(21, v1.getX());
  assertEquals(31, v1.getY());
  assertEquals(window, goog.global);  // just an interesting fact to know
  //var v7 = new Vector();  // compile error
  var v3 = MutableVector.copy(v2);
  assertEquals(1.0, v3.getX());
  assertEquals(1.0, v3.getY());
  assertTrue(v3.equals(v2));
  assertTrue(v2.equals(v3));
  v3.multiply(2);
  assertEquals(2.0, v3.getX());
  assertEquals(2.0, v3.getY());
  assertFalse(v3.equals(v2));
  assertFalse(v2.equals(v3));
  assertRoughlyEquals(Math.sqrt(8), v3.length(), 1E-15);
  v3.subtract(v2);
  assertEquals(1.0, v3.getX());
  assertEquals(1.0, v3.getY());
  assertRoughlyEquals(v3.length(), v3.distanceTo(Vector.ORIGIN), 1E-15);
  var v6 = v3.normalize();
  assertRoughlyEquals(1.0, v6.length(), 1E-15);
  assertEquals(v6.getX(), v6.getY());
};
goog.exportProperty(window, 'testMutableVector', testMutableVector);

var testMutableVectorSimilar = function() {
  var MutableVector = myphysicslab.lab.util.MutableVector;
  var v1 = new MutableVector(2, 3, 4);
  var v2 = new MutableVector(2.01, 3.02, 4.015);
  assertTrue(v1.nearEqual(v2, 0.03));
  // because the magnitude of largest number is 4, the actual tolerance used is 0.04
  // see UtilityCore.veryDifferent
  assertTrue(v1.nearEqual(v2, 0.01));
  assertFalse(v1.nearEqual(v2, 0.001));
};
goog.exportProperty(window, 'testMutableVectorSimilar', testMutableVectorSimilar);
