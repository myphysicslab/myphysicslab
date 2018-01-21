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

goog.provide('myphysicslab.sims.springs.SingleSpringSim');

goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.AbstractODESim');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var AbstractODESim = myphysicslab.lab.model.AbstractODESim;
var EnergyInfo = myphysicslab.lab.model.EnergyInfo;
var EnergySystem = myphysicslab.lab.model.EnergySystem;
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
var PointMass = myphysicslab.lab.model.PointMass;
var Spring = myphysicslab.lab.model.Spring;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Simulation of a spring-mass system.  One end of the spring is fixed, the other end
has the mass attached.

Variables and Parameters
-------------------------
Variables:

    x = position of mass, stored in vars[0]
    v = x' = velocity of mass, stored in vars[1]
    L = x - x_0 = current length of spring
    L - R = how much spring is stretched from rest length


Parameters:

    x_0 = fixed point of spring
    R = rest length of spring
    k = spring constant
    b = damping constant

The fixed point is set to a location such that the mass is at position
x=0 when the spring is at its rest length. This makes the simulation
match the differential equations shown in the corresponding web page on
the myPhysicsLab website. When spring rest length changes, we move the
fixed point so that the resting position is still x=0.


Equations of Motion
-------------------------
See also <http://www.myphysicslab.com/spring1.html>.

The spring force is `-k (L - R)`.  Damping force is `- b v`.

    F = -k (L- R) - b v
    F = -k (x - x_0 - R) - b V
    F = m a = m v'
    -k (x - x_0 - R) - b v = m v'

The equations of motion are:

    x' = v
    v' = -(k/m)(x - x_0 - R) -(b/m)v


Work from Damping
---------------------------
The work from damping is stored in `vars[3]`. We intergrate the work done by damping as
follows:

    dW = F dR  (work = force times distance)

divide by `dt`

    dW/dt = F dR/dt = F v

Since the damping force is `F = -b v` we have

    dW/dt = -b v^2.

