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

import { Edge, Vertex, CurvedEdge } from './RigidBody.js';
import { RigidBodyCollision } from './RigidBody.js';
import { UtilEngine } from './UtilEngine.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** A {@link RigidBodyCollision} between a corner {@link Vertex}
* and an {@link Edge}.
*/
export class CornerEdgeCollision extends RigidBodyCollision {
  /** vertex of primary body, between primaryEdge and primaryEdge2 */
  private vertex: Vertex;
  /** edge of normal body */
  private normalEdge: Edge;
  /** edge next to vertex */
  private primaryEdge: Edge;
  /** vector from normal body CM to normal edge's circle center, in world coords.
  * Cached value to speed up performance.
  */
  private u2_: null|Vector = null;
  /** other edge next to vertex; null for decorated vertex */
  private primaryEdge2: null|Edge;

/**
* @param vertex the Vertex on the primary body
* @param normalEdge the Edge on the normal body, which defines the normal
*     vector for the collision.
*/
constructor(vertex: Vertex, normalEdge: Edge) {
  const v_edge = vertex.getEdge1();
  if (v_edge == null) {
    throw 'CornerEdgeCollision: null edge; vertex='+vertex;
  }
  super(v_edge.getBody(), normalEdge.getBody(), /*joint=*/false);
  this.vertex = vertex;
  this.normalEdge = normalEdge;
  this.primaryEdge = v_edge;
  this.primaryEdge2 = vertex.isEndPoint() ? vertex.getEdge2() : null;
  // we use radius1 only for the `UtilEngine.nearness()` calculation
  this.radius1 = vertex.getCurvature();
  // We still regard primary object as a non-Ball for purposes of contact force,
  // even when radius1 is finite.
  this.ballObject = false;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', vertex-id: '+ this.vertex.getID()
      +', primaryEdge-idx: '+ this.primaryEdge.getIndex()
      +', primaryEdge2-idx: '+ (this.primaryEdge2 != null ?
          this.primaryEdge2.getIndex() : 'null')
      + ', normalEdge-idx: '+ this.normalEdge.getIndex()
      + '}';
};

/** @inheritDoc */
getClassName(): string {
  return 'CornerEdgeCollision';
};

/** @inheritDoc */
override checkConsistent(): void {
  super.checkConsistent();
  // both primary and normal edge always exist for non-joint
  Util.assert( this.primaryEdge != null );
  // vertex/edge collision.
  Util.assert( this.primaryEdge == this.vertex.getEdge1() );
  if (this.vertex.isEndPoint()) {
    // endpoint vertex, must specify both edges
    Util.assert( this.primaryEdge2 != null );
    Util.assert( this.primaryEdge2 == this.vertex.getEdge2() );
  } else {
    // midpoint 'decorated' vertex
    Util.assert( this.primaryEdge2 == null );
  }
  Util.assert( this.ballObject == false );
  // normal edge is of two types:  curved or straight
  Util.assert( this.normalEdge.isStraight() == !this.ballNormal );
};

/** @inheritDoc */
override getU2(): Vector {
  if (this.u2_ != null) {
    return this.u2_; // cached value to speed up performance
  }
  if (this.ballNormal) {
    const impact = this.impact2 ? this.impact2 : this.impact1;
    const impact_body = this.normalBody.worldToBody(impact);
    const ne = this.normalEdge as CurvedEdge;
    const center2_body = ne.getCenterBody(impact_body);
    // U2 = vector from CM to normal body's circle center (in world coords)
    const center2_world = this.normalBody.bodyToWorld(center2_body);
    this.u2_ = center2_world.subtract(this.normalBody.getPosition());
    return this.u2_; // cached value to speed up performance
  }
  return this.getR2();
};

/** @inheritDoc */
hasEdge(edge: null|Edge): boolean {
  // if edge is null, then always returns false
  if (edge == null) {
    return false;
  }
  return edge == this.normalEdge || edge == this.primaryEdge ||
    this.primaryEdge2 == edge;
};

/** @inheritDoc */
hasVertex(v: Vertex): boolean {
  return v == this.vertex;
};

/** @inheritDoc */
similarTo(c: RigidBodyCollision): boolean {
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
  let e1 = null;
  if (c.hasEdge(this.primaryEdge)) {
    e1 = this.primaryEdge;
  } else if (c.hasEdge(this.primaryEdge2)) {
    e1 = this.primaryEdge2;
  } else {
    return false;
  }
  // both collisions involve same bodies and same vertex/edge
  // Next see if these collisions are close in distance and have similar normals.
  const nearness = UtilEngine.nearness(this.radius1, this.radius2, this.distanceTol_);
  // find distance between the collisions
  // **TO DO**  consider impact2 here???
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

/** @inheritDoc */
override updateCollision(time: number): void {
  this.u2_ = null; // invalidate cached value
  // vertex/edge collision
  const pbw = this.primaryBody.bodyToWorld(this.vertex.locBody());
  const pnb = this.normalBody.worldToBody(pbw);
  const pn = this.normalEdge.getPointOnEdge(pnb);
  if (pn == null) {
    // objects have moved so that we can't update
    // For example, a vertex moves so it is outside of an oval arc.
    //console.log('null getPointOnEdge '+pnb);
    return;
  }
  this.impact1 = this.normalBody.bodyToWorld(pn[0]);
  this.normal = this.normalBody.rotateBodyToWorld(pn[1]);
  this.distance = this.normalEdge.distanceToLine(pnb);
  super.updateCollision(time);
};

} // end CornerEdgeCollision class
Util.defineGlobal('lab$engine2D$CornerEdgeCollision', CornerEdgeCollision);
