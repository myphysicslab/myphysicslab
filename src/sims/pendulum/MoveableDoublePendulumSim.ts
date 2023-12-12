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
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js'
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const W1 = 0;
const W1P = 1;
const W2 = 2;
const W2P = 3;
const TIME = 4;
const TOPX = 5;
const TOPXP = 6;
const TOPY = 7;
const TOPYP = 8;
const KE = 9;
const PE = 10;
const TE = 11;

/** Simulation of a double pendulum hanging from a moveable anchor point.

The anchor point or 'cart' position can be given any program of motion,
it is not affected by the pendulum movement at all.  So you could regard the cart
as a having infinite mass in comparison to the pendulums.  Or that some
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
<http://www.myphysicslab.com/Moveable-pendulum.html>.

Variables Array
-------------------------
The variables are stored in the VarsList as follows
```text
vars[0] = theta_1   angle of rod 1
vars[1] = omega_1 = theta_1'  angular velocity of rod 1
vars[2] = theta_2   angle of rod 2
vars[3] = omega_2 = theta_2'  angular velocity of rod 2
vars[4] = t  time
vars[5] = x_0  anchor X position
vars[6] = vx_0 = x_0'  anchor X velocity
vars[7] = y_0  anchor Y position
vars[8] = vy_0 = y_0'  anchor Y velocity
```

To Do
-------------------------
Make a Parameter for whether to limit angles to +/- Pi.  For some graphs you want this,
but for other graphs you don't want it.

The energy values are not correct. When the anchor is moving then energy is being added
to the pendulum. The potential energy should change from moving up and down in
gravitational field. The kinetic energy should include the motion added by the anchor.

**TO DO**  add ParameterBoolean specifying whether to limit angles to +/-Pi.

*/
export class MoveableDoublePendulumSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {
  /** length of pendulum rod 1 */
  private length1_: number = 1;
  /** length of pendulum rod 2 */
  private length2_: number = 1;
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
  private anchor_: PointMass = PointMass.makeSquare(0.3, 'anchor');
  private rod1_: ConcreteLine = new ConcreteLine('rod1');
  private rod2_: ConcreteLine = new ConcreteLine('rod2');
  private bob1_: PointMass = PointMass.makeCircle(0.2, 'bob1');
  private bob2_: PointMass = PointMass.makeCircle(0.2, 'bob2');
  /** Follows the mouse position while applying spring force to anchor */
  private mouse_: PointMass = PointMass.makeCircle(0.2, 'mouse');
  private dragSpring_: Spring = new Spring('dragSpring',
      this.mouse_, Vector.ORIGIN,
      this.anchor_, Vector.ORIGIN,
      /*restLength=*/0, /*stiffness=*/this.springStiffness_);

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  const var_names = [
    MoveableDoublePendulumSim.en.ANGLE_1,
    MoveableDoublePendulumSim.en.ANGULAR_VELOCITY_1,
    MoveableDoublePendulumSim.en.ANGLE_2,
    MoveableDoublePendulumSim.en.ANGULAR_VELOCITY_2,
    VarsList.en.TIME,
    MoveableDoublePendulumSim.en.ANCHOR_X,
    MoveableDoublePendulumSim.en.ANCHOR_X_VELOCITY,
    MoveableDoublePendulumSim.en.ANCHOR_Y,
    MoveableDoublePendulumSim.en.ANCHOR_Y_VELOCITY,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY
  ];
  const i18n_names = [
    MoveableDoublePendulumSim.i18n.ANGLE_1,
    MoveableDoublePendulumSim.i18n.ANGULAR_VELOCITY_1,
    MoveableDoublePendulumSim.i18n.ANGLE_2,
    MoveableDoublePendulumSim.i18n.ANGULAR_VELOCITY_2,
    VarsList.i18n.TIME,
    MoveableDoublePendulumSim.i18n.ANCHOR_X,
    MoveableDoublePendulumSim.i18n.ANCHOR_X_VELOCITY,
    MoveableDoublePendulumSim.i18n.ANCHOR_Y,
    MoveableDoublePendulumSim.i18n.ANCHOR_Y_VELOCITY,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(KE, PE, TE);
  this.getSimList().add(this.anchor_, this.bob1_, this.bob2_, this.rod1_, this.rod2_);
  this.getVarsList().setValue(W1, Math.PI * 0.95);
  this.anchor_.setPosition(Vector.ORIGIN);
  this.saveInitialState();
  this.setAnchorYVelocity();
  this.modifyObjects();
  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.LENGTH_1,
      MoveableDoublePendulumSim.i18n.LENGTH_1,
      () => this.getLength1(), a => this.setLength1(a)));
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.LENGTH_2,
      MoveableDoublePendulumSim.i18n.LENGTH_2,
      () => this.getLength2(), a => this.setLength2(a)));
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.DAMPING,
      MoveableDoublePendulumSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.MASS_1,
      MoveableDoublePendulumSim.i18n.MASS_1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.MASS_2,
      MoveableDoublePendulumSim.i18n.MASS_2,
      () => this.getMass2(), a => this.setMass2(a)));
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.GRAVITY,
      MoveableDoublePendulumSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(
      new ParameterNumber(this, MoveableDoublePendulumSim.en.DRIVE_AMPLITUDE,
      MoveableDoublePendulumSim.i18n.DRIVE_AMPLITUDE,
      () => this.getDriveAmplitude(),
      a => this.setDriveAmplitude(a)));
  this.addParameter(
      new ParameterNumber(this, MoveableDoublePendulumSim.en.DRIVE_FREQUENCY,
      MoveableDoublePendulumSim.i18n.DRIVE_FREQUENCY,
      () => this.getDriveFrequency(),
      a => this.setDriveFrequency(a)));
  this.addParameter(
      new ParameterNumber(this, MoveableDoublePendulumSim.en.ANCHOR_DAMPING,
      MoveableDoublePendulumSim.i18n.ANCHOR_DAMPING,
      () => this.getAnchorDamping(),
      a => this.setAnchorDamping(a)));
  this.addParameter(
      new ParameterNumber(this, MoveableDoublePendulumSim.en.SPRING_STIFFNESS,
      MoveableDoublePendulumSim.i18n.SPRING_STIFFNESS,
      () => this.getSpringStiffness(),
      a => this.setSpringStiffness(a)));
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', length1_: '+Util.NF(this.length1_)
      +', length2_: '+Util.NF(this.length2_)
      +', gravity_: '+Util.NF(this.gravity_)
      +', damping_: '+Util.NF(this.damping_)
      +', frequency_: '+Util.NF(this.frequency_)
      +', amplitude_: '+Util.NF(this.amplitude_)
      +', anchorDamping_: '+Util.NF(this.anchorDamping_)
      +', springStiffness_: '+Util.NF(this.springStiffness_)
      +', running_: '+this.running_
      +', anchor_: '+this.anchor_
      +', bob1_: '+this.bob1_
      +', bob2_: '+this.bob2_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'MoveableDoublePendulumSim';
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
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  const value = Math.abs(this.frequency_) < 1E-10 ? 0 :
      -this.amplitude_/this.frequency_;
  // calculate anchor_y velocity at time = this.initialState_[TIME]
  if (this.initialState_) {
    this.initialState_[TOPYP] = value * Math.cos(this.frequency_ * this.initialState_[TIME]);
  }
  // set value for current time
  const va = this.getVarsList();
  va.setValue(TOPYP, value * Math.cos(this.frequency_ * this.getTime()));
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const L1 = this.length1_;
  const L2 = this.length2_;
  // TO DO: This energy calc doesn't include motion from anchor moving.
  // Both kinetic and potential energy needs to be fixed.
  const ke = this.bob1_.getKineticEnergy() + this.bob2_.getKineticEnergy();
  // lowest point that bob1 can be is -L1, define that as zero potential energy
  // lowest point that bob2 can be is -L1 -L2
  const anchorY = this.anchor_.getPosition().getY();
  const y1 = this.bob1_.getPosition().getY() - anchorY;
  const y2 = this.bob2_.getPosition().getY() - anchorY;
  const pe = this.gravity_ * this.bob1_.getMass()*(y1 - -L1)
            + this.gravity_ * this.bob2_.getMass()*(y2 - (-L1 -L2));
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number) {
  this.potentialOffset_ = value;
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  // Limit the pendulum angle to +/- Pi
  // But note that you can't get a graph of angle vs. angle velocity when anchor is
  // being driven rapidly up & down and the pendulum is in a stable up position.
  // To do: make this optional with a Parameter.
  const angle1 = Util.limitAngle(vars[W1]);
  if (angle1 != vars[W1]) {
    // This also increases sequence number when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    this.getVarsList().setValue(W1, angle1, /*continuous=*/false);
    vars[W1] = angle1;
  }
  const angle2 = Util.limitAngle(vars[W2]);
  if (angle2 != vars[W2]) {
    // This also increases sequence number when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    this.getVarsList().setValue(W2, angle2, /*continuous=*/false);
    vars[W2] = angle2;
  }
  this.moveObjects(vars);
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  const ei = this.getEnergyInfo();
  va.setValue(KE, ei.getTranslational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
};

/**
@param vars
*/
private moveObjects(vars: number[]) {
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  const angle1 = vars[W1];
  const sinAngle1 = Math.sin(angle1);
  const cosAngle1 = Math.cos(angle1);
  const angle2 = vars[W2];
  const sinAngle2 = Math.sin(angle2);
  const cosAngle2 = Math.cos(angle2);
  this.anchor_.setPosition(new Vector(vars[TOPX],  vars[TOPY]));
  const L1 = this.length1_;
  const L2 = this.length2_;
  const p1 = new Vector(vars[TOPX] + L1*sinAngle1,
                      vars[TOPY] - L1*cosAngle1);
  this.bob1_.setPosition(p1);
  const p2 = new Vector(p1.getX() + L2*sinAngle2,
                      p1.getY() - L2*cosAngle2);
  this.bob2_.setPosition(p2);

  // TO DO: these velocity calcs don't include motion from anchor moving.
  // needs to be fixed.
  const v1x = vars[W1P]*L1*cosAngle1;
  const v1y = vars[W1P]*L1*sinAngle1;
  const v2x = v1x + vars[W2P]*L2*cosAngle2;
  const v2y = v1y + vars[W2P]*L2*sinAngle2;
  this.bob1_.setVelocity(new Vector(v1x, v1y));
  this.bob2_.setVelocity(new Vector(v2x, v2y));

  this.rod1_.setStartPoint(this.anchor_.getPosition());
  this.rod1_.setEndPoint(p1);
  this.rod2_.setStartPoint(p1);
  this.rod2_.setEndPoint(p2);
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
  } else if (simObject == this.bob1_ || simObject == this.bob2_) {
    // rotate pendulum to initial position; halt simulation while dragging.
    this.pendulumDragging_ = true;
    return true;
  } else {
    return false;
  }
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
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
      va.setValue(TOPX, p.getX());
      va.setValue(TOPY, p.getY());
      // Don't change the anchor velocity here... see setAnchorYVelocity()
      // Anchor velocity must be synchronized with time and driving force,
      // otherwise the anchor will start travelling up or down.
    }
  } else if (simObject == this.bob1_) {
    // only allow movement along circular arc
    const th = Math.PI/2 + Math.atan2(p.getY()-vars[TOPY], p.getX()-vars[TOPX]);
    va.setValue(W1, th);
    va.setValue(W1P, 0);
    va.setValue(W2P, 0);
  } else if (simObject == this.bob2_) {
    // only allow movement along circular arc
    const p1 = this.bob1_.getPosition();
    const th = Math.PI/2 + Math.atan2(p.getY()-p1.getY(), p.getX()-p1.getX());
    va.setValue(W2, th);
    va.setValue(W1P, 0);
    va.setValue(W2P, 0);
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
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  change[TOPX] = vars[TOPXP]; // x_0 ' = v_{x0}
  change[TOPY] = vars[TOPYP]; // y_0 ' = v_{y0}
  // v_{x0}' = -b_0 v_{x0} + k (mouse_x - x_0)
  change[TOPXP] = -this.anchorDamping_*vars[TOPXP];
  const mouse = this.mouse_.getPosition();
  if (this.springDragging_) {
    change[TOPXP] += this.springStiffness_*(mouse.getX() - vars[TOPX]);
  }
  // v_{y0}' = -b_0 v_{y0} + k (mouse_y - y_0) + A \sin(\omega t)
  change[TOPYP] = -this.anchorDamping_*vars[TOPYP] +
      this.amplitude_ * Math.sin(this.frequency_ * vars[TIME]);
  if (this.springDragging_) {
    change[TOPYP] += this.springStiffness_*(mouse.getY() - vars[TOPY]);
  }
  if (!this.pendulumDragging_) {
    const ddx0 = change[TOPXP];  // anchor x0''
    const ddy0 = change[TOPYP];  // anchor y0''
    const th1 = vars[W1];
    const dth1 = vars[W1P];
    const th2 = vars[W2];
    const dth2 = vars[W2P];
    const m2 = this.bob2_.getMass();
    const m1 = this.bob1_.getMass();
    const L1 = this.length1_;
    const L2 = this.length2_;
    const g = this.gravity_;
    const b = this.damping_;
    const b2 = this.damping_;

    change[W1] = dth1;

    change[W1P] = -((2*b*dth1 +
              ddx0*L1*(2*m1 + m2)*Math.cos(th1) -
              ddx0*L1*m2*Math.cos(th1 - 2*th2) +
              2*ddy0*L1*m1*Math.sin(th1) + 2*g*L1*m1*Math.sin(th1) +
              ddy0*L1*m2*Math.sin(th1) + g*L1*m2*Math.sin(th1) +
              ddy0*L1*m2*Math.sin(th1 - 2*th2) +
              g*L1*m2*Math.sin(th1 - 2*th2) +
              2*dth2*dth2*L1*L2*m2*Math.sin(th1 - th2) +
              dth1*dth1*L1*L1*m2*Math.sin(2*(th1 - th2))) /
            (L1*L1*(2*m1 + m2 - m2*Math.cos(2*(th1 - th2)))));

    change[W2] = dth2;

    change[W2P] = -((2*b*dth1*L2*m2*Math.cos(th1 - th2) -
            b2*(dth1 - dth2)*L1*m2*Math.cos(2*(th1 - th2)) +
            L1*(2*b2*dth1*m1 - 2*b2*dth2*m1 + b2*dth1*m2 -
               b2*dth2*m2 +
               ddx0*L2*m2*(m1 + m2)*Math.cos(2*th1 - th2) -
               ddx0*L2*m2*(m1 + m2)*Math.cos(th2) +
               2*dth1*dth1*L1*L2*m1*m2*Math.sin(th1 - th2) +
               2*dth1*dth1*L1*L2*m2*m2*Math.sin(th1 - th2) +
               dth2*dth2*L2*L2*m2*m2*Math.sin(2*(th1 - th2)) +
               ddy0*L2*m1*m2*Math.sin(2*th1 - th2) +
               g*L2*m1*m2*Math.sin(2*th1 - th2) +
               ddy0*L2*m2*m2*Math.sin(2*th1 - th2) +
               g*L2*m2*m2*Math.sin(2*th1 - th2) -
               ddy0*L2*m1*m2*Math.sin(th2) -
               g*L2*m1*m2*Math.sin(th2) -
               ddy0*L2*m2*m2*Math.sin(th2) - g*L2*m2*m2*Math.sin(th2))
            ) /
          (L1*L2*L2*m2*(-2*m1 - m2 + m2*Math.cos(2*(th1 - th2))))
          );
  }
  return null;
};

