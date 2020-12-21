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

goog.module('myphysicslab.sims.misc.RobotSpeedSim');

const AbstractODESim = goog.require('myphysicslab.lab.model.AbstractODESim');
const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** RobotSpeedSim demonstrates a robot being propelled by a motor.
*/
class RobotSpeedSim extends AbstractODESim {

/**
* @param {string=} opt_name name of this as a Subject
*/
constructor(opt_name) {
  super(opt_name);
  // 0  1    2     3       4          5
  // x, v, time, rpm, wheel_force, gravity
  var var_names = [
    RobotSpeedSim.en.POSITION,
    RobotSpeedSim.en.VELOCITY,
    VarsList.en.TIME,
    RobotSpeedSim.en.RPM,
    RobotSpeedSim.en.WHEEL_FORCE,
    RobotSpeedSim.en.GRAVITY_FORCE
  ];
  var i18n_names = [
    RobotSpeedSim.i18n.POSITION,
    RobotSpeedSim.i18n.VELOCITY,
    VarsList.i18n.TIME,
    RobotSpeedSim.i18n.RPM,
    RobotSpeedSim.i18n.WHEEL_FORCE,
    RobotSpeedSim.i18n.GRAVITY_FORCE
  ];
  this.setVarsList(new VarsList(var_names, i18n_names, this.getName()+'_VARS'));
  this.getVarsList().setComputed(3, 4, 5);
  /** radius of wheel, in meters
  * @type {number}
  * @private
  */
  this.radius_ = 0.045;
  /** Stall torque; units are N m
  * @type {number}
  * @private
  */
  this.torque_ = 1.98;
  /** Free speed rpm.
  * @type {number}
  * @private
  */
  this.freeSpeed_ = 317;
  /**  units are kg
  * @type {number}
  * @private
  */
  this.mass_ = 2.5;
  /** slope of track in radians
  * @type {number}
  * @private
  */
  this.slope_ = 0; // Math.PI*(15/180);
  /** starting point of track
  * @type {!Vector}
  * @private
  */
  this.start_ = Vector.ORIGIN;
  /** Force applied at the wheel.
  * @type {number}
  * @private
  */
  this.force_ = 0;
  /** Gravity force on robot.
  * @type {number}
  * @private
  */
  this.gravityForce_ = 0;
  /**
  * @type {!PointMass}
  * @private
  */
  this.robot_ = PointMass.makeRectangle(0.3, 0.1, 'robot');
  this.robot_.setCenterOfMass(0.075, 0);
  /** front wheel
  * @type {!PointMass}
  * @private
  */
  this.wheelf_ = PointMass.makeCircle(2*this.radius_, 'wheelf');
  /** rear wheel
  * @type {!PointMass}
  * @private
  */
  this.wheelr_ = PointMass.makeCircle(2*this.radius_, 'wheelr');
  /**
  * @type {!PointMass}
  * @private
  */
  this.ramp_ = PointMass.makeRectangle(7, 0.025, 'ramp');
  var cg = this.robot_.getCenterOfMassBody();
  // vector from body center to wheelf is (0.125, -0.075)
  // Subtract center of mass, to be in coordinates of geometric center of robot.
  /** Vector to front wheel, from center of mass, in body coords.
  * @type {!Vector}
  * @private
  */
  this.vwf_ = new Vector(0.125, -0.075).subtract(cg);
  /** Vector to rear wheel, from center of mass, in body coords.
  * @type {!Vector}
  * @private
  */
  this.vwr_ = new Vector(-0.125, -0.075).subtract(cg);

  this.getSimList().add(this.ramp_, this.robot_, this.wheelf_, this.wheelr_);

  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.MASS,
      RobotSpeedSim.i18n.MASS,
      goog.bind(this.getMass, this), goog.bind(this.setMass, this))
      .setUnits(' (kg)'));
  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.DIAMETER,
      RobotSpeedSim.i18n.DIAMETER,
      goog.bind(this.getDiameter, this), goog.bind(this.setDiameter, this))
      .setUnits(' (mm)'));
  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.TORQUE,
      RobotSpeedSim.i18n.TORQUE,
      goog.bind(this.getTorque, this), goog.bind(this.setTorque, this))
      .setUnits(' (Nm)'));
  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.FREE_SPEED,
      RobotSpeedSim.i18n.FREE_SPEED,
      goog.bind(this.getFreeSpeed, this), goog.bind(this.setFreeSpeed, this))
      .setUnits(' (RPM)'));
  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.SLOPE,
      RobotSpeedSim.i18n.SLOPE,
      goog.bind(this.getSlope, this), goog.bind(this.setSlope, this))
      .setUnits(' (degrees)'));

};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', mass_: '+Util.NF(this.mass_)
      +', torque_: '+Util.NF(this.torque_)
      +', freeSpeed_: '+Util.NF(this.freeSpeed_)
      +', radius_: '+Util.NF(this.radius_)
      +', slope_: '+Util.NF(this.slope_)
      + super.toString();
};

