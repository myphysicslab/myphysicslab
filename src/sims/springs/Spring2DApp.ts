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
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { EnergyInfo } from '../../lab/model/EnergySystem.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList, SubjectEvent } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { Spring2DSim } from './Spring2DSim.js';
import { Util } from '../../lab/util/Util.js';

/** Displays the {@link Spring2DSim} simulation.
*/
export class Spring2DApp extends AbstractApp<Spring2DSim> implements Subject, SubjectList {

  anchor: DisplayShape;
  bob: DisplayShape;
  spring: DisplaySpring;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new Spring2DSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);

  this.anchor = new DisplayShape(this.simList.getPointMass('anchor'));
  this.anchor.setFillStyle('');
  this.anchor.setStrokeStyle('red');
  this.anchor.setThickness(4);
  this.displayList.add(this.anchor);
  this.bob = new DisplayShape(this.simList.getPointMass('bob'));
  this.bob.setFillStyle('blue');
  this.displayList.add(this.bob);
  this.spring = new DisplaySpring(this.simList.getSpring('spring'));
  this.spring.setWidth(0.3);
  this.displayList.add(this.spring);
  sim.saveInitialState();

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(Spring2DSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(Spring2DSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Spring2DSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(Spring2DSim.en.SPRING_LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(Spring2DSim.en.SPRING_STIFFNESS);
  this.addControl(new SliderControl(pn, 0.1, 100.1, /*multiply=*/true));

  pn = sim.getParameterNumber(EnergyInfo.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  const bc = new ButtonControl(Spring2DSim.i18n.REST_STATE,
      () => sim.restState());
  this.addControl(bc);

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', bob: '+this.bob.toStringShort()
      +', spring: '+this.bob.toStringShort()
      +', anchor: '+this.anchor.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'Spring2DApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('anchor|bob|spring',
      myName+'.');
};

} // end class
Util.defineGlobal('sims$springs$Spring2DApp', Spring2DApp);
