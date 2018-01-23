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

goog.provide('myphysicslab.sims.pendulum.CompareDoublePendulumApp');

goog.require('goog.array');
goog.require('myphysicslab.lab.app.RigidBodyEventHandler');
goog.require('myphysicslab.lab.app.SimController');
goog.require('myphysicslab.lab.app.SimRunner');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.LabControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.engine2D.CollisionHandling');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.ExtraAccel');
goog.require('myphysicslab.lab.engine2D.Joint');
goog.require('myphysicslab.lab.engine2D.RigidBodySim');
goog.require('myphysicslab.lab.engine2D.Scrim');
goog.require('myphysicslab.lab.graph.AutoScale');
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.graph.DisplayGraph');
goog.require('myphysicslab.lab.graph.EnergyBarGraph');
goog.require('myphysicslab.lab.graph.GraphLine');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Simulation');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.Clock');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.EasyScriptParser');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayClock');
goog.require('myphysicslab.lab.view.DisplayConnector');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DrawingMode');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.CompareGraph');
goog.require('myphysicslab.sims.common.CompareTimeGraph');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.engine2D.RigidBodyObserver');
goog.require('myphysicslab.sims.pendulum.RigidDoublePendulumSim');

goog.require('myphysicslab.lab.graph.VarsHistory'); // for possible use in Terminal
goog.require('myphysicslab.lab.model.ExpressionVariable'); // for usage in Terminal
goog.require('myphysicslab.lab.model.FunctionVariable'); // for usage in Terminal
goog.require('myphysicslab.lab.util.ClockTask'); // for usage in Terminal
goog.require('myphysicslab.lab.util.GenericMemo'); // for usage in Terminal
goog.require('myphysicslab.lab.view.DisplayText'); // for usage in Terminal

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const AbstractSubject = goog.module.get('myphysicslab.lab.util.AbstractSubject');
var AutoScale = lab.graph.AutoScale;
const CheckBoxControl = goog.module.get('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.module.get('myphysicslab.lab.controls.ChoiceControl');
const Clock = goog.module.get('myphysicslab.lab.util.Clock');
const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
const CollisionHandling = goog.module.get('myphysicslab.lab.engine2D.CollisionHandling');
var CommonControls = sims.common.CommonControls;
var CompareGraph = sims.common.CompareGraph;
var CompareTimeGraph = sims.common.CompareTimeGraph;
const ConcreteLine = goog.module.get('myphysicslab.lab.model.ConcreteLine');
const ContactSim = goog.module.get('myphysicslab.lab.engine2D.ContactSim');
var DisplayAxes = lab.graph.DisplayAxes;
const DisplayClock = goog.module.get('myphysicslab.lab.view.DisplayClock');
const DisplayConnector = goog.module.get('myphysicslab.lab.view.DisplayConnector');
var DisplayGraph = lab.graph.DisplayGraph;
const DisplayList = goog.module.get('myphysicslab.lab.view.DisplayList');
const DisplayShape = goog.module.get('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const DrawingMode = goog.module.get('myphysicslab.lab.view.DrawingMode');
const EasyScriptParser = goog.module.get('myphysicslab.lab.util.EasyScriptParser');
var EnergyBarGraph = lab.graph.EnergyBarGraph;
const ExtraAccel = goog.module.get('myphysicslab.lab.engine2D.ExtraAccel');
const GenericObserver = goog.module.get('myphysicslab.lab.util.GenericObserver');
var GraphLine = lab.graph.GraphLine;
const GravityLaw = goog.module.get('myphysicslab.lab.model.GravityLaw');
const Joint = goog.module.get('myphysicslab.lab.engine2D.Joint');
const LabControl = goog.module.get('myphysicslab.lab.controls.LabControl');
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const Parameter = goog.module.get('myphysicslab.lab.util.Parameter');
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.module.get('myphysicslab.lab.util.ParameterString');
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
var RigidBodyEventHandler = lab.app.RigidBodyEventHandler;
var RigidBodyObserver = sims.engine2D.RigidBodyObserver;
const RigidBodySim = goog.module.get('myphysicslab.lab.engine2D.RigidBodySim');
var RigidDoublePendulumSim = sims.pendulum.RigidDoublePendulumSim;
const Scrim = goog.module.get('myphysicslab.lab.engine2D.Scrim');
var SimController = lab.app.SimController;
const SimList = goog.module.get('myphysicslab.lab.model.SimList');
const SimpleAdvance = goog.module.get('myphysicslab.lab.model.SimpleAdvance');
var SimRunner = lab.app.SimRunner;
const Simulation = goog.module.get('myphysicslab.lab.model.Simulation');
const SimView = goog.module.get('myphysicslab.lab.view.SimView');
const SliderControl = goog.module.get('myphysicslab.lab.controls.SliderControl');
var TabLayout = sims.common.TabLayout;
const Terminal = goog.module.get('myphysicslab.lab.util.Terminal');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Compares two double pendulum simulations that are run simultaneously: the
theoretically accurate {@link RigidDoublePendulumSim} and the equivalent double
pendulum using the engine2D physics engine's {@link ContactSim}. The purpose is to show
that the two are closely equivalent.

The angles shown in graphs are modified for the ContactSim so that they are equivalent
to the corresponding RigidDoublePendulumSim angles. The adjustment is given by
{@link RigidDoublePendulumSim#getGamma1} and {@link RigidDoublePendulumSim#getGamma2}.

Creates instance objects such as the simulation and display objects;
defines regular expressions for easy Terminal scripting of these objects using short
names instead of fully qualified property names.

The constructor takes an argument that specifies the names of the HTML elementId's to
look for in the HTML document; these elements are where the user interface of the
simulation is created. This allows for having two separate simulation apps running
concurrently on a single page.

No global variables are created other than two root global variables: the
`myphysicslab` global holds all of the myPhysicsLab classes; and a global variable is
created for this application instance. This application global is created outside of
this file in the HTML where the constructor is called. The name of that global variable
holding the application is passed to defineNames() method so that short-names in scripts
can be properly expanded.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {boolean} centered determines which pendulum configuration to make: centered
*    (true) or offset (false)
* @constructor
* @final
* @struct
* @extends {AbstractSubject}
* @export
*/
myphysicslab.sims.pendulum.CompareDoublePendulumApp = function(elem_ids, centered) {
  Util.setErrorHandler();
  AbstractSubject.call(this, 'APP');
  /** horizontal distance between the fixed pivot points of the two sims.
  * @type {number}
  */
  this.separation = 1.0;
  /** @type {!TabLayout} */
  this.layout = new TabLayout(elem_ids);
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  // keep reference to terminal to make for shorter 'expanded' names
  /** @type {!Terminal} */
  this.terminal = this.layout.terminal;
  var simCanvas = this.layout.simCanvas;

  /** @type {!RigidDoublePendulumSim.Parts} */
  this.parts = centered ? RigidDoublePendulumSim.makeCentered(0.25 * Math.PI, 0)
        : RigidDoublePendulumSim.makeOffset(0.25 * Math.PI, 0);
  /** @type {!RigidDoublePendulumSim} */
  this.sim1 = new RigidDoublePendulumSim(this.parts, 'SIM_1');
  /** @type {!SimpleAdvance} */
  this.advance1 = new SimpleAdvance(this.sim1);
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim1, goog.bind(function(evt) {
    this.sim1.modifyObjects();
  }, this), 'modifyObjects after parameter or variable change');

  /** @type {!ContactSim} */
  this.sim2 = new ContactSim('SIM_2');
  /** @type {!CollisionAdvance} */
  this.advance2 = new CollisionAdvance(this.sim2);
  this.terminal.setAfterEval(goog.bind(function() {
      this.sim1.modifyObjects();
      this.sim2.modifyObjects();
    }, this));
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim2, goog.bind(function(evt) {
    this.sim2.modifyObjects();
  }, this), 'modifyObjects after parameter or variable change');
  // These settings are important to stop joints from drifting apart,
  // and have energy be stable.
  this.sim2.setCollisionHandling(CollisionHandling.SERIAL_GROUPED);
  this.sim2.setExtraAccel(ExtraAccel.NONE);
  this.advance2.setJointSmallImpacts(true);
  /** @type {!DoubleRect} */
  this.simRect = new DoubleRect(-2, -2, 2, 2);
  /** @type {!SimView} */
  this.simView = new SimView('simView', this.simRect);
  /** @type {!DisplayList} */
  this.displayList = this.simView.getDisplayList();
  simCanvas.addView(this.simView);
  /** @type {!SimView} */
  this.statusView = new SimView('status', new DoubleRect(-10, -10, 10, 10));
  simCanvas.addView(this.statusView);
  /** @type {!DisplayAxes} */
  this.axes = CommonControls.makeAxes(this.simView, /*bottomLeft=*/true);
  /** @type {!SimRunner} */
  this.simRun = new SimRunner(this.advance1);
  this.simRun.addStrategy(this.advance2);
  this.simRun.addCanvas(simCanvas);
  /** @type {!Clock} */
  this.clock = this.simRun.getClock();
  /** @type {!RigidBodyEventHandler} */
  this.rbeh = new RigidBodyEventHandler(this.sim2, this.clock);
  /** @type {!SimController} */
  this.simCtrl = new SimController(simCanvas, /*eventHandler=*/this.rbeh);
  /** @type {!SimList} */
  this.simList2 = this.sim2.getSimList();
  /** @type {!RigidBodyObserver} */
  this.rbo = new RigidBodyObserver(this.simList2, this.simView.getDisplayList());
  this.rbo.protoDragSpring.setWidth(0.2);
  this.rbo.protoPolygon = new DisplayShape().setDrawCenterOfMass(true)
      .setDrawDragPoints(true);
  // move the parts horizontally so that we can see them side-by-side with other sim
  var pivot = new Vector(this.separation, 0);
  /** @type {!RigidDoublePendulumSim.Parts} */
  this.parts2 = centered ? RigidDoublePendulumSim.makeCentered(0.25 * Math.PI, 0, pivot)
        : RigidDoublePendulumSim.makeOffset(0.25 * Math.PI, 0, pivot);
  var bod = this.parts2.bodies[0];
  this.sim2.addBody(bod);
  this.displayList.findShape(bod).setFillStyle('#f99');
  this.sim2.addBody(bod =this.parts2.bodies[1]);
  this.displayList.findShape(bod).setFillStyle('#f66');
  this.sim2.addConnectors(this.parts2.joints);
  this.sim2.alignConnectors();
  this.sim2.saveInitialState();
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(this.sim1.getGravity(), this.simList2);
  this.sim2.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.simList2);

  var angle1Name = Util.toName(RigidDoublePendulumSim.en.ANGLE_1);
  var angle2Name = Util.toName(RigidDoublePendulumSim.en.ANGLE_2);
  new GenericObserver(this.sim1, goog.bind(function(evt) {
    if (evt.nameEquals(Simulation.RESET)) {
      // When initial angles are changed in sim, then clock time is also reset.
      // This helps with feedback when dragging angle slider,
      // especially if the clock is running.
      this.clock.setTime(this.sim1.getTime());
    } else if (evt.nameEquals(RigidDoublePendulumSim.en.ANGLE_1) ||
        evt.nameEquals(RigidDoublePendulumSim.en.ANGLE_2)) {
      // When initial angles are changed in sim, set sim2 to use same angles.
      this.sim2.reset();
      var p1 = this.sim2.getBody('pendulum1');
      var p2 = this.sim2.getBody('pendulum2');
      p1.setAngle(this.sim1.getAngle1());
      p2.setAngle(this.sim1.getAngle2());
      p1.setVelocity(new Vector(0,  0),  0);
      p2.setVelocity(new Vector(0,  0),  0);
      this.sim2.initializeFromBody(p1);
      this.sim2.initializeFromBody(p2);
      this.sim2.alignConnectors();
      this.sim2.saveInitialState();
    }
  }, this), 'match initial angles');

  // Changing separation doesn't modify initial conditions; so we have to
  // set the separation after a RESET occurs.
  new GenericObserver(this.simRun, goog.bind(function(evt) {
    if (evt.nameEquals(SimRunner.RESET)) {
      this.setSeparation_();
      this.sim2.saveInitialState();
    }
  }, this), 'set separation after reset');

  /** @type {!DisplayShape} */
  this.protoRigidBody = new DisplayShape().setDrawCenterOfMass(true);
  /** @type {!DisplayShape} */
  this.bob0 = new DisplayShape(this.parts.bodies[0], this.protoRigidBody)
      .setFillStyle('#3cf');
  this.bob0.setDragable(false);
  this.displayList.add(this.bob0);
  /** @type {!DisplayShape} */
  this.bob1 = new DisplayShape(this.parts.bodies[1], this.protoRigidBody)
      .setFillStyle('#39c');
  this.bob1.setDragable(false);
  this.displayList.add(this.bob1);
  /** @type {!DisplayConnector} */
  this.joint0 = new DisplayConnector(this.parts.joints[0]);
  this.displayList.add(this.joint0);
  /** @type {!DisplayConnector} */
  this.joint1 = new DisplayConnector(this.parts.joints[1]);
  this.displayList.add(this.joint1);
  this.sim1.saveInitialState();

  var energyInfo1 = this.sim1.getEnergyInfo();
  this.sim2.setPotentialEnergy(energyInfo1.getPotential());

  /** @type {!ParameterBoolean} */
  var pb;
  /** @type {!ParameterNumber} */
  var pn;
  /** @type {!ParameterString} */
  var ps;

  // ********* simulation controls  *************
  this.addControl(CommonControls.makePlaybackControls(this.simRun));

  pn = new ParameterNumber(this, CompareDoublePendulumApp.en.SEPARATION,
      CompareDoublePendulumApp.i18n.SEPARATION,
      goog.bind(this.getSeparation, this), goog.bind(this.setSeparation, this));
  this.addParameter(pn);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.sim1.getParameterNumber(RigidDoublePendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  // sync gravity in both sims
  new GenericObserver(this.sim1, goog.bind(function(evt) {
    if (evt.nameEquals(RigidDoublePendulumSim.en.GRAVITY)) {
      this.gravityLaw.setGravity(this.sim1.getGravity());
    }
  }, this), 'sync gravity in both sims');

  pn = this.sim1.getParameterNumber(RigidDoublePendulumSim.en.ANGLE_1);
  this.addControl(new SliderControl(pn, -Math.PI, Math.PI, /*multiply=*/false));

  pn = this.sim1.getParameterNumber(RigidDoublePendulumSim.en.ANGLE_2);
  this.addControl(new SliderControl(pn, -Math.PI, Math.PI, /*multiply=*/false));

  pb = this.sim2.getParameterBoolean(RigidBodySim.en.SHOW_FORCES);
  this.addControl(new CheckBoxControl(pb));

  /** @type {!EnergyBarGraph} */
  this.energyGraph1 = new EnergyBarGraph(this.sim1);
  this.energyGraph1.potentialColor = '#039';
  this.energyGraph1.translationColor = '#06c';
  this.energyGraph1.rotationColor = '#6cf';
  /** @type {!ParameterBoolean} */
  this.showEnergyParam1 = CommonControls.makeShowEnergyParam(this.energyGraph1,
      this.statusView, this);
  this.addControl(new CheckBoxControl(this.showEnergyParam1));

  /** @type {!EnergyBarGraph} */
  this.energyGraph2 = new EnergyBarGraph(this.sim2);
  this.energyGraph2.potentialColor = '#903';
  this.energyGraph2.translationColor = '#f33';
  this.energyGraph2.rotationColor = '#f99';
  this.energyGraph2.setPosition(new Vector(0, 6));
  /** @type {!ParameterBoolean} */
  this.showEnergyParam2 = CommonControls.makeShowEnergyParam(this.energyGraph2,
      this.statusView, this, CompareDoublePendulumApp.en.SHOW_ENERGY_2,
      CompareDoublePendulumApp.i18n.SHOW_ENERGY_2);
  this.addControl(new CheckBoxControl(this.showEnergyParam2));

  /** @type {!DisplayClock} */
  this.displayClock = new DisplayClock(goog.bind(this.sim1.getTime, this.sim1),
      goog.bind(this.clock.getRealTime, this.clock), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
  pb = CommonControls.makeShowClockParam(this.displayClock, this.statusView, this);
  this.addControl(new CheckBoxControl(pb));

  var panzoom_simview = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true,
      goog.bind(function () { this.simView.setSimRect(this.simRect); }, this));
  this.layout.div_sim.appendChild(panzoom_simview);
  pb = CommonControls.makeShowPanZoomParam(panzoom_simview, this);
  pb.setValue(false);
  this.addControl(new CheckBoxControl(pb));

  pn = this.simRun.getParameterNumber(SimRunner.en.TIME_STEP);
  this.addControl(new NumericControl(pn));
  pn = this.simRun.getClock().getParameterNumber(Clock.en.TIME_RATE);
  this.addControl(new NumericControl(pn));
  var bm = CommonControls.makeBackgroundMenu(this.layout.simCanvas);
  this.addControl(bm);

  var gamma1 = this.sim1.getGamma1();
  var gamma2 = this.sim1.getGamma2();
  var line1 = new GraphLine('GRAPH_LINE_1', this.sim1.getVarsList());
  line1.setXVariable(0);
  line1.setYVariable(2);
  line1.setColor('blue');
  line1.setDrawingMode(DrawingMode.DOTS);

  var line2 = new GraphLine('GRAPH_LINE_2', this.sim2.getVarsList());
  line2.setXVariable(8);
  line2.setYVariable(14);
  line2.xTransform = function(x, y) { return x + gamma1; };
  line2.yTransform = function(x, y) { return y + gamma2; };
  line2.setColor('red');
  line2.setDrawingMode(DrawingMode.DOTS);

  /** translate variable index of sim1 to equivalent variable of sim2
  * @type {function(number): number}
  */
  var translate = function(v1) {
    switch (v1) {
      case 0: return 8; // angle1
      case 1: return 9; // angle1 velocity
      case 2: return 14; // angle2
      case 3: return 15; // angle2 velocity
      case 4: return 1; // kinetic energy
      case 5: return 2; // potential energy
      case 6: return 3; // total energy
      case 7: return 0; // time
      default: throw new Error();
    }
  };

  // keep line2's X and Y variable in sync with line1
  var paramY = line1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  var paramX = line1.getParameterNumber(GraphLine.en.X_VARIABLE);
  new GenericObserver(line1, function(evt) {
    if (evt == paramY) {
      var yVar1 = paramY.getValue();
      line2.setYVariable(translate(yVar1));
      // adjust the angles of sim2 to be comparable to those of sim1
      if (yVar1 == 0) {
        line2.yTransform = function(x, y) { return y + gamma1; };
      } else if (yVar1 == 2) {
        line2.yTransform = function(x, y) { return y + gamma2; };
      } else {
        line2.yTransform = function(x, y) { return y; };
      }
    } else if (evt == paramX) {
      var xVar1 = paramX.getValue();
      line2.setXVariable(translate(xVar1));
      // adjust the angles of sim2 to be comparable to those of sim1
      if (xVar1 == 0) {
        line2.xTransform = function(x, y) { return x + gamma1; };
      } else if (xVar1 == 2) {
        line2.xTransform = function(x, y) { return x + gamma2; };
      } else {
        line2.xTransform = function(x, y) { return x; };
      }
    }
  }, 'keep line2\'s X and Y variable in sync with line1');

  /** @type {!CompareGraph} */
  this.graph = new CompareGraph(line1, line2,
      this.layout.graphCanvas,
      this.layout.graph_controls, this.layout.div_graph, this.simRun);

  var timeLine1 = new GraphLine('TIME_LINE_1', this.sim1.getVarsList());
  timeLine1.setYVariable(0); // angle1
  timeLine1.setColor('blue');
  timeLine1.setDrawingMode(DrawingMode.DOTS);
  var timeLine2 = new GraphLine('TIME_LINE_2', this.sim2.getVarsList());
  timeLine2.setYVariable(8); // angle1
  timeLine2.yTransform = function(x, y) { return y + gamma1; };
  timeLine2.setColor('red');
  timeLine2.setDrawingMode(DrawingMode.DOTS);
  // keep timeLine2's Y variable in sync with timeLine1
  var timeParamY = timeLine1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  new GenericObserver(timeLine1, function(evt) {
    if (evt == timeParamY) {
      var yVar1 = timeParamY.getValue();
      timeLine2.setYVariable(translate(yVar1));
      // adjust the angles of sim2 to be comparable to those of sim1
      if (yVar1 == 0) {
        timeLine2.yTransform = function(x, y) { return y + gamma1; };
      } else if (yVar1 == 2) {
        timeLine2.yTransform = function(x, y) { return y + gamma2; };
      } else {
        timeLine2.yTransform = function(x, y) { return y; };
      }
    }
  }, 'keep timeLine2\'s Y variable in sync with timeLine1');
  /** @type {!CompareTimeGraph} */
  this.timeGraph = new CompareTimeGraph(timeLine1, timeLine2,
      this.layout.timeGraphCanvas,
      this.layout.time_graph_controls, this.layout.div_time_graph, this.simRun);

  var subjects = [
    this,
    this.sim1,
    this.sim2,
    this.simRun,
    this.clock,
    this.simView,
    this.statusView,
    this.gravityLaw,
    this.sim1.getVarsList(),
    this.sim2.getVarsList()
  ];
  subjects = goog.array.concat(subjects, this.layout.getSubjects(),
      this.graph.getSubjects(), this.timeGraph.getSubjects());
  /** @type {!EasyScriptParser} */
  this.easyScript = CommonControls.makeEasyScript(subjects, [], this.simRun,
      this.terminal);
  this.addControl(CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  this.graph.addControl(
    CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  this.timeGraph.addControl(
    CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
};
var CompareDoublePendulumApp = myphysicslab.sims.pendulum.CompareDoublePendulumApp;
goog.inherits(CompareDoublePendulumApp, AbstractSubject);

/** @override */
CompareDoublePendulumApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', sim1: '+this.sim1.toStringShort()
      +', sim2: '+this.sim2.toStringShort()
      +', terminal: '+this.terminal
      +', graph: '+this.graph
      +', timeGraph: '+this.timeGraph
      + CompareDoublePendulumApp.superClass_.toString.call(this);
};

/** @override */
CompareDoublePendulumApp.prototype.getClassName = function() {
  return 'CompareDoublePendulumApp';
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'app.sim' when `myName` is 'app'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
CompareDoublePendulumApp.prototype.defineNames = function(myName) {
  if (Util.ADVANCED)
    return;
  this.terminal.addWhiteList(myName);
  this.terminal.addRegex('advance1|advance2|axes|clock|displayClock'
      +'|energyGraph1|energyGraph2|graph|layout|sim1|sim2|simCtrl|simList'
      +'|simRect|simRun|simView|statusView|timeGraph|easyScript'
      +'|displayList|bob0|bob1|joint0|joint1|terminal|rbo',
      myName+'.');
  this.terminal.addRegex('simCanvas',
      myName+'.layout.');
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
CompareDoublePendulumApp.prototype.addControl = function(control) {
  return this.layout.addControl(control);
};

/**
* @return {undefined}
* @export
*/
CompareDoublePendulumApp.prototype.setup = function() {
  this.clock.resume();
  this.terminal.parseURLorRecall();
  this.sim1.saveInitialState();
  this.sim1.modifyObjects();
};

/** Start the application running.
* @return {undefined}
* @export
*/
CompareDoublePendulumApp.prototype.start = function() {
  this.simRun.startFiring();
  //console.log(Util.prettyPrint(this.toString()));
};

/**
* @param {string} script
* @param {boolean=} opt_output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @return {*}
* @export
*/
CompareDoublePendulumApp.prototype.eval = function(script, opt_output) {
  try {
    return this.terminal.eval(script, opt_output);
  } catch(ex) {
    alert(ex);
  }
};

/** Returns the distance between the fixed pivot points of the two double pendulums.
* @return {number} distance between the fixed pivot points
*/
CompareDoublePendulumApp.prototype.getSeparation = function() {
  return this.separation;
};

/** Sets the distance between the fixed pivot points of the two double pendulums.
* @param {number} value distance between the fixed pivot points
*/
CompareDoublePendulumApp.prototype.setSeparation = function(value) {
  if (this.separation != value) {
    this.separation = value;
    this.setSeparation_();
    this.broadcastParameter(CompareDoublePendulumApp.en.SEPARATION);
  }
};

/**
* @return {undefined}
* @private
*/
CompareDoublePendulumApp.prototype.setSeparation_ = function() {
    // Because Joint is immutable we have to replace with a different Joint.
    // (Alternative: connect to an infinite mass 'anchor' body instead of Scrim, and
    // then move the anchor body).
    goog.array.forEach(this.sim2.getConnectors(), function(connector) {
      if (!(connector instanceof Joint)) {
        return;
      }
      var joint = /** @type {!Joint} */(connector);
      if (joint.getBody1() == Scrim.getScrim()) {
        this.sim2.removeConnector(joint);
        // same joint info, except different attachment point
        var j_new = new Joint(
          joint.getBody1(), /*attach_body=*/new Vector(this.separation, 0),
          joint.getBody2(), /*attach_body=*/joint.getAttach2(),
          joint.getNormalType(), joint.getNormal()
        );
        // 'follow=null' means: add to front of list of connectors
        // (order is significant when doing alignConnectors)
        this.sim2.addConnector(j_new, /*follow=*/null);
      }
    }, this);
    this.sim2.alignConnectors();
};

/** Set of internationalized strings.
@typedef {{
  SEPARATION: string,
  SHOW_ENERGY_2: string
  }}
*/
CompareDoublePendulumApp.i18n_strings;

/**
@private
@type {CompareDoublePendulumApp.i18n_strings}
*/
CompareDoublePendulumApp.en = {
  SEPARATION: 'separation',
  SHOW_ENERGY_2: 'show energy 2'
};

/**
@private
@type {CompareDoublePendulumApp.i18n_strings}
*/
CompareDoublePendulumApp.de_strings = {
  SEPARATION: 'Abstand',
  SHOW_ENERGY_2: 'Energieanzeige 2'
};

/** Set of internationalized strings.
@type {CompareDoublePendulumApp.i18n_strings}
*/
CompareDoublePendulumApp.i18n = goog.LOCALE === 'de' ? CompareDoublePendulumApp.de_strings :
    CompareDoublePendulumApp.en;

}); // goog.scope
