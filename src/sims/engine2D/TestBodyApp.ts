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

import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CollisionHandling } from '../../lab/engine2D/CollisionHandling.js';
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { ExtraAccel } from '../../lab/engine2D/ExtraAccel.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, ParameterString, Subject, SubjectList } from '../../lab/util/Observe.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { RigidBodySim } from '../../lab/engine2D/RigidBodySim.js';
import { Scrim } from '../../lab/engine2D/Scrim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/** TestBodyApp is meant for close observation of contacts and collisions for
debugging.
*/
export class TestBodyApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  block: Polygon;
  spring: Spring;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-10, -6, 10, 6);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  this.sim.addForceLaw(this.dampingLaw);
  this.gravityLaw = new GravityLaw(0, this.simList);
  this.sim.addForceLaw(this.gravityLaw);
  this.block = Shapes.makeBlock2(1, 3, TestBodyApp.en.BLOCK, TestBodyApp.i18n.BLOCK);
  this.block.setPosition(new Vector(0,  -5.49500),  -7.85398);
  this.sim.addBody(this.block);
  let ds = this.displayList.findShape(this.block);
  ds.setFillStyle('#ccf');
  ds.setNameColor('gray');
  ds.setNameFont('12pt sans-serif');
  ds.setNameRotate(Math.PI/2);

  this.spring = new Spring('spring',
      this.block, new Vector(0.5, 2.7),
      Scrim.getScrim(), new Vector(-1, -2),
      /*restLength=*/0, /*stiffness=*/3.0);
  this.sim.addForceLaw(this.spring);
  this.simList.add(this.spring);

  const zel = Walls.make2(this.sim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);

  this.addPlaybackControls();

  let ps = this.sim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  this.addControl(new ChoiceControl(ps));
  ps = this.sim.getParameterString(RigidBodySim.en.EXTRA_ACCEL);
  this.addControl(new ChoiceControl(ps));

  let pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup(this.sim.getBody('block'));
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
  return 'TestBodyApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw|block|spring',
       myName+'.');
};

override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/** @inheritDoc */
override setup(): void {
  this.terminal.afterErrorFn = ()=>this.layout.showTerminal(true);
  const t = this.terminal;
  t.eval('//setup commands');
  t.eval('gravityLaw.setGravity(8);');
  t.eval('dampingLaw.setDamping(0);');
  t.eval('sim.setElasticity(0.2);');
  t.eval('sim.setCollisionHandling("serial grouped lastpass");');
  t.eval('sim.setShowForces(true);');
  t.eval('simView.setSimRect(new DoubleRect(-1.73762, -6.09127, -1.29572, -5.82613));');
  t.eval('clock.setTimeRate(0.1);');
  t.eval('statusList.add(displayClock);');
  t.eval('statusList.add(energyGraph);');
  t.eval('simRun.setTimeStep(0.01);');
  t.eval('block.setZeroEnergyLevel(-4.5);');
  t.eval('//end of setup commands');
  super.setup();
};

static readonly en: i18n_strings = {
  BLOCK: 'block'
};

static readonly de_strings: i18n_strings = {
  BLOCK: 'Block'
};

static readonly i18n = Util.LOCALE === 'de' ? TestBodyApp.de_strings : TestBodyApp.en;

} // end class

type i18n_strings = {
  BLOCK: string
};
Util.defineGlobal('sims$engine2D$TestBodyApp', TestBodyApp);
