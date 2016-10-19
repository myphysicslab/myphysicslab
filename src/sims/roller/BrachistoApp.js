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

goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.app.SimRunner');
goog.require('myphysicslab.lab.model.ParametricPath');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.util.ClockTask');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.layout.AbstractApp');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.roller.BrachistoObserver');
goog.require('myphysicslab.sims.roller.BrachistoPaths');
goog.require('myphysicslab.sims.roller.BrachistoSim');


goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var NumericControl = lab.controls.NumericControl;
var AbstractApp = sims.layout.AbstractApp;
var BrachistoObserver = sims.roller.BrachistoObserver;
var BrachistoPaths = sims.roller.BrachistoPaths;
var BrachistoSim = sims.roller.BrachistoSim;
var ClockTask = lab.util.ClockTask;
var CommonControls = sims.layout.CommonControls;
var DoubleRect = lab.util.DoubleRect;
var GenericObserver = lab.util.GenericObserver;
var ParameterNumber = lab.util.ParameterNumber;
var SimpleAdvance = lab.model.SimpleAdvance;
var SimRunner = lab.app.SimRunner;
var TabLayout = sims.layout.TabLayout;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/** Displays the {@link myphysicslab.sims.roller.BrachistoSim} simulation. The
Brachistochrone simulation shows a ball sliding down each of the curves without
friction, with gravity acting.

The various curves shown are defined in the
{@link myphysicslab.sims.roller.BrachistoPaths} class.
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
  UtilityCore.setErrorHandler();
  /** @type {!Array<!lab.model.ParametricPath>} **/
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
  this.brachObsvr = new BrachistoObserver(sim, this.simList, this.simView,
      this.statusView);

  /** This 'repeat' ClockTask will reset the sim every 6 seconds.
  * @type {!lab.util.ClockTask}
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
  /** @type {!lab.util.ParameterNumber} */
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
      this.getRepeatTime, this.setRepeatTime).setSignifDigits(0));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.graph.line.setXVariable(0);
  this.graph.line.setYVariable(1);
  this.timeGraph.line1.setYVariable(0);
  this.timeGraph.line2.setYVariable(1);

  this.makeScriptParser();
  this.addURLScriptButton();
};
var BrachistoApp = myphysicslab.sims.roller.BrachistoApp;
goog.inherits(BrachistoApp, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  BrachistoApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
      +', brachObsvr: '+this.brachObsvr.toStringShort()
      +', paths: [ '+this.paths+' ]'
      + BrachistoApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
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
* @return {!lab.util.ClockTask}
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

/** @inheritDoc */
BrachistoApp.prototype.defineNames = function(myName) {
  BrachistoApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('brachObsvr|paths',
      myName);
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
