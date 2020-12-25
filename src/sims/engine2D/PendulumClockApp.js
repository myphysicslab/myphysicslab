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

goog.module('myphysicslab.sims.engine2D.PendulumClockApp');

const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConstantForceLaw = goog.require('myphysicslab.lab.model.ConstantForceLaw');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const Force = goog.require('myphysicslab.lab.model.Force');
const ForceLaw = goog.require('myphysicslab.lab.model.ForceLaw');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const PendulumClockConfig = goog.require('myphysicslab.sims.engine2D.PendulumClockConfig');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Simulates a pendulum clock with a pendulum attached to an anchor that
regulates that turning of an escapement wheel. The escapement wheel has a constant
torque force that causes it to turn continuously.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
class PendulumClockApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  var simRect = new DoubleRect(-4, -4, 4, 6);
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
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
      () => this.getWithGears(), a => this.setWithGears(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, PendulumClockConfig.en.EXTRA_BODY,
      PendulumClockConfig.i18n.EXTRA_BODY,
      () => this.getExtraBody(), a => this.setExtraBody(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn=new ParameterNumber(this, PendulumClockConfig.en.PENDULUM_LENGTH,
      PendulumClockConfig.i18n.PENDULUM_LENGTH,
      () => this.getPendulumLength(), a => this.setPendulumLength(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, PendulumClockConfig.en.TURNING_FORCE,
      PendulumClockConfig.i18n.TURNING_FORCE,
      () => this.getTurningForce(), a => this.setTurningForce(a)));
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

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'PendulumClockApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('PendulumClockApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  var subjects = super.getSubjects();
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/** @override */
graphSetup(body) {
  body = this.mySim.getBody(PendulumClockConfig.en.ANCHOR);
  this.graph.line.setXVariable(body.getVarsIndex()+4);
  this.graph.line.setYVariable(body.getVarsIndex()+5);
  this.timeGraph.line1.setYVariable(body.getVarsIndex()+4);
  this.timeGraph.line2.setYVariable(body.getVarsIndex()+5);
};

/**
* @return {undefined}
*/
config() {
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
getWithGears() {
  return this.withGears;
};

/**
* @param {boolean} value
*/
setWithGears(value) {
  this.withGears = value;
  this.config();
  this.broadcastParameter(PendulumClockConfig.en.WITH_GEARS);
};

/**
* @return {boolean}
*/
getExtraBody() {
  return this.extraBody;
};

/**
* @param {boolean} value
*/
setExtraBody(value) {
  this.extraBody = value;
  this.config();
  this.broadcastParameter(PendulumClockConfig.en.EXTRA_BODY);
};

/**
* @return {number}
*/
getPendulumLength() {
  return this.pendulumLength;
};

/**
* @param {number} value
*/
setPendulumLength(value) {
  this.pendulumLength = value;
  this.config();
  this.broadcastParameter(PendulumClockConfig.en.PENDULUM_LENGTH);
};

/**
* @return {number}
*/
getTurningForce() {
  return this.turningForce;
};

/**
* @param {number} value
*/
setTurningForce(value) {
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

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!PendulumClockApp}
*/
function makePendulumClockApp(elem_ids) {
  return new PendulumClockApp(elem_ids);
};
goog.exportSymbol('makePendulumClockApp', makePendulumClockApp);

exports = PendulumClockApp;
