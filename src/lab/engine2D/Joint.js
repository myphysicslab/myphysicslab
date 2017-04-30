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

goog.provide('myphysicslab.lab.engine2D.Joint');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.engine2D.Connector');
goog.require('myphysicslab.lab.engine2D.ConnectorCollision');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.Scrim');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.AbstractSimObject');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var Connector = myphysicslab.lab.engine2D.Connector;
var ConnectorCollision = myphysicslab.lab.engine2D.ConnectorCollision;
var CoordType = myphysicslab.lab.model.CoordType;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var NF = myphysicslab.lab.util.Util.NF;
var NF5 = myphysicslab.lab.util.Util.NF5;
var NF7 = myphysicslab.lab.util.Util.NF7;
var NF9 = myphysicslab.lab.util.Util.NF9;
var NFE = myphysicslab.lab.util.Util.NFE;
var AbstractSimObject = myphysicslab.lab.model.AbstractSimObject;
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var Scrim = myphysicslab.lab.engine2D.Scrim;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
var Util = myphysicslab.lab.util.Util;
var Vector = myphysicslab.lab.util.Vector;

/** A Joint connects two RigidBodys by generating RigidBodyCollisions which are
used to find contact forces or collision impulses so that the attachment points on the
two RigidBodys are kept aligned together.

The {@link #addCollision} method is where the ***collisions are generated***; that
method is called from {@link myphysicslab.lab.engine2D.ContactSim#findCollisions}.
The RigidBodyCollision generated for a Joint functions as both a collision and a
contact.

Joints are ***immutable***: they cannot be changed after they are constructed.

When two RigidBodys are connected by a Joint,
the two bodies are set to ***not collide*** with each other
via {@link RigidBody#addNonCollide}.

The ***order of the bodies*** in the Joint is important because {@link #align} moves
the *second body* to align with first body (unless the second body is immoveable because
it has infinite mass).

The ***normal vector*** provided when making a Joint specifies the direction along which
the Joint operates. ContactSim calculates forces to keep the acceleration in the normal
direction at zero between the two attachment points of the Joint.

A ***single joint*** by itself will give a 'sliding track' type of connection. The
attachment points must have zero distance between them as measured in the direction of
the normal for the Joint, but in the direction perpendicular to the normal the
attachment points are free to move. See CartPendulum2 for an example.

A ***double joint*** consists of two Joints at the same location (same attachment
points) with perpendicular normal directions. A double joint is needed to keep the
attachment points aligned together.

Over time ***slippage*** of a Joint can occur, especially when there is fast rotation of
the bodies. The ***tightness*** of a Joint is measured by how close to zero is the
distance between the two attachment points. See {@link #getNormalDistance}.

To attach to a ***fixed position in space*** use the {@link Scrim} object.
Or attach to an immoveable (infinite mass) Polygon.

The two attachment points can be widely separated in 'single joints',
see CartPendulum2 for an example.

Another name for a joint is a *bilateral contact point* meaning that it can both push
and pull. This is different from ordinary contact points between bodies which can only
push against each other.


### Specifying a Joint's Normal Vector

When specifying a normal, we also specify the {@link CoordType},
which is either world coordinates or body coordinates. There are two cases:

+ `CoordType.WORLD` the normal is in world coordinates and is fixed.

+ `CoordType.BODY` The normal is calculated in the body coordinates of the *second*
RigidBody of the Joint, and rotates along with that body.

(need to convert from Java) ***TO BE DONE*** To make a Joint with a NumericalPath use
  PathJoint. In that case it is the NumericalPath that determines the normal.

### Aligning Joints

The {@link #align} method aligns the RigidBodys connected by this Joint. Moves the
second body to align with the first body (unless the second body has infinite mass, in
which case the first body is aligned to the second). The second body is moved so that
its attach point is at same position as the first body's attach point. The angle of the
second body is not changed.

NOTE: `align()` only changes the position of the RigidBody, you may need to call
{@link myphysicslab.lab.engine2D.RigidBodySim#initializeFromBody} after this to update the
simulation variables. The method
{@link myphysicslab.lab.engine2D.ContactSim#alignConnectors} does the `initializeFromBody` step
automatically.


### Implementation Note: Separate Impact Points

Each side of the Joint has its own impact point and `R` vector; these are `impact,
impact2, R` and `R2`. We figure the impact point on each body according to where the
attachment point is on that body, by doing a `bodyToWorld` translation to find the
current location.

Previously we calculated the impact point only for `body1` of the joint and
then used that world location to calculate the `R2` for the normal body. It seems
that gives worse results, as shown by the 'two-connected-blocks' test where two blocks
are connected rigidly by 2 double joints. When the two-connected-blocks is spun quickly,
the joints slip significantly if we use the impact point of `body1` to define
where the joint is on `body2`.

@todo should there be an option to have the normal attached to body1 instead of
body2? It is confusing now because the 'body coords normal' is attached to body2 if it
exists, otherwise it is attached to body1. This probably is because of how
RigidBodyCollision follows this policy.

@param {!RigidBody} rigidBody1 the first body of the Joint
@param {!Vector} attach1_body the attachment point on the first
    body in body coordinates
@param {!RigidBody} rigidBody2 the second body of the Joint
@param {!Vector} attach2_body the attachment point on the second
    body
@param {!CoordType} normalType  whether the normal is in body
    (for `rigidBody2`) or world coordinates,
    from {@link CoordType}
@param {!Vector} normal this Joint's normal vector in body
    (for `rigidBody2`) or world coordinates
* @constructor
* @final
* @struct
* @extends {AbstractSimObject}
* @implements {Connector}
*/
myphysicslab.lab.engine2D.Joint = function(rigidBody1, attach1_body,
      rigidBody2, attach2_body, normalType, normal) {
  AbstractSimObject.call(this, 'JOINT'+(Joint.nextJointNum++));
  /** first body of the joint
  * @type {!RigidBody}
  * @private
  */
  this.body1_ = rigidBody1;
  /** second body of the joint
  * @type {!RigidBody}
  * @private
  */
  this.body2_ = rigidBody2;
  /** attachment point in body coords for body1
  * @type {!Vector}
  * @private
  */
  this.attach1_body_ = attach1_body;
  /** attachment point in body coords for body2
  * @type {!Vector}
  * @private
  */
  this.attach2_body_ = attach2_body;
  rigidBody1.addNonCollide([rigidBody2]);
  rigidBody2.addNonCollide([rigidBody1]);
  /**  the normal direction.
  * @type {!Vector}
  * @private
  */
  this.normal_ = normal;
  /** whether the normal is in body coords and moves with the body,
  * or is in fixed world coords
  * @type {!CoordType}
  * @private
  */
  this.normalType_ = normalType;
};
var Joint = myphysicslab.lab.engine2D.Joint;
goog.inherits(Joint, AbstractSimObject);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  Joint.prototype.toString = function() {
    return Joint.superClass_.toString.call(this).slice(0, -1)
        +', body1_: '+this.body1_.toStringShort()
        +', attach1_body_: '+this.attach1_body_
        +', body2_: '+this.body2_.toStringShort()
        +', attach2_body_: '+this.attach2_body_
        +', normalType_: '+this.normalType_
        +', normal_: '+this.normal_
        +', normalDistance: '+NF7(this.getNormalDistance())
        +'}';
  };
}

