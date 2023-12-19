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
import { ElementIDs } from '../common/Layout.js';
import { CommonControls } from '../common/CommonControls.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { EnergyInfo } from '../../lab/model/EnergySystem.js';
import { GenericObserver, SubjectEvent, Subject, SubjectList } from '../../lab/util/Observe.js';
import { MoveableDoublePendulumSim } from './MoveableDoublePendulumSim.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterBoolean } from '../../lab/util/Observe.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Displays the {@link MoveableDoublePendulumSim} simulation.
*/
export class MoveableDoublePendulumApp extends AbstractApp<MoveableDoublePendulumSim> implements Subject, SubjectList {
  anchor: DisplayShape;
  rod1: DisplayLine;
  rod2: DisplayLine;
  bob1: DisplayShape;
  bob2: DisplayShape;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-3.3, -3.3, 3.3, 3);
  const sim = new MoveableDoublePendulumSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);

  this.simRun.setTimeStep(0.01);
  sim.setDriveAmplitude(0);
  sim.setDamping(0.05);
  const va = sim.getVarsList();
  va.setValue(0, 0.1);
  va.setValue(2, -0.2);

  let ds = new DisplayShape(this.simList.getPointMass('anchor'));
  ds.setFillStyle('');
  ds.setStrokeStyle('red');
  ds.setThickness(4);
  this.anchor = ds;
  this.displayList.add(this.anchor);
  this.rod1 = new DisplayLine(this.simList.getConcreteLine('rod1'));
  this.displayList.add(this.rod1);
  this.rod2 = new DisplayLine(this.simList.getConcreteLine('rod2'));
  this.displayList.add(this.rod2);
  this.bob1 = new DisplayShape(this.simList.getPointMass('bob1'));
  this.bob1.setFillStyle('blue');
  this.displayList.add(this.bob1);
  this.bob2 = new DisplayShape(this.simList.getPointMass('bob2'));
  this.bob2.setFillStyle('blue');
  this.displayList.add(this.bob2);

  // make observer which will add/remove the spring during mouse drag
  const dragSpring = sim.getDragSpring();
  const dispSpring = new DisplaySpring(dragSpring);
  dispSpring.setWidth(0.2);
  new GenericObserver(this.simList, (evt: SubjectEvent) => {
    if (evt.getValue() == dragSpring) {
      if (evt.nameEquals(SimList.OBJECT_ADDED)) {
        this.displayList.add(dispSpring);
      } else if (evt.nameEquals(SimList.OBJECT_REMOVED)) {
        this.displayList.remove(dispSpring);
      }
    }
  }, 'add/remove spring during mouse drag');

  // Make observer which resets initial conditions when starting to run at time 0.
  // The idea is you can move the pendulum to desired angle while paused at time 0,
  // and then that is saved as initial conditions when you start running.
  new GenericObserver(this.simRun, (evt: SubjectEvent) => {
    if (evt.nameEquals(SimRunner.en.RUNNING)) {
      const bp = evt as ParameterBoolean;
      sim.setRunning(bp.getValue());
      if (bp.getValue() && sim.getTime() == 0) {
        sim.saveInitialState();
      }
    }
  }, 'save initial conditions when starting to run at time 0');

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.LENGTH_1);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.LENGTH_2);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.MASS_1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.MASS_2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.DRIVE_AMPLITUDE);
  this.addControl(new SliderControl(pn, 0, 400, /*multiply=*/false));

  pn = sim.getParameterNumber(MoveableDoublePendulumSim.en.DRIVE_FREQUENCY);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  pn = sim.getParameterNumber(EnergyInfo.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', anchor: '+this.anchor.toStringShort()
      +', bob1: '+this.bob1.toStringShort()
      +', bob2: '+this.bob2.toStringShort()
      +', rod1: '+this.rod1.toStringShort()
      +', rod2: '+this.rod2.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'MoveableDoublePendulumApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('rod1|rod2|anchor|bob1|bob2',
      myName+'.');
};

} // end class
Util.defineGlobal('sims$pendulum$MoveableDoublePendulumApp', MoveableDoublePendulumApp);
