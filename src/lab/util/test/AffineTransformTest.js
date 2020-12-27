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

goog.module('myphysicslab.lab.util.test.AffineTransformTest');

const Vector = goog.require('myphysicslab.lab.util.Vector');
const MutableVector = goog.require('myphysicslab.lab.util.MutableVector');
const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');

const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class AffineTransformTest {

static test() {
  schedule(AffineTransformTest.testAffineTransform);
};

static testAffineTransform() {
  startTest(AffineTransformTest.groupName+'testAffineTransform');

  var tol = 1E-13;

  // identity
  var at = AffineTransform.IDENTITY;
  assertTrue(at.transform(Vector.ORIGIN).equals(Vector.ORIGIN));

  // translate
  at = AffineTransform.IDENTITY.translate(2, 3);
  assertTrue(at.transform(0, 0).nearEqual(new Vector(2, 3), tol));
  assertTrue(at.transform(Vector.ORIGIN).nearEqual(new Vector(2, 3), tol));
  assertTrue(at.transform(1, 0).nearEqual(new Vector(3, 3), tol));
  assertTrue(at.transform(Vector.EAST).nearEqual(new Vector(3, 3), tol));
  assertTrue(at.transform(0, 1).nearEqual(new Vector(2, 4), tol));
  assertTrue(at.transform(Vector.NORTH).nearEqual(new Vector(2, 4), tol));

  // translate with Vector
  at = AffineTransform.IDENTITY.translate(new MutableVector(2, 3));
  assertTrue(at.transform(0, 0).nearEqual(new Vector(2, 3), tol));
  assertTrue(at.transform(Vector.ORIGIN).nearEqual(new Vector(2, 3), tol));
  assertTrue(at.transform(1, 0).nearEqual(new Vector(3, 3), tol));
  assertTrue(at.transform(Vector.EAST).nearEqual(new Vector(3, 3), tol));
  assertTrue(at.transform(new MutableVector(0, 1)).nearEqual(new Vector(2, 4), tol));
  assertTrue(at.transform(Vector.NORTH).nearEqual(new Vector(2, 4), tol));

  // scale
  at = AffineTransform.IDENTITY.scale(2, 3);
  assertTrue(at.transform(Vector.ORIGIN).nearEqual(Vector.ORIGIN, tol));
  assertTrue(at.transform(Vector.NORTH).nearEqual(new Vector(0, 3), tol));
  assertTrue(at.transform(Vector.EAST).nearEqual(new Vector(2, 0), tol));
  assertTrue(at.transform(new Vector(1, 1)).nearEqual(new Vector(2, 3), tol));

  // rotate
  at = AffineTransform.IDENTITY.rotate(Math.PI/2);
  assertTrue(at.transform(Vector.ORIGIN).nearEqual(Vector.ORIGIN, tol));
  assertTrue(at.transform(Vector.EAST).nearEqual(Vector.NORTH, tol));
  assertTrue(at.transform(Vector.NORTH).nearEqual(Vector.WEST, tol));
  assertTrue(at.transform(Vector.WEST).nearEqual(Vector.SOUTH, tol));
  assertTrue(at.transform(Vector.SOUTH).nearEqual(Vector.EAST, tol));

  // concatenate:  translate followed by rotate
  var rot = AffineTransform.IDENTITY.rotate(Math.PI/2);
  var xlt = AffineTransform.IDENTITY.translate(2, 3);
  var at3 = rot.concatenate(xlt);
  assertTrue(at3.transform(Vector.EAST).nearEqual(
      rot.transform(xlt.transform(Vector.EAST)), tol));
  assertTrue(at3.transform(Vector.EAST).nearEqual(new Vector(-3, 3), tol));

  // concatenate:  rotate followed by translate
  at3 = xlt.concatenate(rot);
  assertTrue(at3.transform(Vector.EAST).nearEqual(
      xlt.transform(rot.transform(Vector.EAST)), tol));
  assertTrue(at3.transform(Vector.EAST).nearEqual(new Vector(2, 4), tol));

  // these methods require 2 numbers or a GenericVector
  var at4 = new AffineTransform(1, 0, 0, 1, 0, 0);
  assertThrows(() => at4.transform(0));
  //assertThrows(() => at4.transform('foo'));
  assertThrows(() => at4.translate(0));
  //assertThrows(() => at4.translate('foo'));
};

} // end class

/**
* @type {string}
* @const
*/
AffineTransformTest.groupName = 'AffineTransformTest.';

exports = AffineTransformTest;
