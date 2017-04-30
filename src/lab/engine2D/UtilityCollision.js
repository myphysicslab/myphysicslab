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

goog.provide('myphysicslab.lab.engine2D.UtilityCollision');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.engine2D.CornerEdgeCollision');
goog.require('myphysicslab.lab.engine2D.Edge');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.engine2D.Vertex');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var CornerEdgeCollision = myphysicslab.lab.engine2D.CornerEdgeCollision;
var Edge = myphysicslab.lab.engine2D.Edge;
var NF5 = myphysicslab.lab.util.Util.NF5;
var NFSCI = myphysicslab.lab.util.Util.NFSCI;
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
var Util = myphysicslab.lab.util.Util;
var Vector = myphysicslab.lab.util.Vector;
var Vertex = myphysicslab.lab.engine2D.Vertex;

/** Provides utility methods for calculating collision information.

@constructor
@final
@struct
@private
*/
myphysicslab.lab.engine2D.UtilityCollision = function() {
  throw new Error();
};

var UtilityCollision = myphysicslab.lab.engine2D.UtilityCollision;

// track frequency of various events for performance tuning
/** number of times that an edge-edge collision test occurred
* @type {number}
* @package
*/
UtilityCollision.edgeEdgeCollisionTests = 0;

/** Number of times that special normal was requested when it was already calculated.
* @type {number}
* @package
*/
UtilityCollision.specialNormalHits = 0;

/** Number of times that special normal was requested when it was not yet calculated.
* @type {number}
* @package
*/
UtilityCollision.specialNormalMisses = 0;

/** Number of times the `specialNormal` was rotated to world coords.
* @type {number}
* @package
*/
UtilityCollision.specialNormalRotate = 0;

/** number of times that `testCollisionVertex` was called.
* @type {number}
* @package
*/
UtilityCollision.vertexBodyCollisionTests = 0;

/** true means don't generate contacts from midpoint Vertexes.
* @type {boolean}
* @const
* @private
*/
UtilityCollision.DISABLE_MIDPOINT_VERTEX_CONTACT = true;

/** disables all edge/edge contacts and collisions.
* @type {boolean}
* @const
* @package
*/
UtilityCollision.DISABLE_EDGE_EDGE = false;

/** highlight edges and Vertexes being tested for collisions or contacts
* @type {boolean}
* @const
* @package
*/
UtilityCollision.HIGHLIGHT_COLLISION_TESTING = false;

