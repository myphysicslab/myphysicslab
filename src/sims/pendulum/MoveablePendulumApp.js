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

goog.provide('myphysicslab.sims.pendulum.MoveablePendulumApp');

goog.require('myphysicslab.lab.app.SimRunner');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.pendulum.MoveablePendulumSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.common.AbstractApp;
var ConcreteLine = lab.model.ConcreteLine;
var DisplayLine = lab.view.DisplayLine;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = lab.view.DisplaySpring;
var DoubleRect = lab.util.DoubleRect;
const GenericObserver = goog.module.get('myphysicslab.lab.util.GenericObserver');
var MoveablePendulumSim = sims.pendulum.MoveablePendulumSim;
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
var PointMass = lab.model.PointMass;
var SimList = lab.model.SimList;
var SimpleAdvance = lab.model.SimpleAdvance;
var SimRunner = lab.app.SimRunner;
var SliderControl = lab.controls.SliderControl;
var Spring = myphysicslab.lab.model.Spring;
var TabLayout = sims.common.TabLayout;
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** Displays the {@link MoveablePendulumSim} simulation.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @extends {AbstractApp}
* @constructor
* @final
* @struct
* @export
*/
sims.pendulum.MoveablePendulumApp = function(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-3.3, -3.3, 3.3, 3);
  var sim = new MoveablePendulumSim();
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  this.simRun.setTimeStep(0.01);

  /** @type {!DisplayShape} */
  this.anchor = new DisplayShape(this.simList.getPointMass('anchor'))
      .setFillStyle('').setStrokeStyle('red').setThickness(4);
  this.displayList.add(this.anchor);
  /** @type {!DisplayLine} */
  this.rod = new DisplayLine(this.simList.getConcreteLine('rod'));
  this.displayList.add(this.rod);
  /** @type {!DisplayShape} */
  this.bob = new DisplayShape(this.simList.getPointMass('bob'))
      .setFillStyle('blue');
  this.displayList.add(this.bob);

  // make observer which will add/remove the spring during mouse drag
  var dragSpring = sim.getDragSpring();
  var dispSpring = new DisplaySpring(dragSpring).setWidth(0.2);
  new GenericObserver(this.simList, goog.bind(function(evt) {
    if (evt.getValue() == dragSpring) {
      if (evt.nameEquals(SimList.OBJECT_ADDED)) {
        this.displayList.add(dispSpring);
      } else if (evt.nameEquals(SimList.OBJECT_REMOVED)) {
        this.displayList.remove(dispSpring);
      }
    }
  }, this), 'add/remove spring during mouse drag');

  // Make observer which resets initial conditions when starting to run at time 0.
  // The idea is you can move the pendulum to desired angle while paused at time 0,
  // and then that is saved as initial conditions when you start running.
  new GenericObserver(this.simRun, goog.bind(function(evt) {
    if (evt.nameEquals(SimRunner.en.RUNNING)) {
      var bp = /** @type {!ParameterBoolean} */(evt);
      sim.setRunning(bp.getValue());
      if (bp.getValue() && sim.getTime() == 0) {
        sim.saveInitialState();
      }
    }
  }, this), 'save initial conditions when starting to run at time 0');

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;

  pn = sim.getParameterNumber(MoveablePendulumSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(MoveablePendulumSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = sim.getParameterNumber(MoveablePendulumSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(MoveablePendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(MoveablePendulumSim.en.DRIVE_AMPLITUDE);
  this.addControl(new SliderControl(pn, 0, 400, /*multiply=*/false));

  pn = sim.getParameterNumber(MoveablePendulumSim.en.DRIVE_FREQUENCY);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};
var MoveablePendulumApp = sims.pendulum.MoveablePendulumApp;
goog.inherits(MoveablePendulumApp, AbstractApp);

if (!Util.ADVANCED) {
  /** @override */
  MoveablePendulumApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', anchor: '+this.anchor.toStringShort()
        +', bob: '+this.bob.toStringShort()
        +', rod: '+this.rod.toStringShort()
        + MoveablePendulumApp.superClass_.toString.call(this);
  };
};

/** @override */
MoveablePendulumApp.prototype.getClassName = function() {
  return 'MoveablePendulumApp';
};

/** @override */
MoveablePendulumApp.prototype.defineNames = function(myName) {
  MoveablePendulumApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('rod|anchor|bob',
      myName+'.');
};

}); // goog.scope