Note that {@link #initWork} method should be called if initial conditions are modified.


@todo: bring back the display of the work from damping in DisplayEnergy, as in Java
version.

* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {AbstractODESim}
* @implements {EnergySystem}
* @implements {myphysicslab.lab.app.EventHandler}
*/
myphysicslab.sims.springs.SingleSpringSim = function(opt_name) {
  AbstractODESim.call(this, opt_name);
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  var var_names = [
    SingleSpringSim.en.POSITION,
    SingleSpringSim.en.VELOCITY,
    SingleSpringSim.en.WORK_FROM_DAMPING,
    VarsList.en.TIME,
    SingleSpringSim.en.ACCELERATION,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY
  ];
  var i18n_names = [
    SingleSpringSim.i18n.POSITION,
    SingleSpringSim.i18n.VELOCITY,
    SingleSpringSim.i18n.WORK_FROM_DAMPING,
    VarsList.i18n.TIME,
    SingleSpringSim.i18n.ACCELERATION,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(2,4,5,6,7);
  /**
  * @type {!PointMass}
  * @private
  */
  this.block_ = PointMass.makeRectangle(0.4, 0.8, 'block').setMass(0.5);
  /**
  * @type {!PointMass}
  * @private
  */
  this.fixedPoint_ = PointMass.makeSquare(0.5, 'fixed_point')
      .setMass(Util.POSITIVE_INFINITY);
  var restLength = 2.5;
  this.fixedPoint_.setPosition(new Vector(-restLength,  0));
  /**
  * @type {!Spring}
  * @private
  */
  this.spring_ = new Spring('spring',
      this.fixedPoint_, Vector.ORIGIN,
      this.block_, Vector.ORIGIN,
      /*restLength=*/restLength, /*stiffness=*/3.0);
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0.1;
  /**
  * @type {number}
  * @private
  */
  this.initialEnergy_ = 0;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /**
  * @type {boolean}
  * @private
  */
  this.isDragging = false;
  this.getVarsList().setValue(0, -2.0);
  this.initWork();
  this.saveInitialState();
  this.getSimList().add(this.block_, this.fixedPoint_, this.spring_);

  this.addParameter(new ParameterNumber(this, SingleSpringSim.en.DAMPING,
      SingleSpringSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, SingleSpringSim.en.SPRING_LENGTH,
      SingleSpringSim.i18n.SPRING_LENGTH,
      goog.bind(this.getSpringRestLength, this),
      goog.bind(this.setSpringRestLength, this)));
  this.addParameter(new ParameterNumber(this, SingleSpringSim.en.MASS,
      SingleSpringSim.i18n.MASS,
      goog.bind(this.getMass, this), goog.bind(this.setMass, this)));
  this.addParameter(new ParameterNumber(this, SingleSpringSim.en.SPRING_STIFFNESS,
      SingleSpringSim.i18n.SPRING_STIFFNESS,
      goog.bind(this.getSpringStiffness, this),
      goog.bind(this.setSpringStiffness, this)));
  this.addParameter(new ParameterNumber(this, SingleSpringSim.en.FIXED_POINT,
      SingleSpringSim.i18n.FIXED_POINT,
      goog.bind(this.getFixedPoint, this), goog.bind(this.setFixedPoint, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY));
};

var SingleSpringSim = myphysicslab.sims.springs.SingleSpringSim;
goog.inherits(SingleSpringSim, AbstractODESim);

/** @override */
SingleSpringSim.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', block_: '+this.block_
      +', fixedPoint_: '+this.fixedPoint_
      +', spring_: '+this.spring_
      +', damping_: '+Util.NF(this.damping_)
      +', initialEnergy_: '+Util.NF(this.initialEnergy_)
      + SingleSpringSim.superClass_.toString.call(this);
};

/** @override */
SingleSpringSim.prototype.getClassName = function() {
  return 'SingleSpringSim';
};

/** @override */
SingleSpringSim.prototype.reset = function() {
  SingleSpringSim.superClass_.reset.call(this);
  this.initWork();
};

/** Initializes the energy calculations, including the 'work from damping' variable;
  this should be called after changing the initial conditions of the simulation.
@return {undefined}
*/
SingleSpringSim.prototype.initWork = function() {
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  this.getVarsList().setValue(2, 0);
  this.initialEnergy_ = this.getEnergyInfo().getTotalEnergy();
};

/** @override */
SingleSpringSim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
SingleSpringSim.prototype.getEnergyInfo_ = function(vars) {
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  var ke = this.block_.getKineticEnergy();
  var pe = this.spring_.getPotentialEnergy() + this.potentialOffset_;
  var work = vars[2];
  return new EnergyInfo(pe, ke, NaN, work, this.initialEnergy_);
};

/** @override */
SingleSpringSim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @override */
SingleSpringSim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  var rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  vars[4] = rate[1]; // acceleration
  var ei = this.getEnergyInfo_(vars);
  vars[5] = ei.getTranslational();
  vars[6] = ei.getPotential();
  vars[7] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
@param {!Array<number>} vars
@private
*/
SingleSpringSim.prototype.moveObjects = function(vars) {
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  this.block_.setPosition(new Vector(vars[0],  0));
  this.block_.setVelocity(new Vector(vars[1], 0, 0));
};

/** @override */
SingleSpringSim.prototype.startDrag = function(simObject, location, offset, dragBody,
      mouseEvent) {
  if (simObject == this.block_) {
    this.isDragging = true;
    return true;
  }
  return false;
};

/** @override */
SingleSpringSim.prototype.mouseDrag = function(simObject, location, offset, mouseEvent) {
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  var va = this.getVarsList();
  if (simObject == this.block_) {
    // don't allow vertical dragging, so only set horizontal component
    var p = location.subtract(offset);
    va.setValue(0, p.getX());
    va.setValue(1, 0);
    this.initWork();
    // derived energy variables are discontinuous
    va.incrSequence(4, 5, 6, 7);
    this.moveObjects(va.getValues());
  }
};

/** @override */
SingleSpringSim.prototype.finishDrag = function(simObject, location, offset) {
  this.isDragging = false;
};

/** @override */
SingleSpringSim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/** @override */
SingleSpringSim.prototype.evaluate = function(vars, change, timeStep) {
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  Util.zeroArray(change);
  change[3] = 1.0;  // time
  if (!this.isDragging) {
    this.moveObjects(vars);
    change[0] = vars[1];
    // v' = -(k/m)(x - x_0 - R) - (b/m) v
    change[1] = (-this.spring_.getStiffness()*this.spring_.getStretch() -
        this.damping_*vars[1]) / this.block_.getMass();
    // intergrate work done by damping.
    // dW = F dR  (work = force times distance)
    // therefore dW/dt = F dR/dt = F v
    // Since the damping force is F = -b v we have dW/dt = -b v^2.
    change[2] = -this.damping_*vars[1]*vars[1];
  }
  return null;
};

/**
@return {number}
*/
SingleSpringSim.prototype.getMass = function() {
  return this.block_.getMass();
};

/**
@param {number} value
*/
SingleSpringSim.prototype.setMass = function(value) {
  this.block_.setMass(value);
  this.initWork();
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6, 7);
  this.broadcastParameter(SingleSpringSim.en.MASS);
};

/**
@return {number}
*/
SingleSpringSim.prototype.getSpringStiffness = function() {
  return this.spring_.getStiffness();
};

/**
@param {number} value
*/
SingleSpringSim.prototype.setSpringStiffness = function(value) {
  this.spring_.setStiffness(value);
  this.initWork();
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 6, 7);
  this.broadcastParameter(SingleSpringSim.en.SPRING_STIFFNESS);
};

