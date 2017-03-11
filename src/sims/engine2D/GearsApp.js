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

goog.provide('myphysicslab.sims.engine2D.GearsApp');

goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.engine2D.JointUtil');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.ConstantForceLaw');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.ForceLaw');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.engine2D.GearsConfig');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var NumericControl = lab.controls.NumericControl;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.common.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var CoordType = lab.model.CoordType;
var DampingLaw = lab.model.DampingLaw;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var GearsConfig = sims.engine2D.GearsConfig;
var GravityLaw = lab.model.GravityLaw;
var JointUtil = lab.engine2D.JointUtil;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;
var Walls = lab.engine2D.Walls;

/** Simulation of two interlocking gears. One of the gears has a constant turning
force applied.

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
sims.engine2D.GearsApp = function(elem_ids) {
  var simRect = new DoubleRect(-4, -6, 8, 6);
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.elasticity.setElasticity(0.3);
  this.mySim.setShowForces(true);
  /** @type {!lab.model.DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  /** @type {!lab.model.GravityLaw} */
  this.gravityLaw = new GravityLaw(0, this.simList);

  /** @type {boolean} */
  this.twoGears = true;
  /** @type {number} */
  this.turningForce = 0.2;
  /** @type {boolean} */
  this.pinnedGears = true;
  /** @type {!lab.engine2D.RigidBody} */
  this.gearLeft;
  /** @type {?lab.engine2D.RigidBody} */
  this.gearRight;
  /** @type {?lab.model.ForceLaw } */
  this.turnForceLaw = null;

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterBoolean} */
  var pb;
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  this.addParameter(pb = new ParameterBoolean(this, GearsConfig.en.PINNED_GEARS,
      GearsConfig.i18n.PINNED_GEARS,
      this.getPinnedGears, this.setPinnedGears));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, GearsConfig.en.TWO_GEARS,
      GearsConfig.i18n.TWO_GEARS,
      this.getTwoGears, this.setTwoGears));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, GearsConfig.en.TURNING_FORCE,
      GearsConfig.i18n.TURNING_FORCE,
      this.getTurningForce, this.setTurningForce));
  pn.setLowerLimit(UtilityCore.NEGATIVE_INFINITY);
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
var GearsApp = sims.engine2D.GearsApp;
goog.inherits(GearsApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  GearsApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        +', gravityLaw: '+this.gravityLaw.toStringShort()
        + GearsApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
GearsApp.prototype.getClassName = function() {
  return 'GearsApp';
};

/** @inheritDoc */
GearsApp.prototype.defineNames = function(myName) {
  GearsApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName);
  this.terminal.addRegex('GearsApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
GearsApp.prototype.getSubjects = function() {
  var subjects = GearsApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/** @inheritDoc */
GearsApp.prototype.graphSetup = function(body) {
  body = this.mySim.getBody(GearsConfig.en.LEFT_GEAR);
  this.graph.line.setXVariable(body.getVarsIndex()+4); // angle
  this.graph.line.setYVariable(body.getVarsIndex()+5); // angular velocity
  this.timeGraph.line1.setYVariable(body.getVarsIndex()+4); // angle
  this.timeGraph.line2.setYVariable(body.getVarsIndex()+5); // angular velocity
};

/**
* @return {undefined}
*/
GearsApp.prototype.config = function() {
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
GearsApp.prototype.getTurningForce = function() {
  return this.turningForce;
};

/**
* @param {number} value
*/
GearsApp.prototype.setTurningForce = function(value) {
  this.turningForce = value;
  if (this.turnForceLaw != null) {
    this.mySim.removeForceLaw(this.turnForceLaw);
  }
  if (this.gearLeft) {
    var f = new myphysicslab.lab.model.Force('turning', this.gearLeft,
        /*location=*/this.gearLeft.getDragPoints()[0], CoordType.BODY,
        /*direction=*/new Vector(value, 0), CoordType.BODY);
    this.turnForceLaw = new myphysicslab.lab.model.ConstantForceLaw(f);
    this.mySim.addForceLaw(this.turnForceLaw);
  }
  this.broadcastParameter(GearsConfig.en.TURNING_FORCE);
};

/** @return {boolean} */
GearsApp.prototype.getPinnedGears = function() {
  return this.pinnedGears;
};

/** @param {boolean} value */
GearsApp.prototype.setPinnedGears = function(value) {
  this.pinnedGears = value;
  this.config();
  this.broadcastParameter(GearsConfig.en.PINNED_GEARS);
};

/** @return {boolean} */
GearsApp.prototype.getTwoGears = function() {
  return this.twoGears;
};

/** @param {boolean} value */
GearsApp.prototype.setTwoGears = function(value) {
  this.twoGears = value;
  this.config();
  this.broadcastParameter(GearsConfig.en.TWO_GEARS);
};

}); // goog.scope
