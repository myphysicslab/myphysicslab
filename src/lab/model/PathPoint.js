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

goog.provide('myphysicslab.lab.model.PathPoint');

goog.require('myphysicslab.lab.util.GenericVector');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var GenericVector = myphysicslab.lab.util.GenericVector;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var NF7 = myphysicslab.lab.util.UtilityCore.NF7;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Represents a point along a {@link myphysicslab.lab.model.NumericalPath}, used for
input and output of NumericalPath methods. Instance properties are public to avoid
having numerous getter and setter methods.

* @param {number=} p distance along path, measured in arc length
* @param {boolean=} calculateRadius whether to calculate radius of curvature, default is
*    `false`
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.util.GenericVector}
*/
myphysicslab.lab.model.PathPoint = function(p, calculateRadius) {
  /** horizontal location of the point
  * @type {number}
  */
  this.x = 0;
  /** vertical location of the point
  * @type {number}
  */
  this.y = 0;
  /** distance along path, measured in arc length
  * @type {number}
  */
  this.p = p || 0;
  /** slope may be infinite
  * @type {number}
  */
  this.slope = UtilityCore.NaN;
  /** radius of curvature of the path at this point
  * @type {number}
  */
  this.radius = UtilityCore.NaN;
  /** whether to calculate radius of curvature
  * @type {boolean}
  */
  this.radius_flag = calculateRadius || false;
  /** 'direction' of curve with increasing `p` at this point: +1 means that increasing
  `p` moves to the right (or up for vertical line); -1 means that increasing `p` moves
  to the left (or down for vertical line).
  * @type {number}
  */
  this.direction = 1;
  /** nearest index in the list of path points stored in a NumericalPath
  * @type {number}
  */
  this.idx = -1;
  /** perpendicular normal unit vector at the point, X component
  * @type {number}
  */
  this.normalX = 0;
  /** perpendicular normal unit vector at the point, Y component
  */
  this.normalY = 0;
  /** `(normalXdp, normalYdp)` is derivative of normal vector with respect to arc length
  * `p`
  * @type {number}
  */
  this.normalXdp = 0;
  /** `(normalXdp, normalYdp)` is derivative of normal vector with respect to arc length
  * `p`
  * @type {number}
  */
  this.normalYdp = 0;
  /** `(slopeX, slopeY)` is a unit vector tangent to curve at point, in direction of
  * increasing `p`
  * @type {number}
  */
  this.slopeX = 0;
  /** `(slopeX, slopeY)` is a unit vector tangent to curve at point, in direction of
  * increasing `p`
  * @type {number}
  */
  this.slopeY = 0;
  /** `dx/dp`  derivative of `x` with respect to `p`
  * @type {number}
  */
  this.dxdp = 0;
  /** `dy/dp`  derivative of `y` with respect to `p`
  * @type {number}
  */
  this.dydp = 0;
};
var PathPoint = myphysicslab.lab.model.PathPoint;

if (!UtilityCore.ADVANCED) {
  PathPoint.prototype.toString = function() {
    return 'PathPoint{'
        +'p='+NF(this.p)
        +' x='+NF(this.x)
        +' y='+NF(this.y)
        +' slope='+NF(this.slope)
        +' radius='+NF(this.radius)
        +' radius_flag='+this.radius_flag
        +' direction='+this.direction
        +' index='+this.idx
        +' normalX='+NF(this.normalX)
        +' normalY='+NF(this.normalY)
        +' normalXdp='+NF(this.normalXdp)
        +' normalYdp='+NF(this.normalYdp)
        +' slopeX='+NF(this.slopeX)
        +' slopeY='+NF(this.slopeY)
        +' dxdp='+NF(this.dxdp)
        +' dydp='+NF(this.dydp)
        +'}';
  };
};

/** Copies all fields of the given PathPoint.
* @param {!PathPoint} ppt
*/
PathPoint.prototype.copyFrom = function(ppt) {
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
PathPoint. The normal line passes thru this PathPoint's {@link #getPosition location} along the vector given by {@link #getNormal}.

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

* @param {!myphysicslab.lab.util.GenericVector} point the point of interest
* @return {number} distance from the given location to the line along the normal from
    this PathPoint
*/
PathPoint.prototype.distanceToNormalLine = function(point) {
  //console.log('PathPoint.distanceToNormalLine '+this.toString());
  var err = Math.abs(this.normalX*this.normalX + this.normalY*this.normalY - 1);
  goog.asserts.assert( err < 1E-15);
  if (Math.abs(this.normalX) < 1E-16) {
    // vertical normal
    return Math.abs(point.getX() - this.x);
  } else {
    var A = -this.normalY;
    var B = this.normalX;
    var C = this.normalY * this.x - this.normalX * this.y;
    return Math.abs(A * point.getX() + B * point.getY() + C) /
                 Math.sqrt(A * A + B * B);
  }
};

/** Returns the perpendicular normal unit vector at this point.
* @return {!myphysicslab.lab.util.Vector} perpendicular normal unit vector at the point
*/
PathPoint.prototype.getNormal = function() {
  return new Vector(this.normalX, this.normalY);
};

/** Returns location of this point in space.
* @return {!myphysicslab.lab.util.Vector} location of the point in space
*/
PathPoint.prototype.getPosition = function() {
  return new Vector(this.x, this.y);
};

/** Returns a unit vector tangent to the curve at this point, in direction of increasing
`p`.
* @return {!myphysicslab.lab.util.Vector} a unit vector tangent to curve at this point,
*    in direction of increasing `p`
*/
PathPoint.prototype.getSlope = function() {
  return new Vector(this.slopeX, this.slopeY);
};

/** @inheritDoc */
PathPoint.prototype.getX = function() {
  return this.x;
};

/** @inheritDoc */
PathPoint.prototype.getY = function() {
  return this.y;
};

/** @inheritDoc */
PathPoint.prototype.getZ = function() {
  return 0;
};

/** @inheritDoc */
PathPoint.prototype.immutable = function() {
  return Vector.copy(this);
};

}); // goog.scope
