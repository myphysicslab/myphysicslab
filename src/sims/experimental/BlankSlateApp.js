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

goog.module('myphysicslab.sims.experimental.BlankSlateApp');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayAxes = goog.require('myphysicslab.lab.graph.DisplayAxes');
const DisplayClock = goog.require('myphysicslab.lab.view.DisplayClock');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayList = goog.require('myphysicslab.lab.view.DisplayList');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DisplayText = goog.require('myphysicslab.lab.view.DisplayText');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const EnergyBarGraph = goog.require('myphysicslab.lab.graph.EnergyBarGraph');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const ScreenRect = goog.require('myphysicslab.lab.view.ScreenRect');
const SimController = goog.require('myphysicslab.lab.app.SimController');
const SimView = goog.require('myphysicslab.lab.view.SimView');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const Timer = goog.require('myphysicslab.lab.util.Timer');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

// following are only required for possible use in Terminal
const VarsHistory = goog.require('myphysicslab.lab.graph.VarsHistory');
const ExpressionVariable = goog.require('myphysicslab.lab.model.ExpressionVariable');
const FunctionVariable = goog.require('myphysicslab.lab.model.FunctionVariable');
const ClockTask = goog.require('myphysicslab.lab.util.ClockTask');
const GenericMemo = goog.require('myphysicslab.lab.util.GenericMemo');

/** BlankSlateApp has a LabCanvas and Terminal, and let's you experiment building
things with scripts.
*/
class BlankSlateApp extends AbstractSubject {
/**
* @param {!BlankSlateApp.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  super('APP');
  Util.setImagesDir(elem_ids['images_dir']);
  const div_sim = BlankSlateApp.getElementById(elem_ids, 'sim_canvas');
  // 'relative' allows absolute positioning of icon controls over the canvas
  div_sim.style.position = 'relative';
  const canvas = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /**
  * @type {!LabCanvas}
  * @private
  */
  this.simCanvas = new LabCanvas(canvas, 'canvas1');
  this.simCanvas.setSize(500, 500);
  div_sim.appendChild(this.simCanvas.getCanvas());
  /** div for sim controls
  * @type {!Element}
  */
  this.sim_controls = BlankSlateApp.getElementById(elem_ids, 'sim_controls');

  const term_output = /** @type {!HTMLInputElement} */
      (BlankSlateApp.getElementById(elem_ids, 'term_output'));
  const term_input = /** @type {!HTMLInputElement} */
      (BlankSlateApp.getElementById(elem_ids, 'term_input'));
  /**
  * @type {!Terminal}
  * @private
  */
  this.terminal = new Terminal(term_input, term_output);
  Terminal.stdRegex(this.terminal);
  this.terminal.setAfterEval( () => this.simCanvas.paint() );

  /** @type {!DoubleRect} */
  this.simRect = new DoubleRect(-6, -6, 6, 6);
  /**
  * @type {!SimView}
  * @private
  */
  this.simView = new SimView('simView', this.simRect);
  this.simCanvas.addView(this.simView);
  /** @type {!DisplayList} */
  this.displayList = this.simView.getDisplayList();
  /**
  * @type {!DisplayAxes}
  * @private
  */
  this.axes = CommonControls.makeAxes(this.simView, /*bottomLeft=*/true);
  this.simCanvas.paint();
  /**
  * @type {!SimController}
  * @private
  */
  this.simCtrl = new SimController(this.simCanvas, /*eventHandler=*/null,
      /*panModifier=*/{alt:false, control:false, meta:false, shift:false});
  const panzoom = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true,
      () => this.simView.setSimRect(this.simRect) );
  div_sim.appendChild(panzoom);
  /** @type {!ParameterBoolean} */
  this.panZoomParam = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.panZoomParam.setValue(true);
  const zoomCtrl = new CheckBoxControl(this.panZoomParam);
  const element = zoomCtrl.getElement();
  element.style.display = 'block';
  this.sim_controls.appendChild(element);

  // make a callback which continuously redraws the canvas.
  // So that if anything changes (like pan-zoom) we see the effect.
  /** @type {!Timer}
  * @private
  */
  this.timer = new Timer();
  const callback = () => this.simCanvas.paint();
  this.timer.setCallBack(callback);
  this.timer.startFiring();
};

/** Finds the specified element in the HTML Document; throws an error if element
* is not found.
* @param {!BlankSlateApp.elementIds} elem_ids  set of elementId names to look for
* @param {string} elementId specifies which elementId to get from elem_ids
* @return {!Element} the element from the current HTML Document
*/
static getElementById(elem_ids, elementId) {
  // note:  Google Closure Compiler will rename properties in advanced mode.
  // Therefore, we need to get the property with a string which is not renamed.
  // It is the difference between elem_ids.sim_applet vs. elem_ids['sim_applet'].
  const e = document.getElementById(elem_ids[elementId]);
  if (!goog.isObject(e)) {
    throw 'elementId not found: '+elementId;
  }
  return e;
};

/** @override */
getClassName() {
  return 'BlankSlateApp';
};

/** Define short-cut name replacement rules.  For example 'x' is replaced
* by 'myApp.x' when myName is 'myApp'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
defineNames(myName) {
  if (Util.ADVANCED)
    return;
  this.terminal.addWhiteList(myName);
  this.terminal.addRegex('simCanvas|terminal|axes|simCtrl|simView|displayList',
      myName+'.');
};

/**
* @param {string} script
* @param {boolean=} opt_output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @return {*}
* @export
*/
eval(script, opt_output) {
  try {
    return this.terminal.eval(script, opt_output);
  } catch(ex) {
    this.terminal.alertOnce(ex);
  }
};

/** Start the application running.
* @return {undefined}
* @export
*/
setup() {
  this.terminal.parseURLorRecall();
};

/** Start the application running.
* @return {undefined}
* @export
*/
start() {
};

} // end class

/**  Names of HTML div, form, and input element's to search for by using
* `document.getElementById()`.
* @typedef {{
*   sim_canvas: string,
*   sim_controls: string,
*   term_output: string,
*   term_input: string,
*   images_dir: string
* }}
*/
BlankSlateApp.elementIds;

/**
* @param {!BlankSlateApp.elementIds} elem_ids
* @return {!BlankSlateApp}
*/
function makeBlankSlateApp(elem_ids) {
  return new BlankSlateApp(elem_ids);
};
goog.exportSymbol('makeBlankSlateApp', makeBlankSlateApp);

exports = BlankSlateApp;
