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

goog.provide('myphysicslab.lab.controls.CheckBoxControl');

goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.controls.CheckBoxControlBase');

goog.scope(function() {

var ParameterBoolean = myphysicslab.lab.util.ParameterBoolean;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var CheckBoxControlBase = myphysicslab.lab.controls.CheckBoxControlBase;

/** Creates and manages a checkbox user interface control to synchronize with a
ParameterBoolean.

CheckBoxControl extends CheckBoxControlBase, which is the function-based version that
doesn't take a ParameterBoolean but instead has getter and setter functions.

* @param {!myphysicslab.lab.util.ParameterBoolean} parameter  the ParameterBoolean to
*     synchronize with
* @param {!HTMLInputElement=} checkBox  the check box to use; if not provided, then
*     a check box is created.
* @constructor
* @final
* @struct
* @extends {CheckBoxControlBase}
*/
myphysicslab.lab.controls.CheckBoxControl = function(parameter, checkBox) {
  CheckBoxControlBase.call(this, parameter.getName(/*localized=*/true),
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
var CheckBoxControl = myphysicslab.lab.controls.CheckBoxControl;
goog.inherits(CheckBoxControl, CheckBoxControlBase);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  CheckBoxControl.prototype.toString = function() {
    return CheckBoxControl.superClass_.toString.call(this).slice(0, -1)
        + ', parameter_: '+this.parameter_.toStringShort()+'}';
  };
}

/** @inheritDoc */
CheckBoxControl.prototype.disconnect = function() {
  CheckBoxControl.superClass_.disconnect.call(this);
  this.parameter_.getSubject().removeObserver(this);
};

/** @inheritDoc */
CheckBoxControl.prototype.getClassName = function() {
  return 'CheckBoxControl';
};

/** @inheritDoc */
CheckBoxControl.prototype.getParameter = function() {
  return this.parameter_;
};

/** @inheritDoc */
CheckBoxControl.prototype.observe =  function(event) {
  // only update when this parameter has changed
  if (event == this.parameter_) {
    CheckBoxControl.superClass_.observe.call(this, event);
  }
};

}); // goog.scope
