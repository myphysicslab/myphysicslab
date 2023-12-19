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
import { AffineTransform } from '../../lab/util/AffineTransform.js';
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { Clock } from '../../lab/util/Clock.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayAxes } from '../../lab/graph/DisplayAxes.js';
import { DisplayClock } from '../../lab/view/DisplayClock.js';
import { DisplayList } from '../../lab/view/DisplayList.js';
import { DisplayPath } from '../../lab/view/DisplayPath.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplayText } from '../../lab/view/DisplayText.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DrawingStyle } from '../../lab/view/DrawingStyle.js';
import { EasyScriptParser } from '../../lab/util/EasyScriptParser.js';
import { ElementIDs } from '../common/Layout.js';
import { EnergyBarGraph } from '../../lab/graph/EnergyBarGraph.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { FlatShape, TrianglePulseShape, SquarePulseShape, SinePulseShape, HalfSinePulseShape, MultiSineShape } from './StringShapes.js';
import { GenericEvent } from '../../lab/util/Observe.js';
import { GenericMemo } from '../../lab/util/Memo.js';
import { GenericObserver } from '../../lab/util/Observe.js';
import { HorizAlign } from '../../lab/view/HorizAlign.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { LabelControl } from '../../lab/controls/LabelControl.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterBoolean } from '../../lab/util/Observe.js';
import { ParameterString } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { ShapeType } from '../../lab/model/PointMass.js';
import { SimController } from '../../lab/app/SimController.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { SimView } from '../../lab/view/SimView.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { StringAdvance } from './StringAdvance.js';
import { StringShape } from './StringShape.js';
import { StringSim, StringPath } from './StringSim.js';
import { Subject } from '../../lab/util/Observe.js';
import { TabLayout } from '../common/TabLayout.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { VerticalAlign } from '../../lab/view/VerticalAlign.js';

/** Displays the {@link StringSim} simulation.

Creates instance objects such as the simulation and display objects;
defines regular expressions for easy Terminal scripting of these objects using short
names instead of fully qualified property names.

The constructor takes an argument that specifies the names of the HTML elementId's to
look for in the HTML document; these elements are where the user interface of the
simulation is created. This allows for having two separate simulation apps running
concurrently on a single page.

*/
export class StringApp extends AbstractSubject implements Subject {
  layout: TabLayout;
  terminal: Terminal;
  shapes: StringShape[];
  sim: StringSim;
  simList: SimList;
  simCtrl: SimController;
  advance: StringAdvance;
  simRect: DoubleRect;
  simView: SimView;
  displayList: DisplayList;
  statusView: SimView;
  axes: DisplayAxes;
  simRun: SimRunner;
  clock: Clock;
  blockMass: PointMass;
  block: DisplayShape;
  blockText: DisplayText;
  shadow: PointMass;
  showShadow: DisplayShape;
  easyScript: EasyScriptParser;
  stability: number = -1;
  stabilityText: DisplayText;
  path: StringPath;
  displayPath: DisplayPath;
  energyGraph: EnergyBarGraph;
  showEnergyParam: ParameterBoolean;
  displayClock: DisplayClock;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  super('APP');
  this.layout = new TabLayout(elem_ids);
  // keep reference to terminal to make for shorter 'expanded' names
  this.terminal = this.layout.getTerminal();
  const sim_controls = this.layout.getSimControls();
  const simCanvas = this.layout.getSimCanvas();

  const length = 13.5;
  
  this.shapes = [
      new FlatShape(length),
      new TrianglePulseShape(length),
      new SquarePulseShape(length),
      new SinePulseShape(length),
      new HalfSinePulseShape(length),
      new MultiSineShape(length)
    ];
  this.sim = new StringSim(this.shapes[1]);
  this.terminal.setAfterEval( () => this.sim.modifyObjects() );
  this.simList = this.sim.getSimList();
  this.simCtrl = new SimController(simCanvas, /*eventHandler=*/this.sim);
  this.advance  = new StringAdvance(this.sim);
  this.simRect = new DoubleRect(-1, -0.25, 14, 0.25);
  this.simView = new SimView('simView', this.simRect);
  this.displayList = this.simView.getDisplayList();
  this.simView.setHorizAlign(HorizAlign.FULL);
  this.simView.setVerticalAlign(VerticalAlign.FULL);
  simCanvas.addView(this.simView);
  this.statusView = new SimView('status', new DoubleRect(-10, -10, 10, 10));
  simCanvas.addView(this.statusView);
  this.axes = CommonControls.makeAxes(this.simView, /*bottomLeft=*/true);
  this.simRun = new SimRunner(this.advance);
  this.simRun.addCanvas(simCanvas);
  this.clock = this.simRun.getClock();

