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
import { Clock } from '../../lab/util/Clock.js';
import { CollisionHandling } from '../../lab/engine2D/CollisionHandling.js';
import { CommonControls } from '../common/CommonControls.js';
import { DiffEqSolverSubject } from '../../lab/model/DiffEqSolverSubject.js';
import { DisplayAxes } from '../../lab/graph/DisplayAxes.js';
import { DisplayClock } from '../../lab/view/DisplayClock.js';
import { DisplayList } from '../../lab/view/DisplayList.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElasticitySetter } from './ElasticitySetter.js';
import { EnergyBarGraph } from '../../lab/graph/EnergyBarGraph.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { GenericObserver, Parameter, ParameterBoolean, ParameterNumber, Subject,
    SubjectList } from '../../lab/util/Observe.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { LabelControl } from '../../lab/controls/LabelControl.js';
import { Layout, ElementIDs } from '../common/Layout.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ODEAdvance } from '../../lab/model/AdvanceStrategy.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { RigidBodyEventHandler } from '../../lab/app/RigidBodyEventHandler.js';
import { RigidBodyObserver } from './RigidBodyObserver.js';
import { RigidBodySim } from '../../lab/engine2D/RigidBodySim.js';
import { EasyScriptParser } from '../../lab/util/EasyScriptParser.js';
import { SimController } from '../../lab/app/SimController.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimView } from '../../lab/view/SimView.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { StandardGraph1 } from '../common/StandardGraph1.js';
import { TabLayout } from '../common/TabLayout.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { TimeGraph1 } from '../common/TimeGraph1.js';
import { ToggleControl } from '../../lab/controls/ToggleControl.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

// following are only required for possible use in Terminal
import { VarsHistory } from '../../lab/graph/VarsHistory.js';
import { FunctionVariable } from '../../lab/model/FunctionVariable.js';
import { GenericMemo } from '../../lab/util/Memo.js';
import { DisplayText } from '../../lab/view/DisplayText.js';
import { ClockTask } from '../../lab/util/Clock.js';

/** Abstract base class that creates the standard set of views, graphs and controls
which are common to applications that run a {@link RigidBodySim},
{@link lab/engine2D/ImpulseSim.ImpulseSim}, or
{@link lab/engine2D/ContactSim.ContactSim},

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
application is passed to {@link Engine2DApp.defineNames} method so that short-names in
scripts can be properly expanded.
*/
export abstract class Engine2DApp<SimType extends RigidBodySim> extends AbstractSubject implements Subject, SubjectList {
  simRect: DoubleRect;
  layout: Layout;
  terminal: Terminal;
  sim: SimType;
  simList: SimList;
  varsList: VarsList;
  advance: ODEAdvance;
  simView: SimView;
  displayList: DisplayList;
  statusView: SimView;
  statusList: DisplayList;
  axes: DisplayAxes;
  simRun: SimRunner;
  clock: Clock;
  rbeh: RigidBodyEventHandler;
  simCtrl: SimController;
  rbo: RigidBodyObserver;
  elasticity: ElasticitySetter;
  energyGraph: EnergyBarGraph;
  showEnergyParam: ParameterBoolean;
  displayClock: DisplayClock;
  showClockParam: ParameterBoolean;
  panZoomParam: ParameterBoolean;
  diffEqSolver: DiffEqSolverSubject;
  graph: StandardGraph1;
  timeGraph: TimeGraph1;
  easyScript: EasyScriptParser;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param simRect the dimensions of the simulation view;
*    this also sets the aspect ratio (width to height) of the canvas
* @param sim
* @param advance
* @param opt_name name of this Subject
*/
constructor(elem_ids: ElementIDs, simRect: DoubleRect, sim: SimType, advance: ODEAdvance, opt_name?: string) {
  Util.setErrorHandler();
  super(opt_name || 'APP');
  this.simRect = simRect;
  this.layout = this.makeLayout(elem_ids);
  // keep reference to terminal to make for shorter 'expanded' names
  this.terminal = this.layout.getTerminal();
  const simCanvas = this.layout.getSimCanvas();

  this.sim = sim;
  sim.setTerminal(this.terminal);
  sim.setShowForces(false);
  this.simList = sim.getSimList();
  this.varsList = sim.getVarsList();
  this.advance = advance;
  this.simView = new SimView('SIM_VIEW', this.simRect);
  this.displayList = this.simView.getDisplayList();
  simCanvas.addView(this.simView);
  this.statusView = new SimView('STATUS_VIEW',new DoubleRect(-10, -10, 10, 10));
  this.statusList = this.statusView.getDisplayList();
  simCanvas.addView(this.statusView);
  this.axes = CommonControls.makeAxes(this.simView, /*bottomLeft=*/true);
  this.simRun = new SimRunner(advance);
  this.simRun.addCanvas(simCanvas);
  this.clock = this.simRun.getClock();
  this.rbeh = new RigidBodyEventHandler(sim, this.clock);
  this.simCtrl = new SimController(simCanvas, this.rbeh);
  this.simRun.addErrorObserver(this.simCtrl);
  this.rbo = new RigidBodyObserver(this.simList, this.displayList);

  this.elasticity = new ElasticitySetter(sim);

  this.energyGraph = new EnergyBarGraph(sim);
  this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
      this.statusView, this);

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

  this.diffEqSolver = new DiffEqSolverSubject(sim, sim, advance);