/** Adds the given collision only if it there is not already a deeper collision
between the same bodies and same edges very close by. This helps prevent having
duplicate collisions (or contacts), which helps the process of solving for contact
forces or collision impulses with ComputeForces.

When a vertex collides into an edge, we need to see if there is a more accurate
edge/edge collision to be used instead of the vertex/edge collision. For endpoint
Vertexes, this involves testing both edges on either side of the vertex.

One way to look at this addCollision function is that you are defining an equality
test between collisions, along with an ordering. A pair of collisions have to be
approximately equal, and then we take the better of the two. If this were transitive,
then you needn't worry about the case of 3 nearly equal collisions. Because you add
collisions one at a time, you would always have only one of the 3 in the list at any
time.

But collisions aren't really transitive because of the nearness criteria. Suppose
there are 3 collisions, A, B, and C. A is near B, and B is near C. But A is not be
'near' C. As an example, suppose there are two 'decorated' midpoint Vertexes, A and C,
on a curved edge. Suppose the distance between A and C is 0.11 and the nearness
criteria is 0.1. So they are considered not near and both are added to the list. Now
we add B, the edge/edge collision between A and C. It is near both A and C. To ensure
that both A and C are removed, we need to go thru the entire list, allowing B to kick
out every collision it is near to.

Even if the collision we are adding is rejected, we should still go thru the
entire list. In the above example, again suppose that A and C are on the list but not
near each other. But this time, A is the deepest collision, followed by B, with C
being the shallowest. So `A > B > C` (where > means 'deeper'). We try to add B, but
because `A > B`, we reject B. If we stop there, then C will still be on the list. If we
continue, we find that `B > C` and also reject C. If we don't go thru the entire list
this way, then the ordering of the list determines the final result: in one ordering
of the list, C survives in another ordering it is rejected.

Therefore, we always go thru the entire list, even when the collision we are
considering has been shown to be shallower than a nearby collision. (Although this is
probably very rare, and not devastating if it slipped through).

Joints are a special case, they should always be added, never removed.

@param {!Array<!RigidBodyCollision>} collisions the list of
    collisions, to search and possibly add to
@param {!RigidBodyCollision} c2 the RigidBodyCollision to
    possibly add to the list
@return {boolean} true if the collision was added
@package
*/
UtilityCollision.addCollision = function(collisions, c2) {
  if (c2==null) {
    throw new Error();
  }
  var removeMe = new Array();
  var better = null; // it is a RigidBodyCollision
  var shouldAdd = true;
  if (!c2.joint) {
    if (!isFinite(c2.distance)) {
      throw new Error('distance is NaN '+c2);
    }
    goog.array.forEach(collisions, function(c1) {
      if (!c2.similarTo(c1)) {
        return;
      }
      // Prevent adding a “static” collision which has worse info about expected
      // collision time when there is a “dynamic” collision that was found to be
      // penetrating the object in the future.
      // A typical case is to have a penetrating collision, and then after
      // backup we find similar collision 'statically' before penetration.
      // The first one has better estimate of velocity, so prefer that one.
      var time1 = c1.getDetectedTime();
      var time2 = c2.getDetectedTime();
      goog.asserts.assert(isFinite(time1));
      goog.asserts.assert(isFinite(time2));
      if (time1 > time2 + 1e-14) {
        // Prefer the collision that was detected later
        shouldAdd = false;
        better = c1;
        return;
      } else if (time2 > time1 + 1e-14) {
        // Prefer the collision that was detected later
        removeMe.push(c1);
      } else {
        // the collisions have same detected time
        // Prefer the deeper of the two collisions, or shallower of two contacts.
        if (c2.distance < c1.distance) {
          removeMe.push(c1);
        } else {
          shouldAdd = false;
          better = c1;
        }
      }
    }); // forEach
  }
  if (removeMe.length > 0) {
    if (1 == 0 && goog.DEBUG) {
      if (removeMe.length > 1)
        console.log('**** removeMe.length='+removeMe.length);
      goog.array.forEach(removeMe, function(c) {
        console.log('---- addCollision removing '+c);
      });
    }
    goog.array.forEach(removeMe, function(obj) {
      goog.array.remove(collisions, obj);
    });
  }
  if (shouldAdd) {
    collisions.push(c2);
    if (1 == 0 && goog.DEBUG && removeMe.length > 0) {
      console.log('++++ addCollision adding '+c2);
    }
  } else {
    if (1 == 0 && goog.DEBUG) {
      console.log("---- addCollision didn't add "+c2);
      console.log('++++ addCollision already had '+better);
    }
  }
  return shouldAdd;
};

