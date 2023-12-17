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
import { BlockCollision } from './BlockCollision.js';
import { Collision, CollisionTotals } from '../../lab/model/Collision.js';
import { CollisionSim } from '../../lab/model/CollisionSim.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js';
import { GenericEvent } from '../../lab/util/Observe.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { Spring } from '../../lab/model/Spring.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

const X1 = 0;
const V1 = 1;
const X2 = 2;
const V2 = 3;
const TIME = 4;
const KE = 5;
const PE = 6;
const TE = 7;

/** Simulation of two blocks moving horizontally between walls, with collisions
between the blocks and walls. One of the blocks is connected to a wall with a spring.
The order of objects left to right is: left wall, block 1, block 2, right wall.

Variables and Parameters
-------------------------------
Origin at right edge of left wall. Variables:
```text
vars[0] = block 1 position
vars[1] = block 1 velocity
vars[2] = block 2 position
vars[3] = block 2 velocity
```
Parameters:
```text
R = rest length
S1 = left end of spring
S2 = right end of spring (same as x?)
len = current length of spring = x - S1.getX()
L = how much spring is stretched from rest length
L = len - R = x - S1.getX() - R
k = spring constant
b = damping constant
```
Equations Of Motion
-----------------------------
See also <https://www.myphysicslab.com/collideSpring.html>.

Spring force and damping look like this:
```text
F = -k L -b v = -k (x - S1.getX() - R) - b v = m v'
```
So equations of motion are:
```text
x' = v
v' = -(k/m)(x - S1.getX() - R) -(b/m) v
```
Collision Handling
-----------------------------
When colliding with a wall, just reverse the velocity.

When the two blocks collide, adjust the velocities of particles as follows:
```text
Let vcm = velocity of center of mass of block 1 and 2.
Let v1 = velocity of block 1 before collision
Let v1_after = velocity of block 1 after collision
```
To find new velocity of block 1, find the velocity in the center of mass frame
and reflect it.  This works out to `-v1 + 2 vcm`. Here's the derivation:
```text
Velocity of block 1 in cm frame is v1 - vcm.

In center of mass frame, total momentum is zero; after collision momentum is
preserved; so we just reverse signs of each velocity in cm frame.
Reflection of velocity is
```text
-(v1 - vcm) = vcm - v1
```
Add back `vcm` to get to laboratory frame:
```text
v1_after = vcm + (vcm - v1) = 2 vcm - v1
```
Same derivation applies for block 2.

To Do
-----------------------------
Elasticity parameter.

*/
export class CollideBlocksSim extends AbstractODESim implements Simulation, ODESim, CollisionSim<BlockCollision>, EnergySystem, EventHandler {

