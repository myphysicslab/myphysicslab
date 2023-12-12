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

import { AbstractSimObject, SimObject } from '../../lab/model/SimObject.js';
import { AbstractSubject } from '../../lab/util/AbstractSubject.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js';
import { GenericEvent } from '../../lab/util/Observe.js';
import { MutableVector } from '../../lab/util/MutableVector.js';
import { ParameterNumber, Subject } from '../../lab/util/Observe.js';
import { Path, PathIterator } from '../../lab/model/Path.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimList } from '../../lab/model/SimList.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { Spring } from '../../lab/model/Spring.js';
import { StringShape } from './StringShape.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

/** Simulation of a string under tension which can have waves in 2D.  This is
an unusual simulation from others in myPhysicsLab in that it uses a partial
differential equation (PDE) model.

Algorithm
------------------------
Based on Algorithm 12.4, 'Wave Equation Finite-Difference' from
<cite>Numerical Analysis</cite>, 6th Ed. by Burden & Faires.

Three Data Arrays
-------------------------
The three data arrays, `w1, w2, w3` represent the _current_, _past_, and _next_ string
state. Each entry in an array is the displacement of the string at that point.

The role of representing the current, past, or next state rotates among the three
arrays, changing with step forward in time.

Suppose that `w1` = past, `w2` = current, and `w3` = next. We can get _space
derivatives_ by looking at neighboring points within `w2`. We can get _time derivatives_
by looking at the difference between a point in `w1` and `w2`. The PDE for the string
then gives us the change based on those derivatives, and we can figure out `w3`.

Stability Condition
-------------------------
The stability condition is:
```text
sqrt(tension / density) delta_t / delta_x < 1
```

**TO DO** Provide a VarsList for graphing. We could provide variables corresponding to
one or more discrete points on the string, giving the position (displacement), velocity,
accel at that point.

*/
export class StringSim extends AbstractSubject implements Subject, Simulation, EventHandler, EnergySystem {
  private simList_: SimList;
  private length_: number = 5;
  private damping_: number = 0;
  /** density of string per unit length */
  private density_: number = 1;
  private tension_: number = 10;
  /** moveable block, connected to left side of string */
  private block_: PointMass = PointMass.makeRectangle(0.7, 0.05, 'block');
  /** starting position for the block */
  private startPosition_: Vector = new Vector(-this.block_.getWidth()/2, 0);
  /** data array */
  private w1_: number[] = [];
  /** data array */
  private w2_: number[] = [];
  /** data array */
  private w3_: number[] = [];
  /** tells which array of w1, w2, w3 is most recent */
  private wIdx_: number = 1;
  /** current data array */
  private w_: number[] = this.w1_;
  /** spatial grid size */
  private deltaX_: number = 0.1;
  /** time step size */
  private deltaT_: number = 0.0025;
  /** number of samples for averaging stability */
  private avgLen_: number = 10;
  /** for checking on delta(t) = avg time between updates */
  private times_: number[] = Util.newNumberArray(this.avgLen_);
  /** for averaging stability value */
  private stab_: number[] = Util.newNumberArray(this.avgLen_);
  /** sequence number indicates when the data array has changed. */
  private sequence_: number = 0;
  /** index into times_ array */
  private timeIdx_: number = 0;
  /** last time we printed delta(t) */
  private lastTime_: number = -100;
  /** current simulation time */
  private nowTime_: number = 0;
  private shape_: StringShape;
  private curve_: StringPath;
  private numPoints_: number = 1001;
  /** potential energy offset */
  private potentialOffset_: number = 0;

/**
* @param shape starting wave shape
* @param opt_simList SimList to use (optional)
*/
constructor(shape: StringShape, opt_simList?: SimList) {
  super('SIM');
  this.simList_ = opt_simList || new SimList();
  this.block_.setPosition(this.startPosition_);
  this.simList_.add(this.block_);
  this.shape_ = shape;
  this.curve_ = new StringPath(this);
  this.simList_.add(this.curve_);

  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, StringSim.en.DAMPING,
      StringSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, StringSim.en.DENSITY,
      StringSim.i18n.DENSITY,
      () => this.getDensity(), a => this.setDensity(a)));
  this.addParameter(new ParameterNumber(this, StringSim.en.TENSION,
      StringSim.i18n.TENSION,
      () => this.getTension(), a => this.setTension(a)));
  this.addParameter(new ParameterNumber(this, StringSim.en.NUM_POINTS,
      StringSim.i18n.NUM_POINTS,
      () => this.getNumPoints(), a => this.setNumPoints(a)));
  this.addParameter(new ParameterNumber(this, StringSim.en.TIME_STEP,
      StringSim.i18n.TIME_STEP,
      () => this.getTimeStep(), a => this.setTimeStep(a)));
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
  this.initializeFromShape();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
    +', density_: '+Util.NF(this.density_)
    +', tension_: '+this.tension_
    +', potentialOffset_: '+Util.NF(this.potentialOffset_)
    + super.toString();
};

