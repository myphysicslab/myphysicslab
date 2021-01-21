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

goog.module('myphysicslab.sims.engine2D.Engine2DApp');

const array = goog.require('goog.array');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const AutoScale = goog.require('myphysicslab.lab.graph.AutoScale');
const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const Clock = goog.require('myphysicslab.lab.util.Clock');
const CollisionHandling = goog.require('myphysicslab.lab.engine2D.CollisionHandling');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DiffEqSolverSubject = goog.require('myphysicslab.lab.model.DiffEqSolverSubject');
const DisplayAxes = goog.require('myphysicslab.lab.graph.DisplayAxes');
const DisplayClock = goog.require('myphysicslab.lab.view.DisplayClock');
const DisplayList = goog.require('myphysicslab.lab.view.DisplayList');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const ElasticitySetter = goog.require('myphysicslab.sims.engine2D.ElasticitySetter');
const EnergyBarGraph = goog.require('myphysicslab.lab.graph.EnergyBarGraph');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const LabelControl = goog.require('myphysicslab.lab.controls.LabelControl');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ODEAdvance = goog.require('myphysicslab.lab.model.ODEAdvance');
const Parameter = goog.require('myphysicslab.lab.util.Parameter');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBodyEventHandler = goog.require('myphysicslab.lab.app.RigidBodyEventHandler');
const RigidBodyObserver = goog.require('myphysicslab.sims.engine2D.RigidBodyObserver');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const EasyScriptParser = goog.require('myphysicslab.lab.util.EasyScriptParser');
const SimController = goog.require('myphysicslab.lab.app.SimController');
const SimRunner = goog.require('myphysicslab.lab.app.SimRunner');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimView = goog.require('myphysicslab.lab.view.SimView');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const StandardGraph1 = goog.require('myphysicslab.sims.common.StandardGraph1');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const SubjectList = goog.require('myphysicslab.lab.util.SubjectList');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const TimeGraph1 = goog.require('myphysicslab.sims.common.TimeGraph1');
const ToggleControl = goog.require('myphysicslab.lab.controls.ToggleControl');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Abstract base class that creates the standard set of views, graphs and controls
which are common to applications that run a
{@link RigidBodySim},
{@link myphysicslab.lab.engine2D.ImpulseSim ImpulseSim}, or
{@link myphysicslab.lab.engine2D.ContactSim ContactSim},

Creates instance objects such as the simulation and display objects;
defines regular expressions for easy Terminal scripting of these objects using short
names instead of fully qualified property names.

The constructor takes an argument that specifies the names of the HTML elementId's to
look for in the HTML document; these elements are where the user interface of the
simulation is created. This allows for having two separate simulation apps running
concurrently on a single page.

