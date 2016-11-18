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

goog.provide('myphysicslab.lab.util.test.UtilityCore_test');

goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('goog.testing.jsunit');

var testUtilityCore = function() {
  var UtilityCore = myphysicslab.lab.util.UtilityCore;
  var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
  var nf5 = myphysicslab.lab.util.UtilityCore.nf5;
  var nf7 = myphysicslab.lab.util.UtilityCore.nf7;

  // the default tolerance is 1E-14, so large and small numbers should differ
  // at about the 14th decimal place
  assertTrue(UtilityCore.veryDifferent(2E-14, 3.1E-14));
  assertFalse(UtilityCore.veryDifferent(2E-14, 2.9E-14));
  assertTrue( UtilityCore.veryDifferent(1.12345678901234E5, 1.12345678901236E5));
  assertFalse(UtilityCore.veryDifferent(1.12345678901234E5, 1.123456789012349E5));
  // Specify size and tolerance
  assertTrue(UtilityCore.veryDifferent(2E-10, 3.1E-10, 1E-10));
  assertFalse(UtilityCore.veryDifferent(2E-10, 2.9E-10, 1E-10));
  assertTrue( UtilityCore.veryDifferent(1.123456789E5, 1.123456790E5, 1E-10, 1E6));
  assertFalse(UtilityCore.veryDifferent(1.123456789E5, 1.1234567899E5, 1E-10, 1E6));

  assertEquals('1.12000', UtilityCore.NF5(1.12));
  assertEquals('1.001', UtilityCore.nf5(1.001));
  assertEquals('1.12', UtilityCore.nf5(1.12));
  assertEquals('1.12', UtilityCore.nf7(1.12));
  assertEquals('1.001', UtilityCore.nf7(1.001));
  assertEquals('1.00100', UtilityCore.NF5(1.001));
  assertEquals('2', UtilityCore.nf5(2.000));
  assertEquals('2', UtilityCore.nf7(2.000));
  assertEquals('2.00000', UtilityCore.NF5(2.000));

  assertFalse(isFinite(UtilityCore.NaN));
  assertFalse(isFinite(UtilityCore.POSITIVE_INFINITY));
  assertFalse(isFinite(UtilityCore.NEGATIVE_INFINITY));
  assertTrue(isFinite(1.0));

  assertEquals('00', UtilityCore.numToHexChar2(0));
  assertEquals('00', UtilityCore.numToHexChar2(0.0001));
  assertEquals('ff', UtilityCore.numToHexChar2(1.0));
  assertEquals('ff', UtilityCore.numToHexChar2(0.9999));
  assertEquals('f0', UtilityCore.numToHexChar2(15/16));
  assertEquals('e0', UtilityCore.numToHexChar2(14/16));
  assertEquals('80', UtilityCore.numToHexChar2(0.5));
  assertEquals('20', UtilityCore.numToHexChar2(0.125));
  assertEquals('10', UtilityCore.numToHexChar2(0.125/2));
  assertEquals('e6', UtilityCore.numToHexChar2(0.9));
  assertEquals('1a', UtilityCore.numToHexChar2(0.1));

  assertEquals('0', UtilityCore.numToHexChar1(0));
  assertEquals('0', UtilityCore.numToHexChar1(0.0001));
  assertEquals('f', UtilityCore.numToHexChar1(1));
  assertEquals('f', UtilityCore.numToHexChar1(0.9999));
  assertEquals('f', UtilityCore.numToHexChar1(15/16));
  assertEquals('e', UtilityCore.numToHexChar1(14/16));
  assertEquals('8', UtilityCore.numToHexChar1(0.5));
  assertEquals('2', UtilityCore.numToHexChar1(0.125));
  assertEquals('1', UtilityCore.numToHexChar1(0.125/2));
  assertEquals('e', UtilityCore.numToHexChar1(0.9));
  assertEquals('2', UtilityCore.numToHexChar1(0.1));

  assertEquals('#ff0000', UtilityCore.colorString6(1, 0, 0));
  assertEquals('#00ff00', UtilityCore.colorString6(0, 1, 0));
  assertEquals('#0000ff', UtilityCore.colorString6(0, 0, 1));
  assertEquals('#80ff20', UtilityCore.colorString6(0.5, 1, 0.125));
  assertEquals('#e6e01a', UtilityCore.colorString6(0.9, 14/16, 0.1));

  assertEquals('#f00', UtilityCore.colorString3(1, 0, 0));
  assertEquals('#0f0', UtilityCore.colorString3(0, 1, 0));
  assertEquals('#00f', UtilityCore.colorString3(0, 0, 1));
  assertEquals('#8f2', UtilityCore.colorString3(0.5, 1, 0.125));
  assertEquals('#ee2', UtilityCore.colorString3(0.9, 14/16, 0.1));

  assertEquals('FOO', UtilityCore.toName('foo'));
  assertEquals('FOO2', UtilityCore.toName('foo2'));
  assertEquals('FOO_BAR', UtilityCore.toName('foo bar'));
  assertEquals('FOO_BAR', UtilityCore.toName('foo-bar'));
  assertEquals('FOO_BAR', UtilityCore.toName('FOO BAR'));
  assertEquals('FOO_BAR', UtilityCore.toName('FOO-BAR'));
  assertEquals('FOO_BAR', UtilityCore.toName('FOO_BAR'));

  assertEquals('FOO', UtilityCore.validName('FOO'));
  assertEquals('FOO2', UtilityCore.validName('FOO2'));
  assertEquals('FOO_BAR', UtilityCore.validName('FOO_BAR'));
  assertThrows(function() { UtilityCore.validName('1FOO'); });
  assertThrows(function() { UtilityCore.validName('foo'); });
  assertThrows(function() { UtilityCore.validName('FOO BAR'); });
  assertThrows(function() { UtilityCore.validName('FOO-BAR'); });
  assertThrows(function() { UtilityCore.validName('FOO+'); });

  var txt = 'abcdefghijklmnopqrstuvwxyz';
  assertEquals('abcd', UtilityCore.take(txt, 4));
  assertEquals('wxyz', UtilityCore.take(txt, -4));
  assertEquals('abcd', UtilityCore.drop(txt, -22));
  assertEquals('wxyz', UtilityCore.drop(txt, 22));

  assertThrows(function() { UtilityCore.testNumber(NaN); });
  assertEquals(0, UtilityCore.testNumber(0));
  assertEquals(Number.POSITIVE_INFINITY,
      UtilityCore.testNumber(Number.POSITIVE_INFINITY));
  assertEquals(Number.NEGATIVE_INFINITY,
      UtilityCore.testNumber(Number.NEGATIVE_INFINITY));
  assertEquals(0, UtilityCore.testFinite(0));
  assertThrows(function() { UtilityCore.testFinite(NaN); });
  assertThrows(function() { UtilityCore.testFinite(Number.POSITIVE_INFINITY); });
  assertThrows(function() { UtilityCore.testFinite(Number.NEGATIVE_INFINITY); });

  assertEquals(1, UtilityCore.limitAngle(1));
  assertEquals(-1, UtilityCore.limitAngle(-1));
  assertEquals(0, UtilityCore.limitAngle(0));
  assertEquals(Math.PI, UtilityCore.limitAngle(Math.PI));
  assertEquals(-Math.PI, UtilityCore.limitAngle(-Math.PI));
  assertEquals(Math.PI-0.001, UtilityCore.limitAngle(Math.PI-0.001));
  assertEquals(-Math.PI+0.001, UtilityCore.limitAngle(-Math.PI+0.001));

  assertEquals(1, UtilityCore.limitAngle(1 + 2*Math.PI));
  assertEquals(-1, UtilityCore.limitAngle(-1 + 2*Math.PI));
  assertEquals(0, UtilityCore.limitAngle(0 + 2*Math.PI));
  assertEquals(-Math.PI, UtilityCore.limitAngle(Math.PI + 2*Math.PI));
  assertRoughlyEquals(Math.PI-0.001,
      UtilityCore.limitAngle(Math.PI-0.001 + 2*Math.PI), 1e-15);
  assertRoughlyEquals(-Math.PI+0.001,
      UtilityCore.limitAngle(-Math.PI+0.001 + 2*Math.PI), 1e-15);

  assertEquals(1, UtilityCore.limitAngle(1 - 2*Math.PI));
  assertEquals(-1, UtilityCore.limitAngle(-1 - 2*Math.PI));
  assertEquals(0, UtilityCore.limitAngle(0 - 2*Math.PI));
  assertEquals(Math.PI, UtilityCore.limitAngle(-Math.PI - 2*Math.PI));
  assertRoughlyEquals(Math.PI-0.001,
      UtilityCore.limitAngle(Math.PI-0.001 - 2*Math.PI), 1e-15);
  assertRoughlyEquals(-Math.PI+0.001,
      UtilityCore.limitAngle(-Math.PI+0.001 - 2*Math.PI), 1e-15);

  assertEquals(1, UtilityCore.limitAngle(1 + 4*Math.PI));
  assertEquals(-1, UtilityCore.limitAngle(-1 + 4*Math.PI));
  assertEquals(0, UtilityCore.limitAngle(0 + 4*Math.PI));
  assertEquals(-Math.PI, UtilityCore.limitAngle(Math.PI + 4*Math.PI));
  assertRoughlyEquals(Math.PI-0.001,
      UtilityCore.limitAngle(Math.PI-0.001 + 4*Math.PI), 1e-15);
  assertRoughlyEquals(-Math.PI+0.001,
      UtilityCore.limitAngle(-Math.PI+0.001 + 4*Math.PI), 1e-15);

  assertEquals(1, UtilityCore.limitAngle(1 - 4*Math.PI));
  assertEquals(-1, UtilityCore.limitAngle(-1 - 4*Math.PI));
  assertEquals(0, UtilityCore.limitAngle(0 - 4*Math.PI));
  assertEquals(Math.PI, UtilityCore.limitAngle(-Math.PI - 4*Math.PI));
  assertRoughlyEquals(Math.PI-0.001,
      UtilityCore.limitAngle(Math.PI-0.001 - 4*Math.PI), 1e-15);
  assertRoughlyEquals(-Math.PI+0.001,
      UtilityCore.limitAngle(-Math.PI+0.001 - 4*Math.PI), 1e-15);
};
goog.exportProperty(window, 'testUtilityCore', testUtilityCore);
