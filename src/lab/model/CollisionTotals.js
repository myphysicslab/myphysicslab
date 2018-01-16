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

goog.provide('myphysicslab.lab.model.CollisionTotals');

goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** Keeps long term statistics about collision handling, for testing, debugging,
and performance measurement.

* @constructor
* @final
* @struct
*/
myphysicslab.lab.model.CollisionTotals = function() {
  /** number of times we had to do a binary search for collision
  * @type {number}
  * @private
  */
  this.searches_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.impulses_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.collisions_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.steps_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.backups_ = 0;
};
var CollisionTotals = myphysicslab.lab.model.CollisionTotals;

if (!Util.ADVANCED) {
  /** @override */
  CollisionTotals.prototype.toString = function() {
    return 'CollisionTotals{searches: '+this.searches_
        +', impulses: '+this.impulses_
        +', collisions: '+this.collisions_
        +', steps: '+this.steps_
        +', backups: '+this.backups_
        +'}';
  };
};

/** Adds to number of times that the simulation state was restored to an earlier state
because a collision was detected.
* @param {number} backups additional number of times that simulation was backed
    up in time.
*/
CollisionTotals.prototype.addBackups = function(backups) {
  this.backups_ += backups;
};

/** Adds to number of collisions handled.
* @param {number} collisions additional number of collisions handled
*/
CollisionTotals.prototype.addCollisions = function(collisions) {
  this.collisions_ += collisions;
};

/** Adds to number of impulses applied.
* @param {number} impulses additional number of impulses applied
*/
CollisionTotals.prototype.addImpulses = function(impulses) {
  this.impulses_ += impulses;
};

/** Adds to number of binary searches completed.
A binary search occurs when we don't have an accurate estimate of the time
that a collision occurs.
* @param {number} searches additional number of binary searches completed
*/
CollisionTotals.prototype.addSearches = function(searches) {
  this.searches_ += searches;
};

/** Adds to number of times that the DiffEqSolver stepped the simulation forward.
* @param {number} steps additional number of times that the DiffEqSolver
    stepped the simulation forward.
*/
CollisionTotals.prototype.addSteps = function(steps) {
  this.steps_ += steps;
};

/** Returns total cumulative number of times that the simulation state was restored to
an earlier state because a collision was detected.
@return {number} total number of times simulation state was moved back in time
*/
CollisionTotals.prototype.getBackups = function() {
  return this.backups_;
};

/** Returns total cumulative number of collisions that have been handled.
@return {number} number of collisions handled
*/
CollisionTotals.prototype.getCollisions = function() {
  return this.collisions_;
};

/** Returns total cumulative number of impulses that have been applied. This can be
larger than the number of collisions when the collision handling applies several
impulses as collisions ricochet back and forth during a single collision event.
@return {number} number of impulses applied
*/
CollisionTotals.prototype.getImpulses = function() {
  return this.impulses_;
};

/** Returns total cumulative number of binary searches that have been done.
A binary search occurs when we don't have an accurate estimate of the time
that a collision occurs.
@return {number} number of collision searches done
*/
CollisionTotals.prototype.getSearches = function() {
  return this.searches_;
};

/** Returns total cumulative number of DiffEqSolver steps that have been done.
@return {number} total number of DiffEqSolver steps done.
*/
CollisionTotals.prototype.getSteps = function() {
  return this.steps_;
};

/** Resets the various collision statistics to zero.
* @return {undefined}
*/
CollisionTotals.prototype.reset = function() {
  this.impulses_ = 0;
  this.collisions_ = 0;
  this.steps_ = 0;
  this.searches_ = 0;
  this.backups_ = 0;
};

}); // goog.scope
