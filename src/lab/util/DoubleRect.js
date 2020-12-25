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

goog.module('myphysicslab.lab.util.DoubleRect');

const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/**  An immutable rectangle whose boundaries are stored with double floating
point precision.

Note that for DoubleRect we regard the vertical coordinate as **increasing upwards**, so
the top coordinate is greater than the bottom coordinate. This is in contrast to HTML5
canvas where vertical coordinates increase downwards.

@todo consider implementing a 'real' equals method, see *Bloch, Effective Java*

@todo consider making a mutable version, and providing methods that work on that;
see [Immutables by Mark Davis](http://macchiato.com/columns/Durable2.html)
*/
class DoubleRect {
/**
@param {number} left left side of DoubleRect, must be less than right
@param {number} bottom bottom of DoubleRect, must be less than top
@param {number} right right side of DoubleRect
@param {number} top top of DoubleRect
@throws {!Error} when left > right or bottom > top
*/
constructor(left, bottom, right, top) {
  /**
  * @type {number}
  * @private
  */
  this.left_ = Util.testNumber(left);
  /**
  * @type {number}
  * @private
  */
  this.right_ = Util.testNumber(right);
  /**
  * @type {number}
  * @private
  */
  this.bottom_ = Util.testNumber(bottom);
  /**
  * @type {number}
  * @private
  */
  this.top_ = Util.testNumber(top);
  if (left > right) {
    throw 'DoubleRect: left > right '+left+' > '+right;
  }
  if (bottom > top) {
    throw 'DoubleRect: bottom > top '+bottom+' > '+top;
  }
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'DoubleRect{left_: '+Util.NF(this.left_)
      +', bottom_: '+Util.NF(this.bottom_)
      +', right_: '+Util.NF(this.right_)
      +', top_: '+Util.NF(this.top_)
      +'}';
};

/** Returns a copy of the given DoubleRect.
@param {!DoubleRect} rect the DoubleRect to copy
@return {!DoubleRect} a copy of the given DoubleRect
*/
static clone(rect) {
  return new DoubleRect(rect.getLeft(), rect.getBottom(), rect.getRight(),
      rect.getTop());
};

/** Returns true if the object is likely a DoubleRect. Only works under simple
* compilation, intended for interactive non-compiled code.
* @param {*} obj the object of interest
* @return {boolean} true if the object is likely a DoubleRect
*/
static isDuckType(obj) {
  if (obj instanceof DoubleRect) {
    return true;
  }
  if (Util.ADVANCED) {
    return false;
  }
  return obj.getLeft !== undefined
    && obj.getRight !== undefined
    && obj.getTop !== undefined
    && obj.getBottom !== undefined
    && obj.translate !== undefined
    && obj.scale !== undefined
};

/** Returns a DoubleRect spanning the two given points.
@param {!GenericVector} point1
@param {!GenericVector} point2
@return {!DoubleRect} a DoubleRect spanning the two given points
*/
static make(point1, point2) {
  var left = Math.min(point1.getX(), point2.getX());
  var right = Math.max(point1.getX(), point2.getX());
  var bottom = Math.min(point1.getY(), point2.getY());
  var top = Math.max(point1.getY(), point2.getY());
  return new DoubleRect(left, bottom, right, top);
};

/** Returns a DoubleRect centered at the given point with given height and width.
@param {!GenericVector} center center of the DoubleRect
@param {number} width width of the DoubleRect
@param {number} height height of the DoubleRect
@return {!DoubleRect} a DoubleRect centered at the given point
    with given height and width
*/
static makeCentered(center, width, height) {
  var x = center.getX();
  var y = center.getY();
  return new DoubleRect(x - width/2, y - height/2, x + width/2, y + height/2);
};

/** Returns a DoubleRect centered at the given point with given size.
@param {!GenericVector} center center of the DoubleRect
@param {!GenericVector} size width and height as a Vector
@return {!DoubleRect} a DoubleRect centered at the given point
    with given size
*/
static makeCentered2(center, size) {
  var x = center.getX();
  var y = center.getY();
  var w = size.getX();
  var h = size.getY();
  return new DoubleRect(x - w/2, y - h/2, x + w/2, y + h/2);
};

/** Returns `true` if the given point is within this rectangle.
@param {!GenericVector} point  the point to test
@return {boolean} `true` if the point is within this rectangle, or exactly on an edge
*/
contains(point) {
  return point.getX() >= this.left_ &&
         point.getX() <= this.right_ &&
         point.getY() >= this.bottom_ &&
         point.getY() <= this.top_;
};

/**  Returns `true` if the object is a DoubleRect with the same coordinates.
@param {*} obj the object to compare to
@return {boolean} `true` if the object is a DoubleRect with the same coordinates.
*/
equals(obj) {
  if (obj === this)
    return true;
  if (obj instanceof DoubleRect) {
    // WARNING:  this is different to Double.equals for NaN and +0.0/-0.0.
    return obj.getLeft() == this.left_ && obj.getRight() == this.right_ &&
      obj.getBottom() == this.bottom_ && obj.getTop() == this.top_;
  } else {
    return false;
  }
};

/** Returns a copy of this DoubleRect expanded by the given margin in x and y
dimension.
* @param {number} marginX the margin to add at left and right
* @param {number=} marginY the margin to add at top and bottom; if undefined then
*     `marginX` is used for both x and y dimension
* @return {!DoubleRect} a DoubleRect with same center as this
*    DoubleRect, but expanded or contracted
*/
expand(marginX, marginY) {
  marginY = (marginY === undefined) ? marginX : marginY;
  return new DoubleRect(this.getLeft() - marginX, this.getBottom() - marginY,
      this.getRight() + marginX, this.getTop() + marginX);
};

/** Returns the smallest vertical coordinate of this DoubleRect
* @return {number} smallest vertical coordinate  of this DoubleRect
*/
getBottom() {
  return this.bottom_;
};

/** Returns the center of this DoubleRect.
* @return {!Vector} center of this DoubleRect
*/
getCenter() {
  return new Vector(this.getCenterX(), this.getCenterY());
};

/** Returns the horizontal coordinate of center of this DoubleRect.
* @return {number} horizontal coordinate of center of this DoubleRect
*/
getCenterX() {
  return (this.left_ + this.right_)/2.0;
};

/** Returns the vertical coordinate of center of this DoubleRect.
* @return {number} vertical coordinate of center of this DoubleRect
*/
getCenterY() {
  return (this.bottom_ + this.top_)/2.0;
};

/** Returns the vertical height of this DoubleRect
* @return {number} vertical height of this DoubleRect
*/
getHeight() {
  return this.top_ - this.bottom_;
};

/** Returns the smallest horizontal coordinate of this DoubleRect
* @return {number} smallest horizontal coordinate of this DoubleRect
*/
getLeft() {
  return this.left_;
};

/** Returns the largest horizontal coordinate of this DoubleRect
* @return {number} largest horizontal coordinate of this DoubleRect
*/
getRight() {
  return this.right_;
};

/** Returns the largest vertical coordinate of this DoubleRect
* @return {number} largest vertical coordinate of this DoubleRect
*/
getTop() {
  return this.top_;
};

/** Returns the horizontal width of this DoubleRect
* @return {number} horizontal width of this DoubleRect
*/
getWidth() {
  return this.right_ - this.left_;
};

/**  Returns a rectangle that is the intersection of this and another rectangle.
@param {!DoubleRect} rect the other rectangle to form the intersection with
@return {!DoubleRect} the intersection of this and the other rectangle, possibly
    an empty rectangle.
*/
intersection(rect) {
  const left = Math.max(this.left_, rect.getLeft());
  const bottom = Math.max(this.bottom_, rect.getBottom());
  const right = Math.min(this.right_, rect.getRight());
  const top = Math.min(this.top_, rect.getTop());
  if (left > right || bottom > top) {
    return DoubleRect.EMPTY_RECT;
  } else {
    return new DoubleRect(left, bottom, right, top);
  }
};

/** Returns `true` if width or height of this DoubleRect are zero (within given
* tolerance).
* @param {number=} opt_tolerance optional tolerance for the test; a width or height
*     smaller than this is regarded as zero; default is 1E-16
* @return {boolean} `true` if width or height of this DoubleRect are zero (within given
*     tolerance)
*/
isEmpty(opt_tolerance) {
  var tol = opt_tolerance || 1E-16;
  return this.getWidth() < tol || this.getHeight() < tol;
};

/** Returns true if the line between the two points might be visible in the rectangle.
* @param {!GenericVector} p1 first end point of line
* @param {!GenericVector} p2 second end point of line
* @return {boolean} true if the line between the two points might be visible in the
*    rectangle
*/
maybeVisible(p1, p2) {
  // if either point is inside the rect, then line is visible
  if (this.contains(p1) || this.contains(p2)) {
    return true;
  }
  // if both points are "outside" one of the rectangle sides, then line is not visible
  var p1x = p1.getX();
  var p1y = p1.getY();
  var p2x = p2.getX();
  var p2y = p2.getY();
  var d = this.left_;
  if (p1x < d && p2x < d) {
    return false;
  }
  d = this.right_;
  if (p1x > d && p2x > d) {
    return false;
  }
  d = this.bottom_;
  if (p1y < d && p2y < d) {
    return false;
  }
  d = this.top_;
  if (p1y > d && p2y > d) {
    return false;
  }
  // we could check for intersection of the line with the rectangle here.
  return true;
};

/** Returns `true` if this DoubleRect is nearly equal to another DoubleRect.
The optional tolerance value corresponds to the `epsilon` in
{@link Util#veryDifferent}, so the actual tolerance used depends on the
magnitude of the numbers being compared.
* @param {!DoubleRect} rect  the DoubleRect to compare with
* @param {number=} opt_tolerance optional tolerance for equality test
* @return {boolean} true` if this DoubleRect is nearly equal to another DoubleRect
*/
nearEqual(rect, opt_tolerance) {
  if (Util.veryDifferent(this.left_, rect.getLeft(), opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(this.bottom_, rect.getBottom(), opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(this.right_, rect.getRight(), opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(this.top_, rect.getTop(), opt_tolerance)) {
    return false;
  }
  return true;
};

/** Returns a copy of this DoubleRect expanded by the given factors in both x and y
dimension. Expands (or contracts) about the center of this DoubleRect by the given
expansion factor in x and y dimensions.
* @param {number} factorX the factor to expand width by; 1.1 gives a 10 percent
*    expansion; 0.9 gives a 10 percent contraction
* @param {number=} factorY  factor to expand height by; if undefined then `factorX` is
*    used for both x and y dimension
* @return {!DoubleRect} a DoubleRect with same center as this
*    DoubleRect, but expanded or contracted
*/
scale(factorX, factorY) {
  factorY = (factorY === undefined) ? factorX : factorY;
  var x0 = this.getCenterX();
  var y0 = this.getCenterY();
  var w = this.getWidth();
  var h = this.getHeight();
  return new DoubleRect(x0 - (factorX*w)/2, y0 - (factorY*h)/2,
      x0 + (factorX*w)/2, y0 + (factorY*h)/2);
};

/** Returns a copy of this rectangle translated by the given amount.
@param {!GenericVector|number} x horizontal amount to translate by,
    or Vector to translate by
@param {number=} y vertical amount to translate by; required when `x` is a number.
@return {!DoubleRect} a copy of this rectangle translated by the
    given amount
@throws {!Error} when `x` is a number and `y` is not defined
*/
translate(x, y) {
  var x1, y1;
  if (typeof x === 'number') {
    x1 = x;
    y1 = y;
  } else {
    var v = /** @type {!GenericVector} */(x);
    y1 = v.getY();
    x1 = v.getX();
  }
  if (typeof x1 !== 'number' || typeof y1 !== 'number') {
    throw '';
  }
  return new DoubleRect(this.left_ + x1, this.bottom_ + y1,
      this.right_ + x1, this.top_ + y1);
};

/**  Returns a rectangle that is the union of this and another rectangle.
@param {!DoubleRect} rect the other rectangle to form the union
    with
@return {!DoubleRect} the union of this and the other rectangle
*/
union(rect) {
  return new DoubleRect(
      Math.min(this.left_, rect.getLeft()),
      Math.min(this.bottom_, rect.getBottom()),
      Math.max(this.right_, rect.getRight()),
      Math.max(this.top_, rect.getTop())
      );
};

/**  Returns a rectangle that is the union of this rectangle and a point
@param {!GenericVector} point the point to form the union with
@return {!DoubleRect} the union of this rectangle and the point
*/
unionPoint(point) {
  return new DoubleRect(
      Math.min(this.left_, point.getX()),
      Math.min(this.bottom_, point.getY()),
      Math.max(this.right_, point.getX()),
      Math.max(this.top_, point.getY())
      );
};

} // end class

/** The empty rectangle (0, 0, 0, 0).
* @type {!DoubleRect}
* @const
*/
DoubleRect.EMPTY_RECT = new DoubleRect(0, 0, 0, 0);

exports = DoubleRect;
