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

goog.provide('myphysicslab.lab.graph.VectorGraph');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.model.ODESim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CoordMap = lab.view.CoordMap;
var GenericEvent = lab.util.GenericEvent;
var NF = lab.util.UtilityCore.NF;
var NF5 = lab.util.UtilityCore.NF5;
var ScreenRect = lab.view.ScreenRect;
var Subject = lab.util.Subject;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;
var ODESim = lab.model.ODESim;

/** Draws vectors showing the direction field of the differential equation.
In a graph of y vs. x, shows the value of the derivative dy/dx at various points on a grid, as a short line with that slope.

This is generally only useful for differential equations of 2 variables.  
Otherwise, the phase space is 3D, 4D, etc. and cannot be adequately represented by these direction field vectors.

The screen rectangle that the VectorGraph should occupy within the
{@link myphysicslab.lab.view.SimView SimView} must be set with {@link #setScreenRect}
before drawing can be done.

Redraws when a parameter changes in the subject, because a parameter change modifies the
direction field.

### To Do

+ Optionally, make length of the vector be proportional to the speed of the trajectory at that point.

* @param {!ODESim} sim the simulation whose differential equations will be shown
    as a direction field
* @param {number} xVariable index of X variable in VarsList of `sim`
* @param {number} yVariable index of Y variable in VarsList of `sim`
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.DisplayObject}
* @implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.graph.VectorGraph = function(sim, xVariable, yVariable) {
  /**
  * @type {!ODESim}
  * @private
  */
  this.sim_ = sim;
  sim.addObserver(this);
  /** index of x variable in VarsList
  * @type {number}
  * @private
  */
  this.xVariable_ = xVariable;
  /** index of y variable in VarsList
  * @type {number}
  * @private
  */
  this.yVariable_ = yVariable;
  /** The offscreen buffer to draw the graph into
  * @type {?HTMLCanvasElement}
  * @private
  */
  this.offScreen_ = null;
  /** to detect when redraw needed;  when the coordmap changes, we need to redraw.
  * @type {?lab.view.CoordMap}
  * @private
  */
  this.lastMap_ = null;
  /**
  * @type {!lab.view.ScreenRect}
  * @private
  */
  this.screenRect_ = ScreenRect.EMPTY_RECT;
  /** set when the entire graph needs to be redrawn.
  * @type {boolean}
  * @private
  */
  this.needRedraw_ = true;
  /** Number of grid points to have in each direction, horizontally and vertically.
  * @type {number}
  */
  this.gridPoints = 10;
  /** The color to use for drawing dots, a CSS3 color value.
  * @type {string}
  */
  this.dotStyle = 'red';
  /** The color to use for drawing lines, a CSS3 color value.
  * @type {string}
  */
  this.lineStyle = 'blue';
};
var VectorGraph = myphysicslab.lab.graph.VectorGraph;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  VectorGraph.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', screenRect_: '+this.screenRect_
        +'}';
  };

  VectorGraph.prototype.toStringShort = function() {
    return 'VectorGraph{sim_: '+this.sim_.toStringShort()+'}';
  };
};

/** @inheritDoc */
VectorGraph.prototype.contains = function(p_world) {
  // ? this seems wrong, but need the CoordMap to convert screenRect to sim coords
  return false;
};

/* Draws the direction vector field for the differential equations,
at each of several grid points in the graph.

The procedure is as follows:
1. look at the current bounds, decide on a grid to show maybe a 4 x 4 or 5 x 5 grid
2. for each point on the grid
3. find the x, y (in simulation coords) for the grid point
4. find dx/dt and dy/dt (by plugging x,y into the diffeq's)
5. find the slope of the trajectory = dy/dx = dy/dt / dx/dt
6. draw a short line with that slope at this point
*/

/** @inheritDoc */
VectorGraph.prototype.draw = function(context, map) {
  if (this.screenRect_.isEmpty()) {
    if (goog.DEBUG) {
      console.log('VectorGraph: screenRect is empty');
    }
    return;
  }
  context.save();
  if (this.lastMap_ == null || this.lastMap_ != map) {
    this.lastMap_ = map;
    this.needRedraw_ = true;
  }

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
  var osb = /** @type {!CanvasRenderingContext2D} */(this.offScreen_.getContext('2d'));
  goog.asserts.assertObject(osb);
  if (this.needRedraw_) {
    // Clear image with transparent alpha by drawing a rectangle
    // 'clearRect fills with transparent black'
    osb.clearRect(0, 0, w, h);
    // The offscreen buffer has all transparent pixels at this point.
    // Draw into offscreen buffer, but using opaque ink (alpha = 1.0).
    this.fullDraw(osb, map);
    this.needRedraw_ = false;
  }
  // Copy the entire offscreen buffer onto the screen.
  // Note that the LabCanvas needs to actually clear the screen to white
  // at the start of each paint operation, because this draw() method never clears,
  // it does a sort of 'transparent image copy'.
  context.drawImage(this.offScreen_, 0, 0, w, h);
  context.restore();
};

