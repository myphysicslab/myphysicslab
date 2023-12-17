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
import { NumericalPath, HasPath } from '../../lab/model/NumericalPath.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PathPoint } from '../../lab/model/PathPoint.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const P1 = 0;
const V1 = 1;
const P2 = 2;
const V2 = 3;
const KE = 4;
const PE = 5;
const TE = 6;
const TIME = 7;

/** Simulation of 2 balls along a curved roller coaster track, with a spring connecting
them. The simulation is not functional until a path has been provided with {@link RollerDoubleSim.setPath}.

For derivation equations of motion see <https://www.myphysicslab.com/RollerSimple.html>,
<https://www.myphysicslab.com/RollerSpring.html> and
<https://www.myphysicslab.com/RollerDouble.html>.

Variables Array
-------------------------

The variables are stored in the VarsList as follows
```text
vars[0] = p1  -- position of ball 1, measured as distance along track.
vars[1] = v1  -- velocity of ball 1
vars[2] = p2  -- position of ball 2, measured as distance along track.
vars[3] = v2  -- velocity of ball 2
```

*/
export class RollerDoubleSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem, HasPath {

  private damping_: number = 0.001;
  private gravity_: number = 9.8;
  private ball1_: PointMass;
  private ball2_: PointMass;
  private spring_: Spring;
  private path_: null|NumericalPath  = null;
  /** lowest possible y coordinate of path */
  private lowestPoint_: number = 0;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  /**  Temporary scratchpad, to avoid allocation. */
  private pathPoint1_: PathPoint = new PathPoint();
  /**  Temporary scratchpad, to avoid allocation. */
  private pathPoint2_: PathPoint = new PathPoint();
  private dragObj_: null|SimObject = null;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  const var_names = [
    RollerDoubleSim.en.POSITION_1,
    RollerDoubleSim.en.VELOCITY_1,
    RollerDoubleSim.en.POSITION_2,
    RollerDoubleSim.en.VELOCITY_2,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY,
    VarsList.en.TIME
  ];
  const i18n_names = [
    RollerDoubleSim.i18n.POSITION_1,
    RollerDoubleSim.i18n.VELOCITY_1,
    RollerDoubleSim.i18n.POSITION_2,
    RollerDoubleSim.i18n.VELOCITY_2,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(KE, PE, TE);
  this.ball1_ = PointMass.makeCircle(0.3, 'ball1');
  this.ball1_.setMass(0.5);
  this.ball2_ = PointMass.makeCircle(0.3, 'ball2');
  this.ball2_.setMass(0.5);
  this.spring_ = new Spring('spring',
      this.ball1_, Vector.ORIGIN,
      this.ball2_, Vector.ORIGIN,
      /*restLength=*/2.0, /*stiffness=*/6.0);
  this.getSimList().add(this.ball1_, this.ball2_, this.spring_);
  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.DAMPING,
      RollerDoubleSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.GRAVITY,
      RollerDoubleSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.MASS_1,
      RollerDoubleSim.i18n.MASS_1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.MASS_2,
      RollerDoubleSim.i18n.MASS_2,
      () => this.getMass2(), a => this.setMass2(a)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.SPRING_DAMPING,
      RollerDoubleSim.i18n.SPRING_DAMPING,
      () => this.getSpringDamping(), a => this.setSpringDamping(a)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.SPRING_LENGTH,
      RollerDoubleSim.i18n.SPRING_LENGTH,
      () => this.getSpringLength(), a => this.setSpringLength(a)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.SPRING_STIFFNESS,
      RollerDoubleSim.i18n.SPRING_STIFFNESS,
      () => this.getSpringStiffness(), a => this.setSpringStiffness(a)));
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
      +', ball2_: '+this.ball2_
      +', spring_: '+this.spring_
      +', path_: '+this.path_
      +', damping_: '+Util.NF(this.damping_)
      +', gravity_: '+Util.NF(this.gravity_)
      +', lowestPoint_: '+Util.NF(this.lowestPoint_)
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RollerDoubleSim';
};

/** @inheritDoc */
getPath(): NumericalPath|null {
  return this.path_;
};

