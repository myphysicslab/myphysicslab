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

import { ButtonControl } from '../../lab/controls/ButtonControl.js';
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { ClockTask } from '../../lab/util/Clock.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { DebugLevel } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { ModifiedEuler } from '../../lab/model/ModifiedEuler.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterBoolean, ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { PileConfig } from './PileConfig.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { RandomLCG } from '../../lab/util/Random.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { SixThrusters } from './SixThrusters.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

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

**TO DO**  remove the 'endless loop' checkbox, and instead just have the 'loop time'
numeric control.  To make the UI simpler by having one less UI item.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
export class PileApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw = new DampingLaw(0.05, 0.15);
  gravityLaw: GravityLaw = new GravityLaw(10);
  twoPiles: boolean = false;
  squareBlocks: boolean = false;
  connectedBlocks: boolean = false;
  numBlocks: number = 7;
  endlessLoop: boolean = false;
  /* make a 'repeat' ClockTask which resets the sim every 6 seconds. */
  task: ClockTask;
  randomSeed: number = 0;
  buildRNG: RandomLCG = new RandomLCG(this.randomSeed);
  zeroEnergyLevel: number = 0;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-3, -0.2, 3, 5.2);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance, 'PILE_APP');
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);
  this.rbo.protoPolygon.setNameColor('gray');
  this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  this.elasticity.setElasticity(0.8);
  this.sim.setShowForces(false);
  this.sim.setDistanceTol(0.01);
  this.sim.setCollisionAccuracy(0.6);
  this.diffEqSolver.setDiffEqSolver(ModifiedEuler.en.NAME);
  //this.advance.setDebugLevel(DebugLevel.CUSTOM);
  this.task = new ClockTask(6, () => this.config());

  this.addPlaybackControls();
  let pb: ParameterBoolean;
  let pn: ParameterNumber;
  pn = new ParameterNumber(this, PileConfig.en.NUM_BLOCKS,
      PileConfig.i18n.NUM_BLOCKS,
      () => this.getNumBlocks(), a => this.setNumBlocks(a));
  pn.setDecimalPlaces(0);
  this.addParameter(pn);
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

  pn = new ParameterNumber(this, PileConfig.en.LOOP_TIME,
      PileConfig.i18n.LOOP_TIME,
      () => this.getLoopTime(), a => this.setLoopTime(a));
  pn.setDecimalPlaces(1);
  this.addParameter(pn);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.RANDOM_SEED,
      PileConfig.i18n.RANDOM_SEED,
      () => this.getRandomSeed(), a => this.setRandomSeed(a)));
  pn.setDecimalPlaces(0);
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  let c = new ButtonControl(PileConfig.i18n.REBUILD, () => this.config());
  this.addControl(c);

  c = new ButtonControl(PileConfig.i18n.ADD_BLOCK, () => this.addBlock());
  this.addControl(c);

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'PileApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('PileConfig',
       'sims$engine2D$', /*addToVars=*/false);
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link ContactSim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
config(): void {
  // to build a specific config each time, set buildRNG here.
  //this.buildRNG = new RandomLCG(594074265);
  //console.log('buildRNG.getSeed()='+this.buildRNG.getSeed());
  this.randomSeed = this.buildRNG.getSeed();
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  if (this.endlessLoop) {
    this.clock.addTask(this.task);
  } else {
    this.clock.removeTask(this.task);
  }
  const blocks: RigidBody[] = [];
  if (this.twoPiles) {
    this.zeroEnergyLevel = PileConfig.makeDoubleVPit(this.sim, 5);
    const b2 = PileConfig.makeRandomBlocks(this.sim, this.numBlocks,
         -7, 10, this.buildRNG, /*rightAngle=*/this.squareBlocks);
    b2.forEach((b: RigidBody) => blocks.push(b));
  } else {
    this.zeroEnergyLevel = PileConfig.makeVPit(this.sim, 9.348706704297266);
    const half = Math.floor(this.numBlocks/2);
    const rest = this.numBlocks-half;
    let b2 = PileConfig.makeRandomBlocks(this.sim, rest, -9.9, 19,
        this.buildRNG, /*rightAngle=*/this.squareBlocks);
    b2.forEach((b: RigidBody) => blocks.push(b));
    b2 = PileConfig.makeRandomBlocks(this.sim, half, -9, 16,
          this.buildRNG, /*rightAngle=*/this.squareBlocks);
    b2.forEach((b: RigidBody) => blocks.push(b));
  }
  this.gravityLaw.setZeroEnergyLevel(this.zeroEnergyLevel);

  if (this.connectedBlocks) {
    const connect = PileConfig.makeConnectedBlocks(this.sim, 3, /*y=*/21, /*angle=*/0);
    /* thrust forces are operated by pressing keys like up/down/left/right arrows */
    const thrustForce1 = SixThrusters.make(10.0, connect[0]);
    this.rbeh.setThrusters(thrustForce1, 'right');
    this.sim.addForceLaw(thrustForce1);
    connect.forEach((b: RigidBody) => blocks.push(b));
  }

  // set random colors for blocks
  blocks.forEach(b =>
    this.displayList.findShape(b).setFillStyle(PileConfig.getRandomColor()));

  this.sim.setElasticity(elasticity);
  this.sim.modifyObjects();
  this.sim.getVarsList().setTime(0);
  this.sim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
*/
addBlock(): void {
  const b = this.squareBlocks ? Shapes.makeBlock(1, 1) :
      Shapes.makeRandomPolygon(/*sides=*/4, /*radius=*/0.7);
  b.setPosition(new Vector(0,  10));
  this.sim.addBody(b);
  this.displayList.findShape(b).setFillStyle(PileConfig.getRandomColor());
  this.sim.saveInitialState();
};

/**
*/
getLoopTime(): number {
  return this.task.getTime();
};

/**
* @param value
*/
setLoopTime(value: number) {
  this.clock.removeTask(this.task);
  this.task = new ClockTask(value, () => this.config());
  this.clock.addTask(this.task);
  if (this.clock.getTime() > value) {
    this.config();
  }
  this.broadcastParameter(PileConfig.en.LOOP_TIME);
};

/**
*/
getNumBlocks(): number {
  return this.numBlocks;
};

/**
* @param value
*/
setNumBlocks(value: number) {
  this.numBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.NUM_BLOCKS);
};

