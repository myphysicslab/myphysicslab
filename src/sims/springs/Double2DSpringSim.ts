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
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

const U1X = 0;
const U1Y = 1;
const U2X = 2;
const U2Y = 3;
const V1X = 4;
const V1Y = 5;
const V2X = 6;
const V2Y = 7;
const KE = 8;
const PE = 9;
const TE = 10;
const TIME = 11;
const FIX_X = 12;
const FIX_Y = 13;

/** Simulation showing 2 springs and 2 masses hanging below a moveable top anchor mass.
The top anchor mass is moveable by the user, but is not influenced by the springs or
gravity.

Variables and Parameters
-------------------------
Variables:
```text
U = position of center of bob
V = velocity of bob
th = angle formed with vertical, positive is counter clockwise
L = displacement of spring from rest length
```
Parameters:
```text
T = position of top anchor mass
R = rest length
k = spring constant
g = gravity
b = damping constant
m = mass of bob
```

Equations of Motion
-------------------------
See also <https://www.myphysicslab.com/dbl_spring2d.html>.
```text
F1x = -k1 L1 sin(th1) + k2 L2 sin(th2) - b1 V1x = m1 V1x'
F1y = -m1 g + k1 L1 cos(th1) - k2 L2 cos(th2) - b1 V1y = m1 V1y'
F2x = -k2 L2 sin(th2) - b2 V2x = m2 V2x'
F2y = -m2 g + k2 L2 cos(th2) - b2 V2y = m2 V2y'
xx1 = U1x - Tx
yy1 = U1y - Ty
len1 = Sqrt(xx1^2 + yy1^2)
L1 = len1 - R1
th1 = atan(xx1 / yy1)
cos(th1) = -yy1 / len1
sin(th1) = xx1 / len1
xx2 = U2x - U1x
yy2 = U2y - U1y
len2 = sqrt(xx2^2 + yy2^2)
L2 = len2 - R2
cos(th2) = -yy2 / len2
sin(th2) = xx2 / len2
```
Variables Array
-------------------------
The variables are stored in the VarsList as follows
```text
vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
```
where `KE` = kinetic energy, `PE` = potential energy, `TE` = total energy

**TO DO**  draw a number on each mass, either 1 or 2, to make it easier to understand
the parameter names.

*/
export class Double2DSpringSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {

  /** the block being dragged, or -1 when no drag is happening */
  private dragBlock_: number = -1;
  private gravity_: number = 9.8;
  private damping_: number = 0;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  private topMass_: PointMass = PointMass.makeSquare(0.5, 'top');
  private bob1_: PointMass = PointMass.makeCircle(0.5, 'bob1');
  private bob2_: PointMass = PointMass.makeCircle(0.5, 'bob2');
  private spring1_: Spring = new Spring('spring1',
      this.topMass_, Vector.ORIGIN,
      this.bob1_, Vector.ORIGIN,
      /*restLength=*/1.0, /*stiffness=*/6.0);
  private spring2_: Spring = new Spring('spring2',
      this.bob1_, Vector.ORIGIN,
      this.bob2_, Vector.ORIGIN,
      /*restLength=*/1.0, /*stiffness=*/6.0);
  private springs_: Spring[] = [this.spring1_, this.spring2_];

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  const var_names = [
    Double2DSpringSim.en.X_POSITION+'-1',
    Double2DSpringSim.en.Y_POSITION+'-1',
    Double2DSpringSim.en.X_POSITION+'-2',
    Double2DSpringSim.en.Y_POSITION+'-2',
    Double2DSpringSim.en.X_VELOCITY+'-1',
    Double2DSpringSim.en.Y_VELOCITY+'-1',
    Double2DSpringSim.en.X_VELOCITY+'-2',
    Double2DSpringSim.en.Y_VELOCITY+'-2',
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY,
    VarsList.en.TIME,
    Double2DSpringSim.en.ANCHOR_X,
    Double2DSpringSim.en.ANCHOR_Y
  ];
  const i18n_names = [
    Double2DSpringSim.i18n.X_POSITION+'-1',
    Double2DSpringSim.i18n.Y_POSITION+'-1',
    Double2DSpringSim.i18n.X_POSITION+'-2',
    Double2DSpringSim.i18n.Y_POSITION+'-2',
    Double2DSpringSim.i18n.X_VELOCITY+'-1',
    Double2DSpringSim.i18n.Y_VELOCITY+'-1',
    Double2DSpringSim.i18n.X_VELOCITY+'-2',
    Double2DSpringSim.i18n.Y_VELOCITY+'-2',
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME,
    Double2DSpringSim.i18n.ANCHOR_X,
    Double2DSpringSim.i18n.ANCHOR_Y
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(KE, PE, TE);
  this.topMass_.setPosition(new Vector(0, 2));
  this.bob1_.setMass(0.5);
  this.bob2_.setMass(0.5);
  this.getSimList().add(this.topMass_, this.bob1_, this.bob2_, this.spring1_,
      this.spring2_);
  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.GRAVITY,
      Double2DSpringSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.DAMPING,
      Double2DSpringSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.LENGTH,
      Double2DSpringSim.i18n.LENGTH,
      () => this.getLength(), a => this.setLength(a)));
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.MASS1,
      Double2DSpringSim.i18n.MASS1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.MASS2,
      Double2DSpringSim.i18n.MASS2,
      () => this.getMass2(), a => this.setMass2(a)));
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.STIFFNESS,
      Double2DSpringSim.i18n.STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a)));
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
  // do restState() to set the potential energy offset.
  this.restState();
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // perturb slightly to get some initial motion
  const vars = this.getVarsList().getValues();
  vars[U1X] += 0.5;
  vars[U1Y] -= 0.5;
  this.getVarsList().setValues(vars);
  this.saveInitialState();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', gravity_: '+Util.NF(this.gravity_)
      +', damping_: '+Util.NF(this.damping_)
      +', bob1_: '+this.bob1_
      +', bob2_: '+this.bob2_
      +', spring1_: '+this.spring1_
      +', spring2_: '+this.spring2_
      +', topMass_: '+this.topMass_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'Double2DSpringSim';
};

