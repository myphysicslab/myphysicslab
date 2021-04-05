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

goog.module('myphysicslab.sims.common.VerticalLayout');

const events = goog.require('goog.events');
const EventType = goog.require('goog.events.EventType');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const Layout = goog.require('myphysicslab.sims.common.Layout');
const SubjectList = goog.require('myphysicslab.lab.util.SubjectList');
const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const Util = goog.require('myphysicslab.lab.util.Util');

/** VerticalLayout creates a SimView and a command line Terminal a command line Terminal
for interactive scripting; also an area to show a graph, and an area to put controls.
Defines regular expressions for easy Terminal scripting of these objects using short
names such as terminal, simCanvas, graphCanvas.

Defines functions showGraph, showControls, showTerminal, which are used for the
checkboxes with those names; these functions appear in Terminal when they are executed.
These functions can also be called from the Terminal, and therefore saved in Terminal
command storage, preserving what the state of what is visible.

When using advanced-optimizations compile mode the Terminal will not work, because
all method and class names are minified, and unused code is eliminated -- so even if
you could get at a minified class, much of it would not be there to use.

### Element IDs

VerticalLayout constructor takes an argument that specifies the names of the HTML
elements to look for in the HTML document; these elements are where the user
interface of the simulation is created. This allows for having two separate instances
of the same simulation running concurrently on a single page.

These are the names expected to be in the element IDs object:

+  term_output
+  term_input
+  sim_applet
+  div_graph
+  graph_controls
+  show_graph
+  sim_controls
+  show_controls
+  form_terminal
+  label_terminal
+  show_terminal
+  show_hide_form
+  images_dir

Oct 2014: increased size of simCanvas and graphCanvas so that they look better when
stretched to large sizes on large screens.
* @implements {SubjectList}
* @implements {Layout}
*/
class VerticalLayout extends AbstractSubject {
/**
* @param {!Object} elem_ids specifies the names of the HTML
*    elements to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  super('VERTICAL_LAYOUT');
  Util.setImagesDir(elem_ids['images_dir']);
  /** whether to put dashed borders around elements
  * @type {boolean}
  * @const
  */
  this.debug_layout = false;
  /** @type {!Array<!LabControl>}
  * @private
  */
  this.controls_ = [];
  const term_output = /**@type {?HTMLInputElement}*/
      (Util.maybeElementById(elem_ids, 'term_output'));
  const term_input = /**@type {?HTMLInputElement}*/
      (Util.maybeElementById(elem_ids, 'term_input'));
  /** @type {!Terminal}
  * @private
  */
  this.terminal = new Terminal(term_input, term_output);
  Terminal.stdRegex(this.terminal);

  /** @type {!HTMLElement}
  * @private
  */
  this.div_sim = Util.getElementById(elem_ids, 'sim_applet');
  // to allow absolute positioning of icon controls over the canvas:
  this.div_sim.style.position = 'relative';
  const canvas = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  /* tabIndex = 0 makes the canvas selectable via tab key or mouse, so it can
  * get text events. A value of 0 indicates that the element should be placed in the
  * default navigation order. This allows elements that are not natively focusable
  * (such as <div>, <span>, and ) to receive keyboard focus.
  */
  canvas.tabIndex = 0;
  canvas.width = 800;
  canvas.height = 480;
  /** @type {!LabCanvas}
  * @private
 */
  this.simCanvas = new LabCanvas(canvas, 'simCanvas');
  this.div_sim.appendChild(this.simCanvas.getCanvas());

  /* GraphCanvas */
  /** @type {!HTMLElement}
  * @private
  */
  this.div_graph = Util.getElementById(elem_ids, 'div_graph');
  const canvas2 = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  canvas2.style.float = 'left';
  canvas2.style.margin = '0px 15px 15px 0px';
  /** @type {!LabCanvas}
  * @private
  */
  this.graphCanvas = new LabCanvas(canvas2, 'graphCanvas');
  this.graphCanvas.setSize(480, 480);
  // graphCanvas is initially hidden
  this.div_graph.style.display = 'none';
  if (this.debug_layout) {
    this.div_graph.style.border = 'dashed 1px blue';
  }
  /* <div> for graph controls */
  /** @type {!HTMLElement}
  * @private
  */
  this.graph_controls = /**@type {!HTMLElement}*/
      (Util.getElementById(elem_ids, 'graph_controls'));
  this.div_graph.insertBefore(this.graphCanvas.getCanvas(), this.graph_controls);

