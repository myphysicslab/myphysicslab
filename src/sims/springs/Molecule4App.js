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

goog.module('myphysicslab.sims.springs.Molecule4App');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const FunctionVariable = goog.require('myphysicslab.lab.model.FunctionVariable');
const Molecule4Sim = goog.require('myphysicslab.sims.springs.Molecule4Sim');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const SimRunner = goog.require('myphysicslab.lab.app.SimRunner');
const SpringNonLinear = goog.require('myphysicslab.sims.springs.SpringNonLinear');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');

/** Displays the {@link Molecule4Sim} simulation which is an experimental version of
the Molecule3 simulation. This uses a non-linear spring force. Note that the spring
length controls will have no effect.
*/
class Molecule4App extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {number} numAtoms number of atoms to make, from 2 to 6
*/
constructor(elem_ids, numAtoms) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-8, -8, 8, 8);
  var sim = new Molecule4Sim(numAtoms);
  // cludge: this makes the potential energy not so large.
  sim.setPotentialEnergy(5 - 0.38559373);
  var advance = new CollisionAdvance(sim);

  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim);

  /** @type {number} */
  this.numAtoms = numAtoms;
  // The SpringNonLinear is very "stiff", and sim is unstable with default
  // timestep=0.025, so set it to be smaller.
  this.simRun.setTimeStep(0.01);
  this.layout.simCanvas.setBackground('black');

  /** @type {!DisplaySpring} */
  this.protoSpring = new DisplaySpring().setWidth(0.3).setColorCompressed('#0c0')
      .setColorExpanded('green').setThickness(3);
  /** @type {!DisplaySpring} */
  this.protoSpecialSpring = new DisplaySpring().setWidth(0.3).setColorCompressed('#c00')
      .setColorExpanded('red').setThickness(3);

  /** @type {!DisplayShape} */
  this.walls = new DisplayShape(this.simList.getPointMass('walls'))
      .setFillStyle('').setStrokeStyle('gray');
  this.displayList.add(this.walls);
  goog.array.forEach(this.simList.toArray(), function(simObj) {
    if (simObj instanceof SpringNonLinear) {
      var s = /** @type {!SpringNonLinear} */(simObj);
      var proto = s.getName().match(/^SPECIAL/) ? this.protoSpecialSpring :
          this.protoSpring;
      this.displayList.add(new DisplaySpring(s, proto));
    }
  }, this);
  /** @type {!Array<!DisplayShape>} */
  this.atoms = [];
  var cm = ['red', 'blue', 'magenta', 'orange', 'gray', 'green'];
  for (var i=0; i<this.numAtoms; i++) {
    var atom = new DisplayShape(this.simList.getPointMass('atom'+(i+1)))
        .setFillStyle(cm[i]);
    this.atoms.push(atom);
    this.displayList.add(atom);
  }
  // add variables for kinetic energy of atoms 1, 2, 3
  var va = sim.getVarsList();
  var atom1 = sim.getSimList().getPointMass('atom1');
  va.addVariable(new FunctionVariable(va, 'ke1', 'ke1', function() {
    return atom1.getKineticEnergy();
  }));
  va.addVariable(new FunctionVariable(va, 'ke1 pct', 'ke1 pct', function() {
    return 100*atom1.getKineticEnergy()/sim.getEnergyInfo().getTotalEnergy();
  }));
  var atom2 = sim.getSimList().getPointMass('atom2');
  va.addVariable(new FunctionVariable(va, 'ke2', 'ke2', function() {
    return atom2.getKineticEnergy();
  }));
  va.addVariable(new FunctionVariable(va, 'ke2 pct', 'ke2 pct', function() {
    return 100*atom2.getKineticEnergy()/sim.getEnergyInfo().getTotalEnergy();
  }));
  if (numAtoms > 2) {
    var atom3 = sim.getSimList().getPointMass('atom3');
    va.addVariable(new FunctionVariable(va, 'ke3', 'ke3', function() {
      return atom3.getKineticEnergy();
    }));
    va.addVariable(new FunctionVariable(va, 'ke3 pct', 'ke3 pct', function() {
      return 100*atom3.getKineticEnergy()/sim.getEnergyInfo().getTotalEnergy();
    }));
  }

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(Molecule4Sim.en.GRAVITY);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(Molecule4Sim.en.DAMPING);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(Molecule4Sim.en.ELASTICITY);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(Molecule4Sim.en.MASS);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(Molecule4Sim.en.MASS_SPECIAL);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(Molecule4Sim.en.LENGTH);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(Molecule4Sim.en.LENGTH_SPECIAL);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(Molecule4Sim.en.STIFFNESS);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(Molecule4Sim.en.STIFFNESS_SPECIAL);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();

};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', atoms: '+this.atoms.length
      +', walls: '+this.walls.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'Molecule4App';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('walls|atoms|protoSpecialSpring|protoSpring',
      myName+'.');
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @param {number} numAtoms number of atoms to make, from 2 to 6
* @return {!Molecule4App}
*/
function makeMolecule4App(elem_ids, numAtoms) {
  return new Molecule4App(elem_ids, numAtoms);
};
goog.exportSymbol('makeMolecule4App', makeMolecule4App);

exports = Molecule4App;
