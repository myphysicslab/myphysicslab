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

goog.provide('myphysicslab.sims.roller.RollerDoubleSim');

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
var EnergyInfo = myphysicslab.lab.model.EnergyInfo;
var EnergySystem = myphysicslab.lab.model.EnergySystem;
var EventHandler = myphysicslab.lab.app.EventHandler;
var HasPath = myphysicslab.sims.roller.HasPath;
var NumericalPath = myphysicslab.lab.model.NumericalPath;
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const PathPoint = goog.module.get('myphysicslab.lab.model.PathPoint');
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
const SimObject = goog.module.get('myphysicslab.lab.model.SimObject');
const Spring = goog.module.get('myphysicslab.lab.model.Spring');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Simulation of 2 balls along a curved roller coaster track, with a spring connecting
them.

For derivation equations of motion see <http://www.myphysicslab.com/RollerSimple.html>,
<http://www.myphysicslab.com/RollerSpring.html> and
<http://www.myphysicslab.com/RollerDouble.html>.

Variables Array
-------------------------

The variables are stored in the VarsList as follows

    vars[0] = p1  -- position of ball 1, measured as distance along track.
    vars[1] = v1  -- velocity of ball 1
    vars[2] = p2  -- position of ball 2, measured as distance along track.
    vars[3] = v2  -- velocity of ball 2

The simulation is not functional until a path has been provided with {@link #setPath}.

* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {AbstractODESim}
* @implements {HasPath}
* @implements {EnergySystem}
* @implements {EventHandler}
*/
myphysicslab.sims.roller.RollerDoubleSim = function(opt_name) {
  AbstractODESim.call(this, opt_name);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  var var_names = [
    RollerDoubleSim.en.POSITION_1,
    RollerDoubleSim.en.VELOCITY_1,
    RollerDoubleSim.en.POSITION_2,
    RollerDoubleSim.en.VELOCITY_2,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY,
    VarsList.en.TIME
  ];
  var i18n_names = [
    RollerDoubleSim.i18n.POSITION_1,
    RollerDoubleSim.i18n.VELOCITY_1,
    RollerDoubleSim.i18n.POSITION_2,
    RollerDoubleSim.i18n.VELOCITY_2,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(4, 5, 6);
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0.001;
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
  /**
  * @type {!PointMass}
  * @private
  */
  this.ball2_ = PointMass.makeCircle(0.3, 'ball2').setMass(0.5);
  /**
  * @type {!Spring}
  * @private
  */
  this.spring_ = new Spring('spring',
      this.ball1_, Vector.ORIGIN,
      this.ball2_, Vector.ORIGIN,
      /*restLength=*/2.0, /*stiffness=*/6.0);
  this.getSimList().add(this.ball1_, this.ball2_, this.spring_);
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
  this.pathPoint1_ = new PathPoint();
  /**  Temporary scratchpad, to avoid allocation.
  * @type {!PathPoint}
  * @private
  */
  this.pathPoint2_ = new PathPoint();
  /**
  * @type {?SimObject}
  * @private
  */
  this.dragObj_ = null;
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.DAMPING,
      RollerDoubleSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.GRAVITY,
      RollerDoubleSim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.MASS_1,
      RollerDoubleSim.i18n.MASS_1,
      goog.bind(this.getMass1, this), goog.bind(this.setMass1, this)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.MASS_2,
      RollerDoubleSim.i18n.MASS_2,
      goog.bind(this.getMass2, this), goog.bind(this.setMass2, this)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.SPRING_DAMPING,
      RollerDoubleSim.i18n.SPRING_DAMPING,
      goog.bind(this.getSpringDamping, this), goog.bind(this.setSpringDamping, this)));
  this.addParameter(new ParameterNumber(this, RollerDoubleSim.en.SPRING_LENGTH,
      RollerDoubleSim.i18n.SPRING_LENGTH,
      goog.bind(this.getSpringLength, this), goog.bind(this.setSpringLength, this)));
  this.addParameter(new ParameterNumber(this,
      RollerDoubleSim.en.SPRING_STIFFNESS,
      RollerDoubleSim.i18n.SPRING_STIFFNESS,
      goog.bind(this.getSpringStiffness, this),
      goog.bind(this.setSpringStiffness, this)));
};
var RollerDoubleSim = myphysicslab.sims.roller.RollerDoubleSim;
goog.inherits(RollerDoubleSim, AbstractODESim);

