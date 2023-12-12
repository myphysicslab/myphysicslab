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

import { Util } from "./Util.js";

/** Represents a point or vector in 3D space. Functions that take a vector parameter
should accept GenericVector so that many different types of vector can be provided.
*/
export interface GenericVector {
/** Returns the X value of this GenericVector.
* @return {number} the X value of this GenericVector
*/
getX(): number;

/** Returns the Y value of this GenericVector.
* @return {number} the Y value of this GenericVector
*/
getY(): number;

/** Returns the Z value of this GenericVector.
* @return {number} the Z value of this GenericVector
*/
getZ(): number;
};

/** An immutable vector in 3D space; after creation it cannot be altered.
*/
export class Vector implements GenericVector {
  private readonly x_: number;
  private readonly y_: number;
  private readonly z_: number;
  /** Cache of length. */
  private length_: number;
  /** Cache of lengthSquared. */
  private lengthSquared_: number;

/**
* @param x the X value of the Vector
* @param y the Y value of the Vector
* @param opt_z the Z value of the Vector (optional, zero is default value)
*/
constructor(x: number, y: number, opt_z?: number) {
  const z = typeof opt_z === 'number' ? opt_z : 0;
  this.x_ = Util.testNumber(x);
  this.y_ = Util.testNumber(y);
  this.z_ = Util.testNumber(z);
  this.length_ = NaN;
  this.lengthSquared_ = NaN;
};

/** @inheritDoc */
toString() {
  return 'Vector{x: '+Util.NF5(this.x_)
      +', y: '+Util.NF5(this.y_)
      + (this.z_ != 0 ? ', z: '+Util.NF5(this.z_) : '')
      +'}';
};

/** Returns an immutable Vector having the same values as the input GenericVector.
If the input vector is an immutable Vector, returns that same Vector.
@param vector the GenericVector to copy
@return an immutable Vector with the same values as the input GenericVector
*/
static clone(vector: GenericVector): Vector {
  if (vector instanceof Vector) {
    return vector;
  } else {
    return new Vector(vector.getX(), vector.getY(), vector.getZ());
  }
};

/** Returns sum of this Vector and given GenericVector.
@param vector the Vector to add
@return sum of this Vector and given Vector
*/
add(vector: GenericVector): Vector {
  return new Vector(this.x_ + vector.getX(),
      this.y_ + vector.getY(), this.z_ + vector.getZ());
};

/** Returns the angle going from this vector to another vector when both vectors are
arranged so they start at the origin.
@param vector the other vector
@return angle from this vector to other vector in radians; positive means
    counterclockwise.
*/
angleTo(vector: GenericVector): number {
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
@param point vector to calculate distance to
@return distance squared between this point and the given point
*/
distanceSquaredTo(point: GenericVector): number {
  const dx = this.x_ - point.getX();
  const dy = this.y_ - point.getY();
  const dz = this.z_ - point.getZ();
  return dx*dx + dy*dy + dz*dz;
};

/** Returns distance between this Vector and another GenericVector regarding both as
points in space.  Computationally expensive because it involves as square root.
@param point the Vector to calculate distance to
@return distance between this Vector and the given point
*/
distanceTo(point: GenericVector): number {
  return Math.sqrt(this.distanceSquaredTo(point));
};

/** Returns this Vector divided by the given factor.
@param factor factor by which to divide this Vector
@return quotient of this vector and given factor
@throws if factor is less than {@link Vector.TINY_POSITIVE}
*/
divide(factor: number): Vector {
  if (factor === 1.0) {
    return this;
  } else if (factor < Vector.TINY_POSITIVE) {
    throw 'Vector.divide by near zero factor '+Util.NFE(factor);
  } else {
    return new Vector(this.x_ / factor, this.y_ / factor,  this.z_ / factor);
  }
};

/** Returns the dot product of this Vector and the given vector.
@param vector the vector with which to form a dot product
@return the dot product of this Vector and the given vector
*/
dotProduct(vector: GenericVector): number {
  const r = this.x_ * vector.getX() + this.y_ * vector.getY() + this.z_ * vector.getZ();
  if (isNaN(r)) {
    throw Util.DEBUG ? ('dotproduct is not a number '+this+' '+vector) : '';
  }
  return r;
};

/**  Returns true iff the other object is a GenericVector with the same values.
@param vector  the object to compare to
@return  true iff the other object is a GenericVector with the same values.
*/
equals(vector: GenericVector): boolean  {
  if (vector === null) {
    return false;
  }
  return vector.getX() === this.x_ &&
         vector.getY() === this.y_ &&
         vector.getZ() === this.z_;
};

/** Returns the angle `theta` from the conversion of rectangular coordinates
`(x, y)` to polar coordinates `(r, theta)`.
@return the angle of this Vector in the `x-y` plane using mathematical
    angle convention in radians in range from `-pi` to `pi`.
*/
getAngle(): number {
  return Math.atan2(this.y_, this.x_);
};

/** @inheritDoc */
getX(): number {
  return this.x_;
};

/** @inheritDoc */
getY(): number {
  return this.y_;
};

/** @inheritDoc */
getZ(): number {
  return this.z_;
};

/** Returns length of this Vector.  Note this is computationally expensive as it
involves taking a square root.
@return length of this Vector
*/
length(): number {
  if (isNaN(this.length_)) {
    this.length_ = Math.sqrt(this.lengthSquared());
  }
  return this.length_;
};

/** Computationally cheap version of {@link Vector.length} which avoids the square root;
returns sum of absolute value of each component `x, y, z`.
@return sum of absolute value of each component `x, y, z`.
*/
lengthCheap(): number {
  const r = Math.abs(this.x_) + Math.abs(this.y_);
  if (this.z_ == 0.0) {
    return r;
  } else {
    return r + Math.abs(this.z_);
  }
};

/** Returns length squared of this Vector.  Computationally cheap because it only
uses multiplication, no square root.
@return length squared of this Vector
*/
lengthSquared(): number {
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
@param factor factor by which to multiply this Vector
@return product of this Vector and given factor
*/
multiply(factor: number): Vector {
  if (factor === 1.0) {
    return this;
  } else {
    return new Vector(factor * this.x_, factor * this.y_,
          factor * this.z_);
  }
};

/** Returns `true` if this Vector is nearly equal to another Vector. The optional
tolerance value corresponds to the `epsilon` in
{@link Util.veryDifferent} so
the actual tolerance used depends on the magnitude of the numbers being compared.
@param vector the vector to compare to
@param opt_tolerance optional tolerance for equality test
@return true if the vectors are similar
*/
nearEqual(vector: GenericVector, opt_tolerance?: number): boolean {
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
@return normalized version of this Vector, having unit length and the same
    direction
@throws if this Vector has length less than {@link Vector.TINY_POSITIVE}
*/
normalize(): Vector {
  return this.divide(this.length());
};

/** Returns this Vector rotated counter-clockwise about the origin by the given angle
in radians. If two parameters are given then they are the cosine and sine of the angle
(this avoids calculating the sine and cosine which is computationally expensive).
@param angle the angle in radians by which to rotate this Vector, or the
    cosine of the angle when two parameters are given
@param sineAngle the sine of the angle, when two parameters are given
@return this Vector rotated counter-clockwise about the origin
*/
rotate(angle: number, sineAngle?: number): Vector {
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
@param vector the vector to subtract
@return difference of this Vector and given vector
*/
subtract(vector: GenericVector): Vector {
  return new Vector(this.x_ - vector.getX(),
      this.y_ - vector.getY(), this.z_ - vector.getZ());
};

/** Very small number used to detect zero length vectors in {@link Vector.divide}
* and {@link Vector.normalize}.
*/
static readonly TINY_POSITIVE = 1E-10;

/** The vector `(0, 0, 0)`. */
static readonly ORIGIN = new Vector(0, 0);

/** The vector `(1, 0, 0)`. */
static readonly EAST = new Vector(1, 0);

/**  The vector `(0, 1, 0)`. */
static readonly NORTH = new Vector(0, 1);

/** The vector `(0, -1, 0)`. */
static readonly SOUTH = new Vector(0, -1);

/** The vector `(-1, 0, 0)`. */
static readonly WEST = new Vector(-1, 0);
}; // end Vector class

Util.defineGlobal('lab$util$Vector', Vector);
