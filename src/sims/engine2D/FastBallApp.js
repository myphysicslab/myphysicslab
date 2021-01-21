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

goog.module('myphysicslab.sims.engine2D.FastBallApp');

const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/** Demonstrates collision handling for fast moving object with very thin walls.
*/
class FastBallApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  const simRect = new DoubleRect(-6.5, -6.5, 6.5, 6.5);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  const p = Shapes.makeBall(0.2, FastBallApp.en.FAST_BALL, FastBallApp.i18n.FAST_BALL);
  p.setMass(0.1);
  p.setPosition(new Vector(-5,  0),  0);
  p.setVelocity(new Vector(200,  153),  0);
  this.mySim.addBody(p);
  this.displayList.findShape(p).setFillStyle('green');
  this.mySim.setElasticity(0.9);
  // super-thin walls
  this.rbo.protoFixedPolygon.setFillStyle('black');
  Walls.make(this.mySim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/0.01);
  this.addPlaybackControls();
  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      + super.toString();
};

/** @override */
getClassName() {
  return 'FastBallApp';
};

} // end class

/** Set of internationalized strings.
@typedef {{
  FAST_BALL: string
  }}
*/
FastBallApp.i18n_strings;

/**
@type {FastBallApp.i18n_strings}
*/
FastBallApp.en = {
  FAST_BALL: 'fast ball'
};

/**
@private
@type {FastBallApp.i18n_strings}
*/
FastBallApp.de_strings = {
  FAST_BALL: 'schnell Ball'
};

/** Set of internationalized strings.
@type {FastBallApp.i18n_strings}
*/
FastBallApp.i18n = goog.LOCALE === 'de' ? FastBallApp.de_strings :
    FastBallApp.en;

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!FastBallApp}
*/
function makeFastBallApp(elem_ids) {
  return new FastBallApp(elem_ids);
};
goog.exportSymbol('makeFastBallApp', makeFastBallApp);

exports = FastBallApp;
