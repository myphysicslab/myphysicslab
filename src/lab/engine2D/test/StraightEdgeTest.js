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

goog.module('myphysicslab.lab.engine2D.test.StraightEdgeTest');

const ConcreteVertex = goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const StraightEdge = goog.require('myphysicslab.lab.engine2D.StraightEdge');
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

class StraightEdgeTest {

static test() {
  schedule(StraightEdgeTest.testStraightEdge1);
};

static testStraightEdge1() {
  startTest(StraightEdgeTest.groupName+'testStraightEdge1');

  var poly1 = new Polygon('test1');
  var vertex1 = new ConcreteVertex(new Vector(0, 0));
  var vertex2 = new ConcreteVertex(new Vector(1, 2), /*endPoint=*/true);
  poly1.startPath(vertex1);
  var edge1 = new StraightEdge(poly1, vertex1, vertex2, /*outsideIsUp=*/true);
  assertEquals(vertex1, edge1.getVertex1());
  assertEquals(vertex2, edge1.getVertex2());
};

} // end class

/**
* @type {string}
* @const
*/
StraightEdgeTest.groupName = 'StraightEdgeTest.';

exports = StraightEdgeTest;
