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

import { AbstractODESim, ODESim } from '../../lab/model/ODESim.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js';
import { MutableVector } from '../../lab/util/MutableVector.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

const TIME = 0;
const KE = 1;
const PE = 2;
const TE = 3;
const U0 = 4;
const V0 = 5;
const U1 = 6;
const V1 = 7;
const U2 = 8;
const V2 = 9;

/** Simulation of one to three blocks moving freely in one dimension, with springs
attached to the blocks, and walls on either end.

Variables
-------------------

0. time
1. kinetic energy
2. potential energy
3. total energy
4. block 1 position
5. block 1 velocity
6. block 2 position
7. block 2 velocity
8. block 3 position
9. block 3 velocity


History
--------------------

This was originally created to investigate collision schemes for the rigid body
simulation, like serial or simultaneous collision handling. One idea for how to handle
collisions is to insert springs at each collision point, and I tried a version of this
in RigidBodySim. But the collisions were not behaving the way I expected. So I made
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
blocks/springs somewhat satisfies the ideal collision behaviors described above. This
is with low mass of 0.1, and no damping.

To Do
------------------------

Add AdaptiveStepSolver to choices for DiffEqSolver; does it work better in terms of
having constant energy? Otherwise, the stiff springs seem to give energy fluctuations
with regular step size of 0.025; if you reduce to a very small time step of 0.0005,
then the energy is fairly constant. But that's wasteful of using many tiny steps during
most of the time when the springs aren't engaging.

*/
export class CollideSpringSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem {

  /** index of the block being dragged, or -1 when no drag is happening */
  private dragIdx_: number = -1;
  /** object that represents mouse position while dragging.  Note that we don't add
  * the mouse object to the SimList and therefore don't make a DisplayObject for it.
  */
  private mouse_: PointMass;
  /** the spring dragging the block */
  private dragSpring_: null|Spring = null;
  private mass_: number = 0.1;
  private damping_: number = 0;
  private restLength_: number = 1.0;
  private blockWidth_: number = 0.6;
  private stiffness_: number = 60.0;
  private springDamping_: number = 0;
  private potentialOffset_: number = 0;
  private wall1_: PointMass;
  private wall2_: PointMass;
  private blocks_: PointMass[] = [];
  private springs_: Spring[] = [];

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  this.mouse_ = PointMass.makeCircle(0.5, 'mouse');
  this.mouse_.setMass(Infinity);
  this.wall1_ = PointMass.makeRectangle(0.4, 4, 'wall1');
  this.wall1_.setMass(Infinity);
  this.wall1_.setPosition(new Vector(-6.2,  0));
  this.wall2_ = PointMass.makeRectangle(0.4, 4, 'wall2');
  this.wall2_.setMass(Infinity);
  this.wall2_.setPosition(new Vector(6.2,  0));

  // set up variables so that sim.getTime() can be called during setup.
  this.getVarsList().addVariables(
      this.makeVarNames(/*numBlocks=*/0, /*localized=*/false),
      this.makeVarNames(/*numBlocks=*/0,  /*localized=*/true));

