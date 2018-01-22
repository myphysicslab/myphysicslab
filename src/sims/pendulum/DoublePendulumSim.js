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

goog.provide('myphysicslab.sims.pendulum.DoublePendulumSim');

goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.AbstractODESim');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

const AbstractODESim = goog.module.get('myphysicslab.lab.model.AbstractODESim');
const ConcreteLine = goog.module.get('myphysicslab.lab.model.ConcreteLine');
const EnergyInfo = goog.module.get('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.module.get('myphysicslab.lab.model.EnergySystem');
var EventHandler = myphysicslab.lab.app.EventHandler;
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

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

* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {AbstractODESim}
* @implements {EnergySystem}
* @implements {EventHandler}
*/
myphysicslab.sims.pendulum.DoublePendulumSim = function(opt_name) {
  AbstractODESim.call(this, opt_name);
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  var var_names = [
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
  var i18n_names = [
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
      goog.bind(this.getRod1Length, this), goog.bind(this.setRod1Length, this)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.ROD_2_LENGTH,
      DoublePendulumSim.i18n.ROD_2_LENGTH,
      goog.bind(this.getRod2Length, this), goog.bind(this.setRod2Length, this)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.MASS_1,
      DoublePendulumSim.i18n.MASS_1,
      goog.bind(this.getMass1, this), goog.bind(this.setMass1, this)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.MASS_2,
      DoublePendulumSim.i18n.MASS_2,
      goog.bind(this.getMass2, this), goog.bind(this.setMass2, this)));
  this.addParameter(new ParameterNumber(this, DoublePendulumSim.en.GRAVITY,
      DoublePendulumSim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
};
var DoublePendulumSim = myphysicslab.sims.pendulum.DoublePendulumSim;
goog.inherits(DoublePendulumSim, AbstractODESim);

/** @override */
DoublePendulumSim.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', rod1Length_: '+Util.NF(this.rod1Length_)
      +', rod2Length_: '+Util.NF(this.rod2Length_)
      +', rod1_: '+this.rod1_
      +', rod2_: '+this.rod2_
      +', bob1_: '+this.bob1_
      +', bob2_: '+this.bob2_
      +', gravity_: '+Util.NF(this.gravity_)
      + DoublePendulumSim.superClass_.toString.call(this);
};

/** @override */
DoublePendulumSim.prototype.getClassName = function() {
  return 'DoublePendulumSim';
};

/** Sets the double pendulum to the rest state and sets the energy to zero.
* @return {undefined}
*/
DoublePendulumSim.prototype.restState = function() {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  var va = this.getVarsList();
  var vars = va.getValues();
  for (var i=0; i<4; i++) {
    vars[i] = 0;
  }
  va.setValues(vars);
  this.moveObjects(vars);
  this.setPotentialEnergy(0);
};

/** @override */
DoublePendulumSim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
DoublePendulumSim.prototype.getEnergyInfo_ = function(vars) {
  var L1 = this.rod1Length_;
  var L2 = this.rod2Length_;
  var ke = this.bob1_.getKineticEnergy() + this.bob2_.getKineticEnergy();
  // lowest point that bob1 can be is -L1, define that as zero potential energy
  // lowest point that bob2 can be is -L1 -L2
  var y1 = this.bob1_.getPosition().getY();
  var y2 = this.bob2_.getPosition().getY();
  var pe = this.gravity_ * this.bob1_.getMass()*(y1 - -L1)
         + this.gravity_ * this.bob2_.getMass()*(y2 - (-L1 -L2));
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
DoublePendulumSim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @override */
DoublePendulumSim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  // limit the pendulum angle to +/- Pi
  var theta1 = Util.limitAngle(vars[0]);
  if (theta1 != vars[0]) {
    this.getVarsList().setValue(0, theta1, /*continuous=*/false);
    vars[0] = theta1;
  }
  var theta2 = Util.limitAngle(vars[2]);
  if (theta2 != vars[2]) {
    this.getVarsList().setValue(2, theta2, /*continuous=*/false);
    vars[2] = theta2;
  }
  this.moveObjects(vars);
  // update the variables that track energy
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  var rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  vars[4] = rate[1];
  vars[5] = rate[3];
  var ei = this.getEnergyInfo_(vars);
  vars[6] = ei.getTranslational();
  vars[7] = ei.getPotential();
  vars[8] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
@param {!Array<number>} vars
@private
*/
DoublePendulumSim.prototype.moveObjects = function(vars) {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  var theta1 = vars[0];
  var sinTheta1 = Math.sin(theta1);
  var cosTheta1 = Math.cos(theta1);
  var theta2 = vars[2];
  var sinTheta2 = Math.sin(theta2);
  var cosTheta2 = Math.cos(theta2);
  var L1 = this.rod1Length_;
  var L2 = this.rod2Length_;
  var x1 = L1*sinTheta1;
  var y1 = -L1*cosTheta1;
  var x2 = x1 + L2*sinTheta2;
  var y2 = y1 - L2*cosTheta2;
  this.bob1_.setPosition(new Vector(x1,  y1));
  this.bob2_.setPosition(new Vector(x2,  y2));
  var v1x = vars[1]*L1*cosTheta1;
  var v1y = vars[1]*L1*sinTheta1;
  var v2x = v1x + vars[3]*L2*cosTheta2;
  var v2y = v1y + vars[3]*L2*sinTheta2;
  this.bob1_.setVelocity(new Vector(v1x, v1y));
  this.bob2_.setVelocity(new Vector(v2x, v2y));
  this.rod1_.setStartPoint(Vector.ORIGIN);
  this.rod1_.setEndPoint(this.bob1_.getPosition());
  this.rod2_.setStartPoint(this.bob1_.getPosition());
  this.rod2_.setEndPoint(this.bob2_.getPosition());
};

/** @override */
DoublePendulumSim.prototype.startDrag = function(simObject, location, offset, dragBody,
    mouseEvent) {
  // can't do 'live dragging' because everything is too connected!
  if (simObject == this.bob1_ || simObject == this.bob2_) {
    this.isDragging_ = true;
    return true;
  } else {
    return false;
  }
};

/** @override */
DoublePendulumSim.prototype.mouseDrag = function(simObject, location, offset,
    mouseEvent) {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  var va = this.getVarsList();
  var vars = va.getValues();
  var p = location.subtract(offset);
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
DoublePendulumSim.prototype.finishDrag = function(simObject, location, offset) {
  this.isDragging_ = false;
};

/** @override */
DoublePendulumSim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/** @override */
DoublePendulumSim.prototype.evaluate = function(vars, change, timeStep) {
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  Util.zeroArray(change);
  change[9] = 1; // time
  if (!this.isDragging_) {
    var th1 = vars[0];
    var dth1 = vars[1];
    var th2 = vars[2];
    var dth2 = vars[3];
    var m2 = this.bob2_.getMass();
    var m1 = this.bob1_.getMass();
    var L1 = this.rod1Length_;
    var L2 = this.rod2Length_;
    var g = this.gravity_;

    change[0] = dth1;

    var num = -g*(2*m1+m2)*Math.sin(th1);
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
DoublePendulumSim.prototype.getMass1 = function() {
  return this.bob1_.getMass();
};

/**
@param {number} value
*/
DoublePendulumSim.prototype.setMass1 = function(value) {
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
DoublePendulumSim.prototype.getMass2 = function() {
  return this.bob2_.getMass();
};

/**
@param {number} value
*/
DoublePendulumSim.prototype.setMass2 = function(value) {
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
DoublePendulumSim.prototype.getGravity = function() {
  return this.gravity_;
};

/**
@param {number} value
*/
DoublePendulumSim.prototype.setGravity = function(value) {
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
DoublePendulumSim.prototype.getRod1Length = function() {
  return this.rod1Length_;
};

/**
@param {number} value
*/
DoublePendulumSim.prototype.setRod1Length = function(value) {
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
DoublePendulumSim.prototype.getRod2Length = function() {
  return this.rod2Length_;
};

/**
@param {number} value
*/
DoublePendulumSim.prototype.setRod2Length = function(value) {
  this.rod2Length_ = value;
  //   0        1       2        3        4      5      6   7   8    9
  // theta1, theta1', theta2, theta2', accel1, accel2, KE, PE, TE, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6, 7, 8);
  this.broadcastParameter(DoublePendulumSim.en.ROD_2_LENGTH);
};

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
  ROD_1_LENGTH: 'Stange-1 L\u00e4nge',
  ROD_2_LENGTH: 'Stange-2 L\u00e4nge'
};

/** Set of internationalized strings.
@type {DoublePendulumSim.i18n_strings}
*/
DoublePendulumSim.i18n = goog.LOCALE === 'de' ? DoublePendulumSim.de_strings :
    DoublePendulumSim.en;

}); // goog.scope
