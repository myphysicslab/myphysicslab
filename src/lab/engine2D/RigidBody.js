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

goog.provide('myphysicslab.lab.engine2D.RigidBody');

goog.require('myphysicslab.lab.engine2D.Edge');
goog.require('myphysicslab.lab.engine2D.EdgeSet');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.engine2D.Vertex');
goog.require('myphysicslab.lab.model.MassObject');
goog.require('myphysicslab.lab.util.AffineTransform');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericVector');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var AffineTransform = myphysicslab.lab.util.AffineTransform;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var GenericVector = myphysicslab.lab.util.GenericVector;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** A 2D rigid body with a specified geometry that can experience collisions and contact
forces. A RigidBody handles the geometry calculations for intersections and
collisions, as well as energy and momentum calculations.

### Non-colliding RigidBodys

There are cases where RigidBodys should not collide with each other. For example, when
there is a Joint between two RigidBodys. See {@link #addNonCollide} and
{@link #doesNotCollide}

The Polygon class has a way of specifying a subset of Edges which do not collide with
another Polygon. See {@link myphysicslab.lab.engine2D.Polygon#setNonCollideEdge}.


@todo  how is initialize() method used?  It is not private anymore!!!

@todo  getLocalCenterOfMass() should not exist; only used in DisplayShape.

@todo make sure all these methods and fields are really used and useful.

@todo testCollisionVertex and testContactVertex could perhaps be made private
methods of Polygon; do they need to be methods on RigidBody?

* @interface
* @extends {myphysicslab.lab.model.MassObject}
*/
myphysicslab.lab.engine2D.RigidBody = function() {};

var RigidBody = myphysicslab.lab.engine2D.RigidBody;

/** Adds to set of RigidBodys that do not collide with this body.
No collisions or contacts are generated between this body and the given bodies.
See {@link #doesNotCollide}.
@param {!Array<!myphysicslab.lab.engine2D.RigidBody>} bodies array of RigidBodys that
    should not be collided with
*/
RigidBody.prototype.addNonCollide;

/** Returns true if this body does not collide with the given body. See
{@link #addNonCollide}.
@param {!myphysicslab.lab.engine2D.RigidBody} body the RigidBody of interest
@return {boolean} true if this body does not collide with the given body
*/
RigidBody.prototype.doesNotCollide;

/** Erases any recently saved local coordinate system. See {@link #saveOldCopy},
{@link #getOldCopy}.
* @return {undefined}
*/
RigidBody.prototype.eraseOldCopy;

/** Returns the collision distance accuracy, a fraction between zero and one; when the
collision distance is within `accuracy * targetGap` of the target gap distance, then
the collision is considered close enough to handle (apply an impulse).
@return {number} the collision accuracy, a fraction between 0 (exclusive) and 1
(inclusive)
*/
RigidBody.prototype.getAccuracy;

/** Returns distance tolerance used to determine if this RigidBody is in contact with
another RigidBody.

@return {number} distance tolerance used to determine if this RigidBody is in contact
    with another RigidBody
*/
RigidBody.prototype.getDistanceTol;

/** Returns the elasticity used when calculating collisions; a value of 1.0 means
perfect elasticity where the kinetic energy after collision is the same as before
(extremely bouncy), while a value of 0 means no elasticity (no bounce). A collision
uses the lesser elasticity value of the two bodies involved.
* @return {number} elasticity used when calculating collisions, a number from 0 to 1.
*/
RigidBody.prototype.getElasticity;

/** Returns the recently saved local coordinate system. See {@link #saveOldCopy}.
* @return {?myphysicslab.lab.engine2D.LocalCoords} the recently saved LocalCoords.
*/
RigidBody.prototype.getOldCopy;

/** Returns the index into the {@link myphysicslab.lab.model.VarsList VarsList} for
this RigidBody. The VarsList contains 6 values for each RigidBody,

1. x-position,
2. x-velocity,
3. y-position,
4. y-velocity,
5. angle,
6. angular velocity

@return {number} the index of the x-position in the VarsList for this body;
    or -1 if this body is not in the VarsList.
*/
RigidBody.prototype.getVarsIndex;

/** Returns velocity tolerance used to determine if this RigidBody is in contact with
another RigidBody.

Velocity tolerance is set on each RigidBody, but we expect it to be the same for all
RigidBodys. ImpulseSim 'owns' the velocity tolerance, it is merely passed along to
the RigidBody because it is needed during collision finding and RigidBody has no way
of finding ImpulseSim.

Note however that because Scrim is immutable, it always returns zero for velocity
tolerance. In this case, use the velocity tolerance of the other non-Scrim RigidBody
involved in the collision.

@return {number} velocity tolerance used to determine if this RigidBody is in contact
    with another RigidBody
*/
RigidBody.prototype.getVelocityTol;

/** Removes from set of RigidBodys that do not collide with this body.
@param {!Array<!myphysicslab.lab.engine2D.RigidBody>} bodies array of RigidBodys that
    should be collided with
*/
RigidBody.prototype.removeNonCollide;

/** Makes an internal copy of the geometry of this RigidBody, which is used
for future collision checking.  This copy becomes a record of the last location
of this object, so that collision checking can determine how the object moved
over the last time step.  For example, a small object moving at high velocity
can pass through a narrow object in a single time step;  there is then no
interpenetration of the two objects, but if you use the previous position of
the small fast object you can see that it has passed through the narrow object.
See {@link #getOldCopy}, {@link #eraseOldCopy}.
@return {undefined}
*/
RigidBody.prototype.saveOldCopy;

/** Sets the collision distance accuracy, a fraction between zero and one; when the
collision distance is within `accuracy * targetGap` of the target gap distance, then
the collision is considered close enough to handle (apply an impulse).
* @param {number} value how close in distance to be in order to handle a collision
* @throws {Error} if value is out of the range 0 to 1, or is exactly zero
*/
RigidBody.prototype.setAccuracy;

/** Sets distance tolerance to use to determine if this RigidBody is in contact with
another RigidBody.
@param {number} value distance tolerance to use to determine if this RigidBody is in
  contact with another RigidBody
*/
RigidBody.prototype.setDistanceTol;

/** Sets the elasticity used when calculating collisions; a value of 1.0 means perfect
elasticity where the kinetic energy after collision is the same as before (extremely
bouncy), while a value of 0 means no elasticity (no bounce). A collision uses the
lesser elasticity value of the two bodies involved.
* @param {number} value elasticity used when calculating collisions,
*    a number from 0 to 1.
*/
RigidBody.prototype.setElasticity;

/** Sets velocity tolerance to use to determine if this RigidBody is in contact with
another RigidBody
@param {number} value velocity tolerance to use to determine if this RigidBody is in
  contact with another RigidBody
*/
RigidBody.prototype.setVelocityTol;

}); // goog.scope
