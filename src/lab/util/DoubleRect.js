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

goog.provide('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.GenericVector');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var GenericVector = myphysicslab.lab.util.GenericVector;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/**  A rectangle whose boundaries are stored with double floating
point precision. This is an immutable class: once an instance is created it cannot be
changed.


Note that for DoubleRect we regard the vertical coordinate as **increasing upwards**, so
the top coordinate is greater than the bottom coordinate. This is in contrast to HTML5
canvas where vertical coordinates increase downwards.

@todo consider implementing a 'real' equals method, see *Bloch, Effective Java*

@todo consider making a mutable version, and providing methods that work on that;
see [Immutables by Mark Davis](http://macchiato.com/columns/Durable2.html)

@param {number} left left side of DoubleRect, must be less than right
@param {number} bottom bottom of DoubleRect, must be less than top
@param {number} right right side of DoubleRect
@param {number} top_ top of DoubleRect
@throws {Error} when left > right or bottom > top
@constructor
@final
@struct
*/
myphysicslab.lab.util.DoubleRect = function(left, bottom, right, top_) {
  if (true) {
    UtilityCore.testNumber(left);
    UtilityCore.testNumber(right);
    UtilityCore.testNumber(bottom);
    UtilityCore.testNumber(top_);
  }
  /**
  * @type {number}
  * @private
  */
  this.left_ = left;
  /**
  * @type {number}
  * @private
  */
  this.right_ = right;
  /**
  * @type {number}
  * @private
  */
  this.bottom_ = bottom;
  /**
  * @type {number}
  * @private
  */
  this.top_ = top_;
  if (left > right) {
    throw new Error('DoubleRect: left > right '+left+' > '+right);
  }
  if (bottom > top_) {
    throw new Error('DoubleRect: bottom > top '+bottom+' > '+top_);
  }
};
var DoubleRect = myphysicslab.lab.util.DoubleRect;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DoubleRect.prototype.toString = function() {
    return 'DoubleRect{left_: '+NF(this.left_)
        +', bottom_: '+NF(this.bottom_)
        +', right_: '+NF(this.right_)
        +', top_: '+NF(this.top_)
        +'}';
  };
};

/** The empty rectangle (0, 0, 0, 0).
* @type {!DoubleRect}
* @const
*/
DoubleRect.EMPTY_RECT = new DoubleRect(0, 0, 0, 0);

/** Returns a copy of the given DoubleRect.
@param {!DoubleRect} rect the DoubleRect to copy
@return {!DoubleRect} a copy of the given DoubleRect
*/
DoubleRect.clone = function(rect) {
  return new DoubleRect(rect.getLeft(), rect.getBottom(),
    rect.getRight(), rect.getTop());
};

