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

goog.module('myphysicslab.lab.view.DisplayLine');

goog.require('goog.asserts');

const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const DisplayObject = goog.require('myphysicslab.lab.view.DisplayObject');
const Line = goog.require('myphysicslab.lab.model.Line');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Displays a {@link Line} as a colored line.

The position is determined by the position of the Line, so {@link #setPosition}
has no effect, and the DisplayLine is never dragable.
The position is reported as the midpoint of the Line by {@link #getPosition}.

* @implements {DisplayObject}
*/
class DisplayLine {
/**
* @param {?Line=} line the Line to display
* @param {?DisplayLine=} proto the prototype DisplayLine to inherit properties from
*/
constructor(line, proto) {
  /**
  * @type {!Line}
  * @private
  */
  this.line_ = goog.isDefAndNotNull(line) ? line : new ConcreteLine('proto');
  /** Color used when drawing the line, a CSS3 color value.
  * @type {string|undefined}
  * @private
  */
  this.color_;
  /** Thickness to use when drawing the line, in screen coordinates, so a unit
  * is a screen pixel.
  * @type {number|undefined}
  * @private
  */
  this.thickness_;
  /** Line dash array used when drawing the line.  Corresponds to lengths of dashes
  * and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
  * length 3 with spaces of length 5. Empty array indicates solid line.
  * @type {!Array<number>|undefined}
  * @private
  */
  this.lineDash_;
  /**
  * @type {number|undefined}
  * @private
  */
  this.zIndex_;
  /**
  * @type {?DisplayLine}
  * @private
  */
  this.proto_ = goog.isDefAndNotNull(proto) ? proto : null;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', thickness: '+Util.NF(this.getThickness())
      +', color: "'+this.getColor()+'"'
      +', lineDash: ['+this.getLineDash()+']'
      +', zIndex: '+this.getZIndex()
      +', proto: '+(this.proto_ != null ? this.proto_.toStringShort() : 'null')
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'DisplayLine{line_: '+this.line_.toStringShort()+'}';
};

/** @override */
contains(point) {
  return false;
};

/** @override */
draw(context, map) {
  var thickness = this.getThickness();
  if (thickness > 0) {
    var p1 = map.simToScreen(this.line_.getStartPoint());
    var p2 = map.simToScreen(this.line_.getEndPoint());
    var len = p1.distanceTo(p2);
    if (len < 1e-6)
      return;
    context.save()
    var lineDash = this.getLineDash();
    if (lineDash.length > 0 && context.setLineDash) {
      context.setLineDash(lineDash);
    }
    context.lineWidth = this.getThickness();
    context.strokeStyle = this.getColor();
    context.beginPath();
    context.moveTo(p1.getX(), p1.getY());
    context.lineTo(p2.getX(), p2.getY());
    context.stroke();
    context.restore();
  }
};

/** Color used when drawing the line, a CSS3 color value.
* @return {string}
*/
getColor() {
  if (this.color_ !== undefined) {
    return this.color_;
  } else if (this.proto_ != null) {
    return this.proto_.getColor();
  } else {
    return 'gray';
  }
};

/** Line dash array used when drawing the line.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid line.
* @return {!Array<number>}
*/
getLineDash() {
  if (this.lineDash_ !== undefined) {
    return this.lineDash_;
  } else if (this.proto_ != null) {
    return this.proto_.getLineDash();
  } else {
    return [ ];
  }
};

/** @override */
getMassObjects() {
  return [ ];
};

/** @override */
getPosition() {
  // return midpoint of the line
  return this.line_.getStartPoint().add(this.line_.getEndPoint()).multiply(0.5);
};

/** @override */
getSimObjects() {
  return [ this.line_ ];
};

/** Thickness to use when drawing the line, in screen coordinates, so a unit
* is a screen pixel. Line will appear only with positive thickness.
* Can be set to zero to make the line disappear.
* @return {number}
*/
getThickness() {
  if (this.thickness_ !== undefined) {
    return this.thickness_;
  } else if (this.proto_ != null) {
    return this.proto_.getThickness();
  } else {
    return 4.0;
  }
};

/** @override */
getZIndex() {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else if (this.proto_ != null) {
    return this.proto_.getZIndex();
  } else {
    return 0;
  }
};

/** @override */
isDragable() {
  return false;
};

/** Color used when drawing the line, a CSS3 color value.
* @param {string|undefined} color
* @return {!DisplayLine} this object for chaining setters
*/
setColor(color) {
  this.color_ = color;
  return this;
};

/** @override */
setDragable(dragable) {
  // does nothing
};

/** Line dash array used when drawing the line.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid line.
* @param {!Array<number>|undefined} lineDash
* @return {!DisplayLine} this object for chaining setters
*/
setLineDash(lineDash) {
  this.lineDash_ = lineDash;
  return this;
};

/** @override */
setPosition(position) {
};

/** Thickness to use when drawing the line, in screen coordinates, so a unit
* is a screen pixel. Line will appear only with positive thickness.
* Can be set to zero to make the line disappear.
* @param {number|undefined} thickness
* @return {!DisplayLine} this object for chaining setters
*/
setThickness(thickness) {
  this.thickness_ = thickness;
  return this;
};

/** @override */
setZIndex(zIndex) {
  this.zIndex_ = zIndex;
};

} //end class
exports = DisplayLine;
