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

import { ChainConfig, Chain_options } from './ChainConfig.js';
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { ExtraAccel } from '../../lab/engine2D/ExtraAccel.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { SimView } from '../../lab/view/SimView.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { GenericObserver, ParameterBoolean, ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/** Simulation of a chain of rigid bodies.

This app has a {@link ChainApp.config} method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------
+ ParameterNumber named `NUM_LINKS`, see {@link ChainApp.setNumLinks}.

+ ParameterBoolean named `WALLS`, see {@link ChainApp.setWalls}

+ ParameterBoolean named `EXTRA_BODY`, see {@link ChainApp.setExtraBody}

+ ParameterBoolean named `FIXED_LEFT`, see {@link ChainApp.setFixedLeft}

+ ParameterBoolean named `FIXED_RIGHT`, see {@link ChainApp.setFixedRight}

+ ParameterNumber named `FIXED_LEFT_X`, see {@link ChainApp.setFixedLeftX}.

+ ParameterNumber named `BLOCK_LENGTH`, see {@link ChainApp.setBlockLength}.

+ ParameterNumber named `BLOCK_WIDTH`, see {@link ChainApp.setBlockWidth}.

*/
export class ChainApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  private debug_: boolean;
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  options: Chain_options;
  extraBody: boolean = true;
  walls: boolean = true;
  wallWidth: number;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-12, -12, 12, 12);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.debug_ = false;
  this.sim.setShowForces(true);
  // Important to stop joints from drifting apart, otherwise energy is not stable.
  // alternative: could use CollisionAdvance.setJointSmallImpacts(true)
  this.sim.setExtraAccel(ExtraAccel.VELOCITY_JOINTS);
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  this.gravityLaw = new GravityLaw(4, this.simList);
  this.elasticity.setElasticity(0.8);
  this.options = {
      wallPivotX: -5,
      wallPivotY: 4,
      fixedLeft: true,
      fixedRight: true,
      blockWidth: 1.0,
      blockHeight: 3.0,
      numLinks: 7
    };
  this.wallWidth = this.simView.getSimRect().getWidth();

  this.addPlaybackControls();
  let pb: ParameterBoolean;
  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, ChainConfig.en.NUM_LINKS,
      ChainConfig.i18n.NUM_LINKS,
      () => this.getNumLinks(), a => this.setNumLinks(a)));
  pn.setDecimalPlaces(0);
  this.addControl(new NumericControl(pn));

  this.addParameter(pb = new ParameterBoolean(this, ChainConfig.en.WALLS,
      ChainConfig.i18n.WALLS,
      () => this.getWalls(), a => this.setWalls(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, ChainConfig.en.WALL_WIDTH,
      ChainConfig.i18n.WALL_WIDTH,
      () => this.getWallWidth(), a => this.setWallWidth(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pb = new ParameterBoolean(this, ChainConfig.en.EXTRA_BODY,
      ChainConfig.i18n.EXTRA_BODY,
      () => this.getExtraBody(), a => this.setExtraBody(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, ChainConfig.en.FIXED_LEFT,
      ChainConfig.i18n.FIXED_LEFT,
      () => this.getFixedLeft(), a => this.setFixedLeft(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, ChainConfig.en.FIXED_RIGHT,
      ChainConfig.i18n.FIXED_RIGHT,
      () => this.getFixedRight(), a => this.setFixedRight(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, ChainConfig.en.FIXED_LEFT_X,
      ChainConfig.i18n.FIXED_LEFT_X,
      () => this.getFixedLeftX(), a => this.setFixedLeftX(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, ChainConfig.en.BLOCK_LENGTH,
      ChainConfig.i18n.BLOCK_LENGTH,
      () => this.getBlockLength(), a => this.setBlockLength(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, ChainConfig.en.BLOCK_WIDTH,
      ChainConfig.i18n.BLOCK_WIDTH,
      () => this.getBlockWidth(), a => this.setBlockWidth(a)));
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  // @ts-ignore
  if (0 == 1) {
    // Demonstration: Force the graph's simRect to match the simView.
    // Note: the screenRect is different between graphCanvas and simCanvas,
    // so they won't be identical.  To fix that you can do:
    const sr = this.layout.getSimCanvas().getScreenRect();
    this.layout.getGraphCanvas().setScreenRect(sr);
    this.graph.displayGraph.setScreenRect(sr);
    // this totally disables the AutoScale
    this.graph.autoScale.setEnabled(false);
    // Note that you can still use the pan-zoom controls on the graph, but
    // they are overridden whenever you pan-zoom the simView.
    const matcher = new GenericObserver(this.simView,
      evt => {
        if (evt.nameEquals(SimView.SIM_RECT_CHANGED)) {
          this.graph.view.setSimRect(this.simView.getSimRect());
        }
      }, 'ensure graph\'s simRect matches simView');
    this.graph.view.setSimRect(this.simView.getSimRect());
  }

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup(this.sim.getBody('chain-2'));
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
  return 'ChainApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('ChainConfig|Engine2DApp',
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
  if (this.debug_) {
    // show names of objects
    this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  }
  this.rbo.protoPolygon.setFillStyle('rgba(255,255,255,0.5)');
  this.rbo.protoPolygon.setStrokeStyle('black');
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  this.advance.reset();
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  let r = ChainConfig.makeChain(this.sim, this.options);
  if (this.extraBody) {
    const block = Shapes.makeBlock(1, 3, ChainConfig.en.EXTRA_BODY,
        ChainConfig.i18n.EXTRA_BODY);
    block.setPosition(new Vector(-4,  -4));
    this.sim.addBody(block);
    this.displayList.findShape(block).setFillStyle('blue');
    r = r.union(block.getBoundsWorld());
  }
  if (this.walls) {
    /* ensure walls are wide apart enough to contain chain and extra body */
    r = r.scale(1.1);
    const wr = DoubleRect.makeCentered(Vector.ORIGIN, this.wallWidth, this.wallWidth);
    const zel = Walls.make2(this.sim, wr.union(r));
    this.gravityLaw.setZeroEnergyLevel(zel);
  }
  this.sim.setElasticity(elasticity);
  this.sim.getVarsList().setTime(0);
  this.sim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
*/
getNumLinks(): number {
  return this.options.numLinks;
};

/**
* @param value
*/
setNumLinks(value: number) {
  this.options.numLinks = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.NUM_LINKS);
};

/**
*/
getWalls(): boolean {
  return this.walls;
};

/**
* @param value
*/
setWalls(value: boolean) {
  this.walls = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.WALLS);
};

/**
*/
getWallWidth(): number {
  return this.wallWidth;
};

/**
* @param value
*/
setWallWidth(value: number) {
  this.wallWidth = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.WALL_WIDTH);
};

/**
*/
getExtraBody(): boolean {
  return this.extraBody;
};

/**
* @param value
*/
setExtraBody(value: boolean) {
  this.extraBody = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.EXTRA_BODY);
};

/**
*/
getFixedLeft(): boolean {
  return this.options.fixedLeft;
};

/**
* @param value
*/
setFixedLeft(value: boolean) {
  this.options.fixedLeft = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.FIXED_LEFT);
};

/**
*/
getFixedRight(): boolean {
  return this.options.fixedRight;
};

/**
* @param value
*/
setFixedRight(value: boolean) {
  this.options.fixedRight = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.FIXED_RIGHT);
};

/**
*/
getFixedLeftX(): number {
  return this.options.wallPivotX;
};

/**
* @param value
*/
setFixedLeftX(value: number) {
  this.options.wallPivotX = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.FIXED_LEFT_X);
};

/**
*/
getFixedLeftY(): number {
  return this.options.wallPivotY;
};

/**
* @param value
*/
setFixedLeftY(value: number) {
  this.options.wallPivotY = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.FIXED_LEFT_Y);
};

/**
*/
getBlockLength(): number {
  return this.options.blockHeight;
};

/**
* @param value
*/
setBlockLength(value: number) {
  this.options.blockHeight = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.BLOCK_LENGTH);
};

/**
*/
getBlockWidth(): number {
  return this.options.blockWidth;
};

/**
* @param value
*/
setBlockWidth(value: number) {
  this.options.blockWidth = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.BLOCK_WIDTH);
};

} // end class
Util.defineGlobal('sims$engine2D$ChainApp', ChainApp);
