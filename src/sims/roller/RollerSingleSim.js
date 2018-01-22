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

goog.provide('myphysicslab.sims.roller.RollerSingleSim');

goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.AbstractODESim');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.NumericalPath');
goog.require('myphysicslab.lab.model.PathPoint');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.roller.HasPath');

goog.scope(function() {

var AbstractODESim = myphysicslab.lab.model.AbstractODESim;
const EnergyInfo = goog.module.get('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.module.get('myphysicslab.lab.model.EnergySystem');
var EventHandler = myphysicslab.lab.app.EventHandler;
const NumericalPath = goog.module.get('myphysicslab.lab.model.NumericalPath');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const PathPoint = goog.module.get('myphysicslab.lab.model.PathPoint');
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
const SimObject = goog.module.get('myphysicslab.lab.model.SimObject');
const Spring = goog.module.get('myphysicslab.lab.model.Spring');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Simulation of a ball moving on a roller coaster track, optionally with a spring
attached to the ball. The track can take any shape as defined by a NumericalPath. The
simulation is not functional until a path has been provided with {@link #setPath}.

For derivation equations of motion see <http://www.myphysicslab.com/RollerSimple.html>
and <http://www.myphysicslab.com/RollerSpring.html>.


* @param {boolean=} hasSpring whether the simulation should have a spring attaching
*     the ball to a fixed point.
* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {AbstractODESim}
* @implements {EnergySystem}
* @implements {myphysicslab.sims.roller.HasPath}
* @implements {EventHandler}
*/
myphysicslab.sims.roller.RollerSingleSim = function(hasSpring, opt_name) {
  AbstractODESim.call(this, opt_name);
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  var var_names = [
    RollerSingleSim.en.POSITION,
    RollerSingleSim.en.VELOCITY,
    VarsList.en.TIME,
    RollerSingleSim.en.X_POSITION,
    RollerSingleSim.en.Y_POSITION,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY,
    RollerSingleSim.en.ANCHOR_X,
    RollerSingleSim.en.ANCHOR_Y
  ];
  var i18n_names = [
    RollerSingleSim.i18n.POSITION,
    RollerSingleSim.i18n.VELOCITY,
    VarsList.i18n.TIME,
    RollerSingleSim.i18n.X_POSITION,
    RollerSingleSim.i18n.Y_POSITION,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY,
    RollerSingleSim.i18n.ANCHOR_X,
    RollerSingleSim.i18n.ANCHOR_Y
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(3, 4, 5, 6, 7);
  /**
  * @type {boolean}
  * @private
  */
  this.hasSpring_ = hasSpring || false;
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 9.8;
  /**
  * @type {!PointMass}
  * @private
  */
  this.ball1_ = PointMass.makeCircle(0.3, 'ball1').setMass(0.5);
  this.getSimList().add(this.ball1_);
  /**
  * @type {!PointMass}
  * @private
  */
  this.anchor_ = PointMass.makeSquare(0.4, 'anchor');
  /**
  * @type {!Spring}
  * @private
  */
  this.spring_ = new Spring('spring',
      /*body1=*/this.ball1_, /*attach1_body=*/Vector.ORIGIN,
      /*body2=*/this.anchor_, /*attach2_body=*/Vector.ORIGIN,
      /*restLength=*/1.0, /*stiffness=*/5.0);
  if (this.hasSpring_) {
    this.getSimList().add(this.anchor_, this.spring_);
  }
  /**
  * @type {?NumericalPath }
  * @private
  */
  this.path_ = null;
  /** lowest possible y coordinate of path
  * @type {number}
  * @private
  */
  this.lowestPoint_ = 0;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /**  Temporary scratchpad, to avoid allocation.
  * @type {!PathPoint}
  * @private
  */
  this.pathPoint_ = new PathPoint();
  /**
  * @type {?SimObject}
  * @private
  */
  this.dragObj_ = null;

  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.DAMPING,
      RollerSingleSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.GRAVITY,
      RollerSingleSim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.MASS,
      RollerSingleSim.i18n.MASS,
      goog.bind(this.getMass, this), goog.bind(this.setMass, this)));
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.SPRING_DAMPING,
      RollerSingleSim.i18n.SPRING_DAMPING,
      goog.bind(this.getSpringDamping, this), goog.bind(this.setSpringDamping, this)));
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.SPRING_LENGTH,
      RollerSingleSim.i18n.SPRING_LENGTH,
      goog.bind(this.getSpringLength, this), goog.bind(this.setSpringLength, this)));
  this.addParameter(new ParameterNumber(this, RollerSingleSim.en.SPRING_STIFFNESS,
      RollerSingleSim.i18n.SPRING_STIFFNESS,
      goog.bind(this.getSpringStiffness, this),
      goog.bind(this.setSpringStiffness, this)));
};
var RollerSingleSim = myphysicslab.sims.roller.RollerSingleSim;
goog.inherits(RollerSingleSim, AbstractODESim);

