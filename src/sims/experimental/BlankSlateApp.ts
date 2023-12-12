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

import { AbstractSubject } from "../../lab/util/AbstractSubject.js"
import { AutoScale } from "../../lab/graph/AutoScale.js";
import { ChoiceControl, ChoiceControlBase } from "../../lab/controls/ChoiceControl.js";
import { CheckBoxControl, CheckBoxControlBase } from "../../lab/controls/CheckBoxControl.js";
import { ButtonControl } from "../../lab/controls/ButtonControl.js"
import { NumericControl, NumericControlBase } from "../../lab/controls/NumericControl.js"
import { CommonControls } from "../../sims/common/CommonControls.js"
import { DisplayAxes } from "../../lab/graph/DisplayAxes.js"
import { DisplayClock } from "../../lab/view/DisplayClock.js"
import { DisplayGraph } from '../../lab/graph/DisplayGraph.js'
import { DisplayLine } from "../../lab/view/DisplayLine.js"
import { DisplayArc } from "../../lab/view/DisplayArc.js"
import { DisplayList } from "../../lab/view/DisplayList.js"
import { DisplayPath } from "../../lab/view/DisplayPath.js"
import { DisplayShape } from "../../lab/view/DisplayShape.js"
import { DisplaySpring } from "../../lab/view/DisplaySpring.js"
import { DisplayText } from "../../lab/view/DisplayText.js"
import { DoubleRect } from "../../lab/util/DoubleRect.js"
import { EnergyBarGraph } from "../../lab/graph/EnergyBarGraph.js"
import { GenericObserver, Subject } from "../../lab/util/Observe.js"
import { GraphLine, GraphPoint, GraphStyle } from '../../lab/graph/GraphLine.js'
import { CoordMap } from "../../lab/view/CoordMap.js"
import { HorizAlign } from "../../lab/view/HorizAlign.js"
import { VerticalAlign } from "../../lab/view/VerticalAlign.js"
import { LabCanvas } from "../../lab/view/LabCanvas.js"
import { LabControl } from "../../lab/controls/LabControl.js"
import { NumericalPath } from "../../lab/model/NumericalPath.js"
import { ParameterBoolean } from "../../lab/util/Observe.js"
import { PointMass } from "../../lab/model/PointMass.js"
import { ScreenRect } from "../../lab/view/ScreenRect.js"
import { SimpleAdvance } from "../../lab/model/SimpleAdvance.js"
import { SimController } from "../../lab/app/SimController.js"
import { SimRunner } from "../../lab/app/SimRunner.js"
import { SimView } from "../../lab/view/SimView.js"
import { Spring } from "../../lab/model/Spring.js"
import { Terminal } from "../../lab/util/Terminal.js"
import { Timer } from "../../lab/util/Timer.js"
import { Util } from "../../lab/util/Util.js"
import { Vector } from "../../lab/util/Vector.js"
import { ClockTask } from "../../lab/util/Clock.js"
import { GenericMemo } from "../../lab/util/Memo.js"
import { ModifiedEuler } from "../../lab/model/ModifiedEuler.js"
import { PendulumSim } from "../pendulum/PendulumSim.js"
import { SingleSpringSim } from "../springs/SingleSpringSim.js"
import { RollerSingleSim } from "../roller/RollerSingleSim.js"
import { CirclePath } from "../roller/CirclePath.js"
import { CustomPath } from "../roller/CustomPath.js"
import { FlatPath } from "../roller/FlatPath.js"
import { OvalPath } from "../roller/OvalPath.js"
import { RigidBodyObserver } from "../engine2D/RigidBodyObserver.js";
import { MoleculeSim } from "../springs/MoleculeSim.js";
import { SpringNonLinear1 } from '../springs/SpringNonLinear1.js';
import { SpringNonLinear2 } from '../springs/SpringNonLinear2.js';

/**  Names of HTML div, form, and input element's to search for by using
* `document.getElementById()`.
*/
export type ElementIDs = {
  sim_canvas: string;
  sim_controls: string;
  term_output: string;
  term_input: string;
  images_dir: string;
  graph_div: string;
}

/** BlankSlateApp has a LabCanvas and Terminal, and let's you experiment building
things with scripts.
*/
export class BlankSlateApp extends AbstractSubject implements Subject {
  private simCanvas: LabCanvas;
  private terminal: Terminal;
  private simRect: DoubleRect;
  private simView: SimView;
  private displayList: DisplayList;
  private timer: Timer;
  private simCtrl: SimController;
  private controlsDiv: HTMLDivElement;
  private simDiv: HTMLDivElement;
  private debug_layout: boolean = true;
  private z = { };

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  super('APP');
  Util.setImagesDir(elem_ids.images_dir);
  // div that will contain the canvas should be an HTMLElement or HTMLDivElement
  this.simDiv =
      Util.getElementById(elem_ids.sim_canvas) as HTMLDivElement;
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.simDiv.style.position = 'relative';
  // canvas should be HTMLCanvasElement
  const canvas = document.createElement('canvas');
  this.simCanvas = new LabCanvas(canvas, 'canvas1');
  this.simCanvas.setSize(800, 800);
  this.simDiv.appendChild(this.simCanvas.getCanvas());

