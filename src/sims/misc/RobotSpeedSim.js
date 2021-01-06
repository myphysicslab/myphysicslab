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
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const Force = goog.require('myphysicslab.lab.model.Force');
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
    RobotSpeedSim.en.ENGINE_FORCE,
    RobotSpeedSim.en.GRAVITY_FORCE
  ];
  var i18n_names = [
    RobotSpeedSim.i18n.POSITION,
    RobotSpeedSim.i18n.VELOCITY,
    VarsList.i18n.TIME,
    RobotSpeedSim.i18n.RPM,
    RobotSpeedSim.i18n.ENGINE_FORCE,
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
  this.slope_ = 0;
  /** limit torque by how much wheel can push
  * @type {boolean}
  * @private
  */
  this.limitTorque_ = true;
  /** starting point of track
  * @type {!Vector}
  * @private
  */
  this.start_ = Vector.ORIGIN;
  /** Force applied at the wheel.
  * @type {number}
  * @private
  */
  this.engineForce_ = 0;
  /** Gravity force on robot, along direction of ramp.
  * @type {number}
  * @private
  */
  this.gravityRampForce_ = 0;
  /** Gravity force on robot, full downward force.
  * @type {number}
  * @private
  */
  this.gravityForce_ = 0;
  /**
  * @type {!PointMass}
  * @private
  */
  this.robot_ = PointMass.makeRectangle(0.3, 0.1, 'robot');
  /** center of mass, as percentage.  50% is midway between wheels.
  Higher percentage means closer to rear wheel.
  * @type {number}
  * @private
  */
  this.cm_pct_ = 50;
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
  /** Vector to front wheel axle, from center of mass, in body coords.
  * @type {!Vector}
  * @private
  */
  this.vwf_ = Vector.ORIGIN;
  /** Vector to rear wheel axle, from center of mass, in body coords.
  * @type {!Vector}
  * @private
  */
  this.vwr_ = Vector.ORIGIN;
  /** Normal force at front axle.
  * @type {number}
  * @private
  */
  this.Nf_ = 0;
  /** Normal force at rear axle.
  * @type {number}
  * @private
  */
  this.Nr_ = 0;
  /** coefficient of static friction
  * @type {number}
  * @private
  */
  this.friction_ = 1;

  this.getSimList().add(this.ramp_, this.robot_, this.wheelf_, this.wheelr_);

  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.MASS,
      RobotSpeedSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a))
      .setUnits(' (kg)'));
  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.DIAMETER,
      RobotSpeedSim.i18n.DIAMETER,
      () => this.getDiameter(), a => this.setDiameter(a))
      .setUnits(' (mm)'));
  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.TORQUE,
      RobotSpeedSim.i18n.TORQUE,
      () => this.getTorque(), a => this.setTorque(a))
      .setUnits(' (Nm)'));
  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.FREE_SPEED,
      RobotSpeedSim.i18n.FREE_SPEED,
      () => this.getFreeSpeed(), a => this.setFreeSpeed(a))
      .setUnits(' (RPM)'));
  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.SLOPE,
      RobotSpeedSim.i18n.SLOPE,
      () => this.getSlope(), a => this.setSlope(a))
      .setUnits(' (degrees)'));
  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.COEF_FRICTION,
      RobotSpeedSim.i18n.COEF_FRICTION,
      () => this.getFriction(), a => this.setFriction(a)));
  this.addParameter(new ParameterNumber(this, RobotSpeedSim.en.CENTER_OF_MASS,
      RobotSpeedSim.i18n.CENTER_OF_MASS,
      () => this.getCenterOfMass(), a => this.setCenterOfMass(a))
      .setUnits(' (%)'));

      //() => this.getCenterOfMass(), a => this.setCenterOfMass(a))

  this.setCenterOfMass(50);
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
reset() {
  this.Nf_ = 0;
  this.Nr_ = 0;
  this.engineForce_ = 0;
  this.gravityRampForce_ = 0;
  this.gravityForce_ = 0;
  super.reset();
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
  // Display normal force at each wheel.
  var n = new Vector(-ss, cs);
  var f = new Force('normal_f', this.wheelf_,
        this.wheelf_.getPosition(), CoordType.WORLD,
        n.multiply(0.1 * this.Nf_), CoordType.WORLD);
  // Add force to SimList, so that it can be displayed.
  // The force should disappear immediately after it is displayed.
  f.setExpireTime(this.getTime());
  this.getSimList().add(f);
  f = new Force('normal_r', this.wheelr_,
        this.wheelr_.getPosition(), CoordType.WORLD,
        n.multiply(0.1 * this.Nr_), CoordType.WORLD);
  f.setExpireTime(this.getTime());
  this.getSimList().add(f);
  // Display gravity force at center of mass
  f = new Force('gravity', this.robot_, this.robot_.getPosition(), CoordType.WORLD,
        Vector.NORTH.multiply(0.1*this.gravityForce_), CoordType.WORLD);
  f.setExpireTime(this.getTime());
  this.getSimList().add(f);
  // Display engine friction force at rear wheel
  f = new Force('engine', this.robot_, this.wheelr_.getPosition(), CoordType.WORLD,
        new Vector(cs, ss).multiply(0.1*this.engineForce_), CoordType.WORLD);
  f.setExpireTime(this.getTime());
  this.getSimList().add(f);
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
  // meter/sec (60 sec/minute) (1 rev / 2 pi r meter) = (60 / 2 pi r) rev/minute
  vars[3] = vars[1]*60 / (2*Math.PI*this.radius_);
  vars[4] = this.engineForce_;
  vars[5] = -this.gravityRampForce_;
  va.setValues(vars, /*continuous=*/true);
};

