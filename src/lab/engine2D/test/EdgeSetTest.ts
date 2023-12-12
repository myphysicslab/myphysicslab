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

import { EdgeSet, EdgeRange, EdgeGroup } from '../EdgeSet.js';
import { Shapes } from '../Shapes.js';

import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testEdgeSet1);
};

function testEdgeSet1() {
  startTest(groupName+'testEdgeSet1');

  const body1 = Shapes.makeBlock(1, 1);
  const body2 = Shapes.makeBall(0.5);
  const body3 = Shapes.makeHexagon(0.5);
  const edgeGroup = new EdgeGroup(EdgeRange.fromRigidBody(body1));
  edgeGroup.add(EdgeRange.fromRigidBody(body2));
  body3.setNonCollideEdge(edgeGroup);
  const b2 = body2.getEdges();
  for (let j=0; j<b2.length; j++) {
    assertTrue(body3.nonCollideEdge(b2[j]));
  }
  const b1 = body1.getEdges();
  for (let j=0; j<b1.length; j++) {
    assertTrue(body3.nonCollideEdge(b1[j]));
  }
};

const groupName = 'EdgeSetTest.';
