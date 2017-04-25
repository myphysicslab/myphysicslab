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

goog.provide('myphysicslab.lab.engine2D.RigidBodyCollision');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.model.Collision');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;

var nf5 = UtilityCore.nf5;
var NF5 = UtilityCore.NF5;
var NF5E = UtilityCore.NF5E;
var NF7 = UtilityCore.NF7;
var NFE = UtilityCore.NFE;
var NFSCI = UtilityCore.NFSCI;
var Vector = myphysicslab.lab.util.Vector;
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
var Collision = myphysicslab.lab.model.Collision;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;

/** RigidBodyCollision holds data related to a collision or resting contact between two
RigidBodys.  The data includes:

+ which RigidBodys are involved,
+ where the collision or contact point is,
+ what is the distance between the RigidBodys (negative means penetration),
+ what is the relative velocity at the collision point,
+ what is the normal vector at the collision point
+ when the collision was detected
+ the estimated time that the collision occurred
+ the force or impulse that is applied

Other data concerns the geometry of the bodies in relation to the collision point –
things like the curvature of the an edge, or distance from center of mass to the
collision point. Some data exists only for certain sub-classes of RigidBodyCollision.

Most of the data in RigidBodyCollision is filled in after it is created, but some data
is updated as the collision handling process proceeds. Many of the fields (properties)
of RigidBodyCollision are 'package private' meaning that any code in the
`myphysicslab.lab.engine2D` package can modify the field directly. This avoids having to
make dozens of getter/setter methods for those fields.

See explanations at [2D Physics Engine Overview](Engine2D.html).


## Terminology

<img src="RigidBodyCollision.svg">

The two RigidBodys involved in the collision are referred to as follows:

+ the ***primary body***, has either a Vertex or Edge involved in the collision. For a
Connector like Joint there is a connection point somewhere on the body instead of at a
Vertex or Edge.

+ the ***normal body***, has an Edge which defines the normal vector. For a Connector
like Joint, the normal is defined by the Connector not by an Edge.

The ***normal vector*** is used to find the distance and velocity of the collision. The
distance between the bodies is measured in the direction of the normal vector.

The ***normal relative velocity*** is the velocity between the bodies at the point of
collision, but only in the direction of the normal vector.

The ***R vector*** goes from the center of mass to the ***impact point***, on the
primary body. Similarly, the ***R2 vector*** is on the normal body from its center of
mass to the impact point.


## Distance of Collision

The point of collision, or 'impact point', is where the two bodies are touching or
penetrating. This 'point' is actually two different points, one on the primary body and
one on the normal body. Ideally at the moment of collision these are at the same point
in space, but in practice they are always somewhat apart.

The distance between the two bodies is the distance between the two impact points in the
direction of the normal vector.  Mathematically we can define the distance as follows:

    p_a = point of impact on primary body
    p_b = point of impact on normal body
    n = vector normal to edge at impact point
    distance = n . (p_a - p_b)

If distance is positive there is a gap between the objects. If distance is negative,
then the objects are interpenetrating.


## Target Gap

When bodies are interpenetrating, the physics engine gets 'stuck'. To prevent this, we
aim to back up in time to a moment just before the collision when the objects are
separated by a small distance called the *target gap*. See
[Seek to Half-Gap Distance](Engine2D.html#seektohalf-gapdistance) for the full
explanation.

The `Collision.closeEnough` method returns true when the collision distance is close to
the target gap distance, within the tolerance given by {@link #getAccuracy}.

## Collision Handling Notes TO BE EDITTED

The following is actually super useful for reading the collision handling code

A colliding contact that might be handled comes in several flavors.
Any contact exists in one of these zones, depending on its distance

<pre>
0. out of range.
   distanceTol
1. not yet in target accuracy zone.
   targetGap+accuracy
2. in target accuracy zone
   targetGap-accuracy
3. past target accuracy zone but not penetrating
   zero distance
4. penetrating (illegal)

> contact: 1, 2, 3;  small velocity
> isTouching(): 1, 2, 3;  any velocity
>closeEnough(false): 2;  any velocity
> closeEnough(true): 2 or 3;  any velocity
> isColliding() 3 or 4 for large negative velocity;  4 for large positive velocity
> illegalState(): 4  any velocity
</pre>

I also have some diagrams from around May 16, 2016 that makes the above very clear.


## Update State After Backing Up In Time

The collision handling scheme used by {@link myphysicslab.lab.model.CollisionAdvance}
results in backing up in time from the post-collision state to the pre-collision state.
This is done to avoid having RigidBodys being in an ambiguous illegal interpenetrating
state.

A consequence of this is that the RigidBodyCollision we are handling will have its data
from the near-future post-collision state. The method {@link #updateCollision} updates
the RigidBodyCollision to reflect the current pre-collision state after backing up in
time.

The `mustHandle` flag remembers those RigidBodyCollisions that were penetrating in the
post-collision state, before the backup in time occurred. This is needed because those
RigidBodyCollisions might otherwise indicate that they do not need to be handled: they
have negative distance (penetrating) in the post-collision state, but positive distance
(non-penetrating) in the pre-collision state.


## The U Vector

When a RigidBody has a curved edge involved in the collision, the `U` vector is vector
from body's center of mass to center of the circular edge. For the primary body this is
called the `U` vector, for the normal body it is called the `U2` vector.

For curved edges we use the `U` and `U2` vectors instead of the `R` and `R2` vectors.

The `U` and `U2` vectors are used in finding the contact force needed because a smooth
curved edge works differently than a sharp pointed corner. The normal distance (and
therefore normal velocity) between a straight edge and a circle is related to the
movement of the circle's center – rotation of the circle about the center is irrelevant.
This is different to a sharp corner where the movement of the point of the corner is
what is important.

This is relevant for finding contact forces which are applied over time. For an
instantaneous collision impulse this is not important because the bodies immediately
move apart.

See the paper [Curved Edge Physics paper](CEP_Curved_Edge_Physics.pdf) by Erik Neumann
for modifications to contact forces when curved edges are involved.


## Equivalence of Using R or U Vector For Normal Velocity
<a name="equivalenceofusingroruvector"></a>

Here we show that you get the same result whether using the R or U vector in
{@link #getNormalVelocity}.

Suppose you have a circular body striking a horizontal infinite mass floor; let the
circle have an offset center of mass, so that U and R are different.

<img src="CEP_Equiv_U_R_Vectors.svg">

    vab = relative velocity of contact points (vpa, vpb) on bodies
    vab = (vpa - vpb)
    vpa = va + wa x ra = velocity of contact point
    vab = va + wa x ra - vb - wb x rb
    // vab.n = (va + wa x ra - vb - wb x rb) . n
    // cross product: w x r = (0,0,w) x (rx, ry, 0) = (-w*ry, w*rx, 0)
    dx = vax + wa*(-ray) - vbx - wb*(-rby);
    dy = vay + wa*(rax) - vby - wb*(rbx);
    nv = nx*dx + ny*dy;
    but with n = (0, 1) we have
    nv = 0*dx + 1*dy = dy
    and because body b is infinite mass, we have vbx = vby = wb = 0, so
    dy = vay + wa*(rax)
    dy = vay + wa*(uax)   // when using U instead of R

In the picture, you can see that `rax = uax`, because the normal at the impact
point goes thru the center of the circle, and so both U and R have the same `x`
component. The situation would be the same when the normal is not `(0, 1)`. In the
general case, you are finding the length of R (or U) that is orthogonal to the normal,
and again these are the same for U and R because the normal at the impact point goes
right thru the center of the circle.

@todo guess: the only things really needed are normal and impact point (plus of course
the two bodies). Wait, also things like ballObject, ballNormal.

@todo guess: some things like `r1, r2, u1, u2, radius1, radius2` can all be calculated;
they are only stored in the RBC for convenience to avoid re-calculating. (would it be
better to do that calculating in one place?)

* @param {!myphysicslab.lab.engine2D.RigidBody} body the 'primary' body which typically
    has a Vertex or Edge involved in the collision
* @param {!myphysicslab.lab.engine2D.RigidBody} normalBody the 'normal' body which
    typically has an Edge involved in the collision that defines the normal vector
    for the collision
* @param {boolean} joint whether this is a bilateral constraint which can both
    push and pull.
* @constructor
* @abstract
* @struct
* @implements {myphysicslab.lab.model.Collision}
*/
myphysicslab.lab.engine2D.RigidBodyCollision = function(body, normalBody, joint) {
  /** 'primary' object whose corner or edge is colliding
  * @type {!myphysicslab.lab.engine2D.RigidBody}
  * @package
  */
  this.primaryBody = body;
  /**  object corresponding to the normal (its edge defines the normal vector)
  * @type {!myphysicslab.lab.engine2D.RigidBody}
  * @package
  */
  this.normalBody = normalBody;
  /** whether this is a bilateral constraint which can both push and pull
  * @type {boolean}
  * @package
  */
  this.joint = joint;
  // One of the bodies can be a Scrim which has zero distance tolerance, so find the
  // max distance and velocity tolerance of the bodies.
  /** distance tolerance is used to decide when bodies are touching.
  * @type {number}
  * @protected
  */
  this.distanceTol_ = Math.max(body.getDistanceTol(), normalBody.getDistanceTol());
  /** desired target gap where collision is handled (we try to back up to time when
  * collision distance is this amount). Can be zero for joints.
  * @type {number}
  * @private
  */
  this.targetGap_ = joint ? 0 : this.distanceTol_/2;
  var acc = Math.max(body.getAccuracy(), normalBody.getAccuracy());
  if (acc <= 0 || acc > 1) {
    throw new Error('accuracy must be between 0 and 1, is '+acc);
  }
  /** Collision distance accuracy: when the collision distance is within
  * accuracy of the target gap distance, then the collision is close enough to be
  * able to handle it (apply an impulse).
  * @type {number}
  * @private
  */
  this.accuracy_ = acc * this.distanceTol_/2;
  /** velocity tolerance used to determine if an object is in contact with another
  * object. See {@link myphysicslab.lab.engine2D.ImpulseSim#getVelocityTol}.
  * @type {number}
  * @protected
  */
  this.velocityTol_ = Math.max(body.getVelocityTol(), normalBody.getVelocityTol());
  /** elasticity of this collision, from 0 to 1.
  * @type {number}
  * @private
  */
  this.elasticity_ = Math.min(body.getElasticity(), normalBody.getElasticity());
  /** true = normal is constant
  * @type {boolean}
  * @package
  */
  this.normalFixed = false;
  /** Indicates this is a collision that needs to be handled
  * @type {boolean}
  * @private
  */
  this.mustHandle_ = false;
  /** true if the 'primary' object's edge is curved
  * @type {boolean}
  * @package
  */
  this.ballObject = false;
  /** true if the normal object's edge is curved
  * @type {boolean}
  * @package
  */
  this.ballNormal = false;
  /** point of impact, in global coords
  * @type {!myphysicslab.lab.util.Vector}
  * @package
  */
  this.impact1 = Vector.ORIGIN;
  /** second impact point needed for Rope because the impact points are far apart.
  * OPTIONAL point of impact on normalBody, in global coords
  * @type {?myphysicslab.lab.util.Vector}
  * @package
  */
  this.impact2 = null;
  /** distance between objects;  negative = penetration
  * @type {number}
  * @package
  */
  this.distance = UtilityCore.NaN;
  /** distance between objects when first detected, pre-backup
  * @type {number}
  * @private
  */
  this.detectedDistance_ = UtilityCore.NaN;
  /** normal pointing outward from normalObj, in world coords
  * @type {!myphysicslab.lab.util.Vector}
  * @package
  */
  this.normal = Vector.NORTH;
  /** derivative of normal vector with respect to time
  * @type {?myphysicslab.lab.util.Vector}
  * @package
  */
  this.normal_dt = null;
  /** vector from body CM to edge's circle center, in world coords
  * U, U2 are not used for collisions, only for contact force
  * @type {?myphysicslab.lab.util.Vector}
  * @package
  */
  this.u1 = null;
  /** vector from normal body CM to normal edge's circle center, in world coords
  * @type {?myphysicslab.lab.util.Vector}
  * @package
  */
  this.u2 = null;
  /** radius of curvature at impact1, for primary body; negative means concave
  * @type {number}
  * @package
  */
  this.radius1 = UtilityCore.NaN;
  /** radius of curvature at impact1, for normal body; negative means concave
  * @type {number}
  * @package
  */
  this.radius2 = UtilityCore.NaN;
  /** relative normal velocity at impact point; negative=colliding,
  * positive = separating. Cached value: it is invalid when NaN.
  * @type {number}
  * @private
  */
  this.normalVelocity_ = UtilityCore.NaN;
  /** normal velocity when collision was detected, pre-backup.
  * @type {number}
  * @private
  */
  this.detectedVelocity_ = UtilityCore.NaN;
  /** for debugging, unique code tells where this was generated
  * @type {string}
  * @package
  */
  this.creator = '';
  /** simulation time that collision was detected
  * @type {number}
  * @private
  */
  this.detectedTime_ = UtilityCore.NaN;
  /** estimate of time when half-gap distance happens
  * @type {number}
  * @private
  */
  this.estimate_ = UtilityCore.NaN;
  /** time corresponding to last update
  * @type {number}
  * @private
  */
  this.updateTime_ = UtilityCore.NaN;
  /** amount of impulse applied during collision
  * @type {number}
  * @package
  */
  this.impulse = UtilityCore.NaN;
  /** amount of force applied at a contact point
  * @type {number}
  * @package
  */
  this.force = UtilityCore.NaN;
};
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  RigidBodyCollision.prototype.toString = function() {
    return this.getClassName() + '{distance: '+NF5E(this.distance)
        +', normalVelocity_: '+NF5E(this.normalVelocity_)
        +', body: "'+this.primaryBody.getName()+'"'
        +', normalBody: "'+this.normalBody.getName()+'"'
        +', impact1: '+this.impact1
        +', contact: '+this.contact()
        +', joint: '+this.joint
        +', elasticity_: ' +nf5(this.elasticity_)
        +', targetGap_: '+NF5E(this.targetGap_)
        +', accuracy_: '+NF7(this.accuracy_)
        +', mustHandle_: '+this.mustHandle_
        +', impact2: '+(this.impact2 != null ? this.impact2 : 'null')
        +', normal: '+this.normal
        +', ballObject: '+this.ballObject
        +', ballNormal: '+this.ballNormal
        +', estimate_: '+NF7(this.estimate_)
        +', detectedTime_: '+NF7(this.detectedTime_)
        +', detectedDistance_: '+NF5E(this.detectedDistance_)
        +', detectedVelocity_: '+NF5E(this.detectedVelocity_)
        +', impulse: '+NF5E(this.impulse)
        +', force: '+NF5E(this.force)
        +', updateTime_: '+NF7(this.updateTime_)
        +', creator: '+this.creator
        +'}';
  };
};

