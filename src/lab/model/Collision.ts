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

import { Util } from '../util/Util.js'

/** Represents a collision or contact between objects.
See {@link lab/model/CollisionSim.CollisionSim | CollisionSim}
and {@link lab/model/CollisionAdvance.CollisionAdvance | CollisionAdvance}.
*/
export interface Collision {

/** Returns true if this represents a bilateral constraint which can both push and
pull; for example a {@link lab/engine2D/Joint.Joint | Joint} between two objects.
@return true if this is a bilateral constraint
*/
bilateral(): boolean;

/** Whether close enough to the point when this Collision can be handled.
The `allowTiny` parameter exists because of cases where a
small distance collision cannot be backed-up in time to get near to the preferred
target 'half gap' distance.
@param allowTiny  regard as 'close enough' Collisions that have smaller
    distance than distance accuracy would normally allow
@return true if close enough to the point when this Collision can be handled.
*/
closeEnough(allowTiny: boolean): boolean;

/** Returns true if this is a stable contact: the objects are touching but
not colliding.
@return true if this is a stable contact
*/
contact(): boolean;

/** Returns the simulation time when the Collision was detected.
@return the simulation time when the Collision was detected
*/
getDetectedTime(): number;

/** Returns the distance between the objects. Negative distance means
the objects are interpenetrating.
@return the distance between the objects
*/
getDistance(): number;

/** Returns the estimated time when this Collision should be handled by firing an
impulse.
@return the estimated time when this Collision should be handled or `NaN` if
unknown.
*/
getEstimatedTime(): number;

/** Returns size of impulse (change in momentum) that was applied to this Collision.
@return size of impulse that was applied to this Collision, or NaN if no
impulse applied.
*/
getImpulse(): number;

/** Returns the relative normal velocity between the two collision points.
Negative velocity means the objects are colliding, positive means they are separating.
@return relative normal velocity between the two collision points,
    negative means colliding
*/
getVelocity(): number;

/** Returns true if this represents an illegal state, typically because objects are
interpenetrating.
@return true if this represents an illegal state
*/
illegalState(): boolean;

/** Returns true if this represents a collision state, generally when two objects are
interpenetrating. The collision search mechanism implemented by
{@link lab/model/AdvanceStrategy.AdvanceStrategy.advance | AdvanceStrategy.advance}
operates to set the simulation at a time very close to but just before any Collision is
happening, see {@link getEstimatedTime}.
@return `true` if this represents a collision state
*/
isColliding(): boolean;

/** Whether the distance is small enough that the objects are touching each other
so that impulses can be transmitted.
@return whether the objects are touching each other
*/
isTouching(): boolean;

/** Returns true if this Collision needs to be resolved, such as by applying an impulse
to reverse the velocities of the objects. This remains `true` even after backing up in
time.
@return true if this Collision needs to be resolved
*/
needsHandling(): boolean;

/** Mark this Collision as one that *needs handling* because it is has caused the
collision engine to backup in time in order to resolve this Collision. This is useful
because after backing up in time, a Collision may no longer report itself as
{@link isColliding}.
@param needsHandling true if this Collision needs to be resolved
*/
setNeedsHandling(needsHandling: boolean): void;

/** Updates the information in this Collision to reflect current position and velocity
of bodies.  This is used after *backing up in time* to the moment before the collision.
@param time  the current simulation time
*/
updateCollision(time: number): void;

}; // end interface

// ************************* CollisionTotals ***********************