/** @override */
RollerDoubleSim.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', ball1_: '+this.ball1_
      +', ball2_: '+this.ball2_
      +', spring_: '+this.spring_
      +', path_: '+this.path_
      +', damping_: '+Util.NF(this.damping_)
      +', gravity_: '+Util.NF(this.gravity_)
      +', lowestPoint_: '+Util.NF(this.lowestPoint_)
      + RollerDoubleSim.superClass_.toString.call(this);
};

/** @override */
RollerDoubleSim.prototype.getClassName = function() {
  return 'RollerDoubleSim';
};

/** @override */
RollerDoubleSim.prototype.getPath = function() {
  return this.path_;
};

/** @override */
RollerDoubleSim.prototype.setPath = function(path) {
  var simList = this.getSimList();
  var oldPath = this.path_;
  if (oldPath != null) {
    simList.remove(oldPath);
  }
  this.path_ = path;
  simList.add(path);
  var r = path.getBoundsWorld();
  this.lowestPoint_ = r.getBottom();
  // find closest starting point to a certain x-y position on screen
  var start1 = new Vector(r.getLeft() + r.getWidth()*0.1,
      r.getTop() - r.getHeight()*0.1);
  this.pathPoint1_ = path.findNearestGlobal(start1);
  var start2 = new Vector(r.getLeft() + r.getWidth()*0.2,
      r.getTop() - r.getHeight()*0.3);
  this.pathPoint2_ = path.findNearestGlobal(start2);
  this.getVarsList().setValues([this.pathPoint1_.p, 0, this.pathPoint2_.p, 0]);
  this.saveInitialState();
};

/** @override */
RollerDoubleSim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  if (this.path_ != null) {
    var p = this.path_.mod_p(vars[0]);
    if (p != vars[0]) {
      vars[0] = p;
      va.setValue(0, p);
    }
    var p2 = this.path_.mod_p(vars[2]);
    if (p2 != vars[2]) {
      vars[2] = p2;
      va.setValue(2, p2);
    }
    var ei = this.getEnergyInfo_(vars);
    va.setValue(4, ei.getTranslational(), true);
    va.setValue(5, ei.getPotential(), true);
    va.setValue(6, ei.getTotalEnergy(), true);
  }
};

/**
* @param {!Array<number>} vars
* @private
*/
RollerDoubleSim.prototype.moveObjects = function(vars) {
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  if (this.path_ != null) {
    var pp1 = this.pathPoint1_;
    var pp2 = this.pathPoint2_;
    pp1.p = vars[0];
    pp2.p = vars[2];
    this.path_.map_p_to_slope(pp1);
    this.path_.map_p_to_slope(pp2);
    this.ball1_.setPosition(pp1);
    this.ball2_.setPosition(pp2);
    this.ball1_.setVelocity(pp1.getSlope().multiply(vars[1]));
    this.ball2_.setVelocity(pp2.getSlope().multiply(vars[3]));
  }
};

