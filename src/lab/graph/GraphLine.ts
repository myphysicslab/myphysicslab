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

import { AbstractSubject } from '../util/AbstractSubject.js';
import { HistoryList, CircularList } from '../util/HistoryList.js';
import { DrawingMode, DrawingModeChoices, DrawingModeValues }
    from '../view/DrawingMode.js';
import { GenericEvent, Observer, ParameterNumber, ParameterString, SubjectEvent, Subject }
    from '../util/Observe.js';
import { GenericVector } from '../util/Vector.js';
import { Memorizable } from '../util/Memo.js';
import { Util } from '../util/Util.js';
import { VarsList } from '../model/VarsList.js';

/** Collects data from a {@link VarsList}, storing it as a {@link HistoryList} composed
of {@link GraphPoint}s. The variables that this GraphLine is tracking are selected via
the methods {@link GraphLine.setXVariable} and {@link GraphLine.setYVariable}. A
GraphLine is typically shown by a {@link lab/graph/DisplayGraph.DisplayGraph}.

It is during the {@link GraphLine.memorize} method that the new data is stored into the
HistoryList. For the `memorize` method to be called automatically, the GraphLine can be
registered with it's SimView by calling
{@link lab/util/Memo.MemoList.addMemo} on the SimView, for example:
```js
simView.addMemo(graphLine);
```

### Graph Styles

The color, line thickness, and drawing mode (dots or line) can be changed via methods
{@link GraphLine.setColor}, {@link GraphLine.setLineWidth},
and {@link GraphLine.setDrawingMode}.

The style used for drawing the graph can be changed at any time, without altering the
style used for points previously memorized. Changes to style affect only how the next
memorized points are displayed.

If you *do* want to change the style for the entire line, call
{@link GraphLine.resetStyle} which will forget about all styles except the current
style and apply that to the entire line.

Note: line dash is not a supported feature because the graph is drawn incrementally
as thousands of short line segments and the line dash starts over for each segment. It
might be possible to use the HTML `CanvasRenderingContext2D.lineDashOffset` property to
deal with this.

### Axes Names

To update the names of the axes shown in a
{@link lab/graph/DisplayAxes.DisplayAxes}, set up a
{@link lab/util/Observe.GenericObserver} to watch for changes
to the variables tracked by the GraphLine, as in this example:
```js
new GenericObserver(graphLine, evt => {
  axes.setHorizName(graphLine.getXVarName());
  axes.setVerticalName(graphLine.getYVarName());
});
```

### Polar or Logarithmic Graph

It is possible to create a polar or logarithmic type of graph by specifying transform
functions. For example, a polar graph could be created with
```js
graphLine.xTransform = function(x,y) { return y*Math.cos(x); };
graphLine.yTransform = function(x,y) { return y*Math.sin(x); };
```

That transformation regards the X value as the angle and the Y value as the radius.

The transformation is done while memorizing points from the VarsList. The
HistoryList contains transformed points something like this:
```js
new GraphPoint(xTransform(x, y), yTransform(x, y));
```

Note that the transform functions do not affect how the graph axes are shown.

Parameters Created
------------------

+ ParameterNumber named `X_VARIABLE`, see {@link GraphLine.setXVariable}.
  Has an extra `NONE` choice, which causes the GraphLine to have an empty HistoryList.

+ ParameterNumber named `Y_VARIABLE`, see {@link GraphLine.setYVariable}.
  Has an extra `NONE` choice, which causes the GraphLine to have an empty HistoryList.

+ ParameterNumber named `LINE_WIDTH`, see {@link GraphLine.setLineWidth}.

+ ParameterString named `DRAWING_MODE`, see {@link GraphLine.setDrawingMode}.

+ ParameterString named `GRAPH_COLOR`, see {@link GraphLine.setColor}.

Events Broadcast
----------------
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `RESET`, see {@link GraphLine.reset}.

*/
export class GraphLine extends AbstractSubject implements Subject, Observer, Memorizable {
  /** The VarsList whose data this graph is displaying */
  private varsList_: VarsList;
  /** index of horizontal variable in simulation's variables, or -1 to not
  * collect any X variable data
  */
  private xVar_: number = -1;
  /** index of vertical variable in simulation's variables, or -1 to not
  * collect any X variable data
  */
  private yVar_: number = -1;
  /** Parameter that represents which variable is shown on Y-axis, and the available
  * choices of variables.
  */
  private yVarParam_: ParameterNumber;
  /** Parameter that represents which variable is shown on X-axis, and the available
  * choices of variables.
  */
  private xVarParam_: ParameterNumber;
  /** Holds the most recent data points drawn, to enable redrawing when needed.*/
  private dataPoints_: CircularList<GraphPoint>;
  private changed_: boolean = true;
  /** The color to draw the graph with, a CSS3 color string.*/
  private drawColor_: string = 'lime';
  /** whether to draw the graph with lines or dots */
  private drawMode_: DrawingMode = DrawingMode.LINES;
  /** Thickness to use when drawing the line, in screen coordinates, so a unit
  * is a screen pixel.
  */
  private lineWidth_: number = 1.0;
  /** The color to draw the hot spot (most recent point) with, a CSS3 color string.*/
  private hotSpotColor_: string = 'red';
  /** GraphStyle's for display, ordered by index in dataPoints list.
  * There can be multiple GraphStyle entries for the same index, the latest one
  * in the list takes precedence.  We ensure there is always at least one GraphStyle
  * in the list.
  */
  private styles_: GraphStyle[]  = [];
  /** Function that gives the transformed the X value. */
  xTransform: (x:number, y:number)=> number = (x: number, _y: number)=>x;
  /** Function that gives the transformed the Y value. */
  yTransform: (x:number, y:number)=> number = (_x: number, y: number)=>y;

/**
* @param name
* @param varsList the VarsList to collect data from
* @param opt_capacity number of GraphPoints to store
*/
constructor(name: string, varsList: VarsList, opt_capacity?: number) {
  super(name);
  this.varsList_ = varsList;
  varsList.addObserver(this);
  this.yVarParam_ = new ParameterNumber(this, GraphLine.en.Y_VARIABLE,
      GraphLine.i18n.Y_VARIABLE,
      () => this.getYVariable(), a => this.setYVariable(a))
      .setLowerLimit(-1);
  this.addParameter(this.yVarParam_);
  this.xVarParam_ = new ParameterNumber(this, GraphLine.en.X_VARIABLE,
      GraphLine.i18n.X_VARIABLE,
      () => this.getXVariable(), a => this.setXVariable(a))
      .setLowerLimit(-1);
  this.addParameter(this.xVarParam_);
  this.buildMenu();
  this.dataPoints_  = new CircularList<GraphPoint>(opt_capacity || 100000);
  // ensure there is always at least one GraphStyle
  this.addGraphStyle();
  this.addParameter(new ParameterNumber(this, GraphLine.en.LINE_WIDTH,
      GraphLine.i18n.LINE_WIDTH,
      () => this.getLineWidth(), a => this.setLineWidth(a)));
  // Need a special 'setter' because `setDrawingMode` takes an argument of
  // the enum type `DrawingMode`, not of type `number`.
  this.addParameter(new ParameterString(this, GraphLine.en.DRAWING_MODE,
      GraphLine.i18n.DRAWING_MODE,
      () => this.getDrawingMode(),
      a => this.setDrawingMode(a as DrawingMode),
      DrawingModeChoices(), DrawingModeValues()));
  this.addParameter(new ParameterString(this, GraphLine.en.GRAPH_COLOR,
      GraphLine.i18n.GRAPH_COLOR,
      () => this.getColor(), a => this.setColor(a)));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', drawColor_:"'+this.drawColor_+'"'
      +', lineWidth_: '+Util.NF(this.lineWidth_)
      +', drawMode_: '+this.drawMode_
      +', hotSpotColor_:"'+this.hotSpotColor_+'"'
      +', styles_.length: '+Util.NF(this.styles_.length)
      +', varsList: '+this.varsList_.toStringShort()
      +', dataPoints_: '+this.dataPoints_
      + super.toString();
};

/** @inheritDoc */
override toStringShort() {
  return  super.toStringShort().slice(0, -1)
      +', xVar: ' + Util.NF(this.xVar_)
      + ', yVar: '+ Util.NF(this.yVar_)
      +'}';
};

/** @inheritDoc */
getClassName(): string {
  return 'GraphLine';
};

/** Adds a GraphStyle with the current color, draw mode, and line width, corresponding
to the current end point of the HistoryList.
*/
private addGraphStyle(): void {
  this.styles_.push(new GraphStyle(this.dataPoints_.getEndIndex() + 1,
      this.drawMode_, this.drawColor_, this.lineWidth_));
  this.changed_ = true;
};

/** Modify the choices in the X and Y variable Parameters to match those of the
VarsList, plus add the `NONE` choice.
*/
private buildMenu(): void {
  // add the NONE option to front of the list
  const varNames = [GraphLine.i18n.NONE];
  const vals = [-1];
  for (let i=0, len=this.varsList_.numVariables(); i<len; i++) {
    varNames.push(this.varsList_.getVariable(i).getName(/*localized=*/true));
    vals.push(i);
  }
  this.yVarParam_.setChoices(varNames, vals);
  this.xVarParam_.setChoices(varNames, vals);
};

/** Returns whether this SimObject has changed, and sets the state to "unchanged".
@return whether this SimObject has changed
*/
getChanged(): boolean {
  if (this.changed_) {
    this.changed_ = false;
    return true;
  } else {
    return false;
  }
};

/** Returns the color used when drawing the graph.
@return the color used when drawing the graph
*/
getColor(): string {
  return this.drawColor_;
};

/** Returns the DrawingMode of the graph: dots or lines.
@return the DrawingMode to draw this graph with
*/
getDrawingMode(): DrawingMode {
  return this.drawMode_;
};

/** Returns the HistoryList of GraphPoints.
*/
getGraphPoints(): HistoryList<GraphPoint> {
  return this.dataPoints_;
};

/** Returns the GraphStyle corresponding to the position in the list of GraphPoints.
@param index  the index number in list of GraphPoints
@return the GraphStyle for that position
*/
getGraphStyle(index: number): GraphStyle {
  const styles = this.styles_;
  if (styles.length == 0) {
    throw 'graph styles list is empty';
  }
  // Find the latest style in the styles list with an index less than or
  // equal to the given index.
  let last = styles[0];
  for (let i=1, len=styles.length; i<len; i++) {
    const s = styles[i];
    // assert that indices in style list are non-decreasing
    Util.assert(last.index_ <= s.index_);
    if (s.index_ > index)
      break;
    last = s;
  }
  Util.assert(Util.isObject(last));
  return last;
};

/** Returns the color used when drawing the hot spot (most recent point).
@return the color used when drawing the hot spot (most recent point)
*/
getHotSpotColor(): string {
  return this.hotSpotColor_;
};

/** Returns thickness to use when drawing the line, in screen coordinates, so a unit
* is a screen pixel.
* @return thickness of line in screen coordinates
*/
getLineWidth(): number {
  return this.lineWidth_;
};

/** Returns the VarsList that this GraphLine is collecting from
@return the VarsList that this is collecting from.
*/
getVarsList(): VarsList {
  return this.varsList_;
};

/** Returns the index in the VarsList of the X variable being collected.
@return the index of X variable in the VarsList, or  -1 if no X variable
    is being collected.
*/
getXVariable(): number {
  return this.xVar_;
};

/** Returns localized X variable name.
@return variable name or empty string in case index is -1
*/
getXVarName(): string {
  return this.xVar_ > -1 ?
      this.varsList_.getVariable(this.xVar_).getName(/*localized=*/true) : '';
};

/** Returns the index in the VarsList of the Y variable being collected.
@return the index of Y variable in the VarsList, or  -1 if no Y variable
    is being collected.
*/
getYVariable(): number {
  return this.yVar_;
};

/** Returns localized Y variable name.
@return variable name or empty string in case index is -1
*/
getYVarName(): string {
  return this.yVar_ > -1 ?
      this.varsList_.getVariable(this.yVar_).getName(/*localized=*/true) : '';
};

/** @inheritDoc */
memorize(): void {
  if (this.xVar_ > -1 && this.yVar_ > -1) {
    const xVar = this.varsList_.getVariable(this.xVar_);
    const yVar = this.varsList_.getVariable(this.yVar_);
    const x = xVar.getValue();
    const y = yVar.getValue();
    const nextX = this.xTransform(x, y);
    const nextY = this.yTransform(x, y);
    const seqX = xVar.getSequence();
    const seqY = yVar.getSequence();
    const newPoint = new GraphPoint(nextX, nextY, seqX, seqY);
    // only store if the new point is different from the last point
    const last = this.dataPoints_.getEndValue();
    if (last == null || !last.equals(newPoint)) {
      this.dataPoints_.store(newPoint);
      this.changed_ = true;
    }
  }
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.varsList_) {
    if (event.nameEquals(VarsList.VARS_MODIFIED)) {
      this.buildMenu();
    }
  }
}

