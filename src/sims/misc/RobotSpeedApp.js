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

goog.module('myphysicslab.sims.misc.RobotSpeedApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplayRobotWheel = goog.require('myphysicslab.sims.misc.DisplayRobotWheel');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const RobotSpeedSim = goog.require('myphysicslab.sims.misc.RobotSpeedSim');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the {@link RobotSpeedSim} simulation.
*/
class RobotSpeedApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {string=} opt_name name of this as a Subject
*/
constructor(elem_ids, opt_name) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-0.3, -0.2, 3.9, 2.0);
  var sim = new RobotSpeedSim();
  var advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/null,
      /*energySystem=*/null, opt_name);

  /** @type {!DisplayShape} */
  this.ramp = new DisplayShape(this.simList.getPointMass('ramp'))
      .setFillStyle('black');
  this.displayList.add(this.ramp);
  /** @type {!DisplayShape} */
  this.body = new DisplayShape(this.simList.getPointMass('body'))
      .setFillStyle('blue');
  this.displayList.add(this.body);
  /** @type {!DisplayRobotWheel} */
  this.wheelf = new DisplayRobotWheel(this.simList.getPointMass('wheelf'));
  this.displayList.add(this.wheelf);
  /** @type {!DisplayRobotWheel} */
  this.wheelr = new DisplayRobotWheel(this.simList.getPointMass('wheelr'));
  this.displayList.add(this.wheelr);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(RobotSpeedSim.en.MASS);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.TORQUE);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.FREE_SPEED);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.SLOPE);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', body: '+this.body.toStringShort()
      +', ramp: '+this.ramp.toStringShort()
      +', wheelf: '+this.wheelf.toStringShort()
      +', wheelr: '+this.wheelr.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'RobotSpeedApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('body|ramp|wheelf|wheelr',
      myName+'.');
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!RobotSpeedApp}
*/
function makeRobotSpeedApp(elem_ids) {
  return new RobotSpeedApp(elem_ids);
};
goog.exportSymbol('makeRobotSpeedApp', makeRobotSpeedApp);

exports = RobotSpeedApp;
