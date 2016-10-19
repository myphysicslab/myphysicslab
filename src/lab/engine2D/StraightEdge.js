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

goog.provide('myphysicslab.lab.engine2D.StraightEdge');

goog.require('myphysicslab.lab.engine2D.CornerEdgeCollision');
goog.require('myphysicslab.lab.engine2D.Edge');
goog.require('myphysicslab.lab.engine2D.AbstractEdge');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.engine2D.Vertex');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var CornerEdgeCollision = myphysicslab.lab.engine2D.CornerEdgeCollision;
var AbstractEdge = myphysicslab.lab.engine2D.AbstractEdge;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;
var Vertex = myphysicslab.lab.engine2D.Vertex;

/** A straight Edge belonging to a Polygon. A StraightEdge is defined by
its two endpoint Vertexes, which are in body coordinates, plus it knows which side of
the Edge is outside of the body.

### distanceToLine() Derivation

    Let the Vertexes of this edge be v and v2, with slope k.
    The line of the edge is y - vy = k(x - vx).
    The line of the normal through p is y - py = (-1/k)(x - px)
    Solve these two equations to get the intersection point q.
    qx = (-vy + py + px/k + k vx) / (1/k + k)
    qy = vy + k (qx - vx)
    Return distance between p and q (or minus that distance).

### distanceToPoint() Derivation

    Let the Vertexes of this edge be v and v2, with slope k.
    The line of the edge is y - vy = k(x - vx).
    The line of the normal through p is y - py = (-1/k)(x - px)
    Solve these two equations to get the intersection point q.
    qx = (-vy + py + px/k + k vx) / (1/k + k)
    qy = vy + k (qx - vx)
    Check if the intersection point q within endpoints of the edge,
    return infinity if not.
    Return distance between p and q (or minus that distance).

### getNormalBody() Derivation

    Let k be the slope of the edge.
    The normal has slope -1/k = y/x
    To be unit normal, we need: x^2 + y^2 =1
    Solve for x and y:
    x = -k y
    (k^2 + 1) y^2 = 1
    y = 1/sqrt(1 + k^2)
    x = -k/sqrt(1 + k^2)

* @param {!myphysicslab.lab.engine2D.Polygon} body the Polygon this Edge is a part of
* @param {!myphysicslab.lab.engine2D.Vertex} vertex1 the previous Vertex, in body coords
* @param {!myphysicslab.lab.engine2D.Vertex} vertex2 the next Vertex, in body coords
* @param {boolean} outsideIsUp `true` means the region above the Edge is outside of the
  Polygon (when viewed in body coordinates); for vertical Edge `true` means region right
  of Edge is outside.
* @constructor
* @final
* @struct
* @extends {myphysicslab.lab.engine2D.AbstractEdge}
* @implements {myphysicslab.lab.engine2D.Edge}
* @throws {Error} if `vertex1` is already connected to a 'next' Edge
* @throws {Error} if `vertex2` is already connected to a 'previous' Edge
*/
myphysicslab.lab.engine2D.StraightEdge = function(body, vertex1, vertex2, outsideIsUp) {
  AbstractEdge.call(this, body, vertex1, vertex2);
  /**
  * @type {boolean}
  * @private
  */
  this.outsideIsUp_ = outsideIsUp;
  vertex1.setEdge2(this);
  vertex2.setEdge1(this);
};

var StraightEdge = myphysicslab.lab.engine2D.StraightEdge;
goog.inherits(StraightEdge, AbstractEdge);

if (!UtilityCore.ADVANCED) {
  StraightEdge.prototype.toString = function() {
    return StraightEdge.superClass_.toString.call(this)
        +', outsideIsUp_: '+this.outsideIsUp_
        +'}';
  };
};

/** @inheritDoc */
StraightEdge.prototype.addPath = function(context) {
  context.lineTo(this.v2_.locBodyX(), this.v2_.locBodyY());
};

/** @inheritDoc */
StraightEdge.prototype.chordError = function() {
  return 0;
};

/** @inheritDoc */
StraightEdge.prototype.distanceToEdge = function(edge) {
  if (edge instanceof StraightEdge) {
    // no edge-edge contact between straight edges;
    // these are handled by corner-edge contacts. See Polygon.checkCollision.
    throw new Error();
  } else {
    return edge.distanceToEdge(this);
  }
};

