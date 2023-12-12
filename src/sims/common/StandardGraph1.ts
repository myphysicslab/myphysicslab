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
import { DisplayList } from '../../lab/view/DisplayList.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { GenericEvent, GenericObserver, ParameterBoolean, ParameterNumber,
    ParameterString, Subject, SubjectEvent, SubjectList }
    from '../../lab/util/Observe.js';
import { GenericMemo } from '../../lab/util/Memo.js';
import { Graph } from './Graph.js';
import { GraphColorChoices, GraphColorValues } from '../../lab/graph/GraphColor.js';
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

/** Creates a graph with a single GraphLine. Creates a single SimView and DisplayGraph
to show the GraphLine. Adds the SimView to `graphCanvas`. Creates an AutoScale that
modifies the SimView to contain the GraphLine.
Creates several controls to modify the graph.
*/
export class StandardGraph1 extends AbstractSubject implements Graph, Subject, SubjectList {
  displayStyle: string;
  canvas: LabCanvas;
  view: SimView;
  displayList: DisplayList;
  line: GraphLine;
  axes: DisplayAxes;
  autoScale: AutoScale;
  displayGraph: DisplayGraph;
  controls_: LabControl[];
  div_controls: Element;
  /** SimController which pans the graph with no modifier keys pressed. */
  graphCtrl: SimController;

/**
* @param varsList the VarsList to collect data from
* @param graphCanvas the LabCanvas where the graph should appear
* @param div_controls the HTML div where controls should be added
* @param div_graph the HTML div where the graphCanvas is located
* @param simRun the SimRunner controlling the overall app
* @param displayStyle the CSS display style to use when adding controls
*/
constructor(varsList: VarsList, graphCanvas: LabCanvas, div_controls: HTMLDivElement,
    div_graph: HTMLDivElement, simRun: SimRunner, displayStyle?: string) {
  super('GRAPH_LAYOUT');

  this.displayStyle = displayStyle || 'block';
  this.canvas = graphCanvas;
  simRun.addCanvas(graphCanvas);

  this.view = new SimView('X_Y_GRAPH_VIEW', new DoubleRect(0, 0, 1, 1));
  this.view.setHorizAlign(HorizAlign.FULL);
  this.view.setVerticalAlign(VerticalAlign.FULL);
  graphCanvas.addView(this.view);
  this.displayList = this.view.getDisplayList();

  this.line = new GraphLine('X_Y_GRAPH_LINE', varsList);
  this.line.setXVariable(0);
  this.line.setYVariable(1);
  this.line.setColor('lime');
  this.view.addMemo(this.line);

  this.axes = CommonControls.makeAxes(this.view);
  const updateAxes = (evt: SubjectEvent) => {
    if (evt.nameEquals(GraphLine.en.X_VARIABLE)) {
      this.axes.setHorizName(this.line.getXVarName());
    }
    if (evt.nameEquals(GraphLine.en.Y_VARIABLE)) {
      this.axes.setVerticalName(this.line.getYVarName());
    }
  };
  new GenericObserver(this.line, updateAxes, 'update axes names');
  updateAxes(new GenericEvent(this.line, GraphLine.i18n.X_VARIABLE));

  this.autoScale = new AutoScale('X_Y_AUTO_SCALE', this.line, this.view);
  this.autoScale.extraMargin = 0.05;

  this.displayGraph = new DisplayGraph(this.line);
  this.displayGraph.setScreenRect(this.view.getScreenRect());
  // Use off-screen buffer because usually the autoScale doesn't change the area.
  this.displayGraph.setUseBuffer(true);
  this.displayList.prepend(this.displayGraph);
  // inform displayGraph when the screen rect changes.
  new GenericObserver(this.view, (evt: SubjectEvent) => {
      if (evt.nameEquals(SimView.SCREEN_RECT_CHANGED)) {
        this.displayGraph.setScreenRect(this.view.getScreenRect());
      }
    }, 'resize DisplayGraph');

  this.controls_ = [];
  this.div_controls = div_controls;

  let pn = this.line.getParameterNumber(GraphLine.en.Y_VARIABLE);
  this.addControl(new ChoiceControl(pn, 'Y:'));
  pn = this.line.getParameterNumber(GraphLine.en.X_VARIABLE);
  this.addControl(new ChoiceControl(pn, 'X:'));
  this.addControl(new ButtonControl(GraphLine.i18n.CLEAR_GRAPH,
      () => this.line.reset() ));

  let ps = this.line.getParameterString(GraphLine.en.GRAPH_COLOR);
  this.addControl(new ChoiceControl(ps, /*label=*/undefined, GraphColorChoices(),
      GraphColorValues()));
  pn = this.line.getParameterNumber(GraphLine.en.LINE_WIDTH);
  this.addControl(new NumericControl(pn));
  ps = this.line.getParameterString(GraphLine.en.DRAWING_MODE);
  this.addControl(new ChoiceControl(ps));

  this.graphCtrl = new SimController(graphCanvas, /*eventHandler=*/null,
      /*panModifiers=*/{alt:false, control:false, meta:false, shift:false});

  const panzoom = CommonControls.makePanZoomControls(this.view, /*overlay=*/true,
      /*resetFunc=*/ () => { this.autoScale.setActive(true); });
  div_graph.appendChild(panzoom);
  const pb = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.addControl(new CheckBoxControl(pb));

  // Use the off-screen buffer only when "time-scrolling" is not happening
  // (i.e. when time less than the time window) because the auto-scale
  // causes time graph to redraw every frame.
  const timeIdx = this.line.getVarsList().timeIndex();
  simRun.addMemo(new GenericMemo( () => {
    if (this.line.getXVariable() == timeIdx) {
      const t = simRun.getClock().getTime();
      const tw = this.autoScale.getTimeWindow();
      this.displayGraph.setUseBuffer(t < tw);
    } else {
      this.displayGraph.setUseBuffer(true);
    }
  }, 'graph: use off-screen buffer when not time-scrolling'));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', canvas: '+this.canvas.toStringShort()
      +', view: '+this.view.toStringShort()
      +', line: '+this.line.toStringShort()
      +', axes: '+this.axes.toStringShort()
      +', autoScale: '+this.autoScale.toStringShort()
      +', displayGraph: '+this.displayGraph.toStringShort()
      +', graphCtrl: '+this.graphCtrl.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'StandardGraph1';
};

/** @inheritDoc */
getSubjects(): Subject[] {
  return [ this, this.line, this.view, this.autoScale ];
};

/** Add the control to the set of simulation controls.
* @param control
* @return the control that was passed in
*/
addControl(control: LabControl): LabControl {
  const element = control.getElement();
  element.style.display = this.displayStyle;
  this.div_controls.appendChild(element);
  this.controls_.push(control);
  return control;
};

} // end class
Util.defineGlobal('sims$common$StandardGraph1', StandardGraph1);
