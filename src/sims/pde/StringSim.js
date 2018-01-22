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

goog.provide('myphysicslab.sims.pde.StringSim');
goog.provide('myphysicslab.sims.pde.StringAdvance');
goog.provide('myphysicslab.sims.pde.StringPath');
goog.provide('myphysicslab.sims.pde.StringIterator');

goog.require('goog.asserts');
goog.require('goog.array');
goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.AbstractSimObject');
goog.require('myphysicslab.lab.model.AdvanceStrategy');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.ODESim');
goog.require('myphysicslab.lab.model.Path');
goog.require('myphysicslab.lab.model.PathIterator');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.Simulation');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.MutableVector');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.pde.StringShape');


goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const AbstractSimObject = goog.module.get('myphysicslab.lab.model.AbstractSimObject');
const AbstractSubject = goog.module.get('myphysicslab.lab.util.AbstractSubject');
var AdvanceStrategy = lab.model.AdvanceStrategy;
const ConcreteLine = goog.module.get('myphysicslab.lab.model.ConcreteLine');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const EnergyInfo = goog.module.get('myphysicslab.lab.model.EnergyInfo');
var EnergySystem = lab.model.EnergySystem;
var EventHandler = myphysicslab.lab.app.EventHandler;
const GenericEvent = goog.module.get('myphysicslab.lab.util.GenericEvent');
const MutableVector = goog.module.get('myphysicslab.lab.util.MutableVector');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const Path = goog.module.get('myphysicslab.lab.model.Path');
const PathIterator = goog.module.get('myphysicslab.lab.model.PathIterator');
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
var SimList = lab.model.SimList;
var Simulation = lab.model.Simulation;
const Spring = goog.module.get('myphysicslab.lab.model.Spring');
var StringShape = sims.pde.StringShape;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

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

    sqrt(tension / density) delta_t / delta_x < 1


@todo Proved a VarsList for graphing. We could provide variables corresponding to
one or more discrete points on the string, giving the position (displacement), velocity,
accel at that point.

* @constructor
* @final
* @struct
* @implements {EnergySystem}
* @implements {EventHandler}
* @implements {Simulation}
* @extends {AbstractSubject}
* @param {!StringShape} shape starting wave shape
* @param {!SimList=} opt_simList SimList to use (optional)
*/
myphysicslab.sims.pde.StringSim = function(shape, opt_simList) {
  AbstractSubject.call(this, 'SIM');
  /**
  * @type {!SimList}
  * @private
  */
  this.simList_ = opt_simList || new SimList();
  /**
  * @type {number}
  * @private
  */
  this.length_ = 5;
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0;
  /** density of string per unit length
  * @type {number}
  * @private
  */
  this.density_ = 1;
  /**
  * @type {number}
  * @private
  */
  this.tension_ = 10;
  /** moveable block, connected to left side of string
  * @type {!PointMass}
  * @private
  */
  this.block_ = PointMass.makeRectangle(0.7, 0.05, 'block');
  /** starting position for the block
  * @type {!Vector}
  * @private
  */
  this.startPosition_ = new Vector(-this.block_.getWidth()/2, 0);
  this.block_.setPosition(this.startPosition_);
  this.simList_.add(this.block_);
  /** data array
  * @type {!Array<number>}
  * @private
  */
  this.w1_ = [];
  /** data array
  * @type {!Array<number>}
  * @private
  */
  this.w2_ = [];
  /** data array
  * @type {!Array<number>}
  * @private
  */
  this.w3_ = [];
  /** tells which array of w1, w2, w3 is most recent
  * @type {number}
  * @private
  */
  this.wIdx_ = 1;
  /** current data array
  * @type {!Array<number>}
  * @private
  */
  this.w_ = this.w1_;
  /** spatial grid size
  * @type {number}
  * @private
  */
  this.deltaX_ = 0.1;
  /** time step size
  * @type {number}
  * @private
  */
  this.deltaT_ = 0.0025;
  /** number of samples for averaging stability
  * @type {number}
  * @private
  */
  this.avgLen_ = 10;
  /** for checking on delta(t) = avg time between updates
  * @type {!Array<number>}
  * @private
  */
  this.times_ = Util.newNumberArray(this.avgLen_);
  /** for averaging stability value
  * @type {!Array<number>}
  * @private
  */
  this.stab_ = Util.newNumberArray(this.avgLen_);
  /** sequence number indicates when the data array has changed.
  * @type {number}
  * @private
  */
  this.sequence_ = 0;
  /** index into times_ array
  * @type {number}
  * @private
  */
  this.timeIdx_ = 0;
  /** last time we printed delta(t)
  * @type {number}
  * @private
  */
  this.lastTime_ = -100;
  /** current simulation time
  * @type {number}
  * @private
  */
  this.nowTime_ = 0;
  /**
  * @type {!StringShape}
  * @private
  */
  this.shape_ = shape;
  /**
  * @type {!StringPath}
  * @private
  */
  this.curve_ = new StringPath(this);
  this.simList_.add(this.curve_);
  /**
  * @type {number}
  * @private
  */
  this.numPoints_ = 1001;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  this.addParameter(new ParameterNumber(this, StringSim.en.DAMPING,
      StringSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, StringSim.en.DENSITY,
      StringSim.i18n.DENSITY,
      goog.bind(this.getDensity, this), goog.bind(this.setDensity, this)));
  this.addParameter(new ParameterNumber(this, StringSim.en.TENSION,
      StringSim.i18n.TENSION,
      goog.bind(this.getTension, this), goog.bind(this.setTension, this)));
  this.addParameter(new ParameterNumber(this, StringSim.en.NUM_POINTS,
      StringSim.i18n.NUM_POINTS,
      goog.bind(this.getNumPoints, this), goog.bind(this.setNumPoints, this)));
  this.addParameter(new ParameterNumber(this, StringSim.en.TIME_STEP,
      StringSim.i18n.TIME_STEP,
      goog.bind(this.getTimeStep, this), goog.bind(this.setTimeStep, this)));
  this.initializeFromShape();
};
var StringSim = myphysicslab.sims.pde.StringSim;
goog.inherits(StringSim, AbstractSubject);

