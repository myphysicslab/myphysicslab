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

import { MassObject, AbstractMassObject } from "./MassObject.js"
import { SimObject } from "./SimObject.js"
import { Util } from "../util/Util.js"
import { Vector } from "../util/Vector.js"

/** Enum that specifies the shape of a {@link PointMass}. */
export enum ShapeType {
  /** Rectangle shape */
  RECTANGLE,
  /** Oval shape */
  OVAL,
};

/** A simple point-like {@link MassObject}, it has mass, velocity, size and shape.
Default mass is 1, default shape is circle with diameter of 1. Center of mass is at the
center of the shape. In body coordinates the center of mass at the origin.

### Drawing an Ellipse

The method {@link MassObject.createCanvasPath} is responsible for creating the path
that is used to draw this object,
see {@link lab/view/DisplayShape.DisplayShape | DisplayShape}.
 When the shape is oval, this will attempt to draw an oval using
[CanvasRenderingContext2D.ellipse](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/ellipse)
but not all browsers implement that method as of 2016. A circle is drawn
instead for those browsers without the `ellipse` function; the circle has diameter
being the lesser of width or height of this object.
*/
export class PointMass extends AbstractMassObject implements SimObject, MassObject {
  private shape_: ShapeType = ShapeType.OVAL;
  private width_: number = 1;
  private height_: number = 1;

/**
* @param opt_name name of this PointMass for scripting (language independent)
* @param opt_localName localized name of this PointMass, for display to user
*/
constructor(opt_name?: string, opt_localName?: string) {
  let name, localName;
  if (opt_name === undefined || opt_name == '') {
    const id = PointMass.ID++;
    name = PointMass.en.POINT_MASS + id;
    localName = PointMass.i18n.POINT_MASS + id;
  } else {
    name = opt_name;
    localName = opt_localName ? opt_localName : name;
  }
  super(name, localName);
  this.mass_ = 1;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', shape_: ' + this.shape_
      +', width_: ' + Util.NF(this.width_)
      +', height_: '+ Util.NF(this.height_)
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'PointMass';
};

/** Makes a circle PointMass.
* @param diameter
* @param opt_name name of the PointMass
* @param opt_localName  localized name of the PointMass
* @return the circle PointMass
*/
static makeCircle(diameter: number, opt_name?: string, opt_localName?: string): PointMass {
  const p = new PointMass(opt_name, opt_localName);
  p.setWidth(diameter);
  p.setHeight(diameter);
  return p;
};

/** Makes an oval PointMass.
* @param width
* @param height
* @param opt_name name of the PointMass
* @param opt_localName  localized name of the PointMass
* @return an oval PointMass
*/
static makeOval(width: number, height: number, opt_name?: string, opt_localName?: string): PointMass {
  const p = new PointMass(opt_name, opt_localName);
  p.setWidth(width);
  p.setHeight(height);
  return p;
};

/** Makes a square PointMass.
* @param width
* @param opt_name name of the PointMass
* @param opt_localName  localized name of the PointMass
* @return a square PointMass
*/
static makeSquare(width: number, opt_name?: string, opt_localName?: string): PointMass {
  const p = new PointMass(opt_name, opt_localName);
  p.setWidth(width);
  p.setHeight(width);
  p.setShape(ShapeType.RECTANGLE);
  return p;
};

/** Makes a rectangular PointMass.
* @param width
* @param height
* @param opt_name name of the PointMass
* @param opt_localName  localized name of the PointMass
* @return a rectangular PointMass
*/
static makeRectangle(width: number, height: number, opt_name?: string, opt_localName?: string): PointMass {
  const p = new PointMass(opt_name, opt_localName);
  p.setWidth(width);
  p.setHeight(height);
  p.setShape(ShapeType.RECTANGLE);
  return p;
};

/** @inheritDoc */
createCanvasPath(context: CanvasRenderingContext2D): void {
  context.beginPath();
  const h = this.height_/2;
  const w = this.width_/2;
  if (this.shape_ == ShapeType.RECTANGLE) {
    context.rect(-w, -h, this.width_, this.height_);
    /*
    context.moveTo(-w, -h); // this also does context.openPath().
    context.lineTo(-w, h);
    context.lineTo(w, h);
    context.lineTo(w, -h);
    context.closePath(); // adds a line to start of path at (-w, -h)
    */
  } else if (this.shape_ == ShapeType.OVAL) {
    if (typeof context.ellipse === 'function') {
      context.moveTo(w, 0);
      // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
      context.ellipse(0, 0, w, h, 0, 0, 2*Math.PI, false);
    } else {
      // NOTE: until context.ellipse() is supported by browsers, we only
      // draw a circle here, the smallest that will fit.
      const min = Math.min(w, h);
      context.arc(0, 0, min, 0, 2*Math.PI, false);
      context.closePath();
    }
  } else {
    throw '';
  }
};

/** @inheritDoc */
getBottomBody() {
  return -this.height_/2;
};

/** @inheritDoc */
getCentroidBody() {
  return Vector.ORIGIN;
};

/** @inheritDoc */
getCentroidRadius() {
  const w = this.width_/2;
  const h = this.height_/2;
  return Math.sqrt(w*w + h*h);
};

/** @inheritDoc */
getLeftBody() {
  return -this.width_/2;
};

/** @inheritDoc */
getMinHeight() {
  if (isNaN(this.minHeight_)) {
    const cmx = this.cm_body_.getX();
    const cmy = this.cm_body_.getY();
    let dist = cmy - this.getBottomBody();
    let d = cmx - this.getLeftBody();
    if (d < dist) {
      dist = d;
    }
    d = this.getTopBody() - cmy;
    if (d < dist) {
      dist = d;
    }
    d = this.getRightBody() - cmx;
    if (d < dist) {
      dist = d;
    }
    this.minHeight_ = dist;
  }
  return this.minHeight_;
};

/** @inheritDoc */
getRightBody() {
  return this.width_/2;
};

/** Returns the shape of this PointMass.
@return the shape of this PointMass, from {@link ShapeType}
*/
getShape(): ShapeType {
  return this.shape_;
};

/** @inheritDoc */
getTopBody() {
  return this.height_/2;
};

/** @inheritDoc */
getVerticesBody() {
  const w = this.width_/2;
  const h = this.height_/2;
  return [new Vector(-w, -h), new Vector(w, -h), new Vector(w, h), new Vector(-w, h)];
};

/** Sets height of this object.
* @param height height of this object.
*/
setHeight(height: number): void {
  this.height_ = height;
  this.setChanged();
};

/** Changes the shape of this PointMass.
* @param shape the shape of this PointMass, from {@link ShapeType}
*/
setShape(shape: ShapeType): void {
  this.shape_ = shape;
  this.setChanged();
};

/** Sets width of this object.
* @param width width of this object.
*/
setWidth(width: number): void {
  this.width_ = width;
  this.setChanged();
};

/** @inheritDoc */
override similar(obj: SimObject, opt_tolerance?: number): boolean {
  if (!(obj instanceof PointMass)) {
    return false;
  }
  const pm = obj;
  if (!pm.loc_world_.nearEqual(this.loc_world_, opt_tolerance))
    return false;
  if (Util.veryDifferent(pm.width_, this.width_, opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(pm.height_, this.height_, opt_tolerance)) {
    return false;
  }
  if (pm.shape_ != this.shape_) {
    return false;
  }
  return true;
};

static en: i18n_strings = {
  POINT_MASS: 'PointMass'
};
static de_strings: i18n_strings = {
  POINT_MASS: 'Punktmasse'
};

static readonly i18n = Util.LOCALE === 'de' ? PointMass.de_strings : PointMass.en;
}; // end PointMass class

type i18n_strings = {
  POINT_MASS: string
}

Util.defineGlobal('lab$model$PointMass', PointMass);