  this.graph = new StandardGraph1(sim.getVarsList(), this.layout.getGraphCanvas(),
      this.layout.getGraphControls(), this.layout.getGraphDiv(), this.simRun);

  this.timeGraph = new TimeGraph1(sim.getVarsList(), this.layout.getTimeGraphCanvas(),
      this.layout.getTimeGraphControls(), this.layout.getTimeGraphDiv(), this.simRun);

  this.easyScript;
  this.terminal.setAfterEval(() => this.sim.modifyObjects());
};

/** @inheritDoc */
override toString() {
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
      +', easyScript: '+this.easyScript.toStringShort()
      +', terminal: '+this.terminal
      + super.toString();
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'myApp.sim' when myName is 'myApp'.
* @param myName  the name of this object, valid in global Javascript context.
*/
defineNames(myName: string): void {
  this.simRun.setAppName(myName);
  this.terminal.addToVars(myName);
  this.terminal.addRegex('advance|axes|clock|diffEqSolver|displayClock|energyGraph'
  +'|graph|layout|sim|simCtrl|simList|simRect|simRun|simView|statusView|timeGraph'
  +'|displayList|easyScript|terminal|statusList|elasticity|varsList|rbo',
      myName+'.');
  this.terminal.addRegex('simCanvas',
      myName+'.layout.');
  this.terminal.addRegex('CommonControls|StandardGraph1|TimeGraph1|TabLayout',
      'sims$$common$$', /*addToVars=*/false);
};

/**
* @param elem_ids
*/
makeLayout(elem_ids: ElementIDs): Layout {
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  const canvasWidth = 800;
  const canvasHeight = Math.round(canvasWidth * this.simRect.getHeight() /
      this.simRect.getWidth());
  return new TabLayout(elem_ids, canvasWidth, canvasHeight);
};

/** Watch a Parameter and when it changes note that there was a discontinuous change
* in potential and total energy.
* @param parameter the Parameter to watch
*/
watchEnergyChange(parameter: Parameter): void {
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

/** @inheritDoc */
getSubjects(): Subject[] {
  const subjects: Subject[] = [
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
* [dependent Subjects](./lab_util_EasyScriptParser.EasyScriptParser.html#md:dependent-subjects)
* in EasyScriptParser documentation.
* @param opt_dependent additional dependent Subjects
*/
makeEasyScript(opt_dependent?: Subject[]) {
  let dependent: Subject[] = [ this.varsList ];
  if (opt_dependent) {
    dependent = dependent.concat(opt_dependent);
  }
  this.easyScript = CommonControls.makeEasyScript(this.getSubjects(), dependent,
      this.simRun, this.terminal);
};

/**
* @param body the rigid body to show in graphs
*/
graphSetup(body?: RigidBody): void {
  if (!body) {
    // find first body with finite mass
    body = this.sim.getBodies().find(bod => isFinite(bod.getMass()));
  } else {
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

addPlaybackControls(): void {
  this.addControl(CommonControls.makePlaybackControls(this.simRun));
};

addURLScriptButton(): void {
  this.addControl(CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  this.graph.addControl(
    CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  this.timeGraph.addControl(
    CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
};

/** Adds the standard set of engine2D controls. */
addStandardControls(): void {
  let pn = this.elasticity.getParameterNumber(ElasticitySetter.en.ELASTICITY);
  this.addControl(new NumericControl(pn));
  let pb = this.sim.getParameterBoolean(RigidBodySim.en.SHOW_FORCES);
  this.addControl(new CheckBoxControl(pb));
  this.addControl(new CheckBoxControl(this.showEnergyParam));
  this.addControl(new CheckBoxControl(this.showClockParam));
  this.addControl(new CheckBoxControl(this.panZoomParam));
  pn = this.simRun.getParameterNumber(SimRunner.en.TIME_STEP);
  this.addControl(new NumericControl(pn));
  pn = this.simRun.getClock().getParameterNumber(Clock.en.TIME_RATE);
  this.addControl(new NumericControl(pn));
  let ps =
      this.diffEqSolver.getParameterString(DiffEqSolverSubject.en.DIFF_EQ_SOLVER);
  this.addControl(new ChoiceControl(ps));
  pn = this.sim.getParameterNumber(EnergyInfo.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));
  let bm = CommonControls.makeBackgroundMenu(this.layout.getSimCanvas());
  this.addControl(bm);
  //ps = this.sim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  //this.addControl(new ChoiceControl(ps));
  // show compile time so user can ensure loading latest version
  // @ts-ignore
  if (0 == 1 && Util.DEBUG) {
    this.addControl(new LabelControl('compiled '+Util.COMPILE_TIME));
  }
};

/** Add the control to the set of simulation controls.
* @param control
* @return the control that was passed in
*/
addControl(control: LabControl): LabControl {
  return this.layout.addControl(control);
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

/** Start the application running.
*/
setup(): void {
  this.clock.resume();
  this.terminal.parseURL();
  this.sim.saveInitialState();
  this.sim.modifyObjects();
  this.simRun.memorize();
};

/** Start the application running.
*/
start(): void {
  this.simRun.startFiring();
  //console.log(Util.prettyPrint(this.toString()));
  //console.log(Util.prettyPrint(this.sim.toString()));
};

} // end class

Util.defineGlobal('sims$engine2D$Engine2DApp', Engine2DApp);
