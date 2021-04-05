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

goog.module('myphysicslab.sims.engine2D.CarSuspensionApp');

const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const JointUtil = goog.require('myphysicslab.lab.engine2D.JointUtil');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/** Simulation of a car suspension modelled in two different ways: each wheel has either
two springs, or a rigid rod and a spring.

This app has a {@link #configure} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------

+ ParameterNumber named `FORMATION`, see {@link #setFormation}.

+ ParameterNumber named `SPRING_DAMPING`, see {@link #setSpringDamping}

+ ParameterNumber named `STIFFNESS`, see {@link #setStiffness}

*/
class CarSuspensionApp extends Engine2DApp {
/**
* @param {!Object} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  const simRect = new DoubleRect(-7, -5, 7, 5);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  this.rbo.protoSpring.setWidth(0.3);
  /** @type {!DisplayShape} */
  this.protoWheel = new DisplayShape().setFillStyle('#CCF');
  this.mySim.setShowForces(false);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(/*damping=*/0.1, /*rotateRatio=*/0.15,
      this.simList);
  this.elasticity.setElasticity(0.8);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(10, this.simList);
  /** @type {!Array<!Spring>} */
  this.springs = [];
  /** @type {CarSuspensionApp.Formation} */
  this.formation = CarSuspensionApp.Formation.ROD_SPRING;
  /** @type {number} */
  this.wheelMass = 0.1;
  /** @type {number} */
  this.carMass = 2;
  /** @type {number} */
  this.stiffness = 60;
  /** @type {number} */
  this.springDamping = 0.5;
  /** @type {number} */
  this.springLength = Math.sqrt(0.6 * 0.6 + 1);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  let pn;
  this.addParameter(pn = new ParameterNumber(this, CarSuspensionApp.en.FORMATION,
      CarSuspensionApp.i18n.FORMATION,
      () => this.getFormation(), a => this.setFormation(a),
      [ CarSuspensionApp.i18n.ROD_SPRING,
        CarSuspensionApp.i18n.TWO_SPRINGS ],
      [ CarSuspensionApp.Formation.ROD_SPRING,
        CarSuspensionApp.Formation.TWO_SPRINGS ]));
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

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'CarSuspensionApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('dampingLaw|gravityLaw|protoWheel',
      myName+'.');
  this.terminal.addRegex('CarSuspensionApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/**
* @param {!Spring} s
* @private
*/
addSpring(s) {
  s.setDamping(this.springDamping);
  this.mySim.addForceLaw(s);
  this.mySim.getSimList().add(s);
  this.springs.push(s);
};

/**
* @return {undefined}
* @private
*/
configure() {
  const elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.springs = [];
  const car = Shapes.makeBlock(5.0, 2.0, CarSuspensionApp.en.CAR,
      CarSuspensionApp.i18n.CAR);
  car.setMass(this.carMass);
  car.setPosition(new Vector(0,  -1),  0);
  this.mySim.addBody(car);
  this.displayList.findShape(car).setFillStyle('lightGray');
  switch (this.formation) {
    case CarSuspensionApp.Formation.TWO_SPRINGS:
      const wheel1 = Shapes.makeBall(0.4, CarSuspensionApp.en.WHEEL+1,
          CarSuspensionApp.i18n.WHEEL+1);
      wheel1.setMass(this.wheelMass);
      wheel1.setPosition(new Vector(-1.0,  -3.0),  0);
      this.mySim.addBody(wheel1);
      this.displayList.findShape(wheel1).setPrototype(this.protoWheel);
      const wheel2 = Shapes.makeBall(0.4, CarSuspensionApp.en.WHEEL+2,
          CarSuspensionApp.i18n.WHEEL+2);
      wheel2.setMass(this.wheelMass);
      wheel2.setPosition(new Vector(2.0,  -3.0),  0);
      this.mySim.addBody(wheel2);
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
    case CarSuspensionApp.Formation.ROD_SPRING:
      const p1 = Shapes.makePendulum(0.05, this.springLength, 0.4,
          CarSuspensionApp.en.WHEEL+1, CarSuspensionApp.i18n.WHEEL+1);
      p1.setAngle(0);
      this.mySim.addBody(p1);
      this.displayList.findShape(p1).setPrototype(this.protoWheel);
      JointUtil.attachRigidBody(this.mySim,
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
      this.mySim.addBody(p2);
      this.displayList.findShape(p2).setPrototype(this.protoWheel);
      JointUtil.attachRigidBody(this.mySim,
          car, /*attach1_body=*/new Vector(0.9, -1.0),
          p2, /*attach2_body=*/new Vector(0, this.springLength),
          /*normalType=*/CoordType.WORLD
          );
      this.addSpring(new Spring('spring2',
          car, new Vector(2.1, -1.0),
          p2, Vector.ORIGIN,
          this.springLength, this.stiffness));
          this.mySim.alignConnectors();
      break;
    default:
      throw '';
  }
  Walls.make(this.mySim, /*width=*/14, /*height=*/10, /*thickness=*/1.0);
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  this.mySim.setElasticity(elasticity);
  this.mySim.saveInitialState();
  this.clock.setTime(this.mySim.getTime());
  this.clock.setRealTime(this.mySim.getTime());
  this.easyScript.update();
};

/**
* @return {number}
*/
getFormation() {
  return this.formation;
};

/**
* @param {number} value
*/
setFormation(value) {
  this.formation = /** @type {CarSuspensionApp.Formation} */(value);
  this.configure();
  this.broadcastParameter(CarSuspensionApp.en.FORMATION);
};

/**
* @return {number}
*/
getSpringDamping() {
  return this.springDamping;
};

/**
* @param {number} value
*/
setSpringDamping(value) {
  this.springDamping = value;
  for (let i=0; i<this.springs.length; i++) {
    this.springs[i].setDamping(this.springDamping);
  }
  this.broadcastParameter(CarSuspensionApp.en.SPRING_DAMPING);
};

/**
* @return {number}
*/
getStiffness() {
  return this.stiffness;
};

/**
* @param {number} value
*/
setStiffness(value) {
  this.stiffness = value;
  for (let i=0; i<this.springs.length; i++) {
    this.springs[i].setStiffness(this.stiffness);
  }
  this.broadcastParameter(CarSuspensionApp.en.STIFFNESS);
};

} // end class

/**
* @enum {number}
*/
CarSuspensionApp.Formation = {
  ROD_SPRING: 0,
  TWO_SPRINGS: 1
};

/** Set of internationalized strings.
@typedef {{
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
  }}
*/
CarSuspensionApp.i18n_strings;

/**
@type {CarSuspensionApp.i18n_strings}
*/
CarSuspensionApp.en = {
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

/**
@private
@type {CarSuspensionApp.i18n_strings}
*/
CarSuspensionApp.de_strings = {
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

/** Set of internationalized strings.
@type {CarSuspensionApp.i18n_strings}
*/
CarSuspensionApp.i18n = goog.LOCALE === 'de' ? CarSuspensionApp.de_strings :
    CarSuspensionApp.en;

/**
* @param {!Object} elem_ids
* @return {!CarSuspensionApp}
*/
function makeCarSuspensionApp(elem_ids) {
  return new CarSuspensionApp(elem_ids);
};
goog.exportSymbol('makeCarSuspensionApp', makeCarSuspensionApp);

exports = CarSuspensionApp;
