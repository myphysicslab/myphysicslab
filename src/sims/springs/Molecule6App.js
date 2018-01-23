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

goog.provide('myphysicslab.sims.springs.Molecule6App');

goog.require('myphysicslab.lab.app.SimRunner');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.FunctionVariable');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericMemo');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.RandomLCG');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.DisplayText');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.springs.Molecule3Sim');
goog.require('myphysicslab.sims.springs.SpringNonLinear2');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.common.AbstractApp;
const CheckBoxControl = goog.module.get('myphysicslab.lab.controls.CheckBoxControl');
const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
var CommonControls = sims.common.CommonControls;
const DisplayShape = goog.module.get('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.module.get('myphysicslab.lab.view.DisplaySpring');
var DisplayText = lab.view.DisplayText;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const EnergySystem = goog.module.get('myphysicslab.lab.model.EnergySystem');
const FunctionVariable = goog.module.get('myphysicslab.lab.model.FunctionVariable');
const GenericMemo = goog.module.get('myphysicslab.lab.util.GenericMemo');
const GenericObserver = goog.module.get('myphysicslab.lab.util.GenericObserver');
var Molecule3Sim = sims.springs.Molecule3Sim;
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const Observer = goog.module.get('myphysicslab.lab.util.Observer');
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
const RandomLCG = goog.module.get('myphysicslab.lab.util.RandomLCG');
const SimList = goog.module.get('myphysicslab.lab.model.SimList');
const SimObject = goog.module.get('myphysicslab.lab.model.SimObject');
var SimRunner = lab.app.SimRunner;
const SliderControl = goog.module.get('myphysicslab.lab.controls.SliderControl');
const Spring = goog.module.get('myphysicslab.lab.model.Spring');
var SpringNonLinear2 = myphysicslab.sims.springs.SpringNonLinear2;
var TabLayout = sims.common.TabLayout;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Displays the {@link Molecule3Sim} simulation.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {number} numAtoms number of atoms to make, from 2 to 6
* @constructor
* @final
* @implements {Observer}
* @extends {AbstractApp}
* @struct
* @export
*/
myphysicslab.sims.springs.Molecule6App = function(elem_ids, numAtoms) {
  Util.setErrorHandler();
  /** @type {number}
  * @private
  */
  this.numAtoms_ = numAtoms;
  var simRect = new DoubleRect(-6, -6, 6, 6);
  /** @type {!Molecule3Sim} */
  this.sim_ = new Molecule3Sim();
  this.sim_.setDamping(0);
  var advance = new CollisionAdvance(this.sim_);
  AbstractApp.call(this, elem_ids, simRect, this.sim_, advance,
      /*eventHandler=*/this.sim_, /*energySystem=*/this.sim_);
  this.layout.simCanvas.setBackground('black');
  this.simRun.setTimeStep(0.01);
  if (this.showEnergyParam != null) {
    this.showEnergyParam.setValue(true);
  }

  /** @type {!DisplaySpring} */
  this.protoSpring = new DisplaySpring().setWidth(0.15).setColorCompressed('#0c0')
      .setColorExpanded('green').setThickness(3);

  // The observe() method will make DisplayObjects in response to seeing SimObjects
  // being added to the SimList.  Important that no SimObjects were added prior.
  // Except for the walls.
  goog.asserts.assert(this.simList.length() == 1);
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
  /** strength of attraction force in NonLinearSpring2
  * @type {number}
  * @private
  */
  this.attract_ = 30;
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
  var pn;

  this.addPlaybackControls();
  this.addParameter(pn = new ParameterNumber(this, Molecule6App.en.NUM_ATOMS,
      Molecule6App.i18n.NUM_ATOMS,
      goog.bind(this.getNumAtoms, this), goog.bind(this.setNumAtoms, this)));
  this.addControl(new SliderControl(pn, 1, 6, /*multiply=*/false, 5));

  pn = this.sim_.getParameterNumber(Molecule3Sim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = this.sim_.getParameterNumber(Molecule3Sim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.sim_.getParameterNumber(Molecule3Sim.en.ELASTICITY);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.sim_.getParameterNumber(Molecule3Sim.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  /** @type {!ParameterBoolean} */
  var pb;
  this.addParameter(pb = new ParameterBoolean(this, Molecule6App.en.SHOW_NAMES,
      Molecule6App.i18n.SHOW_NAMES,
      goog.bind(this.getShowNames, this),
      goog.bind(this.setShowNames, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, Molecule6App.en.SHOW_SPRINGS,
      Molecule6App.i18n.SHOW_SPRINGS,
      goog.bind(this.getShowSprings, this),
      goog.bind(this.setShowSprings, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, Molecule6App.en.NON_LINEAR_SPRINGS,
      Molecule6App.i18n.NON_LINEAR_SPRINGS,
      goog.bind(this.getNonLinearSprings, this),
      goog.bind(this.setNonLinearSprings, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, Molecule6App.en.SHOW_KE_HIGH,
      Molecule6App.i18n.SHOW_KE_HIGH,
      goog.bind(this.getShowKEHigh, this),
      goog.bind(this.setShowKEHigh, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, Molecule6App.en.KE_HIGH_PCT,
      Molecule6App.i18n.KE_HIGH_PCT,
      goog.bind(this.getKEHighPct, this), goog.bind(this.setKEHighPct, this)));
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.addStandardControls();

  this.addParameter(pn = new ParameterNumber(this, Molecule6App.en.ATTRACT_FORCE,
      Molecule6App.i18n.ATTRACT_FORCE,
      goog.bind(this.getAttractForce, this), goog.bind(this.setAttractForce, this)));
  this.addControl(new NumericControl(pn));

  for (var i=1; i<=6; i++) {
    this.addParameter(pn = new ParameterNumber(this, Molecule6App.en.MASS+' '+i,
        Molecule6App.i18n.MASS+' '+i,
        goog.bind(this.getMass, this, i), goog.bind(this.setMass, this, i)));
    pn.setDecimalPlaces(5);
    this.addControl(new NumericControl(pn));
  }
  var msm = Molecule6App.getMSM(6);
  var len;
  for (i=0, len=msm.length; i<len; i++) {
    var idx1 = msm[i][0] + 1;
    var idx2 = msm[i][1] + 1;
    this.addParameter(pn = new ParameterNumber(this,
        Molecule6App.en.STIFFNESS+' '+idx1+'-'+idx2,
        Molecule6App.i18n.STIFFNESS+' '+idx1+'-'+idx2,
        goog.bind(this.getStiffness, this, idx1, idx2),
        goog.bind(this.setStiffness, this, idx1, idx2)));
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
  new GenericObserver(this.simRun, goog.bind(function(evt) {
    if (evt.nameEquals(SimRunner.RESET)) {
      this.resetResidualEnergy();
    }
  }, this));

  /** Causes atoms with high KE percentage (kinetic energy) to be brightly colored.
  * @type {!GenericMemo}
  * @private
  */
  this.ke_high_memo_ = new GenericMemo(goog.bind(function() {
    goog.array.forEach(this.sim_.getAtoms(), function(atom, idx) {
      var ke_var = this.sim_.getVarsList().getVariable('ke'+(idx+1)+' pct');
      var ke_pct = ke_var.getValue();
      var dispAtom = this.displayList.findShape(atom);
      if (ke_pct > this.ke_high_pct_) {
        dispAtom.setFillStyle('red');
      } else {
        dispAtom.setFillStyle('gray');
      }
    }, this);
  }, this));
  this.simRun.addMemo(this.ke_high_memo_);

  /** When kinetic energy is near zero, display current potential energy.
  * @type {!GenericMemo}
  * @private
  */
  this.residualEnergy_memo_ = new GenericMemo(goog.bind(function() {
    if (!this.residualEnergySet_) {
      var ei = this.sim_.getEnergyInfo();
      this.residualEnergySamples_.push(ei.getTranslational());
      if (this.residualEnergySamples_.length > 100) {
        this.residualEnergySamples_.shift();
      }
      var max = goog.array.reduce(this.residualEnergySamples_,
        function(prev, cur) {
          return Math.max(prev, cur);
        }, /*initial value=*/0);
      if (this.residualEnergySamples_.length >= 100 &&  max < 1e-3) {
        this.residualEnergy_.setText(EnergySystem.i18n.POTENTIAL_ENERGY+
            ' '+Util.NF3(ei.getPotential()));
        this.residualEnergySet_ = true;
      }
    }
  }, this));
  this.simRun.addMemo(this.residualEnergy_memo_);
};
var Molecule6App = myphysicslab.sims.springs.Molecule6App;
goog.inherits(Molecule6App, AbstractApp);

/** @override */
Molecule6App.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      + Molecule6App.superClass_.toString.call(this);
};

/** @override */
Molecule6App.prototype.getClassName = function() {
  return 'Molecule6App';
};

/** @override */
Molecule6App.prototype.defineNames = function(myName) {
  Molecule6App.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('protoSpring', myName+'.');
};

/**
@param {!SimObject} obj
@private
*/
Molecule6App.prototype.addBody = function(obj) {
  if (this.displayList.find(obj) != null) {
    // we already have a DisplayObject for this SimObject, don't add a new one.
    return;
  }
  if (obj instanceof PointMass) {
    var pm = /** @type {!PointMass} */(obj);
    if (pm.getName().match(/^WALL/)) {
      var walls = new DisplayShape(pm).setFillStyle('').setStrokeStyle('gray');
      this.displayList.add(walls);
    } else {
      var cm = 'black';
      switch (pm.getName()) {
        case 'ATOM1': cm = 'red'; break;
        case 'ATOM2': cm = 'blue'; break;
        case 'ATOM3': cm = 'magenta'; break;
        case 'ATOM4': cm = 'orange'; break;
        case 'ATOM5': cm = 'gray'; break;
        case 'ATOM6': cm = 'green'; break;
        default: cm = 'pink';
      }
      var atom = new DisplayShape(pm).setFillStyle(cm);
      this.displayList.add(atom);
    }
  } else if (obj instanceof Spring || obj instanceof SpringNonLinear2) {
    var s = /** @type {!Spring} */(obj);
    this.displayList.add(new DisplaySpring(s, this.protoSpring));
  }
};

/**
@param {!SimObject} obj
@private
*/
Molecule6App.prototype.removeBody = function(obj) {
  var dispObj = this.displayList.find(obj);
  if (dispObj) {
    this.displayList.remove(dispObj);
  }
};

/** @override */
Molecule6App.prototype.observe =  function(event) {
  if (event.getSubject() == this.simList) {
    var obj = /** @type {!SimObject} */ (event.getValue());
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
Molecule6App.prototype.config = function() {
  var numAtoms = this.numAtoms_;
  if (numAtoms < 1 || numAtoms > 6) {
    throw new Error('too many atoms '+numAtoms);
  }
  this.sim_.cleanSlate();
  this.resetResidualEnergy();
  // Mass-Spring-Mass matrix says how springs & masses are connected
  // each row corresponds to a spring, with indices of masses connected to that spring.
  this.msm_ = Molecule6App.getMSM(numAtoms);
  for (var i=0; i<numAtoms; i++) {
    var atom = PointMass.makeCircle(0.5, 'atom'+(i+1)).setMass(0.5);
    this.sim_.addAtom(atom);
  }
  var atoms = this.sim_.getAtoms();
  for (i=0; i<this.msm_.length; i++) {
    if (this.nonLinearSprings_) {
      var spring = new SpringNonLinear2('spring '+i,
        atoms[this.msm_[i][0]], Vector.ORIGIN,
        atoms[this.msm_[i][1]], Vector.ORIGIN,
        /*restLength=*/3.0, /*stiffness=*/6.0, /*attract=*/this.attract_);
    } else {
      var spring = new Spring('spring '+i,
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
Molecule6App.prototype.resetResidualEnergy = function() {
  this.residualEnergySet_ = false;
  this.residualEnergySamples_ = [];
  this.residualEnergy_.setText('');
};

/** add variables for kinetic energy of atoms 1, 2, 3, etc.
* @return {undefined}
* @private
*/
Molecule6App.prototype.addKEVars = function()  {
  var sim = this.sim_;
  var va = sim.getVarsList();
  for (var i=1; i<=this.numAtoms_; i++) {
    var nm = 'ke'+i;
    va.addVariable(new FunctionVariable(va, nm, nm,
      goog.bind(function(idx) {
        var atom1 = sim.getSimList().getPointMass('atom'+idx);
        return atom1.getKineticEnergy();
      }, null, i)
    ));
    var nm2 = 'ke'+i+' pct';
    va.addVariable(new FunctionVariable(va, nm2, nm2,
      goog.bind(function(idx) {
        var atom = sim.getSimList().getPointMass('atom'+idx);
        return 100*atom.getKineticEnergy()/sim.getEnergyInfo().getTotalEnergy();
      }, null, i)
    ));
  }
};

/** Broadcast all parameters that can potentially be changed when number of atoms
changes.
* @return {undefined}
* @private
*/
Molecule6App.prototype.broadcastAll = function()  {
  for (var i=1; i<=6; i++) {
    this.broadcastParameter(Molecule6App.en.MASS+' '+i);
  }
  var msm = Molecule6App.getMSM(6);
  var len;
  for (i=0, len=msm.length; i<len; i++) {
    var idx1 = msm[i][0] + 1;
    var idx2 = msm[i][1] + 1;
    this.broadcastParameter(Molecule6App.en.STIFFNESS+' '+idx1+'-'+idx2);
  }
};

/** Returns Mass-Spring-Mass matrix which says how springs & masses are connected.
* Each row corresponds to a spring; with indices of masses connected to that spring.
* @param {number} numAtoms  number of atoms in molecule
* @return {!Array<!Array<number>>}
* @private
*/
Molecule6App.getMSM = function(numAtoms) {
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
  throw new Error();
};

/** Sets initial position of atoms.
* @param {number} numAtoms
* @return {undefined}
* @private
*/
Molecule6App.prototype.initialPositions = function(numAtoms)  {
  var vars = this.sim_.getVarsList().getValues();
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  // arrange all masses around a circle
  var r = 1.0; // radius
  for (var i=0; i<numAtoms; i++) {
    var idx = Molecule3Sim.START_VAR + 4*i;
    var rnd = 1.0 + 0.1 * this.random_.nextFloat();
    vars[idx + 0] = r * Math.cos(rnd*i*2*Math.PI/numAtoms);
    vars[idx + 1] = r * Math.sin(rnd*i*2*Math.PI/numAtoms);
  }
  this.sim_.getVarsList().setValues(vars);
};

/** Return number of atoms
@return {number} number of atoms
*/
Molecule6App.prototype.getNumAtoms = function() {
  return this.numAtoms_;
};

/** Set number of atoms
@param {number} value number of atoms
*/
Molecule6App.prototype.setNumAtoms = function(value) {
  if (value < 1 || value > 6) {
    throw new Error('too many atoms '+value);
  }
  this.numAtoms_ = value;
  this.config();
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(1, 2, 3, 4, 5, 6);
  this.broadcastParameter(Molecule6App.en.NUM_ATOMS);
};

/** Return mass of specified atom
@param {number} index index number of atom, starting from 1
@return {number} mass of specified atom
*/
Molecule6App.prototype.getMass = function(index) {
  var atoms = this.sim_.getAtoms();
  return (index >= 1 && index <= atoms.length) ? atoms[index-1].getMass() : 0;
};

/** Sets mass of specified atom
@param {number} index index number of atom, starting from 1
@param {number} value mass of atom
*/
Molecule6App.prototype.setMass = function(index, value) {
  this.sim_.getAtoms()[index-1].setMass(value);
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(1, 2, 3, 4, 5, 6);
  this.calcMinPE();
  this.broadcastParameter(Molecule6App.en.MASS+' '+index);
};

/** Returns spring connecting specified atoms
@param {number} index1 index number of atom, starting from 1
@param {number} index2 index number of atom, starting from 1, must be greater than
    index1
@return {?Spring} spring connecting specified atoms
*/
Molecule6App.prototype.getSpring = function(index1, index2) {
  var atoms = this.sim_.getAtoms();
  if (index2 < index1) {
    throw new Error('index2 must be > index1');
  }
  if (index1 < 1 || index1 > atoms.length) {
    return null;
  }
  if (index2 < 1 || index2 > atoms.length) {
    return null;
  }
  var atom1 = this.sim_.getAtoms()[index1-1];
  var atom2 = this.sim_.getAtoms()[index2-1];
  return goog.array.find(this.sim_.getSprings(), function(spr) {
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
Molecule6App.prototype.getStiffness = function(index1, index2) {
  var spr = this.getSpring(index1, index2);
  return spr ? spr.getStiffness() : 0;
};

/** Sets spring stiffness of spring connecting specified atoms
@param {number} index1 index number of atom, starting from 1
@param {number} index2 index number of atom, starting from 1
@param {number} value spring stiffness
*/
Molecule6App.prototype.setStiffness = function(index1, index2, value) {
  var spr = this.getSpring(index1, index2);
  if (!spr) {
    throw new Error('unknown spring connecting '+index1+'-'+index2);
  }
  spr.setStiffness(value);
  // discontinuous change in energy
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.sim_.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(Molecule6App.en.STIFFNESS+' '+index1+'-'+index2);
};

/**
@return undefined
@private
*/
Molecule6App.prototype.calcMinPE = function() {
  if (this.nonLinearSprings_) {
    goog.array.forEach(this.sim_.getSprings(), function(spr) {
      if (spr instanceof SpringNonLinear2) {
        var s2 = /** SpringNonLinear2 */(spr);
        s2.calcMinPE();
      }
    });
  }
};

/** Whether names should be displayed.
@return {boolean}
*/
Molecule6App.prototype.getShowNames = function() {
  return this.showNames_;
};

/** Sets whether names should be displayed.
@param {boolean} value
*/
Molecule6App.prototype.setShowNames = function(value) {
  if (value != this.showNames_) {
    this.showNames_ = value;
    goog.array.forEach(this.sim_.getAtoms(), function(atom) {
      var dispAtom = this.displayList.findShape(atom);
      if (value) {
        dispAtom.setNameFont('12pt sans-serif');
        var bg = this.layout.simCanvas.getBackground();
        dispAtom.setNameColor(bg == 'black' ? 'white' : 'black');
      } else {
        dispAtom.setNameFont('');
      }
    }, this);
    this.broadcastParameter(Molecule6App.en.SHOW_NAMES);
  }
};

/** Whether springs should be displayed.
@return {boolean}
*/
Molecule6App.prototype.getShowSprings = function() {
  return this.showSprings_;
};

/** Sets whether springs should be displayed.
@param {boolean} value
*/
Molecule6App.prototype.setShowSprings = function(value) {
  if (value != this.showSprings_) {
    this.showSprings_ = value;
    if (value) {
      goog.array.forEach(this.sim_.getSprings(), function(spr) {
        this.addBody(spr);
      }, this);
    } else {
      goog.array.forEach(this.sim_.getSprings(), function(spr) {
        this.removeBody(spr);
      }, this);
    }
    this.broadcastParameter(Molecule6App.en.SHOW_SPRINGS);
  }
};

/** Whether to create linear or non-linear springs
@return {boolean}
*/
Molecule6App.prototype.getNonLinearSprings = function() {
  return this.nonLinearSprings_;
};

/** Sets whether to create linear or non-linear springs/
@param {boolean} value
*/
Molecule6App.prototype.setNonLinearSprings = function(value) {
  if (this.nonLinearSprings_ != value) {
    this.nonLinearSprings_ = value;
    this.config();
    this.broadcastParameter(Molecule6App.en.NON_LINEAR_SPRINGS);
  }
};

/** atoms with KE percentage (kinetic energy) above this amount are brightly colored.
@return {number}
*/
Molecule6App.prototype.getKEHighPct = function() {
  return this.ke_high_pct_;
};

/** atoms with KE percentage (kinetic energy) above this amount are brightly colored.
@param {number} value
*/
Molecule6App.prototype.setKEHighPct = function(value) {
  if (this.ke_high_pct_ != value) {
    this.ke_high_pct_ = value;
    this.broadcastParameter(Molecule6App.en.KE_HIGH_PCT);
  }
};

/** 
@return {number}
*/
Molecule6App.prototype.getAttractForce = function() {
  return this.attract_;
};

/** 
@param {number} value
*/
Molecule6App.prototype.setAttractForce = function(value) {
  if (this.attract_ != value) {
    this.attract_ = value;
    goog.array.forEach(this.sim_.getSprings(), function(spr) {
      if (spr instanceof SpringNonLinear2) {
        var s2 = /** SpringNonLinear2 */(spr);
        s2.setAttract(this.attract_);
      }
    }, this);
    this.broadcastParameter(Molecule6App.en.ATTRACT_FORCE);
  }
};

/** whether to specially color atoms with high KE percentage.
@return {boolean}
*/
Molecule6App.prototype.getShowKEHigh = function() {
  return this.show_ke_high_;
};

/** Sets whether to specially color atoms with high KE percentage.
@param {boolean} value
*/
Molecule6App.prototype.setShowKEHigh = function(value) {
  if (value != this.show_ke_high_) {
    this.show_ke_high_ = value;
    if (value) {
      this.simRun.addMemo(this.ke_high_memo_);
    } else {
      this.simRun.removeMemo(this.ke_high_memo_);
      goog.array.forEach(this.sim_.getAtoms(), function(atom) {
        this.removeBody(atom);
      }, this);
      goog.array.forEach(this.sim_.getAtoms(), function(atom) {
        this.addBody(atom);
      }, this);
    }
    this.broadcastParameter(Molecule6App.en.SHOW_KE_HIGH);
  }
};

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
  SHOW_NAMES: string,
  ATTRACT_FORCE: string
  }}
*/
Molecule6App.i18n_strings;

/**
@type {Molecule6App.i18n_strings}
*/
Molecule6App.en = {
  MASS: 'mass',
  LENGTH: 'spring length',
  STIFFNESS: 'spring stiffness',
  NUM_ATOMS: 'number of atoms',
  SHOW_SPRINGS: 'show springs',
  NON_LINEAR_SPRINGS: 'non-linear springs',
  KE_HIGH_PCT: 'KE high pct',
  SHOW_KE_HIGH: 'show KE high pct',
  SHOW_NAMES: 'show names',
  ATTRACT_FORCE: 'attract force'
};

/**
@private
@type {Molecule6App.i18n_strings}
*/
Molecule6App.de_strings = {
  MASS: 'Masse',
  LENGTH: 'Federl\u00e4nge',
  STIFFNESS: 'Federsteifheit',
  NUM_ATOMS: 'zahl Masse',
  SHOW_SPRINGS: 'zeige Federn',
  NON_LINEAR_SPRINGS: 'nicht linear Federn',
  KE_HIGH_PCT: 'KE hoch prozent',
  SHOW_KE_HIGH: 'zeige KE hoch prozent',
  SHOW_NAMES: 'zeige Namen',
  ATTRACT_FORCE: 'anziehen Kraft'
};

/** Set of internationalized strings.
@type {Molecule6App.i18n_strings}
*/
Molecule6App.i18n = goog.LOCALE === 'de' ? Molecule6App.de_strings :
    Molecule6App.en;

}); // goog.scope
