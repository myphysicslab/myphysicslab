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

goog.provide('myphysicslab.lab.view.DisplayArc');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.model.Arc');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayObject');

goog.scope(function() {

var Arc = myphysicslab.lab.model.Arc;
var DisplayObject = myphysicslab.lab.view.DisplayObject;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var SimObject = myphysicslab.lab.model.SimObject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Displays a {@link myphysicslab.lab.model.Arc}.

* @param {?Arc=} arc the Arc to display
* @param {?DisplayArc=} proto the prototype DisplayArc to inherit
*    properties from
* @constructor
* @final
* @struct
* @implements {DisplayObject}
*/
myphysicslab.lab.view.DisplayArc = function(arc, proto) {
  /**
  * @type {?Arc}
  * @private
  */
  this.arc_ = goog.isDefAndNotNull(arc) ? arc : null;
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
  this.proto_ = goog.isDefAndNotNull(proto) ? proto : null;
};
var DisplayArc = myphysicslab.lab.view.DisplayArc;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayArc.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', thickness: '+NF(this.getThickness())
        +', arrowHeadLength: '+NF(this.getArrowHeadLength())
        +', color: "'+this.getColor()+'"'
        +', lineDash: ['+this.getLineDash()+']'
        +', zIndex: '+this.getZIndex()
        +'}';
  };

  /** @inheritDoc */
  DisplayArc.prototype.toStringShort = function() {
    return 'DisplayArc{arc_: '+
        (this.arc_ != null ? this.arc_.toStringShort() : 'null')+'}';
  };
};

/** @inheritDoc */
DisplayArc.prototype.contains = function(point) {
  return false;
};

/** @inheritDoc */
DisplayArc.prototype.draw = function(context, map) {
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
DisplayArc.prototype.getArrowHeadLength = function() {
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
DisplayArc.prototype.getColor = function() {
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
DisplayArc.prototype.getLineDash = function() {
  if (this.lineDash_ !== undefined) {
    return this.lineDash_;
  } else if (this.proto_ != null) {
    return this.proto_.getLineDash();
  } else {
    return [3, 5];
  }
};

/** @inheritDoc */
DisplayArc.prototype.getMassObjects = function() {
  return [ ];
};

/** @inheritDoc */
DisplayArc.prototype.getPosition = function() {
  // return midpoint of the line
  return this.arc_ == null ? Vector.ORIGIN : this.arc_.getCenter();
};

/** @inheritDoc */
DisplayArc.prototype.getSimObjects = function() {
  return this.arc_ == null ? [ ] : [ this.arc_ ];
};

/** Thickness to use when drawing the arc, in screen coordinates, so a unit
* is a screen pixel.
* @return {number}
*/
DisplayArc.prototype.getThickness = function() {
  if (this.thickness_ !== undefined) {
    return this.thickness_;
  } else if (this.proto_ != null) {
    return this.proto_.getThickness();
  } else {
    return 4.0;
  }
};

/** @inheritDoc */
DisplayArc.prototype.getZIndex = function() {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else if (this.proto_ != null) {
    return this.proto_.getZIndex();
  } else {
    return 0;
  }
};

/** @inheritDoc */
DisplayArc.prototype.isDragable = function() {
  return false;
};

/** Length of arrowhead, in simulation coordinates.
* @param {number|undefined} value
* @return {!DisplayArc} this object for chaining setters
*/
DisplayArc.prototype.setArrowHeadLength = function(value) {
  this.arrowHeadLength_ = value;
  return this;
};

/** Color used when drawing the arc, a CSS3 color value.
* @param {string|undefined} value
* @return {!DisplayArc} this object for chaining setters
*/
DisplayArc.prototype.setColor = function(value) {
  this.color_ = value;
  return this;
};

/** @inheritDoc */
DisplayArc.prototype.setDragable = function(dragable) {
  // does nothing
};

/** Line dash array used when drawing the arc.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid arc.
* @param {!Array<number>|undefined} value
* @return {!DisplayArc} this object for chaining setters
*/
DisplayArc.prototype.setLineDash = function(value) {
  this.lineDash_ = value;
  return this;
};

/** @inheritDoc */
DisplayArc.prototype.setPosition = function(position) {
  // does nothing
};

/** Thickness to use when drawing the arc, in screen coordinates, so a unit
* is a screen pixel.
* @param {number|undefined} value
* @return {!DisplayArc} this object for chaining setters
*/
DisplayArc.prototype.setThickness = function(value) {
  this.thickness_ = value;
  return this;
};

/** @inheritDoc */
DisplayArc.prototype.setZIndex = function(value) {
  this.zIndex_ = value;
};

});  // goog.scope
