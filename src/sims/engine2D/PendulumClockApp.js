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

goog.provide('myphysicslab.sims.engine2D.PendulumClockApp');

goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.Joint');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.ConstantForceLaw');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.ForceLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.engine2D.PendulumClockConfig');
goog.require('myphysicslab.sims.engine2D.RotatingTestForce');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.common.CommonControls;
var ConstantForceLaw = lab.model.ConstantForceLaw;
var ContactSim = lab.engine2D.ContactSim;
var CoordType = lab.model.CoordType;
var DampingLaw = lab.model.DampingLaw;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var Force = lab.model.Force;
var ForceLaw = lab.model.ForceLaw;
var GravityLaw = lab.model.GravityLaw;
var NumericControl = lab.controls.NumericControl;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var ParameterString = lab.util.ParameterString;
var PendulumClockConfig = sims.engine2D.PendulumClockConfig;
var Shapes = lab.engine2D.Shapes;
var TabLayout = sims.common.TabLayout;
var Util = lab.util.Util;
var Vector = lab.util.Vector;

/** Simulates a pendulum clock with a pendulum attached to an anchor that
regulates that turning of an escapement wheel. The escapement wheel has a constant
torque force that causes it to turn continuously.

This app has a config() method which looks at a set of options
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
sims.engine2D.PendulumClockApp = function(elem_ids) {
  var simRect = new DoubleRect(-4, -4, 4, 6);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.mySim.setShowForces(true);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0.05, 0.15, this.simList);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(10, this.simList);
  this.elasticity.setElasticity(0.3);

  /** @type {number} */
  this.pendulumLength = 3.0;
  /** @type {number} */
  this.turningForce = 1.0;
  /** @type {boolean} */
  this.extraBody = false;
  /** @type {boolean} */
  this.withGears = false;
  /** @type {?ForceLaw } */
  this.turnForceLaw = null;

  this.addPlaybackControls();
  /** @type {!ParameterBoolean} */
  var pb;
  /** @type {!ParameterNumber} */
  var pn;
  /** @type {!ParameterString} */
  var ps;
  this.addParameter(pb = new ParameterBoolean(this, PendulumClockConfig.en.WITH_GEARS,
      PendulumClockConfig.i18n.WITH_GEARS,
      goog.bind(this.getWithGears, this), goog.bind(this.setWithGears, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, PendulumClockConfig.en.EXTRA_BODY,
      PendulumClockConfig.i18n.EXTRA_BODY,
      goog.bind(this.getExtraBody, this), goog.bind(this.setExtraBody, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn=new ParameterNumber(this, PendulumClockConfig.en.PENDULUM_LENGTH,
      PendulumClockConfig.i18n.PENDULUM_LENGTH,
      goog.bind(this.getPendulumLength, this), goog.bind(this.setPendulumLength, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, PendulumClockConfig.en.TURNING_FORCE,
      PendulumClockConfig.i18n.TURNING_FORCE,
      goog.bind(this.getTurningForce, this), goog.bind(this.setTurningForce, this)));
  pn.setLowerLimit(Util.NEGATIVE_INFINITY);
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
var PendulumClockApp = sims.engine2D.PendulumClockApp;
goog.inherits(PendulumClockApp, Engine2DApp);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  PendulumClockApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        +', gravityLaw: '+this.gravityLaw.toStringShort()
        + PendulumClockApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
PendulumClockApp.prototype.getClassName = function() {
  return 'PendulumClockApp';
};

/** @inheritDoc */
PendulumClockApp.prototype.defineNames = function(myName) {
  PendulumClockApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName);
  this.terminal.addRegex('PendulumClockApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
PendulumClockApp.prototype.getSubjects = function() {
  var subjects = PendulumClockApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/** @inheritDoc */
PendulumClockApp.prototype.graphSetup = function(body) {
  body = this.mySim.getBody(PendulumClockConfig.en.ANCHOR);
  this.graph.line.setXVariable(body.getVarsIndex()+4);
  this.graph.line.setYVariable(body.getVarsIndex()+5);
  this.timeGraph.line1.setYVariable(body.getVarsIndex()+4);
  this.timeGraph.line2.setYVariable(body.getVarsIndex()+5);
};

/**
* @return {undefined}
*/
PendulumClockApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  if (this.withGears) {
    PendulumClockConfig.makeClockWithGears(this.mySim, this.pendulumLength,
        /*center=*/Vector.ORIGIN);
  } else {
    PendulumClockConfig.makeClock(this.mySim, this.pendulumLength,
        /*center=*/Vector.ORIGIN);
  }
  var escapeWheel = this.displayList.findShape(PendulumClockConfig.en.ESCAPE_WHEEL);
  escapeWheel.setFillStyle('#D3D3D3');
  if (this.withGears) {
    escapeWheel.setStrokeStyle('black');
    var gear2 = this.displayList.findShape(PendulumClockConfig.en.GEAR+2);
    gear2.setFillStyle('#B0C4DE').setZIndex(2);
  }
  var anchor = this.displayList.findShape(PendulumClockConfig.en.ANCHOR);
  anchor.setFillStyle('#B0C4DE').setZIndex(3);
  this.setTurningForce(this.turningForce);
  if (this.extraBody) {
    // optional free moving block, to demonstrate interactions.
    var block = Shapes.makeBlock(/*width=*/0.12, /*height=*/0.5,
        PendulumClockConfig.en.EXTRA_BODY, PendulumClockConfig.i18n.EXTRA_BODY);
    block.setMass(0.3);
    block.setPosition(new Vector(0, 6), Math.PI/2);
    this.mySim.addBody(block);
    this.displayList.findShape(block).setStrokeStyle('cyan');
  }
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
* @return {boolean}
*/
PendulumClockApp.prototype.getWithGears = function() {
  return this.withGears;
};

/**
* @param {boolean} value
*/
PendulumClockApp.prototype.setWithGears = function(value) {
  this.withGears = value;
  this.config();
  this.broadcastParameter(PendulumClockConfig.en.WITH_GEARS);
};

/**
* @return {boolean}
*/
PendulumClockApp.prototype.getExtraBody = function() {
  return this.extraBody;
};

/**
* @param {boolean} value
*/
PendulumClockApp.prototype.setExtraBody = function(value) {
  this.extraBody = value;
  this.config();
  this.broadcastParameter(PendulumClockConfig.en.EXTRA_BODY);
};

/**
* @return {number}
*/
PendulumClockApp.prototype.getPendulumLength = function() {
  return this.pendulumLength;
};

/**
* @param {number} value
*/
PendulumClockApp.prototype.setPendulumLength = function(value) {
  this.pendulumLength = value;
  this.config();
  this.broadcastParameter(PendulumClockConfig.en.PENDULUM_LENGTH);
};

/**
* @return {number}
*/
PendulumClockApp.prototype.getTurningForce = function() {
  return this.turningForce;
};

/**
* @param {number} value
*/
PendulumClockApp.prototype.setTurningForce = function(value) {
  this.turningForce = value;
  if (this.turnForceLaw != null) {
    this.mySim.removeForceLaw(this.turnForceLaw);
  }
  var body = this.mySim.getBody(PendulumClockConfig.en.ESCAPE_WHEEL);
  if (body) {
    var f = new Force('turning', body,
        /*location=*/body.getDragPoints()[0], CoordType.BODY,
        /*direction=*/new Vector(value, 0), CoordType.BODY);
    this.turnForceLaw = new ConstantForceLaw(f);
    this.mySim.addForceLaw(this.turnForceLaw);
  }
  this.broadcastParameter(PendulumClockConfig.en.TURNING_FORCE);
};

}); // goog.scope
