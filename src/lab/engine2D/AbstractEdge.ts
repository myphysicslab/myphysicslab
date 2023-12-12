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

import { Collision } from '../model/Collision.js';
import { RigidBody, Edge, Vertex, RigidBodyCollision } from './RigidBody.js';
import { UtilEngine } from './UtilEngine.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/**
Abstract base class for {@link Edge}.

**TO DO**  rename v1, v2 to be vertex1, vertex2

**TO DO**  probably this should be an interface, not an abstract class???

**TO DO**  distanceToLine:  why not take the distance to end point of the edge
        when the point is beyond the edge?

**TO DO**  An Edge doesn't really need to know the RigidBody it is part of.
        There are 3 usages of body:
        1)  for coordinate transformation (bodyToWorld etc.).  This could be provided
            via an interface that defines those methods.
        2)  during construction, to add the Edge and its Vertexes to the Body
        3)  for creating a Collision or Contact.
        Number (1) can be provided via an interface that defines those methods.
        Numbers (2) and (3) could be deferred to / handled by the RigidBody itself.
        So: we could make Edge know far less about RigidBody, which would
        be a good thing in terms of object-oriented design principles.

*/
export abstract class AbstractEdge implements Edge {
  /** the previous vertex, in body coords; matches the next (second) vertex of the
  previous edge
  */
  protected v1_: Vertex;
  /** the next vertex, in body coords */
  protected v2_: Vertex;
  /** the 'center' of this edge, an arbitrary point selected to minimize the centroid
  * radius of this edge
  */
  protected centroid_body_: Vector;
  /** The centroid of this edge in world coords. For performance reasons this is
  * cached. See {@link AbstractEdge.forgetPosition}.
  */
  private centroid_world_: null|Vector = null;
  /** the maximum distance from centroid to any point on this edge */
  protected centroidRadius_: number = NaN;
  /** the RigidBody that this edge is a part of */
  protected body_: RigidBody;
  /** index of this edge in the body's list of edges */
  protected index_: number = -1;

/**
* @param body the RigidBody this Edge belongs to
* @param vertex1 the previous vertex, in body coords;
*    matches the next (second) vertex of the previous edge
* @param vertex2 the next vertex, in body coords
*/
constructor(body: RigidBody, vertex1: Vertex, vertex2: Vertex) {
  this.v1_ = vertex1;
  this.v2_ = vertex2;
  this.centroid_body_ = this.v1_.locBody().add(this.v2_.locBody()).multiply(0.5);
  this.body_ = body;
};

toString() {
  return this.toStringShort().slice(0, -1)
      +', v1_: '+this.v1_.toStringShort()
      +', v2_: '+this.v2_.toStringShort()
      +', centroid_body_: '+this.centroid_body_
      +', centroidRadius_: '+Util.NF5(this.centroidRadius_)
};

toStringShort() {
  return this.getClassName()
      +'{body_.name: "'+this.body_.getName()
      +'", index_: '+this.getIndex()+'}';
};

/** @inheritDoc */
abstract addPath(context: CanvasRenderingContext2D): void;

/** @inheritDoc */
abstract chordError(): number;

/** @inheritDoc */
abstract distanceToEdge(edge: Edge): number;

/** @inheritDoc */
abstract distanceToLine(p_body: Vector): number;

/** @inheritDoc */
abstract distanceToPoint(p_body: Vector): number;

/** @inheritDoc */
abstract findVertexContact(v: Vertex, p_body: Vector, distTol: number): null|RigidBodyCollision;

/** @inheritDoc */
forgetPosition(): void {
  this.centroid_world_ = null;
};

/** @inheritDoc */
getBody(): RigidBody {
  return this.body_;
};

/** @inheritDoc */
abstract getBottomBody(): number;

/** @inheritDoc */
getCentroidBody(): Vector {
  return this.centroid_body_;
};

/** @inheritDoc */
getCentroidRadius(): number {
  if (isNaN(this.centroidRadius_)) {
    // increase the max distance to account for the following problem:
    // Suppose two blocks, each same sized squares collide straight on;
    // The max radius of an edge is a circle about center of that edge;
    // but the other block will penetrate and both Vertexes will be just
    // outside of that edge's max radius circle.
    this.centroidRadius_ = 1.25 * this.maxDistanceTo(this.centroid_body_);
  }
  return this.centroidRadius_;
};

/** @inheritDoc */
getCentroidWorld(): Vector {
  if (this.centroid_world_ == null) {
    this.centroid_world_ = this.body_.bodyToWorld(this.centroid_body_);
  }
  return this.centroid_world_;
};

/** Returns name of class of this object.
* @return name of class of this object.
*/
abstract getClassName(): string;

/** @inheritDoc */
abstract getCurvature(p_body: Vector): number;

/** @inheritDoc */
getDecoratedVertexes(): Vertex[] {
  return [];
};

/** @inheritDoc */
getIndex(): number {
  if (this.index_ == -1) {
    this.index_ = this.body_.getEdges().indexOf(this);
    if (this.index_ == -1) {
      throw '';
    }
  }
  return this.index_;
};

/** @inheritDoc */
abstract getLeftBody(): number;

/** @inheritDoc */
abstract getNormalBody(p_body: Vector): Vector;

/** @inheritDoc */
abstract getPointOnEdge(p_body: Vector): Vector[];

/** @inheritDoc */
abstract getRightBody(): number;

/** @inheritDoc */
abstract getTopBody(): number;

/** @inheritDoc */
getVertex1(): Vertex {
  return this.v1_;
};

/** @inheritDoc */
getVertex2(): Vertex {
  return this.v2_;
};

/** @inheritDoc */
abstract highlight(): void;

/** @inheritDoc */
abstract improveAccuracyEdge(rbc: RigidBodyCollision, edge: Edge): void;

/** @inheritDoc */
abstract intersection(p1_body: Vector, p2_body: Vector): Vector[]|null;

/** @inheritDoc */
intersectionPossible(edge: Edge, swellage: number): boolean {
  const c1 = this.getCentroidWorld();
  const c2 = edge.getCentroidWorld();
  const dist = c1.subtract(c2).lengthSquared();
  const dist2 = UtilEngine.square(edge.getCentroidRadius() + this.getCentroidRadius() + swellage);
  return dist < dist2;
};

/** @inheritDoc */
abstract isStraight(): boolean;

/** @inheritDoc */
abstract maxDistanceTo(p_body: Vector): number;

/** @inheritDoc */
pointOffset(p_body: Vector, length: number): Vector {
  const n = this.getNormalBody(p_body);
  return p_body.add(n.multiply(length));
};

/** @inheritDoc */
setCentroidRadius(value: number): void {
  this.centroidRadius_ = value;
};

/** @inheritDoc */
setVertex2(vertex: Vertex): void {
  this.v2_ = vertex;
};

/** @inheritDoc */
abstract testCollisionEdge(collisions: RigidBodyCollision[], edge: Edge, time: number): void;

static TINY_POSITIVE = 1E-10;

} // end AbstractEdge class

Util.defineGlobal('lab$engine2D$AbstractEdge', AbstractEdge);
