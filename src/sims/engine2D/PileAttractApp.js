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
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.Gravity2Law');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.ModifiedEuler');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.RandomLCG');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.engine2D.PileConfig');
goog.require('myphysicslab.sims.engine2D.SixThrusters');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var ButtonControl = lab.controls.ButtonControl;
var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.layout.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var DampingLaw = lab.model.DampingLaw;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var Gravity2Law = lab.model.Gravity2Law;
var ModifiedEuler = lab.model.ModifiedEuler;
var NumericControl = lab.controls.NumericControl;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var PileConfig = sims.engine2D.PileConfig;
var Polygon = lab.engine2D.Polygon;
var RandomLCG = lab.util.RandomLCG;
var Shapes = lab.engine2D.Shapes;
var SixThrusters = sims.engine2D.SixThrusters;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;
var WayPoint = lab.model.CollisionAdvance.WayPoint;

/** Creates a pile of randomly shaped blocks that clump together under mutual
gravitation.

This sim has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!sims.layout.TabLayout.elementIds} elem_ids specifies the names of the HTML
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
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
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
  /** @type {!lab.model.DampingLaw} */
  this.dampingLaw = new DampingLaw(0.05, 0.15);
  /** @type {!lab.model.Gravity2Law} */
  this.gravityLaw = new Gravity2Law(1);
  /** @type {number} */
  this.numBlocks = 8;
  /** @type {boolean} */
  this.squareBlocks = false;
  /** @type {number} */
  this.randomSeed = 0;
  /** @type {!lab.util.RandomLCG} */
  this.buildRNG = new RandomLCG(this.randomSeed);
  /** @type {number} */
  this.zeroEnergyLevel = 0;

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterBoolean} */
  var pb;
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.NUM_BLOCKS,
      PileConfig.i18n.NUM_BLOCKS,
      this.getNumBlocks, this.setNumBlocks).setDecimalPlaces(0));
  this.addControl(new NumericControl(pn));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.SQUARE_BLOCKS,
      PileConfig.i18n.SQUARE_BLOCKS,
      this.getSquareBlocks, this.setSquareBlocks));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.RANDOM_SEED,
      PileConfig.i18n.RANDOM_SEED,
      this.getRandomSeed, this.setRandomSeed).setDecimalPlaces(0)
      .setLowerLimit(UtilityCore.NEGATIVE_INFINITY));

  pn = this.gravityLaw.getParameterNumber(Gravity2Law.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  var c = new ButtonControl(PileConfig.i18n.REBUILD, goog.bind(this.config, this));
  this.addControl(c);

  this.makeScriptParser();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};
var PileAttractApp = sims.engine2D.PileAttractApp;
goog.inherits(PileAttractApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  PileAttractApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        +', gravityLaw: '+this.gravityLaw.toStringShort()
        + PileAttractApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
PileAttractApp.prototype.getClassName = function() {
  return 'PileAttractApp';
};

/** @inheritDoc */
PileAttractApp.prototype.defineNames = function(myName) {
  PileAttractApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName);
  this.terminal.addRegex('PileConfig|PileAttractApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
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
        this.displayList.find(b).setFillStyle(PileConfig.getRandomColor());
      }, this);

  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.scriptParser.update();
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
