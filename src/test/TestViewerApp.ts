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

import { PileTest } from './PileTest.js';
import { CircleCircleTest } from './CircleCircleTest.js';
import { CircleStraightTest } from './CircleStraightTest.js';
import { DoNothingTest } from './DoNothingTest.js';
import { JointTest } from './JointTest.js';
import { MiscellanyTest } from './MiscellanyTest.js';
import { MultipleCollisionTest } from './MultipleCollisionTest.js';
import { RopeTest } from './RopeTest.js';
import { SpeedTest } from './SpeedTest.js';
import { StraightStraightTest } from './StraightStraightTest.js';

import { AbstractSubject } from '../lab/util/AbstractSubject.js';
import { CheckBoxControl } from '../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../lab/controls/ChoiceControl.js';
import { Clock } from '../lab/util/Clock.js';
import { CollisionAdvance } from '../lab/model/CollisionAdvance.js';
import { DebugLevel } from '../lab/model/CollisionAdvance.js';
import { CollisionHandling } from '../lab/engine2D/CollisionHandling.js';
import { CommonControls } from '../sims/common/CommonControls.js';
import { ContactSim } from '../lab/engine2D/ContactSim.js';
import { DampingLaw } from '../lab/model/DampingLaw.js';
import { DiffEqSolverSubject } from '../lab/model/DiffEqSolverSubject.js';
import { DisplayAxes } from '../lab/graph/DisplayAxes.js';
import { DisplayClock } from '../lab/view/DisplayClock.js';
import { DisplayList } from '../lab/view/DisplayList.js';
import { DisplayShape } from '../lab/view/DisplayShape.js';
import { DoubleRect } from '../lab/util/DoubleRect.js';
import { EasyScriptParser } from '../lab/util/EasyScriptParser.js';
import { ElasticitySetter } from '../sims/engine2D/ElasticitySetter.js';
import { ElementIDs } from '../sims/common/Layout.js';
import { EnergyBarGraph } from '../lab/graph/EnergyBarGraph.js';
import { ExtraAccel } from '../lab/engine2D/ExtraAccel.js';
import { GenericObserver, ParameterBoolean, ParameterNumber, ParameterString, Subject, SubjectEvent } from '../lab/util/Observe.js';
import { Gravity2Law } from '../lab/model/Gravity2Law.js';
import { GravityLaw } from '../lab/model/GravityLaw.js';
import { GroupControl } from '../lab/controls/GroupControl.js';
import { LabControl } from '../lab/controls/LabControl.js';
import { LabelControl } from '../lab/controls/LabelControl.js';
import { NumericControl } from '../lab/controls/NumericControl.js';
import { PathObserver } from '../sims/roller/PathObserver.js';
import { PileConfig } from '../sims/engine2D/PileConfig.js';
import { Polygon } from '../lab/engine2D/Polygon.js';
import { RigidBodyCollision } from '../lab/engine2D/RigidBody.js';
import { RigidBodyEventHandler } from '../lab/app/RigidBodyEventHandler.js';
import { RigidBodyObserver } from '../sims/engine2D/RigidBodyObserver.js';
import { RigidBodySim } from '../lab/engine2D/RigidBodySim.js';
import { SimController } from '../lab/app/SimController.js';
import { SimList } from '../lab/model/SimList.js';
import { SimObject } from '../lab/model/SimObject.js';
import { SimRunner } from '../lab/app/SimRunner.js';
import { SimView } from '../lab/view/SimView.js';
import { StandardGraph1 } from '../sims/common/StandardGraph1.js';
import { Terminal } from '../lab/util/Terminal.js';
import { Util } from '../lab/util/Util.js';
import { VarsList } from '../lab/model/VarsList.js';
import { Vector } from '../lab/util/Vector.js';
import { VerticalLayout } from '../sims/common/VerticalLayout.js';

