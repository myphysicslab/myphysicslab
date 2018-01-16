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

goog.module('myphysicslab.lab.util.ParameterString');

goog.require('goog.array');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const Parameter = goog.require('myphysicslab.lab.util.Parameter');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Provides access to a string value of a {@link Subject}. See {@link Parameter} for
more information.

See [Internationalization](Building.html#internationalizationi18n) for information
about localized and language-independent strings.

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

@implements {Parameter}
*/
class ParameterString {
/**
@param {!Subject} subject the Subject whose value this ParameterString represents
@param {string} name the
    [language-independent name](Building.html#languageindependentnames) of this
    Parameter; the English name can be passed in here because it will be run thru
    {@link Util#toName}.
@param {string} localName the localized name of this Parameter
@param {function(): string} getter A function with no arguments that returns
    the value of this Parameter
@param {function(string)} setter A function with one argument that sets
    the value of this Parameter
@param {!Array<string>=} opt_choices the translated localized strings corresponding to
    the values (optional)
@param {!Array<string>=} opt_values the language-independent strings that the parameter
    can be set to (optional) When specified, only these values are allowed.
*/
constructor(subject, name, localName, getter, setter, opt_choices, opt_values) {
  /**
  @type {!Subject}
  @private
  */
  this.subject_ = subject;
  /**
  @type {string}
  @private
  */
  this.name_ = Util.validName(Util.toName(name));
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
  this.maxLength_ = Util.POSITIVE_INFINITY;
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

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', isComputed_: '+this.isComputed_
      +', subject_: '+this.subject_.toStringShort()
      +', localName_: "'+this.localName_+'"'
      +', suggestedLength_: '+this.suggestedLength_
      +', maxLength_: '+this.maxLength_
      +', choices_: ['+this.choices_+']'
      +', values_: ['+this.values_+']'
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'ParameterString{name_: "'+this.name_+'"'
      +', value: "'+this.getValue()+'"}';
};

/** @override */
getAsString() {
  return this.getValue();
};

/** @override */
getChoices() {
  return goog.array.clone(this.choices_);
};

/** Returns the maximum length of the string. {@link #setValue} will throw an Error if
trying to set a string longer than this.
@return {number} the maximum length of the string
*/
getMaxLength() {
  return this.maxLength_;
};

/** @override */
getName(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** @override */
getSubject() {
  return this.subject_;
};

/** Returns the suggested length of string when making a user interface control.
@return {number} the suggested length of string when making a control
*/
getSuggestedLength() {
  return this.suggestedLength_;
};

/** Returns the value of this ParameterString.
@return {string} the value of this ParameterString
*/
getValue() {
  return this.getter_();
};

/** @override */
getValues() {
  return goog.array.clone(this.values_);
};

/** @override */
isComputed() {
  return this.isComputed_;
};

/** @override */
nameEquals(name) {
  return this.name_ == Util.toName(name);
};

/**  Sets the choices and values associated with this Parameter.
See [Internationalization](Building.html#internationalizationi18n).
@param {!Array<string>} choices  localized strings giving name of each choice
@param {!Array<string>} values  the values corresponding to each choice
@throws {!Error} if `values` is of different length than `choices`
*/
setChoices(choices, values) {
  this.setChoices_(choices, values);
  var evt = new GenericEvent(this.subject_, Parameter.CHOICES_MODIFIED, this);
  this.subject_.broadcast(evt);
};

/** Sets the choices and values associated with this ParameterString.
@param {!Array<string>} choices  localized strings giving name of each choice
@param {!Array<string>} values  the values corresponding to each choice
@private
*/
setChoices_(choices, values) {
  this.choices_ = choices;
  if (values.length !== choices.length) {
    throw new Error('different lengths choices:'+choices+' values:'+values);
  }
  this.values_ = values;
};

/** @override */
setComputed(value) {
  this.isComputed_ = value;
};

/** @override */
setFromString(value) {
  this.setValue(value);
};

/** Set a function which transforms the input string passed to {@link #setValue}.
For example, a function to transform strings to uppercase.
@param {?function(string):string} inputFunction function to be used to transform
    input passed to {@link #setValue}
@return {!ParameterString} this Parameter for chaining setters
*/
setInputFunction(inputFunction) {
  this.inputFunction_ = inputFunction;
  return this;
};

/** Sets the maximum length of the string. {@link #setValue} will throw an Error if
trying to set a string longer than this.
@param {number} len the maximum length of the string
@return {!ParameterString} this Parameter for chaining setters
@throws {!Error} if the max length is less than length of current value of this
    Parameter.
*/
setMaxLength(len) {
  if (len < this.getValue().length)
    throw new Error('too long');
  this.maxLength_ = len;
  return this;
};

/** Sets the suggested length of string when making a user interface control.
@param {number} len suggested length of string to show
@return {!ParameterString} this Parameter for chaining setters
*/
setSuggestedLength(len) {
  this.suggestedLength_ = len;
  return this;
};

/** Sets the value of this ParameterString.
@param {string} value the value to set this ParameterString to
*/
setValue(value) {
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

}
exports = ParameterString;
