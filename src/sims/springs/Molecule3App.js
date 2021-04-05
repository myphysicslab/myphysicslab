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

goog.module('myphysicslab.sims.springs.Molecule3App');

const asserts = goog.require('goog.asserts');
const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const Molecule3Sim = goog.require('myphysicslab.sims.springs.Molecule3Sim');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const SimRunner = goog.require('myphysicslab.lab.app.SimRunner');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Displays the {@link Molecule3Sim} simulation.

* @implements {Observer}
*/
class Molecule3App extends AbstractApp {
/**
* @param {!Object} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {number} numAtoms number of atoms to make, from 2 to 6
*/
constructor(elem_ids, numAtoms) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new Molecule3Sim();
  const advance = new CollisionAdvance(sim);

  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim);

  /** @type {number} */
  this.numAtoms_ = numAtoms;
  /** @type {!Molecule3Sim} */
  this.sim_ = sim;

  this.layout.getSimCanvas().setBackground('black');

  /** @type {!DisplaySpring} */
  this.protoSpring = new DisplaySpring().setWidth(0.3).setColorCompressed('#0c0')
      .setColorExpanded('green').setThickness(3);
  /** @type {!DisplaySpring} */
  this.protoSpecialSpring = new DisplaySpring().setWidth(0.3).setColorCompressed('#c00')
      .setColorExpanded('red').setThickness(3);

  // The observe() method will make DisplayObjects in response to seeing SimObjects
  // being added to the SimList.  Important that no SimObjects were added prior.
  // Except for the walls.
  asserts.assert(this.simList.length() == 1);
  this.simList.addObserver(this);
  this.addBody(this.sim_.getWalls());

  /**
  * @type {!RandomLCG}
  * @private
  */
  this.random_ = new RandomLCG(78597834798);
  /** Mass-Spring-Mass matrix says how springs & masses are connected
  * each row corresponds to a spring, with indices of masses connected to that spring.
  * @type {!Array<!Array<number>>}
  * @private
  */
  this.msm_ = [];
  /** Special Group of springs. These are indices in sim.getSprings() array.
  * @type {!Array<number>}
  * @private
  */
  this.sg_ = [];
  /** Non-Special Group of springs. These are indices in sim.getSprings() array.
  * @type {!Array<number>}
  * @private
  */
  this.nsg_ = [];
  this.config();

  /** @type {!ParameterNumber} */
  let pn;

  this.addPlaybackControls();
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.NUM_ATOMS,
      Molecule3App.i18n.NUM_ATOMS,
      () => this.getNumAtoms(), a => this.setNumAtoms(a)));
  this.addControl(new SliderControl(pn, 1, 6, /*multiply=*/false, 5));

  pn = this.sim_.getParameterNumber(Molecule3Sim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = this.sim_.getParameterNumber(Molecule3Sim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.sim_.getParameterNumber(Molecule3Sim.en.ELASTICITY);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  this.addStandardControls();

  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.MASS,
      Molecule3App.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.MASS_SPECIAL,
      Molecule3App.i18n.MASS_SPECIAL,
      () => this.getMassSpecial(), a => this.setMassSpecial(a)));
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.LENGTH,
      Molecule3App.i18n.LENGTH,
      () => this.getLength(), a => this.setLength(a)));
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.LENGTH_SPECIAL,
      Molecule3App.i18n.LENGTH_SPECIAL,
      () => this.getLengthSpecial(), a => this.setLengthSpecial(a)));
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.STIFFNESS,
      Molecule3App.i18n.STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a)));
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.STIFFNESS_SPECIAL,
      Molecule3App.i18n.STIFFNESS_SPECIAL,
      () => this.getStiffnessSpecial(),
      a => this.setStiffnessSpecial(a)));
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.makeEasyScript();
  this.addURLScriptButton();

  this.graph.line.setXVariable(Molecule3Sim.START_VAR);
  this.graph.line.setYVariable(Molecule3Sim.START_VAR + 1);
  this.timeGraph.line1.setYVariable(1);
  this.timeGraph.line2.setYVariable(2);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      + super.toString();
};

