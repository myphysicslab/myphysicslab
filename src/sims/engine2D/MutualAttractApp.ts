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
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { Gravity2Law } from '../../lab/model/Gravity2Law.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Simulation showing several objects experiencing mutual attraction from gravity.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
export class MutualAttractApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: Gravity2Law;
  numBods: number = 4;
  circleBody: boolean = true;

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
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(0.8);
  this.sim.setShowForces(false);
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  this.gravityLaw = new Gravity2Law(2, this.simList);

  this.addPlaybackControls();
  let pn: ParameterNumber;
  const choices: string[] = [];
  const values: number[] = [];
  for (let i=2; i<=6; i++) {
    choices.push(i+' '+MutualAttractApp.i18n.OBJECTS);
    values.push(i);
  }
  this.addParameter(pn = new ParameterNumber(this, MutualAttractApp.en.NUMBER_BODIES,
      MutualAttractApp.i18n.NUMBER_BODIES,
      () => this.getNumBodies(), a => this.setNumBodies(a), choices, values));
  pn.setLowerLimit(1);
  pn.setUpperLimit(6);
  this.addControl(new ChoiceControl(pn));

  pn = this.gravityLaw.getParameterNumber(Gravity2Law.en.GRAVITY);
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
  return 'MutualAttractApp';
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

/**
*/
private makeBody(): Polygon {
  return this.circleBody ?  Shapes.makeBall(0.2) : Shapes.makeBlock(1, 1);
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link ContactSim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
config(): void {
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  const v = 0.6;
  for (let i=0; i<this.numBods; i++) {
    let body;
    switch (i) {
    case 0:
      body = this.makeBody();
      body.setPosition(new Vector(-4,  0.5),  0);
      body.setVelocity(new Vector(-0.5,  1.0*v));
      this.sim.addBody(body);
      this.displayList.findShape(body).setFillStyle('green');
      break;
    case 1:
      body = this.makeBody();
      body.setPosition(new Vector(-2.5,  1),  0);
      body.setVelocity(new Vector(1.5*v,  -0.5*v));
      this.sim.addBody(body);
      this.displayList.findShape(body).setFillStyle('blue');
      break;
    case 2:
      body = this.makeBody();
      body.setPosition(new Vector(-0.5,  -3),  0);
      body.setVelocity(new Vector(-1.5*v,  0));
      this.sim.addBody(body);
      this.displayList.findShape(body).setFillStyle('lightGray');
      break;
    case 3:
      body = this.makeBody();
      body.setPosition(new Vector(1,  1),  0);
      body.setVelocity(new Vector(0.5*v,  -0.5*v));
      this.sim.addBody(body);
      this.displayList.findShape(body).setFillStyle('cyan');
      break;
    case 4:
      body = this.makeBody();
      body.setPosition(new Vector(3,  -1),  0);
      this.sim.addBody(body);
      this.displayList.findShape(body).setFillStyle('magenta');
      break;
    case 5:
      body = this.makeBody();
      body.setPosition(new Vector(5,  2),  0);
      this.sim.addBody(body);
      this.displayList.findShape(body).setFillStyle('orange');
      break;
    default:
      throw 'too many bodies';
    }
  }
  this.sim.setElasticity(elasticity);
  this.sim.getVarsList().setTime(0);
  this.sim.saveInitialState();
  this.clock.setTime(this.sim.getTime());
  this.clock.setRealTime(this.sim.getTime());
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
  this.broadcastParameter(MutualAttractApp.en.NUMBER_BODIES);
};

static readonly en: i18n_strings = {
  NUMBER_BODIES: 'number of bodies',
  OBJECTS: 'bodies'
};

static readonly de_strings: i18n_strings = {
  NUMBER_BODIES: 'Anzahl von Körpern',
  OBJECTS: 'Körpern'
};

static readonly i18n = Util.LOCALE === 'de' ? MutualAttractApp.de_strings : MutualAttractApp.en;

} // end class

type i18n_strings = {
  NUMBER_BODIES: string,
  OBJECTS: string
};
