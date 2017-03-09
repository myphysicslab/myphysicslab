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

goog.provide('myphysicslab.sims.roller.LagrangeRollerApp');

goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayPath');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DrawingStyle');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.roller.LagrangeRollerSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var NumericControl = lab.controls.NumericControl;
var AbstractApp = sims.common.AbstractApp;
var CommonControls = sims.common.CommonControls;
var DisplayPath = myphysicslab.lab.view.DisplayPath;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var DrawingStyle = myphysicslab.lab.view.DrawingStyle;
var LagrangeRollerSim = sims.roller.LagrangeRollerSim;
var PointMass = lab.model.PointMass;
var SimpleAdvance = lab.model.SimpleAdvance;
var TabLayout = sims.common.TabLayout;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/** Shows the {@link myphysicslab.sims.roller.LagrandRoller LagrangeRollerSim} simulation.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @extends {AbstractApp}
* @struct
* @export
*/
sims.roller.LagrangeRollerApp = function(elem_ids) {
  UtilityCore.setErrorHandler();
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new LagrangeRollerSim();
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  this.simRect = sim.getPath().getBoundsWorld().scale(1.2);
  this.simView.setSimRect(this.simRect);

  this.ball1 = new DisplayShape(this.simList.getPointMass('ball1'))
      .setFillStyle('blue');
  this.displayList.add(this.ball1);

  this.displayPath = new DisplayPath();
  this.displayPath.setScreenRect(this.simView.getScreenRect());
  this.displayPath.setZIndex(-1);
  this.displayList.add(this.displayPath);
  this.displayPath.addPath(sim.getPath(),
      DrawingStyle.lineStyle('gray', /*lineWidth=*/4));

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
  var pn;

  pn = sim.getParameterNumber(LagrangeRollerSim.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(LagrangeRollerSim.en.MASS);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.graph.line.setXVariable(0);
  this.graph.line.setYVariable(1);
  this.timeGraph.line1.setYVariable(0);
  this.timeGraph.line2.setYVariable(1);

  this.makeEasyScript();
  this.addURLScriptButton();
};
var LagrangeRollerApp = sims.roller.LagrangeRollerApp;
goog.inherits(LagrangeRollerApp, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  LagrangeRollerApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', ball1: '+this.ball1.toStringShort()
        +', displayPath: '+this.displayPath.toStringShort()
        + LagrangeRollerApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
LagrangeRollerApp.prototype.getClassName = function() {
  return 'LagrangeRollerApp';
};

/** @inheritDoc */
LagrangeRollerApp.prototype.defineNames = function(myName) {
  LagrangeRollerApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('ball1',
      myName);
};

}); // goog.scope
