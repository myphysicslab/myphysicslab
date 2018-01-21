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

goog.provide('myphysicslab.lab.engine2D.test.RigidBodySim_test');

goog.require('goog.array');
goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.RigidBodySim');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.engine2D.Polygon');

var testRigidBodySim1 = function() {
  var Polygon = myphysicslab.lab.engine2D.Polygon;
  var RigidBody = myphysicslab.lab.engine2D.RigidBody;
  var Shapes = myphysicslab.lab.engine2D.Shapes;
  var SimObject = myphysicslab.lab.model.SimObject;
  var StraightEdge = myphysicslab.lab.engine2D.StraightEdge;
  const Util = goog.module.get('myphysicslab.lab.util.Util');
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');
  var Vertex = myphysicslab.lab.engine2D.Vertex;
  var RigidBodySim = myphysicslab.lab.engine2D.RigidBodySim;
  const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');

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
  assertFalse(goog.array.contains(sim.getBodies(), p1));
  assertEquals(1, sim.getBodies().length);
  assertEquals(p2, sim.getBody(0));
  assertEquals(p2, sim.getBody('block2'));
  assertThrows(function() { sim.getBody('block1'); });
  assertThrows(function() { sim.getBody(1); });
  assertEquals(10, p2.getVarsIndex());
  assertEquals(16, sim.getVarsList().getValues().length);
};
goog.exportProperty(window, 'testRigidBodySim1', testRigidBodySim1);
