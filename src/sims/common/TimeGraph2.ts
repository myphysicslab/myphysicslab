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
ParameterString, Subject, SubjectEvent, SubjectList } from '../../lab/util/Observe.js';
import { Graph } from './Graph.js';
import { GraphLine } from '../../lab/graph/GraphLine.js';
import { HorizAlign } from '../../lab/view/HorizAlign.js';
import { LabCanvas } from '../../lab/view/LabCanvas.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { SimView } from '../../lab/view/SimView.js';
import { Util, Printable } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { VerticalAlign } from '../../lab/view/VerticalAlign.js';

/** Creates two independent graphs which have a common horizontal time axis, but the
graphs can have different vertical scales. Each graph consists of a SimView,
GraphLine, DisplayGraph, AutoScale, DisplayAxes. This makes it possible to see together
two GraphLines with very different scales. The horizontal variable can be changed to
something other than time, but we ensure that both graphs have the same horizontal
variable.

Creates several controls to modify the graph (but no pan-zoom control because
it gets too confusing with the independent graphs).

Each graph has its own DisplayAxes, which are shown in the same color as the GraphLine.
One of the axes are placed on the right, and the other is on the left.
*/
export class TimeGraph2 implements Graph, SubjectList, Printable {

  canvas: LabCanvas;
  view1: SimView;
  displayList1: DisplayList;
  axes1: DisplayAxes;
  line1: GraphLine;
  autoScale1: AutoScale;
  displayGraph1: DisplayGraph;
  view2: SimView;
  displayList2: DisplayList;
  axes2: DisplayAxes;
  line2: GraphLine;
  autoScale2: AutoScale;
  displayGraph2: DisplayGraph;
  controls_: LabControl[];
  div_controls: Element;
  auto1Obs: GenericObserver;
  line1Obs: GenericObserver;

/**
* @param varsList the VarsList to collect
*   data from
* @param graphCanvas the LabCanvas where the graph
*   should appear
* @param div_controls the HTML div where controls should be added
* @param div_graph the HTML div where the graphCanvas is located
* @param simRun the SimRunner controlling the
*   overall app
*/
constructor(varsList: VarsList, graphCanvas: LabCanvas, div_controls: HTMLDivElement,
    _div_graph: HTMLDivElement, simRun: SimRunner) {
  this.canvas = graphCanvas;
  simRun.addCanvas(graphCanvas);
  this.view1 = new SimView('TIME_GRAPH_1', new DoubleRect(0, 0, 1, 1));
  this.view1.setHorizAlign(HorizAlign.FULL);
  this.view1.setVerticalAlign(VerticalAlign.FULL);
  graphCanvas.addView(this.view1);
  this.displayList1 = this.view1.getDisplayList();
  this.axes1 = CommonControls.makeAxes(this.view1);
  this.axes1.setColor('lime');
  this.line1 = new GraphLine('TIME_LINE_1', varsList);
  new GenericObserver(this.line1, evt => {
    if (evt.nameEquals(GraphLine.en.X_VARIABLE)) {
      this.axes1.setHorizName(this.line1.getXVarName());
    }
    if (evt.nameEquals(GraphLine.en.Y_VARIABLE)) {
      this.axes1.setVerticalName(this.line1.getYVarName());
    }
  }, 'update axes1 names');
  this.line1.setColor('lime');
  this.view1.addMemo(this.line1);
  this.autoScale1 = new AutoScale('TIME_GRAPH_AUTO_SCALE_1', this.line1, this.view1);
  this.autoScale1.extraMargin = 0.05;
  this.displayGraph1 = new DisplayGraph(this.line1);
  this.displayGraph1.setScreenRect(this.view1.getScreenRect());
  // Don't use off-screen buffer because the auto-scale causes graph to redraw
  // every frame.  Therefore no time savings from off-screen buffer.
  this.displayGraph1.setUseBuffer(false);
  this.displayList1.prepend(this.displayGraph1);
  // inform displayGraph1 when the screen rect changes.
  new GenericObserver(this.view1, evt => {
      if (evt.nameEquals(SimView.SCREEN_RECT_CHANGED)) {
        this.displayGraph1.setScreenRect(this.view1.getScreenRect());
      }
    }, 'resize DisplayGraph1');

  const timeIdx = this.line1.getVarsList().timeIndex();
  this.line1.setXVariable(timeIdx);
  this.line1.setYVariable(0);

  this.view2 = new SimView('TIME_GRAPH_2', new DoubleRect(0, 0, 1, 1));
  this.view2.setHorizAlign(HorizAlign.FULL);
  this.view2.setVerticalAlign(VerticalAlign.FULL);
  graphCanvas.addView(this.view2);
  this.displayList2 = this.view2.getDisplayList();
  this.axes2 = CommonControls.makeAxes(this.view2);
  this.axes2.setColor('red');
  this.axes2.setYAxisAlignment(HorizAlign.RIGHT);
  this.line2 = new GraphLine('TIME_LINE_2', varsList);
  new GenericObserver(this.line2, evt => {
    if (evt.nameEquals(GraphLine.en.X_VARIABLE)) {
      this.axes2.setHorizName(this.line2.getXVarName());
    }
    if (evt.nameEquals(GraphLine.en.Y_VARIABLE)) {
      this.axes2.setVerticalName(this.line2.getYVarName());
    }
  }, 'update axes2 names');
  this.view2.addMemo(this.line2);
  this.line2.setXVariable(timeIdx);
  this.line2.setYVariable(1);
  this.line2.setColor('red');
  this.autoScale2 = new AutoScale('TIME_GRAPH_AUTO_SCALE_2', this.line2, this.view2);
  this.autoScale2.extraMargin = 0.05;
  this.displayGraph2 = new DisplayGraph(this.line2);
  this.displayGraph2.setScreenRect(this.view2.getScreenRect());
  // Don't use off-screen buffer because the auto-scale causes graph to redraw
  // every frame.  Therefore no time savings from off-screen buffer.
  this.displayGraph2.setUseBuffer(false);
  this.displayList2.prepend(this.displayGraph2);
  // inform displayGraph2 when the screen rect changes.
  new GenericObserver(this.view2, evt => {
      if (evt.nameEquals(SimView.SCREEN_RECT_CHANGED)) {
        this.displayGraph2.setScreenRect(this.view2.getScreenRect());
      }
    }, 'resize DisplayGraph2');

  this.controls_ = [];
  this.div_controls = div_controls;

  this.addControl(CommonControls.makePlaybackControls(simRun));

  let pn = this.line1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  this.addControl(new ChoiceControl(pn, TimeGraph2.i18n.LIME));
  pn = this.line2.getParameterNumber(GraphLine.en.Y_VARIABLE);
  this.addControl(new ChoiceControl(pn, TimeGraph2.i18n.RED));
  pn = this.line1.getParameterNumber(GraphLine.en.X_VARIABLE);
  this.addControl(new ChoiceControl(pn, 'X:'));
  pn = this.autoScale1.getParameterNumber(AutoScale.en.TIME_WINDOW)
  this.addControl(new NumericControl(pn));
  const bc = new ButtonControl(GraphLine.i18n.CLEAR_GRAPH,
      () => {
        this.line1.reset();
        this.line2.reset();
      });
  this.addControl(bc);
  /* GenericObserver ensures autoScale2 has same time window as autoScale1 */
  this.auto1Obs = new GenericObserver(this.autoScale1,
      _evt => this.autoScale2.setTimeWindow(this.autoScale1.getTimeWindow()),
      'ensures autoScale2 has same time window as autoScale1');
  /* GenericObserver ensures line2 has same X variable as line1. */
  this.line1Obs = new GenericObserver(this.line1, _evt => {
      // Don't use off-screen buffer with time variable because the auto-scale causes
      // graph to redraw every frame.
      const isTimeGraph = this.line1.getXVariable() == timeIdx;
      this.displayGraph1.setUseBuffer(!isTimeGraph);
      this.displayGraph2.setUseBuffer(!isTimeGraph);
      this.line2.setXVariable(this.line1.getXVariable());
    }, 'ensures line2 has same X variable as line1');
};

/** @inheritDoc */
toString() {
  return 'TimeGraph2{'
    +'canvas: '+this.canvas.toStringShort()
    +', view1: '+this.view1.toStringShort()
    +', view2: '+this.view2.toStringShort()
    +', line1: '+this.line1.toStringShort()
    +', line2: '+this.line2.toStringShort()
    +', axes1: '+this.axes1.toStringShort()
    +', axes2: '+this.axes2.toStringShort()
    +', autoScale1: '+this.autoScale1.toStringShort()
    +', autoScale2: '+this.autoScale2.toStringShort()
    +', displayGraph1: '+this.displayGraph1.toStringShort()
    +', displayGraph2: '+this.displayGraph2.toStringShort()
    +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'TimeGraph2{}';
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
  return [ this.line1, this.line2, this.view1, this.view2, this.autoScale1,
      this.autoScale2 ];
};

static readonly en: i18n_strings = {
  LIME: 'lime',
  RED: 'red'
};

static readonly de_strings: i18n_strings = {
  LIME: 'hell grün',
  RED: 'rot'
};

static readonly i18n = Util.LOCALE === 'de' ? TimeGraph2.de_strings : TimeGraph2.en;

} // end class

type i18n_strings = {
  LIME: string,
  RED: string
};

Util.defineGlobal('sims$common$TimeGraph2', TimeGraph2);
