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

const UX = 0;
const UY = 1;
const VX = 2;
const VY = 3;
const KE = 4;
const PE = 5;
const TE = 6;
const TIME = 7;
const ANCHORX = 8;
const ANCHORY = 9;

/** 2-D spring simulation with gravity. An immoveable top anchor mass with a spring and
moveable mass hanging below and swinging in 2D. The top anchor mass can however be
dragged by the user.

Variables and Parameters
-------------------------
Here is a diagram of the two masses showing the definition of the angle `th`:
```text
       T      .
        \     .
         \ th .
          \   .
           \  .
            \ .
             U
```
Variables:
```text
U = (Ux, Uy) = position of center of bob
V = (Vx, Vy) = velocity of bob
th = angle with vertical (radians); 0 = hanging down; positive is counter clockwise
L = stretch of spring from rest length
```
Parameters:
```text
T = (Tx, Ty) = position of top anchor mass
R = rest length of spring
k = spring constant
b = damping constant
m = mass of bob
```

Equations of Motion
-------------------------
The derivation of the equations of motion is shown in more detail at
<http://www.myphysicslab.com/spring2d.html>.
```text
Fx = - k L sin(th) - b Vx = m Vx'
Fy = - m g + k L cos(th) - b Vy = m Vy'
xx = Ux - Tx
yy = Uy - Ty
len = Sqrt(xx^2+yy^2)
L = len - R
th = atan(xx/yy)
cos(th) = -yy / len
sin(th) = xx / len
```
Differential Equations:
```text
Ux' = Vx
Uy' = Vy
Vx' = -(k/m)L sin(th) -(b/m)Vx
Vy' = -g + (k/m)L cos(th) -(b/m)Vy
```

Variables Array
-------------------------
The variables are stored in the VarsList as follows
```text
vars[0] = Ux
vars[1] = Uy
vars[2] = Vx
vars[3] = Vy
vars[4] = KE kinetic energy
vars[5] = PE potential energy
vars[6] = TE total energy
vars[7] = time
vars[8] = anchor X
vars[9] = anchor Y
```
*/
export class Spring2DSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {

  private isDragging_: boolean = false;
  private gravity_: number = 9.8;
  private damping_: number = 0;
  private potentialOffset_: number = 0;
  private anchor_: PointMass = PointMass.makeSquare(0.5, 'anchor');
  private bob_: PointMass = PointMass.makeCircle(0.5, 'bob');
  private spring_: Spring;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  const var_names = [
    Spring2DSim.en.X_POSITION,
    Spring2DSim.en.Y_POSITION,
    Spring2DSim.en.X_VELOCITY,
    Spring2DSim.en.Y_VELOCITY,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY,
    VarsList.en.TIME,
    Spring2DSim.en.ANCHOR_X,
    Spring2DSim.en.ANCHOR_Y
  ];
  const i18n_names = [
    Spring2DSim.i18n.X_POSITION,
    Spring2DSim.i18n.Y_POSITION,
    Spring2DSim.i18n.X_VELOCITY,
    Spring2DSim.i18n.Y_VELOCITY,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME,
    Spring2DSim.i18n.ANCHOR_X,
    Spring2DSim.i18n.ANCHOR_Y
  ];
  const va = new VarsList(var_names, i18n_names, this.getName()+'_VARS');
  this.setVarsList(va);
  va.setComputed(KE, PE, TE);
  this.anchor_.setPosition(new Vector(0, 3));
  this.bob_.setMass(0.5);
  this.spring_ = new Spring('spring',
      this.anchor_, Vector.ORIGIN,
      this.bob_, Vector.ORIGIN,
      /*restLength=*/2.5, /*stiffness=*/6.0);
  this.getSimList().add(this.anchor_, this.bob_, this.spring_);
  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, Spring2DSim.en.GRAVITY,
      Spring2DSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, Spring2DSim.en.MASS,
      Spring2DSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, Spring2DSim.en.DAMPING,
      Spring2DSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, Spring2DSim.en.SPRING_LENGTH,
      Spring2DSim.i18n.SPRING_LENGTH,
      () => this.getSpringRestLength(),
      a => this.setSpringRestLength(a)));
  this.addParameter(new ParameterNumber(this, Spring2DSim.en.SPRING_STIFFNESS,
      Spring2DSim.i18n.SPRING_STIFFNESS,
      () => this.getSpringStiffness(),
      a => this.setSpringStiffness(a)));
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  this.restState();
  va.setValue(VX, 1.5);
  va.setValue(VY, 1.7);
  this.saveInitialState();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', gravity_: '+Util.NF(this.gravity_)
      +', damping_: '+Util.NF(this.damping_)
      +', spring_: '+this.spring_
      +', bob_: '+this.bob_
      +', anchor_: '+this.anchor_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'Spring2DSim';
};

