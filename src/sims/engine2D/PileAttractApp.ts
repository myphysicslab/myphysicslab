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
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { DebugLevel } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { Gravity2Law } from '../../lab/model/Gravity2Law.js';
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

/** Creates a pile of randomly shaped blocks that clump together under mutual
gravitation.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
export class PileAttractApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw = new DampingLaw(0.05, 0.15);
  gravityLaw: Gravity2Law = new Gravity2Law(1);
  numBlocks: number = 8;
  squareBlocks: boolean = false;
  randomSeed: number = 0;
  buildRNG: RandomLCG = new RandomLCG(this.randomSeed);
  zeroEnergyLevel: number = 0;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-3, -3, 3, 3);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.layout.getSimCanvas().setBackground('black');
  this.rbo.protoDragSpring.setWidth(0.3);
  this.rbo.protoPolygon.setDrawCenterOfMass(true);
  // @ts-ignore
  if (0 == 1) {
    // draw names of blocks
    this.rbo.protoPolygon.setNameColor('gray');
    this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  }
  this.elasticity.setElasticity(0.8);
  this.sim.setShowForces(false);
  this.sim.setDistanceTol(0.01);
  this.sim.setCollisionAccuracy(0.6);
  this.diffEqSolver.setDiffEqSolver(ModifiedEuler.en.NAME);
  //this.advance.setDebugLevel(DebugLevel.NONE);

  this.addPlaybackControls();
  let pb: ParameterBoolean;
  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.NUM_BLOCKS,
      PileConfig.i18n.NUM_BLOCKS,
      () => this.getNumBlocks(), a => this.setNumBlocks(a)));
  pn.setDecimalPlaces(0);
  this.addControl(new NumericControl(pn));

  this.addParameter(pb = new ParameterBoolean(this, PileConfig.en.SQUARE_BLOCKS,
      PileConfig.i18n.SQUARE_BLOCKS,
      () => this.getSquareBlocks(), a => this.setSquareBlocks(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, PileConfig.en.RANDOM_SEED,
      PileConfig.i18n.RANDOM_SEED,
      () => this.getRandomSeed(), a => this.setRandomSeed(a)));
  pn.setDecimalPlaces(0);
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);

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

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'PileAttractApp';
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
  this.randomSeed = this.buildRNG.getSeed();
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  const half = Math.floor(this.numBlocks/2);
  const rest = this.numBlocks-half;
  const blocks: RigidBody[] =
      PileConfig.makeRandomBlocks(this.sim, /* num blocks=*/half,
      /* x=*/-half/2, /* y=*/1, this.buildRNG, /*rightAngle=*/this.squareBlocks);
  let b2 = PileConfig.makeRandomBlocks(this.sim,
      /* num blocks=*/rest, /* x=*/-half/2, /* y=*/-1, this.buildRNG,
      /*rightAngle=*/this.squareBlocks);
  b2.forEach((b: RigidBody) => blocks.push(b));

  // set random colors for blocks
  blocks.forEach(b =>
    this.displayList.findShape(b).setFillStyle(PileConfig.getRandomColor()));

  this.sim.setElasticity(elasticity);
  this.sim.getVarsList().setTime(0);
  this.sim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
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
Util.defineGlobal('sims$engine2D$PileAttractApp', PileAttractApp);
