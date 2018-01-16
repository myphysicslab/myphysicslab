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

goog.provide('myphysicslab.sims.experimental.GraphCalcApp');

goog.require('myphysicslab.lab.app.SimController');
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.graph.DisplayGraph');
goog.require('myphysicslab.lab.graph.GraphLine');
goog.require('myphysicslab.lab.graph.GraphPoint');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.LabCanvas');
goog.require('myphysicslab.lab.view.LabView');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.lab.view.VerticalAlign');

goog.require('myphysicslab.lab.graph.VarsHistory'); // for possible use in Terminal
goog.require('myphysicslab.lab.model.ExpressionVariable'); // for usage in Terminal
goog.require('myphysicslab.lab.model.FunctionVariable'); // for usage in Terminal
goog.require('myphysicslab.lab.util.ClockTask'); // for usage in Terminal
goog.require('myphysicslab.lab.util.GenericMemo'); // for usage in Terminal
goog.require('myphysicslab.lab.view.DisplayText'); // for usage in Terminal

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var DisplayAxes = lab.graph.DisplayAxes;
var DisplayGraph = lab.graph.DisplayGraph;
var DoubleRect = lab.util.DoubleRect;
var GenericObserver = lab.util.GenericObserver;
var GraphLine = lab.graph.GraphLine;
var GraphPoint = lab.graph.GraphPoint;
var HorizAlign = myphysicslab.lab.view.HorizAlign;
var LabCanvas = lab.view.LabCanvas;
var LabView = lab.view.LabView;
var ScreenRect = lab.view.ScreenRect;
var SimController = lab.app.SimController;
var SimView = lab.view.SimView;
var Terminal = lab.util.Terminal;
var Util = goog.module.get('myphysicslab.lab.util.Util');
var VarsList = lab.model.VarsList;
var Vector = lab.util.Vector;
var VerticalAlign = myphysicslab.lab.view.VerticalAlign;

/** GraphCalcApp is a simple graphing calculator demonstration using myphysicslab.

Recipe for Graphing
-------------------

+ make a LabCanvas with a SimView, connected to an HTML canvas
+ make a VarsList with 2 variables.
+ make a GraphLine which collects data from the VarsList
+ make a DisplayGraph to show the GraphLine
+ add DisplayGraph to SimView
+ add DisplayAxes to SimView
+ put the expression you want to graph into a string variable, it is a function of `x`.
+ in a loop, from `x=0` to `10`, by increment of 0.05:  put `x` into `vars[0]`;
    evaluate the expression to get `y`, put it into `vars[1]`;
    call `graph.memorize()`
+ call `canvas.paint()`

@todo: add AutoScale, so that full range is shown
@todo: add pan-zoom controls

* @param {!GraphCalcApp.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @export
*/
myphysicslab.sims.experimental.GraphCalcApp = function(elem_ids) {
  Util.setErrorHandler();
  Util.setImagesDir(elem_ids['images_dir']);
  /** The expression evaluating process uses Terminal.expand() to access
  * the 'x' variable which is a property of GraphCalcApp.
  * @type {number}
  * @private
  */
  this.x = 0;

  var div = GraphCalcApp.getElementById(elem_ids, 'graph_div');
  var canvas = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /**
  * @type {!LabCanvas}
  * @private
  */
  this.simCanvas = new LabCanvas(canvas, 'canvas1');
  this.simCanvas.setSize(800, 800);
  div.appendChild(this.simCanvas.getCanvas());

  var term_output = /** @type {!HTMLInputElement} */
      (GraphCalcApp.getElementById(elem_ids, 'term_output'));
  var term_input = /** @type {!HTMLInputElement} */
      (GraphCalcApp.getElementById(elem_ids, 'term_input'));
  /**
  * @type {!Terminal}
  * @private
  */
  this.terminal = new Terminal(term_input, term_output);
  Terminal.stdRegex(this.terminal);
  /**
  * @type {!VarsList}
  * @private
  */
  this.vars = new VarsList(['x', 'y'], ['x', 'y']);
  /**
  * @type {!DoubleRect}
  * @private
  */
  this.simRect = new DoubleRect(-10, -10, 10, 10);
  /**
  * @type {!SimView}
  * @private
  */
  this.simView = new SimView('graphView', this.simRect);
  // use FULL alignment so that we can specify the exact extent of the graph.
  this.simView.setHorizAlign(HorizAlign.FULL);
  this.simView.setVerticalAlign(VerticalAlign.FULL);
  this.simCanvas.addView(this.simView);
  var screenrect = this.simView.getScreenRect();
  /**
  * @type {!GraphLine}
  * @private
  */
  this.graphLine = new GraphLine('GRAPH_LINE', this.vars);
  this.graphLine.setXVariable(0);
  this.graphLine.setYVariable(1);
  this.graphLine.setHotSpotColor(''); // don't draw hot spot
  /**
  * @type {!DisplayGraph}
  * @private
  */
  this.graph = new DisplayGraph(this.graphLine);
  this.graph.setScreenRect(screenrect);
  this.simView.getDisplayList().add(this.graph);
  /**
  * @type {!DisplayAxes}
  * @private
  */
  this.axes = new DisplayAxes(this.simView.getCoordMap().screenToSimRect(screenrect));
  this.simView.getDisplayList().add(this.axes);
  // inform displayGraph when the screen rect changes.
  new GenericObserver(this.simView, goog.bind(function(evt) {
      if (evt.nameEquals(LabView.SCREEN_RECT_CHANGED)) {
        this.graph.setScreenRect(this.simView.getScreenRect());
      } else if (evt.nameEquals(LabView.SIM_RECT_CHANGED)) {
        var screenrect = this.simView.getScreenRect();
        var simrect = this.simView.getCoordMap().screenToSimRect(screenrect);
        this.axes.setSimRect(simrect);
      }
    }, this), 'adjust when screen rect changes');
  /**
  * @type {!SimController}
  * @private
  */
  this.simCtrl = new SimController(this.simCanvas, /*eventHandler=*/null,
      /*panModifier=*/{alt:true, control:false, meta:false, shift:false});
  this.terminal.setAfterEval(goog.bind(function() {
      this.graph.reset();
      this.simCanvas.paint();
    }, this));
};
var GraphCalcApp = myphysicslab.sims.experimental.GraphCalcApp;