No global variables are created other than two root global variables: the `myphysicslab`
global holds all of the myPhysicsLab classes; and a global variable is created for this
application instance. This application global is created outside of this file in the
HTML where the constructor is called. The name of that global variable holding the
application is passed to {@link #defineNames} method so that short-names in scripts can
be properly expanded.

* @implements {SubjectList}
* @abstract
*/
class Engine2DApp extends AbstractSubject {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {!DoubleRect} simRect the dimensions of the simulation view;
*    this also sets the aspect ratio (width to height) of the canvas
* @param {!RigidBodySim} sim
* @param {!ODEAdvance} advance
* @param {string=} opt_name name of this Subject
*/
constructor(elem_ids, simRect, sim, advance, opt_name) {
  Util.setErrorHandler();
  super(opt_name || 'APP');
  /** @type {!DoubleRect} */
  this.simRect = simRect;
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  const canvasWidth = 800;
  const canvasHeight = Math.round(canvasWidth * this.simRect.getHeight() /
      this.simRect.getWidth());
  /** @type {!TabLayout} */
  this.layout = new TabLayout(elem_ids, canvasWidth, canvasHeight);
  // keep reference to terminal to make for shorter 'expanded' names
  /** @type {!Terminal} */
  this.terminal = this.layout.terminal;
  const simCanvas = this.layout.simCanvas;

  /** @type {!RigidBodySim} */
  this.sim = sim;
  this.terminal.setAfterEval( () => sim.modifyObjects() );
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(sim, evt => sim.modifyObjects(),
      'modifyObjects after parameter or variable change');
  sim.setShowForces(false);
  /** @type {!SimList} */
  this.simList = sim.getSimList();
  /** @type {!VarsList} */
  this.varsList = sim.getVarsList();
  /** @type {!ODEAdvance} */
  this.advance = advance;
  /** @type {!SimView} */
  this.simView = new SimView('SIM_VIEW', this.simRect);
  /** @type {!DisplayList} */
  this.displayList = this.simView.getDisplayList();
  simCanvas.addView(this.simView);
  /** @type {!SimView} */
  this.statusView = new SimView('STATUS_VIEW',new DoubleRect(-10, -10, 10, 10));
  this.statusList = this.statusView.getDisplayList();
  simCanvas.addView(this.statusView);
  /** @type {!DisplayAxes} */
  this.axes = CommonControls.makeAxes(this.simView, /*bottomLeft=*/true);
  /** @type {!SimRunner} */
  this.simRun = new SimRunner(advance);
  this.simRun.addCanvas(simCanvas);
  /** @type {!Clock} */
  this.clock = this.simRun.getClock();
  /** @type {!RigidBodyEventHandler} */
  this.rbeh = new RigidBodyEventHandler(sim, this.clock);
  /** @type {!SimController} */
  this.simCtrl = new SimController(simCanvas, this.rbeh);
  this.simRun.addErrorObserver(this.simCtrl);
  /** @type {!RigidBodyObserver} */
  this.rbo = new RigidBodyObserver(this.simList, this.displayList);

  /** @type {!ElasticitySetter} */
  this.elasticity = new ElasticitySetter(sim);

  /** @type {!EnergyBarGraph} */
  this.energyGraph = new EnergyBarGraph(sim);
  /** @type {!ParameterBoolean} */
  this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
      this.statusView, this);

  /** @type {!DisplayClock} */
  this.displayClock = new DisplayClock( () => sim.getTime(),
      () => this.clock.getRealTime(), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
  /** @type {!ParameterBoolean} */
  this.showClockParam = CommonControls.makeShowClockParam(this.displayClock,
      this.statusView, this);

  const panzoom = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true, () => this.simView.setSimRect(this.simRect) );
  this.layout.div_sim.appendChild(panzoom);
  /** @type {!ParameterBoolean} */
  this.panZoomParam = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.panZoomParam.setValue(false);

  /** @type {!DiffEqSolverSubject} */
  this.diffEqSolver = new DiffEqSolverSubject(sim, sim, advance);

  /** @type {!StandardGraph1} */
  this.graph = new StandardGraph1(sim.getVarsList(), this.layout.graphCanvas,
      this.layout.graph_controls, this.layout.div_graph, this.simRun);

  /** @type {!TimeGraph1} */
  this.timeGraph = new TimeGraph1(sim.getVarsList(), this.layout.timeGraphCanvas,
      this.layout.time_graph_controls, this.layout.div_time_graph, this.simRun);

  /** @type {!EasyScriptParser} */
  this.easyScript;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : ', sim: '+this.sim.toStringShort()
      +', elasticity: '+this.elasticity.toStringShort()
      +', simList: '+this.simList.toStringShort()
      +', simCtrl: '+this.simCtrl.toStringShort()
      +', advance: '+this.advance
      +', simRect: '+this.simRect
      +', simView: '+this.simView.toStringShort()
      +', statusView: '+this.statusView.toStringShort()
      +', axes: '+this.axes.toStringShort()
      +', simRun: '+this.simRun.toStringShort()
      +', clock: '+this.clock.toStringShort()
      +', displayClock: '+this.displayClock.toStringShort()
      +', energyGraph: '+this.energyGraph.toStringShort()
      +', rbeh: '+this.rbeh
      +', rbo: '+this.rbo
      +', graph: '+this.graph
      +', timeGraph: '+this.timeGraph
      +', layout: '+this.layout
      +', easyScript: '+this.easyScript.toStringShort()
      +', terminal: '+this.terminal
      + super.toString();
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'myApp.sim' when myName is 'myApp'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
defineNames(myName) {
  this.simRun.setAppName(myName);
  if (!Util.ADVANCED) {
    this.terminal.addWhiteList(myName);
    this.terminal.addRegex('advance|axes|clock|diffEqSolver|displayClock|energyGraph'
    +'|graph|layout|sim|simCtrl|simList|simRect|simRun|simView|statusView|timeGraph'
    +'|displayList|easyScript|terminal|statusList|elasticity|varsList|rbo',
        myName+'.');
    this.terminal.addRegex('simCanvas',
        myName+'.layout.');
  }
};

/** Watch a Parameter and when it changes note that there was a discontinuous change
* in potential and total energy.
* @param {!Parameter} parameter the Parameter to watch
*/
watchEnergyChange(parameter) {
  new GenericObserver(parameter.getSubject(), evt => {
    if (evt == parameter) {
      // Ensure that energy is updated now, so that the next time the data is
      // memorized the new sequence number goes with the new energy value.
      this.sim.modifyObjects();
      // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
      this.sim.getVarsList().incrSequence(2, 3);
    }
  }, 'record discontinuous energy changes');
};

/** @override */
getSubjects() {
  const subjects = [
    this,
    this.sim,
    this.elasticity,
    this.diffEqSolver,
    this.simRun,
    this.clock,
    this.simView,
    this.statusView,
    this.varsList
  ];
  return subjects.concat(this.layout.getSubjects(),
      this.graph.getSubjects(), this.timeGraph.getSubjects());
};

/** Creates the EasyScriptParser for this app. See explanation of
[dependent Subjects](myphysicslab.lab.util.EasyScriptParser.html#dependentsubjects)
in EasyScriptParser documentation.
* @param {!Array<!Subject>=} opt_dependent additional dependent Subjects
*/
makeEasyScript(opt_dependent) {
  let dependent = [ this.varsList ];
  if (Array.isArray(opt_dependent)) {
    dependent = dependent.concat(opt_dependent);
  }
  this.easyScript = CommonControls.makeEasyScript(this.getSubjects(), dependent,
      this.simRun, this.terminal);
};

/**
* @param {Polygon=} body the rigid body to show in graphs
* @return {undefined}
* @export
*/
graphSetup(body) {
  if (!body) {
    // find first body with finite mass
    body = array.find(this.sim.getBodies(),
      bod => isFinite(bod.getMass()));
  }
  if (body != null) {
    // set graphs to follow the body, but only if the graph has no variable chosen
    if (this.graph.line.getXVariable() < 0) {
      this.graph.line.setXVariable(body.getVarsIndex()+0); // X position
    }
    if (this.graph.line.getYVariable() < 0) {
      this.graph.line.setYVariable(body.getVarsIndex()+2); // Y position
    }
  }
  // energy variables:  1 = KE, 2 = PE, 3 = TE
  this.timeGraph.line1.setYVariable(1);
  this.timeGraph.line2.setYVariable(2);
  this.timeGraph.line3.setYVariable(3);
};

/**
* @return {undefined}
*/
addPlaybackControls() {
  this.addControl(CommonControls.makePlaybackControls(this.simRun));
};

/**
* @return {undefined}
*/
addURLScriptButton() {
  this.addControl(CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  this.graph.addControl(
    CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  this.timeGraph.addControl(
    CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
};

/** Adds the standard set of engine2D controls.
* @return {undefined}
*/
addStandardControls() {
  let pn = this.elasticity.getParameterNumber(ElasticitySetter.en.ELASTICITY);
  this.addControl(new NumericControl(pn));
  const pb = this.sim.getParameterBoolean(RigidBodySim.en.SHOW_FORCES);
  this.addControl(new CheckBoxControl(pb));
  this.addControl(new CheckBoxControl(this.showEnergyParam));
  this.addControl(new CheckBoxControl(this.showClockParam));
  this.addControl(new CheckBoxControl(this.panZoomParam));
  pn = this.simRun.getParameterNumber(SimRunner.en.TIME_STEP);
  this.addControl(new NumericControl(pn));
  pn = this.simRun.getClock().getParameterNumber(Clock.en.TIME_RATE);
  this.addControl(new NumericControl(pn));
  const ps = this.diffEqSolver.getParameterString(DiffEqSolverSubject.en.DIFF_EQ_SOLVER);
  this.addControl(new ChoiceControl(ps));
  pn = this.sim.getParameterNumber(EnergySystem.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));
  const bm = CommonControls.makeBackgroundMenu(this.layout.simCanvas);
  this.addControl(bm);
  //ps = this.sim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  //this.addControl(new ChoiceControl(ps));
  // show compile time so user can ensure loading latest version
  if (Util.DEBUG) {
    this.addControl(new LabelControl('compiled '+Util.COMPILE_TIME));
  }
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
addControl(control) {
  return this.layout.addControl(control);
};

/**
* @param {string} script
* @param {boolean=} opt_output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @return {*}
* @export
*/
eval(script, opt_output) {
  try {
    return this.terminal.eval(script, opt_output);
  } catch(ex) {
    this.terminal.alertOnce(ex);
  }
};

/** Start the application running.
* @return {undefined}
* @export
*/
setup() {
  this.clock.resume();
  this.terminal.parseURLorRecall();
  this.sim.saveInitialState();
  this.sim.modifyObjects();
  this.simRun.memorize();
};

/** Start the application running.
* @return {undefined}
* @export
*/
start() {
  this.simRun.startFiring();
  //console.log(Util.prettyPrint(this.toString()));
  //console.log(Util.prettyPrint(this.sim.toString()));
};

} // end class

exports = Engine2DApp;
