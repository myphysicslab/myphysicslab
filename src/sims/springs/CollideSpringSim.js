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

goog.module('myphysicslab.sims.springs.CollideSpringSim');

goog.require('goog.asserts');
goog.require('goog.array');

const AbstractODESim = goog.require('myphysicslab.lab.model.AbstractODESim');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const MutableVector = goog.require('myphysicslab.lab.util.MutableVector');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Simulation of one to three blocks moving freely in one dimension, with springs
attached to the blocks, and walls on either end.

History
--------------------

This was originally created to investigate collision schemes for the rigid
body simulation, like serial or simultaneous collision handling. One idea for how to
handle collisions is to insert springs at each collision point, and I tried a version of
this in RigidBodySim. But the collisions were not behaving the way I expected. So I made
this simulation to check how a simplified collision with stiff springs behaves. Indeed,
this simulation shows that these spring based collisions are far from the 'ideal'
collision behavior. That 'ideal' collision behavior includes things like:

1. if block A hits stationary block B of equal mass, then block A should be
stationary, and block B is moving with same velocity.

2. if block A hits stationary blocks B and C (where B and C are motionless in resting
contact), then block C should be the only one moving after the collision and A and B
should be in resting contact.

My conclusion was that spring forces were not the right way to go for handling
collisions in the rigid body simulation. However, I've learned some things from this
simulation since then:

+ extremely short springs (short rest length) requires very high stiffness. Otherwise,
the blocks just pass thru. I think it is because a spring takes some time/distance for
the force to operate and if moving too fast for the length then there is not enough
time/distance. You also have to use short time step.

+ high stiffness (60) with short times step (0.001) and a small gap (0.1) between
blocks/springs somewhat satisfies the ideal collision behaviors described above. This is
with low mass of 0.1, and no damping.

To Do
------------------------

Add AdaptiveStepSolver to choices for DiffEqSolver; does it work better in
terms of having constant energy? Otherwise, the stiff springs seem to give energy
fluctuations with regular step size of 0.025; if you reduce to a very small time step of
0.0005, then the energy is fairly constant. But that's wasteful of using many tiny steps
during most of the time when the springs aren't engaging.

