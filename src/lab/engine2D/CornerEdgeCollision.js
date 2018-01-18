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

goog.provide('myphysicslab.lab.engine2D.CornerEdgeCollision');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.engine2D.Edge');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.engine2D.Vertex');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var Edge = myphysicslab.lab.engine2D.Edge;
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var Vertex = myphysicslab.lab.engine2D.Vertex;

/** A RigidBodyCollision between a corner Vertex and an Edge.

* @param {!Vertex} vertex the Vertex on the primary body
* @param {!Edge} normalEdge the Edge on the normal body, which defines the normal vector for the collision.
* @constructor
* @final
* @struct
* @extends {RigidBodyCollision}
*/
myphysicslab.lab.engine2D.CornerEdgeCollision = function(vertex, normalEdge) {
  var v_edge = vertex.getEdge1();
  if (v_edge == null) {
    throw new Error('CornerEdgeCollision: null edge; vertex='+vertex);
  }
  RigidBodyCollision.call(this, v_edge.getBody(), normalEdge.getBody(),
      /*joint=*/false);
  /** vertex of primary body, between primaryEdge and primaryEdge2
  * @type {!Vertex}
  * @private
  */
  this.vertex = vertex;
  /** edge of normal body
  * @type {!Edge}
  * @private
  */
  this.normalEdge = normalEdge;
  /** edge next to vertex
  * @type {!Edge}
  * @private
  */
  this.primaryEdge = v_edge;
  /** vector from normal body CM to normal edge's circle center, in world coords.
  * Cached value to speed up performance.
  * @type {?Vector}
  * @private
  */
  this.u2_ = null;
  /** other edge next to vertex; null for decorated vertex
  * @type {?Edge}
  * @private
  */
  this.primaryEdge2 = vertex.isEndPoint() ? vertex.getEdge2() : null;
  // we use radius1 only for the `UtilEngine.nearness()` calculation
  this.radius1 = vertex.getCurvature();
  // We still regard primary object as a non-Ball for purposes of contact force,
  // even when radius1 is finite.
  this.ballObject = false;
};
var CornerEdgeCollision = myphysicslab.lab.engine2D.CornerEdgeCollision;
goog.inherits(CornerEdgeCollision, RigidBodyCollision);

/** @override */
CornerEdgeCollision.prototype.toString = function() {
  return Util.ADVANCED ? '' :
      CornerEdgeCollision.superClass_.toString.call(this).slice(0, -1)
      +', vertex-id: '+ this.vertex.getID()
      +', primaryEdge-idx: '+ this.primaryEdge.getIndex()
      +', primaryEdge2-idx: '+ (this.primaryEdge2 != null ?
          this.primaryEdge2.getIndex() : 'null')
      + ', normalEdge-idx: '+ this.normalEdge.getIndex()
      + '}';
};

/** @override */
CornerEdgeCollision.prototype.getClassName = function() {
  return 'CornerEdgeCollision';
};

/** @override */
CornerEdgeCollision.prototype.checkConsistent = function() {
  CornerEdgeCollision.superClass_.checkConsistent.call(this);
  // both primary and normal edge always exist for non-joint
  goog.asserts.assert( this.primaryEdge != null );
  // vertex/edge collision.
  goog.asserts.assert( this.primaryEdge == this.vertex.getEdge1() );
  if (this.vertex.isEndPoint()) {
    // endpoint vertex, must specify both edges
    goog.asserts.assert( this.primaryEdge2 != null );
    goog.asserts.assert( this.primaryEdge2 == this.vertex.getEdge2() );
  } else {
    // midpoint 'decorated' vertex
    goog.asserts.assert( this.primaryEdge2 == null );
  }
  goog.asserts.assert( this.ballObject == false );
  // normal edge is of two types:  curved or straight
  goog.asserts.assert( this.normalEdge.isStraight() == !this.ballNormal );
};

/** @override */
CornerEdgeCollision.prototype.getU2 = function() {
  if (this.u2_ != null) {
    return this.u2_; // cached value to speed up performance
  }
  if (this.ballNormal) {
    var impact = this.impact2 ? this.impact2 : this.impact1;
    var impact_body = this.normalBody.worldToBody(impact);
    var center2_body = this.normalEdge.getCenterOfCurvature(impact_body);
    if (center2_body != null) {
      // U2 = vector from CM to normal body's circle center (in world coords)
      var center2_world = this.normalBody.bodyToWorld(center2_body);
      this.u2_ = center2_world.subtract(this.normalBody.getPosition());
      return this.u2_; // cached value to speed up performance
    }
  }
  return this.getR2();
};

/** @override */
CornerEdgeCollision.prototype.hasEdge = function(edge) {
  // if edge is null, then always returns false
  if (edge == null) {
    return false;
  }
  return edge == this.normalEdge || edge == this.primaryEdge ||
    this.primaryEdge2 == edge;
};

/** @override */
CornerEdgeCollision.prototype.hasVertex = function(v) {
  return v == this.vertex;
};

/** @override */
CornerEdgeCollision.prototype.similarTo = function(c) {
  if (!c.hasBody(this.primaryBody) || !c.hasBody(this.normalBody)) {
    return false;
  }
  if (c.hasVertex(this.vertex)) {
    // both collisions involve same bodies and same vertex
    return true;
  }
  if (!c.hasEdge(this.normalEdge)) {
    return false;
  }
  var e1 = null;
  if (c.hasEdge(this.primaryEdge)) {
    e1 = this.primaryEdge;
  } else if (c.hasEdge(this.primaryEdge2)) {
    e1 = this.primaryEdge2;
  } else {
    return false;
  }
  // both collisions involve same bodies and same vertex/edge
  // Next see if these collisions are close in distance and have similar normals.
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
CornerEdgeCollision.prototype.updateCollision = function(time) {
  this.u2_ = null; // invalidate cached value
  // vertex/edge collision
  var pbw = this.primaryBody.bodyToWorld(this.vertex.locBody());
  var pnb = this.normalBody.worldToBody(pbw);
  var pn = this.normalEdge.getPointOnEdge(pnb);
  if (pn == null) {
    // objects have moved so that we can't update
    // For example, a vertex moves so it is outside of an oval arc.
    //console.log('null getPointOnEdge '+pnb);
    return;
  }
  this.impact1 = this.normalBody.bodyToWorld(pn[0]);
  this.normal = this.normalBody.rotateBodyToWorld(pn[1]);
  this.distance = this.normalEdge.distanceToLine(pnb);
  CornerEdgeCollision.superClass_.updateCollision.call(this, time);
};

}); // goog.scope
