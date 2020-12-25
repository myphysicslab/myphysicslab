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

goog.module('myphysicslab.lab.engine2D.test.EdgeSetTest');

const EdgeGroup = goog.require('myphysicslab.lab.engine2D.EdgeGroup');
const EdgeRange = goog.require('myphysicslab.lab.engine2D.EdgeRange');
const EdgeSet = goog.require('myphysicslab.lab.engine2D.EdgeSet');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class EdgeSetTest {

static test() {
  schedule(EdgeSetTest.testEdgeSet1);
};

static testEdgeSet1() {
  startTest(EdgeSetTest.groupName+'testEdgeSet1');

  var body1 = Shapes.makeBlock(1, 1);
  var body2 = Shapes.makeBall(0.5);
  var body3 = Shapes.makeHexagon(0.5);
  var edgeGroup = new EdgeGroup(EdgeRange.fromPolygon(body1));
  edgeGroup.add(EdgeRange.fromPolygon(body2));
  body3.setNonCollideEdge(edgeGroup);
  var j;
  var b2 = body2.getEdges();
  for (j=0; j<b2.length; j++) {
    assertTrue(body3.nonCollideEdge(b2[j]));
  }
  var b1 = body1.getEdges();
  for (j=0; j<b1.length; j++) {
    assertTrue(body3.nonCollideEdge(b1[j]));
  }
};

} // end class

/**
* @type {string}
* @const
*/
EdgeSetTest.groupName = 'EdgeSetTest.';

exports = EdgeSetTest;
