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

/** TabLayout is a tab-based layout for showing a simulation, graph, and controls.
TabLayout implements specific ways to present the application on the web page, in this
case with a tab-based layout. TabLayout creates and manages various layout elements
(LabCanvas, `div` for controls, Terminal, etc.). It also defines regular expressions
for easy Terminal scripting of these objects using short names such as terminal,
simCanvas, graphCanvas.

### Element IDs

TabLayout constructor takes an argument that specifies the names of the HTML
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
+  div_sim_controls
+  div_terminal
+  div_time_graph
+  div_time_graph_controls
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

### 'Show Sim' Checkbox

The 'show sim' checkbox is visible in the graph views. Clicking the 'show sim' checkbox
will change the layout to pick the appropriate version of the current layout, for
example either 'sim+graph' or 'graph'. The method {@link TabLayout.showSim} can be used
from JavaScript to accomplish the same result.

The default state of the 'show sim' checkbox is set inside the application's HTML file
by the presence or absence of the word `checked` in a line like this:

    <input type="checkbox" id="show_sim" checked>show simulation

This is usually determined by a macro in the `macros_tab.html` file.


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
arguments passed to the TabLayout constructor. In contrast, the Graph and TimeGraph
LabCanvas are always square shaped. Their size is the bigger of the Sim LabCanvas width
or height. The size of any LabCanvas can be changed after construction if desired.

3. SimView Parameters for `WIDTH, HEIGHT, CENTER_X, CENTER_Y, VERTICAL_ALIGN`, etc.
These affect only the SimRect, which determines simulation coordinates. Pan and zoom of
the image can be done by changing these Parameters.

### Layout Of Controls

We use CSS style `display: inline-block` on the controls div, so that it naturally flows
to right of the canvas if there is enough room, otherwise it flows below the canvas. The
method `alignCanvasControls()` attempts to set the controls to have 2 columns when the
controls are below the canvas.

We set the canvases to 'float: left' so that the 'show sim' and 'show terminal' controls
will flow under the controls div.

The individual controls have `display: block` and are styled with CSS.

### Terminal Checkbox

A 'show terminal' checkbox is added to the controls div in all layouts, unless the
`opt_terminal` parameter is false.

Parameters Created
------------------

+ ParameterNumber named `SIM_WIDTH`, see {@link TabLayout.setSimWidth}

+ ParameterNumber named `GRAPH_WIDTH`, see {@link TabLayout.setGraphWidth}

+ ParameterNumber named `TIME_GRAPH_WIDTH`, see {@link TabLayout.setTimeGraphWidth}

+ ParameterString named `LAYOUT`, see {@link TabLayout.setLayout}

+ ParameterBoolean named `SHOW_TERMINAL`, see {@link TabLayout.showTerminal}

*/
export class TabLayout extends AbstractSubject implements Subject, Layout, SubjectList {
  private limitSize_: boolean = true;
  /** width of simCanvas, as fraction of available width */
  private simWidth_: number = 1;
  /** width of graphCanvas, as fraction of available width */
  private graphWidth_: number = 1;
  /** width of timeGraphCanvas, as fraction of available width */
  private timeGraphWidth_: number = 1;
  /** Whether to put dashed borders around elements for debugging layout. */
  debug_layout: boolean = false;
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
  /** The 'show sim' checkbox is added to the graph views. */
  private show_sim_cb: HTMLInputElement;
  private show_sim_label: HTMLLabelElement;
  private div_graph: HTMLDivElement;
  private graphCanvas: LabCanvas;
  private div_graph_controls: HTMLDivElement;
  private controls_: LabControl[] = [];
  /** div for sim controls */
  private div_sim_controls: HTMLDivElement;
  /** div element for Terminal */
  private div_term: HTMLDivElement;
  private show_term_cb: HTMLInputElement|null = null;
  private div_time_graph: HTMLDivElement;
  private timeGraphCanvas: LabCanvas;
  /** div for time graph controls  */
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
    this.div_contain.style.border = 'dashed 1px red';
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
  this.div_sim.appendChild(this.simCanvas.getCanvas());

  // the 'show sim' checkbox.  The default 'checked' property is determined by the
  // presence of the word 'checked' in the HTML for the checkbox like this:
  //     <input type="checkbox" id="show_sim" checked>show simulation
  this.show_sim_cb = Util.getElementById(elem_ids.show_sim) as HTMLInputElement;
  const p = this.show_sim_cb.parentElement;
  if (p == null || p.tagName != 'LABEL') {
    throw '';
  }
  this.show_sim_label = p as HTMLLabelElement;
  this.show_sim_cb.addEventListener('click', 
    _e => { this.showSim(this.show_sim_cb.checked); });