/** @inheritDoc */
RigidBodyCollision.prototype.bilateral = function() {
  return this.joint;
};

/** Checks that the fields of this collision are consistent
and obey policy.
* @return {undefined}
* @package
*/
RigidBodyCollision.prototype.checkConsistent = function() {
  goog.asserts.assert(isFinite(this.accuracy_));
  goog.asserts.assert(isFinite(this.detectedTime_));
  goog.asserts.assert(isFinite(this.detectedDistance_));
  goog.asserts.assert(isFinite(this.detectedVelocity_));
  goog.asserts.assert(isFinite(this.distance));
  goog.asserts.assert(isFinite(this.getNormalVelocity()));
  goog.asserts.assert(this.primaryBody != null);
  goog.asserts.assert(this.normalBody != null);
  goog.asserts.assert(isFinite(this.normal.getX()));
  goog.asserts.assert(isFinite(this.normal.getY()));
  goog.asserts.assert(isFinite(this.impact1.getX()));
  goog.asserts.assert(isFinite(this.impact1.getY()));
  goog.asserts.assert(Math.abs(this.normal.length() - 1) < 1e-12);
  if (this.ballNormal) {
    // for curved normal, need either radius of curvature or time deriv of normal
    goog.asserts.assert(!isNaN(this.radius2) || (this.normal_dt != null));
  }
  // April 16 2014:  this is wrong... we can have a fixed normal on a non-infinite mass
  // body.
  //if (this.normalFixed) {
  //  goog.asserts.assert(this.theConnector != null
  //      || !isFinite(this.normalBody.getMass()));
  //}
};

