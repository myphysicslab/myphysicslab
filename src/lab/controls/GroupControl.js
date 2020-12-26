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

goog.module('myphysicslab.lab.controls.GroupControl');

goog.require('goog.events');
goog.require('goog.events.Event');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A group of LabControls which implements the LabControl interface.

A typical usage is to ensure a group of buttons stays together, such as playback
buttons for rewind, play/pause and step actions. Put the buttons into a single `<div>`
element, and make a GroupControl whose top element is that `<div>`.

Another usage is to insert a `<br>` element to break up long lines of controls into
logical groups. The GroupControl has the `<br>` as its top element and an empty list of
other controls.

* @implements {LabControl}
*/
class GroupControl {
/**
* @param {string} name  name of the group
* @param {!Element} topElement the top element that contains all the controls
* @param {!Array<!LabControl>} controls the set of controls contained in this
*     GroupControl, can be empty
*/
constructor(name, topElement, controls) {
  /** the name of the button
  * @type {string}
  * @private
  */
  this.name_ = name;
  /**
  * @type {!Element}
  * @private
  */
  this.topElement_ = topElement;
  /**
  * @type {!Array<!LabControl>}
  * @private
  */
  this.controls_ = controls;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', controls_: ['
      + goog.array.map(this.controls_, a => a.toStringShort())
      +']}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'GroupControl{name_: "'+this.name_+'"'
      +', controls_.length: '+this.controls_.length
      +'}';
};

/** @override */
disconnect() {
  goog.array.forEach(this.controls_, c => c.disconnect());
};

/** Returns the set of controls in this GroupControl.
* @return {!Array<LabControl>} the set of controls in this GroupControl.
*/
getControls() {
  return goog.array.clone(this.controls_);
};

/** @override */
getElement() {
  return this.topElement_;
};

/** @override */
getParameter() {
  return null;
};

/** @override */
setEnabled(enabled) {
  goog.array.forEach(this.controls_, c => c.setEnabled(enabled));
};

} // end class
exports = GroupControl;
