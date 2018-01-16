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

goog.provide('myphysicslab.lab.graph.GraphLine');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.graph.GraphPoint');
goog.require('myphysicslab.lab.graph.GraphStyle');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.CircularList');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.HistoryList');
goog.require('myphysicslab.lab.util.Memorizable');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.DrawingMode');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
var CircularList = myphysicslab.lab.util.CircularList;
var DrawingMode = myphysicslab.lab.view.DrawingMode;
var GenericEvent = myphysicslab.lab.util.GenericEvent;
var GraphPoint = myphysicslab.lab.graph.GraphPoint;
var GraphStyle = myphysicslab.lab.graph.GraphStyle;
var HistoryList = myphysicslab.lab.util.HistoryList;
var Memorizable = myphysicslab.lab.util.Memorizable;
var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var ParameterString = myphysicslab.lab.util.ParameterString;
const Util = goog.module.get('myphysicslab.lab.util.Util');
var VarsList = myphysicslab.lab.model.VarsList;

/** Collects data from a {@link VarsList}, storing it as a {@link HistoryList} composed
of {@link GraphPoint}s. The variables that this GraphLine is tracking are selected via
the methods {@link #setXVariable} and {@link #setYVariable}.

It is during the {@link #memorize} method that the new data is stored into the
HistoryList. For the `memorize` method to be called automatically, the GraphLine can be
registered with it's LabView by calling
{@link myphysicslab.lab.util.MemoList.html#addMemo} on the LabView, for example:

    simView.addMemo(graphLine);

### Graph Styles

The color, line thickness, and drawing mode (dots or line) can be changed via methods
{@link #setColor}, {@link #setLineWidth}, and {@link #setDrawingMode}.

The style used for drawing the graph can be changed at any time, without altering the
style used for points previously memorized. Changes to style affect only how the next
memorized points are displayed.

If you *do* want to change the style for the entire line, call {@link #resetStyle} which
will forget about all styles except the current style and apply that to the entire line.

Note: line dash is not a supported feature because the graph is drawn incrementally
as thousands of short line segments and the line dash starts over for each segment. It
might be possible to use the HTML `CanvasRenderingContext2D.lineDashOffset` property to
deal with this.


### Axes Names

To update the names of the axes shown in a
{@link myphysicslab.lab.graph.DisplayAxes DisplayAxes}, set up a
{@link myphysicslab.lab.util.GenericObserver GenericObserver} to watch for changes
to the variables tracked by the GraphLine, as in this example:

    new GenericObserver(graphLine, function(evt) {
      axes.setHorizName(graphLine.getXVarName());
      axes.setVerticalName(graphLine.getYVarName());
    });


### Polar or Logarithmic Graph

It is possible to create a polar or logarithmic type of graph by specifying transform
functions. For example, a polar graph could be created with

    graphLine.xTransform = function(x,y) { return y*Math.cos(x); };
    graphLine.yTransform = function(x,y) { return y*Math.sin(x); };

That transformation regards the X value as the angle and the Y value as the radius.

The transformation is done while memorizing points from the VarsList. The
HistoryList contains transformed points something like this:

    new GraphPoint(xTransform(x, y), yTransform(x, y));

Note that the transform functions do not affect how the graph axes are shown.


Parameters Created
------------------

+ ParameterNumber named `X_VARIABLE`, see {@link #setXVariable}.
  Has an extra `NONE` choice, which causes the GraphLine to have an empty HistoryList.

+ ParameterNumber named `Y_VARIABLE`, see {@link #setYVariable}.
  Has an extra `NONE` choice, which causes the GraphLine to have an empty HistoryList.

+ ParameterNumber named `LINE_WIDTH`, see {@link #setLineWidth}.

+ ParameterString named `DRAWING_MODE`, see {@link #setDrawingMode}.

+ ParameterString named `GRAPH_COLOR`, see {@link #setColor}.


Events Broadcast
----------------
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `RESET`, see {@link #reset}.



* @param {string} name
* @param {!VarsList} varsList the VarsList to collect data from
* @param {number=} opt_capacity number of GraphPoints to store
* @constructor
* @final
* @struct
* @extends {AbstractSubject}
* @implements {Memorizable}
* @implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.graph.GraphLine = function(name, varsList, opt_capacity) {
  AbstractSubject.call(this, name);
  /** The VarsList whose data this graph is displaying
  * @type {!VarsList}
  * @private
  */
  this.varsList_ = varsList;
  varsList.addObserver(this);
  /** index of horizontal variable in simulation's variables, or -1 to not
  * collect any X variable data
  * @type {number}
  * @private
  */
  this.xVar_ = -1;
  /** index of vertical variable in simulation's variables, or -1 to not
  * collect any X variable data
  * @type {number}
  * @private
  */
  this.yVar_ = -1;
  /** Parameter that represents which variable is shown on Y-axis, and the available
  * choices of variables.
  * @type {!ParameterNumber}
  * @private
  */
  this.yVarParam_ = new ParameterNumber(this, GraphLine.en.Y_VARIABLE,
      GraphLine.i18n.Y_VARIABLE,
      goog.bind(this.getYVariable, this), goog.bind(this.setYVariable, this))
      .setLowerLimit(-1);
  this.addParameter(this.yVarParam_);
  /** Parameter that represents which variable is shown on X-axis, and the available
  * choices of variables.
  * @type {!ParameterNumber}
  * @private
  */
  this.xVarParam_ = new ParameterNumber(this, GraphLine.en.X_VARIABLE,
      GraphLine.i18n.X_VARIABLE,
      goog.bind(this.getXVariable, this), goog.bind(this.setXVariable, this))
      .setLowerLimit(-1);
  this.addParameter(this.xVarParam_);
  this.buildMenu();
  /** Holds the most recent data points drawn, to enable redrawing when needed.
  * @type {!CircularList<!GraphPoint>}
  * @private
  */
  this.dataPoints_  = new CircularList(opt_capacity || 100000);
  /** The color to draw the graph with, a CSS3 color string.
  * @type {string}
  * @private
  */
  this.drawColor_ = 'lime';
  /** whether to draw the graph with lines or dots
  * @type {!DrawingMode}
  * @private
  */
  this.drawMode_ = DrawingMode.LINES;
  /** Thickness to use when drawing the line, in screen coordinates, so a unit
  * is a screen pixel.
  * @type {number}
  * @private
  */
  this.lineWidth_ = 1.0;
  /** The color to draw the hot spot (most recent point) with, a CSS3 color string.
  * @type {string}
  * @private
  */
  this.hotSpotColor_ = 'red';
  /** GraphStyle's for display, ordered by index in dataPoints list.
  * There can be multiple GraphStyle entries for the same index, the latest one
  * in the list takes precedence.  We ensure there is always at least one GraphStyle
  * in the list.
  * @type {!Array<!GraphStyle>}
  * @private
  */
  this.styles_ = [];
  // ensure there is always at least one GraphStyle
  this.addGraphStyle();
  /** Function that gives the transformed the X value.
  * @type {function(number, number): number}
  */
  this.xTransform = function(x, y) { return x; };
  /** Function that gives the transformed the Y value.
  * @type {function(number, number): number}
  */
  this.yTransform = function(x, y) { return y; };
  this.addParameter(new ParameterNumber(this, GraphLine.en.LINE_WIDTH,
      GraphLine.i18n.LINE_WIDTH,
      goog.bind(this.getLineWidth, this), goog.bind(this.setLineWidth, this)));
  // Need a special 'setter' because `setDrawingMode` takes an argument of
  // the enum type `DrawingMode`, not of type `number`.
  this.addParameter(new ParameterString(this, GraphLine.en.DRAWING_MODE,
      GraphLine.i18n.DRAWING_MODE,
      goog.bind(this.getDrawingMode, this),
      goog.bind(function(s) { this.setDrawingMode(DrawingMode.stringToEnum(s)); },
          this),
      DrawingMode.getChoices(), DrawingMode.getValues()));
  this.addParameter(new ParameterString(this, GraphLine.en.GRAPH_COLOR,
      GraphLine.i18n.GRAPH_COLOR,
      goog.bind(this.getColor, this), goog.bind(this.setColor, this)));
};

