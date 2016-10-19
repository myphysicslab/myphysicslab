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

goog.provide('myphysicslab.sims.springs.Spring2DSim');

goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.AbstractODESim');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var lab = myphysicslab.lab;

var AbstractODESim = myphysicslab.lab.model.AbstractODESim;
var EnergyInfo = myphysicslab.lab.model.EnergyInfo;
var EnergySystem = myphysicslab.lab.model.EnergySystem;
var ConcreteLine = myphysicslab.lab.model.ConcreteLine;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var PointMass = myphysicslab.lab.model.PointMass;
var Spring = myphysicslab.lab.model.Spring;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var VarsList = myphysicslab.lab.model.VarsList;
var Vector = myphysicslab.lab.util.Vector;

/** 2-D spring simulation with gravity. An immoveable top anchor mass with a spring and
moveable mass hanging below and swinging in 2D. The top anchor mass can however be
dragged by the user.

Variables and Parameters
-------------------------
Here is a diagram of the two masses showing the definition of the angle `th`:

       T      .
        \     .
         \ th .
          \   .
           \  .
            \ .
             U

Variables:

    U = (Ux, Uy) = position of center of bob
    V = (Vx, Vy) = velocity of bob
    th = angle with vertical (radians); 0 = hanging down; positive is counter clockwise
    L = stretch of spring from rest length

Parameters:

    T = (Tx, Ty) = position of top anchor mass
    R = rest length of spring
    k = spring constant
    b = damping constant
    m = mass of bob


Equations of Motion
-------------------------
The derivation of the equations of motion is shown in more detail at
<http://67.199.21.25/spring2d.html>.

    Fx = - k L sin(th) - b Vx = m Vx'
    Fy = - m g + k L cos(th) - b Vy = m Vy'
    xx = Ux - Tx
    yy = Uy - Ty
    len = Sqrt(xx^2+yy^2)
    L = len - R
    th = atan(xx/yy)
    cos(th) = -yy / len
    sin(th) = xx / len

Differential Equations:

    Ux' = Vx
    Uy' = Vy
    Vx' = -(k/m)L sin(th) -(b/m)Vx
    Vy' = -g + (k/m)L cos(th) -(b/m)Vy


Variables Array
-------------------------
The variables are stored in the VarsList as follows

    vars[0] = Ux
    vars[1] = Uy
    vars[2] = Vx
    vars[3] = Vy
    vars[4] = KE kinetic energy
    vars[5] = PE potential energy
    vars[6] = TE total energy
    vars[7] = time
    vars[8] = anchor X
    vars[9] = anchor Y


* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {myphysicslab.lab.model.AbstractODESim}
* @implements {myphysicslab.lab.model.EnergySystem}
* @implements {myphysicslab.lab.app.EventHandler}
*/
myphysicslab.sims.springs.Spring2DSim = function(opt_name) {
  AbstractODESim.call(this, opt_name);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  var var_names = [
    Spring2DSim.en.X_POSITION,
    Spring2DSim.en.Y_POSITION,
    Spring2DSim.en.X_VELOCITY,
    Spring2DSim.en.Y_VELOCITY,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY,
    VarsList.en.TIME,
    Spring2DSim.en.ANCHOR_X,
    Spring2DSim.en.ANCHOR_Y
  ];
  var i18n_names = [
    Spring2DSim.i18n.X_POSITION,
    Spring2DSim.i18n.Y_POSITION,
    Spring2DSim.i18n.X_VELOCITY,
    Spring2DSim.i18n.Y_VELOCITY,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME,
    Spring2DSim.i18n.ANCHOR_X,
    Spring2DSim.i18n.ANCHOR_Y
  ];
  var va = new VarsList(var_names, i18n_names, this.getName()+'_VARS');
  this.setVarsList(va);
  va.setComputed(4, 5, 6);
  /**
  * @type {boolean}
  * @private
  */
  this.isDragging_ = false;
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
  * @type {!myphysicslab.lab.model.PointMass}
  * @private
  */
  this.anchor_ = PointMass.makeSquare(0.5, 'anchor');
  this.anchor_.setPosition(new Vector(0, 3));
  /**
  * @type {!myphysicslab.lab.model.PointMass}
  * @private
  */
  this.bob_ = PointMass.makeCircle(0.5, 'bob').setMass(0.5);
  /**
  * @type {!myphysicslab.lab.model.Spring}
  * @private
  */
  this.spring_ = new Spring('spring',
      this.anchor_, Vector.ORIGIN,
      this.bob_, Vector.ORIGIN,
      /*restLength=*/2.5, /*stiffness=*/6.0);
  this.restState();
  this.getSimList().add(this.anchor_, this.bob_, this.spring_);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  va.setValue(2, 1.5);
  va.setValue(3, 1.7);
  this.saveInitialState();
  this.addParameter(new ParameterNumber(this, Spring2DSim.en.GRAVITY,
      Spring2DSim.i18n.GRAVITY,
      this.getGravity, this.setGravity));
  this.addParameter(new ParameterNumber(this, Spring2DSim.en.MASS,
      Spring2DSim.i18n.MASS,
      this.getMass, this.setMass));
  this.addParameter(new ParameterNumber(this, Spring2DSim.en.DAMPING,
      Spring2DSim.i18n.DAMPING,
      this.getDamping, this.setDamping));
  this.addParameter(new ParameterNumber(this, Spring2DSim.en.SPRING_LENGTH,
      Spring2DSim.i18n.SPRING_LENGTH,
      this.getSpringRestLength, this.setSpringRestLength));
  this.addParameter(new ParameterNumber(this, Spring2DSim.en.SPRING_STIFFNESS,
      Spring2DSim.i18n.SPRING_STIFFNESS,
      this.getSpringStiffness, this.setSpringStiffness));
};

