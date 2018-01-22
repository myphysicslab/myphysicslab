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

goog.provide('myphysicslab.sims.pendulum.MoveableDoublePendulumSim');

goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.AbstractODESim');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var lab = myphysicslab.lab;

var AbstractODESim = lab.model.AbstractODESim;
const ConcreteLine = goog.module.get('myphysicslab.lab.model.ConcreteLine');
var EnergyInfo = lab.model.EnergyInfo;
var EnergySystem = lab.model.EnergySystem;
var EventHandler = myphysicslab.lab.app.EventHandler;
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
var Spring = lab.model.Spring;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

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

    vars[0] = theta_1   angle of rod 1
    vars[1] = omega_1 = theta_1'  angular velocity of rod 1
    vars[2] = theta_2   angle of rod 2
    vars[3] = omega_2 = theta_2'  angular velocity of rod 2
    vars[4] = t  time
    vars[5] = x_0  anchor X position
    vars[6] = vx_0 = x_0'  anchor X velocity
    vars[7] = y_0  anchor Y position
    vars[8] = vy_0 = y_0'  anchor Y velocity


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
* @extends {AbstractODESim}
* @implements {EnergySystem}
* @implements {EventHandler}
*/
myphysicslab.sims.pendulum.MoveableDoublePendulumSim = function(opt_name) {
  AbstractODESim.call(this, opt_name);
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  var var_names = [
    MoveableDoublePendulumSim.en.ANGLE_1,
    MoveableDoublePendulumSim.en.ANGULAR_VELOCITY_1,
    MoveableDoublePendulumSim.en.ANGLE_2,
    MoveableDoublePendulumSim.en.ANGULAR_VELOCITY_2,
    VarsList.en.TIME,
    MoveableDoublePendulumSim.en.ANCHOR_X,
    MoveableDoublePendulumSim.en.ANCHOR_X_VELOCITY,
    MoveableDoublePendulumSim.en.ANCHOR_Y,
    MoveableDoublePendulumSim.en.ANCHOR_Y_VELOCITY,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY
  ];
  var i18n_names = [
    MoveableDoublePendulumSim.i18n.ANGLE_1,
    MoveableDoublePendulumSim.i18n.ANGULAR_VELOCITY_1,
    MoveableDoublePendulumSim.i18n.ANGLE_2,
    MoveableDoublePendulumSim.i18n.ANGULAR_VELOCITY_2,
    VarsList.i18n.TIME,
    MoveableDoublePendulumSim.i18n.ANCHOR_X,
    MoveableDoublePendulumSim.i18n.ANCHOR_X_VELOCITY,
    MoveableDoublePendulumSim.i18n.ANCHOR_Y,
    MoveableDoublePendulumSim.i18n.ANCHOR_Y_VELOCITY,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(9, 10, 11);
  /** length of pendulum rod 1
  * @type {number}
  * @private
  */
  this.length1_ = 1;
  /** length of pendulum rod 2
  * @type {number}
  * @private
  */
  this.length2_ = 1;
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
  * @type {!PointMass}
  * @private
  */
  this.anchor_ = PointMass.makeSquare(0.3, 'anchor');
  this.anchor_.setPosition(Vector.ORIGIN);
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
  this.bob1_ = PointMass.makeCircle(0.2, 'bob1');
  /**
  * @type {!PointMass}
  * @private
  */
  this.bob2_ = PointMass.makeCircle(0.2, 'bob2');
  /** Follows the mouse position while applying spring force to anchor
  * @type {!PointMass}
  * @private
  */
  this.mouse_ = PointMass.makeCircle(0.2, 'mouse');
  /**
  * @type {!Spring}
  * @private
  */
  this.dragSpring_ = new Spring('dragSpring',
      this.mouse_, Vector.ORIGIN,
      this.anchor_, Vector.ORIGIN,
      /*restLength=*/0, /*stiffness=*/this.springStiffness_);
  this.getSimList().add(this.anchor_, this.bob1_, this.bob2_, this.rod1_, this.rod2_);
  this.getVarsList().setValue(0, 0);
  this.getVarsList().setValue(2, 0);
  this.setPotentialEnergy(0);
  this.getVarsList().setValue(0, Math.PI * 0.95);
  this.saveInitialState();
  this.setAnchorYVelocity();
  this.modifyObjects();
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.LENGTH_1,
      MoveableDoublePendulumSim.i18n.LENGTH_1,
      goog.bind(this.getLength1, this), goog.bind(this.setLength1, this)));
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.LENGTH_2,
      MoveableDoublePendulumSim.i18n.LENGTH_2,
      goog.bind(this.getLength2, this), goog.bind(this.setLength2, this)));
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.DAMPING,
      MoveableDoublePendulumSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.MASS_1,
      MoveableDoublePendulumSim.i18n.MASS_1,
      goog.bind(this.getMass1, this), goog.bind(this.setMass1, this)));
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.MASS_2,
      MoveableDoublePendulumSim.i18n.MASS_2,
      goog.bind(this.getMass2, this), goog.bind(this.setMass2, this)));
  this.addParameter(new ParameterNumber(this, MoveableDoublePendulumSim.en.GRAVITY,
      MoveableDoublePendulumSim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(
      new ParameterNumber(this, MoveableDoublePendulumSim.en.DRIVE_AMPLITUDE,
      MoveableDoublePendulumSim.i18n.DRIVE_AMPLITUDE,
      goog.bind(this.getDriveAmplitude, this),
      goog.bind(this.setDriveAmplitude, this)));
  this.addParameter(
      new ParameterNumber(this, MoveableDoublePendulumSim.en.DRIVE_FREQUENCY,
      MoveableDoublePendulumSim.i18n.DRIVE_FREQUENCY,
      goog.bind(this.getDriveFrequency, this),
      goog.bind(this.setDriveFrequency, this)));
  this.addParameter(
      new ParameterNumber(this, MoveableDoublePendulumSim.en.ANCHOR_DAMPING,
      MoveableDoublePendulumSim.i18n.ANCHOR_DAMPING,
      goog.bind(this.getAnchorDamping, this),
      goog.bind(this.setAnchorDamping, this)));
  this.addParameter(
      new ParameterNumber(this, MoveableDoublePendulumSim.en.SPRING_STIFFNESS,
      MoveableDoublePendulumSim.i18n.SPRING_STIFFNESS,
      goog.bind(this.getSpringStiffness, this),
      goog.bind(this.setSpringStiffness, this)));
};

var MoveableDoublePendulumSim = myphysicslab.sims.pendulum.MoveableDoublePendulumSim;
goog.inherits(MoveableDoublePendulumSim, AbstractODESim);

/** @override */
MoveableDoublePendulumSim.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
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
      + MoveableDoublePendulumSim.superClass_.toString.call(this);
};

