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

export const enum Side {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
};

/** Collision between an atom and a wall in
{@link sims/springs/MoleculeSim.MoleculeSim | MoleculeSim} simulation.
*/
export class MoleculeCollision implements Collision {

  atom: PointMass;
  wall: PointMass;
  side: Side;
  private detectedTime_: number;
  /** distance between objects;  negative = penetration */
  private distance_: number = NaN;
  private mustHandle_: boolean = false;
  /** target gap size after collision search finishes */
  private targetGap_: number = 0.005;
  /** the collision distance accuracy: how close we must be to the moment of
  * collision in order to be able to handle it.
  */
  private accuracy_: number = 0.005;
  /** amount of impulse applied during collision */
  impulse: number = NaN;

/**
* @param atom
* @param wall
* @param side
* @param time
*/
constructor(atom: PointMass, wall: PointMass, side: Side, time: number) {
  this.atom = atom;
  this.wall = wall;
  this.side = side;
  this.detectedTime_ = time;
  this.updateCollision(time);
};

/** @inheritDoc */
toString() {
  return 'MoleculeCollision{'
      +'distance: '+Util.NF5(this.distance_)
      +', targetGap: '+Util.NF5(this.targetGap_)
      +', accuracy: '+Util.NF5(this.accuracy_)
      +', detectedTime: '+Util.NF7(this.detectedTime_)
      +', impulse: '+Util.NF5(this.impulse)
      +', mustHandle: '+this.mustHandle_
      +', atom: '+this.atom
      +', wall: '+this.wall
      +', side: '+this.side
      +'}';
};

/** @inheritDoc */
closeEnough(allowTiny: boolean): boolean {
  if (allowTiny) {
    return this.distance_ > 0 && this.distance_ < this.targetGap_ + this.accuracy_;
  } else {
    return Math.abs(this.distance_ - this.targetGap_) <= this.accuracy_;
  }
};

/** @inheritDoc */
bilateral(): boolean {
  return false;
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
  const v = this.atom.getVelocity();
  // Returns the relative normal velocity between the two collision points.
  // Negative velocity means colliding, positive means separating.
  switch (this.side) {
    case Side.TOP:
      return -v.getY();
    case Side.BOTTOM:
      return v.getY();
    case Side.LEFT:
      return v.getX();
    case Side.RIGHT:
      return -v.getX();
    default:
      throw 'no such side '+this.side;
  }
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

/** @inheritDoc */
updateCollision(_time: number) {
  const a = this.atom.getBoundsWorld();
  const w = this.wall.getBoundsWorld();
  switch (this.side) {
    case Side.TOP:
      this.distance_ = w.getTop() - a.getTop();
      break;
    case Side.BOTTOM:
      this.distance_ = a.getBottom() - w.getBottom();
      break;
    case Side.LEFT:
      this.distance_ = a.getLeft() - w.getLeft();
      break;
    case Side.RIGHT:
      this.distance_ = w.getRight() - a.getRight();
      break;
    default:
      throw 'no such side '+this.side;
  }
};

} // end class

Util.defineGlobal('sims$springs$MoleculeCollision', MoleculeCollision);
