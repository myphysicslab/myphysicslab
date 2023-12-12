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

import { ConcreteVertex } from '../ConcreteVertex.js';
import { Polygon } from '../Polygon.js';
import { StraightEdge } from '../StraightEdge.js';
import { Util } from '../../util/Util.js';
import { Vector } from '../../util/Vector.js';
import { Vertex } from '../RigidBody.js';

import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testStraightEdge1);
};

function testStraightEdge1() {
  startTest(groupName+'testStraightEdge1');

  const poly1 = new Polygon('test1');
  const vertex1 = new ConcreteVertex(new Vector(0, 0));
  const vertex2 = new ConcreteVertex(new Vector(1, 2), /*endPoint=*/true);
  poly1.startPath(vertex1);
  const edge1 = new StraightEdge(poly1, vertex1, vertex2, /*outsideIsUp=*/true);
  assertEquals(vertex1, edge1.getVertex1());
  assertEquals(vertex2, edge1.getVertex2());
};

const groupName = 'StraightEdgeTest.';