  let pn: ParameterNumber;
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
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
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

/** @inheritDoc */
getClassName() {
  return 'CollideSpringSim';
};

/**
* @param numBlocks
* @param localized
*/
private makeVarNames(numBlocks: number, localized: boolean): string[] {
  const names = [];
  const n = numBlocks*2 + 4;
  for (let i=0; i<n; i++) {
    names.push(this.getVariableName(i, localized));
  }
  return names;
};

/**
* @param idx
* @param localized
*/
private getVariableName(idx: number, localized: boolean): string {
  // vars: 0   1   2   3   4   5   6   7   8   9
  //     time  KE PE  TE  U0  V0  U1  V1  U2  V2
  if (idx >= U0) {
    const j = (idx-U0)%2;
    const block = 1 + Math.floor((idx-U0)/2);
    switch (j) {
      case 0:
        return (localized ? CollideSpringSim.i18n.POSITION :
            CollideSpringSim.en.POSITION)+' '+block;
      case 1:
        return (localized ? CollideSpringSim.i18n.VELOCITY :
            CollideSpringSim.en.VELOCITY)+' '+block;
    }
  } else {
    switch (idx) {
      case KE:
        return localized ? EnergyInfo.i18n.KINETIC_ENERGY :
            EnergyInfo.en.KINETIC_ENERGY;
      case PE:
        return localized ? EnergyInfo.i18n.POTENTIAL_ENERGY :
            EnergyInfo.en.POTENTIAL_ENERGY;
      case TE:
        return localized ? EnergyInfo.i18n.TOTAL_ENERGY :
            EnergyInfo.en.TOTAL_ENERGY;
      case TIME:
        return localized ? VarsList.i18n.TIME :
            VarsList.en.TIME;
    }
  }
  throw '';
};

/** Rebuilds the simulation from scratch with the given number of blocks,
* starting position, and gaps.
* @param numBlocks number of moveable blocks to make
* @param startPosition starting position of blocks: 0 = middle, 1 = on-wall
* @param startGap gap between objects in starting position
*/
config(numBlocks: number, startPosition: number, startGap: number): void {
  if (numBlocks < 1 || numBlocks > 3) {
    throw 'too many blocks '+numBlocks;
  }
  this.getSimList().removeAll(this.blocks_);
  this.blocks_.length = 0;
  this.getSimList().removeAll(this.springs_);
  this.springs_.length = 0;
  this.getSimList().add(this.wall1_);
  this.getSimList().add(this.wall2_);
  const va = this.getVarsList();
  va.deleteVariables(0, va.numVariables());
  va.addVariables(this.makeVarNames(numBlocks, /*localized=*/false),
      this.makeVarNames(numBlocks,  /*localized=*/true));
  const left = this.wall1_.getPosition();
  const right = this.wall2_.getPosition();
  for (let i=0; i<numBlocks; i++) {
    const block = PointMass.makeSquare(this.blockWidth_, 'block_'+(i+1));
    block.setMass(this.mass_);
    this.blocks_.push(block);
  }
  this.getSimList().addAll(this.blocks_);
  {
    const spring = new Spring('spring_0',
        this.wall1_, new Vector(this.wall1_.getRightBody(), 0),
        this.blocks_[0], new Vector(-this.blockWidth_/2, 0),
         this.restLength_, this.stiffness_, /*compressOnly=*/ true);
    spring.setDamping(this.springDamping_);
    this.springs_.push(spring);
  }
  for (let i=0; i<numBlocks-1; i++) {
    const spring = new Spring('spring_'+i,
        this.blocks_[i], new Vector(this.blockWidth_/2, 0),
        this.blocks_[i+1], new Vector(-this.blockWidth_/2, 0),
        this.restLength_, this.stiffness_, /*compressOnly=*/ true);
    spring.setDamping(this.springDamping_);
    this.springs_.push(spring);
  }
  {
    const spring = new Spring('spring_'+numBlocks,
        this.blocks_[numBlocks-1], new Vector(this.blockWidth_/2, 0),
        this.wall2_, new Vector(this.wall2_.getLeftBody(), 0),
        this.restLength_, this.stiffness_, /*compressOnly=*/ true);
    spring.setDamping(this.springDamping_);
    this.springs_.push(spring);
  }
  this.getSimList().addAll(this.springs_);
  // vars: 0   1   2   3   4   5   6   7   8   9
  //     time  KE PE  TE  U0  V0  U1  V1  U2  V2
  const vars = va.getValues();
  vars[U0] = this.wall1_.getRightWorld() + this.restLength_ + this.blockWidth_/2
      + startGap;
  vars[V0] = 3; // starting velocity of block_1
  switch (startPosition) {
    case CollideSpringSim.START_MIDDLE:
      if (numBlocks >= 2) {
        vars[U1] = 0;
        vars[V1] = 0;
      }
      if (numBlocks >= 3) {
        vars[U2] = this.blockWidth_ + this.restLength_ + startGap;
        vars[V2] = 0;
      }
      break;
    case CollideSpringSim.START_ON_WALL:
      const wallLeft = this.wall2_.getLeftWorld();
      const bw = this.blockWidth_;
      if (numBlocks == 2) {
        vars[U1] = wallLeft - bw/2 - this.restLength_ - startGap;
        vars[V1] = 0;
      } else if (numBlocks == 3) {
        vars[U1] = wallLeft -3*bw/2 - 2*this.restLength_ - 2*startGap;
        vars[V1] = 0;
        vars[U2] = wallLeft - bw/2 - this.restLength_ - startGap;
        vars[V2] = 0;
      }
      break;
    default:
      throw '';
  }
  va.setValues(vars);
  this.saveInitialState();
  this.modifyObjects();
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  let ke = 0;
  let pe = 0;
  this.springs_.forEach(spr => pe += spr.getPotentialEnergy());
  this.blocks_.forEach(block => ke += block.getKineticEnergy());
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number) {
  this.potentialOffset_ = value;
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  const ei = this.getEnergyInfo();
  va.setValue(KE, ei.getTranslational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
};

/**
@param vars
*/
private moveObjects(vars: number[]) {
  // vars: 0   1   2   3   4   5   6   7   8   9
  //     time  KE PE  TE  U0  V0  U1  V1  U2  V2
  this.blocks_.forEach((block, i) => {
    const idx = 2*i;
    block.setPosition(new Vector(vars[U0 + idx], 0));
    block.setVelocity(new Vector(vars[V0 + idx], 0));
  });
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject instanceof PointMass) {
    this.dragIdx_ = this.blocks_.indexOf(simObject);
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
  } else {
    return false;
  }
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  const p = location.subtract(offset);
  if (simObject == this.wall1_) {
    this.wall1_.setPosition(p);
  } else if (simObject == this.wall2_) {
    this.wall2_.setPosition(p);
  } else if (this.dragIdx_ > -1) {
    this.mouse_.setPosition(location);
  }
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void {
  this.dragIdx_ = -1;
  if (this.dragSpring_ != null) {
    this.getSimList().remove(this.dragSpring_);
    this.dragSpring_ = null;
  }
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  Util.zeroArray(change);
  this.moveObjects(vars);
  // vars: 0   1   2   3   4   5   6   7   8   9
  //     time  KE PE  TE  U0  V0  U1  V1  U2  V2
  change[TIME] = 1; // time
  this.blocks_.forEach((block, listIdx) => {
    // listIdx: {0, 1, 2} corresponds to blocks
    const idx = 2*listIdx; // idx: {0, 2, 4}
    change[U0 + idx] = vars[V0 + idx]; // U' = V
    const mass = block.getMass();
    // for each spring, get force from spring,
    const force = new MutableVector(0, 0);
    this.springs_.forEach(spr => {
      if (spr.getBody1() == block) {
        force.add(spr.calculateForces()[0].getVector());
      } else if (spr.getBody2() == block) {
        force.add(spr.calculateForces()[1].getVector());
      }
    });
    // apply spring force when dragging
    if (this.dragSpring_ != null && this.dragIdx_ == listIdx) {
      Util.assert(this.dragSpring_.getBody2() == block);
      force.add(this.dragSpring_.calculateForces()[1].getVector());
    }
    force.add(new Vector(vars[V0 + idx], 0).multiply(-this.damping_));
    change[V0 + idx] = force.getX()/mass; // V'
  });
  return null;
};

/** Return damping
@return damping
*/
getDamping(): number {
  return this.damping_;
};

/** Set damping
@param value damping
*/
setDamping(value: number) {
  this.damping_ = value;
  this.broadcastParameter(CollideSpringSim.en.DAMPING);
};

/** Return spring damping
@return spring damping
*/
getSpringDamping(): number {
  return this.springDamping_;
};

/** Set spring damping
@param value spring damping
*/
setSpringDamping(value: number) {
  this.springDamping_ = value;
  this.springs_.forEach(spr => spr.setDamping(value));
  this.broadcastParameter(CollideSpringSim.en.SPRING_DAMPING);
};

/** Return mass of atoms
@return mass of atoms
*/
getMass(): number {
  return this.mass_;
};

/** Set mass of atoms
@param value mass of atoms
*/
setMass(value: number) {
  this.mass_ = value;
  const mass = this.mass_/this.blocks_.length;
  this.blocks_.forEach(block => block.setMass(mass));
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(CollideSpringSim.en.MASS);
};

/** Return spring resting length
@return spring resting length
*/
getLength(): number {
  return this.restLength_;
};

/** Set spring resting length
@param value spring resting length
*/
setLength(value: number) {
  this.restLength_ = value;
  for (let i=0; i<this.springs_.length; i++) {
    this.springs_[i].setRestLength(value);
  }
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(CollideSpringSim.en.SPRING_LENGTH);
};

/** Returns spring stiffness
@return spring stiffness
*/
getStiffness(): number {
  return this.stiffness_;
};

/** Sets spring stiffness
@param value spring stiffness
*/
setStiffness(value: number) {
  this.stiffness_ = value;
  for (let i=0; i<this.springs_.length; i++) {
    this.springs_[i].setStiffness(value);
  }
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(CollideSpringSim.en.SPRING_STIFFNESS);
};

/** Constant that indicates 'start in middle' configuration. */
static readonly START_MIDDLE = 0;

/** Constant that indicates 'start on wall' configuration. */
static readonly START_ON_WALL = 1;

static readonly en: i18n_strings = {
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

static readonly de_strings: i18n_strings = {
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

static readonly i18n = Util.LOCALE === 'de' ? CollideSpringSim.de_strings : CollideSpringSim.en;

} // end class

type i18n_strings = {
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
};

Util.defineGlobal('sims$springs$CollideSpringSim', CollideSpringSim);
