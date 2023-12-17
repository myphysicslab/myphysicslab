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

import { AbstractSimObject, SimObject } from './SimObject.js';
import { DoubleRect } from '../util/DoubleRect.js';
import { MutableVector } from '../util/MutableVector.js';
import { ParametricPath } from './ParametricPath.js';
import { Path, PathIterator } from './Path.js';
import { PathPoint } from './PathPoint.js';
import { Util, Printable } from '../util/Util.js';
import { Vector, GenericVector } from '../util/Vector.js';

/** An object which has a {@link NumericalPath} that can be set.
*/
export interface HasPath extends Printable {
  /** Returns the NumericalPath for this object.
  * @return the NumericalPath used by this object, or null if no path is set
  */
  getPath(): NumericalPath|null;

  /** Sets the NumericalPath for this object.
  * @param path the NumericalPath to be used by this object
  */
  setPath(path: NumericalPath): void;
};

/** A numerical approximation of a {@link ParametricPath}
providing various functions to find points based on distance along the path and also
the slope, normal, and derivatives at those points. Stores a representation of the
ParametricPath as a table of values; interpolation is used to find values between table
entries.

Many of the NumericalPath methods pass information via a
{@link PathPoint} for both input and output.

See the myPhysicsLab page showing the
[Roller Coaster](https://www.myphysicslab.com/roller/roller-single-en.html)
for more about the math involved here.

## Path Length 'p'

Points on the path are usually specified by the *path distance* to that point from a
designated *starting point* on the path. The starting point is specified by the
parametric *t-value* given by
{@link ParametricPath.getStartTValue}. At that point the
path distance is zero.

Path distance is abbreviated here as `p`, so you see methods named like
{@link NumericalPath.map_p_to_slope} which finds the slope at a point specified by the `p` value of the
point.

## Table of Numerical Values

The path is specified by the parametric function `f(t) = (x(t), y(t))` which is defined
by the ParametricPath provided to the constructor. We build the table by varying the
parameter `t` from `tLow` to `tHigh` which are given by the ParametricPath methods
{@link ParametricPath.getStartTValue} and
{@link ParametricPath.getFinishTValue}.
The table stores information about each sample point such as

+ path distance `p`
+ position `x,y` in space
+ derivative of `x,y` with respect to `p`
+ slope vector
+ normal vector
+ derivative of normal vector with respect to `p`

After the table is created, the parametric function `f(t)` and `tLow`, `tHigh`
are no longer used, instead we interpolate data from the table as needed.

Most of the NumericalPath functions *start with* the `p` value to specify the point, and
the other values are interpolated accordingly.

Some functions *result in finding* a `p` value from a location in space. For example,
when the user clicks the mouse somewhere we need to find the nearest point on the path.
See {@link NumericalPath.findNearestLocal} and {@link NumericalPath.findNearestGlobal}.

## Slope of Path

The slope is found from the relation `dy/dx = (dy/dp) / (dx/dp)`. Because we
store these derivatives of `x` and `y` with respect to `p` in the
table, we can interpolate those at a given point and divide them to get the slope
there.

The method {@link NumericalPath.map_p_to_slope} figures out the slope in this way, and stores it
in the `slope` property of the PathPoint.

## Direction of Path

Sometimes it is important to know the direction of the path: i.e. as
`p` increases, does `x` increase or decrease? This is determined
from the table data as needed. For vertical sections, the question becomes whether as
`p` increases, does `y` increase or decrease.

The method {@link NumericalPath.map_p_to_slope} figures out the direction in this way, and stores it
in the `direction` property of the PathPoint.

## Design Note: How _Not_ To Calculate Slope

A previous version stored the slope, `dy/dx`, at each point
in the table. It turns out to be difficult-to-impossible to interpolate on slope
numbers. The slope goes to infinity on vertical sections. You can get around that by
interpolating on reciprocal of slope. But a persistent problem is that you can run
into situations which are not appropriate for interpolation with a cubic polynomial
(which we do with the private static method `NumericalPath.interp4`).

For example, consider the following case with four values evenly spaced horizontally,
but where the `y` values are highly variable:
```text
[[0.01, 1E-6], [0.02, 6E-6], [0.03, 1E-3], [0.04, 1E3]]
```
The `y` values represent slope and are monotonically increasing. But
a cubic polynomial fitted to those points will swing wildly between the first 3 points
giving a non-monotonic function that crosses over to negative values.

The solution is to *not store slope directly*, instead store `dy/dp` and `dx/dp`
separately and get the slope at any point from their ratio. Both of those seem to be
compatible with polynomial interpolation.

**TO DO**  Use a curve to estimate the path distance when making the table.

**TO DO**  PointsIterator should be able to iterate over entire table. That is, parameterize
it so that you can say how many sample points you want (less for drawing).

**TO DO**  Provide methods to return copy of the entire table as an array (or the columns).

**TO DO**  ??? Should we always have p increase in the pvals array?  This would
make the code simpler.  And I can't think of any reason to allow pvals to decrease.

**TO DO** NumericalPath doing makeTable inside of constructor: this is bad because you
can’t do something as simple as pass radius to Circle constructor. Also, might want to
adjust path later on (translate for example, or scale or rotate). So might want to
have the makeTable thing be callable anytime.

*/
export class NumericalPath extends AbstractSimObject implements SimObject, Path {
  /** Number of points stored in table. */
  private readonly tableLength_: number;
  /** x, horizontal position.  Is public only because of PointsIterator. */
  public xvals: number[];
  /** y, vertical position.  Is public only because of PointsIterator. */
  public yvals: number[];
  /** p, path distance.  Is public only because of PointsIterator. */
  public pvals: number[];
  /** dx/dp */
  private dxvals: number[];
  /** dy/dp */
  private dyvals: number[];
  /** normal x at mid-point */
  private nxVals: number[];
  /** normal y at mid-point */
  private nyVals: number[];
  /** derivative of normal w.r.t. p at mid-point */
  private nxpVals: number[];
  /** derivative of normal w.r.t. p at mid-point */
  private nypVals: number[];
  private closedLoop: boolean;
  /** total length of path */
  private plen: number = 0;
  /** bounds of the path, in simulation coordinates */
  private bounds: DoubleRect = DoubleRect.EMPTY_RECT;
  private x_monotonic: boolean;
  /** start point is used for linear extension, see map_p_to_slope */
  private startPoint_: PathPoint;
  /** end point is used for linear extension, see map_p_to_slope */
  private endPoint_: PathPoint;

/**
* @param path the ParametricPath to represent with a numerical table
* @param opt_tableLength optional number of points to store in table; default
*     is 9000.
*/
constructor(path: ParametricPath, opt_tableLength?: number) {
  super(path.getName());
  this.tableLength_ = opt_tableLength || NumericalPath.DATA_POINTS;
  this.xvals = Util.newNumberArray(this.tableLength_);
  this.yvals = Util.newNumberArray(this.tableLength_);
  this.pvals = Util.newNumberArray(this.tableLength_);
  this.dxvals = Util.newNumberArray(this.tableLength_);
  this.dyvals = Util.newNumberArray(this.tableLength_);
  this.nxVals = Util.newNumberArray(this.tableLength_);
  this.nyVals = Util.newNumberArray(this.tableLength_);
  this.nxpVals = Util.newNumberArray(this.tableLength_);
  this.nypVals = Util.newNumberArray(this.tableLength_);
  this.closedLoop = path.isClosedLoop();
  this.make_table(path);
  Util.assert( this.pvals[0] < this.pvals[this.pvals.length-1]);
  Util.assert(NumericalPath.isMonotonic(this.pvals));
  this.x_monotonic = NumericalPath.isMonotonic(this.xvals);
  this.startPoint_ = new PathPoint(this.getStartPValue());
  this.endPoint_ = new PathPoint(this.getFinishPValue());
  this.map_p_to_slope(this.startPoint_);
  this.map_p_to_slope(this.endPoint_);
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', length: ' + Util.NF5(this.getLength())
      +', closedLoop: '+this.closedLoop
      +', bounds: '+this.bounds
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'NumericalPath';
};

/** Finds where in the array the given value is located using a binary search algorithm.
Given an array `arr[0..n-1]`, and given a value `x`, binarySearch returns a value `i`
such that `arr[i] <= x` and `x < arr[i+1]`. The array must be monotonic, either
increasing or decreasing.

**TO DO**  should this return 0 or n-1 when x is outside the array?

@param arr  the array of values, must be monotonic
    increasing or decreasing
@param x the value to find
@return index of the closest value in the table that is less than
    or equal to x, or -1 or n is returned to indicate that x is out of range.
*/
private static binarySearch(arr: number[], x: number): number {
  let i_int, min, max;
  const n_int = arr.length;
  if (n_int<2) {
    throw 'array must have more than one element';
  }
  const dir = arr[0] < arr[n_int-1];  // sort direction of array
  i_int = Math.floor(n_int/2);
  if (dir) {
    min = 0;
    max = n_int-1;
  } else {
    min = n_int-1;
    max = 0;
  }
  // deal with x being outside array first
  if (dir) {
    if (x < arr[0]) {
      return -1;
    }
    if (x >= arr[n_int-1]) {
      return n_int;
    }
  } else {
    if (x < arr[n_int-1]) {
      return n_int;
    }
    if (x >= arr[0]) {
      return -1;
    }
  }
  while (Math.abs(max - min) > 1) {
    if (arr[i_int] <= x) {
      if (dir) {
        min = i_int;
      } else {
        max = i_int;
      }
    } else {
      if (dir) {
        max = i_int;
      } else {
        min = i_int;
      }
    }
    if (dir) {
      i_int = min + Math.floor((max - min)/2);
    } else {
      i_int = max + Math.floor((min - max)/2);
    }
  }
  if (dir) {
    Util.assert( arr[i_int] <= x && x < arr[i_int+1],
       ' i='+i_int+' x='+x+' not between '+arr[i_int]+' and '+arr[i_int+1]);
  } else {
    Util.assert(arr[i_int+1] <= x && x < arr[i_int],
        ' i='+i_int+' x='+x+' not between '+arr[i_int]+' and '+arr[i_int+1]);
  }
  return i_int;
};

/** Calculates the three point numerical derivative with respect to path distance,
`p`. This numerical derivative can handle having the `p` values
being unevenly spaced.

The three points used to calculate the derivative are:
```text
(pvals[k], yy[k])
(pvals[k+1], yy[k+1])
(pvals[k+2], yy[k+2])
```
The derivative can be calculated to correspond to the derivative of any of those three
points. These are called the left, center, and right derivatives respectively. Usually
the center derivative is used, but at table endpoints we need to use the left or right
derivative. For example, to get the derivative at the first point in the table, use
the left derivative. To get the derivative at the last point in the table, use the
right derivative.

See equation 4.3, page 171, of *Numerical Analysis, 6th edition* by
Burden, Faires in section 4.1 *Numerical Differentiation* for the
three-point differentiation formula used here.

@param yy
@param k the index into the table for the first point of the derivative
@param type selects left, center, or right derivative as j = 0, 1, or 2
@return three-point derivative of array yy
*/
private deriv3(yy: number[], k: number, type: number): number {
  Util.assert(k >= 0);
  Util.assert(k <= this.tableLength_-3 );
  const x0 = this.pvals[k];
  const x1 = this.pvals[k+1];
  const x2 = this.pvals[k+2];
  let xj;
  switch (type) {
    case 0: xj = x0; break;
    case 1: xj = x1; break;
    case 2: xj = x2; break;
    default: throw '';
  }
  let r = yy[k]*(2*xj - x1 - x2) / ((x0 - x1)*(x0 - x2));
  r += yy[k+1]*(2*xj - x0 - x2) / ((x1 - x0)*(x1 - x2));
  r += yy[k+2]*(2*xj - x0 - x1) / ((x2 - x0)*(x2 - x1));
  return r;
};

/** Returns the distance-squared between the given point and a point on the path.
@param point the point of interest
@param i index of point on the path
@return distance-squared between the given point and a point on the path
*/
private distanceSquared(point: GenericVector, i: number): number {
  const xd = point.getX() - this.xvals[i];
  const yd = point.getY() - this.yvals[i];
  return xd*xd + yd*yd;
};

/** Returns the distance-squared between the given point and an interpolated point on
the path.
@param point the point of interest
@param p  path position
@param k  index to start search at
@return distance-squared between the given point and an interpolated point on
    the path.
*/
private distanceSquared2(point: GenericVector, p: number, k: number): number {
  const xp = NumericalPath.interp4(this.pvals, this.xvals, p, k-1, this.closedLoop);
  const yp = NumericalPath.interp4(this.pvals, this.yvals, p, k-1, this.closedLoop);
  const xd = point.getX() - xp;
  const yd = point.getY() - yp;
  return xd*xd + yd*yd;
};

/** Finds the closest point in the path table to the given `x,y` position in `point`.
This is a *global* search for the closest point over the entire path. This **does not
interpolate between table entries**, see {@link NumericalPath.findNearestLocal} for a
more accurate mapping using interpolation.

@param point  the `x,y` position to search for
@return a PathPoint with the `x, y, p`, and `idx` fields are set to the
    closest point in the table.
*/
findNearestGlobal(point: GenericVector): PathPoint {
  const ppt = new PathPoint();
  // just do a straight search; improve later if necessary.
  const x = point.getX();
  const y = point.getY();
  let best_len = Infinity;
  // for each point in the table, check the distance */
  for (let i=0;i<this.tableLength_;i++) {
    const xd = x - this.xvals[i];
    const yd = y - this.yvals[i];
    const len = xd*xd + yd*yd;
    if (len < best_len) {
      best_len = len;
      ppt.x = this.xvals[i];
      ppt.y = this.yvals[i];
      ppt.p = this.pvals[i];
      ppt.idx = i;
    }
  }
  return ppt;
};

/** Finds the closest point on the interpolated path to the `target` position, starting
from a given index into the table. This is a *local* search around the current position
in the path, NOT a *global* search over the entire path for the very closest point. See
{@link NumericalPath.findNearestGlobal}. The algorithm used here moves from the starting point in the
direction that reduces the distance between `target` and the path, until the distance is
at a minimum. This behavior is useful so that the current path point does not “hop”
across to other parts of the path when a path crosses itself.

Preserves the `p`-value (distance along the path) in the PathPoint for closed
loop paths when crossing the “stitch” point where the loop reconnects. Therefore the
p-value can be any value, not just from 0 to length of path. This is done to simplify
the detection of collisions by for example PhysicsPathAction. Note that this feature
will fail if the point is moving very rapidly around the path.

Outline of the algorithm:
```text
We seek the p that gives minimum y value.
d = initial spacing between p values
p = initial p value
do {
  y0 = y(p-d);  y1 = y(p);  y2 = y(p+d)
  if (y0 < y1) {
    p = p - d;  // shift 'left'
  } else if (y2 < y1) {
    p = p + d;  // shift 'right'
  } else {
    d = d/2;  // reduce search range
  }
} while (d > tiny);
```

@param target the point of interest
@param ppt the PathPoint used for input and output;
    the table index `ppt.idx` is used to start the search;
    the `p` value and table index are stored in `ppt`.
*/
findNearestLocal(target: GenericVector, ppt: PathPoint): void {
  // NOTE: k_int and dk_int should be integers at all times!
  let k_int = this.modk(ppt.idx);
  // plen/20 is an arbitrary value; what is a good policy?
  let dk_int = Math.floor(this.tableLength_/20);
  let d = this.plen/20;
  let p = this.pvals[k_int];
  let ctr = 0;
  do {
    let y0, y1, y2;
    if (dk_int > 1) {
      p = this.pvals[k_int];
      // table search mode:  use nearest table points
      y0 = this.distanceSquared(target, this.modk(k_int - dk_int));
      y1 = this.distanceSquared(target, k_int);
      y2 = this.distanceSquared(target, this.modk(k_int + dk_int));
    } else {
      // interpolation mode:  interpolate between table points
      const p0 = this.mod_p(p - d);
      y0 = this.distanceSquared2(target, p0, this.linearSearch(p0, k_int));
      y1 = this.distanceSquared2(target, p, k_int);
      const p2 = this.mod_p(p + d);
      y2 = this.distanceSquared2(target, p2, this.linearSearch(p2, k_int));
    }
    if (ctr > 1000 && Util.DEBUG) {
      console.log(ctr
        +' y0='+Util.NF5(y0)
        +' y1='+Util.NF5(y1)
        +' y2='+Util.NF5(y2)
        +' p='+Util.NF5(p)
        +' d='+Util.NF7(d)
        +' dk='+dk_int
        +' k='+k_int
        );
    }
    if (y0 < y1 && y0 < y2) {  // shift 'left'
      // It is possible to have y0 < y1 and y2 < y1;  in that case,
      // we want to shift in the direction of least y.
      if (dk_int > 1) {
        k_int = this.modk(k_int - dk_int);
        p = this.pvals[k_int];
      } else {
        p = this.mod_p(p - d);
        k_int = this.linearSearch(p, k_int);
      }
    } else if (y2 < y1) {  // shift 'right'
      Util.assert(y2 < y0);
      if (dk_int > 1) {
        k_int = this.modk(k_int + dk_int);
        p = this.pvals[k_int];
      } else {
        p = this.mod_p(p + d);
        k_int = this.linearSearch(p, k_int);
      }
    } else { // reduce search range
      if (dk_int > 1) {
        dk_int = Math.floor(dk_int/2);
        Util.assert(dk_int >= 1);
        if (dk_int == 1) {
          // switch over from table search mode to interpolation mode
          // initialize d = search range during interpolation mode
          d = this.tableSpacing(k_int);
        }
      } else {
        Util.assert(dk_int == 1);
        d = d/2;
      }
    }
    ctr++;
  } while (dk_int > 1 || d > 1E-6);
  /*if (Util.DEBUG) {
    console.log('map exit '+ctr
      +' p='+Util.NF5(p)
      +' d='+Util.NF7(d)
      +' dk='+dk_int
      );
  }*/
  if (this.closedLoop) {
    // preserve p-value, it may be multiples of total path length from circling around
    // the path multiple times.
    const oldp = ppt.p;
    const oldmodp = this.mod_p(ppt.p);
    // Assume that the point hasn't travelled more than 1/3 of circle since its
    // previous position at oldp.
    if (oldmodp < this.plen/6 && p > 5*this.plen/6) {
      // we passed from low p to high p over stitch point
      const diff = ((p - this.plen) - oldmodp);
      /* 
        console.log('low to high, diff='+Util.NFE(diff)
        +' (p-plen)='+Util.NFE(p-this.plen)
        +' oldmodp='+Util.NFE(oldmodp)
        );
      */
      ppt.p = ppt.p + diff;
    } else if (p < this.plen/6 && oldmodp > 5*this.plen/6) {
      // we passed from high p to low p over stitch point
      const diff = ((p + this.plen) - oldmodp);
      /*
        console.log('high to low, diff='+Util.NFE(diff)
        +' (p+plen)='+Util.NFE(p+this.plen)
        +' oldmodp='+Util.NFE(oldmodp)
        );
      */
      ppt.p = ppt.p + diff;
    } else {
      // we did not cross stitch point.
      ppt.p = ppt.p + (p - oldmodp);
    }
    /*
      if (p < 0.1 || p > this.plen - 0.1) {
        console.log('near stitch, '
          +' oldp='+Util.NF7(oldp)
          +' newp='+Util.NF7(ppt.p)
          +' oldmodp='+Util.NF7(oldmodp)
          +' newmodp='+Util.NF7(p)
          );
      }
    */
  } else {
    ppt.p = p;
  }
  ppt.idx = k_int;
 }

/** Finds point p2 on the path that is a given distance from given point p1.
We start the search by finding the point on the path nearest to given point p2.
The initial location of p2 determines which side of the path of p1 we find p2 on.
@param p1 the fixed point
@param p2 starting location for the search
@param x the desired distance between p1 and p2.
@return a point on on the path that is distance x from p1.
*/
findPointByDistance(p1: Vector, p2: Vector, x: number): Vector {
  const ppt = this.findNearestGlobal(p1);
  this.findNearestLocal(p1, ppt);
  // p-value of p1
  const p1p = ppt.p;
  this.findNearestLocal(p2, ppt);
  // p-value of p2
  let p2p = ppt.p;
  // sign tells whether p-values are bigger or smaller at p2 compared to p1
  p2 = this.map_p_to_vector(p2p);
  let dist = p1.distanceTo(p2);
  if (dist < 1E-6) {
    // both points were mapped to same point on the path. Arbitrarily pick a direction.
    p2p = p1p + x;
    p2 = this.map_p_to_vector(p2p);
    dist = p1.distanceTo(p2);
  }
  let err = dist - x;
  const sign = p2p > p1p ? 1 : -1;
  while (Math.abs(err) > 1e-10) {
    p2p = p1p + (x/dist)*(p2p - p1p);
    p2 = this.map_p_to_vector(p2p);
    dist = p1.distanceTo(p2);
    err = dist - x;
  }
  return p2;
}

/** @inheritDoc */
getBoundsWorld(): DoubleRect {
  return this.bounds;
};

/** Returns last path distance value of last point in this NumericalPath. Points on the
path are referenced by their distance along the path. Path distance increases from start
to finish.
@return the ending path distance value
*/
getFinishPValue(): number {
  return this.pvals[this.pvals.length-1];
};

/** @inheritDoc */
getIterator(numPoints: number): PathIterator {
  return new PointsIterator(this, numPoints);
};

/** Total path length of this NumericalPath; equal to
* {@link NumericalPath.getFinishPValue} minus
* {@link NumericalPath.getStartPValue}.
* @return total path length of this NumericalPath from start to finish
*/
getLength(): number {
  return this.getFinishPValue() - this.getStartPValue();
};

/** @inheritDoc */
getSequence(): number {
  return 0; // never changes
};

/** Returns starting path distance value of first point in this NumericalPath. Points on
the path are referenced by their distance along the path. Path distance increases from
start to finish.
@return the starting path distance value (usually zero)
*/
getStartPValue(): number {
  return this.pvals[0];
};

/** Returns number of points stored in the path table.
@return number of points stored in the path table
*/
getTableLength(): number {
  return this.tableLength_;
};

/** Returns the y-value corresponding to the x-value in the 4 point (3rd order)
polynomial interpolant formed from the 4 values in `xx` and `yy`
arrays at indexes `k, k+1, k+2, k+3`. The four points used for
interpolation are therefore
```text
(xx[k], yy[k])
(xx[k+1], yy[k+1])
(xx[k+2],  yy[k+2])
(xx[k+3], yy[k+3])
```
See <cite>Introduction to Scientific Computing</cite> by Charles F. Van Loan,
chapter 2 <cite>Polynomial Interpolation</cite> p. 77.

### Derivation of quadratic interpolant using Newton polynomials.
```text
Let our three datapoints be (x1,y1), (x2,y2), (x3,y3), (x4,y4)
Our polynomial will be
p(x) = a1 + a2(x-x1) + a3(x-x1)(x-x2) + a4(x-x1)(x-x2)(x-x3)
The first derivative is
p'(x) = a2 + a3(2x-x1-x2) + a4((x-x2)(x-x3) + (x-x1)(2x-x2-x3))
The coefficients are given by solving the system:
a1 = y1
a1 + a2(x2-x1) = y2
a1 + a2(x3-x1) + a3(x3-x1)(x3-x2) = y3
a1 + a2(x4-x1) + a3(x4-x1)(x4-x2) + a4(x4-x1)(x4-x2)(x4-x3) = y4
Solving this system gives:
a1 = y1
a2 = (y2-y1)/(x2-x1)
a3 = (y3 - y1 - a2(x3-x1))/((x3-x2)(x3-x1))
a4 = (y4 - y1 - a2(x4-x1) - a3(x4-x1)(x4-x2))/((x4-x1)(x4-x2)(x4-x3))
```

@param xx array of x-values
@param yy array of y-values
@param x the x value for which we want to find the corresponding y-value
@param k the index into the arrays where to get the 4 array values
@param closedLoop true when the array wraps around at the end points
@return the interpolated y-value corresponding to the requested x-value
*/
private static interp4(xx: number[], yy: number[], x: number, k: number,
    _closedLoop: boolean): number {
  const n = xx.length;
  if (yy.length != n) {
    throw '';
  }
  let i = k;
  // check if at either end point of the table, fix index if needed.
  if (i > n-4) {
    // use xx[n-4], xx[n-3], xx[n-2], xx[n-1]
    i = n-4;
  } else if (i < 0) {
    i = 0;
  }
  if (Util.DEBUG) {
    // if not at end point, check that the x value is in middle of the range
    if (i > 0 && i < n-4) {
      Util.assert(xx[i+1] <= x && x < xx[i+2] ); // xx[i+1]+' '+x+' '+xx[i+2]
    }
  }
  // Use Horner's rule for nested multiplication to evaluate the polynomial at x.
  //  see Van Loan, p. 80
  // calculate the constants on the polynomial
  let c1,c2,c3,c4;
  c1 = yy[i+0];
  c2 = (yy[i+1]-c1)/(xx[i+1]-xx[i+0]);
  c3 = (yy[i+2]- (c1 + c2*(xx[i+2]-xx[i+0]))) / ((xx[i+2]-xx[i+0])*(xx[i+2]-xx[i+1]));
  c4 = yy[i+3] - (c1 + c2*(xx[i+3]-xx[i+0]) + c3*(xx[i+3]-xx[i+0])*(xx[i+3]-xx[i+1]));
  c4 = c4 / ((xx[i+3]-xx[i+0])*(xx[i+3]-xx[i+1])*(xx[i+3]-xx[i+2]));
  return ((c4*(x-xx[i+2]) + c3)*(x-xx[i+1]) + c2)*(x-xx[i+0]) + c1;
};

/** Whether this NumericalPath is a closed loop, ending at the same point it starts.
* @return Whether this NumericalPath is a closed loop
*/
isClosedLoop(): boolean {
  return this.closedLoop;
};

/** Returns `true` if the given array is monotonically increasing or decreasing.
@param arr array of values
@return `true` if the given array is monotonically increasing or decreasing.
*/
private static isMonotonic(arr: number[]): boolean {
  const n_int = arr.length;
  if (n_int<2) {
    throw 'array must have more than one element';
  }
  const dir = arr[0] < arr[n_int-1];  // sort direction of array
  for (let i=1; i<n_int; i++) {
    if (dir) {
      if (arr[i-1] > arr[i]) {
        return false;
      }
    } else {
      if (arr[i-1] < arr[i]) {
        return false;
      }
    }
  }
  return true;
};

/** Returns a `p` value that is in the range of the path. For a path that is not a
closed loop, this returns start or end of the path when the `p` value is outside of the
path range. For closed loops this returns path distance `p` modulo the total path
length, see {@link NumericalPath.mod_p}.

@param p distance along the path
@return the equivalent path distance `p` position, limited to be within the
    path.
*/
limit_p(p: number): number {
  if (this.closedLoop) {
    return this.mod_p(p);
  } else {
    // limit p to start or end of path
    if (p < this.pvals[0]) {
      p = this.pvals[0];
    } else if (p > this.pvals[this.tableLength_-1]) {
      p = this.pvals[this.tableLength_-1];
    }
    return p;
  }
};

/** Finds the table index corresponding to the given path distance `p` value, by doing a
linear search. In theory, this is faster than binarySearch when the index is close to
the `p` value.

**TO DO**  test if we actually save operations using linear search

@param p  the `p`-value to search for in the table
@param k  the index into the table to start searching at
@return index `j` into table such that `pvals[j] <= p < pvals[j+1]`
*/
private linearSearch(p: number, k: number): number {
  let j = k;
  if (j > this.tableLength_-2) {
    j = this.tableLength_-2;
  }
  if (j < 0) {
    j = 0;
  }
  // for closedLoop, we might have gone past the stitch point (wrap around end)
  // so switch to binary search if pval is very far away
  if (Math.abs(this.pvals[j] - p) > this.plen/20) {
    if (Util.DEBUG) {
      console.log('use binary not linear search '+Util.NF5(p)
        +' '+Util.NF5(this.pvals[j]));
    }
    j = NumericalPath.binarySearch(this.pvals, p);
  } else {
    while (true) {
      if (this.pvals[j] <= p && p < this.pvals[j+1]) {
        break;
      }
      if (p < this.pvals[j]) {
        if (j > 0) {
          j = j - 1;
        } else {
          break;
        }
      } else {
        if (j < this.tableLength_-2) {
          j = j + 1;
        } else {
          break;
        }
      }
    }
  }
  if (Util.DEBUG && j < this.tableLength_-2) {
    Util.assert( this.pvals[j] <= p && p < this.pvals[j+1] );
  }
  return j;
};

/**
Makes the table of path data.

**TO DO**  for closed loop we can use the regular centered three-point formula!
@param path
*/
private make_table(path: ParametricPath): void {
  const tLow = path.getStartTValue();
  const tHigh = path.getFinishTValue();
  /* Create table of x,y, and p (= path distance). */
  if (NumericalPath.debug && Util.DEBUG) {
    console.log('make_table '+this.getName());
  }
  {
    const delta = (tHigh-tLow)/(this.tableLength_-1);
    let t = tLow;
    let p = 0;  // path distance always starts at zero
    this.pvals[0] = 0;
    let x1, x2, y1, y2;  // bounds rectangle
    x1 = x2 = this.xvals[0] = path.x_func(t);
    y1 = y2 = this.yvals[0] = path.y_func(t);
    for (let i=1; i<this.tableLength_; i++) {
      t += delta;
      this.xvals[i] = path.x_func(t);
      this.yvals[i] = path.y_func(t);
      const dx = this.xvals[i] - this.xvals[i-1];
      const dy = this.yvals[i] - this.yvals[i-1];
      // use distance between points for path distance; crude but effective
      // (alternatively, could do numerical integration using Simpson's rule?)
      p += Math.sqrt(dx*dx + dy*dy);
      this.pvals[i] = p;
      // expand bounds rectangle
      if (this.xvals[i] < x1) {
        x1 = this.xvals[i];
      }
      if (this.xvals[i] > x2) {
        x2 = this.xvals[i];
      }
      if (this.yvals[i] < y1) {
        y1 = this.yvals[i];
      }
      if (this.yvals[i] > y2) {
        y2 = this.yvals[i];
      }
    }
    this.bounds = new DoubleRect(x1, y1, x2, y2);
    this.plen = this.pvals[this.tableLength_-1] - this.pvals[0];
  }
  // calculate dy/dp and dx/dp
  // **TO DO**  for closed loop we can use the regular centered three-point formula!
  // for end points, use special three-point formula
  for (let i=0; i<this.tableLength_; i++) {
    if (i==0) {
      this.dxvals[0] = this.deriv3(this.xvals, 0, 0);
      this.dyvals[0] = this.deriv3(this.yvals, 0, 0);
    } else if (i==this.tableLength_-1) {
      this.dxvals[i] = this.deriv3(this.xvals, i-2, 2);
      this.dyvals[i] = this.deriv3(this.yvals, i-2, 2);
    } else {
      this.dxvals[i] = this.deriv3(this.xvals, i-1, 1);
      this.dyvals[i] = this.deriv3(this.yvals, i-1, 1);
    }
    if (Math.abs(this.dxvals[i]) < 1E-16) {
      // vertical line
      // line going down has right-ward normal; line going up has left-ward normal
      this.nxVals[i] = this.dyvals[i] < 0 ? 1.0 : -1.0;
      this.nyVals[i] = 0.0;
    } else if (Math.abs(this.dyvals[i]) < 1E-16) {
      // horizontal line
      this.nxVals[i] = 0.0;
      this.nyVals[i] = this.dxvals[i] > 0 ? 1.0 : -1.0;
    } else {
      const q = -this.dxvals[i]/this.dyvals[i]; // slope of normal
      Util.assert(isFinite(q));
      const q2 = Math.sqrt(1 + q*q);
      this.nxVals[i] = 1.0 / q2;
      this.nyVals[i] = q / q2;
      const direction = this.dxvals[i] > 0 ? 1 : -1;
      if (direction * q < 0) {
        this.nxVals[i] = -this.nxVals[i];
        this.nyVals[i] = -this.nyVals[i];
      }
    }
  }
  for (let i=0; i<this.tableLength_; i++) {
    if (i==0) {
      this.nxpVals[0] = this.deriv3(this.nxVals, 0, 0);
      this.nypVals[0] = this.deriv3(this.nyVals, 0, 0);
    } else if (i==this.tableLength_-1) {
      this.nxpVals[i] = this.deriv3(this.nxVals, i-2, 2);
      this.nypVals[i] = this.deriv3(this.nyVals, i-2, 2);
    } else {
      this.nxpVals[i] = this.deriv3(this.nxVals, i-1, 1);
      this.nypVals[i] = this.deriv3(this.nyVals, i-1, 1);
    }
  }
  /*
    if (Util.DEBUG) {
      this.printTable();
    }
  */
  if (Util.DEBUG && this.closedLoop) {
    console.log('WARNING:  derivative of normal not calculated at loop point');
  }
};

/** Returns the index in the path table just before the given `p` value. Usually
the returned index point is *at or just before* the given `p` value. However if the `p`
value is *before the first entry* then this returns index of 0.

More precisely stated: returns largest index `k` in table such that `pvals[k] <= p`, or
returns 0 if `p < pvals[0]`.

@param p  path value to search for
@return index in the path table just before the given `p` value
*/
map_p_to_index(p: number): number {
  let k = NumericalPath.binarySearch(this.pvals, p);
  if (k < 0) {
    k = 0;
  }
  if (k > this.tableLength_-1) {
    k = this.tableLength_-1;
  }
  Util.assert(this.pvals[k] <= p || k == 0 ); // this.pvals[k]+' '+p+' '+k
  return k;
};

/** Returns the Vector position corresponding to the given path distance `p` value.
@param p the path distance value to search for
@return the Vector position corresponding to the given path distance `p` value
*/
map_p_to_vector(p: number): Vector {
  return new Vector(this.map_p_to_x(p), this.map_p_to_y(p));
};

/** Returns the `x` value corresponding to the given path distance `p` value.
@param p the path distance value to search for
@return the `x` value corresponding to the given path distance `p` value
*/
map_p_to_x(p: number): number {
  p = this.mod_p(p);
  const k = NumericalPath.binarySearch(this.pvals, p);
  return NumericalPath.interp4(this.pvals, this.xvals, p, k-1, this.closedLoop);
};

/** Returns the `y` value corresponding to the given path distance `p` value.
@param p the path distance value to search for
@return the `y` value corresponding to the given path distance `p` value
*/
map_p_to_y(p: number): number {
  p = this.mod_p(p);
  const k = NumericalPath.binarySearch(this.pvals, p);
  return NumericalPath.interp4(this.pvals, this.yvals, p, k-1, this.closedLoop);
};

/** Returns the path distance `p` value corresponding to the given `x` value.
@param x the `x` value to search for
@return the path distance `p` value corresponding to the given `x` value
@throws if `x` values are not monotonically increasing or decreasing
*/
map_x_to_p(x: number): number {
  if (!this.x_monotonic) {
    throw 'x is not monotonic';
  }
  const k = NumericalPath.binarySearch(this.xvals, x);
  return NumericalPath.interp4(this.xvals, this.pvals, x, k-1, this.closedLoop);
};

/** Returns the `y` value corresponding to the given `x` value.
@param x the `x` value to search for
@return the `y` value corresponding to the given `x` value
@throws if `x` values are not monotonically increasing or decreasing
*/
map_x_to_y(x: number): number {
  if (!this.x_monotonic) {
    throw 'x is not monotonic';
  }
  const k = NumericalPath.binarySearch(this.xvals, x);
  return NumericalPath.interp4(this.xvals, this.yvals, x, k-1, this.closedLoop);
};

/** Uses the `x` value of the PathPoint to find a point on the path, then
interpolates to find corresponding `y` and `p` values.
@param ppt the PathPoint used for input and output;
    `ppt.x` is the input `x` value searched for; `ppt.y` and `ppt.p` are set
    accordingly.
@throws if `x` values are not monotonically increasing or decreasing
*/
map_x_to_y_p(ppt: PathPoint): void {
  if (!this.x_monotonic) {
    throw 'x is not monotonic';
  }
  const k = NumericalPath.binarySearch(this.xvals, ppt.x);
  ppt.y = NumericalPath.interp4(this.xvals, this.yvals, ppt.x, k-1, this.closedLoop);
  ppt.p = NumericalPath.interp4(this.xvals, this.pvals, ppt.x, k-1, this.closedLoop);
};

/** Returns path distance `p` modulo total path length for closed loops. For paths that
are not closed, this has no effect: it returns the given `p` value even when it is
outside of the range of the path.

For example, consider a circle of radius 1; its total path length is `2*pi` and the
path starts with `p` at zero. Then `mod_p(2*pi + 1)` returns 1, but `mod_p(pi)`
returns `pi`.

@param p distance along the path
@return the equivalent path distance `p` position, modulo total path length for
    closed paths
*/
mod_p(p: number): number {
  if (this.closedLoop) {
    if (p < 0 || p > this.plen)  {
      p = p - this.plen*Math.floor(p/this.plen);
    }
  }
  return p;
};

/** Returns the table index adjusted at end points according to whether the
table loops around or not.
@param k
*/
private modk(k: number): number {
  let r = k;
  if (this.closedLoop) {
    while (r < 0) {
      r += this.tableLength_;
    }
    while (r >= this.tableLength_) {
      r -= this.tableLength_;
    }
  } else {
    if (r < 0) {
      r = 0;
    } else if (r >= this.tableLength_) {
      r = this.tableLength_-1;
    }
  }
  Util.assert(r > -1 );
  Util.assert(r < this.tableLength_ );
  return r;
};

/** Given a path location `p`, calculates all the corresponding PathPoint fields such
as `(x,y)` location, slope, derivative of `(x,y)` with respect to `p`, normal,
derivative of normal, etc. The desired path location is specified in `PathPoint.p`.
Optionally calculates the radius of curvature if `PathPoint.radius_flag` is set.

For a non-closed loop path: when the `p` value is before the start of the path, or
after the end of the path, we use a linear extension of the path to find the point.

Interpolates values in the table to find corresponding values of location, slope, etc.

**TO DO** Use the new dxdp and dydp fields to calc radius.
Find radius of curvature for the four points on circle
where tangent is horizontal or vertical.  Currently we get
radius is infinite there which is wrong.

@param ppt the PathPoint used for input and output;
    `PathPoint.p` is the input path position. Optionally calculates
    the radius of curvature if `PathPoint.radius_flag` is set.
*/
map_p_to_slope(ppt: PathPoint): void {
  const saveP = ppt.p;
  const nowP = this.mod_p(ppt.p);
  // If `PathPoint.idx` corresponds to `PathPoint.p`, then can avoid searching
  // for index of `p` in the table.
  let k = ppt.idx;
  if (k < 0 || k > this.tableLength_-2 || this.pvals[k] > nowP ||
      this.pvals[k+1] <= nowP) {
    const k0 = k;
    ppt.idx = k = NumericalPath.binarySearch(this.pvals, nowP);
    /*
        if (Util.DEBUG) {
          let s = 'binarySearch needed '+k0+'->'+k+' p='+Util.NF5(nowP);
          if (k0 > -1 && k0 < this.tableLength_) {
            s += ' p['+k0+']='+Util.NF5(this.pvals[k0]);
          }
          console.log(s);
        }
    */
  }
  // adjust index if beyond end points
  if (k<0) {
    k = 0;
  }
  if (k >= this.tableLength_-1) {
    k = this.tableLength_-2;
  }
  if (Util.DEBUG && k > 0 && k < this.tableLength_-2) {
    // if not at endpoint, check that index k corresponds to p
    Util.assert( this.pvals[k] <= nowP && nowP < this.pvals[k+1] );
    //      k+' '+this.pvals[k]+' '+nowP+' '+this.pvals[k+1];
  }
  if (!this.closedLoop) {
    // Allow p-value outside of the path. When the p-value is before the start of the
    // path, or after the end of the path, we use a linear extension of the path.
    // This allows a ball in RollerSingleSim to move beyond the endpoints of the path.
    if (nowP < this.getStartPValue()) {
      // nowP is before the starting point of path. Use straight-line extension.
      ppt.copyFrom(this.startPoint_);
      ppt.p = nowP;
      ppt.idx = k;
      const m = ppt.slope;
      ppt.x = this.startPoint_.x + (nowP - this.getStartPValue())/Math.sqrt(1 + m*m);
      ppt.y = this.startPoint_.y + m * (ppt.x - this.startPoint_.x);
      return;
    } else if (nowP > this.getFinishPValue()) {
      // nowP is after the ending point of path. Use straight-line extension.
      ppt.copyFrom(this.endPoint_);
      ppt.p = nowP;
      ppt.idx = k;
      const m = ppt.slope;
      ppt.x = this.endPoint_.x + (nowP - this.getFinishPValue())/Math.sqrt(1 + m*m);
      ppt.y = this.endPoint_.y + m * (ppt.x - this.endPoint_.x);
      return;
    }
  }
  ppt.x = NumericalPath.interp4(this.pvals, this.xvals, nowP, k-1, this.closedLoop);
  ppt.y = NumericalPath.interp4(this.pvals, this.yvals, nowP, k-1, this.closedLoop);
  ppt.dydp = NumericalPath.interp4(this.pvals, this.dyvals, nowP, k-1, this.closedLoop);
  ppt.dxdp = NumericalPath.interp4(this.pvals, this.dxvals, nowP, k-1, this.closedLoop);
  if (Math.abs(ppt.dxdp) < 1E-12) {
    // vertical line is special case
    ppt.dxdp = 0;
    // WARNING: not sure about this calculation of ppt.direction; might depend on the
    // particulars of the path.
    if (ppt.dydp > 0) {
      // going up with increasing p
      ppt.direction = 1;
      ppt.slope = ppt.radius = Infinity;
      ppt.slopeX = 0;
      ppt.slopeY = 1;
      ppt.normalX = -1;
      ppt.normalY = 0;
    } else {
      // going down with increasing p
      ppt.direction = -1;
      ppt.slope = ppt.radius = Number.NEGATIVE_INFINITY;
      ppt.slopeX = 0;
      ppt.slopeY = -1;
      ppt.normalX = 1;
      ppt.normalY = 0;
    }
    Util.assert(!isNaN(ppt.slope));
  } else {
    // figure out direction of path:  left to right = +1, right to left = -1
    ppt.direction = ppt.dxdp > 0 ? 1 : -1;
    ppt.slope = ppt.dydp/ppt.dxdp;
    Util.assert(!isNaN(ppt.slope));
    // Find slope vector (slopeX, slopeY)
    // the slope vector must point in direction of increasing p
    const s2 = Math.sqrt(1 + ppt.slope * ppt.slope);
    ppt.slopeX = 1.0 / s2;
    ppt.slopeY = ppt.slope / s2;
    if (ppt.direction == -1) {
      ppt.slopeX = -ppt.slopeX;
      ppt.slopeY = -ppt.slopeY;
    }
    Util.assert(!isNaN(ppt.slope));
    if (Math.abs(ppt.slope) > 1E-12) {
      // Find normal vector (normalX, normalY)
      // the normal vector should not suddenly flip from positive to negative,
      // therefore it has a different policy for when to flip it around.
      const ns = -1/ppt.slope;  // slope of normal
      const ns2 = Math.sqrt(1 + ns*ns);
      ppt.normalX = 1.0 / ns2;
      ppt.normalY = ns / ns2;
      if (ppt.direction * ppt.slope > 0) {
        ppt.normalX = -ppt.normalX;
        ppt.normalY = -ppt.normalY;
      }
    } else {
      // horizontal line.
      ppt.normalX = 0;
      ppt.normalY = ppt.direction > 0 ? 1 : -1;
    }
  }
  // Find derivative of normal w.r.t. p (normalXdp, normalYdp)
  ppt.normalXdp = NumericalPath.interp4(this.pvals, this.nxpVals, nowP, k-1,
      this.closedLoop);
  ppt.normalYdp = NumericalPath.interp4(this.pvals, this.nypVals, nowP, k-1,
      this.closedLoop);
  // **TO DO**  We should probably use the new dxdp and dydp fields here instead.
  if (ppt.radius_flag)  {
    // assume straight-line (infinite radius) at end-points of path
    // ??? or calculate the radius at the end-points???
    if ((k < 2) || (k > this.tableLength_-4)) {
      ppt.radius = Infinity;
    } else  {
      //  The radius of curvature of the path is given by reciprocal
      //  of kappa = |d phi / d s|  where
      //  phi = slope angle of curve = taninverse(dy/dx)
      //  s = arc length.
      //  Therefore, we get the slope at two points near p, and figure
      //  derivative of change in taninverse of slope.
      // Here is schematic of the values
      //      k-3   k-2   k-1    k    k+1   k+2   k+3    k+4  <- table indices
      //                            p                        <- p is here in table
      //            <---- p1 ---->
      //                               <---- p2 ---->
      // Let slopes at p1 & p2 be b1 & b2.
      // Then radius will be inverse of:  atan(b2) - atan(b1)/(p2-p1)
      const dx = this.xvals[k] - this.xvals[k-2];
      const dy = this.yvals[k] - this.yvals[k-2];
      const b1 = dy/dx;
      // ??? or should it be (pvals[k] + pvals[k-2])/2  ???
      const p1 = this.pvals[k-1];
      const dx2 = this.xvals[k+3] - this.xvals[k+1];
      const dy2 = this.yvals[k+3] - this.yvals[k+1];
      const b2 = dy2/dx2;
      const p2 = this.pvals[k+2];
      ppt.radius = (p2-p1)/(Math.atan(b2)-Math.atan(b1));
      // cludge for straight lines, vertical lines, etc.
      if (isNaN(ppt.radius) || !isFinite(ppt.slope)) {
        ppt.radius = ppt.slope > 0 ? Infinity :
            Number.NEGATIVE_INFINITY;
      }
    }
  }
  Util.assert(ppt.p == saveP);  // ensure that p value is not changed
};

/** print the table for debugging.
*/
private printTable(): void {
  if (Util.DEBUG) {
    for (let i=0; i<this.tableLength_; i++) {
      this.printPoint(i);
    }
  }
};

/**
* @param i
*/
private printPoint(i: number): void {
  if (Util.DEBUG) {
    let s = 'p='+Util.NF5(this.pvals[i]);
    /*
        if (i > 0) {
          s += ' dp='+Util.NFE(this.pvals[i] - this.pvals[i-1]);
        }
    */
    s += ' x='+Util.NF5(this.xvals[i])
    +' y='+Util.NF5(this.yvals[i])
    +' dx='+Util.NF5(this.dxvals[i])
    +' dy='+Util.NF5(this.dyvals[i])
    ;
    /*
      s += ' k='+Util.NF5(this.dyvals[i]/this.dxvals[i])
      +' nx='+Util.NF5(this.nxVals[i])
      +' ny='+Util.NF5(this.nyVals[i])
      +' nxp='+Util.NF5(this.nxpVals[i])
      +' nyp='+Util.NF5(this.nypVals[i])
      ;
    */
    console.log(s);
  }
};

/** Returns the distance between 3 neighboring p-values in the table at the k-th
table entry.
@param k the index into the table
@return returns pval[k+1] - pval[k-1], although the indexes are adjusted at
  table end points.
*/
private tableSpacing(k: number): number {
  let j;
  if (this.closedLoop) {
    j = this.modk(k-1);
    return this.pvals[this.modk(j+2)] - this.pvals[j];
  } else {
    j = this.modk(k);
    let j2;
    if (j == 0) {
      j = 0;
      j2 = j + 2;
    } else if (j == this.tableLength_-1) {
      j = this.tableLength_-3;
      j2 = j + 2;
    } else {
      j = j - 1;
      j2 = j + 2;
    }
    return this.pvals[j2] - this.pvals[j];
  }
};

/** Number of data points to record for the path. */
static readonly DATA_POINTS = 9000;

static readonly debug = false;

} // end NumericalPath class


