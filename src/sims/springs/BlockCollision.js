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

goog.provide('myphysicslab.sims.springs.BlockCollision');

goog.require('myphysicslab.lab.model.Collision');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var PointMass = myphysicslab.lab.model.PointMass;
var Util = goog.module.get('myphysicslab.lab.util.Util');

/** Horizontal collision between two PointMass's.
* @param {!PointMass} leftBlock
* @param {!PointMass} rightBlock
* @param {number} time
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.model.Collision}
*/
myphysicslab.sims.springs.BlockCollision = function(leftBlock, rightBlock, time) {
  /** object 1 of collision
  * @type {!PointMass}
  */
  this.leftBlock_ = leftBlock;
  /** object 2 of collision
  * @type {!PointMass}
  */
  this.rightBlock_ = rightBlock;
  /**
  * @type {number}
  * @private
  */
  this.detectedTime_ = time;
  /** distance between objects;  negative = penetration
  * @type {number}
  * @private
  */
  this.distance_ = NaN;
  /**
  * @type {boolean}
  * @private
  */
  this.mustHandle_ = false;
  /** target gap size after collision search finishes
  * @type {number}
  * @private
  */
  this.targetGap_ = 0.005;
  /** the collision distance accuracy: how close we must be to the actual position of
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
  this.updateCollision(time);
};
var BlockCollision = myphysicslab.sims.springs.BlockCollision;

if (!Util.ADVANCED) {
  /** @override */
  BlockCollision.prototype.toString = function() {
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
};

/** @override */
BlockCollision.prototype.bilateral = function() {
  return false;
};

/** @override */
BlockCollision.prototype.closeEnough = function(allowTiny) {
  if (allowTiny) {
    return this.distance_ > 0 && this.distance_ < this.targetGap_ + this.accuracy_;
  } else {
    return Math.abs(this.distance_ - this.targetGap_) <= this.accuracy_;
  }
};

/** @override */
BlockCollision.prototype.contact = function() {
  return false;
};

/** @override */
BlockCollision.prototype.getDetectedTime = function() {
  return this.detectedTime_;
};

/** @override */
BlockCollision.prototype.getDistance = function() {
  return this.distance_;
};

/** @override */
BlockCollision.prototype.getEstimatedTime = function() {
  return Util.NaN; // don't bother
};

/** @override */
BlockCollision.prototype.getImpulse = function() {
  return this.impulse;
};

/** @override */
BlockCollision.prototype.getVelocity = function() {
  // because these blocks only collide horizontally, we use only the x value
  return this.rightBlock_.getVelocity().subtract(this.leftBlock_.getVelocity()).getX();
};

/** @override */
BlockCollision.prototype.illegalState = function() {
  return this.distance_ < 0;
};

/** @override */
BlockCollision.prototype.isColliding = function() {
  return this.distance_ < this.targetGap_ - this.accuracy_;
};

/** @override */
BlockCollision.prototype.isTouching = function() {
  return this.distance_ < 2*this.targetGap_;
};

/** @override */
BlockCollision.prototype.needsHandling = function() {
  return this.mustHandle_;
};

/** @override */
BlockCollision.prototype.setNeedsHandling = function(needsHandling) {
  this.mustHandle_ = needsHandling;
};

/** Returns whether this collision is similar to the given collision.
* @param {!BlockCollision} c
* @return {boolean}
*/
BlockCollision.prototype.similarTo = function(c) {
  return c.leftBlock_ == this.leftBlock_ && c.rightBlock_ == this.rightBlock_;
};

/** @override */
BlockCollision.prototype.updateCollision = function(time) {
  this.distance_ = this.rightBlock_.getLeftWorld() - this.leftBlock_.getRightWorld();
};

}); // goog.scope
