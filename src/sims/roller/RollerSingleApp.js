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

goog.provide('myphysicslab.sims.roller.RollerSingleApp');

goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.model.ParametricPath');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.layout.AbstractApp');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.roller.CardioidPath');
goog.require('myphysicslab.sims.roller.CirclePath');
goog.require('myphysicslab.sims.roller.FlatPath');
goog.require('myphysicslab.sims.roller.HumpPath');
goog.require('myphysicslab.sims.roller.LemniscatePath');
goog.require('myphysicslab.sims.roller.LoopTheLoopPath');
goog.require('myphysicslab.sims.roller.OvalPath');
goog.require('myphysicslab.sims.roller.PathObserver');
goog.require('myphysicslab.sims.roller.PathSelector');
goog.require('myphysicslab.sims.roller.RollerSingleSim');
goog.require('myphysicslab.sims.roller.SpiralPath');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var ChoiceControl = lab.controls.ChoiceControl;
var NumericControl = lab.controls.NumericControl;
var AbstractApp = sims.layout.AbstractApp;
var CardioidPath = sims.roller.CardioidPath;
var CirclePath = sims.roller.CirclePath;
var CommonControls = sims.layout.CommonControls;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var FlatPath = sims.roller.FlatPath;
var HumpPath = sims.roller.HumpPath;
var LemniscatePath = sims.roller.LemniscatePath;
var LoopTheLoopPath = sims.roller.LoopTheLoopPath;
var Observer = lab.util.Observer;
var OvalPath = sims.roller.OvalPath;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var ParameterString = lab.util.ParameterString;
var PathObserver = sims.roller.PathObserver;
var PathSelector = sims.roller.PathSelector;
var PointMass = lab.model.PointMass;
var RollerSingleSim = sims.roller.RollerSingleSim;
var SimpleAdvance = lab.model.SimpleAdvance;
var SpiralPath = sims.roller.SpiralPath;
var TabLayout = sims.layout.TabLayout;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/** Creates the RollerSingleSim simulation with no spring.

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
myphysicslab.sims.roller.RollerSingleApp = function(elem_ids) {
  UtilityCore.setErrorHandler();
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new RollerSingleSim();
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.simCanvas.setBackground('white');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);

  /** @type {!lab.view.DisplayShape} */
  this.ball1 = new DisplayShape(this.simList.getPointMass('ball1'))
      .setFillStyle('blue');
  this.displayList.add(this.ball1);
  /** @type {!Array<!lab.model.ParametricPath>} **/
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
  this.pathObserver = new PathObserver(this.simList, this.simView,
      goog.bind(this.setSimRect, this));
  this.pathSelect.setPathName(HumpPath.en.NAME);

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  /** @type {!lab.util.ParameterString} */
  var ps;
  ps = this.pathSelect.getParameterString(PathSelector.en.PATH);
  this.addControl(new ChoiceControl(ps));
  pn = sim.getParameterNumber(RollerSingleSim.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerSingleSim.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerSingleSim.en.MASS);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.graph.line.setXVariable(0);
  this.graph.line.setYVariable(1);
  this.timeGraph.line1.setYVariable(0);
  this.timeGraph.line2.setYVariable(1);

  this.makeScriptParser();
  this.addURLScriptButton();
  this.pathSelect.addObserver(this);
};
var RollerSingleApp = myphysicslab.sims.roller.RollerSingleApp;
goog.inherits(RollerSingleApp, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  RollerSingleApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', ball1: '+this.ball1.toStringShort()
        +', pathSelect: '+this.pathSelect.toStringShort()
        +', paths: [ '+this.paths+' ]'
        + RollerSingleApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
RollerSingleApp.prototype.getClassName = function() {
  return 'RollerSingleApp';
};

/** @inheritDoc */
RollerSingleApp.prototype.defineNames = function(myName) {
  RollerSingleApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('ball1|paths|pathSelect',
      myName);
};

/** @inheritDoc */
RollerSingleApp.prototype.getSubjects = function() {
  var subjects = RollerSingleApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.pathSelect, subjects);
};

/** @inheritDoc */
RollerSingleApp.prototype.observe =  function(event) {
  if (event.getSubject() == this.pathSelect) {
    this.scriptParser.update();
    this.sim.modifyObjects();
  }
};

/**
@param {!DoubleRect} simRect
*/
RollerSingleApp.prototype.setSimRect = function(simRect) {
  this.simRect = simRect;
  this.simView.setSimRect(simRect);
};

}); // goog.scope
