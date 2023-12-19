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
import { DisplayAxes } from '../../lab/graph/DisplayAxes.js';
import { DisplayClock } from '../../lab/view/DisplayClock.js';
import { DisplayGraph } from '../../lab/graph/DisplayGraph.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayList } from '../../lab/view/DisplayList.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DrawingMode } from '../../lab/view/DrawingMode.js';
import { EasyScriptParser } from '../../lab/util/EasyScriptParser.js';
import { ElementIDs } from '../common/Layout.js';
import { EnergyBarGraph } from '../../lab/graph/EnergyBarGraph.js';
import { EventHandler } from '../../lab/app/EventHandler.js';
import { GenericObserver } from '../../lab/util/Observe.js';
import { GraphLine } from '../../lab/graph/GraphLine.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { Observer } from '../../lab/util/Observe.js';
import { ParameterBoolean } from '../../lab/util/Observe.js';
import { ParameterNumber, SubjectEvent, Subject } from '../../lab/util/Observe.js';
import { PendulumSim } from './PendulumSim.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { ReactionPendulumSim } from './ReactionPendulumSim.js';
import { SimController } from '../../lab/app/SimController.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { SimView } from '../../lab/view/SimView.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { TabLayout } from '../common/TabLayout.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Displays the reaction forces pendulum simulation {@link ReactionPendulumSim} and
compares it to the classic pendulum simulation {@link PendulumSim} which is shown
alongside. The simultaneous simulations show that the two pendulums are equivalent in
their motion. This also confirms that the calculation for equivalent arm length (see
below) is correct.

Something to notice is that the reaction force diverges more from the stick vector as
the size of disk increases. This is because a smaller disk is closer to the ideal of a
point mass in the classic pendulum simulation.

Keep Parameters Synchronized
------------------------------
We keep the parameters for gravity, mass and length of pendulum synchronized between the
two simulations (though length is slightly different, see below).

The damping model is different for the two simulations so we don't try to synchronize
the damping; we just leave both simulations with zero damping.

Length of Equivalent Classic Pendulum
------------------------------------------
To match the motion of the two simulations, the lengths are slightly different. The
ReactionPendulumSim simulation models the pendulum as a rigid disc with mass distributed
evenly. The classic ideal PendulumSim models the pendulum as a point mass at the end of
a massless rod.

We want to find the length of the simple ideal pendulum that is equivalent to the rigid
body disk pendulum.

Rotation of a solid cylinder of radius `r` about its cylinder axis has rotational
inertia
```text
I = m r^2 / 2
```
Use parallel axis theorem, where the CM (center of mass) is at distance `h` from the
pivot point, to get rotational inertia of:
```text
I = m r^2 / 2 + m h^2
```
Use rotational analog of Newton's second law of motion about a fixed axis which is
```text
I \theta'' = sum of torques
```
Here the only torque is from gravity at the CM:
```text
I \theta'' = -h m g sin(\theta)
```
expand this using the value for I found above
```text
\theta'' =  -h m g sin(\theta) / (m r^2 / 2 + m h^2)
= -h g sin(\theta) / (r^2/2 + h^2)
```
what would be the equivalent length of a simple point mass pendulum? Let
```text
R = the length of that equivalent simple pendulum
I = m R^2
```
then we have
```text
I \theta'' = - m g R sin (\theta)
\theta'' = - g sin (\theta) / R
```
equating the two we get
```text
h / (r^2/2 + h^2) = 1 / R
R = (r^2/2 + h^2) / h
= h + r^2 / (2 h)
```
So the equivalent ideal pendulum is longer:  `R > h`

