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
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { DisplayArc } from '../../lab/view/DisplayArc.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterBoolean, ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { PendulumSim } from './PendulumSim.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Util } from '../../lab/util/Util.js';

/** Displays the {@link PendulumSim} simulation.
*/
export class PendulumApp extends AbstractApp<PendulumSim> implements Subject, SubjectList {
  rod: DisplayLine;
  drive: DisplayArc;
  bob: DisplayShape;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-2, -2.2, 2, 1.5);
  const sim = new PendulumSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim);
  this.rod = new DisplayLine(this.simList.getConcreteLine('rod'));
  this.displayList.add(this.rod);
  this.drive = new DisplayArc(this.simList.getArc('drive'));
  this.displayList.add(this.drive);
  this.bob = new DisplayShape(this.simList.getPointMass('bob'));
  this.bob.setFillStyle('blue');
  this.displayList.add(this.bob);
  sim.getVarsList().getVariable(PendulumSim.en.ANGLE).setValue(Math.PI/8);
  sim.modifyObjects();

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(PendulumSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(PendulumSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(PendulumSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(PendulumSim.en.DRIVE_AMPLITUDE);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = sim.getParameterNumber(PendulumSim.en.DRIVE_FREQUENCY);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = sim.getParameterNumber(PendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  const pb = sim.getParameterBoolean(PendulumSim.en.LIMIT_ANGLE);
  this.addControl(new CheckBoxControl(pb));

  this.addStandardControls();

  //change default DrawingMode
  //this.graph.line.setDrawingMode(DrawingMode.DOTS);
  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', bob: '+this.bob.toStringShort()
      +', rod: '+this.rod.toStringShort()
      +', drive: '+this.drive.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'PendulumApp';
};

/** @inheritDoc */
override defineNames(myName: string) {
  super.defineNames(myName);
  this.terminal.addRegex('rod|drive|bob',
      myName+'.');
  this.terminal.addRegex('PendulumSim',
       'sims$pendulum$', /*addToVars=*/false);
};

} // end class
Util.defineGlobal('sims$pendulum$PendulumApp', PendulumApp);
