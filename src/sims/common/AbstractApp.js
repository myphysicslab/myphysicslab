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

goog.provide('myphysicslab.sims.common.AbstractApp');

goog.require('goog.array');
goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.app.SimController');
goog.require('myphysicslab.lab.app.SimRunner');
goog.require('myphysicslab.lab.controls.ButtonControl');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.LabControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.controls.ToggleControl');
goog.require('myphysicslab.lab.graph.AutoScale');
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.graph.DisplayGraph');
goog.require('myphysicslab.lab.graph.EnergyBarGraph');
goog.require('myphysicslab.lab.model.DiffEqSolverSubject');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.ODEAdvance');
goog.require('myphysicslab.lab.model.ODESim');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.Clock');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.EasyScriptParser');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.SubjectList');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayClock');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.DrawingMode');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.StandardGraph1');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.common.TimeGraph1');

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
const ButtonControl = goog.module.get('myphysicslab.lab.controls.ButtonControl');
const CheckBoxControl = goog.module.get('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.module.get('myphysicslab.lab.controls.ChoiceControl');
const Clock = goog.module.get('myphysicslab.lab.util.Clock');
var CommonControls = sims.common.CommonControls;
const DiffEqSolverSubject = goog.module.get('myphysicslab.lab.model.DiffEqSolverSubject');
var DisplayAxes = lab.graph.DisplayAxes;
var DisplayClock = lab.view.DisplayClock;
var DisplayList = lab.view.DisplayList;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var DrawingMode = lab.view.DrawingMode;
const EasyScriptParser = goog.module.get('myphysicslab.lab.util.EasyScriptParser');
var EnergyBarGraph = lab.graph.EnergyBarGraph;
const EnergySystem = goog.module.get('myphysicslab.lab.model.EnergySystem');
var EventHandler = lab.app.EventHandler;
const GenericObserver = goog.module.get('myphysicslab.lab.util.GenericObserver');
const LabControl = goog.module.get('myphysicslab.lab.controls.LabControl');
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const ODEAdvance = goog.module.get('myphysicslab.lab.model.ODEAdvance');
const ODESim = goog.module.get('myphysicslab.lab.model.ODESim');
const Parameter = goog.module.get('myphysicslab.lab.util.Parameter');
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
var SimController = lab.app.SimController;
const SimList = goog.module.get('myphysicslab.lab.model.SimList');
var SimRunner = lab.app.SimRunner;
var SimView = lab.view.SimView;
const SliderControl = goog.module.get('myphysicslab.lab.controls.SliderControl');
var StandardGraph1 = sims.common.StandardGraph1;
var Subject = lab.util.Subject;
const SubjectList = goog.module.get('myphysicslab.lab.util.SubjectList');
var TabLayout = sims.common.TabLayout;
const Terminal = goog.module.get('myphysicslab.lab.util.Terminal');
var TimeGraph1 = sims.common.TimeGraph1;
const ToggleControl = goog.module.get('myphysicslab.lab.controls.ToggleControl');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

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

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {!DoubleRect} simRect
* @param {!ODESim} sim
* @param {!ODEAdvance} advance
* @param {?EventHandler} eventHandler
* @param {?EnergySystem} energySystem
* @param {string=} opt_name name of this as a Subject
* @constructor
* @abstract
* @extends {AbstractSubject}
* @implements {SubjectList}
* @struct
*/
sims.common.AbstractApp = function(elem_ids, simRect, sim, advance, eventHandler,
     energySystem, opt_name) {
  AbstractSubject.call(this, opt_name || 'APP');
  /** @type {!DoubleRect} */
  this.simRect = simRect;
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  var canvasWidth = 800;
  var canvasHeight =
      Math.round(canvasWidth * this.simRect.getHeight() / this.simRect.getWidth());
  /** @type {!TabLayout} */
  this.layout = new TabLayout(elem_ids, canvasWidth, canvasHeight);
  // keep reference to terminal to make for shorter 'expanded' names
  /** @type {!Terminal} */
  this.terminal = this.layout.terminal;
  var simCanvas = this.layout.simCanvas;

  /** @type {!ODESim} */
  this.sim = sim;
  this.terminal.setAfterEval(goog.bind(sim.modifyObjects, sim));
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(sim, goog.bind(function(evt) {
    sim.modifyObjects();
  }, this), 'modifyObjects after parameter or variable change');
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
  if (goog.isDefAndNotNull(energySystem)) {
    this.energyGraph = new EnergyBarGraph(energySystem);
    this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
        this.statusView, this);
  }

  /** @type {!DisplayClock} */
  this.displayClock = new DisplayClock(goog.bind(sim.getTime, sim),
      goog.bind(this.clock.getRealTime, this.clock), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
  /** @type {!ParameterBoolean} */
  this.showClockParam = CommonControls.makeShowClockParam(this.displayClock,
      this.statusView, this);

  var panzoom = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true,
      /*resetFunc=*/goog.bind(function () {
          this.simView.setSimRect(this.simRect);
      }, this));
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
var AbstractApp = sims.common.AbstractApp;
goog.inherits(AbstractApp, AbstractSubject);

/** @override */
AbstractApp.prototype.toString = function() {
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
    + AbstractApp.superClass_.toString.call(this);
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
AbstractApp.prototype.addControl = function(control) {
  return this.layout.addControl(control);
};

/**
* @return {undefined}
*/
AbstractApp.prototype.addPlaybackControls = function() {
  this.addControl(CommonControls.makePlaybackControls(this.simRun));
};

/** Adds the standard set of engine2D controls.
* @return {undefined}
*/
AbstractApp.prototype.addStandardControls = function() {
  if (this.showEnergyParam != null) {
    this.addControl(new CheckBoxControl(this.showEnergyParam));
  }
  this.addControl(new CheckBoxControl(this.showClockParam));
  this.addControl(new CheckBoxControl(this.panZoomParam));
  var pn = this.simRun.getParameterNumber(SimRunner.en.TIME_STEP);
  this.addControl(new NumericControl(pn));
  pn = this.simRun.getClock().getParameterNumber(Clock.en.TIME_RATE);
  this.addControl(new NumericControl(pn));
  var ps = this.diffEqSolver.getParameterString(DiffEqSolverSubject.en.DIFF_EQ_SOLVER);
  this.addControl(new ChoiceControl(ps));
  var bm = CommonControls.makeBackgroundMenu(this.layout.simCanvas);
  this.addControl(bm);
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'app.sim' when `myName` is 'app'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
AbstractApp.prototype.defineNames = function(myName) {
  this.simRun.setAppName(myName);
  if (Util.ADVANCED)
    return;
  this.terminal.addWhiteList(myName);
  this.terminal.addRegex('advance|axes|clock|diffEqSolver|displayClock|energyGraph'
      +'|graph|layout|sim|simCtrl|simList|simRect|simRun|simView|statusView'
      +'|timeGraph|easyScript|terminal|varsList|displayList',
      myName+'.');
  this.terminal.addRegex('simCanvas',
      myName+'.layout.');
};

/** Creates the EasyScriptParser for this app. See explanation of
[dependent Subjects](myphysicslab.lab.util.EasyScriptParser.html#dependentsubjects)
in EasyScriptParser documentation.
* @param {!Array<!Subject>=} opt_dependent additional dependent Subjects
*/
AbstractApp.prototype.makeEasyScript = function(opt_dependent) {
  var dependent = [ this.varsList ];
  if (goog.isArray(opt_dependent)) {
    dependent = goog.array.concat(dependent, opt_dependent);
  }
  this.easyScript = CommonControls.makeEasyScript(this.getSubjects(), dependent,
      this.simRun, this.terminal);
};

/** @override */
AbstractApp.prototype.getSubjects = function() {
  var subjects = [
    this,
    this.sim,
    this.diffEqSolver,
    this.simRun,
    this.clock,
    this.simView,
    this.statusView,
    this.varsList
  ];
  return goog.array.concat(subjects, this.layout.getSubjects(),
      this.graph.getSubjects(), this.timeGraph.getSubjects());
};

/**
* @return {undefined}
*/
AbstractApp.prototype.addURLScriptButton = function() {
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
AbstractApp.prototype.eval = function(script, opt_output) {
  try {
    return this.terminal.eval(script, opt_output);
  } catch(ex) {
    alert(ex);
  }
};

/**
* @return {undefined}
* @export
*/
AbstractApp.prototype.setup = function() {
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
AbstractApp.prototype.start = function() {
  this.simRun.startFiring();
};

}); // goog.scope
