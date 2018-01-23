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

goog.provide('myphysicslab.lab.engine2D.test.EdgeSet_test');

goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.engine2D.EdgeGroup');
goog.require('myphysicslab.lab.engine2D.EdgeRange');
goog.require('myphysicslab.lab.engine2D.EdgeSet');
goog.require('myphysicslab.lab.engine2D.Shapes');

var testEdgeSet1 = function() {
  var EdgeGroup = goog.module.get('myphysicslab.lab.engine2D.EdgeGroup');
  var EdgeSet = goog.module.get('myphysicslab.lab.engine2D.EdgeSet');
  var EdgeRange = goog.module.get('myphysicslab.lab.engine2D.EdgeRange');
  const Shapes = goog.module.get('myphysicslab.lab.engine2D.Shapes');

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
goog.exportProperty(window, 'testEdgeSet1', testEdgeSet1);
