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

import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DisplayList } from '../../lab/view/DisplayList.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { Layout } from '../common/Layout.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { GenericObserver, ParameterString, ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { RigidBodySim } from '../../lab/engine2D/RigidBodySim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/**
*/
export const enum Formation {
  ONE_HITS_THREE = 0,
  ONE_HITS_SIX = 1,
};

/** Simulation of a table top billiards game with several balls bouncing against each
other and against the sides of the table.

This app has a {@link BilliardsApp.config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------

+ ParameterNumber named `FORMATION`, see {@link BilliardsApp.setFormation}.

+ ParameterNumber named `OFFSET`, see {@link BilliardsApp.setOffset}

+ ParameterNumber named `SPEED`, see {@link BilliardsApp.setSpeed}

*/
export class BilliardsApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  //mySim: ContactSim;
  dampingLaw: DampingLaw;
  offset: number = 0;
  speed: number = 30;
  formation: Formation = Formation.ONE_HITS_SIX;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  //this.mySim = sim;
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(0.95);
  this.sim.setShowForces(false);
  //this.advance.setDebugLevel(CollisionAdvance.DebugLevel.LOW);
  this.dampingLaw = new DampingLaw(/*damping=*/0.1, /*rotateRatio=*/0.15,
      this.simList);

  this.addPlaybackControls();
  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, BilliardsApp.en.FORMATION,
      BilliardsApp.i18n.FORMATION,
      () => this.getFormation(), a => this.setFormation(a),
      [ BilliardsApp.i18n.ONE_HITS_THREE,
        BilliardsApp.i18n.ONE_HITS_SIX ],
      [ Formation.ONE_HITS_THREE,
        Formation.ONE_HITS_SIX ]));
  this.addControl(new ChoiceControl(pn));

  this.addParameter(pn = new ParameterNumber(this, BilliardsApp.en.OFFSET,
      BilliardsApp.i18n.OFFSET,
      () => this.getOffset(), a => this.setOffset(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, BilliardsApp.en.SPEED,
      BilliardsApp.i18n.SPEED,
      () => this.getSpeed(), a => this.setSpeed(a)));
  this.addControl(new NumericControl(pn));

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  let ps = this.sim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  this.addControl(new ChoiceControl(ps));

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'BilliardsApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('dampingLaw',
       myName+'.');
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw);
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link ContactSim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
config(): void {
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  this.advance.reset();
  BilliardsApp.make(this.sim, this.displayList, this.formation, this.offset,
      this.speed);
  this.sim.setElasticity(elasticity);
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.saveInitialState();
  this.clock.setTime(this.sim.getTime());
  this.clock.setRealTime(this.sim.getTime());
  this.easyScript.update();
};

/**
* @param sim
* @param displayList
* @param formation
* @param offset gap between balls
* @param speed initial velocity of cue ball
*/
static make(sim: ContactSim, displayList: DisplayList, formation: Formation, offset: number, speed: number) {
  const r = 0.5;
  const x1 = (2*r + sim.getDistanceTol()/2 + offset) * Math.sqrt(3)/2.0;
  switch (formation) {
    // @ts-ignore
    case Formation.ONE_HITS_SIX:
      let body = BilliardsApp.makeBall(4, r);
      body.setPosition(new Vector(2*x1,  0),  0);
      sim.addBody(body);
      displayList.findShape(body).setFillStyle('aqua');

      body = BilliardsApp.makeBall(5, r);
      body.setPosition(new Vector(2*x1, 2*r+sim.getDistanceTol()/4 + offset/2), 0);
      sim.addBody(body);
      displayList.findShape(body).setFillStyle('fuchsia');

      body = BilliardsApp.makeBall(6, r);
      body.setPosition(new Vector(2*x1, -2*r-sim.getDistanceTol()/4 - offset/2), 0);
      sim.addBody(body);
      displayList.findShape(body).setFillStyle('orange');

      // INTENTIONAL FALL THRU to next case
    case Formation.ONE_HITS_THREE:
      const body0 = BilliardsApp.makeBall(0, r);
      body0.setPosition(new Vector(-BilliardsApp.WALL_DISTANCE+1,  0),  0);
      body0.setVelocity(new Vector(speed,  0),  0);
      sim.addBody(body0);
      let ds = displayList.findShape(body0);
      ds.setStrokeStyle('black');
      ds.setFillStyle('white');

      const body1 = BilliardsApp.makeBall(1, r);
      body1.setPosition(new Vector(0,  0),  0);
      sim.addBody(body1);
      displayList.findShape(body1).setFillStyle('red');

      const body2 = BilliardsApp.makeBall(2, r);
      body2.setPosition(new Vector(x1, r + sim.getDistanceTol()/4 + offset/2), 0);
      sim.addBody(body2);
      displayList.findShape(body2).setFillStyle('green');

      const body3 = BilliardsApp.makeBall(3, r);
      body3.setPosition(new Vector(x1, -r - sim.getDistanceTol()/4 - offset/2), 0);
      sim.addBody(body3);
      displayList.findShape(body3).setFillStyle('blue');
      break;
    default:
      throw '';
  }
  const sz = 2 * BilliardsApp.WALL_DISTANCE;
  Walls.make(sim, /*width=*/sz, /*height=*/sz, /*thickness=*/1.0);
};

/**
* @param num
* @param radius
*/
private static makeBall(num: number, radius: number): Polygon {
  return Shapes.makeBall(radius, BilliardsApp.en.BALL+num, BilliardsApp.i18n.BALL+num);
};

/**
*/
getFormation(): number {
  return this.formation;
};

/**
* @param value
*/
setFormation(value: number) {
  this.formation = value as Formation;
  this.config();
  this.broadcastParameter(BilliardsApp.en.FORMATION);
};

/**
*/
getOffset(): number {
  return this.offset;
};

/**
* @param value
*/
setOffset(value: number) {
  this.offset = value;
  this.config();
  this.broadcastParameter(BilliardsApp.en.OFFSET);
};

/**
*/
getSpeed(): number {
  return this.speed;
};

/**
* @param value
*/
setSpeed(value: number) {
  this.speed = value;
  this.config();
  this.broadcastParameter(BilliardsApp.en.SPEED);
};

static WALL_DISTANCE = 6;

static readonly en: i18n_strings = {
  FORMATION: 'formation',
  ONE_HITS_THREE: 'one hits three',
  ONE_HITS_SIX: 'one hits six',
  OFFSET: 'offset',
  SPEED: 'speed',
  BALL: 'ball'
};

static readonly de_strings: i18n_strings = {
  FORMATION: 'Formation',
  ONE_HITS_THREE: 'eins schlägt drei',
  ONE_HITS_SIX: 'eins schlägt sechs',
  OFFSET: 'Abstand',
  SPEED: 'Geschwindigkeit',
  BALL: 'Ball'
};

static readonly i18n = Util.LOCALE === 'de' ? BilliardsApp.de_strings : BilliardsApp.en;

} // end class

type i18n_strings = {
  FORMATION: string,
  ONE_HITS_THREE: string,
  ONE_HITS_SIX: string,
  OFFSET: string,
  SPEED: string,
  BALL: string
};
