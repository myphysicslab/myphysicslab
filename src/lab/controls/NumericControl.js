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

goog.module('myphysicslab.lab.controls.NumericControl');

const NumericControlBase = goog.require('myphysicslab.lab.controls.NumericControlBase');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A text input element for displaying and editing the numeric value of a{@link ParameterNumber}.

*/
class NumericControl extends NumericControlBase {
/**
* @param {!ParameterNumber} parameter the ParameterNumber to display and edit
* @param {!HTMLInputElement=} textField  the text field to use; if not provided, then
*     a text field is created.
*/
constructor(parameter, textField) {
  super(parameter.getName(/*localized=*/true)+parameter.getUnits(),
      () => parameter.getValue(),
      a => parameter.setValue(a),
      textField);
  /**
  * @type {!ParameterNumber}
  * @private
  */
  this.parameter_ = parameter;
  this.setSignifDigits(parameter.getSignifDigits());
  this.setDecimalPlaces(parameter.getDecimalPlaces());
  this.parameter_.getSubject().addObserver(this);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' :
      super.toString().slice(0, -1)
      + ', parameter_: '+this.parameter_.toStringShort()+'}';
};

/** @override */
disconnect() {
  super.disconnect();
  this.parameter_.getSubject().removeObserver(this);
};

/** @override */
getClassName() {
  return 'NumericControl';
};

/** @override */
getParameter() {
  return this.parameter_;
};

/** @override */
observe(event) {
  if (event == this.parameter_) {
    super.observe(event);
    this.setSignifDigits(this.parameter_.getSignifDigits());
    this.setDecimalPlaces(this.parameter_.getDecimalPlaces());
  }
};

} // end class
exports = NumericControl;
