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

goog.provide('myphysicslab.lab.engine2D.CircleStraight');

goog.require('myphysicslab.lab.engine2D.EdgeEdgeCollision');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.engine2D.UtilityCollision');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var EdgeEdgeCollision = myphysicslab.lab.engine2D.EdgeEdgeCollision;
var NF5 = myphysicslab.lab.util.Util.NF5;
var NF7 = myphysicslab.lab.util.Util.NF7;
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
var UtilityCollision = myphysicslab.lab.engine2D.UtilityCollision;
var Util = myphysicslab.lab.util.Util;
var Vector = myphysicslab.lab.util.Vector;

/** Provides static functions for handling interactions between
{@link myphysicslab.lab.engine2D.CircularEdge CircularEdge} and
{@link myphysicslab.lab.engine2D.StraightEdge StraightEdge}.

@todo Perhaps nearestPointByAngle is not needed in testCollision? Instead just reject
the edge-edge collision if not both the new and old impact points are within the arc of
the circle.

@constructor
@final
@struct
@private
*/
myphysicslab.lab.engine2D.CircleStraight = function() {
  throw new Error();
};

var CircleStraight = myphysicslab.lab.engine2D.CircleStraight;

/** Updates the EdgeEdgeCollision to have more accurate information based on current
positions and velocities of the RigidBodys.
* @param {!EdgeEdgeCollision} rbc
* @param {!myphysicslab.lab.engine2D.CircularEdge} circle
* @param {!myphysicslab.lab.engine2D.StraightEdge} straight
*/
CircleStraight.improveAccuracy = function(rbc, circle, straight) {
  var circleBody = circle.getBody();
  var straightBody = straight.getBody();
  goog.asserts.assert( rbc.getPrimaryBody() == circleBody);
  goog.asserts.assert( rbc.getNormalBody() == straightBody);
  var oldX = rbc.impact1.getX();
  var oldY = rbc.impact1.getY();
  // The scenario is:  collision between a circle and straight happened,
  // it was detected from one (or more) vertex of the circle edge crossing
  // the straight line.
  // Now we want to find the closest point on the circle edge, instead of the vertex.
  // Find nearest point on circle to edge, and the normal to the straight edge.
  // cw = center in world coords
  var cw = circleBody.bodyToWorld(circle.getCenterBody());
  // cb = center in straight body coords
  var cb = straightBody.worldToBody(cw);
  // confusing:  two different ways of calculating the point of impact
  var pb2 = straight.pointOffset(cb, -circle.getRadius());
  // pb = point of impact in straight body coords
  // Calculate impact point same as testCollision (different for contact)
  var pb;
  if (rbc.contact())
    pb = straight.projectionOntoLine(cb);
  else
    pb = pb2;
  // pw = point of impact in world coords
  var pw = straightBody.bodyToWorld(pb);
  // nb = normal in body coords
  var nb = straight.getNormalBody(pb);
  // nw = normal in world coords
  var nw = straightBody.rotateBodyToWorld(nb);
  //console.log('improveAccuracy '+Util.hypot(rbc.impact1.getX() - pw[0],
  //   rbc.impact1.getY() - pw[1]));
  // always use pb2 here; even for contact, otherwise get zero distance
  rbc.distance = straight.distanceToLine(pb2);
  rbc.impact1 = pw;
  rbc.normal = nw;
  if (0 == 1 && goog.DEBUG) {
    console.log('CircleStraight.improveAccuracy '
      +NF7(oldX)+' '
      +NF7(oldY)+' -> '
      +NF7(rbc.impact1.getX())+' '
      +NF7(rbc.impact1.getY())+' '
      );
  }
};