/** Checks for collision of each vertex of body2 with edges of body1.
@param {!Array<!RigidBodyCollision>} collisions  the list of
    collisions to add to
@param {!myphysicslab.lab.engine2D.Polygon} body1 the Polygon whose edges are checked
@param {!myphysicslab.lab.engine2D.Polygon} body2 the Polygon whose Vertexes are checked
@param {number} time current simulation time
@package
*/
UtilityCollision.checkVertexes = function(collisions, body1, body2, time) {
  // get centroid of body1 in body coords of body2.
  var c = body2.worldToBody(body1.getCentroidWorld());
  var specialNormal = body1.getSpecialNormalWorld();
  if (specialNormal != null) {
    specialNormal = body2.rotateWorldToBody(specialNormal);
    if (goog.DEBUG)
      UtilityCollision.specialNormalRotate++;
  }
  goog.array.forEach(body2.getVertexes_(), function checkVertex1(v2) {
    // skip if body1 doesn't collide with both edges connected to vertex
    if (body1.nonCollideEdge(v2.getEdge1()) && body1.nonCollideEdge(v2.getEdge2())) {
      return;
    }
    // get position of Vertex v2 in body1 coords
    var nowVertex = body1.worldToBody(body2.bodyToWorld(v2.locBody()));
    var oldVertex = nowVertex;
    var travelDistSqr = 0;
    var bodyOld1 = body1.getOldCoords();
    var bodyOld2 = body2.getOldCoords();
    // either both should be null or both should be non-null
    if (bodyOld1 != null && bodyOld2 != null) {
      // get old position of Vertex v2 in old-body1 coords
      oldVertex = bodyOld1.worldToBody(bodyOld2.bodyToWorld(v2.locBody()));
      // We try to avoid computationally expensive sqrt function by working
      // with square of distance.
      travelDistSqr = nowVertex.distanceSquaredTo(oldVertex);
    } else if (bodyOld1 != null || bodyOld2 != null) {
      throw new Error('problem with old copy in checkVertexes');
    }
    // In many/most cases the travel distance is small,
    // so we can avoid computationally expensive sqrt()
    // by substituting 0.1 for travel distance in that case.
    // @todo use a parameter here instead of 0.1, because 'small' depends on sim.
    var travelDist = travelDistSqr > 0.01 ? Math.sqrt(travelDistSqr) : 0.1;
    // Set travelDist = 0 here to turn off the proximity test below; this is
    // useful for devising tests where an object passes thru another object
    // in a single time step; see for example SpeedTest.
    //travelDist = 0;  // Keep for Testing;
    //checkPrint2(v, body2, body1);
    if (specialNormal != null) {
      // @todo: why does this calculation not include travel distance?
      // For special edge (walls) we look only at the normal distance to that edge.
      // ? to do? seems like don't need special max radius, just need a negative
      // normal distance (or less than distance tol) and then you have a collision;
      // for positive normal distance (more than distance tol) can't have collision!
      var dist = v2.locBody().subtract(c).dotProduct(specialNormal);
      var dist2 = body1.getCentroidRadius() + body1.getDistanceTol();
      if (dist > dist2)
        return;
    } else {
      // Proximity test:  The vertex has moved by travelDist in the last time step,
      // as seen from body1 (relative to body coords of body1).
      // body1 is enclosed by a circle of maxRadius about its centroid.
      // If the vertex collided with the a point on periphery of body1,
      // the furthest the vertex can be from the centroid is:
      //    maxRadius + travelDist
      var maxRadius = body1.getCentroidRadius() + body1.getDistanceTol() +  travelDist;
      var maxRadiusSqr = maxRadius * maxRadius;
      var dist = v2.locBody().subtract(c).lengthSquared();
      if (dist > maxRadiusSqr) {
        //console.log('not proximate '+dist+' '+maxRadiusSqr+' '+travelDist);
        return;
      } else {
        //console.log('too close '+dist+' '+maxRadiusSqr+' '+travelDist);
      }
    }
    UtilityCollision.testCollisionVertex(collisions, body1, v2,
        nowVertex, oldVertex, travelDist, time);
  }); // forEach
};

/** Performs a rough proximity test: are the bodies close enough that their proximity
circles overlap? Returns `false` when there can be no intersection between the two
Polygon bounding rectangles. Returns `true` when an intersection between the
two bodies is possible.

Further checks are needed besides this rough check to determine if there really is
intersection of the two bodies. The bounding rectangle can be increased in size by the
`swellage` amount.
@param {!myphysicslab.lab.engine2D.Polygon} body1  the first body to check for
    intersection with
@param {!myphysicslab.lab.engine2D.Polygon} body2  the second body to check for
    intersection with
@param {number} swellage  amount to increase the bounding rectangle sizes
@return {boolean} false if there can be no intersection between the two bodies.
@package
*/
UtilityCollision.intersectionPossible = function(body1, body2, swellage) {
  if (body1.getSpecialNormalWorld() != null) {
    return UtilityCollision.intersectionPossibleSpecial(body1, body2, swellage);
  } else if (body2.getSpecialNormalWorld() != null) {
    return UtilityCollision.intersectionPossibleSpecial(body2, body1, swellage);
  } else {
    // regular proximity test
    var dist = body2.getCentroidWorld()
                  .subtract(body1.getCentroidWorld())
                  .lengthSquared();
    var a = body2.getCentroidRadius() + body1.getCentroidRadius() + swellage;
    return dist < a*a;
  }
}

/** special edge proximity test:  look at only the component of the
distance that is normal to the edge.
@param {!myphysicslab.lab.engine2D.Polygon} poly1  the first body to check for
    intersection with
@param {!myphysicslab.lab.engine2D.Polygon} poly2  the second body to check for
    intersection with
@param {number} swellage  amount to increase the bounding rectangle sizes
@return {boolean} false if there can be no intersection between the two bodies.
@package
*/
UtilityCollision.intersectionPossibleSpecial = function(poly1, poly2, swellage) {
  var specialNormal = poly1.getSpecialNormalWorld();
  if (specialNormal == null)
    throw new Error();
  var dist1 = poly2.getCentroidWorld().subtract(poly1.getCentroidWorld())
                .dotProduct(specialNormal);
  // use the special maximum radius for this test
  var dist2 = poly2.getCentroidRadius() + poly1.getCentroidRadius() + swellage;
  if (goog.DEBUG) {
    UtilityCollision.specialNormalRotate++;
  }
  return dist1 < dist2;
};

