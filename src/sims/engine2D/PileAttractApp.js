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

goog.module('myphysicslab.sims.engine2D.PileAttractApp');

const array = goog.require('goog.array');
const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const Gravity2Law = goog.require('myphysicslab.lab.model.Gravity2Law');
const ModifiedEuler = goog.require('myphysicslab.lab.model.ModifiedEuler');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PileConfig = goog.require('myphysicslab.sims.engine2D.PileConfig');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const SixThrusters = goog.require('myphysicslab.sims.engine2D.SixThrusters');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Creates a pile of randomly shaped blocks that clump together under mutual
gravitation.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
class PileAttractApp extends Engine2DApp {
/**
* @param {!Object} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  const simRect = new DoubleRect(-3, -3, 3, 3);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  this.layout.getSimCanvas().setBackground('black');
  this.rbo.protoDragSpring.setWidth(0.3);
  this.rbo.protoPolygon.setDrawCenterOfMass(true);
  if (1 == 0) {
    // draw names of blocks
    this.rbo.protoPolygon.setNameColor('gray').setNameFont('10pt sans-serif');
  }
  this.elasticity.setElasticity(0.8);
  this.mySim.setShowForces(false);
  this.mySim.setDistanceTol(0.01);
  this.mySim.setCollisionAccuracy(0.6);
  this.diffEqSolver.setDiffEqSolver(ModifiedEuler.en.NAME);
  //this.advance.setDebugLevel(CollisionAdvance.DebugLevel.NONE);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0.05, 0.15);
  /** @type {!Gravity2Law} */
  this.gravityLaw = new Gravity2Law(1);
  /** @type {number} */
  this.numBlocks = 8;
  /** @type {boolean} */
  this.squareBlocks = false;
  /** @type {number} */
  this.randomSeed = 0;
  /** @type {!RandomLCG} */
  this.buildRNG = new RandomLCG(this.randomSeed);
  /** @type {number} */
  this.zeroEnergyLevel = 0;

  this.addPlaybackControls();
  /** @type {!ParameterBoolean} */
  let pb;
  /** @type {!ParameterNumber} */
  let pn;
  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.NUM_BLOCKS,
      PileConfig.i18n.NUM_BLOCKS,
      () => this.getNumBlocks(), a => this.setNumBlocks(a))
      .setDecimalPlaces(0));
  this.addControl(new NumericControl(pn));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.SQUARE_BLOCKS,
      PileConfig.i18n.SQUARE_BLOCKS,
      () => this.getSquareBlocks(), a => this.setSquareBlocks(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.RANDOM_SEED,
      PileConfig.i18n.RANDOM_SEED,
      () => this.getRandomSeed(), a => this.setRandomSeed(a))
      .setDecimalPlaces(0).setLowerLimit(Util.NEGATIVE_INFINITY));

  pn = this.gravityLaw.getParameterNumber(Gravity2Law.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  const c = new ButtonControl(PileConfig.i18n.REBUILD, () => this.config());
  this.addControl(c);

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'PileAttractApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('PileConfig|PileAttractApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/**
* @return {undefined}
*/
config() {
  this.randomSeed = this.buildRNG.getSeed();
  const elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  const half = Math.floor(this.numBlocks/2);
  const rest = this.numBlocks-half;
  const blocks = PileConfig.makeRandomBlocks(this.mySim, /* num blocks=*/half,
      /* x=*/-half/2, /* y=*/1, this.buildRNG, /*rightAngle=*/this.squareBlocks);
  array.extend(blocks, PileConfig.makeRandomBlocks(this.mySim,
      /* num blocks=*/rest, /* x=*/-half/2, /* y=*/-1, this.buildRNG,
      /*rightAngle=*/this.squareBlocks));

  // set random colors for blocks
  blocks.forEach(b =>
    this.displayList.findShape(b).setFillStyle(PileConfig.getRandomColor()));

  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
* @return {number}
*/
getNumBlocks() {
  return this.numBlocks;
};

/**
* @param {number} value
*/
setNumBlocks(value) {
  this.numBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.NUM_BLOCKS);
};

/** Returns the seed of the random number generator used to determine sizes of blocks.
* @return {number}
*/
getRandomSeed() {
  return this.randomSeed;
};

/** Sets the seed of the random number generator used to determine sizes of blocks
* @param {number} value
*/
setRandomSeed(value) {
  this.randomSeed = value;
  this.buildRNG.setSeed(value);
  this.config();
  this.broadcastParameter(PileConfig.en.RANDOM_SEED);
};

/**
* @return {boolean}
*/
getSquareBlocks() {
  return this.squareBlocks;
};

/**
* @param {boolean} value
*/
setSquareBlocks(value) {
  this.squareBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.SQUARE_BLOCKS);
};

} // end class

/**
* @param {!Object} elem_ids
* @return {!PileAttractApp}
*/
function makePileAttractApp(elem_ids) {
  return new PileAttractApp(elem_ids);
};
goog.exportSymbol('makePileAttractApp', makePileAttractApp);

exports = PileAttractApp;
