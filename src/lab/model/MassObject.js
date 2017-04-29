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

goog.provide('myphysicslab.lab.model.MassObject');

goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.AffineTransform');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericVector');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var AffineTransform = myphysicslab.lab.util.AffineTransform;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var GenericVector = myphysicslab.lab.util.GenericVector;
var Vector = myphysicslab.lab.util.Vector;

/** An object that has mass, position, velocity and a local coordinate system, and can
potentially be dragged by the user.

## Body Coordinates

See also the 2D Physics Engine Overview section about
[Body Coordinates](Engine2D.html#bodycoordinates),
and {@link myphysicslab.lab.model.CoordType}.

Each MassObject has its own local coordinate system called *body coordinates*, distinct
from *world coordinates* (also called *simulation coordinates*). There are methods for
converting between body and world coordinates, see {@link #bodyToWorld} and
{@link #worldToBody}.

When the MassObject is positioned in world coordinates, we specify the location of the
center of mass and the rotation around the center of mass. The rotation is with respect
to body coordinates. A rotation of `pi/2` would rotate the MassObject 90 degrees counter
clockwise from its starting position.

## Drag Points

A MassObject can have one or more *drag points* specified to which we typically attach
a Spring for the user to be able to move the object.  See {@link #setDragPoints}.

See {@link myphysicslab.lab.app.EventHandler} and
{@link myphysicslab.lab.app.SimController} for information about how MassObjects are used for
user interface interactions like dragging an object.

## Potential Energy

For simulations where gravity operates in the vertical direction, there are methods here
to help calculate the potential energy of a MassObject. See {@link #setZeroEnergyLevel},
{@link #getZeroEnergyLevel}, {@link #getMinHeight},
and {@link myphysicslab.lab.model.EnergyInfo}.

* @interface
* @extends {myphysicslab.lab.model.SimObject}
*/
myphysicslab.lab.model.MassObject = function() {};
var MassObject = myphysicslab.lab.model.MassObject;

/** Moves this body so that a certain point on this body is aligned to the given world
coordinates location; optionally sets the angle of this body by rotating around the
center of mass `angle` radians counter-clockwise from the body coordinates
orientation.
@param {!GenericVector} p_body the point on this body to be
    aligned to the new `p_world` location, in body coordinates
@param {!GenericVector} p_world the world coordinates location to
    move the specified `p_body` point to
@param {number=} opt_angle the angle in radians to rotate this body counter-clockwise
    from 'body coordinates' orientation;  if not specified then leave the angle as is.
@throws {Error} if this RigidBody is immoveable
*/
MassObject.prototype.alignTo;

/** Returns the world coordinates of the given body coordinates point, based on current
position of this object.
@param {!GenericVector} p_body  the point, in body coordinates
@return {!Vector} the point in world coordinates
*/
MassObject.prototype.bodyToWorld;

/** Returns the AffineTransform from body to world coordinates.
* @return {!AffineTransform} the AffineTransform from body to world coordinates.
*/
MassObject.prototype.bodyToWorldTransform;

/** Creates the JavaScript Canvas path that represents the shape of this object
in the given Canvas context using body coordinates. Note that this calls
`CanvasRenderingContext2D.beginPath()` which discards any currently defined path and
begins a new one. Also, this concept of 'path' is different from the path of Edges
that makes up a Polygon (though the Canvas path is created from those Polygon
paths).
@param {!CanvasRenderingContext2D} context the Canvas context to create the path in
*/
MassObject.prototype.createCanvasPath;

/** Returns the counter-clockwise angle of rotation of this body about its center of
mass, in radians, relative to 'body coordinates' orientation.
@return {number} the counter-clockwise angle of rotation of this body about its
    center of mass, in radians, relative to 'body coordinates' orientation
*/
MassObject.prototype.getAngle;

/** Returns angular velocity of rotation of this body about its center of mass.
@return {number} the angular velocity, in radians/second, with positive meaning
    counter-clockwise rotation about the body's center of mass
*/
MassObject.prototype.getAngularVelocity;

