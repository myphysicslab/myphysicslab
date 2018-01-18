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

goog.provide('myphysicslab.lab.engine2D.CircularEdge');

goog.require('myphysicslab.lab.engine2D.AbstractEdge');
goog.require('myphysicslab.lab.engine2D.CircleCircle');
goog.require('myphysicslab.lab.engine2D.CircleStraight');
goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
goog.require('myphysicslab.lab.engine2D.CornerEdgeCollision');
goog.require('myphysicslab.lab.engine2D.StraightEdge');
goog.require('myphysicslab.lab.engine2D.UtilityCollision');
goog.require('myphysicslab.lab.engine2D.Vertex');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var AbstractEdge = myphysicslab.lab.engine2D.AbstractEdge;
var CircleCircle = myphysicslab.lab.engine2D.CircleCircle;
var CircleStraight = myphysicslab.lab.engine2D.CircleStraight;
var ConcreteVertex = myphysicslab.lab.engine2D.ConcreteVertex;
var CornerEdgeCollision = myphysicslab.lab.engine2D.CornerEdgeCollision;
var StraightEdge = myphysicslab.lab.engine2D.StraightEdge;
var UtilityCollision = myphysicslab.lab.engine2D.UtilityCollision;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var Vertex = myphysicslab.lab.engine2D.Vertex;

