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
import { NumericalPath } from '../../lab/model/NumericalPath.js';
import { PathPoint } from '../../lab/model/PathPoint.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { Util } from '../../lab/util/Util.js';

/** Collision used by {@link sims/roller/RollerFlightSim.RollerFlightSim}.
*/
export class RollerCollision implements Collision {

  private ball_: PointMass;
  private path_: NumericalPath;
  private pathPoint_: PathPoint = new PathPoint();
  /** depth of collision, negative = penetration */
  private distance_: number = NaN;
  private detectedTime_: number;
  private mustHandle_: boolean = false;
  /** the collision distance accuracy: how close we must be to the moment of
  * collision in order to be able to handle it.
  */
  private accuracy_: number = 0.005;
  /** amount of impulse applied during collision */
  impulse: number = NaN;
  /** relative normal velocity between the two collision points */
  velocity: number = NaN;

/**
* @param ball
* @param path
* @param time
*/
constructor(ball: PointMass, path: NumericalPath, time: number) {
  this.ball_ = ball;
  this.path_ = path;
  this.detectedTime_ = time;
  this.updateCollision(time);
};

/** @inheritDoc */
toString() {
  return 'RollerCollision{'
      +'distance='+Util.NF(this.distance_)
      +', accuracy='+Util.NF(this.accuracy_)
      +', detectedTime='+Util.NF(this.detectedTime_)
      +', impulse: '+Util.NF5(this.impulse)
      +', velocity: '+Util.NF5(this.velocity)
      +', position='+this.ball_.getPosition()
      +'}';
};

/**
*/
getPathPoint(): PathPoint {
  return this.pathPoint_;
};

/** @inheritDoc */
closeEnough(_allowTiny: boolean): boolean {
  return Math.abs(this.distance_) <= this.accuracy_;
};

/** @inheritDoc */
isTouching(): boolean {
  return true;
};

/** @inheritDoc */
isColliding(): boolean {
  return this.distance_ < -this.accuracy_;
};

/** @inheritDoc */
getDistance(): number {
  return this.distance_;
};

/** @inheritDoc */
getDetectedTime(): number {
  return this.detectedTime_;
};

/** @inheritDoc */
getEstimatedTime(): number {
  return NaN;
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
illegalState(): boolean {
  return this.distance_ < -this.accuracy_;
};

/** @inheritDoc */
setNeedsHandling(needsHandling: boolean) {
  this.mustHandle_ = needsHandling;
};

/** @inheritDoc */
needsHandling(): boolean {
  return this.mustHandle_;
};

/** @inheritDoc */
updateCollision(_time: number) {
  // Assume that the track does not loop.
  // Then if the ball is below the track there has been a collision.
  this.pathPoint_ = new PathPoint();
  const pos = this.ball_.getPosition();
  this.pathPoint_.x = pos.getX();
  this.path_.map_x_to_y_p(this.pathPoint_);
  this.path_.map_p_to_slope(this.pathPoint_);
  this.distance_ = pos.getY() - this.pathPoint_.getY();
  const normal = this.pathPoint_.getNormal();
  this.velocity = this.ball_.getVelocity().dotProduct(normal);
};

/** @inheritDoc */
getImpulse(): number {
  return this.impulse;
};

/** @inheritDoc */
getVelocity(): number {
  return this.velocity;
};

} // end class

Util.defineGlobal('sims$roller$RollerCollision', RollerCollision);
