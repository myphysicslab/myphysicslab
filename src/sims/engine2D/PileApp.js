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

goog.module('myphysicslab.sims.engine2D.PileApp');

const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const ClockTask = goog.require('myphysicslab.lab.util.ClockTask');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const ModifiedEuler = goog.require('myphysicslab.lab.model.ModifiedEuler');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PileConfig = goog.require('myphysicslab.sims.engine2D.PileConfig');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const SixThrusters = goog.require('myphysicslab.sims.engine2D.SixThrusters');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

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
*/
class PileApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  var simRect = new DoubleRect(-3, -0.2, 3, 5.2);
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance, 'PILE_APP');
  /** @type {!ContactSim} */
  this.mySim = sim;
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
  this.task = new ClockTask(6, () => this.config());
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
      () => this.getNumBlocks(), a => this.setNumBlocks(a))
      .setDecimalPlaces(0));
  this.addControl(new NumericControl(pn));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.TWO_PILES,
      PileConfig.i18n.TWO_PILES,
      () => this.getTwoPiles(), a => this.setTwoPiles(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.CONNECTED_BLOCKS,
      PileConfig.i18n.CONNECTED_BLOCKS,
      () => this.getConnectedBlocks(),
      a => this.setConnectedBlocks(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.SQUARE_BLOCKS,
      PileConfig.i18n.SQUARE_BLOCKS,
      () => this.getSquareBlocks(), a => this.setSquareBlocks(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.ENDLESS_LOOP,
      PileConfig.i18n.ENDLESS_LOOP,
      () => this.getEndlessLoop(), a => this.setEndlessLoop(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.LOOP_TIME,
      PileConfig.i18n.LOOP_TIME,
      () => this.getLoopTime(), a => this.setLoopTime(a))
      .setDecimalPlaces(1));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.RANDOM_SEED,
      PileConfig.i18n.RANDOM_SEED,
      () => this.getRandomSeed(), a => this.setRandomSeed(a))
      .setDecimalPlaces(0).setLowerLimit(Util.NEGATIVE_INFINITY));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  /** @type {!ButtonControl} */
  var c = new ButtonControl(PileConfig.i18n.REBUILD, () => this.config());
  this.addControl(c);

  c = new ButtonControl(PileConfig.i18n.ADD_BLOCK, () => this.addBlock());
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
  return 'PileApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('PileConfig|PileApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  var subjects = super.getSubjects();
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @return {undefined}
*/
config() {
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
  goog.array.forEach(blocks, b =>
    this.displayList.findShape(b).setFillStyle(PileConfig.getRandomColor()));

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
addBlock() {
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
getLoopTime() {
  return this.task.getTime();
};

/**
* @param {number} value
*/
setLoopTime(value) {
  this.clock.removeTask(this.task);
  this.task = new ClockTask(value, () => this.config());
  this.clock.addTask(this.task);
  if (this.clock.getTime() > value) {
    this.config();
  }
  this.broadcastParameter(PileConfig.en.LOOP_TIME);
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

/**
* @return {boolean}
*/
getTwoPiles() {
  return this.twoPiles;
};

/**
* @param {boolean} value
*/
setTwoPiles(value) {
  this.twoPiles = value;
  this.config();
  this.broadcastParameter(PileConfig.en.TWO_PILES);
};

/**
* @return {boolean}
*/
getConnectedBlocks() {
  return this.connectedBlocks;
};

/**
* @param {boolean} value
*/
setConnectedBlocks(value) {
  this.connectedBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.CONNECTED_BLOCKS);
};

/**
* @return {boolean}
*/
getEndlessLoop() {
  return this.endlessLoop;
};

/**
* @param {boolean} value
*/
setEndlessLoop(value) {
  this.endlessLoop = value;
  this.config();
  this.broadcastParameter(PileConfig.en.ENDLESS_LOOP);
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
* @param {!TabLayout.elementIds} elem_ids
* @return {!PileApp}
*/
function makePileApp(elem_ids) {
  return new PileApp(elem_ids);
};
goog.exportSymbol('makePileApp', makePileApp);

exports = PileApp;