var GraphLine = myphysicslab.lab.graph.GraphLine;
goog.inherits(GraphLine, AbstractSubject);

if (!Util.ADVANCED) {
  /** @override */
  GraphLine.prototype.toString = function() {
    var s = this.toStringShort().slice(0, -1)
        +', drawColor_:"'+this.drawColor_+'"'
        +', lineWidth_: '+Util.NF(this.lineWidth_)
        +', drawMode_: '+DrawingMode.enumToChoice(this.drawMode_)
        +', hotSpotColor_:"'+this.hotSpotColor_+'"'
        +', styles_.length: '+Util.NF(this.styles_.length)
        +', varsList: '+this.varsList_.toStringShort()
        +', dataPoints_: '+this.dataPoints_;
    return s + GraphLine.superClass_.toString.call(this);
  };

  /** @override */
  GraphLine.prototype.toStringShort = function() {
    return GraphLine.superClass_.toStringShort.call(this).slice(0, -1)
        +', xVar: ' + Util.NF(this.xVar_)
        + ', yVar: '+ Util.NF(this.yVar_)
        +'}';
  };
};

/** @override */
GraphLine.prototype.getClassName = function() {
  return 'GraphLine';
};

/** Event broadcast when {@link #reset} is called.
* @type {string}
* @const
*/
GraphLine.RESET = 'RESET';

