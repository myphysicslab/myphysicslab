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

goog.provide('myphysicslab.sims.engine2D.Engine2DApp');

goog.require('goog.array');
goog.require('myphysicslab.lab.app.RigidBodyEventHandler');
goog.require('myphysicslab.lab.app.SimController');
goog.require('myphysicslab.lab.app.SimRunner');
goog.require('myphysicslab.lab.controls.ButtonControl');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.LabControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.controls.ToggleControl');
goog.require('myphysicslab.lab.engine2D.CollisionHandling');
goog.require('myphysicslab.lab.engine2D.ExtraAccel');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.RigidBodySim');
goog.require('myphysicslab.lab.graph.AutoScale');
goog.require('myphysicslab.lab.graph.EnergyBarGraph');
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.graph.VarsHistory'); // for possible use in Terminal
goog.require('myphysicslab.lab.model.DiffEqSolverSubject');
goog.require('myphysicslab.lab.model.ODEAdvance');
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
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayClock');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.sims.engine2D.ElasticitySetter');
goog.require('myphysicslab.sims.engine2D.RigidBodyObserver');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.StandardGraph1');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.layout.TimeGraph1');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractSubject = lab.util.AbstractSubject;
var AutoScale = lab.graph.AutoScale;
var ButtonControl = lab.controls.ButtonControl;
var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var Clock = lab.util.Clock;
var CollisionHandling = lab.engine2D.CollisionHandling;
var CommonControls = sims.layout.CommonControls;
var DiffEqSolverSubject = lab.model.DiffEqSolverSubject;
var DisplayClock = lab.view.DisplayClock;
var DoubleRect = lab.util.DoubleRect;
var ElasticitySetter = sims.engine2D.ElasticitySetter;
var EnergyBarGraph = lab.graph.EnergyBarGraph;
var GenericObserver = lab.util.GenericObserver;
var LabControl = lab.controls.LabControl;
var NumericControl = lab.controls.NumericControl;
var ODEAdvance = lab.model.ODEAdvance;
var Parameter = lab.util.Parameter;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var Polygon = lab.engine2D.Polygon;
var RigidBodyObserver = sims.engine2D.RigidBodyObserver;
var RigidBodySim = lab.engine2D.RigidBodySim;
var ScriptParser = lab.util.ScriptParser;
var SimRunner = lab.app.SimRunner;
var SimView = lab.view.SimView;
var SliderControl = lab.controls.SliderControl;
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
which are common to applications that run a
{@link myphysicslab.lab.engine2D.RigidBodySim RigidBodySim},
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

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {!DoubleRect} simRect the dimensions of the simulation view;
*    this also sets the aspect ratio (width to height) of the canvas
* @param {!RigidBodySim} sim
* @param {!ODEAdvance} advance
* @param {string=} opt_name name of this Subject
* @constructor
* @extends {AbstractSubject}
* @implements {SubjectList}
* @struct
* @abstract
*/
myphysicslab.sims.engine2D.Engine2DApp = function(elem_ids, simRect, sim, advance,
      opt_name) {
  UtilityCore.setErrorHandler();
  AbstractSubject.call(this, opt_name || 'APP');
  /** @type {!lab.util.DoubleRect} */
  this.simRect = simRect;
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  var canvasWidth = 800;
  var canvasHeight = Math.round(canvasWidth * this.simRect.getHeight() /
      this.simRect.getWidth());
  /** @type {!TabLayout} */
  this.layout = new TabLayout(elem_ids, canvasWidth, canvasHeight);
  // keep reference to terminal to make for shorter 'expanded' names
  this.terminal = this.layout.terminal;
  var simCanvas = this.layout.simCanvas;

  /** @type {!RigidBodySim} */
  this.sim = sim;
  this.terminal.setAfterEval(goog.bind(sim.modifyObjects, sim));
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(sim, goog.bind(function(evt) {
    sim.modifyObjects();
  }, this), 'modifyObjects after parameter or variable change');
  sim.setShowForces(false);
  /** @type {!lab.model.SimList} */
  this.simList = sim.getSimList();
  /** @type {!VarsList} */
  this.varsList = sim.getVarsList();
  /** @type {!ODEAdvance} */
  this.advance = advance;
  /** @type {!lab.view.SimView} */
  this.simView = new SimView('SIM_VIEW', this.simRect);
  this.displayList = this.simView.getDisplayList();
  simCanvas.addView(this.simView);
  /** @type {!lab.view.SimView} */
  this.statusView = new SimView('STATUS_VIEW',new DoubleRect(-10, -10, 10, 10));
  this.statusList = this.statusView.getDisplayList();
  simCanvas.addView(this.statusView);
  /** @type {!lab.graph.DisplayAxes} */
  this.axes = CommonControls.makeAxes(this.simView);
  /** @type {!lab.app.SimRunner} */
  this.simRun = new myphysicslab.lab.app.SimRunner(advance);
  this.simRun.addCanvas(simCanvas);
  /** @type {!lab.util.Clock} */
  this.clock = this.simRun.getClock();
  /** @type {!lab.app.RigidBodyEventHandler} */
  this.rbeh = new myphysicslab.lab.app.RigidBodyEventHandler(sim, this.clock);
  /** @type {!lab.app.SimController} */
  this.simCtrl = new myphysicslab.lab.app.SimController(simCanvas, this.rbeh);
  this.simRun.addErrorObserver(this.simCtrl);
  /** @type {!RigidBodyObserver} */
  this.rbo = new RigidBodyObserver(this.simList, this.displayList);

  this.elasticity = new ElasticitySetter(sim);

  /** @type {!EnergyBarGraph} */
  this.energyGraph = new EnergyBarGraph(sim);
  /** @type {!ParameterBoolean} */
  this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
      this.statusView, this);

  /** @type {!DisplayClock} */
  this.displayClock = new DisplayClock(goog.bind(sim.getTime, sim),
      goog.bind(this.clock.getRealTime, this.clock), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
  /** @type {!ParameterBoolean} */
  this.showClockParam = CommonControls.makeShowClockParam(this.displayClock,
      this.statusView, this);

  var panzoom = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true,
      goog.bind(function () { this.simView.setSimRect(this.simRect); }, this));
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

  /** @type {!ScriptParser} */
  this.scriptParser;
};
var Engine2DApp = myphysicslab.sims.engine2D.Engine2DApp;
goog.inherits(Engine2DApp, AbstractSubject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  Engine2DApp.prototype.toString = function() {
    return ', sim: '+this.sim.toStringShort()
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
        +', scriptParser: '+this.scriptParser.toStringShort()
        +', terminal: '+this.terminal
        + Engine2DApp.superClass_.toString.call(this);
  };
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'myApp.sim' when myName is 'myApp'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
Engine2DApp.prototype.defineNames = function(myName) {
  if (UtilityCore.ADVANCED)
    return;
  this.terminal.addWhiteList(myName);
  this.terminal.addRegex('advance|axes|clock|diffEqSolver|displayClock|energyGraph'
  +'|graph|layout|sim|simCtrl|simList|simRect|simRun|simView|statusView|timeGraph'
  +'|displayList|scriptParser|terminal|statusList|elasticity|varsList|rbo',
      myName);
  this.terminal.addRegex('simCanvas',
      myName+'.layout');
};

/** Watch a Parameter and when it changes note that there was a discontinuous change
* in potential and total energy.
* @param {!Parameter} parameter the Parameter to watch
*/
Engine2DApp.prototype.watchEnergyChange = function(parameter) {
  new GenericObserver(parameter.getSubject(), goog.bind(function(evt) {
    if (evt == parameter) {
      // Ensure that energy is updated now, so that the next time the data is
      // memorized the new sequence number goes with the new energy value.
      this.sim.modifyObjects();
      // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
      this.sim.getVarsList().incrSequence(2, 3);
    }
  }, this), 'record discontinuous energy changes');
};

/** @inheritDoc */
Engine2DApp.prototype.getSubjects = function() {
  // Important that sim.getVarsList() come after app (=this) and sim, because they
  // might have parameters that change the configuration which changes the set of
  // variables.
  var subjects = [
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
  return goog.array.concat(subjects, this.layout.getSubjects(),
      this.graph.getSubjects(), this.timeGraph.getSubjects());
};

/** Creates the ScriptParser for this app.
*
* If any volatile Subjects are specified, then when a new configuration is set up
* `ScriptParser.update()` will re-memorize those volatile Subjects.
* This helps the resulting `ScriptParser.script()` be much smaller.
* @param {!Array<!Subject>=} opt_volatile additional volatile Subjects
*/
Engine2DApp.prototype.makeScriptParser = function(opt_volatile) {
  var subjects = this.getSubjects();
  var volatile = [ this.sim.getVarsList(), this.simView ];
  if (goog.isArray(opt_volatile)) {
    volatile = goog.array.concat(opt_volatile, volatile);
  }
  this.scriptParser = CommonControls.makeScriptParser(subjects, volatile, this.simRun);
  this.terminal.setParser(this.scriptParser);
};

/**
* @param {Polygon=} body the rigid body to show in graphs
* @return {undefined}
* @export
*/
Engine2DApp.prototype.graphSetup = function(body) {
  if (!goog.isDefAndNotNull(body)) {
    // find first body with finite mass
    body = goog.array.find(this.sim.getBodies(),
      function(bod) {
        return isFinite(bod.getMass());
      });
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
Engine2DApp.prototype.addPlaybackControls = function() {
  this.addControl(CommonControls.makePlaybackControls(this.simRun));
};

/**
* @return {undefined}
*/
Engine2DApp.prototype.addURLScriptButton = function() {
  this.addControl(CommonControls.makeURLScriptButton(this.scriptParser, this.simRun));
  this.graph.addControl(
    CommonControls.makeURLScriptButton(this.scriptParser, this.simRun));
  this.timeGraph.addControl(
    CommonControls.makeURLScriptButton(this.scriptParser, this.simRun));
};

/** Adds the standard set of engine2D controls.
* @return {undefined}
*/
Engine2DApp.prototype.addStandardControls = function() {
  var pn = this.elasticity.getParameterNumber(ElasticitySetter.en.ELASTICITY);
  this.addControl(new NumericControl(pn));
  var pb = this.sim.getParameterBoolean(RigidBodySim.en.SHOW_FORCES);
  this.addControl(new CheckBoxControl(pb));
  this.addControl(new CheckBoxControl(this.showEnergyParam));
  this.addControl(new CheckBoxControl(this.showClockParam));
  this.addControl(new CheckBoxControl(this.panZoomParam));
  pn = this.simRun.getParameterNumber(SimRunner.en.TIME_STEP);
  this.addControl(new NumericControl(pn));
  pn = this.simRun.getClock().getParameterNumber(Clock.en.TIME_RATE);
  this.addControl(new NumericControl(pn));
  var ps = this.diffEqSolver.getParameterString(DiffEqSolverSubject.en.DIFF_EQ_SOLVER);
  this.addControl(new ChoiceControl(ps));
  var bm = CommonControls.makeBackgroundMenu(this.layout.simCanvas);
  this.addControl(bm);
  //ps = this.sim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  //this.addControl(new ChoiceControl(ps));
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
Engine2DApp.prototype.addControl = function(control) {
  return this.layout.addControl(control);
};

/**
* @param {string} script
* @return {*}
* @export
*/
Engine2DApp.prototype.eval = function(script) {
  try {
    return this.terminal.eval(script);
  } catch(ex) {
    alert(ex);
  }
};

/** Start the application running.
* @return {undefined}
* @export
*/
Engine2DApp.prototype.setup = function() {
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
Engine2DApp.prototype.start = function() {
  this.simRun.startFiring();
  //console.log(UtilityCore.prettyPrint(this.toString()));
  //console.log(UtilityCore.prettyPrint(this.sim.toString()));
};

}); // goog.scope
