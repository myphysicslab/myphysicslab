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

goog.module('myphysicslab.sims.pendulum.CartPendulumSim');

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

/** Simulation of a cart moving on a horizontal track with a pendulum suspended from the
cart.

Variables and Parameters
-------------------------

Variables:

    x = horiz position of cart; when `x=0` the spring is relaxed.
    h = pendulum angle in radians; vertical down is 0, counterclockwise is positive
    v = x'
    w = h'

Parameters:

    M = mass of cart
    m = mass of pendulum
    L = length of rod
    d = cart damping
    b = pendulum damping
    k = spring stiffness

Equations of Motion
-------------------------

See derivation at <https://www.myphysicslab.com/pendulum/cart-pendulum-en.html>.

    x' = v
    h' = w
    v' = ( m w^2 L sin(h) + m g sin(h) cos(h) - k x - d v + b w cos(h)/L )
            / (M + m sin^2(h))
    w' = ( -m w^2 L sin(h) cos(h) + k x cos(h) - (M + m) g sin(h) + d v cos(h)
           - (m + M) b w / (m L) )
           / (L (M + m sin^2(h)))

Note: the equations for the spring force are dependent on having the `x = 0` position
correspond to the spring being at its relaxed length. This makes the equations simpler,
but less general – therefore don't change rest length or attachment position of the
spring.

Variables Array
-------------------------

The variables are stored in the VarsList as follows

    vars[0] = x
    vars[1] = h
    vars[2] = x'
    vars[3] = h'

* @implements {EnergySystem}
* @implements {EventHandler}
*/
class CartPendulumSim extends AbstractODESim {
/**
* @param {string=} opt_name name of this as a Subject
*/
constructor(opt_name) {
  super(opt_name);
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  var var_names = [
    CartPendulumSim.en.CART_POSITION,
    CartPendulumSim.en.PENDULUM_ANGLE,
    CartPendulumSim.en.CART_VELOCITY,
    CartPendulumSim.en.PENDULUM_ANGLE_VELOCITY,
    CartPendulumSim.en.WORK_FROM_DAMPING,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY,
    VarsList.en.TIME
  ];
  var i18n_names = [
    CartPendulumSim.i18n.CART_POSITION,
    CartPendulumSim.i18n.PENDULUM_ANGLE,
    CartPendulumSim.i18n.CART_VELOCITY,
    CartPendulumSim.i18n.PENDULUM_ANGLE_VELOCITY,
    CartPendulumSim.i18n.WORK_FROM_DAMPING,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME
  ];
  var va = new VarsList(var_names, i18n_names, this.getName()+'_VARS');
  this.setVarsList(va);
  va.setComputed(4, 5, 6, 7);
  /**
  * @type {boolean}
  * @private
  */
  this.isDragging_ = false;
  /**
  * @type {number}
  * @private
  */
  this.length_ = 1;
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 9.8;
  /**
  * @type {number}
  * @private
  */
  this.dampingCart_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.dampingPendulum_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.initialEnergy_ = 0;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /**
  * @type {!PointMass}
  * @private
  */
  this.fixedPoint_ = PointMass.makeSquare(0.5, 'fixed point');
  this.fixedPoint_.setMass(Util.POSITIVE_INFINITY);
  this.fixedPoint_.setPosition(new Vector(3, 0));
  /**
  * @type {!ConcreteLine}
  * @private
  */
  this.rod_ = new ConcreteLine('rod');
  /**
  * @type {!PointMass}
  * @private
  */
  this.cart_ = PointMass.makeRectangle(1, 0.3, 'cart');
  /**
  * @type {!PointMass}
  * @private
  */
  this.pendulum_ = PointMass.makeCircle(0.3, 'bob');
  /**
  * @type {!Spring}
  * @private
  */
  this.spring_ = new Spring('spring',
      this.fixedPoint_, Vector.ORIGIN,
      this.cart_, Vector.ORIGIN,
      /*restLength=*/3.0, /*stiffness=*/6.0);
  this.getSimList().add(this.fixedPoint_, this.rod_, this.cart_, this.pendulum_,
      this.spring_);
  this.initWork();
  this.saveInitialState();
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.GRAVITY,
      CartPendulumSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.CART_MASS,
      CartPendulumSim.i18n.CART_MASS,
      () => this.getCartMass(), a => this.setCartMass(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.PENDULUM_MASS,
      CartPendulumSim.i18n.PENDULUM_MASS,
      () => this.getPendulumMass(), a => this.setPendulumMass(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.CART_DAMPING,
      CartPendulumSim.i18n.CART_DAMPING,
      () => this.getCartDamping(), a => this.setCartDamping(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.PENDULUM_DAMPING,
      CartPendulumSim.i18n.PENDULUM_DAMPING,
      () => this.getPendulumDamping(),
       a => this.setPendulumDamping(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.PENDULUM_LENGTH,
      CartPendulumSim.i18n.PENDULUM_LENGTH,
      () => this.getPendulumLength(),
      a => this.setPendulumLength(a)));
  this.addParameter(new ParameterNumber(this, CartPendulumSim.en.SPRING_STIFFNESS,
      CartPendulumSim.i18n.SPRING_STIFFNESS,
      () => this.getSpringStiffness(),
      a => this.setSpringStiffness(a)));
  this.addParameter(new ParameterNumber(this, EnergySystem.en.PE_OFFSET,
      EnergySystem.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a))
      .setLowerLimit(Util.NEGATIVE_INFINITY)
      .setSignifDigits(5));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', gravity_: '+Util.NF(this.gravity_)
      +', dampingCart_: '+Util.NF(this.dampingCart_)
      +', dampingPendulum_: '+Util.NF(this.dampingPendulum_)
      +', length_: '+Util.NF(this.length_)
      +', cart_: '+this.cart_
      +', pendulum_: '+this.pendulum_
      +', spring_: '+this.spring_
      +', rod_: '+this.rod_
      +', fixedPoint_: '+this.fixedPoint_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @override */
getClassName() {
  return 'CartPendulumSim';
};

/** Initialize 'work done by damping' to zero.
* @return {undefined}
*/
initWork() {
  this.getVarsList().setValue(4, 0);
  this.initialEnergy_ = this.getEnergyInfo().getTotalEnergy();
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
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  var ke = this.cart_.getKineticEnergy();
  ke += this.pendulum_.getKineticEnergy();
  var pe = this.spring_.getPotentialEnergy();
  var y = this.pendulum_.getPosition().getY();
  pe += this.gravity_ * this.pendulum_.getMass() * (y + this.length_);
  var work = vars[4];
  return new EnergyInfo(pe + this.potentialOffset_, ke, /*rotational=*/NaN, work,
       this.initialEnergy_);
};

/** @override */
getPEOffset() {
  return this.potentialOffset_;
}

/** @override */
setPEOffset(value) {
  this.potentialOffset_ = value;
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(EnergySystem.en.PE_OFFSET);
};

/** @override */
modifyObjects() {
  var va = this.getVarsList();
  var vars = va.getValues();
  // limit the pendulum angle to +/- Pi
  var angle = Util.limitAngle(vars[1]);
  if (angle != vars[1]) {
    // Increase sequence number of angle variable when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    this.getVarsList().setValue(1, angle);
    vars[1] = angle;
  }
  this.moveObjects(vars);
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  var ei = this.getEnergyInfo_(vars);
  va.setValue(5, ei.getTranslational(), true);
  va.setValue(6, ei.getPotential(), true);
  va.setValue(7, ei.getTotalEnergy(), true);
};

/**
* @param {!Array<number>} vars
* @private
*/
moveObjects(vars) {
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  var angle = vars[1];
  var sinAngle = Math.sin(angle);
  var cosAngle = Math.cos(angle);
  this.cart_.setPosition(new Vector(vars[0],  0));
  this.cart_.setVelocity(new Vector(vars[2], 0, 0));
  this.pendulum_.setPosition(new Vector(
      this.cart_.getPosition().getX() + this.length_*sinAngle,
      this.cart_.getPosition().getY() - this.length_*cosAngle));
  var vx = vars[2] + this.length_*vars[3]*cosAngle;
  var vy = this.length_*vars[3]*sinAngle;
  this.pendulum_.setVelocity(new Vector(vx, vy));
  this.rod_.setStartPoint(this.cart_.getPosition());
  this.rod_.setEndPoint(this.pendulum_.getPosition());
};

/** @override */
startDrag(simObject, location, offset, dragBody, mouseEvent) {
  if (simObject == this.cart_ || simObject == this.pendulum_) {
    this.isDragging_ = true;
    return true;
  } else {
    return false;
  }
};

/** @override */
mouseDrag(simObject, location, offset, mouseEvent) {
  var va = this.getVarsList();
  var vars = va.getValues();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  var p = location.subtract(offset);
  if (simObject == this.cart_) {
    vars[0] = p.getX();
    vars[2] = 0;
    vars[3] = 0;
  } else if (simObject == this.pendulum_) {
    var x1 = vars[0]; // center of cart
    var y1 = 0;
    var x2 = p.getX();  //  center of pendulum
    var y2 = p.getY();
    var th = Math.atan2(x2-x1, -(y2-y1));
    vars[1] = th;
    vars[2] = 0;
    vars[3] = 0;
  }
  va.setValues(vars);
  this.initWork();
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
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[8] = 1; // time
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  if (!this.isDragging_) {
    var m = this.pendulum_.getMass(); // pendulum mass
    var M = this.cart_.getMass(); // cart mass
    var L = this.length_;  // length of pendulum rod
    var k = this.spring_.getStiffness();
    var sh = Math.sin(vars[1]);  // sin(h)
    var csh = Math.cos(vars[1]); // cos(h)
    change[0] = vars[2];  //x' = v
    change[1] = vars[3];  //h' = w
    //v' = (m w^2 L sin(h) + m g sin(h) cos(h) - k x - d v + b w cos(h)/L)
    //     /(M + m sin^2(h))
    var numer = m*vars[3]*vars[3]*L*sh + m*this.gravity_*sh*csh - k*vars[0]
          - this.dampingCart_*vars[2] + this.dampingPendulum_*vars[3]*csh/L;
    change[2] = numer/(M + m*sh*sh);
    //w' = ( -m w^2 L sin(h) cos(h) + k x cos(h) - (M + m) g sin(h) + d v cos(h)
    //       -(m + M) b w / (m L) )
    //       / (L (M + m sin^2(h)))
    numer = -m*vars[3]*vars[3]*L*sh*csh + k*vars[0]*csh - (M+m)*this.gravity_*sh
        + this.dampingCart_*vars[2]*csh;
    numer += -(m+M)*this.dampingPendulum_*vars[3]/(m*L);
    change[3] = numer/(L*(M + m*sh*sh));
    change[4] = -this.dampingCart_*vars[2]*vars[2]
        - this.dampingPendulum_*vars[3]*vars[3];
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
  this.initWork();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(CartPendulumSim.en.GRAVITY);
};

/** Return mass of pendulum bob.
@return {number} mass of pendulum bob
*/
getPendulumMass() {
  return this.pendulum_.getMass();
};

/** Set mass of pendulum bob
@param {number} value mass of pendulum bob
*/
setPendulumMass(value) {
  this.pendulum_.setMass(value);
  this.initWork();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6, 7);
  this.broadcastParameter(CartPendulumSim.en.PENDULUM_MASS);
};

/** Return mass of cart.
@return {number} mass of cart
*/
getCartMass() {
  return this.cart_.getMass();
};

/** Set mass of cart
@param {number} value mass of cart
*/
setCartMass(value) {
  this.cart_.setMass(value);
  this.initWork();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6, 7);
  this.broadcastParameter(CartPendulumSim.en.CART_MASS);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
getSpringStiffness() {
  return this.spring_.getStiffness();
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
setSpringStiffness(value) {
  this.spring_.setStiffness(value);
  this.initWork();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(CartPendulumSim.en.SPRING_STIFFNESS);
};

/** Return cart damping
@return {number} cart damping
*/
getCartDamping() {
  return this.dampingCart_;
};

/** Set cart damping
@param {number} value cart damping
*/
setCartDamping(value) {
  this.dampingCart_ = value;
  this.initWork();
  this.broadcastParameter(CartPendulumSim.en.CART_DAMPING);
};

/** Return pendulum damping
@return {number} pendulum damping
*/
getPendulumDamping() {
  return this.dampingPendulum_;
};

/** Set pendulum damping
@param {number} value pendulum damping
*/
setPendulumDamping(value) {
  this.dampingPendulum_ = value;
  this.initWork();
  this.broadcastParameter(CartPendulumSim.en.PENDULUM_DAMPING);
};

/** Return length of pendulum rod
@return {number} length of pendulum rod
*/
getPendulumLength() {
  return this.length_;
};

/** Set length of pendulum rod
@param {number} value length of pendulum rod
*/
setPendulumLength(value) {
  this.length_ = value;
  this.initWork();
  // vars:  0, 1, 2,  3,  4,    5, 6, 7, 8
  //        x, h, x', h', work, KE,PE,TE,time
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6, 7);
  this.broadcastParameter(CartPendulumSim.en.PENDULUM_LENGTH);
};

} // end class

/** Set of internationalized strings.
@typedef {{
  CART_POSITION: string,
  PENDULUM_ANGLE: string,
  CART_VELOCITY: string,
  PENDULUM_ANGLE_VELOCITY: string,
  CART_DAMPING: string,
  PENDULUM_DAMPING: string,
  GRAVITY: string,
  CART_MASS: string,
  PENDULUM_MASS: string,
  PENDULUM_LENGTH: string,
  SPRING_STIFFNESS: string,
  WORK_FROM_DAMPING: string
  }}
*/
CartPendulumSim.i18n_strings;

/**
@type {CartPendulumSim.i18n_strings}
*/
CartPendulumSim.en = {
  CART_POSITION: 'cart position',
  PENDULUM_ANGLE: 'pendulum angle',
  CART_VELOCITY: 'cart velocity',
  PENDULUM_ANGLE_VELOCITY: 'pendulum angle velocity',
  CART_DAMPING: 'cart damping',
  PENDULUM_DAMPING: 'pendulum damping',
  GRAVITY: 'gravity',
  CART_MASS: 'cart mass',
  PENDULUM_MASS: 'pendulum mass',
  PENDULUM_LENGTH: 'pendulum length',
  SPRING_STIFFNESS: 'spring stiffness',
  WORK_FROM_DAMPING: 'work from damping'
};

/**
@private
@type {CartPendulumSim.i18n_strings}
*/
CartPendulumSim.de_strings = {
  CART_POSITION: 'Wagenposition',
  PENDULUM_ANGLE: 'Pendelwinkel',
  CART_VELOCITY: 'Wagengeschwindigkeit',
  PENDULUM_ANGLE_VELOCITY: 'Pendelwinkelgeschwindigkeit',
  CART_DAMPING: 'Wagendämpfung',
  PENDULUM_DAMPING: 'Pendeldämpfung',
  GRAVITY: 'Gravitation',
  CART_MASS: 'Wagenmasse',
  PENDULUM_MASS: 'Pendelmasse',
  PENDULUM_LENGTH: 'Pendellänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  WORK_FROM_DAMPING: 'Arbeit von Dämpfung'
};

/** Set of internationalized strings.
@type {CartPendulumSim.i18n_strings}
*/
CartPendulumSim.i18n = goog.LOCALE === 'de' ? CartPendulumSim.de_strings :
    CartPendulumSim.en;

exports = CartPendulumSim;
