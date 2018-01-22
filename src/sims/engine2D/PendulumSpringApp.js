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

goog.provide('myphysicslab.sims.engine2D.PendulumSpringApp');

goog.require('goog.array');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.JointUtil');
goog.require('myphysicslab.lab.engine2D.Scrim');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.graph.AutoScale');
goog.require('myphysicslab.lab.graph.DisplayGraph');
goog.require('myphysicslab.lab.graph.GraphLine');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AutoScale = lab.graph.AutoScale;
const CheckBoxControl = goog.module.get('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.module.get('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
var CommonControls = sims.common.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.module.get('myphysicslab.lab.model.DampingLaw');
var DisplayGraph = lab.graph.DisplayGraph;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DApp = sims.engine2D.Engine2DApp;
var GraphLine = lab.graph.GraphLine;
const GravityLaw = goog.module.get('myphysicslab.lab.model.GravityLaw');
var JointUtil = lab.engine2D.JointUtil;
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
var Scrim = lab.engine2D.Scrim;
var Shapes = lab.engine2D.Shapes;
const Spring = goog.module.get('myphysicslab.lab.model.Spring');
var TabLayout = sims.common.TabLayout;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var Walls = lab.engine2D.Walls;

/** Simulates a pendulum attached to another body with a spring.
The pendulum is a rigid body with a pivot attached to the background.

Includes demonstration of using a DisplayGraph to show the movement of a body
as trailing lines following the body. Also demonstrates automatically zooming
the view to show the graph as it is drawn.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.PendulumSpringApp = function(elem_ids) {
  var simRect = new DoubleRect(-4, -4, 4, 4);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.layout.simCanvas.setBackground('black');
  this.mySim.setShowForces(false);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0.05, 0.15, this.simList);
  this.mySim.addForceLaw(this.dampingLaw);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(4, this.simList);
  this.mySim.addForceLaw(this.gravityLaw);

  /** @type {!Array<!Spring>} */
  this.springs_ = [];

  // wallPivot = where in world space the pivot is
  var wallPivotX = 2.0;
  var wallPivotY = 0;
  var map = this.simView.getCoordMap();
  var pendulum = Shapes.makeBlock2(0.3, 1.0, PendulumSpringApp.en.PENDULUM,
      PendulumSpringApp.i18n.PENDULUM);
  var bodyX = 0.5*pendulum.getWidth();
  var bodyY = 0.15*pendulum.getHeight();
  this.mySim.addBody(pendulum);
  this.displayList.findShape(pendulum).setFillStyle('#B0C4DE');
  // joints to attach upper pendulum to a fixed point.
  JointUtil.attachRigidBody(this.mySim,
      Scrim.getScrim(), /*attach_body=*/new Vector(wallPivotX, wallPivotY),
      pendulum, /*attach_body=*/new Vector(bodyX, bodyY),
      /*normalType=*/CoordType.WORLD);

  var block = Shapes.makeBlock2(0.3, 1.0, PendulumSpringApp.en.BLOCK,
      PendulumSpringApp.i18n.BLOCK);
  block.setPosition(new Vector(-1.2,  -2.5),  0.2);
  this.mySim.addBody(block);
   //transparent orange
  this.displayList.findShape(block).setFillStyle('rgba(255, 165, 0, 0.5)');

  this.rbo.protoSpring.setWidth(0.3);
  this.addSpring(new Spring('spring1',
      pendulum, new Vector(0.15, 0.7),
      block, new Vector(0.15, 0.7),
      /*restLength=*/0.75, /*stiffness=*/1.0));
  this.addSpring(new Spring('spring2',
      block, new Vector(0.15, 0.7),
      Scrim.getScrim(), new Vector(-2, 2),
      /*restLength=*/0.75, /*stiffness=*/1.0));
  this.addSpring(new Spring('spring3',
      block, new Vector(0.15, 0.3),
      Scrim.getScrim(), new Vector(-2, -2),
      /*restLength=*/0.75, /*stiffness=*/1.0));

  // Walls.make also sets zero energy level for each block.
  var zel = Walls.make2(this.mySim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);

  // Set the pendulum's zero energy level to a custom setting.
  pendulum.setAngle(-Math.PI); // zero energy position, hanging straight down
  this.mySim.alignConnectors();
  // reset zero energy for pendulum
  pendulum.setZeroEnergyLevel();
  pendulum.setAngle(0.5); // move to starting position
  this.mySim.alignConnectors();
  this.mySim.setElasticity(0.3);
  this.mySim.saveInitialState();

  this.addPlaybackControls();
  /** @type {!ParameterBoolean} */
  var pb;
  /** @type {!ParameterNumber} */
  var pn;
  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addParameter(
      pn = new ParameterNumber(this, PendulumSpringApp.en.SPRING_STIFFNESS,
      PendulumSpringApp.i18n.SPRING_STIFFNESS,
      goog.bind(this.getStiffness, this), goog.bind(this.setStiffness, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(
      pn = new ParameterNumber(this, PendulumSpringApp.en.SPRING_LENGTH,
      PendulumSpringApp.i18n.SPRING_LENGTH,
      goog.bind(this.getRestLength, this), goog.bind(this.setRestLength, this)));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  // Demonstration of using a DisplayGraph to show the movement of a body
  // as trailing lines following the body.
  /** @type {!GraphLine} */
  this.graphLine = new GraphLine('TRAILS_LINE', this.mySim.getVarsList());
  this.simView.addMemo(this.graphLine);
  /** @type {!AutoScale} */
  this.autoScale = new AutoScale('TRAILS_AUTO_SCALE', this.graphLine, this.simView);
  /** @type {!DisplayGraph} */
  this.dispGraph = new DisplayGraph(this.graphLine);
  this.dispGraph.setZIndex(3);
  this.dispGraph.setScreenRect(this.simView.getScreenRect());
  this.displayList.add(this.dispGraph);

  this.panZoomParam.setValue(true);
  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup();
};
var PendulumSpringApp = sims.engine2D.PendulumSpringApp;
goog.inherits(PendulumSpringApp, Engine2DApp);

/** @override */
PendulumSpringApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      +', graphLine: '+this.graphLine.toStringShort()
      +', autoScale: '+this.autoScale.toStringShort()
      + PendulumSpringApp.superClass_.toString.call(this);
};

/**
* @param {!Spring} s
* @private
*/
PendulumSpringApp.prototype.addSpring = function(s) {
  this.springs_.push(s);
  this.mySim.addForceLaw(s);
  this.simList.add(s);
};

/** @override */
PendulumSpringApp.prototype.getClassName = function() {
  return 'PendulumSpringApp';
};

/** @override */
PendulumSpringApp.prototype.defineNames = function(myName) {
  PendulumSpringApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw|graphLine|autoScale',
       myName+'.');
  this.terminal.addRegex('PendulumSpringApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
PendulumSpringApp.prototype.getSubjects = function() {
  var subjects = PendulumSpringApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.gravityLaw, this.dampingLaw, this.graphLine,
       this.autoScale, subjects);
};

/** @override */
PendulumSpringApp.prototype.graphSetup = function(body) {
  var bodyIdx = this.mySim.getBody('block').getVarsIndex();
  this.graphLine.setXVariable(bodyIdx+0);
  this.graphLine.setYVariable(bodyIdx+2);
  this.graph.line.setXVariable(bodyIdx+0);
  this.graph.line.setYVariable(bodyIdx+2);
  this.timeGraph.line1.setYVariable(bodyIdx+0);
  this.timeGraph.line2.setYVariable(bodyIdx+2);
};

/**
* @return {number}
*/
PendulumSpringApp.prototype.getStiffness = function() {
  return this.springs_[0].getStiffness();
};

/**
* @param {number} value
*/
PendulumSpringApp.prototype.setStiffness = function(value) {
  goog.array.forEach(this.springs_, function(s){
    s.setStiffness(value);});
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.mySim.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(PendulumSpringApp.en.SPRING_STIFFNESS);
};

/**
* @return {number}
*/
PendulumSpringApp.prototype.getRestLength = function() {
  return this.springs_[0].getRestLength();
};

/**
* @param {number} value
*/
PendulumSpringApp.prototype.setRestLength = function(value) {
  goog.array.forEach(this.springs_, function(s){
    s.setRestLength(value);});
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.mySim.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(PendulumSpringApp.en.SPRING_LENGTH);
};

/** Set of internationalized strings.
@typedef {{
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  BLOCK: string,
  PENDULUM: string
  }}
*/
PendulumSpringApp.i18n_strings;

/**
@type {PendulumSpringApp.i18n_strings}
*/
PendulumSpringApp.en = {
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  BLOCK: 'block',
  PENDULUM: 'pendulum'
};

/**
@private
@type {PendulumSpringApp.i18n_strings}
*/
PendulumSpringApp.de_strings = {
  SPRING_LENGTH: 'Federl\u00e4nge',
  SPRING_STIFFNESS: 'Federsteifheit',
  BLOCK: 'Block',
  PENDULUM: 'Pendel'
};

/** Set of internationalized strings.
@type {PendulumSpringApp.i18n_strings}
*/
PendulumSpringApp.i18n = goog.LOCALE === 'de' ? PendulumSpringApp.de_strings :
    PendulumSpringApp.en;

}); // goog.scope