/** Forgets any memorized data and styles, starts from scratch. However, it also calls
{@link GraphLine.memorize} to memorize the current data point, if any.
*/
reset(): void {
  this.dataPoints_.reset();
  this.resetStyle();
  this.memorize();
  this.broadcast(new GenericEvent(this, GraphLine.RESET));
};

/** Forgets any memorized styles, records the current color, draw mode, and line width
* as the single starting style. Note that you may need to call
* {@link lab/graph/DisplayGraph.DisplayGraph.reset} to see this change take effect.
*/
resetStyle(): void {
  this.styles_ = [];
  // ensure there is always at least one GraphStyle
  this.addGraphStyle();
  this.changed_ = true;
};

/** Sets the color to use when drawing the graph. Applies only to portions of graph
memorized after this time.
@param color the color to use when drawing the graph, a CSS3 color string.
*/
setColor(color: string): void {
  if (this.drawColor_ != color) {
    this.drawColor_ = color;
    this.addGraphStyle();
    this.changed_ = true;
    this.broadcastParameter(GraphLine.en.GRAPH_COLOR);
  }
};

/** Sets whether to draw the graph with dots or lines. Applies only to portions of graph
memorized after this time.
@param value the DrawingMode (dots or lines) to draw this graph with.
@throws if the value does not represent a valid DrawingMode
*/
setDrawingMode(value: DrawingMode): void {
  if (this.drawMode_ != value) {
    this.drawMode_ = value;
    this.addGraphStyle();
    this.changed_ = true;
    this.broadcastParameter(GraphLine.en.DRAWING_MODE);
  }
};

