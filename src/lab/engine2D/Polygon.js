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

goog.provide('myphysicslab.lab.engine2D.Polygon');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.engine2D.CircularEdge');
goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
goog.require('myphysicslab.lab.engine2D.DebugEngine2D');
goog.require('myphysicslab.lab.engine2D.Edge');
goog.require('myphysicslab.lab.engine2D.EdgeSet');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
goog.require('myphysicslab.lab.engine2D.StraightEdge');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.engine2D.UtilityCollision');
goog.require('myphysicslab.lab.engine2D.Vertex');
goog.require('myphysicslab.lab.model.AbstractMassObject');
goog.require('myphysicslab.lab.model.MassObject');
goog.require('myphysicslab.lab.util.AffineTransform');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericVector');
goog.require('myphysicslab.lab.util.MutableVector');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var AbstractMassObject = myphysicslab.lab.model.AbstractMassObject;
var AffineTransform = myphysicslab.lab.util.AffineTransform;
var CircularEdge = myphysicslab.lab.engine2D.CircularEdge;
var ConcreteVertex = myphysicslab.lab.engine2D.ConcreteVertex;
var DebugEngine2D = myphysicslab.lab.engine2D.DebugEngine2D;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var Edge = myphysicslab.lab.engine2D.Edge;
var EdgeSet = myphysicslab.lab.engine2D.EdgeSet;
var GenericVector = myphysicslab.lab.util.GenericVector;
var MutableVector = myphysicslab.lab.util.MutableVector;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
var RigidBodyCollision = myphysicslab.lab.engine2D.RigidBodyCollision;
var StraightEdge = myphysicslab.lab.engine2D.StraightEdge;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
var UtilityCollision = myphysicslab.lab.engine2D.UtilityCollision;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;
var Vertex = myphysicslab.lab.engine2D.Vertex;

