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

goog.module('myphysicslab.lab.engine2D.test.Polygon_test');

goog.require('goog.testing.jsunit');
const ConcreteVertex = goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const StraightEdge = goog.require('myphysicslab.lab.engine2D.StraightEdge');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Vertex = goog.require('myphysicslab.lab.engine2D.Vertex');

var testPolygon1 = function() {

  var p = new Polygon('polygon1');
  var w = 0.5;
  var h = 1.5;
  var v1 = new Vector(w, -h);
  var v2 = new Vector(w, h);
  var v3 = new Vector(-w, h);
  var v4 = new Vector(-w, -h);
  //console.log(v1.toString());
  p.startPath(new ConcreteVertex(new Vector(-w, -h)));
  var e1 = p.addStraightEdge(v1, /*outsideIsUp=*/false);
  var e2 = p.addStraightEdge(v2, /*outsideIsUp=*/true);
  var e3 = p.addStraightEdge(v3, /*outsideIsUp=*/true);
  var e4 = p.addStraightEdge(v4, /*outsideIsUp=*/false);
  p.finish();
  assertTrue(p.isMassObject());
  p.setCentroid(Vector.ORIGIN);
  p.setMomentAboutCM((w*w + h*h)/3);
  assertEquals(4, p.getEdges().length);
  assertRoughlyEquals(1.0, p.getWidth(), 1e-15);
  assertRoughlyEquals(3.0, p.getHeight(), 1e-15);
  assertTrue(e1.getVertex1().locBody().equals(v4));
  assertTrue(e1.getVertex2().locBody().equals(v1));
  assertTrue(e2.getVertex1().locBody().equals(v1));
  assertTrue(e2.getVertex2().locBody().equals(v2));
  assertTrue(e3.getVertex1().locBody().equals(v2));
  assertTrue(e3.getVertex2().locBody().equals(v3));
  assertTrue(e4.getVertex1().locBody().equals(v3));
  assertTrue(e4.getVertex2().locBody().equals(v4));
  assertTrue(p.getCentroidBody().equals(Vector.ORIGIN));
  assertTrue(p.getPosition().equals(Vector.ORIGIN));
  assertEquals(0, p.getAngle());
  var v5 = new Vector(0.5, 1.5);
  p.setPosition(v5);
  assertTrue(p.getPosition().equals(v5));
  assertTrue(p.getCentroidWorld().equals(v5));
  assertEquals(-1.5, p.getBottomBody());
  assertEquals(1.5, p.getTopBody());
  assertEquals(-0.5, p.getLeftBody());
  assertEquals(0.5, p.getRightBody());
  assertEquals(0, p.getBottomWorld());
  assertEquals(3, p.getTopWorld());
  assertEquals(0, p.getLeftWorld());
  assertEquals(1, p.getRightWorld());
  var v6 = new Vector(3.1456, 2.71828);
  p.setPosition(v6);
  assertTrue(p.getPosition().equals(v6));
  assertTrue(p.getCentroidWorld().equals(v6));
  p.setPosition(v6,  Math.PI/2);
  assertEquals(Math.PI/2, p.getAngle());
  p.setPosition(new Vector(0.5,  1.5),  Math.PI/4);
  assertTrue(p.getPosition().equals(v5));
  assertEquals(Math.PI/4, p.getAngle());
};
goog.exportProperty(window, 'testPolygon1', testPolygon1);
