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

goog.module('myphysicslab.lab.model.test.SpringTest');

const Vector = goog.require('myphysicslab.lab.util.Vector');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Util = goog.require('myphysicslab.lab.util.Util');
const MutableVector = goog.require('myphysicslab.lab.util.MutableVector');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class SpringTest {

static test() {
  schedule(SpringTest.testSpring);
  schedule(SpringTest.testSpringCompressOnly);
};

static testSpring() {
  startTest(SpringTest.groupName+'testSpring');
  const tol = 1E-15;
  const p1 = PointMass.makeCircle(1, 'point1').setMass(2);
  p1.setPosition(new Vector(0,  1));
  const p2 = PointMass.makeCircle(1, 'point2').setMass(0.5);
  p2.setPosition(new Vector(2,  0));
  {
    const v1 = new Vector(0, -2);
    const fixedPt = PointMass.makeCircle(1, 'fixed').setMass(Util.POSITIVE_INFINITY);
    fixedPt.setPosition(v1);
    // spring attached to fixed point at v1 and p2
    const s1 = new Spring('spring1',
        fixedPt, Vector.ORIGIN,
        p2, Vector.ORIGIN,
        /*restLength=*/2, /*stiffness=*/12);
    assertFalse(s1.isMassObject());
    assertEquals(Vector.ORIGIN, s1.getAttach1());
    assertEquals(Vector.ORIGIN, s1.getAttach2());
    assertEquals('SPRING1', s1.getName());
    assertTrue(s1.nameEquals('spring1'));
    assertEquals(2, s1.getRestLength());
    assertEquals(12, s1.getStiffness());
    assertRoughlyEquals(Math.sqrt(8), s1.getLength(), tol);
    const stretch = Math.sqrt(8) - 2;
    assertRoughlyEquals(stretch, s1.getStretch(), tol);
    assertRoughlyEquals(6*stretch*stretch, s1.getPotentialEnergy(), tol);
    assertTrue(s1.getStartPoint().equals(v1));
    assertTrue(s1.getEndPoint().equals(p2.getPosition()));
    assertTrue(s1.getAttach2().equals(Vector.ORIGIN));
    // move p2, confirm that spring adjusts
    p2.setPosition(new Vector(1,  0));
    assertEquals(1, s1.getEndPoint().getX());
    assertEquals(0, s1.getEndPoint().getY());
    assertRoughlyEquals(Math.sqrt(5), s1.getLength(), tol);
  }
  {
    // make spring between p1 and p2
    const s1 = new Spring('spring1',
        p1, Vector.ORIGIN,
        p2, Vector.ORIGIN,
        /*restLength=*/2, /*stiffness=*/12);
    assertEquals(Vector.ORIGIN, s1.getAttach1());
    assertEquals(0, s1.getStartPoint().getX());
    assertEquals(1, s1.getStartPoint().getY());
    assertRoughlyEquals(Math.sqrt(2), s1.getLength(), tol);
  }
  {
    // attach at a body-coords position other than (0, 0)
    const s1 = new Spring('spring1',
        p1, new Vector(0, -1),
        p2, Vector.ORIGIN,
        /*restLength=*/2, /*stiffness=*/12);
    assertEquals(0, s1.getStartPoint().getX());
    assertEquals(0, s1.getStartPoint().getY());
  }
  {
    // attach using a Vector for body-coords attach position
    const v2 = new Vector(1, 1);
    const s1 = new Spring('spring1',
        p1, new Vector(0, -1),
        p2, v2,
        /*restLength=*/2, /*stiffness=*/12);
    assertTrue(v2.equals(s1.getAttach2()));
    assertEquals(2, s1.getEndPoint().getX());
    assertEquals(1, s1.getEndPoint().getY());
    assertRoughlyEquals(Math.sqrt(5), s1.getLength(), tol);
  }
  {
    // attach using a MutableVector for the body-coords attachment
    const mv1 = new MutableVector(0, -1);
    const s1 = new Spring('spring1',
        p1, new Vector(0, -1),
        p2, mv1,
        /*restLength=*/2, /*stiffness=*/12);
    assertTrue(mv1.equals(s1.getAttach2()));
    assertEquals(1, s1.getEndPoint().getX());
    assertEquals(-1, s1.getEndPoint().getY());
    assertRoughlyEquals(Math.sqrt(2), s1.getLength(), tol);
  }
};

static testSpringCompressOnly() {
  startTest(SpringTest.groupName+'testSpringCompressOnly');
  const tol = 1E-15;
  const p1 = PointMass.makeCircle(1, 'point1').setMass(2);
  p1.setPosition(new Vector(1,  1));
  const p2 = PointMass.makeCircle(1, 'point2').setMass(0.5);
  p2.setPosition(new Vector(3,  0));
  {
    const v1 = new Vector(0, 0);
    const fixedPt = PointMass.makeCircle(1, 'fixed').setMass(Util.POSITIVE_INFINITY);
    fixedPt.setPosition(v1);
    // spring attached to fixed point at v1 and p2
    const s1 = new Spring('spring1',
        fixedPt, Vector.ORIGIN,
        p2, Vector.ORIGIN,
        /*restLength=*/2, /*stiffness=*/12, /*compressOnly=*/true);
    assertEquals(Vector.ORIGIN, s1.getAttach1());
    assertEquals(Vector.ORIGIN, s1.getAttach2());
    assertEquals('SPRING1', s1.getName());
    assertTrue(s1.nameEquals('spring1'));
    assertEquals(2, s1.getRestLength());
    assertEquals(12, s1.getStiffness());
    assertRoughlyEquals(2, s1.getLength(), tol);
    assertRoughlyEquals(0, s1.getStretch(), tol);
    assertRoughlyEquals(0, s1.getPotentialEnergy(), tol);
    assertEquals(0, s1.getStartPoint().getX());
    assertEquals(0, s1.getStartPoint().getY());
    assertEquals(2, s1.getEndPoint().getX());
    assertEquals(0, s1.getEndPoint().getY());
    // move p2, confirm that spring adjusts.  Here spring is not compressed.
    p2.setPosition(new Vector(2,  2));
    assertRoughlyEquals(2, s1.getLength(), tol);
    assertRoughlyEquals(0, s1.getStretch(), tol);
    assertRoughlyEquals(0, s1.getPotentialEnergy(), tol);
    assertRoughlyEquals(Math.sqrt(2), s1.getEndPoint().getX(), tol);
    assertRoughlyEquals(Math.sqrt(2), s1.getEndPoint().getY(), tol);
    // move p2, so that spring is compressed.
    p2.setPosition(new Vector(0,  1));
    assertRoughlyEquals(1, s1.getLength(), tol);
    assertRoughlyEquals(-1, s1.getStretch(), tol);
    assertRoughlyEquals(6, s1.getPotentialEnergy(), tol);
    assertTrue(s1.getEndPoint().equals(p2.getPosition()));
  }
  {
    // attach spring to p1, so that spring is compressed
    const s1 = new Spring('spring1',
        p1, Vector.ORIGIN,
        p2, Vector.ORIGIN,
        /*restLength=*/2, /*stiffness=*/12, /*compressOnly=*/true);
    assertRoughlyEquals(1, s1.getLength(), tol);
    assertRoughlyEquals(-1, s1.getStretch(), tol);
    assertRoughlyEquals(6, s1.getPotentialEnergy(), tol);
    assertTrue(s1.getEndPoint().equals(p2.getPosition()));
    // move p2, so spring is uncompressed
    p2.setPosition(new Vector(-2,  -2));
    assertRoughlyEquals(2, s1.getLength(), tol);
    assertRoughlyEquals(0, s1.getStretch(), tol);
    assertRoughlyEquals(0, s1.getPotentialEnergy(), tol);
    assertRoughlyEquals(1-Math.sqrt(2), s1.getEndPoint().getX(), tol);
    assertRoughlyEquals(1-Math.sqrt(2), s1.getEndPoint().getY(), tol);
    assertEquals(1, s1.getStartPoint().getX());
    assertEquals(1, s1.getStartPoint().getY());
  }
};

} // end class

/**
* @type {string}
* @const
*/
SpringTest.groupName = 'SpringTest.';

exports = SpringTest;
