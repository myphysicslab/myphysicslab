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

goog.module('myphysicslab.sims.pendulum.DoublePendulumSim');

const AbstractODESim = goog.require('myphysicslab.lab.model.AbstractODESim');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Simulation of a double pendulum.

Variables and Parameters
-------------------------
Variables:

    th1, th2 = angles of sticks with vertical; down = 0; in radians;
               counter-clockwise is positive
    dth1, dth2 = angular velocities; first derivative with respect to time of th1, th2

Parameters:

    L1, L2 = stick lengths
    m1, m2 = masses
    g = gravity

This diagram shows how the sticks and masses are connected:

    \
     \L1
      \
       m1
       |
       |L2
       |
       m2

Equations of Motion
-------------------------
The derivation of the equations of motion is shown at
<https://www.myphysicslab.com/pendulum/double-pendulum-en.html>. See also the
[Double Pendulum Mathematica notebook](Double_Pendulum.pdf) which uses an algebra
solver to find the above equations.

            -g (2 m1 + m2) Sin[th1]
            - g m2 Sin[th1 - 2 th2]
            - 2 m2 dth2^2 L2 Sin[th1 - th2]
            - m2 dth1^2 L1 Sin[2(th1 - th2)]
    ddth1 = ------------------------------------
            L1 (2 m1 + m2 - m2 Cos[2(th1-th2)])

            2 Sin[th1-th2](
              (m1+m2) dth1^2 L1
              + g (m1+m2) Cos[th1]
              + m2 dth2^2 L2 Cos[th1-th2]
            )
    ddth2 = ------------------------------------
            L2 (2 m1 + m2 - m2 Cos[2(th1-th2)])

Variables Array
-------------------------
The variables are stored in the VarsList as follows

    vars[0] = th1
    vars[1] = th1'
    vars[2] = th2
    vars[3] = th2'
    vars[4] = th1''
    vars[5] = th2''
    vars[6] = kinetic energy
    vars[7] = potential energy
    vars[8] = total energy
    vars[9] = time

@todo  add damping force.
@todo  add ParameterBoolean specifying whether to limit angles to +/-Pi.

* @implements {EnergySystem}
* @implements {EventHandler}
*/
class DoublePendulumSim extends AbstractODESim {
/**
* @param {string=} opt_name name of this as a Subject
*/
constructor(opt_name) {
  super(opt_name);
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  const var_names = [
    DoublePendulumSim.en.ANGLE_1,
    DoublePendulumSim.en.ANGLE_1_VELOCITY,
    DoublePendulumSim.en.ANGLE_2,
    DoublePendulumSim.en.ANGLE_2_VELOCITY,
    DoublePendulumSim.en.ACCELERATION_1,
    DoublePendulumSim.en.ACCELERATION_2,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY,
    VarsList.en.TIME
  ];
  const i18n_names = [
    DoublePendulumSim.i18n.ANGLE_1,
    DoublePendulumSim.i18n.ANGLE_1_VELOCITY,
    DoublePendulumSim.i18n.ANGLE_2,
    DoublePendulumSim.i18n.ANGLE_2_VELOCITY,
    DoublePendulumSim.i18n.ACCELERATION_1,
    DoublePendulumSim.i18n.ACCELERATION_2,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(4, 5, 6, 7, 8);
  /**
  * @type {number}
  * @private
  */
  this.rod1Length_ = 1;
  /**
  * @type {number}
  * @private
  */
  this.rod2Length_ = 1;
  /**
  * @type {!ConcreteLine}
  * @private
  */
  this.rod1_ = new ConcreteLine('rod1');
  /**
  * @type {!ConcreteLine}
  * @private
  */
  this.rod2_ = new ConcreteLine('rod2');
  /**
  * @type {!PointMass}
  * @private
  */
  this.bob1_ = PointMass.makeCircle(0.2, 'bob1').setMass(2.0);
  /**
  * @type {!PointMass}
  * @private
  */
  this.bob2_ = PointMass.makeCircle(0.2, 'bob2').setMass(2.0);
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 9.8;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /**
  * @type {boolean}
  * @private
  */
  this.isDragging_ = false;
  this.getSimList().add(this.rod1_, this.rod2_, this.bob1_, this.bob2_);
  this.restState();
  this.getVarsList().setValue(0, Math.PI/8);
  this.saveInitialState();
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.ROD_1_LENGTH,
      DoublePendulumSim.i18n.ROD_1_LENGTH,
      () => this.getRod1Length(), a => this.setRod1Length(a)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.ROD_2_LENGTH,
      DoublePendulumSim.i18n.ROD_2_LENGTH,
      () => this.getRod2Length(), a => this.setRod2Length(a)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.MASS_1,
      DoublePendulumSim.i18n.MASS_1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.MASS_2,
      DoublePendulumSim.i18n.MASS_2,
      () => this.getMass2(), a => this.setMass2(a)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.GRAVITY,
      DoublePendulumSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, EnergySystem.en.PE_OFFSET,
      EnergySystem.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a))
      .setLowerLimit(Util.NEGATIVE_INFINITY)
      .setSignifDigits(5));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', rod1Length_: '+Util.NF(this.rod1Length_)
      +', rod2Length_: '+Util.NF(this.rod2Length_)
      +', rod1_: '+this.rod1_
      +', rod2_: '+this.rod2_
      +', bob1_: '+this.bob1_
      +', bob2_: '+this.bob2_
      +', gravity_: '+Util.NF(this.gravity_)
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @override */
getClassName() {
  return 'DoublePendulumSim';
};

