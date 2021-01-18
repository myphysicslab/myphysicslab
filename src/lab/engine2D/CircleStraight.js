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

goog.module('myphysicslab.lab.engine2D.CircleStraight');

const asserts = goog.require('goog.asserts');
const CircularEdge = goog.forwardDeclare('myphysicslab.lab.engine2D.CircularEdge');
const StraightEdge = goog.require('myphysicslab.lab.engine2D.StraightEdge');
const EdgeEdgeCollision = goog.require('myphysicslab.lab.engine2D.EdgeEdgeCollision');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const UtilEngine = goog.require('myphysicslab.lab.engine2D.UtilEngine');
const UtilityCollision = goog.require('myphysicslab.lab.engine2D.UtilityCollision');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Provides static functions for handling interactions between
{@link myphysicslab.lab.engine2D.CircularEdge CircularEdge} and
{@link myphysicslab.lab.engine2D.StraightEdge StraightEdge}.

@todo Perhaps nearestPointByAngle is not needed in testCollision? Instead just reject
the edge-edge collision if not both the new and old impact points are within the arc of
the circle.
*/
class CircleStraight {
/**
@private
*/
constructor() {
  throw '';
};

/** Updates the EdgeEdgeCollision to have more accurate information based on current
positions and velocities of the RigidBodys.
* @param {!EdgeEdgeCollision} rbc
* @param {!CircularEdge} circle
* @param {!StraightEdge} straight
*/
static improveAccuracy(rbc, circle, straight) {
  const circleBody = circle.getBody();
  const straightBody = straight.getBody();
  asserts.assert( rbc.getPrimaryBody() == circleBody);
  asserts.assert( rbc.getNormalBody() == straightBody);
  const oldX = rbc.impact1.getX();
  const oldY = rbc.impact1.getY();
  // The scenario is:  collision between a circle and straight happened,
  // it was detected from one (or more) vertex of the circle edge crossing
  // the straight line.
  // Now we want to find the closest point on the circle edge, instead of the vertex.
  // Find nearest point on circle to edge, and the normal to the straight edge.
  // cw = center in world coords
  const cw = circleBody.bodyToWorld(circle.getCenterBody());
  // cb = center in straight body coords
  const cb = straightBody.worldToBody(cw);
  // confusing:  two different ways of calculating the point of impact
  const pb2 = straight.pointOffset(cb, -circle.getRadius());
  // pb = point of impact in straight body coords
  // Calculate impact point same as testCollision (different for contact)
  let pb;
  if (rbc.contact())
    pb = straight.projectionOntoLine(cb);
  else
    pb = pb2;
  // pw = point of impact in world coords
  const pw = straightBody.bodyToWorld(pb);
  // nb = normal in body coords
  const nb = straight.getNormalBody(pb);
  // nw = normal in world coords
  const nw = straightBody.rotateBodyToWorld(nb);
  //console.log('improveAccuracy '+Util.hypot(rbc.impact1.getX() - pw[0],
  //   rbc.impact1.getY() - pw[1]));
  // always use pb2 here; even for contact, otherwise get zero distance
  rbc.distance = straight.distanceToLine(pb2);
  rbc.impact1 = pw;
  rbc.normal = nw;
  if (0 == 1 && Util.DEBUG) {
    console.log('CircleStraight.improveAccuracy '
      +Util.NF7(oldX)+' '
      +Util.NF7(oldY)+' -> '
      +Util.NF7(rbc.impact1.getX())+' '
      +Util.NF7(rbc.impact1.getY())+' '
      );
  }
};

/** Tests the positions and velocities of the two Edges, and if a collision or contact
* is detected, adds an EdgeEdgeCollision to the given array.
* @param {!Array<!RigidBodyCollision>} collisions any new
*    collision will be added to this array
* @param {!StraightEdge} straight
* @param {!CircularEdge} circle
@param {number} time current simulation time
*/
static testCollision(collisions, straight, circle, time) {
  if (UtilityCollision.DISABLE_EDGE_EDGE)
    return;
  if (!circle.outsideIsOut()) {
    // concave circle edge cannot have collision with straight edge
    return;
  }
  // (Only looking for edge/edge collisions here, not corner collisions.)
  // cw = center of circle in world coords
  const cw = circle.getBody().bodyToWorld(circle.getCenterBody());
  // cb = center in straight body coords
  const cb = straight.getBody().worldToBody(cw);
  // pb = point of impact on circle in straight body coords
  // if not penetrating, pb = point on circle closest to straight edge
  // if penetrating, pb = point on circle furthest penetrating
  const pb = straight.pointOffset(cb, -circle.getRadius());
  // pw = point of impact in world coords
  const pw = straight.getBody().bodyToWorld(pb);
  const dist = straight.distanceToLine(pb);
  // negative distance means:  the CircularEdge is currently penetrating StraightEdge
  if (dist > 0) {
    if (dist > straight.getBody().getDistanceTol()) {
      return;
    }
    // possible contact.  Is the point 'next to' the straight edge, or past it?
    const dist2 = straight.distanceToPoint(pb);
    if (dist2 == Util.POSITIVE_INFINITY) { // center is not 'next to' the edge
      return;
    }
    asserts.assert( Math.abs(dist - dist2) < 1e-8 );
    // pw must be within the arc
    if (!circle.isWithinArc2(pw)) {
      // In this case, the vertex on the arc is nearest point
      // and the separate vertex/edge test will find that collision
      return;
    }
    // Find the impact point on the straight edge.
    // For some reason, this results in stable circle/edge contact,
    // whereas using point on circle is not as stable.
    const pb2 = straight.projectionOntoLine(cb);
    const pw2 = straight.getBody().bodyToWorld(pb2);
    CircleStraight.addCollision(/*contact=*/true, collisions, straight, circle,
        dist, pw2, pb2, time);
    return;
  }

  // pb0 = previous (old) impact point, in straight body coords
  let pb0;
  {
    const circleBody = circle.getBody();
    const straightBody = straight.getBody();
    const circleOldCoords = circleBody.getOldCoords();
    const straightOldCoords = straightBody.getOldCoords();
    // either both should be null or both should be non-null
    if (circleOldCoords == null || straightOldCoords == null) {
      if (straightOldCoords != null || circleOldCoords != null) {
        throw 'problem with old copy in CircleStraight';
      }
      return;
    }
    // find the equivalent point on the old body
    // cw0 = previous (old) ball's center in world coords;
    const cw0 = circleOldCoords.bodyToWorld(circle.getCenterBody());
    // cb0 = previous (old) ball's center in old straight body coords
    const cb0 = straightOldCoords.worldToBody(cw0);
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
    let pw0 = straightOldCoords.bodyToWorld(pb0);
    // pcb0 = previous (old) impact point in circle body old coords
    let pcb0 = circleOldCoords.worldToBody(pw0);
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
  const dist0 = straight.distanceToLine(pb0);
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
  const r = straight.intersection(pb, pb0);
  if (r == null) {
    return;
  }
  if (0 == 1 && Util.DEBUG && UtilEngine.debugEngine2D != null) {
    // add a visible dot
    const t = straight.getBody().bodyToWorld(r[0]);
    UtilEngine.debugEngine2D.debugCircle('dot', t, 0.08);
  }
  CircleStraight.addCollision(/*contact=*/false, collisions, straight, circle, dist,
       pw, pb, time);
};

/**
* @param {boolean} contact whether to make a contact (true) or collision (false)
* @param {!Array<!RigidBodyCollision>} collisions
* @param {!StraightEdge} straight
* @param {!CircularEdge} circle
* @param {number} dist
* @param {!Vector} pw
* @param {!Vector} pb
* @param {number} time current simulation time
* @private
*/
static addCollision(contact, collisions, straight, circle, dist, pw, pb, time) {
  const rbc = new EdgeEdgeCollision(circle, straight);
  asserts.assert( circle.outsideIsOut() );
  rbc.ballNormal = false;
  rbc.ballObject = true;
  rbc.radius1 = circle.getRadius();
  rbc.radius2 = Util.POSITIVE_INFINITY;
  asserts.assert( rbc.radius1 > 0 );  // only convex circles here.
  if (contact) {
    // add the gap distance to the radius, for better accuracy in contact
    // force calculation (improves stability of contact distance)
    rbc.radius1 += dist;
  }
  rbc.distance = dist;
  rbc.impact1 = pw;
  rbc.creator = Util.DEBUG ? 'CircleStraight' : '';
  rbc.normal = straight.getBody().rotateBodyToWorld(straight.getNormalBody(pb));
  rbc.setDetectedTime(time);
  UtilityCollision.addCollision(collisions, rbc);
};

} // end class
exports = CircleStraight;
