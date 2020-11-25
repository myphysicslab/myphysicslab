// Copyright 2020 Erik Neumann.  All Rights Reserved.
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

goog.module('myphysicslab.sims.experimental.MagnetWheelApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayWheel = goog.require('myphysicslab.sims.experimental.DisplayWheel');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const MagnetWheel = goog.require('myphysicslab.sims.experimental.MagnetWheel');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const MagnetWheelSim = goog.require('myphysicslab.sims.experimental.MagnetWheelSim');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the {@link MagnetWheelSim} simulation.
*/
class MagnetWheelApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {string=} opt_name name of this as a Subject
*/
constructor(elem_ids, opt_name) {
  Util.setErrorHandler();
  console.log('compiled '+Util.COMPILE_TIME);
  var simRect = new DoubleRect(-3, -2, 3, 2);
  var sim = new MagnetWheelSim();
  var advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim, opt_name);

  var mw = this.simList.get('wheel');
  if (mw == null) {
    throw new Error();
  }
  /** @type {!DisplayWheel} */
  this.wheel = new DisplayWheel(/** @type {!MagnetWheel} */(mw));
  this.displayList.add(this.wheel);

  this.addPlaybackControls();

  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(MagnetWheelSim.en.MASS);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(MagnetWheelSim.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', wheel: '+this.wheel.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'MagnetWheelApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('wheel',
      myName+'.');
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!MagnetWheelApp}
*/
function makeMagnetWheelApp(elem_ids) {
  return new MagnetWheelApp(elem_ids);
};
goog.exportSymbol('makeMagnetWheelApp', makeMagnetWheelApp);

exports = MagnetWheelApp;
