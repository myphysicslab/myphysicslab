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
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js'
import { HumpPath } from './HumpPath.js';
import { NumericalPath } from '../../lab/model/NumericalPath.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PathPoint } from '../../lab/model/PathPoint.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const X = 0;
const XP = 1;
const S = 2;
const SP = 3;
const KE = 4;
const PE = 5;
const TE = 6;
const TIME = 7;
const Y = 8;
const YP = 9;

/** Rollercoaster simulation that uses Lagrangian method of finding equations of motion.
The shape of the roller coaster path is defined by {@link HumpPath}.

The Lagrangian method of finding the equations of motion is very different from the
methods used in the other roller coaster simulations such as
{@link sims/roller/RollerSingleSim.RollerSingleSim | RollerSingleSim}.
For example, the NumericalPath is used here only for finding the initial conditions
such as the path length position corresponding to the starting X value. Whereas in
Roller1Sim the NumericalPath is used in the `evaluate()` method to find the rates of
change.

Variables and Parameters
---------------------------------

The variables stored in the VarsList are:
```text
vars[0] = x position of the ball
vars[1] = v = dx/dt = x velocity of the ball
vars[2] = s = position measured along length of track
vars[3] = s' = ds/dt = velocity measured along length of track
```
The independent variables are the X position and X velocity. The position along the
track `s` and velocity along the track `s'` are derived from the X position and X
velocity of the ball.

Parameters are:
```text
g = gravity
m = mass
```
Equation of Motion
---------------------------------

The equation of the {@link HumpPath} is
```text
y = 3 - (7/6) x^2 + (1/6) x^4
```
The equations of motion are derived from the HumpPath as shown in the file
[RollerCoaster Lagrangian(../RollerCoaster_Lagrangian.pdf).
They turn out to be:
```text
x' = v

     -(x * (-7 + 2*x^2) * (3*g + (-7 + 6*x^2) * v^2))
v' = ------------------------------------------------
            (9 + 49*x^2 - 28*x^4 + 4*x^6)
```

Track Position and Velocity
---------------------------------

The track position `s` and velocity `s' = ds/dt` are derived from the X position and X
velocity of the ball.
```text
s = position along length of track
ds/dt = (ds/dx) (dx/dt)
s = integral (ds/dt) dt
s = integral (ds/dx) (dx/dt) dt
```
A fundamental result of calculus relates the path length and slope of the path (this is
only valid for curves where the slope is finite everywhere):
```text
ds/dx = sqrt(1 + (dy/dx)^2)
```
From the definition of the HumpPath we can easily find the slope `dy/dx` as a function
of `x`:
```text
dy/dx = -(7/3) x + (2/3) x^3
```
Putting these together we get the track velocity as a function of `x` and `v`:
```text
ds/dt = sqrt(1 + (-(7/3) x + (2/3) x^3)^2) v
```
The track position `s` is then found by integrating `ds/dt` over time.

Y Velocity
---------------------------------

The vertical velocity of the ball, `y' = dy/dt`, can be found as a function of the
independent variables `x` and `v` as follows:
```text
dy/dt = (dy/dx) (dx/dt)
dy/dt = (-(7/3) x + (2/3) x^3) v
```
Note that this should agree with:
```text
s' = ds/dt = (+/-)sqrt((dx/dt)^2 + (dy/dt)^2)
```
*/
export class LagrangeRollerSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {

