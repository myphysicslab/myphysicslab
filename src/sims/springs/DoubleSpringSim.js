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

goog.provide('myphysicslab.sims.springs.DoubleSpringSim');

goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.AbstractODESim');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractODESim = lab.model.AbstractODESim;
var EnergyInfo = lab.model.EnergyInfo;
var EnergySystem = lab.model.EnergySystem;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var PointMass = lab.model.PointMass;
var SimObject = lab.model.SimObject;
var Spring = lab.model.Spring;
var Util = goog.module.get('myphysicslab.lab.util.Util');
var VarsList = lab.model.VarsList;
var Vector = lab.util.Vector;

/** Simulation of two blocks connected by springs. Movement is only along one dimension.
No gravity force or damping force. The configuration is:

    wall1-spring1-block1-spring2-block2-spring3-wall2

Variables and Parameters
-------------------------

Variables:

    vars[0] = u1 = position of block 1
    vars[1] = u2 = position of block 2
    vars[2] = v1 = velocity of block 1
    vars[3] = v2 = velocity of block 2

Parameters:

    R = rest length of spring
    k = spring constant
    b = damping
    m = mass
    L = spring stretch
    F = force

Equations of Motion
-------------------------
See also <http://www.myphysicslab.com/dbl_spring1.html>.

Forces:

    F1 = -k1 L1 + k2 L2 - b v1 = m1 v1'
    F2 = -k2 L2 + k3 L3 - b v2 = m2 v2'

Equations of Motion:

    u1' = v1
    u2' = v2
    v1' = F1/m1 = (-k1 L1 + k2 L2 - b v1) / m1
    v2' = F2/m2 = (-k2 L2 + k3 L3 - b v2) / m2

@todo  make a vertical configuration with gravity

* @param {boolean} thirdSpring whether to have the third spring
* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {AbstractODESim}
* @implements {EnergySystem}
* @implements {myphysicslab.lab.app.EventHandler}
*/
myphysicslab.sims.springs.DoubleSpringSim = function(thirdSpring, opt_name) {
  AbstractODESim.call(this, opt_name);
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  var var_names = [
    DoubleSpringSim.en.POSITION+'-1',
    DoubleSpringSim.en.POSITION+'-2',
    DoubleSpringSim.en.VELOCITY+'-1',
    DoubleSpringSim.en.VELOCITY+'-2',
    DoubleSpringSim.en.ACCELERATION+'-1',
    DoubleSpringSim.en.ACCELERATION+'-2',
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY,
    VarsList.en.TIME
  ];
  var i18n_names = [
    DoubleSpringSim.i18n.POSITION+'-1',
    DoubleSpringSim.i18n.POSITION+'-2',
    DoubleSpringSim.i18n.VELOCITY+'-1',
    DoubleSpringSim.i18n.VELOCITY+'-2',
    DoubleSpringSim.i18n.ACCELERATION+'-1',
    DoubleSpringSim.i18n.ACCELERATION+'-2',
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(4, 5, 6, 7, 8);
  /**
  * @type {!PointMass}
  * @private
  */
  this.block1_ = PointMass.makeSquare(1, 'block1');
  /**
  * @type {!PointMass}
  * @private
  */
  this.block2_ = PointMass.makeSquare(1, 'block2');
  /**
  * @type {!PointMass}
  * @private
  */
  this.wall1_ = PointMass.makeRectangle(0.4, 4, 'wall1')
      .setMass(Util.POSITIVE_INFINITY);
  this.wall1_.setPosition(new Vector(-0.2,  0));
  /**
  * @type {!PointMass}
  * @private
  */
  this.wall2_ = PointMass.makeRectangle(0.4, 4, 'wall2')
      .setMass(Util.POSITIVE_INFINITY);
  this.wall2_.setPosition(new Vector(9.8,  0));
  var length = 3.0;
  /**
  * @type {number}
  * @private
  */
  this.stiffness_ = 6.0;
  /**
  * @type {boolean}
  * @private
  */
  this.thirdSpring_ = thirdSpring;
  /**
  * @type {!Spring}
  * @private
  */
  this.spring1_ = new Spring('spring1',
      this.wall1_, new Vector(this.wall1_.getWidth()/2.0, 0),
      this.block1_, Vector.ORIGIN,
      /*restLength=*/length, /*stiffness=*/this.stiffness_);
  /**
  * @type {!Spring}
  * @private
  */
  this.spring2_ = new Spring('spring2',
      this.block1_, Vector.ORIGIN,
      this.block2_, Vector.ORIGIN,
      /*restLength=*/length, /*stiffness=*/this.stiffness_);
  /**
  * @type {!Spring}
  * @private
  */
  this.spring3_ = new Spring('spring3',
      this.block2_, Vector.ORIGIN,
      this.wall2_, new Vector(-this.wall2_.getWidth()/2.0, 0),
      /*restLength=*/length, /*stiffness=*/(this.thirdSpring_ ? this.stiffness_ : 0));
  /**
  * @type {!Array<!Spring>}
  * @private
  */
  this.springs_ = [this.spring1_, this.spring2_, this.spring3_];
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
  /** the block being dragged, or -1 when no drag is happening
  * @type {number}
  * @private
  */
  this.dragBlock_ = -1;
  this.restState();
  this.setPotentialEnergy(0);
  this.getVarsList().setValue(3, -2.3);
  this.saveInitialState();
  this.getSimList().add(this.wall1_, this.wall2_, this.block1_, this.block2_,
      this.spring1_, this.spring2_, this.spring3_);
  this.addParameter(new ParameterNumber(this, DoubleSpringSim.en.DAMPING,
      DoubleSpringSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, DoubleSpringSim.en.LENGTH,
      DoubleSpringSim.i18n.LENGTH,
      goog.bind(this.getLength, this), goog.bind(this.setLength, this)));
  this.addParameter(new ParameterNumber(this, DoubleSpringSim.en.MASS1,
      DoubleSpringSim.i18n.MASS1,
      goog.bind(this.getMass1, this), goog.bind(this.setMass1, this)));
  this.addParameter(new ParameterNumber(this, DoubleSpringSim.en.MASS2,
      DoubleSpringSim.i18n.MASS2,
      goog.bind(this.getMass2, this), goog.bind(this.setMass2, this)));
  this.addParameter(new ParameterNumber(this, DoubleSpringSim.en.STIFFNESS,
      DoubleSpringSim.i18n.STIFFNESS,
      goog.bind(this.getStiffness, this), goog.bind(this.setStiffness, this)));
  this.addParameter(new ParameterBoolean(this, DoubleSpringSim.en.THIRD_SPRING,
      DoubleSpringSim.i18n.THIRD_SPRING,
      goog.bind(this.getThirdSpring, this), goog.bind(this.setThirdSpring, this)));
};

var DoubleSpringSim = myphysicslab.sims.springs.DoubleSpringSim;
goog.inherits(DoubleSpringSim, AbstractODESim);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  DoubleSpringSim.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', block1_: '+this.block1_
        +', block2_: '+this.block2_
        +', spring1_: '+this.spring1_
        +', damping_: '+Util.NF(this.damping_)
        +', stiffness_: '+Util.NF(this.stiffness_)
        +', thirdSpring_: '+this.thirdSpring_
        + DoubleSpringSim.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
DoubleSpringSim.prototype.getClassName = function() {
  return 'DoubleSpringSim';
};

/** Sets the simulation to a motionless state.

    R = restLength of springs
    k = stiffness of springs
    L = stretch of springs
    u = position of bobs

Need forces on each block to be zero

    0 = -k1 L1 + k2 L2
    0 = -k2 L2 + k3 L3

Really its an equation for finding `u1, u2 =` position of the two blocks.

    0 = -k1 (u1 - Wall1 - R1) + k2 (u2 - u1 - R2)
    0 = -k2 (u2 - u1 - R2) + k3 (Wall2 - u2 - R3)

We have 2 equations in 2 unknowns, solve the first for `u2`

    0 = -k1 (u1 - Wall1 - R1) + k2 (u2 - u1 - R2)
    0 = -(k1/k2) (u1 - Wall1 - R1) + u2 - u1 - R2
    u2 = (k1/k2)(u1 - Wall1 - R1) + u1 + R2

Plug that into the second equation and solve for `u1`:

    0 = -k2 (u2 - u1 - R2) + k3 (Wall2 - u2 - R3)
    0 = -k2 ((k1/k2)(u1 - Wall1 - R1) + u1 + R2 - u1 - R2)
        + k3 (Wall2 - ((k1/k2)(u1 - Wall1 - R1) + u1 + R2) - R3)
    0 = -k1 (u1 - Wall1 - R1)
        + k3 (Wall2 - (k1/k2)(u1 - Wall1 - R1) - u1 - R2 - R3)
    0 = -k1 u1 + k1 Wall1 + k1 R1
        + k3 Wall2 - (k3 k1/k2)(u1 - Wall1 - R1) - k3 u1 - k3 R2 - k3 R3
    0 = -k1 u1 - (k3 k1/k2) u1- k3 u1
        + k1 Wall1 + k1 R1 + k3 Wall2 + (k3 k1/k2)(Wall1 + R1) - k3 R2 - k3 R3
    (k1 + (k3 k1/k2) + k3) u1 =
        + k1 Wall1 + k1 R1 + k3 Wall2 + (k3 k1/k2)(Wall1 + R1) - k3 R2 - k3 R3
    u1 = (k1 Wall1 + k1 R1 + k3 Wall2 + (k3 k1/k2)(Wall1 + R1) - k3 R2 - k3 R3)
        / (k1 + (k3 k1/k2) + k3)

@return {undefined}
*/
DoubleSpringSim.prototype.restState = function() {
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  var vars = this.getVarsList().getValues();
  var k1 = this.spring1_.getStiffness();
  var k2 = this.spring2_.getStiffness();
  var k3 = this.spring3_.getStiffness();
  var R1 = this.spring1_.getRestLength();
  var R2 = this.spring2_.getRestLength();
  var R3 = this.spring3_.getRestLength();
  var w1 = this.wall1_.getBoundsWorld().getRight();
  var w2 = this.wall2_.getBoundsWorld().getLeft();
  var u1 = (k1 * w1 + k1 * R1 + k3 * w2 + (k3 * k1/k2)*(w1 + R1) - k3 * R2 - k3 * R3);
  u1 = u1 / (k1 + (k3 * k1/k2) + k3);
  vars[0] = u1;
  vars[1] = (k1/k2)*(u1 - w1 - R1) + u1 + R2;
  vars[2] = vars[3] = 0;  // velocity
  this.getVarsList().setValues(vars);
  this.moveObjects(vars);
};

/** @inheritDoc */
DoubleSpringSim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
DoubleSpringSim.prototype.getEnergyInfo_ = function(vars) {
  /** @type {number} */
  var ke = this.block1_.getKineticEnergy() + this.block2_.getKineticEnergy();
  /** @type {number} */
  var pe = this.potentialOffset_;
  goog.array.forEach(this.springs_, function(spr) {
    pe += spr.getPotentialEnergy();
  });
  return new EnergyInfo(pe, ke);
};

/** @inheritDoc */
DoubleSpringSim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @inheritDoc */
DoubleSpringSim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  var rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  vars[4] = rate[2];
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
DoubleSpringSim.prototype.moveObjects = function(vars) {
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  this.block1_.setPosition(new Vector(vars[0],  0));
  this.block1_.setVelocity(new Vector(vars[2], 0, 0));
  this.block2_.setPosition(new Vector(vars[1],  0));
  this.block2_.setVelocity(new Vector(vars[3], 0, 0));
};

/** @inheritDoc */
DoubleSpringSim.prototype.startDrag = function(simObject, location, offset, dragBody,
      mouseEvent) {
  if (simObject == this.block1_) {
    this.dragBlock_ = 0;
    return true;
  } else if (simObject == this.block2_) {
    this.dragBlock_ = 1;
    return true;
  }
  this.dragBlock_ = -1;
  return false;
};

/** @inheritDoc */
DoubleSpringSim.prototype.mouseDrag = function(simObject, location, offset, mouseEvent) {
  var p = location.subtract(offset);
  if (this.dragBlock_ >= 0 && this.dragBlock_ <= 1) {
    var block = this.dragBlock_ == 0 ? this.block1_ : this.block2_;
    if (simObject != block) {
      return;
    }
    // vars  0   1   2   3   4   5   6   7  8  9
    //       U1  U2  V1  V2  A1  A2  KE  PE TE time
    var va = this.getVarsList();
    va.setValue(this.dragBlock_, p.getX());
    va.setValue(this.dragBlock_ + 2, 0); // velocity
    // derived energy variables are discontinuous
    va.incrSequence(6, 7, 8);
    this.moveObjects(va.getValues());
  }
};

/** @inheritDoc */
DoubleSpringSim.prototype.finishDrag = function(simObject, location, offset) {
  this.dragBlock_ = -1;
};

/** @inheritDoc */
DoubleSpringSim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/** @inheritDoc */
DoubleSpringSim.prototype.evaluate = function(vars, change, timeStep) {
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  Util.zeroArray(change);
  change[9] = 1.0;  // time
  this.moveObjects(vars);
  if (this.dragBlock_ != 0) {
    // u1' = v1
    change[0] = vars[2];
    // v1' = F1/m1 = (-k1 L1 + k2 L2 - b v1) / m1
    change[2] = (-this.spring1_.getStiffness()*this.spring1_.getStretch()
        + this.spring2_.getStiffness()*this.spring2_.getStretch()
        - this.damping_*vars[2]
        ) / this.block1_.getMass();
  }
  if (this.dragBlock_ != 1) {
    // u2' = v2
    change[1] = vars[3];
    // v2' = F2/m2 = (-k2 L2 + k3 L3 - b v2) / m2
    change[3] = (-this.spring2_.getStiffness()*this.spring2_.getStretch()
        + this.spring3_.getStiffness()*this.spring3_.getStretch()
        - this.damping_*vars[3]
        ) / this.block2_.getMass();
  }
  return null;
};

/** Return whether to have the third spring
@return {boolean} whether to have the third spring
*/
DoubleSpringSim.prototype.getThirdSpring = function() {
  return this.thirdSpring_;
};

/** Set whether to have the third spring
@param {boolean} value whether to have the third spring
*/
DoubleSpringSim.prototype.setThirdSpring = function(value) {
  if (value != this.thirdSpring_) {
    this.thirdSpring_ = value;
    this.spring3_.setStiffness(value ? this.stiffness_ : 0);
    // vars  0   1   2   3   4   5   6   7  8  9
    //       U1  U2  V1  V2  A1  A2  KE  PE TE time
    // discontinuous change in energy
    this.getVarsList().incrSequence(6, 7, 8);
    this.broadcastParameter(DoubleSpringSim.en.THIRD_SPRING);
  }
};

/** Return mass of pendulum block 1.
@return {number} mass of pendulum block 1
*/
DoubleSpringSim.prototype.getMass1 = function() {
  return this.block1_.getMass();
};

/** Set mass of pendulum block 1
@param {number} value mass of pendulum block 1
*/
DoubleSpringSim.prototype.setMass1 = function(value) {
  this.block1_.setMass(value);
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7, 8);
  this.broadcastParameter(DoubleSpringSim.en.MASS1);
};

