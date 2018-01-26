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

goog.module('myphysicslab.sims.springs.Double2DSpringApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const Double2DSpringSim = goog.require('myphysicslab.sims.springs.Double2DSpringSim');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the {@link Double2DSpringSim} simulation.
*/
class Double2DSpringApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new Double2DSpringSim();
  var advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.simCanvas.setBackground('black');

  /** @type {!DisplayShape} */
  this.protoBob = new DisplayShape().setFillStyle('blue');
  /** @type {!DisplaySpring} */
  this.protoSpring = new DisplaySpring().setWidth(0.3).setColorCompressed('#0c0')
      .setColorExpanded('#6f6');

  /** @type {!DisplayShape} */
  this.topMass = new DisplayShape(this.simList.getPointMass('top'))
      .setFillStyle('red');
  this.displayList.add(this.topMass);
  /** @type {!DisplaySpring} */
  this.spring1 = new DisplaySpring(this.simList.getSpring('spring1'), this.protoSpring);
  this.displayList.add(this.spring1);
  /** @type {!DisplaySpring} */
  this.spring2 = new DisplaySpring(this.simList.getSpring('spring2'), this.protoSpring);
  this.displayList.add(this.spring2);
  /** @type {!DisplayShape} */
  this.bob1 = new DisplayShape(this.simList.getPointMass('bob1'), this.protoBob);
  this.displayList.add(this.bob1);
  /** @type {!DisplayShape} */
  this.bob2 = new DisplayShape(this.simList.getPointMass('bob2'), this.protoBob);
  this.displayList.add(this.bob2);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(Double2DSpringSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 50, /*multiply=*/false));

  pn = sim.getParameterNumber(Double2DSpringSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(Double2DSpringSim.en.MASS1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Double2DSpringSim.en.MASS2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Double2DSpringSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(Double2DSpringSim.en.STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 200, /*multiply=*/false));

  this.addStandardControls();

  /** @type {!ButtonControl} */
  var bc = new ButtonControl(Double2DSpringSim.i18n.REST_STATE,
      goog.bind(sim.restState, sim));
  this.addControl(bc);

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', bob1: '+this.bob1.toStringShort()
      +', bob2: '+this.bob2.toStringShort()
      +', spring1: '+this.spring1.toStringShort()
      +', spring2: '+this.spring2.toStringShort()
      +', topMass: '+this.topMass.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'Double2DSpringApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('topMass|bob1|bob2|spring1|spring2|protoBob|protoSpring',
      myName+'.');
};

} //end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!Double2DSpringApp}
*/
function makeDouble2DSpringApp(elem_ids) {
  return new Double2DSpringApp(elem_ids);
};
goog.exportSymbol('makeDouble2DSpringApp', makeDouble2DSpringApp);

exports = Double2DSpringApp;