/** Sets the color to use when drawing the hot spot (most recent point).
Set this to empty string to not draw the hot spot.
@param color the color to use when drawing the hot spot (most recent point)
*/
setHotSpotColor(color: string): void {
  this.hotSpotColor_ = color;
  this.changed_ = true;
};

/** Sets thickness to use when drawing the line, in screen coordinates, so a unit is a
screen pixel. Applies only to portions of graph memorized after this time.
@param value thickness of line in screen coordinates
*/
setLineWidth(value: number): void {
  if (Util.veryDifferent(value, this.lineWidth_)) {
    this.lineWidth_ = value;
    this.addGraphStyle();
    this.changed_ = true;
    this.broadcastParameter(GraphLine.en.LINE_WIDTH);
  }
};

/** Sets the variable from which to collect data for the X value of the graph. Starts
over with a new HistoryList. Broadcasts the ParameterNumber named
`GraphLine.i18n.X_VARIABLE`.
@param xVar the name or index of X variable in the VarsList, or -1 to not
    collect any X variable data and have an empty HistoryList. The name can be the
    English or language independent version of the name
@throws if the index is out of range, or the variable name doesn't exist
*/
setXVariable(xVar: number|string): void {
  if (typeof xVar === 'string') {
    var v = this.varsList_.getVariable(xVar);
    xVar = this.varsList_.indexOf(v);
  } else if (xVar < -1 || xVar > this.varsList_.numVariables()-1) {
    throw 'setXVariable bad index '+xVar;
  }
  if (this.xVar_ != xVar) {
    this.xVar_ = xVar;
    this.reset();
    this.broadcastParameter(GraphLine.en.X_VARIABLE);
  }
};

