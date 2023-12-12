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
import { AffineTransform } from '../../lab/util/AffineTransform.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js'
import { Force } from '../../lab/model/Force.js';
import { GenericObserver, Subject, ParameterNumber, SubjectEvent } from '../../lab/util/Observe.js'
import { PointMass } from '../../lab/model/PointMass.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Simulation } from '../../lab/model/Simulation.js';

const X = 0;
const V = 1;
const TIME = 2;
const RPM = 3;
const ENGINE = 4;
const GRAVITY = 5;

/** RobotSpeedSim demonstrates a robot being propelled by a motor.
*/
export class RobotSpeedSim extends AbstractODESim implements Subject, Simulation, ODESim {
  /** radius of wheel, in meters */
  private radius_: number = 0.045;
  /** Stall torque; units are N m */
  private torque_: number = 1.98;
  /** Free speed rpm. */
  private freeSpeed_: number = 317;
  /**  units are kg */
  private mass_: number = 2.5;
  /** slope of track in radians */
  private slope_: number = 0;
  /** limit torque by how much wheel can push */
  private limitTorque_: boolean = true;
  /** starting point of track */
  private start_: Vector = Vector.ORIGIN;
  /** Force applied at the wheel. */
  private engineForce_: number = 0;
  /** Gravity force on robot, along direction of ramp. */
  private gravityRampForce_: number = 0;
  /** Gravity force on robot, full downward force. */
  private gravityForce_: number = 0;
  private robot_: PointMass = PointMass.makeRectangle(0.3, 0.1, 'robot');
  /** center of mass, as percentage.  50% is midway between wheels.
  * Higher percentage means closer to rear wheel.
  */
  private cm_pct_: number = 50;
  /** front wheel */
  private wheelf_: PointMass = PointMass.makeCircle(2*this.radius_, 'wheelf');
  /** rear wheel */
  private wheelr_: PointMass = PointMass.makeCircle(2*this.radius_, 'wheelr');
  private ramp_: PointMass = PointMass.makeRectangle(7, 0.025, 'ramp');
  /** Vector to front wheel axle, from center of mass, in body coords. */
  private vwf_: Vector = Vector.ORIGIN;
  /** Vector to rear wheel axle, from center of mass, in body coords. */
  private vwr_: Vector = Vector.ORIGIN;
  /** Normal force at front axle. */
  private Nf_: number = 0;
  /** Normal force at rear axle. */
  private Nr_: number = 0;
  /** coefficient of static friction */
  private friction_: number = 1;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // 0  1    2     3       4          5
  // x, v, time, rpm, engine_force, gravity
  const var_names = [
    RobotSpeedSim.en.POSITION,
    RobotSpeedSim.en.VELOCITY,
    VarsList.en.TIME,
    RobotSpeedSim.en.RPM,
    RobotSpeedSim.en.ENGINE_FORCE,
    RobotSpeedSim.en.GRAVITY_FORCE
  ];
  const i18n_names = [
    RobotSpeedSim.i18n.POSITION,
    RobotSpeedSim.i18n.VELOCITY,
    VarsList.i18n.TIME,
    RobotSpeedSim.i18n.RPM,
    RobotSpeedSim.i18n.ENGINE_FORCE,
    RobotSpeedSim.i18n.GRAVITY_FORCE
  ];
  this.setVarsList(new VarsList(var_names, i18n_names, this.getName()+'_VARS'));
  this.getVarsList().setComputed(RPM, ENGINE, GRAVITY);

