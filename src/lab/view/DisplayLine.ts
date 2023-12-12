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

import { ConcreteLine } from '../model/ConcreteLine.js';
import { CoordMap } from "./CoordMap.js"
import { DisplayObject } from './DisplayObject.js';
import { Line } from '../model/Line.js';
import { SimObject } from '../model/SimObject.js';
import { Util } from '../util/Util.js';
import { Vector, GenericVector } from '../util/Vector.js';
import { MassObject } from "../model/MassObject.js"

/** Displays a {@link Line} as a colored line.

The position is determined by the position of the Line, so
{@link DisplayLine.setPosition} has no effect, and the DisplayLine is never dragable.
The position is reported as the midpoint of the Line by {@link DisplayLine.getPosition}.
*/
export class DisplayLine implements DisplayObject {
  private line_: Line;
  /** Scaling factor to adjust length of line. */
  private scale_: number;
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
  private zIndex_: number|undefined;
  private proto_: null|DisplayLine;
  private changed_: boolean = true;

/**
* @param line the Line to display
* @param proto the prototype DisplayLine to inherit properties from
*/
constructor(line?: null|Line, proto?: null|DisplayLine) {
  this.line_ = line ?? new ConcreteLine('proto');
  this.scale_ = 1.0;
  this.proto_ = proto ?? null;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', scale_: '+Util.NF(this.scale_)
      +', thickness: '+Util.NF(this.getThickness())
      +', color: "'+this.getColor()+'"'
      +', lineDash: ['+this.getLineDash()+']'
      +', zIndex: '+this.getZIndex()
      +', proto: '+(this.proto_ != null ? this.proto_.toStringShort() : 'null')
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'DisplayLine{line_: '+this.line_.toStringShort()+'}';
};

/** @inheritDoc */
contains(_p_world: Vector): boolean {
  return false;
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  const thickness = this.getThickness();
  if (thickness > 0) {
    let p1 = this.line_.getStartPoint();
    let p2;
    if (this.scale_ == 1.0) {
      p2 = this.line_.getEndPoint();
    } else {
      const v = this.line_.getVector();
      p2 = p1.add(v.multiply(this.scale_));
    }
    p1 = map.simToScreen(p1);
    p2 = map.simToScreen(p2);
    const len = p1.distanceTo(p2);
    if (len < 1e-6)
      return;
    context.save()
    const lineDash = this.getLineDash();
    if (lineDash.length > 0 && context.setLineDash) {
      context.setLineDash(lineDash);
    }
    context.lineWidth = this.getThickness();
    context.strokeStyle = this.getColor();
    context.beginPath();
    context.moveTo(p1.getX(), p1.getY());
    context.lineTo(p2.getX(), p2.getY());
    context.stroke();
    context.restore();
  }
};

/** Color used when drawing the line, a CSS3 color value.
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

/** @inheritDoc */
getChanged(): boolean {
  if (this.line_.getChanged() || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Line dash array used when drawing the line.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid line.
*/
getLineDash(): number[] {
  if (this.lineDash_ !== undefined) {
    return this.lineDash_;
  } else if (this.proto_ != null) {
    return this.proto_.getLineDash();
  } else {
    return [];
  }
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [];
};

/** @inheritDoc */
getPosition(): Vector {
  // return midpoint of the line
  return this.line_.getStartPoint().add(this.line_.getEndPoint()).multiply(0.5);
};

/** Returns scale factor that adjusts length of line.
*/
getScale(): number {
  return this.scale_;
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return [ this.line_ ];
};

/** Thickness to use when drawing the line, in screen coordinates, so a unit
* is a screen pixel. Line will appear only with positive thickness.
* Can be set to zero to make the line disappear.
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

/** Color used when drawing the line, a CSS3 color value.
* @param color
* @return this object for chaining setters
*/
setColor(color: string|undefined): DisplayLine {
  this.color_ = color;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setDragable(_dragable: boolean): void {
  // does nothing
};

/** Line dash array used when drawing the line.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid line.
* @param lineDash
* @return this object for chaining setters
*/
setLineDash(lineDash: number[]): DisplayLine {
  this.lineDash_ = lineDash;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setPosition(_position: GenericVector): void {
};

/** Sets scale factor that adjusts length of line. The start point of the line is
* unchanged. The end point is moved so the line has a length = scale *
* the current length.
* @param scale
* @return this object for chaining setters
*/
setScale(scale: number): DisplayLine {
  this.scale_ = scale;
  return this;
};

/** Thickness to use when drawing the line, in screen coordinates, so a unit
* is a screen pixel. Line will appear only with positive thickness.
* Can be set to zero to make the line disappear.
* @param thickness
* @return this object for chaining setters
*/
setThickness(thickness: number|undefined): DisplayLine {
  this.thickness_ = thickness;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setZIndex(zIndex: number): void {
  this.zIndex_ = zIndex;
  this.changed_ = true;
};

} // end class
Util.defineGlobal('lab$view$DisplayLine', DisplayLine);
