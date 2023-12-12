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

import { RigidBodySim } from '../RigidBodySim.js';
import { Shapes } from '../Shapes.js';
import { VarsList } from '../../model/VarsList.js';
import { Vector } from '../../util/Vector.js';

import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testRigidBodySim1);
};

function testRigidBodySim1() {
  startTest(groupName+'testRigidBodySim1');

  const tol = 1E-15;
  const sim = new RigidBodySim();

  const p1 = Shapes.makeBlock(1, 3, 'block1');
  p1.setPosition(new Vector(-1,  -1),  Math.PI/4);
  const p2 = Shapes.makeBlock(1, 3, 'block2');
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
  const va = sim.getVarsList();
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

const groupName = 'RigidBodySimTest.';
