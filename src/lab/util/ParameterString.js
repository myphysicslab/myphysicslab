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

goog.provide('myphysicslab.lab.util.ParameterString');

goog.require('goog.array');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;
var GenericEvent = myphysicslab.lab.util.GenericEvent;
var Parameter = myphysicslab.lab.util.Parameter;
var Subject = myphysicslab.lab.util.Subject;

/** Provides access to a string value of a {@link Subject}. See {@link Parameter} for
more information.

How to Represent an Enum
------------------------
To create a ParameterString that represents a string enum requires some extra code for
satisfying the compiler about the conversion between string and enum. Here is an example
from {@link myphysicslab.lab.engine2D.ContactSim}:

    new ParameterString(this, RigidBodySim.en.EXTRA_ACCEL,
      RigidBodySim.i18n.EXTRA_ACCEL,
      goog.bind(this.getExtraAccel, this),
      goog.bind(function(s) { this.setExtraAccel(ExtraAccel.stringToEnum(s)); }, this),
      ExtraAccel.getChoices(), ExtraAccel.getValues());

This defines a special setter function because `setExtraAccel` takes an argument
of the enum type `ExtraAccel`, not of type `string`.
See [Enums](Building.html#enums) for more information.

@param {!Subject} subject the Subject whose value this ParameterString represents
@param {string} name the name of this Parameter; this will be underscorized so the
    English name can be passed in here. See {@link UtilityCore#toName}.
@param {string} localName the localized name of this Parameter
@param {function(): string} getter A function with no arguments that returns
    the value of this Parameter
@param {function(string)} setter A function with one argument that sets
    the value of this Parameter
@param {!Array<string>=} opt_choices the translated localized strings corresponding to
    the values (optional)
@param {!Array<string>=} opt_values the language-independent strings that the parameter
    can be set to (optional) When specified, only these values are allowed.
@constructor
@final
@struct
@implements {Parameter}
*/
myphysicslab.lab.util.ParameterString = function(subject, name, localName, getter,
    setter, opt_choices, opt_values) {
  /**
  @type {!Subject}
  @private
  */
  this.subject_ = subject;
  /**
  @type {string}
  @private
  */
  this.name_ = UtilityCore.validName(UtilityCore.toName(name));
  /**
  @type {string}
  @private
  */
  this.localName_ = localName;
  /**
  @type {function(): string}
  @private
  */
  this.getter_ = getter;
  /**
  @type {function(string)}
  @private
  */
  this.setter_ = setter;
  /**
  @type {boolean}
  @private
  */
  this.isComputed_ = false;
  /** suggested length of string for making a control
  @type {number}
  @private
  */
  this.suggestedLength_ = 20;
  /** maximum length of string
  @type {number}
  @private
  */
  this.maxLength_ = UtilityCore.POSITIVE_INFINITY;
  /** the translated localized strings corresponding to the values
  @type {!Array<string>}
  @private
  */
  this.choices_ = [];
  /** the language-independent strings that the parameter can be set to
  @type {!Array<string>}
  @private
  */
  this.values_ = [];
  /**
  @type {?function(string):string}
  @private
  */
  this.inputFunction_ = null;
  if (goog.isDefAndNotNull(opt_choices)) {
    if (goog.isDefAndNotNull(opt_values)) {
      this.setChoices_(opt_choices, opt_values);
    } else {
      throw new Error('values is not defined');
    }
  }
};
var ParameterString = myphysicslab.lab.util.ParameterString;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  ParameterString.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', isComputed_: '+this.isComputed_
        +', subject_: '+this.subject_.toStringShort()
        +', localName_: "'+this.localName_+'"'
        +', suggestedLength_: '+this.suggestedLength_
        +', maxLength_: '+this.maxLength_
        +', choices_: ['+this.choices_+']'
        +', values_: ['+this.values_+']'
        +'}';
  };

  /** @inheritDoc */
  ParameterString.prototype.toStringShort = function() {
    return 'ParameterString{name_: "'+this.name_+'"'
        +', value: "'+this.getValue()+'"}';
  };
};

/** @inheritDoc */
ParameterString.prototype.getAsString = function() {
  return this.getValue();
};