* @implements {EnergySystem}
* @implements {EventHandler}
*/
class CollideSpringSim extends AbstractODESim {
/**
* @param {string=} opt_name name of this as a Subject
*/
constructor(opt_name) {
  super(opt_name);
  /** index of the block being dragged, or -1 when no drag is happening
  * @type {number}
  * @private
  */
  this.dragIdx_ = -1;
  /** object that represents mouse position while dragging.  Note that we don't add
  * the mouse object to the SimList and therefore don't make a DisplayObject for it.
  * @type {!PointMass}
  * @private
  */
  this.mouse_ = PointMass.makeCircle(0.5, 'mouse')
      .setMass(Util.POSITIVE_INFINITY);
  /** the spring dragging the block
  * @type {?Spring}
  * @private
  */
  this.dragSpring_ = null;
  /**
  * @type {number}
  * @private
  */
  this.mass_ = 0.1;
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.restLength_ = 1.0;
  /**
  * @type {number}
  * @private
  */
  this.blockWidth_ = 0.6;
  /**
  * @type {number}
  * @private
  */
  this.stiffness_ = 60.0;
  /**
  * @type {number}
  * @private
  */
  this.springDamping_ = 0;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /**
  * @type {!PointMass}
  * @private
  */
  this.wall1_ = PointMass.makeRectangle(0.4, 4, 'wall1')
      .setMass(Util.POSITIVE_INFINITY);
  this.wall1_.setPosition(new Vector(-6.2,  0));
  /**
  * @type {!PointMass}
  * @private
  */
  this.wall2_ = PointMass.makeRectangle(0.4, 4, 'wall2')
      .setMass(Util.POSITIVE_INFINITY);
  this.wall2_.setPosition(new Vector(6.2,  0));
  /**
  * @type {!Array<!PointMass>}
  * @private
  */
  this.blocks_ = [];
  /**
  * @type {!Array<!Spring>}
  * @private
  */
  this.springs_ = [];

  // set up variables so that sim.getTime() can be called during setup.
  this.getVarsList().addVariables(
      this.makeVarNames(/*numBlocks=*/0, /*localized=*/false),
      this.makeVarNames(/*numBlocks=*/0,  /*localized=*/true));

  this.addParameter(new ParameterNumber(this, CollideSpringSim.en.MASS,
      CollideSpringSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, CollideSpringSim.en.SPRING_STIFFNESS,
      CollideSpringSim.i18n.SPRING_STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a)));
  this.addParameter(new ParameterNumber(this, CollideSpringSim.en.DAMPING,
      CollideSpringSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, CollideSpringSim.en.SPRING_DAMPING,
      CollideSpringSim.i18n.SPRING_DAMPING,
      () => this.getSpringDamping(), a => this.setSpringDamping(a)));
  this.addParameter(new ParameterNumber(this, CollideSpringSim.en.SPRING_LENGTH,
      CollideSpringSim.i18n.SPRING_LENGTH,
      () => this.getLength(), a => this.setLength(a)));
  this.addParameter(new ParameterNumber(this, EnergySystem.en.PE_OFFSET,
      EnergySystem.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a))
      .setLowerLimit(Util.NEGATIVE_INFINITY)
      .setSignifDigits(5));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', blocks: '+this.blocks_.length
      +', damping_: '+Util.NF(this.damping_)
      +', mass_: '+Util.NF(this.mass_)
      +', springDamping_: '+Util.NF(this.springDamping_)
      +', stiffness_: '+Util.NF(this.stiffness_)
      +', restLength_: '+Util.NF(this.restLength_)
      +', wall1_: '+this.wall1_
      +', wall2_: '+this.wall2_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @override */
getClassName() {
  return 'CollideSpringSim';
};

/**
* @param {number} numBlocks
* @param {boolean} localized
* @return {!Array<string>}
* @private
*/
makeVarNames(numBlocks, localized) {
  var names = [];
  var n = numBlocks*2 + 4;
  for (var i=0; i<n; i++) {
    names.push(this.getVariableName(i, numBlocks, localized));
  }
  return names;
};

/**
* @param {number} idx
* @param {number} numBlocks
* @param {boolean} localized
* @return {string}
* @private
*/
getVariableName(idx, numBlocks, localized) {
  if (idx < numBlocks*2) {
  // vars: 0   1   2   3   4   5   6   7   8    9
  //      U0  V0  U1  V1  U2  U3  KE  PE  TE time
    var j = idx%2;
    var block = 1 + Math.floor(idx/2);
    switch (j) {
      case 0:
        return (localized ?
          CollideSpringSim.i18n.POSITION : CollideSpringSim.en.POSITION)+' '+block;
      case 1:
        return (localized ?
          CollideSpringSim.i18n.VELOCITY : CollideSpringSim.en.VELOCITY)+' '+block;
    }
  } else {
    switch (idx - numBlocks*2) {
      case 0:
        return localized ? EnergySystem.i18n.KINETIC_ENERGY :
            EnergySystem.en.KINETIC_ENERGY;
      case 1:
        return localized ? EnergySystem.i18n.POTENTIAL_ENERGY :
            EnergySystem.en.POTENTIAL_ENERGY;
      case 2:
        return localized ? EnergySystem.i18n.TOTAL_ENERGY :
            EnergySystem.en.TOTAL_ENERGY;
      case 3:
        return localized ? VarsList.i18n.TIME :
            VarsList.en.TIME;
    }
  }
  throw '';
};

