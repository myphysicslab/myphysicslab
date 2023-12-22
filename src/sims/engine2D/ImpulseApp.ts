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

import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { DebugLevel } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { ImpulseSim } from '../../lab/engine2D/ImpulseSim.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { SixThrusters } from './SixThrusters.js';
import { ThrusterSet } from '../../lab/engine2D/ThrusterSet.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/**  ImpulseApp demonstrates using ImpulseSim (instead of the usual ContactSim) with
a set of simple rectangular objects.

This app has a {@link config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
export class ImpulseApp extends Engine2DApp<ImpulseSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  numBods: number = 3;
  mass1: number = 1;
  thrust: number = 1.5;
  thrust1: ThrusterSet;
  thrust2: ThrusterSet;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  //advance.setDebugLevel(DebugLevel.HIGH);
  super(elem_ids, simRect, sim, advance);
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.LONG_TRAILS);
  this.elasticity.setElasticity(1.0);
  this.sim.setShowForces(true);
  this.dampingLaw = new DampingLaw(0, 0.1, this.simList);
  this.gravityLaw = new GravityLaw(0, this.simList);
  this.thrust1;
  this.thrust2;

  this.addPlaybackControls();
  let pn = new ParameterNumber(this, ImpulseApp.en.NUM_BODIES,
      ImpulseApp.i18n.NUM_BODIES,
      () => this.getNumBodies(), a => this.setNumBodies(a));
  pn.setDecimalPlaces(0);
  pn.setLowerLimit(1);
  pn.setUpperLimit(6);
  this.addParameter(pn);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, ImpulseApp.en.THRUST,
      ImpulseApp.i18n.THRUST,
      () => this.getThrust(), a => this.setThrust(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, ImpulseApp.en.MASS1,
      ImpulseApp.i18n.MASS1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

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
  return 'ImpulseApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('ImpulseApp|Engine2DApp',
       'sims$engine2D$', /*addToVars=*/false);
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

private static makeBlock(num: number): RigidBody {
  return Shapes.makeBlock(1, 3, ImpulseApp.en.BLOCK+num, ImpulseApp.i18n.BLOCK+num);
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link ImpulseSim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
config(): void {
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  this.advance.reset();
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  const zel = Walls.make2(this.sim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);
  let p;
  this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  if (this.numBods >= 1) {
    p = ImpulseApp.makeBlock(1);
    p.setPosition(new Vector(-5.3,  0),  0);
    p.setVelocity(new Vector(1,  -0.3608),  -0.3956);
    p.setMass(this.mass1);
    this.sim.addBody(p);
    this.displayList.findShape(p).setFillStyle('cyan')
    this.thrust2 = SixThrusters.make(this.thrust, p);
    this.rbeh.setThrusters(this.thrust2, 'left');
    this.sim.addForceLaw(this.thrust2);
  }
  if (this.numBods >= 2) {
    p = ImpulseApp.makeBlock(2);
    p.setPosition(new Vector(-2.2,  0),  0);
    p.setVelocity(new Vector(-1,  -0.01696),  0.30647);
    this.sim.addBody(p);
    this.displayList.findShape(p).setFillStyle('orange')
    this.thrust1 = SixThrusters.make(this.thrust, p);
    this.rbeh.setThrusters(this.thrust1, 'right');
    this.sim.addForceLaw(this.thrust1);
  }
  if (this.numBods >= 3) {
    p = ImpulseApp.makeBlock(3);
    p.setPosition(new Vector(2.867,  -0.113),  0);
    p.setVelocity(new Vector(-0.29445,  -0.11189),  -0.23464);
    this.sim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#9f3'); // light green
  }
  if (this.numBods >= 4) {
    p = ImpulseApp.makeBlock(4);
    p.setPosition(new Vector(1.36,  2.5),  -Math.PI/4);
    p.setVelocity(new Vector(-0.45535,  -0.37665),  0.36526);
    this.sim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#f6c'); // hot pink
  }
  if (this.numBods >= 5) {
    p = ImpulseApp.makeBlock(5);
    p.setPosition(new Vector(-2,  2.5),  Math.PI/2+0.1);
    this.sim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#39f');
  }
  if (this.numBods >= 6) {
    p = ImpulseApp.makeBlock(6);
    p.setPosition(new Vector(0.08,  0.127),  0.888);
    this.sim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#c99');
  }
  this.sim.setElasticity(elasticity);
  this.sim.getVarsList().setTime(0);
  this.sim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

getNumBodies(): number {
  return this.numBods;
};

setNumBodies(value: number): void {
  this.numBods = value;
  this.config();
  this.broadcastParameter(ImpulseApp.en.NUM_BODIES);
};

getThrust(): number {
  return this.thrust;
};

setThrust(value: number): void {
  this.thrust = value;
  this.thrust1.setMagnitude(value);
  this.thrust2.setMagnitude(value);
  this.broadcastParameter(ImpulseApp.en.THRUST);
};

getMass1(): number {
  return this.mass1;
};

setMass1(value: number): void {
  if (this.mass1 != value) {
    this.mass1 = value;
    const body1 = this.sim.getBody(ImpulseApp.en.BLOCK+'1');
    body1.setMass(value);
    this.broadcastParameter(ImpulseApp.en.MASS1);
  }
};

static readonly en: i18n_strings = {
  NUM_BODIES: 'number of objects',
  THRUST: 'thrust',
  BLOCK: 'block',
  MASS1: 'mass of block1'
};

static readonly de_strings: i18n_strings = {
  NUM_BODIES: 'Anzahl von Objekten',
  THRUST: 'Schubkraft',
  BLOCK: 'Block',
  MASS1: 'Masse von Block1'
};

static readonly i18n = Util.LOCALE === 'de' ? ImpulseApp.de_strings : ImpulseApp.en;

} // end class

type i18n_strings = {
  NUM_BODIES: string,
  THRUST: string,
  BLOCK: string,
  MASS1: string
};

Util.defineGlobal('sims$engine2D$ImpulseApp', ImpulseApp);