/** Sets simulation to motionless equilibrium resting state, and sets potential
* energy to zero.
*/
restState(): void {
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  const m1 = this.bob1_.getMass();
  const m2 = this.bob2_.getMass();
  const k1 = this.spring1_.getStiffness();
  const k2 = this.spring2_.getStiffness();
  const r1 = this.spring1_.getRestLength();
  const r2 = this.spring2_.getRestLength();
  const fixY = this.topMass_.getPosition().getY();
  const vars = this.getVarsList().getValues();
  vars[FIX_Y] = fixY
  // x1 & x2 position
  vars[U1X] = vars[U2X] = vars[FIX_X] = this.topMass_.getPosition().getX();
  // derive these by writing the force equations to yield zero accel
  // when everything is lined up vertically.
  // y1 position
  vars[U1Y] = fixY - this.gravity_*(m1+m2)/k1 - r1;
  // y2 position
  vars[U2Y] = fixY - this.gravity_*(m2/k2 + (m1+m2)/k1) - r1 - r2;
  // velocities are all zero
  vars[V1X] = vars[V1Y] = vars[V2X] = vars[V2Y] = 0;
  // because getEnergyInfo depends on objects being in their current state
  this.getVarsList().setValues(vars);
  this.moveObjects(vars);
  this.potentialOffset_ = 0;
  this.setPEOffset(-this.getEnergyInfo().getPotential());
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const ke = this.bob1_.getKineticEnergy() + this.bob2_.getKineticEnergy();
  let pe = this.gravity_*this.bob1_.getMass()*this.bob1_.getPosition().getY();
  pe += this.gravity_*this.bob2_.getMass()*this.bob2_.getPosition().getY();
  pe += this.spring1_.getPotentialEnergy();
  pe += this.spring2_.getPotentialEnergy();
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number) {
  this.potentialOffset_ = value;
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  const ei = this.getEnergyInfo();
  va.setValue(KE, ei.getTranslational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
};

/**
@param vars
*/
private moveObjects(vars: number[]) {
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  this.bob1_.setPosition(new Vector(vars[U1X],  vars[U1Y]));
  this.bob1_.setVelocity(new Vector(vars[V1X], vars[V1Y]));
  this.bob2_.setPosition(new Vector(vars[U2X],  vars[U2Y]));
  this.bob2_.setVelocity(new Vector(vars[V2X], vars[V2Y]));
  this.topMass_.setPosition(new Vector(vars[FIX_X],  vars[FIX_Y]));
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  this.dragBlock_ = -1;
  if (simObject == this.bob1_) {
    this.dragBlock_ = 0;
    return true;
  } else if (simObject == this.bob2_) {
    this.dragBlock_ = 1;
    return true;
  } else if (simObject == this.topMass_) {
    return true;
  }
  return false;
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  const va = this.getVarsList();
  const p = location.subtract(offset);
  if (simObject == this.topMass_) {
    va.setValue(FIX_X, p.getX());
    va.setValue(FIX_Y, p.getY());
  } else if (this.dragBlock_ == 0 || this.dragBlock_ == 1) {
    const block = this.dragBlock_ == 0 ? this.bob1_ : this.bob2_;
    if (simObject != block) {
      return;
    }
    const idx = 2*this.dragBlock_;
    va.setValue(U1X + idx, p.getX());
    va.setValue(U1Y + idx, p.getY());
    va.setValue(V1X + idx, 0);
    va.setValue(V1Y + idx, 0);
    // derived energy variables are discontinuous
    va.incrSequence(KE, PE, TE);
  }
  this.moveObjects(va.getValues());
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void {
  this.dragBlock_ = -1;
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[TIME] = 1; // time
  const forces1 = this.spring1_.calculateForces();
  const f12 = forces1[1].getVector();
  const forces2 = this.spring2_.calculateForces();
  const f21 = forces2[0].getVector();
  const f22 = forces2[1].getVector();
  const m1 = this.bob1_.getMass();
  const m2 = this.bob2_.getMass();
  const b = this.damping_;
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  if (this.dragBlock_ != 0) {
    change[U1X] = vars[V1X]; //U1x' = V1x
    change[U1Y] = vars[V1Y]; //U1y' = V1y
    // V1x:  x accel of bob1:  has two springs acting on it, plus damping
    change[V1X] = (f12.getX() + f21.getX() - b * vars[V1X]) / m1;
    // V1y:  y accel of bob1:  two springs acting, plus damping and gravity
    change[V1Y] = -this.gravity_ + (f12.getY() + f21.getY() - b * vars[V1Y]) / m1;
  }
  if (this.dragBlock_ != 1) {
    change[U2X] = vars[V2X]; //U2x' = V2x
    change[U2Y] = vars[V2Y]; //U2y' = V2y
    // V2x:  x accel of bob2:  has one spring acting, plus damping
    change[V2X] = (f22.getX() - b * vars[V2X]) / m2;
    // V2y:  y accel of bob2:  gravity, damping, and one spring
    change[V2Y] = -this.gravity_ + (f22.getY() - b * vars[V2Y]) / m2;
  }
  return null;
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
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Double2DSpringSim.en.GRAVITY);
};

/** Return mass of pendulum block 1.
@return mass of pendulum block 1
*/
getMass1(): number {
  return this.bob1_.getMass();
};

/** Set mass of pendulum block 1
@param value mass of pendulum block 1
*/
setMass1(value: number) {
  this.bob1_.setMass(value);
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(Double2DSpringSim.en.MASS1);
};

/** Return mass of pendulum block 2.
@return mass of pendulum block 2
*/
getMass2(): number {
  return this.bob2_.getMass();
};

/** Set mass of pendulum block 2
@param value mass of pendulum block 2
*/
setMass2(value: number) {
  this.bob2_.setMass(value);
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(Double2DSpringSim.en.MASS2);
};

/** Return spring resting length
@return spring resting length
*/
getLength(): number {
  return this.springs_[0].getRestLength();
};

/** Set spring resting length
@param value spring resting length
*/
setLength(value: number) {
  for (let i=0; i<this.springs_.length; i++) {
    this.springs_[i].setRestLength(value);
  }
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Double2DSpringSim.en.LENGTH);
};