/** @override */
RollerDoubleSim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
RollerDoubleSim.prototype.getEnergyInfo_ = function(vars) {
  var ke = this.ball1_.getKineticEnergy() + this.ball2_.getKineticEnergy();
  // gravity potential = m g y
  var pe = this.ball1_.getMass() * this.gravity_
      * (this.ball1_.getPosition().getY() - this.lowestPoint_);
  pe += this.ball2_.getMass() * this.gravity_
      * (this.ball2_.getPosition().getY() - this.lowestPoint_);
  pe += this.spring_.getPotentialEnergy();
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
RollerDoubleSim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @override */
RollerDoubleSim.prototype.startDrag = function(simObject, location, offset, dragBody,
    mouseEvent) {
  if (simObject == this.ball1_) {
    this.dragObj_ = simObject;
    return true;
  } else if (simObject == this.ball2_) {
    this.dragObj_ = simObject;
    return true;
  }
  return false;
};

/** @override */
RollerDoubleSim.prototype.mouseDrag = function(simObject, location, offset,
    mouseEvent) {
  if (this.path_ == null)
    return;
  var va = this.getVarsList();
  var p = location.subtract(offset);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  if (simObject==this.ball1_)  {
    this.pathPoint1_ = this.path_.findNearestGlobal(p);
    va.setValue(0, this.pathPoint1_.p);
    va.setValue(1, 0);
    va.incrSequence(4, 5, 6);
  } else if (simObject==this.ball2_)  {
    this.pathPoint2_ = this.path_.findNearestGlobal(p);
    va.setValue(2, this.pathPoint2_.p);
    va.setValue(3, 0);  // velocity
    va.incrSequence(4, 5, 6);
  }
  this.moveObjects(va.getValues());
};

/** @override */
RollerDoubleSim.prototype.finishDrag = function(simObject, location, offset) {
  this.dragObj_ = null;
};

/** @override */
RollerDoubleSim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/** @override */
RollerDoubleSim.prototype.evaluate = function(vars, change, timeStep) {
  Util.zeroArray(change);
  change[7] = 1; // time
  // calculate the slope at the given arc-length position on the curve
  // vars[0] is p = path length position.
  // move objects to position so that we can get force from spring
  this.moveObjects(vars); // also updates pathPoint1_, pathPoint2_
  var springForces = this.spring_.calculateForces();
  var k, sinTheta, tangent, force, f;
  if (this.dragObj_ != this.ball1_) {
    // FIRST BALL.
    change[0] = vars[1];  // p1' = v1
    // see Mathematica file 'roller.nb' for derivation of the following
    // let k = slope of curve. Then sin(theta) = k/sqrt(1+k^2)
    // Component due to gravity is v' = - g sin(theta) = - g k/sqrt(1+k^2)
    k = this.pathPoint1_.slope;
    sinTheta = isFinite(k) ? k/Math.sqrt(1+k*k) : 1;
    // v' = - g sin(theta) - (b/m) v= - g k/sqrt(1+k^2) - (b/m) v
    change[1] = -this.gravity_ * this.pathPoint1_.direction * sinTheta
        - this.damping_ * vars[1] / this.ball1_.getMass();
    // spring force
    if (!isFinite(k)) {
      tangent = new Vector(0, k>0 ? 1 : -1, 0);
    } else {
      tangent = new Vector(1, k, 0);
      tangent = tangent.normalize().multiply(this.pathPoint1_.direction);
      if (tangent == null)
        throw new Error();
    }
    force = springForces[0];
    goog.asserts.assert( force.getBody() == this.ball1_);
    f = force.getVector();
    change[1] += f.dotProduct(tangent) / this.ball1_.getMass();
  }

  if (this.dragObj_ != this.ball2_) {
    // SECOND BALL
    change[2] = vars[3];  // p2' = v2
    k = this.pathPoint2_.slope;
    sinTheta = isFinite(k) ? k/Math.sqrt(1+k*k) : 1;
    // v' = - g sin(theta) - (b/m) v= - g k/sqrt(1+k^2) - (b/m) v
    change[3] = -this.gravity_ * this.pathPoint2_.direction * sinTheta
        - this.damping_ * vars[3] / this.ball2_.getMass();
    // spring force
    if (!isFinite(k)) {
      tangent = new Vector(0, k>0 ? 1 : -1, 0);
    } else {
      tangent = new Vector(1, k, 0);
      tangent = tangent.normalize().multiply(this.pathPoint2_.direction);
      if (tangent == null)
        throw new Error();
    }
    force = springForces[1];
    goog.asserts.assert( force.getBody() == this.ball2_);
    f = force.getVector();
    change[3] += f.dotProduct(tangent) / this.ball2_.getMass();
  }
  return null;
};

/**
@return {number}
*/
RollerDoubleSim.prototype.getGravity = function() {
  return this.gravity_;
};

/**
@param {number} value
*/
RollerDoubleSim.prototype.setGravity = function(value) {
  this.gravity_ = value;
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6);
  this.broadcastParameter(RollerDoubleSim.en.GRAVITY);
};

