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

goog.module('myphysicslab.sims.roller.RollerCollision');

const Collision = goog.require('myphysicslab.lab.model.Collision');
const Util = goog.require('myphysicslab.lab.util.Util');
const NumericalPath = goog.require('myphysicslab.lab.model.NumericalPath');
const PathPoint = goog.require('myphysicslab.lab.model.PathPoint');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');

/** Collision used by RollerFlightSim.

* @implements {Collision}
*/
class RollerCollision {
/**
* @param {!PointMass} ball
* @param {!NumericalPath} path
* @param {number} time
*/
constructor(ball, path, time) {
  /**
  * @type {!PointMass}
  * @private
  */
  this.ball_ = ball;
  /**
  * @type {!NumericalPath}
  * @private
  */
  this.path_ = path;
  /**
  * @type {!PathPoint}
  * @private
  */
  this.pathPoint_ = new PathPoint();
  /** depth of collision, negative = penetration
  * @type {number}
  * @private
  */
  this.distance_ = NaN;
  /**
  * @type {number}
  * @private
  */
  this.detectedTime_ = time;
  /**
  * @type {boolean}
  * @private
  */
  this.mustHandle_ = false;
  /** the collision distance accuracy: how close we must be to the moment of
  * collision in order to be able to handle it.
  * @type {number}
  * @private
  */
  this.accuracy_ = 0.005;
  /** amount of impulse applied during collision
  * @type {number}
  * @package
  */
  this.impulse = Util.NaN;
  /** relative normal velocity between the two collision points
  * @type {number}
  * @package
  */
  this.velocity = Util.NaN;
  this.updateCollision(time);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'RollerCollision{'
      +'distance='+Util.NF(this.distance_)
      +', accuracy='+Util.NF(this.accuracy_)
      +', detectedTime='+Util.NF(this.detectedTime_)
      +', impulse: '+Util.NF5(this.impulse)
      +', velocity: '+Util.NF5(this.velocity)
      +', position='+this.ball_.getPosition()
      +'}';
};

/**
* @return {!PathPoint}
*/
getPathPoint() {
  return this.pathPoint_;
};

/** @override */
closeEnough(allowTiny) {
  return Math.abs(this.distance_) <= this.accuracy_;
};

/** @override */
isTouching() {
  return true;
};

/** @override */
isColliding() {
  return this.distance_ < -this.accuracy_;
};

/** @override */
getDistance() {
  return this.distance_;
};

/** @override */
getDetectedTime() {
  return this.detectedTime_;
};

/** @override */
getEstimatedTime() {
  return Util.NaN;
};

/** @override */
bilateral() {
  return false;
};

/** @override */
contact() {
  return false;
};

/** @override */
illegalState() {
  return this.distance_ < -this.accuracy_;
};

/** @override */
setNeedsHandling(needsHandling) {
  this.mustHandle_ = needsHandling;
};

/** @override */
needsHandling() {
  return this.mustHandle_;
};

/** @override */
updateCollision(time) {
  // Assume that the track does not loop.
  // Then if the ball is below the track there has been a collision.
  this.pathPoint_ = new PathPoint();
  var pos = this.ball_.getPosition();
  this.pathPoint_.x = pos.getX();
  this.path_.map_x_to_y_p(this.pathPoint_);
  this.path_.map_p_to_slope(this.pathPoint_);
  this.distance_ = pos.getY() - this.pathPoint_.getY();
  var normal = this.pathPoint_.getNormal();
  this.velocity = this.ball_.getVelocity().dotProduct(normal);
};

/** @override */
getImpulse() {
  return this.impulse;
};

/** @override */
getVelocity() {
  return this.velocity;
};

} // end class

exports = RollerCollision;
