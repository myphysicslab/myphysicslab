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

goog.provide('myphysicslab.sims.engine2D.CarSuspensionApp');

goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.engine2D.Joint');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var NumericControl = lab.controls.NumericControl;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.layout.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var CoordType = lab.model.CoordType;
var DampingLaw = lab.model.DampingLaw;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var GravityLaw = lab.model.GravityLaw;
var Joint = lab.engine2D.Joint;
var ParameterNumber = lab.util.ParameterNumber;
var Shapes = lab.engine2D.Shapes;
var Spring = lab.model.Spring;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;
var Walls = lab.engine2D.Walls;

/** Simulation of a car suspension modelled in two different ways: each wheel has either
two springs, or a rigid rod and a spring.

This sim has a `configure` function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!sims.layout.TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
myphysicslab.sims.engine2D.CarSuspensionApp = function(elem_ids) {
  var simRect = new DoubleRect(-7, -5, 7, 5);
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.rbo.protoSpring.setWidth(0.3);
  this.protoWheel = new DisplayShape().setFillStyle('#CCF');
  this.mySim.setShowForces(false);
  /** @type {!lab.model.DampingLaw} */
  this.dampingLaw = new DampingLaw(/*damping=*/0.1, /*rotateRatio=*/0.15,
      this.simList);
  this.elasticity.setElasticity(0.8);
  /** @type {!lab.model.GravityLaw} */
  this.gravityLaw = new GravityLaw(10, this.simList);
  /** @type {!Array<!lab.model.Spring>} */
  this.springs = [];
  /** @type {sims.engine2D.CarSuspensionApp.Formation} */
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
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, CarSuspensionApp.en.FORMATION,
      CarSuspensionApp.i18n.FORMATION,
      this.getFormation, this.setFormation,
      [ CarSuspensionApp.i18n.ROD_SPRING,
        CarSuspensionApp.i18n.TWO_SPRINGS ],
      [ CarSuspensionApp.Formation.ROD_SPRING,
        CarSuspensionApp.Formation.TWO_SPRINGS ]));
  this.addControl(new ChoiceControl(pn));

  this.addParameter(pn = new ParameterNumber(this, CarSuspensionApp.en.SPRING_DAMPING,
      CarSuspensionApp.i18n.SPRING_DAMPING,
     this.getSpringDamping, this.setSpringDamping));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, CarSuspensionApp.en.STIFFNESS,
      CarSuspensionApp.i18n.STIFFNESS,
     this.getStiffness, this.setStiffness));
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeScriptParser();
  this.addURLScriptButton();
  this.configure();
  this.graphSetup();
};
var CarSuspensionApp = myphysicslab.sims.engine2D.CarSuspensionApp;
goog.inherits(CarSuspensionApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  CarSuspensionApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        +', gravityLaw: '+this.gravityLaw.toStringShort()
        + CarSuspensionApp.superClass_.toString.call(this);
  };
};

/**
* @enum {number}
*/
CarSuspensionApp.Formation = {
  ROD_SPRING: 0,
  TWO_SPRINGS: 1
};
var Formation = CarSuspensionApp.Formation;

/** @inheritDoc */
CarSuspensionApp.prototype.getClassName = function() {
  return 'CarSuspensionApp';
};

