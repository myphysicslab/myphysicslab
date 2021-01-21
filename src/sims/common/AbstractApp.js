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

goog.module('myphysicslab.sims.common.AbstractApp');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const AutoScale = goog.require('myphysicslab.lab.graph.AutoScale');
const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const Clock = goog.require('myphysicslab.lab.util.Clock');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DiffEqSolverSubject = goog.require('myphysicslab.lab.model.DiffEqSolverSubject');
const DisplayAxes = goog.require('myphysicslab.lab.graph.DisplayAxes');
const DisplayClock = goog.require('myphysicslab.lab.view.DisplayClock');
const DisplayList = goog.require('myphysicslab.lab.view.DisplayList');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const DrawingMode = goog.require('myphysicslab.lab.view.DrawingMode');
const EasyScriptParser = goog.require('myphysicslab.lab.util.EasyScriptParser');
const EnergyBarGraph = goog.require('myphysicslab.lab.graph.EnergyBarGraph');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const LabelControl = goog.require('myphysicslab.lab.controls.LabelControl');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ODEAdvance = goog.require('myphysicslab.lab.model.ODEAdvance');
const ODESim = goog.require('myphysicslab.lab.model.ODESim');
const Parameter = goog.require('myphysicslab.lab.util.Parameter');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const SimController = goog.require('myphysicslab.lab.app.SimController');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimRunner = goog.require('myphysicslab.lab.app.SimRunner');
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

// following are only required for possible use in Terminal
const VarsHistory = goog.require('myphysicslab.lab.graph.VarsHistory');
const ExpressionVariable = goog.require('myphysicslab.lab.model.ExpressionVariable');
const FunctionVariable = goog.require('myphysicslab.lab.model.FunctionVariable');
const ClockTask = goog.require('myphysicslab.lab.util.ClockTask');
const GenericMemo = goog.require('myphysicslab.lab.util.GenericMemo');
const DisplayText = goog.require('myphysicslab.lab.view.DisplayText');

/** Abstract base class that creates the standard set of views, graphs and controls
which are common to applications that run an {@link ODESim}.

Defines regular expressions for easy Terminal scripting using short names instead of
fully qualified property names.

The constructor takes an argument that specifies the names of the HTML `elementIds` to
look for in the HTML document; these elements are where the user interface of the
simulation is created. This allows for having two separate simulation apps running
concurrently on a single page because each app can have different ids for its HTML
elements.

No global variables are created other than two root global variables: the
`myphysicslab` global holds all of the myPhysicsLab classes; and a global variable is
created for this application instance. This application global is created outside of
this file in the HTML where the constructor is called. The name of that global variable
holding the application is passed to defineNames() method so that short-names in scripts
can be properly expanded.

* @abstract
* @implements {SubjectList}
*/
class AbstractApp extends AbstractSubject {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {!DoubleRect} simRect
* @param {!ODESim} sim
* @param {!ODEAdvance} advance
* @param {?EventHandler} eventHandler
* @param {?EnergySystem} energySystem
* @param {string=} opt_name name of this as a Subject
*/
constructor(elem_ids, simRect, sim, advance, eventHandler, energySystem, opt_name) {
  super(opt_name || 'APP');
  /** @type {!DoubleRect} */
  this.simRect = simRect;
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  const canvasWidth = 800;
  const canvasHeight =
      Math.round(canvasWidth * this.simRect.getHeight() / this.simRect.getWidth());
  /** @type {!TabLayout} */
  this.layout = new TabLayout(elem_ids, canvasWidth, canvasHeight);
  // keep reference to terminal to make for shorter 'expanded' names
  /** @type {!Terminal} */
  this.terminal = this.layout.terminal;
  const simCanvas = this.layout.simCanvas;

  /** @type {!ODESim} */
  this.sim = sim;
  this.terminal.setAfterEval( () => sim.modifyObjects() );
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(sim, evt => sim.modifyObjects(),
      'modifyObjects after parameter or variable change');
  /** @type {!ODEAdvance} */
  this.advance  = advance;
  /** @type {!SimList} */
  this.simList = sim.getSimList();
  /** @type {!VarsList} */
  this.varsList = sim.getVarsList();
  /** @type {!SimController} */
  this.simCtrl = new SimController(simCanvas, eventHandler);
  /** @type {!SimView} */
  this.simView = new SimView('SIM_VIEW', this.simRect);
  simCanvas.addView(this.simView);
  /** @type {!DisplayList} */
  this.displayList = this.simView.getDisplayList();
  /** @type {!SimView} */
  this.statusView = new SimView('STATUS_VIEW', new DoubleRect(-10, -10, 10, 10));
  simCanvas.addView(this.statusView);
  /** @type {!DisplayAxes} */
  this.axes = CommonControls.makeAxes(this.simView, /*bottomLeft=*/true);
  /** @type {!SimRunner} */
  this.simRun = new SimRunner(this.advance);
  this.simRun.addCanvas(simCanvas);
  this.simRun.addErrorObserver(this.simCtrl);
  /** @type {!Clock} */
  this.clock = this.simRun.getClock();

  /** @type {?EnergyBarGraph} */
  this.energyGraph = null;
  /** @type {?ParameterBoolean} */
  this.showEnergyParam = null;
  if (energySystem != null) {
    this.energyGraph = new EnergyBarGraph(energySystem);
    this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
        this.statusView, this);
  }

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
  this.diffEqSolver = new DiffEqSolverSubject(sim, energySystem, advance);