/** Returns vertical coordinate of bottom-most point of this body, in body coordinates
@return {number} vertical coordinate of bottom-most point of this body, in body
    coordinates
*/
MassObject.prototype.getBottomBody;

/** Returns vertical coordinate of bottom-most point of this body, based on its
current position and orientation, in world coordinates. This is approximate when the
body has curved edges; because this looks at all the Vertex's of the body, and curved
edges have a series of 'decorated' Vertexes on them which don't capture the exact
nature of the geometric curve.
@return {number} vertical coordinate of bottom-most point of this body, in world
    coordinates
*/
MassObject.prototype.getBottomWorld;

/** Returns rectangle that contains this body in body coordinates.
@return {!DoubleRect} rectangle that contains this body in body coordinates
*/
MassObject.prototype.getBoundsBody;

/** Returns the location of center of mass, in local body coordinates.
@return {!Vector} the location of center of mass, in local body
        coordinates.
*/
MassObject.prototype.getCenterOfMassBody;

/** Returns the center of the circle to use for proximity testing, in body coords. A
circle centered at this location with radius `getCentroidRadius()` should enclose this
RigidBody. See {@link #getCentroidRadius}, {@link #getCentroidWorld}.

@return {!Vector} the center of the circle to use for proximity
    testing, in body coords
*/
MassObject.prototype.getCentroidBody;

/** Returns the radius of the circle to use for proximity testing. A circle
centered at `getCentroidBody()` with this radius should enclose this RigidBody.
See {@link #getCentroidBody}, {@link #getCentroidWorld}.

@return {number} the radius of the circle to use for proximity testing.
*/
MassObject.prototype.getCentroidRadius;

/** Returns the center of the circle to use for proximity testing, in world coords. A
circle centered at this location with radius `getCentroidRadius()` should enclose this
RigidBody. See {@link #getCentroidBody}, {@link #getCentroidRadius}.

@return {!Vector} the center of the circle to use for proximity
testing, in world coords
*/
MassObject.prototype.getCentroidWorld;

/** Returns the locations in body coordinates where a mouse can drag this object
@return {!Array<!Vector>} the locations in body coordinates where
a mouse can drag this object
*/
MassObject.prototype.getDragPoints;

/** Returns the height of this body, when drawn in body coordinates.
@return {number} the height of this body.
*/
MassObject.prototype.getHeight;

/** Returns kinetic energy of this body
@return {number} kinetic energy of this body
*/
MassObject.prototype.getKineticEnergy;

/** Returns horizontal coordinate of left-most point of this body, in body coordinates
* @return {number} horizontal coordinate of left-most point of this body, in body
    coordinates
*/
MassObject.prototype.getLeftBody;

/** Returns vertical coordinate of left-most point of this body, based on its current
position and orientation, in world coordinates. This is approximate when the body has
curved edges; because this looks at all the Vertex's of the body, and curved edges
have a series of 'decorated' Vertexes on them which don't capture the exact nature
of the geometric curve.
* @return {number} vertical coordinate of left-most point of this body, in world
    coordinates
*/
MassObject.prototype.getLeftWorld;

/** Returns the mass of this object.
@return {number} the mass of this object
*/
MassObject.prototype.getMass;

/** Returns the minimum height that this body's center of gravity can reach, used for
potential energy calculations. Put another way: this is how low the center of gravity of
this body can be when resting on the ground, and the ground is at height zero.
@return {number} the minimum height this body can reach.
*/
MassObject.prototype.getMinHeight;

/** Returns the position of the center of mass of this object, in world coordinates.
@return {!Vector} the position of this object, in world coordinates.
*/
MassObject.prototype.getPosition;

/** Returns horizontal coordinate of right-most point of this body, in body
coordinates
* @return {number} horizontal coordinate of right-most point of this body, in body
    coordinates
*/
MassObject.prototype.getRightBody;

/** Returns vertical coordinate of right-most point of this body, based on its
current position and orientation, in world coordinates. This is approximate when the
body has curved edges; because this looks at all the Vertex's of the body, and curved
edges have a series of 'decorated' Vertexes on them which don't capture the exact
nature of the geometric curve.
* @return {number} vertical coordinate of right-most point of this body, in world
    coordinates
*/
MassObject.prototype.getRightWorld;

