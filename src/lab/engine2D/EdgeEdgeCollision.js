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

goog.provide('myphysicslab.lab.engine2D.EdgeEdgeCollision');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.engine2D.Edge');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var Edge = myphysicslab.lab.engine2D.Edge;
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** A RigidBodyCollision between two Edges.

* @param {!Edge} primaryEdge the first Edge of the collision
* @param {!Edge} normalEdge the second Edge of the collision, which determines the
*     normal vector
* @constructor
* @final
* @struct
* @extends {RigidBodyCollision}
*/
myphysicslab.lab.engine2D.EdgeEdgeCollision = function(primaryEdge, normalEdge) {
  RigidBodyCollision.call(this, primaryEdge.getBody(), normalEdge.getBody(),
      /*joint=*/false);
  /** edge of primary object
  * @type {!Edge}
  * @private
  */
  this.primaryEdge = primaryEdge;
  /** edge of normal body
  * @type {!Edge}
  * @private
  */
  this.normalEdge = normalEdge;
  /** vector from primary body CM to primary edge's circle center, in world coords.
  * Cached value to speed up performance.
  * @type {?Vector}
  * @private
  */
  this.u1_ = null;
  /** vector from normal body CM to normal edge's circle center, in world coords.
  * Cached value to speed up performance.
  * @type {?Vector}
  * @private
  */
  this.u2_ = null;
};
var EdgeEdgeCollision = myphysicslab.lab.engine2D.EdgeEdgeCollision;
goog.inherits(EdgeEdgeCollision, RigidBodyCollision);

if (!Util.ADVANCED) {
  /** @override */
  EdgeEdgeCollision.prototype.toString = function() {
    return EdgeEdgeCollision.superClass_.toString.call(this).slice(0, -1)
        +', primaryEdge: '+ this.primaryEdge.getIndex()
        +', normalEdge: '+ this.normalEdge.getIndex()
        +'}';
  };
};

/** @override */
EdgeEdgeCollision.prototype.getClassName = function() {
  return 'EdgeEdgeCollision';
};

/** @override */
EdgeEdgeCollision.prototype.checkConsistent = function() {
  EdgeEdgeCollision.superClass_.checkConsistent.call(this);
  // both primary and normal edge always exist for non-joint
  goog.asserts.assert( this.primaryEdge != null );
  goog.asserts.assert( this.primaryEdge.isStraight() == !this.ballObject );
  goog.asserts.assert( this.normalEdge != null );
  goog.asserts.assert( this.normalEdge.isStraight() == !this.ballNormal );
};

/** @override */
EdgeEdgeCollision.prototype.getU1 = function() {
  if (this.u1_ != null) {
    return this.u1_; // cached value to speed up performance
  }
  if (this.ballObject) {
    var primaryCircle =
        /** @type {!myphysicslab.lab.engine2D.CircularEdge} */(this.primaryEdge);
    goog.asserts.assert(this.primaryBody == primaryCircle.getBody());
    var cw = this.primaryBody.bodyToWorld(primaryCircle.getCenterBody());
    this.u1_ = cw.subtract(this.primaryBody.getPosition());
    return this.u1_; // cached value to speed up performance
  }
  return this.getR1();
};

/** @override */
EdgeEdgeCollision.prototype.getU2 = function() {
  if (this.u2_ != null) {
    return this.u2_; // cached value to speed up performance
  }
  if (this.ballNormal) {
    // maybe I should have a CircleCircleCollision and StraightCircleCollision etc.
    // Otherwise I have to do some ugly type casting here
    var normalCircle =
        /** @type {!myphysicslab.lab.engine2D.CircularEdge} */(this.normalEdge);
    goog.asserts.assert(this.normalBody == normalCircle.getBody());
    var cnw = this.normalBody.bodyToWorld(normalCircle.getCenterBody());
    this.u2_ = cnw.subtract(this.normalBody.getPosition());
    return this.u2_; // cached value to speed up performance
  }
  return this.getR2();
};

/** @override */
EdgeEdgeCollision.prototype.hasEdge = function(edge) {
  // if edge is null, then always returns false
  if (edge == null) {
    return false;
  }
  return edge == this.normalEdge || edge == this.primaryEdge;
};

/** @override */
EdgeEdgeCollision.prototype.similarTo = function(c) {
  if (!c.hasBody(this.primaryBody) || !c.hasBody(this.normalBody)) {
    return false;
  }
  if (!c.hasEdge(this.normalEdge)) {
    return false;
  }
  if (!c.hasEdge(this.primaryEdge)) {
    return false;
  }
  // both collisions involve same bodies and same edges
  // Next see if these collisions (which are between the same edges)
  // are close in distance and have similar normals.
  var nearness = UtilEngine.nearness(this.radius1, this.radius2, this.distanceTol_);
  // find distance between the collisions
  // @todo  consider impact2 here???
  var d = this.impact1.subtract(c.impact1);
  var distSqr = d.lengthSquared();
  // if the two collisions are close together in space
  if (distSqr > nearness*nearness) {
    return false;
  }
  // if the normals are similar; look at dot product of normals
  var normality = Math.abs(this.normal.dotProduct(c.normal));
  if (normality < 0.9) {
    return false;
  }
  return true;
};

/** @override */
EdgeEdgeCollision.prototype.updateCollision = function(time) {
  this.u1_ = null; // invalidate cached value
  this.u2_ = null; // invalidate cached value
  this.primaryEdge.improveAccuracyEdge(this, this.normalEdge);
  EdgeEdgeCollision.superClass_.updateCollision.call(this, time);
};

}); // goog.scope
