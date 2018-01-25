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

goog.module('myphysicslab.sims.pendulum.MoveablePendulumApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const MoveablePendulumSim = goog.require('myphysicslab.sims.pendulum.MoveablePendulumSim');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SimRunner = goog.require('myphysicslab.lab.app.SimRunner');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the {@link MoveablePendulumSim} simulation.
*/
class MoveablePendulumApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-3.3, -3.3, 3.3, 3);
  var sim = new MoveablePendulumSim();
  var advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
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

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', anchor: '+this.anchor.toStringShort()
      +', bob: '+this.bob.toStringShort()
      +', rod: '+this.rod.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'MoveablePendulumApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('rod|anchor|bob',
      myName+'.');
};

} //end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!MoveablePendulumApp}
*/
function makeMoveablePendulumApp(elem_ids) {
  return new MoveablePendulumApp(elem_ids);
};
goog.exportSymbol('makeMoveablePendulumApp', makeMoveablePendulumApp);

exports = MoveablePendulumApp;
