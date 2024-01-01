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
import { MutableVector } from '../../lab/util/MutableVector.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

const TIME = 0;
const KE = 1;
const PE = 2;
const TE = 3;
const FIX1X = 4;
const FIX1Y = 5;
const FIX2X = 6;
const FIX2Y = 7;
const U0X = 8
const U0Y = 9;
const V0X = 10;
const V0Y = 11;

/** Simulation of a chain of springs and masses stretched between two fixed points.

Variables
-------------
The first 4 variables are for time, kinetic energy, potential energy, total energy.
The next 4 variables are the locations of the two fixed blocks.
Then each moveable mass has 4 variables:
`Ux, Uy = position, Vx, Vy = velocity`

```text
 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
```

*/
export class ChainOfSpringsSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {

  /** the atom being dragged, or -1 when no drag is happening */
  private dragAtom_: number = -1;
  private gravity_: number = 4;
  private mass_: number = 5;
  private damping_: number = 0.1;
  private restLength_: number = 0;
  private stiffness_: number = 6.0;
  private springDamping_: number = 0.1;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  private attachRight_: boolean = true;
  private fixed1_: PointMass;
  private fixed2_: PointMass;
  private atoms_: PointMass[] = [];
  private springs_: Spring[] = [];

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  this.fixed1_ = PointMass.makeSquare(0.5, 'fixed1');
  this.fixed1_.setPosition(new Vector(-6,  4));
  this.fixed2_ = PointMass.makeSquare(0.5, 'fixed2');
  this.fixed2_.setPosition(new Vector(6,  4));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.GRAVITY,
      ChainOfSpringsSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.MASS,
      ChainOfSpringsSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.STIFFNESS,
      ChainOfSpringsSim.i18n.STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a)));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.DAMPING,
      ChainOfSpringsSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.SPRING_DAMPING,
      ChainOfSpringsSim.i18n.SPRING_DAMPING,
      () => this.getSpringDamping(), a => this.setSpringDamping(a)));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.LENGTH,
      ChainOfSpringsSim.i18n.LENGTH,
      () => this.getLength(), a => this.setLength(a)));
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
      +', atoms: '+this.atoms_.length
      +', gravity_: '+Util.NF(this.gravity_)
      +', damping_: '+Util.NF(this.damping_)
      +', mass_: '+Util.NF(this.mass_)
      +', springDamping_: '+Util.NF(this.springDamping_)
      +', stiffness_: '+Util.NF(this.stiffness_)
      +', restLength_: '+Util.NF(this.restLength_)
      +', fixed1_: '+this.fixed1_
      +', fixed2_: '+this.fixed2_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'ChainOfSpringsSim';
};

/**
* @param numAtoms
* @param localized
*/
private static makeVarNames(numAtoms: number, localized: boolean): string[] {
  const names = [];
  const n = numAtoms*4 + 8;
  for (let i=0; i<n; i++) {
    names.push(ChainOfSpringsSim.getVariableName(i, localized));
  }
  return names;
};

