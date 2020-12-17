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

goog.module('myphysicslab.lab.engine2D.CircleCircle');

const EdgeEdgeCollision = goog.require('myphysicslab.lab.engine2D.EdgeEdgeCollision');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const UtilityCollision = goog.require('myphysicslab.lab.engine2D.UtilityCollision');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/**  Provides static functions for handling interactions between two
{@link myphysicslab.lab.engine2D.CircularEdge CircularEdges}.
*/
class CircleCircle {
/**
@private
*/
constructor() {
  throw '';
};

/** Updates the EdgeEdgeCollision to have more accurate information based on current
* positions and velocities of the RigidBodys.
* @param {!EdgeEdgeCollision} rbc the collision to update
* @param {!myphysicslab.lab.engine2D.CircularEdge} other
* @param {!myphysicslab.lab.engine2D.CircularEdge} normalCircle
*/
static improveAccuracy(rbc, other, normalCircle) {
  var otherBody = other.getBody();
  var normalBody = normalCircle.getBody();
  goog.asserts.assert( rbc.getPrimaryBody() == otherBody);
  goog.asserts.assert( rbc.getNormalBody() == normalBody);
  var oldX = rbc.impact1.getX();
  var oldY = rbc.impact1.getY();
  if (0 == 1 && Util.DEBUG) console.log('before improveAccuracy '+rbc);
  // The scenario is:  collision between two circles happened, it was detected
  // from one (or more?) vertex of the other circle crossing the normalCircle edge.
  // Now we want to find the closest point between the circle edges,
  // instead of the vertex,and the normal at that point.
  // Work with old body positions, because that is when collision impact is resolved.
  if (!normalCircle.outsideIsOut() && !other.outsideIsOut()) {
    // both edges are concave, so there is no possible collision point
    return;
  }
  // ??? does this work when one is concave???
  // cnw = center of normalCircle in world coords
  var cnw = normalBody.bodyToWorld(normalCircle.getCenterBody());
  // cow = center of other in world coords
  var cow = otherBody.bodyToWorld(other.getCenterBody());
  // cob = center of other in normalCircle's body coords
  var cob = normalBody.worldToBody(cow);
  // coe = center of other in normalCircle's edge coords
  var coe = normalCircle.bodyToEdge(cob);
  var len = coe.length();
  // if distance between the center of self circle and center of the other circle is
  // less than sum of the radiuses, then collision.
  // distance between edges.  Negative implies penetration.
  if (normalCircle.outsideIsOut() && other.outsideIsOut()) {
    rbc.distance = len - (normalCircle.getRadius() + other.getRadius());
  } else if (!normalCircle.outsideIsOut() && other.outsideIsOut()) {
    // normalCircle is concave
    rbc.distance = normalCircle.getRadius() - other.getRadius() - len;
  } else if (normalCircle.outsideIsOut() && !other.outsideIsOut()) {
    // other circle is concave
    rbc.distance = other.getRadius() - normalCircle.getRadius() - len;
  } else {
    throw '';
  }
  if (0 == 1 && rbc.distance > 0) {
    console.log('cnw '+cnw);
    console.log('cow '+cow);
    console.log('cob '+cob);
    console.log('coe '+coe);
    console.log('len '+len);
    console.log('other circle '+other);
    console.log('normal circle '+normalCircle);
    throw Util.DEBUG ? ('distance should be negative '+rbc) : '';
  }
  // ne = normal in normalCircle's edge coords
  var ne = coe.multiply(1/len);
  // pw = point of impact in world coords
  var pw = normalCircle.edgeToWorld(ne.multiply(normalCircle.getRadius()));
  rbc.impact1 = pw;
  // fix normal for concave
  if (!normalCircle.outsideIsOut()) {
    ne = ne.multiply(-1);
  }
  // normal in world coords
  rbc.normal = normalBody.rotateBodyToWorld(ne);
  // radius should not change;
  //rbc.radius1 = other.getRadius();
  //rbc.radius2 = normalCircle.getRadius();
  if (0 == 1 && Util.DEBUG) {
    console.log('CircleCircle.improveAccuracy '
      +Util.NF7(oldX)+' '
      +Util.NF7(oldY)+' -> '
      +Util.NF7(rbc.impact1.getX())+' '
      +Util.NF7(rbc.impact1.getY())+' '
      );
  }
  if (0 == 1 && Util.DEBUG) console.log('after improveAccuracy '+rbc);
};

/** Tests the positions and velocities of the two Edges, and if a collision or contact
is detected, adds an EdgeEdgeCollision to the given array.

Note that Circle/Circle collision testing ***does not check old body position*** at all;
it’s only a static check for penetration. However, if we are using *midpoint Vertexes*
on CircularEdge (which is the default), then those Vertexes ***will*** get the old body
position treatment during Vertex/Edge collision testing; this will catch a fast
collision. Then, as the collision binary search gets close in time to the collision,
the circle/circle test will kick in and take over because it has better precision than
the Vertex/Edge testing. However, if we are 'handling imminent collisions' then we are
likely to just handle the Vertex/Edge collision and never reach the more precise
Edge/Edge calculation.

* @param {!Array<!RigidBodyCollision>} collisions any new
*    collision will be added to this array
* @param {!myphysicslab.lab.engine2D.CircularEdge} self
* @param {!myphysicslab.lab.engine2D.CircularEdge} other
* @param {number} time current simulation time
*/
static testCollision(collisions, self, other, time) {
  var distance, len;
  if (UtilityCollision.DISABLE_EDGE_EDGE)
    return;
  if (!self.outsideIsOut() && !other.outsideIsOut()) {
    // both edges are concave, so there is no possible collision point
    return;
  } else if (self.outsideIsOut() && other.outsideIsOut()) { // both edges are convex
    // csw = center of self in world coords
    var csw = self.getBody().bodyToWorld(self.getCenterBody());
    // the center of other arc must be within self arc, and vice versa
    if (!other.isWithinArc2(csw))
      return;
    // cow = center of other in world coords
    var cow = other.getBody().bodyToWorld(other.getCenterBody());
    // cob = center of other in self's body coords
    var cob = self.getBody().worldToBody(cow);
    // coe = center of other in self's edge coords
    var coe = self.bodyToEdge(cob);
    if (!self.isWithinArc(coe))
      return;
    len = coe.length();
    var r1 = other.getRadius();
    var r2 = self.getRadius();
    // if distance between the center of self circle and center of the other circle is
    // less than sum of the radiuses, then collision.
    // distance between edges.  Negative implies penetration.
    distance = len - (r1 + r2);
    if (distance > self.getBody().getDistanceTol())
      return;
    if (distance > 0) {
      CircleCircle.addCollision(/*contact=*/true, collisions, self, other,
        distance, len, coe, time);
      return;
    }
    var maxDepth = other.depthOfArc() > self.depthOfArc() ?
        other.depthOfArc() : self.depthOfArc();
    // ASSUMPTION:  circular concave edges that are interpenetrating more than
    // maxDepth are not really colliding.  Note that this can be wrong for
    // high speed collisions, but mid-point Vertexes on circles catch that
    // case during vertex/edge testing.
    if (distance < -maxDepth)
      return;
    CircleCircle.addCollision(/*contact=*/false, collisions, self, other,
      distance, len, coe, time);
  } else {  // one edge is concave, other edge is convex
    goog.asserts.assert( self.outsideIsOut() != other.outsideIsOut() );
    var convex = self.outsideIsOut() ? self : other;
    var concave = self.outsideIsOut() ? other : self;
    // must have concave radius > convex radius
    if (convex.getRadius() > concave.getRadius()) {
      return;
    }
    // u = concave, n = convex
    // (analogy to convex/convex:  self = concave = u;  other = convex = n)
    // cuw = center of concave in world coords
    var cuw = concave.getBody().bodyToWorld(concave.getCenterBody());
    // the center of concave must be within reflected arc of convex
    if (!convex.isWithinReflectedArc2(cuw))
      return;
    // cnw = center of convex in world coords
    var cnw = convex.getBody().bodyToWorld(convex.getCenterBody());
    // cnb = center of convex in concave body coords
    var cnb = concave.getBody().worldToBody(cnw);
    // cne = center of convex in concave edge coords
    var cne = concave.bodyToEdge(cnb);
    // the center of convex must be within arc of concave
    if (!concave.isWithinArc(cne))
      return;
    len = cne.length();
    // Find distance between curved edges.
    // distance between edges.  Negative implies penetration.
    distance = concave.getRadius() - convex.getRadius() - len;
    if (distance > self.getBody().getDistanceTol())
      return;
    if (distance > 0) {
      CircleCircle.addCollision(/*contact=*/true, collisions, concave, convex,
        distance, len, cne, time);
      return;
    }
    // if penetration is greater than convex object's max depth, then no collision.
    if (distance < -convex.depthOfArc())
      return;
    CircleCircle.addCollision(/*contact=*/false, collisions, concave, convex,
      distance, len, cne, time);
  }
};

/**
* @param {boolean} contact  whether to make a contact (true) or collision (false)
* @param {!Array<!RigidBodyCollision>} collisions
* @param {!myphysicslab.lab.engine2D.CircularEdge} self
* @param {!myphysicslab.lab.engine2D.CircularEdge} other
* @param {number} distance
* @param {number} len
* @param {!Vector} coe
* @param {number} time current simulation time
* @private
*/
static addCollision(contact, collisions, self, other, distance, len, coe, time) {
  var rbc = new EdgeEdgeCollision(other, self);
  rbc.distance = distance;
  rbc.ballNormal = true;
  rbc.ballObject = true;
  rbc.creator = Util.DEBUG ? 'CircleCircle' : '';
  // ne = normal in self's edge coords
  var ne = coe.multiply(1/len);
  // pw = point of impact in world coords
  var pw = self.edgeToWorld(ne.multiply(self.getRadius()));
  rbc.impact1 = pw;
  if (!self.outsideIsOut()) {
    ne = ne.multiply(-1);
  }
  // normal in world coords
  rbc.normal = self.getBody().rotateBodyToWorld(ne);
  rbc.radius1 = (other.outsideIsOut() ? 1 : -1)*other.getRadius();
  rbc.radius2 = (self.outsideIsOut() ? 1 : -1)*self.getRadius();
  // Add half of the gap distance to each radius, for better accuracy in contact
  // force calculation (improves stability of contact distance)
  // (concave radius gets slightly smaller, convex radius gets slightly bigger)
  if (contact) {
    rbc.radius1 += distance/2;
    rbc.radius2 += distance/2;
  }
  rbc.setDetectedTime(time);
  UtilityCollision.addCollision(collisions, rbc);
};

} // end class
exports = CircleCircle;