/** Return mass of pendulum block 2.
@return {number} mass of pendulum block 2
*/
DoubleSpringSim.prototype.getMass2 = function() {
  return this.block2_.getMass();
};

/** Set mass of pendulum block 2
@param {number} value mass of pendulum block 2
*/
DoubleSpringSim.prototype.setMass2 = function(value) {
  this.block2_.setMass(value);
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7, 8);
  this.broadcastParameter(DoubleSpringSim.en.MASS2);
};

/** Return spring resting length
@return {number} spring resting length
*/
DoubleSpringSim.prototype.getLength = function() {
  return this.springs_[0].getRestLength();
};

/** Set spring resting length
@param {number} value spring resting length
*/
DoubleSpringSim.prototype.setLength = function(value) {
  for (var i=0; i<this.springs_.length; i++) {
    this.springs_[i].setRestLength(value);
  }
  // vars  0   1   2   3   4   5   6   7  8  9
  //       U1  U2  V1  V2  A1  A2  KE  PE TE time
  // discontinuous change in energy
  this.getVarsList().incrSequence(7, 8);
  this.broadcastParameter(DoubleSpringSim.en.LENGTH);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
DoubleSpringSim.prototype.getStiffness = function() {
  return this.stiffness_;
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
DoubleSpringSim.prototype.setStiffness = function(value) {
  if (this.stiffness_ != value) {
    this.stiffness_ = value;
    this.spring1_.setStiffness(value);
    this.spring2_.setStiffness(value);
    if (this.thirdSpring_) {
      this.spring3_.setStiffness(value);
    }
    // vars  0   1   2   3   4   5   6   7  8  9
    //       U1  U2  V1  V2  A1  A2  KE  PE TE time
    // discontinuous change in energy
    this.getVarsList().incrSequence(7, 8);
    this.broadcastParameter(DoubleSpringSim.en.STIFFNESS);
  }
};

/**
@return {number}
*/
DoubleSpringSim.prototype.getDamping = function() {
  return this.damping_;
};

/**
@param {number} value
*/
DoubleSpringSim.prototype.setDamping = function(value) {
  this.damping_ = value;
  this.broadcastParameter(DoubleSpringSim.en.DAMPING);
};

/** Set of internationalized strings.
@typedef {{
  ACCELERATION: string,
  DAMPING: string,
  MASS1: string,
  MASS2: string,
  POSITION: string,
  LENGTH: string,
  STIFFNESS: string,
  VELOCITY: string,
  REST_STATE: string,
  THIRD_SPRING: string
  }}
*/
DoubleSpringSim.i18n_strings;

/**
@type {DoubleSpringSim.i18n_strings}
*/
DoubleSpringSim.en = {
  ACCELERATION: 'acceleration',
  DAMPING: 'damping',
  MASS1: 'mass-1',
  MASS2: 'mass-2',
  POSITION: 'position',
  LENGTH: 'spring length',
  STIFFNESS: 'spring stiffness',
  VELOCITY: 'velocity',
  REST_STATE: 'rest state',
  THIRD_SPRING: 'third spring'
};

/**
@private
@type {DoubleSpringSim.i18n_strings}
*/
DoubleSpringSim.de_strings = {
  ACCELERATION: 'Beschleunigung',
  DAMPING: 'D\u00e4mpfung',
  MASS1: 'Masse-1',
  MASS2: 'Masse-2',
  POSITION: 'Position',
  LENGTH: 'Federl\u00e4nge',
  STIFFNESS: 'Federsteifheit',
  VELOCITY: 'Geschwindigkeit',
  REST_STATE: 'ruhe Zustand',
  THIRD_SPRING: 'dritte Feder'
};

/** Set of internationalized strings.
@type {DoubleSpringSim.i18n_strings}
*/
DoubleSpringSim.i18n = goog.LOCALE === 'de' ? DoubleSpringSim.de_strings :
    DoubleSpringSim.en;

}); // goog.scope
