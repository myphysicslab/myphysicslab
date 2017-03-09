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

goog.provide('myphysicslab.sims.engine2D.FastBallApp');

goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.common.CommonControls');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.common.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var Shapes = lab.engine2D.Shapes;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;
var Walls = lab.engine2D.Walls;

/** Demonstrates collision handling for fast moving object with very thin walls.

* @param {!sims.common.TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.FastBallApp = function(elem_ids) {
  var simRect = new DoubleRect(-6.5, -6.5, 6.5, 6.5);
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  var p = Shapes.makeBall(0.2, FastBallApp.en.FAST_BALL, FastBallApp.i18n.FAST_BALL);
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
var FastBallApp = sims.engine2D.FastBallApp;
goog.inherits(FastBallApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  FastBallApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        + FastBallApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
FastBallApp.prototype.getClassName = function() {
  return 'FastBallApp';
};

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

}); // goog.scope
