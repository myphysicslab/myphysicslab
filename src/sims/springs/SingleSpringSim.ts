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
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const X = 0;
const V = 1;
const WORK = 2;
const TIME = 3;
const ACCEL = 4;
const KE = 5;
const PE = 6;
const TE = 7;

/** Simulation of a spring-mass system.  One end of the spring is fixed, the other end
has the mass attached.

Variables and Parameters
-------------------------
Variables:
```text
x = position of mass, stored in vars[0]
v = x' = velocity of mass, stored in vars[1]
L = x - x_0 = current length of spring
L - R = how much spring is stretched from rest length
```

Parameters:
```text
x_0 = fixed point of spring
R = rest length of spring
k = spring constant
b = damping constant
```

The fixed point is set to a location such that the mass is at position
x=0 when the spring is at its rest length. This makes the simulation
match the differential equations shown in the corresponding web page on
the myPhysicsLab website. When spring rest length changes, we move the
fixed point so that the resting position is still x=0.

Equations of Motion
-------------------------
See also <https://www.myphysicslab.com/spring1.html>.

The spring force is `-k (L - R)`.  Damping force is `- b v`.
```text
F = -k (L- R) - b v
F = -k (x - x_0 - R) - b V
F = m a = m v'
-k (x - x_0 - R) - b v = m v'
```

The equations of motion are:
```text
x' = v
v' = -(k/m)(x - x_0 - R) -(b/m)v
```

Work from Damping
---------------------------
The work from damping is stored in `vars[3]`. We intergrate the work done by damping as
follows:
```text
dW = F dR  (work = force times distance)
```

divide by `dt`
```text
dW/dt = F dR/dt = F v
```

Since the damping force is `F = -b v` we have
```text
dW/dt = -b v^2.
```

Note that {@link initWork} method should be called if initial conditions are modified.

TO DO: bring back the display of the work from damping in DisplayEnergy, as in Java
version.
*/
export class SingleSpringSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {
  private block_: PointMass;
  private fixedPoint_: PointMass;
  private spring_: Spring;
  private damping_: number = 0.1;
  private initialEnergy_: number = 0;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  private isDragging: boolean = false;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  const var_names = [
    SingleSpringSim.en.POSITION,
    SingleSpringSim.en.VELOCITY,
    SingleSpringSim.en.WORK_FROM_DAMPING,
    VarsList.en.TIME,
    SingleSpringSim.en.ACCELERATION,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY
  ];
  const i18n_names = [
    SingleSpringSim.i18n.POSITION,
    SingleSpringSim.i18n.VELOCITY,
    SingleSpringSim.i18n.WORK_FROM_DAMPING,
    VarsList.i18n.TIME,
    SingleSpringSim.i18n.ACCELERATION,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(WORK, ACCEL, KE, PE, TE);
  this.block_ = PointMass.makeRectangle(0.4, 0.8, 'block');
  this.block_.setMass(0.5);;
  this.fixedPoint_ = PointMass.makeSquare(0.5, 'fixed_point');
  this.fixedPoint_.setMass(Infinity);
  const restLength = 2.5;
  this.fixedPoint_.setPosition(new Vector(-restLength,  0));
  this.spring_ = new Spring('spring',
      this.fixedPoint_, Vector.ORIGIN,
      this.block_, Vector.ORIGIN, restLength, /*stiffness=*/3.0);
  this.getVarsList().setValue(X, -2.0);
  this.initWork();
  this.saveInitialState();
  this.getSimList().add(this.block_, this.fixedPoint_, this.spring_);

  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, SingleSpringSim.en.DAMPING,
      SingleSpringSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, SingleSpringSim.en.SPRING_LENGTH,
      SingleSpringSim.i18n.SPRING_LENGTH,
      () => this.getSpringRestLength(),
      a => this.setSpringRestLength(a)));
  this.addParameter(new ParameterNumber(this, SingleSpringSim.en.MASS,
      SingleSpringSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, SingleSpringSim.en.SPRING_STIFFNESS,
      SingleSpringSim.i18n.SPRING_STIFFNESS,
      () => this.getSpringStiffness(),
      a => this.setSpringStiffness(a)));
  this.addParameter(pn = new ParameterNumber(this, SingleSpringSim.en.FIXED_POINT,
      SingleSpringSim.i18n.FIXED_POINT,
      () => this.getFixedPoint(), a => this.setFixedPoint(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', block_: '+this.block_
      +', fixedPoint_: '+this.fixedPoint_
      +', spring_: '+this.spring_
      +', damping_: '+Util.NF(this.damping_)
      +', initialEnergy_: '+Util.NF(this.initialEnergy_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'SingleSpringSim';
};

/** @inheritDoc */
override reset(): void {
  super.reset();
  this.initWork();
};

/** Initializes the energy calculations, including the 'work from damping' variable;
  this should be called after changing the initial conditions of the simulation.
*/
initWork(): void {
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  this.getVarsList().setValue(WORK, 0);
  this.initialEnergy_ = this.getEnergyInfo().getTotalEnergy();
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const vars = this.getVarsList().getValues();
  return this.getEnergyInfo_(vars[WORK]);
};

private getEnergyInfo_(work: number): EnergyInfo {
  const ke = this.block_.getKineticEnergy();
  const pe = this.spring_.getPotentialEnergy() + this.potentialOffset_;
  return new EnergyInfo(pe, ke, NaN, work, this.initialEnergy_);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};


/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  const rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  vars[ACCEL] = rate[V]; // acceleration
  const ei = this.getEnergyInfo_(vars[WORK]);
  vars[KE] = ei.getTranslational();
  vars[PE] = ei.getPotential();
  vars[TE] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

private moveObjects(vars: number[]) {
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  this.block_.setPosition(new Vector(vars[X],  0));
  this.block_.setVelocity(new Vector(vars[V], 0, 0));
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject == this.block_) {
    this.isDragging = true;
    return true;
  }
  return false;
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  const va = this.getVarsList();
  if (simObject == this.block_) {
    // don't allow vertical dragging, so only set horizontal component
    const p = location.subtract(offset);
    va.setValue(X, p.getX());
    va.setValue(V, 0);
    this.initWork();
    // derived energy variables are discontinuous
    va.incrSequence(ACCEL, KE, PE, TE);
    this.moveObjects(va.getValues());
  }
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  this.isDragging = false;
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  Util.zeroArray(change);
  change[TIME] = 1.0;  // time
  if (!this.isDragging) {
    this.moveObjects(vars);
    change[X] = vars[V];
    // v' = -(k/m)(x - x_0 - R) - (b/m) v
    change[V] = (-this.spring_.getStiffness()*this.spring_.getStretch() -
        this.damping_*vars[V]) / this.block_.getMass();
    // intergrate work done by damping.
    // dW = F dR  (work = force times distance)
    // therefore dW/dt = F dR/dt = F v
    // Since the damping force is F = -b v we have dW/dt = -b v^2.
    change[WORK] = -this.damping_*vars[V]*vars[V];
  }
  return null;
};

getMass(): number {
  return this.block_.getMass();
};

setMass(value: number) {
  this.block_.setMass(value);
  this.initWork();
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(ACCEL, KE, PE, TE);
  this.broadcastParameter(SingleSpringSim.en.MASS);
};

getSpringStiffness(): number {
  return this.spring_.getStiffness();
};

setSpringStiffness(value: number) {
  this.spring_.setStiffness(value);
  this.initWork();
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(ACCEL, PE, TE);
  this.broadcastParameter(SingleSpringSim.en.SPRING_STIFFNESS);
};

getSpringRestLength(): number {
  return this.spring_.getRestLength();
};

setSpringRestLength(value: number) {
  this.spring_.setRestLength(value);
  this.initWork();
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(ACCEL, PE, TE);
  this.broadcastParameter(SingleSpringSim.en.SPRING_LENGTH);
};

getDamping(): number {
  return this.damping_;
};

setDamping(value: number) {
  this.damping_ = value;
  this.initWork();
  this.broadcastParameter(SingleSpringSim.en.DAMPING);
};

getFixedPoint(): number {
  return this.fixedPoint_.getPosition().getX();
};

setFixedPoint(value: number) {
  this.fixedPoint_.setPosition(new Vector(value,  0));
  this.initWork();
  this.broadcastParameter(SingleSpringSim.en.FIXED_POINT);
};

static en: i18n_strings = {
  ACCELERATION: 'acceleration',
  DAMPING: 'damping',
  MASS: 'mass',
  POSITION: 'position',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  VELOCITY: 'velocity',
  WORK_FROM_DAMPING: 'work from damping',
  FIXED_POINT: 'fixed point'
};

static de_strings: i18n_strings = {
  ACCELERATION: 'Beschleunigung',
  DAMPING: 'Dämpfung',
  MASS: 'Masse',
  POSITION: 'Position',
  SPRING_LENGTH: 'Federlänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  VELOCITY: 'Geschwindigkeit',
  WORK_FROM_DAMPING: 'Arbeit der Dämpfung',
  FIXED_POINT: 'Festpunkt'
};

static readonly i18n = Util.LOCALE === 'de' ? SingleSpringSim.de_strings : SingleSpringSim.en;

} // end class

type i18n_strings = {
  ACCELERATION: string,
  DAMPING: string,
  MASS: string,
  POSITION: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  VELOCITY: string,
  WORK_FROM_DAMPING: string,
  FIXED_POINT: string
}

Util.defineGlobal('sims$springs$SingleSpringSim', SingleSpringSim);
