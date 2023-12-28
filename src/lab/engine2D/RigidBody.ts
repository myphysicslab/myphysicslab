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

import { Collision } from '../model/Collision.js';
import { LocalCoords } from './LocalCoords.js';
import { MassObject } from '../model/MassObject.js';
import { Printable } from '../util/Util.js';
import { SimObject } from '../model/SimObject.js';
import { Vector } from '../util/Vector.js';
import { Util } from '../util/Util.js';

/** Offsets in the {@link lab/model/VarsList.VarsList | VarsList}
* for a {@link RigidBody}'s variables.
*/
export const enum RB {
  /** horizontal position */
  X_ = 0,
  /** horizontal velocity */
  VX_ = 1,
  /** vertical position */
  Y_ = 2,
  /** vertical velocity */
  VY_ = 3,
  /** angle in radians */
  W_ = 4,
  /** angular velocity in radians/second */
  VW_ = 5,
};

// *****************************  RigidBody  ************************************

/** A 2D rigid body with a specified geometry that can experience collisions and contact
forces. A RigidBody handles the geometry calculations for intersections and
collisions, as well as energy and momentum calculations.

### Non-colliding RigidBodys

There are cases where RigidBodys should not collide with each other. For example, when
there is a Joint between two RigidBodys. See {@link addNonCollide} and
{@link doesNotCollide}

The Polygon class has a way of specifying a subset of Edges which do not collide with
another RigidBody. See
{@link lab/engine2D/Polygon.Polygon.setNonCollideEdge | Polygon.setNonCollideEdge}.

**TO DO**  how is initialize() method used?  It is not private anymore!!!

**TO DO**  getLocalCenterOfMass() should not exist; only used in DisplayShape.

**TO DO** make sure all these methods and fields are really used and useful.

**TO DO** testCollisionVertex and testContactVertex could perhaps be made private
methods of Polygon; do they need to be methods on RigidBody?

*/
export interface RigidBody extends MassObject {

/** Adds to set of RigidBodys that do not collide with this body.
No collisions or contacts are generated between this body and the given bodies.
See {@link doesNotCollide}.
@param bodies array of RigidBodys that should not be collided with
*/
addNonCollide(bodies: RigidBody[]): void;

/** Checks if this RigidBody has a collision or contact with another RigidBody, if so
adds a new RigidBodyCollision to the list of collisions.
@param c  the list of collisions to add to
@param body the RigidBody to check for collisions with
@param time current simulation time
*/
checkCollision(c: RigidBodyCollision[], body: RigidBody, time: number): void;

/** Returns true if this body does not collide with the given body. See
{@link addNonCollide}.
@param body the RigidBody of interest
@return true if this body does not collide with the given body
*/
doesNotCollide(body: RigidBody): boolean;

/** Erases any recently saved local coordinate system.
See {@link saveOldCoords}, {@link getOldCoords}.
*/
eraseOldCoords(): void;

/** Returns the collision distance accuracy, a fraction between zero and one; when the
collision distance is within `accuracy * targetGap` of the target gap distance, then
the collision is considered close enough to handle (apply an impulse).
@return the collision accuracy, a fraction between 0 (exclusive) and 1
(inclusive)
*/
getAccuracy(): number;

/** Returns distance tolerance used to determine if this RigidBody is in contact with
another RigidBody.
@return distance tolerance used to determine if this RigidBody is in contact
    with another RigidBody
*/
getDistanceTol(): number;

/** Returns the list of edges of this body. **WARNING** do not alter this list.
@return the list of edges of this body.
*/
getEdges(): Edge[];

/** Returns the elasticity used when calculating collisions; a value of 1.0 means
perfect elasticity where the kinetic energy after collision is the same as before
(extremely bouncy), while a value of 0 means no elasticity (no bounce). A collision
uses the lesser elasticity value of the two bodies involved.
@return elasticity used when calculating collisions, a number from 0 to 1.
*/
getElasticity(): number;

/** Returns the recently saved local coordinate system. See
* {@link saveOldCoords}.
* @return the recently saved local coordinate system.
*/
getOldCoords(): null|LocalCoords;

/** The normal vector (if any) used in the special edge proximity test. When a special
edge has been specified, that Edge that takes priority for collision handling, as in a
wall object, and this method returns the normal vector to use for special proximity
testing. Otherwise this returns `null` and regular proximity testing is done. A normal
is a unit-length Vector that is perpendicular to an Edge. This maintains a cache to
avoid computational costs.
See [Special Edge for Proximity Testing](../classes/lab_engine2D_Polygon.Polygon.html#md:special-edge-for-proximity-testing)

@return normal vector for special edge, in world
coordinates, or null when there is no special edge
*/
getSpecialNormalWorld(): Vector|null;

/** Returns the name of the specified variable.
For more understandable code, you can use the enum {@link RB}
instead of these index numbers.
@param index  which variable name is desired: 0 = x-position, 1 = x-velocity,
    2 = y-position, 3 = y-velocity, 4 = angle, 5 = angular velocity
@param localized whether to return localized variable name
@return the name of the specified variable for this particular body
*/
getVarName(index: number, localized: boolean): string;

/** Returns the index into the {@link lab/model/VarsList.VarsList | VarsList}
for this RigidBody's first variable (the x-position).
The VarsList contains 6 variables for each RigidBody,
```text
0. x-position,
1. x-velocity,
2. y-position,
3. y-velocity,
4. angle,
5. angular velocity
```
For more understandable code, you can use the enum {@link RB}
instead of these index numbers.
@return the index of the x-position in the VarsList for this body;
    or `-1` if this body is not in the VarsList.
*/
getVarsIndex(): number;

/** Returns velocity tolerance used to determine if this RigidBody is in contact with
another RigidBody.

Velocity tolerance is set on each RigidBody, but we expect it to be the same for all
RigidBodys. ImpulseSim 'owns' the velocity tolerance, it is merely passed along to
the RigidBody because it is needed during collision finding and RigidBody has no way
of finding ImpulseSim.

Note however that because Scrim is immutable, it always returns zero for velocity
tolerance. In this case, use the velocity tolerance of the other non-Scrim RigidBody
involved in the collision.

@return velocity tolerance used to determine if this RigidBody is in contact
    with another RigidBody
*/
getVelocityTol(): number;

/** Returns the list of Vertexes of this body, for engine2D package use only.
* @return the list of Vertexes of this body.
*/
getVertexes_(): Vertex[];

/** Whether this RigidBody cannot collide with an Edge or Vertex of another RigidBody.
Returns `true` when passing `null` for the Edge.
@param edge an Edge of another body, or `null`
@return true if this body cannot collide with the given Edge;
    returns true if `edge` is null.
*/
nonCollideEdge(edge: Edge|null): boolean;

/** Prints all edges and Vertexes to console for debugging.
*/
printAll(): void;

/** Returns true if the given body coords point is probably inside this polygon.

**WARNING**  For debugging only.  Does not work for complex (non-convex) shapes.
@param p_body the point in body coords
@return true if the given body coords point is probably inside this polygon
*/
probablyPointInside(p_body: Vector): boolean;

/** Removes from set of RigidBodys that do not collide with this body.
@param bodies array of RigidBodys that
    should be collided with
*/
removeNonCollide(bodies: RigidBody[]): void;

/** Makes an internal copy of the geometry of this RigidBody, which is used
for future collision checking.  This copy is a record of the last location
of this object, so that collision checking can determine how the object moved
over the last time step.  For example, a small object moving at high velocity
can pass through a narrow object in a single time step;  there is then no
interpenetration of the two objects, but if you use the previous position of
the small fast object you can see that it has passed through the narrow object.
See {@link getOldCoords},
{@link eraseOldCoords}.
*/
saveOldCoords(): void;

/** Sets the collision distance accuracy, a fraction between zero and one; when the
* collision distance is within `accuracy * targetGap` of the target gap distance, then
* the collision is considered close enough to handle (apply an impulse).
* @param value how close in distance to be in order to handle a collision
* @throws if value is out of the range 0 to 1, or is exactly zero
*/
setAccuracy(value: number): void;

/** Sets distance tolerance to use to determine if this RigidBody is in contact with
another RigidBody.
@param value distance tolerance to use to determine if this RigidBody is in
  contact with another RigidBody
*/
setDistanceTol(value: number): void;

/** Sets the elasticity used when calculating collisions; a value of 1.0 means perfect
* elasticity where the kinetic energy after collision is the same as before (extremely
* bouncy), while a value of 0 means no elasticity (no bounce). A collision uses the
* lesser elasticity value of the two bodies involved.
* @param value elasticity used when calculating collisions,
*    a number from 0 to 1.
*/
setElasticity(value: number): void;

/** Sets the index into the {@link lab/model/VarsList.VarsList | VarsList}
for this RigidBody's first variable (the x-position).
The VarsList contains 6 variables for each RigidBody,
```text
0. x-position,
1. x-velocity,
2. y-position,
3. y-velocity,
4. angle,
5. angular velocity
```
For more understandable code, you can use the enum {@link RB}
instead of these index numbers.
@param index  the index of the x-position in the VarsList for this RigidBody;
    or `-1` if this RigidBody is not in the VarsList.
*/
setVarsIndex(index: number): void;

/** Sets velocity tolerance to use to determine if this RigidBody is in contact with
another RigidBody
@param value velocity tolerance to use to determine if this RigidBody is in
  contact with another RigidBody
*/
setVelocityTol(value: number): void;

};

