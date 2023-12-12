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

import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { JointUtil } from '../../lab/engine2D/JointUtil.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Vector } from '../../lab/util/Vector.js';
import { Util } from '../../lab/util/Util.js';

/**
*/
export type Chain_options = {
    wallPivotX: number,
    wallPivotY: number,
    fixedLeft: boolean,
    fixedRight: boolean,
    blockWidth: number,
    blockHeight: number,
    numLinks: number
};

/** Makes chain of rigid bodies.
*/
export class ChainConfig {

constructor() {
  throw '';
};

/**
* @param sim
* @param options
* @return rectangle that contains all chain links, in sim coords
*/
static makeChain(sim: ContactSim, options: Chain_options): DoubleRect {
  /* where 'lower' joint1 attaches, in body coords*/
  const joint1X = 0.5 * options.blockWidth;
  const joint1Y = 0.15 * options.blockHeight;
  /* where 'upper' joint2 attaches, in body coords*/
  const joint2X = 0.5 * options.blockWidth;
  const joint2Y = 0.85 * options.blockHeight;
  let body_angle = -180;
  const links = [];
  let bodyi;
  for (let i=0; i<options.numLinks; i++) {
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
  for (let i=0; i<options.numLinks; i++) {
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
  let r = DoubleRect.EMPTY_RECT;
  for (let i=0; i<options.numLinks; i++) {
    const body = links[i];
    body.setZeroEnergyLevel();
    r = r.union(body.getBoundsWorld());
  }
  return r;
};

static readonly en: i18n_strings = {
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

static readonly de_strings: i18n_strings = {
  NUM_LINKS: 'Kettenglieder',
  WALLS: 'Wände',
  EXTRA_BODY: 'extra Körper',
  FIXED_LEFT: 'Fixpunkt links',
  FIXED_RIGHT: 'Fixpunkt rechts',
  FIXED_LEFT_X: 'Fixpunkt links X',
  FIXED_LEFT_Y: 'Fixpunkt links Y',
  BLOCK_LENGTH: 'Blocklänge',
  BLOCK_WIDTH: 'Blockbreite',
  CHAIN: 'Kette',
  WALL_WIDTH: 'Wand breite'
};

static readonly i18n = Util.LOCALE === 'de' ? ChainConfig.de_strings : ChainConfig.en;

} // end class

type i18n_strings = {
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
};

Util.defineGlobal('sims$engine2D$ChainConfig', ChainConfig);
