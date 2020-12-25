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

goog.module('myphysicslab.lab.view.DisplayArc');

goog.require('goog.asserts');

const Arc = goog.require('myphysicslab.lab.model.Arc');
const DisplayObject = goog.require('myphysicslab.lab.view.DisplayObject');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Displays a {@link myphysicslab.lab.model.Arc}.

* @implements {DisplayObject}
*/
class DisplayArc {
/**
* @param {?Arc=} arc the Arc to display
* @param {?DisplayArc=} proto the prototype DisplayArc to inherit properties from
*/
constructor(arc, proto) {
  /**
  * @type {?Arc}
  * @private
  */
  this.arc_ = arc != null ? arc : null;
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
  /** Length of arrowhead
  * @type {number|undefined}
  * @private
  */
  this.arrowHeadLength_;
  /**
  * @type {number|undefined}
  * @private
  */
  this.zIndex_;
  /**
  * @type {?DisplayArc}
  * @private
  */
  this.proto_ = proto != null ? proto : null;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', thickness: '+Util.NF(this.getThickness())
      +', arrowHeadLength: '+Util.NF(this.getArrowHeadLength())
      +', color: "'+this.getColor()+'"'
      +', lineDash: ['+this.getLineDash()+']'
      +', zIndex: '+this.getZIndex()
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'DisplayArc{arc_: '+
      (this.arc_ != null ? this.arc_.toStringShort() : 'null')+'}';
};

/** @override */
contains(point) {
  return false;
};

/** @override */
draw(context, map) {
  if (this.arc_ == null) {
    return;
  }
  var centerX = map.simToScreenX(this.arc_.getCenter().getX());
  var centerY = map.simToScreenY(this.arc_.getCenter().getY());
  // assumption: x & y are scaled same
  var r = map.simToScreenScaleX(this.arc_.getRadius());
  var angle = this.arc_.getAngle();

  if ((angle != 0) && (r > 0))  {
    context.save();
    context.lineWidth = this.getThickness();
    context.strokeStyle = this.getColor();
    var lineDash = this.getLineDash();
    if (lineDash.length > 0 && context.setLineDash) {
      context.setLineDash(lineDash);
    }
    var startAngle = -this.arc_.getStartAngle();
    // Canvas.arc uses 'angle increases clockwise' convention, therefore subtract angle.
    var endAngle = -(this.arc_.getStartAngle() + angle);
    context.beginPath();
    context.arc(centerX, centerY, r, startAngle, endAngle, /*anticlockwise=*/angle > 0);
    context.stroke();
    // arrowhead
    // find tip of arrowhead
    var x,y;
    var a0, a1, a;  // startangle & angle in radians
    a0 = this.arc_.getStartAngle();
    a1 = this.arc_.getAngle();
    a = -(a0 + a1);
    x = this.arc_.getCenter().getX() + this.arc_.getRadius()*Math.cos(a);
    y = this.arc_.getCenter().getY() - this.arc_.getRadius()*Math.sin(a);

    var h = Math.min(this.getArrowHeadLength(), 0.5*this.arc_.getRadius());
    if (a1 > 0) {
      h = -h;
    }

    // find endpoint of first arrowhead, and draw it
    var xp, yp;
    xp = x - h*Math.cos(Math.PI/2 + a - Math.PI/6);
    yp = y + h*Math.sin(Math.PI/2 + a - Math.PI/6);
    var x1 = map.simToScreenX(x);
    var y1 = map.simToScreenY(y);
    var x2 = map.simToScreenX(xp);
    var y2 = map.simToScreenY(yp);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();

    // find endpoint of 2nd arrowhead, and draw it
    xp = x - h*Math.cos(Math.PI/2 + a + Math.PI/6);
    yp = y + h*Math.sin(Math.PI/2 + a + Math.PI/6);
    x2 = map.simToScreenX(xp);
    y2 = map.simToScreenY(yp);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.restore();
  }
};

/** Length of arrowhead, in simulation coordinates.
* @return {number}
*/
getArrowHeadLength() {
  if (this.arrowHeadLength_ !== undefined) {
    return this.arrowHeadLength_;
  } else if (this.proto_ != null) {
    return this.proto_.getArrowHeadLength();
  } else {
    return 0.2;
  }
};

/** Color used when drawing the arc, a CSS3 color value.
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

/** Line dash array used when drawing the arc.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid arc.
* @return {!Array<number>}
*/
getLineDash() {
  if (this.lineDash_ !== undefined) {
    return this.lineDash_;
  } else if (this.proto_ != null) {
    return this.proto_.getLineDash();
  } else {
    return [3, 5];
  }
};

/** @override */
getMassObjects() {
  return [ ];
};

/** @override */
getPosition() {
  // return midpoint of the line
  return this.arc_ == null ? Vector.ORIGIN : this.arc_.getCenter();
};

/** @override */
getSimObjects() {
  return this.arc_ == null ? [ ] : [ this.arc_ ];
};

/** Thickness to use when drawing the arc, in screen coordinates, so a unit
* is a screen pixel.
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

/** Length of arrowhead, in simulation coordinates.
* @param {number|undefined} value
* @return {!DisplayArc} this object for chaining setters
*/
setArrowHeadLength(value) {
  this.arrowHeadLength_ = value;
  return this;
};

/** Color used when drawing the arc, a CSS3 color value.
* @param {string|undefined} value
* @return {!DisplayArc} this object for chaining setters
*/
setColor(value) {
  this.color_ = value;
  return this;
};

/** @override */
setDragable(dragable) {
  // does nothing
};

/** Line dash array used when drawing the arc.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid arc.
* @param {!Array<number>|undefined} value
* @return {!DisplayArc} this object for chaining setters
*/
setLineDash(value) {
  this.lineDash_ = value;
  return this;
};

/** @override */
setPosition(position) {
  // does nothing
};

/** Thickness to use when drawing the arc, in screen coordinates, so a unit
* is a screen pixel.
* @param {number|undefined} value
* @return {!DisplayArc} this object for chaining setters
*/
setThickness(value) {
  this.thickness_ = value;
  return this;
};

/** @override */
setZIndex(value) {
  this.zIndex_ = value;
};

} // end class
exports = DisplayArc;
