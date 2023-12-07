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

goog.module('myphysicslab.sims.common.TabLayout3');

const array = goog.require('goog.array');
const dom = goog.require('goog.dom');
const style = goog.require('goog.style');
const events = goog.require('goog.events');
const EventType = goog.require('goog.events.EventType');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const Layout = goog.require('myphysicslab.sims.common.Layout');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const SubjectList = goog.require('myphysicslab.lab.util.SubjectList');
const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const Util = goog.require('myphysicslab.lab.util.Util');

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
example either 'sim+graph' or 'graph'. The method {@link #showSim} can be used from
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

When using advanced-optimizations compile mode the Terminal can still be used for
EasyScript commands. However general Javascript will not work because
all method and class names are minified and unused code is eliminated.

Parameters Created
------------------

+ ParameterNumber named `SIM_WIDTH`, see {@link #setSimWidth}

+ ParameterNumber named `GRAPH_WIDTH`, see {@link #setGraphWidth}

+ ParameterNumber named `TIME_GRAPH_WIDTH`, see {@link #setTimeGraphWidth}

+ ParameterString named `LAYOUT`, see {@link #setLayout}

+ ParameterBoolean named `SHOW_TERMINAL`, see {@link #showTerminal}

* @implements {SubjectList}
* @implements {Layout}
*/
class TabLayout3 extends AbstractSubject {
/**
* @param {!Object} elem_ids specifies the names of the HTML
*    elements to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {number=} canvasWidth width of sim canvas in pixels, default 800
* @param {number=} canvasHeight height of sim canvas in pixels, default 800
* @param {boolean=} opt_terminal whether to add the 'show terminal' checkbox, default
*    is true
*/
constructor(elem_ids, canvasWidth, canvasHeight, opt_terminal) {
  super('TAB_LAYOUT');
  canvasWidth = canvasWidth || 800;
  canvasHeight = canvasHeight || 800;
  opt_terminal = opt_terminal === undefined ? true : opt_terminal;
  /**
  * @type {boolean}
  * @private
  */
  this.limitSize_ = true;
  /** width of simCanvas, as fraction of available width
  * @type {number}
  * @private
  */
  this.simWidth_ = 1;
  /** width of graphCanvas, as fraction of available width
  * @type {number}
  * @private
  */
  this.graphWidth_ = 1;
  /** width of timeGraphCanvas, as fraction of available width
  * @type {number}
  * @private
  */
  this.timeGraphWidth_ = 1;
  Util.setImagesDir(elem_ids['images_dir']);
  /** Whether to put dashed outline around elements for debugging layout.
  * Outline differs from borders. Unlike border, the outline is drawn outside the
  * element's border, and may overlap other content. Also, the outline is NOT a part
  * of the element's dimensions; the element's total width and height is not affected
  * by the width of the outline.
  * @type {boolean}
  * @private
  * @const
  */
  this.debug_layout = false;
  /** @type {!HTMLElement}
  * @private
  */
  this.tab_list = Util.getElementById(elem_ids, 'tab_list');
  /** name of current layout
  @type {string}
  @private
  */
  this.layout_ = this.getSelectedTab();
  /** Can disable terminal with this flag.
  * @type {boolean}
  * @private
  * @const
  */
  this.terminalEnabled_ = opt_terminal;
  if (this.layout_ == '') {
    this.layout_ = TabLayout3.Layout.SIM;
    this.setSelectedTab(this.layout_);
  }

  // when click on a tab (other than current selected tab) we switch to that layout.
  events.listen(this.tab_list, EventType.CLICK,
      e => {
        const target = /** @type {Element} */(e.target);
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

  events.listen(window, EventType.RESIZE,
      () => this.redoLayout() );
  events.listen(window, EventType.ORIENTATIONCHANGE,
      () => this.redoLayout() );

  const term_output = /** @type {?HTMLInputElement} */ (Util.maybeElementById(elem_ids, 'term_output'));
  /**
  * @type {?HTMLInputElement}
  * @private
  */
  this.term_input = /** @type {?HTMLInputElement} */ (Util.maybeElementById(elem_ids, 'term_input'));
  /** @type {!Terminal}
  * @private
  */
  this.terminal = new Terminal(this.term_input, term_output);
  Terminal.stdRegex(this.terminal);

  /** @type {!HTMLElement}
  * @private
  */
  this.div_contain = Util.getElementById(elem_ids, 'container');
  if (this.debug_layout) {
    this.div_contain.style.outline = 'dashed 1px red';
  }

  /** @type {!HTMLElement}
  * @private
  */
  this.div_sim = Util.getElementById(elem_ids, 'sim_applet');
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.div_sim.style.position = 'relative';
  const canvas = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /* tabIndex = 0 makes the canvas selectable via tab key or mouse, so it can
  * get text events. A value of 0 indicates that the element should be placed in the
  * default navigation order. This allows elements that are not natively focusable
  * (such as <div>, <span>, and ) to receive keyboard focus.
  */
  canvas.tabIndex = 0;
  /** @type {!LabCanvas}
  * @private
  */
  this.simCanvas = new LabCanvas(canvas, 'SIM_CANVAS');
  this.simCanvas.setSize(canvasWidth, canvasHeight);
  this.div_sim.insertBefore(this.simCanvas.getCanvas(), this.div_sim.firstChild);

  /** Whether to also show the simulation in the graph views. Default for small
  * screens is to not show the simulation, so that clicking on the graph tab
  * shows the graph.
  * @type {boolean}
  * @private
  */
  this.show_sim = dom.getViewportSize().width > 600;
  /** The 'show sim' checkbox is added to the graph views.
  * @type {!HTMLInputElement}
  * @private
  */
  this.show_sim_cb = /** @type {!HTMLInputElement} */ (Util.getElementById(elem_ids, 'show_sim'));
  const p = dom.getParentElement(this.show_sim_cb);
  if (p == null || p.tagName != 'LABEL') {
    throw '';
  }
  this.show_sim_cb.checked = this.show_sim;
  /** @type {!HTMLLabelElement}
  * @private
  */
  this.show_sim_label = /** @type {!HTMLLabelElement} */(p);
  events.listen(this.show_sim_cb, EventType.CLICK,
    e => {
      this.showSim(this.show_sim_cb.checked);
    });

  /** @type {!HTMLElement}
  * @private
  */
  this.div_graph = Util.getElementById(elem_ids, 'div_graph');
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.div_graph.style.position = 'relative';
  const canvas2 = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /** @type {!LabCanvas}
  * @private
  */
  this.graphCanvas = new LabCanvas(canvas2, 'GRAPH_CANVAS');
  canvasWidth = Math.max(canvasWidth, canvasHeight);
  this.graphCanvas.setSize(canvasWidth, canvasWidth);
  this.div_graph.insertBefore(canvas2, this.div_graph.firstChild);

  /** div for graph controls
  * @type {!HTMLElement}
  * @private
  */
  this.graph_controls = Util.getElementById(elem_ids, 'graph_controls');
  if (this.debug_layout) {
    this.graph_controls.style.outline = 'dashed 1px green';
  }

  /** @type {!Array<!LabControl>}
  * @private
  */
  this.controls_ = [];
  /** div for sim controls
  * @type {!HTMLElement}
  * @private
  */
  this.sim_controls = Util.getElementById(elem_ids, 'sim_controls');
  // marginLeft gives gap when controls are along side canvas.
  //this.sim_controls.style.marginLeft = '10px';
  if (this.debug_layout) {
    this.sim_controls.style.outline = 'dashed 1px green';
  }

  /** div element for Terminal
  * @type {!HTMLElement}
  * @private
  */
  this.div_term = Util.getElementById(elem_ids, 'div_terminal');
  this.div_term.style.display = 'none';
  if (this.debug_layout) {
    this.div_term.style.outline = 'dashed 1px green';
  }

  // 'show terminal' checkbox.
  const label_term = /** @type {!HTMLInputElement} */ (Util.getElementById(elem_ids, 'label_terminal'));
  /**
  * @type {!HTMLInputElement}
  * @private
  */
  this.show_term_cb;
  if (!this.terminalEnabled_) {
    label_term.style.display = 'none';
  } else {
    label_term.style.display = 'inline';
    this.show_term_cb = /** @type {!HTMLInputElement} */ (Util.getElementById(elem_ids, 'show_terminal'));
    events.listen(this.show_term_cb, EventType.CLICK,
      e => this.showTerminal(this.show_term_cb.checked) );
  }

  /** @type {!HTMLElement}
  * @private
  */
  this.div_time_graph = Util.getElementById(elem_ids, 'div_time_graph');
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.div_time_graph.style.position = 'relative';
  const canvas3 = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /** @type {!LabCanvas}
  * @private
  */
  this.timeGraphCanvas = new LabCanvas(canvas3, 'TIME_GRAPH_CANVAS');
  this.timeGraphCanvas.setSize(canvasWidth, canvasWidth);
  this.div_time_graph.insertBefore(canvas3, this.div_time_graph.firstChild);

  /** div for time graph controls
  * @type {!HTMLElement}
  * @private
  */
  this.time_graph_controls = Util.getElementById(elem_ids, 'time_graph_controls');
  if (this.debug_layout) {
    this.time_graph_controls.style.outline = 'dashed 1px green';
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
      TabLayout3.getValues(), TabLayout3.getValues()));
  this.addParameter(new ParameterBoolean(this, TabLayout3.en.SHOW_SIM,
      TabLayout3.i18n.SHOW_SIM,
      () => this.show_sim,
      a => this.showSim(a) ));
  if (this.terminalEnabled_) {
    this.addParameter(new ParameterBoolean(this, TabLayout3.en.SHOW_TERMINAL,
        TabLayout3.i18n.SHOW_TERMINAL,
        () => this.show_term_cb.checked,
        a => this.showTerminal(a) ));
  }
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
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

/** @override */
getClassName() {
  return 'TabLayout3';
};

/** Returns array containing all possible layout values.
* @return {!Array<!TabLayout3.Layout>} array containing all possible layout values
*/
static getValues() {
  const Layout = TabLayout3.Layout;
  return [ Layout.SIM,
      Layout.GRAPH,
      Layout.GRAPH_AND_SIM,
      Layout.TIME_GRAPH,
      Layout.TIME_GRAPH_AND_SIM,
      Layout.MULTI_GRAPH,
      Layout.MULTI_GRAPH_AND_SIM
  ];
};

/** @override */
addControl(control, opt_add) {
  opt_add = opt_add === undefined ? true : opt_add;
  if (opt_add) {
    const element = control.getElement();
    this.sim_controls.appendChild(element);
  }
  this.controls_.push(control);
  // adding a control can change the number of columns needed
  this.redoLayout();
  return control;
};

/** @override */
getGraphCanvas() {
  return this.graphCanvas;
};

/** @override */
getGraphControls() {
  return this.graph_controls;
};

/** @override */
getGraphDiv() {
  return this.div_graph;
};

/** Returns the width of the graph LabCanvas, as fraction of available width
@return {number} width of the graph LabCanvas, as fraction of available width
*/
getGraphWidth() {
  return this.graphWidth_;
};

/** Returns current layout.
@return {string} name of the current layout
*/
getLayout() {
  return this.layout_;
};

/** Returns classname of selected tab
@return {string} classname of selected tab, or empty string if none selected
@private
*/
getSelectedTab() {
  const tab = array.find(this.tab_list.childNodes,
    function(/** !Node */n) {
      if (n.nodeType != Node.ELEMENT_NODE) {
        return false;
      }
      const elem = /** @type {!Element} */(n);
      if (elem.tagName != 'LI') {
        return false;
      }
      return elem.className.match(/.*selected/) != null;
    });
  if (tab == null) {
    return '';
  }
  const tab2 = /** @type {!Element} */(tab);
  // return className minus ' selected'
  return tab2.className.replace(/[ ]*selected/, '');
};


/** @override */
getSimCanvas() {
  return this.simCanvas;
};

/** @override */
getSimControls() {
  return this.sim_controls;
};

/** @override */
getSimDiv() {
  return this.div_sim;
};

/** Returns the width of the simulation LabCanvas, as fraction of available width
@return {number} width of the simulation LabCanvas, as fraction of available width
*/
getSimWidth() {
  return this.simWidth_;
};

/** @override */
getSubjects() {
  return [ this, this.simCanvas, this.graphCanvas, this.timeGraphCanvas ];
};

/** @override */
getTerminal() {
  return this.terminal;
};

/** @override */
getTimeGraphCanvas() {
  return this.timeGraphCanvas;
};

/** @override */
getTimeGraphControls() {
  return this.time_graph_controls;
};

/** @override */
getTimeGraphDiv() {
  return this.div_time_graph;
};

/** Returns the width of the time graph LabCanvas, as fraction of available width
@return {number} width of the time graph LabCanvas, as fraction of available width
*/
getTimeGraphWidth() {
  return this.timeGraphWidth_;
};

/** Sets the number of columns for the controls div. Finds the width of a 1 column div,
and uses that to determine how many columns will fit across the entire viewDiv. Assumes
that the viewDiv contains both the canvas and controlsDiv. (I have not found a way to do
this with just CSS).
* @param {!HTMLElement} viewDiv  the div containing the canvas and controlsDiv
* @param {!HTMLElement} canvas  the graph or simview
* @param {!HTMLElement} controlsDiv  the div containing the controls
* @private
*/
setControlsColumns(viewDiv, canvas, controlsDiv) {
  // set to 1 column in order to get the width of a single column, and to see whether
  // CSS-browser decides to put the controlsDiv to the right of canvas.
  controlsDiv.style['columnCount'] = '1';
  controlsDiv.style['column-gap'] = '5px';
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
    const e =  /** @type {!HTMLElement} */(controlsDiv.children[i]);
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
  controlsDiv.style['columnCount'] = cols.toString();
};

/** Redo the current layout, either because the type of layout changed or the size
of the view port changed.
@return {undefined}
@private
*/
redoLayout() {
  // WARNING-NOTE: use goog.style.setFloat() to set float property.
  // Do NOT use style.float (it works in some browsers but is non-standard because
  // 'float' is a javascript reserved word).
  // You can use style.cssFloat, but IE uses a different name: styleFloat.
  // WARNING-NOTE: viewport size can change if scrollbars appear or disappear
  // due to layout changes.
  const Layout = TabLayout3.Layout;
  const view_sz = dom.getViewportSize();
  this.div_contain.style['flex-direction'] = 'row';
  this.div_contain.style['flex-wrap'] = 'nowrap';
  const simBig = (this.simWidth_ * 95).toFixed(1);
  const simSmall = (this.simWidth_ * 47.5).toFixed(1);
  const graphBig = (this.graphWidth_ * 95).toFixed(1);
  const graphSmall = (this.graphWidth_ * 47.5).toFixed(1);
  const timeGraphBig = (this.timeGraphWidth_ * 95).toFixed(1);
  const timeGraphSmall = (this.timeGraphWidth_ * 47.5).toFixed(1);
  let sz;
  switch (this.layout_) {
    case '':
    case Layout.SIM:
      this.div_sim.style.display = 'block';
      // "display: inline-block" allows the controls to appear to right of canvas
      this.sim_controls.style.display = 'inline-block';
      this.div_graph.style.display = 'none';
      this.div_time_graph.style.display = 'none';
      this.show_sim_label.style.display = 'none';
      this.simCanvas.getCanvas().style['max-width'] = simBig+'vw';
      this.simCanvas.getCanvas().style['max-height'] = simBig+'vh';
      this.setControlsColumns(this.div_sim, this.simCanvas.getCanvas(),
          this.sim_controls);
      break;
    case Layout.GRAPH:
      this.div_graph.style.display = 'block';
      this.graph_controls.style.display = 'inline-block';
      this.div_sim.style.display = 'none';
      this.div_time_graph.style.display = 'none';
      this.graphCanvas.getCanvas().style['max-width'] = graphBig+'vw';
      this.graphCanvas.getCanvas().style['max-height'] = graphBig+'vh';
      this.setControlsColumns(this.div_graph, this.graphCanvas.getCanvas(),
          this.graph_controls);
      this.show_sim_cb.checked = false;
      this.show_sim_label.style.display = 'inline';
      break;
    case Layout.GRAPH_AND_SIM:
      this.div_sim.style.display = 'block';
      this.div_graph.style.display = 'block';
      this.div_time_graph.style.display = 'none';
      // "display: block" causes the controls to appear below the canvas
      this.sim_controls.style.display = 'block';
      this.graph_controls.style.display = 'block';
      if (view_sz.width > 600) {
        this.simCanvas.getCanvas().style['max-width'] = simSmall+'vw';
        this.graphCanvas.getCanvas().style['max-width'] = graphSmall+'vw';
      } else {
        this.div_contain.style['flex-direction'] = 'column';
        this.simCanvas.getCanvas().style['max-width'] = simBig+'vw';
        this.simCanvas.getCanvas().style['max-height'] = simBig+'vh';
        this.graphCanvas.getCanvas().style['max-width'] = graphBig+'vw';
        this.graphCanvas.getCanvas().style['max-height'] = graphBig+'vh';
      }
      //console.log('graph+sim set sim');
      this.setControlsColumns(this.div_sim, this.simCanvas.getCanvas(),
          this.sim_controls);
      //console.log('graph+sim set graph');
      this.setControlsColumns(this.div_graph, this.graphCanvas.getCanvas(),
          this.graph_controls);
      this.show_sim_cb.checked = true;
      this.show_sim_label.style.display = 'inline';
      break;
    case Layout.TIME_GRAPH:
      this.div_time_graph.style.display = 'block';
      this.time_graph_controls.style.display = 'inline-block';
      this.div_sim.style.display = 'none';
      this.div_graph.style.display = 'none';
      this.timeGraphCanvas.getCanvas().style['max-width'] = timeGraphBig+'vw';
      this.timeGraphCanvas.getCanvas().style['max-height'] = timeGraphBig+'vh';
      this.setControlsColumns(this.div_time_graph, this.timeGraphCanvas.getCanvas(),
          this.time_graph_controls);
      this.show_sim_cb.checked = false;
      this.show_sim_label.style.display = 'inline';
      break;
    case Layout.TIME_GRAPH_AND_SIM:
      this.div_sim.style.display = 'block';
      this.div_time_graph.style.display = 'block';
      this.div_graph.style.display = 'none';
      // "display: block" causes the controls to appear below the canvas
      this.sim_controls.style.display = 'block';
      this.time_graph_controls.style.display = 'block';
      if (view_sz.width > 600) {
        this.simCanvas.getCanvas().style['max-width'] = simSmall+'vw';
        this.timeGraphCanvas.getCanvas().style['max-width'] = timeGraphSmall+'vw';
      } else {
        this.div_contain.style['flex-direction'] = 'column';
        this.simCanvas.getCanvas().style['max-width'] = simBig+'vw';
        this.simCanvas.getCanvas().style['max-height'] = simBig+'vh';
        this.timeGraphCanvas.getCanvas().style['max-width'] = timeGraphBig+'vw';
        this.timeGraphCanvas.getCanvas().style['max-height'] = timeGraphBig+'vh';
      }
      this.setControlsColumns(this.div_sim, this.simCanvas.getCanvas(),
          this.sim_controls);
      this.setControlsColumns(this.div_time_graph, this.timeGraphCanvas.getCanvas(),
          this.time_graph_controls);
      this.show_sim_cb.checked = true;
      this.show_sim_label.style.display = 'inline';
      break;
    case Layout.MULTI_GRAPH:
      this.div_graph.style.display = 'block';
      this.div_time_graph.style.display = 'block';
      this.div_sim.style.display = 'none';
      this.sim_controls.style.display = 'none';
      this.graph_controls.style.display = 'none';
      this.time_graph_controls.style.display = 'none';
      this.div_contain.style['flex-direction'] = view_sz.width > 600 ? 'row' : 'column';
      sz = (view_sz.width > 600) ? '47.5vw' : '95vw';
      this.graphCanvas.getCanvas().style['max-width'] = sz;
      this.timeGraphCanvas.getCanvas().style['max-width'] = sz;
      this.show_sim_cb.checked = false;
      this.show_sim_label.style.display = 'inline';
      break;
    case Layout.MULTI_GRAPH_AND_SIM:
      this.div_graph.style.display = 'block';
      this.div_time_graph.style.display = 'block';
      this.div_sim.style.display = 'block';
      this.sim_controls.style.display = 'none';
      this.graph_controls.style.display = 'none';
      this.time_graph_controls.style.display = 'none';
      this.div_contain.style['flex-wrap'] = 'wrap';
      sz = (view_sz.width > 600) ? '47.5vw' : '95vw';
      this.graphCanvas.getCanvas().style['max-width'] = sz;
      this.timeGraphCanvas.getCanvas().style['max-width'] = sz;
      this.simCanvas.getCanvas().style['max-width'] = sz;
      this.show_sim_cb.checked = true;
      this.show_sim_label.style.display = 'inline';
      break;
    default:
      throw 'redoLayout: no such layout "'+this.layout_+'"';
  }
};

/** Sets the width of the graph LabCanvas, as fraction of available width.
@param {number} value  width of the graph LabCanvas, as fraction of available width
*/
setGraphWidth(value) {
  if (Util.veryDifferent(value, this.graphWidth_)) {
    this.graphWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout3.en.GRAPH_WIDTH);
};

/** Sets current layout.
@param {string} layout name of layout
*/
setLayout(layout) {
  const Layout = TabLayout3.Layout;
  layout = layout.toLowerCase().trim();
  if (this.layout_ != layout) {
    this.layout_ = layout;
    let tabName = this.layout_;
    //select the appropriate tab when in one of the 'sim+graph' layouts
    switch (tabName) {
      case Layout.GRAPH_AND_SIM:
        tabName = Layout.GRAPH;
        break;
      case Layout.TIME_GRAPH_AND_SIM:
        tabName = Layout.TIME_GRAPH;
        break
      case Layout.MULTI_GRAPH_AND_SIM:
        tabName = Layout.MULTI_GRAPH;
        break
      default:
    }
    this.setSelectedTab(tabName);
    this.redoLayout();
  }
};

/** Sets current layout based on which tab was clicked
@param {string} layout class name of tab that was clicked
*/
setLayoutFromTab(layout) {
  const Layout = TabLayout3.Layout;
  const view_sz = dom.getViewportSize();
  layout = layout.toLowerCase().trim();
  if (this.show_sim) {
    // When click on a graph tab, set layout to include sim view also.
    switch (layout) {
      case Layout.GRAPH:
        layout = Layout.GRAPH_AND_SIM;
        break;
      case Layout.TIME_GRAPH:
        layout = Layout.TIME_GRAPH_AND_SIM;
        break
      case Layout.MULTI_GRAPH:
        layout = Layout.MULTI_GRAPH_AND_SIM;
        break
      default:
    }
  }
  this.setLayout(layout);
};

/** Sets selected tab to be the tab with given className
@param {string} layout className of tab
@private
*/
setSelectedTab(layout) {
  if (this.getSelectedTab() != layout) {
    this.tab_list.childNodes.forEach(node => {
      if (node.nodeType != Node.ELEMENT_NODE) {
        // it's not an Element
        return;
      }
      const elem = /** @type {!Element} */(node);
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
@param {number} value  width of the simulation LabCanvas, as fraction of available width
*/
setSimWidth(value) {
  if (Util.veryDifferent(value, this.simWidth_)) {
    this.simWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout3.en.SIM_WIDTH);
};

/** Sets the width of the time graph LabCanvas, as fraction of available width.
@param {number} value  width of the time graph LabCanvas, as fraction of available width
*/
setTimeGraphWidth(value) {
  if (Util.veryDifferent(value, this.timeGraphWidth_)) {
    this.timeGraphWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout3.en.TIME_GRAPH_WIDTH);
};

/** Change layout to hide or show simulation view.
@param {boolean} visible whether sim view should be visible
*/
showSim(visible) {
  const Layout = TabLayout3.Layout;
  this.show_sim = visible;
  switch (this.layout_) {
    case '':
    case Layout.SIM:
      break;
    case Layout.GRAPH:
      if (visible) {
        this.setLayout(Layout.GRAPH_AND_SIM);
      }
      break;
    case Layout.GRAPH_AND_SIM:
      if (!visible) {
        this.setLayout(Layout.GRAPH);
      }
      break;
    case Layout.TIME_GRAPH:
      if (visible) {
        this.setLayout(Layout.TIME_GRAPH_AND_SIM);
      }
      break;
    case Layout.TIME_GRAPH_AND_SIM:
      if (!visible) {
        this.setLayout(Layout.TIME_GRAPH);
      }
      break;
    case Layout.MULTI_GRAPH:
      if (visible) {
        this.setLayout(Layout.MULTI_GRAPH_AND_SIM);
      }
      break;
    case Layout.MULTI_GRAPH_AND_SIM:
      if (!visible) {
        this.setLayout(Layout.MULTI_GRAPH);
      }
      break;
    default:
      throw 'showSim: no such layout "'+this.layout_+'"';
  }
};

/** Change layout to hide or show terminal text editor.
@param {boolean} visible whether terminal should be visible
*/
showTerminal(visible) {
  if (this.terminalEnabled_) {
    this.div_term.style.display = visible ? 'block' : 'none';
    this.show_term_cb.checked = visible;
    if (visible && this.term_input && !this.terminal.recalling) {
      // Move the focus to Terminal, for ease of typing.
      // (But not when executing a stored script that calls showTerminal).
      this.term_input.focus();
    }
  }
};

} // end class

/** Set of available layout options.
* @readonly
* @enum {string}
*/
TabLayout3.Layout = {
  SIM: 'sim',
  GRAPH: 'graph',
  GRAPH_AND_SIM: 'sim+graph',
  TIME_GRAPH: 'time_graph',
  TIME_GRAPH_AND_SIM: 'sim+time_graph',
  MULTI_GRAPH: 'multi_graph',
  MULTI_GRAPH_AND_SIM: 'sim+multi_graph'
};

/** Set of internationalized strings.
@typedef {{
  SIM_WIDTH: string,
  GRAPH_WIDTH: string,
  TIME_GRAPH_WIDTH: string,
  LAYOUT: string,
  SHOW_TERMINAL: string,
  SHOW_SIM: string
  }}
*/
TabLayout3.i18n_strings;

/**
@type {TabLayout3.i18n_strings}
*/
TabLayout3.en = {
  SIM_WIDTH: 'sim-width',
  GRAPH_WIDTH: 'graph-width',
  TIME_GRAPH_WIDTH: 'time-graph-width',
  LAYOUT: 'layout',
  SHOW_TERMINAL: 'show terminal',
  SHOW_SIM: 'show simulation'
};

/**
@private
@type {TabLayout3.i18n_strings}
*/
TabLayout3.de_strings = {
  SIM_WIDTH: 'Sim Breite',
  GRAPH_WIDTH: 'Graf Breite',
  TIME_GRAPH_WIDTH: 'Zeit Graf Breite',
  LAYOUT: 'layout',
  SHOW_TERMINAL: 'zeige Terminal',
  SHOW_SIM: 'zeige Simulation'
};

/** Set of internationalized strings.
@type {TabLayout3.i18n_strings}
*/
TabLayout3.i18n = goog.LOCALE === 'de' ? TabLayout3.de_strings :
    TabLayout3.en;

exports = TabLayout3;
