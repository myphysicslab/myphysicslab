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

goog.module('myphysicslab.lab.controls.CheckBoxControlBase');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.Event');

const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A checkbox input element which synchronizes with a target boolean value by
executing specified `getter` and `setter` functions.

Because this is an {@link Observer}, you can connect it to a Subject; when the Subject
broadcasts events, the {@link #observe} method ensures that this control reflects the
current target value.

* @implements {LabControl}
* @implements {Observer}
*/
class CheckBoxControlBase {
/**
* @param {string} label the name shown in a label next to the checkbox
* @param {function():boolean} getter function that returns the current target state
* @param {function(boolean)} setter function to change the target state
* @param {!HTMLInputElement=} checkBox  the checkbox to use; if not provided, then
*     a checkbox and label are created.
*/
constructor(label, getter, setter, checkBox) {
  /** the name shown in a label next to the checkbox
  * @type {string}
  * @private
  */
  this.label_ = label;
  /** function that returns the current target state
  * @type {function():boolean}
  * @private
  */
  this.getter_ = getter;
  /** function to change the target state
  * @type {function(boolean)}
  * @private
  */
  this.setter_ = setter;
  /** The state of the user control (which might not match the state of the target)
  * @type {boolean}
  * @private
  */
  this.state_ = getter();
  /** @type {HTMLLabelElement} */
  var labelElement = null;
  if (goog.isObject(checkBox)) {
    // see if the parent is a label
    var parent = goog.dom.getParentElement(checkBox);
    if (parent != null && parent.tagName == 'LABEL') {
      labelElement = /** @type {!HTMLLabelElement} */(parent);
    }
  } else {
    // create check box and label
    checkBox = /** @type {!HTMLInputElement} */(document.createElement('input'));
    checkBox.type = 'checkbox';
    labelElement = /** @type {!HTMLLabelElement} */(document.createElement('LABEL'));
    labelElement.appendChild(checkBox);
    labelElement.appendChild(document.createTextNode(this.label_));
  }
  /**
  * @type {!HTMLInputElement}
  * @private
  */
  this.checkBox_ = checkBox;
  // force passed-in checkBox to match state. This could fire an event, so
  // do it before hooking up our event handlers.
  this.checkBox_.checked = this.state_;
  /**
  * @type {!Element}
  * @private
  */
  this.topElement_ = labelElement !== null ? labelElement : this.checkBox_;
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.changeKey_ = goog.events.listen(this.checkBox_, goog.events.EventType.CHANGE,
      /*callback=*/this.handleClick, /*capture=*/true, this);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      + ', state_: '+this.state_
      + '}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : this.getClassName() + '{label_: "'+this.label_+'"}';
};

/** @override */
disconnect() {
  goog.events.unlistenByKey(this.changeKey_);
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
*/
getClassName() {
  return 'CheckBoxControlBase';
};

/** @override */
getElement() {
  return this.topElement_;
};

/** @override */
getParameter() {
  return null;
};

/** Returns the checked state of this control (which should match the target state if
{@link #observe} is being called).
@return {boolean} the checked state of this control
*/
getState() {
  return this.getter_();
};

/** This callback fires when the button is clicked.
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
handleClick(event) {
  this.setState(!this.getState());
};

/** @override */
observe(event) {
  // Ensure that the correct value is displayed by the control.
  this.setState(this.getState());
};

/** @override */
setEnabled(enabled) {
  this.checkBox_.disabled = !enabled;
};

/** Sets the checked state of this control, and modifies the target if necessary.
* @param {boolean} newState the checked state to set the control to
*/
setState(newState) {
  if (this.getState() != newState) {
    this.setter_(newState);
  }
  if (this.state_ != this.getState()) {
    this.state_ = this.getState();
    this.checkBox_.checked = this.state_;
  }
};

} //end class
exports = CheckBoxControlBase;