  private gravity_: number = 2;
  private ball1_: PointMass;
  private path_: NumericalPath;
  /** lowest possible y coordinate of path */
  private lowestPoint_: number;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  private dragObj_: null|SimObject = null;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // 0  1   2   3   4  5   6   7     8  9
  // x, x', s, s', ke, pe, te, time, y, y'
  const var_names = [
    LagrangeRollerSim.en.X_POSITION,
    LagrangeRollerSim.en.X_VELOCITY,
    LagrangeRollerSim.en.POSITION,
    LagrangeRollerSim.en.VELOCITY,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY,
    VarsList.en.TIME,
    LagrangeRollerSim.en.Y_POSITION,
    LagrangeRollerSim.en.Y_VELOCITY
  ];
  const i18n_names = [
    LagrangeRollerSim.i18n.X_POSITION,
    LagrangeRollerSim.i18n.X_VELOCITY,
    LagrangeRollerSim.i18n.POSITION,
    LagrangeRollerSim.i18n.VELOCITY,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME,
    LagrangeRollerSim.i18n.Y_POSITION,
    LagrangeRollerSim.i18n.Y_VELOCITY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(S, SP, KE, PE, TE, Y, YP);
  this.ball1_ = PointMass.makeCircle(0.3, 'ball1');
  this.ball1_.setMass(0.5);
  this.getSimList().add(this.ball1_);
  this.path_ = new NumericalPath(new HumpPath());
  this.lowestPoint_ = this.path_.getBoundsWorld().getBottom();
  const va = this.getVarsList();
  const vars = va.getValues();
  vars[X] = 3;
  vars[XP] = 0;
  vars[S] = this.path_.map_x_to_p(vars[X]);
  va.setValues(vars);
  this.modifyObjects();
  this.saveInitialState();
  this.addParameter(new ParameterNumber(this, LagrangeRollerSim.en.GRAVITY,
      LagrangeRollerSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, LagrangeRollerSim.en.MASS,
      LagrangeRollerSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
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
      +', ball1_: '+this.ball1_
      +', path_: '+this.path_
      +', gravity_: '+Util.NF(this.gravity_)
      +', lowestPoint_: '+Util.NF(this.lowestPoint_)
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'LagrangeRollerSim';
};

/** Returns the NumericalPath that the ball follows
*/
getPath(): NumericalPath {
  return this.path_;
};

/** @inheritDoc */
modifyObjects(): void {
  // 0  1   2   3   4  5   6   7     8  9
  // x, x', s, s', ke, pe, te, time, y, y'
  const va = this.getVarsList();
  // get variables, but get NaN for the many variables computed in modifyObjects()
  const vars = va.getValues(/*computed=*/false);
  this.moveObjects(vars);
  const x = vars[X];
  vars[S] = this.path_.map_x_to_p(x);
  // update track velocity
  // ds/dt = sqrt(1 + (-(7/3) x + (2/3) x^3)^2) v
  const d = -(7/3)*x + (2/3)*x*x*x;
  vars[SP] = Math.sqrt(1 + d*d)*vars[XP];
  const ei = this.getEnergyInfo_(vars);
  vars[KE] = ei.getTranslational();
  vars[PE] = ei.getPotential();
  vars[TE] = ei.getTotalEnergy();
  vars[Y] = this.ball1_.getPosition().getY();
  vars[YP] = this.ball1_.getVelocity().getY();
  this.getVarsList().setValues(vars, /*continuous=*/true);
};

/**
* @param vars
*/
private moveObjects(vars: number[]) {
  // 0  1   2   3   4  5   6   7     8  9
  // x, x', s, s', ke, pe, te, time, y, y'
  const x = vars[X];
  const x2 = x*x;
  const x3 = x2*x;
  const x4 = x3*x;
  //  From equation of HumpPath:   y = 3 - (7/6) x^2 + (1/6) x^4
  const y = 3 - (7/6)*x2 + (1/6)*x4;
  this.ball1_.setPosition(new Vector(x,  y));
  //  dy/dt = dy/dx * dx/dt = (-(7/3) x + (2/3) x^3) * dx/dt
  const yp = (-(7/3)*x + (2/3)*x3) * vars[XP];
  this.ball1_.setVelocity(new Vector(vars[XP], yp));
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  // get variables including the many variables computed in modifyObjects()
  const vars = this.getVarsList().getValues(/*computed=*/true);
  return this.getEnergyInfo_(vars);
};

/**
* @param vars
*/
private getEnergyInfo_(vars: number[]): EnergyInfo {
  // 0  1   2   3   4  5   6   7     8  9
  // x, x', s, s', ke, pe, te, time, y, y'
  // kinetic energy is 1/2 m v^2
  const ke = 0.5 * this.ball1_.getMass() * vars[SP] * vars[SP];
  const ke2 = this.ball1_.getKineticEnergy();
  if (Util.veryDifferent(ke, ke2)) {
    throw 'kinetic energy calcs differ '+ke+' vs '+ke2;
  }
  // gravity potential = m g y
  const pe = this.ball1_.getMass() * this.gravity_ *
      (this.ball1_.getPosition().getY() - this.lowestPoint_);
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
    // 0  1   2   3   4  5   6   7     8  9
    // x, x', s, s', ke, pe, te, time, y, y'
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject == this.ball1_) {
    this.dragObj_ = simObject;
    return true;
  }
  return false;
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  const p = location.subtract(offset);
  if (simObject == this.ball1_)  {
    const pathPoint = this.path_.findNearestGlobal(p);
    // 0  1   2   3   4  5   6   7     8  9
    // x, x', s, s', ke, pe, te, time, y, y'
    const va = this.getVarsList();
    const vars = va.getValues();
    vars[X] = pathPoint.x;
    vars[XP] = 0;
    vars[S] = pathPoint.p;
    va.setValues(vars);
    this.moveObjects(vars);
  }
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  this.dragObj_ = null;
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  // 0  1   2   3   4  5   6   7     8  9
  // x, x', s, s', ke, pe, te, time, y, y'
  Util.zeroArray(change);
  change[TIME] = 1; // time changes at a rate of 1 by definition.
  if (this.dragObj_ != this.ball1_) {
    const x = vars[X];
    const x2 = x*x;
    const v = vars[XP];
    change[X] = v;  // x' = v
    //      -(x * (-7 + 2*x^2) * (3*g + (-7 + 6*x^2) * v^2))
    // v' = ------------------------------------------------
    //             (9 + 49*x^2 - 28*x^4 + 4*x^6)
    const r = -(x * (-7 + 2*x2) * (3*this.gravity_ + (-7 + 6*x2)* v*v));
    change[XP] = r/(9 + 49*x2 - 28*x2*x2 + 4*x2*x2*x2);
    // integrate position = s
    // ds/dt = (ds/dx) (dx/dt)
    // s = integral (ds/dt) dt = integral (ds/dx) (dx/dt) dt
    // ds/dx = sqrt(1 + (dy/dx)^2)
    // ds/dt = sqrt(1 + (-(7/3) x + (2/3) x^3)^2) v
    //const d = -(7/3)*x + (2/3)*x2*x;
    //change[S] = Math.sqrt(1 + d*d) * v;
    // This wasn't working in Dec 2020. Try to do it via pathPoint instead,
    // inside of modifyObjects().
  }
  return null;
};

/**
*/
getGravity(): number {
  return this.gravity_;
};

/**
@param value
*/
setGravity(value: number) {
  this.gravity_ = value;
  // 0  1   2   3   4  5   6   7     8  9
  // x, x', s, s', ke, pe, te, time, y, y'
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(LagrangeRollerSim.en.GRAVITY);
};

/**
*/
getMass(): number {
  return this.ball1_.getMass();
}

/**
@param value
*/
setMass(value: number) {
  this.ball1_.setMass(value);
  // 0  1   2   3   4  5   6   7     8  9
  // x, x', s, s', ke, pe, te, time, y, y'
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(LagrangeRollerSim.en.MASS);
}

static readonly en: i18n_strings = {
  GRAVITY: 'gravity',
  MASS: 'mass',
  POSITION: 'position',
  VELOCITY: 'velocity',
  X_POSITION: 'X position',
  Y_POSITION: 'Y position',
  X_VELOCITY: 'X velocity',
  Y_VELOCITY: 'Y velocity'
};

static readonly de_strings: i18n_strings = {
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  POSITION: 'Position',
  VELOCITY: 'Geschwindigkeit',
  X_POSITION: 'X Position',
  Y_POSITION: 'Y Position',
  X_VELOCITY: 'X Geschwindigkeit',
  Y_VELOCITY: 'Y Geschwindigkeit'
};

static readonly i18n = Util.LOCALE === 'de' ? LagrangeRollerSim.de_strings : LagrangeRollerSim.en;

} // end class

type i18n_strings = {
  GRAVITY: string,
  MASS: string,
  POSITION: string,
  VELOCITY: string,
  X_POSITION: string,
  Y_POSITION: string,
  X_VELOCITY: string,
  Y_VELOCITY: string
};

Util.defineGlobal('sims$roller$LagrangeRollerSim', LagrangeRollerSim);
