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

goog.module('myphysicslab.sims.pendulum.MoveableDoublePendulumApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const MoveableDoublePendulumSim = goog.require('myphysicslab.sims.pendulum.MoveableDoublePendulumSim');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
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
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Displays the {@link MoveableDoublePendulumSim} simulation.
*/
class MoveableDoublePendulumApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-3.3, -3.3, 3.3, 3);
  var sim = new MoveableDoublePendulumSim();
  var advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);

  this.simRun.setTimeStep(0.01);
  sim.setDriveAmplitude(0);
  sim.setDamping(0.05);
  var va = sim.getVarsList();
  va.setValue(0, 0.1);
  va.setValue(2, -0.2);

  /** @type {!DisplayShape} */
  this.anchor = new DisplayShape(this.simList.getPointMass('anchor'))
      .setFillStyle('').setStrokeStyle('red').setThickness(4);
  this.displayList.add(this.anchor);
  /** @type {!DisplayLine} */
  this.rod1 = new DisplayLine(this.simList.getConcreteLine('rod1'));
  this.displayList.add(this.rod1);
  /** @type {!DisplayLine} */
  this.rod2 = new DisplayLine(this.simList.getConcreteLine('rod2'));
  this.displayList.add(this.rod2);
  /** @type {!DisplayShape} */
  this.bob1 = new DisplayShape(this.simList.getPointMass('bob1'))
      .setFillStyle('blue');
  this.displayList.add(this.bob1);
  /** @type {!DisplayShape} */
  this.bob2 = new DisplayShape(this.simList.getPointMass('bob2'))
      .setFillStyle('blue');
  this.displayList.add(this.bob2);

  // make observer which will add/remove the spring during mouse drag
  var dragSpring = sim.getDragSpring();
  var dispSpring = new DisplaySpring(dragSpring).setWidth(0.2);
  new GenericObserver(this.simList, evt => {
    if (evt.getValue() == dragSpring) {
      if (evt.nameEquals(SimList.OBJECT_ADDED)) {
        this.displayList.add(dispSpring);
      } else if (evt.nameEquals(SimList.OBJECT_REMOVED)) {
        this.displayList.remove(dispSpring);
      }
    }
  }, 'add/remove spring during mouse drag');

  // Make observer which resets initial conditions when starting to run at time 0.
  // The idea is you can move the pendulum to desired angle while paused at time 0,
  // and then that is saved as initial conditions when you start running.
  new GenericObserver(this.simRun, evt => {
    if (evt.nameEquals(SimRunner.en.RUNNING)) {
      var bp = /** @type {!ParameterBoolean} */(evt);
      sim.setRunning(bp.getValue());
      if (bp.getValue() && sim.getTime() == 0) {
        sim.saveInitialState();
      }
    }
  }, 'save initial conditions when starting to run at time 0');

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.LENGTH_1);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.LENGTH_2);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.MASS_1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.MASS_2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.DRIVE_AMPLITUDE);
  this.addControl(new SliderControl(pn, 0, 400, /*multiply=*/false));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.DRIVE_FREQUENCY);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  pn = sim.getParameterNumber(EnergySystem.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', anchor: '+this.anchor.toStringShort()
      +', bob1: '+this.bob1.toStringShort()
      +', bob2: '+this.bob2.toStringShort()
      +', rod1: '+this.rod1.toStringShort()
      +', rod2: '+this.rod2.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'MoveableDoublePendulumApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('rod1|rod2|anchor|bob1|bob2',
      myName+'.');
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!MoveableDoublePendulumApp}
*/
function makeMoveableDoublePendulumApp(elem_ids) {
  return new MoveableDoublePendulumApp(elem_ids);
};
goog.exportSymbol('makeMoveableDoublePendulumApp', makeMoveableDoublePendulumApp);

exports = MoveableDoublePendulumApp;