/**
@param {!Array<!RigidBodyCollision>} collisions  the list of collisions to add to
@param {!Edge} edge
@param {!Vertex} vertex
@param {!Vector} e_body
@param {!Vector} p_body
@param {number} time current simulation time
@private
*/
UtilityCollision.makeCollision = function(collisions, edge, vertex, e_body, p_body,
     time) {
  var c = new CornerEdgeCollision(vertex, edge);
  var v_edge = vertex.getEdge1();
  if (v_edge == null) {
    throw new Error();
  }
  var primaryBody = v_edge.getBody();
  var normalBody = edge.getBody();
  c.distance = edge.distanceToLine(p_body);
  // How this can happen:  if body2 is a circle, it could be that the old and new
  // corner points are within the square bounding box, but outside of the circle.
  // ERN Feb 21 2011:  I think this is no longer possible, because the edge intersection
  // method must return an actual intersection.
  // ERN May 18 2012: (the above is wrong) this CAN happen when a vertex
  // is in the contact zone but
  // it is moving too quickly to be a contact.
  // MAY 19 2012:  ALLOW POSITIVE OR ZERO DISTANCE COLLISION.
  // See test:  StraightStraightTest.one_block.
  if (1 == 0 && c.distance > 0)
    return;
  // ERN Feb 15 2011:  use the intersection point on the edge instead of the corner
  // e_world = edge intersection point in world coords
  var e_world = normalBody.bodyToWorld(e_body);
  c.impact1 = e_world;
  // n_world = normal in world coords
  var n_world = normalBody.rotateBodyToWorld(edge.getNormalBody(e_body));
  c.normal = n_world;
  c.radius2 = edge.getCurvature(e_body);
  c.ballNormal = isFinite(c.radius2);
  c.creator = goog.DEBUG ? 'testCollisionVertex' : '';
  if (1 == 0 && goog.DEBUG)
    console.log('UtilityCollision.testCollisionVertex '+c);
  c.setDetectedTime(time);
  UtilityCollision.addCollision(collisions, c);
};

/** Prints statistics about number of collisions and contacts of various types that
occurred.
* @return {undefined}
*/
UtilityCollision.printCollisionStatistics = function() {
  var s = '';
  if (UtilityCollision.vertexBodyCollisionTests > 0)
    s += 'vertex/body collisions: ' + UtilityCollision.vertexBodyCollisionTests;
  if (UtilityCollision.edgeEdgeCollisionTests > 0)
    s += ' edge/edge collisions: ' + UtilityCollision.edgeEdgeCollisionTests;
  if (s.length > 0)
    console.log(s);
  if (UtilityCollision.specialNormalRotate > 0)
    console.log(
      'special normal rotate: ' + UtilityCollision.specialNormalRotate
      +' hits '+ UtilityCollision.specialNormalHits
      +' misses '+ UtilityCollision.specialNormalMisses
      );
  UtilityCollision.vertexBodyCollisionTests = 0;
  UtilityCollision.edgeEdgeCollisionTests = 0;
  UtilityCollision.specialNormalRotate = 0;
  UtilityCollision.specialNormalHits = 0;
  UtilityCollision.specialNormalMisses = 0;
};

