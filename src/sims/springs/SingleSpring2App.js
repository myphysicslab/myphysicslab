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
goog.require('myphysicslab.lab.graph.DisplayGraph');
goog.require('myphysicslab.lab.graph.EnergyBarGraph');
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.graph.VarsHistory'); // for possible use in Terminal
goog.require('myphysicslab.lab.model.DiffEqSolverSubject');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.ExpressionVariable');
goog.require('myphysicslab.lab.model.ODEAdvance');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.Clock');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.EasyScriptParser');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayClock');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.StandardGraph1');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.layout.TimeGraph2');
goog.require('myphysicslab.sims.springs.SingleSpringSim');

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
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = lab.view.DisplaySpring;
var DoubleRect = lab.util.DoubleRect;
var DrawingMode = lab.view.DrawingMode;
var EnergyBarGraph = lab.graph.EnergyBarGraph;
var EnergySystem = lab.model.EnergySystem;
var EventHandler = lab.app.EventHandler;
var ExpressionVariable = lab.model.ExpressionVariable;
var GenericObserver = lab.util.GenericObserver;
var LabControl = lab.controls.LabControl;
var NumericControl = lab.controls.NumericControl;
var ODEAdvance = lab.model.ODEAdvance;
var Parameter = lab.util.Parameter;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var ParameterString = lab.util.ParameterString;
var PointMass = lab.model.PointMass;
var EasyScriptParser = lab.util.EasyScriptParser;
var SimController = lab.app.SimController;
var SimList = lab.model.SimList;
var SimpleAdvance = lab.model.SimpleAdvance;
var SimRunner = lab.app.SimRunner;
var SimView = lab.view.SimView;
var SingleSpringSim = sims.springs.SingleSpringSim;
var SliderControl = lab.controls.SliderControl;
var Spring = lab.model.Spring;
var DisplayAxes = lab.graph.DisplayAxes;
var StandardGraph1 = sims.layout.StandardGraph1;
var Subject = lab.util.Subject;
var TabLayout = sims.layout.TabLayout;
var TimeGraph2 = sims.layout.TimeGraph2;
var ToggleControl = lab.controls.ToggleControl;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/** SingleSpring2App displays the SingleSpringSim simulation. The difference
between this and SingleSpringApp is: this doesn't inherit from AbstractApp because
this uses TimeGraph2 instead of TimeGraph1.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @extends {myphysicslab.lab.util.AbstractSubject}
* @struct
* @export
*/
myphysicslab.sims.springs.SingleSpring2App = function(elem_ids, opt_name) {
  UtilityCore.setErrorHandler();
  AbstractSubject.call(this, opt_name || 'APP');

  this.simRect = new DoubleRect(-3, -2, 3, 2);
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  var canvasWidth = 800;
  var canvasHeight =
      Math.round(canvasWidth * this.simRect.getHeight() / this.simRect.getWidth());
  this.layout = new TabLayout(elem_ids, canvasWidth, canvasHeight);
  // keep reference to terminal to make for shorter 'expanded' names
  this.terminal = this.layout.terminal;
  var simCanvas = this.layout.simCanvas;

  this.sim = new SingleSpringSim();
  this.terminal.setAfterEval(goog.bind(this.sim.modifyObjects, this.sim));
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim, goog.bind(function(evt) {
    this.sim.modifyObjects();
  }, this), 'modifyObjects after parameter or variable change');
  this.simList = this.sim.getSimList();
  this.simCtrl = new SimController(simCanvas, /*eventHandler=*/this.sim);
  this.advance  = new SimpleAdvance(this.sim);
  this.simView = new SimView('SIM_VIEW', this.simRect);
  simCanvas.addView(this.simView);
  this.displayList = this.simView.getDisplayList();
  this.statusView = new SimView('STATUS_VIEW', new DoubleRect(-10, -10, 10, 10));
  simCanvas.addView(this.statusView);
  this.axes = CommonControls.makeAxes(this.simView);
  this.simRun = new SimRunner(this.advance);
  this.simRun.addCanvas(simCanvas);
  this.clock = this.simRun.getClock();

  this.energyGraph = new EnergyBarGraph(this.sim);
  this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
      this.statusView, this);

  this.displayClock = new DisplayClock(goog.bind(this.sim.getTime, this.sim),
      goog.bind(this.clock.getRealTime, this.clock), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
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

  this.diffEqSolver = new DiffEqSolverSubject(this.sim, this.sim, this.advance);

  this.graph = new StandardGraph1(this.sim.getVarsList(), this.layout.graphCanvas,
      this.layout.graph_controls, this.layout.div_graph, this.simRun);
  this.graph.line.setDrawingMode(DrawingMode.LINES);

  this.timeGraph = new TimeGraph2(this.sim.getVarsList(), this.layout.timeGraphCanvas,
      this.layout.time_graph_controls, this.layout.div_time_graph, this.simRun);

  this.block = new DisplayShape(this.simList.getPointMass('block'))
      .setFillStyle('blue');
  this.displayList.add(this.block);
  this.spring = new DisplaySpring(this.simList.getSpring('spring'))
      .setWidth(0.4).setThickness(6);
  this.displayList.add(this.spring);

  // Demo of adding an ExpressionVariable.
  if (!UtilityCore.ADVANCED) {
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

  // Important that sim.getVarsList() come after app (=this) and sim, because they
  // might have parameters that change the configuration which changes the set of
  // variables.
  var subjects = [
    this,
    this.sim,
    this.diffEqSolver,
    this.simRun,
    this.simRun.getClock(),
    this.simView,
    this.statusView,
    this.sim.getVarsList(),
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
  // volatile Subjects have their initial settings re-memorized when
  // easyScript.update() is called.  easyScript.update() is called when a new
  // configuration is set up. This helps make the resulting easyScript.script()
  // be a much smaller script.
  var volatile = [ this.sim.getVarsList(), this.simView ];
  this.easyScript = CommonControls.makeEasyScript(subjects, volatile, this.simRun);
  this.terminal.setParser(this.easyScript);
  this.addControl(CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
};
var SingleSpring2App = myphysicslab.sims.springs.SingleSpring2App;
goog.inherits(SingleSpring2App, AbstractSubject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  SingleSpring2App.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
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
};

/** @inheritDoc */
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
      +'|energyGraph|graph|layout|sim|simCtrl|simList|simRect|simRun'
      +'|simView|statusView|timeGraph|easyScript|terminal|displayList',
      myName);
  this.terminal.addRegex('simCanvas',
      myName+'.layout');
  this.terminal.addRegex('block|spring',
      myName);
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
* @return {*}
* @export
*/
SingleSpring2App.prototype.eval = function(script) {
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
