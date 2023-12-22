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

import { AbstractEdge } from './AbstractEdge.js';
import { Collision } from '../model/Collision.js';
import { ConcreteVertex } from './ConcreteVertex.js';
import { CornerEdgeCollision } from './CornerEdgeCollision.js';
import { EdgeEdgeCollision } from './EdgeEdgeCollision.js';
import { RigidBody, Edge, CurvedEdge, Vertex } from './RigidBody.js';
import { RigidBodyCollision } from './RigidBody.js';
import { StraightEdge } from './StraightEdge.js';
import { Util } from '../util/Util.js';
import { UtilEngine } from './UtilEngine.js';
import { UtilCollision } from './UtilCollision.js';
import { Vector } from '../util/Vector.js';

/** A circular arc Edge belonging to a RigidBody.

### Making a CircularEdge

+ If you know the center of the circle use the {@link constructor}:

        new CircularEdge(...)

+ If you know the radius but not the center, use the static method
      {@link CircularEdge.make}.
+ Use {@link lab/engine2D/Polygon.Polygon.addCircularEdge | Polygon.addCircularEdge}
+ Use {@link lab/engine2D/Polygon.Polygon.addCircularEdge2 | Polygon.addCircularEdge2}

### Full Circle

A full circle is a special case detected by the constructor. When `vertex1` and
`vertex2` are at the same location, then we assume a full circle is desired. The two
Vertexes need not be identical, just very close together. In this case, only one of the
Vertexes is kept and there is a single Vertex and single Edge forming the circle.

### Mid-Point Vertexes

See {@link Vertex} for information about why mid-point
Vertexes are created on a CircularEdge and how they are used for collision checking.

### Edge Coordinates

In addition to world and body coordinates, CircularEdge also has 'edge coordinates'
which takes body coordinates but shifts the origin to be the center of the circle that
defines this Edge. For CircularEdge there is no change in angle between edge and body
coords (unlike with an oval edge).

### About Coordinates and Angles

To avoid confusion, be clear about which of these conventions you are dealing with:

+ In myPhysicsLab, **simulation coordinates** uses *y increases up* coordinates
and *angle increases counter-clockwise*.  Also called **world coordinates**.

+ Javascript's **screen coordinates** uses *y increases down* coordinates and *angle
increases clockwise* in `canvas.arc()`.

The transformation between these coordinate systems is handled by
{@link lab/view/CoordMap.CoordMap | CoordMap}.

The table below summarizes the conventions used for angles. CircularEdge uses
the *math convention for angles* shown in this table.

```text
    wall clock         math convention         canvas.arc()

        12      |            pi/2       |           -pi/2
  9          3  |   -pi/pi          0   |  +pi/-pi          0
        6       |           -pi/2       |           +pi/2
```

### Details About Coordinates and Drawing

The *'y increases up'* convention interacts with drawing in Javascript via
{@link CircularEdge.addPath}, and {@link lab/view/DisplayShape.DisplayShape | DisplayShape}.
In DisplayShape we use
the AffineTransform from the CoordMap which applies a negative factor to the vertical
scale as seen in this line of code from CoordMap's constructor:
```js
at = at.scale(this.pixel_per_unit_x_, -this.pixel_per_unit_y_);
```
The result is that all drawing happens *upside down* -- if you were to draw text or
an image with that AffineTransform it will appear upside down.

The two conventions, simulation coords vs. screen coords, cancel out as a "double
negative" when specifying `startAngle`, `finishAngle` and `antiClockwise` arguments to
JavaScript's `canvas.arc()` function.

Note that for `canvas.arc()`, an increase in angle moves in a clockwise direction.
However, because we use *'y increases up'* coordinates, the drawing is flipped
vertically, both of these cancel, and we can use regular 'math' angles with
`canvas.arc()`.

In contrast to `canvas.arc()`, the Javascript `Math.atan2()` function uses standard math
coordinates.
*/
export class CircularEdge extends AbstractEdge implements CurvedEdge, Edge {
  /** true when this is a complete circle */
  private completeCircle_: boolean;
  private decoratedVertexes_: Vertex[];
  /** the angle between decorated Vertexes */
  private decoratedAngle_: number;
  /** depth is used to limit how far a penetration is regarded as a collision.
  * 'depth of arc' is thickest distance between arc and line connecting arc ends.
  */
  private depth_: number;
  /** Any point on the arc falls between angle_low and angle_high,
  * where angle_low < angle_high.
  * Note that angle_low might be startAngle or finishAngle (modulo 2 pi),
  * same with angle_high.
  * In math convention, angle_high is between angle_low and 3 pi.
  */
  private angle_high_: number;
  /** Any point on the arc falls between angle_low and angle_high,
  * where angle_low < angle_high.
  * Note that angle_low might be startAngle or finishAngle (modulo 2 pi),
  * same with angle_high.
  * In math convention, angle_low is between -pi and pi.
  */
  private angle_low_: number;
  /** finish angle, in mathematical body coords
  * (in radians, 0 = 3 o'clock, increase counter-clockwise)
  * startAngle and finishAngle are same in body or edge coords
  */
  private finishAngle_: number;
  /** starting angle, in mathematical body coords
  * (in radians, 0 = 3 o'clock, increase counter-clockwise)
  * startAngle and finishAngle are same in body or edge coords
  */
  private startAngle_: number;
  /** when true, arc goes clockwise from startAngle to finishAngle. */
  private clockwise_: boolean;
  /** radius of the edge;
  * NOTE: radius is positive, but getCurvature() returns negative for concave edge
  */
  private radius_: number;
  /** when true, the outside of the circle is outside of the object. */
  private outsideIsOut_: boolean;
  /** position of the center, in body coords */
  private center_body_: Vector;

/** The Edge starts at `vertex1` (given in body
* coordinates) proceeding along a circular arc with given center to the ending
* `vertex2`. The direction of the arc is given by the `clockwise` parameter.
* When the `outsideIsOut` variable is `true`, the outside of the circle is considered
* the outside of the RigidBody. Both Vertexes must be equidistant from the
* center, otherwise an exception is thrown.
* @param body Edge will be added to this RigidBody
* @param vertex1 Edge starts at this Vertex, given in body coordinates
* @param vertex2 Edge finishes at this Vertex, given in body coordinates
* @param center_body center of the circular arc, in body coordinates
* @param clockwise direction of the arc
* @param outsideIsOut `true` means the region outside of the circle is
*     considered the outside of the RigidBody, so the edge is convex.
*    `False` indicates a concave edge.
* @param opt_spacing the distance between 'decorated' mid-point Vertexes.
* @throws if the Vertexes are not equidistant from the center within
*     `CircularEdge.TINY_POSITIVE` tolerance
* @throws if `vertex1` is already connected to a 'next' Edge
* @throws if `vertex2` is already connected to a 'previous' Edge
*/
constructor(body: RigidBody, vertex1: Vertex, vertex2: Vertex, center_body: Vector, clockwise: boolean, outsideIsOut: boolean, opt_spacing?: number) {
  super(body, vertex1, vertex2);
  this.center_body_ = center_body;
  this.outsideIsOut_ = outsideIsOut;
  this.radius_ = center_body.distanceTo(vertex1.locBody());
  const r2 = vertex2.locBody().distanceTo(center_body);
  if (Math.abs(this.radius_ - r2) > CircularEdge.TINY_POSITIVE) {
    throw 'center is not equidistant from the two end points';
  }
  this.clockwise_ = clockwise;
  this.startAngle_ = vertex1.locBody().subtract(center_body).getAngle();
  this.finishAngle_ = vertex2.locBody().subtract(center_body).getAngle();
  if (Math.abs(this.startAngle_ - this.finishAngle_) < CircularEdge.TINY_POSITIVE) {
    // assume a full circle is desired when vertex1 == vertex2
    this.finishAngle_ = this.startAngle_ + 2*Math.PI;
  }
  const lowHigh = CircularEdge.findAngleLowHigh(this.startAngle_, this.finishAngle_,
      this.clockwise_);
  this.angle_low_ = lowHigh[0];
  this.angle_high_ = lowHigh[1];
  this.depth_ = CircularEdge.findDepth(this.angle_high_ - this.angle_low_,
      this.radius_);
  // find number of Vertexes to add along the edge (for collision checking)
  // min = minimum number of Vertexes = one for every 45 degrees.
  const min = Math.ceil((this.angle_high_ - this.angle_low_)/(Math.PI/4));
  // spacing = distance between Vertexes
  const spacing = (opt_spacing === undefined) ? 0.3 : opt_spacing;
  const n = Math.max(min,
      Math.ceil((this.angle_high_ - this.angle_low_)*this.radius_/spacing));
  const delta = (this.angle_high_ - this.angle_low_)/n;
  this.decoratedAngle_ = delta;
  this.decoratedVertexes_ = [];
  // add Vertexes along the edge (for collision checking)
  for (let i=1; i<n; i++) {
    const angle = this.clockwise_ ?
        this.angle_high_ - i*delta : this.angle_low_ + i*delta;
    const p = new Vector(this.center_body_.getX() + this.radius_*Math.cos(angle),
                       this.center_body_.getY() + this.radius_*Math.sin(angle));
    const v = new ConcreteVertex(p, false, this);
    this.decoratedVertexes_.push(v);
  }
  // add this edge and vertex2 to list of Vertexes and edges
  vertex1.setEdge2(this);
  vertex2.setEdge1(this);

  if (this.angle_high_ - this.angle_low_ >= Math.PI) {
    // if the span of the arc is more than pi, then use the center as centroid
    this.centroid_body_ = this.center_body_;
    this.centroidRadius_ = this.radius_;
  } else {
    //if the span of arc < pi, then centroid = midpoint between arc endpoints
    // which was already calculated by the superclass
    this.centroidRadius_ = this.centroid_body_.distanceTo(vertex1.locBody());
  }
  if (!this.outsideIsOut_) {
    // increase max radius for concave edge, because intersection is when things
    // are outside of the circle.    1.2 is a guess about how far penetration occurs.
    this.centroidRadius_ = 1.2 * this.centroidRadius_;
  }
  this.completeCircle_ = Math.abs(2*Math.PI - (this.angle_high_ - this.angle_low_)) <
      CircularEdge.SMALL_POSITIVE;
};

override toString() {
  return super.toString()
      +', outsideIsOut_: '+this.outsideIsOut_
      +', clockwise_: '+this.clockwise_
      +', center_body_: '+this.center_body_
      +', radius_: '+Util.NF5(this.radius_)
      +', startAngle_: '+Util.NF5(this.startAngle_)
      +', finishAngle_: '+Util.NF5(this.finishAngle_)
      +', angle_low_: '+Util.NF5(this.angle_low_)
      +', angle_high_: '+Util.NF5(this.angle_high_)
      +'}';
};

/**  Creates a CircularEdge between the given Vertexes with the given radius,
calculating the position of the center, and adds the edge to the given RigidBody.

Calculates the center to be at the vertex of an isoceles triangle with the given
Vertexes, where the center is `radius` distance from each Vertex.

There are two choices for where to put the center in relation to the line connecting
the two given Vertexes: either above or below the line. The `aboveRight` parameter
specifies which choice to make. For a vertical connecting line, the choice is right or
left of the line.

@param body edge will be added to this RigidBody
@param vertex1 edge starts at this Vertex, given in body coordinates
@param vertex2 edge finishes at this Vertex, given in body coordinates
@param radius the radius of the circular arc
@param aboveRight if true, then the center of CircularEdge is located
    above or right of the line connecting `vertex1` and `vertex2`; if false,
    then center is located below or left of the connecting line.
@param clockwise direction of the arc
@param outsideIsOut true means the outside of the circle is considered the
    outside of the RigidBody.
@return the CircularEdge that is created
@throws if absolute value of `radius` is too small; must be greater than half
    the distance between the two Vertexes
@throws if `vertex1` is already connected to a 'next' Edge
@throws if `vertex2` is already connected to a 'previous' Edge
*/
static make(body: RigidBody, vertex1: Vertex, vertex2: Vertex, radius: number, aboveRight: boolean, clockwise: boolean, outsideIsOut: boolean): CircularEdge {
  // find center
  let cx, cy;
  // find midpoint of line between vertex1 and vertex2
  const mx = (vertex1.locBodyX() + vertex2.locBodyX())/2;
  const my = (vertex1.locBodyY() + vertex2.locBodyY())/2;
  // distance from vertex1 to midpoint
  const a = Util.hypot(vertex1.locBodyX() - mx, vertex1.locBodyY() - my);
  const d = radius*radius - a*a;
  if (d < CircularEdge.TINY_POSITIVE) {
    throw 'radius '+radius+' is too small, must be >= '+a;
  }
  // distance from midpoint to center
  const b = Math.sqrt(d);
  // if Vertexes are on a vertical line
  if (Math.abs(vertex2.locBodyX() - vertex1.locBodyX()) < CircularEdge.TINY_POSITIVE) {
    // if aboveRight, then center is to right of line segment (for vertical line)
    // Because Vertexes are on a vertical line, it is easy to find the center.
    if (aboveRight) {
      cx = b + mx;
      cy = my;
    } else {
      cx = -b + mx;
      cy = my;
    }
  } else {
    // slope of line from vertex1 to vertex2
    const k = (vertex2.locBodyY() - vertex1.locBodyY())/
            (vertex2.locBodyX() - vertex1.locBodyX());
    /* location of center
      center is on the line from midpoint, perpendicular to line from vertex1 to vertex2
        y - my = (-1/k) (x - mx)
      distance from midpoint to center is b
        b^2 = (x - mx)^2 + (y - my)^2
      Solving those two equations for x and y, we get:
                         b k                       b
            {{x -> -(------------) + mx, y -> ------------ + my},
                               2                        2
                     Sqrt[1 + k ]             Sqrt[1 + k ]

                        b k                        b
              {x -> ------------ + mx, y -> -(------------) + my}}
                              2                         2
                    Sqrt[1 + k ]              Sqrt[1 + k ]
      our convention is:  if aboveRight==true, center is 'above' the line segment.
      bk2 > 0, so the first solution is for aboveRight
    */
    const bk2 = b/Math.sqrt(1 + k*k);
    if (aboveRight) {
      cx = -k*bk2 + mx;
      cy = bk2 + my;
    } else {
      cx = k*bk2 + mx;
      cy = -bk2 + my;
    }
  }
  return new CircularEdge(body, vertex1, vertex2, new Vector(cx, cy), clockwise,
      outsideIsOut);
};

/** @inheritDoc */
addPath(context: CanvasRenderingContext2D): void {
  // We draw the path in DisplayShape after transforming coordinates to body
  // coordinates. See notes above about coordinates and angle conventions.
  // Basically this is a 'double-negative'
  // situation where two different conventions about angles and 'y increases up'
  // cancel out.  However, the 'anticlockwise' argument is flipped.
  context.arc(this.center_body_.getX(), this.center_body_.getY(), this.radius_,
      this.startAngle_, this.finishAngle_, this.clockwise_);
};

/** Returns the location on this CircularEdge corresponding to the given angle,
* in body coordinates.
* @param angle in edge coords
* @return location on this CircularEdge in body coords
*/
angleToBody(angle: number): Vector {
  return this.edgeToBody(
      new Vector(this.radius_*Math.cos(angle), this.radius_*Math.sin(angle)));
};

/** Converts from body coordinates to edge coordinates.
* @param p_body a point in body coordinates
* @return the same point in edge coordinates
*/
bodyToEdge(p_body: Vector): Vector {
  return p_body.subtract(this.center_body_);
};

/** @inheritDoc */
chordError(): number {
  // form a triangle between two decorated Vertexes and the center.
  // angle between Vertexes is α
  // Length of chord is approx α r.
  // Form right triangle bisecting the chord.
  // Length of the short edge of right triangle is α r/2.
  // Length of hypotenuse of right triangle is r.
  // Length of long edge is sqrt(r^2 - (α r/2)^2) = r sqrt(1 - α^2/4)
  // Length of chord error is r - r sqrt(1 - α^2/4).
  return this.radius_ *
      (1 - Math.sqrt(1 - this.decoratedAngle_*this.decoratedAngle_/4.0));
};

/** Returns the thickest distance between arc and the line between the end points of
this curved Edge. Depth of arc is used to limit how far a penetration can be and still
be regarded as a collision.
@return the thickest distance between arc and line connecting arc ends
*/
depthOfArc(): number {
  return this.depth_;
};

/** @inheritDoc */
distanceToEdge(edge: Edge): number {
  if (edge instanceof StraightEdge) {
    const cw = this.body_.bodyToWorld(this.center_body_);  // Center World coords
    const cb = edge.getBody().worldToBody(cw);  // Center Body coords
    let d = edge.distanceToLine(cb);
    d -= this.radius_;
    return d;
  } else if (edge instanceof CircularEdge) {
    const cw = edge.getBody().bodyToWorld(edge.center_body_);
    const cb = this.body_.worldToBody(cw);
    const p_edge = this.bodyToEdge(cb);
    if (!this.isWithinArc(p_edge)) {
      return NaN;
    }
    const len = p_edge.length();
    const r1 = (edge.outsideIsOut_ ? 1 : -1)*edge.radius_;
    const r2 = (this.outsideIsOut_ ? 1 : -1)*this.radius_;
    const concave = !edge.outsideIsOut_ || !this.outsideIsOut_;
    return concave ? Math.abs(r1 + r2) - len : len - (r1 + r2);
  } else {
    throw '';
  }
};

/** @inheritDoc */
distanceToLine(p_body: Vector): number {
  //The extended line is taken to be the full circle for this Circular Edge.
  const p_edge = this.bodyToEdge(p_body);
  return (this.outsideIsOut_ ? 1 : -1)*(p_edge.length() - this.radius_);
};

/** @inheritDoc */
distanceToPoint(p_body: Vector): number {
  const p_edge = this.bodyToEdge(p_body);
  if (this.isWithinArc(p_edge)) {
    return (this.outsideIsOut_ ? 1 : -1)*(p_edge.length() - this.radius_);
  } else {
    return Infinity;
  }
};

/** Converts from edge coordinates to body coordinates.
* @param p_edge a point in edge coordinates
* @return the same point in body coordinates
*/
edgeToBody(p_edge: Vector): Vector {
  return p_edge.add(this.center_body_);
};

/** Converts from edge coordinates to world coordinates.
* @param p_edge a point in edge coordinates
* @return the same point in world coordinates
*/
edgeToWorld(p_edge: Vector): Vector {
  return this.body_.bodyToWorld(p_edge.add(this.center_body_));
};

/** Converts the start and finish angles of an arc to a pair of angles such that all of
* the arc is within that pair of angles.
* @param startAngle starting angle, math convention
* @param finishAngle finish angle, math convention
* @param clockwise true means arc goes clockwise in math convention
* @return pair of angles, low and high, such that all of the arc is
*     within that pair of angles.
*/
private static findAngleLowHigh(startAngle: number, finishAngle: number, clockwise: boolean): number[] {
  let angle_low, angle_high;
    // for future convenience, find angle_low, angle_high
  if (Math.abs(startAngle - finishAngle) < CircularEdge.TINY_POSITIVE) {
    // this is a full circle
    angle_low = startAngle;
    angle_high = angle_low + 2*Math.PI;
  } else if (Math.abs(Math.abs(startAngle - finishAngle) - 2*Math.PI) <
      CircularEdge.TINY_POSITIVE) {
    // this is a full circle
    angle_low = Math.min(startAngle, finishAngle);
    angle_high = angle_low + 2*Math.PI;
  } else if (startAngle > finishAngle) {
    if (clockwise) {
      angle_low = finishAngle;
      angle_high = startAngle;
    } else {
      angle_low = startAngle;
      angle_high = finishAngle + 2*Math.PI;
    }
  } else {
    if (clockwise) {
      angle_low = finishAngle;
      angle_high = startAngle + 2*Math.PI;
    } else {
      angle_low = startAngle;
      angle_high = finishAngle;
    }
  }
  return [angle_low, angle_high];
};

/** Returns 'depth of arc' which is maximum distance between arc and line connecting
arc ends.
```text
Derivation:
On unit circle, let arc start at
  A = [1, 0]
and extend counter clockwise along circle to
  B = [cos theta, sin theta].
Draw a line between those two points, A and B.
Let C be the midpoint of that line. C is at:
  C = [(1 + cos theta)/2, sin theta / 2 ].
Distance between C and (cos theta/2, sin theta/2) is the depth.
```
@param angle angle of arc, in radians
@param radius radius of circle that arc is part of
@return maximum distance between arc and line connecting arc ends
*/
private static findDepth(angle: number, radius: number): number {
  const d1 = Math.sin(angle/2) - Math.sin(angle)/2;
  const d2 = Math.cos(angle/2) - (1 + Math.cos(angle))/2;
  return radius * Math.sqrt(d1*d1 + d2*d2);
};

/** @inheritDoc */
findVertexContact(v: Vertex, p_body: Vector, distTol: number): null|RigidBodyCollision {
  // p_edge = point in edge coords
  const p_edge = this.bodyToEdge(p_body);
  // is p_edge is beyond endpoints of this edge segment?
  if (!this.isWithinArc(p_edge))
    return null;
  const h = p_edge.length();
  const dist = (this.outsideIsOut_ ? 1 : -1)*(h - this.radius_);
  // is the point near enough?
  if (dist < 0 || dist > distTol)
    return null;
  const rbc = new CornerEdgeCollision(v, this);
  rbc.distance = dist;
  if (h < CircularEdge.TINY_POSITIVE)
    throw 'cannot get normal for point at center of circle';
  // ne = normal in edge coords (concave has reversed normal)
  const ne = p_edge.multiply((this.outsideIsOut_ ? 1 : -1) * (1/h));
  // note: because bodyToEdge does not rotate, the normal is same in edge or body coords
  // nw = normal in world coords
  rbc.normal = this.body_.rotateBodyToWorld(ne);
  Util.assert( Math.abs(rbc.normal.length() - 1.0) < 1e-8 );
  // find point on circle nearest to vertex: at center + radius * normal
  rbc.radius2 = (this.outsideIsOut_ ? 1 : -1)*this.radius_;
  // Add half of the gap distance to the radius, for better accuracy in contact
  // force calculation (improves stability of contact distance).
  rbc.radius2 += dist;
  // rw = near point on circle in world coords
  const rw = this.body_.bodyToWorld(this.edgeToBody(ne.multiply(rbc.radius2)));
  // Alternative idea: set impact to the vertex and impact2 to point on circle edge,
  // then use impact2 to calculate R2.
  rbc.impact1 = rw;
  //rbc.impact2 = rw;  // point on circle edge
  rbc.ballNormal = true;
  rbc.radius1 = v.getCurvature();
  rbc.creator = Util.DEBUG ? 'CircularEdge.findVertexContact' : '';
  return rbc;
};

/** @inheritDoc */
getBottomBody(): number {
  let angle = -Math.PI/2;
  angle += angle < this.angle_low_ ? 2*Math.PI : 0;
  if (this.angle_low_ <= angle && angle <= this.angle_high_) {
    return this.center_body_.getY() - this.radius_;
  } else {
    return this.v1_.locBodyY() < this.v2_.locBodyY() ?
        this.v1_.locBodyY() : this.v2_.locBodyY();
  }
};

/** @inheritDoc */
getCenterBody(_p_body?: Vector): Vector {
  return this.center_body_;
};

/** @inheritDoc */
getClassName(): string {
  return 'CircularEdge';
};

/** @inheritDoc */
getCurvature(_p_body: Vector): number {
  return (this.outsideIsOut_ ? 1 : -1)*this.radius_;
};

/** @inheritDoc */
override getDecoratedVertexes(): Vertex[] {
  return this.decoratedVertexes_;
};

/** @inheritDoc */
getLeftBody(): number {
  let angle = Math.PI;
  angle += angle < this.angle_low_ ? 2*Math.PI : 0;
  if (this.angle_low_ <= angle && angle <= this.angle_high_) {
    return this.center_body_.getX() - this.radius_;
  } else {
    return this.v1_.locBodyX() < this.v2_.locBodyX() ?
        this.v1_.locBodyX() : this.v2_.locBodyX();
  }
};

/** @inheritDoc */
getNormalBody(p_body: Vector): Vector {
  const p_edge = this.bodyToEdge(p_body);
  const h = p_edge.length();
  if (h < CircularEdge.TINY_POSITIVE) {
    throw Util.DEBUG ? ('cannot get normal at point '+p_body) : '';
  }
  // note: because bodyToEdge does not rotate, the normal is same in edge or body coords
  return p_edge.multiply(this.outsideIsOut_ ? 1/h : -1/h);
};

/** @inheritDoc */
getPointOnEdge(p_body: Vector): Vector[] {
  const n = this.getNormalBody(p_body);
  const r = (this.outsideIsOut_ ? 1 : -1)* this.radius_;
  const p = this.edgeToBody(n.multiply(r));
  return [p, n];
};

/** Returns radius of the edge. Radius is always positive, but
* {@link getCurvature} returns negative for concave edge.
* @return radius of the edge
*/
getRadius(): number {
  return this.radius_;
};

/** @inheritDoc */
getRightBody(): number {
  let angle = 0;
  angle += angle < this.angle_low_ ? 2*Math.PI : 0;
  if (this.angle_low_ <= angle && angle <= this.angle_high_) {
    return this.center_body_.getX() + this.radius_;
  } else {
    return this.v1_.locBodyX() > this.v2_.locBodyX() ?
        this.v1_.locBodyX() : this.v2_.locBodyX();
  }
};

/** @inheritDoc */
getTopBody(): number {
  let angle = Math.PI/2;
  angle += angle < this.angle_low_ ? 2*Math.PI : 0;
  if (this.angle_low_ <= angle && angle <= this.angle_high_) {
    return this.center_body_.getY() + this.radius_;
  } else {
    return this.v1_.locBodyY() > this.v2_.locBodyY() ?
        this.v1_.locBodyY() : this.v2_.locBodyY();
  }
};

/** @inheritDoc */
highlight(): void {};

/** @inheritDoc */
improveAccuracyEdge(rbc: RigidBodyCollision, edge: Edge): void {
  if (edge instanceof StraightEdge) {
    CircleStraight.improveAccuracy(rbc, this, edge);
  } else if (edge instanceof CircularEdge) {
    if (rbc.getNormalBody() == edge.getBody()) {
      CircleCircle.improveAccuracy(rbc, this, edge);
    } else {
      CircleCircle.improveAccuracy(rbc, edge, this);
    }
  } else {
    throw '';
  }
};

/** @inheritDoc */
intersection(p1_body: Vector, p2_body: Vector): Vector[]|null {
  if (p1_body == p2_body) {
    return null;
  }
  // pe1, pe2 = points in edge coords
  const pe1 = this.bodyToEdge(p1_body);
  const pe2 = this.bodyToEdge(p2_body);
  // qe1, qe2 = intersection points on oval in edge coords
  let qe1 = null;
  let qe2 = null;
  // find the point of intersection on the complete circle
  if (Math.abs(pe2.getX() - pe1.getX())<CircularEdge.TINY_POSITIVE) {
    // vertical line is special case
    const x = (pe1.getX() + pe2.getX())/2;  // average x coordinate, just in case
    if (Math.abs(x) > this.radius_) {
      return null;
    }
    const y = Math.sqrt(this.radius_*this.radius_ - x*x);
    const ylow = pe1.getY() < pe2.getY() ? pe1.getY() : pe2.getY();
    const yhigh = pe1.getY() > pe2.getY() ? pe1.getY() : pe2.getY();
    if (ylow <= y && y <= yhigh)
      qe1 = new Vector(x, y);
    if (ylow <= -y && -y <= yhigh)
      qe2 = new Vector(x, -y);
  } else {
    // equation for line from p1 to p2:
    //   y - p1.y = k (x - p1.x)
    //   where k = slope = (p2.y - p1.y) / (p2.x - p1.x)
    // find the point on this line that is distance radius from center:
    //   radius^2 = x^2 + y^2
    // solve both equations
    /*
                                                  2         2   2
             p1y - k (p1x + Sqrt[-(-(k p1x) + p1y)  + (1 + k ) r ])
      {{y -> ------------------------------------------------------,
                                          2
                                     1 + k

                                                           2         2   2
                k (-(k p1x) + p1y) + Sqrt[-(-(k p1x) + p1y)  + (1 + k ) r ]
         x -> -(-----------------------------------------------------------)},
                                               2
                                          1 + k

                                                    2         2   2
              p1y + k (-p1x + Sqrt[-(-(k p1x) + p1y)  + (1 + k ) r ])
        {y -> -------------------------------------------------------,
                                           2
                                      1 + k

               2                                     2         2   2
              k  p1x - k p1y + Sqrt[-(-(k p1x) + p1y)  + (1 + k ) r ]
         x -> -------------------------------------------------------}}
                                           2
                                      1 + k
    */
    const k = (pe2.getY() - pe1.getY())/(pe2.getX() - pe1.getX());
    const k12 = 1 + k*k;
    const d = pe1.getY() - k*pe1.getX();
    let e = k12*this.radius_*this.radius_ - d*d;
    if (e < 0) {
      return null;
    }
    e = Math.sqrt(e);
    const x1 = -(k*d + e)/k12;
    const x2 = (k*(-d) + e)/k12;
    const y1 = (d - k*e)/k12;
    const y2 = (d + k*e)/k12;
    const xlow = pe1.getX() < pe2.getX() ? pe1.getX() : pe2.getX();
    const xhigh = pe1.getX() > pe2.getX() ? pe1.getX() : pe2.getX();
    const ylow = pe1.getY() < pe2.getY() ? pe1.getY() : pe2.getY();
    const yhigh = pe1.getY() > pe2.getY() ? pe1.getY() : pe2.getY();
    if (xlow <= x1 && x1 <= xhigh && ylow <= y1 && y1 <= yhigh) {
      qe1 = new Vector(x1, y1);
    }
    if (xlow <= x2 && x2 <= xhigh && ylow <= y2 && y2 <= yhigh) {
      qe2 = new Vector(x2, y2);
    }
  }
  // qb1, qb2 = intersection points in body coords
  let qb1 = null;
  let qb2 = null;
  // are the points we found on the circle within the arc of this edge?
  if (qe1 != null && this.isWithinArc(qe1)) {
    qb1 = this.edgeToBody(qe1);
  }
  if (qe2 != null && this.isWithinArc(qe2)) {
    qb2 = this.edgeToBody(qe2);
  }
  // box up the points into an array of points
  if (qb1==null && qb2==null) {
    return null;
  }
  if (qb1!=null && qb2!=null) {
    return [qb1, qb2];
  }
  if (qb1!=null) {
    return [qb1];
  }
  if (qb2===null) throw '';
  return [qb2];
};

/** @inheritDoc */
isStraight(): boolean {
  return false;
};

/**
@param p_edge the point of interest, in edge coordinates.
@param angleLow
@param angleHigh
@return true if the given point is within this arc.
*/
private static isWithinArc(p_edge: Vector, angleLow: number, angleHigh: number): boolean {
  Util.assert(!isNaN(p_edge.getX()));
  Util.assert(!isNaN(p_edge.getY()));
  let angle = p_edge.getAngle();
  if (angle < angleLow) {
    angle += 2*Math.PI;
  }
  return angleLow <= angle && angle <= angleHigh;
};

/** Returns true if the angle of the given point is within this arc. Looks at the angle
from the origin to the point, compares this angle to the angle range of this arc.
@param p_edge the point of interest, in edge coordinates.
@return true if the given point is within this arc.
*/
isWithinArc(p_edge: Vector): boolean {
  if (this.completeCircle_) {
    return true;
  }
  return CircularEdge.isWithinArc(p_edge, this.angle_low_, this.angle_high_);
};

/** Returns true if the angle of the given point is within this arc. Looks at the angle
from the origin to the point, compares this angle to the angle range of this arc.
@param p_world the point of interest, in world coordinates.
@return true if the given point is within this arc.
*/
isWithinArc2(p_world: Vector): boolean {
  if (this.completeCircle_) {
    return true;
  }
  const p_edge = this.bodyToEdge(this.body_.worldToBody(p_world));
  return CircularEdge.isWithinArc(p_edge, this.angle_low_, this.angle_high_);
};

/** Returns true if the angle of the given point is within the reflection of this arc
through the center. Looks at the angle from the origin to the point, compares this angle
to the angle range of the reflected arc.

Examples of reflected arcs:

+ If the arc goes from 0 to pi/4, then the reflected arc goes from pi to 5 pi/4.
+ If the arc goes from 0 to 3 pi/2, then the reflected arc goes from pi to 5 pi/2.

@param p_edge the point of interest, in edge coordinates.
@return true if the given point is within the reflected arc.
*/
isWithinReflectedArc(p_edge: Vector): boolean {
  if (p_edge==null) {
    return false;
  }
  let angle = p_edge.getAngle();
  while (angle < this.angle_low_ + Math.PI) {
    angle += 2*Math.PI;
  }
  return this.angle_low_ + Math.PI <= angle && angle <= this.angle_high_ + Math.PI;
};

/** Returns true if the angle of the given point is within the reflection of this arc
through the center. Same as {@link isWithinReflectedArc}
but accepts a point in world coordinates.

@param p_world the point of interest, in world coordinates.
@return true if the given point is within the reflected arc.
*/
isWithinReflectedArc2(p_world: Vector): boolean {
  return this.isWithinReflectedArc(this.bodyToEdge(this.body_.worldToBody(p_world)));
};

/** @inheritDoc */
maxDistanceTo(p_body: Vector): number {
  // **TO DO**  This is a worst case, over-estimated distance (awful for concave arc),
  // this could be greatly improved by actually doing the calculation.
  return this.center_body_.distanceTo(p_body) + this.radius_;
};

/** Finds the 'nearest' point (by angle) on this arc to the given point p_body.

+ If the angle to p_body is within the arc, return p_body unchanged.
+ If the angle to p_body is outside of the arc, return the nearest endpoint of the arc.
@param p_body  the point of interest, in body coordinates
@return the nearest point (by angle) on this arc to the given point,
    in body coordinates
*/
nearestPointByAngle(p_body: Vector): Vector {
  const angle = this.bodyToEdge(p_body).getAngle();
  const angle2 = angle + (angle < this.angle_low_ ? 2*Math.PI : 0);
  if (this.angle_low_ <= angle2 && angle2 <= this.angle_high_) {
    return p_body;
  } else {
    // angle is outside of arc;  find which corner is the point closest to
    const d1 = angle < this.angle_low_ ?
        this.angle_low_ - angle : this.angle_low_ - (angle - 2*Math.PI);
    const d2 = angle > this.angle_high_ ?
        angle - this.angle_high_ : (2*Math.PI + angle) - this.angle_high_;
    const angle_new = d1 < d2 ? this.angle_low_ : this.angle_high_;
    const qb2 = this.angleToBody(angle_new);
    /*if (0 == 1 && Util.DEBUG) {
      console.log('nearestOldPointTo angle '+Util.NF5(angle)+' became '
          +Util.NF5(angle_new)+' body '+p_body+' became '+qb2);
    }*/
    return qb2;
  }
};

/** Returns `true` when the region outside of the circle is outside of the object,
meaning the edge is convex. Returns `false` for a concave edge.
@return `true` means the region outside of the circle is outside of the object.
*/
outsideIsOut(): boolean {
  return this.outsideIsOut_;
};

/** @inheritDoc */
testCollisionEdge(collisions: RigidBodyCollision[], edge: Edge, time: number): void {
  if (edge instanceof StraightEdge) {
    if (Util.DEBUG) {
      UtilCollision.edgeEdgeCollisionTests++;
    }
    CircleStraight.testCollision(collisions, edge, this, time);
  } else if (edge instanceof CircularEdge) {
    if (Util.DEBUG) {
      UtilCollision.edgeEdgeCollisionTests++;
    }
    CircleCircle.testCollision(collisions, edge, this, time);
  } else {
    throw '';
  }
};

static SMALL_POSITIVE = 1E-6;

} // end CircularEdge class