Another Way to Calculate Equivalent Length
-------------------------------------------
Here's another way to calculate equivalent classic ideal pendulum length. Suppose we
have rotational inertia about the pivot point (not about the CM) is `I`, and length to
the CM is `h`.
```text
I \theta'' = -h m g sin(\theta)
\theta'' = -h m g sin(\theta) / I
```
What would be the equivalent length `R` of an ideal (point mass) pendulum?
For ideal pendulum, as above:
```text
\theta'' = - g sin (\theta) / R
```
Equating these gives:
```text
1 / R = h m / I
R = I / (m h)
```
If we put in the value for `I` above:
```text
R = (m r^2 / 2 + m h^2) / (m h)
= h + r^2 / (2 h)
```
which is the same as the previous answer.

App Setup
---------------------------
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
export class ReactionPendulumApp extends AbstractSubject implements Subject, Observer {
  /** distance between the pendulum anchor points */
  separation: number = 0.5;
  startAngle: number = 5*Math.PI/7;
  /** length of ReactionPendulumSim */
  pendulumLength: number = 1.5;
  /** radius of rigid body pendulum disk */
  private radius: number = 0.4;
  layout: TabLayout;
  terminal: Terminal;
  simRect: DoubleRect = new DoubleRect(-2, -2, 2, 2.7);;
  simView: SimView;
  displayList: DisplayList;
  statusView: SimView;
  sim1: PendulumSim;
  simList1: SimList;
  simList2: SimList;
  sim2: ReactionPendulumSim;
  simCtrl: SimController;
  axes: DisplayAxes;
  advance1: SimpleAdvance;
  advance2: SimpleAdvance;
  simRun: SimRunner;
  clock: Clock;
  energyGraph1: EnergyBarGraph;
  showEnergyParam1: ParameterBoolean;
  energyGraph2: EnergyBarGraph;
  showEnergyParam2: ParameterBoolean;
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
  this.terminal = this.layout.getTerminal();
  const simCanvas = this.layout.getSimCanvas();
  this.simView = new SimView('simView', this.simRect);
  this.displayList = this.simView.getDisplayList();
  simCanvas.addView(this.simView);
  this.statusView = new SimView('status', new DoubleRect(-10, -10, 10, 10));
  simCanvas.addView(this.statusView);

