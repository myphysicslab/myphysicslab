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
import { EnergySystem, EnergyInfo } from '../model/EnergySystem.js'
import { MassObject } from "../model/MassObject.js"
import { ScreenRect } from '../view/ScreenRect.js'
import { SimObject } from '../model/SimObject.js'
import { Util } from '../util/Util.js'
import { Vector, GenericVector } from '../util/Vector.js'

/** Displays a bar graph of the various forms of energy (potential, kinetic, etc.) in an
{@link EnergySystem}. The visible area must be set via
{@link EnergyBarGraph.setVisibleArea} in order for EnergyBarGraph to draw.

### Display Formats

If the {@link EnergyInfo} of the EnergySystem only has data for
the potential and translational energy, then the names shown are 'potential' and
'kinetic' (in English, the names are translated for the current locale). Here is the
display for a typical situation:
```text
 0                2                4                 6                 8
 ---------- potential ----------  *********** kinetic ***********
                                                         total  ^
```

If the EnergyInfo returns a value other than `NaN` for the **rotational energy**, then
the the names shown are 'potential', 'translational', and 'rotational'. Here is the
display for a typical situation:

```text
 0                2                4                 6                 8
 ----- potential -----  ***** rotational *****  ===== translational ======
                                                                  total  ^
```

When potential energy is positive, all the energy components are on the same line of
the graph, as shown above.

When **potential energy is negative**, the potential energy is shown on a
separate line of the bar graph, extending left from the zero position; the kinetic and
rotational energy is drawn underneath the potential energy bar starting from the left.
Here is a typical situation:

```text
     -2               0               2                 4
 ----- potential -----
 ******* rotational *******  ===== translational ======
                                                total ^
```

EnergyBarGraph draws with a transparent white rectangle to ensure it is readable
against a black background.

### Color and Font

Public properties can be set for changing the color of the bars and the font used.
See {@link EnergyBarGraph.graphFont}, {@link EnergyBarGraph.potentialColor},
{@link EnergyBarGraph.translationColor}, and {@link EnergyBarGraph.rotationColor}.

### Position and Size

The EnergyBarGraph will only draw after the visible area has been set via
{@link EnergyBarGraph.setVisibleArea}. Usually this is set to be the entire visible
area of the {@link lab/view/SimView.SimView} containing the EnergyBarGraph.
Here is an example script to do that:

```js
var r = simView.getCoordMap().screenToSimRect(simView.getScreenRect());
energyBarGraph.setVisibleArea(r);
```

The width of the EnergyBarGraph is always the full width of the visible area.

The vertical position of the EnergyBarGraph is initially at the top of the visible area.
If the EnergyBarGraph is not moved, then whenever the visible area is changed we
continue to align the EnergyBarGraph at the top of the visible area.

Once the EnergyBarGraph is moved via {@link EnergyBarGraph.setPosition}, we retain that
vertical position when the visible area changes, except that we ensure the
EnergyBarGraph is entirely within the visible area.

**TO DO** Create some unit tests for this? It is complex enough that it could benefit.
For example, see the kludge about 'energy is zero at startup' which previously resulted
in an assertion failing.

**TO DO** larger fonts (size 14) have formatting problems where the text is overlapping
the color key and other pieces of text. (Nov 2012)

*/
export class EnergyBarGraph implements DisplayObject {
  /** The font to use for numbers on the bar chart energy graph, a CSS3 font
  * specification.
  */
  graphFont: string = '10pt sans-serif';
  private system_: EnergySystem;
  /** the bounding rectangle, in simulation coords */
  private rect_: DoubleRect = DoubleRect.EMPTY_RECT;
  /**  Font ascent in pixels (guesstimate).
  * TO DO find a way to get this for the current font, similar to the
  * TextMetrics object.
  * http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript
  * http://pomax.nihongoresources.com/pages/Font.js/
  */
  private fontDescent_: number = 8;
  /** Font ascent in pixels (guesstimate). */
  private fontAscent_: number = 12;
  /** where zero energy is in pixels */
  private graphOrigin_: number = 0;
  private leftEdge_: number = 0; // pixels
  private rightEdge_: number = 0; // pixels
  private graphFactor_: number = 10;  // scale factor from energy to pixels
  private graphDelta_: number = 2;  // spacing of the numbers in the bar chart
  private needRescale_: boolean = true;
  // Whether to draw a semi-transparent white rectangle, in case background is black.
  private drawBackground_: boolean = true;
  /** Color of the potential energy bar, a CSS3 color value */
  potentialColor: string = '#666';  // dark gray
  /** Color of the translation energy bar, a CSS3 color value */
  translationColor: string = '#999'; // gray
  /** Color of the rotational energy bar, a CSS3 color value */
  rotationColor: string = '#ccc'; //lightGray;
  // when we last checked whether to rescale for small range.
  // we don't want to change the total energy display so fast you can't read it.
  private lastTime_: number = Util.systemTime();
  private lastTime2_: number = 0;
  private totalEnergyDisplay_: number = 0;  // the total energy now being displayed
  private lastEnergyDisplay_: number = 0;  // the total energy that was last displayed
  private totalDigits_: number = 1; // number of digits to show for total energy
  // how long to display the total energy
  private readonly totalEnergyPeriod_: number = 0.3; 
  /** when total energy was last calculated */
  private lastTotalEnergyTime_: number = Number.NEGATIVE_INFINITY;
  private megaMinEnergy_: number = 0;
  private megaMaxEnergy_: number = 0;
  private minEnergy_: number = 0;
  private maxEnergy_: number = 0;
  private totalEnergy_: number = 0;
  private readonly BUFFER_: number = 12;
  // Each slot in history has the most negative minEnergy during each second for the
  // last BUFFER_ seconds.
  private history_: number[] = new Array(this.BUFFER_);
  private bufptr_: number = 0; // pointer to next slot in history
  private dragable_: boolean = true;
  private visibleRect_: DoubleRect = DoubleRect.EMPTY_RECT;
  private needResize_: boolean = true;
  zIndex: number = 0;
  private changed_: boolean = true;
  private readonly debug_: boolean = false;

/**
* @param system the EnergySystem to display
*/
constructor(system: EnergySystem) {
  this.system_ = system;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', visibleRect: '+this.visibleRect_
      +', rect: '+this.rect_
      +', needRescale: '+this.needRescale_
      +', leftEdge: '+Util.NF(this.leftEdge_)
      +', rightEdge: '+Util.NF(this.rightEdge_)
      +', graphOrigin: '+Util.NF(this.graphOrigin_)
      +', graphFactor: '+Util.NF(this.graphFactor_)
      +', minHistory: '+Util.NF(this.minHistory())
      +', minEnergy: '+Util.NF(this.minEnergy_)
      +', megaMinEnergy: '+Util.NF(this.megaMinEnergy_)
      +', megaMinEnergyLoc: '+Math.floor(this.graphOrigin_ + 0.5 +
            this.graphFactor_*this.megaMinEnergy_)
      +', maxEnergy: '+Util.NF(this.maxEnergy_)
      +', megaMaxEnergy: '+Util.NF(this.megaMaxEnergy_)
      +', totalEnergy: '+Util.NF(this.totalEnergy_)
      +', time: '+Util.NF(Util.systemTime()-this.lastTime_)
      +', zIndex: '+this.zIndex
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'EnergyBarGraph{system: '+this.system_.toStringShort()+'}';
};

/** @inheritDoc */
contains(point: Vector): boolean {
  return this.rect_.contains(point);
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  if (this.visibleRect_.isEmpty())
    return;
  context.save();
  context.font = this.graphFont;
  context.textAlign = 'start';
  context.textBaseline = 'alphabetic';
  const e = this.system_.getEnergyInfo();
  const te = e.getTranslational();
  const pe = e.getPotential();
  const re = e.getRotational();
  let tes2 = EnergyBarGraph.i18n.TRANSLATIONAL_ENERGY+',';
  if (isNaN(re)) {
    tes2 = EnergyBarGraph.i18n.KINETIC_ENERGY+',';
  }
  const height2 = EnergyBarGraph.TOP_MARGIN + 3 * EnergyBarGraph.HEIGHT
      + this.fontAscent_ + 8 + this.fontDescent_;
  const h2 = map.screenToSimScaleY(height2);
  // NOTE WELL: this.rect_ is empty first time thru here!
  if (this.needResize_ || this.rect_.isEmpty()
      || Util.veryDifferent(h2, this.rect_.getHeight())) {
    if (this.debug_ && Util.DEBUG) {
      console.log('h2 = '+h2+' this.rect_.getHeight='+this.rect_.getHeight());
    }
    this.resizeRect(h2);
  }
  if (this.debug_ && Util.DEBUG) {
    const r = map.simToScreenRect(this.rect_);
    context.fillStyle = 'rgba(255,255,0,0.5)'; // transparent yellow
    context.fillRect(r.getLeft(), r.getTop(), r.getWidth(), r.getHeight());
  }
  this.leftEdge_ = map.simToScreenX(this.rect_.getLeft()) + EnergyBarGraph.LEFT_MARGIN;
  this.rightEdge_ = map.simToScreenX(this.rect_.getRight())
      - EnergyBarGraph.RIGHT_MARGIN;
  const maxWidth = this.rightEdge_ - this.leftEdge_;
  const top = map.simToScreenY(this.rect_.getTop());
  if (this.drawBackground_) {
    // draw a semi-transparent white rectangle, in case background is black
    context.fillStyle = 'rgba(255,255,255,0.75)'; // transparent white
    context.fillRect(this.leftEdge_- EnergyBarGraph.LEFT_MARGIN,
        top + EnergyBarGraph.TOP_MARGIN,
        maxWidth + EnergyBarGraph.LEFT_MARGIN + EnergyBarGraph.RIGHT_MARGIN,
        height2);
  }
  // for debugging:  draw outline
  if (this.debug_ && Util.DEBUG) {
    context.strokeStyle = '#90c'; // purple
    context.strokeRect(this.leftEdge_- EnergyBarGraph.LEFT_MARGIN,
        top + EnergyBarGraph.TOP_MARGIN,
        maxWidth+EnergyBarGraph.LEFT_MARGIN+EnergyBarGraph.RIGHT_MARGIN,
        height2);
  }
  //g.setColor(Color.red);  // for debugging, draw outline in red
  //g.drawRect(left, top, width, height);
  this.totalEnergy_ = te + pe + (isNaN(re) ? 0 : re);
  Util.assert(Math.abs(this.totalEnergy_ - e.getTotalEnergy()) < 1e-12);
  // find the minimum and maximum energy being graphed
  this.minEnergy_ = pe < 0 ? pe : 0;
  this.maxEnergy_ = this.totalEnergy_ > 0 ? this.totalEnergy_ : 0;
  // update the total energy displayed, but not so often you can't read it
  if (Util.systemTime()-this.lastTotalEnergyTime_ > this.totalEnergyPeriod_){
    this.lastTotalEnergyTime_ = Util.systemTime();
    this.lastEnergyDisplay_ = this.totalEnergyDisplay_;
    this.totalEnergyDisplay_ = e.getTotalEnergy();
  }
  //console.log('pe='+pe+'  energy bar total='+total+' maxWidth='+maxWidth);
  this.rescale(maxWidth);
  let w = this.graphOrigin_;
  let w2 = 0;
  // draw a bar chart of the various energy types.
  context.fillStyle = this.potentialColor;
  if (pe < 0) {
    w2 = Math.floor(0.5 - pe*this.graphFactor_);
    context.fillRect(w-w2, top + EnergyBarGraph.TOP_MARGIN, w2,
        EnergyBarGraph.HEIGHT);
    w = w - w2;
  } else {
    w2 = Math.floor(0.5+pe*this.graphFactor_);
    context.fillRect(w, top + EnergyBarGraph.HEIGHT+EnergyBarGraph.TOP_MARGIN, w2,
        EnergyBarGraph.HEIGHT);
    w += w2;
  }
  if (!isNaN(re)) {
    w2 = Math.floor(0.5 + re*this.graphFactor_);
    context.fillStyle = this.rotationColor;
    context.fillRect(w, top + EnergyBarGraph.HEIGHT+EnergyBarGraph.TOP_MARGIN, w2,
        EnergyBarGraph.HEIGHT);
    w += w2;
  }
  w2 = Math.floor(0.5 + te*this.graphFactor_);
  // To stabilize the width of the bar and prevent flickering at the right edge
  // due to rounding in sims where energy is constant,
  // we find where the total should be.
  const totalLoc = this.graphOrigin_ +
    Math.floor(0.5 + this.totalEnergy_ * this.graphFactor_);
  // check this is no more than 2 pixels away from the 'flicker' way to calc.
  Util.assert(Math.abs(w + w2 - totalLoc) <= 2);
  w2 = totalLoc - w;
  context.fillStyle = this.translationColor;
  context.fillRect(w, top + EnergyBarGraph.HEIGHT+EnergyBarGraph.TOP_MARGIN, w2,
      EnergyBarGraph.HEIGHT);
  // rightEnergy = energy at right-hand edge of the display
  const rightEnergy = (this.rightEdge_ - this.graphOrigin_)/this.graphFactor_;
  const y = this.drawScale(context,
        /*left=*/this.leftEdge_,
        /*top=*/top + EnergyBarGraph.HEIGHT + EnergyBarGraph.TOP_MARGIN,
        /*total=*/rightEnergy);
  // draw legend:  boxes and text
  let x = this.leftEdge_;
  x = this.drawLegend(context, EnergyBarGraph.i18n.POTENTIAL_ENERGY+',',
      this.potentialColor, /*filled=*/true, x, y);
  if (!isNaN(re)) {
    x = this.drawLegend(context, EnergyBarGraph.i18n.ROTATIONAL_ENERGY+',',
      this.rotationColor, /*filled=*/true, x, y);
  }
  x = this.drawLegend(context, tes2, this.translationColor, /*filled=*/true, x, y);
  x = this.drawTotalEnergy(context, x, y);
  context.restore();
};

/**
* @param context the canvas's context to draw into
* @param s
* @param c  CSS3 color
* @param filled
* @param x
* @param y
*/
private drawLegend(context: CanvasRenderingContext2D, s: string, c: string,
    filled: boolean, x: number, y: number): number {
  const BOX = 10;
  if (filled) {
    context.fillStyle = c;
    context.fillRect(x, y, BOX, BOX);
  } else {
    context.strokeStyle = c;
    context.strokeRect(x, y, BOX, BOX);
  }
  x += BOX + 3;
  const textWidth = context.measureText(s).width;
  context.fillStyle = '#000'; // black
  context.fillText(s, x, y+this.fontAscent_);
  x += textWidth+5;
  return x;
};

/** Draws the numeric scale for the bar chart.
@param context the canvas's context to draw into
@param left
@param top
@param total
*/
private drawScale(context: CanvasRenderingContext2D, left: number, top: number,
    total: number): number {
  const graphAscent = this.fontAscent_;
  // don't draw anything when total is zero.
  if (Math.abs(total) > 1E-18 && this.graphDelta_ > 1E-18) {
    context.fillStyle = '#000'; // black
    context.strokeStyle = '#000'; // black
    let scale = 0;
    // draw positive part of scale, from 0 to total
    let loopCtr = 0;
    do {
      const x = this.graphOrigin_ + Math.floor(scale*this.graphFactor_);
      context.beginPath();
      context.moveTo(x, top+EnergyBarGraph.HEIGHT/2);
      context.lineTo(x, top+EnergyBarGraph.HEIGHT+2);
      context.stroke();
      const s = EnergyBarGraph.numberFormat1(scale);
      const textWidth = context.measureText(s).width;
      context.fillText(s, x -textWidth/2, top+EnergyBarGraph.HEIGHT+graphAscent+3);
      scale += this.graphDelta_;
      if (this.debug_ && Util.DEBUG && ++loopCtr > 100) {
        console.log('loop 1 x='+x+' s='+s+' scale='+Util.NFE(scale)
          +' total='+Util.NFE(total)+' graphDelta='+Util.NFE(this.graphDelta_)  );
      }
    } while (scale < total + this.graphDelta_ + 1E-16);
    if (this.debug_ && Util.DEBUG) {
      console.log('megaMinEnergy='+Util.NFE(this.megaMinEnergy_)
        +' graphDelta='+Util.NFE(this.graphDelta_)
        +' graphFactor='+Util.NFE(this.graphFactor_)
        +' scale='+Util.NFE(scale));
    }
    // draw negative part of scale, from -graphDelta to megaMinEnergy
    if (this.megaMinEnergy_ < -1E-12) {
      scale = -this.graphDelta_;
      let x;
      do {
        x = this.graphOrigin_ + Math.floor(scale*this.graphFactor_);
        context.beginPath();
        context.moveTo(x, top+EnergyBarGraph.HEIGHT/2);
        context.lineTo(x, top+EnergyBarGraph.HEIGHT+2);
        context.stroke();
        const s = EnergyBarGraph.numberFormat1(scale);
        const textWidth = context.measureText(s).width;
        context.fillText(s, x -textWidth/2, top+EnergyBarGraph.HEIGHT+graphAscent+3);
        scale -= this.graphDelta_;
        if (this.debug_ && Util.DEBUG) {
          console.log('loop 2 x='+x+' s='+s+' scale='+Util.NFE(scale)
            +' megaMinEnergy='+Util.NFE(this.megaMinEnergy_) );
        }
      } while (scale > this.megaMinEnergy_ && x >= left);
    }
  }
  return top+EnergyBarGraph.HEIGHT+graphAscent+3+this.fontDescent_;
};

/**
* @param context the canvas's context to draw into
* @param x
* @param y
*/
private drawTotalEnergy(context: CanvasRenderingContext2D, x: number,
    y: number): number {
  const s = EnergyBarGraph.i18n.TOTAL+' '+
    this.formatTotalEnergy(this.totalEnergyDisplay_, this.lastEnergyDisplay_);
  context.fillStyle = '#000'; // black
  context.fillText(s, x, y+this.fontAscent_);
  return x + context.measureText(s).width + 5;
};

/** Convert number to a string, using a format based on how large the value is,
and the difference from the previous version shown.
Designed to format total energy.
When the total energy does not change (for example when sim is paused)
then we retain the previous setting for number of digits to show.
@param value  the value to be formatted
@param previous  the previous value that was formatted
*/
private formatTotalEnergy(value: number, previous: number): string {
  const diff = Math.abs(value - previous);
  if (diff > 1E-15) {
    // number of decimal places is based on difference to previous value
    const logDiff = -Math.floor(Math.log(diff)/Math.log(10));
    const digits = logDiff > 0 ? logDiff : 1;
    this.totalDigits_ = digits < 20 ? digits : 20;
  }
  const v = Math.abs(value);
  const sign = value < 0 ? '-' : '+';
  if (v < 1E-6) {
    return sign + v.toExponential(5);
  } else if (v < 1000) {
    return sign + v.toFixed(this.totalDigits_);
  } else {
    return sign + v.toFixed(this.totalDigits_);
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

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return [];
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [];
};

/** @inheritDoc */
getPosition(): Vector {
  return !this.rect_.isEmpty() ? this.rect_.getCenter() : new Vector(0, 0);
};

/** Returns the area within which this EnergyBarGraph is drawn, in simulation
coordinates.
@return the area within which this
    EnergyBarGraph is drawn, in simulation coordinates.
*/
getVisibleArea(): DoubleRect {
  return this.visibleRect_;
};

/** @inheritDoc */
getZIndex(): number {
  return this.zIndex;
};

/** @inheritDoc */
isDragable(): boolean {
  return this.dragable_;
};

private minHistory(): number {
  let min = 0;
  for (let i=0, len=this.history_.length; i<len; i++) {
    if (this.history_[i] < min)
      min = this.history_[i];
  }
  return min;
};

/** Convert number to a string, using a format based on how large the value is.
Designed to format scale tick marks.
@param value  the value to be formatted
*/
private static numberFormat1(value: number): string {
  const v = Math.abs(value);
  let s;
  // use regexp to remove trailing zeros, and maybe decimal point
  if (v < 1E-16) {
    s = '0';
  } else if (v < 1E-3) {
    s = v.toExponential(3);
    s = s.replace(/\.0+([eE])/, '$1');
    s = s.replace(/(\.\d*[1-9])0+([eE])/, '$1$2');
  } else if (v < 10) {
    s = v.toFixed(4);
    s = s.replace(/\.0+$/, '');
    s = s.replace(/(\.\d*[1-9])0+$/, '$1');
  } else if (v < 100) {
    s = v.toFixed(3);
    s = s.replace(/\.0+$/, '');
    s = s.replace(/(\.\d*[1-9])0+$/, '$1');
  } else if (v < 1000) {
    s = v.toFixed(2);
    s = s.replace(/\.0+$/, '');
    s = s.replace(/(\.[1-9])0$/, '$1');
  } else if (v < 10000) {
    s = v.toFixed(0);
  } else {
    s = v.toExponential(3);
    s = s.replace(/\.0+([eE])/, '$1');
    s = s.replace(/(\.\d*[1-9])0+([eE])/, '$1$2');
  }
  return value < 0 ? '-'+s : s;
};

private printEverything(s: string) {
  if (Util.DEBUG && this.debug_) {
    console.log(s + this);
    //Util.printArray(this.history_);
  }
};

private rescale(maxWidth: number) {
  const time_check = this.timeCheck(this.minEnergy_);
  if (Util.DEBUG) { this.printEverything('(status)'); }
  // keep track of most negative min energy value during this time check period
  this.megaMinEnergy_ = this.minHistory();
  Util.assert(isFinite(this.megaMinEnergy_));
  // Note: Don't rescale when megaMinEnergy is very near to zero.
  if (this.megaMinEnergy_ < -1E-6) {
    // rescale when minEnergy is negative and has gone past left edge
    if (this.graphOrigin_ + Math.floor(0.5 + this.megaMinEnergy_*this.graphFactor_) <
        this.leftEdge_ - EnergyBarGraph.LEFT_MARGIN) {
      if (Util.DEBUG) { this.printEverything('BIG MIN ENERGY'); }
      this.needRescale_ = true;
    }
    if (time_check) {
      // every few seconds, check if minEnergy is staying in smaller negative range
      if (-this.megaMinEnergy_*this.graphFactor_ <
            0.2*(this.graphOrigin_ - this.leftEdge_)) {
        if (Util.DEBUG) { this.printEverything('SMALL MIN ENERGY'); }
        this.needRescale_ = true;
      }
    }
  } else if (this.megaMinEnergy_ > 1E-6) {
    // minEnergy is not negative, ensure left edge is zero
    if (this.graphOrigin_ > this.leftEdge_) {
      if (Util.DEBUG) { this.printEverything('POSITIVE MIN ENERGY'); }
      this.needRescale_ = true;
    }
  } else {
    // megaMinEnergy is small, reset the origin to not show negative numbers
    if (time_check) {
      if (this.graphOrigin_ - this.leftEdge_ > EnergyBarGraph.LEFT_MARGIN) {
        this.needRescale_ = true;
      }
    }
  }
  if (this.totalEnergy_ > this.megaMaxEnergy_)
    this.megaMaxEnergy_ = this.totalEnergy_;
  // Note: Don't rescale when totalEnergy is very near to zero.
  if (this.totalEnergy_ > 1E-12) {
    // rescale when max energy is too big
    if (this.graphOrigin_ + this.totalEnergy_*this.graphFactor_ > this.rightEdge_) {
      this.needRescale_ = true;
      if (Util.DEBUG) { this.printEverything('BIG TOTAL ENERGY'); }
    }
    // rescale when max energy is small,
    // but only when positive part of graph is large compared to negative part.
    if (this.rightEdge_ - this.graphOrigin_ >
            0.2*(this.graphOrigin_ - this.leftEdge_)
        && this.totalEnergy_*this.graphFactor_ <
            0.2*(this.rightEdge_ - this.graphOrigin_)) {
      this.needRescale_ = true;
      this.megaMaxEnergy_ = this.totalEnergy_;
      if (Util.DEBUG) { this.printEverything('SMALL TOTAL ENERGY'); }
    }

  } else if (this.totalEnergy_ < -1E-12) {
    // every few seconds, if total is staying negative, then rescale
    if (time_check) {
      if (this.megaMaxEnergy_ < 0 && this.graphOrigin_ < this.rightEdge_) {
        this.needRescale_ = true;
        if (Util.DEBUG) { this.printEverything('NEGATIVE TOTAL ENERGY'); }
      }
      this.megaMaxEnergy_ = this.totalEnergy_;
    }
  }
  // if graph has gotten too big or too small, reset the scale.
  if (this.needRescale_) {
    this.lastTime_ = Util.systemTime(); // time reset
    this.needRescale_ = false;
    // scale goes from megaMinEnergy to totalEnergy or zero.
    let total = this.totalEnergy_ > 0 ? this.totalEnergy_ : 0;
    total -= this.megaMinEnergy_;
    if (total < 1E-16) {
      // kludge by ERN 11-14-2014; Problem is when energy is zero at startup
      // and EnergyBarGraph is displayed right away.
      // Found in GearsApp when 'show energy' is a remembered command.
      total = 1.0;
    }
    if (total*this.graphFactor_ > maxWidth) { // increasing
      this.graphFactor_ = 0.75*maxWidth/total;
    } else {  // decreasing
      this.graphFactor_ = 0.95*maxWidth/total;
    }
    Util.assert(isFinite(this.graphFactor_));
    if (this.megaMinEnergy_ < -1E-12) {
      this.graphOrigin_ = this.leftEdge_ +
          Math.floor(0.5 + this.graphFactor_ * (-this.megaMinEnergy_));
    } else {
      this.graphOrigin_ = this.leftEdge_;
    }
    const power = Math.pow(10, Math.floor(Math.log(total)/Math.log(10)));
    const logTot = total/power;
    // logTot should be in the range from 1.0 to 9.999
    // choose a nice delta for the numbers on the chart
    if (logTot >= 8)
      this.graphDelta_ = 2;
    else if (logTot >= 5)
      this.graphDelta_ = 1;
    else if (logTot >= 3)
      this.graphDelta_ = 0.5;
    else if (logTot >= 2)
      this.graphDelta_ = 0.4;
    else
      this.graphDelta_ = 0.2;
    this.graphDelta_ *= power;
    //console.log('rescale '+total+' '+logTot+' '+power+' '+this.graphDelta_);
  }
};

private resizeRect(height: number) {
  Util.assert(Util.isObject(this.visibleRect_));
  let top = this.rect_.isEmpty() ?
      this.visibleRect_.getTop() : this.rect_.getTop();
  let bottom = top - height;
  if (top > this.visibleRect_.getTop() || height > this.visibleRect_.getHeight()) {
    top = this.visibleRect_.getTop();
    bottom = top - height;
  } else if (bottom < this.visibleRect_.getBottom()) {
    bottom = this.visibleRect_.getBottom();
    top = bottom + height;
  }
  if (this.debug_ && Util.DEBUG) {
    console.log('resizeRect visibleRect='+this.visibleRect_
      +' rect='+this.rect_+ ' top='+top+' bottom='+bottom);
  }
  this.rect_ = new DoubleRect(this.visibleRect_.getLeft(), bottom,
      this.visibleRect_.getRight(), top);
  if (this.debug_ && Util.DEBUG) {
    console.log('resizeRect new rect='+this.rect_);
  }
  this.needRescale_ = true;
  this.needResize_ = false;
};

/** @inheritDoc */
setDragable(dragable: boolean): void {
  this.dragable_ = dragable;
};

/** @inheritDoc */
setPosition(position: GenericVector): void {
  if (!this.rect_.isEmpty()) {
    const h = this.rect_.getHeight()/2;
    this.rect_ = new DoubleRect(this.rect_.getLeft(), position.getY() - h,
        this.rect_.getRight(), position.getY() + h);
    if (this.debug_ && Util.DEBUG) {
      console.log('setPosition '+this.rect_);
    }
  } else {
    // Make a non-empty rectangle to save the desired vertical position.
    this.rect_ = new DoubleRect(-5, position.getY()-0.5,
        5, position.getY()+0.5);
  }
  this.changed_ = true;
};

/** Sets the area within which this EnergyBarGraph is drawn, in simulation coordinates.
@param visibleArea the area within which this EnergyBarGraph is drawn,
    in simulation coordinates.
*/
setVisibleArea(visibleArea: DoubleRect): void {
  this.visibleRect_ = visibleArea;
  this.needResize_ = true;
  this.changed_ = true;
};

/** @inheritDoc */
setZIndex(zIndex?: number): void {
  this.zIndex = zIndex ?? 0;
  this.changed_ = true;
};

private timeCheck(minEnergy: number): boolean {
  const nowTime = Util.systemTime();
  if (nowTime - this.lastTime2_ > 1.0) {
    this.lastTime2_ = nowTime;
    if (++this.bufptr_ >= this.history_.length)
      this.bufptr_ = 0;
    this.history_[this.bufptr_] = minEnergy;
  } else {
    if (this.minEnergy_ < this.history_[this.bufptr_])
      this.history_[this.bufptr_] = minEnergy;
  }
  if (nowTime - this.lastTime_ > this.BUFFER_) {
    this.lastTime_ = nowTime;
    return true;
  } else {
    return false;
  }
};

static readonly HEIGHT = 10;
static readonly LEFT_MARGIN = 10;
static readonly RIGHT_MARGIN = 0;
static readonly TOP_MARGIN = 0;

static readonly en: i18n_strings = {
  SHOW_ENERGY: 'show energy',
  POTENTIAL_ENERGY: 'potential',
  TRANSLATIONAL_ENERGY: 'translational',
  KINETIC_ENERGY: 'kinetic',
  ROTATIONAL_ENERGY: 'rotational',
  TOTAL: 'total'
};

static readonly de_strings: i18n_strings = {
  SHOW_ENERGY: 'Energie anzeigen',
  POTENTIAL_ENERGY: 'potenzielle',
  TRANSLATIONAL_ENERGY: 'translation',
  KINETIC_ENERGY: 'kinetische',
  ROTATIONAL_ENERGY: 'rotation',
  TOTAL: 'gesamt'
};

static readonly i18n =
    Util.LOCALE === 'de' ? EnergyBarGraph.de_strings : EnergyBarGraph.en;

} // end EnergyBarGraph class

type i18n_strings = {
  SHOW_ENERGY: string,
  POTENTIAL_ENERGY: string,
  TRANSLATIONAL_ENERGY: string,
  KINETIC_ENERGY: string,
  ROTATIONAL_ENERGY: string,
  TOTAL: string
};

Util.defineGlobal('lab$graph$EnergyBarGraph', EnergyBarGraph);