/** @override */
getClassName() {
  return 'Molecule3App';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('protoSpecialSpring|protoSpring', myName+'.');
};

/**
@param {!SimObject} obj
@private
*/
addBody(obj) {
  if (this.displayList.find(obj) != null) {
    // we already have a DisplayObject for this SimObject, don't add a new one.
    return;
  }
  if (obj instanceof PointMass) {
    const pm = /** @type {!PointMass} */(obj);
    if (pm.getName().match(/^WALL/)) {
      const walls = new DisplayShape(pm).setFillStyle('').setStrokeStyle('gray');
      this.displayList.add(walls);
    } else {
      let cm = 'black';
      switch (pm.getName()) {
        case 'ATOM1': cm = 'red'; break;
        case 'ATOM2': cm = 'blue'; break;
        case 'ATOM3': cm = 'magenta'; break;
        case 'ATOM4': cm = 'orange'; break;
        case 'ATOM5': cm = 'gray'; break;
        case 'ATOM6': cm = 'green'; break;
        default: cm = 'pink';
      }
      const atom = new DisplayShape(pm).setFillStyle(cm);
      this.displayList.add(atom);
    }
  } else if (obj instanceof Spring) {
    const s = /** @type {!Spring} */(obj);
    const proto = s.getName().match(/^SPECIAL/) ? this.protoSpecialSpring :
        this.protoSpring;
    this.displayList.add(new DisplaySpring(s, proto));
  }
};

