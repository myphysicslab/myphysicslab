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

import { SimObject, AbstractSimObject } from "./SimObject.js"
import { AffineTransform } from "../util/AffineTransform.js"
import { DoubleRect } from "../util/DoubleRect.js"
import { Util } from "../util/Util.js"
import { Vector, GenericVector } from "../util/Vector.js"

/** An object that has mass, position, velocity and a local coordinate system, and can
potentially be dragged by the user.

## Body Coordinates

See also the 2D Physics Engine Overview section about
[Body Coordinates](../Engine2D.html#bodycoordinates), and
{@link lab/model/CoordType.CoordType}.

Each MassObject has its own local coordinate system called *body coordinates*, distinct
from *world coordinates* (also called *simulation coordinates*). There are methods for
converting between body and world coordinates, see {@link MassObject.bodyToWorld} and
{@link MassObject.worldToBody}.

When the MassObject is positioned in world coordinates, we specify the location of the
center of mass and the rotation around the center of mass. The rotation is with respect
to body coordinates. A rotation of `pi/2` would rotate the MassObject 90 degrees counter
clockwise from its starting position.

## Drag Points

A MassObject can have one or more *drag points* specified to which we typically attach
a Spring for the user to be able to move the object.
See {@link MassObject.setDragPoints}.

See {@link lab/app/EventHandler.EventHandler} and
{@link lab/app/SimController.SimController} for information about how MassObjects are used
for user interface interactions like dragging an object.

## Potential Energy

For simulations where gravity operates in the vertical direction, there are methods here
to help calculate the potential energy of a MassObject.
See {@link MassObject.setZeroEnergyLevel},
{@link MassObject.getZeroEnergyLevel}, {@link MassObject.getMinHeight},
and {@link lab/model/EnergySystem.EnergyInfo}.

*/
export interface MassObject extends SimObject {

/** Moves this body so that a certain point on this body is aligned to the given world
coordinates location; optionally sets the angle of this body by rotating around the
center of mass `angle` radians counter-clockwise from the body coordinates
orientation.
@param p_body the point on this body to be
    aligned to the new `p_world` location, in body coordinates
@param p_world the world coordinates location to
    move the specified `p_body` point to
@param opt_angle the angle in radians to rotate this body counter-clockwise
    from 'body coordinates' orientation;  if not specified then leave the angle as is.
@throws if this MassObject is immoveable
*/
alignTo(p_body: GenericVector, p_world: GenericVector, opt_angle?: number): void;

/** Returns the world coordinates of the given body coordinates point, based on current
position of this object.
@param p_body  the point, in body coordinates
@return the point in world coordinates
*/
bodyToWorld(p_body: GenericVector): Vector;

/** Returns the AffineTransform from body to world coordinates.
* @return the AffineTransform from body to world coordinates.
*/
bodyToWorldTransform(): AffineTransform;

/** Creates the JavaScript Canvas path that represents the shape of this object
in the given Canvas context using body coordinates. Note that this calls
`CanvasRenderingContext2D.beginPath()` which discards any currently defined path and
begins a new one. Also, this concept of 'path' is different from the path of Edges
that makes up a Polygon (though the Canvas path is created from those Polygon
paths).
@param context the CanvasRenderingContext2D to create the path in
*/
createCanvasPath(context: CanvasRenderingContext2D): void;

/** Returns the counter-clockwise angle of rotation of this body about its center of
mass, in radians, relative to 'body coordinates' orientation.
@return the counter-clockwise angle of rotation of this body about its
    center of mass, in radians, relative to 'body coordinates' orientation
*/
getAngle(): number;

/** Returns angular velocity of rotation of this body about its center of mass.
@return the angular velocity, in radians/second, with positive meaning
    counter-clockwise rotation about the body's center of mass
*/
getAngularVelocity(): number;

/** Returns vertical coordinate of bottom-most point of this body, in body coordinates
@return vertical coordinate of bottom-most point of this body, in body
    coordinates
*/
getBottomBody(): number;

/** Returns vertical coordinate of bottom-most point of this body, based on its
current position and orientation, in world coordinates. This is approximate when the
body has curved edges; because this looks at all the Vertex's of the body, and curved
edges have a series of 'decorated' Vertexes on them which don't capture the exact
nature of the geometric curve.
@return vertical coordinate of bottom-most point of this body, in world
    coordinates
*/
getBottomWorld(): number;

/** Returns rectangle that contains this body in body coordinates.
@return rectangle that contains this body in body coordinates
*/
getBoundsBody(): DoubleRect;

/** Returns the location of center of mass, in local body coordinates.
@return the location of center of mass, in local body
        coordinates.
*/
getCenterOfMass(): Vector;

/** Returns the center of the circle to use for proximity testing, in body coords. A
circle centered at this location with radius `getCentroidRadius()` should enclose this
MassObject. See {@link MassObject.getCentroidRadius},
{@link MassObject.getCentroidWorld}.

@return the center of the circle to use for proximity
    testing, in body coords
*/
getCentroidBody(): Vector;

/** Returns the radius of the circle to use for proximity testing. A circle
centered at `getCentroidBody()` with this radius should enclose this MassObject.
See {@link MassObject.getCentroidBody}, {@link MassObject.getCentroidWorld}.

@return the radius of the circle to use for proximity testing.
*/
getCentroidRadius(): number;

/** Returns the center of the circle to use for proximity testing, in world coords. A
circle centered at this location with radius `getCentroidRadius()` should enclose this
MassObject. See {@link MassObject.getCentroidBody},
{@link MassObject.getCentroidRadius}.

@return the center of the circle to use for proximity
testing, in world coords
*/
getCentroidWorld(): Vector;

/** Returns the locations in body coordinates where a mouse can drag this object
@return the locations in body coordinates where
a mouse can drag this object
*/
getDragPoints(): Vector[];

/** Returns the height of this body, when drawn in body coordinates.
@return the height of this body.
*/
getHeight(): number;

/** Returns kinetic energy of this body
@return kinetic energy of this body
*/
getKineticEnergy(): number;

/** Returns horizontal coordinate of left-most point of this body, in body coordinates
* @return horizontal coordinate of left-most point of this body, in body
*     coordinates
*/
getLeftBody(): number;

/** Returns vertical coordinate of left-most point of this body, based on its current
position and orientation, in world coordinates. This is approximate when the body has
curved edges; because this looks at all the Vertex's of the body, and curved edges
have a series of 'decorated' Vertexes on them which don't capture the exact nature
of the geometric curve.
@return vertical coordinate of left-most point of this body, in world
    coordinates
*/
getLeftWorld(): number;

/** Returns the mass of this object.
@return the mass of this object
*/
getMass(): number;

/** Returns the minimum height that this body's center of gravity can reach, used for
potential energy calculations. Put another way: this is how low the center of gravity of
this body can be when resting on the ground, and the ground is at height zero.
@return the minimum height this body can reach.
*/
getMinHeight(): number;

/** Returns the position of the center of mass of this object, in world coordinates.
@return the position of this object, in world coordinates.
*/
getPosition(): Vector;

/** Returns horizontal coordinate of right-most point of this body, in body
* coordinates
* @return horizontal coordinate of right-most point of this body, in body
*     coordinates
*/
getRightBody(): number;

/** Returns vertical coordinate of right-most point of this body, based on its
current position and orientation, in world coordinates. This is approximate when the
body has curved edges; because this looks at all the Vertex's of the body, and curved
edges have a series of 'decorated' Vertexes on them which don't capture the exact
nature of the geometric curve.
@return vertical coordinate of right-most point of this body, in world coordinates
*/
getRightWorld(): number;

/** Returns vertical coordinate of top-most point of this body, in body coordinates
* @return vertical coordinate of top-most point of this body, in body
*     coordinates
*/
getTopBody(): number;

/** Returns vertical coordinate of top-most point of this body, based on its current
position and orientation, in world coordinates. This is approximate when the body has
curved edges; because this looks at all the Vertex's of the body, and curved edges
have a series of 'decorated' Vertexes on them which don't capture the exact nature
of the geometric curve.
@return vertical coordinate of top-most point of this body, in world coordinates
*/
getTopWorld(): number;

/** Returns velocity of the given point on this object. The point is specified in body
coordinates, but the velocity is in world coordinates.
@param p_body the point to find
    the velocity of, in body coordinates; if undefined, then center of mass is used
@return the velocity of the given point, in world
    coordinates
*/
getVelocity(p_body?: GenericVector): Vector;

/** Returns the locations of vertices that define a bounding area, in body coordinates.
The vertices might lie outside of the body: for example a circle could have vertices
at corners of a bounding box.
@return locations of the vertices in body coordinates
*/
getVerticesBody(): Vector[];

/** Returns the width of this body, when drawn in body coordinates.
@return the width of this body.
*/
getWidth(): number;

/** Returns the vertical coordinate where the body has zero potential gravitational
energy under standard constant gravity when the body's center of mass is at this
vertical coordinate.
@return the vertical world coordinate where this body has zero potential
    energy; or null to use the default zero energy level
*/
getZeroEnergyLevel(): number|null;

/** Returns moment of inertia about center of mass. This measures how much force is
needed to rotate the body about the center of mass.  **Note that this is the number set
via {@link MassObject.setMomentAboutCM}
multiplied by the mass of the body.**
@return moment of inertia about center of mass
*/
momentAboutCM(): number;

/** Returns the linear and angular momentum of this body. Angular momentum about a fixed
point in space is defined as
```text
I_cm vw k + r x m v_cm
```
where:
```text
I_cm = moment about center of mass
vw = angular velocity
k = unit z vector,
r = vector from a fixed point to the center of mass (cm)
m = mass
v_cm = velocity of center of mass
```

cross product in the plane is `(ax,ay,0) x (bx,by,0) = k(ax by - ay bx)` so we get
```text
I_cm w + m (rx vy - ry vx)
```

take the fixed point to be the origin `(0,0)`, so `(rx,ry)` is center of mass.

@return the momentum of this body as array containing horizontal,
    vertical and angular momentum in that order.
*/
momentum(): number[];

/** Returns the rotational energy of this body.
Defined to be:  `0.5 * momentAboutCM * vw^2`
where `vw = ` angular velocity.
@return the rotational energy of this body
*/
rotationalEnergy(): number;

/** Rotates a body coordinates vector to its orientation in world coordinates. The
vector goes from the origin (0, 0), to the given point in body coordinates. The vector
is rotated about the origin by the current angle of this body.
@param v_body  the vector, in body coordinates
@return the rotated vector in world coordinates.
*/
rotateBodyToWorld(v_body: GenericVector): Vector;

/** Rotates a world coordinates vector to its orientation in body coordinates, the
inverse of {@link MassObject.rotateBodyToWorld} method.
The vector goes from the origin `(0, 0)`, to the given point in world coordinates. The
vector is rotated about the origin by the opposite of the current angle of this body.
@param v_world the the vector to be rotated, in world coordinates
@return the rotated vector in body coordinates.
*/
rotateWorldToBody(v_world: GenericVector): Vector;

/** Sets the angle in radians of counter-clockwise rotation of this object around its
center of mass. Angle zero draws the object in the same orientation as in body
coordinates. Angle `Math.PI/2` rotates the body clockwise 90 degrees from its
body coordinates orientation.
@param angle the angle in radians to rotate this object counter-clockwise
    about its center of mass from 'body coordinates' orientation
*/
setAngle(angle: number): void;

/** Sets angular velocity of rotation of this body about its center of mass.
@param angular_velocity the angular velocity, in radians/second, with positive
    meaning counter-clockwise rotation about the body's center of mass
*/
setAngularVelocity(angular_velocity: number): void;

/** Sets location of center of mass, in body coordinates.
@param center the position of the center of mass, in body
    coordinates.
*/
setCenterOfMass(center: GenericVector): void;

/** Sets the locations where a mouse can drag this object, in body coordinates.
@param dragPts the locations where a mouse
    can drag this object, in body coordinates
*/
setDragPoints(dragPts: Vector[]): void;

/** Set the mass of this MassObject.

Note that when setting the mass on a MassObject you should also set accordingly the
moment of inertia about center of mass,
see {@link MassObject.setMomentAboutCM}.

@param mass the mass of this MassObject
*/
setMass(mass: number): void;

/** Sets the minimum height that this body can reach,
used for potential energy calculations.  That is, how low can the center of
gravity of this body go?
@param minHeight  the minimum height that this body can reach.
*/
setMinHeight(minHeight: number): void;

/** Sets the moment of inertia about the center of mass for this body **divided by the
mass of this body**. The moment of inertia, `Icm`, measures how much force is needed to
rotate the body about the center of mass. `Icm` depends on the shape of the object and
how mass is distributed. For a thin rectangular plate:
```text
Icm = mass * (width^2 + height^2) / 12
```
For a thin circular plate:
```text
Icm = mass * radius^2 / 2
```
Note that {@link MassObject.momentAboutCM} returns the number
specified here multiplied by the mass of the body.
@param moment the moment of inertia about the center of mass for this body
    **divided by the mass of this body**
*/
setMomentAboutCM(moment: number): void;

/** Moves this body so that the center of mass is at the given world coordinates
location; rotates this body counter-clockwise about center of mass from
'body coordinates' orientation by the given angle in radians.

@param loc_world the location in world coordinates
@param angle the angle in radians to rotate this body counter-clockwise
    from 'body coordinates' orientation; if undefined then angle is not changed
*/
setPosition(loc_world: GenericVector, angle?: number): void;

/** Moves this body so that the center of mass is at the given world coordinates
X (horizontal) location.
@param value the horizontal location in world coordinates
*/
setPositionX(value: number): void;

/** Moves this body so that the center of mass is at the given world coordinates
Y (vertical) location.
@param value the vertical location in world coordinates
*/
setPositionY(value: number): void;

/** Set the linear velocity of this objects's center of mass, and (optional) angular
velocity of rotation about the objects's center of mass.
@param velocity_world the velocity in world coordinates/second
@param angular_velocity the angular velocity, in radians/second, with
    positive meaning counter-clockwise rotation about the body's center of mass;
    if undefined, then angular velocity is not changed
*/
setVelocity(velocity_world: GenericVector, angular_velocity?: number): void;

/** Set the linear horizontal velocity of this objects's center of mass.
@param value the horizontal velocity in world coordinates
*/
setVelocityX(value: number): void;

/** Set the linear vertical velocity of this objects's center of mass.
@param value the vertical velocity in world coordinates
*/
setVelocityY(value: number): void;

/** Sets the vertical coordinate where the body has zero potential gravitational energy
under standard constant gravity when the body's center of mass is at this vertical
coordinate.
@param height the vertical world coordinate where this body has zero
    potential energy; `NaN` means to use default level;
    `undefined` means use the body's current vertical location is used
*/
setZeroEnergyLevel(height?: number): void;

/** Returns the translational energy of this body.
Defined to be: `0.5*mass*(vx^2 + vy^2)` where
`vx = ` horizontal velocity, and
`vy = ` vertical velocity.
@return the translational energy of this body
*/
translationalEnergy(): number;

/** Returns the body coordinates of the given world coordinates point, based on current
position of this object.
@param p_world  the point, in world coordinates
@return the point in body coordinates
*/
worldToBody(p_world: GenericVector): Vector;

}; // end MassObject interface


