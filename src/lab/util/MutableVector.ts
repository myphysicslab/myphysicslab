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

import { GenericVector, Vector } from "./Vector.js";
import { Util } from "./Util.js";

/** Mutable vector defines a point in 2D or 3D and can be altered after creation.
*/
export class MutableVector implements GenericVector {
  private x_: number;
  private y_: number;
  private z_: number;

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
};

/** @inheritDoc */
toString() {
  return 'MutableVector{x: '+Util.NF5(this.x_)
      +', y: '+Util.NF5(this.y_)
      + (this.z_ != 0 ? ', z: '+Util.NF5(this.z_) : '')
      +'}';
};

/** Returns a new MutableVector having the same values as the input GenericVector.
@param v vector to copy
@return a new MutableVector with the same values as the input GenericVector
*/
static clone(v: GenericVector): MutableVector {
  return new MutableVector(v.getX(), v.getY(), v.getZ());
};

/** Adds the given GenericVector to this MutableVector.
@param p vector to add
@return this MutableVector for chaining
*/
add(p: GenericVector): MutableVector {
  this.x_ += p.getX();
  this.y_ += p.getY();
  this.z_ += p.getZ();
  return this;
};

/** Returns distance-squared between this MutableVector and another GenericVector
regarding both as points in space. Computationally inexpensive because it only uses
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

/** Returns distance between this MutableVector and another GenericVector regarding
both as points in space. Computationally expensive because it involves as square root.
@param point vector to calculate distance to
@return distance between this point and the given point
*/
distanceTo(point: GenericVector): number {
  return Math.sqrt(this.distanceSquaredTo(point));
};

/** Divides this MutableVector by the given factor.
@param factor factor by which to divide this vector, must be greater than
{@link lab/util/Vector.Vector.TINY_POSITIVE}
@return this MutableVector for chaining
@throws if factor is less than {@link lab/util/Vector.Vector.TINY_POSITIVE}
*/
divide(factor: number): MutableVector {
  if (factor === 1.0) {
    return this;
  } else if (factor < Vector.TINY_POSITIVE) {
    throw 'div by zero';
  } else {
    this.x_ /= factor;
    this.y_ /= factor;
    this.z_ /= factor;
    return this;
  }
};

/** Returns true if and only if the other object is a GenericVector with the same
values.
@param vector  the object to compare to
@return  true iff the other object is a GenericVector with the same values.
*/
equals(vector: GenericVector): boolean {
  if (vector === null)
    return false;
  return vector.getX() === this.x_ &&
         vector.getY() === this.y_ &&
         vector.getZ() === this.z_;
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

/** Returns length of this MutableVector. Note this is computationally expensive as it
involves taking a square root.
@return length of this MutableVector
*/
length(): number {
  return Math.sqrt(this.lengthSquared());
};

/** Computationally cheap version of {@link MutableVector.length}
which avoids the square root; returns sum of absolute value of each component `x, y, z`.
@return sum of absolute value of each component `x, y, z`.
*/
lengthCheap(): number {
  const r = Math.abs(this.x_) + Math.abs(this.y_);
  if (this.z_ == 0.0)
    return r;
  else
    return r + Math.abs(this.z_);
};

/** Returns length squared of this MutableVector. Computationally cheap because it
only uses multiplication, no square root.
@return length squared of this vector
*/
lengthSquared(): number {
  if (this.z_ === 0.0) {
    return this.x_ * this.x_ + this.y_ * this.y_;
  } else {
    return this.x_ * this.x_ + this.y_ * this.y_ + this.z_ * this.z_;
  }
};

/** Multiplies this MutableVector by the given factor.
@param factor factor by which to multiply this vector
@return this MutableVector for chaining
*/
multiply(factor: number): MutableVector {
  this.x_ *= factor;
  this.y_ *= factor;
  this.z_ *= factor;
  return this;
};

/** Returns `true` if this MutableVector is nearly equal to another GenericVector.
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

/** Returns the normalized version of this MutableVector, having unit length
and the same direction.
@return normalized version of this MutableVector,
    having unit length and the same direction
@throws if this MutableVector has length less than
{@link lab/util/Vector.Vector.TINY_POSITIVE}
*/
normalize(): Vector {
  const len = this.length();
  if (len < Vector.TINY_POSITIVE) {
    throw '';
  } else {
    return new Vector(this.x_ /len, this.y_ /len, this.z_ /len);
  }
};

/** Modifies this MutableVector to have the given values.
@param x the X value of the vector
@param y the Y value of the vector
@param z the Z value of the vector, uses zero if not defined
@return this vector
*/
setTo(x: number, y: number, z?: number): MutableVector {
  this.x_ = x;
  this.y_ = y;
  this.z_ = z || 0;
  return this;
};

/** Modifies this MutableVector to have the same values as the given GenericVector.
@param p vector to copy from
@return this vector
*/
setToVector(p: GenericVector): MutableVector {
  this.x_ = p.getX();
  this.y_ = p.getY();
  this.z_ = p.getZ();
  return this;
};

/** Subtracts the given GenericVector from this MutableVector.
@param p vector to subtract
@return difference of this vector and given vector
*/
subtract(p: GenericVector): MutableVector {
  this.x_ -= p.getX();
  this.y_ -= p.getY();
  this.z_ -= p.getZ();
  return this;
};
} // end MutableVector class

Util.defineGlobal('lab$util$MutableVector', MutableVector);
