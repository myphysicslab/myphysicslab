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
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

const THETA = 0;
const THETAP = 1;
const R = 2;
const RP = 3;
const PHI = 4;
const PHIP = 5;
const TIME = 6;

/** Simulation of a stick dangling from a spring attached to a fixed point.  The stick is modeled as a massless rod with a point mass at each end.

Variables and Parameters
-------------------------
Variables:
```text
r = length of spring
theta = angle of spring with vertical (down = 0)
phi = angle of stick with vertical (down = 0)
```
Fixed parameters:
```text
b = spring rest length
L = stick length
m1 = mass at spring end
m2 = mass at free end
g = gravity
k = spring constant
```

Equations of Motion
-------------------------
The derivation of the equations of motion is shown at
<https://www.myphysicslab.com/dangle_stick.html>.
See also the Mathematica notebook [DangleStick.nb](DangleStick.pdf).
```text
theta'' = (-4 m1(m1+m2)r' theta'
    + 2 m1 m2 L phi'^2 sin(phi-theta)
    - 2g m1(m1+m2)sin(theta)
    + k m2 (b-r)sin(2(theta-phi)))
    /(2 m1(m1+m2)r)

r'' = (2 b k m1
    + b k m2
    - 2 k m1 r
    - k m2 r
    + 2 g m1(m1+m2) cos(theta)
    - k m2 (b-r) cos(2(theta-phi))
    + 2 L m1 m2 cos(phi-theta)phi'^2
    + 2 m1^2 r theta'^2
    + 2 m1 m2 r theta'^2)
    / (2 m1 (m1+m2))

phi'' = k(b-r)sin(phi-theta)/(L m1)
```

Variables Array
------------------------
The variables are stored in the VarsList as follows
```text
vars[0] = theta
vars[1] = theta'
vars[2] = r
vars[3] = r'
vars[4] = phi
vars[5] = phi'
vars[6] = time
```

To Do
-------------------------
1. add EnergyInfo

*/
export class DangleStickSim extends AbstractODESim implements Simulation, ODESim, EventHandler {

  private gravity_: number = 9.8;
  private fixedPoint_: PointMass;
  private bob1_: PointMass;
  private bob2_: PointMass;
  private stickLength_: number = 1;
  private stick_: ConcreteLine = new ConcreteLine('stick');
  private spring_: Spring;
  private isDragging_: boolean = false;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  const var_names = [
    DangleStickSim.en.SPRING_ANGLE,
    DangleStickSim.en.SPRING_ANGULAR_VELOCITY,
    DangleStickSim.en.SPRING_LENGTH,
    DangleStickSim.en.SPRING_LENGTH_VELOCITY,
    DangleStickSim.en.STICK_ANGLE,
    DangleStickSim.en.STICK_ANGULAR_VELOCITY,
    VarsList.en.TIME
  ];
  const i18n_names = [
    DangleStickSim.i18n.SPRING_ANGLE,
    DangleStickSim.i18n.SPRING_ANGULAR_VELOCITY,
    DangleStickSim.i18n.SPRING_LENGTH,
    DangleStickSim.i18n.SPRING_LENGTH_VELOCITY,
    DangleStickSim.i18n.STICK_ANGLE,
    DangleStickSim.i18n.STICK_ANGULAR_VELOCITY,
    VarsList.i18n.TIME
  ];
  const va = new VarsList(var_names, i18n_names, this.getName()+'_VARS');
  this.setVarsList(va);
  this.fixedPoint_ = PointMass.makeCircle(0.5, 'fixed_point');
  this.fixedPoint_.setMass(Infinity);
  this.bob1_ = PointMass.makeCircle(0.25, 'bob1');
  this.bob1_.setMass(1.0);
  this.bob2_ = PointMass.makeCircle(0.25, 'bob2');
  this.bob2_.setMass(1.0);
  this.spring_ = new Spring('spring',
      this.fixedPoint_, Vector.ORIGIN,
      this.bob1_, Vector.ORIGIN,
      /*restLength=*/1.0, /*stiffness=*/20.0);
  this.getSimList().add(this.fixedPoint_, this.bob1_, this.bob2_, this.stick_,
      this.spring_);

