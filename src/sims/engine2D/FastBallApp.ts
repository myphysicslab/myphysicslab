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

import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Subject, SubjectList } from '../../lab/util/Observe.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/** Demonstrates collision handling for fast moving object with very thin walls.
*/
export class FastBallApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-6.5, -6.5, 6.5, 6.5);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  const p = Shapes.makeBall(0.2, FastBallApp.en.FAST_BALL, FastBallApp.i18n.FAST_BALL);
  p.setMass(0.1);
  p.setPosition(new Vector(-5,  0),  0);
  p.setVelocity(new Vector(200,  153),  0);
  this.sim.addBody(p);
  this.displayList.findShape(p).setFillStyle('green');
  this.sim.setElasticity(0.9);
  // super-thin walls
  this.rbo.protoFixedPolygon.setFillStyle('black');
  Walls.make(this.sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/0.01);
  this.addPlaybackControls();
  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'FastBallApp';
};

static readonly en: i18n_strings = {
  FAST_BALL: 'fast ball'
};

static readonly de_strings: i18n_strings = {
  FAST_BALL: 'schnell Ball'
};

static readonly i18n = Util.LOCALE === 'de' ? FastBallApp.de_strings : FastBallApp.en;

} // end class

type i18n_strings = {
  FAST_BALL: string
};
Util.defineGlobal('sims$engine2D$FastBallApp', FastBallApp);
