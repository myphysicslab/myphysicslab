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
import { LabCanvas } from '../../lab/view/LabCanvas.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { Layout, ElementIDs } from './Layout.js';
import { Subject, SubjectList } from '../../lab/util/Observe.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { Util } from '../../lab/util/Util.js';

/** VerticalLayout creates a SimView and a command line Terminal a command line Terminal
for interactive scripting; also an area to show a graph, and an area to put controls.
Defines regular expressions for easy Terminal scripting of these objects using short
names such as terminal, simCanvas, graphCanvas.

Defines functions showGraph, showControls, showTerminal, which are used for the
checkboxes with those names; these functions appear in Terminal when they are executed.
These functions can also be called from the Terminal, and therefore saved in Terminal
command storage, preserving what the state of what is visible.

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
*/
export class VerticalLayout extends AbstractSubject implements Subject, Layout, SubjectList {
  /* whether to put dashed borders around elements */
  debug_layout: boolean = false;
  private controls_: LabControl[] = [];
  private terminal: Terminal;
  private simCanvas: LabCanvas;
  private div_sim: HTMLDivElement;
  private div_graph: HTMLDivElement;
  private graphCanvas: LabCanvas;
  private graph_controls: HTMLDivElement;
  showGraph: (visible: boolean) => void;
  private sim_controls: HTMLDivElement;
  showControls: (visible: boolean) => void;
  showTerminal: (visible: boolean) => void;
  hideTerminal: false;

/**
* @param elem_ids specifies the names of the HTML
*    elements to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  super('VERTICAL_LAYOUT');
  Util.setImagesDir(elem_ids.images_dir);
  const term_output =
      Util.maybeElementById(elem_ids.term_output) as HTMLTextAreaElement|null;
  const term_input =
      Util.maybeElementById(elem_ids.term_input) as HTMLInputElement|null;
  this.terminal = new Terminal(term_input, term_output);
  Terminal.stdRegex(this.terminal);
  this.div_sim = Util.getElementById(elem_ids.sim_applet) as HTMLDivElement;
  // to allow absolute positioning of icon controls over the canvas:
  this.div_sim.style.position = 'relative';
  const canvas = document.createElement('canvas');
  /* tabIndex = 0 makes the canvas selectable via tab key or mouse, so it can
  * get text events. A value of 0 indicates that the element should be placed in the
  * default navigation order. This allows elements that are not natively focusable
  * (such as <div>, <span>, and ) to receive keyboard focus.
  */
  canvas.tabIndex = 0;
  canvas.width = 800;
  canvas.height = 480;
  this.simCanvas = new LabCanvas(canvas, 'simCanvas');
  this.div_sim.appendChild(this.simCanvas.getCanvas());
  this.div_graph = Util.getElementById(elem_ids.div_graph) as HTMLDivElement;
  const canvas2 = document.createElement('canvas');
  canvas2.style.float = 'left';
  canvas2.style.margin = '0px 15px 15px 0px';
  this.graphCanvas = new LabCanvas(canvas2, 'graphCanvas');
  this.graphCanvas.setSize(480, 480);
  // graphCanvas is initially hidden
  this.div_graph.style.display = 'none';
  if (this.debug_layout) {
    this.div_graph.style.border = 'dashed 1px blue';
  }
  this.graph_controls =
      Util.getElementById(elem_ids.graph_controls) as HTMLDivElement;
  this.div_graph.insertBefore(this.graphCanvas.getCanvas(), this.graph_controls);

  /* 'show graph' checkbox. */
  const show_graph_cb = Util.getElementById(elem_ids.show_graph) as HTMLInputElement;
  this.showGraph = visible => {
    this.div_graph.style.display = visible ? 'block' : 'none';
    show_graph_cb.checked = visible;
  };
  show_graph_cb.addEventListener('click',
      _e => this.showGraph(show_graph_cb.checked));

  this.sim_controls = Util.getElementById(elem_ids.sim_controls) as HTMLDivElement;
  if (this.debug_layout) {
    this.sim_controls.style.border = 'dashed 1px red';
  }

  const show_controls_cb =
      Util.getElementById(elem_ids.show_controls) as HTMLInputElement;
  this.sim_controls.style.display = 'none';
  this.showControls = (visible: boolean) => {
    this.sim_controls.style.display = visible ? 'block' : 'none';
    show_controls_cb.checked = visible;
  };
  show_controls_cb.addEventListener('click',
      _e => this.showControls(show_controls_cb.checked));
  const form_term = Util.getElementById(elem_ids.form_terminal) as HTMLFormElement;
  form_term.style.display = 'none';
  if (this.debug_layout) {
    form_term.style.border = 'dashed 1px green';
  }
  const label_term = Util.getElementById(elem_ids.label_terminal) as HTMLLabelElement;
  if (this.hideTerminal) {
    // hide the terminal checkbox.
    label_term.style.display = 'none';
  } else {
    const show_term_cb =
        Util.getElementById(elem_ids.show_terminal) as HTMLInputElement;
    this.showTerminal = (visible: boolean) => {
      form_term.style.display = visible ? 'block' : 'none';
      show_term_cb.checked = visible;
      if (visible && term_input !== null) {
        // move the focus to Terminal, for ease of typing
        term_input.focus();
      }
    };
    show_term_cb.addEventListener('click',
        _e => this.showTerminal(show_term_cb.checked) );
  }
  const show_hide_form =
      Util.getElementById(elem_ids.show_hide_form) as HTMLFormElement;
  if (this.debug_layout) {
    show_hide_form.style.border = 'dashed 1px green';
  }

};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', simCanvas: '+this.simCanvas.toStringShort()
      +', graphCanvas: '+this.graphCanvas.toStringShort()
      +', terminal: '+this.terminal
      +', controls_: ['
      + this.controls_.map(a => a.toStringShort())
      +']'
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'VerticalLayout';
};

/** @inheritDoc */
addControl(control: LabControl, opt_add = true): LabControl {
  if (opt_add) {
    const element = control.getElement();
    element.style.display = 'inline-block';
    this.sim_controls.appendChild(element);
  }
  this.controls_.push(control);
  return control;
};

/** @inheritDoc */
getGraphCanvas(): LabCanvas {
  return this.graphCanvas;
};

/** @inheritDoc */
getGraphControls(): HTMLDivElement {
  return this.graph_controls;
};

/** @inheritDoc */
getGraphDiv(): HTMLDivElement {
  return this.div_graph;
};

/** @inheritDoc */
getSubjects(): Subject[] {
  return [ this, this.simCanvas, this.graphCanvas ];
};

/** @inheritDoc */
getSimCanvas(): LabCanvas {
  return this.simCanvas;
};

/** @inheritDoc */
getSimControls(): HTMLDivElement {
  return this.sim_controls;
};

/** @inheritDoc */
getSimDiv(): HTMLDivElement {
  return this.div_sim;
};

/** @inheritDoc */
getTerminal(): Terminal {
  return this.terminal;
};

/** @inheritDoc */
getTimeGraphCanvas(): LabCanvas {
  throw Util.NOT_IMPLEMENTED;
};

/** @inheritDoc */
getTimeGraphControls(): HTMLDivElement {
  throw Util.NOT_IMPLEMENTED;
};

/** @inheritDoc */
getTimeGraphDiv(): HTMLDivElement {
  throw Util.NOT_IMPLEMENTED;
};

} // end class

Util.defineGlobal('sims$common$VerticalLayout', VerticalLayout);