/** @override */
getClassName() {
  return 'RobotSpeedSim';
};

/** @override */
modifyObjects() {
  // 0  1    2     3       4          5
  // x, v, time, rpm, wheel_force, gravity
  var va = this.getVarsList();
  var vars = va.getValues();
  var p = this.map_p_to_vector(vars[0]);
  var cs = Math.cos(this.slope_);
  var ss = Math.sin(this.slope_);
  // this represents doing the rotation (about origin), then translation
  var at = new AffineTransform(cs, ss, -ss, cs, p.getX(), p.getY());
  this.robot_.setPosition(p);
  this.robot_.setAngle(this.slope_);
  // Transform wheels to position and angle of robot.
  this.wheelf_.setPosition(at.transform(this.vwf_));
  this.wheelr_.setPosition(at.transform(this.vwr_));
  // Set angle of wheels based on distance travelled, and slope.
  // let distance travelled = x
  // the wheel rotates in opposite direction
  // rotations = -x / (2 pi r)
  var a = -vars[0] / (2 * Math.PI * this.radius_);
  // ignore multiple rotations, only want fraction from 0 to 1
  a = a - Math.floor(a);
  // convert rotations to angle in radians
  a = 2 * Math.PI * a;
  this.wheelf_.setAngle(a + this.slope_);
  this.wheelr_.setAngle(a + this.slope_);
  // vector from body center to center of ramp is (2.5, -0.075 -0.045 -0.0125)
  // Measure vertical from bottom of wheel, then go half ramp height down more.
  // But we only rotate the ramp, it doesn't move with the body.
  at = new AffineTransform(cs, ss, -ss, cs, 0, 0);
  this.ramp_.setPosition(at.transform(2.5, -0.075 -this.radius_
      - 0.5*this.ramp_.getHeight()));
  this.ramp_.setAngle(this.slope_);
  // change linear velocity to rpm.  One revolution is 2 pi radius.
  // Linear velocity is in meters / second.  Change to revolutions / minute.
  // 1 m/s = 60 m / minute = 60 m / minute * (1 rev / 2 pi r meter)
  vars[3] = vars[1]*60 / (2*Math.PI*this.radius_*100);
  vars[4] = this.force_;
  vars[5] = -this.gravityForce_;
  va.setValues(vars, /*continuous=*/true);
};

/** @override */
evaluate(vars, change, timeStep) {
  // 0  1    2     3       4          5
  // x, v, time, rpm, wheel_force, gravity
  Util.zeroArray(change);
  change[0] = vars[1];
  // Motor delivers torque based on current rpm, linear relationship.
  // Find current rpm, based on wheel radius of 45 mm.
  // vars[1] is velocity in meters / second
  var rpm = vars[1]*60 / (2*Math.PI*this.radius_);
  // ultra planetary 2 cartridge (20:1). Free speed rpm = 317. Stall torque = 1.98 N m
  // equation for torque given rpm = x
  // torque (x) = (-1.98 Nm / 317 rpm) * x + 1.98 Nm
  var t = (-this.torque_/this.freeSpeed_)*rpm + this.torque_;
  // torque = force x radius;  force = torque / radius
  var f = t/this.radius_;
  this.force_ = f;
  // gravity force because on slope
  var g = -this.mass_*9.81*Math.sin(this.slope_);
  this.gravityForce_ = g;
  // acceleration = force/mass
  change[1] = (f + g) / this.mass_;
  change[2] = 1.0;  // time
  return null;
};