/** @inheritDoc */
setPath(path: NumericalPath): void {
  const simList = this.getSimList();
  const oldPath = this.path_;
  if (oldPath != null) {
    simList.remove(oldPath);
  }
  this.path_ = path;
  simList.add(path);
  const r = path.getBoundsWorld();
  this.lowestPoint_ = r.getBottom();
  // find closest starting point to a certain x-y position on screen
  const start1 = new Vector(r.getLeft() + r.getWidth()*0.1,
      r.getTop() - r.getHeight()*0.1);
  this.pathPoint1_ = path.findNearestGlobal(start1);
  const start2 = new Vector(r.getLeft() + r.getWidth()*0.2,
      r.getTop() - r.getHeight()*0.3);
  this.pathPoint2_ = path.findNearestGlobal(start2);
  this.getVarsList().setValues([this.pathPoint1_.p, 0, this.pathPoint2_.p, 0]);
  this.saveInitialState();
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  if (this.path_ != null) {
    const p = this.path_.mod_p(vars[P1]);
    if (p != vars[P1]) {
      vars[P1] = p;
      va.setValue(P1, p);
    }
    const p2 = this.path_.mod_p(vars[P2]);
    if (p2 != vars[P2]) {
      vars[P2] = p2;
      va.setValue(P2, p2);
    }
    const ei = this.getEnergyInfo();
    va.setValue(KE, ei.getTranslational(), true);
    va.setValue(PE, ei.getPotential(), true);
    va.setValue(TE, ei.getTotalEnergy(), true);
  }
};

/**
* @param vars
*/
private moveObjects(vars: number[]) {
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  if (this.path_ != null) {
    const pp1 = this.pathPoint1_;
    const pp2 = this.pathPoint2_;
    pp1.p = vars[P1];
    pp2.p = vars[P2];
    this.path_.map_p_to_slope(pp1);
    this.path_.map_p_to_slope(pp2);
    this.ball1_.setPosition(pp1);
    this.ball2_.setPosition(pp2);
    this.ball1_.setVelocity(pp1.getSlope().multiply(vars[V1]));
    this.ball2_.setVelocity(pp2.getSlope().multiply(vars[V2]));
  }
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const ke = this.ball1_.getKineticEnergy() + this.ball2_.getKineticEnergy();
  // gravity potential = m g y
  let pe = this.ball1_.getMass() * this.gravity_
      * (this.ball1_.getPosition().getY() - this.lowestPoint_);
  pe += this.ball2_.getMass() * this.gravity_
      * (this.ball2_.getPosition().getY() - this.lowestPoint_);
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
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
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
  } else if (simObject == this.ball2_) {
    this.dragObj_ = simObject;
    return true;
  }
  return false;
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  if (this.path_ == null)
    return;
  const va = this.getVarsList();
  const p = location.subtract(offset);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  if (simObject==this.ball1_)  {
    this.pathPoint1_ = this.path_.findNearestGlobal(p);
    va.setValue(P1, this.pathPoint1_.p);
    va.setValue(V1, 0);
    va.incrSequence(KE, PE, TE);
  } else if (simObject==this.ball2_)  {
    this.pathPoint2_ = this.path_.findNearestGlobal(p);
    va.setValue(P2, this.pathPoint2_.p);
    va.setValue(V2, 0);  // velocity
    va.incrSequence(KE, PE, TE);
  }
  this.moveObjects(va.getValues());
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
  Util.zeroArray(change);
  change[TIME] = 1; // time
  // calculate the slope at the given arc-length position on the curve
  // vars[P1] is p = path length position.
  // move objects to position so that we can get force from spring
  this.moveObjects(vars); // also updates pathPoint1_, pathPoint2_
  const springForces = this.spring_.calculateForces();
  if (this.dragObj_ != this.ball1_) {
    // FIRST BALL.
    change[P1] = vars[V1];  // p1' = v1
    // see Mathematica file 'roller.nb' for derivation of the following
    // let k = slope of curve. Then sin(theta) = k/sqrt(1+k^2)
    // Component due to gravity is v' = - g sin(theta) = - g k/sqrt(1+k^2)
    const k = this.pathPoint1_.slope;
    const sinTheta = isFinite(k) ? k/Math.sqrt(1+k*k) : 1;
    // v' = - g sin(theta) - (b/m) v= - g k/sqrt(1+k^2) - (b/m) v
    change[V1] = -this.gravity_ * this.pathPoint1_.direction * sinTheta
        - this.damping_ * vars[V1] / this.ball1_.getMass();
    let tangent;
    // spring force
    if (!isFinite(k)) {
      tangent = new Vector(0, k>0 ? 1 : -1, 0);
    } else {
      tangent = new Vector(1, k, 0);
      tangent = tangent.normalize().multiply(this.pathPoint1_.direction);
    }
    const force = springForces[0];
    Util.assert( force.getBody() == this.ball1_);
    const f = force.getVector();
    change[V1] += f.dotProduct(tangent) / this.ball1_.getMass();
  }

  if (this.dragObj_ != this.ball2_) {
    // SECOND BALL
    change[P2] = vars[V2];  // p2' = v2
    const k = this.pathPoint2_.slope;
    const sinTheta = isFinite(k) ? k/Math.sqrt(1+k*k) : 1;
    // v' = - g sin(theta) - (b/m) v= - g k/sqrt(1+k^2) - (b/m) v
    change[V2] = -this.gravity_ * this.pathPoint2_.direction * sinTheta
        - this.damping_ * vars[V2] / this.ball2_.getMass();
    let tangent;
    // spring force
    if (!isFinite(k)) {
      tangent = new Vector(0, k>0 ? 1 : -1, 0);
    } else {
      tangent = new Vector(1, k, 0);
      tangent = tangent.normalize().multiply(this.pathPoint2_.direction);
    }
    const force = springForces[1];
    Util.assert( force.getBody() == this.ball2_);
    const f = force.getVector();
    change[V2] += f.dotProduct(tangent) / this.ball2_.getMass();
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
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(RollerDoubleSim.en.GRAVITY);
};

