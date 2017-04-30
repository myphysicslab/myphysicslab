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

goog.provide('myphysicslab.lab.view.ScreenRect');

goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var NF = myphysicslab.lab.util.Util.NF;
var Util = myphysicslab.lab.util.Util;

/** An immutable rectangle corresponding to screen coordinates where the
vertical coordinates increase downwards.

@param {number} left the horizontal coordinate of the top-left corner
@param {number} top_ the vertical coordinate of the top-left corner
@param {number} width the width of the rectangle
@param {number} height the height of the rectangle
@constructor
@final
@struct
*/
myphysicslab.lab.view.ScreenRect = function(left, top_, width, height) {
  if (!goog.isNumber(left) || !goog.isNumber(top_) || !goog.isNumber(width)
      || !goog.isNumber(height)) {
    throw new Error();
  }
  if (width < 0 || height < 0) {
    throw new Error();
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
  this.top_ = top_;
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
var ScreenRect = myphysicslab.lab.view.ScreenRect;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  ScreenRect.prototype.toString = function() {
    return 'ScreenRect{left: '+NF(this.left_)
        +', top_: '+NF(this.top_)
        +', width: '+NF(this.width_)
        +', height: '+NF(this.height_)
        +'}';
  };
};

/** An empty ScreenRect located at the origin.
* @type {!ScreenRect}
* @const
*/
ScreenRect.EMPTY_RECT = new ScreenRect(0, 0, 0, 0);

/** Returns a copy of the given ScreenRect.
* @param {!ScreenRect} rect the ScreenRect to clone
* @return {!ScreenRect} a copy of `rect`
*/
ScreenRect.clone = function(rect) {
  return new ScreenRect(rect.left_, rect.top_, rect.width_, rect.height_);
};

/** Returns true if this ScreenRect is exactly equal to the other ScreenRect.
* @param {!ScreenRect} otherRect the ScreenRect to compare to
* @return {boolean} true if this ScreenRect is exactly equal to the other ScreenRect
*/
ScreenRect.prototype.equals = function(otherRect) {
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
ScreenRect.isDuckType = function(obj) {
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
ScreenRect.prototype.getCenterX = function() {
  return this.left_ + this.width_/2;
};

/** The vertical coordinate of this ScreenRect center
* @return {number} the vertical coordinate of this ScreenRect center
*/
ScreenRect.prototype.getCenterY = function() {
  return this.top_ + this.height_/2;
};

/** The height of this ScreenRect.
* @return {number} the height of this ScreenRect.
*/
ScreenRect.prototype.getHeight = function() {
  return this.height_;
};

/** The left coordinate of this ScreenRect.
* @return {number} the left coordinate of this ScreenRect.
*/
ScreenRect.prototype.getLeft = function() {
  return this.left_;
};

/** The top coordinate of this ScreenRect.
* @return {number} the top coordinate of this ScreenRect
*/
ScreenRect.prototype.getTop = function() {
  return this.top_;
};

/** The width of this ScreenRect.
* @return {number} the width of this ScreenRect.
*/
ScreenRect.prototype.getWidth = function() {
  return this.width_;
};

/** Returns true if this ScreenRect has zero width or height, within the tolerance
* @param {number=} opt_tol tolerance for comparison, default is 1E-14;
* @return {boolean} true if this ScreenRect has zero width or height
*/
ScreenRect.prototype.isEmpty = function(opt_tol) {
  var tol = opt_tol || 1E-14;
  return this.width_ < tol || this.height_ < tol;
};

/** Creates an oval path in the Canvas context, with the size of this ScreenRect.
@param {!CanvasRenderingContext2D} context the Canvas context to draw into
*/
ScreenRect.prototype.makeOval = function(context) {
    var w = this.width_/2;
    var h = this.height_/2;
  if (goog.isFunction(context.ellipse)) {
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
ScreenRect.prototype.makeRect = function(context) {
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
ScreenRect.prototype.nearEqual = function(otherRect, opt_tolerance) {
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

});  // goog.scope
