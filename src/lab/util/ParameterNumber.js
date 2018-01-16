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

goog.module('myphysicslab.lab.util.ParameterNumber');

goog.require('goog.asserts');
const Util = goog.require('myphysicslab.lab.util.Util');
const Parameter = goog.require('myphysicslab.lab.util.Parameter');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const Subject = goog.require('myphysicslab.lab.util.Subject');

/** Provides access to a numeric value of a {@link Subject}. Has options for setting
number of significant digits to show, and upper/lower limit on value. Default is 3
significant digits, lower limit of zero, and upper limit is infinity.
See {@link Parameter} for more information.

See [Internationalization](Building.html#internationalizationi18n) for information
about localized and language-independent strings.
@implements {Parameter}
*/
class ParameterNumber {
/**
@param {!Subject} subject the Subject whose value this ParameterNumber represents
@param {string} name the
    [language-independent name](Building.html#languageindependentnames) of this
    Parameter; the English name can be passed in here because it will be run thru
    {@link Util#toName}.
@param {string} localName the localized name of this Parameter
@param {function(): number} getter A function with no arguments that returns
    the value of this Parameter
@param {function(number)} setter A function with one argument that sets
    the value of this Parameter
@param {!Array<string>=} opt_choices the translated localized strings corresponding to
    the values (optional)
@param {!Array<number>=} opt_values the numbers corresponding to the choices that the
    parameter can be set to (optional). When specified, only these values are allowed.
*/
constructor(subject, name, localName, getter, setter, opt_choices, opt_values) {
  /** the Subject which provides notification of changes in this Parameter
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
  /** A method of Subject with no arguments that returns the value of this Parameter
  @type {function(): number}
  @private
  */
  this.getter_ = getter;
  /** A method of Subject with one argument that sets the value of this Parameter
  @type {function(number)}
  @private
  */
  this.setter_ = setter;
  /**
  @type {boolean}
  @private
  */
  this.isComputed_ = false;
  /**
  @type {number}
  @private
  */
  this.signifDigits_ = 3;
  /** Fixed number of fractional decimal places to show, or –1 if variable.
  @type {number}
  @private
  */
  this.decimalPlaces_ = -1;
  /**
  @type {number}
  @private
  */
  this.lowerLimit_ = 0;
  /**
  @type {number}
  @private
  */
  this.upperLimit_ = Util.POSITIVE_INFINITY;
  /** the translated localized strings corresponding to the values
  @type {!Array<string>}
  @private
  */
  this.choices_ = [];
  /** the integers corresponding to the choices
  @type {!Array<number>}
  @private
  */
  this.values_ = [];
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
      +', lowerLimit_: '+Util.NF(this.lowerLimit_)
      +', upperLimit_: '+Util.NF(this.upperLimit_)
      +', decimalPlaces_: '+this.decimalPlaces_
      +', signifDigits_: '+this.signifDigits_
      +', choices_: ['+this.choices_+']'
      +', values_: ['+this.values_+']'
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'ParameterNumber{name_: "'+this.name_+'"'
      +', value: '+Util.NF(this.getValue())+'}';
};

/** @override */
getAsString() {
  return this.getValue().toString();
};

/** @override */
getChoices() {
  return goog.array.clone(this.choices_);
};

/** Returns the suggested number of decimal places to show or –1 if variable.
@return {number} suggested number of decimal places to show or –1 if variable
*/
getDecimalPlaces() {
  return this.decimalPlaces_;
};

/** Returns the lower limit; the Parameter value is not allowed to be less than this,
{@link #setValue} will throw an Error in that case.
@return {number} the lower limit of the Parameter value
*/
getLowerLimit() {
  return this.lowerLimit_;
};

/** @override */
getName(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** Returns the suggested number of significant digits to show, see
{@link #setSignifDigits}.
@return {number} suggested number of significant digits to show
*/
getSignifDigits() {
  return this.signifDigits_;
};

/** @override */
getSubject() {
  return this.subject_;
};

/** Returns the upper limit; the Parameter value is not allowed to be greater than
this, {@link #setValue} will throw an Error in that case.
@return {number} the upper limit of the Parameter value
*/
getUpperLimit() {
  return this.upperLimit_;
};

/** Returns the value of this ParameterNumber.
@return {number} the value of this ParameterNumber
*/
getValue() {
  return this.getter_();
};

/** @override */
getValues() {
  return goog.array.map(this.values_, function(v) { return v.toString(); });
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
@param {!Array<number>} values  the values corresponding to each choice
@throws {!Error} if `values` is of different length than `choices`
*/
setChoices(choices, values) {
  this.setChoices_(choices, values);
  var evt = new GenericEvent(this.subject_, Parameter.CHOICES_MODIFIED, this);
  this.subject_.broadcast(evt);
};

/**  Sets the choices and values associated with this ParameterNumber.
@param {!Array<string>} choices  localized strings giving name of each choice
@param {!Array<number>} values  the values corresponding to each choice
@private
*/
setChoices_(choices, values) {
  if (values.length !== choices.length) {
    throw new Error('choices and values not same length');
  }
  this.choices_ = choices;
  this.values_ = values;
};

/** @override */
setComputed(value) {
  this.isComputed_ = value;
};

/** Sets suggested number of decimal places to show.
@param {number} decimals suggested number of decimal places to show, or –1 if variable
@return {!ParameterNumber} this Parameter for chaining setters
*/
setDecimalPlaces(decimals) {
  this.decimalPlaces_ = decimals;
  return this;
};

/** @override */
setFromString(value) {
  var v = Number(value);
  if (isNaN(v)) {
    throw new Error('not a number: '+value);
  }
  this.setValue(v);
};

/** Sets the lower limit; the Parameter value is not allowed to be less than this,
{@link #setValue} will throw an Error in that case.
@param {number} lowerLimit the lower limit of the Parameter value
@return {!ParameterNumber} this Parameter for chaining setters
@throws {!Error} if the value is currently less than the lower limit, or the lower limit
    is not a number
*/
setLowerLimit(lowerLimit) {
  if (lowerLimit > this.getValue() || lowerLimit > this.upperLimit_)
    throw new Error('out of range: '+lowerLimit+' value='+this.getValue()
        +' upper='+this.upperLimit_);
  this.lowerLimit_ = lowerLimit;
  return this;
};

/** Sets suggested number of significant digits to show. This affects the number of
decimal places that are displayed. Examples: if significant digits is 3, then we would
show numbers as: 12345, 1234, 123, 12.3, 1.23, 0.123, 0.0123, 0.00123.
@param {number} signifDigits suggested number of significant digits to show
@return {!ParameterNumber} this Parameter for chaining setters
*/
setSignifDigits(signifDigits) {
  this.signifDigits_ = signifDigits;
  return this;
};

/** Sets the upper limit; the Parameter value is not allowed to be more than this,
{@link #setValue} will throw an Error in that case.

@param {number} upperLimit the upper limit of the Parameter value
@return {!ParameterNumber} this Parameter for chaining setters
@throws {!Error} if the value is currently greater than the upper limit, or the upper
    limit is not a number
*/
setUpperLimit(upperLimit) {
  if (upperLimit < this.getValue() || upperLimit < this.lowerLimit_)
    throw new Error('out of range: '+upperLimit+' value='+this.getValue()
        +' lower='+this.lowerLimit_);
  this.upperLimit_ = upperLimit;
  return this;
};

/** Sets the value of this ParameterNumber.
@param {number} value the value to set this ParameterNumber to
*/
setValue(value) {
  if (!goog.isNumber(value)) {
    throw new Error('not a number: '+value);
  }
  if (value < this.lowerLimit_ || value > this.upperLimit_) {
    throw new Error('out of range. '+value+' is not between '+this.lowerLimit_
        +' and '+this.upperLimit_);
  }
  if (this.values_.length > 0) {
    if (!goog.array.contains(this.values_, value)) {
      throw new Error(value+' is not an allowed value among: ['
        +this.values_.join(',')+']');
    }
  }
  if (value !== this.getValue()) {
    this.setter_(value);
  }
};

}
exports = ParameterNumber;
