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

goog.provide('myphysicslab.lab.engine2D.Shapes');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.engine2D.CircularEdge');
goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.StraightEdge');
goog.require('myphysicslab.lab.util.RandomLCG');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var CircularEdge = myphysicslab.lab.engine2D.CircularEdge;
var ConcreteVertex = myphysicslab.lab.engine2D.ConcreteVertex;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var Polygon = myphysicslab.lab.engine2D.Polygon;
var RandomLCG = myphysicslab.lab.util.RandomLCG;
var StraightEdge = myphysicslab.lab.engine2D.StraightEdge;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Provides static functions to make Polygons of various shapes.

@constructor
@final
@struct
@private
*/
myphysicslab.lab.engine2D.Shapes = function() {
  throw new Error();
};

var Shapes = myphysicslab.lab.engine2D.Shapes;

/** Counter used for naming shapes.
* @type {number}
*/
Shapes.ID = 1;

/** index of bottom edge in Polygon from `makeBlock()`
* @type {number}
* @const
*/
Shapes.BOTTOM_EDGE = 0;
/** index of right edge in Polygon from `makeBlock()`
* @type {number}
* @const
*/
Shapes.RIGHT_EDGE = 1;
/** index of top edge in Polygon from `makeBlock()`
* @type {number}
* @const
*/
Shapes.TOP_EDGE = 2;
/** index of left edge in Polygon from `makeBlock()`
* @type {number}
* @const
*/
Shapes.LEFT_EDGE = 3;

/** Makes a circular Polygon with given radius.
* @param {number} radius radius of the circle
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
* @return {!Polygon} a circular Polygon
*/
Shapes.makeBall = function(radius, opt_name, opt_localName) {
  var p = new Polygon(opt_name, opt_localName);
  // Bug Note:  if this starting vertex is instead at (radius, 0) then some
  // tests fail.  See notes in the Java version of this file.
  p.startPath(new ConcreteVertex(new Vector(-radius, 0)));
  p.addCircularEdge(/*endPoint=*/new Vector(-radius, 0), Vector.ORIGIN,
    /*clockwise=*/false, /*outsideIsOut=*/true);
  p.finish();
  p.setCentroid(Vector.ORIGIN);
  p.setMomentAboutCM(radius*radius/2);
  p.setElasticity(0.8);
  return p;
};

/** Makes a rectangular Polygon with given width and height; in body coords the center
is at the origin, and width is along the x-axis, height along the y-axis.
* @param {number} width width of the block, horizontal dimension in body orientation
* @param {number} height height of the block, vertical dimension in body orientation
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
* @return {!Polygon} a rectangular Polygon
*/
Shapes.makeBlock = function(width, height, opt_name, opt_localName) {
  var p = new Polygon(opt_name, opt_localName);
  var w = width/2;
  var h = height/2;
  p.startPath(new ConcreteVertex(new Vector(-w, -h)));
  p.addStraightEdge(new Vector(w, -h), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(w, h), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(-w, h), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(-w, -h), /*outsideIsUp=*/false);
  p.finish();
  p.setCentroid(Vector.ORIGIN);
  p.setMomentAboutCM((width*width + height*height)/12);
  p.setElasticity(0.8);
  return p;
};

/** Makes a rectangular Polygon with given width and height; in body coords
the origin is at the bottom left corner.
* @param {number} width width of the block, horizontal dimension in body orientation
* @param {number} height height of the block, vertical dimension in body orientation
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
* @return {!Polygon} a rectangular Polygon
*/
Shapes.makeBlock2 = function(width, height, opt_name, opt_localName) {
  var p = new Polygon(opt_name, opt_localName);
  p.startPath(new ConcreteVertex(new Vector(0, 0)));
  p.addStraightEdge(new Vector(width, 0), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(width, height), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(0, height), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(0, 0), /*outsideIsUp=*/false);
  p.finish();
  p.setCentroid(new Vector(width/2, height/2));
  p.setMomentAboutCM((width*width + height*height)/12);
  p.setElasticity(0.8);
  return p;
}