// *****************************  Vertex  ************************************

/** A Vertex is a point on an Edge in a RigidBody, in body coordinates of the
RigidBody. A Vertex can be at the end-point of the Edge, or at a mid-point of the Edge.
An end-point Vertex is connected to two Edges which are called the 'previous' and
'next' Edges. A mid-point Vertex is connected to only a single Edge, which is
considered to be both the 'previous' and 'next' Edge in that case.

See {@link RigidBody}, and {@link Edge}.

## Decorated Mid-Point Vertexes

See also the section on [Decorated Vertexes](../Engine2D.html#decoratedvertexes) in the
2D Physics Engine Overview.

We add 'decorated mid-point Vertexes' along a curved edge to help with collision and
contact detection.

<img src="../Engine2D_Decorated_Vertexes.svg">

In collision detection, we look at both the current and previous position of the bodies
to guess how the bodies moved over the last time step. For a potential Vertex/Edge
collision, we assume the Vertex moved along the straight line between its previous and
current position, and look for the intersection of that line with the Edge.

For an Edge/Edge collision, when one of the Edges is curved, it is more difficult to
detect collisions and contacts. For Edge/Edge collision testing we only use the *current
position* of the Edges, instead of looking at how the Edges moved over time. There are
cases where two rapidly moving curved edges can pass entirely thru each other in a
single time step and so the Edge/Edge code will not detect the collision. The solution
is to add Vertexes along the curved Edge, and rely on the regular Vertex/Edge collision
checking.

We refer to these as 'mid-point' or 'decorated' Vertexes to distinguish them from the
'end-point' Vertexes at the end-points of line segments. See {@link isEndPoint}.
The number of decorated Vertexes can be controlled by a spacing parameter when making a
curved Edge.

What typically happens for a collision involving a curved Edge and another Edge is:

1. The mid-point Vertexes indicate there is a collision; the Edge/Edge tests might also
indicate a collision.

2. After backing up and getting close to – but just before – the moment of collision,
the Edge/Edge collision will have the smallest gap among all the detected contacts or
collisions, and will therefore supersede any decorated Vertex/Edge collisions or
contacts. The Edge/Edge collision gives better accuracy.

*/
export interface Vertex extends Printable {

/** Returns the radius of curvature of the Edge at the Vertex's location. If the
Vertex is between two Edges, returns the radius of curvature with smaller absolute
value. Negative curvature means the Edge is concave at that point.
@return radius of curvature of Edge at the Vertex, negative means
concave
*/
getCurvature(): number;

/** Returns the 'previous' Edge that this Vertex is connected to.
@return the 'previous' Edge that this Vertex is
    connected to.
@throws if edge1 not yet set for this Vertex
*/
getEdge1(): Edge;

/** Returns the 'next' Edge that this Vertex is connected to.
@return the 'next' Edge that this Vertex is
    connected to.
@throws if edge2 not yet set for this Vertex
*/
getEdge2(): Edge;

/** Returns an identity number unique for each Vertex, for debugging.
@return an identity number unique for each Vertex, for debugging.
*/
getID(): number;

/** Highlights this Vertex for debugging purposes.
*/
highlight(): void;

/** Returns true if this is a Vertex at the end of an Edge; returns false if this is
a 'decorated mid-point' Vertex.
@return true if this is a Vertex at the end of an Edge; returns false if this
    is a 'decorated mid-point' Vertex.
*/
isEndPoint(): boolean;

/** Returns the location of this Vertex in body coords of its RigidBody.
@return location of this Vertex in body coords of its RigidBody
*/
locBody(): Vector;

/** Returns the horizontal location of this Vertex in body coords of its RigidBody.
@return location of this Vertex in body coords of its RigidBody
*/
locBodyX(): number;

/** Returns the vertical location of this Vertex in body coords of its RigidBody.
@return location of this Vertex in body coords of its RigidBody
*/
locBodyY(): number;

/** Returns the next edge, or null if not yet assigned.
@return edge the next edge, or `null` if not yet
    assigned.
*/
safeGetEdge2(): null|Edge;

/** Sets the 'previous' Edge that this Vertex is connected to.
@param edge the 'previous' Edge that this Vertex is
    connected to.
@throws if this Vertex was already connected to a previous Edge
*/
setEdge1(edge: Edge): void;

/** Sets the 'next' Edge that this Vertex is connected to.
@param edge the 'next' Edge that this Vertex is
    connected to
@throws if this Vertex was already connected to a next Edge
*/
setEdge2(edge: Edge): void;

} // end Vertex interface



// *****************************  Edge  ************************************


