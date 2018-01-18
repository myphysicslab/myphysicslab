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

goog.provide('myphysicslab.sims.pendulum.PendulumSim');

goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.AbstractODESim');
goog.require('myphysicslab.lab.model.Arc');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var lab = myphysicslab.lab;

var AbstractODESim = myphysicslab.lab.model.AbstractODESim;
var Arc = lab.model.Arc;
var ConcreteLine = myphysicslab.lab.model.ConcreteLine;
var EnergyInfo = myphysicslab.lab.model.EnergyInfo;
var EnergySystem = myphysicslab.lab.model.EnergySystem;
var EventHandler = myphysicslab.lab.app.EventHandler;
const GenericEvent = goog.module.get('myphysicslab.lab.util.GenericEvent');
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
var PointMass = myphysicslab.lab.model.PointMass;
const Util = goog.module.get('myphysicslab.lab.util.Util');
var VarsList = myphysicslab.lab.model.VarsList;
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Simulation of a pendulum driven by an optional periodic torque force.

Variables and Parameters
-------------------------

The 'bob' (point mass) at the end of a massless rod is suspended from a fixed point. We
use coordinate system with `y` increasing upwards. The fixed anchor point is at the
origin.

Variables:

+ `th` = angle formed with vertical, positive is counter clockwise
+ `v` = velocity of angle `= th'`

Parameters:

+ `m` = mass of bob
+ `g` = gravity constant
+ `L` = length of rod
+ `b` = friction constant
+ `A` = amplitude of driving force
+ `k` = determines frequency of driving force

The position of the pendulum is given by `U` = position of center of mass

    Ux = L sin(th)
    Uy = -L cos(th)

We set the radius of the arc that represents the driving force to be 0.5 times the
amplitude `A`.


Equations of Motion
-------------------------

The derivation of the equations of motion is shown at

+ <http://www.myphysicslab.com/dbl_pendulum1.html> for simple pendulum (no driving
  force and no damping)

+ <http://www.myphysicslab.com/dbl_pendulum2.html> for the damped, driven pendulum.
The following summarizes the derivation shown there.

Use the rotational analog of Newton's second law:

    Sum(torques) = I a

where `I` = rotational inertia, and `a = v'` = angular acceleration.

+ Rotational inertia `I = m L^2`

+ Torque due to gravity is `-L m g sin(th)`

+ Torque due to friction is `-b v`

+ Torque due to driving force is `A cos(w)` where `A` is constant amplitude
and `w = k t` is a linear function of time.

Then `Sum(torques) = I a` becomes

    -L m g sin(th) - b v + A cos(w) = m L^2 v'