/** A RigidBody made of connected Edges and Vertexes.

See [2D Physics Engine Overview](Engine2D.html) about the rigid body physics engine.

### Body Coordinates

For explanation of **body vs. world coordinates** see
[Body Coordinates](Engine2D.html#bodycoordinates),
{@link myphysicslab.lab.model.MassObject}
and {@link myphysicslab.lab.model.CoordType}.

Methods that return a location often have
names ending with either 'body' or 'world' to indicate the coordinate system. Similarly, parameters of methods often end with 'body' or 'world'.


### Structure of a Polygon

A Polygon consists of a set of connected Edges, which together form one or
more ***paths***. A Polygon can have more than one path, for example a
donut shape would have 2 paths: one for the outer Edge and one for the inner Edge.

A path in a Polygon consists of a linked list of Edges and Vertexes:

<img src="Polygon_Vertex_Edge_List.svg">

An Edge has a starting and ending Vertex, and a Vertex has a previous and next Edge. So
we can follow a path from the starting Vertex until returning again to the
starting Vertex when the path is then closed.

The list of paths is simply a list of starting Vertexes. Each path wraps around to its
starting Vertex to form a closed loop. A path must have at least one Vertex and
one Edge.

A path is used when drawing the Polygon. For collision handling, the collection of
Edges and Vertexes are what matters, how they are linked into a path is irrelevant.

The Edges in a Polygon are stored in an array, and Edges can be referred to by their
index in this array, see {@link #getEdges} and
{@link myphysicslab.lab.engine2D.Edge#getIndex}.

The list of Vertexes may include automatically generated 'mid-point Vertexes' for curved
Edges. These Vertexes are added to give better collision detection for curved Edges. See
{@link myphysicslab.lab.engine2D.Vertex} about end-point vs. mid-point Vertexes.


### Creating a Polygon

+ First create a Polygon with the constructor; it has no Vertexes or Edges.

+ Call {@link #startPath} to begin making a path. You can start with a single Vertex or
an Edge.

+ Use {@link #addEdge} as many times as desired to add Edges. Or use the shortcut
methods {@link #addStraightEdge}, {@link #addCircularEdge} or
{@link #addCircularEdge2}.

+ (optional) Use {@link #closePath} if you want to add another path with `startPath`.

+ Call {@link #finish} which will close the current path and calculate the centroid for
the Polygon.

Note that just creating an Edge can add it to the existing linked list of Vertexes
and Edges being formed in the currently open path. The {@link #addEdge} method completes
the process of adding the Edge to the Polygon.

For examples of creating a Polygon see {@link myphysicslab.lab.engine2D.Shapes}.


### Centroids & Proximity Testing

We need a quick way to know if objects are close enough to warrant the more expensive
tests that are done to find collisions and contacts. To this end, we find the
smallest circle that encloses the object. The center of this circle is the
'centroid' or geometric center of the object. The radius is the "centroid
radius".

There is a similar centroid and centroid radius for each Edge, which gives the smallest
circle that encloses that Edge.

Some of the proximity tests can be found in
{@link myphysicslab.lab.engine2D.UtilityCollision#checkVertexes}. Of note is that we expand the
centroid radius by the distance that the Vertex has travelled during the current time
step. And that we use the *distance squared* in these tests, to avoid the computational
cost of the square root function.




### Special Edge for Proximity Testing
<a name="specialedgeforproximitytesting"></a>

<img src="Polygon_Special_Edge.svg">

Walls are a special case for proximity testing. Because they are typically long and
thin, their proximity circle is huge compared to the wall object; and so the proximity
test fires many false positives.

To remedy this, we allow specifying a 'special edge' via {@link #setSpecialEdge} which
changes how the proximity testing is done for this object.

When there is a special edge (there can only be one per object), then the proximity test
still looks at the distance between the centroid of each object, but now only the
portion of that distance that is *normal to the special edge*. Also, a special centroid
radius is defined for the object that is used in this proximity test. For a wall, this
special centroid radius is half of the (short) width of the wall object.

Only the special edge is tested for collisions, so care should be taken to avoid objects
being able to collide into any of the non-special edge walls.


### Old Copy Is Used For Collision Detection

A Polygon keeps a copy of its previous state before the last time step of the
differential equation solver. The copy is used for collision detection, to determine how
a collision may have happened; for example whether a Vertex crossed over an Edge during
the last time step. The copy is not a fully functional Polygon, it is only useful for
the purposes of looking at the previous location and orientation of the body. See
{@link #saveOldCopy}, {@link #getOldCopy}, and {@link #eraseOldCopy}.




### Minimum Height

The minimum height of a Polygon is used for potential energy calculations, see
{@link myphysicslab.lab.engine2D.Polygon#getMinHeight}.

The minimum height can be explicitly set for each Polygon, see {@link #setMinHeight}.
If it is not set, the method  {@link #getMinHeight} will try
to determine the minumum height by calculating the smallest distance between the center
of mass and the body's Edges.

Some cautions about `getMinHeight`:

+ The `getMinHeight` calculation can fail for more complicated shapes or when the center
of mass is outside of the body.

+ The `getMinHeight` calculation will be incorrect for a circle or oval when the center
of mass is not on one of the axes of the circle/ellipse.

+ The minimum height is cached, and should be recalculated if the center of mass
changes. To do so, call `setMinHeight(NaN)` and the next time `getMinHeight` is
called it will recalculate.


@todo Each collision or contact is being calculated twice. Each body is calculating all
its collisions/contacts, so redundant combinations are being done. (Though some bodies
don't capture all of their possible collisions/contacts: block only looks for corner
contacts, not edges.)

@todo momentAboutCM: unclear whether this is correctly calculated. Moment calculation is
wrong when center of mass is offset; there's a formula for that. momentAboutCM is wrong,
unless it is a rectangle object.

@todo in addCollision(): nearness is hard coded at 0.1. Instead, base it on length
of the edges.

@todo minHeight is complicated, because not well defined.  For examples: donut;
concave oval Edge on rectangle; these are not easy to figure out.

* @param {string=} opt_name name of this Polygon for scripting (language independent)
* @param {string=} opt_localName localized name of this Polygon, for display to user
* @constructor
* @final
* @struct
* @extends {AbstractMassObject}
* @implements {RigidBody}
*/
myphysicslab.lab.engine2D.Polygon = function(opt_name, opt_localName) {
  var name, localName;
  if (!goog.isDef(opt_name) || opt_name == '') {
    var id = Polygon.ID++;
    name = Polygon.en.POLYGON+id;
    localName = Polygon.i18n.POLYGON+id;
  } else {
    name = opt_name;
    localName = opt_localName ? opt_localName : name;
  }
  AbstractMassObject.call(this, name, localName);

  /** list of Vertexes in this Polygon
  * @type {!Array<!Vertex>}
  * @private
  */
  this.vertices_ = new Array();
  /** list of Edges in this Polygon
  * @type {!Array<!Edge>}
  * @private
  */
  this.edges_ = new Array();
  /** whether Polygon is finished being constructed
  * @type {boolean}
  * @private
  */
  this.finished_ = false;
  /** start Vertex of current path; only used during construction
  * @type {?Vertex}
  * @private
  */
  this.startVertex_ = null;
  /** list of starting Vertex for each sub-path
  * @type {!Array<!Vertex>}
  * @private
  */
  this.paths_ = new Array();
  /** A set of Edges on some other Polygon that this Polygon never collides with.
  * @type {?EdgeSet}
  * @private
  */
  this.nonCollideSet_ = null;
  /** elasticity of this body, from 0 to 1.
  * @type {number}
  * @private
  */
  this.elasticity_ = 1.0;
  /** list of objects this body does not collide with
  * @type {!Array<!RigidBody>}
  * @private
  */
  this.nonCollideBodies_ = new Array();
  /** Geometric center of this Polygon, in body coords
  * @type {?Vector}
  * @private
  */
  this.centroid_body_ = null;
  /** cached centroid radius = max distance between center of mass and any point on body
  * @type {number}
  * @private
  */
  this.centroidRadius_ = UtilityCore.NaN;
  /** An Edge that takes priority for collision handling, as in a wall object,
  when this is not null then special proximity testing is done.
  Note that the other Edges of this object will have zero centroid radius and therefore
  will be inactive for collisions;  and this allows objects to penetrate into this
  body thru those inactive Edges.
  * @type {?Edge}
  * @private
  */
  this.specialEdge_ = null;
  /** the special normal Edge (if any) in world coords. This is a cache to
  avoid costs of doing rotateBodyToWorld and getNormalBody method.
  * @type {?Vector}
  * @private
  */
  this.specialNormalWorld_ = null;
  /** left side of bounds in body coordinates
  * @type {number}
  * @private
  */
  this.left_body_ = UtilityCore.NaN;
  /** right side of bounds in body coordinates
  * @type {number}
  * @private
  */
  this.right_body_ = UtilityCore.NaN;
  /** top of bounds in body coordinates
  * @type {number}
  * @private
  */
  this.top_body_ = UtilityCore.NaN;
  /** bottom of bounds in body coordinates
  * @type {number}
  * @private
  */
  this.bottom_body_ = UtilityCore.NaN;
  /** the index into the variables array for this Polygon, or -1 if not in vars array
  * @type {number}
  * @private
  */
  this.varsIndex_ = -1;
  /** copy of this body in its last known position prior to the present
  * @type {?Polygon}
  * @private
  */
  this.body_old_ = null;
  /** distance tolerance, for determining if RigidBody is in contact with another
  * RigidBody
  * @type {number}
  * @private
  */
  this.distanceTol_ = 0.01;
  /** velocity tolerance, for determining if RigidBody is in contact with another
  * RigidBody
  * @type {number}
  * @private
  */
  this.velocityTol_ = 0.5;
  /** How close in space we need to be to a collision, to decide to handle it,
  * as a percentage of the targetGap = distanceTol/2.
  * @type {number}
  * @private
  */
  this.accuracy_ = 0.6;
};
var Polygon = myphysicslab.lab.engine2D.Polygon;
goog.inherits(Polygon, AbstractMassObject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  Polygon.prototype.toString = function() {
    return Polygon.superClass_.toString.call(this).slice(0, -1)
        +', elasticity: ' +NF(this.elasticity_)
        +', distanceTol_: '+NF(this.distanceTol_)
        +', velocityTol_: '+NF(this.velocityTol_)
        +', accuracy_:'+NF(this.accuracy_)
        +', varsIndex_: '+this.varsIndex_
        +', centroid_body_: '+this.centroid_body_
        +'}';
  };
};