/** @override */
RollerSingleSim.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', ball1_: '+this.ball1_
      +', anchor_: '+this.anchor_
      +', spring_: '+this.spring_
      +', path_: '+this.path_
      +', hasSpring_: '+this.hasSpring_
      +', damping_: '+Util.NF(this.damping_)
      +', gravity_: '+Util.NF(this.gravity_)
      +', lowestPoint_: '+Util.NF(this.lowestPoint_)
      + RollerSingleSim.superClass_.toString.call(this);
};

/** @override */
RollerSingleSim.prototype.getClassName = function() {
  return 'RollerSingleSim';
};

/** @override */
RollerSingleSim.prototype.getPath = function() {
  return this.path_;
};

/** @override */
RollerSingleSim.prototype.setPath = function(path) {
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  var simList = this.getSimList();
  var oldPath = this.path_;
  if (oldPath != null) {
    simList.remove(oldPath);
  }
  this.path_ = path;
  if (0 == 1 && Util.DEBUG)
    console.log('RollerSingleSim.setPath path='+path);
  simList.add(path);
  var r = path.getBoundsWorld();
  var va = this.getVarsList();
  if (this.hasSpring_) {
    // set initial anchor position at top left of path bounds
    va.setValue(8, r.getLeft() + r.getWidth()*0.2); // anchorX
    va.setValue(9, r.getTop() - r.getHeight()*0.4); // anchorY
  }
  this.lowestPoint_ = r.getBottom();
  // find closest starting point to a certain x-y position on screen
  var start = new Vector(r.getLeft() + r.getWidth()*0.1, r.getTop() -r.getHeight()*0.1);
  this.pathPoint_ = path.findNearestGlobal(start);
  va.setValue(0, this.pathPoint_.p); // p
  va.setValue(1, 0); // v
  va.setValue(2, 0); // time
  this.modifyObjects();
  this.saveInitialState();
};

/** @override */
RollerSingleSim.prototype.modifyObjects = function() {
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  if (this.path_ != null) {
    var va = this.getVarsList();
    var vars = va.getValues();
    this.moveObjects(vars);
    var p = this.path_.mod_p(vars[0]);
    if (p != vars[0]) {
      vars[0] = p;
      va.setValue(0, p);
    }
    va.setValue(3, this.path_.map_p_to_x(vars[0]), true);
    va.setValue(4, this.path_.map_p_to_y(vars[0]), true);
    var ei = this.getEnergyInfo_(vars);
    va.setValue(5, ei.getTranslational(), true);
    va.setValue(6, ei.getPotential(), true);
    va.setValue(7, ei.getTotalEnergy(), true);
  }
};

/**
* @param {!Array<number>} vars
* @private
*/
RollerSingleSim.prototype.moveObjects = function(vars) {
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  if (this.path_ != null) {
    this.pathPoint_.p = vars[0];
    this.path_.map_p_to_slope(this.pathPoint_);
    this.ball1_.setPosition(this.pathPoint_);
    this.ball1_.setVelocity(this.pathPoint_.getSlope().multiply(vars[1]));
  }
  if (this.hasSpring_) {
    this.anchor_.setPosition(new Vector(vars[8],  vars[9]));
  }
};