/** @override */
observe(event) {
  if (event.getSubject() == this.simList) {
    const obj = /** @type {!SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      const d = this.displayList.find(obj);
      if (d != null) {
        this.displayList.remove(d);
      }
    }
  }
};

/**
* @return {undefined}
* @private
*/
config()  {
  const numAtoms = this.numAtoms_;
  if (numAtoms < 1 || numAtoms > 6) {
    throw 'too many atoms '+numAtoms;
  }
  this.sim_.cleanSlate();
  // Mass-Spring-Mass matrix says how springs & masses are connected
  // each row corresponds to a spring, with indices of masses connected to that spring.
  this.msm_ = Molecule3App.getMSM(numAtoms);
  // Special Group of springs. These are indices in springs_ array.
  this.sg_ = Molecule3App.getSG(numAtoms);
  // Non-Special Group of springs. These are indices in springs_ array.
  this.nsg_ = Molecule3App.getNSG(this.msm_.length, this.sg_);
  for (let i=0; i<numAtoms; i++) {
    const atom = PointMass.makeCircle(0.5, 'atom'+(i+1)).setMass(0.5);
    this.sim_.addAtom(atom);
  }
  const atoms = this.sim_.getAtoms();
  for (let i=0; i<this.msm_.length; i++) {
    const special = this.sg_.includes(i);
    const name = (special ? 'special ' : '') + 'spring '+i;
    const spring = new Spring(name,
      atoms[this.msm_[i][0]], Vector.ORIGIN,
      atoms[this.msm_[i][1]], Vector.ORIGIN,
      /*restLength=*/3.0, /*stiffness=*/6.0);
    spring.setDamping(0);
    this.sim_.addSpring(spring);
  }
  this.initialPositions(numAtoms);
  this.sim_.saveInitialState();
  this.sim_.modifyObjects();
  if (this.easyScript) {
    this.easyScript.update();
  }
};

/** Returns Mass-Spring-Mass matrix which says how springs & masses are connected.
* Each row corresponds to a spring; with indices of masses connected to that spring.
* @param {number} numAtoms  number of atoms in molecule
* @return {!Array<!Array<number>>}
* @private
*/
static getMSM(numAtoms) {
  switch (numAtoms) {
    case 1: return [];
    case 2: return [[0,1]];
    case 3: return [[0,1],[1,2],[2,0]];
    case 4: return [[0,1],[1,2],[2,3],[3,0],[1,3],[0,2]];
    case 5: return [[0,1],[1,2],[2,3],[3,4],[4,0],[4,2],[4,1],
                        [0,3],[1,3],[0,2]];
    case 6: return [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,2],[2,4],
                       [4,0],[1,3],[3,5],[5,1],[0,3],[1,4],[2,5]];
  }
  throw '';
};

/** Returns Special Groups of springs, these are indices into msm[].
* @param {number} numAtoms  number of atoms in molecule
* @return {!Array<number>}
* @private
*/
static getSG(numAtoms) {
  switch (numAtoms) {
    case 1: return [];
    case 2: return [];
    case 3: return [0];
    case 4: return [0,3,5];
    case 5: return [0,4,7,9];
    case 6: return [12,13,14];
  }
  throw '';
};

/** Returns Non-Special Groups of springs, these are indices into msm[].
* @param {number} num_springs  number of springs in molecule
* @param {!Array<number>} sg the special group
* @return {!Array<number>}
* @private
*/
static getNSG(num_springs, sg) {
  const nsg = [];
  for (let i=0; i<num_springs; i++) {
    if (!sg.includes(i)) {
      nsg.push(i);
    }
  }
  return nsg;
};

/** Sets initial position of atoms.
* @param {number} numAtoms
* @return {undefined}
* @private
*/
initialPositions(numAtoms)  {
  const vars = this.sim_.getVarsList().getValues();
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11
  //      time KE  PE  TE  U1x U1y V1x V1y U2x U2y V2x V2y
  // arrange all masses around a circle
  const r = 1.0; // radius
  for (let i=0; i<numAtoms; i++) {
    const idx = Molecule3Sim.START_VAR + 4*i;
    vars[idx + 0] = r * Math.cos(i*2*Math.PI/numAtoms);
    vars[idx + 1] = r * Math.sin(i*2*Math.PI/numAtoms);
  }
  this.sim_.getVarsList().setValues(vars);
  /*  rotating star for 4 masses
  const v = 3;  // velocity
  const l = 2;  // length of springs
  // ball 1 at 90 degrees, vel=(-v,0)
  vars[5] = l;
  vars[6] = -v;
  // ball 2 at -30 degrees
  vars[0 + 2*4] = l*Math.cos(Math.PI/6);
  vars[1 + 2*4] = -l*Math.sin(Math.PI/6);
  vars[2 + 2*4] = v*Math.cos(Math.PI/3);
  vars[3 + 2*4] = v*Math.sin(Math.PI/3);
  vars[0 + 3*4] = -l*Math.cos(Math.PI/6);
  vars[1 + 3*4] = -l*Math.sin(Math.PI/6);
  vars[2 + 3*4] = v*Math.cos(Math.PI/3);
  vars[3 + 3*4] = -v*Math.sin(Math.PI/3);
  */
};

/** Return number of atoms
@return {number} number of atoms
*/
getNumAtoms() {
  return this.numAtoms_;
};

/** Set number of atoms
@param {number} value number of atoms
*/
setNumAtoms(value) {
  if (value < 1 || value > 6) {
    throw 'too many atoms '+value;
  }
  this.numAtoms_ = value;
  this.config();
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(1, 2, 3, 4, 5, 6);
  this.broadcastParameter(Molecule3App.en.NUM_ATOMS);
};

/** Return mass of atoms
@return {number} mass of atoms
*/
getMass() {
  return (this.numAtoms_ > 1) ? this.sim_.getAtoms()[1].getMass() : 0;
};

/** Set mass of atoms
@param {number} value mass of atoms
*/
setMass(value) {
  this.sim_.getAtoms().forEach((atom, idx) => {
    if (idx > 0) {
      atom.setMass(value);
    }
  });
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(1, 2, 3, 4, 5, 6);
  this.broadcastParameter(Molecule3App.en.MASS);
};

/** Return mass of special atom
@return {number} mass of special atom
*/
getMassSpecial() {
  return this.sim_.getAtoms()[0].getMass();
};

/** Set mass of special atom
@param {number} value mass of special atom
*/
setMassSpecial(value) {
  this.sim_.getAtoms()[0].setMass(value);
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(1, 2, 3, 4, 5, 6);
  this.broadcastParameter(Molecule3App.en.MASS_SPECIAL);
};

/** Return spring resting length
@return {number} spring resting length
*/
getLength() {
  return (this.nsg_.length>0) ?
      this.sim_.getSprings()[this.nsg_[0]].getRestLength() : 0.0;
};

/** Set spring resting length
@param {number} value spring resting length
*/
setLength(value) {
  for (let i=0; i<this.nsg_.length; i++) {
    this.sim_.getSprings()[this.nsg_[i]].setRestLength(value);
  }
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(2, 3, 4, 5, 6);
  this.broadcastParameter(Molecule3App.en.LENGTH);
};

/** Return spring resting length
@return {number} spring resting length
*/
getLengthSpecial() {
  return (this.sg_.length>0) ?
      this.sim_.getSprings()[this.sg_[0]].getRestLength() : 0;
};

/** Set spring resting length
@param {number} value spring resting length
*/
setLengthSpecial(value) {
  for (let i=0; i<this.sg_.length; i++) {
    this.sim_.getSprings()[this.sg_[i]].setRestLength(value);
  }
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(2, 3, 4, 5, 6);
  this.broadcastParameter(Molecule3App.en.LENGTH_SPECIAL);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
getStiffness() {
  return (this.nsg_.length>0) ?
    this.sim_.getSprings()[this.nsg_[0]].getStiffness() : 0;
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
setStiffness(value) {
  for (let i=0; i<this.nsg_.length; i++) {
    this.sim_.getSprings()[this.nsg_[i]].setStiffness(value);
  }
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(2, 3, 4, 5, 6);
  this.broadcastParameter(Molecule3App.en.STIFFNESS);
};

/** Returns spring stiffness of special group of springs
@return {number} spring stiffness of special group of springs
*/
getStiffnessSpecial() {
  return (this.sg_.length>0) ? this.sim_.getSprings()[this.sg_[0]].getStiffness() : 0.0;
};

/** Sets spring stiffness of special group of springs
@param {number} value spring stiffness of special group of springs
*/
setStiffnessSpecial(value) {
  for (let i=0; i<this.sg_.length; i++) {
    this.sim_.getSprings()[this.sg_[i]].setStiffness(value);
  }
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(2, 3, 4, 5, 6);
  this.broadcastParameter(Molecule3App.en.STIFFNESS_SPECIAL);
};

} // end class

/** Set of internationalized strings.
@typedef {{
  MASS: string,
  MASS_SPECIAL: string,
  LENGTH: string,
  LENGTH_SPECIAL: string,
  STIFFNESS: string,
  STIFFNESS_SPECIAL: string,
  NUM_ATOMS: string
  }}
*/
Molecule3App.i18n_strings;

/**
@type {Molecule3App.i18n_strings}
*/
Molecule3App.en = {
  MASS: 'mass',
  MASS_SPECIAL: 'red mass',
  LENGTH: 'spring length',
  LENGTH_SPECIAL: 'red spring length',
  STIFFNESS: 'spring stiffness',
  STIFFNESS_SPECIAL: 'red spring stiffness',
  NUM_ATOMS: 'number of atoms'
};

/**
@private
@type {Molecule3App.i18n_strings}
*/
Molecule3App.de_strings = {
  MASS: 'Masse',
  MASS_SPECIAL: 'rote Masse',
  LENGTH: 'Federlänge',
  LENGTH_SPECIAL: 'rote Federlänge',
  STIFFNESS: 'Federsteifheit',
  STIFFNESS_SPECIAL: 'rote Federsteifheit',
  NUM_ATOMS: 'zahl Masse'
};

/** Set of internationalized strings.
@type {Molecule3App.i18n_strings}
*/
Molecule3App.i18n = goog.LOCALE === 'de' ? Molecule3App.de_strings :
    Molecule3App.en;

/**
* @param {!Object} elem_ids
* @param {number} numAtoms number of atoms to make, from 2 to 6
* @return {!Molecule3App}
*/
function makeMolecule3App(elem_ids, numAtoms) {
  return new Molecule3App(elem_ids, numAtoms);
};
goog.exportSymbol('makeMolecule3App', makeMolecule3App);

exports = Molecule3App;
