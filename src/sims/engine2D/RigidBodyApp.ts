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

import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { RigidBodySim } from '../../lab/engine2D/RigidBodySim.js';
import { Scrim } from '../../lab/engine2D/Scrim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SixThrusters } from './SixThrusters.js';
import { Spring } from '../../lab/model/Spring.js';
import { ThrusterSet } from '../../lab/engine2D/ThrusterSet.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/**  RigidBodyApp demonstrates using RigidBodySim (instead of the usual ContactSim) with
a set of simple rectangular objects.

This app has a {@link config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
export class RigidBodyApp extends Engine2DApp<RigidBodySim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  numBods: number = 5;
  mass1: number = 1;
  thrust: number = 1.5;
  thrust1: ThrusterSet;
  thrust2: ThrusterSet;
  springs_: Spring[] = [];
  restLength: number = 0.75;
  stiffness: number = 1;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-4, -4, 4, 4);
  const sim = new RigidBodySim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.layout.getSimCanvas().setBackground('black');
  this.rbo.protoPolygon.setNameColor('gray');
  this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  this.rbo.protoSpring.setThickness(4);
  this.rbo.protoSpring.setWidth(.4);
  this.elasticity.setElasticity(1.0);
  this.sim.setShowForces(false);
  this.dampingLaw = new DampingLaw(0, 0.1, this.simList);
  this.gravityLaw = new GravityLaw(0, this.simList);

  this.addPlaybackControls();
  let pn = new ParameterNumber(this, RigidBodyApp.en.NUM_BODIES,
      RigidBodyApp.i18n.NUM_BODIES,
      () => this.getNumBodies(), a => this.setNumBodies(a));
  pn.setDecimalPlaces(0);
  pn.setLowerLimit(1);
  pn.setUpperLimit(6);
  this.addParameter(pn);
  this.addControl(new NumericControl(pn));

  pn = new ParameterNumber(this, RigidBodyApp.en.THRUST,
      RigidBodyApp.i18n.THRUST,
      () => this.getThrust(), a => this.setThrust(a));
  this.addParameter(pn);
  this.addControl(new NumericControl(pn));

  pn = new ParameterNumber(this, RigidBodyApp.en.MASS1,
        RigidBodyApp.i18n.MASS1,
        () => this.getMass1(), a => this.setMass1(a))
  this.addParameter(pn);
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  pn = new ParameterNumber(this, RigidBodyApp.en.SPRING_STIFFNESS,
      RigidBodyApp.i18n.SPRING_STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a))
  this.addParameter(pn);
  this.addControl(new NumericControl(pn));

  pn = new ParameterNumber(this, RigidBodyApp.en.SPRING_LENGTH,
      RigidBodyApp.i18n.SPRING_LENGTH,
      () => this.getRestLength(), a => this.setRestLength(a))
  this.addParameter(pn);
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

private addSpring(s: Spring): void {
  this.springs_.push(s);
  this.sim.addForceLaw(s);
  this.simList.add(s);
};

/** @inheritDoc */
getClassName() {
  return 'RigidBodyApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('RigidBodyApp|Engine2DApp',
       'sims$engine2D$', /*addToVars=*/false);
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

