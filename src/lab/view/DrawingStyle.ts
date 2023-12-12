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

import { DrawingMode } from './DrawingMode.js';
import { Util } from '../util/Util.js';

/** Specifies drawing style including: whether to draw dots or lines; color; thickness;
line dash.
*/
export class DrawingStyle {
  /** Whether to draw dots or lines, a value from DrawingMode. */
  drawMode: DrawingMode;
  /** a CSS color specification */
  color: string;
  /** thickness to use when drawing the line, or size of dots, in screen coordinates,
  * so a unit is a screen pixel.
  */
  lineWidth: number;
  /** Line dash array used when drawing the line.  Corresponds to lengths of dash
  * and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
  * length 3 with spaces of length 5. Empty array indicates solid line.
  */
  lineDash: number[];

/**
* @param drawMode whether to draw dots or lines, a value from DrawingMode
* @param color a CSS color specification
* @param lineWidth  thickness to use when drawing the graph line, in screen
*     coordinates, so a unit is a screen pixel.
* @param opt_lineDash Line dash array used when drawing the line.
*     Corresponds to lengths of dash and spaces, in screen coordinates.
*     For example, `[3, 5]` alternates dashes of length 3 with spaces of length 5.
*     Empty array indicates solid line (which is the default).
*/
constructor(drawMode: DrawingMode, color: string, lineWidth: number, opt_lineDash?: number[]) {
  this.drawMode = drawMode;
  this.color = color;
  this.lineWidth = lineWidth;
  this.lineDash = opt_lineDash ?? [];
};

toString(): string {
  return 'DrawingStyle{drawMode: '+this.drawMode
      +', color:"'+this.color+'"'
      +', lineWidth: '+this.lineWidth
      +', lineDash: ['
      + Util.array2string(this.lineDash, Util.NF0)
      +']}';
};

/** Returns a DrawingStyle for drawing dots with the given color and dot size.
* @param color a CSS color specification
* @param dotSize size of dots in screen coordinates, so a unit is a screen
*     pixel.
* @return a DrawingStyle for drawing dots with the given color and dot size
*/
static dotStyle(color: string, dotSize: number): DrawingStyle {
  return new DrawingStyle(DrawingMode.DOTS, color, dotSize);
};

/** Returns a DrawingStyle for drawing a line with the given color, line width and
* optional line dash.
* @param color a CSS color specification
* @param lineWidth  thickness to use when drawing the graph line, in screen
*     coordinates, so a unit is a screen pixel.
* @param opt_lineDash Line dash array used when drawing the line.
*     Corresponds to lengths of dash and spaces, in screen coordinates.
*     For example, `[3, 5]` alternates dashes of length 3 with spaces of length 5.
*     Empty array indicates solid line (which is the default).
* @return a DrawingStyle for drawing a line with the given color,
*     line width and optional line dash
*/
static lineStyle(color: string, lineWidth: number, opt_lineDash?: number[]): DrawingStyle {
  return new DrawingStyle(DrawingMode.LINES, color, lineWidth, opt_lineDash);
};

} // end class
Util.defineGlobal('lab$view$DrawingStyle', DrawingStyle);