/**
*/
getDamping(): number {
  return this.damping_;
}

/**
@param value
*/
setDamping(value: number) {
  this.damping_ = value;
  this.broadcastParameter(RollerDoubleSim.en.DAMPING);
}

/**
*/
getMass1(): number {
  return this.ball1_.getMass();
}

/**
@param value
*/
setMass1(value: number) {
  this.ball1_.setMass(value);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(RollerDoubleSim.en.MASS_1);
}

/**
*/
getMass2(): number {
  return this.ball2_.getMass();
}

/**
@param value
*/
setMass2(value: number) {
  this.ball2_.setMass(value);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(RollerDoubleSim.en.MASS_2);
}

/**
*/
getSpringStiffness(): number {
  return this.spring_.getStiffness();
}

/**
@param value
*/
setSpringStiffness(value: number) {
  this.spring_.setStiffness(value);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(RollerDoubleSim.en.SPRING_STIFFNESS);
}

/**
*/
getSpringLength(): number {
  return this.spring_.getRestLength();
}

/**
@param value
*/
setSpringLength(value: number) {
  this.spring_.setRestLength(value);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(RollerDoubleSim.en.SPRING_LENGTH);
}

/**
*/
getSpringDamping(): number {
  return this.spring_.getDamping();
}

/**
@param value
*/
setSpringDamping(value: number) {
  this.spring_.setDamping(value);
  this.broadcastParameter(RollerDoubleSim.en.SPRING_DAMPING);
}

static readonly en: i18n_strings = {
  DAMPING: 'damping',
  GRAVITY: 'gravity',
  MASS_1: 'mass-1',
  MASS_2: 'mass-2',
  POSITION_1: 'position-1',
  POSITION_2: 'position-2',
  SPRING_DAMPING: 'spring damping',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  VELOCITY_1: 'velocity-1',
  VELOCITY_2: 'velocity-2'
};

static readonly de_strings: i18n_strings = {
  DAMPING: 'Dämpfung',
  GRAVITY: 'Gravitation',
  MASS_1: 'Masse-1',
  MASS_2: 'Masse-2',
  POSITION_1: 'Position-1',
  POSITION_2: 'Position-2',
  SPRING_DAMPING: 'Federdämpfung',
  SPRING_LENGTH: 'Federlänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  VELOCITY_1: 'Geschwindigkeit-1',
  VELOCITY_2: 'Geschwindigkeit-2'
};

static readonly i18n = Util.LOCALE === 'de' ? RollerDoubleSim.de_strings : RollerDoubleSim.en;

} // end class

type i18n_strings = {
  DAMPING: string,
  GRAVITY: string,
  MASS_1: string,
  MASS_2: string,
  POSITION_1: string,
  POSITION_2: string,
  SPRING_DAMPING: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  VELOCITY_1: string,
  VELOCITY_2: string
};

Util.defineGlobal('sims$roller$RollerDoubleSim', RollerDoubleSim);