/** Set number of blocks and set simulation to initial state.
* @param {number} numBlocks number of moveable blocks to make
* @param {number} startPosition starting position of blocks: 0 = middle, 1 = on-wall
* @param {number} startGap gap between objects in starting position
* @return {undefined}
*/
config(numBlocks, startPosition, startGap)  {
  if (numBlocks < 1 || numBlocks > 3) {
    throw 'too many blocks '+numBlocks;
  }
  this.getSimList().removeAll(this.blocks_);
  this.blocks_.length = 0;
  this.getSimList().removeAll(this.springs_);
  this.springs_.length = 0;
  this.getSimList().add(this.wall1_);
  this.getSimList().add(this.wall2_);
  var va = this.getVarsList();
  va.deleteVariables(0, va.numVariables());
  va.addVariables(this.makeVarNames(numBlocks, /*localized=*/false),
      this.makeVarNames(numBlocks,  /*localized=*/true));
  var left = this.wall1_.getPosition();
  var right = this.wall2_.getPosition();
  for (var i=0; i<numBlocks; i++) {
    var block = PointMass.makeSquare(this.blockWidth_, 'block_'+(i+1));
    block.setMass(this.mass_);
    this.blocks_.push(block);
  }
  this.getSimList().addAll(this.blocks_);
  var spring = new Spring('spring_0',
      this.wall1_, new Vector(this.wall1_.getRightBody(), 0),
      this.blocks_[0], new Vector(-this.blockWidth_/2, 0),
       this.restLength_, this.stiffness_, /*compressOnly=*/ true);
  spring.setDamping(this.springDamping_);
  this.springs_.push(spring);
  for (i=0; i<numBlocks-1; i++) {
    spring = new Spring('spring_'+i,
        this.blocks_[i], new Vector(this.blockWidth_/2, 0),
        this.blocks_[i+1], new Vector(-this.blockWidth_/2, 0),
        this.restLength_, this.stiffness_, /*compressOnly=*/ true);
    spring.setDamping(this.springDamping_);
    this.springs_.push(spring);
  }
  spring = new Spring('spring_'+numBlocks,
      this.blocks_[numBlocks-1], new Vector(this.blockWidth_/2, 0),
      this.wall2_, new Vector(this.wall2_.getLeftBody(), 0),
      this.restLength_, this.stiffness_, /*compressOnly=*/ true);
  spring.setDamping(this.springDamping_);
  this.springs_.push(spring);
  this.getSimList().addAll(this.springs_);
  // vars: 0   1   2   3   4   5   6   7   8    9
  //      U0  V0  U1  V1  U2  U3  KE  PE  TE time
  var vars = va.getValues();
  vars[0] = this.wall1_.getRightWorld() + this.restLength_ + this.blockWidth_/2
      + startGap;
  vars[1] = 3; // starting velocity of block_1
  switch (startPosition) {
    case CollideSpringSim.START_MIDDLE:
      if (numBlocks >= 2) {
        vars[2] = 0;
        vars[3] = 0;
      }
      if (numBlocks >= 3) {
        vars[4] = this.blockWidth_ + this.restLength_ + startGap;
        vars[5] = 0;
      }
      break;
    case CollideSpringSim.START_ON_WALL:
      if (numBlocks == 2) {
        vars[2] = this.wall2_.getLeftWorld() - this.blockWidth_/2 - this.restLength_
            - startGap;
        vars[3] = 0;
      } else if (numBlocks == 3) {
        vars[2] = this.wall2_.getLeftWorld() -3*this.blockWidth_/2 -2*this.restLength_
            - 2 * startGap;
        vars[3] = 0;
        vars[4] = this.wall2_.getLeftWorld() - this.blockWidth_/2 - this.restLength_
            - startGap;
        vars[5] = 0;
      }
      break;
    default:
      throw '';
  }
  va.setValues(vars);
  this.saveInitialState();
  this.modifyObjects();
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
  // We assume that modifyObjects() has been called so the objects have
  // position and velocity corresponding to the vars[] array.
  /** @type {number} */
  var ke = 0;
  /** @type {number} */
  var pe = 0;
  this.springs_.forEach(spr => pe += spr.getPotentialEnergy());
  this.blocks_.forEach(block => ke += block.getKineticEnergy());
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
getPEOffset() {
  return this.potentialOffset_;
}

/** @override */
setPEOffset(value) {
  this.potentialOffset_ = value;
  // vars: 0   1   2   3   4   5   6   7   8    9
  //      U0  V0  U1  V1  U2  U3  KE  PE  TE time
  // discontinuous change in energy
  this.getVarsList().incrSequence(7, 8);
  this.broadcastParameter(EnergySystem.en.PE_OFFSET);
};

/** @override */
modifyObjects() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  var ei = this.getEnergyInfo_(vars);
  var n = this.blocks_.length*2;
  va.setValue(n, ei.getTranslational(), true);
  va.setValue(n+1, ei.getPotential(), true);
  va.setValue(n+2, ei.getTotalEnergy(), true);
};

