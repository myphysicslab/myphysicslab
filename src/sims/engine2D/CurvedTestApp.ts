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
import { DisplayList } from '../../lab/view/DisplayList.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { SixThrusters } from './SixThrusters.js';
import { Spring } from '../../lab/model/Spring.js';
import { ThrusterSet } from '../../lab/engine2D/ThrusterSet.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/**  CurvedTestApp shows some ball and rectangle objects bouncing
among some fixed ball and rectangle objects.

This app has a {@link config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------
+ ParameterNumber named `NUM_BODIES`, see {@link setNumBodies}.

+ ParameterNumber named `THRUST`, see {@link setThrust}

*/
export class CurvedTestApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  numBods: number = 6;
  thrust: number = 1.5;
  thrust1: ThrusterSet;
  thrust2: ThrusterSet;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-4, -6, 8, 6);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.rbo.protoPolygon.setDrawCenterOfMass(true);
  this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  this.rbo.protoSpring.setWidth(0.3);
  this.sim.setShowForces(true);
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  this.gravityLaw = new GravityLaw(3.0, this.simList);
  this.elasticity.setElasticity(0.8);

  this.addPlaybackControls();
  let pn = new ParameterNumber(this, CurvedTestApp.en.NUM_BODIES,
      CurvedTestApp.i18n.NUM_BODIES,
      () => this.getNumBodies(), a => this.setNumBodies(a));
  pn.setDecimalPlaces(0);
  pn.setLowerLimit(1);
  pn.setUpperLimit(6);
  this.addParameter(pn);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, CurvedTestApp.en.THRUST,
      CurvedTestApp.i18n.THRUST,
      () => this.getThrust(), a => this.setThrust(a)));
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
  return 'CurvedTestApp';
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