/**
@return {number}
*/
SingleSpringSim.prototype.getSpringRestLength = function() {
  return this.spring_.getRestLength();
};

/**
@param {number} value
*/
SingleSpringSim.prototype.setSpringRestLength = function(value) {
  this.spring_.setRestLength(value);
  this.initWork();
  // 0  1   2       3     4    5   6   7
  // x, v, work, time, accel, ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 6, 7);
  this.broadcastParameter(SingleSpringSim.en.SPRING_LENGTH);
};

/**
@return {number}
*/
SingleSpringSim.prototype.getDamping = function() {
  return this.damping_;
};

/**
@param {number} value
*/
SingleSpringSim.prototype.setDamping = function(value) {
  this.damping_ = value;
  this.initWork();
  this.broadcastParameter(SingleSpringSim.en.DAMPING);
};

/**
@return {number}
*/
SingleSpringSim.prototype.getFixedPoint = function() {
  return this.fixedPoint_.getPosition().getX();
};

/**
@param {number} value
*/
SingleSpringSim.prototype.setFixedPoint = function(value) {
  this.fixedPoint_.setPosition(new Vector(value,  0));
  this.initWork();
  this.broadcastParameter(SingleSpringSim.en.FIXED_POINT);
};

/** Set of internationalized strings.
@typedef {{
  ACCELERATION: string,
  DAMPING: string,
  MASS: string,
  POSITION: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  VELOCITY: string,
  WORK_FROM_DAMPING: string,
  FIXED_POINT: string
  }}
*/
SingleSpringSim.i18n_strings;

/**
@type {SingleSpringSim.i18n_strings}
*/
SingleSpringSim.en = {
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

/**
@private
@type {SingleSpringSim.i18n_strings}
*/
SingleSpringSim.de_strings = {
  ACCELERATION: 'Beschleunigung',
  DAMPING: 'D\u00e4mpfung',
  MASS: 'Masse',
  POSITION: 'Position',
  SPRING_LENGTH: 'Federl\u00e4nge',
  SPRING_STIFFNESS: 'Federsteifheit',
  VELOCITY: 'Geschwindigkeit',
  WORK_FROM_DAMPING: 'Arbeit der D\u00e4mpfung',
  FIXED_POINT: 'Festpunkt'
};

/** Set of internationalized strings.
@type {SingleSpringSim.i18n_strings}
*/
SingleSpringSim.i18n = goog.LOCALE === 'de' ? SingleSpringSim.de_strings :
    SingleSpringSim.en;

}); // goog.scope
