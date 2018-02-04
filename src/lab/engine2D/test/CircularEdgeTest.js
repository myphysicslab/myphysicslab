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

goog.module('myphysicslab.lab.engine2D.test.CircularEdgeTest');

const CircularEdge = goog.require('myphysicslab.lab.engine2D.CircularEdge');
const ConcreteVertex = goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const TestRig = goog.require('myphysicslab.test.TestRig');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Vertex = goog.require('myphysicslab.lab.engine2D.Vertex');

const assertEquals = TestRig.assertEquals;
const assertRoughlyEquals = TestRig.assertRoughlyEquals;
const assertTrue = TestRig.assertTrue;
const assertFalse = TestRig.assertFalse;
const assertThrows = TestRig.assertThrows;
const schedule = TestRig.schedule;
const startTest = TestRig.startTest;

class CircularEdgeTest {

static test() {
  schedule(CircularEdgeTest.testCircularEdge1);
};

static testCircularEdge1() {
  startTest(CircularEdgeTest.groupName+'testCircularEdge1');
  var vec2 = new Vector(2, 0);
  var vertex2 = new ConcreteVertex(vec2, /*endPoint=*/true);
  var poly1 = new Polygon('test1');
  var vertex1 = new ConcreteVertex(new Vector(0, 2));
  poly1.startPath(vertex1);
  var edge1 = new CircularEdge(poly1, vertex1, vertex2, Vector.ORIGIN,
    /*clockwise=*/true, /*outsideIsOut=*/true);
  assertEquals(vertex1, edge1.getVertex1());
  assertEquals(vertex2, edge1.getVertex2());
  assertEquals(2.0, edge1.getCurvature(vec2));
  assertTrue(edge1.getNormalBody(vec2).nearEqual(Vector.EAST));
  assertTrue(edge1.getNormalBody(new Vector(0, 2)).equals(Vector.NORTH));
  assertEquals(-2.0, edge1.distanceToPoint(Vector.ORIGIN));
  assertEquals(2.0, edge1.distanceToPoint(new Vector(4, 0)));
  assertEquals(1.0, edge1.distanceToPoint(new Vector(0, 3)));
  assertEquals(0, edge1.getLeftBody());
  assertEquals(2.0, edge1.getRightBody());
  assertEquals(2.0, edge1.getTopBody());
  assertEquals(0, edge1.getBottomBody());
};

} // end class

/**
* @type {string}
* @const
*/
CircularEdgeTest.groupName = 'CircularEdgeTest.';

exports = CircularEdgeTest;