/** Rebuilds the simulation based on current options selected. Starts with
* {@link ContactSim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
config(): void {
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  this.advance.reset();
  CurvedTestApp.make(this.sim, this.gravityLaw, this.dampingLaw,
      this.numBods, this.simView.getSimRect(), this.displayList);
  let b;
  if (this.numBods >= 1) {
    b = this.sim.getBody('block1');
    this.thrust2 = SixThrusters.make(this.thrust, b);
    this.rbeh.setThrusters(this.thrust2, 'left');
    this.sim.addForceLaw(this.thrust2);
  }
  if (this.numBods >= 2) {
    b = this.sim.getBody('ball2');
    this.thrust1 = SixThrusters.make(this.thrust, b);
    this.rbeh.setThrusters(this.thrust1, 'right');
    this.sim.addForceLaw(this.thrust1);
  }
  this.sim.setElasticity(elasticity);
  this.sim.saveInitialState();
  this.clock.setTime(this.sim.getTime());
  this.clock.setRealTime(this.sim.getTime());
  this.easyScript.update();
};

/** Adds a set of circular and rectangular Polygons to the ContactSim.
* @param sim the ContactSim to add bodies to
* @param gravity the GravityLaw to connect bodies to
* @param damping the DampingLaw to connect bodies to
* @param numBods number of free moving bodies to make, from 1 to 6.
* @param simRect rectangle for making a set of enclosing
*   walls, in simulation coords.
* @param displayList
*/
static make(sim: ContactSim, gravity: GravityLaw, damping: DampingLaw, numBods: number, simRect: DoubleRect, displayList: null|DisplayList): void {
  sim.addForceLaw(damping);
  damping.connect(sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.connect(sim.getSimList());
  let b;
  b = Shapes.makeBlock(2.0, 2.0, CurvedTestApp.en.FIX_BLOCK+1,
      CurvedTestApp.i18n.FIX_BLOCK+1);
  b.setMass(Infinity);
  b.setPosition(new Vector(-0.4,  -4.6),  -Math.PI/16);
  sim.addBody(b);
  b = Shapes.makeBall(2, CurvedTestApp.en.FIX_BALL+2,
      CurvedTestApp.i18n.FIX_BALL+2);
  b.setMass(Infinity);
  b.setPosition(new Vector(3,  2.5-4.5-0.1), 0);
  sim.addBody(b);
  b = Shapes.makeBlock(2.0, 2.0, CurvedTestApp.en.FIX_BLOCK+3,
      CurvedTestApp.i18n.FIX_BLOCK+3);
  b.setMass(Infinity);
  b.setPosition(new Vector(-3.4,  -4.6),  Math.PI/16);
  sim.addBody(b);
  b = Shapes.makeBlock(1.5, 4, CurvedTestApp.en.FIX_BLOCK+4,
      CurvedTestApp.i18n.FIX_BLOCK+4);
  b.setMass(Infinity);
  b.setPosition(new Vector(6.7, -1.0), -0.2);
  sim.addBody(b);
  if (numBods >= 1) {
    b = Shapes.makeBlock(0.8, 1.5, CurvedTestApp.en.BLOCK+1,
      CurvedTestApp.i18n.BLOCK+1);
    b.setPosition(new Vector(-2.0,  -2),  0);
    sim.addBody(b);
    if (displayList != null) { displayList.findShape(b).setFillStyle('cyan'); };
  }
  if (numBods >= 2) {
    b = Shapes.makeBall(0.8, CurvedTestApp.en.BALL+2,
        CurvedTestApp.i18n.BALL+2);
    b.setCenterOfMass(new Vector(b.getLeftBody() + 0.5*b.getWidth(),
        b.getBottomBody() + 0.2*b.getHeight()));
    b.setPosition(new Vector(-1.7,  1),  0);
    sim.addBody(b);
    if (displayList != null) { displayList.findShape(b).setFillStyle('orange'); };
  }
  if (numBods >= 3) {
    b = Shapes.makeBall(1, CurvedTestApp.en.BALL+2,
        CurvedTestApp.i18n.BALL+2);
    let x = 0;
    let y = -1 + 2.0;
    x += 1 - 0.5;
    y += 1 - 0.3;
    b.setPosition(new Vector(x, 0.1+y+ sim.getDistanceTol() / 2.0), Math.PI);
    sim.addBody(b);
    if (displayList != null) { displayList.findShape(b).setFillStyle('#9f3'); };
  }
  if (numBods >= 4) {
    b = Shapes.makeBlock(0.8, 2, CurvedTestApp.en.BLOCK+4,
        CurvedTestApp.i18n.BLOCK+4);
    b.setMass(2);
    b.setPosition(new Vector(5, 0), 0.2);
    sim.addBody(b);
    if (displayList != null) { displayList.findShape(b).setFillStyle('#f6c'); };
  }
  if (numBods >= 5) {
    b = Shapes.makeBall(0.4, CurvedTestApp.en.BALL+5,
        CurvedTestApp.i18n.BALL+5);
    b.setMass(1.5);
    b.setPosition(new Vector(5.9, 2));
    sim.addBody(b);
    if (displayList != null) { displayList.findShape(b).setFillStyle('#39f'); };
  }
  if (numBods >= 6) {
    b = Shapes.makeBall(1.0, CurvedTestApp.en.BALL+6,
        CurvedTestApp.i18n.BALL+6);
    b.setMass(1.0);
    b.setPosition(new Vector(-2.5,  4));
    sim.addBody(b);
    if (displayList != null) { displayList.findShape(b).setFillStyle('#c99'); };
  }
  const zel = Walls.make2(sim, simRect);
  gravity.setZeroEnergyLevel(zel);
};

/**
*/
getNumBodies(): number {
  return this.numBods;
};

/**
* @param value
*/
setNumBodies(value: number) {
  this.numBods = value;
  this.config();
  this.broadcastParameter(CurvedTestApp.en.NUM_BODIES);
};

/**
*/
getThrust(): number {
  return this.thrust;
};

/**
* @param value
*/
setThrust(value: number) {
  this.thrust = value;
  this.thrust1.setMagnitude(value);
  this.thrust2.setMagnitude(value);
  this.broadcastParameter(CurvedTestApp.en.THRUST);
};

static readonly en: i18n_strings = {
  NUM_BODIES: 'number of objects',
  THRUST: 'thrust',
  BALL: 'ball',
  BLOCK: 'block',
  FIX_BALL: 'fixed ball',
  FIX_BLOCK: 'fixed block'
};

static readonly de_strings: i18n_strings = {
  NUM_BODIES: 'Anzahl von Objekten',
  THRUST: 'Schubkraft',
  BALL: 'Ball',
  BLOCK: 'Block',
  FIX_BALL: 'Festball',
  FIX_BLOCK: 'Festblock'
};

static readonly i18n = Util.LOCALE === 'de' ? CurvedTestApp.de_strings : CurvedTestApp.en;

} // end class

type i18n_strings = {
  NUM_BODIES: string,
  THRUST: string,
  BALL: string,
  BLOCK: string,
  FIX_BALL: string,
  FIX_BLOCK: string
};
Util.defineGlobal('sims$engine2D$CurvedTestApp', CurvedTestApp);
