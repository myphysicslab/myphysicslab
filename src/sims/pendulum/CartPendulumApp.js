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

goog.module('myphysicslab.sims.pendulum.CartPendulumApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CartPendulumSim = goog.require('myphysicslab.sims.pendulum.CartPendulumSim');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Displays the {@link CartPendulumSim} simulation.
*/
class CartPendulumApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-3, -4, 3, 2);
  var sim = new CartPendulumSim();
  var advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  this.sim.getVarsList().setValue(0, 1.0);
  sim.initWork();

  /** @type {!ConcreteLine} */
  this.track = new ConcreteLine('track', new Vector(-3, -0.15), new Vector(3, -0.15));
  this.displayList.add(new DisplayLine(this.track).setColor('lightGray')
      .setThickness(1));
  /** @type {!DisplayShape} */
  this.cart = new DisplayShape(this.simList.getPointMass('cart'))
      .setStrokeStyle('').setFillStyle('lightGray');
  this.displayList.add(this.cart);
  /** @type {!DisplayShape} */
  this.bob = new DisplayShape(this.simList.getPointMass('bob'))
      .setStrokeStyle('').setFillStyle('blue');
  this.displayList.add(this.bob);
  /** @type {!DisplayLine} */
  this.rod = new DisplayLine(this.simList.getConcreteLine('rod'));
  this.displayList.add(this.rod);
  /** @type {!DisplaySpring} */
  this.spring = new DisplaySpring(this.simList.getSpring('spring')).setWidth(0.3);
  this.displayList.add(this.spring);
  sim.modifyObjects();

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;

  pn = sim.getParameterNumber(CartPendulumSim.en.GRAVITY);
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

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', cart: '+this.cart.toStringShort()
      +', bob: '+this.bob.toStringShort()
      +', rod: '+this.rod.toStringShort()
      +', spring: '+this.spring.toStringShort()
      +', track: '+this.track.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'CartPendulumApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('rod|cart|bob|spring|track',
      myName+'.');
};

} //end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!CartPendulumApp}
*/
function makeCartPendulumApp(elem_ids) {
  return new CartPendulumApp(elem_ids);
};
goog.exportSymbol('makeCartPendulumApp', makeCartPendulumApp);

exports = CartPendulumApp;
