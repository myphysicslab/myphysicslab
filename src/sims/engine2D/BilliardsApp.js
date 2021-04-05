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

goog.module('myphysicslab.sims.engine2D.BilliardsApp');

const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DisplayList = goog.require('myphysicslab.lab.view.DisplayList');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const Layout = goog.require('myphysicslab.sims.common.Layout');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/** Simulation of a table top billiards game with several balls bouncing against each
other and against the sides of the table.

This app has a {@link #config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------

+ ParameterNumber named `FORMATION`, see {@link #setFormation}.

+ ParameterNumber named `OFFSET`, see {@link #setOffset}

+ ParameterNumber named `SPEED`, see {@link #setSpeed}

*/
class BilliardsApp extends Engine2DApp {
/**
* @param {!Object} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(0.95);
  this.mySim.setShowForces(false);
  //this.advance.setDebugLevel(CollisionAdvance.DebugLevel.LOW);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(/*damping=*/0.1, /*rotateRatio=*/0.15,
      this.simList);
  /** @type {number} */
  this.offset = 0;
  /** @type {number} */
  this.speed = 30;
  /** @type {BilliardsApp.Formation} */
  this.formation = BilliardsApp.Formation.ONE_HITS_SIX;

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  let pn;
  /** @type {!ParameterString} */
  let ps;
  this.addParameter(pn = new ParameterNumber(this, BilliardsApp.en.FORMATION,
      BilliardsApp.i18n.FORMATION,
      () => this.getFormation(), a => this.setFormation(a),
      [ BilliardsApp.i18n.ONE_HITS_THREE, BilliardsApp.i18n.ONE_HITS_SIX ],
      [ BilliardsApp.Formation.ONE_HITS_THREE,
        BilliardsApp.Formation.ONE_HITS_SIX ]));
  this.addControl(new ChoiceControl(pn));

  this.addParameter(pn = new ParameterNumber(this, BilliardsApp.en.OFFSET,
      BilliardsApp.i18n.OFFSET,
      () => this.getOffset(), a => this.setOffset(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, BilliardsApp.en.SPEED,
      BilliardsApp.i18n.SPEED,
      () => this.getSpeed(), a => this.setSpeed(a)));
  this.addControl(new NumericControl(pn));

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  ps = this.sim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  this.addControl(new ChoiceControl(ps));

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'BilliardsApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('dampingLaw',
       myName+'.');
  this.terminal.addRegex('BilliardsApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  return super.getSubjects().concat(this.dampingLaw);
};

/**
* @return {undefined}
*/
config() {
  const elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  BilliardsApp.make(this.mySim, this.displayList, this.formation, this.offset,
      this.speed);
  this.mySim.setElasticity(elasticity);
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.saveInitialState();
  this.clock.setTime(this.mySim.getTime());
  this.clock.setRealTime(this.mySim.getTime());
  this.easyScript.update();
};

