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

import { CoordMap } from './CoordMap.js'
import { DisplayObject } from './DisplayObject.js'
import { DoubleRect } from '../util/DoubleRect.js'
import { MassObject } from "../model/MassObject.js"
import { SimObject } from '../model/SimObject.js'
import { Util } from '../util/Util.js'
import { Vector, GenericVector } from '../util/Vector.js'

/** Draws a clock with two 'second hands': one tracks the simulation time, the other
tracks real time. This makes it easy to see whether the simulation time is keeping up
with real time.
*/
export class DisplayClock implements DisplayObject {
  private simTimeFn_: ()=>number;
  private realTimeFn_: ()=>number;
  private period_: number;
  private radius_: number;
  private location_: Vector;
  private dragable_: boolean = true;
  /** Font to use for drawing the time, for example '10pt sans-serif'. */
  private font_: string= '14pt sans-serif';
  /** Color to use for drawing the time, a CSS3 color value. */
  private textColor_: string = 'blue';
  /**  Color to draw the second-hand showing simulation time. */
  private handColor_: string = 'blue';
  /**  Color to draw the second-hand showing real time. */
  private realColor_: string = 'red';
  /** Thickness of clock hands, in screen coords (1 means one pixel). */
  private handWidth_: number = 1;
  /** Thickness of outline, in screen coords (1 means one pixel). */
  private outlineWidth_: number = 1;
  /** Color to use for drawing the outline of the clock, a CSS3 color value. */
  private outlineColor_: string = 'black';
  /** Color to fill circle with; default is transparent white so that it is visible
  * over a black background.
  */
  private fillStyle_: string = 'rgba(255, 255, 255, 0.75)';
  private zIndex_: number = 0;
  private changed_: boolean = true;
  /** Last sim time drawn. */
  private lastSimTime_: number = 0;

/**
* @param simTimeFn  function that returns current simulation time
* @param realTimeFn  function that returns current real time
* @param period  Period of clock in seconds, the time it takes for the
*     seconds hand to wrap around; default is 2 seconds.
* @param radius  Radius of clock in simulation coords, default is 1.0.
* @param location  Location of center of clock, in simulation coords.
*/
constructor(simTimeFn: ()=>number, realTimeFn: ()=>number,
    period?: number, radius?: number, location?: Vector) {
  this.simTimeFn_ = simTimeFn;
  this.realTimeFn_ = realTimeFn;
  /** Period of clock in seconds, the time it takes for the seconds hand to wrap around
  */
  this.period_ = period ?? 2.0;
  /** Radius of clock in simulation coords */
  this.radius_ = radius ?? 1.0;
  this.location_ = location ?? Vector.ORIGIN;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', radius: '+Util.NF(this.radius_)
      +', period: '+Util.NF(this.period_)
      +', location_: '+this.location_
      +', zIndex: '+this.zIndex_
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'DisplayClock{'+'time: '+Util.NF(this.simTimeFn_())+'}';
};

/** @inheritDoc */
contains(p_world: Vector): boolean {
  return p_world.distanceTo(this.location_) <= this.radius_;
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  const center = map.simToScreen(this.location_);
  const r = map.simToScreenScaleX(this.radius_);
  // fill circle with transparent white, so that it is visible with black background
  context.save();
  context.beginPath();
  context.arc(center.getX(), center.getY(), r, 0, 2*Math.PI, false);
  context.closePath();
  context.lineWidth = this.outlineWidth_;
  context.strokeStyle = this.outlineColor_;
  context.stroke();
  context.fillStyle = this.fillStyle_;
  context.fill();
  const time = this.simTimeFn_();
  this.lastSimTime_ = time;
  const realTime = this.realTimeFn_();
  this.drawHand(context, map, this.handColor_, time, center);
  // show the real-time hand
  this.drawHand(context, map, this.realColor_, realTime, center);
  const tx = time.toFixed(3);
  context.fillStyle = this.textColor_;
  context.font = this.font_;
  context.textAlign = 'center';
  context.fillText(tx, center.getX(), center.getY());
  context.restore();
};

private drawHand(context: CanvasRenderingContext2D, map: CoordMap, color: string,
    time: number, center: Vector) {
  time = time - this.period_ * Math.floor(time/this.period_);
  const fraction = time / this.period_;
  const endx = map.simToScreenScaleX(this.radius_ * Math.sin(2*Math.PI * fraction));
  const endy = map.simToScreenScaleY(this.radius_ * Math.cos(2*Math.PI * fraction));
  context.lineWidth = this.handWidth_;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(center.getX(), center.getY());
  context.lineTo(center.getX() + endx, center.getY() - endy);
  context.stroke();
};

/** @inheritDoc */
isDragable(): boolean {
  return this.dragable_;
};

/** @inheritDoc */
getChanged(): boolean {
  if (this.simTimeFn_() != this.lastSimTime_ || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Returns color to fill circle with; default is transparent white so that it is
* visible over a black background.
* @return a CSS3 color value
*/
getFillStyle(): string {
  return this.fillStyle_;
};

/** Font used when drawing the text, a CSS font specification.
* @return a CSS font specification
*/
getFont(): string {
  return this.font_;
};

/** Returns color to draw the second-hand showing simulation time.
* @return a CSS3 color value
*/
getHandColor(): string {
  return this.handColor_;
};

/** Returns thickness of clock hands, in screen coords (1 means one pixel).
*/
getHandWidth(): number {
  return this.handWidth_;
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [];
};

/** Returns color to draw the second-hand showing real time.
* @return a CSS3 color value
*/
getOutlineColor(): string {
  return this.outlineColor_;
};

/** Returns thickness of outline, in screen coords (1 means one pixel).
*/
getOutlineWidth(): number {
  return this.outlineWidth_;
};

/** @inheritDoc */
getPosition(): Vector {
  return this.location_;
};

/** Returns color to draw the second-hand showing real time.
* @return a CSS3 color value
*/
getRealColor(): string {
  return this.realColor_;
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return [];
};

/** Returns color for drawing the time.
* @return a CSS3 color value
*/
getTextColor(): string {
  return this.textColor_;
};

/** @inheritDoc */
getZIndex(): number {
  return this.zIndex_;
};

/** @inheritDoc */
setDragable(dragable: boolean): void {
  this.dragable_ = dragable;
};

/** Sets color to fill circle with; default is transparent white so that it is
* visible over a black background.
* @param value a CSS3 color value
* @return this object for chaining setters
*/
setFillStyle(value: string): DisplayClock {
  this.fillStyle_ = value;
  this.changed_ = true;
  return this;
};

/** Font used when drawing the text, a CSS font specification.
* @param value a CSS font specification
* @return this object for chaining setters
*/
setFont(value: string): DisplayClock {
  this.font_ = value;
  this.changed_ = true;
  return this;
};

/** Sets color to draw the second-hand showing simulation time.
* @param value a CSS3 color value
* @return this object for chaining setters
*/
setHandColor(value: string): DisplayClock {
  this.handColor_ = value;
  this.changed_ = true;
  return this;
};

/** Sets thickness of clock hands, in screen coords (1 means one pixel).
* @param value
* @return this object for chaining setters
*/
setHandWidth(value: number): DisplayClock {
  this.handWidth_ = value;
  this.changed_ = true;
  return this;
};

/** Sets color to use for drawing the outline of the clock.
* @param value a CSS3 color value
* @return this object for chaining setters
*/
setOutlineColor(value: string): DisplayClock {
  this.outlineColor_ = value;
  this.changed_ = true;
  return this;
};

/** Sets thickness of outline, in screen coords (1 means one pixel).
* @param value
* @return this object for chaining setters
*/
setOutlineWidth(value: number): DisplayClock {
  this.outlineWidth_ = value;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setPosition(position: GenericVector): void {
  this.location_ = Vector.clone(position);
  this.changed_ = true;
};

/** Sets color to draw the second-hand showing real time.
* @param value a CSS3 color value
* @return this object for chaining setters
*/
setRealColor(value: string): DisplayClock {
  this.realColor_ = value;
  this.changed_ = true;
  return this;
};

/** Returns color for drawing the time.
* @param value a CSS3 color value
* @return this object for chaining setters
*/
setTextColor(value: string): DisplayClock {
  this.textColor_ = value;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setZIndex(zIndex?: number): void {
  this.zIndex_ = zIndex !== undefined ? zIndex : 0;
  this.changed_ = true;
};

static readonly en: i18n_strings = {
  SHOW_CLOCK: 'show clock'
};

static readonly de_strings: i18n_strings = {
  SHOW_CLOCK: 'Zeit anzeigen'
};

static readonly i18n = Util.LOCALE === 'de' ? DisplayClock.de_strings :
    DisplayClock.en;

} // end DisplayClock class

type i18n_strings = {
  SHOW_CLOCK: string
};

Util.defineGlobal('lab$view$DisplayClock', DisplayClock);