  // vars:  0,1,2,3,4,5:  theta,theta',r,r',phi,phi'
  va.setValue(THETA, Math.PI*30/180);
  va.setValue(THETAP, 0);
  va.setValue(R, 2.0);
  va.setValue(RP, 0);
  va.setValue(PHI, -Math.PI*30/180);
  va.setValue(PHIP, 0);
  va.setValue(TIME, 0);
  this.saveInitialState();
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.GRAVITY,
      DangleStickSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.MASS1,
      DangleStickSim.i18n.MASS1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.MASS2,
      DangleStickSim.i18n.MASS2,
      () => this.getMass2(), a => this.setMass2(a)));
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.SPRING_REST_LENGTH,
      DangleStickSim.i18n.SPRING_REST_LENGTH,
      () => this.getSpringRestLength(),
      a => this.setSpringRestLength(a)));
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.SPRING_STIFFNESS,
      DangleStickSim.i18n.SPRING_STIFFNESS,
      () => this.getSpringStiffness(),
      a => this.setSpringStiffness(a)));
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.STICK_LENGTH,
      DangleStickSim.i18n.STICK_LENGTH,
      () => this.getStickLength(), a => this.setStickLength(a)));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', gravity_: '+Util.NF(this.gravity_)
      +', stickLength_: '+Util.NF(this.stickLength_)
      +', spring_: '+this.spring_
      +', stick_: '+this.stick_
      +', bob1_: '+this.bob1_
      +', bob2_: '+this.bob2_
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'DangleStickSim';
};

/** Sets simulation to motionless equilibrium resting state.
*/
restState(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  vars[THETA] = vars[THETAP] = vars[RP] = vars[PHI] = vars[PHIP] = 0;
  const r = this.gravity_*(this.bob1_.getMass() + this.bob2_.getMass()) /
    this.spring_.getStiffness();
  vars[R] = this.spring_.getRestLength() + r;
  va.setValues(vars);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  // vars:  0,1,2,3,4,5:  theta,theta',r,r',phi,phi'
  // limit angles to +/- Pi
  const theta_ = Util.limitAngle(vars[THETA]);
  if (theta_ != vars[THETA]) {
    // This also increases sequence number when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    va.setValue(0, theta_, /*continuous=*/false);
    vars[THETA] = theta_;
  }
  const phi_ = Util.limitAngle(vars[PHI]);
  if (phi_ != vars[PHI]) {
    // This also increases sequence number when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    va.setValue(4, phi_, /*continuous=*/false);
    vars[PHI] = phi_;
  }
  this.moveObjects(vars);
};

