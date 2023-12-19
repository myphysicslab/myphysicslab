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
import { Arc } from '../../lab/model/Arc.js';
import { AutoScale } from '../../lab/graph/AutoScale.js';
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { Clock } from '../../lab/util/Clock.js';
import { CommonControls } from '../common/CommonControls.js';
import { CompareGraph } from '../common/CompareGraph.js';
import { CompareTimeGraph } from '../common/CompareTimeGraph.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { DisplayArc } from '../../lab/view/DisplayArc.js';
import { DisplayAxes } from '../../lab/graph/DisplayAxes.js';
import { DisplayClock } from '../../lab/view/DisplayClock.js';
import { DisplayGraph } from '../../lab/graph/DisplayGraph.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayList } from '../../lab/view/DisplayList.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DrawingMode } from '../../lab/view/DrawingMode.js';
import { ElementIDs } from '../common/Layout.js';
import { EasyScriptParser } from '../../lab/util/EasyScriptParser.js';
import { EnergyBarGraph } from '../../lab/graph/EnergyBarGraph.js';
import { GenericObserver, SubjectEvent, Subject } from '../../lab/util/Observe.js';
import { GraphLine } from '../../lab/graph/GraphLine.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterBoolean } from '../../lab/util/Observe.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { ParameterString } from '../../lab/util/Observe.js';
import { PendulumSim } from './PendulumSim.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimController } from '../../lab/app/SimController.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { SimView } from '../../lab/view/SimView.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { TabLayout } from '../common/TabLayout.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Runs two chaotic pendulum simulations simultaneously with the same settings except
for a slight difference of initial conditions. This demonstrates the sensitivity of
chaotic systems to initial condtions.  The driven pendulum simulation used is
{@link PendulumSim}.

Creates instance objects such as the simulation and display objects;
defines regular expressions for easy Terminal scripting of these objects using short
names instead of fully qualified property names.

The constructor takes an argument that specifies the names of the HTML elementId's to
look for in the HTML document; these elements are where the user interface of the
simulation is created. This allows for having two separate simulation apps running
concurrently on a single page.

A global variable is created for this application instance outside of this file in the
HTML where the constructor is called. The name of that global variable holding the
application is passed to defineNames() method so that short-names in scripts can be
properly expanded.