/** Returns a rectangle centered at origin with the given width and height, but
rotated by the given angle in the body coordinate system. The purpose is to ensure
that angled straight lines are tested.
@param {number} width width in unrotated position
@param {number} height  height in unrotated position
@param {number} angle  angle to rotate by in radians, must be between +/- PI/2
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
@return {!Polygon} a rectangle centered at origin with the
    given width and height, but rotated by the given angle
*/
Shapes.makeDiamond = function(width, height, angle, opt_name, opt_localName) {
  if (angle < -Math.PI/2 || angle > Math.PI/2)
    throw new Error('angle must be within +/- pi/2');
  var p = new Polygon(opt_name, opt_localName);
  var w = width/2;
  var h = height/2;
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  var v = (new Vector(-w, -h)).rotate(cos, sin);
  p.startPath(new ConcreteVertex(new Vector(v.getX(), v.getY())));
  // bottom edge
  v = (new Vector(w, -h)).rotate(cos, sin);
  p.addStraightEdge(v, /*outsideIsUp=*/false);
  // right edge
  v = (new Vector(w, h)).rotate(cos, sin);
  p.addStraightEdge(v, /*outsideIsUp=*/angle >= 0);
  // top edge
  v = (new Vector(-w, h)).rotate(cos, sin);
  p.addStraightEdge(v, /*outsideIsUp=*/true);
  // left edge
  v = (new Vector(-w, -h)).rotate(cos, sin);
  p.addStraightEdge(v, /*outsideIsUp=*/angle < 0);
  p.finish();
  p.setMomentAboutCM((width*width + height*height)/12);
  p.setCentroid(Vector.ORIGIN);
  p.setElasticity(0.8);
  return p;
};

/** Makes a hollow box or 'square doughnut' shape.
* @param {number} width width of frame, measured to center of walls
* @param {number} height height of frame, measured to center of walls
* @param {number} thickness thickness of walls
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
* @return {!Polygon}
*/
Shapes.makeFrame = function(width, height, thickness, opt_name, opt_localName) {
  var w = width/2;
  var h = height/2;
  var t = thickness/2;
  var p = new Polygon(opt_name, opt_localName);
  // See 'The Nonzero Winding Rule' in JavaScript: The Definitive Guide by Flanagan
  // 6th edition, page 635, section 21.4.1 'Drawing Lines and Filling Polygons'.
  // To get this to draw correctly need to have one path going clockwise and the
  // other path going counter-clockwise.
  // inner edges
  p.startPath(new ConcreteVertex(new Vector(w-t, h-t)));
  p.addStraightEdge(new Vector(w-t, -(h-t)), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(-(w-t), -(h-t)), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(-(w-t), h-t), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(w-t, h-t), /*outsideIsUp=*/false);
  p.closePath();
  // outer edges
  p.startPath(new ConcreteVertex(new Vector(w+t, h+t)));
  p.addStraightEdge(new Vector(-(w+t), h+t), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(-(w+t), -(h+t)), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(w+t, -(h+t)), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(w+t, h+t), /*outsideIsUp=*/true);
  p.closePath();
  p.finish();
  p.setElasticity(0.8);
  return p;
};

/** Makes a regular hexagon with edges of given size.
@param {number} size  length of edge of hexagon
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
@return {!Polygon} a regular hexagon
*/
Shapes.makeHexagon = function(size, opt_name, opt_localName) {
  var p = new Polygon(opt_name, opt_localName);
  var a = Math.sin(Math.PI/3);
  var b = Math.cos(Math.PI/3);
  p.startPath(new ConcreteVertex(new Vector(size*(1-b), 0)));
  p.addStraightEdge(new Vector(size*(1+b), 0), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(size*2, size*a), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(size*(1+b), size*2*a), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(size*(1-b), size*2*a), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(0, size*a), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(size*(1-b), 0), /*outsideIsUp=*/false);
  p.finish();
  // approximation: circle with radius sqrt(3)/2
  var r = Math.sqrt(3)/2;
  p.setMomentAboutCM(r*r/2);
  p.setElasticity(0.8);
  return p;
};

