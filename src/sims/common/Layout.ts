// Copyright 2021 Erik Neumann.  All Rights Reserved.
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

import { LabControl } from '../../lab/controls/LabControl.js';
import { LabCanvas } from '../../lab/view/LabCanvas.js';
import { SubjectList } from '../../lab/util/Observe.js';
import { Terminal } from '../../lab/util/Terminal.js';

/** An object that controls behavior of the HTML page, regarding where things go like
the simulation canvas, the graph, controls, etc. and when they are visible.
*/
export interface Layout extends SubjectList {
  /** Add the control to the set of simulation controls.
  * @param control
  * @param opt_add whether to also add to SimControls, default is true
  * @return the control that was passed in
  */
  addControl(control: LabControl, opt_add?: boolean): LabControl;
  getGraphCanvas(): LabCanvas;
  getGraphControls(): HTMLDivElement;
  getGraphDiv(): HTMLDivElement;
  getSimCanvas(): LabCanvas;
  getSimControls(): HTMLDivElement;
  getSimDiv(): HTMLDivElement;
  getTimeGraphCanvas(): LabCanvas;
  getTimeGraphControls(): HTMLDivElement;
  getTimeGraphDiv(): HTMLDivElement;
  getTerminal(): Terminal;
  /** Change layout to hide or show terminal text editor.
  * @param visible whether terminal should be visible
  */
  showTerminal(visible: boolean): void;
};

/** An object that communicates the various ID's of the UI elements.
The object consists of a set of strings which are accessed by string property
names.  For example
```js
{ tab_list: myTabList,
  container: myContainer,
  sim_controls: mySimControls }
```
So in this case the `tab_list` element will have the name `myTabList` on the
HTML web page. That element can be gotten with
```js
document.getElementById(elem_id.tab_list)
```
*/
export type ElementIDs = {
  tab_list: string;
  container: string;
  term_output: string;
  term_input: string;
  sim_applet: string;
  div_graph: string;
  graph_controls: string;
  sim_controls: string;
  div_terminal: string;
  div_time_graph: string;
  time_graph_controls: string;
  div_multi_graph: string;
  multi_graph_controls: string;
  label_terminal: string;
  show_terminal: string;
  show_sim: string;
  images_dir: string;
  // following are for VerticalLayout
  show_controls: string;
  show_graph: string;
  show_hide_form: string;
  form_terminal: string;
};