/** Return mass of pendulum bob 1.
@return mass of pendulum bob 1
*/
getMass1(): number {
  return this.bob1_.getMass();
};

/** Set mass of pendulum bob 1
@param value mass of pendulum bob 1
*/
setMass1(value: number) {
  this.bob1_.setMass(value);
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(MoveableDoublePendulumSim.en.MASS_1);
};

/** Return mass of pendulum bob 2.
@return mass of pendulum bob 2
*/
getMass2(): number {
  return this.bob2_.getMass();
};

/** Set mass of pendulum bob
@param value mass of pendulum bob
*/
setMass2(value: number) {
  this.bob2_.setMass(value);
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(MoveableDoublePendulumSim.en.MASS_2);
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
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(MoveableDoublePendulumSim.en.GRAVITY);
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
  this.broadcastParameter(MoveableDoublePendulumSim.en.DRIVE_FREQUENCY);
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
  this.broadcastParameter(MoveableDoublePendulumSim.en.DRIVE_AMPLITUDE);
};

/** Return length of pendulum rod 1
@return length of pendulum rod 1
*/
getLength1(): number {
  return this.length1_;
};

/** Set length of pendulum rod 1
@param value length of pendulum rod 1
*/
setLength1(value: number) {
  this.length1_ = value;
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(MoveableDoublePendulumSim.en.LENGTH_1);
};