Util.defineGlobal('lab$engine2D$CircularEdge', CircularEdge);


// ***************************  CircleStraight  *********************************

/** Provides static functions for handling interactions between
{@link CircularEdge} and {@link StraightEdge}.

**TO DO** Perhaps nearestPointByAngle is not needed in testCollision? Instead just
reject the edge-edge collision if not both the new and old impact points are within the
arc of the circle.
*/
class CircleStraight {

constructor() {
  throw '';
};

/** Updates the EdgeEdgeCollision to have more accurate information based on current
* positions and velocities of the RigidBodys.
* @param rbc
* @param circle
* @param straight
*/
static improveAccuracy(rbc: RigidBodyCollision, circle: CircularEdge, straight: StraightEdge) {
  const circleBody = circle.getBody();
  const straightBody = straight.getBody();
  Util.assert( rbc.getPrimaryBody() == circleBody);
  Util.assert( rbc.getNormalBody() == straightBody);
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
  /*if (0 == 1 && Util.DEBUG) {
    console.log('CircleStraight.improveAccuracy '
      +Util.NF7(oldX)+' '
      +Util.NF7(oldY)+' -> '
      +Util.NF7(rbc.impact1.getX())+' '
      +Util.NF7(rbc.impact1.getY())+' '
      );
  }*/
};

/** Tests the positions and velocities of the two Edges, and if a collision or contact
* is detected, adds an EdgeEdgeCollision to the given array.
* @param collisions any new collision will be added to this array
* @param straight
* @param circle
* @param time current simulation time
*/
static testCollision(collisions: RigidBodyCollision[], straight: StraightEdge, circle: CircularEdge, time: number) {
  if (UtilCollision.DISABLE_EDGE_EDGE)
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
    if (dist2 == Infinity) { // center is not 'next to' the edge
      return;
    }
    Util.assert( Math.abs(dist - dist2) < 1e-8 );
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
  /*if (0 == 1 && Util.DEBUG && UtilEngine.debugEngine2D != null) {
    // add a visible dot
    const t = straight.getBody().bodyToWorld(r[0]);
    UtilEngine.debugEngine2D.debugCircle('dot', t, 0.08);
  }*/
  CircleStraight.addCollision(/*contact=*/false, collisions, straight, circle, dist,
       pw, pb, time);
};

/**
* @param contact whether to make a contact (true) or collision (false)
* @param collisions
* @param straight
* @param circle
* @param dist
* @param pw
* @param pb
* @param time current simulation time
*/
private static addCollision(contact: boolean, collisions: RigidBodyCollision[], straight: StraightEdge, circle: CircularEdge, dist: number, pw: Vector, pb: Vector, time: number) {
  const rbc = new EdgeEdgeCollision(circle, straight);
  Util.assert( circle.outsideIsOut() );
  rbc.ballNormal = false;
  rbc.ballObject = true;
  rbc.radius1 = circle.getRadius();
  rbc.radius2 = Infinity;
  Util.assert( rbc.radius1 > 0 );  // only convex circles here.
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
  UtilCollision.addCollision(collisions, rbc);
};

} // end CircleStraight class


