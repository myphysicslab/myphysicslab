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

import { Util } from "../Util.js";
import { assertEquals, schedule, startTest, assertThrows, assertElementsEquals,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function utilTests() {
  schedule(testUtil);
};

function testUtil() {
  startTest('UtilTest.testUtil');
  let arr = [5, 6, 6, 7, 8, 9, 9, 9, 10, 11, 12];
  Util.removeDuplicates(arr);
  assertEquals(8, arr.length);
  assertElementsEquals([5, 6, 7, 8, 9, 10, 11, 12], arr);
  const arrstr2 = Util.array2string(arr, (n:number)=> n.toFixed(2));
  assertEquals("5.00, 6.00, 7.00, 8.00, 9.00, 10.00, 11.00, 12.00", arrstr2);
  const arrstr3 = Util.array2string(arr, (n:number)=> n.toString(), '\t');
  assertEquals("5	6	7	8	9	10	11	12", arrstr3);
  assertFalse(Util.remove(arr, 3));
  assertTrue(Util.remove(arr, 9));
  assertElementsEquals([5, 6, 7, 8, 10, 11, 12], arr);

  arr = [5, 6, 6, 7, 8, 9, 9, 9, 10, 11, 12];
  // Util.remove removes only the first match found
  assertTrue(Util.remove(arr, 9));
  assertElementsEquals([5, 6, 6, 7, 8, 9, 9, 10, 11, 12], arr);
  assertTrue(Util.remove(arr, 9));
  assertElementsEquals([5, 6, 6, 7, 8, 9, 10, 11, 12], arr);

  arr = [ 1, 2, 3, 2, 3, 4, 5 ];
  assertFalse(Util.removeAll(arr, 0));
  assertTrue(Util.removeAll(arr, 3));
  assertElementsEquals([ 1, 2, 2, 4, 5 ], arr);

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
  const small1 = 1.2345678969481254e-8;
  const small2 = 1.234567893829028e-8;
  assertFalse(Util.veryDifferent(small1, small2));
  assertFalse(Util.veryDifferent(small1, small2, 1e-8, 1e-8));
  assertTrue(Util.veryDifferent(small1, small2, 1e-10, 1e-8));
  assertTrue(Util.veryDifferent(small1, small2, undefined, 1e-8));
  assertThrows(() => Util.veryDifferent(NaN, 3.1));
  assertThrows(() => Util.veryDifferent(99, NaN));
  assertThrows(() => Util.veryDifferent(NaN, NaN));

  assertEquals('1.12000', Util.NF5(1.12));
  assertEquals('1.001', Util.nf5(1.001));
  assertEquals('1.12', Util.nf5(1.12));
  assertEquals('1.12', Util.nf7(1.12));
  assertEquals('1.001', Util.nf7(1.001));
  assertEquals('1.00100', Util.NF5(1.001));
  assertEquals('2', Util.nf5(2.000));
  assertEquals('2', Util.nf7(2.000));
  assertEquals('2.00000', Util.NF5(2.000));

  assertFalse(isFinite(NaN));
  assertFalse(isFinite(Infinity));
  assertFalse(isFinite(Number.NEGATIVE_INFINITY));
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
  assertThrows(() => Util.validName('1FOO'));
  assertThrows(() => Util.validName('foo'));
  assertThrows(() => Util.validName('FOO BAR'));
  assertThrows(() => Util.validName('FOO-BAR'));
  assertThrows(() => Util.validName('FOO+'));

  const txt = 'abcdefghijklmnopqrstuvwxyz';
  assertEquals('abcd', Util.take(txt, 4));
  assertEquals('wxyz', Util.take(txt, -4));
  assertEquals('abcd', Util.drop(txt, -22));
  assertEquals('wxyz', Util.drop(txt, 22));

  assertThrows(() => Util.testNumber(NaN));
  assertEquals(0, Util.testNumber(0));
  assertEquals(Number.POSITIVE_INFINITY,
      Util.testNumber(Number.POSITIVE_INFINITY));
  assertEquals(Number.NEGATIVE_INFINITY,
      Util.testNumber(Number.NEGATIVE_INFINITY));
  assertEquals(0, Util.testFinite(0));
  assertThrows(() => Util.testFinite(NaN));
  assertThrows(() => Util.testFinite(Number.POSITIVE_INFINITY));
  assertThrows(() => Util.testFinite(Number.NEGATIVE_INFINITY));

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

  arr = [1, 2, 3, 4, 5, 6, 7];
  let fnc = function(n: number, idx: number, a: number[]) {
    if (n % 2 === 0) {
      a[idx] = 2*n;
    }
  };
  Util.forEachRight(arr, fnc);
  assertElementsEquals([1, 4, 3, 8, 5, 12, 7], arr);
  // show that we can delete elements from an array while iterating over it
  arr = [1, 2, 3, 4, 5, 6, 7];
  fnc = function(n: number, idx: number, a: number[]) {
    if (n % 2 !== 0) {
      a.splice(idx, 1);
    }
  }
  Util.forEachRight(arr, fnc);
  assertElementsEquals([2, 4, 6], arr);

  assertElementsEquals([7, 7, 7, 7], Util.repeat(7, 4));
  assertElementsEquals(['foo', 'foo', 'foo'], Util.repeat('foo', 3));

  // ensure that Util.assert is working
  let b = 1;
  try {
    Util.assert(false);
    b = 2;
  } catch(e) {
    //asserts are working
  }
  assertEquals(1, b);
};
