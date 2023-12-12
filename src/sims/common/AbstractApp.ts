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

import { AbstractSubject } from '../../lab/util/AbstractSubject.js';
import { AutoScale } from '../../lab/graph/AutoScale.js';
import { ButtonControl } from '../../lab/controls/ButtonControl.js';
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { Clock, ClockTask } from '../../lab/util/Clock.js';
import { CommonControls } from './CommonControls.js';
import { DiffEqSolverSubject } from '../../lab/model/DiffEqSolverSubject.js';
import { DisplayAxes } from '../../lab/graph/DisplayAxes.js';
import { DisplayClock } from '../../lab/view/DisplayClock.js';
import { DisplayList } from '../../lab/view/DisplayList.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DrawingMode } from '../../lab/view/DrawingMode.js';
import { EasyScriptParser } from '../../lab/util/EasyScriptParser.js';
import { EnergyBarGraph } from '../../lab/graph/EnergyBarGraph.js';
import { EnergySystem } from '../../lab/model/EnergySystem.js';
import { EventHandler } from '../../lab/app/EventHandler.js';
import { Graph } from './Graph.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { LabelControl } from '../../lab/controls/LabelControl.js';
import { Layout, ElementIDs } from './Layout.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { Observer, GenericObserver, Parameter, ParameterBoolean,
    ParameterNumber, Subject, SubjectEvent, SubjectList }
    from '../../lab/util/Observe.js'
import { ODEAdvance } from '../../lab/model/AdvanceStrategy.js';
import { ODESim } from '../../lab/model/ODESim.js';
import { SimController } from '../../lab/app/SimController.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { SimView } from '../../lab/view/SimView.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { StandardGraph1 } from './StandardGraph1.js';
import { TabLayout } from './TabLayout.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { TimeGraph1 } from './TimeGraph1.js';
import { ToggleControl } from '../../lab/controls/ToggleControl.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

// following are only required for possible use in Terminal
import { VarsHistory } from '../../lab/graph/VarsHistory.js';
import { FunctionVariable } from '../../lab/model/FunctionVariable.js';
import { GenericMemo } from '../../lab/util/Memo.js';
import { DisplayText } from '../../lab/view/DisplayText.js';

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

*/
export abstract class AbstractApp0<SimType extends ODESim, TimeGraphType extends Graph> extends AbstractSubject implements Subject, SubjectList {
  simRect: DoubleRect;
  layout: Layout;
  terminal: Terminal;
  sim: SimType;
  advance: ODEAdvance;
  simList: SimList;
  varsList: VarsList;
  simCtrl: SimController;
  simView: SimView;
  displayList: DisplayList;
  statusView: SimView;
  axes: DisplayAxes;
  simRun: SimRunner;
  clock: Clock;
  energyGraph: null|EnergyBarGraph = null;
  showEnergyParam: null|ParameterBoolean = null;
  displayClock: DisplayClock;
  showClockParam: ParameterBoolean;
  panZoomParam: ParameterBoolean;
  diffEqSolver: DiffEqSolverSubject;
  graph: StandardGraph1;
  timeGraph: TimeGraphType;
  easyScript: EasyScriptParser;

/**
* @param elem_ids specifies the names of the HTML elementId's to look for
*    in the HTML document; these elements are where the user interface
*    of the simulation is created.
* @param simRect
* @param sim
* @param advance
* @param eventHandler
* @param energySystem
* @param opt_name name of this as a Subject
*/
constructor(elem_ids: ElementIDs, simRect: DoubleRect, sim: SimType, advance: ODEAdvance,
    eventHandler: null|EventHandler, energySystem: null|EnergySystem,
    opt_name?: string) {
  super(opt_name || 'APP');
  this.simRect = simRect;
  this.layout = this.makeLayout(elem_ids);
  // keep reference to terminal to make for shorter 'expanded' names
  this.terminal = this.layout.getTerminal();
  const simCanvas = this.layout.getSimCanvas();

  this.sim = sim;
  this.sim.setTerminal(this.terminal);
  this.advance  = advance;
  this.simList = sim.getSimList();
  this.varsList = sim.getVarsList();
  this.simCtrl = new SimController(simCanvas, eventHandler);
  this.simView = new SimView('SIM_VIEW', this.simRect);
  simCanvas.addView(this.simView);
  this.displayList = this.simView.getDisplayList();
  this.statusView = new SimView('STATUS_VIEW', new DoubleRect(-10, -10, 10, 10));
  simCanvas.addView(this.statusView);
  this.axes = CommonControls.makeAxes(this.simView, /*bottomLeft=*/true);
  this.simRun = new SimRunner(this.advance);
  this.simRun.addCanvas(simCanvas);
  this.simRun.addErrorObserver(this.simCtrl);
  this.clock = this.simRun.getClock();

  if (energySystem != null) {
    this.energyGraph = new EnergyBarGraph(energySystem);
    this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
        this.statusView, this);
  }

  this.displayClock = new DisplayClock( () => sim.getTime(),
      () => this.clock.getRealTime(), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
  this.showClockParam = CommonControls.makeShowClockParam(this.displayClock,
      this.statusView, this);

  const panzoom = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true, () => this.simView.setSimRect(this.simRect) );
  this.layout.getSimDiv().appendChild(panzoom);
  this.panZoomParam = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.panZoomParam.setValue(false);

