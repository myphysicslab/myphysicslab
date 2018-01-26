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

goog.module('myphysicslab.sims.springs.Double2DSpringSim');

const AbstractODESim = goog.require('myphysicslab.lab.model.AbstractODESim');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Simulation showing 2 springs and 2 masses hanging below a moveable top anchor mass.
The top anchor mass is moveable by the user, but is not influenced by the springs or
gravity.

Variables and Parameters
-------------------------
Variables:

    U = position of center of bob
    V = velocity of bob
    th = angle formed with vertical, positive is counter clockwise
    L = displacement of spring from rest length

Parameters:

    T = position of top anchor mass
    R = rest length
    k = spring constant
    g = gravity
    b = damping constant
    m = mass of bob

Equations of Motion
-------------------------
See also <http://www.myphysicslab.com/dbl_spring2d.html>.

    F1x = -k1 L1 sin(th1) + k2 L2 sin(th2) - b1 V1x = m1 V1x'
    F1y = -m1 g + k1 L1 cos(th1) - k2 L2 cos(th2) - b1 V1y = m1 V1y'
    F2x = -k2 L2 sin(th2) - b2 V2x = m2 V2x'
    F2y = -m2 g + k2 L2 cos(th2) - b2 V2y = m2 V2y'
    xx1 = U1x - Tx
    yy1 = U1y - Ty
    len1 = Sqrt(xx1^2 + yy1^2)
    L1 = len1 - R1
    th1 = atan(xx1 / yy1)
    cos(th1) = -yy1 / len1
    sin(th1) = xx1 / len1
    xx2 = U2x - U1x
    yy2 = U2y - U1y
    len2 = sqrt(xx2^2 + yy2^2)
    L2 = len2 - R2
    cos(th2) = -yy2 / len2
    sin(th2) = xx2 / len2

Variables Array
-------------------------
The variables are stored in the VarsList as follows

    vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
    i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13

where KE = kinetic energy, PE = potential energy, TE = total energy

@todo  draw a number on each mass, either 1 or 2, to make it easier to understand
the parameter names.

