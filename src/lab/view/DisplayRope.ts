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

import { AffineTransform } from '../util/AffineTransform.js';
import { CoordMap } from "./CoordMap.js"
import { DisplayObject } from './DisplayObject.js';
import { Rope } from '../engine2D/Rope.js';
import { SimObject } from '../model/SimObject.js';
import { Util } from '../util/Util.js';
import { Vector, GenericVector } from '../util/Vector.js';
import { MassObject } from "../model/MassObject.js"

/** Displays a {@link Rope} by showing a straight line when the Rope
is tight, or a jagged line when the Rope has slack. Can have a different color when
tight or slack, see {@link DisplayRope.setColorTight} and
{@link DisplayRope.setColorSlack}.

The position is reported as the midpoint of the Rope by
{@link DisplayRope.getPosition}. The position is determined by the position of the
Rope, so {@link DisplayRope.setPosition} has no effect, and the DisplayRope is never
dragable.
*/
export class DisplayRope implements DisplayObject {
  private rope_: null|Rope;
  /** Color when rope is tight; a CSS3 color value */
  private colorTight_: string|undefined;
  /** Color when rope is slack; a CSS3 color value */
  private colorSlack_: string|undefined;
  /** Thickness of lines when drawing the rope, in screen coordinates, so a
  * value of 1 means a 1 pixel thick line.
  */
  private thickness_: number|undefined;
  private zIndex_: number|undefined;
  private changed_: boolean = true;;
  private proto_: null|DisplayRope;

/**
* @param rope the Rope to display
* @param proto the prototype DisplayRope to inherit properties from
*/
constructor(rope?: null|Rope, proto?: null|DisplayRope) {
  this.rope_ = rope ?? null;
  this.proto_ = proto ?? null;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', colorTight: "'+this.getColorTight()+'"'
      +', colorSlack: "'+this.getColorSlack()+'"'
      +', thickness: '+Util.NF(this.getThickness())
      +', zIndex: '+this.getZIndex()
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'DisplayRope{rope_: '+
      (this.rope_ != null ? this.rope_.toStringShort() : 'null')+'}';
};

/** @inheritDoc */
contains(_p_world: Vector): boolean {
  return false;
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  if (this.rope_ == null) {
    return;
  }
  const len = this.rope_.getLength();
  if (len < 1e-6) {
    return;
  }
  context.save()
  context.lineWidth = this.getThickness();
  const tight = this.rope_.isTight();
  const slack = tight ? 0 : this.rope_.getRestLength() - len;
  if (tight) {
    context.strokeStyle = this.getColorTight();
  } else {
    context.strokeStyle = this.getColorSlack();
  }
  let p1 = this.rope_.getStartPoint();
  let p2 = this.rope_.getEndPoint();
  if (tight) {
    // draw as a straight line
    p1 = map.simToScreen(p1);
    p2 = map.simToScreen(p2);
    context.beginPath();
    context.moveTo(p1.getX(), p1.getY());
    context.lineTo(p2.getX(), p2.getY());
    context.stroke();
  } else {
    // note that the transforms are applied in reverse order  (because of
    // how matrix multiplication works).
    let at = map.getAffineTransform(); // sim to screen transform
    at = at.translate(p1.getX(), p1.getY());
    const theta = Math.atan2(p2.getY()-p1.getY(), p2.getX()-p1.getX());
    at = at.rotate(theta);
    // stretch out the rope to the desired length & thickness
    at = at.scale(len/DisplayRope.pathLength,
        Math.max(2*slack/DisplayRope.pathLength, 0.1));
    DisplayRope.drawRope(context, at);
  }
  context.restore();
};

/** Draws the rope using the given AffineTransform, which specifies the combination of
translating, stretching, rotating the rope to its current position, and also the
sim-to-screen transform. The path is drawn into a size of 6.0 long by 0.5 wide, so that
when it is scaled up or down, it doesn't get too distorted.
* @param context the canvas's context to draw into
* @param at  the transform to apply to each point
*/
private static drawRope(context: CanvasRenderingContext2D, at: AffineTransform): void {
  /** Function to have the amount of rope oscillation change from small
  oscillation at the end points to large oscillation at the middle.
  Returns the height the rope should be away from x-axis at that point.
  */
  const ropeHeight = (x: number) =>
     DisplayRope.pathWidth * Math.sin(Math.PI*x/DisplayRope.pathLength);

  const size = DisplayRope.pathLength;
  const t = DisplayRope.pathWidth/2; // half thickness of rope
  const w = size / 16;
  context.beginPath();
  at.moveTo(0, 0, context); // start drawing at the base
  at.lineTo(w, -ropeHeight(w), context);   // from start point
  at.lineTo(2*w, ropeHeight(2*w), context);  // ramp up
  for (let i=1; i<=3; i++) {  // 3 cycles down and up
    let x = 4*i*w;
    at.lineTo(x, -ropeHeight(x), context);
    x = (4*i + 2)*w;
    at.lineTo(x, ropeHeight(x), context);
  }
  at.lineTo(15*w, -ropeHeight(15*w), context);  // last ramp down
  at.lineTo(size, 0, context);  // to end-point
  context.stroke();
};

/** @inheritDoc */
getChanged(): boolean {
  const chg = this.rope_ == null ? false : this.rope_.getChanged();
  if (chg || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Color when rope is slack; a CSS3 color value
*/
getColorSlack(): string {
  if (this.colorSlack_ !== undefined) {
    return this.colorSlack_;
  } else if (this.proto_ != null) {
    return this.proto_.getColorSlack();
  } else {
    return 'green';
  }
};

/** Color when rope is tight; a CSS3 color value
*/
getColorTight(): string {
  if (this.colorTight_ !== undefined) {
    return this.colorTight_;
  } else if (this.proto_ != null) {
    return this.proto_.getColorTight();
  } else {
    return 'red';
  }
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [];
};

/** @inheritDoc */
getPosition(): Vector {
  // return midpoint of the line
  return this.rope_ == null ? Vector.ORIGIN :
      this.rope_.getStartPoint().add(this.rope_.getEndPoint()).multiply(0.5);
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return this.rope_ == null ? [ ] : [ this.rope_ ];
};

/** Thickness to use when drawing the line, in screen coordinates, so a unit
* is a screen pixel.
*/
getThickness(): number {
  if (this.thickness_ !== undefined) {
    return this.thickness_;
  } else if (this.proto_ != null) {
    return this.proto_.getThickness();
  } else {
    return 3;
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

/** Color when rope is slack; a CSS3 color value
* @param value
* @return this object for chaining setters
*/
setColorSlack(value: string|undefined): DisplayRope {
  this.colorSlack_ = value;
  this.changed_ = true;
  return this;
};

/** Color when rope is tight; a CSS3 color value
* @param value
* @return this object for chaining setters
*/
setColorTight(value: string|undefined): DisplayRope {
  this.colorTight_ = value;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setDragable(_dragable: boolean): void {
  // does nothing
};

/** @inheritDoc */
setPosition(_position: GenericVector): void {
  //throw 'unsupported operation';
};

/** Thickness to use when drawing the line, in screen coordinates, so a unit
* is a screen pixel.
* @param value
* @return this object for chaining setters
*/
setThickness(value: number|undefined): DisplayRope {
  this.thickness_ = value;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setZIndex(zIndex: number): void {
  this.zIndex_ = zIndex;
  this.changed_ = true;
};

/**  the fixed length of the un-transformed path */
static readonly pathLength = 6.0;

/**  the fixed width of the un-transformed path */
static readonly pathWidth = 0.5;

} // end class

Util.defineGlobal('lab$view$DisplayRope', DisplayRope);
