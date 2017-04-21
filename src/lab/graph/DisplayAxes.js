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

goog.provide('myphysicslab.lab.graph.DisplayAxes');

goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.VerticalAlign');

goog.scope(function() {

var CoordMap = myphysicslab.lab.view.CoordMap;
var DisplayObject = myphysicslab.lab.view.DisplayObject;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var HorizAlign = myphysicslab.lab.view.HorizAlign;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;
var VerticalAlign = myphysicslab.lab.view.VerticalAlign;

/** Draws linear horizontal and vertical axes within a given simulation coordinates
rectangle. The simulation rectangle determines where the axes are drawn, and the
numbering scale shown, see {@link #setSimRect}.

Axes are drawn with numbered tick marks. Axes are labeled with
names which can be specified by {@link #setHorizName} and {@link #setVerticalName}. Axes
are drawn using specified font and color, see {@link #setColor} and {@link #setFont}.

Options exist for drawing the vertical axis near the left, center, or right, and for
drawing the horizontal axis near the top, center, or bottom of the screen. See
{@link #setXAxisAlignment} and {@link #setYAxisAlignment}.

To keep the DisplayAxes in sync with a {@link myphysicslab.lab.view.LabView}, when
doing for example pan/zoom of the LabView, you can arrange for {@link #setSimRect} to
be called by an Observer. See for example
{@link myphysicslab.sims.common.CommonControls#makeAxes} which makes a
{@link myphysicslab.lab.util.GenericObserver} that keeps the DisplayAxes in sync with
the LabView.

@todo  add option to set the number of tick marks (instead of automatic)?

* @param {myphysicslab.lab.util.DoubleRect=} opt_simRect the area to draw axes for in
  simulation coordinates.
* @param {string=} opt_font the Font to draw numbers and names of axes with
* @param {string=} opt_color the Color to draw the axes with
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.DisplayObject}
*/
myphysicslab.lab.graph.DisplayAxes = function(opt_simRect, opt_font, opt_color) {
  /** bounds rectangle of area to draw
  * @type {!myphysicslab.lab.util.DoubleRect}
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
  /** location of the horizontal axis, default value is BOTTOM
  * @type {!myphysicslab.lab.view.VerticalAlign}
  * @private
  */
  this.horizAxisAlignment_ = VerticalAlign.BOTTOM;
  /** location of the vertical axis, default value is LEFT
  * @type {!myphysicslab.lab.view.HorizAlign}
  * @private
  */
  this.vertAxisAlignment_ = HorizAlign.LEFT;
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
var DisplayAxes = myphysicslab.lab.graph.DisplayAxes;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayAxes.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', horizAxisAlignment_: '+this.horizAxisAlignment_
        +', vertAxisAlignment_: '+this.vertAxisAlignment_
        +', drawColor_: "'+this.drawColor_+'"'
        +', numFont_: "'+this.numFont_+'"'
        +', simRect_: '+this.simRect_
        +', zIndex: '+this.zIndex
        +'}';
  };

  /** @inheritDoc */
  DisplayAxes.prototype.toStringShort = function() {
    return 'DisplayAxes{horizName_: "'+this.horizName_
        +'", verticalName_: "'+this.verticalName_+'"}';
  };
};

/** @inheritDoc */
DisplayAxes.prototype.contains = function(point) {
  return false;
};

/** @inheritDoc */
DisplayAxes.prototype.draw = function(context, map) {
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
  switch (this.vertAxisAlignment_) {
    case HorizAlign.RIGHT:
      x0 = map.simToScreenX(sim_x2 - 0.05*(sim_x2 - sim_x1));
      break;
    case HorizAlign.LEFT:
      x0 = map.simToScreenX(sim_x1 + 0.05*(sim_x2 - sim_x1));
      break;
    default:
      x0 = map.simToScreenX(r.getCenterX());
  }

  // leave room to draw the numbers below the horizontal axis
  switch (this.horizAxisAlignment_) {
    case VerticalAlign.TOP:
      y0 = map.simToScreenY(sim_y2) + (10 + this.fontDescent + this.fontAscent);
      break;
    case VerticalAlign.BOTTOM:
      y0 = map.simToScreenY(sim_y1) - (10 + this.fontDescent + this.fontAscent);
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
@param {!myphysicslab.lab.view.CoordMap} map the mapping to use for translating
    between simulation and screen coordinates
@param {!myphysicslab.lab.util.DoubleRect} r the view area in simulation coords
@private
*/
DisplayAxes.prototype.drawHorizTicks = function(y0, context, map, r) {
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
@param {!myphysicslab.lab.view.CoordMap} map the mapping to use for translating
    between simulation and screen coordinates
@param {!myphysicslab.lab.util.DoubleRect} r the view area in simulation coords
@private
*/
DisplayAxes.prototype.drawVertTicks = function(x0, context, map, r) {
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
DisplayAxes.prototype.getColor = function() {
  return this.drawColor_;
};

/** Returns the font to draw the graph axes with.
@return {string} the font to draw the graph axes with
*/
DisplayAxes.prototype.getFont = function() {
  return this.numFont_;
};

/** Returns the name shown next to the horizontal axis.
@return {string} the name of the horizontal axis.
*/
DisplayAxes.prototype.getHorizName = function() {
  return this.horizName_;
};

/** @inheritDoc */
DisplayAxes.prototype.getMassObjects = function() {
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
DisplayAxes.prototype.getNiceIncrement = function(range) {
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
DisplayAxes.getNiceStart = function(start, incr) {
  // gives the first nice increment just greater than the starting number
  return Math.ceil(start/incr)*incr;
};

/** @inheritDoc */
DisplayAxes.prototype.getPosition = function() {
  return Vector.ORIGIN;
};

/** @inheritDoc */
DisplayAxes.prototype.getSimObjects = function() {
  return [];
};

/** Returns the bounding rectangle for this DisplayAxes in simulation coordinates,
which determines the numbering scale shown.
@return {!myphysicslab.lab.util.DoubleRect} the bounding rectangle for this
    DisplayAxes in simulation coordinates.
*/
DisplayAxes.prototype.getSimRect = function() {
  return this.simRect_;
};

/** Returns the name shown next to the vertical axis.
@return {string} the name of the vertical axis.
*/
DisplayAxes.prototype.getVerticalName = function() {
  return this.verticalName_;
};

/** Returns the X-axis alignment: whether it should appear at bottom, top or middle of
the simulation rectangle.
@return {!myphysicslab.lab.view.VerticalAlign} X-axis alignment option
    from {@link myphysicslab.lab.view.VerticalAlign}
*/
DisplayAxes.prototype.getXAxisAlignment = function() {
  return this.horizAxisAlignment_;
};

/** Returns the Y-axis alignment : whether it should appear at left, right or middle of
the simulation rectangle.
@return {!myphysicslab.lab.view.HorizAlign} Y-axis alignment option
    from {@link myphysicslab.lab.view.HorizAlign}
*/
DisplayAxes.prototype.getYAxisAlignment = function() {
  return this.vertAxisAlignment_;
};

/** @inheritDoc */
DisplayAxes.prototype.getZIndex = function() {
  return this.zIndex;
};

/** @inheritDoc */
DisplayAxes.prototype.isDragable = function() {
  return false;
};

/** Whether this DisplayAxes has changed since the last time it was drawn.
@return {boolean} true when this DisplayAxes has changed since the last time
    draw was called.
*/
DisplayAxes.prototype.needsRedraw = function() {
  return this.needRedraw_;
};

/** Set the color to draw the graph axes with.
@param {string} color the color to draw the graph axes with
*/
DisplayAxes.prototype.setColor = function(color) {
  this.drawColor_ = color;
  this.needRedraw_ = true;
};

/** @inheritDoc */
DisplayAxes.prototype.setDragable = function(dragable) {
};

/** Set the font to draw the graph axes with.
@param {string} font the font to draw the graph axes with
*/
DisplayAxes.prototype.setFont = function(font) {
  this.numFont_ = font;
  this.needRedraw_ = true;
};

/** Sets the name shown next to the horizontal axis
@param {string} name name of the horizontal axis
*/
DisplayAxes.prototype.setHorizName = function(name) {
  this.horizName_ = name;
  this.needRedraw_ = true;
};

/** @inheritDoc */
DisplayAxes.prototype.setPosition = function(position) {
};

/** Sets the bounding rectangle for this DisplayAxes in simulation coordinates; this
determines the numbering scale shown.
@param {!myphysicslab.lab.util.DoubleRect} simRect the bounding rectangle for this
    DisplayAxes in simulation coordinates.
*/
DisplayAxes.prototype.setSimRect = function(simRect) {
  this.simRect_ = simRect;
  this.needRedraw_ = true;
};

/** Sets the name shown next to the vertical axis
@param {string} name name of the vertical axis
*/
DisplayAxes.prototype.setVerticalName = function(name) {
  this.verticalName_ = name;
  this.needRedraw_ = true;
};

/** Sets the X-axis alignment: whether it should appear at bottom, top or middle of the
simulation rectangle.
@param {!myphysicslab.lab.view.VerticalAlign} alignment X-axis alignment option
    from {@link myphysicslab.lab.view.VerticalAlign}
@return {!myphysicslab.lab.graph.DisplayAxes} this object for chaining setters
*/
DisplayAxes.prototype.setXAxisAlignment = function(alignment) {
  this.horizAxisAlignment_ = alignment;
  this.needRedraw_ = true;
  return this;
};

/** Sets the Y-axis alignment: whether it should appear at left, right or middle of the
simulation rectangle.
@param {!myphysicslab.lab.view.HorizAlign} alignment Y-axis alignment option
    from {@link myphysicslab.lab.view.HorizAlign}
@return {!myphysicslab.lab.graph.DisplayAxes} this object for chaining setters
*/
DisplayAxes.prototype.setYAxisAlignment = function(alignment) {
  this.vertAxisAlignment_ = alignment;
  this.needRedraw_ = true;
  return this;
};

/** @inheritDoc */
DisplayAxes.prototype.setZIndex = function(zIndex) {
  if (goog.isDef(zIndex)) {
    this.zIndex = zIndex;
  }
};

}); // goog.scope