/** Return length of pendulum rod 2
@return length of pendulum rod 2
*/
getLength2(): number {
  return this.length2_;
};

/** Set length of pendulum rod 2
@param value length of pendulum rod 2
*/
setLength2(value: number) {
  this.length2_ = value;
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(MoveableDoublePendulumSim.en.LENGTH_2);
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
  this.broadcastParameter(MoveableDoublePendulumSim.en.DAMPING);
};

/** Returns spring stiffness for dragging the anchor mass
@return spring stiffness for dragging the anchor mass
*/
getSpringStiffness(): number {
  return this.springStiffness_;
};

/** Sets spring stiffness for dragging the anchor mass
@param value spring stiffness for dragging the anchor mass
*/
setSpringStiffness(value: number) {
  this.springStiffness_ = value;
  this.dragSpring_.setStiffness(value);
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(MoveableDoublePendulumSim.en.SPRING_STIFFNESS);
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
  this.broadcastParameter(MoveableDoublePendulumSim.en.ANCHOR_DAMPING);
};

static readonly en: i18n_strings = {
  DRIVE_AMPLITUDE: 'drive amplitude',
  ANGLE_1: 'angle 1',
  ANGULAR_VELOCITY_1: 'angle velocity 1',
  ANGLE_2: 'angle 2',
  ANGULAR_VELOCITY_2: 'angle velocity 2',
  DAMPING: 'damping',
  DRIVE_FREQUENCY: 'drive frequency',
  GRAVITY: 'gravity',
  LENGTH_1: 'length 1',
  LENGTH_2: 'length 2',
  MASS_1: 'mass 1',
  MASS_2: 'mass 2',
  SPRING_STIFFNESS: 'spring stiffness',
  ANCHOR_DAMPING: 'anchor damping',
  ANCHOR_X: 'anchor X',
  ANCHOR_X_VELOCITY: 'anchor X velocity',
  ANCHOR_Y: 'anchor Y',
  ANCHOR_Y_VELOCITY: 'anchor Y velocity'
};

