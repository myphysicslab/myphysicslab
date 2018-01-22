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

goog.module('myphysicslab.lab.model.PointMass');

const AbstractMassObject = goog.require('myphysicslab.lab.model.AbstractMassObject');
const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const MassObject = goog.require('myphysicslab.lab.model.MassObject');
const ShapeType = goog.require('myphysicslab.lab.model.ShapeType');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** A simple point-like {@link MassObject}, it has mass, velocity, size and shape.
Default mass is 1, default shape is circle with diameter of 1. Center of mass is at the
center of the shape. In body coordinates the center of mass at the origin.

### Drawing an Ellipse

The method {@link #createCanvasPath} is responsible for creating the path that is
used to draw this object, see {@link myphysicslab.lab.view.DisplayShape}. When the
shape is oval, this will attempt to draw an oval using
[CanvasRenderingContext2D.ellipse](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/ellipse)
but not all browsers implement that method as of 2016. A circle is drawn
instead for those browsers without the `ellipse` function; the circle has diameter
being the lesser of width or height of this object.
*/
class PointMass extends AbstractMassObject {
/**
* @param {string=} opt_name name of this PointMass for scripting (language independent)
* @param {string=} opt_localName localized name of this PointMass, for display to user
*/
constructor(opt_name, opt_localName) {
  var name, localName;
  if (!goog.isDef(opt_name) || opt_name == '') {
    var id = PointMass.ID++;
    name = PointMass.en.POINT_MASS + id;
    localName = PointMass.i18n.POINT_MASS + id;
  } else {
    name = opt_name;
    localName = opt_localName ? opt_localName : name;
  }
  super(name, localName);
  this.mass_ = 1;
  /**
  * @type {!ShapeType}
  * @private
  */
  this.shape_ = ShapeType.OVAL;
  /**
  * @type {number}
  * @private
  */
  this.width_ = 1;
  /**
  * @type {number}
  * @private
  */
  this.height_ = 1;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : super.toString().slice(0, -1)
      +', shape_: ' + this.shape_
      +', width_: ' + Util.NF(this.width_)
      +', height_: '+ Util.NF(this.height_)
      +'}';
};

/** @override */
getClassName() {
  return 'PointMass';
};

/**
* @param {number} diameter
* @param {string=} opt_name name of the PointMass
* @param {string=} opt_localName  localized name of the PointMass
* @return {!PointMass}
*/
static makeCircle(diameter, opt_name, opt_localName) {
  var p = new PointMass(opt_name, opt_localName);
  p.setWidth(diameter);
  p.setHeight(diameter);
  return p;
};

/**
* @param {number} width
* @param {number} height
* @param {string=} opt_name name of the PointMass
* @param {string=} opt_localName  localized name of the PointMass
* @return {!PointMass}
*/
static makeOval(width, height, opt_name, opt_localName) {
  var p = new PointMass(opt_name, opt_localName);
  p.setWidth(width);
  p.setHeight(height);
  return p;
};

/**
* @param {number} width
* @param {string=} opt_name name of the PointMass
* @param {string=} opt_localName  localized name of the PointMass
* @return {!PointMass}
*/
static makeSquare(width, opt_name, opt_localName) {
  var p = new PointMass(opt_name, opt_localName);
  p.setWidth(width);
  p.setHeight(width);
  p.setShape(ShapeType.RECTANGLE);
  return p;
};

/**
* @param {number} width
* @param {number} height
* @param {string=} opt_name name of the PointMass
* @param {string=} opt_localName  localized name of the PointMass
* @return {!PointMass}
*/
static makeRectangle(width, height, opt_name, opt_localName) {
  var p = new PointMass(opt_name, opt_localName);
  p.setWidth(width);
  p.setHeight(height);
  p.setShape(ShapeType.RECTANGLE);
  return p;
};

/** @override */
createCanvasPath(context) {
  context.beginPath();
  var h = this.height_/2;
  var w = this.width_/2;
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
    if (goog.isFunction(context.ellipse)) {
      context.moveTo(w, 0);
      // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
      context.ellipse(0, 0, w, h, 0, 0, 2*Math.PI, false);
    } else {
      // NOTE: until context.ellipse() is supported by browsers, we only
      // draw a circle here, the smallest that will fit.
      var min = Math.min(w, h);
      context.arc(0, 0, min, 0, 2*Math.PI, false);
      context.closePath();
    }
  } else {
    throw new Error();
  }
};

/** @override */
getBottomBody() {
  return -this.height_/2;
};

/** @override */
getCentroidBody() {
  return Vector.ORIGIN;
};

/** @override */
getCentroidRadius() {
  var w = this.width_/2;
  var h = this.height_/2;
  return Math.sqrt(w*w + h*h);
};

/** @override */
getLeftBody() {
  return -this.width_/2;
};

/** @override */
getMinHeight() {
  if (isNaN(this.minHeight_)) {
    var cmx = this.cm_body_.getX();
    var cmy = this.cm_body_.getY();
    var dist = cmy - this.getBottomBody();
    var d = cmx - this.getLeftBody();
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

/** @override */
getRightBody() {
  return this.width_/2;
};

/** Returns the shape of this PointMass.
@return {!ShapeType} the shape of this PointMass, from {@link ShapeType}
*/
getShape() {
  return this.shape_;
};

/** @override */
getTopBody() {
  return this.height_/2;
};

/** @override */
getVerticesBody() {
  var w = this.width_/2;
  var h = this.height_/2;
  return [new Vector(-w, -h), new Vector(w, -h), new Vector(w, h), new Vector(-w, h)];
};

/** Sets height of this object.
* @param {number} height height of this object.
* @return {!PointMass} this object for chaining setters
*/
setHeight(height) {
  this.height_ = height;
  return this;
};

/** Set the mass of this PointMass.
@param {number} mass the mass of this PointMass
@return {!PointMass} this object for chaining setters
*/
setMass(mass) {
  if (mass < 0 || !goog.isNumber(mass)) {
    throw new Error('mass must be non-negative '+mass);
  }
  this.mass_ = mass;
  return this;
};

/** Changes the shape of this PointMass.
* @param {!ShapeType} shape the shape of this PointMass, from {@link ShapeType}
* @return {!PointMass} this object for chaining setters
*/
setShape(shape) {
  this.shape_ = shape;
  return this;
};

/** Sets width of this object.
* @param {number} width width of this object.
* @return {!PointMass} this object for chaining setters
*/
setWidth(width) {
  this.width_ = width;
  return this;
};

/** @override */
similar(obj, opt_tolerance) {
  if (!(obj instanceof PointMass)) {
    return false;
  }
  var pm = /** @type {!PointMass} */ (obj);
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

} //end class

/** Counter used for naming PointMass.
* @type {number}
*/
PointMass.ID = 1;


/** Set of internationalized strings.
@typedef {{
  POINT_MASS: string
  }}
*/
PointMass.i18n_strings;

/**
@type {PointMass.i18n_strings}
*/
PointMass.en = {
  POINT_MASS: 'PointMass'
};

/**
@private
@type {PointMass.i18n_strings}
*/
PointMass.de_strings = {
  POINT_MASS: 'Punktmasse'
};

/** Set of internationalized strings.
@type {PointMass.i18n_strings}
*/
PointMass.i18n = goog.LOCALE === 'de' ? PointMass.de_strings :
    PointMass.en;

exports = PointMass;
