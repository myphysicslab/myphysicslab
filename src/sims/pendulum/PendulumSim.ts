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
import { Arc } from '../../lab/model/Arc.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js'
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js'
import { GenericEvent, ParameterBoolean, ParameterNumber }
    from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js'
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const TH = 0;
const TH_P = 1;
const TIME = 2;
const TH_PP = 3;
const KE = 4;
const PE = 5;
const TE = 6;

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
```text
Ux = L sin(th)
Uy = -L cos(th)
```
We set the radius of the arc that represents the driving force to be 0.5 times the
amplitude `A`.

Equations of Motion
-------------------------

The derivation of the equations of motion is shown at

+ <https://www.myphysicslab.com/dbl_pendulum1.html> for simple pendulum (no driving
  force and no damping)

+ <https://www.myphysicslab.com/dbl_pendulum2.html> for the damped, driven pendulum.
The following summarizes the derivation shown there.

Use the rotational analog of Newton's second law:
```text
Σ torques = I a
```
where `I` = rotational inertia, and `a = v'` = angular acceleration.

+ Rotational inertia `I = m L^2`

+ Torque due to gravity is `-L m g sin(th)`

+ Torque due to friction is `-b v`

+ Torque due to driving force is `A cos(w)` where `A` is constant amplitude
and `w = k t` is a linear function of time.

Then `Σ torques = I a` becomes
```text
-L m g sin(th) - b v + A cos(w) = m L^2 v'
```
This can be rearranged to get the equations of motion (these are implemented in
{@link evaluate}):
```text
th' = v
v' = -(g / L) sin(th) -(b /m L^2) v + (A / m L^2) cos(k t)
```

Settings for Chaotic Pendulum
-----------------------------

Compare our equations of motion to equation 3.1 in _Chaotic Dynamics_ by Baker/Gollub
(translated to equivalent variables):
```text
v' = - sin(th) - v / q + A cos(k t)
```
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
```text
vars[0] = th
vars[1] = v
vars[2] = time
vars[3] = th''  acceleration of angle
vars[4] = ke, kinetic energy
vars[5] = pe, potential energy
vars[6] = te, total energy
```

**TO DO**  add ParameterBoolean specifying whether to limit angles to +/-Pi.

*/
export class PendulumSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {
  /** location of pivot point */
  private pivot_: Vector = Vector.ORIGIN;
  private length_: number = 1;
  private gravity_: number= 1;
  private damping_: number = 0.5;
  /** frequency of driving torque */
  private frequency_: number = 2/3;
  /** amplitude of driving torque */
  private amplitude_: number = 1.15;
  /** Whether to limit the pendulum angle to +/- Pi */
  private limitAngle_: boolean = true;
  private rod_: ConcreteLine = new ConcreteLine('rod');
  private bob_: PointMass = PointMass.makeCircle(0.2, 'bob');
  /** potential energy offset */
  private potentialOffset_ = 0;
  /** the Arc tracks the drive frequency and amplitude */
  private drive_: Arc = new Arc('drive',
              /*startAngle=*/-Math.PI/2,
              /*radius=*/0.5 * this.amplitude_,
              /*center=*/this.pivot_);
  private isDragging_ = false;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  const var_names = [
    PendulumSim.en.ANGLE,
    PendulumSim.en.ANGULAR_VELOCITY,
    VarsList.en.TIME,
    PendulumSim.en.ANGULAR_ACCEL,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY
  ];
  const i18n_names = [
    PendulumSim.i18n.ANGLE,
    PendulumSim.i18n.ANGULAR_VELOCITY,
    VarsList.i18n.TIME,
    PendulumSim.i18n.ANGULAR_ACCEL,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY
  ];
  this.bob_.setMass(1.0);
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(TH_PP, KE, PE, TE);
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
  this.addParameter(new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a))
      .setLowerLimit(Number.NEGATIVE_INFINITY)
      .setSignifDigits(5));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
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

