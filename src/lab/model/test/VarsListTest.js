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

goog.module('myphysicslab.lab.model.test.VarsListTest');

goog.require('goog.array');
const ConcreteVariable = goog.require('myphysicslab.lab.model.ConcreteVariable');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class VarsListTest {

static test() {
  schedule(VarsListTest.testVarsList1);
  schedule(VarsListTest.testVarsList2);
};

static testVarsList1() {
  startTest(VarsListTest.groupName+'testVarsList1');
  var i, n;
  var var_names = [
    'position',
    'velocity',
    'work from damping',
    'time',
    'acceleration',
    'kinetic energy',
    'spring energy',
    'total energy'
  ];
  var i18n_names = [
    'Position',
    'Geschwindigkeit',
    'Arbeit von Dämpfung',
    'Zeit',
    'Beschleunigung',
    'kinetische Energie',
    'Federenergie',
    'gesamte Energie'
  ];
  var va = new VarsList(var_names, i18n_names);

  var timeIdx = va.timeIndex();
  assertEquals(3, timeIdx);
  assertEquals('TIME', va.getVariable(timeIdx).getName());
  assertEquals('Zeit', va.getVariable(timeIdx).getName(/*localized=*/true));
  assertEquals(0, va.getValue(timeIdx));
  assertEquals(0, va.getTime());
  assertEquals(0, va.getVariable(timeIdx).getSequence());
  assertEquals(0, va.getVariable(1).getSequence());

  var timeVar = va.getVariable('TIME');
  assertEquals('TIME', timeVar.getName());
  assertEquals('Zeit', timeVar.getName(/*localized=*/true));
  assertTrue(timeVar.nameEquals('time'));
  assertEquals(0, timeVar.getValue());
  assertEquals(va, timeVar.getSubject());

  va.setValue(0, 3);
  va.setValue(1, -2);
  assertEquals(0, va.getVariable(timeIdx).getSequence());
  assertEquals(1, va.getVariable(1).getSequence());

  var positionVar = va.getVariable(0);
  assertEquals(positionVar, va.getParameter(var_names[0]));
  assertTrue(positionVar.nameEquals(var_names[0]));
  assertEquals('POSITION', positionVar.getName());
  assertEquals('Position', positionVar.getName(/*localized=*/true));
  assertEquals(3, positionVar.getValue());
  assertEquals(va, positionVar.getSubject());

  var velocityVar = va.getVariable(1);
  assertEquals(velocityVar, va.getParameter(var_names[1]));
  assertTrue(velocityVar.nameEquals(var_names[1]));
  assertEquals('VELOCITY', velocityVar.getName());
  assertEquals('Geschwindigkeit', velocityVar.getName(/*localized=*/true));
  assertEquals(-2, velocityVar.getValue());
  assertEquals(va, velocityVar.getSubject());

  va.setValue(1, -2.1);
  assertEquals(0, va.getVariable(timeIdx).getSequence());
  assertEquals(2, va.getVariable(1).getSequence());
  assertEquals(3, va.getValue(0));
  assertEquals(3, positionVar.getValue());
  assertEquals(-2.1, va.getValue(1));
  assertEquals(-2.1, velocityVar.getValue());

  va.setValue(0, 3.1);
  va.setValue(1, -1.99);
  assertEquals(0, va.getVariable(timeIdx).getSequence());
  assertEquals(3, va.getVariable(1).getSequence());
  va.setValue(timeIdx, va.getTime() + 0.01, /*continuous=*/true);
  assertEquals(0, va.getVariable(timeIdx).getSequence());
  var recentVars = va.getValues(/*computed=*/true);
  var recentTime = va.getTime();
  assertEquals(0.01, recentTime);
  assertEquals(3.1, va.getValue(0));
  assertEquals(-1.99, va.getValue(1));
  positionVar.setValue(3.2);
  velocityVar.setValue(-1.98);
  assertEquals(4, va.getVariable(1).getSequence());
  va.setValue(timeIdx, va.getTime() + 0.01, /*continuous=*/true);
  assertEquals(0.02, va.getTime());
  assertEquals(0, va.getVariable(timeIdx).getSequence());
  assertEquals(3.2, va.getValue(0));
  assertEquals(3.2, positionVar.getValue());
  assertEquals(-1.98, va.getValue(1));
  assertEquals(-1.98, velocityVar.getValue());
  va.setValue(0, 3.3);
  va.setValue(1, -1.97);
  assertEquals(5, va.getVariable(1).getSequence());
  va.setValue(timeIdx, va.getTime() + 0.01, /*continuous=*/true);
  assertEquals(0, va.getVariable(timeIdx).getSequence());
  assertEquals(0.03, va.getTime());
  assertEquals(3.3, va.getValue(0));
  assertEquals(-1.97, va.getValue(1));
  va.setValues(recentVars, /*continuous=*/true);
  va.setValue(timeIdx, recentTime, /*continuous=*/true);
  assertEquals(recentTime, va.getTime());
  assertEquals(3.1, va.getValue(0));
  assertEquals(-1.99, va.getValue(1));
  assertEquals(0, va.getVariable(timeIdx).getSequence());
  assertEquals(5, va.getVariable(1).getSequence());
  va.setValues([5, -2, 0]);
  assertEquals(0, va.getVariable(timeIdx).getSequence());
  assertEquals(6, va.getVariable(1).getSequence());
  assertEquals(0, va.getVariable(7).getSequence());
  va.setValue(timeIdx, 0, /*continuous=*/true);
  assertEquals(0, va.getVariable(timeIdx).getSequence());
  va.incrSequence(timeIdx);
  assertEquals(1, va.getVariable(timeIdx).getSequence());
  assertEquals(0.0, va.getTime());
  assertEquals(5, va.getValue(0));
  assertEquals(-2, va.getValue(1));
  assertEquals(0, va.getValue(timeIdx));
  assertEquals('VELOCITY', va.getVariable(1).getName());
  assertTrue(va.getVariable(1).nameEquals(var_names[1]));
  assertEquals('Geschwindigkeit', va.getVariable(1).getName(/*localized=*/true));
  assertEquals('KINETIC_ENERGY', va.getVariable(5).getName());
  assertTrue(va.getVariable(5).nameEquals(var_names[5]));
  assertEquals('kinetische Energie', va.getVariable(5).getName(/*localized=*/true));
  assertEquals(var_names.length, va.numVariables());
  var keIdx = goog.array.indexOf(va.toArray(), va.getVariable('KINETIC_ENERGY'));
  assertEquals(5, keIdx);
  var nv = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7];
  assertEquals(nv.length, va.numVariables());
  va.setValues(nv);
  assertEquals(1.0, positionVar.getValue());
  assertEquals(1.1, velocityVar.getValue());
  assertEquals(1.2, va.getValue(2));
  assertEquals(1.7, va.getValue(7));
  assertEquals(2, va.getVariable(timeIdx).getSequence());
  assertEquals(7, va.getVariable(1).getSequence());
  assertEquals(1, va.getVariable(7).getSequence());
  va.incrSequence(4, 5, 6, 7);
  assertEquals(2, va.getVariable(timeIdx).getSequence());
  assertEquals(7, va.getVariable(1).getSequence());
  assertEquals(2, va.getVariable(7).getSequence());
};