  this.div_graph = Util.getElementById(elem_ids.div_graph) as HTMLDivElement;
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.div_graph.style.position = 'relative';
  const canvas2 = document.createElement('canvas');
  this.graphCanvas = new LabCanvas(canvas2, 'GRAPH_CANVAS');
  canvasWidth = Math.max(canvasWidth, canvasHeight);
  this.graphCanvas.setSize(canvasWidth, canvasWidth);
  this.div_graph.appendChild(canvas2);

  this.div_graph_controls =
      Util.getElementById(elem_ids.graph_controls) as HTMLDivElement;
  if (this.debug_layout) {
    this.div_graph_controls.style.border = 'dashed 1px green';
  }
  this.div_sim_controls =
      Util.getElementById(elem_ids.sim_controls) as HTMLDivElement;
  // marginLeft gives gap when controls are along side canvas.
  this.div_sim_controls.style.marginLeft = '10px';
  if (this.debug_layout) {
    this.div_sim_controls.style.border = 'dashed 1px green';
  }

  this.div_term =
      Util.getElementById(elem_ids.div_terminal) as HTMLDivElement;
  this.div_term.style.display = 'none';
  if (this.debug_layout) {
    this.div_term.style.border = 'dashed 1px green';
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
  this.div_time_graph.appendChild(canvas3);

  this.div_time_graph_controls =
      Util.getElementById(elem_ids.time_graph_controls) as HTMLDivElement;
  if (this.debug_layout) {
    this.div_time_graph_controls.style.border = 'dashed 1px green';
  }

  this.redoLayout();
  this.addParameter(new ParameterNumber(this, TabLayout.en.SIM_WIDTH,
      TabLayout.i18n.SIM_WIDTH, () => this.getSimWidth(),
      a => this.setSimWidth(a)));
  this.addParameter(new ParameterNumber(this, TabLayout.en.GRAPH_WIDTH,
      TabLayout.i18n.GRAPH_WIDTH, () => this.getGraphWidth(),
      a => this.setGraphWidth(a)));
  this.addParameter(new ParameterNumber(this, TabLayout.en.TIME_GRAPH_WIDTH,
      TabLayout.i18n.TIME_GRAPH_WIDTH, () => this.getTimeGraphWidth(),
      a => this.setTimeGraphWidth(a)));
  this.addParameter(new ParameterString(this, TabLayout.en.LAYOUT,
      TabLayout.i18n.LAYOUT, () => this.getLayout(),
      a => this.setLayout(a),
      TabLayout.getLayoutValues(), TabLayout.getLayoutValues()));
  if (this.terminalEnabled_) {
    this.addParameter(new ParameterBoolean(this, TabLayout.en.SHOW_TERMINAL,
        TabLayout.i18n.SHOW_TERMINAL,
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
  return 'TabLayout';
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
    element.style.display = 'block';
    this.div_sim_controls.appendChild(element);
  }
  this.controls_.push(control);
  return control;
};

/** Positions the controls in relation to the canvas. We use CSS style `display:
* inline-block` on the controls div, so that it naturally flows to right of the
* canvas if there is enough room, otherwise it flows below the canvas. This
* method attempts to set the controls to have 2 columns when the controls are
* below the canvas.
* @param canvas  the div containing the canvas element
* @param controls  the div containing the controls
* @param canvas2
*/
private alignCanvasControls(canvas: HTMLElement, controls: HTMLElement, canvas2?: HTMLElement): void {
  canvas.style.display = 'block';
  controls.style.display = 'inline-block';
  controls.style.columnCount = '1';
  controls.style.width = 'auto';
  // Get the 'natural width' of the controls.
  let ctrl_width = controls.getBoundingClientRect().width;
  // boundingClientRect is sometimes 0, like at startup.
  ctrl_width = ctrl_width > 150 ? ctrl_width : 300;
  // offsetWidth seems more reliable, but is sometimes 0, like at startup
  let cvs_width = canvas.offsetWidth || canvas.getBoundingClientRect().width;
  // When both canvas are visible, use sum of their widths to calculate
  // available width for controls-div.
  if (canvas2 != null) {
    canvas2.style.display = 'block';
    cvs_width += canvas2.offsetWidth || canvas2.getBoundingClientRect().width;
  }
  const contain_width = this.div_contain.offsetWidth ||
      this.div_contain.getBoundingClientRect().width;
  // avail_width = width of space to right of canvas.
  // Subtract 2 makes it work better on Safari...
  const avail_width = contain_width - cvs_width - 2;
  // If (not enough space to right of canvas) then controls will be below canvas.
  // In that case: if (enough space for 2 columns) then do 2 columns
  if (avail_width < ctrl_width && contain_width > 2*ctrl_width) {
    controls.style.width = '100%';
    controls.style.columnCount = '2';
  }
  /*console.log('alignCanvasControls ctrl_width='+ctrl_width
      +' avail_width='+avail_width
      +' contain_width='+contain_width
      +' cvs_width='+cvs_width
      +' controls.top='+controls.getBoundingClientRect().top
      +' columnCount='+controls.style.columnCount);
  */
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
* @return width of the graph LabCanvas, as fraction of available width
*/
getGraphWidth(): number {
  return this.graphWidth_;
};

/** Returns current layout.
* @return name of the current layout
*/
getLayout(): string {
  return this.layout_;
};

/** Returns classname of selected tab
* @return classname of selected tab, or empty string if none selected
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
* @return width of the simulation LabCanvas, as fraction of available width
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
* @return width of the time graph LabCanvas, as fraction of available width
*/
getTimeGraphWidth(): number {
  return this.timeGraphWidth_;
};

/** Redo the current layout, either because the type of layout changed or the size
* of the view port changed.
*/
private redoLayout(): void {
  // WARNING-NOTE: use goog.style.setFloat() to set float property.
  // Do NOT use style.float (it works in some browsers but is non-standard because
  // 'float' is a javascript reserved word).
  // You can use style.cssFloat, but IE uses a different name: styleFloat.
  // WARNING-NOTE: viewport size can change if scrollbars appear or disappear
  // due to layout changes.
  const view_width = Util.getViewportSize()[0];
  this.div_sim.style.float = 'left';
  this.div_graph.style.float = 'left';
  this.div_time_graph.style.float = 'left';
  switch (this.layout_) {
    case '':
    case LayoutOptions.SIM:
      this.div_graph.style.display = 'none';
      this.div_graph_controls.style.display = 'none';
      this.div_time_graph.style.display = 'none';
      this.div_time_graph_controls.style.display = 'none';
      this.setDisplaySize(0.95*this.simWidth_, this.div_graph);
      this.alignCanvasControls(this.div_sim, this.div_sim_controls);
      this.show_sim_label.style.display = 'none';
      break;
    case LayoutOptions.GRAPH:
      this.div_sim.style.display = 'none';
      this.div_sim_controls.style.display = 'none';
      this.div_time_graph.style.display = 'none';
      this.div_time_graph_controls.style.display = 'none';
      this.setDisplaySize(0.95*this.graphWidth_, this.div_graph);
      this.alignCanvasControls(this.div_graph, this.div_graph_controls);
      this.show_sim_cb.checked = false;
      this.show_sim_label.style.display = 'inline';
      break;
    case LayoutOptions.GRAPH_AND_SIM:
      this.div_time_graph.style.display = 'none';
      this.div_sim_controls.style.display = 'none';
      this.div_time_graph_controls.style.display = 'none';
      if (view_width > 600) {
        this.setDisplaySize(0.49, this.div_graph);
      } else {
        this.setDisplaySize(0.95*this.graphWidth_, this.div_graph);
      }
      this.alignCanvasControls(this.div_graph, this.div_graph_controls, this.div_sim);
      this.show_sim_cb.checked = true;
      this.show_sim_label.style.display = 'inline';
      break;
    case LayoutOptions.TIME_GRAPH:
      this.div_graph.style.display = 'none';
      this.div_graph_controls.style.display = 'none';
      this.div_sim.style.display = 'none';
      this.div_sim_controls.style.display = 'none';
      this.setDisplaySize(0.95*this.timeGraphWidth_, this.div_time_graph);
      this.alignCanvasControls(this.div_time_graph, this.div_time_graph_controls);
      this.show_sim_cb.checked = false;
      this.show_sim_label.style.display = 'inline';
      break;
    case LayoutOptions.TIME_GRAPH_AND_SIM:
      this.div_graph.style.display = 'none';
      this.div_sim_controls.style.display = 'none';
      this.div_graph_controls.style.display = 'none';
      if (view_width > 600) {
        this.setDisplaySize(0.49, this.div_time_graph);
      } else {
        this.setDisplaySize(0.95*this.timeGraphWidth_, this.div_time_graph);
      }
      this.alignCanvasControls(this.div_time_graph, this.div_time_graph_controls,
          this.div_sim);
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
      this.setDisplaySize(0.49, this.div_graph);
      this.setDisplaySize(0.49, this.div_time_graph);
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
      this.setDisplaySize(0.49, this.div_graph);
      this.setDisplaySize(0.49, this.div_time_graph);
      this.show_sim_cb.checked = true;
      this.show_sim_label.style.display = 'inline';
      break;
    default:
      throw 'redoLayout: no such layout "'+this.layout_+'"';
  }
};

/** Sets the size of the SimCanvas and a graph. This limits the SimCanvas so that it
* fits in the window.
* @param max_width size of SimCanvas, as fraction of screen width, from 0 to 1
* @param graph_div
*/
private setDisplaySize(max_width: number, graph_div: HTMLElement): void {
  if (this.limitSize_) {
    // Limit size of SimCanvas so it fits in the window.
    // Let divsim_h, divsim_w be dimensions of div_sim in pixels.
    // Let cvs_h, cvs_w be dimensions of canvas in pixels.
    // To ensure that div_sim vertical dimension is all visible:
    //    divsim_h = divsim_w (cvs_h/cvs_w) <= window_h
    //    divsim_w <= window_h (cvs_w/cvs_h)
    // Convert this to fractional width:
    //    (divsim_w/window_w) <= (window_h/window_w) * (cvs_w/cvs_h)
    const window_sz = Util.getViewportSize();
    const window_h = (window_sz[1] - 80);
    // Use the container div for width, not the screen. container div is more reliable.
    // This avoids issues with whether scrollbars are visible.
    const window_w = this.div_contain.offsetWidth ||
        this.div_contain.getBoundingClientRect().width;
    const cvs_sz = this.simCanvas.getScreenRect();
    const cvs_w = cvs_sz.getWidth();
    const cvs_h = cvs_sz.getHeight();
    const limit_w = (window_h/window_w) * (cvs_w/cvs_h);
    max_width = Math.min(max_width, limit_w);
  }
  const widthPct = (Math.floor(max_width*100) + '%');
  this.div_sim.style.width = widthPct;
  this.div_sim.style.height = 'auto';
  graph_div.style.width = widthPct;
  graph_div.style.height = 'auto';
};

/** Sets the width of the graph LabCanvas, as fraction of available width.
* @param value  width of the graph LabCanvas, as fraction of available width
*/
setGraphWidth(value: number): void {
  if (Util.veryDifferent(value, this.graphWidth_)) {
    this.graphWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout.en.GRAPH_WIDTH);
};

/** Sets current layout.
* @param layout name of layout
*/
setLayout(layout: string): void {
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
* @param layout class name of tab that was clicked
*/
setLayoutFromTab(layout: string): void {
  layout = layout.toLowerCase().trim();
  // Preserve the state of the "show simulation" checkbox
  if (this.show_sim_cb.checked) {
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
* @param layout className of tab
*/
private setSelectedTab(layout: string): void {
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
* @param value  width of the simulation LabCanvas, as fraction of available width
*/
setSimWidth(value: number): void {
  if (Util.veryDifferent(value, this.simWidth_)) {
    this.simWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout.en.SIM_WIDTH);
};

/** Sets the width of the time graph LabCanvas, as fraction of available width.
* @param value  width of the time graph LabCanvas, as fraction of available width
*/
setTimeGraphWidth(value: number): void {
  if (Util.veryDifferent(value, this.timeGraphWidth_)) {
    this.timeGraphWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout.en.TIME_GRAPH_WIDTH);
};

/** Change layout to hide or show simulation view.
* @param visible whether sim view should be visible
*/
showSim(visible: boolean): void {
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
  SHOW_TERMINAL: 'show terminal'
};

static readonly de_strings: i18n_strings = {
  SIM_WIDTH: 'Sim Breite',
  GRAPH_WIDTH: 'Graf Breite',
  TIME_GRAPH_WIDTH: 'Zeit Graf Breite',
  LAYOUT: 'layout',
  SHOW_TERMINAL: 'zeige Terminal'
};

static readonly i18n = Util.LOCALE === 'de' ? TabLayout.de_strings : TabLayout.en;

}; // end TabLayout class

type i18n_strings = {
  SIM_WIDTH: string,
  GRAPH_WIDTH: string,
  TIME_GRAPH_WIDTH: string,
  LAYOUT: string,
  SHOW_TERMINAL: string
};

Util.defineGlobal('sims$common$TabLayout', TabLayout);
