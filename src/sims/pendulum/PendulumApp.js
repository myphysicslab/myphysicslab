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

goog.module('myphysicslab.sims.pendulum.PendulumApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const DisplayArc = goog.require('myphysicslab.lab.view.DisplayArc');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PendulumSim = goog.require('myphysicslab.sims.pendulum.PendulumSim');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the {@link PendulumSim} simulation.
*/
class PendulumApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @export
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-2, -2.2, 2, 1.5);
  var sim = new PendulumSim();
  var advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  /** @type {!DisplayLine} */
  this.rod = new DisplayLine(this.simList.getConcreteLine('rod'));
  this.displayList.add(this.rod);
  /** @type {!DisplayArc} */
  this.drive = new DisplayArc(this.simList.getArc('drive'));
  this.displayList.add(this.drive);
  /** @type {!DisplayShape} */
  this.bob = new DisplayShape(this.simList.getPointMass('bob')).setFillStyle('blue');
  this.displayList.add(this.bob);
  sim.getVarsList().getVariable(PendulumSim.en.ANGLE).setValue(Math.PI/8);
  sim.modifyObjects();

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(PendulumSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(PendulumSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(PendulumSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(PendulumSim.en.DRIVE_AMPLITUDE);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = sim.getParameterNumber(PendulumSim.en.DRIVE_FREQUENCY);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = sim.getParameterNumber(PendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(EnergySystem.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  /** @type {!ParameterBoolean} */
  var pb = sim.getParameterBoolean(PendulumSim.en.LIMIT_ANGLE);
  this.addControl(new CheckBoxControl(pb));

  this.addStandardControls();

  //change default DrawingMode
  //this.graph.line.setDrawingMode(DrawingMode.DOTS);
  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', bob: '+this.bob.toStringShort()
      +', rod: '+this.rod.toStringShort()
      +', drive: '+this.drive.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'PendulumApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('rod|drive|bob',
      myName+'.');
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!PendulumApp}
*/
function makePendulumApp(elem_ids) {
  return new PendulumApp(elem_ids);
};
goog.exportSymbol('makePendulumApp', makePendulumApp);

exports = PendulumApp;
