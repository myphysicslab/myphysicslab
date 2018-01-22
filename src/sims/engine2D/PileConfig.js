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

goog.provide('myphysicslab.sims.engine2D.PileConfig');

goog.require('myphysicslab.lab.engine2D.JointUtil');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Random');
goog.require('myphysicslab.lab.util.RandomLCG');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var lab = myphysicslab.lab;

var ContactSim = lab.engine2D.ContactSim;
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var JointUtil = lab.engine2D.JointUtil;
const Polygon = goog.module.get('myphysicslab.lab.engine2D.Polygon');
const Random = goog.module.get('myphysicslab.lab.util.Random');
const RandomLCG = goog.module.get('myphysicslab.lab.util.RandomLCG');
const RigidBody = goog.module.get('myphysicslab.lab.engine2D.RigidBody');
var Shapes = lab.engine2D.Shapes;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var Walls = lab.engine2D.Walls;

/** Utility functions for making the 'pile of blocks' simulation.

* @constructor
* @final
* @struct
* @private
*/
myphysicslab.sims.engine2D.PileConfig = function() {
  throw new Error();
};
var PileConfig = myphysicslab.sims.engine2D.PileConfig;

/**
* @type {!Random}
* @private
*/
PileConfig.randomColor_ = new RandomLCG(901745);

/** Makes a single V-shaped 'pit' for blocks to fall into.
@param {!ContactSim} sim
@param {number=} opt_offset  vertical offset for position of walls
@return {number} suggested zero energy level for blocks
*/
PileConfig.makeVPit = function(sim, opt_offset) {
  var offset = goog.isDef(opt_offset) ? opt_offset : 0;
  var p1 = Shapes.makeWall(15.3, 1, Shapes.TOP_EDGE,
      Walls.en.WALL_BOTTOM + '_' + PileConfig.en.LEFT,
      Walls.i18n.WALL_BOTTOM + '_' + PileConfig.i18n.LEFT);
  p1.setPosition(new Vector(-5,  -5+offset),  -Math.PI/4);
  p1.setMass(Util.POSITIVE_INFINITY);
  sim.addBody(p1);
  var p2 = Shapes.makeWall(15.3, 1, Shapes.TOP_EDGE,
      Walls.en.WALL_BOTTOM + '_' + PileConfig.en.RIGHT,
      Walls.i18n.WALL_BOTTOM + '_' + PileConfig.i18n.RIGHT);
  p2.setPosition(new Vector(5,  -5+offset),  Math.PI/4);
  p2.setMass(Util.POSITIVE_INFINITY);
  sim.addBody(p2);
  var p3 = Shapes.makeWall(1, 15, Shapes.LEFT_EDGE, Walls.en.WALL_RIGHT,
      Walls.i18n.WALL_RIGHT);
  p3.setPosition(new Vector(10.5,  7.5+offset),  0);
  p3.setMass(Util.POSITIVE_INFINITY);
  sim.addBody(p3);
  var p4 = Shapes.makeWall(1, 15, Shapes.RIGHT_EDGE, Walls.en.WALL_LEFT,
      Walls.i18n.WALL_LEFT);
  p4.setPosition(new Vector(-10.5,  7.5+offset),  0);
  p4.setMass(Util.POSITIVE_INFINITY);
  sim.addBody(p4);
  // set each wall to not collide with any other wall
  var walls = [p1, p2, p3, p4];
  goog.array.forEach(walls, function(w) {
    w.addNonCollide(walls);
  });
  // return lowest possible point
  return p1.bodyToWorld(new Vector(15.3/2 - 1, 0.5)).getY();
};

