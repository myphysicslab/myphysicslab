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

import { Util } from '../util/Util.js';
import { Vector, GenericVector } from '../util/Vector.js';

/** Represents a point along a {@link lab/model/NumericalPath.NumericalPath}, used for
input and output of NumericalPath methods. Instance properties are public to avoid
having numerous getter and setter methods.
*/
export class PathPoint implements GenericVector {
  /** horizontal location of the point */
  x: number = 0;
  /** vertical location of the point */
  y: number = 0;
  /** distance along path, measured in arc length */
  p: number;
  /** slope may be infinite */
  slope: number = NaN;
  /** radius of curvature of the path at this point */
  radius: number = NaN;
  /** whether to calculate radius of curvature */
  radius_flag: boolean;
  /** 'direction' of curve with increasing `p` at this point: +1 means that increasing
  `p` moves to the right (or up for vertical line); -1 means that increasing `p` moves
  to the left (or down for vertical line).
  */
  direction: number = 1;
  /** nearest index in the list of path points stored in a NumericalPath */
  idx: number = -1;
  /** perpendicular normal unit vector at the point, X component */
  normalX: number = 0;
  /** perpendicular normal unit vector at the point, Y component */
  normalY: number = 0;
  /** `(normalXdp, normalYdp)` is derivative of normal vector with respect to arc length
  * `p`
  */
  normalXdp: number = 0;
  /** `(normalXdp, normalYdp)` is derivative of normal vector with respect to arc length
  * `p`
  */
  normalYdp: number = 0;
  /** `(slopeX, slopeY)` is a unit vector tangent to curve at point, in direction of
  * increasing `p`
  */
  slopeX: number = 0;
  /** `(slopeX, slopeY)` is a unit vector tangent to curve at point, in direction of
  * increasing `p`
  */
  slopeY: number = 0;
  /** `dx/dp`  derivative of `x` with respect to `p` */
  dxdp: number = 0;
  /** `dy/dp`  derivative of `y` with respect to `p` */
  dydp: number = 0;

/**
* @param p distance along path, measured in arc length
* @param calculateRadius whether to calculate radius of curvature,
*    default is `false`
*/
constructor(p?: number, calculateRadius?: boolean) {
  this.p = p || 0;
  this.radius_flag = calculateRadius || false;
};

toString() {
  return 'PathPoint{'
      +'p='+Util.NF(this.p)
      +' x='+Util.NF(this.x)
      +' y='+Util.NF(this.y)
      +' slope='+Util.NF(this.slope)
      +' radius='+Util.NF(this.radius)
      +' radius_flag='+this.radius_flag
      +' direction='+this.direction
      +' index='+this.idx
      +' normalX='+Util.NF(this.normalX)
      +' normalY='+Util.NF(this.normalY)
      +' normalXdp='+Util.NF(this.normalXdp)
      +' normalYdp='+Util.NF(this.normalYdp)
      +' slopeX='+Util.NF(this.slopeX)
      +' slopeY='+Util.NF(this.slopeY)
      +' dxdp='+Util.NF(this.dxdp)
      +' dydp='+Util.NF(this.dydp)
      +'}';
};

/** Copies all fields of the given PathPoint into this PathPoint
* @param ppt the PathPoint to copy from
*/
copyFrom(ppt: PathPoint) {
  this.x = ppt.x;
  this.y = ppt.y;
  this.p = ppt.p;
  this.slope = ppt.slope;
  this.radius = ppt.radius;
  this.radius_flag = ppt.radius_flag;
  this.direction = ppt.direction;
  this.idx = ppt.idx;
  this.normalX = ppt.normalX;
  this.normalY = ppt.normalY;
  this.normalXdp = ppt.normalXdp;
  this.normalYdp = ppt.normalYdp;
  this.slopeX = ppt.slopeX;
  this.slopeY = ppt.slopeY;
  this.dxdp = ppt.dxdp;
  this.dydp = ppt.dxdp;
};

/** Returns the distance from the given `point` to the normal line thru this
PathPoint. The normal line passes thru this PathPoint's
{@link PathPoint#getPosition location} along the vector given by
{@link PathPoint.getNormal}.
```text
distance d from point (x1, y1) to line A x + B y + C = 0 is
d = | A x1 + B y1 + C | / sqrt(A^2 + B^2)
Let the normal at path point (x0, y0) be (nx, ny).
The line thru (x0, y0) with slope ny/nx is
y - y0 = (ny/nx)(x - x0)
Rearrange:
- ny x + nx y + ny x0 - nx y0 = 0
A = -ny
B = nx
C = ny x0 - nx y0
```
@param point the point of interest
@return distance from the given location to the line along the normal from
    this PathPoint
*/
distanceToNormalLine(point: GenericVector): number {
  //console.log('PathPoint.distanceToNormalLine '+this.toString());
  const err = Math.abs(this.normalX*this.normalX + this.normalY*this.normalY - 1);
  Util.assert( err < 1E-15);
  if (Math.abs(this.normalX) < 1E-16) {
    // vertical normal
    return Math.abs(point.getX() - this.x);
  } else {
    const A = -this.normalY;
    const B = this.normalX;
    const C = this.normalY * this.x - this.normalX * this.y;
    return Math.abs(A * point.getX() + B * point.getY() + C) /
                 Math.sqrt(A * A + B * B);
  }
};

/** Returns the perpendicular normal unit vector at this point.
* @return perpendicular normal unit vector at the point
*/
getNormal(): Vector {
  return new Vector(this.normalX, this.normalY);
};

/** Returns location of this point in space.
* @return location of the point in space
*/
getPosition(): Vector {
  return new Vector(this.x, this.y);
};

/** Returns a unit vector tangent to the curve at this point, in direction of
* increasing `p`.
* @return a unit vector tangent to curve at this point,
*    in direction of increasing `p`
*/
getSlope(): Vector {
  return new Vector(this.slopeX, this.slopeY);
};

/** @inheritDoc */
getX(): number {
  return this.x;
};

/** @inheritDoc */
getY(): number {
  return this.y;
};

/** @inheritDoc */
getZ(): number {
  return 0;
};

} // end class
Util.defineGlobal('lab$model$PathPoint', PathPoint);
