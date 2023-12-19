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
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { JointUtil } from '../../lab/engine2D/JointUtil.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Scrim } from '../../lab/engine2D/Scrim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/**
*/
export type NC_options = {
  stickLength: number,
  radius: number,
  gapDistance: number,
  numBods: number,
  startAngle: number,
}

/**  The NewtonsCradleApp simulation shows six pendulums side-by-side, you
lift one at the end and let it strike the others;  only the pendulum on the far side
flies away and the pendulum that you let fall becomes motionless when it strikes.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
export class NewtonsCradleApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  options: NC_options;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-5, -3, 5, 5);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(1.0);
  this.sim.setShowForces(false);
  // JointSmallImpacts==true seems to help with energy stability and joint tightness,
  // but then we get lots of small collisions, which is kind of distracting.
  advance.setJointSmallImpacts(false);
  //this.advance.setDebugLevel(CollisionAdvance.DebugLevel.OPTIMAL);
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  this.gravityLaw = new GravityLaw(32, this.simList);

  this.options = {
      stickLength: 3.0,
      radius: 0.6,
      gapDistance: 0,
      numBods: 5,
      startAngle: -Math.PI/4
    };

  this.addPlaybackControls();
  let pn = new ParameterNumber(this, NewtonsCradleApp.en.NUM_BODIES,
      NewtonsCradleApp.i18n.NUM_BODIES,
      () => this.getNumBodies(), a => this.setNumBodies(a));
  pn.setDecimalPlaces(0);
  pn.setLowerLimit(1);
  pn.setUpperLimit(6);
  this.addParameter(pn);
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, NewtonsCradleApp.en.LENGTH,
      NewtonsCradleApp.i18n.LENGTH,
      () => this.getStickLength(), a => this.setStickLength(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(
      pn = new ParameterNumber(this, NewtonsCradleApp.en.GAP_DISTANCE,
      NewtonsCradleApp.i18n.GAP_DISTANCE,
      () => this.getGapDistance(), a => this.setGapDistance(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, NewtonsCradleApp.en.RADIUS,
      NewtonsCradleApp.i18n.RADIUS,
      () => this.getRadius(), a => this.setRadius(a)));
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
  return 'NewtonsCradleApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/** @inheritDoc */
override graphSetup(body?: RigidBody): void {
  body = body ?? this.sim.getBody('pendulum1');
  this.graph.line.setXVariable(body.getVarsIndex()+4); // angle
  this.graph.line.setYVariable(body.getVarsIndex()+5); // angular velocity
  this.timeGraph.line1.setYVariable(body.getVarsIndex()+4); // angle
  this.timeGraph.line2.setYVariable(body.getVarsIndex()+5); // angular velocity
};

/**
*/
getNumBodies(): number {
  return this.options.numBods;
};

/**
* @param value
*/
setNumBodies(value: number) {
  this.options.numBods = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.NUM_BODIES);
};

/**
*/
getStickLength(): number {
  return this.options.stickLength;
};

/**
* @param value
*/
setStickLength(value: number) {
  this.options.stickLength = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.LENGTH);
};

/**
*/
getGapDistance(): number {
  return this.options.gapDistance;
};

/**
* @param value
*/
setGapDistance(value: number) {
  this.options.gapDistance = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.GAP_DISTANCE);
};

/**
*/
getRadius(): number {
  return this.options.radius;
};

/**
* @param value
*/
setRadius(value: number) {
  this.options.radius = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.RADIUS);
};

/**
*/
config(): void {
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  NewtonsCradleApp.make(this.sim, this.options);
  this.sim.setElasticity(elasticity);
  this.sim.getVarsList().setTime(0);
  this.sim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
* @param sim
* @param options
*/
static make(sim: ContactSim, options: NC_options) {
  // each pendulum is 2*radius wide.
  // We have a gap between pendulums of distTol/2 + gapDistance
  // total width of all pendulums:
  const n = options.numBods;
  const r = options.radius;
  const between = sim.getDistanceTol()/2  + options.gapDistance;
  const tw = n * 2 * r + (n - 1) * between;
  let x = -tw/2 + r;
  for (let i=0; i<options.numBods; i++) {
    const body = Shapes.makePendulum(0.05, options.stickLength,
        options.radius, NewtonsCradleApp.en.PENDULUM+(i+1),
        NewtonsCradleApp.i18n.PENDULUM+(i+1));
    body.setAngle(0);
    sim.addBody(body);
    JointUtil.attachRigidBody(sim,
        Scrim.getScrim(), /* fixed point in world coords=*/new Vector(x, 2),
        body, /* attach point in body coords=*/new Vector(0, options.stickLength),
        /*normalType=*/CoordType.WORLD);
    body.setZeroEnergyLevel();
    // first align with angle = 0, to get zero energy level
    sim.alignConnectors();
    x += body.getWidth() + between;
  }
  // move a body to start position
  sim.getBody('pendulum1').setAngle(options.startAngle); //-Math.PI/4;
  sim.alignConnectors();
};

static readonly en: i18n_strings = {
  GAP_DISTANCE: 'offset',
  PENDULUM: 'pendulum',
  NUM_BODIES: 'pendulums',
  LENGTH: 'pendulum length',
  RADIUS: 'radius'
};

static readonly de_strings: i18n_strings = {
  GAP_DISTANCE: 'Zwischenraum',
  PENDULUM: 'Pendel',
  NUM_BODIES: 'Pendelanzahl',
  LENGTH: 'Pendellänge',
  RADIUS: 'Radius'
};

static readonly i18n = Util.LOCALE === 'de' ? NewtonsCradleApp.de_strings : NewtonsCradleApp.en;

} // end class

type i18n_strings = {
  GAP_DISTANCE: string,
  PENDULUM: string,
  NUM_BODIES: string,
  LENGTH: string,
  RADIUS: string
};
Util.defineGlobal('sims$engine2D$NewtonsCradleApp', NewtonsCradleApp);
