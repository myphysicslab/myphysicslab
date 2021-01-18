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

goog.module('myphysicslab.lab.engine2D.Walls');

const asserts = goog.require('goog.asserts');

const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Factory for making a set of four walls arranged in rectangle to form an enclosed
space. See {@link Shapes#makeWall}.

*/
class Walls {
/**
@private
*/
constructor() {
  throw '';
};

/** Makes four walls of given thickness, with interior rectangle of given width and
height and centered at the given location. Each wall is given infinite mass. The walls
are named according to the constants {@link #WALL_BOTTOM}, {@link #WALL_TOP},
{@link #WALL_LEFT}, {@link #WALL_RIGHT}.

@param {!RigidBodySim} sim the RigidBodySim to which the walls are added
@param {number} width the horizontal distance between the walls
@param {number} height the vertical distance between the walls
@param {number=} opt_thickness  the thickness of each wall; default is 1.
@param {!Vector=} opt_center location of the center of the rectangle formed by the
    walls, in world coordinates; default is origin.
@return {number} suggested zero potential energy level -- the top of the bottom wall.
*/
static make(sim, width, height, opt_thickness, opt_center) {
  const center = opt_center || Vector.ORIGIN;
  const thickness = opt_thickness || 1;
  let zel = 0;
  /** @type {!Array<!Polygon>} */
  const walls = [];
  for (let i=0; i<4; i++) {
    /** @type {?Polygon} */
    let bodyi = null;
    switch (i) {
      case 0:
        bodyi = Shapes.makeWall(width+2*thickness, thickness, Shapes.TOP_EDGE,
            Walls.en.WALL_BOTTOM, Walls.i18n.WALL_BOTTOM);
        bodyi.setPosition(
            new Vector(center.getX(), center.getY() - height/2 - thickness/2), 0);
        zel = bodyi.getTopWorld();
        break;
      case 1:
        bodyi = Shapes.makeWall(thickness, height+2*thickness, Shapes.LEFT_EDGE,
            Walls.en.WALL_RIGHT, Walls.i18n.WALL_RIGHT);
        bodyi.setPosition(
            new Vector(center.getX() + width/2 + thickness/2, center.getY()), 0);
        break;
      case 2:
        bodyi = Shapes.makeWall(width+2*thickness, thickness, Shapes.BOTTOM_EDGE,
            Walls.en.WALL_TOP, Walls.i18n.WALL_TOP);
        bodyi.setPosition(
            new Vector(center.getX(), center.getY() + height/2 + thickness/2), 0);
        break;
      case 3:
        bodyi = Shapes.makeWall(thickness, height+2*thickness, Shapes.RIGHT_EDGE,
            Walls.en.WALL_LEFT, Walls.i18n.WALL_LEFT);
        bodyi.setPosition(
            new Vector(center.getX() - width/2 - thickness/2, center.getY()), 0);
        break;
    }
    if (bodyi != null) {
      bodyi.setMass(Util.POSITIVE_INFINITY);
      bodyi.setElasticity(1.0);
      walls.push(bodyi);
      sim.addBody(bodyi);
    }
  }
  // set each wall to not collide with any other wall
  for (let i=0; i<walls.length; i++) {
    walls[i].addNonCollide(walls);
  }
  return zel;
};

/** Makes four walls of given thickness, with interior rectangle equal to the given
rectangle.
@param {!RigidBodySim} sim the RigidBodySim to which the walls are added
@param {!DoubleRect} rect the interior rectangle of the walls
@param {number=} opt_thickness  the thickness of each wall
@return {number} suggested zero potential energy level -- the top of the bottom wall.
*/
static make2(sim, rect, opt_thickness) {
  return Walls.make(sim, rect.getWidth(), rect.getHeight(), opt_thickness,
      rect.getCenter());
};

} // end class

/** Set of internationalized strings.
@typedef {{
  WALL_BOTTOM: string,
  WALL_RIGHT: string,
  WALL_LEFT: string,
  WALL_TOP: string
  }}
*/
Walls.i18n_strings;

/**
@type {Walls.i18n_strings}
*/
Walls.en = {
  WALL_BOTTOM: 'wall bottom',
  WALL_RIGHT: 'wall right',
  WALL_LEFT: 'wall left',
  WALL_TOP: 'wall top'
};

/**
@private
@type {Walls.i18n_strings}
*/
Walls.de_strings = {
  WALL_BOTTOM: 'Wand unten',
  WALL_RIGHT: 'Wand rechts',
  WALL_LEFT: 'Wand links',
  WALL_TOP: 'Wand oben'
};

/** Set of internationalized strings.
@type {Walls.i18n_strings}
*/
Walls.i18n = goog.LOCALE === 'de' ? Walls.de_strings :
    Walls.en;

exports = Walls;
