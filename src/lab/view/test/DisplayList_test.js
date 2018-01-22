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

goog.provide('myphysicslab.lab.view.test.DisplayList_test');

goog.require('goog.array');
goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.DisplayShape');

var testDisplayList = function() {
  var tol = 1E-14;
  var DisplayList = myphysicslab.lab.view.DisplayList;
  var DisplayShape = myphysicslab.lab.view.DisplayShape;
  const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
  const Util = goog.module.get('myphysicslab.lab.util.Util');

  var displayList = new DisplayList('TEST');
  assertEquals('TEST', displayList.getName());
  var p1 = PointMass.makeSquare(1);
  var s1 = new DisplayShape(p1);
  var p2 = PointMass.makeSquare(2);
  var s2 = new DisplayShape(p2);
  var p3 = PointMass.makeSquare(3);
  var s3 = new DisplayShape(p3);
  var p4 = PointMass.makeSquare(4);
  var s4 = new DisplayShape(p4);
  var p5 = PointMass.makeSquare(5);
  var s5 = new DisplayShape(p5);
  var p6 = PointMass.makeSquare(6);
  var s6 = new DisplayShape(p6);
  var p7 = PointMass.makeSquare(7);
  var s7 = new DisplayShape(p7);
  var p8 = PointMass.makeSquare(8);
  var s8 = new DisplayShape(p8);
  var s9 = new DisplayShape(PointMass.makeSquare(9));
  var s10 = new DisplayShape(PointMass.makeSquare(10));
  var s11 = new DisplayShape(PointMass.makeSquare(11));
  displayList.add(s1);
  displayList.add(s2);
  assertTrue(displayList.contains(s1));
  assertTrue(displayList.contains(s2));
  assertEquals(2, displayList.length());
  assertEquals(2, displayList.toArray().length);
  assertTrue(goog.array.contains(displayList.toArray(), s1));
  assertTrue(goog.array.contains(displayList.toArray(), s2));
  assertEquals(s1, displayList.find(p1));
  assertEquals(s1, displayList.findShape(p1));
  assertEquals(s2, displayList.find(p2));
  assertEquals(s2, displayList.findShape(p2));
  assertArrayEquals([s1, s2], displayList.toArray());
  s3.setZIndex(-1);
  displayList.add(s3);
  assertArrayEquals([s3, s1, s2], displayList.toArray());
  s4.setZIndex(1);
  displayList.add(s4);
  assertArrayEquals([s3, s1, s2, s4], displayList.toArray());
  displayList.add(s5);
  assertArrayEquals([s3, s1, s2, s5, s4], displayList.toArray());
  s6.setZIndex(-1);
  displayList.prepend(s6);
  assertArrayEquals([s6, s3, s1, s2, s5, s4], displayList.toArray());
  s7.setZIndex(-1);
  displayList.add(s7);
  assertArrayEquals([s6, s3, s7, s1, s2, s5, s4], displayList.toArray());
  s8.setZIndex(1);
  displayList.add(s8);
  assertArrayEquals([s6, s3, s7, s1, s2, s5, s4, s8], displayList.toArray());
  displayList.prepend(s9);
  assertArrayEquals([s6, s3, s7, s9, s1, s2, s5, s4, s8], displayList.toArray());
  s10.setZIndex(1);
  displayList.prepend(s10);
  assertArrayEquals([s6, s3, s7, s9, s1, s2, s5, s10, s4, s8], displayList.toArray());
  displayList.remove(s1);
  assertArrayEquals([s6, s3, s7, s9, s2, s5, s10, s4, s8], displayList.toArray());
  assertEquals(s9, displayList.get(3));
  assertEquals(9, displayList.length());
  assertThrows(function() { displayList.get(-1); });
  assertThrows(function() { displayList.get(9); });
  s10.setZIndex(-1);
  assertArrayEquals([s6, s3, s7, s10, s9, s2, s5, s4, s8], displayList.toArray());
  s10.setZIndex(1);
  assertEquals(s10, displayList.get(6));
  displayList.removeAll();
  assertEquals(0, displayList.length());
};
goog.exportProperty(window, 'testDisplayList', testDisplayList);