/**
@param vars
*/
private moveObjects(vars: number[]) {
  // vars:  0,1,2,3,4,5:  theta,theta',r,r',phi,phi'
  const theta_ = vars[THETA];
  const phi_ = vars[PHI];
  const cosTheta = Math.cos(theta_);
  const sinTheta = Math.sin(theta_);
  const cosPhi = Math.cos(phi_);
  const sinPhi = Math.sin(phi_);
  this.bob1_.setPosition(new Vector( vars[R]*sinTheta ,  -vars[R]*cosTheta ));
  // bob1 velocity = {r θ' cos θ + r' sin θ,   −r' cos θ + r θ' sin θ }
  this.bob1_.setVelocity(
      new Vector(vars[R] * vars[THETAP] * cosTheta + vars[RP] * sinTheta,
                 vars[R] * vars[THETAP] * sinTheta - vars[RP] * cosTheta));
  const L = this.stickLength_;
  this.bob2_.setPosition(new Vector(this.bob1_.getPosition().getX() + L*sinPhi,
      this.bob1_.getPosition().getY() - L*cosPhi));
  // v2 = {r θ' cos θ + r' sin θ + S φ' cos φ,   −r' cos θ + r θ' sin θ + S φ' sin φ}
  this.bob2_.setVelocity(this.bob1_.getVelocity()
      .add(new Vector(L * vars[PHIP] * cosPhi, L * vars[PHIP] * sinPhi, 0)));
  this.stick_.setStartPoint(this.bob1_.getPosition());
  this.stick_.setEndPoint(this.bob2_.getPosition());
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject == this.bob1_ || simObject == this.bob2_) {
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
  const p = location.subtract(offset);
  if (simObject == this.bob1_) {
    // vars:  0,1,2,3,4,5:  theta,theta',r,r',phi,phi'
    const th = Math.atan2(p.getX(), -p.getY());
    vars[THETA] = th;
    vars[R] = p.length();
    vars[THETAP] = 0;
    vars[RP] = 0;
    vars[PHIP] = 0;
    va.setValues(vars);
  } else if (simObject == this.bob2_) {
    // get center of mass1
    const x1 = vars[R] * Math.sin(vars[THETA]);
    const y1 = -vars[R] * Math.cos(vars[THETA]);
    // get center of mass2
    const phi = Math.atan2(p.getX() - x1, -(p.getY() - y1));
    vars[PHI] = phi;
    vars[THETAP] = 0;
    vars[RP] = 0;
    vars[PHIP] = 0;
    va.setValues(vars);
  }
  this.moveObjects(vars);
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
  // vars:  0,1,2,3,4,5:  theta,theta',r,r',phi,phi'
  Util.zeroArray(change);
  change[TIME] = 1;
  if (!this.isDragging_) {
    const m2 = this.bob2_.getMass();
    const m1 = this.bob1_.getMass();
    const L = this.stickLength_;
    const k = this.spring_.getStiffness();
    const b = this.spring_.getRestLength();
    change[THETA] = vars[THETAP];
    change[R] = vars[RP];
    change[PHI] = vars[PHIP];
    /*  theta'' = (-4 m1(m1+m2)r' theta'
        + 2 m1 m2 L phi'^2 sin(phi-theta)
        - 2g m1(m1+m2)sin(theta)
        + k m2 (b-r)sin(2(theta-phi))
        /(2 m1(m1+m2)r)
     the variables are:  0,     1,   2,3,  4,  5:
                        theta,theta',r,r',phi,phi'
    */
    let sum = -4 * m1 * (m1+m2) * vars[RP] * vars[THETAP];
    sum += 2 * m1 * m2 * L * vars[PHIP] * vars[PHIP] * Math.sin(vars[PHI]-vars[THETA]);
    sum -= 2 * this.gravity_ * m1 * (m1+m2) * Math.sin(vars[THETA]);
    sum += k * m2 * (b-vars[R]) * Math.sin(2 * (vars[THETA]-vars[PHI]));
    sum = sum / (2 * m1 * (m1+m2) * vars[R]);
    change[THETAP] = sum;

    /*  r'' = (2 b k m1
         + b k m2
         - 2 k m1 r
         - k m2 r
          - k m2 (b-r) cos(2(theta-phi))
         + 2 L m1 m2 cos(phi-theta)phi'^2 )
         / (2 m1 (m1+m2))
         + r theta'^2
         + g cos(theta);
       the variables are:  0,     1,   2,3,  4,  5:
                          theta,theta',r,r',phi,phi'
    */
    sum = 2 * b * k * m1 + b * k * m2 - 2 * k * m1 * vars[R] - k * m2 * vars[R];
    sum -= k * m2 * (b-vars[R]) * Math.cos(2 * (vars[THETA]-vars[PHI]));
    sum += 2 * L * m1 * m2 * Math.cos(vars[PHI]-vars[THETA]) * vars[PHIP] * vars[PHIP];
    sum = sum/(2 * m1 * (m1+m2));
    sum += vars[R] * vars[THETAP] * vars[THETAP];
    sum += this.gravity_ * Math.cos(vars[THETA]);
    change[RP] = sum;

    //    phi'' = k(b-r)sin(phi-theta)/(L m1)
    change[PHIP] = k * (b-vars[R]) * Math.sin(vars[PHI]-vars[THETA])/(L * m1);
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
  this.broadcastParameter(DangleStickSim.en.GRAVITY);
};

/** Return mass of pendulum bob 1.
@return mass of pendulum bob 1
*/
getMass1(): number {
  return this.bob1_.getMass();
};

/** Set mass of pendulum bob 1
@param value mass of pendulum bob 1
*/
setMass1(value: number) {
  this.bob1_.setMass(value);
  this.broadcastParameter(DangleStickSim.en.MASS1);
};

/** Return mass of pendulum bob 2.
@return mass of pendulum bob 2
*/
getMass2(): number {
  return this.bob2_.getMass();
};

/** Set mass of pendulum bob 2
@param value mass of pendulum bob 2
*/
setMass2(value: number) {
  this.bob2_.setMass(value);
  this.broadcastParameter(DangleStickSim.en.MASS2);
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
  this.broadcastParameter(DangleStickSim.en.SPRING_REST_LENGTH);
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
  this.broadcastParameter(DangleStickSim.en.SPRING_STIFFNESS);
};

/** Return length of stick
@return length of stick
*/
getStickLength(): number {
  return this.stickLength_;
};

/** Set length of stick
@param value length of stick
*/
setStickLength(value: number) {
  this.stickLength_ = value;
  this.broadcastParameter(DangleStickSim.en.STICK_LENGTH);
};

static readonly en: i18n_strings = {
  SPRING_ANGLE: 'spring angle',
  SPRING_ANGULAR_VELOCITY: 'spring angular velocity',
  SPRING_LENGTH: 'spring length',
  SPRING_LENGTH_VELOCITY: 'spring length velocity',
  STICK_ANGLE: 'stick angle',
  STICK_ANGULAR_VELOCITY: 'stick angular velocity',
  GRAVITY: 'gravity',
  MASS1: 'mass-1',
  MASS2: 'mass-2',
  SPRING_REST_LENGTH: 'spring rest length',
  SPRING_STIFFNESS: 'spring stiffness',
  STICK_LENGTH: 'stick length'
};

static readonly de_strings: i18n_strings = {
  SPRING_ANGLE: 'Federwinkel',
  SPRING_ANGULAR_VELOCITY: 'Federwinkelgeschwindigkeit',
  SPRING_LENGTH: 'Federlänge',
  SPRING_LENGTH_VELOCITY: 'Federlängegeschwindigkeit',
  STICK_ANGLE: 'Stangenwinkel',
  STICK_ANGULAR_VELOCITY: 'Stangenwinkelgeschwindigkeit',
  GRAVITY: 'Gravitation',
  MASS1: 'Masse-1',
  MASS2: 'Masse-2',
  SPRING_REST_LENGTH: 'Federlänge im Ruhezustand',
  SPRING_STIFFNESS: 'Federsteifheit',
  STICK_LENGTH: 'Stangenlänge'
};

static readonly i18n = Util.LOCALE === 'de' ? DangleStickSim.de_strings : DangleStickSim.en;

} // end class

type i18n_strings = {
  SPRING_ANGLE: string,
  SPRING_ANGULAR_VELOCITY: string,
  SPRING_LENGTH: string,
  SPRING_LENGTH_VELOCITY: string,
  STICK_ANGLE: string,
  STICK_ANGULAR_VELOCITY: string,
  GRAVITY: string,
  MASS1: string,
  MASS2: string,
  SPRING_REST_LENGTH: string,
  SPRING_STIFFNESS: string,
  STICK_LENGTH: string
};

Util.defineGlobal('sims$springs$DangleStickSim', DangleStickSim);
