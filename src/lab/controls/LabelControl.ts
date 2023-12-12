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

import { LabControl } from './LabControl.js';
import { Parameter } from '../util/Observe.js'
import { Util } from '../util/Util.js';

/** Creates an HTMLLabelElement, and provides access as a LabControl.
*/
export class LabelControl implements LabControl {
  /** the text of the label */
  private text_: string;
  private label_: HTMLLabelElement;

/**
* @param text text of the label
*/
constructor(text: string) {
  this.text_ = text;
  this.label_ = document.createElement('label');
  this.label_.appendChild(document.createTextNode(text));
  // could have a special CSS class for styling.
  //this.label_.className = 'mpl_label';
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'LabelControl{text_: "'+this.text_+'"}';
};

/** @inheritDoc */
disconnect(): void {
};

/** @inheritDoc */
getElement(): HTMLElement {
  return this.label_;
};

/** @inheritDoc */
getParameter(): null|Parameter {
  return null;
};

/** @inheritDoc */
setEnabled(_enabled: boolean): void {
  throw 'LabelControl cannot be disabled';
};

} // end class
Util.defineGlobal('lab$controls$LabelControl', LabelControl);
