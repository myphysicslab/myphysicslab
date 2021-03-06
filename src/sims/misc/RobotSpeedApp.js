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
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayRobotWheel = goog.require('myphysicslab.sims.misc.DisplayRobotWheel');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Force = goog.require('myphysicslab.lab.model.Force');
const GenericMemo = goog.require('myphysicslab.lab.util.GenericMemo');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const RobotSpeedSim = goog.require('myphysicslab.sims.misc.RobotSpeedSim');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const TabLayout2 = goog.require('myphysicslab.sims.common.TabLayout2');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the {@link RobotSpeedSim} simulation.
* @implements {Observer}
*/
class RobotSpeedApp extends AbstractApp {
/**
* @param {!Object} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {string=} opt_name name of this as a Subject
*/
constructor(elem_ids, opt_name) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-0.7, -0.4, 2.5, 1.3);
  const sim = new RobotSpeedSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/null,
      /*energySystem=*/null, opt_name);

  /** @type {!DisplayShape} */
  this.ramp = new DisplayShape(this.simList.getPointMass('ramp'))
      .setFillStyle('black');
  this.displayList.add(this.ramp);
  const bot = this.simList.getPointMass('robot');
  /** @type {!DisplayShape} */
  this.robot = new DisplayShape(bot).setFillStyle('lightGray')
      .setDrawCenterOfMass(true);
  this.displayList.add(this.robot);
  /** @type {!DisplayRobotWheel} */
  this.wheelf = new DisplayRobotWheel(this.simList.getPointMass('wheelf'));
  this.displayList.add(this.wheelf);
  /** @type {!DisplayRobotWheel} */
  this.wheelr = new DisplayRobotWheel(this.simList.getPointMass('wheelr'));
  this.displayList.add(this.wheelr);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  let pn = sim.getParameterNumber(RobotSpeedSim.en.DIAMETER);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.MASS);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.TORQUE);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.FREE_SPEED);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.SLOPE);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.COEF_FRICTION);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(RobotSpeedSim.en.CENTER_OF_MASS);
  this.addControl(new NumericControl(pn));
  this.graph.addControl(new NumericControl(pn));
  this.timeGraph.addControl(new NumericControl(pn));

  const sr = this.simRun;
  // pause simulation when bot goes too far in either direction
  /** @type {!GenericMemo} */
  this.memo = new GenericMemo(() => {
    const p = bot.getPosition().getX();
    if (p < -0.5 || p > 6)
      sr.pause();
  });
  this.simRun.addMemo(this.memo);
  this.simRun.setTimeStep(0.01);
  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();
  // 0  1    2     3       4          5
  // x, v, time, rpm, wheel_force, gravity
  this.graph.line.setXVariable(2);
  this.graph.line.setYVariable(1);
  this.timeGraph.line1.setYVariable(1);
  this.timeGraph.line2.setYVariable(4);
  this.timeGraph.line3.setYVariable(5);
  this.timeGraph.autoScale.setTimeWindow(2);
  (/**@type !TabLayout2*/(this.layout)).setLayout(TabLayout2.Layout.TIME_GRAPH_AND_SIM);
  this.sim.getSimList().addObserver(this);
  this.getParameterBoolean('PAN_ZOOM').setValue(true);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', robot: '+this.robot.toStringShort()
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

/** @override */
observe(event) {
  if (event.getSubject() == this.sim.getSimList()) {
    const obj = /** @type {!SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      if (this.displayList.find(obj) != null) {
        // we already have a DisplayObject for this SimObject, don't add a new one.
        return;
      }
      if (obj instanceof Force) {
        const line = /** @type {!Force} */(obj);
        const dl = new DisplayLine(line).setThickness(1);
        dl.setColor('blue');
        dl.setZIndex(10);
        this.displayList.add(dl);
      }
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      const d = this.displayList.find(obj);
      if (d != null) {
        this.displayList.remove(d);
      }
    }
  }
};

} // end class

/**
* @param {!Object} elem_ids
* @return {!RobotSpeedApp}
*/
function makeRobotSpeedApp(elem_ids) {
  return new RobotSpeedApp(elem_ids);
};
goog.exportSymbol('makeRobotSpeedApp', makeRobotSpeedApp);

exports = RobotSpeedApp;
