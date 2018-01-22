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

goog.provide('myphysicslab.sims.springs.Spring2DApp');

goog.require('myphysicslab.lab.controls.ButtonControl');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.springs.Spring2DSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.common.AbstractApp;
const ButtonControl = goog.module.get('myphysicslab.lab.controls.ButtonControl');
var CommonControls = sims.common.CommonControls;
const ConcreteLine = goog.module.get('myphysicslab.lab.model.ConcreteLine');
var DisplayLine = lab.view.DisplayLine;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = myphysicslab.lab.view.DisplaySpring;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
const SimpleAdvance = goog.module.get('myphysicslab.lab.model.SimpleAdvance');
var SliderControl = lab.controls.SliderControl;
const Spring = goog.module.get('myphysicslab.lab.model.Spring');
var Spring2DSim = sims.springs.Spring2DSim;
var TabLayout = sims.common.TabLayout;
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** Displays the {@link Spring2DSim} simulation.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @extends {AbstractApp}
* @struct
* @export
*/
myphysicslab.sims.springs.Spring2DApp = function(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new Spring2DSim();
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);

  /** @type {!DisplayShape} */
  this.anchor = new DisplayShape(this.simList.getPointMass('anchor'))
      .setFillStyle('').setStrokeStyle('red').setThickness(4);
  this.displayList.add(this.anchor);
  /** @type {!DisplayShape} */
  this.bob = new DisplayShape(this.simList.getPointMass('bob'))
      .setFillStyle('blue');
  this.displayList.add(this.bob);
  /** @type {!DisplaySpring} */
  this.spring = new DisplaySpring(this.simList.getSpring('spring'))
      .setWidth(0.3);
  this.displayList.add(this.spring);
  sim.saveInitialState();

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(Spring2DSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(Spring2DSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Spring2DSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(Spring2DSim.en.SPRING_LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(Spring2DSim.en.SPRING_STIFFNESS);
  this.addControl(new SliderControl(pn, 0.1, 100.1, /*multiply=*/true));

  this.addStandardControls();

  var bc = new ButtonControl(Spring2DSim.i18n.REST_STATE,
      goog.bind(sim.restState, sim));
  this.addControl(bc);

  this.makeEasyScript();
  this.addURLScriptButton();
};
var Spring2DApp = myphysicslab.sims.springs.Spring2DApp;
goog.inherits(Spring2DApp, AbstractApp);

/** @override */
Spring2DApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', bob: '+this.bob.toStringShort()
      +', spring: '+this.bob.toStringShort()
      +', anchor: '+this.anchor.toStringShort()
      + Spring2DApp.superClass_.toString.call(this);
};

/** @override */
Spring2DApp.prototype.getClassName = function() {
  return 'Spring2DApp';
};

/** @override */
Spring2DApp.prototype.defineNames = function(myName) {
  Spring2DApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('anchor|bob|spring',
      myName+'.');
};

}); // goog.scope
