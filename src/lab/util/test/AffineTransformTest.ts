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

import { AffineTransform } from "../AffineTransform.js";
import { Vector } from "../Vector.js";
import { MutableVector } from "../MutableVector.js";
import { assertEquals, schedule, startTest, assertThrows, assertElementsEquals,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

const groupName = 'AffineTransformTest.';

export default function tests() {
  schedule(testAffineTransform);
};

function testAffineTransform() {
  startTest(groupName+'testAffineTransform');

  const tol = 1E-13;

  // identity
  const a1 = AffineTransform.IDENTITY;
  assertTrue(a1.transform(Vector.ORIGIN).equals(Vector.ORIGIN));

  // translate
  const a2 = AffineTransform.IDENTITY.translate(2, 3);
  assertTrue(a2.transform(0, 0).nearEqual(new Vector(2, 3), tol));
  assertTrue(a2.transform(Vector.ORIGIN).nearEqual(new Vector(2, 3), tol));
  assertTrue(a2.transform(1, 0).nearEqual(new Vector(3, 3), tol));
  assertTrue(a2.transform(Vector.EAST).nearEqual(new Vector(3, 3), tol));
  assertTrue(a2.transform(0, 1).nearEqual(new Vector(2, 4), tol));
  assertTrue(a2.transform(Vector.NORTH).nearEqual(new Vector(2, 4), tol));

  // translate with Vector
  const a3 = AffineTransform.IDENTITY.translate(new MutableVector(2, 3));
  assertTrue(a3.transform(0, 0).nearEqual(new Vector(2, 3), tol));
  assertTrue(a3.transform(Vector.ORIGIN).nearEqual(new Vector(2, 3), tol));
  assertTrue(a3.transform(1, 0).nearEqual(new Vector(3, 3), tol));
  assertTrue(a3.transform(Vector.EAST).nearEqual(new Vector(3, 3), tol));
  assertTrue(a3.transform(new MutableVector(0, 1)).nearEqual(new Vector(2, 4), tol));
  assertTrue(a3.transform(Vector.NORTH).nearEqual(new Vector(2, 4), tol));

  // scale
  const a4 = AffineTransform.IDENTITY.scale(2, 3);
  assertTrue(a4.transform(Vector.ORIGIN).nearEqual(Vector.ORIGIN, tol));
  assertTrue(a4.transform(Vector.NORTH).nearEqual(new Vector(0, 3), tol));
  assertTrue(a4.transform(Vector.EAST).nearEqual(new Vector(2, 0), tol));
  assertTrue(a4.transform(new Vector(1, 1)).nearEqual(new Vector(2, 3), tol));

  // rotate
  const a5 = AffineTransform.IDENTITY.rotate(Math.PI/2);
  assertTrue(a5.transform(Vector.ORIGIN).nearEqual(Vector.ORIGIN, tol));
  assertTrue(a5.transform(Vector.EAST).nearEqual(Vector.NORTH, tol));
  assertTrue(a5.transform(Vector.NORTH).nearEqual(Vector.WEST, tol));
  assertTrue(a5.transform(Vector.WEST).nearEqual(Vector.SOUTH, tol));
  assertTrue(a5.transform(Vector.SOUTH).nearEqual(Vector.EAST, tol));

  // concatenate:  translate followed by rotate
  const rot = AffineTransform.IDENTITY.rotate(Math.PI/2);
  const xlt = AffineTransform.IDENTITY.translate(2, 3);
  const at3 = rot.concatenate(xlt);
  assertTrue(at3.transform(Vector.EAST).nearEqual(
      rot.transform(xlt.transform(Vector.EAST)), tol));
  assertTrue(at3.transform(Vector.EAST).nearEqual(new Vector(-3, 3), tol));

  // concatenate:  rotate followed by translate
  const at4 = xlt.concatenate(rot);
  assertTrue(at4.transform(Vector.EAST).nearEqual(
      xlt.transform(rot.transform(Vector.EAST)), tol));
  assertTrue(at4.transform(Vector.EAST).nearEqual(new Vector(2, 4), tol));

  // these methods require 2 numbers or a GenericVector
  const at5 = new AffineTransform(1, 0, 0, 1, 0, 0);
  assertThrows(() => at5.transform(0));
  assertThrows(() => at5.translate(0));
};