/** @inheritDoc */
getClassName(): string {
  return 'StringSim';
};

/** Returns the length of the string.
@return length of the string
*/
getLength(): number {
  return this.length_;
};

/** @inheritDoc */
getSimList(): SimList {
  return this.simList_;
};

/** @inheritDoc */
getTime(): number {
  return this.nowTime_;
};

/** @inheritDoc */
modifyObjects(): void {
};

/** @inheritDoc */
saveInitialState(): void {
};

/** @inheritDoc */
reset(): void {
  this.nowTime_ = 0;
  this.initializeFromShape();
  this.simList_.removeTemporary(Infinity);
  this.modifyObjects();
  this.broadcast(new GenericEvent(this, 'RESET'));
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  return simObject == this.block_;
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  if (simObject == this.block_) {
    const p = location.subtract(offset);
    this.block_.setPosition(new Vector(this.block_.getPosition().getX(), p.getY()));
  }
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** Sets the given MutableVector to the position of a point on the string
* @param idx index of point on the string, from 0 to {@link StringSim.getNumPoints}
* @param point the MutableVector which will be set to the position
*/
getPoint(idx: number, point: MutableVector): void {
  if (idx < 0 || idx > this.w_.length) {
    throw '';
  }
  point.setTo(idx*this.length_/this.numPoints_, this.w_[idx]);
};

/* Set initial conditions for string based on current shape.
*/
initializeFromShape(): void  {
  this.block_.setPosition(this.startPosition_);
  this.length_ = this.shape_.getLength();
  this.deltaX_ = this.length_/(this.numPoints_-1);
  //this.deltaT_ = 0.0025;  // was 0.03
  this.w1_ = Util.newNumberArray(this.numPoints_);
  this.w2_ = Util.newNumberArray(this.numPoints_);
  this.w3_ = Util.newNumberArray(this.numPoints_);
  this.wIdx_ = 2;
  this.w_ = this.w2_;

  // In terms of Burden Faires, p. 702, I think we have:
  // k = deltaT = time step size
  // h = deltaX = spatial grid size
  // alpha = sqrt(tension/density) = wave speed
  const r = (this.deltaT_*this.deltaT_*this.tension_/this.density_) /
        (this.deltaX_*this.deltaX_);
  this.w1_[0] = this.w1_[this.numPoints_-1] = 0;
  this.w2_[0] = this.w2_[this.numPoints_-1] = 0;
  for (let i=1; i<this.numPoints_-1; i++) {
    this.w1_[i] = this.shape_.position(i*this.deltaX_);
    // Following assumes initial velocity is zero.
    // Note that we could use second derivative of f for more accuracy.
    this.w2_[i] = (1 - r)*this.shape_.position(i*this.deltaX_)
        + (r/2)*( this.shape_.position((i+1)*this.deltaX_)
                + this.shape_.position((i-1)*this.deltaX_));
    // add in the initial velocity term
    this.w2_[i] += this.deltaT_*Math.sqrt(this.tension_/this.density_)
        *this.shape_.velocity(i*this.deltaX_);
  }
};

/** Advances the simulation state by the time step given by
{@link StringSim.getTimeStep}.
*/
advance(): void {
  let wNew: number[];
  let w: number[];
  let wOld: number[];
  // figure out which vector to use for latest data
  switch (this.wIdx_) {
    case 1:  // w1 is most recent data, then 3, 2 is oldest
      w = this.w1_;
      wOld = this.w3_;
      wNew = this.w2_;
      this.wIdx_ = 2;
      break;
    case 2:  // w2 is most recent data, then 1, 3 is oldest
      w = this.w2_;
      wOld = this.w1_;
      wNew = this.w3_;
      this.wIdx_ = 3;
      break;
    case 3:  // w3 is most recent data, then 2, 1 is oldest
      w = this.w3_;
      wOld = this.w2_;
      wNew = this.w1_;
      this.wIdx_ = 1;
      break;
    default:
      throw '';
  }
  const N = this.numPoints_-1;
  wNew[0] = 0;
  wNew[N] = 0;
  // use vertical position of block to set left point
  wNew[0] = this.block_.getPosition().getY();
  const r = (this.deltaT_*this.deltaT_*this.tension_/this.density_)/
      (this.deltaX_*this.deltaX_);
  // ******  this is the PDE solver  ******
  for (let i=1; i<=N-1; i++) {
    wNew[i] = 2*(1-r)*w[i] + r*(w[i+1] + w[i-1]) - wOld[i];
    if (this.damping_ > 0) {
      wNew[i] += -this.damping_*(w[i] - wOld[i])*this.deltaT_/this.density_;
    }
  }
  this.nowTime_ += this.deltaT_;
  this.w_ = wNew;
  this.sequence_++; // changing sequence number indicates data array has changed
  if (this.sequence_ >= Util.MAX_INTEGER) {
    this.sequence_ = 0;
  }
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  let wNew: number[];
  let w: number[];
  // figure out which vector to use for latest data
  switch (this.wIdx_) {
    case 1:  // w1 is most recent data, then 3, 2 is oldest
      wNew = this.w1_;
      w = this.w3_;
      break;
    case 2:  // w2 is most recent data, then 1, 3 is oldest
      wNew = this.w2_;
      w = this.w1_;
      break;
    case 3:  // w3 is most recent data, then 2, 1 is oldest
      wNew = this.w3_;
      w = this.w2_;
      break;
    default:
      throw '';
  }
  let ke = 0;
  let pe = 0;
  // integrate potential and kinetic energy over length of string
  for (let i=1; i<this.numPoints_-1; i++) {
    let diff = (wNew[i-1] - wNew[i+1]) / (2*this.deltaX_);
    pe += diff*diff*this.deltaX_;  // potential energy integral
    diff = (wNew[i] - w[i])/ this.deltaT_;
    ke += diff*diff*this.deltaX_;  // kinetic energy integral
  }
  ke = 0.5*this.density_*ke;
  pe = 0.5*this.tension_*pe;
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** Returns a sequence number which changes when the data array changes.
* @return sequence number which indicates when data array changes
*/
getSequence(): number {
  return this.sequence_;
};

/** Returns initial shape of string
@return initial shape of string
*/
getShape(): StringShape {
  return this.shape_;
};

/** Set initial shape of string
@param shape initial shape of string
*/
setShape(shape: StringShape): void {
  this.shape_ = shape;
  this.initializeFromShape();
};

/** Returns number of calculation points on the string
* @return number of calculation points on the string
*/
getNumPoints(): number {
  return this.numPoints_;
};

/** Set number of calculation points on the string.
* @param value number of calculation points on the string
*/
setNumPoints(value: number): void {
  if (value != this.numPoints_) {
    this.numPoints_ = value;
    this.reset();
    this.broadcastParameter(StringSim.en.NUM_POINTS);
  }
};

/** Returns time step used when advancing the simulation
* @return time step used when advancing the simulation
*/
getTimeStep(): number {
  return this.deltaT_;
};

/** Set time step used when advancing the simulation
* @param value time step used when advancing the simulation
*/
setTimeStep(value: number): void {
  if (value != this.deltaT_) {
    this.deltaT_ = value;
    this.reset();
    this.broadcastParameter(StringSim.en.TIME_STEP);
  }
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
setDamping(value: number): void {
  this.damping_ = value;
  this.broadcastParameter(StringSim.en.DAMPING);
};

/** Return density of string (mass per unit length)
@return density of string
*/
getDensity(): number {
  return this.density_;
};

/** Set density of string (mass per unit length)
@param value density of string
*/
setDensity(value: number): void {
  this.density_ = value;
  this.broadcastParameter(StringSim.en.DENSITY);
};

/** Return tension.
@return tension
*/
getTension(): number {
  return this.tension_;
};

/** Set tension.
@param value tension
*/
setTension(value: number): void {
  this.tension_ = value;
  this.broadcastParameter(StringSim.en.TENSION);
};

/** Returns the stability condition number, which must be less than one for
the simulation to be stable.
@return the stability condition number
*/
getStability(): number {
  return Math.sqrt(this.tension_/this.density_)*this.deltaT_/this.deltaX_;
};

static readonly en: i18n_strings = {
  DAMPING: 'damping',
  DENSITY: 'density',
  TENSION: 'tension',
  SHAPE: 'shape',
  NUM_POINTS: 'number of points',
  TIME_STEP: 'time step'
};

static readonly de_strings: i18n_strings = {
  DAMPING: 'Dämpfung',
  DENSITY: 'Dichte',
  TENSION: 'Spannung',
  SHAPE: 'Form',
  NUM_POINTS: 'Anzahl von Punkten',
  TIME_STEP: 'Zeitschritt'
};

static readonly i18n = Util.LOCALE === 'de' ? StringSim.de_strings : StringSim.en;

} // end class

type i18n_strings = {
  DAMPING: string,
  DENSITY: string,
  TENSION: string,
  SHAPE: string,
  NUM_POINTS: string,
  TIME_STEP: string
};

Util.defineGlobal('sims$pde$StringSim', StringSim);


// ************************* StringPath *****************************

/** This is an [Adapter](https://en.wikipedia.org/wiki/Adapter_pattern) that forwards
* to {@link StringSim}.
*/
export class StringPath extends AbstractSimObject implements SimObject, Path {
  private sim_: StringSim;

/**
* @param sim
*/
constructor(sim: StringSim) {
  super('string');
  this.sim_ = sim;
};

/** @inheritDoc */
override toString(): string {
  return super.toString().slice(0, -1)
      +', sim: '+this.sim_.toStringShort()
      +'}';
};

/** @inheritDoc */
getClassName(): string {
  return 'StringPath';
};

/** @inheritDoc */
getBoundsWorld(): DoubleRect {
  // height is just a guess! Should get this info from StringShape?
  const len = this.sim_.getLength();
  const height = 1;
  return new DoubleRect(0, -height, len, height);
};

/** @inheritDoc */
getIterator(_numPoints: number): PathIterator {
  return new StringIterator(this.sim_);
};

/** @inheritDoc */
getSequence(): number {
  return this.sim_.getSequence();
};

} // end class

Util.defineGlobal('sims$pde$StringPath', StringPath);

// ************************* StringIterator *****************************

/** This is an [Adapter](https://en.wikipedia.org/wiki/Adapter_pattern) that forwards
* to {@link StringSim}.
*/
export class StringIterator implements PathIterator {
  private sim_: StringSim;
  private idx_: number = -1;

/**
* @param sim
*/
constructor(sim: StringSim) {
  this.sim_ = sim;
};

/** @inheritDoc */
nextPoint(point: MutableVector): boolean {
  const n = this.sim_.getNumPoints();
  if (this.idx_ >=  n-1) {
    return false;
  }
  this.idx_++;
  this.sim_.getPoint(this.idx_, point);
  return true;
};

} // end class

Util.defineGlobal('sims$pde$StringIterator', StringIterator);
