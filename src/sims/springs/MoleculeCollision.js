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

goog.module('myphysicslab.sims.springs.MoleculeCollision');

const Collision = goog.require('myphysicslab.lab.model.Collision');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Collision between an atom and a wall in
{@link myphysicslab.sims.springs.Molecule1Sim Molecule1Sim} simulation.

* @implements {Collision}
*/
class MoleculeCollision {
/**
* @param {!PointMass} atom
* @param {!PointMass} wall
* @param {string} side one of {@link #TOP_WALL}, {@link #BOTTOM_WALL},
*    {@link #LEFT_WALL}, {@link #RIGHT_WALL}
* @param {number} time
*/
constructor(atom, wall, side, time) {
  /**
  * @type {!PointMass}
  */
  this.atom = atom;
  /**
  * @type {!PointMass}
  */
  this.wall = wall;
  /**
  * @type {string}
  */
  this.side = side;
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
  this.updateCollision(time);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'MoleculeCollision{'
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

/** @override */
closeEnough(allowTiny) {
  if (allowTiny) {
    return this.distance_ > 0 && this.distance_ < this.targetGap_ + this.accuracy_;
  } else {
    return Math.abs(this.distance_ - this.targetGap_) <= this.accuracy_;
  }
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
getDetectedTime() {
  return this.detectedTime_;
};

/** @override */
getDistance() {
  return this.distance_;
};

/** @override */
getEstimatedTime() {
  return Util.NaN; // don't bother
};

/** @override */
getImpulse() {
  return this.impulse;
};

/** @override */
getVelocity() {
  var v = this.atom.getVelocity();
  // Returns the relative normal velocity between the two collision points.
  // Negative velocity means colliding, positive means separating.
  switch (this.side) {
    case MoleculeCollision.TOP_WALL:
      return -v.getY();
    case MoleculeCollision.BOTTOM_WALL:
      return v.getY();
    case MoleculeCollision.LEFT_WALL:
      return v.getX();
    case MoleculeCollision.RIGHT_WALL:
      return -v.getX();
    default:
      throw new Error('no such side '+this.side);
  }
};

/** @override */
illegalState() {
  return this.distance_ < 0;
};

/** @override */
isColliding() {
  return this.distance_ < this.targetGap_ - this.accuracy_;
};

/** @override */
isTouching() {
  return this.distance_ < 2*this.targetGap_;
};

/** @override */
needsHandling() {
  return this.mustHandle_;
};

/** @override */
setNeedsHandling(needsHandling) {
  this.mustHandle_ = needsHandling;
};

/** @override */
updateCollision(time) {
  var a = this.atom.getBoundsWorld();
  var w = this.wall.getBoundsWorld();
  switch (this.side) {
    case MoleculeCollision.TOP_WALL:
      this.distance_ = w.getTop() - a.getTop();
      break;
    case MoleculeCollision.BOTTOM_WALL:
      this.distance_ = a.getBottom() - w.getBottom();
      break;
    case MoleculeCollision.LEFT_WALL:
      this.distance_ = a.getLeft() - w.getLeft();
      break;
    case MoleculeCollision.RIGHT_WALL:
      this.distance_ = w.getRight() - a.getRight();
      break;
    default:
      throw new Error('no such side '+this.side);
  }
};

} //end class

/**
@type {string}
@const
*/
MoleculeCollision.TOP_WALL = 'top';

/**
@type {string}
@const
*/
MoleculeCollision.BOTTOM_WALL = 'bottom';

/**
@type {string}
@const
*/
MoleculeCollision.LEFT_WALL = 'left';

/**
@type {string}
@const
*/
MoleculeCollision.RIGHT_WALL = 'right';

exports = MoleculeCollision;