  this.controlsDiv =
      Util.getElementById(elem_ids.sim_controls) as HTMLDivElement;
  this.controlsDiv.style.marginLeft = '10px';
  if (this.debug_layout) {
    this.controlsDiv.style.border = 'dashed 1px green';
  }

  const term_input =
      Util.getElementById(elem_ids.term_input) as HTMLInputElement;
  const term_output =
      Util.getElementById(elem_ids.term_output) as HTMLTextAreaElement;
  this.terminal = new Terminal(term_input, term_output);
  Terminal.stdRegex(this.terminal);

  this.simRect = new DoubleRect(-6, -6, 6, 6);
  this.simView = new SimView('simView', this.simRect);
  this.simCanvas.addView(this.simView);
  this.displayList = this.simView.getDisplayList();
  this.simCanvas.paint();
  this.simCtrl = new SimController(this.simCanvas);

  // make a callback which continuously redraws the canvas.
  // So that if anything changes (like pan-zoom) we see the effect.
  this.timer = new Timer();
  const callback = () => this.simCanvas.paint();
  this.timer.setCallBack(callback);
  this.timer.startFiring();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', simCanvas: '+this.simCanvas.toStringShort()
      +', simRect: '+this.simRect.toString()
      +', simView: '+this.simView.toStringShort()
      +', displayList: '+this.displayList.toStringShort()
      +', timer: '+this.timer.toString()
      +', simCtrl: '+this.simCtrl.toStringShort()
      +', terminal: '+this.terminal.toString()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'BlankSlateApp';
};

/** Define short-cut name replacement rules.  For example 'x' is replaced
* by 'myApp.x' when myName is 'myApp'.
* @param myName  the name of this object, valid in global Javascript context.
*/
defineNames(myName: string) {
  this.terminal.addRegex('z', myName+'.', /*addToVars=*/false, /*prepend=*/true);
  this.terminal.addRegex('simCanvas|terminal|axes|simCtrl|simView|displayList'
      +'|timer|controlsDiv|simDiv', myName+'.');
  this.terminal.addRegex('PendulumSim', 'sims$$pendulum$$', /*addToVars=*/false);
  this.terminal.addRegex('MoleculeSim|SingleSpringSim|SpringNonLinear1'
      +'|SpringNonLinear2', 'sims$$springs$$', /*addToVars=*/false);
  this.terminal.addRegex('RigidBodyObserver', 'sims$$engine2D$$', /*addToVars=*/false);
  this.terminal.addRegex('RollerSingleSim|CirclePath|CustomPath|FlatPath|OvalPath',
      'sims$$roller$$', /*addToVars=*/false);
  this.terminal.addRegex('CommonControls', 'sims$$common$$', /*addToVars=*/false);
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

/** Set up the application.
*/
setup(): void {
  this.terminal.parseURL();
};

/** Start the application running.
*/
start(): void {
};

/** Force classes to be bundled (by esbuild), so they can be used in Terminal
* scripts.
*/
static loadClass(): void {
  var f = AutoScale.toString;
  f = ButtonControl.toString;
  f = CheckBoxControl.toString;
  f = ChoiceControl.toString;
  f = DisplayArc.toString;
  f = DisplayAxes.toString;
  f = DisplayClock.toString;
  f = DisplayGraph.toString;
  f = DisplayLine.toString;
  f = DisplayPath.toString;
  f = DisplayShape.toString;
  f = DisplaySpring.toString;
  f = EnergyBarGraph.toString;
  f = GraphLine.toString;
  f = ModifiedEuler.toString;
  f = NumericalPath.toString;
  f = NumericControl.toString;
  f = PendulumSim.toString;
  f = RollerSingleSim.toString;
  f = SimController.toString;
  f = SimpleAdvance.toString;
  f = SimRunner.toString;
  f = SingleSpringSim.toString;
  f = Spring.toString;
  f = SpringNonLinear1.toString;
  f = SpringNonLinear2.toString;
  f = CirclePath.toString;
  f = CustomPath.toString;
  f = FlatPath.toString;
  f = OvalPath.toString;
  f = DisplayText.toString;
  f = RigidBodyObserver.toString;
  f = MoleculeSim.toString;
  var p = CommonControls.makePanZoomControls;
};

addControl(control: LabControl): void {
  const element = control.getElement();
  element.style.display = 'block';
  this.controlsDiv.appendChild(element);
};

} // end class
