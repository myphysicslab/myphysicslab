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
import { CommonControls } from './CommonControls.js';
import { DisplayAxes } from '../../lab/graph/DisplayAxes.js';
import { DisplayGraph } from '../../lab/graph/DisplayGraph.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { GenericEvent, GenericObserver, ParameterBoolean, ParameterNumber,
    ParameterString, Subject, SubjectEvent, SubjectList }
    from '../../lab/util/Observe.js';
import { GenericMemo } from '../../lab/util/Memo.js';
import { Graph } from './Graph.js';
import { GraphLine } from '../../lab/graph/GraphLine.js';
import { HorizAlign } from '../../lab/view/HorizAlign.js';
import { LabCanvas } from '../../lab/view/LabCanvas.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { SimController } from '../../lab/app/SimController.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { SimView } from '../../lab/view/SimView.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { VerticalAlign } from '../../lab/view/VerticalAlign.js';

/** Creates a single graph showing several independent GraphLines, and with a horizontal
time axis. Because there is a single SimView and DisplayGraph, all the GraphLines are
plotted in the same graph coordinates. The horizontal variable can be changed to
something other than time. Creates an AutoScale that ensures all of the GraphLines are
visible. Creates several controls to modify the graph.
*/
export class TimeGraph1 extends AbstractSubject implements Graph, Subject, SubjectList {
  canvas: LabCanvas;
  view: SimView;
  axes: DisplayAxes;
  line1: GraphLine;
  autoScale: AutoScale;
  displayGraph: DisplayGraph;
  line2: GraphLine;
  line3: GraphLine;
  controls_: LabControl[] = [];
  div_controls: HTMLDivElement;
  line1Obs: GenericObserver;
  graphCtrl: SimController;

/**
* @param varsList the VarsList to collect data from
* @param graphCanvas the LabCanvas where the graph should appear
* @param div_controls the HTML div where controls should be added
* @param div_graph the HTML div where the graphCanvas is located
* @param simRun the SimRunner controlling the overall app
* @param color1 color of line 1
* @param color2 color of line 2
* @param color3 color of line 3
*/
constructor(varsList: VarsList, graphCanvas: LabCanvas, div_controls: HTMLDivElement,
    div_graph: HTMLDivElement, simRun: SimRunner,
    color1?: string, color2?: string, color3?: string) {
  super('TIME_GRAPH_LAYOUT');
  color1 = color1 ?? 'lime';
  color2 = color2 ?? 'red';
  color3 = color3 ?? 'blue';
  this.canvas = graphCanvas;
  simRun.addCanvas(graphCanvas);
  this.view = new SimView('TIME_GRAPH_VIEW', new DoubleRect(0, 0, 1, 1));
  this.view.setHorizAlign(HorizAlign.FULL);
  this.view.setVerticalAlign(VerticalAlign.FULL);
  graphCanvas.addView(this.view);
  this.axes = CommonControls.makeAxes(this.view);
  this.line1 = new GraphLine('TIME_GRAPH_LINE_1', varsList);
  this.line1.setColor(color1);
  this.view.addMemo(this.line1);
  this.autoScale = new AutoScale('TIME_GRAPH_AUTO_SCALE', this.line1, this.view);
  this.autoScale.extraMargin = 0.05;
  this.displayGraph = new DisplayGraph(this.line1);
  this.displayGraph.setScreenRect(this.view.getScreenRect());
  this.view.getDisplayList().prepend(this.displayGraph);
  // inform displayGraph when the screen rect changes.
  new GenericObserver(this.view, evt => {
      if (evt.nameEquals(SimView.SCREEN_RECT_CHANGED)) {
        this.displayGraph.setScreenRect(this.view.getScreenRect());
      }
    }, 'resize DisplayGraph');

  const timeIdx = this.line1.getVarsList().timeIndex();
  this.line1.setXVariable(timeIdx);
  this.line1.setYVariable(0);

  this.line2 = new GraphLine('TIME_GRAPH_LINE_2', varsList);
  this.autoScale.addGraphLine(this.line2);
  this.view.addMemo(this.line2);
  this.line2.setXVariable(timeIdx);
  this.line2.setYVariable(1);
  this.line2.setColor(color2);
  this.displayGraph.addGraphLine(this.line2);

  this.line3 = new GraphLine('TIME_GRAPH_LINE_3', varsList);
  this.autoScale.addGraphLine(this.line3);
  this.view.addMemo(this.line3);
  this.line3.setXVariable(timeIdx);
  this.line3.setYVariable(-1);
  this.line3.setColor(color3);
  this.displayGraph.addGraphLine(this.line3);

  this.div_controls = div_controls;

  let pn = this.line1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  this.addControl(new ChoiceControl(pn, color1));
  pn = this.line2.getParameterNumber(GraphLine.en.Y_VARIABLE);
  this.addControl(new ChoiceControl(pn, color2));
  pn = this.line3.getParameterNumber(GraphLine.en.Y_VARIABLE);
  this.addControl(new ChoiceControl(pn, color3));
  pn = this.line1.getParameterNumber(GraphLine.en.X_VARIABLE);
  this.addControl(new ChoiceControl(pn, 'X:'));
  pn = this.autoScale.getParameterNumber(AutoScale.en.TIME_WINDOW)
  this.addControl(new NumericControl(pn));
  const bc = new ButtonControl(GraphLine.i18n.CLEAR_GRAPH,
      () => {
        this.line1.reset();
        this.line2.reset();
        this.line3.reset();
      }
    );
  this.addControl(bc);

  /* GenericObserver ensures line2, line3 have same X variable as line1. */
  this.line1Obs = new GenericObserver(this.line1, 
    _evt => {
      this.line2.setXVariable(this.line1.getXVariable());
      this.line3.setXVariable(this.line1.getXVariable());
    }, 'ensure line2, line3 have same X variable as line1');
  /* SimController which pans the graph with no modifier keys pressed. */
  this.graphCtrl = new SimController(graphCanvas, /*eventHandler=*/null,
      /*panModifier=*/{alt:false, control:false, meta:false, shift:false});

  // Turn off scale-together so that zoom controls only work on vertical axis.
  // Use TIME_WINDOW control for changing horizontal axis, separately.
  this.view.setScaleTogether(false);

  // after clicking the "rewind" button, the timeGraph should go to time zero.
  new GenericObserver(simRun, evt => {
    if (evt.nameEquals(SimRunner.RESET)) {
      const vw = this.view.getWidth();
      this.view.setCenterX(vw/2);
      this.autoScale.setActive(true);
    }
  }, 'TimeGraph1: go to time zero on reset');

  // Use the off-screen buffer only when "time-scrolling" is not happening
  // (i.e. when time less than the time window) because the auto-scale
  // causes time graph to redraw every frame when "time-scrolling".
  simRun.addMemo(new GenericMemo( () => {
    if (this.line1.getXVariable() == timeIdx) {
      const t = simRun.getClock().getTime();
      const tw = this.autoScale.getTimeWindow();
      this.displayGraph.setUseBuffer(t < tw);
    } else {
      this.displayGraph.setUseBuffer(true);
    }
  }, 'time graph: use off-screen buffer when not time-scrolling'));

  const panzoom = CommonControls.makePanZoomControls(this.view, /*overlay=*/true,
      /*resetFunc=*/ () => this.autoScale.setActive(true) );
  div_graph.appendChild(panzoom);
  const pb = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.addControl(new CheckBoxControl(pb));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', canvas: '+this.canvas.toStringShort()
      +', view: '+this.view.toStringShort()
      +', line1: '+this.line1.toStringShort()
      +', line2: '+this.line2.toStringShort()
      +', line3: '+this.line3.toStringShort()
      +', axes: '+this.axes.toStringShort()
      +', autoScale: '+this.autoScale.toStringShort()
      +', displayGraph: '+this.displayGraph.toStringShort()
      +', graphCtrl: '+this.graphCtrl.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'TimeGraph1';
};

/** Add the control to the set of simulation controls.
* @param control
* @return the control that was passed in
*/
addControl(control: LabControl): LabControl {
  const element = control.getElement();
  element.style.display = 'block';
  this.div_controls.appendChild(element);
  this.controls_.push(control);
  return control;
};

/** @inheritDoc */
getSubjects(): Subject[] {
  return [ this, this.line1, this.line2, this.line3, this.view, this.autoScale ];
};

} // end class
Util.defineGlobal('sims$common$TimeGraph1', TimeGraph1);
