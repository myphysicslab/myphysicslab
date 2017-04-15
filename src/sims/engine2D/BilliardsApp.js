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

goog.provide('myphysicslab.sims.engine2D.BilliardsApp');

goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.RigidBodySim');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.common.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var DampingLaw = lab.model.DampingLaw;
var DisplayList = lab.view.DisplayList;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var NumericControl = lab.controls.NumericControl;
var ParameterNumber = lab.util.ParameterNumber;
var Polygon = lab.engine2D.Polygon;
var RigidBodySim = lab.engine2D.RigidBodySim;
var Shapes = lab.engine2D.Shapes;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;
var Walls = lab.engine2D.Walls;

/** Simulation of a table top billiards game with several balls bouncing against each
other and against the sides of the table.

This app has a {@link #config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------

+ ParameterNumber named `FORMATION`, see {@link #setFormation}.

+ ParameterNumber named `OFFSET`, see {@link #setOffset}

+ ParameterNumber named `SPEED`, see {@link #setSpeed}


* @param {!sims.common.TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
myphysicslab.sims.engine2D.BilliardsApp = function(elem_ids) {
  var simRect = new DoubleRect(-6, -6, 6, 6);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(0.95);
  this.mySim.setShowForces(false);
  //this.advance.setDebugLevel(CollisionAdvance.DebugLevel.LOW);
  /** @type {!lab.model.DampingLaw} */
  this.dampingLaw = new DampingLaw(/*damping=*/0.1, /*rotateRatio=*/0.15,
      this.simList);
  /** @type {number} */
  this.offset = 0;
  /** @type {number} */
  this.speed = 30;
  /** @type {BilliardsApp.Formation} */
  this.formation = BilliardsApp.Formation.ONE_HITS_SIX;

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  /** @type {!lab.util.ParameterString} */
  var ps;
  this.addParameter(pn = new ParameterNumber(this, BilliardsApp.en.FORMATION,
      BilliardsApp.i18n.FORMATION,
      goog.bind(this.getFormation, this), goog.bind(this.setFormation, this),
      [ BilliardsApp.i18n.ONE_HITS_THREE, BilliardsApp.i18n.ONE_HITS_SIX ],
      [ BilliardsApp.Formation.ONE_HITS_THREE,
        BilliardsApp.Formation.ONE_HITS_SIX ]));
  this.addControl(new ChoiceControl(pn));

  this.addParameter(pn = new ParameterNumber(this, BilliardsApp.en.OFFSET,
      BilliardsApp.i18n.OFFSET,
      goog.bind(this.getOffset, this), goog.bind(this.setOffset, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, BilliardsApp.en.SPEED,
      BilliardsApp.i18n.SPEED,
      goog.bind(this.getSpeed, this), goog.bind(this.setSpeed, this)));
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
var BilliardsApp = myphysicslab.sims.engine2D.BilliardsApp;
goog.inherits(BilliardsApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  BilliardsApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        + BilliardsApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
BilliardsApp.prototype.getClassName = function() {
  return 'BilliardsApp';
};

/**
* @enum {number}
*/
BilliardsApp.Formation = {
  ONE_HITS_THREE: 0,
  ONE_HITS_SIX: 1
};
var Formation = BilliardsApp.Formation;

/**
* @type {number}
*/
BilliardsApp.WALL_DISTANCE = 6;


/** @inheritDoc */
BilliardsApp.prototype.defineNames = function(myName) {
  BilliardsApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('dampingLaw',
       myName);
  this.terminal.addRegex('BilliardsApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
BilliardsApp.prototype.getSubjects = function() {
  var subjects = BilliardsApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, subjects);
};

/**
* @return {undefined}
*/
BilliardsApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
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
BilliardsApp.make = function(sim, displayList, formation, offset, speed) {
  var r = 0.5;
  var x1 = (2*r + sim.getDistanceTol()/2 + offset) * Math.sqrt(3)/2.0;
  switch (formation) {
    case Formation.ONE_HITS_SIX:
      var body = BilliardsApp.makeBall(4, r);
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
      var body0 = BilliardsApp.makeBall(0, r);
      body0.setPosition(new Vector(-BilliardsApp.WALL_DISTANCE+1,  0),  0);
      body0.setVelocity(new Vector(speed,  0),  0);
      sim.addBody(body0);
      displayList.findShape(body0).setStrokeStyle('black').setFillStyle('white');

      var body1 = BilliardsApp.makeBall(1, r);
      body1.setPosition(new Vector(0,  0),  0);
      sim.addBody(body1);
      displayList.findShape(body1).setFillStyle('red');

      var body2 = BilliardsApp.makeBall(2, r);
      body2.setPosition(new Vector(x1, r + sim.getDistanceTol()/4 + offset/2), 0);
      sim.addBody(body2);
      displayList.findShape(body2).setFillStyle('green');

      var body3 = BilliardsApp.makeBall(3, r);
      body3.setPosition(new Vector(x1, -r - sim.getDistanceTol()/4 - offset/2), 0);
      sim.addBody(body3);
      displayList.findShape(body3).setFillStyle('blue');
      break;
    default:
      throw new Error();
  }
  var sz = 2 * BilliardsApp.WALL_DISTANCE;
  Walls.make(sim, /*width=*/sz, /*height=*/sz, /*thickness=*/1.0);
};

/**
* @param {number} num
* @param {number} radius
* @return {!Polygon}
* @private
*/
BilliardsApp.makeBall = function(num, radius) {
  return Shapes.makeBall(radius, BilliardsApp.en.BALL+num, BilliardsApp.i18n.BALL+num);
};

/**
* @return {number}
*/
BilliardsApp.prototype.getFormation = function() {
  return this.formation;
};

/**
* @param {number} value
*/
BilliardsApp.prototype.setFormation = function(value) {
  this.formation = /** @type {BilliardsApp.Formation} */(value);
  this.config();
  this.broadcastParameter(BilliardsApp.en.FORMATION);
};

/**
* @return {number}
*/
BilliardsApp.prototype.getOffset = function() {
  return this.offset;
};

/**
* @param {number} value
*/
BilliardsApp.prototype.setOffset = function(value) {
  this.offset = value;
  this.config();
  this.broadcastParameter(BilliardsApp.en.OFFSET);
};

/**
* @return {number}
*/
BilliardsApp.prototype.getSpeed = function() {
  return this.speed;
};

/**
* @param {number} value
*/
BilliardsApp.prototype.setSpeed = function(value) {
  this.speed = value;
  this.config();
  this.broadcastParameter(BilliardsApp.en.SPEED);
};

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
  ONE_HITS_THREE: 'eins schl\u00e4gt drei',
  ONE_HITS_SIX: 'eins schl\u00e4gt sechs',
  OFFSET: 'Abstand',
  SPEED: 'Geschwindigkeit',
  BALL: 'Ball'
};


/** Set of internationalized strings.
@type {BilliardsApp.i18n_strings}
*/
BilliardsApp.i18n = goog.LOCALE === 'de' ? BilliardsApp.de_strings :
    BilliardsApp.en;

}); // goog.scope
