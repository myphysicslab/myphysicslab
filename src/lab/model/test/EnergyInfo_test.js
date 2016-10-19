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

goog.provide('myphysicslab.lab.model.test.EnergyInfo_test');

goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.EnergyInfo');

var testEnergyInfo1 = function() {
  var EnergyInfo = myphysicslab.lab.model.EnergyInfo;
  var e1 = new EnergyInfo();
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
  var e2 = new EnergyInfo(-10, 2);
  assertEquals(-8, e2.getTotalEnergy());
  var e3 = new EnergyInfo(6, 4, 2);
  assertEquals(12, e3.getTotalEnergy());
  var e4 = new EnergyInfo(6, 4, 2, 100, 200);
  assertEquals(12, e4.getTotalEnergy());
  assertEquals(100, e4.getWorkDone());
  assertEquals(200, e4.getInitialEnergy());
};
goog.exportProperty(window, 'testEnergyInfo1', testEnergyInfo1);