/** @inheritDoc */
StraightEdge.prototype.distanceToLine = function(p_body) {
  var r;
  var pbx = p_body.getX();
  var pby = p_body.getY();
  var x1 = this.v1_.locBodyX();
  var x2 = this.v2_.locBodyX();
  var y1 = this.v1_.locBodyY();
  var y2 = this.v2_.locBodyY();
  if (Math.abs(x2 - x1) < AbstractEdge.TINY_POSITIVE) { // vertical edge
    r = this.outsideIsUp_ ? pbx - x1 : x1 - pbx;
  } else if (Math.abs(y2 - y1) < AbstractEdge.TINY_POSITIVE) {  // horizontal edge
    r = this.outsideIsUp_ ? pby - y1 : y1 - pby;
  } else {
    var k = (y2 - y1)/(x2 - x1);  // slope of the edge
    var qx = (-y1 + pby + pbx/k + k*x1) / (1/k + k);
    var qy = y1 + k * (qx - x1);
    var dx = pbx-qx;
    var dy = pby-qy;
    var d = Math.sqrt(dx*dx + dy*dy);
    if (pby < qy) d = -d;
    r = this.outsideIsUp_ ? d : -d;
  }
  if (isNaN(r)) {
    throw new Error(goog.DEBUG ?
        ('distanceToLine NaN '+p_body+' '+this.v1_+' '+this.v2_) : '');
  }
  return r;
};

/** @inheritDoc */
StraightEdge.prototype.distanceToPoint = function(p_body) {
  var pbx = p_body.getX();
  var pby = p_body.getY();
  var x1 = this.v1_.locBodyX();
  var x2 = this.v2_.locBodyX();
  var y1 = this.v1_.locBodyY();
  var y2 = this.v2_.locBodyY();
  if (Math.abs(x2 - x1) < AbstractEdge.TINY_POSITIVE) {
    // vertical edge
    // if p is beyond endpoints of this edge segment, return infinite distance
    if (y1 > y2 && (pby > y1 || pby < y2))
      return UtilityCore.POSITIVE_INFINITY;
    if (y2 > y1 && (pby > y2 || pby < y1))
      return UtilityCore.POSITIVE_INFINITY;
    return this.outsideIsUp_ ? pbx - x1 : x1 - pbx;
  } else if (Math.abs(y2 - y1) < AbstractEdge.TINY_POSITIVE) {
    // horizontal edge
    // if p is beyond endpoints of this edge segment, return infinite distance
    if (x1 > x2 && (pbx > x1 || pbx < x2))
      return UtilityCore.POSITIVE_INFINITY;
    if (x2 > x1 && (pbx > x2 || pbx < x1))
      return UtilityCore.POSITIVE_INFINITY;
    return this.outsideIsUp_ ? pby - y1 : y1 - pby;
  } else {
    // edge is neither horizontal or vertical
    // k = slope of the edge
    var k = (y2 - y1)/(x2 - x1);
    var qx = (-y1 + pby + pbx/k + k*x1) / (1/k + k);
    var qy = y1 + k * (qx - x1);
    if (x1 < x2 && (qx < x1 || qx > x2))
      return UtilityCore.POSITIVE_INFINITY;
    if (x2 < x1 && (qx < x2 || qx > x1))
      return UtilityCore.POSITIVE_INFINITY;
    var dx = pbx-qx;
    var dy = pby-qy;
    var d = Math.sqrt(dx*dx + dy*dy);
    if (pby < qy) d = -d;
    return this.outsideIsUp_ ? d : -d;
  }
};

