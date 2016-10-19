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

goog.provide('myphysicslab.sims.springs.Molecule3App');

goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.sims.layout.AbstractApp');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.springs.Molecule3Sim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.layout.AbstractApp;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.layout.CommonControls;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = myphysicslab.lab.view.DisplaySpring;
var DoubleRect = lab.util.DoubleRect;
var Molecule3Sim = sims.springs.Molecule3Sim;
var ParameterNumber = lab.util.ParameterNumber;
var PointMass = lab.model.PointMass;
var SliderControl = lab.controls.SliderControl;
var Spring = myphysicslab.lab.model.Spring;
var TabLayout = sims.layout.TabLayout;
var UtilityCore = lab.util.UtilityCore;

/**  Molecule3App displays the simulation
{@link myphysicslab.sims.springs.Molecule3Sim Molecule3Sim}.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {number} numAtoms number of atoms to make, from 2 to 6
* @constructor
* @final
* @extends {AbstractApp}
* @struct
* @export
*/
myphysicslab.sims.springs.Molecule3App = function(elem_ids, numAtoms) {
  UtilityCore.setErrorHandler();
  /** @type {number} */
  this.numAtoms = numAtoms;
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new Molecule3Sim(this.numAtoms);
  var advance = new CollisionAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  //DisplayShape.nameFont = '10pt sans-serif';
  DisplayShape.drawCenterOfMass = false;
  DisplayShape.drawDragPoints = false;
  DisplayShape.fillStyle = '';
  DisplayShape.strokeStyle = 'gray';
  /** @type {!lab.view.DisplayShape} */
  this.walls = new DisplayShape(this.simList.getPointMass('walls'));
  this.displayList.add(this.walls);
  /** @type {!Array<!lab.view.DisplayShape>} */
  this.atoms = [];
  var cm = ['red', 'blue', 'magenta', 'orange', 'gray', 'green'];
  for (var i=0; i<this.numAtoms; i++) {
    DisplayShape.fillStyle = cm[i];
    DisplayShape.strokeStyle = '';
    DisplayShape.nameFont = ''; //10pt sans-serif";
    /** @type {!lab.view.DisplayShape} */
    var atom = new DisplayShape(this.simList.getPointMass('atom'+(i+1)));
    this.atoms.push(atom);
    this.displayList.add(atom);
  }
  DisplaySpring.width = 0.3;
  goog.array.forEach(this.simList.toArray(), function(simObj) {
    if (simObj instanceof Spring) {
      var s = /** @type {!Spring} */(simObj);
      var special = s.getName().match(/^SPECIAL/);
      DisplaySpring.colorCompressed = special ? '#c00' : '#0c0';
      DisplaySpring.colorExpanded = special ? 'red' : 'green';
      this.displayList.add(new DisplaySpring(s));
    }
  }, this);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(Molecule3Sim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(Molecule3Sim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(Molecule3Sim.en.ELASTICITY);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(Molecule3Sim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Molecule3Sim.en.MASS_SPECIAL);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Molecule3Sim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(Molecule3Sim.en.LENGTH_SPECIAL);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(Molecule3Sim.en.STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  pn = sim.getParameterNumber(Molecule3Sim.en.STIFFNESS_SPECIAL);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.addStandardControls();

  this.makeScriptParser();
  this.addURLScriptButton();
};
var Molecule3App = myphysicslab.sims.springs.Molecule3App;
goog.inherits(Molecule3App, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  Molecule3App.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', atoms: '+this.atoms.length
        +', walls: '+this.walls.toStringShort()
        + Molecule3App.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
Molecule3App.prototype.getClassName = function() {
  return 'Molecule3App';
};

/** @inheritDoc */
Molecule3App.prototype.defineNames = function(myName) {
  Molecule3App.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('walls|atoms',
      myName);
};

}); // goog.scope
