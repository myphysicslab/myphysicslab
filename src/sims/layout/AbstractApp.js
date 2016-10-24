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

goog.provide('myphysicslab.sims.layout.AbstractApp');

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
goog.require('myphysicslab.lab.graph.DisplayGraph');
goog.require('myphysicslab.lab.graph.EnergyBarGraph');
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.graph.VarsHistory'); // for possible use in Terminal
goog.require('myphysicslab.lab.model.DiffEqSolverSubject');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.ODEAdvance');
goog.require('myphysicslab.lab.model.ODESim');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.Clock');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ScriptParser');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.SubjectList');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayClock');
goog.require('myphysicslab.lab.view.DrawingMode');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.StandardGraph1');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.layout.TimeGraph1');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AutoScale = lab.graph.AutoScale;
var ButtonControl = lab.controls.ButtonControl;
var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var Clock = lab.util.Clock;
var CommonControls = sims.layout.CommonControls;
var AbstractSubject = lab.util.AbstractSubject;
var DiffEqSolverSubject = lab.model.DiffEqSolverSubject;
var DisplayClock = lab.view.DisplayClock;
var DoubleRect = lab.util.DoubleRect;
var DrawingMode = lab.view.DrawingMode;
var EnergyBarGraph = lab.graph.EnergyBarGraph;
var EnergySystem = lab.model.EnergySystem;
var EventHandler = lab.app.EventHandler;
var GenericObserver = lab.util.GenericObserver;
var LabControl = lab.controls.LabControl;
var NumericControl = lab.controls.NumericControl;
var ODEAdvance = lab.model.ODEAdvance;
var ODESim =lab.model.ODESim;
var Parameter = lab.util.Parameter;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var ScriptParser = lab.util.ScriptParser;
var SimController = lab.app.SimController;
var SimList = lab.model.SimList;
var SimRunner = lab.app.SimRunner;
var SimView = lab.view.SimView;
var SliderControl = lab.controls.SliderControl;
var DisplayAxes = lab.graph.DisplayAxes;
var StandardGraph1 = sims.layout.StandardGraph1;
var Subject = lab.util.Subject;
var SubjectList = lab.util.SubjectList;
var TabLayout = sims.layout.TabLayout;
var TimeGraph1 = sims.layout.TimeGraph1;
var ToggleControl = lab.controls.ToggleControl;
var UtilityCore = lab.util.UtilityCore;
var VarsList = lab.model.VarsList;
var Vector = lab.util.Vector;

/** Abstract base class that creates the standard set of views, graphs and controls
which are common to applications that run an {@link myphysicslab.lab.model.ODESim}.

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
* @extends {myphysicslab.lab.util.AbstractSubject}
* @implements {SubjectList}
* @struct
*/
sims.layout.AbstractApp = function(elem_ids, simRect, sim, advance, eventHandler,
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
  this.displayList = this.simView.getDisplayList();
  /** @type {!SimView} */
  this.statusView = new SimView('STATUS_VIEW', new DoubleRect(-10, -10, 10, 10));
  simCanvas.addView(this.statusView);
  /** @type {!DisplayAxes} */
  this.axes = CommonControls.makeAxes(this.simView);
  /** @type {!SimRunner} */
  this.simRun = new SimRunner(this.advance);
  this.simRun.addCanvas(simCanvas);
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

  /** @type {!DiffEqSolverSubject} */
  this.diffEqSolver = new DiffEqSolverSubject(sim, energySystem, advance);

  /** @type {!StandardGraph1} */
  this.graph = new StandardGraph1(sim.getVarsList(), this.layout.graphCanvas,
      this.layout.graph_controls, this.layout.div_graph, this.simRun);
  this.graph.line.setDrawingMode(DrawingMode.LINES);

  /** @type {!TimeGraph1} */
  this.timeGraph = new TimeGraph1(sim.getVarsList(), this.layout.timeGraphCanvas,
      this.layout.time_graph_controls, this.layout.div_time_graph, this.simRun);

  /** @type {!ScriptParser} */
  this.scriptParser;
};
var AbstractApp = sims.layout.AbstractApp;
goog.inherits(AbstractApp, AbstractSubject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  AbstractApp.prototype.toString = function() {
    return ', sim: '+this.sim.toStringShort()
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
      +', scriptParser: '+this.scriptParser.toStringShort()
      +', terminal: '+this.terminal
      + AbstractApp.superClass_.toString.call(this);
  };
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
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'app.sim' when `myName` is 'app'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
AbstractApp.prototype.defineNames = function(myName) {
  if (UtilityCore.ADVANCED)
    return;
  this.terminal.addWhiteList(myName);
  this.terminal.addRegex('advance|axes|clock|diffEqSolver|displayClock|energyGraph'
      +'|graph|layout|sim|simCtrl|simList|simRect|simRun|simView|statusView'
      +'|timeGraph|scriptParser|terminal|varsList',
      myName);
  this.terminal.addRegex('simCanvas',
      myName+'.layout');
};

/** Creates the ScriptParser for this app, and adds a 'URL script' button.
*
* If any volatile Subjects are specified, then when a new configuration is set up
* `ScriptParser.update()` will re-memorize those volatile Subjects.
* This helps the resulting `ScriptParser.script()` be much smaller.
* @param {!Array<!Subject>=} opt_volatile additional volatile Subjects
*/
AbstractApp.prototype.makeScriptParser = function(opt_volatile) {
  var subjects = this.getSubjects();
  var volatile = [ this.sim.getVarsList(), this.simView ];
  if (goog.isArray(opt_volatile)) {
    volatile = goog.array.concat(opt_volatile, volatile);
  }
  this.scriptParser = CommonControls.makeScriptParser(subjects, volatile, this.simRun);
  this.terminal.setParser(this.scriptParser);
};

/** @inheritDoc */
AbstractApp.prototype.getSubjects = function() {
  // Important that varsList come after app (=this) and sim, because they
  // might have parameters that change the configuration which changes the set of
  // variables.
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
  this.addControl(CommonControls.makeURLScriptButton(this.scriptParser, this.simRun));
};

/**
* @param {string} script
* @return {*}
* @export
*/
AbstractApp.prototype.eval = function(script) {
  try {
    return this.terminal.eval(script);
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
  //console.log(UtilityCore.prettyPrint(this.toString()));
  //console.log(UtilityCore.prettyPrint(this.sim.toString()));
};

}); // goog.scope
