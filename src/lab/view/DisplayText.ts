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

import { CoordMap } from "./CoordMap.js"
import { DisplayObject } from './DisplayObject.js';
import { MassObject } from "../model/MassObject.js"
import { SimObject } from '../model/SimObject.js';
import { Util } from '../util/Util.js';
import { Vector, GenericVector } from '../util/Vector.js';

/** Displays text. Can set attributes font, fillStyle, textAlign, and textBaseline.
*/
export class DisplayText implements DisplayObject {
  private text_: string;
  private location_: Vector;
  /** The color used when drawing the text, a CSS3 color value. */
  private fillStyle_: string|undefined;
  /** The font used when drawing the text, a CSS3 font specification. */
  private font_: string|undefined;
  /** The horizontal alignment of text; legal values are 'left', 'center', 'right',
  * 'start' and 'end'.
  */
  private textAlign_: string|undefined;
  /** The vertical alignment of text; legal values are 'top', 'middle', 'bottom',
  * 'alphabetic', 'hanging', and 'ideographic'.
  */
  private textBaseline_: string|undefined;
  private zIndex_: number|undefined = 0;
  private dragable_: boolean = false;
  private proto_: null|DisplayText;
  private changed_: boolean = true;

/**
* @param opt_text the text to display (default is empty string)
* @param opt_position the position in simulation coords to display the text
*     (default is origin)
* @param proto the prototype DisplayText to inherit properties from
*/
constructor(opt_text?: string, opt_position?: Vector, proto?: null|DisplayText) {
  this.text_ = opt_text ?? '';
  this.location_ = opt_position ?? Vector.ORIGIN;
  this.proto_ = proto ?? null;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', location: '+this.location_
      +', font: '+this.getFont()
      +', fillStyle: "'+this.getFillStyle()+'"'
      +', textAlign: '+this.getTextAlign()
      +', textBaseline: '+this.getTextBaseline()
      +', zIndex: '+this.getZIndex()
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'DisplayText{text_: '+this.text_+'}';
};

/** @inheritDoc */
contains(_p_world: Vector): boolean {
  return false; // could figure out bounds?
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  context.save()
  context.fillStyle = this.getFillStyle();
  context.font = this.getFont();
  // see lib.dom.d.ts in directory
  // /Users/erikn/.nvm/versions/node/v15.6.0/lib/node_modules/typescript/lib
  context.textAlign = this.getTextAlign() as CanvasTextAlign;
  context.textBaseline = this.getTextBaseline() as CanvasTextBaseline;
  const x1 = map.simToScreenX(this.location_.getX());
  const y1 = map.simToScreenY(this.location_.getY());
  /*if (this.centered_) {
    const textWidth = context.measureText(this.text_).width;
    x1 = x1 - textWidth/2;
  }*/
  context.fillText(this.text_, x1, y1);
  context.restore();
};

/** @inheritDoc */
getChanged(): boolean {
  if (this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Color used when drawing the text, a CSS3 color value.
*/
getFillStyle(): string {
  if (this.fillStyle_ !== undefined) {
    return this.fillStyle_;
  } else if (this.proto_ != null) {
    return this.proto_.getFillStyle();
  } else {
    return 'black';
  }
};

/** Font used when drawing the text.
* @return a CSS font specification
*/
getFont(): string {
  if (this.font_ !== undefined) {
    return this.font_;
  } else if (this.proto_ != null) {
    return this.proto_.getFont();
  } else {
    return '12pt sans-serif';
  }
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [ ];
};

/** @inheritDoc */
getPosition(): Vector {
  return this.location_;
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return [ ];
};

/** The horizontal alignment of text; allowed values are 'left', 'center', 'right',
* 'start' and 'end'.
*/
getTextAlign(): string {
  if (this.textAlign_ !== undefined) {
    return this.textAlign_;
  } else if (this.proto_ != null) {
    return this.proto_.getTextAlign();
  } else {
    return 'left';
  }
};

/** The vertical alignment of text; allowed values are 'top', 'middle', 'bottom',
* 'alphabetic', 'hanging', and 'ideographic'.
*/
getTextBaseline(): string {
  if (this.textBaseline_ !== undefined) {
    return this.textBaseline_;
  } else if (this.proto_ != null) {
    return this.proto_.getTextBaseline();
  } else {
    return 'alphabetic';
  }
};

/** Returns the text being drawn.
* @return the text being drawn.
*/
getText(): string {
  return this.text_;
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
  return this.dragable_;
};

/** @inheritDoc */
setDragable(dragable: boolean): void {
  this.dragable_ = dragable;
};

/** Color used when drawing the text, a CSS3 color value.
* @param value
* @return this object for chaining setters
*/
setFillStyle(value: string|undefined): DisplayText {
  this.fillStyle_ = value;
  this.changed_ = true;
  return this;
};

/** Sets the font used when drawing the text.
* @param value a CSS font specification, or undefined
* @return this object for chaining setters
*/
setFont(value: string|undefined): DisplayText {
  this.font_ = value;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setPosition(position: GenericVector): void {
  this.location_ = Vector.clone(position);
  this.changed_ = true;
};

/** Sets the text to draw.
* @param text the text to draw.
*/
setText(text: string): void {
  this.text_ = text;
  this.changed_ = true;
};

/** The horizontal alignment of text; allowed values are 'left', 'center', 'right',
* 'start' and 'end'.
* @param value
* @return this object for chaining setters
*/
setTextAlign(value: string|undefined): DisplayText {
  this.textAlign_ = value;
  this.changed_ = true;
  return this;
};

/** The vertical alignment of text; allowed values are 'top', 'middle', 'bottom',
* 'alphabetic', 'hanging', and 'ideographic'.
* @param value
* @return this object for chaining setters
*/
setTextBaseline(value: string|undefined): DisplayText {
  this.textBaseline_ = value;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setZIndex(zIndex?: number): void {
  this.zIndex_ = zIndex;
  this.changed_ = true;
};

} // end class
Util.defineGlobal('lab$view$DisplayText', DisplayText);
