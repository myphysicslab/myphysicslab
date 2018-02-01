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

goog.module('myphysicslab.lab.util.MutableVector');

const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Mutable vector defines a point in 2D or 3D and can be altered after creation.
* @implements {GenericVector}
*/
class MutableVector {

/**
* @param {number} x the X value of the Vector
* @param {number} y the Y value of the Vector
* @param {number=} opt_z the Z value of the Vector (optional, zero is default value)
*/
constructor(x, y, opt_z) {
  const z = goog.isNumber(opt_z) ? opt_z : 0;
  /**
  * @type {number}
  * @private
  */
  this.x_ = Util.testNumber(x);
  /**
  * @type {number}
  * @private
  */
  this.y_ = Util.testNumber(y);
  /**
  * @type {number}
  * @private
  */
  this.z_ = Util.testNumber(z);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'MutableVector{x: '+Util.NF5(this.x_)
      +', y: '+Util.NF5(this.y_)
      + (this.z_ != 0 ? ', z: '+Util.NF5(this.z_) : '')
      +'}';
};

/** Returns a new MutableVector having the same values as the input GenericVector.
@param {!GenericVector} v vector to copy
@return {!MutableVector} a new MutableVector with the same
    values as the input GenericVector
*/
static clone(v) {
  return new MutableVector(v.getX(), v.getY(), v.getZ());
};

/** Adds the given GenericVector to this MutableVector.
@param {!GenericVector} p vector to add
@return {!MutableVector} this MutableVector for chaining
*/
add(p) {
  this.x_ += p.getX();
  this.y_ += p.getY();
  this.z_ += p.getZ();
  return this;
};

/** Returns distance-squared between this MutableVector and another GenericVector
regarding both as points in space. Computationally inexpensive because it only uses
multiplication, no square root.
@param {!GenericVector} point vector to calculate distance to
@return {number} distance squared between this point and the given point
*/
distanceSquaredTo(point) {
  var dx = this.x_ - point.getX();
  var dy = this.y_ - point.getY();
  var dz = this.z_ - point.getZ();
  return dx*dx + dy*dy + dz*dz;
};

/** Returns distance between this MutableVector and another GenericVector regarding
both as points in space. Computationally expensive because it involves as square root.
@param {!GenericVector} point vector to calculate distance to
@return {number} distance between this point and the given point
*/
distanceTo(point) {
  return Math.sqrt(this.distanceSquaredTo(point));
};

/** Divides this MutableVector by the given factor.
@param {number} factor factor by which to divide this vector, must be greater than
{@link Vector.TINY_POSITIVE}
@return {!MutableVector} this MutableVector for chaining
@throws {!Error} if factor is less than {@link Vector.TINY_POSITIVE}
*/
divide(factor) {
  if (factor === 1.0) {
    return this;
  } else if (factor < Vector.TINY_POSITIVE) {
    throw new Error('div by zero');
  } else {
    this.x_ /= factor;
    this.y_ /= factor;
    this.z_ /= factor;
    return this;
  }
};

/** Returns true if and only if the other object is a GenericVector with the same
values.
@param {!GenericVector} vector  the object to compare to
@return {boolean}  true iff the other object is a GenericVector with the same values.
*/
equals(vector)  {
  if (goog.isNull(vector))
    return false;
  return vector.getX() === this.x_ &&
         vector.getY() === this.y_ &&
         vector.getZ() === this.z_;
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

/** Returns length of this MutableVector. Note this is computationally expensive as it
involves taking a square root.
@return {number} length of this MutableVector
*/
length() {
  return Math.sqrt(this.lengthSquared());
};

/** Computationally cheap version of {@link #length}
which avoids the square root; returns sum of absolute value of each component `x, y, z`.
@return {number} sum of absolute value of each component `x, y, z`.
*/
lengthCheap() {
  var r = Math.abs(this.x_) + Math.abs(this.y_);
  if (this.z_ == 0.0)
    return r;
  else
    return r + Math.abs(this.z_);
};

/** Returns length squared of this MutableVector. Computationally cheap because it
only uses multiplication, no square root.
@return {number} length squared of this vector
*/
lengthSquared() {
  if (this.z_ === 0.0) {
    return this.x_ * this.x_ + this.y_ * this.y_;
  } else {
    return this.x_ * this.x_ + this.y_ * this.y_ + this.z_ * this.z_;
  }
};

/** Multiplies this MutableVector by the given factor.
@param {number} factor factor by which to multiply this vector
@return {!MutableVector} this MutableVector for chaining
*/
multiply(factor) {
  this.x_ *= factor;
  this.y_ *= factor;
  this.z_ *= factor;
  return this;
};

/** Returns `true` if this MutableVector is nearly equal to another GenericVector.
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

/** Returns the normalized version of this MutableVector, having unit length
and the same direction.
@return {!Vector} normalized version of this MutableVector,
    having unit length and the same direction
@throws {!Error} if this MutableVector has length less than
{@link Vector.TINY_POSITIVE}
*/
normalize() {
  var len = this.length();
  if (len < Vector.TINY_POSITIVE) {
    throw new Error();
  } else {
    return new Vector(this.x_ /len, this.y_ /len, this.z_ /len);
  }
};

/** Modifies this MutableVector to have the given values.
* @param {number} x the X value of the vector
* @param {number} y the Y value of the vector
* @param {number=} z the Z value of the vector, uses zero if not defined
* @return {!MutableVector} this vector
*/
setTo(x, y, z) {
  this.x_ = x;
  this.y_ = y;
  this.z_ = z || 0;
  return this;
};

/** Modifies this MutableVector to have the same values as the given GenericVector.
* @param {!GenericVector} p vector to copy from
* @return {!MutableVector} this vector
*/
setToVector(p) {
  this.x_ = p.getX();
  this.y_ = p.getY();
  this.z_ = p.getZ();
  return this;
};

/** Subtracts the given GenericVector from this MutableVector.
@param {!GenericVector} p vector to subtract
@return {!MutableVector} difference of this vector and given vector
*/
subtract(p) {
  this.x_ -= p.getX();
  this.y_ -= p.getY();
  this.z_ -= p.getZ();
  return this;
};
} // end class

exports = MutableVector;