/**
*/
getTwoPiles(): boolean {
  return this.twoPiles;
};

/**
* @param value
*/
setTwoPiles(value: boolean) {
  this.twoPiles = value;
  this.config();
  this.broadcastParameter(PileConfig.en.TWO_PILES);
};

/**
*/
getConnectedBlocks(): boolean {
  return this.connectedBlocks;
};

/**
* @param value
*/
setConnectedBlocks(value: boolean) {
  this.connectedBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.CONNECTED_BLOCKS);
};

/**
*/
getEndlessLoop(): boolean {
  return this.endlessLoop;
};

/**
* @param value
*/
setEndlessLoop(value: boolean) {
  this.endlessLoop = value;
  this.config();
  this.broadcastParameter(PileConfig.en.ENDLESS_LOOP);
};

/** Returns the seed of the random number generator used to determine sizes of blocks.
*/
getRandomSeed(): number {
  return this.randomSeed;
};

/** Sets the seed of the random number generator used to determine sizes of blocks
* @param value
*/
setRandomSeed(value: number) {
  this.randomSeed = value;
  this.buildRNG.setSeed(value);
  this.config();
  this.broadcastParameter(PileConfig.en.RANDOM_SEED);
};

/**
*/
getSquareBlocks(): boolean {
  return this.squareBlocks;
};

/**
* @param value
*/
setSquareBlocks(value: boolean) {
  this.squareBlocks = value;
  this.config();
  this.broadcastParameter(PileConfig.en.SQUARE_BLOCKS);
};

} // end class
