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

goog.provide('myphysicslab.sims.pendulum.MoveablePendulumSim');

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

var AbstractODESim = lab.model.AbstractODESim;
var EnergyInfo = lab.model.EnergyInfo;
var EnergySystem = lab.model.EnergySystem;
var ConcreteLine = lab.model.ConcreteLine;
var NF = lab.util.UtilityCore.NF;
var ParameterNumber = lab.util.ParameterNumber;
var PointMass = lab.model.PointMass;
var Spring = lab.model.Spring;
var UtilityCore = lab.util.UtilityCore;
var VarsList = lab.model.VarsList;
var Vector = lab.util.Vector;

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
<http://67.199.21.25/Moveable-pendulum.html>.

Variables Array
-------------------------

The variables are stored in the VarsList as follows

    vars[0] = theta   angle of pendulum
    vars[1] = omega = theta'  angular velocity
    vars[2] = t  time
    vars[3] = x_0  anchor X position
    vars[4] = vx_0 = x_0'  anchor X velocity
    vars[5] = y_0  anchor Y position
    vars[6] = vy_0 = y_0'  anchor Y velocity

To Do
-------------------------
The energy values are not correct. When the anchor is moving then energy is being added
to the pendulum. The potential energy should change from moving up and down in
gravitational field. The kinetic energy should include the motion added by the anchor.

@todo  add ParameterBoolean specifying whether to limit angles to +/-Pi.

* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {myphysicslab.lab.model.AbstractODESim}
* @implements {myphysicslab.lab.model.EnergySystem}
* @implements {myphysicslab.lab.app.EventHandler}
*/
myphysicslab.sims.pendulum.MoveablePendulumSim = function(opt_name) {
  AbstractODESim.call(this, opt_name);
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  var var_names = [
    MoveablePendulumSim.en.ANGLE,
    MoveablePendulumSim.en.ANGULAR_VELOCITY,
    VarsList.en.TIME,
    MoveablePendulumSim.en.ANCHOR_X,
    MoveablePendulumSim.en.ANCHOR_X_VELOCITY,
    MoveablePendulumSim.en.ANCHOR_Y,
    MoveablePendulumSim.en.ANCHOR_Y_VELOCITY,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY
  ];
  var i18n_names = [
    MoveablePendulumSim.i18n.ANGLE,
    MoveablePendulumSim.i18n.ANGULAR_VELOCITY,
    VarsList.i18n.TIME,
    MoveablePendulumSim.i18n.ANCHOR_X,
    MoveablePendulumSim.i18n.ANCHOR_X_VELOCITY,
    MoveablePendulumSim.i18n.ANCHOR_Y,
    MoveablePendulumSim.i18n.ANCHOR_Y_VELOCITY,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(7, 8 ,9);
  /** length of pendulum rod
  * @type {number}
  * @private
  */
  this.length_ = 1;
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 10;
  /** damping of pendulum
  * @type {number}
  * @private
  */
  this.damping_ = 0.5;
  /** true when dragging pendulum bob
  * @type {boolean}
  * @private
  */
  this.pendulumDragging_ = false;
  /** true when applying spring force to anchor by mouse drag
  * @type {boolean}
  * @private
  */
  this.springDragging_ = false;
  /** damping applied to anchor
  * @type {number}
  * @private
  */
  this.anchorDamping_ = 0.8;
  /** stiffness of spring made for dragging anchor
  * @type {number}
  * @private
  */
  this.springStiffness_ = 3;
  /** frequency of driving force on anchor to make periodic up/down motion
  * @type {number}
  * @private
  */
  this.frequency_ = 30;
  /** amplitude of driving force on anchor to make periodic up/down motion
  * @type {number}
  * @private
  */
  this.amplitude_ = 200;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /** Whether the simulation is running; determines whether mouse dragging of anchor
  * results in applying spring force or just moving the anchor directly.
  * @type {boolean}
  * @private
  */
  this.running_ = false;
  /**
  * @type {!myphysicslab.lab.model.PointMass}
  * @private
  */
  this.anchor_ = PointMass.makeSquare(0.3, 'anchor').setMass(1.0);
  this.anchor_.setPosition(Vector.ORIGIN);
  /**
  * @type {!myphysicslab.lab.model.ConcreteLine}
  * @private
  */
  this.rod_ = new ConcreteLine('rod');
  /**
  * @type {!myphysicslab.lab.model.PointMass}
  * @private
  */
  this.bob_ = PointMass.makeCircle(0.2, 'bob').setMass(1);
  /** Follows the mouse position while applying spring force to anchor
  * @type {!myphysicslab.lab.model.PointMass}
  * @private
  */
  this.mouse_ = PointMass.makeCircle(0.2, 'mouse').setMass(1.0);
  /**
  * @type {!myphysicslab.lab.model.Spring}
  * @private
  */
  this.dragSpring_ = new Spring('dragSpring',
      this.mouse_, Vector.ORIGIN,
      this.anchor_, Vector.ORIGIN,
      /*restLength=*/0, /*stiffness=*/this.springStiffness_);
  this.getSimList().add(this.anchor_, this.bob_, this.rod_);
  this.getVarsList().setValue(0, 0);
  this.setPotentialEnergy(0);
  this.getVarsList().setValue(0, Math.PI * 0.95);
  this.saveInitialState();
  this.setAnchorYVelocity();
  this.modifyObjects();
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.LENGTH,
      MoveablePendulumSim.i18n.LENGTH,
      this.getLength, this.setLength));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.DAMPING,
      MoveablePendulumSim.i18n.DAMPING,
      this.getDamping, this.setDamping));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.MASS,
      MoveablePendulumSim.i18n.MASS,
      this.getMass, this.setMass));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.GRAVITY,
      MoveablePendulumSim.i18n.GRAVITY,
      this.getGravity, this.setGravity));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.DRIVE_AMPLITUDE,
      MoveablePendulumSim.i18n.DRIVE_AMPLITUDE,
      this.getDriveAmplitude, this.setDriveAmplitude));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.DRIVE_FREQUENCY,
      MoveablePendulumSim.i18n.DRIVE_FREQUENCY,
      this.getDriveFrequency, this.setDriveFrequency));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.ANCHOR_DAMPING,
      MoveablePendulumSim.i18n.ANCHOR_DAMPING,
      this.getAnchorDamping, this.setAnchorDamping));
  this.addParameter(new ParameterNumber(this, MoveablePendulumSim.en.SPRING_STIFFNESS,
      MoveablePendulumSim.i18n.SPRING_STIFFNESS,
      this.getSpringStiffness, this.setSpringStiffness));
};

