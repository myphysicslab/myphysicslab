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

goog.module('myphysicslab.lab.model.test.NumericalPathTest');

const NumericalPath = goog.require('myphysicslab.lab.model.NumericalPath');
const PathPoint = goog.require('myphysicslab.lab.model.PathPoint');
const CirclePath = goog.require('myphysicslab.sims.roller.CirclePath');
const CustomPath = goog.require('myphysicslab.sims.roller.CustomPath');
const FlatPath = goog.require('myphysicslab.sims.roller.FlatPath');
const OvalPath = goog.require('myphysicslab.sims.roller.OvalPath');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class NumericalPathTest {

static test() {
  schedule(NumericalPathTest.testNumericalPath1);
  schedule(NumericalPathTest.testNumericalPath2);
  schedule(NumericalPathTest.testNumericalPath3);
  schedule(NumericalPathTest.testNumericalPath4);
};

/** Test a CirclePath with radius 3 centered at the origin.

Theoretical values to test against:
t = theta is what we use to generate the table
t from -3*pi/2 to pi/2  (from top of circle, going counterclockwise)
x = r*cos(t)
y = r*sin(t)
p = r*(t + 3*pi/2)  // path length from 0 to 2*pi*r
dp/dt = r
t = p/r - 3*pi/2  // theta starts at -3*pi/2
dt/dp = 1/r
slope = dy/dx = (dy/dt) / (dx/dt) = (r*cos(t)) /(-r*sin(t)) = - 1/tan(t)
circumference = 2*pi*r = 6*pi = 18.84955592153876

dx/dp = dx/dt dt/dp = -r sin(t) (1/r) = -sin(t)
dy/dp = dy/dt dt/dp = r cos(t) (1/r) = cost(t)

normal = (-cos(t), -sin(t))      // inward facing normal
d normal/dp = (sin(t), -cos(t)) dt/dp = (sin(t), -cos(t))/r

*/
static testNumericalPath1() {
  startTest(NumericalPathTest.groupName+'testNumericalPath1');
  const tol = 1E-6;
  const tol2 = 1E-4;
  const r = 3;
  const path = new NumericalPath(new CirclePath(r));
  assertFalse(path.isMassObject());
  const startP = path.getStartPValue();
  assertEquals(0, startP);
  const finishP = path.getFinishPValue();
  assertRoughlyEquals(6*Math.PI, finishP, 1E-6);
  const n = 1000;
  const pp = new PathPoint(0, /*calculateRadius=*/true);
  const delta = (finishP - startP)/n;
  for (let i=0; i<=n; i++) {
    pp.p = startP + delta*i;
    const theta = pp.p/r - 3*Math.PI/2;
    path.map_p_to_slope(pp);
    assertRoughlyEquals(r*Math.cos(theta), pp.x, tol);
    assertRoughlyEquals(r*Math.sin(theta), pp.y, tol);
    assertRoughlyEquals(-Math.sin(theta), pp.dxdp, tol);
    assertRoughlyEquals(Math.cos(theta), pp.dydp, tol);
    assertRoughlyEquals(-Math.cos(theta), pp.normalX, tol);
    assertRoughlyEquals(-Math.sin(theta), pp.normalY, tol);
    assertRoughlyEquals(Math.sin(theta)/r, pp.normalXdp, tol);
    assertRoughlyEquals(-Math.cos(theta)/r, pp.normalYdp, tol);
    if (isFinite(pp.radius)) {
      // to do: find radius of curvature for the four points on circle
      // where tangent is horizontal or vertical.  Currently we get
      // radius is infinite there which is wrong.
      assertRoughlyEquals(r, pp.radius, tol);
    }
    const k = -1/Math.tan(theta);
    // nearly vertical (huge) slope is too inaccurate to test
    if (Math.abs(k) < 1E6) {
      // use a relative error test here.
      assertRoughlyEquals(k, pp.slope, Math.max(tol2, Math.abs(k)*tol2));
    }
  };
  // Ask for a point that is before first entry in path table
  const index = path.map_p_to_index(-1);
  assertEquals(0, index);

  // Find the 'east-most' point on the circle.
  // The p-value starts at zero on top of circle; goes counterclockwise.
  // The p-value should be (3/4)*(2*pi*r) = (3/2)*pi*r
  pp.idx = 0;
  const clickPoint = new Vector(3.1, 0);
  path.findNearestLocal(clickPoint, pp);
  const tol3 = 1e-6;
  assertRoughlyEquals((3/2)*Math.PI*r, pp.p, tol3);
  path.map_p_to_slope(pp);
  assertRoughlyEquals(r, pp.x, tol3);
  assertRoughlyEquals(0, pp.y, tol3);
  // Similar results with the global version, but much less accurate, bigger tolerance.
  const pp2 = path.findNearestGlobal(clickPoint);
  const tol4 = 0.01;
  assertRoughlyEquals((3/2)*Math.PI*r, pp2.p, tol4);
  path.map_p_to_slope(pp2);
  assertRoughlyEquals(r, pp2.x, tol4);
  assertRoughlyEquals(0, pp2.y, tol4);

  // Because x values are not monotonically increasing or decreasing,
  // these methods should throw exceptions.
  assertThrows(() => path.map_x_to_p(1));
  assertThrows(() => path.map_x_to_y(0));
  pp2.x = 1;
  assertThrows(() => path.map_x_to_y_p(pp2));
};

/** Test a parabola shaped path. Tests the straight line extension beyond the parabola
path end points See the paper [Parabola Path Length](Parabola_Path_Length.pdf) for how
the theoretical path length is calculated.

Theoretical values to test against:

    t = parameter for generating the table
    t from -1 to 1
    x(t) = t
    y(t) = t*t
    p(x) = (1/4) (2x sqrt(1 + 4 x^2) + invsinh(2x) + 2 sqrt(5) - invsinh(-2))
    where invsinh is inverse hyperbolic sine which is given by
    invsinh(u) = ln(u + sqrt(1 + u^2))
    d invsinh(u)/dx = 1/sqrt(1 + u^2) du/dx

    dp/dx = (1/4) (2 sqrt(1 + 4 x^2) + 2x (1/2)(1/sqrt(1 + 4 x^2))8x
            + 2 (1/sqrt(1 + 4 x^2)))
          = (1/4) (2 sqrt(1 + 4 x^2) +(8x^2 + 2) (1/sqrt(1 + 4 x^2)))
          = (1/2) ( sqrt(1 + 4 x^2) +(4x^2 + 1) (1/sqrt(1 + 4 x^2)))
          = (1/2) ( sqrt(1 + 4 x^2) +sqrt(1 + 4 x^2))
          = sqrt(1 + 4 x^2)
    dx/dp = 1/sqrt(1 + 4 x^2)

    slope = dy/dx = 2x

There are two choices for normal, going in opposite directions, we seem to be
getting the normal that is "outward" facing here.

    Find the normal N=(a,b) at x,y.  Let k = slope = 2x
    Length of normal is 1, so a^2 + b^2 = 1.
    Slope of normal = b/a = -1/k (perpendicular to slope).
    Solve the last 2 equations:
    b = -a/k
    a^2 + (-a/k)^2 = 1
    a^2 (1 + (1/k)^2) = 1
    a = 1 / sqrt(1 + (1/k)^2) = k / sqrt(k^2 + 1)
    b = -1 / sqrt(k^2 + 1)
    But reverse the signs:
    a = -k / sqrt(k^2 + 1)
    b = 1 / sqrt(k^2 + 1)

    normal = (Nx, Ny) = (-k / sqrt(k^2 + 1), 1 / sqrt(k^2 + 1))
           = (-2x/ sqrt(4 x^2 + 1), 1 /sqrt(4 x^2 + 1))
    d normal/dp = d normal/dx  dx/dp
    d Nx /dx = d(u/v) dx where
        u = -2x,
        v = sqrt(4 x^2 + 1),
        du/dx = -2,
        dv/dx = (1/2)(1/sqrt(4 x^2 + 1)) 8x = 4x/sqrt(4 x^2 + 1)
        use formula for derivative of quotient:
        d (u/v) dx = [v du/dx - u dv/dx]/v^2
        which becomes:
    d Nx /dx = [sqrt(4 x^2 + 1) (-2) - (-2x) 4x/sqrt(4 x^2 + 1)]/ (4 x^2 + 1)
             = -2/sqrt(4 x^2 + 1) + 8 x^2/(4 x^2 + 1)^{3/2}
        multiply by (dx/dp):
    d Nx /dx (dx/dp) = [-2/sqrt(4 x^2 + 1) + 8 x^2/(4 x^2 + 1)^{3/2}] (1/sqrt(1 + 4 x^2))
    d Nx /dx (dx/dp) = [-2/(4 x^2 + 1) + 8 x^2/(4 x^2 + 1)^{2}]
    d Nx /dx (dx/dp) = [-2 + 8 x^2/(4 x^2 + 1)] (1/(4 x^2 + 1))

    d Ny /dx = d(u^{-1/2})/dx, where
        u = (4 x^2 + 1)
        use formula for derivative of power:
        d u^n/dx = n u^{n-1} du/dx
    d Ny /dx = (-1/2) (4 x^2 + 1)^{-3/2} 8x = -4x /(4 x^2 + 1)^{3/2}
        multiply by (dx/dp):
    d Ny /dx (dx/dp) = -4x/(4 x^2 + 1)^2

*/
static testNumericalPath2() {
  startTest(NumericalPathTest.groupName+'testNumericalPath2');
  const tol = 1E-6;
  const tol2 = 1E-4;
  /** @type {function(number):number} */
  const invsinh = x => Math.log(x + Math.sqrt(x*x + 1));
  const parabola = new CustomPath(/*start_t=*/-1, /*finish_t=*/1);
  parabola.setXEquation('t');
  parabola.setYEquation('t*t');
  const path = new NumericalPath(parabola);
  assertFalse(path.isMassObject());
  const startP = path.getStartPValue();
  assertEquals(0, startP);
  // p(x) = (1/4) (2x sqrt(1 + 4 x^2) + invsinh(2x) + 2 sqrt(5) - invsinh(-2))
  // at the finish point, x = 1.
  // p(1) = (1/4) (2 sqrt(5) + invsinh(2) + 2 sqrt(5) - invsinh(-2))
  // p(1) = (1/4) (4 sqrt(5) + invsinh(2) - invsinh(-2))
  // p(1) = sqrt(5) + (1/4) (invsinh(2) - invsinh(-2))
  const fp = Math.sqrt(5) + (invsinh(2) - invsinh(-2))/4;
  const finishP = path.getFinishPValue();
  assertRoughlyEquals(fp, finishP, tol);
  const n = 1000;
  const pp = new PathPoint(0, /*calculateRadius=*/true);
  const delta = (finishP - startP)/n;
  for (let i=0; i<=n; i++) {
    pp.p = startP + delta*i;
    path.map_p_to_slope(pp);
    // take the x-value in pp, use our formula to find what p should be
    const x2 = pp.x * pp.x;
    // p(x) = (1/4) (2x sqrt(1 + 4 x^2) + invsinh(2x) + 2 sqrt(5) - invsinh(-2))
    let myp = 2*Math.sqrt(5) + invsinh(2*pp.x) - invsinh(-2);
    const sqrt4x2 = Math.sqrt(1 + 4 * x2);
    myp += 2 * pp.x * sqrt4x2;
    myp = myp/4;
    assertRoughlyEquals(myp, pp.p, tol);
    assertRoughlyEquals(x2, pp.y, tol);
    // normal = (2x/ sqrt(4 x^2 + 1), -1 /sqrt(4 x^2 + 1))
    assertRoughlyEquals(-2*pp.x/sqrt4x2, pp.normalX, tol);
    assertRoughlyEquals(1/sqrt4x2, pp.normalY, tol);
    // dx/dp = 1/(dp/dx) = 1/sqrt(1 + 4 x^2)
    assertRoughlyEquals(1/sqrt4x2 , pp.dxdp, tol);
    // dy/dp = dy/dx dx/dp = 2x (1/sqrt(1 + 4 x^2))
    assertRoughlyEquals(2*pp.x/sqrt4x2 , pp.dydp, tol);
    // d Nx /dx (dx/dp) = [-2 + 8 x^2/(4 x^2 + 1)] (1/(4 x^2 + 1))
    const d1 = 4 * x2 + 1;
    const exp = (-2 + 8 * x2 / d1) / d1;
    assertRoughlyEquals((-2 + 8 * x2 / d1) / d1, pp.normalXdp, tol2);
    // d Ny /dx (dx/dp) = -4x/(4 x^2 + 1)^2
    assertRoughlyEquals(-4 * pp.x/(d1 * d1), pp.normalYdp, tol2);
    assertRoughlyEquals(2 * pp.x, pp.slope, tol);
    if (i > 0 && i < n) {
      // can't figure out radius at end-points
      assertRoughlyEquals(Math.pow(1 + 4*pp.x*pp.x, 3/2)/2, pp.radius, 0.002);
    }
  };
  {
    // test a point before the starting point of path.
    const p = path.getStartPValue() - Math.sqrt(5);
    const pp = new PathPoint(p);
    path.map_p_to_slope(pp);
    assertRoughlyEquals(p, pp.p, tol);
    assertRoughlyEquals(-2, pp.x, tol);
    assertRoughlyEquals(3, pp.y, tol);
    assertRoughlyEquals(-2, pp.slope, tol);
  }
  {
    // test a point after the ending point of path.
    const p = path.getFinishPValue() + Math.sqrt(5);
    const pp = new PathPoint(p);
    path.map_p_to_slope(pp);
    assertRoughlyEquals(p, pp.p, tol);
    assertRoughlyEquals(2, pp.x, tol);
    assertRoughlyEquals(3, pp.y, tol);
    assertRoughlyEquals(2, pp.slope, tol);
  }
};

/** Test an OvalPath, to check that vertical segments have correct info.
*/
static testNumericalPath3() {
  startTest(NumericalPathTest.groupName+'testNumericalPath3');
  const tol = 1E-6;
  const tol2 = 1E-5;
  const path = new NumericalPath(new OvalPath());
  const pp = new PathPoint(0, /*calculateRadius=*/true);
  // t = pi to 2+pi is straight down section
  // p = t - pi/2
  // p = pi/2 to 2 + pi/2 is straight down section
  pp.p = 1 + Math.PI/2;
  path.map_p_to_slope(pp);
  assertRoughlyEquals(-1, pp.x, tol);
  assertRoughlyEquals(1, pp.y, tol);
  assertRoughlyEquals(0, pp.dxdp, tol);
  assertRoughlyEquals(-1, pp.dydp, tol);
  assertRoughlyEquals(1, pp.normalX, tol);
  assertRoughlyEquals(0, pp.normalY, tol);
  assertRoughlyEquals(0, pp.normalXdp, tol);
  assertRoughlyEquals(0, pp.normalYdp, tol);
  assertEquals(Number.NEGATIVE_INFINITY, pp.slope);
  assertEquals(Number.NEGATIVE_INFINITY, pp.radius);
  assertEquals(0, pp.slopeX);
  assertEquals(-1, pp.slopeY);
  // t = 2 + 2*pi to 4 + 2*pi is straight up section
  // p = t - pi/2
  // p = 2 + (3/2)pi to 4 + (3/2)pi is straight up section
  pp.p = 3 + 3*Math.PI/2;
  path.map_p_to_slope(pp);
  assertRoughlyEquals(1, pp.x, tol);
  assertRoughlyEquals(1, pp.y, tol);
  assertRoughlyEquals(0, pp.dxdp, tol);
  assertRoughlyEquals(1, pp.dydp, tol);
  assertRoughlyEquals(-1, pp.normalX, tol);
  assertRoughlyEquals(0, pp.normalY, tol);
  assertRoughlyEquals(0, pp.normalXdp, tol);
  assertRoughlyEquals(0, pp.normalYdp, tol);
  assertEquals(Number.POSITIVE_INFINITY, pp.slope);
  assertEquals(Number.POSITIVE_INFINITY, pp.radius);
  assertEquals(0, pp.slopeX);
  assertEquals(1, pp.slopeY);
};

/** Test an FlatlPath, to check that horizontal segments have correct info.
*/
static testNumericalPath4() {
  startTest(NumericalPathTest.groupName+'testNumericalPath4');
  const tol = 1E-6;
  const tol2 = 1E-5;
  const path = new NumericalPath(new FlatPath());
  const pp = new PathPoint(0, /*calculateRadius=*/true);
  // t = goes from -5 to 5
  // p = t + 5
  // p = goes from 0 to 10
  pp.p = 5;
  path.map_p_to_slope(pp);
  assertRoughlyEquals(0, pp.x, tol);
  assertRoughlyEquals(0, pp.y, tol);
  assertRoughlyEquals(1, pp.dxdp, tol);
  assertRoughlyEquals(0, pp.dydp, tol);
  assertEquals(0, pp.slope);
  assertEquals(1, pp.slopeX);
  assertEquals(0, pp.slopeY);
  assertEquals(Number.POSITIVE_INFINITY, pp.radius);
  assertRoughlyEquals(0, pp.normalX, tol);
  assertRoughlyEquals(1, pp.normalY, tol);
  assertRoughlyEquals(0, pp.normalXdp, tol);
  assertRoughlyEquals(0, pp.normalYdp, tol);
};

} // end class

/**
* @type {string}
* @const
*/
NumericalPathTest.groupName = 'NumericalPathTest.';

exports = NumericalPathTest;
