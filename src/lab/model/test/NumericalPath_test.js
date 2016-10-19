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

goog.provide('myphysicslab.lab.model.test.NumericalPath_test');

goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.model.NumericalPath');
goog.require('myphysicslab.lab.model.PathPoint');
goog.require('myphysicslab.sims.roller.CirclePath');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

/** Test a CirclePath with radius 3 centered at the origin.

Theoretical values to test against:
t = theta is what we use to generate the table
t from -3*pi/2 to pi/2  (from top of circle, going counterclockwise)
x = r*cos(t)
y = r*sin(t)
p = r*(t + 3*pi/2)  // path length from 0 to 2*pi*r
t = p/r - 3*pi/2  // theta starts at -3*pi/2
dt/dp = 1/3
slope = dy/dx = (dy/dt) / (dx/dt) = (3*cos(t)) /(-3*sin(t)) = - 1/tan(t)
circumference = 2*pi*r = 6*pi = 18.84955592153876
normal = (-cos(t), -sin(t))      // inward facing normal
d normal/dp = (sin(t), -cos(t)) dt/dp = (sin(t), -cos(t))/3

*/
var testNumericalPath = function() {
  var tol = 1E-6;
  var tol2 = 1E-5;
  var UtilityCore = myphysicslab.lab.util.UtilityCore;
  var NumericalPath = myphysicslab.lab.model.NumericalPath;
  var PathPoint = myphysicslab.lab.model.PathPoint;
  var CirclePath = myphysicslab.sims.roller.CirclePath;
  var Vector = myphysicslab.lab.util.Vector;
  var path = new NumericalPath(new CirclePath(3.0));
  assertFalse(path.isMassObject());
  var startP = path.getStartPValue();
  assertEquals(0, startP);
  var finishP = path.getFinishPValue();
  assertRoughlyEquals(6*Math.PI, finishP, 1E-6);
  var n = 100;
  var pp = new PathPoint();
  var delta = (finishP - startP)/n;
  for (var i=0; i<=n; i++) {
    pp.p = startP + delta*i;
    var theta = pp.p/3.0 - 3*Math.PI/2;
    path.map_p_to_slope(pp);
    assertRoughlyEquals(3*Math.cos(theta), pp.x, tol);
    assertRoughlyEquals(3*Math.sin(theta), pp.y, tol);
    assertRoughlyEquals(-Math.cos(theta), pp.normalX, tol);
    assertRoughlyEquals(-Math.sin(theta), pp.normalY, tol);
    assertRoughlyEquals(Math.sin(theta)/3, pp.normalXdp, tol);
    assertRoughlyEquals(-Math.cos(theta)/3, pp.normalYdp, tol);
    var k = -1/Math.tan(theta);
    // nearly vertical (huge) slope is too inaccurate to test
    if (Math.abs(k) < 1E6) {
      // use a relative error test here.
      assertRoughlyEquals(k, pp.slope, Math.max(tol2, Math.abs(k)*tol2));
    }
  };
  // Ask for a point that is before first entry in path table
  var index = path.map_p_to_index(-1);
  assertEquals(0, index);

  // Find the 'east-most' point on the circle.
  // The p-value starts at zero on top of circle; goes counterclockwise.
  // The p-value should be (3/4)*(2*pi*radius) = 9*pi/2
  pp.idx = 0;
  var clickPoint = new Vector(3.1, 0);
  path.findNearestLocal(clickPoint, pp);
  tol = 1e-6;
  assertRoughlyEquals(9*Math.PI/2, pp.p, tol);
  path.map_p_to_slope(pp);
  assertRoughlyEquals(3.0, pp.x, tol);
  assertRoughlyEquals(0, pp.y, tol);
  // Similar results with the global version, but much less accurate, bigger tolerance.
  pp = path.findNearestGlobal(clickPoint);
  tol = 0.01;
  assertRoughlyEquals(9*Math.PI/2, pp.p, tol);
  path.map_p_to_slope(pp);
  assertRoughlyEquals(3.0, pp.x, tol);
  assertRoughlyEquals(0, pp.y, tol);

  // Because x values are not monotonically increasing or decreasing,
  // these methods should throw exceptions.
  assertThrows(function() { path.map_x_to_p(1); });
  assertThrows(function() { path.map_x_to_y(0); });
  pp.x = 1;
  assertThrows(function() { path.map_x_to_y_p(pp); });
};
goog.exportProperty(window, 'testNumericalPath', testNumericalPath);
