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

import { CoordMap } from '../view/CoordMap.js';
import { DisplayObject } from '../view/DisplayObject.js';
import { GenericEvent, Observer, SubjectEvent } from '../util/Observe.js';
import { MassObject } from "../model/MassObject.js"
import { ODESim } from '../model/ODESim.js';
import { ScreenRect } from '../view/ScreenRect.js';
import { SimObject } from "../model/SimObject.js"
import { SimView } from '../view/SimView.js';
import { Util } from '../util/Util.js';
import { Vector, GenericVector } from "../util/Vector.js"

/** Draws vectors showing the direction field of the differential equation. In a graph
of Y vs. X, shows the value of the derivative dy/dx at various points on a grid, as a
short line with that slope.

This is a static display that is typically layered over a DisplayGraph. The
DisplayGraph will be drawing the actual graph lines.

This is generally only useful for differential equations of 2 variables. Otherwise, the
phase space is 3D, 4D, etc. and cannot be adequately represented by these direction
field vectors.

The screen rectangle that the VectorGraph should occupy within the
{@link SimView} must be set with {@link setScreenRect}
before drawing can be done.

Redraws when a parameter changes in the subject, because a parameter change modifies the
direction field.

**TO DO** Optionally, make length of the vector be proportional to the speed of the
trajectory at that point.

*/
export class VectorGraph implements Observer, DisplayObject {
  private sim_: ODESim;
  /** index of x variable in VarsList */
  private xVariable_: number;
  /** index of y variable in VarsList */
  private yVariable_: number;
  /** The offscreen buffer to draw the graph into */
  private offScreen_: null|HTMLCanvasElement = null;
  /** to detect when redraw needed;  when the coordmap changes, we need to redraw. */
  private lastMap_: null|CoordMap = null;
  private screenRect_: ScreenRect = ScreenRect.EMPTY_RECT;
  /** set when the entire graph needs to be redrawn. */
  private needRedraw_: boolean = true;
  /** Number of grid points to have in each direction, horizontally and vertically. */
  gridPoints: number = 10;
  /** The color to use for drawing dots, a CSS3 color value. */
  dotStyle: string = 'red';
  /** The color to use for drawing lines, a CSS3 color value. */
  lineStyle: string = 'blue';
  zIndex: number = 0;

/**
* @param sim the simulation whose differential equations will be shown
*    as a direction field
* @param xVariable index of X variable in VarsList of `sim`
* @param yVariable index of Y variable in VarsList of `sim`
*/
constructor(sim: ODESim, xVariable: number, yVariable: number) {
  this.sim_ = sim;
  this.xVariable_ = xVariable;
  this.yVariable_ = yVariable;
  sim.addObserver(this);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', screenRect_: '+this.screenRect_
      +', zIndex: '+this.zIndex
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'VectorGraph{sim_: '+this.sim_.toStringShort()+'}';
};

/** @inheritDoc */
contains(_p_world: Vector): boolean {
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
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  if (this.screenRect_.isEmpty()) {
    /*if (Util.DEBUG) {
      console.log('VectorGraph: screenRect is empty');
    }*/
    return;
  }
  context.save();
  if (this.lastMap_ == null || this.lastMap_ != map) {
    this.lastMap_ = map;
    this.needRedraw_ = true;
  }

  const w = this.screenRect_.getWidth();
  const h = this.screenRect_.getHeight();
  if (this.offScreen_ == null) {
    Util.assert(w > 0 && h > 0);
    // make the offscreen buffer that has an alpha channel.
    this.offScreen_ = document.createElement('canvas');
    this.offScreen_.width = w;
    this.offScreen_.height = h;
    this.needRedraw_ = true;
  }
  Util.assert(Util.isObject(this.offScreen_));
  // osb = off screen buffer
  const osb = this.offScreen_.getContext('2d') as CanvasRenderingContext2D;
  Util.assert(Util.isObject(osb));
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
* @param context the canvas's context to draw into
* @param coordMap the CoordMap specifying sim to screen conversion
*/
private fullDraw(context: CanvasRenderingContext2D, coordMap: CoordMap) {
  const gp = this.gridPoints;
  const sr = this.screenRect_;
  const w = sr.getWidth();
  const h = sr.getHeight();
  const left = sr.getLeft();
  const top = sr.getTop();
  const va = this.sim_.getVarsList();
  const state = Util.newNumberArray(va.numVariables());
  const change = Util.newNumberArray(va.numVariables());
  // draw dots, in like a 4 x 4 grid
  for (let i=0; i<gp; i++) {
    for (let j=0; j<gp; j++) {
      const x = left + (i*w/gp) + w/(2*gp);
      const y = top + (j*h/gp) + h/(2*gp);
      const dot = new ScreenRect(x-3, y-3, 6, 6);
      dot.makeOval(context);
      context.lineWidth = 1;
      context.strokeStyle = this.dotStyle;
      context.stroke();
      const sim_x = coordMap.screenToSimX(x);
      const sim_y = coordMap.screenToSimY(y);
      state[this.xVariable_] = sim_x;
      state[this.yVariable_] = sim_y;
      Util.zeroArray(change);
      this.sim_.evaluate(state, change, 0);
      const delta_x = coordMap.simToScreenScaleX(change[this.xVariable_]);
      const delta_y = coordMap.simToScreenScaleY(change[this.yVariable_]);
      // k = slope at this point, in screen coords
      const k = delta_y/delta_x;
      // r = desired length of flags, in screen coords
      const r = w/(2*gp);
      // draw a line from (x, y) at a slope = k, for a distance r
      // the line goes down dy units, and to the right dx units, in screen coords
      // right triangle, so:  r^2 = dx^2 + dy^2 = dx^2 (1 + dy^2/dx^2)
      // r^2 = dx^2 (1 + k^2)
      // dx = r / sqrt(1 + k^2)
      // dy = k dx
      const absX = r / Math.sqrt(1 + k*k);
      const dx = delta_x > 0 ? absX : -absX;
      // The minus sign here is because screen coords increase down,
      // opposite of sim coords which increase up (? this is a guess).
      const dy = -k * dx;

      context.strokeStyle = this.lineStyle;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + dx, y + dy);
      context.stroke();
    }
  }
};

/** @inheritDoc */
getChanged(): boolean {
  return this.needRedraw_;
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [];
};

/** @inheritDoc */
getPosition(): Vector {
  //? what to return here ??? center of screenRect in sim coords?
  return Vector.ORIGIN;
};

/** Returns the screen rectangle that this VectorGraph is occupying within the
* {@link SimView}, in screen coordinates.
* @return the screen rectangle of this VectorGraph in screen coordinates
*/
getScreenRect(): ScreenRect {
  return this.screenRect_;
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return [];
};

/** @inheritDoc */
getZIndex(): number {
  return this.zIndex;
};

/** @inheritDoc */
isDragable(): boolean {
  return false;
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.sim_) {
    // assume any change in sim modifies direction field, so redraw
    this.needRedraw_ = true;
  }
};

/** @inheritDoc */
setDragable(_dragable: boolean) {
};

/** @inheritDoc */
setPosition(_position: GenericVector) {
  //throw ''; // unsupported
};

/** Sets the screen rectangle that this VectorGraph should occupy within the
* {@link SimView}, in screen coordinates.
* @param screenRect the screen coordinates of the
    area this VectorGraph should occupy.
*/
setScreenRect(screenRect: ScreenRect) {
  this.screenRect_ = screenRect;
  this.offScreen_ = null; // force reallocation of offscreen
};

/** @inheritDoc */
setZIndex(zIndex: number) {
  this.zIndex = zIndex !== undefined ? zIndex : 0;
};

} // end class
Util.defineGlobal('lab$graph$VectorGraph', VectorGraph);
