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

goog.provide('myphysicslab.sims.common.StandardGraph1');

goog.require('myphysicslab.lab.app.SimController');
goog.require('myphysicslab.lab.app.SimRunner');
goog.require('myphysicslab.lab.controls.ButtonControl');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.LabControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.graph.AutoScale');
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.graph.DisplayGraph');
goog.require('myphysicslab.lab.graph.GraphColor');
goog.require('myphysicslab.lab.graph.GraphLine');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.SubjectList');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.LabCanvas');
goog.require('myphysicslab.lab.view.LabView');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.lab.view.VerticalAlign');
goog.require('myphysicslab.sims.common.CommonControls');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const AbstractSubject = goog.module.get('myphysicslab.lab.util.AbstractSubject');
var AutoScale = lab.graph.AutoScale;
var ButtonControl = lab.controls.ButtonControl;
var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var CommonControls = sims.common.CommonControls;
var DisplayAxes = lab.graph.DisplayAxes;
var DisplayGraph = lab.graph.DisplayGraph;
var DisplayList = lab.view.DisplayList;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const GenericEvent = goog.module.get('myphysicslab.lab.util.GenericEvent');
const GenericObserver = goog.module.get('myphysicslab.lab.util.GenericObserver');
var GraphColor = lab.graph.GraphColor;
var GraphLine = lab.graph.GraphLine;
var HorizAlign = lab.view.HorizAlign;
var LabCanvas = lab.view.LabCanvas;
var LabControl = lab.controls.LabControl;
var LabView = lab.view.LabView;
var NumericControl = lab.controls.NumericControl;
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.module.get('myphysicslab.lab.util.ParameterString');
var SimController = lab.app.SimController;
var SimRunner = lab.app.SimRunner;
var SimView = lab.view.SimView;
var Subject = lab.util.Subject;
const SubjectList = goog.module.get('myphysicslab.lab.util.SubjectList');
const Terminal = goog.module.get('myphysicslab.lab.util.Terminal');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
var VerticalAlign = lab.view.VerticalAlign;

/** Creates a graph with a single GraphLine. Creates a single SimView and DisplayGraph
to show the GraphLine. Adds the SimView to `graphCanvas`. Creates an AutoScale that
modifies the SimView to contain the GraphLine.
Creates several controls to modify the graph.

* @param {!VarsList} varsList the VarsList to collect data from
* @param {!LabCanvas} graphCanvas the LabCanvas where the graph should appear
* @param {!Element} div_controls the HTML div where controls should be added
* @param {!Element} div_graph the HTML div where the graphCanvas is located
* @param {!SimRunner} simRun the SimRunner controlling the overall app
* @param {string=} displayStyle the CSS display style to use when adding controls
* @constructor
* @final
* @extends {AbstractSubject}
* @implements {SubjectList}
* @struct
*/
myphysicslab.sims.common.StandardGraph1 = function(varsList, graphCanvas, div_controls,
    div_graph, simRun, displayStyle) {
  AbstractSubject.call(this, 'GRAPH_LAYOUT');

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
  var updateAxes = goog.bind(function(evt) {
    if (evt.nameEquals(GraphLine.en.X_VARIABLE)) {
      this.axes.setHorizName(this.line.getXVarName());
    }
    if (evt.nameEquals(GraphLine.en.Y_VARIABLE)) {
      this.axes.setVerticalName(this.line.getYVarName());
    }
  }, this);
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
  new GenericObserver(this.view, goog.bind(function(evt) {
      if (evt.nameEquals(LabView.SCREEN_RECT_CHANGED)) {
        this.displayGraph.setScreenRect(this.view.getScreenRect());
      }
    }, this), 'resize DisplayGraph');

  /** @type {!Array<!LabControl>} */
  this.controls_ = [];
  /** @type {!Element} */
  this.div_controls = div_controls;

  this.addControl(CommonControls.makePlaybackControls(simRun));

  /** @type {!ParameterNumber} */
  var pn = this.line.getParameterNumber(GraphLine.en.Y_VARIABLE);
  this.addControl(new ChoiceControl(pn, 'Y:'));
  pn = this.line.getParameterNumber(GraphLine.en.X_VARIABLE);
  this.addControl(new ChoiceControl(pn, 'X:'));
  this.addControl(new ButtonControl(GraphLine.i18n.CLEAR_GRAPH,
      goog.bind(this.line.reset, this.line)));

  /** @type {!ParameterString} */
  var ps = this.line.getParameterString(GraphLine.en.GRAPH_COLOR);
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

  var panzoom = CommonControls.makePanZoomControls(this.view, /*overlay=*/true,
      /*resetFunc=*/goog.bind(function() {
        this.autoScale.setActive(true);
      },this));
  div_graph.appendChild(panzoom);
  /** @type {!ParameterBoolean} */
  var pb = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.addControl(new CheckBoxControl(pb));
};
var StandardGraph1 = myphysicslab.sims.common.StandardGraph1;
goog.inherits(StandardGraph1, AbstractSubject);

/** @override */
StandardGraph1.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', canvas: '+this.canvas.toStringShort()
      +', view: '+this.view.toStringShort()
      +', line: '+this.line.toStringShort()
      +', axes: '+this.axes.toStringShort()
      +', autoScale: '+this.autoScale.toStringShort()
      +', displayGraph: '+this.displayGraph.toStringShort()
      +', graphCtrl: '+this.graphCtrl.toStringShort()
      + StandardGraph1.superClass_.toString.call(this);
};

/** @override */
StandardGraph1.prototype.getClassName = function() {
  return 'StandardGraph1';
};

/** @override */
StandardGraph1.prototype.getSubjects = function() {
  return [ this, this.line, this.view, this.autoScale ];
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
StandardGraph1.prototype.addControl = function(control) {
  var element = control.getElement();
  element.style.display = this.displayStyle;
  this.div_controls.appendChild(element);
  this.controls_.push(control);
  return control;
};

}); // goog.scope
