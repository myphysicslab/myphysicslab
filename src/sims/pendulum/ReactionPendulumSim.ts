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

import { AbstractODESim, ODESim } from '../../lab/model/ODESim.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js'
import { GenericEvent, ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { SimList } from '../../lab/model/SimList.js';
import { UtilEngine } from '../../lab/engine2D/UtilEngine.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const X = 0;
const XP = 1;
const Y = 2;
const YP = 3;
const ANGLE = 4;
const ANGLEP = 5;
const TIME = 6;
const KE = 7;
const PE = 8;
const TE = 9;

/** Single pendulum done with reaction forces instead of the analytic equations of
motion as in {@link sims/pendulum/PendulumSim.PendulumSim | PendulumSim}. This is similar to how the
rigid body physics engine in {@link lab/engine2D/ContactSim.ContactSim | ContactSim} calculates
forces, but this is specific to only this particular single pendulum scenario.

The pendulum is regarded as a _rigid body_ consisting of a uniform disk at end of a
massless rigid arm. We find the reaction forces by solving a matrix equation, following
the steps shown at <https://www.myphysicslab.com/contact.html>.

Variables
--------------------------
The pivot is fixed at the origin.

+ `(x,y)` = center of disk
+ `w` = angle of pendulum

Note that `w` is the angle of the pendulum in relation to the pivot point, which happens
to also correspond to the angle of the disk rigid body (perhaps adding a constant).

**TO DO**  make dragable for setting start angle?

*/
export class ReactionPendulumSim extends AbstractODESim implements Simulation, ODESim, EnergySystem {
  /** radius of rigid body pendulum disk */
  private radius_: number;
  private length_: number;
  private mass_: number = 1;
  private gravity_: number = 1;
  private damping_: number = 0;
  private potentialOffset_: number = 0;
  private rod_: ConcreteLine = new ConcreteLine('rod');
  private bob_: RigidBody;

/**
* @param length length of pendulum rod
* @param radius radius of rigid body pendulum disk
* @param startAngle starting angle for the pendulum; in radians; zero is
*     straight down; counter-clockwise is positive
* @param opt_name name of this as a Subject
* @param opt_simList SimList to use (optional)
*/
constructor(length: number, radius: number, startAngle: number,
      opt_name?: string, opt_simList?: SimList) {
  super(opt_name, opt_simList);
  // 0  1   2  3     4      5       6    7   8   9
  // x, x', y, y', angle, angle', time, ke, pe, te
  const var_names = [
    ReactionPendulumSim.en.X_POSITION,
    ReactionPendulumSim.en.X_VELOCITY,
    ReactionPendulumSim.en.Y_POSITION,
    ReactionPendulumSim.en.Y_VELOCITY,
    ReactionPendulumSim.en.ANGLE,
    ReactionPendulumSim.en.ANGULAR_VELOCITY,
    VarsList.en.TIME,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY
  ];
  const i18n_names = [
    ReactionPendulumSim.i18n.X_POSITION,
    ReactionPendulumSim.i18n.X_VELOCITY,
    ReactionPendulumSim.i18n.Y_POSITION,
    ReactionPendulumSim.i18n.Y_VELOCITY,
    ReactionPendulumSim.i18n.ANGLE,
    ReactionPendulumSim.i18n.ANGULAR_VELOCITY,
    VarsList.i18n.TIME,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(KE, PE, TE);
  this.radius_ = radius;
  this.length_ = length;
  this.getSimList().add(this.rod_);
  this.config(length, radius, startAngle);
  this.addParameter(new ParameterNumber(this, ReactionPendulumSim.en.DAMPING,
      ReactionPendulumSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, ReactionPendulumSim.en.MASS,
      ReactionPendulumSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, ReactionPendulumSim.en.GRAVITY,
      ReactionPendulumSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', gravity_: '+Util.NF(this.gravity_)
      +', damping_: '+Util.NF(this.damping_)
      +', length_: '+Util.NF(this.length_)
      +', rod_: '+this.rod_
      +', bob_: '+this.bob_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'ReactionPendulumSim';
};

/**
* @param length
* @param radius
* @param startAngle
*/
config(length: number, radius: number, startAngle: number) {
  // 0  1   2  3     4      5       6    7   8   9
  // x, x', y, y', angle, angle', time, ke, pe, te
  this.length_ = length;
  this.radius_ = radius;
  const va = this.getVarsList();
  const vars = va.getValues();
  vars[ANGLE] = startAngle;
  vars[X] = length * Math.sin(vars[ANGLE]);
  vars[Y] = -length * Math.cos(vars[ANGLE]);
  vars[XP] = vars[YP] = vars[ANGLEP] = 0;
  vars[TIME] = 0; // time
  va.setValues(vars);
  if (this.bob_ !== undefined) {
    this.getSimList().remove(this.bob_);
  }
  this.bob_ = Shapes.makeBall(radius);
  this.bob_.setMass(this.mass_);
  this.getSimList().add(this.bob_);
  this.saveInitialState();
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const vars = this.getVarsList().getValues();
  // 0  1   2  3     4      5       6    7   8   9
  // x, x', y, y', angle, angle', time, ke, pe, te
  const ke = 0.5* this.mass_ *(vars[XP]*vars[XP] + vars[YP]*vars[YP]);
  Util.assert(!Util.veryDifferent(ke, this.bob_.translationalEnergy()));
  // rotational inertia I = m r^2 / 2
  const I = this.mass_ * this.radius_ * this.radius_ / 2;
  Util.assert(!Util.veryDifferent(I, this.bob_.momentAboutCM()));
  const re = 0.5 * I * vars[ANGLEP] * vars[ANGLEP];
  Util.assert(!Util.veryDifferent(re, this.bob_.rotationalEnergy()));
  const pe = this.gravity_ * this.mass_ * (vars[Y] + this.length_);
  return new EnergyInfo(pe + this.potentialOffset_, ke, re);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number) {
  this.potentialOffset_ = value;
  // 0  1   2  3     4      5       6    7   8   9
  // x, x', y, y', angle, angle', time, ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  // 0  1   2  3     4      5       6    7   8   9
  // x, x', y, y', angle, angle', time, ke, pe, te
  const ei = this.getEnergyInfo();
  va.setValue(KE, ei.getTranslational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
};

/**
@param vars
*/
private moveObjects(vars: number[]) {
  // 0  1   2  3     4      5       6    7   8   9
  // x, x', y, y', angle, angle', time, ke, pe, te
  this.bob_.setPosition(new Vector(vars[X],  vars[Y]),  vars[ANGLE]);
  this.bob_.setVelocity(new Vector(vars[XP],  vars[YP]),  vars[ANGLEP]);
  this.rod_.setStartPoint(Vector.ORIGIN);
  this.rod_.setEndPoint(this.bob_.getPosition());
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  // 0  1   2  3     4      5       6    7   8   9
  // x, x', y, y', angle, angle', time, ke, pe, te
  Util.zeroArray(change);
  change[TIME] = 1; // time
  const m = this.mass_;
  change[X] = vars[XP]; // x' = vx
  change[XP] = -this.damping_*vars[XP];  // vx' = -b vx
  change[Y] = vars[YP];  // y' = vy
  change[YP] = - this.gravity_ - this.damping_*vars[YP];    // vy' = -g - b vy
  change[ANGLE] = vars[ANGLEP]; // th' = w
  change[ANGLEP] = 0;  // w' = 0

  // figure out and apply contact force
  const len = this.length_;
  // parallel axis theorem: I = Icm + m R^2
  // rotational inertia of disk radius r about center = m r^2 /2
  const I = m*(this.radius_ * this.radius_/2.0);
  // We regard there being two contact points at the pivot.
  // Contact 0 is with a horizontal surface, contact 1 is with a vertical surface.
  // two normal vectors, n0 and n1
  // n1 points downwards. n2 points rightward.
  const n0x = 0;
  const n0y = -1;
  const n1x = -1;
  const n1y = 0;
  const rx = -len*Math.sin(vars[ANGLE]);
  const ry = len*Math.cos(vars[ANGLE]);
  const vx = vars[XP];
  const vy = vars[YP];
  const w = vars[ANGLEP];
  // A matrix:  Aij = effect of fj on acceleration at contact i
  // last column of Aij is where -B goes
  const A = [ new Float64Array(3), new Float64Array(3) ];
  const B = [ 0, 0 ];
  const f = [ 0, 0 ];
  let nx, ny, nix, niy, b;
  nx = n0x;
  ny = n0y;
  // regard the point on the stick as p1, and the point on wall as p2
  // eqn (10) gives 2 (w x ni) . (v + w x r)
  // = 2* w (-niy, nix, 0) . (vx -w ry, vy + w rx, 0)
  // = 2* w (-niy(vx - w ry) + nix(vy + w rx))
  //b = 2*w*(-ny*(vx - w*ry) + nx*(vy + w*rx));
  // W' = (0, 0, w'), so W' x r = (-w' ry, w' rx, 0)
  // w x (w x r) = w x (-w ry, w rx, 0) = w^2 (-rx, -ry, 0)
  // eqn (11) gives n . (v' + W' x r + w x (w x r))
  // = n . (vx' -w' ry - w^2 rx, vy' + w' rx - w^2 ry, 0)
  // = nx*(vx' -w' ry - w^2 rx) +ny*(vy' + w' rx - w^2 ry)
  b = nx*(change[XP] -change[ANGLEP]*ry - w*w*rx) + ny*(change[YP] + change[ANGLEP]*rx - w*w*ry);
  B[0] = b;

  // same formulas, but now for contact 1
  nx = n1x;
  ny = n1y;
  //b = 2*w*(-ny*(vx - w*ry) + nx*(vy + w*rx));
  b = nx*(change[XP] -change[ANGLEP]*ry - w*w*rx) + ny*(change[YP] + change[ANGLEP]*rx - w*w*ry);
  B[1] = b;

  // notation:  here nj = {nx, ny, 0}  and ni = {nix, nyx, 0}
  // I = m (width^2 + height^2)/ 12
  // eqn (9)  a = ni . (nj/ m + (r x nj) x r /I)
  // (r x n) x r =[0, 0, rx ny - ry nx] x r =[-ry(rx ny - ry nx), rx(rx ny - ry nx), 0]
  // a = ni . [nx/m -ry(rx ny - ry nx)/I, ny/m + rx(rx ny - ry nx)/I, 0]
  nx = n0x; ny = n0y;  nix = n0x; niy = n0y;
  A[0][0] = nix*(nx/m -ry*(rx*ny - ry*nx)/I) + niy*(ny/m + rx*(rx*ny - ry*nx)/I);
  nx = n1x; ny = n1y;  nix = n0x; niy = n0y;
  A[0][1] = nix*(nx/m -ry*(rx*ny - ry*nx)/I) + niy*(ny/m + rx*(rx*ny - ry*nx)/I);
  nx = n0x; ny = n0y;  nix = n1x; niy = n1y;
  A[1][0] = nix*(nx/m -ry*(rx*ny - ry*nx)/I) + niy*(ny/m + rx*(rx*ny - ry*nx)/I);
  nx = n1x; ny = n1y;  nix = n1x; niy = n1y;
  A[1][1] = nix*(nx/m -ry*(rx*ny - ry*nx)/I) + niy*(ny/m + rx*(rx*ny - ry*nx)/I);

  // d'' = 0 = A f + B
  // A f = -B
  B[0] = -B[0];
  B[1] = -B[1];
  const err = UtilEngine.matrixSolve4(A, f, B);
  if (err != -1) {
    throw err;
  }
  // now apply the force f n to the pivot end.
  nx = n0x; ny = n0y;
  // x and y change according to f nx and f ny
  // acceleration = force/mass
  let Fx, Fy;
  Fx = f[0]*nx;
  Fy = f[0]*ny;
  change[XP] += f[0]*nx/m;
  change[YP] += f[0]*ny/m;
  // w' = (r x f n) /I  = {0, 0, rx f ny - ry f nx} /I
  // not sure why, but needs a sign change here!
  change[ANGLEP] += (rx*f[0]*ny - ry*f[0]*nx)/I;

  nx = n1x; ny = n1y;
  Fx += f[1]*nx;
  Fy += f[1]*ny;
  change[XP] += f[1]*nx/m;
  change[YP] += f[1]*ny/m;
  change[ANGLEP] += (rx*f[1]*ny - ry*f[1]*nx)/I;
  this.showForce(Fx, 0);
  this.showForce(0, Fy);
  //this.showForce(Fx, Fy);
  return null;
};

/**
* @param fx
* @param fy
*/
private showForce(fx: number, fy: number) {
  const v = new ConcreteLine('contact_force', Vector.ORIGIN, new Vector(fx, fy));
  v.setExpireTime(this.getTime());
  this.getSimList().add(v);
};

/** Return mass of pendulum bob.
@return mass of pendulum bob
*/
getMass(): number {
  return this.mass_;
};

/** Set mass of pendulum bob
@param value mass of pendulum bob
*/
setMass(value: number) {
  if (this.mass_ != value) {
    this.mass_ = value;
    this.bob_.setMass(value);
    // 0  1   2  3     4      5       6    7   8   9
    // x, x', y, y', angle, angle', time, ke, pe, te
    // discontinuous change in energy
    this.getVarsList().incrSequence(KE, PE, TE);
    this.broadcastParameter(ReactionPendulumSim.en.MASS);
  }
};

/** Return gravity strength.
@return gravity strength
*/
getGravity(): number {
  return this.gravity_;
};

/** Set gravity strength.
@param value gravity strength
*/
setGravity(value: number) {
  this.gravity_ = value;
  // 0  1   2  3     4      5       6    7   8   9
  // x, x', y, y', angle, angle', time, ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(ReactionPendulumSim.en.GRAVITY);
};

/** Return damping factor
@return damping factor
*/
getDamping(): number {
  return this.damping_;
};

/** Set damping factor
@param value damping factor
*/
setDamping(value: number) {
  this.damping_ = value;
  this.broadcastParameter(ReactionPendulumSim.en.DAMPING);
};

static readonly en: i18n_strings = {
  X_POSITION: 'X position',
  Y_POSITION: 'Y position',
  X_VELOCITY: 'X velocity',
  Y_VELOCITY: 'Y velocity',
  ANGLE: 'angle',
  ANGULAR_VELOCITY: 'angle velocity',
  START_ANGLE: 'start angle',
  DAMPING: 'damping',
  GRAVITY: 'gravity',
  LENGTH: 'length',
  MASS: 'mass',
  TIME: 'time',
  RADIUS: 'radius'
};

static readonly de_strings: i18n_strings = {
  X_POSITION: 'X Position',
  Y_POSITION: 'Y Position',
  X_VELOCITY: 'X Geschwindigkeit',
  Y_VELOCITY: 'Y Geschwindigkeit',
  ANGLE: 'Winkel',
  ANGULAR_VELOCITY: 'Winkelgeschwindigkeit',
  START_ANGLE: 'anfangs Winkel',
  DAMPING: 'Dämpfung',
  GRAVITY: 'Gravitation',
  LENGTH: 'Länge',
  MASS: 'Masse',
  TIME: 'Zeit',
  RADIUS: 'Radius'
};

static readonly i18n = Util.LOCALE === 'de' ? ReactionPendulumSim.de_strings : ReactionPendulumSim.en;

} // end class

type i18n_strings = {
  X_POSITION: string,
  Y_POSITION: string,
  X_VELOCITY: string,
  Y_VELOCITY: string,
  ANGLE: string,
  ANGULAR_VELOCITY: string,
  START_ANGLE: string,
  DAMPING: string,
  GRAVITY: string,
  LENGTH: string,
  MASS: string,
  TIME: string,
  RADIUS: string
};

Util.defineGlobal('sims$pendulum$ReactionPendulumSim', ReactionPendulumSim);
