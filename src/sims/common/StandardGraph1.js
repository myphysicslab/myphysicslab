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

goog.module('myphysicslab.sims.common.StandardGraph1');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const AutoScale = goog.require('myphysicslab.lab.graph.AutoScale');
const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayAxes = goog.require('myphysicslab.lab.graph.DisplayAxes');
const DisplayGraph = goog.require('myphysicslab.lab.graph.DisplayGraph');
const DisplayList = goog.require('myphysicslab.lab.view.DisplayList');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const GenericMemo = goog.require('myphysicslab.lab.util.GenericMemo');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const GraphColor = goog.require('myphysicslab.lab.graph.GraphColor');
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
const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

/** Creates a graph with a single GraphLine. Creates a single SimView and DisplayGraph
to show the GraphLine. Adds the SimView to `graphCanvas`. Creates an AutoScale that
modifies the SimView to contain the GraphLine.
Creates several controls to modify the graph.

* @implements {SubjectList}
*/
class StandardGraph1 extends AbstractSubject {
/**
* @param {!VarsList} varsList the VarsList to collect data from
* @param {!LabCanvas} graphCanvas the LabCanvas where the graph should appear
* @param {!Element} div_controls the HTML div where controls should be added
* @param {!Element} div_graph the HTML div where the graphCanvas is located
* @param {!SimRunner} simRun the SimRunner controlling the overall app
* @param {string=} displayStyle the CSS display style to use when adding controls
*/
constructor(varsList, graphCanvas, div_controls, div_graph, simRun, displayStyle) {
  super('GRAPH_LAYOUT');

  /** @type {string} */
  this.displayStyle = displayStyle || 'block';
  /** @type {!LabCanvas} */
  this.canvas = graphCanvas;
  simRun.addCanvas(graphCanvas);

  /** @type {!SimView} */
  this.view = new SimView('X_Y_GRAPH_VIEW', new DoubleRect(0, 0, 1, 1));
  this.view.setHorizAlign(HorizAlign.FULL);
  this.view.setVerticalAlign(VerticalAlign.FULL);
  graphCanvas.addView(this.view);
  /** @type {!DisplayList} */
  this.displayList = this.view.getDisplayList();

  /** @type {!GraphLine} */
  this.line = new GraphLine('X_Y_GRAPH_LINE', varsList);
  this.line.setXVariable(0);
  this.line.setYVariable(1);
  this.line.setColor('lime');
  this.view.addMemo(this.line);

  /** @type {!DisplayAxes} */
  this.axes = CommonControls.makeAxes(this.view);
  const updateAxes = evt => {
    if (evt.nameEquals(GraphLine.en.X_VARIABLE)) {
      this.axes.setHorizName(this.line.getXVarName());
    }
    if (evt.nameEquals(GraphLine.en.Y_VARIABLE)) {
      this.axes.setVerticalName(this.line.getYVarName());
    }
  };
  new GenericObserver(this.line, updateAxes, 'update axes names');
  updateAxes(new GenericEvent(this.line, GraphLine.i18n.X_VARIABLE));

  /** @type {!AutoScale} */
  this.autoScale = new AutoScale('X_Y_AUTO_SCALE', this.line, this.view);
  this.autoScale.extraMargin = 0.05;

  /** @type {!DisplayGraph} */
  this.displayGraph = new DisplayGraph(this.line);
  this.displayGraph.setScreenRect(this.view.getScreenRect());
  // Use off-screen buffer because usually the autoScale doesn't change the area.
  this.displayGraph.setUseBuffer(true);
  this.displayList.prepend(this.displayGraph);
  // inform displayGraph when the screen rect changes.
  new GenericObserver(this.view, evt => {
      if (evt.nameEquals(LabView.SCREEN_RECT_CHANGED)) {
        this.displayGraph.setScreenRect(this.view.getScreenRect());
      }
    }, 'resize DisplayGraph');

  /** @type {!Array<!LabControl>} */
  this.controls_ = [];
  /** @type {!Element} */
  this.div_controls = div_controls;

  //this.addControl(CommonControls.makePlaybackControls(simRun));

  /** @type {!ParameterNumber} */
  let pn = this.line.getParameterNumber(GraphLine.en.Y_VARIABLE);
  this.addControl(new ChoiceControl(pn, 'Y:'));
  pn = this.line.getParameterNumber(GraphLine.en.X_VARIABLE);
  this.addControl(new ChoiceControl(pn, 'X:'));
  this.addControl(new ButtonControl(GraphLine.i18n.CLEAR_GRAPH,
      () => this.line.reset() ));

  /** @type {!ParameterString} */
  let ps = this.line.getParameterString(GraphLine.en.GRAPH_COLOR);
  this.addControl(new ChoiceControl(ps, /*label=*/undefined, GraphColor.getChoices(),
      GraphColor.getValues()));
  pn = this.line.getParameterNumber(GraphLine.en.LINE_WIDTH);
  this.addControl(new NumericControl(pn));
  ps = this.line.getParameterString(GraphLine.en.DRAWING_MODE);
  this.addControl(new ChoiceControl(ps));

  /** SimController which pans the graph with no modifier keys pressed.
  * @type {!SimController}
  */
  this.graphCtrl = new SimController(graphCanvas, /*eventHandler=*/null,
      /*panModifier=*/{alt:false, control:false, meta:false, shift:false});

  const panzoom = CommonControls.makePanZoomControls(this.view, /*overlay=*/true,
      /*resetFunc=*/ () => {
        this.autoScale.setActive(true);
      });
  div_graph.appendChild(panzoom);
  /** @type {!ParameterBoolean} */
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
      this.displayGraph.setUseBuffer(t > tw);
    } else {
      this.displayGraph.setUseBuffer(true);
    }
  }, 'graph: use off-screen buffer when not time-scrolling'));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', canvas: '+this.canvas.toStringShort()
      +', view: '+this.view.toStringShort()
      +', line: '+this.line.toStringShort()
      +', axes: '+this.axes.toStringShort()
      +', autoScale: '+this.autoScale.toStringShort()
      +', displayGraph: '+this.displayGraph.toStringShort()
      +', graphCtrl: '+this.graphCtrl.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'StandardGraph1';
};

/** @override */
getSubjects() {
  return [ this, this.line, this.view, this.autoScale ];
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
addControl(control) {
  const element = control.getElement();
  element.style.display = this.displayStyle;
  this.div_controls.appendChild(element);
  this.controls_.push(control);
  return control;
};

} // end class
exports = StandardGraph1;