/** @inheritDoc */
Polygon.prototype.getClassName = function() {
  return 'Polygon';
};

/** Counter used for naming Polygons.
* @type {number}
*/
Polygon.ID = 1;

/**
* @type {string}
* @private
* @const
*/
Polygon.OPEN_PATH_ERROR = 'Polygon does not have an open path to add edges to';

/** add small circle at end point Vertexes
* @type {boolean}
* @const
* @private
*/
Polygon.SHOW_VERTICES = false;
/** add small circle at all Vertexes, including mid-point Vertexes
* @type {boolean}
* @const
* @private
*/
Polygon.SHOW_ALL_VERTICES = false;
/** print Edge & Vertex info for each Polygon when created.
* @type {boolean}
* @const
* @private
*/
Polygon.PRINT_POLYGON_STRUCTURE = false;

/** Adds a CircularEdge to the open path of this Polygon, starting at the current last
Vertex and ending at the given point, with the given center for the circular arc, and
moving clockwise or counter-clockwise from the start Vertex. See
{@link #lastOpenVertex} and {@link #startPath}.

@param {!Vector} p_body the endpoint of the new Edge, in body
    coordinates
@param {!Vector} center_body the center point in body coordinates
@param {boolean} clockwise true moves clockwise, false moves counter-clockwise
@param {boolean} outsideIsOut `true` means that any point outside the circle is outside
    of this body; `false` means the opposite, that any point inside the circle is
    outside this body.
@return {!CircularEdge} the Edge that is created
@throws {Error} if Polygon does not have an open path to add Edges to
@throws {Error} if `p_body` and last point are not equidistant from `center_body`
    within `CircularEdge.TINY_POSITIVE` tolerance
*/
Polygon.prototype.addCircularEdge = function(p_body, center_body, clockwise,
    outsideIsOut) {
  var edge = new CircularEdge(this, this.lastOpenVertex(),
      new ConcreteVertex(p_body, /*endPoint=*/true), center_body, clockwise,
      outsideIsOut);
  this.addEdge(edge);
  return edge;
};

/** Adds a CircularEdge to the open path of this Polygon, starting at the current last
Vertex and ending at the given point, with the given radius for the circular arc, and
moving clockwise or counter-clockwise from the start Vertex. See
{@link #lastOpenVertex} and {@link #startPath}.

The center point is calculated from the two end-points, the radius, the direction
(clockwise or counter-clockwise), and the `aboveRight` parameter. The center is at the
vertex of an isoceles triangle with edges of length `radius` and base being the line
from the last point to `p_body`.

There are two choices for where to put the center in relation to the line connecting the
two given points: either above or below the line. The `aboveRight` parameter specifies
which choice to make. For a vertical connecting line, the choice is right or left of the
line.

@param {!Vector} p_body the endpoint of the new Edge, in body
  coordinates
@param {number} radius the radius of the CircularEdge
@param {boolean} aboveRight if `true`, then the center of CircularEdge is located
    above or right of the line connecting `vertex1` and `vertex2`;
    if `false`, then center is located below or left of the connecting line.
@param {boolean} clockwise true moves clockwise, false moves counter-clockwise
@param {boolean} outsideIsOut `true` means that any point outside the circle is outside
    of this body; `false` means the opposite, that any point inside the circle is
    outside this body.
@return {!CircularEdge} the Edge that is created
@throws {Error} if Polygon does not have an open path to add Edges to
*/
Polygon.prototype.addCircularEdge2 = function(p_body, radius, aboveRight, clockwise, outsideIsOut) {
  var edge = CircularEdge.make(this, this.lastOpenVertex(),
      new ConcreteVertex(p_body, /*endPoint=*/true), radius, aboveRight, clockwise,
      outsideIsOut);
  this.addEdge(edge);
  return edge;
};

/** Adds the Edge to current open path. The start Vertex of the Edge must
* match the end Vertex of last Edge in open path as given by {@link #lastOpenVertex}.
* See {@link #startPath}.
* @param {!Edge} edge the Edge to add to current open path
* @throws {Error} if there is no open path, or the start Vertex of the Edge does not
*     match the end Vertex of last Edge in open path.
*/
Polygon.prototype.addEdge = function(edge) {
  if (this.finished_) {
    throw new Error('cannot add edges to finished Polygon');
  }
  if (this.startVertex_ == null) {
    throw new Error(Polygon.OPEN_PATH_ERROR);
  }
  // the new Edge should already be linked in to this linked list:
  // startVertex_ -> edge -> vertex -> edge -> vertex -> edge -> vertex
  if (edge.getVertex2() != this.lastOpenVertex()) {
    throw new Error('edge is not connected to open path');
  }
  this.edges_.push(edge);
  goog.array.extend(this.vertices_, edge.getDecoratedVertexes());
  if (edge.getVertex2() == this.startVertex_) {
    this.closePath();
  } else {
    this.vertices_.push(edge.getVertex2());
  }
};

/** @inheritDoc */
Polygon.prototype.addNonCollide = function(bodies) {
  this.nonCollideBodies_ = goog.array.join(this.nonCollideBodies_, bodies);
  goog.array.removeDuplicates(this.nonCollideBodies_);
};

/** Adds a StraightEdge to the open path of this Polygon, starting at the current last
Vertex and ending at the given point. See {@link #lastOpenVertex} and
{@link #startPath}.

@param {!Vector} p_body the end point of the new Edge, in body
    coordinates
@param {boolean} outsideIsUp true means that any point above this Edge is
    on the outside of this body (for vertical lines a point to the right is outside);
    false means the opposite, that any point below (or left) is outside this body.
@return {!StraightEdge} the Edge that is created
@throws {Error} if Polygon does not have an open path to add Edges to
*/
Polygon.prototype.addStraightEdge = function(p_body, outsideIsUp) {
  // the StraightEdge adds itself to the Polygon's list of Edges & Vertexes
  var edge = new StraightEdge(this, this.lastOpenVertex(),
      new ConcreteVertex(p_body, /*endPoint=*/true), outsideIsUp);
  this.addEdge(edge);
  return edge;
};