/** A circular-arc Edge belonging to a Polygon.

### Making a CircularEdge

+ If you know the center of the circle use the constructor: `new CircularEdge(...)`.
+ If you know the radius but not the center, use the static method {@link #make}.
+ Use {@link myphysicslab.lab.engine2D.Polygon#addCircularEdge}
+ Use {@link myphysicslab.lab.engine2D.Polygon#addCircularEdge2}

For the CircularEdge constructor, the Edge starts at `vertex1` (given in body
coordinates) proceeding along a circular arc with given center to the ending `vertex2`.
The direction of the arc is given by the `clockwise` parameter. When the `outsideIsOut`
variable is `true`, the outside of the circle is considered the outside of the Polygon.
Both Vertexes must be equidistant from the center, otherwise an exception is thrown.

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
{@link myphysicslab.lab.view.CoordMap}.

The table below summarizes the conventions used for angles. CircularEdge uses
the *math convention for angles* shown in this table.

<pre>
    wall clock         math convention         canvas.arc()

        12      |            pi/2       |           -pi/2
  9          3  |   -pi/pi          0   |  +pi/-pi          0
        6       |           -pi/2       |           +pi/2
</pre>


### Details About Coordinates and Drawing

The *'y increases up'* convention interacts with drawing in Javascript via
{@link #addPath}, and {@link myphysicslab.lab.view.DisplayShape}. In DisplayShape we use
the AffineTransform from the CoordMap which applies a negative factor to the vertical
scale as seen in this line of code from CoordMap's constructor:

    at = at.scale(this.pixel_per_unit_x_, -this.pixel_per_unit_y_);

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

* @param {!myphysicslab.lab.engine2D.Polygon} body Edge will be added to this
  Polygon
* @param {!Vertex} vertex1 Edge starts at this Vertex, given
  in body coordinates
* @param {!Vertex} vertex2 Edge finishes at this Vertex,
  given in body coordinates
* @param {!Vector} center_body center of the circular arc, in body
  coordinates
* @param {boolean} clockwise direction of the arc
* @param {boolean} outsideIsOut `true` means the region outside of the circle is
  considered the outside of the Polygon, so the edge is convex. `False` indicates a
  concave edge.
* @param {number=} opt_spacing the distance between 'decorated' mid-point Vertexes.
* @constructor
* @final
* @struct
* @extends {AbstractEdge}
* @throws {!Error} if the Vertexes are not equidistant from the center within
  {@link #TINY_POSITIVE} tolerance
* @throws {!Error} if `vertex1` is already connected to a 'next' Edge
* @throws {!Error} if `vertex2` is already connected to a 'previous' Edge
*/
myphysicslab.lab.engine2D.CircularEdge = function(body, vertex1, vertex2, center_body,
    clockwise, outsideIsOut, opt_spacing) {
  AbstractEdge.call(this, body, vertex1, vertex2);
  /** position of the center, in body coords
  * @type {!Vector}
  * @private
  */
  this.center_body_ = center_body;
  /** when true, the outside of the circle is outside of the object.
  * @type {boolean}
  * @private
  */
  this.outsideIsOut_ = outsideIsOut;
  /** radius of the edge;
  * NOTE: radius is positive, but getCurvature() returns negative for concave edge
  * @type {number}
  * @private
  */
  this.radius_ = center_body.distanceTo(vertex1.locBody());
  var r2 = vertex2.locBody().distanceTo(center_body);
  if (Math.abs(this.radius_ - r2 > CircularEdge.TINY_POSITIVE)) {
    throw new Error('center is not equidistant from the two end points');
  }
  /** when true, arc goes clockwise from startAngle to finishAngle.
  * @type {boolean}
  * @private
  */
  this.clockwise_ = clockwise;
  /** starting angle, in mathematical body coords
  * (in radians, 0 = 3 o'clock, increase counter-clockwise)
  * startAngle and finishAngle are same in body or edge coords
  * @type {number}
  * @private
  */
  this.startAngle_ = vertex1.locBody().subtract(center_body).getAngle();
  /** finish angle, in mathematical body coords
  * (in radians, 0 = 3 o'clock, increase counter-clockwise)
  * startAngle and finishAngle are same in body or edge coords
  * @type {number}
  * @private
  */
  this.finishAngle_ = vertex2.locBody().subtract(center_body).getAngle();
  if (Math.abs(this.startAngle_ - this.finishAngle_) < CircularEdge.TINY_POSITIVE) {
    // assume a full circle is desired when vertex1 == vertex2
    this.finishAngle_ = this.startAngle_ + 2*Math.PI;
  }
  var lowHigh = CircularEdge.findAngleLowHigh(this.startAngle_, this.finishAngle_,
      this.clockwise_);
  /** Any point on the arc falls between angle_low and angle_high,
  * where angle_low < angle_high.
  * Note that angle_low might be startAngle or finishAngle (modulo 2 pi),
  * same with angle_high.
  * In math convention, angle_low is between -pi and pi.
  * @type {number}
  * @private
  */
  this.angle_low_ = lowHigh[0];
  /** Any point on the arc falls between angle_low and angle_high,
  * where angle_low < angle_high.
  * Note that angle_low might be startAngle or finishAngle (modulo 2 pi),
  * same with angle_high.
  * In math convention, angle_high is between angle_low and 3 pi.
  * @type {number}
  * @private
  */
  this.angle_high_ = lowHigh[1];
  /** depth is used to limit how far a penetration is regarded as a collision.
  * 'depth of arc' is thickest distance between arc and line connecting arc ends.
  * @type {number}
  * @private
  */
  this.depth_ = CircularEdge.findDepth(this.angle_high_ - this.angle_low_,
      this.radius_);
  // find number of Vertexes to add along the edge (for collision checking)
  // min = minimum number of Vertexes = one for every 45 degrees.
  var min = Math.ceil((this.angle_high_ - this.angle_low_)/(Math.PI/4));
  // spacing = distance between Vertexes
  var spacing = (opt_spacing === undefined) ? 0.3 : opt_spacing;
  var n = Math.max(min,
      Math.ceil((this.angle_high_ - this.angle_low_)*this.radius_/spacing));
  var delta = (this.angle_high_ - this.angle_low_)/n;
  /** the angle between decorated Vertexes
  * @type {number}
  * @private
  */
  this.decoratedAngle_ = delta;
  /**
  * @type {!Array<!Vertex>}
  * @private
  */
  this.decoratedVertexes_ = [];
  // add Vertexes along the edge (for collision checking)
  for (var i=1; i<n; i++) {
    var angle = this.clockwise_ ?
        this.angle_high_ - i*delta : this.angle_low_ + i*delta;
    var p = new Vector(this.center_body_.getX() + this.radius_*Math.cos(angle),
                       this.center_body_.getY() + this.radius_*Math.sin(angle));
    var v = new ConcreteVertex(p, false, this);
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
  /** true when this is a complete circle
  * @type {boolean}
  * @private
  */
  this.completeCircle_ = Math.abs(2*Math.PI - (this.angle_high_ - this.angle_low_)) <
      CircularEdge.SMALL_POSITIVE;
};

var CircularEdge = myphysicslab.lab.engine2D.CircularEdge;
goog.inherits(CircularEdge, AbstractEdge);

CircularEdge.prototype.toString = function() {
  return Util.ADVANCED ? '' : CircularEdge.superClass_.toString.call(this)
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

/**
* @type {number}
* @const
*/
CircularEdge.TINY_POSITIVE = 1E-10;

/**
* @type {number}
* @private
* @const
*/
CircularEdge.SMALL_POSITIVE = 1E-6;

/**  Creates a CircularEdge between the given Vertexes with the given radius,
calculating the position of the center, and adds the edge to the given RigidBody.

Calculates the center to be at the vertex of an isoceles triangle with the given
Vertexes, where the center is `radius` distance from each Vertex.

There are two choices for where to put the center in relation to the line connecting the
two given Vertexes: either above or below the line. The `aboveRight` parameter
specifies which choice to make. For a vertical connecting line, the choice is right or
left of the line.

* @param {!myphysicslab.lab.engine2D.Polygon} body edge will be added to this
  RigidBody
* @param {!Vertex} vertex1 edge starts at this Vertex, given
  in body coordinates
* @param {!Vertex} vertex2 edge finishes at this Vertex,
  given in body coordinates
* @param {number} radius the radius of the circular arc
* @param {boolean} aboveRight if true, then the center of CircularEdge is located
  above or right of the line connecting `vertex1` and `vertex2`; if false, then center
  is located below or left of the connecting line.
* @param {boolean} clockwise direction of the arc
* @param {boolean} outsideIsOut true means the outside of the circle is considered the
  outside of the RigidBody.
* @return {!CircularEdge} the CircularEdge that is created
* @throws {!Error} if absolute value of `radius` is too small; must be greater than half
  the distance between the two Vertexes
* @throws {!Error} if `vertex1` is already connected to a 'next' Edge
* @throws {!Error} if `vertex2` is already connected to a 'previous' Edge
*/
CircularEdge.make = function(body, vertex1, vertex2, radius, aboveRight, clockwise,
      outsideIsOut) {
  // find center
  var cx, cy;
  // find midpoint of line between vertex1 and vertex2
  var mx = (vertex1.locBodyX() + vertex2.locBodyX())/2;
  var my = (vertex1.locBodyY() + vertex2.locBodyY())/2;
  // distance from vertex1 to midpoint
  var a = Util.hypot(vertex1.locBodyX() - mx, vertex1.locBodyY() - my);
  var d = radius*radius - a*a;
  if (d < CircularEdge.TINY_POSITIVE) {
    throw new Error('radius '+radius+' is too small, must be >= '+a);
  }
  // distance from midpoint to center
  var b = Math.sqrt(d);
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
    var k = (vertex2.locBodyY() - vertex1.locBodyY())/
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
    var bk2 = b/Math.sqrt(1 + k*k);
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

/** @override */
CircularEdge.prototype.addPath = function(context) {
  // We draw the path in DisplayShape after transforming coordinates to body
  // coordinates. See notes above about coordinates and angle conventions.
  // Basically this is a 'double-negative'
  // situation where two different conventions about angles and 'y increases up'
  // cancel out.  However, the 'anticlockwise' argument is flipped.
  context.arc(this.center_body_.getX(), this.center_body_.getY(), this.radius_,
      this.startAngle_, this.finishAngle_, this.clockwise_);
};

/** Returns the location on this CircularEdge corresponding to the given angle, in body
coordinates.
* @param {number} angle  in edge coords
* @return {!Vector} location on this CircularEdge in body coords
*/
CircularEdge.prototype.angleToBody = function(angle) {
  return this.edgeToBody(
      new Vector(this.radius_*Math.cos(angle), this.radius_*Math.sin(angle)));
};

/** Converts from body coordinates to edge coordinates.
* @param {!Vector} p_body a point in body coordinates
* @return {!Vector} the same point in edge coordinates
*/
CircularEdge.prototype.bodyToEdge = function(p_body) {
  return p_body.subtract(this.center_body_);
};

/** @override */
CircularEdge.prototype.chordError = function() {
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
@return {number} the thickest distance between arc and line connecting arc ends
*/
CircularEdge.prototype.depthOfArc = function() {
  return this.depth_;
};

/** @override */
CircularEdge.prototype.distanceToEdge = function(edge) {
  if (edge instanceof StraightEdge) {
    var cw = this.body_.bodyToWorld(this.center_body_);  // Center World coords
    var cb = edge.getBody().worldToBody(cw);  // Center Body coords
    var d = edge.distanceToLine(cb);
    d -= this.radius_;
    return d;
  } else if (edge instanceof CircularEdge) {
    var cw = edge.getBody().bodyToWorld(edge.center_body_);
    var cb = this.body_.worldToBody(cw);
    var p_edge = this.bodyToEdge(cb);
    if (!this.isWithinArc(p_edge)) {
      return Util.NaN;
    }
    var len = p_edge.length();
    var r1 = (edge.outsideIsOut_ ? 1 : -1)*edge.radius_;
    var r2 = (this.outsideIsOut_ ? 1 : -1)*this.radius_;
    var concave = !edge.outsideIsOut_ || !this.outsideIsOut_;
    return concave ? Math.abs(r1 + r2) - len : len - (r1 + r2);
  } else {
    throw new Error();
  }
};

/** @override */
CircularEdge.prototype.distanceToLine = function(p_body) {
  //The extended line is taken to be the full circle for this Circular Edge.
  var p_edge = this.bodyToEdge(p_body);
  return (this.outsideIsOut_ ? 1 : -1)*(p_edge.length() - this.radius_);
};

/** @override */
CircularEdge.prototype.distanceToPoint = function(p_body) {
  var p_edge = this.bodyToEdge(p_body);
  if (this.isWithinArc(p_edge)) {
    return (this.outsideIsOut_ ? 1 : -1)*(p_edge.length() - this.radius_);
  } else {
    return Util.POSITIVE_INFINITY;
  }
};

/** Converts from edge coordinates to body coordinates.
* @param {!Vector} p_edge a point in edge coordinates
* @return {!Vector} the same point in body coordinates
*/
CircularEdge.prototype.edgeToBody = function(p_edge) {
  return p_edge.add(this.center_body_);
};

/** Converts from edge coordinates to world coordinates.
* @param {!Vector} p_edge a point in edge coordinates
* @return {!Vector} the same point in world coordinates
*/
CircularEdge.prototype.edgeToWorld = function(p_edge) {
  return this.body_.bodyToWorld(p_edge.add(this.center_body_));
};

/** Converts the start and finish angles of an arc to a pair of angles such that all of
the arc is within that pair of angles.
* @param {number} startAngle starting angle, math convention
* @param {number} finishAngle finish angle, math convention
* @param {boolean} clockwise true means arc goes clockwise in math convention
* @return {!Array<number>} pair of angles, low and high, such that all of the arc is
  within that pair of angles.
* @private
*/
CircularEdge.findAngleLowHigh = function(startAngle, finishAngle, clockwise) {
  var angle_low, angle_high;
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

    Derivation:
    On unit circle, let arc start at
      A = [1, 0]
    and extend counter clockwise along circle to
      B = [cos theta, sin theta].
    Draw a line between those two points, A and B.
    Let C be the midpoint of that line. C is at:
      C = [(1 + cos theta)/2, sin theta / 2 ].
    Distance between C and (cos theta/2, sin theta/2) is the depth.

* @param {number} angle angle of arc, in radians
* @param {number} radius radius of circle that arc is part of
* @return {number} maximum distance between arc and line connecting arc ends
* @private
*/
CircularEdge.findDepth = function(angle, radius) {
  var d1 = Math.sin(angle/2) - Math.sin(angle)/2;
  var d2 = Math.cos(angle/2) - (1 + Math.cos(angle))/2;
  return radius * Math.sqrt(d1*d1 + d2*d2);
};

/** @override */
CircularEdge.prototype.findVertexContact = function(v, p_body, distTol) {
  // p_edge = point in edge coords
  var p_edge = this.bodyToEdge(p_body);
  // is p_edge is beyond endpoints of this edge segment?
  if (!this.isWithinArc(p_edge))
    return null;
  var h = p_edge.length();
  var dist = (this.outsideIsOut_ ? 1 : -1)*(h - this.radius_);
  // is the point near enough?
  if (dist < 0 || dist > distTol)
    return null;
  var rbc = new CornerEdgeCollision(v, this);
  rbc.distance = dist;
  if (h < CircularEdge.TINY_POSITIVE)
    throw new Error('cannot get normal for point at center of circle');
  // ne = normal in edge coords (concave has reversed normal)
  var ne = p_edge.multiply((this.outsideIsOut_ ? 1 : -1) * (1/h));
  // note: because bodyToEdge does not rotate, the normal is same in edge or body coords
  // nw = normal in world coords
  rbc.normal = this.body_.rotateBodyToWorld(ne);
  goog.asserts.assert( Math.abs(rbc.normal.length() - 1.0) < 1e-8 );
  // find point on circle nearest to vertex: at center + radius * normal
  rbc.radius2 = (this.outsideIsOut_ ? 1 : -1)*this.radius_;
  // Add half of the gap distance to the radius, for better accuracy in contact
  // force calculation (improves stability of contact distance).
  rbc.radius2 += dist;
  // rw = near point on circle in world coords
  var rw = this.body_.bodyToWorld(this.edgeToBody(ne.multiply(rbc.radius2)));
  // Alternative idea: set impact to the vertex and impact2 to point on circle edge,
  // then use impact2 to calculate R2.
  rbc.impact1 = rw;
  //rbc.impact2 = rw;  // point on circle edge
  rbc.ballNormal = true;
  rbc.radius1 = v.getCurvature();
  rbc.creator = Util.DEBUG ? 'CircularEdge.findVertexContact' : '';
  return rbc;
};

/** @override */
CircularEdge.prototype.getBottomBody = function() {
  var angle = -Math.PI/2;
  angle += angle < this.angle_low_ ? 2*Math.PI : 0;
  if (this.angle_low_ <= angle && angle <= this.angle_high_) {
    return this.center_body_.getY() - this.radius_;
  } else {
    return this.v1_.locBodyY() < this.v2_.locBodyY() ?
        this.v1_.locBodyY() : this.v2_.locBodyY();
  }
};

/** Returns the location of the center of the circular arc of this CircularEdge, in
body coordinates.
@return {!Vector} center of this circular arc, in body
  coordinates
*/
CircularEdge.prototype.getCenterBody = function() {
  return this.center_body_;
};

/** @override */
CircularEdge.prototype.getCenterOfCurvature = function(p_body) {
  return this.center_body_;
};

/** @override */
CircularEdge.prototype.getClassName = function() {
  return 'CircularEdge';
};

/** @override */
CircularEdge.prototype.getCurvature = function(p_body) {
  return (this.outsideIsOut_ ? 1 : -1)*this.radius_;
};

/** @override */
CircularEdge.prototype.getDecoratedVertexes = function() {
  return this.decoratedVertexes_;
};

/** @override */
CircularEdge.prototype.getLeftBody = function() {
  var angle = Math.PI;
  angle += angle < this.angle_low_ ? 2*Math.PI : 0;
  if (this.angle_low_ <= angle && angle <= this.angle_high_) {
    return this.center_body_.getX() - this.radius_;
  } else {
    return this.v1_.locBodyX() < this.v2_.locBodyX() ?
        this.v1_.locBodyX() : this.v2_.locBodyX();
  }
};

/** @override */
CircularEdge.prototype.getNormalBody = function(p_body) {
  var p_edge = this.bodyToEdge(p_body);
  var h = p_edge.length();
  if (h < CircularEdge.TINY_POSITIVE) {
    throw new Error(Util.DEBUG ? ('cannot get normal at point '+p_body) : '');
  }
  // note: because bodyToEdge does not rotate, the normal is same in edge or body coords
  return p_edge.multiply(this.outsideIsOut_ ? 1/h : -1/h);
};

/** @override */
CircularEdge.prototype.getPointOnEdge = function(p_body) {
  var n = this.getNormalBody(p_body);
  var r = (this.outsideIsOut_ ? 1 : -1)* this.radius_;
  var p = this.edgeToBody(n.multiply(r));
  return [p, n];
};

/** Returns radius of the edge. Radius is always positive, but {@link #getCurvature}
returns negative for concave edge.
@return {number} radius of the edge
*/
CircularEdge.prototype.getRadius = function() {
  return this.radius_;
};

/** @override */
CircularEdge.prototype.getRightBody = function() {
  var angle = 0;
  angle += angle < this.angle_low_ ? 2*Math.PI : 0;
  if (this.angle_low_ <= angle && angle <= this.angle_high_) {
    return this.center_body_.getX() + this.radius_;
  } else {
    return this.v1_.locBodyX() > this.v2_.locBodyX() ?
        this.v1_.locBodyX() : this.v2_.locBodyX();
  }
};

/** @override */
CircularEdge.prototype.getTopBody = function() {
  var angle = Math.PI/2;
  angle += angle < this.angle_low_ ? 2*Math.PI : 0;
  if (this.angle_low_ <= angle && angle <= this.angle_high_) {
    return this.center_body_.getY() + this.radius_;
  } else {
    return this.v1_.locBodyY() > this.v2_.locBodyY() ?
        this.v1_.locBodyY() : this.v2_.locBodyY();
  }
};

/** @override */
CircularEdge.prototype.highlight = function() {};

/** @override */
CircularEdge.prototype.improveAccuracyEdge = function(rbc, edge) {
  if (edge instanceof StraightEdge) {
    CircleStraight.improveAccuracy(rbc, this, edge);
  } else if (edge instanceof CircularEdge) {
    if (rbc.getNormalBody() == edge.getBody()) {
      CircleCircle.improveAccuracy(rbc, this, edge);
    } else {
      CircleCircle.improveAccuracy(rbc, edge, this);
    }
  } else {
    throw new Error();
  }
};

/** @override */
CircularEdge.prototype.intersection = function(p1_body, p2_body) {
  if (p1_body == p2_body) {
    return null;
  }
  // pe1, pe2 = points in edge coords
  var pe1 = this.bodyToEdge(p1_body);
  var pe2 = this.bodyToEdge(p2_body);
  // qe1, qe2 = intersection points on oval in edge coords
  var qe1 = null;
  var qe2 = null;
  // find the point of intersection on the complete circle
  if (Math.abs(pe2.getX() - pe1.getX())<CircularEdge.TINY_POSITIVE) {
    // vertical line is special case
    var x = (pe1.getX() + pe2.getX())/2;  // average x coordinate, just in case
    if (Math.abs(x) > this.radius_) {
      return null;
    }
    var y = Math.sqrt(this.radius_*this.radius_ - x*x);
    var ylow = pe1.getY() < pe2.getY() ? pe1.getY() : pe2.getY();
    var yhigh = pe1.getY() > pe2.getY() ? pe1.getY() : pe2.getY();
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
    var k = (pe2.getY() - pe1.getY())/(pe2.getX() - pe1.getX());
    var k12 = 1 + k*k;
    var d = pe1.getY() - k*pe1.getX();
    var e = k12*this.radius_*this.radius_ - d*d;
    if (e < 0) {
      return null;
    }
    e = Math.sqrt(e);
    var x1 = -(k*d + e)/k12;
    var x2 = (k*(-d) + e)/k12;
    var y1 = (d - k*e)/k12;
    var y2 = (d + k*e)/k12;
    var xlow = pe1.getX() < pe2.getX() ? pe1.getX() : pe2.getX();
    var xhigh = pe1.getX() > pe2.getX() ? pe1.getX() : pe2.getX();
    var ylow = pe1.getY() < pe2.getY() ? pe1.getY() : pe2.getY();
    var yhigh = pe1.getY() > pe2.getY() ? pe1.getY() : pe2.getY();
    if (xlow <= x1 && x1 <= xhigh && ylow <= y1 && y1 <= yhigh) {
      qe1 = new Vector(x1, y1);
    }
    if (xlow <= x2 && x2 <= xhigh && ylow <= y2 && y2 <= yhigh) {
      qe2 = new Vector(x2, y2);
    }
  }
  // qb1, qb2 = intersection points in body coords
  var qb1 = null;
  var qb2 = null;
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
  goog.asserts.assert(qb2!=null);
  return [qb2];
};

/** @override */
CircularEdge.prototype.isStraight = function() {
  return false;
};

/**
@param {!Vector} p_edge the point of interest, in edge
coordinates.
@param {number} angleLow
@param {number} angleHigh
@return {boolean} true if the given point is within this arc.
@private
*/
CircularEdge.isWithinArc = function(p_edge, angleLow, angleHigh) {
  goog.asserts.assert(!isNaN(p_edge.getX()));
  goog.asserts.assert(!isNaN(p_edge.getY()));
  var angle = p_edge.getAngle();
  if (angle < angleLow) {
    angle += 2*Math.PI;
  }
  return angleLow <= angle && angle <= angleHigh;
};

/** Returns true if the angle of the given point is within this arc. Looks at the angle
from the origin to the point, compares this angle to the angle range of this arc.
@param {!Vector} p_edge the point of interest, in edge
    coordinates.
@return {boolean} true if the given point is within this arc.
*/
CircularEdge.prototype.isWithinArc = function(p_edge) {
  if (this.completeCircle_) {
    return true;
  }
  return CircularEdge.isWithinArc(p_edge, this.angle_low_, this.angle_high_);
};

/** Returns true if the angle of the given point is within this arc. Looks at the angle
from the origin to the point, compares this angle to the angle range of this arc.
@param {!Vector} p_world the point of interest, in world
    coordinates.
@return {boolean} true if the given point is within this arc.
*/
CircularEdge.prototype.isWithinArc2 = function(p_world) {
  if (this.completeCircle_) {
    return true;
  }
  var p_edge = this.bodyToEdge(this.body_.worldToBody(p_world));
  return CircularEdge.isWithinArc(p_edge, this.angle_low_, this.angle_high_);
};

/** Returns true if the angle of the given point is within the reflection of this arc
through the center. Looks at the angle from the origin to the point, compares this angle
to the angle range of the reflected arc.

Examples of reflected arcs:

+ If the arc goes from 0 to pi/4, then the reflected arc goes from pi to 5 pi/4.
+ If the arc goes from 0 to 3 pi/2, then the reflected arc goes from pi to 5 pi/2.

@param {!Vector} p_edge the point of interest, in edge
    coordinates.
@return {boolean} true if the given point is within the reflected arc.
*/
CircularEdge.prototype.isWithinReflectedArc = function(p_edge) {
  if (p_edge==null) {
    return false;
  }
  var angle = p_edge.getAngle();
  while (angle < this.angle_low_ + Math.PI) {
    angle += 2*Math.PI;
  }
  return this.angle_low_ + Math.PI <= angle && angle <= this.angle_high_ + Math.PI;
};

/** Returns true if the angle of the given point is within the reflection of this arc
through the center. Same as {@link #isWithinReflectedArc} but accepts a point in world
coordinates.

@param {!Vector} p_world the point of interest, in world
    coordinates.
@return {boolean} true if the given point is within the reflected arc.
*/
CircularEdge.prototype.isWithinReflectedArc2 = function(p_world) {
  return this.isWithinReflectedArc(this.bodyToEdge(this.body_.worldToBody(p_world)));
};

/** @override */
CircularEdge.prototype.maxDistanceTo = function(p_body) {
  // @todo  This is a worst case, over-estimated distance (awful for concave arc),
  // this could be greatly improved by actually doing the calculation.
  return this.center_body_.distanceTo(p_body) + this.radius_;
};

/** Finds the 'nearest' point (by angle) on this arc to the given point p_body.

+ If the angle to p_body is within the arc, return p_body unchanged.
+ If the angle to p_body is outside of the arc, return the nearest endpoint of the arc.
@param {!Vector} p_body  the point of interest, in body
    coordinates
@return {!Vector} the nearest point (by angle) on this arc to the
    given point, in body coordinates
*/
CircularEdge.prototype.nearestPointByAngle = function(p_body) {
  var angle = this.bodyToEdge(p_body).getAngle();
  var angle2 = angle + (angle < this.angle_low_ ? 2*Math.PI : 0);
  if (this.angle_low_ <= angle2 && angle2 <= this.angle_high_) {
    return p_body;
  } else {
    // angle is outside of arc;  find which corner is the point closest to
    var d1 = angle < this.angle_low_ ?
        this.angle_low_ - angle : this.angle_low_ - (angle - 2*Math.PI);
    var d2 = angle > this.angle_high_ ?
        angle - this.angle_high_ : (2*Math.PI + angle) - this.angle_high_;
    var angle_new = d1 < d2 ? this.angle_low_ : this.angle_high_;
    var qb2 = this.angleToBody(angle_new);
    if (0 == 1 && Util.DEBUG) {
      console.log('nearestOldPointTo angle '+Util.NF5(angle)+' became '
          +Util.NF5(angle_new)+' body '+p_body+' became '+qb2);
    }
    return qb2;
  }
};

/** Returns `true` when the region outside of the circle is outside of the object,
meaning the edge is convex. Returns `false` for a concave edge.
@return {boolean} `true` means the region outside of the circle is outside of the
object.
*/
CircularEdge.prototype.outsideIsOut = function() {
  return this.outsideIsOut_;
};

/** @override */
CircularEdge.prototype.testCollisionEdge = function(collisions, edge, time) {
  if (edge instanceof StraightEdge) {
    if (Util.DEBUG) {
      UtilityCollision.edgeEdgeCollisionTests++;
    }
    CircleStraight.testCollision(collisions, edge, this, time);
  } else if (edge instanceof CircularEdge) {
    if (Util.DEBUG) {
      UtilityCollision.edgeEdgeCollisionTests++;
    }
    CircleCircle.testCollision(collisions, edge, this, time);
  } else {
    throw new Error();
  }
};

}); // goog.scope
