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

goog.provide('myphysicslab.lab.engine2D.CircleCircle');

goog.require('myphysicslab.lab.engine2D.Edge');
goog.require('myphysicslab.lab.engine2D.AbstractEdge');
goog.require('myphysicslab.lab.engine2D.EdgeEdgeCollision');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.StraightEdge');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.engine2D.UtilityCollision');
goog.require('myphysicslab.lab.engine2D.Vertex');
goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var ConcreteVertex = myphysicslab.lab.engine2D.ConcreteVertex;
var AbstractEdge = myphysicslab.lab.engine2D.AbstractEdge;
var EdgeEdgeCollision = myphysicslab.lab.engine2D.EdgeEdgeCollision;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var NF7 = myphysicslab.lab.util.UtilityCore.NF7;
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var StraightEdge = myphysicslab.lab.engine2D.StraightEdge;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
var UtilityCollision = myphysicslab.lab.engine2D.UtilityCollision;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;
var Vertex = myphysicslab.lab.engine2D.Vertex;

/**  Provides static functions for handling interactions between two
{@link myphysicslab.lab.engine2D.CircularEdge CircularEdges}.

@constructor
@final
@struct
@private
*/
myphysicslab.lab.engine2D.CircleCircle = function() {
  throw new Error();
};

var CircleCircle = myphysicslab.lab.engine2D.CircleCircle;

/** Updates the EdgeEdgeCollision to have more accurate information based on current
* positions and velocities of the RigidBodys.
* @param {!myphysicslab.lab.engine2D.EdgeEdgeCollision} rbc the collision to update
* @param {!myphysicslab.lab.engine2D.CircularEdge} other
* @param {!myphysicslab.lab.engine2D.CircularEdge} normalCircle
*/
CircleCircle.improveAccuracy = function(rbc, other, normalCircle) {
  var otherBody = other.getBody();
  var normalBody = normalCircle.getBody();
  goog.asserts.assert( rbc.getPrimaryBody() == otherBody);
  goog.asserts.assert( rbc.getNormalBody() == normalBody);
  var oldX = rbc.impact1.getX();
  var oldY = rbc.impact1.getY();
  if (0 == 1 && goog.DEBUG) console.log('before improveAccuracy '+rbc);
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
    throw new Error();
  }
  if (0 == 1 && rbc.distance > 0) {
    console.log('cnw '+cnw);
    console.log('cow '+cow);
    console.log('cob '+cob);
    console.log('coe '+coe);
    console.log('len '+len);
    console.log('other circle '+other);
    console.log('normal circle '+normalCircle);
    throw new Error(goog.DEBUG ? ('distance should be negative '+rbc) : '');
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
  rbc.r1 = rbc.impact1.subtract(otherBody.getPosition());
  rbc.r2 = rbc.impact1.subtract(normalBody.getPosition());
  // radius should not change;
  //rbc.radius1 = other.getRadius();
  //rbc.radius2 = normalCircle.getRadius();
  rbc.u1 = cow.subtract(otherBody.getPosition());
  rbc.u2 = cnw.subtract(normalBody.getPosition());
  if (0 == 1 && goog.DEBUG) {
    console.log('CircleCircle.improveAccuracy '
      +NF7(oldX)+' '
      +NF7(oldY)+' -> '
      +NF7(rbc.impact1.getX())+' '
      +NF7(rbc.impact1.getY())+' '
      );
  }
  if (0 == 1 && goog.DEBUG) console.log('after improveAccuracy '+rbc);
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

* @param {!Array<!myphysicslab.lab.engine2D.RigidBodyCollision>} collisions any new
*    collision will be added to this array
* @param {!myphysicslab.lab.engine2D.CircularEdge} self
* @param {!myphysicslab.lab.engine2D.CircularEdge} other
* @param {number} time current simulation time
*/
CircleCircle.testCollision = function(collisions, self, other, time) {
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
        distance, len, coe, cow, csw, time);
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
      distance, len, coe, cow, csw, time);
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
        distance, len, cne, cnw, cuw, time);
      return;
    }
    // if penetration is greater than convex object's max depth, then no collision.
    if (distance < -convex.depthOfArc())
      return;
    CircleCircle.addCollision(/*contact=*/false, collisions, concave, convex,
      distance, len, cne, cnw, cuw, time);
  }
};

/**
* @param {boolean} contact  whether to make a contact (true) or collision (false)
* @param {!Array<!myphysicslab.lab.engine2D.RigidBodyCollision>} collisions
* @param {!myphysicslab.lab.engine2D.CircularEdge} self
* @param {!myphysicslab.lab.engine2D.CircularEdge} other
* @param {number} distance
* @param {number} len
* @param {!myphysicslab.lab.util.Vector} coe
* @param {!myphysicslab.lab.util.Vector} cow
* @param {!myphysicslab.lab.util.Vector} csw
* @param {number} time current simulation time
* @private
*/
CircleCircle.addCollision = function(contact, collisions, self, other, distance, len, coe, cow, csw, time) {
  var rbc = new EdgeEdgeCollision(other, self);
  rbc.distance = distance;
  rbc.ballNormal = true;
  rbc.ballObject = true;
  rbc.creator = goog.DEBUG ? 'CircleCircle' : '';
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
  rbc.r1 = rbc.impact1.subtract(other.getBody().getPosition());
  rbc.r2 = rbc.impact1.subtract(self.getBody().getPosition());
  rbc.radius1 = (other.outsideIsOut() ? 1 : -1)*other.getRadius();
  rbc.radius2 = (self.outsideIsOut() ? 1 : -1)*self.getRadius();
  // Add half of the gap distance to each radius, for better accuracy in contact
  // force calculation (improves stability of contact distance)
  // (concave radius gets slightly smaller, convex radius gets slightly bigger)
  if (contact) {
    rbc.radius1 += distance/2;
    rbc.radius2 += distance/2;
  }
  rbc.u1 = cow.subtract(other.getBody().getPosition());
  rbc.u2 = csw.subtract(self.getBody().getPosition());
  rbc.normalVelocity = rbc.calcNormalVelocity();
  rbc.setDetectedTime(time);
  UtilityCollision.addCollision(collisions, rbc);
};

}); // goog.scope
