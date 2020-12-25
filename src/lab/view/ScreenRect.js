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

goog.module('myphysicslab.lab.view.ScreenRect');

const Util = goog.require('myphysicslab.lab.util.Util');

/** An immutable rectangle corresponding to screen coordinates where the
vertical coordinates increase downwards.
*/
class ScreenRect {
/**
@param {number} left the horizontal coordinate of the top-left corner
@param {number} top the vertical coordinate of the top-left corner
@param {number} width the width of the rectangle
@param {number} height the height of the rectangle
*/
constructor(left, top, width, height) {
  if (typeof left !== 'number' || typeof top !== 'number' || typeof width !== 'number'
      || typeof height !== 'number') {
    throw '';
  }
  if (width < 0 || height < 0) {
    throw '';
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
  this.top_ = top;
  /**
  * @type {number}
  * @private
  */
  this.width_ = width;
  /**
  * @type {number}
  * @private
  */
  this.height_ = height;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'ScreenRect{left_: '+Util.NF(this.left_)
      +', top_: '+Util.NF(this.top_)
      +', width_: '+Util.NF(this.width_)
      +', height_: '+Util.NF(this.height_)
      +'}';
};

/** Returns a copy of the given ScreenRect.
* @param {!ScreenRect} rect the ScreenRect to clone
* @return {!ScreenRect} a copy of `rect`
*/
static clone(rect) {
  return new ScreenRect(rect.left_, rect.top_, rect.width_, rect.height_);
};

/** Returns true if this ScreenRect is exactly equal to the other ScreenRect.
* @param {!ScreenRect} otherRect the ScreenRect to compare to
* @return {boolean} true if this ScreenRect is exactly equal to the other ScreenRect
*/
equals(otherRect) {
  return this.left_ == otherRect.left_ &&
         this.top_ == otherRect.top_ &&
         this.width_ == otherRect.width_ &&
         this.height_ == otherRect.height_;
};

/** Returns true if the object is likely a ScreenRect. Only works under simple
* compilation, intended for interactive non-compiled code.
* @param {*} obj the object of interest
* @return {boolean} true if the object is likely a ScreenRect
*/
static isDuckType(obj) {
  if (obj instanceof ScreenRect) {
    return true;
  }
  if (Util.ADVANCED) {
    return false;
  }
  return obj.getLeft !== undefined
    && obj.getTop !== undefined
    && obj.getWidth !== undefined
    && obj.getHeight !== undefined
    && obj.isEmpty !== undefined
    && obj.equals !== undefined
    && obj.nearEqual !== undefined
};

/** The horizontal coordinate of this ScreenRect center.
* @return {number} the horizontal coordinate of this ScreenRect center
*/
getCenterX() {
  return this.left_ + this.width_/2;
};

/** The vertical coordinate of this ScreenRect center
* @return {number} the vertical coordinate of this ScreenRect center
*/
getCenterY() {
  return this.top_ + this.height_/2;
};

/** The height of this ScreenRect.
* @return {number} the height of this ScreenRect.
*/
getHeight() {
  return this.height_;
};

/** The left coordinate of this ScreenRect.
* @return {number} the left coordinate of this ScreenRect.
*/
getLeft() {
  return this.left_;
};

/** The top coordinate of this ScreenRect.
* @return {number} the top coordinate of this ScreenRect
*/
getTop() {
  return this.top_;
};

/** The width of this ScreenRect.
* @return {number} the width of this ScreenRect.
*/
getWidth() {
  return this.width_;
};

/** Returns true if this ScreenRect has zero width or height, within the tolerance
* @param {number=} opt_tol tolerance for comparison, default is 1E-14;
* @return {boolean} true if this ScreenRect has zero width or height
*/
isEmpty(opt_tol) {
  var tol = opt_tol || 1E-14;
  return this.width_ < tol || this.height_ < tol;
};

/** Creates an oval path in the Canvas context, with the size of this ScreenRect.
@param {!CanvasRenderingContext2D} context the Canvas context to draw into
*/
makeOval(context) {
    var w = this.width_/2;
    var h = this.height_/2;
  if (typeof context.ellipse === 'function') {
    context.beginPath();
    context.moveTo(this.left_ + this.width_, this.top_ + h);
    // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
    context.ellipse(this.left_ + w, this.top_ + h, w, h, 0, 0, 2*Math.PI, false);
  } else {
    // If ellipse() is not defined, draw a circle instead
    var min = Math.min(w, h);
    context.beginPath();
    context.moveTo(this.left_ + this.width_, this.top_);
    // arc(x, y, radius, startAngle, endAngle, anticlockwise);
    context.arc(this.left_+w, this.top_+h, min, 0, 2*Math.PI, false);
    context.closePath();
  }
};

/** Creates a rectangle path in the Canvas context, with the size of this ScreenRect.
@param {!CanvasRenderingContext2D} context the Canvas context to draw into
*/
makeRect(context) {
  context.rect(this.left_, this.top_, this.width_, this.height_);
};

/** Returns true if this ScreenRect is nearly equal to another ScreenRect.
The optional tolerance value corresponds to the `epsilon` in
{@link Util#veryDifferent}, so the actual tolerance
used depends on the magnitude of the numbers being compared.
* @param {!ScreenRect} otherRect  the ScreenRect to compare to
* @param {number=} opt_tolerance optional tolerance for comparison
* @return {boolean} true if this ScreenRect is nearly equal to the other ScreenRect
*/
nearEqual(otherRect, opt_tolerance) {
  if (Util.veryDifferent(this.left_, otherRect.left_, opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(this.top_, otherRect.top_, opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(this.width_, otherRect.width_, opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(this.height_, otherRect.height_, opt_tolerance)) {
    return false;
  }
  return true;
};

} // end class

/** An empty ScreenRect located at the origin.
* @type {!ScreenRect}
* @const
*/
ScreenRect.EMPTY_RECT = new ScreenRect(0, 0, 0, 0);

exports = ScreenRect;
