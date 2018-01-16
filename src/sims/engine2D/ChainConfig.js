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

goog.provide('myphysicslab.sims.engine2D.ChainConfig');

goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.JointUtil');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');

goog.scope(function() {

var ContactSim = myphysicslab.lab.engine2D.ContactSim;
var CoordType = myphysicslab.lab.model.CoordType;
var DisplayShape = myphysicslab.lab.view.DisplayShape;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var JointUtil = myphysicslab.lab.engine2D.JointUtil;
var Shapes = myphysicslab.lab.engine2D.Shapes;
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Makes chain of rigid bodies.
* @constructor
* @final
* @struct
* @private
*/
myphysicslab.sims.engine2D.ChainConfig = function() {
  throw new Error();
};
var ChainConfig = myphysicslab.sims.engine2D.ChainConfig;


/** @typedef {{
    wallPivotX: number,
    wallPivotY: number,
    fixedLeft: boolean,
    fixedRight: boolean,
    blockWidth: number,
    blockHeight: number,
    numLinks: number
  }}
*/
ChainConfig.options;

/**
* @param {!ContactSim} sim
* @param {!ChainConfig.options} options
* @return {!DoubleRect} rectangle that contains all chain links, in sim coords
*/
ChainConfig.makeChain = function(sim, options) {
  var joint1X, joint1Y;  /* where 'lower' joint attaches, in body coords*/
  var joint2X, joint2Y;  /* where 'upper' joint attaches, in body coords*/
  joint1X = 0.5 * options.blockWidth;
  joint1Y = 0.15 * options.blockHeight;
  joint2X = 0.5 * options.blockWidth;
  joint2Y = 0.85 * options.blockHeight;
  var body_angle = -180;
  var links = [];
  var bodyi;
  var i;
  for (i=0; i<options.numLinks; i++) {
    bodyi = Shapes.makeBlock2(options.blockWidth, options.blockHeight,
        ChainConfig.en.CHAIN+'-'+i, ChainConfig.i18n.CHAIN+'-'+i);
    links.push(bodyi);
    sim.addBody(bodyi);
    body_angle += 180/(options.numLinks + 1);
    bodyi.setAngle(Math.PI*body_angle/180);
    if (i == 0) {
      bodyi.alignTo(/*p_body=*/new Vector(joint1X, joint1Y),
          /*p_world=*/new Vector(options.wallPivotX, options.wallPivotY),
          /*angle=*/Math.PI*body_angle/180);
    }
  }
  /* Create Joints to attach bodies together */
  for (i=0; i<options.numLinks; i++) {
    if (i == 0 && options.fixedLeft) {
      JointUtil.attachFixedPoint(sim,
        links[i], /*attach_body=*/new Vector(joint1X, joint1Y),
        /*normalType=*/CoordType.BODY);
    }
    if (i > 0) {
      JointUtil.attachRigidBody(sim,
        links[i-1], /*attach_body1=*/new Vector(joint2X, joint2Y),
        links[i], /*attach_body2=*/new Vector(joint1X, joint1Y),
        /*normalType=*/CoordType.BODY
        );
    }
    if (options.fixedRight && i == options.numLinks - 1) {
      JointUtil.attachFixedPoint(sim,
        links[i], /*attach_body=*/new Vector(joint2X, joint2Y),
        /*normalType=*/CoordType.BODY);
    }
  }
  sim.alignConnectors();
  /* find rectangle that contains all chain links */
  var r = DoubleRect.EMPTY_RECT;
  for (i=0; i<options.numLinks; i++) {
    var body = links[i];
    body.setZeroEnergyLevel();
    r = r.union(body.getBoundsWorld());
  }
  return r;
};

/** Set of internationalized strings.
@typedef {{
  NUM_LINKS: string,
  WALLS: string,
  EXTRA_BODY: string,
  FIXED_LEFT: string,
  FIXED_RIGHT: string,
  FIXED_LEFT_X: string,
  FIXED_LEFT_Y: string,
  BLOCK_LENGTH: string,
  BLOCK_WIDTH: string,
  CHAIN: string,
  WALL_WIDTH: string,
  }}
*/
ChainConfig.i18n_strings;

/**
@type {ChainConfig.i18n_strings}
*/
ChainConfig.en = {
  NUM_LINKS: 'chain links',
  WALLS: 'walls',
  EXTRA_BODY: 'extra body',
  FIXED_LEFT: 'fixed point left',
  FIXED_RIGHT: 'fixed point right',
  FIXED_LEFT_X: 'fixed point left X',
  FIXED_LEFT_Y: 'fixed point left Y',
  BLOCK_LENGTH: 'block length',
  BLOCK_WIDTH: 'block width',
  CHAIN: 'chain',
  WALL_WIDTH: 'wall width'
};

/**
@private
@type {ChainConfig.i18n_strings}
*/
ChainConfig.de_strings = {
  NUM_LINKS: 'Kettenglieder',
  WALLS: 'W\u00e4nde',
  EXTRA_BODY: 'extra K\u00f6rper',
  FIXED_LEFT: 'Fixpunkt links',
  FIXED_RIGHT: 'Fixpunkt rechts',
  FIXED_LEFT_X: 'Fixpunkt links X',
  FIXED_LEFT_Y: 'Fixpunkt links Y',
  BLOCK_LENGTH: 'Blockl\u00e4nge',
  BLOCK_WIDTH: 'Blockbreite',
  CHAIN: 'Kette',
  WALL_WIDTH: 'Wand breite'
};

/** Set of internationalized strings.
@type {ChainConfig.i18n_strings}
*/
ChainConfig.i18n = goog.LOCALE === 'de' ? ChainConfig.de_strings :
    ChainConfig.en;

}); // goog.scope