  this.getSimList().add(this.ramp_, this.robot_, this.wheelf_, this.wheelr_);

  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, RobotSpeedSim.en.MASS,
      RobotSpeedSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  pn.setUnits(' (kg)');
  this.addParameter(pn = new ParameterNumber(this, RobotSpeedSim.en.DIAMETER,
      RobotSpeedSim.i18n.DIAMETER,
      () => this.getDiameter(), a => this.setDiameter(a)));
  pn.setUnits(' (mm)');
  this.addParameter(pn = new ParameterNumber(this, RobotSpeedSim.en.TORQUE,
      RobotSpeedSim.i18n.TORQUE,
      () => this.getTorque(), a => this.setTorque(a)));
  pn.setUnits(' (Nm)');
  this.addParameter(pn = new ParameterNumber(this, RobotSpeedSim.en.FREE_SPEED,
      RobotSpeedSim.i18n.FREE_SPEED,
      () => this.getFreeSpeed(), a => this.setFreeSpeed(a)));
  pn.setUnits(' (RPM)');
  this.addParameter(pn = new ParameterNumber(this, RobotSpeedSim.en.SLOPE,
      RobotSpeedSim.i18n.SLOPE,
      () => this.getSlope(), a => this.setSlope(a)));
  pn.setUnits(' (degrees)');
  this.addParameter(pn = new ParameterNumber(this, RobotSpeedSim.en.COEF_FRICTION,
      RobotSpeedSim.i18n.COEF_FRICTION,
      () => this.getFriction(), a => this.setFriction(a)));
  this.addParameter(pn = new ParameterNumber(this, RobotSpeedSim.en.CENTER_OF_MASS,
      RobotSpeedSim.i18n.CENTER_OF_MASS,
      () => this.getCenterOfMass(), a => this.setCenterOfMass(a)));
  pn.setUnits(' (%)');
  this.setCenterOfMass(50);
  // update simulation view when parameters like ramp slope changes
  new GenericObserver(this, (_e: SubjectEvent) => this.modifyObjects());
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', mass_: '+Util.NF(this.mass_)
      +', torque_: '+Util.NF(this.torque_)
      +', freeSpeed_: '+Util.NF(this.freeSpeed_)
      +', radius_: '+Util.NF(this.radius_)
      +', slope_: '+Util.NF(this.slope_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RobotSpeedSim';
};

/** @inheritDoc */
override reset(): void {
  this.Nf_ = 0;
  this.Nr_ = 0;
  this.engineForce_ = 0;
  this.gravityRampForce_ = 0;
  this.gravityForce_ = 0;
  super.reset();
};

/** @inheritDoc */
modifyObjects(): void {
  // 0  1    2     3       4          5
  // x, v, time, rpm, engine_force, gravity
  const va = this.getVarsList();
  const vars = va.getValues();
  const p = this.map_p_to_vector(vars[X]);
  const cs = Math.cos(this.slope_);
  const ss = Math.sin(this.slope_);
  // this represents doing the rotation (about origin), then translation
  const at = new AffineTransform(cs, ss, -ss, cs, p.getX(), p.getY());
  this.robot_.setPosition(p);
  this.robot_.setAngle(this.slope_);
  // Transform wheels to position and angle of robot.
  this.wheelf_.setPosition(at.transform(this.vwf_));
  this.wheelr_.setPosition(at.transform(this.vwr_));
  // Display normal force at each wheel.
  const n = new Vector(-ss, cs);
  let f = new Force('normal_f', this.wheelf_,
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
  let a = -vars[X] / (2 * Math.PI * this.radius_);
  // ignore multiple rotations, only want fraction from 0 to 1
  a = a - Math.floor(a);
  // convert rotations to angle in radians
  a = 2 * Math.PI * a;
  this.wheelf_.setAngle(a + this.slope_);
  this.wheelr_.setAngle(a + this.slope_);
  // vector from body center to center of ramp is (2.5, -0.075 -0.045 -0.0125)
  // Measure vertical from bottom of wheel, then go half ramp height down more.
  // But we only rotate the ramp, it doesn't move with the body.
  const at2 = new AffineTransform(cs, ss, -ss, cs, 0, 0);
  this.ramp_.setPosition(at2.transform(2.5, -0.075 -this.radius_
      - 0.5*this.ramp_.getHeight()));
  this.ramp_.setAngle(this.slope_);
  // change linear velocity to rpm.  One revolution is 2 pi radius.
  // Linear velocity is in meters / second.  Change to revolutions / minute.
  // meter/sec (60 sec/minute) (1 rev / 2 pi r meter) = (60 / 2 pi r) rev/minute
  vars[RPM] = vars[V]*60 / (2*Math.PI*this.radius_);
  vars[ENGINE] = this.engineForce_;
  vars[GRAVITY] = -this.gravityRampForce_;
  va.setValues(vars, /*continuous=*/true);
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  // 0  1    2     3       4          5
  // x, v, time, rpm, engine_force, gravity
  Util.zeroArray(change);
  change[X] = vars[V];
  // Find normal force at each wheel. Nr at rear wheel, Nf at front wheel.
  this.Nr_ = this.mass_*9.81*Math.cos(this.slope_) /
             (1 - this.vwr_.getX() / this.vwf_.getX());
  this.Nf_ = - (this.vwr_.getX() / this.vwf_.getX()) * this.Nr_;
  // Motor delivers torque based on current rpm, linear relationship.
  // Find current rpm, based on wheel radius of 45 mm.
  // vars[V] is velocity in meters / second
  const rpm = vars[V]*60 / (2*Math.PI*this.radius_);
  // ultra planetary 2 cartridge (20:1). Free speed rpm = 317. Stall torque = 1.98 N m
  // equation for torque given rpm = x
  // torque (x) = (-1.98 Nm / 317 rpm) * x + 1.98 Nm
  let t = (-this.torque_/this.freeSpeed_)*rpm + this.torque_;
  // limit torque at extremes
  if (rpm < 0) {
    // or maybe zero torque when rpm is negative?
    t = this.torque_;
  } else if (rpm > this.freeSpeed_) {
    t = 0;
  }
  // torque = force x radius;  force = torque / radius
  let f = t/this.radius_;
  if (this.limitTorque_) {
    // limit force by coef static friction * normal force
    const limit = this.friction_ * this.Nr_;
    if (f > limit) {
      f = limit;
    }
  }
  this.engineForce_ = f;
  this.gravityForce_ = -this.mass_ * 9.81;
  // gravity force in direction of slope
  const g = this.gravityForce_ * Math.sin(this.slope_);
  this.gravityRampForce_ = g;
  // acceleration = force/mass
  change[V] = (f + g) / this.mass_;
  change[TIME] = 1.0;  // time
  return null;
};

/**
* @param p  position along track
* @return location of that point on track
*/
map_p_to_vector(p: number): Vector {
  const s = this.slope_;
  return this.start_.add(new Vector(p*Math.cos(s), p*Math.sin(s)));
};

/** Returns wheel diameter in mm
@return wheel diameter in mm
*/
getDiameter(): number {
  // translate radius in meters to diameter in mm
  return 2*this.radius_*1000;
};

/** Sets wheel diameter in mm.
@param value wheel diameter in mm
*/
setDiameter(value: number): void {
  // translate diameter in mm to radius in meters
  this.radius_ = value / 2000;
  this.wheelf_.setWidth(2*this.radius_);
  this.wheelf_.setHeight(2*this.radius_);
  this.wheelr_.setWidth(2*this.radius_);
  this.wheelr_.setHeight(2*this.radius_);
  this.broadcastParameter(RobotSpeedSim.en.DIAMETER);
};

/**
*/
getMass(): number {
  return this.mass_;
};

/**
@param value
*/
setMass(value: number): void {
  this.mass_ = value;
  this.broadcastParameter(RobotSpeedSim.en.MASS);
};

/**
*/
getSlope(): number {
  return 180 * this.slope_ / Math.PI;
};

/**
@param value
*/
setSlope(value: number): void {
  this.slope_ = Math.PI * value / 180;
  this.broadcastParameter(RobotSpeedSim.en.SLOPE);
};

/**
*/
getTorque(): number {
  return this.torque_;
};

/**
@param value
*/
setTorque(value: number): void {
  this.torque_ = value;
  this.broadcastParameter(RobotSpeedSim.en.TORQUE);
};

/**
*/
getFreeSpeed(): number {
  return this.freeSpeed_;
};

/**
@param value
*/
setFreeSpeed(value: number) {
  this.freeSpeed_ = value;
  this.broadcastParameter(RobotSpeedSim.en.FREE_SPEED);
};

/**
*/
getFriction(): number {
  return this.friction_;
};

/**
@param value
*/
setFriction(value: number): void {
  this.friction_ = value;
  this.broadcastParameter(RobotSpeedSim.en.COEF_FRICTION);
};

/** Returns center of mass as percentage from rear wheel to front wheel.
99% means almost all the way to rear wheel.  1% means almost all the way to front
wheel.
@return percentage between 1% and 99%
*/
getCenterOfMass(): number {
  return this.cm_pct_;
};

/** Sets center of mass as percentage from rear wheel to front wheel.
99% means almost all the way to rear wheel.  1% means almost all the way to front
wheel.
@param value percentage between 1% and 99%
*/
setCenterOfMass(value: number): void {
  if (value < 1 || value > 99) {
    throw 'center of gravity percentage must be > 1 and < 99, was '+value;
  }
  this.cm_pct_ = value;
  // wheels are 0.25 apart horizontally.
  // rear wheel is at x = -0.125 in body coords. Corresponds to 100%
  // front wheel is at x = 0.125 in body coords. Corresponds to 0
  this.robot_.setCenterOfMass(new Vector(0.125 - (value/100)*0.25, 0));
  // Find vector from robot center of mass to each wheel, in body coords.
  const cm = this.robot_.getCenterOfMass();
  this.vwf_ = new Vector(0.125, -0.075).subtract(cm);
  this.vwr_ = new Vector(-0.125, -0.075).subtract(cm);
  this.broadcastParameter(RobotSpeedSim.en.CENTER_OF_MASS);
};

static readonly en: i18n_strings = {
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

static readonly de_strings: i18n_strings = {
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

static readonly i18n = Util.LOCALE === 'de' ? RobotSpeedSim.de_strings : RobotSpeedSim.en;

} // end class

type i18n_strings = {
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
};

Util.defineGlobal('sims$misc$RobotSpeedSim', RobotSpeedSim);
