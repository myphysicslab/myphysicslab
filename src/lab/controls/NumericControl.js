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

goog.provide('myphysicslab.lab.controls.NumericControl');

goog.require('myphysicslab.lab.controls.NumericControlBase');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var NumericControlBase = myphysicslab.lab.controls.NumericControlBase;
var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var Util = myphysicslab.lab.util.Util;

/** A user interface control for displaying and editing the numeric value of a
{@link ParameterNumber}.

NumericControl is an extension of {@link NumericControlBase}.
NumericControlBase is the function-based version which doesn't take a ParameterNumber
but instead has getter and setter functions.

* @param {!ParameterNumber} parameter the ParameterNumber to display and edit
* @param {!HTMLInputElement=} textField  the text field to use; if not provided, then
*     a text field is created.
* @constructor
* @final
* @struct
* @extends {NumericControlBase}
*/
myphysicslab.lab.controls.NumericControl = function(parameter, textField) {
  NumericControlBase.call(this, parameter.getName(/*localized=*/true),
      goog.bind(parameter.getValue, parameter),
      goog.bind(parameter.setValue, parameter),
      textField);
  /**
  * @type {!ParameterNumber}
  * @private
  */
  this.parameter_ = parameter;
  this.setSignifDigits(parameter.getSignifDigits());
  this.setDecimalPlaces(parameter.getDecimalPlaces());
  this.formatTextField();
  this.parameter_.getSubject().addObserver(this);
};
var NumericControl = myphysicslab.lab.controls.NumericControl;
goog.inherits(NumericControl, NumericControlBase);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  NumericControl.prototype.toString = function() {
    return NumericControl.superClass_.toString.call(this).slice(0, -1)
        + ', parameter_: '+this.parameter_.toStringShort()+'}';
  };
}

/** @inheritDoc */
NumericControl.prototype.disconnect = function() {
  NumericControl.superClass_.disconnect.call(this);
  this.parameter_.getSubject().removeObserver(this);
};

/** @inheritDoc */
NumericControl.prototype.getClassName = function() {
  return 'NumericControl';
};

/** @inheritDoc */
NumericControl.prototype.getParameter = function() {
  return this.parameter_;
};

/** @inheritDoc */
NumericControl.prototype.observe =  function(event) {
  if (event == this.parameter_) {
    NumericControl.superClass_.observe.call(this, event);
    this.setSignifDigits(this.parameter_.getSignifDigits());
    this.setDecimalPlaces(this.parameter_.getDecimalPlaces());
  }
};

}); // goog.scope
