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

goog.provide('myphysicslab.sims.roller.BrachistoApp');

goog.require('myphysicslab.lab.app.SimRunner');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.model.ParametricPath');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.util.ClockTask');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.roller.BrachistoObserver');
goog.require('myphysicslab.sims.roller.BrachistoPaths');
goog.require('myphysicslab.sims.roller.BrachistoSim');


goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.common.AbstractApp;
var BrachistoObserver = sims.roller.BrachistoObserver;
var BrachistoPaths = sims.roller.BrachistoPaths;
var BrachistoSim = sims.roller.BrachistoSim;
const ClockTask = goog.module.get('myphysicslab.lab.util.ClockTask');
var CommonControls = sims.common.CommonControls;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const GenericObserver = goog.module.get('myphysicslab.lab.util.GenericObserver');
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const ParametricPath = goog.module.get('myphysicslab.lab.model.ParametricPath');
const SimpleAdvance = goog.module.get('myphysicslab.lab.model.SimpleAdvance');
var SimRunner = lab.app.SimRunner;
var TabLayout = sims.common.TabLayout;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Displays the {@link BrachistoSim} simulation which shows a ball sliding down various
curved paths to see which path is fastest.

The various curves shown are defined in the {@link BrachistoPaths} class.
The Mathematica notebook [Brachistochrone Curves](Brachistochrone_Curves.pdf) shows how
the curves were chosen. The goal is to find a variety of curves that start at
the origin (0, 0) and pass thru the point (3, -2).

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {AbstractApp}
* @export
*/
myphysicslab.sims.roller.BrachistoApp = function(elem_ids) {
  Util.setErrorHandler();
  /** @type {!Array<!ParametricPath>} **/
  this.paths = [
      new BrachistoPaths.BrachistochronePath(),
      new BrachistoPaths.LinearPath(),
      new BrachistoPaths.CircleArcPath(),
      new BrachistoPaths.Brachistochrone2Path(),
      new BrachistoPaths.ParabolaUpPath(),
      new BrachistoPaths.ParabolaDownPath()
    ];
  var simRect = new DoubleRect(-1, -3, 7, 1);
  var sim = new BrachistoSim(this.paths);
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*enerygSystem=*/null);

  /** BrachistoObserver handles making all DisplayObjects
  * @type {!BrachistoObserver}
  */
  this.brachistoObserver = new BrachistoObserver(sim, this.simList, this.simView,
      this.statusView);

  /** This 'repeat' ClockTask will reset the sim every 6 seconds.
  * @type {!ClockTask}
  */
  this.task;

  // start clock running when path is chosen; or pause clock in 'choose path' state
  new GenericObserver(sim, goog.bind(function(evt) {
    if (evt.nameEquals(BrachistoSim.PATH_CHOSEN)) {
      this.clock.setTime(0);
      this.clock.setRealTime(0);
      var choice = /** @type {number}*/ (evt.getValue());
      if (choice == -1) {
        this.clock.pause();
      } else {
        this.clock.resume();
      }
    }
  }, this), 'start clock when path chosen');

  // reset path choice when 'restart' button is pressed
  new GenericObserver(this.simRun, goog.bind(function(evt) {
    if (evt.nameEquals(SimRunner.RESET)) {
      sim.setPathChoice(-1);
    }
  }, this), 'reset path choice when reset occurs');

  sim.setPathChoice(-1);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;

  pn = sim.getParameterNumber(BrachistoSim.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(BrachistoSim.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(BrachistoSim.en.MASS);
  this.addControl(new NumericControl(pn));
  this.task = this.makeTask(6);
  this.clock.addTask(this.task);
  this.addParameter(pn = new ParameterNumber(this, BrachistoApp.en.REPEAT_TIME,
      BrachistoApp.i18n.REPEAT_TIME,
      goog.bind(this.getRepeatTime, this), goog.bind(this.setRepeatTime, this))
      .setSignifDigits(0));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.graph.line.setXVariable(0);
  this.graph.line.setYVariable(1);
  this.timeGraph.line1.setYVariable(0);
  this.timeGraph.line2.setYVariable(1);

  this.makeEasyScript();
  this.addURLScriptButton();
};
var BrachistoApp = myphysicslab.sims.roller.BrachistoApp;
goog.inherits(BrachistoApp, AbstractApp);

/** @override */
BrachistoApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
    +', brachistoObserver: '+this.brachistoObserver.toStringShort()
    +', paths: [ '+this.paths+' ]'
    + BrachistoApp.superClass_.toString.call(this);
};

/** @override */
BrachistoApp.prototype.getClassName = function() {
  return 'BrachistoApp';
};

/**
* @return {number}
*/
BrachistoApp.prototype.getRepeatTime = function() {
  return this.task.getTime();
};

/**
* @param {number} time
* @return {!ClockTask}
* @private
*/
BrachistoApp.prototype.makeTask = function(time) {
  return new ClockTask(time, goog.bind(function() {
      this.sim.reset();
      this.clock.setTime(0);
      this.clock.setRealTime(0);
  }, this));
};

/** Restart sim when reaching the repeat time.
* @param {number} value
*/
BrachistoApp.prototype.setRepeatTime = function(value) {
  this.clock.removeTask(this.task);
  this.task = this.makeTask(value);
  this.clock.addTask(this.task);
  this.sim.reset();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.broadcastParameter(BrachistoApp.en.REPEAT_TIME);
};

/** @override */
BrachistoApp.prototype.defineNames = function(myName) {
  BrachistoApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('brachistoObserver|paths',
      myName+'.');
};

BrachistoApp.prototype.setup = function() {
  BrachistoApp.superClass_.setup.call(this);
  this.clock.pause();
};

/** Set of internationalized strings.
@typedef {{
  REPEAT_TIME: string
  }}
*/
BrachistoApp.i18n_strings;

/**
@type {BrachistoApp.i18n_strings}
*/
BrachistoApp.en = {
  REPEAT_TIME: 'repeat time'
};

/**
@private
@type {BrachistoApp.i18n_strings}
*/
BrachistoApp.de_strings = {
  REPEAT_TIME: 'Intervallwiederholung'
};

/** Set of internationalized strings.
@type {BrachistoApp.i18n_strings}
*/
BrachistoApp.i18n = goog.LOCALE === 'de' ? BrachistoApp.de_strings :
    BrachistoApp.en;

}); // goog.scope
