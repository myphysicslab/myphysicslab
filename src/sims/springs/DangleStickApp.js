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

goog.provide('myphysicslab.sims.springs.DangleStickApp');

goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.springs.DangleStickSim');
goog.require('myphysicslab.lab.model.Spring');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var SliderControl = lab.controls.SliderControl;
var NumericControl = lab.controls.NumericControl;
var AbstractApp = sims.common.AbstractApp;
var CommonControls = sims.common.CommonControls;
var DisplayLine = lab.view.DisplayLine;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = myphysicslab.lab.view.DisplaySpring;
var DoubleRect = lab.util.DoubleRect;
var ConcreteLine = lab.model.ConcreteLine;
var DangleStickSim = sims.springs.DangleStickSim;
var PointMass = lab.model.PointMass;
var SimpleAdvance = lab.model.SimpleAdvance;
var TabLayout = sims.common.TabLayout;
var UtilityCore = lab.util.UtilityCore;
var Spring = myphysicslab.lab.model.Spring;

/**  DangleStickApp displays the simulation
{@link myphysicslab.sims.springs.DangleStickSim DangleStickSim}.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @extends {AbstractApp}
* @struct
* @export
*/
myphysicslab.sims.springs.DangleStickApp = function(elem_ids) {
  UtilityCore.setErrorHandler();
  var simRect = new DoubleRect(-4, -4, 4, 2);
  var sim = new DangleStickSim();
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/null);

  /** @type {!DisplayShape} */
  this.protoMass = new DisplayShape().setFillStyle('blue');

  /** @type {!lab.view.DisplayLine} */
  this.stick = new DisplayLine(this.simList.getConcreteLine('stick'));
  this.displayList.add(this.stick);
  /** @type {!lab.view.DisplayShape} */
  this.bob1 = new DisplayShape(this.simList.getPointMass('bob1'), this.protoMass);
  this.displayList.add(this.bob1);
  /** @type {!lab.view.DisplayShape} */
  this.bob2 = new DisplayShape(this.simList.getPointMass('bob2'),this.protoMass);
  this.displayList.add(this.bob2);
  /** @type {!lab.view.DisplaySpring} */
  this.spring = new DisplaySpring(this.simList.getSpring('spring')).setWidth(0.3);
  this.displayList.add(this.spring);

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(DangleStickSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(DangleStickSim.en.MASS1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(DangleStickSim.en.MASS2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(DangleStickSim.en.STICK_LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(DangleStickSim.en.SPRING_REST_LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(DangleStickSim.en.SPRING_STIFFNESS);
  this.addControl(new SliderControl(pn, 0.1, 100.1, /*multiply=*/true));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};
var DangleStickApp = myphysicslab.sims.springs.DangleStickApp;
goog.inherits(DangleStickApp, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DangleStickApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', bob1: '+this.bob1.toStringShort()
        +', bob2: '+this.bob2.toStringShort()
        +', stick: '+this.stick.toStringShort()
        +', spring: '+this.spring.toStringShort()
        + DangleStickApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
DangleStickApp.prototype.getClassName = function() {
  return 'DangleStickApp';
};

/** @inheritDoc */
DangleStickApp.prototype.defineNames = function(myName) {
  DangleStickApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('stick|bob1|bob2|spring|protoMass',
      myName);
};

}); // goog.scope
