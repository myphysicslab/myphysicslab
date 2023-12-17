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

const TRACK_P = 0;
const TRACK_V = 1;
const TIME = 2;
const X = 3;
const Y = 4;
const KE = 5;
const PE = 6;
const TE = 7;
const ANCHOR_X = 8;
const ANCHOR_Y = 9;

/** Simulation of a ball moving on a roller coaster track, optionally with a spring
attached to the ball. The track can take any shape as defined by a NumericalPath. The
simulation is not functional until a path has been provided with
{@link RollerSingleSim.setPath}.

For derivation equations of motion see <https://www.myphysicslab.com/RollerSimple.html>
and <https://www.myphysicslab.com/RollerSpring.html>.
*/
export class RollerSingleSim extends AbstractODESim implements Simulation, ODESim, EventHandler, HasPath, EnergySystem {

  private damping_: number = 0;
  private gravity_: number = 9.8;
  private hasSpring_: boolean;
  private spring_: Spring;
  private anchor_: PointMass;
  private ball1_: PointMass;
  private path_: null|NumericalPath = null;
  /** lowest possible y coordinate of path */
  private lowestPoint_: number = 0;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  /**  Temporary scratchpad, to avoid allocation. */
  private pathPoint_: PathPoint = new PathPoint();
  private dragObj_: null|SimObject = null;

/**
* @param hasSpring whether the simulation should have a spring attaching
*     the ball to a fixed point.
* @param opt_name name of this as a Subject
*/
constructor(hasSpring?: boolean, opt_name?: string) {
  super(opt_name);
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  const var_names = [
    RollerSingleSim.en.POSITION,
    RollerSingleSim.en.VELOCITY,
    VarsList.en.TIME,
    RollerSingleSim.en.X_POSITION,
    RollerSingleSim.en.Y_POSITION,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY,
    RollerSingleSim.en.ANCHOR_X,
    RollerSingleSim.en.ANCHOR_Y
  ];
  const i18n_names = [
    RollerSingleSim.i18n.POSITION,
    RollerSingleSim.i18n.VELOCITY,
    VarsList.i18n.TIME,
    RollerSingleSim.i18n.X_POSITION,
    RollerSingleSim.i18n.Y_POSITION,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY,
    RollerSingleSim.i18n.ANCHOR_X,
    RollerSingleSim.i18n.ANCHOR_Y
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(X, Y, KE, PE, TE);
  this.hasSpring_ = hasSpring || false;
  this.ball1_ = PointMass.makeCircle(0.3, 'ball1');
  this.ball1_.setMass(0.5);
  this.getSimList().add(this.ball1_);
  this.anchor_ = PointMass.makeSquare(0.4, 'anchor');
  this.spring_ = new Spring('spring',
      /*body1=*/this.ball1_, /*attach1_body=*/Vector.ORIGIN,
      /*body2=*/this.anchor_, /*attach2_body=*/Vector.ORIGIN,
      /*restLength=*/1.0, /*stiffness=*/5.0);
  if (this.hasSpring_) {
    this.getSimList().add(this.anchor_, this.spring_);
  }
  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.DAMPING,
      RollerSingleSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.GRAVITY,
      RollerSingleSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.MASS,
      RollerSingleSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.SPRING_DAMPING,
      RollerSingleSim.i18n.SPRING_DAMPING,
      () => this.getSpringDamping(), a => this.setSpringDamping(a)));
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.SPRING_LENGTH,
      RollerSingleSim.i18n.SPRING_LENGTH,
      () => this.getSpringLength(), a => this.setSpringLength(a)));
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.SPRING_STIFFNESS,
      RollerSingleSim.i18n.SPRING_STIFFNESS,
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
      +', ball1_: '+this.ball1_
      +', anchor_: '+this.anchor_
      +', spring_: '+this.spring_
      +', path_: '+this.path_
      +', hasSpring_: '+this.hasSpring_
      +', damping_: '+Util.NF(this.damping_)
      +', gravity_: '+Util.NF(this.gravity_)
      +', lowestPoint_: '+Util.NF(this.lowestPoint_)
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RollerSingleSim';
};

