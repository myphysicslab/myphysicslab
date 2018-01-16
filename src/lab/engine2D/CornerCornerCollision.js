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

goog.provide('myphysicslab.lab.engine2D.CornerCornerCollision');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.Vertex');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var Util = goog.module.get('myphysicslab.lab.util.Util');
var Vertex = myphysicslab.lab.engine2D.Vertex;

/** A RigidBodyCollision between two corners.

* @param {!Vertex} vertex
* @param {!Vertex} normalVertex
* @constructor
* @final
* @struct
* @extends {RigidBodyCollision}
*/
myphysicslab.lab.engine2D.CornerCornerCollision = function(vertex, normalVertex) {
  var v_edge = vertex.getEdge1();
  var nv_edge = normalVertex.getEdge1();
  if (v_edge == null || nv_edge == null) {
    throw new Error("CornerCornerCollision: null edge; vertex="+vertex
      +"; normalVertex="+normalVertex);
  }
  RigidBodyCollision.call(this, v_edge.getBody(), nv_edge.getBody(), /*joint=*/false);
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
var CornerCornerCollision = myphysicslab.lab.engine2D.CornerCornerCollision;
goog.inherits(CornerCornerCollision, RigidBodyCollision);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  CornerCornerCollision.prototype.toString = function() {
    return CornerCornerCollision.superClass_.toString.call(this).slice(0, -1)
        +', vertex-ID: '+ this.vertex.getID()
        +', normalVertex-ID: '+ this.normalVertex.getID()
        + '}';
  };
};

/** @inheritDoc */
CornerCornerCollision.prototype.getClassName = function() {
  return 'CornerCornerCollision';
};

/** @inheritDoc */
CornerCornerCollision.prototype.checkConsistent = function() {
  CornerCornerCollision.superClass_.checkConsistent.call(this);
  goog.asserts.assert( this.normalVertex != null );
};

/** @inheritDoc */
CornerCornerCollision.prototype.hasVertex = function(v) {
  return v == this.vertex || v == this.normalVertex;
};

/** @inheritDoc */
CornerCornerCollision.prototype.similarTo = function(c) {
  if (!c.hasBody(this.primaryBody) || !c.hasBody(this.normalBody)) {
    return false;
  }
  if (c.hasVertex(this.vertex) || c.hasVertex(this.normalVertex)) {
    // both collisions involve same bodies and same vertex
    return true;
  }
  return false;
};

/** @inheritDoc */
CornerCornerCollision.prototype.updateCollision = function(time) {
  goog.asserts.assert( this.normalVertex != null );
  var pbw = this.primaryBody.bodyToWorld(this.vertex.locBody());
  var pnb = this.normalBody.worldToBody(pbw);
  this.impact1 = this.normalBody.bodyToWorld(this.normalVertex.locBody());
  this.distance = this.normalVertex.locBody().distanceTo(pnb);
  if (!isFinite(this.distance)) {
    throw new Error();
  }
  // nw = normal in world coords
  var nv = pnb.subtract(this.normalVertex.locBody()).normalize();
  if (nv == null) {
    throw new Error();
  }
  this.normal = this.normalBody.rotateBodyToWorld(nv);
  CornerCornerCollision.superClass_.updateCollision.call(this, time);
};

}); // goog.scope
