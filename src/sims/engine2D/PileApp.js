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

goog.provide('myphysicslab.sims.engine2D.PileApp');

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
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.model.ModifiedEuler');
goog.require('myphysicslab.lab.util.ClockTask');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.RandomLCG');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
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
const ClockTask = goog.module.get('myphysicslab.lab.util.ClockTask');
const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.module.get('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.module.get('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.module.get('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DApp = sims.engine2D.Engine2DApp;
const GravityLaw = goog.module.get('myphysicslab.lab.model.GravityLaw');
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

/** Creates a pile of randomly shaped blocks that fall onto a V shaped
wall. The user can add 6 blocks at a time to the pile by clicking a button. This is a
stress test to find how many blocks it takes before the simulation engine bogs down and
cannot keep up with real time.

## Wiggling Blocks

Note that the blocks in the pile will wiggle unrealistically in the end resting state
when there is not enough accuracy in the simulation. It is most noticeable when highly
zoomed in on the blocks, so that the gaps between them are obvious. The three main
factors are: gravity, time step, and diff eq solver. Stronger gravity means that objects
move more between time steps and so will wiggle more. Longer time step gives objects
more time to wiggle between adjustments from the collision handler. Using the Runge
Kutta solver is like halving the time step, compared to using the Modified Euler solver
(because RK is average of 4 sub-steps, two of which are mid-step).

Specifically here are some settings and their effects:

+ Wiggles:  Gravity=10, TimeStep=0.025, Modified Euler
+ No Wiggle:  Gravity=10, TimeStep=0.01, Modified Euler
+ No Wiggle:  Gravity=10, TimeStep=0.025, Runge Kutta
+ No Wiggle:  Gravity=3, TimeStep=0.025, Modified Euler


Update Nov 2011: The fix to ContactSim.calculate_b_vector which "adjusts acceleration
to eliminate velocity at contacts" has eliminated the wiggling in the above cases. One
case that is still problematic is when using inverse square gravity: with gravity=10 you
need to reduce the timeStep to 0.01 to stop endless collisions.

@todo  remove the 'endless loop' checkbox, and instead just have the 'loop time'
numeric control.  To make the UI simpler by having one less UI item.

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
sims.engine2D.PileApp = function(elem_ids) {
  var simRect = new DoubleRect(-3, -0.2, 3, 5.2);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance, 'PILE_APP');
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  this.rbo.protoPolygon.setNameColor('gray').setNameFont('10pt sans-serif');
  this.elasticity.setElasticity(0.8);
  this.mySim.setShowForces(false);
  this.mySim.setDistanceTol(0.01);
  this.mySim.setCollisionAccuracy(0.6);
  this.diffEqSolver.setDiffEqSolver(ModifiedEuler.en.NAME);
  //this.advance.setDebugLevel(CollisionAdvance.DebugLevel.CUSTOM);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0.05, 0.15);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(10);
  /** @type {boolean} */
  this.twoPiles = false;
  /** @type {boolean} */
  this.squareBlocks = false;
  /** @type {boolean} */
  this.connectedBlocks = false;
  /** @type {number} */
  this.numBlocks = 7;
  /** @type {boolean} */
  this.endlessLoop = false;
  /* make a 'repeat' ClockTask which resets the sim every 6 seconds. */
  /** @type {!ClockTask} */
  this.task = new ClockTask(6, goog.bind(this.config, this));
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

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.TWO_PILES,
      PileConfig.i18n.TWO_PILES,
      goog.bind(this.getTwoPiles, this), goog.bind(this.setTwoPiles, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.CONNECTED_BLOCKS,
      PileConfig.i18n.CONNECTED_BLOCKS,
      goog.bind(this.getConnectedBlocks, this),
      goog.bind(this.setConnectedBlocks, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.SQUARE_BLOCKS,
      PileConfig.i18n.SQUARE_BLOCKS,
      goog.bind(this.getSquareBlocks, this), goog.bind(this.setSquareBlocks, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.ENDLESS_LOOP,
      PileConfig.i18n.ENDLESS_LOOP,
      goog.bind(this.getEndlessLoop, this), goog.bind(this.setEndlessLoop, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.LOOP_TIME,
      PileConfig.i18n.LOOP_TIME,
      goog.bind(this.getLoopTime, this), goog.bind(this.setLoopTime, this))
      .setDecimalPlaces(1));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.RANDOM_SEED,
      PileConfig.i18n.RANDOM_SEED,
      goog.bind(this.getRandomSeed, this), goog.bind(this.setRandomSeed, this))
      .setDecimalPlaces(0).setLowerLimit(Util.NEGATIVE_INFINITY));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  /** @type {!ButtonControl} */
  var c = new ButtonControl(PileConfig.i18n.REBUILD, goog.bind(this.config, this));
  this.addControl(c);

  c = new ButtonControl(PileConfig.i18n.ADD_BLOCK, goog.bind(this.addBlock, this));
  this.addControl(c);

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};
var PileApp = sims.engine2D.PileApp;
goog.inherits(PileApp, Engine2DApp);

/** @override */
PileApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + PileApp.superClass_.toString.call(this);
};

/** @override */
PileApp.prototype.getClassName = function() {
  return 'PileApp';
};