/** @inheritDoc */
getPath(): NumericalPath|null {
  return this.path_;
};

/** @inheritDoc */
setPath(path: NumericalPath): void {
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  const simList = this.getSimList();
  const oldPath = this.path_;
  if (oldPath != null) {
    simList.remove(oldPath);
  }
  this.path_ = path;
  simList.add(path);
  const r = path.getBoundsWorld();
  const va = this.getVarsList();
  if (this.hasSpring_) {
    // set initial anchor position at top left of path bounds
    va.setValue(ANCHOR_X, r.getLeft() + r.getWidth()*0.2);
    va.setValue(ANCHOR_Y, r.getTop() - r.getHeight()*0.4);
  }
  this.lowestPoint_ = r.getBottom();
  // find closest starting point to a certain x-y position on screen
  const start = new Vector(r.getLeft() + r.getWidth()*0.1,
                           r.getTop() - r.getHeight()*0.1);
  this.pathPoint_ = path.findNearestGlobal(start);
  va.setValue(TRACK_P, this.pathPoint_.p);
  va.setValue(TRACK_V, 0);
  va.setValue(TIME, 0);
  this.modifyObjects();
  this.saveInitialState();
};

/** @inheritDoc */
modifyObjects(): void {
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  if (this.path_ != null) {
    const va = this.getVarsList();
    const vars = va.getValues();
    this.moveObjects(vars);
    const p = this.path_.mod_p(vars[TRACK_P]);
    if (p != vars[TRACK_P]) {
      vars[TRACK_P] = p;
      va.setValue(TRACK_P, p);
    }
    va.setValue(X, this.path_.map_p_to_x(vars[TRACK_P]), true);
    va.setValue(Y, this.path_.map_p_to_y(vars[TRACK_P]), true);
    const ei = this.getEnergyInfo();
    va.setValue(KE, ei.getTranslational(), true);
    va.setValue(PE, ei.getPotential(), true);
    va.setValue(TE, ei.getTotalEnergy(), true);
  }
};