// **********************  PointsIterator  **************************

/** Iterates over a NumericalPath to give the `x-y` location of a set of points.
Assumes that the `p` values (distance along path) are increasing in the table.

**TO DO** plot more points where the path is more curvy, ie. where second derivative is
bigger
*/
export class PointsIterator implements PathIterator {
  private path_: NumericalPath;
  /** delta determines how finely the path is drawn */
  private delta_: number;
  private idx_: number = -1;

/**
* @param path the NumericalPath to iterate over
* @param numberOfPoints number of points to deliver during the iteration
*/
constructor(path: NumericalPath, numberOfPoints: number) {
  numberOfPoints = Math.min(numberOfPoints, path.getTableLength());
  this.path_ = path;
  const p_first = path.getStartPValue();
  const p_final = path.getFinishPValue();
  if (p_final <= p_first) {
    throw 'path data is out of order';
  }
  this.delta_ = (p_final - p_first)/numberOfPoints;
};

/** @inheritDoc */
nextPoint(point: MutableVector): boolean {
  const n = this.path_.getTableLength();
  if (this.idx_ >=  n-1) {
    return false;
  }
  if (this.idx_ < 0) {  // first point
    this.idx_ = 0;
  } else {
    const p_prev = this.path_.pvals[this.idx_];
    do {    // find the next p-value that is bigger by 'delta'
      this.idx_++;
      if (this.idx_ > n-1) {  // we went off end of the list
        this.idx_ = n-1;  // so choose the last point
        break;
      }
    } while (this.path_.pvals[this.idx_] - p_prev < this.delta_);
  }
  // get the corresponding x,y values
  point.setTo(this.path_.xvals[this.idx_], this.path_.yvals[this.idx_], 0);
  return true;
};

} // end class

Util.defineGlobal('lab$model$NumericalPath', NumericalPath);
