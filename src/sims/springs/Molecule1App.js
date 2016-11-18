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

goog.provide('myphysicslab.sims.springs.Molecule1App');

goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.sims.layout.AbstractApp');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.springs.Molecule1Sim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.layout.AbstractApp;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.layout.CommonControls;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = myphysicslab.lab.view.DisplaySpring;
var DoubleRect = lab.util.DoubleRect;
var Molecule1Sim = sims.springs.Molecule1Sim;
var PointMass = lab.model.PointMass;
var SliderControl = lab.controls.SliderControl;
var Spring = myphysicslab.lab.model.Spring;
var TabLayout = sims.layout.TabLayout;
var UtilityCore = lab.util.UtilityCore;

/**  Molecule1App displays the simulation
{@link myphysicslab.sims.springs.Molecule1Sim Molecule1Sim}.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @extends {AbstractApp}
* @struct
* @export
*/
myphysicslab.sims.springs.Molecule1App = function(elem_ids) {
  UtilityCore.setErrorHandler();
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new Molecule1Sim();
  var advance = new CollisionAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  this.walls = new DisplayShape(this.simList.getPointMass('walls'))
      .setFillStyle('').setStrokeStyle('gray');
  this.displayList.add(this.walls);
  this.spring = new DisplaySpring(this.simList.getSpring('spring'))
      .setWidth(0.3).setThickness(3);
  this.displayList.add(this.spring);
  this.atom1 = new DisplayShape(this.simList.getPointMass('atom1'))
      .setFillStyle('blue');
  this.displayList.add(this.atom1);
  this.atom2 = new DisplayShape(this.simList.getPointMass('atom2'))
      .setFillStyle('red');
  this.displayList.add(this.atom2);

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
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

  this.makeScriptParser();
  this.addURLScriptButton();
};
var Molecule1App = myphysicslab.sims.springs.Molecule1App;
goog.inherits(Molecule1App, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  Molecule1App.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', atom1: '+this.atom1.toStringShort()
        +', atom2: '+this.atom2.toStringShort()
        +', spring: '+this.spring.toStringShort()
        +', walls: '+this.walls.toStringShort()
        + Molecule1App.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
Molecule1App.prototype.getClassName = function() {
  return 'Molecule1App';
};

/** @inheritDoc */
Molecule1App.prototype.defineNames = function(myName) {
  Molecule1App.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('walls|atom1|atom2|spring',
      myName);
};

}); // goog.scope
