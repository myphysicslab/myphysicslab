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

goog.provide('myphysicslab.lab.util.test.AffineTransform_test');

goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.util.MutableVector');
goog.require('myphysicslab.lab.util.AffineTransform');


var testAffineTransform = function() {
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');
  const MutableVector = goog.module.get('myphysicslab.lab.util.MutableVector');
  const AffineTransform = goog.module.get('myphysicslab.lab.util.AffineTransform');

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
  assertThrows(function() { at.transform(0); });
  assertThrows(function() { at.transform('foo'); });
  assertThrows(function() { at.translate(0); });
  assertThrows(function() { at.translate('foo'); });
};
goog.exportProperty(window, 'testAffineTransform', testAffineTransform);