/** Sets simulation to motionless equilibrium resting state, and sets potential energy
* to zero.
*/
restState(): void {
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  const va = this.getVarsList();
  const vars = va.getValues();
  const fixY = vars[ANCHORY] = this.anchor_.getPosition().getY();
  vars[UX] = vars[ANCHORX] = this.anchor_.getPosition().getX();
  vars[UY] = fixY - this.spring_.getRestLength()
    - this.bob_.getMass()*this.gravity_/this.spring_.getStiffness();
  vars[VX] = vars[VY] = 0;
  va.setValues(vars);
  this.modifyObjects();
  this.potentialOffset_ = 0;
  this.setPEOffset(-this.getEnergyInfo().getPotential());
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const ke = this.bob_.getKineticEnergy();
  const y = this.bob_.getPosition().getY();
  let pe = this.gravity_ * this.bob_.getMass() * y;
  pe += this.spring_.getPotentialEnergy();
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  const ei = this.getEnergyInfo();
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  va.setValue(KE, ei.getTranslational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
};

/**
@param vars
*/
private moveObjects(vars: number[]): void {
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  this.bob_.setPosition(new Vector(vars[UX],  vars[UY]));
  this.bob_.setVelocity(new Vector(vars[VX], vars[VY], 0));
  this.anchor_.setPosition(new Vector(vars[ANCHORX],  vars[ANCHORY]));
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject == this.bob_) {
    this.isDragging_ = true;
    return true;
  } else if (simObject == this.anchor_) {
    return true;
  }
  return false;
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  const va = this.getVarsList();
  const p = location.subtract(offset);
  if (simObject == this.anchor_) {
    va.setValue(ANCHORX, p.getX());
    va.setValue(ANCHORY, p.getY());
  } else if (simObject == this.bob_) {
    va.setValue(UX, p.getX());
    va.setValue(UY, p.getY());
    va.setValue(VX, 0);
    va.setValue(VY, 0);
  }
  this.moveObjects(va.getValues());
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void {
  this.isDragging_ = false;
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[TIME] = 1; // time
  if (!this.isDragging_) {
    const forces = this.spring_.calculateForces();
    const f = forces[1];
    Util.assert(f.getBody() == this.bob_);
    const m = this.bob_.getMass();
    change[UX] = vars[VX]; // Ux' = Vx
    change[UY] = vars[VY]; // Uy' = Vy
    //Vx' = Fx / m = (- k L sin(th) - b Vx ) / m
    change[VX] = (f.getVector().getX() - this.damping_ * vars[VX]) / m;
    //Vy' = Fy / m = - g + (k L cos(th) - b Vy ) / m
    change[VY] = -this.gravity_ + (f.getVector().getY() - this.damping_*vars[VY])/m;
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
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Spring2DSim.en.GRAVITY);
};

/** Return mass of pendulum bob.
@return mass of pendulum bob
*/
getMass(): number {
  return this.bob_.getMass();
};

/** Set mass of pendulum bob
@param value mass of pendulum bob
*/
setMass(value: number) {
  this.bob_.setMass(value);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(Spring2DSim.en.MASS);
};

/** Return spring resting length
@return spring resting length
*/
getSpringRestLength(): number {
  return this.spring_.getRestLength();
};

/** Set spring resting length
@param value spring resting length
*/
setSpringRestLength(value: number) {
  this.spring_.setRestLength(value);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Spring2DSim.en.SPRING_LENGTH);
};

/** Returns spring stiffness
@return spring stiffness
*/
getSpringStiffness(): number {
  return this.spring_.getStiffness();
};

/** Sets spring stiffness
@param value spring stiffness
*/
setSpringStiffness(value: number) {
  this.spring_.setStiffness(value);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Spring2DSim.en.SPRING_STIFFNESS);
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
  this.broadcastParameter(Spring2DSim.en.DAMPING);
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
  MASS: 'mass',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
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
  MASS: 'Masse',
  SPRING_LENGTH: 'Federlänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  REST_STATE: 'ruhe Zustand'
};

static readonly i18n = Util.LOCALE === 'de' ? Spring2DSim.de_strings : Spring2DSim.en;

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
  MASS: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  REST_STATE: string
};

Util.defineGlobal('sims$springs$Spring2DSim', Spring2DSim);