/** @override */
MoveableDoublePendulumSim.prototype.getClassName = function() {
  return 'MoveableDoublePendulumSim';
};

/** Informs the simulation of whether the clock is running, which determines whether
mouse dragging of anchor results in applying spring force or just moving the anchor
directly.
@param {boolean} value
*/
MoveableDoublePendulumSim.prototype.setRunning = function(value) {
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
MoveableDoublePendulumSim.prototype.setAnchorYVelocity = function() {
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  var value = Math.abs(this.frequency_) < 1E-10 ? 0 :
      -this.amplitude_/this.frequency_;
  // calculate anchor_y velocity at time = this.initialState_[4]
  if (this.initialState_) {
    this.initialState_[8] = value * Math.cos(this.frequency_ * this.initialState_[4]);
  }
  // set value for current time
  var va = this.getVarsList();
  va.setValue(8, value * Math.cos(this.frequency_ * this.getTime()));
};

/** @override */
MoveableDoublePendulumSim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
MoveableDoublePendulumSim.prototype.getEnergyInfo_ = function(vars) {
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  var L1 = this.length1_;
  var L2 = this.length2_;
  // TO DO: This energy calc doesn't include motion from anchor moving.
  // Both kinetic and potential energy needs to be fixed.
  var ke = this.bob1_.getKineticEnergy() + this.bob2_.getKineticEnergy();
  // lowest point that bob1 can be is -L1, define that as zero potential energy
  // lowest point that bob2 can be is -L1 -L2
  var anchorY = this.anchor_.getPosition().getY();
  var y1 = this.bob1_.getPosition().getY() - anchorY;
  var y2 = this.bob2_.getPosition().getY() - anchorY;
  var pe = this.gravity_ * this.bob1_.getMass()*(y1 - -L1)
            + this.gravity_ * this.bob2_.getMass()*(y2 - (-L1 -L2));
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
MoveableDoublePendulumSim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @override */
MoveableDoublePendulumSim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  // limit the pendulum angle to +/- Pi
  var angle1 = Util.limitAngle(vars[0]);
  if (angle1 != vars[0]) {
    // This also increases sequence number when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    this.getVarsList().setValue(0, angle1, /*continuous=*/false);
    vars[0] = angle1;
  }
  var angle2 = Util.limitAngle(vars[2]);
  if (angle2 != vars[2]) {
    // This also increases sequence number when angle crosses over
    // the 0 to 2Pi boundary; this indicates a discontinuity in the variable.
    this.getVarsList().setValue(2, angle2, /*continuous=*/false);
    vars[2] = angle2;
  }
  this.moveObjects(vars);
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  var ei = this.getEnergyInfo_(vars);
  va.setValue(9, ei.getTranslational(), true);
  va.setValue(10, ei.getPotential(), true);
  va.setValue(11, ei.getTotalEnergy(), true);
};

/**
@param {!Array<number>} vars
@private
*/
MoveableDoublePendulumSim.prototype.moveObjects = function(vars) {
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  var angle1 = vars[0];
  var sinAngle1 = Math.sin(angle1);
  var cosAngle1 = Math.cos(angle1);
  var angle2 = vars[2];
  var sinAngle2 = Math.sin(angle2);
  var cosAngle2 = Math.cos(angle2);
  this.anchor_.setPosition(new Vector(vars[5],  vars[7]));
  var L1 = this.length1_;
  var L2 = this.length2_;
  var p1 = new Vector(vars[5] + L1*sinAngle1,
                      vars[7] - L1*cosAngle1);
  this.bob1_.setPosition(p1);
  var p2 = new Vector(p1.getX() + L2*sinAngle2,
                      p1.getY() - L2*cosAngle2);
  this.bob2_.setPosition(p2);

  // TO DO: these velocity calcs don't include motion from anchor moving.
  // needs to be fixed.
  var v1x = vars[1]*L1*cosAngle1;
  var v1y = vars[1]*L1*sinAngle1;
  var v2x = v1x + vars[3]*L2*cosAngle2;
  var v2y = v1y + vars[3]*L2*sinAngle2;
  this.bob1_.setVelocity(new Vector(v1x, v1y));
  this.bob2_.setVelocity(new Vector(v2x, v2y));

  this.rod1_.setStartPoint(this.anchor_.getPosition());
  this.rod1_.setEndPoint(p1);
  this.rod2_.setStartPoint(p1);
  this.rod2_.setEndPoint(p2);
};

/** Returns the spring used to drag the anchor mass with the mouse.
* @return {!Spring} the Spring used to drag the anchor
*/
MoveableDoublePendulumSim.prototype.getDragSpring = function() {
  return this.dragSpring_;
};

/** @override */
MoveableDoublePendulumSim.prototype.startDrag = function(simObject, location, offset,
    dragBody, mouseEvent) {
  if (simObject == this.anchor_) {
    // Apply spring force on the anchor mass; can continue simulation while dragging.
    // But when not running, just move the anchor directly.
    this.springDragging_ = this.running_;
    if (this.springDragging_) {
      this.getSimList().add(this.dragSpring_);
    }
    this.mouseDrag(simObject, location, offset, mouseEvent);
    return true;
  } else if (simObject == this.bob1_ || simObject == this.bob2_) {
    // rotate pendulum to initial position; halt simulation while dragging.
    this.pendulumDragging_ = true;
    return true;
  } else {
    return false;
  }
};

/** @override */
MoveableDoublePendulumSim.prototype.mouseDrag = function(simObject, location, offset,
    mouseEvent) {
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
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
      va.setValue(5, p.getX());
      va.setValue(7, p.getY());
      // Don't change the anchor velocity here... see setAnchorYVelocity()
      // Anchor velocity must be synchronized with time and driving force,
      // otherwise the anchor will start travelling up or down.
    }
  } else if (simObject == this.bob1_) {
    // only allow movement along circular arc
    var th = Math.PI/2 + Math.atan2(p.getY()-vars[7], p.getX()-vars[5]);
    va.setValue(0, th);
    va.setValue(1, 0);
    va.setValue(3, 0);
  } else if (simObject == this.bob2_) {
    // only allow movement along circular arc
    var p1 = this.bob1_.getPosition();
    th = Math.PI/2 + Math.atan2(p.getY()-p1.getY(), p.getX()-p1.getX());
    va.setValue(2, th);
    va.setValue(1, 0);
    va.setValue(3, 0);
  }
  this.moveObjects(va.getValues());
};

