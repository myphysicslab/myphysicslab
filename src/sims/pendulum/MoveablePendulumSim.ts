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
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js'
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js'
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const ANGLE = 0;
const ANGLEP = 1;
const TIME = 2;
const ANCHORX = 3;
const ANCHORXP = 4;
const ANCHORY = 5;
const ANCHORYP = 6;
const KE = 7;
const PE = 8;
const TE = 9;

/** Simulation of a pendulum hanging from a moveable anchor point.

The anchor point or 'cart' position can be given any program of motion,
it is not affected by the pendulum movement at all.  So you could regard the cart
as a having infinite mass in comparison to the pendulum.  Or that some
outside entity is applying whatever forces are needed on the cart to keep it to
the fixed program of motion.

The cart is both dragable by the mouse and/or can have a periodic
up/down motion.  With the periodic motion, this becomes a demonstration of
an 'inverted pendulum':  if the periodic motion is rapid enough, the pendulum
position pointing straight up becomes stable.

There is a parallel but independent simulation for the movement of the cart.
The cart is regarded as a point mass that is dragable by a spring force controlled
by the user's mouse.  Optionally, the periodic force moves the cart up and down.

Note that when changing the anchor amplitude or frequency, that we set the
anchor vertical velocity such that the anchor stays centered at its current
position.  Otherwise, the anchor tends to move rapidly out of view.

Derivation of equations of motion is shown at
<https://www.myphysicslab.com/Moveable-pendulum.html>.

Variables Array
-------------------------

The variables are stored in the VarsList as follows
```text
vars[0] = theta   angle of pendulum
vars[1] = omega = theta'  angular velocity
vars[2] = t  time
vars[3] = x_0  anchor X position
vars[4] = vx_0 = x_0'  anchor X velocity
vars[5] = y_0  anchor Y position
vars[6] = vy_0 = y_0'  anchor Y velocity
```

To Do
-------------------------
The energy values are not correct. When the anchor is moving then energy is being added
to the pendulum. The potential energy should change from moving up and down in
gravitational field. The kinetic energy should include the motion added by the anchor.

**TO DO**  add ParameterBoolean specifying whether to limit angles to +/-Pi.

*/
export class MoveablePendulumSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {
  /** length of pendulum rod */
  private length_: number = 1;
  private gravity_: number = 10;
  /** damping of pendulum */
  private damping_: number = 0.5;
  /** true when dragging pendulum bob */
  private pendulumDragging_: boolean = false;
  /** true when applying spring force to anchor by mouse drag */
  private springDragging_: boolean = false;
  /** damping applied to anchor */
  private anchorDamping_: number = 0.8;
  /** stiffness of spring made for dragging anchor */
  private springStiffness_: number = 3;
  /** frequency of driving force on anchor to make periodic up/down motion */
  private frequency_: number = 30;
  /** amplitude of driving force on anchor to make periodic up/down motion */
  private amplitude_: number = 200;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  /** Whether the simulation is running; determines whether mouse dragging of anchor
  * results in applying spring force or just moving the anchor directly.
  */
  private running_: boolean = false;
  private anchor_: PointMass;
  private rod_: ConcreteLine;
  private bob_: PointMass;
  /** Follows the mouse position while applying spring force to anchor */
  private mouse_: PointMass;
  private dragSpring_: Spring;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  const var_names = [
    MoveablePendulumSim.en.ANGLE,
    MoveablePendulumSim.en.ANGULAR_VELOCITY,
    VarsList.en.TIME,
    MoveablePendulumSim.en.ANCHOR_X,
    MoveablePendulumSim.en.ANCHOR_X_VELOCITY,
    MoveablePendulumSim.en.ANCHOR_Y,
    MoveablePendulumSim.en.ANCHOR_Y_VELOCITY,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY
  ];
  const i18n_names = [
    MoveablePendulumSim.i18n.ANGLE,
    MoveablePendulumSim.i18n.ANGULAR_VELOCITY,
    VarsList.i18n.TIME,
    MoveablePendulumSim.i18n.ANCHOR_X,
    MoveablePendulumSim.i18n.ANCHOR_X_VELOCITY,
    MoveablePendulumSim.i18n.ANCHOR_Y,
    MoveablePendulumSim.i18n.ANCHOR_Y_VELOCITY,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(KE, PE ,TE);
  this.anchor_ = PointMass.makeSquare(0.3, 'anchor');
  this.anchor_.setMass(1.0);
  this.anchor_.setPosition(Vector.ORIGIN);
  this.rod_ = new ConcreteLine('rod');
  this.bob_ = PointMass.makeCircle(0.2, 'bob');
  this.bob_.setMass(1);
  this.mouse_ = PointMass.makeCircle(0.2, 'mouse');
  this.mouse_.setMass(1.0);
  this.dragSpring_ = new Spring('dragSpring',
      this.mouse_, Vector.ORIGIN,
      this.anchor_, Vector.ORIGIN,
      /*restLength=*/0, /*stiffness=*/this.springStiffness_);
  this.getSimList().add(this.anchor_, this.bob_, this.rod_);
  this.getVarsList().setValue(ANGLE, Math.PI * 0.95);
  this.saveInitialState();
  this.setAnchorYVelocity();
  this.modifyObjects();
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.LENGTH,
      MoveablePendulumSim.i18n.LENGTH,
      () => this.getLength(), a => this.setLength(a)));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.DAMPING,
      MoveablePendulumSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.MASS,
      MoveablePendulumSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.GRAVITY,
      MoveablePendulumSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.DRIVE_AMPLITUDE,
      MoveablePendulumSim.i18n.DRIVE_AMPLITUDE,
      () => this.getDriveAmplitude(),
      a => this.setDriveAmplitude(a)));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.DRIVE_FREQUENCY,
      MoveablePendulumSim.i18n.DRIVE_FREQUENCY,
      () => this.getDriveFrequency(),
      a => this.setDriveFrequency(a)));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.ANCHOR_DAMPING,
      MoveablePendulumSim.i18n.ANCHOR_DAMPING,
      () => this.getAnchorDamping(),
      a => this.setAnchorDamping(a)));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.SPRING_STIFFNESS,
      MoveablePendulumSim.i18n.SPRING_STIFFNESS,
      () => this.getSpringStiffness(),
      a => this.setSpringStiffness(a)));
  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', length_: '+Util.NF(this.length_)
      +', gravity_: '+Util.NF(this.gravity_)
      +', damping_: '+Util.NF(this.damping_)
      +', frequency_: '+Util.NF(this.frequency_)
      +', amplitude_: '+Util.NF(this.amplitude_)
      +', anchorDamping_: '+Util.NF(this.anchorDamping_)
      +', springStiffness_: '+Util.NF(this.springStiffness_)
      +', anchor_: '+this.anchor_
      +', bob_: '+this.bob_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'MoveablePendulumSim';
};

