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
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js';
import { ParameterBoolean } from '../../lab/util/Observe.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

const U1 = 0;
const U2 = 1;
const V1 = 2;
const V2 = 3;
const A1 = 4;
const A2 = 5;
const KE = 6;
const PE = 7;
const TE = 8;
const TIME = 9;

/** Simulation of two blocks connected by springs. Movement is only along one dimension.
No gravity force or damping force. The configuration is:
```text
wall1-spring1-block1-spring2-block2-spring3-wall2
```

Variables and Parameters
-------------------------

Variables:
```text
vars[0] = u1 = position of block 1
vars[1] = u2 = position of block 2
vars[2] = v1 = velocity of block 1
vars[3] = v2 = velocity of block 2
```
Parameters:
```text
R = rest length of spring
k = spring constant
b = damping
m = mass
L = spring stretch
F = force
```

Equations of Motion
-------------------------
See also <http://www.myphysicslab.com/dbl_spring1.html>.

Forces:
```text
F1 = -k1 L1 + k2 L2 - b v1 = m1 v1'
F2 = -k2 L2 + k3 L3 - b v2 = m2 v2'
```

Equations of Motion:
```text
u1' = v1
u2' = v2
v1' = F1/m1 = (-k1 L1 + k2 L2 - b v1) / m1
v2' = F2/m2 = (-k2 L2 + k3 L3 - b v2) / m2
```

**TO DO**  make a vertical configuration with gravity
*/

export class DoubleSpringSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {

