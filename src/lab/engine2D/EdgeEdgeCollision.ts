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

/** A RigidBodyCollision between two Edges.
*/
export class EdgeEdgeCollision extends RigidBodyCollision {
  /** edge of primary object */
  private primaryEdge: Edge;
  /** edge of normal body */
  private normalEdge: Edge;
  /** vector from primary body CM to primary edge's circle center, in world coords.
  * Cached value to speed up performance.
  */
  private u1_: null|Vector = null;
  /** vector from normal body CM to normal edge's circle center, in world coords.
  * Cached value to speed up performance.
  */
  private u2_: null|Vector = null;

/**
* @param primaryEdge the first Edge of the collision
* @param normalEdge the second Edge of the collision, which determines the
*     normal vector
*/
constructor(primaryEdge: Edge, normalEdge: Edge) {
  super(primaryEdge.getBody(), normalEdge.getBody(), /*joint=*/false);
  this.primaryEdge = primaryEdge;
  this.normalEdge = normalEdge;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', primaryEdge: '+ this.primaryEdge.getIndex()
      +', normalEdge: '+ this.normalEdge.getIndex()
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'EdgeEdgeCollision';
};

/** @inheritDoc */
override checkConsistent(): void {
  super.checkConsistent();
  // both primary and normal edge always exist for non-joint
  Util.assert( this.primaryEdge != null );
  Util.assert( this.primaryEdge.isStraight() == !this.ballObject );
  Util.assert( this.normalEdge != null );
  Util.assert( this.normalEdge.isStraight() == !this.ballNormal );
};

/** @inheritDoc */
override getU1(): Vector {
  if (this.u1_ != null) {
    return this.u1_; // cached value to speed up performance
  }
  if (this.ballObject) {
    const primaryCircle = this.primaryEdge as CurvedEdge;
    Util.assert(this.primaryBody == primaryCircle.getBody());
    const cw = this.primaryBody.bodyToWorld(primaryCircle.getCenterBody());
    this.u1_ = cw.subtract(this.primaryBody.getPosition());
    return this.u1_; // cached value to speed up performance
  }
  return this.getR1();
};

/** @inheritDoc */
override getU2(): Vector {
  if (this.u2_ != null) {
    return this.u2_; // cached value to speed up performance
  }
  if (this.ballNormal) {
    // maybe I should have a CircleCircleCollision and StraightCircleCollision etc.
    // Otherwise I have to do some ugly type casting here
    const normalCircle = this.normalEdge as CurvedEdge;
    Util.assert(this.normalBody == normalCircle.getBody());
    const cnw = this.normalBody.bodyToWorld(normalCircle.getCenterBody());
    this.u2_ = cnw.subtract(this.normalBody.getPosition());
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
  return edge == this.normalEdge || edge == this.primaryEdge;
};

/** @inheritDoc */
hasVertex(_v: Vertex): boolean {
  return false; // collision is between two edges, no Vertex involved
};

/** @inheritDoc */
similarTo(c: RigidBodyCollision): boolean {
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
  this.u1_ = null; // invalidate cached value
  this.u2_ = null; // invalidate cached value
  this.primaryEdge.improveAccuracyEdge(this, this.normalEdge);
  super.updateCollision(time);
};

} // end EdgeEdgeCollision class
Util.defineGlobal('lab$engine2D$EdgeEdgeCollision', EdgeEdgeCollision);