/** @inheritDoc */
Joint.prototype.getClassName = function() {
  return 'Joint';
};

/**
* @type {number}
*/
Joint.nextJointNum = 0;

/** @inheritDoc */
Joint.prototype.addCollision = function(collisions, time, accuracy) {
  var c = new ConnectorCollision(this.body1_, this.body2_, this, /*joint=*/true);
  this.updateCollision(c);
  c.setDetectedTime(time);
  if (0 == 1 && goog.DEBUG && UtilEngine.debugEngine2D != null) {
    UtilEngine.debugEngine2D.myPrint('joint collision '+c);
    // show the normal vector at the joint
    UtilEngine.debugEngine2D.debugLine('normal', c.impact1, c.impact1.add(c.normal));
    UtilEngine.debugEngine2D.myPrint('joint dist='+NFE(c.distance)
      +' normalVelocity='+NFE(c.getNormalVelocity())+' '+c);
    if (Math.abs(c.distance) > 1E-12)
      UtilEngine.debugEngine2D.myPrint('joint '+this.getName()
        +' is loose dist='+NFE(c.distance)+' '+c);
  }
  goog.array.insertAt(collisions, c, 0);
};

/** @inheritDoc */
Joint.prototype.align = function() {
  if (isFinite(this.body2_.getMass())) {
    this.body2_.alignTo(/*p_body=*/this.attach2_body_,
        /*p_world=*/this.body1_.bodyToWorld(this.attach1_body_));
  } else if (isFinite(this.body1_.getMass())) {
    this.body1_.alignTo(/*p_body=*/this.attach1_body_,
        /*p_world=*/this.body2_.bodyToWorld(this.attach2_body_));
  }
};

