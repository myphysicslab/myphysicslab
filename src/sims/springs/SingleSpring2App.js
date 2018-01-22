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

goog.provide('myphysicslab.sims.springs.SingleSpring2App');

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
goog.require('myphysicslab.lab.graph.VarsHistory'); // for possible use in Terminal
goog.require('myphysicslab.lab.model.DiffEqSolverSubject');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.ExpressionVariable');
goog.require('myphysicslab.lab.model.ODEAdvance');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.Clock');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.EasyScriptParser');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayClock');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.StandardGraph1');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.common.TimeGraph2');
goog.require('myphysicslab.sims.springs.SingleSpringSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const AbstractSubject = goog.module.get('myphysicslab.lab.util.AbstractSubject');
var AutoScale = lab.graph.AutoScale;
var ButtonControl = lab.controls.ButtonControl;
var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
const Clock = goog.module.get('myphysicslab.lab.util.Clock');
var CommonControls = sims.common.CommonControls;
var DiffEqSolverSubject = lab.model.DiffEqSolverSubject;
var DisplayAxes = lab.graph.DisplayAxes;
var DisplayClock = lab.view.DisplayClock;
var DisplayList = lab.view.DisplayList;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = lab.view.DisplaySpring;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var DrawingMode = lab.view.DrawingMode;
const EasyScriptParser = goog.module.get('myphysicslab.lab.util.EasyScriptParser');
var EnergyBarGraph = lab.graph.EnergyBarGraph;
const EnergySystem = goog.module.get('myphysicslab.lab.model.EnergySystem');
var EventHandler = lab.app.EventHandler;
const ExpressionVariable = goog.module.get('myphysicslab.lab.model.ExpressionVariable');
const GenericObserver = goog.module.get('myphysicslab.lab.util.GenericObserver');
var LabControl = lab.controls.LabControl;
var NumericControl = lab.controls.NumericControl;
var ODEAdvance = lab.model.ODEAdvance;
const Parameter = goog.module.get('myphysicslab.lab.util.Parameter');
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.module.get('myphysicslab.lab.util.ParameterString');
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
var SimController = lab.app.SimController;
var SimList = lab.model.SimList;
var SimpleAdvance = lab.model.SimpleAdvance;
var SimRunner = lab.app.SimRunner;
var SimView = lab.view.SimView;
var SingleSpringSim = sims.springs.SingleSpringSim;
var SliderControl = lab.controls.SliderControl;
const Spring = goog.module.get('myphysicslab.lab.model.Spring');
var StandardGraph1 = sims.common.StandardGraph1;
var Subject = lab.util.Subject;
var TabLayout = sims.common.TabLayout;
const Terminal = goog.module.get('myphysicslab.lab.util.Terminal');
var TimeGraph2 = sims.common.TimeGraph2;
var ToggleControl = lab.controls.ToggleControl;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** SingleSpring2App displays the {@link SingleSpringSim} simulation.

The difference between this and {@link myphysicslab.sims.springs.SingleSpringApp} is
that this doesn't inherit from {@link myphysicslab.sims.common.AbstractApp} because
this uses {@link TimeGraph2} instead of TimeGraph1.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @extends {AbstractSubject}
* @struct
* @export
*/
myphysicslab.sims.springs.SingleSpring2App = function(elem_ids, opt_name) {
  Util.setErrorHandler();
  AbstractSubject.call(this, opt_name || 'APP');

  /** @type {!DoubleRect} */
  this.simRect = new DoubleRect(-3, -2, 3, 2);
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

  /** @type {!SingleSpringSim} */
  this.sim = new SingleSpringSim();
  this.terminal.setAfterEval(goog.bind(this.sim.modifyObjects, this.sim));
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim, goog.bind(function(evt) {
    this.sim.modifyObjects();
  }, this), 'modifyObjects after parameter or variable change');
  /** @type {!SimList} */
  this.simList = this.sim.getSimList();
  /** @type {!VarsList} */
  this.varsList = this.sim.getVarsList();
  /** @type {!SimController} */
  this.simCtrl = new SimController(simCanvas, /*eventHandler=*/this.sim);
  /** @type {!SimpleAdvance} */
  this.advance  = new SimpleAdvance(this.sim);
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
  /** @type {!Clock} */
  this.clock = this.simRun.getClock();

  /** @type {!EnergyBarGraph} */
  this.energyGraph = new EnergyBarGraph(this.sim);
  /** @type {!ParameterBoolean} */
  this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
      this.statusView, this);

  /** @type {!DisplayClock} */
  this.displayClock = new DisplayClock(goog.bind(this.sim.getTime, this.sim),
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
  this.panZoomParam = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.panZoomParam.setValue(false);

  /** @type {!DiffEqSolverSubject} */
  this.diffEqSolver = new DiffEqSolverSubject(this.sim, this.sim, this.advance);

  /** @type {!StandardGraph1} */
  this.graph = new StandardGraph1(this.sim.getVarsList(), this.layout.graphCanvas,
      this.layout.graph_controls, this.layout.div_graph, this.simRun);
  this.graph.line.setDrawingMode(DrawingMode.LINES);

  /** @type {!TimeGraph2} */
  this.timeGraph = new TimeGraph2(this.sim.getVarsList(), this.layout.timeGraphCanvas,
      this.layout.time_graph_controls, this.layout.div_time_graph, this.simRun);

  /** @type {!DisplayShape} */
  this.block = new DisplayShape(this.simList.getPointMass('block'))
      .setFillStyle('blue');
  this.displayList.add(this.block);
  /** @type {!DisplaySpring} */
  this.spring = new DisplaySpring(this.simList.getSpring('spring'))
      .setWidth(0.4).setThickness(6);
  this.displayList.add(this.spring);

  // Demo of adding an ExpressionVariable.
  if (!Util.ADVANCED) {
    var va = this.sim.getVarsList();
    va.addVariable(new ExpressionVariable(va, 'sin_time', 'sin(time)',
        this.terminal, 'Math.sin(sim.getTime());'));
  }

  this.addControl(CommonControls.makePlaybackControls(this.simRun));

  var pn = this.sim.getParameterNumber(SingleSpringSim.en.MASS);
  this.addControl(new NumericControl(pn));

  pn = this.sim.getParameterNumber(SingleSpringSim.en.DAMPING);
  this.addControl(new NumericControl(pn));

  pn = this.sim.getParameterNumber(SingleSpringSim.en.SPRING_STIFFNESS);
  this.addControl(new NumericControl(pn));

  pn = this.sim.getParameterNumber(SingleSpringSim.en.SPRING_LENGTH);
  this.addControl(new NumericControl(pn));

  pn = this.sim.getParameterNumber(SingleSpringSim.en.FIXED_POINT);
  this.addControl(new NumericControl(pn));

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

  var subjects = [
    this,
    this.sim,
    this.diffEqSolver,
    this.simRun,
    this.simRun.getClock(),
    this.simView,
    this.statusView,
    this.varsList,
    this.layout,
    this.layout.simCanvas,
    this.layout.graphCanvas,
    this.layout.timeGraphCanvas,
    this.graph,
    this.graph.line,
    this.graph.view,
    this.graph.autoScale,
    this.timeGraph.line1,
    this.timeGraph.line2,
    this.timeGraph.view1,
    this.timeGraph.view2,
    this.timeGraph.autoScale1,
    this.timeGraph.autoScale2
  ];
  /** @type {!EasyScriptParser} */
  this.easyScript = CommonControls.makeEasyScript(subjects, [ this.varsList ],
       this.simRun, this.terminal);
  this.addControl(CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
};
var SingleSpring2App = myphysicslab.sims.springs.SingleSpring2App;
goog.inherits(SingleSpring2App, AbstractSubject);

/** @override */
SingleSpring2App.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', block: '+this.block.toStringShort()
      +', spring: '+this.spring.toStringShort()
      +', sim: '+this.sim.toStringShort()
      +', simList: '+this.simList.toStringShort()
      +', simCtrl: '+this.simCtrl.toStringShort()
      +', advance: '+this.advance
      +', simRect: '+this.simRect
      +', simView: '+this.simView.toStringShort()
      +', statusView: '+this.statusView.toStringShort()
      +', axes: '+this.axes.toStringShort()
      +', simRun: '+this.simRun.toStringShort()
      +', clock: '+this.clock.toStringShort()
      +', energyGraph: '+this.energyGraph.toStringShort()
      +', displayClock: '+this.displayClock.toStringShort()
      +', easyScript: '+this.easyScript.toStringShort()
      +', graph: '+this.graph
      +', timeGraph: '+this.timeGraph
      +', layout: '+this.layout
      +', terminal: '+this.terminal
      + SingleSpring2App.superClass_.toString.call(this);
};

/** @override */
SingleSpring2App.prototype.getClassName = function() {
  return 'SingleSpring2App';
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'app.sim' when `myName` is 'app'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
SingleSpring2App.prototype.defineNames = function(myName) {
  this.terminal.addWhiteList(myName);
  this.terminal.addRegex('advance|axes|clock|diffEqSolver|displayClock'
      +'|energyGraph|graph|layout|sim|simCtrl|simList|simRect|simRun|varsList'
      +'|simView|statusView|timeGraph|easyScript|terminal|displayList',
      myName+'.');
  this.terminal.addRegex('simCanvas',
      myName+'.layout.');
  this.terminal.addRegex('block|spring',
      myName+'.');
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
SingleSpring2App.prototype.addControl = function(control) {
  return this.layout.addControl(control);
};

/**
* @param {string} script
* @param {boolean=} opt_output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @return {*}
* @export
*/
SingleSpring2App.prototype.eval = function(script, opt_output) {
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
SingleSpring2App.prototype.setup = function() {
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
SingleSpring2App.prototype.start = function() {
  this.simRun.startFiring();
};

}); // goog.scope
