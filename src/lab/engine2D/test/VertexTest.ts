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
import { Util } from '../../util/Util.js';
import { Vector } from '../../util/Vector.js';
import { Vertex } from '../RigidBody.js';

import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testVertex1);
};

function testVertex1() {
  startTest(groupName+'testVertex1');
  const vec1 = new Vector(2, 1);
  const vertex1 = new ConcreteVertex(vec1, /*endPoint=*/true);
  assertEquals(vec1, vertex1.locBody());
  assertTrue(vertex1.isEndPoint());
};

const groupName = 'VertexTest.';
