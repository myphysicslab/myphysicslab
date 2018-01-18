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

goog.provide('myphysicslab.lab.graph.DisplayGraph');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.view.DrawingMode');
goog.require('myphysicslab.lab.graph.GraphPoint');
goog.require('myphysicslab.lab.graph.GraphLine');
goog.require('myphysicslab.lab.graph.GraphStyle');
goog.require('myphysicslab.lab.util.HistoryList');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.view.LabView');
goog.require('myphysicslab.lab.view.ScreenRect');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CoordMap = lab.view.CoordMap;
var DisplayObject = lab.view.DisplayObject;
var DrawingMode = lab.view.DrawingMode;
var GraphLine = lab.graph.GraphLine;
var GraphPoint = lab.graph.GraphPoint;
var GraphStyle = lab.graph.GraphStyle;
const HistoryList = goog.module.get('myphysicslab.lab.util.HistoryList');
var LabView = lab.view.LabView;
var ScreenRect = lab.view.ScreenRect;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Displays one or more {@link GraphLine}. The GraphLines are drawn in the simulation
coordinates of the containing {@link LabView}.

The screen rectangle that the DisplayGraph should occupy within the LabView must be set
with {@link #setScreenRect} before drawing can be done.

Additional GraphLines can be shown in the DisplayGraph, see {@link #addGraphLine}.

The GraphLine can be drawn into an offscreen image, see {@link #setUseBuffer}. The
default is to use an offscreen image; this saves time by not needing to redraw the
entire graph every frame.

### Discontinuity

A change to a variable is either continuous or discontinuous. DisplayGraph doesn't draw
a line at a point of discontinuity, but draws a dot instead. A discontinuity is
indicated by incrementing the sequence number, see
{@link myphysicslab.lab.model.VarsList}.

* @param {!GraphLine=} opt_graphLine a GraphLine to display
* @constructor
* @final
* @struct
* @implements {DisplayObject}
*/
myphysicslab.lab.graph.DisplayGraph = function(opt_graphLine) {
  if (goog.isDef(opt_graphLine) && !GraphLine.isDuckType(opt_graphLine)) {
    throw new Error('not a GraphLine '+opt_graphLine);
  }
  /** The GraphLines to draw.
  * @type {!Array<!GraphLine>}
  * @private
  */
  this.graphLines_ = goog.isDef(opt_graphLine) ? [opt_graphLine] : [];
  /** Index of last point drawn within GraphPoints list of each GraphLine
  * @type {!Array<number>}
  * @private
  */
  this.memDraw_ = goog.array.repeat(-1, this.graphLines_.length);
  /** The offscreen buffer to draw the graph into
  * @type {?HTMLCanvasElement}
  * @private
  */
  this.offScreen_ = null;
  /** to detect when redraw needed;  when the coordmap changes, we need to redraw.
  * @type {?CoordMap}
  * @private
  */
  this.lastMap_ = null;
  /**
  * @type {!ScreenRect}
  * @private
  */
  this.screenRect_ = ScreenRect.EMPTY_RECT;
  /** set when the entire graph needs to be redrawn.
  * @type {boolean}
  * @private
  */
  this.needRedraw_ = false;
  /** Whether to draw into the offscreen buffer.
  * @type {boolean}
  * @private
  */
  this.useBuffer_ = true;
  /**
  * @type {number}
  */
  this.zIndex = 0;
};
var DisplayGraph = myphysicslab.lab.graph.DisplayGraph;

/** @override */
DisplayGraph.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', screenRect_: '+this.screenRect_
      +', useBuffer_: '+this.useBuffer_
      +', zIndex: '+this.zIndex
      +', graphLines_: ['
      + goog.array.map(this.graphLines_, function(g) { return g.toStringShort(); })
      +']}';
};

DisplayGraph.prototype.toStringShort = function() {
  return Util.ADVANCED ? '' :
      'DisplayGraph{graphLines_.length: '+this.graphLines_.length+'}';
};

/** Add a GraphLine to be displayed.
@param {!GraphLine} graphLine the GraphLine to be display
*/
DisplayGraph.prototype.addGraphLine = function(graphLine) {
  if (GraphLine.isDuckType(graphLine)) {
    if (!goog.array.contains(this.graphLines_, graphLine)) {
      this.graphLines_.push(graphLine);
      this.memDraw_.push(-1);
    }
  } else {
    throw new Error('not a GraphLine '+graphLine);
  }
};

/** @override */
DisplayGraph.prototype.contains = function(p_world) {
  // ? this seems wrong, but need the CoordMap to convert screenRect to sim coords
  return false;
};

/** @override */
DisplayGraph.prototype.draw = function(context, map) {
  if (this.screenRect_.isEmpty()) {
    if (Util.DEBUG) {
      console.log('DisplayGraph: screenRect is empty');
    }
    return;
  }
  context.save();
  if (this.lastMap_ == null || this.lastMap_ != map) {
    this.lastMap_ = map;
    this.needRedraw_ = true;
  }
  for (var i=0, n=this.graphLines_.length; i<n; i++) {
  // Detect when graphLine has been reset.
    if (this.memDraw_[i] > this.graphLines_[i].getGraphPoints().getEndIndex()) {
      this.reset();
      break;
    }
  }
  if (!this.useBuffer_) {
    // without offscreen buffer, always need to redraw
    this.needRedraw_ = true;
    // draw without offscreen buffer.
    if (this.needRedraw_) {
      this.fullDraw(context, map);
      this.needRedraw_ = false;
    } else {
      // this is only useful for debugging, to see the incrementalDraw happening.
      this.incrementalDraw(context, map);
    }
  } else {
    var w = this.screenRect_.getWidth();
    var h = this.screenRect_.getHeight();
    if (this.offScreen_ == null) {
      goog.asserts.assert(w > 0 && h > 0);
      // make the offscreen buffer that has an alpha channel.
      this.offScreen_ = /** @type {!HTMLCanvasElement} */
          (document.createElement('canvas'));
      this.offScreen_.width = w;
      this.offScreen_.height = h;
      this.needRedraw_ = true;
    }
    goog.asserts.assertObject(this.offScreen_);
    // osb = off screen buffer
    var osb = /** @type {!CanvasRenderingContext2D} */(
        this.offScreen_.getContext('2d'));
    goog.asserts.assertObject(osb);
    if (this.needRedraw_) {
      // Clear image with transparent alpha by drawing a rectangle
      // 'clearRect fills with transparent black'
      osb.clearRect(0, 0, w, h);
      // The offscreen buffer has all transparent pixels at this point.
      // Draw into offscreen buffer, but using opaque ink (alpha = 1.0).
      this.fullDraw(osb, map);
      this.needRedraw_ = false;
    } else {
      this.incrementalDraw(osb, map);
    }
    // Copy the entire offscreen buffer onto the screen.
    // Note that the LabCanvas needs to actually clear the screen to white
    // at the start of each paint operation, because this draw() method never clears,
    // it does a sort of 'transparent image copy'.
    context.drawImage(this.offScreen_, 0, 0, w, h);
  }
  for (var i=0, n=this.graphLines_.length; i<n; i++) {
    this.drawHotSpot(context, map, this.graphLines_[i]);
  }
  context.restore();
};

/** Draws a highly visible mark at the most recent point of the graph.
Draws a small 5 pixel wide rectangle with the color set by {@link #setHotSpotColor}.
If the hot spot color is the empty string, then the hot spot is not drawn.
* @param {!CanvasRenderingContext2D} context the canvas's context to draw into
* @param {!CoordMap} coordMap the CoordMap specifying
*     sim to screen conversion
* @param {!GraphLine} graphLine
* @private
*/
DisplayGraph.prototype.drawHotSpot = function(context, coordMap, graphLine) {
  var p = graphLine.getGraphPoints().getEndValue();
  if (p != null) {
    var x = coordMap.simToScreenX(p.getX());
    var y = coordMap.simToScreenY(p.getY());
    var color = graphLine.getHotSpotColor();
    if (color) {
      context.fillStyle = color;
      context.fillRect(x-2, y-2, 5, 5);
    }
  }
};

/** Draws the points starting from the specified point to the most recent point;
 returns the index of last point drawn.
* @param {!CanvasRenderingContext2D} context the canvas's context to draw into
* @param {!CoordMap} coordMap the CoordMap specifying sim to
*     screen conversion
* @param {number} from the index of the the point to start from, within the datapoints
* @param {!GraphLine} graphLine
* @return {number} the index of the last point drawn, within the {@link #datapoints}
* @private
*/
DisplayGraph.prototype.drawPoints = function(context, coordMap, from, graphLine) {
  var simRect = coordMap.screenToSimRect(this.screenRect_);
  var iter = graphLine.getGraphPoints().getIterator(from);
  if (!iter.hasNext())
    return from;
  /** @type {!GraphPoint} */
  var next = iter.nextValue();  // move to first point
  // Draw first point.
  // Find the GraphStyle corresponding to this point.
  var style = graphLine.getGraphStyle(iter.getIndex());
  if (style.drawMode == DrawingMode.DOTS) {
    var x = coordMap.simToScreenX(next.x);
    var y = coordMap.simToScreenY(next.y);
    var w = style.lineWidth;
    context.fillStyle = style.color_;
    context.fillRect(x, y, w, w);
  }
  while (iter.hasNext()) {
    /** @type {!GraphPoint} */
    var last = next;
    next = iter.nextValue();
    // if same point then don't draw again
    if (next.x == last.x && next.y == last.y)
      continue;
    // find the GraphStyle corresponding to this point
    style = graphLine.getGraphStyle(iter.getIndex());
    // Avoid drawing nonsense lines in a graph, like when the pendulum
    // moves over the 0 to 2Pi boundary.  The sequence number changes
    // when there is a discontinuity, so don't draw a line in this case.
    var continuous = next.seqX == last.seqX && next.seqY == last.seqY;
    if (style.drawMode == DrawingMode.DOTS || !continuous) {
      // Only draw points that are visible.
      if (!simRect.contains(next))
        continue;
      x = coordMap.simToScreenX(next.x);
      y = coordMap.simToScreenY(next.y);
      w = style.lineWidth;
      context.fillStyle = style.color_;
      context.fillRect(x, y, w, w);
    } else {
      // Don't draw lines that are not possibly visible.
      if (!simRect.maybeVisible(last, next)) {
        continue;
      }
      var x1 = coordMap.simToScreenX(last.x);
      var y1 = coordMap.simToScreenY(last.y);
      var x2 = coordMap.simToScreenX(next.x);
      var y2 = coordMap.simToScreenY(next.y);
      context.strokeStyle = style.color_;
      context.lineWidth = style.lineWidth;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    }
  }
  return iter.getIndex();
};

/** Draws the entire graph into the given Graphics context.
* @param {!CanvasRenderingContext2D} context the canvas's context to draw into
* @param {!CoordMap} coordMap the CoordMap specifying sim to
*    screen conversion
* @private
*/
DisplayGraph.prototype.fullDraw = function(context, coordMap) {
  // Redraw entire memory list by drawing from oldest point in list
  this.memDraw_ = goog.array.repeat(-1, this.graphLines_.length);
  this.incrementalDraw(context, coordMap);
};

/** @override */
DisplayGraph.prototype.getMassObjects = function() {
  return [];
};

/** @override */
DisplayGraph.prototype.getPosition = function() {
  //? what to return here ??? center of screenRect in sim coords?
  return Vector.ORIGIN;
};

/** Returns the screen rectangle that this DisplayGraph is occupying within the
* {@link LabView}, in screen coordinates.
* @return {!ScreenRect} the screen rectangle of this DisplayGraph in
*    screen coordinates
*/
DisplayGraph.prototype.getScreenRect = function() {
  return this.screenRect_;
};

/** @override */
DisplayGraph.prototype.getSimObjects = function() {
  return [];
};

/** Whether this DisplayGraph is drawing into an offscreen buffer.
* @return {boolean} Whether this DisplayGraph is drawing into an offscreen buffer
*/
DisplayGraph.prototype.getUseBuffer = function() {
  return this.useBuffer_;
};

/** @override */
DisplayGraph.prototype.getZIndex = function() {
  return this.zIndex;
};

/** Draws only the recent points into the given Graphics context.
Keeps track of what was the last point drawn.
* @param {!CanvasRenderingContext2D} context the canvas's context to draw into
* @param {!CoordMap} coordMap the CoordMap specifying sim to
*    screen conversion
* @private
*/
DisplayGraph.prototype.incrementalDraw = function(context, coordMap) {
  // draw points from the last drawn (=memDraw) up to the current latest point
  //experiment: fade the graph by drawing a translucent white rectangle
  //var r = this.getScreenRect();
  //context.fillStyle = 'rgba(255,255,255,0.02)';
  //context.fillRect(r.getX(), r.getY(), r.getWidth(), r.getHeight());
  for (var i=0, n=this.graphLines_.length; i<n; i++) {
    this.memDraw_[i] = this.drawPoints(context, coordMap, this.memDraw_[i],
        this.graphLines_[i]);
  }
};

/** @override */
DisplayGraph.prototype.isDragable = function() {
  return false;
};

/** Remove a GraphLine from set of those to display.
@param {!GraphLine} graphLine the GraphLine to not display
*/
DisplayGraph.prototype.removeGraphLine = function(graphLine) {
  if (GraphLine.isDuckType(graphLine)) {
    var idx = goog.array.indexOf(this.graphLines_, graphLine);
    goog.array.removeAt(this.graphLines_, idx);
    goog.array.removeAt(this.memDraw_, idx);
    goog.asserts.assert(!goog.array.contains(this.graphLines_, graphLine));
    this.needRedraw_ = true;
  } else {
    throw new Error('not a GraphLine '+graphLine);
  }
};

/** Causes entire graph to be redrawn, when {@link #draw} is next called.
* @return {undefined}
*/
DisplayGraph.prototype.reset = function() {
  this.memDraw_ = goog.array.repeat(-1, this.graphLines_.length);
  this.needRedraw_ = true;
};

/** @override */
DisplayGraph.prototype.setDragable = function(dragable) {
};

/** @override */
DisplayGraph.prototype.setPosition = function(position) {
  //throw new Error(); // unsupported
};

/** Sets the screen rectangle that this DisplayGraph should occupy within the
* {@link LabView}, in screen coordinates.
* @param {!ScreenRect} screenRect the screen coordinates of the
    area this DisplayGraph should occupy.
*/
DisplayGraph.prototype.setScreenRect = function(screenRect) {
  this.screenRect_ = screenRect;
  this.offScreen_ = null; // force reallocation of offscreen
};

/** Whether to draw into an offscreen buffer.  A *time graph* must redraw every
frame, so it saves time to *not* use an offscreen buffer in that case.
* @param {boolean} value Whether to draw into an offscreen buffer
*/
DisplayGraph.prototype.setUseBuffer = function(value) {
  this.useBuffer_ = value;
  if (!this.useBuffer_) {
    this.offScreen_ = null;
  }
};

/** @override */
DisplayGraph.prototype.setZIndex = function(zIndex) {
  this.zIndex = goog.isDef(zIndex) ? zIndex : 0;
};

});  // goog.scope
