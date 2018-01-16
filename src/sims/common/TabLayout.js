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

goog.provide('myphysicslab.sims.common.TabLayout');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');
goog.require('myphysicslab.lab.controls.LabControl');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.SubjectList');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.LabCanvas');

goog.scope(function() {

var lab = myphysicslab.lab;

const AbstractSubject = goog.module.get('myphysicslab.lab.util.AbstractSubject');
var LabCanvas = lab.view.LabCanvas;
var LabControl = lab.controls.LabControl;
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.module.get('myphysicslab.lab.util.ParameterString');
var SubjectList = lab.util.SubjectList;
var Terminal = lab.util.Terminal;
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** TabLayout is a tab-based layout for showing a simulation, graph, controls.
TabLayout implements specific ways to present the application on the web page, in this
case with a tab-based layout. TabLayout creates and manages various layout elements
(LabCanvas, `div` for controls, Terminal, etc.). Defines regular expressions for easy
Terminal scripting of these objects using short names such as terminal, simCanvas,
graphCanvas.

TabLayout constructor takes an argument that specifies the names of the HTML
elements to look for in the HTML document; these elements are where the user
interface of the simulation is created. This allows for having two separate
simulations running concurrently on a single page.

### Layouts

There are 7 layouts:

+ *sim* shows sim-view and sim-controls
+ *graph* shows graph and graph-controls
+ *sim+graph* show graph, sim-view, and graph-controls
+ *time_graph* shows time-graph and time-graph-controls
+ *sim+time_graph*  shows time-graph and sim-view, and time-graph-controls
+ *multi_graph*  shows both graph and time-graph
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

We use <P> instead of <BR> to separate controls. This fixes a problem in Firefox which
was adding a blank line (after the controls-div, before the 'show terminal' checkbox).


### Terminal Checkbox

A 'show terminal' checkbox is added to the controls div in all layouts,
but only when not using advanced compile.

When using advanced-optimizations compile mode the Terminal will not work, because
all method and class names are minified, and unused code is eliminated -- so even if
you could get at a minified class, much of it would not be there to use.


Parameters Created
------------------

+ ParameterNumber named `SIM_WIDTH`, see {@link #setSimWidth}

+ ParameterNumber named `GRAPH_WIDTH`, see {@link #setGraphWidth}

+ ParameterNumber named `TIME_GRAPH_WIDTH`, see {@link #setTimeGraphWidth}

+ ParameterString named `LAYOUT`, see {@link #setLayout}

+ ParameterBoolean named `SHOW_TERMINAL`, see {@link #showTerminal}

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elements to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {number=} canvasWidth width of sim canvas in pixels
* @param {number=} canvasHeight height of sim canvas in pixels
* @constructor
* @final
* @struct
* @extends {AbstractSubject}
* @implements {SubjectList}
*/
myphysicslab.sims.common.TabLayout = function(elem_ids, canvasWidth, canvasHeight) {
  AbstractSubject.call(this, 'TAB_LAYOUT');
  canvasWidth = canvasWidth || 800;
  canvasHeight = canvasHeight || 800;
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
  /** Whether to put dashed borders around elements for debugging layout.
  * @type {boolean}
  * @const
  */
  this.debug_layout = false;

  /** @type {!HTMLElement} */
  this.tab_list = TabLayout.getElementById(elem_ids, 'tab_list');
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
  this.terminalEnabled_ = true;
  if (this.layout_ == '') {
    this.layout_ = Layout.SIM;
    this.setSelectedTab(this.layout_);
  }

  // when click on a tab (other than current selected tab) we switch to that layout.
  goog.events.listen(this.tab_list, goog.events.EventType.CLICK,
      goog.bind(function(e) {
        var target = /** @type {Element} */(e.target);
        if (target === undefined) {
          throw new Error('event target is undefined ');
        }
        if (target == null || target.tagName != 'LI') {
          return;
        }
        if (target.className.indexOf('selected') > -1) {
          // do nothing when click on selected tab
          return;
        }
        this.setLayoutFromTab(target.className);
      }, this));

  goog.events.listen(window, goog.events.EventType.RESIZE,
      goog.bind(this.redoLayout, this));
  goog.events.listen(window, goog.events.EventType.ORIENTATIONCHANGE,
      goog.bind(this.redoLayout, this));

  var term_output = /**@type {!HTMLInputElement}*/
      (TabLayout.getElementById(elem_ids, 'term_output'));
   /**@type {!HTMLInputElement}*/
  this.term_input = /**@type {!HTMLInputElement}*/
      (TabLayout.getElementById(elem_ids, 'term_input'));
  /** @type {!Terminal} */
  this.terminal = new Terminal(this.term_input, term_output);
  Terminal.stdRegex(this.terminal);

  /** @type {!HTMLElement} */
  this.div_contain = TabLayout.getElementById(elem_ids, 'container');
  if (this.debug_layout) {
    this.div_contain.style.border = 'dashed 1px red';
  }

  /** @type {!HTMLElement} */
  this.div_sim = TabLayout.getElementById(elem_ids, 'sim_applet');
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.div_sim.style.position = 'relative';
  var canvas = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /* tabIndex = 0 makes the canvas selectable via tab key or mouse, so it can
  * get text events. A value of 0 indicates that the element should be placed in the
  * default navigation order. This allows elements that are not natively focusable
  * (such as <div>, <span>, and ) to receive keyboard focus.
  */
  canvas.tabIndex = 0;
  /** @type {!LabCanvas} */
  this.simCanvas = new LabCanvas(canvas, 'SIM_CANVAS');
  this.simCanvas.setSize(canvasWidth, canvasHeight);
  this.div_sim.appendChild(this.simCanvas.getCanvas());

  /** The 'show sim' checkbox is added to the graph views.
  * @type {!HTMLInputElement}
  */
  this.show_sim_cb = /**@type {!HTMLInputElement}*/
      (TabLayout.getElementById(elem_ids, 'show_sim'));
  var p = goog.dom.getParentElement(this.show_sim_cb);
  if (p == null || p.tagName != 'LABEL') {
    throw new Error();
  }
  /** @type {!HTMLLabelElement} */
  this.show_sim_label = /** @type {!HTMLLabelElement} */(p);
  goog.events.listen(this.show_sim_cb, goog.events.EventType.CLICK,
    goog.bind(function(e) {
      this.showSim(this.show_sim_cb.checked);
    }, this));

  /** @type {!HTMLElement} */
  this.div_graph = TabLayout.getElementById(elem_ids, 'div_graph');
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.div_graph.style.position = 'relative';
  var canvas2 = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /** @type {!LabCanvas} */
  this.graphCanvas = new LabCanvas(canvas2, 'GRAPH_CANVAS');
  canvasWidth = Math.max(canvasWidth, canvasHeight);
  this.graphCanvas.setSize(canvasWidth, canvasWidth);
  this.div_graph.appendChild(canvas2);

  /** div for graph controls
  * @type {!HTMLElement}
  */
  this.graph_controls = TabLayout.getElementById(elem_ids, 'graph_controls');
  if (this.debug_layout) {
    this.graph_controls.style.border = 'dashed 1px green';
  }

  /** @type {!Array<!LabControl>} */
  this.controls_ = [];
  /** div for sim controls
  * @type {!HTMLElement}
  */
  this.sim_controls = TabLayout.getElementById(elem_ids, 'sim_controls');
  // marginLeft gives gap when controls are along side canvas.
  this.sim_controls.style.marginLeft = '10px';
  if (this.debug_layout) {
    this.sim_controls.style.border = 'dashed 1px green';
  }

  /** div element for Terminal
  * @type {!HTMLElement}
  */
  this.div_term = TabLayout.getElementById(elem_ids, 'div_terminal');
  this.div_term.style.display = 'none';
  if (this.debug_layout) {
    this.div_term.style.border = 'dashed 1px green';
  }

  // 'show terminal' checkbox.
  var label_term = /**@type {!HTMLInputElement}*/
      (TabLayout.getElementById(elem_ids, 'label_terminal'));
  /**
  * @type {!HTMLInputElement}
  * @private
  */
  this.show_term_cb;
  if (!this.terminalEnabled_) {
    label_term.style.display = 'none';
  } else {
    label_term.style.display = 'inline';
    this.show_term_cb = /**@type {!HTMLInputElement}*/
        (TabLayout.getElementById(elem_ids, 'show_terminal'));
    goog.events.listen(this.show_term_cb, goog.events.EventType.CLICK,
      goog.bind(function(e) {this.showTerminal(this.show_term_cb.checked);}, this));
  }

  /** @type {!HTMLElement} */
  this.div_time_graph = TabLayout.getElementById(elem_ids, 'div_time_graph');
  // 'relative' allows absolute positioning of icon controls over the canvas
  this.div_time_graph.style.position = 'relative';
  var canvas3 = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /** @type {!LabCanvas} */
  this.timeGraphCanvas = new LabCanvas(canvas3, 'TIME_GRAPH_CANVAS');
  this.timeGraphCanvas.setSize(canvasWidth, canvasWidth);
  this.div_time_graph.appendChild(canvas3);

  /** div for time graph controls
  * @type {!HTMLElement}
  */
  this.time_graph_controls = TabLayout.getElementById(elem_ids, 'time_graph_controls');
  if (this.debug_layout) {
    this.time_graph_controls.style.border = 'dashed 1px green';
  }

  this.redoLayout();
  this.addParameter(new ParameterNumber(this, TabLayout.en.SIM_WIDTH,
      TabLayout.i18n.SIM_WIDTH, goog.bind(this.getSimWidth, this),
      goog.bind(this.setSimWidth, this)));
  this.addParameter(new ParameterNumber(this, TabLayout.en.GRAPH_WIDTH,
      TabLayout.i18n.GRAPH_WIDTH, goog.bind(this.getGraphWidth, this),
      goog.bind(this.setGraphWidth, this)));
  this.addParameter(new ParameterNumber(this, TabLayout.en.TIME_GRAPH_WIDTH,
      TabLayout.i18n.TIME_GRAPH_WIDTH, goog.bind(this.getTimeGraphWidth, this),
      goog.bind(this.setTimeGraphWidth, this)));
  this.addParameter(new ParameterString(this, TabLayout.en.LAYOUT,
      TabLayout.i18n.LAYOUT, goog.bind(this.getLayout, this),
      goog.bind(this.setLayout, this),
      TabLayout.getValues(), TabLayout.getValues()));
  this.addParameter(new ParameterBoolean(this, TabLayout.en.SHOW_TERMINAL,
      TabLayout.i18n.SHOW_TERMINAL,
      goog.bind(function() { return this.show_term_cb.checked; }, this),
      goog.bind(this.showTerminal, this)));
};
var TabLayout = myphysicslab.sims.common.TabLayout;
goog.inherits(TabLayout, AbstractSubject);

if (!Util.ADVANCED) {
  /** @override */
  TabLayout.prototype.toString = function() {
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
        + goog.array.map(this.controls_, function(a) { return a.toStringShort(); })
        +']'
        + TabLayout.superClass_.toString.call(this);
  };
}

/** @override */
TabLayout.prototype.getClassName = function() {
  return 'TabLayout';
};

/** Set of available layout options.
* @readonly
* @enum {string}
*/
TabLayout.Layout = {
  SIM: 'sim',
  GRAPH: 'graph',
  GRAPH_AND_SIM: 'sim+graph',
  TIME_GRAPH: 'time_graph',
  TIME_GRAPH_AND_SIM: 'sim+time_graph',
  MULTI_GRAPH: 'multi_graph',
  MULTI_GRAPH_AND_SIM: 'sim+multi_graph'
};
var Layout = TabLayout.Layout;

/** Returns array containing all possible layout values.
* @return {!Array<!TabLayout.Layout>} array containing all possible layout values
*/
TabLayout.getValues = function() {
  return [ Layout.SIM,
     Layout.GRAPH,
     Layout.GRAPH_AND_SIM,
     Layout.TIME_GRAPH,
     Layout.TIME_GRAPH_AND_SIM,
     Layout.MULTI_GRAPH,
     Layout.MULTI_GRAPH_AND_SIM
   ];
};

/**  Names of HTML div, form, and input element's to search for by using
* {document.getElementById()}.
* @typedef {{
*  tab_list: string,
*  container: string,
*  term_output: string,
*  term_input: string,
*  sim_applet: string,
*  div_graph: string,
*  graph_controls: string,
*  sim_controls: string,
*  div_terminal: string,
*  div_time_graph: string,
*  time_graph_controls: string,
*  label_terminal: string,
*  show_terminal: string,
*  show_sim: string,
*  images_dir: string
* }}
*/
TabLayout.elementIds;

/** Finds the specified element in the HTML Document; throws an error if element
* is not found.
* @param {!TabLayout.elementIds} elem_ids  set of elementId names to look for
* @param {string} elementId specifies which elementId to get from elem_ids
* @return {!HTMLElement} the element from the current HTML Document
*/
TabLayout.getElementById = function(elem_ids, elementId) {
  // note:  Google Closure Compiler will rename properties in advanced mode.
  // Therefore, we need to get the property with a string which is not renamed.
  // It is the difference between elem_ids.sim_applet vs. elem_ids['sim_applet'].
  var e_id = elem_ids[elementId];
  if (!goog.isString(e_id)) {
    throw new Error('unknown elementId: '+elementId);
  }
  var e = /** @type {!HTMLElement} */(document.getElementById(e_id));
  if (!goog.isObject(e)) {
    throw new Error('not found: element with id='+e_id);
  }
  return e;
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
TabLayout.prototype.addControl = function(control) {
  var element = control.getElement();
  element.style.display = 'block';
  this.sim_controls.appendChild(element);
  this.controls_.push(control);
  return control;
};

/** Positions the controls in relation to the canvas. We use CSS style `display:
inline-block` on the controls div, so that it naturally flows to right of the canvas if
there is enough room, otherwise it flows below the canvas. This method attempts to set
the controls to have 2 columns when the controls are below the canvas.
* @param {!HTMLElement} canvas  the div containing the canvas element
* @param {!HTMLElement} controls  the div containing the controls
* @param {!HTMLElement=} canvas2
* @private
*/
TabLayout.prototype.alignCanvasControls = function(canvas, controls, canvas2) {
  var cvs_width, contain_width, avail_width;
  canvas.style.display = 'block';
  controls.style.display = 'inline-block';
  controls.style.columnCount = '1';
  controls.style.MozColumnCount = '1';
  controls.style.webkitColumnCount = '1';
  controls.style.width = 'auto';
  // Get the 'natural width' of the controls.
  var ctrl_width = controls.getBoundingClientRect().width;
  // boundingClientRect is sometimes 0, like at startup.
  ctrl_width = ctrl_width > 150 ? ctrl_width : 300;
  // offsetWidth seems more reliable, but is sometimes 0, like at startup
  cvs_width = canvas.offsetWidth || canvas.getBoundingClientRect().width;
  // When both canvas are visible, use sum of their widths to calculate
  // available width for controls-div.
  if (goog.isDefAndNotNull(canvas2)) {
    canvas2.style.display = 'block';
    cvs_width += canvas2.offsetWidth || canvas2.getBoundingClientRect().width;
  }
  contain_width = this.div_contain.offsetWidth ||
      this.div_contain.getBoundingClientRect().width;
  // avail_width = width of space to right of canvas.
  // Subtract 2 makes it work better on Safari...
  avail_width = contain_width - cvs_width - 2;
  // If (not enough space to right of canvas) then controls will be below canvas.
  // In that case: if (enough space for 2 columns) then do 2 columns
  if (avail_width < ctrl_width && contain_width > 2*ctrl_width) {
    controls.style.width = '100%';
    controls.style.columnCount = '2';
    controls.style.MozColumnCount = '2';
    controls.style.webkitColumnCount = '2';
  }
  /*console.log('alignCanvasControls ctrl_width='+ctrl_width
      +' avail_width='+avail_width
      +' contain_width='+contain_width
      +' cvs_width='+cvs_width
      +' controls.top='+controls.getBoundingClientRect().top
      +' columnCount='+controls.style.columnCount);
  */
};

/** Returns the width of the graph LabCanvas, as fraction of available width
@return {number} width of the graph LabCanvas, as fraction of available width
*/
TabLayout.prototype.getGraphWidth = function() {
  return this.graphWidth_;
};

/** Returns current layout.
@return {string} name of the current layout
*/
TabLayout.prototype.getLayout = function() {
  return this.layout_;
};

/** Returns classname of selected tab
@return {string} classname of selected tab, or empty string if none selected
@private
*/
TabLayout.prototype.getSelectedTab = function() {
  var tab = goog.array.find(this.tab_list.childNodes,
    function(/** !Node */n) {
      if (n.nodeType != Node.ELEMENT_NODE) {
        return false;
      }
      var elem = /** @type {!Element} */(n);
      if (elem.tagName != 'LI') {
        return false;
      }
      return elem.className.match(/.*selected/) != null;
    });
  if (tab == null) {
    return '';
  }
  tab = /** @type {!Element} */(tab);
  // return className minus ' selected'
  return tab.className.replace(/[ ]*selected/, '');
};

/** Returns the width of the simulation LabCanvas, as fraction of available width
@return {number} width of the simulation LabCanvas, as fraction of available width
*/
TabLayout.prototype.getSimWidth = function() {
  return this.simWidth_;
};

/** @override */
TabLayout.prototype.getSubjects = function() {
  return [ this, this.simCanvas, this.graphCanvas, this.timeGraphCanvas ];
};

/** Returns the width of the time graph LabCanvas, as fraction of available width
@return {number} width of the time graph LabCanvas, as fraction of available width
*/
TabLayout.prototype.getTimeGraphWidth = function() {
  return this.timeGraphWidth_;
};

/** Redo the current layout, either because the type of layout changed or the size
of the view port changed.
@return {undefined}
@private
*/
TabLayout.prototype.redoLayout = function() {
  // WARNING-NOTE: use goog.style.setFloat() to set float property.
  // Do NOT use style.float (it works some browsers but is non-standard because
  // 'float' is a javascript reserved word).
  // You can use style.cssFloat, but IE uses a different name: styleFloat.
  // WARNING-NOTE: viewport size can change if scrollbars appear or disappear
  // due to layout changes.
  var view_sz = goog.dom.getViewportSize();
  goog.style.setFloat(this.div_sim, 'left');
  goog.style.setFloat(this.div_graph, 'left');
  goog.style.setFloat(this.div_time_graph, 'left');
  switch (this.layout_) {
    case '':
    case Layout.SIM:
      this.div_graph.style.display = 'none';
      this.graph_controls.style.display = 'none';
      this.div_time_graph.style.display = 'none';
      this.time_graph_controls.style.display = 'none';
      this.setDisplaySize(0.95*this.simWidth_, this.div_graph);
      this.alignCanvasControls(this.div_sim, this.sim_controls);
      this.show_sim_label.style.display = 'none';
      break;
    case Layout.GRAPH:
      this.div_sim.style.display = 'none';
      this.sim_controls.style.display = 'none';
      this.div_time_graph.style.display = 'none';
      this.time_graph_controls.style.display = 'none';
      this.setDisplaySize(0.95*this.graphWidth_, this.div_graph);
      this.alignCanvasControls(this.div_graph, this.graph_controls);
      this.show_sim_cb.checked = false;
      this.show_sim_label.style.display = 'inline';
      break;
    case Layout.GRAPH_AND_SIM:
      this.div_time_graph.style.display = 'none';
      this.sim_controls.style.display = 'none';
      this.time_graph_controls.style.display = 'none';
      if (view_sz.width > 600) {
        this.setDisplaySize(0.49, this.div_graph);
      } else {
        this.setDisplaySize(0.95*this.graphWidth_, this.div_graph);
      }
      this.alignCanvasControls(this.div_graph, this.graph_controls, this.div_sim);
      this.show_sim_cb.checked = true;
      this.show_sim_label.style.display = 'inline';
      break;
    case Layout.TIME_GRAPH:
      this.div_graph.style.display = 'none';
      this.graph_controls.style.display = 'none';
      this.div_sim.style.display = 'none';
      this.sim_controls.style.display = 'none';
      this.setDisplaySize(0.95*this.timeGraphWidth_, this.div_time_graph);
      this.alignCanvasControls(this.div_time_graph, this.time_graph_controls);
      this.show_sim_cb.checked = false;
      this.show_sim_label.style.display = 'inline';
      break;
    case Layout.TIME_GRAPH_AND_SIM:
      this.div_graph.style.display = 'none';
      this.sim_controls.style.display = 'none';
      this.graph_controls.style.display = 'none';
      if (view_sz.width > 600) {
        this.setDisplaySize(0.49, this.div_time_graph);
      } else {
        this.setDisplaySize(0.95*this.timeGraphWidth_, this.div_time_graph);
      }
      this.alignCanvasControls(this.div_time_graph, this.time_graph_controls,
          this.div_sim);
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
      this.setDisplaySize(0.49, this.div_graph);
      this.setDisplaySize(0.49, this.div_time_graph);
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
      this.setDisplaySize(0.49, this.div_graph);
      this.setDisplaySize(0.49, this.div_time_graph);
      this.show_sim_cb.checked = true;
      this.show_sim_label.style.display = 'inline';
      break;
    default:
      throw new Error('redoLayout: no such layout "'+this.layout_+'"');
  }
};

/** Sets the size of the SimCanvas and a graph. This limits the SimCanvas so that it
fits in the window.
* @param {number} max_width size of SimCanvas, as fraction of screen width, from 0 to 1
* @param {!HTMLElement} graph_div
* @private
*/
TabLayout.prototype.setDisplaySize = function(max_width, graph_div) {
  if (this.limitSize_) {
    // Limit size of SimCanvas so it fits in the window.
    // Let divsim_h, divsim_w be dimensions of div_sim in pixels.
    // Let cvs_h, cvs_w be dimensions of canvas in pixels.
    // To ensure that div_sim vertical dimension is all visible:
    //    divsim_h = divsim_w (cvs_h/cvs_w) <= window_h
    //    divsim_w <= window_h (cvs_w/cvs_h)
    // Convert this to fractional width:
    //    (divsim_w/window_w) <= (window_h/window_w) * (cvs_w/cvs_h)
    var window_sz = goog.dom.getViewportSize();
    var window_h = (window_sz.height - 80);
    // Use the container div for width, not the screen. container div is more reliable.
    // This avoids issues with whether scrollbars are visible.
    var window_w = this.div_contain.offsetWidth ||
        this.div_contain.getBoundingClientRect().width;
    var cvs_sz = this.simCanvas.getScreenRect();
    var cvs_w = cvs_sz.getWidth();
    var cvs_h = cvs_sz.getHeight();
    var limit_w = (window_h/window_w) * (cvs_w/cvs_h);
    max_width = Math.min(max_width, limit_w);
  }
  var widthPct = (Math.floor(max_width*100) + '%');
  this.div_sim.style.width = widthPct;
  this.div_sim.style.height = 'auto';
  graph_div.style.width = widthPct;
  graph_div.style.height = 'auto';
};

/** Sets the width of the graph LabCanvas, as fraction of available width.
@param {number} value  width of the graph LabCanvas, as fraction of available width
*/
TabLayout.prototype.setGraphWidth = function(value) {
  if (Util.veryDifferent(value, this.graphWidth_)) {
    this.graphWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout.en.GRAPH_WIDTH);
};

/** Sets current layout.
@param {string} layout name of layout
*/
TabLayout.prototype.setLayout = function(layout) {
  layout = layout.toLowerCase().trim();
  if (this.layout_ != layout) {
    this.layout_ = layout;
    var tabName = this.layout_;
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
TabLayout.prototype.setLayoutFromTab = function(layout) {
  layout = layout.toLowerCase().trim();
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
  this.setLayout(layout);
};

/** Sets selected tab to be the tab with given className
@param {string} layout className of tab
@private
*/
TabLayout.prototype.setSelectedTab = function(layout) {
  if (this.getSelectedTab() != layout) {
    goog.array.forEach(this.tab_list.childNodes,
      function(/** !Node */node) {
        if (node.nodeType != Node.ELEMENT_NODE) {
          // it's not an Element
          return;
        }
        var elem = /** @type {!Element} */(node);
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
      }, this);
  }
};

/** Sets the width of the simulation LabCanvas, as fraction of available width.
@param {number} value  width of the simulation LabCanvas, as fraction of available width
*/
TabLayout.prototype.setSimWidth = function(value) {
  if (Util.veryDifferent(value, this.simWidth_)) {
    this.simWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout.en.SIM_WIDTH);
};

/** Sets the width of the time graph LabCanvas, as fraction of available width.
@param {number} value  width of the time graph LabCanvas, as fraction of available width
*/
TabLayout.prototype.setTimeGraphWidth = function(value) {
  if (Util.veryDifferent(value, this.timeGraphWidth_)) {
    this.timeGraphWidth_ = value;
  }
  this.redoLayout();
  this.broadcastParameter(TabLayout.en.TIME_GRAPH_WIDTH);
};

/** Change layout to hide or show simulation view.
@param {boolean} visible whether sim view should be visible
*/
TabLayout.prototype.showSim = function(visible) {
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
      throw new Error('showSim: no such layout "'+this.layout_+'"');
  }
};

/** Change layout to hide or show terminal text editor.
@param {boolean} visible whether terminal should be visible
*/
TabLayout.prototype.showTerminal = function(visible) {
  this.div_term.style.display = visible ? 'block' : 'none';
  this.show_term_cb.checked = visible;
  if (visible && !this.terminal.recalling) {
    // move the focus to Terminal, for ease of typing
    this.term_input.focus();
  }
};

/** Set of internationalized strings.
@typedef {{
  SIM_WIDTH: string,
  GRAPH_WIDTH: string,
  TIME_GRAPH_WIDTH: string,
  LAYOUT: string,
  SHOW_TERMINAL: string
  }}
*/
TabLayout.i18n_strings;

/**
@type {TabLayout.i18n_strings}
*/
TabLayout.en = {
  SIM_WIDTH: 'sim-width',
  GRAPH_WIDTH: 'graph-width',
  TIME_GRAPH_WIDTH: 'time-graph-width',
  LAYOUT: 'layout',
  SHOW_TERMINAL: 'show terminal'
};

/**
@private
@type {TabLayout.i18n_strings}
*/
TabLayout.de_strings = {
  SIM_WIDTH: 'Sim Breite',
  GRAPH_WIDTH: 'Graf Breite',
  TIME_GRAPH_WIDTH: 'Zeit Graf Breite',
  LAYOUT: 'layout',
  SHOW_TERMINAL: 'zeige Terminal'
};

/** Set of internationalized strings.
@type {TabLayout.i18n_strings}
*/
TabLayout.i18n = goog.LOCALE === 'de' ? TabLayout.de_strings :
    TabLayout.en;

}); // goog.scope