var MoveablePendulumSim = myphysicslab.sims.pendulum.MoveablePendulumSim;
goog.inherits(MoveablePendulumSim, AbstractODESim);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  MoveablePendulumSim.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', length_: '+NF(this.length_)
        +', gravity_: '+NF(this.gravity_)
        +', damping_: '+NF(this.damping_)
        +', frequency_: '+NF(this.frequency_)
        +', amplitude_: '+NF(this.amplitude_)
        +', anchorDamping_: '+NF(this.anchorDamping_)
        +', springStiffness_: '+NF(this.springStiffness_)
        +', anchor_: '+this.anchor_
        +', bob_: '+this.bob_
        + MoveablePendulumSim.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
MoveablePendulumSim.prototype.getClassName = function() {
  return 'MoveablePendulumSim';
};

/** Informs the simulation of whether the clock is running, which determines whether
mouse dragging of anchor results in applying spring force or just moving the anchor
directly.
@param {boolean} value
*/
MoveablePendulumSim.prototype.setRunning = function(value) {
  this.running_ = value;
};

/** Calculates anchor Y velocity, so that the anchor stays visible, as though
in a 'steady state'.  Otherwise the anchor tends to quickly wander off screen.

Derivation:

    y'' = a sin(frequency t)
    y' = integral(y'' dt) = -(a/frequency) cos(frequency t) + C
    y = integral(y' dt) = -(a/frequency^2) sin(frequency t) + C t + C_2

To avoid the anchor wandering need `C = 0` therefore

    at time t = 0, this gives y' = -(a/frequency)

@return {undefined}
@private
*/
MoveablePendulumSim.prototype.setAnchorYVelocity = function() {
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  var value = Math.abs(this.frequency_) < 1E-10 ? 0 :
      -this.amplitude_/this.frequency_;
  // calculate anchor_y velocity at time = this.initialState_[2]
  this.initialState_[6] = value * Math.cos(this.frequency_ * this.initialState_[2]);
  // set value for current time
  var va = this.getVarsList();
  va.setValue(6, value * Math.cos(this.frequency_ * this.getTime()));
};

