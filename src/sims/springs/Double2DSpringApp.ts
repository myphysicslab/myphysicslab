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
import { ButtonControl } from '../../lab/controls/ButtonControl.js';
import { CommonControls } from '../common/CommonControls.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { Double2DSpringSim } from './Double2DSpringSim.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { EnergyInfo } from '../../lab/model/EnergySystem.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterBoolean, ParameterNumber, Subject, SubjectList, SubjectEvent } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';

/** Displays the {@link Double2DSpringSim} simulation.
*/
export class Double2DSpringApp extends AbstractApp<Double2DSpringSim> implements Subject, SubjectList {

  protoBob: DisplayShape;
  protoSpring: DisplaySpring;
  topMass: DisplayShape;
  spring1: DisplaySpring;
  spring2: DisplaySpring;
  bob1: DisplayShape;
  bob2: DisplayShape;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new Double2DSpringSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.getSimCanvas().setBackground('black');

  this.protoBob = new DisplayShape();
  this.protoBob.setFillStyle('blue');
  this.protoSpring = new DisplaySpring();
  this.protoSpring.setWidth(0.3);
  this.protoSpring.setColorCompressed('#0c0');
  this.protoSpring.setColorExpanded('#6f6');

  this.topMass = new DisplayShape(this.simList.getPointMass('top'));
  this.topMass.setFillStyle('red');
  this.displayList.add(this.topMass);
  this.spring1 = new DisplaySpring(this.simList.getSpring('spring1'), this.protoSpring);
  this.displayList.add(this.spring1);
  this.spring2 = new DisplaySpring(this.simList.getSpring('spring2'), this.protoSpring);
  this.displayList.add(this.spring2);
  this.bob1 = new DisplayShape(this.simList.getPointMass('bob1'), this.protoBob);
  this.displayList.add(this.bob1);
  this.bob2 = new DisplayShape(this.simList.getPointMass('bob2'), this.protoBob);
  this.displayList.add(this.bob2);

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(Double2DSpringSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 50, /*multiply=*/false));

  pn = sim.getParameterNumber(Double2DSpringSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(Double2DSpringSim.en.MASS1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Double2DSpringSim.en.MASS2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Double2DSpringSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(Double2DSpringSim.en.STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 200, /*multiply=*/false));

  pn = sim.getParameterNumber(EnergyInfo.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  const bc = new ButtonControl(Double2DSpringSim.i18n.REST_STATE,
      () => sim.restState());
  this.addControl(bc);

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', bob1: '+this.bob1.toStringShort()
      +', bob2: '+this.bob2.toStringShort()
      +', spring1: '+this.spring1.toStringShort()
      +', spring2: '+this.spring2.toStringShort()
      +', topMass: '+this.topMass.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'Double2DSpringApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('topMass|bob1|bob2|spring1|spring2|protoBob|protoSpring',
      myName+'.');
};

} // end class
Util.defineGlobal('sims$springs$Double2DSpringApp', Double2DSpringApp);
