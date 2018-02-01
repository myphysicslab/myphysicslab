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

goog.module('myphysicslab.lab.engine2D.Edge');

const Printable = goog.require('myphysicslab.lab.util.Printable');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const Vertex = goog.require('myphysicslab.lab.engine2D.Vertex');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** An Edge of a Polygon has a start and finish Vertex and belongs to a particular
Polygon. Vertex location is defined in body coordinates of the associated Polygon. An
Edge knows which side is outside or inside the Polygon; the method
{@link #getNormalBody} returns a normal vector that points to the outside.

Edges are ordered in a Polygon, see {@link myphysicslab.lab.engine2D.Polygon}. For a
given Edge, the start Vertex must be the same as the finish Vertex of the previous Edge
of the Polygon.

## Terminology

<img src="Edge_Normal_Vector.svg">

A **normal vector** is a perpendicular to an Edge, see
<https://en.wikipedia.org/wiki/Normal_(geometry)>.

A **unit normal** is a normal vector with length 1. Here 'normal vector' usually also
implies that it is a unit normal vector.

* @interface
*/
class Edge extends Printable {

constructor() {
  super();
  /** Whether this Edge is a straight line.
  * @type {boolean}
  */
  this.isStraight;
}

/** Add this Edge to the currently open path of the JavaScript canvas context for
drawing the Edge. The Edge should be drawn in local body coordinates.
@param {!CanvasRenderingContext2D} context the JavaScript canvas context to draw this
    Edge into
*/
addPath(context) {}

/** Returns the maximum distance between this Edge and any chord between Vertexes on
this Edge (including decorated mid-point Vertexes). A chord is the straight line between
two adjacent Vertexes.

Here is a picture of a curved Edge, the chord between two Vertexes, V1,
V2, and the *chord error* is the maximum distance between the chord and curved Edge.

<img src="Edge_Chord_Error.svg">

Note that having more decorated mid-point Vertexes results in a smaller chord error,
because the chords are closer to the curve.

See {@link Vertex} for more about decorated mid-point Vertexes
@return {number} the maximum distance between this Edge and a chord between any Vertexes
    on this Edge
*/
chordError() {}

/** Returns smallest distance between this Edge and the given Edge. Returns `NaN` in
cases where the calculation can't be done. One of the Edges must be curved.
@todo distanceToEdge is not used currently... delete it? or use it in places like
  `CircleStraight.testCollision` and `CircleCircle.testCollision`?
@throws {!Error} if both Edges are StraightEdges.
@param {!Edge} edge the Edge to measure distance to
@return {number} smallest distance between this Edge and the given Edge, or `NaN`
    when the calculation cannot be done
*/
distanceToEdge(edge) {}

/** Returns distance from the given point (in body coordinates) to the extended line
of this Edge, where the extensions continue beyond the endpoints of this Edge.
For a CircularEdge the extended line is taken to be the full circle.
Positive distance means the point is outside of this Edge, negative means inside.
@param {!Vector} p_body the point to find distance from, in body coords
@return {number} distance from the given point to the extended line of this Edge
*/
distanceToLine(p_body) {}

/** Returns signed distance of the given point (in body coordinates) to this Edge along
a line that is normal to this Edge, or infinity if beyond an endpoint of this Edge.
Distance is positive if it is on the side of the line that the normal points towards,
otherwise negative.
@param {!Vector} p_body the point to find distance from, in body coords
@return {number} signed distance from the given point to this Edge (positive if point
    is on side the normal points towards) or infinity if beyond the endpoint of this
    Edge
*/
distanceToPoint(p_body) {}

/** Returns a RigidBodyCollision representing the contact point if the given Vertex is
close to this Edge. Closeness is specified by the given distance tolerance. Note that
this **does not consider velocity tests** for a contact. If the point does not lie along
any normal to this Edge, then it is not close; this occurs when the point is past the
endpoints of this Edge.

If the point is near, then the returned RigidBodyCollision will have the
following information set:

+ `body` is set to the Polygon of the Vertex
+ `normalBody` is set to the Polygon of this Edge
+ impact point is set to the nearest point on this Edge, in world coords
+ distance is set to the distance of Vertex from this Edge; negative distance means
  penetration into this Edge.
+ normal is set to the unit normal vector at the nearest point on this Edge, in world
  coords
+ `r2` is based on current position of this Edge's Polygon

Additionally, if this Edge is curved, the following are also set:
`ballNormal, radius2, u2`.

@param {!Vertex} v the Vertex of interest on other-body
@param {!Vector} p_body the body coordinate position of the Vertex
    in body coords of this Edge's body (normalBody)
@param {number} distTol the distance tolerance; distance to Vertex must be smaller than
    this to be considered close enough.
@return {?RigidBodyCollision} a RigidBodyCollision representing the contact point,
    or `null` if not close enough.
*/
findVertexContact(v, p_body, distTol) {}

/** Clears any cached position information.
@return {undefined}
*/
forgetPosition() {}

/** Returns the Polygon that this Edge belongs to.
@return {!myphysicslab.lab.engine2D.Polygon} the Polygon that this Edge belongs to
*/
getBody() {}

/** Returns the bottom-most position of this Edge, in body coordinates.
@return {number} bottom-most position of this Edge, in body coordinates
*/
getBottomBody() {}

/** Returns center of curvature at the given point on this Edge. See
{@link #getCurvature}.
@param {!Vector} p_body the point on this Edge, in body
    coordinates
@return {?Vector} center of curvature at the given point on this
    Edge in body coordinates, or `null` if this is a straight edge
*/
getCenterOfCurvature(p_body) {}

/** Returns the center of the circle to use for proximity testing, in body coordinates.
A circle centered at this centroid with radius `getCentroidRadius()` should encompass
this Edge. See {@link #getCentroidRadius} and {@link #getCentroidWorld}.
@return {!Vector} the center of the circle to use for proximity
    testing, in body coordinates
*/
getCentroidBody() {}

/** Returns the radius of the circle to use for proximity testing. A circle centered at
`getCentroidWorld()` with this radius should encompass this Edge. See
{@link #setCentroidRadius}, {@link #getCentroidRadius} and {@link #getCentroidWorld}.
@return {number} the radius of the circle to use for proximity testing
*/
getCentroidRadius() {}

/** Returns the center of the circle to use for proximity testing, in world coordinates.
A circle centered at this point with radius `getCentroidRadius()` should encompass
this Edge. See {@link #getCentroidRadius} and {@link #getCentroidBody}.
@return {!Vector} the center of the circle to use for proximity
    testing, in world coordinates
*/
getCentroidWorld() {}

/** Returns radius of curvature at the given point on this Edge. Radius of curvature
is the radius of a circle that would give equivalent curvature at a given point on an
Edge. Negative curvature means the Edge is concave at that point.

For a circle, every point on the circle has the same center and radius of curvature. But
for any other curve (an oval for instance), each point on the edge can have a different
center and radius of curvature.
@param {!Vector} p_body the point on this Edge, in body
    coordinates
@return {number}  the radius of curvature; negative means concave; returns positive
    infinity if this is a straight edge
@throws {!Error} if the point is not close to this Edge
*/
getCurvature(p_body) {}

/** Returns the index of this Edge in the Polygon's list of Edges
@return {number} the index of this Edge in the Polygon's list of Edges.
*/
getIndex() {}

/** Returns the left-most position of this Edge, in body coordinates.
@return {number} left-most position of this Edge, in body coordinates
*/
getLeftBody() {}

/** Returns unit normal vector in body coordinates, at the given body coordinates point.
Normal points outwards from the Polygon.
@todo what if the point is not on this Edge?
@param {!Vector} p_body the point on this Edge in body
    coordinates
@return {!Vector} the outwards pointing unit normal vector
    at the given point, in body coordinates
*/
getNormalBody(p_body) {}

/** Finds the nearest point on this Edge to the given point, returns that nearest point
and the unit normal vector there. Returns `null` if the given point lies beyond the end
point of this Edge, meaning that there is no perpendicular line to this Edge passing
thru the given point.
@param {!Vector} p_body a point near this Edge, in body
    coordinates
@return {?Array<!Vector>} a pair of Vectors: the nearest point
    on this Edge, and the unit normal vector at that point both in body coords; or
    `null` if there is no nearest point on this Edge.
*/
getPointOnEdge(p_body) {}

/** Returns the right-most position of this Edge, in body coordinates.
@return {number} right-most position of this Edge, in body coordinates
*/
getRightBody() {}

/** Returns the top-most position of this Edge, in body coordinates.
@return {number} top-most position of this Edge, in body coordinates
*/
getTopBody() {}

/** The start Vertex of this Edge. Should match the finish Vertex of the previous
Edge in the Polygon. See {@link myphysicslab.lab.engine2D.Polygon}.
@return {!Vertex} the start Vertex of this Edge
*/
getVertex1() {}

/** The finish Vertex of this Edge. Should match the start Vertex of the next
Edge in the Polygon. See {@link myphysicslab.lab.engine2D.Polygon}.
@return {!Vertex} the finish Vertex of this Edge
*/
getVertex2() {}

/** Returns the set of 'decorated mid-point Vertexes', if any. See
{@link Vertex}.
@return {!Array<!Vertex>} the set of "decorated mid-point
    Vertexes"
*/
getDecoratedVertexes() {}

/** Highlights this Edge, for debugging.
@return {undefined}
*/
highlight() {}

/** Updates the EdgeEdgeCollision to have more accurate information based on current
positions and velocities of the RigidBodys.
@param {!myphysicslab.lab.engine2D.EdgeEdgeCollision} rbc the EdgeEdgeCollision to
    update
@param {!Edge} edge the other Edge involved in the collision
*/
improveAccuracyEdge(rbc, edge) {}

/** Returns points on this Edge intersecting the straight line segment between the two
given points (in body coordinates), or `null` if there is no intersection. There can be
more than one point of intersection.
@param {!Vector} p1_body  point 1 in body coords
@param {!Vector} p2_body  point 2 in body coords
@return {?Array<!Vector>} array of intersection points, in body
    coords, or `null` if no intersection.
*/
intersection(p1_body, p2_body) {}

/** Rough proximity test that returns `true` if an intersection is possible between this
Edge and the specified Edge. This is intended to do a quick rough test to eliminate
obvious cases where no intersection is possible. `Swellage` is a fudge factor which is
added to the max radius of the Edges, to make the test easier to succeed.
@param {!Edge} edge the other Edge
@param {number} swellage a fudge factor which is added to the max radius of the Edges
@return {boolean} whether an intersection between the Edges is possible
*/
intersectionPossible(edge, swellage) {}

/** Returns the maximum distance from the given point (in body coordinates) to any
point on this Edge.

@param {!Vector} p_body  a point in body coordinates
@return {number}  the maximum distance from the given point (in body coordinates) to any
    point on this Edge
*/
maxDistanceTo(p_body) {}

/** Returns the point offset in the direction of this Edge's normal. The normal is
taken at the point on this Edge that is closest to the given point. The point is given
and returned in body coordinates. Note that the returned point might be closer to this
Edge when the starting point is on the inside of the Polygon, because the normal
points outwards.
@param {!Vector} p_body the point near this Edge, in body coordinates
@param {number} length the distance to move the point
@return {!Vector} the point offset in the direction of this Edge's normal, in body
    coordinates
*/
pointOffset(p_body, length) {}

/** Sets the radius of the circle to use for proximity testing. A circle
centered at `getCentroidWorld()` with this radius should encompass this Edge.
See {@link #getCentroidRadius}, {@link #getCentroidBody} and {@link #getCentroidWorld}.
@param {number} value the radius of the circle to use for proximity testing
*/
setCentroidRadius(value) {}

/** Sets the finish Vertex of this Edge. Should match the start Vertex of the next Edge
in the Polygon. See {@link myphysicslab.lab.engine2D.Polygon}.
@param {!Vertex} vertex the finish Vertex of this Edge
*/
setVertex2(vertex) {}

/** If there is a collision between this Edge and the given Edge, adds a
RigidBodyCollision to the list. This ignores collisions with Vertexes.
@param {!Array<!RigidBodyCollision>} collisions list of collisions to add to
@param {!Edge} edge the other Edge
@param {number} time current simulation time
*/
testCollisionEdge(collisions, edge, time) {}

} //end class

exports = Edge;
