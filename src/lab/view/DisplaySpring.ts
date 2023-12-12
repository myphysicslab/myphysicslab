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

import { AffineTransform } from "../util/AffineTransform.js"
import { DisplayObject } from "./DisplayObject.js"
import { Spring } from "../model/Spring.js"
import { SimObject } from "../model/SimObject.js"
import { Util } from "../util/Util.js"
import { Vector, GenericVector } from "../util/Vector.js"
import { CoordMap } from "./CoordMap.js"
import { MassObject } from "../model/MassObject.js"

/** Displays a {@link Spring}. Can show either a jagged or straight line,
see {@link DisplaySpring.setDrawMode}. Can have a different color when compressed or
expanded, see {@link DisplaySpring.setColorCompressed} and
{@link DisplaySpring.setColorExpanded}. The width determines how wide back-and-forth the
jagged lines go, see {@link DisplaySpring.setWidth}.

The position is reported as the midpoint of the Spring by
{@link DisplaySpring.getPosition}. The position is determined by the position of the
Spring, so {@link DisplaySpring.setPosition} has no effect, and the DisplaySpring is
never dragable.
*/
export class DisplaySpring implements DisplayObject {
  private spring_: null|Spring;
  /** How wide back-and-forth the jagged lines go when drawing the Spring,
  * in simulation coordinates.
  */
  private width_?: number;
  /** Color drawn when Spring is compressed to less than its rest length,
  * a CSS3 color value.
  */
  private colorCompressed_?: string;
  /**  Color drawn when Spring is stretched to more than its rest length,
  * a CSS3 color value.
  */
  private colorExpanded_?: string;
  /** Thickness of lines when drawing the Spring, in screen coordinates, so a
  * value of 1 means a 1 pixel thick line.
  */
  private thickness_?: number;
  /** Whether the Spring is drawn {@link DisplaySpring.JAGGED}
  * or {@link DisplaySpring.STRAIGHT}.
  */
  private drawMode_?: number;
  private zIndex_?: number;
  private proto_: null|DisplaySpring;
  private changed_: boolean = true;

/**
* @param spring the Spring to display
* @param proto the prototype DisplaySpring to inherit properties from
*/
constructor(spring?: null|Spring, proto?: null|DisplaySpring) {
  this.spring_ = spring ?? null;
  this.proto_ = proto ?? null;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', width: '+Util.NF(this.getWidth())
      +', colorCompressed: "'+this.getColorCompressed()+'"'
      +', colorExpanded: "'+this.getColorExpanded()+'"'
      +', thickness: '+Util.NF(this.getThickness())
      +', drawMode: '+this.getDrawMode()
      +', zIndex: '+this.getZIndex()
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'DisplaySpring{spring_: '+
      (this.spring_ != null ? this.spring_.toStringShort() : 'null')+'}';
};

/** @inheritDoc */
contains(_p_world: Vector): boolean {
  return false;
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  if (this.spring_ == null) {
    return;
  }
  const len = this.spring_.getLength();
  if (len < 1e-6 || this.spring_.getStiffness()==0) {
    return;
  }
  context.save()
  context.lineWidth = this.getThickness();
  // the 0.00001 factor prevents flickering between red/green when springs are at rest.
  if (len < this.spring_.getRestLength() - 0.00001) {
    context.strokeStyle = this.getColorCompressed();
  } else {
    context.strokeStyle = this.getColorExpanded();
  }
  if (this.getDrawMode() === DisplaySpring.JAGGED) {
    // draw as a jagged line
    // note that the transforms are applied in reverse order  (because of
    // how matrix multiplication works).
    let at = map.getAffineTransform(); // sim to screen transform
    const p1 = this.spring_.getStartPoint();
    const p2 = this.spring_.getEndPoint();
    at = at.translate(p1.getX(), p1.getY());
    const theta = Math.atan2(p2.getY()-p1.getY(), p2.getX()-p1.getX());
    at = at.rotate(theta);
    // stretch out the spring to the desired length & width
    at = at.scale(len/DisplaySpring.pathLength, this.getWidth()/0.5);
    DisplaySpring.drawSpring(context, at);
  } else {
    // draw as a straight line
    const p1 = map.simToScreen(this.spring_.getStartPoint());
    const p2 = map.simToScreen(this.spring_.getEndPoint());
    context.beginPath();
    context.moveTo(p1.getX(), p1.getY());
    context.lineTo(p2.getX(), p2.getY());
    context.stroke();
  }
  context.restore();
};

/** Draws the spring using the given AffineTransform, which specifies the
* combination of translating, stretching, rotating the spring to its
* current position, and also the sim-to-screen transform.
* The path is drawn into a size of 6.0 long by 0.5 wide, so that when it is
* scaled up or down, it doesn't get too distorted.
* @param context the canvas's context to draw into
* @param at transform to apply to each point
*/
static drawSpring(context: CanvasRenderingContext2D, at: AffineTransform) {
  const size = DisplaySpring.pathLength;
  const t = DisplaySpring.pathWidth/2; // half thickness of spring
  const w = size / 16;
  context.beginPath();
  at.moveTo(0, 0, context);
  at.lineTo(w, 0, context);   // from start point
  at.lineTo(2*w, t, context);  // ramp up
  for (let i=1; i<=3; i++) {  // 3 cycles down and up
    at.lineTo(4*i*w, -t, context);
    at.lineTo((4*i + 2)*w, t, context);
  }
  at.lineTo(15*w, 0, context);  // last ramp down
  at.lineTo(size, 0, context);  // to end-point
  context.stroke();
};

/** @inheritDoc */
getChanged(): boolean {
  const chg = this.spring_ == null ? false : this.spring_.getChanged();
  if (chg || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Color drawn when Spring is compressed to less than its rest length,
* a CSS3 color value.
*/
getColorCompressed(): string {
  if (this.colorCompressed_ !== undefined) {
    return this.colorCompressed_;
  } else if (this.proto_ != null) {
    return this.proto_.getColorCompressed();
  } else {
    return 'red';
  }
};

/**  Color drawn when Spring is stretched to more than its rest length,
* a CSS3 color value.
*/
getColorExpanded(): string {
  if (this.colorExpanded_ !== undefined) {
    return this.colorExpanded_;
  } else if (this.proto_ != null) {
    return this.proto_.getColorExpanded();
  } else {
    return 'green';
  }
};

/** Whether the Spring is drawn {@link DisplaySpring.JAGGED}
* or {@link DisplaySpring.STRAIGHT}.
*/
getDrawMode(): number {
  if (this.drawMode_ !== undefined) {
    return this.drawMode_;
  } else if (this.proto_ != null) {
    return this.proto_.getDrawMode();
  } else {
    return DisplaySpring.JAGGED;
  }
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [ ];
};

/** @inheritDoc */
getPosition(): Vector {
  // return midpoint of the line
  return this.spring_ == null ? Vector.ORIGIN :
      this.spring_.getStartPoint().add(this.spring_.getEndPoint()).multiply(0.5);
};

/** Set the prototype DisplaySpring for this object. Display parameters are inherited
* from the prototype unless the parameter is explicitly set for this object.
*/
getPrototype(): null|DisplaySpring {
  return this.proto_;
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return this.spring_ == null ? [ ] : [ this.spring_ ];
};

/** Thickness of lines when drawing the Spring, in screen coordinates, so a
* value of 1 means a 1 pixel thick line.
*/
getThickness(): number {
  if (this.thickness_ !== undefined) {
    return this.thickness_;
  } else if (this.proto_ != null) {
    return this.proto_.getThickness();
  } else {
    return 4.0;
  }
};

/** How wide back-and-forth the jagged lines go when drawing the Spring,
* in simulation coordinates.
*/
getWidth(): number {
  if (this.width_ !== undefined) {
    return this.width_;
  } else if (this.proto_ != null) {
    return this.proto_.getWidth();
  } else {
    return 0.5;
  }
};

/** @inheritDoc */
getZIndex(): number {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else if (this.proto_ != null) {
    return this.proto_.getZIndex();
  } else {
    return 0;
  }
};

/** @inheritDoc */
isDragable(): boolean {
  return false;
};

/** Color drawn when Spring is compressed to less than its rest length,
* a CSS3 color value.
* @param colorCompressed
* @return this object for chaining setters
*/
setColorCompressed(colorCompressed?: string): DisplaySpring {
  this.colorCompressed_ = colorCompressed;
  this.changed_ = true;
  return this;
};

/**  Color drawn when Spring is stretched to more than its rest length,
* a CSS3 color value.
* @param colorExpanded
* @return this object for chaining setters
*/
setColorExpanded(colorExpanded?: string): DisplaySpring {
  this.colorExpanded_ = colorExpanded;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setDragable(_dragable: boolean): void {
  // does nothing
};

/** Whether the Spring is drawn {@link DisplaySpring.JAGGED}
* or {@link DisplaySpring.STRAIGHT}.
* @param drawMode
* @return this object for chaining setters
*/
setDrawMode(drawMode?: number): DisplaySpring {
  this.drawMode_ = drawMode;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setPosition(_position: GenericVector) {
  //throw 'unsupported operation';
};

/** Set the prototype DisplaySpring for this object. Display parameters are inherited
* from the prototype unless the parameter is explicitly set for this object.
* @param value
* @return this object for chaining setters
*/
setPrototype(value: null|DisplaySpring): DisplaySpring {
  this.proto_ = value;
  return this;
};

/** Thickness of lines when drawing the Spring, in screen coordinates, so a
* value of 1 means a 1 pixel thick line.
* @param thickness
* @return this object for chaining setters
*/
setThickness(thickness?: number): DisplaySpring {
  this.thickness_ = thickness;
  this.changed_ = true;
  return this;
};

/** How wide back-and-forth the jagged lines go when drawing the Spring,
* in simulation coordinates.
* @param width
* @return this object for chaining setters
*/
setWidth(width?: number): DisplaySpring {
  this.width_ = width;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setZIndex(zIndex: number): void {
  this.zIndex_ = zIndex;
  this.changed_ = true;
};

/** Drawing mode constant indicating jagged line. */
static readonly JAGGED = 1;

/** Drawing mode constant indicating straight line. */
static readonly STRAIGHT = 2;

/** The fixed length of the un-transformed path */
static readonly pathLength = 6.0;

/** The fixed width of the un-transformed path */
static readonly pathWidth = 0.5;
} // end class

Util.defineGlobal('lab$view$DisplaySpring', DisplaySpring);