*/
export class ComparePendulumApp extends AbstractSubject implements Subject {
  layout: TabLayout;
  terminal: Terminal;
  /** difference between two start angles */
  angleDelta: number = 0.001;
  sim1: PendulumSim;
  simList: SimList;
  sim2: PendulumSim;
  simList2: SimList;
  simCtrl: SimController;
  advance1: SimpleAdvance;
  advance2: SimpleAdvance;
  simRect: DoubleRect;
  simView: SimView;
  displayList: DisplayList;
  statusView: SimView;
  axes: DisplayAxes;
  simRun: SimRunner;
  clock: Clock;
  bob2: PointMass;
  bob1: PointMass;
  energyGraph: EnergyBarGraph;
  showEnergyParam: ParameterBoolean;
  displayClock: DisplayClock;
  graph: CompareGraph;
  timeGraph: CompareTimeGraph;
  easyScript: EasyScriptParser;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  super('APP');
  this.layout = new TabLayout(elem_ids);
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);
  // keep reference to terminal to make for shorter 'expanded' names
  this.terminal = this.layout.getTerminal();
  const simCanvas = this.layout.getSimCanvas();

  this.sim1 = new PendulumSim('SIM_1');
  const startAngle = Math.PI/4;
  const va1 = this.sim1.getVarsList();
  va1.setValue(0, startAngle);
  this.sim1.saveInitialState();
  this.simList = this.sim1.getSimList();
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim1, (_evt: SubjectEvent) => this.sim1.modifyObjects(),
      'modifyObjects after parameter or variable change');
  this.sim2 = new PendulumSim('SIM_2');
  this.terminal.setAfterEval( () => {
      this.sim1.modifyObjects();
      this.sim2.modifyObjects();
    });
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim2, (_evt: SubjectEvent) => this.sim2.modifyObjects(),
      'modifyObjects after parameter or variable change');
  const va2 = this.sim2.getVarsList();
  va2.setValue(0, startAngle + this.angleDelta);
  this.sim2.saveInitialState();
  this.simList2 = this.sim2.getSimList();
  this.simCtrl = new SimController(simCanvas, /*eventHandler=*/this.sim1);
  this.advance1  = new SimpleAdvance(this.sim1);
  this.advance2 = new SimpleAdvance(this.sim2);
  this.simRect = new DoubleRect(-2, -2.2, 2, 1.5);
  this.simView = new SimView('simView', this.simRect);
  this.displayList = this.simView.getDisplayList();
  simCanvas.addView(this.simView);
  this.statusView = new SimView('status', new DoubleRect(-10, -10, 10, 10));
  simCanvas.addView(this.statusView);
  this.axes = CommonControls.makeAxes(this.simView, /*bottomLeft=*/true);
  this.simRun = new SimRunner(this.advance1);
  this.simRun.addStrategy(this.advance2);
  this.simRun.addCanvas(simCanvas);
  this.clock = this.simRun.getClock();

  const displayRod2 = new DisplayLine(this.simList2.getConcreteLine('rod'));
  this.displayList.add(displayRod2);
  this.bob2 = this.simList2.getPointMass('bob');
  const displayBob2 = new DisplayShape(this.bob2);
  displayBob2.setFillStyle('red');
  this.displayList.add(displayBob2);
  displayBob2.setDragable(false);

  this.bob1 = this.simList.getPointMass('bob');
  const displayBob = new DisplayShape(this.bob1);
  displayBob.setFillStyle('blue');
  this.displayList.add(displayBob);
  const displayRod = new DisplayLine(this.simList.getConcreteLine('rod'));
  this.displayList.add(displayRod);
  const displayDrive = new DisplayArc(this.simList.getArc('drive'));
  this.displayList.add(displayDrive);

  this.addControl(CommonControls.makePlaybackControls(this.simRun));

  let pn = new ParameterNumber(this, ComparePendulumApp.en.ANGLE_DELTA,
      ComparePendulumApp.i18n.ANGLE_DELTA,
      () => this.getAngleDelta(), a => this.setAngleDelta(a))
      .setDecimalPlaces(7);
  this.addParameter(pn);
  this.addControl(new NumericControl(pn));

  pn = this.sim1.getParameterNumber(PendulumSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = this.sim1.getParameterNumber(PendulumSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = this.sim1.getParameterNumber(PendulumSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 10.2, /*multiply=*/true));

  pn = this.sim1.getParameterNumber(PendulumSim.en.DRIVE_AMPLITUDE);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = this.sim1.getParameterNumber(PendulumSim.en.DRIVE_FREQUENCY);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = this.sim1.getParameterNumber(PendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  this.energyGraph = new EnergyBarGraph(this.sim1);
  this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
      this.statusView, this);
  this.addControl(new CheckBoxControl(this.showEnergyParam));

  this.displayClock = new DisplayClock( () => this.sim1.getTime(),
      () => this.clock.getRealTime(), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
  let pb = CommonControls.makeShowClockParam(this.displayClock, this.statusView, this);
  this.addControl(new CheckBoxControl(pb));

  const panzoom_simview = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true,
      () => this.simView.setSimRect(this.simRect) );
  this.layout.getSimDiv().appendChild(panzoom_simview);
  pb = CommonControls.makeShowPanZoomParam(panzoom_simview, this);
  pb.setValue(false);
  this.addControl(new CheckBoxControl(pb));

  pn = this.simRun.getParameterNumber(SimRunner.en.TIME_STEP);
  this.addControl(new NumericControl(pn));
  pn = this.simRun.getClock().getParameterNumber(Clock.en.TIME_RATE);
  this.addControl(new NumericControl(pn));
  const bm = CommonControls.makeBackgroundMenu(this.layout.getSimCanvas());
  this.addControl(bm);

  const line1 = new GraphLine('GRAPH_LINE_1', va1);
  line1.setXVariable(0);
  line1.setYVariable(1);
  line1.setColor('blue');
  line1.setDrawingMode(DrawingMode.DOTS);

  const line2 = new GraphLine('GRAPH_LINE_2', va2);
  line2.setXVariable(0);
  line2.setYVariable(1);
  line2.setColor('red');
  line2.setDrawingMode(DrawingMode.DOTS);

  // keep line2's X and Y variable in sync with line1
  const paramY = line1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  const paramX = line1.getParameterNumber(GraphLine.en.X_VARIABLE);
  const py2 = line2.getParameterNumber(GraphLine.en.Y_VARIABLE);
  const px2 = line2.getParameterNumber(GraphLine.en.X_VARIABLE);
  new GenericObserver(line1, evt => {
    if (evt == paramY) {
      py2.setValue(paramY.getValue());
    } else if (evt == paramX) {
      px2.setValue(paramX.getValue());
    }
  }, 'keep line2\'s X and Y variable in sync with line1');

  this.graph = new CompareGraph(line1, line2,
      this.layout.getGraphCanvas(),
      this.layout.getGraphControls(), this.layout.getGraphDiv(), this.simRun);

  const timeLine1 = new GraphLine('TIME_LINE_1', va1);
  timeLine1.setYVariable(0);
  timeLine1.setColor('blue');
  timeLine1.setDrawingMode(DrawingMode.DOTS);
  const timeLine2 = new GraphLine('TIME_LINE_2', va2);
  timeLine2.setYVariable(0);
  timeLine2.setColor('red');
  timeLine2.setDrawingMode(DrawingMode.DOTS);
  // keep timeLine2's Y variable in sync with timeLine1
  const timeParamY = timeLine1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  const time_py2 = timeLine2.getParameterNumber(GraphLine.en.Y_VARIABLE);
  new GenericObserver(timeLine1, evt => {
    if (evt == timeParamY) {
      time_py2.setValue(timeParamY.getValue());
    }
  }, 'keep timeLine2\'s Y variable in sync with timeLine1');
  this.timeGraph = new CompareTimeGraph(timeLine1, timeLine2,
      this.layout.getTimeGraphCanvas(),
      this.layout.getTimeGraphControls(), this.layout.getTimeGraphDiv(), this.simRun);

  new GenericObserver(this.sim1, (evt: SubjectEvent) => {
    if (evt instanceof ParameterNumber) {
      // match the parameters on sim2 to those of sim
      const pn = this.sim2.getParameterNumber(evt.getName());
      pn.setValue(evt.getValue());
    } else if (evt.nameEquals('START_DRAG')) {
      // prevent sim2 from calculating ODE while dragging
      this.sim2.setIsDragging(true);
    } else if (evt.nameEquals('MOUSE_DRAG')) {
      // set sim2 to match position of sim1 (plus angleDelta)
      va2.setValue(0, va1.getValue(0) + this.angleDelta);
      va2.setValue(1, va1.getValue(1));
      // modify sim2 objects in case we are currently paused
      this.sim2.modifyObjects();
    } else if (evt.nameEquals('FINISH_DRAG')) {
      // restore calculation of ODE in sim2
      this.sim2.setIsDragging(false);
      // save initial state with time=0
      va2.setTime(0);
      this.sim2.saveInitialState();
      va1.setTime(0);
      this.sim1.saveInitialState();
      // restart from initial state
      this.simRun.reset();
    } else if (evt.nameEquals('RESET')) {
      this.sim2.reset();
    }
  }, 'sim2 follows sim1 when mouse dragging');

  let subjects: Subject[] = [
    this,
    this.sim1,
    this.sim2,
    this.simRun,
    this.clock,
    this.simView,
    this.statusView,
    this.sim1.getVarsList(),
    this.sim2.getVarsList()
  ];
  subjects = subjects.concat(this.layout.getSubjects(),
      this.graph.getSubjects(), this.timeGraph.getSubjects());
  this.easyScript = CommonControls.makeEasyScript(subjects, [], this.simRun,
      this.terminal);
  this.addControl(CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  this.graph.addControl(
    CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
  this.timeGraph.addControl(
    CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', sim1: '+this.sim1.toStringShort()
      +', sim2: '+this.sim2.toStringShort()
      +', terminal: '+this.terminal
      +', graph: '+this.graph
      +', timeGraph: '+this.timeGraph
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'ComparePendulumApp';
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'app.sim' when `myName` is 'app'.
* @param myName  the name of this object, valid in global Javascript context.
*/
defineNames(myName: string): void {
  this.terminal.addRegex('advance1|advance2|axes|clock|displayClock|displayList'
      +'|energyGraph|graph|layout|sim1|sim2|simCtrl|simList|simList2'
      +'|simRect|simRun|simView|statusView|timeGraph|easyScript|terminal',
      myName+'.');
  this.terminal.addRegex('simCanvas',
      myName+'.layout.');
};

/** Add the control to the set of simulation controls.
* @param control
*/
addControl(control: LabControl): void {
  this.layout.addControl(control);
};

/** Setup the application.
*/
setup(): void {
  this.clock.resume();
  this.terminal.parseURL();
  this.sim1.saveInitialState();
  this.sim1.modifyObjects();
};

/** Start the application running.
*/
start(): void {
  this.simRun.startFiring();
  //console.log(Util.prettyPrint(this.toString()));
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

/**
*/
getAngleDelta(): number {
  return this.angleDelta;
};

/**
* @param value
*/
setAngleDelta(value: number) {
  if (this.angleDelta != value) {
    this.angleDelta = value;
    this.simRun.reset();
    const startAngle = this.sim1.getVarsList().getValue(0);
    this.sim2.getVarsList().setValue(0, startAngle + this.angleDelta);
    this.sim2.saveInitialState();
    this.broadcastParameter(ComparePendulumApp.en.ANGLE_DELTA);
  }
};

static readonly en: i18n_strings = {
  ANGLE_DELTA: 'angle difference'
};

static readonly de_strings: i18n_strings = {
  ANGLE_DELTA: 'Winkeldifferenz'
};

static readonly i18n = Util.LOCALE === 'de' ? ComparePendulumApp.de_strings : ComparePendulumApp.en;

} // end class

type i18n_strings = {
  ANGLE_DELTA: string
};
Util.defineGlobal('sims$pendulum$ComparePendulumApp', ComparePendulumApp);
