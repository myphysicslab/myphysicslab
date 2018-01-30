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

goog.module('myphysicslab.lab.util.test.Util_test');

goog.require('goog.testing.jsunit');
goog.require('goog.asserts');
const Util = goog.require('myphysicslab.lab.util.Util');

var testUtil = function() {
  // the default tolerance is 1E-14, so large and small numbers should differ
  // at about the 14th decimal place
  assertTrue(Util.veryDifferent(2E-14, 3.1E-14));
  assertFalse(Util.veryDifferent(2E-14, 2.9E-14));
  assertTrue( Util.veryDifferent(1.12345678901234E5, 1.12345678901236E5));
  assertFalse(Util.veryDifferent(1.12345678901234E5, 1.123456789012349E5));
  // Specify size and tolerance
  assertTrue(Util.veryDifferent(2E-10, 3.1E-10, 1E-10));
  assertFalse(Util.veryDifferent(2E-10, 2.9E-10, 1E-10));
  assertTrue( Util.veryDifferent(1.123456789E5, 1.123456790E5, 1E-10, 1E6));
  assertFalse(Util.veryDifferent(1.123456789E5, 1.1234567899E5, 1E-10, 1E6));
  // two small numbers that are different
  var small1 = 1.2345678969481254e-8;
  var small2 = 1.234567893829028e-8;
  assertFalse(Util.veryDifferent(small1, small2));
  assertFalse(Util.veryDifferent(small1, small2, 1e-8, 1e-8));
  assertTrue(Util.veryDifferent(small1, small2, 1e-10, 1e-8));
  assertTrue(Util.veryDifferent(small1, small2, undefined, 1e-8));

  assertEquals('1.12000', Util.NF5(1.12));
  assertEquals('1.001', Util.nf5(1.001));
  assertEquals('1.12', Util.nf5(1.12));
  assertEquals('1.12', Util.nf7(1.12));
  assertEquals('1.001', Util.nf7(1.001));
  assertEquals('1.00100', Util.NF5(1.001));
  assertEquals('2', Util.nf5(2.000));
  assertEquals('2', Util.nf7(2.000));
  assertEquals('2.00000', Util.NF5(2.000));

  assertFalse(isFinite(Util.NaN));
  assertFalse(isFinite(Util.POSITIVE_INFINITY));
  assertFalse(isFinite(Util.NEGATIVE_INFINITY));
  assertTrue(isFinite(1.0));

  assertEquals('00', Util.numToHexChar2(0));
  assertEquals('00', Util.numToHexChar2(0.0001));
  assertEquals('ff', Util.numToHexChar2(1.0));
  assertEquals('ff', Util.numToHexChar2(0.9999));
  assertEquals('f0', Util.numToHexChar2(15/16));
  assertEquals('e0', Util.numToHexChar2(14/16));
  assertEquals('80', Util.numToHexChar2(0.5));
  assertEquals('20', Util.numToHexChar2(0.125));
  assertEquals('10', Util.numToHexChar2(0.125/2));
  assertEquals('e6', Util.numToHexChar2(0.9));
  assertEquals('1a', Util.numToHexChar2(0.1));

  assertEquals('0', Util.numToHexChar1(0));
  assertEquals('0', Util.numToHexChar1(0.0001));
  assertEquals('f', Util.numToHexChar1(1));
  assertEquals('f', Util.numToHexChar1(0.9999));
  assertEquals('f', Util.numToHexChar1(15/16));
  assertEquals('e', Util.numToHexChar1(14/16));
  assertEquals('8', Util.numToHexChar1(0.5));
  assertEquals('2', Util.numToHexChar1(0.125));
  assertEquals('1', Util.numToHexChar1(0.125/2));
  assertEquals('e', Util.numToHexChar1(0.9));
  assertEquals('2', Util.numToHexChar1(0.1));

  assertEquals('#ff0000', Util.colorString6(1, 0, 0));
  assertEquals('#00ff00', Util.colorString6(0, 1, 0));
  assertEquals('#0000ff', Util.colorString6(0, 0, 1));
  assertEquals('#80ff20', Util.colorString6(0.5, 1, 0.125));
  assertEquals('#e6e01a', Util.colorString6(0.9, 14/16, 0.1));

  assertEquals('#f00', Util.colorString3(1, 0, 0));
  assertEquals('#0f0', Util.colorString3(0, 1, 0));
  assertEquals('#00f', Util.colorString3(0, 0, 1));
  assertEquals('#8f2', Util.colorString3(0.5, 1, 0.125));
  assertEquals('#ee2', Util.colorString3(0.9, 14/16, 0.1));

  assertEquals('FOO', Util.toName('foo'));
  assertEquals('FOO2', Util.toName('foo2'));
  assertEquals('FOO_BAR', Util.toName('foo bar'));
  assertEquals('FOO_BAR', Util.toName('foo-bar'));
  assertEquals('FOO_BAR', Util.toName('FOO BAR'));
  assertEquals('FOO_BAR', Util.toName('FOO-BAR'));
  assertEquals('FOO_BAR', Util.toName('FOO_BAR'));

  assertEquals('FOO', Util.validName('FOO'));
  assertEquals('FOO2', Util.validName('FOO2'));
  assertEquals('FOO_BAR', Util.validName('FOO_BAR'));
  assertThrows(function() { Util.validName('1FOO'); });
  assertThrows(function() { Util.validName('foo'); });
  assertThrows(function() { Util.validName('FOO BAR'); });
  assertThrows(function() { Util.validName('FOO-BAR'); });
  assertThrows(function() { Util.validName('FOO+'); });

  var txt = 'abcdefghijklmnopqrstuvwxyz';
  assertEquals('abcd', Util.take(txt, 4));
  assertEquals('wxyz', Util.take(txt, -4));
  assertEquals('abcd', Util.drop(txt, -22));
  assertEquals('wxyz', Util.drop(txt, 22));

  assertThrows(function() { Util.testNumber(NaN); });
  assertEquals(0, Util.testNumber(0));
  assertEquals(Number.POSITIVE_INFINITY,
      Util.testNumber(Number.POSITIVE_INFINITY));
  assertEquals(Number.NEGATIVE_INFINITY,
      Util.testNumber(Number.NEGATIVE_INFINITY));
  assertEquals(0, Util.testFinite(0));
  assertThrows(function() { Util.testFinite(NaN); });
  assertThrows(function() { Util.testFinite(Number.POSITIVE_INFINITY); });
  assertThrows(function() { Util.testFinite(Number.NEGATIVE_INFINITY); });

  assertEquals(1, Util.limitAngle(1));
  assertEquals(-1, Util.limitAngle(-1));
  assertEquals(0, Util.limitAngle(0));
  assertEquals(Math.PI, Util.limitAngle(Math.PI));
  assertEquals(-Math.PI, Util.limitAngle(-Math.PI));
  assertEquals(Math.PI-0.001, Util.limitAngle(Math.PI-0.001));
  assertEquals(-Math.PI+0.001, Util.limitAngle(-Math.PI+0.001));

  assertEquals(1, Util.limitAngle(1 + 2*Math.PI));
  assertEquals(-1, Util.limitAngle(-1 + 2*Math.PI));
  assertEquals(0, Util.limitAngle(0 + 2*Math.PI));
  assertEquals(-Math.PI, Util.limitAngle(Math.PI + 2*Math.PI));
  assertRoughlyEquals(Math.PI-0.001,
      Util.limitAngle(Math.PI-0.001 + 2*Math.PI), 1e-15);
  assertRoughlyEquals(-Math.PI+0.001,
      Util.limitAngle(-Math.PI+0.001 + 2*Math.PI), 1e-15);

  assertEquals(1, Util.limitAngle(1 - 2*Math.PI));
  assertEquals(-1, Util.limitAngle(-1 - 2*Math.PI));
  assertEquals(0, Util.limitAngle(0 - 2*Math.PI));
  assertEquals(Math.PI, Util.limitAngle(-Math.PI - 2*Math.PI));
  assertRoughlyEquals(Math.PI-0.001,
      Util.limitAngle(Math.PI-0.001 - 2*Math.PI), 1e-15);
  assertRoughlyEquals(-Math.PI+0.001,
      Util.limitAngle(-Math.PI+0.001 - 2*Math.PI), 1e-15);

  assertEquals(1, Util.limitAngle(1 + 4*Math.PI));
  assertEquals(-1, Util.limitAngle(-1 + 4*Math.PI));
  assertEquals(0, Util.limitAngle(0 + 4*Math.PI));
  assertEquals(-Math.PI, Util.limitAngle(Math.PI + 4*Math.PI));
  assertRoughlyEquals(Math.PI-0.001,
      Util.limitAngle(Math.PI-0.001 + 4*Math.PI), 1e-15);
  assertRoughlyEquals(-Math.PI+0.001,
      Util.limitAngle(-Math.PI+0.001 + 4*Math.PI), 1e-15);

  assertEquals(1, Util.limitAngle(1 - 4*Math.PI));
  assertEquals(-1, Util.limitAngle(-1 - 4*Math.PI));
  assertEquals(0, Util.limitAngle(0 - 4*Math.PI));
  assertEquals(Math.PI, Util.limitAngle(-Math.PI - 4*Math.PI));
  assertRoughlyEquals(Math.PI-0.001,
      Util.limitAngle(Math.PI-0.001 - 4*Math.PI), 1e-15);
  assertRoughlyEquals(-Math.PI+0.001,
      Util.limitAngle(-Math.PI+0.001 - 4*Math.PI), 1e-15);

  assertTrue(Util.uniqueElements(['1','2','3']));
  assertFalse(Util.uniqueElements(['1','2','3','2']));
  assertTrue(Util.uniqueElements(['1','2','3','2.1']));
  assertTrue(Util.uniqueElements(['1']));
  assertTrue(Util.uniqueElements([]));

  var a = ["red", "green", "blue"];
  assertEquals(a[0], Util.get(a, 0));
  assertEquals(a[1], Util.get(a, 1));
  assertEquals(a[2], Util.get(a, 2));
  assertEquals('orange', Util.set(a, 2, 'orange'));
  assertEquals('orange', Util.get(a, 2));
  assertThrows(function() { Util.set(a, -1, 'marooon'); });
  assertThrows(function() { Util.set(a, 3.1, 'marooon'); });
  assertThrows(function() { Util.get(a, -1); });
  assertThrows(function() { Util.get(a, 3.1); });

  // ensure that goog.asserts is working
  if (!Util.ADVANCED) {
    try {
      var b = 1;
      goog.asserts.assert(1 == 0);
      b = 2;
    } catch(e) {
      //asserts are working
    }
    assertEquals(1, b);
  }
};
goog.exportProperty(window, 'testUtil', testUtil);