  /* 'show graph' checkbox. */
  const show_graph_cb = /**@type {!HTMLInputElement}*/
      (Util.getElementById(elem_ids, 'show_graph'));
  /** @type {function(boolean)} */
  this.showGraph = visible => {
    this.div_graph.style.display = visible ? 'block' : 'none';
    show_graph_cb.checked = visible;
  };
  events.listen(show_graph_cb, EventType.CLICK,
      e => this.showGraph(show_graph_cb.checked) );

  /* <form> for sim controls */
  /** @type {!HTMLElement}
  * @private
  */
  this.sim_controls = /** @type {!HTMLElement} */
      (Util.getElementById(elem_ids, 'sim_controls'));
  if (this.debug_layout) {
    this.sim_controls.style.border = 'dashed 1px red';
  }

  /* 'show controls' checkbox. */
  const show_controls_cb = /**@type {!HTMLInputElement}*/
      (Util.getElementById(elem_ids, 'show_controls'));
  this.sim_controls.style.display = 'none';
  /** @type {function(boolean)} */
  this.showControls = /** @type {function(boolean)}*/(visible => {
    this.sim_controls.style.display = visible ? 'block' : 'none';
    show_controls_cb.checked = visible;
  });
  events.listen(show_controls_cb, EventType.CLICK,
      e => this.showControls(show_controls_cb.checked) );

  /* <form> element for Terminal */
  const form_term = /**@type {!HTMLFormElement}*/
      (Util.getElementById(elem_ids, 'form_terminal'));
  form_term.style.display = 'none';
  if (this.debug_layout) {
    form_term.style.border = 'dashed 1px green';
  }
  const label_term = /**@type {!HTMLInputElement}*/
      (Util.getElementById(elem_ids, 'label_terminal'));
  /** @type {function(boolean)} */
  this.showTerminal;
  if (Util.ADVANCED) {
    // Under advanced-optimized compile mode, Terminal cannot be used.
    // Therefore, hide the terminal checkbox.
    label_term.style.display = 'none';
  } else {
    /* 'show terminal' checkbox. */
    const show_term_cb = /**@type {!HTMLInputElement}*/
        (Util.getElementById(elem_ids, 'show_terminal'));
    this.showTerminal = /** @type {function(boolean)}*/(visible => {
      form_term.style.display = visible ? 'block' : 'none';
      show_term_cb.checked = visible;
      if (visible && term_input && !this.terminal.recalling) {
        // move the focus to Terminal, for ease of typing
        term_input.focus();
      }
    });
    events.listen(show_term_cb, EventType.CLICK,
      e => this.showTerminal(show_term_cb.checked) );
  }

  const show_hide_form = /**@type {!HTMLFormElement}*/
      (Util.getElementById(elem_ids, 'show_hide_form'));
  if (this.debug_layout) {
    show_hide_form.style.border = 'dashed 1px green';
  }

};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'VerticalLayout{'
    +'simCanvas: '+this.simCanvas.toStringShort()
    +', graphCanvas: '+this.graphCanvas.toStringShort()
    +', terminal: '+this.terminal
    +', controls: '+this.controls_.length
    +'}';
};

/** @override */
getClassName() {
  return 'VerticalLayout';
};

/** @override */
addControl(control, opt_add) {
  opt_add = opt_add === undefined ? true : opt_add;
  if (opt_add) {
    const element = control.getElement();
    element.style.display = 'inline-block';
    this.sim_controls.appendChild(element);
  }
  this.controls_.push(control);
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

/** @override */
getSubjects() {
  return [ this, this.simCanvas, this.graphCanvas ];
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

/** @override */
getTerminal() {
  return this.terminal;
};

/** @override */
getTimeGraphCanvas() {
  throw Util.NOT_IMPLEMENTED;
};

/** @override */
getTimeGraphControls() {
  throw Util.NOT_IMPLEMENTED;
};

/** @override */
getTimeGraphDiv() {
  throw Util.NOT_IMPLEMENTED;
};

} // end class

exports = VerticalLayout;