/** @inheritDoc */
StraightEdge.prototype.findVertexContact = function(v, p_body, distTol) {
  // p_body = point in body coords
  var pbx = p_body.getX();
  var pby = p_body.getY();
  var x1 = this.v1_.locBodyX();
  var x2 = this.v2_.locBodyX();
  var y1 = this.v1_.locBodyY();
  var y2 = this.v2_.locBodyY();
  if (Math.abs(x2 - x1) < AbstractEdge.TINY_POSITIVE) {  // vertical edge
    var vx = (x1 + x2)/2;  // average in case slightly different
    // is p is beyond endpoints of this edge segment?
    if (y1 > y2 && (pby > y1 || pby < y2))
      return null;
    if (y2 > y1 && (pby > y2 || pby < y1))
      return null;
    var dist = this.outsideIsUp_ ? pbx - vx : vx - pbx;
    if (dist < 0 || dist > distTol)
      return null;
    var rbc = new CornerEdgeCollision(v, this);
    rbc.distance = dist;
    // rw = near point in world coords
    var rw = this.body_.bodyToWorld(new Vector(vx, pby));
    rbc.impact1 = rw;
    // nw = normal in world coords
    var nw = this.body_.rotateBodyToWorld(new Vector(this.outsideIsUp_ ? 1 : -1, 0));
    rbc.normal = nw;
    rbc.ballNormal = false;
    rbc.radius2 = UtilityCore.POSITIVE_INFINITY;
    rbc.r2 = rbc.impact1.subtract(this.body_.getPosition());
    rbc.creator = goog.DEBUG ? 'StraightEdge.findVertexContactVert' : '';
    return rbc;
  }
  if (Math.abs(y2 - y1) < AbstractEdge.TINY_POSITIVE) {  // horizontal edge
    var vy = (y1 + y2)/2;  // average in case slightly different
    // is p is beyond endpoints of this edge segment?
    if (x1 > x2 && (pbx > x1 || pbx < x2))
      return null;
    if (x2 > x1 && (pbx > x2 || pbx < x1))
      return null;
    var dist = this.outsideIsUp_ ? pby - vy : vy - pby;
    if (dist < 0 || dist > distTol) {
      return null;
    }
    var rbc = new CornerEdgeCollision(v, this);
    rbc.distance = dist;
    // rw = near point in world coords
    var rw = this.body_.bodyToWorld(new Vector(pbx, vy));
    rbc.impact1 = rw;
    // nw = normal in world coords
    var nw = this.body_.rotateBodyToWorld(new Vector(0, this.outsideIsUp_ ? 1 : -1));
    rbc.normal = nw;
    rbc.ballNormal = false;
    rbc.radius2 = UtilityCore.POSITIVE_INFINITY;
    rbc.r2 = rbc.impact1.subtract(this.body_.getPosition());
    rbc.creator = goog.DEBUG ? 'StraightEdge.findVertexContactHoriz' : '';
    return rbc;
  }
  var k = (y2 - y1)/(x2 - x1);  // slope of the edge
  // rb = near point in body coords
  var rbx = (-y1 + pby + pbx/k + k*x1) / (1/k + k);
  var rby = y1 + k * (rbx - x1);
  // is rb is beyond endpoints of this edge segment?
  if (x1 < x2 && (rbx < x1 || rbx > x2))
    return null;
  if (x2 < x1 && (rbx < x2 || rbx > x1))
    return null;
  var dx = pbx-rbx;
  var dy = pby-rby;
  var dist = Math.sqrt(dx*dx + dy*dy);
  if (pby < rby) dist = -dist;
  dist = this.outsideIsUp_ ? dist : -dist;
  if (dist < 0 || dist > distTol)
    return null;
  var rbc = new CornerEdgeCollision(v, this);
  rbc.distance = dist;
  // rw = near point in world coords
  var rw = this.body_.bodyToWorld(new Vector(rbx, rby));
  rbc.impact1 = rw;
  var len = Math.sqrt(1 + k*k);
  // nw = normal in world coords
  var nw = this.body_.rotateBodyToWorld(new Vector(-k/len, 1/len));
  if (!this.outsideIsUp_) {
    nw = nw.multiply(-1);
  }
  rbc.normal = nw;
  rbc.ballNormal = false;
  rbc.radius2 = UtilityCore.POSITIVE_INFINITY;
  rbc.r2 = rbc.impact1.subtract(this.body_.getPosition());
  rbc.creator = goog.DEBUG ? 'StraightEdge.findVertexContact' : '';
  return rbc;
};

/** @inheritDoc */
StraightEdge.prototype.getBottomBody = function() {
  var y1 = this.v1_.locBodyY();
  var y2 = this.v2_.locBodyY();
  return y1 < y2 ? y1 : y2;
};

/** @inheritDoc */
StraightEdge.prototype.getCenterOfCurvature = function(p_body) {
  return null;
};

/** @inheritDoc */
StraightEdge.prototype.getClassName = function() {
  return 'StraightEdge';
};

/** @inheritDoc */
StraightEdge.prototype.getCurvature = function(p_body) {
  return UtilityCore.POSITIVE_INFINITY;
};

/** @inheritDoc */
StraightEdge.prototype.getLeftBody = function() {
  var x1 = this.v1_.locBodyX();
  var x2 = this.v2_.locBodyX();
  return x1 < x2 ? x1 : x2;
};

/** @inheritDoc */
StraightEdge.prototype.getNormalBody = function(p_body) {
  // (we ignore p_body, because normal is same at any point on a straight line)
  var x1 = this.v1_.locBodyX();
  var x2 = this.v2_.locBodyX();
  var y1 = this.v1_.locBodyY();
  var y2 = this.v2_.locBodyY();
  if (Math.abs(x2 - x1) < AbstractEdge.TINY_POSITIVE) {  // vertical edge
    // for vertical lines, outsideIsUp means normal points right
    return new Vector(this.outsideIsUp_ ? 1 : -1, 0);
  }
  if (Math.abs(y2 - y1) < AbstractEdge.TINY_POSITIVE) { // horizontal edge
    // for horizontal lines, outsideIsUp means normal points up
    return new Vector(0, this.outsideIsUp_ ? 1 : -1);
  }
  var k = (y2 - y1)/(x2 - x1);  // slope of the edge
  var d = Math.sqrt(1 + k*k);
  var nx = -k/d;
  var ny = 1/d;
  if (!this.outsideIsUp_) {
    nx = -nx;
    ny = -ny;
  }
  return new Vector(nx, ny);
};