/** Returns a subset of collisions such that all the collisions in the set are are
connected. Two collisions are connected when they have a common moveable (finite mass)
body. The subset will be such that you can go from one collision to any other
collision via neighboring connected collisions.
@param {!Array<!RigidBodyCollision>} superset the set of
    collisions to examine
@return {!Array<!RigidBodyCollision>} a subset of collisions
    such that all the collisions in the set are connected by moveable bodies
@package
*/
UtilityCollision.subsetCollisions1 = function(superset) {
  var i, len;
  /** @type {!RigidBodyCollision} */
  var c;
  /** @type {!Array<!RigidBodyCollision>} */
  var subset = [];
  if (superset.length == 0)
    return subset;
  subset.push(superset[0]);
  // subsetBods = the moveable bodies in the subset of collisions
  /** @type {!Array<!RigidBody>} */
  var subsetBods = [];
  {
    c = subset[0];
    if (isFinite(c.primaryBody.getMass()))
      subsetBods.push(c.primaryBody);
    if (c.normalBody != null && isFinite(c.normalBody.getMass()))
      subsetBods.push(c.normalBody);
  }
  /** @type {number} */
  var n;
  do {
    n = subset.length;
    for (i=0, len=superset.length; i<len; i++) {
      c = superset[i];
      if (goog.array.contains(subset, c)) {
        // This collision already in the subset
        continue;
      }
      if (goog.array.contains(subsetBods, c.primaryBody)) {
        // This collision involves a body in subsetBods, so add it to the subset
        // and add its other body to subsetBods.
        subset.push(c);
        /** @type {boolean} */
        var moveableNormalBody = isFinite(c.normalBody.getMass());
        if (moveableNormalBody && !goog.array.contains(subsetBods, c.normalBody))
            subsetBods.push(c.normalBody);
        continue;
      }
      if (goog.array.contains(subsetBods, c.normalBody)) {
        // This collision involves a body in subsetBods, so add it to the subset
        // and add its other body to subsetBods.
        subset.push(c);
        /** @type {boolean} */
        var moveableBody = isFinite(c.primaryBody.getMass());
        if (moveableBody && !goog.array.contains(subsetBods, c.primaryBody))
          subsetBods.push(c.primaryBody);
        continue;
      }
    }
  } while (n < subset.length);  // while the subset size is increasing
  if (0 == 1 && goog.DEBUG) {
    console.log('subsetCollisions1:  super='+superset.length
      +' sub='+subset.length+' bods='+subsetBods.length);
    for (i=0, len=subset.length; i<len; i++) {
      console.log('in subset: '+subset[i]);
    }
  }
  return subset;
};

/** Given a set of collisions and a starting collision in that set, returns the subset
of collisions that are connected by joints to the moveable bodies in the starting
collision. The subset will be such that you can go from one collision to any other
collision via neighboring connected collisions.
@param {!Array<!RigidBodyCollision>} superset the set of
    collisions to examine
@param {!RigidBodyCollision} startC  the starting collision
    in the superset
@param {boolean} hybrid  include collisions involving either body in startC
@param {!Array<number>} v array of velocity of each collision
@param {number} minVelocity for hybrid collision handling, only include collisions
    that have more negative velocity than this minimum.
@return {!Array<!RigidBodyCollision>} a subset of collisions
    such that all the collisions in the set are connected via joints to the moveable
    bodies of the starting collision.
@package
*/
UtilityCollision.subsetCollisions2 = function(superset, startC, hybrid, v,
      minVelocity) {
  var i, len;
  /** @type {!RigidBodyCollision} */
  var c;
  if (superset.length == 0)
    return [];
  goog.asserts.assert( goog.array.contains(superset, startC) );
  /** @type {!Array<!RigidBodyCollision>} */
  var subset = [];
  subset.push(startC);
  // subsetBods = the moveable bodies in the subset of collisions
  /** @type {!Array<!RigidBody>} */
  var subsetBods = [];
  if (isFinite(startC.primaryBody.getMass()))
    subsetBods.push(startC.primaryBody);
  if (isFinite(startC.normalBody.getMass()))
    subsetBods.push(startC.normalBody);
  var n;
  if (hybrid) {
    // Add all non-joint non-contact collisions involving either body of startC.
    for (i=0, len=superset.length; i<len; i++) {
      c = superset[i];
      if (goog.array.contains(subset, c)) {
        // This collision already in the subset
        continue;
      }
      if (!c.joint && v[i] < minVelocity) {
        if (c.primaryBody == startC.primaryBody || c.normalBody == startC.normalBody ||
          c.primaryBody == startC.normalBody || c.normalBody == startC.primaryBody)   {
          subset.push(c);
          if (!goog.array.contains(subsetBods, c.primaryBody))
            subsetBods.push(c.primaryBody);
          if (!goog.array.contains(subsetBods, c.normalBody))
            subsetBods.push(c.normalBody);
        }
      }
    }
  }
  //console.log('startC '+startC);
  //UtilEngine.printList('subset', subset);
  //UtilEngine.printList('subsetBods', subsetBods);
  // Add to subset all joint collisions connected to the bodies of subsetBods
  // via other joints.
  do {
    n = subset.length;
    for (i=0, len=superset.length; i<len; i++) {
      c = superset[i];
      if (goog.array.contains(subset, c)) {
        // This collision already in the subset
        continue;
      }
      if (goog.array.contains(subsetBods, c.primaryBody) && c.joint) {
        // This collision is a joint and involves a body in subsetBods,
        // so add it to the subset and add its other body to subsetBods.
        subset.push(c);
        /** @type {boolean} */
        var moveableNormalBody = isFinite(c.normalBody.getMass());
        if (moveableNormalBody && !goog.array.contains(subsetBods, c.normalBody))
            subsetBods.push(c.normalBody);
        continue;
      }
      if (goog.array.contains(subsetBods, c.normalBody) && c.joint) {
        // This collision is a joint and involves a body in subsetBods,
        // so add it to the subset and add its other body to subsetBods.
        subset.push(c);
        /** @type {boolean} */
        var moveableBody = isFinite(c.primaryBody.getMass());
        if (moveableBody && !goog.array.contains(subsetBods, c.primaryBody))
          subsetBods.push(c.primaryBody);
        continue;
      }
    }
  } while (n < subset.length);  // while the subset size is increasing
  if (0 == 1 && goog.DEBUG) {
    console.log('subsetCollisions2:  super='+superset.length
      +' sub='+subset.length+' bods='+subsetBods.length);
    for (i=0, len=subset.length; i<len; i++) {
      console.log('subset '+subset[i]);
    }
  }
  return subset;
};

