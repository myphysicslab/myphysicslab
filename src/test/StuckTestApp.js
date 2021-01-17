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

goog.module('myphysicslab.test.StuckTestApp');

const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CircleStraightTest = goog.require('myphysicslab.test.CircleStraightTest');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const ImpulseSim = goog.require('myphysicslab.lab.engine2D.ImpulseSim');
const LabelControl = goog.require('myphysicslab.lab.controls.LabelControl');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** StuckTestApp runs a simulation that is guaranteed to become 'stuck', at which point
we should get an error dialog and be able to restart the simulation. This is mainly
a check that the error handling mechanism is working properly.

The simulation being run is ImpulseSim rather than the usual ContactSim.  The scenario
is `CircleStraightTest.ball_falls_on_floor_setup` in which a ball bounces on the floor,
each bounce is less high and eventually the simulation becomes stuck because of the
lack of contact forces.
*/
class StuckTestApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);

  super(elem_ids, simRect, sim, advance);

  /** @type {!ImpulseSim} */
  this.mySim = sim;
  this.showClockParam.setValue(true);
  this.showEnergyParam.setValue(true);

  CircleStraightTest.ball_falls_on_floor_setup(this.mySim, advance);

  this.addPlaybackControls();
  this.addStandardControls();
  /** @type {!ParameterString} */
  const ps = this.mySim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  this.addControl(new ChoiceControl(ps));
  // show compile time so user can ensure loading latest version
  if (Util.DEBUG) {
    this.addControl(new LabelControl('compiled '+Util.COMPILE_TIME));
  }

  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      + super.toString();
};

/** @override */
getClassName() {
  return 'StuckTestApp';
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!StuckTestApp}
*/
function makeStuckTestApp(elem_ids) {
  return new StuckTestApp(elem_ids);
};
goog.exportSymbol('makeStuckTestApp', makeStuckTestApp);

exports = StuckTestApp;
