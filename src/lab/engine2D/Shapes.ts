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

import { CircularEdge } from './CircularEdge.js';
import { ConcreteVertex } from './ConcreteVertex.js';
import { Polygon } from './Polygon.js';
import { RandomLCG } from '../util/Random.js';
import { StraightEdge } from './StraightEdge.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** Provides static functions to make Polygons of various shapes.
*/
export class Shapes {

constructor() {
  throw '';
};

/** Makes a circular Polygon with given radius.
* @param radius radius of the circle
* @param opt_name name of the Polygon
* @param opt_localName  localized name of the Polygon
* @return a circular Polygon
*/
static makeBall(radius: number, opt_name?: string, opt_localName?: string): Polygon {
  const p = new Polygon(opt_name, opt_localName);
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
* is at the origin, and width is along the x-axis, height along the y-axis.
* @param width width of the block, horizontal dimension in body orientation
* @param height height of the block, vertical dimension in body orientation
* @param opt_name name of the Polygon
* @param opt_localName  localized name of the Polygon
* @return a rectangular Polygon
*/
static makeBlock(width: number, height: number, opt_name?: string, opt_localName?: string): Polygon {
  const p = new Polygon(opt_name, opt_localName);
  const w = width/2;
  const h = height/2;
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
* the origin is at the bottom left corner.
* @param width width of the block, horizontal dimension in body orientation
* @param height height of the block, vertical dimension in body orientation
* @param opt_name name of the Polygon
* @param opt_localName  localized name of the Polygon
* @return a rectangular Polygon
*/
static makeBlock2(width: number, height: number, opt_name?: string, opt_localName?: string): Polygon {
  const p = new Polygon(opt_name, opt_localName);
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
@param width width in unrotated position
@param height  height in unrotated position
@param angle  angle to rotate by in radians, must be between +/- PI/2
@param opt_name name of the Polygon
@param opt_localName  localized name of the Polygon
@return a rectangle centered at origin with the
    given width and height, but rotated by the given angle
*/
static makeDiamond(width: number, height: number, angle: number, opt_name?: string, opt_localName?: string): Polygon {
  if (angle < -Math.PI/2 || angle > Math.PI/2)
    throw 'angle must be within +/- pi/2';
  const p = new Polygon(opt_name, opt_localName);
  const w = width/2;
  const h = height/2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let v = (new Vector(-w, -h)).rotate(cos, sin);
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
* @param width width of frame, measured to center of walls
* @param height height of frame, measured to center of walls
* @param thickness thickness of walls
* @param opt_name name of the Polygon
* @param opt_localName  localized name of the Polygon
*/
static makeFrame(width: number, height: number, thickness: number, opt_name?: string, opt_localName?: string): Polygon {
  const w = width/2;
  const h = height/2;
  const t = thickness/2;
  const p = new Polygon(opt_name, opt_localName);
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
@param size  length of edge of hexagon
@param opt_name name of the Polygon
@param opt_localName  localized name of the Polygon
@return a regular hexagon
*/
static makeHexagon(size: number, opt_name?: string, opt_localName?: string): Polygon {
  const p = new Polygon(opt_name, opt_localName);
  const a = Math.sin(Math.PI/3);
  const b = Math.cos(Math.PI/3);
  p.startPath(new ConcreteVertex(new Vector(size*(1-b), 0)));
  p.addStraightEdge(new Vector(size*(1+b), 0), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(size*2, size*a), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(size*(1+b), size*2*a), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(size*(1-b), size*2*a), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(0, size*a), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(size*(1-b), 0), /*outsideIsUp=*/false);
  p.finish();
  // approximation: circle with radius sqrt(3)/2
  const r = Math.sqrt(3)/2;
  p.setMomentAboutCM(r*r/2);
  p.setElasticity(0.8);
  return p;
};

/** Creates a pendulum shaped Polygon:  a circle with a long stick attached.
The center of mass and drag point is at the center of the circle.
In body coordinates, the center of the circle is at the origin and the stick
is straight above.
@param width width of the stick
@param length length of the stick
@param radius radius of the circle
@param opt_name name of the Polygon
@param opt_localName  localized name of the Polygon
@return a pendulum-shaped Polygon
*/
static makePendulum(width: number, length: number, radius: number, opt_name?: string, opt_localName?: string): Polygon {
  const p = new Polygon(opt_name, opt_localName);
  p.startPath(new ConcreteVertex(new Vector(width, radius)));
  p.addStraightEdge(new Vector(width, length+width), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(-width, length+width), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(-width, radius), /*outsideIsUp=*/false);
  p.addCircularEdge(/*endPoint=*/new Vector(width, radius),
      /*center=*/Vector.ORIGIN, /*clockwise=*/false,
      /*outsideIsOut=*/true);
  p.finish();
  p.setCenterOfMass(Vector.ORIGIN);
  p.setDragPoints([Vector.ORIGIN]);
  // is this right?  should it instead be moment of circle plus moment of stick?
  const r = Math.sqrt(width*width + radius*radius);
  p.setMomentAboutCM(r*r/2);
  p.setElasticity(0.8);
  return p;
};

/** Creates a Polygon whose vertices are at the given points.
@param points array of points giving location of vertices in body coordinates
@param outIsUp the value of outsideIsUp for each edge
@param moment moment about center of mass
@param opt_name name of the Polygon
@param opt_localName  localized name of the Polygon
@return Polygon whose vertices are at the given points
*/
static makePolygon(points: Vector[], outIsUp: boolean[], moment: number, opt_name?: string, opt_localName?: string): Polygon {
  if (points.length < 3 || points.length != outIsUp.length) {
    throw '';
  }
  const p = new Polygon(opt_name, opt_localName);
  const v0 = points[0];
  p.startPath(new ConcreteVertex(v0));
  for (let i=1; i<points.length; i++) {
    p.addStraightEdge(points[i], outIsUp[i-1]);
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
@param sides number of sides, minumum is 3
@param radius radius of circle that the Polygon fits inside of
@param minAngle the minimum distance between corners on the circle in radians
@param maxAngle the maximum distance between corners on the circle in radians
@param opt_name name of the Polygon
@param opt_localName  localized name of the Polygon
@return a block with round corners
*/
static makeRandomPolygon(sides: number, radius: number, minAngle?: number, maxAngle?: number, opt_name?: string, opt_localName?: string): Polygon {
  if (minAngle === undefined) {
    minAngle = Math.PI/sides;
  }
  if (maxAngle === undefined) {
    maxAngle = 3*Math.PI/sides;
  }
  const angles = [0];
  let sum = 0;
  for (let i=0; i<sides-1; i++) {
    // get a random number for each side
    let angle = (0.5 + Shapes.RANDOM.nextFloat())*(2*Math.PI - sum)/(sides-i);
    // leave room for the sides yet to be chosen
    const remain = 2*Math.PI - sum;
    const max = Math.min(maxAngle, remain - minAngle*(sides-1 - i));
    angle = Math.min(max, Math.max(minAngle, angle));
    angle = Math.min(2*Math.PI, sum+angle);
    angles.push(angle);
    sum = angle;
  }
  const p = new Polygon(opt_name, opt_localName);
  // start point corresponds to zero angle.
  const v0 = new Vector(radius, 0);
  let v1 = v0;
  p.startPath(new ConcreteVertex(v1));
  for (let i=1; i<sides; i++) {
    const v2 = new Vector(radius*Math.cos(angles[i]), radius*Math.sin(angles[i]));
    // points are added counter-clockwise. outsideIsUp is true until reaching most
    // 'westerly' point, then it is false.
    const outsideIsUp = v2.getX() < v1.getX();
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
@param width width in unrotated position
@param height  height in unrotated position
@param opt_name name of the Polygon
@param opt_localName  localized name of the Polygon
@return a block with rounded ends
*/
static makeRoundBlock(width: number, height: number, opt_name?: string, opt_localName?: string): Polygon {
  if (height < width) {
    throw 'Height must be greater than width.';
  }
  const p = new Polygon(opt_name, opt_localName);
  const w = width/2;
  const h = height/2;
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
@param width width of the block
@param height height of the block
@param radius radius of each corner
@param opt_name name of the Polygon
@param opt_localName  localized name of the Polygon
@return a block with round corners
*/
static makeRoundCornerBlock(width: number, height: number, radius: number, opt_name?: string, opt_localName?: string): Polygon {
  const w = width/2;
  const h = height/2;
  const r = radius;
  if (r > w || r > h) {
    throw 'radius must be less than half of width or height';
  }
  const p = new Polygon(opt_name, opt_localName);
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
See {@link Polygon.getSpecialNormalWorld}.

@param width width of the wall, horizontal dimension in body orientation
@param height height of the wall, vertical dimension in body orientation
@param edgeIndex index of the special edge: use the constants
    {@link Shapes.BOTTOM_EDGE}, {@link Shapes.LEFT_EDGE}, {@link Shapes.RIGHT_EDGE},
    {@link Shapes.TOP_EDGE}
@param opt_name name of the Polygon
@param opt_localName  localized name of the Polygon
@return a rectangular Polygon with a special edge
*/
static makeWall(width: number, height: number, edgeIndex: number, opt_name?: string, opt_localName?: string): Polygon {
  if (edgeIndex < 0 || edgeIndex > 3)
    throw '';
  const w = Shapes.makeBlock(width, height, opt_name, opt_localName);
  let r;
  if (edgeIndex == Shapes.BOTTOM_EDGE || edgeIndex == Shapes.TOP_EDGE) {
    r = w.getHeight()/2;
  } else {
    r = w.getWidth()/2;
  }
  w.setSpecialEdge(edgeIndex, r);
  return w;
};

/** Counter used for naming shapes. */
static ID = 1;
/** index of bottom edge in Polygon from `makeBlock()` */
static readonly BOTTOM_EDGE = 0;
/** index of right edge in Polygon from `makeBlock()` */
static readonly RIGHT_EDGE = 1;
/** index of top edge in Polygon from `makeBlock()` */
static readonly TOP_EDGE = 2;
/** index of left edge in Polygon from `makeBlock()` */
static readonly LEFT_EDGE = 3;
static readonly RANDOM = new RandomLCG(0);
} // end class

Util.defineGlobal('lab$engine2D$Shapes', Shapes);
