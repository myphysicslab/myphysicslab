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

goog.module('myphysicslab.sims.common.TimeGraph1');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const AutoScale = goog.require('myphysicslab.lab.graph.AutoScale');
const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayAxes = goog.require('myphysicslab.lab.graph.DisplayAxes');
const DisplayGraph = goog.require('myphysicslab.lab.graph.DisplayGraph');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const GenericMemo = goog.require('myphysicslab.lab.util.GenericMemo');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const GraphLine = goog.require('myphysicslab.lab.graph.GraphLine');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const LabView = goog.require('myphysicslab.lab.view.LabView');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const SimController = goog.require('myphysicslab.lab.app.SimController');
const SimRunner = goog.require('myphysicslab.lab.app.SimRunner');
const SimView = goog.require('myphysicslab.lab.view.SimView');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const SubjectList = goog.require('myphysicslab.lab.util.SubjectList');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

/** Creates a single graph showing several independent GraphLines, and with a horizontal
time axis. Because there is a single SimView and DisplayGraph, all the GraphLines are
plotted in the same graph coordinates. The horizontal variable can be changed to
something other than time. Creates an AutoScale that ensures all of the GraphLines are
visible. Creates several controls to modify the graph.
* @implements {SubjectList}
*/
class TimeGraph1 extends AbstractSubject {
/**
* @param {!VarsList} varsList the VarsList to collect data from
* @param {!LabCanvas} graphCanvas the LabCanvas where the graph should appear
* @param {!Element} div_controls the HTML div where controls should be added
* @param {!Element} div_graph the HTML div where the graphCanvas is located
* @param {!SimRunner} simRun the SimRunner controlling the overall app
* @param {string=} color1 color of line 1
* @param {string=} color2 color of line 2
* @param {string=} color3 color of line 3
*/
constructor(varsList, graphCanvas, div_controls, div_graph, simRun, color1, color2, color3) {
  super('TIME_GRAPH_LAYOUT');
  color1 = color1 ? color1 : 'lime';
  color2 = color2 ? color2 : 'red';
  color3 = color3 ? color3 : 'blue';
  /** @type {!LabCanvas} */
  this.canvas = graphCanvas;
  simRun.addCanvas(graphCanvas);
  /** @type {!SimView} */
  this.view = new SimView('TIME_GRAPH_VIEW', new DoubleRect(0, 0, 1, 1));
  this.view.setHorizAlign(HorizAlign.FULL);
  this.view.setVerticalAlign(VerticalAlign.FULL);
  graphCanvas.addView(this.view);
  /** @type {!DisplayAxes} */
  this.axes = CommonControls.makeAxes(this.view);
  /** @type {!GraphLine} */
  this.line1 = new GraphLine('TIME_GRAPH_LINE_1', varsList);
  this.line1.setColor(color1);
  this.view.addMemo(this.line1);
  /** @type {!AutoScale} */
  this.autoScale = new AutoScale('TIME_GRAPH_AUTO_SCALE', this.line1, this.view);
  this.autoScale.extraMargin = 0.05;
  /** @type {!DisplayGraph} */
  this.displayGraph = new DisplayGraph(this.line1);
  this.displayGraph.setScreenRect(this.view.getScreenRect());
  this.view.getDisplayList().prepend(this.displayGraph);
  // inform displayGraph when the screen rect changes.
  new GenericObserver(this.view, evt => {
      if (evt.nameEquals(LabView.SCREEN_RECT_CHANGED)) {
        this.displayGraph.setScreenRect(this.view.getScreenRect());
      }
    }, 'resize DisplayGraph');

  const timeIdx = this.line1.getVarsList().timeIndex();
  this.line1.setXVariable(timeIdx);
  this.line1.setYVariable(0);

  /** @type {!GraphLine} */
  this.line2 = new GraphLine('TIME_GRAPH_LINE_2', varsList);
  this.autoScale.addGraphLine(this.line2);
  this.view.addMemo(this.line2);
  this.line2.setXVariable(timeIdx);
  this.line2.setYVariable(1);
  this.line2.setColor(color2);
  this.displayGraph.addGraphLine(this.line2);

  /** @type {!GraphLine} */
  this.line3 = new GraphLine('TIME_GRAPH_LINE_3', varsList);
  this.autoScale.addGraphLine(this.line3);
  this.view.addMemo(this.line3);
  this.line3.setXVariable(timeIdx);
  this.line3.setYVariable(-1);
  this.line3.setColor(color3);
  this.displayGraph.addGraphLine(this.line3);

  /** @type {!Array<!LabControl>} */
  this.controls_ = [];
  /** @type {!Element} */
  this.div_controls = div_controls;

  //this.addControl(CommonControls.makePlaybackControls(simRun));

  /** @type {!ParameterNumber} */
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

  /** GenericObserver ensures line2, line3 have same X variable as line1.
  * @type {!GenericObserver}
  */
  this.line1Obs = new GenericObserver(this.line1, 
    e => {
      this.line2.setXVariable(this.line1.getXVariable());
      this.line3.setXVariable(this.line1.getXVariable());
    }, 'ensure line2, line3 have same X variable as line1');
  /** SimController which pans the graph with no modifier keys pressed.
  * @type {!SimController}
  */
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
      this.displayGraph.setUseBuffer(t > tw);
    } else {
      this.displayGraph.setUseBuffer(true);
    }
  }, 'time graph: use off-screen buffer when not time-scrolling'));

  const panzoom = CommonControls.makePanZoomControls(this.view, /*overlay=*/true,
      /*resetFunc=*/ () => this.autoScale.setActive(true) );
  div_graph.appendChild(panzoom);
  /** @type {!ParameterBoolean} */
  const pb = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.addControl(new CheckBoxControl(pb));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
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

/** @override */
getClassName() {
  return 'TimeGraph1';
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
addControl(control) {
  const element = control.getElement();
  element.style.display = 'block';
  this.div_controls.appendChild(element);
  this.controls_.push(control);
  return control;
};

/** @override */
getSubjects() {
  return [ this, this.line1, this.line2, this.line3, this.view, this.autoScale ];
};

} // end class

exports = TimeGraph1;