/** Draws the entire graph into the given Graphics context.
* @param {!CanvasRenderingContext2D} context the canvas's context to draw into
* @param {!lab.view.CoordMap} coordMap the CoordMap specifying sim to
*    screen conversion
* @private
*/
VectorGraph.prototype.fullDraw = function(context, coordMap) {
  var gp = this.gridPoints;
  var sr = this.screenRect_;
  var w = sr.getWidth();
  var h = sr.getHeight();
  var left = sr.getLeft();
  var top_ = sr.getTop();
  var va = this.sim_.getVarsList();
  var state = UtilityCore.newNumberArray(va.numVariables());
  var change = UtilityCore.newNumberArray(va.numVariables());
  // draw dots, in like a 4 x 4 grid
  for (var i=0; i<gp; i++) {
    for (var j=0; j<gp; j++) {
      var x = left + (i*w/gp) + w/(2*gp);
      var y = top_ + (j*h/gp) + h/(2*gp);
      var dot = new ScreenRect(x-3, y-3, 6, 6);
      dot.makeOval(context);
      context.lineWidth = 1;
      context.strokeStyle = this.dotStyle;
      context.stroke();
      var sim_x = coordMap.screenToSimX(x);
      var sim_y = coordMap.screenToSimY(y);
      state[this.xVariable_] = sim_x;
      state[this.yVariable_] = sim_y;
      UtilityCore.zeroArray(change);
      this.sim_.evaluate(state, change, 0);
      var delta_x = coordMap.simToScreenScaleX(change[this.xVariable_]);
      var delta_y = coordMap.simToScreenScaleY(change[this.yVariable_]);
      // k = slope at this point, in screen coords
      var k = delta_y/delta_x;
      // r = desired length of flags, in screen coords
      var r = w/(2*gp);
      // draw a line from (x, y) at a slope = k, for a distance r
      // the line goes down dy units, and to the right dx units, in screen coords
      // right triangle, so:  r^2 = dx^2 + dy^2 = dx^2 (1 + dy^2/dx^2)
      // r^2 = dx^2 (1 + k^2)
      // dx = r / sqrt(1 + k^2)
      // dy = k dx
      var absX = r / Math.sqrt(1 + k*k);
      var dx = delta_x > 0 ? absX : -absX;
      // The minus sign here is because screen coords increase down,
      // opposite of sim coords which increase up (? this is a guess).
      var dy = -k * dx;

      context.strokeStyle = this.lineStyle;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + dx, y + dy);
      context.stroke();
    }
  }
};

/** @inheritDoc */
VectorGraph.prototype.getMassObjects = function() {
  return [ ];
};

/** @inheritDoc */
VectorGraph.prototype.getPosition = function() {
  //? what to return here ??? center of screenRect in sim coords?
  return Vector.ORIGIN;
};

/** Returns the screen rectangle that this VectorGraph is occupying within the
* {@link myphysicslab.lab.view.SimView SimView}, in screen coordinates.
* @return {!lab.view.ScreenRect} the screen rectangle of this VectorGraph in
*    screen coordinates
*/
VectorGraph.prototype.getScreenRect = function() {
  return this.screenRect_;
};

/** @inheritDoc */
VectorGraph.prototype.getSimObjects = function() {
  return [ ];
};

/** @inheritDoc */
VectorGraph.prototype.isDragable = function() {
  return false;
};

/** @inheritDoc */
VectorGraph.prototype.observe =  function(event) {
  if (event.getSubject() == this.sim_) {
    // assume any change in sim modifies direction field, so redraw
    this.needRedraw_ = true;
  }
};

/** @inheritDoc */
VectorGraph.prototype.setDragable = function(dragable) {
};

/** @inheritDoc */
VectorGraph.prototype.setPosition = function(position) {
  //throw new Error(); // unsupported
};

/** Sets the screen rectangle that this VectorGraph should occupy within the
* {@link myphysicslab.lab.view.SimView SimView}, in screen coordinates.
* @param {!lab.view.ScreenRect} screenRect the screen coordinates of the
    area this VectorGraph should occupy.
*/
VectorGraph.prototype.setScreenRect = function(screenRect) {
  this.screenRect_ = screenRect;
  this.offScreen_ = null; // force reallocation of offscreen
};

});  // goog.scope
