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

goog.module('myphysicslab.sims.pendulum.PendulumSim');

const AbstractODESim = goog.require('myphysicslab.lab.model.AbstractODESim');
const Arc = goog.require('myphysicslab.lab.model.Arc');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

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

* @implements {EnergySystem}
* @implements {EventHandler}
*/
class PendulumSim extends AbstractODESim {
/**
* @param {string=} opt_name name of this as a Subject
*/
constructor(opt_name) {
  super(opt_name);
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  const var_names = [
    PendulumSim.en.ANGLE,
    PendulumSim.en.ANGULAR_VELOCITY,
    VarsList.en.TIME,
    PendulumSim.en.ANGULAR_ACCEL,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY
  ];
  const i18n_names = [
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
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
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
  this.modifyObjects();
  this.saveInitialState();
  this.addParameter(new ParameterNumber(this, PendulumSim.en.LENGTH,
      PendulumSim.i18n.LENGTH,
      () => this.getLength(), a => this.setLength(a)));
  this.addParameter(new ParameterNumber(this, PendulumSim.en.DAMPING,
      PendulumSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, PendulumSim.en.MASS,
      PendulumSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, PendulumSim.en.DRIVE_AMPLITUDE,
      PendulumSim.i18n.DRIVE_AMPLITUDE,
      () => this.getDriveAmplitude(),
      a => this.setDriveAmplitude(a)));
  this.addParameter(new ParameterNumber(this, PendulumSim.en.DRIVE_FREQUENCY,
      PendulumSim.i18n.DRIVE_FREQUENCY,
      () => this.getDriveFrequency(),
      a => this.setDriveFrequency(a)));
  this.addParameter(new ParameterNumber(this, PendulumSim.en.GRAVITY,
      PendulumSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterBoolean(this, PendulumSim.en.LIMIT_ANGLE,
      PendulumSim.i18n.LIMIT_ANGLE,
      () => this.getLimitAngle(), a => this.setLimitAngle(a)));
  this.addParameter(new ParameterNumber(this, EnergySystem.en.PE_OFFSET,
      EnergySystem.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a))
      .setLowerLimit(Util.NEGATIVE_INFINITY)
      .setSignifDigits(5));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', length_: '+Util.NF(this.length_)
      +', gravity_: '+Util.NF(this.gravity_)
      +', damping_: '+Util.NF(this.damping_)
      +', frequency_: '+Util.NF(this.frequency_)
      +', amplitude_: '+Util.NF(this.amplitude_)
      +', limitAngle_: '+this.limitAngle_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      +', pivot_: '+this.pivot_
      +', rod_: '+this.rod_
      +', bob_: '+this.bob_
      + super.toString();
};

/** @override */
getClassName() {
  return 'PendulumSim';
};

/** @override */
getEnergyInfo() {
  const ke = this.bob_.getKineticEnergy();
  const y = this.bob_.getPosition().getY();
  // center of pendulum is at origin. When bob.y = -length, this is lowest it can be.
  // So PE is zero when bob.y = -length.
  const pe = this.gravity_ * this.bob_.getMass() * (y + this.length_);
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
getPEOffset() {
  return this.potentialOffset_;
}

/** @override */
setPEOffset(value) {
  this.potentialOffset_ = value;
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6);
  this.broadcastParameter(EnergySystem.en.PE_OFFSET);
};

/** @override */
modifyObjects() {
  const va = this.getVarsList();
  const vars = va.getValues();
  if (this.limitAngle_) {
    // limit the pendulum angle to +/- Pi
    const angle = Util.limitAngle(vars[0]);
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
  const rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  vars[3] = rate[1]; // angular acceleration
  const ei = this.getEnergyInfo();
  vars[4] = ei.getTranslational();
  vars[5] = ei.getPotential();
  vars[6] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
@param {!Array<number>} vars
@private
*/
moveObjects(vars) {
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  const angle = vars[0];
  const sinAngle = Math.sin(angle);
  const cosAngle = Math.cos(angle);
  // set the position of the pendulum according to the angle
  const len = this.length_;
  this.bob_.setPosition(new Vector(this.pivot_.getX() + len * sinAngle,
      this.pivot_.getY() - len * cosAngle));
  const vx = vars[1] * len * cosAngle;
  const vy = vars[1] * len * sinAngle;
  this.bob_.setVelocity(new Vector(vx, vy));
  this.rod_.setStartPoint(this.pivot_);
  this.rod_.setEndPoint(this.bob_.getPosition());

  // show the driving torque as a line circling about origin
  let t = this.frequency_ *vars[2];   // vars[2] = time
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
startDrag(simObject, location, offset, dragBody, mouseEvent) {
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
mouseDrag(simObject, location, offset, mouseEvent) {
  const va = this.getVarsList();
  const vars = va.getValues();
  if (simObject == this.bob_) {
    // only allow movement along circular arc
    // calculate angle theta given current mass position & width & origin setting, etc.
    const p = location.subtract(offset).subtract(this.pivot_);
    vars[0] = Math.PI/2 + Math.atan2(p.getY(), p.getX());
    vars[1] = 0;
    va.setValues(vars);
    this.moveObjects(vars);
    this.broadcast(new GenericEvent(this, EventHandler.MOUSE_DRAG, simObject));
  }
};

/** @override */
finishDrag(simObject, location, offset) {
  if (this.isDragging_) {
    this.isDragging_ = false;
    this.broadcast(new GenericEvent(this, EventHandler.FINISH_DRAG, simObject));
  }
};

/** @override */
handleKeyEvent(keyCode, pressed, keyEvent) {
};

/** @override */
evaluate(vars, change, timeStep) {
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  Util.zeroArray(change);
  change[2] = 1; // time
  if (!this.isDragging_) {
    // th' = v
    change[0] = vars[1];
    // v' = -(g/L) sin(th) - (b/mL^2) v + (A/mL^2) cos(k t)
    const len = this.length_;
    let dd = -(this.gravity_ / len)*Math.sin(vars[0]);
    const mlsq = this.bob_.getMass() * len * len;
    dd += -(this.damping_/mlsq) * vars[1];
    dd += (this.amplitude_/mlsq) * Math.cos(this.frequency_ * vars[2]);
    change[1] = dd;
  }
  return null;
};

/** Whether mouse drag is in progress
@return {boolean} Whether mouse drag is in progress
*/
getIsDragging() {
  return this.isDragging_;
};

/** Set whether mouse drag is in progress
@param {boolean} value whether mouse drag is in progress
*/
setIsDragging(value) {
  this.isDragging_ = value;
};

/** Return mass of pendulum bob.
@return {number} mass of pendulum bob
*/
getMass() {
  return this.bob_.getMass();
};

/** Set mass of pendulum bob
@param {number} value mass of pendulum bob
*/
setMass(value) {
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
getGravity() {
  return this.gravity_;
};

/** Set gravity strength.
@param {number} value gravity strength
*/
setGravity(value) {
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
getDriveFrequency() {
  return this.frequency_;
};

/** Set frequency of the rotating driving force
@param {number} value frequency of the rotating driving force
*/
setDriveFrequency(value) {
  this.frequency_ = value;
  this.broadcastParameter(PendulumSim.en.DRIVE_FREQUENCY);
};

/** Return amplitude of the rotating driving force
@return {number} amplitude of the rotating driving force
*/
getDriveAmplitude() {
  return this.amplitude_;
};

/** Set amplitude of the rotating driving force
@param {number} value amplitude of the rotating driving force
*/
setDriveAmplitude(value) {
  this.amplitude_ = value;
  this.drive_.setRadius(Math.min(2*this.length_, 0.5*this.amplitude_));
  this.modifyObjects();
  this.broadcastParameter(PendulumSim.en.DRIVE_AMPLITUDE);
};

/** Return length of pendulum rod
@return {number} length of pendulum rod
*/
getLength() {
  return this.length_;
};

/** Set length of pendulum rod
@param {number} value length of pendulum rod
*/
setLength(value) {
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
getLimitAngle() {
  return this.limitAngle_;
};

/** Set whether we limit the pendulum angle to +/- Pi
@param {boolean} value whether we limit the pendulum angle to +/- Pi
*/
setLimitAngle(value) {
  this.limitAngle_ = value;
  this.broadcastParameter(PendulumSim.en.LIMIT_ANGLE);
};

/** Return damping factor
@return {number} damping factor
*/
getDamping() {
  return this.damping_;
};

/** Set damping factor
@param {number} value damping factor
*/
setDamping(value) {
  this.damping_ = value;
  this.broadcastParameter(PendulumSim.en.DAMPING);
};

/** Return location of pivot point
@return {!Vector}
*/
getPivot() {
  return this.pivot_;
};

/** Set location of pivot point
@param {!Vector} value
*/
setPivot(value) {
  this.pivot_ = value;
  this.drive_.setCenter(value);
  this.modifyObjects();
};

} // end class

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
  DAMPING: 'Dämpfung',
  DRIVE_FREQUENCY: 'Antriebsfrequenz',
  GRAVITY: 'Gravitation',
  LENGTH: 'Länge',
  LIMIT_ANGLE: 'Winkel begrenzen',
  MASS: 'Masse',
  TIME: 'Zeit'
};

/** Set of internationalized strings.
@type {PendulumSim.i18n_strings}
*/
PendulumSim.i18n = goog.LOCALE === 'de' ? PendulumSim.de_strings :
    PendulumSim.en;

exports = PendulumSim;