/** Returns the attachment point on the first body in body coordinates.
@return {!Vector} the attachment point on the first body in body
    coordinates
*/
Joint.prototype.getAttach1 = function() {
  return this.attach1_body_;
};

/** Returns the attachment point on the second body in body coordinates.
@return {!Vector} the attachment point on the second body in body
    coordinates
*/
Joint.prototype.getAttach2 = function() {
  return this.attach2_body_;
};

/** @inheritDoc */
Joint.prototype.getBody1 = function() {
  return this.body1_;
};

/** @inheritDoc */
Joint.prototype.getBody2 = function() {
  return this.body2_;
};

/** @inheritDoc */
Joint.prototype.getBoundsWorld = function() {
  return DoubleRect.make(this.getPosition1(), this.getPosition2());
};

/** Returns this Joint's unit normal vector, in body or world coordinates according
to `getNormalType`.  If in body coordinates it is relative to body2.
@return {!Vector} this Joint's normal vector, in body or world
    coordinates
*/
Joint.prototype.getNormal = function() {
  return this.normal_;
};

/** @inheritDoc */
Joint.prototype.getNormalDistance = function() {
  var collisions = /** @type {!Array<!RigidBodyCollision>} */([]);
  this.addCollision(collisions, /*time=*/NaN, /*accuracy=*/NaN);
  return collisions[0].getDistance();
};

/** Whether the normal vector is in body or world coordinates.
* @return {!CoordType} whether the normal returned by `getNormal`
    is in body or world coordinates.
*/
Joint.prototype.getNormalType = function() {
  return this.normalType_;
};

/** Returns this Joint's unit normal vector in world coordinates.
@return {!Vector} this Joint's normal vector, in world coordinates
*/
Joint.prototype.getNormalWorld = function() {
  if (this.normalType_==CoordType.WORLD) {
    return this.normal_;
  } else {
    return this.body2_.rotateBodyToWorld(this.normal_);
  }
};

/** @inheritDoc */
Joint.prototype.getPosition1 = function() {
  return this.body1_.bodyToWorld(this.attach1_body_);
};

/** @inheritDoc */
Joint.prototype.getPosition2 = function() {
  return this.body2_.bodyToWorld(this.attach2_body_);
};

/** @inheritDoc */
Joint.prototype.updateCollision = function(c) {
  if (c.primaryBody != this.body1_ || c.normalBody != this.body2_)
    throw new Error();
  if (c.getConnector() != this)
    throw new Error();
  var impact_world = this.body1_.bodyToWorld(this.attach1_body_);
  c.impact1 = impact_world;
  c.normalFixed = this.normalType_ == CoordType.WORLD;
  var normal_world = this.getNormalWorld();
  goog.asserts.assert( Math.abs(normal_world.lengthSquared() - 1.0) < 1E-10 );
  c.impact2 = this.body2_.bodyToWorld(this.attach2_body_);
  c.normal = normal_world;
  // offset = how far apart the joint is, ideally zero
  goog.asserts.assert(c.impact2 != null );
  var offset = c.impact1.subtract(c.impact2);
  c.distance = normal_world.dotProduct(offset);
  c.creator = 'Joint';
};

}); // goog.scope
