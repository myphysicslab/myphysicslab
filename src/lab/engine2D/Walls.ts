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

import { DoubleRect } from '../util/DoubleRect.js';
import { RigidBodySim } from './RigidBodySim.js';
import { Shapes } from './Shapes.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** Factory for making a set of four walls arranged in rectangle to form an enclosed
space. See {@link Shapes.makeWall}.

*/
export class Walls {

constructor() {
  throw '';
};

/** Makes four walls of given thickness, with interior rectangle of given width and
height and centered at the given location. Each wall is given infinite mass. The walls
are named `WALL_BOTTOM`, `WALL_TOP`, `WALL_LEFT`, `WALL_RIGHT`.

@param sim the RigidBodySim to which the walls are added
@param width the horizontal distance between the walls
@param height the vertical distance between the walls
@param opt_thickness  the thickness of each wall; default is 1.
@param opt_center location of the center of the rectangle formed by the
    walls, in world coordinates; default is origin.
@return suggested zero potential energy level -- the top of the bottom wall.
*/
static make(sim: RigidBodySim, width: number, height: number, opt_thickness?: number, opt_center?: Vector): number {
  const center = opt_center ?? Vector.ORIGIN;
  const thickness = opt_thickness ?? 1;
  let zel = 0;
  const walls = [];
  for (let i=0; i<4; i++) {
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
      bodyi.setMass(Infinity);
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
@param sim the RigidBodySim to which the walls are added
@param rect the interior rectangle of the walls
@param opt_thickness  the thickness of each wall
@return suggested zero potential energy level -- the top of the bottom wall.
*/
static make2(sim: RigidBodySim, rect: DoubleRect, opt_thickness?: number): number {
  return Walls.make(sim, rect.getWidth(), rect.getHeight(), opt_thickness,
      rect.getCenter());
};

static readonly en: i18n_strings = {
  WALL_BOTTOM: 'wall bottom',
  WALL_RIGHT: 'wall right',
  WALL_LEFT: 'wall left',
  WALL_TOP: 'wall top'
};

static readonly de_strings: i18n_strings = {
  WALL_BOTTOM: 'Wand unten',
  WALL_RIGHT: 'Wand rechts',
  WALL_LEFT: 'Wand links',
  WALL_TOP: 'Wand oben'
};

static readonly i18n = Util.LOCALE === 'de' ? Walls.de_strings : Walls.en;

} // end class

type i18n_strings = {
  WALL_BOTTOM: string,
  WALL_RIGHT: string,
  WALL_LEFT: string,
  WALL_TOP: string
};

Util.defineGlobal('lab$engine2D$Walls', Walls);
