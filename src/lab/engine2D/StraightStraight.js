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

goog.module('myphysicslab.lab.engine2D.StraightStraight');
const asserts = goog.require('goog.asserts');

const EdgeEdgeCollision = goog.require('myphysicslab.lab.engine2D.EdgeEdgeCollision');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const UtilEngine = goog.require('myphysicslab.lab.engine2D.UtilEngine');
const UtilityCollision = goog.require('myphysicslab.lab.engine2D.UtilityCollision');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Provides static functions for handling interactions between two
{@link myphysicslab.lab.engine2D.StraightEdge StraightEdges}.

NOTE: This class is not currently being used!  Because StraightEdges cannot have
edge-edge collisions, only vertex-edge or vertex-vertex collisions.
*/
class StraightStraight {
/**
@private
*/
constructor() {
  throw '';
};

/** Returns intersection point of the two StraightEdges.
* @param {!myphysicslab.lab.engine2D.StraightEdge} edge1
* @param {!myphysicslab.lab.engine2D.StraightEdge} edge2
* @return {?Vector} intersection point or null if no intersection
* @private
*/
static intersect(edge1, edge2) {
  var body1 = edge1.getBody();
  var body2 = edge2.getBody();
  var e1v1 = edge1.getVertex1();
  var e1v2 = edge1.getVertex2();
  var e2v1 = edge2.getVertex1();
  var e2v2 = edge2.getVertex2();
  return UtilEngine.linesIntersect(body1.bodyToWorld(e1v1.locBody()),
      body1.bodyToWorld(e1v2.locBody()),
      body2.bodyToWorld(e2v1.locBody()),
      body2.bodyToWorld(e2v2.locBody()));
};

/** Updates the EdgeEdgeCollision to have more accurate information based on current
positions and velocities of the RigidBodys.
* @param {!EdgeEdgeCollision} rbc
* @param {!myphysicslab.lab.engine2D.StraightEdge} edge1
* @param {!myphysicslab.lab.engine2D.StraightEdge} edge2
*/
static improveAccuracy(rbc, edge1, edge2) {
  var edge1Body = edge1.getBody();
  var edge2Body = edge2.getBody();
  asserts.assert( rbc.getPrimaryBody() == edge1Body);
  asserts.assert( rbc.getNormalBody() == edge2Body);
  // The scenario is:  collision between a edge1 and edge2 happened,
  // it was detected by the two lines intersecting.
  var pt = StraightStraight.intersect(edge1, edge2);
  if (pt != null) {
    // If the lines are still intersecting, then use the current point of intersection.
    rbc.impact1 = pt;
    rbc.normal = edge2.getBody().rotateBodyToWorld(edge2.getNormalBody(pt));
  } else {
    // If lines are not intersecting, then use endpoint that is closest to other line.
    // This will be the endpoint with smallest positive distance.
    var dist = Util.POSITIVE_INFINITY;
    var body1 = edge1.getBody();
    var body2 = edge2.getBody();
    var e1v1 = body1.bodyToWorld(edge1.getVertex1().locBody());
    var e1v2 = body1.bodyToWorld(edge1.getVertex2().locBody());
    var e2v1 = body2.bodyToWorld(edge2.getVertex1().locBody());
    var e2v2 = body2.bodyToWorld(edge2.getVertex2().locBody());
    var e = null;
    var d = edge1.distanceToLine(e2v1);
    if (d > 0 && d < dist) {
      e = edge1;
      pt = e2v1;
      dist = d;
    }
    d = edge1.distanceToLine(e2v2);
    if (d > 0 && d < dist) {
      e = edge1;
      pt = e2v2;
      dist = d;
    }
    d = edge2.distanceToLine(e1v1);
    if (d > 0 && d < dist) {
      e = edge2;
      pt = e1v1;
      dist = d;
    }
    d = edge2.distanceToLine(e1v2);
    if (d > 0 && d < dist) {
      e = edge2;
      pt = e1v2;
      dist = d;
    }
    if (pt != null && e != null) {
      rbc.distance = dist;
      rbc.impact1 = pt;
      rbc.normal = e.getBody().rotateBodyToWorld(e.getNormalBody(pt));
    } else {
      throw 'StraightStraight.improveAccuracy failed';
    }
  }
};

/** Tests the positions and velocities of the two Edges, and if a collision
* is detected, adds an EdgeEdgeCollision to the given array.
* @param {!Array<!RigidBodyCollision>} collisions any new
*    collision will be added to this array
* @param {!myphysicslab.lab.engine2D.StraightEdge} edge1
* @param {!myphysicslab.lab.engine2D.StraightEdge} edge2
* @param {number} time current simulation time
*/
static testCollision(collisions, edge1, edge2, time) {
  if (UtilityCollision.DISABLE_EDGE_EDGE)
    return;
  var pt = StraightStraight.intersect(edge1, edge2);
  if (pt != null) {
    StraightStraight.addCollision(collisions, edge1, edge2, pt, time);
  }
};

/**
* @param {!Array<!RigidBodyCollision>} collisions
* @param {!myphysicslab.lab.engine2D.StraightEdge} edge1
* @param {!myphysicslab.lab.engine2D.StraightEdge} edge2
* @param {!Vector} pt collision point in world coords
* @param {number} time current simulation time
* @private
*/
static addCollision(collisions, edge1, edge2, pt, time) {
  var rbc = new EdgeEdgeCollision(edge1, edge2);
  rbc.ballNormal = false;
  rbc.ballObject = false;
  rbc.radius1 = Util.POSITIVE_INFINITY;
  rbc.radius2 = Util.POSITIVE_INFINITY;
  rbc.distance = -0.1; // distance is meaningless for edge/edge collision
  rbc.impact1 = pt;
  rbc.creator = Util.DEBUG ? 'StraightStraight' : '';
  rbc.normal = edge2.getBody().rotateBodyToWorld(edge2.getNormalBody(pt));
  rbc.setDetectedTime(time);
  UtilityCollision.addCollision(collisions, rbc);
  //console.log('StraightStraight.addCollision '+rbc);
};

} // end class

exports = StraightStraight;
