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

goog.module('myphysicslab.sims.springs.ChainOfSpringsSim');

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

/** Simulation of a chain of springs and masses stretched between two fixed points.

* @implements {EnergySystem}
* @implements {EventHandler}
*/
class ChainOfSpringsSim extends AbstractODESim {
/**
* @param {string=} opt_name name of this as a Subject
*/
constructor(opt_name) {
  super(opt_name);
  /**
  * @type {boolean}
  * @private
  */
  this.attachRight_ = true;
  /** the atom being dragged, or -1 when no drag is happening
  * @type {number}
  * @private
  */
  this.dragAtom_ = -1;
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 4;
  /**
  * @type {number}
  * @private
  */
  this.mass_ = 5;
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0.1;
  /**
  * @type {number}
  * @private
  */
  this.restLength_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.stiffness_ = 6.0;
  /**
  * @type {number}
  * @private
  */
  this.springDamping_ = 0.1;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /**
  * @type {!PointMass}
  * @private
  */
  this.fixed1_ = PointMass.makeSquare(0.5, 'fixed1');
  this.fixed1_.setPosition(new Vector(-6,  4));
  /**
  * @type {!PointMass}
  * @private
  */
  this.fixed2_ = PointMass.makeSquare(0.5, 'fixed2');
  this.fixed2_.setPosition(new Vector(6,  4));
  /**
  * @type {!Array<!PointMass>}
  * @private
  */
  this.atoms_ = [];
  /**
  * @type {!Array<!Spring>}
  * @private
  */
  this.springs_ = [];
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.GRAVITY,
      ChainOfSpringsSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.MASS,
      ChainOfSpringsSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.STIFFNESS,
      ChainOfSpringsSim.i18n.STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a)));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.DAMPING,
      ChainOfSpringsSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.SPRING_DAMPING,
      ChainOfSpringsSim.i18n.SPRING_DAMPING,
      () => this.getSpringDamping(), a => this.setSpringDamping(a)));
  this.addParameter(new ParameterNumber(this, ChainOfSpringsSim.en.LENGTH,
      ChainOfSpringsSim.i18n.LENGTH,
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
      +', atoms: '+this.atoms_.length
      +', gravity_: '+Util.NF(this.gravity_)
      +', damping_: '+Util.NF(this.damping_)
      +', mass_: '+Util.NF(this.mass_)
      +', springDamping_: '+Util.NF(this.springDamping_)
      +', stiffness_: '+Util.NF(this.stiffness_)
      +', restLength_: '+Util.NF(this.restLength_)
      +', fixed1_: '+this.fixed1_
      +', fixed2_: '+this.fixed2_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @override */
getClassName() {
  return 'ChainOfSpringsSim';
};

/**
* @param {number} numAtoms
* @return {!Array<string>}
* @param {boolean} localized
* @private
*/
static makeVarNames(numAtoms, localized) {
  var names = [];
  var n = numAtoms*4 + 8;
  for (var i=0; i<n; i++) {
    names.push(ChainOfSpringsSim.getVariableName(i, numAtoms, localized));
  }
  return names;
};

/**
* @param {number} idx
* @param {number} numAtoms
* @param {boolean} localized
* @return {string}
* @private
*/
static getVariableName(idx, numAtoms, localized) {
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  if (idx >= 8) {
    var j = (idx-8)%4;
    var atom = 1 + Math.floor((idx-8)/4);
    var nm = localized ? ChainOfSpringsSim.i18n.BALL : ChainOfSpringsSim.en.BALL;
    nm = nm + ' ' + atom + ' ';
    switch (j) {
      case 0:
        return nm + (localized ? ChainOfSpringsSim.i18n.X_POSITION :
            ChainOfSpringsSim.en.X_POSITION);
      case 1:
        return nm + (localized ? ChainOfSpringsSim.i18n.Y_POSITION :
            ChainOfSpringsSim.en.Y_POSITION);
      case 2:
        return nm + (localized ? ChainOfSpringsSim.i18n.X_VELOCITY :
            ChainOfSpringsSim.en.X_VELOCITY);
      case 3:
        return nm + (localized ? ChainOfSpringsSim.i18n.Y_VELOCITY :
            ChainOfSpringsSim.en.Y_VELOCITY);
    }
  } else {
    switch (idx) {
      case 0:
        return localized ? VarsList.i18n.TIME :
            VarsList.en.TIME;
      case 1:
        return localized ? EnergySystem.i18n.KINETIC_ENERGY :
            EnergySystem.en.KINETIC_ENERGY;
      case 2:
        return localized ? EnergySystem.i18n.POTENTIAL_ENERGY :
            EnergySystem.en.POTENTIAL_ENERGY;
      case 3:
        return localized ? EnergySystem.i18n.TOTAL_ENERGY :
            EnergySystem.en.TOTAL_ENERGY;
      case 4:
        return localized ? ChainOfSpringsSim.i18n.ANCHOR1_X :
            ChainOfSpringsSim.en.ANCHOR1_X;
      case 5:
        return localized ? ChainOfSpringsSim.i18n.ANCHOR1_Y :
            ChainOfSpringsSim.en.ANCHOR1_Y;
      case 6:
        return localized ? ChainOfSpringsSim.i18n.ANCHOR2_X :
            ChainOfSpringsSim.en.ANCHOR2_X;
      case 7:
        return localized ? ChainOfSpringsSim.i18n.ANCHOR2_Y :
            ChainOfSpringsSim.en.ANCHOR2_Y;
    }
  }
  throw '';
};

/** Set number of atoms and set simulation to initial state.
* @param {number} numAtoms number of mass objects in the chain
* @param {boolean} attachRight whether to attach to fixed block on right
* @return {undefined}
*/
makeChain(numAtoms, attachRight)  {
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  this.getSimList().removeAll(this.atoms_);
  this.atoms_.length = 0;
  this.getSimList().removeAll(this.springs_);
  this.springs_.length = 0;
  var va = this.getVarsList();
  va.deleteVariables(0, va.numVariables());
  va.addVariables(ChainOfSpringsSim.makeVarNames(numAtoms, /*localized=*/false),
      ChainOfSpringsSim.makeVarNames(numAtoms, /*localized=*/true));
  va.setComputed(1, 2, 3);
  var left = this.fixed1_.getPosition();
  var right = this.fixed2_.getPosition();
  va.setValue(4, left.getX());
  va.setValue(5, left.getY());
  va.setValue(6, right.getX());
  va.setValue(7, right.getY());
  this.getSimList().add(this.fixed1_);
  this.getSimList().add(this.fixed2_);
  if (numAtoms > 0) {
    var len = right.subtract(left).length();
    var size = Math.min(0.5, len/(2*(numAtoms+1)));
    var mass = this.mass_/numAtoms;
    for (var i=0; i<numAtoms; i++) {
      var atom = PointMass.makeCircle(size, 'atom'+(i+1)).setMass(mass);
      this.atoms_.push(atom);
    }
    this.getSimList().addAll(this.atoms_);
    var spring = new Spring('spring 0',
      this.fixed1_, Vector.ORIGIN,
      this.atoms_[0], Vector.ORIGIN, this.restLength_, this.stiffness_);
    spring.setDamping(this.springDamping_);
    this.springs_.push(spring);
    for (i=1; i<numAtoms; i++) {
      spring = new Spring('spring '+i,
        this.atoms_[i-1], Vector.ORIGIN,
        this.atoms_[i], Vector.ORIGIN, this.restLength_, this.stiffness_);
      spring.setDamping(this.springDamping_);
      this.springs_.push(spring);
    }
    if (attachRight) {
      spring = new Spring('spring '+(numAtoms+1),
        this.atoms_[numAtoms-1], Vector.ORIGIN,
        this.fixed2_, Vector.ORIGIN, this.restLength_, this.stiffness_);
      spring.setDamping(this.springDamping_);
      this.springs_.push(spring);
    }
    this.getSimList().addAll(this.springs_);
    this.straightLine();
  }
  this.saveInitialState();
  this.modifyObjects();
};

/** Arranges atoms in a straight line between the fixed points (even if the fixed
* points are not connected to the chain).
* @return {undefined}
*/
straightLine()  {
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  var vars = this.getVarsList().getValues();
  var left = this.fixed1_.getPosition();
  var right = this.fixed2_.getPosition();
  var diff = right.subtract(left);
  var n = this.atoms_.length;
  for (var i=0; i<n; i++) {
    var p = left.add(diff.multiply((i+1)/(n+1)));
    vars[0 + i*4 + 8] = p.getX();
    vars[1 + i*4 + 8] = p.getY();
    vars[2 + i*4 + 8] = 0;
    vars[3 + i*4 + 8] = 0;
  }
  this.getVarsList().setValues(vars);
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
  // positions & velocities corresponding to the vars[] array.
  /** @type {number} */
  var ke = 0;
  /** @type {number} */
  var pe = 0;
  this.springs_.forEach(spr => pe += spr.getPotentialEnergy());
  this.atoms_.forEach(atom => {
    ke += atom.getKineticEnergy();
    // gravity potential = m g (y - floor)
    pe += this.gravity_ * atom.getMass() * atom.getPosition().getY();
  });
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
getPEOffset() {
  return this.potentialOffset_;
}

/** @override */
setPEOffset(value) {
  this.potentialOffset_ = value;
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  // discontinuous change in energy
  this.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(EnergySystem.en.PE_OFFSET);
};

/** @override */
modifyObjects() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  var ei = this.getEnergyInfo_(vars);
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  va.setValue(1, ei.getTranslational(), true);
  va.setValue(2, ei.getPotential(), true);
  va.setValue(3, ei.getTotalEnergy(), true);
};

/**
@param {!Array<number>} vars
@private
*/
moveObjects(vars) {
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  this.atoms_.forEach((atom, i) => {
    var idx = 4*i + 8;
    atom.setPosition(new Vector(vars[idx],  vars[1 + idx]));
    atom.setVelocity(new Vector(vars[2 + idx], vars[3 + idx], 0));
  });
  this.fixed1_.setPosition(new Vector(vars[4],  vars[5]));
  this.fixed2_.setPosition(new Vector(vars[6],  vars[7]));
};

/** @override */
startDrag(simObject, location, offset, dragBody, mouseEvent) {
  this.dragAtom_ = goog.array.indexOf(this.atoms_, simObject);
  return this.dragAtom_ > -1 || simObject == this.fixed1_ || simObject == this.fixed2_;
};

/** @override */
mouseDrag(simObject, location, offset, mouseEvent) {
  var p = location.subtract(offset);
  var va = this.getVarsList();
  if (simObject == this.fixed1_) {
    va.setValue(4, p.getX());
    va.setValue(5, p.getY());
  } else if (simObject == this.fixed2_) {
    va.setValue(6, p.getX());
    va.setValue(7, p.getY());
  } else if (this.dragAtom_ > -1) {
    var atom = this.atoms_[this.dragAtom_];
    if (simObject != atom) {
      return;
    }
    var idx = 4*this.dragAtom_ + 8;
    va.setValue(0 + idx, p.getX());
    va.setValue(1 + idx, p.getY());
    va.setValue(2 + idx, 0);
    va.setValue(3 + idx, 0);
  }
  // derived energy variables are discontinuous
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  va.incrSequence(1, 2, 3);
  this.moveObjects(va.getValues());
};

/** @override */
finishDrag(simObject, location, offset) {
  this.dragAtom_ = -1;
};

/** @override */
handleKeyEvent(keyCode, pressed, keyEvent) {
};

/** @override */
evaluate(vars, change, timeStep) {
  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[0] = 1; // time
  this.atoms_.forEach((atom, listIdx) => {
    if (this.dragAtom_ == listIdx) {
      return;
    }
    var idx = 4*listIdx + 8;
    change[idx] = vars[idx+2]; // Ux' = Vx
    change[idx+1] = vars[idx+3]; // Uy' = Vy
    var mass = atom.getMass();
    // for each spring, get force from spring,
    var force = new MutableVector(0, 0);
    this.springs_.forEach(spr => {
      if (spr.getBody1() == atom) {
        force.add(spr.calculateForces()[0].getVector());
      } else if (spr.getBody2() == atom) {
        force.add(spr.calculateForces()[1].getVector());
      }
    });
    // add gravity force
    force.add(new Vector(0, -this.gravity_*mass));
    force.add(new Vector(vars[idx+2], vars[idx+3]).multiply(-this.damping_));
    change[idx+2] = force.getX()/mass; // Vx'
    change[idx+3] = force.getY()/mass; // Vy'
  });
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
  // discontinuous change in energy
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  this.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(ChainOfSpringsSim.en.GRAVITY);
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
  this.broadcastParameter(ChainOfSpringsSim.en.DAMPING);
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
  this.broadcastParameter(ChainOfSpringsSim.en.SPRING_DAMPING);
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
  var mass = this.mass_/this.atoms_.length;
  this.atoms_.forEach(atom => atom.setMass(mass));
  // discontinuous change in energy
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  this.getVarsList().incrSequence(1, 2, 3);
  this.broadcastParameter(ChainOfSpringsSim.en.MASS);
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
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  this.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(ChainOfSpringsSim.en.LENGTH);
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
  // vars[1] = KE, vars[2] = PE, vars[3] = TE
  this.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(ChainOfSpringsSim.en.STIFFNESS);
};

} // end class

/** Set of internationalized strings.
@typedef {{
  BALL: string,
  ANCHOR1_X: string,
  ANCHOR1_Y: string,
  ANCHOR2_X: string,
  ANCHOR2_Y: string,
  NUM_LINKS: string,
  X_POSITION: string,
  Y_POSITION: string,
  X_VELOCITY: string,
  Y_VELOCITY: string,
  DAMPING: string,
  SPRING_DAMPING: string,
  GRAVITY: string,
  MASS: string,
  LENGTH: string,
  STIFFNESS: string,
  STRAIGHT_LINE: string,
  ATTACH_RIGHT: string
  }}
*/
ChainOfSpringsSim.i18n_strings;

/**
@type {ChainOfSpringsSim.i18n_strings}
*/
ChainOfSpringsSim.en = {
  BALL: 'ball',
  ANCHOR1_X: 'anchor1 X',
  ANCHOR1_Y: 'anchor1 Y',
  ANCHOR2_X: 'anchor2 X',
  ANCHOR2_Y: 'anchor2 Y',
  NUM_LINKS: 'chain links',
  X_POSITION: 'position X',
  Y_POSITION: 'position Y',
  X_VELOCITY: 'velocity X',
  Y_VELOCITY: 'velocity Y',
  DAMPING: 'damping',
  SPRING_DAMPING: 'spring damping',
  GRAVITY: 'gravity',
  MASS: 'mass',
  LENGTH: 'spring length',
  STIFFNESS: 'spring stiffness',
  STRAIGHT_LINE: 'straight line',
  ATTACH_RIGHT: 'attach right'
};

/**
@private
@type {ChainOfSpringsSim.i18n_strings}
*/
ChainOfSpringsSim.de_strings = {
  BALL: 'Ball',
  ANCHOR1_X: 'Anker1 X',
  ANCHOR1_Y: 'Anker1 Y',
  ANCHOR2_X: 'Anker2 X',
  ANCHOR2_Y: 'Anker2 Y',
  NUM_LINKS: 'Kettenglieder',
  X_POSITION: 'Position X',
  Y_POSITION: 'Position Y',
  X_VELOCITY: 'Geschwindigkeit X',
  Y_VELOCITY: 'Geschwindigkeit Y',
  DAMPING: 'Dämpfung',
  SPRING_DAMPING: 'Federdämpfung',
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  LENGTH: 'Federlänge',
  STIFFNESS: 'Federsteifheit',
  STRAIGHT_LINE: 'gerade Linie',
  ATTACH_RIGHT: 'rechts festmachen'
};

/** Set of internationalized strings.
@type {ChainOfSpringsSim.i18n_strings}
*/
ChainOfSpringsSim.i18n = goog.LOCALE === 'de' ? ChainOfSpringsSim.de_strings :
    ChainOfSpringsSim.en;

exports = ChainOfSpringsSim;