/** Creates a pendulum shaped Polygon:  a circle with a long stick attached.
The center of mass and drag point is at the center of the circle.
In body coordinates, the center of the circle is at the origin and the stick
is straight above.
@param {number} width width of the stick
@param {number} length length of the stick
@param {number} radius radius of the circle
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
@return {!Polygon} a pendulum-shaped Polygon
*/
Shapes.makePendulum = function(width, length, radius, opt_name, opt_localName) {
  var p = new Polygon(opt_name, opt_localName);
  p.startPath(new ConcreteVertex(new Vector(width, radius)));
  p.addStraightEdge(new Vector(width, length+width), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(-width, length+width), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(-width, radius), /*outsideIsUp=*/false);
  p.addCircularEdge(/*endPoint=*/new Vector(width, radius),
      /*center=*/new Vector(0, 0), /*clockwise=*/false,
      /*outsideIsOut=*/true);
  p.finish();
  p.setCenterOfMass(0, 0);
  p.setDragPoints([Vector.ORIGIN]);
  // is this right?  should it instead be moment of circle plus moment of stick?
  var r = Math.sqrt(width*width + radius*radius);
  p.setMomentAboutCM(r*r/2);
  p.setElasticity(0.8);
  return p;
};

/** Creates a Polygon whose vertices are at the given points.
@param {!Array<!Vector>} points array of points giving location of vertices in body
    coordinates
@param {!Array<boolean>} outIsUp the value of outsideIsUp for each edge
@param {number} moment moment about center of mass
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
@return {!Polygon} Polygon whose vertices are at the given points
*/
Shapes.makePolygon = function(points, outIsUp, moment, opt_name, opt_localName) {
  if (points.length < 3 || points.length != outIsUp.length) {
    throw new Error();
  }
  var p = new Polygon(opt_name, opt_localName);
  var v0 = points[0];
  var v1 = v0;
  p.startPath(new ConcreteVertex(v1));
  for (var i=1; i<points.length; i++) {
    var v2 = points[i];
    p.addStraightEdge(v2, outIsUp[i-1]);
    v1 = v2;
  }
  p.addStraightEdge(v0, /*outsideIsUp=*/outIsUp[points.length-1]);
  p.finish();
  p.setMomentAboutCM(moment);
  p.setElasticity(0.8);
  // don't set centroid, it will be calculated
  return p;
};

/** Creates a randomly shaped polygon with given number of sides.  The corners lie
on a circle with given radius centered at origin.
@param {number} sides number of sides, minumum is 3
@param {number} radius radius of circle that the Polygon fits inside of
@param {number=} minAngle the minimum distance between corners on the circle in radians
@param {number=} maxAngle the maximum distance between corners on the circle in radians
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
@return {!Polygon} a block with round corners
*/
Shapes.makeRandomPolygon = function(sides, radius, minAngle, maxAngle, opt_name,
      opt_localName) {
  if (!goog.isDef(minAngle)) {
    minAngle = Math.PI/sides;
  }
  if (!goog.isDef(maxAngle)) {
    maxAngle = 3*Math.PI/sides;
  }
  // get a random number for each side
  var rng = new RandomLCG();
  var angles = [0];
  var sum = 0;
  for (var i=0; i<sides-1; i++) {
    var angle = (0.5+rng.nextFloat())*(2*Math.PI - sum)/(sides-i);
    // leave room for the sides yet to be chosen
    var remain = 2*Math.PI - sum;
    var max = Math.min(maxAngle, remain - minAngle*(sides-1 - i));
    angle = Math.min(max, Math.max(minAngle, angle));
    angle = Math.min(2*Math.PI, sum+angle);
    angles.push(angle);
    sum = angle;
  }
  var p = new Polygon(opt_name, opt_localName);
  // start point corresponds to zero angle.
  var v0 = new Vector(radius, 0);
  var v1 = v0;
  p.startPath(new ConcreteVertex(v1));
  for (i=1; i<sides; i++) {
    var v2 = new Vector(radius*Math.cos(angles[i]), radius*Math.sin(angles[i]));
    // points are added counter-clockwise. outsideIsUp is true until reaching most
    // 'westerly' point, then it is false.
    var outsideIsUp = v2.getX() < v1.getX();
    p.addStraightEdge(v2, outsideIsUp);
    v1 = v2;
  }
  p.addStraightEdge(v0, /*outsideIsUp=*/false);
  p.finish();
  // wild guess for moment
  p.setMomentAboutCM(radius*radius/6);
  p.setElasticity(0.8);
  // don't set centroid, it will be calculated
  return p;
};