/** @inheritDoc */
ParameterString.prototype.getChoices = function() {
  return goog.array.clone(this.choices_);
};

/** Returns the maximum length of the string.
@return {number} the maximum length of the string
*/
ParameterString.prototype.getMaxLength = function() {
  return this.maxLength_;
};

/** @inheritDoc */
ParameterString.prototype.getName = function(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** @inheritDoc */
ParameterString.prototype.getSubject = function() {
  return this.subject_;
};

/** Returns the suggested length of string when making a control.
@return {number} the suggested length of string when making a control
*/
ParameterString.prototype.getSuggestedLength = function() {
  return this.suggestedLength_;
};

/** Returns the value of this ParameterString.
@return {string} the value of this ParameterString
*/
ParameterString.prototype.getValue = function() {
  return this.getter_();
};

/** @inheritDoc */
ParameterString.prototype.getValues = function() {
  return goog.array.clone(this.values_);
};

/** @inheritDoc */
ParameterString.prototype.isComputed = function() {
  return this.isComputed_;
};

/** @inheritDoc */
ParameterString.prototype.nameEquals = function(name) {
  return this.name_ == UtilityCore.toName(name);
};

/**  Sets the choices and values associated with this Parameter.
@param {!Array<string>} choices  localized strings giving name of each choice
@param {!Array<string>} values  the values corresponding to each choice
@throws {Error} if `values` is of different length than `choices`
*/
ParameterString.prototype.setChoices = function(choices, values) {
  this.setChoices_(choices, values);
  var evt = new GenericEvent(this.subject_, Parameter.CHOICES_MODIFIED, this);
  this.subject_.broadcast(evt);
};

/** Sets the choices and values associated with this ParameterString.
@param {!Array<string>} choices  localized strings giving name of each choice
@param {!Array<string>} values  the values corresponding to each choice
@private
*/
ParameterString.prototype.setChoices_ = function(choices, values) {
  this.choices_ = choices;
  if (values.length !== choices.length) {
    throw new Error('different lengths choices:'+choices+' values:'+values);
  }
  this.values_ = values;
};

/** @inheritDoc */
ParameterString.prototype.setComputed = function(value) {
  this.isComputed_ = value;
};

/** @inheritDoc */
ParameterString.prototype.setFromString = function(value) {
  this.setValue(value);
};

/** Set a function which transforms the input string passed to {@link #setValue}.
For example, a function to transform strings to uppercase.
@param {?function(string):string} inputFunction function to be used to transform
    input passed to {@link #setValue}
@return {!ParameterString} this Parameter for chaining setters
*/
ParameterString.prototype.setInputFunction = function(inputFunction) {
  this.inputFunction_ = inputFunction;
  return this;
};

/** Sets the maximum length of the string.
@param {number} len the maximum length of the string
@return {!ParameterString} this Parameter for chaining setters
@throws {Error} if the max length is less than length of current value of this
    parameter.
*/
ParameterString.prototype.setMaxLength = function(len) {
  if (len < this.getValue().length)
    throw new Error('too long');
  this.maxLength_ = len;
  return this;
};

/** Sets the suggested length of string when making a control. This affects for example
the size of a control that displays and alters this parameter.
@param {number} len suggested length of string to show
@return {!ParameterString} this Parameter for chaining setters
*/
ParameterString.prototype.setSuggestedLength = function(len) {
  this.suggestedLength_ = len;
  return this;
};

/** Sets the value of this ParameterString.
@param {string} value the value to set this ParameterString to
*/
ParameterString.prototype.setValue = function(value) {
  if (this.inputFunction_ != null) {
    value = this.inputFunction_(value);
  }
  if (!goog.isString(value)) {
    throw new Error('non-string value: '+value);
  }
  if (value.length > this.maxLength_) {
    throw new Error('string too long: '+value+' maxLength='+this.maxLength_);
  }
  if (this.values_.length > 0) {
    if (!goog.array.contains(this.values_, value)) {
      throw new Error('"'+value+'" is not an allowed value among: ['
        +this.values_.join(',')+']');
    }
  }
  if (value !== this.getValue()) {
    this.setter_(value);
  }
};

}); // goog.scope