/** Informs the simulation of whether the clock is running, which determines whether
mouse dragging of anchor results in applying spring force or just moving the anchor
directly.
@param value
*/
setRunning(value: boolean) {
  this.running_ = value;
};

/** Calculates anchor Y velocity, so that the anchor stays visible, as though
in a 'steady state'.  Otherwise the anchor tends to quickly wander off screen.

Derivation:
```text
y'' = a sin(frequency t)
y' = integral(y'' dt) = -(a/frequency) cos(frequency t) + C
y = integral(y' dt) = -(a/frequency^2) sin(frequency t) + C t + C_2
```
To avoid the anchor wandering need `C = 0` therefore
```text
at time t = 0, this gives y' = -(a/frequency)
```
*/
private setAnchorYVelocity(): void {
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  const value = Math.abs(this.frequency_) < 1E-10 ? 0 :
      -this.amplitude_/this.frequency_;
  // calculate anchor_y velocity at time = this.initialState_[TIME]
  if (this.initialState_) {
    this.initialState_[ANCHORYP] = value * Math.cos(this.frequency_ * this.initialState_[TIME]);
  }
  // set value for current time
  const va = this.getVarsList();
  va.setValue(ANCHORYP, value * Math.cos(this.frequency_ * this.getTime()));
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  // TO DO: This energy calc doesn't include motion from anchor moving.
  // Both kinetic and potential energy needs to be fixed.
  const ke = this.bob_.getKineticEnergy();
  const anchorY = this.anchor_.getPosition().getY();
  const y = this.bob_.getPosition().getY();
  const pe = this.gravity_ * this.bob_.getMass() *(y - anchorY + this.length_);
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number) {
  this.potentialOffset_ = value;
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  // Don't limit the pendulum angle to +/- Pi because then you can't get a graph
  // of angle vs. angle velocity when anchor is being driven rapidly up & down
  // and the pendulum is in a stable up position.
  /*const angle = Util.limitAngle(vars[ANGLE]);
  if (angle != vars[ANGLE]) {
    // This also increases sequence number when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    this.getVarsList().setValue(ANGLE, angle, false);
    vars[ANGLE] = angle;
  }*/
  this.moveObjects(vars);
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  const ei = this.getEnergyInfo();
  va.setValue(KE, ei.getTranslational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
};

/**
@param vars
*/
private moveObjects(vars: number[]) {
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  const angle = vars[ANGLE];
  const sinAngle = Math.sin(angle);
  const cosAngle = Math.cos(angle);
  this.anchor_.setPosition(new Vector(vars[ANCHORX],  vars[ANCHORY]));
  const len = this.length_;
  this.bob_.setPosition(new Vector(vars[ANCHORX] + len*sinAngle,  vars[ANCHORY] - len*cosAngle));
  // TO DO: this velocity calc doesn't include motion from anchor moving.
  // needs to be fixed.
  const vx = vars[ANGLEP] * len * cosAngle;
  const vy = vars[ANGLEP] * len * sinAngle;
  this.bob_.setVelocity(new Vector(vx, vy));
  this.rod_.setStartPoint(this.anchor_.getPosition());
  this.rod_.setEndPoint(this.bob_.getPosition());
};

/** Returns the spring used to drag the anchor mass with the mouse.
* @return the Spring used to drag the anchor
*/
getDragSpring(): Spring {
  return this.dragSpring_;
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, location: Vector, offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject == this.anchor_) {
    // Apply spring force on the anchor mass; can continue simulation while dragging.
    // But when not running, just move the anchor directly.
    this.springDragging_ = this.running_;
    if (this.springDragging_) {
      this.getSimList().add(this.dragSpring_);
    }
    this.mouseDrag(simObject, location, offset);
    return true;
  } else if (simObject == this.bob_) {
    // rotate pendulum to initial position; halt simulation while dragging.
    this.pendulumDragging_ = true;
    return true;
  } else {
    return false;
  }
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  const va = this.getVarsList();
  const vars = va.getValues();
  const p = location.subtract(offset);
  if (simObject == this.anchor_) {
    if (this.springDragging_) {
      // When running, apply spring force on the anchor mass.
      // Can continue simulation while dragging.
      this.mouse_.setPosition(location);
    } else {
      // When not running, just move the anchor directly.
      va.setValue(ANCHORX, p.getX());
      va.setValue(ANCHORY, p.getY());
      // Don't change the anchor velocity here... see setAnchorYVelocity()
      // Anchor velocity must be synchronized with time and driving force,
      // otherwise the anchor will start travelling up or down.
    }
  } else if (simObject == this.bob_) {
    // only allow movement along circular arc
    // calculate angle current bob and anchor position
    const th = Math.PI/2 + Math.atan2(p.getY()-vars[ANCHORY], p.getX()-vars[ANCHORX]);
    va.setValue(ANGLE, th);
    va.setValue(ANGLEP, 0);
  }
  this.moveObjects(va.getValues());
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  this.pendulumDragging_ = false;
  if (this.springDragging_) {
    this.springDragging_ = false;
    this.getSimList().remove(this.dragSpring_);
  }
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[TIME] = 1; // time
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  change[ANCHORX] = vars[ANCHORXP]; // x_0 ' = v_{x0}
  change[ANCHORY] = vars[ANCHORYP]; // y_0 ' = v_{y0}
  // v_{x0}' = -b_0 v_{x0} + k (mouse_x - x_0)
  change[ANCHORXP] = -this.anchorDamping_*vars[ANCHORXP];
  const mouse = this.mouse_.getPosition();
  if (this.springDragging_) {
    change[ANCHORXP] += this.springStiffness_*(mouse.getX() - vars[ANCHORX]);
  }
  // v_{y0}' = -b_0 v_{y0} + k (mouse_y - y_0) + A \sin(\omega t)
  change[ANCHORYP] = -this.anchorDamping_*vars[ANCHORYP] +
      this.amplitude_ * Math.sin(this.frequency_ * vars[TIME]);
  if (this.springDragging_) {
    change[ANCHORYP] += this.springStiffness_*(mouse.getY() - vars[ANCHORY]);
  }
  if (!this.pendulumDragging_) {
    change[ANGLE] = vars[ANGLEP];  // \theta' = \Omega
    const ddx0 = change[ANCHORXP];  // = v_{x0}' = x_0''
    const ddy0 = change[ANCHORYP];  // = v_{y0}' = y_0''
    const R = this.length_;
    let dd = -(this.gravity_/R)*Math.sin(vars[ANGLE]);
    const mRsq = this.bob_.getMass() * R * R;
    dd += -(this.damping_/mRsq) * vars[ANGLEP];
    dd += -(ddx0/R) * Math.cos(vars[ANGLE]) - (ddy0 / R) * Math.sin(vars[ANGLE]);
    // \Omega' = -\frac{\cos(\theta)}{R} v_{x0}' - \frac{\sin(\theta)}{R} v_{y0}'
    //           - \frac{b}{m R^2} \Omega - \frac{g}{R} \sin(\theta)
    change[ANGLEP] = dd;
  }
  return null;
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
setMass(value: number) {
  this.bob_.setMass(value);
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(MoveablePendulumSim.en.MASS);
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
setGravity(value: number) {
  this.gravity_ = value;
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(MoveablePendulumSim.en.GRAVITY);
};

/** Return frequency of driving force on anchor to make periodic up/down motion
@return frequency of driving force on anchor
*/
getDriveFrequency(): number {
  return this.frequency_;
};

/** Set frequency of driving force on anchor to make periodic up/down motion
@param value driving force on anchor
*/
setDriveFrequency(value: number) {
  this.frequency_ = value;
  this.setAnchorYVelocity();
  this.broadcastParameter(MoveablePendulumSim.en.DRIVE_FREQUENCY);
};

/** Return amplitude of driving force on anchor to make periodic up/down motion
@return amplitude of driving force on anchor
*/
getDriveAmplitude(): number {
  return this.amplitude_;
};

/** Set amplitude of of driving force on anchor to make periodic up/down motion
@param value amplitude of driving force on anchor
*/
setDriveAmplitude(value: number) {
  this.amplitude_ = value;
  this.setAnchorYVelocity();
  this.broadcastParameter(MoveablePendulumSim.en.DRIVE_AMPLITUDE);
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
setLength(value: number) {
  this.length_ = value;
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(MoveablePendulumSim.en.LENGTH);
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
setDamping(value: number) {
  this.damping_ = value;
  this.broadcastParameter(MoveablePendulumSim.en.DAMPING);
};

/** Returns spring stiffness
@return spring stiffness
*/
getSpringStiffness(): number {
  return this.springStiffness_;
};

/** Sets spring stiffness
@param value spring stiffness
*/
setSpringStiffness(value: number) {
  this.springStiffness_ = value;
  this.dragSpring_.setStiffness(value);
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(MoveablePendulumSim.en.SPRING_STIFFNESS);
};

/** Return anchor damping factor
@return anchor damping factor
*/
getAnchorDamping(): number {
  return this.anchorDamping_;
};

/** Set anchor damping factor
@param value anchor damping factor
*/
setAnchorDamping(value: number) {
  this.anchorDamping_ = value;
  this.broadcastParameter(MoveablePendulumSim.en.ANCHOR_DAMPING);
};

static readonly en: i18n_strings = {
  DRIVE_AMPLITUDE: 'drive amplitude',
  ANGLE: 'angle',
  ANGULAR_VELOCITY: 'angle velocity',
  DAMPING: 'damping',
  DRIVE_FREQUENCY: 'drive frequency',
  GRAVITY: 'gravity',
  LENGTH: 'length',
  MASS: 'mass',
  SPRING_STIFFNESS: 'spring stiffness',
  ANCHOR_DAMPING: 'anchor damping',
  ANCHOR_X: 'anchor X',
  ANCHOR_X_VELOCITY: 'anchor X velocity',
  ANCHOR_Y: 'anchor Y',
  ANCHOR_Y_VELOCITY: 'anchor Y velocity'
};

static readonly de_strings: i18n_strings = {
  DRIVE_AMPLITUDE: 'Antriebsamplitude',
  ANGLE: 'Winkel',
  ANGULAR_VELOCITY: 'Winkel Geschwindigkeit',
  DAMPING: 'Dämpfung',
  DRIVE_FREQUENCY: 'Antriebsfrequenz',
  GRAVITY: 'Gravitation',
  LENGTH: 'Länge',
  MASS: 'Masse',
  SPRING_STIFFNESS: 'Federsteifheit',
  ANCHOR_DAMPING: 'Anker Dämpfung',
  ANCHOR_X: 'Anker X',
  ANCHOR_X_VELOCITY: 'Anker X Geschwindigkeit',
  ANCHOR_Y: 'Anker Y',
  ANCHOR_Y_VELOCITY: 'Anker Y Geschwindigkeit'
};

static readonly i18n = Util.LOCALE === 'de' ? MoveablePendulumSim.de_strings : MoveablePendulumSim.en;

} // end class

type i18n_strings = {
  DRIVE_AMPLITUDE: string,
  ANGLE: string,
  ANGULAR_VELOCITY: string,
  DAMPING: string,
  DRIVE_FREQUENCY: string,
  GRAVITY: string,
  LENGTH: string,
  MASS: string,
  SPRING_STIFFNESS: string,
  ANCHOR_DAMPING: string,
  ANCHOR_X: string,
  ANCHOR_X_VELOCITY: string,
  ANCHOR_Y: string,
  ANCHOR_Y_VELOCITY: string
};

Util.defineGlobal('sims$pendulum$MoveablePendulumSim', MoveablePendulumSim);