/** @override */
PileApp.prototype.defineNames = function(myName) {
  PileApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('PileConfig|PileApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
PileApp.prototype.getSubjects = function() {
  var subjects = PileApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @return {undefined}
*/
PileApp.prototype.config = function() {
  // to build a specific config each time, set buildRNG here.
  //this.buildRNG = new RandomLCG(594074265);
  //console.log('buildRNG.getSeed()='+this.buildRNG.getSeed());
  this.randomSeed = this.buildRNG.getSeed();
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  if (this.endlessLoop) {
    this.clock.addTask(this.task);
  } else {
    this.clock.removeTask(this.task);
  }
  var blocks = [];
  if (this.twoPiles) {
    this.zeroEnergyLevel = PileConfig.makeDoubleVPit(this.mySim, 5);
    goog.array.extend(blocks, PileConfig.makeRandomBlocks(this.mySim, this.numBlocks,
         -7, 10, this.buildRNG, /*rightAngle=*/this.squareBlocks));
  } else {
    this.zeroEnergyLevel = PileConfig.makeVPit(this.mySim, 9.348706704297266);
    var half = Math.floor(this.numBlocks/2);
    var rest = this.numBlocks-half;
    goog.array.extend(blocks, PileConfig.makeRandomBlocks(this.mySim, rest, -9.9, 19,
        this.buildRNG, /*rightAngle=*/this.squareBlocks));
    goog.array.extend(blocks, PileConfig.makeRandomBlocks(this.mySim, half, -9, 16,
          this.buildRNG, /*rightAngle=*/this.squareBlocks));
  }
  this.gravityLaw.setZeroEnergyLevel(this.zeroEnergyLevel);

  if (this.connectedBlocks) {
    var connect = PileConfig.makeConnectedBlocks(this.mySim, 3, /*y=*/21, /*angle=*/0);
    /* thrust forces are operated by pressing keys like up/down/left/right arrows */
    var thrustForce1 = SixThrusters.make(10.0, connect[0]);
    this.rbeh.setThrusters(thrustForce1, 'right');
    this.mySim.addForceLaw(thrustForce1);
    goog.array.extend(blocks, connect);
  }

  // set random colors for blocks
  goog.array.forEach(blocks, function(b) {
        this.displayList.findShape(b).setFillStyle(PileConfig.getRandomColor());
      }, this);

  this.mySim.setElasticity(elasticity);
  this.mySim.modifyObjects();
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
* @return {undefined}
*/
PileApp.prototype.addBlock = function() {
  var b = this.squareBlocks ? Shapes.makeBlock(1, 1) :
      Shapes.makeRandomPolygon(/*sides=*/4, /*radius=*/0.7);
  b.setPosition(new Vector(0,  10));
  this.mySim.addBody(b);
  this.displayList.findShape(b).setFillStyle(PileConfig.getRandomColor());
  this.mySim.saveInitialState();
};

/**
* @return {number}
*/
PileApp.prototype.getLoopTime = function() {
  return this.task.getTime();
};

/**
* @param {number} value
*/
PileApp.prototype.setLoopTime = function(value) {
  this.clock.removeTask(this.task);
  this.task = new ClockTask(value, goog.bind(this.config, this));
  this.clock.addTask(this.task);
  if (this.clock.getTime() > value) {
    this.config();
  }
  this.broadcastParameter(PileConfig.en.LOOP_TIME);
};

/**
* @return {number}
*/
PileApp.prototype.getNumBlocks = function() {
  return this.numBlocks;
};

/**
* @param {number} value
*/
PileApp.prototype.setNumBlocks = function(value) {
  this.numBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.NUM_BLOCKS);
};

/**
* @return {boolean}
*/
PileApp.prototype.getTwoPiles = function() {
  return this.twoPiles;
};

/**
* @param {boolean} value
*/
PileApp.prototype.setTwoPiles = function(value) {
  this.twoPiles = value;
  this.config();
  this.broadcastParameter(PileConfig.en.TWO_PILES);
};

/**
* @return {boolean}
*/
PileApp.prototype.getConnectedBlocks = function() {
  return this.connectedBlocks;
};

/**
* @param {boolean} value
*/
PileApp.prototype.setConnectedBlocks = function(value) {
  this.connectedBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.CONNECTED_BLOCKS);
};

/**
* @return {boolean}
*/
PileApp.prototype.getEndlessLoop = function() {
  return this.endlessLoop;
};

/**
* @param {boolean} value
*/
PileApp.prototype.setEndlessLoop = function(value) {
  this.endlessLoop = value;
  this.config();
  this.broadcastParameter(PileConfig.en.ENDLESS_LOOP);
};

/** Returns the seed of the random number generator used to determine sizes of blocks.
* @return {number}
*/
PileApp.prototype.getRandomSeed = function() {
  return this.randomSeed;
};

/** Sets the seed of the random number generator used to determine sizes of blocks
* @param {number} value
*/
PileApp.prototype.setRandomSeed = function(value) {
  this.randomSeed = value;
  this.buildRNG.setSeed(value);
  this.config();
  this.broadcastParameter(PileConfig.en.RANDOM_SEED);
};

/**
* @return {boolean}
*/
PileApp.prototype.getSquareBlocks = function() {
  return this.squareBlocks;
};

/**
* @param {boolean} value
*/
PileApp.prototype.setSquareBlocks = function(value) {
  this.squareBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.SQUARE_BLOCKS);
};

}); // goog.scope
