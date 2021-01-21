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

goog.module('myphysicslab.sims.springs.Molecule5App');

const array = goog.require('goog.array');
const asserts = goog.require('goog.asserts');
const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DisplayText = goog.require('myphysicslab.lab.view.DisplayText');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const FunctionVariable = goog.require('myphysicslab.lab.model.FunctionVariable');
const GenericMemo = goog.require('myphysicslab.lab.util.GenericMemo');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const Molecule3Sim = goog.require('myphysicslab.sims.springs.Molecule3Sim');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const SimRunner = goog.require('myphysicslab.lab.app.SimRunner');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const SpringNonLinear = goog.require('myphysicslab.sims.springs.SpringNonLinear');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Displays the {@link Molecule3Sim} simulation.

* @implements {Observer}
*/
class Molecule5App extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
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

  this.layout.simCanvas.setBackground('black');
  this.simRun.setTimeStep(0.01);

  /** @type {!DisplaySpring} */
  this.protoSpring = new DisplaySpring().setWidth(0.15).setColorCompressed('#0c0')
      .setColorExpanded('green').setThickness(3);

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
  /** Whether atom names should be displayed.
  * @type {boolean}
  * @private
  */
  this.showNames_ = false;
  /** Whether springs should be displayed.
  * @type {boolean}
  * @private
  */
  this.showSprings_ = true;
  /** Whether to create linear or non-linear springs
  * @type {boolean}
  * @private
  */
  this.nonLinearSprings_ = true;
  /** atoms with KE percentage (kinetic energy) above this amount are brightly colored.
  * @type {number}
  * @private
  */
  this.ke_high_pct_ = 15;
  /** whether to specially color atoms with high KE percentage.
  * @type {boolean}
  * @private
  */
  this.show_ke_high_ = true;
  /** array of recent kinetic energy samples.
  * @type {!Array<number>}
  * @private
  */
  this.residualEnergySamples_ = [];
  /** whether residual energy has been calculated and displayed.
  * @type {boolean}
  * @private
  */
  this.residualEnergySet_ = false;
  /** When kinetic energy is near zero, display current potential energy.
  * @type {!DisplayText}
  * @private
  */
  this.residualEnergy_ = new DisplayText('', /*position=*/new Vector(2, 2));
  this.residualEnergy_.setFillStyle('gray');
  this.displayList.add(this.residualEnergy_);

  /** @type {!ParameterNumber} */
  let pn;

  this.addPlaybackControls();
  this.addParameter(pn = new ParameterNumber(this, Molecule5App.en.NUM_ATOMS,
      Molecule5App.i18n.NUM_ATOMS,
      () => this.getNumAtoms(), a => this.setNumAtoms(a)));
  this.addControl(new SliderControl(pn, 1, 6, /*multiply=*/false, 5));

  pn = this.sim_.getParameterNumber(Molecule3Sim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = this.sim_.getParameterNumber(Molecule3Sim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.sim_.getParameterNumber(Molecule3Sim.en.ELASTICITY);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.sim_.getParameterNumber(EnergySystem.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  /** @type {!ParameterBoolean} */
  let pb;
  this.addParameter(pb = new ParameterBoolean(this, Molecule5App.en.SHOW_NAMES,
      Molecule5App.i18n.SHOW_NAMES,
      () => this.getShowNames(),
      a => this.setShowNames(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, Molecule5App.en.SHOW_SPRINGS,
      Molecule5App.i18n.SHOW_SPRINGS,
      () => this.getShowSprings(),
      a => this.setShowSprings(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, Molecule5App.en.NON_LINEAR_SPRINGS,
      Molecule5App.i18n.NON_LINEAR_SPRINGS,
      () => this.getNonLinearSprings(),
      a => this.setNonLinearSprings(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, Molecule5App.en.SHOW_KE_HIGH,
      Molecule5App.i18n.SHOW_KE_HIGH,
      () => this.getShowKEHigh(),
      a => this.setShowKEHigh(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, Molecule5App.en.KE_HIGH_PCT,
      Molecule5App.i18n.KE_HIGH_PCT,
      () => this.getKEHighPct(), a => this.setKEHighPct(a)));
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.addStandardControls();

  for (let i=1; i<=6; i++) {
    this.addParameter(pn = new ParameterNumber(this, Molecule5App.en.MASS+' '+i,
        Molecule5App.i18n.MASS+' '+i,
        () => this.getMass(i), m => this.setMass(i, m)));
    pn.setDecimalPlaces(5);
    this.addControl(new NumericControl(pn));
  }
  const msm = Molecule5App.getMSM(6);
  for (let i=0, len=msm.length; i<len; i++) {
    let idx1 = msm[i][0] + 1;
    let idx2 = msm[i][1] + 1;
    this.addParameter(pn = new ParameterNumber(this,
        Molecule5App.en.STIFFNESS+' '+idx1+'-'+idx2,
        Molecule5App.i18n.STIFFNESS+' '+idx1+'-'+idx2,
        () => this.getStiffness(idx1, idx2),
        a => this.setStiffness(idx1, idx2, a)));
    this.addControl(new NumericControl(pn));
  }

  this.config();

  this.graph.line.setXVariable(Molecule3Sim.START_VAR);
  this.graph.line.setYVariable(Molecule3Sim.START_VAR + 1);
  this.timeGraph.line1.setYVariable(1);
  this.timeGraph.line2.setYVariable(2);

  this.makeEasyScript();
  this.addURLScriptButton();

  // after clicking the "rewind" button, call resetResidualEnergy
  new GenericObserver(this.simRun, evt => {
    if (evt.nameEquals(SimRunner.RESET)) {
      this.resetResidualEnergy();
    }
  });

  /** Causes atoms with high KE percentage (kinetic energy) to be brightly colored.
  * @type {!GenericMemo}
  * @private
  */
  this.ke_high_memo_ = new GenericMemo(() => {
    this.sim_.getAtoms().forEach((atom, idx) => {
      const ke_var = this.sim_.getVarsList().getVariable('ke'+(idx+1)+' pct');
      const ke_pct = ke_var.getValue();
      const dispAtom = this.displayList.findShape(atom);
      if (ke_pct > this.ke_high_pct_) {
        dispAtom.setFillStyle('red');
      } else {
        dispAtom.setFillStyle('gray');
      }
    });
  });
  this.simRun.addMemo(this.ke_high_memo_);

  /** When kinetic energy is near zero, display current potential energy.
  * @type {!GenericMemo}
  * @private
  */
  this.residualEnergy_memo_ = new GenericMemo( () => {
    if (!this.residualEnergySet_) {
      const ei = this.sim_.getEnergyInfo();
      this.residualEnergySamples_.push(ei.getTranslational());
      if (this.residualEnergySamples_.length > 100) {
        this.residualEnergySamples_.shift();
      }
      const max = array.reduce(this.residualEnergySamples_,
        function(prev, cur) {
          return Math.max(prev, cur);
        }, /*initial value=*/0);
      if (this.residualEnergySamples_.length >= 100 &&  max < 1e-3) {
        this.residualEnergy_.setText(EnergySystem.i18n.POTENTIAL_ENERGY+
            ' '+Util.NF3(ei.getPotential()));
        this.residualEnergySet_ = true;
      }
    }
  });
  this.simRun.addMemo(this.residualEnergy_memo_);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      + super.toString();
};

/** @override */
getClassName() {
  return 'Molecule5App';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('protoSpring', myName+'.');
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
  } else if (obj instanceof Spring || obj instanceof SpringNonLinear) {
    const s = /** @type {!Spring} */(obj);
    this.displayList.add(new DisplaySpring(s, this.protoSpring));
  }
};

/**
@param {!SimObject} obj
@private
*/
removeBody(obj) {
  const dispObj = this.displayList.find(obj);
  if (dispObj) {
    this.displayList.remove(dispObj);
  }
};

/** @override */
observe(event) {
  if (event.getSubject() == this.simList) {
    const obj = /** @type {!SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      this.removeBody(obj);
    }
  }
};

/**
* @return {undefined}
* @private
*/
config() {
  const numAtoms = this.numAtoms_;
  if (numAtoms < 1 || numAtoms > 6) {
    throw 'too many atoms '+numAtoms;
  }
  this.sim_.cleanSlate();
  this.resetResidualEnergy();
  // Mass-Spring-Mass matrix says how springs & masses are connected
  // each row corresponds to a spring, with indices of masses connected to that spring.
  this.msm_ = Molecule5App.getMSM(numAtoms);
  for (let i=0; i<numAtoms; i++) {
    let atom = PointMass.makeCircle(0.5, 'atom'+(i+1)).setMass(0.5);
    this.sim_.addAtom(atom);
  }
  const atoms = this.sim_.getAtoms();
  for (let i=0; i<this.msm_.length; i++) {
    let spring;
    if (this.nonLinearSprings_) {
      spring = new SpringNonLinear('spring '+i,
        atoms[this.msm_[i][0]], Vector.ORIGIN,
        atoms[this.msm_[i][1]], Vector.ORIGIN,
        /*restLength=*/3.0, /*stiffness=*/1.0);
    } else {
      spring = new Spring('spring '+i,
        atoms[this.msm_[i][0]], Vector.ORIGIN,
        atoms[this.msm_[i][1]], Vector.ORIGIN,
        /*restLength=*/3.0, /*stiffness=*/6.0);
    }
    spring.setDamping(0);
    this.sim_.addSpring(spring);
  }
  this.initialPositions(numAtoms);
  this.sim_.saveInitialState();
  this.sim_.modifyObjects();
  this.addKEVars();

  if (this.easyScript) {
    this.easyScript.update();
  }
  this.broadcastAll();
};

/**
* @return {undefined}
* @private
*/
resetResidualEnergy() {
  this.residualEnergySet_ = false;
  this.residualEnergySamples_ = [];
  this.residualEnergy_.setText('');
};

/** add variables for kinetic energy of atoms 1, 2, 3, etc.
* @return {undefined}
* @private
*/
addKEVars()  {
  const sim = this.sim_;
  const va = sim.getVarsList();
  for (let i=1; i<=this.numAtoms_; i++) {
    const nm = 'ke'+i;
    va.addVariable(new FunctionVariable(va, nm, nm,
      () => {
        const atom1 = sim.getSimList().getPointMass('atom'+i);
        return atom1.getKineticEnergy();
      }
    ));
    const nm2 = 'ke'+i+' pct';
    va.addVariable(new FunctionVariable(va, nm2, nm2,
      () => {
        const atom = sim.getSimList().getPointMass('atom'+i);
        return 100*atom.getKineticEnergy()/sim.getEnergyInfo().getTotalEnergy();
      }
    ));
  }
};

/** Broadcast all parameters that can potentially be changed when number of atoms
changes.
* @return {undefined}
* @private
*/
broadcastAll()  {
  for (let i=1; i<=6; i++) {
    this.broadcastParameter(Molecule5App.en.MASS+' '+i);
  }
  const msm = Molecule5App.getMSM(6);
  for (let i=0, len=msm.length; i<len; i++) {
    const idx1 = msm[i][0] + 1;
    const idx2 = msm[i][1] + 1;
    this.broadcastParameter(Molecule5App.en.STIFFNESS+' '+idx1+'-'+idx2);
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
    case 3: return [[0,1],[0,2],[1,2]];
    case 4: return [[0,1],[0,2],[0,3],
                    [1,2],[1,3],
                    [2,3]];
    case 5: return [[0,1],[0,2],[0,3],[0,4],
                    [1,2],[1,3],[1,4],
                    [2,3],[2,4],
                    [3,4]];
    case 6: return [[0,1],[0,2],[0,3],[0,4],[0,5],
                    [1,2],[1,3],[1,4],[1,5],
                    [2,3],[2,4],[2,5],
                    [3,4],[3,5],
                    [4,5]];
  }
  throw '';
};

/** Sets initial position of atoms.
* @param {number} numAtoms
* @return {undefined}
* @private
*/
initialPositions(numAtoms)  {
  const vars = this.sim_.getVarsList().getValues();
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  // arrange all masses around a circle
  const r = 1.0; // radius
  for (let i=0; i<numAtoms; i++) {
    const idx = Molecule3Sim.START_VAR + 4*i;
    vars[idx + 0] = r * Math.cos(i*2*Math.PI/numAtoms);
    vars[idx + 1] = r * Math.sin(i*2*Math.PI/numAtoms);
  }
  this.sim_.getVarsList().setValues(vars);
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
  this.broadcastParameter(Molecule5App.en.NUM_ATOMS);
};

/** Return mass of specified atom
@param {number} index index number of atom, starting from 1
@return {number} mass of specified atom
*/
getMass(index) {
  const atoms = this.sim_.getAtoms();
  return (index >= 1 && index <= atoms.length) ? atoms[index-1].getMass() : 0;
};

/** Sets mass of specified atom
@param {number} index index number of atom, starting from 1
@param {number} value mass of atom
*/
setMass(index, value) {
  this.sim_.getAtoms()[index-1].setMass(value);
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(1, 2, 3, 4, 5, 6);
  this.broadcastParameter(Molecule5App.en.MASS+' '+index);
};

/** Returns spring connecting specified atoms
@param {number} index1 index number of atom, starting from 1
@param {number} index2 index number of atom, starting from 1, must be greater than
    index1
@return {?Spring} spring connecting specified atoms
*/
getSpring(index1, index2) {
  const atoms = this.sim_.getAtoms();
  if (index2 < index1) {
    throw 'index2 must be > index1';
  }
  if (index1 < 1 || index1 > atoms.length) {
    return null;
  }
  if (index2 < 1 || index2 > atoms.length) {
    return null;
  }
  const atom1 = this.sim_.getAtoms()[index1-1];
  const atom2 = this.sim_.getAtoms()[index2-1];
  return array.find(this.sim_.getSprings(), spr => {
    if (spr.getBody1() == atom1 && spr.getBody2() == atom2) {
      return true;
    } else if (spr.getBody1() == atom2 && spr.getBody1() == atom1) {
      return true;
    } else {
      return false;
    }
  });
};

/** Returns spring stiffness of spring connecting specified atoms
@param {number} index1 index number of atom, starting from 1
@param {number} index2 index number of atom, starting from 1
@return {number} spring stiffness
*/
getStiffness(index1, index2) {
  const spr = this.getSpring(index1, index2);
  return spr ? spr.getStiffness() : 0;
};

/** Sets spring stiffness of spring connecting specified atoms
@param {number} index1 index number of atom, starting from 1
@param {number} index2 index number of atom, starting from 1
@param {number} value spring stiffness
*/
setStiffness(index1, index2, value) {
  const spr = this.getSpring(index1, index2);
  if (!spr) {
    throw 'unknown spring connecting '+index1+'-'+index2;
  }
  spr.setStiffness(value);
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(Molecule5App.en.STIFFNESS+' '+index1+'-'+index2);
};

/** Whether names should be displayed.
@return {boolean}
*/
getShowNames() {
  return this.showNames_;
};

/** Sets whether names should be displayed.
@param {boolean} value
*/
setShowNames(value) {
  if (value != this.showNames_) {
    this.showNames_ = value;
    this.sim_.getAtoms().forEach(atom => {
      const dispAtom = this.displayList.findShape(atom);
      if (value) {
        dispAtom.setNameFont('12pt sans-serif');
        const bg = this.layout.simCanvas.getBackground();
        dispAtom.setNameColor(bg == 'black' ? 'white' : 'black');
      } else {
        dispAtom.setNameFont('');
      }
    });
    this.broadcastParameter(Molecule5App.en.SHOW_NAMES);
  }
};

/** Whether springs should be displayed.
@return {boolean}
*/
getShowSprings() {
  return this.showSprings_;
};

/** Sets whether springs should be displayed.
@param {boolean} value
*/
setShowSprings(value) {
  if (value != this.showSprings_) {
    this.showSprings_ = value;
    if (value) {
      this.sim_.getSprings().forEach(spr => this.addBody(spr));
    } else {
      this.sim_.getSprings().forEach(spr => this.removeBody(spr));
    }
    this.broadcastParameter(Molecule5App.en.SHOW_SPRINGS);
  }
};

/** Whether to create linear or non-linear springs
@return {boolean}
*/
getNonLinearSprings() {
  return this.nonLinearSprings_;
};

/** Sets whether to create linear or non-linear springs/
@param {boolean} value
*/
setNonLinearSprings(value) {
  if (this.nonLinearSprings_ != value) {
    this.nonLinearSprings_ = value;
    this.config();
    this.broadcastParameter(Molecule5App.en.NON_LINEAR_SPRINGS);
  }
};

/** atoms with KE percentage (kinetic energy) above this amount are brightly colored.
@return {number}
*/
getKEHighPct() {
  return this.ke_high_pct_;
};

/** atoms with KE percentage (kinetic energy) above this amount are brightly colored.
@param {number} value
*/
setKEHighPct(value) {
  if (this.ke_high_pct_ != value) {
    this.ke_high_pct_ = value;
    this.broadcastParameter(Molecule5App.en.KE_HIGH_PCT);
  }
};

/** whether to specially color atoms with high KE percentage.
@return {boolean}
*/
getShowKEHigh() {
  return this.show_ke_high_;
};

/** Sets whether to specially color atoms with high KE percentage.
@param {boolean} value
*/
setShowKEHigh(value) {
  if (value != this.show_ke_high_) {
    this.show_ke_high_ = value;
    if (value) {
      this.simRun.addMemo(this.ke_high_memo_);
    } else {
      this.simRun.removeMemo(this.ke_high_memo_);
      this.sim_.getAtoms().forEach(atom => this.removeBody(atom));
      this.sim_.getAtoms().forEach(atom => this.addBody(atom));
    }
    this.broadcastParameter(Molecule5App.en.SHOW_KE_HIGH);
  }
};

} // end class

/** Set of internationalized strings.
@typedef {{
  MASS: string,
  LENGTH: string,
  STIFFNESS: string,
  NUM_ATOMS: string,
  SHOW_SPRINGS: string,
  NON_LINEAR_SPRINGS: string,
  KE_HIGH_PCT: string,
  SHOW_KE_HIGH: string,
  SHOW_NAMES: string
  }}
*/
Molecule5App.i18n_strings;

/**
@type {Molecule5App.i18n_strings}
*/
Molecule5App.en = {
  MASS: 'mass',
  LENGTH: 'spring length',
  STIFFNESS: 'spring stiffness',
  NUM_ATOMS: 'number of atoms',
  SHOW_SPRINGS: 'show springs',
  NON_LINEAR_SPRINGS: 'non-linear springs',
  KE_HIGH_PCT: 'KE high pct',
  SHOW_KE_HIGH: 'show KE high pct',
  SHOW_NAMES: 'show names'
};

/**
@private
@type {Molecule5App.i18n_strings}
*/
Molecule5App.de_strings = {
  MASS: 'Masse',
  LENGTH: 'Federlänge',
  STIFFNESS: 'Federsteifheit',
  NUM_ATOMS: 'zahl Masse',
  SHOW_SPRINGS: 'zeige Federn',
  NON_LINEAR_SPRINGS: 'nicht linear Federn',
  KE_HIGH_PCT: 'KE hoch prozent',
  SHOW_KE_HIGH: 'zeige KE hoch prozent',
  SHOW_NAMES: 'zeige Namen'
};

/** Set of internationalized strings.
@type {Molecule5App.i18n_strings}
*/
Molecule5App.i18n = goog.LOCALE === 'de' ? Molecule5App.de_strings :
    Molecule5App.en;

/**
* @param {!TabLayout.elementIds} elem_ids
* @param {number} numAtoms number of atoms to make, from 2 to 6
* @return {!Molecule5App}
*/
function makeMolecule5App(elem_ids, numAtoms) {
  return new Molecule5App(elem_ids, numAtoms);
};
goog.exportSymbol('makeMolecule5App', makeMolecule5App);

exports = Molecule5App;
