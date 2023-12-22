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
import { ConcreteVertex } from '../../lab/engine2D/ConcreteVertex.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { SixThrusters } from './SixThrusters.js';
import { Spring } from '../../lab/model/Spring.js';
import { ThrusterSet } from '../../lab/engine2D/ThrusterSet.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/** PolygonTestApp shows some unusual shapes such as hexagon, L-shape, hollow box with
a ball inside, and blocks with both curved and straight edges.

This app has a {@link config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
export class PolygonTestApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw = new DampingLaw(0, 0.15, this.simList);
  gravityLaw: GravityLaw = new GravityLaw(3.0, this.simList);
  numBods: number = 8;
  thrust: number = 1.5;
  thrust1: ThrusterSet;
  thrust2: ThrusterSet;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-4, -4, 4, 4);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  this.elasticity.setElasticity(0.8);
  this.sim.setShowForces(false);

  this.addPlaybackControls();
  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, PolygonTestApp.en.NUM_BODIES,
      PolygonTestApp.i18n.NUM_BODIES,
      () => this.getNumBodies(), a => this.setNumBodies(a)));
  pn.setDecimalPlaces(0);
  pn.setLowerLimit(1);
  pn.setUpperLimit(8);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, PolygonTestApp.en.THRUST,
      PolygonTestApp.i18n.THRUST,
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
  return 'PolygonTestApp';
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
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  const zel = Walls.make2(this.sim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);
  let p;
  if (this.numBods >= 1) {
    // rectangle with one circular edge
    p = new Polygon(PolygonTestApp.en.ROUND_CORNER, PolygonTestApp.i18n.ROUND_CORNER);
    p.startPath(new ConcreteVertex(new Vector(0, 1)));
    p.addStraightEdge(new Vector(0, 0), /*outsideIsUp=*/false);
    p.addStraightEdge(new Vector(1, 0), /*outsideIsUp=*/false);
    p.addStraightEdge(new Vector(1, 2), /*outsideIsUp=*/true);
    p.addCircularEdge(/*endPoint=*/new Vector(0, 1),
        /*center=*/new Vector(1, 1), /*clockwise=*/false,
        /*outsideIsOut=*/true);
    p.finish();
    p.setPosition(new Vector(-3.3,  0),  0);
    p.setVelocity(new Vector(0.3858,  -0.3608),  -0.3956);
    this.sim.addBody(p);
    this.thrust2 = SixThrusters.make(this.thrust, p);
    this.rbeh.setThrusters(this.thrust2, 'left');
    this.sim.addForceLaw(this.thrust2);
    let ds = this.displayList.findShape(p);
    ds.setFillStyle('cyan');
    ds.setDrawCenterOfMass(true);
  }
  if (this.numBods >= 2) {
    // small triangular pie wedge with one circular edge
    const r = 1.5;
    p = new Polygon(PolygonTestApp.en.PIE_WEDGE, PolygonTestApp.i18n.PIE_WEDGE);
    p.startPath(new ConcreteVertex(new Vector(0, 0)));
    p.addStraightEdge(new Vector(r, 0), /*outsideIsUp=*/false);
    p.addStraightEdge(new Vector(r, r), /*outsideIsUp=*/true);
    p.addCircularEdge(/*endPoint=*/new Vector(0, 0),
        /*center=*/new Vector(r, 0), /*clockwise=*/false,
        /*outsideIsOut=*/true);
    p.finish();
    p.setDragPoints([new Vector(r*0.75, r*0.25)]);
    p.setPosition(new Vector(2,  -2),  Math.PI);
    p.setVelocity(new Vector(0.26993,  -0.01696),  -0.30647);
    this.sim.addBody(p);
    let ds = this.displayList.findShape(p);
    ds.setFillStyle('orange');
    ds.setDrawCenterOfMass(true);
  }
  if (this.numBods >= 3) {
    p = Shapes.makeHexagon(1.0, PolygonTestApp.en.HEXAGON, PolygonTestApp.i18n.HEXAGON);
    p.setPosition(new Vector(2.867,  -0.113),  0);
    p.setVelocity(new Vector(-0.29445,  -0.11189),  -0.23464);
    this.sim.addBody(p);
    // light green
    this.displayList.findShape(p).setFillStyle('#9f3');
  }
  if (this.numBods >= 4) {
    p = new Polygon(PolygonTestApp.en.L_SHAPE, PolygonTestApp.i18n.L_SHAPE);
    p.startPath(new ConcreteVertex(new Vector(0, 0)));
    p.addStraightEdge(new Vector(2, 0), /*outsideIsUp=*/false);
    p.addStraightEdge(new Vector(2, 0.7), /*outsideIsUp=*/true);
    p.addStraightEdge(new Vector(0.7, 0.7), /*outsideIsUp=*/true);
    p.addStraightEdge(new Vector(0.7, 2), /*outsideIsUp=*/true);
    p.addStraightEdge(new Vector(0, 2), /*outsideIsUp=*/true);
    p.addStraightEdge(new Vector(0, 0), /*outsideIsUp=*/false);
    p.finish();
    p.setCenterOfMass(new Vector(0.8, 0.8));
    p.setPosition(new Vector(1,  2.5),  Math.PI-0.1);
    p.setVelocity(new Vector(-0.45535,  -0.37665),  0.36526);
    this.sim.addBody(p);
    // hot pink
    let ds = this.displayList.findShape(p);
    ds.setFillStyle('#f6c');
    ds.setDrawCenterOfMass(true);
  }
  if (this.numBods >= 5) {
    p = Shapes.makeBall(1.0, PolygonTestApp.en.BALL, PolygonTestApp.i18n.BALL);
    p.setPosition(new Vector(-1, -2.5));
    //p.setPosition(new Vector(-2,  2.5),  Math.PI/2+0.1);
    this.sim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#39f');
  }
  if (this.numBods >= 6) {
    p = Shapes.makeBlock(1.2, 2.8, PolygonTestApp.en.BLOCK, PolygonTestApp.i18n.BLOCK);
    p.setPosition(new Vector(0.08,  0.127),  0.888);
    this.sim.addBody(p);
    this.thrust1 = SixThrusters.make(this.thrust, p);
    this.rbeh.setThrusters(this.thrust1, 'right');
    this.sim.addForceLaw(this.thrust1);
    this.displayList.findShape(p).setFillStyle('#c99');
  }
  if (this.numBods >= 7) {
    p = Shapes.makeFrame(1.8, 1.2, 0.25, PolygonTestApp.en.HOLLOW_BOX,
        PolygonTestApp.i18n.HOLLOW_BOX);
    //p.setPosition(new Vector(-1, -2.5));
    p.setPosition(new Vector(-2, 2.5));
    this.sim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#990');
  }
  if (this.numBods >= 8) {
    p = Shapes.makeBall(0.15, PolygonTestApp.en.BALL_IN_BOX,
        PolygonTestApp.i18n.BALL_IN_BOX);
    p.setPosition(new Vector(-2, 2.5));
    this.sim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#9cc');
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
getNumBodies(): number {
  return this.numBods;
};

/**
* @param value
*/
setNumBodies(value: number) {
  this.numBods = value;
  this.config();
  this.broadcastParameter(PolygonTestApp.en.NUM_BODIES);
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
  this.broadcastParameter(PolygonTestApp.en.THRUST);
};

static readonly en: i18n_strings = {
  NUM_BODIES: 'number of objects',
  THRUST: 'thrust',
  ROUND_CORNER: 'round corner',
  PIE_WEDGE: 'pie wedge',
  HEXAGON: 'hexagon',
  L_SHAPE: 'L-shape',
  BALL: 'ball',
  BLOCK: 'block',
  HOLLOW_BOX: 'hollow box',
  BALL_IN_BOX: 'ball in box'
};

static readonly de_strings: i18n_strings = {
  NUM_BODIES: 'Anzahl von Objekten',
  THRUST: 'Schubkraft',
  ROUND_CORNER: 'runde Ecke',
  PIE_WEDGE: 'Kuchenstück',
  HEXAGON: 'Hexagon',
  L_SHAPE: 'L-Form',
  BALL: 'Ball',
  BLOCK: 'Block',
  HOLLOW_BOX: 'Hohlblock',
  BALL_IN_BOX: 'Ball im Hohlblock'
};

static readonly i18n = Util.LOCALE === 'de' ? PolygonTestApp.de_strings : PolygonTestApp.en;

} // end class

type i18n_strings = {
  NUM_BODIES: string,
  THRUST: string,
  ROUND_CORNER: string,
  PIE_WEDGE: string,
  HEXAGON: string,
  L_SHAPE: string,
  BALL: string,
  BLOCK: string,
  HOLLOW_BOX: string,
  BALL_IN_BOX: string
};
Util.defineGlobal('sims$engine2D$PolygonTestApp', PolygonTestApp);
