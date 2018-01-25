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

goog.module('myphysicslab.sims.roller.RollerSingleApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CardioidPath = goog.require('myphysicslab.sims.roller.CardioidPath');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CirclePath = goog.require('myphysicslab.sims.roller.CirclePath');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const CustomPath = goog.require('myphysicslab.sims.roller.CustomPath');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
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
const RollerSingleSim = goog.require('myphysicslab.sims.roller.RollerSingleSim');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SpiralPath = goog.require('myphysicslab.sims.roller.SpiralPath');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const TextControl = goog.require('myphysicslab.lab.controls.TextControl');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Creates the RollerSingleSim simulation with no spring.

Allows defining a parametric equation to define the path. The parameter is `t` which
can be used in JavaScript expressions for Parameters `EQUATION_X` and `EQUATION_Y`.

* @implements {Observer}
*/
class RollerSingleApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new RollerSingleSim();
  var advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.simCanvas.setBackground('white');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);

  /** @type {!DisplayShape} */
  this.ball1 = new DisplayShape(this.simList.getPointMass('ball1'))
      .setFillStyle('blue');
  this.displayList.add(this.ball1);
  /** @type {!CustomPath} */
  this.customPath_ = new CustomPath();
  /** @type {!Array<!ParametricPath>} **/
  this.paths = [
      new HumpPath(),
      new LoopTheLoopPath(),
      new CirclePath(3.0),
      new OvalPath(),
      new LemniscatePath(2.0),
      new CardioidPath(3.0),
      new SpiralPath(),
      new FlatPath(),
      this.customPath_
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
  pn = sim.getParameterNumber(RollerSingleSim.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerSingleSim.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RollerSingleSim.en.MASS);
  this.addControl(new NumericControl(pn));

  this.addParameter(ps = new ParameterString(this, RollerSingleApp.en.EQUATION_X,
      RollerSingleApp.i18n.EQUATION_X,
      goog.bind(this.getXEquation, this), goog.bind(this.setXEquation, this))
      .setSuggestedLength(30));
  this.addControl(new TextControl(ps));
  this.addParameter(ps = new ParameterString(this, RollerSingleApp.en.EQUATION_Y,
      RollerSingleApp.i18n.EQUATION_Y,
      goog.bind(this.getYEquation, this), goog.bind(this.setYEquation, this))
      .setSuggestedLength(30));
  this.addControl(new TextControl(ps));
  this.addParameter(pn = new ParameterNumber(this, RollerSingleApp.en.START_T_VALUE,
      RollerSingleApp.i18n.START_T_VALUE,
      goog.bind(this.getStartTValue, this), goog.bind(this.setStartTValue, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY));
  this.addControl(new NumericControl(pn));
  this.addParameter(pn = new ParameterNumber(this, RollerSingleApp.en.FINISH_T_VALUE,
      RollerSingleApp.i18n.FINISH_T_VALUE,
      goog.bind(this.getFinishTValue, this), goog.bind(this.setFinishTValue, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.graph.line.setXVariable(0);
  this.graph.line.setYVariable(1);
  this.timeGraph.line1.setYVariable(0);
  this.timeGraph.line2.setYVariable(1);

  this.makeEasyScript([this.simView]);
  this.addURLScriptButton();
  this.pathSelect.addObserver(this);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', ball1: '+this.ball1.toStringShort()
      +', pathSelect: '+this.pathSelect.toStringShort()
      +', paths: [ '+this.paths+' ]'
      + super.toString();
};

/** @override */
getClassName() {
  return 'RollerSingleApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('ball1|paths|pathSelect',
      myName+'.');
};

/** The ending value for `t` in the parameteric equation defining the path.
* @return {number} ending value for `t`
*/
getFinishTValue() {
  return this.customPath_.getFinishTValue();
};

/** The starting value for `t` in the parameteric equation defining the path.
* @return {number} starting value for `t`
*/
getStartTValue() {
  return this.customPath_.getStartTValue();
};

/** The ending value for `t` in the parameteric equation defining the path.
* @param {number} value ending value for `t`
*/
setFinishTValue(value) {
  this.customPath_.setFinishTValue(value);
  this.pathSelect.setPathName(this.customPath_.getName());
  this.pathSelect.update();
  this.broadcastParameter(RollerSingleApp.en.FINISH_T_VALUE);
};

/** The starting value for `t` in the parameteric equation defining the path.
* @param {number} value starting value for `t`
*/
setStartTValue(value) {
  this.customPath_.setStartTValue(value);
  this.pathSelect.setPathName(this.customPath_.getName());
  this.pathSelect.update();
  this.broadcastParameter(RollerSingleApp.en.START_T_VALUE);
};

/** @override */
getSubjects() {
  var subjects = super.getSubjects();
  return goog.array.concat(this.pathSelect, subjects);
};

/** Returns the parameteric X equation defining the path.
* @return {string} the parameteric X equation defining the path
*/
getXEquation() {
  return this.customPath_.getXEquation();
};

/** Returns the parameteric Y equation defining the path.
* @return {string} the parameteric Y equation defining the path
*/
getYEquation() {
  return this.customPath_.getYEquation();
};

/** Sets the parametric X equation defining the path. A JavaScript expression where
the parameter is `t`.
* @param {string} value the parameteric X equation defining the path
*/
setXEquation(value) {
  // test this by entering equation like: 'window'
  var oldValue = this.getXEquation();
  try {
    // test this by entering equations like: '3/0' or 'Math.log(-t)'.
    this.customPath_.setXEquation(value);
    this.pathSelect.setPathName(this.customPath_.getName());
    this.pathSelect.update();
    this.broadcastParameter(RollerSingleApp.en.EQUATION_X);
  } catch(ex) {
    // restore the old X-equation
    this.customPath_.setXEquation(oldValue);
    this.pathSelect.update();
    throw ex;
  }
};

/** Sets the parametric Y equation defining the path. A JavaScript expression where
the parameter is `t`.
* @param {string} value the parameteric Y equation defining the path
*/
setYEquation(value) {
  var oldValue = this.getYEquation();
  try {
    this.customPath_.setYEquation(value);
    this.pathSelect.setPathName(this.customPath_.getName());
    this.pathSelect.update();
    this.broadcastParameter(RollerSingleApp.en.EQUATION_Y);
  } catch(ex) {
    // restore the old Y-equation
    this.customPath_.setYEquation(oldValue);
    this.pathSelect.update();
    throw ex;
  }
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

} //end class

/** Set of internationalized strings.
@typedef {{
  EQUATION_X: string,
  EQUATION_Y: string,
  START_T_VALUE: string,
  FINISH_T_VALUE: string
  }}
*/
RollerSingleApp.i18n_strings;

/**
@type {RollerSingleApp.i18n_strings}
*/
RollerSingleApp.en = {
  EQUATION_X: 'X-equation',
  EQUATION_Y: 'Y-equation',
  START_T_VALUE: 'start-t',
  FINISH_T_VALUE: 'finish-t'
};

/**
@private
@type {RollerSingleApp.i18n_strings}
*/
RollerSingleApp.de_strings = {
  EQUATION_X: 'X-Gleichung',
  EQUATION_Y: 'Y-Gleichung',
  START_T_VALUE: 'anfangs-t',
  FINISH_T_VALUE: 'ende-t'
};

/** Set of internationalized strings.
@type {RollerSingleApp.i18n_strings}
*/
RollerSingleApp.i18n = goog.LOCALE === 'de' ? RollerSingleApp.de_strings :
    RollerSingleApp.en;

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!RollerSingleApp}
*/
function makeRollerSingleApp(elem_ids) {
  return new RollerSingleApp(elem_ids);
};
goog.exportSymbol('makeRollerSingleApp', makeRollerSingleApp);

exports = RollerSingleApp;