private static makeBlock(num: number): RigidBody {
  return Shapes.makeBlock(1, 3, RigidBodyApp.en.BLOCK+num, RigidBodyApp.i18n.BLOCK+num);
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link RigidBodySim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
config(): void {
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  Polygon.ID = 1;
  this.springs_ = [];
  this.advance.reset();
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());

  make_blocks:
  if (this.numBods >= 1) {
    const p1 = RigidBodyApp.makeBlock(1);
    p1.setPosition(new Vector(-3.3,  0),  0);
    p1.setVelocity(new Vector(0.3858,  -0.3608),  -0.3956);
    p1.setMass(this.mass1);
    this.sim.addBody(p1);
    this.thrust2 = SixThrusters.make(this.thrust, p1);
    this.rbeh.setThrusters(this.thrust2, 'left');
    this.sim.addForceLaw(this.thrust2);
    this.addSpring(new Spring('spring 1',
        Scrim.getScrim(), new Vector(-2, -2),
        p1, new Vector(0.15, 0.7),
        this.restLength, this.stiffness));
    this.displayList.findShape(p1).setFillStyle('cyan');

    if (this.numBods < 2) {
      break make_blocks;
    }
    const p2 = RigidBodyApp.makeBlock(2);
    p2.setPosition(new Vector(-2.2,  0),  0);
    p2.setVelocity(new Vector(0.26993,  -0.01696),  -0.30647);
    this.sim.addBody(p2);
    this.thrust1 = SixThrusters.make(this.thrust, p2);
    this.rbeh.setThrusters(this.thrust1, 'right');
    this.sim.addForceLaw(this.thrust1);
    this.addSpring(new Spring('spring 2',
        Scrim.getScrim(), new Vector(2, 2),
        p2, new Vector(0.15, 0.7),
        this.restLength, this.stiffness));
    this.addSpring(new Spring('spring 3',
        p2, new Vector(0.15, -0.7),
        p1, new Vector(0.15, -0.7),
        this.restLength, this.stiffness));
    this.displayList.findShape(p2).setFillStyle('orange');

    if (this.numBods < 3) {
      break make_blocks;
    }
    const p3 = RigidBodyApp.makeBlock(3);
    p3.setPosition(new Vector(2.867,  -0.113),  0);
    p3.setVelocity(new Vector(-0.29445,  -0.11189),  -0.23464);
    this.sim.addBody(p3);
    this.addSpring(new Spring('spring 4',
        p3, new Vector(0.15, 0.7),
        p2, new Vector(0.15, -0.7),
        this.restLength, this.stiffness));
    this.displayList.findShape(p3).setFillStyle('#9f3'); // light green

    if (this.numBods < 4) {
      break make_blocks;
    }
    const p4 = RigidBodyApp.makeBlock(4);
    p4.setPosition(new Vector(1.36,  2.5),  -Math.PI/4);
    p4.setVelocity(new Vector(-0.45535,  -0.37665),  0.36526);
    this.sim.addBody(p4);
    this.addSpring(new Spring('spring 5',
        p4, new Vector(0.15, 0.7),
        p3, new Vector(0.15, -0.7),
        this.restLength, this.stiffness));
    this.displayList.findShape(p4).setFillStyle('#f6c'); // hot pink

    if (this.numBods < 5) {
      break make_blocks;
    }
    const p5 = RigidBodyApp.makeBlock(5);
    p5.setPosition(new Vector(-2,  2.5),  Math.PI/2+0.1);
    this.sim.addBody(p5);
    this.addSpring(new Spring('spring 6',
        p5, new Vector(0.15, 0.7),
        p4, new Vector(0.15, -0.7),
        this.restLength, this.stiffness));
    this.displayList.findShape(p5).setFillStyle('#39f');

    if (this.numBods >= 6) {
      break make_blocks;
    }
    const p6 = RigidBodyApp.makeBlock(6);
    p6.setPosition(new Vector(0.08,  0.127),  0.888);
    this.sim.addBody(p6);
    this.addSpring(new Spring('spring 7',
        p6, new Vector(0.15, 0.7),
        p5, new Vector(0.15, -0.7),
        this.restLength, this.stiffness));
    this.displayList.findShape(p6).setFillStyle('#c99');
  }
  this.sim.getVarsList().setTime(0);
  this.sim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

getMass1(): number {
  return this.mass1;
};

setMass1(value: number): void {
  if (this.mass1 != value) {
    this.mass1 = value;
    const body1 = this.sim.getBody(RigidBodyApp.en.BLOCK+'1');
    body1.setMass(value);
    this.broadcastParameter(RigidBodyApp.en.MASS1);
  }
};

getNumBodies(): number {
  return this.numBods;
};

setNumBodies(value: number): void {
  this.numBods = value;
  this.config();
  this.broadcastParameter(RigidBodyApp.en.NUM_BODIES);
};

getStiffness(): number {
  return this.stiffness;
};

setStiffness(value: number): void {
  this.stiffness = value;
  this.springs_.forEach(s => s.setStiffness(value));
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.sim.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(RigidBodyApp.en.SPRING_STIFFNESS);
};

getRestLength(): number {
  return this.restLength;
};

setRestLength(value: number): void {
  this.restLength = value;
  this.springs_.forEach(s => s.setRestLength(value));
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.sim.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(RigidBodyApp.en.SPRING_LENGTH);
};

getThrust(): number {
  return this.thrust;
};

setThrust(value: number): void {
  this.thrust = value;
  this.thrust1.setMagnitude(value);
  this.thrust2.setMagnitude(value);
  this.broadcastParameter(RigidBodyApp.en.THRUST);
};

static readonly en: i18n_strings = {
  NUM_BODIES: 'number of objects',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  THRUST: 'thrust',
  BLOCK: 'block',
  MASS1: 'mass of block1'
};

static readonly de_strings: i18n_strings = {
  NUM_BODIES: 'Anzahl von Objekten',
  SPRING_LENGTH: 'Federlänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  THRUST: 'Schubkraft',
  BLOCK: 'Block',
  MASS1: 'Masse von Block1'
};

static readonly i18n = Util.LOCALE === 'de' ? RigidBodyApp.de_strings : RigidBodyApp.en;

} // end class

type i18n_strings = {
  NUM_BODIES: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  THRUST: string,
  BLOCK: string,
  MASS1: string
};

Util.defineGlobal('sims$engine2D$RigidBodyApp', RigidBodyApp);
