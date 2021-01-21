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

goog.module('myphysicslab.sims.springs.DangleStickApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const DangleStickSim = goog.require('myphysicslab.sims.springs.DangleStickSim');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the {@link DangleStickSim} simulation.
*/
class DangleStickApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-4, -4, 4, 2);
  const sim = new DangleStickSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/null);

  /** @type {!DisplayShape} */
  this.protoMass = new DisplayShape().setFillStyle('blue');

  /** @type {!DisplayLine} */
  this.stick = new DisplayLine(this.simList.getConcreteLine('stick'));
  this.displayList.add(this.stick);
  /** @type {!DisplayShape} */
  this.bob1 = new DisplayShape(this.simList.getPointMass('bob1'), this.protoMass);
  this.displayList.add(this.bob1);
  /** @type {!DisplayShape} */
  this.bob2 = new DisplayShape(this.simList.getPointMass('bob2'),this.protoMass);
  this.displayList.add(this.bob2);
  /** @type {!DisplaySpring} */
  this.spring = new DisplaySpring(this.simList.getSpring('spring')).setWidth(0.3);
  this.displayList.add(this.spring);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  let pn;
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

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', bob1: '+this.bob1.toStringShort()
      +', bob2: '+this.bob2.toStringShort()
      +', stick: '+this.stick.toStringShort()
      +', spring: '+this.spring.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'DangleStickApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('stick|bob1|bob2|spring|protoMass',
      myName+'.');
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!DangleStickApp}
*/
function makeDangleStickApp(elem_ids) {
  return new DangleStickApp(elem_ids);
};
goog.exportSymbol('makeDangleStickApp', makeDangleStickApp);

exports = DangleStickApp;