  this.sim1 = new PendulumSim('SIM_1');
  const va1 = this.sim1.getVarsList();
  this.sim1.setLength(this.classicLength());
  this.sim1.setDriveAmplitude(0);
  this.sim1.setPivot(new Vector(this.separation, 0));
  this.sim1.setDamping(0);
  this.sim1.setGravity(3);
  this.sim1.setMass(0.1);
  va1.setValue(0, this.startAngle);
  va1.setValue(1, 0);
  this.sim1.saveInitialState();
  this.simList1 = this.sim1.getSimList();
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim1, (_evt: SubjectEvent) => this.sim1.modifyObjects(),
      'modifyObjects after parameter or variable change');

  const displayBob1 = new DisplayShape(this.simList1.getPointMass('bob'));
  displayBob1.setFillStyle('#3cf');
  displayBob1.setDragable(false);
  this.displayList.add(displayBob1);
  const displayRod1 = new DisplayLine(this.simList1.getConcreteLine('rod'));
  displayRod1.setColor('#39c');
  displayRod1.setThickness(3);
  this.displayList.add(displayRod1);

  this.simList2 = new SimList();
  this.simList2.addObserver(this);
  this.sim2 = new ReactionPendulumSim(this.pendulumLength, this.radius, this.startAngle,
      'SIM_2', this.simList2);
  this.sim2.setMass(this.sim1.getMass());
  this.sim2.setGravity(this.sim1.getGravity());
  this.sim2.setDamping(0);
  this.terminal.setAfterEval(() => {
      this.sim1.modifyObjects();
      this.sim2.modifyObjects();
    });
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim2, (_evt: SubjectEvent) => this.sim2.modifyObjects(),
      'modifyObjects after parameter or variable change');

  this.simCtrl = new SimController(simCanvas, /*eventHandler=*/null);
  this.axes = CommonControls.makeAxes(this.simView, /*bottomLeft=*/true);
  this.advance1 = new SimpleAdvance(this.sim1);
  this.advance2  = new SimpleAdvance(this.sim2);
  this.simRun = new SimRunner(this.advance1);
  this.simRun.addStrategy(this.advance2);
  this.simRun.addCanvas(simCanvas);
  this.clock = this.simRun.getClock();

  let pb: ParameterBoolean;
  let pn: ParameterNumber;

  // ********* simulation controls  *************
  this.addControl(CommonControls.makePlaybackControls(this.simRun));

  this.addParameter(pn = new ParameterNumber(this, ReactionPendulumSim.en.START_ANGLE,
      ReactionPendulumSim.i18n.START_ANGLE,
      () => this.getStartAngle(), a => this.setStartAngle(a)));
  this.addControl(new NumericControl(pn));
  this.addParameter(pn = new ParameterNumber(this, ReactionPendulumSim.en.LENGTH,
      ReactionPendulumSim.i18n.LENGTH,
      () => this.getLength(), a => this.setLength(a)));
  this.addControl(new NumericControl(pn));
  this.addParameter(pn = new ParameterNumber(this, ReactionPendulumSim.en.RADIUS,
      ReactionPendulumSim.i18n.RADIUS,
      () => this.getRadius(), a => this.setRadius(a)));
  this.addControl(new NumericControl(pn));
  this.addParameter(pn = new ParameterNumber(this, ReactionPendulumApp.en.SEPARATION,
      ReactionPendulumApp.i18n.SEPARATION,
      () => this.getSeparation(), a => this.setSeparation(a)));
  this.addControl(new SliderControl(pn, 0, 2, /*multiply=*/false));
  pn = this.sim1.getParameterNumber(PendulumSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.001, 10, /*multiply=*/true));
  pn = this.sim1.getParameterNumber(PendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  this.energyGraph1 = new EnergyBarGraph(this.sim1);
  this.energyGraph1.potentialColor = '#039';
  this.energyGraph1.translationColor = '#06c';
  this.energyGraph1.rotationColor = '#6cf';
  this.showEnergyParam1 = CommonControls.makeShowEnergyParam(this.energyGraph1,
      this.statusView, this);
  this.addControl(new CheckBoxControl(this.showEnergyParam1));

  this.energyGraph2 = new EnergyBarGraph(this.sim2);
  this.energyGraph2.potentialColor = '#903';
  this.energyGraph2.translationColor = '#f33';
  this.energyGraph2.rotationColor = '#f99';
  this.energyGraph2.setPosition(new Vector(0, 6));
  this.showEnergyParam2 = CommonControls.makeShowEnergyParam(this.energyGraph2,
      this.statusView, this, ReactionPendulumApp.en.SHOW_ENERGY_2,
      ReactionPendulumApp.i18n.SHOW_ENERGY_2);
  this.addControl(new CheckBoxControl(this.showEnergyParam2));

  this.displayClock = new DisplayClock(() => this.sim1.getTime(),
      () => this.clock.getRealTime(), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
  pb = CommonControls.makeShowClockParam(this.displayClock, this.statusView, this);
  this.addControl(new CheckBoxControl(pb));

  const panzoom_simview = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true, () => this.simView.setSimRect(this.simRect));
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

  /** translate variable index of sim1 to equivalent variable of sim2 */
  const translate = (v1: number) => {
    // sim1: PendulumSim
    //  0       1       2    3        4   5   6
    // angle, angle', time, angle'', ke, pe, te
    //
    // sim2: ReactionPendulumSim
    // 0  1   2  3     4      5       6    7   8   9
    // x, x', y, y', angle, angle', time, ke, pe, te
    switch (v1) {
      case 0: return 4; // angle
      case 1: return 5; // angle velocity
      case 2: return 6; // time
      case 3: return -1; // angle accel
      case 4: return 7; // kinetic energy
      case 5: return 8; // potential energy
      case 6: return 9; // total energy
      default: throw '';
    }
  };

  const line1 = new GraphLine('GRAPH_LINE_1', va1);
  line1.setXVariable(0);
  line1.setYVariable(1);
  line1.setColor('blue');
  line1.setDrawingMode(DrawingMode.LINES);

  const va2 = this.sim2.getVarsList();
  const line2 = new GraphLine('GRAPH_LINE_2', va2);
  line2.setXVariable(translate(0));
  line2.setYVariable(translate(1));
  line2.setColor('red');
  line2.setDrawingMode(DrawingMode.LINES);

  // keep line1's X and Y variable in sync with line2
  const paramY1 = line1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  const paramX1 = line1.getParameterNumber(GraphLine.en.X_VARIABLE);
  new GenericObserver(line1, (evt: SubjectEvent) => {
    if (evt == paramY1) {
      line2.setYVariable(translate(paramY1.getValue()));
    } else if (evt == paramX1) {
      line2.setXVariable(translate(paramX1.getValue()));
    }
  }, 'keep line1\'s X and Y variable in sync with line2');

  this.graph = new CompareGraph(line1, line2,
      this.layout.getGraphCanvas(),
      this.layout.getGraphControls(), this.layout.getGraphDiv(), this.simRun);

  const timeLine1 = new GraphLine('TIME_LINE_1', va1);
  timeLine1.setYVariable(0);
  timeLine1.setColor('blue');
  timeLine1.setDrawingMode(DrawingMode.LINES);
  const timeLine2 = new GraphLine('TIME_LINE_2', va2);
  timeLine2.setYVariable(translate(0));
  timeLine2.setColor('red');
  timeLine2.setDrawingMode(DrawingMode.LINES);
  // keep timeLine2's Y variable in sync with timeLine1
  const timeParamY1 = timeLine1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  new GenericObserver(timeLine1, (evt: SubjectEvent) => {
    if (evt == timeParamY1) {
      timeLine2.setYVariable(translate(timeParamY1.getValue()));
    }
  }, 'keep timeLine2\'s Y variable in sync with timeLine1');
  this.timeGraph = new CompareTimeGraph(timeLine1, timeLine2,
      this.layout.getTimeGraphCanvas(),
      this.layout.getTimeGraphControls(), this.layout.getTimeGraphDiv(), this.simRun);

  // synchronize sim2 parameters to match parameters of sim1
  new GenericObserver(this.sim1, (evt: SubjectEvent) => {
    if (evt instanceof ParameterNumber) {
      if (evt.nameEquals(PendulumSim.en.GRAVITY)) {
        this.sim2.setGravity(evt.getValue());
      } else if (evt.nameEquals(PendulumSim.en.MASS)) {
        this.sim2.setMass(evt.getValue());
      }
    } else if (evt.nameEquals('RESET')) {
      this.sim2.reset();
    }
  }, 'synchronize sim2 parameters to match parameters of sim1');

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
  return 'ReactionPendulumApp';
};