This can be rearranged to get the equations of motion (these are implemented in
{@link #evaluate}):

    th' = v
    v' = -(g / L) sin(th) -(b /m L^2) v + (A / m L^2) cos(k t)


Settings for Chaotic Pendulum
-----------------------------

Compare our equations of motion to equation 3.1 in _Chaotic Dynamics_ by Baker/Gollub
(translated to equivalent variables):

    v' = - sin(th) - v / q + A cos(k t)

The range of chaos according to Baker/Gollub is:  `q=2, 0.5<A<1.5, k=2/3.`
If we have `m = L = g = 1`, then we need:

+ L = 1.0 = rod length
+ m = 1.0 = mass
+ g = 1.0 = gravity
+ A = 1.15 = drive amplitude
+ k = 2.0/3.0 = drive frequency
+ b = 1/q = 0.5 = damping


Variables Array
-------------------------

The variables are stored in the VarsList as follows

    vars[0] = th
    vars[1] = v
    vars[2] = time
    vars[3] = th''  acceleration of angle
    vars[4] = ke, kinetic energy
    vars[5] = pe, potential energy
    vars[6] = te, total energy

@todo  add ParameterBoolean specifying whether to limit angles to +/-Pi.

* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {AbstractODESim}
* @implements {EnergySystem}
* @implements {myphysicslab.lab.app.EventHandler}
*/
myphysicslab.sims.pendulum.PendulumSim = function(opt_name) {
  AbstractODESim.call(this, opt_name);
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  var var_names = [
    PendulumSim.en.ANGLE,
    PendulumSim.en.ANGULAR_VELOCITY,
    VarsList.en.TIME,
    PendulumSim.en.ANGULAR_ACCEL,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY
  ];
  var i18n_names = [
    PendulumSim.i18n.ANGLE,
    PendulumSim.i18n.ANGULAR_VELOCITY,
    VarsList.i18n.TIME,
    PendulumSim.i18n.ANGULAR_ACCEL,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(3, 4, 5, 6);
  /** location of pivot point
  * @type {!Vector}
  * @private
  */
  this.pivot_ = Vector.ORIGIN;
  /**
  * @type {number}
  * @private
  */
  this.length_ = 1;
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 1;
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0.5;
  /** frequency of driving torque
  * @type {number}
  * @private
  */
  this.frequency_ = 2/3;
  /** amplitude of driving torque
  * @type {number}
  * @private
  */
  this.amplitude_ = 1.15;
  /** Whether to limit the pendulum angle to +/- Pi
  * @type {boolean}
  * @private
  */
  this.limitAngle_ = true;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /**
  * @type {!ConcreteLine}
  * @private
  */
  this.rod_ = new ConcreteLine('rod');
  /**
  * @type {!PointMass}
  * @private
  */
  this.bob_ = PointMass.makeCircle(0.2, 'bob').setMass(1.0);
  /** the PhysicsArc tracks the drive frequency and amplitude
  * @type {!Arc}
  * @private
  */
  this.drive_ = new Arc('drive',
              /*startAngle=*/-Math.PI/2,
              /*radius=*/0.5 * this.amplitude_,
              /*center=*/this.pivot_);
  /**
  * @type {boolean}
  * @private
  */
  this.isDragging_ = false;
  this.getSimList().add(this.rod_, this.drive_, this.bob_);
  this.getVarsList().setValue(0, 0);
  this.getVarsList().setValue(1, 0);
  this.modifyObjects();
  this.setPotentialEnergy(0);
  this.getVarsList().setValue(0, Math.PI/8);
  this.saveInitialState();
  this.addParameter(new ParameterNumber(this, PendulumSim.en.LENGTH,
      PendulumSim.i18n.LENGTH,
      goog.bind(this.getLength, this), goog.bind(this.setLength, this)));
  this.addParameter(new ParameterNumber(this, PendulumSim.en.DAMPING,
      PendulumSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, PendulumSim.en.MASS,
      PendulumSim.i18n.MASS,
      goog.bind(this.getMass, this), goog.bind(this.setMass, this)));
  this.addParameter(new ParameterNumber(this, PendulumSim.en.DRIVE_AMPLITUDE,
      PendulumSim.i18n.DRIVE_AMPLITUDE,
      goog.bind(this.getDriveAmplitude, this),
      goog.bind(this.setDriveAmplitude, this)));
  this.addParameter(new ParameterNumber(this, PendulumSim.en.DRIVE_FREQUENCY,
      PendulumSim.i18n.DRIVE_FREQUENCY,
      goog.bind(this.getDriveFrequency, this),
      goog.bind(this.setDriveFrequency, this)));
  this.addParameter(new ParameterNumber(this, PendulumSim.en.GRAVITY,
      PendulumSim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(new ParameterBoolean(this, PendulumSim.en.LIMIT_ANGLE,
      PendulumSim.i18n.LIMIT_ANGLE,
      goog.bind(this.getLimitAngle, this), goog.bind(this.setLimitAngle, this)));
};

var PendulumSim = myphysicslab.sims.pendulum.PendulumSim;
goog.inherits(PendulumSim, AbstractODESim);

/** @override */
PendulumSim.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', length_: '+Util.NF(this.length_)
      +', gravity_: '+Util.NF(this.gravity_)
      +', damping_: '+Util.NF(this.damping_)
      +', frequency_: '+Util.NF(this.frequency_)
      +', amplitude_: '+Util.NF(this.amplitude_)
      +', limitAngle_: '+this.limitAngle_
      +', pivot_: '+this.pivot_
      +', rod_: '+this.rod_
      +', bob_: '+this.bob_
      + PendulumSim.superClass_.toString.call(this);
};

/** @override */
PendulumSim.prototype.getClassName = function() {
  return 'PendulumSim';
};

/** @override */
PendulumSim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
PendulumSim.prototype.getEnergyInfo_ = function(vars) {
  var ke = this.bob_.getKineticEnergy();
  var y = this.bob_.getPosition().getY();
  var pe = this.gravity_ * this.bob_.getMass() * y;
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
PendulumSim.prototype.setPotentialEnergy = function(value) {
  this.modifyObjects();
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @override */
PendulumSim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  if (this.limitAngle_) {
    // limit the pendulum angle to +/- Pi
    var angle = Util.limitAngle(vars[0]);
    if (angle != vars[0]) {
      // This also increases sequence number when angle crosses over
      // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
      this.getVarsList().setValue(0, angle, /*continuous=*/false);
      vars[0] = angle;
    }
  }
  this.moveObjects(vars);
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  var rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  vars[3] = rate[1]; // angular acceleration
  var ei = this.getEnergyInfo_(vars);
  vars[4] = ei.getTranslational();
  vars[5] = ei.getPotential();
  vars[6] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
@param {!Array<number>} vars
@private
*/
PendulumSim.prototype.moveObjects = function(vars) {
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  var angle = vars[0];
  var sinAngle = Math.sin(angle);
  var cosAngle = Math.cos(angle);
  // set the position of the pendulum according to the angle
  var len = this.length_;
  this.bob_.setPosition(new Vector(this.pivot_.getX() + len * sinAngle,
      this.pivot_.getY() - len * cosAngle));
  var vx = vars[1] * len * cosAngle;
  var vy = vars[1] * len * sinAngle;
  this.bob_.setVelocity(new Vector(vx, vy));
  this.rod_.setStartPoint(this.pivot_);
  this.rod_.setEndPoint(this.bob_.getPosition());

  // show the driving torque as a line circling about origin
  var t = this.frequency_ *vars[2];   // vars[2] = time
  // angle is the angle from the startAngle, so from -90 to 90 degrees
  t = 180*t/Math.PI;  // convert to degrees, starting at 0
  t = t - 360 *Math.floor(t/360);  // mod 360, range is 0 to 360
  // here we generate a ramp that works as follows:
  // we want to represent cos(k t)
  // 0   90   180   270   360
  // 90   0   -90     0    90
  if ((t>=0) && (t<=180)) {
    // 0 to 180 is reversed and offset
    t = 90 - t;
  } else {
    t = t - 270;
  }
  this.drive_.setAngle(Math.PI*t/180.0);
};

/** @override */
PendulumSim.prototype.startDrag = function(simObject, location, offset, dragBody,
      mouseEvent) {
  // can't do 'live dragging' because everything is too connected!
  if (simObject == this.bob_) {
    this.isDragging_ = true;
    this.broadcast(new GenericEvent(this, EventHandler.START_DRAG, simObject));
    return true;
  } else {
    return false;
  }
};

/** @override */
PendulumSim.prototype.mouseDrag = function(simObject, location, offset, mouseEvent) {
  var va = this.getVarsList();
  var vars = va.getValues();
  if (simObject == this.bob_) {
    // only allow movement along circular arc
    // calculate angle theta given current mass position & width & origin setting, etc.
    var p = location.subtract(offset).subtract(this.pivot_);
    vars[0] = Math.PI/2 + Math.atan2(p.getY(), p.getX());
    vars[1] = 0;
    va.setValues(vars);
    this.moveObjects(vars);
    this.broadcast(new GenericEvent(this, EventHandler.MOUSE_DRAG, simObject));
  }
};

/** @override */
PendulumSim.prototype.finishDrag = function(simObject, location, offset) {
  if (this.isDragging_) {
    this.isDragging_ = false;
    this.broadcast(new GenericEvent(this, EventHandler.FINISH_DRAG, simObject));
  }
};

/** @override */
PendulumSim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/** @override */
PendulumSim.prototype.evaluate = function(vars, change, timeStep) {
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  Util.zeroArray(change);
  change[2] = 1; // time
  if (!this.isDragging_) {
    // th' = v
    change[0] = vars[1];
    // v' = -(g/L) sin(th) - (b/mL^2) v + (A/mL^2) cos(k t)
    var len = this.length_;
    var dd = -(this.gravity_ / len)*Math.sin(vars[0]);
    var mlsq = this.bob_.getMass() * len * len;
    dd += -(this.damping_/mlsq) * vars[1];
    dd += (this.amplitude_/mlsq) * Math.cos(this.frequency_ * vars[2]);
    change[1] = dd;
  }
  return null;
};

/** Whether mouse drag is in progress
@return {boolean} Whether mouse drag is in progress
*/
PendulumSim.prototype.getIsDragging = function() {
  return this.isDragging_;
};

/** Set whether mouse drag is in progress
@param {boolean} value whether mouse drag is in progress
*/
PendulumSim.prototype.setIsDragging = function(value) {
  this.isDragging_ = value;
};

/** Return mass of pendulum bob.
@return {number} mass of pendulum bob
*/
PendulumSim.prototype.getMass = function() {
  return this.bob_.getMass();
};

/** Set mass of pendulum bob
@param {number} value mass of pendulum bob
*/
PendulumSim.prototype.setMass = function(value) {
  this.bob_.setMass(value);
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6);
  this.broadcastParameter(PendulumSim.en.MASS);
};

/** Return gravity strength.
@return {number} gravity strength
*/
PendulumSim.prototype.getGravity = function() {
  return this.gravity_;
};

/** Set gravity strength.
@param {number} value gravity strength
*/
PendulumSim.prototype.setGravity = function(value) {
  this.gravity_ = value;
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6);
  this.broadcastParameter(PendulumSim.en.GRAVITY);
};

/** Return frequency of the rotating driving force
@return {number} frequency of the rotating driving force
*/
PendulumSim.prototype.getDriveFrequency = function() {
  return this.frequency_;
};

/** Set frequency of the rotating driving force
@param {number} value frequency of the rotating driving force
*/
PendulumSim.prototype.setDriveFrequency = function(value) {
  this.frequency_ = value;
  this.broadcastParameter(PendulumSim.en.DRIVE_FREQUENCY);
};

/** Return amplitude of the rotating driving force
@return {number} amplitude of the rotating driving force
*/
PendulumSim.prototype.getDriveAmplitude = function() {
  return this.amplitude_;
};

/** Set amplitude of the rotating driving force
@param {number} value amplitude of the rotating driving force
*/
PendulumSim.prototype.setDriveAmplitude = function(value) {
  this.amplitude_ = value;
  this.drive_.setRadius(Math.min(2*this.length_, 0.5*this.amplitude_));
  this.modifyObjects();
  this.broadcastParameter(PendulumSim.en.DRIVE_AMPLITUDE);
};

/** Return length of pendulum rod
@return {number} length of pendulum rod
*/
PendulumSim.prototype.getLength = function() {
  return this.length_;
};

/** Set length of pendulum rod
@param {number} value length of pendulum rod
*/
PendulumSim.prototype.setLength = function(value) {
  this.length_ = value;
  this.drive_.setRadius(Math.min(2*this.length_, 0.5*this.amplitude_));
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6);
  this.modifyObjects();
  this.broadcastParameter(PendulumSim.en.LENGTH);
};

/** Return whether we limit the pendulum angle to +/- Pi
@return {boolean} whether we limit the pendulum angle to +/- Pi
*/
PendulumSim.prototype.getLimitAngle = function() {
  return this.limitAngle_;
};

/** Set whether we limit the pendulum angle to +/- Pi
@param {boolean} value whether we limit the pendulum angle to +/- Pi
*/
PendulumSim.prototype.setLimitAngle = function(value) {
  this.limitAngle_ = value;
  this.broadcastParameter(PendulumSim.en.LIMIT_ANGLE);
};

/** Return damping factor
@return {number} damping factor
*/
PendulumSim.prototype.getDamping = function() {
  return this.damping_;
};

/** Set damping factor
@param {number} value damping factor
*/
PendulumSim.prototype.setDamping = function(value) {
  this.damping_ = value;
  this.broadcastParameter(PendulumSim.en.DAMPING);
};

/** Return location of pivot point
@return {!Vector}
*/
PendulumSim.prototype.getPivot = function() {
  return this.pivot_;
};

/** Set location of pivot point
@param {!Vector} value
*/
PendulumSim.prototype.setPivot = function(value) {
  this.pivot_ = value;
  this.drive_.setCenter(value);
  this.modifyObjects();
};

/** Set of internationalized strings.
@typedef {{
  DRIVE_AMPLITUDE: string,
  ANGLE: string,
  ANGULAR_ACCEL: string,
  ANGULAR_VELOCITY: string,
  DAMPING: string,
  DRIVE_FREQUENCY: string,
  GRAVITY: string,
  LENGTH: string,
  LIMIT_ANGLE: string,
  MASS: string,
  TIME: string
  }}
*/
PendulumSim.i18n_strings;

/**
@type {PendulumSim.i18n_strings}
*/
PendulumSim.en = {
  DRIVE_AMPLITUDE: 'drive amplitude',
  ANGLE: 'angle',
  ANGULAR_ACCEL: 'angle acceleration',
  ANGULAR_VELOCITY: 'angle velocity',
  DAMPING: 'damping',
  DRIVE_FREQUENCY: 'drive frequency',
  GRAVITY: 'gravity',
  LENGTH: 'length',
  LIMIT_ANGLE: 'limit angle',
  MASS: 'mass',
  TIME: 'time'
};

/**
@private
@type {PendulumSim.i18n_strings}
*/
PendulumSim.de_strings = {
  DRIVE_AMPLITUDE: 'Antriebsamplitude',
  ANGLE: 'Winkel',
  ANGULAR_ACCEL: 'Winkelbeschleunigung',
  ANGULAR_VELOCITY: 'Winkelgeschwindigkeit',
  DAMPING: 'D\u00e4mpfung',
  DRIVE_FREQUENCY: 'Antriebsfrequenz',
  GRAVITY: 'Gravitation',
  LENGTH: 'L\u00e4nge',
  LIMIT_ANGLE: 'Winkel begrenzen',
  MASS: 'Masse',
  TIME: 'Zeit'
};

/** Set of internationalized strings.
@type {PendulumSim.i18n_strings}
*/
PendulumSim.i18n = goog.LOCALE === 'de' ? PendulumSim.de_strings :
    PendulumSim.en;

}); // goog.scope
