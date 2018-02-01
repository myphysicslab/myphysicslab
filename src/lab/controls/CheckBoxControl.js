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

goog.module('myphysicslab.lab.controls.CheckBoxControl');

const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const Util = goog.require('myphysicslab.lab.util.Util');
const CheckBoxControlBase = goog.require('myphysicslab.lab.controls.CheckBoxControlBase');

/** A checkbox input element that is synchronized with a {@link ParameterBoolean}.

*/
class CheckBoxControl extends CheckBoxControlBase {
/**
* @param {!myphysicslab.lab.util.ParameterBoolean} parameter  the ParameterBoolean to
*     synchronize with
* @param {!HTMLInputElement=} checkBox  the check box to use; if not provided, then
*     a check box is created.
*/
constructor(parameter, checkBox) {
  super(parameter.getName(/*localized=*/true),
      goog.bind(parameter.getValue, parameter),
      goog.bind(parameter.setValue, parameter),
      checkBox);
  /**
  * @type {!ParameterBoolean}
  * @private
  */
  this.parameter_ = parameter;
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
  return 'CheckBoxControl';
};

/** @override */
getParameter() {
  return this.parameter_;
};

/** @override */
observe(event) {
  // only update when this parameter has changed
  if (event == this.parameter_) {
    super.observe(event);
  }
};

} // end class
exports = CheckBoxControl;
