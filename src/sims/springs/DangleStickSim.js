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

goog.provide('myphysicslab.sims.springs.DangleStickSim');

goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.AbstractODESim');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var lab = myphysicslab.lab;

var AbstractODESim = myphysicslab.lab.model.AbstractODESim;
var ConcreteLine = myphysicslab.lab.model.ConcreteLine;
var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var PointMass = myphysicslab.lab.model.PointMass;
var Spring = myphysicslab.lab.model.Spring;
var Util = goog.module.get('myphysicslab.lab.util.Util');
var VarsList = myphysicslab.lab.model.VarsList;
var Vector = myphysicslab.lab.util.Vector;

/** Simulation of a stick dangling from a spring attached to a fixed point.  The stick is modeled as a massless rod with a point mass at each end.

Variables and Parameters
-------------------------
Variables:

    r = length of spring
    theta = angle of spring with vertical (down = 0)
    phi = angle of stick with vertical (down = 0)

Fixed parameters:

    b = spring rest length
    L = stick length
    m1 = mass at spring end
    m2 = mass at free end
    g = gravity
    k = spring constant


Equations of Motion
-------------------------
The derivation of the equations of motion is shown at
<http://www.myphysicslab.com/dangle_stick.html>.
See also the Mathematica notebook [DangleStick.nb](DangleStick.pdf).

    theta'' = (-4 m1(m1+m2)r' theta'
        + 2 m1 m2 L phi'^2 sin(phi-theta)
        - 2g m1(m1+m2)sin(theta)
        + k m2 (b-r)sin(2(theta-phi)))
        /(2 m1(m1+m2)r)


    r'' = (2 b k m1
        + b k m2
        - 2 k m1 r
        - k m2 r
        + 2 g m1(m1+m2) cos(theta)
        - k m2 (b-r) cos(2(theta-phi))
        + 2 L m1 m2 cos(phi-theta)phi'^2
        + 2 m1^2 r theta'^2
        + 2 m1 m2 r theta'^2)
        / (2 m1 (m1+m2))


    phi'' = k(b-r)sin(phi-theta)/(L m1)


Variables Array
------------------------
The variables are stored in the VarsList as follows

    vars[0] = theta
    vars[1] = theta'
    vars[2] = r
    vars[3] = r'
    vars[4] = phi
    vars[5] = phi'


To Do
-------------------------
1. add EnergyInfo

* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {AbstractODESim}
* @implements {myphysicslab.lab.app.EventHandler}
*/
myphysicslab.sims.springs.DangleStickSim = function(opt_name) {
  AbstractODESim.call(this, opt_name);
  var var_names = [
    DangleStickSim.en.SPRING_ANGLE,
    DangleStickSim.en.SPRING_ANGULAR_VELOCITY,
    DangleStickSim.en.SPRING_LENGTH,
    DangleStickSim.en.SPRING_LENGTH_VELOCITY,
    DangleStickSim.en.STICK_ANGLE,
    DangleStickSim.en.STICK_ANGULAR_VELOCITY,
    VarsList.en.TIME
  ];
  var i18n_names = [
    DangleStickSim.i18n.SPRING_ANGLE,
    DangleStickSim.i18n.SPRING_ANGULAR_VELOCITY,
    DangleStickSim.i18n.SPRING_LENGTH,
    DangleStickSim.i18n.SPRING_LENGTH_VELOCITY,
    DangleStickSim.i18n.STICK_ANGLE,
    DangleStickSim.i18n.STICK_ANGULAR_VELOCITY,
    VarsList.i18n.TIME
  ];
  var va = new VarsList(var_names, i18n_names, this.getName()+'_VARS');
  this.setVarsList(va);
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 9.8;
  /**
  * @type {!PointMass}
  * @private
  */
  this.fixedPoint_ = PointMass.makeCircle(0.5, 'fixed_point')
      .setMass(Util.POSITIVE_INFINITY);
  /**
  * @type {!PointMass}
  * @private
  */
  this.bob1_ = PointMass.makeCircle(0.25, 'bob1').setMass(1.0);
  /**
  * @type {!PointMass}
  * @private
  */
  this.bob2_ = PointMass.makeCircle(0.25, 'bob2').setMass(1.0);
  /**
  * @type {number}
  * @private
  */
  this.stickLength_ = 1;
  /**
  * @type {!ConcreteLine}
  * @private
  */
  this.stick_ = new ConcreteLine('stick');
  /**
  * @type {!Spring}
  * @private
  */
  this.spring_ = new Spring('spring',
      this.fixedPoint_, Vector.ORIGIN,
      this.bob1_, Vector.ORIGIN,
      /*restLength=*/1.0, /*stiffness=*/20.0);
  /**
  * @type {boolean}
  * @private
  */
  this.isDragging_ = false;
  this.getSimList().add(this.fixedPoint_, this.bob1_, this.bob2_, this.stick_,
      this.spring_);

  // vars:  0,1,2,3,4,5:  theta,theta',r,r',phi,phi'
  va.setValue(0, Math.PI*30/180);
  va.setValue(1, 0);
  va.setValue(2, 2.0);
  va.setValue(3, 0);
  va.setValue(4, -Math.PI*30/180);
  va.setValue(5, 0);
  va.setValue(6, 0);
  this.saveInitialState();
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.GRAVITY,
      DangleStickSim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.MASS1,
      DangleStickSim.i18n.MASS1,
      goog.bind(this.getMass1, this), goog.bind(this.setMass1, this)));
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.MASS2,
      DangleStickSim.i18n.MASS2,
      goog.bind(this.getMass2, this), goog.bind(this.setMass2, this)));
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.SPRING_REST_LENGTH,
      DangleStickSim.i18n.SPRING_REST_LENGTH,
      goog.bind(this.getSpringRestLength, this),
      goog.bind(this.setSpringRestLength, this)));
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.SPRING_STIFFNESS,
      DangleStickSim.i18n.SPRING_STIFFNESS,
      goog.bind(this.getSpringStiffness, this),
      goog.bind(this.setSpringStiffness, this)));
  this.addParameter(new ParameterNumber(this, DangleStickSim.en.STICK_LENGTH,
      DangleStickSim.i18n.STICK_LENGTH,
      goog.bind(this.getStickLength, this), goog.bind(this.setStickLength, this)));
};

