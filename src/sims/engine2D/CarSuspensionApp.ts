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
import { CoordType } from '../../lab/model/CoordType.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { JointUtil } from '../../lab/engine2D/JointUtil.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/**
*/
export const enum Formation {
  ROD_SPRING = 0,
  TWO_SPRINGS = 1
};

/** Simulation of a car suspension modelled in two different ways: each wheel has either
two springs, or a rigid rod and a spring.

This app has a {@link CarSuspensionApp.configure} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------

+ ParameterNumber named `FORMATION`, see {@link CarSuspensionApp.setFormation}.

+ ParameterNumber named `SPRING_DAMPING`, see {@link CarSuspensionApp.setSpringDamping}

+ ParameterNumber named `STIFFNESS`, see {@link CarSuspensionApp.setStiffness}

*/
export class CarSuspensionApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  //mySim: ContactSim;
  protoWheel: DisplayShape;
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  springs: Spring[] = [];
  formation: Formation = Formation.ROD_SPRING;
  wheelMass: number = 0.1;
  carMass: number = 2;
  stiffness: number = 60;
  springDamping: number = 0.5;
  springLength: number = Math.sqrt(0.6 * 0.6 + 1);

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-7, -5, 7, 5);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  //this.mySim = sim;
  this.rbo.protoSpring.setWidth(0.3);
  this.protoWheel = new DisplayShape();
  this.protoWheel.setFillStyle('#CCF');
  this.sim.setShowForces(false);
  this.dampingLaw = new DampingLaw(/*damping=*/0.1, /*rotateRatio=*/0.15,
      this.simList);
  this.elasticity.setElasticity(0.8);
  this.gravityLaw = new GravityLaw(10, this.simList);

  this.addPlaybackControls();
  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, CarSuspensionApp.en.FORMATION,
      CarSuspensionApp.i18n.FORMATION,
      () => this.getFormation(), a => this.setFormation(a),
      [ CarSuspensionApp.i18n.ROD_SPRING,
        CarSuspensionApp.i18n.TWO_SPRINGS ],
      [ Formation.ROD_SPRING,
        Formation.TWO_SPRINGS ]));
  this.addControl(new ChoiceControl(pn));

  this.addParameter(pn = new ParameterNumber(this, CarSuspensionApp.en.SPRING_DAMPING,
      CarSuspensionApp.i18n.SPRING_DAMPING,
     () => this.getSpringDamping(), a => this.setSpringDamping(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, CarSuspensionApp.en.STIFFNESS,
      CarSuspensionApp.i18n.STIFFNESS,
     () => this.getStiffness(), a => this.setStiffness(a)));
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.configure();
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
  return 'CarSuspensionApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('dampingLaw|gravityLaw|protoWheel',
      myName+'.');
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/**
* @param s
*/
private addSpring(s: Spring) {
  s.setDamping(this.springDamping);
  this.sim.addForceLaw(s);
  this.sim.getSimList().add(s);
  this.springs.push(s);
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link ContactSim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
private configure(): void {
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  this.advance.reset();
  this.springs = [];
  const car = Shapes.makeBlock(5.0, 2.0, CarSuspensionApp.en.CAR,
      CarSuspensionApp.i18n.CAR);
  car.setMass(this.carMass);
  car.setPosition(new Vector(0,  -1),  0);
  this.sim.addBody(car);
  this.displayList.findShape(car).setFillStyle('lightGray');
  switch (this.formation) {
    case Formation.TWO_SPRINGS:
      const wheel1 = Shapes.makeBall(0.4, CarSuspensionApp.en.WHEEL+1,
          CarSuspensionApp.i18n.WHEEL+1);
      wheel1.setMass(this.wheelMass);
      wheel1.setPosition(new Vector(-1.0,  -3.0),  0);
      this.sim.addBody(wheel1);
      this.displayList.findShape(wheel1).setPrototype(this.protoWheel);
      const wheel2 = Shapes.makeBall(0.4, CarSuspensionApp.en.WHEEL+2,
          CarSuspensionApp.i18n.WHEEL+2);
      wheel2.setMass(this.wheelMass);
      wheel2.setPosition(new Vector(2.0,  -3.0),  0);
      this.sim.addBody(wheel2);
      this.displayList.findShape(wheel2).setPrototype(this.protoWheel);
      this.addSpring(new Spring('spring1',
          car, new Vector(-2.1, -1.0),
          wheel1, Vector.ORIGIN,
          this.springLength, this.stiffness));
      this.addSpring(new Spring('spring2',
          car, new Vector(-0.9, -1.0),
          wheel1, Vector.ORIGIN,
          this.springLength, this.stiffness));
      this.addSpring(new Spring('spring3',
          car, new Vector(0.9, -1.0),
          wheel2, Vector.ORIGIN,
          this.springLength, this.stiffness));
      this.addSpring(new Spring('spring4',
          car, new Vector(2.1, -1.0),
          wheel2, Vector.ORIGIN,
          this.springLength, this.stiffness));
      break;
    case Formation.ROD_SPRING:
      const p1 = Shapes.makePendulum(0.05, this.springLength, 0.4,
          CarSuspensionApp.en.WHEEL+1, CarSuspensionApp.i18n.WHEEL+1);
      p1.setAngle(0);
      this.sim.addBody(p1);
      this.displayList.findShape(p1).setPrototype(this.protoWheel);
      JointUtil.attachRigidBody(this.sim,
          car, /*attach1_body=*/new Vector(-0.9, -1.0),
          p1, /*attach2_body*/new Vector(0, this.springLength),
          /*normalType=*/CoordType.WORLD
          );
      this.addSpring(new Spring('spring1',
          car, new Vector(-2.1, -1.0),
          p1, Vector.ORIGIN,
          this.springLength, this.stiffness));
      const p2 = Shapes.makePendulum(0.05, this.springLength, 0.4,
          CarSuspensionApp.en.WHEEL+2, CarSuspensionApp.i18n.WHEEL+2);
      p2.setAngle(0);
      this.sim.addBody(p2);
      this.displayList.findShape(p2).setPrototype(this.protoWheel);
      JointUtil.attachRigidBody(this.sim,
          car, /*attach1_body=*/new Vector(0.9, -1.0),
          p2, /*attach2_body=*/new Vector(0, this.springLength),
          /*normalType=*/CoordType.WORLD
          );
      this.addSpring(new Spring('spring2',
          car, new Vector(2.1, -1.0),
          p2, Vector.ORIGIN,
          this.springLength, this.stiffness));
          this.sim.alignConnectors();
      break;
    default:
      throw '';
  }
  Walls.make(this.sim, /*width=*/14, /*height=*/10, /*thickness=*/1.0);
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  this.sim.setElasticity(elasticity);
  this.sim.saveInitialState();
  this.clock.setTime(this.sim.getTime());
  this.clock.setRealTime(this.sim.getTime());
  this.easyScript.update();
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
  this.configure();
  this.broadcastParameter(CarSuspensionApp.en.FORMATION);
};

/**
*/
getSpringDamping(): number {
  return this.springDamping;
};

/**
* @param value
*/
setSpringDamping(value: number) {
  this.springDamping = value;
  for (let i=0; i<this.springs.length; i++) {
    this.springs[i].setDamping(this.springDamping);
  }
  this.broadcastParameter(CarSuspensionApp.en.SPRING_DAMPING);
};

/**
*/
getStiffness(): number {
  return this.stiffness;
};

/**
* @param value
*/
setStiffness(value: number) {
  this.stiffness = value;
  for (let i=0; i<this.springs.length; i++) {
    this.springs[i].setStiffness(this.stiffness);
  }
  this.broadcastParameter(CarSuspensionApp.en.STIFFNESS);
};

static readonly en: i18n_strings = {
  CAR_MASS: 'car mass',
  FORMATION: 'formation',
  LENGTH: 'spring length',
  ROD_SPRING: 'rod and spring',
  SPRING_DAMPING: 'spring damping',
  STIFFNESS: 'spring stiffness',
  TWO_SPRINGS: 'two springs',
  WHEEL_MASS: 'wheel mass',
  WHEEL: 'wheel',
  CAR: 'car'
};

static readonly de_strings: i18n_strings = {
  CAR_MASS: 'Auto Masse',
  FORMATION: 'Formation',
  LENGTH: 'Federlänge',
  ROD_SPRING: 'Stange und Feder',
  SPRING_DAMPING: 'Federdämpfung',
  STIFFNESS: 'Federsteifheit',
  TWO_SPRINGS: 'zwei Feder',
  WHEEL_MASS: 'Rad Masse',
  WHEEL: 'Rad',
  CAR: 'Auto'
};

static readonly i18n = Util.LOCALE === 'de' ? CarSuspensionApp.de_strings : CarSuspensionApp.en;

} // end class

type i18n_strings = {
  CAR_MASS: string,
  FORMATION: string,
  LENGTH: string,
  ROD_SPRING: string,
  SPRING_DAMPING: string,
  STIFFNESS: string,
  TWO_SPRINGS: string,
  WHEEL_MASS: string,
  WHEEL: string,
  CAR: string
};