/** Tests the positions and velocities of the two Edges, and if a collision or contact
* is detected, adds an EdgeEdgeCollision to the given array.
* @param {!Array<!RigidBodyCollision>} collisions any new
*    collision will be added to this array
* @param {!myphysicslab.lab.engine2D.StraightEdge} straight
* @param {!myphysicslab.lab.engine2D.CircularEdge} circle
@param {number} time current simulation time
*/
CircleStraight.testCollision = function(collisions, straight, circle, time) {
  if (UtilityCollision.DISABLE_EDGE_EDGE)
    return;
  if (!circle.outsideIsOut()) {
    // concave circle edge cannot have collision with straight edge
    return;
  }
  // (Only looking for edge/edge collisions here, not corner collisions.)
  // cw = center of circle in world coords
  var cw = circle.getBody().bodyToWorld(circle.getCenterBody());
  // cb = center in straight body coords
  var cb = straight.getBody().worldToBody(cw);
  // pb = point of impact on circle in straight body coords
  // if not penetrating, pb = point on circle closest to straight edge
  // if penetrating, pb = point on circle furthest penetrating
  var pb = straight.pointOffset(cb, -circle.getRadius());
  // pw = point of impact in world coords
  var pw = straight.getBody().bodyToWorld(pb);
  var dist = straight.distanceToLine(pb);
  // negative distance means:  the CircularEdge is currently penetrating StraightEdge
  if (dist > 0) {
    if (dist > straight.getBody().getDistanceTol()) {
      return;
    }
    // possible contact.  Is the point 'next to' the straight edge, or past it?
    var dist2 = straight.distanceToPoint(pb);
    if (dist2 == Util.POSITIVE_INFINITY) { // center is not 'next to' the edge
      return;
    }
    goog.asserts.assert( Math.abs(dist - dist2) < 1e-8 );
    // pw must be within the arc
    if (!circle.isWithinArc2(pw)) {
      // In this case, the vertex on the arc is nearest point
      // and the separate vertex/edge test will find that collision
      return;
    }
    // Find the impact point on the straight edge.
    // For some reason, this results in stable circle/edge contact,
    // whereas using point on circle is not as stable.
    pb = straight.projectionOntoLine(cb);
    pw = straight.getBody().bodyToWorld(pb);
    CircleStraight.addCollision(/*contact=*/true, collisions, straight, circle,
        dist, pw, pb, time);
    return;
  }

  // pb0 = previous (old) impact point, in straight body coords
  var pb0;
  {
    var circleBody = circle.getBody();
    var straightBody = straight.getBody();
    var circleOldCoords = circleBody.getOldCoords();
    var straightOldCoords = straightBody.getOldCoords();
    // either both should be null or both should be non-null
    if (circleOldCoords == null || straightOldCoords == null) {
      if (straightOldCoords != null || circleOldCoords != null) {
        throw new Error('problem with old copy in CircleStraight');
      }
      return;
    }
    // find the equivalent point on the old body
    // cw0 = previous (old) ball's center in world coords;
    var cw0 = circleOldCoords.bodyToWorld(circle.getCenterBody());
    // cb0 = previous (old) ball's center in old straight body coords
    var cb0 = straightOldCoords.worldToBody(cw0);
    // BUG?  not totally sure about this:
    // use current normal to offset pb0, should use old normal?
    // Probably OK, because the Edge does NOT change in body coords, only the
    // body position & angle changes.  So if we know what the old position was
    // in body coords, then this should do the right thing.
    // Put another way:
    // the normal of the Edge does not change over time in body coordinates.
    // pb0 = previous (old) impact point, in straight body coords
    pb0 = straight.pointOffset(cb0, -circle.getRadius());

    // This next section checks the endpoints of the arc.
    // (?? seems like an excessive amount of work)
    // pw0 = previous (old) impact point in world coords
    var pw0 = straightOldCoords.bodyToWorld(pb0);
    // pcb0 = previous (old) impact point in circle body old coords
    var pcb0 = circleOldCoords.worldToBody(pw0);
    // if pb0 is not within the arc (on body_old), change pb0 to be the
    // nearest corner of body_old circle.
    // ???  OR JUST REJECT THIS COLLISION IF PCB0 IS NOT IN ARC OF CIRCLE?
    pcb0 = circle.nearestPointByAngle(pcb0);
    // NOTE:  we could avoid the following conversions if nearestPointByAngle returned
    // a boolean indicating whether it had changed the point.
    pw0 = circleOldCoords.bodyToWorld(pcb0);
    pb0 = straightOldCoords.worldToBody(pw0);
  }
  // distance should have been positive in the old position, relative to straight edge
  // if distance was negative, then it started out on wrong side of straight edge,
  // so no collision
  var dist0 = straight.distanceToLine(pb0);
  if (dist0 < 0) {
    return;
  }
  // pw must be within the arc  (delay this expensive as late as possible!)
  if (!circle.isWithinArc2(pw)) {
    // In this case, the vertex on the arc is nearest point
    // and the separate vertex/edge test will find that collision
    return;
  }
  // This is an approximation of the intersection point!  Assumes straight line motion.
  var r = straight.intersection(pb, pb0);
  if (r == null) {
    return;
  }
  if (0 == 1 && goog.DEBUG && UtilEngine.debugEngine2D != null) {
    // add a visible dot
    var t = straight.getBody().bodyToWorld(r[0]);
    UtilEngine.debugEngine2D.debugCircle('dot', t, 0.08);
  }
  CircleStraight.addCollision(/*contact=*/false, collisions, straight, circle, dist,
       pw, pb, time);
};

/**
* @param {boolean} contact whether to make a contact (true) or collision (false)
* @param {!Array<!RigidBodyCollision>} collisions
* @param {!myphysicslab.lab.engine2D.StraightEdge} straight
* @param {!myphysicslab.lab.engine2D.CircularEdge} circle
* @param {number} dist
* @param {!Vector} pw
* @param {!Vector} pb
* @param {number} time current simulation time
* @private
*/
CircleStraight.addCollision = function(contact, collisions, straight, circle, dist,
     pw, pb, time) {
  var rbc = new EdgeEdgeCollision(circle, straight);
  goog.asserts.assert( circle.outsideIsOut() );
  rbc.ballNormal = false;
  rbc.ballObject = true;
  rbc.radius1 = circle.getRadius();
  rbc.radius2 = Util.POSITIVE_INFINITY;
  goog.asserts.assert( rbc.radius1 > 0 );  // only convex circles here.
  if (contact) {
    // add the gap distance to the radius, for better accuracy in contact
    // force calculation (improves stability of contact distance)
    rbc.radius1 += dist;
  }
  rbc.distance = dist;
  rbc.impact1 = pw;
  rbc.creator = goog.DEBUG ? 'CircleStraight' : '';
  rbc.normal = straight.getBody().rotateBodyToWorld(straight.getNormalBody(pb));
  rbc.setDetectedTime(time);
  UtilityCollision.addCollision(collisions, rbc);
};

}); // goog.scope
