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

goog.provide('myphysicslab.lab.controls.ToggleControl');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.controls.LabControl');

goog.scope(function() {

var ParameterBoolean = myphysicslab.lab.util.ParameterBoolean;
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** Creates and manages an HTMLButtonElement that toggles between two images; the
state is connected to a ParameterBoolean. The image is assigned classname `icon` for
CSS scripting.

* @param {!ParameterBoolean} parameter  the ParameterBoolean to connect to
* @param {!HTMLImageElement} imageOn the HTMLImageElement to show for the 'on' state
* @param {!HTMLImageElement} imageOff the HTMLImageElement to show for the 'off' state
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.controls.LabControl}
* @implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.controls.ToggleControl = function(parameter, imageOn, imageOff) {
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
  * @type {goog.events.Key}
  * @private
  */
  this.clickKey_ = goog.events.listen(this.button_, goog.events.EventType.CLICK,
      /*callback=*/this.handleClick, /*capture=*/true, this);
  this.parameter_.getSubject().addObserver(this);
};
var ToggleControl = myphysicslab.lab.controls.ToggleControl;

if (!Util.ADVANCED) {
  /** @override */
  ToggleControl.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        + ', state_: '+this.state_
        + '}';
  };

  /** @override */
  ToggleControl.prototype.toStringShort = function() {
    return 'ToggleControl{parameter_: '+ this.parameter_.toStringShort()+'}';
  };
};

/** @override */
ToggleControl.prototype.disconnect = function() {
  this.parameter_.getSubject().removeObserver(this);
  goog.events.unlistenByKey(this.clickKey_);
};

/** @override */
ToggleControl.prototype.getElement = function() {
  return this.button_;
};

/** @override */
ToggleControl.prototype.getParameter = function() {
  return this.parameter_;
};

/** Returns the state of this control (which should match the target state if
{@link #observe} is being called).
@return {boolean} the state of this control, `true` means 'on'
*/
ToggleControl.prototype.getState = function() {
  return this.state_;
};

/** This callback fires when the button is clicked.
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
ToggleControl.prototype.handleClick = function(event) {
  this.setState(!this.state_);
};

/** @override */
ToggleControl.prototype.observe =  function(event) {
  // only update when this parameter has changed
  if (event == this.parameter_) {
    // Ensure that the value displayed by the control matches the Parameter value
    this.setState(this.parameter_.getValue());
  }
};

/** @override */
ToggleControl.prototype.setEnabled = function(enabled) {
  this.button_.disabled = !enabled;
};

/** Sets the state of the control, and modifies the ParameterBoolean to match.
* @param {boolean} newState the new state of the control, `true` means 'on'
*/
ToggleControl.prototype.setState = function(newState) {
  if (this.state_ != newState) {
    this.parameter_.setValue(newState);
    this.state_ = newState;
    // we show the icon that is opposite of the current state, because that is what will
    // happen when user clicks the button
    this.imageOff_.style.display = newState ? 'block' : 'none'
    this.imageOn_.style.display = newState ? 'none' : 'block'
  }
};


}); // goog.scope
