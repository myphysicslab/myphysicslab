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

goog.provide('myphysicslab.lab.model.CollisionStats');

goog.require('goog.array');
goog.require('myphysicslab.lab.model.Collision');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var NF7 = myphysicslab.lab.util.UtilityCore.NF7;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Calculates statistics about a particular set of Collisions.

Statistics are simply stored in public properties, there are no 'getter' or 'setter'
methods.

* @constructor
* @final
* @struct
*/
myphysicslab.lab.model.CollisionStats = function() {
  /** number of collisions
  * @type {number}
  */
  this.numCollisions = 0;
  /** number of joints
  * @type {number}
  */
  this.numJoints = 0;
  /** number of contacts
  * @type {number}
  */
  this.numContacts = 0;
  /** number of collisions that are not resting contacts
  * @type {number}
  */
  this.numNonContact = 0;
  /** number of collisions that need to be handled
  * @type {number}
  */
  this.numNeedsHandling = 0;
  /** number of imminent collisions
  * @type {number}
  */
  this.numImminent = 0;
  var infinity = UtilityCore.POSITIVE_INFINITY;
  /** the minimum --least positive or most negative-- distance among the collisions
  * @type {number}
  */
  this.minDistance = infinity;
  /** estimated time of earliest collision, or NaN if can't determine
  * @type {number}
  */
  this.estTime = infinity;
  /** time when earliest collision was detected
  * @type {number}
  */
  this.detectedTime = infinity;
};
var CollisionStats = myphysicslab.lab.model.CollisionStats;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  CollisionStats.prototype.toString = function() {
    var s= 'CollisionStats{collisions: '+this.numCollisions;
    if (this.numCollisions > 0) {
      s += ', estTime: '+NF7(this.estTime)
          +', detectedTime: '+NF7(this.detectedTime)
          +', needsHandling: '+this.numNeedsHandling
          +', minDistance: '+NF7(this.minDistance)
          +', nonContact: '+this.numNonContact
          +', imminent: '+this.numImminent
          +', joints: '+this.numJoints
          +', contacts: '+this.numContacts;
    }
    return s+'}';
  };
};

/** Resets statistics to start from zero.
@return {undefined}
*/
CollisionStats.prototype.clear = function() {
  this.numCollisions = 0;
  this.numJoints = 0;
  this.numContacts = 0;
  this.numNonContact = 0;
  this.numNeedsHandling = 0;
  this.numImminent = 0;
  var infinity = UtilityCore.POSITIVE_INFINITY;
  this.minDistance = infinity;
  this.estTime = infinity;
  this.detectedTime = infinity;
};

/** Collects the collision statistics about the given set of collisions.
First calls {@link #clear} to start from zero.
@param {!Array<!myphysicslab.lab.model.Collision>} collisions the set of collisions to
    examine
*/
CollisionStats.prototype.update =  function(collisions) {
  var infinity = UtilityCore.POSITIVE_INFINITY;
  this.clear();
  this.numCollisions = collisions.length;
  goog.array.forEach(collisions, function(c) {
    if (c.bilateral()) {
      this.numJoints++;
    } else if (c.contact()) {
      this.numContacts++;
    }
    if (!c.contact()) {
      this.numNonContact++;
    }
    if (c.needsHandling()) {
      this.numNeedsHandling++;
      if (c.getDetectedTime() < this.detectedTime)
        this.detectedTime = c.getDetectedTime();
    }
    // Don’t consider separating contacts with positive velocity when determining
    // estimated collision time.
    if ((c.needsHandling() || !c.contact()) && c.getVelocity() < 0) {
      this.numImminent++;
      var dist = c.getDistance();
      if (!isFinite(dist)) {
        throw new Error('distance is NaN '+c);
      }
      if (dist < this.minDistance) {
        this.minDistance = dist;
      }
      // if _any_ estimated time is NaN, then we don't know estimated time.
      if (!isNaN(this.estTime)) {
        var t = c.getEstimatedTime();
        if (isNaN(t)) {
          this.estTime = UtilityCore.NaN;
        } else if (t < this.estTime) {
            this.estTime = t;
        }
      }
    }
  }, this);
  if (this.estTime == infinity) {
    this.estTime = UtilityCore.NaN;
  }
  if (this.detectedTime == infinity) {
    this.detectedTime = UtilityCore.NaN;
  }
};

}); // goog.scope