/** Calculates the bounding box for this object.  See {@link #getBoundsBody}.
* @return {undefined}
* @private
*/
Polygon.prototype.calculateSize = function() {
  var xmin = UtilityCore.POSITIVE_INFINITY;
  var xmax = UtilityCore.NEGATIVE_INFINITY;
  var ymin = UtilityCore.POSITIVE_INFINITY;
  var ymax = UtilityCore.NEGATIVE_INFINITY;
  goog.array.forEach(this.edges_, function(e) {
    if (e.getLeftBody() < xmin)
      xmin = e.getLeftBody();
    if (e.getRightBody() > xmax)
      xmax = e.getRightBody();
    if (e.getBottomBody() < ymin)
      ymin = e.getBottomBody();
    if (e.getTopBody() > ymax)
      ymax = e.getTopBody();
  });
  if (1 == 0 && goog.DEBUG) {
    console.log('Polygon size xmin='+NF(xmin)
      +' xmax='+NF(xmax)
      +' ymin='+NF(ymin)
      +' ymax='+NF(ymax));
  }
  this.left_body_ = xmin;
  this.right_body_ = xmax;
  this.bottom_body_ = ymin;
  this.top_body_ = ymax;
};

/** Checks if this Polygon has a collision or contact with another Polygon, if so adds
a new RigidBodyCollision to the list of collisions.
@param {!Array<!RigidBodyCollision>} collisions  the list of
    collisions to add to
@param {!Polygon} body the rigid body to check for
    collisions with
@param {number} time current simulation time
*/
Polygon.prototype.checkCollision = function(collisions, body, time) {
  UtilityCollision.checkVertexes(collisions, this, body, time);
  UtilityCollision.checkVertexes(collisions, body, this, time);
  goog.array.forEach(this.edges_, function checkEdgeCollision1(e1) {
    if (body.nonCollideEdge(e1))
      return;
    goog.array.forEach(body.getEdges(), function checkEdgeCollision2(e2) {
      if (this.nonCollideEdge(e2))
        return;
      // can't do this proximity test, unless you calculate a new speed limit
      // based on the minimum dimension across each Edge;
      // which for vertical or horizontal Edges is zero!
      // FEB 2011:  Edge/Edge tests are static intersection tests,
      // so speed doesn't matter anymore.
      // NOTE: also check setting of DebugEngine2D.PROXIMITY_TEST
      if (DebugEngine2D.PROXIMITY_TEST) {
        if (!e1.intersectionPossible(e2, this.distanceTol_)) {
          return;
        }
      }
      if (UtilityCollision.HIGHLIGHT_COLLISION_TESTING && goog.DEBUG) {
        e1.highlight();
        e2.highlight();
      }
      e1.testCollisionEdge(collisions, e2, time);
    }, this);
  }, this);
};

/**
* @return {undefined}
* @private
*/
Polygon.prototype.checkConsistent = function() {
  if (!this.finished_) {
    throw new Error('Polygon construction is not finished.');
  }
  // v0 = starting Vertex of the current path being examined
  goog.array.forEach(this.paths_, function(v0) {
    var v = v0; // v = current Vertex being examined
    do {
      // find the next Edge
      var e = v.getEdge2();
      if (e == null) {
        throw new Error();
      }
      goog.asserts.assertObject(e);
      goog.asserts.assert(e.getVertex1() == v); // starting Vertex of this Edge
      // find next Vertex on this Edge
      v = e.getVertex2();
      goog.asserts.assert(v.getEdge1() == e); // previous Edge of Vertex
    } while (v != v0);
  });
};

/** Closes the current path of the Polygon. Connects the starting Vertex of the open
path with the last Edge of the open path. See {@link #startPath}, {@link #lastOpenEdge},
and {@link #getStartVertex}.
* @return {boolean} `true` if there was an open path that was successfully closed
@throws {Error} if Polygon construction was previously finished
@throws {Error} if start and end Vertex of the path are not at the same location
*/
Polygon.prototype.closePath = function() {
  if (this.finished_) {
    throw new Error('Polygon construction is finished.');
  }
  if (this.startVertex_ == null) {
    return false;
  }
  var lastEdge = this.lastOpenEdge();
  if (lastEdge == null) {
    return false;
  }
  if (lastEdge.getVertex2() != this.startVertex_) {
    this.closePath_(this.startVertex_, lastEdge.getVertex2());
  } else {
    goog.asserts.assert(this.startVertex_.getEdge2() == lastEdge);
  }
  this.paths_.push(this.startVertex_);
  this.startVertex_ = null;
  return true;
};

/**  Closes an open path by connecting the Edges whose given Vertexes are at the same location.

Each Vertex must be connected to only one Edge. The previous Edge for v1 must be null.
The next Edge for v2 must be null. Both Vertexes must be at (nearly) the same location
in space (the distance between them can be at most 1E-8).

The situation on entry is:

    prevEdge   vertex   nextEdge
    --------   ------   --------
    null         v1      edgeA
    edgeB        v2      null

On exit the situation is:

    prevEdge   vertex   nextEdge
    --------   ------   --------
    edgeB        v1      edgeA

and Vertex v2 is deleted.
* @param {!Vertex} v1
* @param {!Vertex} v2
* @private
*/
Polygon.prototype.closePath_ = function(v1, v2) {
  if (v1.locBody().distanceTo(v2.locBody()) > 1E-8) {
    throw new Error(goog.DEBUG ?
      ('Vertexes must be at same location '+v1+' '+v2) : '');
  }
  var v2_edge1 = v2.getEdge1();
  if (v2_edge1 == null) {
    throw new Error('v2.edge1 is null; v2='+v2+'; this='+this);
  }
  v1.setEdge1(v2_edge1);
  v2_edge1.setVertex2(v1);
  goog.asserts.assert(goog.array.contains(this.vertices_, v2));
  goog.array.remove(this.vertices_, v2);
};

/** Makes a clone by copying information from this Polygon to another.
Note that the clone is not fully functional, it is intended only for use during
collision checking.
@private
@param {!Polygon} b the Polygon to copy information to
*/
Polygon.prototype.copyTo = function(b) {
  // copy only the info needed for collision checking?
  // this makes an improper object!
  b.loc_world_ = this.loc_world_;
  b.angle_ = this.angle_;
  b.sinAngle_ = this.sinAngle_;
  b.cosAngle_ = this.cosAngle_;
  b.velocity_ = this.velocity_;
  b.angular_velocity_ = this.angular_velocity_;
  //b.width = this.width;
  //b.height = this.height;
  b.cm_body_ = this.cm_body_;
  b.mass_ = this.mass_;
  // assume that Vertexes and edges don't change;
  //console.log('POLYGON COPYTO '+body);
  b.left_body_ = this.left_body_;
  b.right_body_ = this.right_body_;
  b.top_body_ = this.top_body_;
  b.bottom_body_ = this.bottom_body_;
};