/** Sets the variable from which to collect data for the Y value of the graph. Starts
over with a new HistoryList. Broadcasts the ParameterNumber named
`GraphLine.i18n.Y_VARIABLE`.
@param yVar the name or index of Y variable in the VarsList, or -1 to not
    collect any Y variable data and have an empty HistoryList. The name can be the
    English or language independent version of the name
@throws if the index is out of range, or the variable name doesn't exist
*/
setYVariable(yVar: number|string): void {
  if (typeof yVar === 'string') {
    var v = this.varsList_.getVariable(yVar);
    yVar = this.varsList_.indexOf(v);
  } else if (yVar < -1 || yVar > this.varsList_.numVariables()-1) {
    throw 'setYVariable bad index '+yVar;
  }
  if (this.yVar_ != yVar) {
    this.yVar_ = yVar;
    this.reset();
    this.broadcastParameter(GraphLine.en.Y_VARIABLE);
  }
};

/** Event broadcast when {@link GraphLine.reset} is called. */
static RESET = 'RESET' as const;

static readonly en: i18n_strings = {
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

static readonly de_strings: i18n_strings = {
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

static readonly i18n = Util.LOCALE === 'de' ? GraphLine.de_strings : GraphLine.en;

} // end GraphLine class

type i18n_strings = {
  DRAWING_MODE: string,
  GRAPH_COLOR: string,
  GRAPH_DRAW_MODE: string,
  GRAPH_POINTS: string,
  LINE_WIDTH: string,
  X_VARIABLE: string,
  Y_VARIABLE: string,
  CLEAR_GRAPH: string,
  NONE: string
};

Util.defineGlobal('lab$graph$GraphLine', GraphLine);


// ************************ GraphPoint ******************************

/** A point in a 2D graph, with indication of when discontinuity occurs in a sequence
* of points.  See {@link GraphLine}.
*/
export class GraphPoint implements GenericVector {
  x: number;
  y: number;
  seqX: number;
  seqY: number;

/**
* @param x X value of the GraphPoint
* @param y Y value of the GraphPoint
* @param seqX sequence number for the X value; when sequence number changes
*   between successive GraphPoints it indicates there was a discontinuity in the graph
* @param seqY sequence number for the Y value; when sequence number changes
*   between successive GraphPoints it indicates there was a discontinuity in the graph
*/
constructor(x: number, y: number, seqX: number, seqY: number) {
  if (isNaN(x) || isNaN(y)) {
    throw 'NaN in GraphPoint';
  }
  this.x = x;
  this.y = y;
  this.seqX = seqX;
  this.seqY = seqY;
};

/** @inheritDoc */
toString() {
  return 'GraphPoint{x: '+Util.NF(this.x)
      +', y: '+Util.NF(this.y)
      +', seqX: '+Util.NF(this.seqX)
      +', seqY: '+Util.NF(this.seqY)
      +'}';
};

/** Returns whether this GraphPoint is identical to another GraphPoint
* @param other the GraphPoint to compare with
* @return `true` if this GraphPoint is identical to the other GraphPoint
*/
equals(other: GraphPoint): boolean {
  return this.x == other.x && this.y == other.y && this.seqX == other.seqX
      && this.seqY == other.seqY;
};

/** @inheritDoc */
getX() {
  return this.x;
};

/** @inheritDoc */
getY() {
  return this.y;
};

/** @inheritDoc */
getZ() {
  return 0;
};

} // end GraphPoint class

Util.defineGlobal('lab$graph$GraphPoint', GraphPoint);


// ************************* GraphStyle ********************************

/** Specifies graph style such as color, line thickness, line pattern.

The index number specifies when to use this GraphStyle as follows: Each point stored in
a {@link HistoryList} has an index number given by
{@link lab/util/HistoryList.HistoryIterator.getIndex}. The GraphStyle is used for
points whose index number is equal or greater than the GraphStyle's index.

Note: line dash is not a supported feature because the graph is drawn incrementally
as thousands of short line segments and the line dash starts over for each segment. It
might be possible to use the HTML `CanvasRenderingContext2D.lineDashOffset` property to
deal with this.

*/
export class GraphStyle {
  /** Specifies where in the HistoryList this style should be applied. */
  index_: number;
  /** Whether to draw dots or lines */
  drawMode: DrawingMode;
  /** a CSS color specification */
  color_: string;
  /** thickness to use when drawing the graph line, in screen coordinates,
  * so a unit is a screen pixel.
  */
  lineWidth: number;

/**
* @param index specifies where in the HistoryList this style should be applied
* @param drawMode whether to draw dots or lines, a value from DrawingMode
* @param color a CSS color specification
* @param lineWidth  thickness to use when drawing the graph line, in screen
*     coordinates, so a unit is a screen pixel.
*/
constructor(index: number, drawMode: DrawingMode, color: string, lineWidth: number) {
  this.index_ = index;
  this.drawMode = drawMode;
  this.color_ = color;
  this.lineWidth = lineWidth;
};

/** @inheritDoc */
toString() {
  return 'GraphStyle{index_: '+this.index_
      +', drawMode: '+this.drawMode
      +', color_:"'+this.color_+'"'
      +', lineWidth: '+this.lineWidth
      +'}';
};

} // end GraphStyle class
Util.defineGlobal('lab$graph$GraphStyle', GraphStyle);