  this.diffEqSolver = new DiffEqSolverSubject(sim, energySystem, advance);

  this.graph = new StandardGraph1(sim.getVarsList(), this.layout.getGraphCanvas(),
      this.layout.getGraphControls(), this.layout.getGraphDiv(), this.simRun);
  this.graph.line.setDrawingMode(DrawingMode.LINES);

  this.timeGraph = this.makeTimeGraph();

  this.easyScript;
  this.terminal.setAfterEval(() => this.sim.modifyObjects());
};

/** @inheritDoc */
override toString() {
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
    +', easyScript: '+this.easyScript.toStringShort()
    +', terminal: '+this.terminal
    + super.toString();
};

/**
*/
makeLayout(elem_ids: ElementIDs): Layout {
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  const canvasWidth = 800;
  const canvasHeight =
      Math.round(canvasWidth * this.simRect.getHeight() / this.simRect.getWidth());
  return new TabLayout(elem_ids, canvasWidth, canvasHeight, /*opt_terminal=*/true);
};

/**
*/
abstract makeTimeGraph(): TimeGraphType;

/** Add the control to the set of simulation controls.
* @param control
* @return the control that was passed in
*/
addControl(control: LabControl): LabControl {
  return this.layout.addControl(control);
};

/**
*/
addPlaybackControls(): void {
  this.addControl(CommonControls.makePlaybackControls(this.simRun));
};

/** Adds the standard set of simulation controls: show energy, show clock,
pan-zoom of simView, time step, time rate, diff eq solver, background menu
*/
addStandardControls(): void {
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
  const bm = CommonControls.makeBackgroundMenu(this.layout.getSimCanvas());
  this.addControl(bm);
  // show compile time so user can ensure loading latest version
  // @ts-ignore
  if (0 == 1 && Util.DEBUG) {
    this.addControl(new LabelControl('compiled '+Util.COMPILE_TIME));
  }
};

/** Define short-cut name replacement rules.  For example `sim` is replaced
* by `app.sim` when `myName` is `app`.
* @param myName  the name of this object, valid in global Javascript context.
*/
defineNames(myName: string) {
  this.simRun.setAppName(myName);
  this.terminal.addToVars(myName);
  this.terminal.addRegex('advance|axes|clock|diffEqSolver|displayClock|energyGraph'
      +'|graph|layout|sim|simCtrl|simList|simRect|simRun|simView|statusView'
      +'|timeGraph|easyScript|terminal|varsList|displayList',
      myName+'.');
  this.terminal.addRegex('simCanvas',
      myName+'.layout.');
};

/** Creates the EasyScriptParser for this app. See explanation of
* [dependent Subjects](./lab_util_EasyScriptParser.EasyScriptParser.html#md:dependent-subjects)
* in EasyScriptParser documentation.
* @param opt_dependent additional dependent Subjects
*/
makeEasyScript(opt_dependent?: Subject[]): void {
  let dependent: Subject[] = [ this.varsList ];
  if (opt_dependent) {
    dependent = dependent.concat(opt_dependent);
  }
  this.easyScript = CommonControls.makeEasyScript(this.getSubjects(), dependent,
      this.simRun, this.terminal);
};

/** @inheritDoc */
getSubjects(): Subject[] {
  const subjects: Subject[] = [
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
*/
addURLScriptButton(): void {
  this.addControl(CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  /*this.graph.addControl(
    CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  this.timeGraph.addControl(
    CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  */
};

/**
* @param script
* @param output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @return the result of evaluating the string
*/
eval(script: string, output: boolean = true): any {
  return this.terminal.eval(script, output);
};

/** Force classes to be bundled (by esbuild), so they can be used in Terminal
* scripts.
*/
static loadClass(): void {
  var f = FunctionVariable.toString;
  f = VarsHistory.toString;
  f = GenericMemo.toString;
  f = DisplayText.toString;
  f = ClockTask.toString;
};

/**
*/
setup(): void {
  this.clock.resume();
  this.terminal.parseURL();
  this.sim.saveInitialState();
  this.sim.modifyObjects();
  this.simRun.memorize();
};

/** Start the application running. */
start(): void {
  this.simRun.startFiring();
};

} // end class


/** Abstract base class that creates the standard set of views, graphs and controls
which are common to applications that run an {@link ODESim}. This is an extension
of {@link AbstractApp0} which creates a {@link TimeGraph1}.

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

*/
export abstract class AbstractApp<SimType extends ODESim> extends
AbstractApp0<SimType, TimeGraph1> {

constructor(elem_ids: ElementIDs, simRect: DoubleRect, sim: SimType,
    advance: ODEAdvance, eventHandler: null|EventHandler,
    energySystem: null|EnergySystem, opt_name?: string) {
  super(elem_ids, simRect, sim, advance, eventHandler, energySystem, opt_name);
};

/**
*/
makeTimeGraph(): TimeGraph1 {
  return new TimeGraph1(this.sim.getVarsList(), this.layout.getTimeGraphCanvas(),
      this.layout.getTimeGraphControls(), this.layout.getTimeGraphDiv(), this.simRun);
}

};

Util.defineGlobal('sims$common$AbstractApp', AbstractApp);
