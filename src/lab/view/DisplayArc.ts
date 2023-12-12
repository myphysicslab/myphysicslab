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

import { Arc } from '../model/Arc.js';
import { CoordMap } from "./CoordMap.js"
import { DisplayObject } from './DisplayObject.js';
import { SimObject } from '../model/SimObject.js';
import { Util } from '../util/Util.js';
import { Vector, GenericVector } from '../util/Vector.js';
import { MassObject } from "../model/MassObject.js"

/** Displays an {@link Arc}.
*/
export class DisplayArc implements DisplayObject {
  private arc_: null|Arc;
  /** Color used when drawing the line, a CSS3 color value. */
  private color_: string|undefined;
  /** Thickness to use when drawing the line, in screen coordinates, so a unit
  * is a screen pixel.
  */
  private thickness_: number|undefined;
  /** Line dash array used when drawing the line.  Corresponds to lengths of dashes
  * and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
  * length 3 with spaces of length 5. Empty array indicates solid line.
  */
  private lineDash_: number[];
  /** Length of arrowhead */
  private arrowHeadLength_: number|undefined;
  private zIndex_: number|undefined;
  private proto_: null|DisplayArc;
  private changed_: boolean = true;

/**
* @param arc the Arc to display
* @param proto the prototype DisplayArc to inherit properties from
*/
constructor(arc?: null|Arc, proto?: null|DisplayArc) {
  this.arc_ = arc ?? null;
  this.proto_ = proto ?? null;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', thickness: '+Util.NF(this.getThickness())
      +', arrowHeadLength: '+Util.NF(this.getArrowHeadLength())
      +', color: "'+this.getColor()+'"'
      +', lineDash: ['+this.getLineDash()+']'
      +', zIndex: '+this.getZIndex()
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'DisplayArc{arc_: '+
      (this.arc_ != null ? this.arc_.toStringShort() : 'null')+'}';
};

/** @inheritDoc */
contains(_p_world: Vector): boolean {
  return false;
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  if (this.arc_ == null) {
    return;
  }
  const centerX = map.simToScreenX(this.arc_.getCenter().getX());
  const centerY = map.simToScreenY(this.arc_.getCenter().getY());
  // assumption: x & y are scaled same
  const r = map.simToScreenScaleX(this.arc_.getRadius());
  const angle = this.arc_.getAngle();

  if ((angle != 0) && (r > 0))  {
    context.save();
    context.lineWidth = this.getThickness();
    context.strokeStyle = this.getColor();
    const lineDash = this.getLineDash();
    if (lineDash.length > 0 && context.setLineDash) {
      context.setLineDash(lineDash);
    }
    const startAngle = -this.arc_.getStartAngle();
    // Canvas.arc uses 'angle increases clockwise' convention, therefore subtract angle.
    const endAngle = -(this.arc_.getStartAngle() + angle);
    context.beginPath();
    context.arc(centerX, centerY, r, startAngle, endAngle, /*anticlockwise=*/angle > 0);
    context.stroke();
    // arrowhead
    // find tip of arrowhead
    let x,y;
    let a0, a1, a;  // startangle & angle in radians
    a0 = this.arc_.getStartAngle();
    a1 = this.arc_.getAngle();
    a = -(a0 + a1);
    x = this.arc_.getCenter().getX() + this.arc_.getRadius()*Math.cos(a);
    y = this.arc_.getCenter().getY() - this.arc_.getRadius()*Math.sin(a);

    let h = Math.min(this.getArrowHeadLength(), 0.5*this.arc_.getRadius());
    if (a1 > 0) {
      h = -h;
    }

    // find endpoint of first arrowhead, and draw it
    let xp, yp;
    xp = x - h*Math.cos(Math.PI/2 + a - Math.PI/6);
    yp = y + h*Math.sin(Math.PI/2 + a - Math.PI/6);
    const x1 = map.simToScreenX(x);
    const y1 = map.simToScreenY(y);
    let x2 = map.simToScreenX(xp);
    let y2 = map.simToScreenY(yp);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();

    // find endpoint of 2nd arrowhead, and draw it
    xp = x - h*Math.cos(Math.PI/2 + a + Math.PI/6);
    yp = y + h*Math.sin(Math.PI/2 + a + Math.PI/6);
    x2 = map.simToScreenX(xp);
    y2 = map.simToScreenY(yp);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.restore();
  }
};

/** Length of arrowhead, in simulation coordinates.
*/
getArrowHeadLength(): number {
  if (this.arrowHeadLength_ !== undefined) {
    return this.arrowHeadLength_;
  } else if (this.proto_ != null) {
    return this.proto_.getArrowHeadLength();
  } else {
    return 0.2;
  }
};

/** @inheritDoc */
getChanged(): boolean {
  const chg = this.arc_ == null ? false : this.arc_.getChanged();
  if (chg || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Color used when drawing the arc, a CSS3 color value.
*/
getColor(): string {
  if (this.color_ !== undefined) {
    return this.color_;
  } else if (this.proto_ != null) {
    return this.proto_.getColor();
  } else {
    return 'gray';
  }
};

/** Line dash array used when drawing the arc.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid arc.
*/
getLineDash(): number[] {
  if (this.lineDash_ !== undefined) {
    return this.lineDash_;
  } else if (this.proto_ != null) {
    return this.proto_.getLineDash();
  } else {
    return [3, 5];
  }
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [ ];
};

/** @inheritDoc */
getPosition(): Vector {
  // return midpoint of the line
  return this.arc_ == null ? Vector.ORIGIN : this.arc_.getCenter();
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return this.arc_ == null ? [ ] : [ this.arc_ ];
};

/** Thickness to use when drawing the arc, in screen coordinates, so a unit
* is a screen pixel.
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

/** Length of arrowhead, in simulation coordinates.
* @param value
* @return this object for chaining setters
*/
setArrowHeadLength(value: number|undefined): DisplayArc {
  this.arrowHeadLength_ = value;
  this.changed_ = true;
  return this;
};

/** Color used when drawing the arc, a CSS3 color value.
* @param value
* @return this object for chaining setters
*/
setColor(value: string|undefined): DisplayArc {
  this.color_ = value;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setDragable(_dragable: boolean): void {
  // does nothing
};

/** Line dash array used when drawing the arc.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid arc.
* @param value
* @return this object for chaining setters
*/
setLineDash(value: number[]): DisplayArc {
  this.lineDash_ = value;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setPosition(_position: GenericVector) {
  // does nothing
};

/** Thickness to use when drawing the arc, in screen coordinates, so a unit
* is a screen pixel.
* @param value
* @return this object for chaining setters
*/
setThickness(value: number|undefined): DisplayArc {
  this.thickness_ = value;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setZIndex(zIndex: number): void {
  this.zIndex_ = zIndex;
  this.changed_ = true;
};

} // end class
Util.defineGlobal('lab$view$DisplayArc', DisplayArc);
