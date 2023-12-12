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

import { Collision } from '../../lab/model/Collision.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { Util } from '../../lab/util/Util.js';

/** Horizontal collision between two PointMass's.
*/
export class BlockCollision implements Collision {

  /** object 1 of collision */
  leftBlock_: PointMass;
  /** object 2 of collision */
  rightBlock_: PointMass;
  private detectedTime_: number;
  /** distance between objects;  negative = penetration */
  private distance_: number = NaN;
  private mustHandle_: boolean = false;
  /** target gap size after collision search finishes */
  private targetGap_: number = 0.005;
  /** the collision distance accuracy: how close we must be to the actual position of
  * collision in order to be able to handle it.
  */
  private accuracy_: number = 0.005;
  /** amount of impulse applied during collision */
  impulse: number = NaN;

/**
* @param leftBlock
* @param rightBlock
* @param time
*/
constructor(leftBlock: PointMass, rightBlock: PointMass, time: number) {
  this.leftBlock_ = leftBlock;
  this.rightBlock_ = rightBlock;
  this.detectedTime_ = time;
  this.updateCollision(time);
};

/** @inheritDoc */
toString() {
  return 'BlockCollision{'
      +'distance: '+Util.NF5(this.distance_)
      +', targetGap: '+Util.NF5(this.targetGap_)
      +', accuracy: '+Util.NF5(this.accuracy_)
      +', detectedTime: '+Util.NF7(this.detectedTime_)
      +', impulse: '+Util.NF5(this.impulse)
      +', mustHandle: '+this.mustHandle_
      +', leftBlock: '+this.leftBlock_
      +', rightBlock: '+this.rightBlock_
      +'}';
};

/** @inheritDoc */
bilateral(): boolean {
  return false;
};

/** @inheritDoc */
closeEnough(allowTiny: boolean) {
  if (allowTiny) {
    return this.distance_ > 0 && this.distance_ < this.targetGap_ + this.accuracy_;
  } else {
    return Math.abs(this.distance_ - this.targetGap_) <= this.accuracy_;
  }
};

/** @inheritDoc */
contact(): boolean {
  return false;
};

/** @inheritDoc */
getDetectedTime(): number {
  return this.detectedTime_;
};

/** @inheritDoc */
getDistance(): number {
  return this.distance_;
};

/** @inheritDoc */
getEstimatedTime(): number {
  return NaN; // don't bother
};

/** @inheritDoc */
getImpulse(): number {
  return this.impulse;
};

/** @inheritDoc */
getVelocity(): number {
  // because these blocks only collide horizontally, we use only the x value
  return this.rightBlock_.getVelocity().subtract(this.leftBlock_.getVelocity()).getX();
};

/** @inheritDoc */
illegalState(): boolean {
  return this.distance_ < 0;
};

/** @inheritDoc */
isColliding(): boolean {
  return this.distance_ < this.targetGap_ - this.accuracy_;
};

/** @inheritDoc */
isTouching(): boolean {
  return this.distance_ < 2*this.targetGap_;
};

/** @inheritDoc */
needsHandling(): boolean {
  return this.mustHandle_;
};

/** @inheritDoc */
setNeedsHandling(needsHandling: boolean) {
  this.mustHandle_ = needsHandling;
};

/** Returns whether this collision is similar to the given collision.
* @param c
*/
similarTo(c: BlockCollision): boolean {
  return c.leftBlock_ == this.leftBlock_ && c.rightBlock_ == this.rightBlock_;
};

/** @inheritDoc */
updateCollision(_time: number) {
  this.distance_ = this.rightBlock_.getLeftWorld() - this.leftBlock_.getRightWorld();
};

} // end class

Util.defineGlobal('sims$springs$BlockCollision', BlockCollision);
