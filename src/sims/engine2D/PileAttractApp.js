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

goog.provide('myphysicslab.sims.engine2D.PileAttractApp');

goog.require('myphysicslab.lab.controls.ButtonControl');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.Gravity2Law');
goog.require('myphysicslab.lab.model.ModifiedEuler');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.RandomLCG');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.engine2D.PileConfig');
goog.require('myphysicslab.sims.engine2D.SixThrusters');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const ButtonControl = goog.module.get('myphysicslab.lab.controls.ButtonControl');
const CheckBoxControl = goog.module.get('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.module.get('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.module.get('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.module.get('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.module.get('myphysicslab.lab.model.DampingLaw');
const DisplayShape = goog.module.get('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DApp = sims.engine2D.Engine2DApp;
const Gravity2Law = goog.module.get('myphysicslab.lab.model.Gravity2Law');
const ModifiedEuler = goog.module.get('myphysicslab.lab.model.ModifiedEuler');
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
var PileConfig = sims.engine2D.PileConfig;
const Polygon = goog.module.get('myphysicslab.lab.engine2D.Polygon');
const RandomLCG = goog.module.get('myphysicslab.lab.util.RandomLCG');
const Shapes = goog.module.get('myphysicslab.lab.engine2D.Shapes');
var SixThrusters = sims.engine2D.SixThrusters;
const TabLayout = goog.module.get('myphysicslab.sims.common.TabLayout');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var WayPoint = lab.model.CollisionAdvance.WayPoint;

/** Creates a pile of randomly shaped blocks that clump together under mutual
gravitation.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.PileAttractApp = function(elem_ids) {
  var simRect = new DoubleRect(-3, -3, 3, 3);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.layout.simCanvas.setBackground('black');
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
  var pb;
  /** @type {!ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.NUM_BLOCKS,
      PileConfig.i18n.NUM_BLOCKS,
      goog.bind(this.getNumBlocks, this), goog.bind(this.setNumBlocks, this))
      .setDecimalPlaces(0));
  this.addControl(new NumericControl(pn));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.SQUARE_BLOCKS,
      PileConfig.i18n.SQUARE_BLOCKS,
      goog.bind(this.getSquareBlocks, this), goog.bind(this.setSquareBlocks, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.RANDOM_SEED,
      PileConfig.i18n.RANDOM_SEED,
      goog.bind(this.getRandomSeed, this), goog.bind(this.setRandomSeed, this))
      .setDecimalPlaces(0).setLowerLimit(Util.NEGATIVE_INFINITY));

  pn = this.gravityLaw.getParameterNumber(Gravity2Law.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  var c = new ButtonControl(PileConfig.i18n.REBUILD, goog.bind(this.config, this));
  this.addControl(c);

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};
var PileAttractApp = sims.engine2D.PileAttractApp;
goog.inherits(PileAttractApp, Engine2DApp);

/** @override */
PileAttractApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + PileAttractApp.superClass_.toString.call(this);
};

/** @override */
PileAttractApp.prototype.getClassName = function() {
  return 'PileAttractApp';
};

/** @override */
PileAttractApp.prototype.defineNames = function(myName) {
  PileAttractApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('PileConfig|PileAttractApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
PileAttractApp.prototype.getSubjects = function() {
  var subjects = PileAttractApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @return {undefined}
*/
PileAttractApp.prototype.config = function() {
  this.randomSeed = this.buildRNG.getSeed();
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  var half = Math.floor(this.numBlocks/2);
  var rest = this.numBlocks-half;
  var blocks = PileConfig.makeRandomBlocks(this.mySim, /* num blocks=*/half,
      /* x=*/-half/2, /* y=*/1, this.buildRNG, /*rightAngle=*/this.squareBlocks);
  goog.array.extend(blocks, PileConfig.makeRandomBlocks(this.mySim,
      /* num blocks=*/rest, /* x=*/-half/2, /* y=*/-1, this.buildRNG,
      /*rightAngle=*/this.squareBlocks));

  // set random colors for blocks
  goog.array.forEach(blocks, function(b) {
        this.displayList.findShape(b).setFillStyle(PileConfig.getRandomColor());
      }, this);

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
PileAttractApp.prototype.getNumBlocks = function() {
  return this.numBlocks;
};

/**
* @param {number} value
*/
PileAttractApp.prototype.setNumBlocks = function(value) {
  this.numBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.NUM_BLOCKS);
};

/** Returns the seed of the random number generator used to determine sizes of blocks.
* @return {number}
*/
PileAttractApp.prototype.getRandomSeed = function() {
  return this.randomSeed;
};

/** Sets the seed of the random number generator used to determine sizes of blocks
* @param {number} value
*/
PileAttractApp.prototype.setRandomSeed = function(value) {
  this.randomSeed = value;
  this.buildRNG.setSeed(value);
  this.config();
  this.broadcastParameter(PileConfig.en.RANDOM_SEED);
};

/**
* @return {boolean}
*/
PileAttractApp.prototype.getSquareBlocks = function() {
  return this.squareBlocks;
};

/**
* @param {boolean} value
*/
PileAttractApp.prototype.setSquareBlocks = function(value) {
  this.squareBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.SQUARE_BLOCKS);
};

}); // goog.scope
