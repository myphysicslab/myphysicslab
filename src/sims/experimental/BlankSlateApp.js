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

goog.provide('myphysicslab.sims.experimental.BlankSlateApp');

goog.require('myphysicslab.lab.app.SimController');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.graph.EnergyBarGraph');
goog.require('myphysicslab.lab.model.ModifiedEuler');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.RungeKutta');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Timer');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayClock');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.DisplayText');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.LabCanvas');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.lab.view.VerticalAlign');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.springs.SingleSpringSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractSubject = lab.util.AbstractSubject;
var CheckBoxControl = lab.controls.CheckBoxControl;
var CommonControls = sims.common.CommonControls;
var DisplayAxes = lab.graph.DisplayAxes;
var DisplayClock = lab.view.DisplayClock;
var DisplayLine = lab.view.DisplayLine;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = lab.view.DisplaySpring;
var DisplayText = lab.view.DisplayText;
var DoubleRect = lab.util.DoubleRect;
var EnergyBarGraph = lab.graph.EnergyBarGraph;
var GenericObserver = lab.util.GenericObserver;
var HorizAlign = lab.view.HorizAlign;
var LabCanvas = lab.view.LabCanvas;
var NF5 = lab.util.UtilityCore.NF5;
var ParameterBoolean = lab.util.ParameterBoolean;
var PointMass = lab.model.PointMass;
var ScreenRect = lab.view.ScreenRect;
var SimController = lab.app.SimController;
var SimView = lab.view.SimView;
var Spring = lab.model.Spring;
var Terminal = lab.util.Terminal;
var Timer = lab.util.Timer;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;
var VerticalAlign = lab.view.VerticalAlign;

/** BlankSlateApp has a LabCanvas and Terminal, and let's you experiment building
things with scripts.
* @param {!BlankSlateApp.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @extends {AbstractSubject}
* @final
* @struct
* @export
*/
myphysicslab.sims.experimental.BlankSlateApp = function(elem_ids) {
  UtilityCore.setErrorHandler();
  AbstractSubject.call(this, 'APP');
  UtilityCore.setImagesDir(elem_ids['images_dir']);
  var div_sim = BlankSlateApp.getElementById(elem_ids, 'sim_canvas');
  // 'relative' allows absolute positioning of icon controls over the canvas
  div_sim.style.position = 'relative';
  var canvas = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /**
  * @type {!myphysicslab.lab.view.LabCanvas}
  * @private
  */
  this.simCanvas = new LabCanvas(canvas, 'canvas1');
  this.simCanvas.setSize(500, 500);
  div_sim.appendChild(this.simCanvas.getCanvas());
  /** div for sim controls
  * @type {!Element}
  */
  this.sim_controls = BlankSlateApp.getElementById(elem_ids, 'sim_controls');

  var term_output = /** @type {!HTMLInputElement} */
      (BlankSlateApp.getElementById(elem_ids, 'term_output'));
  var term_input = /** @type {!HTMLInputElement} */
      (BlankSlateApp.getElementById(elem_ids, 'term_input'));
  /**
  * @type {!myphysicslab.lab.util.Terminal}
  * @private
  */
  this.terminal = new Terminal(term_input, term_output);
  Terminal.stdRegex(this.terminal);
  this.terminal.setAfterEval(goog.bind(this.simCanvas.paint, this.simCanvas));

  /** @type {!lab.util.DoubleRect} */
  this.simRect = new DoubleRect(-6, -6, 6, 6);
  /**
  * @type {!myphysicslab.lab.view.SimView}
  * @private
  */
  this.simView = new SimView('simView', this.simRect);
  this.simCanvas.addView(this.simView);
  this.displayList = this.simView.getDisplayList();
  /**
  * @type {!myphysicslab.lab.graph.DisplayAxes}
  * @private
  */
  this.axes = CommonControls.makeAxes(this.simView);
  this.simCanvas.paint();
  /**
  * @type {!myphysicslab.lab.app.SimController}
  * @private
  */
  this.simCtrl = new SimController(this.simCanvas, /*eventHandler=*/null,
      /*panModifier=*/{alt:false, control:false, meta:false, shift:false});
  var panzoom = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true,
      goog.bind(function () { this.simView.setSimRect(this.simRect); }, this));
  div_sim.appendChild(panzoom);
  /** @type {!ParameterBoolean} */
  this.panZoomParam = CommonControls.makeShowPanZoomParam(panzoom, this);
  this.panZoomParam.setValue(true);
  var zoomCtrl = new CheckBoxControl(this.panZoomParam);
  var element = zoomCtrl.getElement();
  element.style.display = 'block';
  this.sim_controls.appendChild(element);

  // make a callback which continuously redraws the canvas.
  // So that if anything changes (like pan-zoom) we see the effect.
  this.timer = new Timer();
  var callback = goog.bind(function () {
      this.simCanvas.paint();
      this.timer.fireAfter();
  }, this);
  this.timer.setCallBack(callback);
  this.timer.startFiring();
};
var BlankSlateApp = myphysicslab.sims.experimental.BlankSlateApp;
goog.inherits(BlankSlateApp, AbstractSubject);

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

/** Finds the specified element in the HTML Document; throws an error if element
* is not found.
* @param {!BlankSlateApp.elementIds} elem_ids  set of elementId names to look for
* @param {string} elementId specifies which elementId to get from elem_ids
* @return {!Element} the element from the current HTML Document
*/
BlankSlateApp.getElementById = function(elem_ids, elementId) {
  // note:  Google Closure Compiler will rename properties in advanced mode.
  // Therefore, we need to get the property with a string which is not renamed.
  // It is the difference between elem_ids.sim_applet vs. elem_ids['sim_applet'].
  var e = document.getElementById(elem_ids[elementId]);
  if (!goog.isObject(e)) {
    throw new Error('elementId not found: '+elementId);
  }
  return e;
};

/** @inheritDoc */
BlankSlateApp.prototype.getClassName = function() {
  return 'BlankSlateApp';
};

/** Define short-cut name replacement rules.  For example 'x' is replaced
* by 'myApp.x' when myName is 'myApp'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
BlankSlateApp.prototype.defineNames = function(myName) {
  if (UtilityCore.ADVANCED)
    return;
  this.terminal.addWhiteList(myName);
  this.terminal.addRegex('simCanvas|terminal|axes|simCtrl|simView|displayList',
      myName);
};

/**
* @param {string} script
* @return {*}
* @export
*/
BlankSlateApp.prototype.eval = function(script) {
  try {
    return this.terminal.eval(script);
  } catch(ex) {
    alert(ex);
  }
};

/** Start the application running.
* @return {undefined}
* @export
*/
BlankSlateApp.prototype.setup = function() {
  this.terminal.parseURLorRecall();
};

/** Start the application running.
* @return {undefined}
* @export
*/
BlankSlateApp.prototype.start = function() {
};

}); // goog.scope