/** Add the control to the set of simulation controls.
* @param control
*/
addControl(control: LabControl): void {
  this.layout.addControl(control);
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.simList2) {
    const obj = event.getValue() as SimObject;
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      if (this.displayList.find(obj)) {
        // we already have a DisplayObject for this SimObject, don't add a new one.
        return;
      }
      if (obj instanceof Polygon) {
        const d = new DisplayShape(obj);
        d.setDrawCenterOfMass(true);
        d.setFillStyle('#f66');
        d.setZIndex(-1);
        this.displayList.add(d);
      } else if (obj instanceof ConcreteLine) {
        const dl = new DisplayLine(obj);
        dl.setThickness(4);
        if (obj.nameEquals('rod')) {
          dl.setColor('#f99');
        } else {
          dl.setColor('green');
          dl.setLineDash([3, 5]);
        }
        this.displayList.add(dl);
      }
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      const d = this.displayList.find(obj);
      if (d) {
        this.displayList.remove(d);
      }
    }
  }
};

/**
*/
reset(): void {
  this.sim2.config(this.pendulumLength, this.radius, this.startAngle);
  this.sim1.setLength(this.classicLength());
  this.sim1.getVarsList().setValue(0, this.startAngle);
  this.sim1.getVarsList().setValue(1, 0); // velocity
  this.sim1.getVarsList().setValue(2, 0); // time
  this.sim1.saveInitialState();
  this.simRun.reset();
};

