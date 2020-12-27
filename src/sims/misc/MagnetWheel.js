// Copyright 2020 Erik Neumann.  All Rights Reserved.
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

goog.module('myphysicslab.sims.misc.MagnetWheel');

goog.require('goog.array');
const AbstractMassObject = goog.require('myphysicslab.lab.model.AbstractMassObject');
const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');
const Calculus = goog.require('myphysicslab.lab.util.Calculus');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Force = goog.require('myphysicslab.lab.model.Force');
const ForceLaw = goog.require('myphysicslab.lab.model.ForceLaw');
const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const MassObject = goog.require('myphysicslab.lab.model.MassObject');
const ShapeType = goog.require('myphysicslab.lab.model.ShapeType');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** A wheel with magnetic points around its circumference.  A fixed magnet causes the
wheel to turn until one of the magnets is stuck being very close to the fixed magnet.

Note that there should always be a slight gap between the fixed magnet and any of the
magnet points. If there is no gap then infinite forces will result from the inverse
square force law of magnetism.

### Potential Energy Calculation

For each magnet we numerically integrate the torque due to that magnet, as though the
wheel rotated from the current position of the magnet until the magnet is as close as
possible to the fixed magnet.

* @implements {ForceLaw}
*/
class MagnetWheel extends AbstractMassObject {
/**
* @param {string=} opt_name name of this MagnetWheel for scripting (language
*   independent)
* @param {string=} opt_localName localized name of this MagnetWheel, for display to user
*/
constructor(opt_name, opt_localName) {
  var name, localName;
  if (opt_name === undefined || opt_name == '') {
    var id = MagnetWheel.ID++;
    name = MagnetWheel.en.MAGNET_WHEEL + id;
    localName = MagnetWheel.i18n.MAGNET_WHEEL + id;
  } else {
    name = opt_name;
    localName = opt_localName ? opt_localName : name;
  }
  super(name, localName);
  this.mass_ = 1;
  this.moment_ = 1;  // maybe assume I = M R^2 /2 for solid disc?
  /**
  * @type {number}
  * @private
  */
  this.radius_ = 1;
  /**  location of fixed magnet in world coordinates.
  * @type {!Vector}
  * @private
  */
  this.fixedMagnet_ = new Vector(0, 0.9);
  /**
  * @type {number}
  * @private
  */
  this.magnetStrength_ = 1;
  /** Locations of magnets in body coordinates.
  * @type {!Array<!Vector>}
  * @private
  */
  this.magnets_ = [];
  /** Distance of each magnet from origin.
  * @type {!Array<number>}
  * @private
  */
  this.magnetDist_ = [];
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : super.toString().slice(0, -1)
      +', fixedMagnet_: ' + this.fixedMagnet_
      +', magnetStrength_: ' + Util.NF(this.magnetStrength_)
      +', num magnets: ' + this.magnets_.length
      +', radius_: ' + Util.NF(this.radius_)
      +'}';
};

/** @override */
getClassName() {
  return 'MagnetWheel';
};

/**
* @param {number} radius
* @param {string=} opt_name name of the MagnetWheel
* @param {string=} opt_localName  localized name of the MagnetWheel
* @return {!MagnetWheel}
*/
static make(radius, opt_name, opt_localName) {
  var p = new MagnetWheel(opt_name, opt_localName);
  p.setRadius(radius);
  return p;
};

/** @override */
calculateForces() {
  var fm = this.fixedMagnet_;
  var forces = [];
  for (var i=0, n=this.magnets_.length; i<n; i++) {
    // r = vector from center of wheel to magnet
    var r = this.bodyToWorld(this.magnets_[i]);
    // force from magnet to fixed magnet is proportional to inverse square of distance
    var f = new Vector(fm.getX() - r.getX(), fm.getY() - r.getY());
    f = f.normalize().multiply(this.magnetStrength_ / f.lengthSquared());
    var t = r.getX() * f.getY() - r.getY() * f.getX();
    // name, body, location, locationCoordType, direction, directionCoordType, torque
    var fc = new Force('magnet'+i, this, r, CoordType.WORLD, f, CoordType.WORLD, t);
    forces.push(fc);
  }
  return forces;
};

/** @override */
createCanvasPath(context) {
};

/** @override */
disconnect() {
};

/** @override */
getBodies() {
  return [this];
};

/** @override */
getBottomBody() {
  return -this.radius_;
};

/** @override */
getCentroidBody() {
  return Vector.ORIGIN;
};

/** @override */
getCentroidRadius() {
  return this.radius_;
};

/** @override */
getLeftBody() {
  return -this.radius_;
};

/** Returns location of the fixed magnet.
* @return {!Vector} location of the fixed magnet.
*/
getFixedMagnet() {
  return this.fixedMagnet_;
};

/** Returns the locations of magnets, in body coordinates.
* @return {!Array<!Vector>} locations of magnets, in body coordinates.
*/
getMagnets() {
  return Array.from(this.magnets_);
};

/** Returns the strength of each magnet.
@return {number}
*/
getMagnetStrength() {
  return this.magnetStrength_;
};

/** @override */
getMinHeight() {
  return this.radius_;
};

/** @override */
getPotentialEnergy() {
  var pe = 0;
  for (var i=0, n=this.magnets_.length; i<n; i++) {
    // current position of the magnet
    var r = this.bodyToWorld(this.magnets_[i]);
    // convert this to angle from -pi to pi.
    var a = r.getAngle();
    if (a < -Math.PI/2) {
      a = a + 2 * Math.PI;
    }
    // potential energy is integral of torque, from where magnet is now, to when
    // magnet is closest to fixed magnet.
    if (a < Math.PI/2) {
      pe += Math.abs(Calculus.adaptQuad(
          angle => this.getTorque(i, angle), a, Math.PI/2, 0.0001));
    } else {
      pe += Math.abs(Calculus.adaptQuad(
          angle => this.getTorque(i, angle), Math.PI/2, a, 0.0001));
    }
  };
  return pe;
};

/** Returns the radius of this object.
@return {number} the radius of this object
*/
getRadius() {
  return this.radius_;
}

/** @override */
getRightBody() {
  return this.radius_;
};

/** @override */
getTopBody() {
  return this.radius_;
};

/** Returns torque due to a given magnet when it is at the given angle.
* @param {number} idx index of magnet
* @param {number} angle angle in radians. Zero is east, pi/2 is north.
* @return {number} torque due to that magnet at that angle
* @private
*/
getTorque(idx, angle) {
  if (idx < 0 || idx >= this.magnetDist_.length)
      throw '';
  var fm = this.fixedMagnet_;
  // only thing that matters here is the magnet's distance from center
  var d = this.magnetDist_[idx];
  // r = vector from center of wheel to magnet at given angle
  // NOTE: this assumes wheel's center is at the origin.
  var r = new Vector(d * Math.cos(angle), d * Math.sin(angle));
  // force from magnet to fixed magnet is proportional to inverse square of distance
  var f = new Vector(fm.getX() - r.getX(), fm.getY() - r.getY());
  f = f.normalize().multiply(this.magnetStrength_ / f.lengthSquared());
  var t = r.getX() * f.getY() - r.getY() * f.getX();
  return t;
};

/** @override */
getVerticesBody() {
  var w = this.radius_;
  var h = this.radius_;
  return [new Vector(-w, -h), new Vector(w, -h), new Vector(w, h), new Vector(-w, h)];
};

/** Set location of the fixed magnet.
* @param {!Vector} loc the location of the fixed magnet
* @return {!MagnetWheel} this object for chaining setters
*/
setFixedMagnet(loc) {
  if (loc.getX() != 0 || loc.getY() <= 0) {
    // getPotentialEnergy assumes the following.  (This could be loosened).
    throw 'fixed magnet must have X = 0, and Y > 0';
  }
  this.fixedMagnet_ = loc;
  return this;
};

/** Set the mass of this MagnetWheel.
* @param {number} mass the mass of this MagnetWheel
* @return {!MagnetWheel} this object for chaining setters
*/
setMass(mass) {
  if (mass < 0 || typeof mass !== 'number') {
    throw 'mass must be non-negative '+mass;
  }
  this.mass_ = mass;
  return this;
};

/** Sets the locations of magnets, in body coordinates.
* @param {!Array<!Vector>} locations locations of magnets, in body coordinates
* @return {undefined}
*/
setMagnets(locations) {
  this.magnets_ = Array.from(locations);
  this.magnetDist_ = [];
  // save the distance from origin for each magnet
  this.magnets_.forEach(m => this.magnetDist_.push(m.length()));
};

/** Set the strength of each magnet.
@param {number} value
*/
setMagnetStrength(value) {
  this.magnetStrength_ = value;
};

/** @override */
setPosition(loc_world, angle) {
  if (!Vector.ORIGIN.equals(loc_world)) {
    // calculations in getTorque() assume MagnetWheel is at origin.
    throw 'MagnetWheel can only be located at origin';
  }
  super.setPosition(loc_world, angle);
};

/** Sets radius of this object.
* @param {number} radius radius of this object.
* @return {!MagnetWheel} this object for chaining setters
*/
setRadius(radius) {
  this.radius_ = radius;
  return this;
};

/** @override */
similar(obj, opt_tolerance) {
  return false;
};

} // end class

/** Counter used for naming MagnetWheel.
* @type {number}
*/
MagnetWheel.ID = 1;


/** Set of internationalized strings.
@typedef {{
  MAGNET_WHEEL: string
  }}
*/
MagnetWheel.i18n_strings;

/**
@type {MagnetWheel.i18n_strings}
*/
MagnetWheel.en = {
  MAGNET_WHEEL: 'MagnetWheel'
};

/**
@private
@type {MagnetWheel.i18n_strings}
*/
MagnetWheel.de_strings = {
  MAGNET_WHEEL: 'MagnetRad'
};

/** Set of internationalized strings.
@type {MagnetWheel.i18n_strings}
*/
MagnetWheel.i18n = goog.LOCALE === 'de' ? MagnetWheel.de_strings :
    MagnetWheel.en;

exports = MagnetWheel;
