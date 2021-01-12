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

goog.module('myphysicslab.lab.engine2D.UtilEngine');

const asserts = goog.require('goog.asserts');

const DebugEngine2D = goog.require('myphysicslab.lab.engine2D.DebugEngine2D');
const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const MutableVector = goog.require('myphysicslab.lab.util.MutableVector');
const Random = goog.require('myphysicslab.lab.util.Random');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Provides utility methods for the physics engine.

@todo  document the Lin Bairstow polynomial solver.

@todo find a more reliable polynomial solver; Mathematica comes up with the same
    answer each time, whereas for some tests, the polynomial solver here has low
    accuracy.  Note that some tests of this polynomial solver must use a high tolerance.
    Actually, it is only the imaginary values that have low accuracy;  when
    a result is real it seems to have full accuracy.

@todo some methods/functions here are not currently being used, so either delete
    them or move to some other namespace.
*/
class UtilEngine {
constructor() {
  throw '';
};

/**
* @param {number} x
* @return {number} x squared
*/
static square(x) {
  return x*x;
};

/**  Returns a new matrix which is the square matrix A with column b appended.
* @param {!Array<!Float64Array>} A
* @param {!Array<number>} b
* @return {!Array<!Float64Array>} a new matrix which is the square matrix A
*     with column b appended.
*/
static addColumnToMatrix(A, b) {
  var i, j;
  var n = A.length;
  if (b.length != n)
    throw '';
  var M = UtilEngine.newEmptyMatrix(n, n+1);
  for (i=0; i<n; i++)
    for (j=0; j<n; j++)
      M[i][j] = A[i][j];
  for (i=0; i<n; i++)
    M[i][n] = b[i];
  return M;
};

/** Checks that all numbers in an array are numbers, not NaN.
* @param {!Array<number>} x
*/
static checkArrayNaN(x) {
  if (Util.DEBUG) {
    var isOK = true;
    for (var i=0, len=x.length; i<len; i++)
      isOK = isOK && !isNaN(x[i]);
    if (!isOK) {
      UtilEngine.printArray('fail NaN ', x);
      asserts.fail('checkArrayNaN');
    }
  }
};

/**
* @param {!Array<!MutableVector>} p
* @return {number}
* @private
*/
static colinearity(p) {
  asserts.assert(p.length == 3);
  // find dot product of two lines
  var v1 = Vector.clone(p[1]).subtract(p[0]).normalize();
  var v2 = Vector.clone(p[2]).subtract(p[0]).normalize();
  if (v1 == null || v2 == null)
    return 0;
  else
    return Math.abs(v1.dotProduct(v2));
};

/**
* @param {!Array<boolean>} set
* @param {number} n
* @return {number}
*/
static countBoolean(set, n) {
  var c = 0;  // number of elements in set
  for (var i=0; i < n; i++)
    if (set[i]) c++;
  return c;
};

/**  Returns distance from the point `p2` to the line formed by erecting a normal at
point `p1`.
Let the slope of the normal be k
The line is y - p1y = k (x - p1x)
The line of the normal through p2 is y - p2y = (-1/k)(x - p2x)
Solve these two equations to get the intersection point q
qx = (-p1y + p2y + k p1x + p2x/k ) / (1/k + k)
qy = p1y + k (qx - p1x)
* @param {!Vector} p1 the point the normal passes thru
* @param {!Vector} n the normal at point `p1`
* @param {!Vector} p2 the point of interest
* @return {number} distance from the point `p2` to the line formed by erecting a normal
*    at point `p1`
*/
static distanceToLine(p1, n, p2) {
  var r;
  if (Math.abs(n.getX()) < Vector.TINY_POSITIVE) { // vertical line
    r = Math.abs(p2.getX() - p1.getX());
  } else if (Math.abs(n.getY()) < Vector.TINY_POSITIVE) { // horizontal line
    r = Math.abs(p2.getY() - p1.getY());
  } else {
    var k = n.getY()/n.getX(); // slope of line
    var qx = (-p1.getY() + p2.getY() + k*p1.getX() + p2.getX()/k) / (1/k + k);
    var qy = p1.getY() + k * (qx - p1.getX());
    var dx = p2.getX()-qx;
    var dy = p2.getY()-qy;
    r = Math.sqrt(dx*dx + dy*dy);
  }
  return r;
};

/** Returns a minimum point of the given objective function, which is a
function of two values. This method uses the Nelder-Mead Downhill Simplex
algorithm. The two values can be considered as a point in a 2D plane, and the
objective function is then a surface above that 2D plane. This method seeks the
low point on that surface, starting from the given starting point.

A simplex in 2 dimensions is a triangle.  The algorithm looks at the value
of the function at the three Vertexes of a triangle and moves the worst
vertex to a new better location.

There is debug code in the methods used to find nearest point between two
OvalEdge. Includes a method `printFunction` that prints a table of
values of the distance function over a grid of points. This table can then be
displayed in Mathematica, using commands like:

    a = Import['/Users/erikn/Desktop/test4.txt', 'Table'];
    ListContourPlot[a, Contours -> 12, DataRange -> {{-2.6015, -2.6005}, {1.508, 1.509}}]

where the DataRange is the range of input values to the function.

This debug code was used to determine why the Downhill Simplex algorithm was
getting stuck or not finding the correct minimum occasionally when the ovals
are deeply overlapping. It was due to several local minima appearing in the
distance function when the ovals are deeply overlapping.

Added code for detecting this situation: we look for either of the following
conditions:

1) the points of the simplex triangle become colinear or
2) the result value that is found is not close to zero.

Added code in the calling method for picking random starting points when this failure
takes place. While the random starting points does result in valid solutions, the
problem is that it can find any of several (4 or more) valid points in the space.
Ultimately I decided its better to not give an answer at all in this situation, but
instead indicate that the algorithm has failed.

Failure is OK here because it happens only when the ovals are deeply
interpenetrating; when there is only shallow interpenetration, the algorithm
works fine. And success with the shallow penetration case is all that is really
needed for edge/edge collision detection, because vertex/edge collisions can
catch the deeper penetrations. As the collision binary search process gets
close to the time of collision, the penetration will become very shallow, and
then the edge/edge calculation is valid.

UPDATE: turned off the test for value reaching zero;
now successful completion only depends on the
distance between points becoming small.

@param {!Array<!MutableVector>} p  the starting 3 points for the search
@param {function(!GenericVector): number} f  the objective function to minimize,
        a function of two values contained in the GenericVector.
@param {number} tolerance  the search ends when the simplex edges are smaller than
        this value
@param {!Array<number>} info an array of a two ints, returns
        the number of iterations taken in info[0],
        and whether the algorithm was successful in info[1]
        where 1 means failure, 0 means success.
@return {!Vector} the two values where the minimum was found
*/
static findMinimumSimplex(p, f, tolerance, info) {
  var i;
  if (info.length < 2)
    throw Util.DEBUG ? 'info array length < 2' : '';
  if (p.length != 3)
    throw Util.DEBUG ? 'must pass 3 points' : '';
  /** @type {!Array<number>} */
  var v = new Array(3); // values of the three points
  for (i=0; i<3; i++) {
    v[i] = f(p[i]);
  }
  // sort the points so that v[0] <= v[1] <= v[2]
  if (v[0] > v[1])
    UtilEngine.swapPointValue(v, p, 0, 1);
  if (v[1] > v[2])
    UtilEngine.swapPointValue(v, p, 1, 2);
  if (v[0] > v[1])
    UtilEngine.swapPointValue(v, p, 0, 1);
  // From this point on, we keep the points sorted:
  // p[0] = B = best;   p[1] = G = good;  p[2] = W = worst
  // Allocate these arrays outside of the loop for a slight efficiency gain.
  var m = new MutableVector(0, 0); // mid-point of the good side
  var r = new MutableVector(0, 0); // reflected point
  var e = new MutableVector(0, 0); // expansion point
  var c1 = new MutableVector(0, 0); // contracted point
  var c2 = new MutableVector(0, 0); // contracted point
  var t = new MutableVector(0, 0); // temporary intermediate result
  var counter = 0; // count number of iterations
  // begin Nelder-Mead Downhill Simplex algorithm
  var md;
  while ((md = UtilEngine.maxDistance(p)) > tolerance) {
    asserts.assert(v[0] <= v[1]);
    asserts.assert(v[1] <= v[2]);
    counter++;
    if (UtilEngine.debugSimplex_) {
      console.log('iteration '+counter+' max dist '+Util.NF5(md));
      // this shows the progress of the algorithm:  values and point locations
      for (i= 0; i<3; i++)
        console.log(i+'. '+Util.NF5(v[i])+' at '+p[i]);
    }
    if (counter > 10000) {
      if (UtilEngine.debugSimplex_) {
        var c = UtilEngine.colinearity(p);
        console.log('FAILURE colinearity = '+Util.NF5(c)+
          ' value='+Util.NF5(v[0]));
      }
      info[0] = counter;
      info[1] = 1;  // 1 = failure
      return Vector.clone(p[0]);
    }
    // The triangle has 3 points: p[] = best, good, worst = (B, G, W)
    // p[0] = B = best;   p[1] = G = good;  p[2] = W = worst
    // Find midpoint M of the good side:  M = (B + G) / 2
    m.setToVector(p[0]).add(p[1]).divide(2);
    // Reflection
    // Find the reflected point, R.  It is the reflection of W along the line B G,
    // R can be found as R = M + (M - W) = 2 M - W
    r.setToVector(m).multiply(2).subtract(p[2]);
    var vr = f(r);  // vr = f(R) = value of function at R
    if (UtilEngine.debugSimplex_)
      console.log('Reflection '+Util.NF5(vr)+' at '+r);
    if (vr < v[1]) {
      if (vr >= v[0]) {
        if (UtilEngine.debugSimplex_)
          console.log('Reflection, good but not best ');
        // R is between best and good, so use R and continue
        v[2] = vr;
        p[2].setToVector(r);
        UtilEngine.swapPointValue(v, p, 1, 2);
        continue;
      }
      // Expansion
      // Here R is the better than best.
      // So try going even further in this direction, find the expansion point E.
      // E = R + (R - M) = 2 R - M
      e.setToVector(r).multiply(2).subtract(m);
      var ve = f(e); // er = f(E) = value of function at E
      if (UtilEngine.debugSimplex_)
        console.log('Expansion '+Util.NF5(ve)+' at '+e);
      if (ve < vr) {
        if (UtilEngine.debugSimplex_)
          console.log('Expansion best (better than reflection) ');
        // add point E to the triangle
        v[2] = ve;
        p[2].setToVector(e);
      } else {
        if (UtilEngine.debugSimplex_)
          console.log('Reflection best (better than expansion) ');
        // add point R to the triangle
        v[2] = vr;
        p[2].setToVector(r);
      }
      // move the added point to front of list because its the best
      UtilEngine.swapPointValue(v, p, 1, 2);
      UtilEngine.swapPointValue(v, p, 0, 1);
      continue;
    }
    // Contraction
    // Find the contracted point at C = W + (M - W)/2 = (W + M)/2
    c1.setToVector(p[2]).add(m).divide(2);
    var vc1 = f(c1);
    if (UtilEngine.debugSimplex_)
      console.log('Contraction1 '+Util.NF5(vc1)+' at '+c1);
    // Find other (reflected) contracted point at C = M + (M - W)/2 = (3/2) M - W/2
    // (This second contraction point seems to reduce iterations by 5 or so.)
    t.setToVector(p[2].divide(2)); // = W/2
    c2.setToVector(m).multiply(1.5).subtract(t);  // = 1.5*M - W/2
    var vc2 = f(c2);
    if (UtilEngine.debugSimplex_)
      console.log('Contraction2 '+Util.NF5(vc2)+' at '+c2);
    // if the contracted point is better than W, then use it
    if (vc1 < v[2] && vc1 < vc2) {
      if (UtilEngine.debugSimplex_)
        console.log('Contraction1 better than worst ');
      v[2] = vc1;
      p[2].setToVector(c1);
      if (v[2] < v[1])
        UtilEngine.swapPointValue(v, p, 1, 2);
      if (v[1] < v[0])
        UtilEngine.swapPointValue(v, p, 0, 1);
      continue;
    }
    if (vc2 < v[2]) {
      if (UtilEngine.debugSimplex_)
        console.log('Contraction2 better than worst ');
      v[2] = vc2;
      p[2].setToVector(c2);
      if (v[2] < v[1])
        UtilEngine.swapPointValue(v, p, 1, 2);
      if (v[1] < v[0])
        UtilEngine.swapPointValue(v, p, 0, 1);
      continue;
    }
    // Reduction
    if (UtilEngine.debugSimplex_)
      console.log('Reduction ');
    // Shrink the triangle
    p[1].add(p[0]).divide(2);
    p[2].add(p[0]).divide(2);
    v[1] = f(p[1]);
    v[2] = f(p[2]);
    if (UtilEngine.debugSimplex_)
      console.log('Reduction1 '+Util.NF5(v[1])+' at '+p[1]);
    if (UtilEngine.debugSimplex_)
      console.log('Reduction2 '+Util.NF5(v[2])+' at '+p[2]);
    // sort the points
    if (v[0] > v[1])
      UtilEngine.swapPointValue(v, p, 0, 1);
    if (v[1] > v[2])
      UtilEngine.swapPointValue(v, p, 1, 2);
    if (v[0] > v[1])
      UtilEngine.swapPointValue(v, p, 0, 1);
  }
  if (v[0] > 0.01) {
    if (UtilEngine.debugSimplex_)
      console.log('did not go to zero '+v[0]);
  }
  info[0] = counter;
  //info[1] = v[0] < 0.01 ? 0 : 1; // 0 means successful completion
  info[1] = 0;  // 0 means successful completion
  return Vector.clone(p[0]);
};

/** Returns array formatted as string, showing index number and value of each element.
* @param {!(Array<number>|Float64Array)} r  the array to print
* @param {number=} opt_start  index of first item to print
* @param {number=} opt_n  number of items to print
* @param {function(number) : string=} opt_nf  number format function to use
* @return {string} the array formatted as a string
*/
static formatArray(r, opt_start, opt_n, opt_nf) {
  var nf = opt_nf || Util.NF5E;
  var start = opt_start || 0;
  if (start >= r.length) {
    throw '';
  }
  var n = opt_n || r.length - start;
  var end = start + n;
  var s = '';
  for (var i=start; i<end; i++) {
    s += '['+i+']' + nf(r[i]) + ', ';
  }
  return s;
};

/** Returns point of intersection if the two line segments intersect, otherwise
returns `null`. The first line is between points 1 and 2, the second line is
between points 3 and 4.

May 27 2013: made parallel_tol smaller (1E-16 instead of 1E-10). This fixes a problem
that showed up with Sumo game or RigidBodySim (without ContactSim) where dragging a
block into the left wall would eventually fall thru the wall.

Oct 21 2016: add tolerance at endpoints. This fixes a problem where objects with acute
angled corners are sliding on the floor, and their acute corners collide. Due to
floating point errors, we can miss finding an intersection in that case. Adding a small
tolerance extends the edge slightly and lets us find an intersection.
See {@link myphysicslab.test.StraightStraightTest#acute_corners_setup}.

@param {!Vector} p1  point 1, start of first line
@param {!Vector} p2  point 2, end of first line
@param {!Vector} p3  point 3, start of second line
@param {!Vector} p4  point 4, end of second line
@return {?Vector} the intersection point, or `null` if the line
    segments do not intersect
*/
static linesIntersect(p1, p2, p3, p4) {
  var xi, yi, k1, k2;
  var x1 = p1.getX();
  var y1 = p1.getY();
  var x2 = p2.getX();
  var y2 = p2.getY();
  var x3 = p3.getX();
  var y3 = p3.getY();
  var x4 = p4.getX();
  var y4 = p4.getY();
  var parallel_tol = 1E-16; // tolerance for whether lines are parallel
  // tol = tolerance at end points: this makes the edges slightly longer
  // and increases chance of finding intersection at endpoints.
  var tol = 1E-14;
  // quick test whether intersection is possible
  var d = x1 > x2 ? x1 : x2;
  if (x3 > d && x4 > d) {
    return null;
  }
  d = x1 < x2 ? x1 : x2;
  if (x3 < d && x4 < d) {
    return null;
  }
  d = y1 > y2 ? y1 : y2;
  if (y3 > d && y4 > d) {
    return null;
  }
  d = y1 < y2 ? y1 : y2;
  if (y3 < d && y4 < d) {
    return null;
  }
  //console.log('linesIntersect '+x1+' '+y1+' '+x2+' '+y2+' '+x3+' '+y3+' '+x4+' '+y4);
  if (Math.abs(x2-x1) < parallel_tol) {
    // first line is vertical
    if (Math.abs(x4-x3) < parallel_tol) // both lines are vertical
      return null;
    k2 = (y4-y3)/(x4-x3);  // slope of 2nd line
    xi = x1;
    yi = k2*(xi-x3)+y3;
    // test if on both line segments
    if (y2 < y1) { d=y1; y1=y2; y2=d; }
    if (x2 < x1) { d=x1; x1=x2; x2=d; }
    if (x4 < x3) { d=x3; x3=x4; x4=d; }
    if (y4 < y3) { d=y3; y3=y4; y4=d; }
    if (y1-tol <= yi && yi <= y2+tol) {
      if (x3-tol <= xi  && xi <= x4+tol) {
        if (y3-tol <= yi && yi <= y4+tol) {
          return new Vector(xi, yi);
        }
      }
    }
    return null;
  } else if (Math.abs(x4-x3) < parallel_tol) {
    // second line is vertical
    k1 = (y2-y1)/(x2-x1); // slope of 1st line
    xi = x3;
    yi = k1*(xi-x1)+y1;
    // test if on both line segments
    if (y2 < y1) { d=y1; y1=y2; y2=d; }
    if (x2 < x1) { d=x1; x1=x2; x2=d; }
    if (x4 < x3) { d=x3; x3=x4; x4=d; }
    if (y4 < y3) { d=y3; y3=y4; y4=d; }
    if (x1-tol <= xi && xi <= x2+tol) {
      if (y1-tol <= yi && yi <= y2+tol) {
        if (y3-tol <= yi && yi <= y4+tol) {
          return new Vector(xi, yi);
        }
      }
    }
    return null;
  } else {
    k1 = (y2-y1)/(x2-x1); // slope of 1st line
    k2 = (y4-y3)/(x4-x3);  // slope of 2nd line
    if (Math.abs(k2-k1) < parallel_tol)
      return null;  // parallel lines don't intersect
    if (Math.abs(k2) < parallel_tol) {
      // second line is horizontal
      // yi = k1 (xi - x1) + y1  ; equation of 1st line
      // (yi - y1)/k1 + x1 = xi
      yi = (y3 + y4) /2;  // they are pretty much equal, but average them anyway
      xi = (yi - y1)/k1 + x1;
    } else if (Math.abs(k1) < parallel_tol) {
      // first line is horizontal
      // yi = k2 (xi - x3) + y3 ; equation of 2nd line
      // (yi - y3)/k2 + x3 = xi
      yi = (y1 + y2) /2;  // they are pretty much equal, but average them anyway
      xi = (yi - y3)/k2 + x3;
    } else {
      // neither line is horizontal
      // yi = k1 (xi - x1) + y1  ; equation of 1st line
      // yi = k2 (xi - x3) + y3  ; equation of 2nd line
      // 0 = (k2 - k1) xi + -k2 x3 + k1 x1 + y3 - y1
      // xi = (k2 x3 - k1 x1 - y3 + y1) / (k2 - k1)
      xi = (k2*x3 - k1*x1 - y3 + y1) / (k2 - k1);
      yi = k1*(xi - x1) + y1;
    }
    if (y2 < y1) { d=y1; y1=y2; y2=d; }
    if (x2 < x1) { d=x1; x1=x2; x2=d; }
    if (x4 < x3) { d=x3; x3=x4; x4=d; }
    if (y4 < y3) { d=y3; y3=y4; y4=d; }
    //console.log((x1 <= xi )+' '+( xi <= x2 )+' '+( y1 <= yi )
    //+' '+( yi <= y2 )+' '+( x3 <= xi  )+' '+( xi <= x4 )+' '+( y3 <= yi )
    //+' '+( yi <= y4));
    if (x1-tol <= xi && xi <= x2+tol) {
      if (y1-tol <= yi && yi <= y2+tol) {
        if (x3-tol <= xi  && xi <= x4+tol) {
          if (y3-tol <= yi && yi <= y4+tol) {
            return new Vector(xi, yi);
          }
        }
      }
    }
    return null;
  }
};

/**
* @param {!Array<!MutableVector>} p
* @return {number}
* @private
*/
static maxDistance(p) {
  asserts.assert(p.length == 3);
  var dist = p[0].distanceSquaredTo(p[1]);
  var d = p[0].distanceSquaredTo(p[2]);
  if (d > dist) {
    dist = d;
  }
  d = p[1].distanceSquaredTo(p[2]);
  if (d > dist) {
    dist = d;
  }
  return Math.sqrt(dist);
};

/** Returns the absolute value of the largest (in absolute value) entry in the vector.
* @param {!Array<number>} r
* @param {number=} n length of list (optional)
* @return {number} the absolute value of the largest entry in the vector
*/
static maxSize(r, n) {
  let max = 0;
  n = n || r.length;
  for (let i=0; i<n; i++) {
    const v = Math.abs(r[i]);
    if (v > max) {
      max = v;
    }
  }
  return max;
};

/** Returns minimum value of a vector.
* @param {!Array<number>} r the vector of interest
* @param {number=} n length of list (optional)
* @return {number} the minimum value of the vector
*/
static minValue(r, n) {
  var min = Util.POSITIVE_INFINITY;
  n = n || r.length;
  for (var i=0; i<n; i++) {
    if (r[i] < min) {
      min = r[i];
    }
  }
  return min;
};

/**
* @param {string} s  preamble
* @param {!Array<number>} r  the array to print
* @param {function(number) : string=} nf  number format function to use
* @param {number=} opt_n  length of array
*/
static printArray(s, r, nf, opt_n) {
  if (Util.DEBUG) {
    nf = nf || Util.NF7E;
    opt_n = opt_n || r.length;
    for (var i=0; i<opt_n; i++) {
      s += ' ['+i+']='+nf(r[i]);
    }
    console.log(s);
  }
};

/**
* @param {string} s  preamble
* @param {!(Array<number>|Float64Array)} r  the array to print
* @param {function(number) : string=} nf  number format function to use
* @param {number=} opt_n  length of array
*/
static printArray2(s, r, nf, opt_n) {
  if (Util.DEBUG) {
    nf = nf || Util.NF7E;
    opt_n = opt_n || r.length;
    s += ' ';
    for (var i=0; i<opt_n; i++) {
      s += nf(r[i]) + ', ';
    }
    console.log(s);
  }
};

/**
* @param {string} s  preamble
* @param {!Float64Array} r  the array to print
* @param {string} delim  delimiter between entries
*/
static printArray3(s, r, delim) {
  if (Util.DEBUG) {
    for (var i=0, len=r.length; i<len; i++) {
      /** @type {string} */
      var ns;
      /** @type {number} */
      var num = r[i];
      if (num !== undefined) {
        ns = num.toFixed(2);
        if (ns === '0.00') {
          ns = '     ';
        }
      } else {
        ns = 'undef';
      }
      s += ns + delim;
    }
    console.log(s);
  }
}

/**  Prints set of indices where the array has a boolean value of 'true'.
* @param {string} s preamble
* @param {!Array<boolean>} r array to print
* @param {number} n length of array
*/
static printArrayIndices(s, r, n) {
  if (Util.DEBUG) {
    s += ' [';
    for (var i=0; i<n; i++) {
      if (r[i]) {
        s += i+', ';
      }
    }
    s += ']';
    console.log(s);
  }
};

/**
* @param {string} s  preamble
* @param {!Float64Array} r  the array to print
* @param {!Array<number>} ncol  the column permutation vector
* @param {function(number) : string=} nf  number format function to use
* @param {number=} opt_n  length of array
*/
static printArrayPermutation(s, r, ncol, nf, opt_n) {
  if (Util.DEBUG) {
    nf = nf || Util.NF7;
    opt_n = opt_n || r.length;
    for (var i=0; i<opt_n; i++) {
      s += nf(r[ncol[i]]) + ', ';
    }
    console.log(s);
  }
};

/**
* @param {string} s
* @param {!Array} list
*/
static printList(s, list) {
  if (Util.DEBUG) {
    s += ' [';
    for (var i=0, len=list.length; i<len; i++) {
      s += list[i].toString()+', ';
    }
    s += ']';
    console.log(s);
  }
};

/**
* @param {string} s  preamble
* @param {!Array<!Float64Array>} m  the matrix to print
* @param {function(number) : string=} nf  number format function to use
* @param {number=} n  number of rows of matrix
*/
static printMatrix2(s, m, nf, n) {
  if (Util.DEBUG) {
    nf = nf || Util.NF7E;
    n = n || m.length;
    console.log(s);
    for (var i=0; i<n; i++)
      UtilEngine.printArray2('', m[i], nf, n);
  }
}

/**  Prints the matrix using the given permutation vector to rearrange the rows,
  and uses a special format that displays the matrix with aligned columns, and
  blank space for zeros.
* @param {string} s  preamble
* @param {!Array<!Float64Array>} m  the matrix to print
* @param {!Array<number>} nrow  the row permutation vector
*/
static printMatrix3(s, m, nrow) {
  if (Util.DEBUG) {
    console.log(s);
    for (var i=0, len=m.length; i<len; i++) {
      UtilEngine.printArray3('', m[nrow[i]], ',');
    }
  }
}

/**
* @param {string} s  preamble
* @param {!Array<!Float64Array>} m  the matrix to print
* @param {!Array<number>} nrow  the row permutation vector
* @param {!Array<number>} ncol  the column permutation vector
* @param {function(number) : string=} nf  number format function to use
* @param {number=} n  number of rows of matrix
*/
static printMatrixPermutation(s, m, nrow, ncol, nf, n) {
  if (Util.DEBUG) {
    console.log(s);
    n = n || m.length;
    for (var i=0; i<n; i++) {
      UtilEngine.printArrayPermutation('', m[nrow[i]], ncol, nf, n+1);
    }
  }
};

/**  Returns A . x - b, matrix A multiplied by a vector x,
  and optionally subtracts a second vector b.
* @param {!Array<!Float64Array>} A matrix
* @param {!Array<number>} x vector
* @param {!Array<number>=} opt_b  optional vector to subtrct
* @return {!Array<number>} result is A . x - b
*/
static matrixMultiply(A, x, opt_b) {
  var n = x.length;
  asserts.assert(A.length >= n);
  asserts.assert(A[0].length >= n);
  asserts.assert(!opt_b || opt_b.length >= n);
  /** @type {!Array<number>}*/
  var r = new Array(n);
  for (var i=0; i<n; i++) {
    r[i] = 0;
    for (var j=0; j<n; j++) {
      r[i] += A[i][j] * x[j];
    }
    if (opt_b) {
      r[i] += -opt_b[i];
    }
  }
  return r;
};

/** Returns the maximum error in the solution of matrix equation A . x = b.
@param {!Array<!Float64Array>} A an n x n square matrix and is not changed.
@param {!Array<number>} x solution vector
@param {!Array<number>} b the b-vector of equation A x = b
@return {number} the maximum value of |A . x - b|
*/
static matrixSolveError(A, x, b) {
  var r = UtilEngine.matrixMultiply(A, x, b);
  return r[UtilEngine.maxIndex(r)];
};

/** Solves for x in the matrix problem A x = b.
@param {!Array<!Float64Array>} A an n x n square matrix and is not changed.
@param {!Array<number>} x vector of length `n` where the result from solving
    {A x = b} will be stored
@param {!Array<number>} b the b-vector of equation A x = b
@param {number=} zero_tol  small positive number, anything smaller is regarded as zero
@return {number} -1 if successful, or row number where error occurs
*/
static matrixSolve4(A, x, b, zero_tol) {
  zero_tol = (zero_tol === undefined) ? UtilEngine.MATRIX_SOLVE_ZERO_TOL : zero_tol;
  var M = UtilEngine.addColumnToMatrix(A, b);
  /** @type {!Array<number>}*/
  var nrow = new Array(x.length);
  return UtilEngine.matrixSolve3(M, x, zero_tol, nrow);
};

/** Solves `A x = b`, using Gaussian Elimination with Scaled Partial Pivoting, where `A`
is an `n x n+1` augmented matrix with last column being `b`. This matrix solver can find
solutions even when the matrix is singular, as long as the b vector is in the column
space of the A matrix. Based on algorithm 6.3 in Numerical Analysis, 6th edition by
Burden &amp; Faires, page 371. If b is in the column space of A, then we should be able
to solve `A x = b` even if A is a singular matrix. Singular means that A is not
invertible, that some rows of A are linear combinations of other rows of A, that the
null space of A is not empty.

New on Aug 24 2011:  when we find a zero on diagonal, swap columns.  This
ensures that all the entries below the diagonal are zero, until the zero
rows are reached.

Note that doing the scaling actually made the pile_20_random_blocks test go faster (13.5
seconds down to 13.0 seconds) in spite of the extra divide.

WARNING: A is modified into upper triangular format (when accessed by the row
permutation vector).

@todo  the logic for back substitution can maybe be simplified now because
we are guaranteed to have non-zero on diagonal until the last zero rows.

@todo  pass in ncol, so that the caller can display the matrix in correct
format???

@param {!Array<!Float64Array>} A an `n` by `n+1` matrix (or bigger),
    with the last column containing the `b` vector, it is modified into
    upper triangular format as a result of Gaussian Elimination.
@param {!Array<number>} x vector of length `n` where the result from solving
    `A x = b` will be stored
@param {number} zero_tol  small positive number, anything smaller is regarded as zero
@param {!Array<number>} nrow  where the row permutation vector will be stored
@return {number} -1 if successful, or row number where error occurs
*/
static matrixSolve3(A, x, zero_tol, nrow) {
  const ZERO_TOL2 = 0.1;
  const debug = UtilEngine.MATRIX_SOLVE_DEBUG;
  const n = x.length;
  asserts.assert(A.length >= n);
  asserts.assert(A[0].length >= n+1);
  if (Util.DEBUG && debug) {
    console.log('maxtrixSolve3 n='+n);
  }
  // Step 1. Initialize row pointer and scaling factors
  asserts.assert(nrow.length >= n);
  /** @type {!Array<number>}*/
  const ncol = new Array(n+1); // ncol = column pointers
  /** @type {!Array<number>}*/
  const s = new Array(n); // s = scaling factors
  for (let i=0; i<n; i++) {
    nrow[i] = i;
    ncol[i] = i;
    s[i] = 0;
    for (let j=0; j<n; j++)
      if (Math.abs(A[i][j]) > s[i])
        s[i] = Math.abs(A[i][j]);
    // @todo why not use zero_tol here??
    if (s[i] < UtilEngine.SMALL_POSITIVE) {
      if (Util.DEBUG) {
        console.log('no unique solution, because row '+i
            +' is zero; n='+n);
        UtilEngine.printMatrix2('A', A, Util.NF7, n);
      }
      return i;
    }
  }
  ncol[n] = n;  // last column remains the b vector always.
  // Step 2. elimination process
  // c = column;  r = row
  let r = 0;
  let loopCtr = 0;
  eliminate:
  for (let c=0; c<n; c++) {
    if (Util.DEBUG && loopCtr++ > 2*n) {
      console.log('matrixSolv3 loopCtr='+loopCtr+' c='+c+' n='+n);
    }
    let columnSwaps = 0;
    while (true) {
      // Step 3.  let p be the smallest integer with r <= p <= n-1 and
      // |A[nrow[p], c]| / s[nrow[p]]  = max(r<=j<=n-1)  |A[nrow[j], c]| / s[nrow[j]]
      let p = r;
      let max = Math.abs(A[nrow[p]][ncol[c]]) / s[nrow[p]];
      for (let j=r+1; j<n; j++) {
        let d = Math.abs(A[nrow[j]][ncol[c]]) / s[nrow[j]];
        if (d > max) {
          max = d;
          p = j;
        }
      }
      // Step 4. If A[nrow[p]][c] == 0, then no unique solution
      // new:  swap columns, and hope for the best
      if (Math.abs(A[nrow[p]][ncol[c]]) < zero_tol) {
        if (debug && Util.DEBUG) {
          console.log('largest scaled entry in column '+c+' is small: '
              +Util.NFE(A[nrow[p]][ncol[c]]));
        }
        if (columnSwaps >= (n-1 - c)) {
          if (debug && Util.DEBUG) {
            console.log('columnSwaps='+columnSwaps+' >= '+(n-1)+' - '+c);
          }
          break eliminate;
        }
        // simulated column interchange
        if (debug && Util.DEBUG) {
          UtilEngine.printArray('before column swap; c='+c, ncol);
        }
        const ncopy = ncol[c];
        for (let j=c; j<n-1; j++) {
          ncol[j] = ncol[j+1];
        }
        ncol[n-1] = ncopy;
        columnSwaps++;
        if (debug && Util.DEBUG) {
          UtilEngine.printArray('after column swap', ncol);
        }
        continue;
      }
      // Step 5.  simulated row interchange
      if (nrow[r] != nrow[p]) {
        const ncopy = nrow[r];
        nrow[r] = nrow[p];
        nrow[p] = ncopy;
      }
      for (let j=r+1; j<n; j++) {
        let m = A[nrow[j]][ncol[c]] / A[nrow[r]][ncol[c]];
        // do a row operation
        for (let k=0; k<n+1; k++)
          A[nrow[j]][ncol[k]] -= m*A[nrow[r]][ncol[k]];
      }
      if (debug && Util.DEBUG) {
        UtilEngine.printMatrixPermutation('A '+n, A, nrow, ncol, Util.NFE, n);
      }
      r++;  // only increment row when successful.
      columnSwaps = 0;
      break;
    }
  }
  // r is incremented one beyond the last row treated.
  r--;
  if (debug && Util.DEBUG)
    console.log('last row treated: r = '+r);
  // For singular matrix, we wind up with one or more rows of all zeros at the end.
  // To have a solution, the corresponding entries in the b vector must be zero.
  // (The b vector is stored in column n of the augmented A matrix).
  if (r < n-1) {
    for (let i=r+1; i<n; i++) {
      if (Math.abs(A[nrow[i]][n]) > ZERO_TOL2) {
        if (0 == 1 && Util.DEBUG) {
          console.log('b vector not in column space ['+nrow[i]+'] '
              +Util.NFE(A[nrow[i]][n]));
          UtilEngine.printMatrixPermutation('A', A, nrow, ncol, Util.NF7, n);
        }
        return nrow[i];
      } else if (0 == 1 && Util.DEBUG) {
        if (Math.abs(A[nrow[i]][n]) > 1E-7)
          console.log('matrix is singular and last b-value ['+nrow[i]+'] '
              +Util.NFE(A[nrow[i]][n]));
        else
          console.log('matrix is singular');
      }
    }
  }
  // Step 10. Backward substitution
  // start in the last non-zero row, r.
  let c = n-1; // column
  let lastC = n;  // last column operated on
  while (r >= 0) {
    // find the left most non-zero entry A[r,c], such that c >= r
    // (on or above the diagonal)
    let lmost = -1;
    for (let k = c; k >= r; k--) {
      if (Math.abs(A[nrow[r]][ncol[k]]) > zero_tol)
        lmost = k;
    }
    if (lmost != -1 && lmost != c) {
      c = lmost;
      if (debug && Util.DEBUG)
        console.log('move left in row  r = '+r+' to c='+c
            +' A[r,c]='+Util.NFE(A[nrow[r]][ncol[c]]));
    }
    // if there is a zero at A[r,c], then move up a row
    if (Math.abs(A[nrow[r]][ncol[c]]) < zero_tol) {
      if (debug && Util.DEBUG) {
        console.log('zero on diagonal move up a row r='+r+' c='+c
            +' A[r,c]='+Util.NFE(A[nrow[r]][ncol[c]]));
      }
      r--;
      continue;
    }
    // we now have the left-most non-zero entry A[r,c] with c >= r
    if (debug && Util.DEBUG) {
      console.log('r='+r+' c='+c+' A[r,c]='+Util.NFE(A[nrow[r]][ncol[c]]));
    }
    // if underdetermined, set some of the x[i] to 0
    // 'underdetermined' means that we have more than one free variable in this
    // equation for example a single equation with 2 unknowns.
    if (lastC - c > 1) {
      for (let j=c+1; j<lastC; j++)
        x[ncol[j]] = 0;
    }
    lastC = c;
    // solve for x[c]
    // Because we've solved already for x[j] with j > c, and
    // because this row has A[r][j] == 0 for j < c
    // we can find x[c] in terms of the x[j] already solved for.
    var sum = 0;
    for (let j=c+1; j<n; j++) {
      sum += A[nrow[r]][ncol[j]]*x[ncol[j]];
    }
    x[ncol[c]] = (A[nrow[r]][n] - sum)/A[nrow[r]][ncol[c]];
    // move up a row and left a column
    c--;
    r--;
  }
  if (0 == 1 && Util.DEBUG) {
    UtilEngine.printArray('',nrow);
    UtilEngine.printMatrix3('A '+A.length+'x'+A[0].length, A, nrow);
  }
  return -1;
};

/** Returns true if the given upper triangular matrix is singular **NOTE THIS IS
WRONG**.

Estimate condition number of the matrix. Gill, Murray, Wright p. 152 give an estimation
for condition of an upper triangular matrix `U`

    cond(U) >= max_i |u_ii | / min_i | u_ii |

So, we find the max and min element on the diagonal, and it’s their ratio.

* **NOTE:  THIS IS WRONG.**  The test is when `A` is factored into `L U` form,
and `L` has all 1's on its diagonal.

@param {!Array<!Float64Array>} Acc an `n` by `n` matrix
@param {number} n number of rows
@param {!Array<number>} nrow  the row permutation vector
@param {number} tolerance  small positive number, anything smaller is regarded as zero
@return {boolean} true if the given upper triangular matrix is singular
*/
static matrixIsSingular(Acc, n, nrow, tolerance) {
  var min = Util.POSITIVE_INFINITY;
  var max = 0;
  for (var i=0; i<n; i++) {
    var diag = Math.abs(Acc[nrow[i]][i]);
    if (diag < min)
      min = diag;
    if (diag > max)
      max = diag;
  }
  //double condition = min > 1E-3 ? max/min : Double.MAX_VALUE;
  var condition = max/min;
  var r = Math.abs(min) < tolerance;
  if (0 == 1 && (r || Math.abs(min) < 1.0) && Util.DEBUG)
    console.log('diagonal min='+Util.NFE(min)+' max='+Util.NF5(max)
         +' condition='+Util.NFE(condition)+' singular='+r);
  return r;
};

/** Returns the index of the largest (in absolute value) entry in the vector.
@param {!Array<number>} r vector to examine
@return {number} the index of the largest entry in the vector
*/
static maxIndex(r) {
  var max = 0;
  var j = -1;
  for (var i=0, len=r.length; i<len; i++) {
    if (Math.abs(r[i]) > max) {
      max = Math.abs(r[i]);
      j = i;
    }
  }
  return j;
};

/** Returns a distance such that when points are within this distance then they are
considered to be the same contact point.

For example, consider a circular edge in contact with a straight edge.
If the circular edge has several 'midpoint Vertexes' then we can
potentially find several contacts clustered near the true point of contact.
So you would have a contact between the curved edge and the straight
edge, but also 1 or more contacts between the straight edge and the
midpoint Vertexes on the curved edge nearby.

We want to know how far apart these contacts can potentially be.
It is a function of the radius of curvature and the distance tolerance
used for detecting when a point is in contact.

    For curved edges, base the nearness test on radius of curvature.
    The gap between circle and line is d = r (1 - cos t)
    where t = angle and t = 0 is contact point between circle and line.
    cos power series:  cos z = 1 - z^2 /2! + z^4/4! - etc
    For small t, use the the first two terms only, so we get
    d = r (1 - (1 - t^2 / 2)) = (r/2) t^2
    d = (r/2) t^2
    Let tol = the contact distance tolerance.
    find angle t such that the gap is greater than tol:
    tol < (r/2) t^2
    sqrt(2 tol/r) < t
    The distance is then t r.
    Except that we return twice this, because this is distance between
    the true contact point and neighboring Vertexes;  if you don't
    have the true contact point (because edge/edge collisions are turned off)
    then you could have twice that distance for two Vertexes at the same point.
    For straight edges, just take a constant distance, or a percentage of
    the length of the edge.

    For two curves:  Suppose we are measuring the gap d at a distance h
    from the contact point (a picture would help here);  this is a point
    that is h away from the contact point along the tangent line to the
    two curves at the contact point.
    If you make a diagram, you can convince yourself that for small angles:
    h = t_1 r_1 = t_2 r_2
    where t_i is the small angle that the point at h is away from the
    line going thru the circle centers and the contact point.
    t_1 is the angle for curve 1 with radius r_1,
    t_2 is the angle for curve 2 with radius r_2.
    The gap is the sum of the two gaps derived above:
    d = (r_1 /2) t_1 ^2 + (r_2 /2) t_2 ^2
    We have that t_2 = (r_1 / r_2) t_1, so we can write
    d = (r_1 /2) t_1 ^2 + (r_2 /2) (r_1 / r_2) ^2 t_1 ^2
    d = (r_1 /2) t_1 ^2 (1 + (r_1 / r_2) t_1)
    So we are looking for t_1 such that the gap is greater than tol:
    tol < d
    This gives us a cubic in t_1.

* @param {number} r1 radius of first edge, negative means concave
* @param {number} r2 radius of second edge, negative means concave
* @param {number} distTol distance tolerance
* @return {number} a distance such that when points are within this distance then they
*    are considered to be the same contact point.
*/
static nearness(r1, r2, distTol) {
  if (r1 == Util.NaN || r2 == Util.NaN)
    throw '';
  var r = -1;
  if (r1 == Util.POSITIVE_INFINITY) {
    // r1 is a straight edge
    // if r2 is concave, then treat same as straight/straight case
    // if r2 is convex, then use r2
    r = r2 > 0 ? r2 : r1;
  } else if (r2 == Util.POSITIVE_INFINITY) {
    // if r1 is concave, then treat same as straight/straight case
    // if r1 is convex, then use r1
    r = r1 > 0 ? r1 : r2;
  } else if (r1 > 0 && r2 > 0) {
    // take smaller of two radius for convex ball/ball collision
    r = r1 < r2 ? r1 : r2;
  } else if (r1 < 0) {
    // two curves with one concave:  use the concave radius
    r = -r1;
  } else {
    // two curves with one concave:  use the concave radius
    r = -r2;
  }
  asserts.assert(r > 0);
  if (r == Util.POSITIVE_INFINITY) {
    return distTol;
  } else {
    return 2*r*Math.sqrt(2*distTol / r);
  }
};

/** Returns a new n x m matrix, but with no values filled in.
* @param {number} n  number of rows
* @param {number=} m  number of columns.  If omitted, then make an n x n matrix.
* @return {!Array<!Float64Array>}
*/
static newEmptyMatrix(n, m) {
  m = m || n;
  /** @type {!Array<!Float64Array>}*/
  var a = new Array(n);
  for (var i=0; i<n; i++) {
    a[i] = new Float64Array(m);
    /*for (var j=0; j<m; j++) {
      a[i][j] = 0;
    }*/
  }
  return a;
};

/**  Creates a new square n x n matrix, filling it with values from the
* given array.
* @param {number} n  number of rows of matrix
* @param {!Array<number>} a  array with values, must be length n^2
* @return {!Array<!Float64Array>} a new square n x n matrix, filled with values from
*     array a.
*/
static newMatrixFromArray(n, a) {
  if (a.length < n*n)
    throw '';
  var M = UtilEngine.newEmptyMatrix(n);
  var k=0;
  for (var i = 0; i<n; i++) {
    for (var j=0; j<n; j++) {
      if (j<n)
        M[i][j] = a[k];
      k++;
    }
  }
  /*for (var i = 0; i<a.length; i++) {
    M[Math.floor(i/n)][i%n] = a[i];
  }*/
  return M;
};

/**  Creates a new square n x n matrix, filling it with values from the
* given array which is from an n x (n+1) matrix, so we ignore the last value
* in each 'row' of the array.
* @param {number} n  number of rows of matrix
* @param {!Array<number>} a  array with values, must be length n^2
* @return {!Array<!Float64Array>} a new square n x n matrix, filled with values from
*     array a.
*/
static newMatrixFromArray2(n, a) {
  if (a.length < n*(n+1))
    throw 'a.length='+a.length+' n='+n;
  var M = UtilEngine.newEmptyMatrix(n);
  var k=0;
  for (var i = 0; i<n; i++) {
    for (var j=0; j<n+1; j++) {
      if (j<n)
        M[i][j] = a[k];
      k++;
    }
  }
  return M;
};

/**
* @param {!Array<number>} v
* @param {!Array<!MutableVector>} p
* @param {number} i
* @param {number} j
* @private
*/
static swapPointValue(v, p, i, j) {
  var d = v[i];
  v[i] = v[j];
  v[j] = d;
  var q = p[i];
  p[i] = p[j];
  p[j] = q;
};

/**
* @param {!Array<number>} v
* @param {!Array<number>} u
* @return {!Array<number>}  new vector containing sum: v + u
*/
static vectorAdd(v, u) {
  var n = v.length;
  asserts.assert(u.length == n);
  var r = new Array(n);
  for (var i=0; i<n; i++) {
    r[i] = v[i] + u[i];
  }
  return r;
};

/**  Returns the length of the vector: the sqrt of sum of squared components.
* @param {!Array<number>} p the vector of interest
* @return {number} the length of the vector
*/
static vectorLength(p) {
  var sum = 0;
  for (var i=0, len=p.length; i<len; i++)
    sum += p[i]*p[i];
  return Math.sqrt(sum);
};

} // end class

/** Contains the most recently created RigidBodySim, ***for debugging only***. Provides
a shortcut to make lines and circles from anywhere in the engine2D code.
* @type {?DebugEngine2D}
*/
UtilEngine.debugEngine2D = null;

/**
* @type {number}
* @const
*/
UtilEngine.SMALL_POSITIVE = 1E-10;

/**
* @type {number}
* @const
*/
UtilEngine.SMALL_NEGATIVE = -1E-10;

/**
* @type {number}
* @const
*/
UtilEngine.TOLERANCE = 1E-10;

/**
* @type {number}
* @const
*/
UtilEngine.MATRIX_SOLVE_ZERO_TOL = 1E-10;

/**
* @type {boolean}
* @const
*/
UtilEngine.MATRIX_SOLVE_DEBUG = false;

/**
* @type {boolean}
* @private
* @const
*/
UtilEngine.debugSimplex_ = false;

exports = UtilEngine;
