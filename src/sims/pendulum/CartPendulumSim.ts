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
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { Spring } from '../../lab/model/Spring.js';
import { SimObject } from '../../lab/model/SimObject.js'
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const X = 0;
const H = 1;
const XP = 2;
const HP = 3;
const WORK = 4;
const KE = 5;
const PE = 6;
const TE = 7;
const TIME = 8

/** Simulation of a cart moving on a horizontal track with a pendulum suspended from the
cart.

Variables and Parameters
-------------------------

Variables:
```text
x = horiz position of cart; when `x=0` the spring is relaxed.
h = pendulum angle in radians; vertical down is 0, counterclockwise is positive
v = x'
w = h'
```
Parameters:
```text
M = mass of cart
m = mass of pendulum
L = length of rod
d = cart damping
b = pendulum damping
k = spring stiffness
```

Equations of Motion
-------------------------

See derivation at <https://www.myphysicslab.com/pendulum/cart-pendulum-en.html>.
```text
x' = v
h' = w
v' = ( m w^2 L sin(h) + m g sin(h) cos(h) - k x - d v + b w cos(h)/L )
        / (M + m sin^2(h))
w' = ( -m w^2 L sin(h) cos(h) + k x cos(h) - (M + m) g sin(h) + d v cos(h)
       - (m + M) b w / (m L) )
       / (L (M + m sin^2(h)))
```
Note: the equations for the spring force are dependent on having the `x = 0` position
correspond to the spring being at its relaxed length. This makes the equations simpler,
but less general – therefore don't change rest length or attachment position of the
spring.

Variables Array
-------------------------

The variables are stored in the VarsList as follows
```text
vars[0] = x
vars[1] = h
vars[2] = x'
vars[3] = h'
```
*/
export class CartPendulumSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {
  private isDragging_: boolean = false;
  private length_: number = 1;
  private gravity_: number = 9.8;
  private dampingCart_: number = 0;
  private dampingPendulum_: number = 0;
  private initialEnergy_: number = 0;
  private potentialOffset_: number = 0;
  private fixedPoint_: PointMass = PointMass.makeSquare(0.5, 'fixed point');
  private rod_: ConcreteLine = new ConcreteLine('rod');
  private cart_: PointMass = PointMass.makeRectangle(1, 0.3, 'cart');
  private pendulum_: PointMass = PointMass.makeCircle(0.3, 'bob');
  private spring_: Spring;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  const var_names = [
    CartPendulumSim.en.CART_POSITION,
    CartPendulumSim.en.PENDULUM_ANGLE,
    CartPendulumSim.en.CART_VELOCITY,
    CartPendulumSim.en.PENDULUM_ANGLE_VELOCITY,
    CartPendulumSim.en.WORK_FROM_DAMPING,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY,
    VarsList.en.TIME
  ];
  const i18n_names = [
    CartPendulumSim.i18n.CART_POSITION,
    CartPendulumSim.i18n.PENDULUM_ANGLE,
    CartPendulumSim.i18n.CART_VELOCITY,
    CartPendulumSim.i18n.PENDULUM_ANGLE_VELOCITY,
    CartPendulumSim.i18n.WORK_FROM_DAMPING,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME
  ];
  const va = new VarsList(var_names, i18n_names, this.getName()+'_VARS');
  this.setVarsList(va);
  va.setComputed(4, 5, 6, 7);
  this.fixedPoint_.setMass(Infinity);
  this.fixedPoint_.setPosition(new Vector(3, 0));
  this.spring_ = new Spring('spring',
      this.fixedPoint_, Vector.ORIGIN,
      this.cart_, Vector.ORIGIN,
      /*restLength=*/3.0, /*stiffness=*/6.0);
  this.getSimList().add(this.fixedPoint_, this.rod_, this.cart_, this.pendulum_,
      this.spring_);
  this.initWork();
  this.saveInitialState();
  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.GRAVITY,
      CartPendulumSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.CART_MASS,
      CartPendulumSim.i18n.CART_MASS,
      () => this.getCartMass(), a => this.setCartMass(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.PENDULUM_MASS,
      CartPendulumSim.i18n.PENDULUM_MASS,
      () => this.getPendulumMass(), a => this.setPendulumMass(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.CART_DAMPING,
      CartPendulumSim.i18n.CART_DAMPING,
      () => this.getCartDamping(), a => this.setCartDamping(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.PENDULUM_DAMPING,
      CartPendulumSim.i18n.PENDULUM_DAMPING,
      () => this.getPendulumDamping(),
       a => this.setPendulumDamping(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.PENDULUM_LENGTH,
      CartPendulumSim.i18n.PENDULUM_LENGTH,
      () => this.getPendulumLength(),
      a => this.setPendulumLength(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.SPRING_STIFFNESS,
      CartPendulumSim.i18n.SPRING_STIFFNESS,
      () => this.getSpringStiffness(),
      a => this.setSpringStiffness(a)));
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
      +', dampingCart_: '+Util.NF(this.dampingCart_)
      +', dampingPendulum_: '+Util.NF(this.dampingPendulum_)
      +', length_: '+Util.NF(this.length_)
      +', cart_: '+this.cart_
      +', pendulum_: '+this.pendulum_
      +', spring_: '+this.spring_
      +', rod_: '+this.rod_
      +', fixedPoint_: '+this.fixedPoint_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'CartPendulumSim';
};

/** Initialize 'work done by damping' to zero.
*/
initWork(): void {
  this.getVarsList().setValue(4, 0);
  this.initialEnergy_ = this.getEnergyInfo().getTotalEnergy();
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const vars = this.getVarsList().getValues();
  return this.getEnergyInfo_(vars[WORK]);
};

/**
* @param work
*/
private getEnergyInfo_(work: number): EnergyInfo {
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  let ke = this.cart_.getKineticEnergy();
  ke += this.pendulum_.getKineticEnergy();
  let pe = this.spring_.getPotentialEnergy();
  const y = this.pendulum_.getPosition().getY();
  pe += this.gravity_ * this.pendulum_.getMass() * (y + this.length_);
  return new EnergyInfo(pe + this.potentialOffset_, ke, /*rotational=*/NaN, work,
       this.initialEnergy_);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  // limit the pendulum angle to +/- Pi
  const angle = Util.limitAngle(vars[H]);
  if (angle != vars[H]) {
    // Increase sequence number of angle variable when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    this.getVarsList().setValue(1, angle);
    vars[H] = angle;
  }
  this.moveObjects(vars);
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  const ei = this.getEnergyInfo_(vars[WORK]);
  va.setValue(KE, ei.getTranslational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
};

/**
* @param vars
*/
private moveObjects(vars: number[]): void {
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  const angle = vars[H];
  const sinAngle = Math.sin(angle);
  const cosAngle = Math.cos(angle);
  this.cart_.setPosition(new Vector(vars[X],  0));
  this.cart_.setVelocity(new Vector(vars[XP], 0, 0));
  this.pendulum_.setPosition(new Vector(
      this.cart_.getPosition().getX() + this.length_*sinAngle,
      this.cart_.getPosition().getY() - this.length_*cosAngle));
  const vx = vars[XP] + this.length_*vars[HP]*cosAngle;
  const vy = this.length_*vars[HP]*sinAngle;
  this.pendulum_.setVelocity(new Vector(vx, vy));
  this.rod_.setStartPoint(this.cart_.getPosition());
  this.rod_.setEndPoint(this.pendulum_.getPosition());
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject == this.cart_ || simObject == this.pendulum_) {
    this.isDragging_ = true;
    return true;
  } else {
    return false;
  }
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  const p = location.subtract(offset);
  if (simObject == this.cart_) {
    vars[X] = p.getX();
    vars[XP] = 0;
    vars[HP] = 0;
  } else if (simObject == this.pendulum_) {
    const x1 = vars[X]; // center of cart
    const y1 = 0;
    const x2 = p.getX();  //  center of pendulum
    const y2 = p.getY();
    const th = Math.atan2(x2-x1, -(y2-y1));
    vars[H] = th;
    vars[XP] = 0;
    vars[HP] = 0;
  }
  va.setValues(vars);
  this.initWork();
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  this.isDragging_ = false;
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[TIME] = 1; // time
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  if (!this.isDragging_) {
    const m = this.pendulum_.getMass(); // pendulum mass
    const M = this.cart_.getMass(); // cart mass
    const L = this.length_;  // length of pendulum rod
    const k = this.spring_.getStiffness();
    const sh = Math.sin(vars[H]);  // sin(h)
    const csh = Math.cos(vars[H]); // cos(h)
    change[X] = vars[XP];  //x' = v
    change[H] = vars[HP];  //h' = w
    //v' = (m w^2 L sin(h) + m g sin(h) cos(h) - k x - d v + b w cos(h)/L)
    //     /(M + m sin^2(h))
    let numer = m*vars[HP]*vars[HP]*L*sh + m*this.gravity_*sh*csh - k*vars[X]
          - this.dampingCart_*vars[XP] + this.dampingPendulum_*vars[HP]*csh/L;
    change[XP] = numer/(M + m*sh*sh);
    //w' = ( -m w^2 L sin(h) cos(h) + k x cos(h) - (M + m) g sin(h) + d v cos(h)
    //       -(m + M) b w / (m L) )
    //       / (L (M + m sin^2(h)))
    numer = -m*vars[HP]*vars[HP]*L*sh*csh + k*vars[X]*csh - (M+m)*this.gravity_*sh
        + this.dampingCart_*vars[XP]*csh;
    numer += -(m+M)*this.dampingPendulum_*vars[HP]/(m*L);
    change[HP] = numer/(L*(M + m*sh*sh));
    change[WORK] = -this.dampingCart_*vars[XP]*vars[XP]
        - this.dampingPendulum_*vars[HP]*vars[HP];
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
  this.initWork();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(CartPendulumSim.en.GRAVITY);
};

/** Return mass of pendulum bob.
@return mass of pendulum bob
*/
getPendulumMass(): number {
  return this.pendulum_.getMass();
};

/** Set mass of pendulum bob
@param value mass of pendulum bob
*/
setPendulumMass(value: number) {
  this.pendulum_.setMass(value);
  this.initWork();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6, 7);
  this.broadcastParameter(CartPendulumSim.en.PENDULUM_MASS);
};

/** Return mass of cart.
@return mass of cart
*/
getCartMass(): number {
  return this.cart_.getMass();
};

/** Set mass of cart
@param value mass of cart
*/
setCartMass(value: number) {
  this.cart_.setMass(value);
  this.initWork();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6, 7);
  this.broadcastParameter(CartPendulumSim.en.CART_MASS);
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
  this.initWork();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(CartPendulumSim.en.SPRING_STIFFNESS);
};

/** Return cart damping
@return cart damping
*/
getCartDamping(): number {
  return this.dampingCart_;
};

/** Set cart damping
@param value cart damping
*/
setCartDamping(value: number) {
  this.dampingCart_ = value;
  this.initWork();
  this.broadcastParameter(CartPendulumSim.en.CART_DAMPING);
};

/** Return pendulum damping
@return pendulum damping
*/
getPendulumDamping(): number {
  return this.dampingPendulum_;
};

/** Set pendulum damping
@param value pendulum damping
*/
setPendulumDamping(value: number) {
  this.dampingPendulum_ = value;
  this.initWork();
  this.broadcastParameter(CartPendulumSim.en.PENDULUM_DAMPING);
};

/** Return length of pendulum rod
@return length of pendulum rod
*/
getPendulumLength(): number {
  return this.length_;
};

/** Set length of pendulum rod
@param value length of pendulum rod
*/
setPendulumLength(value: number) {
  this.length_ = value;
  this.initWork();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6, 7);
  this.broadcastParameter(CartPendulumSim.en.PENDULUM_LENGTH);
};

static readonly en: i18n_strings = {
  CART_POSITION: 'cart position',
  PENDULUM_ANGLE: 'pendulum angle',
  CART_VELOCITY: 'cart velocity',
  PENDULUM_ANGLE_VELOCITY: 'pendulum angle velocity',
  CART_DAMPING: 'cart damping',
  PENDULUM_DAMPING: 'pendulum damping',
  GRAVITY: 'gravity',
  CART_MASS: 'cart mass',
  PENDULUM_MASS: 'pendulum mass',
  PENDULUM_LENGTH: 'pendulum length',
  SPRING_STIFFNESS: 'spring stiffness',
  WORK_FROM_DAMPING: 'work from damping'
};

static readonly de_strings: i18n_strings = {
  CART_POSITION: 'Wagenposition',
  PENDULUM_ANGLE: 'Pendelwinkel',
  CART_VELOCITY: 'Wagengeschwindigkeit',
  PENDULUM_ANGLE_VELOCITY: 'Pendelwinkelgeschwindigkeit',
  CART_DAMPING: 'Wagendämpfung',
  PENDULUM_DAMPING: 'Pendeldämpfung',
  GRAVITY: 'Gravitation',
  CART_MASS: 'Wagenmasse',
  PENDULUM_MASS: 'Pendelmasse',
  PENDULUM_LENGTH: 'Pendellänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  WORK_FROM_DAMPING: 'Arbeit von Dämpfung'
};

static readonly i18n = Util.LOCALE === 'de' ? CartPendulumSim.de_strings : CartPendulumSim.en;

} // end class

type i18n_strings = {
  CART_POSITION: string,
  PENDULUM_ANGLE: string,
  CART_VELOCITY: string,
  PENDULUM_ANGLE_VELOCITY: string,
  CART_DAMPING: string,
  PENDULUM_DAMPING: string,
  GRAVITY: string,
  CART_MASS: string,
  PENDULUM_MASS: string,
  PENDULUM_LENGTH: string,
  SPRING_STIFFNESS: string,
  WORK_FROM_DAMPING: string
};

Util.defineGlobal('sims$pendulum$CartPendulumSim', CartPendulumSim);
