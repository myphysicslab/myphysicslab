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

import { DisplayAxes } from '../../lab/graph/DisplayAxes.js'
import { DisplayGraph } from '../../lab/graph/DisplayGraph.js'
import { DoubleRect } from '../../lab/util/DoubleRect.js'
import { GenericObserver, SubjectEvent } from '../../lab/util/Observe.js'
import { GraphLine, GraphPoint, GraphStyle } from '../../lab/graph/GraphLine.js'
import { HorizAlign } from '../../lab/view/HorizAlign.js'
import { LabCanvas } from '../../lab/view/LabCanvas.js'
import { SimView } from '../../lab/view/SimView.js'
import { ScreenRect } from '../../lab/view/ScreenRect.js'
import { SimController } from '../../lab/app/SimController.js'
import { Terminal } from '../../lab/util/Terminal.js'
import { Util } from '../../lab/util/Util.js'
import { VarsList } from '../../lab/model/VarsList.js'
import { Vector } from '../../lab/util/Vector.js'
import { VerticalAlign } from '../../lab/view/VerticalAlign.js'

/**  Names of HTML div, form, and input element's to search for by using
* `document.getElementById()`.
*/
type ElementIDs = {
  graph_div: string;
  term_output: string;
  term_input: string;
  images_dir: string;
};

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

**TO DO** add AutoScale, so that full range is shown

**TO DO** add pan-zoom controls
*/
export class GraphCalcApp {
  /** The expression evaluating process uses Terminal.expand() to access
  * the 'x' variable which is a property of GraphCalcApp.
  */
  private x: number = 0;
  private simCanvas: LabCanvas;
  private terminal: Terminal;
  private vars: VarsList;
  private simRect: DoubleRect;
  private simView: SimView;
  private graphLine: GraphLine;
  private graph: DisplayGraph;
  private axes: DisplayAxes;
  private simCtrl: SimController;
  private z: { };

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  Util.setImagesDir(elem_ids['images_dir']);
  const div = Util.getElementById(elem_ids.graph_div) as HTMLDivElement;
  const canvas = document.createElement('canvas');
  this.simCanvas = new LabCanvas(canvas, 'canvas1');
  this.simCanvas.setSize(800, 800);
  div.appendChild(this.simCanvas.getCanvas());

  const term_input = Util.maybeElementById(elem_ids.term_input) as HTMLInputElement;
  const term_output =
      Util.maybeElementById(elem_ids.term_output) as HTMLTextAreaElement;
  this.terminal = new Terminal(term_input, term_output);
  Terminal.stdRegex(this.terminal);
  this.vars = new VarsList(['x', 'y'], ['x', 'y']);
  this.simRect = new DoubleRect(-10, -10, 10, 10);
  this.simView = new SimView('graphView', this.simRect);
  // use FULL alignment so that we can specify the exact extent of the graph.
  this.simView.setHorizAlign(HorizAlign.FULL);
  this.simView.setVerticalAlign(VerticalAlign.FULL);
  this.simCanvas.addView(this.simView);
  const screenrect = this.simView.getScreenRect();
  this.graphLine = new GraphLine('GRAPH_LINE', this.vars);
  this.graphLine.setXVariable(0);
  this.graphLine.setYVariable(1);
  this.graphLine.setHotSpotColor(''); // don't draw hot spot
  this.graph = new DisplayGraph(this.graphLine);
  this.graph.setScreenRect(screenrect);
  this.simView.getDisplayList().add(this.graph);
  this.axes = new DisplayAxes(this.simView.getCoordMap().screenToSimRect(screenrect));
  this.simView.getDisplayList().add(this.axes);
  // inform displayGraph when the screen rect changes.
  new GenericObserver(this.simView, (evt: SubjectEvent) => {
      if (evt.nameEquals(SimView.SCREEN_RECT_CHANGED)) {
        this.graph.setScreenRect(this.simView.getScreenRect());
      } else if (evt.nameEquals(SimView.SIM_RECT_CHANGED)) {
        const screenrect = this.simView.getScreenRect();
        const simrect = this.simView.getCoordMap().screenToSimRect(screenrect);
        this.axes.setSimRect(simrect);
      }
    }, 'adjust when screen rect changes');
  this.simCtrl = new SimController(this.simCanvas);
  this.terminal.setAfterEval( () => {
      this.graph.reset();
      this.simCanvas.paint();
    });
};

/**
* @param expr
* @param range1
* @param range2
* @param numPts
*/
plot(expr: string, range1?: number, range2?: number, numPts?: number): void {
    const r = this.simView.getSimRect();
    range1 = range1 ?? r.getLeft();
    range2 = range2 ?? r.getRight();
    numPts = numPts || 200;
    const incr = (range2 - range1)/numPts;
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
    let y = NaN;
    for (let i=0; i<numPts; i++) {
      y = this.terminal.eval(expr, /*output=*/false);
      if (typeof y === 'number' && isFinite(y)) {
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
* @param myName  the name of this object, valid in global Javascript context.
*/
defineNames(myName: string) {
  this.terminal.addRegex('z', myName+'.', /*addToVars=*/false, /*prepend=*/true);
  this.terminal.addRegex( 'simCanvas|vars|terminal|graph|graphLine|axes|plot'
      +'|simCtrl|simView|x',
      myName+'.');
};

/**
* @param script
* @param output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @return the result of evaluating the string
*/
eval(script: string, output: boolean = true): any {
  return this.terminal.eval(script, output);
};

/** Set up the application.
*/
setup(): void {
  this.terminal.parseURL();
};

/** Start the application running.
*/
start(): void {
};

} // end GraphCalcApp class
