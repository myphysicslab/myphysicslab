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
import { CollisionAdvance } from '../lab/model/CollisionAdvance.js';
import { CommonControls } from '../sims/common/CommonControls.js';
import { ContactSim } from '../lab/engine2D/ContactSim.js';
import { DoubleRect } from '../lab/util/DoubleRect.js';
import { ElementIDs } from '../sims/common/Layout.js';
import { Engine2DApp } from '../sims/engine2D/Engine2DApp.js';
import { LabelControl } from '../lab/controls/LabelControl.js';
import { NumericControl } from '../lab/controls/NumericControl.js';
import { ParameterString, Subject } from '../lab/util/Observe.js';
import { RigidBodySim } from '../lab/engine2D/RigidBodySim.js';
import { SpeedTest } from './SpeedTest.js';
import { Util } from '../lab/util/Util.js';

/** SingleViewerApp is hard-coded to run a single test for debugging, similar to
TestViewerApp but without the menus to select tests.
*/
export class SingleViewerApp extends Engine2DApp<ContactSim> implements Subject {

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);

  SpeedTest.ball_vs_wall_setup(this.sim, advance);

  this.addPlaybackControls();
  this.addStandardControls();
  let ps = this.sim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  this.addControl(new ChoiceControl(ps));
  ps = this.sim.getParameterString(RigidBodySim.en.EXTRA_ACCEL);
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
  return 'SingleViewerApp';
};

} // end class