  /** @type {!StandardGraph1} */
  this.graph = new StandardGraph1(sim.getVarsList(), this.layout.graphCanvas,
      this.layout.graph_controls, this.layout.div_graph, this.simRun);
  this.graph.line.setDrawingMode(DrawingMode.LINES);

  /** @type {!TimeGraph1} */
  this.timeGraph = new TimeGraph1(sim.getVarsList(), this.layout.timeGraphCanvas,
      this.layout.time_graph_controls, this.layout.div_time_graph, this.simRun);

  /** @type {!EasyScriptParser} */
  this.easyScript;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : ', sim: '+this.sim.toStringShort()
    +', simList: '+this.simList.toStringShort()
    +', simCtrl: '+this.simCtrl.toStringShort()
    +', advance: '+this.advance
    +', simRect: '+this.simRect
    +', simView: '+this.simView.toStringShort()
    +', statusView: '+this.statusView.toStringShort()
    +', axes: '+this.axes.toStringShort()
    +', simRun: '+this.simRun.toStringShort()
    +', clock: '+this.clock.toStringShort()
    +', energyGraph: '+(this.energyGraph == null ? 'null' :
        this.energyGraph.toStringShort())
    +', displayClock: '+this.displayClock.toStringShort()
    +', graph: '+this.graph.toStringShort()
    +', timeGraph: '+this.timeGraph.toStringShort()
    +', layout: '+this.layout.toStringShort()
    +', easyScript: '+this.easyScript.toStringShort()
    +', terminal: '+this.terminal
    + super.toString();
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
addControl(control) {
  return this.layout.addControl(control);
};

/**
* @return {undefined}
*/
addPlaybackControls() {
  this.addControl(CommonControls.makePlaybackControls(this.simRun));
};

/** Adds the standard set of engine2D controls.
* @return {undefined}
*/
addStandardControls() {
  if (this.showEnergyParam != null) {
    this.addControl(new CheckBoxControl(this.showEnergyParam));
  }
  this.addControl(new CheckBoxControl(this.showClockParam));
  this.addControl(new CheckBoxControl(this.panZoomParam));
  let pn = this.simRun.getParameterNumber(SimRunner.en.TIME_STEP);
  this.addControl(new NumericControl(pn));
  pn = this.simRun.getClock().getParameterNumber(Clock.en.TIME_RATE);
  this.addControl(new NumericControl(pn));
  const ps =
      this.diffEqSolver.getParameterString(DiffEqSolverSubject.en.DIFF_EQ_SOLVER);
  this.addControl(new ChoiceControl(ps));
  const bm = CommonControls.makeBackgroundMenu(this.layout.simCanvas);
  this.addControl(bm);
  // show compile time so user can ensure loading latest version
  if (Util.DEBUG) {
    this.addControl(new LabelControl('compiled '+Util.COMPILE_TIME));
  }
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'app.sim' when `myName` is 'app'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
defineNames(myName) {
  this.simRun.setAppName(myName);
  if (!Util.ADVANCED) {
    this.terminal.addWhiteList(myName);
    this.terminal.addRegex('advance|axes|clock|diffEqSolver|displayClock|energyGraph'
        +'|graph|layout|sim|simCtrl|simList|simRect|simRun|simView|statusView'
        +'|timeGraph|easyScript|terminal|varsList|displayList',
        myName+'.');
    this.terminal.addRegex('simCanvas',
        myName+'.layout.');
  }
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

/** @override */
getSubjects() {
  const subjects = [
    this,
    this.sim,
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

/**
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
};

} // end class
exports = AbstractApp;