// ***************************  CircleCircle  *********************************

/**  Provides static functions for handling interactions between two
{@link CircularEdge}'s.
*/
class CircleCircle {

constructor() {
  throw '';
};

/** Updates the EdgeEdgeCollision to have more accurate information based on current
* positions and velocities of the RigidBodys.
* @param rbc the collision to update
* @param other
* @param normalCircle
*/
static improveAccuracy(rbc: RigidBodyCollision, other: CircularEdge, normalCircle: CircularEdge) {
  const otherBody = other.getBody();
  const normalBody = normalCircle.getBody();
  Util.assert( rbc.getPrimaryBody() == otherBody);
  Util.assert( rbc.getNormalBody() == normalBody);
  const oldX = rbc.impact1.getX();
  const oldY = rbc.impact1.getY();
  //if (0 == 1 && Util.DEBUG) console.log('before improveAccuracy '+rbc);
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
  const cnw = normalBody.bodyToWorld(normalCircle.getCenterBody());
  // cow = center of other in world coords
  const cow = otherBody.bodyToWorld(other.getCenterBody());
  // cob = center of other in normalCircle's body coords
  const cob = normalBody.worldToBody(cow);
  // coe = center of other in normalCircle's edge coords
  const coe = normalCircle.bodyToEdge(cob);
  const len = coe.length();
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
  /*if (0 == 1 && rbc.distance > 0) {
    console.log('cnw '+cnw);
    console.log('cow '+cow);
    console.log('cob '+cob);
    console.log('coe '+coe);
    console.log('len '+len);
    console.log('other circle '+other);
    console.log('normal circle '+normalCircle);
    throw Util.DEBUG ? ('distance should be negative '+rbc) : '';
  }*/
  // ne = normal in normalCircle's edge coords
  let ne = coe.multiply(1/len);
  // pw = point of impact in world coords
  const pw = normalCircle.edgeToWorld(ne.multiply(normalCircle.getRadius()));
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
  /*if (0 == 1 && Util.DEBUG) {
    console.log('CircleCircle.improveAccuracy '
      +Util.NF7(oldX)+' '
      +Util.NF7(oldY)+' -> '
      +Util.NF7(rbc.impact1.getX())+' '
      +Util.NF7(rbc.impact1.getY())+' '
      );
  }*/
  //if (0 == 1 && Util.DEBUG) console.log('after improveAccuracy '+rbc);
};

/** Tests the positions and velocities of the two Edges, and if a collision or contact
is detected, adds an EdgeEdgeCollision to the given array.

Note that Circle/Circle collision testing ***does not check old body position*** at
all; it’s only a static check for penetration. However, if we are using *midpoint
Vertexes* on CircularEdge (which is the default), then those Vertexes ***will*** get
the old body position treatment during Vertex/Edge collision testing; this will catch a
fast collision. Then, as the collision binary search gets close in time to the
collision, the circle/circle test will kick in and take over because it has better
precision than the Vertex/Edge testing. However, if we are 'handling imminent
collisions' then we are likely to just handle the Vertex/Edge collision and never reach
the more precise Edge/Edge calculation.

@param collisions any new collision will be added to this array
@param self
@param other
@param time current simulation time
*/
static testCollision(collisions: RigidBodyCollision[], self: CircularEdge, other: CircularEdge, time: number) {
  if (UtilCollision.DISABLE_EDGE_EDGE)
    return;
  if (!self.outsideIsOut() && !other.outsideIsOut()) {
    // both edges are concave, so there is no possible collision point
    return;
  } else if (self.outsideIsOut() && other.outsideIsOut()) { // both edges are convex
    // csw = center of self in world coords
    const csw = self.getBody().bodyToWorld(self.getCenterBody());
    // the center of other arc must be within self arc, and vice versa
    if (!other.isWithinArc2(csw))
      return;
    // cow = center of other in world coords
    const cow = other.getBody().bodyToWorld(other.getCenterBody());
    // cob = center of other in self's body coords
    const cob = self.getBody().worldToBody(cow);
    // coe = center of other in self's edge coords
    const coe = self.bodyToEdge(cob);
    if (!self.isWithinArc(coe))
      return;
    const len = coe.length();
    const r1 = other.getRadius();
    const r2 = self.getRadius();
    // if distance between the center of self circle and center of the other circle is
    // less than sum of the radiuses, then collision.
    // distance between edges.  Negative implies penetration.
    const distance = len - (r1 + r2);
    if (distance > self.getBody().getDistanceTol())
      return;
    if (distance > 0) {
      CircleCircle.addCollision(/*contact=*/true, collisions, self, other,
        distance, len, coe, time);
      return;
    }
    const maxDepth = other.depthOfArc() > self.depthOfArc() ?
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
    Util.assert( self.outsideIsOut() != other.outsideIsOut() );
    const convex = self.outsideIsOut() ? self : other;
    const concave = self.outsideIsOut() ? other : self;
    // must have concave radius > convex radius
    if (convex.getRadius() > concave.getRadius()) {
      return;
    }
    // u = concave, n = convex
    // (analogy to convex/convex:  self = concave = u;  other = convex = n)
    // cuw = center of concave in world coords
    const cuw = concave.getBody().bodyToWorld(concave.getCenterBody());
    // the center of concave must be within reflected arc of convex
    if (!convex.isWithinReflectedArc2(cuw))
      return;
    // cnw = center of convex in world coords
    const cnw = convex.getBody().bodyToWorld(convex.getCenterBody());
    // cnb = center of convex in concave body coords
    const cnb = concave.getBody().worldToBody(cnw);
    // cne = center of convex in concave edge coords
    const cne = concave.bodyToEdge(cnb);
    // the center of convex must be within arc of concave
    if (!concave.isWithinArc(cne))
      return;
    const len = cne.length();
    // Find distance between curved edges.
    // distance between edges.  Negative implies penetration.
    const distance = concave.getRadius() - convex.getRadius() - len;
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
* @param contact  whether to make a contact (true) or collision (false)
* @param collisions
* @param self
* @param other
* @param distance
* @param len
* @param coe
* @param time current simulation time
*/
private static addCollision(contact: boolean, collisions: RigidBodyCollision[], self: CircularEdge, other: CircularEdge, distance: number, len: number, coe: Vector, time: number) {
  const rbc = new EdgeEdgeCollision(other, self);
  rbc.distance = distance;
  rbc.ballNormal = true;
  rbc.ballObject = true;
  rbc.creator = Util.DEBUG ? 'CircleCircle' : '';
  // ne = normal in self's edge coords
  let ne = coe.multiply(1/len);
  // pw = point of impact in world coords
  const pw = self.edgeToWorld(ne.multiply(self.getRadius()));
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
  UtilCollision.addCollision(collisions, rbc);
};

} // end CircleCircle class