/** @inheritDoc */
Polygon.prototype.createCanvasPath = function(context) {
  context.beginPath();
  // v0 = starting Vertex of the current path being examined
  goog.array.forEach(this.paths_, function(v0) {
    context.moveTo(v0.locBodyX(), v0.locBodyY());
    /** @type {!Vertex} */
    var v = v0; // v = current Vertex being examined
    do { // for each Edge of the current sub-path
      // find the next Edge
      var e = v.getEdge2();
      if (e == null) {
        throw new Error();
      }
      goog.asserts.assertObject(e);
      goog.asserts.assert(e.getVertex1() == v); // starting Vertex of this Edge
      // find next Vertex on this Edge
      v = e.getVertex2();
      goog.asserts.assert(v.getEdge1() == e); // previous Edge of Vertex
      e.addPath(context);
    } while (v != v0);
    // closePath():  Closes the current subpath by drawing a straight line
    // back to the coordinates of the last moveTo.  It then begins a new subpath
    // (as if by calling moveTo()) at that same point.
    context.closePath();
  });
  if (goog.DEBUG && (Polygon.SHOW_VERTICES || Polygon.SHOW_ALL_VERTICES)) {
    // put a small circle at each Vertex
    goog.array.forEach(this.vertices_, function(v) {
      context.moveTo(v.locBodyX(), v.locBodyY());
      if (Polygon.SHOW_ALL_VERTICES || v.isEndPoint()) {
        context.arc(v.locBodyX(), v.locBodyY(), 0.1, 0, 2*Math.PI,
          /*anticlockwise=*/false);
      }
    });
  }
};

/** @inheritDoc */
Polygon.prototype.doesNotCollide = function(body) {
  return goog.array.contains(this.nonCollideBodies_, body);
};

/** @inheritDoc */
Polygon.prototype.eraseOldCopy = function() {
  this.body_old_ = null;
};

/** Finds the geometric center or 'centroid' of this Polygon, which is the point that
minimizes the distance to all Vertexes.
@return {!Vector} the geometric center of this Polygon, in body
    coordinates.
*/
Polygon.prototype.findCentroid = function() {
  var NEARNESS_TOLERANCE = 1e-6;
  // this should probably also calculate the centroidRadius_ as a by-product;
  var info = new Array(2);
  var delta = 0.1 * Math.max(this.getWidth(), this.getHeight());
  var s = new Array(3); // starting points
  s[0] = new MutableVector(this.cm_body_.getX()+delta, this.cm_body_.getY());
  s[1] = new MutableVector(this.cm_body_.getX(), this.cm_body_.getY()+delta);
  s[2] = new MutableVector(this.cm_body_.getX()-delta, this.cm_body_.getY()-delta);
  var thisPolygon = this;
  var centroid = UtilEngine.findMinimumSimplex(s, function(p_body) {
      return thisPolygon.maxRadiusSquared(p_body.immutable());
    }, NEARNESS_TOLERANCE, info);
  if (info[1] != 0) {
    throw new Error(goog.DEBUG ? ('could not find centroid, iterations='+info[0]) : '');
  }
  return centroid;
};

/** Finish the construction of the Polygon. Close any open path; calculate the bounding
box, centroid, centroid radius; set to default values the center of mass, moment, and
drag point.
* @return {undefined}
*/
Polygon.prototype.finish = function() {
  if (this.finished_) {
    throw new Error('Polygon construction is finished.');
  }
  if (this.startVertex_ != null) {
    this.closePath();
  }
  this.finished_ = true;
  this.checkConsistent();
  this.calculateSize();
  // default values for cm and dragPoint, can be changed later.
  this.setCenterOfMass(this.getLeftBody() + this.getWidth()/2,
      this.getBottomBody() + this.getHeight()/2);
  if (this.getWidth() <= this.getHeight()) {
    this.setDragPoints([new Vector(this.getLeftBody() + 0.5*this.getWidth(),
        this.getBottomBody() + 0.8*this.getHeight()),
        new Vector(this.getLeftBody() + 0.5*this.getWidth(),
        this.getBottomBody() + 0.2*this.getHeight())
        ]);
  } else {
    this.setDragPoints([new Vector(this.getLeftBody() + 0.8*this.getWidth(),
        this.getBottomBody() + 0.5*this.getHeight()),
        new Vector(this.getLeftBody() + 0.2*this.getWidth(),
        this.getBottomBody() + 0.5*this.getHeight())
        ]);
  }
  // default for moment is to assume rectangular shape
  var w = this.getWidth();
  var h = this.getHeight();
  this.setMomentAboutCM((w*w + h*h)/12);
  this.specialNormalWorld_ = null;
  // force the centroid to be calculated
  var centroid_body = this.getCentroidBody();
  if (Polygon.PRINT_POLYGON_STRUCTURE && goog.DEBUG) {
    this.printAll();
  }
};

/** @inheritDoc */
Polygon.prototype.getAccuracy = function() {
  return this.accuracy_;
};

/** @inheritDoc */
Polygon.prototype.getBottomBody = function() {
  return this.bottom_body_;
};

/** @inheritDoc */
Polygon.prototype.getCentroidBody = function() {
  if (this.centroid_body_ == null) {
    this.centroid_body_ = this.findCentroid();
    this.setCentroid(this.centroid_body_);
  }
  return this.centroid_body_;
};

/** @inheritDoc */
Polygon.prototype.getCentroidRadius = function() {
  return this.centroidRadius_;
};

/** @inheritDoc */
Polygon.prototype.getDistanceTol = function() {
  return this.distanceTol_;
};

/** Returns the actual list of edges of this body, for engine2D package use only.
@return {!Array<!Edge>} the list of edges of this body.
@package
*/
Polygon.prototype.getEdges_ = function() {
  return this.edges_;
};

