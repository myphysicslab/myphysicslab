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

goog.provide('myphysicslab.lab.engine2D.PathJoint');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.engine2D.Connector');
goog.require('myphysicslab.lab.engine2D.ConnectorCollision');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.Scrim');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.model.AbstractSimObject');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.NumericalPath');
goog.require('myphysicslab.lab.model.PathPoint');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

const AbstractSimObject = goog.module.get('myphysicslab.lab.model.AbstractSimObject');
var Connector = myphysicslab.lab.engine2D.Connector;
var ConnectorCollision = myphysicslab.lab.engine2D.ConnectorCollision;
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const NumericalPath = goog.module.get('myphysicslab.lab.model.NumericalPath');
const PathPoint = goog.module.get('myphysicslab.lab.model.PathPoint');
const RigidBody = goog.module.get('myphysicslab.lab.engine2D.RigidBody');
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var Scrim = myphysicslab.lab.engine2D.Scrim;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Represents a bilateral contact point between a {@link RigidBody} and a
{@link NumericalPath}.
Bilateral means that force can be applied to push or pull in the
direction of the normal for the contact (in contrast to a contact force which can only
push and never pull). The normal vector is determined by the NumericalPath. The normal
vector specifies the direction along which the PathJoint operates: forces are calculated
(by the engine2D physics engine) to keep the distance in the normal direction at zero
between the two attachment points of the PathJoint.

A PathJoint is immutable: it cannot be changed after it is constructed.

A single PathJoint by itself will give a 'sliding track' type of connection. The
attachment points must have zero distance between them as measured in the direction of
the normal for the PathJoint, but in the direction *orthogonal to the normal* the
attachment points are free to move.

Note that some slippage of a PathJoint can occur over time, especially
when there is very fast rotation.

@param {!NumericalPath} path the path to connect
@param {!RigidBody} body the RigidBody to connect
@param {!Vector} attach_body the attachment point on the
    RigidBody in body coordinates
* @constructor
* @final
* @struct
* @extends {AbstractSimObject}
* @implements {Connector}
*/
myphysicslab.lab.engine2D.PathJoint = function(path, body, attach_body) {
  AbstractSimObject.call(this, 'PathJoint'+(PathJoint.nextJointNum++));
  /**
  * @type {!RigidBody}
  * @private
  */
  this.body_ = body;
  /** path that joint is attached to
  * @type {!NumericalPath}
  * @private
  */
  this.path_ = path;
  /** attachment point in body coords of this.body_
  * @type {!Vector}
  * @private
  */
  this.attach_body_ = attach_body;
  /** last position along the path
  * @type {!PathPoint}
  * @private
  */
  this.ppt_ = new PathPoint();
};
var PathJoint = myphysicslab.lab.engine2D.PathJoint;
goog.inherits(PathJoint, AbstractSimObject);

/** @override */
PathJoint.prototype.toString = function() {
  return Util.ADVANCED ? '' :
      PathJoint.superClass_.toString.call(this).slice(0, -1)
      +', body_:='+this.body_.toStringShort()
      +', path_: '+this.path_.toStringShort()
      +', attach_body_: '+this.attach_body_
      +', ppt_: '+this.ppt_
      +'}';
};

/** @override */
PathJoint.prototype.getClassName = function() {
  return 'PathJoint';
};

/**
* @type {number}
*/
PathJoint.nextJointNum = 0;

/** @override */
PathJoint.prototype.addCollision = function(collisions, time, accuracy) {
  var c = new ConnectorCollision(this.body_, Scrim.getScrim(), this, /*joint=*/true);
  this.updateCollision(c);
  c.setDetectedTime(time);
  if (0 == 1 && Util.DEBUG && UtilEngine.debugEngine2D != null) {
    UtilEngine.debugEngine2D.myPrint('joint collision '+c);
    // show the normal vector at the joint
    UtilEngine.debugEngine2D.debugLine('normal', c.impact1, c.impact1.add(c.normal));
    UtilEngine.debugEngine2D.myPrint('joint dist='+Util.NFE(c.distance)
      +' normalVelocity='+Util.NFE(c.getNormalVelocity())+' '+c);
    if (Math.abs(c.distance) > 1E-12)
      UtilEngine.debugEngine2D.myPrint('joint '+this.getName()
        +' is loose dist='+Util.NFE(c.distance)+' '+c);
  }
  goog.array.insertAt(collisions, c, 0);
};