  private block1_: PointMass;
  private block2_: PointMass;
  private wall1_: PointMass;
  private wall2_: PointMass;
  private stiffness_: number = 6.0;
  private thirdSpring_: boolean;
  private spring1_: Spring;
  private spring2_: Spring;
  private spring3_: Spring;
  private springs_: Spring[];
  private damping_: number = 0;
  private potentialOffset_: number = 0;
  /** the block being dragged, or -1 when no drag is happening */
  private dragBlock_: number = -1;

/**
* @param thirdSpring whether to have the third spring
* @param opt_name name of this as a Subject
*/
constructor(thirdSpring: boolean, opt_name?: string) {
  super(opt_name);
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  const var_names = [
    DoubleSpringSim.en.POSITION+'-1',
    DoubleSpringSim.en.POSITION+'-2',
    DoubleSpringSim.en.VELOCITY+'-1',
    DoubleSpringSim.en.VELOCITY+'-2',
    DoubleSpringSim.en.ACCELERATION+'-1',
    DoubleSpringSim.en.ACCELERATION+'-2',
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY,
    VarsList.en.TIME
  ];
  const i18n_names = [
    DoubleSpringSim.i18n.POSITION+'-1',
    DoubleSpringSim.i18n.POSITION+'-2',
    DoubleSpringSim.i18n.VELOCITY+'-1',
    DoubleSpringSim.i18n.VELOCITY+'-2',
    DoubleSpringSim.i18n.ACCELERATION+'-1',
    DoubleSpringSim.i18n.ACCELERATION+'-2',
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(A1, A2, KE, PE, TE);
  this.block1_ = PointMass.makeSquare(1, 'block1');
  this.block2_ = PointMass.makeSquare(1, 'block2');
  this.wall1_ = PointMass.makeRectangle(0.4, 4, 'wall1');
  this.wall1_.setMass(Infinity);
  this.wall1_.setPosition(new Vector(-0.2,  0));
  this.wall2_ = PointMass.makeRectangle(0.4, 4, 'wall2');
  this.wall2_.setMass(Infinity);
  this.wall2_.setPosition(new Vector(9.8,  0));
  const length = 3.0;
  this.thirdSpring_ = thirdSpring;
  this.spring1_ = new Spring('spring1',
      this.wall1_, new Vector(this.wall1_.getWidth()/2.0, 0),
      this.block1_, Vector.ORIGIN,
      /*restLength=*/length, /*stiffness=*/this.stiffness_);
  this.spring2_ = new Spring('spring2',
      this.block1_, Vector.ORIGIN,
      this.block2_, Vector.ORIGIN,
      /*restLength=*/length, /*stiffness=*/this.stiffness_);
  this.spring3_ = new Spring('spring3',
      this.block2_, Vector.ORIGIN,
      this.wall2_, new Vector(-this.wall2_.getWidth()/2.0, 0),
      /*restLength=*/length, /*stiffness=*/(this.thirdSpring_ ? this.stiffness_ : 0));
  this.springs_ = [this.spring1_, this.spring2_, this.spring3_];
  this.getSimList().add(this.wall1_, this.wall2_, this.block1_, this.block2_,
      this.spring1_, this.spring2_, this.spring3_);
  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, DoubleSpringSim.en.DAMPING,
      DoubleSpringSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, DoubleSpringSim.en.LENGTH,
      DoubleSpringSim.i18n.LENGTH,
      () => this.getLength(), a => this.setLength(a)));
  this.addParameter(new ParameterNumber(this, DoubleSpringSim.en.MASS1,
      DoubleSpringSim.i18n.MASS1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addParameter(new ParameterNumber(this, DoubleSpringSim.en.MASS2,
      DoubleSpringSim.i18n.MASS2,
      () => this.getMass2(), a => this.setMass2(a)));
  this.addParameter(new ParameterNumber(this, DoubleSpringSim.en.STIFFNESS,
      DoubleSpringSim.i18n.STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a)));
  this.addParameter(new ParameterBoolean(this, DoubleSpringSim.en.THIRD_SPRING,
      DoubleSpringSim.i18n.THIRD_SPRING,
      () => this.getThirdSpring(), a => this.setThirdSpring(a)));
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
  this.restState();
  this.getVarsList().setValue(V2, -2.3);
  this.saveInitialState();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', block1_: '+this.block1_
      +', block2_: '+this.block2_
      +', spring1_: '+this.spring1_
      +', damping_: '+Util.NF(this.damping_)
      +', stiffness_: '+Util.NF(this.stiffness_)
      +', thirdSpring_: '+this.thirdSpring_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'DoubleSpringSim';
};

/** Sets the simulation to a motionless state.
```text
R = restLength of springs
k = stiffness of springs
L = stretch of springs
u = position of bobs
```
Need forces on each block to be zero
```text
0 = -k1 L1 + k2 L2
0 = -k2 L2 + k3 L3
```
Really its an equation for finding `u1, u2 =` position of the two blocks.
```text
0 = -k1 (u1 - Wall1 - R1) + k2 (u2 - u1 - R2)
0 = -k2 (u2 - u1 - R2) + k3 (Wall2 - u2 - R3)
```
We have 2 equations in 2 unknowns, solve the first for `u2`
```text
0 = -k1 (u1 - Wall1 - R1) + k2 (u2 - u1 - R2)
0 = -(k1/k2) (u1 - Wall1 - R1) + u2 - u1 - R2
u2 = (k1/k2)(u1 - Wall1 - R1) + u1 + R2
```
Plug that into the second equation and solve for `u1`:
```text
0 = -k2 (u2 - u1 - R2) + k3 (Wall2 - u2 - R3)
0 = -k2 ((k1/k2)(u1 - Wall1 - R1) + u1 + R2 - u1 - R2)
    + k3 (Wall2 - ((k1/k2)(u1 - Wall1 - R1) + u1 + R2) - R3)
0 = -k1 (u1 - Wall1 - R1)
    + k3 (Wall2 - (k1/k2)(u1 - Wall1 - R1) - u1 - R2 - R3)
0 = -k1 u1 + k1 Wall1 + k1 R1
    + k3 Wall2 - (k3 k1/k2)(u1 - Wall1 - R1) - k3 u1 - k3 R2 - k3 R3
0 = -k1 u1 - (k3 k1/k2) u1- k3 u1
    + k1 Wall1 + k1 R1 + k3 Wall2 + (k3 k1/k2)(Wall1 + R1) - k3 R2 - k3 R3
(k1 + (k3 k1/k2) + k3) u1 =
    + k1 Wall1 + k1 R1 + k3 Wall2 + (k3 k1/k2)(Wall1 + R1) - k3 R2 - k3 R3
u1 = (k1 Wall1 + k1 R1 + k3 Wall2 + (k3 k1/k2)(Wall1 + R1) - k3 R2 - k3 R3)
    / (k1 + (k3 k1/k2) + k3)
```
*/
restState(): void {
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  const vars = this.getVarsList().getValues();
  const k1 = this.spring1_.getStiffness();
  const k2 = this.spring2_.getStiffness();
  const k3 = this.spring3_.getStiffness();
  const R1 = this.spring1_.getRestLength();
  const R2 = this.spring2_.getRestLength();
  const R3 = this.spring3_.getRestLength();
  const w1 = this.wall1_.getBoundsWorld().getRight();
  const w2 = this.wall2_.getBoundsWorld().getLeft();
  let u1 = (k1 * w1 + k1 * R1 + k3 * w2 + (k3 * k1/k2)*(w1 + R1) - k3 * R2 - k3 * R3);
  u1 = u1 / (k1 + (k3 * k1/k2) + k3);
  vars[U1] = u1;
  vars[U2] = (k1/k2)*(u1 - w1 - R1) + u1 + R2;
  vars[V1] = vars[V2] = 0;
  this.getVarsList().setValues(vars);
  this.moveObjects(vars);
  this.potentialOffset_ = 0;
  this.setPEOffset(-this.getEnergyInfo().getPotential());
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const ke = this.block1_.getKineticEnergy() + this.block2_.getKineticEnergy();
  let pe = this.potentialOffset_;
  this.springs_.forEach(spr => pe += spr.getPotentialEnergy());
  return new EnergyInfo(pe, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  const rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  vars[A1] = rate[V1];
  vars[A2] = rate[V2];
  const ei = this.getEnergyInfo();
  vars[KE] = ei.getTranslational();
  vars[PE] = ei.getPotential();
  vars[TE] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
@param vars
*/
private moveObjects(vars: number[]): void {
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  this.block1_.setPosition(new Vector(vars[U1], 0));
  this.block1_.setVelocity(new Vector(vars[V1], 0));
  this.block2_.setPosition(new Vector(vars[U2], 0));
  this.block2_.setVelocity(new Vector(vars[V2], 0));
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject == this.block1_) {
    this.dragBlock_ = 0;
    return true;
  } else if (simObject == this.block2_) {
    this.dragBlock_ = 1;
    return true;
  }
  this.dragBlock_ = -1;
  return false;
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  const p = location.subtract(offset);
  if (this.dragBlock_ == 0 || this.dragBlock_ == 1) {
    const block = this.dragBlock_ == 0 ? this.block1_ : this.block2_;
    if (simObject != block) {
      return;
    }
    // vars  0   1   2   3   4   5   6   7  8  9
    //       U1  U2  V1  V2  A1  A2  KE  PE TE time
    const va = this.getVarsList();
    va.setValue(this.dragBlock_, p.getX());
    va.setValue(this.dragBlock_ + V1, 0); // velocity
    // derived energy variables are discontinuous
    va.incrSequence(KE, PE, TE);
    this.moveObjects(va.getValues());
  }
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  this.dragBlock_ = -1;
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  Util.zeroArray(change);
  change[TIME] = 1.0;  // time
  this.moveObjects(vars);
  // find which springs are "reversed" from usual position.  Set a variable to 1 or -1
  // accordingly to reverse the direction that the spring force is acting.
  const u1 = vars[U1];
  const u2 = vars[U2];
  // if block1 is left of the left wall
  const S1 = u1 < this.wall1_.getPosition().getX() + this.wall1_.getWidth()/2 ? -1 : 1;
  // if block2 is left of block1
  const S2 = u2 < u1 ? -1 : 1;
  // if block2 is right of the right wall
  const S3 = u2 > this.wall2_.getPosition().getX() - this.wall2_.getWidth()/2 ? -1 : 1;
  if (this.dragBlock_ != 0) {
    // u1' = v1
    change[U1] = vars[V1];
    // v1' = F1/m1 = (-k1 L1 + k2 L2 - b v1) / m1
    change[V1] = (-S1*this.spring1_.getStiffness()*this.spring1_.getStretch()
        + S2*this.spring2_.getStiffness()*this.spring2_.getStretch()
        - this.damping_*vars[V1]
        ) / this.block1_.getMass();
  }
  if (this.dragBlock_ != 1) {
    // u2' = v2
    change[U2] = vars[V2];
    // v2' = F2/m2 = (-k2 L2 + k3 L3 - b v2) / m2
    change[V2] = (-S2*this.spring2_.getStiffness()*this.spring2_.getStretch()
        + S3*this.spring3_.getStiffness()*this.spring3_.getStretch()
        - this.damping_*vars[V2]
        ) / this.block2_.getMass();
  }
  return null;
};

/** Return whether to have the third spring
@return whether to have the third spring
*/
getThirdSpring(): boolean {
  return this.thirdSpring_;
};

/** Set whether to have the third spring
@param value whether to have the third spring
*/
setThirdSpring(value: boolean) {
  if (value != this.thirdSpring_) {
    this.thirdSpring_ = value;
    this.spring3_.setStiffness(value ? this.stiffness_ : 0);
    // vars  0   1   2   3   4   5   6   7  8  9
    //       U1  U2  V1  V2  A1  A2  KE  PE TE time
    // discontinuous change in energy
    this.getVarsList().incrSequence(KE, PE, TE);
    this.broadcastParameter(DoubleSpringSim.en.THIRD_SPRING);
  }
};

/** Return mass of pendulum block 1.
@return mass of pendulum block 1
*/
getMass1(): number {
  return this.block1_.getMass();
};

/** Set mass of pendulum block 1
@param value mass of pendulum block 1
*/
setMass1(value: number) {
  this.block1_.setMass(value);
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(DoubleSpringSim.en.MASS1);
};

/** Return mass of pendulum block 2.
@return mass of pendulum block 2
*/
getMass2(): number {
  return this.block2_.getMass();
};

/** Set mass of pendulum block 2
@param value mass of pendulum block 2
*/
setMass2(value: number) {
  this.block2_.setMass(value);
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(DoubleSpringSim.en.MASS2);
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
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(DoubleSpringSim.en.LENGTH);
};

/** Returns spring stiffness
@return spring stiffness
*/
getStiffness(): number {
  return this.stiffness_;
};

/** Sets spring stiffness
@param value spring stiffness
*/
setStiffness(value: number) {
  if (this.stiffness_ != value) {
    this.stiffness_ = value;
    this.spring1_.setStiffness(value);
    this.spring2_.setStiffness(value);
    if (this.thirdSpring_) {
      this.spring3_.setStiffness(value);
    }
    // vars  0   1   2   3   4   5   6   7  8  9
    //       U1  U2  V1  V2  A1  A2  KE  PE TE time
    // discontinuous change in energy
    this.getVarsList().incrSequence(PE, TE);
    this.broadcastParameter(DoubleSpringSim.en.STIFFNESS);
  }
};

/**
*/
getDamping(): number {
  return this.damping_;
};

/**
@param value
*/
setDamping(value: number) {
  this.damping_ = value;
  this.broadcastParameter(DoubleSpringSim.en.DAMPING);
};

static readonly en: i18n_strings = {
  ACCELERATION: 'acceleration',
  DAMPING: 'damping',
  MASS1: 'mass-1',
  MASS2: 'mass-2',
  POSITION: 'position',
  LENGTH: 'spring length',
  STIFFNESS: 'spring stiffness',
  VELOCITY: 'velocity',
  REST_STATE: 'rest state',
  THIRD_SPRING: 'third spring'
};

static readonly de_strings: i18n_strings = {
  ACCELERATION: 'Beschleunigung',
  DAMPING: 'Dämpfung',
  MASS1: 'Masse-1',
  MASS2: 'Masse-2',
  POSITION: 'Position',
  LENGTH: 'Federlänge',
  STIFFNESS: 'Federsteifheit',
  VELOCITY: 'Geschwindigkeit',
  REST_STATE: 'ruhe Zustand',
  THIRD_SPRING: 'dritte Feder'
};

static readonly i18n = Util.LOCALE === 'de' ? DoubleSpringSim.de_strings : DoubleSpringSim.en;

} // end class

type i18n_strings = {
  ACCELERATION: string,
  DAMPING: string,
  MASS1: string,
  MASS2: string,
  POSITION: string,
  LENGTH: string,
  STIFFNESS: string,
  VELOCITY: string,
  REST_STATE: string,
  THIRD_SPRING: string
};

Util.defineGlobal('sims$springs$DoubleSpringSim', DoubleSpringSim);