  // Note: if you set the strokeStyle, the line is distorted because the
  // aspect ratio of the SimView is around 1:30 (width to height).
  this.blockMass = this.simList.getPointMass('block');
  this.block = new DisplayShape(this.blockMass);
  this.block.setFillStyle('rgba(0,0,255,0.2)');
  this.displayList.add(this.block);

  // Because the SimView is so distorted (aspect ratio is like 1:30), we set
  // up a DisplayText in StatusView that tracks position of the block.
  this.blockText = new DisplayText('drag');
  this.blockText.setFillStyle('rgba(255,255,255,0.7)');
  this.blockText.setTextAlign('center');
  this.statusView.getDisplayList().add(this.blockText);
  this.statusView.addMemo(new GenericMemo( () => {
    const map1 = this.simView.getCoordMap();
    const map2 = this.statusView.getCoordMap();
    const loc = map1.simToScreen(this.blockMass.getPosition());
    this.blockText.setPosition(map2.screenToSim(loc));
  }, 'blockText follows blockMass'));

  // Because the SimView is so distorted (aspect ratio is like 1:30), we set
  // up a PointMass and DisplayShape to follow the block. This allows us to
  // stroke the shape with a uniform size of line.
  // (This is mainly a demo and test of this capability).
  this.shadow = PointMass.makeSquare(1, 'shadow');
  this.showShadow = new DisplayShape(this.shadow);
  this.showShadow.setFillStyle('');
  this.showShadow.setStrokeStyle('gray');
  this.statusView.getDisplayList().add(this.showShadow);
  this.statusView.addMemo(new GenericMemo( () => {
    const map1 = this.simView.getCoordMap();
    const map2 = this.statusView.getCoordMap();
    // set width and height of shadow to match blockMass
    const w = this.blockMass.getWidth();
    const w2 = w*map1.getScaleX()/map2.getScaleX();
    this.shadow.setWidth(w2);
    const h = this.blockMass.getHeight();
    const h2 = h*map1.getScaleY()/map2.getScaleY();
    this.shadow.setHeight(h2);
    // set position of shadow to match blockMass
    const loc = map1.simToScreen(this.blockMass.getPosition());
    this.shadow.setPosition(map2.screenToSim(loc));
  }, 'shadow outline follows blockMass'));