* @implements {EnergySystem}
* @implements {EventHandler}
*/
class Double2DSpringSim extends AbstractODESim {
/**
* @param {string=} opt_name name of this as a Subject
*/
constructor(opt_name) {
  super(opt_name);
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  var var_names = [
    Double2DSpringSim.en.X_POSITION+'-1',
    Double2DSpringSim.en.Y_POSITION+'-1',
    Double2DSpringSim.en.X_POSITION+'-2',
    Double2DSpringSim.en.Y_POSITION+'-2',
    Double2DSpringSim.en.X_VELOCITY+'-1',
    Double2DSpringSim.en.Y_VELOCITY+'-1',
    Double2DSpringSim.en.X_VELOCITY+'-2',
    Double2DSpringSim.en.Y_VELOCITY+'-2',
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY,
    VarsList.en.TIME,
    Double2DSpringSim.en.ANCHOR_X,
    Double2DSpringSim.en.ANCHOR_Y
  ];
  var i18n_names = [
    Double2DSpringSim.i18n.X_POSITION+'-1',
    Double2DSpringSim.i18n.Y_POSITION+'-1',
    Double2DSpringSim.i18n.X_POSITION+'-2',
    Double2DSpringSim.i18n.Y_POSITION+'-2',
    Double2DSpringSim.i18n.X_VELOCITY+'-1',
    Double2DSpringSim.i18n.Y_VELOCITY+'-1',
    Double2DSpringSim.i18n.X_VELOCITY+'-2',
    Double2DSpringSim.i18n.Y_VELOCITY+'-2',
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME,
    Double2DSpringSim.i18n.ANCHOR_X,
    Double2DSpringSim.i18n.ANCHOR_Y
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(8, 9, 10);
  /** the block being dragged, or -1 when no drag is happening
  * @type {number}
  * @private
  */
  this.dragBlock_ = -1;
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 9.8;
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /**
  * @type {!PointMass}
  * @private
  */
  this.topMass_ = PointMass.makeSquare(0.5, 'top');
  this.topMass_.setPosition(new Vector(0, 2));
  /**
  * @type {!PointMass}
  * @private
  */
  this.bob1_ = PointMass.makeCircle(0.5, 'bob1').setMass(0.5);
  /**
  * @type {!PointMass}
  * @private
  */
  this.bob2_ = PointMass.makeCircle(0.5, 'bob2').setMass(0.5);
  /**
  * @type {!Spring}
  * @private
  */
  this.spring1_ = new Spring('spring1',
      this.topMass_, Vector.ORIGIN,
      this.bob1_, Vector.ORIGIN,
      /*restLength=*/1.0, /*stiffness=*/6.0);
  /**
  * @type {!Spring}
  * @private
  */
  this.spring2_ = new Spring('spring2',
      this.bob1_, Vector.ORIGIN,
      this.bob2_, Vector.ORIGIN,
      /*restLength=*/1.0, /*stiffness=*/6.0);
  /**
  * @type {!Array<!Spring>}
  * @private
  */
  this.springs_ = [this.spring1_, this.spring2_];
  this.restState();
  this.getSimList().add(this.topMass_, this.bob1_, this.bob2_, this.spring1_,
      this.spring2_);
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // perturb slightly to get some initial motion
  var vars = this.getVarsList().getValues();
  vars[0] += 0.5;
  vars[1] -= 0.5;
  this.getVarsList().setValues(vars);
  this.saveInitialState();
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.GRAVITY,
      Double2DSpringSim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.DAMPING,
      Double2DSpringSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.LENGTH,
      Double2DSpringSim.i18n.LENGTH,
      goog.bind(this.getLength, this), goog.bind(this.setLength, this)));
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.MASS1,
      Double2DSpringSim.i18n.MASS1,
      goog.bind(this.getMass1, this), goog.bind(this.setMass1, this)));
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.MASS2,
      Double2DSpringSim.i18n.MASS2,
      goog.bind(this.getMass2, this), goog.bind(this.setMass2, this)));
  this.addParameter(new ParameterNumber(this, Double2DSpringSim.en.STIFFNESS,
      Double2DSpringSim.i18n.STIFFNESS,
      goog.bind(this.getStiffness, this), goog.bind(this.setStiffness, this)));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', gravity_: '+Util.NF(this.gravity_)
      +', damping_: '+Util.NF(this.damping_)
      +', bob1_: '+this.bob1_
      +', bob2_: '+this.bob2_
      +', spring1_: '+this.spring1_
      +', spring2_: '+this.spring2_
      +', topMass_: '+this.topMass_
      + super.toString();
};

/** @override */
getClassName() {
  return 'Double2DSpringSim';
};

/** Sets simulation to motionless equilibrium resting state, and sets potential
* energy to zero.
* @return {undefined}
*/
restState() {
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  var m1 = this.bob1_.getMass();
  var m2 = this.bob2_.getMass();
  var k1 = this.spring1_.getStiffness();
  var k2 = this.spring2_.getStiffness();
  var r1 = this.spring1_.getRestLength();
  var r2 = this.spring2_.getRestLength();
  var fixY = this.topMass_.getPosition().getY();
  var vars = this.getVarsList().getValues();
  vars[13] = fixY
  // x1 & x2 position
  vars[0] = vars[2] = vars[12] = this.topMass_.getPosition().getX();
  // derive these by writing the force equations to yield zero accel
  // when everything is lined up vertically.
  // y1 position
  vars[1] = fixY - this.gravity_*(m1+m2)/k1 - r1;
  // y2 position
  vars[3] = fixY - this.gravity_*(m2/k2 + (m1+m2)/k1) - r1 - r2;
  // velocities are all zero
  vars[4] = vars[5] = vars[6] = vars[7] = 0;
  // because getEnergyInfo depends on objects being in their current state
  this.getVarsList().setValues(vars);
  this.moveObjects(vars);
  this.setPotentialEnergy(0);
};