/** Adds a GraphStyle with the current color, draw mode, and line width, corresponding
to the current end point of the HistoryList.
* @return {undefined}
* @private
*/
GraphLine.prototype.addGraphStyle = function() {
  this.styles_.push(new GraphStyle(this.dataPoints_.getEndIndex() + 1,
      this.drawMode_, this.drawColor_, this.lineWidth_));
};

/** Modify the choices in the X and Y variable Parameters to match those of the
VarsList, plus add the `NONE` choice.
@return {undefined}
@private
*/
GraphLine.prototype.buildMenu = function() {
  // add the NONE option to front of the list
  var varNames = [GraphLine.i18n.NONE];
  var vals = [-1];
  for (var i=0, len=this.varsList_.numVariables(); i<len; i++) {
    varNames.push(this.varsList_.getVariable(i).getName(/*localized=*/true));
    vals.push(i);
  }
  this.yVarParam_.setChoices(varNames, vals);
  this.xVarParam_.setChoices(varNames, vals);
};

/** Returns true if the object is likely a GraphLine. Only works under simple
* compilation, intended for interactive non-compiled code.
* @param {*} obj the object of interest
* @return {boolean} true if the object is likely a GraphLine
*/
GraphLine.isDuckType = function(obj) {
  if (obj instanceof GraphLine) {
    return true;
  }
  if (Util.ADVANCED) {
    return false;
  }
  return goog.isObject(obj) && obj.setXVariable !== undefined
    && obj.setYVariable !== undefined
    && obj.setColor !== undefined
    && obj.setLineWidth !== undefined
    && obj.setAxes !== undefined
    && obj.getVarsList !== undefined
    && obj.reset !== undefined
    && obj.getGraphStyle !== undefined
};

/** Returns the color used when drawing the graph.
@return {string} the color used when drawing the graph
*/
GraphLine.prototype.getColor = function() {
  return this.drawColor_;
};

/** Returns the drawing mode of the graph: dots or lines. See {@link DrawingMode}.
@return {!DrawingMode} the DrawingMode to draw this graph with
*/
GraphLine.prototype.getDrawingMode = function() {
  return this.drawMode_;
};

/** Returns the HistoryList of GraphPoints.
* @return {!HistoryList<!GraphPoint>}
*/
GraphLine.prototype.getGraphPoints = function() {
  return this.dataPoints_;
};

/** Returns the GraphStyle corresponding to the position in the list of GraphPoints.
@param {number} index  the index number in list of GraphPoints
@return {!GraphStyle} the GraphStyle for that position
*/
GraphLine.prototype.getGraphStyle = function(index) {
  var styles = this.styles_;
  if (styles.length == 0) {
    throw new Error('graph styles list is empty');
  }
  // Find the latest style in the styles list with an index less than or
  // equal to the given index.
  var last = styles[0];
  for (var i=1, len=styles.length; i<len; i++) {
    var s = styles[i];
    // assert that indices in style list are non-decreasing
    goog.asserts.assert(last.index_ <= s.index_);
    if (s.index_ > index)
      break;
    last = s;
  }
  goog.asserts.assertObject(last);
  return last;
};

