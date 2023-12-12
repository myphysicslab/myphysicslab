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

import { AbstractEdge } from './AbstractEdge.js';
import { Collision } from '../model/Collision.js';
import { CornerCornerCollision } from './CornerCornerCollision.js';
import { CornerEdgeCollision } from './CornerEdgeCollision.js';
import { RigidBody, Edge, Vertex } from './RigidBody.js';
import { RigidBodyCollision } from './RigidBody.js';
import { Util } from '../util/Util.js';
import { UtilEngine } from './UtilEngine.js';
import { Vector } from '../util/Vector.js';

/** A straight Edge belonging to a RigidBody. A StraightEdge is defined by
its two endpoint Vertexes, which are in body coordinates, plus it knows which side of
the Edge is outside of the body.

### distanceToLine() Derivation
```text
Let the Vertexes of this edge be v and v2, with slope k.
The line of the edge is y - vy = k(x - vx).
The line of the normal through p is y - py = (-1/k)(x - px)
Solve these two equations to get the intersection point q.
qx = (-vy + py + px/k + k vx) / (1/k + k)
qy = vy + k (qx - vx)
Return distance between p and q (or minus that distance).
```

### distanceToPoint() Derivation
```text
Let the Vertexes of this edge be v and v2, with slope k.
The line of the edge is y - vy = k(x - vx).
The line of the normal through p is y - py = (-1/k)(x - px)
Solve these two equations to get the intersection point q.
qx = (-vy + py + px/k + k vx) / (1/k + k)
qy = vy + k (qx - vx)
Check if the intersection point q within endpoints of the edge,
return infinity if not.
Return distance between p and q (or minus that distance).
```

### getNormalBody() Derivation
```text
Let k be the slope of the edge.
The normal has slope -1/k = y/x
To be unit normal, we need: x^2 + y^2 =1
Solve for x and y:
x = -k y
(k^2 + 1) y^2 = 1
y = 1/sqrt(1 + k^2)
x = -k/sqrt(1 + k^2)
```

*/
export class StraightEdge extends AbstractEdge implements Edge {
  private outsideIsUp_: boolean;

/**
* @param body the RigidBody this Edge is a part of
* @param vertex1 the previous Vertex, in body coords
* @param vertex2 the next Vertex, in body coords
* @param outsideIsUp `true` means the region above the Edge is outside of the
*  RigidBody (when viewed in body coordinates); for vertical Edge `true` means region
*  right of Edge is outside.
* @throws if `vertex1` is already connected to a 'next' Edge
* @throws if `vertex2` is already connected to a 'previous' Edge
*/
constructor(body: RigidBody, vertex1: Vertex, vertex2: Vertex, outsideIsUp: boolean) {
  super(body, vertex1, vertex2);
  this.outsideIsUp_ = outsideIsUp;
  vertex1.setEdge2(this);
  vertex2.setEdge1(this);
};

override toString() {
  return super.toString()
      +', outsideIsUp_: '+this.outsideIsUp_
      +'}';
};

/** @inheritDoc */
addPath(context: CanvasRenderingContext2D): void {
  context.lineTo(this.v2_.locBodyX(), this.v2_.locBodyY());
};

/**
* @param v the Vertex of interest
* @param p_body the body coordinate position of the Vertex
* @param distTol the distance tolerance
*/
private checkVertexVertex(v: Vertex, p_body: Vector, distTol: number): null|RigidBodyCollision {
  let dist = this.v1_.locBody().distanceTo(p_body);
  // The distance between the vertexes must be large enough to be a valid normal
  // vector. When they are very close together then the normal direction is random.
  // We use 0.6*distTol to avoid making an unwanted collision in DoNothingGrinder;
  // otherwise these contacts are occasionally made and they wind up causing the
  // shuttle to stop suddenly.
  if (dist >= 1E-6 && dist <= 0.6*distTol) {
    return this.makeVertexVertex(this.v1_, v, p_body, dist);
  }
  dist = this.v2_.locBody().distanceTo(p_body);
  if (dist >= 1E-6 && dist <= 0.6*distTol) {
    return this.makeVertexVertex(this.v2_, v, p_body, dist);
  }
  return null;
};

/** @inheritDoc */
chordError(): number {
  return 0;
};

/** @inheritDoc */
distanceToEdge(edge: Edge): number {
  if (edge.isStraight()) {
    // no edge-edge contact between straight edges;
    // these are handled by corner-edge contacts. See Polygon.checkCollision.
    throw '';
  } else {
    return edge.distanceToEdge(this);
  }
};

/** @inheritDoc */
distanceToLine(p_body: Vector): number {
  let r;
  const pbx = p_body.getX();
  const pby = p_body.getY();
  const x1 = this.v1_.locBodyX();
  const x2 = this.v2_.locBodyX();
  const y1 = this.v1_.locBodyY();
  const y2 = this.v2_.locBodyY();
  if (Math.abs(x2 - x1) < AbstractEdge.TINY_POSITIVE) {
    // vertical edge
    r = this.outsideIsUp_ ? pbx - x1 : x1 - pbx;
  } else if (Math.abs(y2 - y1) < AbstractEdge.TINY_POSITIVE) {
    // horizontal edge
    r = this.outsideIsUp_ ? pby - y1 : y1 - pby;
  } else {
    const k = (y2 - y1)/(x2 - x1);  // slope of the edge
    const qx = (-y1 + pby + pbx/k + k*x1) / (1/k + k);
    const qy = y1 + k * (qx - x1);
    const dx = pbx-qx;
    const dy = pby-qy;
    let d = Math.sqrt(dx*dx + dy*dy);
    if (pby < qy) {
      d = -d;
    }
    r = this.outsideIsUp_ ? d : -d;
  }
  if (isNaN(r)) {
    throw Util.DEBUG ? ('distanceToLine NaN '+p_body+' '+this.v1_+' '+this.v2_) : '';
  }
  return r;
};

/** @inheritDoc */
distanceToPoint(p_body: Vector): number {
  const pbx = p_body.getX();
  const pby = p_body.getY();
  const x1 = this.v1_.locBodyX();
  const x2 = this.v2_.locBodyX();
  const y1 = this.v1_.locBodyY();
  const y2 = this.v2_.locBodyY();
  if (Math.abs(x2 - x1) < AbstractEdge.TINY_POSITIVE) {
    // vertical edge
    // if p is beyond endpoints of this edge segment, return infinite distance
    if (y1 > y2 && (pby > y1 || pby < y2)) {
      return Infinity;
    }
    if (y2 > y1 && (pby > y2 || pby < y1)) {
      return Infinity;
    }
    return this.outsideIsUp_ ? pbx - x1 : x1 - pbx;
  } else if (Math.abs(y2 - y1) < AbstractEdge.TINY_POSITIVE) {
    // horizontal edge
    // if p is beyond endpoints of this edge segment, return infinite distance
    if (x1 > x2 && (pbx > x1 || pbx < x2)) {
      return Infinity;
    }
    if (x2 > x1 && (pbx > x2 || pbx < x1)) {
      return Infinity;
    }
    return this.outsideIsUp_ ? pby - y1 : y1 - pby;
  } else {
    // edge is neither horizontal or vertical
    // k = slope of the edge
    const k = (y2 - y1)/(x2 - x1);
    const qx = (-y1 + pby + pbx/k + k*x1) / (1/k + k);
    const qy = y1 + k * (qx - x1);
    if (x1 < x2 && (qx < x1 || qx > x2)) {
      return Infinity;
    }
    if (x2 < x1 && (qx < x2 || qx > x1)) {
      return Infinity;
    }
    const dx = pbx-qx;
    const dy = pby-qy;
    let d = Math.sqrt(dx*dx + dy*dy);
    if (pby < qy) {
      d = -d;
    }
    return this.outsideIsUp_ ? d : -d;
  }
};

/** @inheritDoc */
findVertexContact(v: Vertex, p_body: Vector, distTol: number): null|RigidBodyCollision {
  // p_body = point in body coords
  const pbx = p_body.getX();
  const pby = p_body.getY();
  const x1 = this.v1_.locBodyX();
  const x2 = this.v2_.locBodyX();
  const y1 = this.v1_.locBodyY();
  const y2 = this.v2_.locBodyY();
  if (Math.abs(x2 - x1) < AbstractEdge.TINY_POSITIVE) {  // vertical edge
    const vx = (x1 + x2)/2;  // average in case slightly different
    // is p is beyond endpoints of this edge segment?
    if (y1 > y2 && (pby > y1 || pby < y2)) {
      return this.checkVertexVertex(v, p_body, distTol);
    }
    if (y2 > y1 && (pby > y2 || pby < y1)) {
      return this.checkVertexVertex(v, p_body, distTol);
    }
    const dist = this.outsideIsUp_ ? pbx - vx : vx - pbx;
    if (dist < 0 || dist > distTol) {
      return null;
    }
    const rbc = new CornerEdgeCollision(v, this);
    rbc.distance = dist;
    // rw = near point in world coords
    const rw = this.body_.bodyToWorld(new Vector(vx, pby));
    rbc.impact1 = rw;
    // nw = normal in world coords
    const nw = this.body_.rotateBodyToWorld(new Vector(this.outsideIsUp_ ? 1 : -1, 0));
    rbc.normal = nw;
    rbc.ballNormal = false;
    rbc.radius2 = Infinity;
    rbc.creator = Util.DEBUG ? 'StraightEdge.findVertexContactVert' : '';
    return rbc;
  }
  if (Math.abs(y2 - y1) < AbstractEdge.TINY_POSITIVE) {  // horizontal edge
    const vy = (y1 + y2)/2;  // average in case slightly different
    // is p is beyond endpoints of this edge segment?
    if (x1 > x2 && (pbx > x1 || pbx < x2)) {
      return this.checkVertexVertex(v, p_body, distTol);
    }
    if (x2 > x1 && (pbx > x2 || pbx < x1)) {
      return this.checkVertexVertex(v, p_body, distTol);
    }
    const dist = this.outsideIsUp_ ? pby - vy : vy - pby;
    if (dist < 0 || dist > distTol) {
      return null;
    }
    const rbc = new CornerEdgeCollision(v, this);
    rbc.distance = dist;
    // rw = near point in world coords
    const rw = this.body_.bodyToWorld(new Vector(pbx, vy));
    rbc.impact1 = rw;
    // nw = normal in world coords
    const nw = this.body_.rotateBodyToWorld(new Vector(0, this.outsideIsUp_ ? 1 : -1));
    rbc.normal = nw;
    rbc.ballNormal = false;
    rbc.radius2 = Infinity;
    rbc.creator = Util.DEBUG ? 'StraightEdge.findVertexContactHoriz' : '';
    return rbc;
  }
  const k = (y2 - y1)/(x2 - x1);  // slope of the edge
  // rb = near point in body coords
  const rbx = (-y1 + pby + pbx/k + k*x1) / (1/k + k);
  const rby = y1 + k * (rbx - x1);
  // is rb is beyond endpoints of this edge segment?
  if (x1 < x2 && (rbx < x1 || rbx > x2)) {
    return this.checkVertexVertex(v, p_body, distTol);
  }
  if (x2 < x1 && (rbx < x2 || rbx > x1)) {
    return this.checkVertexVertex(v, p_body, distTol);
  }
  const dx = pbx-rbx;
  const dy = pby-rby;
  let dist = Math.sqrt(dx*dx + dy*dy);
  if (pby < rby) {
    dist = -dist;
  }
  dist = this.outsideIsUp_ ? dist : -dist;
  if (dist < 0 || dist > distTol) {
    return null;
  }
  const rbc = new CornerEdgeCollision(v, this);
  rbc.distance = dist;
  // rw = near point in world coords
  const rw = this.body_.bodyToWorld(new Vector(rbx, rby));
  rbc.impact1 = rw;
  const len = Math.sqrt(1 + k*k);
  // nw = normal in world coords
  let nw = this.body_.rotateBodyToWorld(new Vector(-k/len, 1/len));
  if (!this.outsideIsUp_) {
    nw = nw.multiply(-1);
  }
  rbc.normal = nw;
  rbc.ballNormal = false;
  rbc.radius2 = Infinity;
  rbc.creator = Util.DEBUG ? 'StraightEdge.findVertexContact' : '';
  return rbc;
};

/** @inheritDoc */
getBottomBody(): number {
  const y1 = this.v1_.locBodyY();
  const y2 = this.v2_.locBodyY();
  return y1 < y2 ? y1 : y2;
};

/** @inheritDoc */
getClassName(): string {
  return 'StraightEdge';
};

/** @inheritDoc */
getCurvature(_p_body: Vector): number {
  return Infinity;
};

/** @inheritDoc */
getLeftBody(): number {
  const x1 = this.v1_.locBodyX();
  const x2 = this.v2_.locBodyX();
  return x1 < x2 ? x1 : x2;
};

/** @inheritDoc */
getNormalBody(_p_body: Vector): Vector {
  // (we ignore p_body, because normal is same at any point on a straight line)
  const x1 = this.v1_.locBodyX();
  const x2 = this.v2_.locBodyX();
  const y1 = this.v1_.locBodyY();
  const y2 = this.v2_.locBodyY();
  if (Math.abs(x2 - x1) < AbstractEdge.TINY_POSITIVE) {  // vertical edge
    // for vertical lines, outsideIsUp means normal points right
    return new Vector(this.outsideIsUp_ ? 1 : -1, 0);
  }
  if (Math.abs(y2 - y1) < AbstractEdge.TINY_POSITIVE) { // horizontal edge
    // for horizontal lines, outsideIsUp means normal points up
    return new Vector(0, this.outsideIsUp_ ? 1 : -1);
  }
  const k = (y2 - y1)/(x2 - x1);  // slope of the edge
  const d = Math.sqrt(1 + k*k);
  let nx = -k/d;
  let ny = 1/d;
  if (!this.outsideIsUp_) {
    nx = -nx;
    ny = -ny;
  }
  return new Vector(nx, ny);
};

/** @inheritDoc */
getPointOnEdge(p_body: Vector): Vector[] {
  const p = this.projectionOntoLine(p_body);
  const n = this.getNormalBody(p_body);
  return [p, n];
};

/** @inheritDoc */
getRightBody(): number {
  const x1 = this.v1_.locBodyX();
  const x2 = this.v2_.locBodyX();
  return x1 > x2 ? x1 : x2;
};

/** @inheritDoc */
getTopBody(): number {
  const y1 = this.v1_.locBodyY();
  const y2 = this.v2_.locBodyY();
  return y1 > y2 ? y1 : y2;
};

/** @inheritDoc */
highlight(): void {
  if (UtilEngine.debugEngine2D != null) {
    const p1 = this.body_.bodyToWorld(this.v1_.locBody());
    const p2 = this.body_.bodyToWorld(this.v2_.locBody());
    UtilEngine.debugEngine2D.debugLine('edge', p1, p2);
  }
};

/** @inheritDoc */
improveAccuracyEdge(rbc: RigidBodyCollision, edge: Edge): void {
  if (edge.isStraight()) {
    // no collisions between straight edges;
    /*if (rbc.getNormalBody() == edge.getBody()) {
      StraightStraight.improveAccuracy(rbc, this, edge);
    } else {
      StraightStraight.improveAccuracy(rbc, edge, this);
    }*/
  } else {
    edge.improveAccuracyEdge(rbc, this);
  }
};

/** @inheritDoc */
intersection(p1_body: Vector, p2_body: Vector): Vector[]|null {
  if (p1_body == p2_body) {
    return null;
  }
  const v1 = this.v1_.locBody();
  const v2 = this.v2_.locBody();
  const q = UtilEngine.linesIntersect(v1, v2, p1_body, p2_body);
  return q == null ? null : [q];
};

/** @inheritDoc */
override intersectionPossible(edge: Edge, swellage: number): boolean {
  // Test isStraight property instead of using instanceof because of performance
  // problems when using instanceof with goog.module and Firefox.
  // See https://github.com/google/closure-compiler/issues/2800
  if (edge.isStraight()) {
    // Because straight/straight edges never interact (instead they only interact with
    // Vertexes) we can avoid some testing and get a performance gain by returning false
    // if the other edge is also a straight edge.
    return false;
  } else {
    return super.intersectionPossible(edge, swellage);
  }
};

/** @inheritDoc */
isStraight(): boolean {
  return true;
};

/** Makes a Vertex/Vertex contact.
* @param myV
* @param otherV
* @param p_body
* @param dist
*/
private makeVertexVertex(myV: Vertex, otherV: Vertex, p_body: Vector, dist: number): null|RigidBodyCollision {
  Util.assert( myV.getEdge1() == this || myV.getEdge2() == this );
  const rbc = new CornerCornerCollision(otherV, myV);
  rbc.distance = dist;
  // rw = near point in world coords
  const rw = this.body_.bodyToWorld(myV.locBody());
  rbc.impact1 = rw;
  // nb = normal in body coords
  const nb = p_body.subtract(myV.locBody()).normalize();
  if (nb == null) {
    // the vector between the other vertex and my vertex is zero,
    // we can't figure out a normal, so give up.
    return null;
  }
  // nw = normal in world coords
  const nw = this.body_.rotateBodyToWorld(nb);
  rbc.normal = nw;
  Util.assert(this.body_ == rbc.normalBody);
  // problem with this is that the radius is small and can change quickly
  rbc.ballObject = false;
  rbc.radius1 = NaN;
  rbc.ballNormal = true;
  rbc.radius2 = dist;
  rbc.creator = Util.DEBUG ? "StraightEdge.makeVertexVertex" : "";
  // Only low velocity contacts are valid. At high speeds, CornerCornerCollisions
  // are likely not valid.
  return rbc.contact() ? rbc : null;
};

/** @inheritDoc */
maxDistanceTo(p_body: Vector): number {
  const dist1 = this.v1_.locBody().distanceTo(p_body);
  const dist2 = this.v2_.locBody().distanceTo(p_body);
  return dist1 > dist2 ? dist1 : dist2;
};

/**  Returns the projection of the given point onto the extended line of this Edge,
where the extensions continue beyond the endpoints of this Edge.
This is the point on this line where a perpendicular would cross the given point.
```text
Derivation:  Let the Vertexes of this edge be v and v2, with slope k.
The line of the edge is y - vy = k(x - vx).
The line of the normal through p is y - py = (-1/k)(x - px)
Solve these two equations to get the intersection point q.
qx = (-vy + py + px/k + k vx) / (1/k + k)
qy = vy + k (qx - vx)
```
@param p_body the point on this Edge, in body coordinates
@return the projection of the given point onto the extended line of this Edge
*/
projectionOntoLine(p_body: Vector): Vector {
  const pbx = p_body.getX();
  const pby = p_body.getY();
  const x1 = this.v1_.locBodyX();
  const x2 = this.v2_.locBodyX();
  const y1 = this.v1_.locBodyY();
  const y2 = this.v2_.locBodyY();
  if (Math.abs(x2 - x1) < AbstractEdge.TINY_POSITIVE) {  // vertical edge
    return new Vector(x1, pby);
  }
  if (Math.abs(y2 - y1) < AbstractEdge.TINY_POSITIVE) {  // horizontal edge
    return new Vector(pbx, y1);
  }
  const k = (y2 - y1)/(x2 - x1);  // slope of the edge
  const qx = (-y1 + pby + pbx/k + k*x1) / (1/k + k);
  const qy = y1 + k * (qx - x1);
  return new Vector(qx, qy);
};

/** @inheritDoc */
testCollisionEdge(collisions: RigidBodyCollision[], edge: Edge, time: number): void {
  if (edge.isStraight()) {
    // no collisions or contacts between StraightEdges, only between vertex and
    // StraightEdge.
    // However, if desired here is a way to detect when StraightEdges intersect:
    // StraightStraight.testCollision(collisions, edge, this, time);
  } else {
    edge.testCollisionEdge(collisions, this, time);
  }
};

} // end StraightEdge class
Util.defineGlobal('lab$engine2D$StraightEdge', StraightEdge);
