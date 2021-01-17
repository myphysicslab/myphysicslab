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

goog.module('myphysicslab.lab.engine2D.test.VertexTest');

const ConcreteVertex = goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
const TestRig = goog.require('myphysicslab.test.TestRig');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Vertex = goog.require('myphysicslab.lab.engine2D.Vertex');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class VertexTest {

static test() {
  schedule(VertexTest.testVertex1);
};

static testVertex1() {
  startTest(VertexTest.groupName+'testVertex1');
  const vec1 = new Vector(2, 1);
  const vertex1 = new ConcreteVertex(vec1, /*endPoint=*/true);
  assertEquals(vec1, vertex1.locBody());
  assertTrue(vertex1.isEndPoint());
};

} // end class

/**
* @type {string}
* @const
*/
VertexTest.groupName = 'VertexTest.';

exports = VertexTest;
