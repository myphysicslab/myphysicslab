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
import { CartPendulumSim } from './CartPendulumSim.js';
import { CommonControls } from '../common/CommonControls.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Displays the {@link CartPendulumSim} simulation.
*/
export class CartPendulumApp extends AbstractApp<CartPendulumSim> implements Subject, SubjectList {
  track: ConcreteLine;
  cart: DisplayShape;
  bob: DisplayShape;
  rod: DisplayLine;
  spring: DisplaySpring;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-3, -4, 3, 2);
  const sim = new CartPendulumSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  this.sim.getVarsList().setValue(0, 1.0);
  sim.initWork();

  this.track = new ConcreteLine('track', new Vector(-3, -0.15), new Vector(3, -0.15));
  let dl = new DisplayLine(this.track).setColor('lightGray');
  dl.setThickness(1);
  this.displayList.add(dl);
  this.cart = new DisplayShape(this.simList.getPointMass('cart'));
  this.cart.setStrokeStyle('');
  this.cart.setFillStyle('lightGray');
  this.displayList.add(this.cart);
  this.bob = new DisplayShape(this.simList.getPointMass('bob'));
  this.bob.setStrokeStyle('');
  this.bob.setFillStyle('blue');
  this.displayList.add(this.bob);
  this.rod = new DisplayLine(this.simList.getConcreteLine('rod'));
  this.displayList.add(this.rod);
  this.spring = new DisplaySpring(this.simList.getSpring('spring'));
  this.spring.setWidth(0.3);
  this.displayList.add(this.spring);
  sim.modifyObjects();

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(CartPendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(CartPendulumSim.en.CART_MASS);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(CartPendulumSim.en.PENDULUM_MASS);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(CartPendulumSim.en.CART_DAMPING);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(CartPendulumSim.en.PENDULUM_DAMPING);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(CartPendulumSim.en.PENDULUM_LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(CartPendulumSim.en.SPRING_STIFFNESS);
  this.addControl(new SliderControl(pn, 0.1, 100.1, /*multiply=*/true));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', cart: '+this.cart.toStringShort()
      +', bob: '+this.bob.toStringShort()
      +', rod: '+this.rod.toStringShort()
      +', spring: '+this.spring.toStringShort()
      +', track: '+this.track.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'CartPendulumApp';
};

/** @inheritDoc */
override defineNames(myName: string) {
  super.defineNames(myName);
  this.terminal.addRegex('rod|cart|bob|spring|track',
      myName+'.');
};

} // end class
Util.defineGlobal('sims$pendulum$CartPendulumApp', CartPendulumApp);
