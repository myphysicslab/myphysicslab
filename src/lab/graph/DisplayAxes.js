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

goog.module('myphysicslab.lab.graph.DisplayAxes');

const CoordMap = goog.require('myphysicslab.lab.view.CoordMap');
const DisplayObject = goog.require('myphysicslab.lab.view.DisplayObject');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

/** Draws linear horizontal and vertical axes within a given simulation coordinates
rectangle. The simulation rectangle determines where the axes are drawn, and the
numbering scale shown, see {@link #setSimRect}.

Axes are drawn with numbered tick marks. Axes are labeled with
names which can be specified by {@link #setHorizName} and {@link #setVerticalName}. Axes
are drawn using specified font and color, see {@link #setColor} and {@link #setFont}.

Options exist for drawing the vertical axis near the left, center, or right, and for
drawing the horizontal axis near the top, center, or bottom of the screen. See
{@link #setXAxisAlignment} and {@link #setYAxisAlignment}.

You can set the axes alignment to go thru particular points, like the origin:

    axes.setXAxisAlignment(VerticalAlign.VALUE, 0);
    axes.setYAxisAlignment(HorizAlign.VALUE, 0);

To keep the DisplayAxes in sync with a {@link myphysicslab.lab.view.LabView}, when
doing for example pan/zoom of the LabView, you can arrange for {@link #setSimRect} to
be called by an Observer. See for example
{@link myphysicslab.sims.common.CommonControls#makeAxes} which makes a
{@link myphysicslab.lab.util.GenericObserver} that keeps the DisplayAxes in sync with
the LabView.

@todo  add option to set the number of tick marks (instead of automatic)?

* @implements {DisplayObject}
*/
class DisplayAxes {
/**
* @param {DoubleRect=} opt_simRect the area to draw axes for in
  simulation coordinates.
* @param {string=} opt_font the Font to draw numbers and names of axes with
* @param {string=} opt_color the Color to draw the axes with
*/
constructor(opt_simRect, opt_font, opt_color) {
  /** bounds rectangle of area to draw
  * @type {!DoubleRect}
  * @private
  */
  this.simRect_ = opt_simRect || DoubleRect.EMPTY_RECT;
  /** the font to use for drawing numbers and text on the axis
  * Oct 2014: increased from 10pt to 14pt because standard canvas is now larger
  * @type {string}
  * @private
  */
  this.numFont_ = opt_font || '14pt sans-serif';
  /** the color to draw the axes with
  * @type {string}
  * @private
  */
  this.drawColor_ = opt_color || 'gray';
  /**  Font descent in pixels (guesstimate).
  * @todo find a way to get this for the current font, similar to the
  * TextMetrics object.
  * http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript
  * http://pomax.nihongoresources.com/pages/Font.js/
  * @type {number}
  */
  this.fontDescent = 8;
  /**  Font ascent in pixels (guesstimate).
  * @type {number}
  */
  this.fontAscent = 12;
  /** The number on vertical axis to align with when using VerticalAlign.VALUE
  * @type {number}
  */
  this.horizAlignValue_ = 0;
  /** location of the horizontal axis
  * @type {!VerticalAlign}
  * @private
  */
  this.horizAxisAlignment_ = VerticalAlign.VALUE;
  /** The number on horizontal axis to align with when using HorizAlign.VALUE
  * @type {number}
  */
  this.vertAlignValue_ = 0;
  /** location of the vertical axis
  * @type {!HorizAlign}
  * @private
  */
  this.vertAxisAlignment_ = HorizAlign.VALUE;
  /**  Number of fractional decimal places to show.
  * @type {number}
  * @private
  */
  this.numDecimal_ = 0;
  /** set when this needs to be redrawn
  * @type {boolean}
  * @private
  */
  this.needRedraw_ = true;
  /** name of horizontal axis
  * @type {string}
  * @private
  */
  this.horizName_ = 'x';
  /** name of vertical axis
  * @type {string}
  * @private
  */
  this.verticalName_ = 'y';
  /**
  * @type {number}
  */
  this.zIndex = 100;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', horizAxisAlignment_: '+this.horizAxisAlignment_
      +', vertAxisAlignment_: '+this.vertAxisAlignment_
      +', this.horizAlignValue_: '+Util.NF(this.horizAlignValue_)
      +', this.vertAlignValue_: '+Util.NF(this.vertAlignValue_)
      +', drawColor_: "'+this.drawColor_+'"'
      +', numFont_: "'+this.numFont_+'"'
      +', simRect_: '+this.simRect_
      +', zIndex: '+this.zIndex
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'DisplayAxes{horizName_: "'+this.horizName_
      +'", verticalName_: "'+this.verticalName_+'"}';
};

/** @override */
contains(point) {
  return false;
};

/** @override */
draw(context, map) {
  //Draws both horizontal and vertical axes, getting the size of the axes from the
  //simulation rectangle
  context.save();
  context.strokeStyle = this.drawColor_;
  context.fillStyle = this.drawColor_;
  context.font = this.numFont_;
  context.textAlign = 'start';
  context.textBaseline = 'alphabetic';
  // figure where to draw axes
  var x0, y0;  // screen coords of axes, the point where the axes intersect
  var r = this.simRect_;
  var sim_x1 = r.getLeft();
  var sim_x2 = r.getRight();
  var sim_y1 = r.getBottom();
  var sim_y2 = r.getTop();
  var sim_right = sim_x2 - 0.06*(sim_x2 - sim_x1);
  var sim_left = sim_x1 + 0.01*(sim_x2 - sim_x1);
  switch (this.vertAxisAlignment_) {
    case HorizAlign.VALUE:
      // if the value is not visible, then use RIGHT or LEFT alignment
      var sim_v = this.vertAlignValue_;
      if (sim_v < sim_left) {
        sim_v = sim_left;
      } else if (sim_v > sim_right) {
        sim_v = sim_right;
      }
      x0 = map.simToScreenX(sim_v);
      break;
    case HorizAlign.RIGHT:
      x0 = map.simToScreenX(sim_right);
      break;
    case HorizAlign.LEFT:
      x0 = map.simToScreenX(sim_left);
      break;
    default:
      x0 = map.simToScreenX(r.getCenterX());
  }

  var scr_top = map.simToScreenY(sim_y2);
  var scr_bottom = map.simToScreenY(sim_y1);
  var lineHeight = 10 + this.fontDescent + this.fontAscent;
  // leave room to draw the numbers below the horizontal axis
  switch (this.horizAxisAlignment_) {
    case VerticalAlign.VALUE:
      // if the value is not visible, then use TOP or BOTTOM alignment
      y0 = map.simToScreenY(this.horizAlignValue_);
      if (y0 < scr_top + lineHeight) {
        y0 = scr_top + lineHeight;
      } else if (y0 > scr_bottom - lineHeight) {
        y0 = scr_bottom - lineHeight;
      }
      break;
    case VerticalAlign.TOP:
      y0 = scr_top + lineHeight;
      break;
    case VerticalAlign.BOTTOM:
      y0 = scr_bottom - lineHeight;
      break;
    default:
      y0 = map.simToScreenY(r.getCenterY());
  }
  // draw horizontal axis
  context.beginPath();
  context.moveTo(map.simToScreenX(sim_x1), y0);
  context.lineTo(map.simToScreenX(sim_x2), y0);
  context.stroke();
  this.drawHorizTicks(y0, context, map, this.simRect_);
  // draw vertical axis
  context.beginPath();
  context.moveTo(x0, map.simToScreenY(sim_y1));
  context.lineTo(x0, map.simToScreenY(sim_y2));
  context.stroke();
  this.drawVertTicks(x0, context, map, this.simRect_);
  context.restore();
  this.needRedraw_ = false;
};

/** Draws the tick marks for the horizontal axis.
@param {number} y0 the vertical placement of the horizontal axis, in screen coords
@param {!CanvasRenderingContext2D} context the canvas's context to draw into
@param {!CoordMap} map the mapping to use for translating
    between simulation and screen coordinates
@param {!DoubleRect} r the view area in simulation coords
@private
*/
drawHorizTicks(y0, context, map, r) {
  var y1 = y0 - 4;  // bottom edge of tick mark
  var y2 = y1 + 8;  // top edge of tick mark
  var sim_x1 = r.getLeft();
  var sim_x2 = r.getRight();
  var graphDelta = this.getNiceIncrement(sim_x2 - sim_x1);
  var x_sim = DisplayAxes.getNiceStart(sim_x1, graphDelta);
  while (x_sim < sim_x2) {
    var x_screen = map.simToScreenX(x_sim);
    context.beginPath(); // draw a tick mark
    context.moveTo(x_screen, y1);
    context.lineTo(x_screen, y2);
    context.stroke();
    var next_x_sim = x_sim + graphDelta;  // next tick mark location
    if (next_x_sim > x_sim) {
      // draw a number
      var s = x_sim.toFixed(this.numDecimal_);
      var textWidth = context.measureText(s).width;
      //console.log('drawHorizTicks s='+s+' tx-width='+textWidth
      //  +' x='+(x_screen - textWidth/2)
      //  +' y='+(y2 + this.fontAscent));
      context.fillText(s, x_screen - textWidth/2, y2 + this.fontAscent);
    } else {
      // This can happen when the range is tiny compared to the numbers
      // for example:  x_sim = 6.5 and graphDelta = 1E-15.
      //console.log('scale is too small');
      context.fillText('scale is too small', x_screen, y2 + this.fontAscent);
      break;
    }
    x_sim = next_x_sim;
  }
  // draw name of the horizontal axis
  var w = context.measureText(this.horizName_).width;
  //console.log('drawHorizName '+hname
  //  +' x='+(map.simToScreenX(sim_x2) - w - 5)
  //  +' y='+(y0 - 8));
  context.fillText(this.horizName_, map.simToScreenX(sim_x2) - w - 5,   y0 - 8);
};

/** Draws the tick marks for the vertical axis.
@param {number} x0 the horizontal placement of the vertical axis, in screen coords
@param {!CanvasRenderingContext2D} context the canvas's context to draw into
@param {!CoordMap} map the mapping to use for translating
    between simulation and screen coordinates
@param {!DoubleRect} r the view area in simulation coords
@private
*/
drawVertTicks(x0, context, map, r) {
  var x1 = x0 - 4;  // left edge of tick mark
  var x2 = x1 + 8;  // right edge of tick mark
  var sim_y1 = r.getBottom();
  var sim_y2 = r.getTop();
  var graphDelta = this.getNiceIncrement(sim_y2 - sim_y1);
  var y_sim = DisplayAxes.getNiceStart(sim_y1, graphDelta);
  while (y_sim < sim_y2) {
    var y_screen = map.simToScreenY(y_sim);
    context.beginPath(); // draw a tick mark
    context.moveTo(x1, y_screen);
    context.lineTo(x2, y_screen);
    context.stroke();
    var next_y_sim = y_sim + graphDelta;
    if (next_y_sim > y_sim) {
      // draw a number
      var s = y_sim.toFixed(this.numDecimal_);
      var textWidth = context.measureText(s).width;
      if (this.vertAxisAlignment_ === HorizAlign.RIGHT) {
        context.fillText(s, x2-(textWidth+10), y_screen+(this.fontAscent/2));
      } else {// LEFT is default
        context.fillText(s, x2+5, y_screen+(this.fontAscent/2));
      }
    } else {
      // This can happen when the range is tiny compared to the numbers
      // for example:  y_sim = 6.5 and graphDelta = 1E-15.
      context.fillText('scale is too small', x2, y_screen);
      break;
    }
    y_sim = next_y_sim;  // next tick mark
  }
  // draw name of the vertical axis
  var w = context.measureText(this.verticalName_).width;
  if (this.vertAxisAlignment_ === HorizAlign.RIGHT) {
    context.fillText(this.verticalName_, x0 - (w+6), map.simToScreenY(sim_y2) + 13);
  } else { // LEFT is default
    context.fillText(this.verticalName_, x0 + 6, map.simToScreenY(sim_y2) + 13);
  }
};

/** Returns the color to draw the graph axes with.
@return {string} the color to draw the graph axes with
*/
getColor() {
  return this.drawColor_;
};

/** Returns the font to draw the graph axes with.
@return {string} the font to draw the graph axes with
*/
getFont() {
  return this.numFont_;
};

/** Returns the name shown next to the horizontal axis.
@return {string} the name of the horizontal axis.
*/
getHorizName() {
  return this.horizName_;
};

/** @override */
getMassObjects() {
  return [];
};

/** Returns an increment to use for spacing of tick marks on an axis.
The increment should be a 'round' number, with few fractional decimal places.
It should divide the given range into around 5 to 7 pieces.

Side effect: modifies the number of fractional digits to show

@param {number} range the span of the axis
@return {number} an increment to use for spacing of tick marks on an axis.
@private
*/
getNiceIncrement(range) {
  // First, scale the range to within 1 to 10.
  var power = Math.pow(10, Math.floor(Math.log(range)/Math.LN10));
  var logTot = range/power;
  // logTot should be in the range from 1.0 to 9.999
  var incr;
  if (logTot >= 8)
    incr = 2;
  else if (logTot >= 5)
    incr = 1;
  else if (logTot >= 3)
    incr = 0.5;
  else if (logTot >= 2)
    incr = 0.4;
  else
    incr = 0.2;
  incr *= power;  // scale back to original range
  // setup for nice formatting of numbers in this range
  var dlog = Math.log(incr)/Math.LN10;
  this.numDecimal_ = (dlog < 0) ? Math.ceil(-dlog) : 0;
  return incr;
};

/** Returns the starting value for the tick marks on an axis.
@param {number} start  the lowest value on the axis
@param {number} incr  the increment between tick marks on the axis
@return {number} the starting value for the tick marks on the axis.
@private
*/
static getNiceStart(start, incr) {
  // gives the first nice increment just greater than the starting number
  return Math.ceil(start/incr)*incr;
};

/** @override */
getPosition() {
  return Vector.ORIGIN;
};

/** @override */
getSimObjects() {
  return [];
};

/** Returns the bounding rectangle for this DisplayAxes in simulation coordinates,
which determines the numbering scale shown.
@return {!DoubleRect} the bounding rectangle for this
    DisplayAxes in simulation coordinates.
*/
getSimRect() {
  return this.simRect_;
};

/** Returns the name shown next to the vertical axis.
@return {string} the name of the vertical axis.
*/
getVerticalName() {
  return this.verticalName_;
};

/** Returns the X-axis alignment: whether it should appear at bottom, top or middle of
the simulation rectangle.
@return {!VerticalAlign} X-axis alignment option from {@link VerticalAlign}
*/
getXAxisAlignment() {
  return this.horizAxisAlignment_;
};

/** Returns the Y-axis alignment : whether it should appear at left, right or middle of
the simulation rectangle.
@return {!HorizAlign} Y-axis alignment option from {@link HorizAlign}
*/
getYAxisAlignment() {
  return this.vertAxisAlignment_;
};

/** @override */
getZIndex() {
  return this.zIndex;
};

/** @override */
isDragable() {
  return false;
};

/** Whether this DisplayAxes has changed since the last time it was drawn.
@return {boolean} true when this DisplayAxes has changed since the last time
    draw was called.
*/
needsRedraw() {
  return this.needRedraw_;
};

/** Set the color to draw the graph axes with.
@param {string} color the color to draw the graph axes with
*/
setColor(color) {
  this.drawColor_ = color;
  this.needRedraw_ = true;
};

/** @override */
setDragable(dragable) {
};

/** Set the font to draw the graph axes with.
@param {string} font the font to draw the graph axes with
*/
setFont(font) {
  this.numFont_ = font;
  this.needRedraw_ = true;
};

/** Sets the name shown next to the horizontal axis
@param {string} name name of the horizontal axis
*/
setHorizName(name) {
  this.horizName_ = name;
  this.needRedraw_ = true;
};

/** @override */
setPosition(position) {
};

/** Sets the bounding rectangle for this DisplayAxes in simulation coordinates; this
determines the numbering scale shown.
@param {!DoubleRect} simRect the bounding rectangle for this
    DisplayAxes in simulation coordinates.
*/
setSimRect(simRect) {
  this.simRect_ = simRect;
  this.needRedraw_ = true;
};

/** Sets the name shown next to the vertical axis
@param {string} name name of the vertical axis
*/
setVerticalName(name) {
  this.verticalName_ = name;
  this.needRedraw_ = true;
};

/** Sets the X-axis alignment: whether it should appear at bottom, top or middle of the
simulation rectangle, or go thru a particular value of the Y-axis.
@param {!VerticalAlign} alignment X-axis alignment option from {@link VerticalAlign}
@param {number=} value number on vertical axis to align with when using
     {@link VerticalAlign.VALUE}
@return {!DisplayAxes} this object for chaining setters
*/
setXAxisAlignment(alignment, value) {
  this.horizAxisAlignment_ = alignment;
  if (goog.isNumber(value)) {
    this.horizAlignValue_ = value;
  }
  this.needRedraw_ = true;
  return this;
};

/** Sets the Y-axis alignment: whether it should appear at left, right or middle of the
simulation rectangle, or go thru a particular value of the X-axis.
@param {!HorizAlign} alignment Y-axis alignment option from {@link HorizAlign}
@param {number=} value number on horizontal axis to align with when using
     {@link HorizAlign.VALUE}
@return {!DisplayAxes} this object for chaining setters
*/
setYAxisAlignment(alignment, value) {
  this.vertAxisAlignment_ = alignment;
  if (goog.isNumber(value)) {
    this.vertAlignValue_ = value;
  }
  this.needRedraw_ = true;
  return this;
};

/** @override */
setZIndex(zIndex) {
  if (goog.isDef(zIndex)) {
    this.zIndex = zIndex;
  }
};

} // end class
exports = DisplayAxes;