// **************************** AbstractMassObject ******************************

/** Abstract class which implements most of the {@link MassObject}
methods.
*/
export abstract class AbstractMassObject extends AbstractSimObject implements SimObject, MassObject {
  protected mass_: number = 1;
  protected loc_world_: Vector = Vector.ORIGIN;
  protected angle_: number = 0;
  /** sine of angle */
  protected sinAngle_: number = 0.0;
  /** cosine of angle. */
  protected cosAngle_: number = 1.0;
  protected velocity_: Vector = Vector.ORIGIN;
  /** angular velocity about center of mass */
  protected angular_velocity_: number = 0;
  /** center of mass in body coordinates */
  protected cm_body_: Vector = Vector.ORIGIN;
  /** the vertical coordinate where this body has zero potential energy; or null
  * to use the default zero energy level.
  */
  protected zeroEnergyLevel_: number|null = null;
  protected dragPts_: Vector[] = [Vector.ORIGIN];
  /** moment about center of mass divided by mass */
  protected moment_: number = 0;
  /** the minimum value the vertical position of this body can take on,
  * used in energy calculations
  */
  protected minHeight_: number = NaN;

/**
* @param opt_name name of this SimObject (optional)
* @param opt_localName localized name of this SimObject (optional)
*/
constructor(opt_name?: string, opt_localName?: string) {
  super(opt_name, opt_localName);
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', mass_: '+Util.NF(this.mass_)
      +', loc_world_: '+this.loc_world_
      +', angle_: '+this.angle_
      +', velocity_: '+this.velocity_
      +', angular_velocity_: '+Util.NF(this.angular_velocity_)
      +', cm_body_: '+this.cm_body_
      +', zeroEnergyLevel_: '+Util.NF(this.zeroEnergyLevel_)
      +', moment_: '+Util.NF(this.moment_)
      +', dragPts_: ['
      +this.dragPts_.map(p => p.toString())
      +']'
      +'}';
};

/** @inheritDoc */
alignTo(p_body: GenericVector, p_world: GenericVector, opt_angle?: number): void {
  const angle = (opt_angle === undefined) ? this.angle_ : opt_angle;
  // vector from CM to target point
  const rx = p_body.getX() - this.cm_body_.getX();
  const ry = p_body.getY() - this.cm_body_.getY();
  // p_world says where p_body should wind up in world coords;
  // need to find where CM will wind up.
  // rotate the vector rx, ry by the angle, subtract from p_world;
  // this gives where CM will be.
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  this.setPosition(new Vector(p_world.getX() - (rx*cos - ry*sin),
              p_world.getY() - (rx*sin + ry*cos)), angle);
};

/** @inheritDoc */
bodyToWorld(p_body: GenericVector): Vector {
  const rx = p_body.getX() - this.cm_body_.getX();  // vector from cm to p_body
  const ry = p_body.getY() - this.cm_body_.getY();
  const vx = this.loc_world_.getX() + (rx*this.cosAngle_ - ry*this.sinAngle_);
  const vy = this.loc_world_.getY() + (rx*this.sinAngle_ + ry*this.cosAngle_);
  return new Vector(vx, vy);
};

/** @inheritDoc */
bodyToWorldTransform(): AffineTransform {
  // move to global sim position
  let at = new AffineTransform(1, 0, 0, 1, this.loc_world_.getX(),
    this.loc_world_.getY());
  at = at.rotate(this.angle_);  //  rotate by angle
  return at.translate(-this.cm_body_.getX(), -this.cm_body_.getY());
};

/** @inheritDoc */
abstract createCanvasPath(context: CanvasRenderingContext2D): void;

/** @inheritDoc */
getAngle(): number {
  return this.angle_;
};

/** @inheritDoc */
getAngularVelocity(): number {
  return this.angular_velocity_;
};

/** @inheritDoc */
abstract getBottomBody(): number;

/** @inheritDoc */
getBottomWorld(): number {
  let min = Infinity;
  this.getVerticesBody().forEach(v => {
    const p = this.bodyToWorld(v);
    if (p.getY() < min) {
      min = p.getY();
    }
  });
  return min;
};

/** @inheritDoc */
getBoundsBody(): DoubleRect {
  return new DoubleRect(this.getLeftBody(), this.getBottomBody(),
      this.getRightBody(), this.getTopBody());
};

/** @inheritDoc */
getBoundsWorld(): DoubleRect {
  return new DoubleRect(this.getLeftWorld(), this.getBottomWorld(),
      this.getRightWorld(), this.getTopWorld());
};

/** @inheritDoc */
getCenterOfMass(): Vector {
  return this.cm_body_;
};

/** @inheritDoc */
abstract getCentroidBody(): Vector;

/** @inheritDoc */
abstract getCentroidRadius(): number;

/** @inheritDoc */
getCentroidWorld(): Vector {
  return this.bodyToWorld(this.getCentroidBody());
};

/** @inheritDoc */
getDragPoints(): Vector[] {
  return Array.from(this.dragPts_);
};

/** @inheritDoc */
getHeight(): number {
  return this.getTopBody() - this.getBottomBody();
};

/** @inheritDoc */
getKineticEnergy(): number {
  return this.translationalEnergy() + this.rotationalEnergy();
};

/** @inheritDoc */
abstract getLeftBody(): number;

/** @inheritDoc */
getLeftWorld(): number {
  let min = Infinity;
  this.getVerticesBody().forEach(v => {
    const p = this.bodyToWorld(v);
    if (p.getX() < min) {
      min = p.getX();
    }
  });
  return min;
};

/** @inheritDoc */
getMass(): number {
  return this.mass_;
};

/** @inheritDoc */
abstract getMinHeight(): number;

/** @inheritDoc */
getPosition(): Vector {
  return this.loc_world_;
};

/** @inheritDoc */
abstract getRightBody(): number;

/** @inheritDoc */
getRightWorld(): number {
  let max = Number.NEGATIVE_INFINITY;
  this.getVerticesBody().forEach(v => {
    const p = this.bodyToWorld(v);
    if (p.getX() > max) {
      max = p.getX();
    }
  });
  return max;
};

/** @inheritDoc */
abstract getTopBody(): number;

/** @inheritDoc */
getTopWorld(): number {
  let max = Number.NEGATIVE_INFINITY;
  this.getVerticesBody().forEach(v => {
    const p = this.bodyToWorld(v);
    if (p.getY() > max) {
      max = p.getY();
    }
  });
  return max;
};

/** @inheritDoc */
getWidth(): number {
  return this.getRightBody() - this.getLeftBody();
};

/** @inheritDoc */
getVelocity(p_body?: GenericVector): Vector {
  if (p_body !== undefined) {
    const r = this.rotateBodyToWorld(Vector.clone(p_body).subtract(this.cm_body_));
    return new Vector(this.velocity_.getX() - r.getY()*this.angular_velocity_,
        this.velocity_.getY() + r.getX()*this.angular_velocity_);
  } else {
    return this.velocity_;
  }
};

/** @inheritDoc */
abstract getVerticesBody(): Vector[];

/** @inheritDoc */
getZeroEnergyLevel(): number|null {
  return this.zeroEnergyLevel_;
};

/** @inheritDoc */
override isMassObject(): boolean {
  return true;
};

/** @inheritDoc */
momentAboutCM(): number {
  return this.mass_*this.moment_;
};

/** @inheritDoc */
momentum(): number[] {
  const result = new Array(3);
  result[0] = this.mass_*this.velocity_.getX();
  result[1] = this.mass_*this.velocity_.getY();
  result[2] = this.momentAboutCM()*this.angular_velocity_
      + this.mass_*(this.loc_world_.getX()*this.velocity_.getY()
      - this.loc_world_.getY()*this.velocity_.getX());
  return result;
};

/** @inheritDoc */
rotateBodyToWorld(v_body: GenericVector): Vector {
  return Vector.clone(v_body).rotate(this.cosAngle_, this.sinAngle_);
};

/** @inheritDoc */
rotateWorldToBody(v_world: GenericVector): Vector {
  // rotate by -angle
  // note that cos(-a) = cos(a) and sin(-a) = -sin(a).
  return Vector.clone(v_world).rotate(this.cosAngle_, -this.sinAngle_);
};

/** @inheritDoc */
rotationalEnergy(): number {
  return 0.5*this.momentAboutCM()*this.angular_velocity_*this.angular_velocity_;
};

/** @inheritDoc */
setAngle(angle: number): void {
  this.setPosition(this.loc_world_,  angle);
};

/** @inheritDoc */
setAngularVelocity(angular_velocity: number): void {
  if (!isFinite(angular_velocity)) {
    throw 'angular velocity must be finite '+angular_velocity;
  }
  this.angular_velocity_ = angular_velocity;
  this.setChanged();
};

/** @inheritDoc */
setCenterOfMass(center: GenericVector): void {
  this.cm_body_ = Vector.clone(center);
  // NaN indicates that minimum height must be recalculated
  this.minHeight_ = NaN;
  this.setChanged();
};

/** @inheritDoc */
setDragPoints(dragPts: GenericVector[]): void {
  this.dragPts_ = dragPts.map(gv => Vector.clone(gv));
  this.setChanged();
};

/** @inheritDoc */
setMass(mass: number): void {
  if (mass <= 0 || typeof mass !== 'number') {
    throw 'mass must be positive '+mass;
  }
  this.mass_ = mass;
  this.setChanged();
};

/** @inheritDoc */
setMinHeight(minHeight: number): void {
  this.minHeight_ = minHeight;
};

/** @inheritDoc */
setMomentAboutCM(moment: number): void {
  this.moment_ = moment;
  this.setChanged();
};

/** @inheritDoc */
setPosition(loc_world: GenericVector, angle?: number): void {
  this.loc_world_ = Vector.clone(loc_world);
  if (angle !== undefined && this.angle_ != angle) {
    this.angle_ = angle;
    this.sinAngle_ = Math.sin(angle);
    this.cosAngle_ = Math.cos(angle);
  }
  this.setChanged();
};

/** @inheritDoc */
setPositionX(value: number): void {
  this.setPosition(new Vector(value, this.loc_world_.getY()));
};

/** @inheritDoc */
setPositionY(value: number): void {
  this.setPosition(new Vector(this.loc_world_.getX(), value));
};

/** @inheritDoc */
setVelocity(velocity_world: GenericVector, angular_velocity?: number): void {
  this.velocity_ = Vector.clone(velocity_world);
  if (angular_velocity !== undefined) {
    this.setAngularVelocity(angular_velocity);
  }
  this.setChanged();
};

/** @inheritDoc */
setVelocityX(value: number): void {
  this.setVelocity(new Vector(value, this.velocity_.getY()));
};

/** @inheritDoc */
setVelocityY(value: number): void {
  this.setVelocity(new Vector(this.velocity_.getX(), value));
};

/** @inheritDoc */
setZeroEnergyLevel(height?: number): void {
  this.zeroEnergyLevel_ = height ?? this.loc_world_.getY();
  this.setChanged();
};

/** @inheritDoc */
translationalEnergy(): number {
  return 0.5 * this.mass_ * this.velocity_.lengthSquared();
};

/** @inheritDoc */
worldToBody(p_world: GenericVector): Vector {
  // get the vector from cm (which is at x_world,y_world) to p_world
  const rx = p_world.getX() - this.loc_world_.getX();
  const ry = p_world.getY() - this.loc_world_.getY();
  const sin = -this.sinAngle_;
  const cos = this.cosAngle_;
  // add the reverse-rotated vector to the cm location (in body-coords)
  const vx = this.cm_body_.getX() + (rx*cos - ry*sin);
  const vy = this.cm_body_.getY() + (rx*sin + ry*cos);
  return new Vector(vx, vy);
};

} // end AbstractMassObject class

Util.defineGlobal('lab$model$AbstractMassObject', AbstractMassObject);
