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

goog.module('myphysicslab.lab.model.test.ConcreteLineTest');

const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class ConcreteLineTest {

static test() {
  schedule(ConcreteLineTest.testConcreteLine);
  schedule(ConcreteLineTest.testConcreteLineSimilar);
};

static testConcreteLine() {
  startTest(ConcreteLineTest.groupName+'testConcreteLine');
  const tol = 1E-15;
  const l0 = new ConcreteLine('line0');
  assertFalse(l0.isMassObject());
  assertEquals('LINE0', l0.getName());
  assertTrue(l0.nameEquals('line0'));
  assertEquals(0, l0.getVector().length());
  const l1 = new ConcreteLine('line1');
  assertEquals('LINE1', l1.getName());
  assertTrue(l1.nameEquals('line1'));
  assertEquals(0, l1.getVector().length());
  l1.setStartPoint(new Vector(2, 0));
  l1.setEndPoint(new Vector(0, 2));
  assertEquals(2, l1.getStartPoint().getX());
  assertEquals(0, l1.getStartPoint().getY());
  assertEquals(0, l1.getEndPoint().getX());
  assertEquals(2, l1.getEndPoint().getY());
  assertRoughlyEquals(Math.sqrt(8), l1.getVector().length(), tol);
  const b1 = l1.getBoundsWorld();
  assertTrue(b1.equals(new DoubleRect(0, 0, 2, 2)));
  const v1 = l1.getVector();
  assertEquals(-2, v1.getX());
  assertEquals(2, v1.getY());
  const l2 = new ConcreteLine('line2', Vector.ORIGIN, new Vector(1, 1));
  assertTrue(l2.nameEquals('line2'));
  assertEquals(0, l2.getStartPoint().getX());
  assertEquals(0, l2.getStartPoint().getY());
  assertEquals(1, l2.getEndPoint().getX());
  assertEquals(1, l2.getEndPoint().getY());
  assertRoughlyEquals(Math.sqrt(2), l2.getVector().length(), tol);
};

static testConcreteLineSimilar() {
  startTest(ConcreteLineTest.groupName+'testConcreteLineSimilar');
  const l1 = new ConcreteLine('line1');
  l1.setStartPoint(new Vector(2, 0));
  l1.setEndPoint(new Vector(0, 2));
  const l2 = new ConcreteLine('line2');
  l2.setStartPoint(new Vector(2.01, 0.01));
  l2.setEndPoint(new Vector(0.02, 2.02));
  assertTrue(l1.similar(l2, 0.021));
  assertFalse(l1.similar(l2, 0.015));
};

} // end class

/**
* @type {string}
* @const
*/
ConcreteLineTest.groupName = 'ConcreteLineTest.';

exports = ConcreteLineTest;
