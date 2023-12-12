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
import { SimObject } from '../../lab/model/SimObject.js'
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const TH1 = 0;
const TH1P = 1;
const TH2 = 2;
const TH2P = 3;
const TH1PP = 4;
const TH2PP = 5;
const KE = 6;
const PE = 7;
const TE = 8;
const TIME = 9;

/** Simulation of a double pendulum.

Variables and Parameters
-------------------------
Variables:
```text
th1, th2 = angles of sticks with vertical; down = 0; in radians;
           counter-clockwise is positive
dth1, dth2 = angular velocities; first derivative with respect to time of th1, th2
```
Parameters:
```text
L1, L2 = stick lengths
m1, m2 = masses
g = gravity
```
This diagram shows how the sticks and masses are connected:
```text
        \
         \L1
          \
           m1
           |
           |L2
           |
           m2
```

Equations of Motion
-------------------------
The derivation of the equations of motion is shown at
<https://www.myphysicslab.com/pendulum/double-pendulum-en.html>. See also the
[Double Pendulum Mathematica notebook(../Double_Pendulum.pdf) which uses an algebra
solver to find the above equations.
```text
        -g (2 m1 + m2) Sin[th1]
        - g m2 Sin[th1 - 2 th2]
        - 2 m2 dth2^2 L2 Sin[th1 - th2]
        - m2 dth1^2 L1 Sin[2(th1 - th2)]
ddth1 = ------------------------------------
        L1 (2 m1 + m2 - m2 Cos[2(th1-th2)])

        2 Sin[th1-th2](
          (m1+m2) dth1^2 L1
          + g (m1+m2) Cos[th1]
          + m2 dth2^2 L2 Cos[th1-th2]
        )
ddth2 = ------------------------------------
        L2 (2 m1 + m2 - m2 Cos[2(th1-th2)])
```

Variables Array
-------------------------
The variables are stored in the VarsList as follows
```text
vars[0] = th1
vars[1] = th1'
vars[2] = th2
vars[3] = th2'
vars[4] = th1''
vars[5] = th2''
vars[6] = kinetic energy
vars[7] = potential energy
vars[8] = total energy
vars[9] = time
```

**TO DO**  add damping force.

**TO DO**  add ParameterBoolean specifying whether to limit angles to +/-Pi.

*/
export class DoublePendulumSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {
  private rod1Length_: number = 1;
  private rod2Length_: number = 1;
  private rod1_: ConcreteLine = new ConcreteLine('rod1');
  private rod2_: ConcreteLine = new ConcreteLine('rod2');
  private bob1_: PointMass = PointMass.makeCircle(0.2, 'bob1')
  private bob2_: PointMass = PointMass.makeCircle(0.2, 'bob2')
  private gravity_: number = 9.8;
  /* potential energy offset */
  private potentialOffset_: number = 0;
  private isDragging_: boolean = false;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  const var_names = [
    DoublePendulumSim.en.ANGLE_1,
    DoublePendulumSim.en.ANGLE_1_VELOCITY,
    DoublePendulumSim.en.ANGLE_2,
    DoublePendulumSim.en.ANGLE_2_VELOCITY,
    DoublePendulumSim.en.ACCELERATION_1,
    DoublePendulumSim.en.ACCELERATION_2,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY,
    VarsList.en.TIME
  ];
  const i18n_names = [
    DoublePendulumSim.i18n.ANGLE_1,
    DoublePendulumSim.i18n.ANGLE_1_VELOCITY,
    DoublePendulumSim.i18n.ANGLE_2,
    DoublePendulumSim.i18n.ANGLE_2_VELOCITY,
    DoublePendulumSim.i18n.ACCELERATION_1,
    DoublePendulumSim.i18n.ACCELERATION_2,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(TH1PP, TH2PP, KE, PE, TE);
  this.bob1_.setMass(2.0);
  this.bob2_.setMass(2.0);
  this.getSimList().add(this.rod1_, this.rod2_, this.bob1_, this.bob2_);
  this.restState();
  this.getVarsList().setValue(0, Math.PI/8);
  this.saveInitialState();
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.ROD_1_LENGTH,
      DoublePendulumSim.i18n.ROD_1_LENGTH,
      () => this.getRod1Length(), a => this.setRod1Length(a)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.ROD_2_LENGTH,
      DoublePendulumSim.i18n.ROD_2_LENGTH,
      () => this.getRod2Length(), a => this.setRod2Length(a)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.MASS_1,
      DoublePendulumSim.i18n.MASS_1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.MASS_2,
      DoublePendulumSim.i18n.MASS_2,
      () => this.getMass2(), a => this.setMass2(a)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.GRAVITY,
      DoublePendulumSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  let pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
  this.addParameter(pn);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', rod1Length_: '+Util.NF(this.rod1Length_)
      +', rod2Length_: '+Util.NF(this.rod2Length_)
      +', rod1_: '+this.rod1_
      +', rod2_: '+this.rod2_
      +', bob1_: '+this.bob1_
      +', bob2_: '+this.bob2_
      +', gravity_: '+Util.NF(this.gravity_)
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'DoublePendulumSim';
};

/** Sets the double pendulum to the rest state and sets the energy to zero.
*/
restState(): void {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  const va = this.getVarsList();
  const vars = va.getValues();
  vars[TH1] = 0;
  vars[TH1P] = 0;
  vars[TH2] = 0;
  vars[TH2P] = 0;
  va.setValues(vars);
  this.moveObjects(vars);
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const L1 = this.rod1Length_;
  const L2 = this.rod2Length_;
  const ke = this.bob1_.getKineticEnergy() + this.bob2_.getKineticEnergy();
  // lowest point that bob1 can be is -L1, define that as zero potential energy
  // lowest point that bob2 can be is -L1 -L2
  const y1 = this.bob1_.getPosition().getY();
  const y2 = this.bob2_.getPosition().getY();
  const pe = this.gravity_ * this.bob1_.getMass()*(y1 - -L1)
         + this.gravity_ * this.bob2_.getMass()*(y2 - (-L1 -L2));
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  // limit the pendulum angle to +/- Pi
  const theta1 = Util.limitAngle(vars[TH1]);
  if (theta1 != vars[TH1]) {
    this.getVarsList().setValue(0, theta1, /*continuous=*/false);
    vars[TH1] = theta1;
  }
  const theta2 = Util.limitAngle(vars[TH2]);
  if (theta2 != vars[TH2]) {
    this.getVarsList().setValue(2, theta2, /*continuous=*/false);
    vars[TH2] = theta2;
  }
  this.moveObjects(vars);
  // update the variables that track energy
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  const rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  vars[TH1PP] = rate[TH1P];
  vars[TH2PP] = rate[TH2P];
  const ei = this.getEnergyInfo();
  vars[KE] = ei.getTranslational();
  vars[PE] = ei.getPotential();
  vars[TE] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
@param vars
*/
private moveObjects(vars: number[]) {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  const theta1 = vars[TH1];
  const sinTheta1 = Math.sin(theta1);
  const cosTheta1 = Math.cos(theta1);
  const theta2 = vars[TH2];
  const sinTheta2 = Math.sin(theta2);
  const cosTheta2 = Math.cos(theta2);
  const L1 = this.rod1Length_;
  const L2 = this.rod2Length_;
  const x1 = L1*sinTheta1;
  const y1 = -L1*cosTheta1;
  const x2 = x1 + L2*sinTheta2;
  const y2 = y1 - L2*cosTheta2;
  this.bob1_.setPosition(new Vector(x1,  y1));
  this.bob2_.setPosition(new Vector(x2,  y2));
  const v1x = vars[TH1P]*L1*cosTheta1;
  const v1y = vars[TH1P]*L1*sinTheta1;
  const v2x = v1x + vars[TH2P]*L2*cosTheta2;
  const v2y = v1y + vars[TH2P]*L2*sinTheta2;
  this.bob1_.setVelocity(new Vector(v1x, v1y));
  this.bob2_.setVelocity(new Vector(v2x, v2y));
  this.rod1_.setStartPoint(Vector.ORIGIN);
  this.rod1_.setEndPoint(this.bob1_.getPosition());
  this.rod2_.setStartPoint(this.bob1_.getPosition());
  this.rod2_.setEndPoint(this.bob2_.getPosition());
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  // can't do 'live dragging' because everything is too connected!
  if (simObject == this.bob1_ || simObject == this.bob2_) {
    this.isDragging_ = true;
    return true;
  } else {
    return false;
  }
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  const va = this.getVarsList();
  const vars = va.getValues();
  const p = location.subtract(offset);
  if (simObject == this.bob1_) {
    vars[TH1] = Math.atan2(p.getX(), -p.getY());
    vars[TH1P] = 0;
    vars[TH2P] = 0;
  } else if (simObject == this.bob2_) {
    vars[TH2] = Math.atan2(p.getX() - this.bob1_.getPosition().getX(),
                       -(p.getY() - this.bob1_.getPosition().getY()));
    vars[TH1P] = 0;
    vars[TH2P] = 0;
  }
  va.setValues(vars);
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
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  Util.zeroArray(change);
  change[TIME] = 1; // time
  if (!this.isDragging_) {
    const th1 = vars[TH1];
    const dth1 = vars[TH1P];
    const th2 = vars[TH2];
    const dth2 = vars[TH2P];
    const m2 = this.bob2_.getMass();
    const m1 = this.bob1_.getMass();
    const L1 = this.rod1Length_;
    const L2 = this.rod2Length_;
    const g = this.gravity_;

    change[TH1] = dth1;

    let num = -g*(2*m1+m2)*Math.sin(th1);
    num = num - g*m2*Math.sin(th1-2*th2);
    num = num - 2*m2*dth2*dth2*L2*Math.sin(th1-th2);
    num = num - m2*dth1*dth1*L1*Math.sin(2*(th1-th2));
    num = num/(L1*(2*m1+m2-m2*Math.cos(2*(th1-th2))));
    change[TH1P] = num;

    change[TH2] = dth2;

    num = (m1+m2)*dth1*dth1*L1;
    num = num + g*(m1+m2)*Math.cos(th1);
    num = num + m2*dth2*dth2*L2*Math.cos(th1-th2);
    num = num*2*Math.sin(th1-th2);
    num = num/(L2*(2*m1+m2-m2*Math.cos(2*(th1-th2))));
    change[TH2P] = num;
  }
  return null;
};

/**
*/
getMass1(): number {
  return this.bob1_.getMass();
};

/**
@param value
*/
setMass1(value: number) {
  this.bob1_.setMass(value);
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(TH1PP, TH2PP, KE, PE, TE);
  this.broadcastParameter(DoublePendulumSim.en.MASS_1);
};

/**
*/
getMass2(): number {
  return this.bob2_.getMass();
};

/**
@param value
*/
setMass2(value: number) {
  this.bob2_.setMass(value);
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(TH1PP, TH2PP, KE, PE, TE);
  this.broadcastParameter(DoublePendulumSim.en.MASS_2);
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
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(TH1PP, TH2PP, PE, TE);
  this.broadcastParameter(DoublePendulumSim.en.GRAVITY);
};

/**
*/
getRod1Length(): number {
  return this.rod1Length_;
};

/**
@param value
*/
setRod1Length(value: number) {
  this.rod1Length_ = value;
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(TH1PP, TH2PP, KE, PE, TE);
  this.broadcastParameter(DoublePendulumSim.en.ROD_1_LENGTH);
};

/**
*/
getRod2Length(): number {
  return this.rod2Length_;
};

/**
@param value
*/
setRod2Length(value: number) {
  this.rod2Length_ = value;
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(TH1PP, TH2PP, KE, PE, TE);
  this.broadcastParameter(DoublePendulumSim.en.ROD_2_LENGTH);
};

static readonly en: i18n_strings = {
  ACCELERATION_1: 'acceleration-1',
  ACCELERATION_2: 'acceleration-2',
  ANGLE_1: 'angle-1',
  ANGLE_1_VELOCITY: 'angle-1 velocity',
  ANGLE_2: 'angle-2',
  ANGLE_2_VELOCITY: 'angle-2 velocity',
  GRAVITY: 'gravity',
  MASS_1: 'mass-1',
  MASS_2: 'mass-2',
  ROD_1_LENGTH: 'rod-1 length',
  ROD_2_LENGTH: 'rod-2 length'
};

static readonly de_strings: i18n_strings = {
  ACCELERATION_1: 'Beschleunigung-1',
  ACCELERATION_2: 'Beschleunigung-2',
  ANGLE_1: 'Winkel-1',
  ANGLE_1_VELOCITY: 'Winkel-1 Geschwindigkeit',
  ANGLE_2: 'Winkel-2',
  ANGLE_2_VELOCITY: 'Winkel-2 Geschwindigkeit',
  GRAVITY: 'Gravitation',
  MASS_1: 'Masse-1',
  MASS_2: 'Masse-2',
  ROD_1_LENGTH: 'Stange-1 Länge',
  ROD_2_LENGTH: 'Stange-2 Länge'
};

static readonly i18n = Util.LOCALE === 'de' ? DoublePendulumSim.de_strings : DoublePendulumSim.en;

} // end class

type i18n_strings = {
  ACCELERATION_1: string,
  ACCELERATION_2: string,
  ANGLE_1: string,
  ANGLE_1_VELOCITY: string,
  ANGLE_2: string,
  ANGLE_2_VELOCITY: string,
  GRAVITY: string,
  MASS_1: string,
  MASS_2: string,
  ROD_1_LENGTH: string,
  ROD_2_LENGTH: string
};

Util.defineGlobal('sims$pendulum$DoublePendulumSim', DoublePendulumSim);