/** An Edge of a RigidBody has a start and finish Vertex and belongs to a particular
RigidBody. Vertex location is defined in body coordinates of the associated RigidBody.
An Edge knows which side is outside or inside the RigidBody; the method
{@link getNormalBody} returns a normal vector that points to the outside.

Edges are ordered in a {@link RigidBody}. For a
given Edge, the start Vertex must be the same as the finish Vertex of the previous Edge
of the RigidBody.

## Terminology

<img src="../Edge_Normal_Vector.svg">

A **normal vector** is a perpendicular to an Edge, see
<https://en.wikipedia.org/wiki/Normal_(geometry)>.

A **unit normal** is a normal vector with length 1. Here 'normal vector' usually also
implies that it is a unit normal vector.

*/
export interface Edge extends Printable {

/** Add this Edge to the currently open path of the JavaScript canvas context for
drawing the Edge. The Edge should be drawn in local body coordinates.
@param context the JavaScript canvas context to draw this Edge into
*/
addPath(context: CanvasRenderingContext2D): void;

/** Returns the maximum distance between this Edge and any chord between Vertexes on
this Edge (including decorated mid-point Vertexes). A chord is the straight line between
two adjacent Vertexes.

Here is a picture of a curved Edge, the chord between two Vertexes, V1,
V2, and the *chord error* is the maximum distance between the chord and curved Edge.

<img src="../Edge_Chord_Error.svg">

Note that having more decorated mid-point Vertexes results in a smaller chord error,
because the chords are closer to the curve.

See {@link Vertex} for more about decorated mid-point Vertexes
@return the maximum distance between this Edge and a chord between any Vertexes
    on this Edge
*/
chordError(): number;

/** Returns smallest distance between this Edge and the given Edge. Returns `NaN` in
cases where the calculation can't be done. One of the Edges must be curved.

**TO DO** distanceToEdge is not used currently... delete it? or use it in places like
`CircleStraight.testCollision` and `CircleCircle.testCollision`?
@throws if both Edges are StraightEdges.
@param edge the Edge to measure distance to
@return smallest distance between this Edge and the given Edge, or `NaN`
    when the calculation cannot be done
*/
distanceToEdge(edge: Edge): number;

/** Returns distance from the given point (in body coordinates) to the extended line
of this Edge, where the extensions continue beyond the endpoints of this Edge.
For a CircularEdge the extended line is taken to be the full circle.
Positive distance means the point is outside of this Edge, negative means inside.
@param p_body the point to find distance from, in body coords
@return distance from the given point to the extended line of this Edge
*/
distanceToLine(p_body: Vector): number;

/** Returns signed distance of the given point (in body coordinates) to this Edge along
a line that is normal to this Edge, or infinity if beyond an endpoint of this Edge.
Distance is positive if it is on the side of the line that the normal points towards,
otherwise negative.
@param p_body the point to find distance from, in body coords
@return signed distance from the given point to this Edge (positive if point
    is on side the normal points towards) or infinity if beyond the endpoint of this
    Edge
*/
distanceToPoint(p_body: Vector): number;

/** Returns a RigidBodyCollision representing the contact point if the given Vertex is
close to this Edge. Closeness is specified by the given distance tolerance. Note that
this **does not consider velocity tests** for a contact. If the point does not lie along
any normal to this Edge, then it is not close; this occurs when the point is past the
endpoints of this Edge.

If the point is near, then the returned RigidBodyCollision will have the
following information set:

+ `body` is set to the RigidBody of the Vertex
+ `normalBody` is set to the RigidBody of this Edge
+ impact point is set to the nearest point on this Edge, in world coords
+ distance is set to the distance of Vertex from this Edge; negative distance means
  penetration into this Edge.
+ normal is set to the unit normal vector at the nearest point on this Edge, in world
  coords
+ `r2` is based on current position of this Edge's RigidBody

Additionally, if this Edge is curved, the following are also set:
`ballNormal, radius2, u2`.

@param v the Vertex of interest on other-body
@param p_body the body coordinate position of the Vertex
    in body coords of this Edge's body (normalBody)
@param distTol the distance tolerance; distance to Vertex must be smaller than
    this to be considered close enough.
@return a RigidBodyCollision representing the contact point,
    or `null` if not close enough.
*/
findVertexContact(v: Vertex, p_body: Vector, distTol: number): null|RigidBodyCollision;

/** Clears any cached position information.
*/
forgetPosition(): void;

/** Returns the RigidBody that this Edge belongs to.
@return the RigidBody that this Edge belongs to
*/
getBody(): RigidBody;

/** Returns the bottom-most position of this Edge, in body coordinates.
@return bottom-most position of this Edge, in body coordinates
*/
getBottomBody(): number;

/** Returns the center of the circle to use for proximity testing, in body coordinates.
A circle centered at this centroid with radius `getCentroidRadius()` should encompass
this Edge. See {@link getCentroidRadius} and {@link getCentroidWorld}.
@return the center of the circle to use for proximity
    testing, in body coordinates
*/
getCentroidBody(): Vector;

/** Returns the radius of the circle to use for proximity testing. A circle centered at
`getCentroidWorld()` with this radius should encompass this Edge. See
{@link setCentroidRadius}, {@link getCentroidRadius} and {@link getCentroidWorld}.
@return the radius of the circle to use for proximity testing
*/
getCentroidRadius(): number;

/** Returns the center of the circle to use for proximity testing, in world coordinates.
A circle centered at this point with radius `getCentroidRadius()` should encompass
this Edge. See {@link getCentroidRadius} and {@link getCentroidBody}.
@return the center of the circle to use for proximity testing, in world coordinates
*/
getCentroidWorld(): Vector;

/** Returns radius of curvature at the given point on this Edge. Radius of curvature
is the radius of a circle that would give equivalent curvature at a given point on an
Edge. Negative curvature means the Edge is concave at that point.

For a circle, every point on the circle has the same center and radius of curvature. But
for any other curve (an oval for instance), each point on the edge can have a different
center and radius of curvature.
@param p_body the point on this Edge, in body coordinates
@return the radius of curvature; negative means concave; returns positive
    infinity if this is a straight edge
@throws if the point is not close to this Edge
*/
getCurvature(p_body: Vector): number;

/** Returns the set of 'decorated mid-point Vertexes', if any. See {@link Vertex}.
@return the set of "decorated mid-point Vertexes"
*/
getDecoratedVertexes(): Vertex[];

/** Returns the index of this Edge in the RigidBody's list of Edges
@return the index of this Edge in the RigidBody's list of Edges.
*/
getIndex(): number;

/** Returns the left-most position of this Edge, in body coordinates.
@return left-most position of this Edge, in body coordinates
*/
getLeftBody(): number;

/** Returns unit normal vector in body coordinates, at the given body coordinates
* point. Normal points outwards from the RigidBody.
* **TO DO** what if the point is not on this Edge?
* @param p_body the point on this Edge in body coordinates
* @return the outwards pointing unit normal vector at the given point,
*     in body coordinates
*/
getNormalBody(p_body: Vector): Vector;

/** Finds the nearest point on this Edge to the given point, returns that nearest point
and the unit normal vector there. Returns `null` if the given point lies beyond the end
point of this Edge, meaning that there is no perpendicular line to this Edge passing
thru the given point.
@param p_body a point near this Edge, in body coordinates
@return a pair of Vectors: the nearest point
    on this Edge, and the unit normal vector at that point both in body coords; or
    `null` if there is no nearest point on this Edge.
*/
getPointOnEdge(p_body: Vector): Vector[];

/** Returns the right-most position of this Edge, in body coordinates.
@return right-most position of this Edge, in body coordinates
*/
getRightBody(): number;

/** Returns the top-most position of this Edge, in body coordinates.
@return top-most position of this Edge, in body coordinates
*/
getTopBody(): number;

/** The start Vertex of this Edge. Should match the finish Vertex of the previous
Edge in the RigidBody.
@return the start Vertex of this Edge
*/
getVertex1(): Vertex;

/** The finish Vertex of this Edge. Should match the start Vertex of the next
Edge in the RigidBody.
@return the finish Vertex of this Edge
*/
getVertex2(): Vertex;

/** Highlights this Edge, for debugging.
*/
highlight(): void;

/** Updates the EdgeEdgeCollision to have more accurate information based on current
positions and velocities of the RigidBodys.
@param rbc the EdgeEdgeCollision to update
@param edge the other Edge involved in the collision
*/
improveAccuracyEdge(rbc: RigidBodyCollision, edge: Edge): void;

/** Returns points on this Edge intersecting the straight line segment between the two
given points (in body coordinates), or `null` if there is no intersection. There can be
more than one point of intersection.
@param p1_body  point 1 in body coords
@param p2_body  point 2 in body coords
@return array of intersection points, in body
    coords, or `null` if no intersection.
*/
intersection(p1_body: Vector, p2_body: Vector): Vector[]|null;

/** Rough proximity test that returns `true` if an intersection is possible between this
Edge and the specified Edge. This is intended to do a quick rough test to eliminate
obvious cases where no intersection is possible. `Swellage` is a fudge factor which is
added to the max radius of the Edges, to make the test easier to succeed.
@param edge the other Edge
@param swellage a fudge factor which is added to the max radius of the Edges
@return whether an intersection between the Edges is possible
*/
intersectionPossible(edge: Edge, swellage: number): boolean;

/** Whether this Edge is a straight line.
* @return `true` if this Edge is a straight line
*/
isStraight(): boolean;

/** Returns the maximum distance from the given point (in body coordinates) to any
point on this Edge.

@param p_body  a point in body coordinates
@return the maximum distance from the given point (in body coordinates) to any
    point on this Edge
*/
maxDistanceTo(p_body: Vector): number;

/** Returns the point offset in the direction of this Edge's normal. The normal is
taken at the point on this Edge that is closest to the given point. The point is given
and returned in body coordinates. Note that the returned point might be closer to this
Edge when the starting point is on the inside of the RigidBody, because the normal
points outwards.
@param p_body the point near this Edge, in body coordinates
@param length the distance to move the point
@return the point offset in the direction of this Edge's normal, in body
    coordinates
*/
pointOffset(p_body: Vector, length: number): Vector;

/** Sets the radius of the circle to use for proximity testing. A circle
centered at `getCentroidWorld()` with this radius should encompass this Edge.
See {@link getCentroidRadius}, {@link getCentroidBody} and {@link getCentroidWorld}.
@param value the radius of the circle to use for proximity testing
*/
setCentroidRadius(value: number): void;

/** Sets the finish Vertex of this Edge. Should match the start Vertex of the next Edge
in the RigidBody.
@param vertex the finish Vertex of this Edge
*/
setVertex2(vertex: Vertex): void;

/** If there is a collision between this Edge and the given Edge, adds a
RigidBodyCollision to the list. This ignores collisions with Vertexes.
@param collisions list of collisions to add to
@param edge the other Edge
@param time current simulation time
*/
testCollisionEdge(collisions: RigidBodyCollision[], edge: Edge, time: number): void;

} // end Edge interface

