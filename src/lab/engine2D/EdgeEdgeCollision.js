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

goog.module('myphysicslab.lab.engine2D.EdgeEdgeCollision');

const asserts = goog.require('goog.asserts');

const CircularEdge = goog.forwardDeclare('myphysicslab.lab.engine2D.CircularEdge');
const Edge = goog.require('myphysicslab.lab.engine2D.Edge');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const UtilEngine = goog.require('myphysicslab.lab.engine2D.UtilEngine');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** A RigidBodyCollision between two Edges.
*/
class EdgeEdgeCollision extends RigidBodyCollision {
/**
* @param {!Edge} primaryEdge the first Edge of the collision
* @param {!Edge} normalEdge the second Edge of the collision, which determines the
*     normal vector
*/
constructor(primaryEdge, normalEdge) {
  super(primaryEdge.getBody(), normalEdge.getBody(),
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

/** @override */
toString() {
  return Util.ADVANCED ? '' :
      super.toString().slice(0, -1)
      +', primaryEdge: '+ this.primaryEdge.getIndex()
      +', normalEdge: '+ this.normalEdge.getIndex()
      +'}';
};

/** @override */
getClassName() {
  return 'EdgeEdgeCollision';
};

/** @override */
checkConsistent() {
  super.checkConsistent();
  // both primary and normal edge always exist for non-joint
  asserts.assert( this.primaryEdge != null );
  asserts.assert( this.primaryEdge.isStraight == !this.ballObject );
  asserts.assert( this.normalEdge != null );
  asserts.assert( this.normalEdge.isStraight == !this.ballNormal );
};

/** @override */
getU1() {
  if (this.u1_ != null) {
    return this.u1_; // cached value to speed up performance
  }
  if (this.ballObject) {
    const primaryCircle =
        /** @type {!CircularEdge} */(this.primaryEdge);
    asserts.assert(this.primaryBody == primaryCircle.getBody());
    const cw = this.primaryBody.bodyToWorld(primaryCircle.getCenterBody());
    this.u1_ = cw.subtract(this.primaryBody.getPosition());
    return this.u1_; // cached value to speed up performance
  }
  return this.getR1();
};

/** @override */
getU2() {
  if (this.u2_ != null) {
    return this.u2_; // cached value to speed up performance
  }
  if (this.ballNormal) {
    // maybe I should have a CircleCircleCollision and StraightCircleCollision etc.
    // Otherwise I have to do some ugly type casting here
    const normalCircle =
        /** @type {!CircularEdge} */(this.normalEdge);
    asserts.assert(this.normalBody == normalCircle.getBody());
    const cnw = this.normalBody.bodyToWorld(normalCircle.getCenterBody());
    this.u2_ = cnw.subtract(this.normalBody.getPosition());
    return this.u2_; // cached value to speed up performance
  }
  return this.getR2();
};

/** @override */
hasEdge(edge) {
  // if edge is null, then always returns false
  if (edge == null) {
    return false;
  }
  return edge == this.normalEdge || edge == this.primaryEdge;
};

/** @override */
similarTo(c) {
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
  const nearness = UtilEngine.nearness(this.radius1, this.radius2, this.distanceTol_);
  // find distance between the collisions
  // @todo  consider impact2 here???
  const d = this.impact1.subtract(c.impact1);
  const distSqr = d.lengthSquared();
  // if the two collisions are close together in space
  if (distSqr > nearness*nearness) {
    return false;
  }
  // if the normals are similar; look at dot product of normals
  const normality = Math.abs(this.normal.dotProduct(c.normal));
  if (normality < 0.9) {
    return false;
  }
  return true;
};

/** @override */
updateCollision(time) {
  this.u1_ = null; // invalidate cached value
  this.u2_ = null; // invalidate cached value
  this.primaryEdge.improveAccuracyEdge(this, this.normalEdge);
  super.updateCollision(time);
};

} // end class
exports = EdgeEdgeCollision;
