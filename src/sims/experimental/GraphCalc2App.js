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

goog.module('myphysicslab.sims.experimental.GraphCalc2App');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const DisplayAxes = goog.require('myphysicslab.lab.graph.DisplayAxes');
const DisplayGraph = goog.require('myphysicslab.lab.graph.DisplayGraph');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const EasyScriptParser = goog.require('myphysicslab.lab.util.EasyScriptParser');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const GraphLine = goog.require('myphysicslab.lab.graph.GraphLine');
const GraphPoint = goog.require('myphysicslab.lab.graph.GraphPoint');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const LabView = goog.require('myphysicslab.lab.view.LabView');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ScreenRect = goog.require('myphysicslab.lab.view.ScreenRect');
const SimController = goog.require('myphysicslab.lab.app.SimController');
const SimView = goog.require('myphysicslab.lab.view.SimView');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

/** GraphCalc2App is a simple graphing calculator demonstration using myphysicslab.
Includes a SliderControl that sets a parameter "b" which can be used in the graph
equation.

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
*/
class GraphCalc2App extends AbstractSubject {
/**
* @param {!GraphCalc2App.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {string=} opt_name name of this as a Subject
*/
constructor(elem_ids, opt_name) {
  super(opt_name || 'GraphCalc2App');
  Util.setErrorHandler();
  Util.setImagesDir(elem_ids['images_dir']);
  /** The expression evaluating process uses Terminal.expand() to access
  * the 'x' variable which is a property of GraphCalc2App.
  * @type {number}
  * @private
  */
  this.x = 0;
  /**
  * @type {number}
  * @private
  */
  this.bParam_ = goog.isNumber(elem_ids.b_value) ? elem_ids.b_value : 0;
  /**
  * @type {string}
  * @private
  */
  this.expr_ = '';

  var div = GraphCalc2App.getElementById(elem_ids, 'graph_div');
  if (div == null) {
    throw new Error('graph_div not found');
  }
  var canvas = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /**
  * @type {!LabCanvas}
  * @private
  */
  this.simCanvas = new LabCanvas(canvas, 'canvas1');
  this.simCanvas.setSize(800, 800);
  div.appendChild(this.simCanvas.getCanvas());

  /** div for graph controls
  * @type {?HTMLElement}
  */
  this.graph_controls = GraphCalc2App.getElementById(elem_ids, 'graph_controls');

  var term_output = /** @type {?HTMLInputElement} */
      (GraphCalc2App.getElementById(elem_ids, 'term_output'));
  var term_input = /** @type {?HTMLInputElement} */
      (GraphCalc2App.getElementById(elem_ids, 'term_input'));
  /**
  * @type {!Terminal}
  * @private
  */
  this.terminal = new Terminal(term_input, term_output);
  this.terminal.setVerbose(true);
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

  /** @type {!ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, GraphCalc2App.en.B_PARAM,
      GraphCalc2App.i18n.B_PARAM,
      goog.bind(this.getBParam, this), goog.bind(this.setBParam, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY)
      .setSignifDigits(3));
  var b_max = goog.isNumber(elem_ids.b_max) ? elem_ids.b_max : 10;
  var b_min = goog.isNumber(elem_ids.b_min) ? elem_ids.b_min : -10;
  var b_multiply = goog.isBoolean(elem_ids.b_multiply) ? elem_ids.b_multiply : false;
  var b_increments = goog.isNumber(elem_ids.b_increments) ? elem_ids.b_increments : 200;
  this.addControl(new SliderControl(pn, b_min, b_max, /*multiply=*/b_multiply,
      /*increments=*/b_increments));

  this.easyScript = new EasyScriptParser([ this, this.simCanvas ]);
  this.terminal.setParser(this.easyScript);
};

/** @override */
getClassName() {
  return 'GraphCalc2App';
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
addControl(control) {
  if (this.graph_controls != null) {
    var element = control.getElement();
    element.style.display = 'block';
    this.graph_controls.appendChild(element);
  }
  return control;
};

/** Define short-cut name replacement rules.  For example 'x' is replaced
* by 'myApp.x' when myName is 'myApp'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
defineNames(myName) {
  this.terminal.addWhiteList(myName);
  this.terminal.addRegex( 'simCanvas|vars|terminal|graph|graphLine|axes|plot'
      +'|simCtrl|simView|x',
      myName+'.');
  this.terminal.addRegex2(new RegExp('\\bb\\b', 'g'), myName+'.getBParam()');
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


/** Finds the specified element in the HTML Document; returns null if element
* is not found.
* @param {!GraphCalc2App.elementIds} elem_ids  set of elementId names to examine
* @param {string} elementId specifies which element to get from elem_ids
* @return {?HTMLElement} the element from the current HTML Document, or null if
*     not found
*/
static getElementById(elem_ids, elementId) {
  // note:  Google Closure Compiler will rename properties in advanced mode,
  // but indexing with a string is never renamed.
  // It is the difference between elem_ids.sim_applet vs. elem_ids['sim_applet'].
  var e_id = elem_ids[elementId];
  if (!goog.isString(e_id)) {
    throw new Error('unknown elementId: '+elementId);
  }
  return /** @type {!HTMLElement} */(document.getElementById(e_id));
};

/**
* @param {string=} expr
* @param {number=} range1
* @param {number=} range2
* @param {number=} numPts
* @return {undefined}
* @export
*/
plot(expr, range1, range2, numPts) {
  expr = this.expr_ = expr || this.expr_;
  numPts = numPts || 1000;
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
  if (expr) {
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
  }
  this.graph.reset();
  this.simCanvas.paint();
};

/** Set up the application.
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

/** Return value of b parameter
@return {number} value of b parameter
@export
*/
getBParam() {
  return this.bParam_;
};

/** Set value of b parameter
@param {number} value value of b parameter
@export
*/
setBParam(value) {
  if (Util.veryDifferent(value, this.bParam_)) {
    this.bParam_ = value;
    this.graphLine.reset();
    this.plot();
    this.broadcastParameter(GraphCalc2App.en.B_PARAM);
  }
};

} // end class

/**  Names of HTML div, form, and input element's to search for by using
* `document.getElementById()`.
* @typedef {{
*   graph_div: string,
*   graph_controls: string,
*   term_output: string,
*   term_input: string,
*   b_max: number,
*   b_min: number,
*   b_multiply: boolean,
*   b_increments: number,
*   b_value: number
* }}
*/
GraphCalc2App.elementIds;

/** Set of internationalized strings.
@typedef {{
  B_PARAM: string
  }}
*/
GraphCalc2App.i18n_strings;

/**
@type {GraphCalc2App.i18n_strings}
*/
GraphCalc2App.en = {
  B_PARAM: 'b'
};

/**
@private
@type {GraphCalc2App.i18n_strings}
*/
GraphCalc2App.de_strings = {
  B_PARAM: 'b'
};

/** Set of internationalized strings.
@type {GraphCalc2App.i18n_strings}
*/
GraphCalc2App.i18n = goog.LOCALE === 'de' ? GraphCalc2App.de_strings :
    GraphCalc2App.en;

/**
* @param {!GraphCalc2App.elementIds} elem_ids
* @return {!GraphCalc2App}
*/
function makeGraphCalc2App(elem_ids) {
  return new GraphCalc2App(elem_ids);
};
goog.exportSymbol('makeGraphCalc2App', makeGraphCalc2App);

exports = GraphCalc2App;