/** Returns the color used when drawing the hot spot (most recent point).
@return {string} the color used when drawing the hot spot (most recent point)
*/
GraphLine.prototype.getHotSpotColor = function() {
  return this.hotSpotColor_;
};

/** Returns thickness to use when drawing the line, in screen coordinates, so a unit
* is a screen pixel.
* @return {number} thickness of line in screen coordinates
*/
GraphLine.prototype.getLineWidth = function() {
  return this.lineWidth_;
};

/** Returns the VarsList that this GraphLine is collecting from
@return {!VarsList} the VarsList that this is collecting from.
*/
GraphLine.prototype.getVarsList = function() {
  return this.varsList_;
};

/** Returns the index in the VarsList of the X variable being collected.
@return {number} the index of X variable in the VarsList, or  -1 if no X variable
    is being collected.
*/
GraphLine.prototype.getXVariable = function() {
  return this.xVar_;
};

/** Returns localized X variable name.
@return {string} variable name or empty string in case index is -1
*/
GraphLine.prototype.getXVarName = function() {
  return this.xVar_ > -1 ?
      this.varsList_.getVariable(this.xVar_).getName(/*localized=*/true) : '';
};

/** Returns the index in the VarsList of the Y variable being collected.
@return {number} the index of Y variable in the VarsList, or  -1 if no Y variable
    is being collected.
*/
GraphLine.prototype.getYVariable = function() {
  return this.yVar_;
};

/** Returns localized Y variable name.
@return {string} variable name or empty string in case index is -1
*/
GraphLine.prototype.getYVarName = function() {
  return this.yVar_ > -1 ?
      this.varsList_.getVariable(this.yVar_).getName(/*localized=*/true) : '';
};

/** @override */
GraphLine.prototype.memorize = function() {
  if (this.xVar_ > -1 && this.yVar_ > -1) {
    var xVar = this.varsList_.getVariable(this.xVar_);
    var yVar = this.varsList_.getVariable(this.yVar_);
    var x = xVar.getValue();
    var y = yVar.getValue();
    var nextX = this.xTransform(x, y);
    var nextY = this.yTransform(x, y);
    var seqX = xVar.getSequence();
    var seqY = yVar.getSequence();
    var newPoint = new GraphPoint(nextX, nextY, seqX, seqY);
    // only store if the new point is different from the last point
    var last = this.dataPoints_.getEndValue();
    if (last == null || !last.equals(newPoint)) {
      this.dataPoints_.store(newPoint);
    }
  }
};

/** @override */
GraphLine.prototype.observe =  function(event) {
  if (event.getSubject() == this.varsList_) {
    if (event.nameEquals(VarsList.VARS_MODIFIED)) {
      this.buildMenu();
    }
  }
}

/** Forgets any memorized data and styles, starts from scratch.
* @return {undefined}
*/
GraphLine.prototype.reset = function() {
  this.dataPoints_.reset();
  this.resetStyle();
  this.broadcast(new GenericEvent(this, GraphLine.RESET));
};

/** Forgets any memorized styles, records the current color, draw mode, and line width
* as the single starting style. Note that you may need to call
* {@link myphysicslab.lab.graph.DisplayGraph#reset} to see this change take effect.
* @return {undefined}
*/
GraphLine.prototype.resetStyle = function() {
  this.styles_ = [];
  // ensure there is always at least one GraphStyle
  this.addGraphStyle();
};

/** Sets the color to use when drawing the graph. Applies only to portions of graph
memorized after this time.
@param {string} color the color to use when drawing the graph, a CSS3 color string.
*/
GraphLine.prototype.setColor = function(color) {
  if (this.drawColor_ != color) {
    this.drawColor_ = color;
    this.addGraphStyle();
    this.broadcastParameter(GraphLine.en.GRAPH_COLOR);
  }
};

/** Sets whether to draw the graph with dots or lines. Applies only to portions of graph
memorized after this time.
@param {!DrawingMode} value the DrawingMode (dots or lines) to draw this graph with.
@throws {!Error} if the value does not represent a valid DrawingMode
*/
GraphLine.prototype.setDrawingMode = function(value) {
  var dm = DrawingMode.stringToEnum(value);
  goog.asserts.assert(dm == value);
  if (this.drawMode_ != dm) {
    this.drawMode_ = dm;
    this.addGraphStyle();
  }
  this.broadcastParameter(GraphLine.en.DRAWING_MODE);
};

