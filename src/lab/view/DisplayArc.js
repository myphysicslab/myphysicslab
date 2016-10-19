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

var DisplayObject = myphysicslab.lab.view.DisplayObject;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var SimObject = myphysicslab.lab.model.SimObject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Displays a {@link myphysicslab.lab.model.Arc}.

* @param {!myphysicslab.lab.model.Arc} arc the Arc to display
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.DisplayObject}
*/
myphysicslab.lab.view.DisplayArc = function(arc) {
  /**
  * @type {!myphysicslab.lab.model.Arc}
  * @private
  */
  this.arc_ = arc;
  /** Color used when drawing the line, a CSS3 color value.
  * @type {string}
  */
  this.color = DisplayArc.color;
  /** Thickness to use when drawing the line, in screen coordinates, so a unit
  * is a screen pixel.
  * @type {number}
  */
  this.thickness = DisplayArc.thickness;
  /** Line dash array used when drawing the line.  Corresponds to lengths of dashes
  * and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
  * length 3 with spaces of length 5. Empty array indicates solid line.
  * @type {!Array<number>}
  */
  this.lineDash = DisplayArc.lineDash;
  /** Length of arrowhead
  * @type {number}
  */
  this.arrowHeadLength = 0.2;
};
var DisplayArc = myphysicslab.lab.view.DisplayArc;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayArc.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', thickness: '+NF(this.thickness)
        +', color: "'+this.color+'"'
        +'}';
  };

  /** @inheritDoc */
  DisplayArc.prototype.toStringShort = function() {
    return 'DisplayArc{arc_: '+this.arc_.toStringShort()+'}';
  };
};

/** Default value for {@link #color}, used when creating a DisplayArc.
* @type {string}
*/
DisplayArc.color = 'black';

/** Default value for {@link #lineDash}, used when creating a DisplayArc.
* @type {!Array<number>}
*/
DisplayArc.lineDash = [3, 5];

/** Default value for {@link #thickness}, used when creating a DisplayArc.
* @type {number}
*/
DisplayArc.thickness = 1.0;

/**  Sets the defaults to match the given DisplayArc.
* @param {!myphysicslab.lab.view.DisplayArc} dispObj the DisplayArc to get style from
*/
DisplayArc.setStyle = function(dispObj) {
  DisplayArc.color = dispObj.color;
  DisplayArc.thickness = dispObj.thickness;
  DisplayArc.lineDash = dispObj.lineDash;
};

/** @inheritDoc */
DisplayArc.prototype.contains = function(point) {
  return false;
};

/** @inheritDoc */
DisplayArc.prototype.draw = function(context, map) {
  var centerX = map.simToScreenX(this.arc_.getCenter().getX());
  var centerY = map.simToScreenY(this.arc_.getCenter().getY());
  // assumption: x & y are scaled same
  var r = map.simToScreenScaleX(this.arc_.getRadius());
  var angle = this.arc_.getAngle();

  if ((angle != 0) && (r > 0))  {
    context.save();
    context.lineWidth = this.thickness;
    context.strokeStyle = this.color;
    if (this.lineDash.length > 0 && context.setLineDash) {
      context.setLineDash(this.lineDash);
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

    var h = Math.min(this.arrowHeadLength, 0.5*this.arc_.getRadius());
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

/** @inheritDoc */
DisplayArc.prototype.getMassObjects = function() {
  return [ ];
};

/** @inheritDoc */
DisplayArc.prototype.getPosition = function() {
  // return midpoint of the line
  return this.arc_.getCenter();
};

/** @inheritDoc */
DisplayArc.prototype.getSimObjects = function() {
  return [ this.arc_ ];
};

/** @inheritDoc */
DisplayArc.prototype.isDragable = function() {
  return false;
};

/** @inheritDoc */
DisplayArc.prototype.setDragable = function(dragable) {
  // does nothing
};

/** @inheritDoc */
DisplayArc.prototype.setPosition = function(position) {
  // does nothing
};

});  // goog.scope