/** Returns clone of the list of edges of this body.
@return {!Array<!Edge>} clone of the list of edges of this
    body.
*/
Polygon.prototype.getEdges = function() {
  return goog.array.clone(this.edges_);
};

/** @inheritDoc */
Polygon.prototype.getElasticity = function() {
  return this.elasticity_;
};

/** @inheritDoc */
Polygon.prototype.getLeftBody = function() {
  return this.left_body_;
};

/** @inheritDoc */
Polygon.prototype.getMinHeight = function() {
  //BUG WARNING:  Will be incorrect for Ball or Oval,
  //when the center of mass is not on one of the axes of the circle/ellipse.
  //BUG WARNING:  Should be recalculated if the center of mass changes.
  if (isNaN(this.minHeight_)) {
    var dist = UtilityCore.POSITIVE_INFINITY;
    // find minimum distance to an Edge.
    goog.array.forEach(this.edges_,
      function(e) {
        var d = e.distanceToPoint(this.cm_body_);
        if (1 == 0 && goog.DEBUG)
          console.log('d='+NF(d)+' cm='+this.cm_body_+' '+e);
        // Distance of infinity means the point is 'beyond' the Edge, ie.
        // not in the region perpendicular to the Edge.
        if (d == UtilityCore.POSITIVE_INFINITY)
          return;
        // if the distance to Edge is positive, then center of mass is 'outside'
        // in relation to this Edge.  This indicates the object has a more
        // complicated geometry, and we can't reliably calculate the min height.
        // But we return zero for the minHeight in this case,
        // on the theory that the CM is outside of the body, so the minimum
        // possible distance to the CM is zero.
        if (d > 0) {
          dist = 0;
          return;
        }
        // distance to Edge regards negative as inside, flip this around
        d = -d;
        if (d < dist)
          dist = d;
      }, this);
    // If the above didn't work, then use the method
    // which looks at the body as a rectangle.
    if (dist == UtilityCore.POSITIVE_INFINITY)
      dist = this.getMinHeight2();
    this.minHeight_ = dist;
  }
  return this.minHeight_;
};

/** Finds minimum height by looking at center of mass compared to bounding box.
* @return {number} minimum height that this object can be at
* @private
*/
Polygon.prototype.getMinHeight2 = function() {
  if (isNaN(this.minHeight_)) {
    var dist = UtilityCore.POSITIVE_INFINITY;
    var d;
    for (var i = 0; i <= 3; i++) {
      switch (i) {
        case 0:
          d = this.cm_body_.getY() - this.getBottomBody();
          break;
        case 1:
          d = this.getRightBody() - this.cm_body_.getX();
          break;
        case 2:
          d = this.getTopBody() - this.cm_body_.getY();
          break;
        case 3:
          d = this.cm_body_.getX() - this.getLeftBody();
          break;
        default:
          d = UtilityCore.POSITIVE_INFINITY;
          break;
      }
      if (d < dist)
        dist = d;
    }
    this.minHeight_ = dist;
  }
  return this.minHeight_;
};

/** @inheritDoc */
Polygon.prototype.getOldCopy = function() {
  // if there is no old body, then there has been no change in the state
  // therefore, return 'this', the current body.
  if (this.body_old_ == null) {
    return this;
  } else {
    return this.body_old_;
  }
};

/** @inheritDoc */
Polygon.prototype.getRightBody = function() {
  return this.right_body_;
};

/** The normal vector (if any) used in the special edge proximity test. When a special
edge has been specified, that Edge that takes priority for collision handling, as in a
wall object, and this method returns the normal vector to use for special proximity
testing. Otherwise this returns `null` and regular proximity testing is done. A normal
is a unit-length Vector that is perpendicular to an Edge. This maintains a cache to
avoid computational costs.
See [Special Edge for Proximity Testing](#specialedgeforproximitytesting).
See {@link #setSpecialEdge}.
@package
@return {?Vector} normal vector for special edge, in world
coordinates, or null when there is no special edge
*/
Polygon.prototype.getSpecialNormalWorld = function() {
  var e = this.specialEdge_;
  if (e == null)
    return null;
  var v = this.specialNormalWorld_;
  if (v == null) {
    if (goog.DEBUG) UtilityCollision.specialNormalMisses++;
    v = this.rotateBodyToWorld(e.getNormalBody(Vector.ORIGIN));
    this.specialNormalWorld_ = v;
  } else {
    if (goog.DEBUG) UtilityCollision.specialNormalHits++;
  }
  return v;
};

/** Returns starting Vertex for current open path, or `null` if there is no open path.
* See {@link #startPath}.
* @return {?Vertex} starting Vertex for the current open path,
*    or `null` if there is no open path.
*/
Polygon.prototype.getStartVertex = function() {
  return this.startVertex_;
};

/** @inheritDoc */
Polygon.prototype.getTopBody = function() {
  return this.top_body_;
};

/** Returns the name of the specified variable.
@param {number} index  which variable name is desired: 0 = x-position, 1 = x-velocity,
    2 = y-position, 3 = y-velocity, 4 = angle, 5 = angular velocity
@param {boolean} localized whether to return localized variable name
@return {string} the name of the specified variable for this particular body
*/
Polygon.prototype.getVarName = function(index, localized) {
  var s = this.getName(localized)+' ';
  switch (index) {
    case 0: s += 'X '+(localized ? Polygon.i18n.POSITION : Polygon.en.POSITION);
      break;
    case 1: s += 'X '+(localized ? Polygon.i18n.VELOCITY : Polygon.en.VELOCITY);
      break;
    case 2: s += 'Y '+(localized ? Polygon.i18n.POSITION : Polygon.en.POSITION);
      break;
    case 3: s += 'Y '+(localized ? Polygon.i18n.VELOCITY : Polygon.en.VELOCITY);
      break;
    case 4: s += localized ? Polygon.i18n.ANGLE : Polygon.en.ANGLE;
      break;
    case 5: s += localized ? Polygon.i18n.ANGULAR_VELOCITY :
        Polygon.en.ANGULAR_VELOCITY;
      break;
    default:
      throw new Error();
  }
  return s;
};

/** @inheritDoc */
Polygon.prototype.getVarsIndex = function() {
  return this.varsIndex_;
};

/** @inheritDoc */
Polygon.prototype.getVelocityTol = function() {
  return this.velocityTol_;
};