var DangleStickSim = myphysicslab.sims.springs.DangleStickSim;
goog.inherits(DangleStickSim, AbstractODESim);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  DangleStickSim.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', gravity_: '+Util.NF(this.gravity_)
        +', stickLength_: '+Util.NF(this.stickLength_)
        +', spring_: '+this.spring_
        +', stick_: '+this.stick_
        +', bob1_: '+this.bob1_
        +', bob2_: '+this.bob2_
        + DangleStickSim.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
DangleStickSim.prototype.getClassName = function() {
  return 'DangleStickSim';
};

/** Sets simulation to motionless equilibrium resting state.
* @return {undefined}
*/
DangleStickSim.prototype.restState = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  vars[0] = vars[1] = vars[3] = vars[4] = vars[5] = 0;
  var r = this.gravity_*(this.bob1_.getMass() + this.bob2_.getMass()) /
    this.spring_.getStiffness();
  vars[2] = this.spring_.getRestLength() + r;
  va.setValues(vars);
};

/** @inheritDoc */
DangleStickSim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  // vars:  0,1,2,3,4,5:  theta,theta',r,r',phi,phi'
  // limit angles to +/- Pi
  var theta = Util.limitAngle(vars[0]);
  if (theta != vars[0]) {
    // This also increases sequence number when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    va.setValue(0, theta, /*continuous=*/false);
    vars[0] = theta;
  }
  var phi = Util.limitAngle(vars[4]);
  if (phi != vars[4]) {
    // This also increases sequence number when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    va.setValue(4, phi, /*continuous=*/false);
    vars[4] = phi;
  }
  this.moveObjects(vars);
};

/**
@param {!Array<number>} vars
@private
*/
DangleStickSim.prototype.moveObjects = function(vars) {
  // vars:  0,1,2,3,4,5:  theta,theta',r,r',phi,phi'
  var theta = vars[0];
  var phi = vars[4];
  var cosTheta = Math.cos(theta);
  var sinTheta = Math.sin(theta);
  var cosPhi = Math.cos(phi);
  var sinPhi = Math.sin(phi);
  this.bob1_.setPosition(new Vector( vars[2]*sinTheta ,  -vars[2]*cosTheta ));
  // bob1 velocity = {r θ' cos θ + r' sin θ,   −r' cos θ + r θ' sin θ }
  this.bob1_.setVelocity(new Vector(vars[2] * vars[1] * cosTheta + vars[3] * sinTheta,
      vars[2] * vars[1] * sinTheta - vars[3] * cosTheta, 0));
  var L = this.stickLength_;
  this.bob2_.setPosition(new Vector(this.bob1_.getPosition().getX() + L*sinPhi,
      this.bob1_.getPosition().getY() - L*cosPhi));
  // v2 = {r θ' cos θ + r' sin θ + S φ' cos φ,   −r' cos θ + r θ' sin θ + S φ' sin φ}
  this.bob2_.setVelocity(this.bob1_.getVelocity()
      .add(new Vector(L * vars[5] * cosPhi, L * vars[5] * sinPhi, 0)));
  this.stick_.setStartPoint(this.bob1_.getPosition());
  this.stick_.setEndPoint(this.bob2_.getPosition());
};

