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

goog.provide('myphysicslab.sims.springs.MoleculeCollision');

goog.require('myphysicslab.lab.model.Collision');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var NF7 = myphysicslab.lab.util.UtilityCore.NF7;
var PointMass = myphysicslab.lab.model.PointMass;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Collision between an atom and a wall in
{@link myphysicslab.sims.springs.Molecule1Sim Molecule1Sim} simulation.

* @param {!PointMass} atom
* @param {!PointMass} wall
* @param {string} side one of {@link #TOP_WALL}, {@link #BOTTOM_WALL},
*    {@link #LEFT_WALL}, {@link #RIGHT_WALL}
* @param {number} time
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.model.Collision}
*/
myphysicslab.sims.springs.MoleculeCollision = function(atom, wall, side, time) {
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
  this.impulse = UtilityCore.NaN;
  this.updateCollision(time);
};
var MoleculeCollision = myphysicslab.sims.springs.MoleculeCollision;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  MoleculeCollision.prototype.toString = function() {
    return 'MoleculeCollision{'
        +'distance: '+NF5(this.distance_)
        +', targetGap: '+NF5(this.targetGap_)
        +', accuracy: '+NF5(this.accuracy_)
        +', detectedTime: '+NF7(this.detectedTime_)
        +', impulse: '+NF5(this.impulse)
        +', mustHandle: '+this.mustHandle_
        +', atom: '+this.atom
        +', wall: '+this.wall
        +', side: '+this.side
        +'}';
  };
};

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


/** @inheritDoc */
MoleculeCollision.prototype.closeEnough = function(allowTiny) {
  if (allowTiny) {
    return this.distance_ > 0 && this.distance_ < this.targetGap_ + this.accuracy_;
  } else {
    return Math.abs(this.distance_ - this.targetGap_) <= this.accuracy_;
  }
};

/** @inheritDoc */
MoleculeCollision.prototype.bilateral = function() {
  return false;
};

/** @inheritDoc */
MoleculeCollision.prototype.contact = function() {
  return false;
};

/** @inheritDoc */
MoleculeCollision.prototype.getDetectedTime = function() {
  return this.detectedTime_;
};

/** @inheritDoc */
MoleculeCollision.prototype.getDistance = function() {
  return this.distance_;
};

/** @inheritDoc */
MoleculeCollision.prototype.getEstimatedTime = function() {
  return UtilityCore.NaN; // don't bother
};

/** @inheritDoc */
MoleculeCollision.prototype.getImpulse = function() {
  return this.impulse;
};

/** @inheritDoc */
MoleculeCollision.prototype.getVelocity = function() {
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

/** @inheritDoc */
MoleculeCollision.prototype.illegalState = function() {
  return this.distance_ < 0;
};

/** @inheritDoc */
MoleculeCollision.prototype.isColliding = function() {
  return this.distance_ < this.targetGap_ - this.accuracy_;
};

/** @inheritDoc */
MoleculeCollision.prototype.isTouching = function() {
  return this.distance_ < 2*this.targetGap_;
};

/** @inheritDoc */
MoleculeCollision.prototype.needsHandling = function() {
  return this.mustHandle_;
};

/** @inheritDoc */
MoleculeCollision.prototype.setNeedsHandling = function(needsHandling) {
  this.mustHandle_ = needsHandling;
};

/** @inheritDoc */
MoleculeCollision.prototype.updateCollision = function(time) {
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

}); // goog.scope