/** Sets the double pendulum to the rest state and sets the energy to zero.
* @return {undefined}
*/
restState() {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  const va = this.getVarsList();
  const vars = va.getValues();
  for (let i=0; i<4; i++) {
    vars[i] = 0;
  }
  va.setValues(vars);
  this.moveObjects(vars);
};

/** @override */
getEnergyInfo() {
  const L1 = this.rod1Length_;
  const L2 = this.rod2Length_;
  const ke = this.bob1_.getKineticEnergy() + this.bob2_.getKineticEnergy();
  // lowest point that bob1 can be is -L1, define that as zero potential energy
  // lowest point that bob2 can be is -L1 -L2
  const y1 = this.bob1_.getPosition().getY();
  const y2 = this.bob2_.getPosition().getY();
  const pe = this.gravity_ * this.bob1_.getMass()*(y1 - -L1)
         + this.gravity_ * this.bob2_.getMass()*(y2 - (-L1 -L2));
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
getPEOffset() {
  return this.potentialOffset_;
}

/** @override */
setPEOffset(value) {
  this.potentialOffset_ = value;
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(7, 8);
  this.broadcastParameter(EnergySystem.en.PE_OFFSET);
};

/** @override */
modifyObjects() {
  const va = this.getVarsList();
  const vars = va.getValues();
  // limit the pendulum angle to +/- Pi
  const theta1 = Util.limitAngle(vars[0]);
  if (theta1 != vars[0]) {
    this.getVarsList().setValue(0, theta1, /*continuous=*/false);
    vars[0] = theta1;
  }
  const theta2 = Util.limitAngle(vars[2]);
  if (theta2 != vars[2]) {
    this.getVarsList().setValue(2, theta2, /*continuous=*/false);
    vars[2] = theta2;
  }
  this.moveObjects(vars);
  // update the variables that track energy
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  const rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  vars[4] = rate[1];
  vars[5] = rate[3];
  const ei = this.getEnergyInfo();
  vars[6] = ei.getTranslational();
  vars[7] = ei.getPotential();
  vars[8] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
@param {!Array<number>} vars
@private
*/
moveObjects(vars) {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  const theta1 = vars[0];
  const sinTheta1 = Math.sin(theta1);
  const cosTheta1 = Math.cos(theta1);
  const theta2 = vars[2];
  const sinTheta2 = Math.sin(theta2);
  const cosTheta2 = Math.cos(theta2);
  const L1 = this.rod1Length_;
  const L2 = this.rod2Length_;
  const x1 = L1*sinTheta1;
  const y1 = -L1*cosTheta1;
  const x2 = x1 + L2*sinTheta2;
  const y2 = y1 - L2*cosTheta2;
  this.bob1_.setPosition(new Vector(x1,  y1));
  this.bob2_.setPosition(new Vector(x2,  y2));
  const v1x = vars[1]*L1*cosTheta1;
  const v1y = vars[1]*L1*sinTheta1;
  const v2x = v1x + vars[3]*L2*cosTheta2;
  const v2y = v1y + vars[3]*L2*sinTheta2;
  this.bob1_.setVelocity(new Vector(v1x, v1y));
  this.bob2_.setVelocity(new Vector(v2x, v2y));
  this.rod1_.setStartPoint(Vector.ORIGIN);
  this.rod1_.setEndPoint(this.bob1_.getPosition());
  this.rod2_.setStartPoint(this.bob1_.getPosition());
  this.rod2_.setEndPoint(this.bob2_.getPosition());
};

/** @override */
startDrag(simObject, location, offset, dragBody, mouseEvent) {
  // can't do 'live dragging' because everything is too connected!
  if (simObject == this.bob1_ || simObject == this.bob2_) {
    this.isDragging_ = true;
    return true;
  } else {
    return false;
  }
};

/** @override */
mouseDrag(simObject, location, offset,
    mouseEvent) {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  const va = this.getVarsList();
  const vars = va.getValues();
  const p = location.subtract(offset);
  if (simObject == this.bob1_) {
    vars[0] = Math.atan2(p.getX(), -p.getY());
    vars[1] = 0;
    vars[3] = 0;
  } else if (simObject == this.bob2_) {
    vars[2] = Math.atan2(p.getX() - this.bob1_.getPosition().getX(),
                       -(p.getY() - this.bob1_.getPosition().getY()));
    vars[1] = 0;
    vars[3] = 0;
  }
  va.setValues(vars);
  this.moveObjects(vars);
};

/** @override */
finishDrag(simObject, location, offset) {
  this.isDragging_ = false;
};

/** @override */
handleKeyEvent(keyCode, pressed, keyEvent) {
};

/** @override */
evaluate(vars, change, timeStep) {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  Util.zeroArray(change);
  change[9] = 1; // time
  if (!this.isDragging_) {
    const th1 = vars[0];
    const dth1 = vars[1];
    const th2 = vars[2];
    const dth2 = vars[3];
    const m2 = this.bob2_.getMass();
    const m1 = this.bob1_.getMass();
    const L1 = this.rod1Length_;
    const L2 = this.rod2Length_;
    const g = this.gravity_;

    change[0] = dth1;

    let num = -g*(2*m1+m2)*Math.sin(th1);
    num = num - g*m2*Math.sin(th1-2*th2);
    num = num - 2*m2*dth2*dth2*L2*Math.sin(th1-th2);
    num = num - m2*dth1*dth1*L1*Math.sin(2*(th1-th2));
    num = num/(L1*(2*m1+m2-m2*Math.cos(2*(th1-th2))));
    change[1] = num;

    change[2] = dth2;

    num = (m1+m2)*dth1*dth1*L1;
    num = num + g*(m1+m2)*Math.cos(th1);
    num = num + m2*dth2*dth2*L2*Math.cos(th1-th2);
    num = num*2*Math.sin(th1-th2);
    num = num/(L2*(2*m1+m2-m2*Math.cos(2*(th1-th2))));
    change[3] = num;
  }
  return null;
};

/**
@return {number}
*/
getMass1() {
  return this.bob1_.getMass();
};

/**
@param {number} value
*/
setMass1(value) {
  this.bob1_.setMass(value);
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6, 7, 8);
  this.broadcastParameter(DoublePendulumSim.en.MASS_1);
};

/**
@return {number}
*/
getMass2() {
  return this.bob2_.getMass();
};

/**
@param {number} value
*/
setMass2(value) {
  this.bob2_.setMass(value);
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6, 7, 8);
  this.broadcastParameter(DoublePendulumSim.en.MASS_2);
};