// following are only required for possible use in Terminal
import { VarsHistory } from '../lab/graph/VarsHistory.js';
import { FunctionVariable } from '../lab/model/FunctionVariable.js';
import { ClockTask } from '../lab/util/Clock.js';
import { GenericMemo } from '../lab/util/Memo.js';
import { DisplayText } from '../lab/view/DisplayText.js';

/** Interactively run and view various engine2D tests after selecting the
test to run from a set of menus. This lets us see what a test is doing; it uses the
'_setup' method of the test to configure the simulation -- creating and arranging the
initial state of objects. What you see should be exactly the same as what happens when
running the test.

TestViewerApp examines a certain set of test classes and finds methods whose
names end with '_setup' and adds the name of those tests to the menus. So it is only the
'setup' methods for the various tests that can be run here, not the actual tests.

In most cases, TestViewerApp should show the exact same results as the tests. There
are a few tests that make changes outside of the _setup function for the test.

TestViewerApp has two levels of menus: a group menu for each group of tests,
and another menu for individual tests. Selecting from the group menu changes what tests
are available in the individual tests menu. Selecting from the individual tests menu
starts that test running.

The main difference between how tests are run here in TestViewerApp versus
how they are run in Engine2DTests is: in Engine2DTests we make a new
ContactSim for each test, whereas in TestViewerApp we reuse the
ContactSim. This is necessary because of the complex web of connections between
controls, simulation, builder, etc. In future, it might be better to copy how
Engine2DTests works and make a new ContactSim for each test.

WARNING: when trying to debug a test: check whether the options on the ContactSim and
CollisionAdvance are different than the Engine2DTests options; such as
ImpulseSim.setCollisionHandling, CollisionAdvance.setJointSmallImpacts,
ContactSim.setExtraAccel, ContactSim.setExtraAccelTimeStep, the DiffEqSolver,
the timeStep, etc.

## Parameters Created

+ ParameterNumber named `GROUP`, see {@link TestViewerApp#setGroup}.

+ ParameterNumber named `TEST`, see {@link TestViewerApp#setTest}

+ ParameterBoolean named `START_ON_LOAD`, see {@link TestViewerApp#setStartOnLoad}

## How TestViewerApp Works

+ Look in a set of specified classes (e.g. StraightStraightTest,
    CircleStraightTest, etc.)

+ Iterate over all methods in each class, looking for any methods that end with
    '_setup'

+ Make a list of '_setup' methods and their names

+ Make a set of menus, one menu item for each '_setup' method

+ When the menu item selected:  reset the sim;  run the selected '_setup' method.

## Communicating the Time Step

The reason for storing the time step in AdvanceStrategy is
so that TestViewer produces same results as running a test.  This is a way to
communicate the time step to the TestViewer.  VERY IMPORTANT for reproducing
results.  See `TestViewer.startTest_` where we set the timestep on the `SimRunner`.

## Communicating the Sim Rect

If a test sets a specific simulation rectangle on the ContactSim then we use that.
Otherwise we try to find a rectangle that encloses all the objects and then some.
See {@link TestViewerApp#setSimRect_}.

## Gravity and Damping Get Special Treatment

Because GravityLaw and DampingLaw get recreated for each test we search for them after
building each test and connect the respective gravity and damping controls to them.

Another consequence is that we don't provide GravityLaw or DampingLaw to the
EasyScriptParser, so these aren't as easily scriptable as in other apps. However, there are
short names defined for them, so it is still relatively easy to add JavaScript to a URL
script like this:

    gravityLaw.setGravity(7);

The gravity and damping controls are 'built-in' to the HTML, and there is special
code for finding the HTML controls and connecting them. There is also a special
method for inserting a control before these built-in gravity and damping controls,
see {@link TestViewerApp#prependControl}.

**TO DO** rename to reflect this is the test viewer for engine2D tests only?

*/
export class TestViewerApp extends AbstractSubject implements Subject {
  /**  The test classes in which test functions are found. */
  private groups_: Object[] = [];
  /** Name of each group, to display in menu of group choices. */
  private groupNames_: string[] = [];
  /** Which group is currently selected. */
  private groupSelected_: number = -1;
  /**  The 'setup' test functions.  They create and arrange the set of objects
  * that comprise the test.
  */
  private tests_: ((sim: ContactSim, adv: CollisionAdvance<RigidBodyCollision>)=>void)[] = [];
  /** Name of each test, to display in menu of test functions. */
  private testNames_: string[] = [];
  /** Which test is currently selected. */
  private testSelected_: number= -1;
  /** Whether tests should start when loaded. */
  private startOnLoad_: boolean = true;
  layout: VerticalLayout;
  // keep reference to terminal to make for shorter 'expanded' names
  terminal: Terminal;
  sim: ContactSim;
  simList: SimList;
  varsList: VarsList;
  advance: CollisionAdvance<RigidBodyCollision>;
  simRect: DoubleRect;
  simView: SimView;
  displayList: DisplayList;
  statusView: SimView;
  axes: DisplayAxes;
  simRun: SimRunner;
  clock: Clock;
  rbeh: RigidBodyEventHandler;
  simCtrl: SimController;
  rbo: RigidBodyObserver;
  dampingLaw: DampingLaw;
  pathObserver: PathObserver;
  gravityLaw: GravityLaw;
  /** individual test parameter */
  private testParam_: ParameterNumber;
  elasticity: ElasticitySetter;
  energyGraph: EnergyBarGraph;
  showEnergyParam: ParameterBoolean;
  displayClock: DisplayClock;
  showClockParam: ParameterBoolean;
  panZoomParam: ParameterBoolean;
  diffEqSolver: DiffEqSolverSubject;
  graph: StandardGraph1;
  easyScript: EasyScriptParser;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  super('TEST_VIEWER_APP');
  this.layout = new VerticalLayout(elem_ids);
  this.layout.getSimCanvas().setBackground('black');
  const sim_controls = this.layout.getSimControls();
  this.terminal = this.layout.getTerminal();
  const simCanvas = this.layout.getSimCanvas();
  const graphCanvas = this.layout.getGraphCanvas();
  const div_sim = this.layout.getSimDiv();
  this.sim = new ContactSim();
  this.terminal.setAfterEval(() => this.sim.modifyObjects());
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim, _evt => this.sim.modifyObjects(),
      'modifyObjects after parameter or variable change');
  // note that each test should be setting these various parameters.
  this.sim.setShowForces(true);
  this.sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  this.sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
  this.simList = this.sim.getSimList();
  this.varsList = this.sim.getVarsList();
  this.varsList.setHistory(true);
  this.advance = new CollisionAdvance(this.sim);
  this.advance.setJointSmallImpacts(true);
  this.advance.setDebugLevel(DebugLevel.OPTIMAL);
  //this.advance.addWayPoints([WayPoint.NEXT_STEP_ESTIMATE, WayPoint.NEXT_STEP_BINARY]);
  this.simRect = new DoubleRect(-6, -6, 6, 6);
  this.simView = new SimView('simView', this.simRect);
  this.displayList = this.simView.getDisplayList();
  simCanvas.addView(this.simView);
  this.statusView = new SimView('status', new DoubleRect(-10, -10, 10, 10));
  simCanvas.addView(this.statusView);
  this.axes = CommonControls.makeAxes(this.simView, /*bottomLeft=*/true);
  this.simRun = new SimRunner(this.advance);
  this.simRun.setTimeStep(0.025);
  this.simRun.addCanvas(simCanvas);
  this.simRun.getParameterNumber(SimRunner.en.TIME_STEP).setSignifDigits(7);
  this.clock = this.simRun.getClock();
  this.clock.getParameterNumber(Clock.en.TIME_RATE).setSignifDigits(5);
  this.rbeh = new RigidBodyEventHandler(this.sim, this.clock);
  this.simCtrl = new SimController(simCanvas, this.rbeh);
  this.rbo = new RigidBodyObserver(this.simList, this.simView.getDisplayList());
  this.pathObserver = new PathObserver(this.simList, this.simView,
      /*simRectSetter=*/null);
  //this.advance.setDebugPaint( () => this.simRun.paintAll());

  // make the group test menu
  this.addGroup_(StraightStraightTest, 'Straight/Straight');
  this.addGroup_(CircleStraightTest, 'Circle/Straight');
  this.addGroup_(CircleCircleTest, 'Circle/Circle');
  this.addGroup_(DoNothingTest, 'DoNothingGrinder');
  this.addGroup_(JointTest, 'Joints');
  this.addGroup_(MiscellanyTest, 'Miscellany');
  this.addGroup_(MultipleCollisionTest, 'Multiple Collision');
  this.addGroup_(PileTest, 'Pile');
  this.addGroup_(RopeTest, 'Ropes');
  this.addGroup_(SpeedTest, 'Speed');
  
  let pn: ParameterNumber;
  let ps: ParameterString;
  let pb: ParameterBoolean;

  const pbc = CommonControls.makePlaybackControls(this.simRun);
  this.prependControl(pbc);
  // insert a <BR> element to break up long lines of controls into logical groups
  let br = new GroupControl('BR', document.createElement('BR'), []);
  this.prependControl(br);

  this.addParameter(pn = new ParameterNumber(this, TestViewerApp.en.GROUP,
      TestViewerApp.i18n.GROUP,
      () => this.getGroup(), a => this.setGroup(a),
      this.groupNames_, Util.range(this.groupNames_.length)));
  // The menu showing the available groups of tests.
  this.prependControl(new ChoiceControl(pn, /*label=*/''));

  this.testParam_ = new ParameterNumber(this, TestViewerApp.en.TEST,
      TestViewerApp.i18n.TEST,
      () => this.getTest(), a => this.setTest(a),
      this.testNames_, Util.range(this.testNames_.length));
  this.addParameter(this.testParam_);
  // The menu showing the available test functions for the current group.
  this.prependControl(new ChoiceControl(this.testParam_, /*label=*/''));

  this.addParameter(pb = new ParameterBoolean(this, TestViewerApp.en.START_ON_LOAD,
      TestViewerApp.i18n.START_ON_LOAD,
      () => this.getStartOnLoad(), a => this.setStartOnLoad(a)));
  this.prependControl(new CheckBoxControl(pb));

  br = new GroupControl('BR', document.createElement('BR'), []);
  this.prependControl(br);

  // The damping and gravity controls appear here in the list of controls.

  this.elasticity = new ElasticitySetter(this.sim);
  pn = this.elasticity.getParameterNumber(ElasticitySetter.en.ELASTICITY);
  this.addControl(new NumericControl(pn));

  // show compile time so user can ensure loading latest version
  // @ts-ignore
  if (0 == 1 && Util.DEBUG) {
    this.addControl(new LabelControl('compiled '+Util.COMPILE_TIME));
  }

  br = new GroupControl('BR', document.createElement('BR'), []);
  this.addControl(br);

  pb = this.sim.getParameterBoolean(RigidBodySim.en.SHOW_FORCES);
  this.addControl(new CheckBoxControl(pb));

  this.energyGraph = new EnergyBarGraph(this.sim);
  this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
      this.statusView, this);
  this.addControl(new CheckBoxControl(this.showEnergyParam));

  this.displayClock = new DisplayClock(() => this.sim.getTime(),
      () => this.clock.getRealTime(), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
  this.showClockParam = CommonControls.makeShowClockParam(this.displayClock,
      this.statusView, this);
  this.addControl(new CheckBoxControl(this.showClockParam));

  const panzoom = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true,
      () => this.simView.setSimRect(this.simRect));
  this.layout.getSimDiv().appendChild(panzoom);
  this.panZoomParam = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.panZoomParam.setValue(false);
  this.addControl(new CheckBoxControl(this.panZoomParam));
  const bm = CommonControls.makeBackgroundMenu(this.layout.getSimCanvas());
  this.addControl(bm);

  br = new GroupControl('BR', document.createElement('BR'), []);
  this.addControl(br);

  pn = this.simRun.getParameterNumber(SimRunner.en.TIME_STEP);
  this.addControl(new NumericControl(pn));
  pn = this.simRun.getClock().getParameterNumber(Clock.en.TIME_RATE);
  this.addControl(new NumericControl(pn));

  this.diffEqSolver = new DiffEqSolverSubject(this.sim, this.sim, this.advance);
  ps = this.diffEqSolver.getParameterString(DiffEqSolverSubject.en.DIFF_EQ_SOLVER);
  this.addControl(new ChoiceControl(ps));

  this.graph = new StandardGraph1(this.varsList, this.layout.getGraphCanvas(),
      this.layout.getGraphControls(), this.layout.getGraphDiv(), this.simRun, 'inline');

  const p = this.rbo.protoPolygon;
  p.setFillStyle('rgba(51,204,255,0.5)');
  p.setNameColor('gray');
  p.setNameFont('12pt sans-serif');
  p.setDrawCenterOfMass(true);
  p.setDrawDragPoints(true);

  let subjects: Subject[] = [
    this,
    this.sim,
    this.diffEqSolver,
    this.simRun,
    this.clock,
    this.simView,
    this.statusView,
    this.layout.getSimCanvas(),
    this.layout.getGraphCanvas(),
    this.elasticity
  ];
  subjects = subjects.concat(this.graph.getSubjects());

  this.easyScript = CommonControls.makeEasyScript(subjects, [ this.varsList ],
      this.simRun, this.terminal);
  this.addControl(CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
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
    +', graph: '+this.graph.toStringShort()
    +', layout: '+this.layout.toStringShort()
    +', easyScript: '+this.easyScript.toStringShort()
    +', terminal: '+this.terminal
    + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'TestViewerApp';
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'myApp.sim' when myName is 'myApp'.
* @param myName  the name of this object, valid in global Javascript context.
*/
defineNames(myName: string): void {
  this.terminal.addRegex('advance|axes|clock|diffEqSolver|displayClock'
      +'|energyGraph|graph|layout|sim|simCtrl|simList|simRect|simRun'
      +'|simView|statusView|terminal|varsList|displayList',
      myName+'.');
  this.terminal.addRegex('simCanvas',
      myName+'.layout.');
  this.terminal.addRegex('gravityLaw|dampingLaw|easyScript|elasticity',
       myName+'.');
};

/** Returns index of current group within group menu
* @return index of current group within group menu
*/
getGroup(): number {
  return this.groupSelected_;
};

/** Change to the given group menu, and run the first test of that group
* @param groupIndex index of group within group menu
*/
setGroup(groupIndex: number): void {
  if (groupIndex < 0 || groupIndex >= this.groupNames_.length) {
    throw 'setGroup: groupIndex='+groupIndex
        +' range=' +this.groupNames_.length;
  }
  if (this.groupSelected_ != groupIndex) {
    this.groupSelected_ = groupIndex;
    this.testSelected_ = -1;
    this.tests_.length = 0;
    this.testNames_.length = 0;
    this.addTestsFrom_(this.groups_[groupIndex]);
    this.testParam_.setChoices(this.testNames_,
        Util.range(this.testNames_.length));
    this.testParam_.setValue(0);
    this.broadcastParameter(TestViewerApp.en.GROUP);
  }
};

/** Returns index of current test within test menu
* @return index of current test within test menu
*/
getTest(): number {
  return this.testSelected_;
};

/** Change to run the given test.
* @param index index of test within test menu of current group
*/
setTest(index: number): void {
  if (index < 0 || index >= this.testNames_.length) {
    throw 'setTest: index='+index+' range='+this.testNames_.length;
  }
  if (this.testSelected_ != index) {
    this.testSelected_ = index;
    this.startTest_(index);
    //this.testMenu_.setChoice(index);
    this.broadcastParameter(TestViewerApp.en.TEST);
  }
};

/**
* @param c
* @param name
*/
private addGroup_(c: object, name: string): void {
  //console.log('addGroup_ '+c+' name='+name);
  this.groups_.push(c);
  this.groupNames_.push(name);
};

/**
*/
getStartOnLoad(): boolean {
  return this.startOnLoad_;
};

/**
* @param value
*/
setStartOnLoad(value: boolean): void {
  if (this.startOnLoad_ != value) {
    this.startOnLoad_ = value;
    this.broadcastParameter(TestViewerApp.en.START_ON_LOAD);
  }
};

/** Adds tests from the given class to the menu of available tests.
Tests are static methods that take a parameter of type ContactSim
and return `undefined`.
The test added must end with '_setup';  the menu name is generated from
the test method name by changing all underscores to blanks, and removing
the '_setup' suffix.
@param c the class whose tests will be added to the menu of available tests.
*/
private addTestsFrom_(c: object) {
  const nms = Object.getOwnPropertyNames(c);
  for (let i=0; i<nms.length; i++) {
    let p = nms[i];
    if (typeof c[p as keyof typeof c] !== 'function') continue;  // skip non-functions
    if (!p.match(/.*_setup$/)) continue;  // skip non-setup functions
    const nm = p.replace(/_setup$/, '').replace(/_/g, ' ');
    this.testNames_.push(nm);
    this.tests_.push(c[p as keyof typeof c]);
  }
};

/**  Loads and runs the selected test.

Note: Previously, TestViewerApp was rebuilding the entire world (controls, canvas, sim,
display, etc.) and this was causing a lot of confusion. A symptom was that the test
menus were being left behind when switching to a different Builder. Now TestViewerApp’s
reset method is re-using the ContactSim and not rebuilding controls etc.

@param testIndex
*/
private startTest_(testIndex: number) {
  Util.assert(typeof testIndex === 'number');

  this.sim.setDistanceTol(0.01);
  this.sim.setVelocityTol(0.5);
  this.sim.setCollisionAccuracy(0.6);
  this.sim.cleanSlate();
  this.advance.reset();
  const groupName = this.groupNames_[this.groupSelected_];
  const testName = this.testNames_[testIndex];
  if (Util.DEBUG) {
    console.log('TestViewerApp.startTest group='+groupName+' test="'+testName+'"');
  }
  // preserve the 'show forces' setting
  const showForce = this.sim.getShowForces();
  // start naming polygons from "1"
  Polygon.ID = 1;

  // Run the '_setup' method which sets the test initial conditions.
  this.tests_[testIndex](this.sim, this.advance);

  // Set moveable blocks to random colors. Helps distinguish them visually.
  this.displayList.toArray().forEach(ds => {
    if (ds instanceof DisplayShape) {
      const p = ds.getMassObjects()[0];
      if (isFinite(p.getMass())) {
        ds.setFillStyle(PileConfig.getRandomColor());
      }
      // clock-with-gears needs special display
      if (groupName == 'Miscellany' && testName == 'clock with gears') {
        ds.setStrokeStyle('black');
        if (p.nameEquals('escape wheel')) {
          ds.setZIndex(-1);
        }
      }
    }
  });

  // ensure that we use same timestep that is used in the Engine2DTestRig
  this.simRun.setTimeStep(this.advance.getTimeStep());

  // ensure the correct diffeq solver is displayed
  this.diffEqSolver.broadcastParameter(DiffEqSolverSubject.en.DIFF_EQ_SOLVER);

  //console.log('TestViewerApp.startTest seed='+sim.getRandomSeed());

  // preserve the 'show forces' setting
  this.sim.setShowForces(showForce);
  this.makeGravityControl_();
  this.makeDampingControl_();

  // save initial state of vars, so that 'reset' can be done to return to initial state.
  this.sim.saveInitialState();
  this.setSimRect_();
  this.easyScript.update();
  this.clock.setTime(this.sim.getTime());
  this.clock.setRealTime(this.sim.getTime());
  if (this.startOnLoad_) {
    this.clock.resume();
  } else {
    this.clock.pause();
  }
  // don't do simRun.startFiring() here!  That results in the sim starting up
  // too early in the load process. Symptom was that on Chrome we would see
  // the time being 0.025 after hitting the rewind button.
};

/** Find an existing GravityLaw created by a test, make a NumericControl for it.
*/
private makeGravityControl_(): void {
  const g = this.sim.getForceLaws().find(f =>
      f instanceof GravityLaw || f instanceof Gravity2Law);
  const e = Util.getElementById('gravity_control') as HTMLInputElement;
  if (g === undefined) {
    e.value = '';
    e.disabled = true;
    return;
  } else {
    // hack warning: this only works because Gravity2Law also has
    // a parameter named 'gravity'
    this.gravityLaw = g as GravityLaw;
    const p = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
    const nc = new NumericControl(p, e);
    nc.setEnabled(true);
  }
};

/** Find an existing DampingLaw created by a test, make a NumericControl for it.
*/
private makeDampingControl_(): void {
  const g = this.sim.getForceLaws().find(f => f instanceof DampingLaw);
  const e = Util.getElementById('damping_control') as HTMLInputElement;
  if (g == null) {
    e.value = '';
    e.disabled = true;
    return;
  } else {
    this.dampingLaw = g as DampingLaw;
    const p = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
    const nc = new NumericControl(p, e);
    nc.setEnabled(true);
  }
};

/** Finds a rectangle that surrounds all the objects and set the SimView to
that size. If there are no walls, then sets to twice the size.
*/
private setSimRect_(): void {
  // does sim have a specified simRect?
  const simRect = this.sim.getSimRect();
  if (simRect != null) {
    this.simRect = simRect;
  } else {
    // Find a rectangle that surrounds all the objects
    const bods = this.sim.getSimList().toArray();
    if (bods.length == 0) {
      return;
    }
    let rect = bods[0].getBoundsWorld();
    let walls = false;
    bods.forEach(b => {
      rect = rect.union(b.getBoundsWorld());
      walls = walls || /^WALL*/.test(b.getName());
    });
    // if no walls, then expand the rectangle
    if (!walls) {
      rect = rect.scale(2.0);
    }
    this.simRect = rect;
  }
  this.simView.setSimRect(this.simRect);
};

/** Do initial setup of this app. Determines which test to run at start, what
* UI controls to show, etc.
*/
setup(): void {
  this.setGroup(/*groupIndex=*/0);
  this.layout.showTerminal(true);
  this.layout.showControls(true);
  this.statusView.getDisplayList().add(this.displayClock);
  this.statusView.getDisplayList().add(this.energyGraph);

  this.terminal.parseURL();
  this.sim.saveInitialState();
  this.sim.modifyObjects();
};

/** Add the control to the set of simulation controls.
* @param control
* @return the control that was passed in
*/
addControl(control: LabControl): LabControl {
  return this.layout.addControl(control);
};

/** Add the control to the set of simulation controls, before the damping control.
* @param control
* @return the control that was passed in
*/
prependControl(control: LabControl): LabControl {
  const element = control.getElement();
  element.style.display = 'inline-block';
  this.layout.addControl(control, /*opt_add=*/false);
  // add playback controls before the pre-existing damping and gravity controls
  const e = Util.getElementById('damping_control');
  // the damping control is wrapped in a LABEL, so need to get its parentNode
  this.layout.getSimControls().insertBefore(element, e.parentNode);
  return control;
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
start(): void {
  this.simRun.startFiring();
};

static readonly en: i18n_strings = {
  GROUP: 'group',
  TEST: 'test',
  START_ON_LOAD: 'start on load'
};

static readonly de_strings: i18n_strings = {
  GROUP: 'Gruppe',
  TEST: 'Prüfung',
  START_ON_LOAD: 'beginn nach laden'
};

static readonly i18n = Util.LOCALE === 'de' ? TestViewerApp.de_strings : TestViewerApp.en;

} // end class

type i18n_strings = {
  GROUP: string,
  TEST: string,
  START_ON_LOAD: string
};

Util.defineGlobal('test$TestViewerApp', TestViewerApp);
