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

goog.module('myphysicslab.lab.engine2D.test.RigidBodySimTest');

goog.require('goog.array');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const TestRig = goog.require('myphysicslab.test.TestRig');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class RigidBodySimTest {

static test() {
  schedule(RigidBodySimTest.testRigidBodySim1);
};

static testRigidBodySim1() {
  startTest(RigidBodySimTest.groupName+'testRigidBodySim1');

  var i;
  var tol = 1E-15;
  var sim = new RigidBodySim();

  var p1 = Shapes.makeBlock(1, 3, 'block1');
  p1.setPosition(new Vector(-1,  -1),  Math.PI/4);
  var p2 = Shapes.makeBlock(1, 3, 'block2');
  p2.setPosition(new Vector(5,  5),  Math.PI/3);
  p2.setVelocity(new Vector(-1,  -1),  2);
  sim.addBody(p1);
  sim.addBody(p2);
  assertEquals(2, sim.getBodies().length);
  assertEquals(p1, sim.getBody(0));
  assertEquals(p2, sim.getBody(1));
  assertEquals(p1, sim.getBody('block1'));
  assertEquals(p2, sim.getBody('block2'));
  assertEquals(4, p1.getVarsIndex());
  assertEquals(10, p2.getVarsIndex());
  assertEquals(16, sim.getVarsList().getValues().length);

  sim.removeBody(p1);
  var va = sim.getVarsList();
  assertEquals(VarsList.DELETED, va.getVariable(4).getName());
  assertEquals(VarsList.DELETED, va.getVariable(5).getName());
  assertEquals(VarsList.DELETED, va.getVariable(6).getName());
  assertEquals(VarsList.DELETED, va.getVariable(7).getName());
  assertEquals(VarsList.DELETED, va.getVariable(8).getName());
  assertEquals(VarsList.DELETED, va.getVariable(9).getName());
  assertEquals(VarsList.DELETED, va.getVariable(4).getName(/*localized=*/true));
  assertEquals(VarsList.DELETED, va.getVariable(5).getName(/*localized=*/true));
  assertEquals(VarsList.DELETED, va.getVariable(6).getName(/*localized=*/true));
  assertEquals(VarsList.DELETED, va.getVariable(7).getName(/*localized=*/true));
  assertEquals(VarsList.DELETED, va.getVariable(8).getName(/*localized=*/true));
  assertEquals(VarsList.DELETED, va.getVariable(9).getName(/*localized=*/true));
  assertFalse(sim.getBodies().includes(p1));
  assertEquals(1, sim.getBodies().length);
  assertEquals(p2, sim.getBody(0));
  assertEquals(p2, sim.getBody('block2'));
  assertThrows(() => sim.getBody('block1'));
  assertThrows(() => sim.getBody(1));
  assertEquals(10, p2.getVarsIndex());
  assertEquals(16, sim.getVarsList().getValues().length);
};

} // end class

/**
* @type {string}
* @const
*/
RigidBodySimTest.groupName = 'RigidBodySimTest.';

exports = RigidBodySimTest;
