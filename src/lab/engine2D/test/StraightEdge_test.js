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

goog.provide('myphysicslab.lab.engine2D.test.StraightEdge_test');

goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.StraightEdge');
goog.require('myphysicslab.lab.engine2D.Vertex');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.engine2D.ConcreteVertex');

var testStraightEdge1 = function() {
  const ConcreteVertex = goog.module.get('myphysicslab.lab.engine2D.ConcreteVertex');
  const Polygon = goog.module.get('myphysicslab.lab.engine2D.Polygon');
  const StraightEdge = goog.module.get('myphysicslab.lab.engine2D.StraightEdge');
  const Vector = goog.module.get('myphysicslab.lab.util.Vector');

  var poly1 = new Polygon('test1');
  var vertex1 = new ConcreteVertex(new Vector(0, 0));
  var vertex2 = new ConcreteVertex(new Vector(1, 2), /*endPoint=*/true);
  poly1.startPath(vertex1);
  var edge1 = new StraightEdge(poly1, vertex1, vertex2, /*outsideIsUp=*/true);
  assertEquals(vertex1, edge1.getVertex1());
  assertEquals(vertex2, edge1.getVertex2());
};
goog.exportProperty(window, 'testStraightEdge1', testStraightEdge1);
