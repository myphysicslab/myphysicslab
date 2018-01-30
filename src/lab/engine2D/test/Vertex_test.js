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

goog.module('myphysicslab.lab.engine2D.test.Vertex_test');

goog.require('goog.testing.jsunit');
const ConcreteVertex = goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Vertex = goog.require('myphysicslab.lab.engine2D.Vertex');

var testVertex1 = function() {
  var vec1 = new Vector(2, 1);
  var vertex1 = new ConcreteVertex(vec1, /*endPoint=*/true);
  assertEquals(vec1, vertex1.locBody());
  assertTrue(vertex1.isEndPoint());
};
goog.exportProperty(window, 'testVertex1', testVertex1);