/** @override */
StringSim.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
    +', density_: '+Util.NF(this.density_)
    +', tension_: '+this.tension_
    + StringSim.superClass_.toString.call(this);
};

/** @override */
StringSim.prototype.getClassName = function() {
  return 'StringSim';
};

/** @override */
StringSim.prototype.getSimList = function() {
  return this.simList_;
};

/** @override */
StringSim.prototype.getTime = function() {
  return this.nowTime_;
};

/** @override */
StringSim.prototype.modifyObjects = function() {
};

/** @override */
StringSim.prototype.saveInitialState = function() {
};

/** @override */
StringSim.prototype.reset = function() {
  this.nowTime_ = 0;
  this.initializeFromShape();
  this.simList_.removeTemporary(Util.POSITIVE_INFINITY);
  this.modifyObjects();
  this.broadcast(new GenericEvent(this, Simulation.RESET));
};

/** @override */
StringSim.prototype.startDrag = function(simObject, location, offset, dragBody,
      mouseEvent) {
  return simObject == this.block_;
};

/** @override */
StringSim.prototype.mouseDrag = function(simObject, location, offset, mouseEvent) {
  if (simObject == this.block_) {
    var p = location.subtract(offset);
    this.block_.setPosition(new Vector(this.block_.getPosition().getX(), p.getY()));
  }
};

/** @override */
StringSim.prototype.finishDrag = function(simObject, location, offset) {
};

/** @override */
StringSim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/** Sets the given MutableVector to the position of a point on the string
* @param {number} idx index of point on the string, from 0 to {@link #getNumPoints}
* @param {!MutableVector} point the MutableVector which will be set to the position
*/
StringSim.prototype.getPoint = function(idx, point) {
  if (idx < 0 || idx > this.w_.length) {
    throw new Error();
  }
  point.setTo(idx*this.length_/this.numPoints_, this.w_[idx]);
};