/** @inheritDoc */
StraightEdge.prototype.getPointOnEdge = function(p_body) {
  var p = this.projectionOntoLine(p_body);
  var n = this.getNormalBody(p_body);
  return [p, n];
};

/** @inheritDoc */
StraightEdge.prototype.getRightBody = function() {
  var x1 = this.v1_.locBodyX();
  var x2 = this.v2_.locBodyX();
  return x1 > x2 ? x1 : x2;
};

/** @inheritDoc */
StraightEdge.prototype.getTopBody = function() {
  var y1 = this.v1_.locBodyY();
  var y2 = this.v2_.locBodyY();
  return y1 > y2 ? y1 : y2;
};

/** @inheritDoc */
StraightEdge.prototype.highlight = function() {
  if (UtilEngine.debugEngine2D != null) {
    var p1 = this.body_.bodyToWorld(this.v1_.locBody());
    var p2 = this.body_.bodyToWorld(this.v2_.locBody());
    UtilEngine.debugEngine2D.debugLine('edge', p1, p2);
  }
};

/** @inheritDoc */
StraightEdge.prototype.improveAccuracyEdge = function(rbc, edge) {
  if (edge instanceof StraightEdge) {
    // no collisions between straight edges;
    // these are handled by corner collisions. See Polygon.checkCollision.
  } else {
    edge.improveAccuracyEdge(rbc, this);
  }
};

/** @inheritDoc */
StraightEdge.prototype.intersection = function(p1_body, p2_body) {
  if (p1_body == p2_body) {
    return null;
  }
  var q = UtilEngine.linesIntersect(this.v1_.locBody(), this.v2_.locBody(), p1_body, p2_body);
  return q == null ? null : [q];
};

/** @inheritDoc */
StraightEdge.prototype.intersectionPossible = function(edge, swellage) {
  if (edge instanceof StraightEdge) {
    // Because straight/straight edges never interact (instead they only interact with
    // Vertexes) we can avoid some testing and get a performance gain by returning false
    // if the other edge is also a straight edge.
    return false;
  } else {
    // is this type cast because of NTI?
    return /** @type {boolean} */(
      StraightEdge.superClass_.intersectionPossible.call(this, edge, swellage));
  }
};

/** @inheritDoc */
StraightEdge.prototype.isStraight = function() {
  return true;
};

/** @inheritDoc */
StraightEdge.prototype.maxDistanceTo = function(p_body) {
  var dist1 = this.v1_.locBody().distanceTo(p_body);
  var dist2 = this.v2_.locBody().distanceTo(p_body);
  return dist1 > dist2 ? dist1 : dist2;
};

/**  Returns the projection of the given point onto the extended line of this Edge,
where the extensions continue beyond the endpoints of this Edge.
This is the point on this line where a perpendicular would cross the given point.

    Derivation:  Let the Vertexes of this edge be v and v2, with slope k.
    The line of the edge is y - vy = k(x - vx).
    The line of the normal through p is y - py = (-1/k)(x - px)
    Solve these two equations to get the intersection point q.
    qx = (-vy + py + px/k + k vx) / (1/k + k)
    qy = vy + k (qx - vx)

* @param {!myphysicslab.lab.util.Vector} p_body the point on this Edge, in body
*    coordinates
* @return {!myphysicslab.lab.util.Vector} the projection of the given point onto the
*    extended line of this Edge
*/
StraightEdge.prototype.projectionOntoLine = function(p_body) {
  var pbx = p_body.getX();
  var pby = p_body.getY();
  var x1 = this.v1_.locBodyX();
  var x2 = this.v2_.locBodyX();
  var y1 = this.v1_.locBodyY();
  var y2 = this.v2_.locBodyY();
  if (Math.abs(x2 - x1) < AbstractEdge.TINY_POSITIVE) {  // vertical edge
    return new Vector(x1, pby);
  }
  if (Math.abs(y2 - y1) < AbstractEdge.TINY_POSITIVE) {  // horizontal edge
    return new Vector(pbx, y1);
  }
  var k = (y2 - y1)/(x2 - x1);  // slope of the edge
  var qx = (-y1 + pby + pbx/k + k*x1) / (1/k + k);
  var qy = y1 + k * (qx - x1);
  return new Vector(qx, qy);
};

/** @inheritDoc */
StraightEdge.prototype.testCollisionEdge = function(collisions, edge, time) {
  if (edge instanceof StraightEdge) {
    // no collisions between straight edges;  these are handled by corner collisions.
  } else {
    edge.testCollisionEdge(collisions, this, time);
  }
};

}); // goog.scope