// test variations on constructor.
// @todo  exercise each of these more.
static testVarsList2() {
  startTest(VarsListTest.groupName+'testVarsList2');
  // no variables
  var va = new VarsList([], []);
  assertEquals(0, va.numVariables());
  assertEquals(-1, va.timeIndex());
  // 1 variable
  va = new VarsList(['foo'], ['foo']);
  assertEquals(1, va.numVariables());
  assertEquals(-1, va.timeIndex());
  assertEquals('FOO', va.getVariable(0).getName());
  assertEquals('foo', va.getVariable(0).getName(/*localized=*/true));
  assertEquals(0, va.getValue(0));

  var var0 = va.getVariable(0);
  assertEquals('FOO', var0.getName());
  assertEquals('foo', var0.getName(/*localized=*/true));
  assertEquals(0, var0.getValue());

  // 2 variables, with names
  va = new VarsList(['foo', 'bar'], ['foo', 'bar']);
  assertEquals(2, va.numVariables());
  assertEquals(-1, va.timeIndex());
  assertEquals('FOO', va.getVariable(0).getName());
  assertEquals('BAR', va.getVariable(1).getName());
  assertEquals('foo', va.getVariable(0).getName(/*localized=*/true));
  assertEquals('bar', va.getVariable(1).getName(/*localized=*/true));
  assertEquals(0, va.getValue(0));
  assertEquals(0, va.getValue(1));

  var0 = va.getVariable(0);
  assertEquals('FOO', var0.getName());
  assertEquals('foo', var0.getName(/*localized=*/true));
  assertEquals(0, var0.getValue());

  var var1 = va.getVariable(1);
  assertEquals('BAR', var1.getName());
  assertEquals('bar', var1.getName(/*localized=*/true));
  assertEquals(0, var1.getValue());

  // add a variable
  va.addVariable(new ConcreteVariable(va, 'baz', 'baz'));
  assertEquals(3, va.numVariables());
  assertEquals('BAZ', va.getVariable(2).getName());
  assertEquals('baz', va.getVariable(2).getName(/*localized=*/true));
  assertEquals(0, va.getValue(2));

  var var2 = va.getVariable('BAZ');
  assertEquals('BAZ', var2.getName());
  assertEquals('baz', var2.getName(/*localized=*/true));
  assertEquals(0, var2.getValue());

  // variable names must be unique
  assertThrows(function() {
      new VarsList(['foo', 'foo'], ['foo', 'foo']);
    });
};

} // end class

/**
* @type {string}
* @const
*/
VarsListTest.groupName = 'VarsListTest.';

exports = VarsListTest;