/**
@param {!Array<number>} vars
@private
*/
moveObjects(vars) {
  // vars: 0   1   2   3   4   5   6   7   8    9
  //      U0  V0  U1  V1  U2  U3  KE  PE  TE time
  this.blocks_.forEach((block, i) => {
    var idx = 2*i;
    block.setPosition(new Vector(vars[idx],  0));
    block.setVelocity(new Vector(vars[1 + idx], 0, 0));
  });
};

/** @override */
startDrag(simObject, location, offset, dragBody, mouseEvent) {
  this.dragIdx_ = goog.array.indexOf(this.blocks_, simObject);
  if (this.dragIdx_ < 0) {
    return false;
  } else {
    this.mouse_.setPosition(location);
    this.dragSpring_ = new Spring('drag spring', this.mouse_, Vector.ORIGIN,
        this.blocks_[this.dragIdx_], Vector.ORIGIN,
        /*restLength=*/0, /*stiffness=*/1);
    this.getSimList().add(this.dragSpring_);
    return true;
  }
};

/** @override */
mouseDrag(simObject, location, offset, mouseEvent) {
  var p = location.subtract(offset);
  if (simObject == this.wall1_) {
    this.wall1_.setPosition(p);
  } else if (simObject == this.wall2_) {
    this.wall2_.setPosition(p);
  } else if (this.dragIdx_ > -1) {
    this.mouse_.setPosition(location);
  }
};

/** @override */
finishDrag(simObject, location, offset) {
  this.dragIdx_ = -1;
  if (this.dragSpring_ != null) {
    this.getSimList().remove(this.dragSpring_);
    this.dragSpring_ = null;
  }
};

/** @override */
handleKeyEvent(keyCode, pressed, keyEvent) {
};

/** @override */
evaluate(vars, change, timeStep) {
  Util.zeroArray(change);
  this.moveObjects(vars);
  // vars: 0   1   2   3   4   5   6   7   8    9
  //      U0  V0  U1  V1  U2  U3  KE  PE  TE time
  change[this.blocks_.length*2+3] = 1; // time
  this.blocks_.forEach((block, listIdx) => {
    var idx = 2*listIdx;
    change[idx] = vars[idx+1]; // U' = V
    var mass = block.getMass();
    // for each spring, get force from spring,
    var force = new MutableVector(0, 0);
    this.springs_.forEach(spr => {
      if (spr.getBody1() == block) {
        force.add(spr.calculateForces()[0].getVector());
      } else if (spr.getBody2() == block) {
        force.add(spr.calculateForces()[1].getVector());
      }
    });
    // apply spring force when dragging
    if (this.dragSpring_ != null && this.dragIdx_ == listIdx) {
      goog.asserts.assert(this.dragSpring_.getBody2() == block);
      force.add(this.dragSpring_.calculateForces()[1].getVector());
    }
    force.add(new Vector(vars[idx+1], 0).multiply(-this.damping_));
    change[idx+1] = force.getX()/mass; // V'
  });
  return null;
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
  this.broadcastParameter(CollideSpringSim.en.DAMPING);
};

