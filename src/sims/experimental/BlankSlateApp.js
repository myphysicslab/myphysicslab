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
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.model.ModifiedEuler');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.RungeKutta');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayClock');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.DisplayText');
goog.require('myphysicslab.lab.graph.EnergyBarGraph');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.LabCanvas');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.lab.view.VerticalAlign');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.springs.SingleSpringSim');

goog.scope(function() {

var CommonControls = myphysicslab.sims.layout.CommonControls;
var DisplayClock = myphysicslab.lab.view.DisplayClock;
var DisplayLine = myphysicslab.lab.view.DisplayLine;
var DisplayShape = myphysicslab.lab.view.DisplayShape;
var DisplaySpring = myphysicslab.lab.view.DisplaySpring;
var DisplayText = myphysicslab.lab.view.DisplayText;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var EnergyBarGraph = myphysicslab.lab.graph.EnergyBarGraph;
var HorizAlign = myphysicslab.lab.view.HorizAlign;
var LabCanvas = myphysicslab.lab.view.LabCanvas;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var PointMass = myphysicslab.lab.model.PointMass;
var ScreenRect = myphysicslab.lab.view.ScreenRect;
var SimController = myphysicslab.lab.app.SimController;
var SimView = myphysicslab.lab.view.SimView;
var Spring = myphysicslab.lab.model.Spring;
var DisplayAxes = myphysicslab.lab.graph.DisplayAxes;
var Terminal = myphysicslab.lab.util.Terminal;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;
var VerticalAlign = myphysicslab.lab.view.VerticalAlign;

/** BlankSlateApp has a LabCanvas and Terminal, and let's you experiment building
things with scripts.
* @param {!BlankSlateApp.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @export
*/
myphysicslab.sims.experimental.BlankSlateApp = function(elem_ids) {
  UtilityCore.setErrorHandler();
  UtilityCore.setImagesDir(elem_ids['images_dir']);
  var div = BlankSlateApp.getElementById(elem_ids, 'sim_canvas');
  var canvas = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /**
  * @type {!myphysicslab.lab.view.LabCanvas}
  * @private
  */
  this.simCanvas = new LabCanvas(canvas, 'canvas1');
  this.simCanvas.setSize(500, 300);
  div.appendChild(this.simCanvas.getCanvas());

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
  /**
  * @type {!myphysicslab.lab.view.SimView}
  * @private
  */
  this.simView = new SimView('simView', new DoubleRect(-10, -6, 10, 6));
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
      /*panModifier=*/{alt:true, control:false, meta:false, shift:false});
};
var BlankSlateApp = myphysicslab.sims.experimental.BlankSlateApp;

/**  Names of HTML div, form, and input element's to search for by using
* `document.getElementById()`.
* @typedef {{
*   sim_canvas: string,
*   term_output: string,
*   term_input: string
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
