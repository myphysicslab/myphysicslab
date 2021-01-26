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

goog.module('myphysicslab.sims.springs.DoubleSpringApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const DoubleSpringSim = goog.require('myphysicslab.sims.springs.DoubleSpringSim');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the {@link DoubleSpringSim} simulation.
*/
class DoubleSpringApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-4, -7, 12, 7);
  const sim = new DoubleSpringSim(/*thirdSpring=*/false);
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.simCanvas.setBackground('black');

  /** @type {!DisplayShape} */
  this.protoWall = new DisplayShape().setFillStyle('lightGray');
  /** @type {!DisplayShape} */
  this.protoBlock = new DisplayShape().setFillStyle('#00fc');
  /** @type {!DisplaySpring} */
  this.protoSpring = new DisplaySpring().setWidth(0.3).setColorCompressed('#0c0')
      .setColorExpanded('#6f6');

  /** @type {!DisplayShape} */
  this.wall1 = new DisplayShape(this.simList.getPointMass('wall1'), this.protoWall);
  /** @type {!DisplayShape} */
  this.wall2 = new DisplayShape(this.simList.getPointMass('wall2'), this.protoWall);
  this.displayList.add(this.wall1);
  this.displayList.add(this.wall2);
  /** @type {!DisplaySpring} */
  this.spring1 = new DisplaySpring(this.simList.getSpring('spring1'), this.protoSpring);
  /** @type {!DisplaySpring} */
  this.spring2 = new DisplaySpring(this.simList.getSpring('spring2'), this.protoSpring);
  /** @type {!DisplaySpring} */
  this.spring3 = new DisplaySpring(this.simList.getSpring('spring3'), this.protoSpring);
  this.displayList.add(this.spring1);
  this.displayList.add(this.spring2);
  this.displayList.add(this.spring3);
  /** @type {!DisplayShape} */
  this.block1 = new DisplayShape(this.simList.getPointMass('block1'), this.protoBlock);
  /** @type {!DisplayShape} */
  this.block2 = new DisplayShape(this.simList.getPointMass('block2'), this.protoBlock);
  this.block2.setFillStyle('#ff0000cc');
  this.displayList.add(this.block1);
  this.displayList.add(this.block2);
  sim.saveInitialState();

  this.addPlaybackControls();
  /** @type {!ParameterBoolean} */
  let pb;
  /** @type {!ParameterNumber} */
  let pn;
  pn = sim.getParameterNumber(DoubleSpringSim.en.MASS1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(DoubleSpringSim.en.MASS2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(DoubleSpringSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(DoubleSpringSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(DoubleSpringSim.en.STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 200, /*multiply=*/false));

  pb = sim.getParameterBoolean(DoubleSpringSim.en.THIRD_SPRING);
  this.addControl(new CheckBoxControl(pb));

  this.addStandardControls();

  /** @type {!ButtonControl} */
  const bc = new ButtonControl(DoubleSpringSim.i18n.REST_STATE,
      () => sim.restState());
  this.addControl(bc);

  this.makeEasyScript();
  this.addURLScriptButton();
  this.getParameterBoolean('PAN_ZOOM').setValue(true);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', block1: '+this.block1.toStringShort()
      +', block2: '+this.block2.toStringShort()
      +', spring1: '+this.spring1.toStringShort()
      +', spring2: '+this.spring2.toStringShort()
      +', spring3: '+this.spring3.toStringShort()
      +', wall1: '+this.wall1.toStringShort()
      +', wall2: '+this.wall2.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'DoubleSpringApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('wall1|wall2|block1|block2|spring1|spring2|spring3'
      +'|protoWall|protoBlock|protoSpring', myName+'.');
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!DoubleSpringApp}
*/
function makeDoubleSpringApp(elem_ids) {
  return new DoubleSpringApp(elem_ids);
};
goog.exportSymbol('makeDoubleSpringApp', makeDoubleSpringApp);

exports = DoubleSpringApp;
