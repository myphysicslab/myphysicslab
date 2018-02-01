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

goog.module('myphysicslab.sims.engine2D.GearsApp');

const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConstantForceLaw = goog.require('myphysicslab.lab.model.ConstantForceLaw');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const Force = goog.require('myphysicslab.lab.model.Force');
const ForceLaw = goog.require('myphysicslab.lab.model.ForceLaw');
const GearsConfig = goog.require('myphysicslab.sims.engine2D.GearsConfig');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const JointUtil = goog.require('myphysicslab.lab.engine2D.JointUtil');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/** Simulation of two interlocking gears. One of the gears has a constant turning
force applied.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
class GearsApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  var simRect = new DoubleRect(-4, -6, 8, 6);
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  this.elasticity.setElasticity(0.3);
  this.mySim.setShowForces(true);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(0, this.simList);

  /** @type {boolean} */
  this.twoGears = true;
  /** @type {number} */
  this.turningForce = 0.2;
  /** @type {boolean} */
  this.pinnedGears = true;
  /** @type {!RigidBody} */
  this.gearLeft;
  /** @type {?RigidBody} */
  this.gearRight;
  /** @type {?ForceLaw } */
  this.turnForceLaw = null;

  this.addPlaybackControls();
  /** @type {!ParameterBoolean} */
  var pb;
  /** @type {!ParameterNumber} */
  var pn;
  this.addParameter(pb = new ParameterBoolean(this, GearsConfig.en.PINNED_GEARS,
      GearsConfig.i18n.PINNED_GEARS,
      goog.bind(this.getPinnedGears, this), goog.bind(this.setPinnedGears, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, GearsConfig.en.TWO_GEARS,
      GearsConfig.i18n.TWO_GEARS,
      goog.bind(this.getTwoGears, this), goog.bind(this.setTwoGears, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, GearsConfig.en.TURNING_FORCE,
      GearsConfig.i18n.TURNING_FORCE,
      goog.bind(this.getTurningForce, this), goog.bind(this.setTurningForce, this)));
  pn.setLowerLimit(Util.NEGATIVE_INFINITY);
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));
  this.makeEasyScript();
  this.addStandardControls();
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
  return 'GearsApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('GearsApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  var subjects = super.getSubjects();
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/** @override */
graphSetup(body) {
  body = this.mySim.getBody(GearsConfig.en.LEFT_GEAR);
  this.graph.line.setXVariable(body.getVarsIndex()+4); // angle
  this.graph.line.setYVariable(body.getVarsIndex()+5); // angular velocity
  this.timeGraph.line1.setYVariable(body.getVarsIndex()+4); // angle
  this.timeGraph.line2.setYVariable(body.getVarsIndex()+5); // angular velocity
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

  this.gearLeft = GearsConfig.makeGear(2.7, [], GearsConfig.en.LEFT_GEAR,
      GearsConfig.i18n.LEFT_GEAR);
  this.gearLeft.setPosition(new Vector(0,  0),  0);
  this.gearLeft.setMass(1);
  this.mySim.addBody(this.gearLeft);
  this.displayList.findShape(this.gearLeft).setFillStyle('lightGray');
  if (this.twoGears) {
    this.gearRight = GearsConfig.makeGear(2.7, [], GearsConfig.en.RIGHT_GEAR,
        GearsConfig.i18n.RIGHT_GEAR);
    var tooth = 2*Math.PI/36;
    this.gearRight.setPosition(new Vector((2 * 2.7) +0.008+0.35, 0), -tooth/5);
    this.mySim.addBody(this.gearRight);
    this.displayList.findShape(this.gearRight).setFillStyle('lightGray');
  } else {
    this.gearRight = null;
  }
  if (this.pinnedGears) {
    // gears pinned with joints to background
    JointUtil.attachFixedPoint(this.mySim, this.gearLeft, Vector.ORIGIN,
        CoordType.WORLD);
    this.gearLeft.setZeroEnergyLevel();
    if (this.gearRight != null) {
      JointUtil.attachFixedPoint(this.mySim, this.gearRight, Vector.ORIGIN,
          CoordType.WORLD);
      this.gearRight.setZeroEnergyLevel();
    }
    this.gravityLaw.setGravity(0);
  } else {
    // gears freely moving, dropping onto floor
    var zel = Walls.make(this.mySim, /*width=*/60, /*height=*/12, /*thickness=*/1.0);
    this.gravityLaw.setZeroEnergyLevel(zel);
    this.gravityLaw.setGravity(3);
  }
  this.mySim.setElasticity(elasticity);
  this.setTurningForce(this.turningForce);

  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
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
  if (this.gearLeft) {
    var f = new Force('turning', this.gearLeft,
        /*location=*/this.gearLeft.getDragPoints()[0], CoordType.BODY,
        /*direction=*/new Vector(value, 0), CoordType.BODY);
    this.turnForceLaw = new ConstantForceLaw(f);
    this.mySim.addForceLaw(this.turnForceLaw);
  }
  this.broadcastParameter(GearsConfig.en.TURNING_FORCE);
};

/** @return {boolean} */
getPinnedGears() {
  return this.pinnedGears;
};

/** @param {boolean} value */
setPinnedGears(value) {
  this.pinnedGears = value;
  this.config();
  this.broadcastParameter(GearsConfig.en.PINNED_GEARS);
};

/** @return {boolean} */
getTwoGears() {
  return this.twoGears;
};

/** @param {boolean} value */
setTwoGears(value) {
  this.twoGears = value;
  this.config();
  this.broadcastParameter(GearsConfig.en.TWO_GEARS);
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!GearsApp}
*/
function makeGearsApp(elem_ids) {
  return new GearsApp(elem_ids);
};
goog.exportSymbol('makeGearsApp', makeGearsApp);

exports = GearsApp;
