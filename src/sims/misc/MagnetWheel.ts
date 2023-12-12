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

import { AbstractMassObject } from '../../lab/model/MassObject.js';
import { AffineTransform } from '../../lab/util/AffineTransform.js';
import { adaptQuad } from '../../lab/util/Calculus.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { Force } from '../../lab/model/Force.js';
import { ForceLaw } from '../../lab/model/ForceLaw.js';
import { MassObject } from '../../lab/model/MassObject.js';
import { ShapeType } from '../../lab/model/PointMass.js';
import { Util } from '../../lab/util/Util.js';
import { Vector, GenericVector } from '../../lab/util/Vector.js';
import { SimObject } from '../../lab/model/SimObject.js';

/** A wheel with magnetic points around its circumference.  A fixed magnet causes the
wheel to turn until one of the magnets is stuck being very close to the fixed magnet.

Note that there should always be a slight gap between the fixed magnet and any of the
magnet points. If there is no gap then infinite forces will result from the inverse
square force law of magnetism.

### Potential Energy Calculation

For each magnet we numerically integrate the torque due to that magnet, as though the
wheel rotated from the current position of the magnet until the magnet is as close as
possible to the fixed magnet.

*/
export class MagnetWheel extends AbstractMassObject implements SimObject, ForceLaw, MassObject {
  private radius_: number;
  /**  location of fixed magnet in world coordinates. */
  private fixedMagnet_: Vector = new Vector(0, 0.9);
  private magnetStrength_: number = 1;
  /** Locations of magnets in body coordinates. */
  private magnets_: Vector[] = [];
  /** Distance of each magnet from origin. */
  private magnetDist_: number[] = [];

/**
* @param opt_name name of this MagnetWheel for scripting (language
*   independent)
* @param opt_localName localized name of this MagnetWheel, for display to user
*/
constructor(radius: number = 1, opt_name?: string, opt_localName?: string) {
  let name, localName;
  if (opt_name === undefined || opt_name == '') {
    const id = MagnetWheel.wheel_ID++;
    name = MagnetWheel.en.MAGNET_WHEEL + id;
    localName = MagnetWheel.i18n.MAGNET_WHEEL + id;
  } else {
    name = opt_name;
    localName = opt_localName ?? name;
  }
  super(name, localName);
  this.mass_ = 1;
  this.moment_ = 1;  // maybe assume I = M R^2 /2 for solid disc?
  this.radius_ = radius;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', fixedMagnet_: ' + this.fixedMagnet_
      +', magnetStrength_: ' + Util.NF(this.magnetStrength_)
      +', num magnets: ' + this.magnets_.length
      +', radius_: ' + Util.NF(this.radius_)
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'MagnetWheel';
};

/** @inheritDoc */
calculateForces(): Force[] {
  const fm = this.fixedMagnet_;
  const forces = [];
  for (let i=0, n=this.magnets_.length; i<n; i++) {
    // r = vector from center of wheel to magnet
    const r = this.bodyToWorld(this.magnets_[i]);
    // force from magnet to fixed magnet is proportional to inverse square of distance
    let f = new Vector(fm.getX() - r.getX(), fm.getY() - r.getY());
    f = f.normalize().multiply(this.magnetStrength_ / f.lengthSquared());
    const t = r.getX() * f.getY() - r.getY() * f.getX();
    // name, body, location, locationCoordType, direction, directionCoordType, torque
    const fc = new Force('magnet'+i, this, r, CoordType.WORLD, f, CoordType.WORLD, t);
    forces.push(fc);
  }
  return forces;
};

/** @inheritDoc */
createCanvasPath(_context: CanvasRenderingContext2D): void {
};

/** @inheritDoc */
disconnect(): void {
};

/** @inheritDoc */
getBodies(): MassObject[] {
  return [this];
};

/** @inheritDoc */
getBottomBody(): number {
  return -this.radius_;
};

/** @inheritDoc */
getCentroidBody(): Vector {
  return Vector.ORIGIN;
};

/** @inheritDoc */
getCentroidRadius(): number {
  return this.radius_;
};

/** @inheritDoc */
getLeftBody(): number {
  return -this.radius_;
};

/** Returns location of the fixed magnet.
* @return location of the fixed magnet.
*/
getFixedMagnet(): Vector {
  return this.fixedMagnet_;
};

/** Returns the locations of magnets, in body coordinates.
* @return locations of magnets, in body coordinates.
*/
getMagnets(): Vector[] {
  return Array.from(this.magnets_);
};

/** Returns the strength of each magnet.
*/
getMagnetStrength(): number {
  return this.magnetStrength_;
};

/** @inheritDoc */
getMinHeight(): number {
  return this.radius_;
};

/** @inheritDoc */
getPotentialEnergy(): number {
  let pe = 0;
  for (let i=0, n=this.magnets_.length; i<n; i++) {
    // current position of the magnet
    const r = this.bodyToWorld(this.magnets_[i]);
    // convert this to angle from -pi to pi.
    let a = r.getAngle();
    if (a < -Math.PI/2) {
      a = a + 2 * Math.PI;
    }
    // potential energy is integral of torque, from where magnet is now, to when
    // magnet is closest to fixed magnet.
    if (a < Math.PI/2) {
      pe += Math.abs(adaptQuad(
          angle => this.getTorque(i, angle), a, Math.PI/2, 0.0001));
    } else {
      pe += Math.abs(adaptQuad(
          angle => this.getTorque(i, angle), Math.PI/2, a, 0.0001));
    }
  };
  return pe;
};

/** Returns the radius of this object.
@return the radius of this object
*/
getRadius(): number {
  return this.radius_;
}

/** @inheritDoc */
getRightBody(): number {
  return this.radius_;
};

/** @inheritDoc */
getTopBody(): number {
  return this.radius_;
};

/** Returns torque due to a given magnet when it is at the given angle.
* @param idx index of magnet
* @param angle angle in radians. Zero is east, pi/2 is north.
* @return torque due to that magnet at that angle
*/
private getTorque(idx: number, angle: number): number {
  if (idx < 0 || idx >= this.magnetDist_.length)
      throw '';
  const fm = this.fixedMagnet_;
  // only thing that matters here is the magnet's distance from center
  const d = this.magnetDist_[idx];
  // r = vector from center of wheel to magnet at given angle
  // NOTE: this assumes wheel's center is at the origin.
  const r = new Vector(d * Math.cos(angle), d * Math.sin(angle));
  // force from magnet to fixed magnet is proportional to inverse square of distance
  let f = new Vector(fm.getX() - r.getX(), fm.getY() - r.getY());
  f = f.normalize().multiply(this.magnetStrength_ / f.lengthSquared());
  return r.getX() * f.getY() - r.getY() * f.getX();
};

/** @inheritDoc */
getVerticesBody(): Vector[] {
  const w = this.radius_;
  const h = this.radius_;
  return [new Vector(-w, -h), new Vector(w, -h), new Vector(w, h), new Vector(-w, h)];
};

/** Set location of the fixed magnet.
* @param loc the location of the fixed magnet
* @return this object for chaining setters
*/
setFixedMagnet(loc: Vector): MagnetWheel {
  if (loc.getX() != 0 || loc.getY() <= 0) {
    // getPotentialEnergy assumes the following.  (This could be loosened).
    throw 'fixed magnet must have X = 0, and Y > 0';
  }
  this.fixedMagnet_ = loc;
  this.setChanged();
  return this;
};

/** Sets the locations of magnets, in body coordinates.
* @param locations locations of magnets, in body coordinates
*/
setMagnets(locations: Vector[]): void {
  this.magnets_ = Array.from(locations);
  this.magnetDist_ = [];
  // save the distance from origin for each magnet
  this.magnets_.forEach(m => this.magnetDist_.push(m.length()));
  this.setChanged();
};

/** Set the strength of each magnet.
@param value
*/
setMagnetStrength(value: number): void {
  this.magnetStrength_ = value;
  this.setChanged();
};

/** @inheritDoc */
override setPosition(loc_world: GenericVector, angle?: number): void {
  if (!Vector.ORIGIN.equals(loc_world)) {
    // calculations in getTorque() assume MagnetWheel is at origin.
    throw 'MagnetWheel can only be located at origin';
  }
  super.setPosition(loc_world, angle);
};

/** Sets radius of this object.
* @param radius radius of this object.
* @return this object for chaining setters
*/
setRadius(radius: number): MagnetWheel {
  this.radius_ = radius;
  this.setChanged();
  return this;
};

/** @inheritDoc */
override similar(_obj: SimObject, _opt_tolerance?: number): boolean {
  return false;
};

/** Counter used for naming MagnetWheel. */
static wheel_ID = 1;

static readonly en: i18n_strings = {
  MAGNET_WHEEL: 'MagnetWheel'
};

static readonly de_strings: i18n_strings = {
  MAGNET_WHEEL: 'MagnetRad'
};

static readonly i18n = Util.LOCALE === 'de' ? MagnetWheel.de_strings : MagnetWheel.en;

} // end class

type i18n_strings = {
  MAGNET_WHEEL: string
};

Util.defineGlobal('sims$misc$MagnetWheel', MagnetWheel);
