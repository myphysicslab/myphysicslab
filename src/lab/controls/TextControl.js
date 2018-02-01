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

goog.module('myphysicslab.lab.controls.TextControl');

const TextControlBase = goog.require('myphysicslab.lab.controls.TextControlBase');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A user interface control for displaying and editing the value of a
{@link ParameterString}.

*/
class TextControl extends TextControlBase {
/**
* @param {!ParameterString} parameter the ParameterString to display and edit
* @param {!HTMLInputElement=} textField  the text field to use; if not provided, then
*     a text field is created.
*/
constructor(parameter, textField) {
  super(parameter.getName(/*localized=*/true),
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
  return 'TextControl';
};

/** @override */
getParameter() {
  return this.parameter_;
};

} // end class
exports = TextControl;