/** @override */
evaluate(vars, change, timeStep) {
  // 0  1    2     3       4          5
  // x, v, time, rpm, wheel_force, gravity
  Util.zeroArray(change);
  change[0] = vars[1];
  // Find normal force at each wheel. Nr at rear wheel, Nf at front wheel.
  this.Nr_ = this.mass_*9.81*Math.cos(this.slope_) /
             (1 - this.vwr_.getX() / this.vwf_.getX());
  this.Nf_ = - (this.vwr_.getX() / this.vwf_.getX()) * this.Nr_;
  // Motor delivers torque based on current rpm, linear relationship.
  // Find current rpm, based on wheel radius of 45 mm.
  // vars[1] is velocity in meters / second
  var rpm = vars[1]*60 / (2*Math.PI*this.radius_);
  // ultra planetary 2 cartridge (20:1). Free speed rpm = 317. Stall torque = 1.98 N m
  // equation for torque given rpm = x
  // torque (x) = (-1.98 Nm / 317 rpm) * x + 1.98 Nm
  var t = (-this.torque_/this.freeSpeed_)*rpm + this.torque_;
  // limit torque at extremes
  if (rpm < 0) {
    // or maybe zero torque when rpm is negative?
    t = this.torque_;
  } else if (rpm > this.freeSpeed_) {
    t = 0;
  }
  // torque = force x radius;  force = torque / radius
  var f = t/this.radius_;
  if (this.limitTorque_) {
    // limit force by coef static friction * normal force
    var limit = this.friction_ * this.Nr_;
    if (f > limit) {
      f = limit;
    }
  }
  this.engineForce_ = f;
  this.gravityForce_ = -this.mass_ * 9.81;
  // gravity force in direction of slope
  var g = this.gravityForce_ * Math.sin(this.slope_);
  this.gravityRampForce_ = g;
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

/**
@return {number}
*/
getFriction() {
  return this.friction_;
};

/**
@param {number} value
*/
setFriction(value) {
  this.friction_ = value;
  this.broadcastParameter(RobotSpeedSim.en.COEF_FRICTION);
};

/** Returns center of mass as percentage from rear wheel to front wheel.
99% means almost all the way to rear wheel.  1% means almost all the way to front
wheel.
@return {number} percentage between 1% and 99%
*/
getCenterOfMass() {
  return this.cm_pct_;
};

/** Sets center of mass as percentage from rear wheel to front wheel.
99% means almost all the way to rear wheel.  1% means almost all the way to front
wheel.
@param {number} value percentage between 1% and 99%
*/
setCenterOfMass(value) {
  if (value < 1 || value > 99) {
    throw 'center of gravity percentage must be > 1 and < 99, was '+value;
  }
  this.cm_pct_ = value;
  // wheels are 0.25 apart horizontally.
  // rear wheel is at x = -0.125 in body coords. Corresponds to 100%
  // front wheel is at x = 0.125 in body coords. Corresponds to 0
  this.robot_.setCenterOfMass(0.125 - (value/100)*0.25, 0);
  // Find vector from robot center of mass to each wheel, in body coords.
  var cm = this.robot_.getCenterOfMassBody();
  this.vwf_ = new Vector(0.125, -0.075).subtract(cm);
  this.vwr_ = new Vector(-0.125, -0.075).subtract(cm);
  this.broadcastParameter(RobotSpeedSim.en.CENTER_OF_MASS);
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
  ENGINE_FORCE: string,
  GRAVITY_FORCE: string,
  COEF_FRICTION: string,
  CENTER_OF_MASS: string
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
  DIAMETER: 'wheel diameter',
  ENGINE_FORCE: 'engine force',
  GRAVITY_FORCE: 'gravity force',
  COEF_FRICTION: 'coef static friction',
  CENTER_OF_MASS: 'center of mass'
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
  DIAMETER: 'Rad Durchmesser',
  ENGINE_FORCE: 'Triebkraft',
  GRAVITY_FORCE: 'Schwerkraft',
  COEF_FRICTION: 'Koeff Statisch Reibung',
  CENTER_OF_MASS: 'Zentrum der Masse'
};

/** Set of internationalized strings.
@type {RobotSpeedSim.i18n_strings}
*/
RobotSpeedSim.i18n = goog.LOCALE === 'de' ? RobotSpeedSim.de_strings :
    RobotSpeedSim.en;

exports = RobotSpeedSim;
