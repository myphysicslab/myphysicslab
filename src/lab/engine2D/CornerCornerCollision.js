// Copyright 2016 Erik Neumann.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.module('myphysicslab.lab.engine2D.CornerCornerCollision');

const asserts = goog.require('goog.asserts');

const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vertex = goog.require('myphysicslab.lab.engine2D.Vertex');

/** A RigidBodyCollision between two corners.

*/
class CornerCornerCollision extends RigidBodyCollision {
/**
* @param {!Vertex} vertex
* @param {!Vertex} normalVertex
*/
constructor(vertex, normalVertex) {
  var v_edge = vertex.getEdge1();
  var nv_edge = normalVertex.getEdge1();
  if (v_edge == null || nv_edge == null) {
    throw "CornerCornerCollision: null edge; vertex="+vertex
      +"; normalVertex="+normalVertex;
  }
  super(v_edge.getBody(), nv_edge.getBody(), /*joint=*/false);
  /** the vertex of the primary object
  * @type {!Vertex}
  * @private
  */
  this.vertex = vertex;
  /** vertex on normal body for a vertex/vertex collision
  * @type {!Vertex}
  * @private
  */
  this.normalVertex = normalVertex;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' :
      super.toString().slice(0, -1)
      +', vertex-ID: '+ this.vertex.getID()
      +', normalVertex-ID: '+ this.normalVertex.getID()
      + '}';
};

/** @override */
getClassName() {
  return 'CornerCornerCollision';
};

/** @override */
checkConsistent() {
  super.checkConsistent();
  asserts.assert( this.normalVertex != null );
};

/** @override */
hasVertex(v) {
  return v == this.vertex || v == this.normalVertex;
};

/** @override */
similarTo(c) {
  if (!c.hasBody(this.primaryBody) || !c.hasBody(this.normalBody)) {
    return false;
  }
  if (c.hasVertex(this.vertex) || c.hasVertex(this.normalVertex)) {
    // both collisions involve same bodies and same vertex
    return true;
  }
  return false;
};

/** @override */
updateCollision(time) {
  asserts.assert( this.normalVertex != null );
  var pbw = this.primaryBody.bodyToWorld(this.vertex.locBody());
  var pnb = this.normalBody.worldToBody(pbw);
  this.impact1 = this.normalBody.bodyToWorld(this.normalVertex.locBody());
  this.distance = this.normalVertex.locBody().distanceTo(pnb);
  if (!isFinite(this.distance)) {
    throw '';
  }
  // nw = normal in world coords
  var nv = pnb.subtract(this.normalVertex.locBody()).normalize();
  if (nv == null) {
    throw '';
  }
  this.normal = this.normalBody.rotateBodyToWorld(nv);
  super.updateCollision(time);
};

} // end class
exports = CornerCornerCollision;