/** Creates a block with rounded ends.  Height must be greater than width.
@param {number} width width in unrotated position
@param {number} height  height in unrotated position
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
@return {!Polygon} a block with rounded ends
*/
Shapes.makeRoundBlock = function(width, height, opt_name, opt_localName) {
  if (height < width) {
    throw new Error('Height must be greater than width.');
  }
  var p = new Polygon(opt_name, opt_localName);
  var w = width/2;
  var h = height/2;
  p.startPath(new ConcreteVertex(new Vector(-w, -h+w)));
  p.addCircularEdge(/*end-point=*/new Vector(w, -h+w), /*center=*/new Vector(0, -h+w),
    /*clockwise=*/false, /*outsideIsOut=*/true);
  p.addStraightEdge(new Vector(w, h-w), /*outsideIsUp=*/true);
  p.addCircularEdge(/*end-point=*/new Vector(-w, h-w), /*center=*/new Vector(0, h-w),
    /*clockwise=*/false, /*outsideIsOut=*/true);
  p.addStraightEdge(new Vector(-w, -h+w), /*outsideIsUp=*/false);
  p.finish();
  p.setCentroid(Vector.ORIGIN);
  p.setMomentAboutCM((width*width + height*height)/12);
  p.setElasticity(0.8);
  return p;
};

/** Creates a rectangular block with small round corners. In body coords the center
is at the origin, and width is along the x-axis, height along the y-axis.
@param {number} width width of the block
@param {number} height height of the block
@param {number} radius radius of each corner
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
@return {!Polygon} a block with round corners
*/
Shapes.makeRoundCornerBlock = function(width, height, radius, opt_name, opt_localName) {
  var w = width/2;
  var h = height/2;
  var r = radius;
  if (r > w || r > h) {
    throw new Error('radius must be less than half of width or height');
  }
  var p = new Polygon(opt_name, opt_localName);
  p.startPath(new ConcreteVertex(new Vector(-w+r, -h)));
  p.addStraightEdge(new Vector(w-r, -h), /*outsideIsUp=*/false);
  p.addCircularEdge(/*end-point=*/new Vector(w, -h+r), /*center=*/new Vector(w-r, -h+r),
    /*clockwise=*/false, /*outsideIsOut=*/true);
  p.addStraightEdge(new Vector(w, h-r), /*outsideIsUp=*/true);
  p.addCircularEdge(/*end-point=*/new Vector(w-r, h), /*center=*/new Vector(w-r, h-r),
    /*clockwise=*/false, /*outsideIsOut=*/true);
  p.addStraightEdge(new Vector(-w+r, h), /*outsideIsUp=*/true);
  p.addCircularEdge(/*end-point=*/new Vector(-w, h-r), /*center=*/new Vector(-w+r, h-r),
    /*clockwise=*/false, /*outsideIsOut=*/true);
  p.addStraightEdge(new Vector(-w, -h+r), /*outsideIsUp=*/false);
  p.addCircularEdge(/*end-point=*/new Vector(-w+r, -h),/*center=*/new Vector(-w+r,-h+r),
    /*clockwise=*/false, /*outsideIsOut=*/true);
  p.finish();
  p.setCentroid(Vector.ORIGIN);
  p.setMomentAboutCM((width*width + height*height)/12);
  p.setElasticity(0.8);
  return p;
};

/** Makes a rectangular Polygon with a special edge that causes special
proximity testing to be done for this Polygon. The other edges of this
Polygon are given zero centroid radius, so that they are effectively never used for
collision testing.
See {@link Polygon#getSpecialNormalWorld}.

@param {number} width width of the wall, horizontal dimension in body orientation
@param {number} height height of the wall, vertical dimension in body orientation
@param {number} edgeIndex index of the special edge: use the constants
    {@link #BOTTOM_EDGE}, {@link #LEFT_EDGE}, {@link #RIGHT_EDGE}, {@link #TOP_EDGE}
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
@return {!Polygon} a rectangular Polygon with a special edge
*/
Shapes.makeWall = function(width, height, edgeIndex, opt_name, opt_localName) {
  if (edgeIndex < 0 || edgeIndex > 3)
    throw new Error();
  var w = Shapes.makeBlock(width, height, opt_name, opt_localName);
  var r;
  if (edgeIndex == Shapes.BOTTOM_EDGE || edgeIndex == Shapes.TOP_EDGE) {
    r = w.getHeight()/2;
  } else {
    r = w.getWidth()/2;
  }
  w.setSpecialEdge(edgeIndex, r);
  return w;
};

/** Set of internationalized strings.
@typedef {{
  BLOCK: string,
  BALL: string
  }}
*/
Shapes.i18n_strings;

}); // goog.scope