/** Returns the list of Vertexes of this body, for engine2D package use only.
@return {!Array<!Vertex>}the list of Vertexes of this body.
@package
*/
Polygon.prototype.getVertexes_ = function() {
  return this.vertices_;
};

/** @inheritDoc */
Polygon.prototype.getVerticesBody = function() {
  return goog.array.map(this.vertices_, function(v) { return v.locBody(); });
};

/** Returns last Edge in current open path or `null` when there is no last Edge or no
open path.
* @return {?Edge} last Edge in current open path
*     or `null` when there is no last Edge or no open path.
*/
Polygon.prototype.lastOpenEdge = function() {
  if (this.startVertex_ == null) {
    throw new Error();
  }
  var edge = this.startVertex_.safeGetEdge2();
  if (edge == null)
    return null;
  while (true) {
    var v = edge.getVertex2();
    var e = v.safeGetEdge2();
    if (e == null) {
      break;
    }
    edge = e;
    // detect infinite loop
    if (v == this.startVertex_)
      throw new Error();
  }
  return edge;
};

/** Returns last Vertex in current open path. This is the ending Vertex of the last Edge
in the linked list of Edges that makes up the open path. If there is no Edge in the path
then this is the starting Vertex, see {@link #startPath} and {@link #getStartVertex}.

* @return {!Vertex} last Vertex in current open path
* @throws {Error} if there is no open path
*/
Polygon.prototype.lastOpenVertex = function() {
  if (this.startVertex_ == null) {
    throw new Error(Polygon.OPEN_PATH_ERROR);
  }
  var lastEdge = this.lastOpenEdge();
  if (lastEdge == null) {
    return this.startVertex_;
  } else {
    return lastEdge.getVertex2();
  }
};

/** Returns the square of the maximum distance from the given point in body coords to
any Vertex of this Polygon.
* @param {!Vector} p_body  the point in body coords
* @return {number} the square of the maximum distance from the given point in
*    body coords to any Vertex of this Polygon
* @private
*/
Polygon.prototype.maxRadiusSquared = function(p_body) {
  var maxR = 0;
  goog.array.forEach(this.vertices_, function(v) {
    var d = p_body.distanceTo(v.locBody());
    if (d > maxR)
      maxR = d;
  });
  // maximum chord error is the most that distance from p_body to a curved Edge
  // can be in error by, because we are only looking at the 'decorated Vertexes'
  // on the curved Edge.
  var mce = 0;  // maximum chord error
  goog.array.forEach(this.edges_, function(e) {
    var ce = e.chordError();
    if (ce > mce)
      mce = ce;
  });
  // add max chord error to max Vertex distance, and square.
  maxR += mce;
  return maxR*maxR;
};

/** Whether this Polygon can collide with an Edge or Vertex of another Polygon.
Returns `true` when passing `null` for the Edge.
@param {?Edge} edge an Edge of another body, or `null`
@return {boolean} true if this body cannot collide with the given Edge or if `edge` is
    null.
*/
Polygon.prototype.nonCollideEdge = function(edge) {
  if (edge == null) {
    return true;
  }
  if (this.nonCollideSet_ != null) {
    return this.nonCollideSet_.contains(edge);
  } else {
    return false;
  }
};

if (goog.DEBUG) {
  /** Prints all edges and Vertexes to console for debugging.
  * @return {undefined}
  */
  Polygon.prototype.printAll = function() {
    console.log(this.toString());
    /** @type {!Vertex} */
    var vLast = this.vertices_[this.vertices_.length - 1];
    goog.array.forEach(this.vertices_,
      function(v, k) {
        var d = v.locBody().distanceTo(vLast.locBody());
        console.log('('+(k)+') '+v+' dist to prev vertex = '+NF(d));
        vLast = v;
      }
    );
    goog.array.forEach(this.edges_, function(e, k) {
      console.log('('+(k)+') '+e);
    });
  };
};

/** Returns true if the given body coords point is probably inside this polygon.

WARNING:  For debugging only.  Does not work for complex (non-convex) shapes.
@package
@param {!Vector} p_body the point in body coords
@return {boolean} true if the given body coords point is probably inside this polygon
*/
Polygon.prototype.probablyPointInside = function(p_body) {
  // look for an Edge with positive distance to the point,
  // which means the point is outside the body.
  var edge = goog.array.find(this.edges_,
    function(e, index, array) {
      return e.distanceToLine(p_body) > 0;
    }
  );
  return edge == null;
};

/** @inheritDoc */
Polygon.prototype.removeNonCollide = function(bodies) {
  goog.array.removeAllIf(this.nonCollideBodies_, function(body, index, arr) {
    return goog.array.contains(bodies, body);
  });
};

/** @inheritDoc */
Polygon.prototype.saveOldCopy = function() {
  // reuse existing copy when possible to avoid allocation
  var p = this.body_old_;
  if (p == null) {
    p = new Polygon('body_old');
  }
  this.copyTo(p);
  this.body_old_ = p;
};

/** @inheritDoc */
Polygon.prototype.setAccuracy = function(accuracy) {
  if (accuracy <= 0 || accuracy > 1) {
    throw new Error('accuracy must be between 0 and 1, is '+accuracy);
  }
  this.accuracy_ = accuracy;
};

/** Sets the center of the circle to use for proximity testing and also calculates the
radius of the circle. A circle centered at this centroid with radius
`getCentroidRadius()` should encompass this Polygon.
@param {!Vector} centroid_body the center of the circle to use for
proximity testing in world coords, in body coordinates
@return {!Polygon} this Polygon, for chaining setters
@throws {Error} when `setCentroid` is called while the Polygon is 'open' in process of
    adding edges, before the Polygon is closed with `finish()` method
*/
Polygon.prototype.setCentroid = function(centroid_body) {
  if (this.startVertex_ != null) {
    throw new Error('setCentroid called before finish, while creating Polygon');
  }
  this.centroid_body_ = centroid_body;
  // check that the assigned centroid is reasonable
  // (If not, it is still OK, just less efficient because centroidRadius_ is bigger
  // than necessary).
  if (goog.DEBUG) {
    // NOTE: there is a performance difference from doing this test!
    var ctrd = this.findCentroid();
    var c_dist = centroid_body.distanceTo(ctrd);
    goog.asserts.assert(c_dist < 0.01, 'dist='+NF(c_dist)+' ctrd='+ctrd
        +' centroid_body='+centroid_body);
    if (0 == 1) {
      console.log('centroid '+centroid_body
          +' dist to calculated centroid='+NF(centroid_body.distanceTo(ctrd)));
    }
  }
  // in case the centroid was set before all the edges were added
  // we compute the centroidRadius_ again.
  this.centroidRadius_ = Math.sqrt(this.maxRadiusSquared(centroid_body));
  return this;
};

