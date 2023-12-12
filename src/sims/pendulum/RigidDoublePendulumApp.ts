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

import { AbstractApp } from '../common/AbstractApp.js';
import { CommonControls } from '../common/CommonControls.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { DisplayConnector } from '../../lab/view/DisplayConnector.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { EnergyInfo } from '../../lab/model/EnergySystem.js';
import { Layout, ElementIDs } from '../common/Layout.js';
import { GenericObserver, SubjectEvent, Subject, SubjectList } from '../../lab/util/Observe.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { RigidDoublePendulumSim } from './RigidDoublePendulumSim.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Displays the {@link RigidDoublePendulumSim} simulation.
*/
export class RigidDoublePendulumApp extends AbstractApp<RigidDoublePendulumSim> implements Subject, SubjectList {
  protoBob: DisplayShape;
  bob0: DisplayShape;
  bob1: DisplayShape;
  joint0: DisplayConnector;
  joint1: DisplayConnector;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param centered determines which pendulum configuration to make: centered
*    (true) or offset (false)
*/
constructor(elem_ids: ElementIDs, centered: boolean) {
  Util.setErrorHandler();
  const parts = centered ? RigidDoublePendulumSim.makeCentered(0.25 * Math.PI, 0)
        : RigidDoublePendulumSim.makeOffset(0.25 * Math.PI, 0);
  const simRect = new DoubleRect(-2, -2, 2, 2);
  const sim = new RigidDoublePendulumSim(parts);
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/null, /*energySystem=*/sim);

  // This Observer ensures that when initial angles are changed in sim, then clock
  // time is also reset.  This helps with feedback when dragging angle slider,
  // especially if the clock is running.
  new GenericObserver(sim, (evt: SubjectEvent) => {
    if (evt.nameEquals('RESET')) {
      this.clock.setTime(sim.getTime());
    }
  }, 'sync clock time on reset');
  let ds = new DisplayShape();
  ds.setFillStyle('');
  ds.setStrokeStyle('blue');
  ds.setDrawCenterOfMass(true);
  ds.setThickness(3);
  this.protoBob = ds;
  this.bob0 = new DisplayShape(parts.bodies[0], this.protoBob);
  this.displayList.add(this.bob0);
  this.bob1 = new DisplayShape(parts.bodies[1], this.protoBob);
  this.displayList.add(this.bob1);
  this.joint0 = new DisplayConnector(parts.joints[0]);
  this.displayList.add(this.joint0);
  this.joint1 = new DisplayConnector(parts.joints[1]);
  this.displayList.add(this.joint1);

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(RigidDoublePendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(RigidDoublePendulumSim.en.ANGLE_1);
  this.addControl(new SliderControl(pn, -Math.PI, Math.PI, /*multiply=*/false));

  pn = sim.getParameterNumber(RigidDoublePendulumSim.en.ANGLE_2);
  this.addControl(new SliderControl(pn, -Math.PI, Math.PI, /*multiply=*/false));

  pn = sim.getParameterNumber(EnergyInfo.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', bob0: '+this.bob0.toStringShort()
      +', bob1: '+this.bob1.toStringShort()
      +', joint0: '+this.joint0.toStringShort()
      +', joint1: '+this.joint1.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RigidDoublePendulumApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('joint0|joint1|bob1|bob0|protoBob',
      myName+'.');
};

} // end class