/**
* @param idx
* @param loc
*/
private static getVariableName(idx: number, loc: boolean): string {
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  if (idx >= U0X) {
    const j = (idx - U0X)%4;
    const atom = 1 + Math.floor((idx - U0X)/4);
    let nm = loc ? ChainOfSpringsSim.i18n.BALL : ChainOfSpringsSim.en.BALL;
    nm = nm + ' ' + atom + ' ';
    switch (j) {
      case 0:
        return nm + (loc ? ChainOfSpringsSim.i18n.X_POSITION :
            ChainOfSpringsSim.en.X_POSITION);
      case 1:
        return nm + (loc ? ChainOfSpringsSim.i18n.Y_POSITION :
            ChainOfSpringsSim.en.Y_POSITION);
      case 2:
        return nm + (loc ? ChainOfSpringsSim.i18n.X_VELOCITY :
            ChainOfSpringsSim.en.X_VELOCITY);
      case 3:
        return nm + (loc ? ChainOfSpringsSim.i18n.Y_VELOCITY :
            ChainOfSpringsSim.en.Y_VELOCITY);
    }
  } else {
    switch (idx) {
      case TIME:
        return loc ? VarsList.i18n.TIME :
            VarsList.en.TIME;
      case KE:
        return loc ? EnergyInfo.i18n.KINETIC_ENERGY :
            EnergyInfo.en.KINETIC_ENERGY;
      case PE:
        return loc ? EnergyInfo.i18n.POTENTIAL_ENERGY :
            EnergyInfo.en.POTENTIAL_ENERGY;
      case TE:
        return loc ? EnergyInfo.i18n.TOTAL_ENERGY :
            EnergyInfo.en.TOTAL_ENERGY;
      case FIX1X:
        return loc ? ChainOfSpringsSim.i18n.ANCHOR1_X :
            ChainOfSpringsSim.en.ANCHOR1_X;
      case FIX1Y:
        return loc ? ChainOfSpringsSim.i18n.ANCHOR1_Y :
            ChainOfSpringsSim.en.ANCHOR1_Y;
      case FIX2X:
        return loc ? ChainOfSpringsSim.i18n.ANCHOR2_X :
            ChainOfSpringsSim.en.ANCHOR2_X;
      case FIX2Y:
        return loc ? ChainOfSpringsSim.i18n.ANCHOR2_Y :
            ChainOfSpringsSim.en.ANCHOR2_Y;
    }
  }
  throw '';
};

/** Rebuild the simulation from scratch with the given number of atoms and
* attachment point.
* @param numAtoms number of mass objects in the chain
* @param attachRight whether to attach to fixed block on right
*/
makeChain(numAtoms: number, attachRight: boolean): void {
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  this.getSimList().removeAll(this.atoms_);
  this.atoms_.length = 0;
  this.getSimList().removeAll(this.springs_);
  this.springs_.length = 0;
  const va = this.getVarsList();
  va.deleteVariables(0, va.numVariables());
  va.addVariables(ChainOfSpringsSim.makeVarNames(numAtoms, /*localized=*/false),
      ChainOfSpringsSim.makeVarNames(numAtoms, /*localized=*/true));
  va.setComputed(KE, PE, TE);
  const left = this.fixed1_.getPosition();
  const right = this.fixed2_.getPosition();
  va.setValue(FIX1X, left.getX());
  va.setValue(FIX1Y, left.getY());
  va.setValue(FIX2X, right.getX());
  va.setValue(FIX2Y, right.getY());
  this.getSimList().add(this.fixed1_);
  this.getSimList().add(this.fixed2_);
  if (numAtoms > 0) {
    const len = right.subtract(left).length();
    const size = Math.min(0.5, len/(2*(numAtoms+1)));
    const mass = this.mass_/numAtoms;
    for (let i=0; i<numAtoms; i++) {
      const atom = PointMass.makeCircle(size, 'atom'+(i+1));
      atom.setMass(mass);
      this.atoms_.push(atom);
    }
    this.getSimList().addAll(this.atoms_);
    let spring = new Spring('spring 0',
      this.fixed1_, Vector.ORIGIN,
      this.atoms_[0], Vector.ORIGIN, this.restLength_, this.stiffness_);
    spring.setDamping(this.springDamping_);
    this.springs_.push(spring);
    for (let i=1; i<numAtoms; i++) {
      spring = new Spring('spring '+i,
        this.atoms_[i-1], Vector.ORIGIN,
        this.atoms_[i], Vector.ORIGIN, this.restLength_, this.stiffness_);
      spring.setDamping(this.springDamping_);
      this.springs_.push(spring);
    }
    if (attachRight) {
      spring = new Spring('spring '+(numAtoms+1),
        this.atoms_[numAtoms-1], Vector.ORIGIN,
        this.fixed2_, Vector.ORIGIN, this.restLength_, this.stiffness_);
      spring.setDamping(this.springDamping_);
      this.springs_.push(spring);
    }
    this.getSimList().addAll(this.springs_);
    this.straightLine();
  }
  this.saveInitialState();
  this.modifyObjects();
};

