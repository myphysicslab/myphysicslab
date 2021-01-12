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

goog.module('myphysicslab.lab.controls.ToggleControl');

const Event = goog.require('goog.events.Event');
const events = goog.require('goog.events');
const EventType = goog.require('goog.events.EventType');
const Key = goog.require('goog.events.Key');

const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Creates and manages an HTMLButtonElement that toggles between two images; the
state is connected to a ParameterBoolean. The image is assigned classname `icon` for
CSS scripting.

* @implements {LabControl}
* @implements {Observer}
*/
class ToggleControl {
/**
* @param {!ParameterBoolean} parameter  the ParameterBoolean to connect to
* @param {!HTMLImageElement} imageOn the HTMLImageElement to show for the 'on' state
* @param {!HTMLImageElement} imageOff the HTMLImageElement to show for the 'off' state
*/
constructor(parameter, imageOn, imageOff) {
  /**
  * @type {!ParameterBoolean}
  * @private
  */
  this.parameter_ = parameter;
  /**
  * @type {string}
  * @private
  */
  this.name_ = this.parameter_.getName();
  /**  The state of the user control (which might not match the state of the target)
  * @type {boolean}
  * @private
  */
  this.state_ = this.parameter_.getValue();
  /**
  * @type {!HTMLImageElement}
  * @private
  */
  this.imageOn_ = imageOn;
  /**
  * @type {!HTMLImageElement}
  * @private
  */
  this.imageOff_ = imageOff;
  /**
  * @type {!HTMLButtonElement}
  * @private
  */
  this.button_ = /** @type {!HTMLButtonElement} */(document.createElement('button'));
  this.button_.type = 'button';
  this.button_.className = 'icon';
  // we show the icon that is opposite of the current state, because that is what will
  // happen when user clicks the button
  imageOff.style.display = this.state_ ? 'block' : 'none'
  imageOn.style.display = this.state_ ? 'none' : 'block'
  this.button_.appendChild(imageOn);
  this.button_.appendChild(imageOff);
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.clickKey_ = events.listen(this.button_, EventType.CLICK,
      /*callback=*/this.handleClick, /*capture=*/true, this);
  this.parameter_.getSubject().addObserver(this);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      + ', state_: '+this.state_
      + '}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'ToggleControl{parameter_: '+
      this.parameter_.toStringShort()+'}';
};

/** @override */
disconnect() {
  this.parameter_.getSubject().removeObserver(this);
  events.unlistenByKey(this.clickKey_);
};

/** @override */
getElement() {
  return this.button_;
};

/** @override */
getParameter() {
  return this.parameter_;
};

/** Returns the state of this control (which should match the target state if
{@link #observe} is being called).
@return {boolean} the state of this control, `true` means 'on'
*/
getState() {
  return this.state_;
};

/** This callback fires when the button is clicked.
* @param {!Event} event the event that caused this callback to fire
* @private
*/
handleClick(event) {
  this.setState(!this.state_);
};

/** @override */
observe(event) {
  // only update when this parameter has changed
  if (event == this.parameter_) {
    // Ensure that the value displayed by the control matches the Parameter value
    this.setState(this.parameter_.getValue());
  }
};

/** @override */
setEnabled(enabled) {
  this.button_.disabled = !enabled;
};

/** Sets the state of the control, and modifies the ParameterBoolean to match.
* @param {boolean} newState the new state of the control, `true` means 'on'
*/
setState(newState) {
  if (this.state_ != newState) {
    this.parameter_.setValue(newState);
    this.state_ = newState;
    // we show the icon that is opposite of the current state, because that is what will
    // happen when user clicks the button
    this.imageOff_.style.display = newState ? 'block' : 'none'
    this.imageOn_.style.display = newState ? 'none' : 'block'
  }
};

} // end class
exports = ToggleControl;
