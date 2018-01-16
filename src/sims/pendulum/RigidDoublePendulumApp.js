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

goog.provide('myphysicslab.sims.pendulum.RigidDoublePendulumApp');

goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Simulation');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayConnector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.pendulum.RigidDoublePendulumSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.common.AbstractApp;
var CommonControls = sims.common.CommonControls;
var ConcreteLine = lab.model.ConcreteLine;
var DisplayConnector = lab.view.DisplayConnector;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var GenericObserver = lab.util.GenericObserver;
var ParameterNumber = lab.util.ParameterNumber;
var PointMass = lab.model.PointMass;
var RigidDoublePendulumSim = sims.pendulum.RigidDoublePendulumSim;
var SimpleAdvance = lab.model.SimpleAdvance;
var Simulation = lab.model.Simulation;
var SliderControl = lab.controls.SliderControl;
var TabLayout = sims.common.TabLayout;
var Util = goog.module.get('myphysicslab.lab.util.Util');
var Vector = lab.util.Vector;

/** Displays the {@link RigidDoublePendulumSim} simulation.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {boolean} centered determines which pendulum configuration to make: centered
*    (true) or offset (false)
* @extends {AbstractApp}
* @constructor
* @final
* @struct
* @export
*/
sims.pendulum.RigidDoublePendulumApp = function(elem_ids, centered) {
  Util.setErrorHandler();
  /** @type {!RigidDoublePendulumSim.Parts} */
  this.parts = centered ? RigidDoublePendulumSim.makeCentered(0.25 * Math.PI, 0)
        : RigidDoublePendulumSim.makeOffset(0.25 * Math.PI, 0);
  var simRect = new DoubleRect(-2, -2, 2, 2);
  var sim = new RigidDoublePendulumSim(this.parts);
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/null,
      /*energySystem=*/sim);

  // This Observer ensures that when initial angles are changed in sim, then clock
  // time is also reset.  This helps with feedback when dragging angle slider,
  // especially if the clock is running.
  new GenericObserver(sim, goog.bind(function(evt) {
    if (evt.nameEquals(Simulation.RESET)) {
      this.clock.setTime(sim.getTime());
    }
  }, this), 'sync clock time on reset');
  /** @type {!DisplayShape} */
  this.protoBob = new DisplayShape().setFillStyle('').setStrokeStyle('blue')
      .setDrawCenterOfMass(true).setThickness(3);
  /** @type {!DisplayShape} */
  this.bob0 = new DisplayShape(this.parts.bodies[0], this.protoBob);
  this.displayList.add(this.bob0);
  /** @type {!DisplayShape} */
  this.bob1 = new DisplayShape(this.parts.bodies[1], this.protoBob);
  this.displayList.add(this.bob1);
  /** @type {!DisplayConnector} */
  this.joint0 = new DisplayConnector(this.parts.joints[0]);
  this.displayList.add(this.joint0);
  /** @type {!DisplayConnector} */
  this.joint1 = new DisplayConnector(this.parts.joints[1]);
  this.displayList.add(this.joint1);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(RigidDoublePendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(RigidDoublePendulumSim.en.ANGLE_1);
  this.addControl(new SliderControl(pn, -Math.PI, Math.PI, /*multiply=*/false));

  pn = sim.getParameterNumber(RigidDoublePendulumSim.en.ANGLE_2);
  this.addControl(new SliderControl(pn, -Math.PI, Math.PI, /*multiply=*/false));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};
var RigidDoublePendulumApp = sims.pendulum.RigidDoublePendulumApp;
goog.inherits(RigidDoublePendulumApp, AbstractApp);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  RigidDoublePendulumApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', bob0: '+this.bob0.toStringShort()
        +', bob1: '+this.bob1.toStringShort()
        +', joint0: '+this.joint0.toStringShort()
        +', joint1: '+this.joint1.toStringShort()
        + RigidDoublePendulumApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
RigidDoublePendulumApp.prototype.getClassName = function() {
  return 'RigidDoublePendulumApp';
};

/** @inheritDoc */
RigidDoublePendulumApp.prototype.defineNames = function(myName) {
  RigidDoublePendulumApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('joint0|joint1|bob1|bob0|protoBob',
      myName+'.');
};

}); // goog.scope