/** @inheritDoc */
MoveablePendulumSim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
MoveablePendulumSim.prototype.getEnergyInfo_ = function(vars) {
  // TO DO: This energy calc doesn't include motion from anchor moving.
  // Both kinetic and potential energy needs to be fixed.
  var ke = this.bob_.getKineticEnergy();
  var anchorY = this.anchor_.getPosition().getY();
  var y = this.bob_.getPosition().getY();
  var pe = this.gravity_ * this.bob_.getMass() *(y - anchorY);
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
MoveablePendulumSim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @inheritDoc */
MoveablePendulumSim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  // limit the pendulum angle to +/- Pi
  var angle = UtilityCore.limitAngle(vars[0]);
  if (angle != vars[0]) {
    // This also increases sequence number when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    this.getVarsList().setValue(0, angle, /*continuous=*/false);
    vars[0] = angle;
  }
  this.moveObjects(vars);
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  var ei = this.getEnergyInfo_(vars);
  va.setValue(7, ei.getTranslational(), true);
  va.setValue(8, ei.getPotential(), true);
  va.setValue(9, ei.getTotalEnergy(), true);
};

/**
@param {!Array<number>} vars
@private
*/
MoveablePendulumSim.prototype.moveObjects = function(vars) {
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  var angle = vars[0];
  var sinAngle = Math.sin(angle);
  var cosAngle = Math.cos(angle);
  this.anchor_.setPosition(new Vector(vars[3],  vars[5]));
  var len = this.length_;
  this.bob_.setPosition(new Vector(vars[3] + len*sinAngle,  vars[5] - len*cosAngle));
  // TO DO: this velocity calc doesn't include motion from anchor moving.
  // needs to be fixed.
  var vx = vars[1] * len * cosAngle;
  var vy = vars[1] * len * sinAngle;
  this.bob_.setVelocity(new Vector(vx, vy));
  this.rod_.setStartPoint(this.anchor_.getPosition());
  this.rod_.setEndPoint(this.bob_.getPosition());
};

/** Returns the spring used to drag the anchor mass with the mouse.
* @return {!myphysicslab.lab.model.Spring} the Spring used to drag the anchor
*/
MoveablePendulumSim.prototype.getDragSpring = function() {
  return this.dragSpring_;
};