/**
* @param {number} p  position along track
* @return {!Vector} location of that point on track
*/
map_p_to_vector(p) {
  var s = this.slope_;
  return this.start_.add(new Vector(p*Math.cos(s), p*Math.sin(s)));
};

/** Returns wheel diameter in mm
@return {number} wheel diameter in mm
*/
getDiameter() {
  // translate radius in meters to diameter in mm
  return 2*this.radius_*1000;
};

/** Sets wheel diameter in mm.
@param {number} value wheel diameter in mm
*/
setDiameter(value) {
  // translate diameter in mm to radius in meters
  this.radius_ = value / 2000;
  this.wheelf_.setWidth(2*this.radius_);
  this.wheelf_.setHeight(2*this.radius_);
  this.wheelr_.setWidth(2*this.radius_);
  this.wheelr_.setHeight(2*this.radius_);
  this.broadcastParameter(RobotSpeedSim.en.DIAMETER);
};

/**
@return {number}
*/
getMass() {
  return this.mass_;
};

/**
@param {number} value
*/
setMass(value) {
  this.mass_ = value;
  this.broadcastParameter(RobotSpeedSim.en.MASS);
};

/**
@return {number}
*/
getSlope() {
  return 180 * this.slope_ / Math.PI;
};

/**
@param {number} value
*/
setSlope(value) {
  this.slope_ = Math.PI * value / 180;
  this.broadcastParameter(RobotSpeedSim.en.SLOPE);
};

/**
@return {number}
*/
getTorque() {
  return this.torque_;
};

/**
@param {number} value
*/
setTorque(value) {
  this.torque_ = value;
  this.broadcastParameter(RobotSpeedSim.en.TORQUE);
};

/**
@return {number}
*/
getFreeSpeed() {
  return this.freeSpeed_;
};

/**
@param {number} value
*/
setFreeSpeed(value) {
  this.freeSpeed_ = value;
  this.broadcastParameter(RobotSpeedSim.en.FREE_SPEED);
};



} // end class

/** Set of internationalized strings.
@typedef {{
  POSITION: string,
  VELOCITY: string,
  RPM: string,
  TORQUE: string,
  FREE_SPEED: string,
  MASS: string,
  ROBOT: string,
  SLOPE: string,
  DIAMETER: string,
  WHEEL_FORCE: string,
  GRAVITY_FORCE: string
  }}
*/
RobotSpeedSim.i18n_strings;

/**
@type {RobotSpeedSim.i18n_strings}
*/
RobotSpeedSim.en = {
  POSITION: 'position',
  VELOCITY: 'velocity',
  RPM: 'RPM',
  TORQUE: 'stall torque',
  FREE_SPEED: 'free speed',
  MASS: 'mass',
  ROBOT: 'robot',
  SLOPE: 'slope',
  DIAMETER: 'diameter',
  WHEEL_FORCE: 'wheel force',
  GRAVITY_FORCE: 'gravity force'
};

/**
@private
@type {RobotSpeedSim.i18n_strings}
*/
RobotSpeedSim.de_strings = {
  POSITION: 'Position',
  VELOCITY: 'Geschwindigkeit',
  RPM: 'RPM',
  TORQUE: 'stehenbleibenes Drehmoment',
  FREE_SPEED: 'freie Geschwindigkeit',
  MASS: 'Masse',
  ROBOT: 'Roboter',
  SLOPE: 'Neigung',
  DIAMETER: 'Durchmesser',
  WHEEL_FORCE: 'Kraft am Rad',
  GRAVITY_FORCE: 'Schwerkraft'
};

/** Set of internationalized strings.
@type {RobotSpeedSim.i18n_strings}
*/
RobotSpeedSim.i18n = goog.LOCALE === 'de' ? RobotSpeedSim.de_strings :
    RobotSpeedSim.en;

exports = RobotSpeedSim;