/** @override */
PathJoint.prototype.align = function() {
  // Move the body so the attach point is on the path.
  // Find current world position of attachment point.
  var attach_world = this.body_.bodyToWorld(this.attach_body_);
  // find nearest point on path to current position of attachment point
  this.ppt_ = this.path_.findNearestGlobal(attach_world);
  this.path_.map_p_to_slope(this.ppt_);
  // move body to align over that point
  this.body_.alignTo(/*p_body=*/this.attach_body_, /*p_world=*/this.ppt_);
};

/** Returns the attachment point on the RigidBody in body coordinates.
@return {!Vector} the attachment point on the RigidBody in body coordinates
*/
PathJoint.prototype.getAttach1 = function() {
  return this.attach_body_;
};

/** @override */
PathJoint.prototype.getBody1 = function() {
  return this.body_;
};

/** @override */
PathJoint.prototype.getBody2 = function() {
  return Scrim.getScrim();
};

/** @override */
PathJoint.prototype.getBoundsWorld = function() {
  return DoubleRect.make(this.getPosition1(), this.getPosition2());
};

/** @override */
PathJoint.prototype.getNormalDistance = function() {
  var collisions = /** @type {!Array<!RigidBodyCollision>} */([]);
  this.addCollision(collisions, /*time=*/NaN, /*accuracy=*/NaN);
  return collisions[0].getDistance();
};

/** Returns the NumericalPath to which this PathJoint attaches the RigidBody.
@return {!NumericalPath} the NumericalPath to which this PathJoint attaches the
    RigidBody.
*/
PathJoint.prototype.getPath = function() {
  return this.path_;
};

/** Returns the PathPoint corresponding to the most recent position of this PathJoint's
attachment point on the NumericalPath.
@return {!PathPoint} the PathPoint corresponding to the most recent position of
    this PathJoint's attachment point on the NumericalPath.
*/
PathJoint.prototype.getPathPoint = function() {
  return this.ppt_;
};

/** @override */
PathJoint.prototype.getPosition1 = function() {
  return this.body_.bodyToWorld(this.attach_body_);
};

/** @override */
PathJoint.prototype.getPosition2 = function() {
  return this.getPosition1();
};

/** @override */
PathJoint.prototype.updateCollision = function(c) {
  if (c.primaryBody != this.body_ || c.normalBody != Scrim.getScrim()) {
    throw new Error();
  }
  if (c.getConnector() != this) {
    throw new Error();
  }
  var impact_world = this.body_.bodyToWorld(this.attach_body_);
  c.impact1 = impact_world;
  // find slope at nearest point on path to current position of attachment point
  this.path_.findNearestLocal(impact_world, this.ppt_);
  this.path_.map_p_to_slope(this.ppt_);
  goog.asserts.assert(!isNaN(this.ppt_.slope));
  // Detect if the joint has moved past the end of the path.
  if (!this.path_.isClosedLoop()) {
    // If on the path, then the normal at the point on curve should intersect
    // the impact point, and so the distance to the normal line should be zero.
    var d = this.ppt_.distanceToNormalLine(impact_world);
    if (d > 1E-4) {
      // Probably off end of path, so set normal derivative to zero.
      // This makes it so that the path effectively extends in a straight
      // line past the ends.
      this.ppt_.normalXdp = 0;
      this.ppt_.normalYdp = 0;
    }
  }
  var normal_world = this.ppt_.getNormal();
  // Find the current velocity in direction of the slope
  var attachVelocity = this.body_.getVelocity(this.attach_body_);
  // slope vector is a unit vector tangent at point, in direction of increasing p
  var slopeVector = new Vector(this.ppt_.slopeX, this.ppt_.slopeY);
  goog.asserts.assert( Math.abs(slopeVector.lengthSquared() - 1.0) < 1E-10);
  var pathVelocity = attachVelocity.dotProduct(slopeVector);
  if (0 == 1 && Util.DEBUG && UtilEngine.debugEngine2D != null) {
    // show visually the velocity vector of the attachment point
    var pv = slopeVector.multiply(pathVelocity);
    UtilEngine.debugEngine2D.debugLine(this.getName(), c.impact1, c.impact1.add(pv));
  }
  c.normal_dt = new Vector(this.ppt_.normalXdp * pathVelocity,
       this.ppt_.normalYdp * pathVelocity);
  c.normalFixed = false;
  // Radius of curvature is expensive to calculate and not needed here
  // because we already know the derivative of the normal, which is what
  // the radius is used for.
  c.radius2 = Util.NaN;
  c.ballNormal = true;
  c.impact2 = this.ppt_.getPosition();
  c.normal = normal_world;
  // offset = how far apart the joint is, ideally zero
  var offset = c.impact1.subtract(c.impact2);
  c.distance = normal_world.dotProduct(offset);
  c.creator = 'PathJoint';
};

}); // goog.scope
