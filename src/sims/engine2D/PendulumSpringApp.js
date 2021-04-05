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

goog.module('myphysicslab.sims.engine2D.PendulumSpringApp');

const AutoScale = goog.require('myphysicslab.lab.graph.AutoScale');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DisplayGraph = goog.require('myphysicslab.lab.graph.DisplayGraph');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const GraphLine = goog.require('myphysicslab.lab.graph.GraphLine');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const JointUtil = goog.require('myphysicslab.lab.engine2D.JointUtil');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Scrim = goog.require('myphysicslab.lab.engine2D.Scrim');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/** Simulates a pendulum attached to another body with a spring.
The pendulum is a rigid body with a pivot attached to the background.

Includes demonstration of using a DisplayGraph to show the movement of a body
as trailing lines following the body. Also demonstrates automatically zooming
the view to show the graph as it is drawn.
*/
class PendulumSpringApp extends Engine2DApp {
/**
* @param {!Object} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  const simRect = new DoubleRect(-4, -4, 4, 4);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  this.layout.getSimCanvas().setBackground('black');
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
  const wallPivotX = 2.0;
  const wallPivotY = 0;
  const map = this.simView.getCoordMap();
  const pendulum = Shapes.makeBlock2(0.3, 1.0, PendulumSpringApp.en.PENDULUM,
      PendulumSpringApp.i18n.PENDULUM);
  const bodyX = 0.5*pendulum.getWidth();
  const bodyY = 0.15*pendulum.getHeight();
  this.mySim.addBody(pendulum);
  this.displayList.findShape(pendulum).setFillStyle('#B0C4DE');
  // joints to attach upper pendulum to a fixed point.
  JointUtil.attachRigidBody(this.mySim,
      Scrim.getScrim(), /*attach_body=*/new Vector(wallPivotX, wallPivotY),
      pendulum, /*attach_body=*/new Vector(bodyX, bodyY),
      /*normalType=*/CoordType.WORLD);

  const block = Shapes.makeBlock2(0.3, 1.0, PendulumSpringApp.en.BLOCK,
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
  const zel = Walls.make2(this.mySim, this.simView.getSimRect());
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
  let pb;
  /** @type {!ParameterNumber} */
  let pn;
  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addParameter(
      pn = new ParameterNumber(this, PendulumSpringApp.en.SPRING_STIFFNESS,
      PendulumSpringApp.i18n.SPRING_STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(
      pn = new ParameterNumber(this, PendulumSpringApp.en.SPRING_LENGTH,
      PendulumSpringApp.i18n.SPRING_LENGTH,
      () => this.getRestLength(), a => this.setRestLength(a)));
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

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      +', graphLine: '+this.graphLine.toStringShort()
      +', autoScale: '+this.autoScale.toStringShort()
      + super.toString();
};

/**
* @param {!Spring} s
* @private
*/
addSpring(s) {
  this.springs_.push(s);
  this.mySim.addForceLaw(s);
  this.simList.add(s);
};

/** @override */
getClassName() {
  return 'PendulumSpringApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw|graphLine|autoScale',
       myName+'.');
  this.terminal.addRegex('PendulumSpringApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  return super.getSubjects().concat(this.gravityLaw, this.dampingLaw, this.graphLine,
       this.autoScale);
};

/** @override */
graphSetup(body) {
  const bodyIdx = this.mySim.getBody('block').getVarsIndex();
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
getStiffness() {
  return this.springs_[0].getStiffness();
};

/**
* @param {number} value
*/
setStiffness(value) {
  this.springs_.forEach(s =>  s.setStiffness(value));
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.mySim.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(PendulumSpringApp.en.SPRING_STIFFNESS);
};

/**
* @return {number}
*/
getRestLength() {
  return this.springs_[0].getRestLength();
};

/**
* @param {number} value
*/
setRestLength(value) {
  this.springs_.forEach(s =>  s.setRestLength(value));
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.mySim.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(PendulumSpringApp.en.SPRING_LENGTH);
};

} // end class

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
  SPRING_LENGTH: 'Federlänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  BLOCK: 'Block',
  PENDULUM: 'Pendel'
};

/** Set of internationalized strings.
@type {PendulumSpringApp.i18n_strings}
*/
PendulumSpringApp.i18n = goog.LOCALE === 'de' ? PendulumSpringApp.de_strings :
    PendulumSpringApp.en;

/**
* @param {!Object} elem_ids
* @return {!PendulumSpringApp}
*/
function makePendulumSpringApp(elem_ids) {
  return new PendulumSpringApp(elem_ids);
};
goog.exportSymbol('makePendulumSpringApp', makePendulumSpringApp);

exports = PendulumSpringApp;