/** Keeps long term statistics about collision handling, for testing, debugging,
and performance measurement.
*/
export class CollisionTotals {
  /** number of times we had to do a binary search for collision  */
  private searches_: number = 0;
  private impulses_: number = 0;
  private collisions_: number = 0;
  private steps_: number = 0;
  private backups_: number = 0;

constructor() {};

/** @inheritDoc */
toString() {
  return 'CollisionTotals{searches: '+this.searches_
      +', impulses: '+this.impulses_
      +', collisions: '+this.collisions_
      +', steps: '+this.steps_
      +', backups: '+this.backups_
      +'}';
};

/** Adds to number of times that the simulation state was restored to an earlier state
* because a collision was detected.
* @param backups additional number of times that simulation was backed up in time.
*/
addBackups(backups: number) {
  this.backups_ += backups;
};

/** Adds to number of collisions handled.
* @param collisions additional number of collisions handled
*/
addCollisions(collisions: number) {
  this.collisions_ += collisions;
};

/** Adds to number of impulses applied.
* @param impulses additional number of impulses applied
*/
addImpulses(impulses: number) {
  this.impulses_ += impulses;
};

/** Adds to number of binary searches completed. A binary search occurs when we don't
* have an accurate estimate of the time that a collision occurs.
* @param searches additional number of binary searches completed
*/
addSearches(searches: number) {
  this.searches_ += searches;
};

/** Adds to number of times that the DiffEqSolver stepped the simulation forward.
* @param steps additional number of times that the DiffEqSolver stepped the simulation
*    forward.
*/
addSteps(steps: number) {
  this.steps_ += steps;
};

/** Returns total cumulative number of times that the simulation state was restored to
an earlier state because a collision was detected.
@return total number of times simulation state was moved back in time
*/
getBackups(): number {
  return this.backups_;
};

/** Returns total cumulative number of collisions that have been handled.
@return number of collisions handled
*/
getCollisions(): number {
  return this.collisions_;
};

/** Returns total cumulative number of impulses that have been applied. This can be
larger than the number of collisions when the collision handling applies several
impulses as collisions ricochet back and forth during a single collision event.
@return number of impulses applied
*/
getImpulses(): number {
  return this.impulses_;
};

/** Returns total cumulative number of binary searches that have been done.
A binary search occurs when we don't have an accurate estimate of the time
that a collision occurs.
@return number of collision searches done
*/
getSearches(): number {
  return this.searches_;
};

/** Returns total cumulative number of DiffEqSolver steps that have been done.
@return total number of DiffEqSolver steps done.
*/
getSteps(): number {
  return this.steps_;
};

/** Resets the various collision statistics to zero.*/
reset(): void {
  this.impulses_ = 0;
  this.collisions_ = 0;
  this.steps_ = 0;
  this.searches_ = 0;
  this.backups_ = 0;
};

} // end CollisionTotals class

Util.defineGlobal('lab$model$CollisionTotals', CollisionTotals);

// ************************ CollisionStats ****************************

/** Calculates statistics about a particular set of Collisions.

Statistics are simply stored in public properties, there are no 'getter' or 'setter'
methods.
*/
export class CollisionStats {
  /** number of collisions */
  numCollisions: number = 0;
  /** number of joints */
  numJoints: number = 0;
  /** number of contacts */
  numContacts: number = 0;
  /** number of collisions that are not resting contacts */
  numNonContact: number = 0;
  /** number of collisions that need to be handled  */
  numNeedsHandling: number = 0;
  /** number of imminent collisions */
  numImminent: number = 0;
  /** the minimum --least positive or most negative-- distance among the collisions */
  minDistance: number = Infinity;
  /** estimated time of earliest collision, or NaN if can't determine */
  estTime: number = Infinity;
  /** time when earliest collision was detected */
  detectedTime: number = Infinity;

constructor() {};

/** @inheritDoc */
toString() {
  let s= 'CollisionStats{collisions: '+this.numCollisions;
  if (this.numCollisions > 0) {
    s += ', estTime: '+Util.NF7(this.estTime)
        +', detectedTime: '+Util.NF7(this.detectedTime)
        +', needsHandling: '+this.numNeedsHandling
        +', minDistance: '+Util.NF7(this.minDistance)
        +', nonContact: '+this.numNonContact
        +', imminent: '+this.numImminent
        +', joints: '+this.numJoints
        +', contacts: '+this.numContacts;
  }
  return s+'}';
};

/** Resets statistics to start from zero. */
clear(): void {
  this.numCollisions = 0;
  this.numJoints = 0;
  this.numContacts = 0;
  this.numNonContact = 0;
  this.numNeedsHandling = 0;
  this.numImminent = 0;
  this.minDistance = Infinity;
  this.estTime = Infinity;
  this.detectedTime = Infinity;
};

/** Collects the collision statistics about the given set of collisions.
First calls {@link CollisionStats.clear} to start from zero.
@param collisions the set of collisions to examine
*/
update(collisions: Collision[]): void {
  const infinity = Infinity;
  this.clear();
  this.numCollisions = collisions.length;
  collisions.forEach(c => {
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
      const dist = c.getDistance();
      if (!isFinite(dist)) {
        throw 'distance is NaN '+c;
      }
      if (dist < this.minDistance) {
        this.minDistance = dist;
      }
      // if _any_ estimated time is NaN, then we don't know estimated time.
      if (!isNaN(this.estTime)) {
        const t = c.getEstimatedTime();
        if (isNaN(t)) {
          this.estTime = NaN;
        } else if (t < this.estTime) {
            this.estTime = t;
        }
      }
    }
  });
  if (this.estTime == infinity) {
    this.estTime = NaN;
  }
  if (this.detectedTime == infinity) {
    this.detectedTime = NaN;
  }
};

} // end CollisionStats class

Util.defineGlobal('lab$model$CollisionStats', CollisionStats);