/** @override */
getEnergyInfo() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
getEnergyInfo_(vars) {
  var ke = this.bob1_.getKineticEnergy() + this.bob2_.getKineticEnergy();
  var pe = this.gravity_*this.bob1_.getMass()*this.bob1_.getPosition().getY();
  pe += this.gravity_*this.bob2_.getMass()*this.bob2_.getPosition().getY();
  pe += this.spring1_.getPotentialEnergy();
  pe += this.spring2_.getPotentialEnergy();
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
setPotentialEnergy(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @override */
modifyObjects() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  var ei = this.getEnergyInfo_(vars);
  va.setValue(8, ei.getTranslational(), true);
  va.setValue(9, ei.getPotential(), true);
  va.setValue(10, ei.getTotalEnergy(), true);
};

/**
@param {!Array<number>} vars
@private
*/
moveObjects(vars) {
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  this.bob1_.setPosition(new Vector(vars[0],  vars[1]));
  this.bob1_.setVelocity(new Vector(vars[4], vars[5], 0));
  this.bob2_.setPosition(new Vector(vars[2],  vars[3]));
  this.bob2_.setVelocity(new Vector(vars[6], vars[7], 0));
  this.topMass_.setPosition(new Vector(vars[12],  vars[13]));
};

/** @override */
startDrag(simObject, location, offset, dragBody, mouseEvent) {
  this.dragBlock_ = -1;
  if (simObject == this.bob1_) {
    this.dragBlock_ = 0;
    return true;
  } else if (simObject == this.bob2_) {
    this.dragBlock_ = 1;
    return true;
  } else if (simObject == this.topMass_) {
    return true;
  }
  return false;
};

/** @override */
mouseDrag(simObject, location, offset, mouseEvent) {
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  var va = this.getVarsList();
  var p = location.subtract(offset);
  if (simObject == this.topMass_) {
    va.setValue(12, p.getX());
    va.setValue(13, p.getY());
  } else if (this.dragBlock_ >= 0 && this.dragBlock_ <= 1) {
    var block = this.dragBlock_ == 0 ? this.bob1_ : this.bob2_;
    if (simObject != block) {
      return;
    }
    var idx = 2*this.dragBlock_;
    va.setValue(idx, p.getX());
    va.setValue(idx + 1, p.getY());
    va.setValue(idx + 4, 0); // velocity
    va.setValue(idx + 5, 0); // velocity
    // derived energy variables are discontinuous
    va.incrSequence(8, 9, 10);
  }
  this.moveObjects(va.getValues());
};

/** @override */
finishDrag(simObject, location, offset) {
  this.dragBlock_ = -1;
};

/** @override */
handleKeyEvent(keyCode, pressed, keyEvent) {
};

/** @override */
evaluate(vars, change, timeStep) {
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[11] = 1; // time
  var forces1 = this.spring1_.calculateForces();
  var f12 = forces1[1].getVector();
  var forces2 = this.spring2_.calculateForces();
  var f21 = forces2[0].getVector();
  var f22 = forces2[1].getVector();
  var m1 = this.bob1_.getMass();
  var m2 = this.bob2_.getMass();
  var b = this.damping_;
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  if (this.dragBlock_ != 0) {
    change[0] = vars[4]; //U1x' = V1x
    change[1] = vars[5]; //U1y' = V1y
    // V1x:  x accel of bob1:  has two springs acting on it, plus damping
    change[4] = (f12.getX() + f21.getX() - b * vars[4]) / m1;
    // V1y:  y accel of bob1:  two springs acting, plus damping and gravity
    change[5] = -this.gravity_ + (f12.getY() + f21.getY() - b * vars[5]) / m1;
  }
  if (this.dragBlock_ != 1) {
    change[2] = vars[6]; //U2x' = V2x
    change[3] = vars[7]; //U2y' = V2y
    // V2x:  x accel of bob2:  has one spring acting, plus damping
    change[6] = (f22.getX() - b * vars[6]) / m2;
    // V2y:  y accel of bob2:  gravity, damping, and one spring
    change[7] = -this.gravity_ + (f22.getY() - b * vars[7]) / m2;
  }
  return null;
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
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(9, 10);
  this.broadcastParameter(Double2DSpringSim.en.GRAVITY);
};

/** Return mass of pendulum block 1.
@return {number} mass of pendulum block 1
*/
getMass1() {
  return this.bob1_.getMass();
};

/** Set mass of pendulum block 1
@param {number} value mass of pendulum block 1
*/
setMass1(value) {
  this.bob1_.setMass(value);
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(8, 9, 10);
  this.broadcastParameter(Double2DSpringSim.en.MASS1);
};

/** Return mass of pendulum block 2.
@return {number} mass of pendulum block 2
*/
getMass2() {
  return this.bob2_.getMass();
};

/** Set mass of pendulum block 2
@param {number} value mass of pendulum block 2
*/
setMass2(value) {
  this.bob2_.setMass(value);
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(8, 9, 10);
  this.broadcastParameter(Double2DSpringSim.en.MASS2);
};

/** Return spring resting length
@return {number} spring resting length
*/
getLength() {
  return this.springs_[0].getRestLength();
};

/** Set spring resting length
@param {number} value spring resting length
*/
setLength(value) {
  for (var i=0; i<this.springs_.length; i++) {
    this.springs_[i].setRestLength(value);
  }
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(9, 10);
  this.broadcastParameter(Double2DSpringSim.en.LENGTH);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
getStiffness() {
  return this.springs_[0].getStiffness();
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
setStiffness(value) {
  for (var i=0; i<this.springs_.length; i++) {
    this.springs_[i].setStiffness(value);
  }
  // vars[i]:  U1x, U1y, U2x, U2y, V1x, V1y, V2x, V2y KE  PE  TE time fixX fixY
  // i:         0    1    2    3    4    5    6    7  8   9   10  11   12   13
  // discontinuous change in energy
  this.getVarsList().incrSequence(9, 10);
  this.broadcastParameter(Double2DSpringSim.en.STIFFNESS);
};

/** Return damping
@return {number} damping
*/
getDamping() {
  return this.damping_;
};

/** Set damping
@param {number} value damping
*/
setDamping(value) {
  this.damping_ = value;
  this.broadcastParameter(Double2DSpringSim.en.DAMPING);
};

} //end class

/** Set of internationalized strings.
@typedef {{
  ANCHOR_X: string,
  ANCHOR_Y: string,
  X_POSITION: string,
  Y_POSITION: string,
  X_VELOCITY: string,
  Y_VELOCITY: string,
  DAMPING: string,
  GRAVITY: string,
  MASS1: string,
  MASS2: string,
  LENGTH: string,
  STIFFNESS: string,
  REST_STATE: string
  }}
*/
Double2DSpringSim.i18n_strings;

/**
@type {Double2DSpringSim.i18n_strings}
*/
Double2DSpringSim.en = {
  ANCHOR_X: 'anchor X',
  ANCHOR_Y: 'anchor Y',
  X_POSITION: 'X position',
  Y_POSITION: 'Y position',
  X_VELOCITY: 'X velocity',
  Y_VELOCITY: 'Y velocity',
  DAMPING: 'damping',
  GRAVITY: 'gravity',
  MASS1: 'mass-1',
  MASS2: 'mass-2',
  LENGTH: 'spring length',
  STIFFNESS: 'spring stiffness',
  REST_STATE: 'rest state'
};

/**
@private
@type {Double2DSpringSim.i18n_strings}
*/
Double2DSpringSim.de_strings = {
  ANCHOR_X: 'Anker X',
  ANCHOR_Y: 'Anker Y',
  X_POSITION: 'X Position',
  Y_POSITION: 'Y Position',
  X_VELOCITY: 'X Geschwindigkeit',
  Y_VELOCITY: 'Y Geschwindigkeit',
  DAMPING: 'D\u00e4mpfung',
  GRAVITY: 'Gravitation',
  MASS1: 'Masse-1',
  MASS2: 'Masse-2',
  LENGTH: 'Federl\u00e4nge',
  STIFFNESS: 'Federsteifheit',
  REST_STATE: 'ruhe Zustand'
};

/** Set of internationalized strings.
@type {Double2DSpringSim.i18n_strings}
*/
Double2DSpringSim.i18n = goog.LOCALE === 'de' ? Double2DSpringSim.de_strings :
    Double2DSpringSim.en;

exports = Double2DSpringSim;