/** Returns vertical coordinate of top-most point of this body, in body coordinates
* @return {number} vertical coordinate of top-most point of this body, in body
    coordinates
*/
MassObject.prototype.getTopBody;

/** Returns vertical coordinate of top-most point of this body, based on its current
position and orientation, in world coordinates. This is approximate when the body has
curved edges; because this looks at all the Vertex's of the body, and curved edges
have a series of 'decorated' Vertexes on them which don't capture the exact nature
of the geometric curve.
* @return {number} vertical coordinate of top-most point of this body, in world
    coordinates
*/
MassObject.prototype.getTopWorld;

/** Returns velocity of the given point on this object. The point is specified in body
coordinates, but the velocity is in world coordinates.
@param {!GenericVector=} p_body the point to find
    the velocity of, in body coordinates; if undefined, then center of mass is used
@return {!Vector} the velocity of the given point, in world
    coordinates
*/
MassObject.prototype.getVelocity;

/** Returns the locations of vertices that define a bounding area, in body coordinates.
The vertices might lie outside of the body: for example a circle could have vertices
at corners of a bounding box.
@return {!Array<!Vector>} locations of the vertices in body coordinates
*/
MassObject.prototype.getVerticesBody;

/** Returns the width of this body, when drawn in body coordinates.
@return {number} the width of this body.
*/
MassObject.prototype.getWidth;

/** Returns the vertical coordinate where the body has zero potential gravitational
energy under standard constant gravity when the body's center of mass is at this
vertical coordinate.
@return {?number} the vertical world coordinate where this body has zero potential
    energy; or null to use the default zero energy level
*/
MassObject.prototype.getZeroEnergyLevel;

/** Returns moment of inertia about center of mass. This measures how much force is
needed to rotate the body about the center of mass.  **Note that this is the number set
via {@link #setMomentAboutCM} multiplied by the mass of the body.**
@return {number} moment of inertia about center of mass
*/
MassObject.prototype.momentAboutCM;

/** Returns the linear and angular momentum of this body. Angular momentum about a fixed
point in space is defined as

    I_cm vw k + r x m v_cm

where:

    I_cm = moment about center of mass
    vw = angular velocity
    k = unit z vector,
    r = vector from a fixed point to the center of mass (cm)
    m = mass
    v_cm = velocity of center of mass

cross product in the plane is `(ax,ay,0) x (bx,by,0) = k(ax by - ay bx)` so we get

    I_cm w + m (rx vy - ry vx)

take the fixed point to be the origin `(0,0)`, so `(rx,ry)` is center of mass.

@return {!Array<number>} the momentum of this body as array containing horizontal,
    vertical and angular momentum in that order.
*/
MassObject.prototype.momentum;

/** Returns the rotational energy of this body.
Defined to be:  `0.5 * momentAboutCM * vw^2`
where `vw = ` angular velocity.
@return {number} the rotational energy of this body
*/
MassObject.prototype.rotationalEnergy;

/** Rotates a body coordinates vector to its orientation in world coordinates. The
vector goes from the origin (0, 0), to the given point in body coordinates. The vector
is rotated about the origin by the current angle of this body.
@param {!GenericVector} v_body  the vector, in body coordinates
@return {!Vector} the rotated vector in world coordinates.
*/
MassObject.prototype.rotateBodyToWorld;

/** Rotates a world coordinates vector to its orientation in body coordinates, the
inverse of {@link #rotateBodyToWorld} method. The vector goes from the origin (0, 0), to
the given point in world coordinates. The vector is rotated about the origin by the
opposite of the current angle of this body.
@param {!GenericVector} v_world the the vector to be rotated,
    in world coordinates
@return {!Vector} the rotated vector in body coordinates.
*/
MassObject.prototype.rotateWorldToBody;