/**
* @param {!ContactSim} sim
* @param {!DisplayList} displayList
* @param {!BilliardsApp.Formation} formation
* @param {number} offset gap between balls
* @param {number} speed initial velocity of cue ball
*/
static make(sim, displayList, formation, offset, speed) {
  const r = 0.5;
  const x1 = (2*r + sim.getDistanceTol()/2 + offset) * Math.sqrt(3)/2.0;
  switch (formation) {
    case Formation.ONE_HITS_SIX:
      let body = BilliardsApp.makeBall(4, r);
      body.setPosition(new Vector(2*x1,  0),  0);
      sim.addBody(body);
      displayList.findShape(body).setFillStyle('aqua');

      body = BilliardsApp.makeBall(5, r);
      body.setPosition(new Vector(2*x1, 2*r+sim.getDistanceTol()/4 + offset/2), 0);
      sim.addBody(body);
      displayList.findShape(body).setFillStyle('fuchsia');

      body = BilliardsApp.makeBall(6, r);
      body.setPosition(new Vector(2*x1, -2*r-sim.getDistanceTol()/4 - offset/2), 0);
      sim.addBody(body);
      displayList.findShape(body).setFillStyle('orange');

      // INTENTIONAL FALL THRU to next case
    case Formation.ONE_HITS_THREE:
      const body0 = BilliardsApp.makeBall(0, r);
      body0.setPosition(new Vector(-BilliardsApp.WALL_DISTANCE+1,  0),  0);
      body0.setVelocity(new Vector(speed,  0),  0);
      sim.addBody(body0);
      displayList.findShape(body0).setStrokeStyle('black').setFillStyle('white');

      const body1 = BilliardsApp.makeBall(1, r);
      body1.setPosition(new Vector(0,  0),  0);
      sim.addBody(body1);
      displayList.findShape(body1).setFillStyle('red');

      const body2 = BilliardsApp.makeBall(2, r);
      body2.setPosition(new Vector(x1, r + sim.getDistanceTol()/4 + offset/2), 0);
      sim.addBody(body2);
      displayList.findShape(body2).setFillStyle('green');

      const body3 = BilliardsApp.makeBall(3, r);
      body3.setPosition(new Vector(x1, -r - sim.getDistanceTol()/4 - offset/2), 0);
      sim.addBody(body3);
      displayList.findShape(body3).setFillStyle('blue');
      break;
    default:
      throw '';
  }
  const sz = 2 * BilliardsApp.WALL_DISTANCE;
  Walls.make(sim, /*width=*/sz, /*height=*/sz, /*thickness=*/1.0);
};

/**
* @param {number} num
* @param {number} radius
* @return {!Polygon}
* @private
*/
static makeBall(num, radius) {
  return Shapes.makeBall(radius, BilliardsApp.en.BALL+num, BilliardsApp.i18n.BALL+num);
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
  this.formation = /** @type {BilliardsApp.Formation} */(value);
  this.config();
  this.broadcastParameter(BilliardsApp.en.FORMATION);
};

/**
* @return {number}
*/
getOffset() {
  return this.offset;
};

/**
* @param {number} value
*/
setOffset(value) {
  this.offset = value;
  this.config();
  this.broadcastParameter(BilliardsApp.en.OFFSET);
};

/**
* @return {number}
*/
getSpeed() {
  return this.speed;
};

/**
* @param {number} value
*/
setSpeed(value) {
  this.speed = value;
  this.config();
  this.broadcastParameter(BilliardsApp.en.SPEED);
};

} // end class

/**
* @enum {number}
*/
BilliardsApp.Formation = {
  ONE_HITS_THREE: 0,
  ONE_HITS_SIX: 1
};
const Formation = BilliardsApp.Formation;

/**
* @type {number}
*/
BilliardsApp.WALL_DISTANCE = 6;

/** Set of internationalized strings.
@typedef {{
  FORMATION: string,
  ONE_HITS_THREE: string,
  ONE_HITS_SIX: string,
  OFFSET: string,
  SPEED: string,
  BALL: string
  }}
*/
BilliardsApp.i18n_strings;

/**
@type {BilliardsApp.i18n_strings}
*/
BilliardsApp.en = {
  FORMATION: 'formation',
  ONE_HITS_THREE: 'one hits three',
  ONE_HITS_SIX: 'one hits six',
  OFFSET: 'offset',
  SPEED: 'speed',
  BALL: 'ball'
};

/**
@private
@type {BilliardsApp.i18n_strings}
*/
BilliardsApp.de_strings = {
  FORMATION: 'Formation',
  ONE_HITS_THREE: 'eins schlägt drei',
  ONE_HITS_SIX: 'eins schlägt sechs',
  OFFSET: 'Abstand',
  SPEED: 'Geschwindigkeit',
  BALL: 'Ball'
};

/** Set of internationalized strings.
@type {BilliardsApp.i18n_strings}
*/
BilliardsApp.i18n = goog.LOCALE === 'de' ? BilliardsApp.de_strings :
    BilliardsApp.en;

/**
* @param {!Object} elem_ids
* @return {!BilliardsApp}
*/
function makeBilliardsApp(elem_ids) {
  return new BilliardsApp(elem_ids);
};
goog.exportSymbol('makeBilliardsApp', makeBilliardsApp);

exports = BilliardsApp;
