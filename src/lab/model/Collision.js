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

goog.provide('myphysicslab.lab.model.Collision');

goog.scope(function() {

/** Represents a collision or contact between objects.
See {@link myphysicslab.lab.model.CollisionSim}
and {@link myphysicslab.lab.model.CollisionAdvance}.

@interface
*/
myphysicslab.lab.model.Collision = function() {};

var Collision = myphysicslab.lab.model.Collision;

/** Returns true if this represents a bilateral constraint which can both push and
pull; for example a {@link myphysicslab.lab.engine2D.Joint} between two objects.
@return {boolean} true if this is a bilateral constraint
*/
Collision.prototype.bilateral;

/** Whether close enough to the point when this Collision can be handled.
The `allowTiny` parameter exists because of cases where a
small distance collision cannot be backed-up in time to get near to the preferred
target 'half gap' distance.
@param {boolean} allowTiny  regard as 'close enough' Collisions that have smaller
    distance than distance accuracy would normally allow
@return {boolean} true if close enough to the point when this Collision can be handled.
*/
Collision.prototype.closeEnough;

/** Returns true if this is a stable contact: the objects are touching but
not colliding.
@return {boolean} true if this is a stable contact
*/
Collision.prototype.contact;

/** Returns the simulation time when the Collision was detected.
@return {number} the simulation time when the Collision was detected
*/
Collision.prototype.getDetectedTime;

/** Returns the distance between the objects. Negative distance means
the objects are interpenetrating.
@return {number} the distance between the objects
*/
Collision.prototype.getDistance;

/** Returns the estimated time when this Collision should be handled by firing an
impulse.
@return {number} the estimated time when this Collision should be handled or `NaN` if
unknown.
*/
Collision.prototype.getEstimatedTime;

/** Returns size of impulse that was applied to this Collision.
@return {number} size of impulse that was applied to this Collision, or NaN if no
impulse applied.
*/
Collision.prototype.getImpulse;

/** Returns the relative normal velocity between the two collision points.
Negative velocity means the objects are colliding, positive means they are separating.
@return {number} relative normal velocity between the two collision points,
    negative means colliding
*/
Collision.prototype.getVelocity;

/** Returns true if this represents an illegal state, typically because objects are
interpenetrating.
@return {boolean} true if this represents an illegal state
*/
Collision.prototype.illegalState;

/** Returns true if this represents a collision state, generally when two objects are
interpenetrating. The collision search mechanism implemented by
{@link myphysicslab.lab.model.AdvanceStrategy#advance} operates to set the simulation at a time
very close to but just before any Collision is happening, see {@link #getEstimatedTime}.
@return {boolean} `true` if this represents a collision state
*/
Collision.prototype.isColliding;

/** Whether the distance is small enough that the objects are touching each other
so that impulses can be transmitted.
@return {boolean} whether the objects are touching each other
*/
Collision.prototype.isTouching;

/** Returns true if this Collision needs to be resolved, such as by applying an impulse
to reverse the velocities of the objects. This remains `true` even after backing up in
time.
@return {boolean} true if this Collision needs to be resolved
*/
Collision.prototype.needsHandling;

/** Mark this Collision as one that *needs handling* because it is has caused the
collision engine to backup in time in order to resolve this Collision. This is useful
because after backing up in time, a Collision may no longer report itself as
{@link #isColliding}.
@param {boolean} needsHandling true if this Collision needs to be resolved
*/
Collision.prototype.setNeedsHandling;

/** Updates the information in this Collision to reflect current position and velocity
of bodies.  This is used after *backing up in time* to the moment before the collision.
@param {number} time  the current simulation time
*/
Collision.prototype.updateCollision;

}); // goog.scope