/**
@return {number}
*/
RollerDoubleSim.prototype.getDamping = function() {
  return this.damping_;
}

/**
@param {number} value
*/
RollerDoubleSim.prototype.setDamping = function(value) {
  this.damping_ = value;
  this.broadcastParameter(RollerDoubleSim.en.DAMPING);
}

/**
@return {number}
*/
RollerDoubleSim.prototype.getMass1 = function() {
  return this.ball1_.getMass();
}

/**
@param {number} value
*/
RollerDoubleSim.prototype.setMass1 = function(value) {
  this.ball1_.setMass(value);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6);
  this.broadcastParameter(RollerDoubleSim.en.MASS_1);
}

/**
@return {number}
*/
RollerDoubleSim.prototype.getMass2 = function() {
  return this.ball2_.getMass();
}

/**
@param {number} value
*/
RollerDoubleSim.prototype.setMass2 = function(value) {
  this.ball2_.setMass(value);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(4, 5, 6);
  this.broadcastParameter(RollerDoubleSim.en.MASS_2);
}

/**
@return {number}
*/
RollerDoubleSim.prototype.getSpringStiffness = function() {
  return this.spring_.getStiffness();
}

/**
@param {number} value
*/
RollerDoubleSim.prototype.setSpringStiffness = function(value) {
  this.spring_.setStiffness(value);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6);
  this.broadcastParameter(RollerDoubleSim.en.SPRING_STIFFNESS);
}

/**
@return {number}
*/
RollerDoubleSim.prototype.getSpringLength = function() {
  return this.spring_.getRestLength();
}

/**
@param {number} value
*/
RollerDoubleSim.prototype.setSpringLength = function(value) {
  this.spring_.setRestLength(value);
  //  0   1   2   3   4   5   6   7
  // p1, v1, p2, v2, ke, pe, te, time
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6);
  this.broadcastParameter(RollerDoubleSim.en.SPRING_LENGTH);
}

/**
@return {number}
*/
RollerDoubleSim.prototype.getSpringDamping = function() {
  return this.spring_.getDamping();
}

/**
@param {number} value
*/
RollerDoubleSim.prototype.setSpringDamping = function(value) {
  this.spring_.setDamping(value);
  this.broadcastParameter(RollerDoubleSim.en.SPRING_DAMPING);
}

/** Set of internationalized strings.
@typedef {{
  DAMPING: string,
  GRAVITY: string,
  MASS_1: string,
  MASS_2: string,
  POSITION_1: string,
  POSITION_2: string,
  SPRING_DAMPING: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  VELOCITY_1: string,
  VELOCITY_2: string
  }}
*/
RollerDoubleSim.i18n_strings;

/**
@type {RollerDoubleSim.i18n_strings}
*/
RollerDoubleSim.en = {
  DAMPING: 'damping',
  GRAVITY: 'gravity',
  MASS_1: 'mass-1',
  MASS_2: 'mass-2',
  POSITION_1: 'position-1',
  POSITION_2: 'position-2',
  SPRING_DAMPING: 'spring damping',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  VELOCITY_1: 'velocity-1',
  VELOCITY_2: 'velocity-2'
};

/**
@private
@type {RollerDoubleSim.i18n_strings}
*/
RollerDoubleSim.de_strings = {
  DAMPING: 'D\u00e4mpfung',
  GRAVITY: 'Gravitation',
  MASS_1: 'Masse-1',
  MASS_2: 'Masse-2',
  POSITION_1: 'Position-1',
  POSITION_2: 'Position-2',
  SPRING_DAMPING: 'Federd\u00e4mpfung',
  SPRING_LENGTH: 'Federl\u00e4nge',
  SPRING_STIFFNESS: 'Federsteifheit',
  VELOCITY_1: 'Geschwindigkeit-1',
  VELOCITY_2: 'Geschwindigkeit-2'
};

/** Set of internationalized strings.
@type {RollerDoubleSim.i18n_strings}
*/
RollerDoubleSim.i18n = goog.LOCALE === 'de' ? RollerDoubleSim.de_strings :
    RollerDoubleSim.en;

}); // goog.scope
