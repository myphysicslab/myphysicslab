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

goog.provide('myphysicslab.sims.engine2D.ImpulseApp');

goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.CollisionHandling');
goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
goog.require('myphysicslab.lab.engine2D.ImpulseSim');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.ThrusterSet');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.engine2D.SixThrusters');


goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
var CollisionHandling = lab.engine2D.CollisionHandling;
var CommonControls = sims.common.CommonControls;
var ConcreteVertex = lab.engine2D.ConcreteVertex;
const DampingLaw = goog.module.get('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DApp = sims.engine2D.Engine2DApp;
const GravityLaw = goog.module.get('myphysicslab.lab.model.GravityLaw');
var ImpulseSim = lab.engine2D.ImpulseSim;
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
var Polygon = lab.engine2D.Polygon;
var RigidBody = lab.engine2D.RigidBody;
var Shapes = lab.engine2D.Shapes;
var SixThrusters = sims.engine2D.SixThrusters;
var TabLayout = sims.common.TabLayout;
var ThrusterSet = lab.engine2D.ThrusterSet;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var Walls = lab.engine2D.Walls;

/**  ImpulseApp demonstrates using ImpulseSim (instead of the usual ContactSim) with
a set of simple rectangular objects.

This app has a {@link #config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.ImpulseApp = function(elem_ids) {
  var simRect = new DoubleRect(-4, -4, 4, 4);
  /** @type {!ImpulseSim} */
  this.mySim = new ImpulseSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.LONG_TRAILS);
  this.elasticity.setElasticity(1.0);
  this.mySim.setShowForces(true);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.1, this.simList);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(0, this.simList);
  /** @type {number} */
  this.numBods = 3;
  /** @type {number} */
  this.mass1 = 1;
  /** @type {number} */
  this.thrust = 1.5;
  /** @type {!ThrusterSet} */
  this.thrust1;
  /** @type {!ThrusterSet} */
  this.thrust2;

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, ImpulseApp.en.NUM_BODIES,
      ImpulseApp.i18n.NUM_BODIES,
      goog.bind(this.getNumBodies, this), goog.bind(this.setNumBodies, this))
      .setDecimalPlaces(0).setLowerLimit(1).setUpperLimit(6));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, ImpulseApp.en.THRUST,
      ImpulseApp.i18n.THRUST,
      goog.bind(this.getThrust, this), goog.bind(this.setThrust, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, ImpulseApp.en.MASS1,
      ImpulseApp.i18n.MASS1,
      goog.bind(this.getMass1, this), goog.bind(this.setMass1, this)));
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
var ImpulseApp = sims.engine2D.ImpulseApp;
goog.inherits(ImpulseApp, Engine2DApp);

/** @override */
ImpulseApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + ImpulseApp.superClass_.toString.call(this);
};

/** @override */
ImpulseApp.prototype.getClassName = function() {
  return 'ImpulseApp';
};

/** @override */
ImpulseApp.prototype.defineNames = function(myName) {
  ImpulseApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('ImpulseApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
ImpulseApp.prototype.getSubjects = function() {
  var subjects = ImpulseApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @param {number} num
* @return {!Polygon}
* @private
*/
ImpulseApp.makeBlock = function(num) {
  return Shapes.makeBlock(1, 3, ImpulseApp.en.BLOCK+num, ImpulseApp.i18n.BLOCK+num);
};

/**
* @return {undefined}
*/
ImpulseApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  var zel = Walls.make2(this.mySim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);
  /** @type {!RigidBody} */
  var p;
  this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  if (this.numBods >= 1) {
    p = ImpulseApp.makeBlock(1);
    p.setPosition(new Vector(-3.3,  0),  0);
    p.setVelocity(new Vector(0.3858,  -0.3608),  -0.3956);
    p.setMass(this.mass1);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('cyan')
    this.thrust2 = SixThrusters.make(this.thrust, p);
    this.rbeh.setThrusters(this.thrust2, 'left');
    this.mySim.addForceLaw(this.thrust2);
  }
  if (this.numBods >= 2) {
    p = ImpulseApp.makeBlock(2);
    p.setPosition(new Vector(-2.2,  0),  0);
    p.setVelocity(new Vector(0.26993,  -0.01696),  -0.30647);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('orange')
    this.thrust1 = SixThrusters.make(this.thrust, p);
    this.rbeh.setThrusters(this.thrust1, 'right');
    this.mySim.addForceLaw(this.thrust1);
  }
  if (this.numBods >= 3) {
    p = ImpulseApp.makeBlock(3);
    p.setPosition(new Vector(2.867,  -0.113),  0);
    p.setVelocity(new Vector(-0.29445,  -0.11189),  -0.23464);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#9f3'); // light green
  }
  if (this.numBods >= 4) {
    p = ImpulseApp.makeBlock(4);
    p.setPosition(new Vector(1.36,  2.5),  -Math.PI/4);
    p.setVelocity(new Vector(-0.45535,  -0.37665),  0.36526);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#f6c'); // hot pink
  }
  if (this.numBods >= 5) {
    p = ImpulseApp.makeBlock(5);
    p.setPosition(new Vector(-2,  2.5),  Math.PI/2+0.1);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#39f');
  }
  if (this.numBods >= 6) {
    p = ImpulseApp.makeBlock(6);
    p.setPosition(new Vector(0.08,  0.127),  0.888);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#c99');
  }
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
* @return {number}
*/
ImpulseApp.prototype.getNumBodies = function() {
  return this.numBods;
};

/**
* @param {number} value
*/
ImpulseApp.prototype.setNumBodies = function(value) {
  this.numBods = value;
  this.config();
  this.broadcastParameter(ImpulseApp.en.NUM_BODIES);
};

/**
* @return {number}
*/
ImpulseApp.prototype.getThrust = function() {
  return this.thrust;
};

/**
* @param {number} value
*/
ImpulseApp.prototype.setThrust = function(value) {
  this.thrust = value;
  this.thrust1.setMagnitude(value);
  this.thrust2.setMagnitude(value);
  this.broadcastParameter(ImpulseApp.en.THRUST);
};

/**
* @return {number}
*/
ImpulseApp.prototype.getMass1 = function() {
  return this.mass1;
};

/**
* @param {number} value
*/
ImpulseApp.prototype.setMass1 = function(value) {
  if (this.mass1 != value) {
    this.mass1 = value;
    var body1 = this.mySim.getBody(ImpulseApp.en.BLOCK+'1');
    body1.setMass(value);
    this.broadcastParameter(ImpulseApp.en.MASS1);
  }
};

/** Set of internationalized strings.
@typedef {{
  NUM_BODIES: string,
  THRUST: string,
  BLOCK: string,
  MASS1: string
  }}
*/
ImpulseApp.i18n_strings;

/**
@type {ImpulseApp.i18n_strings}
*/
ImpulseApp.en = {
  NUM_BODIES: 'number of objects',
  THRUST: 'thrust',
  BLOCK: 'block',
  MASS1: 'mass of block1'
};

/**
@private
@type {ImpulseApp.i18n_strings}
*/
ImpulseApp.de_strings = {
  NUM_BODIES: 'Anzahl von Objekten',
  THRUST: 'Schubkraft',
  BLOCK: 'Block',
  MASS1: 'Masse von Block1'
};

/** Set of internationalized strings.
@type {ImpulseApp.i18n_strings}
*/
ImpulseApp.i18n = goog.LOCALE === 'de' ? ImpulseApp.de_strings :
    ImpulseApp.en;

}); // goog.scope
