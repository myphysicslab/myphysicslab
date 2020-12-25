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

goog.module('myphysicslab.sims.roller.RollerDoubleApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CardioidPath = goog.require('myphysicslab.sims.roller.CardioidPath');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CirclePath = goog.require('myphysicslab.sims.roller.CirclePath');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const FlatPath = goog.require('myphysicslab.sims.roller.FlatPath');
const HumpPath = goog.require('myphysicslab.sims.roller.HumpPath');
const LemniscatePath = goog.require('myphysicslab.sims.roller.LemniscatePath');
const LoopTheLoopPath = goog.require('myphysicslab.sims.roller.LoopTheLoopPath');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const OvalPath = goog.require('myphysicslab.sims.roller.OvalPath');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const ParametricPath = goog.require('myphysicslab.lab.model.ParametricPath');
const PathObserver = goog.require('myphysicslab.sims.roller.PathObserver');
const PathSelector = goog.require('myphysicslab.sims.roller.PathSelector');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const RollerDoubleSim = goog.require('myphysicslab.sims.roller.RollerDoubleSim');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SpiralPath = goog.require('myphysicslab.sims.roller.SpiralPath');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Creates the RollerDoubleSim simulation

* @implements {Observer}
*/
class RollerDoubleApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new RollerDoubleSim();
  var advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  //this.layout.simCanvas.setBackground('black');
  //this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);

  /** @type {!DisplayShape} */
  this.ball1 = new DisplayShape(this.simList.getPointMass('ball1'))
      .setFillStyle('red');
  this.displayList.add(this.ball1);
  /** @type {!DisplayShape} */
  this.ball2 = new DisplayShape(this.simList.getPointMass('ball2'))
      .setFillStyle('blue');
  this.displayList.add(this.ball2);
  /** @type {!DisplaySpring} */
  this.spring = new DisplaySpring(this.simList.getSpring('spring'))
      .setWidth(0.2).setColorCompressed('red')
      .setColorExpanded('#6f6'); /* brighter green */
  this.displayList.add(this.spring);
  /** @type {!Array<!ParametricPath>} **/
  this.paths = [
      new HumpPath(),
      new LoopTheLoopPath(),
      new CirclePath(3.0),
      new OvalPath(),
      new LemniscatePath(2.0),
      new CardioidPath(3.0),
      new SpiralPath(),
      new FlatPath()
  ];
  /** @type {!PathSelector} */
  this.pathSelect = new PathSelector(sim, this.paths);
  /** @type {!PathObserver} */
  this.pathObserver = new PathObserver(this.simList, this.simView,
      a => this.setSimRect(a));
  this.pathSelect.setPathName(HumpPath.en.NAME);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  /** @type {!ParameterString} */
  var ps;
  ps = this.pathSelect.getParameterString(PathSelector.en.PATH);
  this.addControl(new ChoiceControl(ps));
  pn = sim.getParameterNumber(RollerDoubleSim.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerDoubleSim.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerDoubleSim.en.MASS_1);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerDoubleSim.en.MASS_2);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerDoubleSim.en.SPRING_STIFFNESS);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerDoubleSim.en.SPRING_LENGTH);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerDoubleSim.en.SPRING_DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.graph.line.setXVariable(0);
  this.graph.line.setYVariable(2);
  this.timeGraph.line1.setYVariable(0);
  this.timeGraph.line2.setYVariable(2);

  this.makeEasyScript([this.simView]);
  this.addURLScriptButton();
  this.pathSelect.addObserver(this);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', ball1: '+this.ball1.toStringShort()
      +', ball2: '+this.ball2.toStringShort()
      +', spring: '+this.spring.toStringShort()
      +', pathSelect: '+this.pathSelect.toStringShort()
      +', paths: [ '+this.paths+' ]'
      + super.toString();
};

/** @override */
getClassName() {
  return 'RollerDoubleApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('ball1|ball2|spring|paths|pathSelect',
      myName+'.');
};

/** @override */
getSubjects() {
  var subjects = super.getSubjects();
  return goog.array.concat(this.pathSelect, subjects);
};

/** @override */
observe(event) {
  if (event.getSubject() == this.pathSelect) {
    this.easyScript.update();
    this.sim.modifyObjects();
  }
};

/**
@param {!DoubleRect} simRect
*/
setSimRect(simRect) {
  this.simRect = simRect;
  this.simView.setSimRect(simRect);
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!RollerDoubleApp}
*/
function makeRollerDoubleApp(elem_ids) {
  return new RollerDoubleApp(elem_ids);
};
goog.exportSymbol('makeRollerDoubleApp', makeRollerDoubleApp);

exports = RollerDoubleApp;
