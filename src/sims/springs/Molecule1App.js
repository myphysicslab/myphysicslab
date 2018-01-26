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

goog.module('myphysicslab.sims.springs.Molecule1App');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Molecule1Sim = goog.require('myphysicslab.sims.springs.Molecule1Sim');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the {@link Molecule1Sim} simulation.
*/
class Molecule1App extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new Molecule1Sim();
  var advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.simCanvas.setBackground('white');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);

  /** @type {!DisplayShape} */
  this.walls = new DisplayShape(this.simList.getPointMass('walls'))
      .setFillStyle('').setStrokeStyle('gray');
  this.displayList.add(this.walls);
  /** @type {!DisplaySpring} */
  this.spring = new DisplaySpring(this.simList.getSpring('spring'))
      .setWidth(0.3).setThickness(3);
  this.displayList.add(this.spring);
  /** @type {!DisplayShape} */
  this.atom1 = new DisplayShape(this.simList.getPointMass('atom1'))
      .setFillStyle('blue');
  this.displayList.add(this.atom1);
  /** @type {!DisplayShape} */
  this.atom2 = new DisplayShape(this.simList.getPointMass('atom2'))
      .setFillStyle('red');
  this.displayList.add(this.atom2);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(Molecule1Sim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(Molecule1Sim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(Molecule1Sim.en.ELASTICITY);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(Molecule1Sim.en.MASS1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Molecule1Sim.en.MASS2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Molecule1Sim.en.SPRING_LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(Molecule1Sim.en.SPRING_STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', atom1: '+this.atom1.toStringShort()
      +', atom2: '+this.atom2.toStringShort()
      +', spring: '+this.spring.toStringShort()
      +', walls: '+this.walls.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'Molecule1App';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('walls|atom1|atom2|spring',
      myName+'.');
};

} //end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!Molecule1App}
*/
function makeMolecule1App(elem_ids) {
  return new Molecule1App(elem_ids);
};
goog.exportSymbol('makeMolecule1App', makeMolecule1App);

exports = Molecule1App;
