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
import { DangleStickSim } from './DangleStickSim.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList, SubjectEvent } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';

/** Displays the {@link DangleStickSim} simulation.
*/
export class DangleStickApp extends AbstractApp<DangleStickSim> implements Subject, SubjectList {

  protoMass: DisplayShape;
  stick: DisplayLine;
  bob1: DisplayShape;
  bob2: DisplayShape;
  spring: DisplaySpring;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-4, -4, 4, 2);
  const sim = new DangleStickSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/null);

  this.protoMass = new DisplayShape();
  this.protoMass.setFillStyle('blue');

  this.stick = new DisplayLine(this.simList.getConcreteLine('stick'));
  this.displayList.add(this.stick);
  this.bob1 = new DisplayShape(this.simList.getPointMass('bob1'), this.protoMass);
  this.displayList.add(this.bob1);
  this.bob2 = new DisplayShape(this.simList.getPointMass('bob2'),this.protoMass);
  this.displayList.add(this.bob2);
  this.spring = new DisplaySpring(this.simList.getSpring('spring'));
  this.spring.setWidth(0.3);
  this.displayList.add(this.spring);

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(DangleStickSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(DangleStickSim.en.MASS1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(DangleStickSim.en.MASS2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(DangleStickSim.en.STICK_LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(DangleStickSim.en.SPRING_REST_LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(DangleStickSim.en.SPRING_STIFFNESS);
  this.addControl(new SliderControl(pn, 0.1, 100.1, /*multiply=*/true));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', bob1: '+this.bob1.toStringShort()
      +', bob2: '+this.bob2.toStringShort()
      +', stick: '+this.stick.toStringShort()
      +', spring: '+this.spring.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'DangleStickApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('stick|bob1|bob2|spring|protoMass',
      myName+'.');
};

} // end class
Util.defineGlobal('sims$springs$DangleStickApp', DangleStickApp);