/**
*/
getStartAngle(): number {
  return this.startAngle;
};

/**
* @param value
*/
setStartAngle(value: number) {
  if (this.startAngle != value) {
    this.startAngle = value;
    this.reset();
    this.broadcastParameter(ReactionPendulumSim.en.START_ANGLE);
  }
};

/** Returns equivalent length for classic pendulum when ReactionPendulumSim
* has given length, depends on the length and radius of ReactionPendulumSim.
* @return equivalent length for classic pendulum
*/
classicLength(): number {
  // reaction pendulum with radius r, length h is equivalent to
  // classic pendulum with length = h + r^2 / (2 h)
  return this.pendulumLength + this.radius*this.radius / (2 * this.pendulumLength);
};

/** Return length of ReactionPendulumSim rod
@return length of ReactionPendulumSim rod
*/
getLength(): number {
  return this.pendulumLength;
};

/** Set length of ReactionPendulumSim rod, and set length of classic pendulum
to equivalent length.  See {@link ReactionPendulumApp.classicLength}.
@param value length of ReactionPendulumSim rod
*/
setLength(value: number) {
  if (this.pendulumLength != value) {
    this.pendulumLength = value;
    this.reset();
    this.broadcastParameter(ReactionPendulumSim.en.LENGTH);
  }
};

/** Return radius of ReactionPendulumSim bob
@return radius of ReactionPendulumSim bob
*/
getRadius(): number {
  return this.radius;
};

/** Set radius of ReactionPendulumSim bob, and set length of classic pendulum
to according equivalent length.  See {@link ReactionPendulumApp.classicLength}.
@param value radius of ReactionPendulumSim bob
*/
setRadius(value: number) {
  if (this.radius != value) {
    this.radius = value;
    this.reset();
    this.broadcastParameter(ReactionPendulumSim.en.RADIUS);
  }
};

/** Returns the distance between the fixed pivot points of the two pendulums.
* @return distance between the fixed pivot points
*/
getSeparation(): number {
  return this.separation;
};

/** Sets the distance between the fixed pivot points of the two pendulums.
* @param value distance between the fixed pivot points
*/
setSeparation(value: number) {
  if (this.separation != value) {
    this.separation = value;
    this.sim1.setPivot(new Vector(value, 0));
    this.broadcastParameter(ReactionPendulumApp.en.SEPARATION);
  }
};

/** Define short-cut name replacement rules.  For example 'sim2' is replaced
* by 'app.sim2' when `myName` is 'app'.
* @param myName  the name of this object, valid in global Javascript context.
*/
defineNames(myName: string): void {
  this.terminal.addRegex('advance2|advance1|axes|clock|displayList'
      +'|displayClock|energyGraph|graph|layout|easyScript|sim2|sim1'
      +'|simCtrl|simList2|simList1|simRun|simView|statusView|terminal|timeGraph',
      myName+'.');
  this.terminal.addRegex('simCanvas',
      myName+'.layout.');
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

static readonly en: i18n_strings = {
  SEPARATION: 'separation',
  SHOW_ENERGY_2: 'show energy 2'
};

static readonly de_strings: i18n_strings = {
  SEPARATION: 'Abstand',
  SHOW_ENERGY_2: 'Energieanzeige 2'
};

static readonly i18n = Util.LOCALE === 'de' ? ReactionPendulumApp.de_strings : ReactionPendulumApp.en;

} // end class

type i18n_strings = {
  SEPARATION: string,
  SHOW_ENERGY_2: string
};
Util.defineGlobal('sims$pendulum$ReactionPendulumApp', ReactionPendulumApp);