/**
@return {number}
*/
getGravity() {
  return this.gravity_;
};

/**
@param {number} value
*/
setGravity(value) {
  this.gravity_ = value;
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 7, 8);
  this.broadcastParameter(DoublePendulumSim.en.GRAVITY);
};

/**
@return {number}
*/
getRod1Length() {
  return this.rod1Length_;
};

/**
@param {number} value
*/
setRod1Length(value) {
  this.rod1Length_ = value;
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6, 7, 8);
  this.broadcastParameter(DoublePendulumSim.en.ROD_1_LENGTH);
};

/**
@return {number}
*/
getRod2Length() {
  return this.rod2Length_;
};

/**
@param {number} value
*/
setRod2Length(value) {
  this.rod2Length_ = value;
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6, 7, 8);
  this.broadcastParameter(DoublePendulumSim.en.ROD_2_LENGTH);
};

} // end class

/** Set of internationalized strings.
@typedef {{
  ACCELERATION_1: string,
  ACCELERATION_2: string,
  ANGLE_1: string,
  ANGLE_1_VELOCITY: string,
  ANGLE_2: string,
  ANGLE_2_VELOCITY: string,
  GRAVITY: string,
  MASS_1: string,
  MASS_2: string,
  ROD_1_LENGTH: string,
  ROD_2_LENGTH: string
  }}
*/
DoublePendulumSim.i18n_strings;

/**
@type {DoublePendulumSim.i18n_strings}
*/
DoublePendulumSim.en = {
  ACCELERATION_1: 'acceleration-1',
  ACCELERATION_2: 'acceleration-2',
  ANGLE_1: 'angle-1',
  ANGLE_1_VELOCITY: 'angle-1 velocity',
  ANGLE_2: 'angle-2',
  ANGLE_2_VELOCITY: 'angle-2 velocity',
  GRAVITY: 'gravity',
  MASS_1: 'mass-1',
  MASS_2: 'mass-2',
  ROD_1_LENGTH: 'rod-1 length',
  ROD_2_LENGTH: 'rod-2 length'
};

/**
@private
@type {DoublePendulumSim.i18n_strings}
*/
DoublePendulumSim.de_strings = {
  ACCELERATION_1: 'Beschleunigung-1',
  ACCELERATION_2: 'Beschleunigung-2',
  ANGLE_1: 'Winkel-1',
  ANGLE_1_VELOCITY: 'Winkel-1 Geschwindigkeit',
  ANGLE_2: 'Winkel-2',
  ANGLE_2_VELOCITY: 'Winkel-2 Geschwindigkeit',
  GRAVITY: 'Gravitation',
  MASS_1: 'Masse-1',
  MASS_2: 'Masse-2',
  ROD_1_LENGTH: 'Stange-1 Länge',
  ROD_2_LENGTH: 'Stange-2 Länge'
};

/** Set of internationalized strings.
@type {DoublePendulumSim.i18n_strings}
*/
DoublePendulumSim.i18n = goog.LOCALE === 'de' ? DoublePendulumSim.de_strings :
    DoublePendulumSim.en;

exports = DoublePendulumSim;