var Spring2DSim = myphysicslab.sims.springs.Spring2DSim;
goog.inherits(Spring2DSim, AbstractODESim);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  Spring2DSim.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', gravity_: '+NF(this.gravity_)
        +', damping_: '+NF(this.damping_)
        +', spring_: '+this.spring_
        +', bob_: '+this.bob_
        +', anchor_: '+this.anchor_
        + Spring2DSim.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
Spring2DSim.prototype.getClassName = function() {
  return 'Spring2DSim';
};

/** Sets simulation to motionless equilibrium resting state, and sets potential energy
* to zero.
* @return {undefined}
*/
Spring2DSim.prototype.restState = function() {
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  var va = this.getVarsList();
  var vars = va.getValues();
  var fixY = vars[9] = this.anchor_.getPosition().getY();
  vars[0] = vars[8] = this.anchor_.getPosition().getX();
  vars[1] = fixY - this.spring_.getRestLength()
    - this.bob_.getMass()*this.gravity_/this.spring_.getStiffness();
  vars[2] = vars[3] = 0;
  va.setValues(vars);
  this.modifyObjects();
  this.setPotentialEnergy(0);
};

/** @inheritDoc */
Spring2DSim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
Spring2DSim.prototype.getEnergyInfo_ = function(vars) {
  var ke = this.bob_.getKineticEnergy();
  var y = this.bob_.getPosition().getY();
  var pe = this.gravity_ * this.bob_.getMass() * y;
  pe += this.spring_.getPotentialEnergy();
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
Spring2DSim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @inheritDoc */
Spring2DSim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  var ei = this.getEnergyInfo_(vars);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  va.setValue(4, ei.getTranslational(), true);
  va.setValue(5, ei.getPotential(), true);
  va.setValue(6, ei.getTotalEnergy(), true);
};

/**
@param {!Array<number>} vars
@private
*/
Spring2DSim.prototype.moveObjects = function(vars) {
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  this.bob_.setPosition(new Vector(vars[0],  vars[1]));
  this.bob_.setVelocity(new Vector(vars[2], vars[3], 0));
  this.anchor_.setPosition(new Vector(vars[8],  vars[9]));
};

/** @inheritDoc */
Spring2DSim.prototype.startDrag = function(simObject, location, offset, dragBody,
      mouseEvent) {
  if (simObject == this.bob_) {
    this.isDragging_ = true;
    return true;
  } else if (simObject == this.anchor_) {
    return true;
  }
  return false;
};

/** @inheritDoc */
Spring2DSim.prototype.mouseDrag = function(simObject, location, offset, mouseEvent) {
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  var va = this.getVarsList();
  var p = location.subtract(offset);
  if (simObject == this.anchor_) {
    va.setValue(8, p.getX());
    va.setValue(9, p.getY());
  } else if (simObject == this.bob_) {
    va.setValue(0, p.getX());
    va.setValue(1, p.getY());
    va.setValue(2, 0);
    va.setValue(3, 0);
  }
  this.moveObjects(va.getValues());
};

/** @inheritDoc */
Spring2DSim.prototype.finishDrag = function(simObject, location, offset) {
  this.isDragging_ = false;
};

