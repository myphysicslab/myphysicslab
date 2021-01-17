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

goog.module('myphysicslab.lab.model.test.EnergyInfoTest');

const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);
const assertNaN = v => TestRig.assertNaN(v);

class EnergyInfoTest {

static test() {
  schedule(EnergyInfoTest.testEnergyInfo1);
};

static testEnergyInfo1() {
  startTest(EnergyInfoTest.groupName+'testEnergyInfo1');
  const e1 = new EnergyInfo();
  assertEquals(0, e1.getPotential());
  assertEquals(0, e1.getTranslational());
  assertNaN(e1.getRotational());
  assertNaN(e1.getWorkDone());
  assertNaN(e1.getInitialEnergy());
  assertEquals(0, e1.getTotalEnergy());
  e1.setPotential(3);
  e1.setTranslational(2);
  e1.setRotational(1);
  e1.setWorkDone(5);
  e1.setInitialEnergy(10);
  assertEquals(1, e1.getRotational());
  assertEquals(6, e1.getTotalEnergy());
  assertEquals(5, e1.getWorkDone());
  assertEquals(10, e1.getInitialEnergy());
  const e2 = new EnergyInfo(-10, 2);
  assertEquals(-8, e2.getTotalEnergy());
  const e3 = new EnergyInfo(6, 4, 2);
  assertEquals(12, e3.getTotalEnergy());
  const e4 = new EnergyInfo(6, 4, 2, 100, 200);
  assertEquals(12, e4.getTotalEnergy());
  assertEquals(100, e4.getWorkDone());
  assertEquals(200, e4.getInitialEnergy());
};

} // end class

/**
* @type {string}
* @const
*/
EnergyInfoTest.groupName = 'EnergyInfoTest.';

exports = EnergyInfoTest;