/** Makes two 'pits' for the blocks to fall into.
@param {!ContactSim} sim
@param {number=} opt_offset  vertical offset for position of walls
@return {number} suggested zero energy level for blocks
*/
PileConfig.makeDoubleVPit = function(sim, opt_offset) {
  var offset = goog.isDef(opt_offset) ? opt_offset : 0;
  var walls = [];
  var b = 1.0/(2*Math.sqrt(2.0));  // to get center of block, = 1 / (2 * sqrt(2))
  var h = -2.5 - b;
  var len = Math.sqrt(2*5*5);
  var w = Shapes.makeWall(len, 1, Shapes.TOP_EDGE,
      Walls.en.WALL_BOTTOM + '_' + PileConfig.en.LEFT+1,
      Walls.i18n.WALL_BOTTOM + '_' + PileConfig.i18n.LEFT+1);
  var w1 = w;
  w.setPosition(new Vector(-7.5 - b,  h+offset),  -Math.PI/4);
  walls.push(w);
  w = Shapes.makeWall(len, 1, Shapes.TOP_EDGE,
      Walls.en.WALL_BOTTOM + '_' + PileConfig.en.LEFT+2,
      Walls.i18n.WALL_BOTTOM + '_' + PileConfig.i18n.LEFT+2);
  w.setPosition(new Vector(-2.5 + b,  h+offset),  Math.PI/4);
  walls.push(w);
  w = Shapes.makeWall(len, 1, Shapes.TOP_EDGE,
      Walls.en.WALL_BOTTOM + '_' + PileConfig.en.RIGHT+1,
      Walls.i18n.WALL_BOTTOM + '_' + PileConfig.i18n.RIGHT+1);
  w.setPosition(new Vector(2.5 - b,  h+offset),  -Math.PI/4);
  walls.push(w);
  w = Shapes.makeWall(len, 1, Shapes.TOP_EDGE,
      Walls.en.WALL_BOTTOM + '_' + PileConfig.en.RIGHT+2,
      Walls.i18n.WALL_BOTTOM + '_' + PileConfig.i18n.RIGHT+2);
  w.setPosition(new Vector(7.5 + b,  h+offset),  Math.PI/4);
  walls.push(w);
  w = Shapes.makeWall(1, 15, Shapes.LEFT_EDGE, Walls.en.WALL_RIGHT,
      Walls.i18n.WALL_RIGHT);
  w.setPosition(new Vector(10.5,  7.5+offset),  0);
  walls.push(w);
  w = Shapes.makeWall(1, 15, Shapes.RIGHT_EDGE, Walls.en.WALL_LEFT,
      Walls.i18n.WALL_LEFT);
  w.setPosition(new Vector(-10.5,  7.5+offset),  0);
  walls.push(w);
  goog.array.forEach(walls, function(p) {
    p.setMass(Util.POSITIVE_INFINITY);
    sim.addBody(p);
    // set each wall to not collide with any other wall
    p.addNonCollide(walls);
  });
  return w1.bodyToWorld(new Vector(len/2, 0.5)).getY();
};

/** Makes a rectangular array of same-sized square blocks or circular balls that fill
the given rectangle.
@param {!ContactSim} sim  the ContactSim to add the blocks to
@param {!DoubleRect} rect rectangle to fill with blocks
@param {boolean} circular whether to make circular balls or square blocks
@param {number} size the radius of circular balls or half-width of square blocks
@param {number} buffer distance between each block
@param {number} limit maximum number of blocks to make
*/
PileConfig.makeUniformBlocks = function(sim, rect, circular, size, buffer, limit) {
  var row = 0;
  var col = 0;
  var index = 0;
  while (true) {
    var y = rect.getBottom() + size + buffer + row * 2 * size
        + row * buffer;
    if (y + size + buffer > rect.getTop()) {
      break;
    }
    while (true) {
      var x = buffer + size + rect.getLeft() + col * 2 * size
          + col*buffer;
      if (x + size + buffer > rect.getRight()) {
        break;
      }
      var p;
      var id = index++;
      if (circular) {
        p = Shapes.makeBall(size);
      } else {
        p = Shapes.makeBlock(2*size, 2*size);
      }
      p.setPosition(new Vector(x, y));
      p.setMass(1);
      sim.addBody(p);
      if (index > limit) {
        return;
      }
      col++;
    }
    col = 0;
    row++;
  }
};

/**  Make several blocks of random sizes (and default colors), position
the first one at the given location and position the others to the right
of that first block.  The sizes of the blocks range from 0.2 to 1.2 on each
side.
@param {!ContactSim} sim  the ContactSim to add the bodies
@param {number} n  the number of blocks to create
@param {number} x  the location for the first block
@param {number} y  the location for the first block
@param {!Random} random  the random number generator to use for building blocks
@param {boolean=} rightAngle whether to make right-angle blocks
@return {!Array<!Polygon>} the blocks that were created
*/
PileConfig.makeRandomBlocks = function(sim, n, x, y, random, rightAngle) {
  rightAngle = goog.isDef(rightAngle) ? rightAngle : true;
  var bods = [];
  for (var i=0; i<n; i++) {
    var width = 0.2+ random.nextFloat();
    var height = 0.2+ random.nextFloat();
    var angle = Math.PI * random.nextFloat();
    // this is here only to preserve test results (legacy code)
    var unusedColor = PileConfig.getRandomColor(random);
    var p;
    if (rightAngle) {
      p = Shapes.makeBlock(width, height);
    } else {
      p = Shapes.makeRandomPolygon(/*sides=*/4,
         /*radius=*/Math.sqrt(width*width+height*height)/2);
    }
    var cmx = width*random.nextFloat()/4;
    var cmy = height*random.nextFloat()/4;
    // ensure the center of mass is within the body, and not right at an edge
    var xmin = 0.9*width/2.0;
    var ymin = 0.9*height/2.0;
    if (cmx < -xmin) {
      cmx = -xmin;
    } else if (cmx > xmin) {
      cmx = xmin;
    } if (cmy < -ymin) {
      cmy = -ymin;
    } else if (cmy > ymin) {
      cmy = ymin;
    }
    p.setCenterOfMass(cmx, cmy);
    // set temp position to (x, y), but only to find how much we need to move it
    p.setPosition(new Vector(x,  y),  angle);
    var left = p.getLeftWorld();
    // set actual position so that left is at x
    p.setPosition(new Vector(x + (x-left), y), angle);
    // set x to left position for next block
    x = p.getRightWorld() + 0.05;
    p.setMass(p.getWidth() * p.getHeight());
    sim.addBody(p);
    bods.push(p);
  }
  return bods;
};

