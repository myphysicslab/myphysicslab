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
import { DrawingMode } from '../../lab/view/DrawingMode.js';
import { GenericEvent } from '../../lab/util/Observe.js';
import { GenericObserver } from '../../lab/util/Observe.js';
import { GraphLine } from '../../lab/graph/GraphLine.js';
import { HorizAlign } from '../../lab/view/HorizAlign.js';
import { LabCanvas } from '../../lab/view/LabCanvas.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterBoolean } from '../../lab/util/Observe.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { ParameterString } from '../../lab/util/Observe.js';
import { SimController } from '../../lab/app/SimController.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { SimView } from '../../lab/view/SimView.js';
import { Subject, SubjectEvent } from '../../lab/util/Observe.js';
import { SubjectList } from '../../lab/util/Observe.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { Util } from '../../lab/util/Util.js';
import { VerticalAlign } from '../../lab/view/VerticalAlign.js';

/** Creates a graph showing two GraphLines corresponding to two Simulations, where the
two GraphLines are showing the same variables. There is a single SimView and
DisplayGraph. Creates an AutoScale that ensures both GraphLines are visible. Creates
controls to modify the graph. The menu choices are only connected to the first
GraphLine. The second GraphLine should be externally synchronized to show the same
variables as the first GraphLine.
*/
export class CompareGraph extends AbstractSubject implements Subject, SubjectList {
  line1: GraphLine;
  line2: GraphLine;
  canvas: LabCanvas;
  view: SimView;
  axes: DisplayAxes;
  autoScale: AutoScale;
  displayGraph: DisplayGraph;
  controls_: LabControl[] = [];
  div_controls: HTMLDivElement;
  graphCtrl: SimController;

/**
* @param line1 the first GraphLine to show
* @param line2 the second GraphLine to show
* @param graphCanvas the LabCanvas where the graph should appear
* @param div_controls the HTML div where controls should be added
* @param div_graph the HTML div where the graphCanvas is located
* @param simRun the SimRunner controlling the overall app
*/
constructor(line1: GraphLine, line2: GraphLine, graphCanvas: LabCanvas, div_controls: HTMLDivElement, div_graph: HTMLDivElement, simRun: SimRunner) {
  super('GRAPH_LAYOUT');
  this.line1 = line1;
  this.line2 = line2;
  this.canvas = graphCanvas;
  simRun.addCanvas(graphCanvas);

  this.view = new SimView('graph', new DoubleRect(0, 0, 1, 1));
  this.view.setHorizAlign(HorizAlign.FULL);
  this.view.setVerticalAlign(VerticalAlign.FULL);
  this.view.addMemo(line1);
  this.view.addMemo(line2);
  graphCanvas.addView(this.view);

  this.axes = CommonControls.makeAxes(this.view);
  const updateAxes = (evt: SubjectEvent) => {
    if (evt.nameEquals(GraphLine.en.X_VARIABLE)) {
      this.axes.setHorizName(this.line1.getXVarName());
    }
    if (evt.nameEquals(GraphLine.en.Y_VARIABLE)) {
      this.axes.setVerticalName(this.line1.getYVarName());
    }
  };
  new GenericObserver(line1, updateAxes, 'update axes names');
  updateAxes(new GenericEvent(line1, GraphLine.i18n.X_VARIABLE));

  this.autoScale = new AutoScale('COMPARE_GRAPH_AUTO_SCALE', line1, this.view);
  this.autoScale.addGraphLine(line2);
  this.autoScale.extraMargin = 0.05;

  this.displayGraph = new DisplayGraph(line1);
  this.displayGraph.addGraphLine(line2);
  this.displayGraph.setScreenRect(this.view.getScreenRect());
  // Use off-screen buffer because usually the autoScale doesn't change the area.
  this.displayGraph.setUseBuffer(true);
  this.view.getDisplayList().prepend(this.displayGraph);
  // inform displayGraph when the screen rect changes.
  new GenericObserver(this.view, evt => {
      if (evt.nameEquals(SimView.SCREEN_RECT_CHANGED)) {
        this.displayGraph.setScreenRect(this.view.getScreenRect());
      }
    }, 'resize DisplayGraph');

  this.div_controls = div_controls;
  this.addControl(CommonControls.makePlaybackControls(simRun));

  let pn = line1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  this.addControl(new ChoiceControl(pn, 'Y:'));
  pn = line1.getParameterNumber(GraphLine.en.X_VARIABLE);
  this.addControl(new ChoiceControl(pn, 'X:'));

  const bc = new ButtonControl(GraphLine.i18n.CLEAR_GRAPH,
      () => {
        line1.reset();
        line2.reset();
        this.autoScale.reset();
      });
  this.addControl(bc);

  const ps = line1.getParameterString(GraphLine.en.DRAWING_MODE);
  this.addControl(new ChoiceControl(ps));

  // use same drawing mode on line2
  new GenericObserver(line1, (_evt: SubjectEvent) =>
      line2.setDrawingMode(line1.getDrawingMode()),
      'match drawing mode on GraphLine');

  // SimController which pans the graph with no modifier keys pressed.
  this.graphCtrl = new SimController(graphCanvas, /*eventHandler=*/null,
      /*panModifier=*/{alt:false, control:false, meta:false, shift:false});

  const panzoom = CommonControls.makePanZoomControls(this.view, /*overlay=*/true,
      /*resetFunc=*/ () => this.autoScale.setActive(true) );
  div_graph.appendChild(panzoom);
  const pb = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.addControl(new CheckBoxControl(pb));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', line1: '+this.line1.toStringShort()
      +', line2: '+this.line2.toStringShort()
      +', canvas: '+this.canvas.toStringShort()
      +', view: '+this.view.toStringShort()
      +', axes: '+this.axes.toStringShort()
      +', autoScale: '+this.autoScale.toStringShort()
      +', displayGraph: '+this.displayGraph.toStringShort()
      +', graphCtrl: '+this.graphCtrl.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'CompareGraph';
};

/** @inheritDoc */
getSubjects(): Subject[] {
  return [ this, this.line1, this.line2, this.view, this.autoScale ];
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

} // end class

Util.defineGlobal('sims$common$CompareGraph', CompareGraph);