/** Tests for collision or contact of a Polygon with a Vertex.  If a collision
or contact is found, adds a new {@link RigidBodyCollision} to the list of collisions.

@todo  there may be opportunities to save computing time by calculating
distance squared instead of distance, and selecting the proper distance
from among those that got calculated (instead of recalculating the distance
yet again when making the collision record).

@param {!Array<!RigidBodyCollision>} collisions  the list of collisions to add to
@param {!myphysicslab.lab.engine2D.Polygon} body1 the Polygon whose edges we are
    checking for collisions
@param {!Vertex} vertex2 the Vertex of body2
@param {!Vector} v_body  the current position of vertex2 in body coords of body1
@param {!Vector} v_body_old the position of vertex2 at the last time step in body
    coords of body1, see {@link myphysicslab.lab.engine2D.Polygon#saveOldCoords}
@param {number} travelDist  the distance between v_body and v_body_old
@param {number} time current simulation time
@private
*/
UtilityCollision.testCollisionVertex = function(collisions, body1, vertex2, v_body,
    v_body_old, travelDist, time) {
  if (goog.DEBUG)
    UtilityCollision.vertexBodyCollisionTests++;
  var edge2 = vertex2.getEdge1();
  if (edge2 == null) {
    throw new Error(goog.DEBUG ? 'vertex2 has no edge: '+vertex2 : '');
  }
  // type needed for NTI?
  /** @type {!myphysicslab.lab.engine2D.Polygon} */
  var body2 = edge2.getBody();
  goog.asserts.assertObject(body2);
  // v_body = point of impact in body1's body coords
  // v_body_old = old location of point of impact, at time before the current time
  //              step, in 'old body coords', the body1 coords at that time
  // NOTE: keep in mind that a corner C of polygon A could cross the corner of
  // polygon B and both the new and old positions of C would be outside of B, yet
  // there should have been a collision. This can result in interpenetration of
  // objects, with edges crossing, but corners all outside of the other's object.
  // Proximity check:  both new and old corner out of body1 bounding box, on same side
  var distTol = body1.getDistanceTol();
  if (v_body.getX() < body1.getLeftBody() - distTol
        && v_body_old.getX() < body1.getLeftBody()
    || v_body.getX() > body1.getRightBody()+ distTol
        && v_body_old.getX() > body1.getRightBody()
    || v_body.getY() < body1.getBottomBody()- distTol
        && v_body_old.getY() < body1.getBottomBody()
     || v_body.getY() > body1.getTopBody()+ distTol
        && v_body_old.getY() > body1.getTopBody()  )
  {
    if (1 == 0 && goog.DEBUG) {
       if (isFinite(body1.getMass()))
         console.log('*** proximity fail v_body='+v_body
                            +' v_body_old='+v_body_old+' body1='+body1);
    }
    if (goog.DEBUG && body1.probablyPointInside(v_body)) {
      // sanity check
      throw new Error('probablyPointInside: '+v_body+' '+body1);
    }
    // no possible collision
    return;
  }
  var debugPenetration = false;
  // This loop is to turn on lots of debugging code during a second pass
  // in the rare case that the bodies are intersecting but we found no collision.
  while (true)   {
    if (goog.DEBUG && debugPenetration) {
      console.log('*****  PROBABLY POINT INSIDE v_body='+v_body);
      // show what Vertexes are being tested
      // type cast needed for NTI?
      var p = /** @type {!myphysicslab.lab.engine2D.Polygon} */(body2);
      p.printAll();
      console.log('testCollisionVertex '+body1.getName()+' '+p.getName()
          +' v: '+vertex2.getID());
      console.log('vertex2='+vertex2);
      console.log('v_body='+v_body);
      console.log('v_body_old='+v_body_old);
      console.log('travelDist='+travelDist);
    }
    // edge1 = edge on body1 where we found a collision with vertex2
    var edge1 = /** @type {?Edge} */(null);
    // e1_body = intersection point on edge1 in body1 coords
    var e1_body = /** @type {?Vector} */(null);
    // distance from starting corner position to the edge intersection
    // distance from old corner to intersection pt
    var distance_old = Util.POSITIVE_INFINITY;
    // A corner might pass through multiple edges of an object;
    // we look for the first edge that it passes through.
    goog.array.forEach(body1.getEdges_(), function findEdgePassThru(e1) {
      //checkPrint('test edge ', body2, vertex2, e1, v_body);
      if (goog.DEBUG && debugPenetration) {
        console.log('\n===== test edge '+e1);
      }
      if (body2.nonCollideEdge(e1)) {
        return;  // continue to next edge
      }
      // Proximity test:  The vertex2 has moved by travelDist in the last time step.
      // The edge is enclosed by a circle of maxRadius about its centroid.
      // If the vertex2 collided with the a point on periphery of edge,
      // the furthest the vertex2 can be from the centroid is:
      //    maxRadius + travelDist
      // NOTE:  it is unclear if this is really a win; if it is only avoiding the
      // StraightEdge intersection test, then maybe not a win.
      var maxRadius = e1.getCentroidRadius() + distTol + travelDist;
      var maxRadiusSqr = maxRadius * maxRadius;
      if (e1.getCentroidBody().distanceSquaredTo(v_body) > maxRadiusSqr) {
        if (goog.DEBUG && debugPenetration) {
          console.log('not in range '+body2.getName()+' vertex2='+vertex2.getID()
              +' edge1='+e1.getIndex());
          console.log('v_body='+v_body);
          console.log('maxRadiusSqr='+maxRadiusSqr);
          console.log('e1.centroid_body.distanceSquaredTo(v_body)='
              +e1.getCentroidBody().distanceSquaredTo(v_body));
        }
        //checkPrint('not in range, convex ', body2, vertex2, e, v_body);
        return;  // continue to next edge
      }
      if (UtilityCollision.HIGHLIGHT_COLLISION_TESTING && goog.DEBUG) {
        e1.highlight();
        vertex2.highlight();
      }
      // Find intersection point(s) of the line from v_body_old (old vertex2 position)
      // to v_body (current vertex2 position) with this edge e1.
      // There can be zero, one or two points of intersection in r1_array,
      // (for example, the line of travel of a vertex could pass thru a circle
      // in two points).
      if (goog.DEBUG && debugPenetration) {
        console.log('v_body='+v_body+' e1='+e1);
      }
      var r1_array = e1.intersection(v_body, v_body_old);
      if (r1_array == null) {
        if (goog.DEBUG && debugPenetration) {
          console.log('!!!!! no intersection found  !!!!!');
          console.log('v_body='+v_body+' v_body_old='+v_body_old);
          console.log('v_body.x='+NFSCI(v_body.getX()));
          console.log('v_body_old.x='+NFSCI(v_body_old.getX()));
          console.log('e1='+e1);
        }
        // There is no collision of vertex2 with this edge e1; next check for contact
        //checkPrint('no intersection found', body2, vertex2, e1, v_body);
        // If its a midpoint vertex (not an end point), then ignore it entirely;
        // the edge/edge contact will deal with this contact.
        if (UtilityCollision.DISABLE_MIDPOINT_VERTEX_CONTACT && !vertex2.isEndPoint())
          return;  // continue to next edge
        var c = e1.findVertexContact(vertex2, v_body, distTol);
        if (goog.DEBUG && debugPenetration) {
          console.log('findVertexContact '+c);
        }
        if (c != null) {
          goog.asserts.assert(c != null);
          goog.asserts.assert(c.primaryBody == body2);
          goog.asserts.assert(c.normalBody == body1);
          c.setDetectedTime(time);
          UtilityCollision.addCollision(collisions, c);
        }
        return;  // continue to next edge
      }
      goog.asserts.assert(v_body != v_body_old);
      if (0 == 1 && goog.DEBUG) {
        console.log('r1_array[0]='+r1_array[0]);
      }
      //checkPrint('intersection found', body2, vertex2, e, v_body);
      // A vertex could pass thru several edges, but we want only the first edge
      // that it passed thru.
      // When we find a closer intersection point to the old vertex2 position
      // we choose that edge.
      goog.array.forEach(r1_array, function(r1b) {
        // r1b = intersection point on edge, in body1 coords
        if (goog.DEBUG && debugPenetration && UtilEngine.debugEngine2D != null) {
          var t = body1.bodyToWorld(r1b);
          UtilEngine.debugEngine2D.debugCircle('dot', t, 0.1);
        }
        // @todo  use distance squared instead -- its faster!
        var d = v_body_old.subtract(r1b).length();
        if (goog.DEBUG && debugPenetration) {
          console.log('distance_old='+distance_old+' d='+d);
        }
        if (d < distance_old) {
          distance_old = d;
          e1_body = r1b;
          edge1 = e1;
          if (goog.DEBUG && debugPenetration) {
            console.log('edge1='+edge1);
          }
        }
      }); // forEach in r1_array
    }); // forEach in body1.getEdges_()
    // We have found the edge on body1 that the corner of body2 passed thru.
    if (edge1 != null && e1_body != null) {
      // the type-casting is only needed when NOT using NTI compiler option.
      UtilityCollision.makeCollision(collisions,
          /** @type {!Edge}*/(edge1), vertex2,
          /** @type {!Vector}*/(e1_body), v_body, time);
      break;
    } else {
      if (!goog.DEBUG) {
        break;
      } else {
        // No intersection was found.
        // NOTE: we ignore if there is a 'special edge' on this polygon,
        // because it is then a wall and there are likely edges with zero max radius,
        // so are inactive for collisions, so a vertex can reach the inside by going
        // thru those inactive edges.
        // An example is in PileConfig.makeDoubleVPit where two walls overlap,
        // and a vertex collision would not be detected on one wall, but would be
        // detected on the other wall.  So we need to ignore the 'corner is inside'
        // situation and trust that the other overlapping wall will generate a
        // collision.
        // history: Jan 18 2014:  add back the check for special edge which was
        // removed on May 27 2013.

        // both bodies must be Polygon's, because Scrim doesn't collide with anything
        goog.asserts.assert(body1 instanceof myphysicslab.lab.engine2D.Polygon);
        var noSpecialEdge = body1.getSpecialNormalWorld() == null;

        // note May 9 2016: If you make an EdgeRange or EdgeGroup such that two
        // polygons cannot collide, this Error will still occur when the polygons
        // are overlapping. Use RigidBody.addNonCollide instead in that case.
        // (Alternatively, we could disable all these checks somehow, perhaps
        // with an option setting on ImpulseSim).

        // Check whether the point is inside the polygon.
        var probablyInside = noSpecialEdge && body1.probablyPointInside(v_body);
        // If no penetration, then not finding an intersection is OK, so done.
        if (!probablyInside) {
          break;
        }
        // At end of second pass throw an error
        if (debugPenetration) {
          throw new Error('probablyPointInside: v_body='+v_body
                +'\nvertex2='+vertex2+'\nbody1='+body1+'\nbody2='+body2);
        }
        // There is penetration, but no intersection/collision found -- trouble!
        // Go back thru the above code a second time and print debug info.
        debugPenetration = true;
        console.log('no intersection found;  probablyInside='+probablyInside);
      }
    }
  }
};

}); // goog.scope