/** Arranges atoms in a straight line between the fixed points (even if the fixed
* points are not connected to the chain).
*/
straightLine(): void {
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  const vars = this.getVarsList().getValues();
  const left = this.fixed1_.getPosition();
  const right = this.fixed2_.getPosition();
  const diff = right.subtract(left);
  const n = this.atoms_.length;
  for (let i=0; i<n; i++) {
    const p = left.add(diff.multiply((i+1)/(n+1)));
    vars[U0X + i*4] = p.getX();
    vars[U0Y + i*4] = p.getY();
    vars[V0X + i*4] = 0;
    vars[V0Y + i*4] = 0;
  }
  this.getVarsList().setValues(vars);
  this.modifyObjects();
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  let ke = 0;
  let pe = 0;
  this.springs_.forEach(spr => pe += spr.getPotentialEnergy());
  this.atoms_.forEach(atom => {
    ke += atom.getKineticEnergy();
    // gravity potential = m g (y - floor)
    pe += this.gravity_ * atom.getMass() * atom.getPosition().getY();
  });
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
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
  va.setValue(KE, ei.getTranslational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
};

/**
@param vars
*/
private moveObjects(vars: number[]) {
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  this.atoms_.forEach((atom, i) => {
    const idx = 4*i;
    atom.setPosition(new Vector(vars[U0X + idx],  vars[U0Y + idx]));
    atom.setVelocity(new Vector(vars[V0X + idx], vars[V0Y + idx], 0));
  });
  this.fixed1_.setPosition(new Vector(vars[FIX1X],  vars[FIX1Y]));
  this.fixed2_.setPosition(new Vector(vars[FIX2X],  vars[FIX2Y]));
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject instanceof PointMass) {
    this.dragAtom_ = this.atoms_.indexOf(simObject);
    return this.dragAtom_ > -1 || simObject == this.fixed1_ ||
          simObject == this.fixed2_;
  } else {
    return false;
  }
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  const p = location.subtract(offset);
  const va = this.getVarsList();
  if (simObject == this.fixed1_) {
    va.setValue(FIX1X, p.getX());
    va.setValue(FIX1Y, p.getY());
  } else if (simObject == this.fixed2_) {
    va.setValue(FIX2X, p.getX());
    va.setValue(FIX2Y, p.getY());
  } else if (this.dragAtom_ > -1) {
    const atom = this.atoms_[this.dragAtom_];
    if (simObject != atom) {
      return;
    }
    const idx = 4*this.dragAtom_;
    va.setValue(U0X + idx, p.getX());
    va.setValue(U0Y + idx, p.getY());
    va.setValue(V0X + idx, 0);
    va.setValue(V0Y + idx, 0);
  }
  // derived energy variables are discontinuous
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  va.incrSequence(KE, PE, TE);
  this.moveObjects(va.getValues());
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  this.dragAtom_ = -1;
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[TIME] = 1;
  this.atoms_.forEach((atom, listIdx) => {
    if (this.dragAtom_ == listIdx) {
      return;
    }
    const idx = 4*listIdx;
    change[U0X + idx] = vars[V0X + idx]; // Ux' = Vx
    change[U0Y + idx] = vars[V0Y + idx]; // Uy' = Vy
    const mass = atom.getMass();
    // for each spring, get force from spring,
    const force = new MutableVector(0, 0);
    this.springs_.forEach(spr => {
      if (spr.getBody1() == atom) {
        force.add(spr.calculateForces()[0].getVector());
      } else if (spr.getBody2() == atom) {
        force.add(spr.calculateForces()[1].getVector());
      }
    });
    // add gravity force
    force.add(new Vector(0, -this.gravity_*mass));
    force.add(new Vector(vars[V0X + idx], vars[V0Y + idx]).multiply(-this.damping_));
    change[V0X + idx] = force.getX()/mass; // Vx'
    change[V0Y + idx] = force.getY()/mass; // Vy'
  });
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
  // discontinuous change in energy
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(ChainOfSpringsSim.en.GRAVITY);
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
  this.broadcastParameter(ChainOfSpringsSim.en.DAMPING);
};