/** @inheritDoc */
RigidBodyCollision.prototype.closeEnough = function(allowTiny) {
  if (this.contact())
    return true;
  if (allowTiny) {
    // 'allowTiny' handles cases where a collision has very small distance, but we
    // cannot backup to a time when distance was near targetGap.
    // This occurs in StraightStraightTest.fast_close_setup().
    if (goog.DEBUG && this.distance > 0
        && this.distance < this.targetGap_ - this.accuracy_) {
      console.log('%cTINY DISTANCE%c '+this, 'background:#f9c', 'color:black',
        'background:#fc6', 'color:black');
    }
    return this.distance > 0
        && this.distance < this.targetGap_ + this.accuracy_;
  } else {
    return this.distance > this.targetGap_ - this.accuracy_
        && this.distance < this.targetGap_ + this.accuracy_;
  }
};

/** @inheritDoc */
RigidBodyCollision.prototype.contact = function() {
  return this.joint || Math.abs(this.getNormalVelocity()) < this.velocityTol_ &&
    this.distance > 0 && this.distance < this.distanceTol_;
};

/** Returns distance to the target 'half gap' distance. We aim to handle a collision
when the distance is 'half gap', which is when this returns zero.
@return {number} distance to the target 'half gap' distance.
*/
RigidBodyCollision.prototype.distanceToHalfGap = function() {
  return this.distance - this.targetGap_;
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
* @abstract
*/
RigidBodyCollision.prototype.getClassName = function() {};

/** Returns the Connector that generated this collision, or null if this collision
* was not generated by a Connector.
* @return {?myphysicslab.lab.engine2D.Connector} the Connector that generated this
*     collision, or null
* @package
*/
RigidBodyCollision.prototype.getConnector = function() {
  return null;
};

/** @inheritDoc */
RigidBodyCollision.prototype.getDetectedTime = function() {
  return this.detectedTime_;
};

/** @inheritDoc */
RigidBodyCollision.prototype.getDistance = function() {
  return this.distance;
};

/** Returns the elasticity used when calculating collisions; a value of 1.0 means
perfect elasticity where the kinetic energy after collision is the same as before
(extremely bouncy), while a value of 0 means no elasticity (no bounce). A collision
uses the lesser elasticity value of the two bodies involved.
* @return {number} elasticity used when calculating collisions, a number from 0 to 1.
*/
RigidBodyCollision.prototype.getElasticity = function() {
  return this.elasticity_;
};

/** @inheritDoc */
RigidBodyCollision.prototype.getEstimatedTime = function() {
  return this.estimate_;
};

/** Returns point of impact on the primary body, in global coords.
* @return {!myphysicslab.lab.util.Vector} point of impact on the primary body,
*     in global coords
* @package
*/
RigidBodyCollision.prototype.getImpact1 = function() {
  return this.impact1;
};

/** Returns point of impact on normal body, in global coords. For example, this is
needed for Rope because the impact points are far apart. Often null when only
{@link #getImpact1} is needed.
* @return {?myphysicslab.lab.util.Vector} point of impact on normal body, in global
*     coords, or null
* @package
*/
RigidBodyCollision.prototype.getImpact2 = function() {
  return this.impact2;
};

/** @inheritDoc */
RigidBodyCollision.prototype.getImpulse = function() {
  return this.impulse;
};

/** The lateral velocity (sideways to normal) between the two bodies at the point of
* contact.
* @return {number} the lateral velocity (sideways to normal) between the two bodies
*    at the point of contact.
* @package
*/
RigidBodyCollision.prototype.getLateralVelocity = function() {
  // the perpendicular vector to normal is:  (-normal.getY(), normal.getX())
  // or (normal.getY(), -normal.getX())
  var perp = new Vector(-this.normal.getY(), this.normal.getX());
  return perp.dotProduct(this.getRelativeVelocity());
};

/** Returns the normal body involved in the collision, which defines the normal vector.
* The classic situation is that a vertex on the primary body is colliding into an edge
* on the normal body, but there are many variations on this.
* @return {!myphysicslab.lab.engine2D.RigidBody} the normal body involved in the
*     collision
* @package
*/
RigidBodyCollision.prototype.getNormalBody = function() {
  return this.normalBody;
};

/** Returns the relative normal velocity based on current velocity of the
bodies. Negative velocity means the objects moving towards each other,
positive velocity means they are moving apart.

* @return {number} relative normal velocity between the two bodies
*    at the point of contact.
*/
RigidBodyCollision.prototype.getNormalVelocity = function() {
  if (isNaN(this.normalVelocity_)) {
    this.normalVelocity_ = this.normal.dotProduct(this.getRelativeVelocity());
    goog.asserts.assert(!isNaN(this.normalVelocity_));
  }
  return this.normalVelocity_;
};

/** Returns vector from center of mass of primary body to point of impact,
* in world coords
* @return {!Vector} vector from center of mass of primary body to point of impact,
* in world coords
*/
RigidBodyCollision.prototype.getR1 = function() {
  return this.impact1.subtract(this.primaryBody.getPosition());
};

/** Returns vector from center of mass of normal body to point of impact,
* in world coords.  Uses the second impact point if appropriate.
* @return {!Vector} vector from center of mass of normal body to point of impact,
* in world coords
*/
RigidBodyCollision.prototype.getR2 = function() {
  var impact = this.impact2 ? this.impact2 : this.impact1;
  return impact.subtract(this.normalBody.getPosition());
};

/** Returns the primary body involved in the collision. The primary body does not
* define the normal.  The classic situation is that a vertex on the primary body is
* colliding into an edge on the normal body, but there are many variations on this.
* @return {!myphysicslab.lab.engine2D.RigidBody} the primary body involved in the
*     collision
* @package
*/
RigidBodyCollision.prototype.getPrimaryBody = function() {
  return this.primaryBody;
};

/** Returns the difference in velocity of the two impact points of the collision
based on current velocity of the bodies.

    let V = velocity of center of mass (CM);
    let R = distance vector CM to contact point
    let w = angular velocity
    w x R = (0, 0, w) x (Rx, Ry, 0) = (-w Ry, w Rx, 0)
    velocity of corner = V + w x R = (Vx - w Ry, Vy + w Rx, 0)
    relative velocity = Vab = Va + wa x Ra - Vb - wb x Rb

For curved edge we use the `U` vector (from center of mass to edge's circle center)
instead of `R` vector (from center of mass to point of impact). Because what matters is
not the motion of the individual point but instead the entire curved edge. Consider that
for a ball with center of mass at center of the circle, rotation doesn't change the
distance at all.

* @return {!myphysicslab.lab.util.Vector} the velocity vector of this collision
* @package
*/
RigidBodyCollision.prototype.getRelativeVelocity = function() {
  var vax = 0;
  var vay = 0;
  var vbx = 0;
  var vby = 0;
  if (isFinite(this.primaryBody.getMass())) {
    var r1 = this.getU1();
    var rax = r1.getX();
    var ray = r1.getY();
    goog.asserts.assert(isFinite(rax) && isFinite(ray), 'not a number: rax, ray');
    var va = this.primaryBody.getVelocity();
    var wa = this.primaryBody.getAngularVelocity();
    vax = va.getX() - wa*ray;
    vay = va.getY() + wa*rax;
  }
  if (isFinite(this.normalBody.getMass())) {
    var r2 = this.getU2();
    var rbx = r2.getX();
    var rby = r2.getY();
    goog.asserts.assert(isFinite(rbx) && isFinite(rby), 'not a number: rbx, rby');
    var vb = this.normalBody.getVelocity();
    var wb = this.normalBody.getAngularVelocity();
    vbx = vb.getX() - wb*rby;
    vby = vb.getY() + wb*rbx;
  }
  return new Vector(vax - vbx, vay - vby);
};

/** Returns vector from center of mass of primary body to either point of impact
* or to center of circular edge in world coords.
* @return {!Vector} vector from center of mass of primary body to either point
* of impact or to center of circular edge in world coords
*/
RigidBodyCollision.prototype.getU1 = function() {
  if (this.ballObject) {
    if (!this.u1) {
      throw new Error();
    }
    return this.u1;
  } else {
    goog.asserts.assert(this.u1 == null);
    return this.getR1();
  }
};

/** Returns vector from center of mass of normal body to either point of impact
* or to center of circular edge in world coords. Uses the second impact point if
* appropriate.
* @return {!Vector} vector from center of mass of normal body to either point
* of impact or to center of circular edge, in world coords
*/
RigidBodyCollision.prototype.getU2 = function() {
  if (this.ballNormal) {
    if (!this.u2) {
      throw new Error();
    }
    return this.u2;
  } else {
    goog.asserts.assert(this.u2 == null);
    return this.getR2();
  }
};

/** @inheritDoc */
RigidBodyCollision.prototype.getVelocity = function() {
  return this.getNormalVelocity();
};

/** Whether this collision involves the given RigidBody
* @param {!myphysicslab.lab.engine2D.RigidBody} body the RigidBody of interest
* @return {boolean} whether collision involves the given RigidBody
* @package
*/
RigidBodyCollision.prototype.hasBody = function(body) {
  return this.primaryBody == body || this.normalBody == body;
};

/**  Whether this collision involves the given edge.
* If given edge is null, then always returns false.
* @param {?myphysicslab.lab.engine2D.Edge} edge the Edge of interest
* @return {boolean} whether collision involves the given Edge
* @package
*/
RigidBodyCollision.prototype.hasEdge = function(edge) {
  return false;
};

/** Whether this collision involves the given vertex
* @param {!myphysicslab.lab.engine2D.Vertex} v the Vertex of interest
* @return {boolean} whether collision involves the given Vertex
* @package
*/
RigidBodyCollision.prototype.hasVertex = function(v) {
  return false;
};

/** @inheritDoc */
RigidBodyCollision.prototype.illegalState = function() {
  if (this.joint) {
    return false;
  }
  return this.distance < 0;
};

/** @inheritDoc */
RigidBodyCollision.prototype.isColliding = function() {
  if (this.joint) {
    return false; // joints are never colliding
  }
  if (this.distance < 0) {
    return true; // any penetrating contact is colliding
  }
  // fast collision that is smaller than targetGap beyond desired accuracy
  if (this.getNormalVelocity() < -this.velocityTol_
      && this.distance < this.targetGap_ - this.accuracy_) {
    return true;
  }
  return false;
};

/** @inheritDoc */
RigidBodyCollision.prototype.isTouching = function() {
  return this.joint || this.distance < this.distanceTol_;
};

/** @inheritDoc */
RigidBodyCollision.prototype.needsHandling = function() {
  return this.mustHandle_;
};

/** Stores the time when this collision was detected, stores the current distance and
velocity as the detected distance and detected velocity, and estimates when the
collision occurred.
@param {number} time  when this collision is detected
@throws {Error} if the detected time has been previously set
@package
*/
RigidBodyCollision.prototype.setDetectedTime = function(time) {
  if (isFinite(this.detectedTime_)) {
    throw new Error('detectedTime_ already set '+this);
  }
  this.detectedTime_ = time;
  this.detectedDistance_ = this.distance;
  var nv = this.getNormalVelocity();
  this.detectedVelocity_ = nv;
  this.estimate_ = UtilityCore.NaN;
  if (!this.joint) {
    goog.asserts.assert(isFinite(this.distance));
    goog.asserts.assert(isFinite(nv));
    // if the collision velocity is significant (i.e. not a tiny number or positive)
    if (nv < -0.001) {
      this.estimate_ = time + (this.targetGap_ - this.distance) / nv;
    }
    if (0 == 1 && goog.DEBUG)
      console.log(NF5(time)+' setDetectedTime '+this.toString());
  }
};

/** @inheritDoc */
RigidBodyCollision.prototype.setNeedsHandling = function(needsHandling) {
  this.mustHandle_ = needsHandling;
};

/** Returns whether this collision is similar to the given collision.
* @param {!myphysicslab.lab.engine2D.RigidBodyCollision} c the other collision
* @return {boolean} true if the two collisions are similar
* @abstract
*/
RigidBodyCollision.prototype.similarTo = function(c) {};

/** Updates the information in the collision to reflect current position and velocity of
bodies. Changes the impact point to be the nearest point between the bodies (as long as
this point is reasonably close to the original impact point). Then update the normal, R
vectors, etc.

This is used when handling collisions because the collisions are
found post-collision, but are handled pre-collision.  Therefore, we
need to update the information to correspond to the pre-collision
arrangement of the bodies.

Doing this fixes inaccurate collisions;  for example, a ball that
hits a wall at an angle would wrongly acquire spin if the collision
were not updated to the current pre-collision information.

Assumes that the bodies have been updated for their current location,
by for example {@link myphysicslab.lab.engine2D.RigidBodySim#modifyObjects}.

@param {number} time  the current simulation time
@package
*/
RigidBodyCollision.prototype.updateCollision = function(time) {
  if (!isFinite(this.distance))
    throw new Error('distance is NaN '+this);
  this.normalVelocity_ = UtilityCore.NaN; // invalidate cached value
  // experiment: May 11 2015
  // collisions with low velocity and close distance should be marked as a contact.
  // (These are typically first detected as penetrating collisions).
  //if (!this.contact() && this.distance > 0
  //    && this.distance < this.primaryBody.getDistanceTol()
  //    && Math.abs(this.getNormalVelocity()) < this.primaryBody.getVelocityTol()) {
  //  this.isContact = true;
  //console.log('update->contact '+this);
  //}
  this.checkConsistent();
  this.updateTime_ = time;
  // only calculate the estimated collision time when needed (save time)
  if ((this.needsHandling() || !this.contact()) && this.getNormalVelocity() < 0) {
    // always use the fancy combined collision time estimate
    this.updateEstimatedTime(time, true);
  } else {
    this.estimate_ = UtilityCore.NaN;
  }
};

/**  Update the estimated time of collision using both pre-backup and post-backup information and a calculus model of constant acceleration.

    Derivation of the estimate:
    t1 = time after backup
    t2 = time before backup
    time interval of h = t2 - t1
    d1 = distance at t1 = distance
    v1 = velocity at t1 = normalVelocity
    d2 = distance at t2 = detectedDistance_
    v2 = velocity at t2 = detectedVelocity_
    assume constant acceleration of a = (v2 - v1)/h
    In the following, t is 0 at t1.
    velocity v(t) = integral(a dt) = v1 + a t
    distance d(t) = integral(v1 + a t dt) = d1 + v1 t + a t^2/2
    Now, find time corresponding to distance = targetGap
    targetGap = d1 + v1 t + (a/2) t^2
    Quadratic equation in t
    0 = (d1 - targetGap) + v1 t + (a/2) t^2
    t = [-v1 +/- sqrt(v1^2 - 4 (a/2) (d1 - targetGap)) ]/(2 a/2)
    t = [-v1 +/- sqrt(v1^2 - 2 a (d1 - targetGap)) ]/a

* @param {number} time
* @param {boolean} doUpdate
* @private
*/
RigidBodyCollision.prototype.updateEstimatedTime = function(time, doUpdate) {
  var t1 = time;
  var t2 = this.detectedTime_;
  var d1 = this.distance;
  var v1 = this.getNormalVelocity();
  var v2 = this.detectedVelocity_;
  var h = t2 - t1;
  if (h <= 1E-12) {
    if (0 == 1)
      console.log(NF7(time)+' CANNOT UPDATE ESTIMATE '
        +' t1='+NF7(t1)+' t2='+NF7(t2)
        +' '+this.toString());
    return;
  }
  var a = (v2 - v1)/h;
  // if acceleration is too small, then stick with existing estimate
  if (Math.abs(a) < 1E-12) {
    return;
  }
  // e1 and e2 combine both pre and post backup estimates
  // there are 2 estimates because they are solutions of a quadratic equation.
  var det = Math.sqrt(v1*v1 - 2*a*(d1 - this.targetGap_));
  var e1 = t1 + (-v1 + det)/a;
  var e2 = t1 + (-v1 - det)/a;
  if (doUpdate) {
    var didUpdate = false;
    var oldEstimate = this.estimate_;
    // only use one of the estimates if between t1 and t2.  Use earlier of e1, e2.
    if (e1 > t1 && e1 < t2) {
      this.estimate_ = e1;
      didUpdate = true;
    }
    if (e2 > t1 && e2 < t2) {
      // if we already used e1, then only replace with e2 if e2 < e1
      if (!didUpdate || e2 < e1) {
        this.estimate_ = e2;
        didUpdate = true;
      }
    }
    if (0 == 1 && goog.DEBUG) {
      console.log(NF7(time)+' UPDATE ESTIMATE '+didUpdate
      +' old='+NF7(oldEstimate)
      +' targetGap='+NF5E(this.targetGap_)
      +' e1='+NF7(e1)
      +' e2='+NF7(e2)
      +' '+this.toString());
    }
  }
};

}); // goog.scope
