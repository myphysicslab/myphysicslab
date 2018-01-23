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

goog.provide('myphysicslab.test.StuckTestApp');

goog.require('goog.array');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ImpulseSim');
goog.require('myphysicslab.lab.engine2D.RigidBodySim');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.test.CircleStraightTest');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const ChoiceControl = goog.module.get('myphysicslab.lab.controls.ChoiceControl');
var CircleStraightTest = myphysicslab.test.CircleStraightTest;
const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.module.get('myphysicslab.sims.common.CommonControls');
var DebugLevel = lab.model.CollisionAdvance.DebugLevel;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DApp = sims.engine2D.Engine2DApp;
const ImpulseSim = goog.module.get('myphysicslab.lab.engine2D.ImpulseSim');
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.module.get('myphysicslab.lab.util.ParameterString');
const RigidBodySim = goog.module.get('myphysicslab.lab.engine2D.RigidBodySim');
const TabLayout = goog.module.get('myphysicslab.sims.common.TabLayout');
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** StuckTestApp runs a simulation that is guaranteed to become 'stuck', at which point
we should get an error dialog and be able to restart the simulation. This is mainly
a check that the error handling mechanism is working properly.

The simulation being run is ImpulseSim rather than the usual ContactSim.  The scenario
is `CircleStraightTest.ball_falls_on_floor_setup` in which a ball bounces on the floor,
each bounce is less high and eventually the simulation becomes stuck because of the
lack of contact forces.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
myphysicslab.test.StuckTestApp = function(elem_ids) {
  var simRect = new DoubleRect(-6, -6, 6, 6);
  /** @type {!ImpulseSim} */
  this.mySim = new ImpulseSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);

  this.showClockParam.setValue(true);
  this.showEnergyParam.setValue(true);

  CircleStraightTest.ball_falls_on_floor_setup(this.mySim, advance);

  this.addPlaybackControls();
  this.addStandardControls();
  /** @type {!ParameterString} */
  var ps = this.mySim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  this.addControl(new ChoiceControl(ps));

  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup();
};
var StuckTestApp = myphysicslab.test.StuckTestApp;
goog.inherits(StuckTestApp, Engine2DApp);

/** @override */
StuckTestApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      + StuckTestApp.superClass_.toString.call(this);
};

/** @override */
StuckTestApp.prototype.getClassName = function() {
  return 'StuckTestApp';
};

}); // goog.scope
