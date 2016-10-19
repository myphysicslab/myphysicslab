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

goog.provide('myphysicslab.lab.engine2D.Vertex');

goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.util.Printable');

goog.scope(function() {

/** A Vertex is a point on an Edge in a Polygon, in body coordinates of the Polygon. A
Vertex can be at the end-point of the Edge, or at a mid-point of the Edge. An end-point
Vertex is connected to two Edges which are called the 'previous' and 'next' Edges. A
mid-point Vertex is connected to only a single Edge, which is considered to be both the
'previous' and 'next' Edge in that case.

See {@link myphysicslab.lab.engine2D.Polygon}, and
{@link myphysicslab.lab.engine2D.Edge}.

## Decorated Mid-Point Vertexes

See also the section on [Decorated Vertexes](Engine2D.html#decoratedvertexes) in the
engine2D overview.

We add 'decorated mid-point Vertexes' along a curved edge to help with collision and
contact detection.

<img src="Engine2D_Decorated_Vertexes.svg">

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
'end-point' Vertexes at the end-points of line segments. See {@link #isEndPoint}. The
number of decorated Vertexes can be controlled by a spacing parameter when making a
curved Edge.

What typically happens for a collision involving a curved Edge and another Edge is:

1. The mid-point Vertexes indicate there is a collision; the Edge/Edge tests might also
indicate a collision.

2. After backing up and getting close to – but just before – the moment of collision,
the Edge/Edge collision will have the smallest gap among all the detected contacts or
collisions, and will therefore supersede any decorated Vertex/Edge collisions or
contacts. The Edge/Edge collision gives better accuracy.

* @interface
* @extends {myphysicslab.lab.util.Printable}
*/
myphysicslab.lab.engine2D.Vertex = function() {};
var Vertex = myphysicslab.lab.engine2D.Vertex;

/** Returns the radius of curvature of the Edge at the Vertex's location. If the
Vertex is between two Edges, returns the radius of curvature with smaller absolute
value. Negative curvature means the Edge is concave at that point.
@return {number} radius of curvature of Edge at the Vertex, negative means
concave
*/
Vertex.prototype.getCurvature;

/** Returns the 'previous' Edge that this Vertex is connected to.
@return {!myphysicslab.lab.engine2D.Edge} the 'previous' Edge that this Vertex is
    connected to.
@throws {Error} if edge1 not yet set for this Vertex
*/
Vertex.prototype.getEdge1;

/** Returns the 'next' Edge that this Vertex is connected to.
@return {!myphysicslab.lab.engine2D.Edge} the 'next' Edge that this Vertex is
    connected to.
@throws {Error} if edge2 not yet set for this Vertex
*/
Vertex.prototype.getEdge2;

/** Returns an identity number unique for each Vertex, for debugging.
@return {number} an identity number unique for each Vertex, for debugging.
*/
Vertex.prototype.getID;

/** Highlights this Vertex for debugging purposes.
@return {undefined}
*/
Vertex.prototype.highlight;

/** Returns true if this is a Vertex at the end of an Edge; returns false if this is
a 'decorated mid-point' Vertex.
@return {boolean} true if this is a Vertex at the end of an Edge; returns false if this
    is a 'decorated mid-point' Vertex.
*/
Vertex.prototype.isEndPoint;

/** Returns the location of this Vertex in body coords of its Polygon.
@return {!myphysicslab.lab.util.Vector} location of this Vertex in body coords of its
    Polygon
*/
Vertex.prototype.locBody;

/** Returns the horizontal location of this Vertex in body coords of its Polygon.
@return {number} location of this Vertex in body coords of its Polygon
*/
Vertex.prototype.locBodyX;

/** Returns the vertical location of this Vertex in body coords of its Polygon.
@return {number} location of this Vertex in body coords of its Polygon
*/
Vertex.prototype.locBodyY;

/** Returns the next edge, or null if not yet assigned.
@return {?myphysicslab.lab.engine2D.Edge} edge the next edge, or `null` if not yet
    assigned.
*/
Vertex.prototype.safeGetEdge2;

/** Sets the 'previous' Edge that this Vertex is connected to.
@param {!myphysicslab.lab.engine2D.Edge} edge the 'previous' Edge that this Vertex is
    connected to.
@throws {Error} if this Vertex was already connected to a previous Edge
*/
Vertex.prototype.setEdge1;

/** Sets the 'next' Edge that this Vertex is connected to.
@param {!myphysicslab.lab.engine2D.Edge} edge the 'next' Edge that this Vertex is
connected to
@throws {Error} if this Vertex was already connected to a next Edge
*/
Vertex.prototype.setEdge2;

}); // goog.scope
