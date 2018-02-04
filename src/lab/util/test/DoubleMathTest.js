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

goog.module('myphysicslab.lab.util.test.DoubleMathTest');

const DoubleMath = goog.require('myphysicslab.lab.util.DoubleMath');
const Util = goog.require('myphysicslab.lab.util.Util');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = TestRig.assertEquals;
const assertRoughlyEquals = TestRig.assertRoughlyEquals;
const assertTrue = TestRig.assertTrue;
const assertFalse = TestRig.assertFalse;
const assertThrows = TestRig.assertThrows;
const schedule = TestRig.schedule;
const startTest = TestRig.startTest;

class DoubleMathTest {

static test() {
  schedule(DoubleMathTest.testDoubleMath);
};

static testDoubleMath() {
  startTest(DoubleMathTest.groupName+'testDoubleMath');
  var n, s;
  assertEquals(s = '3FF0000000000000', DoubleMath.numToHex(n = 1));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '3FF0000000000001', DoubleMath.numToHex(n = 1.0000000000000002));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '3FF0000000000002', DoubleMath.numToHex(n = 1.0000000000000004));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '4000000000000000', DoubleMath.numToHex(n = 2));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = 'C000000000000000', DoubleMath.numToHex(n = -2));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '3FF999999999999A', DoubleMath.numToHex(n = 1.6));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = 'BFF999999999999A', DoubleMath.numToHex(n = -1.6));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '4099000000000000', DoubleMath.numToHex(n = 1600));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = 'C099000000000000', DoubleMath.numToHex(n = -1600));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '3F24F8B588E368F1', DoubleMath.numToHex(n = 0.00016));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = 'BF24F8B588E368F1', DoubleMath.numToHex(n = -0.00016));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '0000002F201D49FB', DoubleMath.numToHex(n = 1e-312));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '8000002F201D49FB', DoubleMath.numToHex(n = -1e-312));
  assertEquals(n, DoubleMath.hexToNum(s));
  //Min subnormal positive double = 2^-1074
  n = Math.pow(2,-1074);
  assertEquals(s = '0000000000000001', DoubleMath.numToHex(n));
  assertEquals(n, DoubleMath.hexToNum(s));
  // Max subnormal positive double
  n = 2.22507385850720088902458687609E-308
  assertEquals(s = '000FFFFFFFFFFFFF', DoubleMath.numToHex(n));
  assertEquals(n, DoubleMath.hexToNum(s));
  // Min normal positive double
  n = Math.pow(2,-1022);
  assertEquals(s = '0010000000000000', DoubleMath.numToHex(n));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '0000000000000001', DoubleMath.numToHex(n = Number.MIN_VALUE));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '7FEFFFFFFFFFFFFF', DoubleMath.numToHex(n = Number.MAX_VALUE));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '0000000000000000', DoubleMath.numToHex(n = 0));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '3FD5555555555555', DoubleMath.numToHex(n = 1.0/3.0));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = '7FF8000000000000', DoubleMath.numToHex(n = Number.NaN));
  assertTrue(isNaN(DoubleMath.hexToNum(s)));
  assertEquals(s = '7FF0000000000000', DoubleMath.numToHex(n = Number.POSITIVE_INFINITY));
  assertEquals(n, DoubleMath.hexToNum(s));
  assertEquals(s = 'FFF0000000000000', DoubleMath.numToHex(n = Number.NEGATIVE_INFINITY));
  assertEquals(n, DoubleMath.hexToNum(s));

  // Demonstrates a different result in Java and Javascript from Math.cos()
  // 0xBFD4470BB84303C9 = -3.16836290305272216816234731596E-1  Javascript's value, off by 268
  // mathematica says:   -0.31683629030527219006269881180
  // 0xBFD4470BB84303C8 = -3.16836290305272161305083500338E-1  Java's value, off by 287
  var angle = DoubleMath.hexToNum(s = 'BFFE4A7FE8F6B56D');
  assertEquals(s, DoubleMath.numToHex(angle));
  var cos = Math.cos(angle);
  // March 2014:  Chrome version 33 returns BFD4470BB84303C0 which is less accurate than version 32.
  // Oct 2014:  Chrome version 38 returns BFD4470BB84303C8, same as Java.
  if (Util.isChrome() || Util.isIPhone()) {
    assertEquals('BFD4470BB84303C8', DoubleMath.numToHex(cos));
  } else {
    assertEquals('BFD4470BB84303C9', DoubleMath.numToHex(cos));
  }
};

} // end class

/**
* @type {string}
* @const
*/
DoubleMathTest.groupName = 'DoubleMathTest.';

exports = DoubleMathTest;
