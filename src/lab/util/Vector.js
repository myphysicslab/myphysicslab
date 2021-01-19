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

goog.module('myphysicslab.lab.util.Vector');

const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const Util = goog.require('myphysicslab.lab.util.Util');

/** An immutable vector in 3D space; after creation it cannot be altered.
* @implements {GenericVector}
*/
class Vector {
/**
* @param {number} x the X value of the Vector
* @param {number} y the Y value of the Vector
* @param {number=} opt_z the Z value of the Vector (optional, zero is default value)
*/
constructor(x, y, opt_z) {
  const z = typeof opt_z === 'number' ? opt_z : 0;
  /**
  * @const
  * @type {number}
  * @private
  */
  this.x_ = Util.testNumber(x);
  /**
  * @const
  * @type {number}
  * @private
  */
  this.y_ = Util.testNumber(y);
  /**
  * @const
  * @type {number}
  * @private
  */
  this.z_ = Util.testNumber(z);
  /** Cache of length.
  * @type {number}
  * @private
  */
  this.length_ = Util.NaN;
  /** Cache of lengthSquared.
  * @type {number}
  * @private
  */
  this.lengthSquared_ = Util.NaN;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'Vector{x: '+Util.NF5(this.x_)
      +', y: '+Util.NF5(this.y_)
      + (this.z_ != 0 ? ', z: '+Util.NF5(this.z_) : '')
      +'}';
};


/** Returns an immutable Vector having the same values as the input GenericVector.
If the input vector is an immutable Vector, returns that same Vector.
@param {!GenericVector} vector the GenericVector to copy
@return {!Vector} an immutable Vector with the same values as the input GenericVector
*/
static clone(vector) {
  if (vector instanceof Vector) {
    return vector;
  } else {
    return new Vector(vector.getX(), vector.getY(), vector.getZ());
  }
};

/** Returns sum of this Vector and given GenericVector.
@param {!GenericVector} vector the Vector to add
@return {!Vector} sum of this Vector and given Vector
*/
add(vector) {
  return new Vector(this.x_ + vector.getX(),
      this.y_ + vector.getY(), this.z_ + vector.getZ());
};

/** Returns the angle going from this vector to another vector when both vectors are
arranged so they start at the origin.
@param {!GenericVector} vector the other vector
@return {number} angle from this vector to other vector in radians; positive means
    counterclockwise.
*/
angleTo(vector) {
  if (this.getZ() != 0 || vector.getZ() != 0) {
    throw '';
  }
  const at = Math.atan2(this.y_, this.x_);
  const bt = Math.atan2(vector.getY(), vector.getX());
  return Util.limitAngle(bt - at);
};

/** Returns distance-squared between this Vector and another GenericVector regarding
both as points in space. Computationally inexpensive because it only uses
multiplication, no square root.
@param {!GenericVector} point vector to calculate distance to
@return {number} distance squared between this point and the given point
*/
distanceSquaredTo(point) {
  const dx = this.x_ - point.getX();
  const dy = this.y_ - point.getY();
  const dz = this.z_ - point.getZ();
  return dx*dx + dy*dy + dz*dz;
};

/** Returns distance between this Vector and another GenericVector regarding both as
points in space.  Computationally expensive because it involves as square root.
@param {!GenericVector} point the Vector to calculate distance to
@return {number} distance between this Vector and the given point
*/
distanceTo(point) {
  return Math.sqrt(this.distanceSquaredTo(point));
};

/** Returns this Vector divided by the given factor.
@param {number} factor factor by which to divide this Vector
@return {!Vector} quotient of this vector and given factor
@throws {!Error} if factor is less than {@link #TINY_POSITIVE}
*/
divide(factor) {
  if (factor === 1.0) {
    return this;
  } else if (factor < Vector.TINY_POSITIVE) {
    throw 'Vector.divide by near zero factor '+Util.NFE(factor);
  } else {
    return new Vector(this.x_ / factor, this.y_ / factor,  this.z_ / factor);
  }
};

/** Returns the dot product of this Vector and the given vector.
@param {!GenericVector} vector the vector with which to form a dot product
@return {number} the dot product of this Vector and the given vector
*/
dotProduct(vector) {
  const r = this.x_ * vector.getX() + this.y_ * vector.getY() + this.z_ * vector.getZ();
  if (isNaN(r)) {
    throw Util.DEBUG ? ('dotproduct is not a number '+this+' '+vector) : '';
  }
  return r;
};

/**  Returns true iff the other object is a GenericVector with the same values.
@param {!GenericVector} vector  the object to compare to
@return {boolean}  true iff the other object is a GenericVector with the same values.
*/
equals(vector)  {
  if (vector === null) {
    return false;
  }
  return vector.getX() === this.x_ &&
         vector.getY() === this.y_ &&
         vector.getZ() === this.z_;
};

/** Returns the angle `theta` from the conversion of rectangular coordinates
`(x, y)` to polar coordinates `(r, theta)`.
@return {number} the angle of this Vector in the `x-y` plane using mathematical
    angle convention in radians in range from `-pi` to `pi`.
*/
getAngle() {
  return Math.atan2(this.y_, this.x_);
};

/** @override */
getX() {
  return this.x_;
};

/** @override */
getY() {
  return this.y_;
};

/** @override */
getZ() {
  return this.z_;
};

/** Returns length of this Vector.  Note this is computationally expensive as it
involves taking a square root.
@return {number} length of this Vector
*/
length() {
  if (isNaN(this.length_)) {
    this.length_ = Math.sqrt(this.lengthSquared());
  }
  return this.length_;
};

/** Computationally cheap version of {@link #length} which avoids the square root;
returns sum of absolute value of each component `x, y, z`.
@return {number} sum of absolute value of each component `x, y, z`.
*/
lengthCheap() {
  const r = Math.abs(this.x_) + Math.abs(this.y_);
  if (this.z_ == 0.0) {
    return r;
  } else {
    return r + Math.abs(this.z_);
  }
};

/** Returns length squared of this Vector.  Computationally cheap because it only
uses multiplication, no square root.
@return {number} length squared of this Vector
*/
lengthSquared() {
  if (isNaN(this.lengthSquared_)) {
    if (this.z_ === 0.0) {
      this.lengthSquared_ = this.x_ * this.x_ + this.y_ * this.y_;
    } else {
      this.lengthSquared_ = this.x_ * this.x_ + this.y_ * this.y_ + this.z_ * this.z_;
    }
  }
  return this.lengthSquared_;
};

/** Returns this Vector multiplied by the given factor.
@param {number} factor factor by which to multiply this Vector
@return {!Vector} product of this Vector and given factor
*/
multiply(factor) {
  if (factor === 1.0) {
    return this;
  } else {
    return new Vector(factor * this.x_, factor * this.y_,
          factor * this.z_);
  }
};

/** Returns `true` if this Vector is nearly equal to another Vector. The optional
tolerance value corresponds to the `epsilon` in {@link Util#veryDifferent}, so
the actual tolerance used depends on the magnitude of the numbers being compared.
@param {!GenericVector} vector the vector to compare to
@param {number=} opt_tolerance optional tolerance for equality test
@return {boolean} true if the vectors are similar
*/
nearEqual(vector, opt_tolerance) {
  if (Util.veryDifferent(this.x_, vector.getX(), opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(this.y_, vector.getY(), opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(this.z_, vector.getZ(), opt_tolerance)) {
    return false;
  }
  return true;
};

/** Returns the normalized version of this Vector, having unit length and the same
direction.
@return {!Vector} normalized version of this Vector, having unit length and the same
    direction
@throws {!Error} if this Vector has length less than {@link #TINY_POSITIVE}
*/
normalize() {
  return this.divide(this.length());
};

/** Returns this Vector rotated counter-clockwise about the origin by the given angle
in radians. If two parameters are given then they are the cosine and sine of the angle
(this avoids calculating the sine and cosine which is computationally expensive).
@param {number} angle the angle in radians by which to rotate this Vector, or the
    cosine of the angle when two parameters are given
@param {number=} sineAngle the sine of the angle, when two parameters are given
@return {!Vector} this Vector rotated counter-clockwise about the origin
*/
rotate(angle, sineAngle) {
  let cosAngle;
  if (sineAngle !== undefined) {
    cosAngle = angle;
  } else {
    cosAngle = Math.cos(angle);
    sineAngle = Math.sin(angle);
  }
  if (Math.abs(cosAngle*cosAngle + sineAngle*sineAngle - 1.0) > 1E-12) {
    throw 'not cosine, sine: '+cosAngle+', '+sineAngle;
  }
  return new Vector(this.x_ * cosAngle - this.y_ * sineAngle,
      this.x_ * sineAngle + this.y_ * cosAngle, this.z_);
};

/** Returns difference of this Vector and given Vector.
@param {!GenericVector} vector the vector to subtract
@return {!Vector} difference of this Vector and given vector
*/
subtract(vector) {
  return new Vector(this.x_ - vector.getX(),
      this.y_ - vector.getY(), this.z_ - vector.getZ());
};
} // end class

/** The vector `(1, 0, 0)`.
* @type {!Vector}
* @const
*/
Vector.EAST = new Vector(1, 0);

/**  The vector `(0, 1, 0)`.
* @type {!Vector}
* @const
*/
Vector.NORTH = new Vector(0, 1);

/** The vector `(0, 0, 0)`.
* @type {!Vector}
* @const
*/
Vector.ORIGIN = new Vector(0, 0);

/** The vector `(0, -1, 0)`.
* @type {!Vector}
* @const
*/
Vector.SOUTH = new Vector(0, -1);

/** Very small number used to detect zero length vectors in {@link #divide} and
{@link #normalize}.
@const
@type {number}
*/
Vector.TINY_POSITIVE = 1E-10;

/** The vector `(-1, 0, 0)`.
* @type {!Vector}
* @const
*/
Vector.WEST = new Vector(-1, 0);

exports = Vector;
