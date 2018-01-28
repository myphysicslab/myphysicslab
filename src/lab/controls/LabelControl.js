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

goog.module('myphysicslab.lab.controls.LabelControl');

goog.require('goog.events');
goog.require('goog.events.Event');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const Util = goog.require('myphysicslab.lab.util.Util');

/** An HTML label element.

* @implements {LabControl}
*/
class LabelControl {
/**
* @param {string} text text of the label
*/
constructor(text) {
  /** the text of the label
  * @type {string}
  * @private
  */
  this.text_ = text;
  /**
  * @type {!HTMLLabelElement}
  * @private
  */
  this.label_ = /** @type {!HTMLLabelElement} */(document.createElement('LABEL'));
  this.label_.appendChild(document.createTextNode(text));
  this.label_.disabled = true;
  // could have a special CSS class for styling.
  //this.label_.className = 'mpl_label';
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'LabelControl{text_: "'+this.text_+'"}';
};

/** @override */
disconnect() {
};

/** @override */
getElement() {
  return this.label_;
};

/** @override */
getParameter() {
  return null;
};

/** @override */
setEnabled(enabled) {
  this.label_.disabled = !enabled;
};

} //end class
exports = LabelControl;