/** Sets the angle in radians of counter-clockwise rotation of this object around its
center of mass. Angle zero draws the object in the same orientation as in body
coordinates. Angle `Math.PI/2` rotates the body clockwise 90 degrees from its
body coordinates orientation.
@param {number} angle the angle in radians to rotate this object counter-clockwise
    about its center of mass from 'body coordinates' orientation
*/
MassObject.prototype.setAngle;

/** Sets angular velocity of rotation of this body about its center of mass.
@param {number} angular_velocity the angular velocity, in radians/second, with positive
    meaning counter-clockwise rotation about the body's center of mass
*/
MassObject.prototype.setAngularVelocity;

/** Sets location of center of mass, in body coordinates.
@param {number} x_body the horizontal position of the center of mass, in body
    coordinates.
@param {number} y_body the vertical position of the center of mass, in body coordinates.
*/
MassObject.prototype.setCenterOfMass;

/** Sets the locations where a mouse can drag this object, in body coordinates.
@param {!Array<!Vector>} dragPts the locations where a mouse
    can drag this object, in body coordinates
*/
MassObject.prototype.setDragPoints;

/** Set the mass of this MassObject.
@param {number} mass the mass of this MassObject
@return {!MassObject} this object for chaining setters
*/
MassObject.prototype.setMass;

/** Sets the minimum height that this body can reach,
used for potential energy calculations.  That is, how low can the center of
gravity of this body go?
@param {number} minHeight  the minimum height that this body can reach.
*/
MassObject.prototype.setMinHeight;

/** Sets the moment of inertia about the center of mass for this body **divided by the
mass of this body**. The moment of inertia, `Icm`, measures how much force is needed to
rotate the body about the center of mass. `Icm` depends on the shape of the object and
how mass is distributed. For a thin rectangular plate:

    Icm = mass * (width^2 + height^2) / 12

For a thin circular plate:

    Icm = mass * radius^2 / 2

Note that {@link #momentAboutCM} returns the number specified here multiplied by the
mass of the body.

* @param {number} moment the moment of inertia about the center of mass for this body
*    **divided by the mass of this body**
*/
MassObject.prototype.setMomentAboutCM;

/** Moves this body so that the center of mass is at the given world coordinates
location; rotates this body counter-clockwise about center of mass from
'body coordinates' orientation by the given angle in radians.

Note that when setting the mass on a RigidBody you should also set accordingly the
{@link myphysicslab.lab.engine2D.RigidBody#setMomentAboutCM moment about center of
mass}.

@param {!GenericVector} loc_world the location in world coordinates
@param {number=} angle the angle in radians to rotate this body counter-clockwise
    from 'body coordinates' orientation; if undefined then angle is not changed
*/
MassObject.prototype.setPosition;

/** Set the linear velocity of this objects's center of mass, and (optional) angular
velocity of rotation about the objects's center of mass. A MassObject keeps track of
its current velocity as a convenience for various calculations.
@param {!GenericVector} velocity_world the velocity in world coordinates/second
@param {number=} angular_velocity the angular velocity, in radians/second, with
    positive meaning counter-clockwise rotation about the body's center of mass;
    if undefined, then angular velocity is not changed
*/
MassObject.prototype.setVelocity;

/** Sets the vertical coordinate where the body has zero potential gravitational energy
under standard constant gravity when the body's center of mass is at this vertical
coordinate.
@param {?number=} height the vertical world coordinate where this body has zero
    potential energy; `null` means to use default level;
    `undefined` means use the body's current vertical location is used
@return {!MassObject} this MassObject for chaining setters
*/
MassObject.prototype.setZeroEnergyLevel;

/** Returns the translational energy of this body.
Defined to be: `0.5*mass*(vx^2 + vy^2)` where
`vx = ` horizontal velocity, and
`vy = ` vertical velocity.
@return {number} the translational energy of this body
*/
MassObject.prototype.translationalEnergy;

/** Returns the body coordinates of the given world coordinates point, based on current
position of this object.
@param {!GenericVector} p_world  the point, in world coordinates
@return {!Vector} the point in body coordinates
*/
MassObject.prototype.worldToBody;

}); // goog.scope