private moveObjects(vars: number[]) {
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  if (this.path_ != null) {
    this.pathPoint_.p = vars[TRACK_P];
    this.path_.map_p_to_slope(this.pathPoint_);
    this.ball1_.setPosition(this.pathPoint_);
    this.ball1_.setVelocity(this.pathPoint_.getSlope().multiply(vars[TRACK_V]));
  }
  if (this.hasSpring_) {
    this.anchor_.setPosition(new Vector(vars[ANCHOR_X],  vars[ANCHOR_Y]));
  }
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const ke = this.ball1_.getKineticEnergy();
  // gravity potential = m g y
  let pe = this.ball1_.getMass() * this.gravity_ *
      (this.ball1_.getPosition().getY() - this.lowestPoint_);
  if (this.hasSpring_) {
    pe += this.spring_.getPotentialEnergy();
  }
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
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
  } else if (simObject == this.anchor_) {
    return true;
  }
  return false;
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  const va = this.getVarsList();
  const p = location.subtract(offset);
  if (simObject == this.ball1_ && this.path_ != null)  {
    this.pathPoint_ = this.path_.findNearestGlobal(p);
    va.setValue(TRACK_P, this.pathPoint_.p);
    va.setValue(TRACK_V, 0);
    va.incrSequence(X, Y, KE, PE, TE);
  } else if (simObject == this.anchor_) {
    va.setValue(ANCHOR_X, p.getX());
    va.setValue(ANCHOR_Y, p.getY());
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
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  Util.zeroArray(change);
  change[TIME] = 1; // time changes at a rate of 1 by definition.
  if (this.dragObj_ != this.ball1_) {
    // calculate the slope at the given arc-length position on the curve
    // vars[TRACK_P] is p = path length position.
    // so that we can reference spring position directly
    this.moveObjects(vars);
    change[TRACK_P] = vars[TRACK_V];  // p' = v
    // see Mathematica file 'roller.nb' for derivation of the following
    // let k = slope of curve. Then sin(theta) = k/sqrt(1+k^2)
    // Component due to gravity is v' = - g sin(theta) = - g k/sqrt(1+k^2)
    const k = this.pathPoint_.slope;
    const sinTheta = isFinite(k) ? k/Math.sqrt(1+k*k) : 1;
    const mass = this.ball1_.getMass();
    // v' = - g sin(theta) - (b/m) v= - g k/sqrt(1+k^2) - (b/m) v
    change[TRACK_V] = -this.gravity_ * this.pathPoint_.direction * sinTheta
        - this.damping_ * vars[TRACK_V] / mass;
    if (this.hasSpring_) {
      let tangent: Vector;
      if (!isFinite(k)) {
        tangent = new Vector(0, k>0 ? 1 : -1, 0);
      } else {
        tangent = new Vector(1, k, 0);
        tangent = tangent.normalize().multiply(this.pathPoint_.direction);
      }
      const force = this.spring_.calculateForces()[0];
      Util.assert(force.getBody() == this.ball1_);
      const f = force.getVector();
      change[TRACK_V] += f.dotProduct(tangent) / mass;
    }
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
setGravity(value: number): void {
  this.gravity_ = value;
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(RollerSingleSim.en.GRAVITY);
};

/**
*/
getDamping(): number {
  return this.damping_;
}

/**
@param value
*/
setDamping(value: number): void {
  this.damping_ = value;
  this.broadcastParameter(RollerSingleSim.en.DAMPING);
}

/**
*/
getMass(): number {
  return this.ball1_.getMass();
}

/**
@param value
*/
setMass(value: number): void {
  this.ball1_.setMass(value);
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(RollerSingleSim.en.MASS);
}

/**
*/
getSpringStiffness(): number {
  return this.spring_.getStiffness();
}

/**
@param value
*/
setSpringStiffness(value: number): void {
  this.spring_.setStiffness(value);
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(RollerSingleSim.en.SPRING_STIFFNESS);
}

/**
*/
getSpringLength(): number {
  return this.spring_.getRestLength();
}

/**
@param value
*/
setSpringLength(value: number): void {
  this.spring_.setRestLength(value);
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(RollerSingleSim.en.SPRING_LENGTH);
}

/**
*/
getSpringDamping(): number {
  return this.spring_.getDamping();
}

/**
@param value
*/
setSpringDamping(value: number): void {
  this.spring_.setDamping(value);
  this.broadcastParameter(RollerSingleSim.en.SPRING_DAMPING);
}

static readonly en: i18n_strings = {
  ANCHOR_X: 'anchor X',
  ANCHOR_Y: 'anchor Y',
  DAMPING: 'damping',
  GRAVITY: 'gravity',
  MASS: 'mass',
  SPRING_DAMPING: 'spring damping',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  POSITION: 'position',
  VELOCITY: 'velocity',
  X_POSITION: 'x position',
  Y_POSITION: 'y position'
};

static readonly de_strings: i18n_strings = {
  ANCHOR_X: 'Anker X',
  ANCHOR_Y: 'Anker Y',
  DAMPING: 'Dämpfung',
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  SPRING_DAMPING: 'Federdämpfung',
  SPRING_LENGTH: 'Federlänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  POSITION: 'Position',
  VELOCITY: 'Geschwindigkeit',
  X_POSITION: 'x Position',
  Y_POSITION: 'y Position'
};

static readonly i18n = Util.LOCALE === 'de' ? RollerSingleSim.de_strings : RollerSingleSim.en;

} // end class

type i18n_strings = {
  ANCHOR_X: string,
  ANCHOR_Y: string,
  DAMPING: string,
  GRAVITY: string,
  MASS: string,
  SPRING_DAMPING: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  POSITION: string,
  VELOCITY: string,
  X_POSITION: string,
  Y_POSITION: string
};

Util.defineGlobal('sims$roller$RollerSingleSim', RollerSingleSim);
