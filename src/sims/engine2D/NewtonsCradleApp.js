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

goog.provide('myphysicslab.sims.engine2D.NewtonsCradleApp');

goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.engine2D.JointUtil');
goog.require('myphysicslab.lab.engine2D.Scrim');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.common.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var CoordType = lab.model.CoordType;
var DampingLaw = lab.model.DampingLaw;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var GravityLaw = lab.model.GravityLaw;
var JointUtil = lab.engine2D.JointUtil;
var NumericControl = lab.controls.NumericControl;
var ParameterNumber = lab.util.ParameterNumber;
var Scrim = lab.engine2D.Scrim;
var Shapes = lab.engine2D.Shapes;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/**  The NewtonsCradleApp simulation shows six pendulums side-by-side, you
lift one at the end and let it strike the others;  only the pendulum on the far side
flies away and the pendulum that you let fall becomes motionless when it strikes.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!sims.common.TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.NewtonsCradleApp = function(elem_ids) {
  var simRect = new DoubleRect(-5, -3, 5, 5);
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(1.0);
  this.mySim.setShowForces(false);
  // JointSmallImpacts==true seems to help with energy stability and joint tightness,
  // but then we get lots of small collisions, which is kind of distracting.
  this.advance.setJointSmallImpacts(false);
  //this.advance.setDebugLevel(CollisionAdvance.DebugLevel.OPTIMAL);
  /** @type {!lab.model.DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  /** @type {!lab.model.GravityLaw} */
  this.gravityLaw = new GravityLaw(32, this.simList);

  /** @type {!NewtonsCradleApp.options} */
  this.options = {
      stickLength: 3.0,
      radius: 0.6,
      gapDistance: 0,
      numBods: 5,
      startAngle: -Math.PI/4
    };

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, NewtonsCradleApp.en.NUM_BODIES,
      NewtonsCradleApp.i18n.NUM_BODIES,
      this.getNumBodies, this.setNumBodies).setDecimalPlaces(0)
      .setLowerLimit(1).setUpperLimit(6));
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, NewtonsCradleApp.en.LENGTH,
      NewtonsCradleApp.i18n.LENGTH,
      this.getStickLength, this.setStickLength));
  this.addControl(new NumericControl(pn));

  this.addParameter(
      pn = new ParameterNumber(this, NewtonsCradleApp.en.GAP_DISTANCE,
      NewtonsCradleApp.i18n.GAP_DISTANCE,
      this.getGapDistance, this.setGapDistance));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, NewtonsCradleApp.en.RADIUS,
      NewtonsCradleApp.i18n.RADIUS,
      this.getRadius, this.setRadius));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};
var NewtonsCradleApp = sims.engine2D.NewtonsCradleApp;
goog.inherits(NewtonsCradleApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  NewtonsCradleApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        +', gravityLaw: '+this.gravityLaw.toStringShort()
        + NewtonsCradleApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
NewtonsCradleApp.prototype.getClassName = function() {
  return 'NewtonsCradleApp';
};

/** @inheritDoc */
NewtonsCradleApp.prototype.defineNames = function(myName) {
  NewtonsCradleApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName);
  this.terminal.addRegex('NewtonsCradleApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
NewtonsCradleApp.prototype.getSubjects = function() {
  var subjects = NewtonsCradleApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/** @inheritDoc */
NewtonsCradleApp.prototype.graphSetup = function(body) {
  body = this.mySim.getBody('pendulum1');
  this.graph.line.setXVariable(body.getVarsIndex()+4); // angle
  this.graph.line.setYVariable(body.getVarsIndex()+5); // angular velocity
  this.timeGraph.line1.setYVariable(body.getVarsIndex()+4); // angle
  this.timeGraph.line2.setYVariable(body.getVarsIndex()+5); // angular velocity
};

/**
* @return {number}
*/
NewtonsCradleApp.prototype.getNumBodies = function() {
  return this.options.numBods;
};

/**
* @param {number} value
*/
NewtonsCradleApp.prototype.setNumBodies = function(value) {
  this.options.numBods = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.NUM_BODIES);
};

/**
* @return {number}
*/
NewtonsCradleApp.prototype.getStickLength = function() {
  return this.options.stickLength;
};

/**
* @param {number} value
*/
NewtonsCradleApp.prototype.setStickLength = function(value) {
  this.options.stickLength = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.LENGTH);
};

/**
* @return {number}
*/
NewtonsCradleApp.prototype.getGapDistance = function() {
  return this.options.gapDistance;
};

/**
* @param {number} value
*/
NewtonsCradleApp.prototype.setGapDistance = function(value) {
  this.options.gapDistance = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.GAP_DISTANCE);
};

/**
* @return {number}
*/
NewtonsCradleApp.prototype.getRadius = function() {
  return this.options.radius;
};

/**
* @param {number} value
*/
NewtonsCradleApp.prototype.setRadius = function(value) {
  this.options.radius = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.RADIUS);
};

/**
* @return {undefined}
*/
NewtonsCradleApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  NewtonsCradleApp.make(this.mySim, this.options);
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
* @typedef {{stickLength: number,
    radius: number,
    gapDistance: number,
    numBods: number,
    startAngle: number
    }}
*/
NewtonsCradleApp.options;

/**
* @param {!ContactSim} sim
* @param {!NewtonsCradleApp.options} options
*/
NewtonsCradleApp.make = function(sim, options) {
  // each pendulum is 2*radius wide.
  // We have a gap between pendulums of distTol/2 + gapDistance
  // total width of all pendulums:
  var n = options.numBods;
  var r = options.radius;
  var between = sim.getDistanceTol()/2  + options.gapDistance;
  var tw = n * 2 * r + (n - 1) * between;
  var x = -tw/2 + r;
  for (var i=0; i<options.numBods; i++) {
    var body = Shapes.makePendulum(0.05, options.stickLength,
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

/** Set of internationalized strings.
@typedef {{
  GAP_DISTANCE: string,
  PENDULUM: string,
  NUM_BODIES: string,
  LENGTH: string,
  RADIUS: string
  }}
*/
NewtonsCradleApp.i18n_strings;

/**
@type {NewtonsCradleApp.i18n_strings}
*/
NewtonsCradleApp.en = {
  GAP_DISTANCE: 'offset',
  PENDULUM: 'pendulum',
  NUM_BODIES: 'pendulums',
  LENGTH: 'pendulum length',
  RADIUS: 'radius'
};

/**
@private
@type {NewtonsCradleApp.i18n_strings}
*/
NewtonsCradleApp.de_strings = {
  GAP_DISTANCE: 'Zwischenraum',
  PENDULUM: 'Pendel',
  NUM_BODIES: 'Pendelanzahl',
  LENGTH: 'Pendell\u00e4nge',
  RADIUS: 'Radius'
};

/** Set of internationalized strings.
@type {NewtonsCradleApp.i18n_strings}
*/
NewtonsCradleApp.i18n = goog.LOCALE === 'de' ? NewtonsCradleApp.de_strings :
    NewtonsCradleApp.en;

}); // goog.scope