// *****************************  CurvedEdge  ************************************

/** CurvedEdge extends that Edge interface.
*/
export interface CurvedEdge extends Edge {

/** Returns center of curvature of this Edge. For an oval shape, this calculates
the curvature at the given point on the Edge. For a circle or straight line,
the curvature is the same at any point on the Edge.
@param p_body the point on this Edge, in body coordinates (optional)
@return center of curvature at the given point on this Edge in body coordinates
@throws for an oval shape, when `p_body` is undefined
*/
getCenterBody(p_body?: Vector): Vector;

};

// *****************************  Connector  ************************************

/** Connects {@link RigidBody} objects together or to some other object like a
{@link lab/model/NumericalPath.NumericalPath | NumericalPath}
or {@link lab/engine2D/Scrim.Scrim | Scrim};
creates collisions and contacts to maintain the connection.
*/
export interface Connector extends SimObject {

/** Adds RigidBodyCollisions for this Connector to an array of collisions.
@param collisions the array of collisions to which to add the RigidBodyCollision for
    this Connector.
@param time  simulation time when this collision is detected
@param accuracy distance accuracy: how close we must be to the point of
    collision in order to be able to handle it.
*/
addCollision(collisions: RigidBodyCollision[], time: number, accuracy: number): void;

/** Aligns the RigidBodys connected by this Connector. See the documentation for the
particular Connector for how the alignment is done.
*/
align(): void;

/** Returns the first RigidBody of the Connector.
* @return the first RigidBody of the Connector
*/
getBody1(): RigidBody;

/** Returns the second RigidBody of the Connector.
@return the second RigidBody of the Connector
*/
getBody2(): RigidBody;

/** Returns the distance between attachment points of the bodies in the direction of the
normal vector. This is equal to the dot product of the normal vector and the vector
between the two attachment points.
@return normal distance between attachment points of the bodies
*/
getNormalDistance(): number;

/** Returns the position in world coordinates of the attachment point on body1.
@return the position in world coordinates of the
    attachment point on body1
*/
getPosition1(): Vector;

/** Returns the position in world coordinates of the attachment point on body2.
@return the position in world coordinates of the
    attachment point on body2
*/
getPosition2(): Vector;

/** Updates the collision to reflect current state (position, velocity, etc.)
of bodies involved.
@param c  the RigidBodyCollision to update
*/
updateCollision(c: RigidBodyCollision): void;

} // end Connector interface


// *************************  RigidBodyCollision  ********************************