  // Show the stability condition as text
  this.stabilityText = new DisplayText();
  this.stabilityText.setPosition(new Vector(-5, -7));
  this.statusView.getDisplayList().add(this.stabilityText);
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim, _evt => {
    this.sim.modifyObjects();
    const s = this.sim.getStability();
    if (this.stability != s) {
      this.stabilityText.setText('stability = '+Util.NF5(s));
      this.stability = s;
      this.stabilityText.setFillStyle(s < 1 ? 'rgb(160,160,160)' : 'red');
    }
  }, 'modifyObjects after parameter or variable change');
  // broadcast an event to get the stability to appear
  this.sim.broadcast(new GenericEvent(this.sim, /*name=*/'event'));

  this.path = new StringPath(this.sim);
  this.displayPath = new DisplayPath();
  this.displayPath.setScreenRect(this.simView.getScreenRect());
  // offscreen buffer is not useful because StringPath is always changing
  this.displayPath.setUseBuffer(false);
  this.displayPath.setZIndex(-1);
  this.displayList.add(this.displayPath);
  this.displayPath.addPath(this.path, DrawingStyle.dotStyle('red', /*dotSize=*/2));

  this.addControl(CommonControls.makePlaybackControls(this.simRun));

  // make array of shape name strings for the SHAPE parameter
  const sn = [];
  const snl = [];
  for (let i=0; i<this.shapes.length; i++) {
    sn.push(this.shapes[i].getName(/*localized=*/false));
    snl.push(this.shapes[i].getName(/*localized=*/true));
  }
  const ps = new ParameterString(this, StringSim.en.SHAPE,
      StringSim.i18n.SHAPE,
      () => this.getShape(), a => this.setShape(a), snl, sn);
  this.addParameter(ps);
  this.addControl(new ChoiceControl(ps));

  let pn = this.sim.getParameterNumber(StringSim.en.NUM_POINTS);
  this.addControl(new NumericControl(pn));
  pn = this.sim.getParameterNumber(StringSim.en.DENSITY);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));
  pn = this.sim.getParameterNumber(StringSim.en.TENSION);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));
  pn = this.sim.getParameterNumber(StringSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));
  pn = this.sim.getParameterNumber(StringSim.en.TIME_STEP);
  let nc = new NumericControl(pn);
  nc.setDecimalPlaces(7);
  this.addControl(nc);
  pn = this.clock.getParameterNumber(Clock.en.TIME_RATE);
  this.addControl(new NumericControl(pn));
  pn = this.sim.getParameterNumber(EnergyInfo.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));
  // show compile time so user can ensure loading latest version
  // @ts-ignore
  if (0 == 1 && Util.DEBUG) {
    this.addControl(new LabelControl('compiled '+Util.COMPILE_TIME));
  }

  this.energyGraph = new EnergyBarGraph(this.sim);
  this.showEnergyParam = CommonControls.makeShowEnergyParam(this.energyGraph,
      this.statusView, this);
  this.addControl(new CheckBoxControl(this.showEnergyParam));

  this.displayClock = new DisplayClock( () => this.sim.getTime(),
      () => this.clock.getRealTime(), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
  let pb = CommonControls.makeShowClockParam(this.displayClock, this.statusView, this);
  this.addControl(new CheckBoxControl(pb));

  const panzoom = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true,
      () => this.simView.setSimRect(this.simRect) );
  this.layout.getSimDiv().appendChild(panzoom);
  pb = CommonControls.makeShowPanZoomParam(panzoom, this);
  pb.setValue(false);
  this.addControl(new CheckBoxControl(pb));
  const bm = CommonControls.makeBackgroundMenu(this.layout.getSimCanvas());
  this.addControl(bm);

  // keep the SimRunner's timeStep to be same as the Simulation's timeStep
  new GenericObserver(this.sim, evt => {
    if (evt.nameEquals(StringSim.en.TIME_STEP)) {
      this.simRun.setTimeStep(this.sim.getTimeStep());
    }
  }, 'keep SimRunner\'s timeStep same as Simulation\'s');

  let subjects: Subject[] = [
    this,
    this.sim,
    this.simRun,
    this.clock,
    this.simView,
    this.statusView
  ];
  subjects = subjects.concat(this.layout.getSubjects());
  this.easyScript = CommonControls.makeEasyScript(subjects, [], this.simRun,
      this.terminal);
  this.addControl(CommonControls.makeURLScriptButton(this.easyScript, this.simRun));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', sim: '+this.sim.toStringShort()
      +', simRun: '+this.simRun.toStringShort()
      +', simView: '+this.simView.toStringShort()
      +', statusView: '+this.statusView.toStringShort()
      +', terminal: '+this.terminal
      +', path: '+this.path
      +', displayPath: '+this.displayPath
      +', shapes: [ '+this.shapes + ']'
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'StringApp';
};

/** Returns name of initial string shape.
* @return name of initial string shape.
*/
getShape(): string {
  return this.sim.getShape().getName();
}

/** Sets the initial string shape.
* @param value  name of initial string shape
*/
setShape(value: string) {
  for (let i=0; i<this.shapes.length; i++) {
    const shape = this.shapes[i];
    if (shape.getName() == value) {
      this.sim.setShape(shape);
      this.broadcastParameter(StringSim.en.SHAPE);
      return;
    }
  }
  throw 'unknown shape '+value;
}

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'app.sim' when `myName` is 'app'.
* @param myName  the name of this object, valid in global Javascript context.
*/
defineNames(myName: string): void {
  this.terminal.addRegex('advance|axes|block|blockMass|clock|displayClock|energyGraph'
      +'|path|displayPath|displayList'
      +'|layout|sim|simCtrl|simList|simRun|simView|statusView|terminal|easyScript',
      myName+'.');
  this.terminal.addRegex('simCanvas',
      myName+'.layout.');
};

/** Add the control to the set of simulation controls.
* @param control
* @return the control that was passed in
*/
addControl(control: LabControl): LabControl {
  return this.layout.addControl(control);
};

/** Set up the application.
*/
setup(): void {
  this.clock.resume();
  this.terminal.parseURL();
  this.sim.saveInitialState();
  this.sim.modifyObjects();
};

/** Start the application running.
*/
start(): void {
  this.simRun.startFiring();
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

} // end class
Util.defineGlobal('sims$pde$StringApp', StringApp);