/** Return spring damping
@return {number} spring damping
*/
getSpringDamping() {
  return this.springDamping_;
};

/** Set spring damping
@param {number} value spring damping
*/
setSpringDamping(value) {
  this.springDamping_ = value;
  this.springs_.forEach(spr => spr.setDamping(value));
  this.broadcastParameter(CollideSpringSim.en.SPRING_DAMPING);
};

/** Return mass of atoms
@return {number} mass of atoms
*/
getMass() {
  return this.mass_;
};

/** Set mass of atoms
@param {number} value mass of atoms
*/
setMass(value) {
  this.mass_ = value;
  var mass = this.mass_/this.blocks_.length;
  this.blocks_.forEach(block => block.setMass(mass));
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.blocks_.length*2;
  this.getVarsList().incrSequence(n, n+1, n+2);
  this.broadcastParameter(CollideSpringSim.en.MASS);
};

/** Return spring resting length
@return {number} spring resting length
*/
getLength() {
  return this.restLength_;
};

/** Set spring resting length
@param {number} value spring resting length
*/
setLength(value) {
  this.restLength_ = value;
  for (var i=0; i<this.springs_.length; i++) {
    this.springs_[i].setRestLength(value);
  }
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.blocks_.length*2;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(CollideSpringSim.en.SPRING_LENGTH);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
getStiffness() {
  return this.stiffness_;
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
setStiffness(value) {
  this.stiffness_ = value;
  for (var i=0; i<this.springs_.length; i++) {
    this.springs_[i].setStiffness(value);
  }
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.blocks_.length*2;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(CollideSpringSim.en.SPRING_STIFFNESS);
};

} // end class

/** Constant that indicates 'start in middle' configuration.
* @const
* @type {number}
*/
CollideSpringSim.START_MIDDLE = 0;

/** Constant that indicates 'start on wall' configuration.
* @const
* @type {number}
*/
CollideSpringSim.START_ON_WALL = 1;

/** Set of internationalized strings.
@typedef {{
  NUM_BLOCKS: string,
  POSITION: string,
  VELOCITY: string,
  DAMPING: string,
  SPRING_DAMPING: string,
  GRAVITY: string,
  MASS: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  START_POSITION: string,
  START_IN_MIDDLE: string,
  START_ON_WALL: string,
  START_GAP: string
  }}
*/
CollideSpringSim.i18n_strings;

/**
@type {CollideSpringSim.i18n_strings}
*/
CollideSpringSim.en = {
  NUM_BLOCKS: 'number blocks',
  POSITION: 'position',
  VELOCITY: 'velocity',
  DAMPING: 'damping',
  SPRING_DAMPING: 'spring damping',
  GRAVITY: 'gravity',
  MASS: 'mass',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  START_POSITION: 'start position',
  START_IN_MIDDLE: 'in middle',
  START_ON_WALL: 'on wall',
  START_GAP: 'starting gap'
};

/**
@private
@type {CollideSpringSim.i18n_strings}
*/
CollideSpringSim.de_strings = {
  NUM_BLOCKS: 'Blockanzahl',
  POSITION: 'Position',
  VELOCITY: 'Geschwindigkeit',
  DAMPING: 'Dämpfung',
  SPRING_DAMPING: 'Federdämpfung',
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  SPRING_LENGTH: 'Federlänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  START_POSITION: 'Anfangspunkt',
  START_IN_MIDDLE: 'in der Mitte',
  START_ON_WALL: 'an der Mauer',
  START_GAP: 'Anfangsabstand' // Anfangslücke'
};

/** Set of internationalized strings.
@type {CollideSpringSim.i18n_strings}
*/
CollideSpringSim.i18n = goog.LOCALE === 'de' ? CollideSpringSim.de_strings :
    CollideSpringSim.en;

exports = CollideSpringSim;
