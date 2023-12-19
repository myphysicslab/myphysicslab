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
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CommonControls } from '../common/CommonControls.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DoubleSpringSim } from './DoubleSpringSim.js';
import { ParameterBoolean, ParameterNumber, Subject, SubjectList, SubjectEvent } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';

/** Displays the {@link DoubleSpringSim} simulation.
*/
export class DoubleSpringApp extends AbstractApp<DoubleSpringSim> implements Subject, SubjectList {

  protoWall: DisplayShape;
  protoBlock: DisplayShape;
  protoSpring: DisplaySpring;
  wall1: DisplayShape;
  wall2: DisplayShape;
  spring1: DisplaySpring;
  spring2: DisplaySpring;
  spring3: DisplaySpring;
  block1: DisplayShape;
  block2: DisplayShape;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-4, -7, 12, 7);
  const sim = new DoubleSpringSim(/*thirdSpring=*/false);
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.getSimCanvas().setBackground('black');

  this.protoWall = new DisplayShape();
  this.protoWall.setFillStyle('lightGray');
  this.protoBlock = new DisplayShape();
  this.protoBlock.setFillStyle('#00fc');
  this.protoSpring = new DisplaySpring();
  this.protoSpring.setWidth(0.3);
  this.protoSpring.setColorCompressed('#0c0');
  this.protoSpring.setColorExpanded('#6f6');

  this.wall1 = new DisplayShape(this.simList.getPointMass('wall1'), this.protoWall);
  this.wall2 = new DisplayShape(this.simList.getPointMass('wall2'), this.protoWall);
  this.displayList.add(this.wall1);
  this.displayList.add(this.wall2);
  this.spring1 = new DisplaySpring(this.simList.getSpring('spring1'), this.protoSpring);
  this.spring2 = new DisplaySpring(this.simList.getSpring('spring2'), this.protoSpring);
  this.spring3 = new DisplaySpring(this.simList.getSpring('spring3'), this.protoSpring);
  this.displayList.add(this.spring1);
  this.displayList.add(this.spring2);
  this.displayList.add(this.spring3);
  this.block1 = new DisplayShape(this.simList.getPointMass('block1'), this.protoBlock);
  this.block2 = new DisplayShape(this.simList.getPointMass('block2'), this.protoBlock);
  this.block2.setFillStyle('#ff00ffcc');
  this.displayList.add(this.block1);
  this.displayList.add(this.block2);
  sim.saveInitialState();

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(DoubleSpringSim.en.MASS1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(DoubleSpringSim.en.MASS2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(DoubleSpringSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(DoubleSpringSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(DoubleSpringSim.en.STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 200, /*multiply=*/false));

  let pb = sim.getParameterBoolean(DoubleSpringSim.en.THIRD_SPRING);
  this.addControl(new CheckBoxControl(pb));

  this.addStandardControls();

  const bc = new ButtonControl(DoubleSpringSim.i18n.REST_STATE,
      () => sim.restState());
  this.addControl(bc);

  this.makeEasyScript();
  this.addURLScriptButton();
  this.getParameterBoolean('PAN_ZOOM').setValue(true);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', block1: '+this.block1.toStringShort()
      +', block2: '+this.block2.toStringShort()
      +', spring1: '+this.spring1.toStringShort()
      +', spring2: '+this.spring2.toStringShort()
      +', spring3: '+this.spring3.toStringShort()
      +', wall1: '+this.wall1.toStringShort()
      +', wall2: '+this.wall2.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'DoubleSpringApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('wall1|wall2|block1|block2|spring1|spring2|spring3'
      +'|protoWall|protoBlock|protoSpring', myName+'.');
};

} // end class
Util.defineGlobal('sims$springs$DoubleSpringApp', DoubleSpringApp);