/** @inheritDoc */
Spring2DSim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/** @inheritDoc */
Spring2DSim.prototype.evaluate = function(vars, change, timeStep) {
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  UtilityCore.zeroArray(change);
  this.moveObjects(vars);
  change[7] = 1; // time
  if (!this.isDragging_) {
    var forces = this.spring_.calculateForces();
    var f = forces[1];
    goog.asserts.assert(f.getBody() == this.bob_);
    var m = this.bob_.getMass();
    change[0] = vars[2]; // Ux' = Vx
    change[1] = vars[3]; // Uy' = Vy
    //Vx' = Fx / m = (- k L sin(th) - b Vx ) / m 
    change[2] = (f.getVector().getX() - this.damping_ * vars[2]) / m;
    //Vy' = Fy / m = - g + (k L cos(th) - b Vy ) / m 
    change[3] = -this.gravity_ + (f.getVector().getY() - this.damping_*vars[3])/m;
  }
  return null;
};

/** Return gravity strength.
@return {number} gravity strength
*/
Spring2DSim.prototype.getGravity = function() {
  return this.gravity_;
};

/** Set gravity strength.
@param {number} value gravity strength
*/
Spring2DSim.prototype.setGravity = function(value) {
  this.gravity_ = value;
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6);
  this.broadcastParameter(Spring2DSim.en.GRAVITY);
};

/** Return mass of pendulum bob.
@return {number} mass of pendulum bob
*/
Spring2DSim.prototype.getMass = function() {
  return this.bob_.getMass();
};

/** Set mass of pendulum bob
@param {number} value mass of pendulum bob
*/
Spring2DSim.prototype.setMass = function(value) {
  this.bob_.setMass(value);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6);
  this.broadcastParameter(Spring2DSim.en.MASS);
};

/** Return spring resting length
@return {number} spring resting length
*/
Spring2DSim.prototype.getSpringRestLength = function() {
  return this.spring_.getRestLength();
};

/** Set spring resting length
@param {number} value spring resting length
*/
Spring2DSim.prototype.setSpringRestLength = function(value) {
  this.spring_.setRestLength(value);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6);
  this.broadcastParameter(Spring2DSim.en.SPRING_LENGTH);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
Spring2DSim.prototype.getSpringStiffness = function() {
  return this.spring_.getStiffness();
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
Spring2DSim.prototype.setSpringStiffness = function(value) {
  this.spring_.setStiffness(value);
  // vars:   0   1   2   3   4   5   6    7      8        9
  //        Ux  Uy  Vx  Vy  KE  PE  TE  time  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6);
  this.broadcastParameter(Spring2DSim.en.SPRING_STIFFNESS);
};

/** Return damping
@return {number} damping
*/
Spring2DSim.prototype.getDamping = function() {
  return this.damping_;
};

/** Set damping
@param {number} value damping
*/
Spring2DSim.prototype.setDamping = function(value) {
  this.damping_ = value;
  this.broadcastParameter(Spring2DSim.en.DAMPING);
};


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
  MASS: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  REST_STATE: string
  }}
*/
Spring2DSim.i18n_strings;

/**
@type {Spring2DSim.i18n_strings}
*/
Spring2DSim.en = {
  ANCHOR_X: 'anchor X',
  ANCHOR_Y: 'anchor Y',
  X_POSITION: 'X position',
  Y_POSITION: 'Y position',
  X_VELOCITY: 'X velocity',
  Y_VELOCITY: 'Y velocity',
  DAMPING: 'damping',
  GRAVITY: 'gravity',
  MASS: 'mass',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  REST_STATE: 'rest state'
};

/**
@private
@type {Spring2DSim.i18n_strings}
*/
Spring2DSim.de_strings = {
  ANCHOR_X: 'Anker X',
  ANCHOR_Y: 'Anker Y',
  X_POSITION: 'X Position',
  Y_POSITION: 'Y Position',
  X_VELOCITY: 'X Geschwindigkeit',
  Y_VELOCITY: 'Y Geschwindigkeit',
  DAMPING: 'D\u00e4mpfung',
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  SPRING_LENGTH: 'Federl\u00e4nge',
  SPRING_STIFFNESS: 'Federsteifheit',
  REST_STATE: 'ruhe Zustand'
};

/** Set of internationalized strings.
@type {Spring2DSim.i18n_strings}
*/
Spring2DSim.i18n = goog.LOCALE === 'de' ? Spring2DSim.de_strings :
    Spring2DSim.en;

}); // goog.scope
