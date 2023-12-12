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
import { DoubleRect } from '../util/DoubleRect.js'
import { MassObject } from "../model/MassObject.js"
import { HorizAlign } from '../view/HorizAlign.js'
import { SimObject } from "../model/SimObject.js"
import { Util } from '../util/Util.js'
import { Vector, GenericVector } from "../util/Vector.js"
import { VerticalAlign } from '../view/VerticalAlign.js'

/** Draws linear horizontal and vertical axes within a given simulation coordinates
rectangle. The simulation rectangle determines where the axes are drawn, and the
numbering scale shown, see {@link DisplayAxes.setSimRect}.

Axes are drawn with numbered tick marks. Axes are labeled with names which can be
specified by {@link DisplayAxes.setHorizName} and {@link DisplayAxes.setVerticalName}.
Axes are drawn using specified font and color, see {@link DisplayAxes.setColor} and
{@link DisplayAxes.setFont}.

Options exist for drawing the vertical axis near the left, center, or right, and for
drawing the horizontal axis near the top, center, or bottom of the screen. See
{@link DisplayAxes.setXAxisAlignment} and {@link DisplayAxes.setYAxisAlignment}.

You can set the axes alignment to go thru particular points, like the origin:
```js
axes.setXAxisAlignment(VerticalAlign.VALUE, 0);
axes.setYAxisAlignment(HorizAlign.VALUE, 0);
```
To keep the DisplayAxes in sync with a {@link lab/view/SimView.SimView}, when
doing for example pan/zoom of the SimView, you can arrange for
{@link DisplayAxes.setSimRect} to be called by an Observer. See for example
{@link sims/common/CommonControls.CommonControls.makeAxes} which makes a
{@link lab/util/Observe.GenericObserver} that keeps the DisplayAxes in sync with
the SimView.

**TO DO**  add option to set the number of tick marks (instead of automatic)?

*/
export class DisplayAxes implements DisplayObject {
  /** bounds rectangle of area to draw */
  private simRect_: DoubleRect;
  /** the font to use for drawing numbers and text on the axis
  * Oct 2014: increased from 10pt to 14pt because standard canvas is now larger
  */
  private numFont_: string;
  /** the color to draw the axes with */
  private drawColor_: string;
  /**  Font descent in pixels (guesstimate).
  * **TO DO** find a way to get this for the current font, similar to the
  * TextMetrics object.
  * http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript
  * http://pomax.nihongoresources.com/pages/Font.js/
  */
  fontDescent: number = 8;
  /**  Font ascent in pixels (guesstimate). */
  fontAscent: number = 12;
  /** The number on vertical axis to align with when using VerticalAlign.VALUE */
  horizAlignValue_: number = 0;
  /** location of the horizontal axis */
  private horizAxisAlignment_: VerticalAlign = VerticalAlign.VALUE;
  /** The number on horizontal axis to align with when using HorizAlign.VALUE */
  vertAlignValue_: number = 0;
  /** location of the vertical axis */
  private vertAxisAlignment_: HorizAlign = HorizAlign.VALUE;
  /**  Number of fractional decimal places to show. */
  private numDecimal_: number = 0;
  private changed_: boolean = true;
  /** name of horizontal axis */
  private horizName_: string = 'x';
  /** name of vertical axis */
  private verticalName_: string = 'y';
  zIndex: number = 100;

/**
* @param opt_simRect the area to draw axes for in simulation coordinates.
* @param opt_font the Font to draw numbers and names of axes with
* @param opt_color the Color to draw the axes with
*/
constructor(opt_simRect?: DoubleRect, opt_font?: string, opt_color?: string) {
  this.simRect_ = opt_simRect ?? DoubleRect.EMPTY_RECT;
  this.numFont_ = opt_font ?? '14pt sans-serif';
  this.drawColor_ = opt_color ?? 'gray';
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
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

/** @inheritDoc */
toStringShort() {
  return 'DisplayAxes{horizName_: "'+this.horizName_
      +'", verticalName_: "'+this.verticalName_+'"}';
};

/** @inheritDoc */
contains(_p_world: Vector): boolean {
  return false;
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  //Draws both horizontal and vertical axes, getting the size of the axes from the
  //simulation rectangle
  context.save();
  context.strokeStyle = this.drawColor_;
  context.fillStyle = this.drawColor_;
  context.font = this.numFont_;
  context.textAlign = 'start';
  context.textBaseline = 'alphabetic';
  // figure where to draw axes
  let x0, y0;  // screen coords of axes, the point where the axes intersect
  const r = this.simRect_;
  const sim_x1 = r.getLeft();
  const sim_x2 = r.getRight();
  const sim_y1 = r.getBottom();
  const sim_y2 = r.getTop();
  const sim_right = sim_x2 - 0.06*(sim_x2 - sim_x1);
  const sim_left = sim_x1 + 0.01*(sim_x2 - sim_x1);
  switch (this.vertAxisAlignment_) {
    case HorizAlign.VALUE:
      // if the value is not visible, then use RIGHT or LEFT alignment
      let sim_v = this.vertAlignValue_;
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

  const scr_top = map.simToScreenY(sim_y2);
  const scr_bottom = map.simToScreenY(sim_y1);
  const lineHeight = 10 + this.fontDescent + this.fontAscent;
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
};

/** Draws the tick marks for the horizontal axis.
@param y0 the vertical placement of the horizontal axis, in screen coords
@param context the canvas's context to draw into
@param map the mapping to use for translating between simulation and screen coordinates
@param r the view area in simulation coords
*/
private drawHorizTicks(y0: number, context: CanvasRenderingContext2D, map: CoordMap,
    r: DoubleRect) {
  const y1 = y0 - 4;  // bottom edge of tick mark
  const y2 = y1 + 8;  // top edge of tick mark
  const sim_x1 = r.getLeft();
  const sim_x2 = r.getRight();
  const graphDelta = this.getNiceIncrement(sim_x2 - sim_x1);
  let x_sim = DisplayAxes.getNiceStart(sim_x1, graphDelta);
  while (x_sim < sim_x2) {
    const x_screen = map.simToScreenX(x_sim);
    context.beginPath(); // draw a tick mark
    context.moveTo(x_screen, y1);
    context.lineTo(x_screen, y2);
    context.stroke();
    const next_x_sim = x_sim + graphDelta;  // next tick mark location
    if (next_x_sim > x_sim) {
      // draw a number
      const s = x_sim.toFixed(this.numDecimal_);
      const textWidth = context.measureText(s).width;
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
  const w = context.measureText(this.horizName_).width;
  //console.log('drawHorizName '+hname
  //  +' x='+(map.simToScreenX(sim_x2) - w - 5)
  //  +' y='+(y0 - 8));
  context.fillText(this.horizName_, map.simToScreenX(sim_x2) - w - 5,   y0 - 8);
};

/** Draws the tick marks for the vertical axis.
@param x0 the horizontal placement of the vertical axis, in screen coords
@param context the canvas's context to draw into
@param map the mapping to use for translating between simulation and screen coordinates
@param r the view area in simulation coords
*/
private drawVertTicks(x0: number, context: CanvasRenderingContext2D, map: CoordMap,
    r: DoubleRect) {
  const x1 = x0 - 4;  // left edge of tick mark
  const x2 = x1 + 8;  // right edge of tick mark
  const sim_y1 = r.getBottom();
  const sim_y2 = r.getTop();
  const graphDelta = this.getNiceIncrement(sim_y2 - sim_y1);
  let y_sim = DisplayAxes.getNiceStart(sim_y1, graphDelta);
  while (y_sim < sim_y2) {
    const y_screen = map.simToScreenY(y_sim);
    context.beginPath(); // draw a tick mark
    context.moveTo(x1, y_screen);
    context.lineTo(x2, y_screen);
    context.stroke();
    const next_y_sim = y_sim + graphDelta;
    if (next_y_sim > y_sim) {
      // draw a number
      const s = y_sim.toFixed(this.numDecimal_);
      const textWidth = context.measureText(s).width;
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
  const w = context.measureText(this.verticalName_).width;
  if (this.vertAxisAlignment_ === HorizAlign.RIGHT) {
    context.fillText(this.verticalName_, x0 - (w+6), map.simToScreenY(sim_y2) + 13);
  } else { // LEFT is default
    context.fillText(this.verticalName_, x0 + 6, map.simToScreenY(sim_y2) + 13);
  }
};

/** @inheritDoc */
getChanged(): boolean {
  if (this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Returns the color to draw the graph axes with.
@return the color to draw the graph axes with
*/
getColor(): string {
  return this.drawColor_;
};

/** Returns the font to draw the graph axes with.
@return the font to draw the graph axes with
*/
getFont(): string {
  return this.numFont_;
};

/** Returns the name shown next to the horizontal axis.
@return the name of the horizontal axis.
*/
getHorizName(): string {
  return this.horizName_;
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [];
};

/** Returns an increment to use for spacing of tick marks on an axis.
The increment should be a 'round' number, with few fractional decimal places.
It should divide the given range into around 5 to 7 pieces.

Side effect: modifies the number of fractional digits to show

@param range the span of the axis
@return an increment to use for spacing of tick marks on an axis.
*/
private getNiceIncrement(range: number): number {
  // First, scale the range to within 1 to 10.
  const power = Math.pow(10, Math.floor(Math.log(range)/Math.LN10));
  const logTot = range/power;
  // logTot should be in the range from 1.0 to 9.999
  let incr;
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
  const dlog = Math.log(incr)/Math.LN10;
  this.numDecimal_ = (dlog < 0) ? Math.ceil(-dlog) : 0;
  return incr;
};

/** Returns the starting value for the tick marks on an axis.
@param start  the lowest value on the axis
@param incr  the increment between tick marks on the axis
@return the starting value for the tick marks on the axis.
*/
private static getNiceStart(start: number, incr: number): number {
  // gives the first nice increment just greater than the starting number
  return Math.ceil(start/incr)*incr;
};

/** @inheritDoc */
getPosition(): Vector {
  return Vector.ORIGIN;
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return [];
};

/** Returns the bounding rectangle for this DisplayAxes in simulation coordinates,
which determines the numbering scale shown.
@return the bounding rectangle for this
    DisplayAxes in simulation coordinates.
*/
getSimRect(): DoubleRect {
  return this.simRect_;
};

/** Returns the name shown next to the vertical axis.
@return the name of the vertical axis.
*/
getVerticalName(): string {
  return this.verticalName_;
};

/** Returns the X-axis alignment: whether it should appear at bottom, top or middle of
the simulation rectangle.
@return X-axis alignment option from {@link lab/view/VerticalAlign.VerticalAlign}
*/
getXAxisAlignment(): VerticalAlign {
  return this.horizAxisAlignment_;
};

/** Returns the Y-axis alignment : whether it should appear at left, right or middle of
the simulation rectangle.
@return Y-axis alignment option from {@link lab/view/HorizAlign.HorizAlign}
*/
getYAxisAlignment(): HorizAlign {
  return this.vertAxisAlignment_;
};

/** @inheritDoc */
getZIndex(): number {
  return this.zIndex;
};

/** @inheritDoc */
isDragable(): boolean {
  return false;
};

/** Set the color to draw the graph axes with.
@param color the color to draw the graph axes with
*/
setColor(color: string) {
  this.drawColor_ = color;
  this.changed_ = true;
};

/** @inheritDoc */
setDragable(_dragable: boolean): void {
};

/** Set the font to draw the graph axes with.
@param font the font to draw the graph axes with
*/
setFont(font: string): void {
  this.numFont_ = font;
  this.changed_ = true;
};

/** Sets the name shown next to the horizontal axis
@param name name of the horizontal axis
*/
setHorizName(name: string): void {
  this.horizName_ = name;
  this.changed_ = true;
};

/** @inheritDoc */
setPosition(_position: GenericVector): void {
};

/** Sets the bounding rectangle for this DisplayAxes in simulation coordinates; this
determines the numbering scale shown.
@param simRect the bounding rectangle for this
    DisplayAxes in simulation coordinates.
*/
setSimRect(simRect: DoubleRect): void {
  this.simRect_ = simRect;
  this.changed_ = true;
};

/** Sets the name shown next to the vertical axis
@param name name of the vertical axis
*/
setVerticalName(name: string): void {
  this.verticalName_ = name;
  this.changed_ = true;
};

/** Sets the X-axis alignment: whether it should appear at bottom, top or middle of the
simulation rectangle, or go thru a particular value of the Y-axis.
@param alignment X-axis alignment option from
    {@link lab/view/VerticalAlign.VerticalAlign}
@param value number on vertical axis to align with when using
     {@link lab/view/VerticalAlign.VerticalAlign.VALUE}
@return this object for chaining setters
*/
setXAxisAlignment(alignment: VerticalAlign, value?: number): DisplayAxes {
  this.horizAxisAlignment_ = alignment;
  if (typeof value === 'number') {
    this.horizAlignValue_ = value;
  }
  this.changed_ = true;
  return this;
};

/** Sets the Y-axis alignment: whether it should appear at left, right or middle of the
simulation rectangle, or go thru a particular value of the X-axis.
@param alignment Y-axis alignment option from {@link lab/view/HorizAlign.HorizAlign}
@param value number on horizontal axis to align with when using
     {@link lab/view/HorizAlign.HorizAlign.VALUE}
@return this object for chaining setters
*/
setYAxisAlignment(alignment: HorizAlign, value?: number): DisplayAxes {
  this.vertAxisAlignment_ = alignment;
  if (typeof value === 'number') {
    this.vertAlignValue_ = value;
  }
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setZIndex(zIndex: number): void {
  if (zIndex !== undefined) {
    this.zIndex = zIndex;
  }
  this.changed_ = true;
};

} // end class
Util.defineGlobal('lab$graph$DisplayAxes', DisplayAxes);