static readonly de_strings: i18n_strings = {
  DRIVE_AMPLITUDE: 'Antriebsamplitude',
  ANGLE_1: 'Winkel 1',
  ANGULAR_VELOCITY_1: 'Winkel Geschwindigkeit 1',
  ANGLE_2: 'Winkel 2',
  ANGULAR_VELOCITY_2: 'Winkel Geschwindigkeit 2',
  DAMPING: 'Dämpfung',
  DRIVE_FREQUENCY: 'Antriebsfrequenz',
  GRAVITY: 'Gravitation',
  LENGTH_1: 'Länge 1',
  LENGTH_2: 'Länge 2',
  MASS_1: 'Masse 1',
  MASS_2: 'Masse 2',
  SPRING_STIFFNESS: 'Federsteifheit',
  ANCHOR_DAMPING: 'Anker Dämpfung',
  ANCHOR_X: 'Anker X',
  ANCHOR_X_VELOCITY: 'Anker X Geschwindigkeit',
  ANCHOR_Y: 'Anker Y',
  ANCHOR_Y_VELOCITY: 'Anker Y Geschwindigkeit'
};

static readonly i18n = Util.LOCALE === 'de' ? MoveableDoublePendulumSim.de_strings : MoveableDoublePendulumSim.en;

} // end class

type i18n_strings = {
  DRIVE_AMPLITUDE: string,
  ANGLE_1: string,
  ANGULAR_VELOCITY_1: string,
  ANGLE_2: string,
  ANGULAR_VELOCITY_2: string,
  DAMPING: string,
  DRIVE_FREQUENCY: string,
  GRAVITY: string,
  LENGTH_1: string,
  LENGTH_2: string,
  MASS_1: string,
  MASS_2: string,
  SPRING_STIFFNESS: string,
  ANCHOR_DAMPING: string,
  ANCHOR_X: string,
  ANCHOR_X_VELOCITY: string,
  ANCHOR_Y: string,
  ANCHOR_Y_VELOCITY: string
};

Util.defineGlobal('sims$pendulum$MoveableDoublePendulumSim', MoveableDoublePendulumSim);
