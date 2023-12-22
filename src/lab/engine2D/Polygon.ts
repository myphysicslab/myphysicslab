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

import { AffineTransform } from '../util/AffineTransform.js';
import { Collision } from '../model/Collision.js';
import { CircularEdge } from './CircularEdge.js';
import { ConcreteVertex } from './ConcreteVertex.js';
import { DoubleRect } from '../util/DoubleRect.js';
import { EdgeSet } from './EdgeSet.js';
import { LocalCoords } from './LocalCoords.js';
import { MassObject, AbstractMassObject } from '../model/MassObject.js';
import { MutableVector } from '../util/MutableVector.js';
import { RigidBody, Edge, Vertex } from './RigidBody.js';
import { RigidBodyCollision } from './RigidBody.js';
import { SimObject } from '../model/SimObject.js';
import { StraightEdge } from './StraightEdge.js';
import { UtilEngine, DebugEngine2D } from './UtilEngine.js';
import { UtilCollision } from './UtilCollision.js';
import { Util } from '../util/Util.js';
import { Vector, GenericVector } from '../util/Vector.js';

/** A RigidBody made of connected Edges and Vertexes.

See [2D Physics Engine Overview](../Engine2D.html) about the rigid body physics engine.

### Body Coordinates

For explanation of **body vs. world coordinates** see
[Body Coordinates](../Engine2D.html#bodycoordinates),
{@link MassObject} and {@link lab/model/CoordType.CoordType | CoordType}.

Methods that return a location often have names ending with either 'body' or 'world' to
indicate the coordinate system. Similarly, parameters of methods often end with 'body'
or 'world'.

### Structure of a Polygon

A Polygon consists of a set of connected Edges, which together form one or
more ***paths***. A Polygon can have more than one path, for example a
donut shape would have 2 paths: one for the outer Edge and one for the inner Edge.

A path in a Polygon consists of a linked list of Edges and Vertexes:

<img src="../Polygon_Vertex_Edge_List.svg">

An Edge has a starting and ending Vertex, and a Vertex has a previous and next Edge. So
we can follow a path from the starting Vertex until returning again to the
starting Vertex when the path is then closed.

The list of paths is simply a list of starting Vertexes. Each path wraps around to its
starting Vertex to form a closed loop. A path must have at least one Vertex and
one Edge.

A path is used when drawing the Polygon. For collision handling, the collection of
Edges and Vertexes are what matters, how they are linked into a path is irrelevant.

The Edges in a Polygon are stored in an array, and Edges can be referred to by their
index in this array, see {@link RigidBody.getEdges} and
{@link Edge.getIndex}.

The list of Vertexes may include automatically generated 'mid-point Vertexes' for
curved Edges. These Vertexes are added to give better collision detection for curved
Edges. See {@link Vertex} about end-point vs. mid-point Vertexes.

### Creating a Polygon

+ First create a Polygon with the constructor; it has no Vertexes or Edges.

+ Call {@link startPath} to begin making a path. You can start with a single Vertex or
an Edge.

+ Use {@link addEdge} as many times as desired to add Edges. Or use the shortcut
methods {@link addStraightEdge}, {@link addCircularEdge} or {@link addCircularEdge2}.

+ (optional) Use {@link closePath} if you want to add another path with `startPath`.

+ Call {@link finish} which will close the current path and calculate the centroid for
the Polygon.

Note that just creating an Edge can add it to the existing linked list of Vertexes
and Edges being formed in the currently open path. The {@link addEdge} method completes
the process of adding the Edge to the Polygon.

For examples of creating a Polygon see {@link lab/engine2D/Shapes.Shapes | Shapes}.

### Centroids & Proximity Testing

We need a quick way to know if objects are close enough to warrant the more expensive
tests that are done to find collisions and contacts. To this end, we find the
smallest circle that encloses the object. The center of this circle is the
'centroid' or geometric center of the object. The radius is the "centroid
radius".

There is a similar centroid and centroid radius for each Edge, which gives the smallest
circle that encloses that Edge.

Some of the proximity tests can be found in {@link UtilCollision.checkVertexes}. Of
note is that we expand the centroid radius by the distance that the Vertex has
travelled during the current time step. And that we use the *distance squared* in these
tests, to avoid the computational cost of the square root function.

### Special Edge for Proximity Testing

<img src="../Polygon_Special_Edge.svg">

Walls are a special case for proximity testing. Because they are typically long and
thin, their proximity circle is huge compared to the wall object; and so the proximity
test fires many false positives.

To remedy this, we allow specifying a 'special edge' via {@link setSpecialEdge}
which changes how the proximity testing is done for this object.

When there is a special edge (there can only be one per object), then the proximity test
still looks at the distance between the centroid of each object, but now only the
portion of that distance that is *normal to the special edge*. Also, a special centroid
radius is defined for the object that is used in this proximity test. For a wall, this
special centroid radius is half of the (short) width of the wall object.

Only the special edge is tested for collisions, so care should be taken to avoid objects
being able to collide into any of the non-special edge walls.

### Old Coords Is Used For Collision Detection

A Polygon keeps a copy of its local coordinate system before the last time step of the
differential equation solver. The copy is used for collision detection, to determine
how a collision may have happened; for example whether a Vertex crossed over an Edge
during the last time step. See {@link saveOldCoords},
{@link getOldCoords}, and {@link eraseOldCoords}.

### Minimum Height

The minimum height of a Polygon is used for potential energy calculations, see
{@link getMinHeight}.

The minimum height can be explicitly set for each Polygon, see
{@link setMinHeight}. If it is not set, the method {@link getMinHeight}
will try to determine the minumum height by calculating the smallest distance between
the center of mass and the body's Edges.

Some cautions about `getMinHeight`:

+ The `getMinHeight` calculation can fail for more complicated shapes or when the center
of mass is outside of the body.

+ The `getMinHeight` calculation will be incorrect for a circle or oval when the center
of mass is not on one of the axes of the circle/ellipse.

+ The minimum height is cached, and should be recalculated if the center of mass
changes. To do so, call `setMinHeight(NaN)` and the next time `getMinHeight` is
called it will recalculate.

**TO DO** Each collision or contact is being calculated twice. Each body is calculating
all its collisions/contacts, so redundant combinations are being done. (Though some
bodies don't capture all of their possible collisions/contacts: block only looks for
corner contacts, not edges.)

**TO DO** momentAboutCM: unclear whether this is correctly calculated. Moment
calculation is wrong when center of mass is offset; there's a formula for that.
momentAboutCM is wrong, unless it is a rectangle object.

**TO DO** in addCollision(): nearness is hard coded at 0.1. Instead, base it on length
of the edges.

**TO DO** minHeight is complicated, because not well defined.  For examples: donut;
concave oval Edge on rectangle; these are not easy to figure out.

*/
export class Polygon extends AbstractMassObject implements SimObject, RigidBody, MassObject {
  /** list of Vertexes in this Polygon */
  private vertices_: Vertex[] = [];
  /** list of Edges in this Polygon */
  private edges_: Edge[] = [];
  /** whether Polygon is finished being constructed */
  private finished_: boolean = false;
  /** start Vertex of current path; only used during construction */
  private startVertex_: null|Vertex = null;
  /** list of starting Vertex for each sub-path */
  private paths_: Vertex[] = [];
  /** A set of Edges on some other Polygon that this Polygon never collides with. */
  private nonCollideSet_: null|EdgeSet = null;
  /** elasticity of this body, from 0 to 1. */
  private elasticity_: number = 1.0;
  /** list of objects this body does not collide with */
  private nonCollideBodies_: RigidBody[] = [];
  /** Geometric center of this Polygon, in body coords */
  private centroid_body_: null|Vector = null;
  /** cached centroid radius = max distance between center of mass and any point on body
  */
  private centroidRadius_: number = NaN;
  /** An Edge that takes priority for collision handling, as in a wall object,
  when this is not null then special proximity testing is done.
  Note that the other Edges of this object will have zero centroid radius and therefore
  will be inactive for collisions;  and this allows objects to penetrate into this
  body thru those inactive Edges.
  */
  private specialEdge_: null|Edge = null;
  /** the special normal Edge (if any) in world coords. This is a cache to
  avoid costs of doing rotateBodyToWorld and getNormalBody method.
  */
  private specialNormalWorld_: null|Vector = null;
  /** left side of bounds in body coordinates */
  private left_body_: number = NaN;
  /** right side of bounds in body coordinates */
  private right_body_: number = NaN;
  /** top of bounds in body coordinates */
  private top_body_: number = NaN;
  /** bottom of bounds in body coordinates */
  private bottom_body_: number = NaN;
  /** the index into the variables array for this Polygon, or -1 if not in vars array*/
  private varsIndex_: number = -1;
  /** coordinate system of this body in its last known position prior to the present */
  private body_old_: null|LocalCoords = null;
  /** Keep LocalCoords to avoid allocating a new one, for better performance. */
  private body_old_save_: LocalCoords = new LocalCoords();
  /** distance tolerance, for determining if RigidBody is in contact with another
  * RigidBody
  */
  private distanceTol_: number = 0.01;
  /** velocity tolerance, for determining if RigidBody is in contact with another
  * RigidBody
  */
  private velocityTol_: number = 0.5;
  /** How close in space we need to be to a collision, to decide to handle it,
  * as a percentage of the targetGap = distanceTol/2.
  */
  private accuracy_: number = 0.6;

/**
* @param opt_name name of this Polygon for scripting (language independent)
* @param opt_localName localized name of this Polygon, for display to user
*/
constructor(opt_name?: string, opt_localName?: string) {
  let name, localName;
  if (opt_name) {
    name = opt_name;
    localName = opt_localName ?? name;
  } else {
    const id = Polygon.ID++;
    name = Polygon.en.POLYGON+id;
    localName = Polygon.i18n.POLYGON+id;
  }
  super(name, localName);
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', elasticity: ' +Util.NF(this.elasticity_)
      +', distanceTol_: '+Util.NF(this.distanceTol_)
      +', velocityTol_: '+Util.NF(this.velocityTol_)
      +', accuracy_:'+Util.NF(this.accuracy_)
      +', varsIndex_: '+this.varsIndex_
      +', centroid_body_: '+this.centroid_body_
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'Polygon';
};

/** Adds a CircularEdge to the open path of this Polygon, starting at the current last
Vertex and ending at the given point, with the given center for the circular arc, and
moving clockwise or counter-clockwise from the start Vertex. See
{@link lastOpenVertex} and {@link startPath}.

@param p_body the endpoint of the new Edge, in body coordinates
@param center_body the center point in body coordinates
@param clockwise true moves clockwise, false moves counter-clockwise
@param outsideIsOut `true` means that any point outside the circle is outside
    of this body; `false` means the opposite, that any point inside the circle is
    outside this body.
@return the Edge that is created
@throws if Polygon does not have an open path to add Edges to
@throws if `p_body` and last point are not equidistant from `center_body`
    within `CircularEdge.TINY_POSITIVE` tolerance
*/
addCircularEdge(p_body: Vector, center_body: Vector, clockwise: boolean, outsideIsOut: boolean): CircularEdge {
  const edge = new CircularEdge(this, this.lastOpenVertex(),
      new ConcreteVertex(p_body,), center_body, clockwise,
      outsideIsOut);
  this.addEdge(edge);
  return edge;
};

/** Adds a CircularEdge to the open path of this Polygon, starting at the current last
Vertex and ending at the given point, with the given radius for the circular arc, and
moving clockwise or counter-clockwise from the start Vertex. See
{@link lastOpenVertex} and {@link startPath}.

The center point is calculated from the two end-points, the radius, the direction
(clockwise or counter-clockwise), and the `aboveRight` parameter. The center is at the
vertex of an isoceles triangle with edges of length `radius` and base being the line
from the last point to `p_body`.

There are two choices for where to put the center in relation to the line connecting the
two given points: either above or below the line. The `aboveRight` parameter specifies
which choice to make. For a vertical connecting line, the choice is right or left of the
line.

@param p_body the endpoint of the new Edge, in body coordinates
@param radius the radius of the CircularEdge
@param aboveRight if `true`, then the center of CircularEdge is located
    above or right of the line connecting `vertex1` and `vertex2`;
    if `false`, then center is located below or left of the connecting line.
@param clockwise true moves clockwise, false moves counter-clockwise
@param outsideIsOut `true` means that any point outside the circle is outside
    of this body; `false` means the opposite, that any point inside the circle is
    outside this body.
@return the Edge that is created
@throws if Polygon does not have an open path to add Edges to
*/
addCircularEdge2(p_body: Vector, radius: number, aboveRight: boolean, clockwise: boolean, outsideIsOut: boolean): CircularEdge {
  const edge = CircularEdge.make(this, this.lastOpenVertex(),
      new ConcreteVertex(p_body), radius, aboveRight, clockwise,
      outsideIsOut);
  this.addEdge(edge);
  return edge;
};

/** Adds the Edge to current open path. The start Vertex of the Edge must
* match the end Vertex of last Edge in open path as given by {@link lastOpenVertex}.
* See {@link startPath}.
* @param edge the Edge to add to current open path
* @throws if there is no open path, or the start Vertex of the Edge does not
*     match the end Vertex of last Edge in open path.
*/
addEdge(edge: Edge) {
  if (this.finished_) {
    throw 'cannot add edges to finished Polygon';
  }
  if (this.startVertex_ == null) {
    throw Polygon.OPEN_PATH_ERROR;
  }
  // the new Edge should already be linked in to this linked list:
  // startVertex_ -> edge -> vertex -> edge -> vertex -> edge -> vertex
  if (edge.getVertex2() != this.lastOpenVertex()) {
    throw 'edge is not connected to open path';
  }
  this.edges_.push(edge);
  edge.getDecoratedVertexes().forEach((v: Vertex)=>this.vertices_.push(v));
  if (edge.getVertex2() == this.startVertex_) {
    this.closePath();
  } else {
    this.vertices_.push(edge.getVertex2());
  }
};

/** @inheritDoc */
addNonCollide(bodies: RigidBody[]): void {
  bodies.forEach(b =>
    this.nonCollideBodies_.includes(b) ? 0 : this.nonCollideBodies_.push(b) );
};

/** Adds a StraightEdge to the open path of this Polygon, starting at the current last
Vertex and ending at the given point. See {@link lastOpenVertex} and
{@link startPath}.

@param p_body the end point of the new Edge, in body coordinates
@param outsideIsUp true means that any point above this Edge is
    on the outside of this body (for vertical lines a point to the right is outside);
    false means the opposite, that any point below (or left) is outside this body.
@return the Edge that is created
@throws if Polygon does not have an open path to add Edges to
*/
addStraightEdge(p_body: Vector, outsideIsUp: boolean): StraightEdge {
  // the StraightEdge adds itself to the Polygon's list of Edges & Vertexes
  const edge = new StraightEdge(this, this.lastOpenVertex(),
      new ConcreteVertex(p_body), outsideIsUp);
  this.addEdge(edge);
  return edge;
};

/** Calculates the bounding box for this object.  See {@link getBoundsBody}.
*/
private calculateSize(): void {
  let xmin = Infinity;
  let xmax = Number.NEGATIVE_INFINITY;
  let ymin = Infinity;
  let ymax = Number.NEGATIVE_INFINITY;
  this.edges_.forEach(e => {
    if (e.getLeftBody() < xmin)
      xmin = e.getLeftBody();
    if (e.getRightBody() > xmax)
      xmax = e.getRightBody();
    if (e.getBottomBody() < ymin)
      ymin = e.getBottomBody();
    if (e.getTopBody() > ymax)
      ymax = e.getTopBody();
  });
  /*if (1 == 0 && Util.DEBUG) {
    console.log('Polygon size xmin='+Util.NF(xmin)
      +' xmax='+Util.NF(xmax)
      +' ymin='+Util.NF(ymin)
      +' ymax='+Util.NF(ymax));
  }*/
  this.left_body_ = xmin;
  this.right_body_ = xmax;
  this.bottom_body_ = ymin;
  this.top_body_ = ymax;
};

/** @inheritDoc */
checkCollision(collisions: RigidBodyCollision[], body: Polygon, time: number): void {
  UtilCollision.checkVertexes(collisions, this, body, time);
  UtilCollision.checkVertexes(collisions, body, this, time);
  this.edges_.forEach(e1 => {
    if (body.nonCollideEdge(e1))
      return;
    body.getEdges().forEach(e2 => {
      if (this.nonCollideEdge(e2))
        return;
      // can't do this proximity test, unless you calculate a new speed limit
      // based on the minimum dimension across each Edge;
      // which for vertical or horizontal Edges is zero!
      // FEB 2011:  Edge/Edge tests are static intersection tests,
      // so speed doesn't matter anymore.
      // NOTE: also check setting of UtilEngine.PROXIMITY_TEST
      if (UtilEngine.PROXIMITY_TEST) {
        if (!e1.intersectionPossible(e2, this.distanceTol_)) {
          return;
        }
      }
      if (UtilCollision.HIGHLIGHT_COLLISION_TESTING && Util.DEBUG) {
        e1.highlight();
        e2.highlight();
      }
      e1.testCollisionEdge(collisions, e2, time);
    });
  });
};

private checkConsistent(): void {
  if (!this.finished_) {
    throw 'Polygon construction is not finished.';
  }
  // v0 = starting Vertex of the current path being examined
  this.paths_.forEach(v0 => {
    let v = v0; // v = current Vertex being examined
    do {
      // find the next Edge
      const e = v.getEdge2();
      if (e == null) {
        throw '';
      }
      Util.assert(Util.isObject(e));
      Util.assert(e.getVertex1() == v); // starting Vertex of this Edge
      // find next Vertex on this Edge
      v = e.getVertex2();
      Util.assert(v.getEdge1() == e); // previous Edge of Vertex
    } while (v != v0);
  });
};

/** Closes the current path of the Polygon. Connects the starting Vertex of the open
path with the last Edge of the open path. See {@link startPath}, {@link lastOpenEdge},
and {@link getStartVertex}.
@return `true` if there was an open path that was successfully closed
@throws if Polygon construction was previously finished
@throws if start and end Vertex of the path are not at the same location
*/
closePath(): boolean {
  if (this.finished_) {
    throw 'Polygon construction is finished.';
  }
  if (this.startVertex_ == null) {
    return false;
  }
  const lastEdge = this.lastOpenEdge();
  if (lastEdge == null) {
    return false;
  }
  if (lastEdge.getVertex2() != this.startVertex_) {
    this.closePath_(this.startVertex_, lastEdge.getVertex2());
  } else {
    Util.assert(this.startVertex_.getEdge2() == lastEdge);
  }
  this.paths_.push(this.startVertex_);
  this.startVertex_ = null;
  return true;
};

/** Closes an open path by connecting the Edges whose given Vertexes are at the same
location.

Each Vertex must be connected to only one Edge. The previous Edge for v1 must be null.
The next Edge for v2 must be null. Both Vertexes must be at (nearly) the same location
in space (the distance between them can be at most 1E-8).

The situation on entry is:
```text
prevEdge   vertex   nextEdge
--------   ------   --------
null         v1      edgeA
edgeB        v2      null
```
On exit the situation is:
```text
prevEdge   vertex   nextEdge
--------   ------   --------
edgeB        v1      edgeA
```
and Vertex v2 is deleted.
@param v1
@param v2
*/
private closePath_(v1: Vertex, v2: Vertex): void {
  if (v1.locBody().distanceTo(v2.locBody()) > 1E-8) {
    throw Util.DEBUG ? ('Vertexes must be at same location '+v1+' '+v2) : '';
  }
  const v2_edge1 = v2.getEdge1();
  if (v2_edge1 == null) {
    throw 'v2.edge1 is null; v2='+v2+'; this='+this;
  }
  v1.setEdge1(v2_edge1);
  v2_edge1.setVertex2(v1);
  Util.assert(this.vertices_.includes(v2));
  Util.remove(this.vertices_, v2);
};

/** @inheritDoc */
createCanvasPath(context: CanvasRenderingContext2D): void {
  context.beginPath();
  // v0 = starting Vertex of the current path being examined
  this.paths_.forEach(v0 => {
    context.moveTo(v0.locBodyX(), v0.locBodyY());
    let v = v0; // v = current Vertex being examined
    do { // for each Edge of the current sub-path
      // find the next Edge
      const e = v.getEdge2();
      if (e == null) {
        throw '';
      }
      Util.assert(Util.isObject(e));
      Util.assert(e.getVertex1() == v); // starting Vertex of this Edge
      // find next Vertex on this Edge
      v = e.getVertex2();
      Util.assert(v.getEdge1() == e); // previous Edge of Vertex
      e.addPath(context);
    } while (v != v0);
    // closePath():  Closes the current subpath by drawing a straight line
    // back to the coordinates of the last moveTo.  It then begins a new subpath
    // (as if by calling moveTo()) at that same point.
    context.closePath();
  });
  if (Util.DEBUG && (Polygon.SHOW_VERTICES || Polygon.SHOW_ALL_VERTICES)) {
    // put a small circle at each Vertex
    this.vertices_.forEach(v => {
      context.moveTo(v.locBodyX(), v.locBodyY());
      if (Polygon.SHOW_ALL_VERTICES || v.isEndPoint()) {
        context.arc(v.locBodyX(), v.locBodyY(), 0.1, 0, 2*Math.PI,
          /*anticlockwise=*/false);
      }
    });
  }
};

/** @inheritDoc */
doesNotCollide(body: RigidBody): boolean {
  return this.nonCollideBodies_.includes(body);
};

/** @inheritDoc */
eraseOldCoords(): void {
  this.body_old_ = null;
};

/** Finds the geometric center or 'centroid' of this Polygon, which is the point that
minimizes the distance to all Vertexes.
@return the geometric center of this Polygon, in body coordinates.
*/
findCentroid(): Vector {
  const NEARNESS_TOLERANCE = 1e-6;
  // this should probably also calculate the centroidRadius_ as a by-product;
  const info = new Array(2);
  const delta = 0.1 * Math.max(this.getWidth(), this.getHeight());
  const s = new Array(3); // starting points
  s[0] = new MutableVector(this.cm_body_.getX()+delta, this.cm_body_.getY());
  s[1] = new MutableVector(this.cm_body_.getX(), this.cm_body_.getY()+delta);
  s[2] = new MutableVector(this.cm_body_.getX()-delta, this.cm_body_.getY()-delta);
  const centroid = UtilEngine.findMinimumSimplex(s,
    p_body => this.maxRadiusSquared(Vector.clone(p_body)),
    NEARNESS_TOLERANCE, info);
  if (info[1] != 0) {
    throw Util.DEBUG ? ('could not find centroid, iterations='+info[0]) : '';
  }
  return centroid;
};

/** Finish the construction of the Polygon. Close any open path; calculate the bounding
box, centroid, centroid radius; set to default values the center of mass, moment, and
drag point.
*/
finish(): void {
  if (this.finished_) {
    throw 'Polygon construction is finished.';
  }
  if (this.startVertex_ != null) {
    this.closePath();
  }
  this.finished_ = true;
  this.checkConsistent();
  this.calculateSize();
  // default values for cm and dragPoint, can be changed later.
  this.setCenterOfMass(new Vector(this.getLeftBody() + this.getWidth()/2,
      this.getBottomBody() + this.getHeight()/2));
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
  const w = this.getWidth();
  const h = this.getHeight();
  this.setMomentAboutCM((w*w + h*h)/12);
  this.specialNormalWorld_ = null;
  // force the centroid to be calculated
  const centroid_body = this.getCentroidBody();
  if (Polygon.PRINT_POLYGON_STRUCTURE && Util.DEBUG) {
    this.printAll();
  }
};

/** @inheritDoc */
getAccuracy(): number {
  return this.accuracy_;
};

/** @inheritDoc */
getBottomBody(): number {
  return this.bottom_body_;
};

/** @inheritDoc */
getCentroidBody(): Vector {
  if (this.centroid_body_ == null) {
    this.centroid_body_ = this.findCentroid();
    this.setCentroid(this.centroid_body_);
  }
  return this.centroid_body_;
};

/** @inheritDoc */
getCentroidRadius(): number {
  return this.centroidRadius_;
};

/** @inheritDoc */
getDistanceTol(): number {
  return this.distanceTol_;
};

/** @inheritDoc */
getEdges(): Edge[] {
  return this.edges_;
};

/** @inheritDoc */
getElasticity(): number {
  return this.elasticity_;
};

/** @inheritDoc */
getLeftBody(): number {
  return this.left_body_;
};

/** @inheritDoc */
getMinHeight(): number {
  //BUG WARNING:  Will be incorrect for Ball or Oval,
  //when the center of mass is not on one of the axes of the circle/ellipse.
  //BUG WARNING:  Should be recalculated if the center of mass changes.
  if (isNaN(this.minHeight_)) {
    let dist = Infinity;
    // find minimum distance to an Edge.
    this.edges_.forEach(e => {
      let d = e.distanceToPoint(this.cm_body_);
      /*if (1 == 0 && Util.DEBUG)
        console.log('d='+Util.NF(d)+' cm='+this.cm_body_+' '+e);
      */
      // Distance of infinity means the point is 'beyond' the Edge, ie.
      // not in the region perpendicular to the Edge.
      if (d == Infinity)
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
    });
    // If the above didn't work, then use the method
    // which looks at the body as a rectangle.
    if (dist == Infinity)
      dist = this.getMinHeight2();
    this.minHeight_ = dist;
  }
  return this.minHeight_;
};

/** Finds minimum height by looking at center of mass compared to bounding box.
* @return minimum height that this object can be at
*/
private getMinHeight2(): number {
  if (isNaN(this.minHeight_)) {
    let dist = Infinity;
    let d;
    for (let i = 0; i <= 3; i++) {
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
          d = Infinity;
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
getOldCoords():  null|LocalCoords {
  return this.body_old_;
};

/** @inheritDoc */
getRightBody(): number {
  return this.right_body_;
};

/** @inheritDoc */
getSpecialNormalWorld(): Vector|null {
  const e = this.specialEdge_;
  if (e == null)
    return null;
  let v = this.specialNormalWorld_;
  if (v == null) {
    if (Util.DEBUG) UtilCollision.specialNormalMisses++;
    v = this.rotateBodyToWorld(e.getNormalBody(Vector.ORIGIN));
    this.specialNormalWorld_ = v;
  } else {
    if (Util.DEBUG) UtilCollision.specialNormalHits++;
  }
  return v;
};

/** Returns starting Vertex for current open path, or `null` if there is no open path.
* See {@link startPath}.
* @return starting Vertex for the current open path,
*    or `null` if there is no open path.
*/
getStartVertex(): Vertex|null {
  return this.startVertex_;
};

/** @inheritDoc */
getTopBody(): number {
  return this.top_body_;
};

/** @inheritDoc */
getVarName(index: number, localized: boolean): string {
  let s = this.getName(localized)+' ';
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
      throw '';
  }
  return s;
};

/** @inheritDoc */
getVarsIndex(): number {
  return this.varsIndex_;
};

/** @inheritDoc */
getVelocityTol(): number {
  return this.velocityTol_;
};

/** Returns the list of Vertexes of this body, for engine2D package use only.
@return the list of Vertexes of this body.
*/
getVertexes_(): Vertex[] {
  return this.vertices_;
};

/** @inheritDoc */
getVerticesBody(): Vector[] {
  return this.vertices_.map(v => v.locBody());
};

/** Returns last Edge in current open path or `null` when there is no last Edge or no
* open path.
* @return last Edge in current open path
*     or `null` when there is no last Edge or no open path.
*/
lastOpenEdge(): null|Edge {
  if (this.startVertex_ == null) {
    throw '';
  }
  let edge = this.startVertex_.safeGetEdge2();
  if (edge === null) {
    return null;
  }
  while (true) {
    if (edge === null) throw '';
    const v = edge.getVertex2();
    const e = v.safeGetEdge2();
    if (e === null) {
      break;
    }
    edge = e;
    // detect infinite loop
    if (v == this.startVertex_)
      throw '';
  }
  return edge;
};

/** Returns last Vertex in current open path. This is the ending Vertex of the last Edge
in the linked list of Edges that makes up the open path. If there is no Edge in the path
then this is the starting Vertex, see {@link startPath} and {@link getStartVertex}.

@return last Vertex in current open path
@throws if there is no open path
*/
lastOpenVertex(): Vertex {
  if (this.startVertex_ == null) {
    throw Polygon.OPEN_PATH_ERROR;
  }
  const lastEdge = this.lastOpenEdge();
  if (lastEdge == null) {
    return this.startVertex_;
  } else {
    return lastEdge.getVertex2();
  }
};

/** Returns the square of the maximum distance from the given point in body coords to
* any Vertex of this Polygon.
* @param p_body  the point in body coords
* @return the square of the maximum distance from the given point in
*    body coords to any Vertex of this Polygon
*/
private maxRadiusSquared(p_body: Vector): number {
  let maxR = 0;
  this.vertices_.forEach(v => {
    const d = p_body.distanceTo(v.locBody());
    if (d > maxR)
      maxR = d;
  });
  // maximum chord error is the most that distance from p_body to a curved Edge
  // can be in error by, because we are only looking at the 'decorated Vertexes'
  // on the curved Edge.
  let mce = 0;  // maximum chord error
  this.edges_.forEach(e => {
    const ce = e.chordError();
    if (ce > mce)
      mce = ce;
  });
  // add max chord error to max Vertex distance, and square.
  maxR += mce;
  return maxR*maxR;
};

/** @inheritDoc */
nonCollideEdge(edge: null|Edge): boolean {
  if (edge == null) {
    return true;
  }
  if (this.nonCollideSet_ != null) {
    return this.nonCollideSet_.contains(edge);
  } else {
    return false;
  }
};

/** @inheritDoc */
printAll(): void {
  if (Util.DEBUG) {
    console.log(this.toString());
    let vLast = this.vertices_[this.vertices_.length - 1];
    this.vertices_.forEach((v, k) => {
      const d = v.locBody().distanceTo(vLast.locBody());
      console.log('('+(k)+') '+v+' dist to prev vertex = '+Util.NF(d));
      vLast = v;
    });
    this.edges_.forEach((e, k) => console.log('('+(k)+') '+e));
  };
};

/** @inheritDoc */
probablyPointInside(p_body: Vector): boolean {
  // look for an Edge with positive distance to the point,
  // which means the point is outside the body.
  return undefined === this.edges_.find((e: Edge) => e.distanceToLine(p_body) > 0);
};

/** @inheritDoc */
removeNonCollide(bodies: RigidBody[]): void {
  bodies.forEach((body: RigidBody)=> Util.removeAll(this.nonCollideBodies_, body));
};

/** @inheritDoc */
saveOldCoords(): void {
  if (this.body_old_ == null) {
    this.body_old_ = this.body_old_save_;
  }
  this.body_old_.set(this.cm_body_, this.loc_world_, this.sinAngle_, this.cosAngle_);
};

/** @inheritDoc */
setAccuracy(accuracy: number): void {
  if (accuracy <= 0 || accuracy > 1) {
    throw 'accuracy must be between 0 and 1, is '+accuracy;
  }
  this.accuracy_ = accuracy;
};

/** Sets the center of the circle to use for proximity testing and also calculates the
radius of the circle. A circle centered at this centroid with radius
`getCentroidRadius()` should encompass this Polygon.
@param centroid_body the center of the circle to use for
proximity testing in world coords, in body coordinates
@return this Polygon, for chaining setters
@throws when `setCentroid` is called while the Polygon is 'open' in process of
    adding edges, before the Polygon is closed with `finish()` method
*/
setCentroid(centroid_body: Vector): Polygon {
  if (this.startVertex_ != null) {
    throw 'setCentroid called before finish, while creating Polygon';
  }
  this.centroid_body_ = centroid_body;
  // check that the assigned centroid is reasonable
  // (If not, it is still OK, just less efficient because centroidRadius_ is bigger
  // than necessary).
  if (Util.DEBUG) {
    // NOTE: there is a performance difference from doing this test!
    const ctrd = this.findCentroid();
    const c_dist = centroid_body.distanceTo(ctrd);
    Util.assert(c_dist < 0.01, 'dist='+Util.NF(c_dist)+' ctrd='+ctrd
        +' centroid_body='+centroid_body);
    /*if (0 == 1) {
      console.log('centroid '+centroid_body
          +' dist to calculated centroid='+Util.NF(centroid_body.distanceTo(ctrd)));
    }*/
  }
  // in case the centroid was set before all the edges were added
  // we compute the centroidRadius_ again.
  this.centroidRadius_ = Math.sqrt(this.maxRadiusSquared(centroid_body));
  return this;
};

/** @inheritDoc */
setDistanceTol(value: number): void {
  this.distanceTol_ = value;
};

/** @inheritDoc */
setElasticity(value: number): void {
  this.elasticity_ = value;
};

/** Specifies that this Polygon does not collide with the given set of Edges of
other Polygons; replaces any existing non-collide EdgeSet. No collisions or contacts
are generated between this Polygon and the Edges in the given EdgeSet.
Use this when some parts of a Polygon **DO** interact.  If **NO** parts interact then
see {@link RigidBody.addNonCollide}.
@param nonCollideSet  the set of other body edges
    to not collide with
*/
setNonCollideEdge(nonCollideSet: EdgeSet): void {
  this.nonCollideSet_ = nonCollideSet;
};

/** @inheritDoc */
override setPosition(loc_world: GenericVector, angle?: number): void {
  this.loc_world_ = Vector.clone(loc_world);
  if (angle !== undefined && isFinite(angle) && this.angle_ != angle) {
    this.angle_ = angle;
    this.sinAngle_ = Math.sin(angle);
    this.cosAngle_ = Math.cos(angle);
    // invalidate the cache of the special normal vector in world coords
    this.specialNormalWorld_ = null;
  }
  // invalidate the cache of centroids in world coordinates
  this.edges_.forEach(e => e.forgetPosition());
  this.setChanged();
};

/** Sets which Edge takes priority for collision handling, as in a wall object. Can only
be called on a rectangular Polygon.
Sets the centroid radius of the non-special edges on this Polygon to zero, which makes
all those non-special edges inoperative for collision detection purposes.
See [Special Edge for Proximity Testing](#md:special-edge-for-proximity-testing).
See {@link getSpecialNormalWorld}.
@param edgeIndex the index of the Edge that takes priority
    for collision handling, within the Polygon's list of edges
@param radius the radius of the circle to use for proximity testing.
@throws if this is not a rectangular Polygon, or the `edgeIndex` is not in range
*/
setSpecialEdge(edgeIndex: number, radius: number): void {
  if (this.edges_.length != 4)
    throw Util.DEBUG ? 'can only set special edge on rectangle' : '';
  if (edgeIndex < 0 || edgeIndex > 3)
    throw '';
  this.specialEdge_ = this.edges_[edgeIndex];
  this.centroidRadius_ = radius;
  // Set centroid radius of all non-special edges to zero.
  // This makes all those edges non-operative for collision detection.
  this.edges_.forEach(e => {
    if (e != this.specialEdge_) {
      e.setCentroidRadius(0);
    }
  });
};

/** @inheritDoc */
setVarsIndex(index: number): void {
  this.varsIndex_ = index;
};

/** @inheritDoc */
setVelocityTol(value: number): void {
  this.velocityTol_ = value;
};

/** Start creating a path in this Polygon at the given Vertex or Edge.
* @param vertexOrEdge the Vertex or Edge to start the path at
*/
startPath(vertexOrEdge: Vertex|Edge): void {
  if (this.finished_) {
    throw 'Polygon construction is finished.';
  }
  if (this.startVertex_ != null) {
    throw 'there is already an open path';
  }
  if (vertexOrEdge instanceof ConcreteVertex) {
    const vertex = vertexOrEdge;
    this.startVertex_ = vertex;
    this.vertices_.push(this.startVertex_);
  } else {
    const edge = vertexOrEdge as Edge;
    this.startVertex_ = edge.getVertex1();
    this.vertices_.push(this.startVertex_);
    this.edges_.push(edge);
  }
};

/** Counter used for naming Polygons.*/
//override static ID = 1;
static readonly OPEN_PATH_ERROR = 'Polygon does not have an open path to add edges to';
/** add small circle at end point Vertexes*/
static readonly SHOW_VERTICES = false;
/** add small circle at all Vertexes, including mid-point Vertexes*/
static readonly SHOW_ALL_VERTICES = false;
/** print Edge & Vertex info for each Polygon when created.*/
static readonly PRINT_POLYGON_STRUCTURE = false;

static readonly en: i18n_strings = {
  POLYGON: 'polygon',
  ANGLE: 'angle',
  ANGULAR_VELOCITY: 'angular velocity',
  POSITION: 'position',
  VELOCITY: 'velocity'
};

static readonly de_strings: i18n_strings = {
  POLYGON: 'Polygon',
  ANGLE: 'Winkel',
  ANGULAR_VELOCITY: 'Winkelgeschwindigkeit',
  POSITION: 'Position',
  VELOCITY: 'Geschwindigkeit'
};

static readonly i18n = Util.LOCALE === 'de' ? Polygon.de_strings : Polygon.en;

} // end Polygon class

type i18n_strings = {
  POLYGON: string,
  ANGLE: string,
  ANGULAR_VELOCITY: string,
  POSITION: string,
  VELOCITY: string
};

Util.defineGlobal('lab$engine2D$Polygon', Polygon);