/* Set initial conditions for string based on current shape.
* return {undefined}
*/
StringSim.prototype.initializeFromShape = function()  {
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
  var r = (this.deltaT_*this.deltaT_*this.tension_/this.density_) /
        (this.deltaX_*this.deltaX_);
  this.w1_[0] = this.w1_[this.numPoints_-1] = 0;
  this.w2_[0] = this.w2_[this.numPoints_-1] = 0;
  for (var i=1; i<this.numPoints_-1; i++) {
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

/** Advances the simulation state by the time step given by {@link #getTimeStep}.
* @return {undefined}
*/
StringSim.prototype.advance = function() {
  /** @type {!Array<number>} */
  var wNew;
  /** @type {!Array<number>} */
  var w;
  /** @type {!Array<number>} */
  var wOld;
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
      throw new Error();
  }
  var N = this.numPoints_-1;
  wNew[0] = 0;
  wNew[N] = 0;
  // use vertical position of block to set left point
  wNew[0] = this.block_.getPosition().getY();
  var r = (this.deltaT_*this.deltaT_*this.tension_/this.density_)/
      (this.deltaX_*this.deltaX_);
  // ******  this is the PDE solver  ******
  for (var i=1; i<=N-1; i++) {
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

/** @override */
StringSim.prototype.getEnergyInfo = function() {
  /** @type {!Array<number>} */
  var wNew;
  /** @type {!Array<number>} */
  var w;
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
      throw new Error();
  }
  var ke = 0;
  var pe = 0;
  // integrate potential and kinetic energy over length of string
  for (var i=1; i<this.numPoints_-1; i++) {
    var diff = (wNew[i-1] - wNew[i+1]) / (2*this.deltaX_);
    pe += diff*diff*this.deltaX_;  // potential energy integral
    diff = (wNew[i] - w[i])/ this.deltaT_;
    ke += diff*diff*this.deltaX_;  // kinetic energy integral
  }
  ke = 0.5*this.density_*ke;
  pe = 0.5*this.tension_*pe;
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
StringSim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** Returns a sequence number which changes when the data array changes.
* @return {number} sequence number which indicates when data array changes
*/
StringSim.prototype.getSequence = function () {
  return this.sequence_;
};

/** Returns initial shape of string
@return {!StringShape} initial shape of string
*/
StringSim.prototype.getShape = function() {
  return this.shape_;
};

/** Set initial shape of string
@param {!StringShape} shape initial shape of string
*/
StringSim.prototype.setShape = function(shape) {
  this.shape_ = shape;
  this.initializeFromShape();
};

/** Returns number of calculation points on the string
* @return {number} number of calculation points on the string
*/
StringSim.prototype.getNumPoints = function() {
  return this.numPoints_;
};

/** Set number of calculation points on the string.
* @param {number} value number of calculation points on the string
*/
StringSim.prototype.setNumPoints = function(value) {
  if (value != this.numPoints_) {
    this.numPoints_ = value;
    this.reset();
    this.broadcastParameter(StringSim.en.NUM_POINTS);
  }
};

/** Returns time step used when advancing the simulation
* @return {number} time step used when advancing the simulation
*/
StringSim.prototype.getTimeStep = function() {
  return this.deltaT_;
};

/** Set time step used when advancing the simulation
* @param {number} value time step used when advancing the simulation
*/
StringSim.prototype.setTimeStep = function(value) {
  if (value != this.deltaT_) {
    this.deltaT_ = value;
    this.reset();
    this.broadcastParameter(StringSim.en.TIME_STEP);
  }
};

/** Return damping
@return {number} damping
*/
StringSim.prototype.getDamping = function() {
  return this.damping_;
};

/** Set damping
@param {number} value damping
*/
StringSim.prototype.setDamping = function(value) {
  this.damping_ = value;
  this.broadcastParameter(StringSim.en.DAMPING);
};

/** Return density of string (mass per unit length)
@return {number} density of string
*/
StringSim.prototype.getDensity = function() {
  return this.density_;
};

/** Set density of string (mass per unit length)
@param {number} value density of string
*/
StringSim.prototype.setDensity = function(value) {
  this.density_ = value;
  this.broadcastParameter(StringSim.en.DENSITY);
};

/** Return tension.
@return {number} tension
*/
StringSim.prototype.getTension = function() {
  return this.tension_;
};

/** Set tension.
@param {number} value tension
*/
StringSim.prototype.setTension = function(value) {
  this.tension_ = value;
  this.broadcastParameter(StringSim.en.TENSION);
};

/** Returns the stability condition number, which must be less than one for
the simulation to be stable.
@return {number} the stability condition number
*/
StringSim.prototype.getStability = function() {
  return Math.sqrt(this.tension_/this.density_)*this.deltaT_/this.deltaX_;
};

/** Set of internationalized strings.
@typedef {{
  DAMPING: string,
  DENSITY: string,
  TENSION: string,
  SHAPE: string,
  NUM_POINTS: string,
  TIME_STEP: string
  }}
*/
StringSim.i18n_strings;

/**
@type {StringSim.i18n_strings}
*/
StringSim.en = {
  DAMPING: 'damping',
  DENSITY: 'density',
  TENSION: 'tension',
  SHAPE: 'shape',
  NUM_POINTS: 'number of points',
  TIME_STEP: 'time step'
};

/**
@private
@type {StringSim.i18n_strings}
*/
StringSim.de_strings = {
  DAMPING: 'D\u00e4mpfung',
  DENSITY: 'Dichte',
  TENSION: 'Spannung',
  SHAPE: 'Form',
  NUM_POINTS: 'Anzahl von Punkten',
  TIME_STEP: 'Zeitschritt'
};

/** Set of internationalized strings.
@type {StringSim.i18n_strings}
*/
StringSim.i18n = goog.LOCALE === 'de' ? StringSim.de_strings :
    StringSim.en;



// ==============================================================
// ====== S T R I N G     A D V A N C E  ==============
// ============================================================


/** This is an Adapter that forwards to {@link StringSim}.
* @constructor
* @final
* @struct
* @implements {AdvanceStrategy}
* @param {!StringSim} sim
*/
myphysicslab.sims.pde.StringAdvance = function(sim) {
  /**
  * @type {!StringSim}
  * @private
  */
  this.sim_ = sim;
};
var StringAdvance = myphysicslab.sims.pde.StringAdvance;

/** @override */
StringAdvance.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort();
};

/** @override */
StringAdvance.prototype.toStringShort = function() {
  return Util.ADVANCED ? '' : 'StringAdvance{sim_: '+this.sim_.toStringShort()+'}';
};

/** @override */
StringAdvance.prototype.advance = function(opt_timeStep, opt_memoList) {
  var timeStep = goog.isDef(opt_timeStep) ? opt_timeStep : this.getTimeStep();
  var startTime = this.getTime();
  while (this.getTime() < startTime + timeStep) {
    this.sim_.advance();
  }
  this.sim_.getSimList().removeTemporary(this.sim_.getTime());
  this.sim_.modifyObjects();
  if (opt_memoList !== undefined) {
    opt_memoList.memorize();
  }
};

/** @override */
StringAdvance.prototype.getTime = function() {
  return this.sim_.getTime();
};

/** @override */
StringAdvance.prototype.getTimeStep = function() {
  return this.sim_.getTimeStep();
};

/** @override */
StringAdvance.prototype.setTimeStep = function(value) {
  if (this.sim_.getTimeStep() != value) {
    this.sim_.setTimeStep(value);
  }
};

/** @override */
StringAdvance.prototype.reset = function() {
  this.sim_.reset();
};


// ==============================================================
// ====== S T R I N G     P A T H  ==============
// ============================================================

/** This is an Adapter that forwards to {@link StringSim}.
* @param {!StringSim} sim
* @constructor
* @final
* @struct
* @implements {Path}
* @extends {AbstractSimObject}
*/
myphysicslab.sims.pde.StringPath = function(sim) {
  AbstractSimObject.call(this, 'string');
  /**
  * @type {!StringSim}
  * @private
  */
  this.sim_ = sim;
};
var StringPath = myphysicslab.sims.pde.StringPath;
goog.inherits(StringPath, AbstractSimObject);

/** @override */
StringPath.prototype.toString = function() {
  return Util.ADVANCED ? '' : StringPath.superClass_.toString.call(this).slice(0, -1)
      +', sim: '+this.sim_.toStringShort()
      +'}';
};

/** @override */
StringPath.prototype.getClassName = function() {
  return 'StringPath';
};

/** @override */
StringPath.prototype.getBoundsWorld = function() {
  // height is just a guess! Should get this info from StringShape?
  var len = this.sim_.length_;
  var height = 1;
  return new DoubleRect(0, -height, len, height);
};

/** @override */
StringPath.prototype.getIterator = function(numPoints) {
  return new StringIterator(this.sim_);
};

/** @override */
StringPath.prototype.getSequence = function () {
  return this.sim_.getSequence();
};

// ==============================================================
// ====== S T R I N G     I T E R A T O R  ==============
// ============================================================

/** This is an Adapter that forwards to {@link StringSim}.
* @param {!StringSim} sim
* @constructor
* @final
* @struct
* @implements {PathIterator}
*/
myphysicslab.sims.pde.StringIterator = function(sim) {
  /**
  * @type {!StringSim}
  * @private
  */
  this.sim_ = sim;
  /**
  * @type {number}
  * @private
  */
  this.idx_ = -1;
};
var StringIterator = myphysicslab.sims.pde.StringIterator;

/** @override */
StringIterator.prototype.nextPoint = function(point) {
  var n = this.sim_.getNumPoints();
  if (this.idx_ >=  n-1) {
    return false;
  }
  this.idx_++;
  this.sim_.getPoint(this.idx_, point);
  return true;
};

}); // goog.scope