  private damping_: number = 0;
  private wallLeft_: PointMass;
  private wallRight_: PointMass;
  private block1_: PointMass;
  private block2_: PointMass;
  private spring1_: Spring;
  private spring2_: Spring;
  private potentialOffset_: number = 0;
  /** Function to paint canvases, for debugging. If defined, this will be called within
  * `moveObjects()` so you can see the simulation state after each
  * time step (you will need to arrange your debugger to pause after
  * each invocation of debugPaint_ to see the state).
  */
  private debugPaint_: null|(()=>void) = null;
  private isDragging: boolean = false;
  /** Function to print collisions, or null to turn off printing collisions. */
  collisionFunction_: null|((bc: BlockCollision, t:Terminal)=>void) = null;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  const var_names = [
    CollideBlocksSim.en.POSITION_1,
    CollideBlocksSim.en.VELOCITY_1,
    CollideBlocksSim.en.POSITION_2,
    CollideBlocksSim.en.VELOCITY_2,
    VarsList.en.TIME,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY
  ];
  const i18n_names = [
    CollideBlocksSim.i18n.POSITION_1,
    CollideBlocksSim.i18n.VELOCITY_1,
    CollideBlocksSim.i18n.POSITION_2,
    CollideBlocksSim.i18n.VELOCITY_2,
    VarsList.i18n.TIME,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_SIM'));
  this.getVarsList().setComputed(KE, PE, TE);
  this.wallLeft_ = PointMass.makeRectangle(0.4, 4, 'wallLeft');
  this.wallLeft_.setMass(Infinity);
  this.wallLeft_.setPosition(new Vector(-0.2,  0));
  this.wallRight_ = PointMass.makeRectangle(0.4, 4, 'wallRight');
  this.wallRight_.setMass(Infinity);
  this.wallRight_.setPosition(new Vector(7.2,  0));
  this.block1_ = PointMass.makeSquare(0.6, 'block1');
  this.block1_.setMass(0.5);
  this.block2_ = PointMass.makeSquare(0.6, 'block2');
  this.block2_.setMass(1.5);
  this.spring1_ = new Spring('spring1', /*body1=*/this.wallLeft_,
      /*attach1_body=*/ new Vector(this.wallLeft_.getWidth()/2, 0),
      /*body2=*/this.block1_, /*attach2_body=*/ Vector.ORIGIN,
      /*restlength=*/2.5, /*stiffness=*/6.0);
  this.spring2_ = new Spring('spring2', /*body1=*/this.wallRight_,
      /*attach1_body=*/ new Vector(-this.wallRight_.getWidth()/2, 0),
      /*body2=*/this.block2_, /*attach2_body=*/ Vector.ORIGIN,
      /*restlength=*/2.5, /*stiffness=*/0);
  this.getVarsList().setValues([0.5, 0, 3, 0]);
  this.saveInitialState();
  let pn: ParameterNumber;
  this.getSimList().add(this.wallLeft_, this.wallRight_, this.spring1_, this.spring2_,
      this.block1_, this.block2_);
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.MASS_1,
      CollideBlocksSim.i18n.MASS_1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.MASS_2,
      CollideBlocksSim.i18n.MASS_2,
      () => this.getMass2(), a => this.setMass2(a)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.LENGTH_1,
      CollideBlocksSim.i18n.LENGTH_1,
      () => this.getSpring1Length(), a => this.setSpring1Length(a)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.STIFFNESS_1,
      CollideBlocksSim.i18n.STIFFNESS_1,
      () => this.getSpring1Stiffness(),
      a => this.setSpring1Stiffness(a)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.LENGTH_2,
      CollideBlocksSim.i18n.LENGTH_2,
      () => this.getSpring2Length(), a => this.setSpring2Length(a)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.STIFFNESS_2,
      CollideBlocksSim.i18n.STIFFNESS_2,
      () => this.getSpring2Stiffness(),
      a => this.setSpring2Stiffness(a)));
  this.addParameter(new ParameterNumber(this, CollideBlocksSim.en.DAMPING,
      CollideBlocksSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', block1_: '+this.block1_
      +', block2_: '+this.block2_
      +', wallLeft_: '+this.wallLeft_
      +', wallRight_: '+this.wallRight_
      +', spring1_: '+this.spring1_
      +', spring2_: '+this.spring2_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'CollideBlocksSim';
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const ke = this.block1_.getKineticEnergy() + this.block2_.getKineticEnergy();
  const pe = this.spring1_.getPotentialEnergy() + this.spring2_.getPotentialEnergy();
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number) {
  this.potentialOffset_ = value;
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects() {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  const ei = this.getEnergyInfo();
  vars[KE] = ei.getTranslational();
  vars[PE] = ei.getPotential();
  vars[TE] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
* @param vars
*/
private moveObjects(vars: number[]): void {
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  this.block1_.setPosition(new Vector(vars[X1], 0));
  this.block1_.setVelocity(new Vector(vars[V1], 0));
  this.block2_.setPosition(new Vector(vars[X2], 0));
  this.block2_.setVelocity(new Vector(vars[V2], 0));
  if (this.debugPaint_ != null) {
    this.debugPaint_();
  }
};

/** @inheritDoc */
setDebugPaint(fn: null|(()=>void)): void {
  this.debugPaint_ = fn;
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject == this.block1_ || simObject == this.block2_) {
    this.isDragging = true;
    return true;
  } else {
    return false;
  }
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  // maintain gap between objects, to avoid stuck collision problems.
  const gap = 0.02;
  const va = this.getVarsList();
  const vars = va.getValues();
  const p = location.subtract(offset);
  // objects other than mass 1 and mass 2 are not allowed to be dragged
  if (simObject == this.block1_)  {
    let x = p.getX();
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
    vars[X1] = x;
    vars[V1] = 0;
    vars[X2] = this.block2_.getPosition().getX();
    vars[V2] = 0;
    va.setValues(vars);
  } else if (simObject == this.block2_) {
    let x = p.getX();
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
    vars[X1] = this.block1_.getPosition().getX();
    vars[V1] = 0;
    vars[X2] = x;
    vars[V2] = 0;
    va.setValues(vars);
  }
  this.moveObjects(vars);
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  this.isDragging = false;
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/**
* @param collisions
* @param leftBlock
* @param rightBlock
* @param time
*/
private addCollision(collisions: BlockCollision[], leftBlock: PointMass, rightBlock: PointMass, time: number) {
  const c = new BlockCollision(leftBlock, rightBlock, time);
  if (c.getDistance() < 0.1) {
    // Avoid adding a duplicate collision.
    // Is there already an equivalent collision?
    const similar = collisions.find(c2 => c.similarTo(c2));
    if (similar) {
      const c2 = similar;
      // Pick the collision with smaller distance, or the needsHandling flag
      if (!c2.needsHandling() && c.getDistance() < c2.getDistance()) {
        Util.remove(collisions, c2);
        collisions.push(c);
      }
    } else {
      collisions.push(c);
    }
  }
};

/** @inheritDoc */
findCollisions(collisions: BlockCollision[], vars: number[], stepSize: number): void {
  // Assumes only 3 possible collisions.
  this.moveObjects(vars);
  const time = this.getTime() + stepSize;
  this.addCollision(collisions, this.wallLeft_, this.block1_, time);
  this.addCollision(collisions, this.block1_, this.block2_, time);
  this.addCollision(collisions, this.block2_, this.wallRight_, time);
};

/** @inheritDoc */
handleCollisions(collisions: BlockCollision[], opt_totals?: CollisionTotals): boolean {
  const va = this.getVarsList();
  const seq0 = va.getVariable(0).getSequence();
  const seq2 = va.getVariable(2).getSequence();
  const vars = va.getValues();
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  collisions.forEach(c => {
    if (c.leftBlock_ == this.wallLeft_ && c.rightBlock_ == this.block1_) {
      // mass1 collided with left wall, so just reverse the velocity
      c.impulse = Math.abs(vars[V1] * this.block1_.getMass());
      va.setValue(V1, -vars[V1]);
    } else if (c.rightBlock_ == this.wallRight_ && c.leftBlock_ == this.block2_) {
      // mass2 collided with right wall, so just reverse the velocity
      c.impulse = Math.abs(vars[V2] * this.block2_.getMass());
      va.setValue(V2, -vars[V2]);
    } else if (c.leftBlock_ == this.block1_ && c.rightBlock_ == this.block2_) {
      // mass1 and mass2 collided.
      // Find velocity of center of mass.
      const vcm = (this.block1_.getMass()*vars[V1] + this.block2_.getMass()*vars[V2]) /
         (this.block1_.getMass() + this.block2_.getMass());
      c.impulse = Math.abs(2*(vcm - vars[V2]) * this.block2_.getMass());
      va.setValue(V1, -vars[V1] + 2*vcm);
      va.setValue(V2, -vars[V2] + 2*vcm);
    } else {
      throw 'illegal collision '+c;
    }
    if (opt_totals) {
      opt_totals.addImpulses(1);
    }
    if (this.collisionFunction_ && this.terminal_) {
      this.collisionFunction_(c, this.terminal_);
    }
  });
  // the position variables should have same sequence number
  Util.assert(va.getVariable(X1).getSequence() == seq0);
  Util.assert(va.getVariable(X2).getSequence() == seq2);
  return true;
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  Util.zeroArray(change);
  change[TIME] = 1.0;  // time
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  this.moveObjects(vars);
  if (!this.isDragging) {
    change[X1] = vars[V1]; // x' = v
    // v' = -(k/m)(x - S1.getX() - R) - (damping/m) v
    change[V1] = (-this.spring1_.getStiffness() * this.spring1_.getStretch() -
        this.damping_ * vars[V1]) / this.block1_.getMass();
    change[X2] = vars[V2]; // x' = v
    // v' = 0 because constant velocity
    change[V2] = (this.spring2_.getStiffness() * this.spring2_.getStretch() -
        this.damping_ * vars[V2]) / this.block2_.getMass();
  }
  return null;
};

/**
*/
getMomentum(): number {
  this.modifyObjects();
  const m1 = this.block1_.getVelocity().multiply(this.block1_.getMass());
  const m2 = this.block2_.getVelocity().multiply(this.block2_.getMass());
  return m1.add(m2).length();
};

/**
*/
getMass1(): number {
  return this.block1_.getMass();
};

/**
* @param value
*/
setMass1(value: number) {
  this.block1_.setMass(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(CollideBlocksSim.en.MASS_1);
};

/**
*/
getMass2(): number {
  return this.block2_.getMass();
};

/**
* @param value
*/
setMass2(value: number) {
  this.block2_.setMass(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(CollideBlocksSim.en.MASS_2);
};

/**
*/
getDamping(): number {
  return this.damping_;
};

/**
* @param value
*/
setDamping(value: number) {
  this.damping_ = value;
  this.broadcastParameter(CollideBlocksSim.en.DAMPING);
};

/**
*/
getSpring1Stiffness(): number {
  return this.spring1_.getStiffness();
};

/**
* @param value
*/
setSpring1Stiffness(value: number) {
  this.spring1_.setStiffness(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(CollideBlocksSim.en.STIFFNESS_1);
};

/**
*/
getSpring1Length(): number {
  return this.spring1_.getRestLength();
};

/**
* @param value
*/
setSpring1Length(value: number) {
  this.spring1_.setRestLength(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(CollideBlocksSim.en.LENGTH_1);
};

/**
*/
getSpring2Stiffness(): number {
  return this.spring2_.getStiffness();
};

/**
* @param value
*/
setSpring2Stiffness(value: number) {
  this.spring2_.setStiffness(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(CollideBlocksSim.en.STIFFNESS_2);
};

/**
*/
getSpring2Length(): number {
  return this.spring2_.getRestLength();
};

/**
* @param value
*/
setSpring2Length(value: number) {
  this.spring2_.setRestLength(value);
  // 0   1    2   3   4    5   6   7
  // x1, v1, x2, v2, time, KE, PE, TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(CollideBlocksSim.en.LENGTH_2);
};

/**  Sets a function for  printing  collisions.  The function is called whenever a
collision occurs.  The function takes two variables: a BlockCollision and a Terminal.
This can be defined from within the Terminal by the user. Here is an example usage
```js
sim.setCollisionFunction(function(c,t) {
  const s = c.getDetectedTime().toFixed(2)+"\t"
    +c.getImpulse().toFixed(2)+"\t"
    +c.rightBlock_.getPosition().getX().toFixed(2)+"\t"
    +c.leftBlock_.getName()+"\t"
    +c.rightBlock_.getName();
  t.println(s);
})
```
@param f the function to print collisions,
     or `null` to turn off printing collisions
*/
setCollisionFunction(f: null|((bc: BlockCollision, t:Terminal)=>void)) {
  this.collisionFunction_ = f;
};

static readonly en: i18n_strings = {
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

static readonly de_strings: i18n_strings = {
  ACCELERATION: 'Beschleunigung',
  DAMPING: 'Dämpfung',
  MASS_1: 'Masse 1',
  MASS_2: 'Masse 2',
  POSITION_1: 'Position 1',
  POSITION_2: 'Position 2',
  LENGTH_1: 'Feder 1 Länge',
  STIFFNESS_1: 'Feder 1 Steifigkeit',
  LENGTH_2: 'Feder 2 Länge',
  STIFFNESS_2: 'Feder 2 Steifigkeit',
  VELOCITY_1: 'Geschwindigkeit 1',
  VELOCITY_2: 'Geschwindigkeit 2'
};

static readonly i18n = Util.LOCALE === 'de' ? CollideBlocksSim.de_strings : CollideBlocksSim.en;

} // end class

type i18n_strings = {
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
};

Util.defineGlobal('sims$springs$CollideBlocksSim', CollideBlocksSim);
