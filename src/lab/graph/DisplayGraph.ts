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

import { CoordMap } from '../view/CoordMap.js'
import { DisplayObject } from '../view/DisplayObject.js'
import { DrawingMode } from '../view/DrawingMode.js'
import { GraphLine, GraphPoint, GraphStyle } from './GraphLine.js'
import { HistoryList } from '../util/HistoryList.js'
import { MassObject } from "../model/MassObject.js"
import { SimView } from '../view/SimView.js'
import { ScreenRect } from '../view/ScreenRect.js'
import { SimObject } from "../model/SimObject.js"
import { Util } from '../util/Util.js'
import { Vector, GenericVector } from '../util/Vector.js'

/** Displays one or more {@link GraphLine}. The GraphLines are
drawn in the simulation coordinates of the containing {@link SimView}.

The screen rectangle that the DisplayGraph should occupy within the SimView must be set
with {@link setScreenRect} before drawing can be done.

Additional GraphLines can be shown in the DisplayGraph,
see {@link addGraphLine}.

The GraphLine can be drawn into an offscreen image,
see {@link setUseBuffer}. The default is to use an offscreen image; this
saves time by not needing to redraw the entire graph every frame.

### Discontinuity

A change to a variable is either continuous or discontinuous. DisplayGraph doesn't draw
a line at a point of discontinuity, but draws a dot instead. A discontinuity is
indicated by incrementing the sequence number, see
{@link lab/model/VarsList.VarsList | VarsList}.
*/
export class DisplayGraph implements DisplayObject {
  /** The GraphLines to draw.*/
  private graphLines_: GraphLine[];
  /** Index of last point drawn within GraphPoints list of each GraphLine */
  private memDraw_: number[];
  /** The offscreen buffer to draw the graph into */
  private offScreen_: null|HTMLCanvasElement = null;
  /** to detect when redraw needed;  when the coordmap changes, we need to redraw. */
  private lastMap_: null|CoordMap = null;
  private screenRect_: ScreenRect = ScreenRect.EMPTY_RECT;
  /** set when the entire graph needs to be redrawn. */
  private needRedraw_: boolean = false;
  /** Whether to draw into the offscreen buffer. */
  private useBuffer_: boolean = true;
  zIndex: number= 0;

/**
* @param opt_graphLine a GraphLine to display (optional)
*/
constructor(opt_graphLine?: GraphLine) {
  // give nice error message during interactive Terminal scripting
  if (opt_graphLine !== undefined && !(opt_graphLine instanceof GraphLine)) {
    throw 'not a GraphLine '+opt_graphLine;
  }
  this.graphLines_ = opt_graphLine !== undefined ? [opt_graphLine] : [];
  this.memDraw_ = Util.repeat(-1, this.graphLines_.length);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', screenRect_: '+this.screenRect_
      +', useBuffer_: '+this.useBuffer_
      +', zIndex: '+this.zIndex
      +', graphLines_: ['
      + this.graphLines_.map(g => g.toStringShort())
      +']}';
};

toStringShort() {
  return 'DisplayGraph{graphLines_.length: '+this.graphLines_.length+'}';
};

/** Add a GraphLine to be displayed.
@param graphLine the GraphLine to be display
*/
addGraphLine(graphLine: GraphLine): void {
  // give nice error message during interactive Terminal scripting
  if (!(graphLine instanceof GraphLine)) {
    throw 'not a GraphLine '+graphLine;
  }
  if (!this.graphLines_.includes(graphLine)) {
    this.graphLines_.push(graphLine);
    this.memDraw_.push(-1);
  }
};

/** @inheritDoc */
contains(_p_world: Vector): boolean {
  // ? this seems wrong, but need the CoordMap to convert screenRect to sim coords
  return false;
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
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
  for (let i=0, n=this.graphLines_.length; i<n; i++) {
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
    // osb = off screen buffer  CanvasRenderingContext2D
    const osb = this.offScreen_.getContext('2d');
    if (osb === null) {
      throw 'DisplayGraph: getContext fail';
    };
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
  for (let i=0, n=this.graphLines_.length; i<n; i++) {
    this.drawHotSpot(context, map, this.graphLines_[i]);
  }
  context.restore();
};

/** Draws a highly visible mark at the most recent point of the graph.
Draws a small 5 pixel wide rectangle with the color set by
{@link GraphLine.setHotSpotColor}.
If the hot spot color is the empty string, then the hot spot is not drawn.
@param context the canvas's context to draw into
@param coordMap the CoordMap specifying sim to screen conversion
@param graphLine
*/
private drawHotSpot(context: CanvasRenderingContext2D, coordMap: CoordMap,
    graphLine: GraphLine) {
  const p = graphLine.getGraphPoints().getEndValue();
  if (p != null) {
    const x = coordMap.simToScreenX(p.getX());
    const y = coordMap.simToScreenY(p.getY());
    const color = graphLine.getHotSpotColor();
    if (color) {
      context.fillStyle = color;
      context.fillRect(x-2, y-2, 5, 5);
    }
  }
};

/** Draws the points starting from the specified point to the most recent point;
* returns the index of last point drawn.
* @param context the canvas's context to draw into
* @param coordMap the CoordMap specifying sim to screen conversion
* @param from the index of the the point to start from, within the datapoints
* @param graphLine
* @return the index of the last point drawn, within the data points
*/
private drawPoints(context: CanvasRenderingContext2D, coordMap: CoordMap,
    from: number, graphLine: GraphLine): number {
  const simRect = coordMap.screenToSimRect(this.screenRect_);
  const iter = graphLine.getGraphPoints().getIterator(from);
  if (!iter.hasNext()) {
    return from;
  }
  let next = iter.nextValue();  // move to first point
  // Draw first point.
  // Find the GraphStyle corresponding to this point.
  let style = graphLine.getGraphStyle(iter.getIndex());
  if (style.drawMode == DrawingMode.DOTS) {
    const x = coordMap.simToScreenX(next.x);
    const y = coordMap.simToScreenY(next.y);
    const w = style.lineWidth;
    context.fillStyle = style.color_;
    context.fillRect(x, y, w, w);
  }
  while (iter.hasNext()) {
    const last = next;
    next = iter.nextValue();
    // if same point then don't draw again
    if (next.x == last.x && next.y == last.y)
      continue;
    // find the GraphStyle corresponding to this point
    style = graphLine.getGraphStyle(iter.getIndex());
    // Avoid drawing nonsense lines in a graph, like when the pendulum
    // moves over the 0 to 2Pi boundary.  The sequence number changes
    // when there is a discontinuity, so don't draw a line in this case.
    const continuous = next.seqX == last.seqX && next.seqY == last.seqY;
    if (style.drawMode == DrawingMode.DOTS || !continuous) {
      // Only draw points that are visible.
      if (!simRect.contains(next))
        continue;
      const x = coordMap.simToScreenX(next.x);
      const y = coordMap.simToScreenY(next.y);
      const w = style.lineWidth;
      context.fillStyle = style.color_;
      context.fillRect(x, y, w, w);
    } else {
      // Don't draw lines that are not possibly visible.
      if (!simRect.maybeVisible(last, next)) {
        continue;
      }
      const x1 = coordMap.simToScreenX(last.x);
      const y1 = coordMap.simToScreenY(last.y);
      const x2 = coordMap.simToScreenX(next.x);
      const y2 = coordMap.simToScreenY(next.y);
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
* @param context the canvas's context to draw into
* @param coordMap the CoordMap specifying sim to screen conversion
*/
private fullDraw(context: CanvasRenderingContext2D, coordMap: CoordMap) {
  // Redraw entire memory list by drawing from oldest point in list
  this.memDraw_ = Util.repeat(-1, this.graphLines_.length);
  this.incrementalDraw(context, coordMap);
};

/** @inheritDoc */
getChanged(): boolean {
  let chg = false;
  for (let i=0, n=this.graphLines_.length; i<n; i++) {
    const c = this.graphLines_[i].getChanged();
    chg = chg || c;
  }
  return chg || this.needRedraw_;
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

/** Returns the screen rectangle that this DisplayGraph is occupying within the
* {@link SimView}, in screen coordinates.
* @return the screen rectangle of this DisplayGraph in screen coordinates
*/
getScreenRect(): ScreenRect {
  return this.screenRect_;
};

/** @inheritDoc */
getSimObjects() : SimObject[] {
  return [];
};

/** Whether this DisplayGraph is drawing into an offscreen buffer.
* @return Whether this DisplayGraph is drawing into an offscreen buffer
*/
getUseBuffer(): boolean {
  return this.useBuffer_;
};

/** @inheritDoc */
getZIndex(): number {
  return this.zIndex;
};

/** Draws only the recent points into the given Graphics context.
* Keeps track of what was the last point drawn.
* @param context the canvas's context to draw into
* @param coordMap the CoordMap specifying sim to screen conversion
*/
private incrementalDraw(context: CanvasRenderingContext2D, coordMap: CoordMap) {
  // draw points from the last drawn (=memDraw) up to the current latest point
  //experiment: fade the graph by drawing a translucent white rectangle
  //const r = this.getScreenRect();
  //context.fillStyle = 'rgba(255,255,255,0.02)';
  //context.fillRect(r.getX(), r.getY(), r.getWidth(), r.getHeight());
  for (let i=0, n=this.graphLines_.length; i<n; i++) {
    this.memDraw_[i] = this.drawPoints(context, coordMap, this.memDraw_[i],
        this.graphLines_[i]);
  }
};

/** @inheritDoc */
isDragable(): boolean {
  return false;
};

/** Remove a GraphLine from set of those to display.
@param graphLine the GraphLine to not display
*/
removeGraphLine(graphLine: GraphLine): void {
  // give nice error message during interactive Terminal scripting
  if (!(graphLine instanceof GraphLine)) {
    throw 'not a GraphLine '+graphLine;
  }
  const idx = this.graphLines_.indexOf(graphLine);
  if (idx < 0)
    throw 'not found '+graphLine;
  this.graphLines_.splice(idx, 1);
  this.memDraw_.splice(idx, 1);
  Util.assert(!this.graphLines_.includes(graphLine));
  this.needRedraw_ = true;
};

/** Causes entire graph to be redrawn, when {@link draw} is next called.
*/
reset(): void {
  this.memDraw_ = Util.repeat(-1, this.graphLines_.length);
  this.needRedraw_ = true;
};

/** @inheritDoc */
setDragable(_dragable: boolean): void {
};

/** @inheritDoc */
setPosition(_position: GenericVector): void {
  //throw ''; // unsupported
};

/** Sets the screen rectangle that this DisplayGraph should occupy within the
* {@link SimView}, in screen coordinates.
* @param screenRect the screen coordinates of the area this DisplayGraph should occupy.
*/
setScreenRect(screenRect: ScreenRect): void {
  this.screenRect_ = screenRect;
  this.offScreen_ = null; // force reallocation of offscreen
  this.needRedraw_ = true;
};

/** Whether to draw into an offscreen buffer.  A *time graph* must redraw every
* frame, so it saves time to *not* use an offscreen buffer in that case.
* @param value Whether to draw into an offscreen buffer
*/
setUseBuffer(value: boolean): void {
  if (value != this.useBuffer_) {
    this.useBuffer_ = value;
    if (!this.useBuffer_) {
      this.offScreen_ = null;
    }
  }
};

/** @inheritDoc */
setZIndex(zIndex: number): void {
  this.zIndex = zIndex !== undefined ? zIndex : 0;
  this.needRedraw_ = true;
};

} // end class

Util.defineGlobal('lab$graph$DisplayGraph', DisplayGraph);