/** @inheritDoc */
DangleStickSim.prototype.startDrag = function(simObject, location, offset, dragBody,
      mouseEvent) {
  if (simObject == this.bob1_ || simObject == this.bob2_) {
    this.isDragging_ = true;
    return true;
  } else {
    return false;
  }
};

/** @inheritDoc */
DangleStickSim.prototype.mouseDrag = function(simObject, location, offset, mouseEvent) {
  var va = this.getVarsList();
  var vars = va.getValues();
  var p = location.subtract(offset);
  if (simObject == this.bob1_) {
    // vars:  0,1,2,3,4,5:  theta,theta',r,r',phi,phi'
    var th = Math.atan2(p.getX(), -p.getY());
    vars[0] = th;
    vars[2] = p.length();  // r
    vars[1] = 0; // theta'
    vars[3] = 0; // r'
    vars[5] = 0; // phi'
    va.setValues(vars);
  } else if (simObject == this.bob2_) {
    // get center of mass1
    var x1 = vars[2]*Math.sin(vars[0]);
    var y1 = -vars[2]*Math.cos(vars[0]);
    // get center of mass2
    var phi = Math.atan2(p.getX() - x1, -(p.getY() - y1));
    vars[4] = phi;
    vars[1] = 0; // theta'
    vars[3] = 0; // r'
    vars[5] = 0; // phi'
    va.setValues(vars);
  }
  this.moveObjects(vars);
};

/** @inheritDoc */
DangleStickSim.prototype.finishDrag = function(simObject, location, offset) {
  this.isDragging_ = false;
};

/** @inheritDoc */
DangleStickSim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/** @inheritDoc */
DangleStickSim.prototype.evaluate = function(vars, change, timeStep) {
  // vars:  0,1,2,3,4,5:  theta,theta',r,r',phi,phi'
  Util.zeroArray(change);
  change[6] = 1; // time
  if (!this.isDragging_) {
    var m2 = this.bob2_.getMass();
    var m1 = this.bob1_.getMass();
    var L = this.stickLength_;
    var k = this.spring_.getStiffness();
    var b = this.spring_.getRestLength();
    change[0] = vars[1];
    change[2] = vars[3];
    change[4] = vars[5];
    /*  theta'' = (-4 m1(m1+m2)r' theta'
        + 2 m1 m2 L phi'^2 sin(phi-theta)
        - 2g m1(m1+m2)sin(theta)
        + k m2 (b-r)sin(2(theta-phi))
        /(2 m1(m1+m2)r)
     the variables are:  0,     1,   2,3,  4,  5:
                        theta,theta',r,r',phi,phi'
    */
    var sum = -4*m1*(m1+m2)*vars[3]*vars[1];
    sum += 2*m1*m2*L*vars[5]*vars[5]*Math.sin(vars[4]-vars[0]);
    sum -= 2*this.gravity_*m1*(m1+m2)*Math.sin(vars[0]);
    sum += k*m2*(b-vars[2])*Math.sin(2*(vars[0]-vars[4]));
    sum = sum / (2*m1*(m1+m2)*vars[2]);
    change[1] = sum;

    /*  r'' = (2 b k m1
         + b k m2
         - 2 k m1 r
         - k m2 r
          - k m2 (b-r) cos(2(theta-phi))
         + 2 L m1 m2 cos(phi-theta)phi'^2 )
         / (2 m1 (m1+m2))
         + r theta'^2
         + g cos(theta);
       the variables are:  0,     1,   2,3,  4,  5:
                          theta,theta',r,r',phi,phi'
    */
    sum = 2*b*k*m1 + b*k*m2 - 2*k*m1*vars[2] - k*m2*vars[2];
    sum -= k*m2*(b-vars[2])*Math.cos(2*(vars[0]-vars[4]));
    sum += 2*L*m1*m2*Math.cos(vars[4]-vars[0])*vars[5]*vars[5];
    sum = sum/(2*m1*(m1+m2));
    sum += vars[2]*vars[1]*vars[1];
    sum += this.gravity_*Math.cos(vars[0]);
    change[3] = sum;

    //    phi'' = k(b-r)sin(phi-theta)/(L m1)
    change[5] = k*(b-vars[2])*Math.sin(vars[4]-vars[0])/(L*m1);
  }
  return null;
};

/** Return gravity strength.
@return {number} gravity strength
*/
DangleStickSim.prototype.getGravity = function() {
  return this.gravity_;
};