/** @inheritDoc */
getClassName() {
  return 'PendulumSim';
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const ke = this.bob_.getKineticEnergy();
  const y = this.bob_.getPosition().getY();
  // center of pendulum is at origin. When bob.y = -length, this is lowest it can be.
  // So PE is zero when bob.y = -length.
  const pe = this.gravity_ * this.bob_.getMass() * (y + this.length_);
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  if (this.limitAngle_) {
    // limit the pendulum angle to +/- Pi
    const angle = Util.limitAngle(vars[TH]);
    if (angle != vars[TH]) {
      // This also increases sequence number when angle crosses over
      // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
      this.getVarsList().setValue(0, angle, /*continuous=*/false);
      vars[TH] = angle;
    }
  }
  this.moveObjects(vars);
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  const rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  vars[TH_PP] = rate[TH_P]; // angular acceleration
  const ei = this.getEnergyInfo();
  vars[KE] = ei.getTranslational();
  vars[PE] = ei.getPotential();
  vars[TE] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

private moveObjects(vars: number[]): void {
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  const angle = vars[TH];
  const sinAngle = Math.sin(angle);
  const cosAngle = Math.cos(angle);
  // set the position of the pendulum according to the angle
  const len = this.length_;
  this.bob_.setPosition(new Vector(this.pivot_.getX() + len * sinAngle,
      this.pivot_.getY() - len * cosAngle));
  const vx = vars[TH_P] * len * cosAngle;
  const vy = vars[TH_P] * len * sinAngle;
  this.bob_.setVelocity(new Vector(vx, vy));
  this.rod_.setStartPoint(this.pivot_);
  this.rod_.setEndPoint(this.bob_.getPosition());

  // show the driving torque as a line circling about origin
  let t = this.frequency_ *vars[TIME];   // vars[TIME] = time
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

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  // can't do 'live dragging' because everything is too connected!
  if (simObject == this.bob_) {
    this.isDragging_ = true;
    this.broadcast(new GenericEvent(this, 'START_DRAG', simObject));
    return true;
  } else {
    return false;
  }
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  if (simObject == this.bob_) {
    // only allow movement along circular arc
    // calculate angle theta given current mass position & width & origin setting, etc.
    const p = location.subtract(offset).subtract(this.pivot_);
    vars[TH] = Math.PI/2 + Math.atan2(p.getY(), p.getX());
    vars[TH_P] = 0;
    va.setValues(vars);
    this.moveObjects(vars);
    this.broadcast(new GenericEvent(this, 'MOUSE_DRAG', simObject));
  }
};

/** @inheritDoc */
finishDrag(simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  if (this.isDragging_) {
    this.isDragging_ = false;
    this.broadcast(new GenericEvent(this, 'FINISH_DRAG', simObject));
  }
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  Util.zeroArray(change);
  change[TIME] = 1; // time
  if (!this.isDragging_) {
    // th' = v
    change[TH] = vars[TH_P];
    // v' = -(g/L) sin(th) - (b/mL^2) v + (A/mL^2) cos(k t)
    const len = this.length_;
    let dd = -(this.gravity_ / len)*Math.sin(vars[TH]);
    const mlsq = this.bob_.getMass() * len * len;
    dd += -(this.damping_/mlsq) * vars[TH_P];
    dd += (this.amplitude_/mlsq) * Math.cos(this.frequency_ * vars[TIME]);
    change[TH_P] = dd;
  }
  return null;
};

/** Whether mouse drag is in progress
@return Whether mouse drag is in progress
*/
getIsDragging(): boolean {
  return this.isDragging_;
};

/** Set whether mouse drag is in progress
@param value whether mouse drag is in progress
*/
setIsDragging(value: boolean): void {
  this.isDragging_ = value;
};

/** Return mass of pendulum bob.
@return mass of pendulum bob
*/
getMass(): number {
  return this.bob_.getMass();
};

/** Set mass of pendulum bob
@param value mass of pendulum bob
*/
setMass(value: number): void {
  this.bob_.setMass(value);
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(PendulumSim.en.MASS);
};

/** Return gravity strength.
@return gravity strength
*/
getGravity(): number {
  return this.gravity_;
};

/** Set gravity strength.
@param value gravity strength
*/
setGravity(value: number): void {
  this.gravity_ = value;
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(PendulumSim.en.GRAVITY);
};

/** Return frequency of the rotating driving force
@return frequency of the rotating driving force
*/
getDriveFrequency(): number {
  return this.frequency_;
};

/** Set frequency of the rotating driving force
@param value frequency of the rotating driving force
*/
setDriveFrequency(value: number): void {
  this.frequency_ = value;
  this.broadcastParameter(PendulumSim.en.DRIVE_FREQUENCY);
};

/** Return amplitude of the rotating driving force
@return amplitude of the rotating driving force
*/
getDriveAmplitude(): number {
  return this.amplitude_;
};

/** Set amplitude of the rotating driving force
@param value amplitude of the rotating driving force
*/
setDriveAmplitude(value: number): void {
  this.amplitude_ = value;
  this.drive_.setRadius(Math.min(2*this.length_, 0.5*this.amplitude_));
  this.modifyObjects();
  this.broadcastParameter(PendulumSim.en.DRIVE_AMPLITUDE);
};

/** Return length of pendulum rod
@return length of pendulum rod
*/
getLength(): number {
  return this.length_;
};

/** Set length of pendulum rod
@param value length of pendulum rod
*/
setLength(value: number): void {
  this.length_ = value;
  this.drive_.setRadius(Math.min(2*this.length_, 0.5*this.amplitude_));
  //  0       1       2    3        4   5   6
  // angle, angle', time, angle'', ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.modifyObjects();
  this.broadcastParameter(PendulumSim.en.LENGTH);
};

/** Return whether we limit the pendulum angle to +/- Pi
@return whether we limit the pendulum angle to +/- Pi
*/
getLimitAngle(): boolean {
  return this.limitAngle_;
};

/** Set whether we limit the pendulum angle to +/- Pi
@param value whether we limit the pendulum angle to +/- Pi
*/
setLimitAngle(value: boolean): void {
  this.limitAngle_ = value;
  this.broadcastParameter(PendulumSim.en.LIMIT_ANGLE);
};

/** Return damping factor
@return damping factor
*/
getDamping(): number {
  return this.damping_;
};

/** Set damping factor
@param value damping factor
*/
setDamping(value: number): void {
  this.damping_ = value;
  this.broadcastParameter(PendulumSim.en.DAMPING);
};

/** Return location of pivot point
*/
getPivot(): Vector {
  return this.pivot_;
};

/** Set location of pivot point
@param value
*/
setPivot(value: Vector): void {
  this.pivot_ = value;
  this.drive_.setCenter(value);
  this.modifyObjects();
};

static readonly en: i18n_strings = {
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

static readonly de_strings: i18n_strings = {
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

static readonly i18n = Util.LOCALE === 'de' ? PendulumSim.de_strings : PendulumSim.en;

} // end class

type i18n_strings = {
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
};

Util.defineGlobal('sims$pendulum$PendulumSim', PendulumSim);
