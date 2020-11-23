// Copyright 2020 Erik Neumann.  All Rights Reserved.
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

goog.module('myphysicslab.sims.engine2D.RobotSpeedApp');

const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConcreteVertex = goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const Force = goog.require('myphysicslab.lab.model.Force');
const ConstantForceLaw = goog.require('myphysicslab.lab.model.ConstantForceLaw');
const GenericMemo = goog.require('myphysicslab.lab.util.GenericMemo');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const ThrusterSet = goog.require('myphysicslab.lab.engine2D.ThrusterSet');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/**  RobotSpeedApp demonstrates a robot being propelled by a motor.

This app has a {@link #config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------
+ ParameterNumber named `THRUST`, see {@link #setThrust}

+ ParameterNumber named `MASS1`, see {@link #setMass1}

*/
class RobotSpeedApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  var simRect = new DoubleRect(-50, -10, 50, 10);
  var sim = new ContactSim();
  // Try different ExtraAccel values here. Can also do this in Terminal.
  //this.mySim.setExtraAccel(ExtraAccel.VELOCITY);
  var advance = new CollisionAdvance(sim);
  //advance.setDebugLevel(CollisionAdvance.DebugLevel.OPTIMAL);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  this.mySim.setShowForces(true);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.1, this.simList);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(3, this.simList);
  /** @type {!ConstantForceLaw} */
  this.cfl = new ConstantForceLaw(null);
  this.elasticity.setElasticity(0.8);
  /** @type {number} */
  this.mass1 = 1;
  /** @type {number} */
  this.thrust = 1.5;
  /** @type {number} */
  this.power = 1;
  /** @type {number} */
  this.rpm = 1;
  /** @type {number} */
  this.wheelRadius = 1;
  /** @type {number} */
  this.torque = 1;
  /** @type {number} */
  this.force = 1;
  /** @type {!Polygon} */
  this.robot = Shapes.makeBlock(1, 1);

  this.addPlaybackControls();

  /** @type {!ParameterNumber} */
  var pn;

  this.addParameter(pn = new ParameterNumber(this, RobotSpeedApp.en.THRUST,
      RobotSpeedApp.i18n.THRUST,
      goog.bind(this.getThrust, this), goog.bind(this.setThrust, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, RobotSpeedApp.en.MASS1,
      RobotSpeedApp.i18n.MASS1,
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
  this.setThrust(10);
  var r = this.robot;
  var sr = this.simRun;
  /** @type {!GenericMemo} */
  this.memo = new GenericMemo(function() { if (r.getPosition().getX() > 40) sr.pause();});
  this.simRun.addMemo(this.memo);
  this.graphSetup();
  this.graph.line.setYVariable(28);
  this.timeGraph.line1.setYVariable(28);
  this.timeGraph.line2.setYVariable(29);
  this.timeGraph.line3.setYVariable(-1);
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
  return 'RobotSpeedApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('RobotSpeedApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  var subjects = super.getSubjects();
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @return {undefined}
*/
config() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  var zel = Walls.make2(this.mySim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);
  //this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  this.robot = Shapes.makeBlock(10, 3, RobotSpeedApp.en.ROBOT, RobotSpeedApp.i18n.ROBOT);
  this.robot.setPosition(new Vector(-50+5.1, -10+1.501),  0);
  //p.setVelocity(new Vector(0.26993,  -0.01696),  -0.30647);
  this.mySim.addBody(this.robot);
  this.displayList.findShape(this.robot).setFillStyle('orange');
  this.mySim.addForceLaw(this.cfl);
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
getMass1() {
  return this.mass1;
};

/**
* @param {number} value
*/
setMass1(value) {
  if (this.mass1 != value) {
    this.mass1 = value;
    var body1 = this.mySim.getBody(RobotSpeedApp.en.ROBOT);
    body1.setMass(value);
    this.broadcastParameter(RobotSpeedApp.en.MASS1);
  }
};

/**
* @return {number}
*/
getThrust() {
  return this.thrust;
};

/**
* @param {number} value
*/
setThrust(value) {
  this.thrust = value;
  if (this.robot != null) {
    var f = new Force('robot_force', this.robot, Vector.ORIGIN, CoordType.BODY, new Vector(value, 0), CoordType.BODY);
    this.cfl.setForce(f);
  }
  this.broadcastParameter(RobotSpeedApp.en.THRUST);
};

} // end class

/** Set of internationalized strings.
@typedef {{
  THRUST: string,
  MASS1: string,
  ROBOT: string
  }}
*/
RobotSpeedApp.i18n_strings;

/**
@type {RobotSpeedApp.i18n_strings}
*/
RobotSpeedApp.en = {
  THRUST: 'thrust',
  MASS1: 'mass of block1',
  ROBOT: 'robot'
};

/**
@private
@type {RobotSpeedApp.i18n_strings}
*/
RobotSpeedApp.de_strings = {
  THRUST: 'Schubkraft',
  MASS1: 'Masse von Block1',
  ROBOT: 'Roboter'
};

/** Set of internationalized strings.
@type {RobotSpeedApp.i18n_strings}
*/
RobotSpeedApp.i18n = goog.LOCALE === 'de' ? RobotSpeedApp.de_strings :
    RobotSpeedApp.en;

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!RobotSpeedApp}
*/
function makeRobotSpeedApp(elem_ids) {
  return new RobotSpeedApp(elem_ids);
};
goog.exportSymbol('makeRobotSpeedApp', makeRobotSpeedApp);

exports = RobotSpeedApp;
