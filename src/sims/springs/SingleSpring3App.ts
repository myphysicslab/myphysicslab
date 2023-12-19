// Copyright 2023 Erik Neumann.  All Rights Reserved.
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
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { FunctionVariable } from '../../lab/model/FunctionVariable.js';
import { Layout, ElementIDs } from '../common/Layout.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SingleSpringSim } from './SingleSpringSim.js';
import { Spring } from '../../lab/model/Spring.js';
import { TabLayout3 } from '../common/TabLayout3.js';
import { Util } from '../../lab/util/Util.js';

/** Displays the {@link SingleSpringSim} simulation.

The difference between this and {@link sims/springs/SingleSpringApp.SingleSpringApp} is
that this uses {@link TabLayout3} for layout.
*/
export class SingleSpring3App extends AbstractApp<SingleSpringSim> implements Subject, SubjectList {
  block: DisplayShape;
  spring: DisplaySpring;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param opt_name name of this as a Subject
*/
constructor(elem_ids: ElementIDs, opt_name?: string) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-3, -2, 3, 2);
  const sim = new SingleSpringSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim, opt_name);

  this.block = new DisplayShape(this.simList.getPointMass('block'));
  this.block.setFillStyle('blue');
  this.displayList.add(this.block);
  this.spring = new DisplaySpring(this.simList.getSpring('spring'));
  this.spring.setWidth(0.4);
  this.spring.setThickness(6);
  this.displayList.add(this.spring);

  // Demo of adding an FunctionVariable.
  const va = sim.getVarsList();
  va.addVariable(new FunctionVariable(va, 'sin_time', 'sin(time)',
      () => Math.sin(sim.getTime()) ));

  this.addPlaybackControls();

  let pn = sim.getParameterNumber(SingleSpringSim.en.MASS);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(SingleSpringSim.en.DAMPING);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(SingleSpringSim.en.SPRING_STIFFNESS);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(SingleSpringSim.en.SPRING_LENGTH);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(SingleSpringSim.en.FIXED_POINT);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', block: '+this.block.toStringShort()
      +', spring: '+this.spring.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'SingleSpring3App';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('block|spring',
      myName+'.');
};

/** @inheritDoc */
override makeLayout(elem_ids: ElementIDs): Layout {
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  const canvasWidth = 800;
  const canvasHeight = Math.round(canvasWidth * this.simRect.getHeight() /
      this.simRect.getWidth());
  return new TabLayout3(elem_ids, canvasWidth, canvasHeight);
};

} // end class
Util.defineGlobal('sims$springs$SingleSpring3App', SingleSpring3App);
