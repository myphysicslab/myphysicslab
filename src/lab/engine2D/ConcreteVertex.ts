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

import { Edge, Vertex } from './RigidBody.js';
import { UtilEngine } from './UtilEngine.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** Concrete implementation of {@link Vertex} interface.
*/
export class ConcreteVertex implements Vertex {
  /** location in body coordinates of the RigidBody that this Vertex belongs to */
  private loc_body_: Vector;
  /** true if its the endpoint of an edge */
  private endPoint_: boolean;
  /** the previous edge in list of edges */
  private edge_: null|Edge;
  /** the next edge in list of edges -- null for mid-point Vertexes */
  private edge2_: null|Edge = null;
  /** for debugging:  give each Vertex a unique id number */
  private id_: number = ConcreteVertex.next_vertex_id++;

/**
* @param v_body location of this Vertex in body coords
*    of the Polygon it belongs to
* @param opt_endPoint whether this is the endpoint of an edge, default is
*    `true`
* @param opt_edge previous edge (optional)
*/
constructor(v_body: Vector, opt_endPoint?: boolean, opt_edge?: null|Edge) {
  this.loc_body_ = v_body;
  this.endPoint_ = opt_endPoint ?? true;
  this.edge_ = opt_edge ?? null;
};

toString() {
  return this.toStringShort().slice(0, -1)
      +', id_: '+this.id_
      +', endPoint_: '+this.endPoint_
      +', body.name: '+ (this.edge_ == null ? 'null' :
          '"' + this.edge_.getBody().getName() + '"')
      +', edge_.index: '+(this.edge_ == null ? '-1' : this.edge_.getIndex())
      +', edge2_.index: '+(this.edge2_ == null ? '-1' : this.edge2_.getIndex())
      +'}';
};

toStringShort() {
  return 'ConcreteVertex{loc_body_: '+this.loc_body_+'}';
};

/** @inheritDoc */
getID(): number {
  return this.id_;
};

/** @inheritDoc */
isEndPoint(): boolean {
  return this.endPoint_;
};

/** @inheritDoc */
locBody(): Vector {
  return this.loc_body_;
};

/** @inheritDoc */
locBodyX(): number {
  return this.loc_body_.getX();
};

/** @inheritDoc */
locBodyY(): number {
  return this.loc_body_.getY();
};

/** @inheritDoc */
highlight(): void {
  if (this.edge_ != null && UtilEngine.debugEngine2D != null) {
    const w1 = this.edge_.getBody().bodyToWorld(this.loc_body_);
    UtilEngine.debugEngine2D.debugCircle('dot', w1, 0.06);
  }
};

/** @inheritDoc */
getCurvature(): number {
  let r = Infinity;
  if (this.edge_ != null) {
    r = this.edge_.getCurvature(this.loc_body_);
    if (this.edge2_ != null) {
      const r2 = this.edge2_.getCurvature(this.loc_body_);
      if (Math.abs(r2) < Math.abs(r)) {
        r = r2;
      }
    }
  }
  return r;
};

/** @inheritDoc */
getEdge1(): Edge {
  if (this.edge_ != null) {
    return this.edge_;
  } else {
    throw '';
  }
};

/** @inheritDoc */
getEdge2(): Edge {
  if (this.edge2_ != null) {
    return this.edge2_;
  } else if (this.edge_ != null) {
    return this.edge_;
  } else {
    throw '';
  }
};

/** @inheritDoc */
safeGetEdge2(): null|Edge {
  return this.edge2_;
};

/** @inheritDoc */
setEdge1(edge: Edge): void {
  if (this.edge_ == null) {
    this.edge_ = edge;
  } else {
    throw '';
  }
};

/** @inheritDoc */
setEdge2(edge: Edge): void {
  if (this.edge2_ == null) {
    this.edge2_ = edge;
  } else {
    throw '';
  }
};

/** for debugging:  next vertex id number */
static next_vertex_id = 1;

} // end ConcreteVertex class

Util.defineGlobal('lab$engine2D$ConcreteVertex', ConcreteVertex);