/** Return spring damping
@return spring damping
*/
getSpringDamping(): number {
  return this.springDamping_;
};

/** Set spring damping
@param value spring damping
*/
setSpringDamping(value: number) {
  this.springDamping_ = value;
  this.springs_.forEach(spr => spr.setDamping(value));
  this.broadcastParameter(ChainOfSpringsSim.en.SPRING_DAMPING);
};

/** Return mass of atoms
@return mass of atoms
*/
getMass(): number {
  return this.mass_;
};

/** Set mass of atoms
@param value mass of atoms
*/
setMass(value: number) {
  this.mass_ = value;
  const mass = this.mass_/this.atoms_.length;
  this.atoms_.forEach(atom => atom.setMass(mass));
  // discontinuous change in energy
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(ChainOfSpringsSim.en.MASS);
};

/** Return spring resting length
@return spring resting length
*/
getLength(): number {
  return this.restLength_;
};

/** Set spring resting length
@param value spring resting length
*/
setLength(value: number) {
  this.restLength_ = value;
  for (let i=0; i<this.springs_.length; i++) {
    this.springs_[i].setRestLength(value);
  }
  // discontinuous change in energy
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(ChainOfSpringsSim.en.LENGTH);
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
  this.stiffness_ = value;
  for (let i=0; i<this.springs_.length; i++) {
    this.springs_[i].setStiffness(value);
  }
  // discontinuous change in energy
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(ChainOfSpringsSim.en.STIFFNESS);
};

static readonly en: i18n_strings = {
  BALL: 'ball',
  ANCHOR1_X: 'anchor1 X',
  ANCHOR1_Y: 'anchor1 Y',
  ANCHOR2_X: 'anchor2 X',
  ANCHOR2_Y: 'anchor2 Y',
  NUM_LINKS: 'chain links',
  X_POSITION: 'position X',
  Y_POSITION: 'position Y',
  X_VELOCITY: 'velocity X',
  Y_VELOCITY: 'velocity Y',
  DAMPING: 'damping',
  SPRING_DAMPING: 'spring damping',
  GRAVITY: 'gravity',
  MASS: 'mass',
  LENGTH: 'spring length',
  STIFFNESS: 'spring stiffness',
  STRAIGHT_LINE: 'straight line',
  ATTACH_RIGHT: 'attach right'
};

static readonly de_strings: i18n_strings = {
  BALL: 'Ball',
  ANCHOR1_X: 'Anker1 X',
  ANCHOR1_Y: 'Anker1 Y',
  ANCHOR2_X: 'Anker2 X',
  ANCHOR2_Y: 'Anker2 Y',
  NUM_LINKS: 'Kettenglieder',
  X_POSITION: 'Position X',
  Y_POSITION: 'Position Y',
  X_VELOCITY: 'Geschwindigkeit X',
  Y_VELOCITY: 'Geschwindigkeit Y',
  DAMPING: 'Dämpfung',
  SPRING_DAMPING: 'Federdämpfung',
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  LENGTH: 'Federlänge',
  STIFFNESS: 'Federsteifheit',
  STRAIGHT_LINE: 'gerade Linie',
  ATTACH_RIGHT: 'rechts festmachen'
};

static readonly i18n = Util.LOCALE === 'de' ? ChainOfSpringsSim.de_strings : ChainOfSpringsSim.en;

} // end class

type i18n_strings = {
  BALL: string,
  ANCHOR1_X: string,
  ANCHOR1_Y: string,
  ANCHOR2_X: string,
  ANCHOR2_Y: string,
  NUM_LINKS: string,
  X_POSITION: string,
  Y_POSITION: string,
  X_VELOCITY: string,
  Y_VELOCITY: string,
  DAMPING: string,
  SPRING_DAMPING: string,
  GRAVITY: string,
  MASS: string,
  LENGTH: string,
  STIFFNESS: string,
  STRAIGHT_LINE: string,
  ATTACH_RIGHT: string
};

Util.defineGlobal('sims$springs$ChainOfSpringsSim', ChainOfSpringsSim);