/** Returns true if the object is likely a DoubleRect. Only works under simple
* compilation, intended for interactive non-compiled code.
* @param {*} obj the object of interest
* @return {boolean} true if the object is likely a DoubleRect
*/
DoubleRect.isDuckType = function(obj) {
  if (obj instanceof DoubleRect) {
    return true;
  }
  if (UtilityCore.ADVANCED) {
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
DoubleRect.make = function(point1, point2) {
  var left = Math.min(point1.getX(), point2.getX());
  var right = Math.max(point1.getX(), point2.getX());
  var bottom = Math.min(point1.getY(), point2.getY());
  var top_ = Math.max(point1.getY(), point2.getY());
  return new DoubleRect(left, bottom, right, top_);
};

/** Returns a DoubleRect centered at the given point with given height and width.
@param {!GenericVector} center center of the DoubleRect
@param {number} width width of the DoubleRect
@param {number} height height of the DoubleRect
@return {!DoubleRect} a DoubleRect centered at the given point
    with given height and width
*/
DoubleRect.makeCentered = function(center, width, height) {
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
DoubleRect.makeCentered2 = function(center, size) {
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
DoubleRect.prototype.contains = function(point) {
  return point.getX() >= this.left_ &&
         point.getX() <= this.right_ &&
         point.getY() >= this.bottom_ &&
         point.getY() <= this.top_;
};

/**  Returns `true` if the object is a DoubleRect with the same coordinates.
@param {*} obj the object to compare to
@return {boolean} `true` if the object is a DoubleRect with the same coordinates.
*/
DoubleRect.prototype.equals = function(obj) {
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
DoubleRect.prototype.expand = function(marginX, marginY) {
  marginY = (marginY === undefined) ? marginX : marginY;
  return new DoubleRect(this.getLeft() - marginX, this.getBottom() - marginY,
      this.getRight() + marginX, this.getTop() + marginX);
};

/** Returns the smallest vertical coordinate of this DoubleRect
* @return {number} smallest vertical coordinate  of this DoubleRect
*/
DoubleRect.prototype.getBottom = function() {
  return this.bottom_;
};

/** Returns the center of this DoubleRect.
* @return {!Vector} center of this DoubleRect
*/
DoubleRect.prototype.getCenter = function() {
  return new Vector(this.getCenterX(), this.getCenterY());
};

/** Returns the horizontal coordinate of center of this DoubleRect.
* @return {number} horizontal coordinate of center of this DoubleRect
*/
DoubleRect.prototype.getCenterX = function() {
  return (this.left_ + this.right_)/2.0;
};

/** Returns the vertical coordinate of center of this DoubleRect.
* @return {number} vertical coordinate of center of this DoubleRect
*/
DoubleRect.prototype.getCenterY = function() {
  return (this.bottom_ + this.top_)/2.0;
};

/** Returns the vertical height of this DoubleRect
* @return {number} vertical height of this DoubleRect
*/
DoubleRect.prototype.getHeight = function() {
  return this.top_ - this.bottom_;
};

/** Returns the smallest horizontal coordinate of this DoubleRect
* @return {number} smallest horizontal coordinate of this DoubleRect
*/
DoubleRect.prototype.getLeft = function() {
  return this.left_;
};

/** Returns the largest horizontal coordinate of this DoubleRect
* @return {number} largest horizontal coordinate of this DoubleRect
*/
DoubleRect.prototype.getRight = function() {
  return this.right_;
};

/** Returns the largest vertical coordinate of this DoubleRect
* @return {number} largest vertical coordinate of this DoubleRect
*/
DoubleRect.prototype.getTop = function() {
  return this.top_;
};

/** Returns the horizontal width of this DoubleRect
* @return {number} horizontal width of this DoubleRect
*/
DoubleRect.prototype.getWidth = function() {
  return this.right_ - this.left_;
};

/** Returns `true` if width or height of this DoubleRect are zero (within given
* tolerance).
* @param {number=} opt_tolerance optional tolerance for the test; a width or height
*     smaller than this is regarded as zero; default is 1E-16
* @return {boolean} `true` if width or height of this DoubleRect are zero (within given
*     tolerance)
*/
DoubleRect.prototype.isEmpty = function(opt_tolerance) {
  var tol = opt_tolerance || 1E-16;
  return this.getWidth() < tol || this.getHeight() < tol;
};

/** Returns true if the line between the two points might be visible in the rectangle.
* @param {!GenericVector} p1 first end point of line
* @param {!GenericVector} p2 second end point of line
* @return {boolean} true if the line between the two points might be visible in the
*    rectangle
*/
DoubleRect.prototype.maybeVisible = function(p1, p2) {
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
{@link myphysicslab.lab.util.UtilityCore#veryDifferent}, so the actual tolerance
used depends on the magnitude of the numbers being compared.
* @param {!DoubleRect} rect  the DoubleRect to compare with
* @param {number=} opt_tolerance optional tolerance for equality test
* @return {boolean} true` if this DoubleRect is nearly equal to another DoubleRect
*/
DoubleRect.prototype.nearEqual = function(rect, opt_tolerance) {
  if (UtilityCore.veryDifferent(this.left_, rect.getLeft(), opt_tolerance)) {
    return false;
  }
  if (UtilityCore.veryDifferent(this.bottom_, rect.getBottom(), opt_tolerance)) {
    return false;
  }
  if (UtilityCore.veryDifferent(this.right_, rect.getRight(), opt_tolerance)) {
    return false;
  }
  if (UtilityCore.veryDifferent(this.top_, rect.getTop(), opt_tolerance)) {
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
DoubleRect.prototype.scale = function(factorX, factorY) {
  factorY = (factorY === undefined) ? factorX : factorY;
  var x0 = this.getCenterX();
  var y0 = this.getCenterY();
  var w = this.getWidth();
  var h = this.getHeight();
  return new DoubleRect(x0 - (factorX*w)/2, y0 - (factorY*h)/2,
      x0 + (factorX*w)/2, y0 + (factorY*h)/2);
};

/** Returns a copy of this rectangle translated by the given amount.
@param {!(number|GenericVector)} x horizontal amount to translate by,
    or Vector to translate by
@param {number=} y vertical amount to translate by; required when `x` is a number.
@return {!DoubleRect} a copy of this rectangle translated by the
    given amount
@throws {Error} when `x` is a number and `y` is not defined
*/
DoubleRect.prototype.translate = function(x, y) {
  if (!goog.isNumber(x)) {
    var v = /** @type {!GenericVector} */(x);
    x = v.getX();
    y = v.getY();
  } else if (!goog.isNumber(y)) {
    throw new Error();
  }
  return new DoubleRect(this.left_ + x, this.bottom_ + y,
      this.right_ + x, this.top_ + y);
};

/**  Returns a rectangle that is the union of this and another rectangle.
@param {!DoubleRect} rect the other rectangle to form the union
    with
@return {!DoubleRect} the union of this and the other rectangle
*/
DoubleRect.prototype.union = function(rect) {
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
DoubleRect.prototype.unionPoint = function(point) {
  return new DoubleRect(
      Math.min(this.left_, point.getX()),
      Math.min(this.bottom_, point.getY()),
      Math.max(this.right_, point.getX()),
      Math.max(this.top_, point.getY())
      );
};

});  // goog.scope