/**  Names of HTML div, form, and input element's to search for by using
* `document.getElementById()`.
* @typedef {{
*   graph_div: string,
*   term_output: string,
*   term_input: string
* }}
*/
GraphCalcApp.elementIds;

/** Finds the specified element in the HTML Document; throws an error if element
* is not found.
* @param {!GraphCalcApp.elementIds} elem_ids  set of elementId names to look for
* @param {string} elementId specifies which elementId to get from elem_ids
* @return {!Element} the element from the current HTML Document
*/
GraphCalcApp.getElementById = function(elem_ids, elementId) {
  // note:  Google Closure Compiler will rename properties in advanced mode.
  // Therefore, we need to get the property with a string which is not renamed.
  // It is the difference between elem_ids.sim_applet vs. elem_ids['sim_applet'].
  var e = document.getElementById(elem_ids[elementId]);
  if (!goog.isObject(e)) {
    throw new Error('elementId not found: '+elementId);
  }
  return e;
};

/**
* @param {string} expr
* @param {number=} range1
* @param {number=} range2
* @param {number=} numPts
* @return {undefined}
*/
GraphCalcApp.prototype.plot = function(expr, range1, range2, numPts) {
    numPts = numPts || 200;
    var r = this.simView.getSimRect();
    if (!goog.isDef(range1)) {
      range1 = r.getLeft();
    }
    if (!goog.isDef(range2)) {
      range2 = r.getRight();
    }
    var incr = (range2 - range1)/numPts;
    if (incr <= 0) {
      this.terminal.println('ERROR calling plot: range2 must be greater than range1');
      return;
    }
    numPts += 1;  // extra point at end
    // incrSequence because we are entering new data.
    this.vars.incrSequence(0);
    this.vars.incrSequence(1);
    // The compiler changes the names of local variables, so we can't make a
    // local variable 'x', it will be named something else when eval executes.
    // We don't want to make a global 'x'.
    // Therefore we make an 'x' property of the application object, and add it
    // with terminal.addRegex (below in defineNames).
    // terminal.eval then changes 'x' to 'app.x' in the expression.
    this.x = range1;
    var y = NaN;
    for (var i=0; i<numPts; i++) {
      y = this.terminal.eval(expr, /*output=*/false);
      if (goog.isNumber(y) && isFinite(y)) {
        this.vars.setValue(0, this.x, /*continuous=*/true);
        this.vars.setValue(1, y, /*continuous=*/true);
        this.graphLine.memorize();
        this.x += incr;
      } else {
        this.terminal.println('ERROR in plot: result is not a number '+expr);
        return;
      }
    }
    this.simCanvas.paint();
};

/** Define short-cut name replacement rules.  For example 'x' is replaced
* by 'myApp.x' when myName is 'myApp'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
GraphCalcApp.prototype.defineNames = function(myName) {
  if (Util.ADVANCED)
    return;
  this.terminal.addWhiteList(myName);
  this.terminal.addRegex( 'simCanvas|vars|terminal|graph|graphLine|axes|plot'
      +'|simCtrl|simView|x',
      myName+'.');
};

/**
* @param {string} script
* @param {boolean=} opt_output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @return {*}
* @export
*/
GraphCalcApp.prototype.eval = function(script, opt_output) {
  try {
    return this.terminal.eval(script, opt_output);
  } catch(ex) {
    alert(ex);
  }
};

/** Set up the application.
* @return {undefined}
* @export
*/
GraphCalcApp.prototype.setup = function() {
  this.terminal.parseURLorRecall();
};

/** Start the application running.
* @return {undefined}
* @export
*/
GraphCalcApp.prototype.start = function() {
};

}); // goog.scope