/** @inheritDoc */
Polygon.prototype.setDistanceTol = function(value) {
  this.distanceTol_ = value;
};

/** @inheritDoc */
Polygon.prototype.setElasticity = function(value) {
  this.elasticity_ = value;
};

/** Set the mass of this Polygon.
@param {number} mass the mass of this Polygon
@return {!Polygon} this object for chaining setters
*/
Polygon.prototype.setMass = function(mass) {
  if (mass <= 0 || !goog.isNumber(mass)) {
    throw new Error('mass must be positive '+mass);
  }
  this.mass_ = mass;
  return this;
};

/** Specifies that this Polygon does not collide with the given set of Edges of
other Polygons; replaces any existing non-collide EdgeSet. No collisions or contacts
are generated between this Polygon and the Edges in the given EdgeSet.
Use this when some parts of a Polygon **DO** interact.  If **NO** parts interact then
see {@link myphysicslab.lab.engine2D.RigidBody#addNonCollide}.
@param {!EdgeSet} nonCollideSet  the set of other body edges
    to not collide with
*/
Polygon.prototype.setNonCollideEdge = function(nonCollideSet) {
  this.nonCollideSet_ = nonCollideSet;
};

/** @inheritDoc */
Polygon.prototype.setPosition = function(loc_world, angle) {
  this.loc_world_ = loc_world.immutable();
  if (goog.isDef(angle) && isFinite(angle) && this.angle_ != angle) {
    this.angle_ = angle;
    this.sinAngle_ = Math.sin(angle);
    this.cosAngle_ = Math.cos(angle);
    // invalidate the cache of the special normal vector in world coords
    this.specialNormalWorld_ = null;
  }
  // invalidate the cache of centroids in world coordinates
  for (var i=0, len=this.edges_.length; i<len; i++) {
    this.edges_[i].forgetPosition();
  }
};

/** Sets which Edge takes priority for collision handling, as in a wall object. Can only
be called on a rectangular Polygon.
Sets the centroid radius of the non-special edges on this Polygon to zero, which makes
all those non-special edges inoperative for collision detection purposes.
See [Special Edge for Proximity Testing](#specialedgeforproximitytesting).
See {@link #getSpecialNormalWorld}.
@param {number} edgeIndex the index of the Edge that takes priority
    for collision handling, within the Polygon's list of edges
@param {number} radius the radius of the circle to use for proximity testing.
@throws {Error} if this is not a rectangular Polygon, or the
    `edgeIndex` is not in range
*/
Polygon.prototype.setSpecialEdge = function(edgeIndex, radius) {
  if (this.edges_.length != 4)
    throw new Error(goog.DEBUG ? 'can only set special edge on rectangle' : '');
  if (edgeIndex < 0 || edgeIndex > 3)
    throw new Error();
  this.specialEdge_ = this.edges_[edgeIndex];
  this.centroidRadius_ = radius;
  // Set centroid radius of all non-special edges to zero.
  // This makes all those edges non-operative for collision detection.
  goog.array.forEach(this.edges_, function(e) {
    if (e != this.specialEdge_) {
      e.setCentroidRadius(0);
    }
  }, this);
};

/** Sets the index into the {@link myphysicslab.lab.model.VarsList VarsList} for this
Polygon. The VarsList contains 6 values for each Polygon,

1. x-position,
2. x-velocity,
3. y-position,
4. y-velocity,
5. angle,
6. angular velocity

* @param {number} index  the index of the x-position in the VarsList for this Polygon;
*   or -1 if this Polygon is not in the VarsList.
*/
Polygon.prototype.setVarsIndex = function(index) {
  this.varsIndex_ = index;
};

/** @inheritDoc */
Polygon.prototype.setVelocityTol = function(value) {
  this.velocityTol_ = value;
};

/** Start creating a path in this Polygon at the given Vertex or Edge.
* @param {!Vertex|!Edge}
*    vertexOrEdge the Vertex or Edge to start the path at
*/
Polygon.prototype.startPath = function(vertexOrEdge) {
  if (this.finished_) {
    throw new Error('Polygon construction is finished.');
  }
  if (this.startVertex_ != null) {
    throw new Error('there is already an open path');
  }
  if (vertexOrEdge instanceof ConcreteVertex) {
    var vertex = /** @type {!Vertex}*/(vertexOrEdge);
    this.startVertex_ = vertex;
    this.vertices_.push(this.startVertex_);
  } else {
    var edge = /** @type {!Edge}*/(vertexOrEdge);
    this.startVertex_ = edge.getVertex1();
    this.vertices_.push(this.startVertex_);
    this.edges_.push(edge);
  }
};

/** Set of internationalized strings.
@typedef {{
  POLYGON: string,
  ANGLE: string,
  ANGULAR_VELOCITY: string,
  POSITION: string,
  VELOCITY: string
  }}
*/
Polygon.i18n_strings;

/**
@type {Polygon.i18n_strings}
*/
Polygon.en = {
  POLYGON: 'polygon',
  ANGLE: 'angle',
  ANGULAR_VELOCITY: 'angular velocity',
  POSITION: 'position',
  VELOCITY: 'velocity'
};

/**
@private
@type {Polygon.i18n_strings}
*/
Polygon.de_strings = {
  POLYGON: 'Polygon',
  ANGLE: 'Winkel',
  ANGULAR_VELOCITY: 'Winkelgeschwindigkeit',
  POSITION: 'Position',
  VELOCITY: 'Geschwindigkeit'
};

/** Set of internationalized strings.
@type {Polygon.i18n_strings}
*/
Polygon.i18n = goog.LOCALE === 'de' ? Polygon.de_strings :
    Polygon.en;

}); // goog.scope
