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

goog.module('myphysicslab.lab.engine2D.AbstractEdge');

const Edge = goog.require('myphysicslab.lab.engine2D.Edge');
const UtilEngine = goog.require('myphysicslab.lab.engine2D.UtilEngine');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Vertex = goog.require('myphysicslab.lab.engine2D.Vertex');

/** Abstract base class for {@link myphysicslab.lab.engine2D.Edge}.

@todo  rename v1, v2 to be vertex1, vertex2
@todo  probably this should be an interface, not an abstract class???
@todo  distanceToLine:  why not take the distance to end point of the edge
        when the point is beyond the edge?

@todo  An Edge doesn't really need to know the RigidBody it is part of.
        There are 3 usages of body:
        1)  for coordinate transformation (bodyToWorld etc.).  This could be provided
            via an interface that defines those methods.
        2)  during construction, to add the Edge and its Vertexes to the Body
        3)  for creating a Collision or Contact.
        Number (1) can be provided via an interface that defines those methods.
        Numbers (2) and (3) could be deferred to / handled by the RigidBody itself.
        So: we could make Edge know far less about RigidBody, which would
        be a good thing in terms of object-oriented design principles.

* @abstract
* @implements {Edge}
*/
class AbstractEdge {
/**
* @param {!myphysicslab.lab.engine2D.Polygon} body the Polygon this Edge belongs to
* @param {!Vertex} vertex1 the previous vertex, in body
  coords; matches the next (second) vertex of the previous edge
* @param {!Vertex} vertex2 the next vertex, in body coords
*/
constructor(body, vertex1, vertex2) {
  /** the previous vertex, in body coords; matches the next (second) vertex of the
  previous edge
  * @type {!Vertex}
  * @protected
  */
  this.v1_ = vertex1;
  /** the next vertex, in body coords
  * @type {!Vertex}
  * @protected
  */
  this.v2_ = vertex2;
  /** the 'center' of this edge, an arbitrary point selected to minimize the centroid
  * radius of this edge
  * @type {!myphysicslab.lab.util.Vector}
  * @protected
  */
  this.centroid_body_ = this.v1_.locBody().add(this.v2_.locBody()).multiply(0.5);
  /** The centroid of this edge in world coords. For performance reasons this is
  * cached. See {@link #forgetPosition}.
  * @type {?Vector}
  * @private
  */
  this.centroid_world_ = null;
  /** the maximum distance from centroid to any point on this edge
  * @type {number}
  * @protected
  */
  this.centroidRadius_ = Util.NaN;
  /** the Polygon that this edge is a part of
  * @type {!myphysicslab.lab.engine2D.Polygon}
  * @protected
  */
  this.body_ = body;
  /** index of this edge in the body's list of edges
  * @type {number}
  * @protected
  */
  this.index_ = -1;
  /** @override */
  this.isStraight = false;
};

toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', v1_: '+this.v1_.toStringShort()
      +', v2_: '+this.v2_.toStringShort()
      +', centroid_body_: '+this.centroid_body_
      +', centroidRadius_: '+Util.NF5(this.centroidRadius_)
};

toStringShort() {
  return Util.ADVANCED ? '' : this.getClassName()
      +'{body_.name: "'+this.body_.getName()
      +'", index_: '+this.getIndex()+'}';
};

/** @abstract */
addPath(context) {};

/** @abstract */
chordError() {};

/** @abstract */
distanceToEdge(edge) {};

/** @abstract */
distanceToLine(p_body) {};

/** @abstract */
distanceToPoint(p_body) {};

/** @abstract */
findVertexContact(v, p_body, distTol) {};

/** @override */
forgetPosition() {
  this.centroid_world_ = null;
};

/** @override */
getBody() {
  return this.body_;
};

/** @abstract */
getBottomBody() {};

/** @abstract */
getCenterOfCurvature(p_body) {};

/** @override */
getCentroidBody() {
  return this.centroid_body_;
};

/** @override */
getCentroidRadius() {
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

/** @override */
getCentroidWorld() {
  if (this.centroid_world_ == null) {
    this.centroid_world_ = this.body_.bodyToWorld(this.centroid_body_);
  }
  return this.centroid_world_;
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
* @abstract
*/
getClassName() {};

/** @abstract */
getCurvature(p_body) {};

/** @override */
getDecoratedVertexes() {
  return [];
};

/** @override */
getIndex() {
  if (this.index_ == -1) {
    this.index_ = goog.array.indexOf(this.body_.getEdges_(), this);
    if (this.index_ == -1) {
      throw new Error();
    }
  }
  return this.index_;
};

/** @abstract */
getLeftBody() {};

/** @abstract */
getNormalBody(p_body) {};

/** @abstract */
getPointOnEdge(p_body) {};

/** @abstract */
getRightBody() {};

/** @abstract */
getTopBody() {};

/** @override */
getVertex1() {
  return this.v1_;
};

/** @override */
getVertex2() {
  return this.v2_;
};

/** @abstract */
highlight() {};

/** @abstract */
improveAccuracyEdge(rbc, edge) {};

/** @abstract */
intersection(p1_body, p2_body) {};

/** @override */
intersectionPossible(edge, swellage) {
  var c1 = this.getCentroidWorld();
  var c2 = edge.getCentroidWorld();
  var dist = c1.subtract(c2).lengthSquared();
  var dist2 = UtilEngine.square(edge.getCentroidRadius() + this.getCentroidRadius() + swellage);
  return dist < dist2;
};

/** @abstract */
maxDistanceTo(p_body) {};

/** @override */
pointOffset(p_body, length) {
  var n = this.getNormalBody(p_body);
  return p_body.add(n.multiply(length));
};

/** @override */
setCentroidRadius(value) {
  this.centroidRadius_ = value;
};

/** @override */
setVertex2(vertex) {
  this.v2_ = vertex;
};

/** @abstract */
testCollisionEdge(collisions, edge, time) {};

} //end class

/**
@const
@type {number}
@protected
*/
AbstractEdge.TINY_POSITIVE = 1E-10;

exports = AbstractEdge;