/** Makes two blocks that are rigidly connected by two double joints, so that
the blocks cannot move relative to each other.  This is for testing that
situations with redundant joints can be handled correctly.
@param {!ContactSim} sim  the ContactSim to add the bodies
@param {number} x  the horizontal location to move the first block
@param {number} y  the vertical location to move the first block
@param {number} angle  the angle to set the blocks
@return {!Array<!Polygon>} array containing the two blocks
*/
PileConfig.makeConnectedBlocks = function(sim, x, y, angle) {
  var p1 = Shapes.makeBlock(1.0, 1.0);
  p1.setMass(0.6);
  p1.setPosition(new Vector(x,  y),  angle);
  sim.addBody(p1);
  var p2 = Shapes.makeBlock(0.9, 1.1);
  p2.setMass(0.6);
  p2.setPosition(new Vector(x,  y),  angle);
  sim.addBody(p2);
  JointUtil.attachRigidBody(sim,
    p1,  /* attach point on p1, body coords=*/new Vector(0, -0.4),
    p2, /* attach point on p2, body coords=*/new Vector(-0.4, 0),
    /*normalType=*/CoordType.BODY);
  JointUtil.attachRigidBody(sim,
    p1, /* attach point on p1, body coords=*/new Vector(0.4, 0),
    p2, /* attach point on p2, body coords=*/new Vector(0, 0.4),
    /*normalType=*/CoordType.BODY);
  sim.alignConnectors();
  return [p1, p2];
};


/** Returns a random 'somewhat bright' color.  Avoids near-white colors.
* @param {!Random=} random
* @return {string} a random color
*/
PileConfig.getRandomColor = function(random) {
  random = random || PileConfig.randomColor_;
  var colors = new Array(3);
  var nearWhite = true;
  for (var i=0; i<3; i++) {
    // bias the color to be brighter
    var c = Math.min(1, Math.max(0, 0.1 + 1.5 * random.nextFloat()));
    if (c < 0.9) {
      nearWhite = false;
    }
    colors[i] = c;
  }
  if (nearWhite) {
    return PileConfig.getRandomColor(random);
  } else {
    return Util.colorString6(colors[0], colors[1], colors[2]);
  }
};

/** Set of internationalized strings.
@typedef {{
  NUM_BLOCKS: string,
  ADD_BLOCK: string,
  REBUILD: string,
  TWO_PILES: string,
  CONNECTED_BLOCKS: string,
  ENDLESS_LOOP: string,
  LOOP_TIME: string,
  RANDOM_SEED: string,
  WALL: string,
  LEFT: string,
  RIGHT: string,
  SQUARE_BLOCKS: string
  }}
*/
PileConfig.i18n_strings;

/**
@type {PileConfig.i18n_strings}
*/
PileConfig.en = {
  NUM_BLOCKS: 'number of blocks',
  ADD_BLOCK: 'add block',
  REBUILD: 'rebuild',
  TWO_PILES: 'two piles',
  CONNECTED_BLOCKS: 'connected blocks',
  ENDLESS_LOOP: 'endless loop',
  LOOP_TIME: 'loop time',
  RANDOM_SEED: 'random seed',
  WALL: 'wall',
  LEFT: 'left',
  RIGHT: 'right',
  SQUARE_BLOCKS: 'square blocks'
};

/**
@private
@type {PileConfig.i18n_strings}
*/
PileConfig.de_strings = {
  NUM_BLOCKS: 'Bl\u00f6ckezahl',
  ADD_BLOCK: 'Block hinzu f\u00fcgen',
  REBUILD: 'wieder aufbauen',
  TWO_PILES: 'zwei Haufen',
  CONNECTED_BLOCKS: 'zusammenh\u00e4ngende Bl\u00f6cke',
  ENDLESS_LOOP: 'endliche Schleife',
  LOOP_TIME: 'Schleifezeit',
  RANDOM_SEED: 'Zufallskern',
  WALL: 'Wand',
  LEFT: 'links',
  RIGHT: 'rechts',
  SQUARE_BLOCKS: 'rechteckig Blöcke'
};

/** Set of internationalized strings.
@type {PileConfig.i18n_strings}
*/
PileConfig.i18n = goog.LOCALE === 'de' ? PileConfig.de_strings :
    PileConfig.en;

}); // goog.scope
