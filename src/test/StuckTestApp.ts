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

import { ChoiceControl } from '../lab/controls/ChoiceControl.js';
import { CircleStraightTest } from './CircleStraightTest.js';
import { CollisionAdvance } from '../lab/model/CollisionAdvance.js';
import { CommonControls } from '../sims/common/CommonControls.js';
import { DoubleRect } from '../lab/util/DoubleRect.js';
import { ElementIDs } from '../sims/common/Layout.js';
import { Engine2DApp } from '../sims/engine2D/Engine2DApp.js';
import { ImpulseSim } from '../lab/engine2D/ImpulseSim.js';
import { LabelControl } from '../lab/controls/LabelControl.js';
import { NumericControl } from '../lab/controls/NumericControl.js';
import { ParameterString, Subject } from '../lab/util/Observe.js';
import { RigidBodySim } from '../lab/engine2D/RigidBodySim.js';
import { Util } from '../lab/util/Util.js';

/** StuckTestApp runs a simulation that is guaranteed to become 'stuck', at which point
we should get an error dialog and be able to restart the simulation. This is mainly
a check that the error handling mechanism is working properly.

The simulation being run is ImpulseSim rather than the usual ContactSim.  The scenario
is `CircleStraightTest.ball_falls_on_floor_setup` in which a ball bounces on the floor,
each bounce is less high and eventually the simulation becomes stuck because of the
lack of contact forces.
*/
export class StuckTestApp extends Engine2DApp<ImpulseSim> implements Subject {

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);

  this.showClockParam.setValue(true);
  this.showEnergyParam.setValue(true);

  CircleStraightTest.ball_falls_on_floor_setup(this.sim, advance);

  this.addPlaybackControls();
  this.addStandardControls();
  const ps = this.sim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  this.addControl(new ChoiceControl(ps));
  // show compile time so user can ensure loading latest version
  if (Util.DEBUG) {
    this.addControl(new LabelControl('compiled '+Util.COMPILE_TIME));
  }

  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'StuckTestApp';
};

} // end class
Util.defineGlobal('test$StuckTestApp', StuckTestApp);
