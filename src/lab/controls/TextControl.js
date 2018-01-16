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

goog.provide('myphysicslab.lab.controls.TextControl');

goog.require('myphysicslab.lab.controls.TextControlBase');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var TextControlBase = myphysicslab.lab.controls.TextControlBase;
var ParameterString = myphysicslab.lab.util.ParameterString;
var Util = goog.module.get('myphysicslab.lab.util.Util');

/** A user interface control for displaying and editing the value of a
{@link ParameterString}.

* @param {!ParameterString} parameter the ParameterString to display and edit
* @param {!HTMLInputElement=} textField  the text field to use; if not provided, then
*     a text field is created.
* @constructor
* @final
* @struct
* @extends {TextControlBase}
*/
myphysicslab.lab.controls.TextControl = function(parameter, textField) {
  TextControlBase.call(this, parameter.getName(/*localized=*/true),
      goog.bind(parameter.getValue, parameter),
      goog.bind(parameter.setValue, parameter),
      textField);
  /**
  * @type {!ParameterString}
  * @private
  */
  this.parameter_ = parameter;
  this.setColumns(this.parameter_.getSuggestedLength());
  this.parameter_.getSubject().addObserver(this);
};
var TextControl = myphysicslab.lab.controls.TextControl;
goog.inherits(TextControl, TextControlBase);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  TextControl.prototype.toString = function() {
    return TextControl.superClass_.toString.call(this).slice(0, -1)
        + ', parameter_: '+this.parameter_.toStringShort()+'}';
  };
}

/** @inheritDoc */
TextControl.prototype.disconnect = function() {
  TextControl.superClass_.disconnect.call(this);
  this.parameter_.getSubject().removeObserver(this);
};

/** @inheritDoc */
TextControl.prototype.getClassName = function() {
  return 'TextControl';
};

/** @inheritDoc */
TextControl.prototype.getParameter = function() {
  return this.parameter_;
};

}); // goog.scope
