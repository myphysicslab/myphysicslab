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

import { AbstractSubject } from '../../lab/util/AbstractSubject.js';
import { CommonControls } from './CommonControls.js';
import { LabCanvas } from '../../lab/view/LabCanvas.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { Layout, ElementIDs } from './Layout.js';
import { ParameterBoolean, ParameterNumber, ParameterString, SubjectList, Subject }
    from '../../lab/util/Observe.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { Util } from '../../lab/util/Util.js';

/** Set of available layout options. */
export const enum LayoutOptions {
  SIM = 'sim',
  GRAPH = 'graph',
  GRAPH_AND_SIM = 'sim+graph',
  TIME_GRAPH = 'time_graph',
  TIME_GRAPH_AND_SIM = 'sim+time_graph',
  MULTI_GRAPH = 'multi_graph',
  MULTI_GRAPH_AND_SIM = 'sim+multi_graph'
};

/** TabLayout3 is a tab-based layout for showing a simulation, graph, and controls.
TabLayout3 implements specific ways to present the application on the web page, in this
case with a tab-based layout. TabLayout3 creates and manages various layout elements
(LabCanvas, `div` for controls, Terminal, etc.). It also defines regular expressions
for easy Terminal scripting of these objects using short names such as terminal,
simCanvas, graphCanvas.

TabLayout3 is similar to TabLayout, except each canvas has its own controls area. Each
pair of canvas and controls are contained in a div. This makes it visually clear which
controls go with the SimView, and which go with the Graph (or TimeGraph). The controls
are shown or hidden along with the canvas in most layouts.

### HTML Changes

TabLayout3 requires use of `stylesheet2.css` and the macro `CONTROLS_CONTAINER2` in
`macros_tab.html` in the HTML page that loads the app.

### Element IDs

TabLayout3 constructor takes an argument that specifies the names of the HTML
elements to look for in the HTML document; these elements are where the user
interface of the simulation is created. This allows for having two separate instances
of the same simulation running concurrently on a single page.

These are the names expected to be in the element IDs object:

+  tab_list
+  container
+  term_output
+  term_input
+  sim_applet
+  div_graph
+  graph_controls
+  sim_controls
+  div_terminal
+  div_time_graph
+  time_graph_controls
+  label_terminal
+  show_terminal
+  show_sim
+  images_dir

### Layouts

There are 7 layouts:

+ *sim* shows sim-view and sim-controls
+ *graph* shows graph and graph-controls
+ *sim+graph* show graph, sim-view, and graph-controls
+ *time_graph* shows time-graph and time-graph-controls
+ *sim+time_graph*  shows time-graph and sim-view, and time-graph-controls
+ *multi_graph*  shows graph and time-graph
+ *sim+multi_graph*  shows graph, time-graph and sim-view

### Layout Tabs

The set of layout tabs is contained in a UL list. Each tab has a `className` property
which identifies the name of the tab. Clicking on a tab will change the layout.

The selected tab also has the class 'selected', for example 'sim selected' would be the
`className` of the sim tab when it is selected.

The layout tabs are expected to be:

+ sim: selects the 'sim' layout
+ graph:  selects the 'sim+graph' layout
+ time_graph: selects the 'sim+time_graph' layout
+ multi_graph: selects the 'sim+multi_graph' layout

Note that each graph tab corresponds to two different layouts: with or without the sim
view.

### 'Show Simulation' Checkbox

The 'show simulation' checkbox is visible in the graph views. Clicking the checkbox
will change the layout to pick the appropriate version of the current layout, for
example either 'sim+graph' or 'graph'. The method {@link showSim} can be used from
JavaScript to accomplish the same result.

### Size of Sim, Graph, TimeGraph

There are three 'levels' which affect how the Simulation, Graph and TimeGraph appear:

1. There are Parameters for `SIM_WIDTH, GRAPH_WIDTH, TIME_GRAPH_WIDTH`. These stretch
or shrink the canvas, without changing the resolution of the canvas (the canvas screen
rectangle remains the same). These set the width of the <DIV> surrounding the
LabCanvas's to that fraction of the window width, and the canvas stretches or shrinks
to fit into the <DIV>. These Parameters only apply when a single canvas (Sim, Graph, or
TimeGraph) is shown alone without another canvas alongside. When there are two or more
canvases then we always use 49% width to fit two canvases side-by-side.

2. LabCanvas Parameters for `WIDTH, HEIGHT`: These set the pixel density (resolution)
and shape (ratio of width to height) of the canvas. These determine the ScreenRect that
is passed to the LabViews. The size of the Simulation LabCanvas is set according to
arguments passed to the TabLayout3 constructor. In contrast, the Graph and TimeGraph
LabCanvas are always square shaped. Their size is the bigger of the Sim LabCanvas width
or height. The size of any LabCanvas can be changed after construction if desired.

3. SimView Parameters for `WIDTH, HEIGHT, CENTER_X, CENTER_Y, VERTICAL_ALIGN`, etc.
These affect only the SimRect, which determines simulation coordinates. Pan and zoom of
the image can be done by changing these Parameters.

### Layout Of Controls

The layout depends on whether there is one, two, or three canvases visible. And on how
wide the window is.

In each case, the controls should appear grouped with the canvas they "belong" to:
+ The simulation controls (playback, and various simulation settings) appear with
    the sim-canvas.
+ The graph controls (which variable to display, etc.) appear with the graph canvas.
+ And similar for the time-graph and its controls.

The size of the canvases depends on the window size. For the single canvas case, we use
CSS style "max-width: 95vw" and "max-height: 95vh" which means it will be full size
when the window is large enough (but no larger), and will be 95% of the window size
when the window is smaller.

For the single canvas case, the controls can appear either to the right of the canvas
(when there is room), or below the canvas. In either case, we arrange the controls in
columns if there is adequate space.

For the two canvas case with wide window: the canvas size is set to be roughly 47% of
the window width. The canvases appear side-by-side, with their controls below each one
(in columns if there is enough space).

For two canvas case with narrow window: the canvas size is 95% of the window, and they
appear one above the other, but each has their controls just below them.


### Terminal Checkbox

A 'show terminal' checkbox is added to the controls div in all layouts, unless the
`opt_terminal` parameter is false.


Parameters Created
------------------

+ ParameterNumber named `SIM_WIDTH`, see {@link setSimWidth}

+ ParameterNumber named `GRAPH_WIDTH`, see {@link setGraphWidth}

+ ParameterNumber named `TIME_GRAPH_WIDTH`, see {@link setTimeGraphWidth}

+ ParameterString named `LAYOUT`, see {@link setLayout}

+ ParameterBoolean named `SHOW_TERMINAL`, see {@link showTerminal}

*/
export class TabLayout3 extends AbstractSubject implements Subject, Layout, SubjectList {
  private limitSize_: boolean = true;
  /** width of simCanvas, as fraction of available width */
  private simWidth_: number = 1;
  /** width of graphCanvas, as fraction of available width */
  private graphWidth_: number = 1;
  /** width of timeGraphCanvas, as fraction of available width */
  private timeGraphWidth_: number = 1;
  /** Whether to put dashed outline around elements for debugging layout.
  * Outline differs from borders. Unlike border, the outline is drawn outside the
  * element's border, and may overlap other content. Also, the outline is NOT a part
  * of the element's dimensions; the element's total width and height is not affected
  * by the width of the outline.
  */
  private debug_layout: boolean = false;
  private tab_list: HTMLElement;
  /** name of current layout */
  private layout_: string;
  /** Can disable terminal with this flag. */
  private terminalEnabled_: boolean;
  private term_input: null|HTMLInputElement;
  private terminal: Terminal;
  private div_contain: HTMLDivElement;
  private div_sim: HTMLDivElement;
  private simCanvas: LabCanvas;
  /** Whether to also show the simulation in the graph views. Default for small
  * screens is to not show the simulation, so that clicking on the graph tab
  * shows the graph.
  */
  private show_sim: boolean;
  private show_sim_cb: HTMLInputElement;
  private show_sim_label: HTMLLabelElement;
  private div_graph: HTMLDivElement;
  private graphCanvas: LabCanvas;
  /** div for graph controls */
  private div_graph_controls: HTMLDivElement;
  private controls_: LabControl[] = [];
  /** div for sim controls */
  private div_sim_controls: HTMLDivElement;
  /** div element for Terminal */
  private div_term: HTMLDivElement;
  private show_term_cb: HTMLInputElement|null = null;
  private div_time_graph: HTMLDivElement;
  private timeGraphCanvas: LabCanvas;
  /** div for time graph controls */
  private div_time_graph_controls: HTMLDivElement;

/**
* @param elem_ids specifies the names of the HTML
*    elements to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param canvasWidth width of sim canvas in pixels, default 800
* @param canvasHeight height of sim canvas in pixels, default 800
* @param opt_terminal whether to add the 'show terminal' checkbox, default
*    is true
*/
constructor(elem_ids: ElementIDs, canvasWidth: number = 800, canvasHeight: number = 800, opt_terminal: boolean = true) {
  super('TAB_LAYOUT');
  Util.setImagesDir(elem_ids.images_dir);
  this.tab_list = Util.getElementById(elem_ids.tab_list);
  this.layout_ = this.getSelectedTab();
  this.terminalEnabled_ = opt_terminal;
  if (this.layout_ == '') {
    this.layout_ = LayoutOptions.SIM;
    this.setSelectedTab(this.layout_);
  }

  // when click on a tab (other than current selected tab) we switch to that layout.
  this.tab_list.addEventListener('click', 
      e => {
        const target = e.target as HTMLElement;
        if (target === undefined) {
          throw 'event target is undefined';
        }
        if (target == null || target.tagName != 'LI') {
          return;
        }
        if (target.className.indexOf('selected') > -1) {
          // do nothing when click on selected tab
          return;
        }
        this.setLayoutFromTab(target.className);
      });

  window.addEventListener('resize', () => this.redoLayout() );
  // Safari doesn't support screen.orientation as of 2023
  const orient = window.screen.orientation;
  if (orient !== undefined) {
      orient.addEventListener('orientationchange', () => this.redoLayout() );
  } else {
    // this is the old way for Safari
    window.addEventListener('orientationchange', () => this.redoLayout() );
  }

  const term_output =
      Util.maybeElementById(elem_ids.term_output) as HTMLTextAreaElement|null;
  this.term_input = Util.maybeElementById(elem_ids.term_input) as HTMLInputElement|null;
  this.terminal = new Terminal(this.term_input, term_output);
  Terminal.stdRegex(this.terminal);
  this.div_contain = Util.getElementById(elem_ids.container) as HTMLDivElement;
  if (this.debug_layout) {
    this.div_contain.style.outline = 'dashed 1px red';
  }
  this.div_sim = Util.getElementById(elem_ids.sim_applet) as HTMLDivElement;
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.div_sim.style.position = 'relative';
  const canvas = document.createElement('canvas');
  /* tabIndex = 0 makes the canvas selectable via tab key or mouse, so it can
  * get text events. A value of 0 indicates that the element should be placed in the
  * default navigation order. This allows elements that are not natively focusable
  * (such as <div>, <span>, and ) to receive keyboard focus.
  */
  canvas.tabIndex = 0;
  this.simCanvas = new LabCanvas(canvas, 'SIM_CANVAS');
  this.simCanvas.setSize(canvasWidth, canvasHeight);
  this.div_sim.insertBefore(this.simCanvas.getCanvas(), this.div_sim.firstChild);

  this.show_sim = Util.getViewportSize()[0] > 600;
  this.show_sim_cb = Util.getElementById(elem_ids.show_sim) as HTMLInputElement;
  const p = this.show_sim_cb.parentElement;
  if (p == null || p.tagName != 'LABEL') {
    throw '';
  }
  this.show_sim_cb.checked = this.show_sim;
  this.show_sim_label = p as HTMLLabelElement;
  this.show_sim_cb.addEventListener('click', 
    _e => { this.showSim(this.show_sim_cb.checked); });

  this.div_graph = Util.getElementById(elem_ids.div_graph)as HTMLDivElement;
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.div_graph.style.position = 'relative';
  const canvas2 = document.createElement('canvas');
  this.graphCanvas = new LabCanvas(canvas2, 'GRAPH_CANVAS');
  canvasWidth = Math.max(canvasWidth, canvasHeight);
  this.graphCanvas.setSize(canvasWidth, canvasWidth);
  this.div_graph.insertBefore(canvas2, this.div_graph.firstChild);

  this.div_graph_controls =
      Util.getElementById(elem_ids.graph_controls) as HTMLDivElement;
  if (this.debug_layout) {
    this.div_graph_controls.style.outline = 'dashed 1px green';
  }
  this.div_sim_controls =
      Util.getElementById(elem_ids.sim_controls) as HTMLDivElement;
  // marginLeft gives gap when controls are along side canvas.
  //this.div_sim_controls.style.marginLeft = '10px';
  if (this.debug_layout) {
    this.div_sim_controls.style.outline = 'dashed 1px green';
  }

  this.div_term =
      Util.getElementById(elem_ids.div_terminal) as HTMLDivElement;
  this.div_term.style.display = 'none';
  if (this.debug_layout) {
    this.div_term.style.outline = 'dashed 1px green';
  }

  // 'show terminal' checkbox.
  const label_term =
      Util.getElementById(elem_ids.label_terminal) as HTMLInputElement;
  if (!this.terminalEnabled_) {
    label_term.style.display = 'none';
  } else {
    label_term.style.display = 'inline';
    this.show_term_cb =
        Util.getElementById(elem_ids.show_terminal) as HTMLInputElement;
    this.show_term_cb.addEventListener('click', 
        _e => { if (this.show_term_cb !== null)
          this.showTerminal(this.show_term_cb.checked) } );
  }

  this.div_time_graph =
      Util.getElementById(elem_ids.div_time_graph) as HTMLDivElement;
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.div_time_graph.style.position = 'relative';
  const canvas3 = document.createElement('canvas');
  this.timeGraphCanvas = new LabCanvas(canvas3, 'TIME_GRAPH_CANVAS');
  this.timeGraphCanvas.setSize(canvasWidth, canvasWidth);
  this.div_time_graph.insertBefore(canvas3, this.div_time_graph.firstChild);

  this.div_time_graph_controls =
      Util.getElementById(elem_ids.time_graph_controls) as HTMLDivElement;
  if (this.debug_layout) {
    this.div_time_graph_controls.style.outline = 'dashed 1px green';
  }

  this.addParameter(new ParameterNumber(this, TabLayout3.en.SIM_WIDTH,
      TabLayout3.i18n.SIM_WIDTH, () => this.getSimWidth(),
      a => this.setSimWidth(a)));
  this.addParameter(new ParameterNumber(this, TabLayout3.en.GRAPH_WIDTH,
      TabLayout3.i18n.GRAPH_WIDTH, () => this.getGraphWidth(),
      a => this.setGraphWidth(a)));
  this.addParameter(new ParameterNumber(this, TabLayout3.en.TIME_GRAPH_WIDTH,
      TabLayout3.i18n.TIME_GRAPH_WIDTH, () => this.getTimeGraphWidth(),
      a => this.setTimeGraphWidth(a)));
  this.addParameter(new ParameterString(this, TabLayout3.en.LAYOUT,
      TabLayout3.i18n.LAYOUT, () => this.getLayout(),
      a => this.setLayout(a),
      TabLayout3.getLayoutValues(), TabLayout3.getLayoutValues()));
  this.addParameter(new ParameterBoolean(this, TabLayout3.en.SHOW_SIM,
      TabLayout3.i18n.SHOW_SIM,
      () => this.show_sim,
      a => this.showSim(a) ));
  if (this.terminalEnabled_) {
    this.addParameter(new ParameterBoolean(this, TabLayout3.en.SHOW_TERMINAL,
        TabLayout3.i18n.SHOW_TERMINAL,
        () => this.show_term_cb != null ? this.show_term_cb.checked : false,
        a => this.showTerminal(a) ));
  }
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', layout_: "'+this.layout_+'"'
      +', simWidth_: '+Util.NF(this.simWidth_)
      +', graphWidth_: '+Util.NF(this.graphWidth_)
      +', timeGraphWidth_: '+Util.NF(this.timeGraphWidth_)
      +', simCanvas: '+this.simCanvas.toStringShort()
      +', graphCanvas: '+this.graphCanvas.toStringShort()
      +', timeGraphCanvas: '+this.timeGraphCanvas.toStringShort()
      +', terminal: '+this.terminal
      +', controls_: ['
      + this.controls_.map(a => a.toStringShort())
      +']'
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'TabLayout3';
};

/** Returns array containing all possible layout values.
* @return array containing all possible layout values
*/
static getLayoutValues(): LayoutOptions[] {
  return [ LayoutOptions.SIM,
      LayoutOptions.GRAPH,
      LayoutOptions.GRAPH_AND_SIM,
      LayoutOptions.TIME_GRAPH,
      LayoutOptions.TIME_GRAPH_AND_SIM,
      LayoutOptions.MULTI_GRAPH,
      LayoutOptions.MULTI_GRAPH_AND_SIM
  ];
};

/** @inheritDoc */
addControl(control: LabControl, opt_add = true): LabControl {
  if (opt_add) {
    const element = control.getElement();
    this.div_sim_controls.appendChild(element);
  }
  this.controls_.push(control);
  // adding a control can change the number of columns needed
  this.redoLayout();
  return control;
};

/** @inheritDoc */
getGraphCanvas(): LabCanvas {
  return this.graphCanvas;
};

/** @inheritDoc */
getGraphControls(): HTMLDivElement {
  return this.div_graph_controls;
};

/** @inheritDoc */
getGraphDiv(): HTMLDivElement {
  return this.div_graph;
};

/** Returns the width of the graph LabCanvas, as fraction of available width
@return width of the graph LabCanvas, as fraction of available width
*/
getGraphWidth(): number {
  return this.graphWidth_;
};

/** Returns current layout.
@return name of the current layout
*/
getLayout(): string {
  return this.layout_;
};

/** Returns classname of selected tab
@return classname of selected tab, or empty string if none selected
*/
private getSelectedTab(): string {
  let tab = undefined;
  this.tab_list.childNodes.forEach(n => {
    if (n.nodeType == Node.ELEMENT_NODE) {
      const elem = n as Element;
      if (elem.tagName == 'LI') {
        if (elem.className.match(/.*selected/) != null) {
          tab = elem;
        }
      }
    }
  });
  if (tab === undefined) {
    return '';
  }
  const tab2 = tab as Element;
  // return className minus ' selected'
  return tab2.className.replace(/[ ]*selected/, '');
};

/** @inheritDoc */
getSimCanvas(): LabCanvas {
  return this.simCanvas;
};

/** @inheritDoc */
getSimControls(): HTMLDivElement {
  return this.div_sim_controls;
};

/** @inheritDoc */
getSimDiv(): HTMLDivElement {
  return this.div_sim;
};

/** Returns the width of the simulation LabCanvas, as fraction of available width
@return width of the simulation LabCanvas, as fraction of available width
*/
getSimWidth(): number {
  return this.simWidth_;
};

/** @inheritDoc */
getSubjects(): Subject[] {
  return [ this, this.simCanvas, this.graphCanvas, this.timeGraphCanvas ];
};

/** @inheritDoc */
getTerminal(): Terminal {
  return this.terminal;
};

/** @inheritDoc */
getTimeGraphCanvas(): LabCanvas {
  return this.timeGraphCanvas;
};

/** @inheritDoc */
getTimeGraphControls(): HTMLDivElement {
  return this.div_time_graph_controls;
};

/** @inheritDoc */
getTimeGraphDiv(): HTMLDivElement {
  return this.div_time_graph;
};

/** Returns the width of the time graph LabCanvas, as fraction of available width
@return width of the time graph LabCanvas, as fraction of available width
*/
getTimeGraphWidth(): number {
  return this.timeGraphWidth_;
};

/** Sets the number of columns for the controls div. Finds the width of a 1 column div,
and uses that to determine how many columns will fit across the entire viewDiv. Assumes
that the viewDiv contains both the canvas and controlsDiv. (I have not found a way to do
this with just CSS).
* @param viewDiv  the div containing the canvas and controlsDiv
* @param canvas  the graph or simview
* @param controlsDiv  the div containing the controls
*/
private setControlsColumns(viewDiv: HTMLDivElement, canvas: HTMLCanvasElement, controlsDiv: HTMLDivElement) {
  // set to 1 column in order to get the width of a single column, and to see whether
  // CSS-browser decides to put the controlsDiv to the right of canvas.
  controlsDiv.style.columnCount = '1';
  controlsDiv.style.columnGap = '5px';
  const gap = 5;
  controlsDiv.style.width = 'auto';
  //console.log('viewDiv '+viewDiv.offsetWidth);
  //console.log('canvas '+canvas.offsetWidth);
  let availWidth;
  if (controlsDiv.offsetLeft > canvas.offsetWidth) {
    // controls are to right of canvas
    availWidth = viewDiv.offsetWidth - canvas.offsetWidth;
  } else {
    // controls are below canvas, use full width
    availWidth = viewDiv.offsetWidth;
  }
  // Find max control width by interrogating each child of the control div.
  let maxw = 0;
  for (let i = 0; i < controlsDiv.children.length; i++) {
    const e =  controlsDiv.children[i] as HTMLElement;
    let w = e.offsetWidth;
    const sty = window.getComputedStyle(e);
    if (sty) {
      w += parseFloat(sty.marginLeft);
    }
    maxw = Math.max(maxw, w);
    //console.log(e.tagName+' '+w);
  }
  // how many columns will fit?
  let cols = 1;
  // The `extra` is needed to fix the following situation:
  // Make a wide window, with just the sim view, and default controls (CreateApp2).
  // Modify the width to between 1 and 2 columns on right of window.
  // The extra prevents the 2 column version from jumping down below the canvas.
  // Instead, the transition between 1 and 2 columns on right stays on the right.
  const extra = 4;
  if (availWidth > 2*maxw + gap + extra) {
    cols = 2;
    if (availWidth > 3*maxw + 2*gap + extra) {
      cols = 3;
    }
  }
  //console.log('maxControlWidth '+maxw);
  //console.log('cols='+cols+' availWidth='+availWidth);
  controlsDiv.style.columnCount = cols.toString();
};

/** Redo the current layout, either because the type of layout changed or the size
of the view port changed.
*/
private redoLayout(): void {
  // WARNING-NOTE: use goog.style.setFloat() to set float property.
  // Do NOT use style.float (it works in some browsers but is non-standard because
  // 'float' is a javascript reserved word).
  // You can use style.cssFloat, but IE uses a different name: styleFloat.
  // WARNING-NOTE: viewport size can change if scrollbars appear or disappear
  // due to layout changes.
  const view_width = Util.getViewportSize()[0];
  this.div_contain.style.flexDirection = 'row';
  this.div_contain.style.flexWrap = 'nowrap';
  const simBig = (this.simWidth_ * 95).toFixed(1);
  const simSmall = (this.simWidth_ * 47.5).toFixed(1);
  const graphBig = (this.graphWidth_ * 95).toFixed(1);
  const graphSmall = (this.graphWidth_ * 47.5).toFixed(1);
  const timeGraphBig = (this.timeGraphWidth_ * 95).toFixed(1);
  const timeGraphSmall = (this.timeGraphWidth_ * 47.5).toFixed(1);
  let sz;
  switch (this.layout_) {
    case '':
    case LayoutOptions.SIM:
      this.div_sim.style.display = 'block';
      // "display: inline-block" allows the controls to appear to right of canvas
      this.div_sim_controls.style.display = 'inline-block';
      this.div_graph.style.display = 'none';
      this.div_time_graph.style.display = 'none';
      this.show_sim_label.style.display = 'none';
      this.simCanvas.getCanvas().style.maxWidth = simBig+'vw';
      this.simCanvas.getCanvas().style.maxHeight = simBig+'vh';
      this.setControlsColumns(this.div_sim, this.simCanvas.getCanvas(),
          this.div_sim_controls);
      break;
    case LayoutOptions.GRAPH:
      this.div_graph.style.display = 'block';
      this.div_graph_controls.style.display = 'inline-block';
      this.div_sim.style.display = 'none';
      this.div_time_graph.style.display = 'none';
      this.graphCanvas.getCanvas().style.maxWidth = graphBig+'vw';
      this.graphCanvas.getCanvas().style.maxHeight = graphBig+'vh';
      this.setControlsColumns(this.div_graph, this.graphCanvas.getCanvas(),
          this.div_graph_controls);
      this.show_sim_cb.checked = false;
      this.show_sim_label.style.display = 'inline';
      break;
    case LayoutOptions.GRAPH_AND_SIM:
      this.div_sim.style.display = 'block';
      this.div_graph.style.display = 'block';
      this.div_time_graph.style.display = 'none';
      // "display: block" causes the controls to appear below the canvas
      this.div_sim_controls.style.display = 'block';
      this.div_graph_controls.style.display = 'block';
      if (view_width > 600) {
        this.simCanvas.getCanvas().style.maxWidth = simSmall+'vw';
        this.graphCanvas.getCanvas().style.maxWidth = graphSmall+'vw';
      } else {
        this.div_contain.style.flexDirection = 'column';
        this.simCanvas.getCanvas().style.maxWidth = simBig+'vw';
        this.simCanvas.getCanvas().style.maxHeight = simBig+'vh';
        this.graphCanvas.getCanvas().style.maxWidth = graphBig+'vw';
        this.graphCanvas.getCanvas().style.maxHeight = graphBig+'vh';
      }
      //console.log('graph+sim set sim');
      this.setControlsColumns(this.div_sim, this.simCanvas.getCanvas(),
          this.div_sim_controls);
      //console.log('graph+sim set graph');
      this.setControlsColumns(this.div_graph, this.graphCanvas.getCanvas(),
          this.div_graph_controls);
      this.show_sim_cb.checked = true;
      this.show_sim_label.style.display = 'inline';
      break;
    case LayoutOptions.TIME_GRAPH:
      this.div_time_graph.style.display = 'block';
      this.div_time_graph_controls.style.display = 'inline-block';
      this.div_sim.style.display = 'none';
      this.div_graph.style.display = 'none';
      this.timeGraphCanvas.getCanvas().style.maxWidth = timeGraphBig+'vw';
      this.timeGraphCanvas.getCanvas().style.maxHeight = timeGraphBig+'vh';
      this.setControlsColumns(this.div_time_graph, this.timeGraphCanvas.getCanvas(),
          this.div_time_graph_controls);
      this.show_sim_cb.checked = false;
      this.show_sim_label.style.display = 'inline';
      break;
    case LayoutOptions.TIME_GRAPH_AND_SIM:
      this.div_sim.style.display = 'block';
      this.div_time_graph.style.display = 'block';
      this.div_graph.style.display = 'none';
      // "display: block" causes the controls to appear below the canvas
      this.div_sim_controls.style.display = 'block';
      this.div_time_graph_controls.style.display = 'block';
      if (view_width > 600) {
        this.simCanvas.getCanvas().style.maxWidth = simSmall+'vw';
        this.timeGraphCanvas.getCanvas().style.maxWidth = timeGraphSmall+'vw';
      } else {
        this.div_contain.style.flexDirection = 'column';
        this.simCanvas.getCanvas().style.maxWidth = simBig+'vw';
        this.simCanvas.getCanvas().style.maxHeight = simBig+'vh';
        this.timeGraphCanvas.getCanvas().style.maxWidth = timeGraphBig+'vw';
        this.timeGraphCanvas.getCanvas().style.maxHeight = timeGraphBig+'vh';
      }
      this.setControlsColumns(this.div_sim, this.simCanvas.getCanvas(),
          this.div_sim_controls);
      this.setControlsColumns(this.div_time_graph, this.timeGraphCanvas.getCanvas(),
          this.div_time_graph_controls);
      this.show_sim_cb.checked = true;
      this.show_sim_label.style.display = 'inline';
      break;
    case LayoutOptions.MULTI_GRAPH:
      this.div_graph.style.display = 'block';
      this.div_time_graph.style.display = 'block';
      this.div_sim.style.display = 'none';
      this.div_sim_controls.style.display = 'none';
      this.div_graph_controls.style.display = 'none';
      this.div_time_graph_controls.style.display = 'none';
      this.div_contain.style.flexDirection = view_width > 600 ? 'row' : 'column';
      sz = (view_width > 600) ? '47.5vw' : '95vw';
      this.graphCanvas.getCanvas().style.maxWidth = sz;
      this.timeGraphCanvas.getCanvas().style.maxWidth = sz;
      this.show_sim_cb.checked = false;
      this.show_sim_label.style.display = 'inline';
      break;
    case LayoutOptions.MULTI_GRAPH_AND_SIM:
      this.div_graph.style.display = 'block';
      this.div_time_graph.style.display = 'block';
      this.div_sim.style.display = 'block';
      this.div_sim_controls.style.display = 'none';
      this.div_graph_controls.style.display = 'none';
      this.div_time_graph_controls.style.display = 'none';
      this.div_contain.style.flexWrap = 'wrap';
      sz = (view_width > 600) ? '47.5vw' : '95vw';
      this.graphCanvas.getCanvas().style.maxWidth = sz;
      this.timeGraphCanvas.getCanvas().style.maxWidth = sz;
      this.simCanvas.getCanvas().style.maxWidth = sz;
      this.show_sim_cb.checked = true;
      this.show_sim_label.style.display = 'inline';
      break;
    default:
      throw 'redoLayout: no such layout "'+this.layout_+'"';
  }
};

/** Sets the width of the graph LabCanvas, as fraction of available width.
@param value  width of the graph LabCanvas, as fraction of available width
*/
setGraphWidth(value: number) {
  if (Util.veryDifferent(value, this.graphWidth_)) {
    this.graphWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout3.en.GRAPH_WIDTH);
};

/** Sets current layout.
@param layout name of layout
*/
setLayout(layout: string) {
  layout = layout.toLowerCase().trim();
  if (this.layout_ != layout) {
    this.layout_ = layout;
    let tabName = this.layout_;
    //select the appropriate tab when in one of the 'sim+graph' layouts
    switch (tabName) {
      case LayoutOptions.GRAPH_AND_SIM:
        tabName = LayoutOptions.GRAPH;
        break;
      case LayoutOptions.TIME_GRAPH_AND_SIM:
        tabName = LayoutOptions.TIME_GRAPH;
        break
      case LayoutOptions.MULTI_GRAPH_AND_SIM:
        tabName = LayoutOptions.MULTI_GRAPH;
        break
      default:
    }
    this.setSelectedTab(tabName);
    this.redoLayout();
  }
};

/** Sets current layout based on which tab was clicked
@param layout class name of tab that was clicked
*/
setLayoutFromTab(layout: string) {
  layout = layout.toLowerCase().trim();
  if (this.show_sim) {
    // When click on a graph tab, set layout to include sim view also.
    switch (layout) {
      case LayoutOptions.GRAPH:
        layout = LayoutOptions.GRAPH_AND_SIM;
        break;
      case LayoutOptions.TIME_GRAPH:
        layout = LayoutOptions.TIME_GRAPH_AND_SIM;
        break
      case LayoutOptions.MULTI_GRAPH:
        layout = LayoutOptions.MULTI_GRAPH_AND_SIM;
        break
      default:
    }
  }
  this.setLayout(layout);
};

/** Sets selected tab to be the tab with given className
@param layout className of tab
*/
private setSelectedTab(layout: string) {
  if (this.getSelectedTab() != layout) {
    this.tab_list.childNodes.forEach(node => {
      if (node.nodeType != Node.ELEMENT_NODE) {
        // it's not an Element
        return;
      }
      const elem = node as Element;
      if (elem.tagName != 'LI') {
        // ignore text elements between the LI elements (usually whitespace)
        return;
      }
      if (elem.className.trim() == layout) {
        // add 'selected' to the className of target Element
        //console.log('* '+li_elem.className);
        elem.className += ' selected';
      } else {
        // remove 'selected' from className of all other elements
        //console.log('> '+li_elem.className);
        if (elem.className.indexOf('selected') > -1) {
          elem.className = elem.className.replace(/[ ]*selected/, '');
        }
      }
    });
  }
};

/** Sets the width of the simulation LabCanvas, as fraction of available width.
@param value  width of the simulation LabCanvas, as fraction of available width
*/
setSimWidth(value: number) {
  if (Util.veryDifferent(value, this.simWidth_)) {
    this.simWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout3.en.SIM_WIDTH);
};

/** Sets the width of the time graph LabCanvas, as fraction of available width.
@param value  width of the time graph LabCanvas, as fraction of available width
*/
setTimeGraphWidth(value: number) {
  if (Util.veryDifferent(value, this.timeGraphWidth_)) {
    this.timeGraphWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout3.en.TIME_GRAPH_WIDTH);
};

/** Change layout to hide or show simulation view.
@param visible whether sim view should be visible
*/
showSim(visible: boolean) {
  this.show_sim = visible;
  switch (this.layout_) {
    case '':
    case LayoutOptions.SIM:
      break;
    case LayoutOptions.GRAPH:
      if (visible) {
        this.setLayout(LayoutOptions.GRAPH_AND_SIM);
      }
      break;
    case LayoutOptions.GRAPH_AND_SIM:
      if (!visible) {
        this.setLayout(LayoutOptions.GRAPH);
      }
      break;
    case LayoutOptions.TIME_GRAPH:
      if (visible) {
        this.setLayout(LayoutOptions.TIME_GRAPH_AND_SIM);
      }
      break;
    case LayoutOptions.TIME_GRAPH_AND_SIM:
      if (!visible) {
        this.setLayout(LayoutOptions.TIME_GRAPH);
      }
      break;
    case LayoutOptions.MULTI_GRAPH:
      if (visible) {
        this.setLayout(LayoutOptions.MULTI_GRAPH_AND_SIM);
      }
      break;
    case LayoutOptions.MULTI_GRAPH_AND_SIM:
      if (!visible) {
        this.setLayout(LayoutOptions.MULTI_GRAPH);
      }
      break;
    default:
      throw 'showSim: no such layout "'+this.layout_+'"';
  }
};

/** @inheritDoc */
showTerminal(visible: boolean): void {
  if (this.terminalEnabled_) {
    this.div_term.style.display = visible ? 'block' : 'none';
    if (this.show_term_cb != null) {
      this.show_term_cb.checked = visible;
    }
    if (visible && this.term_input) {
      // Move the focus to Terminal, for ease of typing.
      // (But not when executing a stored script that calls showTerminal).
      this.term_input.focus();
    }
  }
};

static readonly en: i18n_strings = {
  SIM_WIDTH: 'sim-width',
  GRAPH_WIDTH: 'graph-width',
  TIME_GRAPH_WIDTH: 'time-graph-width',
  LAYOUT: 'layout',
  SHOW_TERMINAL: 'show terminal',
  SHOW_SIM: 'show simulation'
};

static readonly de_strings: i18n_strings = {
  SIM_WIDTH: 'Sim Breite',
  GRAPH_WIDTH: 'Graf Breite',
  TIME_GRAPH_WIDTH: 'Zeit Graf Breite',
  LAYOUT: 'layout',
  SHOW_TERMINAL: 'zeige Terminal',
  SHOW_SIM: 'zeige Simulation'
};

static readonly i18n = Util.LOCALE === 'de' ? TabLayout3.de_strings : TabLayout3.en;

} // end class

type i18n_strings = {
  SIM_WIDTH: string,
  GRAPH_WIDTH: string,
  TIME_GRAPH_WIDTH: string,
  LAYOUT: string,
  SHOW_TERMINAL: string,
  SHOW_SIM: string
};

Util.defineGlobal('sims$common$TabLayout3', TabLayout3);
