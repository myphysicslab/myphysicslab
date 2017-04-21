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

goog.provide('myphysicslab.lab.controls.CheckBoxControlBase');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.controls.LabControl');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Creates a checkbox user interface control which executes a specified
function. You specify the functions for getting and setting the
target boolean value which this control is tracking.

Because this is an Observer, you can connect it to a Subject; when the Subject
broadcasts events, this checkbox will ensure that it reflects the current target boolean
value.

This is the base class for {@link myphysicslab.lab.controls.CheckBoxControl} which
which connects to a {@link myphysicslab.lab.util.ParameterBoolean}.

* @param {string} label the name shown in a label next to the checkbox
* @param {function():boolean} getter function that returns the current target state
* @param {function(boolean)} setter function to change the target state
* @param {!HTMLInputElement=} checkBox  the checkbox to use; if not provided, then
*     a checkbox is created.
* @constructor
* @struct
* @implements {myphysicslab.lab.controls.LabControl}
* @implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.controls.CheckBoxControlBase = function(label, getter, setter, checkBox) {
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

var CheckBoxControlBase = myphysicslab.lab.controls.CheckBoxControlBase;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  CheckBoxControlBase.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        + ', state_: '+this.state_
        + '}';
  };

  /** @inheritDoc */
  CheckBoxControlBase.prototype.toStringShort = function() {
    return this.getClassName() + '{label_: "'+this.label_+'"}';
  };
}

/** @inheritDoc */
CheckBoxControlBase.prototype.disconnect = function() {
  goog.events.unlistenByKey(this.changeKey_);
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
*/
CheckBoxControlBase.prototype.getClassName = function() {
  return 'CheckBoxControlBase';
};

/** @inheritDoc */
CheckBoxControlBase.prototype.getElement = function() {
  return this.topElement_;
};

/** @inheritDoc */
CheckBoxControlBase.prototype.getParameter = function() {
  return null;
};

/** Returns the state of this control.
@return {boolean} the state of this control
*/
CheckBoxControlBase.prototype.getState = function() {
  return this.getter_();
};

/** This callback fires when the button is clicked.
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
CheckBoxControlBase.prototype.handleClick = function(event) {
  this.setState(!this.getState());
};

/** @inheritDoc */
CheckBoxControlBase.prototype.observe =  function(event) {
  // Ensure that the correct value is displayed by the control.
  this.setState(this.getState());
};

/** @inheritDoc */
CheckBoxControlBase.prototype.setEnabled = function(enabled) {
  this.checkBox_.disabled = !enabled;
};

/** Sets the state of this control, and modifies the target if necessary.
* @param {boolean} newState the state to set the control to
*/
CheckBoxControlBase.prototype.setState = function(newState) {
  if (this.getState() != newState) {
    this.setter_(newState);
  }
  if (this.state_ != this.getState()) {
    this.state_ = this.getState();
    this.checkBox_.checked = this.state_;
  }
};

}); // goog.scope