/** @override */
RollerSingleSim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
RollerSingleSim.prototype.getEnergyInfo_ = function(vars) {
  var ke = this.ball1_.getKineticEnergy();
  // gravity potential = m g y
  var pe = this.ball1_.getMass() * this.gravity_ *
      (this.ball1_.getPosition().getY() - this.lowestPoint_);
  if (this.hasSpring_) {
    pe += this.spring_.getPotentialEnergy();
  }
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
RollerSingleSim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @override */
RollerSingleSim.prototype.startDrag = function(simObject, location, offset, dragBody,
    mouseEvent) {
  if (simObject == this.ball1_) {
    this.dragObj_ = simObject;
    return true;
  } else if (simObject == this.anchor_) {
    return true;
  }
  return false;
};

/** @override */
RollerSingleSim.prototype.mouseDrag = function(simObject, location, offset,
    mouseEvent) {
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  var va = this.getVarsList();
  var p = location.subtract(offset);
  if (simObject == this.ball1_ && this.path_ != null)  {
    this.pathPoint_ = this.path_.findNearestGlobal(p);
    va.setValue(0, this.pathPoint_.p);
    va.setValue(1, 0);
    va.incrSequence(3, 4, 5, 6, 7);
  } else if (simObject == this.anchor_) {
    va.setValue(8, p.getX());
    va.setValue(9, p.getY());
  }
  this.moveObjects(va.getValues());
};

/** @override */
RollerSingleSim.prototype.finishDrag = function(simObject, location, offset) {
  this.dragObj_ = null;
};

/** @override */
RollerSingleSim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/** @override */
RollerSingleSim.prototype.evaluate = function(vars, change, timeStep) {
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  Util.zeroArray(change);
  change[2] = 1; // time changes at a rate of 1 by definition.
  if (this.dragObj_ != this.ball1_) {
    // calculate the slope at the given arc-length position on the curve
    // vars[0] is p = path length position.
    // so that we can reference spring position directly
    this.moveObjects(vars);
    change[0] = vars[1];  // p' = v
    // see Mathematica file 'roller.nb' for derivation of the following
    // let k = slope of curve. Then sin(theta) = k/sqrt(1+k^2)
    // Component due to gravity is v' = - g sin(theta) = - g k/sqrt(1+k^2)
    var k = this.pathPoint_.slope;
    var sinTheta = isFinite(k) ? k/Math.sqrt(1+k*k) : 1;
    // v' = - g sin(theta) - (b/m) v= - g k/sqrt(1+k^2) - (b/m) v
    change[1] = -this.gravity_ * this.pathPoint_.direction * sinTheta
        - this.damping_ * vars[1] / this.ball1_.getMass();
    if (this.hasSpring_) {
      var tangent ;
      if (!isFinite(k)) {
        tangent = new Vector(0, k>0 ? 1 : -1, 0);
      } else {
        tangent = new Vector(1, k, 0);
        tangent = tangent.normalize().multiply(this.pathPoint_.direction);
        if (tangent == null)
          throw new Error();
      }
      var force = this.spring_.calculateForces()[0];
      goog.asserts.assert( force.getBody() == this.ball1_);
      var f = force.getVector();
      change[1] += f.dotProduct(tangent) / this.ball1_.getMass();
    }
  }
  return null;
};

/**
@return {number}
*/
RollerSingleSim.prototype.getGravity = function() {
  return this.gravity_;
};

/**
@param {number} value
*/
RollerSingleSim.prototype.setGravity = function(value) {
  this.gravity_ = value;
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(RollerSingleSim.en.GRAVITY);
};

/**
@return {number}
*/
RollerSingleSim.prototype.getDamping = function() {
  return this.damping_;
}

/**
@param {number} value
*/
RollerSingleSim.prototype.setDamping = function(value) {
  this.damping_ = value;
  this.broadcastParameter(RollerSingleSim.en.DAMPING);
}

/**
@return {number}
*/
RollerSingleSim.prototype.getMass = function() {
  return this.ball1_.getMass();
}

/**
@param {number} value
*/
RollerSingleSim.prototype.setMass = function(value) {
  this.ball1_.setMass(value);
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6, 7);
  this.broadcastParameter(RollerSingleSim.en.MASS);
}

/**
@return {number}
*/
RollerSingleSim.prototype.getSpringStiffness = function() {
  return this.spring_.getStiffness();
}

/**
@param {number} value
*/
RollerSingleSim.prototype.setSpringStiffness = function(value) {
  this.spring_.setStiffness(value);
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(RollerSingleSim.en.SPRING_STIFFNESS);
}

/**
@return {number}
*/
RollerSingleSim.prototype.getSpringLength = function() {
  return this.spring_.getRestLength();
}

/**
@param {number} value
*/
RollerSingleSim.prototype.setSpringLength = function(value) {
  this.spring_.setRestLength(value);
  // 0  1    2   3  4   5   6   7     8        9
  // p  v  time  x  y  ke  pe  te  anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(RollerSingleSim.en.SPRING_LENGTH);
}

/**
@return {number}
*/
RollerSingleSim.prototype.getSpringDamping = function() {
  return this.spring_.getDamping();
}

/**
@param {number} value
*/
RollerSingleSim.prototype.setSpringDamping = function(value) {
  this.spring_.setDamping(value);
  this.broadcastParameter(RollerSingleSim.en.SPRING_DAMPING);
}

/** Set of internationalized strings.
@typedef {{
  ANCHOR_X: string,
  ANCHOR_Y: string,
  DAMPING: string,
  GRAVITY: string,
  MASS: string,
  SPRING_DAMPING: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  POSITION: string,
  VELOCITY: string,
  X_POSITION: string,
  Y_POSITION: string
  }}
*/
RollerSingleSim.i18n_strings;

/**
@type {RollerSingleSim.i18n_strings}
*/
RollerSingleSim.en = {
  ANCHOR_X: 'anchor X',
  ANCHOR_Y: 'anchor Y',
  DAMPING: 'damping',
  GRAVITY: 'gravity',
  MASS: 'mass',
  SPRING_DAMPING: 'spring damping',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  POSITION: 'position',
  VELOCITY: 'velocity',
  X_POSITION: 'x position',
  Y_POSITION: 'y position'
};

/**
@private
@type {RollerSingleSim.i18n_strings}
*/
RollerSingleSim.de_strings = {
  ANCHOR_X: 'Anker X',
  ANCHOR_Y: 'Anker Y',
  DAMPING: 'D\u00e4mpfung',
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  SPRING_DAMPING: 'Federd\u00e4mpfung',
  SPRING_LENGTH: 'Federl\u00e4nge',
  SPRING_STIFFNESS: 'Federsteifheit',
  POSITION: 'Position',
  VELOCITY: 'Geschwindigkeit',
  X_POSITION: 'x Position',
  Y_POSITION: 'y Position'
};

/** Set of internationalized strings.
@type {RollerSingleSim.i18n_strings}
*/
RollerSingleSim.i18n = goog.LOCALE === 'de' ? RollerSingleSim.de_strings :
    RollerSingleSim.en;

}); // goog.scope
