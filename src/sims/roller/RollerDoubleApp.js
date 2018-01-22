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

goog.provide('myphysicslab.sims.roller.RollerDoubleApp');

goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.model.ParametricPath');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.roller.CardioidPath');
goog.require('myphysicslab.sims.roller.CirclePath');
goog.require('myphysicslab.sims.roller.FlatPath');
goog.require('myphysicslab.sims.roller.HumpPath');
goog.require('myphysicslab.sims.roller.LemniscatePath');
goog.require('myphysicslab.sims.roller.LoopTheLoopPath');
goog.require('myphysicslab.sims.roller.OvalPath');
goog.require('myphysicslab.sims.roller.PathObserver');
goog.require('myphysicslab.sims.roller.PathSelector');
goog.require('myphysicslab.sims.roller.RollerDoubleSim');
goog.require('myphysicslab.sims.roller.SpiralPath');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.common.AbstractApp;
var CardioidPath = sims.roller.CardioidPath;
var ChoiceControl = lab.controls.ChoiceControl;
var CirclePath = sims.roller.CirclePath;
var CommonControls = sims.common.CommonControls;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = lab.view.DisplaySpring;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var FlatPath = sims.roller.FlatPath;
var HumpPath = sims.roller.HumpPath;
var LemniscatePath = sims.roller.LemniscatePath;
var LoopTheLoopPath = sims.roller.LoopTheLoopPath;
var NumericControl = lab.controls.NumericControl;
const Observer = goog.module.get('myphysicslab.lab.util.Observer');
var OvalPath = sims.roller.OvalPath;
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.module.get('myphysicslab.lab.util.ParameterString');
const ParametricPath = goog.module.get('myphysicslab.lab.model.ParametricPath');
var PathObserver = sims.roller.PathObserver;
var PathSelector = sims.roller.PathSelector;
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
var RollerDoubleSim = sims.roller.RollerDoubleSim;
const SimpleAdvance = goog.module.get('myphysicslab.lab.model.SimpleAdvance');
var SpiralPath = sims.roller.SpiralPath;
const Spring = goog.module.get('myphysicslab.lab.model.Spring');
var TabLayout = sims.common.TabLayout;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Creates the RollerDoubleSim simulation

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @extends {AbstractApp}
* @implements {Observer}
* @struct
* @export
*/
myphysicslab.sims.roller.RollerDoubleApp = function(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new RollerDoubleSim();
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
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
      goog.bind(this.setSimRect, this));
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
var RollerDoubleApp = myphysicslab.sims.roller.RollerDoubleApp;
goog.inherits(RollerDoubleApp, AbstractApp);

/** @override */
RollerDoubleApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', ball1: '+this.ball1.toStringShort()
      +', ball2: '+this.ball2.toStringShort()
      +', spring: '+this.spring.toStringShort()
      +', pathSelect: '+this.pathSelect.toStringShort()
      +', paths: [ '+this.paths+' ]'
      + RollerDoubleApp.superClass_.toString.call(this);
};

/** @override */
RollerDoubleApp.prototype.getClassName = function() {
  return 'RollerDoubleApp';
};

/** @override */
RollerDoubleApp.prototype.defineNames = function(myName) {
  RollerDoubleApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('ball1|ball2|spring|paths|pathSelect',
      myName+'.');
};

/** @override */
RollerDoubleApp.prototype.getSubjects = function() {
  var subjects = RollerDoubleApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.pathSelect, subjects);
};

/** @override */
RollerDoubleApp.prototype.observe =  function(event) {
  if (event.getSubject() == this.pathSelect) {
    this.easyScript.update();
    this.sim.modifyObjects();
  }
};

/**
@param {!DoubleRect} simRect
*/
RollerDoubleApp.prototype.setSimRect = function(simRect) {
  this.simRect = simRect;
  this.simView.setSimRect(simRect);
};

}); // goog.scope