/** Sets the color to use when drawing the hot spot (most recent point).
Set this to empty string to not draw the hot spot.
@param {string} color the color to use when drawing the hot spot (most recent point)
*/
GraphLine.prototype.setHotSpotColor = function(color) {
  this.hotSpotColor_ = color;
};

/** Sets thickness to use when drawing the line, in screen coordinates, so a unit is a
screen pixel. Applies only to portions of graph memorized after this time.
* @param {number} value thickness of line in screen coordinates
*/
GraphLine.prototype.setLineWidth = function(value) {
  if (Util.veryDifferent(value, this.lineWidth_)) {
    this.lineWidth_ = value;
    this.addGraphStyle();
    this.broadcastParameter(GraphLine.en.LINE_WIDTH);
  }
};

/** Sets the variable from which to collect data for the X value of the graph. Starts
over with a new HistoryList. Broadcasts the ParameterNumber named
`GraphLine.i18n.X_VARIABLE`.
@param {number} xVar the index of X variable in the VarsList, or -1 to not
    collect any X variable data and have an empty HistoryList.
*/
GraphLine.prototype.setXVariable = function(xVar) {
  if (xVar < -1 || xVar > this.varsList_.numVariables()-1) {
    throw new Error('setXVariable bad index '+xVar);
  }
  if (xVar != this.xVar_) {
    this.xVar_ = xVar;
    this.reset();
    this.broadcastParameter(GraphLine.en.X_VARIABLE);
  }
};

/** Sets the variable from which to collect data for the Y value of the graph. Starts
over with a new HistoryList. Broadcasts the ParameterNumber named
`GraphLine.i18n.Y_VARIABLE`.
@param {number} yVar the index of Y variable in the VarsList, or -1 to not
    collect any Y variable data and have an empty HistoryList.
*/
GraphLine.prototype.setYVariable = function(yVar) {
  if (yVar < -1 || yVar > this.varsList_.numVariables()-1) {
    throw new Error('setYVariable bad index '+yVar);
  }
  if (yVar != this.yVar_) {
    this.yVar_ = yVar;
    this.reset();
    this.broadcastParameter(GraphLine.en.Y_VARIABLE);
  }
};

/** Set of internationalized strings.
@typedef {{
  DRAWING_MODE: string,
  GRAPH_COLOR: string,
  GRAPH_DRAW_MODE: string,
  GRAPH_POINTS: string,
  LINE_WIDTH: string,
  X_VARIABLE: string,
  Y_VARIABLE: string,
  CLEAR_GRAPH: string,
  NONE: string
  }}
*/
GraphLine.i18n_strings;

/**
@type {GraphLine.i18n_strings}
*/
GraphLine.en = {
  DRAWING_MODE: 'draw mode',
  GRAPH_COLOR: 'graph color',
  GRAPH_DRAW_MODE: 'graph draw mode',
  GRAPH_POINTS: 'graph points',
  LINE_WIDTH: 'draw width',
  X_VARIABLE: 'X variable',
  Y_VARIABLE: 'Y variable',
  CLEAR_GRAPH: 'clear graph',
  NONE: '-none-'
};

/**
@private
@type {GraphLine.i18n_strings}
*/
GraphLine.de_strings = {
  DRAWING_MODE: 'Zeichnenart',
  GRAPH_COLOR: 'Graph Farbe',
  GRAPH_DRAW_MODE: 'Graph Zeichnenart',
  GRAPH_POINTS: 'Punkteanzahl',
  LINE_WIDTH: 'Zeichenbreite',
  X_VARIABLE: 'X Variable',
  Y_VARIABLE: 'Y Yariable',
  CLEAR_GRAPH: 'Graph erneuern',
  NONE: '-keine-'
};

/** Set of internationalized strings.
@type {GraphLine.i18n_strings}
*/
GraphLine.i18n = goog.LOCALE === 'de' ? GraphLine.de_strings :
    GraphLine.en;

});  // goog.scope
