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

goog.module('myphysicslab.sims.springs.CollideBlocksSim');

goog.require('goog.array');

const AbstractODESim = goog.require('myphysicslab.lab.model.AbstractODESim');
const BlockCollision = goog.require('myphysicslab.sims.springs.BlockCollision');
const Collision = goog.require('myphysicslab.lab.model.Collision');
const CollisionSim = goog.require('myphysicslab.lab.model.CollisionSim');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Simulation of two blocks moving horizontally between walls, with collisions
between the blocks and walls. One of the blocks is connected to a wall with a spring.
The order of objects left to right is: left wall, block 1, block 2, right wall.

Variables and Parameters
-------------------------------
Variables:

    vars[0] = position (x) with origin at right edge of wall
    vars[1] = velocity (v=x')
    vars[2] = x1 position of mass 2
    vars[3] = velocity of mass 2

Parameters:

    R = rest length
    S1 = left end of spring
    S2 = right end of spring (same as x?)
    len = current length of spring = x - S1.getX()
    L = how much spring is stretched from rest length
    L = len - R = x - S1.getX() - R
    k = spring constant
    b = damping constant

Equations Of Motion
-----------------------------
See also <http://www.myphysicslab.com/collideSpring.html>.

Spring force and damping look like this:

    F = -k L -b v = -k (x - S1.getX() - R) - b v = m v'

So equations of motion are:

    x' = v
    v' = -(k/m)(x - S1.getX() - R) -(b/m) v

Collision Handling
-----------------------------
When colliding with a wall, just reverse the velocity.

When the two blocks collide, adjust the velocities of particles as follows:

    Let vcm = velocity of center of mass of block 1 and 2.
    Let v1 = velocity of block 1 before collision
    Let v1_after = velocity of block 1 after collision

To find new velocity of block 1, find the velocity in the center of mass frame
and reflect it.  This works out to `-v1 + 2 vcm`. Here's the derivation:

    Velocity of block 1 in cm frame is v1 - vcm.

In center of mass frame, total momentum is zero; after collision momentum is
preserved; so we just reverse signs of each velocity in cm frame.
Reflection of velocity is

    -(v1 - vcm) = vcm - v1

Add back `vcm` to get to laboratory frame:

    v1_after = vcm + (vcm - v1) = 2 vcm - v1

Same derivation applies for block 2.

To Do
-----------------------------
Elasticity parameter.

* @implements {EventHandler}
* @implements {EnergySystem}
* @implements {CollisionSim}
*/
class CollideBlocksSim extends AbstractODESim {
/**
* @param {string=} opt_name name of this as a Subject
*/
constructor(opt_name) {
  super(opt_name);
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0;
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  var var_names = [
    CollideBlocksSim.en.POSITION_1,
    CollideBlocksSim.en.VELOCITY_1,
    CollideBlocksSim.en.POSITION_2,
    CollideBlocksSim.en.VELOCITY_2,
    VarsList.en.TIME,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY
  ];
  var i18n_names = [
    CollideBlocksSim.i18n.POSITION_1,
    CollideBlocksSim.i18n.VELOCITY_1,
    CollideBlocksSim.i18n.POSITION_2,
    CollideBlocksSim.i18n.VELOCITY_2,
    VarsList.i18n.TIME,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_SIM'));
  this.getVarsList().setComputed(5, 6, 7);
  /**
  * @type {!PointMass}
  * @private
  */
  this.wallLeft_ = PointMass.makeRectangle(0.4, 4, 'wallLeft')
      .setMass(Util.POSITIVE_INFINITY);
  this.wallLeft_.setPosition(new Vector(-0.2,  0));
  /**
  * @type {!PointMass}
  * @private
  */
  this.wallRight_ = PointMass.makeRectangle(0.4, 4, 'wallRight')
      .setMass(Util.POSITIVE_INFINITY);
  this.wallRight_.setPosition(new Vector(7.2,  0));
  /**
  * @type {!PointMass}
  * @private
  */
  this.block1_ = PointMass.makeSquare(0.6, 'block1').setMass(0.5);
  /**
  * @type {!PointMass}
  * @private
  */
  this.block2_ = PointMass.makeSquare(0.6, 'block2').setMass(1.5);
  /**
  * @type {!Spring}
  * @private
  */
  this.spring1_ = new Spring('spring1', /*body1=*/this.wallLeft_,
      /*attach1_body=*/ new Vector(this.wallLeft_.getWidth()/2, 0),
      /*body2=*/this.block1_, /*attach2_body=*/ Vector.ORIGIN,
      /*restlength=*/2.5, /*stiffness=*/6.0);
  /**
  * @type {!Spring}
  * @private
  */
  this.spring2_ = new Spring('spring2', /*body1=*/this.wallRight_,
      /*attach1_body=*/ new Vector(-this.wallRight_.getWidth()/2, 0),
      /*body2=*/this.block2_, /*attach2_body=*/ Vector.ORIGIN,
      /*restlength=*/2.5, /*stiffness=*/0);
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /** Function to paint canvases, for debugging. If defined, this will be called within
  * `moveObjects()` so you can see the simulation state after each
  * time step (you will need to arrange your debugger to pause after
  * each invocation of debugPaint_ to see the state).
  * @type {?function():undefined}
  * @private
  */
  this.debugPaint_ = null;
  /**
  * @type {boolean}
  * @private
  */
  this.isDragging = false;
  this.getVarsList().setValues([0.5, 0, 3, 0]);
  this.saveInitialState();
  this.getSimList().add(this.wallLeft_, this.wallRight_, this.spring1_, this.spring2_,
      this.block1_, this.block2_);
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.MASS_1,
      CollideBlocksSim.i18n.MASS_1,
      goog.bind(this.getMass1, this), goog.bind(this.setMass1, this)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.MASS_2,
      CollideBlocksSim.i18n.MASS_2,
      goog.bind(this.getMass2, this), goog.bind(this.setMass2, this)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.LENGTH_1,
      CollideBlocksSim.i18n.LENGTH_1,
      goog.bind(this.getSpring1Length, this), goog.bind(this.setSpring1Length, this)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.STIFFNESS_1,
      CollideBlocksSim.i18n.STIFFNESS_1,
      goog.bind(this.getSpring1Stiffness, this),
      goog.bind(this.setSpring1Stiffness, this)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.LENGTH_2,
      CollideBlocksSim.i18n.LENGTH_2,
      goog.bind(this.getSpring2Length, this), goog.bind(this.setSpring2Length, this)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.STIFFNESS_2,
      CollideBlocksSim.i18n.STIFFNESS_2,
      goog.bind(this.getSpring2Stiffness, this),
      goog.bind(this.setSpring2Stiffness, this)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.DAMPING,
      CollideBlocksSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', block1_: '+this.block1_
      +', block2_: '+this.block2_
      +', wallLeft_: '+this.wallLeft_
      +', wallRight_: '+this.wallRight_
      +', spring1_: '+this.spring1_
      +', spring2_: '+this.spring2_
      + super.toString();
};

/** @override */
getClassName() {
  return 'CollideBlocksSim';
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
  var ke = this.block1_.getKineticEnergy() + this.block2_.getKineticEnergy();
  var pe = this.spring1_.getPotentialEnergy() + this.spring2_.getPotentialEnergy();
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
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  var ei = this.getEnergyInfo_(vars);
  vars[5] = ei.getTranslational();
  vars[6] = ei.getPotential();
  vars[7] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
* @param {!Array<number>} vars
* @return {undefined}
* @private
*/
moveObjects(vars) {
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  this.block1_.setPosition(new Vector(vars[0],  0));
  this.block1_.setVelocity(new Vector(vars[1], 0, 0));
  this.block2_.setPosition(new Vector(vars[2],  0));
  this.block2_.setVelocity(new Vector(vars[3], 0, 0));
  if (this.debugPaint_ != null) {
    this.debugPaint_();
  }
};

/** @override */
setDebugPaint(fn) {
  this.debugPaint_ = fn;
};

/** @override */
startDrag(simObject, location, offset, dragBody,
    mouseEvent) {
  if (simObject == this.block1_ || simObject == this.block2_) {
    this.isDragging = true;
    return true;
  } else {
    return false;
  }
};

/** @override */
mouseDrag(simObject, location, offset, mouseEvent) {
  // maintain gap between objects, to avoid stuck collision problems.
  var gap = 0.02;
  var va = this.getVarsList();
  var vars = va.getValues();
  var p = location.subtract(offset);
  // objects other than mass 1 and mass 2 are not allowed to be dragged
  if (simObject == this.block1_)  {
    var x = p.getX();
    if (x - this.block1_.getWidth()/2 < this.wallLeft_.getRightWorld() + gap) {
      // don't allow drag past wallLeft
      x = this.wallLeft_.getRightWorld() + this.block1_.getWidth()/2 + gap;
    }
    if (x + this.block1_.getWidth()/2 + this.block2_.getWidth() >
        this.wallRight_.getLeftWorld() - 2*gap) {
      // don't drag past wallRight
      x = this.wallRight_.getLeftWorld() - this.block2_.getWidth() -
          this.block1_.getWidth()/2 - 2*gap;
    }
    if (x+this.block1_.getWidth()/2 > this.block2_.getLeftWorld() - gap) {
      // move other block
      this.block2_.setPosition(new Vector(x + this.block1_.getWidth()/2 +
          this.block2_.getWidth()/2 + gap, 0));
    }
    // 0   1    2   3   4    5   6   7
    // x1, v1, x2, v2, time, KE, PE, TE
    vars[0] = x;
    vars[1] = 0;
    vars[2] = this.block2_.getPosition().getX();
    vars[3] = 0;
    va.setValues(vars);
  } else if (simObject == this.block2_) {
    var x = p.getX();
    if (x + this.block2_.getWidth()/2 > this.wallRight_.getLeftWorld() - gap) {
      // don't allow drag past wallRight
      x = this.wallRight_.getLeftWorld() - this.block2_.getWidth()/2 - gap;
    }
    if (x - this.block2_.getWidth()/2 - this.block1_.getWidth() <
        this.wallLeft_.getRightWorld() + 2*gap) {
      // don't allow drag past wallLeft
      x = this.wallLeft_.getRightWorld() + this.block1_.getWidth() +
          this.block2_.getWidth()/2 + 2*gap;
    }
    if (x - this.block2_.getWidth()/2 < this.block1_.getRightWorld() + gap) {
      this.block1_.setPosition(new Vector(x - this.block2_.getWidth()/2 -
          this.block1_.getWidth()/2 - gap, 0));
    }
    // 0   1    2   3   4    5   6   7
    // x1, v1, x2, v2, time, KE, PE, TE
    vars[0] = this.block1_.getPosition().getX();
    vars[1] = 0;
    vars[2] = x;
    vars[3] = 0;
    va.setValues(vars);
  }
  this.moveObjects(vars);
};

/** @override */
finishDrag(simObject, location, offset) {
  this.isDragging = false;
};

/** @override */
handleKeyEvent(keyCode, pressed, keyEvent) {
};

/**
* @param {!Array<!Collision>} collisions
* @param {!PointMass} leftBlock
* @param {!PointMass} rightBlock
* @param {number} time
* @private
*/
addCollision(collisions, leftBlock, rightBlock, time) {
  var c = new BlockCollision(leftBlock, rightBlock, time);
  if (c.getDistance() < 0.1) {
    // Avoid adding a duplicate collision.
    // Is there already an equivalent collision?
    var similar = goog.array.find(collisions, function(element, index, array) {
      return c.similarTo(/** @type {!BlockCollision}*/(element));
    });
    if (similar) {
      var c2 = /** @type {!BlockCollision}*/(similar);
      // Pick the collision with smaller distance, or the needsHandling flag
      if (!c2.needsHandling() && c.getDistance() < c2.getDistance()) {
        goog.array.remove(collisions, c2);
        collisions.push(c);
      }
    } else {
      collisions.push(c);
    }
  }
};

/** @override */
findCollisions(collisions, vars, stepSize) {
  // Assumes only 3 possible collisions.
  this.moveObjects(vars);
  var time = this.getTime() + stepSize;
  this.addCollision(collisions, this.wallLeft_, this.block1_, time);
  this.addCollision(collisions, this.block1_, this.block2_, time);
  this.addCollision(collisions, this.block2_, this.wallRight_, time);
};

/** @override */
handleCollisions(collisions, opt_totals) {
  var va = this.getVarsList();
  var seq0 = va.getVariable(0).getSequence();
  var seq2 = va.getVariable(2).getSequence();
  var vars = va.getValues();
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  goog.array.forEach(collisions, function(collision) {
    var c = /** @type {!BlockCollision} */(collision);
    if (c.leftBlock_ == this.wallLeft_ && c.rightBlock_ == this.block1_) {
      // mass1 collided with left wall, so just reverse the velocity
      c.impulse = Math.abs(vars[1] * this.block1_.getMass());
      va.setValue(1, -vars[1]);
    } else if (c.rightBlock_ == this.wallRight_ && c.leftBlock_ == this.block2_) {
      // mass2 collided with right wall, so just reverse the velocity
      c.impulse = Math.abs(vars[3] * this.block2_.getMass());
      va.setValue(3, -vars[3]);
    } else if (c.leftBlock_ == this.block1_ && c.rightBlock_ == this.block2_) {
      // mass1 and mass2 collided.
      // Find velocity of center of mass.
      var vcm = (this.block1_.getMass()*vars[1] + this.block2_.getMass()*vars[3]) /
         (this.block1_.getMass() + this.block2_.getMass());
      c.impulse = Math.abs(2*(vcm - vars[3]) * this.block2_.getMass());
      va.setValue(1, -vars[1] + 2*vcm);
      va.setValue(3, -vars[3] + 2*vcm);
    } else {
      throw new Error('illegal collision '+c);
    }
    if (opt_totals) {
      opt_totals.addImpulses(1);
    }
  }, this);
  goog.asserts.assert(va.getVariable(0).getSequence() == seq0);
  goog.asserts.assert(va.getVariable(2).getSequence() == seq2);
  return true;
};

/** @override */
evaluate(vars, change, timeStep) {
  Util.zeroArray(change);
  change[4] = 1.0;  // time
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  this.moveObjects(vars);
  if (!this.isDragging) {
    change[0] = vars[1]; // x' = v
    // v' = -(k/m)(x - S1.getX() - R) - (damping/m) v
    change[1] = (-this.spring1_.getStiffness() * this.spring1_.getStretch() -
        this.damping_ * vars[1]) / this.block1_.getMass();
    change[2] = vars[3]; // x' = v
    // v' = 0 because constant velocity
    change[3] = (this.spring2_.getStiffness() * this.spring2_.getStretch() -
        this.damping_ * vars[3]) / this.block2_.getMass();
  }
  return null;
};

/**
* @return {number}
*/
getMomentum() {
  this.modifyObjects();
  var m1 = this.block1_.getVelocity().multiply(this.block1_.getMass());
  var m2 = this.block2_.getVelocity().multiply(this.block2_.getMass());
  return m1.add(m2).length();
};

/**
* @return {number}
*/
getMass1() {
  return this.block1_.getMass();
};

/**
* @param {number} value
*/
setMass1(value) {
  this.block1_.setMass(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6, 7);
  this.broadcastParameter(CollideBlocksSim.en.MASS_1);
};

/**
* @return {number}
*/
getMass2() {
  return this.block2_.getMass();
};

/**
* @param {number} value
*/
setMass2(value) {
  this.block2_.setMass(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(5, 6, 7);
  this.broadcastParameter(CollideBlocksSim.en.MASS_2);
};

/**
* @return {number}
*/
getDamping() {
  return this.damping_;
};

/**
* @param {number} value
*/
setDamping(value) {
  this.damping_ = value;
  this.broadcastParameter(CollideBlocksSim.en.DAMPING);
};

/**
* @return {number}
*/
getSpring1Stiffness() {
  return this.spring1_.getStiffness();
};

/**
* @param {number} value
*/
setSpring1Stiffness(value) {
  this.spring1_.setStiffness(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(CollideBlocksSim.en.STIFFNESS_1);
};

/**
* @return {number}
*/
getSpring1Length() {
  return this.spring1_.getRestLength();
};

/**
* @param {number} value
*/
setSpring1Length(value) {
  this.spring1_.setRestLength(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(CollideBlocksSim.en.LENGTH_1);
};

/**
* @return {number}
*/
getSpring2Stiffness() {
  return this.spring2_.getStiffness();
};

/**
* @param {number} value
*/
setSpring2Stiffness(value) {
  this.spring2_.setStiffness(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(CollideBlocksSim.en.STIFFNESS_2);
};

/**
* @return {number}
*/
getSpring2Length() {
  return this.spring2_.getRestLength();
};

/**
* @param {number} value
*/
setSpring2Length(value) {
  this.spring2_.setRestLength(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(6, 7);
  this.broadcastParameter(CollideBlocksSim.en.LENGTH_2);
};

} // end class

/** Set of internationalized strings.
@typedef {{
  ACCELERATION: string,
  DAMPING: string,
  MASS_1: string,
  MASS_2: string,
  POSITION_1: string,
  POSITION_2: string,
  LENGTH_1: string,
  STIFFNESS_1: string,
  LENGTH_2: string,
  STIFFNESS_2: string,
  VELOCITY_1: string,
  VELOCITY_2: string
  }}
*/
CollideBlocksSim.i18n_strings;

/**
@type {CollideBlocksSim.i18n_strings}
*/
CollideBlocksSim.en = {
  ACCELERATION: 'acceleration',
  DAMPING: 'damping',
  MASS_1: 'mass 1',
  MASS_2: 'mass 2',
  POSITION_1: 'position 1',
  POSITION_2: 'position 2',
  LENGTH_1: 'spring 1 length',
  STIFFNESS_1: 'spring 1 stiffness',
  LENGTH_2: 'spring 2 length',
  STIFFNESS_2: 'spring 2 stiffness',
  VELOCITY_1: 'velocity 1',
  VELOCITY_2: 'velocity 2'
};

/**
@private
@type {CollideBlocksSim.i18n_strings}
*/
CollideBlocksSim.de_strings = {
  ACCELERATION: 'Beschleunigung',
  DAMPING: 'D\u00e4mpfung',
  MASS_1: 'Masse 1',
  MASS_2: 'Masse 2',
  POSITION_1: 'Position 1',
  POSITION_2: 'Position 2',
  LENGTH_1: 'Feder 1 L\u00e4nge',
  STIFFNESS_1: 'Feder 1 Steifigkeit',
  LENGTH_2: 'Feder 2 L\u00e4nge',
  STIFFNESS_2: 'Feder 2 Steifigkeit',
  VELOCITY_1: 'Geschwindigkeit 1',
  VELOCITY_2: 'Geschwindigkeit 2'
};

/** Set of internationalized strings.
@type {CollideBlocksSim.i18n_strings}
*/
CollideBlocksSim.i18n = goog.LOCALE === 'de' ? CollideBlocksSim.de_strings :
    CollideBlocksSim.en;

exports = CollideBlocksSim;