/** Set gravity strength.
@param {number} value gravity strength
*/
DangleStickSim.prototype.setGravity = function(value) {
  this.gravity_ = value;
  this.broadcastParameter(DangleStickSim.en.GRAVITY);
};

/** Return mass of pendulum bob 1.
@return {number} mass of pendulum bob 1
*/
DangleStickSim.prototype.getMass1 = function() {
  return this.bob1_.getMass();
};

/** Set mass of pendulum bob 1
@param {number} value mass of pendulum bob 1
*/
DangleStickSim.prototype.setMass1 = function(value) {
  this.bob1_.setMass(value);
  this.broadcastParameter(DangleStickSim.en.MASS1);
};

/** Return mass of pendulum bob 2.
@return {number} mass of pendulum bob 2
*/
DangleStickSim.prototype.getMass2 = function() {
  return this.bob2_.getMass();
};

/** Set mass of pendulum bob 2
@param {number} value mass of pendulum bob 2
*/
DangleStickSim.prototype.setMass2 = function(value) {
  this.bob2_.setMass(value);
  this.broadcastParameter(DangleStickSim.en.MASS2);
};

/** Return spring resting length
@return {number} spring resting length
*/
DangleStickSim.prototype.getSpringRestLength = function() {
  return this.spring_.getRestLength();
};

/** Set spring resting length
@param {number} value spring resting length
*/
DangleStickSim.prototype.setSpringRestLength = function(value) {
  this.spring_.setRestLength(value);
  this.broadcastParameter(DangleStickSim.en.SPRING_REST_LENGTH);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
DangleStickSim.prototype.getSpringStiffness = function() {
  return this.spring_.getStiffness();
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
DangleStickSim.prototype.setSpringStiffness = function(value) {
  this.spring_.setStiffness(value);
  this.broadcastParameter(DangleStickSim.en.SPRING_STIFFNESS);
};

/** Return length of stick
@return {number} length of stick
*/
DangleStickSim.prototype.getStickLength = function() {
  return this.stickLength_;
};

/** Set length of stick
@param {number} value length of stick
*/
DangleStickSim.prototype.setStickLength = function(value) {
  this.stickLength_ = value;
  this.broadcastParameter(DangleStickSim.en.STICK_LENGTH);
};


/** Set of internationalized strings.
@typedef {{
  SPRING_ANGLE: string,
  SPRING_ANGULAR_VELOCITY: string,
  SPRING_LENGTH: string,
  SPRING_LENGTH_VELOCITY: string,
  STICK_ANGLE: string,
  STICK_ANGULAR_VELOCITY: string,
  GRAVITY: string,
  MASS1: string,
  MASS2: string,
  SPRING_REST_LENGTH: string,
  SPRING_STIFFNESS: string,
  STICK_LENGTH: string
  }}
*/
DangleStickSim.i18n_strings;

/**
@type {DangleStickSim.i18n_strings}
*/
DangleStickSim.en = {
  SPRING_ANGLE: 'spring angle',
  SPRING_ANGULAR_VELOCITY: 'spring angular velocity',
  SPRING_LENGTH: 'spring length',
  SPRING_LENGTH_VELOCITY: 'spring length velocity',
  STICK_ANGLE: 'stick angle',
  STICK_ANGULAR_VELOCITY: 'stick angular velocity',
  GRAVITY: 'gravity',
  MASS1: 'mass-1',
  MASS2: 'mass-2',
  SPRING_REST_LENGTH: 'spring rest length',
  SPRING_STIFFNESS: 'spring stiffness',
  STICK_LENGTH: 'stick length'
};

/**
@private
@type {DangleStickSim.i18n_strings}
*/
DangleStickSim.de_strings = {
  SPRING_ANGLE: 'Federwinkel',
  SPRING_ANGULAR_VELOCITY: 'Federwinkelgeschwindigkeit',
  SPRING_LENGTH: 'Federl\u00e4nge',
  SPRING_LENGTH_VELOCITY: 'Federl\u00e4ngegeschwindigkeit',
  STICK_ANGLE: 'Stangenwinkel',
  STICK_ANGULAR_VELOCITY: 'Stangenwinkelgeschwindigkeit',
  GRAVITY: 'Gravitation',
  MASS1: 'Masse-1',
  MASS2: 'Masse-2',
  SPRING_REST_LENGTH: 'Federl\u00e4nge im Ruhezustand',
  SPRING_STIFFNESS: 'Federsteifheit',
  STICK_LENGTH: 'Stangenl\u00e4nge'
};

/** Set of internationalized strings.
@type {DangleStickSim.i18n_strings}
*/
DangleStickSim.i18n = goog.LOCALE === 'de' ? DangleStickSim.de_strings :
    DangleStickSim.en;

}); // goog.scope