/** @override */
MoveableDoublePendulumSim.prototype.finishDrag = function(simObject, location, offset) {
  this.pendulumDragging_ = false;
  if (this.springDragging_) {
    this.springDragging_ = false;
    this.getSimList().remove(this.dragSpring_);
  }
};

/** @override */
MoveableDoublePendulumSim.prototype.handleKeyEvent = function(keyCode, pressed,
    keyEvent) {
};

/** @override */
MoveableDoublePendulumSim.prototype.evaluate = function(vars, change, timeStep) {
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[4] = 1; // time
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  change[5] = vars[6]; // x_0 ' = v_{x0}
  change[7] = vars[8]; // y_0 ' = v_{y0}
  // v_{x0}' = -b_0 v_{x0} + k (mouse_x - x_0)
  change[6] = -this.anchorDamping_*vars[6];
  var mouse = this.mouse_.getPosition();
  if (this.springDragging_) {
    change[6] += this.springStiffness_*(mouse.getX() - vars[5]);
  }
  // v_{y0}' = -b_0 v_{y0} + k (mouse_y - y_0) + A \sin(\omega t)
  change[8] = -this.anchorDamping_*vars[8] +
      this.amplitude_ * Math.sin(this.frequency_ * vars[4]);
  if (this.springDragging_) {
    change[8] += this.springStiffness_*(mouse.getY() - vars[7]);
  }
  if (!this.pendulumDragging_) {
    var ddx0 = change[6];  // anchor x0''
    var ddy0 = change[8];  // anchor y0''
    var th1 = vars[0];
    var dth1 = vars[1];
    var th2 = vars[2];
    var dth2 = vars[3];
    var m2 = this.bob2_.getMass();
    var m1 = this.bob1_.getMass();
    var L1 = this.length1_;
    var L2 = this.length2_;
    var g = this.gravity_;
    var b = this.damping_;
    var b2 = this.damping_;

    change[0] = dth1;

    change[1] = -((2*b*dth1 +
              ddx0*L1*(2*m1 + m2)*Math.cos(th1) -
              ddx0*L1*m2*Math.cos(th1 - 2*th2) +
              2*ddy0*L1*m1*Math.sin(th1) + 2*g*L1*m1*Math.sin(th1) +
              ddy0*L1*m2*Math.sin(th1) + g*L1*m2*Math.sin(th1) +
              ddy0*L1*m2*Math.sin(th1 - 2*th2) +
              g*L1*m2*Math.sin(th1 - 2*th2) +
              2*dth2*dth2*L1*L2*m2*Math.sin(th1 - th2) +
              dth1*dth1*L1*L1*m2*Math.sin(2*(th1 - th2))) /
            (L1*L1*(2*m1 + m2 - m2*Math.cos(2*(th1 - th2)))));

    change[2] = dth2;

    change[3] = -((2*b*dth1*L2*m2*Math.cos(th1 - th2) -
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
@return {number} mass of pendulum bob 1
*/
MoveableDoublePendulumSim.prototype.getMass1 = function() {
  return this.bob1_.getMass();
};

/** Set mass of pendulum bob 1
@param {number} value mass of pendulum bob 1
*/
MoveableDoublePendulumSim.prototype.setMass1 = function(value) {
  this.bob1_.setMass(value);
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(9, 10, 11);
  this.broadcastParameter(MoveableDoublePendulumSim.en.MASS_1);
};

/** Return mass of pendulum bob 2.
@return {number} mass of pendulum bob 2
*/
MoveableDoublePendulumSim.prototype.getMass2 = function() {
  return this.bob2_.getMass();
};

/** Set mass of pendulum bob
@param {number} value mass of pendulum bob
*/
MoveableDoublePendulumSim.prototype.setMass2 = function(value) {
  this.bob2_.setMass(value);
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(9, 10, 11);
  this.broadcastParameter(MoveableDoublePendulumSim.en.MASS_2);
};

/** Return gravity strength.
@return {number} gravity strength
*/
MoveableDoublePendulumSim.prototype.getGravity = function() {
  return this.gravity_;
};

/** Set gravity strength.
@param {number} value gravity strength
*/
MoveableDoublePendulumSim.prototype.setGravity = function(value) {
  this.gravity_ = value;
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(10, 11);
  this.broadcastParameter(MoveableDoublePendulumSim.en.GRAVITY);
};

/** Return frequency of driving force on anchor to make periodic up/down motion
@return {number} frequency of driving force on anchor
*/
MoveableDoublePendulumSim.prototype.getDriveFrequency = function() {
  return this.frequency_;
};

/** Set frequency of driving force on anchor to make periodic up/down motion
@param {number} value driving force on anchor
*/
MoveableDoublePendulumSim.prototype.setDriveFrequency = function(value) {
  this.frequency_ = value;
  this.setAnchorYVelocity();
  this.broadcastParameter(MoveableDoublePendulumSim.en.DRIVE_FREQUENCY);
};

/** Return amplitude of driving force on anchor to make periodic up/down motion
@return {number} amplitude of driving force on anchor
*/
MoveableDoublePendulumSim.prototype.getDriveAmplitude = function() {
  return this.amplitude_;
};

/** Set amplitude of of driving force on anchor to make periodic up/down motion
@param {number} value amplitude of driving force on anchor
*/
MoveableDoublePendulumSim.prototype.setDriveAmplitude = function(value) {
  this.amplitude_ = value;
  this.setAnchorYVelocity();
  this.broadcastParameter(MoveableDoublePendulumSim.en.DRIVE_AMPLITUDE);
};

/** Return length of pendulum rod 1
@return {number} length of pendulum rod 1
*/
MoveableDoublePendulumSim.prototype.getLength1 = function() {
  return this.length1_;
};

/** Set length of pendulum rod 1
@param {number} value length of pendulum rod 1
*/
MoveableDoublePendulumSim.prototype.setLength1 = function(value) {
  this.length1_ = value;
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(9, 10, 11);
  this.broadcastParameter(MoveableDoublePendulumSim.en.LENGTH_1);
};

/** Return length of pendulum rod 2
@return {number} length of pendulum rod 2
*/
MoveableDoublePendulumSim.prototype.getLength2 = function() {
  return this.length2_;
};

/** Set length of pendulum rod 2
@param {number} value length of pendulum rod 2
*/
MoveableDoublePendulumSim.prototype.setLength2 = function(value) {
  this.length2_ = value;
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(9, 10, 11);
  this.broadcastParameter(MoveableDoublePendulumSim.en.LENGTH_2);
};

/** Return damping factor
@return {number} damping factor
*/
MoveableDoublePendulumSim.prototype.getDamping = function() {
  return this.damping_;
};

/** Set damping factor
@param {number} value damping factor
*/
MoveableDoublePendulumSim.prototype.setDamping = function(value) {
  this.damping_ = value;
  this.broadcastParameter(MoveableDoublePendulumSim.en.DAMPING);
};

/** Returns spring stiffness for dragging the anchor mass
@return {number} spring stiffness for dragging the anchor mass
*/
MoveableDoublePendulumSim.prototype.getSpringStiffness = function() {
  return this.springStiffness_;
};

/** Sets spring stiffness for dragging the anchor mass
@param {number} value spring stiffness for dragging the anchor mass
*/
MoveableDoublePendulumSim.prototype.setSpringStiffness = function(value) {
  this.springStiffness_ = value;
  this.dragSpring_.setStiffness(value);
  // vars  0    1     2    3      4    5     6      7     8      9  10  11
  //      w_1  w_1'  w_2  w_2'  time top_x top_x' top_y top_y'  KE  PE  TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(10, 11);
  this.broadcastParameter(MoveableDoublePendulumSim.en.SPRING_STIFFNESS);
};

/** Return anchor damping factor
@return {number} anchor damping factor
*/
MoveableDoublePendulumSim.prototype.getAnchorDamping = function() {
  return this.anchorDamping_;
};

/** Set anchor damping factor
@param {number} value anchor damping factor
*/
MoveableDoublePendulumSim.prototype.setAnchorDamping = function(value) {
  this.anchorDamping_ = value;
  this.broadcastParameter(MoveableDoublePendulumSim.en.ANCHOR_DAMPING);
};


/** Set of internationalized strings.
@typedef {{
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
  }}
*/
MoveableDoublePendulumSim.i18n_strings;

/**
@type {MoveableDoublePendulumSim.i18n_strings}
*/
MoveableDoublePendulumSim.en = {
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

/**
@private
@type {MoveableDoublePendulumSim.i18n_strings}
*/
MoveableDoublePendulumSim.de_strings = {
  DRIVE_AMPLITUDE: 'Antriebsamplitude',
  ANGLE_1: 'Winkel 1',
  ANGULAR_VELOCITY_1: 'Winkel Geschwindigkeit 1',
  ANGLE_2: 'Winkel 2',
  ANGULAR_VELOCITY_2: 'Winkel Geschwindigkeit 2',
  DAMPING: 'D\u00e4mpfung',
  DRIVE_FREQUENCY: 'Antriebsfrequenz',
  GRAVITY: 'Gravitation',
  LENGTH_1: 'L\u00e4nge 1',
  LENGTH_2: 'L\u00e4nge 2',
  MASS_1: 'Masse 1',
  MASS_2: 'Masse 2',
  SPRING_STIFFNESS: 'Federsteifheit',
  ANCHOR_DAMPING: 'Anker D\u00e4mpfung',
  ANCHOR_X: 'Anker X',
  ANCHOR_X_VELOCITY: 'Anker X Geschwindigkeit',
  ANCHOR_Y: 'Anker Y',
  ANCHOR_Y_VELOCITY: 'Anker Y Geschwindigkeit'
};

/** Set of internationalized strings.
@type {MoveableDoublePendulumSim.i18n_strings}
*/
MoveableDoublePendulumSim.i18n = goog.LOCALE === 'de' ?
    MoveableDoublePendulumSim.de_strings : MoveableDoublePendulumSim.en;

}); // goog.scope