/** Returns spring stiffness
@return spring stiffness
*/
getStiffness(): number {
  return this.springs_[0].getStiffness();
};

/** Sets spring stiffness
@param value spring stiffness
*/
setStiffness(value: number) {
  for (let i=0; i<this.springs_.length; i++) {
    this.springs_[i].setStiffness(value);
  }
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Double2DSpringSim.en.STIFFNESS);
};

/** Return damping
@return damping
*/
getDamping(): number {
  return this.damping_;
};

/** Set damping
@param value damping
*/
setDamping(value: number) {
  this.damping_ = value;
  this.broadcastParameter(Double2DSpringSim.en.DAMPING);
};

static readonly en: i18n_strings = {
  ANCHOR_X: 'anchor X',
  ANCHOR_Y: 'anchor Y',
  X_POSITION: 'X position',
  Y_POSITION: 'Y position',
  X_VELOCITY: 'X velocity',
  Y_VELOCITY: 'Y velocity',
  DAMPING: 'damping',
  GRAVITY: 'gravity',
  MASS1: 'mass-1',
  MASS2: 'mass-2',
  LENGTH: 'spring length',
  STIFFNESS: 'spring stiffness',
  REST_STATE: 'rest state'
};

static readonly de_strings: i18n_strings = {
  ANCHOR_X: 'Anker X',
  ANCHOR_Y: 'Anker Y',
  X_POSITION: 'X Position',
  Y_POSITION: 'Y Position',
  X_VELOCITY: 'X Geschwindigkeit',
  Y_VELOCITY: 'Y Geschwindigkeit',
  DAMPING: 'Dämpfung',
  GRAVITY: 'Gravitation',
  MASS1: 'Masse-1',
  MASS2: 'Masse-2',
  LENGTH: 'Federlänge',
  STIFFNESS: 'Federsteifheit',
  REST_STATE: 'ruhe Zustand'
};

static readonly i18n = Util.LOCALE === 'de' ? Double2DSpringSim.de_strings : Double2DSpringSim.en;

} // end class

type i18n_strings = {
  ANCHOR_X: string,
  ANCHOR_Y: string,
  X_POSITION: string,
  Y_POSITION: string,
  X_VELOCITY: string,
  Y_VELOCITY: string,
  DAMPING: string,
  GRAVITY: string,
  MASS1: string,
  MASS2: string,
  LENGTH: string,
  STIFFNESS: string,
  REST_STATE: string
};

Util.defineGlobal('sims$springs$Double2DSpringSim', Double2DSpringSim);