/** RigidBodyCollision holds data related to a collision or resting contact between two
RigidBodys.  The data includes:

+ which RigidBodys are involved,
+ where the collision or contact point is,
+ what is the distance between the RigidBodys (negative means penetration),
+ what is the relative velocity at the collision point,
+ what is the normal vector at the collision point
+ when the collision was detected
+ the estimated time that the collision occurred
+ the force or impulse that is applied

Other data concerns the geometry of the bodies in relation to the collision point –
things like the curvature of the an edge, or distance from center of mass to the
collision point. Some data exists only for certain sub-classes of RigidBodyCollision.

Most of the data in RigidBodyCollision is filled in after it is created, but some data
is updated as the collision handling process proceeds. Many of the fields (properties)
of RigidBodyCollision are 'package private' meaning that any code in the
`myphysicslab.lab.engine2D` package can modify the field directly. This avoids having to
make dozens of getter/setter methods for those fields.

See explanations at [2D Physics Engine Overview](../Engine2D.html).

## Terminology

<img src="../RigidBodyCollision.svg">

The two RigidBodys involved in the collision are referred to as follows:

+ the ***primary body***, has either a Vertex or Edge involved in the collision. For a
Connector like Joint there is a connection point somewhere on the body instead of at a
Vertex or Edge.

+ the ***normal body***, has an Edge which defines the normal vector. For a Connector
like Joint, the normal is defined by the Connector not by an Edge.

The ***normal vector*** is used to find the distance and velocity of the collision. The
distance between the bodies is measured in the direction of the normal vector.

The ***normal relative velocity*** is the velocity between the bodies at the point of
collision, but only in the direction of the normal vector.

The ***R vector*** goes from the center of mass to the ***impact point***, on the
primary body. Similarly, the ***R2 vector*** is on the normal body from its center of
mass to the impact point.

## Distance of Collision

The point of collision, or 'impact point', is where the two bodies are touching or
penetrating. This 'point' is actually two different points, one on the primary body and
one on the normal body. Ideally at the moment of collision these are at the same point
in space, but in practice they are always somewhat apart.

The distance between the two bodies is the distance between the two impact points in the
direction of the normal vector.  Mathematically we can define the distance as follows:
```text
p_a = point of impact on primary body
p_b = point of impact on normal body
n = vector normal to edge at impact point
distance = n . (p_a - p_b)
```
If distance is positive there is a gap between the objects. If distance is negative,
then the objects are interpenetrating.

## Target Gap

When bodies are interpenetrating, the physics engine gets 'stuck'. To prevent this, we
aim to back up in time to a moment just before the collision when the objects are
separated by a small distance called the *target gap*. See
[Seek to Half-Gap Distance](../Engine2D.html#seektohalf-gapdistance) for the full
explanation.

The `Collision.closeEnough` method returns true when the collision distance is close to
the target gap distance, within the tolerance given by
{@link RigidBody.getAccuracy}.

## Collision Handling Notes *TO BE EDITTED*

The following is actually super useful for reading the collision handling code

A colliding contact that might be handled comes in several flavors.
Any contact exists in one of these zones, depending on its distance

```text
0. out of range.
   distanceTol
1. not yet in target accuracy zone.
   targetGap+accuracy
2. in target accuracy zone
   targetGap-accuracy
3. past target accuracy zone but not penetrating
   zero distance
4. penetrating (illegal)

> contact: 1, 2, 3;  small velocity
> isTouching(): 1, 2, 3;  any velocity
>closeEnough(false): 2;  any velocity
> closeEnough(true): 2 or 3;  any velocity
> isColliding() 3 or 4 for large negative velocity;  4 for large positive velocity
> illegalState(): 4  any velocity
```

I also have some diagrams from around May 16, 2016 that makes the above very clear.

## Update State After Backing Up In Time

The collision handling scheme used by
{@link lab/model/CollisionAdvance.CollisionAdvance | CollisionAdvance}
results in backing up in time from the post-collision state to the pre-collision state.
This is done to avoid having RigidBodys being in an ambiguous illegal interpenetrating
state.

A consequence of this is that the RigidBodyCollision we are handling will have its data
from the near-future post-collision state. The method
{@link updateCollision} updates
the RigidBodyCollision to reflect the current pre-collision state after backing up in
time.

The `mustHandle` flag remembers those RigidBodyCollisions that were penetrating in the
post-collision state, before the backup in time occurred. This is needed because those
RigidBodyCollisions might otherwise indicate that they do not need to be handled: they
have negative distance (penetrating) in the post-collision state, but positive distance
(non-penetrating) in the pre-collision state.

## The U Vector

When a RigidBody has a curved edge involved in the collision, the `U` vector is vector
from body's center of mass to center of the circular edge. For the primary body this is
called the `U` vector, for the normal body it is called the `U2` vector.

For curved edges we use the `U` and `U2` vectors instead of the `R` and `R2` vectors.

The `U` and `U2` vectors are used in finding the contact force needed because a smooth
curved edge works differently than a sharp pointed corner. The normal distance (and
therefore normal velocity) between a straight edge and a circle is related to the
movement of the circle's center – rotation of the circle about the center is irrelevant.
This is different to a sharp corner where the movement of the point of the corner is
what is important.

This is relevant for finding contact forces which are applied over time. For an
instantaneous collision impulse this is not important because the bodies immediately
move apart.

See the paper [Curved Edge Physics paper](../CEP_Curved_Edge_Physics.pdf) by Erik
Neumann for modifications to contact forces when curved edges are involved.

<a id="equivalenceofusingroruvector"></a>
## Equivalence of Using R or U Vector For Normal Velocity

Here we show that you get the same result whether using the R or U vector in
{@link getNormalVelocity}.

Suppose you have a circular body striking a horizontal infinite mass floor; let the
circle have an offset center of mass, so that U and R are different.

<img src="../CEP_Equiv_U_R_Vectors.svg">

```text
vab = relative velocity of contact points (vpa, vpb) on bodies
vab = (vpa - vpb)
vpa = va + wa x ra = velocity of contact point
vab = va + wa x ra - vb - wb x rb
// vab.n = (va + wa x ra - vb - wb x rb) . n
// cross product: w x r = (0,0,w) x (rx, ry, 0) = (-w*ry, w*rx, 0)
dx = vax + wa*(-ray) - vbx - wb*(-rby);
dy = vay + wa*(rax) - vby - wb*(rbx);
nv = nx*dx + ny*dy;
but with n = (0, 1) we have
nv = 0*dx + 1*dy = dy
and because body b is infinite mass, we have vbx = vby = wb = 0, so
dy = vay + wa*(rax)
dy = vay + wa*(uax)   // when using U instead of R
```
In the picture, you can see that `rax = uax`, because the normal at the impact
point goes thru the center of the circle, and so both U and R have the same `x`
component. The situation would be the same when the normal is not `(0, 1)`. In the
general case, you are finding the length of R (or U) that is orthogonal to the normal,
and again these are the same for U and R because the normal at the impact point goes
right thru the center of the circle.

**TO DO** guess: the only things really needed are normal and impact point (plus of
course the two bodies). Wait, also things like ballObject, ballNormal.

**TO DO** guess: some things like `r1, r2, u1, u2, radius1, radius2` can all be
calculated; they are only stored in the RBC for convenience to avoid re-calculating.
(would it be better to do that calculating in one place?)

*/
export abstract class RigidBodyCollision implements Collision {
  // the properties that are public were meant to be "package private"
  // meaning only entities in the engine2D directory could access them.
  /** 'primary' object whose corner or edge is colliding */
  primaryBody: RigidBody;
  /**  object corresponding to the normal (its edge defines the normal vector) */
  normalBody: RigidBody;
  /** whether this is a bilateral constraint which can both push and pull */
  joint: boolean;
  // One of the bodies can be a Scrim which has zero distance tolerance, so find the
  // max distance and velocity tolerance of the bodies.
  /** distance tolerance is used to decide when bodies are touching. */
  protected distanceTol_: number;
  /** desired target gap where collision is handled (we try to back up to time when
  * collision distance is this amount). Can be zero for joints.
  */
  private targetGap_: number;
  /** Collision distance accuracy: when the collision distance is within
  * accuracy of the target gap distance, then the collision is close enough to be
  * able to handle it (apply an impulse).
  */
  private accuracy_: number;
  /** velocity tolerance used to determine if an object is in contact with another
  * object. See
  * {@link lab/engine2D/ImpulseSim.ImpulseSim.getVelocityTol | ImpulseSim.getVelocityTol}.
  */
  protected velocityTol_: number;
  /** elasticity of this collision, from 0 to 1. */
  private elasticity_: number;
  /** true = normal is constant */
  normalFixed: boolean;
  /** Indicates this is a collision that needs to be handled */
  private mustHandle_: boolean = false;
  /** true if the 'primary' object's edge is curved */
  ballObject: boolean = false;
  /** true if the normal object's edge is curved */
  ballNormal: boolean = false;
  /** point of impact, in global coords */
  impact1: Vector = Vector.ORIGIN;
  /** second impact point needed for Rope because the impact points are far apart.
  * OPTIONAL point of impact on normalBody, in global coords
  */
  impact2: null|Vector = null;
  /** distance between objects;  negative = penetration */
  distance: number = NaN;
  /** distance between objects when first detected, pre-backup */
  private detectedDistance_: number = NaN;
  /** normal pointing outward from normalObj, in world coords */
  normal: Vector = Vector.NORTH;
  /** derivative of normal vector with respect to time */
  normal_dt: null|Vector = null;
  /** radius of curvature at impact1, for primary body; negative means concave */
  radius1: number = NaN;
  /** radius of curvature at impact1, for normal body; negative means concave */
  radius2: number = NaN;
  /** relative normal velocity at impact point; negative=colliding,
  * positive = separating. Cached value: it is invalid when NaN.
  */
  private normalVelocity_: number = NaN;
  /** normal velocity when collision was detected, pre-backup. */
  private detectedVelocity_: number = NaN;
  /** for debugging, unique code tells where this was generated */
  creator: string = '';
  /** simulation time that collision was detected */
  private detectedTime_: number = NaN;
  /** estimate of time when half-gap distance happens */
  private estimate_: number = NaN;
  /** time corresponding to last update */
  private updateTime_: number = NaN;
  /** amount of impulse applied during collision */
  impulse: number = NaN;
  /** amount of force applied at a contact point */
  force: number = NaN;

/**
@param body the 'primary' body which typically has a Vertex or Edge
    involved in the collision
@param normalBody the 'normal' body which typically has an Edge
    involved in the collision that defines the normal vector for the collision
@param joint whether this is a bilateral constraint which can both
    push and pull.
*/
constructor(body: RigidBody, normalBody: RigidBody, joint: boolean) {
  this.primaryBody = body;
  this.normalBody = normalBody;
  this.joint = joint;
  this.distanceTol_ = Math.max(body.getDistanceTol(), normalBody.getDistanceTol());
  this.targetGap_ = joint ? 0 : this.distanceTol_/2;
  const acc = Math.max(body.getAccuracy(), normalBody.getAccuracy());
  if (acc <= 0 || acc > 1) {
    throw 'accuracy must be between 0 and 1, is '+acc;
  }
  this.accuracy_ = acc * this.distanceTol_/2;
  this.velocityTol_ = Math.max(body.getVelocityTol(), normalBody.getVelocityTol());
  this.elasticity_ = Math.min(body.getElasticity(), normalBody.getElasticity());
  this.normalFixed = false;
};

/** @inheritDoc */
toString() {
  return this.getClassName() + '{distance: '+Util.NF5E(this.distance)
      +', normalVelocity_: '+Util.NF5E(this.normalVelocity_)
      +', body: "'+this.primaryBody.getName()+'"'
      +', normalBody: "'+this.normalBody.getName()+'"'
      +', impact1: '+this.impact1
      +', contact: '+this.contact()
      +', joint: '+this.joint
      +', elasticity_: ' +Util.nf5(this.elasticity_)
      +', targetGap_: '+Util.NF5E(this.targetGap_)
      +', accuracy_: '+Util.NF7(this.accuracy_)
      +', mustHandle_: '+this.mustHandle_
      +', impact2: '+(this.impact2 != null ? this.impact2 : 'null')
      +', normal: '+this.normal
      +', ballObject: '+this.ballObject
      +', ballNormal: '+this.ballNormal
      +', estimate_: '+Util.NF7(this.estimate_)
      +', detectedTime_: '+Util.NF7(this.detectedTime_)
      +', detectedDistance_: '+Util.NF5E(this.detectedDistance_)
      +', detectedVelocity_: '+Util.NF5E(this.detectedVelocity_)
      +', impulse: '+Util.NF5E(this.impulse)
      +', force: '+Util.NF5E(this.force)
      +', updateTime_: '+Util.NF7(this.updateTime_)
      +', creator: '+this.creator
      +'}';
};

/** @inheritDoc */
bilateral(): boolean {
  return this.joint;
};

/** Checks that the fields of this collision are consistent
and obey policy.
*/
checkConsistent(): void {
  Util.assert(isFinite(this.accuracy_));
  Util.assert(isFinite(this.detectedTime_));
  Util.assert(isFinite(this.detectedDistance_));
  Util.assert(isFinite(this.detectedVelocity_));
  Util.assert(isFinite(this.distance));
  Util.assert(isFinite(this.getNormalVelocity()));
  Util.assert(this.primaryBody != null);
  Util.assert(this.normalBody != null);
  Util.assert(isFinite(this.normal.getX()));
  Util.assert(isFinite(this.normal.getY()));
  Util.assert(isFinite(this.impact1.getX()));
  Util.assert(isFinite(this.impact1.getY()));
  Util.assert(Math.abs(this.normal.length() - 1) < 1e-12);
  if (this.ballNormal) {
    // for curved normal, need either radius of curvature or time deriv of normal
    Util.assert(!isNaN(this.radius2) || (this.normal_dt != null));
  }
  // April 16 2014:  this is wrong... we can have a fixed normal on a non-infinite mass
  // body.
  //if (this.normalFixed) {
  //  Util.assert(this.theConnector != null
  //      || !isFinite(this.normalBody.getMass()));
  //}
};

/** @inheritDoc */
closeEnough(allowTiny: boolean): boolean {
  if (this.contact())
    return true;
  if (allowTiny) {
    // 'allowTiny' handles cases where a collision has very small distance, but we
    // cannot backup to a time when distance was near targetGap.
    // This occurs in StraightStraightTest.fast_close_setup().
    if (Util.DEBUG && this.distance > 0
        && this.distance < this.targetGap_ - this.accuracy_) {
      console.log('%cTINY DISTANCE%c '+this, 'background:#f9c', 'color:black',
        'background:#fc6', 'color:black');
    }
    return this.distance > 0
        && this.distance < this.targetGap_ + this.accuracy_;
  } else {
    return this.distance > this.targetGap_ - this.accuracy_
        && this.distance < this.targetGap_ + this.accuracy_;
  }
};

/** @inheritDoc */
contact(): boolean {
  return this.joint || Math.abs(this.getNormalVelocity()) < this.velocityTol_ &&
    this.distance > 0 && this.distance < this.distanceTol_;
};

/** Returns distance to the target 'half gap' distance. We aim to handle a collision
when the distance is 'half gap', which is when this returns zero.
@return distance to the target 'half gap' distance.
*/
distanceToHalfGap(): number {
  return this.distance - this.targetGap_;
};

/** Returns name of class of this object.
* @return name of class of this object.
*/
abstract getClassName(): string;

/** Returns the Connector that generated this collision, or null if this collision
* was not generated by a Connector.
* @return the Connector that generated this collision, or null
*/
getConnector(): null|Connector {
  return null;
};

/** @inheritDoc */
getDetectedTime(): number {
  return this.detectedTime_;
};

/** @inheritDoc */
getDistance(): number {
  return this.distance;
};

/** Returns the elasticity used when calculating collisions; a value of 1.0 means
* perfect elasticity where the kinetic energy after collision is the same as before
* (extremely bouncy), while a value of 0 means no elasticity (no bounce). A collision
* uses the lesser elasticity value of the two bodies involved.
* @return elasticity used when calculating collisions, a number from 0 to 1.
*/
getElasticity(): number {
  return this.elasticity_;
};

/** @inheritDoc */
getEstimatedTime(): number {
  return this.estimate_;
};

/** Returns point of impact on the primary body, in global coords.
* @return point of impact on the primary body, in global coords
*/
getImpact1(): Vector {
  return this.impact1;
};

/** Returns point of impact on normal body, in global coords. For example, this is
* needed for Rope because the impact points are far apart. Often null when only
* {@link Vertex.isEndPoint} is needed.
* @return point of impact on normal body, in global coords, or null
*/
getImpact2(): null|Vector {
  return this.impact2;
};

/** @inheritDoc */
getImpulse(): number {
  return this.impulse;
};

/** The lateral velocity (sideways to normal) between the two bodies at the point of
* contact.
* @return the lateral velocity (sideways to normal) between the two bodies
*    at the point of contact.
*/
getLateralVelocity(): number {
  return this.getPerpNormal().dotProduct(this.getRelativeVelocity());
};

/** Returns the normal body involved in the collision, which defines the normal vector.
* The classic situation is that a vertex on the primary body is colliding into an edge
* on the normal body, but there are many variations on this.
* @return the normal body involved in the collision
*/
getNormalBody(): RigidBody {
  return this.normalBody;
};

/** Returns the relative normal velocity based on current velocity of the
* bodies. Negative velocity means the objects moving towards each other,
* positive velocity means they are moving apart.
* @return relative normal velocity between the two bodies
*    at the point of contact.
*/
getNormalVelocity(): number {
  if (isNaN(this.normalVelocity_)) {
    this.normalVelocity_ = this.normal.dotProduct(this.getRelativeVelocity());
    Util.assert(!isNaN(this.normalVelocity_));
  }
  return this.normalVelocity_;
};

/** Returns vector perpendicular to normal vector. This is tangent to the normal body
* edge.
* @return vector perpendicular to normal vector, in world coords
*/
getPerpNormal(): Vector {
  // the perpendicular vector to normal is:  (-normal.getY(), normal.getX())
  // or (normal.getY(), -normal.getX())
  return new Vector(-this.normal.getY(), this.normal.getX());
};

/** Returns vector from center of mass of primary body to point of impact,
* in world coords.
* @return vector from center of mass of primary body to point of impact,
* in world coords
*/
getR1(): Vector {
  return this.impact1.subtract(this.primaryBody.getPosition());
};

/** Returns vector from center of mass of normal body to point of impact,
* in world coords.  Uses the second impact point if appropriate.
* @return vector from center of mass of normal body to point of impact,
* in world coords
*/
getR2(): Vector {
  const impact = this.impact2 ? this.impact2 : this.impact1;
  return impact.subtract(this.normalBody.getPosition());
};

/** Returns the primary body involved in the collision. The primary body does not
* define the normal.  The classic situation is that a vertex on the primary body is
* colliding into an edge on the normal body, but there are many variations on this.
* @return the primary body involved in the collision
*/
getPrimaryBody(): RigidBody {
  return this.primaryBody;
};

/** Returns the relative acceleration between the two contact points.
* @param change  array of change rates for each variable
* @return the relative acceleration between the two contact points
*/
getAcceleration(change: number[]): Vector {
  const fixedObj = !isFinite(this.primaryBody.getMass());
  const fixedNBody = !isFinite(this.normalBody.getMass());
  const w1 = fixedObj ? 0 : this.primaryBody.getAngularVelocity();
  const w2 = fixedNBody ? 0 : this.normalBody.getAngularVelocity();
  const r1 = this.getU1();
  const r2 = this.getU2();
  const Rx = r1.getX();
  const Ry = r1.getY();
  let R2x = NaN;
  let R2y = NaN;
  if (!fixedNBody) {
    R2x = r2.getX();
    R2y = r2.getY();
  }
  const obj = fixedObj ? -1 : this.primaryBody.getVarsIndex();
  const nobj = fixedNBody ? -1 : this.normalBody.getVarsIndex();
  let accx = 0;
  let accy = 0;
  if (!fixedObj) {
    accx = (change[obj+RB.VX_]
      - change[obj+RB.VW_]*Ry - w1*w1*Rx);
    accy = (change[obj+RB.VY_]
      + change[obj+RB.VW_]*Rx - w1*w1*Ry);
  }
  if (!fixedNBody) {
    accx -= (change[nobj+RB.VX_]
          - change[nobj+RB.VW_]*R2y - w2*w2*R2x);
    accy -= (change[nobj+RB.VY_]
          + change[nobj+RB.VW_]*R2x - w2*w2*R2y);
  }
  return new Vector(accx, accy);
};

/** Returns the difference in velocity of the two impact points of the collision
based on current velocity of the bodies.
```text
let V = velocity of center of mass (CM);
let R = distance vector CM to contact point
let w = angular velocity
w x R = (0, 0, w) x (Rx, Ry, 0) = (-w Ry, w Rx, 0)
velocity of corner = V + w x R = (Vx - w Ry, Vy + w Rx, 0)
relative velocity = Vab = Va + wa x Ra - Vb - wb x Rb
```
For curved edge we use the `U` vector (from center of mass to edge's circle center)
instead of `R` vector (from center of mass to point of impact). Because what matters is
not the motion of the individual point but instead the entire curved edge. Consider that
for a ball with center of mass at center of the circle, rotation doesn't change the
distance at all.

@return the velocity vector of this collision
*/
getRelativeVelocity(): Vector {
  let vax = 0;
  let vay = 0;
  let vbx = 0;
  let vby = 0;
  if (isFinite(this.primaryBody.getMass())) {
    const r1 = this.getU1();
    const rax = r1.getX();
    const ray = r1.getY();
    Util.assert(isFinite(rax) && isFinite(ray), 'not a number: rax, ray');
    const va = this.primaryBody.getVelocity();
    const wa = this.primaryBody.getAngularVelocity();
    vax = va.getX() - wa*ray;
    vay = va.getY() + wa*rax;
  }
  if (isFinite(this.normalBody.getMass())) {
    const r2 = this.getU2();
    const rbx = r2.getX();
    const rby = r2.getY();
    Util.assert(isFinite(rbx) && isFinite(rby), 'not a number: rbx, rby');
    const vb = this.normalBody.getVelocity();
    const wb = this.normalBody.getAngularVelocity();
    vbx = vb.getX() - wb*rby;
    vby = vb.getY() + wb*rbx;
  }
  return new Vector(vax - vbx, vay - vby);
};

/** Returns vector from center of mass of primary body to either point of impact
* or to center of circular edge in world coords.
* @return vector from center of mass of primary body to either point
* of impact or to center of circular edge in world coords
*/
getU1(): Vector {
  return this.getR1();
};

/** Returns vector from center of mass of normal body to either point of impact
* or to center of circular edge in world coords. Uses the second impact point if
* appropriate.
* @return vector from center of mass of normal body to either point
* of impact or to center of circular edge, in world coords
*/
getU2(): Vector {
  return this.getR2();
};

/** @inheritDoc */
getVelocity(): number {
  return this.getNormalVelocity();
};

/** Whether this collision involves the given RigidBody
* @param body the RigidBody of interest
* @return whether collision involves the given RigidBody
*/
hasBody(body: RigidBody): boolean {
  return this.primaryBody == body || this.normalBody == body;
};

/**  Whether this collision involves the given edge.
* If given edge is null, then always returns false.
* @param edge the Edge of interest
* @return whether collision involves the given Edge
*/
abstract hasEdge(edge: null|Edge): boolean;

/** Whether this collision involves the given vertex
* @param v the Vertex of interest
* @return whether collision involves the given Vertex
*/
abstract hasVertex(v: Vertex): boolean;

/** @inheritDoc */
illegalState(): boolean {
  if (this.joint) {
    return false;
  }
  return this.distance < 0;
};

/** @inheritDoc */
isColliding(): boolean {
  if (this.joint) {
    return false; // joints are never colliding
  }
  if (this.distance < 0) {
    return true; // any penetrating contact is colliding
  }
  // fast collision that is smaller than targetGap beyond desired accuracy
  if (this.getNormalVelocity() < -this.velocityTol_
      && this.distance < this.targetGap_ - this.accuracy_) {
    return true;
  }
  return false;
};

/** @inheritDoc */
isTouching(): boolean {
  return this.joint || this.distance < this.distanceTol_;
};

/** @inheritDoc */
needsHandling(): boolean {
  return this.mustHandle_;
};

/** Stores the time when this collision was detected, stores the current distance and
velocity as the detected distance and detected velocity, and estimates when the
collision occurred.
@param time  when this collision is detected
@throws if the detected time has been previously set
*/
setDetectedTime(time: number) {
  if (isFinite(this.detectedTime_)) {
    throw 'detectedTime_ already set '+this;
  }
  this.detectedTime_ = time;
  this.detectedDistance_ = this.distance;
  const nv = this.getNormalVelocity();
  this.detectedVelocity_ = nv;
  this.estimate_ = NaN;
  if (!this.joint) {
    Util.assert(isFinite(this.distance));
    Util.assert(isFinite(nv));
    // if the collision velocity is significant (i.e. not a tiny number or positive)
    if (nv < -0.001) {
      this.estimate_ = time + (this.targetGap_ - this.distance) / nv;
    }
    /*if (Util.DEBUG)
      console.log(Util.NF5(time)+' setDetectedTime '+this.toString());
    */
  }
};

/** @inheritDoc */
setNeedsHandling(needsHandling: boolean): void {
  this.mustHandle_ = needsHandling;
};

/** Returns whether this collision could be the same as another collision. Often there
* are several collisions found at a single location by the various collision detection
* mechanisms, and this is used when deciding which collision of those to keep.
* @param c the other collision
* @return true if the two collisions are possibly the same collision
*/
abstract similarTo(c: RigidBodyCollision): boolean;

/** Updates the information in the collision to reflect current position and velocity of
bodies. Changes the impact point to be the nearest point between the bodies (as long as
this point is reasonably close to the original impact point). Then update the normal, R
vectors, etc.

This is used when handling collisions because the collisions are
found post-collision, but are handled pre-collision.  Therefore, we
need to update the information to correspond to the pre-collision
arrangement of the bodies.

Doing this fixes inaccurate collisions;  for example, a ball that
hits a wall at an angle would wrongly acquire spin if the collision
were not updated to the current pre-collision information.

Assumes that the bodies have been updated for their current location,
by for example
{@link lab/engine2D/RigidBodySim.RigidBodySim.modifyObjects | RigidBodySim.modifyObjects}.

@param time  the current simulation time
*/
updateCollision(time: number): void {
  if (!isFinite(this.distance))
    throw 'distance is NaN '+this;
  this.normalVelocity_ = NaN; // invalidate cached value
  // experiment: May 11 2015
  // collisions with low velocity and close distance should be marked as a contact.
  // (These are typically first detected as penetrating collisions).
  //if (!this.contact() && this.distance > 0
  //    && this.distance < this.primaryBody.getDistanceTol()
  //    && Math.abs(this.getNormalVelocity()) < this.primaryBody.getVelocityTol()) {
  //  this.isContact = true;
  //console.log('update->contact '+this);
  //}
  this.checkConsistent();
  this.updateTime_ = time;
  // only calculate the estimated collision time when needed (save time)
  if ((this.needsHandling() || !this.contact()) && this.getNormalVelocity() < 0) {
    // always use the fancy combined collision time estimate
    this.updateEstimatedTime(time, true);
  } else {
    this.estimate_ = NaN;
  }
};

/** Update the estimated time of collision using both pre-backup and post-backup
information and a calculus model of constant acceleration.
```text
Derivation of the estimate:
t1 = time after backup
t2 = time before backup
time interval of h = t2 - t1
d1 = distance at t1 = distance
v1 = velocity at t1 = normalVelocity
d2 = distance at t2 = detectedDistance_
v2 = velocity at t2 = detectedVelocity_
assume constant acceleration of a = (v2 - v1)/h
In the following, t is 0 at t1.
velocity v(t) = integral(a dt) = v1 + a t
distance d(t) = integral(v1 + a t dt) = d1 + v1 t + a t^2/2
Now, find time corresponding to distance = targetGap
targetGap = d1 + v1 t + (a/2) t^2
Quadratic equation in t
0 = (d1 - targetGap) + v1 t + (a/2) t^2
t = [-v1 +/- sqrt(v1^2 - 4 (a/2) (d1 - targetGap)) ]/(2 a/2)
t = [-v1 +/- sqrt(v1^2 - 2 a (d1 - targetGap)) ]/a
```
@param time
@param doUpdate
*/
private updateEstimatedTime(time: number, doUpdate: boolean): void {
  const t1 = time;
  const t2 = this.detectedTime_;
  const d1 = this.distance;
  const v1 = this.getNormalVelocity();
  const v2 = this.detectedVelocity_;
  const h = t2 - t1;
  if (h <= 1E-12) {
    /*
      console.log(Util.NF7(time)+' CANNOT UPDATE ESTIMATE '
        +' t1='+Util.NF7(t1)+' t2='+Util.NF7(t2)
        +' '+this.toString());
    */
    return;
  }
  const a = (v2 - v1)/h;
  // if acceleration is too small, then stick with existing estimate
  if (Math.abs(a) < 1E-12) {
    return;
  }
  // e1 and e2 combine both pre and post backup estimates
  // there are 2 estimates because they are solutions of a quadratic equation.
  const det = Math.sqrt(v1*v1 - 2*a*(d1 - this.targetGap_));
  const e1 = t1 + (-v1 + det)/a;
  const e2 = t1 + (-v1 - det)/a;
  if (doUpdate) {
    let didUpdate = false;
    const oldEstimate = this.estimate_;
    // only use one of the estimates if between t1 and t2.  Use earlier of e1, e2.
    if (e1 > t1 && e1 < t2) {
      this.estimate_ = e1;
      didUpdate = true;
    }
    if (e2 > t1 && e2 < t2) {
      // if we already used e1, then only replace with e2 if e2 < e1
      if (!didUpdate || e2 < e1) {
        this.estimate_ = e2;
        didUpdate = true;
      }
    }
    /*if (Util.DEBUG) {
      console.log(Util.NF7(time)+' UPDATE ESTIMATE '+didUpdate
      +' old='+Util.NF7(oldEstimate)
      +' targetGap='+Util.NF5E(this.targetGap_)
      +' e1='+Util.NF7(e1)
      +' e2='+Util.NF7(e2)
      +' '+this.toString());
    }*/
  }
};

} // end RigidBodyCollision class
Util.defineGlobal('lab$engine2D$RigidBodyCollision', RigidBodyCollision);