/** @inheritDoc */
MoveablePendulumSim.prototype.startDrag = function(simObject, location, offset, dragBody,
      mouseEvent) {
  if (simObject == this.anchor_) {
    // Apply spring force on the anchor mass; can continue simulation while dragging.
    // But when not running, just move the anchor directly.
    this.springDragging_ = this.running_;
    if (this.springDragging_) {
      this.getSimList().add(this.dragSpring_);
    }
    this.mouseDrag(simObject, location, offset, mouseEvent);
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
MoveablePendulumSim.prototype.mouseDrag = function(simObject, location, offset,
    mouseEvent) {
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  var va = this.getVarsList();
  var vars = va.getValues();
  var p = location.subtract(offset);
  if (simObject == this.anchor_) {
    if (this.springDragging_) {
      // When running, apply spring force on the anchor mass.
      // Can continue simulation while dragging.
      this.mouse_.setPosition(location);
    } else {
      // When not running, just move the anchor directly.
      va.setValue(3, p.getX());
      va.setValue(5, p.getY());
      // Don't change the anchor velocity here... see setAnchorYVelocity()
      // Anchor velocity must be synchronized with time and driving force,
      // otherwise the anchor will start travelling up or down.
    }
  } else if (simObject == this.bob_) {
    // only allow movement along circular arc
    // calculate angle current bob and anchor position
    var th = Math.PI/2 + Math.atan2(p.getY()-vars[5], p.getX()-vars[3]);
    va.setValue(0, th);
    va.setValue(1, 0);
  }
  this.moveObjects(va.getValues());
};

/** @inheritDoc */
MoveablePendulumSim.prototype.finishDrag = function(simObject, location, offset) {
  this.pendulumDragging_ = false;
  if (this.springDragging_) {
    this.springDragging_ = false;
    this.getSimList().remove(this.dragSpring_);
  }
};

/** @inheritDoc */
MoveablePendulumSim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/** @inheritDoc */
MoveablePendulumSim.prototype.evaluate = function(vars, change, timeStep) {
  UtilityCore.zeroArray(change);
  this.moveObjects(vars);
  change[2] = 1; // time
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  change[3] = vars[4]; // x_0 ' = v_{x0}
  change[5] = vars[6]; // y_0 ' = v_{y0}
  // v_{x0}' = -b_0 v_{x0} + k (mouse_x - x_0)
  change[4] = -this.anchorDamping_*vars[4];
  var mouse = this.mouse_.getPosition();
  if (this.springDragging_) {
    change[4] += this.springStiffness_*(mouse.getX() - vars[3]);
  }
  // v_{y0}' = -b_0 v_{y0} + k (mouse_y - y_0) + A \sin(\omega t)
  change[6] = -this.anchorDamping_*vars[6] +
      this.amplitude_ * Math.sin(this.frequency_ * vars[2]);
  if (this.springDragging_) {
    change[6] += this.springStiffness_*(mouse.getY() - vars[5]);
  }
  if (!this.pendulumDragging_) {
    change[0] = vars[1];  // \theta' = \Omega
    var ddx0 = change[4];  // = v_{x0}' = x_0''
    var ddy0 = change[6];  // = v_{y0}' = y_0''
    var R = this.length_;
    var dd = -(this.gravity_/R)*Math.sin(vars[0]);
    var mRsq = this.bob_.getMass() * R * R;
    dd += -(this.damping_/mRsq) * vars[1];
    dd += -(ddx0/R) * Math.cos(vars[0]) - (ddy0 / R) * Math.sin(vars[0]);
    // \Omega' = -\frac{\cos(\theta)}{R} v_{x0}' - \frac{\sin(\theta)}{R} v_{y0}'
    //           - \frac{b}{m R^2} \Omega - \frac{g}{R} \sin(\theta)
    change[1] = dd;
  }
  return null;
};

/** Return mass of pendulum bob.
@return {number} mass of pendulum bob
*/
MoveablePendulumSim.prototype.getMass = function() {
  return this.bob_.getMass();
};

/** Set mass of pendulum bob
@param {number} value mass of pendulum bob
*/
MoveablePendulumSim.prototype.setMass = function(value) {
  this.bob_.setMass(value);
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(7, 8, 9);
  this.broadcastParameter(MoveablePendulumSim.en.MASS);
};

/** Return gravity strength.
@return {number} gravity strength
*/
MoveablePendulumSim.prototype.getGravity = function() {
  return this.gravity_;
};

/** Set gravity strength.
@param {number} value gravity strength
*/
MoveablePendulumSim.prototype.setGravity = function(value) {
  this.gravity_ = value;
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(8, 9);
  this.broadcastParameter(MoveablePendulumSim.en.GRAVITY);
};

/** Return frequency of driving force on anchor to make periodic up/down motion
@return {number} frequency of driving force on anchor
*/
MoveablePendulumSim.prototype.getDriveFrequency = function() {
  return this.frequency_;
};

/** Set frequency of driving force on anchor to make periodic up/down motion
@param {number} value driving force on anchor
*/
MoveablePendulumSim.prototype.setDriveFrequency = function(value) {
  this.frequency_ = value;
  this.setAnchorYVelocity();
  this.broadcastParameter(MoveablePendulumSim.en.DRIVE_FREQUENCY);
};

/** Return amplitude of driving force on anchor to make periodic up/down motion
@return {number} amplitude of driving force on anchor
*/
MoveablePendulumSim.prototype.getDriveAmplitude = function() {
  return this.amplitude_;
};

/** Set amplitude of of driving force on anchor to make periodic up/down motion
@param {number} value amplitude of driving force on anchor
*/
MoveablePendulumSim.prototype.setDriveAmplitude = function(value) {
  this.amplitude_ = value;
  this.setAnchorYVelocity();
  this.broadcastParameter(MoveablePendulumSim.en.DRIVE_AMPLITUDE);
};

/** Return length of pendulum rod
@return {number} length of pendulum rod
*/
MoveablePendulumSim.prototype.getLength = function() {
  return this.length_;
};

/** Set length of pendulum rod
@param {number} value length of pendulum rod
*/
MoveablePendulumSim.prototype.setLength = function(value) {
  this.length_ = value;
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(7, 8, 9);
  this.broadcastParameter(MoveablePendulumSim.en.LENGTH);
};

/** Return damping factor
@return {number} damping factor
*/
MoveablePendulumSim.prototype.getDamping = function() {
  return this.damping_;
};

/** Set damping factor
@param {number} value damping factor
*/
MoveablePendulumSim.prototype.setDamping = function(value) {
  this.damping_ = value;
  this.broadcastParameter(MoveablePendulumSim.en.DAMPING);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
MoveablePendulumSim.prototype.getSpringStiffness = function() {
  return this.springStiffness_;
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
MoveablePendulumSim.prototype.setSpringStiffness = function(value) {
  this.springStiffness_ = value;
  this.dragSpring_.setStiffness(value);
  // vars 0       1       2      3         4        5        6       7   8   9
  //      angle  angle'  time anchor_x anchor_x' anchor_y anchor_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(8, 9);
  this.broadcastParameter(MoveablePendulumSim.en.SPRING_STIFFNESS);
};

/** Return anchor damping factor
@return {number} anchor damping factor
*/
MoveablePendulumSim.prototype.getAnchorDamping = function() {
  return this.anchorDamping_;
};

/** Set anchor damping factor
@param {number} value anchor damping factor
*/
MoveablePendulumSim.prototype.setAnchorDamping = function(value) {
  this.anchorDamping_ = value;
  this.broadcastParameter(MoveablePendulumSim.en.ANCHOR_DAMPING);
};


/** Set of internationalized strings.
@typedef {{
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
  }}
*/
MoveablePendulumSim.i18n_strings;

/**
@type {MoveablePendulumSim.i18n_strings}
*/
MoveablePendulumSim.en = {
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

/**
@private
@type {MoveablePendulumSim.i18n_strings}
*/
MoveablePendulumSim.de_strings = {
  DRIVE_AMPLITUDE: 'Antriebsamplitude',
  ANGLE: 'Winkel',
  ANGULAR_VELOCITY: 'Winkel Geschwindigkeit',
  DAMPING: 'D\u00e4mpfung',
  DRIVE_FREQUENCY: 'Antriebsfrequenz',
  GRAVITY: 'Gravitation',
  LENGTH: 'L\u00e4nge',
  MASS: 'Masse',
  SPRING_STIFFNESS: 'Federsteifheit',
  ANCHOR_DAMPING: 'Anker D\u00e4mpfung',
  ANCHOR_X: 'Anker X',
  ANCHOR_X_VELOCITY: 'Anker X Geschwindigkeit',
  ANCHOR_Y: 'Anker Y',
  ANCHOR_Y_VELOCITY: 'Anker Y Geschwindigkeit'
};

/** Set of internationalized strings.
@type {MoveablePendulumSim.i18n_strings}
*/
MoveablePendulumSim.i18n = goog.LOCALE === 'de' ? MoveablePendulumSim.de_strings :
    MoveablePendulumSim.en;

}); // goog.scope