/** @inheritDoc */
CarSuspensionApp.prototype.defineNames = function(myName) {
  CarSuspensionApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('dampingLaw|gravityLaw|protoWheel',
      myName);
  this.terminal.addRegex('CarSuspensionApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
CarSuspensionApp.prototype.getSubjects = function() {
  var subjects = CarSuspensionApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @param {!Spring} s
* @private
*/
CarSuspensionApp.prototype.addSpring = function(s) {
  s.setDamping(this.springDamping);
  this.mySim.addForceLaw(s);
  this.mySim.getSimList().add(s);
  this.springs.push(s);
};

/**
* @return {undefined}
* @private
*/
CarSuspensionApp.prototype.configure = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.springs = [];
  var car = Shapes.makeBlock(5.0, 2.0, CarSuspensionApp.en.CAR,
      CarSuspensionApp.i18n.CAR);
  car.setMass(this.carMass);
  car.setPosition(new Vector(0,  -1),  0);
  this.mySim.addBody(car);
  this.displayList.find(car).setFillStyle('lightGray');
  switch (this.formation) {
    case Formation.TWO_SPRINGS:
      var wheel1 = Shapes.makeBall(0.4, CarSuspensionApp.en.WHEEL+1,
          CarSuspensionApp.i18n.WHEEL+1);
      wheel1.setMass(this.wheelMass);
      wheel1.setPosition(new Vector(-1.0,  -3.0),  0);
      this.mySim.addBody(wheel1);
      this.displayList.find(wheel1).proto = this.protoWheel;
      var wheel2 = Shapes.makeBall(0.4, CarSuspensionApp.en.WHEEL+2,
          CarSuspensionApp.i18n.WHEEL+2);
      wheel2.setMass(this.wheelMass);
      wheel2.setPosition(new Vector(2.0,  -3.0),  0);
      this.mySim.addBody(wheel2);
      this.displayList.find(wheel2).proto = this.protoWheel;
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
      var p1 = Shapes.makePendulum(0.05, this.springLength, 0.4,
          CarSuspensionApp.en.WHEEL+1, CarSuspensionApp.i18n.WHEEL+1);
      p1.setAngle(0);
      this.mySim.addBody(p1);
      this.displayList.find(p1).proto = this.protoWheel;
      Joint.attachRigidBody(this.mySim,
          car, /*attach1_body=*/new Vector(-0.9, -1.0),
          p1, /*attach2_body*/new Vector(0, this.springLength),
          /*normalType=*/CoordType.WORLD
          );
      this.addSpring(new Spring('spring1',
          car, new Vector(-2.1, -1.0),
          p1, Vector.ORIGIN,
          this.springLength, this.stiffness));
      var p2 = Shapes.makePendulum(0.05, this.springLength, 0.4,
          CarSuspensionApp.en.WHEEL+2, CarSuspensionApp.i18n.WHEEL+2);
      p2.setAngle(0);
      this.mySim.addBody(p2);
      this.displayList.find(p2).proto = this.protoWheel;
      Joint.attachRigidBody(this.mySim,
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
      throw new Error();
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
  this.scriptParser.update();
};

/**
* @return {number}
*/
CarSuspensionApp.prototype.getFormation = function() {
  return this.formation;
};

/**
* @param {number} value
*/
CarSuspensionApp.prototype.setFormation = function(value) {
  this.formation = /** @type {CarSuspensionApp.Formation} */(value);
  this.configure();
  this.broadcastParameter(CarSuspensionApp.en.FORMATION);
};

/**
* @return {number}
*/
CarSuspensionApp.prototype.getSpringDamping = function() {
  return this.springDamping;
};

/**
* @param {number} value
*/
CarSuspensionApp.prototype.setSpringDamping = function(value) {
  this.springDamping = value;
  for (var i=0; i<this.springs.length; i++) {
    this.springs[i].setDamping(this.springDamping);
  }
  this.broadcastParameter(CarSuspensionApp.en.SPRING_DAMPING);
};

/**
* @return {number}
*/
CarSuspensionApp.prototype.getStiffness = function() {
  return this.stiffness;
};

/**
* @param {number} value
*/
CarSuspensionApp.prototype.setStiffness = function(value) {
  this.stiffness = value;
  for (var i=0; i<this.springs.length; i++) {
    this.springs[i].setStiffness(this.stiffness);
  }
  this.broadcastParameter(CarSuspensionApp.en.STIFFNESS);
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
  LENGTH: 'Federl\u00e4nge',
  ROD_SPRING: 'Stange und Feder',
  SPRING_DAMPING: 'Federd\u00e4mpfung',
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

}); // goog.scope
